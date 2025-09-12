import { chromium } from 'playwright';

async function diagnoseOnGuardDescription() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--disable-blink-features=AutomationControlled']
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('訪問 OnGuard 產品頁面...');
    const url = 'https://www.doterra.com/TW/zh_TW/p/on-guard-mist';
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    await page.waitForTimeout(5000);
    
    // 搜尋目標文字
    const targetText = '保衛複方淨化噴霧具備良好的淨化效果';
    
    console.log('\n搜尋目標文字:', targetText);
    console.log('='.repeat(80));
    
    // 簡化的搜尋 - 搜尋所有段落
    const paragraphs = await page.$$eval('p', (elements) => {
      return elements.map(el => ({
        text: el.textContent?.trim() || '',
        className: el.className,
        id: el.id,
        itemprop: el.getAttribute('itemprop'),
        previousSibling: el.previousElementSibling?.tagName,
        nextSibling: el.nextElementSibling?.tagName,
        parentTag: el.parentElement?.tagName,
        parentClass: el.parentElement?.className
      }));
    });
    
    // 找出包含目標文字的段落
    const matches = paragraphs.filter(p => p.text.includes(targetText));
    
    if (matches.length > 0) {
      console.log('\n找到包含目標文字的段落:');
      matches.forEach((match, index) => {
        console.log(`\n【結果 ${index + 1}】`);
        console.log('文字:', match.text);
        console.log('Class:', match.className || '(無)');
        console.log('ID:', match.id || '(無)');
        console.log('itemprop:', match.itemprop || '(無)');
        console.log('父元素標籤:', match.parentTag);
        console.log('父元素 Class:', match.parentClass);
        console.log('前一個兄弟元素:', match.previousSibling);
        console.log('下一個兄弟元素:', match.nextSibling);
      });
    } else {
      console.log('\n在 <p> 標籤中未找到目標文字');
      
      // 搜尋所有 div
      console.log('\n搜尋 <div> 標籤...');
      const divs = await page.$$eval('div', (elements) => {
        return elements.map(el => ({
          text: el.textContent?.trim() || '',
          className: el.className,
          id: el.id
        }));
      });
      
      const divMatches = divs.filter(d => d.text.includes(targetText));
      
      if (divMatches.length > 0) {
        console.log('\n在 <div> 中找到:');
        divMatches.forEach((match, index) => {
          console.log(`\n【DIV ${index + 1}】`);
          console.log('Class:', match.className || '(無)');
          console.log('ID:', match.id || '(無)');
          console.log('文字 (前200字):', match.text.substring(0, 200));
        });
      }
    }
    
    // 檢查 itemprop="description" 元素
    console.log('\n\n檢查 itemprop="description" 元素:');
    console.log('='.repeat(80));
    
    const descriptionInfo = await page.evaluate(() => {
      const el = document.querySelector('[itemprop="description"]');
      if (!el) return null;
      
      const nextP = el.nextElementSibling;
      const parent = el.parentElement;
      
      return {
        tag: el.tagName,
        text: el.textContent?.trim() || '(空)',
        className: el.className,
        nextSiblingTag: nextP?.tagName,
        nextSiblingText: nextP?.textContent?.trim()?.substring(0, 200),
        nextSiblingClass: nextP?.className,
        parentTag: parent?.tagName,
        parentClass: parent?.className,
        // 獲取父元素下所有 p 標籤
        allParagraphsInParent: parent ? Array.from(parent.querySelectorAll('p')).map(p => ({
          text: p.textContent?.trim()?.substring(0, 100),
          itemprop: p.getAttribute('itemprop')
        })) : []
      };
    });
    
    if (descriptionInfo) {
      console.log('找到 itemprop="description" 元素:');
      console.log('標籤:', descriptionInfo.tag);
      console.log('文字:', descriptionInfo.text);
      console.log('Class:', descriptionInfo.className);
      console.log('\n下一個兄弟元素:');
      console.log('標籤:', descriptionInfo.nextSiblingTag);
      console.log('Class:', descriptionInfo.nextSiblingClass);
      console.log('文字:', descriptionInfo.nextSiblingText);
      console.log('\n父元素:');
      console.log('標籤:', descriptionInfo.parentTag);
      console.log('Class:', descriptionInfo.parentClass);
      console.log('\n父元素下的所有段落:');
      descriptionInfo.allParagraphsInParent.forEach((p, i) => {
        console.log(`段落 ${i + 1}: itemprop="${p.itemprop || '無'}", 文字: ${p.text}`);
      });
    } else {
      console.log('未找到 itemprop="description" 元素');
    }
    
    // 嘗試使用 CSS 選擇器直接查找
    console.log('\n\n使用特定選擇器查找:');
    console.log('='.repeat(80));
    
    const selectors = [
      '.product-description p',
      '.product-info p',
      '.product-details p',
      '[class*="description"] p',
      '[class*="product"] p'
    ];
    
    for (const selector of selectors) {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        console.log(`\n選擇器 "${selector}" 找到 ${elements.length} 個元素:`);
        for (let i = 0; i < Math.min(3, elements.length); i++) {
          const text = await elements[i].textContent();
          if (text && text.trim().length > 20) {
            console.log(`  元素 ${i + 1}: ${text.trim().substring(0, 100)}...`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('診斷過程中發生錯誤:', error);
  } finally {
    await browser.close();
  }
}

// 執行診斷
diagnoseOnGuardDescription().catch(console.error);