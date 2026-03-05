// filepath: src/pages/owner/DashboardPage.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { restaurantApi } from '../../api/restaurantApi'
import { orderApi } from '../../api/orderApi'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { useToast, Toast } from '../../components/ui/Toast'

export function DashboardPage() {
  const { user } = useAuth()
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    image_url: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [toast, showToast] = useToast()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    fetchRestaurants()
  }, [user])

  const fetchRestaurants = async () => {
    try {
      setLoading(true)
      const allRestaurants = await restaurantApi.getAll()
      // Filter restaurants belonging to current owner
      const ownerRestaurants = allRestaurants.filter(
        (r) => r.owner_id === user?.userId
      )
      setRestaurants(ownerRestaurants)

      // Get pending orders count
      if (ownerRestaurants.length > 0) {
        const orders = await orderApi.getByRestaurant(ownerRestaurants[0].id)
        const pending = orders.filter((o) => o.status === 'pending').length
        setPendingCount(pending)
      }
    } catch (error) {
      console.error('Failed to fetch restaurants:', error)
      showToast('Lỗi khi tải thông tin nhà hàng', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRestaurant = async (e) => {
    e.preventDefault()

    if (!formData.name || !formData.address) {
      showToast('Vui lòng nhập tên và địa chỉ nhà hàng', 'warning')
      return
    }

    try {
      setSubmitting(true)
      await restaurantApi.create(formData)
      showToast('Tạo nhà hàng thành công!', 'success')
      setFormData({ name: '', address: '', image_url: '' })
      setShowForm(false)
      fetchRestaurants()
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Tạo nhà hàng thất bại'
      showToast(errorMsg, 'error')
      console.error('Create restaurant error:', error)
    } finally {
      setSubmitting(false)
    }
  }

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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        {restaurants.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Tạo nhà hàng đầu tiên</h2>

            {!showForm ? (
              <Button onClick={() => setShowForm(true)} size="lg">
                + Tạo nhà hàng
              </Button>
            ) : (
              <form onSubmit={handleCreateRestaurant} className="max-w-md space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Tên nhà hàng</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Địa chỉ</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">URL ảnh (tùy chọn)</label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={submitting}
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowForm(false)}
                    disabled={submitting}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? <Spinner size="sm" /> : 'Tạo'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md p-8 mb-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{restaurants[0].name}</h2>
                  <p className="text-gray-600 mt-2">{restaurants[0].address}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-600 text-sm">Đơn hàng chờ xử lý</p>
                  <p className="text-4xl font-bold text-primary">{pendingCount}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Link
                  to="/dashboard/menu"
                  className="block p-6 bg-gray-50 rounded-lg hover:shadow-md transition text-center"
                >
                  <p className="text-lg font-semibold text-gray-900">📋</p>
                  <p className="text-lg font-bold text-gray-900 mt-2">Quản lý Menu</p>
                </Link>

                <Link
                  to="/dashboard/orders"
                  className="block p-6 bg-gray-50 rounded-lg hover:shadow-md transition text-center"
                >
                  <p className="text-lg font-semibold text-gray-900">📦</p>
                  <p className="text-lg font-bold text-gray-900 mt-2">Quản lý Đơn hàng</p>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>

      {toast && <Toast {...toast} onClose={() => {}} />}
    </div>
  )
}
