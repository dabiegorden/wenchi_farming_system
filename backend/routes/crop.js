const express = require("express")
const router = express.Router()
const { isAuthenticated, isResearcher, isAdmin } = require("../middleware/authMiddleware")
const fs = require("fs")
const path = require("path")
const upload = require("../utils/fileUpload")
const Crop = require("../models/Crop") // Import the model directly

// Get all crops - accessible to all authenticated users
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const { search, sort, limit = 20, page = 1 } = req.query

    // Build query
    const query = { isActive: true }

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { scientificName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ]
    }

    // Calculate pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Build sort options
    let sortOptions = { name: 1 } // default sort by name ascending
    if (sort) {
      const [field, order] = sort.split(":")
      sortOptions = { [field]: order === "desc" ? -1 : 1 }
    }

    // Execute query with pagination
    const crops = await Crop.find(query).sort(sortOptions).skip(skip).limit(Number.parseInt(limit)).select("-__v")

    // Get total count for pagination
    const totalCrops = await Crop.countDocuments(query)

    res.status(200).json({
      success: true,
      data: {
        crops,
        pagination: {
          total: totalCrops,
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          pages: Math.ceil(totalCrops / Number.parseInt(limit)),
        },
      },
    })
  } catch (error) {
    console.error("Get crops error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to retrieve crops",
    })
  }
})

// Get a single crop by ID
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id)

    if (!crop || !crop.isActive) {
      return res.status(404).json({
        success: false,
        message: "Crop not found",
      })
    }

    res.status(200).json({
      success: true,
      data: {
        crop,
      },
    })
  } catch (error) {
    console.error("Get crop error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to retrieve crop",
    })
  }
})

// Add new crop with image upload - only admin can add new crops to the system
router.post("/", isAdmin, upload.single("image"), async (req, res) => {
  try {
    const {
      name,
      scientificName,
      description,
      growthDuration,
      waterRequirements,
      idealTemperature,
      plantingSeasons,
      soilRequirements,
      commonDiseases,
      nutritionalValue,
    } = req.body

    // Validate required fields
    if (!name) {
      // If there was an uploaded file but validation failed, remove it
      if (req.file) {
        fs.unlinkSync(req.file.path)
      }

      return res.status(400).json({
        success: false,
        message: "Crop name is required",
      })
    }

    // Check if crop already exists
    const existingCrop = await Crop.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } })
    if (existingCrop) {
      // If there was an uploaded file but crop exists, remove it
      if (req.file) {
        fs.unlinkSync(req.file.path)
      }

      return res.status(400).json({
        success: false,
        message: "A crop with this name already exists",
      })
    }

    // Process array fields that come as strings from form data
    let processedPlantingSeasons = plantingSeasons
    let processedSoilRequirements = soilRequirements
    let processedCommonDiseases = commonDiseases

    // Handle array fields that might come as JSON strings from form data
    if (typeof plantingSeasons === "string") {
      try {
        processedPlantingSeasons = JSON.parse(plantingSeasons)
      } catch (e) {
        processedPlantingSeasons = plantingSeasons.split(",").map((item) => item.trim())
      }
    }

    if (typeof soilRequirements === "string") {
      try {
        processedSoilRequirements = JSON.parse(soilRequirements)
      } catch (e) {
        processedSoilRequirements = soilRequirements.split(",").map((item) => item.trim())
      }
    }

    if (typeof commonDiseases === "string") {
      try {
        processedCommonDiseases = JSON.parse(commonDiseases)
      } catch (e) {
        processedCommonDiseases = commonDiseases.split(",").map((item) => item.trim())
      }
    }

    // Process idealTemperature if it comes as a string
    let processedIdealTemperature = idealTemperature
    if (typeof idealTemperature === "string") {
      try {
        processedIdealTemperature = JSON.parse(idealTemperature)
      } catch (e) {
        // If it's not valid JSON, leave as is
      }
    }

    // Create new crop with image if uploaded
    const cropData = {
      name,
      scientificName,
      description,
      growthDuration: Number.parseInt(growthDuration) || undefined,
      waterRequirements,
      idealTemperature: processedIdealTemperature,
      plantingSeasons: processedPlantingSeasons,
      soilRequirements: processedSoilRequirements,
      commonDiseases: processedCommonDiseases,
      nutritionalValue,
      createdBy: req.user._id,
    }

    // Add image URL if file was uploaded
    if (req.file) {
      // Create URL path for the image
      cropData.imageUrl = `/uploads/crops/${req.file.filename}`
    }

    const crop = await Crop.create(cropData)

    res.status(201).json({
      success: true,
      message: "Crop added successfully",
      data: {
        crop,
      },
    })
  } catch (error) {
    console.error("Add crop error:", error)

    // If there was an uploaded file but an error occurred, remove it
    if (req.file) {
      fs.unlinkSync(req.file.path)
    }

    res.status(500).json({
      success: false,
      message: "Failed to add crop",
    })
  }
})

