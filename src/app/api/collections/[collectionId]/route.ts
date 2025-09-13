import { NextRequest, NextResponse } from 'next/server'
import { allOils } from '@/data/products'

// 統一回應格式
function successResponse(data: any, message: string = '操作成功', meta?: any) {
  return NextResponse.json({
    success: true,
    message,
    data,
    ...(meta && { meta })
  })
}

function errorResponse(message: string, status: number = 400, details?: any) {
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

// GET /api/collections/[collectionId] - 獲取單一產品系列及其產品
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  try {
    const { collectionId } = await params
    const { searchParams } = new URL(request.url)
    
    if (!collectionId) {
      return errorResponse('系列 ID 不能為空', 400)
    }

    // 分頁參數
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const includeProducts = searchParams.get('includeProducts') !== 'false' // 預設包含產品

    // 檢查系列是否存在
    const collectionName = collectionLabels[collectionId]
    if (!collectionName) {
      // 如果不在預定義列表中，檢查是否有產品使用這個系列
      const hasProducts = allOils.some(oil => 
        oil.collections && oil.collections.includes(collectionId)
      )
      
      if (!hasProducts) {
        return errorResponse('找不到指定的產品系列', 404)
      }
    }

    // 獲取該系列的所有產品
    const collectionProducts = allOils.filter(oil => 
      oil.collections && oil.collections.includes(collectionId)
    )

    // 依類別分組產品
    const productsByCategory = collectionProducts.reduce((acc, product) => {
      const category = product.category || 'others'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(product)
      return acc
    }, {} as Record<string, typeof allOils>)

    // 構建系列資料
    const collection = {
      id: collectionId,
      name: collectionName || collectionId,
      slug: collectionId,
      productCount: collectionProducts.length,
      categories: Object.keys(productsByCategory).map(category => ({
        id: category,
        productCount: productsByCategory[category].length
      }))
    }

    let responseData: any = collection

    if (includeProducts) {
      // 分頁處理產品
      const result = paginate(collectionProducts, page, limit)
      
      responseData = {
        ...collection,
        products: result.data.map(product => ({
          id: product.id,
          name: product.name,
          englishName: product.englishName,
          description: product.description,
          imageUrl: product.imageUrl,
          category: product.category,
          volume: product.volume,
          retailPrice: product.retailPrice,
          memberPrice: product.memberPrice,
          pvPoints: product.pvPoints,
          mainBenefits: product.mainBenefits,
          aromaDescription: product.aromaDescription
        }))
      }

      return successResponse(responseData, '獲取產品系列詳情成功', result.pagination)
    }

    return successResponse(responseData, '獲取產品系列資訊成功')

  } catch (error) {
    console.error('獲取產品系列詳情失敗:', error)
    return errorResponse('獲取產品系列詳情失敗', 500)
  }
}

// PUT /api/collections/[collectionId] - 更新產品系列（預留功能）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  try {
    const { collectionId } = await params
    const body = await request.json()

    if (!collectionId) {
      return errorResponse('系列 ID 不能為空', 400)
    }

    // 檢查系列是否存在
    const collectionName = collectionLabels[collectionId]
    if (!collectionName) {
      return errorResponse('找不到指定的產品系列', 404)
    }

    // 在實際應用中，這裡會更新資料庫中的系列資訊
    const updatedCollection = {
      id: collectionId,
      name: body.name || collectionName,
      slug: collectionId,
      updatedAt: new Date().toISOString(),
      ...body
    }

    console.log('更新產品系列:', updatedCollection)

    return successResponse(updatedCollection, '產品系列更新成功')

  } catch (error) {
    console.error('更新產品系列失敗:', error)
    return errorResponse('更新產品系列失敗', 500)
  }
}

// DELETE /api/collections/[collectionId] - 刪除產品系列（預留功能）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  try {
    const { collectionId } = await params

    if (!collectionId) {
      return errorResponse('系列 ID 不能為空', 400)
    }

    // 檢查系列是否存在
    const collectionName = collectionLabels[collectionId]
    if (!collectionName) {
      return errorResponse('找不到指定的產品系列', 404)
    }

    // 檢查是否有產品使用此系列
    const productsInCollection = allOils.filter(oil => 
      oil.collections && oil.collections.includes(collectionId)
    )

    if (productsInCollection.length > 0) {
      return errorResponse(
        `無法刪除系列，仍有 ${productsInCollection.length} 個產品屬於此系列`,
        409,
        { 
          productCount: productsInCollection.length,
          productIds: productsInCollection.map(p => p.id)
        }
      )
    }

    // 在實際應用中，這裡會從資料庫中刪除系列
    console.log('刪除產品系列:', collectionId)

    return successResponse({ id: collectionId }, '產品系列刪除成功')

  } catch (error) {
    console.error('刪除產品系列失敗:', error)
    return errorResponse('刪除產品系列失敗', 500)
  }
}