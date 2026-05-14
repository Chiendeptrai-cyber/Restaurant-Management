import { formatCurrency } from '../utils/format';

function ProductCard({ product, reserved, onAdd }) {
  const available = Math.max(product.stock - reserved, 0);
  const canAdd = available > 0;

  return (
    <article className="card-shadow rounded-3xl bg-white p-5">
      <img
        src={`https://via.placeholder.com/400x260?text=${encodeURIComponent(product.name)}`}
        alt={product.name}
        className="mb-4 h-44 w-full rounded-3xl object-cover"
      />
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">{product.name}</h3>
          <p className="text-sm text-slate-500">{product.description || 'Không có mô tả'}</p>
        </div>
        <div className="text-right text-lg font-semibold text-slate-900">{formatCurrency(product.price)}</div>
      </div>
      <div className="mb-4 flex items-center justify-between text-sm text-slate-500">
        <span>Kho còn: {available}</span>
        <span>ID: {product._id.slice(-6)}</span>
      </div>
      <button
        type="button"
        onClick={() => onAdd(product)}
        disabled={!canAdd}
        className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${
          canAdd ? 'bg-slate-900 hover:bg-slate-700' : 'bg-slate-400 cursor-not-allowed'
        }`}
      >
        {canAdd ? 'Thêm vào giỏ' : 'Hết hàng'}
      </button>
    </article>
  );
}

export default ProductCard;