// Update crop with image upload - only admin can update crops
router.put("/:id", isAdmin, upload.single("image"), async (req, res) => {
  try {
    const {
      name,
      scientificName,
      description,
      growthDuration,
      waterRequirements,
      idealTemperature,
      plantingSeasons,
      soilRequirements,
      commonDiseases,
      nutritionalValue,
    } = req.body

    // Find crop
    const crop = await Crop.findById(req.params.id)
    if (!crop) {
      // If there was an uploaded file but crop not found, remove it
      if (req.file) {
        fs.unlinkSync(req.file.path)
      }

      return res.status(404).json({
        success: false,
        message: "Crop not found",
      })
    }

    // If name is being changed, check if the new name already exists
    if (name && name !== crop.name) {
      const existingCrop = await Crop.findOne({
        name: { $regex: new RegExp(`^${name}$`, "i") },
        _id: { $ne: crop._id },
      })

      if (existingCrop) {
        // If there was an uploaded file but name exists, remove it
        if (req.file) {
          fs.unlinkSync(req.file.path)
        }

        return res.status(400).json({
          success: false,
          message: "A crop with this name already exists",
        })
      }
    }

    // Process array fields that come as strings from form data
    let processedPlantingSeasons = plantingSeasons
    let processedSoilRequirements = soilRequirements
    let processedCommonDiseases = commonDiseases

    // Handle array fields that might come as JSON strings from form data
    if (typeof plantingSeasons === "string") {
      try {
        processedPlantingSeasons = JSON.parse(plantingSeasons)
      } catch (e) {
        processedPlantingSeasons = plantingSeasons.split(",").map((item) => item.trim())
      }
    }

    if (typeof soilRequirements === "string") {
      try {
        processedSoilRequirements = JSON.parse(soilRequirements)
      } catch (e) {
        processedSoilRequirements = soilRequirements.split(",").map((item) => item.trim())
      }
    }

    if (typeof commonDiseases === "string") {
      try {
        processedCommonDiseases = JSON.parse(commonDiseases)
      } catch (e) {
        processedCommonDiseases = commonDiseases.split(",").map((item) => item.trim())
      }
    }

    // Process idealTemperature if it comes as a string
    let processedIdealTemperature = idealTemperature
    if (typeof idealTemperature === "string") {
      try {
        processedIdealTemperature = JSON.parse(idealTemperature)
      } catch (e) {
        // If it's not valid JSON, leave as is
      }
    }

    // Update crop fields
    if (name) crop.name = name
    if (scientificName !== undefined) crop.scientificName = scientificName
    if (description !== undefined) crop.description = description
    if (growthDuration !== undefined) crop.growthDuration = Number.parseInt(growthDuration) || crop.growthDuration
    if (waterRequirements !== undefined) crop.waterRequirements = waterRequirements
    if (idealTemperature !== undefined) crop.idealTemperature = processedIdealTemperature
    if (plantingSeasons !== undefined) crop.plantingSeasons = processedPlantingSeasons
    if (soilRequirements !== undefined) crop.soilRequirements = processedSoilRequirements
    if (commonDiseases !== undefined) crop.commonDiseases = processedCommonDiseases
    if (nutritionalValue !== undefined) crop.nutritionalValue = nutritionalValue

    // Handle image update
    if (req.file) {
      // If there's an existing image, delete it
      if (crop.imageUrl) {
        const oldImagePath = path.join(__dirname, "..", crop.imageUrl)
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath)
        }
      }

      // Update with new image URL
      crop.imageUrl = `/uploads/crops/${req.file.filename}`
    }

    await crop.save()

    res.status(200).json({
      success: true,
      message: "Crop updated successfully",
      data: {
        crop,
      },
    })
  } catch (error) {
    console.error("Update crop error:", error)

    // If there was an uploaded file but an error occurred, remove it
    if (req.file) {
      fs.unlinkSync(req.file.path)
    }

    res.status(500).json({
      success: false,
      message: "Failed to update crop",
    })
  }
})

// Delete crop (soft delete) - only admin can delete crops
router.delete("/:id", isAdmin, async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id)

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: "Crop not found",
      })
    }

    // Soft delete by setting isActive to false
    crop.isActive = false
    await crop.save()

    res.status(200).json({
      success: true,
      message: "Crop deleted successfully",
    })
  } catch (error) {
    console.error("Delete crop error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete crop",
    })
  }
})

// Hard delete crop - only admin can hard delete crops (use with caution)
router.delete("/:id/permanent", isAdmin, async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id)

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: "Crop not found",
      })
    }

    // If there's an image associated with the crop, delete it
    if (crop.imageUrl) {
      const imagePath = path.join(__dirname, "..", crop.imageUrl)
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }
    }

    // Hard delete
    await Crop.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: "Crop permanently deleted",
    })
  } catch (error) {
    console.error("Hard delete crop error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to permanently delete crop",
    })
  }
})

module.exports = router
