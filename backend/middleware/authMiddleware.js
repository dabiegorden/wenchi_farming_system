const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    // Set user in request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = authMiddleware;