'use client'

import { useMemo, useState } from 'react'
import type { KnowledgeCard } from '@/types/knowledge'
import KnowledgeFilters from './KnowledgeFilters'
import KnowledgeGrid from './KnowledgeGrid'
import KnowledgeDetailModal from './KnowledgeDetailModal'
import {
  createKnowledgeFuse,
  EMPTY_FILTERS,
  filterCards,
  getAromaFamilyOptions,
  getTopicOptions,
  hasActiveFilters,
  toggleValue,
  type KnowledgeFilterState,
} from './utils/knowledgeFilters'

interface KnowledgeListProps {
  cards: KnowledgeCard[]
}

export default function KnowledgeList({ cards }: KnowledgeListProps) {
  const [filters, setFilters] = useState<KnowledgeFilterState>(EMPTY_FILTERS)
  const [selected, setSelected] = useState<KnowledgeCard | null>(null)

  const fuse = useMemo(() => createKnowledgeFuse(cards), [cards])
  const aromaOptions = useMemo(() => getAromaFamilyOptions(cards), [cards])
  const topicOptions = useMemo(() => getTopicOptions(cards), [cards])

  const visible = useMemo(
    () => filterCards(cards, filters, fuse),
    [cards, filters, fuse]
  )
  const isFiltering = hasActiveFilters(filters)

  return (
    <>
      <KnowledgeFilters
        filters={filters}
        aromaOptions={aromaOptions}
        topicOptions={topicOptions}
        resultCount={visible.length}
        totalCount={cards.length}
        hasFilters={isFiltering}
        onSearchChange={search => setFilters(f => ({ ...f, search }))}
        onToggleAroma={value =>
          setFilters(f => ({
            ...f,
            aromaFamilies: toggleValue(f.aromaFamilies, value),
          }))
        }
        onToggleTopic={value =>
          setFilters(f => ({ ...f, topics: toggleValue(f.topics, value) }))
        }
        onClear={() => setFilters(EMPTY_FILTERS)}
      />

      <div className="mt-8">
        <KnowledgeGrid
          cards={visible}
          hasFilters={isFiltering}
          onSelect={setSelected}
          onClearFilters={() => setFilters(EMPTY_FILTERS)}
        />
      </div>

      {selected && (
        <KnowledgeDetailModal
          card={selected}
          isOpen={selected !== null}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
