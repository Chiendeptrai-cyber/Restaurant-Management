// filepath: services/restaurant-service/src/routes/restaurants.js
import express from 'express';
import db from '../db.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// GET /restaurants - List all active restaurants
router.get('/', (req, res) => {
  try {
    const restaurants = db.prepare(`
      SELECT id, name, address, owner_id, status, image_url, created_at
      FROM restaurants
      WHERE status = 'active'
    `).all();

    res.json({ success: true, data: restaurants });
  } catch (error) {
    console.error('Get restaurants error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /restaurants/:id - Get restaurant details
router.get('/:id', (req, res) => {
  try {
    const restaurant = db.prepare(`
      SELECT id, name, address, owner_id, status, image_url, created_at
      FROM restaurants
      WHERE id = ?
    `).get(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }

    res.json({ success: true, data: restaurant });
  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /restaurants/:id/menu - Get restaurant menu
router.get('/:id/menu', (req, res) => {
  try {
    const menu = db.prepare(`
      SELECT id, restaurant_id, name, price, category, available
      FROM menu_items
      WHERE restaurant_id = ? AND available = 1
    `).all(req.params.id);

    res.json({ success: true, data: menu });
  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /restaurants - Create new restaurant (owner only)
router.post('/', verifyToken, checkRole(['owner']), (req, res) => {
  try {
    const { name, address, image_url } = req.body;

    if (!name || !address) {
      return res.status(400).json({ success: false, error: 'Name and address required' });
    }

    const stmt = db.prepare(`
      INSERT INTO restaurants (name, address, owner_id, status, image_url)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(name, address, req.user.userId, 'active', image_url || null);

    res.status(201).json({
      success: true,
      data: { id: result.lastInsertRowid, name, address, owner_id: req.user.userId, status: 'active', image_url }
    });
  } catch (error) {
    console.error('Create restaurant error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /restaurants/:id - Update restaurant (owner only)
router.put('/:id', verifyToken, checkRole(['owner']), (req, res) => {
  try {
    const { name, address, status, image_url } = req.body;
    
    // Check ownership
    const restaurant = db.prepare('SELECT owner_id FROM restaurants WHERE id = ?').get(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }

    if (restaurant.owner_id !== req.user.userId) {
      return res.status(403).json({ success: false, error: 'You can only edit your own restaurant' });
    }

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (address !== undefined) {
      updates.push('address = ?');
      values.push(address);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (image_url !== undefined) {
      updates.push('image_url = ?');
      values.push(image_url);
    }

    values.push(req.params.id);

    db.prepare(`UPDATE restaurants SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    res.json({ success: true, message: 'Restaurant updated' });
  } catch (error) {
    console.error('Update restaurant error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
