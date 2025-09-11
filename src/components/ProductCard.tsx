import { Product } from '@/types/product'
import Image from 'next/image'

interface ProductCardProps {
  product: Product
  onSelect?: (product: Product) => void
  compact?: boolean
}

export default function ProductCard({ product, onSelect, compact = false }: ProductCardProps) {
  const handleClick = () => {
    onSelect?.(product)
  }


  const getBadgeColor = (category: string) => {
    switch (category) {
      case 'essential-oils':
        return 'bg-green-100 text-green-800'
      case 'blends':
        return 'bg-blue-100 text-blue-800'
      case 'skincare':
        return 'bg-purple-100 text-purple-800'
      case 'wellness':
        return 'bg-orange-100 text-orange-800'
      case 'supplements':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'essential-oils':
        return '單方精油'
      case 'blends':
        return '複方精油'
      case 'skincare':
        return '護膚產品'
      case 'wellness':
        return '健康產品'
      case 'supplements':
        return '營養補充'
      case 'accessories':
        return '配件用品'
      default:
        return '其他'
    }
  }

  return (
    <div 
      className={`
        bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 
        cursor-pointer group overflow-hidden border border-gray-100
        ${compact ? 'p-4' : 'p-6'}
      `}
      onClick={handleClick}
    >
      {/* 產品圖片 */}
      <div className={`relative ${compact ? 'h-40' : 'h-48'} mb-4 bg-gray-50 rounded-lg overflow-hidden`}>
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* 徽章 */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isNew && (
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              新品
            </span>
          )}
          {product.isBestseller && (
            <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              熱銷
            </span>
          )}
          {!product.inStock && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              缺貨
            </span>
          )}
        </div>

        {/* 類別標籤 */}
        <div className="absolute top-2 right-2">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getBadgeColor(product.category)}`}>
            {getCategoryName(product.category)}
          </span>
        </div>
      </div>

      {/* 產品資訊 */}
      <div className="space-y-3">
        {/* 產品名稱 */}
        <div>
          <h3 className={`font-semibold text-gray-800 group-hover:text-green-600 transition-colors ${compact ? 'text-sm' : 'text-lg'}`}>
            {product.name}
          </h3>
          <p className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>
            {product.englishName}
          </p>
        </div>

        {/* 產品描述 */}
        {!compact && (
          <p className="text-gray-600 text-sm line-clamp-2">
            {product.description}
          </p>
        )}

        {/* 主要功效 */}
        <div className="flex flex-wrap gap-1">
          {product.tags.slice(0, compact ? 2 : 3).map((tag, index) => (
            <span 
              key={index}
              className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
          {product.tags.length > (compact ? 2 : 3) && (
            <span className="text-gray-400 text-xs px-2 py-1">
              +{product.tags.length - (compact ? 2 : 3)}
            </span>
          )}
        </div>

        {/* 規格資訊 */}
        <div className="flex justify-between items-center">
          <div className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>
            規格：{product.volume}
          </div>
          
          {/* 查看詳情按鈕 */}
          <button 
            className={`
              bg-green-600 text-white rounded-lg font-medium 
              hover:bg-green-700 transition-colors
              ${compact ? 'px-3 py-1 text-sm' : 'px-4 py-2'}
            `}
            onClick={(e) => {
              e.stopPropagation()
              handleClick()
            }}
          >
            查看詳情
          </button>
        </div>
      </div>
    </div>
  )
}