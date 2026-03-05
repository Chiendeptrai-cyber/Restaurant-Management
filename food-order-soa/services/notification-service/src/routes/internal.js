// filepath: services/notification-service/src/routes/internal.js
import express from 'express';
import db from '../db.js';

const router = express.Router();

// POST /internal/notify - Internal endpoint for other services
router.post('/notify', (req, res) => {
  try {
    const { userId, type, message } = req.body;

    if (!userId || !type || !message) {
      return res.status(400).json({ success: false, error: 'userId, type, and message required' });
    }

    const stmt = db.prepare(`
      INSERT INTO notifications (user_id, type, message)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(userId, type, message);

    res.status(201).json({
      success: true,
      data: { id: result.lastInsertRowid, userId, type, message, is_read: 0 }
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
