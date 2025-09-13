import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Oil } from '@/types/oil'

// 篩選器介面
interface Filters {
  category: string
  collection: string
  searchTerm: string
}

// 產品狀態介面
interface ProductState {
  // 核心資料
  products: Oil[]
  favorites: string[]
  searchHistory: string[]
  
  // UI 狀態
  filters: Filters
  isLoading: boolean
  selectedOil: Oil | null
  isModalOpen: boolean
  
  // 搜尋結果
  searchResults: Oil[]
  searchTotal: number
  currentSearchQuery: string
  
  // Actions - 產品管理
  setProducts: (products: Oil[]) => void
  setLoading: (loading: boolean) => void
  
  // Actions - 收藏管理
  toggleFavorite: (id: string) => void
  setFavorites: (favorites: string[]) => void
  
  // Actions - 搜尋管理
  addSearchTerm: (term: string) => void
  clearSearchHistory: () => void
  setSearchResults: (results: Oil[], total: number, query: string) => void
  clearSearchResults: () => void
  
  // Actions - 篩選管理
  updateFilters: (newFilters: Partial<Filters>) => void
  resetFilters: () => void
  
  // Actions - Modal 管理
  openModal: (oil: Oil) => void
  closeModal: () => void
  
  // Actions - 重置所有狀態
  reset: () => void
}

// 預設狀態
const initialState = {
  products: [],
  favorites: [],
  searchHistory: [],
  filters: {
    category: 'all',
    collection: 'all',
    searchTerm: ''
  },
  isLoading: false,
  selectedOil: null,
  isModalOpen: false,
  searchResults: [],
  searchTotal: 0,
  currentSearchQuery: ''
}

// 創建 Zustand Store（暫時移除 persist 以隔離問題）
export const useProductStore = create<ProductState>()((set, get) => ({
  ...initialState,
  
  // 產品管理
  setProducts: (products) => set({ products }),
  setLoading: (isLoading) => set({ isLoading }),
  
  // 收藏管理
  toggleFavorite: (id) => set((state) => ({
    favorites: state.favorites.includes(id)
      ? state.favorites.filter(fav => fav !== id)
      : [...state.favorites, id]
  })),
  setFavorites: (favorites) => set({ favorites }),
  
  // 搜尋管理
  addSearchTerm: (term) => {
    if (!term.trim()) return
    
    set((state) => ({
      searchHistory: [
        term,
        ...state.searchHistory.filter(t => t !== term)
      ].slice(0, 10) // 只保留最近 10 個搜尋記錄
    }))
  },
  clearSearchHistory: () => set({ searchHistory: [] }),
  setSearchResults: (results, total, query) => set({
    searchResults: results,
    searchTotal: total,
    currentSearchQuery: query
  }),
  clearSearchResults: () => set({
    searchResults: [],
    searchTotal: 0,
    currentSearchQuery: ''
  }),
  
  // 篩選管理
  updateFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters }
  })),
  resetFilters: () => set({
    filters: initialState.filters
  }),
  
  // Modal 管理
  openModal: (oil) => set({
    selectedOil: oil,
    isModalOpen: true
  }),
  closeModal: () => set({
    selectedOil: null,
    isModalOpen: false
  }),
  
  // 重置所有狀態
  reset: () => set(initialState)
}))

// 選擇器（Selectors）- 提供便利的資料存取
export const useProducts = () => useProductStore((state) => state.products)
export const useFavoritesState = () => useProductStore((state) => state.favorites)
export const useFilters = () => useProductStore((state) => state.filters)
export const useSearchHistory = () => useProductStore((state) => state.searchHistory)
export const useSearchResults = () => useProductStore((state) => ({
  results: state.searchResults,
  total: state.searchTotal,
  query: state.currentSearchQuery
}))
export const useModalState = () => useProductStore((state) => ({
  selectedOil: state.selectedOil,
  isModalOpen: state.isModalOpen
}))
export const useLoadingState = () => useProductStore((state) => state.isLoading)

// 操作選擇器（Action Selectors）- 提供便利的操作存取
export const useProductActions = () => useProductStore((state) => ({
  setProducts: state.setProducts,
  setLoading: state.setLoading
}))
export const useFavoriteActions = () => useProductStore((state) => ({
  toggleFavorite: state.toggleFavorite,
  setFavorites: state.setFavorites
}))
export const useSearchActions = () => useProductStore((state) => ({
  addSearchTerm: state.addSearchTerm,
  clearSearchHistory: state.clearSearchHistory,
  setSearchResults: state.setSearchResults,
  clearSearchResults: state.clearSearchResults
}))
export const useFilterActions = () => useProductStore((state) => ({
  updateFilters: state.updateFilters,
  resetFilters: state.resetFilters
}))
export const useModalActions = () => useProductStore((state) => ({
  openModal: state.openModal,
  closeModal: state.closeModal
}))