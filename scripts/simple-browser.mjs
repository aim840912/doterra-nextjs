import { chromium } from 'playwright';

(async () => {
  console.log('🚀 正在啟動瀏覽器...');
  
  // 啟動瀏覽器
  const browser = await chromium.launch({ 
    headless: false,  // 顯示瀏覽器視窗
    slowMo: 500       // 每個操作間延遲 0.5 秒
  });
  
  // 建立新頁面
  const page = await browser.newPage();
  
  // 設定視窗大小
  await page.setViewportSize({ width: 1400, height: 900 });
  
  try {
    console.log('🌐 正在打開 doTERRA 專案...');
    
    // 導航至本地開發伺服器
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('✅ 成功載入首頁！');
    console.log('👀 瀏覽器已開啟，您可以手動探索應用程式');
    console.log('🔍 嘗試點擊導航選單來查看不同頁面');
    console.log('⏰ 瀏覽器將保持開啟 10 分鐘，或您可以手動關閉');
    
    // 截圖首頁
    await page.screenshot({ path: 'screenshots/doterra-homepage.png', fullPage: true });
    console.log('📸 已截圖保存首頁為 doterra-homepage.png');
    
    // 保持瀏覽器開啟 10 分鐘
    await page.waitForTimeout(600000); // 10 分鐘
    
  } catch (error) {
    console.error('❌ 發生錯誤:', error.message);
    console.log('💡 請確認開發伺服器是否運行在 http://localhost:3000');
  } finally {
    await browser.close();
    console.log('🔚 瀏覽器已關閉');
  }
})();