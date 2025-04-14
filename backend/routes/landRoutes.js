const express = require("express")
const router = express.Router()
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const { isAuthenticated, isResearcher, isAdmin } = require("../middleware/authMiddleware")
const Land = require("../models/Land")
const Crop = require("../models/Crop")
const { getCropRecommendations } = require("../utils/geminiAI")

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "..", "uploads")
const landImagesDir = path.join(uploadsDir, "land")

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir)
}

if (!fs.existsSync(landImagesDir)) {
  fs.mkdirSync(landImagesDir)
}

// Configure storage for land images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, landImagesDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, "land-" + uniqueSuffix + ext)
  },
})

// File filter to only allow image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true)
  } else {
    cb(new Error("Only image files are allowed!"), false)
  }
}

// Create the multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
})

// Get all land plots
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const { search, status, sort, limit = 20, page = 1 } = req.query

    // Build query
    const query = { isActive: true }

    // Add filters
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { soilType: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ]
    }

    if (status && ["available", "planted", "fallow", "maintenance"].includes(status)) {
      query.status = status
    }

    // Calculate pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Build sort options
    let sortOptions = { name: 1 } // default sort by name ascending
    if (sort) {
      const [field, order] = sort.split(":")
      sortOptions = { [field]: order === "desc" ? -1 : 1 }
    }

    // Execute query with pagination and populate references
    const lands = await Land.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number.parseInt(limit))
      .populate("currentCrop", "name scientificName imageUrl")
      .populate("createdBy", "name email")

    // Get total count for pagination
    const totalLands = await Land.countDocuments(query)

    // Get counts by status for dashboard
    const statusCounts = await Land.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ])

    // Format status counts
    const formattedStatusCounts = {}
    statusCounts.forEach((item) => {
      formattedStatusCounts[item._id] = item.count
    })

    res.status(200).json({
      success: true,
      data: {
        lands,
        statusCounts: formattedStatusCounts,
        pagination: {
          total: totalLands,
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          pages: Math.ceil(totalLands / Number.parseInt(limit)),
        },
      },
    })
  } catch (error) {
    console.error("Get lands error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to retrieve land plots",
    })
  }
})

// Get a single land plot by ID
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const land = await Land.findById(req.params.id)
      .populate("currentCrop", "name scientificName imageUrl")
      .populate("createdBy", "name email")
      .populate("seasonalRecommendations.crops.cropId", "name scientificName imageUrl")

    if (!land || !land.isActive) {
      return res.status(404).json({
        success: false,
        message: "Land plot not found",
      })
    }

    res.status(200).json({
      success: true,
      data: {
        land,
      },
    })
  } catch (error) {
    console.error("Get land error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to retrieve land plot",
    })
  }
})

