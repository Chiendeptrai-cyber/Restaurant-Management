// filepath: services/order-service/src/routes/orders.js
import express from 'express';
import axios from 'axios';
import db from '../db.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

const RESTAURANT_SERVICE_URL = process.env.RESTAURANT_SERVICE_URL || 'http://localhost:3002';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004';

// Helper function to fetch menu items from restaurant service
async function getMenuItems(menuItemIds) {
  try {
    const response = await axios.get(`${RESTAURANT_SERVICE_URL}/internal/menu-items`, {
      params: { ids: menuItemIds.join(',') }
    });
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching menu items:', error.message);
    throw new Error('Failed to fetch menu items from restaurant service');
  }
}

// Helper function to send notification (async, fault tolerant)
async function sendNotification(userId, type, message) {
  try {
    await axios.post(`${NOTIFICATION_SERVICE_URL}/internal/notify`, {
      userId,
      type,
      message
    });
  } catch (error) {
    console.error('Notification service error (non-critical):', error.message);
    // Don't throw - notification failure should not fail the order
  }
}

// POST /orders - Create new order
router.post('/', verifyToken, checkRole(['customer']), async (req, res) => {
  try {
    const { restaurantId, items } = req.body;
    const userId = req.user.userId;

    if (!restaurantId || !items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Restaurant ID and items required' });
    }

    // Get menu items to verify availability and price
    const menuItemIds = items.map(item => item.menuItemId);
    let menuItems;
    try {
      menuItems = await getMenuItems(menuItemIds);
    } catch (error) {
      return res.status(503).json({ success: false, error: error.message });
    }

    const menuItemMap = {};
    menuItems.forEach(item => {
      menuItemMap[item.id] = item;
    });

    // Verify items exist and are available
    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = menuItemMap[item.menuItemId];
      if (!menuItem) {
        return res.status(400).json({ success: false, error: `Menu item ${item.menuItemId} not found` });
      }

      if (!menuItem.available) {
        return res.status(400).json({ success: false, error: `Menu item ${item.menuItemId} is not available` });
      }

      const itemTotal = menuItem.price * item.quantity;
      total += itemTotal;

      orderItems.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: menuItem.price
      });
    }

    // Create order
    const createOrder = db.prepare(`
      INSERT INTO orders (user_id, restaurant_id, status, total)
      VALUES (?, ?, ?, ?)
    `);

    const orderResult = createOrder.run(userId, restaurantId, 'pending', total);
    const orderId = orderResult.lastInsertRowid;

    // Create order items
    const createOrderItem = db.prepare(`
      INSERT INTO order_items (order_id, menu_item_id, quantity, price)
      VALUES (?, ?, ?, ?)
    `);

    for (const item of orderItems) {
      createOrderItem.run(orderId, item.menuItemId, item.quantity, item.price);
    }

    // Send async notification to restaurant owner (fault tolerant)
    sendNotification(2, 'order_new', `New order #${orderId} received for $${total.toFixed(2)}`);

    res.status(201).json({
      success: true,
      data: { orderId, status: 'pending', total }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /orders/my - Get customer's orders
router.get('/my', verifyToken, (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.id, o.user_id, o.restaurant_id, o.status, o.total, o.created_at
      FROM orders o
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `).all(req.user.userId);

    const result = orders.map(order => {
      const items = db.prepare(`
        SELECT id, order_id, menu_item_id, quantity, price
        FROM order_items
        WHERE order_id = ?
      `).all(order.id);

      return { ...order, items };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /orders/:id - Get order details
router.get('/:id', verifyToken, (req, res) => {
  try {
    const order = db.prepare(`
      SELECT id, user_id, restaurant_id, status, total, created_at
      FROM orders
      WHERE id = ?
    `).get(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Check ownership
    if (order.user_id !== req.user.userId && req.user.role !== 'owner') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const items = db.prepare(`
      SELECT id, order_id, menu_item_id, quantity, price
      FROM order_items
      WHERE order_id = ?
    `).all(order.id);

    res.json({ success: true, data: { ...order, items } });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /orders/:id/cancel - Cancel order
router.patch('/:id/cancel', verifyToken, checkRole(['customer']), (req, res) => {
  try {
    const order = db.prepare('SELECT id, user_id, status FROM orders WHERE id = ?').get(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.user_id !== req.user.userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Can only cancel pending orders' });
    }

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('cancelled', req.params.id);

    res.json({ success: true, message: 'Order cancelled' });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /orders/restaurant/:restaurantId - Get orders for restaurant owner
router.get('/restaurant/:restaurantId', verifyToken, checkRole(['owner']), (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT id, user_id, restaurant_id, status, total, created_at
      FROM orders
      WHERE restaurant_id = ?
      ORDER BY created_at DESC
    `).all(req.params.restaurantId);

    const result = orders.map(order => {
      const items = db.prepare(`
        SELECT id, order_id, menu_item_id, quantity, price
        FROM order_items
        WHERE order_id = ?
      `).all(order.id);

      return { ...order, items };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get restaurant orders error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /orders/:id/status - Update order status
router.patch('/:id/status', verifyToken, checkRole(['owner']), async (req, res) => {
  try {
    const { status } = req.body;
    const order = db.prepare('SELECT id, status, restaurant_id, user_id FROM orders WHERE id = ?').get(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Validate status transitions
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['preparing'],
      'preparing': ['ready'],
      'ready': ['delivered'],
      'delivered': ['completed'],
      'cancelled': [],
      'completed': []
    };

    if (!validTransitions[order.status] || !validTransitions[order.status].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid status transition from ${order.status} to ${status}` 
      });
    }

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);

    // Send async notification
    const statusMessages = {
      'confirmed': `Order #${order.id} confirmed`,
      'preparing': `Order #${order.id} is being prepared`,
      'ready': `Order #${order.id} is ready for pickup`,
      'delivered': `Order #${order.id} has been delivered`,
      'completed': `Order #${order.id} completed`,
      'cancelled': `Order #${order.id} cancelled`
    };

    sendNotification(order.user_id, 'order_status_update', statusMessages[status]);

    res.json({ success: true, message: `Order status updated to ${status}` });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
