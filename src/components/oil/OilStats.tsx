'use client'

import React, { memo } from 'react'
import { getCategoryLabel, getCollectionLabel } from './utils/categoryHelpers'

interface OilStatsProps {
  filteredCount: number
  selectedCategory: string | 'all'
  selectedCollection: string | 'all'
  searchTerm?: string
  currentSearchQuery?: string
  favorites?: string[]
  onClearFilters?: () => void
  onClearFavorites?: () => void
  className?: string
}

const OilStats = memo(function OilStats({
  filteredCount,
  selectedCategory,
  selectedCollection,
  searchTerm,
  currentSearchQuery,
  favorites = [],
  onClearFilters,
  onClearFavorites,
  className = ''
}: OilStatsProps) {
  
  const hasFilters = searchTerm || selectedCategory !== 'all' || selectedCollection !== 'all'
  
  const handleClearFavorites = () => {
    if (onClearFavorites && favorites.length > 0) {
      if (confirm(`確定要清除所有 ${favorites.length} 個收藏嗎？此操作無法復原。`)) {
        onClearFavorites()
      }
    }
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-4">
        {/* 主要統計資訊 */}
        <p className="text-gray-600">
          共找到 <span className="font-semibold text-green-600">{filteredCount}</span> 項精油
          {selectedCategory !== 'all' && (
            <>
              ，類別「<span className="font-medium">{getCategoryLabel(selectedCategory)}</span>」
            </>
          )}
          {selectedCollection !== 'all' && (
            <>
              ，系列「<span className="font-medium">{getCollectionLabel(selectedCollection)}</span>」
            </>
          )}
          {searchTerm && (
            <>
              ，搜尋「<span className="font-medium">{searchTerm}</span>」
            </>
          )}
          {currentSearchQuery && (
            <>
              ，搜尋「<span className="font-medium">{currentSearchQuery}</span>」
            </>
          )}
        </p>
        
        {/* 收藏統計 */}
        {favorites.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-yellow-600">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>{favorites.length} 個收藏</span>
            </div>
            <button
              onClick={handleClearFavorites}
              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-md transition-colors flex items-center gap-1"
              title="清除所有收藏"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              清除全部
            </button>
          </div>
        )}
      </div>
      
      {/* 清除篩選按鈕 */}
      {hasFilters && onClearFilters && (
        <button
          onClick={onClearFilters}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          清除所有篩選
        </button>
      )}
    </div>
  )
})

export default OilStats