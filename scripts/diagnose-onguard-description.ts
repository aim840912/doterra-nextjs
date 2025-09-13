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
    
    // 等待內容加載
    try {
      await page.waitForSelector('[itemprop="description"]', { timeout: 10000 });
    } catch (e) {
      console.log('未找到 itemprop="description"，繼續搜尋...');
    }
    
    await page.waitForTimeout(3000);
    
    // 要搜尋的目標文字
    const targetText = '保衛複方淨化噴霧具備良好的淨化效果';
    
    console.log('\n搜尋目標文字:', targetText);
    console.log('='.repeat(80));
    
    // 在整個 DOM 中搜尋文字
    const results = await page.evaluate((searchText) => {
      const results = [];
      
      // 遞迴搜尋所有文字節點
      function searchTextNodes(node: Node, path: string = '') {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent?.trim() || '';
          if (text && text.includes(searchText)) {
            const parentEl = node.parentElement;
            if (parentEl) {
              results.push({
                text: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
                tagName: parentEl.tagName,
                className: parentEl.className,
                id: parentEl.id,
                itemprop: parentEl.getAttribute('itemprop'),
                path: path,
                parentHTML: parentEl.outerHTML.substring(0, 500),
                selector: getSelector(parentEl)
              });
            }
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          const newPath = path + ' > ' + element.tagName.toLowerCase() + 
                         (element.className ? '.' + element.className.split(' ').join('.') : '') +
                         (element.id ? '#' + element.id : '');
          
          for (const child of node.childNodes) {
            searchTextNodes(child, newPath);
          }
        }
      }
      
      // 生成 CSS 選擇器
      function getSelector(el: Element): string {
        const path = [];
        while (el && el.nodeType === Node.ELEMENT_NODE) {
          let selector = el.tagName.toLowerCase();
          if (el.id) {
            selector = '#' + el.id;
            path.unshift(selector);
            break;
          } else {
            let sibling = el;
            let nth = 1;
            while (sibling.previousElementSibling) {
              sibling = sibling.previousElementSibling;
              if (sibling.tagName === el.tagName) nth++;
            }
            if (nth > 1) selector += ':nth-of-type(' + nth + ')';
          }
          path.unshift(selector);
          el = el.parentElement!;
        }
        return path.join(' > ');
      }
      
      searchTextNodes(document.body);
      return results;
    }, targetText);
    
    if (results.length > 0) {
      console.log(`\n找到 ${results.length} 個包含目標文字的元素:\n`);
      
      results.forEach((result, index) => {
        console.log(`\n【結果 ${index + 1}】`);
        console.log('標籤:', result.tagName);
        console.log('Class:', result.className || '(無)');
        console.log('ID:', result.id || '(無)');
        console.log('itemprop:', result.itemprop || '(無)');
        console.log('CSS 選擇器:', result.selector);
        console.log('文字內容 (前200字):', result.text);
        console.log('父元素 HTML (前500字):', result.parentHTML);
        console.log('-'.repeat(80));
      });
    } else {
      console.log('\n未找到包含目標文字的元素');
      
      // 嘗試其他搜尋策略
      console.log('\n嘗試搜尋 itemprop="description" 附近的元素...');
      
      const nearbyElements = await page.evaluate(() => {
        const results = [];
        const descEl = document.querySelector('[itemprop="description"]');
        
        if (descEl) {
          // 檢查 itemprop 元素本身
          results.push({
            type: 'itemprop element itself',
            text: descEl.textContent?.trim() || '(空)',
            html: descEl.outerHTML
          });
          
          // 檢查下一個兄弟元素
          let nextEl = descEl.nextElementSibling;
          let count = 0;
          while (nextEl && count < 5) {
            results.push({
              type: `next sibling ${count + 1}`,
              tagName: nextEl.tagName,
              className: nextEl.className,
              text: nextEl.textContent?.trim()?.substring(0, 200) || '(空)',
              html: nextEl.outerHTML.substring(0, 500)
            });
            nextEl = nextEl.nextElementSibling;
            count++;
          }
          
          // 檢查父元素的其他子元素
          const parent = descEl.parentElement;
          if (parent) {
            const children = Array.from(parent.children);
            children.forEach((child, index) => {
              if (child !== descEl) {
                results.push({
                  type: `parent's child ${index}`,
                  tagName: child.tagName,
                  className: child.className,
                  text: child.textContent?.trim()?.substring(0, 200) || '(空)'
                });
              }
            });
          }
        }
        
        return results;
      });
      
      if (nearbyElements.length > 0) {
        console.log('\nitemprop="description" 附近的元素:');
        nearbyElements.forEach(el => {
          console.log('\n類型:', el.type);
          if (el.tagName) console.log('標籤:', el.tagName);
          if (el.className) console.log('Class:', el.className);
          console.log('文字:', el.text);
          if (el.html) console.log('HTML:', el.html);
        });
      }
    }
    
    // 額外搜尋：查找所有包含 "保衛" 的文字
    console.log('\n\n額外搜尋：所有包含 "保衛" 的段落:');
    console.log('='.repeat(80));
    
    const allParagraphs = await page.evaluate(() => {
      const paragraphs = [];
      const elements = document.querySelectorAll('p, div, span');
      
      elements.forEach(el => {
        const text = el.textContent?.trim() || '';
        if (text.includes('保衛') && text.length > 20) {
          paragraphs.push({
            tagName: el.tagName,
            className: el.className,
            text: text.substring(0, 300),
            hasItemprop: el.hasAttribute('itemprop'),
            itemprop: el.getAttribute('itemprop')
          });
        }
      });
      
      return paragraphs;
    });
    
    allParagraphs.forEach((p, index) => {
      console.log(`\n段落 ${index + 1}:`);
      console.log('標籤:', p.tagName);
      console.log('Class:', p.className || '(無)');
      console.log('itemprop:', p.itemprop || '(無)');
      console.log('文字:', p.text);
    });
    
  } catch (error) {
    console.error('診斷過程中發生錯誤:', error);
  } finally {
    await browser.close();
  }
}

// 執行診斷
diagnoseOnGuardDescription().catch(console.error);