// Create a new land plot
router.post("/", isAuthenticated, upload.single("image"), async (req, res) => {
  try {
    const {
      name,
      location,
      coordinates,
      size,
      unit,
      soilType,
      soilPh,
      soilMoisture,
      currentCrop,
      plantingDate,
      expectedHarvestDate,
      status,
      notes,
    } = req.body

    // Validate required fields
    if (!name || !size) {
      // If there was an uploaded file but validation failed, remove it
      if (req.file) {
        fs.unlinkSync(req.file.path)
      }

      return res.status(400).json({
        success: false,
        message: "Name and size are required",
      })
    }

    // Check if land with same name already exists
    const existingLand = await Land.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
      isActive: true,
    })

    if (existingLand) {
      // If there was an uploaded file but land exists, remove it
      if (req.file) {
        fs.unlinkSync(req.file.path)
      }

      return res.status(400).json({
        success: false,
        message: "A land plot with this name already exists",
      })
    }

    // Verify current crop exists if provided
    if (currentCrop) {
      const crop = await Crop.findById(currentCrop)
      if (!crop) {
        // If there was an uploaded file but crop not found, remove it
        if (req.file) {
          fs.unlinkSync(req.file.path)
        }

        return res.status(404).json({
          success: false,
          message: "Current crop not found",
        })
      }
    }

    // Parse coordinates if provided as string
    let parsedCoordinates = coordinates
    if (typeof coordinates === "string") {
      try {
        parsedCoordinates = JSON.parse(coordinates)
      } catch (e) {
        // If it's not valid JSON, try to parse as comma-separated values
        const [latitude, longitude] = coordinates.split(",").map((c) => c.trim())
        parsedCoordinates = { latitude, longitude }
      }
    }

    // Create land data
    const landData = {
      name,
      location,
      coordinates: parsedCoordinates,
      size: {
        value: Number.parseFloat(size),
        unit: unit || "hectare",
      },
      soilType,
      soilPh: soilPh ? Number.parseFloat(soilPh) : undefined,
      notes,
      createdBy: req.user._id,
    }

    // Add soil moisture if provided
    if (soilMoisture) {
      landData.soilMoisture = {
        value: Number.parseFloat(soilMoisture),
        lastUpdated: new Date(),
      }
    }

    // Add current crop and related fields if provided
    if (currentCrop) {
      landData.currentCrop = currentCrop
      landData.status = "planted"

      if (plantingDate) {
        landData.plantingDate = new Date(plantingDate)
      }

      if (expectedHarvestDate) {
        landData.expectedHarvestDate = new Date(expectedHarvestDate)
      }
    } else if (status) {
      landData.status = status
    }

    // Add image URL if file was uploaded
    if (req.file) {
      landData.imageUrl = `/uploads/land/${req.file.filename}`
    }

    // Create the land plot
    const land = await Land.create(landData)

    res.status(201).json({
      success: true,
      message: "Land plot created successfully",
      data: {
        land,
      },
    })
  } catch (error) {
    console.error("Create land error:", error)

    // If there was an uploaded file but an error occurred, remove it
    if (req.file) {
      fs.unlinkSync(req.file.path)
    }

    res.status(500).json({
      success: false,
      message: "Failed to create land plot",
    })
  }
})

// Update a land plot
router.put("/:id", isAuthenticated, upload.single("image"), async (req, res) => {
  try {
    const {
      name,
      location,
      coordinates,
      size,
      unit,
      soilType,
      soilPh,
      soilMoisture,
      currentCrop,
      plantingDate,
      expectedHarvestDate,
      status,
      notes,
    } = req.body

    // Find land
    const land = await Land.findById(req.params.id)
    if (!land || !land.isActive) {
      // If there was an uploaded file but land not found, remove it
      if (req.file) {
        fs.unlinkSync(req.file.path)
      }

      return res.status(404).json({
        success: false,
        message: "Land plot not found",
      })
    }

    // If name is being changed, check if the new name already exists
    if (name && name !== land.name) {
      const existingLand = await Land.findOne({
        name: { $regex: new RegExp(`^${name}$`, "i") },
        _id: { $ne: land._id },
        isActive: true,
      })

      if (existingLand) {
        // If there was an uploaded file but name exists, remove it
        if (req.file) {
          fs.unlinkSync(req.file.path)
        }

        return res.status(400).json({
          success: false,
          message: "A land plot with this name already exists",
        })
      }
    }

    // Verify current crop exists if provided
    if (currentCrop) {
      const crop = await Crop.findById(currentCrop)
      if (!crop) {
        // If there was an uploaded file but crop not found, remove it
        if (req.file) {
          fs.unlinkSync(req.file.path)
        }

        return res.status(404).json({
          success: false,
          message: "Current crop not found",
        })
      }
    }

    // Parse coordinates if provided as string
    let parsedCoordinates = coordinates
    if (typeof coordinates === "string") {
      try {
        parsedCoordinates = JSON.parse(coordinates)
      } catch (e) {
        // If it's not valid JSON, try to parse as comma-separated values
        const [latitude, longitude] = coordinates.split(",").map((c) => c.trim())
        parsedCoordinates = { latitude, longitude }
      }
    }

    // Update fields
    if (name) land.name = name
    if (location !== undefined) land.location = location
    if (parsedCoordinates) land.coordinates = parsedCoordinates
    if (size) land.size.value = Number.parseFloat(size)
    if (unit) land.size.unit = unit
    if (soilType !== undefined) land.soilType = soilType
    if (soilPh !== undefined) land.soilPh = Number.parseFloat(soilPh)
    if (soilMoisture) {
      land.soilMoisture = {
        value: Number.parseFloat(soilMoisture),
        lastUpdated: new Date(),
      }
    }
    if (notes !== undefined) land.notes = notes

    // Update crop-related fields
    if (currentCrop) {
      land.currentCrop = currentCrop
      land.status = "planted"

      if (plantingDate) {
        land.plantingDate = new Date(plantingDate)
      }

      if (expectedHarvestDate) {
        land.expectedHarvestDate = new Date(expectedHarvestDate)
      }
    } else if (status) {
      land.status = status
    }

    // Handle image update
    if (req.file) {
      // If there's an existing image, delete it
      if (land.imageUrl) {
        const oldImagePath = path.join(__dirname, "..", land.imageUrl)
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath)
        }
      }

      // Update with new image URL
      land.imageUrl = `/uploads/land/${req.file.filename}`
    }

    await land.save()

    res.status(200).json({
      success: true,
      message: "Land plot updated successfully",
      data: {
        land,
      },
    })
  } catch (error) {
    console.error("Update land error:", error)

    // If there was an uploaded file but an error occurred, remove it
    if (req.file) {
      fs.unlinkSync(req.file.path)
    }

    res.status(500).json({
      success: false,
      message: "Failed to update land plot",
    })
  }
})

