// 模擬用戶收藏數據存儲（實際應用中會使用資料庫）
// 格式：{ userId: string[] } - userId 對應收藏的產品 ID 陣列

class FavoritesStorage {
  private static instance: FavoritesStorage
  private userFavorites = new Map<string, string[]>()

  private constructor() {}

  static getInstance(): FavoritesStorage {
    if (!FavoritesStorage.instance) {
      FavoritesStorage.instance = new FavoritesStorage()
    }
    return FavoritesStorage.instance
  }

  getFavorites(userId: string): string[] {
    return this.userFavorites.get(userId) || []
  }

  setFavorites(userId: string, favorites: string[]): void {
    this.userFavorites.set(userId, favorites)
  }

  addFavorite(userId: string, productId: string): boolean {
    const currentFavorites = this.getFavorites(userId)
    if (currentFavorites.includes(productId)) {
      return false // 已經收藏
    }
    this.setFavorites(userId, [...currentFavorites, productId])
    return true
  }

  removeFavorite(userId: string, productId: string): boolean {
    const currentFavorites = this.getFavorites(userId)
    if (!currentFavorites.includes(productId)) {
      return false // 不在收藏列表中
    }
    this.setFavorites(userId, currentFavorites.filter(id => id !== productId))
    return true
  }

  isFavorited(userId: string, productId: string): boolean {
    return this.getFavorites(userId).includes(productId)
  }

  getFavoriteCount(userId: string): number {
    return this.getFavorites(userId).length
  }

  clearFavorites(userId: string): number {
    const count = this.getFavoriteCount(userId)
    this.setFavorites(userId, [])
    return count
  }

  toggleFavorite(userId: string, productId: string): { action: 'added' | 'removed', isFavorited: boolean } {
    if (this.isFavorited(userId, productId)) {
      this.removeFavorite(userId, productId)
      return { action: 'removed', isFavorited: false }
    } else {
      this.addFavorite(userId, productId)
      return { action: 'added', isFavorited: true }
    }
  }
}

export const favoritesStorage = FavoritesStorage.getInstance()