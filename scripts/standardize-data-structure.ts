#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';

interface Product {
  id: string;
  name: string;
  englishName: string;
  description: string;
  benefits: string[];
  category: string;
  volume: string;
  imageUrl: string;
  isNew?: boolean;
  isBestseller?: boolean;
  inStock: boolean;
  usageInstructions?: string;
  ingredients?: string[];
  tags: string[];
  
  // 詳細資訊欄位
  detailedDescription?: string;
  mainBenefits?: string[];
  aromaDescription?: string;
  extractionMethod?: string;
  plantPart?: string;
  mainIngredients?: string[];
  cautions?: string[];
  
  // 商業資訊欄位
  specifications?: string;
  productCode?: string;
  retailPrice?: number;
  memberPrice?: number;
  pvPoints?: number;
  
  // 額外欄位
  productUrl?: string;
  localImagePath?: string;
  rating?: number;
  brand?: string;
  [key: string]: any;
}

class DataStructureStandardizer {
  private dataPath = path.join(process.cwd(), 'src/data/doterra-real-products.json');

  private loadProducts(): Product[] {
    const data = fs.readFileSync(this.dataPath, 'utf-8');
    return JSON.parse(data);
  }

  private saveProducts(products: Product[]): void {
    fs.writeFileSync(this.dataPath, JSON.stringify(products, null, 2), 'utf-8');
    console.log('✅ 產品資料已儲存');
  }

  // 定義所有必要的欄位及其預設值
  private getRequiredFields(): Record<string, any> {
    return {
      // 基本資訊欄位
      id: '',
      name: '',
      englishName: '',
      description: '',
      benefits: [],
      category: '',
      volume: '',
      imageUrl: '',
      isNew: false,
      isBestseller: false,
      inStock: true,
      usageInstructions: '',
      ingredients: [],
      tags: [],
      
      // 詳細資訊欄位
      detailedDescription: '',
      mainBenefits: [],
      aromaDescription: '',
      extractionMethod: '',
      plantPart: '',
      mainIngredients: [],
      cautions: [],
      
      // 商業資訊欄位
      specifications: '',
      productCode: '',
      retailPrice: 0,
      memberPrice: 0,
      pvPoints: 0,
      
      // 額外欄位
      productUrl: '',
      localImagePath: '',
      rating: 4.5,
      brand: 'doTERRA'
    };
  }

  // 為呵護系列產品生成合理的預設特性
  private generateTouchSeriesDefaults(productName: string): Partial<Product> {
    const oilName = productName.replace('呵護系列', '').replace(/[-\s]/g, '').trim();
    
    return {
      mainBenefits: [
        '已稀釋調配，可安全直接使用於肌膚',
        '便攜設計，隨時隨地使用',
        '適合精油初學者使用'
      ],
      aromaDescription: `溫和的${oilName.replace('精油', '')}香氣`,
      extractionMethod: '已稀釋調配（分餾椰子油為基底）',
      plantPart: '依原精油萃取部位',
      mainIngredients: [
        oilName,
        '分餾椰子油（基底油）'
      ],
      usageInstructions: '可直接塗抹於肌膚，無需額外稀釋。適用於脈搏點或需要的部位。',
      cautions: [
        '僅供外用',
        '避免接觸眼睛',
        '如有不適請停止使用',
        '請放置於兒童無法拿取處'
      ]
    };
  }

  // 為一般產品生成合理的預設特性
  private generateGeneralDefaults(productName: string): Partial<Product> {
    const isOil = productName.includes('精油');
    
    if (isOil) {
      return {
        mainBenefits: [
          'CPTG®專業純正調理級認證',
          '100%純天然精油',
          '多種用途，適合日常保養'
        ],
        aromaDescription: '天然純淨的芳香',
        extractionMethod: '蒸氣蒸餾法',
        plantPart: '植物精華部位',
        mainIngredients: [
          `${productName.replace('精油', '')}純精油`
        ],
        usageInstructions: '芳香使用：滴入擴香器。局部使用：請先以分餾椰子油稀釋。',
        cautions: [
          '可能導致肌膚敏感',
          '請放置在兒童無法拿取處',
          '懷孕、哺乳或接受治療者，請先諮詢醫師',
          '避免接觸眼睛、耳內和敏感部位',
          '使用前請先稀釋'
        ]
      };
    }

    // 非精油產品
    return {
      mainBenefits: [
        'doTERRA高品質產品',
        '天然純淨成分',
        '適合日常使用'
      ],
      aromaDescription: '天然清香',
      extractionMethod: '專業製程',
      plantPart: '優質原料',
      mainIngredients: [
        '天然植物成分'
      ],
      usageInstructions: '依據產品標示使用。',
      cautions: [
        '僅供外用',
        '請放置在兒童無法拿取處',
        '如有不適請停止使用'
      ]
    };
  }

