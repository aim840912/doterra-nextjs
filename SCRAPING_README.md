# doTERRA 產品資料收集系統

這個專案包含了一套完整的工具，用於收集和整合 doTERRA 產品資料到 Next.js 應用程式中。

## 🚀 快速開始

### 1. 生成樣本資料（推薦）

由於直接爬取 doTERRA 網站可能遇到反爬蟲保護，我們提供了基於真實 doTERRA 產品的樣本資料生成器：

```bash
npm run generate:sample-data
```

這個指令會：
- 生成 15 個基於真實 doTERRA 產品的樣本資料
- 從 Unsplash 下載高品質的產品圖片
- 將資料儲存到 `src/data/doterra-real-products.json`
- 將圖片儲存到 `public/images/products/doterra/`

### 2. 嘗試直接爬取（實驗性）

如果要嘗試直接從 doTERRA 網站爬取資料：

```bash
npm run scrape:doterra
```

**注意**：由於網站可能有反爬蟲保護，這個方法可能不會成功。

## 📁 檔案結構

```
├── scripts/
│   ├── scrape-doterra.ts          # 主要爬蟲腳本
│   ├── generate-sample-data.ts    # 樣本資料生成器
│   └── test-website.ts           # 網站測試工具
├── src/
│   ├── data/
│   │   ├── products.ts            # 產品資料主檔案
│   │   └── doterra-real-products.json  # 爬取的 doTERRA 產品資料
│   └── app/
│       ├── products/page.tsx      # 產品列表頁面
│       └── test-products/page.tsx # 測試頁面
└── public/
    └── images/
        └── products/
            └── doterra/           # doTERRA 產品圖片
```

## 🛠️ 功能特色

### 樣本資料生成器

- **15 個真實產品**：基於 doTERRA 實際產品建立的詳細資料
- **多種產品類別**：
  - 單方精油 (6個)
  - 複方精油 (5個)
  - 護膚產品 (1個)
  - 健康產品 (2個)
  - 營養補充品 (1個)
- **完整產品資訊**：
  - 中英文名稱
  - 詳細描述和功效
  - 成分列表
  - 使用標籤
  - 容量規格
- **高品質圖片**：400x400 壓縮優化的 JPEG 圖片

### 爬蟲系統

- **智慧選擇器**：自動嘗試多種 CSS 選擇器找到產品元素
- **錯誤恢復**：具備重試機制和後備方案
- **圖片處理**：自動下載、調整大小和壓縮圖片
- **資料驗證**：確保必要欄位都有值

## 📊 資料結構

每個產品包含以下欄位：

```typescript
interface Product {
  id: string              // 產品唯一識別碼
  name: string            // 中文名稱
  englishName: string     // 英文名稱
  description: string     // 產品描述
  benefits: string[]      // 功效列表
  category: string        // 產品類別
  volume: string          // 容量
  imageUrl: string        // 本地圖片路徑
  inStock: boolean        // 庫存狀態
  ingredients?: string[]  // 成分列表（可選）
  tags: string[]          // 標籤
  isBestseller?: boolean  // 是否為暢銷品
  isNew?: boolean         // 是否為新品
}
```

## 🎯 整合到專案

產品資料已經整合到現有系統中：

```typescript
// 引入所有產品（包含原始樣本和 doTERRA 產品）
import { allProducts } from '@/data/products'

// 只獲取 doTERRA 產品
import { getDoTerraProducts } from '@/data/products'

// 只獲取原始樣本產品
import { getSampleProducts } from '@/data/products'
```

## 🧪 測試和驗證

### 查看測試頁面

訪問 `http://localhost:3001/test-products` 查看：
- 產品總數統計
- doTERRA 產品列表
- 產品類別分佈
- 產品圖片和資訊

### 查看產品頁面

訪問 `http://localhost:3001/products` 查看完整的產品列表，包含：
- 篩選功能
- 搜尋功能
- 產品卡片展示

## ⚡ 指令參考

```bash
# 開發伺服器
npm run dev

# 生成 doTERRA 樣本資料
npm run generate:sample-data

# 嘗試爬取 doTERRA 網站（可能失敗）
npm run scrape:doterra

# 代碼檢查
npm run type-check
npm run lint

# 清理建置檔案
npm run clean
```

## 🔧 依賴套件

新增的套件：
- `playwright` - 網頁自動化和爬取
- `axios` - HTTP 請求
- `cheerio` - HTML 解析
- `sharp` - 圖片處理和壓縮
- `tsx` - TypeScript 執行器

## 📝 注意事項

1. **網站政策**：請遵守目標網站的 robots.txt 和使用條款
2. **請求頻率**：腳本已包含適當的延遲，避免對伺服器造成負擔
3. **圖片版權**：使用的圖片來自 Unsplash，請注意版權政策
4. **資料更新**：可以定期重新執行生成腳本來更新產品資料

## 🚀 擴展建議

1. **更多產品**：在 `generate-sample-data.ts` 中添加更多產品資料
2. **不同圖片**：修改圖片下載邏輯使用不同的圖片來源
3. **自動更新**：建立定時任務定期更新產品資料
4. **資料庫整合**：將資料儲存到資料庫而不是 JSON 檔案
5. **管理介面**：建立管理後台來編輯和管理產品資料

## 🎉 完成！

您現在有一個完整的產品資料收集和展示系統，包含 27 個產品（12個原始 + 15個 doTERRA），可以用於開發和展示用途。