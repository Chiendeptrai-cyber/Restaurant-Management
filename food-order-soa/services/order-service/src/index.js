// filepath: services/order-service/src/index.js
import express from 'express';
import 'dotenv/config';
import { initializeDatabase } from './db.js';
import orderRoutes from './routes/orders.js';

const app = express();
const PORT = process.env.PORT || 3003;

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
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id, X-User-Role');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Routes
app.use('/orders', orderRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Order service is healthy' });
});

// Initialize database and start server
initializeDatabase();

app.listen(PORT, () => {
  console.log(`🚀 Order Service running on port ${PORT}`);
});
