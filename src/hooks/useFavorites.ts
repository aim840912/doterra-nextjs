/**
 * 精油收藏功能的 React Hook
 * 提供收藏狀態管理和相關操作方法
 */

import { useState, useEffect, useCallback } from 'react'
import { 
  getFavorites, 
  toggleFavorite as toggleFavoriteStorage,
  addToFavorites as addToFavoritesStorage,
  removeFromFavorites as removeFromFavoritesStorage,
  isFavorite as isFavoriteStorage,
  clearAllFavorites as clearAllFavoritesStorage
} from '@/lib/favorites-storage'

interface UseFavoritesReturn {
  /** 所有收藏的精油 ID */
  favorites: string[]
  /** 收藏數量 */
  favoritesCount: number
  /** 檢查是否已收藏 */
  isFavorite: (oilId: string) => boolean
  /** 切換收藏狀態 */
  toggleFavorite: (oilId: string) => void
  /** 新增到收藏 */
  addToFavorites: (oilId: string) => void
  /** 從收藏移除 */
  removeFromFavorites: (oilId: string) => void
  /** 清空所有收藏 */
  clearAllFavorites: () => void
  /** 是否正在載入中 */
  isLoading: boolean
}

export function useFavorites(): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 初始化載入收藏列表
  useEffect(() => {
    try {
      const storedFavorites = getFavorites()
      setFavorites(storedFavorites)
    } catch (error) {
      console.warn('載入收藏列表失敗:', error)
      setFavorites([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 檢查是否已收藏
  const isFavorite = useCallback((oilId: string): boolean => {
    return favorites.includes(oilId)
  }, [favorites])

  // 切換收藏狀態
  const toggleFavorite = useCallback((oilId: string): void => {
    try {
      const success = toggleFavoriteStorage(oilId)
      
      if (success) {
        setFavorites(prevFavorites => {
          if (prevFavorites.includes(oilId)) {
            // 移除收藏
            return prevFavorites.filter(id => id !== oilId)
          } else {
            // 新增收藏
            return [...prevFavorites, oilId]
          }
        })
      } else {
        console.warn('切換收藏狀態失敗，可能是 localStorage 不可用')
      }
    } catch (error) {
      console.error('切換收藏狀態時發生錯誤:', error)
    }
  }, [])

  // 新增到收藏
  const addToFavorites = useCallback((oilId: string): void => {
    try {
      if (favorites.includes(oilId)) {
        return // 已經存在，不需要重複新增
      }

      const success = addToFavoritesStorage(oilId)
      
      if (success) {
        setFavorites(prevFavorites => [...prevFavorites, oilId])
      } else {
        console.warn('新增收藏失敗，可能是 localStorage 不可用')
      }
    } catch (error) {
      console.error('新增收藏時發生錯誤:', error)
    }
  }, [favorites])

  // 從收藏移除
  const removeFromFavorites = useCallback((oilId: string): void => {
    try {
      const success = removeFromFavoritesStorage(oilId)
      
      if (success) {
        setFavorites(prevFavorites => prevFavorites.filter(id => id !== oilId))
      } else {
        console.warn('移除收藏失敗，可能是 localStorage 不可用')
      }
    } catch (error) {
      console.error('移除收藏時發生錯誤:', error)
    }
  }, [])

  // 清空所有收藏
  const clearAllFavorites = useCallback((): void => {
    try {
      const success = clearAllFavoritesStorage()
      
      if (success || favorites.length === 0) {
        setFavorites([])
      } else {
        console.warn('清空收藏失敗，可能是 localStorage 不可用')
      }
    } catch (error) {
      console.error('清空收藏時發生錯誤:', error)
    }
  }, [favorites.length])

  return {
    favorites,
    favoritesCount: favorites.length,
    isFavorite,
    toggleFavorite,
    addToFavorites,
    removeFromFavorites,
    clearAllFavorites,
    isLoading
  }
}

/**
 * 輕量版 Hook，只提供基本的檢查和切換功能
 * 適合在子元件中使用，避免不必要的重新渲染
 */
export function useFavoriteStatus(oilId: string) {
  const [isFavorited, setIsFavorited] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 初始化載入狀態
  useEffect(() => {
    try {
      const favoriteStatus = isFavoriteStorage(oilId)
      setIsFavorited(favoriteStatus)
    } catch (error) {
      console.warn('載入收藏狀態失敗:', error)
      setIsFavorited(false)
    } finally {
      setIsLoading(false)
    }
  }, [oilId])

  // 切換收藏狀態
  const toggleFavorite = useCallback((): void => {
    try {
      const success = toggleFavoriteStorage(oilId)
      
      if (success) {
        setIsFavorited(prev => !prev)
      } else {
        console.warn('切換收藏狀態失敗，可能是 localStorage 不可用')
      }
    } catch (error) {
      console.error('切換收藏狀態時發生錯誤:', error)
    }
  }, [oilId])

  return {
    isFavorited,
    toggleFavorite,
    isLoading
  }
}