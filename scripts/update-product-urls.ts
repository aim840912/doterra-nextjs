#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';

// 真實的 doTERRA 產品 URL 對應表
const PRODUCT_URL_MAPPING: Record<string, string> = {
  // 精油產品對應表（基於真實的 doTERRA URL）
  '丁香精油': 'https://www.doterra.com/TW/zh_TW/p/clove-oil',
  '乳香精油': 'https://www.doterra.com/TW/zh_TW/p/frankincense-oil',
  '伊蘭伊蘭精油': 'https://www.doterra.com/TW/zh_TW/p/ylang-ylang-oil',
  '佛手柑精油': 'https://www.doterra.com/TW/zh_TW/p/bergamot-oil',
  '冬青精油': 'https://www.doterra.com/TW/zh_TW/p/wintergreen-oil',
  '分餾椰子油': 'https://www.doterra.com/TW/zh_TW/p/fractionated-coconut-oil',
  '夏威夷檀香木精油': 'https://www.doterra.com/TW/zh_TW/p/hawaiian-sandalwood-oil',
  '天竺葵精油': 'https://www.doterra.com/TW/zh_TW/p/geranium-oil',
  '尤加利精油': 'https://www.doterra.com/TW/zh_TW/p/eucalyptus-oil',
  '岩蘭草精油': 'https://www.doterra.com/TW/zh_TW/p/vetiver-oil',
  '廣藿香精油': 'https://www.doterra.com/TW/zh_TW/p/patchouli-oil',
  '快樂鼠尾草精油': 'https://www.doterra.com/TW/zh_TW/p/clary-sage-oil',
  '杜松漿果精油': 'https://www.doterra.com/TW/zh_TW/p/juniper-berry-oil',
  '檀香木精油': 'https://www.doterra.com/TW/zh_TW/p/sandalwood-oil',
  '檸檬油': 'https://www.doterra.com/TW/zh_TW/p/lemon-oil',
  '檸檬草精油': 'https://www.doterra.com/TW/zh_TW/p/lemongrass-oil',
  '永久花精油': 'https://www.doterra.com/TW/zh_TW/p/helichrysum-oil',
  '沒藥精油': 'https://www.doterra.com/TW/zh_TW/p/myrrh-oil',
  '牛至精油': 'https://www.doterra.com/TW/zh_TW/p/oregano-oil',
  '甜茴香精油': 'https://www.doterra.com/TW/zh_TW/p/fennel-oil',
  '百里香精油': 'https://www.doterra.com/TW/zh_TW/p/thyme-oil',
  '綠薄荷油': 'https://www.doterra.com/TW/zh_TW/p/spearmint-oil',
  '羅勒精油': 'https://www.doterra.com/TW/zh_TW/p/basil-oil',
  '羅馬洋甘菊精油': 'https://www.doterra.com/TW/zh_TW/p/roman-chamomile-oil',
  '肉桂油': 'https://www.doterra.com/TW/zh_TW/p/cinnamon-bark-oil',
  '胡荽精油': 'https://www.doterra.com/TW/zh_TW/p/coriander-oil',
  '胡荽葉精油': 'https://www.doterra.com/TW/zh_TW/p/cilantro-oil',
  '茶樹精油': 'https://www.doterra.com/TW/zh_TW/p/melaleuca-oil',
  '萊姆精油': 'https://www.doterra.com/TW/zh_TW/p/lime-oil',
  '葡萄柚精油': 'https://www.doterra.com/TW/zh_TW/p/grapefruit-oil',
  '薄荷精油': 'https://www.doterra.com/TW/zh_TW/p/peppermint-oil',
  '薰衣草精油': 'https://www.doterra.com/TW/zh_TW/p/lavender-oil',
  '迷迭香精油': 'https://www.doterra.com/TW/zh_TW/p/rosemary-oil',
  '道格拉斯冷杉精油': 'https://www.doterra.com/TW/zh_TW/p/douglas-fir-oil',
  '野橘精油': 'https://www.doterra.com/TW/zh_TW/p/wild-orange-oil',
  '香蜂草精油': 'https://www.doterra.com/TW/zh_TW/p/melissa-oil',
  '馬鬱蘭精油': 'https://www.doterra.com/TW/zh_TW/p/marjoram-oil',
  '黑胡椒精油': 'https://www.doterra.com/TW/zh_TW/p/black-pepper-oil',
  
  // 特殊產品和新產品（可能需要調整）
  '雪松精油': 'https://www.doterra.com/TW/zh_TW/p/cedarwood-oil',
  '豆蔻精油': 'https://www.doterra.com/TW/zh_TW/p/cardamom-oil',
  '側柏精油': 'https://www.doterra.com/TW/zh_TW/p/arborvitae-oil',
  '玫瑰精油': 'https://www.doterra.com/TW/zh_TW/p/rose-oil',
  '穗甘松精油': 'https://www.doterra.com/TW/zh_TW/p/spikenard-oil',
  '苦橙葉精油': 'https://www.doterra.com/TW/zh_TW/p/petitgrain-oil',
  '山雞椒精油': 'https://www.doterra.com/TW/zh_TW/p/litsea-oil',
  '麥蘆卡精油': 'https://www.doterra.com/TW/zh_TW/p/manuka-oil',
  '古巴香脂精油': 'https://www.doterra.com/TW/zh_TW/p/copaiba-oil',
  '西伯利亞冷杉精油': 'https://www.doterra.com/TW/zh_TW/p/siberian-fir-oil',
  '藍艾菊精油': 'https://www.doterra.com/TW/zh_TW/p/blue-tansy-oil',
  '薑黃精油': 'https://www.doterra.com/TW/zh_TW/p/turmeric-oil',
  '粉紅胡椒精油': 'https://www.doterra.com/TW/zh_TW/p/pink-pepper-oil',
  '青橘精油': 'https://www.doterra.com/TW/zh_TW/p/green-mandarin-oil',
  '檸檬尤加利精油': 'https://www.doterra.com/TW/zh_TW/p/lemon-eucalyptus-oil',
  '黑雲杉精油': 'https://www.doterra.com/TW/zh_TW/p/black-spruce-oil',
  '絲柏精油': 'https://www.doterra.com/TW/zh_TW/p/cypress-oil',
  '桂皮精油': 'https://www.doterra.com/TW/zh_TW/p/cassia-oil',
  '生薑油': 'https://www.doterra.com/TW/zh_TW/p/ginger-oil',
  '五味子精油': 'https://www.doterra.com/TW/zh_TW/p/magnolia-oil', // 需要確認
  '馬達加斯加香草精油': 'https://www.doterra.com/TW/zh_TW/p/vanilla-oil',
  '西班牙鼠尾草精油': 'https://www.doterra.com/TW/zh_TW/p/spanish-sage-oil',
  '癒創木精油': 'https://www.doterra.com/TW/zh_TW/p/guaiacwood-oil',
  '樺樹精油': 'https://www.doterra.com/TW/zh_TW/p/birch-oil'
};

