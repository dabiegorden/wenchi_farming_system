const express = require("express")
const router = express.Router()
const { isAdmin } = require("../middleware/authMiddleware")
const User = require("../models/User")
const Settings = require("../models/Settings")
const Crop = require("../models/Crop")
const Land = require("../models/Land")
const { InventoryItem } = require("../models/Inventory")
const HealthAssessment = require("../models/Health")
const Notification = require("../models/Notification")

// Admin dashboard home - basic stats
router.get("/dashboard", isAdmin, async (req, res) => {
  try {
    // Get basic user stats
    const totalUsers = await User.countDocuments()
    const usersByRole = await User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }])

    // Format role stats
    const roleStats = {}
    usersByRole.forEach((item) => {
      roleStats[item._id] = item.count
    })

    // Get crop stats
    const totalCrops = await Crop.countDocuments({ isActive: true })

    // Get land stats
    const totalLands = await Land.countDocuments({ isActive: true })
    const landsByStatus = await Land.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ])

    // Format land status stats
    const landStatusStats = {}
    landsByStatus.forEach((item) => {
      landStatusStats[item._id] = item.count
    })

    // Get inventory stats
    const totalInventoryItems = await InventoryItem.countDocuments({ isActive: true })
    const lowStockItems = await InventoryItem.countDocuments({
      isActive: true,
      $expr: { $lte: ["$quantity", "$reorderLevel"] },
    })

    // Get health assessment stats
    const totalHealthAssessments = await HealthAssessment.countDocuments({ isActive: true })
    const healthByStatus = await HealthAssessment.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ])

    // Format health status stats
    const healthStatusStats = {}
    healthByStatus.forEach((item) => {
      healthStatusStats[item._id] = item.count
    })

    // Get notification stats
    const totalNotifications = await Notification.countDocuments({ isActive: true })
    const unreadNotifications = await Notification.countDocuments({
      isActive: true,
      "recipients.read": false,
    })

    res.status(200).json({
      success: true,
      data: {
        stats: {
          users: {
            total: totalUsers,
            byRole: roleStats,
          },
          crops: {
            total: totalCrops,
          },
          lands: {
            total: totalLands,
            byStatus: landStatusStats,
          },
          inventory: {
            total: totalInventoryItems,
            lowStock: lowStockItems,
          },
          health: {
            total: totalHealthAssessments,
            byStatus: healthStatusStats,
          },
          notifications: {
            total: totalNotifications,
            unread: unreadNotifications,
          },
        },
      },
    })
  } catch (error) {
    console.error("Admin dashboard error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard data",
    })
  }
})

// System settings routes
router.get("/settings", isAdmin, async (req, res) => {
  try {
    // Get settings from database or create default if none exists
    let settings = await Settings.findOneOrCreate({})

    // Hide sensitive information
    if (settings.weatherApiKey) {
      settings = settings.toObject()
      settings.weatherApiKey = settings.weatherApiKey ? "********" : "Not configured"
    }

    res.status(200).json({
      success: true,
      data: {
        settings,
      },
    })
  } catch (error) {
    console.error("Admin settings error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to load system settings",
    })
  }
})

// Update system settings
router.put("/settings", isAdmin, async (req, res) => {
  try {
    const {
      appName,
      appVersion,
      farmLocation,
      theme,
      contactEmail,
      allowRegistration,
      defaultUserRole,
      maintenanceMode,
    } = req.body

    // Validate required fields
    if (!appName) {
      return res.status(400).json({
        success: false,
        message: "Application name is required",
      })
    }

    // Get settings or create default if none exists
    const settings = await Settings.findOneOrCreate({})

    // Update fields
    settings.appName = appName
    if (appVersion) settings.appVersion = appVersion
    if (farmLocation) settings.farmLocation = farmLocation
    if (theme) settings.theme = { ...settings.theme, ...theme }
    if (contactEmail) settings.contactEmail = contactEmail
    if (allowRegistration !== undefined) settings.allowRegistration = allowRegistration
    if (defaultUserRole) settings.defaultUserRole = defaultUserRole
    if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode

    // Record who updated the settings
    settings.updatedBy = req.user._id

    await settings.save()

    // Hide sensitive information in response
    const settingsResponse = settings.toObject()
    if (settingsResponse.weatherApiKey) {
      settingsResponse.weatherApiKey = "********"
    }

    res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: {
        settings: settingsResponse,
      },
    })
  } catch (error) {
    console.error("Update settings error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update settings",
    })
  }
})

