"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { use } from "react"

export default function ReportDetailsPage({ params }) {
  // Unwrap the params Promise using React.use()
  const resolvedParams = use(params)
  const reportId = resolvedParams.id

  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const fetchReportDetails = async () => {
      if (!reportId) return

      try {
        console.log(`Fetching report with ID: ${reportId}`)
        const response = await fetch(`http://localhost:5000/api/reports/${reportId}`, {
          credentials: "include",
        })

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Report not found")
          }
          throw new Error("Failed to fetch report details")
        }

        const data = await response.json()
        console.log("Report data:", data)
        setReport(data.data.report)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching report details:", err)
        setError(err.message)
        setLoading(false)
      }
    }

    fetchReportDetails()
  }, [reportId])

  // Function to get report type badge color
  const getReportTypeColor = (type) => {
    const colors = {
      health: "bg-green-100 text-green-800",
      inventory: "bg-blue-100 text-blue-800",
      land: "bg-yellow-100 text-yellow-800",
      crop: "bg-purple-100 text-purple-800",
      weather: "bg-cyan-100 text-cyan-800",
      general: "bg-gray-100 text-gray-800",
    }
    return colors[type] || colors.general
  }

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return "Not specified"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Function to render health status distribution
  const renderHealthDistribution = (statusDistribution) => {
    if (!statusDistribution) return null

    const total = Object.values(statusDistribution).reduce((sum, count) => sum + count, 0)
    if (total === 0) return <p className="text-gray-500">No data available</p>

    const statusColors = {
      healthy: "bg-green-500",
      mild: "bg-yellow-400",
      moderate: "bg-orange-500",
      severe: "bg-red-500",
      unknown: "bg-gray-400",
    }

    return (
      <div className="mt-2">
        <div className="flex h-6 rounded-md overflow-hidden">
          {Object.entries(statusDistribution).map(([status, count]) => {
            const percentage = (count / total) * 100
            if (percentage === 0) return null
            return (
              <div
                key={status}
                className={`${statusColors[status]} h-full`}
                style={{ width: `${percentage}%` }}
                title={`${status}: ${count} (${percentage.toFixed(1)}%)`}
              ></div>
            )
          })}
        </div>
        <div className="flex justify-between mt-1 text-xs">
          {Object.entries(statusDistribution).map(([status, count]) => {
            const percentage = (count / total) * 100
            if (percentage === 0) return null
            return (
              <div key={status} className="flex items-center">
                <div className={`w-3 h-3 ${statusColors[status]} rounded-sm mr-1`}></div>
                <span className="capitalize">
                  {status}: {count} ({percentage.toFixed(1)}%)
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Function to render timeline data
  const renderTimeline = (timeline) => {
    if (!timeline || timeline.length === 0) return null

    // Find days with data for a more compact display
    const daysWithData = timeline.filter((day) => day.count > 0)
    if (daysWithData.length === 0) return <p className="text-gray-500">No timeline data available</p>

    const maxCount = Math.max(...timeline.map((day) => day.count))

    return (
      <div className="mt-4 overflow-x-auto">
        <div className="min-w-full">
          <div className="flex h-40 items-end space-x-1">
            {timeline.map((day, index) => {
              // Only show every 7th day label to avoid crowding
              const showLabel = index % 7 === 0
              const height = day.count > 0 ? (day.count / maxCount) * 100 : 0
              return (
                <div key={day.date} className="flex flex-col items-center">
                  <div className="flex-grow flex items-end">
                    {height > 0 && (
                      <div
                        className="w-4 bg-green-500 rounded-t"
                        style={{ height: `${height}%` }}
                        title={`${day.date}: ${day.count} assessments`}
                      ></div>
                    )}
                  </div>
                  {showLabel && (
                    <div className="text-xs mt-1 transform -rotate-45 origin-top-left">
                      {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col">
        <div className="text-red-500 text-xl mb-4">Error: {error}</div>
        <button
          onClick={() => router.push("/dashboard/reports")}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors"
        >
          Back to Reports
        </button>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-xl">Report not found</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/dashboard/reports">
        <button className="flex items-center mb-6 text-green-600 hover:text-green-800">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Reports
        </button>
      </Link>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold">{report.title}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getReportTypeColor(report.type)}`}>
              {report.type}
            </span>
          </div>

          <div className="mb-6">
            <p className="text-gray-600">
              Created on {formatDate(report.createdAt)} by {report.createdBy?.name || "Unknown"}
            </p>
            {report.dateRange && (
              <p className="text-gray-600">
                Period: {formatDate(report.dateRange.startDate)} to {formatDate(report.dateRange.endDate)}
              </p>
            )}
          </div>

          {/* Health Report */}
          {report.type === "health" && report.data && (
            <div>
              {report.data.crop && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Crop Information</h2>
                  <p>
                    <span className="font-medium">Name:</span> {report.data.crop.name}
                  </p>
                  {report.data.crop.scientificName && (
                    <p>
                      <span className="font-medium">Scientific Name:</span> {report.data.crop.scientificName}
                    </p>
                  )}
                </div>
              )}

              {report.data.summary && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Health Summary</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Health Index</p>
                      <p
                        className={`text-3xl font-bold ${
                          report.data.summary.healthIndex >= 70
                            ? "text-green-600"
                            : report.data.summary.healthIndex >= 40
                              ? "text-yellow-600"
                              : "text-red-600"
                        }`}
                      >
                        {report.data.summary.healthIndex}
                        <span className="text-sm font-normal text-gray-500">/100</span>
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Total Assessments</p>
                      <p className="text-3xl font-bold text-blue-600">{report.data.summary.totalAssessments}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Status Distribution</p>
                      {renderHealthDistribution(report.data.summary.statusDistribution)}
                    </div>
                  </div>
                </div>
              )}

              {report.data.timeline && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Assessment Timeline</h2>
                  {renderTimeline(report.data.timeline)}
                </div>
              )}

              {report.data.commonDiseases && report.data.commonDiseases.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Common Diseases</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Disease
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Occurrences
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {report.data.commonDiseases.map((disease, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {disease.disease}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{disease.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {report.data.recommendations && report.data.recommendations.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Recommendations</h2>
                  <div className="space-y-4">
                    {report.data.recommendations.map((rec, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <p className="font-medium text-gray-900 mb-1">{rec.disease}</p>
                        <p className="text-sm text-gray-500 mb-2">Occurrences: {rec.occurrences}</p>
                        <ul className="list-disc pl-5 space-y-1">
                          {rec.recommendations.map((item, i) => (
                            <li key={i} className="text-sm text-gray-700">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Inventory Report */}
          {report.type === "inventory" && report.data && (
            <div>
              {report.data.summary && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Inventory Summary</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Total Items</p>
                      <p className="text-3xl font-bold text-blue-600">{report.data.summary.totalItems}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Total Usage Records</p>
                      <p className="text-3xl font-bold text-green-600">{report.data.summary.totalUsageRecords}</p>
                    </div>
                    {report.data.inventory && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Total Value</p>
                        <p className="text-3xl font-bold text-purple-600">
                          ${report.data.inventory.totalValue.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {report.data.inventory && report.data.inventory.categories && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Inventory by Category</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Category
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Count
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Value
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Object.entries(report.data.inventory.categories).map(([category, data]) => (
                          <tr key={category}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                              {category}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.count}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ${data.value.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {report.data.inventory &&
                report.data.inventory.lowStockItems &&
                report.data.inventory.lowStockItems.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">Low Stock Items</h2>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Name
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Category
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Quantity
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Reorder Level
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {report.data.inventory.lowStockItems.map((item) => (
                            <tr key={item.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {item.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                {item.category}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {item.quantity} {item.unit}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {item.reorderLevel} {item.unit}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Land Report */}
          {report.type === "land" && report.data && (
            <div>
              {report.data.summary && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Land Summary</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Total Lands</p>
                      <p className="text-3xl font-bold text-blue-600">{report.data.summary.totalLands}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Total Area</p>
                      <p className="text-3xl font-bold text-green-600">
                        {report.data.summary.totalArea.toFixed(2)} <span className="text-sm">hectares</span>
                      </p>
                    </div>
                    {report.data.soilMoisture && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Average Soil Moisture</p>
                        <p className="text-3xl font-bold text-cyan-600">
                          {report.data.soilMoisture.average.toFixed(1)}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {report.data.summary && report.data.summary.statusDistribution && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Land Status Distribution</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Status
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Count
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Object.entries(report.data.summary.statusDistribution).map(([status, count]) => (
                          <tr key={status}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                              {status}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {report.data.lands && report.data.lands.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Land Details</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Name
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Location
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Size
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Status
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Current Crop
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {report.data.lands.map((land) => (
                          <tr key={land.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              <Link href={`/dashboard/lands/${land.id}`} className="text-green-600 hover:underline">
                                {land.name}
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{land.location}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {land.size.value} {land.size.unit}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                              {land.status}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {land.currentCrop || "None"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
