// filepath: src/pages/customer/RestaurantPage.jsx
import { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { restaurantApi } from '../../api/restaurantApi'
import { CartContext } from '../../context/CartContext'
import { useAuth } from '../../hooks/useAuth'
import { Spinner } from '../../components/ui/Spinner'
import { Button } from '../../components/ui/Button'
import { useToast, Toast } from '../../components/ui/Toast'

export function RestaurantPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addItem, restaurantId, totalItems } = useContext(CartContext)
  const [restaurant, setRestaurant] = useState(null)
  const [menu, setMenu] = useState([])
  const [loading, setLoading] = useState(true)
  const [categorizedMenu, setCategorizedMenu] = useState({})
  const [toast, showToast] = useToast()
  const [confirmDialog, setConfirmDialog] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [restData, menuData] = await Promise.all([
          restaurantApi.getById(id),
          restaurantApi.getMenu(id)
        ])
        setRestaurant(restData)
        setMenu(menuData)

        // Group by category
        const grouped = {}
        menuData.forEach((item) => {
          if (!grouped[item.category]) {
            grouped[item.category] = []
          }
          grouped[item.category].push(item)
        })
        setCategorizedMenu(grouped)
      } catch (error) {
        console.error('Failed to fetch restaurant:', error)
        showToast('Lỗi khi tải thông tin nhà hàng', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleAddItem = (item) => {
    if (!user) {
      navigate('/login')
      return
    }

    if (restaurantId && restaurantId !== parseInt(id)) {
      setConfirmDialog({
        title: 'Thay đổi nhà hàng?',
        message: 'Giỏ hàng của bạn chứa món từ nhà hàng khác. Bạn muốn xóa giỏ hàng cũ?',
        onConfirm: () => {
          addItem(item, restaurant, (callback) => callback())
          setConfirmDialog(null)
          showToast('Thêm vào giỏ hàng thành công!', 'success')
        },
        onCancel: () => setConfirmDialog(null)
      })
      return
    }

    addItem(item, restaurant, (callback) => callback())
    showToast('Thêm vào giỏ hàng thành công!', 'success')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600 text-lg">Nhà hàng không tìm thấy</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Restaurant Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex gap-8">
            <img
              src={restaurant.image_url || 'https://via.placeholder.com/300x200'}
              alt={restaurant.name}
              className="w-64 h-48 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
              <p className="text-gray-600 text-lg mb-4">{restaurant.address}</p>
              <div className="flex gap-4">
                <Button variant="primary" onClick={() => navigate('/cart')} disabled={totalItems === 0}>
                  🛒 Xem giỏ ({totalItems})
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Menu</h2>

        {Object.entries(categorizedMenu).length === 0 ? (
          <p className="text-gray-500 text-lg">Nhà hàng này chưa có menu</p>
        ) : (
          Object.entries(categorizedMenu).map(([category, items]) => (
            <div key={category} className="mb-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {items.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-lg font-bold text-gray-900">{item.name}</h4>
                      <span className="text-primary text-lg font-bold">₫{item.price.toFixed(0)}</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">Thời gian chuẩn bị: ~30 phút</p>
                    <Button
                      size="sm"
                      fullWidth
                      onClick={() => handleAddItem(item)}
                    >
                      + Thêm
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Cart Button */}
      {totalItems > 0 && (
        <button
          onClick={() => navigate('/cart')}
          className="fixed bottom-8 right-8 bg-primary text-white rounded-full p-4 shadow-lg hover:bg-red-600 transition flex items-center gap-2"
        >
          <span className="text-2xl">🛒</span>
          <span className="font-bold">{totalItems} | ₫{menu.reduce((sum, item) => sum + item.price, 0).toFixed(0)}</span>
        </button>
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{confirmDialog.title}</h2>
            <p className="text-gray-600 mb-6">{confirmDialog.message}</p>
            <div className="flex gap-4">
              <Button variant="ghost" fullWidth onClick={confirmDialog.onCancel}>
                Hủy
              </Button>
              <Button variant="danger" fullWidth onClick={confirmDialog.onConfirm}>
                Xóa & Tiếp tục
              </Button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast {...toast} onClose={() => {}} />}
    </div>
  )
}