// Update weather API key (separate endpoint for security)
router.put("/settings/weather-api-key", isAdmin, async (req, res) => {
  try {
    const { weatherApiKey } = req.body

    if (!weatherApiKey) {
      return res.status(400).json({
        success: false,
        message: "Weather API key is required",
      })
    }

    // Get settings or create default if none exists
    const settings = await Settings.findOneOrCreate({})

    // Update API key
    settings.weatherApiKey = weatherApiKey
    settings.updatedBy = req.user._id

    await settings.save()

    res.status(200).json({
      success: true,
      message: "Weather API key updated successfully",
    })
  } catch (error) {
    console.error("Update weather API key error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update weather API key",
    })
  }
})

// Update Gemini API key (for AI features)
router.put("/settings/gemini-api-key", isAdmin, async (req, res) => {
  try {
    const { geminiApiKey } = req.body

    if (!geminiApiKey) {
      return res.status(400).json({
        success: false,
        message: "Gemini API key is required",
      })
    }

    // Get settings or create default if none exists
    const settings = await Settings.findOneOrCreate({})

    // Add geminiApiKey to settings if it doesn't exist in the schema
    if (!settings.geminiApiKey) {
      // Update the environment variable directly
      process.env.GEMINI_API_KEY = geminiApiKey

      // We'll store a placeholder in settings to indicate it's configured
      settings.geminiApiKey = "configured"
    } else {
      // Update the environment variable
      process.env.GEMINI_API_KEY = geminiApiKey
    }

    settings.updatedBy = req.user._id
    await settings.save()

    res.status(200).json({
      success: true,
      message: "Gemini API key updated successfully",
    })
  } catch (error) {
    console.error("Update Gemini API key error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update Gemini API key",
    })
  }
})

// Admin logs route - could show system logs
router.get("/logs", isAdmin, (req, res) => {
  // In a real app, you would fetch logs from a database or log files
  // For simplicity, we'll return mock data
  const logs = [
    { timestamp: new Date(), level: "info", message: "System started" },
    { timestamp: new Date(Date.now() - 3600000), level: "warning", message: "High server load detected" },
    { timestamp: new Date(Date.now() - 7200000), level: "error", message: "Database connection failed" },
  ]

  res.status(200).json({
    success: true,
    data: {
      logs,
    },
  })
})

// Reports routes
router.get("/reports", isAdmin, async (req, res) => {
  try {
    // In a real app, you would fetch available report types from a database
    const availableReports = [
      { id: "user-activity", name: "User Activity Report", description: "Shows user login and activity statistics" },
      { id: "crop-yield", name: "Crop Yield Report", description: "Shows crop yield statistics by season" },
      { id: "weather-impact", name: "Weather Impact Analysis", description: "Analyzes weather impact on crop yields" },
      { id: "inventory", name: "Inventory Report", description: "Current inventory levels and usage trends" },
      {
        id: "health",
        name: "Crop Health Report",
        description: "Analysis of crop health assessments and disease trends",
      },
      { id: "land-usage", name: "Land Usage Report", description: "Land utilization and soil condition analysis" },
    ]

    res.status(200).json({
      success: true,
      data: {
        reports: availableReports,
      },
    })
  } catch (error) {
    console.error("Reports list error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch available reports",
    })
  }
})

