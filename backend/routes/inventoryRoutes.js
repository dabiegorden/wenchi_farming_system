const express = require("express")
const router = express.Router()
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const { isAuthenticated, isResearcher, isAdmin } = require("../middleware/authMiddleware")
const { InventoryItem, InventoryUsage } = require("../models/Inventory")
const Notification = require("../models/Notification")

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "..", "uploads")
const inventoryImagesDir = path.join(uploadsDir, "inventory")

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir)
}

if (!fs.existsSync(inventoryImagesDir)) {
  fs.mkdirSync(inventoryImagesDir)
}

// Configure storage for inventory images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, inventoryImagesDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, "inventory-" + uniqueSuffix + ext)
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

// Get all inventory items
router.get("/items", isAuthenticated, async (req, res) => {
  try {
    const { search, category, lowStock, sort, limit = 20, page = 1 } = req.query

    // Build query
    const query = { isActive: true }

    // Add filters
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { supplier: { $regex: search, $options: "i" } },
      ]
    }

    if (category && ["fertilizer", "pesticide", "tool", "seed", "other"].includes(category)) {
      query.category = category
    }

    // Filter for low stock items
    if (lowStock === "true") {
      query.$expr = { $lte: ["$quantity", "$reorderLevel"] }
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
    const items = await InventoryItem.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number.parseInt(limit))
      .populate("createdBy", "name email")

    // Get total count for pagination
    const totalItems = await InventoryItem.countDocuments(query)

    // Get low stock count for dashboard
    const lowStockCount = await InventoryItem.countDocuments({
      isActive: true,
      $expr: { $lte: ["$quantity", "$reorderLevel"] },
    })

    res.status(200).json({
      success: true,
      data: {
        items,
        lowStockCount,
        pagination: {
          total: totalItems,
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          pages: Math.ceil(totalItems / Number.parseInt(limit)),
        },
      },
    })
  } catch (error) {
    console.error("Get inventory items error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to retrieve inventory items",
    })
  }
})

// Get a single inventory item by ID
router.get("/items/:id", isAuthenticated, async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id).populate("createdBy", "name email")

    if (!item || !item.isActive) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      })
    }

    // Get usage history for this item
    const usageHistory = await InventoryUsage.find({ itemId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("recordedBy", "name email")
      .populate("landId", "name location")
      .populate("cropId", "name")

    res.status(200).json({
      success: true,
      data: {
        item,
        usageHistory,
      },
    })
  } catch (error) {
    console.error("Get inventory item error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to retrieve inventory item",
    })
  }
})

// Create a new inventory item
router.post("/items", isAuthenticated, upload.single("image"), async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      quantity,
      unit,
      reorderLevel,
      unitCost,
      supplier,
      location,
      expiryDate,
      notes,
    } = req.body

    // Validate required fields
    if (!name || !category || !quantity || !unit) {
      // If there was an uploaded file but validation failed, remove it
      if (req.file) {
        fs.unlinkSync(req.file.path)
      }

      return res.status(400).json({
        success: false,
        message: "Name, category, quantity, and unit are required",
      })
    }

    // Check if item with same name already exists
    const existingItem = await InventoryItem.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
      isActive: true,
    })

    if (existingItem) {
      // If there was an uploaded file but item exists, remove it
      if (req.file) {
        fs.unlinkSync(req.file.path)
      }

      return res.status(400).json({
        success: false,
        message: "An inventory item with this name already exists",
      })
    }

    // Create item data
    const itemData = {
      name,
      category,
      description,
      quantity: Number.parseFloat(quantity),
      unit,
      reorderLevel: reorderLevel ? Number.parseFloat(reorderLevel) : 0,
      unitCost: unitCost ? Number.parseFloat(unitCost) : 0,
      supplier,
      location,
      notes,
      createdBy: req.user._id,
    }

    // Add expiry date if provided
    if (expiryDate) {
      itemData.expiryDate = new Date(expiryDate)
    }

    // Add image URL if file was uploaded
    if (req.file) {
      itemData.imageUrl = `/uploads/inventory/${req.file.filename}`
    }

    // Create the inventory item
    const item = await InventoryItem.create(itemData)

    res.status(201).json({
      success: true,
      message: "Inventory item created successfully",
      data: {
        item,
      },
    })
  } catch (error) {
    console.error("Create inventory item error:", error)

    // If there was an uploaded file but an error occurred, remove it
    if (req.file) {
      fs.unlinkSync(req.file.path)
    }

    res.status(500).json({
      success: false,
      message: "Failed to create inventory item",
    })
  }
})

