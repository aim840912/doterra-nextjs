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
/**
 * 香味描述拆成詞條。各卡的分隔符不同（、／空白／・／｜），既有目錄則統一用「、」。
 * 拆成詞條後比集合而非比字串——實測發現卡片與目錄的詞條常相同、只是排列不同，
 * 那不是轉錄錯誤，不該當成 error。
 */
const tokenizeAroma = (s: string): string[] =>
  s
    .split(/[\s、,，・·|｜/]+/)
    .map(t => t.trim())
    .filter(Boolean)

/** 去掉目錄英文名常見的 " Oil" / " Touch Oil" 尾綴，方便與卡片英文名相等比對 */
const stripOilSuffix = (s: string): string =>
  s
    .toLowerCase()
    .replace(/\s+(touch\s+)?oil$/, '')
    .trim()

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
        problems.push(`${c.code ?? c.id}：香味族群「${v}」不在受控詞彙內`)
    })
    c.topics.forEach(v => {
      usedTopic.add(v)
      if (!topicVocab.has(v))
        problems.push(`${c.code ?? c.id}：功效主題「${v}」不在受控詞彙內`)
    })
    if (c.topics.length === 0) problems.push(`${c.code ?? c.id}：至少要有一個功效主題`)
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
    // 沒印編號的卡片（如茶樹）：id 用英文名 slug，跳過編號相關檢查
    if (!c.code) {
      if (!/^[a-z0-9-]+$/.test(c.id)) {
        problems.push(`${c.name}：無編號的卡片，id 必須是小寫英數 slug，實際是「${c.id}」`)
      }
      if (c.codeNum !== undefined) {
        problems.push(`${c.name}：沒有 code 就不該有 codeNum`)
      }
      if (!c.notes) {
        problems.push(`${c.name}：無編號的卡片必須在 notes 說明未印編號`)
      }
      continue
    }
    if (c.id !== c.code.toLowerCase()) {
      problems.push(
        `${c.code ?? c.id}：id 應為 "${c.code.toLowerCase()}"，實際是 "${c.id}"`
      )
    }
    // 兩種系列：精油小知識的 O-xx、營養補充品的數字編號（如 2-14）
    if (!/^(O|\d+)-\d+$/.test(c.code)) {
      problems.push(`${c.code ?? c.id}：編號格式錯誤，應為 O-數字 或 數字-數字`)
    }
    // O 系列的首字必須是拉丁字母 O——轉錄成數字 0 或全形Ｏ 肉眼幾乎看不出來
    if (c.code.startsWith('0-') || c.code.startsWith('Ｏ')) {
      problems.push(`${c.code ?? c.id}：編號首字不是拉丁字母 O（是數字 0 或全形Ｏ）`)
    }
    const numPart = Number(c.code.split('-')[1])
    if (c.codeNum !== numPart) {
      problems.push(`${c.code ?? c.id}：codeNum 應為 ${numPart}，實際是 ${c.codeNum}`)
    }
    if (!c.series) problems.push(`${c.code ?? c.id}：缺少 series（卡片頁腳的系列名）`)
    if (c.image !== `/images/knowledge/${c.id}.webp`) {
      problems.push(`${c.code ?? c.id}：image 應為 /images/knowledge/${c.id}.webp`)
    }
    if (c.benefits.length === 0) problems.push(`${c.code ?? c.id}：功效清單是空的`)
    for (const b of c.benefits) {
      if (b.text !== b.text.trim() || b.text === '') {
        problems.push(`${c.code ?? c.id}：功效條目有空白或空字串「${b.text}」`)
      }
    }

    for (const [key, set] of [
      ['id', seen.id],
      ['code', seen.code],
      ['sourceFile', seen.src],
    ] as const) {
      const val = c[key]
      if (set.has(val)) problems.push(`${c.code ?? c.id}：${key} 重複「${val}」`)
      set.add(val)
    }
  }
}

function crossCheck(cards: KnowledgeCard[], oils: OilRecord[]): void {
  let matched = 0

  for (const card of cards) {
    // 中文名優先：卡片的「玫瑰」對上目錄的「玫瑰精油」。
    // 英文名只能做「去掉 Oil / Touch Oil 後的完整相等」比對——
    // 用 startsWith 會讓 Rose 命中 Rosemary（迷迭香），實測踩過這個坑。
    const oil =
      oils.find(o => o.name.startsWith(card.name)) ??
      (card.englishName
        ? oils.find(
            o =>
              !!o.englishName &&
              stripOilSuffix(o.englishName) ===
                stripOilSuffix(card.englishName!)
          )
        : undefined)

    if (!oil) {
      warnings.push(
        `${card.code ?? card.id} ${card.name}：既有目錄查無對應精油，只能人工校對`
      )
      continue
    }
    matched++

    if (card.aromaRaw && oil.aromaDescription) {
      const a = tokenizeAroma(card.aromaRaw)
      const b = tokenizeAroma(oil.aromaDescription)
      const sameSet =
        a.length === b.length &&
        [...a].sort().join('|') === [...b].sort().join('|')

      if (!sameSet && card.aromaDiffersFromCatalog) {
        // 已人工確認兩份來源本來就不同，僅提示
        warnings.push(
          `${card.code ?? card.id} ${card.name}：香味與官方目錄不同（已確認為來源差異）\n` +
            `    卡片：${card.aromaRaw}　／　目錄：${oil.aromaDescription}`
        )
        if (card.aromaDiffersFromCatalog !== oil.aromaDescription) {
          problems.push(
            `${card.code}：aromaDiffersFromCatalog 記錄的目錄版本已過期\n` +
              `    記錄：${card.aromaDiffersFromCatalog}\n` +
              `    實際：${oil.aromaDescription}`
          )
        }
      } else if (!sameSet) {
        // 詞條本身對不上——可能是漏抄或抄錯字
        problems.push(
          `${card.code ?? card.id} ${card.name}：香味詞條不一致\n` +
            `    卡片轉錄：${card.aromaRaw}\n` +
            `    既有目錄：${oil.aromaDescription}\n` +
            `    若已確認兩邊來源本就不同，請在該卡加 aromaDiffersFromCatalog 欄位`
        )
      } else if (a.join('|') !== b.join('|')) {
        // 詞條相同、只是排列不同。以卡片為準（我們轉錄的就是卡片），僅提示
        warnings.push(
          `${card.code ?? card.id} ${card.name}：香味詞條相同但順序不同（以卡片為準）\n` +
            `    卡片：${card.aromaRaw}　／　目錄：${oil.aromaDescription}`
        )
      }
    } else if (!card.aromaRaw && oil.aromaDescription) {
      warnings.push(
        `${card.code ?? card.id} ${card.name}：卡片未標香味，但既有目錄有「${oil.aromaDescription}」（確認是否漏抄）`
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
