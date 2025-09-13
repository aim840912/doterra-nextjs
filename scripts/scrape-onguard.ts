#!/usr/bin/env tsx

import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { Oil } from '../src/types/oil';

interface ProductInfo {
  name: string;
  url: string;
}

/**
 * OnGuard 產品爬蟲
 * 支援重複檢測和多分類系統
 */
class OnGuardScraper {
  private browser: Browser | null = null;
  private existingProducts: Map<string, { file: string; product: Oil; index: number }> = new Map();

  async init(): Promise<void> {
    console.log('🛡️ 初始化 OnGuard 產品爬蟲');
    this.browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // 載入現有產品資料
    await this.loadExistingProducts();
    
    console.log(`✅ 瀏覽器啟動完成，已載入 ${this.existingProducts.size} 個現有產品`);
  }

  /**
   * 載入現有產品資料，建立 productCode 索引
   */
  private async loadExistingProducts(): Promise<void> {
    const productFiles = [
      'src/data/products/single-oils.json',
      'src/data/products/proprietary-blends.json',
      'src/data/products/skincare.json',
      'src/data/products/wellness.json',
      'src/data/products/accessories.json',
      'src/data/products/onguard-collection.json' // 新增：載入現有 OnGuard 產品以避免重複
    ];

    for (const filePath of productFiles) {
      if (fs.existsSync(filePath)) {
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          if (Array.isArray(data)) {
            data.forEach((product: Oil, index: number) => {
              if (product.productCode) {
                this.existingProducts.set(product.productCode, {
                  file: filePath,
                  product,
                  index
                });
              }
            });
          }
        } catch (error) {
          console.warn(`⚠️ 無法載入 ${filePath}:`, error);
        }
      }
    }
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      console.log('✅ 瀏覽器已關閉');
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 智能分割主要功效
   * 改進版：處理換行符號和特殊情況
   */
  private splitMainBenefits(text: string): string[] {
    if (!text || typeof text !== 'string') return [];
    
    // 先處理換行符號和多餘空白
    const cleanText = text.replace(/\r?\n/g, '').replace(/\s+/g, ' ').trim();
    
    // 優先使用「、」作為分隔符（中文常用）
    if (cleanText.includes('、')) {
      const parts = cleanText.split('、').map(item => item.trim()).filter(item => item.length > 0);
      // 確保每個部分都是完整的句子
      return parts.filter(part => part.length > 2);
    }
    
    // 使用「|」分隔符，但要檢查是否會產生不完整的片段
    if (cleanText.includes('|')) {
      const parts = cleanText.split('|').map(item => item.trim()).filter(item => item.length > 0);
      
      // 檢查是否有過短的片段（可能是錯誤分割）
      const hasShortParts = parts.some(part => part.length < 3 || /^[中後前]$/.test(part));
      
      if (!hasShortParts && parts.length > 1) {
        return parts;
      }
      
      // 如果有問題，嘗試修復常見的錯誤分割模式
      const fixedText = this.fixCommonSplitIssues(cleanText);
      if (fixedText !== cleanText) {
        return fixedText.split('|').map(item => item.trim()).filter(item => item.length > 0);
      }
    }
    
    // 使用「，」分隔符，但要更謹慎
    if (cleanText.includes('，')) {
      const parts = cleanText.split('，');
      // 只有在每個部分都足夠長且看起來像完整句子時才分割
      if (parts.length >= 2 && parts.every(part => part.trim().length > 5)) {
        return parts.map(item => item.trim()).filter(item => item.length > 0);
      }
    }

    // 如果都無法分割，返回整個文字作為單一項目
    return [cleanText];
  }

  /**
   * 修復常見的分割問題
   */
  private fixCommonSplitIssues(text: string): string {
    // 修復「前|中|後」這類被錯誤分割的詞彙
    let fixedText = text;
    
    // 修復「運動前|中|後使用」類型的錯誤分割
    // 將連續的方向詞合併
    fixedText = fixedText.replace(/([前後左右上下內外])(\|)([中後])/g, '$1、$3');
    
    // 修復被單獨分割的方向詞
    fixedText = fixedText.replace(/\|([中後前左右上下內外])(\|)/g, '、$1、');
    fixedText = fixedText.replace(/\|([中後前左右上下內外])([，。])/g, '、$1$2');
    fixedText = fixedText.replace(/\|([中後前左右上下內外])$/g, '、$1');
    
    return fixedText;
  }

