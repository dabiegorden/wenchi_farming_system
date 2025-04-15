"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import { ArrowLeft, Download, Trash, Edit } from "lucide-react"

export default function ReportDetailsPage({ params }) {
  const reportId = React.use(params).id
  const router = useRouter()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/reports/${reportId}`, {
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to fetch report details")
        }

        const data = await response.json()
        setReport(data.data.report)
      } catch (err) {
        setError(err.message)
        toast.error("Failed to load report details")
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [reportId])

  const handleDeleteReport = async () => {
    if (!confirm("Are you sure you want to delete this report?")) {
      return
    }

    try {
      const response = await fetch(`http://localhost:5000/api/reports/${reportId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to delete report")
      }

      toast.success("Report deleted successfully")
      router.push("/admin/reports")
    } catch (err) {
      toast.error(err.message || "Failed to delete report")
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!report) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Report not found</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/reports">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{report.title}</h1>
            <p className="text-muted-foreground">
              {formatDate(report.dateRange.startDate)} - {formatDate(report.dateRange.endDate)}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          {report.fileUrl && (
            <Button asChild>
              <a href={`http://localhost:5000${report.fileUrl}`} download target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </a>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/admin/reports/${reportId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Report
            </Link>
          </Button>
          <Button variant="destructive" onClick={handleDeleteReport}>
            <Trash className="h-4 w-4 mr-2" />
            Delete Report
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-medium">Report Type</h3>
              <p className="text-muted-foreground mt-1 capitalize">{report.type}</p>
            </div>
            <div>
              <h3 className="font-medium">Created By</h3>
              <p className="text-muted-foreground mt-1">{report.createdBy?.name || "System"}</p>
            </div>
            <div>
              <h3 className="font-medium">Created At</h3>
              <p className="text-muted-foreground mt-1">{formatDate(report.createdAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report Data</CardTitle>
        </CardHeader>
        <CardContent>
          {report.data ? (
            <div className="space-y-4">
              {/* Health Report Data */}
              {report.type === "health" && (
                <div>
                  <h3 className="font-medium mb-2">Health Assessment Summary</h3>
                  {report.data.summary && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-muted/20 p-4 rounded-md">
                        <p className="text-sm text-muted-foreground">Total Assessments</p>
                        <p className="text-2xl font-bold">{report.data.summary.totalAssessments || 0}</p>
                      </div>
                      <div className="bg-muted/20 p-4 rounded-md">
                        <p className="text-sm text-muted-foreground">Health Index</p>
                        <p className="text-2xl font-bold">{report.data.summary.healthIndex || 0}/100</p>
                      </div>
                      <div className="bg-muted/20 p-4 rounded-md">
                        <p className="text-sm text-muted-foreground">Status Distribution</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {report.data.summary.statusDistribution &&
                            Object.entries(report.data.summary.statusDistribution).map(([status, count]) => (
                              <span
                                key={status}
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  status === "healthy"
                                    ? "bg-green-100 text-green-800"
                                    : status === "mild"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : status === "moderate"
                                        ? "bg-orange-100 text-orange-800"
                                        : status === "severe"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {status}: {count}
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {report.data.recommendations && report.data.recommendations.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-medium mb-2">Recommendations</h3>
                      <ul className="list-disc pl-5 space-y-2">
                        {report.data.recommendations.map((rec, index) => (
                          <li key={index}>
                            <strong>{rec.disease}</strong> ({rec.occurrences} occurrences)
                            <ul className="list-circle pl-5 mt-1">
                              {rec.recommendations.map((r, i) => (
                                <li key={i} className="text-sm text-muted-foreground">
                                  {r}
                                </li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Inventory Report Data */}
              {report.type === "inventory" && (
                <div>
                  <h3 className="font-medium mb-2">Inventory Summary</h3>
                  {report.data.summary && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-muted/20 p-4 rounded-md">
                        <p className="text-sm text-muted-foreground">Total Items</p>
                        <p className="text-2xl font-bold">{report.data.summary.totalItems || 0}</p>
                      </div>
                      <div className="bg-muted/20 p-4 rounded-md">
                        <p className="text-sm text-muted-foreground">Total Value</p>
                        <p className="text-2xl font-bold">${report.data.inventory?.totalValue?.toFixed(2) || "0.00"}</p>
                      </div>
                      <div className="bg-muted/20 p-4 rounded-md">
                        <p className="text-sm text-muted-foreground">Low Stock Items</p>
                        <p className="text-2xl font-bold">{report.data.inventory?.lowStockItems?.length || 0}</p>
                      </div>
                    </div>
                  )}

                  {report.data.inventory?.lowStockItems?.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-medium mb-2">Low Stock Items</h3>
                      <div className="rounded-md border">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                              <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
                              <th className="px-4 py-3 text-left text-sm font-medium">Quantity</th>
                              <th className="px-4 py-3 text-left text-sm font-medium">Reorder Level</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.data.inventory.lowStockItems.map((item, index) => (
                              <tr key={index} className="border-t">
                                <td className="px-4 py-3 text-sm">{item.name}</td>
                                <td className="px-4 py-3 text-sm capitalize">{item.category}</td>
                                <td className="px-4 py-3 text-sm">
                                  {item.quantity} {item.unit}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {item.reorderLevel} {item.unit}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {report.data.usage?.timeline?.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-medium mb-2">Usage Timeline</h3>
                      <div className="h-64 bg-muted/20 rounded-md p-4">
                        <div className="h-full flex items-end">
                          {report.data.usage.timeline.map((entry, index) => {
                            const maxUsage = Math.max(...report.data.usage.timeline.map((e) => e.usage))
                            const height = (entry.usage / maxUsage) * 100
                            return (
                              <div key={index} className="flex flex-col items-center mx-1 flex-1">
                                <div
                                  className="w-full bg-green-500 rounded-t-sm"
                                  style={{ height: `${height}%` }}
                                ></div>
                                <div className="text-xs mt-1 text-muted-foreground">{entry.date.split("T")[0]}</div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Land Report Data */}
              {report.type === "land" && (
                <div>
                  <h3 className="font-medium mb-2">Land Usage Summary</h3>
                  {report.data.summary && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-muted/20 p-4 rounded-md">
                        <p className="text-sm text-muted-foreground">Total Lands</p>
                        <p className="text-2xl font-bold">{report.data.summary.totalLands || 0}</p>
                      </div>
                      <div className="bg-muted/20 p-4 rounded-md">
                        <p className="text-sm text-muted-foreground">Total Area</p>
                        <p className="text-2xl font-bold">{report.data.summary.totalArea?.toFixed(2) || 0} hectares</p>
                      </div>
                      <div className="bg-muted/20 p-4 rounded-md">
                        <p className="text-sm text-muted-foreground">Status Distribution</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {report.data.summary.statusDistribution &&
                            Object.entries(report.data.summary.statusDistribution).map(([status, count]) => (
                              <span
                                key={status}
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  status === "available"
                                    ? "bg-green-100 text-green-800"
                                    : status === "planted"
                                      ? "bg-blue-100 text-blue-800"
                                      : status === "fallow"
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {status}: {count}
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {report.data.lands && report.data.lands.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-medium mb-2">Land Details</h3>
                      <div className="rounded-md border">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                              <th className="px-4 py-3 text-left text-sm font-medium">Size (hectares)</th>
                              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                              <th className="px-4 py-3 text-left text-sm font-medium">Current Crop</th>
                              <th className="px-4 py-3 text-left text-sm font-medium">Soil Type</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.data.lands.map((land, index) => (
                              <tr key={index} className="border-t">
                                <td className="px-4 py-3 text-sm">{land.name}</td>
                                <td className="px-4 py-3 text-sm">{land.size.hectares.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      land.status === "available"
                                        ? "bg-green-100 text-green-800"
                                        : land.status === "planted"
                                          ? "bg-blue-100 text-blue-800"
                                          : land.status === "fallow"
                                            ? "bg-amber-100 text-amber-800"
                                            : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {land.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm">{land.currentCrop || "-"}</td>
                                <td className="px-4 py-3 text-sm">{land.soilType || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {report.data.soilMoisture?.byLand?.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-medium mb-2">Soil Moisture</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Average soil moisture: {report.data.soilMoisture.average.toFixed(2)}%
                      </p>
                      <div className="rounded-md border">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="px-4 py-3 text-left text-sm font-medium">Land</th>
                              <th className="px-4 py-3 text-left text-sm font-medium">Moisture (%)</th>
                              <th className="px-4 py-3 text-left text-sm font-medium">Last Updated</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.data.soilMoisture.byLand.map((land, index) => (
                              <tr key={index} className="border-t">
                                <td className="px-4 py-3 text-sm">{land.name}</td>
                                <td className="px-4 py-3 text-sm">{land.moisture.toFixed(2)}%</td>
                                <td className="px-4 py-3 text-sm">{formatDate(land.lastUpdated)}</td>
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
          ) : (
            <p className="text-muted-foreground">No report data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
