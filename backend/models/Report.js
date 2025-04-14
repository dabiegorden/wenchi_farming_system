const mongoose = require("mongoose")

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["crop", "health", "inventory", "land", "weather", "general"],
      required: true,
    },
    dateRange: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
    },
    parameters: {
      type: Object,
      default: {},
    },
    data: {
      type: Object,
      required: true,
    },
    format: {
      type: String,
      enum: ["json", "pdf", "csv", "excel"],
      default: "json",
    },
    fileUrl: {
      type: String,
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

const Report = mongoose.model("Report", reportSchema)

module.exports = Report