  /**
   * 決定產品分類
   */
  private determineCategory(productName: string): string {
    const name = productName.toLowerCase();
    
    // 精油類產品
    if (name.includes('精油') || name.includes('oil')) {
      if (name.includes('複方') || name.includes('blend')) {
        return 'proprietary-blends';
      }
      return 'single-oils';
    }
    
    // 護膚產品
    if (name.includes('牙膏') || name.includes('漱口') || name.includes('護膚') || 
        name.includes('乳液') || name.includes('面霜')) {
      return 'skincare';
    }
    
    // 健康產品
    if (name.includes('膠囊') || name.includes('supplements') || 
        name.includes('營養') || name.includes('保健')) {
      return 'wellness';
    }
    
    // 其他 OnGuard 產品默認分類
    return 'onguard-collection';
  }

  /**
   * 獲取產品列表
   */
  async getProductLinks(): Promise<ProductInfo[]> {
    if (!this.browser) throw new Error('瀏覽器未初始化');
    
    const page = await this.browser.newPage();
    const baseUrl = 'https://www.doterra.com/TW/zh_TW/pl/onguard-products';
    
    console.log('📄 正在獲取產品列表...');
    await page.goto(baseUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    // 等待頁面載入和 JavaScript 執行（增加等待時間）
    await this.sleep(8000);

    const products: ProductInfo[] = await page.evaluate(() => {
      const links: ProductInfo[] = [];
      
      // 尋找產品連結的多種可能選擇器
      const selectors = [
        'a[href*="/p/"]',                    // 產品頁面連結
        '.product-tile a',                   // 產品卡片連結
        '.product-item a',                   // 產品項目連結
        '.pdp-product-tile a',               // PDP 產品磚連結
        '.product-card a',                   // 產品卡連結
        '.plp-product a',                    // PLP 產品連結
        '.product-listing a',                // 產品列表連結
        'a[href*="doterra.com"][href*="/p/"]' // doTERRA 產品連結
      ];

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        console.log(`找到 ${elements.length} 個連結 (${selector})`);
        
        elements.forEach(element => {
          const link = element as HTMLAnchorElement;
          const href = link.href;
          const name = link.textContent?.trim() || '';
          
          // 過濾掉無效連結
          if (href && href.includes('/p/') && name && name.length > 2) {
            // 避免重複
            if (!links.some(existing => existing.url === href)) {
              links.push({ name, url: href });
              console.log(`  - ${name}: ${href}`);
            }
          }
        });
        
        // 移除 break 語句，讓爬蟲檢查所有選擇器
      }

      return links;
    });

    console.log(`✅ 找到 ${products.length} 個 OnGuard 產品`);
    console.log('📋 產品列表：');
    products.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.name}`);
      console.log(`     URL: ${product.url}`);
    });
    
    await page.close();
    return [...new Set(products)]; // 去除重複
  }

  /**
   * 爬取單個產品詳情
   */
  async scrapeProduct(productInfo: ProductInfo): Promise<Oil | null> {
    if (!this.browser) return null;

    const page = await this.browser.newPage();
    
    try {
      console.log(`🔍 正在爬取: ${productInfo.name}`);
      console.log(`   URL: ${productInfo.url}`);

      await page.goto(productInfo.url, { 
        waitUntil: 'domcontentloaded',
        timeout: 60000 
      });
      
      await this.sleep(2000);

      // 提取基本產品資訊
      const productData = await page.evaluate(() => {
        const result: any = {
          name: '',
          englishName: '',
          description: '',
          productIntroduction: '',
          applicationGuide: '', // 新增應用指南欄位
          usageInstructions: [],
          cautions: [],
          mainBenefits: [],
          aromaDescription: '',
          extractionMethod: '',
          plantPart: '',
          mainIngredients: [],
          volume: '',
          imageUrl: '',
          url: window.location.href
        };

        // 產品名稱
        const nameEl = document.querySelector('h1');
        if (nameEl) result.name = nameEl.textContent?.trim() || '';

        // 英文名稱
        const englishNameEl = document.querySelector('.english-name, .product-english-name');
        if (englishNameEl) result.englishName = englishNameEl.textContent?.trim() || '';

        // 基本描述
        const descEl = document.querySelector('.product-description, .description p');
        if (descEl) result.description = descEl.textContent?.trim() || '';

        // 提取 itemprop="description" - 處理 OnGuard 和 Single Oils 的不同結構
        const itemPropDescEl = document.querySelector('[itemprop="description"]');

        // 情況1：itemprop 元素本身有內容（Single Oils 類型）
        if (itemPropDescEl && itemPropDescEl.textContent?.trim()) {
          result.description = itemPropDescEl.textContent.trim();
        }

        // 情況2：itemprop 是空的，內容在下一個兄弟元素（OnGuard 類型）
        if (!result.description && itemPropDescEl) {
          const nextEl = itemPropDescEl.nextElementSibling;
          if (nextEl && (nextEl.tagName === 'P' || nextEl.tagName === 'DIV')) {
            const text = nextEl.textContent?.trim();
            if (text && text.length > 0) {
              result.description = text;
            }
          }
        }

        // 情況3：如果還是沒有，嘗試從其他選擇器提取
        if (!result.description) {
          const fallbackDescEl = document.querySelector('.product-description p, .description p');
          if (fallbackDescEl) {
            result.description = fallbackDescEl.textContent?.trim() || '';
          }
        }

        // 價格資訊
        const pageText = document.body.textContent || '';
        
        const productCodeMatch = pageText.match(/產品編號[:\s]*(\d+)/);
        if (productCodeMatch) result.productCode = productCodeMatch[1];

        const retailMatch = pageText.match(/建議售價[:\s]*NT\s*\$?\s*([\d,]+)/);
        if (retailMatch) result.retailPrice = parseInt(retailMatch[1].replace(/,/g, ''), 10);

        const memberMatch = pageText.match(/會員價[:\s]*NT\s*\$?\s*([\d,]+)/);
        if (memberMatch) result.memberPrice = parseInt(memberMatch[1].replace(/,/g, ''), 10);

        const pvMatch = pageText.match(/點數[:\s]*([\d.]+)/);
        if (pvMatch) result.pvPoints = parseFloat(pvMatch[1]);

        const volumeMatch = pageText.match(/(\d+)\s*毫升/) || pageText.match(/(\d+)\s*ml/i);
        if (volumeMatch) result.volume = volumeMatch[1] + 'ml';

        // 圖片URL
        const imageLink = document.querySelector('#detail-image-link');
        if (imageLink && imageLink.href) {
          result.imageUrl = imageLink.href.split('?')[0];
        }

        return result;
      });

      // 提取H2區塊內容 - 增強版邏輯
      const h2Contents = await page.evaluate(() => {
        const h2Data = {};
        const h2Elements = Array.from(document.querySelectorAll('h2'));
        
        h2Elements.forEach(h2 => {
          const title = h2.textContent ? h2.textContent.trim() : '';
          if (title) {
            let content = '';
            
            // 簡化邏輯：直接尋找下一個兄弟元素
            let nextEl = h2.nextElementSibling;
            
            // 處理多種可能的元素類型
            while (nextEl && !content) {
              // 如果是另一個 H2，停止
              if (nextEl.tagName === 'H2') break;
              
              // 提取內容
              if (nextEl.tagName === 'P' || nextEl.tagName === 'DIV') {
                const text = nextEl.textContent?.trim();
                if (text && text.length > 0) {
                  content = text;
                  break;
                }
              } else if (nextEl.tagName === 'UL') {
                const items = Array.from(nextEl.querySelectorAll('li'));
                const listItems = items.map(li => li.textContent?.trim() || '').filter(text => text);
                if (listItems.length > 0) {
                  content = listItems.join('|');
                  break;
                }
              }
              
              // 檢查下一個元素
              nextEl = nextEl.nextElementSibling;
            }
            
            // 如果還沒找到，嘗試檢查父元素的下一個兄弟
            if (!content) {
              const parentNext = h2.parentElement?.nextElementSibling;
              if (parentNext) {
                const text = parentNext.textContent?.trim();
                if (text && text.length > 0) {
                  content = text;
                }
              }
            }
            
            // 調試日誌
            console.log(`H2: "${title}" -> "${content?.substring(0, 50)}..."`);
            
            if (content) {
              h2Data[title] = content;
            }
          }
        });

        return h2Data;
      });

      // 整合H2資料到產品資訊 - 增強版匹配邏輯
      console.log(`🔍 找到 ${Object.keys(h2Contents).length} 個 H2 標題:`, Object.keys(h2Contents));

      for (const [title, content] of Object.entries(h2Contents)) {
        const titleLower = title.toLowerCase();
        const contentStr = content as string;

        if (titleLower.includes('主要功效') || titleLower.includes('功效')) {
          productData.mainBenefits = this.splitMainBenefits(contentStr);
        } else if (titleLower.includes('香味') || titleLower.includes('氣味')) {
          productData.aromaDescription = contentStr;
        } else if (titleLower.includes('萃取') || titleLower.includes('提取')) {
          productData.extractionMethod = contentStr;
        } else if (titleLower.includes('萃取部位') || titleLower.includes('部位')) {
          productData.plantPart = contentStr;
        } else if (titleLower.includes('成分') || titleLower.includes('組成')) {
          productData.mainIngredients = this.splitMainBenefits(contentStr);
        } else if (titleLower.includes('使用方法') || titleLower.includes('使用')) {
          productData.usageInstructions = this.splitMainBenefits(contentStr);
        } else if (titleLower.includes('注意事項') || titleLower.includes('注意')) {
          productData.cautions = this.splitMainBenefits(contentStr);
        } else if (titleLower.includes('產品介紹') || 
                   titleLower.includes('介紹') ||
                   titleLower === 'product introduction') {
          productData.productIntroduction = contentStr;
          console.log(`✅ 找到產品介紹: ${contentStr.substring(0, 100)}...`);
        } else if (titleLower.includes('應用指南')) {
          productData.applicationGuide = contentStr;
          console.log(`✅ 找到應用指南: ${contentStr.substring(0, 100)}...`);
        }
      }

      // 建立完整的產品物件
      const oil: Oil = {
        id: `doterra-onguard-${Date.now()}`,
        name: productData.name || productInfo.name,
        englishName: productData.englishName || '',
        description: productData.description || '',
        category: this.determineCategory(productData.name || productInfo.name),
        collections: ['onguard'], // 標記為 OnGuard 系列
        volume: productData.volume || '',
        imageUrl: productData.imageUrl || '',
        productIntroduction: productData.productIntroduction || '',
        applicationGuide: productData.applicationGuide || '', // 新增應用指南
        mainBenefits: productData.mainBenefits || [],
        aromaDescription: productData.aromaDescription || '',
        extractionMethod: productData.extractionMethod || '',
        plantPart: productData.plantPart || '',
        mainIngredients: productData.mainIngredients || [],
        usageInstructions: productData.usageInstructions || [],
        cautions: productData.cautions || [],
        url: productData.url,
        productCode: productData.productCode || '',
        retailPrice: productData.retailPrice || undefined,
        memberPrice: productData.memberPrice || undefined,
        pvPoints: productData.pvPoints || undefined,
        tags: ['OnGuard系列', '保衛系列']
      };

      console.log(`✅ 成功爬取: ${oil.name} (產品編號: ${oil.productCode})`);
      return oil;

    } catch (error) {
      console.error(`❌ 爬取失敗: ${productInfo.name}`, error);
      return null;
    } finally {
      await page.close();
    }
  }

  /**
   * 處理產品（檢查重複並更新/新增）
   */
  async processProduct(oil: Oil): Promise<{ action: 'updated' | 'added' | 'skipped'; file?: string }> {
    // 為沒有產品編號的套組產品生成基於 URL 的編號
    if (!oil.productCode) {
      const urlPart = oil.url.split('/p/')[1]?.split('?')[0] || '';
      if (urlPart) {
        oil.productCode = `kit-${urlPart}`;
        console.log(`🔧 為套組產品生成產品編號: ${oil.name} (${oil.productCode})`);
      } else {
        console.warn(`⚠️ ${oil.name} 沒有產品編號且無法從 URL 生成，跳過處理`);
        return { action: 'skipped' };
      }
    }

    const existing = this.existingProducts.get(oil.productCode);
    
    if (existing) {
      // 產品已存在，更新所有欄位
      console.log(`🔄 產品已存在，更新產品資訊: ${oil.name} (${oil.productCode})`);
      
      const updatedProduct = {
        ...existing.product,
        // 更新所有新爬取的欄位（只有在新值存在且不為空時才更新）
        description: oil.description || existing.product.description,
        productIntroduction: oil.productIntroduction || existing.product.productIntroduction,
        applicationGuide: oil.applicationGuide || existing.product.applicationGuide,
        mainBenefits: (oil.mainBenefits?.length > 0) ? oil.mainBenefits : existing.product.mainBenefits,
        aromaDescription: oil.aromaDescription || existing.product.aromaDescription,
        extractionMethod: oil.extractionMethod || existing.product.extractionMethod,
        plantPart: oil.plantPart || existing.product.plantPart,
        mainIngredients: (oil.mainIngredients?.length > 0) ? oil.mainIngredients : existing.product.mainIngredients,
        usageInstructions: (oil.usageInstructions?.length > 0) ? oil.usageInstructions : existing.product.usageInstructions,
        cautions: (oil.cautions?.length > 0) ? oil.cautions : existing.product.cautions,
        imageUrl: oil.imageUrl || existing.product.imageUrl,
        volume: oil.volume || existing.product.volume,
        retailPrice: oil.retailPrice || existing.product.retailPrice,
        memberPrice: oil.memberPrice || existing.product.memberPrice,
        pvPoints: oil.pvPoints || existing.product.pvPoints,
        productCode: oil.productCode || existing.product.productCode,
        collections: [...new Set([
          ...(existing.product.collections || []),
          'onguard'
        ])]
      };

      // 更新檔案
      const fileData = JSON.parse(fs.readFileSync(existing.file, 'utf-8'));
      fileData[existing.index] = updatedProduct;
      fs.writeFileSync(existing.file, JSON.stringify(fileData, null, 2), 'utf-8');
      
      return { action: 'updated', file: existing.file };
    } else {
      // 新產品，新增到對應檔案
      const targetFile = this.getTargetFile(oil.category);
      console.log(`➕ 新產品，加入到: ${targetFile}`);
      
      let fileData: Oil[] = [];
      if (fs.existsSync(targetFile)) {
        fileData = JSON.parse(fs.readFileSync(targetFile, 'utf-8'));
      }
      
      fileData.push(oil);
      fs.writeFileSync(targetFile, JSON.stringify(fileData, null, 2), 'utf-8');
      
      return { action: 'added', file: targetFile };
    }
  }

  /**
   * 根據分類決定目標檔案
   */
  private getTargetFile(category: string): string {
    switch (category) {
      case 'single-oils':
        return 'src/data/products/single-oils.json';
      case 'proprietary-blends':
        return 'src/data/products/proprietary-blends.json';
      case 'skincare':
        return 'src/data/products/skincare.json';
      case 'wellness':
        return 'src/data/products/wellness.json';
      case 'accessories':
        return 'src/data/products/accessories.json';
      default:
        // 為 OnGuard 系列產品創建專門檔案
        const onguardFile = 'src/data/products/onguard-collection.json';
        if (!fs.existsSync(onguardFile)) {
          fs.writeFileSync(onguardFile, '[]', 'utf-8');
        }
        return onguardFile;
    }
  }

  /**
   * 執行完整的爬取流程
   */
  async run(): Promise<void> {
    try {
      await this.init();
      
      const products = await this.getProductLinks();
      console.log(`\n🚀 開始爬取 ${products.length} 個 OnGuard 產品\n`);

      let addedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        console.log(`\n[${i + 1}/${products.length}] 處理: ${product.name}`);
        
        const oil = await this.scrapeProduct(product);
        if (oil) {
          const result = await this.processProduct(oil);
          
          switch (result.action) {
            case 'added':
              addedCount++;
              break;
            case 'updated':
              updatedCount++;
              break;
            case 'skipped':
              skippedCount++;
              break;
          }
        } else {
          skippedCount++;
        }
        
        // 延遲避免過於頻繁的請求
        if (i < products.length - 1) {
          await this.sleep(2000);
        }
      }

      console.log(`\n📊 爬取完成統計:`);
      console.log(`   新增產品: ${addedCount}`);
      console.log(`   更新產品: ${updatedCount}`);
      console.log(`   跳過產品: ${skippedCount}`);
      console.log(`   總計處理: ${products.length}`);

    } catch (error) {
      console.error('❌ 爬取過程中發生錯誤:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// 執行爬蟲
async function main() {
  const scraper = new OnGuardScraper();
  await scraper.run();
}

if (require.main === module) {
  main().catch(console.error);
}

export default OnGuardScraper;