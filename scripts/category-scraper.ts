#!/usr/bin/env tsx

import { chromium, Browser, Page } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'
import { Oil } from '../src/types/oil'

/**
 * 類別化爬蟲模板
 * 支援不同類別產品的獨立爬取
 */

interface ScrapingConfig {
  category: string
  categoryName: string
  baseUrl: string
  selectors: {
    productLinks: string
    productName: string
    englishName?: string
    scientificName?: string
    description: string
    productIntroduction?: string
    usageInstructions?: string
    cautions?: string
    mainBenefits?: string
    aromaDescription?: string
    extractionMethod?: string
    plantPart?: string
    mainIngredients?: string
    volume?: string
    imageUrl?: string
    retailPrice?: string
    memberPrice?: string
    productCode?: string
    pvPoints?: string
  }
  outputFile: string
}

// 預設配置模板
const CATEGORY_CONFIGS: Record<string, ScrapingConfig> = {
  'single-oils': {
    category: 'single-oils',
    categoryName: '單方精油',
    baseUrl: 'https://www.doterra.com/TW/zh_TW/c/single-oils',
    selectors: {
      productLinks: '.product-tile .product-tile-content a',
      productName: '.product-detail-header h1',
      englishName: '.product-detail-header .english-name',
      scientificName: '.scientific-name',
      description: '.product-description p',
      productIntroduction: '.product-introduction',
      usageInstructions: '.usage-instructions li',
      cautions: '.cautions-content',
      mainBenefits: '.benefits-list li',
      aromaDescription: '.aroma-description',
      extractionMethod: '.extraction-method',
      plantPart: '.plant-part',
      mainIngredients: '.main-ingredients',
      volume: '.product-size',
      imageUrl: '.product-image img',
      retailPrice: '.retail-price .price-value',
      memberPrice: '.member-price .price-value',
      productCode: '.product-code',
      pvPoints: '.pv-points'
    },
    outputFile: 'src/data/products/single-oils.json'
  },
  
  'blends': {
    category: 'blends',
    categoryName: '複方精油',
    baseUrl: 'https://www.doterra.com/TW/zh_TW/c/oil-blends',
    selectors: {
      productLinks: '.product-tile .product-tile-content a',
      productName: '.product-detail-header h1',
      englishName: '.product-detail-header .english-name',
      description: '.product-description p',
      productIntroduction: '.product-introduction',
      usageInstructions: '.usage-instructions li',
      cautions: '.cautions-content',
      mainBenefits: '.benefits-list li',
      volume: '.product-size',
      imageUrl: '.product-image img',
      retailPrice: '.retail-price .price-value',
      memberPrice: '.member-price .price-value',
      productCode: '.product-code',
      pvPoints: '.pv-points'
    },
    outputFile: 'src/data/products/blends.json'
  },

  'skincare': {
    category: 'skincare',
    categoryName: '護膚產品',
    baseUrl: 'https://www.doterra.com/TW/zh_TW/c/personal-care',
    selectors: {
      productLinks: '.product-tile .product-tile-content a',
      productName: '.product-detail-header h1',
      englishName: '.product-detail-header .english-name',
      description: '.product-description p',
      productIntroduction: '.product-introduction',
      usageInstructions: '.usage-instructions li',
      cautions: '.cautions-content',
      mainBenefits: '.benefits-list li',
      volume: '.product-size',
      imageUrl: '.product-image img',
      retailPrice: '.retail-price .price-value',
      memberPrice: '.member-price .price-value',
      productCode: '.product-code',
      pvPoints: '.pv-points'
    },
    outputFile: 'src/data/products/skincare.json'
  },

  'wellness': {
    category: 'wellness',
    categoryName: '健康產品',
    baseUrl: 'https://www.doterra.com/TW/zh_TW/c/wellness',
    selectors: {
      productLinks: '.product-tile .product-tile-content a',
      productName: '.product-detail-header h1',
      englishName: '.product-detail-header .english-name',
      description: '.product-description p',
      productIntroduction: '.product-introduction',
      usageInstructions: '.usage-instructions li',
      cautions: '.cautions-content',
      mainBenefits: '.benefits-list li',
      volume: '.product-size',
      imageUrl: '.product-image img',
      retailPrice: '.retail-price .price-value',
      memberPrice: '.member-price .price-value',
      productCode: '.product-code',
      pvPoints: '.pv-points'
    },
    outputFile: 'src/data/products/wellness.json'
  }
}