  public standardizeDataStructure(): void {
    console.log('🚀 開始資料結構標準化...\n');
    
    const products = this.loadProducts();
    const requiredFields = this.getRequiredFields();
    let updatedCount = 0;
    let addedFieldsCount = 0;

    console.log(`📋 總產品數: ${products.length}`);

    products.forEach((product, index) => {
      let wasUpdated = false;

      // 檢查並添加缺失的欄位
      Object.keys(requiredFields).forEach(field => {
        if (!(field in product)) {
          product[field] = requiredFields[field];
          addedFieldsCount++;
          wasUpdated = true;
        } else if (product[field] === null || product[field] === undefined) {
          product[field] = requiredFields[field];
          addedFieldsCount++;
          wasUpdated = true;
        }
      });

      // 特別處理產品特性欄位缺失的情況
      const characteristicFields = ['mainBenefits', 'aromaDescription', 'extractionMethod', 'plantPart', 'mainIngredients', 'usageInstructions', 'cautions'];
      const missingCharacteristics = characteristicFields.filter(field => 
        !product[field] || 
        (Array.isArray(product[field]) && product[field].length === 0) ||
        (typeof product[field] === 'string' && product[field].trim() === '')
      );

      if (missingCharacteristics.length > 0) {
        console.log(`\n🔧 修復 "${product.name}" 的特性資料:`);
        
        let defaults: Partial<Product>;
        if (product.name.includes('呵護系列')) {
          defaults = this.generateTouchSeriesDefaults(product.name);
          console.log('   使用呵護系列預設值');
        } else {
          defaults = this.generateGeneralDefaults(product.name);
          console.log('   使用一般產品預設值');
        }

        missingCharacteristics.forEach(field => {
          if (defaults[field as keyof Product]) {
            product[field] = defaults[field as keyof Product];
            console.log(`   ✓ 添加 ${field}`);
            wasUpdated = true;
          }
        });
      }

      if (wasUpdated) {
        updatedCount++;
      }
    });

    this.saveProducts(products);

    console.log(`\n🎉 資料結構標準化完成！`);
    console.log(`📊 統計:`);
    console.log(`   - 更新的產品: ${updatedCount} 個`);
    console.log(`   - 添加的欄位: ${addedFieldsCount} 個`);
    console.log(`   - 總產品數: ${products.length} 個`);

    // 驗證結果
    this.validateDataStructure();
  }

  private validateDataStructure(): void {
    console.log('\n🔍 資料結構驗證:');
    console.log('════════════════════════');

    const products = this.loadProducts();
    const requiredFields = Object.keys(this.getRequiredFields());
    const characteristicFields = ['mainBenefits', 'aromaDescription', 'extractionMethod', 'plantPart', 'mainIngredients', 'usageInstructions', 'cautions'];

    let allFieldsPresent = true;

    // 驗證必要欄位
    requiredFields.forEach(field => {
      const count = products.filter(p => field in p && p[field] !== null && p[field] !== undefined).length;
      const percentage = ((count / products.length) * 100).toFixed(1);
      const status = percentage === '100.0' ? '✅' : '❌';
      
      if (percentage !== '100.0') allFieldsPresent = false;
      
      console.log(`${status} ${field}: ${count}/${products.length} (${percentage}%)`);
    });

    console.log('\n📊 產品特性欄位統計:');
    characteristicFields.forEach(field => {
      const completeCount = products.filter(p => {
        const value = p[field];
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'string') return value.trim().length > 0;
        return value != null;
      }).length;
      
      const percentage = ((completeCount / products.length) * 100).toFixed(1);
      const status = percentage === '100.0' ? '✅' : '⚠️';
      
      console.log(`${status} ${field}: ${completeCount}/${products.length} (${percentage}%)`);
    });

    if (allFieldsPresent) {
      console.log('\n🎯 所有必要欄位都已完整！');
    } else {
      console.log('\n⚠️ 仍有欄位需要處理');
    }
  }
}

// 主執行函數
async function main() {
  const standardizer = new DataStructureStandardizer();
  
  try {
    await standardizer.standardizeDataStructure();
  } catch (error) {
    console.error('❌ 執行失敗:', error);
    process.exit(1);
  }
}

// 如果是直接執行此腳本
if (require.main === module) {
  main();
}

export { DataStructureStandardizer };