// filepath: services/restaurant-service/src/routes/internal.js
import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET /internal/menu-items - Internal endpoint for order service
router.get('/menu-items', (req, res) => {
  try {
    const ids = req.query.ids?.split(',').map(id => parseInt(id)) || [];

    if (ids.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const placeholders = ids.map(() => '?').join(',');
    const menuItems = db.prepare(`
      SELECT id, name, price, available
      FROM menu_items
      WHERE id IN (${placeholders})
    `).all(...ids);

    res.json({ success: true, data: menuItems });
  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
