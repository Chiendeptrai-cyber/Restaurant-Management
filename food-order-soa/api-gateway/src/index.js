// filepath: api-gateway/src/index.js
import express from 'express';
import axios from 'axios';
import 'dotenv/config';
import { verifyJWT } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 8080;

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const RESTAURANT_SERVICE_URL = process.env.RESTAURANT_SERVICE_URL || 'http://localhost:3002';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004';

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Apply JWT verification
app.use(verifyJWT);

// Helper function to proxy requests
async function proxyRequest(req, res, targetUrl) {
  try {
    const config = {
      method: req.method,
      url: targetUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': req.headers['x-user-id'],
        'X-User-Role': req.headers['x-user-role']
      },
      data: ['POST', 'PUT', 'PATCH'].includes(req.method) ? req.body : undefined
    };

    const response = await axios(config);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`Proxy error for ${targetUrl}:`, error.message);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(503).json({ success: false, error: 'Service unavailable' });
    }
  }
}

// Route mappings
app.all('/api/auth/*', (req, res) => {
  const path = req.path.replace('/api/auth', '');
  proxyRequest(req, res, `${USER_SERVICE_URL}/auth${path}`);
});

app.all('/api/users/*', (req, res) => {
  const path = req.path.replace('/api/users', '');
  proxyRequest(req, res, `${USER_SERVICE_URL}/users${path}`);
});

app.all('/api/restaurants/*', (req, res) => {
  const path = req.path.replace('/api/restaurants', '');
  proxyRequest(req, res, `${RESTAURANT_SERVICE_URL}/restaurants${path}`);
});

app.all('/api/menu-items/*', (req, res) => {
  const path = req.path.replace('/api/menu-items', '');
  proxyRequest(req, res, `${RESTAURANT_SERVICE_URL}/menu-items${path}`);
});

app.all('/api/orders/*', (req, res) => {
  const path = req.path.replace('/api/orders', '');
  proxyRequest(req, res, `${ORDER_SERVICE_URL}/orders${path}`);
});

app.all('/api/notifications/*', (req, res) => {
  const path = req.path.replace('/api/notifications', '');
  proxyRequest(req, res, `${NOTIFICATION_SERVICE_URL}/notifications${path}`);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'API Gateway is healthy' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📍 User Service: ${USER_SERVICE_URL}`);
  console.log(`📍 Restaurant Service: ${RESTAURANT_SERVICE_URL}`);
  console.log(`📍 Order Service: ${ORDER_SERVICE_URL}`);
  console.log(`📍 Notification Service: ${NOTIFICATION_SERVICE_URL}`);
});
