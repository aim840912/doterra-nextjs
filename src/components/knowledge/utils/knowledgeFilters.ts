import Fuse from 'fuse.js'
import type { KnowledgeCard } from '@/types/knowledge'

export interface FilterOption {
  value: string
  count: number
}

export interface KnowledgeFilterState {
  search: string
  aromaFamilies: string[]
  topics: string[]
}

export const EMPTY_FILTERS: KnowledgeFilterState = {
  search: '',
  aromaFamilies: [],
  topics: [],
}

/**
 * 刻意不沿用 api/products/search/route.ts 的設定（threshold 0.6、distance 100）。
 * 那組參數是為 131 筆產品調的，搬到 73 筆小資料集上會有兩個問題：
 * 1. threshold 0.6 在中文字元級比對下幾乎每次都回傳全部，像是搜尋壞掉
 * 2. 沒有 ignoreLocation 時，distance 會懲罰排在 benefits 後段的項目，
 *    等於長清單的後半搜不到
 */
const FUSE_OPTIONS = {
  keys: [
    { name: 'name', weight: 3 },
    { name: 'code', weight: 2.5 },
    { name: 'englishName', weight: 2 },
    { name: 'alias', weight: 2 },
    { name: 'aromaNotes', weight: 1.5 },
    { name: 'benefits.text', weight: 1.2 },
    { name: 'topics', weight: 1 },
    { name: 'ingredients', weight: 0.8 },
  ],
  threshold: 0.3,
  ignoreLocation: true,
  minMatchCharLength: 2,
  shouldSort: true,
}

export const createKnowledgeFuse = (cards: KnowledgeCard[]) =>
  new Fuse(cards, FUSE_OPTIONS)

/** 從資料導出篩選選項，依出現次數由多到少；只出現一次的留著（73 筆規模下仍可用） */
const countValues = (
  cards: KnowledgeCard[],
  pick: (card: KnowledgeCard) => string[]
): FilterOption[] => {
  const counts = new Map<string, number>()
  cards.forEach(card =>
    pick(card).forEach(value => counts.set(value, (counts.get(value) ?? 0) + 1))
  )
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-TW'))
    .map(([value, count]) => ({ value, count }))
}

export const getAromaFamilyOptions = (cards: KnowledgeCard[]): FilterOption[] =>
  countValues(cards, c => c.aromaFamilies)

export const getTopicOptions = (cards: KnowledgeCard[]): FilterOption[] =>
  countValues(cards, c => c.topics)

/**
 * 篩選語意：族群之間 OR、主題之間 OR、兩者之間 AND，最後與搜尋結果取交集。
 */
export const filterCards = (
  cards: KnowledgeCard[],
  filters: KnowledgeFilterState,
  fuse: Fuse<KnowledgeCard>
): KnowledgeCard[] => {
  const searched =
    filters.search.trim().length > 0
      ? fuse.search(filters.search.trim()).map(r => r.item)
      : cards

  return searched.filter(card => {
    const aromaOk =
      filters.aromaFamilies.length === 0 ||
      filters.aromaFamilies.some(f => card.aromaFamilies.includes(f))
    const topicOk =
      filters.topics.length === 0 ||
      filters.topics.some(t => card.topics.includes(t))
    return aromaOk && topicOk
  })
}

export const hasActiveFilters = (filters: KnowledgeFilterState): boolean =>
  filters.search.trim().length > 0 ||
  filters.aromaFamilies.length > 0 ||
  filters.topics.length > 0

/** 多選開關：已選則移除，未選則加入 */
export const toggleValue = (list: string[], value: string): string[] =>
  list.includes(value) ? list.filter(v => v !== value) : [...list, value]
