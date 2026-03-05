// filepath: src/pages/auth/RegisterPage.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../../api/authApi'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { useToast, Toast } from '../../components/ui/Toast'

export function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer'
  })
  const [loading, setLoading] = useState(false)
  const [toast, showToast] = useToast()
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.password) {
      showToast('Vui lòng nhập đầy đủ thông tin', 'warning')
      return
    }

    try {
      setLoading(true)
      const response = await authApi.register(
        formData.name,
        formData.email,
        formData.password,
        formData.role
      )

      login(response.token, {
        userId: response.userId,
        email: response.email,
        role: response.role,
        name: formData.name
      })

      showToast('Đăng ký thành công!', 'success')

      setTimeout(() => {
        if (formData.role === 'owner') {
          navigate('/dashboard')
        } else {
          navigate('/')
        }
      }, 500)
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Đăng ký thất bại'
      showToast(errorMsg, 'error')
      console.error('Register error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">Đăng ký</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Tên</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="John Doe"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="john@example.com"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Mật khẩu</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Vai trò</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="customer"
                  checked={formData.role === 'customer'}
                  onChange={handleChange}
                  disabled={loading}
                  className="mr-2"
                />
                <span>Khách hàng</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="owner"
                  checked={formData.role === 'owner'}
                  onChange={handleChange}
                  disabled={loading}
                  className="mr-2"
                />
                <span>Chủ nhà hàng</span>
              </label>
            </div>
          </div>

          <Button type="submit" fullWidth disabled={loading} size="lg">
            {loading ? <Spinner size="sm" /> : 'Đăng ký'}
          </Button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-primary hover:underline font-semibold">
            Đăng nhập
          </Link>
        </p>
      </div>

      {toast && <Toast {...toast} onClose={() => {}} />}
    </div>
  )
}
