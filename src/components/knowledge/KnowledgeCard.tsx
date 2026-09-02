'use client'

import Image from 'next/image'
import { memo } from 'react'
import type { KnowledgeCard as KnowledgeCardType } from '@/types/knowledge'
import {
  getImageBlurDataURL,
  getResponsiveImageSizes,
  handleImageError,
} from '@/lib/image-utils'

interface KnowledgeCardProps {
  card: KnowledgeCardType
  onSelect: (card: KnowledgeCardType) => void
}

const PREVIEW_COUNT = 4

function KnowledgeCard({ card, onSelect }: KnowledgeCardProps) {
  const preview = card.benefits.slice(0, PREVIEW_COUNT)
  const remaining = card.benefits.length - preview.length

  return (
    <article
      onClick={() => onSelect(card)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(card)
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`查看 ${card.name} 的完整內容`}
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden border border-gray-100 flex flex-col h-full focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:outline-none"
    >
      <div className="relative aspect-square bg-gray-50">
        <Image
          src={card.image}
          alt={`${card.name} 精油小知識卡片`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes={getResponsiveImageSizes('card')}
          placeholder="blur"
          blurDataURL={getImageBlurDataURL(card.image)}
          onError={handleImageError}
        />
        <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-mono font-medium px-2 py-1 rounded-md shadow-sm">
          {card.code}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-gray-800">
          {card.name}
          {card.alias && (
            <span className="text-sm font-normal text-gray-500 ml-1.5">
              {card.alias}
            </span>
          )}
        </h3>
        {card.englishName && (
          <p className="text-sm text-gray-500 mb-2">{card.englishName}</p>
        )}

        {card.aromaNotes && (
          <div className="flex flex-wrap gap-1 mb-3">
            {card.aromaNotes.map(note => (
              <span
                key={note}
                className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full"
              >
                {note}
              </span>
            ))}
          </div>
        )}

        <ul className="text-sm text-gray-600 space-y-1 mt-auto">
          {preview.map((benefit, i) => (
            <li key={`${benefit.text}-${i}`} className="flex items-start gap-1.5">
              <span className="text-green-500 mt-0.5" aria-hidden="true">
                ·
              </span>
              <span>{benefit.text}</span>
            </li>
          ))}
        </ul>
        {remaining > 0 && (
          <p className="text-xs text-gray-400 mt-2">還有 {remaining} 項</p>
        )}
      </div>
    </article>
  )
}

export default memo(KnowledgeCard)
