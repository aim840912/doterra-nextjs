import { NextRequest, NextResponse } from 'next/server'
import { allOils } from '@/data/products'

// 預定義熱門搜尋詞
const POPULAR_SEARCHES = [
  '薰衣草', '薄荷', '茶樹', '乳香', '檸檬',
  '尤加利', '迷迭香', '甜橙', '佛手柑', '天竺葵',
  '放鬆', '舒緩', '提神', '淨化', '平衡'
]

// 類別標籤映射
const CATEGORY_KEYWORDS = {
  'single-oils': ['單方', '純精油', '基礎精油'],
  'proprietary-blends': ['複方', '調和', '混合'],
  'onguard': ['保衛', '防護', '免疫'],
  'deep-blue': ['舒緩', '深藍', '運動'],
  'breathe': ['呼吸', '順暢', '清新'],
  'food': ['食用', '料理', '調味']
}

// 生成智能建議
function generateSmartSuggestions(query: string, limit: number = 8): string[] {
  if (!query || query.length < 1) {
    return POPULAR_SEARCHES.slice(0, limit)
  }

  const suggestions = new Set<string>()
  const lowerQuery = query.toLowerCase()

  // 1. 完全匹配的產品名稱
  allOils.forEach(oil => {
    if (oil.name.toLowerCase().includes(lowerQuery)) {
      suggestions.add(oil.name)
    }
    if (oil.englishName && oil.englishName.toLowerCase().includes(lowerQuery)) {
      suggestions.add(oil.englishName)
    }
  })

  // 2. 部分匹配的標籤和功效
  allOils.forEach(oil => {
    oil.tags?.forEach(tag => {
      if (tag.toLowerCase().includes(lowerQuery)) {
        suggestions.add(tag)
      }
    })
    
    oil.mainBenefits?.forEach(benefit => {
      if (benefit.toLowerCase().includes(lowerQuery)) {
        suggestions.add(benefit)
      }
    })
  })

  // 3. 類別關鍵字匹配
  Object.entries(CATEGORY_KEYWORDS).forEach(([category, keywords]) => {
    keywords.forEach(keyword => {
      if (keyword.includes(lowerQuery) || lowerQuery.includes(keyword)) {
        suggestions.add(keyword)
      }
    })
  })

  // 4. 如果建議不足，加入熱門搜尋詞
  const suggestionsArray = Array.from(suggestions)
  if (suggestionsArray.length < limit) {
    POPULAR_SEARCHES.forEach(popular => {
      if (popular.toLowerCase().includes(lowerQuery) && !suggestions.has(popular)) {
        suggestions.add(popular)
      }
    })
  }

  return Array.from(suggestions)
    .sort((a, b) => {
      // 優先排序：以查詢詞開頭的建議
      const aStartsWith = a.toLowerCase().startsWith(lowerQuery)
      const bStartsWith = b.toLowerCase().startsWith(lowerQuery)
      
      if (aStartsWith && !bStartsWith) return -1
      if (!aStartsWith && bStartsWith) return 1
      
      // 其次：較短的建議
      return a.length - b.length
    })
    .slice(0, limit)
}

// 獲取相關類別
function getRelatedCategories(query: string): string[] {
  const lowerQuery = query.toLowerCase()
  const relatedCategories: string[] = []

  // 根據查詢詞推薦相關類別
  Object.entries(CATEGORY_KEYWORDS).forEach(([category, keywords]) => {
    if (keywords.some(keyword => 
      keyword.includes(lowerQuery) || lowerQuery.includes(keyword)
    )) {
      relatedCategories.push(category)
    }
  })

  return relatedCategories
}

// 搜尋建議 API 處理器
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim() || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '8'), 20) // 最多 20 個建議
    const includeCategories = searchParams.get('categories') !== 'false'

    // 生成搜尋建議
    const suggestions = generateSmartSuggestions(query, limit)
    
    // 生成相關類別
    const relatedCategories = includeCategories ? getRelatedCategories(query) : []

    // 統計資訊
    const stats = {
      queryLength: query.length,
      suggestionsCount: suggestions.length,
      relatedCategoriesCount: relatedCategories.length,
      isPopularSearch: POPULAR_SEARCHES.includes(query)
    }

    return NextResponse.json({
      success: true,
      data: {
        query,
        suggestions,
        relatedCategories,
        stats,
        meta: {
          cached: false, // 未來可以加入快取機制
          timestamp: new Date().toISOString()
        }
      }
    })

  } catch (error) {
    // API 錯誤已移除: '搜尋建議 API 錯誤:', error
    return NextResponse.json({
      success: false,
      error: '建議服務暫時無法使用',
      data: {
        query: '',
        suggestions: POPULAR_SEARCHES.slice(0, 5),
        relatedCategories: [],
        stats: { queryLength: 0, suggestionsCount: 0, relatedCategoriesCount: 0 }
      }
    }, { status: 500 })
  }
}