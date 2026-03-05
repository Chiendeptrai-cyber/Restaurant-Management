// filepath: services/order-service/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.path} ${res.statusCode} - ${Date.now() - start}ms`);
  });
  next();
});

app.use('/orders', orderRoutes);

app.get('/health', (req, res) => {
  res.json({ success: true, data: { service: 'order-service', status: 'healthy' } });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`order-service running on port ${PORT}`);
});

module.exports = app;
