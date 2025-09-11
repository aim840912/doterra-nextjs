# doTERRA Taiwan 官方網站

這是一個基於 Next.js 建立的 doTERRA Taiwan 官方網站專案，專注於提供純淨精油和天然健康解決方案的展示平台。

## 🌿 專案特色

- **現代化架構**: 基於 Next.js 15 App Router
- **響應式設計**: 支援所有裝置尺寸
- **TypeScript**: 提供完整的型別安全
- **Tailwind CSS**: 現代化的樣式系統
- **效能優化**: 使用 Turbopack 提升開發體驗

## 🚀 快速開始

### 環境需求

- Node.js 20.0.0 或更高版本
- npm 10.0.0 或更高版本

### 安裝步驟

1. 複製專案
```bash
git clone [repository-url]
cd doterra
```

2. 安裝依賴
```bash
npm install
```

3. 設定環境變數
```bash
cp .env.local.example .env.local
# 編輯 .env.local 檔案並填入必要的環境變數
```

4. 啟動開發伺服器
```bash
npm run dev
```

5. 開啟瀏覽器並訪問 [http://localhost:3000](http://localhost:3000)

## 📁 專案結構

```
doterra/
├── src/
│   ├── app/                    # Next.js App Router 頁面
│   ├── components/             # React 元件
│   ├── hooks/                  # 自定義 React Hooks
│   ├── lib/                    # 工具函數和設定
│   ├── services/               # API 服務層
│   ├── styles/                 # 樣式檔案
│   └── types/                  # TypeScript 型別定義
├── public/                     # 靜態檔案
└── ...
```

## 🛠️ 可用指令

```bash
# 開發
npm run dev              # 啟動開發伺服器 (使用 Turbopack)

# 建置
npm run build            # 建置生產版本
npm run start            # 啟動生產伺服器

# 程式碼品質
npm run lint             # 執行 ESLint 檢查
npm run lint:fix         # 自動修復 ESLint 問題
npm run format           # 格式化程式碼
npm run format:check     # 檢查程式碼格式
npm run type-check       # TypeScript 型別檢查

# 維護
npm run clean            # 清理建置檔案
npm run pre-commit       # 提交前檢查 (型別檢查 + lint + 格式化)
```

## 🎨 設計系統

### 色彩主題
- **主色**: Green 600 (#059669) - doTERRA 品牌綠
- **次要色**: Blue 500 (#3B82F6) - 信任與專業
- **輔助色**: Purple 500 (#8B5CF6) - 創新與品質

### 字體
- **主要字體**: Geist Sans - 現代無襯線字體
- **等寬字體**: Geist Mono - 程式碼顯示

## 🧪 開發指南

### 程式碼規範
- 使用 TypeScript 進行開發
- 遵循 ESLint 和 Prettier 規則
- 採用函數式元件和 React Hooks
- 使用 Tailwind CSS 進行樣式設計

### 提交規範
專案使用 Husky 和 lint-staged 進行自動化品質檢查：
- 每次提交前會自動執行 TypeScript 檢查
- 自動修復 ESLint 問題
- 自動格式化程式碼

## 🚀 部署

### Vercel (推薦)
1. 推送程式碼到 Git 儲存庫
2. 在 Vercel 中匯入專案
3. 設定環境變數
4. 自動部署

### 其他平台
```bash
npm run build
npm run start
```

## 🔧 環境變數

複製 `.env.local.example` 為 `.env.local` 並設定以下變數：

```bash
# 應用程式設定
NEXT_PUBLIC_APP_NAME=doTERRA
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 其他服務設定 (依需求添加)
# DATABASE_URL=
# NEXT_PUBLIC_SUPABASE_URL=
# SUPABASE_SERVICE_ROLE_KEY=
```

## 📄 授權

此專案僅供學習和開發目的使用。doTERRA 是 doTERRA International, LLC 的註冊商標。

## 🤝 貢獻

歡迎提交 Issues 和 Pull Requests 來改善此專案。

---

**doTERRA Taiwan** - 體驗純淨精油的力量，創造更健康、更自然的生活方式。