// Generate a specific report
router.get("/reports/:reportId", isAdmin, async (req, res) => {
  try {
    const { reportId } = req.params
    const { startDate, endDate } = req.query

    // Validate date parameters
    if (startDate && !isValidDate(startDate)) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date format. Use YYYY-MM-DD",
      })
    }

    if (endDate && !isValidDate(endDate)) {
      return res.status(400).json({
        success: false,
        message: "Invalid end date format. Use YYYY-MM-DD",
      })
    }

    // In a real app, you would generate the report based on the reportId and date range
    // For now, we'll return mock data
    let reportData

    switch (reportId) {
      case "user-activity":
        reportData = generateMockUserActivityReport(startDate, endDate)
        break
      case "crop-yield":
        reportData = generateMockCropYieldReport(startDate, endDate)
        break
      case "weather-impact":
        reportData = generateMockWeatherImpactReport(startDate, endDate)
        break
      case "inventory":
        reportData = generateMockInventoryReport(startDate, endDate)
        break
      case "health":
        reportData = generateMockHealthReport(startDate, endDate)
        break
      case "land-usage":
        reportData = generateMockLandUsageReport(startDate, endDate)
        break
      default:
        return res.status(404).json({
          success: false,
          message: "Report type not found",
        })
    }

    res.status(200).json({
      success: true,
      data: {
        report: reportData,
      },
    })
  } catch (error) {
    console.error("Report generation error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to generate report",
    })
  }
})

// Helper function to validate date format
function isValidDate(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateString)) return false

  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date)
}

// Mock report generators
function generateMockUserActivityReport(startDate, endDate) {
  return {
    title: "User Activity Report",
    dateRange: { startDate: startDate || "2025-01-01", endDate: endDate || "2025-04-12" },
    summary: {
      totalLogins: 245,
      uniqueUsers: 18,
      averageSessionDuration: "24 minutes",
    },
    activityByRole: [
      { role: "admin", logins: 42, averageSessionDuration: "45 minutes" },
      { role: "researcher", logins: 103, averageSessionDuration: "32 minutes" },
      { role: "user", logins: 100, averageSessionDuration: "12 minutes" },
    ],
    topUsers: [
      { name: "John Doe", email: "john@example.com", logins: 32 },
      { name: "Jane Smith", email: "jane@example.com", logins: 28 },
      { name: "Bob Johnson", email: "bob@example.com", logins: 25 },
    ],
  }
}

function generateMockCropYieldReport(startDate, endDate) {
  return {
    title: "Crop Yield Report",
    dateRange: { startDate: startDate || "2025-01-01", endDate: endDate || "2025-04-12" },
    summary: {
      totalHarvest: "1,250 kg",
      averageYieldPerHectare: "3,200 kg/ha",
      topPerformingCrop: "Maize",
    },
    cropPerformance: [
      { crop: "Maize", yield: "4,200 kg/ha", change: "+5% from last season" },
      { crop: "Cassava", yield: "3,800 kg/ha", change: "+2% from last season" },
      { crop: "Yam", yield: "2,900 kg/ha", change: "-3% from last season" },
      { crop: "Rice", yield: "2,100 kg/ha", change: "+8% from last season" },
    ],
    fieldPerformance: [
      { field: "North Field", size: "2.4 ha", yield: "3,900 kg/ha" },
      { field: "South Field", size: "1.8 ha", yield: "3,200 kg/ha" },
      { field: "East Field", size: "3.2 ha", yield: "2,800 kg/ha" },
    ],
  }
}

function generateMockWeatherImpactReport(startDate, endDate) {
  return {
    title: "Weather Impact Analysis",
    dateRange: { startDate: startDate || "2025-01-01", endDate: endDate || "2025-04-12" },
    summary: {
      averageTemperature: "28°C",
      totalRainfall: "320mm",
      weatherEvents: "2 major storms",
    },
    impactAnalysis: [
      { crop: "Maize", impact: "Positive", details: "Increased rainfall improved yield by approximately 8%" },
      { crop: "Cassava", impact: "Neutral", details: "No significant weather impact observed" },
      { crop: "Yam", impact: "Negative", details: "High temperatures in March reduced yield by approximately 5%" },
    ],
    recommendations: [
      "Consider drought-resistant maize varieties for next season",
      "Implement additional irrigation for the East Field",
      "Plant earlier to avoid the high temperature period in March",
    ],
  }
}

