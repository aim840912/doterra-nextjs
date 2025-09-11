#!/usr/bin/env tsx

import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// 擴展的產品資料結構
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
  productUrl: string;
  inStock: boolean;
  rating?: number;
  tags: string[];
  benefits: string[];
  // 新增的詳細資訊欄位
  detailedDescription?: string;
  usageInstructions?: string;
  mainBenefits?: string[];
  aromaDescription?: string;
  extractionMethod?: string;
  plantPart?: string;
  mainIngredients?: string[];
  // 新增的商業資訊欄位
  specifications?: string;
  productCode?: string;
  retailPrice?: number;
  memberPrice?: number;
  pvPoints?: number;
}

class ProductDetailscraper {
  private browser: Browser | null = null;
  private dataPath = path.join(process.cwd(), 'src/data/doterra-real-products.json');

  constructor() {
    this.ensureDataFile();
  }

  private ensureDataFile() {
    if (!fs.existsSync(this.dataPath)) {
      throw new Error(`產品資料檔案不存在: ${this.dataPath}`);
    }
  }

  private async sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async initBrowser(): Promise<void> {
    console.log('🔄 初始化瀏覽器...');
    
    this.browser = await chromium.launch({
      headless: false, // 設為 false 以便調試
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080'
      ]
    });
    
