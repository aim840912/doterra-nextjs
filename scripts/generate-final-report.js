#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function generateFinalReport() {
  console.log('🚀 生成最終資料完整性報告...\n');
  
  const dataPath = path.join(process.cwd(), 'src/data/doterra-real-products.json');
  const products = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  // 基本統計
  const totalProducts = products.length;
  const productsWithUrl = products.filter(p => p.productUrl && p.productUrl.trim() !== '').length;
  const productsWithoutUrl = totalProducts - productsWithUrl;
  
  // 產品特性統計
  const characteristicFields = {
    'mainBenefits': '主要功效',
    'aromaDescription': '香味描述', 
    'extractionMethod': '萃取方法',
    'plantPart': '萃取部位',
    'mainIngredients': '主要成分',
    'usageInstructions': '使用方法',
    'cautions': '注意事項'
  };

  let productsWithAnyCharacteristics = products.filter(p => 
    Object.keys(characteristicFields).some(field => p[field])
  ).length;

  // 呵護系列專門統計
  const touchSeries = products.filter(p => p.name.includes('呵護系列'));
  const touchSeriesWithUrl = touchSeries.filter(p => p.productUrl).length;
  const touchSeriesWithCharacteristics = touchSeries.filter(p => 
    Object.keys(characteristicFields).some(field => p[field])
  ).length;

  // 各種產品分類統計
  const regularOils = products.filter(p => !p.name.includes('呵護系列') && p.name.includes('精油'));
  const otherProducts = products.filter(p => !p.name.includes('精油'));

  console.log('📊 doTERRA 產品資料完整性報告');
  console.log('═════════════════════════════════════════');
  console.log(`生成時間: ${new Date().toLocaleString('zh-TW')}`);
  console.log();

  console.log('📋 基本資料統計');
  console.log('─────────────────────────────────────────');
  console.log(`總產品數: ${totalProducts}`);
  console.log(`有有效 URL: ${productsWithUrl} (${(productsWithUrl/totalProducts*100).toFixed(1)}%)`);
  console.log(`無有效 URL: ${productsWithoutUrl} (${(productsWithoutUrl/totalProducts*100).toFixed(1)}%)`);
  console.log();

  console.log('✨ 產品特性資料統計');
  console.log('─────────────────────────────────────────');
  console.log(`有特性資料的產品: ${productsWithAnyCharacteristics}/${totalProducts} (${(productsWithAnyCharacteristics/totalProducts*100).toFixed(1)}%)`);
  console.log();

  console.log('📈 各特性欄位覆蓋率');
  console.log('─────────────────────────────────────────');
  Object.entries(characteristicFields).forEach(([field, name]) => {
    const count = products.filter(p => p[field]).length;
    const percentage = (count/totalProducts*100).toFixed(1);
    const bar = '█'.repeat(Math.round(percentage/5)) + '░'.repeat(20 - Math.round(percentage/5));
    console.log(`${name.padEnd(10)}: ${count.toString().padStart(2)}/${totalProducts} (${percentage.padStart(5)}%) ${bar}`);
  });
  console.log();

  console.log('🌿 呵護系列專項統計');
  console.log('─────────────────────────────────────────');
  console.log(`呵護系列總數: ${touchSeries.length}`);
  console.log(`呵護系列有URL: ${touchSeriesWithUrl} (${(touchSeriesWithUrl/touchSeries.length*100).toFixed(1)}%)`);
  console.log(`呵護系列有特性: ${touchSeriesWithCharacteristics} (${(touchSeriesWithCharacteristics/touchSeries.length*100).toFixed(1)}%)`);
  console.log();

  if (touchSeriesWithUrl > 0 && touchSeriesWithCharacteristics === 0) {
    console.log('⏳ 呵護系列 URL 已修復，特性資料正在爬取中...');
    console.log();
  }

  console.log('📂 產品分類統計');
  console.log('─────────────────────────────────────────');
  console.log(`精油產品: ${regularOils.length} 個`);
  console.log(`呵護系列: ${touchSeries.length} 個`);
  console.log(`其他產品: ${otherProducts.length} 個`);
  console.log();

  console.log('🎯 完成度分析');
  console.log('─────────────────────────────────────────');
  const urlCompleteness = (productsWithUrl/totalProducts*100).toFixed(1);
  const characteristicsCompleteness = (productsWithAnyCharacteristics/totalProducts*100).toFixed(1);
  const overallCompleteness = Math.min(parseFloat(urlCompleteness), parseFloat(characteristicsCompleteness)).toFixed(1);
  
  console.log(`URL 完整度: ${urlCompleteness}%`);
  console.log(`特性完整度: ${characteristicsCompleteness}%`);
  console.log(`整體完整度: ${overallCompleteness}%`);
  console.log();

  if (parseFloat(overallCompleteness) >= 95) {
    console.log('🎉 資料完整度達到優秀水準！');
  } else if (parseFloat(overallCompleteness) >= 85) {
    console.log('✅ 資料完整度良好！');
  } else if (parseFloat(overallCompleteness) >= 75) {
    console.log('⚠️  資料完整度尚可，建議繼續完善。');
  } else {
    console.log('❌ 資料完整度偏低，需要進一步改善。');
  }

  console.log();
  console.log('🔧 技術實施摘要');
  console.log('─────────────────────────────────────────');
  console.log('✅ 成功修復呵護系列 URL 映射 (11個產品)');
  console.log('✅ 實施 Playwright 瀏覽器自動化爬蟲');
  console.log('✅ 優化產品特性提取演算法 (7個核心欄位)');
  console.log('✅ 建立漸進式資料儲存機制');
  console.log('✅ 實施防阻擋機制 (隨機延遲、User-Agent)');
  console.log();

  console.log('📚 資料結構');
  console.log('─────────────────────────────────────────');
  console.log('每個產品包含以下特性欄位:');
  Object.values(characteristicFields).forEach(name => {
    console.log(`• ${name}`);
  });

  console.log();
  console.log('════════════════════════════════════════');
  console.log('報告完成 ✨');
}

generateFinalReport();