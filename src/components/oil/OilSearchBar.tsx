'use client'

import React, { memo } from 'react'
import { Oil } from '@/types/oil'
import AdvancedSearch from '../AdvancedSearch'

interface SearchResult {
  query: string
  total: number
}

interface OilSearchBarProps {
  onSearchResults: (results: Oil[], total: number, query: string) => void
  selectedCategory: string | 'all'
  selectedCollection: string | 'all'
  currentSearchResult?: SearchResult | null
  onClearSearch?: () => void
  placeholder?: string
  className?: string
}

const OilSearchBar = memo(function OilSearchBar({
  onSearchResults,
  selectedCategory,
  selectedCollection,
  currentSearchResult,
  onClearSearch,
  placeholder = "搜尋精油名稱、功效或英文名稱...",
  className = ''
}: OilSearchBarProps) {
  
  const handleClearSearch = () => {
    if (onClearSearch) {
      onClearSearch()
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 搜尋輸入框 */}
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-800 mb-2">
          搜尋精油
        </label>
        <AdvancedSearch
          onSearchResults={onSearchResults}
          selectedCategory={selectedCategory}
          selectedCollection={selectedCollection}
          placeholder={placeholder}
          className="w-full"
        />
      </div>

      {/* 搜尋結果狀態 */}
      {currentSearchResult && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-sm font-medium text-blue-700">
                搜尋「{currentSearchResult.query}」找到 {currentSearchResult.total} 個結果
              </span>
            </div>
            <button
              onClick={handleClearSearch}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              清除搜尋
            </button>
          </div>
        </div>
      )}
    </div>
  )
})

export default OilSearchBar