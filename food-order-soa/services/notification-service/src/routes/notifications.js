// filepath: food-order-soa/services/notification-service/src/routes/notifications.js
const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /notifications — get user's notifications (last 20)
router.get('/', (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const notifications = db.prepare(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20'
    ).all(userId);

    return res.status(200).json({ success: true, data: notifications });
  } catch (err) {
    console.error('Get notifications error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /notifications/unread-count — count unread notifications
router.get('/unread-count', (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const result = db.prepare(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
    ).get(userId);

    return res.status(200).json({ success: true, data: { unreadCount: result.count } });
  } catch (err) {
    console.error('Get unread count error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /notifications/:id/read — mark notification as read
router.patch('/:id/read', (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    if (String(notification.user_id) !== String(userId)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, userId);

    const updated = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id);
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('Mark read error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
