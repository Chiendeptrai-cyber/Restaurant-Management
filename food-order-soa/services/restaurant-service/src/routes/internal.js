// filepath: services/restaurant-service/src/routes/internal.js
const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /internal/menu-items?ids=1,2,3
// Used internally by order-service to verify prices
router.get('/menu-items', (req, res) => {
  try {
    const { ids } = req.query;
    if (!ids) {
      return res.status(400).json({ success: false, error: 'ids query parameter is required' });
    }

    const idList = ids.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    if (idList.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid ids provided' });
    }

    const placeholders = idList.map(() => '?').join(',');
    const items = db.prepare(
      `SELECT id, name, price, available, restaurant_id FROM menu_items WHERE id IN (${placeholders})`
    ).all(...idList);

    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error('Internal menu-items error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
