const mongoose = require("mongoose")

const landSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    coordinates: {
      latitude: String,
      longitude: String,
    },
    size: {
      value: {
        type: Number,
        required: true,
      },
      unit: {
        type: String,
        enum: ["hectare", "acre", "sqm"],
        default: "hectare",
      },
    },
    soilType: {
      type: String,
      trim: true,
    },
    soilPh: {
      type: Number,
      min: 0,
      max: 14,
    },
    soilMoisture: {
      value: {
        type: Number,
        min: 0,
        max: 100,
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
    currentCrop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crop",
    },
    plantingDate: {
      type: Date,
    },
    expectedHarvestDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["available", "planted", "fallow", "maintenance"],
      default: "available",
    },
    seasonalRecommendations: [
      {
        season: String,
        crops: [
          {
            cropId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Crop",
            },
            suitabilityScore: {
              type: Number,
              min: 0,
              max: 100,
            },
            notes: String,
          },
        ],
      },
    ],
    notes: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      default: null,
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

const Land = mongoose.model("Land", landSchema)

module.exports = Land
