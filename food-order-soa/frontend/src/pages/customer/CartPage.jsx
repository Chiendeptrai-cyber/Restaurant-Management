// filepath: src/pages/customer/CartPage.jsx
import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CartContext } from '../../context/CartContext'
import { orderApi } from '../../api/orderApi'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { useToast, Toast } from '../../components/ui/Toast'

export function CartPage() {
  const navigate = useNavigate()
  const { items, restaurantId, clearCart, removeItem, updateQuantity, totalAmount } = useContext(CartContext)
  const [notes, setNotes] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, showToast] = useToast()

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      showToast('Vui lòng nhập địa chỉ giao hàng', 'warning')
      return
    }

    if (items.length === 0) {
      showToast('Giỏ hàng trống', 'warning')
      return
    }

    try {
      setLoading(true)
      const orderData = {
        restaurantId,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity
        }))
      }

      const response = await orderApi.create(orderData)
      showToast('Đặt hàng thành công!', 'success')
      clearCart()

      setTimeout(() => {
        navigate(`/orders/${response.orderId}`)
      }, 500)
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Đặt hàng thất bại'
      showToast(errorMsg, 'error')
      console.error('Order error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Giỏ hàng</h1>
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-6">Giỏ hàng của bạn trống</p>
            <Button onClick={() => navigate('/')}>Tiếp tục mua sắm</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Giỏ hàng</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-gray-900 font-semibold">Sản phẩm</th>
                    <th className="px-6 py-3 text-center text-gray-900 font-semibold">Giá</th>
                    <th className="px-6 py-3 text-center text-gray-900 font-semibold">Số lượng</th>
                    <th className="px-6 py-3 text-center text-gray-900 font-semibold">Thành tiền</th>
                    <th className="px-6 py-3 text-center text-gray-900 font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item) => (
                    <tr key={item.menuItemId}>
                      <td className="px-6 py-4">{item.name}</td>
                      <td className="px-6 py-4 text-center">₫{item.price.toFixed(0)}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                            className="text-gray-500 hover:text-primary transition"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                            className="text-gray-500 hover:text-primary transition"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-semibold">
                        ₫{(item.price * item.quantity).toFixed(0)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => removeItem(item.menuItemId)}
                          className="text-red-600 hover:text-red-800 transition"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Form */}
          <div className="bg-white rounded-lg shadow-md p-6 h-fit">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Tóm tắt đơn hàng</h2>

            <div className="mb-6 pb-6 border-b">
              <p className="text-gray-600 text-sm mb-2">Tổng tiền:</p>
              <p className="text-3xl font-bold text-primary">₫{totalAmount.toFixed(0)}</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Địa chỉ giao hàng *</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows="3"
                  placeholder="Nhập địa chỉ giao hàng"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Ghi chú (tùy chọn)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows="2"
                  placeholder="Ghi chú cho nhà hàng"
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              onClick={handlePlaceOrder}
              fullWidth
              size="lg"
              disabled={loading}
            >
              {loading ? <Spinner size="sm" /> : 'Đặt hàng'}
            </Button>
          </div>
        </div>
      </div>

      {toast && <Toast {...toast} onClose={() => {}} />}
    </div>
  )
}
