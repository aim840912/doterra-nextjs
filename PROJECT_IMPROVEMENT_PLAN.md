# doTERRA Next.js 專案改進計畫

> 基於專案現況分析的全面改進建議 | 更新日期：2025-09-13

## 📊 專案現況分析

### 專案規模統計
- **TypeScript 檔案**：20 個（+1 清理腳本）
- **React 元件**：6 個
- **頁面數量**：5 個
- **API 路由**：2 個（oils、upload）
- **產品資料**：4,911 行 JSON
- **爬蟲腳本**：15 個
- **依賴套件**：24 個（移除 axios、cheerio）✅
- **建置快取**：< 50MB（已優化）✅

### 🚨 發現的關鍵問題

#### 高風險問題（已解決 ✅）
- ✅ **ESLint 錯誤**：0 個錯誤（已修復 41 個）
- ✅ **建置快取過大**：< 50MB（已優化）
- ✅ **未使用依賴**：已移除 axios、cheerio

#### 中風險問題
- ⚠️ **重複程式碼**：15 個類似的爬蟲腳本
- ⚠️ **資料儲存**：使用 JSON 檔案而非資料庫
- ⚠️ **備份累積**：7 個自動備份檔案
- ⚠️ **API 覆蓋不足**：僅 2 個 API 路由

#### 低風險問題
- ✅ **圖片優化**：已實作 Next.js Image 優化
- ⚡ **狀態管理**：缺乏全域狀態管理  
- ⚡ **監控工具**：無效能和錯誤監控

---

## 🎯 改進建議（按優先級）

### ✅ 已完成項目（2025-09-13）

**高優先級任務已完成**：
- ✅ **ESLint 錯誤修復**：41 → 0 個錯誤
- ✅ **建置快取優化**：94MB → < 50MB  
- ✅ **依賴清理**：移除 axios、cheerio（32 個套件）
- ✅ **圖片載入優化**：實作 Next.js Image + 懶載入
- ✅ **清理腳本建立**：`scripts/cleanup.ts` + npm 指令

### 🔴 下一步重點（立即執行）

#### 1. 搜尋功能升級

**新增搜尋 API**：
```typescript
// app/api/products/search/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const category = searchParams.get('category')
  const limit = parseInt(searchParams.get('limit') || '20')
  
  // 實作模糊搜尋
  const results = await fuzzySearch(query, {
    keys: ['name', 'englishName', 'description', 'tags'],
    threshold: 0.6
  })
  
  return Response.json({
    results: results.slice(0, limit),
    total: results.length,
    query,
    suggestions: await getSearchSuggestions(query)
  })
}
```

**功能清單**：
- [ ] 搜尋歷史記錄（localStorage）
- [ ] 模糊搜尋（Fuse.js）
- [ ] 自動完成建議
- [ ] 搜尋結果高亮
- [ ] 搜尋篩選器記憶

#### 2. 使用者體驗改善

**Loading States**：
```typescript
// components/Skeleton/ProductSkeleton.tsx
export function ProductSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-48 bg-gray-200 rounded-lg"></div>
      <div className="mt-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  )
}
```

**錯誤處理**：
```typescript
// app/error.tsx
'use client'
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">出現錯誤</h2>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <button onClick={reset} className="px-4 py-2 bg-blue-500 text-white rounded">
        重試
      </button>
    </div>
  )
}
```

#### 3. 資料管理優化

**資料庫整合選項**：

**選項 1：Supabase（推薦）**
```bash
npm install @supabase/supabase-js
```

**選項 2：Prisma + SQLite**
```bash
npm install prisma @prisma/client
npx prisma init --datasource-provider sqlite
```

**資料遷移腳本**：
```typescript
// scripts/migrate-to-db.ts
import { createClient } from '@supabase/supabase-js'
import productsData from '../src/data/all-products.json'

async function migrateData() {
  const supabase = createClient(url, key)
  
  for (const product of productsData) {
    await supabase.from('products').insert({
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      // ... 其他欄位
    })
  }
}
```

#### 4. API 層完善

**建議的 API 結構**：
```
app/api/
  products/
    route.ts              # GET all, POST new
    [id]/route.ts         # GET, PUT, DELETE single
    search/route.ts       # Advanced search
    categories/route.ts   # Get categories
  collections/
    route.ts              # Collections CRUD
    [slug]/route.ts       # Single collection
  favorites/
    route.ts              # User favorites
  analytics/
    route.ts              # Usage tracking
  health/
    route.ts              # Health check
```

### 🟡 中優先級（2-4 週內完成）

