'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OilCategory, CategoryOption } from '@/types/oil'
import ImageUploader from './ImageUploader'
import CategorySelector from './CategorySelector'

const defaultCategoryOptions: CategoryOption[] = [
  { value: OilCategory.ESSENTIAL_OILS, label: '單方精油' },
  { value: OilCategory.BLENDS, label: '複方精油' },
  { value: OilCategory.SKINCARE, label: '護膚產品' },
  { value: OilCategory.WELLNESS, label: '健康產品' },
  { value: OilCategory.SUPPLEMENTS, label: '營養補充' },
  { value: OilCategory.ACCESSORIES, label: '配件用品' }
]

export default function AddOilForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    englishName: '',
    description: '',
    benefits: [''],
    category: OilCategory.ESSENTIAL_OILS as string,
    volume: '',
    imageUrl: '',
    usageInstructions: '',
    tags: ['']
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleArrayFieldChange = (field: 'benefits' | 'tags', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const addArrayField = (field: 'benefits' | 'tags') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }))
  }

  const removeArrayField = (field: 'benefits' | 'tags', index: number) => {
    if (formData[field].length > 1) {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }))
    }
  }

  const validateForm = () => {
    if (!formData.name.trim()) return '精油名稱不能為空'
    if (!formData.imageUrl.trim()) return '精油圖片 URL 不能為空'
    
    const validBenefits = formData.benefits.filter(benefit => benefit.trim())
    if (validBenefits.length === 0) return '至少需要一個精油功效'
    
    const validTags = formData.tags.filter(tag => tag.trim())
    if (validTags.length === 0) return '至少需要一個精油標籤'
    
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const error = validateForm()
    if (error) {
      alert(error)
      return
    }

    setIsSubmitting(true)

    try {
      // 清理數據
      const cleanedData = {
        ...formData,
        benefits: formData.benefits.filter(benefit => benefit.trim()),
        tags: formData.tags.filter(tag => tag.trim())
      }

      // 調用 API 保存精油
      const response = await fetch('/api/oils', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData),
      })

      const result = await response.json()

      if (result.success) {
        alert('精油新增成功！')
        router.push('/oils')
      } else {
        alert(`新增失敗：${result.error}`)
      }
    } catch (error) {
      alert('新增精油失敗，請稍後再試')
      console.error('Error adding oil:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本資訊 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">基本資訊</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-800 mb-2">
                精油名稱 *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                placeholder="例如：薰衣草精油"
                required
              />
            </div>

            <div>
              <label htmlFor="englishName" className="block text-sm font-medium text-gray-800 mb-2">
                英文名稱
              </label>
              <input
                type="text"
                id="englishName"
                name="englishName"
                value={formData.englishName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                placeholder="例如：Lavender Essential Oil"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-800 mb-2">
              精油描述
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
              placeholder="詳細描述精油特色和用途..."
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                精油類別 *
              </label>
              <CategorySelector
                value={formData.category}
                onChange={(value) => {
                  setFormData(prev => ({
                    ...prev,
                    category: value
                  }))
                }}
                defaultOptions={defaultCategoryOptions}
                placeholder="選擇現有類別或新增自訂類別"
                required
              />
            </div>

            <div>
              <label htmlFor="volume" className="block text-sm font-medium text-gray-800 mb-2">
                容量規格
              </label>
              <input
                type="text"
                id="volume"
                name="volume"
                value={formData.volume}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                placeholder="例如：15ml"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                精油圖片 *
              </label>
              <ImageUploader
                productId={formData.name || 'new-oil'}
                onUploadSuccess={(imageUrl) => {
                  setFormData(prev => ({
                    ...prev,
                    imageUrl
                  }))
                }}
                onUploadError={(error) => {
                  alert(`圖片上傳失敗：${error}`)
                }}
                initialImageUrl={formData.imageUrl}
                maxFiles={1}
              />
              <input
                type="hidden"
                name="imageUrl"
                value={formData.imageUrl}
              />
            </div>
          </div>
        </div>

        {/* 精油功效 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">精油功效</h2>
          {formData.benefits.map((benefit, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={benefit}
                onChange={(e) => handleArrayFieldChange('benefits', index, e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                placeholder={`功效 ${index + 1}`}
              />
              <button
                type="button"
                onClick={() => removeArrayField('benefits', index)}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                disabled={formData.benefits.length === 1}
              >
                移除
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayField('benefits')}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            + 新增功效
          </button>
        </div>


        {/* 精油標籤 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">精油標籤</h2>
          {formData.tags.map((tag, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={tag}
                onChange={(e) => handleArrayFieldChange('tags', index, e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                placeholder={`標籤 ${index + 1}`}
              />
              <button
                type="button"
                onClick={() => removeArrayField('tags', index)}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                disabled={formData.tags.length === 1}
              >
                移除
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayField('tags')}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            + 新增標籤
          </button>
        </div>

        {/* 使用說明 */}
        <div>
          <label htmlFor="usageInstructions" className="block text-sm font-medium text-gray-800 mb-2">
            使用說明
          </label>
          <textarea
            id="usageInstructions"
            name="usageInstructions"
            value={formData.usageInstructions}
            onChange={handleInputChange}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
            placeholder="詳細的使用方法和注意事項..."
          />
        </div>


        {/* 提交按鈕 */}
        <div className="flex gap-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            取消
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '儲存中...' : '儲存精油'}
          </button>
        </div>
      </form>
    </div>
  )
}