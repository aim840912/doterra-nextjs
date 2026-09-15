import { chromium } from 'playwright';

(async () => {
  // 啟動瀏覽器
  const browser = await chromium.launch({ 
    headless: false,  // 顯示瀏覽器視窗
    slowMo: 1000      // 每個操作間延遲 1 秒，便於觀察
  });
  
  // 建立新頁面
  const page = await browser.newPage();
  
  // 設定視窗大小
  await page.setViewportSize({ width: 1280, height: 720 });
  
  try {
    console.log('正在打開 doTERRA 專案...');
    
    // 導航至本地開發伺服器
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('✅ 成功載入首頁！');
    
    // 等待 5 秒讓用戶查看頁面
    await page.waitForTimeout(5000);
    
    // 點擊「探索產品」按鈕
    console.log('🔗 點擊「探索產品」按鈕...');
    await page.click('a[href="/products"]');
    
    // 等待產品頁面載入
    await page.waitForURL('**/products', { timeout: 10000 });
    console.log('✅ 成功載入產品頁面！');
    
    // 等待產品卡片載入
    await page.waitForSelector('.bg-white.rounded-xl', { timeout: 5000 });
    
    // 點擊第一個產品的「查看詳情」按鈕來測試 Modal
    console.log('🔍 測試產品詳情 Modal...');
    await page.click('button:has-text("查看詳情")');
    
    // 等待 Modal 出現
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    console.log('✅ Modal 成功開啟！');
    
    // 等待一段時間讓用戶看到 Modal
    await page.waitForTimeout(3000);
    
    // 截圖包含 Modal
    await page.screenshot({ path: 'screenshots/doTERRA-modal-demo.png', fullPage: true });
    console.log('📸 已截圖保存 Modal 示例為 doTERRA-modal-demo.png');
    
    // 測試 ESC 鍵關閉 Modal
    console.log('⌨️  測試 ESC 鍵關閉 Modal...');
    await page.keyboard.press('Escape');
    
    // 等待 Modal 關閉
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 });
    console.log('✅ Modal 成功透過 ESC 鍵關閉！');
    
    // 再次打開 Modal
    await page.click('button:has-text("查看詳情")');
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // 測試點擊關閉按鈕
    console.log('🖱️  測試關閉按鈕...');
    await page.click('[aria-label="關閉詳情視窗"]');
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 });
    console.log('✅ Modal 成功透過關閉按鈕關閉！');
    
    // 最終截圖
    await page.screenshot({ path: 'screenshots/doTERRA-products-page.png', fullPage: true });
    console.log('📸 已截圖保存為 doTERRA-products-page.png');
    
    console.log('\n🎉 瀏覽器已成功打開 doTERRA 專案！');
    console.log('👀 您可以在瀏覽器中探索應用程式');
    console.log('⏰ 瀏覽器將保持開啟狀態，手動關閉即可結束');
    
    // 保持瀏覽器開啟，直到手動關閉
    await page.waitForTimeout(300000); // 5 分鐘後自動關閉
    
  } catch (error) {
    console.error('❌ 發生錯誤:', error.message);
  } finally {
    await browser.close();
    console.log('🔚 瀏覽器已關閉');
  }
})();