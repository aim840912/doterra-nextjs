#!/usr/bin/env tsx

import axios from 'axios';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { Product } from '../src/types/product';

interface SampleProductData {
  name: string;
  englishName: string;
  description: string;
  benefits: string[];
  category: string;
  volume: string;
  ingredients?: string[];
  tags: string[];
  imageKeyword: string; // 用於搜尋圖片的關鍵字
}

class SampleDataGenerator {
  private outputDir = path.join(process.cwd(), 'public/images/products/doterra');
  private dataDir = path.join(process.cwd(), 'src/data');

  // 基於真實 doTERRA 產品的樣本資料
  private sampleProducts: SampleProductData[] = [
    {
      name: '薰衣草精油',
      englishName: 'Lavender Essential Oil',
      description: '最受歡迎的精油之一，以其舒緩和鎮靜的特性而聞名。薰衣草精油廣泛用於芳香療法和護膚，能幫助促進寧靜的睡眠環境。',
      benefits: ['促進寧靜和放鬆', '支持健康睡眠', '舒緩偶發性皮膚刺激', '清潔和淨化空氣'],
      category: 'essential-oils',
      volume: '15ml',
      ingredients: ['薰衣草花'],
      tags: ['放鬆', '睡眠', '護膚', '舒緩'],
      imageKeyword: 'lavender essential oil bottle'
    },
    {
      name: '薄荷精油',
      englishName: 'Peppermint Essential Oil',
      description: '清新涼爽的薄荷精油，具有振奮精神和提神醒腦的特性。這款多功能精油能支持呼吸道健康並促進消化舒適感。',
      benefits: ['提升專注力和清晰思維', '支持呼吸道健康', '舒緩肌肉疲勞', '促進消化健康'],
      category: 'essential-oils',
      volume: '15ml',
      ingredients: ['薄荷葉'],
      tags: ['提神', '專注', '呼吸', '消化'],
      imageKeyword: 'peppermint essential oil'
    },
    {
      name: '檸檬精油',
      englishName: 'Lemon Essential Oil',
      description: '明亮清新的檸檬精油，從檸檬果皮冷壓萃取。具有振奮情緒和天然清潔的特性，為生活帶來陽光般的活力。',
      benefits: ['提升情緒和能量', '支持專注力', '天然清潔劑', '富含抗氧化特性'],
      category: 'essential-oils',
      volume: '15ml',
      ingredients: ['檸檬果皮'],
      tags: ['提神', '清潔', '情緒', '專注'],
      imageKeyword: 'lemon essential oil'
    },
    {
      name: '茶樹精油',
      englishName: 'Melaleuca (Tea Tree) Essential Oil',
      description: '來自澳洲原生的茶樹精油，以其強大的清潔和淨化特性著稱。是護膚和家居清潔的理想天然選擇。',
      benefits: ['強效清潔和淨化', '支持健康的免疫反應', '促進皮膚健康', '天然抗菌特性'],
      category: 'essential-oils',
      volume: '15ml',
      ingredients: ['茶樹葉'],
      tags: ['清潔', '淨化', '護膚', '抗菌'],
      imageKeyword: 'tea tree essential oil'
    },
    {
      name: '乳香精油',
      englishName: 'Frankincense Essential Oil',
      description: '被譽為「精油之王」的乳香精油，具有深層滋養和修復的特性。千年來被用於冥想和護膚，是高端護膚的首選。',
      benefits: ['促進細胞再生', '深層滋養肌膚', '支持情緒平衡', '增強冥想體驗'],
      category: 'essential-oils',
      volume: '15ml',
      ingredients: ['乳香樹脂'],
      tags: ['抗老', '護膚', '冥想', '情緒'],
      imageKeyword: 'frankincense essential oil'
    },
    {
      name: '尤加利精油',
      englishName: 'Eucalyptus Essential Oil',
      description: '清新的尤加利精油具有強大的淨化特性，特別適合在季節變化時使用。支持呼吸道健康和清潔空氣品質。',
      benefits: ['支持呼吸道暢通', '淨化空氣', '提升專注力', '舒緩肌肉疲勞'],
      category: 'essential-oils',
      volume: '15ml',
      ingredients: ['尤加利葉'],
      tags: ['呼吸', '淨化', '專注', '舒緩'],
      imageKeyword: 'eucalyptus essential oil'
    },
    {
      name: 'On Guard® 守護複方精油',
      englishName: 'On Guard® Protective Blend',
      description: '熱門的免疫支持複方精油，結合野橘、丁香、肉桂、尤加利和迷迭香的天然力量。為全家提供天然保護屏障。',
      benefits: ['支持健康的免疫反應', '天然清潔特性', '淨化空氣和表面', '提供抗氧化支持'],
      category: 'blends',
      volume: '15ml',
      ingredients: ['野橘', '丁香花蕾', '肉桂葉', '尤加利', '迷迭香'],
      tags: ['免疫', '保護', '清潔', '抗氧化'],
      imageKeyword: 'protective blend essential oil'
    },
    {
      name: 'Breathe® 暢呼吸複方精油',
      englishName: 'Breathe® Respiratory Blend',
      description: '專為支持呼吸系統設計的複方精油，結合薄荷、尤加利和其他清新精油。在季節變化或需要清新空氣時特別有用。',
      benefits: ['支持呼吸道暢通', '促進深層呼吸', '舒緩季節性不適', '清新空氣質量'],
      category: 'blends',
      volume: '15ml',
      ingredients: ['月桂葉', '薄荷', '尤加利', '茶樹', '檸檬', '豆蔻'],
      tags: ['呼吸', '清新', '舒緩', '季節性'],
      imageKeyword: 'respiratory blend essential oil'
    },
    {
      name: 'Serenity® 寧靜複方精油',
      englishName: 'Serenity® Restful Blend',
      description: '促進寧靜睡眠的複方精油，融合薰衣草、甜橙和其他舒緩精油。創造完美的睡前儀式，幫助身心放鬆。',
      benefits: ['促進寧靜放鬆', '支持健康睡眠', '舒緩日常壓力', '創造平和氛圍'],
      category: 'blends',
      volume: '15ml',
      ingredients: ['薰衣草', '甜馬鬱蘭', '羅馬洋甘菊', '依蘭依蘭', '檀香木', '香草'],
      tags: ['睡眠', '放鬆', '寧靜', '壓力'],
      imageKeyword: 'restful blend essential oil'
    },
    {
      name: 'Balance® 平衡複方精油',
      englishName: 'Balance® Grounding Blend',
      description: '幫助建立平靜基礎的複方精油，結合雲杉、檀香木和乳香等大地氣息的精油。適合冥想和尋求內在平衡時使用。',
      benefits: ['促進情緒平衡', '提供大地般的穩定感', '支持冥想練習', '舒緩焦慮感受'],
      category: 'blends',
      volume: '15ml',
      ingredients: ['雲杉', '胡梅花', '乳香', '藍艾菊'],
      tags: ['平衡', '冥想', '穩定', '情緒'],
      imageKeyword: 'grounding blend essential oil'
    },
    {
      name: 'DigestZen® 樂活複方精油',
      englishName: 'DigestZen® Digestive Blend',
      description: '專為支持消化系統設計的複方精油，結合薑、薄荷、茴香等傳統消化支持精油。餐前餐後的理想伴侶。',
      benefits: ['支持健康消化', '舒緩偶發性胃部不適', '促進腸道舒適', '天然消化輔助'],
      category: 'blends',
      volume: '15ml',
      ingredients: ['薑', '薄荷', '龍蒿', '茴香', '香菜', '茴芹'],
      tags: ['消化', '舒緩', '腸胃', '天然'],
      imageKeyword: 'digestive blend essential oil'
    },
    {
      name: 'Correct-X® 修護軟膏',
      englishName: 'Correct-X® Essential Ointment',
      description: '天然的修護軟膏，結合乳香、薰衣草、茶樹等精油和天然成分。為肌膚提供溫和而有效的呵護和修護支持。',
      benefits: ['舒緩皮膚不適', '促進肌膚修復', '天然成分配方', '適合全家使用'],
      category: 'skincare',
      volume: '15ml',
      ingredients: ['乳香', '薰衣草', '茶樹', '雪松木', '蜂蠟', '椰子油'],
      tags: ['修護', '舒緩', '天然', '護膚'],
      imageKeyword: 'essential oil ointment'
    },
    {
      name: 'Deep Blue® 舒緩乳霜',
      englishName: 'Deep Blue® Soothing Blend Rub',
      description: '專業級的舒緩乳霜，結合薄荷、冬青、樟腦等天然精油和舒緩成分。為運動後恢復或日常肌肉疲勞提供深層舒適感。',
      benefits: ['舒緩肌肉疲勞', '支持運動後恢復', '深層滲透配方', '天然舒緩成分'],
      category: 'wellness',
      volume: '120ml',
      ingredients: ['薄荷', '冬青', '樟腦', '薰衣草', '馬鬱蘭', '洋甘菊'],
      tags: ['舒緩', '運動', '肌肉', '按摩'],
      imageKeyword: 'soothing muscle rub'
    },
    {
      name: 'PastTense® 舒緩滾珠',
      englishName: 'PastTense® Tension Blend Roll-On',
      description: '便攜式舒緩滾珠，結合薄荷、薰衣草、馬鬱蘭等精油。專為現代生活壓力而設計，隨時隨地提供自然舒緩。',
      benefits: ['舒緩頭部緊張', '緩解日常壓力', '方便攜帶使用', '天然成分配方'],
      category: 'wellness',
      volume: '10ml',
      ingredients: ['薰衣草', '薄荷', '馬鬱蘭', '羅馬洋甘菊', '玄參', '迷迭香'],
      tags: ['舒緩', '壓力', '便攜', '頭部'],
      imageKeyword: 'tension relief roll on'
    },
    {
      name: 'Lifelong Vitality® 活力營養套組',
      englishName: 'Lifelong Vitality® Nutritional Supplements',
      description: '完整的日常營養補充方案，包含 Alpha CRS®、xEO Mega® 和 Microplex VMz®。提供身體所需的維生素、礦物質、抗氧化成分和必需脂肪酸。',
      benefits: ['全方位營養支持', '提升能量水平', '強效抗氧化保護', '支持免疫系統健康'],
      category: 'supplements',
      volume: '30天份',
      tags: ['營養', '活力', '抗氧化', '免疫'],
      imageKeyword: 'nutritional supplements'
    }
  ];
  
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

