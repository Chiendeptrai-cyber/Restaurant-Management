import ProductCard from './ProductCard';

function ProductPage({ loading, products, cart, cartCount, addToCart }) {
  const getReservedQuantity = productId => {
    const item = cart.find(item => item.productId === productId);
    return item?.quantity || 0;
  };

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
            <ProductCard
              key={product._id}
              product={product}
              reserved={getReservedQuantity(product._id)}
              onAdd={addToCart}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default ProductPage;