    console.log('✅ 瀏覽器初始化完成');
  }

  private async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('✅ 瀏覽器已關閉');
    }
  }

  private async scrapeProductDetails(page: Page, productUrl: string): Promise<{
    detailedDescription?: string;
    usageInstructions?: string;
    mainBenefits?: string[];
    aromaDescription?: string;
    extractionMethod?: string;
    plantPart?: string;
    mainIngredients?: string[];
    specifications?: string;
    productCode?: string;
    retailPrice?: number;
    memberPrice?: number;
    pvPoints?: number;
  }> {
    console.log(`📍 正在爬取產品詳細資訊: ${productUrl}`);
    
    try {
      // 訪問產品頁面
      await page.goto(productUrl, { 
        waitUntil: 'domcontentloaded', 
        timeout: 30000 
      });
      
      // 等待頁面載入
      await this.sleep(3000);

      const details: any = {};

      // 1. 獲取基本產品資訊 - 詳細描述
      try {
        const detailedDescription = await page.evaluate(() => {
          // doTERRA 產品頁面的描述選擇器
          const selectors = [
            '.product-basic__body p',
            '.product-description p',
            '.product-details .content',
            '.product-info .content p',
            '.product-overview p'
          ];
          
          for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent?.trim()) {
              return element.textContent.trim();
            }
          }
          
          return null;
        });
        
        if (detailedDescription) {
          details.detailedDescription = detailedDescription;
          console.log(`✅ 獲取到詳細描述: ${detailedDescription.substring(0, 50)}...`);
        }
      } catch (error) {
        console.log('⚠️ 無法獲取詳細描述:', error);
      }

      // 2. 獲取商業資訊 - 規格
      try {
        const specifications = await page.evaluate(() => {
          const selectors = [
            '.product-basic__type',
            '.product-specification',
            '.product-volume',
            '.product-size'
          ];
          
          for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent?.trim()) {
              return element.textContent.trim();
            }
          }
          
          return null;
        });
        
        if (specifications) {
          details.specifications = specifications;
          console.log(`✅ 獲取到規格: ${specifications}`);
        }
      } catch (error) {
        console.log('⚠️ 無法獲取規格:', error);
      }

      // 3. 獲取價格資訊
      try {
        const priceInfo = await page.evaluate(() => {
          const priceElements = document.querySelectorAll('.product-basic__costs .product-basic__total, .price, .product-price');
          const prices: number[] = [];
          
          priceElements.forEach(element => {
            const text = element.textContent?.trim();
            if (text) {
              // 提取數字（移除貨幣符號和其他字符）
              const match = text.match(/[\d,]+/);
              if (match) {
                const price = parseInt(match[0].replace(/,/g, ''));
                if (!isNaN(price)) {
                  prices.push(price);
                }
              }
            }
          });
          
          return prices;
        });
        
        if (priceInfo && priceInfo.length > 0) {
          details.retailPrice = priceInfo[0]; // 第一個價格為建議售價
          if (priceInfo.length > 1) {
            details.memberPrice = priceInfo[1]; // 第二個價格為會員價
          }
          console.log(`✅ 獲取到價格資訊: 建議售價 ${priceInfo[0]}, 會員價 ${priceInfo[1] || 'N/A'}`);
        }
      } catch (error) {
        console.log('⚠️ 無法獲取價格資訊:', error);
      }

      // 2. 獲取使用方法
      try {
        // 尋找並點擊「使用方法」標籤
        let usageTabClicked = false;
        const usageSelectors = [
          'button[data-tab="usage"]',
          'button[data-tab="directions"]',
          'text="使用方法"',
          'text="用法"', 
          'text="How to Use"',
          'text="Directions"'
        ];
        
        for (const selector of usageSelectors) {
          try {
            const element = page.locator(selector).first();
            if (await element.isVisible({ timeout: 1000 })) {
              await element.click();
              usageTabClicked = true;
              console.log(`✅ 點擊了使用方法標籤: ${selector}`);
              break;
            }
          } catch (error) {
            // 繼續嘗試下一個選擇器
          }
        }

        if (usageTabClicked) {
          await this.sleep(2000);
          
          // 先嘗試等待內容載入
          try {
            await page.waitForSelector('.tab-content, .content-panel, .panel-content', { timeout: 5000 });
          } catch (error) {
            console.log('⚠️ 內容面板載入超時，繼續嘗試');
          }
          
          const usageInstructions = await page.evaluate(() => {
            const contentSelectors = [
              '.tab-content[data-tab="usage"]',
              '.tab-content[data-tab="directions"]',
              '.usage-content',
              '.directions-content',
              '.tab-content.active',
              '.content-panel.active',
              '.panel-content',
              '.product-directions',
              '.usage-instructions'
            ];
            
            for (const selector of contentSelectors) {
              const element = document.querySelector(selector);
              if (element && element.textContent?.trim()) {
                console.log(`找到使用方法內容: ${selector}`);
                return element.textContent.trim();
              }
            }
            
            // 嘗試查找任何包含使用相關關鍵字的內容
            const allElements = document.querySelectorAll('div, p, span, section');
            for (const element of allElements) {
              const text = element.textContent?.trim() || '';
              if (text.length > 50 && (
                text.includes('使用方法') || 
                text.includes('使用說明') ||
                text.includes('How to Use') ||
                text.includes('Directions') ||
                text.includes('用法')
              )) {
                console.log('通過關鍵字找到使用方法');
                return text;
              }
            }
            
            return null;
          });
          
          if (usageInstructions) {
            details.usageInstructions = usageInstructions;
            console.log(`✅ 獲取到使用方法: ${usageInstructions.substring(0, 100)}...`);
          } else {
            console.log('⚠️ 未找到使用方法內容');
          }
        }
      } catch (error) {
        console.log('⚠️ 無法獲取使用方法:', error);
      }

      // 3. 獲取主要功效
      try {
        let benefitsTabClicked = false;
        const benefitsSelectors = [
          'button[data-tab="benefits"]',
          'button[data-tab="effects"]',
          'text="功效"',
          'text="益處"',
          'text="Benefits"'
        ];
        
        for (const selector of benefitsSelectors) {
          try {
            const element = page.locator(selector).first();
            if (await element.isVisible({ timeout: 1000 })) {
              await element.click();
              benefitsTabClicked = true;
              console.log(`✅ 點擊了功效標籤: ${selector}`);
              break;
            }
          } catch (error) {
            // 繼續嘗試下一個選擇器
          }
        }

        if (benefitsTabClicked) {
          await this.sleep(2000);
          
          const mainBenefits = await page.evaluate(() => {
            const benefitsSelectors = [
              '.tab-content[data-tab="benefits"] ul li',
              '.tab-content[data-tab="effects"] ul li',
              '.benefits-content ul li',
              '.benefits-list li'
            ];
            
            for (const selector of benefitsSelectors) {
              const elements = document.querySelectorAll(selector);
              if (elements.length > 0) {
                return Array.from(elements).map(el => el.textContent?.trim()).filter(Boolean);
              }
            }
            
            // 如果沒有列表，嘗試段落文本
            const paragraphSelectors = [
              '.tab-content[data-tab="benefits"] p',
              '.benefits-content p'
            ];
            
            for (const selector of paragraphSelectors) {
              const element = document.querySelector(selector);
              if (element && element.textContent?.trim()) {
                return [element.textContent.trim()];
              }
            }
            
            return null;
          });
          
          if (mainBenefits && mainBenefits.length > 0) {
            details.mainBenefits = mainBenefits;
            console.log(`✅ 獲取到主要功效: ${mainBenefits.join(', ')}`);
          }
        }
      } catch (error) {
        console.log('⚠️ 無法獲取主要功效:', error);
      }

      // 4. 獲取成分資訊
      try {
        let ingredientsTabClicked = false;
        const ingredientsSelectors = [
          'button[data-tab="ingredients"]',
          'button[data-tab="composition"]',
          'text="成分"',
          'text="成份"',
          'text="Ingredients"'
        ];
        
        for (const selector of ingredientsSelectors) {
          try {
            const element = page.locator(selector).first();
            if (await element.isVisible({ timeout: 1000 })) {
              await element.click();
              ingredientsTabClicked = true;
              console.log(`✅ 點擊了成分標籤: ${selector}`);
              break;
            }
          } catch (error) {
            // 繼續嘗試下一個選擇器
          }
        }

        if (ingredientsTabClicked) {
          await this.sleep(2000);
          
          const ingredientInfo = await page.evaluate(() => {
            const result: any = {};
            
            // 獲取主要成分
            const ingredientsSelectors = [
              '.tab-content[data-tab="ingredients"] ul li',
              '.ingredients-content ul li',
              '.composition-list li'
            ];
            
            for (const selector of ingredientsSelectors) {
              const elements = document.querySelectorAll(selector);
              if (elements.length > 0) {
                result.mainIngredients = Array.from(elements).map(el => el.textContent?.trim()).filter(Boolean);
                break;
              }
            }
            
            // 獲取萃取方法
            const extractionSelectors = [
              '.extraction-method',
              '.distillation-method',
              '[class*="extraction"]'
            ];
            
            for (const selector of extractionSelectors) {
              const element = document.querySelector(selector);
              if (element && element.textContent?.trim()) {
                result.extractionMethod = element.textContent.trim();
                break;
              }
            }
            
            // 獲取萃取部位
            const plantPartSelectors = [
              '.plant-part',
              '.source-part',
              '[class*="plant-part"]'
            ];
            
            for (const selector of plantPartSelectors) {
              const element = document.querySelector(selector);
              if (element && element.textContent?.trim()) {
                result.plantPart = element.textContent.trim();
                break;
              }
            }
            
            return Object.keys(result).length > 0 ? result : null;
          });
          
          if (ingredientInfo) {
            if (ingredientInfo.mainIngredients) {
              details.mainIngredients = ingredientInfo.mainIngredients;
              console.log(`✅ 獲取到主要成分: ${ingredientInfo.mainIngredients.join(', ')}`);
            }
            if (ingredientInfo.extractionMethod) {
              details.extractionMethod = ingredientInfo.extractionMethod;
              console.log(`✅ 獲取到萃取方法: ${ingredientInfo.extractionMethod}`);
            }
            if (ingredientInfo.plantPart) {
              details.plantPart = ingredientInfo.plantPart;
              console.log(`✅ 獲取到萃取部位: ${ingredientInfo.plantPart}`);
            }
          }
        }
      } catch (error) {
        console.log('⚠️ 無法獲取成分資訊:', error);
      }

      // 5. 獲取香味描述
      try {
        const aromaDescription = await page.evaluate(() => {
          const aromaSelectors = [
            '.aroma-description',
            '.scent-description',
            '.fragrance-notes',
            '[class*="aroma"]',
            '[class*="scent"]'
          ];
          
          for (const selector of aromaSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent?.trim()) {
              return element.textContent.trim();
            }
          }
          
          return null;
        });
        
        if (aromaDescription) {
          details.aromaDescription = aromaDescription;
          console.log(`✅ 獲取到香味描述: ${aromaDescription.substring(0, 50)}...`);
        }
      } catch (error) {
        console.log('⚠️ 無法獲取香味描述:', error);
      }

      console.log(`✅ 產品詳細資訊爬取完成，獲取到 ${Object.keys(details).length} 個欄位`);
      return details;

    } catch (error) {
      console.error(`❌ 爬取產品詳細資訊失敗 (${productUrl}):`, error);
      return {};
    }
  }

  private async loadExistingProducts(): Promise<DetailedProduct[]> {
    try {
      const data = fs.readFileSync(this.dataPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ 讀取產品資料失敗:', error);
      return [];
    }
  }

  private async saveProducts(products: DetailedProduct[]): Promise<void> {
    try {
      fs.writeFileSync(this.dataPath, JSON.stringify(products, null, 2), 'utf-8');
      console.log('✅ 產品資料已儲存');
    } catch (error) {
      console.error('❌ 儲存產品資料失敗:', error);
    }
  }

  public async scrapeAllProductDetails(): Promise<void> {
    console.log('🚀 開始爬取所有產品的詳細資訊...');
    
    try {
      // 載入現有產品資料
      const products = await this.loadExistingProducts();
      console.log(`📋 載入了 ${products.length} 個產品`);

      // 過濾出需要爬取詳細資訊的產品（沒有 detailedDescription 的產品）
      const productsToScrape = products.filter(product => 
        !product.detailedDescription && 
        product.productUrl && 
        product.productUrl.startsWith('http')
      );
      
      console.log(`🎯 需要爬取詳細資訊的產品: ${productsToScrape.length} 個`);

      if (productsToScrape.length === 0) {
        console.log('✅ 所有產品都已有詳細資訊');
        return;
      }

      // 初始化瀏覽器
      await this.initBrowser();
      if (!this.browser) return;

      const page = await this.browser.newPage();
      
      // 設定 User-Agent 和其他標頭
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });
      
      let processedCount = 0;
      let successCount = 0;

      for (const product of productsToScrape) {
        processedCount++;
        console.log(`\n📦 [${processedCount}/${productsToScrape.length}] 正在處理: ${product.name}`);
        
        try {
          const details = await this.scrapeProductDetails(page, product.productUrl);
          
          if (Object.keys(details).length > 0) {
            // 更新產品資料
            const productIndex = products.findIndex(p => p.id === product.id);
            if (productIndex !== -1) {
              products[productIndex] = { ...products[productIndex], ...details };
              successCount++;
              
              // 每處理 5 個產品就儲存一次
              if (processedCount % 5 === 0) {
                await this.saveProducts(products);
                console.log(`💾 已儲存進度 (${processedCount}/${productsToScrape.length})`);
              }
            }
          }
          
          // 隨機延遲 3-8 秒，避免被封鎖
          const delay = Math.floor(Math.random() * 5000) + 3000;
          console.log(`⏰ 等待 ${delay}ms...`);
          await this.sleep(delay);
          
        } catch (error) {
          console.error(`❌ 處理產品 ${product.name} 失敗:`, error);
        }
      }

      // 最終儲存
      await this.saveProducts(products);
      
      console.log('\n🎉 爬取完成！');
      console.log(`📊 統計: ${successCount}/${productsToScrape.length} 個產品成功獲取詳細資訊`);
      
      await this.closeBrowser();

    } catch (error) {
      console.error('❌ 爬取過程中發生錯誤:', error);
      await this.closeBrowser();
    }
  }

  // 測試使用真實的 doTERRA 產品頁面
  public async testWithRealProduct(): Promise<void> {
    console.log('🧪 使用真實的 doTERRA 產品進行測試...');
    
    // 使用真實的 doTERRA 薰衣草精油頁面
    const testUrl = 'https://www.doterra.com/TW/zh_TW/p/lavender-oil';
    
    try {
      await this.initBrowser();
      if (!this.browser) return;

      const page = await this.browser.newPage();
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });
      
      console.log(`📍 測試 URL: ${testUrl}`);
      const details = await this.scrapeProductDetails(page, testUrl);
      
      console.log('📊 獲取到的詳細資訊:');
      console.log(JSON.stringify(details, null, 2));
      
      await this.closeBrowser();
      
    } catch (error) {
      console.error('❌ 測試失敗:', error);
      await this.closeBrowser();
    }
  }

  // 測試單一產品爬取
  public async testSingleProduct(productId: string): Promise<void> {
    console.log(`🧪 測試單一產品爬取: ${productId}`);
    
    try {
      const products = await this.loadExistingProducts();
      const product = products.find(p => p.id === productId);
      
      if (!product) {
        console.error(`❌ 找不到產品: ${productId}`);
        return;
      }
      
      if (!product.productUrl || !product.productUrl.startsWith('http') || product.productUrl.includes('doterra-')) {
        console.error(`❌ 產品缺少有效 URL: ${productId}, URL: ${product.productUrl}`);
        console.log('🔄 使用真實產品進行測試...');
        await this.testWithRealProduct();
        return;
      }
      
      await this.initBrowser();
      if (!this.browser) return;

      const page = await this.browser.newPage();
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });
      
      const details = await this.scrapeProductDetails(page, product.productUrl);
      
      console.log('📊 獲取到的詳細資訊:');
      console.log(JSON.stringify(details, null, 2));
      
      await this.closeBrowser();
      
    } catch (error) {
      console.error('❌ 測試失敗:', error);
      await this.closeBrowser();
    }
  }
}

// 主程序
async function main() {
  const scraper = new ProductDetailscraper();
  
  const args = process.argv.slice(2);
  
  if (args.length > 0 && args[0] === '--test') {
    const productId = args[1] || 'doterra-1';
    await scraper.testSingleProduct(productId);
  } else {
    await scraper.scrapeAllProductDetails();
  }
}

// 執行主程序
if (require.main === module) {
  main().catch(console.error);
}

export { ProductDetailscraper };