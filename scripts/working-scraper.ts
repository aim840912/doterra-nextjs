import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

interface ProductInfo {
  name: string;
  url: string;
}

/**
 * 工作版本的 doTERRA 爬蟲
 * 基於簡單測試的成功結果構建
 */
class WorkingScraper {
  private browser: Browser | null = null;

  async init(): Promise<void> {
    console.log('🆕 初始化工作版本爬蟲');
    this.browser = await chromium.launch({ headless: true });
    console.log('✅ 瀏覽器啟動完成');
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
   * 爬取產品列表
   */
  private async scrapeProductList(page: Page): Promise<{ products: ProductInfo[], category: string }> {
    const startUrl = 'https://www.doterra.com/TW/zh_TW/pl/single-oils';
    console.log(`🔗 訪問產品列表: ${startUrl}`);

    // 從URL中提取分類
    const category = startUrl.split('/pl/')[1] || 'essential-oils';
    console.log(`📂 產品分類: ${category}`);

    await page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await this.sleep(5000);

    // 滾動載入內容
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await this.sleep(2000);
    }

    const products = await page.evaluate(() => {
      const results = [];
      const links = Array.from(document.querySelectorAll('a[href*="/p/"]'));
      const seenUrls = new Set();

      links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.includes('/p/') && !href.includes('/pl/')) {
          const url = href.startsWith('http') ? href : `https://www.doterra.com${href}`;
          if (!seenUrls.has(url)) {
            seenUrls.add(url);
            const name = link.textContent ? link.textContent.trim() : url.split('/').pop();
            if (name) {
              results.push({ name: name.replace(/\s+/g, ' '), url });
            }
          }
        }
      });

