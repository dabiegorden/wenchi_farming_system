const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const session = require("express-session")
const dotenv = require("dotenv")
const cookieParser = require("cookie-parser")
const path = require("path")
const fs = require("fs")
const connectToDatabase = require("./database/db.js")

// Route imports
const authRoutes = require("./routes/authRoutes.js")
const weatherRoutes = require("./routes/weatherRoutes.js")
const adminRoutes = require("./routes/adminRoutes.js")
const cropRoutes = require("./routes/crop.js")
const healthRoutes = require("./routes/healthRoutes.js")
const inventoryRoutes = require("./routes/inventoryRoutes.js")
const landRoutes = require("./routes/landRoutes.js")
const notificationRoutes = require("./routes/notificationRoutes.js")
const reportRoutes = require("./routes/reportRoutes.js")

// Load environment variables
dotenv.config()

const app = express()

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads")
const dirStructure = [
  path.join(uploadsDir, "crops"),
  path.join(uploadsDir, "health"),
  path.join(uploadsDir, "inventory"),
  path.join(uploadsDir, "land"),
]

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir)
}

// Create subdirectories
dirStructure.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
})

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.json())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true, // Allow sending of cookies (sessions)
  }),
)
app.use(cookieParser())

// Set up session middleware with more secure settings
app.use(
  session({
    secret: process.env.SESSION_SECRET || "mysecretkey",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: Number.parseInt(process.env.SESSION_MAX_AGE) || 3600000, // 1 hour default
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
    name: "sessionId",
  }),
)

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Basic security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff")
  res.setHeader("X-Frame-Options", "DENY")
  res.setHeader("X-XSS-Protection", "1; mode=block")
  next()
})

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/weather", weatherRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/crops", cropRoutes)
app.use("/api/health", healthRoutes)
app.use("/api/inventory", inventoryRoutes)
app.use("/api/land", landRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/reports", reportRoutes)

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date() })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    message: "Internal server error",
  })
})

// 404 handler - must be after all routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  })
})

// Start server
const PORT = process.env.PORT || 5000
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`)
  try {
    await connectToDatabase()
    console.log("Database connected successfully")
  } catch (error) {
    console.error("Database connection failed:", error.message)
  }
})

module.exports = app // For testing purposes
