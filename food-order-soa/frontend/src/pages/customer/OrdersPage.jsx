// filepath: src/pages/customer/OrdersPage.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { orderApi } from '../../api/orderApi'
import { OrderStatusBadge } from '../../components/order/OrderStatusBadge'
import { Spinner } from '../../components/ui/Spinner'
import { useToast, Toast } from '../../components/ui/Toast'

export function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, showToast] = useToast()

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        const data = await orderApi.getMyOrders()
        setOrders(data)
      } catch (error) {
        console.error('Failed to fetch orders:', error)
        showToast('Lỗi khi tải danh sách đơn hàng', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Đơn hàng của tôi</h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg mb-6">Bạn chưa có đơn hàng nào</p>
            <Link to="/" className="text-primary hover:underline font-semibold">
              Đặt đơn đầu tiên
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-900 font-semibold">ID Đơn</th>
                  <th className="px-6 py-3 text-left text-gray-900 font-semibold">Nhà hàng</th>
                  <th className="px-6 py-3 text-right text-gray-900 font-semibold">Tổng tiền</th>
                  <th className="px-6 py-3 text-center text-gray-900 font-semibold">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-gray-900 font-semibold">Ngày đặt</th>
                  <th className="px-6 py-3 text-center text-gray-900 font-semibold">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold">#{order.id}</td>
                    <td className="px-6 py-4">Nhà hàng {order.restaurant_id}</td>
                    <td className="px-6 py-4 text-right font-semibold">
                      ₫{order.total.toFixed(0)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        to={`/orders/${order.id}`}
                        className="text-primary hover:underline font-semibold"
                      >
                        Xem chi tiết
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && <Toast {...toast} onClose={() => {}} />}
    </div>
  )
}
