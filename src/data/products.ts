/**
 * 產品資料主要介面 - 向後相容版本
 * 
 * 這個檔案保持向後相容性，同時提供新的模組化資料載入功能
 * 新的開發請使用 '@/data/products' 模組
 */

import { Oil } from '@/types/oil'

// 新的模組化產品載入系統
import { 
  getAllProducts,
  getProductsByCategory as getProductsByCat,
  searchProducts as searchProductsNew,
  PRODUCT_CATEGORIES,
  ProductCategory
} from './products/index'

// 向後相容：使用新的資料載入系統
export const allOils: Oil[] = getAllProducts()

// 基礎查詢函數
export const getOilsByCategory = (category: string): Oil[] => {
  return allOils.filter(oil => oil.category === category)
}

export const getBestsellerOils = (): Oil[] => {
  return allOils.filter(oil => oil.isBestseller)
}

export const getNewOils = (): Oil[] => {
  return allOils.filter(oil => oil.isNew)
}

export const searchOils = (searchTerm: string): Oil[] => {
  const term = searchTerm.toLowerCase()
  return allOils.filter(oil => 
    oil.name.toLowerCase().includes(term) ||
    oil.englishName?.toLowerCase().includes(term) ||
    oil.description?.toLowerCase().includes(term) ||
    oil.tags?.some(tag => tag.toLowerCase().includes(term)) ||
    oil.mainBenefits?.some(benefit => benefit.toLowerCase().includes(term))
  )
}

// 取得 doTERRA 精油（現在就是全部精油）
export const getDoTerraOils = (): Oil[] => {
  return allOils
}

// 向後相容：原本的 products 陣列現在返回空陣列
export const products: Oil[] = []

// 向後相容：保留舊的函數名稱，但使用新的實作
export const allProducts = allOils
export const getProductsByCategory = getOilsByCategory
export const getBestsellerProducts = getBestsellerOils
export const getNewProducts = getNewOils
export const searchProducts = searchOils
export const getDoTerraProducts = getDoTerraOils

// 向後相容：getSampleProducts 現在返回空陣列，因為我們移除了範例產品
export const getSampleProducts = (): Oil[] => {
  return []
}

/**
 * 新功能：模組化類別載入
 * 
 * 推薦新專案使用以下函數，它們直接使用新的模組化系統
 */

// 按類別載入（推薦用法）
export const loadSingleOils = () => getProductsByCat(PRODUCT_CATEGORIES.SINGLE_OILS)
export const loadBlends = () => getProductsByCat(PRODUCT_CATEGORIES.PROPRIETARY_BLENDS)
export const loadSkincare = () => getProductsByCat(PRODUCT_CATEGORIES.SKINCARE)
export const loadWellness = () => getProductsByCat(PRODUCT_CATEGORIES.WELLNESS)
export const loadAccessories = () => getProductsByCat(PRODUCT_CATEGORIES.ACCESSORIES)

// 進階搜尋（推薦用法）
export const searchByCategory = (searchTerm: string, category?: string): Oil[] => {
  return searchProductsNew(searchTerm, category ? [category as ProductCategory] : undefined)
}

/**
 * 資料統計和分析
 */
export const getProductStats = () => {
  const stats = {
    total: allOils.length,
    categories: {} as Record<string, number>,
    withImages: 0,
    withPricing: 0
  }

  allOils.forEach(oil => {
    // 統計類別
    stats.categories[oil.category] = (stats.categories[oil.category] || 0) + 1
    
    // 統計有圖片的產品
    if (oil.imageUrl) stats.withImages++
    
    // 統計有價格的產品
    if (oil.retailPrice || oil.memberPrice) stats.withPricing++
  })

  return stats
}

/**
 * 開發提示：
 * 
 * 對於新開發，建議直接使用：
 * import { getAllProducts, getProductsByCategory } from '@/data/products'
 * 
 * 這個檔案主要用於保持現有程式碼的相容性
 */