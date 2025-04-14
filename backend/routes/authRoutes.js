const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const rateLimit = require('express-rate-limit');
const User = require("../models/User");
const { isAdmin, isAuthenticated } = require("../middleware/authMiddleware");

dotenv.config();

// Input validation middleware
const validateUserInput = (req, res, next) => {
  const { email, password, name } = req.body;
  
  // For signup route - require email and password
  if (req.path === "/signup") {
    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
  }
  
  // For signin route - require email and password
  if (req.path === "/signin" || req.path === "/admin/signin") {
    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
  }
  
  // Password length check for both routes
  if (password && password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }
  
  next();
};

// Rate limiting setup
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: { message: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Create a separate, stricter rate limiter for admin routes
const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 attempts
  message: { message: 'Too many admin login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/signup", validateUserInput, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user object - default role is 'user'
    const userData = {
      name: name?.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'user'
    };
    
    const newUser = await User.create(userData);

    // Don't send password hash in response
    const userResponse = newUser.toObject();
    delete userResponse.password;

    req.session.userId = newUser._id;
    
    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/signin", validateUserInput, authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Your account has been deactivated" });
    }

    // Don't send password hash in response
    const userResponse = user.toObject();
    delete userResponse.password;

    req.session.userId = user._id;
    
    res.status(200).json({
      success: true,
      message: "Sign in successful",
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Admin-specific signin route
router.post("/admin/signin", validateUserInput, adminAuthLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user is an admin
    if (user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Your account has been deactivated" });
    }

    // Don't send password hash in response
    const userResponse = user.toObject();
    delete userResponse.password;

    req.session.userId = user._id;
    
    res.status(200).json({
      success: true,
      message: "Admin sign in successful",
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    console.error("Admin signin error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/user-info", isAuthenticated, async (req, res) => {
  try {
    const user = req.user;

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    console.error("User info error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/signout", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  req.session.destroy((err) => {
    if (err) {
      console.error("Signout error:", err);
      return res.status(500).json({ message: "Failed to sign out" });
    }
    res.clearCookie('sessionId');
    res.status(200).json({ message: "Successfully signed out" });
  });
});

// Create a first admin account - should be restricted and only used during initial setup
router.post("/setup-admin", async (req, res) => {
  try {
    // Check if admin setup is allowed
    if (process.env.ALLOW_ADMIN_SETUP !== 'true') {
      return res.status(403).json({ message: "Admin setup is disabled" });
    }
    
    // Check if any admin already exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      return res.status(400).json({ message: "An admin account already exists" });
    }
    
    const { name, email, password } = req.body;
    
    if (!name?.trim() || !email?.trim() || !password?.trim() || password.length < 8) {
      return res.status(400).json({ message: "Name, email and strong password (8+ chars) are required" });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }
    
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const adminUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'admin'
    });
    
    const userResponse = adminUser.toObject();
    delete userResponse.password;
    
    res.status(201).json({
      success: true,
      message: "Admin account created successfully",
      data: {
        user: userResponse
      }
    });
  } catch (error) {
    console.error("Admin setup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Admin routes for user management - require admin authentication
router.get("/users", isAdmin, async (req, res) => {
  try {
    const { search, role, isActive, sort, limit = 20, page = 1 } = req.query;
    
    // Build query
    const query = {};
    
    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by role
    if (role && ['user', 'researcher', 'admin'].includes(role)) {
      query.role = role;
    }
    
    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort options
    let sortOptions = { createdAt: -1 }; // default sort by creation date, newest first
    if (sort) {
      const [field, order] = sort.split(':');
      sortOptions = { [field]: order === 'desc' ? -1 : 1 };
    }
    
    // Execute query with pagination
    const users = await User.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-password -__v');
    
    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total: totalUsers,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalUsers / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/users/:id", isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/users/:id", isAdmin, async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;
    
    // Find the user
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Prevent self-demotion for admins
    if (user._id.toString() === req.user._id.toString() && role && role !== 'admin') {
      return res.status(400).json({ message: "You cannot demote yourself from admin" });
    }
    
    // Prevent self-deactivation for admins
    if (user._id.toString() === req.user._id.toString() && isActive === false) {
      return res.status(400).json({ message: "You cannot deactivate your own account" });
    }
    
    // Update user fields
    if (name) user.name = name.trim();
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      
      // Check if email is already in use by another user
      const existingUser = await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      user.email = email.toLowerCase().trim();
    }
    if (role !== undefined) {
      if (!['user', 'researcher', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      user.role = role;
    }
    if (isActive !== undefined) user.isActive = isActive;
    
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: {
        user: userResponse
      }
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/users/:id", isAdmin, async (req, res) => {
  try {
    // Find the user
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Prevent self-deletion for admins
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }
    
    await User.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Route to change a user's password (admin only)
router.put("/users/:id/password", isAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters" });
    }
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    user.password = hashedPassword;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: "User password updated successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Add a route for admins to create new users (including other admins)
router.post("/create-user", isAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    
    if (role && !['user', 'researcher', 'admin'].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }
    
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role || 'user'
    });
    
    const userResponse = newUser.toObject();
    delete userResponse.password;
    
    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        user: userResponse
      }
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;