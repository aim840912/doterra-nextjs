'use client'

import { allProducts, getDoTerraProducts, getSampleProducts } from '@/data/products'

export default function TestProductsPage() {
  const doterraProducts = getDoTerraProducts()
  const sampleProducts = getSampleProducts()
  const allProductsList = allProducts

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8">產品資料測試頁面</h1>
        
        {/* 統計資訊 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">總產品數量</h2>
            <p className="text-3xl font-bold text-green-600">{allProductsList.length}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">doTERRA 產品</h2>
            <p className="text-3xl font-bold text-blue-600">{doterraProducts.length}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">原始樣本產品</h2>
            <p className="text-3xl font-bold text-purple-600">{sampleProducts.length}</p>
          </div>
        </div>

        {/* doTERRA 產品列表 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">doTERRA 產品列表</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doterraProducts.map(product => (
              <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  {/* 產品圖片 */}
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/placeholder.jpg';
                      }}
                    />
                  </div>
                  
                  {/* 產品資訊 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                    <p className="text-sm text-gray-600 truncate">{product.englishName}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        {product.category}
                      </span>
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {product.volume}
                      </span>
                      {product.isBestseller && (
                        <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                          暢銷
                        </span>
                      )}
                      {product.isNew && (
                        <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                          新品
                        </span>
                      )}
                    </div>
                    {(product.mainBenefits && product.mainBenefits.length > 0) && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {product.mainBenefits.slice(0, 3).map((benefit, index) => (
                          <span key={index} className="inline-block bg-green-50 text-green-700 text-xs px-2 py-1 rounded border border-green-200">
                            {benefit}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 產品描述 */}
                <p className="text-sm text-gray-600 mt-3 line-clamp-2">{product.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 產品類別統計 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">產品類別統計</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(
              allProductsList.reduce((acc, product) => {
                acc[product.category] = (acc[product.category] || 0) + 1
                return acc
              }, {} as Record<string, number>)
            ).map(([category, count]) => (
              <div key={category} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="capitalize">{category}</span>
                <span className="font-semibold text-lg">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}