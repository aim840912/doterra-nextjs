'use client'

import { useState, useRef, useEffect } from 'react'

interface CategoryOption {
  value: string
  label: string
}

interface CategorySelectorProps {
  value: string
  onChange: (value: string) => void
  defaultOptions: CategoryOption[]
  placeholder?: string
  className?: string
  required?: boolean
}

export default function CategorySelector({
  value,
  onChange,
  defaultOptions,
  placeholder = "選擇或輸入類別",
  className = "",
  required = false
}: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 找到當前選中的類別標籤
  const selectedLabel = defaultOptions.find(option => option.value === value)?.label || value

  // 篩選選項
  const filteredOptions = defaultOptions.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 檢查是否為自訂類別
  const isCustomCategory = value && !defaultOptions.some(option => option.value === value)

  // 關閉下拉選單
  const closeDropdown = () => {
    setIsOpen(false)
    setSearchTerm('')
    setIsCreatingNew(false)
  }

  // 處理選項選擇
  const handleOptionSelect = (optionValue: string) => {
    onChange(optionValue)
    closeDropdown()
  }

  // 處理自訂類別輸入
  const handleCustomInput = (inputValue: string) => {
    setSearchTerm(inputValue)
    
    // 如果輸入值不在現有選項中，則進入新增模式
    const hasExistingMatch = defaultOptions.some(option => 
      option.label.toLowerCase() === inputValue.toLowerCase() ||
      option.value.toLowerCase() === inputValue.toLowerCase()
    )
    
    setIsCreatingNew(!hasExistingMatch && inputValue.trim().length > 0)
  }

  // 確認新增自訂類別
  const handleCreateCustom = () => {
    if (searchTerm.trim()) {
      // 使用輸入的文字作為類別值（轉換為適合的格式）
      const customValue = searchTerm.trim()
        .toLowerCase()
        .replace(/\s+/g, '_') // 將空格替換為底線
        .replace(/[^a-z0-9_\u4e00-\u9fff]/g, '') // 只保留字母、數字、底線和中文字符
      
      onChange(customValue)
      closeDropdown()
    }
  }

  // 處理鍵盤事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (isCreatingNew && searchTerm.trim()) {
        handleCreateCustom()
      } else if (filteredOptions.length > 0) {
        handleOptionSelect(filteredOptions[0].value)
      }
    } else if (e.key === 'Escape') {
      closeDropdown()
    }
  }

  // 點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeDropdown()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // 開啟時聚焦到搜尋框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* 主要輸入區域 */}
      <div
        className={`w-full px-4 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent ${
          required && !value ? 'border-red-300' : ''
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          {isOpen ? (
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => handleCustomInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="搜尋或輸入新類別..."
              className="flex-1 outline-none bg-transparent text-gray-900 placeholder:text-gray-500"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className={`flex-1 ${value ? 'text-gray-900' : 'text-gray-500'}`}>
              {value ? selectedLabel : placeholder}
              {isCustomCategory && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                  自訂
                </span>
              )}
            </span>
          )}
          
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* 下拉選單 */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {/* 現有選項 */}
          {filteredOptions.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                現有類別
              </div>
              {filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="w-full px-3 py-2 text-left text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                  onClick={() => handleOptionSelect(option.value)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900">{option.label}</span>
                    {value === option.value && (
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* 新增自訂類別選項 */}
          {isCreatingNew && searchTerm.trim() && (
            <div className="py-1 border-t border-gray-200">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                新增類別
              </div>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-green-700 hover:bg-green-50 hover:text-green-800 focus:bg-green-50 focus:text-green-800 focus:outline-none font-medium"
                onClick={handleCreateCustom}
              >
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  新增「{searchTerm.trim()}」
                </div>
              </button>
            </div>
          )}

          {/* 無結果時的提示 */}
          {filteredOptions.length === 0 && !isCreatingNew && (
            <div className="px-3 py-4 text-center text-gray-500">
              <p>找不到相關類別</p>
              <p className="text-sm">輸入新類別名稱以建立</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}