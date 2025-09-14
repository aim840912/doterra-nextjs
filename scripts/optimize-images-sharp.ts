import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'

const IMAGES_DIR = path.join(process.cwd(), 'docs', 'images')
const TARGET_SIZE = 500 * 1024 // 500KB
const MAX_WIDTH = 1280
const MAX_HEIGHT = 800

interface OptimizeOptions {
  quality: number
  maxWidth: number
  maxHeight: number
}

interface ImageInfo {
  name: string
  originalSize: number
  optimizedSize: number
  compressionRatio: number
  dimensions: { width: number; height: number }
}

async function getFileSize(filePath: string): Promise<number> {
  const stats = await fs.stat(filePath)
  return stats.size
}

async function optimizeImage(
  inputPath: string,
  outputPath: string,
  options: OptimizeOptions
): Promise<{ size: number; width: number; height: number }> {
  try {
    const image = sharp(inputPath)
    const metadata = await image.metadata()

    let processedImage = image

    // 調整尺寸（如果需要）
    if (metadata.width && metadata.height) {
      if (metadata.width > options.maxWidth || metadata.height > options.maxHeight) {
        processedImage = processedImage.resize(options.maxWidth, options.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
      }
    }

    // 壓縮並輸出
    await processedImage
      .png({
        quality: options.quality,
        compressionLevel: 9, // 最高壓縮等級
        progressive: true
      })
      .toFile(outputPath)

    const optimizedMetadata = await sharp(outputPath).metadata()
    const size = await getFileSize(outputPath)

    return {
      size,
      width: optimizedMetadata.width || 0,
      height: optimizedMetadata.height || 0
    }
  } catch (error) {
    console.error(`優化失敗 ${inputPath}:`, error)
    throw error
  }
}

async function optimizeAllImages(): Promise<void> {
  console.log('🎨 使用 Sharp 優化圖片...\n')

  try {
    const files = await fs.readdir(IMAGES_DIR)
    const imageFiles = files.filter(file => file.endsWith('.png'))

    if (imageFiles.length === 0) {
      console.log('❌ 未找到 PNG 圖片檔案')
      return
    }

    const results: ImageInfo[] = []
    let totalOriginalSize = 0
    let totalOptimizedSize = 0

    // 不同品質級別的嘗試
    const qualityLevels = [80, 70, 60, 50]

    for (const filename of imageFiles) {
      const inputPath = path.join(IMAGES_DIR, filename)
      const originalSize = await getFileSize(inputPath)
      totalOriginalSize += originalSize

      console.log(`📸 處理: ${filename}`)
      console.log(`   原始大小: ${(originalSize / 1024).toFixed(1)}KB`)

      let bestResult: { size: number; width: number; height: number } | null = null
      let bestQuality = 100

      // 如果檔案過大，嘗試不同品質設定
      if (originalSize > TARGET_SIZE) {
        console.log(`   🔍 檔案過大，嘗試優化...`)

        for (const quality of qualityLevels) {
          const tempPath = path.join(IMAGES_DIR, `temp_${filename}`)

          try {
            const result = await optimizeImage(inputPath, tempPath, {
              quality,
              maxWidth: MAX_WIDTH,
              maxHeight: MAX_HEIGHT
            })

            console.log(`     品質 ${quality}%: ${(result.size / 1024).toFixed(1)}KB`)

            if (result.size <= TARGET_SIZE || quality === qualityLevels[qualityLevels.length - 1]) {
              bestResult = result
              bestQuality = quality
              break
            } else {
              // 刪除臨時檔案
              await fs.unlink(tempPath)
            }
          } catch (error) {
            console.error(`     品質 ${quality}% 失敗:`, error)
            try {
              await fs.unlink(tempPath)
            } catch {}
          }
        }

        if (bestResult) {
          // 將最佳結果移動為最終檔案
          const tempPath = path.join(IMAGES_DIR, `temp_${filename}`)
          await fs.rename(tempPath, inputPath)

          const compressionRatio = ((originalSize - bestResult.size) / originalSize) * 100
          console.log(`   ✅ 優化完成: ${(bestResult.size / 1024).toFixed(1)}KB (品質: ${bestQuality}%, -${compressionRatio.toFixed(1)}%)`)

          results.push({
            name: filename,
            originalSize,
            optimizedSize: bestResult.size,
            compressionRatio,
            dimensions: { width: bestResult.width, height: bestResult.height }
          })

          totalOptimizedSize += bestResult.size
        } else {
          console.log(`   ❌ 無法優化到目標大小`)
          results.push({
            name: filename,
            originalSize,
            optimizedSize: originalSize,
            compressionRatio: 0,
            dimensions: { width: 0, height: 0 }
          })

          totalOptimizedSize += originalSize
        }
      } else {
        console.log(`   ✅ 檔案大小適中，無需優化`)
        const metadata = await sharp(inputPath).metadata()

        results.push({
          name: filename,
          originalSize,
          optimizedSize: originalSize,
          compressionRatio: 0,
          dimensions: { width: metadata.width || 0, height: metadata.height || 0 }
        })

        totalOptimizedSize += originalSize
      }

      console.log('')
    }

    // 生成詳細報告
    console.log('📊 優化報告')
    console.log('='.repeat(60))

    for (const result of results) {
      const status = result.compressionRatio > 0 ? '📉 優化' : '✅ 保持'
      console.log(`${status} ${result.name}`)
      console.log(`   尺寸: ${result.dimensions.width}×${result.dimensions.height}`)
      console.log(`   原始: ${(result.originalSize / 1024).toFixed(1)}KB`)
      console.log(`   最終: ${(result.optimizedSize / 1024).toFixed(1)}KB`)

      if (result.compressionRatio > 0) {
        console.log(`   節省: ${result.compressionRatio.toFixed(1)}%`)
      }

      const isOversize = result.optimizedSize > TARGET_SIZE
      if (isOversize) {
        console.log(`   ⚠️  仍超過建議大小 (${(TARGET_SIZE / 1024).toFixed(0)}KB)`)
      }

      console.log('')
    }

    // 總結
    const totalReduction = ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) * 100
    console.log('🎉 總體結果')
    console.log(`   原始總大小: ${(totalOriginalSize / 1024 / 1024).toFixed(2)}MB`)
    console.log(`   優化總大小: ${(totalOptimizedSize / 1024 / 1024).toFixed(2)}MB`)
    console.log(`   總計節省: ${totalReduction.toFixed(1)}%`)
    console.log(`   節省空間: ${((totalOriginalSize - totalOptimizedSize) / 1024 / 1024).toFixed(2)}MB`)

    // 檢查仍然過大的檔案
    const oversizedFiles = results.filter(r => r.optimizedSize > TARGET_SIZE)
    if (oversizedFiles.length > 0) {
      console.log(`\n⚠️  ${oversizedFiles.length} 個檔案仍超過建議大小:`)
      for (const file of oversizedFiles) {
        console.log(`   - ${file.name}: ${(file.optimizedSize / 1024).toFixed(1)}KB`)
      }
    } else {
      console.log(`\n🎯 所有檔案都在建議大小範圍內！`)
    }

  } catch (error) {
    console.error('❌ 優化過程發生錯誤:', error)
  }
}

async function main() {
  console.log('🖼️  Sharp 圖片優化工具\n')
  await optimizeAllImages()
}

if (require.main === module) {
  main().catch(console.error)
}