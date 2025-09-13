'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Oil } from '@/types/oil'

interface SearchSuggestion {
  suggestions: string[]
  query: string
  count: number
  relatedCategories?: string[]
}

interface SearchResult {
  results: Oil[]
  total: number
  query: string
  suggestions: string[]
  stats: {
    queryLength: number
    originalResults: number
    filteredResults: number
    returnedResults: number
  }
}

interface AdvancedSearchProps {
  onSearchResults: (results: Oil[], total: number, query: string) => void
  selectedCategory?: string
  selectedCollection?: string
  placeholder?: string
  className?: string
}

export default function AdvancedSearch({
  onSearchResults,
  selectedCategory = 'all',
  selectedCollection = 'all',
  placeholder = '搜尋精油名稱、功效或英文名稱...',
  className = ''
}: AdvancedSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // 載入搜尋歷史
  useEffect(() => {
    const history = localStorage.getItem('doterra-search-history')
    if (history) {
      try {
        setSearchHistory(JSON.parse(history))
      } catch (error) {
        // 靜默處理載入錯誤，使用空陣列
      }
    }
  }, [])

  // 儲存搜尋歷史
  const saveSearchHistory = useCallback((query: string) => {
    if (!query.trim() || query.length < 2) return
    
    const newHistory = [query, ...searchHistory.filter(item => item !== query)].slice(0, 10)
    setSearchHistory(newHistory)
    localStorage.setItem('doterra-search-history', JSON.stringify(newHistory))
  }, [searchHistory])

  // 獲取搜尋建議（加入防抖）
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions(searchHistory.slice(0, 5))
      return
    }

    // 清除之前的計時器
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current)
    }

    // 設定新的計時器（防抖）
    suggestionTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/products/suggestions?q=${encodeURIComponent(query)}&limit=8`
        )
        
        if (response.ok) {
          const data: { success: boolean; data: SearchSuggestion } = await response.json()
          if (data.success) {
            setSuggestions(data.data.suggestions)
          }
        }
      } catch (error) {
        // 靜默處理搜尋建議錯誤，使用歷史記錄
        setSuggestions(searchHistory.slice(0, 5))
      }
    }, 300) // 300ms 防抖延遲
  }, [searchHistory])

  // 執行搜尋
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      onSearchResults([], 0, '')
      return
    }

    setIsLoading(true)
    
    try {
      const params = new URLSearchParams({
        q: query,
        limit: '50'
      })
      
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }
      
      if (selectedCollection !== 'all') {
        params.append('collection', selectedCollection)
      }

      const response = await fetch(`/api/products/search?${params}`)
      
      if (response.ok) {
        const data: { success: boolean; data: SearchResult } = await response.json()
        if (data.success) {
          onSearchResults(data.data.results, data.data.total, query)
          saveSearchHistory(query)
        } else {
          // API 回應失敗，返回空結果
          onSearchResults([], 0, query)
        }
      } else {
        // API 請求失敗，返回空結果
        onSearchResults([], 0, query)
      }
    } catch (error) {
      // 靜默處理搜尋錯誤，返回空結果
      onSearchResults([], 0, query)
    } finally {
      setIsLoading(false)
    }
  }, [onSearchResults, selectedCategory, selectedCollection, saveSearchHistory])

  // 處理輸入變化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    
    // 即時搜尋建議
    if (value.length >= 1) {
      fetchSuggestions(value)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
      setSuggestions([])
    }
  }

  // 處理搜尋提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      performSearch(searchTerm.trim())
      setShowSuggestions(false)
    }
  }

  // 處理建議點擊
  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion)
    performSearch(suggestion)
    setShowSuggestions(false)
    searchInputRef.current?.focus()
  }

  // 處理鍵盤操作
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  // 點擊外部關閉建議
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        !searchInputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 清理計時器
  useEffect(() => {
    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className={`relative ${className}`}>
      {/* 搜尋表單 */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (searchTerm.length >= 1 || searchHistory.length > 0) {
                setShowSuggestions(true)
                if (searchTerm.length >= 1) {
                  fetchSuggestions(searchTerm)
                } else {
                  setSuggestions(searchHistory.slice(0, 5))
                }
              }
            }}
            className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
            disabled={isLoading}
          />
          
          {/* 搜尋按鈕 */}
          <button
            type="submit"
            disabled={isLoading || !searchTerm.trim()}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-green-500 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </button>
        </div>
      </form>

      {/* 搜尋建議下拉選單 */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 text-gray-700"
            >
              <div className="flex items-center justify-between">
                <span>{suggestion}</span>
                {searchHistory.includes(suggestion) && (
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
            </button>
          ))}
          
          {/* 清除歷史記錄按鈕 */}
          {searchHistory.length > 0 && (
            <div className="border-t border-gray-200 p-2">
              <button
                type="button"
                onClick={() => {
                  setSearchHistory([])
                  localStorage.removeItem('doterra-search-history')
                  setShowSuggestions(false)
                }}
                className="w-full px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                清除搜尋歷史
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}