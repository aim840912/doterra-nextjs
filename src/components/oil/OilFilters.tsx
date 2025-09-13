'use client'

import React, { memo } from 'react'
import { Oil } from '@/types/oil'
import { getCategoryLabel, getCollectionLabel } from './utils/categoryHelpers'
import { getUniqueCategories, getUniqueCollections } from './utils/filterHelpers'

interface OilFiltersProps {
  oils: Oil[]
  selectedCategory: string | 'all'
  selectedCollection: string | 'all'
  onCategoryChange: (category: string | 'all') => void
  onCollectionChange: (collection: string | 'all') => void
  className?: string
}

const OilFilters = memo(function OilFilters({
  oils,
  selectedCategory,
  selectedCollection,
  onCategoryChange,
  onCollectionChange,
  className = ''
}: OilFiltersProps) {
  const allCategories = getUniqueCategories(oils)
  const allCollections = getUniqueCollections(oils)

  return (
    <div className={`flex flex-col lg:flex-row gap-4 ${className}`}>
      {/* 類別篩選 */}
      <div className="lg:w-48">
        <label htmlFor="category" className="block text-sm font-medium text-gray-800 mb-2">
          精油類別
        </label>
        <select
          id="category"
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
        >
          <option value="all">全部類別</option>
          {allCategories.map(category => (
            <option key={category} value={category}>
              {getCategoryLabel(category)}
            </option>
          ))}
        </select>
      </div>

      {/* 系列篩選 */}
      <div className="lg:w-52">
        <label htmlFor="collection" className="block text-sm font-medium text-gray-800 mb-2">
          產品系列
        </label>
        <select
          id="collection"
          value={selectedCollection}
          onChange={(e) => onCollectionChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
        >
          <option value="all">全部系列</option>
          {allCollections.map(collection => (
            <option key={collection} value={collection}>
              {getCollectionLabel(collection)}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
})

export default OilFilters