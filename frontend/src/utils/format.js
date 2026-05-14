export function formatCurrency(value) {
  return value.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + '₫';
}
