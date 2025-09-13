import { NextRequest, NextResponse } from 'next/server'
import { allOils } from '@/data/products'

// 統一回應格式
function successResponse<T = unknown>(data: T, message: string = '操作成功', meta?: Record<string, unknown>) {
  return NextResponse.json({
    success: true,
    message,
    data,
    ...(meta && { meta })
  })
}

function errorResponse(message: string, status: number = 400, details?: Record<string, unknown>) {
  return NextResponse.json({
    success: false,
    error: message,
    ...(details && { details })
  }, { status })
}

// 產品系列標籤映射
const collectionLabels: Record<string, string> = {
  'breathe-collection': 'Breathe 系列',
  'onguard-collection': 'OnGuard 系列',
  'deep-blue-collection': 'Deep Blue 系列',
  'serenity-collection': 'Serenity 系列',
  'citrus-collection': '柑橘系列',
  'floral-collection': '花香系列',
  'woody-collection': '木質系列',
  'herbal-collection': '草本系列',
  'spice-collection': '香料系列'
}

// 分頁工具函數
function paginate<T>(items: T[], page: number, limit: number) {
  const offset = (page - 1) * limit
  const paginatedItems = items.slice(offset, offset + limit)
  
  return {
    data: paginatedItems,
    pagination: {
      page,
      limit,
      total: items.length,
      totalPages: Math.ceil(items.length / limit),
      hasNext: offset + limit < items.length,
      hasPrev: page > 1
    }
  }
}

// GET /api/collections - 獲取所有產品系列
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const includeCount = searchParams.get('includeCount') === 'true'
    const includeProducts = searchParams.get('includeProducts') === 'true'

    // 獲取所有包含系列資訊的產品
    const productsWithCollections = allOils.filter(oil => 
      oil.collections && oil.collections.length > 0
    )

    // 提取所有獨特的系列
    const allCollectionIds = new Set<string>()
    productsWithCollections.forEach(oil => {
      oil.collections?.forEach(collection => {
        allCollectionIds.add(collection)
      })
    })

    // 構建系列資料
    const collections = Array.from(allCollectionIds).map(collectionId => {
      const label = collectionLabels[collectionId] || collectionId
      const collectionProducts = productsWithCollections.filter(oil => 
        oil.collections?.includes(collectionId)
      )

      const data: { id: string; name: string; slug: string; productCount?: number; products?: unknown[] } = {
        id: collectionId,
        name: label,
        slug: collectionId
      }

      // 如果需要包含產品數量
      if (includeCount) {
        data.productCount = collectionProducts.length
      }

      // 如果需要包含產品列表
      if (includeProducts) {
        data.products = collectionProducts.map(product => ({
          id: product.id,
          name: product.name,
          englishName: product.englishName,
          imageUrl: product.imageUrl,
          category: product.category,
          volume: product.volume,
          retailPrice: product.retailPrice,
          memberPrice: product.memberPrice
        }))
      }

      return data
    })

    // 按名稱排序
    collections.sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'))

    // 分頁
    const result = paginate(collections, page, limit)

    const stats = {
      totalCollections: collections.length,
      totalProductsWithCollections: productsWithCollections.length,
      totalProducts: allOils.length,
      collectionsWithProducts: collections.filter(c => includeCount ? (c.productCount ?? 0) > 0 : true).length
    }

    return successResponse(result.data, '獲取產品系列成功', {
      ...result.pagination,
      stats
    })

  } catch (error) {
    console.error('獲取產品系列失敗:', error)
    return errorResponse('獲取產品系列失敗', 500)
  }
}

// POST /api/collections - 創建新產品系列（預留功能）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 基本驗證
    const requiredFields = ['id', 'name']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return errorResponse(
        `缺少必填欄位: ${missingFields.join(', ')}`, 
        400,
        { missingFields }
      )
    }

    // 檢查系列 ID 是否已存在
    if (collectionLabels[body.id]) {
      return errorResponse('系列 ID 已存在，請使用不同的 ID', 409)
    }

    // 創建新系列（目前只是模擬，實際需要更新資料庫）
    const newCollection = {
      id: body.id,
      name: body.name,
      slug: body.id,
      productCount: 0,
      products: [],
      createdAt: new Date().toISOString()
    }

    // 注意：在實際應用中，這裡需要將系列保存到資料庫
    console.log('創建新產品系列:', newCollection)

    return successResponse(newCollection, '產品系列創建成功', { id: body.id })

  } catch (error) {
    console.error('創建產品系列失敗:', error)
    return errorResponse('創建產品系列失敗', 500)
  }
}