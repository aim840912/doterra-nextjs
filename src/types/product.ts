export enum ProductCategory {
  ESSENTIAL_OILS = 'essential-oils',
  BLENDS = 'blends',
  SKINCARE = 'skincare',
  WELLNESS = 'wellness',
  SUPPLEMENTS = 'supplements',
  ACCESSORIES = 'accessories'
}

// 支援自訂類別的產品類型
export interface Product {
  id: string
  name: string
  englishName: string
  description: string
  benefits: string[]
  category: string // 改為 string 以支援自訂類別
  volume: string
  imageUrl: string
  isNew?: boolean
  isBestseller?: boolean
  inStock: boolean
  usageInstructions?: string
  ingredients?: string[]
  tags: string[]
  
  // 新增的詳細資訊欄位
  detailedDescription?: string     // 詳細產品介紹
  mainBenefits?: string[]         // 主要功效列表
  aromaDescription?: string       // 香味描述
  extractionMethod?: string       // 萃取方法
  plantPart?: string             // 萃取部位
  mainIngredients?: string[]     // 主要成分
  cautions?: string[]            // 注意事項
  
  // 新增的商業資訊欄位
  specifications?: string         // 規格
  productCode?: string           // 產品編號
  retailPrice?: number          // 建議售價
  memberPrice?: number          // 會員價
  pvPoints?: number            // 點數 (PV)
}

// 類別選項介面
export interface CategoryOption {
  value: string
  label: string
}

export interface ProductFilters {
  category?: string // 改為 string 以支援自訂類別
  inStockOnly?: boolean
  searchTerm?: string
}

export interface ProductListProps {
  products: Product[]
  filters?: ProductFilters
  onProductSelect?: (product: Product) => void
}

export interface ProductCardProps {
  product: Product
  onSelect?: (product: Product) => void
  compact?: boolean
}