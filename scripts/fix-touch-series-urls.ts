#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';

// 呵護系列產品 URL 映射表
const TOUCH_SERIES_URL_MAPPING: Record<string, string> = {
  '呵護系列 -薄荷精油': 'https://www.doterra.com/TW/zh_TW/p/peppermint-touch-oil',
  '呵護系列-乳香精油': 'https://www.doterra.com/TW/zh_TW/p/frankincense-touch-oil',
  '呵護系列 -薰衣草精油': 'https://www.doterra.com/TW/zh_TW/p/lavender-touch-oil',
  '呵護系列-茶樹精油': 'https://www.doterra.com/TW/zh_TW/p/melaleuca-touch-oil',
  '呵護系列-牛至精油': 'https://www.doterra.com/TW/zh_TW/p/oregano-touch-oil',
  '呵護系列-橙花精油': 'https://www.doterra.com/TW/zh_TW/p/neroli-touch-oil',
  '呵護系列-玫瑰精油': 'https://www.doterra.com/TW/zh_TW/p/rose-touch-oil',
  '呵護系列-茉莉精油': 'https://www.doterra.com/TW/zh_TW/p/jasmine-touch-oil',
  '呵護系列-永久花精油': 'https://www.doterra.com/TW/zh_TW/p/helichrysum-touch-oil',
  '呵護系列桂花精油': 'https://www.doterra.com/TW/zh_TW/p/osmanthus-touch-oil',
  '呵護系列-岩蘭草精油': 'https://www.doterra.com/TW/zh_TW/p/vetiver-touch-oil'
};

interface Product {
  id: string;
  name: string;
  productUrl?: string;
  [key: string]: any;
}

class TouchSeriesUrlFixer {
  private dataPath = path.join(process.cwd(), 'src/data/doterra-real-products.json');

  private async loadProducts(): Promise<Product[]> {
    try {
      const data = fs.readFileSync(this.dataPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('載入產品資料失敗:', error);
      return [];
    }
  }

  private async saveProducts(products: Product[]): Promise<void> {
    try {
      fs.writeFileSync(this.dataPath, JSON.stringify(products, null, 2), 'utf-8');
      console.log('✅ 產品資料已儲存');
    } catch (error) {
      console.error('儲存產品資料失敗:', error);
    }
  }

  // 驗證 URL 是否有效 - 使用 Playwright
  private async validateUrl(url: string): Promise<boolean> {
    const { chromium } = await import('playwright');
    let browser;
    
    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });
      const page = await context.newPage();
      
      // 設定較短的超時時間
      const response = await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      });
      
      if (!response) {
        return false;
      }
      
      // 檢查是否成功載入頁面內容
      const isValidPage = response.status() === 200 && response.url().includes('doterra.com');
      
      // 額外檢查：確認頁面包含產品相關內容
      if (isValidPage) {
        try {
          const pageContent = await page.textContent('body');
          const hasProductContent = pageContent && (
            pageContent.includes('產品') || 
            pageContent.includes('精油') ||
            pageContent.includes('doTERRA') ||
            pageContent.includes('Touch')
          );
          return hasProductContent;
        } catch {
          return isValidPage; // 如果無法檢查內容，僅依賴狀態碼
        }
      }
      
      return isValidPage;
    } catch (error) {
      console.log(`❌ URL 驗證失敗: ${url} - ${error}`);
      return false;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  public async fixTouchSeriesUrls(): Promise<void> {
    console.log('🚀 開始修復呵護系列 URL...\n');

    const products = await this.loadProducts();
    console.log(`📋 載入了 ${products.length} 個產品`);

    let updatedCount = 0;
    let validUrlCount = 0;
    let invalidUrlCount = 0;

    // 找出呵護系列產品
    const touchProducts = products.filter(p => p.name.includes('呵護系列'));
    console.log(`🔍 找到 ${touchProducts.length} 個呵護系列產品`);

    for (const product of touchProducts) {
      const mappedUrl = TOUCH_SERIES_URL_MAPPING[product.name];
      
      if (mappedUrl) {
        console.log(`\n[${touchProducts.indexOf(product) + 1}/${touchProducts.length}] 處理: ${product.name}`);
        console.log(`🌐 映射 URL: ${mappedUrl}`);
        
        // 驗證 URL 是否有效
        console.log('⏳ 驗證 URL 有效性...');
        const isValid = await this.validateUrl(mappedUrl);
        
        if (isValid) {
          console.log('✅ URL 有效');
          product.productUrl = mappedUrl;
          updatedCount++;
          validUrlCount++;
        } else {
          console.log('❌ URL 無效');
          invalidUrlCount++;
          // 標記為無有效 URL
          product.productUrl = '';
          product.noValidUrl = true;
        }
        
        // 延遲 1 秒避免請求過於頻繁
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.log(`⚠️ 未找到 "${product.name}" 的 URL 映射`);
      }
    }

    // 保存更新的資料
    await this.saveProducts(products);

    console.log('\n🎉 呵護系列 URL 修復完成！');
    console.log(`📊 統計:`);
    console.log(`   - 處理的產品: ${touchProducts.length} 個`);
    console.log(`   - 成功更新 URL: ${updatedCount} 個`);
    console.log(`   - 有效 URL: ${validUrlCount} 個`);
    console.log(`   - 無效 URL: ${invalidUrlCount} 個`);

    // 顯示有效的 URL
    if (validUrlCount > 0) {
      console.log('\n✅ 有效的呵護系列產品 URL:');
      const validProducts = products.filter(p => 
        p.name.includes('呵護系列') && 
        p.productUrl && 
        !p.productUrl.includes('doterra-') &&
        p.productUrl.length > 0
      );
      
      validProducts.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name}`);
        console.log(`      ${p.productUrl}`);
      });
    }

    // 顯示無效的產品
    if (invalidUrlCount > 0) {
      console.log('\n❌ 無有效 URL 的呵護系列產品:');
      const invalidProducts = products.filter(p => 
        p.name.includes('呵護系列') && 
        (!p.productUrl || p.productUrl === '' || p.noValidUrl)
      );
      
      invalidProducts.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name}`);
      });
    }
  }
}

// 主執行函數
async function main() {
  const fixer = new TouchSeriesUrlFixer();
  
  try {
    await fixer.fixTouchSeriesUrls();
  } catch (error) {
    console.error('❌ 執行失敗:', error);
    process.exit(1);
  }
}

// 如果是直接執行此腳本
if (require.main === module) {
  main();
}

export { TouchSeriesUrlFixer };