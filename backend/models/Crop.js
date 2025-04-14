const mongoose = require("mongoose")

const cropSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    scientificName: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    growthDuration: {
      type: Number, // in days
      min: 1,
    },
    waterRequirements: {
      type: String,
      enum: ["low", "medium", "high"],
    },
    idealTemperature: {
      min: Number,
      max: Number,
    },
    plantingSeasons: [String],
    soilRequirements: [String],
    commonDiseases: [String],
    nutritionalValue: String,
    imageUrl: {
      type: String,
      default: null,
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

// Create the model if it doesn't exist
let Crop
try {
  Crop = mongoose.model("Crop")
} catch (e) {
  Crop = mongoose.model("Crop", cropSchema)
}

module.exports = Crop
