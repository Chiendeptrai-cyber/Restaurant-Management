import { useEffect, useMemo, useState } from 'react';
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import axios from 'axios';

const PRODUCT_API = import.meta.env.VITE_PRODUCT_API_URL || 'http://localhost:3001';
const ORDER_API = import.meta.env.VITE_ORDER_API_URL || 'http://localhost:3002';

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${PRODUCT_API}/products`)
      .then(response => setProducts(response.data))
      .catch(err => {
        setError('Không thể tải danh sách món. Vui lòng kiểm tra Product Service.');
      })
      .finally(() => setLoading(false));
  }, []);

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity * item.price, 0),
    [cart]
  );

  const addToCart = product => {
    setMessage(null);
    setError(null);
    setCart(prev => {
      const exists = prev.find(item => item.productId === product._id);
      if (exists) {
        return prev.map(item =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { productId: product._id, name: product.name, price: product.price, quantity: 1 }];
    });
  };

  const removeFromCart = id => {
    setCart(prev => prev.filter(item => item.productId !== id));
  };

  const updateQuantity = (id, quantity) => {
    setCart(prev =>
      prev
        .map(item => (item.productId === id ? { ...item, quantity: Math.max(1, quantity) } : item))
        .filter(item => item.quantity > 0)
    );
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      setError('Giỏ hàng của bạn đang trống. Vui lòng chọn món trước khi đặt hàng.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await axios.post(`${ORDER_API}/orders`, {
        items: cart.map(item => ({ productId: item.productId, quantity: item.quantity }))
      });

      if (response.data.status === 'product_service_unavailable') {
        setMessage('Đơn hàng đã được ghi nhận, nhưng Product Service hiện không khả dụng. Đơn sẽ được xử lý khi dịch vụ được khôi phục.');
      } else {
        setMessage('Đơn hàng của bạn đã được tạo thành công!');
      }
      setCart([]);
      navigate('/cart');
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Không thể gửi đơn hàng. Vui lòng kiểm tra Order Service.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">Food Ordering SOA Demo</h1>
            <p className="text-sm text-slate-500">Product Service, Order Service và Frontend riêng biệt.</p>
          </div>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded-2xl px-3 py-2 transition ${isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'}`
              }
            >
              Sản phẩm
            </NavLink>
            <NavLink
              to="/cart"
              className={({ isActive }) =>
                `rounded-2xl px-3 py-2 transition ${isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'}`
              }
            >
              Giỏ hàng ({cartCount})
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {message && <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">{message}</div>}
        {error && <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">{error}</div>}

        <Routes>
          <Route
            path="/"
            element={
              <ProductPage
                loading={loading}
                products={products}
                addToCart={addToCart}
                cartCount={cartCount}
              />
            }
          />
          <Route
            path="/cart"
            element={
              <CartPage
                cart={cart}
                total={cartTotal}
                removeFromCart={removeFromCart}
                updateQuantity={updateQuantity}
                onPlaceOrder={handlePlaceOrder}
                loading={loading}
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
}

function ProductPage({ loading, products, addToCart, cartCount }) {
  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-semibold">Danh sách món ăn</h2>
          <p className="text-slate-500">Chọn món từ Product Service và thêm vào giỏ hàng.</p>
        </div>
        <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
          {cartCount} món trong giỏ hàng
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">Đang tải sản phẩm...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map(product => (
            <article key={product._id} className="card-shadow rounded-3xl bg-white p-5">
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
                <div className="text-right text-lg font-semibold text-slate-900">{product.price.toLocaleString()}₫</div>
              </div>
              <div className="mb-4 flex items-center justify-between text-sm text-slate-500">
                <span>Kho: {product.stock}</span>
                <span>ID: {product._id.slice(-6)}</span>
              </div>
              <button
                type="button"
                onClick={() => addToCart(product)}
                className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Thêm vào giỏ
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function CartPage({ cart, total, removeFromCart, updateQuantity, onPlaceOrder, loading }) {
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
              <div key={item.productId} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{item.name}</h3>
                    <p className="text-sm text-slate-500">Giá: {item.price.toLocaleString()}₫</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e => updateQuantity(item.productId, Number(e.target.value))}
                      className="w-20 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId)}
                      className="rounded-2xl bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-200"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-600">Thành tiền: {(item.price * item.quantity).toLocaleString()}₫</p>
              </div>
            ))}
          </div>

          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-xl font-semibold">Tổng đơn hàng</h3>
            <div className="mb-4 flex items-center justify-between text-sm text-slate-600">
              <span>Tổng số món</span>
              <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
            </div>
            <div className="mb-6 flex items-center justify-between text-2xl font-semibold text-slate-900">
              <span>Tổng thanh toán</span>
              <span>{total.toLocaleString()}₫</span>
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
        </div>
      )}
    </section>
  );
}

export default App;
