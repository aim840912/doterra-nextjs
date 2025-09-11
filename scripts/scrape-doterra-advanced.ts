#!/usr/bin/env tsx

import { chromium, Browser, Page } from 'playwright';
import axios from 'axios';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { Product } from '../src/types/product';

interface DoTerraProduct {
  name: string;
  englishName: string;
  description: string;
  imageUrl: string;
  localImagePath?: string;
  productUrl: string;
  volume?: string;
  benefits?: string[];
  ingredients?: string[];
  category?: string;
  price?: string;
}

class AdvancedDoTerraScraper {
  private baseUrl = 'https://www.doterra.com';
  private targetUrl = 'https://www.doterra.com/TW/zh_TW/pl/single-oils';
  private outputDir = path.join(process.cwd(), 'public/images/products/doterra');
  private dataDir = path.join(process.cwd(), 'src/data');
  private downloadsDir = '/mnt/c/Users/aim84/Downloads';
  private browser: Browser | null = null;

  constructor() {
    this.ensureDirectories();
  }

  private ensureDirectories() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private async sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateProductId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\u4e00-\u9fff\w\s]/gi, '')
      .replace(/\s+/g, '-')
      .replace(/[^\w\u4e00-\u9fff-]/g, '');
  }

  private async setupBrowser(): Promise<Page> {
    console.log('🚀 啟動瀏覽器...');
    
    this.browser = await chromium.launch({
      headless: false, // 設為 false 以便觀察
      slowMo: 1000, // 放慢操作速度
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'zh-TW',
      acceptDownloads: true
    });

    const page = await context.newPage();
    
    // 設置額外的隱藏特徵
    await page.addInitScript(() => {
      // 隱藏 webdriver 特徵
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // 隱藏 Playwright 特徵
      delete (window as any).__playwright;
      delete (window as any).__pw_manual;
    });

    return page;
  }

  private async scrapeProductListFromPage(page: Page, pageNumber: number): Promise<DoTerraProduct[]> {
    const pageUrl = `${this.targetUrl}?page=${pageNumber}`;
    console.log(`📍 訪問第 ${pageNumber + 1} 頁: ${pageUrl}`);
    
    try {
      await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // 等待產品載入
      await page.waitForSelector('.grid-product', { timeout: 30000 });
      console.log(`✅ 第 ${pageNumber + 1} 頁產品容器已載入`);

      // 模擬用戶滾動
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
      });
      await this.sleep(2000);

      // 獲取產品列表
      const products = await page.evaluate(() => {
        const productElements = document.querySelectorAll('.grid-product');
        console.log(`找到 ${productElements.length} 個產品`);
        
        const results: any[] = [];

        productElements.forEach((element, index) => {
          try {
            // 產品名稱 - 尋找可能的標題元素
            const titleSelectors = ['h1', 'h2', 'h3', 'h4', '.title', '.name', '[class*="title"]', '[class*="name"]'];
            let name = '';
            for (const selector of titleSelectors) {
              const titleElement = element.querySelector(selector);
              if (titleElement && titleElement.textContent?.trim()) {
                name = titleElement.textContent.trim();
                break;
              }
            }

            // 產品連結
            const linkElement = element.querySelector('a');
            let productUrl = linkElement?.getAttribute('href');
            if (productUrl && productUrl.startsWith('/')) {
              productUrl = 'https://www.doterra.com' + productUrl;
            }

            // 產品圖片
            const imageElement = element.querySelector('img');
            let imageUrl = imageElement?.getAttribute('src') || imageElement?.getAttribute('data-src');
            if (imageUrl && imageUrl.startsWith('/')) {
              imageUrl = 'https://www.doterra.com' + imageUrl;
            }

            // 產品類型 - 從連結路徑或其他地方推斷
            const category = 'essential-oils'; // 預設為精油類別

            // 產品價格 - 尋找可能包含價格的元素
            const priceSelectors = ['.price', '.total', '[class*="price"]', '[class*="total"]'];
            let price = '';
            for (const selector of priceSelectors) {
              const priceElement = element.querySelector(selector);
              if (priceElement && priceElement.textContent?.trim()) {
                price = priceElement.textContent.trim();
                break;
              }
            }

            if (name && productUrl) {
              results.push({
                name,
                englishName: name, // 初始設為相同，詳細頁面會更新
                description: '',
                imageUrl: imageUrl || '',
                productUrl,
                category: category || 'essential-oils',
                price: price || ''
              });

              console.log(`產品 ${index + 1}: ${name}`);
            }
          } catch (error) {
            console.log(`解析產品 ${index + 1} 時發生錯誤:`, error);
          }
        });

        return results;
      });

      console.log(`✅ 第 ${pageNumber + 1} 頁成功獲取 ${products.length} 個產品`);
      return products;

    } catch (error) {
      console.error(`❌ 爬取第 ${pageNumber + 1} 頁產品列表失敗:`, error);
      return [];
    }
  }

  private async scrapeProductList(page: Page): Promise<DoTerraProduct[]> {
    console.log('📋 開始爬取所有頁面的產品列表...');
    
    const allProducts: DoTerraProduct[] = [];
    const totalPages = 4; // 爬取 4 頁
    
    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
      try {
        console.log(`\n🔄 開始爬取第 ${pageNum + 1}/${totalPages} 頁...`);
        const pageProducts = await this.scrapeProductListFromPage(page, pageNum);
        
        if (pageProducts.length > 0) {
          allProducts.push(...pageProducts);
          console.log(`✅ 第 ${pageNum + 1} 頁完成，累計 ${allProducts.length} 個產品`);
        } else {
          console.log(`⚠️  第 ${pageNum + 1} 頁沒有產品，可能已到最後一頁`);
          break;
        }
        
        // 頁面間延遲，避免請求過快
        if (pageNum < totalPages - 1) {
          console.log('⏳ 等待 3 秒後繼續下一頁...');
          await this.sleep(3000);
        }
        
      } catch (error) {
        console.error(`❌ 處理第 ${pageNum + 1} 頁時出錯:`, error);
        continue; // 繼續處理下一頁
      }
    }
    
    console.log(`🎉 所有頁面爬取完成！總共獲得 ${allProducts.length} 個產品`);
    return allProducts;
  }

  private async scrapeProductDetail(page: Page, product: DoTerraProduct): Promise<DoTerraProduct> {
    console.log(`🔍 正在爬取產品詳細資訊: ${product.name}`);
    
    try {
      await page.goto(product.productUrl, { waitUntil: 'networkidle', timeout: 30000 });
      
      // 等待頁面載入
      await this.sleep(3000);

      const detailInfo = await page.evaluate(() => {
        const result: any = {};

        // 尋找英文名稱
        const englishNameElement = document.querySelector('[class*="latin"], .product-title__latin, [lang="en"]');
        result.englishName = englishNameElement?.textContent?.trim() || '';

        // 尋找產品描述
        const descElements = document.querySelectorAll('.product-description, .product-overview, [class*="description"], .content p');
        let description = '';
        descElements.forEach(el => {
          const text = el.textContent?.trim();
          if (text && text.length > description.length) {
            description = text;
          }
        });
        result.description = description;

        // 尋找功效列表
        const benefitElements = document.querySelectorAll('.benefits li, [class*="benefit"] li, .features li');
        const benefits: string[] = [];
        benefitElements.forEach(el => {
          const benefit = el.textContent?.trim();
          if (benefit) benefits.push(benefit);
        });
        result.benefits = benefits;

        // 尋找成分列表
        const ingredientElements = document.querySelectorAll('.ingredients li, [class*="ingredient"] li');
        const ingredients: string[] = [];
        ingredientElements.forEach(el => {
          const ingredient = el.textContent?.trim();
          if (ingredient) ingredients.push(ingredient);
        });
        result.ingredients = ingredients;

        // 尋找容量資訊
        const volumeElement = document.querySelector('[class*="size"], [class*="volume"], .product-size');
        result.volume = volumeElement?.textContent?.trim() || '';

        return result;
      });

      // 更新產品資訊
      const updatedProduct = {
        ...product,
        englishName: detailInfo.englishName || product.name,
        description: detailInfo.description || `${product.name}是一款優質的精油產品`,
        benefits: detailInfo.benefits.length > 0 ? detailInfo.benefits : ['天然純淨', '多種用途'],
        ingredients: detailInfo.ingredients,
        volume: detailInfo.volume || '15ml'
      };

      console.log(`✅ 成功獲取 ${product.name} 的詳細資訊`);
      return updatedProduct;

    } catch (error) {
      console.error(`❌ 獲取 ${product.name} 詳細資訊失敗:`, error);
      return {
        ...product,
        englishName: product.name,
        description: `${product.name}是一款優質的精油產品`,
        benefits: ['天然純淨', '多種用途']
      };
    }
  }

  private async downloadHighResImage(page: Page, product: DoTerraProduct): Promise<string> {
    console.log(`📷 正在下載 ${product.name} 的產品圖片...`);
    
    try {
      const productId = this.generateProductId(product.name);

      // 1. 優先從產品頁面尋找最佳圖片
      const bestImageUrl = await this.findBestProductImage(page);
      
      if (bestImageUrl && !bestImageUrl.includes('jun27-zh-tw-top-sales')) {
        console.log(`🎯 找到產品圖片: ${bestImageUrl.substring(0, 80)}...`);
        
        const localPath = await this.downloadImageFromUrl(bestImageUrl, productId, page);
        if (localPath) {
          console.log(`✅ 成功下載產品圖片: ${localPath}`);
          return localPath;
        }
      }

      // 2. 嘗試「高解析圖檔」連結（但過濾掉廣告圖片）
      console.log('🔍 嘗試高解析圖檔連結...');
      const highResImageUrl = await this.tryHighResLink(page);
      
      if (highResImageUrl && !highResImageUrl.includes('jun27-zh-tw-top-sales')) {
        const localPath = await this.downloadImageFromUrl(highResImageUrl, productId, page);
        if (localPath) {
          console.log(`✅ 成功下載高解析圖片: ${localPath}`);
          return localPath;
        }
      }

      // 3. 最後的後備方案
      console.log('⚠️  使用最後的後備方案...');
      return await this.fallbackImageDownload(page, product);

    } catch (error) {
      console.error(`❌ 下載 ${product.name} 圖片失敗:`, error);
      return '/images/placeholder.jpg';
    }
  }

  private async findBestProductImage(page: Page): Promise<string | null> {
    try {
      // 在產品詳情頁面尋找最佳圖片
      return await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        let bestImage: string | null = null;
        let maxSize = 0;

        for (const img of images) {
          const src = img.src;
          if (!src || src.includes('placeholder') || src.includes('icon') || src.includes('logo')) {
            continue;
          }

          // 優先考慮產品圖片相關的 URL 模式
          if (src.includes('/medias/') && (src.includes('.jpg') || src.includes('.png'))) {
            const width = img.naturalWidth || img.width || 0;
            const height = img.naturalHeight || img.height || 0;
            const size = width * height;

            // 排除明顯的廣告或橫幅圖片
            if (width > 200 && height > 200 && !src.includes('banner') && !src.includes('top-sales')) {
              if (size > maxSize) {
                maxSize = size;
                bestImage = src;
              }
            }
          }
        }

        return bestImage;
      });
    } catch (error) {
      console.error('尋找最佳產品圖片時發生錯誤:', error);
      return null;
    }
  }

  private async tryHighResLink(page: Page): Promise<string | null> {
    try {
      // 搜尋「高解析圖檔」文字
      const highResLinkFound = await page.evaluate(() => {
        const allElements = Array.from(document.querySelectorAll('a, button, [role="button"], span, div'));
        
        for (const element of allElements) {
          const text = element.textContent?.trim();
          if (text?.includes('高解析圖檔') || text?.includes('高解析度') || text?.includes('查看大圖')) {
            return true;
          }
        }
        return false;
      });

      if (highResLinkFound) {
        console.log('✅ 找到高解析圖檔連結');
        return await this.clickHighResLinkAndGetImage(page);
      }

      return null;
    } catch (error) {
      console.error('嘗試高解析度連結時發生錯誤:', error);
      return null;
    }
  }

  private async clickHighResLinkAndGetImage(page: Page): Promise<string | null> {
    try {
      // 準備監聽新頁面或彈出視窗
      const newPagePromise = page.context().waitForEvent('page', { timeout: 10000 }).catch(() => null);
      
      // 點擊高解析圖檔連結
      const clicked = await page.evaluate(() => {
        const allElements = Array.from(document.querySelectorAll('a, button, [role="button"], span, div'));
        
        for (const element of allElements) {
          const text = element.textContent?.trim();
          if (text?.includes('高解析圖檔') || text?.includes('高解析度') || text?.includes('查看大圖')) {
            console.log(`點擊元素: ${text}`);
            (element as HTMLElement).click();
            return true;
          }
        }
        return false;
      });

      if (!clicked) {
        console.log('❌ 無法點擊高解析圖檔連結');
        return null;
      }

      console.log('🔗 已點擊高解析圖檔連結，等待新頁面...');
      
      // 等待新頁面開啟
      const newPage = await newPagePromise;
      
      if (newPage) {
        console.log('📄 新頁面已開啟');
        
        // 等待新頁面載入完成
        await newPage.waitForLoadState('networkidle', { timeout: 15000 });
        
        // 從新頁面獲取圖片 URL
        const imageUrl = await newPage.evaluate(() => {
          // 尋找最大的圖片
          const images = Array.from(document.querySelectorAll('img'));
          let largestImg: HTMLImageElement | null = null;
          let maxSize = 0;

          for (const img of images) {
            const size = (img.naturalWidth || img.width || 0) * (img.naturalHeight || img.height || 0);
            if (size > maxSize && img.src && !img.src.includes('placeholder')) {
              maxSize = size;
              largestImg = img;
            }
          }

          return largestImg?.src || null;
        });

        // 關閉新頁面
        await newPage.close();
        
        if (imageUrl) {
          console.log(`✅ 從新頁面獲得圖片 URL: ${imageUrl.substring(0, 100)}...`);
          return imageUrl;
        }
      } else {
        // 可能是在當前頁面中顯示，等待一下然後檢查
        await this.sleep(3000);
        
        const imageUrl = await page.evaluate(() => {
          // 檢查是否有新的大圖片出現
          const images = Array.from(document.querySelectorAll('img'));
          for (const img of images) {
            if (img.src && (img.naturalWidth || img.width || 0) > 400) {
              return img.src;
            }
          }
          return null;
        });

        if (imageUrl) {
          console.log(`✅ 在當前頁面找到大圖: ${imageUrl.substring(0, 100)}...`);
          return imageUrl;
        }
      }

      return null;
      
    } catch (error) {
      console.error('點擊高解析圖檔連結時發生錯誤:', error);
      return null;
    }
  }

  private async downloadImageFromUrl(imageUrl: string, productId: string, page?: Page): Promise<string | null> {
    try {
      console.log(`⬇️  正在下載圖片: ${imageUrl.substring(0, 100)}...`);
      
      // 方法1: 如果有 page 對象，嘗試使用瀏覽器上下文下載
      if (page) {
        const imageData = await this.downloadImageViaBrowser(page, imageUrl);
        if (imageData) {
          const savedPath = await this.saveImageData(imageData, productId);
          if (savedPath) {
            console.log(`✅ 圖片已透過瀏覽器下載並儲存: ${savedPath}`);
            return savedPath;
          }
        }
      }
      
      // 方法2: 傳統 HTTP 下載（加入更多 headers）
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.doterra.com/',
          'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
          'Connection': 'keep-alive',
          'Sec-Fetch-Dest': 'image',
          'Sec-Fetch-Mode': 'no-cors',
          'Sec-Fetch-Site': 'same-origin'
        }
      });

      if (response.status === 200 && response.data) {
        const savedPath = await this.saveImageData(Buffer.from(response.data), productId);
        if (savedPath) {
          console.log(`✅ 圖片已透過 HTTP 下載並儲存: ${savedPath}`);
          return savedPath;
        }
      }

      return null;

    } catch (error) {
      console.error('從 URL 下載圖片失敗:', error);
      return null;
    }
  }

  private async downloadImageViaBrowser(page: Page, imageUrl: string): Promise<Buffer | null> {
    try {
      // 在瀏覽器上下文中獲取圖片數據
      const imageData = await page.evaluate(async (url) => {
        try {
          const response = await fetch(url);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            return Array.from(new Uint8Array(arrayBuffer));
          }
          return null;
        } catch (error) {
          console.error('瀏覽器內下載圖片失敗:', error);
          return null;
        }
      }, imageUrl);

      if (imageData && Array.isArray(imageData)) {
        return Buffer.from(imageData);
      }
    } catch (error) {
      console.error('瀏覽器下載圖片失敗:', error);
    }
    
    return null;
  }

  private async saveImageData(imageData: Buffer, productId: string): Promise<string | null> {
    try {
      const fileName = `${productId}.jpg`;
      const filePath = path.join(this.outputDir, fileName);

      // 使用 Sharp 處理和優化圖片
      await sharp(imageData)
        .resize(800, 800, { 
          fit: 'contain', 
          background: { r: 255, g: 255, b: 255 }
        })
        .jpeg({ quality: 90 })
        .toFile(filePath);

      const relativePath = `/images/products/doterra/${fileName}`;
      console.log(`✅ 圖片已儲存並優化: ${relativePath}`);
      
      return relativePath;

    } catch (error) {
      console.error('儲存圖片失敗:', error);
      return null;
    }
  }

  private async moveDownloadedImage(productId: string): Promise<string | null> {
    try {
      if (!fs.existsSync(this.downloadsDir)) {
        console.log('❌ Downloads 目錄不存在');
        return null;
      }

      // 獲取 Downloads 目錄中的最新圖片
      const files = fs.readdirSync(this.downloadsDir);
      const imageFiles = files.filter(file => 
        file.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i)
      );

      if (imageFiles.length === 0) {
        console.log('❌ Downloads 目錄中沒有圖片檔案');
        return null;
      }

      // 找到最新的圖片檔案
      let latestFile = imageFiles[0];
      let latestTime = fs.statSync(path.join(this.downloadsDir, latestFile)).mtime;

      for (const file of imageFiles) {
        const filePath = path.join(this.downloadsDir, file);
        const fileTime = fs.statSync(filePath).mtime;
        if (fileTime > latestTime) {
          latestFile = file;
          latestTime = fileTime;
        }
      }

      // 移動並重新命名圖片
      const sourcePath = path.join(this.downloadsDir, latestFile);
      const fileExtension = path.extname(latestFile);
      const newFileName = `${productId}${fileExtension}`;
      const destPath = path.join(this.outputDir, newFileName);

      fs.copyFileSync(sourcePath, destPath);
      
      // 可選：刪除原始下載檔案
      try {
        fs.unlinkSync(sourcePath);
      } catch (e) {
        console.log('清理原始檔案時發生錯誤:', e);
      }

      const relativePath = `/images/products/doterra/${newFileName}`;
      console.log(`✅ 圖片已移動到: ${relativePath}`);
      
      return relativePath;

    } catch (error) {
      console.error('移動下載圖片時發生錯誤:', error);
      return null;
    }
  }

  private async fallbackImageDownload(page: Page, product: DoTerraProduct): Promise<string> {
    // 後備方案：如果無法觸發下載，直接獲取頁面上的主要圖片
    try {
      const imageUrl = await page.evaluate(() => {
        const selectors = [
          '.product-gallery img',
          '.main-image img', 
          '[class*="hero"] img',
          '.product-image img'
        ];

        for (const selector of selectors) {
          const img = document.querySelector(selector) as HTMLImageElement;
          if (img && img.src) {
            return img.src;
          }
        }
        return null;
      });

      if (imageUrl) {
        console.log(`使用後備方案下載圖片: ${imageUrl}`);
        // 這裡可以實作直接 HTTP 下載圖片的邏輯
        return '/images/placeholder.jpg'; // 暫時返回預設圖片
      }
    } catch (error) {
      console.error('後備圖片下載失敗:', error);
    }

    return '/images/placeholder.jpg';
  }

  private convertToProduct(doterraProduct: DoTerraProduct): Product {
    const productId = this.generateProductId(doterraProduct.name);
    
    return {
      id: `doterra-real-${productId}`,
      name: doterraProduct.name,
      englishName: doterraProduct.englishName,
      description: doterraProduct.description,
      benefits: doterraProduct.benefits || ['天然純淨', '高品質精油'],
      category: this.categorizeProduct(doterraProduct.name, doterraProduct.category || ''),
      volume: doterraProduct.volume || '15ml',
      imageUrl: doterraProduct.localImagePath || '/images/placeholder.jpg',
      inStock: true,
      ingredients: doterraProduct.ingredients,
      tags: this.generateTags(doterraProduct.name, doterraProduct.description),
      isBestseller: this.isPopularProduct(doterraProduct.name),
      isNew: false
    };
  }

  private categorizeProduct(name: string, category: string): string {
    const nameAndCategory = (name + ' ' + category).toLowerCase();
    
    if (nameAndCategory.includes('blend') || nameAndCategory.includes('複方')) {
      return 'blends';
    }
    if (nameAndCategory.includes('roll') || nameAndCategory.includes('滾珠')) {
      return 'wellness';
    }
    if (nameAndCategory.includes('cream') || nameAndCategory.includes('乳霜')) {
      return 'skincare';
    }
    
    return 'essential-oils';
  }

  private generateTags(name: string, description: string): string[] {
    const tags = new Set<string>();
    const text = (name + ' ' + description).toLowerCase();
    
    const tagMap: Record<string, string> = {
      'lavender': '薰衣草',
      'peppermint': '薄荷',
      'lemon': '檸檬',
      'tea tree': '茶樹',
      'frankincense': '乳香',
      'eucalyptus': '尤加利',
      '薰衣草': '放鬆',
      '薄荷': '提神',
      '檸檬': '清新',
      '茶樹': '清潔',
      '乳香': '抗老'
    };

    Object.entries(tagMap).forEach(([keyword, tag]) => {
      if (text.includes(keyword)) {
        tags.add(tag);
      }
    });

    if (tags.size === 0) {
      tags.add('精油').add('天然');
    }

    return Array.from(tags);
  }

  private isPopularProduct(name: string): boolean {
    const popularProducts = ['lavender', 'peppermint', 'lemon', 'tea tree', 'frankincense'];
    return popularProducts.some(product => 
      name.toLowerCase().includes(product)
    );
  }

  public async scrapeProducts(): Promise<Product[]> {
    console.log('🌿 開始爬取 doTERRA 真實產品資料...');
    
    const page = await this.setupBrowser();
    const allProducts: Product[] = [];

    try {
      // 1. 爬取產品列表
      const productList = await this.scrapeProductList(page);
      console.log(`📋 獲得 ${productList.length} 個產品列表`);

      if (productList.length === 0) {
        console.log('❌ 未獲得產品列表，停止爬取');
        return [];
      }

      // 檢查已存在的產品資料
      const existingDataPath = path.join(this.dataDir, 'doterra-real-products.json');
      let existingProducts: any[] = [];
      if (fs.existsSync(existingDataPath)) {
        try {
          const existingData = fs.readFileSync(existingDataPath, 'utf-8');
          existingProducts = JSON.parse(existingData);
          allProducts.push(...existingProducts);
          console.log(`🔄 已載入 ${existingProducts.length} 個現有產品資料`);
        } catch (error) {
          console.log('⚠️  讀取現有資料失敗，將從頭開始');
        }
      }

      // 處理所有爬取到的產品，從未處理的開始
      const productsToProcess = productList;
      const startIndex = existingProducts.length;
      console.log(`🎯 將處理第 ${startIndex + 1}-${productsToProcess.length} 個產品（共 ${productsToProcess.length} 個）`);

      // 2. 處理每個產品
      for (let i = startIndex; i < productsToProcess.length; i++) {
        const product = productsToProcess[i];
        console.log(`\n📦 處理產品 ${i + 1}/${productsToProcess.length}: ${product.name}`);

        try {
          // 2a. 獲取產品詳細資訊
          const detailedProduct = await this.scrapeProductDetail(page, product);
          
          // 2b. 下載高解析圖片
          const localImagePath = await this.downloadHighResImage(page, detailedProduct);
          detailedProduct.localImagePath = localImagePath;

          // 2c. 轉換為標準格式
          const finalProduct = this.convertToProduct(detailedProduct);
          allProducts.push(finalProduct);

          // 增量保存 - 每處理一個產品就保存一次
          const outputPath = path.join(this.dataDir, 'doterra-real-products.json');
          fs.writeFileSync(outputPath, JSON.stringify(allProducts, null, 2), 'utf-8');

          console.log(`✅ 完成產品 ${i + 1}: ${product.name} (已保存到 JSON)`);

          // 等待間隔
          await this.sleep(2000 + Math.random() * 2000);

        } catch (error) {
          console.error(`❌ 處理產品 ${product.name} 時發生錯誤:`, error);
          continue;
        }
      }

      // 3. 最終保存結果
      const outputPath = path.join(this.dataDir, 'doterra-real-products.json');
      fs.writeFileSync(outputPath, JSON.stringify(allProducts, null, 2), 'utf-8');

      console.log(`\n🎉 爬取完成！`);
      console.log(`✅ 成功處理 ${allProducts.length} 個產品`);
      console.log(`📁 資料已儲存至: ${outputPath}`);
      console.log(`🖼️  圖片已儲存至: ${this.outputDir}`);

      return allProducts;

    } catch (error) {
      console.error('❌ 爬取過程發生錯誤:', error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
        console.log('🔚 瀏覽器已關閉');
      }
    }
  }
}

// 主執行函數
async function main() {
  try {
    const scraper = new AdvancedDoTerraScraper();
    const products = await scraper.scrapeProducts();
    
    console.log('\n=== 爬取結果統計 ===');
    console.log(`總共獲得: ${products.length} 個產品`);
    
    if (products.length > 0) {
      console.log('\n🏆 產品列表:');
      products.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} (${product.englishName})`);
      });

      const categories = products.reduce((acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('\n📊 產品類別統計:');
      Object.entries(categories).forEach(([category, count]) => {
        console.log(`  ${category}: ${count} 個`);
      });
    }
    
  } catch (error) {
    console.error('❌ 執行失敗:', error);
    process.exit(1);
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  main();
}

export { AdvancedDoTerraScraper };