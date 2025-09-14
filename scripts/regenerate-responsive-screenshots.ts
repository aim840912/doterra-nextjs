import { chromium } from 'playwright'
import { promises as fs } from 'fs'
import path from 'path'

const BASE_URL = 'http://localhost:3000'
const OUTPUT_DIR = path.join(process.cwd(), 'docs', 'images')

// 響應式截圖配置
const responsiveScreenshots = [
  {
    name: 'desktop-view',
    width: 1440,
    height: 900,
    description: '桌面版視圖 (1440×900)'
  },
  {
    name: 'tablet-view',
    width: 768,
    height: 1024,
    description: '平板版視圖 (iPad 768×1024)'
  },
  {
    name: 'mobile-view',
    width: 375,
    height: 812,
    description: '手機版視圖 (iPhone 14 Pro 375×812)'
  }
]

async function regenerateScreenshots() {
  console.log('🔄 重新生成響應式截圖...\n')

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()

  for (const config of responsiveScreenshots) {
    try {
      console.log(`📸 生成 ${config.name} (${config.width}×${config.height})`)

      const page = await context.newPage()

      // 設定視窗大小
      await page.setViewportSize({
        width: config.width,
        height: config.height
      })

      // 導航到首頁
      await page.goto(BASE_URL, {
        waitUntil: 'networkidle',
        timeout: 30000
      })

      // 等待頁面載入
      await page.waitForTimeout(3000)

      // 移除動畫和過渡效果
      await page.addStyleTag({
        content: `
          * {
            animation-duration: 0s !important;
            transition-duration: 0s !important;
          }
          .loading, .spinner {
            display: none !important;
          }
        `
      })

      // 截圖 - 只截取視窗範圍，不使用 fullPage
      const outputPath = path.join(OUTPUT_DIR, `${config.name}.png`)
      await page.screenshot({
        path: outputPath,
        fullPage: false, // 重要：不要全頁面截圖
        type: 'png'
      })

      console.log(`✅ 成功生成: ${config.name}.png`)

      await page.close()

    } catch (error) {
      console.error(`❌ 失敗: ${config.name} - ${error}`)
    }
  }

  await browser.close()
  console.log('\n🎉 響應式截圖重新生成完成！')
}

async function main() {
  console.log('📱 響應式截圖重新生成器\n')

  // 檢查伺服器
  try {
    const response = await fetch(BASE_URL)
    if (!response.ok) {
      throw new Error('Server not responding')
    }
    console.log('✅ 開發伺服器正在運行\n')
  } catch {
    console.log('❌ 開發伺服器未運行')
    console.log('請先執行: npm run dev')
    process.exit(1)
  }

  await regenerateScreenshots()
}

if (require.main === module) {
  main().catch(console.error)
}