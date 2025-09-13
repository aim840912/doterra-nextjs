import { NextRequest, NextResponse } from 'next/server'
import { allOils } from '@/data/products'
import { Oil } from '@/types/oil'
import { favoritesStorage } from '@/lib/favorites-storage'

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

// 獲取用戶 ID（簡化版，實際應用中會從 JWT token 或 session 獲取）
function getUserId(request: NextRequest): string {
  const userId = request.headers.get('x-user-id') || request.cookies.get('user_id')?.value
  return userId || 'anonymous'
}

// GET /api/favorites - 獲取用戶收藏列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const includeDetails = searchParams.get('includeDetails') === 'true'
    
    const userId = getUserId(request)
    const favoriteIds = favoritesStorage.getFavorites(userId)

    if (!includeDetails) {
      // 只返回收藏的產品 ID 列表
      const total = favoriteIds.length
      const offset = (page - 1) * limit
      const paginatedIds = favoriteIds.slice(offset, offset + limit)
      
      return successResponse(paginatedIds, '獲取收藏列表成功', {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: offset + limit < total,
          hasPrev: page > 1
        }
      })
    }

    // 返回完整的產品詳情
    const favoriteProducts = favoriteIds
      .map(id => allOils.find(oil => oil.id === id))
      .filter((oil): oil is Oil => oil !== undefined)

    const total = favoriteProducts.length
    const offset = (page - 1) * limit
    const paginatedProducts = favoriteProducts.slice(offset, offset + limit)

    return successResponse(paginatedProducts, '獲取收藏詳情成功', {
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: offset + limit < total,
        hasPrev: page > 1
      },
      stats: {
        totalFavorites: total,
        totalAvailableProducts: allOils.length
      }
    })

  } catch (error) {
    console.error('獲取收藏列表失敗:', error)
    return errorResponse('獲取收藏列表失敗', 500)
  }
}

// POST /api/favorites - 添加產品到收藏
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId } = body

    if (!productId) {
      return errorResponse('產品 ID 不能為空', 400)
    }

    // 檢查產品是否存在
    const product = allOils.find(oil => oil.id === productId)
    if (!product) {
      return errorResponse('產品不存在', 404)
    }

    const userId = getUserId(request)

    // 檢查是否已經收藏
    if (favoritesStorage.isFavorited(userId, productId)) {
      return errorResponse('產品已在收藏列表中', 409, { productId })
    }

    // 添加到收藏
    favoritesStorage.addFavorite(userId, productId)

    return successResponse({
      productId,
      product: {
        id: product.id,
        name: product.name,
        imageUrl: product.imageUrl
      },
      totalFavorites: favoritesStorage.getFavoriteCount(userId)
    }, '產品已添加到收藏')

  } catch (error) {
    console.error('添加收藏失敗:', error)
    return errorResponse('添加收藏失敗', 500)
  }
}

// DELETE /api/favorites - 批量刪除收藏或清空收藏列表
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clearAll = searchParams.get('clearAll') === 'true'
    
    const userId = getUserId(request)

    if (clearAll) {
      // 清空所有收藏
      const removedCount = favoritesStorage.clearFavorites(userId)
      
      return successResponse({
        removedCount,
        totalFavorites: 0
      }, '已清空所有收藏')
    }

    // 批量刪除指定產品
    const body = await request.json()
    const { productIds } = body

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return errorResponse('產品 ID 列表不能為空', 400)
    }

    const currentFavorites = favoritesStorage.getFavorites(userId)
    const removedIds: string[] = []
    
    productIds.forEach(productId => {
      if (favoritesStorage.removeFavorite(userId, productId)) {
        removedIds.push(productId)
      }
    })

    return successResponse({
      removedIds,
      removedCount: removedIds.length,
      totalFavorites: favoritesStorage.getFavoriteCount(userId)
    }, `已移除 ${removedIds.length} 個收藏產品`)

  } catch (error) {
    console.error('刪除收藏失敗:', error)
    return errorResponse('刪除收藏失敗', 500)
  }
}