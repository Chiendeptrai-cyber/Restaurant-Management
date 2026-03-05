// filepath: src/pages/auth/LoginPage.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../../api/authApi'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { useToast, Toast } from '../../components/ui/Toast'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, showToast] = useToast()
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email || !password) {
      showToast('Vui lòng nhập đầy đủ thông tin', 'warning')
      return
    }

    try {
      setLoading(true)
      const response = await authApi.login(email, password)
      login(response.token, { userId: response.userId, email: response.email, role: response.role, name: response.email })
      showToast('Đăng nhập thành công!', 'success')
      
      // Redirect based on role
      setTimeout(() => {
        if (response.role === 'owner') {
          navigate('/dashboard')
        } else {
          navigate('/')
        }
      }, 500)
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Đăng nhập thất bại'
      showToast(errorMsg, 'error')
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">Đăng nhập</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="admin@example.com"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="123456"
              disabled={loading}
            />
          </div>

          <Button type="submit" fullWidth disabled={loading} size="lg">
            {loading ? <Spinner size="sm" /> : 'Đăng nhập'}
          </Button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-primary hover:underline font-semibold">
            Đăng ký
          </Link>
        </p>

        <div className="mt-6 p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
          <p className="font-semibold mb-2">Tài khoản test:</p>
          <p>Khách hàng: customer@example.com / 123456</p>
          <p>Chủ nhà hàng: owner@example.com / 123456</p>
        </div>
      </div>

      {toast && <Toast {...toast} onClose={() => {}} />}
    </div>
  )
}
