import { formatCurrency } from '../utils/format';

function CartSummary({ cartCount, total, onPlaceOrder, loading }) {
  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-xl font-semibold">Tổng đơn hàng</h3>
      <div className="mb-4 flex items-center justify-between text-sm text-slate-600">
        <span>Tổng số món</span>
        <span>{cartCount}</span>
      </div>
      <div className="mb-6 flex items-center justify-between text-2xl font-semibold text-slate-900">
        <span>Tổng thanh toán</span>
        <span>{formatCurrency(total)}</span>
      </div>
      <button
        type="button"
        onClick={onPlaceOrder}
        disabled={loading}
        className="w-full rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {loading ? 'Đang gửi...' : 'Đặt hàng'}
      </button>
    </aside>
  );
}

export default CartSummary;
