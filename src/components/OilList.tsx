'use client'

import { useState, useMemo } from 'react'
import { Oil, OilCategory } from '@/types/oil'
import OilCard from './OilCard'
import OilDetailModal from './OilDetailModal'
import { useFavorites } from '@/hooks/useFavorites'

interface OilListProps {
  oils: Oil[]
  showFilters?: boolean
}

const categoryLabels: Record<string, string> = {
  [OilCategory.ESSENTIAL_OILS]: '單方精油',
  'single-oils': '單方精油',  // 支援實際的資料格式
  [OilCategory.BLENDS]: '複方精油',
  'proprietary-blends': '複方精油',  // 支援實際的資料格式
  [OilCategory.SKINCARE]: '護膚產品',
  [OilCategory.WELLNESS]: '健康產品',
  [OilCategory.SUPPLEMENTS]: '營養補充',
  [OilCategory.ACCESSORIES]: '配件用品'
}

// 取得類別顯示名稱（支援自訂類別）
const getCategoryLabel = (category: string): string => {
  return categoryLabels[category] || category
}

// 取得類別顏色配置（與 OilCard 保持一致）
const getCategoryColor = (category: string, isSelected: boolean = false) => {
  const baseColors: Record<string, { normal: string; selected: string }> = {
    'single-oils': {
      normal: 'bg-green-100 text-green-800 hover:bg-green-200',
      selected: 'bg-green-600 text-white'
    },
    'essential-oils': {
      normal: 'bg-green-100 text-green-800 hover:bg-green-200',
      selected: 'bg-green-600 text-white'
    },
    'blends': {
      normal: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      selected: 'bg-blue-600 text-white'
    },
    'proprietary-blends': {
      normal: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      selected: 'bg-blue-600 text-white'
    },
    'skincare': {
      normal: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
      selected: 'bg-purple-600 text-white'
    },
    'wellness': {
      normal: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
      selected: 'bg-orange-600 text-white'
    },
    'supplements': {
      normal: 'bg-red-100 text-red-800 hover:bg-red-200',
      selected: 'bg-red-600 text-white'
    },
    'accessories': {
      normal: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
      selected: 'bg-gray-600 text-white'
    }
  }

  const colors = baseColors[category] || {
    normal: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    selected: 'bg-gray-600 text-white'
  }

  return isSelected ? colors.selected : colors.normal
}

