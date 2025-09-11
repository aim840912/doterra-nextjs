import { Metadata } from 'next'
import Link from 'next/link'
import OilList from '@/components/OilList'
import { allOils } from '@/data/products'

export const metadata: Metadata = {
  title: '精油圖鑑 - doTERRA Taiwan',
  description: '探索 doTERRA 全系列精油，包含單方精油、複方精油、護膚精油和健康精油。了解純淨天然的精油特性與功效。',
  keywords: 'doTERRA, 精油, 精油圖鑑, 薰衣草, 薄荷, 茶樹, 複方精油, 精油介紹, 精油功效',
  openGraph: {
    title: '精油圖鑑 - doTERRA Taiwan',
    description: '探索 doTERRA 全系列精油，了解純淨天然的精油特性與功效。',
    type: 'website',
  }
}

export default function OilsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* 頁面標題區域 */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-12">
          <div className="flex justify-between items-center max-w-6xl mx-auto">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-800">
              精油圖鑑
            </h1>
            <Link
              href="/oils/add"
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md"
            >
              + 新增精油
            </Link>
          </div>
        </div>
      </div>


      {/* 主要內容區域 */}
      <div className="container mx-auto px-4 py-16 pb-24">
        <OilList oils={allOils} showFilters={true} />
      </div>

    </div>
  )
}