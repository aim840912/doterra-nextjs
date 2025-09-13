import { NextRequest, NextResponse } from 'next/server'
import { allOils } from '@/data/products'
import { favoritesStorage } from '@/lib/favorites-storage'

// 統一回應格式
function successResponse<T = unknown>(data: T, message: string = '操作成功') {
  return NextResponse.json({
    success: true,
    message,
    data
  })
}

function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({
    success: false,
    error: message
  }, { status })
}

// 獲取用戶 ID
function getUserId(request: NextRequest): string {
  const userId = request.headers.get('x-user-id') || request.cookies.get('user_id')?.value
  return userId || 'anonymous'
}

// GET /api/favorites/[productId] - 檢查產品是否已收藏
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params
    
    if (!productId) {
      return errorResponse('產品 ID 不能為空', 400)
    }

    const userId = getUserId(request)
    const isFavorited = favoritesStorage.isFavorited(userId, productId)

    // 獲取產品基本資訊
    const product = allOils.find(oil => oil.id === productId)
    if (!product) {
      return errorResponse('產品不存在', 404)
    }

    return successResponse({
      productId,
      isFavorited,
      product: {
        id: product.id,
        name: product.name,
        imageUrl: product.imageUrl
      },
      favoriteCount: favoritesStorage.getFavoriteCount(userId)
    }, '獲取收藏狀態成功')

  } catch (error) {
    // API 錯誤已移除: '檢查收藏狀態失敗:', error
    return errorResponse('檢查收藏狀態失敗', 500)
  }
}

// PUT /api/favorites/[productId] - 切換產品收藏狀態
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params
    
    if (!productId) {
      return errorResponse('產品 ID 不能為空', 400)
    }

    // 檢查產品是否存在
    const product = allOils.find(oil => oil.id === productId)
    if (!product) {
      return errorResponse('產品不存在', 404)
    }

    const userId = getUserId(request)
    const { action, isFavorited: newIsFavorited } = favoritesStorage.toggleFavorite(userId, productId)

    return successResponse({
      productId,
      action,
      isFavorited: newIsFavorited,
      product: {
        id: product.id,
        name: product.name,
        imageUrl: product.imageUrl
      },
      totalFavorites: favoritesStorage.getFavoriteCount(userId)
    }, `產品已${action === 'added' ? '添加到' : '移除自'}收藏`)

  } catch (error) {
    // API 錯誤已移除: '切換收藏狀態失敗:', error
    return errorResponse('切換收藏狀態失敗', 500)
  }
}

// DELETE /api/favorites/[productId] - 移除產品收藏
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params
    
    if (!productId) {
      return errorResponse('產品 ID 不能為空', 400)
    }

    const userId = getUserId(request)

    if (!favoritesStorage.isFavorited(userId, productId)) {
      return errorResponse('產品不在收藏列表中', 404)
    }

    favoritesStorage.removeFavorite(userId, productId)

    // 獲取產品基本資訊
    const product = allOils.find(oil => oil.id === productId)

    return successResponse({
      productId,
      product: product ? {
        id: product.id,
        name: product.name,
        imageUrl: product.imageUrl
      } : null,
      totalFavorites: favoritesStorage.getFavoriteCount(userId)
    }, '產品已移除收藏')

  } catch (error) {
    // API 錯誤已移除: '移除收藏失敗:', error
    return errorResponse('移除收藏失敗', 500)
  }
}