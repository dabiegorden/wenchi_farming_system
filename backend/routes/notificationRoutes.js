const express = require("express")
const router = express.Router()
const { isAuthenticated, isResearcher, isAdmin } = require("../middleware/authMiddleware")
const Report = require("../models/Report")
const Crop = require("../models/Crop")
const Land = require("../models/Land")
const { InventoryItem, InventoryUsage } = require("../models/Inventory")
const HealthAssessment = require("../models/Health")

// Get all reports
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const { type, startDate, endDate, sort, limit = 20, page = 1 } = req.query

    // Build query
    const query = { isActive: true }

    // Add filters
    if (type && ["crop", "health", "inventory", "land", "weather", "general"].includes(type)) {
      query.type = type
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

    // Execute query with pagination
    const reports = await Report.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number.parseInt(limit))
      .populate("createdBy", "name email")

    // Get total count for pagination
    const totalReports = await Report.countDocuments(query)

    res.status(200).json({
      success: true,
      data: {
        reports,
        pagination: {
          total: totalReports,
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          pages: Math.ceil(totalReports / Number.parseInt(limit)),
        },
      },
    })
  } catch (error) {
    console.error("Get reports error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to retrieve reports",
    })
  }
})

// Get a single report by ID
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate("createdBy", "name email")

    if (!report || !report.isActive) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      })
    }

    res.status(200).json({
      success: true,
      data: {
        report,
      },
    })
  } catch (error) {
    console.error("Get report error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to retrieve report",
    })
  }
})

// Generate a crop health report
router.post("/crop-health", isAuthenticated, async (req, res) => {
  try {
    const { title, startDate, endDate, cropId } = req.body

    // Validate required fields
    if (!title || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Title, start date, and end date are required",
      })
    }

    // Parse dates
    const startDateObj = new Date(startDate)
    const endDateObj = new Date(endDate)

    // Validate date range
    if (startDateObj >= endDateObj) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
      })
    }

    // Build query for health assessments
    const query = {
      createdAt: {
        $gte: startDateObj,
        $lte: endDateObj,
      },
      isActive: true,
    }

    if (cropId) {
      query.cropId = cropId
    }

    // Get health assessments
    const healthAssessments = await HealthAssessment.find(query)
      .populate("cropId", "name scientificName")
      .populate("landId", "name location")
      .lean()

    // If no data found
    if (healthAssessments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No health assessment data found for the specified criteria",
      })
    }

    // Process data for the report
    let reportData = {}

    if (cropId) {
      // Single crop report
      const crop = await Crop.findById(cropId)
      if (!crop) {
        return res.status(404).json({
          success: false,
          message: "Crop not found",
        })
      }

      // Group by status
      const statusCounts = {
        healthy: 0,
        mild: 0,
        moderate: 0,
        severe: 0,
        unknown: 0,
      }

      healthAssessments.forEach((assessment) => {
        statusCounts[assessment.status] = (statusCounts[assessment.status] || 0) + 1
      })

      // Get common diseases
      const diseases = {}
      healthAssessments.forEach((assessment) => {
        if (assessment.aiAnalysis && assessment.aiAnalysis.disease) {
          diseases[assessment.aiAnalysis.disease] = (diseases[assessment.aiAnalysis.disease] || 0) + 1
        }
      })

      // Sort diseases by frequency
      const sortedDiseases = Object.entries(diseases)
        .sort((a, b) => b[1] - a[1])
        .map(([disease, count]) => ({ disease, count }))

      reportData = {
        crop: {
          id: crop._id,
          name: crop.name,
          scientificName: crop.scientificName,
        },
        summary: {
          totalAssessments: healthAssessments.length,
          statusDistribution: statusCounts,
          healthIndex: calculateHealthIndex(statusCounts),
          commonDiseases: sortedDiseases.slice(0, 5),
        },
        timeline: generateTimeline(healthAssessments, startDateObj, endDateObj),
        recommendations: generateRecommendations(healthAssessments),
      }
    } else {
      // Multi-crop report
      // Group by crop
      const cropGroups = {}
      healthAssessments.forEach((assessment) => {
        if (assessment.cropId) {
          const cropId = assessment.cropId._id.toString()
          if (!cropGroups[cropId]) {
            cropGroups[cropId] = {
              crop: {
                id: assessment.cropId._id,
                name: assessment.cropId.name,
                scientificName: assessment.cropId.scientificName,
              },
              assessments: [],
              statusCounts: {
                healthy: 0,
                mild: 0,
                moderate: 0,
                severe: 0,
                unknown: 0,
              },
              diseases: {},
            }
          }

          cropGroups[cropId].assessments.push(assessment)
          cropGroups[cropId].statusCounts[assessment.status] =
            (cropGroups[cropId].statusCounts[assessment.status] || 0) + 1

          if (assessment.aiAnalysis && assessment.aiAnalysis.disease) {
            cropGroups[cropId].diseases[assessment.aiAnalysis.disease] =
              (cropGroups[cropId].diseases[assessment.aiAnalysis.disease] || 0) + 1
          }
        }
      })

      // Process each crop group
      const crops = Object.values(cropGroups).map((group) => {
        // Sort diseases by frequency
        const sortedDiseases = Object.entries(group.diseases)
          .sort((a, b) => b[1] - a[1])
          .map(([disease, count]) => ({ disease, count }))

        return {
          crop: group.crop,
          summary: {
            totalAssessments: group.assessments.length,
            statusDistribution: group.statusCounts,
            healthIndex: calculateHealthIndex(group.statusCounts),
            commonDiseases: sortedDiseases.slice(0, 3),
          },
        }
      })

      // Sort crops by health index (ascending - worse crops first)
      crops.sort((a, b) => a.summary.healthIndex - b.summary.healthIndex)

      reportData = {
        summary: {
          totalCrops: crops.length,
          totalAssessments: healthAssessments.length,
          dateRange: {
            start: startDateObj,
            end: endDateObj,
          },
        },
        crops,
        recommendations: generateRecommendations(healthAssessments),
      }
    }

    // Create the report
    const report = await Report.create({
      title,
      type: "health",
      dateRange: {
        startDate: startDateObj,
        endDate: endDateObj,
      },
      parameters: {
        cropId,
      },
      data: reportData,
      createdBy: req.user._id,
    })

    res.status(201).json({
      success: true,
      message: "Crop health report generated successfully",
      data: {
        report,
      },
    })
  } catch (error) {
    console.error("Generate crop health report error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to generate crop health report",
    })
  }
})

