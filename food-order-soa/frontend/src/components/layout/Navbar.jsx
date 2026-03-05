// filepath: src/components/layout/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../hooks/useNotifications'
import { useContext, useState } from 'react'
import { CartContext } from '../../context/CartContext'
import { Badge } from '../ui/Badge'

export function Navbar() {
  const { user, logout } = useAuth()
  const { totalItems } = useContext(CartContext)
  const { unreadCount, notifications, fetchNotifications } = useNotifications()
  const [showNotifications, setShowNotifications] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
  }

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications)
    if (!showNotifications) {
      fetchNotifications()
    }
  }

  if (!user) {
    return (
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-primary">
            🍕 FoodOrder
          </Link>
          <div className="flex gap-4">
            <Link to="/login" className="text-gray-700 hover:text-primary transition">
              Đăng nhập
            </Link>
            <Link to="/register" className="text-gray-700 hover:text-primary transition">
              Đăng ký
            </Link>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-primary">
          🍕 FoodOrder
        </Link>

        <div className="flex gap-6 items-center">
          {user.role === 'customer' && (
            <>
              <Link to="/" className="text-gray-700 hover:text-primary transition">
                Trang chủ
              </Link>
              <Link to="/orders" className="text-gray-700 hover:text-primary transition">
                Đơn hàng
              </Link>
            </>
          )}

          {user.role === 'owner' && (
            <>
              <Link to="/dashboard" className="text-gray-700 hover:text-primary transition">
                Dashboard
              </Link>
              <Link to="/dashboard/menu" className="text-gray-700 hover:text-primary transition">
                Quản lý Menu
              </Link>
              <Link to="/dashboard/orders" className="text-gray-700 hover:text-primary transition">
                Quản lý Đơn
              </Link>
            </>
          )}

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={handleNotificationClick}
              className="relative text-gray-700 hover:text-primary transition text-xl"
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-gray-500 text-center">Không có thông báo</div>
                ) : (
                  <>
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 border-b ${notif.is_read ? 'bg-gray-50' : 'bg-blue-50'}`}
                      >
                        <p className="text-sm font-semibold text-gray-800">{notif.type}</p>
                        <p className="text-sm text-gray-600">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notif.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                    <Link
                      to="/notifications"
                      className="block p-4 text-center text-primary hover:bg-gray-50 transition text-sm font-semibold"
                    >
                      Xem tất cả
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Cart Button (customer only) */}
          {user.role === 'customer' && (
            <Link
              to="/cart"
              className="relative text-gray-700 hover:text-primary transition text-xl"
            >
              🛒
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-primary rounded-full">
                  {totalItems}
                </span>
              )}
            </Link>
          )}

          {/* User Menu */}
          <div className="flex items-center gap-2">
            <span className="text-gray-700">{user.name}</span>
            <button
              onClick={handleLogout}
              className="text-gray-700 hover:text-primary transition"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
