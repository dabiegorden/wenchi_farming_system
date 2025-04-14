const mongoose = require("mongoose")

const inventoryItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["fertilizer", "pesticide", "tool", "seed", "other"],
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    reorderLevel: {
      type: Number,
      default: 0,
    },
    unitCost: {
      type: Number,
      default: 0,
    },
    supplier: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    expiryDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
)

const inventoryUsageSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    usageType: {
      type: String,
      enum: ["used", "damaged", "expired", "transferred", "other"],
      required: true,
    },
    landId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Land",
    },
    cropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crop",
    },
    notes: {
      type: String,
      trim: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
)

const InventoryItem = mongoose.model("InventoryItem", inventoryItemSchema)
const InventoryUsage = mongoose.model("InventoryUsage", inventoryUsageSchema)

module.exports = { InventoryItem, InventoryUsage }
