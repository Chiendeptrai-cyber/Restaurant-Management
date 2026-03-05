// filepath: src/pages/customer/OrderDetailPage.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { orderApi } from '../../api/orderApi'
import { OrderStatusBadge } from '../../components/order/OrderStatusBadge'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { useToast, Toast } from '../../components/ui/Toast'

const statusSteps = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'completed']
const statusLabels = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  preparing: 'Đang chuẩn bị',
  ready: 'Sẵn sàng',
  delivered: 'Đã giao',
  completed: 'Hoàn thành'
}

export function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [toast, showToast] = useToast()

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true)
        const data = await orderApi.getById(id)
        setOrder(data)
      } catch (error) {
        console.error('Failed to fetch order:', error)
        showToast('Lỗi khi tải thông tin đơn hàng', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [id])

  const handleCancel = async () => {
    if (!confirm('Bạn chắc chắn muốn hủy đơn hàng này?')) return

    try {
      setCancelling(true)
      await orderApi.cancel(id)
      showToast('Đơn hàng đã được hủy', 'success')
      setOrder((prev) => ({ ...prev, status: 'cancelled' }))
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Hủy đơn hàng thất bại'
      showToast(errorMsg, 'error')
      console.error('Cancel error:', error)
    } finally {
      setCancelling(false)
    }
  }

  const handleCompleteOrder = async () => {
    if (!confirm('Bạn chắc chắn đã nhận được đơn hàng?')) return

    try {
      setCancelling(true)
      await orderApi.updateStatus(id, 'completed')
      showToast('Cảm ơn bạn đã sử dụng dịch vụ!', 'success')
      setOrder((prev) => ({ ...prev, status: 'completed' }))
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Cập nhật thất bại'
      showToast(errorMsg, 'error')
      console.error('Update error:', error)
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600 text-lg">Đơn hàng không tìm thấy</p>
      </div>
    )
  }

  const currentStepIndex = statusSteps.indexOf(order.status)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Đơn hàng #{order.id}</h1>
          <OrderStatusBadge status={order.status} />
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-8">Trạng thái đơn hàng</h2>
          <div className="flex items-center justify-between mb-8">
            {statusSteps.map((status, index) => (
              <div key={status} className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white mb-2 ${
                    index <= currentStepIndex ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  {index < currentStepIndex ? '✓' : index + 1}
                </div>
                <span className="text-xs text-center font-semibold text-gray-700">
                  {statusLabels[status]}
                </span>
                {index < statusSteps.length - 1 && (
                  <div
                    className={`w-12 h-1 mt-2 ${index < currentStepIndex ? 'bg-primary' : 'bg-gray-300'}`}
                  ></div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t pt-8">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-gray-600 text-sm mb-1">Ngày đặt hàng</p>
                <p className="text-gray-900 font-semibold">
                  {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Tổng tiền</p>
                <p className="text-2xl font-bold text-primary">₫{order.total.toFixed(0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Các mặt hàng</h2>
          <div className="space-y-4">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between items-center pb-4 border-b">
                <div>
                  <p className="font-semibold text-gray-900">{item.menu_item_id}</p>
                  <p className="text-sm text-gray-600">x{item.quantity}</p>
                </div>
                <p className="font-semibold text-gray-900">
                  ₫{(item.price * item.quantity).toFixed(0)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button variant="ghost" onClick={() => navigate('/orders')}>
            Quay lại
          </Button>

          {order.status === 'pending' && (
            <Button variant="danger" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? <Spinner size="sm" /> : 'Hủy đơn hàng'}
            </Button>
          )}

          {order.status === 'delivered' && (
            <Button onClick={handleCompleteOrder} disabled={cancelling}>
              {cancelling ? <Spinner size="sm" /> : 'Xác nhận đã nhận'}
            </Button>
          )}
        </div>
      </div>

      {toast && <Toast {...toast} onClose={() => {}} />}
    </div>
  )
}
