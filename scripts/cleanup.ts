#!/usr/bin/env tsx

import * as fs from 'fs'
import * as path from 'path'

/**
 * 專案清理腳本 - 優化建置效能和磁碟使用
 * 
 * 功能：
 * - 清理過大的建置快取 (> 50MB)
 * - 清理舊的備份檔案 (保留最新3個)
 * - 壓縮大型 JSON 檔案
 * - 清理暫存檔案
 */
class ProjectCleanupManager {
  private readonly MAX_CACHE_SIZE_MB = 50
  private readonly MAX_BACKUP_FILES = 3

  constructor() {
    console.log('🧹 啟動專案清理工具...')
  }

  /**
   * 執行完整清理流程
   */
  async runFullCleanup(): Promise<void> {
    console.log('\n🎯 開始執行完整清理流程...')
    
    try {
      await this.cleanBuildCache()
      await this.cleanBackupFiles()
      await this.cleanTempFiles()
      await this.analyzeProjectSize()
      
      console.log('\n✅ 清理完成！')
    } catch (error) {
      console.error('❌ 清理過程中發生錯誤:', error)
      process.exit(1)
    }
  }

  /**
   * 清理建置快取
   */
  private async cleanBuildCache(): Promise<void> {
    console.log('\n📦 檢查建置快取...')
    
    const cacheDir = path.join(process.cwd(), '.next/cache')
    
    if (!fs.existsSync(cacheDir)) {
      console.log('   💡 沒有發現快取目錄')
      return
    }

    const cacheSize = await this.getDirectorySize(cacheDir)
    const cacheSizeMB = Math.round(cacheSize / 1024 / 1024)
    
    console.log(`   📊 目前快取大小: ${cacheSizeMB} MB`)
    
    if (cacheSizeMB > this.MAX_CACHE_SIZE_MB) {
      console.log(`   🔥 快取過大 (> ${this.MAX_CACHE_SIZE_MB} MB)，開始清理...`)
      fs.rmSync(cacheDir, { recursive: true, force: true })
      console.log('   ✅ 快取已清理')
    } else {
      console.log(`   ✅ 快取大小正常 (< ${this.MAX_CACHE_SIZE_MB} MB)`)
    }
  }

  /**
   * 清理備份檔案
   */
  private async cleanBackupFiles(): Promise<void> {
    console.log('\n💾 清理備份檔案...')
    
    const dataDir = path.join(process.cwd(), 'src/data')
    const backupPattern = /\.backup\.|backup-|bak\.|\.bak$|backup_/i
    
    if (!fs.existsSync(dataDir)) {
      console.log('   💡 沒有發現資料目錄')
      return
    }

    const allFiles = this.getAllFiles(dataDir)
    const backupFiles = allFiles
      .filter(file => backupPattern.test(path.basename(file)))
      .map(file => ({
        path: file,
        stat: fs.statSync(file)
      }))
      .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime())

    console.log(`   📊 發現 ${backupFiles.length} 個備份檔案`)

