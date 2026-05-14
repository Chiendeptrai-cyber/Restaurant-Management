import { formatCurrency } from '../utils/format';

function CartItem({ item, onRemove, onUpdate }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold">{item.name}</h3>
          <p className="text-sm text-slate-500">Giá: {formatCurrency(item.price)}</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="1"
            value={item.quantity}
            onChange={e => onUpdate(item.productId, Number(e.target.value))}
            className="w-20 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => onRemove(item.productId)}
            className="rounded-2xl bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-200"
          >
            Xóa
          </button>
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-600">Thành tiền: {formatCurrency(item.price * item.quantity)}</p>
    </div>
  );
}

export default CartItem;