// Generate an inventory report
router.post("/inventory", isAuthenticated, async (req, res) => {
  try {
    const { title, startDate, endDate, category } = req.body

    // Validate required fields
    if (!title || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Title, start date, and end date are required",
      })
    }

    // Parse dates
    const startDateObj = new Date(startDate)
    const endDateObj = new Date(endDate)

    // Validate date range
    if (startDateObj >= endDateObj) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
      })
    }

    // Get current inventory items
    const itemsQuery = { isActive: true }
    if (category && ["fertilizer", "pesticide", "tool", "seed", "other"].includes(category)) {
      itemsQuery.category = category
    }

    const inventoryItems = await InventoryItem.find(itemsQuery).lean()

    // Get usage data for the period
    const usageQuery = {
      createdAt: {
        $gte: startDateObj,
        $lte: endDateObj,
      },
    }

    if (category) {
      // We need to join with items to filter by category
      const itemIds = inventoryItems.map((item) => item._id)
      usageQuery.itemId = { $in: itemIds }
    }

    const usageRecords = await InventoryUsage.find(usageQuery).populate("itemId", "name category unit").lean()

    // Process data for the report
    const reportData = {
      summary: {
        totalItems: inventoryItems.length,
        totalUsageRecords: usageRecords.length,
        dateRange: {
          start: startDateObj,
          end: endDateObj,
        },
      },
      inventory: {
        categories: {},
        lowStockItems: [],
        totalValue: 0,
      },
      usage: {
        byCategory: {},
        byType: {},
        timeline: [],
      },
    }

    // Process inventory items
    inventoryItems.forEach((item) => {
      // Add to category counts
      if (!reportData.inventory.categories[item.category]) {
        reportData.inventory.categories[item.category] = {
          count: 0,
          value: 0,
        }
      }
      reportData.inventory.categories[item.category].count++
      reportData.inventory.categories[item.category].value += item.quantity * item.unitCost

      // Add to total value
      reportData.inventory.totalValue += item.quantity * item.unitCost

      // Check for low stock
      if (item.quantity <= item.reorderLevel) {
        reportData.inventory.lowStockItems.push({
          id: item._id,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          reorderLevel: item.reorderLevel,
        })
      }
    })

    // Process usage records
    usageRecords.forEach((record) => {
      const category = record.itemId ? record.itemId.category : "unknown"
      const usageType = record.usageType
      const date = record.createdAt.toISOString().split("T")[0] // YYYY-MM-DD

      // Add to category usage
      if (!reportData.usage.byCategory[category]) {
        reportData.usage.byCategory[category] = 0
      }
      reportData.usage.byCategory[category] += record.quantity

      // Add to type usage
      if (!reportData.usage.byType[usageType]) {
        reportData.usage.byType[usageType] = 0
      }
      reportData.usage.byType[usageType] += record.quantity

      // Add to timeline
      const timelineEntry = reportData.usage.timeline.find((entry) => entry.date === date)
      if (timelineEntry) {
        timelineEntry.usage += record.quantity
      } else {
        reportData.usage.timeline.push({
          date,
          usage: record.quantity,
        })
      }
    })

    // Sort timeline by date
    reportData.usage.timeline.sort((a, b) => new Date(a.date) - new Date(b.date))

    // Create the report
    const report = await Report.create({
      title,
      type: "inventory",
      dateRange: {
        startDate: startDateObj,
        endDate: endDateObj,
      },
      parameters: {
        category,
      },
      data: reportData,
      createdBy: req.user._id,
    })

    res.status(201).json({
      success: true,
      message: "Inventory report generated successfully",
      data: {
        report,
      },
    })
  } catch (error) {
    console.error("Generate inventory report error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to generate inventory report",
    })
  }
})