#### 5. 狀態管理

**Zustand Store 範例**：
```typescript
// stores/useProductStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ProductState {
  products: Oil[]
  favorites: string[]
  searchHistory: string[]
  filters: {
    category: string
    collection: string
    searchTerm: string
  }
  
  // Actions
  setProducts: (products: Oil[]) => void
  toggleFavorite: (id: string) => void
  addSearchTerm: (term: string) => void
  updateFilters: (filters: Partial<ProductState['filters']>) => void
}

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: [],
      favorites: [],
      searchHistory: [],
      filters: {
        category: 'all',
        collection: 'all',
        searchTerm: ''
      },
      
      setProducts: (products) => set({ products }),
      toggleFavorite: (id) => set((state) => ({
        favorites: state.favorites.includes(id)
          ? state.favorites.filter(f => f !== id)
          : [...state.favorites, id]
      })),
      addSearchTerm: (term) => set((state) => ({
        searchHistory: [term, ...state.searchHistory.filter(t => t !== term)].slice(0, 10)
      })),
      updateFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters }
      }))
    }),
    {
      name: 'doterra-product-store',
      partialize: (state) => ({
        favorites: state.favorites,
        searchHistory: state.searchHistory
      })
    }
  )
)
```

### 🟢 低優先級（1-2 個月內完成）

#### 6. 開發工具整合

**Storybook 設定**：
```bash
npx storybook@latest init
```

**Bundle Analyzer**：
```bash
npm install --save-dev @next/bundle-analyzer
```

```javascript
// next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // 現有配置
})
```

#### 7. 監控與分析

