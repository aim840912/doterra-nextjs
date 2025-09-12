import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// 修復空白 description 的專用腳本
class DescriptionFixer {
  private browser: Browser | null = null;

  // 需要修復的產品清單
  private readonly targetProducts = [
    { id: 'doterra-1757650752361', name: '甜茴香精油', url: 'https://www.doterra.com/TW/zh_TW/p/sweet-fennel-oil' },
    { id: 'doterra-1757650826920', name: '玫瑰精油', url: 'https://www.doterra.com/TW/zh_TW/p/rose-oil' },
    { id: 'doterra-1757651368992', name: '桂皮精油', url: 'https://www.doterra.com/TW/zh_TW/p/cassia-oil' }
  ];

  async init(): Promise<void> {
    console.log('🆕 初始化 description 修復器');
    this.browser = await chromium.launch({ headless: true });
    console.log('✅ 瀏覽器啟動完成');
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      console.log('✅ 瀏覽器已關閉');
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fixDescriptions(): Promise<void> {
    if (!this.browser) throw new Error('瀏覽器未初始化');

    console.log(`🎯 開始修復 ${this.targetProducts.length} 個產品的 description...`);
    
    const results: Array<{
      id: string;
      name: string;
      description: string;
      success: boolean;
    }> = [];

    for (const [index, product] of this.targetProducts.entries()) {
      console.log(`\n🔍 [${index + 1}/${this.targetProducts.length}] 修復: ${product.name}`);
      console.log(`🔗 URL: ${product.url}`);
      
      const page = await this.browser.newPage();
      
      try {
        await page.goto(product.url, { 
          waitUntil: 'domcontentloaded', 
          timeout: 60000
        });
        
        console.log('✅ 頁面載入完成，開始提取描述...');
        await page.waitForTimeout(2000);

        // 使用改進的描述提取邏輯
        const description = await page.evaluate(() => {
          console.log('開始查找 itemprop="description"...');
          
          // 方法1: 查找 [itemprop="description"] 的下一個兄弟元素
          const itemprop = document.querySelector('[itemprop="description"]');
          if (itemprop) {
            console.log('找到 itemprop="description" 元素');
            
            const nextEl = itemprop.nextElementSibling;
            if (nextEl) {
              console.log('下一個元素標籤:', nextEl.tagName);
              
              if (nextEl.tagName === 'P' || nextEl.tagName === 'DIV') {
                const text = nextEl.textContent?.trim() || '';
                if (text) {
                  console.log('從下一個元素提取到描述:', text.substring(0, 50) + '...');
                  return text;
                }
              }
            }
            
            // 如果下一個元素沒有內容，嘗試從 itemprop 本身提取
            const selfText = itemprop.textContent?.trim() || '';
            if (selfText) {
              console.log('從 itemprop 本身提取到描述:', selfText.substring(0, 50) + '...');
              return selfText;
            }
          }
          
          // 方法2: 查找可能的描述段落
          const potentialDescs = document.querySelectorAll('p, div');
          for (const el of potentialDescs) {
            const text = el.textContent?.trim() || '';
            // 如果文字長度合適且包含產品相關關鍵字
            if (text.length > 30 && text.length < 500) {
              const lowerText = text.toLowerCase();
              if (lowerText.includes('精油') || lowerText.includes('oil') || 
                  lowerText.includes('香氛') || lowerText.includes('萃取')) {
                console.log('找到潛在描述:', text.substring(0, 50) + '...');
                return text;
              }
            }
          }
          
          console.log('未找到合適的描述');
          return '';
        });

        if (description) {
          console.log(`✅ 成功提取描述: ${description.substring(0, 80)}...`);
          results.push({
            id: product.id,
            name: product.name,
            description,
            success: true
          });
        } else {
          console.log(`⚠️ 未找到描述內容`);
          results.push({
            id: product.id,
            name: product.name,
            description: '',
            success: false
          });
        }
        
      } catch (error) {
        console.error(`❌ 修復 ${product.name} 失敗:`, error.message);
        results.push({
          id: product.id,
          name: product.name,
          description: '',
          success: false
        });
      } finally {
        await page.close();
      }
      
      // 避免請求過於頻繁
      if (index < this.targetProducts.length - 1) {
        await this.sleep(1500);
      }
    }
    
    // 更新 JSON 檔案
    console.log('\n📝 更新 JSON 檔案...');
    await this.updateJsonFile(results);
    
    // 顯示結果摘要
    console.log('\n📋 修復結果摘要:');
    console.log(`✅ 成功修復: ${results.filter(r => r.success).length} 個`);
    console.log(`❌ 修復失敗: ${results.filter(r => !r.success).length} 個`);
    
    results.forEach(result => {
      if (result.success) {
        console.log(`✅ ${result.name}: ${result.description.substring(0, 60)}...`);
      } else {
        console.log(`❌ ${result.name}: 修復失敗`);
      }
    });
  }

  private async updateJsonFile(results: Array<{id: string, name: string, description: string, success: boolean}>): Promise<void> {
    const dataPath = path.join(process.cwd(), 'src/data/doterra-real-products.json');
    const productsData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    let updatedCount = 0;
    
    results.forEach(result => {
      if (result.success && result.description) {
        const productIndex = productsData.findIndex((p: any) => p.id === result.id);
        if (productIndex !== -1) {
          productsData[productIndex].description = result.description;
          updatedCount++;
          console.log(`📝 已更新 ${result.name} 的描述`);
        }
      }
    });
    
    if (updatedCount > 0) {
      fs.writeFileSync(dataPath, JSON.stringify(productsData, null, 2), 'utf8');
      console.log(`💾 JSON 檔案已更新，共修復 ${updatedCount} 個產品`);
    } else {
      console.log('⚠️ 沒有產品需要更新');
    }
  }
}

async function main() {
  console.log('🚀 啟動 description 修復器');
  
  const fixer = new DescriptionFixer();
  
  try {
    await fixer.init();
    await fixer.fixDescriptions();
    console.log('✅ 修復完成！');
  } catch (error) {
    console.error('❌ 修復失敗:', error);
  } finally {
    await fixer.cleanup();
  }
}

if (require.main === module) {
  main().catch(console.error);
}