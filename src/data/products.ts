import { Product } from '@/types/product'
import doterraProducts from './doterra-real-products.json'

// 只使用真實的 doTERRA 產品
export const allProducts: Product[] = doterraProducts as Product[]

export const getProductsByCategory = (category: string): Product[] => {
  return allProducts.filter(product => product.category === category)
}

export const getBestsellerProducts = (): Product[] => {
  return allProducts.filter(product => product.isBestseller)
}

export const getNewProducts = (): Product[] => {
  return allProducts.filter(product => product.isNew)
}

export const searchProducts = (searchTerm: string): Product[] => {
  const term = searchTerm.toLowerCase()
  return allProducts.filter(product => 
    product.name.toLowerCase().includes(term) ||
    product.englishName?.toLowerCase().includes(term) ||
    product.description?.toLowerCase().includes(term) ||
    product.tags?.some(tag => tag.toLowerCase().includes(term))
  )
}

// 取得 doTERRA 產品（現在就是全部產品）
export const getDoTerraProducts = (): Product[] => {
  return doterraProducts as Product[]
}

// 向後相容：原本的 products 陣列現在返回空陣列
export const products: Product[] = []

// 向後相容：getSampleProducts 現在返回空陣列，因為我們移除了範例產品
export const getSampleProducts = (): Product[] => {
  return []
}