**Vercel Analytics**：
```bash
npm install @vercel/analytics
```

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout() {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

**錯誤追蹤 (Sentry)**：
```bash
npm install @sentry/nextjs
```

---

## 🔧 技術債清理

### 需要立即處理的技術債

#### 1. 命名一致性
**問題**：混用 `oil` 和 `product` 概念

**解決方案**：
- 統一使用 `product` 命名
- 更新所有檔案和變數名稱
- 保持向後相容性

```typescript
// 重構計畫
OilList → ProductList
OilCard → ProductCard
useFavorites (油類) → useFavorites (產品)
```

#### 2. 爬蟲腳本整合
**問題**：15 個重複的爬蟲腳本

**目標**：1 個可配置的統一爬蟲

```typescript
// scripts/scraper/index.ts
interface ScraperConfig {
  baseUrl: string
  selectors: {
    productList: string
    productName: string
    productPrice: string
    productImage: string
  }
  category: string
  collection?: string
}

// scripts/scraper/config.ts
export const SCRAPER_CONFIGS: Record<string, ScraperConfig> = {
  'single-oils': {
    baseUrl: 'https://www.doterra.com/TW/zh_TW/c/single-oils',
    selectors: { /* ... */ },
    category: 'single-oils'
  },
  // ... 其他配置
}
```

#### 3. 檔案清理清單
- [ ] 移除 `test-*.js` 檔案
- [ ] 清理 `open-browser.js`、`simple-browser.js`
- [ ] 整理備份檔案（保留最近 3 個）
- [ ] 移除重複的爬蟲腳本

---

## 📅 實施時程表

### ✅ 已完成階段（2025-09-13）

**基礎穩固階段完成**：
- ✅ 修復所有 ESLint 錯誤（41 → 0）
- ✅ 移除未使用的依賴套件（axios、cheerio）
- ✅ 實作圖片懶載入優化（Next.js Image）
- ✅ 建立快取清理腳本（scripts/cleanup.ts）
- ✅ 優化建置快取管理（94MB → < 50MB）

**達成成果**：
- ✅ 零 ESLint 錯誤
- ✅ 程式碼品質顯著改善
- ✅ 建置效能提升

### 第一階段：功能增強（接下來 1-2 週）

**Week 1**：
- [ ] 實作進階搜尋功能和 API
- [ ] 加入錯誤邊界處理
- [ ] 清理重複的爬蟲腳本
- [ ] 實作 Loading 狀態和 Skeleton

**Week 2**：
- [ ] 整合 Supabase 資料庫
- [ ] 建立資料遷移腳本
- [ ] 完善 API 路由架構

**預期成果**：
- 完整的搜尋體驗
- 穩固的 API 基礎
- 改善的使用者體驗

### 第二階段：資料與狀態管理（3-4 週）

**Week 3**：
- [ ] 加入 Zustand 狀態管理
- [ ] 實作搜尋建議功能
- [ ] 優化使用者介面體驗

**Week 4**：
- [ ] 整合監控和分析工具
- [ ] 實作 CI/CD Pipeline
- [ ] 安全性檢查和強化

**預期成果**：
- 統一的狀態管理
- 系統穩定性提升
- 基礎監控建立

### 第三階段：進階功能（5-6 週）

**Week 5**：
- [ ] Bundle Analyzer 和效能調校
- [ ] 無障礙設計改善
- [ ] 文檔和維護指南

**Week 6**：
- [ ] 實作 PWA 功能
- [ ] 加入推薦系統
- [ ] 多語言支援

**預期成果**：
- Lighthouse 分數 > 90
- 企業級應用架構
- 完整的開發文檔

---

## 📈 預期效益分析

### 短期效益（1-2 個月）

**開發效率**：
- Bug 修復時間減少 50%
- 新功能開發速度提升 30%
- 程式碼審查時間減少 40%

**使用者體驗**：
- 頁面載入時間減少 40%
- 搜尋回應時間 < 200ms
- 圖片載入體驗改善

**維護成本**：
- 自動化工作流程建立
- 部署時間縮短 70%
- 錯誤監控和修復自動化

### 中期效益（3-6 個月）

**技術債務**：
- 消除 80% 現有技術債務
- 建立技術債務預防機制
- 程式碼可讀性和維護性大幅提升

**團隊效能**：
- 新成員上手時間縮短 50%
- 知識分享和文檔完善
- 開發流程標準化

**產品品質**：
- 使用者回報問題減少 70%
- 系統穩定性提升
- 功能完整性和一致性改善

### 長期效益（6-12 個月）

**商業價值**：
- 使用者留存率提升
- 搜尋轉換率提高
- 品牌形象和信任度增強

**技術領先**：
- 現代化的技術棧
- 可擴展的架構設計
- 業界最佳實踐採用

**團隊成長**：
- 技術技能提升
- 工程文化建立
- 創新能力增強

---

## 🛠 工具和資源建議

### 開發工具
- **IDE**：VS Code + 精油專案專用設定
- **開發框架**：Next.js + TypeScript + Tailwind CSS
- **監控**：Vercel Analytics + Sentry + LogRocket
- **分析**：Bundle Analyzer + Lighthouse CI

### 學習資源
- [Next.js 最佳實踐](https://nextjs.org/docs/app/building-your-application/routing/best-practices)
- [TypeScript 手冊](https://www.typescriptlang.org/docs/)
- [Web Performance 優化](https://web.dev/performance/)
- [React 效能優化指南](https://react.dev/learn/render-and-commit)

### 社群支援
- Next.js Discord 社群
- React Taiwan 社群
- Taiwan Frontend 社群

---

## 🎯 成功指標

### 量化指標
- **Lighthouse Performance**：< 60 → > 90
- **首次內容繪製（FCP）**：> 3s → < 1.5s
- **最大內容繪製（LCP）**：> 4s → < 2s
- **累積佈局偏移（CLS）**：> 0.25 → < 0.1
- ✅ **ESLint 錯誤**：41 → 0（已達成）
- **Bundle 大小**：未知 → < 500KB
- ✅ **建置快取**：94MB → < 50MB（已達成）

### 質化指標
- ✅ 程式碼可讀性和維護性顯著改善（ESLint 修復）
- ✅ 開發者體驗明顯提升（清理腳本、自動化）
- ✅ 使用者介面響應速度改善（圖片優化）
- [ ] 錯誤率和當機頻率降低
- [ ] 新功能開發和部署更加順暢

---

## 📞 支援與維護

### 文檔維護
本改進計畫將定期更新，建議：
- 每月檢視進度並更新狀態
- 每季評估效益並調整優先級
- 每年進行技術棧評估和升級

### 團隊協作
- 建立技術分享會議（每週）
- 設置程式碼審查標準
- 建立知識庫和最佳實踐文檔

### 持續改進
- 定期技術債務評估
- 效能監控和優化
- 安全性檢查和更新
- 依賴套件維護和升級

---

**最後更新**：2025-09-13（簡化並標記已完成項目）
**負責人**：開發團隊  
**審核週期**：每月第一週  
**下次檢討**：2025-10-13

### 📋 最近完成項目（2025-09-13）
- ✅ ESLint 錯誤修復：41 → 0 個錯誤
- ✅ 建置快取優化：94MB → < 50MB  
- ✅ 移除未使用依賴：axios、cheerio（32 個套件）
- ✅ 圖片載入優化：Next.js Image + 懶載入
- ✅ 清理腳本建立：自動化維護工具