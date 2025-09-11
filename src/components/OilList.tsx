'use client'

import { useState, useMemo } from 'react'
import { Oil, OilCategory } from '@/types/oil'
import OilCard from './OilCard'
import OilDetailModal from './OilDetailModal'

interface OilListProps {
  oils: Oil[]
  showFilters?: boolean
}

const categoryLabels: Record<string, string> = {
  [OilCategory.ESSENTIAL_OILS]: '單方精油',
  [OilCategory.BLENDS]: '複方精油',
  [OilCategory.SKINCARE]: '護膚產品',
  [OilCategory.WELLNESS]: '健康產品',
  [OilCategory.SUPPLEMENTS]: '營養補充',
  [OilCategory.ACCESSORIES]: '配件用品'
}

// 取得類別顯示名稱（支援自訂類別）
const getCategoryLabel = (category: string): string => {
  return categoryLabels[category] || category
}

export default function OilList({ oils, showFilters = true }: OilListProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'category'>('name')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modal 狀態管理
  const [selectedOil, setSelectedOil] = useState<Oil | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 取得所有獨特的類別（包含自訂類別）
  const allCategories = useMemo(() => {
    const uniqueCategories = [...new Set(oils.map(oil => oil.category))]
    return uniqueCategories.sort()
  }, [oils])

  // 篩選和排序精油
  const filteredAndSortedOils = useMemo(() => {
    let filtered = oils

    // 類別篩選
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(oil => oil.category === selectedCategory)
    }

    // 搜尋篩選
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(oil => 
        oil.name.toLowerCase().includes(term) ||
        oil.englishName.toLowerCase().includes(term) ||
        oil.description.toLowerCase().includes(term) ||
        oil.tags?.some(tag => tag.toLowerCase().includes(term)) ||
        oil.mainBenefits?.some(benefit => benefit.toLowerCase().includes(term))
      )
    }

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'category':
          const categoryCompare = getCategoryLabel(a.category).localeCompare(getCategoryLabel(b.category), 'zh-TW')
          if (categoryCompare !== 0) return categoryCompare
          return a.name.localeCompare(b.name, 'zh-TW')
        case 'name':
        default:
          return a.name.localeCompare(b.name, 'zh-TW')
      }
    })

    return filtered
  }, [oils, selectedCategory, sortBy, searchTerm])

  const handleOilSelect = (oil: Oil) => {
    setSelectedOil(oil)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedOil(null)
  }

  return (
    <div className="space-y-6">
      {/* 篩選和搜尋區域 */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 搜尋框 */}
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-800 mb-2">
                搜尋精油
              </label>
              <input
                id="search"
                type="text"
                placeholder="搜尋精油名稱、功效或英文名稱..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
              />
            </div>

            {/* 類別篩選 */}
            <div className="lg:w-48">
              <label htmlFor="category" className="block text-sm font-medium text-gray-800 mb-2">
                精油類別
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
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

            {/* 排序 */}
            <div className="lg:w-40">
              <label htmlFor="sort" className="block text-sm font-medium text-gray-800 mb-2">
                排序方式
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              >
                <option value="name">名稱 A-Z</option>
                <option value="category">按類別分組</option>
              </select>
            </div>
          </div>

          {/* 快速類別標籤 */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              全部精油
            </button>
            {allCategories.map(category => {
              const count = oils.filter(oil => oil.category === category).length
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {getCategoryLabel(category)} ({count})
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 搜尋結果統計 */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          共找到 <span className="font-semibold text-green-600">{filteredAndSortedOils.length}</span> 項精油
          {searchTerm && (
            <>
              ，搜尋「<span className="font-medium">{searchTerm}</span>」
            </>
          )}
        </p>
        
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            清除搜尋
          </button>
        )}
      </div>

      {/* 精油網格 */}
      {filteredAndSortedOils.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedOils.map(oil => (
            <OilCard
              key={oil.id}
              oil={oil}
              onSelect={handleOilSelect}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">找不到相關精油</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? `沒有找到包含「${searchTerm}」的精油，請嘗試其他關鍵字。`
                : '該類別暫無精油，請選擇其他類別。'
              }
            </p>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('all')
              }}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              查看全部精油
            </button>
          </div>
        </div>
      )}

      {/* 精油詳情 Modal */}
      {selectedOil && (
        <OilDetailModal
          oil={selectedOil}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}