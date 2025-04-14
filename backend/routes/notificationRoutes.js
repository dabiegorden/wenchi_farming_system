const express = require("express")
const router = express.Router()
const { isAuthenticated, isAdmin } = require("../middleware/authMiddleware")
const Notification = require("../models/Notification")

// Get notifications for the current user
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const { limit = 20, page = 1, unreadOnly = false } = req.query

    // Build query for user-specific notifications and global notifications
    const query = {
      $or: [
        { isGlobal: true, isActive: true },
        { "recipients.userId": req.user._id, isActive: true },
      ],
    }

    // Add filter for unread notifications
    if (unreadOnly === "true") {
      query.$or = [
        { isGlobal: true, isActive: true, "recipients.userId": { $ne: req.user._id } },
        { "recipients.userId": req.user._id, "recipients.read": false, isActive: true },
      ]
    }

    // Calculate pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Execute query with pagination
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number.parseInt(limit))
      .populate("createdBy", "name email")

    // Process notifications to determine read status for the current user
    const processedNotifications = notifications.map((notification) => {
      const notificationObj = notification.toObject()

      // Check if the current user has read this notification
      const userRecipient = notification.recipients.find(
        (r) => r.userId && r.userId.toString() === req.user._id.toString(),
      )

      notificationObj.read = userRecipient ? userRecipient.read : false

      // Remove recipients array for privacy
      delete notificationObj.recipients

      return notificationObj
    })

    // Get total count for pagination
    const totalNotifications = await Notification.countDocuments(query)

    // Get unread count for the user
    const unreadCount = await Notification.countDocuments({
      $or: [
        { isGlobal: true, isActive: true, "recipients.userId": { $ne: req.user._id } },
        { "recipients.userId": req.user._id, "recipients.read": false, isActive: true },
      ],
    })

    res.status(200).json({
      success: true,
      data: {
        notifications: processedNotifications,
        unreadCount,
        pagination: {
          total: totalNotifications,
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          pages: Math.ceil(totalNotifications / Number.parseInt(limit)),
        },
      },
    })
  } catch (error) {
    console.error("Get notifications error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to retrieve notifications",
    })
  }
})

// Mark notification as read
router.patch("/:id/read", isAuthenticated, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)

    if (!notification || !notification.isActive) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      })
    }

    // If it's a global notification, add the user to recipients with read=true
    if (notification.isGlobal) {
      const existingRecipient = notification.recipients.find(
        (r) => r.userId && r.userId.toString() === req.user._id.toString(),
      )

      if (existingRecipient) {
        existingRecipient.read = true
        existingRecipient.readAt = new Date()
      } else {
        notification.recipients.push({
          userId: req.user._id,
          read: true,
          readAt: new Date(),
        })
      }
    } else {
      // For user-specific notification, find and update the recipient
      const recipient = notification.recipients.find((r) => r.userId && r.userId.toString() === req.user._id.toString())

      if (!recipient) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to access this notification",
        })
      }

      recipient.read = true
      recipient.readAt = new Date()
    }

    await notification.save()

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
    })
  } catch (error) {
    console.error("Mark notification as read error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
    })
  }
})

// Mark all notifications as read
router.patch("/read-all", isAuthenticated, async (req, res) => {
  try {
    // Get all unread notifications for the user
    const notifications = await Notification.find({
      $or: [
        { isGlobal: true, isActive: true },
        { "recipients.userId": req.user._id, "recipients.read": false, isActive: true },
      ],
    })

    // Update each notification
    for (const notification of notifications) {
      if (notification.isGlobal) {
        const existingRecipient = notification.recipients.find(
          (r) => r.userId && r.userId.toString() === req.user._id.toString(),
        )

        if (existingRecipient) {
          existingRecipient.read = true
          existingRecipient.readAt = new Date()
        } else {
          notification.recipients.push({
            userId: req.user._id,
            read: true,
            readAt: new Date(),
          })
        }
      } else {
        // For user-specific notification, find and update the recipient
        const recipient = notification.recipients.find(
          (r) => r.userId && r.userId.toString() === req.user._id.toString(),
        )

        if (recipient) {
          recipient.read = true
          recipient.readAt = new Date()
        }
      }

      await notification.save()
    }

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    })
  } catch (error) {
    console.error("Mark all notifications as read error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
    })
  }
})

// Create a new notification (admin only)
router.post("/", isAdmin, async (req, res) => {
  try {
    const { title, message, type, priority, category, recipients, isGlobal, expiresAt } = req.body

    // Validate required fields
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required",
      })
    }

    // Create notification data
    const notificationData = {
      title,
      message,
      createdBy: req.user._id,
      isGlobal: isGlobal === true,
    }

    // Add optional fields if provided
    if (type && ["info", "warning", "alert", "success", "task"].includes(type)) {
      notificationData.type = type
    }

    if (priority && ["low", "medium", "high"].includes(priority)) {
      notificationData.priority = priority
    }

    if (category && ["system", "crop", "inventory", "land", "health", "weather", "other"].includes(category)) {
      notificationData.category = category
    }

    if (expiresAt) {
      notificationData.expiresAt = new Date(expiresAt)
    }

    // Add recipients if not global
    if (!isGlobal && recipients && Array.isArray(recipients)) {
      notificationData.recipients = recipients.map((userId) => ({
        userId,
        read: false,
      }))
    }

    // Create the notification
    const notification = await Notification.create(notificationData)

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: {
        notification,
      },
    })
  } catch (error) {
    console.error("Create notification error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create notification",
    })
  }
})

// Delete a notification (admin only)
router.delete("/:id", isAdmin, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)

    if (!notification || !notification.isActive) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      })
    }

    // Soft delete by setting isActive to false
    notification.isActive = false
    await notification.save()

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    })
  } catch (error) {
    console.error("Delete notification error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
    })
  }
})

module.exports = router
