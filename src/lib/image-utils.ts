/**
 * 圖片處理工具函數
 * 提供圖片驗證、壓縮、檔名生成等功能
 */

/**
 * 驗證圖片檔案
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  const maxSize = 5 * 1024 * 1024 // 5MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: '不支援的檔案格式。請使用 JPEG、PNG、WebP 或 AVIF 格式。'
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: '檔案大小不能超過 5MB。'
    }
  }

  return { valid: true }
}

/**
 * 壓縮圖片檔案 (瀏覽器端使用)
 */
export async function compressImage(
  file: File, 
  options: { maxSizeMB?: number; maxWidthOrHeight?: number; quality?: number } = {}
): Promise<File> {
  const {
    maxSizeMB = 1,
    maxWidthOrHeight = 1200,
    quality = 0.8
  } = options

  try {
    // 動態導入 browser-image-compression
    const { default: imageCompression } = await import('browser-image-compression')
    
    const compressOptions = {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker: true,
      initialQuality: quality
    }

    const compressedFile = await imageCompression(file, compressOptions)
    return compressedFile
  } catch (error) {
    console.warn('圖片壓縮失敗，使用原檔案:', error)
    return file // 壓縮失敗時返回原檔案
  }
}

/**
 * 產生安全的檔案名稱
 */
export function generateFileName(originalName: string, productId?: string): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg'
  
  // 清理檔名，只保留字母、數字和連字符
  const baseName = originalName
    .replace(/\.[^/.]+$/, '') // 移除副檔名
    .replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '_') // 替換特殊字符和空格
    .substring(0, 20) // 限制長度

  const prefix = productId ? `${productId}_` : ''
  return `${prefix}${baseName}_${timestamp}_${randomString}.${extension}`
}

/**
 * 獲取圖片預覽URL
 */
export function getImagePreviewUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * 圖片載入錯誤時的後備處理
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement>,
  fallbackUrl: string = '/images/placeholder.jpg'
): void {
  const img = event.currentTarget
  if (img.src !== fallbackUrl) {
    img.src = fallbackUrl
  }
}

/**
 * 檢查是否為有效的圖片URL
 */
export function isValidImageUrl(url: string): boolean {
  if (!url) return false
  
  // 檢查是否為 data URL (base64)
  if (url.startsWith('data:image/')) return true
  
  // 檢查是否為 HTTP/HTTPS URL
  if (url.startsWith('http://') || url.startsWith('https://')) return true
  
  // 檢查是否為相對路徑
  if (url.startsWith('/')) return true
  
  return false
}

/**
 * 格式化檔案大小顯示
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}