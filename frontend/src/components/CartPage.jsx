import CartItem from './CartItem';
import CartSummary from './CartSummary';

function CartPage({ cart, total, cartCount, removeFromCart, updateQuantity, onPlaceOrder, loading }) {
  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-semibold">Giỏ hàng</h2>
          <p className="text-slate-500">Kiểm tra lại đơn hàng trước khi gửi đến Order Service.</p>
        </div>
      </div>

      {cart.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
          Giỏ hàng trống. Vui lòng chọn món ở trang sản phẩm.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.7fr_0.9fr]">
          <div className="space-y-4">
            {cart.map(item => (
              <CartItem
                key={item.productId}
                item={item}
                onRemove={removeFromCart}
                onUpdate={updateQuantity}
              />
            ))}
          </div>

          <CartSummary cartCount={cartCount} total={total} onPlaceOrder={onPlaceOrder} loading={loading} />
        </div>
      )}
    </section>
  );
}

export default CartPage;
