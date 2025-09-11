import { Metadata } from 'next'
import Link from 'next/link'
import ProductList from '@/components/ProductList'
import { allProducts } from '@/data/products'

export const metadata: Metadata = {
  title: '產品目錄 - doTERRA Taiwan',
  description: '探索 doTERRA 全系列精油產品，包含單方精油、複方精油、護膚產品和健康補充品。體驗純淨天然的精油力量。',
  keywords: 'doTERRA, 精油, 產品目錄, 薰衣草, 薄荷, 茶樹, 複方精油, 護膚, 健康',
  openGraph: {
    title: '產品目錄 - doTERRA Taiwan',
    description: '探索 doTERRA 全系列精油產品，體驗純淨天然的精油力量。',
    type: 'website',
  }
}

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* 頁面標題區域 */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-12">
          <div className="flex justify-between items-center max-w-6xl mx-auto">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-800">
              精油產品目錄
            </h1>
            <Link
              href="/products/add"
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md"
            >
              + 新增產品
            </Link>
          </div>
        </div>
      </div>


      {/* 主要內容區域 */}
      <div className="container mx-auto px-4 py-16 pb-24">
        <ProductList products={allProducts} showFilters={true} />
      </div>

    </div>
  )
}