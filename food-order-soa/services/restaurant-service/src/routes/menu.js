// filepath: services/restaurant-service/src/routes/menu.js
import express from 'express';
import db from '../db.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// POST /restaurants/:id/menu - Add menu item
router.post('/:restaurantId/menu', verifyToken, checkRole(['owner']), (req, res) => {
  try {
    const { name, price, category, available = 1 } = req.body;
    const restaurantId = req.params.restaurantId;

    if (!name || price === undefined || !category) {
      return res.status(400).json({ success: false, error: 'Name, price, and category required' });
    }

    // Check ownership
    const restaurant = db.prepare('SELECT owner_id FROM restaurants WHERE id = ?').get(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }

    if (restaurant.owner_id !== req.user.userId) {
      return res.status(403).json({ success: false, error: 'You can only edit your own restaurant' });
    }

    const stmt = db.prepare(`
      INSERT INTO menu_items (restaurant_id, name, price, category, available)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(restaurantId, name, price, category, available ? 1 : 0);

    res.status(201).json({
      success: true,
      data: { id: result.lastInsertRowid, restaurant_id: restaurantId, name, price, category, available }
    });
  } catch (error) {
    console.error('Add menu item error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /menu-items/:id - Update menu item
router.put('/:id', verifyToken, checkRole(['owner']), (req, res) => {
  try {
    const { name, price, category, available } = req.body;

    const menuItem = db.prepare('SELECT m.*, r.owner_id FROM menu_items m JOIN restaurants r ON m.restaurant_id = r.id WHERE m.id = ?').get(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ success: false, error: 'Menu item not found' });
    }

    if (menuItem.owner_id !== req.user.userId) {
      return res.status(403).json({ success: false, error: 'You can only edit items in your restaurant' });
    }

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (price !== undefined) {
      updates.push('price = ?');
      values.push(price);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      values.push(category);
    }
    if (available !== undefined) {
      updates.push('available = ?');
      values.push(available ? 1 : 0);
    }

    values.push(req.params.id);

    db.prepare(`UPDATE menu_items SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    res.json({ success: true, message: 'Menu item updated' });
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /menu-items/:id/toggle - Toggle menu item availability
router.patch('/:id/toggle', verifyToken, checkRole(['owner']), (req, res) => {
  try {
    const menuItem = db.prepare('SELECT m.*, r.owner_id FROM menu_items m JOIN restaurants r ON m.restaurant_id = r.id WHERE m.id = ?').get(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ success: false, error: 'Menu item not found' });
    }

    if (menuItem.owner_id !== req.user.userId) {
      return res.status(403).json({ success: false, error: 'You can only edit items in your restaurant' });
    }

    const newAvailable = menuItem.available === 0 ? 1 : 0;
    db.prepare('UPDATE menu_items SET available = ? WHERE id = ?').run(newAvailable, req.params.id);

    res.json({ success: true, data: { id: req.params.id, available: newAvailable } });
  } catch (error) {
    console.error('Toggle menu item error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
