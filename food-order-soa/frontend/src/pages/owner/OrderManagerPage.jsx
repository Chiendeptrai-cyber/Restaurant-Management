// filepath: src/pages/owner/OrderManagerPage.jsx
import { useState, useEffect } from 'react'
import { restaurantApi } from '../../api/restaurantApi'
import { orderApi } from '../../api/orderApi'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import { useToast, Toast } from '../../components/ui/Toast'

const statusTransitions = {
  pending: ['confirmed'],
  confirmed: ['preparing'],
  preparing: ['ready'],
  ready: ['delivered'],
  delivered: ['completed'],
  completed: [],
  cancelled: []
}

const statusLabels = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  preparing: 'Đang chuẩn bị',
  ready: 'Sẵn sàng',
  delivered: 'Đã giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy'
}

const statusVariants = {
  pending: 'warning',
  confirmed: 'info',
  preparing: 'primary',
  ready: 'success',
  delivered: 'success',
  completed: 'success',
  cancelled: 'danger'
}

export function OrderManagerPage() {
  const { user } = useAuth()
  const [restaurants, setRestaurants] = useState([])
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
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
        fetchOrders(ownerRestaurants[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch restaurants:', error)
      showToast('Lỗi khi tải thông tin nhà hàng', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrders = async (restaurantId) => {
    try {
      const orderData = await orderApi.getByRestaurant(restaurantId)
      setOrders(orderData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      showToast('Lỗi khi tải đơn hàng', 'error')
    }
  }

  const handleStatusChange = async (order, newStatus) => {
    try {
      setUpdatingStatus(true)
      await orderApi.updateStatus(order.id, newStatus)
      showToast('Cập nhật trạng thái thành công!', 'success')
      setShowModal(false)
      fetchOrders(selectedRestaurant)
    } catch (error) {
      console.error('Failed to update status:', error)
      showToast('Lỗi khi cập nhật trạng thái', 'error')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const getFilteredOrders = () => {
    return filterStatus === 'all'
      ? orders
      : orders.filter((o) => o.status === filterStatus)
  }

  const filteredOrders = getFilteredOrders()

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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Quản lý Đơn hàng</h1>

        {/* Restaurant Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <label className="block text-gray-700 font-semibold mb-2">Chọn nhà hàng</label>
          <select
            value={selectedRestaurant}
            onChange={(e) => {
              const newRestaurantId = parseInt(e.target.value)
              setSelectedRestaurant(newRestaurantId)
              fetchOrders(newRestaurantId)
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

        {/* Status Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filterStatus === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
            >
              Tất cả ({orders.length})
            </button>
            {Object.entries(statusLabels).map(([status, label]) => {
              const count = orders.filter((o) => o.status === status).length
              return (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    filterStatus === status
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  {label} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              <p>Không có đơn hàng nào</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-900 font-semibold">Mã đơn</th>
                  <th className="px-6 py-3 text-left text-gray-900 font-semibold">Khách hàng</th>
                  <th className="px-6 py-3 text-left text-gray-900 font-semibold">Số món</th>
                  <th className="px-6 py-3 text-right text-gray-900 font-semibold">Tổng tiền</th>
                  <th className="px-6 py-3 text-center text-gray-900 font-semibold">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-gray-900 font-semibold">Thời gian</th>
                  <th className="px-6 py-3 text-center text-gray-900 font-semibold">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredOrders.map((order) => {
                  const itemCount = order.items?.length || 0
                  const total = order.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0
                  const orderDate = new Date(order.created_at).toLocaleString('vi-VN')

                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-gray-900">#{order.id}</td>
                      <td className="px-6 py-4 text-gray-600">{order.customer_name || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-600">{itemCount} món</td>
                      <td className="px-6 py-4 text-right font-semibold">₫{total.toFixed(0)}</td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant={statusVariants[order.status]}>
                          {statusLabels[order.status]}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{orderDate}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedOrder(order)
                            setShowModal(true)
                          }}
                          className="text-primary hover:text-red-700 transition font-semibold"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-96 overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Đơn hàng #{selectedOrder.id}</h2>
            </div>

            <div className="p-6">
              {/* Status Badge */}
              <div className="mb-4">
                <p className="text-gray-600 text-sm mb-2">Trạng thái hiện tại</p>
                <Badge variant={statusVariants[selectedOrder.status]}>
                  {statusLabels[selectedOrder.status]}
                </Badge>
              </div>

              {/* Items */}
              <div className="mb-4">
                <p className="text-gray-900 font-semibold mb-2">Các món</p>
                <div className="space-y-1 bg-gray-50 p-3 rounded">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.name} x{item.quantity}</span>
                      <span className="font-semibold">₫{(item.price * item.quantity).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="mb-4 pb-4 border-b">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Tổng cộng</span>
                  <span className="font-bold text-lg text-primary">
                    ₫{(selectedOrder.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0).toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Status Transitions */}
              <div>
                <p className="text-gray-900 font-semibold mb-2">Cập nhật trạng thái</p>
                <div className="space-y-2">
                  {statusTransitions[selectedOrder.status]?.map((nextStatus) => (
                    <button
                      key={nextStatus}
                      onClick={() => handleStatusChange(selectedOrder, nextStatus)}
                      disabled={updatingStatus}
                      className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 font-semibold"
                    >
                      {updatingStatus ? (
                        <Spinner size="sm" />
                      ) : (
                        `→ ${statusLabels[nextStatus]}`
                      )}
                    </button>
                  ))}

                  {statusTransitions[selectedOrder.status]?.length === 0 && (
                    <p className="text-gray-600 text-sm">Không thể cập nhật trạng thái này</p>
                  )}
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="p-6 border-t">
              <button
                onClick={() => setShowModal(false)}
                disabled={updatingStatus}
                className="w-full px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast {...toast} onClose={() => {}} />}
    </div>
  )
}
