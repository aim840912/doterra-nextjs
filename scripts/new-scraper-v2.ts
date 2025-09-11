import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

interface ProductInfo {
  name: string;
  url: string;
}

interface OilDetails {
  id: string;
  name: string;
  englishName: string;
  scientificName?: string;
  description: string;
  productIntroduction?: string;
  usageInstructions?: string[];
  cautions?: string;
  mainBenefits?: string[];
  aromaDescription?: string;
  extractionMethod?: string;
  plantPart?: string;
  mainIngredients?: string[];
  benefits: string[];
  category: string;
  volume: string;
  imageUrl: string;
  tags: string[];
  productCode?: string;
  retailPrice?: number;
  memberPrice?: number;
  pvPoints?: number;
  specifications?: string;
  ingredients?: string[];
}

/**
 * 全新的 doTERRA 爬蟲 v2
 * 根據HTML結構精確爬取所有產品資訊
 */
class DoTerraScraperV2 {
  private browser: Browser | null = null;
  private startUrl = 'https://www.doterra.com/TW/zh_TW/pl/single-oils';

  /**
   * 初始化爬蟲
   */
  async init(): Promise<void> {
    console.log('🆕 初始化全新 doTERRA 爬蟲 v2');
    console.log('🚀 啟動瀏覽器...');
    
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    console.log('✅ 瀏覽器啟動完成');
  }

  /**
   * 關閉瀏覽器
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      console.log('✅ 瀏覽器已關閉');
    }
  }

  /**
   * 等待指定時間
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 第一步：爬取產品列表
   */
  private async scrapeProductList(page: Page): Promise<ProductInfo[]> {
    console.log('📋 第一步：獲取產品列表...');
    console.log(`🔗 正在訪問列表頁面: ${this.startUrl}`);

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
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await this.sleep(2000);
    }

