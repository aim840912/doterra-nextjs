'use client'

import React, { memo } from 'react'
import { Oil } from '@/types/oil'
import OilCard from '../OilCard'
import { ProductListSkeleton } from '../ProductSkeleton'
import { getCategoryLabel, getCollectionLabel } from './utils/categoryHelpers'

interface OilGridProps {
  oils: Oil[]
  isLoading?: boolean
  selectedCategory?: string | 'all'
  selectedCollection?: string | 'all'
  searchTerm?: string
  onOilSelect: (oil: Oil) => void
  isFavorite: (oilId: string) => boolean
  onToggleFavorite: (oilId: string) => void
  onClearFilters?: () => void
  className?: string
}

const OilGrid = memo(function OilGrid({
  oils,
  isLoading = false,
  selectedCategory = 'all',
  selectedCollection = 'all',
  searchTerm = '',
  onOilSelect,
  isFavorite,
  onToggleFavorite,
  onClearFilters,
  className = ''
}: OilGridProps) {
  
  // 載入狀態
  if (isLoading) {
    return (
      <div className={className}>
        <ProductListSkeleton count={8} />
      </div>
    )
  }
  
  // 有數據的網格
  if (oils.length > 0) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
        {oils.map(oil => (
          <OilCard
            key={oil.id}
            oil={oil}
            onSelect={onOilSelect}
            isFavorite={isFavorite(oil.id)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    )
  }

  // 空結果狀態
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🔍</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">找不到相關精油</h3>
        <p className="text-gray-500 mb-4">
          {searchTerm 
            ? `沒有找到包含「${searchTerm}」的精油，請嘗試其他關鍵字。`
            : selectedCategory !== 'all' && selectedCollection !== 'all'
              ? `類別「${getCategoryLabel(selectedCategory)}」和系列「${getCollectionLabel(selectedCollection)}」的組合暫無精油。`
              : selectedCategory !== 'all'
                ? `類別「${getCategoryLabel(selectedCategory)}」暫無精油，請選擇其他類別。`
                : selectedCollection !== 'all'
                  ? `系列「${getCollectionLabel(selectedCollection)}」暫無精油，請選擇其他系列。`
                  : '該篩選條件暫無精油。'
          }
        </p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            查看全部精油
          </button>
        )}
      </div>
    </div>
  )
})

export default OilGrid