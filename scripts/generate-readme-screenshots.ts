import { chromium } from 'playwright'
import { promises as fs } from 'fs'
import path from 'path'

interface ScreenshotConfig {
  name: string
  url: string
  width: number
  height: number
  description: string
  waitForSelector?: string
  scrollY?: number
  fullPage?: boolean
}

const BASE_URL = 'http://localhost:3000'
const OUTPUT_DIR = path.join(process.cwd(), 'docs', 'images')

// 截圖配置清單
const screenshots: ScreenshotConfig[] = [
  {
    name: 'hero-screenshot',
    url: '/',
    width: 1280,
    height: 720,
    description: 'doTERRA 精油電商平台首頁主視覺',
    waitForSelector: 'main',
    fullPage: false
  },
  {
    name: 'homepage',
    url: '/',
    width: 1280,
    height: 800,
    description: '首頁完整展示',
    waitForSelector: 'main',
    fullPage: true
  },
  {
    name: 'product-list',
    url: '/products',
    width: 1280,
    height: 800,
    description: '產品列表頁面展示',
    waitForSelector: '[data-testid="product-list"], .product-grid',
    fullPage: true
  },
  {
    name: 'search-feature',
    url: '/?search=lavender',
    width: 1280,
    height: 600,
    description: '搜尋功能展示',
    waitForSelector: '[data-testid="search-results"], .search-results',
    fullPage: false
  },
  // 響應式設計截圖
  {
    name: 'mobile-view',
    url: '/',
    width: 375,
    height: 812,
    description: '手機版視圖 (iPhone 14 Pro)',
    waitForSelector: 'main',
    fullPage: true
  },
  {
    name: 'tablet-view',
    url: '/',
    width: 768,
    height: 1024,
    description: '平板版視圖 (iPad)',
    waitForSelector: 'main',
    fullPage: true
  },
  {
    name: 'desktop-view',
    url: '/',
    width: 1440,
    height: 900,
    description: '桌面版視圖',
    waitForSelector: 'main',
    fullPage: true
  }
]

async function generateScreenshots() {
  console.log('🎬 開始生成 README 截圖...')

  // 檢查輸出目錄
  try {
    await fs.access(OUTPUT_DIR)
  } catch {
    await fs.mkdir(OUTPUT_DIR, { recursive: true })
    console.log(`📁 已建立目錄: ${OUTPUT_DIR}`)
  }

  // 啟動瀏覽器
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()

  let successCount = 0
  let failCount = 0

  for (const config of screenshots) {
    try {
      console.log(`📸 正在截取: ${config.name} (${config.width}×${config.height})`)

      const page = await context.newPage()

      // 設定視窗大小
      await page.setViewportSize({
        width: config.width,
        height: config.height
      })

      // 導航到頁面
      await page.goto(`${BASE_URL}${config.url}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      })

      // 等待特定元素載入
      if (config.waitForSelector) {
        try {
          await page.waitForSelector(config.waitForSelector, { timeout: 10000 })
        } catch (e) {
          console.log(`⚠️  警告: 未找到選擇器 ${config.waitForSelector}，繼續截圖`)
        }
      }

      // 額外等待確保頁面完全載入
      await page.waitForTimeout(2000)

      // 隱藏不需要的元素（如載入動畫）
      await page.addStyleTag({
        content: `
          .loading, .spinner, .skeleton {
            display: none !important;
          }
          * {
            animation-duration: 0s !important;
            transition-duration: 0s !important;
          }
        `
      })

      // 滾動到指定位置
      if (config.scrollY) {
        await page.evaluate((y) => window.scrollTo(0, y), config.scrollY)
        await page.waitForTimeout(1000)
      }

      // 截圖
      const outputPath = path.join(OUTPUT_DIR, `${config.name}.png`)
      await page.screenshot({
        path: outputPath,
        fullPage: config.fullPage || false,
        type: 'png'
      })

      console.log(`✅ 成功: ${config.name}.png`)
      successCount++

      await page.close()

    } catch (error) {
      console.error(`❌ 失敗: ${config.name} - ${error}`)
      failCount++
    }
  }

  await browser.close()

  console.log('\n🎉 截圖完成!')
  console.log(`✅ 成功: ${successCount} 張`)
  console.log(`❌ 失敗: ${failCount} 張`)
  console.log(`📁 圖片位置: ${OUTPUT_DIR}`)

  // 生成圖片清單
  await generateImageList()
}

async function generateImageList() {
  console.log('\n📋 正在生成圖片清單...')

  const imageList = screenshots.map(config => {
    return `- ${config.name}.png (${config.width}×${config.height}) - ${config.description}`
  }).join('\n')

  const readmeContent = `# README 圖片清單

## 生成的截圖

${imageList}

## 使用方式

在 README.md 中使用以下格式引用圖片：

\`\`\`markdown
![${screenshots[0].description}](./docs/images/${screenshots[0].name}.png)
\`\`\`

## 重新生成截圖

執行以下命令：

\`\`\`bash
npm run dev  # 啟動開發伺服器
tsx scripts/generate-readme-screenshots.ts
\`\`\`
`

  await fs.writeFile(path.join(OUTPUT_DIR, 'README.md'), readmeContent)
  console.log('✅ 已生成圖片清單文檔')
}

async function checkServer() {
  try {
    const response = await fetch(BASE_URL)
    if (response.ok) {
      console.log('✅ 開發伺服器正在運行')
      return true
    }
  } catch {
    // 伺服器未運行
  }

  console.log('❌ 開發伺服器未運行')
  console.log('請先執行: npm run dev')
  return false
}

// 主執行函數
async function main() {
  console.log('🚀 README 截圖生成器')

  const serverRunning = await checkServer()
  if (!serverRunning) {
    process.exit(1)
  }

  await generateScreenshots()
}

// 執行腳本
if (require.main === module) {
  main().catch(console.error)
}

export { generateScreenshots, screenshots }