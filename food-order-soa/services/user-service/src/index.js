// filepath: services/user-service/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

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

app.use('/auth', authRoutes);
app.use('/users', authRoutes);

app.get('/health', (req, res) => {
  res.json({ success: true, data: { service: 'user-service', status: 'healthy' } });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`user-service running on port ${PORT}`);
});

module.exports = app;
