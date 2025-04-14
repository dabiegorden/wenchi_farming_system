"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Download, Trash } from "lucide-react"

export default function ReportDetails({ params }) {
  const router = useRouter()
  const { toast } = useToast()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/reports/${params.id}`, {
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to fetch report details")
        }

        const data = await response.json()
        setReport(data.data.report)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [params.id])

  const handleDeleteReport = async () => {
    if (!confirm("Are you sure you want to delete this report?")) {
      return
    }

    try {
      const response = await fetch(`http://localhost:5000/api/reports/${params.id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to delete report")
      }

      toast({
        title: "Success",
        description: "Report deleted successfully",
      })

      router.push("/admin/reports")
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      })
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

          {report.description && (
            <div>
              <h3 className="font-medium">Description</h3>
              <p className="text-muted-foreground mt-1">{report.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report Data</CardTitle>
        </CardHeader>
        <CardContent>
          {report.data ? (
            <div className="space-y-4">
              {report.type === "crop" && (
                <div>
                  <h3 className="font-medium mb-2">Crop Information</h3>
                  {report.data.crops && report.data.crops.length > 0 ? (
                    <div className="rounded-md border">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Scientific Name</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Growth Duration</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Water Requirements</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.data.crops.map((crop, index) => (
                            <tr key={index} className="border-t">
                              <td className="px-4 py-3 text-sm">{crop.name}</td>
                              <td className="px-4 py-3 text-sm">{crop.scientificName || "-"}</td>
                              <td className="px-4 py-3 text-sm">
                                {crop.growthDuration ? `${crop.growthDuration} days` : "-"}
                              </td>
                              <td className="px-4 py-3 text-sm capitalize">{crop.waterRequirements || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No crop data available</p>
                  )}
                </div>
              )}

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

                  {report.data.assessments && report.data.assessments.length > 0 ? (
                    <div className="rounded-md border">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="px-4 py-3 text-left text-sm font-medium">Crop</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Condition</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.data.assessments.map((assessment, index) => (
                            <tr key={index} className="border-t">
                              <td className="px-4 py-3 text-sm">{assessment.crop?.name || "-"}</td>
                              <td className="px-4 py-3 text-sm">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    assessment.status === "healthy"
                                      ? "bg-green-100 text-green-800"
                                      : assessment.status === "mild"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : assessment.status === "moderate"
                                          ? "bg-orange-100 text-orange-800"
                                          : assessment.status === "severe"
                                            ? "bg-red-100 text-red-800"
                                            : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {assessment.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">{assessment.condition || "-"}</td>
                              <td className="px-4 py-3 text-sm">
                                {assessment.date ? formatDate(assessment.date) : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No health assessment data available</p>
                  )}
                </div>
              )}

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
                        <p className="text-2xl font-bold">${report.data.summary.totalValue?.toFixed(2) || "0.00"}</p>
                      </div>
                      <div className="bg-muted/20 p-4 rounded-md">
                        <p className="text-sm text-muted-foreground">Low Stock Items</p>
                        <p className="text-2xl font-bold">{report.data.summary.lowStockCount || 0}</p>
                      </div>
                    </div>
                  )}

                  {report.data.items && report.data.items.length > 0 ? (
                    <div className="rounded-md border">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Quantity</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Unit Price</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Total Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.data.items.map((item, index) => (
                            <tr key={index} className="border-t">
                              <td className="px-4 py-3 text-sm">{item.name}</td>
                              <td className="px-4 py-3 text-sm capitalize">{item.category}</td>
                              <td className="px-4 py-3 text-sm">
                                {item.quantity} {item.unit}
                              </td>
                              <td className="px-4 py-3 text-sm">${item.unitPrice?.toFixed(2) || "0.00"}</td>
                              <td className="px-4 py-3 text-sm">
                                ${(item.quantity * item.unitPrice).toFixed(2) || "0.00"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No inventory data available</p>
                  )}
                </div>
              )}

              {report.type === "land" && (
                <div>
                  <h3 className="font-medium mb-2">Land Usage Summary</h3>
                  {report.data.summary && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-muted/20 p-4 rounded-md">
                        <p className="text-sm text-muted-foreground">Total Land Area</p>
                        <p className="text-2xl font-bold">{report.data.summary.totalArea || 0} hectares</p>
                      </div>
                      <div className="bg-muted/20 p-4 rounded-md">
                        <p className="text-sm text-muted-foreground">Planted Area</p>
                        <p className="text-2xl font-bold">{report.data.summary.plantedArea || 0} hectares</p>
                      </div>
                      <div className="bg-muted/20 p-4 rounded-md">
                        <p className="text-sm text-muted-foreground">Available Area</p>
                        <p className="text-2xl font-bold">{report.data.summary.availableArea || 0} hectares</p>
                      </div>
                    </div>
                  )}

                  {report.data.lands && report.data.lands.length > 0 ? (
                    <div className="rounded-md border">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Size (hectares)</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Current Crop</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Location</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.data.lands.map((land, index) => (
                            <tr key={index} className="border-t">
                              <td className="px-4 py-3 text-sm">{land.name}</td>
                              <td className="px-4 py-3 text-sm">{land.size}</td>
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
                              <td className="px-4 py-3 text-sm">{land.currentCrop?.name || "-"}</td>
                              <td className="px-4 py-3 text-sm">{land.location || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No land usage data available</p>
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
