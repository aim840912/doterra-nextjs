#!/usr/bin/env tsx

import { chromium } from 'playwright';
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
  productUrl: string;
  volume?: string;
  benefits?: string[];
  ingredients?: string[];
  category?: string;
}

class DoTerraScraper {
  private baseUrl = 'https://www.doterra.com/TW/zh_TW';
  private outputDir = path.join(process.cwd(), 'public/images/products/doterra');
  private dataDir = path.join(process.cwd(), 'src/data');
  
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
      .replace(/[^\u4e00-\u9fff\w\s]/gi, '') // 保留中文、英文、數字和空格
      .replace(/\s+/g, '-')
      .replace(/[^\w\u4e00-\u9fff-]/g, '');
  }

  private async downloadImage(imageUrl: string, productId: string): Promise<string> {
    try {
      console.log(`正在下載圖片: ${imageUrl}`);
      
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const fileName = `${productId}.jpg`;
      const filePath = path.join(this.outputDir, fileName);

      // 使用 sharp 處理和壓縮圖片
      await sharp(response.data)
        .resize(400, 400, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(filePath);

      console.log(`圖片已儲存: ${fileName}`);
      return `/images/products/doterra/${fileName}`;
    } catch (error) {
      console.error(`下載圖片失敗 ${imageUrl}:`, error);
      return '/images/placeholder.jpg'; // 使用預設圖片
    }
  }

  private async scrapePage(page: any, pageNum: number = 0): Promise<DoTerraProduct[]> {
    // 嘗試不同的 URL 格式
    const possibleUrls = [
      `${this.baseUrl}/shop/essential-oils/single-oils`,
      `${this.baseUrl}/pl/single-oils`,
      `${this.baseUrl}/products/essential-oils`,
      `https://www.doterra.com/TW/zh_TW/shop/essential-oils`,
      `https://www.doterra.com/TW/zh_TW/products`
    ];
    
    const url = pageNum === 0 ? possibleUrls[0] : `${possibleUrls[0]}?page=${pageNum}`;
    
    console.log(`正在訪問頁面 ${pageNum + 1}: ${url}`);
    
    try {
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });

      // 先嘗試等待任何可能的產品容器
      try {
        await page.waitForSelector('body', { timeout: 5000 });
        await this.sleep(5000); // 等待動態內容載入
      } catch (e) {
        console.log('等待頁面載入時發生問題，繼續處理...');
      }

      // 獲取頁面上的產品資訊
      const products = await page.evaluate(() => {
        // 嘗試多種可能的產品選擇器
        const selectors = [
          '.product-item, .product-tile, .js-product-tile',
          '[class*="product"][class*="card"], [class*="product"][class*="item"]',
          '.card, .product-card, .item',
          '[data-product], [data-testid*="product"]',
          'article, .product, [class*="grid"] > div'
        ];
        
        let productElements: NodeListOf<Element> | null = null;
        
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            productElements = elements;
            console.log(`找到產品使用選擇器: ${selector}, 數量: ${elements.length}`);
            break;
          }
        }
        
        if (!productElements || productElements.length === 0) {
          console.log('沒有找到產品元素，嘗試獲取頁面內容用於偵錯...');
          console.log('頁面標題:', document.title);
          console.log('頁面URL:', window.location.href);
          return [];
        }
        const results: any[] = [];

        productElements.forEach((element: Element) => {
          try {
            // 尋找產品名稱
            const nameElement = element.querySelector('[class*="product-name"], [class*="product-title"], h3, h4, .name, .title');
            const name = nameElement?.textContent?.trim();

            // 尋找產品圖片
            const imageElement = element.querySelector('img');
            let imageUrl = imageElement?.src || imageElement?.getAttribute('data-src');
            
            // 處理相對路徑
            if (imageUrl && imageUrl.startsWith('/')) {
              imageUrl = 'https://www.doterra.com' + imageUrl;
            }

            // 尋找產品連結
            const linkElement = element.querySelector('a') || element.closest('a');
            let productUrl = linkElement?.href;
            if (productUrl && productUrl.startsWith('/')) {
              productUrl = 'https://www.doterra.com' + productUrl;
            }

            // 尋找描述
            const descElement = element.querySelector('[class*="description"], [class*="desc"], .excerpt, p');
            const description = descElement?.textContent?.trim();

            // 尋找容量資訊
            const volumeElement = element.querySelector('[class*="volume"], [class*="size"], .ml, .oz');
            const volume = volumeElement?.textContent?.trim();

            if (name && imageUrl) {
              results.push({
                name,
                imageUrl,
                productUrl: productUrl || '',
                description: description || '',
                volume: volume || ''
              });
            }
          } catch (error) {
            console.log('解析產品元素時發生錯誤:', error);
          }
        });

        return results;
      });

      console.log(`在頁面 ${pageNum + 1} 找到 ${products.length} 個產品`);
      return products;

    } catch (error) {
      console.error(`爬取頁面 ${pageNum + 1} 時發生錯誤:`, error);
      return [];
    }
  }

  private async scrapeProductDetails(page: any, product: DoTerraProduct): Promise<DoTerraProduct> {
    if (!product.productUrl) return product;

    try {
      console.log(`正在訪問產品詳細頁面: ${product.name}`);
      await page.goto(product.productUrl, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      await this.sleep(2000);

      const details = await page.evaluate(() => {
        // 尋找英文名稱
        const englishNameElement = document.querySelector('[class*="english"], [lang="en"], .latin-name');
        const englishName = englishNameElement?.textContent?.trim();

        // 尋找詳細描述
        const descElements = document.querySelectorAll('[class*="description"], .product-description, .overview, .benefits');
        let description = '';
        descElements.forEach(el => {
          const text = el.textContent?.trim();
          if (text && text.length > description.length) {
            description = text;
          }
        });

        // 尋找功效列表
        const benefitElements = document.querySelectorAll('[class*="benefit"] li, .benefits li, [class*="feature"] li');
        const benefits: string[] = [];
        benefitElements.forEach(el => {
          const benefit = el.textContent?.trim();
          if (benefit) benefits.push(benefit);
        });

        // 尋找成分資訊
        const ingredientElements = document.querySelectorAll('[class*="ingredient"] li, .ingredients li, [class*="component"] li');
        const ingredients: string[] = [];
        ingredientElements.forEach(el => {
          const ingredient = el.textContent?.trim();
          if (ingredient) ingredients.push(ingredient);
        });

        return {
          englishName: englishName || '',
          description: description || '',
          benefits,
          ingredients
        };
      });

      return {
        ...product,
        englishName: details.englishName || product.name,
        description: details.description || product.description,
        benefits: details.benefits.length > 0 ? details.benefits : undefined,
        ingredients: details.ingredients.length > 0 ? details.ingredients : undefined
      };

    } catch (error) {
      console.error(`取得產品詳細資訊失敗 ${product.name}:`, error);
      return {
        ...product,
        englishName: product.name,
        description: product.description || '純天然精油產品'
      };
    }
  }

  private convertToProduct(doterraProduct: DoTerraProduct, localImagePath: string): Product {
    const productId = this.generateProductId(doterraProduct.name);
    
    return {
      id: `doterra-${productId}`,
      name: doterraProduct.name,
      englishName: doterraProduct.englishName || doterraProduct.name,
      description: doterraProduct.description || '來自 doTERRA 的優質精油產品',
      benefits: doterraProduct.benefits || ['天然純淨', '高品質精油', '多種用途'],
      category: this.categorizeProduct(doterraProduct.name, doterraProduct.description),
      volume: doterraProduct.volume || '15ml',
      imageUrl: localImagePath,
      inStock: true,
      tags: this.generateTags(doterraProduct.name, doterraProduct.description)
    };
  }

  private categorizeProduct(name: string, description: string): string {
    const nameAndDesc = (name + ' ' + description).toLowerCase();
    
    if (nameAndDesc.includes('複方') || nameAndDesc.includes('blend')) {
      return 'blends';
    }
    if (nameAndDesc.includes('護膚') || nameAndDesc.includes('保養') || nameAndDesc.includes('乳霜')) {
      return 'skincare';
    }
    if (nameAndDesc.includes('營養') || nameAndDesc.includes('supplement') || nameAndDesc.includes('維生素')) {
      return 'supplements';
    }
    if (nameAndDesc.includes('健康') || nameAndDesc.includes('wellness')) {
      return 'wellness';
    }
    
    return 'essential-oils'; // 預設為精油
  }

  private generateTags(name: string, description: string): string[] {
    const tags = new Set<string>();
    const text = (name + ' ' + description).toLowerCase();
    
    const tagMap: Record<string, string> = {
      '薰衣草': '放鬆',
      '薄荷': '提神',
      '檸檬': '清新',
      '茶樹': '清潔',
      '乳香': '抗老',
      '放鬆': '放鬆',
      '睡眠': '睡眠',
      '提神': '提神',
      '清潔': '清潔',
      '護膚': '護膚',
      '呼吸': '呼吸',
      '舒緩': '舒緩',
      '免疫': '免疫',
      '天然': '天然'
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

  public async scrapeProducts(): Promise<Product[]> {
    console.log('開始爬取 doTERRA 產品資料...');
    
    const browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });

      // 爬取第一頁產品列表
      const allDoTerraProducts: DoTerraProduct[] = [];
      const maxPages = 3; // 限制爬取頁數

      for (let i = 0; i < maxPages; i++) {
        const pageProducts = await this.scrapePage(page, i);
        if (pageProducts.length === 0) {
          console.log(`第 ${i + 1} 頁沒有產品，停止爬取`);
          break;
        }
        allDoTerraProducts.push(...pageProducts);
        await this.sleep(2000); // 頁面間等待
      }

      console.log(`總共找到 ${allDoTerraProducts.length} 個產品`);

      // 獲取詳細產品資訊 (限制前 20 個產品以避免過長時間)
      const productsToProcess = allDoTerraProducts.slice(0, 20);
      const detailedProducts: DoTerraProduct[] = [];

      for (let i = 0; i < productsToProcess.length; i++) {
        try {
          const detailed = await this.scrapeProductDetails(page, productsToProcess[i]);
          detailedProducts.push(detailed);
          console.log(`已處理產品 ${i + 1}/${productsToProcess.length}: ${detailed.name}`);
          await this.sleep(1500); // 產品間等待
        } catch (error) {
          console.error(`處理產品失敗:`, error);
          detailedProducts.push(productsToProcess[i]);
        }
      }

      await browser.close();

      // 下載圖片並轉換為最終格式
      const products: Product[] = [];
      
      for (let i = 0; i < detailedProducts.length; i++) {
        const doterraProduct = detailedProducts[i];
        const productId = this.generateProductId(doterraProduct.name);
        
        console.log(`處理產品 ${i + 1}/${detailedProducts.length}: ${doterraProduct.name}`);
        
        const localImagePath = await this.downloadImage(doterraProduct.imageUrl, productId);
        const product = this.convertToProduct(doterraProduct, localImagePath);
        
        products.push(product);
        await this.sleep(1000); // 圖片下載間等待
      }

      // 儲存產品資料
      const outputPath = path.join(this.dataDir, 'doterra-products.json');
      fs.writeFileSync(outputPath, JSON.stringify(products, null, 2), 'utf-8');
      
      console.log(`✅ 成功爬取 ${products.length} 個產品`);
      console.log(`📁 產品資料已儲存至: ${outputPath}`);
      console.log(`🖼️  產品圖片已儲存至: ${this.outputDir}`);
      
      return products;

    } catch (error) {
      console.error('爬取過程發生錯誤:', error);
      await browser.close();
      throw error;
    }
  }
}

// 主執行函數
async function main() {
  try {
    const scraper = new DoTerraScraper();
    const products = await scraper.scrapeProducts();
    
    console.log('\n=== 爬取結果 ===');
    console.log(`總共獲得 ${products.length} 個產品`);
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} (${product.englishName})`);
    });
    
  } catch (error) {
    console.error('執行失敗:', error);
    process.exit(1);
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  main();
}

export { DoTerraScraper };