'use client'

import { useModalSettings } from '@/hooks/useModalSettings'
import { useEffect } from 'react'

interface ModalSettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

interface SettingItemProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function SettingItem({ label, checked, onChange }: SettingItemProps) {
  return (
    <label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
      />
      <span className="text-sm text-gray-700 select-none">{label}</span>
    </label>
  )
}

interface SettingGroupProps {
  title: string
  children: React.ReactNode
}

function SettingGroup({ title, children }: SettingGroupProps) {
  return (
    <div className="mb-4">
      <h4 className="text-sm font-medium text-gray-900 mb-3">{title}</h4>
      {children}
    </div>
  )
}

export default function ModalSettingsPanel({ isOpen, onClose }: ModalSettingsPanelProps) {
  const {
    settings,
    isLoaded,
    updateSetting,
    resetSettings,
    selectAll,
    selectNone,
    isAllSelected,
    isNoneSelected
  } = useModalSettings()

  // 處理 ESC 鍵關閉
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])


  if (!isOpen || !isLoaded) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/40" 
        onClick={onClose}
      />
      
      {/* 設定面板 - 加寬以容納兩欄 */}
      <div 
        className="relative bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-sm md:max-w-lg transform transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 標題列 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">顯示設定</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="關閉設定面板"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 設定內容 */}
        <div className="p-4 max-h-[500px] overflow-y-auto">
          {/* 產品資訊組 */}
          <SettingGroup title="產品資訊">
            <SettingItem
              label="產品編號"
              checked={settings.showProductCode}
              onChange={(checked) => updateSetting('showProductCode', checked)}
            />
            <SettingItem
              label="PV點數"
              checked={settings.showPvPoints}
              onChange={(checked) => updateSetting('showPvPoints', checked)}
            />
            <SettingItem
              label="價格資訊"
              checked={settings.showPrice}
              onChange={(checked) => updateSetting('showPrice', checked)}
            />
          </SettingGroup>

          {/* 分隔線 */}
          <div className="border-t border-gray-200 my-4"></div>

          {/* 詳細資訊組 - 改為兩欄顯示 */}
          <SettingGroup title="詳細資訊">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
              <SettingItem
                label="精油介紹"
                checked={settings.showIntroduction}
                onChange={(checked) => updateSetting('showIntroduction', checked)}
              />
              <SettingItem
                label="主要功效"
                checked={settings.showBenefits}
                onChange={(checked) => updateSetting('showBenefits', checked)}
              />
              <SettingItem
                label="香味特色"
                checked={settings.showAroma}
                onChange={(checked) => updateSetting('showAroma', checked)}
              />
              <SettingItem
                label="精油資訊"
                checked={settings.showExtraction}
                onChange={(checked) => updateSetting('showExtraction', checked)}
              />
              <SettingItem
                label="主要成分"
                checked={settings.showIngredients}
                onChange={(checked) => updateSetting('showIngredients', checked)}
              />
              <SettingItem
                label="使用方法"
                checked={settings.showUsage}
                onChange={(checked) => updateSetting('showUsage', checked)}
              />
              <SettingItem
                label="注意事項"
                checked={settings.showCautions}
                onChange={(checked) => updateSetting('showCautions', checked)}
              />
            </div>
          </SettingGroup>
        </div>

        {/* 操作按鈕 */}
        <div className="flex gap-2 p-4 border-t border-gray-200">
          <button
            onClick={selectAll}
            disabled={isAllSelected}
            className="flex-1 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            全選
          </button>
          <button
            onClick={selectNone}
            disabled={isNoneSelected}
            className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            全不選
          </button>
          <button
            onClick={resetSettings}
            className="flex-1 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            重置
          </button>
        </div>

        {/* 響應式提示 */}
        <div className="p-3 bg-gray-50 text-xs text-gray-600 border-t border-gray-200 rounded-b-lg">
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            設定會自動儲存，並在下次開啟時記住您的偏好
          </div>
        </div>
      </div>
    </div>
  )
}