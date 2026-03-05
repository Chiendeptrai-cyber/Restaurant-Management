// filepath: src/pages/NotFoundPage.jsx
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Trang không tìm thấy</h2>
        <p className="text-gray-600 text-lg mb-8 max-w-md">
          Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
        </p>
        <Link to="/">
          <Button size="lg">Về trang chủ</Button>
        </Link>
      </div>
    </div>
  )
}
