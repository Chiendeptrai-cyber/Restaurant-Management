// filepath: services/notification-service/src/routes/notifications.js
const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /notifications — JWT required
router.get('/', (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const notifications = db.prepare(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20'
    ).all(userId);
    return res.status(200).json({ success: true, data: notifications });
  } catch (err) {
    console.error('Get notifications error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /notifications/unread-count — JWT required
router.get('/unread-count', (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const row = db.prepare(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
    ).get(userId);
    return res.status(200).json({ success: true, data: { count: row.count } });
  } catch (err) {
    console.error('Get unread count error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /notifications/:id/read — JWT required
router.patch('/:id/read', (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const result = db.prepare(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?'
    ).run(req.params.id, userId);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id);
    return res.status(200).json({ success: true, data: notification });
  } catch (err) {
    console.error('Mark read error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
