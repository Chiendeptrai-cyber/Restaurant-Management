import { useEffect, useMemo, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { fetchProducts, createOrder } from './services/api';
import TopNav from './components/TopNav';
import Banner from './components/Banner';
import ProductPage from './components/ProductPage';
import CartPage from './components/CartPage';

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchProducts();
        setProducts(data);
      } catch (err) {
        setError('Không thể tải danh sách món. Vui lòng kiểm tra Product Service.');
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.quantity * item.price, 0), [cart]);

  const getCartQuantity = productId => {
    const item = cart.find(item => item.productId === productId);
    return item?.quantity || 0;
  };

  const addToCart = product => {
    const reserved = getCartQuantity(product._id);

    if (reserved >= product.stock) {
      setError(`Không thể thêm "${product.name}" nữa, chỉ còn ${Math.max(product.stock - reserved, 0)} trong kho.`);
      return;
    }

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

  const removeFromCart = productId => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    setCart(prev =>
      prev
        .map(item => (item.productId === productId ? { ...item, quantity: Math.max(1, quantity) } : item))
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
      const response = await createOrder(cart.map(item => ({ productId: item.productId, quantity: item.quantity })));

      if (response.status === 'product_service_unavailable') {
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
          <TopNav cartCount={cartCount} />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <Banner message={message} error={error} />

        <Routes>
          <Route
            path="/"
            element={
              <ProductPage loading={loading} products={products} cart={cart} cartCount={cartCount} addToCart={addToCart} />
            }
          />
          <Route
            path="/cart"
            element={
              <CartPage
                cart={cart}
                total={cartTotal}
                cartCount={cartCount}
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

export default App;
