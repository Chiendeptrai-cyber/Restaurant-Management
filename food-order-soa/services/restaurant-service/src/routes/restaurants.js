// filepath: food-order-soa/services/restaurant-service/src/routes/restaurants.js
const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /restaurants — list active restaurants
router.get('/', (req, res) => {
  try {
    const restaurants = db.prepare("SELECT * FROM restaurants WHERE status = 'active'").all();
    return res.status(200).json({ success: true, data: restaurants });
  } catch (err) {
    console.error('List restaurants error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /restaurants/:id — get one restaurant
router.get('/:id', (req, res) => {
  try {
    const restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }
    return res.status(200).json({ success: true, data: restaurant });
  } catch (err) {
    console.error('Get restaurant error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /restaurants/:id/menu — get available menu items
router.get('/:id/menu', (req, res) => {
  try {
    const restaurant = db.prepare('SELECT id FROM restaurants WHERE id = ?').get(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }
    const items = db.prepare('SELECT * FROM menu_items WHERE restaurant_id = ? AND available = 1').all(req.params.id);
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error('Get menu error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /restaurants — create restaurant (owner only)
router.post('/', (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'owner') {
      return res.status(403).json({ success: false, error: 'Only owners can create restaurants' });
    }

    const { name, address, image_url } = req.body;
    if (!name || !address) {
      return res.status(400).json({ success: false, error: 'Name and address are required' });
    }

    const result = db.prepare(
      'INSERT INTO restaurants (name, address, owner_id, status, image_url) VALUES (?, ?, ?, ?, ?)'
    ).run(name, address, userId, 'active', image_url || null);

    const restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({ success: true, data: restaurant });
  } catch (err) {
    console.error('Create restaurant error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /restaurants/:id — update restaurant (owner only, own restaurant)
router.put('/:id', (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'owner') {
      return res.status(403).json({ success: false, error: 'Only owners can update restaurants' });
    }

    const restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }

    if (String(restaurant.owner_id) !== String(userId)) {
      return res.status(403).json({ success: false, error: 'You can only update your own restaurant' });
    }

    const { name, address, status, image_url } = req.body;
    db.prepare(
      'UPDATE restaurants SET name = ?, address = ?, status = ?, image_url = ? WHERE id = ?'
    ).run(
      name || restaurant.name,
      address || restaurant.address,
      status || restaurant.status,
      image_url !== undefined ? image_url : restaurant.image_url,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(req.params.id);
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('Update restaurant error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /restaurants/:id/menu — add menu item (owner only)
router.post('/:id/menu', (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'owner') {
      return res.status(403).json({ success: false, error: 'Only owners can add menu items' });
    }

    const restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }

    if (String(restaurant.owner_id) !== String(userId)) {
      return res.status(403).json({ success: false, error: 'You can only add items to your own restaurant' });
    }

    const { name, price, category, available } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ success: false, error: 'Name and price are required' });
    }

    const result = db.prepare(
      'INSERT INTO menu_items (restaurant_id, name, price, category, available) VALUES (?, ?, ?, ?, ?)'
    ).run(req.params.id, name, price, category || null, available !== undefined ? (available ? 1 : 0) : 1);

    const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({ success: true, data: item });
  } catch (err) {
    console.error('Add menu item error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
