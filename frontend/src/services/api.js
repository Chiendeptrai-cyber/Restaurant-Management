import axios from 'axios';

const PRODUCT_API = import.meta.env.VITE_PRODUCT_API_URL || 'http://localhost:3001';
const ORDER_API = import.meta.env.VITE_ORDER_API_URL || 'http://localhost:3002';

export async function fetchProducts() {
  const response = await axios.get(`${PRODUCT_API}/products`);
  return response.data;
}

export async function createOrder(items) {
  const response = await axios.post(`${ORDER_API}/orders`, { items });
  return response.data;
}
