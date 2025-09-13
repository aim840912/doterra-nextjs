'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { validateImageFile, compressImage, getImagePreviewUrl, formatFileSize } from '@/lib/image-utils'

interface UploadedImage {
  id: string
  url: string
  fileName: string
  size: number
  preview?: string
}

interface ImageUploaderProps {
  productId: string
  onUploadSuccess?: (imageUrl: string) => void
  onUploadError?: (error: string) => void
  initialImageUrl?: string
  className?: string
  maxFiles?: number
}

export default function ImageUploader({
  productId,
  onUploadSuccess,
  onUploadError,
  initialImageUrl,
  className = '',
  maxFiles = 1
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>(
    initialImageUrl ? [{
      id: 'initial',
      url: initialImageUrl,
      fileName: '初始圖片',
      size: 0
    }] : []
  )
  const [dragActive, setDragActive] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    
    // 檢查檔案數量限制
    if (uploadedImages.length + fileArray.length > maxFiles) {
      const errorMsg = `最多只能上傳 ${maxFiles} 張圖片`
      setErrorMessage(errorMsg)
      onUploadError?.(errorMsg)
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setErrorMessage(null)

    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i]
        setUploadProgress(((i + 1) / fileArray.length) * 100)

        // 驗證檔案
        const validation = validateImageFile(file)
        if (!validation.valid) {
          throw new Error(validation.error || '檔案驗證失敗')
        }

        // 壓縮圖片
        let processedFile = file
        try {
          processedFile = await compressImage(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1200,
            quality: 0.8
          })
        } catch (compressionError) {
          // 圖片壓縮失敗，繼續使用原檔案
        }

        // 生成預覽
        const preview = await getImagePreviewUrl(processedFile)

        // 上傳到伺服器
        const formData = new FormData()
        formData.append('file', processedFile)
        formData.append('productId', productId)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || '上傳失敗')
        }

        // 新增到已上傳列表
        const newImage: UploadedImage = {
          id: `uploaded-${Date.now()}-${i}`,
          url: result.data.url,
          fileName: result.data.fileName,
          size: result.data.size,
          preview
        }

        setUploadedImages(prev => [...prev, newImage])

        // 如果是單張圖片模式，立即回調
        if (maxFiles === 1) {
          onUploadSuccess?.(result.data.url)
        }
      }

      // 多張圖片模式的回調
      if (maxFiles > 1 && uploadedImages.length > 0) {
        onUploadSuccess?.(uploadedImages[0].url)
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '上傳失敗'
      setErrorMessage(errorMsg)
      onUploadError?.(errorMsg)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [productId, uploadedImages.length, maxFiles, onUploadSuccess, onUploadError])

  const handleRemoveImage = async (imageId: string) => {
    const image = uploadedImages.find(img => img.id === imageId)
    if (!image) return

    try {
      // 如果不是初始圖片，從伺服器刪除
      if (imageId !== 'initial') {
        await fetch('/api/upload', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ fileName: image.fileName })
        })
      }

      // 從列表中移除
      setUploadedImages(prev => prev.filter(img => img.id !== imageId))

      // 如果是單張圖片模式，清空回調
      if (maxFiles === 1) {
        onUploadSuccess?.('')
      }

    } catch (error) {
      // 靜默處理刪除錯誤，通過回調通知用戶
      onUploadError?.('刪除圖片失敗')
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    handleFileSelect(files)
  }, [handleFileSelect])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const canUploadMore = uploadedImages.length < maxFiles

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 上傳區域 */}
      {canUploadMore && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            dragActive 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300 hover:border-gray-400'
          } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple={maxFiles > 1}
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={handleInputChange}
            className="hidden"
          />

          <div className="space-y-2">
            <div className="mx-auto w-12 h-12 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>

            <div>
              <p className="text-lg font-medium text-gray-900">
                {dragActive ? '放開以上傳圖片' : '拖放圖片到這裡或點擊選擇'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                支援 JPEG、PNG、WebP 格式，最大 5MB
                {maxFiles > 1 && ` (最多 ${maxFiles} 張)`}
              </p>
            </div>
          </div>

          {/* 上傳進度 */}
          {isUploading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <div className="mt-2 text-sm text-gray-600">
                  上傳中... {Math.round(uploadProgress)}%
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 錯誤訊息 */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errorMessage}</p>
        </div>
      )}

      {/* 已上傳的圖片 */}
      {uploadedImages.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">已上傳的圖片</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedImages.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                  <Image
                    src={image.preview || image.url}
                    alt="上傳的圖片"
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const img = e.currentTarget
                      if (img.src !== '/images/placeholder.svg') {
                        img.src = '/images/placeholder.svg'
                      }
                    }}
                  />
                </div>
                
                {/* 刪除按鈕 */}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(image.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* 圖片資訊 */}
                <div className="mt-2 text-xs text-gray-500">
                  <p className="truncate">{image.fileName}</p>
                  {image.size > 0 && <p>{formatFileSize(image.size)}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 上傳統計 */}
      {uploadedImages.length > 0 && (
        <div className="text-sm text-gray-500 border-t pt-3">
          已上傳 {uploadedImages.length} 張圖片
          {maxFiles > 1 && ` / 最多 ${maxFiles} 張`}
        </div>
      )}
    </div>
  )
}