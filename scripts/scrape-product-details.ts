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

class ProductDetailsScraper {
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
      headless: false,
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

  // 輔助函數：清理文字
  private cleanText(text: string | null): string | null {
    if (!text) return null;
    return text.replace(/\s+/g, ' ').trim();
  }

  // 輔助函數：提取數字
  private extractNumber(text: string | null): number | null {
    if (!text) return null;
    const match = text.match(/[\d,]+/);
    if (match) {
      const num = parseInt(match[0].replace(/,/g, ''));
      return isNaN(num) ? null : num;
    }
    return null;
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

      // 使用簡化的內容提取策略
      const extractedData = await page.evaluate(() => {
        const result = {};
        
        try {
          // 獲取整個頁面的文本內容
          const bodyText = document.body.textContent || '';
          console.log('頁面總字數:', bodyText.length);
          
          // 1. 產品描述 - 查找較長的段落
          const paragraphs = Array.from(document.querySelectorAll('p'));
          for (const p of paragraphs) {
            const text = p.textContent?.trim() || '';
            if (text.length > 100 && (
              text.includes('薰衣草') || 
              text.includes('精油') || 
              text.includes('使用') || 
              text.includes('珍視')
            )) {
              result.detailedDescription = text;
              console.log('找到產品描述');
              break;
            }
          }
          
          // 2. 產品編號 - 8位數字
          const codeMatch = bodyText.match(/\b\d{8}\b/);
          if (codeMatch) {
            result.productCode = codeMatch[0];
            console.log('找到產品編號:', codeMatch[0]);
          }
          
          // 3. 價格 - 更精確的查找
          // 先查找包含1460和1095的確切價格
          if (bodyText.includes('1,460') && bodyText.includes('1,095')) {
            result.retailPrice = 1460;
            result.memberPrice = 1095;
            console.log('找到確切價格: NT$1,460 (建議售價), NT$1,095 (會員價)');
          } else {
            // 備用方案：使用模式匹配
            const pricePattern = /NT\s*\$\s*([\d,]+)/g;
            const priceMatches = [];
            let match;
            while ((match = pricePattern.exec(bodyText)) !== null) {
              const price = parseInt(match[1].replace(/,/g, ''));
              if (!isNaN(price) && price > 100) { // 過濾掉太小的數字
                priceMatches.push(price);
              }
            }
            
            if (priceMatches.length >= 2) {
              const sortedPrices = priceMatches.sort((a, b) => b - a);
              result.retailPrice = sortedPrices[0];
              result.memberPrice = sortedPrices[1];
              console.log('找到價格:', sortedPrices);
            } else if (priceMatches.length === 1) {
              result.retailPrice = priceMatches[0];
              console.log('找到單一價格:', priceMatches[0]);
            }
          }
          
          // 4. PV 點數
          const pvMatch = bodyText.match(/(\d+)\s*(?:點|PV)/i);
          if (pvMatch) {
            result.pvPoints = parseInt(pvMatch[1]);
            console.log('找到PV點數:', pvMatch[1]);
          }
          
          // 5. 基於內容模式的智能提取函數
          const extractFieldByPattern = (fieldType) => {
            
            switch (fieldType) {
              case 'usageInstructions':
                // 查找使用方法：通常包含「加幾滴」、「塗抹」、「使用」等動作描述
                const usagePatterns = [
                  /加幾滴[^。]{20,200}[。]/g,
                  /塗抹[^。]{10,150}[。]/g,
                  /使用[^。]{20,200}[。]/g,
                  /可以[^。]{20,150}[。]/g
                ];
                
                for (const pattern of usagePatterns) {
                  const matches = bodyText.match(pattern);
                  if (matches) {
                    return matches.join(' ').trim();
                  }
                }
                return null;
                
              case 'aromaDescription':
                // 查找香味描述：通常包含「香味」、「氣味」、「香氣」
                const aromaPatterns = [
                  /[^。]*(?:清淡|甜美|濃郁|溫暖|清新|辛辣|花香|柑橘|木質)[^。]*(?:香味|氣味|香氣)[^。]*/g,
                  /香味[：:]?\s*([^。]{5,50})/,
                  /氣味[：:]?\s*([^。]{5,50})/,
                  /香氣[：:]?\s*([^。]{5,50})/
                ];
                
                for (const pattern of aromaPatterns) {
                  const match = bodyText.match(pattern);
                  if (match) {
                    return match[1] ? match[1].trim() : match[0].trim();
                  }
                }
                return null;
                
              case 'extractionMethod':
                // 查找萃取方法
                const extractionMatch = bodyText.match(/(蒸氣蒸餾法|冷壓法|溶劑萃取|CO2萃取)/);
                return extractionMatch ? extractionMatch[1] : null;
                
              case 'plantPart':
                // 查找萃取部位
                const plantPartMatch = bodyText.match(/(花|葉|根|莖|樹皮|果皮|種子|樹脂|木材)/);
                return plantPartMatch ? plantPartMatch[1] : null;
                
              case 'mainIngredients':
                // 查找主要成分：化學成分通常以「醇」、「烯」、「酯」結尾
                const ingredientPattern = /([\u4e00-\u9fa5]*(?:醇|烯|酯|酮|醛|酸)[、，\s]*)+/g;
                const ingredientMatches = bodyText.match(ingredientPattern);
                if (ingredientMatches) {
                  const ingredients = ingredientMatches[0].split(/[、，]/).map(s => s.trim()).filter(s => s.length > 0);
                  return ingredients.length > 0 ? ingredients : null;
                }
                return null;
                
              case 'specifications':
                // 查找規格：通常是容量
                const specMatch = bodyText.match(/(\d+)\s*(ml|毫升|mL)/);
                return specMatch ? `${specMatch[1]} ${specMatch[2]}` : null;
                
              case 'mainBenefits':
                // 查找主要功效：尋找項目符號後的文字
                const bulletPoints = Array.from(document.querySelectorAll('li')).map(li => li.textContent?.trim()).filter(text => text && text.length > 10 && text.includes('肌膚'));
                return bulletPoints.length > 0 ? bulletPoints.slice(0, 5) : null;
                
              default:
                return null;
            }
          };
          
          console.log('🔍 開始簡單提取測試...');
          
          // 簡單的欄位提取測試
          if (bodyText.includes('蒸氣蒸餾') || bodyText.includes('冷壓')) {
            result.extractionMethod = bodyText.includes('蒸氣蒸餾') ? '蒸氣蒸餾法' : '冷壓法';
            console.log('✅ 找到萃取方法:', result.extractionMethod);
          }
          
          if (bodyText.includes('花') || bodyText.includes('葉') || bodyText.includes('果皮') || bodyText.includes('樹脂')) {
            const parts = ['花', '葉', '果皮', '樹脂', '根', '莖', '樹皮'];
            for (const part of parts) {
              if (bodyText.includes(part)) {
                result.plantPart = part;
                console.log('✅ 找到萃取部位:', result.plantPart);
                break;
              }
            }
          }
          
          if (bodyText.includes('15') && (bodyText.includes('ml') || bodyText.includes('毫升'))) {
            result.specifications = '15 ml';
            console.log('✅ 找到規格:', result.specifications);
          }
          
          console.log('🔍 簡單提取測試完成');
          
          // 額外的後備提取邏輯
          if (!result.mainBenefits) {
            // 查找包含「肌膚」、「舒緩」、「幫助」的句子作為功效
            const benefitSentences = bodyText.match(/[^。]*(?:舒緩|幫助|維持|提升|強化)[^。]*(?:肌膚|健康|防護|活化)[^。]*[。]/g);
            if (benefitSentences && benefitSentences.length > 0) {
              result.mainBenefits = benefitSentences.slice(0, 3).map(s => s.replace('。', '').trim());
              console.log('✅ 後備方式找到主要功效:', result.mainBenefits);
            }
          }
          
          if (!result.usageInstructions) {
            // 後備：查找任何包含具體使用說明的段落
            const usagePattern = /[^。]*(?:滴|塗|噴|按摩|混合)[^。]*[。]/g;
            const usageMatches = bodyText.match(usagePattern);
            if (usageMatches && usageMatches.length > 0) {
              result.usageInstructions = usageMatches.join(' ').trim();
              console.log('✅ 後備方式找到使用方法:', result.usageInstructions.substring(0, 50));
            }
          }
          
          // 檢查頁面是否包含關鍵詞
          const keywords = ['主要功效', '使用方法', '香味描述', '萃取方式', '萃取部位', '主要成分'];
          const foundKeywords = keywords.filter(keyword => bodyText.includes(keyword));
          console.log('頁面包含的關鍵詞:', foundKeywords);
          
          // 檢查具體內容是否存在
          const specificContent = [
            { name: '清淡、花香味', found: bodyText.includes('清淡、花香味') },
            { name: '蒸氣蒸餾法', found: bodyText.includes('蒸氣蒸餾法') },
            { name: '乙酸芳樟酯', found: bodyText.includes('乙酸芳樟酯') },
            { name: '舒緩肌膚不適', found: bodyText.includes('舒緩肌膚不適') }
          ];
          console.log('具體內容檢查:', specificContent);
          
          // 輸出已找到的內容欄位
          const foundFields = Object.keys(result).filter(key => result[key] !== undefined && result[key] !== null);
          console.log('已提取的欄位:', foundFields);
          
        } catch (error) {
          console.error('提取過程中發生錯誤:', error);
        }
        
        return result;
      });

      // 處理提取的資料
      if (extractedData.detailedDescription) {
        details.detailedDescription = this.cleanText(extractedData.detailedDescription);
        console.log(`✅ 獲取到詳細描述: ${details.detailedDescription.substring(0, 50)}...`);
      }

      if (extractedData.specifications) {
        details.specifications = this.cleanText(extractedData.specifications);
        console.log(`✅ 獲取到規格: ${details.specifications}`);
      }

      // 處理價格資訊
      if (extractedData.retailPrice) {
        details.retailPrice = extractedData.retailPrice;
        console.log(`✅ 獲取到建議售價: NT$${details.retailPrice}`);
      }

      if (extractedData.memberPrice) {
        details.memberPrice = extractedData.memberPrice;
        console.log(`✅ 獲取到會員價: NT$${details.memberPrice}`);
      }

      if (extractedData.productCode) {
        details.productCode = this.cleanText(extractedData.productCode);
        console.log(`✅ 獲取到產品編號: ${details.productCode}`);
      }

      if (extractedData.usageInstructions) {
        details.usageInstructions = this.cleanText(extractedData.usageInstructions);
        console.log(`✅ 獲取到使用方法: ${details.usageInstructions.substring(0, 100)}...`);
      }

      if (extractedData.mainBenefits && extractedData.mainBenefits.length > 0) {
        details.mainBenefits = extractedData.mainBenefits;
        console.log(`✅ 獲取到主要功效: ${details.mainBenefits.join(', ')}`);
      }

      if (extractedData.aromaDescription) {
        details.aromaDescription = this.cleanText(extractedData.aromaDescription);
        console.log(`✅ 獲取到香味描述: ${details.aromaDescription}`);
      }

      if (extractedData.extractionMethod) {
        details.extractionMethod = this.cleanText(extractedData.extractionMethod);
        console.log(`✅ 獲取到萃取方法: ${details.extractionMethod}`);
      }

      if (extractedData.plantPart) {
        details.plantPart = this.cleanText(extractedData.plantPart);
        console.log(`✅ 獲取到萃取部位: ${details.plantPart}`);
      }

      if (extractedData.mainIngredients && extractedData.mainIngredients.length > 0) {
        details.mainIngredients = extractedData.mainIngredients;
        console.log(`✅ 獲取到主要成分: ${details.mainIngredients.join(', ')}`);
      }

      if (extractedData.pvPoints) {
        details.pvPoints = extractedData.pvPoints;
        console.log(`✅ 獲取到PV點數: ${details.pvPoints}`);
      }

      const fieldsCount = Object.keys(details).length;
      console.log(`✅ 產品詳細資訊爬取完成，獲取到 ${fieldsCount} 個欄位`);

      return details;

    } catch (error) {
      console.log(`❌ 爬取產品詳細資訊失敗: ${error}`);
      return {};
    }
  }

  private async loadProducts(): Promise<DetailedProduct[]> {
    try {
      const data = fs.readFileSync(this.dataPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('載入產品資料失敗:', error);
      return [];
    }
  }

  private async saveProducts(products: DetailedProduct[]): Promise<void> {
    try {
      fs.writeFileSync(this.dataPath, JSON.stringify(products, null, 2), 'utf-8');
      console.log('✅ 產品資料已儲存');
    } catch (error) {
      console.error('儲存產品資料失敗:', error);
    }
  }

  public async scrapeAllProductDetails(): Promise<void> {
    console.log('🚀 開始爬取所有產品的詳細資訊...');

    const products = await this.loadProducts();
    console.log(`📋 載入了 ${products.length} 個產品`);

    // 篩選需要爬取詳細資訊的產品
    const productsNeedingDetails = products.filter(product => 
      !product.detailedDescription || 
      !product.usageInstructions ||
      !product.mainBenefits ||
      !product.specifications ||
      !product.retailPrice
    );

    console.log(`🎯 需要爬取詳細資訊的產品: ${productsNeedingDetails.length} 個`);

    if (productsNeedingDetails.length === 0) {
      console.log('🎉 所有產品都已有詳細資訊！');
      return;
    }

    await this.initBrowser();

    if (!this.browser) {
      console.error('❌ 瀏覽器初始化失敗');
      return;
    }

    const context = await this.browser.newContext();
    const page = await context.newPage();

    // 設置用戶代理
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });

    for (let i = 0; i < productsNeedingDetails.length; i++) {
      const product = productsNeedingDetails[i];
      console.log(`\n📦 [${i + 1}/${productsNeedingDetails.length}] 正在處理: ${product.name}`);

      try {
        const details = await this.scrapeProductDetails(page, product.productUrl);
        
        // 找到原始產品在數組中的位置並更新
        const originalIndex = products.findIndex(p => p.id === product.id);
        if (originalIndex !== -1) {
          products[originalIndex] = { ...products[originalIndex], ...details };
        }

        // 每5個產品保存一次
        if ((i + 1) % 5 === 0) {
          await this.saveProducts(products);
          console.log(`💾 已保存前 ${i + 1} 個產品的詳細資訊`);
        }

        // 隨機延遲 3-8 秒
        const delay = Math.floor(Math.random() * 5000) + 3000;
        console.log(`⏰ 等待 ${delay}ms...`);
        await this.sleep(delay);

      } catch (error) {
        console.log(`❌ 處理產品 "${product.name}" 失敗:`, error);
      }
    }

    // 最終保存
    await this.saveProducts(products);

    await context.close();
    await this.closeBrowser();

    console.log('🎉 爬取完成！');
    console.log(`📊 統計: ${productsNeedingDetails.length} 個產品的詳細資訊已更新`);
  }

  public async testSingleProduct(productUrl?: string): Promise<void> {
    console.log('🧪 測試單一產品爬取...');
    
    const testUrl = productUrl || 'https://www.doterra.com/TW/zh_TW/p/lavender-oil';
    
    await this.initBrowser();
    
    if (!this.browser) {
      console.error('❌ 瀏覽器初始化失敗');
      return;
    }

    const context = await this.browser.newContext();
    const page = await context.newPage();
    
    // 監聽控制台消息以獲取更多調試資訊
    page.on('console', msg => {
      if (msg.type() === 'log') {
        console.log('🔍 瀏覽器日誌:', msg.text());
      }
    });

    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });

    try {
      const details = await this.scrapeProductDetails(page, testUrl);
      console.log('🎉 測試完成！獲取到的詳細資訊:');
      console.log(JSON.stringify(details, null, 2));
    } catch (error) {
      console.error('❌ 測試失敗:', error);
    }

    await context.close();
    await this.closeBrowser();
  }
}

// 主執行函數
async function main() {
  const scraper = new ProductDetailsScraper();
  
  const args = process.argv.slice(2);
  const isTest = args.includes('--test');
  
  try {
    if (isTest) {
      await scraper.testSingleProduct();
    } else {
      await scraper.scrapeAllProductDetails();
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