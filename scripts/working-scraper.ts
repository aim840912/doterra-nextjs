import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { Oil } from '../src/types/oil';

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
   * 智能分割主要功效，支援多種分隔符
   */
  private splitMainBenefits(text: string): string[] {
    if (!text || typeof text !== 'string') return [];
    
    // 先處理頓號分隔
    if (text.includes('、')) {
      return text.split('、').map(item => item.trim()).filter(item => item.length > 0);
    }
    
    // 再處理中文逗號分隔
    if (text.includes('，')) {
      const parts = text.split('，');
      // 如果分割後每個部分都有合理長度，就進行分割
      if (parts.length >= 2 && parts.every(part => part.trim().length > 3)) {
        return parts.map(item => item.trim()).filter(item => item.length > 0);
      }
    }
    
    // 處理直線分隔符（原有邏輯）
    if (text.includes('|')) {
      return text.split('|').map(item => item.trim()).filter(item => item.length > 0);
    }
    
    // 處理多個空格分隔（如桂皮精油的情況）
    if (text.includes('  ')) {  // 兩個或多個空格
      const parts = text.split(/\s{2,}/).map(item => item.trim()).filter(item => item.length > 0);
      if (parts.length > 1) {
        return parts;
      }
    }
    
    // 如果沒有找到分隔符，返回單項陣列
    return [text.trim()];
  }

  /**
   * 建構分頁URL
   */
  private buildPageUrl(pageNum: number = 0): string {
    if (pageNum === 0) {
      return 'https://www.doterra.com/TW/zh_TW/pl/single-oils';
    }
    return `https://www.doterra.com/TW/zh_TW/pl/single-oils?page=${pageNum}&sort=displaySequence-desc`;
  }

  /**
   * 爬取產品列表
   */
  private async scrapeProductList(page: Page, pageNum: number = 0): Promise<{ products: ProductInfo[], category: string }> {
    const startUrl = this.buildPageUrl(pageNum);
    console.log(`🔗 訪問產品列表: ${startUrl}`);

    // 從URL中提取分類
    const category = startUrl.split('/pl/')[1]?.split('?')[0] || 'single-oils';
    console.log(`📂 產品分類: ${category}`);
    console.log(`📄 頁面編號: ${pageNum} (第 ${pageNum + 1} 頁)`);

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
    return { products, category }; // 回傳所有產品
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

      // 產品描述 - 支援 P 或 DIV 標籤
      const itemprop = document.querySelector('[itemprop="description"]');
      if (itemprop && itemprop.nextElementSibling) {
        const nextEl = itemprop.nextElementSibling;
        if (nextEl.tagName === 'P' || nextEl.tagName === 'DIV') {
          result.description = nextEl.textContent?.trim() || '';
        }
      }
      
      // 如果還是沒有描述，嘗試從 itemprop 元素本身提取
      if (!result.description && itemprop) {
        result.description = itemprop.textContent?.trim() || '';
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
            console.log(`左側 H2: ${title}, 下一個元素: ${nextEl?.tagName}`);
            
            if (nextEl && nextEl.tagName === 'UL') {
              // 處理列表項目（主要功效）
              const items = Array.from(nextEl.querySelectorAll('li'));
              console.log(`  找到 ${items.length} 個列表項目（左側）`);
              
              const listItems = items.map((li, index) => {
                const text = li.textContent ? li.textContent.trim() : '';
                console.log(`    項目 ${index + 1}: ${text.substring(0, 30)}...`);
                return text;
              }).filter(text => text);
              
              if (listItems.length > 0) {
                content = listItems.join('|');
              }
            } else {
              // 尋找左側內容：香味描述、萃取方式、成分等
              // 檢查順序：P 標籤 -> DIV 標籤 -> 文字節點
              const nextEl = h2.nextElementSibling;
              
              // 1. 優先檢查 P 標籤
              if (nextEl && nextEl.tagName === 'P' && nextEl.textContent && nextEl.textContent.trim()) {
                content = nextEl.textContent.trim();
                console.log(`  找到左側 P 標籤: ${content.substring(0, 50)}...`);
              }
              // 2. 檢查 DIV 標籤（呵護系列某些產品的成分在此）
              else if (nextEl && nextEl.tagName === 'DIV') {
                // 直接從 DIV 取得內容
                let divContent = nextEl.textContent && nextEl.textContent.trim();
                
                // 如果 DIV 內容為空，檢查嵌套的 DIV
                if (!divContent || divContent.length === 0) {
                  const innerDiv = nextEl.querySelector('div');
                  if (innerDiv) {
                    divContent = innerDiv.textContent && innerDiv.textContent.trim();
                  }
                }
                
                if (divContent && divContent.length > 0) {
                  content = divContent;
                  console.log(`  找到左側 DIV 標籤: ${content.substring(0, 50)}...`);
                }
              }
              // 3. 最後檢查文字節點
              else {
                let nextNode = h2.nextSibling;
                
                while (nextNode) {
                  if (nextNode.nodeType === 3) { // 文字節點
                    const textContent = nextNode.textContent ? nextNode.textContent.trim() : '';
                    if (textContent && !textContent.match(/^\s*$/)) {
                      content = textContent;
                      console.log(`  找到文字節點: ${textContent.substring(0, 30)}...`);
                      break;
                    }
                  } else if (nextNode.nodeType === 1 && nextNode.tagName) {
                    // 如果遇到元素節點，停止搜尋（表示到下個區塊了）
                    break;
                  }
                  nextNode = nextNode.nextSibling;
                }
              }
            }
          } else {
            // 右側內容：尋找元素節點（原邏輯）
            let nextEl = h2.nextElementSibling;
            console.log(`右側 H2: ${title}, 下一個元素: ${nextEl?.tagName}`);
            
            while (nextEl && !content) {
              if (nextEl.tagName === 'P' && nextEl.textContent && nextEl.textContent.trim()) {
                content = nextEl.textContent.trim();
                console.log(`  找到段落: ${content.substring(0, 50)}...`);
              } else if (nextEl.tagName === 'UL') {
                console.log(`  找到列表，處理項目...`);
                
                // 優先尋找 li > div 結構
                let items = Array.from(nextEl.querySelectorAll('li > div'));
                
                // 如果沒有 div，則直接使用 li
                if (items.length === 0) {
                  items = Array.from(nextEl.querySelectorAll('li'));
                  console.log(`  使用直接 li 結構，找到 ${items.length} 個項目`);
                } else {
                  console.log(`  使用 li > div 結構，找到 ${items.length} 個項目`);
                }
                
                const listItems = items.map((item, index) => {
                  const text = item.textContent ? item.textContent.trim().replace(/\s+/g, ' ') : '';
                  console.log(`    項目 ${index + 1}: ${text.substring(0, 40)}...`);
                  return text;
                }).filter(text => text && text.length > 0);
                
                if (listItems.length > 0) {
                  content = listItems.join('|');
                  console.log(`  列表處理完成，共 ${listItems.length} 項`);
                }
              } else if (nextEl.tagName === 'DIV' && nextEl.textContent && nextEl.textContent.trim()) {
                content = nextEl.textContent.trim();
                console.log(`  找到 DIV: ${content.substring(0, 50)}...`);
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

    // 處理使用方法的特殊邏輯
    let usageArray = [];
    if (h2Contents['使用方法']) {
      const rawUsage = h2Contents['使用方法'];
      console.log(`原始使用方法內容: ${rawUsage.substring(0, 100)}...`);
      
      // 如果已經有管道符號分隔
      if (rawUsage.includes('|')) {
        usageArray = rawUsage.split('|');
        console.log(`按管道符號分割，共 ${usageArray.length} 項`);
      }
      // 如果是長文字，嘗試用多個空格分割
      else if (rawUsage.includes('     ')) {
        usageArray = rawUsage.split(/\s{5,}/);
        console.log(`按多個空格分割，共 ${usageArray.length} 項`);
      }
      // 嘗試按句號分割（每個句子可能是一個使用方法）
      else if (rawUsage.includes('。') && rawUsage.length > 100) {
        const sentences = rawUsage.split('。').filter(s => s.trim().length > 10);
        usageArray = sentences.map(s => s.trim() + '。');
        console.log(`按句號分割，共 ${usageArray.length} 項`);
      }
      // 否則作為單一項目
      else {
        usageArray = [rawUsage];
        console.log(`作為單一項目處理`);
      }
      
      // 清理每個項目
      usageArray = usageArray
        .map(item => item.trim())
        .filter(item => item.length > 0)
        .map(item => {
          // 移除注意事項部分（如果混在一起）
          const cleanItem = item.split('注意事項')[0].trim();
          return cleanItem;
        })
        .filter(item => item.length > 0);
        
      console.log(`最終使用方法項目數: ${usageArray.length}`);
      usageArray.forEach((item, index) => {
        console.log(`  使用方法 ${index + 1}: ${item.substring(0, 40)}...`);
      });
    }

    // 組合最終資料
    const oilData = {
      id: `doterra-${Date.now()}`,
      name: basicInfo.chineseName || productInfo.name,
      englishName: basicInfo.englishName || 'Unknown Oil',
      scientificName: basicInfo.scientificName,
      description: basicInfo.description,
      productIntroduction: h2Contents['產品介紹'] || '',
      usageInstructions: usageArray,
      applicationGuide: h2Contents['應用指南'] || '',
      cautions: h2Contents['注意事項'] || '',
      mainBenefits: h2Contents['主要功效'] ? this.splitMainBenefits(h2Contents['主要功效']) : [],
      aromaDescription: h2Contents['香味描述'] || '',
      extractionMethod: h2Contents['萃取方式'] || '',
      plantPart: h2Contents['萃取部位'] || '',
      mainIngredients: (() => {
        // 優先檢查「主要成分」，如果沒有則檢查「成分」
        const mainIngredients = h2Contents['主要成分'];
        const ingredients = h2Contents['成分'];
        
        if (mainIngredients) {
          return [mainIngredients];
        } else if (ingredients) {
          // 處理逗號分隔的成分字串（呵護系列常見格式）
          return ingredients.split(/[,、]/).map(item => item.trim()).filter(item => item.length > 0);
        }
        
        return [];
      })(),
      category: category,
      volume: basicInfo.volume || "15ml",
      imageUrl: basicInfo.imageUrl || `/images/products/doterra/default.jpg`,
      url: productInfo.url,
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
   * 讀取現有的產品資料
   */
  private readExistingData(outputPath: string): Partial<Oil>[] {
    if (fs.existsSync(outputPath)) {
      try {
        const content = fs.readFileSync(outputPath, 'utf-8');
        const data = JSON.parse(content);
        return Array.isArray(data) ? data : [data];
      } catch (error) {
        console.log('⚠️ 讀取現有資料失敗，將建立新檔案');
        return [];
      }
    }
    return [];
  }

  /**
   * 儲存產品資料（追加模式）
   */
  private saveProductData(outputPath: string, newProduct: Partial<Oil>): void {
    const existingData = this.readExistingData(outputPath);
    
    // 檢查是否已存在相同產品（根據 URL 判斷）
    const existingUrls = existingData.map(item => item.url);
    if (existingUrls.includes(newProduct.url)) {
      console.log('ℹ️ 產品已存在，跳過儲存');
      return;
    }

    // 追加新產品
    existingData.push(newProduct);
    
    // 儲存更新後的資料
    fs.writeFileSync(outputPath, JSON.stringify(existingData, null, 2), 'utf-8');
    console.log(`💾 新產品已追加，總計 ${existingData.length} 個產品`);
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
      
      // 保存結果（追加模式）
      const outputPath = path.join(process.cwd(), 'src/data/doterra-real-products.json');
      this.saveProductData(outputPath, oilData);

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

  /**
   * 爬取下一個未處理的產品
   */
  async runNextProduct(): Promise<void> {
    if (!this.browser) throw new Error('瀏覽器未初始化');

    const page = await this.browser.newPage();
    
    try {
      // 步驟1：獲取產品列表
      const { products, category } = await this.scrapeProductList(page);
      
      if (products.length === 0) {
        console.log('❌ 未找到任何產品');
        return;
      }

      // 步驟2：讀取現有資料並找出未處理的產品
      const outputPath = path.join(process.cwd(), 'src/data/doterra-real-products.json');
      const existingData = this.readExistingData(outputPath);
      const existingUrls = existingData.map(item => item.url);

      console.log(`📊 已有產品數量: ${existingData.length}`);
      console.log(`📊 產品列表總數: ${products.length}`);

      // 找出未處理的產品
      const unprocessedProducts = products.filter(product => !existingUrls.includes(product.url));

      if (unprocessedProducts.length === 0) {
        console.log('✅ 所有產品都已處理完成！');
        return;
      }

      // 選擇第一個未處理的產品
      const nextProduct = unprocessedProducts[0];
      console.log(`\n🎯 選擇下一個產品: ${nextProduct.name}`);
      console.log(`📊 剩餘未處理產品: ${unprocessedProducts.length} 個`);

      const oilData = await this.scrapeProductDetails(page, nextProduct, category);
      
      // 保存結果
      this.saveProductData(outputPath, oilData);

      console.log('\n🎉 新產品爬取成功！');
      console.log('📊 爬取結果摘要:');
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

  /**
   * 專門測試羅勒精油的使用方法修正
   */
  async runBasilTest(): Promise<void> {
    if (!this.browser) throw new Error('瀏覽器未初始化');

    const page = await this.browser.newPage();
    
    try {
      console.log('🧪 開始羅勒精油測試');
      
      // 直接測試羅勒精油
      const basilProduct: ProductInfo = {
        name: 'basil-oil',
        url: 'https://www.doterra.com/TW/zh_TW/p/basil-oil'
      };

      const oilData = await this.scrapeProductDetails(page, basilProduct, 'single-oils');
      
      // 保存結果到臨時檔案以便檢視
      const outputPath = path.join(process.cwd(), 'src/data/basil-test-result.json');
      fs.writeFileSync(outputPath, JSON.stringify(oilData, null, 2), 'utf-8');
      
      console.log(`💾 測試結果已保存到: ${outputPath}`);
      console.log('\n🎉 羅勒精油測試完成！');
      console.log('📊 使用方法分析結果:');
      console.log(`   項目數量: ${oilData.usageInstructions?.length || 0}`);
      oilData.usageInstructions?.forEach((instruction, index) => {
        console.log(`   ${index + 1}. ${instruction.substring(0, 60)}${instruction.length > 60 ? '...' : ''}`);
      });

    } finally {
      await page.close();
    }
  }

  /**
   * 爬取單一頁面的所有產品
   */
  async scrapeByPage(pageNum: number): Promise<{ success: boolean, productsCount: number, newProducts: number }> {
    if (!this.browser) throw new Error('瀏覽器未初始化');

    const page = await this.browser.newPage();
    
    // 頁面資訊配置
    const PAGE_INFO = {
      0: { expected: 24, name: '第 1 頁' },
      1: { expected: 24, name: '第 2 頁' },
      2: { expected: 24, name: '第 3 頁' },
      3: { expected: 2,  name: '第 4 頁' }
    };

    const pageInfo = PAGE_INFO[pageNum] || { expected: 24, name: `第 ${pageNum + 1} 頁` };
    
    try {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📄 ${pageInfo.name} / 共 4 頁`);
      console.log(`📊 預計產品數：${pageInfo.expected} 個`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // 步驟1：獲取產品列表
      const { products, category } = await this.scrapeProductList(page, pageNum);
      
      if (products.length === 0) {
        console.log('❌ 該頁面未找到任何產品');
        return { success: false, productsCount: 0, newProducts: 0 };
      }

      // 步驟2：讀取現有資料並找出未處理的產品
      const outputPath = path.join(process.cwd(), 'src/data/doterra-real-products.json');
      const existingData = this.readExistingData(outputPath);
      const existingUrls = existingData.map(item => item.url);

      console.log(`📊 該頁總產品數: ${products.length}`);
      console.log(`📊 已存在產品數: ${existingData.length}`);

      // 找出未處理的產品
      const unprocessedProducts = products.filter(product => !existingUrls.includes(product.url));
      
      if (unprocessedProducts.length === 0) {
        console.log(`✅ ${pageInfo.name}的所有產品都已處理完成！`);
        return { success: true, productsCount: products.length, newProducts: 0 };
      }

      console.log(`📊 待處理產品數: ${unprocessedProducts.length} 個`);

      // 步驟3：逐一爬取未處理的產品
      let newProductsCount = 0;
      for (let i = 0; i < unprocessedProducts.length; i++) {
        const product = unprocessedProducts[i];
        console.log(`\n🔍 [${i + 1}/${unprocessedProducts.length}] 爬取產品: ${product.name}`);
        
        try {
          const oilData = await this.scrapeProductDetails(page, product, category);
          this.saveProductData(outputPath, oilData);
          newProductsCount++;
          
          console.log(`✅ 成功爬取: ${oilData.name}`);
          
          // 避免請求過於頻繁
          if (i < unprocessedProducts.length - 1) {
            await this.sleep(2000);
          }
        } catch (error) {
          console.error(`❌ 爬取失敗 ${product.name}:`, error);
        }
      }

      console.log(`\n✅ ${pageInfo.name}完成！新增 ${newProductsCount} 個產品`);
      return { success: true, productsCount: products.length, newProducts: newProductsCount };

    } finally {
      await page.close();
    }
  }

  /**
   * 執行分頁爬取，每完成一頁詢問是否繼續
   */
  async runPagedScraping(): Promise<void> {
    if (!this.browser) throw new Error('瀏覽器未初始化');

    console.log('🚀 開始分頁爬取模式');
    console.log('📊 預計總產品數：74 個 (24+24+24+2)');
    
    let totalNewProducts = 0;
    let totalProcessed = 0;

    for (let pageNum = 0; pageNum <= 3; pageNum++) {
      try {
        // 爬取當前頁面
        const result = await this.scrapeByPage(pageNum);
        
        if (result.success) {
          totalNewProducts += result.newProducts;
          totalProcessed += result.productsCount;
          
          console.log(`\n📈 累計統計:`);
          console.log(`   已處理頁面: ${pageNum + 1}/4`);
          console.log(`   累計新增產品: ${totalNewProducts} 個`);
          console.log(`   累計檢視產品: ${totalProcessed} 個`);
          
          // 如果不是最後一頁，詢問是否繼續
          if (pageNum < 3) {
            const nextPageInfo = pageNum === 0 ? '24' : pageNum === 1 ? '24' : pageNum === 2 ? '2' : '0';
            console.log(`\n❓ 是否繼續爬取第 ${pageNum + 2} 頁？(${nextPageInfo} 個產品待處理)`);
            console.log('   輸入 "y" 或 "yes" 繼續，其他任意鍵停止');
            
            // 在實際環境中，這裡會等待用戶輸入
            // 為了示範，我們暫時先處理第一頁
            if (pageNum === 0) {
              console.log('🎯 完成第一頁爬取，準備詢問用戶是否繼續...');
              break;
            }
          }
        } else {
          console.log(`❌ 第 ${pageNum + 1} 頁爬取失敗`);
        }
        
      } catch (error) {
        console.error(`❌ 第 ${pageNum + 1} 頁爬取出現錯誤:`, error);
      }
    }

    console.log('\n🎉 分頁爬取階段完成！');
    console.log(`📊 本次新增產品: ${totalNewProducts} 個`);
    
    if (totalNewProducts > 0) {
      const outputPath = path.join(process.cwd(), 'src/data/doterra-real-products.json');
      const finalData = this.readExistingData(outputPath);
      console.log(`📁 總計資料庫產品: ${finalData.length} 個`);
    }
  }
}

async function main() {
  console.log('🚀 啟動工作版本 doTERRA 爬蟲 - 第4頁');

  const scraper = new WorkingScraper();
  
  try {
    await scraper.init();
    
    // 直接爬取第4頁
    console.log('🎯 開始爬取第4頁...');
    const result = await scraper.scrapeByPage(3); // pageNum = 3 代表第4頁 (0-based)
    
    if (result.success) {
      console.log(`✅ 第4頁爬取完成！`);
      console.log(`📊 該頁總產品數: ${result.productsCount}`);
      console.log(`🆕 新增產品數: ${result.newProducts}`);
      
      if (result.newProducts > 0) {
        const outputPath = path.join(process.cwd(), 'src/data/doterra-real-products.json');
        const finalData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
        console.log(`📁 目前資料庫總產品數: ${finalData.length} 個`);
      }
    } else {
      console.log('❌ 第4頁爬取失敗');
    }
    
  } catch (error) {
    console.error('❌ 爬蟲運行失敗:', error);
  } finally {
    await scraper.cleanup();
  }
}

if (require.main === module) {
  main().catch(console.error);
}