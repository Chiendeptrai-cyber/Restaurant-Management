// filepath: src/components/order/OrderStatusBadge.jsx
import { Badge } from '../ui/Badge'

const statusLabels = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  preparing: 'Đang chuẩn bị',
  ready: 'Sẵn sàng',
  delivered: 'Đã giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy'
}

export function OrderStatusBadge({ status }) {
  return <Badge variant={status}>{statusLabels[status]}</Badge>
}
