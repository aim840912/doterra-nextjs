#!/usr/bin/env tsx

import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// 產品資料結構，包含新增的注意事項欄位
interface DetailedProduct {
  id: string;
  name: string;
  englishName: string;
  description: string;
  price?: number;
  category: string;
  brand?: string;
  volume: string;
  imageUrl: string;
  localImagePath?: string;
  productUrl?: string;
  inStock: boolean;
  rating?: number;
  tags: string[];
  benefits: string[];
  
  // 詳細特性欄位
  detailedDescription?: string;    // 產品介紹
  usageInstructions?: string;      // 使用方法
  mainBenefits?: string[];         // 主要功效
  aromaDescription?: string;       // 香味描述
  extractionMethod?: string;       // 萃取方式
  plantPart?: string;             // 萃取部位
  mainIngredients?: string[];     // 主要成分
  cautions?: string[];            // 注意事項（新增）
  
  // 商業資訊欄位
  specifications?: string;
  productCode?: string;
  retailPrice?: number;
  memberPrice?: number;
  pvPoints?: number;
}

class ProductCharacteristicsScraper {
  private browser: Browser | null = null;
  private dataPath = path.join(process.cwd(), 'src/data/doterra-real-products.json');

  constructor() {
    this.ensureDataFile();
  }

  private ensureDataFile(): void {
    if (!fs.existsSync(this.dataPath)) {
      throw new Error(`產品資料檔案不存在: ${this.dataPath}`);
    }
  }