  private generateProductId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\u4e00-\u9fff\w\s]/gi, '')
      .replace(/\s+/g, '-')
      .replace(/[^\w\u4e00-\u9fff-]/g, '');
  }

  private async downloadPlaceholderImage(imageKeyword: string, productId: string): Promise<string> {
    try {
      console.log(`正在為 ${imageKeyword} 下載示例圖片...`);
      
      // 使用 Unsplash API 獲取高質量圖片
      const unsplashUrl = `https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400&h=400&fit=crop&auto=format&q=80`;
      
      const response = await axios.get(unsplashUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const fileName = `${productId}.jpg`;
      const filePath = path.join(this.outputDir, fileName);

      // 使用 sharp 處理和調整圖片
      await sharp(response.data)
        .resize(400, 400, { fit: 'cover' })
        .jpeg({ quality: 85 })
        .toFile(filePath);

      console.log(`✅ 圖片已儲存: ${fileName}`);
      return `/images/products/doterra/${fileName}`;
    } catch (error) {
      console.error(`下載圖片失敗 ${imageKeyword}:`, error);
      return '/images/placeholder.jpg';
    }
  }

  private convertToProduct(sampleData: SampleProductData, localImagePath: string): Product {
    const productId = this.generateProductId(sampleData.name);
    
    return {
      id: `doterra-${productId}`,
      name: sampleData.name,
      englishName: sampleData.englishName,
      description: sampleData.description,
      benefits: sampleData.benefits,
      category: sampleData.category,
      volume: sampleData.volume,
      imageUrl: localImagePath,
      inStock: true,
      ingredients: sampleData.ingredients,
      tags: sampleData.tags,
      isBestseller: ['薰衣草', '薄荷', '檸檬', 'On Guard'].some(keyword => 
        sampleData.name.includes(keyword)
      ),
      isNew: ['Balance', 'PastTense'].some(keyword => 
        sampleData.name.includes(keyword)
      )
    };
  }

  public async generateSampleData(): Promise<Product[]> {
    console.log('🌿 開始生成 doTERRA 樣本產品資料...');
    
    const products: Product[] = [];
    
    for (let i = 0; i < this.sampleProducts.length; i++) {
      const sampleData = this.sampleProducts[i];
      const productId = this.generateProductId(sampleData.name);
      
      console.log(`處理產品 ${i + 1}/${this.sampleProducts.length}: ${sampleData.name}`);
      
      // 為每個產品下載一個占位圖片
      const localImagePath = await this.downloadPlaceholderImage(
        sampleData.imageKeyword, 
        productId
      );
      
      const product = this.convertToProduct(sampleData, localImagePath);
      products.push(product);
      
      // 避免過於頻繁的請求
      if (i < this.sampleProducts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // 儲存產品資料
    const outputPath = path.join(this.dataDir, 'doterra-real-products.json');
    fs.writeFileSync(outputPath, JSON.stringify(products, null, 2), 'utf-8');
    
    console.log(`✅ 成功生成 ${products.length} 個 doTERRA 樣本產品`);
    console.log(`📁 產品資料已儲存至: ${outputPath}`);
    console.log(`🖼️  產品圖片已儲存至: ${this.outputDir}`);
    
    return products;
  }
}

// 主執行函數
async function main() {
  try {
    const generator = new SampleDataGenerator();
    const products = await generator.generateSampleData();
    
    console.log('\n=== 樣本資料生成結果 ===');
    console.log(`總共生成 ${products.length} 個產品`);
    
    const categoryCounts = products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\n📊 產品類別分佈:');
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} 個產品`);
    });
    
    console.log('\n🏆 特色產品:');
    const bestsellers = products.filter(p => p.isBestseller);
    const newProducts = products.filter(p => p.isNew);
    
    console.log(`  暢銷產品: ${bestsellers.length} 個`);
    console.log(`  新品: ${newProducts.length} 個`);
    
  } catch (error) {
    console.error('生成樣本資料失敗:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { SampleDataGenerator };