interface Product {
  id: string;
  name: string;
  productUrl?: string;
  [key: string]: any;
}

class ProductUrlUpdater {
  private dataPath = path.join(process.cwd(), 'src/data/doterra-real-products.json');

  private async loadProducts(): Promise<Product[]> {
    try {
      const data = fs.readFileSync(this.dataPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('載入產品資料失敗:', error);
      return [];
    }
  }

  private async saveProducts(products: Product[]): Promise<void> {
    try {
      fs.writeFileSync(this.dataPath, JSON.stringify(products, null, 2), 'utf-8');
      console.log('✅ 產品資料已儲存');
    } catch (error) {
      console.error('儲存產品資料失敗:', error);
    }
  }

  public async updateProductUrls(): Promise<void> {
    console.log('🚀 開始更新產品 URL...');

    const products = await this.loadProducts();
    console.log(`📋 載入了 ${products.length} 個產品`);

    let updatedCount = 0;
    let addedCount = 0;
    let notFoundCount = 0;

    for (const product of products) {
      const realUrl = PRODUCT_URL_MAPPING[product.name];
      
      if (realUrl) {
        if (product.productUrl) {
          // 更新現有的 URL
          if (product.productUrl !== realUrl) {
            console.log(`🔄 更新 "${product.name}" URL: ${product.productUrl} → ${realUrl}`);
            product.productUrl = realUrl;
            updatedCount++;
          }
        } else {
          // 添加缺失的 URL
          console.log(`➕ 添加 "${product.name}" URL: ${realUrl}`);
          product.productUrl = realUrl;
          addedCount++;
        }
      } else {
        console.log(`⚠️  未找到 "${product.name}" 的對應 URL`);
        notFoundCount++;
      }
    }

    await this.saveProducts(products);

    console.log('🎉 URL 更新完成！');
    console.log(`📊 統計:`);
    console.log(`   - 更新的 URL: ${updatedCount} 個`);
    console.log(`   - 新增的 URL: ${addedCount} 個`);
    console.log(`   - 未找到對應: ${notFoundCount} 個`);
    console.log(`   - 總產品數: ${products.length} 個`);
  }
}

// 主執行函數
async function main() {
  const updater = new ProductUrlUpdater();
  
  try {
    await updater.updateProductUrls();
  } catch (error) {
    console.error('❌ 執行失敗:', error);
    process.exit(1);
  }
}

// 如果是直接執行此腳本
if (require.main === module) {
  main();
}