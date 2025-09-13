import { NextRequest, NextResponse } from 'next/server'
import { allOils } from '@/data/products'
import { Oil } from '@/types/oil'

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

// GET /api/products - 獲取所有產品（支援分頁和篩選）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // 分頁參數
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    
    // 篩選參數
    const category = searchParams.get('category')
    const collection = searchParams.get('collection')
    const featured = searchParams.get('featured') === 'true'
    
    let filteredOils = [...allOils]

    // 類別篩選
    if (category && category !== 'all') {
      filteredOils = filteredOils.filter(oil => oil.category === category)
    }

    // 系列篩選
    if (collection && collection !== 'all') {
      filteredOils = filteredOils.filter(oil => 
        oil.collections && oil.collections.includes(collection)
      )
    }

    // 熱門產品篩選（這裡可以根據業務邏輯定義）
    if (featured) {
      // 假設有 featured 欄位或者根據收藏數等邏輯
      // filteredOils = filteredOils.filter(oil => oil.featured)
    }

    // 排序（按名稱）
    filteredOils.sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'))

    // 分頁
    const result = paginate(filteredOils, page, limit)

    return successResponse(result.data, '獲取產品列表成功', result.pagination)

  } catch (error) {
    console.error('獲取產品列表失敗:', error)
    return errorResponse('獲取產品列表失敗', 500)
  }
}

// POST /api/products - 創建新產品（預留，目前使用 JSON 資料）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 基本驗證
    const requiredFields = ['name', 'category', 'imageUrl']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return errorResponse(
        `缺少必填欄位: ${missingFields.join(', ')}`, 
        400,
        { missingFields }
      )
    }

    // 生成產品 ID
    const id = `doterra-${Date.now()}-${body.name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')}`

    // 檢查 ID 是否已存在
    if (allOils.some(oil => oil.id === id)) {
      return errorResponse('產品 ID 已存在，請使用不同的名稱', 409)
    }

    // 創建新產品
    const newProduct: Oil = {
      id,
      name: body.name,
      englishName: body.englishName || '',
      description: body.description || '',
      mainBenefits: body.mainBenefits || [],
      category: body.category,
      volume: body.volume || '',
      imageUrl: body.imageUrl,
      usageInstructions: body.usageInstructions || [],
      tags: body.tags || [],
      collections: body.collections || [],
      // 其他可選欄位
      productIntroduction: body.productIntroduction || '',
      applicationGuide: body.applicationGuide || '',
      cautions: body.cautions || [],
      aromaDescription: body.aromaDescription || '',
      extractionMethod: body.extractionMethod || '',
      plantPart: body.plantPart || '',
      mainIngredients: body.mainIngredients || [],
      url: body.url || '',
      productCode: body.productCode || '',
      retailPrice: body.retailPrice || 0,
      memberPrice: body.memberPrice || 0,
      pvPoints: body.pvPoints || 0
    }

    // 注意：在實際應用中，這裡需要將產品保存到資料庫
    // 目前只是模擬回應
    console.log('創建新產品:', newProduct)

    return successResponse(newProduct, '產品創建成功', { id })

  } catch (error) {
    console.error('創建產品失敗:', error)
    return errorResponse('創建產品失敗', 500)
  }
}