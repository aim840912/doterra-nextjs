import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    headless: false,  
    slowMo: 500      
  });
  
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });
  
  try {
    console.log('🔍 測試新增產品表單文字對比度修復...');
    
    // 導航至新增產品頁面
    await page.goto('http://localhost:3001/products/add', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('✅ 成功載入新增產品頁面！');
    
    // 等待表單載入
    await page.waitForSelector('form', { timeout: 5000 });
    
    // 測試基本資訊輸入
    console.log('📝 填寫基本資訊...');
    await page.fill('#name', '測試精油產品');
    await page.fill('#englishName', 'Test Essential Oil');
    await page.fill('#description', '這是一個測試用的精油產品描述');
    await page.fill('#volume', '15ml');
    
    // 測試功效欄位
    console.log('⭐ 填寫產品功效...');
    await page.fill('input[placeholder^="功效"]', '舒緩放鬆');
    
    // 新增第二個功效
    await page.click('button:has-text("+ 新增功效")');
    await page.waitForTimeout(500);
    await page.fill('input[placeholder="功效 2"]', '改善睡眠品質');
    
    // 測試成分欄位
    console.log('🧪 填寫產品成分...');
    await page.fill('input[placeholder^="成分"]', '薰衣草萃取');
    
    // 測試標籤欄位
    console.log('🏷️  填寫產品標籤...');
    await page.fill('input[placeholder^="標籤"]', '舒緩');
    
    // 新增第二個標籤
    await page.click('button:has-text("+ 新增標籤")');
    await page.waitForTimeout(500);
    await page.fill('input[placeholder="標籤 2"]', '天然');
    
    // 測試使用說明
    console.log('📋 填寫使用說明...');
    await page.fill('#usageInstructions', '每晚睡前滴 2-3 滴於枕頭上');
    
    // 滾動到表單頂部以便截圖
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);
    
    // 截圖保存修復後的效果（表單上半部）
    await page.screenshot({ 
      path: 'add-product-form-fixed-top.png', 
      fullPage: false,
      clip: { x: 0, y: 0, width: 1280, height: 700 } 
    });
    console.log('📸 已截圖保存修復後的表單上半部為 add-product-form-fixed-top.png');
    
    // 滾動到表單下半部
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(1000);
    
    // 截圖表單下半部
    await page.screenshot({ 
      path: 'add-product-form-fixed-bottom.png', 
      fullPage: false,
      clip: { x: 0, y: 0, width: 1280, height: 700 } 
    });
    console.log('📸 已截圖保存修復後的表單下半部為 add-product-form-fixed-bottom.png');
    
    // 測試 CategorySelector
    console.log('🗂️  測試類別選擇器...');
    await page.click('div:has-text("選擇現有類別或新增自訂類別")');
    await page.waitForSelector('input[placeholder="搜尋或輸入新類別..."]', { timeout: 3000 });
    
    // 在類別選擇器中輸入
    await page.fill('input[placeholder="搜尋或輸入新類別..."]', '測試類別');
    await page.waitForTimeout(1000);
    
    // 截圖類別選擇器
    await page.screenshot({ 
      path: 'category-selector-fixed.png', 
      fullPage: false,
      clip: { x: 300, y: 200, width: 600, height: 400 } 
    });
    console.log('📸 已截圖保存修復後的類別選擇器為 category-selector-fixed.png');
    
    // 點擊外部關閉類別選擇器
    await page.click('h1');
    await page.waitForTimeout(500);
    
    console.log('\n✅ 新增產品表單文字對比度修復測試完成！');
    console.log('🎨 修復內容：');
    console.log('  - 所有輸入欄位文字顏色：gray-900 (更深)');
    console.log('  - 所有 placeholder 文字：gray-500 (可見度提升)'); 
    console.log('  - 所有標籤文字顏色：gray-800 (更清晰)');
    console.log('  - CategorySelector 搜尋框：完整修復');
    
    // 保持瀏覽器開啟一段時間供查看
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ 測試過程發生錯誤:', error.message);
  } finally {
    await browser.close();
    console.log('🔚 測試完成');
  }
})();