function generateMockInventoryReport(startDate, endDate) {
  return {
    title: "Inventory Report",
    dateRange: { startDate: startDate || "2025-01-01", endDate: endDate || "2025-04-12" },
    summary: {
      totalItems: 48,
      lowStockItems: 5,
      totalValue: "$12,450",
    },
    categories: [
      { category: "Seeds", itemCount: 12, value: "$3,200", status: "Adequate" },
      { category: "Fertilizers", itemCount: 8, value: "$4,800", status: "Low Stock" },
      { category: "Pesticides", itemCount: 6, value: "$1,950", status: "Adequate" },
      { category: "Tools", itemCount: 22, value: "$2,500", status: "Adequate" },
    ],
    lowStockItems: [
      { name: "NPK Fertilizer", category: "Fertilizers", currentStock: "50kg", reorderLevel: "100kg" },
      { name: "Urea", category: "Fertilizers", currentStock: "30kg", reorderLevel: "75kg" },
      { name: "Maize Seeds (Hybrid)", category: "Seeds", currentStock: "5kg", reorderLevel: "10kg" },
    ],
  }
}

function generateMockHealthReport(startDate, endDate) {
  return {
    title: "Crop Health Report",
    dateRange: { startDate: startDate || "2025-01-01", endDate: endDate || "2025-04-12" },
    summary: {
      totalAssessments: 78,
      healthIndex: 72,
      statusDistribution: {
        healthy: 42,
        mild: 18,
        moderate: 12,
        severe: 6,
        unknown: 0,
      },
    },
    cropAnalysis: [
      { crop: "Maize", assessments: 32, healthIndex: 80, commonIssue: "Leaf Rust" },
      { crop: "Cassava", assessments: 24, healthIndex: 65, commonIssue: "Mosaic Disease" },
      { crop: "Yam", assessments: 22, healthIndex: 70, commonIssue: "Anthracnose" },
    ],
    diseasePrevalence: [
      { disease: "Leaf Rust", occurrences: 14, affectedCrops: ["Maize", "Rice"] },
      { disease: "Mosaic Disease", occurrences: 12, affectedCrops: ["Cassava"] },
      { disease: "Anthracnose", occurrences: 10, affectedCrops: ["Yam", "Mango"] },
      { disease: "Blight", occurrences: 8, affectedCrops: ["Tomato", "Potato"] },
    ],
    recommendations: [
      "Implement regular crop rotation to reduce disease buildup",
      "Apply fungicide treatments for leaf rust in maize fields",
      "Increase monitoring frequency for cassava crops showing early signs of mosaic disease",
    ],
  }
}

function generateMockLandUsageReport(startDate, endDate) {
  return {
    title: "Land Usage Report",
    dateRange: { startDate: startDate || "2025-01-01", endDate: endDate || "2025-04-12" },
    summary: {
      totalLand: "24.5 hectares",
      activePlots: 8,
      fallowPlots: 2,
      averageSoilMoisture: "42%",
    },
    landStatus: [
      { status: "Planted", area: "18.2 hectares", percentage: "74%" },
      { status: "Fallow", area: "3.8 hectares", percentage: "16%" },
      { status: "Maintenance", area: "2.5 hectares", percentage: "10%" },
    ],
    soilConditions: [
      { plot: "North Field", size: "4.2 ha", soilType: "Loamy", pH: 6.8, moisture: "45%", status: "Good" },
      { plot: "South Field", size: "3.8 ha", soilType: "Clay", pH: 7.2, moisture: "38%", status: "Fair" },
      {
        plot: "East Field",
        size: "5.5 ha",
        soilType: "Sandy Loam",
        pH: 6.5,
        moisture: "32%",
        status: "Needs Irrigation",
      },
    ],
    recommendations: [
      "Increase irrigation in East Field to improve soil moisture levels",
      "Apply lime to South Field to optimize pH for planned crops",
      "Consider cover crops for fallow plots to improve soil health",
    ],
  }
}

module.exports = router
