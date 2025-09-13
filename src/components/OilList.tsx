'use client'

import { useState, useMemo, useCallback } from 'react'
import { Oil } from '@/types/oil'
import OilDetailModal from './OilDetailModal'
import { useFavorites } from '@/hooks/useFavorites'

// 重構後的子元件
import OilFilters from './oil/OilFilters'
import OilSearchBar from './oil/OilSearchBar'
import OilFilterTags from './oil/OilFilterTags'
import OilStats from './oil/OilStats'
import OilGrid from './oil/OilGrid'

// 工具函數
import { filterAndSortOils } from './oil/utils/filterHelpers'

interface OilListProps {
  oils: Oil[]
  showFilters?: boolean
  isLoading?: boolean
}

export default function OilList({ oils, showFilters = true, isLoading = false }: OilListProps) {
  // 篩選狀態
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all')
  const [selectedCollection, setSelectedCollection] = useState<string | 'all'>('all')
  const [sortBy] = useState<'name' | 'category'>('name')
  const [searchTerm, setSearchTerm] = useState('')
  
  // 搜尋結果狀態
  const [searchResults, setSearchResults] = useState<Oil[]>([])
  const [searchTotal, setSearchTotal] = useState(0)
  const [currentSearchQuery, setCurrentSearchQuery] = useState('')
  
  // Modal 狀態管理
  const [selectedOil, setSelectedOil] = useState<Oil | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 收藏功能
  const { favorites, isFavorite, toggleFavorite, clearAllFavorites } = useFavorites()

  // 處理搜尋結果
  const handleSearchResults = useCallback((results: Oil[], total: number, query: string) => {
    setSearchResults(results)
    setSearchTotal(total)
    setCurrentSearchQuery(query)
  }, [])

  // 清除搜尋
  const handleClearSearch = useCallback(() => {
    setCurrentSearchQuery('')
    setSearchResults([])
    setSearchTotal(0)
  }, [])

  // 清除所有篩選
  const handleClearFilters = useCallback(() => {
    setSearchTerm('')
    setSelectedCategory('all')
    setSelectedCollection('all')
    handleClearSearch()
  }, [handleClearSearch])

  // 篩選和排序精油 - 使用工具函數
  const filteredAndSortedOils = useMemo(() => {
    return filterAndSortOils(oils, {
      selectedCategory,
      selectedCollection,
      searchTerm,
      searchResults,
      currentSearchQuery,
      sortBy,
      favorites
    })
  }, [oils, selectedCategory, selectedCollection, sortBy, searchTerm, favorites, currentSearchQuery, searchResults])

  // Modal 處理
  const handleOilSelect = useCallback((oil: Oil) => {
    setSelectedOil(oil)
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedOil(null)
  }, [])

  return (
    <div className="space-y-6">
      {/* 篩選和搜尋區域 */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 搜尋欄 */}
            <OilSearchBar
              onSearchResults={handleSearchResults}
              selectedCategory={selectedCategory}
              selectedCollection={selectedCollection}
              currentSearchResult={currentSearchQuery ? {
                query: currentSearchQuery,
                total: searchTotal
              } : null}
              onClearSearch={handleClearSearch}
              className="flex-1"
            />

            {/* 篩選器 */}
            <OilFilters
              oils={oils}
              selectedCategory={selectedCategory}
              selectedCollection={selectedCollection}
              onCategoryChange={setSelectedCategory}
              onCollectionChange={setSelectedCollection}
            />
          </div>

          {/* 快速篩選標籤 */}
          <OilFilterTags
            oils={oils}
            selectedCategory={selectedCategory}
            selectedCollection={selectedCollection}
            onCategoryChange={setSelectedCategory}
            onCollectionChange={setSelectedCollection}
            className="mt-4"
          />
        </div>
      )}

      {/* 統計資訊 */}
      <OilStats
        filteredCount={filteredAndSortedOils.length}
        selectedCategory={selectedCategory}
        selectedCollection={selectedCollection}
        searchTerm={searchTerm}
        currentSearchQuery={currentSearchQuery}
        favorites={favorites}
        onClearFilters={handleClearFilters}
        onClearFavorites={clearAllFavorites}
      />

      {/* 精油網格 */}
      <OilGrid
        oils={filteredAndSortedOils}
        isLoading={isLoading}
        selectedCategory={selectedCategory}
        selectedCollection={selectedCollection}
        searchTerm={searchTerm}
        onOilSelect={handleOilSelect}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        onClearFilters={handleClearFilters}
      />

      {/* 精油詳情 Modal */}
      {selectedOil && (
        <OilDetailModal
          oil={selectedOil}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          isFavorite={isFavorite(selectedOil.id)}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </div>
  )
}