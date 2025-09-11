'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { Product } from '@/types/product'

interface ProductDetailModalProps {
  product: Product
  isOpen: boolean
  onClose: () => void
}

export default function ProductDetailModal({ product, isOpen, onClose }: ProductDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // 處理 ESC 鍵關閉
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // 防止背景滾動
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // 點擊外部關閉
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose()
    }
  }

  // 取得徽章顏色
  const getBadgeColor = (category: string) => {
    switch (category) {
      case 'essential-oils':
        return 'bg-green-100 text-green-800'
      case 'blends':
        return 'bg-blue-100 text-blue-800'
      case 'skincare':
        return 'bg-purple-100 text-purple-800'
      case 'wellness':
        return 'bg-orange-100 text-orange-800'
      case 'supplements':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // 取得類別名稱
  const getCategoryName = (category: string) => {
    switch (category) {
      case 'essential-oils':
        return '單方精油'
      case 'blends':
        return '複方精油'
      case 'skincare':
        return '護膚產品'
      case 'wellness':
        return '健康產品'
      case 'supplements':
        return '營養補充'
      case 'accessories':
        return '配件用品'
      default:
        return category
    }
  }

  if (!isOpen) return null

  const modalContent = (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in fade-in duration-200"
      >
        {/* 關閉按鈕 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 transition-all duration-200 shadow-lg"
          aria-label="關閉詳情視窗"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 內容區域 */}
        <div className="flex flex-col lg:flex-row max-h-[90vh] overflow-hidden">
          {/* 左側 - 產品圖片 */}
          <div className="lg:w-1/2 bg-gray-50 flex items-center justify-center p-8">
            <div className="relative w-full max-w-md aspect-square">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover rounded-xl"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              
              {/* 產品徽章 */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isNew && (
                  <span className="bg-green-500 text-white text-sm px-3 py-1 rounded-full font-medium shadow-lg">
                    新品
                  </span>
                )}
                {product.isBestseller && (
                  <span className="bg-orange-500 text-white text-sm px-3 py-1 rounded-full font-medium shadow-lg">
                    熱銷
                  </span>
                )}
                {!product.inStock && (
                  <span className="bg-red-500 text-white text-sm px-3 py-1 rounded-full font-medium shadow-lg">
                    缺貨
                  </span>
                )}
              </div>

              {/* 類別標籤 */}
              <div className="absolute top-4 right-4">
                <span className={`text-sm px-3 py-1 rounded-full font-medium shadow-lg ${getBadgeColor(product.category)}`}>
                  {getCategoryName(product.category)}
                </span>
              </div>
            </div>
          </div>

          {/* 右側 - 產品資訊 */}
          <div className="lg:w-1/2 p-8 overflow-y-auto">
            {/* 產品標題 */}
            <div className="mb-6">
              <h1 id="modal-title" className="text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              <p className="text-xl text-gray-600 mb-4">
                {product.englishName}
              </p>
              
              {/* 價格資訊 */}
              {(product.retailPrice || product.memberPrice) && (
                <div className="flex items-center gap-4 mb-4">
                  {product.retailPrice && (
                    <div className="text-gray-600">
                      建議售價: <span className="text-2xl font-bold text-gray-900">NT$ {product.retailPrice}</span>
                    </div>
                  )}
                  {product.memberPrice && (
                    <div className="text-green-600">
                      會員價: <span className="text-2xl font-bold">NT$ {product.memberPrice}</span>
                    </div>
                  )}
                </div>
              )}

              {/* 規格和編號 */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div>規格：{product.volume}</div>
                {product.productCode && <div>產品編號：{product.productCode}</div>}
                {product.pvPoints && <div>PV 點數：{product.pvPoints}</div>}
              </div>
            </div>

            {/* 產品描述 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">產品介紹</h3>
              <p className="text-gray-700 leading-relaxed">
                {product.detailedDescription || product.description}
              </p>
            </div>

            {/* 主要功效 */}
            {(product.mainBenefits?.length || product.benefits?.length) && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">主要功效</h3>
                <ul className="space-y-2">
                  {(product.mainBenefits || product.benefits).map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 產品特色標籤 */}
            {product.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">產品特色</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium border border-green-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 詳細資訊 */}
            <div className="space-y-4">
              {/* 香味描述 */}
              {product.aromaDescription && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">香味特色</h4>
                  <p className="text-gray-700 text-sm">{product.aromaDescription}</p>
                </div>
              )}

              {/* 萃取資訊 */}
              {(product.extractionMethod || product.plantPart) && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">產品資訊</h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    {product.extractionMethod && <div>萃取方法：{product.extractionMethod}</div>}
                    {product.plantPart && <div>萃取部位：{product.plantPart}</div>}
                  </div>
                </div>
              )}

              {/* 主要成分 */}
              {product.mainIngredients?.length && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">主要成分</h4>
                  <p className="text-gray-700 text-sm">
                    {product.mainIngredients.join('、')}
                  </p>
                </div>
              )}

              {/* 使用方法 */}
              {product.usageInstructions && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">使用方法</h4>
                  <p className="text-gray-700 text-sm">{product.usageInstructions}</p>
                </div>
              )}

              {/* 注意事項 */}
              {product.cautions?.length && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">注意事項</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {product.cautions.map((caution, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-500 mt-1">⚠</span>
                        <span>{caution}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 操作按鈕 */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex gap-3">
                <button 
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!product.inStock}
                >
                  {product.inStock ? '加入購物車' : '暫時缺貨'}
                </button>
                <button 
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  onClick={onClose}
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // 使用 Portal 渲染到 document.body
  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null
}