const express = require("express")
const router = express.Router()
const { isAuthenticated, isAdmin } = require("../middleware/authMiddleware")
const Notification = require("../models/Notification")
const User = require("../models/User")

// Get notifications for the current user with improved filtering
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const { limit = 20, page = 1, unreadOnly = false, category, priority, type, startDate, endDate, search } = req.query

    // Build base query for user-specific notifications and global notifications
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

    // Add category filter
    if (category && ["system", "crop", "inventory", "land", "health", "weather", "other"].includes(category)) {
      query.category = category
    }

    // Add priority filter
    if (priority && ["low", "medium", "high"].includes(priority)) {
      query.priority = priority
    }

    // Add type filter
    if (type && ["info", "warning", "alert", "success", "task"].includes(type)) {
      query.type = type
    }

    // Add date range filter
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

    // Add search filter
    if (search) {
      query.$and = [
        {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { message: { $regex: search, $options: "i" } },
            { tags: { $regex: search, $options: "i" } },
          ],
        },
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
      notificationObj.isExpired = notification.isExpired()

      // Remove recipients array for privacy
      delete notificationObj.recipients

      return notificationObj
    })

    // Get total count for pagination
    const totalNotifications = await Notification.countDocuments(query)

    // Get unread count for the user
    const unreadCount = await Notification.getUnreadCount(req.user._id)

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

// Get a single notification by ID
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id).populate("createdBy", "name email")

    if (!notification || !notification.isActive) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      })
    }

    // Check if the user has access to this notification
    const isGlobalNotification = notification.isGlobal
    const isRecipient = notification.recipients.some((r) => r.userId && r.userId.toString() === req.user._id.toString())

    if (!isGlobalNotification && !isRecipient && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this notification",
      })
    }

    // Process notification to determine read status for the current user
    const notificationObj = notification.toObject()
    const userRecipient = notification.recipients.find(
      (r) => r.userId && r.userId.toString() === req.user._id.toString(),
    )
    notificationObj.read = userRecipient ? userRecipient.read : false
    notificationObj.isExpired = notification.isExpired()

    // Remove recipients array for privacy
    delete notificationObj.recipients

    res.status(200).json({
      success: true,
      data: {
        notification: notificationObj,
      },
    })
  } catch (error) {
    console.error("Get notification error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to retrieve notification",
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

// Mark notification as unread
router.patch("/:id/unread", isAuthenticated, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)

    if (!notification || !notification.isActive) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      })
    }

    // If it's a global notification, add the user to recipients with read=false
    if (notification.isGlobal) {
      const existingRecipient = notification.recipients.find(
        (r) => r.userId && r.userId.toString() === req.user._id.toString(),
      )

      if (existingRecipient) {
        existingRecipient.read = false
        existingRecipient.readAt = null
      } else {
        notification.recipients.push({
          userId: req.user._id,
          read: false,
          readAt: null,
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

      recipient.read = false
      recipient.readAt = null
    }

    await notification.save()

    res.status(200).json({
      success: true,
      message: "Notification marked as unread",
    })
  } catch (error) {
    console.error("Mark notification as unread error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as unread",
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
    const {
      title,
      message,
      type,
      priority,
      category,
      recipients,
      isGlobal,
      expiresAt,
      actionUrl,
      image,
      isActionRequired,
      tags,
    } = req.body

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

    if (actionUrl) {
      notificationData.actionUrl = actionUrl
    }

    if (image) {
      notificationData.image = image
    }

    if (isActionRequired !== undefined) {
      notificationData.isActionRequired = isActionRequired
    }

    if (tags && Array.isArray(tags)) {
      notificationData.tags = tags
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

// Update a notification (admin only)
router.put("/:id", isAdmin, async (req, res) => {
  try {
    const {
      title,
      message,
      type,
      priority,
      category,
      recipients,
      isGlobal,
      expiresAt,
      actionUrl,
      image,
      isActionRequired,
      tags,
    } = req.body

    const notification = await Notification.findById(req.params.id)

    if (!notification || !notification.isActive) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      })
    }

    // Update fields if provided
    if (title) notification.title = title
    if (message) notification.message = message
    if (type && ["info", "warning", "alert", "success", "task"].includes(type)) {
      notification.type = type
    }
    if (priority && ["low", "medium", "high"].includes(priority)) {
      notification.priority = priority
    }
    if (category && ["system", "crop", "inventory", "land", "health", "weather", "other"].includes(category)) {
      notification.category = category
    }
    if (expiresAt) {
      notification.expiresAt = new Date(expiresAt)
    }
    if (actionUrl !== undefined) {
      notification.actionUrl = actionUrl
    }
    if (image !== undefined) {
      notification.image = image
    }
    if (isActionRequired !== undefined) {
      notification.isActionRequired = isActionRequired
    }
    if (tags && Array.isArray(tags)) {
      notification.tags = tags
    }

    // Handle global/recipients changes
    if (isGlobal !== undefined) {
      notification.isGlobal = isGlobal

      // If changing from targeted to global, clear recipients
      if (isGlobal === true) {
        notification.recipients = []
      }
      // If changing from global to targeted, need recipients
      else if (isGlobal === false && (!recipients || !recipients.length)) {
        return res.status(400).json({
          success: false,
          message: "Recipients are required for non-global notifications",
        })
      }
    }

    // Update recipients if provided and notification is not global
    if (!notification.isGlobal && recipients && Array.isArray(recipients)) {
      // Create a map of existing recipients for faster lookup
      const existingRecipients = new Map()
      notification.recipients.forEach((recipient) => {
        if (recipient.userId) {
          existingRecipients.set(recipient.userId.toString(), recipient)
        }
      })

      // Create new recipients array
      const newRecipients = []
      for (const userId of recipients) {
        const existing = existingRecipients.get(userId.toString())
        if (existing) {
          // Keep existing recipient with read status
          newRecipients.push(existing)
        } else {
          // Add new recipient
          newRecipients.push({
            userId,
            read: false,
          })
        }
      }

      notification.recipients = newRecipients
    }

    await notification.save()

    res.status(200).json({
      success: true,
      message: "Notification updated successfully",
      data: {
        notification,
      },
    })
  } catch (error) {
    console.error("Update notification error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update notification",
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

// Hard delete a notification (admin only)
router.delete("/:id/permanent", isAdmin, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      })
    }

    // Hard delete
    await Notification.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: "Notification permanently deleted",
    })
  } catch (error) {
    console.error("Hard delete notification error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to permanently delete notification",
    })
  }
})

