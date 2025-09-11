import { chromium } from 'playwright';

async function testSingleProduct() {
  console.log('🧪 簡單測試：爬取丁香精油');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // 直接導航到丁香精油頁面
    const url = 'https://www.doterra.com/TW/zh_TW/p/clove-oil';
    console.log(`🔗 導航到: ${url}`);
    
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    
    // 基本資訊提取
    const basicInfo = await page.evaluate(() => {
      const result = {
        title: document.title,
        h1Text: '',
        scientificName: '',
        description: '',
        hasItemprop: false,
        h2Titles: []
      };
      
      // H1 標題
      const h1 = document.querySelector('h1');
      if (h1) result.h1Text = h1.textContent || '';
      
      // 科學名稱
      const scientific = document.querySelector('.scientific');
      if (scientific) result.scientificName = scientific.textContent || '';
      
      // 檢查 itemprop description
      const itemprop = document.querySelector('[itemprop="description"]');
      if (itemprop) {
        result.hasItemprop = true;
        if (itemprop.nextElementSibling && itemprop.nextElementSibling.tagName === 'P') {
          result.description = itemprop.nextElementSibling.textContent || '';
        }
      }
      
      // 檢查整個頁面的H2結構
      const allH2s = Array.from(document.querySelectorAll('h2'));
      result.h2Titles = allH2s.map((h2, index) => {
        const title = h2.textContent?.trim() || '';
        
        // 檢查h2的父容器class
        const parent = h2.parentElement;
        const parentClass = parent?.className || 'no-class';
        
        // 檢查同級div中的內容
        let siblingContent = '';
        if (parent) {
          const parentParent = parent.parentElement;
          if (parentParent) {
            const siblings = Array.from(parentParent.children);
            const parentIndex = siblings.indexOf(parent);
            if (parentIndex >= 0 && parentIndex < siblings.length - 1) {
              const nextSibling = siblings[parentIndex + 1];
              siblingContent = nextSibling.textContent?.trim().substring(0, 50) || '';
            }
          }
        }
        
        return `${index}: [${parentClass}] ${title} -> ${siblingContent}`;
      });
      
      return result;
    });
    
    console.log('📊 基本資訊結果:');
    console.log(`   頁面標題: ${basicInfo.title}`);
    console.log(`   H1 文字: ${basicInfo.h1Text}`);
    console.log(`   學名: ${basicInfo.scientificName}`);
    console.log(`   有 itemprop: ${basicInfo.hasItemprop}`);
    console.log(`   描述: ${basicInfo.description.substring(0, 100)}...`);
    console.log(`   H2 標題數量: ${basicInfo.h2Titles.length}`);
    console.log(`   H2 標題: ${basicInfo.h2Titles.slice(0, 5).join(', ')}`);
    
    console.log('✅ 簡單測試成功');
    
  } catch (error) {
    console.error('❌ 測試失敗:', error);
  } finally {
    await browser.close();
  }
}

testSingleProduct().catch(console.error);