import { Oil } from '@/types/oil'

// 導入各類別產品資料
import singleOilsData from './single-oils.json'
import blendsData from './blends.json'
import skincareData from './skincare.json'
import wellnessData from './wellness.json'
import accessoriesData from './accessories.json'

/**
 * 產品類別定義
 */
export const PRODUCT_CATEGORIES = {
  SINGLE_OILS: 'single-oils',
  BLENDS: 'blends',
  SKINCARE: 'skincare',
  WELLNESS: 'wellness',
  ACCESSORIES: 'accessories'
} as const

export type ProductCategory = typeof PRODUCT_CATEGORIES[keyof typeof PRODUCT_CATEGORIES]

/**
 * 類別配置
 */
export const CATEGORY_CONFIG = {
  [PRODUCT_CATEGORIES.SINGLE_OILS]: {
    name: '單方精油',
    description: '純淨天然的單一植物精油',
    color: 'green'
  },
  [PRODUCT_CATEGORIES.BLENDS]: {
    name: '複方精油',
    description: '精心調配的複合精油配方',
    color: 'blue'
  },
  [PRODUCT_CATEGORIES.SKINCARE]: {
    name: '護膚產品',
    description: '精油護膚與美容產品',
    color: 'purple'
  },
  [PRODUCT_CATEGORIES.WELLNESS]: {
    name: '健康產品',
    description: '健康保健相關產品',
    color: 'orange'
  },
  [PRODUCT_CATEGORIES.ACCESSORIES]: {
    name: '配件用品',
    description: '精油使用配件與工具',
    color: 'gray'
  }
} as const

/**
 * 類型安全的產品資料
 */
const singleOils = singleOilsData as Oil[]
const blends = blendsData as Oil[]
const skincare = skincareData as Oil[]
const wellness = wellnessData as Oil[]
const accessories = accessoriesData as Oil[]

/**
 * 按類別取得產品資料
 */
export const getProductsByCategory = (category: ProductCategory): Oil[] => {
  switch (category) {
    case PRODUCT_CATEGORIES.SINGLE_OILS:
      return singleOils
    case PRODUCT_CATEGORIES.BLENDS:
      return blends
    case PRODUCT_CATEGORIES.SKINCARE:
      return skincare
    case PRODUCT_CATEGORIES.WELLNESS:
      return wellness
    case PRODUCT_CATEGORIES.ACCESSORIES:
      return accessories
    default:
      return []
  }
}

/**
 * 取得所有產品資料（按需合併）
 */
export const getAllProducts = (): Oil[] => {
  return [
    ...singleOils,
    ...blends,
    ...skincare,
    ...wellness,
    ...accessories
  ]
}

/**
 * 取得多個類別的產品
 */
export const getProductsByCategories = (categories: ProductCategory[]): Oil[] => {
  return categories.reduce((acc: Oil[], category) => {
    acc.push(...getProductsByCategory(category))
    return acc
  }, [])
}

/**
 * 按 ID 查找產品
 */
export const getProductById = (id: string): Oil | undefined => {
  const allProducts = getAllProducts()
  return allProducts.find(product => product.id === id)
}

/**
 * 搜尋產品
 */
export const searchProducts = (searchTerm: string, categories?: ProductCategory[]): Oil[] => {
  const productsToSearch = categories 
    ? getProductsByCategories(categories)
    : getAllProducts()

  const term = searchTerm.toLowerCase()
  return productsToSearch.filter(product => 
    product.name.toLowerCase().includes(term) ||
    product.englishName?.toLowerCase().includes(term) ||
    product.description?.toLowerCase().includes(term) ||
    product.tags?.some(tag => tag.toLowerCase().includes(term)) ||
    product.mainBenefits?.some(benefit => benefit.toLowerCase().includes(term))
  )
}

/**
 * 取得類別統計資訊
 */
export const getCategoryStats = () => {
  return {
    [PRODUCT_CATEGORIES.SINGLE_OILS]: singleOils.length,
    [PRODUCT_CATEGORIES.BLENDS]: blends.length,
    [PRODUCT_CATEGORIES.SKINCARE]: skincare.length,
    [PRODUCT_CATEGORIES.WELLNESS]: wellness.length,
    [PRODUCT_CATEGORIES.ACCESSORIES]: accessories.length,
    total: getAllProducts().length
  }
}

/**
 * 取得可用的類別列表
 */
export const getAvailableCategories = (): ProductCategory[] => {
  return Object.values(PRODUCT_CATEGORIES).filter(category => {
    return getProductsByCategory(category).length > 0
  })
}

/**
 * 工具函數：驗證類別是否有效
 */
export const isValidCategory = (category: string): category is ProductCategory => {
  return Object.values(PRODUCT_CATEGORIES).includes(category as ProductCategory)
}

/**
 * 向後相容性：保留舊的函數名稱和介面
 */

// 舊的函數別名（保持向後相容）
export const allOils = getAllProducts()
export const getOilsByCategory = getProductsByCategory
export const getBestsellerOils = (): Oil[] => {
  return getAllProducts().filter(oil => oil.isBestseller)
}
export const getNewOils = (): Oil[] => {
  return getAllProducts().filter(oil => oil.isNew)
}
export const searchOils = searchProducts

// 舊的 doTERRA 專用函數
export const getDoTerraOils = getAllProducts
export const getDoTerraProducts = getAllProducts

// 統計函數別名
export const getProductStats = getCategoryStats

/**
 * 偏好設定：預設載入類別
 * 可以根據使用頻率或重要性調整載入順序
 */
export const DEFAULT_CATEGORIES: ProductCategory[] = [
  PRODUCT_CATEGORIES.SINGLE_OILS,
  PRODUCT_CATEGORIES.BLENDS,
  PRODUCT_CATEGORIES.SKINCARE,
  PRODUCT_CATEGORIES.WELLNESS,
  PRODUCT_CATEGORIES.ACCESSORIES
]

/**
 * 批次載入：按需載入指定類別
 */
export const loadCategoriesByPriority = (priorities: ProductCategory[] = DEFAULT_CATEGORIES): Oil[] => {
  return getProductsByCategories(priorities)
}