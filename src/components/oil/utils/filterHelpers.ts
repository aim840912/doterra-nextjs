/**
 * 篩選和排序相關的工具函數
 * 處理精油的篩選、排序、搜尋邏輯
 */

import { Oil } from '@/types/oil'
import { getCategoryLabel, getCollectionLabel, ESSENTIAL_OIL_CATEGORIES } from './categoryHelpers'

export interface FilterOptions {
  selectedCategory: string | 'all'
  selectedCollection: string | 'all'
  searchTerm?: string
  searchResults?: Oil[]
  currentSearchQuery?: string
  sortBy?: 'name' | 'category'
  favorites?: string[]
}

// 取得所有獨特的類別（僅包含精油類別）
export const getUniqueCategories = (oils: Oil[]): string[] => {
  const uniqueCategories = [...new Set(oils.map(oil => oil.category))]
  return uniqueCategories.filter(category => ESSENTIAL_OIL_CATEGORIES.includes(category)).sort()
}

// 取得所有獨特的系列（collections）
export const getUniqueCollections = (oils: Oil[]): string[] => {
  const uniqueCollections = new Set<string>()
  oils.forEach(oil => {
    if (oil.collections && oil.collections.length > 0) {
      oil.collections.forEach(collection => uniqueCollections.add(collection))
    }
  })
  return Array.from(uniqueCollections).sort()
}

// 本地搜尋功能（向後兼容）
export const performLocalSearch = (oils: Oil[], searchTerm: string): Oil[] => {
  if (!searchTerm.trim()) return oils

  const term = searchTerm.toLowerCase()
  return oils.filter(oil => 
    oil.name.toLowerCase().includes(term) ||
    oil.englishName.toLowerCase().includes(term) ||
    oil.description.toLowerCase().includes(term) ||
    oil.tags?.some(tag => tag.toLowerCase().includes(term)) ||
    oil.mainBenefits?.some(benefit => benefit.toLowerCase().includes(term)) ||
    oil.collections?.some(collection => getCollectionLabel(collection).toLowerCase().includes(term))
  )
}

// 按類別篩選
export const filterByCategory = (oils: Oil[], selectedCategory: string | 'all'): Oil[] => {
  if (selectedCategory === 'all') return oils
  return oils.filter(oil => oil.category === selectedCategory)
}

// 按系列篩選
export const filterByCollection = (oils: Oil[], selectedCollection: string | 'all'): Oil[] => {
  if (selectedCollection === 'all') return oils
  return oils.filter(oil => 
    oil.collections && oil.collections.includes(selectedCollection)
  )
}

// 排序精油
export const sortOils = (
  oils: Oil[], 
  sortBy: 'name' | 'category' = 'name', 
  favorites: string[] = []
): Oil[] => {
  return [...oils].sort((a, b) => {
    // 優先級1: 收藏狀態 (收藏的精油優先顯示)
    const aIsFavorite = favorites.includes(a.id)
    const bIsFavorite = favorites.includes(b.id)
    
    if (aIsFavorite && !bIsFavorite) return -1
    if (!aIsFavorite && bIsFavorite) return 1
    
    // 優先級2: 根據選擇的排序方式
    switch (sortBy) {
      case 'category':
        const categoryCompare = getCategoryLabel(a.category).localeCompare(getCategoryLabel(b.category), 'zh-TW')
        if (categoryCompare !== 0) return categoryCompare
        return a.name.localeCompare(b.name, 'zh-TW')
      case 'name':
      default:
        return a.name.localeCompare(b.name, 'zh-TW')
    }
  })
}

// 主要篩選和排序函數
export const filterAndSortOils = (oils: Oil[], options: FilterOptions): Oil[] => {
  const {
    selectedCategory = 'all',
    selectedCollection = 'all',
    searchTerm = '',
    searchResults = [],
    currentSearchQuery = '',
    sortBy = 'name',
    favorites = []
  } = options

  // 如果有搜尋結果，使用搜尋結果；否則使用原始資料
  let filtered = currentSearchQuery ? searchResults : oils

  // 如果沒有搜尋但有傳統搜尋詞，則進行本地搜尋（向後兼容）
  if (!currentSearchQuery && searchTerm) {
    filtered = performLocalSearch(oils, searchTerm)
  }

  // 如果沒有使用 API 搜尋，則進行類別和系列篩選
  if (!currentSearchQuery) {
    // 類別篩選
    filtered = filterByCategory(filtered, selectedCategory)
    // 系列篩選
    filtered = filterByCollection(filtered, selectedCollection)
  }

  // 排序
  return sortOils(filtered, sortBy, favorites)
}

// 計算每個類別的精油數量
export const getCategoryCount = (oils: Oil[], category: string): number => {
  return oils.filter(oil => oil.category === category).length
}

// 計算每個系列的精油數量
export const getCollectionCount = (oils: Oil[], collection: string): number => {
  return oils.filter(oil => 
    oil.collections && oil.collections.includes(collection)
  ).length
}