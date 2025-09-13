import { NextRequest, NextResponse } from 'next/server'
import { Oil } from '@/types/oil'
import { allOils } from '@/data/products'

// 獲取所有精油
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: allOils,
      count: allOils.length
    })
  } catch (error) {
    // API 錯誤已移除: '獲取精油列表失敗:', error
    return NextResponse.json(
      { success: false, error: '獲取精油列表失敗' },
      { status: 500 }
    )
  }
}

// 新增精油
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

    // 生成精油 ID
    const id = body.name.toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // 檢查 ID 是否已存在
    if (allOils.some(oil => oil.id === id)) {
      return NextResponse.json(
        { success: false, error: '精油名稱已存在，請使用不同的名稱' },
        { status: 400 }
      )
    }

    // 創建新精油
    const newOil: Oil = {
      id,
      name: body.name,
      englishName: body.englishName || '',
      description: body.description || '',
      benefits: body.benefits || [],
      category: body.category,
      volume: body.volume || '',
      imageUrl: body.imageUrl,
      usageInstructions: body.usageInstructions || '',
      tags: body.tags || []
    }

    // 在實際應用中，這裡會將精油儲存到資料庫
    // 目前我們只是模擬成功回應
    // API 日誌已移除: '新增精油:', newOil

    return NextResponse.json({
      success: true,
      data: newOil,
      message: '精油新增成功'
    }, { status: 201 })

  } catch (error) {
    // API 錯誤已移除: '新增精油錯誤:', error
    return NextResponse.json(
      { success: false, error: '新增精油失敗' },
      { status: 500 }
    )
  }
}