// Update an inventory item
router.put("/items/:id", isAuthenticated, upload.single("image"), async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      quantity,
      unit,
      reorderLevel,
      unitCost,
      supplier,
      location,
      expiryDate,
      notes,
    } = req.body

    // Find item
    const item = await InventoryItem.findById(req.params.id)
    if (!item || !item.isActive) {
      // If there was an uploaded file but item not found, remove it
      if (req.file) {
        fs.unlinkSync(req.file.path)
      }

      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      })
    }

    // If name is being changed, check if the new name already exists
    if (name && name !== item.name) {
      const existingItem = await InventoryItem.findOne({
        name: { $regex: new RegExp(`^${name}$`, "i") },
        _id: { $ne: item._id },
        isActive: true,
      })

      if (existingItem) {
        // If there was an uploaded file but name exists, remove it
        if (req.file) {
          fs.unlinkSync(req.file.path)
        }

        return res.status(400).json({
          success: false,
          message: "An inventory item with this name already exists",
        })
      }
    }

    // Update fields
    if (name) item.name = name
    if (category) item.category = category
    if (description !== undefined) item.description = description
    if (quantity !== undefined) item.quantity = Number.parseFloat(quantity)
    if (unit) item.unit = unit
    if (reorderLevel !== undefined) item.reorderLevel = Number.parseFloat(reorderLevel)
    if (unitCost !== undefined) item.unitCost = Number.parseFloat(unitCost)
    if (supplier !== undefined) item.supplier = supplier
    if (location !== undefined) item.location = location
    if (notes !== undefined) item.notes = notes
    if (expiryDate) item.expiryDate = new Date(expiryDate)

    // Handle image update
    if (req.file) {
      // If there's an existing image, delete it
      if (item.imageUrl) {
        const oldImagePath = path.join(__dirname, "..", item.imageUrl)
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath)
        }
      }

      // Update with new image URL
      item.imageUrl = `/uploads/inventory/${req.file.filename}`
    }

    await item.save()

    // Check if item is now low in stock and create notification if needed
    if (item.quantity <= item.reorderLevel) {
      await Notification.create({
        title: "Low Inventory Alert",
        message: `${item.name} is low in stock (${item.quantity} ${item.unit} remaining). Reorder level: ${item.reorderLevel} ${item.unit}.`,
        type: "warning",
        priority: "medium",
        category: "inventory",
        relatedTo: {
          model: "InventoryItem",
          id: item._id,
        },
        isGlobal: true,
        createdBy: req.user._id,
      })
    }

    res.status(200).json({
      success: true,
      message: "Inventory item updated successfully",
      data: {
        item,
      },
    })
  } catch (error) {
    console.error("Update inventory item error:", error)

    // If there was an uploaded file but an error occurred, remove it
    if (req.file) {
      fs.unlinkSync(req.file.path)
    }

    res.status(500).json({
      success: false,
      message: "Failed to update inventory item",
    })
  }
})

// Delete an inventory item (soft delete)
router.delete("/items/:id", isAuthenticated, async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id)
    if (!item || !item.isActive) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      })
    }

    // Soft delete by setting isActive to false
    item.isActive = false
    await item.save()

    res.status(200).json({
      success: true,
      message: "Inventory item deleted successfully",
    })
  } catch (error) {
    console.error("Delete inventory item error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete inventory item",
    })
  }
})

// Record inventory usage
router.post("/usage", isAuthenticated, async (req, res) => {
  try {
    const { itemId, quantity, usageType, landId, cropId, notes } = req.body

    // Validate required fields
    if (!itemId || !quantity || !usageType) {
      return res.status(400).json({
        success: false,
        message: "Item ID, quantity, and usage type are required",
      })
    }

    // Find the inventory item
    const item = await InventoryItem.findById(itemId)
    if (!item || !item.isActive) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      })
    }

    // Check if there's enough quantity
    if (usageType === "used" && item.quantity < Number.parseFloat(quantity)) {
      return res.status(400).json({
        success: false,
        message: "Not enough quantity available",
      })
    }

    // Create usage record
    const usage = await InventoryUsage.create({
      itemId,
      quantity: Number.parseFloat(quantity),
      usageType,
      landId,
      cropId,
      notes,
      recordedBy: req.user._id,
    })

    // Update inventory quantity if used
    if (usageType === "used" || usageType === "damaged" || usageType === "expired") {
      item.quantity -= Number.parseFloat(quantity)
      await item.save()

      // Create notification if item is now low in stock
      if (item.quantity <= item.reorderLevel) {
        await Notification.create({
          title: "Low Inventory Alert",
          message: `${item.name} is low in stock (${item.quantity} ${item.unit} remaining). Reorder level: ${item.reorderLevel} ${item.unit}.`,
          type: "warning",
          priority: "medium",
          category: "inventory",
          relatedTo: {
            model: "InventoryItem",
            id: item._id,
          },
          isGlobal: true,
          createdBy: req.user._id,
        })
      }
    }

    res.status(201).json({
      success: true,
      message: "Inventory usage recorded successfully",
      data: {
        usage,
        updatedQuantity: item.quantity,
      },
    })
  } catch (error) {
    console.error("Record inventory usage error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to record inventory usage",
    })
  }
})

// Get inventory usage history
router.get("/usage", isAuthenticated, async (req, res) => {
  try {
    const { itemId, usageType, startDate, endDate, sort, limit = 20, page = 1 } = req.query

    // Build query
    const query = {}

    // Add filters
    if (itemId) {
      query.itemId = itemId
    }

    if (usageType && ["used", "damaged", "expired", "transferred", "other"].includes(usageType)) {
      query.usageType = usageType
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) {
        query.createdAt.$gte = new Date(startDate)
      }
      if (endDate) {
        // Add one day to include the end date fully
        const endDateObj = new Date(endDate)
        endDateObj.setDate(endDateObj.getDate() + 1)
        query.createdAt.$lt = endDateObj
      }
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
    const usageRecords = await InventoryUsage.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number.parseInt(limit))
      .populate("itemId", "name category unit")
      .populate("recordedBy", "name email")
      .populate("landId", "name location")
      .populate("cropId", "name")

    // Get total count for pagination
    const totalRecords = await InventoryUsage.countDocuments(query)

    res.status(200).json({
      success: true,
      data: {
        usageRecords,
        pagination: {
          total: totalRecords,
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          pages: Math.ceil(totalRecords / Number.parseInt(limit)),
        },
      },
    })
  } catch (error) {
    console.error("Get inventory usage error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to retrieve inventory usage records",
    })
  }
})

module.exports = router