  private async initializeBrowser(): Promise<void> {
    console.log('🚀 初始化瀏覽器...');
    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });
  }

  private async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('✅ 瀏覽器已關閉');
    }
  }

  private loadProducts(): DetailedProduct[] {
    try {
      const data = fs.readFileSync(this.dataPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`載入產品資料失敗: ${error}`);
    }
  }

  private saveProducts(products: DetailedProduct[]): void {
    try {
      fs.writeFileSync(this.dataPath, JSON.stringify(products, null, 2), 'utf-8');
      console.log('💾 產品資料已儲存');
    } catch (error) {
      console.error('❌ 儲存產品資料失敗:', error);
    }
  }

  private async extractProductCharacteristics(page: Page): Promise<Partial<DetailedProduct>> {
    console.log('📞 開始執行 page.evaluate...');
    
    return await page.evaluate(() => {
      const result: Partial<DetailedProduct> = {};
      
      try {
        console.log('🔍 開始產品特性提取...');
        console.log('🌐 當前頁面 URL:', window.location.href);
        console.log('📑 頁面標題:', document.title);
        
        // 獲取頁面文字內容
        const bodyText = document.body.innerText || '';
        console.log('📄 頁面文字長度:', bodyText.length);
        
        // 先檢查頁面內容是否包含關鍵字
        const checkKeywords = ['主要功效', '使用方法', '香味描述', '萃取方式', '萃取部位', '主要成分'];
        const foundKeywords = checkKeywords.filter(keyword => bodyText.includes(keyword));
        console.log('🔑 頁面包含的關鍵字:', foundKeywords.join(', '));
        
        // 顯示頁面文字的前200字元
        console.log('📄 頁面文字預覽:', bodyText.substring(0, 200));
        
        console.log('🚀 開始完整的產品特性提取...');
        
        // 使用確實有效的簡化提取方法
        console.log('🔍 使用簡化字串搜尋...');
        
        // 1. 主要功效
        if (bodyText.includes('主要功效')) {
          console.log('✅ 找到主要功效');
          const index = bodyText.indexOf('主要功效');
          const content = bodyText.substring(index + 4, index + 104)
            .replace(/^[：:\s\n]+/, '')
            .trim();
          
          // 分割成列表項目
          const items = content.split(/[\n]/)
            .map(item => item.trim())
            .filter(item => item.length > 3 && !item.includes('香味描述'))
            .slice(0, 3);
          
          if (items.length > 0) {
            result.mainBenefits = items;
            console.log('📝 主要功效項目:', items.length);
          }
        }
        
        // 2. 香味描述
        if (bodyText.includes('香味描述')) {
          console.log('✅ 找到香味描述');
          const index = bodyText.indexOf('香味描述');
          let content = bodyText.substring(index + 4, index + 54)
            .replace(/^[：:\s\n]+/, '')
            .trim();
          
          // 找到下一個標題之前的內容
          const nextTitleIndex = content.search(/[萃使主注]/);
          if (nextTitleIndex > 0) {
            content = content.substring(0, nextTitleIndex).trim();
          }
          
          if (content.length > 3) {
            result.aromaDescription = content;
            console.log('📝 香味描述:', content.substring(0, 20));
          }
        }
        
        // 3. 萃取方式
        if (bodyText.includes('萃取方式')) {
          console.log('✅ 找到萃取方式');
          const index = bodyText.indexOf('萃取方式');
          let content = bodyText.substring(index + 4, index + 34)
            .replace(/^[：:\s\n]+/, '')
            .trim();
          
          const nextTitleIndex = content.search(/[萃使主注]/);
          if (nextTitleIndex > 0) {
            content = content.substring(0, nextTitleIndex).trim();
          }
          
          if (content.length > 3) {
            result.extractionMethod = content;
            console.log('📝 萃取方式:', content);
          }
        }
        
        // 4. 萃取部位
        if (bodyText.includes('萃取部位')) {
          console.log('✅ 找到萃取部位');
          const index = bodyText.indexOf('萃取部位');
          let content = bodyText.substring(index + 4, index + 34)
            .replace(/^[：:\s\n]+/, '')
            .trim();
          
          const nextTitleIndex = content.search(/[主使注]/);
          if (nextTitleIndex > 0) {
            content = content.substring(0, nextTitleIndex).trim();
          }
          
          if (content.length > 0) {
            result.plantPart = content;
            console.log('📝 萃取部位:', content);
          }
        }
        
        // 5. 主要成分
        if (bodyText.includes('主要成分')) {
          console.log('✅ 找到主要成分');
          const index = bodyText.indexOf('主要成分');
          const content = bodyText.substring(index + 4, index + 104)
            .replace(/^[：:\s\n]+/, '')
            .trim();
          
          const items = content.split(/[\n]/)
            .map(item => item.trim())
            .filter(item => item.length > 1 && !item.includes('分享') && !item.includes('使用方法'))
            .slice(0, 3);
          
          if (items.length > 0) {
            result.mainIngredients = items;
            console.log('📝 主要成分項目:', items.length);
          }
        }
        
        // 6. 使用方法
        if (bodyText.includes('使用方法')) {
          console.log('✅ 找到使用方法');
          const index = bodyText.indexOf('使用方法');
          let content = bodyText.substring(index + 4, index + 154)
            .replace(/^[：:\s\n]+/, '')
            .trim();
          
          const nextTitleIndex = content.search(/[注產規]/);
          if (nextTitleIndex > 0) {
            content = content.substring(0, nextTitleIndex).trim();
          }
          
          if (content.length > 5) {
            result.usageInstructions = content;
            console.log('📝 使用方法長度:', content.length);
          }
        }
        
        // 7. 注意事項
        if (bodyText.includes('注意事項')) {
          console.log('✅ 找到注意事項');
          const index = bodyText.indexOf('注意事項');
          const content = bodyText.substring(index + 4, index + 204)
            .replace(/^[：:\s\n]+/, '')
            .trim();
          
          const items = content.split(/[\n]/)
            .map(item => item.trim())
            .filter(item => item.length > 5)
            .slice(0, 5);
          
          if (items.length > 0) {
            result.cautions = items;
            console.log('📝 注意事項項目:', items.length);
          }
        }
        
        console.log('⏭️ 簡化提取完成...');
        
        // 後備提取方法：如果標題匹配失敗，使用內容搜索
        if (!result.aromaDescription) {
          // 搜索香味描述的特定模式
          const aromaMatch = bodyText.match(/([^，。]{1,20}味)/);
          if (aromaMatch) {
            result.aromaDescription = aromaMatch[1] + '味';
            console.log('🔄 後備方式找到香味描述:', result.aromaDescription);
          }
        }
        
        if (!result.extractionMethod) {
          // 搜索萃取方式的特定模式
          const extractionMatch = bodyText.match(/(蒸氣蒸餾法|冷壓法|溶劑萃取|超臨界CO2萃取)/);
          if (extractionMatch) {
            result.extractionMethod = extractionMatch[1];
            console.log('🔄 後備方式找到萃取方式:', result.extractionMethod);
          }
        }
        
        if (!result.plantPart) {
          // 搜索植物部位的特定模式
          const plantPartMatch = bodyText.match(/(花|葉|根|莖|樹皮|果皮|種子|樹脂|木材|全株植物)/);
          if (plantPartMatch) {
            result.plantPart = plantPartMatch[1];
            console.log('🔄 後備方式找到萃取部位:', result.plantPart);
          }
        }
        
        // 統計提取結果
        const extractedFields = Object.keys(result).filter(key => result[key] !== undefined && result[key] !== null);
        console.log('📊 成功提取的欄位數:', extractedFields.length);
        console.log('📋 提取的欄位:', extractedFields);
        
      } catch (error) {
        console.error('❌ 提取過程中發生錯誤:', error);
      }
      
      return result;
    });
  }

  private async scrapeProductCharacteristics(productUrl: string, productName: string): Promise<Partial<DetailedProduct>> {
    console.log(`🔍 開始爬取: ${productName}`);
    console.log(`🌐 URL: ${productUrl}`);

    const page = await this.browser!.newPage();
    
    try {
      // 監聽頁面的 console 訊息
      page.on('console', msg => {
        if (msg.type() === 'log') {
          console.log(`[頁面] ${msg.text()}`);
        }
      });
      
      // 設定隨機 User-Agent
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });
      
      // 設定視窗大小
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // 載入頁面
      console.log('⏳ 載入頁面...');
      await page.goto(productUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      // 等待頁面完全載入
      await page.waitForTimeout(3000);
      
      // 滾動到頁面中部，確保產品內容可見
      console.log('📜 滾動到產品內容區域...');
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 3);
      });
      
      // 等待內容載入
      await page.waitForTimeout(2000);
      
      // 嘗試等待產品詳情區域出現
      try {
        await page.waitForSelector('*', { timeout: 5000 });
        console.log('✅ 頁面內容已載入');
      } catch (error) {
        console.log('⚠️ 等待內容載入超時，繼續執行...');
      }
      
      // 提取產品特性
      const characteristics = await this.extractProductCharacteristics(page);
      
      console.log(`✅ ${productName} - 爬取完成`);
      return characteristics;
      
    } catch (error) {
      console.error(`❌ ${productName} - 爬取失敗:`, error);
      return {};
    } finally {
      await page.close();
    }
  }

  private async delay(seconds: number): Promise<void> {
    const ms = seconds * 1000;
    console.log(`⏱️ 等待 ${seconds} 秒...`);
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  public async scrapeAllCharacteristics(testMode = false): Promise<void> {
    try {
      await this.initializeBrowser();
      
      const products = this.loadProducts();
      console.log(`📋 載入了 ${products.length} 個產品`);
      
      // 篩選有有效 URL 的產品
      const productsWithUrls = products.filter(p => p.productUrl && !p.productUrl.includes('doterra-'));
      console.log(`🔗 找到 ${productsWithUrls.length} 個有有效 URL 的產品`);
      
      if (testMode) {
        console.log('🧪 測試模式：只處理第一個產品');
        productsWithUrls.splice(1);
      }
      
      let processedCount = 0;
      let successCount = 0;
      
      for (const product of productsWithUrls) {
        try {
          processedCount++;
          console.log(`\n[${processedCount}/${productsWithUrls.length}] 處理: ${product.name}`);
          
          const characteristics = await this.scrapeProductCharacteristics(product.productUrl!, product.name);
          
          // 更新產品資料（只更新有值的欄位）
          let updated = false;
          if (characteristics.detailedDescription) {
            product.detailedDescription = characteristics.detailedDescription;
            updated = true;
          }
          if (characteristics.mainBenefits && characteristics.mainBenefits.length > 0) {
            product.mainBenefits = characteristics.mainBenefits;
            updated = true;
          }
          if (characteristics.usageInstructions) {
            product.usageInstructions = characteristics.usageInstructions;
            updated = true;
          }
          if (characteristics.aromaDescription) {
            product.aromaDescription = characteristics.aromaDescription;
            updated = true;
          }
          if (characteristics.extractionMethod) {
            product.extractionMethod = characteristics.extractionMethod;
            updated = true;
          }
          if (characteristics.plantPart) {
            product.plantPart = characteristics.plantPart;
            updated = true;
          }
          if (characteristics.mainIngredients && characteristics.mainIngredients.length > 0) {
            product.mainIngredients = characteristics.mainIngredients;
            updated = true;
          }
          if (characteristics.cautions && characteristics.cautions.length > 0) {
            product.cautions = characteristics.cautions;
            updated = true;
          }
          
          if (updated) {
            successCount++;
            console.log(`✅ ${product.name} - 資料已更新`);
          } else {
            console.log(`⚠️ ${product.name} - 未提取到新資料`);
          }
          
          // 每 5 個產品儲存一次
          if (processedCount % 5 === 0) {
            this.saveProducts(products);
            console.log(`💾 進度儲存 (${processedCount}/${productsWithUrls.length})`);
          }
          
          // 隨機延遲
          const delayTime = Math.floor(Math.random() * 6) + 3; // 3-8 秒
          await this.delay(delayTime);
          
        } catch (error) {
          console.error(`❌ 處理 ${product.name} 時發生錯誤:`, error);
          continue;
        }
      }
      
      // 最終儲存
      this.saveProducts(products);
      
      console.log('\n🎉 產品特性爬取完成！');
      console.log(`📊 統計:`);
      console.log(`   - 處理的產品: ${processedCount} 個`);
      console.log(`   - 成功更新: ${successCount} 個`);
      console.log(`   - 成功率: ${((successCount / processedCount) * 100).toFixed(1)}%`);
      
    } catch (error) {
      console.error('❌ 爬取過程中發生錯誤:', error);
    } finally {
      await this.closeBrowser();
    }
  }

  // 驗證結果
  public validateResults(): void {
    const products = this.loadProducts();
    const fieldsToCheck = [
      'detailedDescription',
      'mainBenefits',
      'usageInstructions', 
      'aromaDescription',
      'extractionMethod',
      'plantPart',
      'mainIngredients',
      'cautions'
    ];
    
    console.log('\n🔍 驗證爬取結果...');
    
    fieldsToCheck.forEach(field => {
      const count = products.filter(p => p[field] && 
        (Array.isArray(p[field]) ? p[field].length > 0 : p[field].trim().length > 0)
      ).length;
      const percentage = ((count / products.length) * 100).toFixed(1);
      console.log(`  ${field}: ${count}/${products.length} (${percentage}%)`);
    });
    
    const completeProducts = products.filter(p => 
      fieldsToCheck.some(field => p[field] && 
        (Array.isArray(p[field]) ? p[field].length > 0 : p[field].trim().length > 0)
      )
    );
    
    console.log(`\n✨ 至少有一個特性欄位的產品: ${completeProducts.length}/${products.length} (${((completeProducts.length/products.length)*100).toFixed(1)}%)`);
  }
}

// 主執行函數
async function main() {
  const scraper = new ProductCharacteristicsScraper();
  
  // 檢查命令行參數
  const args = process.argv.slice(2);
  const isTestMode = args.includes('--test');
  const validateOnly = args.includes('--validate');
  
  try {
    if (validateOnly) {
      scraper.validateResults();
    } else {
      await scraper.scrapeAllCharacteristics(isTestMode);
      scraper.validateResults();
    }
  } catch (error) {
    console.error('❌ 執行失敗:', error);
    process.exit(1);
  }
}

// 如果是直接執行此腳本
if (require.main === module) {
  main();
}

export { ProductCharacteristicsScraper };