// Cleanup expired notifications (admin only)
router.post("/cleanup-expired", isAdmin, async (req, res) => {
  try {
    const count = await Notification.cleanupExpired()

    res.status(200).json({
      success: true,
      message: `${count} expired notifications cleaned up`,
      data: {
        count,
      },
    })
  } catch (error) {
    console.error("Cleanup expired notifications error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to cleanup expired notifications",
    })
  }
})

// Get notification statistics (admin only)
router.get("/stats", isAdmin, async (req, res) => {
  try {
    // Get counts by category
    const categoryCounts = await Notification.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ])

    // Get counts by type
    const typeCounts = await Notification.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ])

    // Get counts by priority
    const priorityCounts = await Notification.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ])

    // Get global vs targeted counts
    const globalCount = await Notification.countDocuments({
      isActive: true,
      isGlobal: true,
    })
    const targetedCount = await Notification.countDocuments({
      isActive: true,
      isGlobal: false,
    })

    // Get read vs unread counts
    const readCount = await Notification.aggregate([
      { $match: { isActive: true } },
      { $unwind: "$recipients" },
      { $match: { "recipients.read": true } },
      { $group: { _id: null, count: { $sum: 1 } } },
    ])

    const unreadCount = await Notification.aggregate([
      { $match: { isActive: true } },
      { $unwind: "$recipients" },
      { $match: { "recipients.read": false } },
      { $group: { _id: null, count: { $sum: 1 } } },
    ])

    // Format the results
    const stats = {
      total: await Notification.countDocuments({ isActive: true }),
      byCategory: Object.fromEntries(categoryCounts.map((item) => [item._id || "uncategorized", item.count])),
      byType: Object.fromEntries(typeCounts.map((item) => [item._id || "unknown", item.count])),
      byPriority: Object.fromEntries(priorityCounts.map((item) => [item._id || "unknown", item.count])),
      byDelivery: {
        global: globalCount,
        targeted: targetedCount,
      },
      byReadStatus: {
        read: readCount.length > 0 ? readCount[0].count : 0,
        unread: unreadCount.length > 0 ? unreadCount[0].count : 0,
      },
    }

    res.status(200).json({
      success: true,
      data: {
        stats,
      },
    })
  } catch (error) {
    console.error("Get notification stats error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to retrieve notification statistics",
    })
  }
})

// Send notification to all users (admin only)
router.post("/broadcast", isAdmin, async (req, res) => {
  try {
    const {
      title,
      message,
      type = "info",
      priority = "medium",
      category = "system",
      expiresAt,
      actionUrl,
      image,
      isActionRequired = false,
      tags = [],
      roles = [], // Optional: target specific roles
    } = req.body

    // Validate required fields
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required",
      })
    }

    let notificationData

    // If roles are specified, find users with those roles
    if (roles && roles.length > 0) {
      const users = await User.find({ role: { $in: roles }, isActive: true })

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No active users found with the specified roles",
        })
      }

      // Create a targeted notification for these users
      notificationData = {
        title,
        message,
        type,
        priority,
        category,
        isGlobal: false,
        recipients: users.map((user) => ({
          userId: user._id,
          read: false,
        })),
        createdBy: req.user._id,
      }
    } else {
      // Create a global notification for all users
      notificationData = {
        title,
        message,
        type,
        priority,
        category,
        isGlobal: true,
        createdBy: req.user._id,
      }
    }

    // Add optional fields
    if (expiresAt) {
      notificationData.expiresAt = new Date(expiresAt)
    }
    if (actionUrl) {
      notificationData.actionUrl = actionUrl
    }
    if (image) {
      notificationData.image = image
    }
    if (isActionRequired !== undefined) {
      notificationData.isActionRequired = isActionRequired
    }
    if (tags && Array.isArray(tags)) {
      notificationData.tags = tags
    }

    // Create the notification
    const notification = await Notification.create(notificationData)

    res.status(201).json({
      success: true,
      message: "Broadcast notification sent successfully",
      data: {
        notification,
        recipientCount: roles && roles.length > 0 ? notification.recipients.length : "All users (global)",
      },
    })
  } catch (error) {
    console.error("Broadcast notification error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to send broadcast notification",
    })
  }
})

module.exports = router
