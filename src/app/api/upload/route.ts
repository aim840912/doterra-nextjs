import { NextRequest, NextResponse } from 'next/server'
import { writeFile, unlink } from 'fs/promises'
import path from 'path'
import { validateImageFile, generateFileName } from '@/lib/image-utils'

// 處理圖片上傳
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const productId = formData.get('productId') as string

    if (!file) {
      return NextResponse.json(
        { success: false, error: '請選擇要上傳的圖片檔案' },
        { status: 400 }
      )
    }

    if (!productId) {
      return NextResponse.json(
        { success: false, error: '產品 ID 是必填的' },
        { status: 400 }
      )
    }

    // 驗證檔案
    const validation = validateImageFile(file)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      )
    }

    // 生成檔案名稱
    const fileName = generateFileName(file.name, productId)
    
    // 設定檔案路徑
    const uploadDir = path.join(process.cwd(), 'public', 'images', 'products')
    const filePath = path.join(uploadDir, fileName)

    // 將檔案轉換為 Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 寫入檔案
    await writeFile(filePath, buffer)

    // 生成 URL
    const url = `/images/products/${fileName}`

    return NextResponse.json({
      success: true,
      data: {
        url,
        fileName,
        size: file.size,
        type: file.type
      },
      message: '圖片上傳成功'
    })

  } catch (error) {
    console.error('圖片上傳錯誤:', error)
    return NextResponse.json(
      { success: false, error: '圖片上傳失敗' },
      { status: 500 }
    )
  }
}

// 處理圖片刪除
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { fileName } = body

    if (!fileName) {
      return NextResponse.json(
        { success: false, error: '檔案名稱是必填的' },
        { status: 400 }
      )
    }

    // 設定檔案路徑
    const filePath = path.join(process.cwd(), 'public', 'images', 'products', fileName)

    try {
      // 刪除檔案
      await unlink(filePath)
    } catch (error) {
      // 檔案可能已經不存在，這不算錯誤
      console.warn('檔案刪除警告:', error)
    }

    return NextResponse.json({
      success: true,
      message: '圖片刪除成功'
    })

  } catch (error) {
    console.error('圖片刪除錯誤:', error)
    return NextResponse.json(
      { success: false, error: '圖片刪除失敗' },
      { status: 500 }
    )
  }
}