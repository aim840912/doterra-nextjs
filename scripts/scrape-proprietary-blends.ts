import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { Oil } from '../src/types/oil';

interface ProductInfo {
  name: string;
  url: string;
}

/**
 * doTERRA 複方精油爬蟲
 * 專門爬取 proprietary-blends 類別產品
 */
class ProprietaryBlendsScraper {
  private browser: Browser | null = null;

  async init(): Promise<void> {
    console.log('🆕 初始化複方精油爬蟲');
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
    
    // 處理直線分隔符
    if (text.includes('|')) {
      return text.split('|').map(item => item.trim()).filter(item => item.length > 0);
    }
    
    // 處理多個空格分隔
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
   * 建構分頁URL - 複方精油專用
   */
  private buildPageUrl(pageNum: number = 0): string {
    if (pageNum === 0) {
      return 'https://www.doterra.com/TW/zh_TW/pl/proprietary-blends';
    }
    return `https://www.doterra.com/TW/zh_TW/pl/proprietary-blends?page=${pageNum}&sort=displaySequence-desc`;
  }

  /**
   * 爬取複方精油產品列表
   */
  private async scrapeProductList(page: Page, pageNum: number = 0): Promise<{ products: ProductInfo[], category: string }> {
    const startUrl = this.buildPageUrl(pageNum);
    console.log(`🔗 訪問複方精油列表: ${startUrl}`);

    // 從URL中提取分類
    const category = 'proprietary-blends';
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

    console.log(`✅ 獲取 ${products.length} 個複方精油產品`);
    return { products, category };
  }

  /**
   * 爬取單個複方精油的完整資訊
   */
  private async scrapeProductDetails(page: Page, productInfo: ProductInfo, category: string) {
    console.log(`\n🔍 爬取複方精油: ${productInfo.name}`);
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
        
        // 從 H1 中提取中文名稱
        const chineseMatch = fullName.match(/^(.*?)(?:\s+[A-Za-z]|$)/);
        if (chineseMatch) {
          result.chineseName = chineseMatch[1].trim();
        }
        
        // 從 title 提取英文名稱
        const titleText = document.title || '';
        const englishMatch = titleText.match(/([A-Za-z\s]+(?:Oil|Blend|Mix))/i);
        if (englishMatch) {
          result.englishName = englishMatch[1].trim();
        } else {
          // 從 URL 作為後備
          const url = window.location.href;
          const urlParts = url.split('/');
          const slug = urlParts[urlParts.length - 1];
          if (slug) {
            result.englishName = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          }
        }
      }

      // 學名（複方精油通常沒有單一學名，但有些會列出主要成分的學名）
      const scientific = document.querySelector('.scientific');
      if (scientific && scientific.textContent) {
        result.scientificName = scientific.textContent.trim();
      }

      // 產品描述
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

      // 圖片URL
      const imageLink = document.querySelector('#detail-image-link');
      if (imageLink && imageLink.href) {
        result.imageUrl = imageLink.href.split('?')[0];
      }

      return result;
    });

    // 提取H2區塊內容 - 複方精油特有內容
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
            // 左側內容：複方精油配方、主要成分等
            const nextEl = h2.nextElementSibling;
            console.log(`左側 H2: ${title}, 下一個元素: ${nextEl?.tagName}`);
            
            if (nextEl && nextEl.tagName === 'UL') {
              // 處理列表項目（主要功效或成分）
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
            } else if (nextEl && (nextEl.tagName === 'P' || nextEl.tagName === 'DIV')) {
              // 處理段落內容
              content = nextEl.textContent?.trim() || '';
              console.log(`  找到左側內容: ${content.substring(0, 50)}...`);
            }
            // 3. 最後檢查文字節點（香味描述等）
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
          } else {
            // 右側內容：使用方法、應用指南等
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
      // 嘗試按句號分割
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
    }

    // 組合最終資料
    const oilData = {
      id: `doterra-${Date.now()}`,
      name: basicInfo.chineseName || productInfo.name,
      englishName: basicInfo.englishName || 'Unknown Blend',
      scientificName: basicInfo.scientificName || '', // 複方精油通常沒有單一學名
      description: basicInfo.description,
      productIntroduction: h2Contents['產品介紹'] || h2Contents['複方介紹'] || '',
      usageInstructions: usageArray,
      applicationGuide: h2Contents['應用指南'] || '',
      cautions: h2Contents['注意事項'] || '',
      mainBenefits: h2Contents['主要功效'] ? this.splitMainBenefits(h2Contents['主要功效']) : [],
      aromaDescription: h2Contents['香味描述'] || '',
      mainIngredients: (() => {
        // 複方精油的成分處理
        const mainIngredients = h2Contents['主要成分'] || h2Contents['關鍵成分'] || h2Contents['成分'];
        
        if (mainIngredients) {
          // 如果包含分隔符，分割成陣列
          if (mainIngredients.includes('、') || mainIngredients.includes('，')) {
            return mainIngredients.split(/[、，]/).map(item => item.trim()).filter(item => item.length > 0);
          }
          return [mainIngredients];
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
      pvPoints: basicInfo.pvPoints
    };

    console.log(`✅ 成功獲取複方精油 ${oilData.name}`);
    console.log(`📝 英文名稱: ${oilData.englishName || '未找到'}`);
    console.log(`📝 描述長度: ${oilData.description?.length || 0} 字元`);
    console.log(`🖼️ 圖片URL: ${oilData.imageUrl}`);
    console.log(`💰 建議售價: NT$${oilData.retailPrice}, 會員價: NT$${oilData.memberPrice}`);
    console.log(`📦 產品編號: ${oilData.productCode}, PV點數: ${oilData.pvPoints}`);

    return oilData;
  }

  /**
   * 儲存產品資料到指定檔案
   */
  private saveProductData(outputPath: string, products: Oil[]): void {
    fs.writeFileSync(outputPath, JSON.stringify(products, null, 2), 'utf-8');
    console.log(`💾 已儲存 ${products.length} 個複方精油產品到 ${outputPath}`);
  }

  /**
   * 讀取現有的產品資料
   */
  private readExistingData(outputPath: string): Oil[] {
    if (fs.existsSync(outputPath)) {
      try {
        const content = fs.readFileSync(outputPath, 'utf-8');
        const data = JSON.parse(content);
        return Array.isArray(data) ? data : [];
      } catch (_error) {
        console.log('⚠️ 讀取現有資料失敗，將建立新檔案');
        return [];
      }
    }
    return [];
  }

  /**
   * 爬取所有複方精油（多頁支援）
   */
  async scrapeAllProprietaryBlends(): Promise<void> {
    if (!this.browser) throw new Error('瀏覽器未初始化');

    const page = await this.browser.newPage();
    const outputPath = path.join(process.cwd(), 'src/data/products/proprietary-blends.json');
    
    const allProducts: Oil[] = [];
    let totalNewProducts = 0;

    try {
      console.log('\n🚀 開始爬取所有複方精油');
      
      // 先檢查現有資料
      const existingData = this.readExistingData(outputPath);
      const existingUrls = existingData.map(item => item.url);
      console.log(`📊 現有產品數量: ${existingData.length}`);

      // 爬取多頁（假設最多2頁）
      for (let pageNum = 0; pageNum < 2; pageNum++) {
        console.log(`\n📄 爬取第 ${pageNum + 1} 頁...`);
        
        try {
          // 步驟1：獲取產品列表
          const { products, category } = await this.scrapeProductList(page, pageNum);
          
          if (products.length === 0) {
            console.log(`❌ 第 ${pageNum + 1} 頁未找到任何產品，停止爬取`);
            break;
          }

          console.log(`✅ 第 ${pageNum + 1} 頁找到 ${products.length} 個產品`);

          // 步驟2：過濾出未處理的產品
          const newProducts = products.filter(product => !existingUrls.includes(product.url));
          
          if (newProducts.length === 0) {
            console.log(`✅ 第 ${pageNum + 1} 頁所有產品都已存在`);
            continue;
          }

          console.log(`📊 第 ${pageNum + 1} 頁待處理產品: ${newProducts.length} 個`);

          // 步驟3：爬取每個新產品的詳細資訊
          for (let i = 0; i < newProducts.length; i++) {
            const product = newProducts[i];
            console.log(`\n🔍 [${i + 1}/${newProducts.length}] 爬取: ${product.name}`);
            
            try {
              const oilData = await this.scrapeProductDetails(page, product, category);
              allProducts.push(oilData);
              totalNewProducts++;
              
              console.log(`✅ 成功爬取: ${oilData.name}`);
              
              // 避免請求過於頻繁
              if (i < newProducts.length - 1) {
                await this.sleep(2000);
              }
            } catch (error) {
              console.error(`❌ 爬取失敗 ${product.name}:`, error);
            }
          }

        } catch (error) {
          console.error(`❌ 第 ${pageNum + 1} 頁爬取出現錯誤:`, error);
        }
      }

      // 合併現有資料和新資料
      const finalData = [...existingData, ...allProducts];
      
      if (allProducts.length > 0) {
        this.saveProductData(outputPath, finalData);
        
        console.log('\n🎉 複方精油爬取完成！');
        console.log(`📊 本次新增: ${totalNewProducts} 個產品`);
        console.log(`📁 總計產品: ${finalData.length} 個複方精油`);
      } else {
        console.log('\n✅ 沒有新產品需要爬取');
      }

    } finally {
      await page.close();
    }
  }
}

async function main() {
  console.log('🚀 啟動複方精油爬蟲');

  const scraper = new ProprietaryBlendsScraper();
  
  try {
    await scraper.init();
    await scraper.scrapeAllProprietaryBlends();
    
  } catch (error) {
    console.error('❌ 爬蟲運行失敗:', error);
  } finally {
    await scraper.cleanup();
  }
}

if (require.main === module) {
  main().catch(console.error);
}