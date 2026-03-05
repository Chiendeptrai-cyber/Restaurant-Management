// filepath: services/order-service/src/routes/orders.js
const express = require('express');
const axios = require('axios');
const db = require('../db');

const router = express.Router();

const RESTAURANT_SERVICE_URL = process.env.RESTAURANT_SERVICE_URL || 'http://localhost:3002';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004';

// Valid status transitions
const STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing'],
  preparing: ['ready'],
  ready: ['delivered'],
  delivered: ['completed']
};

async function notifyAsync(userId, type, message) {
  try {
    await axios.post(`${NOTIFICATION_SERVICE_URL}/internal/notify`, { userId, type, message });
  } catch (err) {
    console.error('Notification error (non-fatal):', err.message);
  }
}

// POST /orders — role: customer
router.post('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const role = req.headers['x-user-role'];

    if (role !== 'customer') {
      return res.status(403).json({ success: false, error: 'Only customers can place orders' });
    }

    const { restaurantId, items } = req.body;
    if (!restaurantId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'restaurantId and items are required' });
    }

    // 1. Fetch menu items from restaurant-service
    const menuItemIds = items.map(i => i.menuItemId).join(',');
    let menuItems;
    try {
      const response = await axios.get(`${RESTAURANT_SERVICE_URL}/internal/menu-items?ids=${menuItemIds}`);
      menuItems = response.data.data;
    } catch (err) {
      return res.status(503).json({ success: false, error: 'Restaurant service unavailable' });
    }

    const menuItemMap = {};
    for (const mi of menuItems) {
      menuItemMap[mi.id] = mi;
    }

    // 2. Verify each item is available
    for (const item of items) {
      const mi = menuItemMap[item.menuItemId];
      if (!mi) {
        return res.status(400).json({ success: false, error: `Menu item ${item.menuItemId} not found` });
      }
      if (!mi.available) {
        return res.status(400).json({ success: false, error: `Menu item "${mi.name}" is not available` });
      }
      if (!item.quantity || item.quantity < 1) {
        return res.status(400).json({ success: false, error: `Invalid quantity for menu item ${item.menuItemId}` });
      }
    }

    // 3. Calculate total server-side
    let total = 0;
    for (const item of items) {
      const mi = menuItemMap[item.menuItemId];
      total += mi.price * item.quantity;
    }

    // 4. Insert order
    const orderResult = db.prepare(
      'INSERT INTO orders (user_id, restaurant_id, status, total) VALUES (?, ?, ?, ?)'
    ).run(userId, restaurantId, 'pending', total);

    const orderId = orderResult.lastInsertRowid;

    // 5. Insert order_items (snapshot price at time of order)
    const insertItem = db.prepare(
      'INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)'
    );
    for (const item of items) {
      const mi = menuItemMap[item.menuItemId];
      insertItem.run(orderId, item.menuItemId, item.quantity, mi.price);
    }

    // 6. Notify asynchronously (non-blocking)
    notifyAsync(userId, 'order_new', `Your order #${orderId} has been placed successfully.`);

    return res.status(201).json({
      success: true,
      data: { orderId, status: 'pending', total }
    });
  } catch (err) {
    console.error('Create order error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /orders/my — JWT required
router.get('/my', (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(userId);

    const result = orders.map(order => {
      const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      return { ...order, items: orderItems };
    });

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('Get my orders error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /orders/restaurant/:restaurantId — role: owner
router.get('/restaurant/:restaurantId', (req, res) => {
  try {
    const role = req.headers['x-user-role'];

    if (role !== 'owner') {
      return res.status(403).json({ success: false, error: 'Only owners can view restaurant orders' });
    }

    const orders = db.prepare('SELECT * FROM orders WHERE restaurant_id = ? ORDER BY created_at DESC').all(req.params.restaurantId);

    const result = orders.map(order => {
      const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      return { ...order, items: orderItems };
    });

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('Get restaurant orders error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /orders/:id — JWT required
router.get('/:id', (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const role = req.headers['x-user-role'];

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Customer can only view their own orders; owner can view any
    if (role !== 'owner' && String(order.user_id) !== String(userId)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    return res.status(200).json({ success: true, data: { ...order, items: orderItems } });
  } catch (err) {
    console.error('Get order error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /orders/:id/cancel — role: customer
router.patch('/:id/cancel', (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const role = req.headers['x-user-role'];

    if (role !== 'customer') {
      return res.status(403).json({ success: false, error: 'Only customers can cancel orders' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (String(order.user_id) !== String(userId)) {
      return res.status(403).json({ success: false, error: 'You can only cancel your own orders' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Only pending orders can be cancelled' });
    }

    db.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?").run(req.params.id);
    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('Cancel order error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /orders/:id/status — role: owner
router.patch('/:id/status', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const role = req.headers['x-user-role'];

    if (role !== 'owner') {
      return res.status(403).json({ success: false, error: 'Only owners can update order status' });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const allowed = STATUS_TRANSITIONS[order.status];
    if (!allowed || !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot transition order from '${order.status}' to '${status}'`
      });
    }

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

    // Notify asynchronously
    notifyAsync(
      order.user_id,
      'order_status',
      `Your order #${order.id} status has been updated to '${status}'.`
    );

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('Update order status error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
