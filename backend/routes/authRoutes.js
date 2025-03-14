const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const rateLimit = require('express-rate-limit');
const User = require("../models/User")

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
  if (req.path === "/signin") {
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

router.post("/signup", validateUserInput, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user object - removed role field
    const userData = {
      name: name?.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword
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

router.get("/user-info", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await User.findById(req.session.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      data: {
        user,
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

module.exports = router;