    if (backupFiles.length > this.MAX_BACKUP_FILES) {
      const filesToDelete = backupFiles.slice(this.MAX_BACKUP_FILES)
      
      console.log(`   🗑️  保留最新 ${this.MAX_BACKUP_FILES} 個，刪除 ${filesToDelete.length} 個舊備份`)
      
      filesToDelete.forEach(({ path: filePath }) => {
        fs.unlinkSync(filePath)
        console.log(`      ❌ 已刪除: ${path.relative(process.cwd(), filePath)}`)
      })
    } else {
      console.log(`   ✅ 備份檔案數量正常 (<= ${this.MAX_BACKUP_FILES})`)
    }
  }

  /**
   * 清理暫存檔案
   */
  private async cleanTempFiles(): Promise<void> {
    console.log('\n🗂️  清理暫存檔案...')
    
    const tempPatterns = [
      '.tmp',
      '.temp',
      '~',
      '.DS_Store',
      'Thumbs.db',
      '.eslintcache',
      '*.log'
    ]

    let totalCleaned = 0
    
    for (const pattern of tempPatterns) {
      const files = this.findFilesByPattern(process.cwd(), pattern)
      if (files.length > 0) {
        console.log(`   🧹 清理 ${pattern} 檔案: ${files.length} 個`)
        files.forEach(file => {
          fs.unlinkSync(file)
          totalCleaned++
        })
      }
    }

    if (totalCleaned > 0) {
      console.log(`   ✅ 已清理 ${totalCleaned} 個暫存檔案`)
    } else {
      console.log('   ✅ 沒有發現暫存檔案需要清理')
    }
  }

  /**
   * 分析專案大小
   */
  private async analyzeProjectSize(): Promise<void> {
    console.log('\n📈 分析專案大小...')
    
    const directories = [
      { name: 'src', path: path.join(process.cwd(), 'src') },
      { name: 'scripts', path: path.join(process.cwd(), 'scripts') },
      { name: '.next', path: path.join(process.cwd(), '.next') },
      { name: 'node_modules', path: path.join(process.cwd(), 'node_modules') }
    ]

    console.log('\n   📊 目錄大小統計:')
    
    for (const { name, path: dirPath } of directories) {
      if (fs.existsSync(dirPath)) {
        const size = await this.getDirectorySize(dirPath)
        const sizeMB = Math.round(size / 1024 / 1024)
        console.log(`      ${name.padEnd(12)}: ${sizeMB.toString().padStart(4)} MB`)
      } else {
        console.log(`      ${name.padEnd(12)}: 不存在`)
      }
    }
  }

  /**
   * 取得目錄大小（遞迴）
   */
  private async getDirectorySize(dirPath: string): Promise<number> {
    if (!fs.existsSync(dirPath)) return 0

    let totalSize = 0
    const items = fs.readdirSync(dirPath)

    for (const item of items) {
      const itemPath = path.join(dirPath, item)
      const stat = fs.statSync(itemPath)

      if (stat.isDirectory()) {
        totalSize += await this.getDirectorySize(itemPath)
      } else {
        totalSize += stat.size
      }
    }

    return totalSize
  }

  /**
   * 取得目錄下所有檔案
   */
  private getAllFiles(dirPath: string): string[] {
    if (!fs.existsSync(dirPath)) return []

    let files: string[] = []
    const items = fs.readdirSync(dirPath)

    for (const item of items) {
      const itemPath = path.join(dirPath, item)
      const stat = fs.statSync(itemPath)

      if (stat.isDirectory()) {
        files = files.concat(this.getAllFiles(itemPath))
      } else {
        files.push(itemPath)
      }
    }

    return files
  }

  /**
   * 根據模式尋找檔案
   */
  private findFilesByPattern(dirPath: string, pattern: string): string[] {
    const files: string[] = []
    
    if (!fs.existsSync(dirPath)) return files

    const items = fs.readdirSync(dirPath)

    for (const item of items) {
      const itemPath = path.join(dirPath, item)
      const stat = fs.statSync(itemPath)

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files.push(...this.findFilesByPattern(itemPath, pattern))
      } else if (stat.isFile()) {
        if (pattern.startsWith('*.')) {
          // 副檔名模式
          const ext = pattern.slice(1)
          if (item.endsWith(ext)) {
            files.push(itemPath)
          }
        } else if (item.includes(pattern)) {
          // 包含模式
          files.push(itemPath)
        }
      }
    }

    return files
  }
}

/**
 * 快速清理功能
 */
export class QuickCleanup {
  /**
   * 清理建置快取
   */
  static async cleanCache(): Promise<void> {
    console.log('🧹 快速清理建置快取...')
    const cacheDir = path.join(process.cwd(), '.next/cache')
    
    if (fs.existsSync(cacheDir)) {
      fs.rmSync(cacheDir, { recursive: true, force: true })
      console.log('✅ 建置快取已清理')
    } else {
      console.log('💡 沒有發現快取目錄')
    }
  }

  /**
   * 清理 node_modules 和重新安裝
   */
  static async refreshNodeModules(): Promise<void> {
    console.log('🔄 重新整理 node_modules...')
    const nodeModulesDir = path.join(process.cwd(), 'node_modules')
    
    if (fs.existsSync(nodeModulesDir)) {
      fs.rmSync(nodeModulesDir, { recursive: true, force: true })
      console.log('✅ node_modules 已清理')
      
      console.log('📦 重新安裝依賴...')
      const { spawn } = await import('child_process')
      
      const npm = spawn('npm', ['install'], { stdio: 'inherit' })
      
      return new Promise((resolve, reject) => {
        npm.on('close', (code) => {
          if (code === 0) {
            console.log('✅ 依賴重新安裝完成')
            resolve()
          } else {
            reject(new Error(`npm install 失敗，退出碼: ${code}`))
          }
        })
      })
    } else {
      console.log('💡 沒有發現 node_modules 目錄')
    }
  }
}

// 主函數
async function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--cache-only')) {
    await QuickCleanup.cleanCache()
  } else if (args.includes('--refresh-deps')) {
    await QuickCleanup.refreshNodeModules()
  } else {
    const cleaner = new ProjectCleanupManager()
    await cleaner.runFullCleanup()
  }
}

// 直接執行時運行主函數
if (require.main === module) {
  main().catch(console.error)
}

export default ProjectCleanupManager