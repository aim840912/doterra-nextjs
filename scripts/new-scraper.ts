#!/usr/bin/env tsx

import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { Oil } from '../src/types/oil';

/**
 * 全新的 doTERRA 精油爬蟲
 * 從單方精油列表頁面開始：https://www.doterra.com/TW/zh_TW/pl/single-oils
 */

interface ProductInfo {
  name: string;
  url: string;
  imageUrl?: string;
}

class DoTerraNewScraper {
  private browser: Browser | null = null;
  private startUrl = 'https://www.doterra.com/TW/zh_TW/pl/single-oils';
  private dataFile = path.join(process.cwd(), 'src/data/doterra-real-products.json');

  constructor() {
    console.log('🆕 初始化全新 doTERRA 爬蟲');
  }

  /**
   * 初始化瀏覽器
   */
  private async initBrowser(): Promise<void> {
    console.log('🚀 啟動瀏覽器...');
    
    this.browser = await chromium.launch({
      headless: false,
      slowMo: 1000,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
      ]
    });

    console.log('✅ 瀏覽器啟動完成');
  }

  /**
   * 關閉瀏覽器
   */
  private async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('✅ 瀏覽器已關閉');
    }
  }

  /**
   * 創建新頁面
   */
  private async createPage(): Promise<Page> {
    if (!this.browser) {
      throw new Error('瀏覽器未初始化');
    }

    const context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'zh-TW'
    });

    return await context.newPage();
  }

  /**
   * 等待函數
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 爬取產品列表
   */
  private async scrapeProductList(page: Page): Promise<ProductInfo[]> {
    console.log(`🔗 正在訪問列表頁面: ${this.startUrl}`);
    
    try {
      await page.goto(this.startUrl, { 
        waitUntil: 'domcontentloaded', 
        timeout: 60000 
      });

      console.log('⏳ 等待頁面載入完成...');
      await this.sleep(5000);

      // 嘗試等待產品容器載入
      try {
        await page.waitForSelector('.grid-product, .product-item, [class*="product"]', { timeout: 10000 });
        console.log('✅ 產品容器已載入');
      } catch {
        console.log('⚠️ 未找到產品容器，繼續嘗試...');
      }

      // 滾動頁面以載入更多內容
      console.log('📜 滾動頁面載入內容...');
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
      });
      await this.sleep(3000);

      // 提取產品資訊
      const products = await page.evaluate(() => {
        console.log('🔍 開始分析頁面結構...');
        
        // 嘗試多種可能的產品選擇器
        const productSelectors = [
          '.grid-product',
          '.product-item', 
          '[class*="product-card"]',
          '[class*="product-tile"]',
          '.product',
          'article[class*="product"]',
          'div[class*="product"]'
        ];

        let productElements: NodeListOf<Element> | null = null;
        let usedSelector = '';

        for (const selector of productSelectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            productElements = elements;
            usedSelector = selector;
            console.log(`✅ 使用選擇器: ${selector}, 找到 ${elements.length} 個元素`);
            break;
          }
        }

        if (!productElements || productElements.length === 0) {
          console.log('❌ 未找到產品元素，嘗試通用方法...');
          
          // 尋找包含 "精油" 文字的連結
          const links = Array.from(document.querySelectorAll('a'));
          const oilLinks = links.filter(link => {
            const text = link.textContent?.trim() || '';
            const href = link.getAttribute('href') || '';
            return text.includes('精油') && href.includes('/p/') && text.length < 20;
          });

          console.log(`🔍 找到 ${oilLinks.length} 個包含"精油"的連結`);
          
          return oilLinks.map((link, index) => ({
            name: link.textContent?.trim() || `產品 ${index + 1}`,
            url: link.getAttribute('href')?.startsWith('/') 
              ? `https://www.doterra.com${link.getAttribute('href')}` 
              : link.getAttribute('href') || '',
            imageUrl: ''
          }));
        }

        // 從產品元素中提取資訊
        const results: Partial<Oil>[] = [];
        console.log(`📋 開始分析 ${productElements.length} 個產品元素...`);

        productElements.forEach((element, index) => {
          try {
            // 產品名稱
            const nameSelectors = [
              'h1', 'h2', 'h3', 'h4', 
              '.title', '.name', 
              '[class*="title"]', '[class*="name"]',
              'a[href*="/p/"]'
            ];
            
            let name = '';
            for (const selector of nameSelectors) {
              const nameEl = element.querySelector(selector);
              if (nameEl?.textContent?.trim()) {
                // 清理多餘的空白字符和換行符
                name = nameEl.textContent.trim().replace(/\s+/g, ' ');
                if (name.length < 50) break; // 選擇較短的名稱
              }
            }

            // 產品連結
            const linkSelectors = [
              'a[href*="/p/"]',
              'a'
            ];
            
            let url = '';
            for (const selector of linkSelectors) {
              const linkEl = element.querySelector(selector);
              const href = linkEl?.getAttribute('href');
              if (href?.includes('/p/')) {
                url = href.startsWith('/') ? `https://www.doterra.com${href}` : href;
                break;
              }
            }

            // 產品圖片
            const imgEl = element.querySelector('img');
            const imageUrl = imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src') || '';

            if (name && url) {
              results.push({
                name: name,
                url: url,
                imageUrl: imageUrl.startsWith('/') ? `https://www.doterra.com${imageUrl}` : imageUrl
              });
              console.log(`✅ 產品 ${index + 1}: ${name}`);
            } else {
              console.log(`⚠️ 產品 ${index + 1}: 缺少名稱或連結`);
            }

          } catch (error) {
            console.log(`❌ 解析產品 ${index + 1} 時出錯:`, error);
          }
        });

        console.log(`🎉 總共解析出 ${results.length} 個產品`);
        return results;
      });

      console.log(`✅ 成功獲取 ${products.length} 個產品資訊`);
      
      // 顯示前5個產品作為範例
      console.log('\n📋 產品列表範例:');
      products.slice(0, 5).forEach((product, index) => {
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   URL: ${product.url}`);
      });

      return products;

    } catch (error) {
      console.error('❌ 爬取產品列表失敗:', error);
      return [];
    }
  }

  /**
   * 爬取單個產品詳細資料
   */
  private async scrapeProductDetails(page: Page, productInfo: ProductInfo): Promise<Partial<Oil>> {
    console.log(`\n🔍 開始爬取產品: ${productInfo.name}`);
    console.log(`🔗 URL: ${productInfo.url}`);

    try {
      // 導航到產品頁面
      await page.goto(productInfo.url, { 
        waitUntil: 'domcontentloaded', 
        timeout: 60000 
      });

      console.log('⏳ 等待產品頁面載入...');
      await this.sleep(5000);

      // 提取產品詳細資料
      const productDetails = await page.evaluate(() => {
        const details: Partial<Oil> = {
          name: '',
          description: '',
          productCode: '',
          retailPrice: 0,
          memberPrice: 0,
          pvPoints: 0,
          volume: '',
          imageUrl: '',
          benefits: []
        };

        // 1. 產品名稱 - 從多個選擇器嘗試
        const nameSelectors = [
          'h1[class*="product"]',
          '.product-title h1',
          'h1',
          '.breadcrumb li:last-child'
        ];

        for (const selector of nameSelectors) {
          const element = document.querySelector(selector);
          const text = element?.textContent?.trim() || '';
          if (text && text.length < 50 && (text.includes('精油') || text.includes('油'))) {
            // 清理多餘的空白字符和換行符
            details.name = text.replace(/\s+/g, ' ').trim();
            break;
          }
        }

        // 2. 產品描述 - 智慧選擇最佳描述
        const paragraphs = Array.from(document.querySelectorAll('p')).map(p => p.textContent?.trim() || '');
        let bestDescription = '';
        let bestScore = 0;

        for (const paragraph of paragraphs) {
          if (paragraph.length < 50 || paragraph.length > 300) continue;

          let score = 0;

          // 化學成分關鍵詞 - 最高分
          const chemicalKeywords = ['酚', '醇', '烯', '酯', '醛', '酮', '主要化學', '主要天然化合物', '化學結構'];
          chemicalKeywords.forEach(keyword => {
            if (paragraph.includes(keyword)) score += 15;
          });

          // 功效關鍵詞
          const effectKeywords = ['作用', '用途', '效益', '功效', '健康', '舒緩', '幫助', '維持', '促進', '提供'];
          effectKeywords.forEach(keyword => {
            if (paragraph.includes(keyword)) score += 8;
          });

          // 專業用詞
          const professionalKeywords = ['保健專家', '注重', '愛用', '珍視', '專業人士', '草本植物'];
          professionalKeywords.forEach(keyword => {
            if (paragraph.includes(keyword)) score += 10;
          });

          // 產品特性
          const featureKeywords = ['純淨', '天然', '品質', '精油', '萃取', '蒸餾', '風味', '呵護'];
          featureKeywords.forEach(keyword => {
            if (paragraph.includes(keyword)) score += 5;
          });

          // 長度獎勵（80-200字最佳）
          if (paragraph.length >= 80 && paragraph.length <= 200) {
            score += 8;
          }

          // 避免選擇通用描述
          if (paragraph.includes('doTERRA') && paragraph.includes('品牌') && paragraph.includes('公司')) {
            score -= 20;
          }

          if (score > bestScore) {
            bestScore = score;
            bestDescription = paragraph;
          }
        }

        details.description = bestDescription;

        // 3. 提取價格和產品資訊
        const pageText = document.body.textContent || '';
        
        const productCodeMatch = pageText.match(/產品編號[:\s]*(\d+)/);
        details.productCode = productCodeMatch?.[1] || '';

        const retailPriceMatch = pageText.match(/建議售價[:\s]*NT\s*\$?\s*([\d,]+)/);
        details.retailPrice = retailPriceMatch ? parseInt(retailPriceMatch[1].replace(/,/g, '')) : 0;

        const memberPriceMatch = pageText.match(/會員價[:\s]*NT\s*\$?\s*([\d,]+)/);
        details.memberPrice = memberPriceMatch ? parseInt(memberPriceMatch[1].replace(/,/g, '')) : 0;

        const pvPointsMatch = pageText.match(/點數[:\s]*([\d.]+)/);
        details.pvPoints = pvPointsMatch ? parseFloat(pvPointsMatch[1]) : 0;

        const volumeMatch = pageText.match(/(\d+)\s*毫升/) || pageText.match(/(\d+)\s*ml/i);
        details.volume = volumeMatch ? `${volumeMatch[1]}ml` : '15ml';

        // 4. 產品圖片
        const imageSelectors = [
          '.product-gallery img',
          '.main-image img',
          '[class*="hero"] img',
          '.product-image img',
          'img[alt*="精油"], img[alt*="oil"]'
        ];
        
        for (const selector of imageSelectors) {
          const img = document.querySelector(selector) as HTMLImageElement;
          if (img?.src && !img.src.includes('placeholder')) {
            details.imageUrl = img.src;
            break;
          }
        }

        return details;
      });

      // 後備：如果沒有獲取到名稱，從 URL 推斷
      if (!productDetails.name) {
        const urlMapping: { [key: string]: string } = {
          'clove-oil': '丁香精油',
          'lavender-oil': '薰衣草精油',
          'peppermint-oil': '薄荷精油',
          'tea-tree-oil': '茶樹精油',
          'frankincense-oil': '乳香精油',
          'basil-oil': '羅勒精油',
          'cinnamon-bark-oil': '肉桂油'
        };
        
        for (const [urlKey, name] of Object.entries(urlMapping)) {
          if (productInfo.url.includes(urlKey)) {
            productDetails.name = name;
            break;
          }
        }
      }

      console.log(`✅ 成功獲取 ${productDetails.name} 的詳細資料`);
      console.log(`📝 描述: ${productDetails.description.substring(0, 80)}...`);
      console.log(`💰 價格: 建議售價 NT$${productDetails.retailPrice}, 會員價 NT$${productDetails.memberPrice}`);
      console.log(`📦 產品編號: ${productDetails.productCode}, PV點數: ${productDetails.pvPoints}`);

      return productDetails;

    } catch (error) {
      console.error(`❌ 獲取 ${productInfo.name} 詳細資料失敗:`, error);
      return null;
    }
  }

  /**
   * 主要執行函數
   */
  async run(): Promise<void> {
    try {
      await this.initBrowser();
      const page = await this.createPage();

      // 第一步：爬取產品列表
      console.log('📋 第一步：獲取產品列表...');
      const products = await this.scrapeProductList(page);

      if (products.length === 0) {
        console.log('❌ 未獲取到任何產品，請檢查網站結構');
        return;
      }

      console.log(`✅ 第一步完成：獲取到 ${products.length} 個產品`);

      // 第二步：測試單個產品詳細爬取
      console.log('\n🎯 第二步：測試單個產品詳細爬取...');
      
      // 優先測試丁香精油，如果沒有則使用第一個產品
      let testProduct = products.find(p => p.name.includes('丁香'));
      if (!testProduct) {
        testProduct = products[0];
        console.log(`⚠️ 未找到丁香精油，使用 ${testProduct.name} 進行測試`);
      } else {
        console.log(`🎯 找到丁香精油，開始測試爬取`);
      }

      const productDetails = await this.scrapeProductDetails(page, testProduct);

      if (productDetails) {
        // 轉換為標準格式並儲存
        const oilData = {
          id: 'doterra-test-1',
          name: productDetails.name,
          englishName: productDetails.name,
          description: productDetails.description,
          benefits: productDetails.benefits.length > 0 ? productDetails.benefits : ['天然純淨', '多種用途'],
          category: 'essential-oils',
          volume: productDetails.volume,
          imageUrl: `/images/products/doterra/doterra-test-1.jpg`,
          usageInstructions: '',
          tags: ['精油', '天然'],
          productCode: productDetails.productCode,
          retailPrice: productDetails.retailPrice,
          memberPrice: productDetails.memberPrice,
          pvPoints: productDetails.pvPoints
        };

        // 儲存測試結果
        fs.writeFileSync(this.dataFile, JSON.stringify([oilData], null, 2), 'utf-8');
        console.log(`💾 測試結果已儲存到: ${this.dataFile}`);

        console.log('\n🎉 單產品測試成功！');
        console.log('📊 測試結果摘要:');
        console.log(`   產品名稱: ${oilData.name}`);
        console.log(`   產品編號: ${oilData.productCode}`);
        console.log(`   描述長度: ${oilData.description.length} 字元`);
        console.log(`   價格資訊: ✅ 完整`);
        console.log('\n✨ 準備就緒，可以擴展到批量爬取！');

      } else {
        console.log('❌ 單產品測試失敗');
      }

      await this.closeBrowser();

    } catch (error) {
      console.error('❌ 爬蟲執行失敗:', error);
      await this.closeBrowser();
    }
  }
}

// 主函數
async function main() {
  console.log('🚀 啟動全新 doTERRA 爬蟲');
  console.log('🎯 目標：https://www.doterra.com/TW/zh_TW/pl/single-oils\n');

  const scraper = new DoTerraNewScraper();
  await scraper.run();
}

// 如果直接執行此檔案
if (require.main === module) {
  main().catch(console.error);
}

export { DoTerraNewScraper };