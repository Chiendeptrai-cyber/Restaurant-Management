// filepath: services/notification-service/src/routes/notifications.js
import express from 'express';
import db from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// GET /notifications - Get user's notifications
router.get('/', verifyToken, (req, res) => {
  try {
    const notifications = db.prepare(`
      SELECT id, user_id, type, message, is_read, created_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).all(req.user.userId);

    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /notifications/:id/read - Mark notification as read
router.patch('/:id/read', verifyToken, (req, res) => {
  try {
    const notification = db.prepare('SELECT id, user_id FROM notifications WHERE id = ?').get(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    if (notification.user_id !== req.user.userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /notifications/unread-count - Get unread notification count
router.get('/unread-count', verifyToken, (req, res) => {
  try {
    const result = db.prepare(`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = ? AND is_read = 0
    `).get(req.user.userId);

    res.json({ success: true, data: { unreadCount: result.count } });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