export default function OilList({ oils, showFilters = true }: OilListProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all')
  const [selectedCollection, setSelectedCollection] = useState<string | 'all'>('all')
  const [sortBy] = useState<'name' | 'category'>('name')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modal 狀態管理
  const [selectedOil, setSelectedOil] = useState<Oil | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 收藏功能
  const { favorites, isFavorite, toggleFavorite, clearAllFavorites } = useFavorites()

  // 取得所有獨特的類別（僅包含精油類別）
  const allCategories = useMemo(() => {
    // 精油類別白名單 - 只保留真正的精油類別
    const ESSENTIAL_OIL_CATEGORIES = ['single-oils', 'proprietary-blends']
    const uniqueCategories = [...new Set(oils.map(oil => oil.category))]
    return uniqueCategories.filter(category => ESSENTIAL_OIL_CATEGORIES.includes(category)).sort()
  }, [oils])

  // 取得所有獨特的系列（collections）
  const allCollections = useMemo(() => {
    const uniqueCollections = new Set<string>()
    oils.forEach(oil => {
      if (oil.collections && oil.collections.length > 0) {
        oil.collections.forEach(collection => uniqueCollections.add(collection))
      }
    })
    return Array.from(uniqueCollections).sort()
  }, [oils])

  // 系列標籤的顯示名稱
  const getCollectionLabel = (collection: string): string => {
    const collectionLabels: Record<string, string> = {
      'onguard': 'OnGuard 保衛系列',
      'deep-blue': 'Deep Blue 舒緩系列',
      'breathe': 'Breathe 順暢呼吸系列',
      'food': 'Food 食品級系列'
    }
    return collectionLabels[collection] || collection
  }

  // 系列標籤的顏色配置
  const getCollectionColor = (collection: string, isSelected: boolean = false) => {
    const baseColors: Record<string, { normal: string; selected: string }> = {
      'onguard': {
        normal: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
        selected: 'bg-orange-600 text-white'
      },
      'deep-blue': {
        normal: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
        selected: 'bg-blue-600 text-white'
      },
      'breathe': {
        normal: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200',
        selected: 'bg-cyan-600 text-white'
      },
      'food': {
        normal: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
        selected: 'bg-emerald-600 text-white'
      }
    }

    const colors = baseColors[collection] || {
      normal: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
      selected: 'bg-gray-600 text-white'
    }

    return isSelected ? colors.selected : colors.normal
  }

  // 篩選和排序精油
  const filteredAndSortedOils = useMemo(() => {
    let filtered = oils

    // 類別篩選
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(oil => oil.category === selectedCategory)
    }

    // 系列篩選
    if (selectedCollection !== 'all') {
      filtered = filtered.filter(oil => 
        oil.collections && oil.collections.includes(selectedCollection)
      )
    }

    // 搜尋篩選
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(oil => 
        oil.name.toLowerCase().includes(term) ||
        oil.englishName.toLowerCase().includes(term) ||
        oil.description.toLowerCase().includes(term) ||
        oil.tags?.some(tag => tag.toLowerCase().includes(term)) ||
        oil.mainBenefits?.some(benefit => benefit.toLowerCase().includes(term)) ||
        oil.collections?.some(collection => getCollectionLabel(collection).toLowerCase().includes(term))
      )
    }

    // 排序
    filtered.sort((a, b) => {
      // 優先級1: 收藏狀態 (收藏的精油優先顯示)
      const aIsFavorite = favorites.includes(a.id)
      const bIsFavorite = favorites.includes(b.id)
      
      if (aIsFavorite && !bIsFavorite) return -1
      if (!aIsFavorite && bIsFavorite) return 1
      
      // 優先級2: 根據選擇的排序方式
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
  }, [oils, selectedCategory, selectedCollection, sortBy, searchTerm, favorites])

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

            {/* 系列篩選 */}
            <div className="lg:w-52">
              <label htmlFor="collection" className="block text-sm font-medium text-gray-800 mb-2">
                產品系列
              </label>
              <select
                id="collection"
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
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

            {/* 排序 - 暫時隱藏 */}
            {/* <div className="lg:w-40">
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
            </div> */}
          </div>

          {/* 快速類別標籤 */}
          <div className="mt-4 space-y-3">
            {/* 類別標籤 */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">精油類別</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setSelectedCategory('all')
                    setSelectedCollection('all')
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === 'all' && selectedCollection === 'all'
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
                      onClick={() => {
                        setSelectedCategory(category)
                        setSelectedCollection('all')
                      }}
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
                    onClick={() => setSelectedCollection('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCollection === 'all'
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    全部系列
                  </button>
                  {allCollections.map(collection => {
                    const count = oils.filter(oil => 
                      oil.collections && oil.collections.includes(collection)
                    ).length
                    return (
                      <button
                        key={collection}
                        onClick={() => {
                          setSelectedCollection(collection)
                          setSelectedCategory('all')
                        }}
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
        </div>
      )}

      {/* 搜尋結果統計 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-gray-600">
            共找到 <span className="font-semibold text-green-600">{filteredAndSortedOils.length}</span> 項精油
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
                onClick={() => {
                  if (confirm(`確定要清除所有 ${favorites.length} 個收藏嗎？此操作無法復原。`)) {
                    clearAllFavorites()
                  }
                }}
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
        
        {(searchTerm || selectedCategory !== 'all' || selectedCollection !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('')
              setSelectedCategory('all')
              setSelectedCollection('all')
            }}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            清除所有篩選
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
              isFavorite={isFavorite(oil.id)}
              onToggleFavorite={toggleFavorite}
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
                : selectedCategory !== 'all' && selectedCollection !== 'all'
                  ? `類別「${getCategoryLabel(selectedCategory)}」和系列「${getCollectionLabel(selectedCollection)}」的組合暫無精油。`
                  : selectedCategory !== 'all'
                    ? `類別「${getCategoryLabel(selectedCategory)}」暫無精油，請選擇其他類別。`
                    : selectedCollection !== 'all'
                      ? `系列「${getCollectionLabel(selectedCollection)}」暫無精油，請選擇其他系列。`
                      : '該篩選條件暫無精油。'
              }
            </p>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('all')
                setSelectedCollection('all')
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
          isFavorite={isFavorite(selectedOil.id)}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </div>
  )
}