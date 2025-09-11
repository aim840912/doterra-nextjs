#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const dataPath = path.join(process.cwd(), 'src/data/doterra-real-products.json');
const products = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

let totalProducts = products.length;
let productsWithUrl = products.filter(p => p.productUrl && p.productUrl.trim() !== '').length;
let productsWithCharacteristics = products.filter(p => 
  p.mainBenefits || p.aromaDescription || p.extractionMethod || 
  p.plantPart || p.mainIngredients || p.usageInstructions || p.cautions
).length;

let touchSeriesProducts = products.filter(p => p.name.includes('呵護系列')).length;
let touchSeriesWithUrl = products.filter(p => p.name.includes('呵護系列') && p.productUrl).length;
let touchSeriesWithCharacteristics = products.filter(p => 
  p.name.includes('呵護系列') && (
    p.mainBenefits || p.aromaDescription || p.extractionMethod || 
    p.plantPart || p.mainIngredients || p.usageInstructions || p.cautions
  )
).length;

console.log('📊 目前資料狀態統計:');
console.log('═══════════════════════');
console.log('📋 總產品數:', totalProducts);
console.log('🔗 有有效 URL 的產品:', productsWithUrl);
console.log('✨ 有產品特性的產品:', productsWithCharacteristics);
console.log('📈 特性資料覆蓋率:', (productsWithCharacteristics/totalProducts*100).toFixed(1) + '%');
console.log('');
console.log('🌿 呵護系列統計:');
console.log('───────────────────────');
console.log('📋 呵護系列總數:', touchSeriesProducts);
console.log('🔗 呵護系列有 URL:', touchSeriesWithUrl);
console.log('✨ 呵護系列有特性:', touchSeriesWithCharacteristics);
console.log('📈 呵護系列完整度:', touchSeriesWithUrl > 0 ? (touchSeriesWithCharacteristics/touchSeriesWithUrl*100).toFixed(1) + '%' : '0%');

console.log('');
console.log('🎯 詳細統計:');
console.log('───────────────────────');

const characteristicFields = {
  'mainBenefits': '主要功效',
  'aromaDescription': '香味描述', 
  'extractionMethod': '萃取方法',
  'plantPart': '萃取部位',
  'mainIngredients': '主要成分',
  'usageInstructions': '使用方法',
  'cautions': '注意事項'
};

Object.entries(characteristicFields).forEach(([field, name]) => {
  const count = products.filter(p => p[field]).length;
  const percentage = (count/totalProducts*100).toFixed(1);
  console.log(`${name}: ${count}/${totalProducts} (${percentage}%)`);
});