/**
 * 精油收藏功能的 localStorage 工具函數
 * 支援手機瀏覽器的特殊限制和降級策略
 */

const STORAGE_KEY = 'doterra_favorites'
const EXPIRY_DAYS = 30 // 30天後自動清理

interface StorageItem {
  favorites: string[]
  timestamp: number
  expiry: number
}

/**
 * 檢測 localStorage 是否可用
 */
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__storage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch (e) {
    return false
  }
}

/**
 * 安全地從 localStorage 讀取收藏列表
 */
export function getFavorites(): string[] {
  try {
    if (!isLocalStorageAvailable()) {
      console.warn('localStorage 不可用，使用空的收藏列表')
      return []
    }

    const itemStr = localStorage.getItem(STORAGE_KEY)
    if (!itemStr) {
      return []
    }

    const item: StorageItem = JSON.parse(itemStr)
    const now = Date.now()

    // 檢查是否過期
    if (now - item.timestamp > item.expiry) {
      localStorage.removeItem(STORAGE_KEY)
      return []
    }

    return Array.isArray(item.favorites) ? item.favorites : []
  } catch (error) {
    console.warn('讀取收藏列表失敗:', error)
    return []
  }
}

/**
 * 安全地儲存收藏列表到 localStorage
 */
export function saveFavorites(favorites: string[]): boolean {
  try {
    if (!isLocalStorageAvailable()) {
      console.warn('localStorage 不可用，無法儲存收藏列表')
      return false
    }

    const item: StorageItem = {
      favorites: Array.isArray(favorites) ? favorites : [],
      timestamp: Date.now(),
      expiry: EXPIRY_DAYS * 24 * 60 * 60 * 1000
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(item))
    return true
  } catch (error) {
    console.warn('儲存收藏列表失敗:', error)
    
    // 如果是配額超出錯誤，嘗試清理並重試
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      try {
        cleanup()
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          favorites: Array.isArray(favorites) ? favorites : [],
          timestamp: Date.now(),
          expiry: EXPIRY_DAYS * 24 * 60 * 60 * 1000
        }))
        return true
      } catch (retryError) {
        console.error('清理後重試仍失敗:', retryError)
      }
    }
    
    return false
  }
}

/**
 * 新增精油到收藏列表
 */
export function addToFavorites(oilId: string): boolean {
  const currentFavorites = getFavorites()
  
  // 避免重複新增
  if (currentFavorites.includes(oilId)) {
    return true
  }

  const newFavorites = [...currentFavorites, oilId]
  return saveFavorites(newFavorites)
}

/**
 * 從收藏列表移除精油
 */
export function removeFromFavorites(oilId: string): boolean {
  const currentFavorites = getFavorites()
  const newFavorites = currentFavorites.filter(id => id !== oilId)
  return saveFavorites(newFavorites)
}

/**
 * 切換精油的收藏狀態
 */
export function toggleFavorite(oilId: string): boolean {
  const currentFavorites = getFavorites()
  
  if (currentFavorites.includes(oilId)) {
    return removeFromFavorites(oilId)
  } else {
    return addToFavorites(oilId)
  }
}

/**
 * 檢查精油是否已收藏
 */
export function isFavorite(oilId: string): boolean {
  const favorites = getFavorites()
  return favorites.includes(oilId)
}

/**
 * 清理 localStorage 中的過期項目
 */
function cleanup(): void {
  if (!isLocalStorageAvailable()) {
    return
  }

  try {
    const now = Date.now()
    const keysToRemove: string[] = []

    // 檢查所有項目
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key) continue

      try {
        const itemStr = localStorage.getItem(key)
        if (!itemStr) continue

        const item = JSON.parse(itemStr)
        
        // 如果有時間戳記和過期時間，檢查是否過期
        if (item.timestamp && item.expiry) {
          if (now - item.timestamp > item.expiry) {
            keysToRemove.push(key)
          }
        }
      } catch (e) {
        // 忽略非 JSON 項目
        continue
      }
    }

    // 移除過期項目
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
    })

    if (keysToRemove.length > 0) {
      console.log(`清理了 ${keysToRemove.length} 個過期的 localStorage 項目`)
    }
  } catch (error) {
    console.warn('清理 localStorage 失敗:', error)
  }
}

/**
 * 取得收藏數量
 */
export function getFavoritesCount(): number {
  return getFavorites().length
}

/**
 * 清空所有收藏
 */
export function clearAllFavorites(): boolean {
  return saveFavorites([])
}