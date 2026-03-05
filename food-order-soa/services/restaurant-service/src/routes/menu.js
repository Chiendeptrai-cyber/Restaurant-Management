// filepath: services/restaurant-service/src/routes/menu.js
const express = require('express');
const db = require('../db');

const router = express.Router();

// PUT /menu-items/:id — role: owner
router.put('/:id', (req, res) => {
  try {
    const ownerId = req.headers['x-user-id'];
    const role = req.headers['x-user-role'];

    if (role !== 'owner') {
      return res.status(403).json({ success: false, error: 'Only owners can update menu items' });
    }

    const item = db.prepare('SELECT mi.*, r.owner_id FROM menu_items mi JOIN restaurants r ON mi.restaurant_id = r.id WHERE mi.id = ?').get(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Menu item not found' });
    }

    if (String(item.owner_id) !== String(ownerId)) {
      return res.status(403).json({ success: false, error: 'You can only update menu items for your own restaurants' });
    }

    const { name, price, category, available } = req.body;
    db.prepare(
      'UPDATE menu_items SET name = ?, price = ?, category = ?, available = ? WHERE id = ?'
    ).run(
      name || item.name,
      price !== undefined ? price : item.price,
      category || item.category,
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

// PATCH /menu-items/:id/toggle — role: owner
router.patch('/:id/toggle', (req, res) => {
  try {
    const ownerId = req.headers['x-user-id'];
    const role = req.headers['x-user-role'];

    if (role !== 'owner') {
      return res.status(403).json({ success: false, error: 'Only owners can toggle menu items' });
    }

    const item = db.prepare('SELECT mi.*, r.owner_id FROM menu_items mi JOIN restaurants r ON mi.restaurant_id = r.id WHERE mi.id = ?').get(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Menu item not found' });
    }

    if (String(item.owner_id) !== String(ownerId)) {
      return res.status(403).json({ success: false, error: 'You can only toggle menu items for your own restaurants' });
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
