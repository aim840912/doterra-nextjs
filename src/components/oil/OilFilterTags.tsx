'use client'

import React, { memo } from 'react'
import { Oil } from '@/types/oil'
import { 
  getCategoryLabel, 
  getCategoryColor, 
  getCollectionLabel, 
  getCollectionColor 
} from './utils/categoryHelpers'
import { 
  getUniqueCategories, 
  getUniqueCollections, 
  getCategoryCount, 
  getCollectionCount 
} from './utils/filterHelpers'

interface OilFilterTagsProps {
  oils: Oil[]
  selectedCategory: string | 'all'
  selectedCollection: string | 'all'
  onCategoryChange: (category: string | 'all') => void
  onCollectionChange: (collection: string | 'all') => void
  className?: string
}

const OilFilterTags = memo(function OilFilterTags({
  oils,
  selectedCategory,
  selectedCollection,
  onCategoryChange,
  onCollectionChange,
  className = ''
}: OilFilterTagsProps) {
  const allCategories = getUniqueCategories(oils)
  const allCollections = getUniqueCollections(oils)

  const handleCategoryClick = (category: string) => {
    onCategoryChange(category)
    onCollectionChange('all') // 重置系列選擇
  }

  const handleCollectionClick = (collection: string) => {
    onCollectionChange(collection)
    onCategoryChange('all') // 重置類別選擇
  }

  const handleAllClick = () => {
    onCategoryChange('all')
    onCollectionChange('all')
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 類別標籤 */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">精油類別</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleAllClick}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all' && selectedCollection === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            全部精油
          </button>
          {allCategories.map(category => {
            const count = getCategoryCount(oils, category)
            return (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  getCategoryColor(category, selectedCategory === category)
                }`}
              >
                {getCategoryLabel(category)} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* 產品系列標籤 */}
      {allCollections.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">產品系列</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onCollectionChange('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCollection === 'all'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              全部系列
            </button>
            {allCollections.map(collection => {
              const count = getCollectionCount(oils, collection)
              return (
                <button
                  key={collection}
                  onClick={() => handleCollectionClick(collection)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    getCollectionColor(collection, selectedCollection === collection)
                  }`}
                >
                  {getCollectionLabel(collection)} ({count})
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
})

export default OilFilterTags