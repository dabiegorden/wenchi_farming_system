const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const session = require("express-session");
const dotenv = require("dotenv");
const authRoutes = require("./routes/authRoutes.js");
const cookieParser = require('cookie-parser');

// Load environment variables
dotenv.config();

const connectToDatabase = require("./database/db.js");

const app = express();

// Middleware setup
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true, // Allow sending of cookies (sessions)
}));
app.use(cookieParser());

// Set up session middleware at the app level
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600000, // 1 hour
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    },
    name: 'sessionId',
  })
);

// Routes
app.use("/api/auth", authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    try {
        await connectToDatabase();
        console.log("Database connected successfully");
    } catch (error) {
        console.error("Database connection failed:", error.message);
    }
});