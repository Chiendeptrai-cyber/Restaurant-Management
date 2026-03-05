// filepath: api-gateway/src/middleware/auth.js
import jwt from 'jsonwebtoken';

export function verifyJWT(req, res, next) {
  // Skip auth for public endpoints
  if (req.path.startsWith('/api/auth/')) {
    return next();
  }

  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    // Add user info to headers for downstream services
    req.headers['x-user-id'] = decoded.userId.toString();
    req.headers['x-user-role'] = decoded.role;
    
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}
