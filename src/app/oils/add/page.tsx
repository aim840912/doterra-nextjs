import { Metadata } from 'next'
import AddOilForm from '@/components/AddOilForm'

export const metadata: Metadata = {
  title: '新增精油 - doTERRA Taiwan',
  description: '新增精油到精油圖鑑中',
}

export default function AddOilPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* 頁面標題區域 */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
              新增精油
            </h1>
          </div>
        </div>
      </div>

      {/* 主要內容區域 */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <AddOilForm />
        </div>
      </div>
    </div>
  )
}