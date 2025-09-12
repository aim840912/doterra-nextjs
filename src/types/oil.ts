export enum OilCategory {
  ESSENTIAL_OILS = 'essential-oils',
  BLENDS = 'blends',
  SKINCARE = 'skincare',
  WELLNESS = 'wellness',
  SUPPLEMENTS = 'supplements',
  ACCESSORIES = 'accessories'
}

// 支援自訂類別的精油類型
export interface Oil {
  id: string
  name: string
  englishName: string
  scientificName?: string          // 學名
  description: string
  benefits?: string[]              // 改為選填，因為 JSON 沒有此欄位
  category: string // 改為 string 以支援自訂類別
  volume: string
  imageUrl: string
  isNew?: boolean
  isBestseller?: boolean
  usageInstructions?: string | string[]  // 支援字串或陣列格式
  ingredients?: string[]
  tags?: string[]
  
  // 新增的詳細資訊欄位
  detailedDescription?: string     // 詳細產品介紹
  productIntroduction?: string     // 產品介紹（JSON 中實際使用的欄位）
  mainBenefits?: string[]         // 主要功效列表
  aromaDescription?: string       // 香味描述
  extractionMethod?: string       // 萃取方法
  plantPart?: string             // 萃取部位
  mainIngredients?: string[]     // 主要成分
  cautions?: string | string[]   // 支援字串或陣列格式
  applicationGuide?: string       // 應用指南
  url?: string                   // 產品 URL
  
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

export interface OilFilters {
  category?: string // 改為 string 以支援自訂類別
  searchTerm?: string
}

export interface OilListProps {
  oils: Oil[]
  filters?: OilFilters
  onOilSelect?: (oil: Oil) => void
}

export interface OilCardProps {
  oil: Oil
  onSelect?: (oil: Oil) => void
  compact?: boolean
}