      return results;
    });

    console.log(`✅ 獲取 ${products.length} 個產品`);
    return { products: products.slice(0, 25), category }; // 限制數量並回傳分類
  }

  /**
   * 爬取單個產品的完整資訊
   */
  private async scrapeProductDetails(page: Page, productInfo: ProductInfo, category: string) {
    console.log(`\n🔍 爬取產品: ${productInfo.name}`);
    console.log(`🔗 URL: ${productInfo.url}`);

    await page.goto(productInfo.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await this.sleep(3000);

    // 分步驟提取資訊
    const basicInfo = await page.evaluate(() => {
      const result = {
        chineseName: '',
        englishName: '',
        scientificName: '',
        description: '',
        productCode: '',
        retailPrice: 0,
        memberPrice: 0,
        pvPoints: 0,
        volume: '',
        imageUrl: ''
      };

      // 產品名稱 - 分離中文和英文
      const h1 = document.querySelector('h1');
      if (h1 && h1.textContent) {
        const fullName = h1.textContent.replace(/\s+/g, ' ').trim();
        
        // 從 H1 中提取中文名稱（移除學名部分）
        const chineseMatch = fullName.match(/^(.*?)(?:\s+[A-Za-z]|$)/);
        if (chineseMatch) {
          result.chineseName = chineseMatch[1].trim();
        }
        
        // 從 title 提取英文名稱
        const titleText = document.title || '';
        const englishMatch = titleText.match(/([A-Za-z\s]+Oil)/i);
        if (englishMatch) {
          result.englishName = englishMatch[1].trim();
        } else {
          // 從 URL 作為後備
          const url = window.location.href;
          const urlParts = url.split('/');
          const slug = urlParts[urlParts.length - 1];
          if (slug) {
            result.englishName = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).replace(/oil/i, 'Oil');
          }
        }
      }

      // 學名
      const scientific = document.querySelector('.scientific');
      if (scientific && scientific.textContent) {
        result.scientificName = scientific.textContent.trim();
      }

      // 產品描述
      const itemprop = document.querySelector('[itemprop="description"]');
      if (itemprop && itemprop.nextElementSibling && itemprop.nextElementSibling.tagName === 'P') {
        result.description = itemprop.nextElementSibling.textContent || '';
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

      // 圖片URL - 移除Google Analytics參數
      const imageLink = document.querySelector('#detail-image-link');
      if (imageLink && imageLink.href) {
        result.imageUrl = imageLink.href.split('?')[0];
      }

      return result;
    });

    // 提取H2區塊內容 - 區分左側和右側
    const h2Contents = await page.evaluate(() => {
      const h2Data = {};
      const h2Elements = Array.from(document.querySelectorAll('h2'));
      
      console.log('找到的H2元素:', h2Elements.map(h2 => h2.textContent));
      
      h2Elements.forEach(h2 => {
        const title = h2.textContent ? h2.textContent.trim() : '';
        if (title) {
          let content = '';
          
          // 判斷H2是在左側還是右側
          const parent = h2.parentElement;
          const isLeftSide = parent && parent.className && parent.className.includes('col-sm-5');
          
          if (isLeftSide) {
            // 左側內容：先檢查是否有 UL 列表（主要功效）
            const nextEl = h2.nextElementSibling;
            if (nextEl && nextEl.tagName === 'UL') {
              // 處理列表項目（主要功效）
              const items = Array.from(nextEl.querySelectorAll('li'));
              const listItems = items.map(li => li.textContent ? li.textContent.trim() : '').filter(text => text);
              if (listItems.length > 0) {
                content = listItems.join('|');
              }
            } else {
              // 尋找 #text 節點（其他左側內容：香味描述、萃取方式等）
              let nextNode = h2.nextSibling;
              
              while (nextNode) {
                if (nextNode.nodeType === 3) { // 文字節點
                  const textContent = nextNode.textContent ? nextNode.textContent.trim() : '';
                  if (textContent && !textContent.match(/^\s*$/)) {
                    content = textContent;
                    break;
                  }
                } else if (nextNode.nodeType === 1 && nextNode.tagName) {
                  // 如果遇到元素節點，停止搜尋（表示到下個區塊了）
                  break;
                }
                nextNode = nextNode.nextSibling;
              }
            }
          } else {
            // 右側內容：尋找元素節點（原邏輯）
            let nextEl = h2.nextElementSibling;
            
            while (nextEl && !content) {
              if (nextEl.tagName === 'P' && nextEl.textContent && nextEl.textContent.trim()) {
                content = nextEl.textContent.trim();
              } else if (nextEl.tagName === 'UL') {
                const items = Array.from(nextEl.querySelectorAll('li'));
                const listItems = items.map(li => li.textContent ? li.textContent.trim() : '').filter(text => text);
                if (listItems.length > 0) {
                  content = listItems.join('|');
                }
              } else if (nextEl.tagName === 'DIV' && nextEl.textContent && nextEl.textContent.trim()) {
                content = nextEl.textContent.trim();
              }
              
              if (!content) {
                nextEl = nextEl.nextElementSibling;
              }
            }
          }
          
          console.log(`H2: "${title}" [${isLeftSide ? '左側' : '右側'}] -> "${content?.substring(0, 50)}..."`);
          
          if (content) {
            h2Data[title] = content;
          }
        }
      });
      
      return h2Data;
    });

    // 組合最終資料
    const oilData = {
      id: `doterra-${Date.now()}`,
      name: basicInfo.chineseName || productInfo.name,
      englishName: basicInfo.englishName || 'Unknown Oil',
      scientificName: basicInfo.scientificName,
      description: basicInfo.description,
      productIntroduction: h2Contents['產品介紹'] || '',
      usageInstructions: h2Contents['使用方法'] ? h2Contents['使用方法'].split('|') : [],
      cautions: h2Contents['注意事項'] || '',
      mainBenefits: h2Contents['主要功效'] ? h2Contents['主要功效'].split('|') : [],
      aromaDescription: h2Contents['香味描述'] || '',
      extractionMethod: h2Contents['萃取方式'] || '',
      plantPart: h2Contents['萃取部位'] || '',
      mainIngredients: h2Contents['主要成分'] ? [h2Contents['主要成分']] : [],
      category: category,
      volume: basicInfo.volume || "15ml",
      imageUrl: basicInfo.imageUrl || `/images/products/doterra/default.jpg`,
      url: productInfo.url,
      tags: ["精油", "天然"],
      productCode: basicInfo.productCode,
      retailPrice: basicInfo.retailPrice,
      memberPrice: basicInfo.memberPrice,
      pvPoints: basicInfo.pvPoints,
      ingredients: []
    };

    console.log(`✅ 成功獲取 ${oilData.name}`);
    console.log(`📝 學名: ${oilData.scientificName || '未找到'}`);
    console.log(`📝 描述長度: ${oilData.description?.length || 0} 字元`);
    console.log(`🖼️ 圖片URL: ${oilData.imageUrl}`);
    console.log(`💰 建議售價: NT$${oilData.retailPrice}, 會員價: NT$${oilData.memberPrice}`);
    console.log(`📦 產品編號: ${oilData.productCode}, PV點數: ${oilData.pvPoints}`);

    return oilData;
  }

  /**
   * 運行單產品測試
   */
  async runSingleTest(): Promise<void> {
    if (!this.browser) throw new Error('瀏覽器未初始化');

    const page = await this.browser.newPage();
    
    try {
      // 步驟1：獲取產品列表
      const { products, category } = await this.scrapeProductList(page);
      
      if (products.length === 0) {
        console.log('❌ 未找到任何產品');
        return;
      }

      // 步驟2：測試單個產品
      const testProduct = products.find(p => p.url.includes('clove-oil')) || products[0];
      console.log(`\n🎯 選擇測試產品: ${testProduct.name}`);

      const oilData = await this.scrapeProductDetails(page, testProduct, category);
      
      // 保存結果
      const outputPath = path.join(process.cwd(), 'src/data/doterra-real-products.json');
      fs.writeFileSync(outputPath, JSON.stringify([oilData], null, 2), 'utf-8');
      console.log(`💾 結果已保存到: ${outputPath}`);

      console.log('\n🎉 單產品測試成功！');
      console.log('📊 測試結果摘要:');
      console.log(`   產品名稱: ${oilData.name}`);
      console.log(`   學名: ${oilData.scientificName || '未取得'}`);
      console.log(`   產品編號: ${oilData.productCode}`);
      console.log(`   描述長度: ${oilData.description?.length || 0} 字元`);
      console.log(`   使用方法: ${oilData.usageInstructions?.length || 0} 項`);
      console.log(`   主要功效: ${oilData.mainBenefits?.length || 0} 項`);
      console.log(`   香味描述: ${oilData.aromaDescription || '未找到'}`);
      console.log(`   萃取方式: ${oilData.extractionMethod || '未找到'}`);
      console.log(`   價格資訊: ${oilData.retailPrice ? '✅ 完整' : '❌ 缺失'}`);

    } finally {
      await page.close();
    }
  }
}

async function main() {
  console.log('🚀 啟動工作版本 doTERRA 爬蟲');
  console.log('🎯 測試完整產品資訊爬取');

  const scraper = new WorkingScraper();
  
  try {
    await scraper.init();
    await scraper.runSingleTest();
  } catch (error) {
    console.error('❌ 爬蟲運行失敗:', error);
  } finally {
    await scraper.cleanup();
  }
}

if (require.main === module) {
  main().catch(console.error);
}