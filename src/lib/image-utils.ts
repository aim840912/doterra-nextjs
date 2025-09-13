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
    // 圖片壓縮失敗，繼續使用原檔案
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

/**
 * 產生圖片的 blur placeholder data URL
 * 用於 Next.js Image 組件的 placeholder="blur"
 */
export function generateBlurDataURL(
  width: number = 8,
  height: number = 8,
  color: string = '#f3f4f6'
): string {
  // 創建簡單的 SVG blur placeholder
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}"/>
      <defs>
        <filter id="blur">
          <feGaussianBlur stdDeviation="1"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="${color}" filter="url(#blur)" opacity="0.8"/>
    </svg>
  `
  
  // 轉換為 base64 data URL
  const base64 = Buffer.from(svg).toString('base64')
  return `data:image/svg+xml;base64,${base64}`
}

/**
 * 根據圖片類型產生對應的 blur placeholder
 */
export function getImageBlurDataURL(imageUrl: string): string {
  // 根據圖片來源決定 placeholder 顏色
  if (imageUrl.includes('doterra.com')) {
    return generateBlurDataURL(8, 8, '#f0f9ff') // 淡藍色，doTERRA 品牌色調
  }
  
  if (imageUrl.includes('placeholder')) {
    return generateBlurDataURL(8, 8, '#e5e7eb') // 灰色
  }
  
  // 預設淺綠色，符合精油主題
  return generateBlurDataURL(8, 8, '#f0fdf4')
}

/**
 * 為不同螢幕尺寸優化 sizes 屬性
 */
export function getResponsiveImageSizes(context: 'card' | 'modal' | 'thumbnail' | 'list'): string {
  switch (context) {
    case 'card':
      // OilCard 在網格中使用
      return '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw'
    
    case 'modal':
      // OilDetailModal 大圖顯示
      return '(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 50vw'
    
    case 'thumbnail':
      // ImageUploader 縮略圖
      return '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px'
    
    case 'list':
      // test-oils 頁面列表項目
      return '64px'
    
    default:
      return '100vw'
  }
}

/**
 * 圖片載入優化 Hook 的類型定義
 */
export interface ImageLoadState {
  isLoading: boolean
  hasError: boolean
  hasLoaded: boolean
}

/**
 * 圖片預載入工具函數
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(`Failed to preload image: ${src}`))
    img.src = src
  })
}

/**
 * 批量預載入圖片
 */
export async function preloadImages(srcs: string[]): Promise<void> {
  const promises = srcs.map(src => preloadImage(src))
  await Promise.allSettled(promises)
}