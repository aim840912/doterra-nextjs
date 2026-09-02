#!/usr/bin/env tsx
/**
 * 把精油小知識卡片原圖轉成 WebP 放進 public/。
 *
 * 這是「原圖 + knowledge.json → public」的純函數：可重複執行、結果一致、
 * 不改動來源檔。檔名取自卡片編號（o-115.webp），所以必須在轉錄完成後才能跑。
 *
 * 原圖（約 25MB JPG）刻意不進 repo——.gitignore 的 /public/images/ 規則是
 * 註解掉的，放進去的東西會永久留在 git 歷史裡。
 *
 * 用法：npm run knowledge:images
 * 來源目錄可用 KNOWLEDGE_SRC 環境變數覆寫。
 */
import * as fs from 'fs'
import * as path from 'path'
import sharp from 'sharp'
import type { KnowledgeCard } from '../src/types/knowledge'

const SOURCE_DIR = process.env.KNOWLEDGE_SRC ?? 'C:/Users/aim84/Downloads/精油'
const OUT_DIR = path.join(process.cwd(), 'public/images/knowledge')
const DATA_PATH = path.join(process.cwd(), 'src/data/knowledge.json')

const WEBP_QUALITY = 80

const kb = (bytes: number): string => `${Math.round(bytes / 1024)}KB`
const mb = (bytes: number): string => `${(bytes / 1024 / 1024).toFixed(1)}MB`

async function main(): Promise<void> {
  const cards: KnowledgeCard[] = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'))

  if (!fs.existsSync(SOURCE_DIR)) {
    throw new Error(`找不到來源目錄：${SOURCE_DIR}（可用 KNOWLEDGE_SRC 覆寫）`)
  }
  fs.mkdirSync(OUT_DIR, { recursive: true })

  let totalBefore = 0
  let totalAfter = 0

  for (const card of cards) {
    const src = path.join(SOURCE_DIR, card.sourceFile)
    if (!fs.existsSync(src))
      throw new Error(`${card.code}：找不到來源圖 ${src}`)

    const expected = `/images/knowledge/${card.id}.webp`
    if (card.image !== expected) {
      throw new Error(
        `${card.code}：image 欄位應為 ${expected}，實際是 ${card.image}`
      )
    }

    const out = path.join(OUT_DIR, `${card.id}.webp`)
    await sharp(src).webp({ quality: WEBP_QUALITY, effort: 5 }).toFile(out)

    const before = fs.statSync(src).size
    const after = fs.statSync(out).size
    totalBefore += before
    totalAfter += after

    console.log(
      `${card.sourceFile} → ${card.id}.webp  ${kb(before)} → ${kb(after)}  ${card.name}`
    )
  }

  const saved = Math.round((1 - totalAfter / totalBefore) * 100)
  console.log(
    `\n共 ${cards.length} 張：${mb(totalBefore)} → ${mb(totalAfter)}（省 ${saved}%）`
  )

  // 清掉不再被任何卡片引用的舊圖，避免 public 累積孤兒檔
  const wanted = new Set(cards.map(c => `${c.id}.webp`))
  const orphans = fs.readdirSync(OUT_DIR).filter(f => !wanted.has(f))
  if (orphans.length > 0) {
    orphans.forEach(f => fs.unlinkSync(path.join(OUT_DIR, f)))
    console.log(`已清除 ${orphans.length} 個孤兒圖檔：${orphans.join('、')}`)
  }
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
