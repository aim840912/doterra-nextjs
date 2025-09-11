#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';

interface Product {
  id: string;
  name: string;
  productUrl?: string;
  retailPrice?: number;
  memberPrice?: number;
  productCode?: string;
  pvPoints?: number;
  detailedDescription?: string;
}

class DataAnalyzer {
  private dataPath = path.join(process.cwd(), 'src/data/doterra-real-products.json');

  private loadProducts(): Product[] {
    const data = fs.readFileSync(this.dataPath, 'utf-8');
    return JSON.parse(data);
  }

  public analyzeData(): void {
    console.log('🔍 分析產品資料完整性...\n');
    
    const products = this.loadProducts();
    const total = products.length;
    
    console.log(`📊 總產品數: ${total}`);
    
    // 統計各欄位的覆蓋率
    const fields = [
      { name: 'productUrl', label: 'URL 連結' },
      { name: 'retailPrice', label: '建議售價' },
      { name: 'memberPrice', label: '會員價' },
      { name: 'productCode', label: '產品編號' },
      { name: 'pvPoints', label: 'PV點數' },
      { name: 'detailedDescription', label: '詳細描述' }
    ];

    console.log('\n📈 各欄位覆蓋率:');
    fields.forEach(field => {
      const count = products.filter(p => p[field.name] !== undefined && p[field.name] !== null).length;
      const percentage = ((count / total) * 100).toFixed(1);
      console.log(`  ${field.label}: ${count}/${total} (${percentage}%)`);
    });

    // 找出缺失資料的產品
    console.log('\n❌ 缺失資料的產品:');
    
    const missingUrl = products.filter(p => !p.productUrl);
    const missingPrice = products.filter(p => !p.retailPrice);
    
    console.log(`\n🔗 沒有 URL 的產品 (${missingUrl.length}個):`);
    missingUrl.forEach(p => console.log(`  - ${p.name}`));
    
    console.log(`\n💰 沒有價格資訊的產品 (${missingPrice.length}個):`);
    missingPrice.forEach(p => console.log(`  - ${p.name} ${p.productUrl ? '(有URL)' : '(無URL)'}`));

    // 完整資料產品
    const completeProducts = products.filter(p => 
      p.productUrl && p.retailPrice && p.memberPrice && p.productCode && p.pvPoints
    );
    
    console.log(`\n✅ 完整資料產品: ${completeProducts.length}/${total} (${((completeProducts.length/total)*100).toFixed(1)}%)`);
    
    // 分析失敗原因
    console.log('\n🔍 失敗原因分析:');
    const hasUrlNoPrice = products.filter(p => p.productUrl && !p.retailPrice);
    const noUrlNoPrice = products.filter(p => !p.productUrl && !p.retailPrice);
    
    console.log(`  - 有URL但無價格: ${hasUrlNoPrice.length}個`);
    console.log(`  - 無URL也無價格: ${noUrlNoPrice.length}個`);
    
    if (hasUrlNoPrice.length > 0) {
      console.log('\n  有URL但無價格的產品:');
      hasUrlNoPrice.slice(0, 5).forEach(p => console.log(`    - ${p.name}: ${p.productUrl}`));
    }
  }
}

const analyzer = new DataAnalyzer();
analyzer.analyzeData();