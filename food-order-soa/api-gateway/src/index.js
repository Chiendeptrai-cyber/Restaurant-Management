// filepath: food-order-soa/api-gateway/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 8080;

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const RESTAURANT_SERVICE_URL = process.env.RESTAURANT_SERVICE_URL || 'http://localhost:3002';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004';

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[api-gateway] ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

/**
 * Generic proxy function: forwards request to target service
 */
async function proxyRequest(req, res, targetBaseUrl, targetPath) {
  try {
    const url = `${targetBaseUrl}${targetPath}`;
    const headers = { ...req.headers };

    // Remove host header to avoid conflicts
    delete headers['host'];

    const response = await axios({
      method: req.method,
      url,
      headers,
      data: req.body,
      params: req.query,
      timeout: 10000,
      validateStatus: () => true // Don't throw on non-2xx
    });

    // Forward response headers (content-type etc.)
    const contentType = response.headers['content-type'];
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    return res.status(response.status).json(response.data);
  } catch (err) {
    console.error(`Proxy error to ${targetBaseUrl}${targetPath}:`, err.message);
    return res.status(503).json({
      success: false,
      error: 'Service unavailable. Please try again later.'
    });
  }
}

// ─── Public routes (no auth required) ───────────────────────────────────────

// POST /api/auth/register
app.post('/api/auth/register', (req, res) => {
  proxyRequest(req, res, USER_SERVICE_URL, '/auth/register');
});

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  proxyRequest(req, res, USER_SERVICE_URL, '/auth/login');
});

// ─── Protected routes (auth required) ────────────────────────────────────────

// GET /api/users/me
app.get('/api/users/me', authMiddleware, (req, res) => {
  proxyRequest(req, res, USER_SERVICE_URL, '/users/me');
});

// /api/restaurants/* → restaurant-service:3002/restaurants/*
app.all('/api/restaurants*', authMiddleware, (req, res) => {
  const targetPath = req.path.replace('/api/restaurants', '/restaurants');
  proxyRequest(req, res, RESTAURANT_SERVICE_URL, targetPath);
});

// /api/menu-items/* → restaurant-service:3002/menu-items/*
app.all('/api/menu-items*', authMiddleware, (req, res) => {
  const targetPath = req.path.replace('/api/menu-items', '/menu-items');
  proxyRequest(req, res, RESTAURANT_SERVICE_URL, targetPath);
});

// /api/orders/* → order-service:3003/orders/*
app.all('/api/orders*', authMiddleware, (req, res) => {
  const targetPath = req.path.replace('/api/orders', '/orders');
  proxyRequest(req, res, ORDER_SERVICE_URL, targetPath);
});

// /api/notifications/* → notification-service:3004/notifications/*
app.all('/api/notifications*', authMiddleware, (req, res) => {
  const targetPath = req.path.replace('/api/notifications', '/notifications');
  proxyRequest(req, res, NOTIFICATION_SERVICE_URL, targetPath);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, data: { service: 'api-gateway', status: 'ok' } });
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`api-gateway running on port ${PORT}`);
  console.log(`Routes:`);
  console.log(`  /api/auth/*           → user-service:3001`);
  console.log(`  /api/users/*          → user-service:3001`);
  console.log(`  /api/restaurants/*    → restaurant-service:3002`);
  console.log(`  /api/menu-items/*     → restaurant-service:3002`);
  console.log(`  /api/orders/*         → order-service:3003`);
  console.log(`  /api/notifications/*  → notification-service:3004`);
});

module.exports = app;
