/**
 * 精油收藏功能的 React Hook
 * 提供收藏狀態管理和相關操作方法
 */

import { useState, useEffect, useCallback } from 'react'
import { favoritesStorage } from '@/lib/favorites-storage'

// 模擬用戶 ID（實際應用中會從認證系統獲取）
const getCurrentUserId = () => 'anonymous'

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
      const userId = getCurrentUserId()
      const storedFavorites = favoritesStorage.getFavorites(userId)
      setFavorites(storedFavorites)
    } catch (error) {
      // 靜默處理載入錯誤，設定為空陣列
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
      const userId = getCurrentUserId()
      const { action } = favoritesStorage.toggleFavorite(userId, oilId)
      
      setFavorites(prevFavorites => {
        if (action === 'added') {
          return [...prevFavorites, oilId]
        } else {
          return prevFavorites.filter(id => id !== oilId)
        }
      })
    } catch (error) {
      // 靜默處理切換錯誤，維持現有狀態
    }
  }, [])

  // 新增到收藏
  const addToFavorites = useCallback((oilId: string): void => {
    try {
      if (favorites.includes(oilId)) {
        return // 已經存在，不需要重複新增
      }

      const userId = getCurrentUserId()
      const success = favoritesStorage.addFavorite(userId, oilId)
      
      if (success) {
        setFavorites(prevFavorites => [...prevFavorites, oilId])
      } else {
        // 產品已存在收藏列表中，無需重複新增
      }
    } catch (error) {
      // 靜默處理新增錯誤，維持現有狀態
    }
  }, [favorites])

  // 從收藏移除
  const removeFromFavorites = useCallback((oilId: string): void => {
    try {
      const userId = getCurrentUserId()
      const success = favoritesStorage.removeFavorite(userId, oilId)
      
      if (success) {
        setFavorites(prevFavorites => prevFavorites.filter(id => id !== oilId))
      } else {
        // 產品不在收藏列表中，無需移除
      }
    } catch (error) {
      // 靜默處理移除錯誤，維持現有狀態
    }
  }, [])

  // 清空所有收藏
  const clearAllFavorites = useCallback((): void => {
    try {
      const userId = getCurrentUserId()
      favoritesStorage.clearFavorites(userId)
      setFavorites([])
    } catch (error) {
      // 靜默處理清空錯誤，維持現有狀態
    }
  }, [])

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
      const userId = getCurrentUserId()
      const favoriteStatus = favoritesStorage.isFavorited(userId, oilId)
      setIsFavorited(favoriteStatus)
    } catch (error) {
      // 靜默處理載入錯誤，設定為未收藏
      setIsFavorited(false)
    } finally {
      setIsLoading(false)
    }
  }, [oilId])

  // 切換收藏狀態
  const toggleFavorite = useCallback((): void => {
    try {
      const userId = getCurrentUserId()
      const { isFavorited: newStatus } = favoritesStorage.toggleFavorite(userId, oilId)
      setIsFavorited(newStatus)
    } catch (error) {
      // 靜默處理切換錯誤，維持現有狀態
    }
  }, [oilId])

  return {
    isFavorited,
    toggleFavorite,
    isLoading
  }
}