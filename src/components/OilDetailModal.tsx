'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { Oil } from '@/types/oil'

interface OilDetailModalProps {
  oil: Oil
  isOpen: boolean
  onClose: () => void
  isFavorite?: boolean
  onToggleFavorite?: (oilId: string) => void
}

export default function OilDetailModal({ 
  oil, 
  isOpen, 
  onClose, 
  isFavorite = false, 
  onToggleFavorite 
}: OilDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // 處理收藏點擊
  const handleFavoriteClick = () => {
    onToggleFavorite?.(oil.id)
  }

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
      case 'single-oils':  // 改為 JSON 實際使用的值
      case 'essential-oils':  // 保持向後相容
        return 'bg-green-100 text-green-800'
      case 'blends':
      case 'proprietary-blends':
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
      case 'single-oils':  // 改為 JSON 實際使用的值
      case 'essential-oils':  // 保持向後相容
        return '單方精油'
      case 'blends':
      case 'proprietary-blends':
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
        {/* 收藏星星按鈕 */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-4 left-4 z-10 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 transition-all duration-200 shadow-lg group/star"
          title={isFavorite ? '移除收藏' : '加入收藏'}
          aria-label={isFavorite ? '移除收藏' : '加入收藏'}
        >
          {isFavorite ? (
            <svg 
              className="w-6 h-6 text-yellow-400 group-hover/star:scale-110 transition-transform duration-200" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ) : (
            <svg 
              className="w-6 h-6 text-gray-600 hover:text-yellow-400 group-hover/star:scale-110 transition-all duration-200" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 20 20"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          )}
        </button>

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
          {/* 左側 - 精油圖片 */}
          <div className="lg:w-1/2 bg-gray-50 flex items-center justify-center p-8">
            <div className="relative w-full max-w-lg aspect-square">
              <Image
                src={oil.imageUrl}
                alt={oil.name}
                fill
                className="object-contain p-2 rounded-xl"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              

              {/* 類別標籤 */}
              <div className="absolute top-4 right-4">
                <span className={`text-sm px-3 py-1 rounded-full font-medium shadow-lg ${getBadgeColor(oil.category)}`}>
                  {getCategoryName(oil.category)}
                </span>
              </div>
            </div>
          </div>

          {/* 右側 - 精油資訊 */}
          <div className="lg:w-1/2 p-8 overflow-y-auto">
            {/* 精油標題 */}
            <div className="mb-6">
              <div className="mb-2">
                <h1 id="modal-title" className="text-3xl font-bold text-gray-900">
                  {oil.name}
                </h1>
              </div>
              
              <p className="text-xl text-gray-600 mb-4">
                {oil.englishName}
              </p>
              
              {/* 價格資訊 */}
              {(oil.retailPrice || oil.memberPrice) && (
                <div className="flex items-center gap-4 mb-4">
                  {oil.retailPrice && (
                    <div className="text-gray-600">
                      建議售價: <span className="text-2xl font-bold text-gray-900">NT$ {oil.retailPrice}</span>
                    </div>
                  )}
                  {oil.memberPrice && (
                    <div className="text-green-600">
                      會員價: <span className="text-2xl font-bold">NT$ {oil.memberPrice}</span>
                    </div>
                  )}
                </div>
              )}

              {/* 規格和編號 */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div>規格：{oil.volume}</div>
                {oil.productCode && <div>精油編號：{oil.productCode}</div>}
                {oil.pvPoints && <div>PV 點數：{oil.pvPoints}</div>}
              </div>
            </div>

            {/* 精油描述 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">精油介紹</h3>
              <p className="text-gray-700 leading-relaxed">
                {oil.productIntroduction || oil.detailedDescription || oil.description}
              </p>
            </div>

            {/* 主要功效 */}
            {(oil.mainBenefits?.length || oil.benefits?.length) && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">主要功效</h3>
                <ul className="space-y-2">
                  {(oil.mainBenefits || oil.benefits || []).map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}


            {/* 詳細資訊 */}
            <div className="space-y-4">
              {/* 香味描述 */}
              {oil.aromaDescription && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">香味特色</h4>
                  <p className="text-gray-700 text-sm">{oil.aromaDescription}</p>
                </div>
              )}

              {/* 萃取資訊 */}
              {(oil.extractionMethod || oil.plantPart) && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">精油資訊</h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    {oil.extractionMethod && <div>萃取方法：{oil.extractionMethod}</div>}
                    {oil.plantPart && <div>萃取部位：{oil.plantPart}</div>}
                  </div>
                </div>
              )}

              {/* 主要成分 */}
              {oil.mainIngredients?.length && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">主要成分</h4>
                  <p className="text-gray-700 text-sm">
                    {oil.mainIngredients.join('、')}
                  </p>
                </div>
              )}

              {/* 使用方法 */}
              {oil.usageInstructions && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">使用方法</h4>
                  {Array.isArray(oil.usageInstructions) ? (
                    <ul className="text-sm text-gray-700 space-y-1">
                      {oil.usageInstructions.map((instruction, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">•</span>
                          <span>{instruction}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-700 text-sm">{oil.usageInstructions}</p>
                  )}
                </div>
              )}

              {/* 注意事項 */}
              {oil.cautions && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">注意事項</h4>
                  {Array.isArray(oil.cautions) ? (
                    <ul className="text-sm text-gray-700 space-y-1">
                      {oil.cautions.map((caution, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-red-500 mt-1">⚠</span>
                          <span>{caution}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-red-500 mt-1">⚠</span>
                      <span>{oil.cautions}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 操作按鈕 */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex justify-center gap-4">
                {oil.url && (
                  <a
                    href={oil.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors inline-flex items-center gap-2"
                  >
                    前往產品頁面
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
                <button 
                  className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
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