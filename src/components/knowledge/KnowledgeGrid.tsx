'use client'

import { memo } from 'react'
import type { KnowledgeCard as KnowledgeCardType } from '@/types/knowledge'
import KnowledgeCard from './KnowledgeCard'
import { ProductListSkeleton } from '@/components/ProductSkeleton'

interface KnowledgeGridProps {
  cards: KnowledgeCardType[]
  isLoading?: boolean
  hasFilters?: boolean
  onSelect: (card: KnowledgeCardType) => void
  onClearFilters?: () => void
}

function KnowledgeGrid({
  cards,
  isLoading = false,
  hasFilters = false,
  onSelect,
  onClearFilters,
}: KnowledgeGridProps) {
  if (isLoading) return <ProductListSkeleton count={8} />

  if (cards.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">
          {hasFilters ? '沒有符合條件的卡片' : '目前沒有資料'}
        </p>
        {hasFilters && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="text-green-600 hover:text-green-700 font-medium underline underline-offset-4"
          >
            清除所有篩選
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {cards.map(card => (
        <KnowledgeCard key={card.id} card={card} onSelect={onSelect} />
      ))}
    </div>
  )
}

export default memo(KnowledgeGrid)
