// filepath: api-gateway/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 8080;

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const RESTAURANT_SERVICE_URL = process.env.RESTAURANT_SERVICE_URL || 'http://localhost:3002';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004';

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Rate limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication attempts, please try again later' }
});

app.use('/api/auth', authLimiter);
app.use(generalLimiter);

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${Date.now() - start}ms`);
  });
  next();
});

/**
 * Build proxy headers, injecting user context after JWT verification.
 */
function buildHeaders(req) {
  const headers = { ...req.headers };
  delete headers['host'];
  delete headers['content-length'];
  if (req.user) {
    headers['x-user-id'] = String(req.user.userId);
    headers['x-user-role'] = req.user.role;
  }
  return headers;
}

/**
 * Generic proxy function that forwards the request to a downstream service.
 * Returns 503 if the downstream service is unavailable.
 */
async function proxyRequest(req, res, targetUrl) {
  try {
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: buildHeaders(req),
      data: req.method !== 'GET' && req.method !== 'DELETE' ? req.body : undefined,
      params: req.query,
      validateStatus: () => true // pass through all status codes
    });

    return res.status(response.status).json(response.data);
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
      return res.status(503).json({ success: false, error: 'Downstream service unavailable' });
    }
    console.error('Proxy error:', err.message);
    return res.status(503).json({ success: false, error: 'Service communication error' });
  }
}

// ─── Public routes (no JWT required) ─────────────────────────────────────────

app.all('/api/auth/*', (req, res) => {
  const path = req.path.replace('/api/auth', '/auth');
  proxyRequest(req, res, `${USER_SERVICE_URL}${path}`);
});

// ─── Protected routes (JWT required) ──────────────────────────────────────────

app.all('/api/users/*', authenticateToken, (req, res) => {
  const path = req.path.replace('/api/users', '/users');
  proxyRequest(req, res, `${USER_SERVICE_URL}${path}`);
});

app.all('/api/restaurants/*', authenticateToken, (req, res) => {
  const path = req.path.replace('/api/restaurants', '/restaurants');
  proxyRequest(req, res, `${RESTAURANT_SERVICE_URL}${path}`);
});

app.all('/api/menu-items/*', authenticateToken, (req, res) => {
  const path = req.path.replace('/api/menu-items', '/menu-items');
  proxyRequest(req, res, `${RESTAURANT_SERVICE_URL}${path}`);
});

app.all('/api/orders/*', authenticateToken, (req, res) => {
  const path = req.path.replace('/api/orders', '/orders');
  proxyRequest(req, res, `${ORDER_SERVICE_URL}${path}`);
});

app.all('/api/notifications/*', authenticateToken, (req, res) => {
  const path = req.path.replace('/api/notifications', '/notifications');
  proxyRequest(req, res, `${NOTIFICATION_SERVICE_URL}${path}`);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, data: { service: 'api-gateway', status: 'healthy' } });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`api-gateway running on port ${PORT}`);
});

module.exports = app;
