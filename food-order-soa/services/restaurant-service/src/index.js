// filepath: food-order-soa/services/restaurant-service/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const restaurantRoutes = require('./routes/restaurants');
const menuRoutes = require('./routes/menu');
const internalRoutes = require('./routes/internal');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[restaurant-service] ${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

app.use('/restaurants', restaurantRoutes);
app.use('/menu-items', menuRoutes);
app.use('/internal', internalRoutes);

app.get('/health', (req, res) => {
  res.json({ success: true, data: { service: 'restaurant-service', status: 'ok' } });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`restaurant-service running on port ${PORT}`);
});

module.exports = app;
