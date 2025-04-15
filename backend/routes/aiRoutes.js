const express = require("express")
const router = express.Router()
const { isAuthenticated, isResearcher, isAdmin } = require("../middleware/authMiddleware")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const {
  analyzeCropHealthBySymptoms,
  analyzeCropHealthByImage,
  getCropRecommendations,
  generateSmartNotifications,
  analyzeWeatherForAgriculture,
} = require("../utils/geminiAI")
const Crop = require("../models/Crop")
const Land = require("../models/Land")
const HealthAssessment = require("../models/Health")
const { InventoryItem } = require("../models/Inventory")
const Notification = require("../models/Notification")
const fetch = require("node-fetch")

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/health")
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, "crop-health-" + uniqueSuffix + ext)
  },
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/
    const mimetype = filetypes.test(file.mimetype)
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())

    if (mimetype && extname) {
      return cb(null, true)
    }
    cb(new Error("Only image files are allowed!"))
  },
})

// Generate smart notifications based on farm data
router.post("/smart-notifications", isAuthenticated, async (req, res) => {
  try {
    // Collect farm data for AI analysis
    const farmData = {
      inventory: await InventoryItem.find({ isActive: true })
        .select("name category quantity unit reorderLevel expiryDate")
        .lean(),

      lands: await Land.find({ isActive: true })
        .select("name status soilMoisture currentCrop plantingDate expectedHarvestDate")
        .populate("currentCrop", "name growthDuration")
        .lean(),

      crops: await Crop.find({ isActive: true }).select("name growthDuration waterRequirements plantingSeasons").lean(),

      healthAssessments: await HealthAssessment.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(20)
        .select("cropId status aiAnalysis.disease createdAt")
        .populate("cropId", "name")
        .lean(),
    }

    // Get weather data if API key is available
    try {
      const apiKey = process.env.OPEN_WEATHER_API_KEY
      const lat = process.env.FARM_LATITUDE || "7.7340"
      const lon = process.env.FARM_LONGITUDE || "-2.1009"

      if (apiKey) {
        const weatherResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`,
        )

        if (weatherResponse.ok) {
          const weatherData = await weatherResponse.json()
          farmData.weather = weatherData
        }
      }
    } catch (weatherError) {
      console.error("Weather API error:", weatherError)
      // Continue without weather data
    }

    // Generate smart notifications using AI
    const result = await generateSmartNotifications(farmData)

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate smart notifications",
        error: result.error,
      })
    }

    // Process the AI-generated notifications
    let notifications = []
    if (result.data && result.data.notifications) {
      notifications = result.data.notifications
    } else if (result.data && result.data.rawResponse) {
      // If we got raw text instead of structured data
      notifications = [
        {
          title: "AI Analysis",
          message: result.data.rawResponse,
          type: "info",
          priority: "medium",
          category: "system",
        },
      ]
    }

    res.status(200).json({
      success: true,
      data: {
        notifications,
      },
    })
  } catch (error) {
    console.error("Smart notifications error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to generate smart notifications",
    })
  }
})

// Create notifications from AI suggestions
router.post("/create-notifications", isAdmin, async (req, res) => {
  try {
    const { notifications } = req.body

    if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Valid notifications array is required",
      })
    }

    const createdNotifications = []

    // Create each notification
    for (const notif of notifications) {
      const notificationData = {
        title: notif.title,
        message: notif.message,
        type: notif.type || "info",
        priority: notif.priority || "medium",
        category: notif.category || "system",
        isGlobal: true,
        isActionRequired: notif.isActionRequired || false,
        tags: ["ai-generated"],
        createdBy: req.user._id,
      }

      const notification = await Notification.create(notificationData)
      createdNotifications.push(notification)
    }

    res.status(201).json({
      success: true,
      message: `${createdNotifications.length} notifications created successfully`,
      data: {
        notifications: createdNotifications,
      },
    })
  } catch (error) {
    console.error("Create AI notifications error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create notifications",
    })
  }
})

// Analyze weather data for agricultural recommendations
router.get("/weather-analysis", isAuthenticated, async (req, res) => {
  try {
    // Get weather data
    const apiKey = process.env.OPEN_WEATHER_API_KEY
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: "Weather API key not configured",
      })
    }

    const lat = process.env.FARM_LATITUDE || "7.7340"
    const lon = process.env.FARM_LONGITUDE || "-2.1009"

    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`,
    )

    if (!weatherResponse.ok) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch weather data",
      })
    }

    const weatherData = await weatherResponse.json()

    // Get crops being grown
    const lands = await Land.find({
      isActive: true,
      status: "planted",
      currentCrop: { $exists: true, $ne: null },
    })
      .populate("currentCrop", "name waterRequirements")
      .lean()

    const crops = lands.map((land) => ({
      name: land.currentCrop.name,
      waterRequirements: land.currentCrop.waterRequirements,
      landName: land.name,
      plantingDate: land.plantingDate,
      expectedHarvestDate: land.expectedHarvestDate,
    }))

    // Analyze weather data for agricultural recommendations
    const result = await analyzeWeatherForAgriculture(weatherData, crops)

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to analyze weather data",
        error: result.error,
      })
    }

    res.status(200).json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error("Weather analysis error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to analyze weather data",
    })
  }
})

