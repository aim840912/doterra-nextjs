Failed to compile.
./scripts/analyze-missing-data.ts:45:42
Type error: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type 'Product'.
  No index signature with a parameter of type 'string' was found on type 'Product'.
  43 |     console.log('\n📈 各欄位覆蓋率:');
  44 |     fields.forEach(field => {
> 45 |       const count = products.filter(p => p[field.name] !== undefined && p[field.name] !== null).length;
     |                                          ^
  46 |       const percentage = ((count / total) * 100).toFixed(1);
  47 |       console.log(`  ${field.label}: ${count}/${total} (${percentage}%)`);
  48 |     });
Next.js build worker exited with code: 1 and signal: null
Error: Command "npm run build" exited with 1
