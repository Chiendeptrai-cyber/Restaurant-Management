require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/order_db';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001';

app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  quantity: { type: Number, required: true },
  name: String,
  price: Number,
  subtotal: Number
}, { _id: false });

const orderSchema = new mongoose.Schema({
  items: { type: [orderItemSchema], required: true },
  total: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['confirmed', 'pending', 'product_service_unavailable'],
    default: 'pending'
  },
  note: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

async function fetchProduct(productId) {
  const response = await axios.get(`${PRODUCT_SERVICE_URL}/products/${productId}`, {
    timeout: 3000
  });
  return response.data;
}

app.get('/', (req, res) => {
  res.json({ service: 'order-service', status: 'running' });
});

app.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Unable to fetch orders', details: error.message });
  }
});

app.post('/orders', async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must include at least one item' });
  }

  const normalizedItems = items.map(item => ({
    productId: String(item.productId),
    quantity: Number(item.quantity)
  }));

  if (normalizedItems.some(item => !item.productId || item.quantity <= 0)) {
    return res.status(400).json({ error: 'Each order item must include a valid productId and quantity > 0' });
  }

  const orderData = {
    items: normalizedItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity
    })),
    total: 0,
    status: 'pending',
    note: ''
  };

  try {
    const products = await Promise.all(orderData.items.map(item => fetchProduct(item.productId)));

    let total = 0;
    orderData.items = orderData.items.map((item, index) => {
      const product = products[index];
      if (product.stock < item.quantity) {
        throw { type: 'stock', product, quantity: item.quantity };
      }
      const subtotal = product.price * item.quantity;
      total += subtotal;
      return {
        ...item,
        name: product.name,
        price: product.price,
        subtotal
      };
    });

    orderData.total = total;
    orderData.status = 'confirmed';
    orderData.note = 'Order confirmed with product validation from Product Service.';
  } catch (error) {
    if (error.type === 'stock') {
      return res.status(400).json({
        error: `Product "${error.product.name}" chỉ còn ${error.product.stock} đơn vị, nhưng yêu cầu ${error.quantity}.`
      });
    }

    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 404) {
        return res.status(400).json({ error: 'Một hoặc nhiều sản phẩm không tồn tại trong Product Service.' });
      }
      return res.status(502).json({ error: 'Product Service phản hồi lỗi khi kiểm tra sản phẩm.', details: error.response.data });
    }

    orderData.status = 'product_service_unavailable';
    orderData.note = 'Product Service unreachable. Order created pending review.';
  }

  try {
    const createdOrder = await Order.create(orderData);
    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ error: 'Unable to create order', details: error.message });
  }
});

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Order service listening on http://0.0.0.0:${PORT}`);
      console.log(`Product Service URL: ${PRODUCT_SERVICE_URL}`);
    });
  })
  .catch(error => {
    console.error('Order service failed to connect to MongoDB:', error.message);
    process.exit(1);
  });
