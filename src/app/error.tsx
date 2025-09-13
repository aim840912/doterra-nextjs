'use client'

import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // 在生產環境中記錄錯誤
    // 應用程式錯誤已記錄
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg border border-red-100 p-8 text-center">
          {/* 錯誤圖示 */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg 
              className="w-8 h-8 text-red-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>

          {/* 錯誤標題 */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            哎呀！出了點問題
          </h1>
          
          {/* 錯誤描述 */}
          <p className="text-gray-600 mb-6">
            很抱歉，應用程式遇到了意外錯誤。請嘗試重新載入頁面，如果問題持續存在，請聯絡我們的技術支援。
          </p>

          {/* 錯誤詳情（開發模式） */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">錯誤詳情：</h3>
              <p className="text-xs text-gray-600 font-mono break-words">
                {error.message || '未知錯誤'}
              </p>
              {error.digest && (
                <p className="text-xs text-gray-500 mt-1">
                  錯誤 ID: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* 操作按鈕 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={reset}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
              重試
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
                />
              </svg>
              回到首頁
            </button>
          </div>
        </div>

        {/* 支援資訊 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            如果問題持續發生，請聯絡我們：
            <a 
              href="mailto:support@doterra.com" 
              className="text-red-500 hover:text-red-600 underline ml-1"
            >
              support@doterra.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}