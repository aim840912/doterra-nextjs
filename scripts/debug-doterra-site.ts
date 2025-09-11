#!/usr/bin/env tsx

import { chromium } from 'playwright';

async function debugDoTerraSite() {
  console.log('🔍 開始調試 doTERRA 網站...');
  
  const browser = await chromium.launch({ 
    headless: false, // 開啟瀏覽器視窗
    slowMo: 2000     // 放慢操作
  });

  try {
    const page = await browser.newPage({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    });

    // 測試的 URL 列表
    const urlsToTest = [
      'https://www.doterra.com/TW/zh_TW',
      'https://www.doterra.com/TW/zh_TW/pl/single-oils',
      'https://www.doterra.com/TW/zh_TW/shop/essential-oils',
      'https://www.doterra.com/TW/zh_TW/pl/single-oils?sort=relevance'
    ];

    for (const url of urlsToTest) {
      console.log(`\n🌐 測試 URL: ${url}`);
      
      try {
        await page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: 30000 
        });

        // 等待頁面載入
        await page.waitForTimeout(5000);

        const pageInfo = await page.evaluate(() => {
          return {
            title: document.title,
            url: window.location.href,
            productBasicCount: document.querySelectorAll('.product-basic').length,
            productItemCount: document.querySelectorAll('.product-item').length,
            anyProductCount: document.querySelectorAll('[class*="product"]').length,
            hasForm: document.querySelector('form') ? true : false,
            hasScript: document.querySelector('script') ? true : false,
            bodyClasses: document.body.className,
            mainContent: document.querySelector('main')?.outerHTML?.substring(0, 500) || '沒有 main 元素'
          };
        });

        console.log('✅ 頁面載入成功');
        console.log(`📄 標題: ${pageInfo.title}`);
        console.log(`🌐 實際 URL: ${pageInfo.url}`);
        console.log(`🔍 .product-basic 數量: ${pageInfo.productBasicCount}`);
        console.log(`🔍 .product-item 數量: ${pageInfo.productItemCount}`);
        console.log(`🔍 [class*="product"] 數量: ${pageInfo.anyProductCount}`);
        console.log(`📝 有表單: ${pageInfo.hasForm}`);
        console.log(`📝 Body classes: ${pageInfo.bodyClasses}`);

        if (pageInfo.productBasicCount > 0) {
          console.log('🎉 找到產品！讓我們獲取第一個產品資訊...');
          
          const firstProduct = await page.evaluate(() => {
            const element = document.querySelector('.product-basic');
            if (!element) return null;

            const titleElement = element.querySelector('.product-basic__title');
            const linkElement = element.querySelector('a');
            const imageElement = element.querySelector('.product-basic__image img');
            
            return {
              title: titleElement?.textContent?.trim(),
              link: linkElement?.getAttribute('href'),
              image: imageElement?.getAttribute('src')
            };
          });

          console.log('🔍 第一個產品:', firstProduct);
          
          // 如果找到產品，暫停讓用戶觀察
          console.log('⏸️  暫停 30 秒讓您觀察頁面...');
          await page.waitForTimeout(30000);
          break;
        }

      } catch (error) {
        console.log('❌ 載入失敗:', error instanceof Error ? error.message : String(error));
      }
    }

    console.log('\n🔚 調試完成，瀏覽器將保持開啟 60 秒...');
    await page.waitForTimeout(60000);

  } finally {
    await browser.close();
    console.log('👋 瀏覽器已關閉');
  }
}

if (require.main === module) {
  debugDoTerraSite().catch(console.error);
}