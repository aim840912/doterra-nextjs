'use client'

import { useState } from 'react'
import OilList from '@/components/OilList'
import ModalSettingsPanel from '@/components/ModalSettingsPanel'
import { allOils } from '@/data/products'

export default function Home() {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* 頁面標題區域 */}
      <div className="bg-white shadow-sm relative">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-800">
              精油圖鑑
            </h1>
          </div>
        </div>

        {/* 設定按鈕 - 固定在右上角 */}
        <button
          onClick={() => setShowSettings(true)}
          className="absolute top-4 right-4 bg-white hover:bg-gray-50 rounded-full p-3 shadow-lg transition-all duration-200 border border-gray-200"
          aria-label="Modal 顯示設定"
          title="自訂 Modal 顯示內容"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* 主要內容區域 */}
      <div className="container mx-auto px-4 py-16 pb-24">
        <OilList oils={allOils} showFilters={true} />
      </div>

      {/* Modal 設定面板 */}
      <ModalSettingsPanel 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </div>
  )
}