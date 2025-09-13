import { NextRequest, NextResponse } from 'next/server'
import Fuse from 'fuse.js'
import { allOils } from '@/data/products'
import { Oil } from '@/types/oil'

// Fuse.js 搜尋配置
const fuseOptions = {
  keys: [
    {
      name: 'name',
      weight: 3 // 名稱權重最高
    },
    {
      name: 'englishName', 
      weight: 2
    },
    {
      name: 'description',
      weight: 1
    },
    {
      name: 'tags',
      weight: 1.5
    },
    {
      name: 'mainBenefits',
      weight: 1.2
    },
    {
      name: 'collections',
      weight: 1
    }
  ],
  threshold: 0.6, // 模糊匹配閾值
  distance: 100,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 1,
  shouldSort: true
}

// 建立 Fuse 實例
const fuse = new Fuse(allOils, fuseOptions)

// 產生搜尋建議
function getSearchSuggestions(query: string, limit: number = 5): string[] {
  if (!query || query.length < 2) return []
  
  const suggestions = new Set<string>()
  
  // 從產品名稱中提取建議
  allOils.forEach(oil => {
    if (oil.name.toLowerCase().includes(query.toLowerCase())) {
      suggestions.add(oil.name)
    }
    if (oil.englishName && oil.englishName.toLowerCase().includes(query.toLowerCase())) {
      suggestions.add(oil.englishName)
    }
    
    // 從標籤中提取建議
    oil.tags?.forEach(tag => {
      if (tag.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(tag)
      }
    })
    
    // 從主要功效中提取建議
    oil.mainBenefits?.forEach(benefit => {
      if (benefit.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(benefit)
      }
    })
  })
  
  return Array.from(suggestions).slice(0, limit)
}

// 搜尋 API 處理器
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()
    const category = searchParams.get('category')
    const collection = searchParams.get('collection')
    const limit = parseInt(searchParams.get('limit') || '20')
    const includeSuggestions = searchParams.get('suggestions') !== 'false'

    // 驗證參數
    if (!query || query.length < 1) {
      return NextResponse.json({
        success: false,
        error: '搜尋關鍵字不能為空',
        results: [],
        total: 0,
        query: query || '',
        suggestions: []
      }, { status: 400 })
    }

    // 執行模糊搜尋
    const searchResults = fuse.search(query)
    
    // 提取搜尋結果
    let results: Oil[] = searchResults.map(result => result.item)

    // 類別篩選
    if (category && category !== 'all') {
      results = results.filter(oil => oil.category === category)
    }

    // 系列篩選
    if (collection && collection !== 'all') {
      results = results.filter(oil => 
        oil.collections && oil.collections.includes(collection)
      )
    }

    // 限制結果數量
    const limitedResults = results.slice(0, limit)

    // 產生搜尋建議
    const suggestions = includeSuggestions ? getSearchSuggestions(query) : []

    // 搜尋統計
    const stats = {
      queryLength: query.length,
      originalResults: searchResults.length,
      filteredResults: results.length,
      returnedResults: limitedResults.length
    }

    return NextResponse.json({
      success: true,
      data: {
        results: limitedResults,
        total: results.length,
        query,
        suggestions,
        stats,
        filters: {
          category: category || 'all',
          collection: collection || 'all'
        }
      }
    })

  } catch (error) {
    console.error('搜尋 API 錯誤:', error)
    return NextResponse.json({
      success: false,
      error: '搜尋服務暫時無法使用',
      results: [],
      total: 0,
      query: '',
      suggestions: []
    }, { status: 500 })
  }
}