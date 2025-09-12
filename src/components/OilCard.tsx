import { Oil } from '@/types/oil'
import Image from 'next/image'

interface OilCardProps {
  oil: Oil
  onSelect?: (oil: Oil) => void
  compact?: boolean
  isFavorite?: boolean
  onToggleFavorite?: (oilId: string) => void
}

export default function OilCard({ 
  oil, 
  onSelect, 
  compact = false, 
  isFavorite = false, 
  onToggleFavorite 
}: OilCardProps) {
  const handleClick = () => {
    onSelect?.(oil)
  }

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation() // 防止觸發卡片點擊事件
    onToggleFavorite?.(oil.id)
  }


  const getBadgeColor = (category: string) => {
    switch (category) {
      case 'single-oils':  // 改為 JSON 實際使用的值
      case 'essential-oils':  // 保持向後相容
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
      case 'single-oils':  // 改為 JSON 實際使用的值
      case 'essential-oils':  // 保持向後相容
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
        ${compact ? 'p-4' : 'p-6'} flex flex-col h-full
      `}
      onClick={handleClick}
    >
      {/* 精油圖片 */}
      <div className={`relative ${compact ? 'h-40' : 'h-48'} mb-4 bg-white rounded-lg overflow-hidden`}>
        <Image
          src={oil.imageUrl}
          alt={oil.name}
          fill
          className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* 收藏星星按鈕 */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-2 left-2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white/95 transition-all duration-200 shadow-sm hover:shadow-md group/star"
          title={isFavorite ? '移除收藏' : '加入收藏'}
          aria-label={isFavorite ? '移除收藏' : '加入收藏'}
        >
          {isFavorite ? (
            <svg 
              className="w-4 h-4 text-yellow-400 group-hover/star:scale-110 transition-transform duration-200" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ) : (
            <svg 
              className="w-4 h-4 text-gray-400 hover:text-yellow-400 group-hover/star:scale-110 transition-all duration-200" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 20 20"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          )}
        </button>

        {/* 類別標籤 */}
        <div className="absolute top-2 right-2">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getBadgeColor(oil.category)}`}>
            {getCategoryName(oil.category)}
          </span>
        </div>
      </div>

      {/* 精油資訊 - 使用 flex-grow 讓內容區域自動增長 */}
      <div className="flex flex-col flex-grow space-y-3">
        {/* 精油名稱 */}
        <div>
          <h3 className={`font-semibold text-gray-800 group-hover:text-green-600 transition-colors ${compact ? 'text-sm' : 'text-lg'}`}>
            {oil.name}
          </h3>
          <p className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>
            {oil.englishName}
          </p>
        </div>

        {/* 精油描述 */}
        {!compact && (
          <p className="text-gray-600 text-sm line-clamp-2">
            {oil.description}
          </p>
        )}

        {/* 主要功效 */}
        {(oil.mainBenefits && oil.mainBenefits.length > 0) && (
          <div className="flex flex-wrap gap-1">
            {oil.mainBenefits.slice(0, compact ? 2 : 3).map((benefit, index) => (
              <span 
                key={index}
                className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full border border-green-200"
              >
                {benefit}
              </span>
            ))}
            {oil.mainBenefits.length > (compact ? 2 : 3) && (
              <span className="text-gray-400 text-xs px-2 py-1">
                +{oil.mainBenefits.length - (compact ? 2 : 3)}
              </span>
            )}
          </div>
        )}

        {/* 規格資訊 */}
        <div className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>
          規格：{oil.volume}
        </div>
        
        {/* 查看詳情按鈕 - 使用 mt-auto 將按鈕推到底部 */}
        <button 
          className={`
            w-full bg-green-600 text-white rounded-lg font-medium 
            hover:bg-green-700 transition-colors mt-auto
            ${compact ? 'py-2 text-sm' : 'py-2.5'}
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
  )
}