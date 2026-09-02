import type { Metadata } from 'next'
import KnowledgeList from '@/components/knowledge/KnowledgeList'
import MedicalDisclaimer from '@/components/knowledge/MedicalDisclaimer'
import { knowledgeByCode } from '@/data/knowledge'

export const metadata: Metadata = {
  title: '精油小知識 | doTERRA Taiwan',
  description:
    '精油小知識資訊卡整理，收錄各種精油的香味描述與坊間流傳的功效說法。內容僅供參考，精油非藥品，不具醫療效能。',
}

export default function KnowledgePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-10 sm:py-12">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-800">
              精油小知識
            </h1>
            <p className="text-gray-600 mt-2">
              共 {knowledgeByCode.length}{' '}
              張資訊卡，可依香味族群與功效主題篩選，點卡片看完整內容與原圖
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 pb-24">
        <div className="max-w-6xl mx-auto">
          <MedicalDisclaimer className="mb-8" />
          <KnowledgeList cards={knowledgeByCode} />
        </div>
      </div>
    </div>
  )
}
