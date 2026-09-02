#!/usr/bin/env tsx
/**
 * 精油小知識卡片轉錄驗收
 *
 * 兩類檢查：
 * 1. 結構檢查 — id/code/codeNum/sourceFile 的一致性與唯一性
 * 2. 交叉核對 — 拿轉錄結果比對 src/data/products/single-oils.json
 *
 * 交叉核對的價值：既有產品目錄的 aromaDescription 與這批卡片的香味描述
 * 來源相同，實測 4/4 逐字一致。因此香味與名稱可以自動驗；
 * 功效清單在既有資料裡沒有對應物（那正是卡片的獨有價值），只能人工校對。
 */
import * as fs from 'fs'
import * as path from 'path'
import type { KnowledgeCard } from '../src/types/knowledge'
import { AROMA_FAMILIES, KNOWLEDGE_TOPICS } from '../src/types/knowledge'

interface OilRecord {
  name: string
  englishName?: string
  aromaDescription?: string
}

const ROOT = process.cwd()
const CARDS_PATH = path.join(ROOT, 'src/data/knowledge.json')
const OILS_PATH = path.join(ROOT, 'src/data/products/single-oils.json')

const read = <T>(p: string): T => JSON.parse(fs.readFileSync(p, 'utf-8'))

/** 香味比對前的正規化：各卡分隔符不同（、／空白／・／｜），一律去除後比字元 */
const normalizeAroma = (s: string): string => s.replace(/[\s、,，・·|｜/]/g, '')

const problems: string[] = []
const warnings: string[] = []

/**
 * 受控詞彙檢查。
 * 這層 tsc 驗不到：JSON module 推論出的是 string，不是字面量聯集，
 * 所以打錯字（如 '肌膚' 寫成 '皮膚'）在編譯期完全無聲。
 */
function checkVocabulary(cards: KnowledgeCard[]): void {
  const aromaVocab = new Set<string>(AROMA_FAMILIES)
  const topicVocab = new Set<string>(KNOWLEDGE_TOPICS)
  const usedAroma = new Set<string>()
  const usedTopic = new Set<string>()

  for (const c of cards) {
    c.aromaFamilies.forEach(v => {
      usedAroma.add(v)
      if (!aromaVocab.has(v))
        problems.push(`${c.code}：香味族群「${v}」不在受控詞彙內`)
    })
    c.topics.forEach(v => {
      usedTopic.add(v)
      if (!topicVocab.has(v))
        problems.push(`${c.code}：功效主題「${v}」不在受控詞彙內`)
    })
    if (c.topics.length === 0) problems.push(`${c.code}：至少要有一個功效主題`)
    if (c.aromaNotes && c.aromaFamilies.length === 0) {
      warnings.push(`${c.code} ${c.name}：有香味描述但未歸類到任何香味族群`)
    }
  }

  const unusedAroma = AROMA_FAMILIES.filter(v => !usedAroma.has(v))
  const unusedTopic = KNOWLEDGE_TOPICS.filter(v => !usedTopic.has(v))
  if (unusedAroma.length > 0)
    console.log(`尚未用到的香味族群：${unusedAroma.join('、')}`)
  if (unusedTopic.length > 0)
    console.log(`尚未用到的功效主題：${unusedTopic.join('、')}`)
}

function checkStructure(cards: KnowledgeCard[]): void {
  const seen = {
    id: new Set<string>(),
    code: new Set<string>(),
    src: new Set<string>(),
  }

  for (const c of cards) {
    if (c.id !== c.code.toLowerCase()) {
      problems.push(
        `${c.code}：id 應為 "${c.code.toLowerCase()}"，實際是 "${c.id}"`
      )
    }
    if (!/^O-\d+$/.test(c.code) || c.code.charCodeAt(0) !== 79) {
      problems.push(
        `${c.code}：編號格式錯誤，首字必須是拉丁字母 O（不是數字 0 或全形Ｏ）`
      )
    }
    if (c.codeNum !== Number(c.code.slice(2))) {
      problems.push(
        `${c.code}：codeNum 應為 ${Number(c.code.slice(2))}，實際是 ${c.codeNum}`
      )
    }
    if (c.image !== `/images/knowledge/${c.id}.webp`) {
      problems.push(`${c.code}：image 應為 /images/knowledge/${c.id}.webp`)
    }
    if (c.benefits.length === 0) problems.push(`${c.code}：功效清單是空的`)
    for (const b of c.benefits) {
      if (b.text !== b.text.trim() || b.text === '') {
        problems.push(`${c.code}：功效條目有空白或空字串「${b.text}」`)
      }
    }

    for (const [key, set] of [
      ['id', seen.id],
      ['code', seen.code],
      ['sourceFile', seen.src],
    ] as const) {
      const val = c[key]
      if (set.has(val)) problems.push(`${c.code}：${key} 重複「${val}」`)
      set.add(val)
    }
  }
}

function crossCheck(cards: KnowledgeCard[], oils: OilRecord[]): void {
  let matched = 0

  for (const card of cards) {
    const oil = oils.find(
      o =>
        o.name.startsWith(card.name) ||
        (!!card.englishName &&
          !!o.englishName &&
          o.englishName
            .toLowerCase()
            .startsWith(card.englishName.toLowerCase()))
    )

    if (!oil) {
      warnings.push(
        `${card.code} ${card.name}：既有目錄查無對應精油，只能人工校對`
      )
      continue
    }
    matched++

    if (card.aromaRaw && oil.aromaDescription) {
      const a = normalizeAroma(card.aromaRaw)
      const b = normalizeAroma(oil.aromaDescription)
      if (a !== b) {
        problems.push(
          `${card.code} ${card.name}：香味不一致\n` +
            `    卡片轉錄：${card.aromaRaw}\n` +
            `    既有目錄：${oil.aromaDescription}`
        )
      }
    } else if (!card.aromaRaw && oil.aromaDescription) {
      warnings.push(
        `${card.code} ${card.name}：卡片未標香味，但既有目錄有「${oil.aromaDescription}」（確認是否漏抄）`
      )
    }
  }

  console.log(`交叉核對：${matched}/${cards.length} 筆在既有目錄中找到對應精油`)
}

function main(): void {
  const cards = read<KnowledgeCard[]>(CARDS_PATH)
  const oils = read<OilRecord[]>(OILS_PATH)

  console.log(`載入 ${cards.length} 張卡片、${oils.length} 支既有精油\n`)

  checkStructure(cards)
  checkVocabulary(cards)
  crossCheck(cards, oils)

  const flagged = cards.filter(c => c.notes)
  console.log(`\n有轉錄疑義註記的卡片：${flagged.length}/${cards.length}`)
  flagged.forEach(c => console.log(`  ${c.code} ${c.name}：${c.notes}`))

  if (warnings.length > 0) {
    console.log(`\n提醒（${warnings.length}）：`)
    warnings.forEach(w => console.log(`  ${w}`))
  }

  if (problems.length > 0) {
    console.log(`\n錯誤（${problems.length}）：`)
    problems.forEach(p => console.log(`  ${p}`))
    process.exit(1)
  }

  console.log('\n結構檢查與香味交叉核對全數通過')
}

main()
