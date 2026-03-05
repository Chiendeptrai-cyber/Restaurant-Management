// filepath: food-order-soa/services/order-service/src/routes/orders.js
const express = require('express');
const axios = require('axios');
const db = require('../db');

const router = express.Router();

const RESTAURANT_SERVICE_URL = process.env.RESTAURANT_SERVICE_URL || 'http://localhost:3002';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004';

// Valid status transitions
const VALID_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing'],
  preparing: ['ready'],
  ready: ['delivered'],
  delivered: ['completed']
};

async function notifyAsync(userId, type, message) {
  try {
    await axios.post(`${NOTIFICATION_SERVICE_URL}/internal/notify`, { userId, type, message }, { timeout: 3000 });
  } catch (err) {
    console.error('Notification failed (non-fatal):', err.message);
  }
}

// POST /orders — create order (customer only)
router.post('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'customer') {
      return res.status(403).json({ success: false, error: 'Only customers can place orders' });
    }

    const { restaurantId, items } = req.body;
    if (!restaurantId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'restaurantId and items are required' });
    }

    // Fetch menu items from restaurant-service
    const menuItemIds = items.map(i => i.menuItemId).join(',');
    let menuItems;
    try {
      const response = await axios.get(
        `${RESTAURANT_SERVICE_URL}/internal/menu-items?ids=${menuItemIds}`,
        { timeout: 5000 }
      );
      menuItems = response.data.data;
    } catch (err) {
      console.error('Failed to fetch menu items:', err.message);
      return res.status(503).json({ success: false, error: 'Restaurant service unavailable' });
    }

    // Build a lookup map
    const menuMap = {};
    for (const item of menuItems) {
      menuMap[item.id] = item;
    }

    // Verify items and calculate total server-side
    let total = 0;
    const orderItemsData = [];
    for (const orderItem of items) {
      const menuItem = menuMap[orderItem.menuItemId];
      if (!menuItem) {
        return res.status(400).json({ success: false, error: `Menu item ${orderItem.menuItemId} not found` });
      }
      if (!menuItem.available) {
        return res.status(400).json({ success: false, error: `Menu item "${menuItem.name}" is not available` });
      }
      const qty = parseInt(orderItem.quantity, 10);
      if (!qty || qty < 1) {
        return res.status(400).json({ success: false, error: `Invalid quantity for item ${orderItem.menuItemId}` });
      }
      total += menuItem.price * qty;
      orderItemsData.push({ menuItemId: menuItem.id, quantity: qty, price: menuItem.price });
    }

    // Insert order and order_items in a transaction
    const insertOrder = db.transaction(() => {
      const orderResult = db.prepare(
        'INSERT INTO orders (user_id, restaurant_id, status, total) VALUES (?, ?, ?, ?)'
      ).run(userId, restaurantId, 'pending', total);

      const orderId = orderResult.lastInsertRowid;
      for (const item of orderItemsData) {
        db.prepare(
          'INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)'
        ).run(orderId, item.menuItemId, item.quantity, item.price);
      }
      return orderId;
    });

    const orderId = insertOrder();

    // Fetch restaurant owner_id to notify the owner (non-blocking)
    try {
      const restResp = await axios.get(
        `${RESTAURANT_SERVICE_URL}/internal/restaurants/${restaurantId}`,
        { timeout: 3000 }
      );
      const ownerId = restResp.data.data.owner_id;
      notifyAsync(ownerId, 'order_new', `New order #${orderId} received with total ${total.toFixed(0)} VND`);
    } catch (err) {
      console.error('Failed to fetch restaurant owner for notification (non-fatal):', err.message);
    }

    return res.status(201).json({
      success: true,
      data: { orderId, status: 'pending', total }
    });
  } catch (err) {
    console.error('Create order error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /orders/my — get current user's orders
router.get('/my', (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(userId);

    const ordersWithItems = orders.map(order => {
      const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      return { ...order, items: orderItems };
    });

    return res.status(200).json({ success: true, data: ordersWithItems });
  } catch (err) {
    console.error('Get my orders error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /orders/restaurant/:restaurantId — owner view orders by restaurant
router.get('/restaurant/:restaurantId', (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'owner') {
      return res.status(403).json({ success: false, error: 'Only owners can view restaurant orders' });
    }

    const orders = db.prepare(
      'SELECT * FROM orders WHERE restaurant_id = ? ORDER BY created_at DESC'
    ).all(req.params.restaurantId);

    const ordersWithItems = orders.map(order => {
      const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      return { ...order, items: orderItems };
    });

    return res.status(200).json({ success: true, data: ordersWithItems });
  } catch (err) {
    console.error('Get restaurant orders error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /orders/:id — get one order detail
router.get('/:id', (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Customer can only view own orders; owner can view any order in their restaurant
    if (userRole === 'customer' && String(order.user_id) !== String(userId)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    return res.status(200).json({ success: true, data: { ...order, items: orderItems } });
  } catch (err) {
    console.error('Get order error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /orders/:id/cancel — cancel order (customer only, pending only)
router.patch('/:id/cancel', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'customer') {
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

    notifyAsync(userId, 'order_cancelled', `Order #${order.id} has been cancelled`);

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('Cancel order error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /orders/:id/status — update order status (owner only)
router.patch('/:id/status', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'owner') {
      return res.status(403).json({ success: false, error: 'Only owners can update order status' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    const allowed = VALID_TRANSITIONS[order.status];
    if (!allowed || !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status transition from '${order.status}' to '${status}'`
      });
    }

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);

    notifyAsync(order.user_id, 'order_status_updated', `Order #${order.id} status changed to ${status}`);

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('Update order status error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
