import { NextRequest, NextResponse } from 'next/server'
import { Product } from '@/types/product'
import { allProducts } from '@/data/products'

// 獲取所有產品
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: allProducts,
      count: allProducts.length
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '獲取產品列表失敗' },
      { status: 500 }
    )
  }
}

// 新增產品
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 驗證必填欄位
    const requiredFields = ['name', 'category', 'imageUrl']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} 是必填欄位` },
          { status: 400 }
        )
      }
    }

    // 生成產品 ID
    const id = body.name.toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // 檢查 ID 是否已存在
    if (allProducts.some(product => product.id === id)) {
      return NextResponse.json(
        { success: false, error: '產品名稱已存在，請使用不同的名稱' },
        { status: 400 }
      )
    }

    // 創建新產品
    const newProduct: Product = {
      id,
      name: body.name,
      englishName: body.englishName || '',
      description: body.description || '',
      benefits: body.benefits || [],
      category: body.category,
      volume: body.volume || '',
      imageUrl: body.imageUrl,
      inStock: true, // 預設為有庫存
      usageInstructions: body.usageInstructions || '',
      ingredients: body.ingredients || [],
      tags: body.tags || []
    }

    // 在實際應用中，這裡會將產品儲存到資料庫
    // 目前我們只是模擬成功回應
    console.log('新增產品:', newProduct)

    return NextResponse.json({
      success: true,
      data: newProduct,
      message: '產品新增成功'
    }, { status: 201 })

  } catch (error) {
    console.error('新增產品錯誤:', error)
    return NextResponse.json(
      { success: false, error: '新增產品失敗' },
      { status: 500 }
    )
  }
}