    // 提取產品資訊
    const products = await page.evaluate(() => {
      const productElements = Array.from(document.querySelectorAll('a[href*="/p/"], [class*="product"]')).filter(el => {
        const href = (el as HTMLAnchorElement).href;
        return href && href.includes('/p/') && !href.includes('/pl/');
      });

      const results: { name: string; url: string }[] = [];
      const seenUrls = new Set<string>();

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
            if (href && href.includes('/p/')) {
              url = href.startsWith('http') ? href : `https://www.doterra.com${href}`;
              break;
            }
          }

          // 如果element本身是link
          if (!url && (element as HTMLAnchorElement).href) {
            const href = (element as HTMLAnchorElement).href;
            if (href.includes('/p/')) {
              url = href;
            }
          }

          // 從 URL 推斷產品名稱（後備方案）
          if (!name && url) {
            const urlParts = url.split('/');
            const slug = urlParts[urlParts.length - 1];
            if (slug && slug !== 'p') {
              name = slug.replace(/-/g, ' ').replace(/oil|精油/gi, '精油');
            }
          }

          if (name && url && !seenUrls.has(url)) {
            seenUrls.add(url);
            results.push({ name: name.trim(), url });
          }
        } catch (error) {
          console.log(`處理產品 ${index + 1} 時發生錯誤:`, error);
        }
      });

      return results;
    });

    console.log(`✅ 成功獲取 ${products.length} 個產品資訊`);

    // 顯示前5個產品作為範例
    if (products.length > 0) {
      console.log('\n📋 產品列表範例:');
      products.slice(0, 5).forEach((product, index) => {
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   URL: ${product.url}`);
      });
    }

    return products;
  }

  /**
   * 第二步：爬取單個產品詳細資料
   */
  private async scrapeProductDetails(page: Page, productInfo: ProductInfo): Promise<OilDetails | null> {
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
      const productDetails = await page.evaluate(function() {
        var details = {
          name: '',
          scientificName: '',
          description: '',
          productIntroduction: '',
          usageInstructions: [],
          cautions: '',
          mainBenefits: [],
          aromaDescription: '',
          extractionMethod: '',
          plantPart: '',
          mainIngredients: [],
          productCode: '',
          retailPrice: 0,
          memberPrice: 0,
          pvPoints: 0,
          volume: '',
          specifications: '',
          imageUrl: '',
          benefits: [],
          ingredients: []
        };

        // 輔助函數：根據 h2 標題獲取後續內容
        function getContentAfterH2(h2Text, elementType) {
          elementType = elementType || 'any';
          var h2Elements = Array.from(document.querySelectorAll('h2'));
          var targetH2 = h2Elements.find(function(h2) { 
            return h2.textContent && h2.textContent.indexOf(h2Text) !== -1; 
          });
          
          if (!targetH2) return elementType === 'array' ? [] : '';
          
          var nextElement = targetH2.nextElementSibling;
          
          // 如果下一個元素不是我們要的類型，繼續找
          while (nextElement && nextElement.nodeType === 1) {
            if (elementType === 'p' && nextElement.tagName === 'P') {
              return nextElement.textContent ? nextElement.textContent.trim() : '';
            } else if (elementType === 'ul' && nextElement.tagName === 'UL') {
              var items = Array.from(nextElement.querySelectorAll('li'));
              return items.map(function(li) { 
                return li.textContent ? li.textContent.trim() : ''; 
              }).filter(function(text) { return text; });
            } else if (elementType === 'any' && nextElement.textContent && nextElement.textContent.trim()) {
              return nextElement.textContent.trim();
            }
            nextElement = nextElement.nextElementSibling;
          }
          
          return elementType === 'array' ? [] : '';
        }

        // 1. 產品名稱 - 從 .product-title 或 h1 獲取
        var productTitleEl = document.querySelector('.product-title, h1');
        if (productTitleEl && productTitleEl.textContent) {
          details.name = productTitleEl.textContent.replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
        }

        // 2. 學名 - 從 .scientific 獲取
        var scientificEl = document.querySelector('.scientific');
        if (scientificEl && scientificEl.textContent) {
          details.scientificName = scientificEl.textContent.replace(/^\s+|\s+$/g, '');
        }

        // 3. 產品描述 - 從 itemprop="description" 的下一個 p 標籤獲取
        var descriptionEl = document.querySelector('[itemprop="description"]');
        if (descriptionEl && descriptionEl.nextElementSibling && descriptionEl.nextElementSibling.tagName === 'P') {
          details.description = descriptionEl.nextElementSibling.textContent ? descriptionEl.nextElementSibling.textContent.replace(/^\s+|\s+$/g, '') : '';
        }

        // 4. 產品介紹 - 從 h2 產品介紹下方的 p 獲取
        var introduction = getContentAfterH2('產品介紹', 'p');
        if (typeof introduction === 'string') {
          details.productIntroduction = introduction;
        }

        // 5. 使用方法 - 從 h2 使用方法下方的 ul 中的 li 獲取
        var usageItems = getContentAfterH2('使用方法', 'ul');
        if (Array.isArray(usageItems)) {
          details.usageInstructions = usageItems;
        }

        // 6. 注意事項 - 從 h2 注意事項後獲取，完全不修改
        var cautionContent = getContentAfterH2('注意事項', 'any');
        if (typeof cautionContent === 'string') {
          details.cautions = cautionContent;
        }

        // 7. 左側資訊 - 主要功效
        var benefitsItems = getContentAfterH2('主要功效', 'ul');
        if (Array.isArray(benefitsItems)) {
          details.mainBenefits = benefitsItems;
        }

        // 8. 左側資訊 - 香味描述
        var aroma = getContentAfterH2('香味描述', 'any');
        if (typeof aroma === 'string') {
          details.aromaDescription = aroma;
        }

        // 9. 左側資訊 - 萃取方式
        var extraction = getContentAfterH2('萃取方式', 'any');
        if (typeof extraction === 'string') {
          details.extractionMethod = extraction;
        }

        // 10. 左側資訊 - 萃取部位
        var plantPartText = getContentAfterH2('萃取部位', 'any');
        if (typeof plantPartText === 'string') {
          details.plantPart = plantPartText;
        }

        // 11. 左側資訊 - 主要成分
        var ingredientsText = getContentAfterH2('主要成分', 'any');
        if (typeof ingredientsText === 'string') {
          details.mainIngredients = [ingredientsText]; // 轉為陣列格式
        }

        // 12. 提取價格和產品資訊
        var pageText = document.body.textContent || '';
        
        var productCodeMatch = pageText.match(/產品編號[:\s]*(\d+)/);
        details.productCode = productCodeMatch && productCodeMatch[1] ? productCodeMatch[1] : '';

        var retailPriceMatch = pageText.match(/建議售價[:\s]*NT\s*\$?\s*([\d,]+)/);
        details.retailPrice = retailPriceMatch ? parseInt(retailPriceMatch[1].replace(/,/g, ''), 10) : 0;

        var memberPriceMatch = pageText.match(/會員價[:\s]*NT\s*\$?\s*([\d,]+)/);
        details.memberPrice = memberPriceMatch ? parseInt(memberPriceMatch[1].replace(/,/g, ''), 10) : 0;

        var pvPointsMatch = pageText.match(/點數[:\s]*([\d.]+)/);
        details.pvPoints = pvPointsMatch ? parseFloat(pvPointsMatch[1]) : 0;

        var volumeMatch = pageText.match(/(\d+)\s*毫升/) || pageText.match(/(\d+)\s*ml/i);
        if (volumeMatch) {
          details.volume = volumeMatch[1] + 'ml';
        }

        // 13. 規格信息
        var specMatch = pageText.match(/規格[:\s]*([^<\n]+)/);
        if (specMatch) {
          details.specifications = specMatch[1].replace(/^\s+|\s+$/g, '');
        }

        // 14. 圖片
        var images = Array.from(document.querySelectorAll('img'));
        for (var i = 0; i < images.length; i++) {
          var img = images[i];
          if (img.src && (img.src.indexOf('product') !== -1 || (img.alt && img.alt.indexOf('精油') !== -1))) {
            details.imageUrl = img.src;
            break;
          }
        }

        return details;
      });

      // 後備：如果沒有獲取到名稱，從 URL 推斷
      if (!productDetails.name) {
        const urlParts = productInfo.url.split('/');
        const slug = urlParts[urlParts.length - 1];
        productDetails.name = slug.replace(/-/g, ' ').replace('oil', '精油');
      }

      // 構建最終的Oil對象
      const oilData: OilDetails = {
        id: `doterra-${Date.now()}`,
        name: productDetails.name || productInfo.name,
        englishName: productDetails.name || productInfo.name,
        scientificName: productDetails.scientificName || '',
        description: productDetails.description || '',
        productIntroduction: productDetails.productIntroduction,
        usageInstructions: productDetails.usageInstructions,
        cautions: productDetails.cautions,
        mainBenefits: productDetails.mainBenefits,
        aromaDescription: productDetails.aromaDescription,
        extractionMethod: productDetails.extractionMethod,
        plantPart: productDetails.plantPart,
        mainIngredients: productDetails.mainIngredients,
        benefits: productDetails.mainBenefits || ["天然純淨", "多種用途"],
        category: "essential-oils",
        volume: productDetails.volume || "15ml",
        imageUrl: productDetails.imageUrl || "/images/products/doterra/default.jpg",
        tags: ["精油", "天然"],
        productCode: productDetails.productCode,
        retailPrice: productDetails.retailPrice,
        memberPrice: productDetails.memberPrice,
        pvPoints: productDetails.pvPoints,
        specifications: productDetails.specifications,
        ingredients: productDetails.mainIngredients || []
      };

      console.log(`✅ 成功獲取 ${oilData.name} 的詳細資料`);
      console.log(`📝 學名: ${oilData.scientificName || '未找到'}`);
      console.log(`📝 描述: ${oilData.description ? oilData.description.substring(0, 50) + '...' : '未找到'}`);
      console.log(`💰 價格: 建議售價 NT$${oilData.retailPrice}, 會員價 NT$${oilData.memberPrice}`);
      console.log(`📦 產品編號: ${oilData.productCode}, PV點數: ${oilData.pvPoints}`);

      return oilData;

    } catch (error) {
      console.error(`❌ 爬取產品 ${productInfo.name} 時發生錯誤:`, error);
      return null;
    }
  }

  /**
   * 運行爬蟲 - 單產品測試
   */
  async runSingleTest(): Promise<void> {
    if (!this.browser) {
      throw new Error('瀏覽器未初始化');
    }

    const page = await this.browser.newPage();
    
    try {
      // 步驟1：獲取產品列表
      const products = await this.scrapeProductList(page);
      
      if (products.length === 0) {
        console.log('❌ 未找到任何產品');
        return;
      }

      console.log(`✅ 第一步完成：獲取到 ${products.length} 個產品`);

      // 步驟2：測試單個產品詳細爬取
      console.log('\n🎯 第二步：測試單個產品詳細爬取...');
      
      // 優先選擇丁香精油進行測試
      let testProduct = products.find(p => p.name.includes('clove') || p.name.includes('丁香'));
      if (!testProduct) {
        testProduct = products[0]; // 如果沒有丁香精油，選第一個
      }
      
      console.log(`🎯 測試產品: ${testProduct.name}`);

      const oilData = await this.scrapeProductDetails(page, testProduct);
      
      if (!oilData) {
        console.log('❌ 產品詳細爬取失敗');
        return;
      }

      // 保存測試結果
      const outputPath = path.join(process.cwd(), 'src/data/doterra-real-products.json');
      const testResult = [oilData];
      
      fs.writeFileSync(outputPath, JSON.stringify(testResult, null, 2), 'utf-8');
      console.log(`💾 測試結果已儲存到: ${outputPath}`);

      console.log('\n🎉 單產品測試成功！');
      console.log('📊 測試結果摘要:');
      console.log(`   產品名稱: ${oilData.name}`);
      console.log(`   學名: ${oilData.scientificName || '未取得'}`);
      console.log(`   產品編號: ${oilData.productCode}`);
      console.log(`   描述長度: ${oilData.description?.length || 0} 字元`);
      console.log(`   使用方法: ${oilData.usageInstructions?.length || 0} 項`);
      console.log(`   主要功效: ${oilData.mainBenefits?.length || 0} 項`);
      console.log(`   價格資訊: ${oilData.retailPrice ? '✅ 完整' : '❌ 缺失'}`);
      console.log('\n✨ 準備就緒，可以擴展到批量爬取！');

    } finally {
      await page.close();
    }
  }
}

/**
 * 主程序
 */
async function main() {
  console.log('🚀 啟動全新 doTERRA 爬蟲 v2');
  console.log('🎯 目標：https://www.doterra.com/TW/zh_TW/pl/single-oils');

  const scraper = new DoTerraScraperV2();
  
  try {
    await scraper.init();
    await scraper.runSingleTest();
  } catch (error) {
    console.error('❌ 爬蟲運行失敗:', error);
  } finally {
    await scraper.cleanup();
  }
}

// 運行主程序
if (require.main === module) {
  main().catch(console.error);
}