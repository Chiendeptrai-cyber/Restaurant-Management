// filepath: src/pages/owner/MenuManagerPage.jsx
import { useState, useEffect } from 'react'
import { restaurantApi } from '../../api/restaurantApi'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { useToast, Toast } from '../../components/ui/Toast'

export function MenuManagerPage() {
  const { user } = useAuth()
  const [restaurants, setRestaurants] = useState([])
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [menu, setMenu] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'Chủ yếu'
  })
  const [submitting, setSubmitting] = useState(false)
  const [toast, showToast] = useToast()

  useEffect(() => {
    fetchRestaurants()
  }, [user])

  const fetchRestaurants = async () => {
    try {
      setLoading(true)
      const allRestaurants = await restaurantApi.getAll()
      const ownerRestaurants = allRestaurants.filter(
        (r) => r.owner_id === user?.userId
      )
      setRestaurants(ownerRestaurants)
      if (ownerRestaurants.length > 0) {
        setSelectedRestaurant(ownerRestaurants[0].id)
        fetchMenu(ownerRestaurants[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch restaurants:', error)
      showToast('Lỗi khi tải thông tin nhà hàng', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchMenu = async (restaurantId) => {
    try {
      const menuData = await restaurantApi.getMenu(restaurantId)
      setMenu(menuData)
    } catch (error) {
      console.error('Failed to fetch menu:', error)
      showToast('Lỗi khi tải menu', 'error')
    }
  }

  const handleAddMenuItem = async (e) => {
    e.preventDefault()

    if (!formData.name || !formData.price || !selectedRestaurant) {
      showToast('Vui lòng nhập đầy đủ thông tin', 'warning')
      return
    }

    try {
      setSubmitting(true)
      await restaurantApi.addMenuItem(selectedRestaurant, {
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        available: true
      })
      showToast('Thêm món thành công!', 'success')
      setFormData({ name: '', price: '', category: 'Chủ yếu' })
      setShowForm(false)
      fetchMenu(selectedRestaurant)
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Thêm món thất bại'
      showToast(errorMsg, 'error')
      console.error('Add menu item error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (itemId) => {
    try {
      await restaurantApi.toggleMenuItem(itemId)
      fetchMenu(selectedRestaurant)
      showToast('Cập nhật trạng thái thành công!', 'success')
    } catch (error) {
      console.error('Failed to toggle:', error)
      showToast('Lỗi khi cập nhật trạng thái', 'error')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (restaurants.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600 text-lg">Bạn chưa có nhà hàng nào</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Quản lý Menu</h1>

        {/* Restaurant Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <label className="block text-gray-700 font-semibold mb-2">Chọn nhà hàng</label>
          <select
            value={selectedRestaurant}
            onChange={(e) => {
              setSelectedRestaurant(parseInt(e.target.value))
              fetchMenu(parseInt(e.target.value))
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Danh sách món ăn</h2>
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Hủy' : '+ Thêm món'}
            </Button>
          </div>

          {showForm && (
            <form onSubmit={handleAddMenuItem} className="max-w-md space-y-4 mb-8 pb-8 border-b">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Tên món</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Giá</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Danh mục</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  disabled={submitting}
                />
              </div>

              <Button type="submit" disabled={submitting}>
                {submitting ? <Spinner size="sm" /> : 'Thêm'}
              </Button>
            </form>
          )}

          {menu.length === 0 ? (
            <p className="text-gray-600">Chưa có món ăn nào</p>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-900 font-semibold">Tên</th>
                  <th className="px-6 py-3 text-left text-gray-900 font-semibold">Danh mục</th>
                  <th className="px-6 py-3 text-right text-gray-900 font-semibold">Giá</th>
                  <th className="px-6 py-3 text-center text-gray-900 font-semibold">Trạng thái</th>
                  <th className="px-6 py-3 text-center text-gray-900 font-semibold">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {menu.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 font-semibold text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-gray-600">{item.category}</td>
                    <td className="px-6 py-4 text-right font-semibold">₫{item.price.toFixed(0)}</td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                          item.available
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.available ? 'Có sẵn' : 'Hết hàng'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggle(item.id)}
                        className="text-primary hover:text-red-700 transition font-semibold"
                      >
                        {item.available ? 'Ẩn' : 'Hiện'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {toast && <Toast {...toast} onClose={() => {}} />}
    </div>
  )
}
