// filepath: services/notification-service/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const notificationRoutes = require('./routes/notifications');
const internalRoutes = require('./routes/internal');

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later' }
});

app.use(generalLimiter);

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.path} ${res.statusCode} - ${Date.now() - start}ms`);
  });
  next();
});

app.use('/notifications', notificationRoutes);
app.use('/internal', internalRoutes);

app.get('/health', (req, res) => {
  res.json({ success: true, data: { service: 'notification-service', status: 'healthy' } });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`notification-service running on port ${PORT}`);
});

module.exports = app;
