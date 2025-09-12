#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { Oil } from '../src/types/oil';

/**
 * 為現有的保衛系列產品添加 collections 標記
 */
function addOnGuardCollections() {
  const filePath = 'src/data/products/proprietary-blends.json';
  
  try {
    // 讀取現有資料
    const data: Oil[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    let updatedCount = 0;
    
    // 更新保衛系列產品
    const updatedData = data.map(product => {
      if (product.name.includes('保衛') || product.englishName?.toLowerCase().includes('on guard')) {
        console.log(`🔄 更新產品: ${product.name}`);
        updatedCount++;
        
        return {
          ...product,
          collections: ['onguard'],
          tags: [...new Set([
            ...(product.tags || []),
            'OnGuard系列',
            '保衛系列'
          ])]
        };
      }
      return product;
    });
    
    // 寫入更新後的資料
    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2), 'utf-8');
    
    console.log(`✅ 成功更新 ${updatedCount} 個產品的 collections 標記`);
    console.log(`📄 已更新檔案: ${filePath}`);
    
  } catch (error) {
    console.error('❌ 更新過程中發生錯誤:', error);
  }
}

// 執行更新
if (require.main === module) {
  console.log('🛡️ 開始為現有保衛產品添加 collections 標記...\n');
  addOnGuardCollections();
}

export default addOnGuardCollections;