// Delete a land plot (soft delete)
router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    const land = await Land.findById(req.params.id)
    if (!land || !land.isActive) {
      return res.status(404).json({
        success: false,
        message: "Land plot not found",
      })
    }

    // Soft delete by setting isActive to false
    land.isActive = false
    await land.save()

    res.status(200).json({
      success: true,
      message: "Land plot deleted successfully",
    })
  } catch (error) {
    console.error("Delete land error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete land plot",
    })
  }
})

// Update soil moisture for a land plot
router.patch("/:id/soil-moisture", isAuthenticated, async (req, res) => {
  try {
    const { moisture } = req.body

    if (moisture === undefined || isNaN(Number.parseFloat(moisture))) {
      return res.status(400).json({
        success: false,
        message: "Valid moisture value is required",
      })
    }

    const land = await Land.findById(req.params.id)
    if (!land || !land.isActive) {
      return res.status(404).json({
        success: false,
        message: "Land plot not found",
      })
    }

    // Update soil moisture
    land.soilMoisture = {
      value: Number.parseFloat(moisture),
      lastUpdated: new Date(),
    }

    await land.save()

    res.status(200).json({
      success: true,
      message: "Soil moisture updated successfully",
      data: {
        soilMoisture: land.soilMoisture,
      },
    })
  } catch (error) {
    console.error("Update soil moisture error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update soil moisture",
    })
  }
})

// Get crop recommendations for a land plot
router.get("/:id/recommendations", isAuthenticated, async (req, res) => {
  try {
    const { season } = req.query

    const land = await Land.findById(req.params.id)
    if (!land || !land.isActive) {
      return res.status(404).json({
        success: false,
        message: "Land plot not found",
      })
    }

    // Get recommendations from Gemini AI
    const recommendations = await getCropRecommendations(land, season || "current")

    if (!recommendations.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate crop recommendations",
        error: recommendations.error,
      })
    }

    // Process recommendations to link with existing crops in the database
    const processedRecommendations = []
    if (recommendations.data.recommendations) {
      for (const rec of recommendations.data.recommendations) {
        // Try to find matching crop in database
        const cropName = rec.cropName
        const crop = await Crop.findOne({
          name: { $regex: new RegExp(`^${cropName}$`, "i") },
          isActive: true,
        })

        processedRecommendations.push({
          cropId: crop ? crop._id : null,
          cropName: rec.cropName,
          suitabilityScore: rec.suitabilityScore,
          reasoning: rec.reasoning,
          bestPractices: rec.bestPractices,
        })
      }
    }

    // Save recommendations to land document
    land.seasonalRecommendations = [
      {
        season: season || "current",
        crops: processedRecommendations.map((rec) => ({
          cropId: rec.cropId,
          suitabilityScore: rec.suitabilityScore,
          notes: `${rec.reasoning} ${rec.bestPractices}`,
        })),
      },
      ...land.seasonalRecommendations.filter((r) => r.season !== (season || "current")),
    ]

    await land.save()

    res.status(200).json({
      success: true,
      data: {
        recommendations: processedRecommendations,
        season: season || "current",
      },
    })
  } catch (error) {
    console.error("Get crop recommendations error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get crop recommendations",
    })
  }
})

module.exports = router
