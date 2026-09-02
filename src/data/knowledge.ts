import type { KnowledgeCard } from '@/types/knowledge'
import raw from './knowledge.json'

/**
 * 刻意不寫 `as KnowledgeCard[]`。
 *
 * 現有 src/data/products/index.ts 用 `as Oil[]` 強制斷言，等於關掉型別檢查。
 * 這裡的 JSON 是逐張手工轉錄的唯一資料來源，改用直接指派，
 * 讓 tsc 在 build 時逐筆檢查是否符合 schema——這是免費的驗收機制。
 */
export const knowledgeCards: KnowledgeCard[] = raw

/** 依編號排序（用 codeNum，字串排序會把 O-115 排在 O-7 之前） */
export const knowledgeByCode = [...knowledgeCards].sort(
  (a, b) => a.codeNum - b.codeNum
)

export const getCardById = (id: string): KnowledgeCard | undefined =>
  knowledgeCards.find(card => card.id === id)

/** 從資料自動導出香味標籤選項，依出現次數由多到少 */
export const getAromaOptions = (): { value: string; count: number }[] => {
  const counts = new Map<string, number>()
  knowledgeCards.forEach(card =>
    card.aromaNotes?.forEach(note =>
      counts.set(note, (counts.get(note) ?? 0) + 1)
    )
  )
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => ({ value, count }))
}
