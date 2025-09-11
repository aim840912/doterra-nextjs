#!/usr/bin/env tsx

import { chromium } from 'playwright';

async function testWebsite() {
  console.log('開始測試 doTERRA 網站...');
  
  const browser = await chromium.launch({ 
    headless: false, // 設置為 false 以便觀察
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });

    // 嘗試不同的 URL
    const urlsToTest = [
      'https://www.doterra.com/TW/zh_TW',
      'https://www.doterra.com/TW/zh_TW/shop',
      'https://www.doterra.com/TW/zh_TW/products',
      'https://www.doterra.com/TW/zh_TW/shop/essential-oils',
    ];

    for (const url of urlsToTest) {
      console.log(`\n測試 URL: ${url}`);
      
      try {
        await page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: 30000 
        });

        await page.waitForTimeout(3000);

        const pageInfo = await page.evaluate(() => {
          return {
            title: document.title,
            url: window.location.href,
            hasProducts: document.querySelectorAll('[class*="product"], .item, .card').length,
            bodyText: document.body.innerText.substring(0, 500) + '...'
          };
        });

        console.log('頁面標題:', pageInfo.title);
        console.log('實際 URL:', pageInfo.url);
        console.log('可能的產品元素數量:', pageInfo.hasProducts);
        console.log('頁面內容預覽:', pageInfo.bodyText);

        if (pageInfo.hasProducts > 0) {
          console.log('✅ 這個 URL 似乎有產品內容');
          break;
        }

      } catch (error) {
        console.log('❌ 無法訪問:', error instanceof Error ? error.message : String(error));
      }
    }

    // 保持瀏覽器開啟以便觀察
    console.log('\n瀏覽器將保持開啟 30 秒以便觀察...');
    await page.waitForTimeout(30000);

  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  testWebsite().catch(console.error);
}