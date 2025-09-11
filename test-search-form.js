const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,  
    slowMo: 500      
  });
  
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });
  
  try {
    console.log('🔍 測試搜尋表單文字對比度修復...');
    
    // 導航至產品頁面
    await page.goto('http://localhost:3001/products', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('✅ 成功載入產品頁面！');
    
    // 等待搜尋表單載入
    await page.waitForSelector('#search', { timeout: 5000 });
    
    // 測試搜尋框輸入
    console.log('📝 測試搜尋框輸入...');
    await page.fill('#search', '薰衣草');
    await page.waitForTimeout(1000);
    
    // 測試類別選擇
    console.log('🏷️  測試類別選擇...');
    await page.selectOption('#category', 'essential-oils');
    await page.waitForTimeout(1000);
    
    // 測試排序選擇
    console.log('🔄 測試排序選擇...');
    await page.selectOption('#sort', 'category');
    await page.waitForTimeout(1000);
    
    // 截圖保存修復後的效果
    await page.screenshot({ 
      path: 'search-form-fixed.png', 
      fullPage: false,
      clip: { x: 0, y: 0, width: 1280, height: 400 } 
    });
    console.log('📸 已截圖保存修復後的搜尋表單為 search-form-fixed.png');
    
    // 清空搜尋框以測試 placeholder 顯示
    console.log('🧹 測試 placeholder 顯示...');
    await page.fill('#search', '');
    await page.waitForTimeout(1000);
    
    // 截圖 placeholder 效果
    await page.screenshot({ 
      path: 'search-form-placeholder.png', 
      fullPage: false,
      clip: { x: 0, y: 0, width: 1280, height: 300 } 
    });
    console.log('📸 已截圖保存 placeholder 效果為 search-form-placeholder.png');
    
    console.log('\n✅ 搜尋表單文字對比度修復測試完成！');
    console.log('🎨 修復內容：');
    console.log('  - 輸入文字顏色：gray-900 (更深)');
    console.log('  - Placeholder 文字：gray-500 (可見度提升)');
    console.log('  - 標籤文字顏色：gray-800 (更清晰)');
    
    // 保持瀏覽器開啟一段時間
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ 測試過程發生錯誤:', error.message);
  } finally {
    await browser.close();
    console.log('🔚 測試完成');
  }
})();