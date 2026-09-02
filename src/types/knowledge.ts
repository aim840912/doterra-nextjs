/**
 * 精油小知識卡片
 *
 * 資料來源為一批「精油小知識 / ESSENTIAL OIL KNOWLEDGE」資訊卡圖片，
 * 逐張視覺轉錄而來。與 src/types/oil.ts 的 Oil 完全獨立，兩者不共用資料。
 *
 * 注意：benefits 為卡片原文照登，內含未經查證的醫療宣稱，僅供參考，
 * 不具醫療效能。顯示這些內容的頁面必須同時呈現免責聲明。
 */

/** 單條功效。group 是卡片上實際印出的分區標籤（如 心靈／身體／皮膚），無分區時省略 */
export interface KnowledgeBenefit {
  text: string
  group?: string
}

export interface KnowledgeCard {
  /** 識別碼，= code 小寫化，如 'o-115'。同時是圖片檔名與 React key */
  id: string
  /** 卡片編號原文，如 'O-115'。首字是拉丁字母 O，不是數字 0 */
  code: string
  /** 編號數值，排序專用。字串排序會把 'O-115' 排在 'O-7' 之前 */
  codeNum: number

  /** 中文名，如 '樺樹' */
  name: string
  /** 英文名，如 'Birch'。部分卡片未標示 */
  englishName?: string
  /** 別名，如側柏的 '生命之樹' */
  alias?: string

  /** 香味描述拆成陣列，供顯示與搜尋。部分卡片未標示香味 */
  aromaNotes?: string[]
  /** 香味原文（含卡片原本的分隔符），供校對時與原圖對照 */
  aromaRaw?: string

  /** 功效清單，卡片原文照登，不改寫、不過濾 */
  benefits: KnowledgeBenefit[]

  /** 成分，卡片印出「成分：」時才有（多見於 touch 滾珠瓶系列） */
  ingredients?: string[]

  /**
   * 以下兩個欄位是**歸納出來的分類標籤，不是卡片原文**。
   * 原因：香味與功效的原文幾乎每條都唯一（12 張卡就有 26 種香味描述、
   * 116 條唯一功效），拿原文當篩選選單等於沒有篩選。
   * 型別是 string[] 而非字面量聯集，因為 JSON module 推論出的是 string；
   * 詞彙範圍由 scripts/verify-knowledge.ts 在執行期把關。
   */
  /** 香味族群，取自 AROMA_FAMILIES */
  aromaFamilies: string[]
  /** 功效主題，取自 KNOWLEDGE_TOPICS */
  topics: string[]

  /** 卡片原圖路徑 */
  image: string
  /** 來源檔名，供回查校對與圖片管線對應 */
  sourceFile: string

  /** 轉錄疑義：字被圖遮住、看不清、版面順序特殊等 */
  notes?: string
}

/** 香味族群受控詞彙。新增前先確認既有卡片是否需要重新歸類 */
export const AROMA_FAMILIES = [
  '柑橘',
  '花香',
  '木質',
  '草本',
  '辛香',
  '薄荷',
  '甜香',
  '果香',
  '樹脂',
  '土壤',
] as const

/** 功效主題受控詞彙。新增前先確認既有卡片是否需要重新歸類 */
export const KNOWLEDGE_TOPICS = [
  '情緒睡眠',
  '肌膚',
  '免疫抗菌',
  '肌肉關節',
  '消化',
  '呼吸道',
  '婦科荷爾蒙',
  '神經',
  '循環心血管',
  '毛髮頭皮',
  '口腔',
  '泌尿',
  '清潔驅蟲',
] as const
