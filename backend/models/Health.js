const mongoose = require("mongoose")

const healthAssessmentSchema = new mongoose.Schema(
  {
    cropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crop",
      required: true,
    },
    landId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Land",
    },
    assessmentType: {
      type: String,
      enum: ["image", "symptom"],
      required: true,
    },
    symptoms: {
      type: [String],
      default: [],
    },
    imageUrl: {
      type: String,
      default: null,
    },
    aiAnalysis: {
      disease: String,
      confidence: Number,
      description: String,
      recommendations: [String],
      rawResponse: Object,
    },
    status: {
      type: String,
      enum: ["healthy", "mild", "moderate", "severe", "unknown"],
      default: "unknown",
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

const HealthAssessment = mongoose.model("HealthAssessment", healthAssessmentSchema)

module.exports = HealthAssessment
