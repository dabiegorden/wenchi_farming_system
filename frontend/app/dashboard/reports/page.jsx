"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

export default function ReportsPage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/reports", {
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to fetch reports")
        }

        const data = await response.json()

        console.log("Reports data:", data)
        setReports(data.data.reports)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching reports:", err)
        setError(err.message)
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-xl">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {reports.map((report) => (
          <Link href={`/dashboard/reports/${report._id}`} key={report._id}>
            <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-lg cursor-pointer h-full">
              <div className="p-4 border-b">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold">{report.title}</h2>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReportTypeColor(report.type)}`}>
                    {report.type}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Created: {formatDate(report.createdAt)} by {report.createdBy?.name || "Unknown"}
                </p>
              </div>

              <div className="p-4">
                {report.dateRange && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Period:</span> {formatDate(report.dateRange.startDate)} to{" "}
                      {formatDate(report.dateRange.endDate)}
                    </p>
                  </div>
                )}

                {report.type === "health" && report.data && (
                  <div className="mt-2">
                    {report.data.crop && (
                      <p className="text-sm">
                        <span className="font-medium">Crop:</span> {report.data.crop.name}
                      </p>
                    )}
                    {report.data.summary && (
                      <div className="mt-2">
                        <p className="text-sm">
                          <span className="font-medium">Health Index:</span>{" "}
                          <span
                            className={`font-medium ${
                              report.data.summary.healthIndex >= 70
                                ? "text-green-600"
                                : report.data.summary.healthIndex >= 40
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }`}
                          >
                            {report.data.summary.healthIndex}/100
                          </span>
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Assessments:</span> {report.data.summary.totalAssessments}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {report.type === "inventory" && report.data && report.data.summary && (
                  <div className="mt-2">
                    <p className="text-sm">
                      <span className="font-medium">Total Items:</span> {report.data.summary.totalItems}
                    </p>
                    {report.data.inventory && (
                      <p className="text-sm">
                        <span className="font-medium">Low Stock Items:</span>{" "}
                        {report.data.inventory.lowStockItems?.length || 0}
                      </p>
                    )}
                  </div>
                )}

                {report.type === "land" && report.data && report.data.summary && (
                  <div className="mt-2">
                    <p className="text-sm">
                      <span className="font-medium">Total Lands:</span> {report.data.summary.totalLands}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Total Area:</span> {report.data.summary.totalArea.toFixed(2)}{" "}
                      hectares
                    </p>
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <span className="text-green-600 text-sm">View Details →</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {reports.length === 0 && (
        <div className="text-center text-gray-500 mt-10">No reports available at the moment.</div>
      )}
    </div>
  )
}
