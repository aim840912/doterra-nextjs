import { Oil } from '@/types/oil'
import Image from 'next/image'

interface OilCardProps {
  oil: Oil
  onSelect?: (oil: Oil) => void
  compact?: boolean
}

export default function OilCard({ oil, onSelect, compact = false }: OilCardProps) {
  const handleClick = () => {
    onSelect?.(oil)
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
        ${compact ? 'p-4' : 'p-6'} flex flex-col h-full
      `}
      onClick={handleClick}
    >
      {/* 精油圖片 */}
      <div className={`relative ${compact ? 'h-40' : 'h-48'} mb-4 bg-gray-50 rounded-lg overflow-hidden`}>
        <Image
          src={oil.imageUrl}
          alt={oil.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        

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