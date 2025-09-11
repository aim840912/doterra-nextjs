#!/usr/bin/env tsx

import { chromium } from 'playwright';

async function analyzeDoTerraElements() {
  console.log('🔍 開始分析 doTERRA 網站元素...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });

  try {
    const page = await browser.newPage({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    });

    const targetUrl = 'https://www.doterra.com/TW/zh_TW/pl/single-oils';
    console.log(`📍 訪問: ${targetUrl}`);
    
    await page.goto(targetUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });

    await page.waitForTimeout(5000);

    // 分析所有可能的產品元素
    const elementAnalysis = await page.evaluate(() => {
      console.log('🔍 開始分析頁面元素...');
      
      // 獲取所有包含 "product" 的 class
      const allElements = document.querySelectorAll('*');
      const productClasses = new Set<string>();
      
      allElements.forEach(el => {
        const classes = el.className;
        if (typeof classes === 'string' && classes.includes('product')) {
          classes.split(' ').forEach(cls => {
            if (cls.includes('product')) {
              productClasses.add(cls);
            }
          });
        }
      });

      console.log('找到的產品相關 classes:', Array.from(productClasses));

      // 嘗試不同的選擇器
      const selectors = [
        '.product-basic',
        '.product-item', 
        '.product-tile',
        '.product-card',
        '[class*="product"]',
        '.tile',
        '.item',
        '[data-product]'
      ];

      const selectorResults: any = {};
      
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        selectorResults[selector] = {
          count: elements.length,
          samples: []
        };

        // 獲取前 3 個元素的詳細資訊
        for (let i = 0; i < Math.min(3, elements.length); i++) {
          const el = elements[i];
          const sample: any = {
            tagName: el.tagName,
            className: el.className,
            innerHTML: el.innerHTML.substring(0, 200) + '...'
          };

          // 尋找可能的產品名稱
          const nameSelectors = ['h1', 'h2', 'h3', 'h4', '.title', '.name', '[class*="title"]', '[class*="name"]'];
          for (const nameSelector of nameSelectors) {
            const nameEl = el.querySelector(nameSelector);
            if (nameEl && nameEl.textContent?.trim()) {
              sample.possibleName = nameEl.textContent.trim();
              break;
            }
          }

          // 尋找可能的連結
          const linkEl = el.querySelector('a') || (el.tagName === 'A' ? el : null);
          if (linkEl) {
            sample.link = linkEl.getAttribute('href');
          }

          // 尋找可能的圖片
          const imgEl = el.querySelector('img');
          if (imgEl) {
            sample.imageSrc = imgEl.getAttribute('src');
          }

          selectorResults[selector].samples.push(sample);
        }
      });

      return {
        productClasses: Array.from(productClasses),
        selectorResults,
        pageTitle: document.title,
        bodyHTML: document.body.innerHTML.substring(0, 1000) + '...'
      };
    });

    console.log('\n📊 元素分析結果:');
    console.log('='.repeat(50));
    
    console.log('\n🏷️  找到的產品相關 CSS classes:');
    elementAnalysis.productClasses.forEach(cls => {
      console.log(`  - ${cls}`);
    });

    console.log('\n🔍 選擇器測試結果:');
    Object.entries(elementAnalysis.selectorResults).forEach(([selector, result]: [string, any]) => {
      console.log(`\n${selector}: ${result.count} 個元素`);
      if (result.samples.length > 0) {
        result.samples.forEach((sample: any, index: number) => {
          console.log(`  樣本 ${index + 1}:`);
          console.log(`    標籤: ${sample.tagName}`);
          console.log(`    類別: ${sample.className}`);
          if (sample.possibleName) {
            console.log(`    可能名稱: ${sample.possibleName}`);
          }
          if (sample.link) {
            console.log(`    連結: ${sample.link}`);
          }
          if (sample.imageSrc) {
            console.log(`    圖片: ${sample.imageSrc}`);
          }
        });
      }
    });

    // 特別檢查是否有動態載入內容
    console.log('\n⏳ 等待 10 秒看是否有動態內容載入...');
    await page.waitForTimeout(10000);

    const afterWaitAnalysis = await page.evaluate(() => {
      return {
        productBasicCount: document.querySelectorAll('.product-basic').length,
        anyProductCount: document.querySelectorAll('[class*="product"]').length,
        tileCount: document.querySelectorAll('.tile').length,
        itemCount: document.querySelectorAll('.item').length
      };
    });

    console.log('\n📈 等待後的元素數量:');
    console.log(`  .product-basic: ${afterWaitAnalysis.productBasicCount}`);
    console.log(`  [class*="product"]: ${afterWaitAnalysis.anyProductCount}`);
    console.log(`  .tile: ${afterWaitAnalysis.tileCount}`);
    console.log(`  .item: ${afterWaitAnalysis.itemCount}`);

    console.log('\n⏸️  保持瀏覽器開啟 60 秒供觀察...');
    await page.waitForTimeout(60000);

  } finally {
    await browser.close();
    console.log('👋 分析完成');
  }
}

if (require.main === module) {
  analyzeDoTerraElements().catch(console.error);
}