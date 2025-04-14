const express = require("express")
const router = express.Router()
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const { isAuthenticated, isResearcher, isAdmin } = require("../middleware/authMiddleware")
const HealthAssessment = require("../models/Health")
const Land = require("../models/Land")
const Crop = require("../models/Crop")
const { analyzeCropHealthBySymptoms, analyzeCropHealthByImage } = require("../utils/geminiAI")
const Notification = require("../models/Notification")

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "..", "uploads")
const healthImagesDir = path.join(uploadsDir, "health")

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir)
}

if (!fs.existsSync(healthImagesDir)) {
  fs.mkdirSync(healthImagesDir)
}

// Configure storage for health images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, healthImagesDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, "health-" + uniqueSuffix + ext)
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

// Get all health assessments
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const { search, cropId, landId, status, sort, limit = 20, page = 1 } = req.query

    // Build query
    const query = { isActive: true }

    // Add filters
    if (search) {
      query.$or = [{ notes: { $regex: search, $options: "i" } }]
    }

    if (cropId) {
      query.cropId = cropId
    }

    if (landId) {
      query.landId = landId
    }

    if (status && ["healthy", "mild", "moderate", "severe", "unknown"].includes(status)) {
      query.status = status
    }

    // Calculate pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Build sort options
    let sortOptions = { createdAt: -1 } // default sort by creation date, newest first
    if (sort) {
      const [field, order] = sort.split(":")
      sortOptions = { [field]: order === "desc" ? -1 : 1 }
    }

    // Execute query with pagination and populate references
    const assessments = await HealthAssessment.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number.parseInt(limit))
      .populate("cropId", "name scientificName imageUrl")
      .populate("landId", "name location")
      .populate("createdBy", "name email")

    // Get total count for pagination
    const totalAssessments = await HealthAssessment.countDocuments(query)

    res.status(200).json({
      success: true,
      data: {
        assessments,
        pagination: {
          total: totalAssessments,
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          pages: Math.ceil(totalAssessments / Number.parseInt(limit)),
        },
      },
    })
  } catch (error) {
    console.error("Get health assessments error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to retrieve health assessments",
    })
  }
})

// Get a single health assessment by ID
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const assessment = await HealthAssessment.findById(req.params.id)
      .populate("cropId", "name scientificName imageUrl")
      .populate("landId", "name location")
      .populate("createdBy", "name email")

    if (!assessment || !assessment.isActive) {
      return res.status(404).json({
        success: false,
        message: "Health assessment not found",
      })
    }

    res.status(200).json({
      success: true,
      data: {
        assessment,
      },
    })
  } catch (error) {
    console.error("Get health assessment error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to retrieve health assessment",
    })
  }
})

// Create a new health assessment with symptoms
router.post("/symptoms", isAuthenticated, async (req, res) => {
  try {
    const { cropId, landId, symptoms, notes } = req.body

    // Validate required fields
    if (!cropId || !symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Crop ID and symptoms are required",
      })
    }

    // Verify crop exists
    const crop = await Crop.findById(cropId)
    if (!crop) {
      return res.status(404).json({
        success: false,
        message: "Crop not found",
      })
    }

    // Verify land exists if provided
    if (landId) {
      const land = await Land.findById(landId)
      if (!land) {
        return res.status(404).json({
          success: false,
          message: "Land not found",
        })
      }
    }

    // Analyze symptoms using Gemini AI
    const aiAnalysis = await analyzeCropHealthBySymptoms(crop.name, symptoms)

    // Create assessment data
    const assessmentData = {
      cropId,
      landId,
      assessmentType: "symptom",
      symptoms,
      notes,
      createdBy: req.user._id,
    }

    // Add AI analysis if successful
    if (aiAnalysis.success) {
      assessmentData.aiAnalysis = {
        disease: aiAnalysis.data.disease || aiAnalysis.data.condition,
        confidence: aiAnalysis.data.confidenceLevel || 0,
        description: aiAnalysis.data.description,
        recommendations: aiAnalysis.data.recommendedTreatments || aiAnalysis.data.recommendations || [],
        rawResponse: aiAnalysis.data,
      }
      assessmentData.status = aiAnalysis.data.severity || "unknown"
    }

    // Create the health assessment
    const assessment = await HealthAssessment.create(assessmentData)

    // Create notification for severe issues
    if (assessmentData.status === "severe" || assessmentData.status === "moderate") {
      await Notification.create({
        title: `${assessmentData.status === "severe" ? "Severe" : "Moderate"} Health Issue Detected`,
        message: `A ${assessmentData.status} health issue (${
          assessmentData.aiAnalysis?.disease || "Unknown condition"
        }) has been detected for ${crop.name}${landId ? " on a specific land plot" : ""}.`,
        type: assessmentData.status === "severe" ? "alert" : "warning",
        priority: assessmentData.status === "severe" ? "high" : "medium",
        category: "health",
        relatedTo: {
          model: "HealthAssessment",
          id: assessment._id,
        },
        isGlobal: true,
        createdBy: req.user._id,
      })
    }

    res.status(201).json({
      success: true,
      message: "Health assessment created successfully",
      data: {
        assessment,
      },
    })
  } catch (error) {
    console.error("Create health assessment error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create health assessment",
    })
  }
})

