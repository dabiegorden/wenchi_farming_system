const mongoose = require("mongoose")

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["info", "warning", "alert", "success", "task"],
      default: "info",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    category: {
      type: String,
      enum: ["system", "crop", "inventory", "land", "health", "weather", "other"],
      default: "system",
    },
    relatedTo: {
      model: {
        type: String,
        enum: ["Crop", "InventoryItem", "Land", "HealthAssessment", "User"],
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
    recipients: {
      type: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          read: {
            type: Boolean,
            default: false,
          },
          readAt: Date,
        },
      ],
      default: [],
    },
    isGlobal: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
    },
    actionUrl: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    isActionRequired: {
      type: Boolean,
      default: false,
    },
    tags: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
)

// Add index for faster queries
notificationSchema.index({ isGlobal: 1, isActive: 1 })
notificationSchema.index({ "recipients.userId": 1, "recipients.read": 1, isActive: 1 })
notificationSchema.index({ category: 1, createdAt: -1 })

// Add method to check if a notification is expired
notificationSchema.methods.isExpired = function () {
  if (!this.expiresAt) return false
  return new Date() > this.expiresAt
}

// Add static method to clean up expired notifications
notificationSchema.statics.cleanupExpired = async function () {
  const result = await this.updateMany(
    { expiresAt: { $lt: new Date() }, isActive: true },
    { $set: { isActive: false } },
  )
  return result.modifiedCount
}

// Add static method to get unread count for a user
notificationSchema.statics.getUnreadCount = async function (userId) {
  const count = await this.countDocuments({
    $or: [
      { isGlobal: true, isActive: true, "recipients.userId": { $ne: userId } },
      { "recipients.userId": userId, "recipients.read": false, isActive: true },
    ],
  })
  return count
}

const Notification = mongoose.model("Notification", notificationSchema)


module.exports = Notification
