// filepath: services/restaurant-service/src/index.js
import express from 'express';
import 'dotenv/config';
import { initializeDatabase } from './db.js';
import restaurantRoutes from './routes/restaurants.js';
import menuRoutes from './routes/menu.js';
import internalRoutes from './routes/internal.js';

const app = express();
const PORT = process.env.PORT || 3002;

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
app.use('/restaurants', restaurantRoutes);
app.use('/menu-items', menuRoutes);
app.use('/internal', internalRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Restaurant service is healthy' });
});

// Initialize database and start server
initializeDatabase();

app.listen(PORT, () => {
  console.log(`🚀 Restaurant Service running on port ${PORT}`);
});
