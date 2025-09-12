#!/usr/bin/env tsx

import * as fs from 'fs'
import * as path from 'path'
import { Oil } from '../src/types/oil'

/**
 * 產品資料合併腳本
 * 將各類別的產品資料合併為單一檔案
 */

interface CategoryConfig {
  filename: string
  category: string
  name: string
}

const CATEGORIES: CategoryConfig[] = [
  { filename: 'single-oils.json', category: 'single-oils', name: '單方精油' },
  { filename: 'proprietary-blends.json', category: 'proprietary-blends', name: '複方精油' },
  { filename: 'skincare.json', category: 'skincare', name: '護膚產品' },
  { filename: 'wellness.json', category: 'wellness', name: '健康產品' },
  { filename: 'accessories.json', category: 'accessories', name: '配件用品' }
]

const PRODUCTS_DIR = path.join(process.cwd(), 'src/data/products')
const OUTPUT_FILE = path.join(process.cwd(), 'src/data/all-products.json')
const BACKUP_DIR = path.join(process.cwd(), 'src/data/backup')

class ProductMerger {
  private allProducts: Oil[] = []
  private stats = {
    totalProducts: 0,
    categoryCounts: {} as Record<string, number>,
    errors: [] as string[],
    warnings: [] as string[]
  }

  async run(): Promise<void> {
    console.log('🔄 開始合併產品資料...')
    
    try {
      // 確保備份目錄存在
      await this.ensureBackupDir()
      
      // 載入所有類別的產品資料
      await this.loadAllCategories()
      
      // 驗證產品資料
      await this.validateProducts()
      
      // 創建備份
      await this.createBackup()
      
      // 輸出合併檔案
      await this.outputMergedFile()
      
      // 輸出統計資訊
      this.printStats()
      
      console.log('✅ 產品資料合併完成！')
      
    } catch (error) {
      console.error('❌ 合併過程中發生錯誤:', error)
      process.exit(1)
    }
  }

  private async ensureBackupDir(): Promise<void> {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true })
      console.log('📁 建立備份目錄:', BACKUP_DIR)
    }
  }

  private async loadAllCategories(): Promise<void> {
    for (const category of CATEGORIES) {
      const filePath = path.join(PRODUCTS_DIR, category.filename)
      
      try {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8')
          const products: Oil[] = JSON.parse(content)
          
          // 驗證類別標籤
          const validatedProducts = products.map(product => ({
            ...product,
            category: product.category || category.category
          }))
          
          this.allProducts.push(...validatedProducts)
          this.stats.categoryCounts[category.category] = validatedProducts.length
          
          console.log(`📦 載入 ${category.name}: ${validatedProducts.length} 個產品`)
        } else {
          this.stats.warnings.push(`檔案不存在: ${category.filename}`)
          console.log(`⚠️  檔案不存在: ${category.filename}`)
        }
      } catch (error) {
        const errorMsg = `讀取 ${category.filename} 失敗: ${error}`
        this.stats.errors.push(errorMsg)
        console.error(`❌ ${errorMsg}`)
      }
    }

    this.stats.totalProducts = this.allProducts.length
  }

  private async validateProducts(): Promise<void> {
    const seenIds = new Set<string>()
    const duplicates: string[] = []

    for (const product of this.allProducts) {
      // 檢查重複 ID
      if (seenIds.has(product.id)) {
        duplicates.push(product.id)
      } else {
        seenIds.add(product.id)
      }

      // 檢查必要欄位
      if (!product.name) {
        this.stats.errors.push(`產品 ${product.id} 缺少名稱`)
      }
      if (!product.imageUrl) {
        this.stats.warnings.push(`產品 ${product.name || product.id} 缺少圖片 URL`)
      }
    }

    if (duplicates.length > 0) {
      this.stats.errors.push(`發現重複的產品 ID: ${duplicates.join(', ')}`)
    }

    console.log(`🔍 資料驗證完成: ${this.allProducts.length} 個產品`)
  }

  private async createBackup(): Promise<void> {
    if (fs.existsSync(OUTPUT_FILE)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupFile = path.join(BACKUP_DIR, `all-products-${timestamp}.json`)
      
      fs.copyFileSync(OUTPUT_FILE, backupFile)
      console.log('💾 建立備份:', path.basename(backupFile))
    }
  }

  private async outputMergedFile(): Promise<void> {
    // 按類別和名稱排序
    this.allProducts.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category)
      }
      return a.name.localeCompare(b.name, 'zh-TW')
    })

    const output = JSON.stringify(this.allProducts, null, 2)
    fs.writeFileSync(OUTPUT_FILE, output, 'utf-8')
    
    const fileSize = (fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1)
    console.log(`📄 輸出合併檔案: all-products.json (${fileSize} KB)`)
  }

  private printStats(): void {
    console.log('\n📊 合併統計:')
    console.log(`總產品數量: ${this.stats.totalProducts}`)
    
    if (Object.keys(this.stats.categoryCounts).length > 0) {
      console.log('\n各類別產品數量:')
      Object.entries(this.stats.categoryCounts).forEach(([category, count]) => {
        const categoryConfig = CATEGORIES.find(c => c.category === category)
        const name = categoryConfig?.name || category
        console.log(`  ${name}: ${count} 個`)
      })
    }

    if (this.stats.warnings.length > 0) {
      console.log('\n⚠️  警告:')
      this.stats.warnings.forEach(warning => console.log(`  ${warning}`))
    }

    if (this.stats.errors.length > 0) {
      console.log('\n❌ 錯誤:')
      this.stats.errors.forEach(error => console.log(`  ${error}`))
      
      if (this.stats.errors.some(error => error.includes('重複'))) {
        console.log('\n建議檢查並修復重複的產品 ID')
        process.exit(1)
      }
    }
  }
}

// 執行合併腳本
if (require.main === module) {
  const merger = new ProductMerger()
  merger.run().catch(error => {
    console.error('合併腳本執行失敗:', error)
    process.exit(1)
  })
}

export { ProductMerger }