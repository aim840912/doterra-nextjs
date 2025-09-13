'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-8 text-center">
          {/* 404 圖示 */}
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl font-bold text-blue-500">404</span>
          </div>

          {/* 標題 */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            找不到頁面
          </h1>
          
          {/* 描述 */}
          <p className="text-gray-600 mb-8">
            很抱歉，您要找的頁面不存在或已經移動到其他位置。讓我們幫您找到正確的方向！
          </p>

          {/* 導航選項 */}
          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link 
                href="/"
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
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
              </Link>
              
              <Link 
                href="/oils"
                className="bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                  />
                </svg>
                精油圖鑑
              </Link>
            </div>
          </div>

          {/* 返回按鈕 */}
          <button
            onClick={() => window.history.back()}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18" 
              />
            </svg>
            返回上一頁
          </button>
        </div>

        {/* 熱門連結 */}
        <div className="mt-8 text-center">
          <h3 className="text-sm font-medium text-gray-500 mb-3">熱門頁面</h3>
          <div className="flex flex-wrap justify-center gap-2">
            <Link 
              href="/oils?category=single-oils" 
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              單方精油
            </Link>
            <span className="text-gray-300">•</span>
            <Link 
              href="/oils?category=proprietary-blends" 
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              複方精油
            </Link>
            <span className="text-gray-300">•</span>
            <Link 
              href="/oils?collection=onguard" 
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              OnGuard 系列
            </Link>
            <span className="text-gray-300">•</span>
            <Link 
              href="/oils?collection=breathe" 
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Breathe 系列
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}