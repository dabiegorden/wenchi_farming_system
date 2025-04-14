const User = require('../models/User');

const isAuthenticated = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated' });
    }
    
    // Set user in request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    // First check if user is authenticated
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated' });
    }
    
    // Check if user is an admin
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    // Set user in request
    req.user = user;
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const isResearcher = async (req, res, next) => {
  try {
    // First check if user is authenticated
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated' });
    }
    
    // Check if user is a researcher or admin (admins have researcher privileges)
    if (user.role !== 'researcher' && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Researcher access required' });
    }
    
    // Set user in request
    req.user = user;
    next();
  } catch (error) {
    console.error('Researcher auth middleware error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { isAuthenticated, isAdmin, isResearcher };