# README 圖片清單

## 生成的截圖

- hero-screenshot.png (1280×720) - doTERRA 精油電商平台首頁主視覺
- homepage.png (1280×800) - 首頁完整展示
- product-list.png (1280×800) - 產品列表頁面展示
- search-feature.png (1280×600) - 搜尋功能展示
- mobile-view.png (375×812) - 手機版視圖 (iPhone 14 Pro)
- tablet-view.png (768×1024) - 平板版視圖 (iPad)
- desktop-view.png (1440×900) - 桌面版視圖

## 使用方式

在 README.md 中使用以下格式引用圖片：

```markdown
![doTERRA 精油電商平台首頁主視覺](./docs/images/hero-screenshot.png)
```

## 重新生成截圖

執行以下命令：

```bash
npm run dev  # 啟動開發伺服器
tsx scripts/generate-readme-screenshots.ts
```