// Generate a land usage report
router.post("/land", isAuthenticated, async (req, res) => {
  try {
    const { title, startDate, endDate, landId } = req.body

    // Validate required fields
    if (!title || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Title, start date, and end date are required",
      })
    }

    // Parse dates
    const startDateObj = new Date(startDate)
    const endDateObj = new Date(endDate)

    // Validate date range
    if (startDateObj >= endDateObj) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
      })
    }

    // Get land data
    const landsQuery = { isActive: true }
    if (landId) {
      landsQuery._id = landId
    }

    const lands = await Land.find(landsQuery).populate("currentCrop", "name").lean()

    // If no data found
    if (lands.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No land data found for the specified criteria",
      })
    }

    // Process data for the report
    const reportData = {
      summary: {
        totalLands: lands.length,
        totalArea: lands.reduce((sum, land) => {
          // Convert all to hectares for consistency
          let areaInHectares = land.size.value
          if (land.size.unit === "acre") {
            areaInHectares = land.size.value * 0.404686 // 1 acre = 0.404686 hectares
          } else if (land.size.unit === "sqm") {
            areaInHectares = land.size.value / 10000 // 1 hectare = 10,000 sqm
          }
          return sum + areaInHectares
        }, 0),
        statusDistribution: {},
        dateRange: {
          start: startDateObj,
          end: endDateObj,
        },
      },
      lands: [],
      soilMoisture: {
        average: 0,
        byLand: [],
      },
    }

    // Process each land
    let totalMoisture = 0
    let landsWithMoisture = 0

    lands.forEach((land) => {
      // Add to status counts
      reportData.summary.statusDistribution[land.status] = (reportData.summary.statusDistribution[land.status] || 0) + 1

      // Convert area to hectares
      let areaInHectares = land.size.value
      if (land.size.unit === "acre") {
        areaInHectares = land.size.value * 0.404686
      } else if (land.size.unit === "sqm") {
        areaInHectares = land.size.value / 10000
      }

      // Add land details
      reportData.lands.push({
        id: land._id,
        name: land.name,
        location: land.location,
        size: {
          value: land.size.value,
          unit: land.size.unit,
          hectares: areaInHectares,
        },
        status: land.status,
        currentCrop: land.currentCrop ? land.currentCrop.name : null,
        soilType: land.soilType,
        soilPh: land.soilPh,
        soilMoisture: land.soilMoisture ? land.soilMoisture.value : null,
      })

      // Add to soil moisture calculations
      if (land.soilMoisture && land.soilMoisture.value !== null) {
        totalMoisture += land.soilMoisture.value
        landsWithMoisture++

        reportData.soilMoisture.byLand.push({
          id: land._id,
          name: land.name,
          moisture: land.soilMoisture.value,
          lastUpdated: land.soilMoisture.lastUpdated,
        })
      }
    })

    // Calculate average soil moisture
    reportData.soilMoisture.average = landsWithMoisture > 0 ? totalMoisture / landsWithMoisture : 0

    // Sort lands by size (largest first)
    reportData.lands.sort((a, b) => b.size.hectares - a.size.hectares)

    // Create the report
    const report = await Report.create({
      title,
      type: "land",
      dateRange: {
        startDate: startDateObj,
        endDate: endDateObj,
      },
      parameters: {
        landId,
      },
      data: reportData,
      createdBy: req.user._id,
    })

    res.status(201).json({
      success: true,
      message: "Land usage report generated successfully",
      data: {
        report,
      },
    })
  } catch (error) {
    console.error("Generate land report error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to generate land report",
    })
  }
})

