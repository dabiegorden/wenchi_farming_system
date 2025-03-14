// routes/crop.js
const express = require('express');
const router = express.Router();
const { isAuthenticated, isResearcher, isAdmin } = require('../middleware/auth');

// Get all crops - accessible to all authenticated users
router.get('/', isAuthenticated, (req, res) => {
  // Implementation to get crops
  res.json({ message: 'List of all crops' });
});

// Add new crop - only admin can add new crops to the system
router.post('/', isAdmin, (req, res) => {
  // Implementation to add crop
  res.json({ message: 'Crop added successfully' });
});

// Get crop analytics - only researchers and admins can access
router.get('/analytics', isResearcher, (req, res) => {
  // Implementation for analytics
  res.json({ message: 'Crop analytics data' });
});

module.exports = router;