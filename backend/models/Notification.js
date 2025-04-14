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

const Notification = mongoose.model("Notification", notificationSchema)

module.exports = Notification
