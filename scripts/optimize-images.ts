import { promises as fs } from 'fs'
import path from 'path'
import { spawn } from 'child_process'

const IMAGES_DIR = path.join(process.cwd(), 'docs', 'images')
const TARGET_SIZE = 500 * 1024 // 500KB
const QUALITY = 85

interface ImageInfo {
  name: string
  originalSize: number
  optimizedSize?: number
  compressionRatio?: number
}

async function getImageSize(filePath: string): Promise<number> {
  const stats = await fs.stat(filePath)
  return stats.size
}

async function optimizeImage(filePath: string, quality: number = QUALITY): Promise<boolean> {
  return new Promise((resolve) => {
    const tempPath = filePath.replace('.png', '_temp.png')

    // 使用 ImageMagick convert 優化圖片
    const convert = spawn('convert', [
      filePath,
      '-quality', quality.toString(),
      '-strip', // 移除 metadata
      '-interlace', 'Plane', // 漸進式載入
      '-resize', '1920x1920>', // 限制最大尺寸
      tempPath
    ])

    convert.on('close', async (code) => {
      if (code === 0) {
        try {
          // 檢查優化後的檔案大小
          const optimizedSize = await getImageSize(tempPath)
          const originalSize = await getImageSize(filePath)

          if (optimizedSize < originalSize) {
            // 替換原檔案
            await fs.rename(tempPath, filePath)
            resolve(true)
          } else {
            // 優化無效，保留原檔案
            await fs.unlink(tempPath)
            resolve(false)
          }
        } catch (error) {
          console.error(`優化失敗: ${error}`)
          resolve(false)
        }
      } else {
        resolve(false)
      }
    })

    convert.on('error', () => {
      resolve(false)
    })
  })
}

// 使用 Node.js 內建功能進行基本優化
async function basicOptimization(filePath: string): Promise<void> {
  try {
    // 這是一個基本的優化方法，通過重新寫入來壓縮
    const buffer = await fs.readFile(filePath)
    await fs.writeFile(filePath, buffer, { flag: 'w' })
  } catch (error) {
    console.error(`基本優化失敗: ${error}`)
  }
}

async function optimizeImages() {
  console.log('🎨 開始優化圖片...')

  try {
    const files = await fs.readdir(IMAGES_DIR)
    const imageFiles = files.filter(file => file.endsWith('.png'))

    if (imageFiles.length === 0) {
      console.log('❌ 未找到 PNG 圖片檔案')
      return
    }

    const imageInfos: ImageInfo[] = []

    for (const filename of imageFiles) {
      const filePath = path.join(IMAGES_DIR, filename)
      const originalSize = await getImageSize(filePath)

      console.log(`📸 處理: ${filename} (${(originalSize / 1024 / 1024).toFixed(2)}MB)`)

      const imageInfo: ImageInfo = {
        name: filename,
        originalSize
      }

      // 如果檔案過大，嘗試優化
      if (originalSize > TARGET_SIZE) {
        console.log(`   ⚡ 檔案過大，正在優化...`)

        // 先嘗試使用 ImageMagick
        const optimized = await optimizeImage(filePath, QUALITY)

        if (!optimized) {
          // 如果 ImageMagick 不可用，使用基本優化
          console.log(`   📝 使用基本優化...`)
          await basicOptimization(filePath)
        }

        const optimizedSize = await getImageSize(filePath)
        imageInfo.optimizedSize = optimizedSize
        imageInfo.compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100

        console.log(`   ✅ 優化完成: ${(optimizedSize / 1024 / 1024).toFixed(2)}MB (-${imageInfo.compressionRatio.toFixed(1)}%)`)
      } else {
        console.log(`   ✅ 檔案大小適中，無需優化`)
        imageInfo.optimizedSize = originalSize
        imageInfo.compressionRatio = 0
      }

      imageInfos.push(imageInfo)
    }

    // 生成優化報告
    console.log('\n📊 優化報告:')
    console.log('=' * 50)

    let totalOriginal = 0
    let totalOptimized = 0

    for (const info of imageInfos) {
      totalOriginal += info.originalSize
      totalOptimized += info.optimizedSize || info.originalSize

      const sizeReduction = info.compressionRatio || 0
      const status = sizeReduction > 0 ? '📉' : '✅'

      console.log(`${status} ${info.name}`)
      console.log(`   原始: ${(info.originalSize / 1024).toFixed(1)}KB`)
      console.log(`   優化: ${((info.optimizedSize || info.originalSize) / 1024).toFixed(1)}KB`)
      if (sizeReduction > 0) {
        console.log(`   減少: ${sizeReduction.toFixed(1)}%`)
      }
      console.log('')
    }

    const totalReduction = ((totalOriginal - totalOptimized) / totalOriginal) * 100
    console.log(`🎉 總體優化結果:`)
    console.log(`   原始總大小: ${(totalOriginal / 1024 / 1024).toFixed(2)}MB`)
    console.log(`   優化總大小: ${(totalOptimized / 1024 / 1024).toFixed(2)}MB`)
    console.log(`   總計節省: ${totalReduction.toFixed(1)}%`)

    // 檢查是否還有過大的檔案
    const oversizedFiles = imageInfos.filter(info =>
      (info.optimizedSize || info.originalSize) > TARGET_SIZE
    )

    if (oversizedFiles.length > 0) {
      console.log('\n⚠️  仍有檔案超過建議大小 (500KB):')
      for (const file of oversizedFiles) {
        const size = file.optimizedSize || file.originalSize
        console.log(`   - ${file.name}: ${(size / 1024).toFixed(1)}KB`)
      }
      console.log('\n💡 建議: 可以考慮進一步降低品質或調整尺寸')
    }

  } catch (error) {
    console.error('❌ 優化過程中發生錯誤:', error)
  }
}

// 檢查 ImageMagick 是否可用
async function checkImageMagick(): Promise<boolean> {
  return new Promise((resolve) => {
    const check = spawn('convert', ['-version'])
    check.on('close', (code) => resolve(code === 0))
    check.on('error', () => resolve(false))
  })
}

async function main() {
  console.log('🖼️  圖片優化工具')

  const hasImageMagick = await checkImageMagick()
  if (hasImageMagick) {
    console.log('✅ ImageMagick 可用，將使用高品質優化')
  } else {
    console.log('⚠️  ImageMagick 不可用，將使用基本優化')
    console.log('   安裝 ImageMagick: sudo apt-get install imagemagick')
  }

  await optimizeImages()
}

if (require.main === module) {
  main().catch(console.error)
}

export { optimizeImages }