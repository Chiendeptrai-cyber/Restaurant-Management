// filepath: food-order-soa/services/restaurant-service/src/routes/internal.js
const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /internal/restaurants/:id — internal use by order-service to get owner_id
router.get('/restaurants/:id', (req, res) => {
  try {
    const restaurant = db.prepare('SELECT id, owner_id, status FROM restaurants WHERE id = ?').get(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }
    return res.status(200).json({ success: true, data: restaurant });
  } catch (err) {
    console.error('Internal get restaurant error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /internal/menu-items?ids=1,2,3 — internal use by order-service
router.get('/menu-items', (req, res) => {
  try {
    const { ids } = req.query;
    if (!ids) {
      return res.status(400).json({ success: false, error: 'ids query parameter is required' });
    }

    const idList = ids.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
    if (idList.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid ids provided' });
    }

    const placeholders = idList.map(() => '?').join(',');
    const items = db.prepare(
      `SELECT id, name, price, available FROM menu_items WHERE id IN (${placeholders})`
    ).all(...idList);

    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error('Internal menu-items error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
