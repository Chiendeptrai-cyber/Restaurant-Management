// filepath: services/notification-service/src/middleware/auth.js
export function verifyToken(req, res, next) {
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];

  if (!userId) {
    return res.status(401).json({ success: false, error: 'User ID required' });
  }

  req.user = { userId: parseInt(userId), role: userRole };
  next();
}