class CategoryScraper {
  private browser: Browser | null = null
  private config: ScrapingConfig
  private results: Oil[] = []
  private stats = {
    totalProducts: 0,
    successCount: 0,
    errorCount: 0,
    errors: [] as string[]
  }

  constructor(category: string, customConfig?: Partial<ScrapingConfig>) {
    const baseConfig = CATEGORY_CONFIGS[category]
    if (!baseConfig) {
      throw new Error(`不支援的類別: ${category}. 支援的類別: ${Object.keys(CATEGORY_CONFIGS).join(', ')}`)
    }

    this.config = { ...baseConfig, ...customConfig }
  }

  async init(): Promise<void> {
    console.log(`🚀 初始化 ${this.config.categoryName} 爬蟲`)
    this.browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    console.log('✅ 瀏覽器啟動完成')
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      console.log('✅ 瀏覽器已關閉')
    }
  }

  async scrape(): Promise<void> {
    if (!this.browser) {
      throw new Error('瀏覽器未初始化，請先呼叫 init()')
    }

    try {
      console.log(`📋 開始爬取 ${this.config.categoryName}...`)
      
      // 第一步：取得產品連結列表
      const productLinks = await this.getProductLinks()
      console.log(`📦 找到 ${productLinks.length} 個產品`)
      
      this.stats.totalProducts = productLinks.length

      // 第二步：爬取每個產品的詳細資訊
      for (let i = 0; i < productLinks.length; i++) {
        try {
          console.log(`📄 處理產品 ${i + 1}/${productLinks.length}: ${productLinks[i]}`)
          const product = await this.scrapeProduct(productLinks[i])
          
          if (product) {
            this.results.push(product)
            this.stats.successCount++
            console.log(`✅ 成功爬取: ${product.name}`)
          }
        } catch (error) {
          this.stats.errorCount++
          const errorMsg = `爬取產品失敗 ${productLinks[i]}: ${error}`
          this.stats.errors.push(errorMsg)
          console.error(`❌ ${errorMsg}`)
        }

        // 避免被封鎖，加入延遲
        if (i < productLinks.length - 1) {
          await this.sleep(2000 + Math.random() * 1000)
        }
      }

      // 第三步：儲存結果
      await this.saveResults()
      
      console.log(`🎉 ${this.config.categoryName} 爬取完成！`)
      
    } catch (error) {
      console.error(`❌ 爬取過程發生錯誤:`, error)
      throw error
    }
  }

  private async getProductLinks(): Promise<string[]> {
    const page = await this.browser!.newPage()
    
    try {
      await page.goto(this.config.baseUrl, { waitUntil: 'networkidle' })
      await this.sleep(3000)

      const links = await page.$$eval(this.config.selectors.productLinks, elements => 
        elements
          .map(el => (el as HTMLAnchorElement).href)
          .filter(href => href && !href.includes('#'))
      )

      return [...new Set(links)] // 去除重複
    } finally {
      await page.close()
    }
  }

  private async scrapeProduct(url: string): Promise<Oil | null> {
    const page = await this.browser!.newPage()
    
    try {
      await page.goto(url, { waitUntil: 'networkidle' })
      await this.sleep(2000)

      // 提取產品資料
      const product: Partial<Oil> = {
        id: this.generateProductId(url),
        category: this.config.category,
        url: url
      }

      // 必要欄位
      product.name = await this.extractText(page, this.config.selectors.productName)
      if (!product.name) {
        console.warn(`⚠️  無法取得產品名稱: ${url}`)
        return null
      }

      // 選用欄位
      product.englishName = await this.extractText(page, this.config.selectors.englishName)
      product.scientificName = await this.extractText(page, this.config.selectors.scientificName)
      product.description = await this.extractText(page, this.config.selectors.description) || ''
      product.productIntroduction = await this.extractText(page, this.config.selectors.productIntroduction)
      product.aromaDescription = await this.extractText(page, this.config.selectors.aromaDescription)
      product.extractionMethod = await this.extractText(page, this.config.selectors.extractionMethod)
      product.plantPart = await this.extractText(page, this.config.selectors.plantPart)
      product.volume = await this.extractText(page, this.config.selectors.volume) || ''
      product.productCode = await this.extractText(page, this.config.selectors.productCode)

      // 陣列欄位
      product.usageInstructions = await this.extractTextArray(page, this.config.selectors.usageInstructions)
      product.mainBenefits = await this.extractTextArray(page, this.config.selectors.mainBenefits)
      product.mainIngredients = await this.extractTextArray(page, this.config.selectors.mainIngredients)

      // 圖片 URL
      product.imageUrl = await this.extractImageUrl(page, this.config.selectors.imageUrl)

      // 價格資訊
      const retailPriceText = await this.extractText(page, this.config.selectors.retailPrice)
      const memberPriceText = await this.extractText(page, this.config.selectors.memberPrice)
      const pvPointsText = await this.extractText(page, this.config.selectors.pvPoints)

      if (retailPriceText) {
        product.retailPrice = this.parsePrice(retailPriceText)
      }
      if (memberPriceText) {
        product.memberPrice = this.parsePrice(memberPriceText)
      }
      if (pvPointsText) {
        product.pvPoints = this.parsePrice(pvPointsText)
      }

      // 注意事項
      const cautions = await this.extractText(page, this.config.selectors.cautions)
      if (cautions) {
        product.cautions = cautions
      }

      return product as Oil
    } finally {
      await page.close()
    }
  }

  private async extractText(page: Page, selector?: string): Promise<string | null> {
    if (!selector) return null
    
    try {
      const element = await page.$(selector)
      if (!element) return null
      
      const text = await element.textContent()
      return text?.trim() || null
    } catch {
      return null
    }
  }

  private async extractTextArray(page: Page, selector?: string): Promise<string[] | undefined> {
    if (!selector) return undefined
    
    try {
      const elements = await page.$$(selector)
      if (!elements.length) return undefined
      
      const texts = await Promise.all(
        elements.map(el => el.textContent())
      )
      
      return texts
        .filter(text => text && text.trim())
        .map(text => text!.trim())
    } catch {
      return undefined
    }
  }

  private async extractImageUrl(page: Page, selector?: string): Promise<string | undefined> {
    if (!selector) return undefined
    
    try {
      const img = await page.$(selector)
      if (!img) return undefined
      
      const src = await img.getAttribute('src')
      return src || undefined
    } catch {
      return undefined
    }
  }

  private generateProductId(url: string): string {
    const timestamp = Date.now()
    const urlHash = url.split('/').pop() || 'unknown'
    return `doterra-${this.config.category}-${timestamp}-${urlHash}`
  }

  private parsePrice(priceText: string): number | undefined {
    const match = priceText.match(/[\d,]+/)
    if (!match) return undefined
    
    return parseInt(match[0].replace(/,/g, ''), 10)
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async saveResults(): Promise<void> {
    const outputPath = path.join(process.cwd(), this.config.outputFile)
    const outputDir = path.dirname(outputPath)

    // 確保目錄存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // 建立備份
    if (fs.existsSync(outputPath)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupPath = outputPath.replace('.json', `-backup-${timestamp}.json`)
      fs.copyFileSync(outputPath, backupPath)
      console.log(`💾 建立備份: ${path.basename(backupPath)}`)
    }

    // 儲存結果
    const output = JSON.stringify(this.results, null, 2)
    fs.writeFileSync(outputPath, output, 'utf-8')
    
    const fileSize = (fs.statSync(outputPath).size / 1024).toFixed(1)
    console.log(`📄 儲存檔案: ${this.config.outputFile} (${fileSize} KB)`)
  }

  printStats(): void {
    console.log('\n📊 爬取統計:')
    console.log(`類別: ${this.config.categoryName} (${this.config.category})`)
    console.log(`總產品數: ${this.stats.totalProducts}`)
    console.log(`成功: ${this.stats.successCount}`)
    console.log(`失敗: ${this.stats.errorCount}`)
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ 錯誤清單:')
      this.stats.errors.forEach(error => console.log(`  ${error}`))
    }
  }
}

// CLI 介面
async function main() {
  const category = process.argv[2]
  
  if (!category) {
    console.log('使用方法: npx tsx scripts/category-scraper.ts <category>')
    console.log(`支援的類別: ${Object.keys(CATEGORY_CONFIGS).join(', ')}`)
    process.exit(1)
  }

  const scraper = new CategoryScraper(category)
  
  try {
    await scraper.init()
    await scraper.scrape()
    scraper.printStats()
  } catch (error) {
    console.error('爬蟲執行失敗:', error)
    process.exit(1)
  } finally {
    await scraper.cleanup()
  }
}

if (require.main === module) {
  main()
}

export { CategoryScraper, CATEGORY_CONFIGS }