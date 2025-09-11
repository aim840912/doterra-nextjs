import { Oil } from '@/types/oil'
import doterraOils from './doterra-real-products.json'

// 只使用真實的 doTERRA 精油
export const allOils: Oil[] = doterraOils as Oil[]

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
  return doterraOils as Oil[]
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