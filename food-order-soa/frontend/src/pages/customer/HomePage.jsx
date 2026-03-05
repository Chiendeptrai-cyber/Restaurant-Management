// filepath: src/pages/customer/HomePage.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { restaurantApi } from '../../api/restaurantApi'
import { Spinner } from '../../components/ui/Spinner'
import { Badge } from '../../components/ui/Badge'
import { useToast, Toast } from '../../components/ui/Toast'

export function HomePage() {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, showToast] = useToast()

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true)
        const data = await restaurantApi.getAll()
        setRestaurants(data)
      } catch (error) {
        console.error('Failed to fetch restaurants:', error)
        showToast('Lỗi khi tải danh sách nhà hàng', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchRestaurants()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Tất cả nhà hàng</h1>
        <p className="text-gray-600 mb-8">Chọn một nhà hàng để bắt đầu đặt hàng</p>

        {restaurants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Không có nhà hàng nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant) => (
              <Link
                key={restaurant.id}
                to={`/restaurants/${restaurant.id}`}
                className="bg-white rounded-lg shadow-md hover:shadow-lg overflow-hidden transition"
              >
                <div className="h-40 bg-gray-200 overflow-hidden">
                  <img
                    src={restaurant.image_url || 'https://via.placeholder.com/300x200'}
                    alt={restaurant.name}
                    className="w-full h-full object-cover hover:scale-110 transition"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{restaurant.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{restaurant.address}</p>
                  <Badge variant={restaurant.status === 'active' ? 'success' : 'warning'}>
                    {restaurant.status === 'active' ? 'Mở cửa' : 'Đóng cửa'}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {toast && <Toast {...toast} onClose={() => {}} />}
    </div>
  )
}
