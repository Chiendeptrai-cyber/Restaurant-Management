// filepath: services/notification-service/src/routes/internal.js
const express = require('express');
const db = require('../db');

const router = express.Router();

// POST /internal/notify — internal only
router.post('/notify', (req, res) => {
  try {
    const { userId, type, message } = req.body;

    if (!userId || !type || !message) {
      return res.status(400).json({ success: false, error: 'userId, type, and message are required' });
    }

    db.prepare(
      'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)'
    ).run(userId, type, message);

    return res.status(201).json({ success: true, data: { message: 'Notification created' } });
  } catch (err) {
    console.error('Internal notify error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
