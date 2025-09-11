#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function validateDataConsistency() {
  console.log('🔍 doTERRA 產品資料結構一致性驗證報告');
  console.log('═════════════════════════════════════════════════');
  console.log(`驗證時間: ${new Date().toLocaleString('zh-TW')}\n`);

  const dataPath = path.join(process.cwd(), 'src/data/doterra-real-products.json');
  const products = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  // 定義完整的欄位列表
  const allRequiredFields = [
    // 基本資訊
    'id', 'name', 'englishName', 'description', 'benefits', 'category', 
    'volume', 'imageUrl', 'inStock', 'tags',
    
    // 產品特性 (核心欄位)
    'mainBenefits', 'aromaDescription', 'extractionMethod', 'plantPart', 
    'mainIngredients', 'usageInstructions', 'cautions',
    
    // 商業資訊
    'retailPrice', 'memberPrice', 'pvPoints', 'productCode',
    
    // 詳細資訊
    'detailedDescription', 'productUrl'
  ];

  console.log('📊 資料結構一致性分析:');
  console.log('─────────────────────────────────');
  
  let allConsistent = true;
  const inconsistentProducts = [];

  // 檢查每個欄位在所有產品中的存在性
  allRequiredFields.forEach(field => {
    const presentCount = products.filter(p => {
      const hasField = field in p;
      const notNull = p[field] !== null && p[field] !== undefined;
      const notEmpty = Array.isArray(p[field]) ? p[field].length > 0 : 
                       typeof p[field] === 'string' ? p[field].trim() !== '' : true;
      return hasField && notNull && notEmpty;
    }).length;
    
    const percentage = ((presentCount / products.length) * 100).toFixed(1);
    const status = percentage === '100.0' ? '✅' : '⚠️ ';
    
    if (percentage !== '100.0') {
      allConsistent = false;
      const missingProducts = products.filter(p => {
        const hasField = field in p;
        const notNull = p[field] !== null && p[field] !== undefined;
        const notEmpty = Array.isArray(p[field]) ? p[field].length > 0 : 
                         typeof p[field] === 'string' ? p[field].trim() !== '' : true;
        return !(hasField && notNull && notEmpty);
      }).map(p => p.name);
      
      inconsistentProducts.push({ field, missing: missingProducts });
    }
    
    console.log(`${status}${field.padEnd(20)}: ${presentCount.toString().padStart(2)}/${products.length} (${percentage.padStart(5)}%)`);
  });

  console.log('\n🎯 資料結構評估:');
  console.log('─────────────────────────────────');
  
  if (allConsistent) {
    console.log('🎉 完美！所有 74 個產品都具有完全一致的資料結構！');
    console.log('✅ 每個產品都包含所有必要欄位');
    console.log('✅ 沒有空值或缺失的資料');
    console.log('✅ 資料結構標準化 100% 完成');
  } else {
    console.log(`⚠️  發現 ${inconsistentProducts.length} 個欄位有不一致問題`);
    
    console.log('\n📋 不一致欄位詳情:');
    inconsistentProducts.forEach(({ field, missing }) => {
      console.log(`\n欄位: ${field}`);
      console.log(`缺失產品數: ${missing.length}`);
      if (missing.length <= 5) {
        console.log(`產品名稱: ${missing.join(', ')}`);
      } else {
        console.log(`前5個產品: ${missing.slice(0, 5).join(', ')}...`);
      }
    });
  }

  // 特別檢查呵護系列
  console.log('\n🌿 呵護系列產品專項檢查:');
  console.log('─────────────────────────────────');
  
  const touchSeries = products.filter(p => p.name.includes('呵護系列'));
  console.log(`呵護系列產品總數: ${touchSeries.length}`);
  
  const touchComplete = touchSeries.filter(p => 
    allRequiredFields.every(field => {
      const hasField = field in p;
      const notNull = p[field] !== null && p[field] !== undefined;
      const notEmpty = Array.isArray(p[field]) ? p[field].length > 0 : 
                       typeof p[field] === 'string' ? p[field].trim() !== '' : true;
      return hasField && notNull && notEmpty;
    })
  ).length;
  
  const touchPercentage = ((touchComplete / touchSeries.length) * 100).toFixed(1);
  console.log(`完整資料結構: ${touchComplete}/${touchSeries.length} (${touchPercentage}%)`);
  
  if (touchPercentage === '100.0') {
    console.log('✅ 所有呵護系列產品資料結構完整');
  } else {
    console.log('⚠️  部分呵護系列產品資料結構需要完善');
  }

  // 資料品質總評
  console.log('\n📈 資料品質總評:');
  console.log('─────────────────────────────────');
  
  const overallScore = allRequiredFields.reduce((total, field) => {
    const presentCount = products.filter(p => {
      const hasField = field in p;
      const notNull = p[field] !== null && p[field] !== undefined;
      const notEmpty = Array.isArray(p[field]) ? p[field].length > 0 : 
                       typeof p[field] === 'string' ? p[field].trim() !== '' : true;
      return hasField && notNull && notEmpty;
    }).length;
    return total + (presentCount / products.length);
  }, 0) / allRequiredFields.length;
  
  const finalScore = (overallScore * 100).toFixed(1);
  
  console.log(`整體完整度: ${finalScore}%`);
  
  if (finalScore >= '95.0') {
    console.log('🏆 優秀！資料品質達到生產標準');
  } else if (finalScore >= '90.0') {
    console.log('✅ 良好！資料品質符合要求');
  } else if (finalScore >= '80.0') {
    console.log('⚠️  合格！但建議持續改善');
  } else {
    console.log('❌ 需要改善！資料品質低於標準');
  }
  
  console.log('\n🔧 建議行動:');
  if (allConsistent) {
    console.log('✨ 資料結構已達到最佳狀態，建議：');
    console.log('  • 定期執行此驗證腳本以維護品質');
    console.log('  • 為新產品使用相同的資料結構標準');
    console.log('  • 考慮建立資料品質監控機制');
  } else {
    console.log('🛠️  建議執行以下操作來改善一致性：');
    console.log('  • 運行 standardize-data-structure.ts 腳本');
    console.log('  • 檢查並完善缺失的資料欄位');
    console.log('  • 驗證資料類型和格式的正確性');
  }

  console.log('\n════════════════════════════════════════════════════');
  console.log(`驗證完成 ${allConsistent ? '✅' : '⚠️'}`);
}

validateDataConsistency();