// Delete a report (soft delete)
router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)

    if (!report || !report.isActive) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      })
    }

    // Check if user is authorized to delete
    if (report.createdBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this report",
      })
    }

    // Soft delete by setting isActive to false
    report.isActive = false
    await report.save()

    res.status(200).json({
      success: true,
      message: "Report deleted successfully",
    })
  } catch (error) {
    console.error("Delete report error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete report",
    })
  }
})

// Helper function to calculate health index (0-100, higher is better)
function calculateHealthIndex(statusCounts) {
  const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0)
  if (total === 0) return 0

  // Weighted calculation
  const weights = {
    healthy: 100,
    mild: 75,
    moderate: 50,
    severe: 0,
    unknown: 50,
  }

  let weightedSum = 0
  for (const [status, count] of Object.entries(statusCounts)) {
    weightedSum += weights[status] * count
  }

  return Math.round(weightedSum / total)
}

// Helper function to generate timeline data
function generateTimeline(assessments, startDate, endDate) {
  // Create a map of dates within the range
  const timeline = {}
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dateString = currentDate.toISOString().split("T")[0] // YYYY-MM-DD
    timeline[dateString] = {
      date: dateString,
      count: 0,
      statuses: {
        healthy: 0,
        mild: 0,
        moderate: 0,
        severe: 0,
        unknown: 0,
      },
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // Populate with assessment data
  assessments.forEach((assessment) => {
    const dateString = assessment.createdAt.toISOString().split("T")[0]
    if (timeline[dateString]) {
      timeline[dateString].count++
      timeline[dateString].statuses[assessment.status]++
    }
  })

  // Convert to array and sort by date
  return Object.values(timeline).sort((a, b) => new Date(a.date) - new Date(b.date))
}

// Helper function to generate recommendations based on health assessments
function generateRecommendations(assessments) {
  // Extract common diseases and their recommendations
  const diseaseRecommendations = {}

  assessments.forEach((assessment) => {
    if (assessment.aiAnalysis && assessment.aiAnalysis.disease && assessment.aiAnalysis.recommendations) {
      const disease = assessment.aiAnalysis.disease

      if (!diseaseRecommendations[disease]) {
        diseaseRecommendations[disease] = {
          count: 0,
          recommendations: [],
        }
      }

      diseaseRecommendations[disease].count++

      // Add unique recommendations
      if (Array.isArray(assessment.aiAnalysis.recommendations)) {
        assessment.aiAnalysis.recommendations.forEach((rec) => {
          if (!diseaseRecommendations[disease].recommendations.includes(rec)) {
            diseaseRecommendations[disease].recommendations.push(rec)
          }
        })
      }
    }
  })

  // Sort by frequency and format
  return Object.entries(diseaseRecommendations)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([disease, data]) => ({
      disease,
      occurrences: data.count,
      recommendations: data.recommendations,
    }))
}

module.exports = router
