# doTERRA 精油圖鑑

Next.js 15（App Router）+ TypeScript + Tailwind 的精油產品圖鑑。**沒有資料庫**：產品資料是 repo 內的 JSON，由爬蟲腳本產生。

## 指令

套件管理器是 npm（`package-lock.json`）。

- `npm run dev`：開發伺服器（turbopack）
- `npm run type-check` · `npm run lint` · `npm run build`：提交前驗證
- `npm run scrape:<category>` / `npm run products:merge`：重抓並合併產品資料（tsx 腳本，說明見 `docs/SCRAPER_DOCUMENTATION.md`）

## 架構

- **資料**：`src/data/products/*.json`（各分類一檔）→ `src/data/products/index.ts` 匯入 → `src/data/products.ts` 匯出 `allOils`。知識頁資料在 `src/data/knowledge.json`。
- **API**：`src/app/api/**/route.ts`（collections、favorites、health、oils、products、upload），全部直接讀 `src/data/`。新增 route 前先讀既有的 route 檔照抄慣例。
- **前端狀態**：`src/stores/useProductStore.ts`（Zustand，目前未啟用 persist）。
- `src/lib/` 只有 `favorites-storage.ts` 與 `image-utils.ts`。

## 讀程式碼看不出來的限制

- **收藏只存在記憶體**：`favorites-storage.ts` 是 process 內的 singleton `Map`。伺服器重啟就清空；部署在 serverless 時，各 instance 互不共享。
- **上傳寫本機檔案系統**：`/api/upload` 寫進 `public/images/products/`。在唯讀或 serverless 的部署環境不會保留。
- `src/` 不使用 `console.*`（目前 0 處，ESLint 沒有強制，要靠自己維持）。

已知問題清單：`docs/PROJECT_ISSUES.md`。