// Create a new health assessment with image
router.post("/image", isAuthenticated, upload.single("image"), async (req, res) => {
  try {
    const { cropId, landId, notes } = req.body

    // Validate required fields
    if (!cropId || !req.file) {
      // If there was an uploaded file but validation failed, remove it
      if (req.file) {
        fs.unlinkSync(req.file.path)
      }

      return res.status(400).json({
        success: false,
        message: "Crop ID and image are required",
      })
    }

    // Verify crop exists
    const crop = await Crop.findById(cropId)
    if (!crop) {
      // Remove uploaded file
      if (req.file) {
        fs.unlinkSync(req.file.path)
      }

      return res.status(404).json({
        success: false,
        message: "Crop not found",
      })
    }

    // Verify land exists if provided
    if (landId) {
      const land = await Land.findById(landId)
      if (!land) {
        // Remove uploaded file
        if (req.file) {
          fs.unlinkSync(req.file.path)
        }

        return res.status(404).json({
          success: false,
          message: "Land not found",
        })
      }
    }

    // Create image URL
    const imageUrl = `/uploads/health/${req.file.filename}`

    // Analyze image using Gemini AI
    const aiAnalysis = await analyzeCropHealthByImage(crop.name, req.file.path)

    // Create assessment data
    const assessmentData = {
      cropId,
      landId,
      assessmentType: "image",
      imageUrl,
      notes,
      createdBy: req.user._id,
    }

    // Add AI analysis if successful
    if (aiAnalysis.success) {
      assessmentData.aiAnalysis = {
        disease: aiAnalysis.data.disease || aiAnalysis.data.condition,
        confidence: aiAnalysis.data.confidenceLevel || 0,
        description: aiAnalysis.data.description,
        recommendations: aiAnalysis.data.recommendedTreatments || aiAnalysis.data.recommendations || [],
        rawResponse: aiAnalysis.data,
      }
      assessmentData.status = aiAnalysis.data.severity || "unknown"
    }

    // Create the health assessment
    const assessment = await HealthAssessment.create(assessmentData)

    // Create notification for severe issues
    if (assessmentData.status === "severe" || assessmentData.status === "moderate") {
      await Notification.create({
        title: `${assessmentData.status === "severe" ? "Severe" : "Moderate"} Health Issue Detected`,
        message: `A ${assessmentData.status} health issue (${
          assessmentData.aiAnalysis?.disease || "Unknown condition"
        }) has been detected for ${crop.name}${landId ? " on a specific land plot" : ""}.`,
        type: assessmentData.status === "severe" ? "alert" : "warning",
        priority: assessmentData.status === "severe" ? "high" : "medium",
        category: "health",
        relatedTo: {
          model: "HealthAssessment",
          id: assessment._id,
        },
        isGlobal: true,
        createdBy: req.user._id,
      })
    }

    res.status(201).json({
      success: true,
      message: "Health assessment created successfully",
      data: {
        assessment,
      },
    })
  } catch (error) {
    console.error("Create health assessment error:", error)

    // If there was an uploaded file but an error occurred, remove it
    if (req.file) {
      fs.unlinkSync(req.file.path)
    }

    res.status(500).json({
      success: false,
      message: "Failed to create health assessment",
    })
  }
})

// Update a health assessment
router.put("/:id", isAuthenticated, async (req, res) => {
  try {
    const { notes, status } = req.body

    // Find assessment
    const assessment = await HealthAssessment.findById(req.params.id)
    if (!assessment || !assessment.isActive) {
      return res.status(404).json({
        success: false,
        message: "Health assessment not found",
      })
    }

    // Check if user is authorized to update
    if (
      assessment.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin" &&
      req.user.role !== "researcher"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this assessment",
      })
    }

    // Update fields
    if (notes !== undefined) assessment.notes = notes
    if (status && ["healthy", "mild", "moderate", "severe", "unknown"].includes(status)) {
      assessment.status = status
    }

    await assessment.save()

    res.status(200).json({
      success: true,
      message: "Health assessment updated successfully",
      data: {
        assessment,
      },
    })
  } catch (error) {
    console.error("Update health assessment error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update health assessment",
    })
  }
})

// Delete a health assessment (soft delete)
router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    const assessment = await HealthAssessment.findById(req.params.id)
    if (!assessment || !assessment.isActive) {
      return res.status(404).json({
        success: false,
        message: "Health assessment not found",
      })
    }

    // Check if user is authorized to delete
    if (
      assessment.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin" &&
      req.user.role !== "researcher"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this assessment",
      })
    }

    // Soft delete by setting isActive to false
    assessment.isActive = false
    await assessment.save()

    res.status(200).json({
      success: true,
      message: "Health assessment deleted successfully",
    })
  } catch (error) {
    console.error("Delete health assessment error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete health assessment",
    })
  }
})

module.exports = router
