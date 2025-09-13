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

function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({
    success: false,
    error: message
  }, { status })
}

// 類別標籤映射
const categoryLabels: Record<string, string> = {
  'single-oils': '單方精油',
  'proprietary-blends': '複方精油',
  'skincare': '護膚產品',
  'wellness': '健康產品',
  'supplements': '營養補充',
  'accessories': '配件用品',
  'breathe-collection': 'Breathe 系列',
  'onguard-collection': 'OnGuard 系列',
  'deep-blue-collection': 'Deep Blue 系列'
}

// GET /api/products/categories - 獲取所有產品類別
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeCount = searchParams.get('includeCount') === 'true'

    // 獲取所有獨特類別
    const uniqueCategories = [...new Set(allOils.map(oil => oil.category))]
    
    // 構建類別資料
    const categories = uniqueCategories.map(category => {
      const label = categoryLabels[category] || category
      const data: { id: string; name: string; slug: string; count?: number } = {
        id: category,
        name: label,
        slug: category
      }

      // 如果需要包含產品數量
      if (includeCount) {
        data.count = allOils.filter(oil => oil.category === category).length
      }

      return data
    })

    // 按名稱排序
    categories.sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'))

    const stats = {
      totalCategories: categories.length,
      totalProducts: allOils.length
    }

    return successResponse(categories, '獲取產品類別成功', stats)

  } catch (error) {
    console.error('獲取產品類別失敗:', error)
    return errorResponse('獲取產品類別失敗', 500)
  }
}