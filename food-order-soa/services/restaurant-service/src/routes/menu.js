// filepath: food-order-soa/services/restaurant-service/src/routes/menu.js
const express = require('express');
const db = require('../db');

const router = express.Router();

// PUT /menu-items/:id — update menu item (owner only)
router.put('/:id', (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'owner') {
      return res.status(403).json({ success: false, error: 'Only owners can update menu items' });
    }

    const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Menu item not found' });
    }

    const restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(item.restaurant_id);
    if (!restaurant || String(restaurant.owner_id) !== String(userId)) {
      return res.status(403).json({ success: false, error: 'You can only update items from your own restaurant' });
    }

    const { name, price, category, available } = req.body;
    db.prepare(
      'UPDATE menu_items SET name = ?, price = ?, category = ?, available = ? WHERE id = ?'
    ).run(
      name !== undefined ? name : item.name,
      price !== undefined ? price : item.price,
      category !== undefined ? category : item.category,
      available !== undefined ? (available ? 1 : 0) : item.available,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id);
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('Update menu item error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /menu-items/:id/toggle — toggle available (owner only)
router.patch('/:id/toggle', (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'owner') {
      return res.status(403).json({ success: false, error: 'Only owners can toggle menu items' });
    }

    const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Menu item not found' });
    }

    const restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(item.restaurant_id);
    if (!restaurant || String(restaurant.owner_id) !== String(userId)) {
      return res.status(403).json({ success: false, error: 'You can only toggle items from your own restaurant' });
    }

    const newAvailable = item.available === 1 ? 0 : 1;
    db.prepare('UPDATE menu_items SET available = ? WHERE id = ?').run(newAvailable, req.params.id);

    const updated = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id);
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('Toggle menu item error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
