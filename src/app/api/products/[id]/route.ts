import { NextRequest, NextResponse } from 'next/server'
import { allOils } from '@/data/products'

// 統一回應格式
function successResponse(data: any, message: string = '操作成功') {
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

// GET /api/products/[id] - 獲取單一產品
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return errorResponse('產品 ID 不能為空', 400)
    }

    const product = allOils.find(oil => oil.id === id)

    if (!product) {
      return errorResponse('找不到指定的產品', 404)
    }

    return successResponse(product, '獲取產品詳情成功')

  } catch (error) {
    console.error('獲取產品詳情失敗:', error)
    return errorResponse('獲取產品詳情失敗', 500)
  }
}

// PUT /api/products/[id] - 更新產品（預留）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!id) {
      return errorResponse('產品 ID 不能為空', 400)
    }

    const product = allOils.find(oil => oil.id === id)

    if (!product) {
      return errorResponse('找不到指定的產品', 404)
    }

    // 在實際應用中，這裡會更新資料庫中的產品資訊
    // 目前只是模擬回應
    const updatedProduct = { ...product, ...body }
    
    console.log('更新產品:', updatedProduct)

    return successResponse(updatedProduct, '產品更新成功')

  } catch (error) {
    console.error('更新產品失敗:', error)
    return errorResponse('更新產品失敗', 500)
  }
}

// DELETE /api/products/[id] - 刪除產品（預留）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return errorResponse('產品 ID 不能為空', 400)
    }

    const product = allOils.find(oil => oil.id === id)

    if (!product) {
      return errorResponse('找不到指定的產品', 404)
    }

    // 在實際應用中，這裡會從資料庫中刪除產品
    // 目前只是模擬回應
    console.log('刪除產品:', product)

    return successResponse({ id }, '產品刪除成功')

  } catch (error) {
    console.error('刪除產品失敗:', error)
    return errorResponse('刪除產品失敗', 500)
  }
}