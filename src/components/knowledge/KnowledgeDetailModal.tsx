'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import type { KnowledgeBenefit, KnowledgeCard } from '@/types/knowledge'
import { useModalDismiss } from '@/hooks/useModalDismiss'
import { getImageBlurDataURL } from '@/lib/image-utils'
import MedicalDisclaimer from './MedicalDisclaimer'
import KnowledgeLightbox from './KnowledgeLightbox'

interface KnowledgeDetailModalProps {
  card: KnowledgeCard
  isOpen: boolean
  onClose: () => void
}

/** 依 group 分組，保持卡片上的原始出現順序；沒有 group 的歸到 key '' */
function groupBenefits(
  benefits: KnowledgeBenefit[]
): [string, KnowledgeBenefit[]][] {
  const groups = new Map<string, KnowledgeBenefit[]>()
  benefits.forEach(b => {
    const key = b.group ?? ''
    groups.set(key, [...(groups.get(key) ?? []), b])
  })
  return [...groups.entries()]
}

export default function KnowledgeDetailModal({
  card,
  isOpen,
  onClose,
}: KnowledgeDetailModalProps) {
  const [mounted, setMounted] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  useEffect(() => setMounted(true), [])
  useModalDismiss(isOpen, onClose)

  if (!mounted || !isOpen) return null

  const grouped = groupBenefits(card.benefits)

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="knowledge-modal-title"
      >
        <div
          className="bg-white w-full sm:max-w-2xl sm:rounded-xl shadow-2xl my-0 sm:my-8"
          onClick={e => e.stopPropagation()}
        >
          <header className="flex items-start justify-between gap-4 p-5 border-b border-gray-100 sticky top-0 bg-white sm:rounded-t-xl">
            <div>
              <p className="text-xs font-mono text-gray-400">{card.code}</p>
              <h2
                id="knowledge-modal-title"
                className="text-2xl font-bold text-gray-800"
              >
                {card.name}
                {card.alias && (
                  <span className="text-base font-normal text-gray-500 ml-2">
                    {card.alias}
                  </span>
                )}
              </h2>
              {card.englishName && (
                <p className="text-sm text-gray-500">{card.englishName}</p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="關閉"
              className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </header>

          <div className="p-5 space-y-5">
            <button
              onClick={() => setLightboxOpen(true)}
              className="relative aspect-square w-full max-w-xs mx-auto block rounded-lg overflow-hidden group focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:outline-none"
              aria-label="放大檢視原始卡片"
            >
              <Image
                src={card.image}
                alt={`${card.name} 原始卡片`}
                fill
                className="object-cover group-hover:opacity-90 transition-opacity"
                sizes="(max-width: 640px) 100vw, 320px"
                placeholder="blur"
                blurDataURL={getImageBlurDataURL(card.image)}
              />
              <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                點擊放大原圖
              </span>
            </button>

            {card.aromaRaw && (
              <section>
                <h3 className="text-sm font-medium text-gray-500 mb-1">香味</h3>
                <p className="text-gray-800">{card.aromaRaw}</p>
              </section>
            )}

            {card.ingredients && (
              <section>
                <h3 className="text-sm font-medium text-gray-500 mb-1">成分</h3>
                <p className="text-gray-800">{card.ingredients.join('、')}</p>
              </section>
            )}

            {/* 免責聲明放在功效「上方」——使用者可能從搜尋結果直接開這個彈窗，
                捲不到頁面頂端的橫幅，而功效正是宣稱密度最高的地方 */}
            <MedicalDisclaimer variant="inline" className="rounded-lg" />

            <section>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                功效（卡片原文，共 {card.benefits.length} 項）
              </h3>
              <div className="space-y-4">
                {grouped.map(([group, items]) => (
                  <div key={group || 'ungrouped'}>
                    {group && (
                      <h4 className="text-sm font-bold text-green-700 mb-1.5">
                        {group}
                      </h4>
                    )}
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                      {items.map((benefit, i) => (
                        <li
                          key={`${benefit.text}-${i}`}
                          className="flex items-start gap-1.5 text-gray-700"
                        >
                          <span
                            className="text-green-500 mt-0.5"
                            aria-hidden="true"
                          >
                            ·
                          </span>
                          <span>{benefit.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* 使用方法與功效性質不同，另立區塊，不混進功效清單 */}
            {card.usage && (
              <section>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  {card.usage.title}
                </h3>
                <ol className="list-decimal list-inside space-y-1 text-gray-700">
                  {card.usage.items.map((item, i) => (
                    <li key={`${item}-${i}`}>{item}</li>
                  ))}
                </ol>
              </section>
            )}
          </div>
        </div>
      </div>

      <KnowledgeLightbox
        src={card.image}
        alt={`${card.name} 精油小知識原始卡片`}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>,
    document.body
  )
}
