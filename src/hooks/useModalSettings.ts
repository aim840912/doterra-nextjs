'use client'

import { useState, useEffect, useCallback } from 'react'

export interface ModalDisplaySettings {
  // 產品資訊組
  showProductCode: boolean       // 產品編號
  showPvPoints: boolean          // PV點數
  showPrice: boolean             // 價格資訊
  // 詳細資訊組
  showIntroduction: boolean      // 精油介紹
  showBenefits: boolean          // 主要功效
  showAroma: boolean             // 香味特色
  showExtraction: boolean        // 精油資訊
  showIngredients: boolean       // 主要成分
  showUsage: boolean             // 使用方法
  showCautions: boolean          // 注意事項
}

// 預設全部顯示
const DEFAULT_SETTINGS: ModalDisplaySettings = {
  showProductCode: true,
  showPvPoints: true,
  showPrice: true,
  showIntroduction: true,
  showBenefits: true,
  showAroma: true,
  showExtraction: true,
  showIngredients: true,
  showUsage: true,
  showCautions: true
}

const STORAGE_KEY = 'doterra-modal-settings'

export function useModalSettings() {
  const [settings, setSettings] = useState<ModalDisplaySettings>(DEFAULT_SETTINGS)
  const [isLoaded, setIsLoaded] = useState(false)

  // 從 localStorage 載入設定
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY)
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        // 確保所有必要欄位都存在（向後相容性）
        const mergedSettings = { ...DEFAULT_SETTINGS, ...parsed }
        setSettings(mergedSettings)
      }
    } catch (error) {
      // 靜默處理載入錯誤，使用預設設定
      setSettings(DEFAULT_SETTINGS)
    }
    setIsLoaded(true)
  }, [])

  // 儲存設定到 localStorage
  const saveSettings = useCallback((newSettings: ModalDisplaySettings) => {
    try {
      const settingsWithTimestamp = {
        ...newSettings,
        lastUpdated: new Date().toISOString()
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsWithTimestamp))
      setSettings(newSettings)
    } catch (error) {
      // 靜默處理儲存錯誤，維持現有設定
    }
  }, [])

  // 更新單一設定
  const updateSetting = useCallback((key: keyof ModalDisplaySettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value }
    saveSettings(newSettings)
  }, [settings, saveSettings])

  // 批次更新設定
  const updateSettings = useCallback((newSettings: Partial<ModalDisplaySettings>) => {
    const mergedSettings = { ...settings, ...newSettings }
    saveSettings(mergedSettings)
  }, [settings, saveSettings])

  // 重置為預設設定
  const resetSettings = useCallback(() => {
    saveSettings(DEFAULT_SETTINGS)
  }, [saveSettings])

  // 全選
  const selectAll = useCallback(() => {
    const allTrueSettings = Object.keys(DEFAULT_SETTINGS).reduce((acc, key) => {
      acc[key as keyof ModalDisplaySettings] = true
      return acc
    }, {} as ModalDisplaySettings)
    saveSettings(allTrueSettings)
  }, [saveSettings])

  // 全不選
  const selectNone = useCallback(() => {
    const allFalseSettings = Object.keys(DEFAULT_SETTINGS).reduce((acc, key) => {
      acc[key as keyof ModalDisplaySettings] = false
      return acc
    }, {} as ModalDisplaySettings)
    saveSettings(allFalseSettings)
  }, [saveSettings])

  // 獲取分組設定
  const getProductInfoSettings = useCallback(() => ({
    showProductCode: settings.showProductCode,
    showPvPoints: settings.showPvPoints,
    showPrice: settings.showPrice
  }), [settings])

  const getDetailInfoSettings = useCallback(() => ({
    showIntroduction: settings.showIntroduction,
    showBenefits: settings.showBenefits,
    showAroma: settings.showAroma,
    showExtraction: settings.showExtraction,
    showIngredients: settings.showIngredients,
    showUsage: settings.showUsage,
    showCautions: settings.showCautions
  }), [settings])

  // 檢查是否全部啟用
  const isAllSelected = useCallback(() => {
    return Object.values(settings).every(value => value === true)
  }, [settings])

  // 檢查是否全部停用
  const isNoneSelected = useCallback(() => {
    return Object.values(settings).every(value => value === false)
  }, [settings])

  return {
    settings,
    isLoaded,
    updateSetting,
    updateSettings,
    resetSettings,
    selectAll,
    selectNone,
    getProductInfoSettings,
    getDetailInfoSettings,
    isAllSelected: isAllSelected(),
    isNoneSelected: isNoneSelected()
  }
}