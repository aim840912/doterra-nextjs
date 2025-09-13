/**
 * 類別相關的工具函數
 * 處理精油類別的標籤顯示、顏色配置等邏輯
 */

import { OilCategory } from '@/types/oil'

// 類別標籤映射
export const categoryLabels: Record<string, string> = {
  [OilCategory.ESSENTIAL_OILS]: '單方精油',
  'single-oils': '單方精油',  // 支援實際的資料格式
  [OilCategory.BLENDS]: '複方精油',
  'proprietary-blends': '複方精油',  // 支援實際的資料格式
  [OilCategory.SKINCARE]: '護膚產品',
  [OilCategory.WELLNESS]: '健康產品',
  [OilCategory.SUPPLEMENTS]: '營養補充',
  [OilCategory.ACCESSORIES]: '配件用品'
}

// 取得類別顯示名稱（支援自訂類別）
export const getCategoryLabel = (category: string): string => {
  return categoryLabels[category] || category
}

// 類別顏色配置
const categoryColors: Record<string, { normal: string; selected: string }> = {
  'single-oils': {
    normal: 'bg-green-100 text-green-800 hover:bg-green-200',
    selected: 'bg-green-600 text-white'
  },
  'essential-oils': {
    normal: 'bg-green-100 text-green-800 hover:bg-green-200',
    selected: 'bg-green-600 text-white'
  },
  'blends': {
    normal: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    selected: 'bg-blue-600 text-white'
  },
  'proprietary-blends': {
    normal: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    selected: 'bg-blue-600 text-white'
  },
  'skincare': {
    normal: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
    selected: 'bg-purple-600 text-white'
  },
  'wellness': {
    normal: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
    selected: 'bg-orange-600 text-white'
  },
  'supplements': {
    normal: 'bg-red-100 text-red-800 hover:bg-red-200',
    selected: 'bg-red-600 text-white'
  },
  'accessories': {
    normal: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    selected: 'bg-gray-600 text-white'
  }
}

// 取得類別顏色配置（與 OilCard 保持一致）
export const getCategoryColor = (category: string, isSelected: boolean = false) => {
  const colors = categoryColors[category] || {
    normal: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    selected: 'bg-gray-600 text-white'
  }

  return isSelected ? colors.selected : colors.normal
}

// 系列標籤的顯示名稱
export const getCollectionLabel = (collection: string): string => {
  const collectionLabels: Record<string, string> = {
    'onguard': 'OnGuard 保衛系列',
    'deep-blue': 'Deep Blue 舒緩系列',
    'breathe': 'Breathe 順暢呼吸系列',
    'food': 'Food 食品級系列'
  }
  return collectionLabels[collection] || collection
}

// 系列標籤的顏色配置
const collectionColors: Record<string, { normal: string; selected: string }> = {
  'onguard': {
    normal: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
    selected: 'bg-orange-600 text-white'
  },
  'deep-blue': {
    normal: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    selected: 'bg-blue-600 text-white'
  },
  'breathe': {
    normal: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200',
    selected: 'bg-cyan-600 text-white'
  },
  'food': {
    normal: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
    selected: 'bg-emerald-600 text-white'
  }
}

export const getCollectionColor = (collection: string, isSelected: boolean = false) => {
  const colors = collectionColors[collection] || {
    normal: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    selected: 'bg-gray-600 text-white'
  }

  return isSelected ? colors.selected : colors.normal
}

// 精油類別白名單 - 只保留真正的精油類別
export const ESSENTIAL_OIL_CATEGORIES = ['single-oils', 'proprietary-blends']