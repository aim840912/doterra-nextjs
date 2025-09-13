import { NextRequest, NextResponse } from 'next/server'
import { allOils } from '@/data/products'

// 統一回應格式
function successResponse<T = unknown>(data: T, message: string = '操作成功') {
  return NextResponse.json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  })
}

function errorResponse(message: string, status: number = 500, details?: Record<string, unknown>) {
  return NextResponse.json({
    success: false,
    error: message,
    ...(details && { details }),
    timestamp: new Date().toISOString()
  }, { status })
}

// 檢查各項系統狀態
async function checkSystemHealth() {
  const startTime = Date.now()
  const checks: Record<string, { status: string; [key: string]: unknown }> = {}

  // 1. 基本 API 響應檢查
  checks.api = {
    status: 'healthy',
    description: 'API 服務運作正常',
    responseTime: 0 // 稍後計算
  }

  // 2. JSON 資料源檢查（檢查產品資料完整性）
  try {
    const productCount = allOils.length
    const hasValidProducts = allOils.every(oil => 
      oil.id && oil.name && oil.imageUrl
    )

    checks.dataSource = {
      status: hasValidProducts ? 'healthy' : 'warning',
      description: hasValidProducts ? 'JSON 資料完整性良好' : '發現 JSON 資料完整性問題',
      productCount,
      dataIntegrity: hasValidProducts,
      sourceType: 'JSON'
    }
  } catch (error) {
    checks.dataSource = {
      status: 'unhealthy',
      description: 'JSON 資料源檢查失敗',
      error: String(error),
      sourceType: 'JSON'
    }
  }

  // 3. 記憶體使用檢查
  try {
    const memoryUsage = process.memoryUsage()
    const memoryMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024)
    }

    const isHealthy = memoryMB.heapUsed < 512 // 512MB 警戒線
    
    checks.memory = {
      status: isHealthy ? 'healthy' : 'warning',
      description: isHealthy ? '記憶體使用正常' : '記憶體使用偏高',
      usage: memoryMB,
      unit: 'MB'
    }
  } catch (error) {
    checks.memory = {
      status: 'unhealthy',
      description: '記憶體檢查失敗',
      error: String(error)
    }
  }

  // 4. Node.js 運行時間檢查
  try {
    const uptimeSeconds = process.uptime()
    const uptimeFormatted = {
      days: Math.floor(uptimeSeconds / 86400),
      hours: Math.floor((uptimeSeconds % 86400) / 3600),
      minutes: Math.floor((uptimeSeconds % 3600) / 60),
      seconds: Math.floor(uptimeSeconds % 60)
    }

    checks.uptime = {
      status: 'healthy',
      description: 'Node.js 程序運行正常',
      uptimeSeconds: Math.floor(uptimeSeconds),
      uptimeFormatted,
      nodeVersion: process.version
    }
  } catch (error) {
    checks.uptime = {
      status: 'unhealthy',
      description: '運行時間檢查失敗',
      error: String(error)
    }
  }

  // 5. 環境檢查
  try {
    checks.environment = {
      status: 'healthy',
      description: '環境配置正常',
      nodeEnv: process.env.NODE_ENV || 'development',
      platform: process.platform,
      architecture: process.arch,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  } catch (error) {
    checks.environment = {
      status: 'unhealthy',
      description: '環境檢查失敗',
      error: String(error)
    }
  }

  // 計算總響應時間
  const endTime = Date.now()
  checks.api.responseTime = endTime - startTime

  return checks
}

// 確定整體健康狀態
function determineOverallHealth(checks: Record<string, { status: string; [key: string]: unknown }>) {
  const statuses = Object.values(checks).map(check => check.status)
  
  if (statuses.includes('unhealthy')) {
    return 'unhealthy'
  } else if (statuses.includes('warning')) {
    return 'warning'
  } else {
    return 'healthy'
  }
}

// GET /api/health - 系統健康檢查
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const detailed = searchParams.get('detailed') === 'true'
    const format = searchParams.get('format') || 'json'

    // 執行健康檢查
    const checks = await checkSystemHealth()
    const overallStatus = determineOverallHealth(checks)

    // 基本健康資訊
    const basicHealth = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      service: 'DoTERRA Essential Oils API'
    }

    // 詳細檢查結果
    const detailedHealth = {
      ...basicHealth,
      checks,
      summary: {
        totalChecks: Object.keys(checks).length,
        healthyChecks: Object.values(checks).filter(c => c.status === 'healthy').length,
        warningChecks: Object.values(checks).filter(c => c.status === 'warning').length,
        unhealthyChecks: Object.values(checks).filter(c => c.status === 'unhealthy').length
      }
    }

    const responseData = detailed ? detailedHealth : basicHealth
    const message = `系統狀態: ${overallStatus === 'healthy' ? '健康' : 
                     overallStatus === 'warning' ? '警告' : '異常'}`

    // 根據健康狀態決定 HTTP 狀態碼
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'warning' ? 200 : 503

    if (format === 'text') {
      // 簡單文字格式回應（適合監控工具）
      const textResponse = `Status: ${overallStatus.toUpperCase()}\n` +
                          `Timestamp: ${basicHealth.timestamp}\n` +
                          `Service: ${basicHealth.service}\n` +
                          `Version: ${basicHealth.version}`
                          
      return new NextResponse(textResponse, {
        status: httpStatus,
        headers: { 'Content-Type': 'text/plain' }
      })
    }

    return NextResponse.json(responseData, { status: httpStatus })

  } catch (error) {
    // API 錯誤已移除: '健康檢查失敗:', error
    return errorResponse('健康檢查執行失敗', 500, {
      error: String(error)
    })
  }
}

// HEAD /api/health - 快速健康檢查（只回傳狀態碼）
export async function HEAD(request: NextRequest) {
  try {
    const checks = await checkSystemHealth()
    const overallStatus = determineOverallHealth(checks)
    
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'warning' ? 200 : 503

    return new NextResponse(null, { status: httpStatus })
  } catch (error) {
    return new NextResponse(null, { status: 503 })
  }
}