// Analyze crop health (by symptoms or image)
router.post("/analyze-crop-health", isAuthenticated, upload.single("image"), async (req, res) => {
  try {
    const { cropName, symptoms, analysisType } = req.body

    if (!cropName) {
      return res.status(400).json({
        success: false,
        message: "Crop name is required",
      })
    }

    let result

    if (analysisType === "image") {
      // Check if image was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Image file is required for image analysis",
        })
      }

      // Analyze crop health by image
      result = await analyzeCropHealthByImage(cropName, req.file.path)

      // Create a health assessment record
      if (result.success) {
        try {
          const cropExists = await Crop.findOne({ name: { $regex: new RegExp(cropName, "i") } })

          if (cropExists) {
            await HealthAssessment.create({
              cropId: cropExists._id,
              status: result.data.severity || "unknown",
              symptoms: result.data.visualSymptoms || [],
              images: [req.file.path.replace(/^.*[\\/]/, "")], // Just the filename
              aiAnalysis: result.data,
              createdBy: req.user._id,
            })
          }
        } catch (err) {
          console.error("Failed to create health assessment record:", err)
          // Continue even if record creation fails
        }
      }
    } else {
      // Analyze crop health by symptoms
      if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Symptoms array is required for symptom analysis",
        })
      }

      result = await analyzeCropHealthBySymptoms(cropName, symptoms)

      // Create a health assessment record
      if (result.success) {
        try {
          const cropExists = await Crop.findOne({ name: { $regex: new RegExp(cropName, "i") } })

          if (cropExists) {
            await HealthAssessment.create({
              cropId: cropExists._id,
              status: result.data.severity || "unknown",
              symptoms: symptoms,
              aiAnalysis: result.data,
              createdBy: req.user._id,
            })
          }
        } catch (err) {
          console.error("Failed to create health assessment record:", err)
          // Continue even if record creation fails
        }
      }
    }

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to analyze crop health",
        error: result.error,
      })
    }

    res.status(200).json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error("Crop health analysis error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to analyze crop health",
    })
  }
})

// Get crop recommendations for a land plot
router.post("/crop-recommendations", isAuthenticated, async (req, res) => {
  try {
    const { landData, season } = req.body

    if (!landData || !landData.soilType) {
      return res.status(400).json({
        success: false,
        message: "Land data with soil type is required",
      })
    }

    const result = await getCropRecommendations(landData, season || "current")

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to get crop recommendations",
        error: result.error,
      })
    }

    res.status(200).json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error("Crop recommendations error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get crop recommendations",
    })
  }
})

module.exports = router
