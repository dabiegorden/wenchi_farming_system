"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Plus, Eye, Download, Trash } from "lucide-react"

export default function ReportsManagement() {
  const router = useRouter()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  })

  // New report state
  const [isGenerateReportOpen, setIsGenerateReportOpen] = useState(false)
  const [newReportType, setNewReportType] = useState("")
  const [newReportData, setNewReportData] = useState({
    title: "",
    startDate: "",
    endDate: "",
    cropId: "",
    category: "",
  })
  const [crops, setCrops] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)

  const fetchReports = async () => {
    setLoading(true)
    try {
      let url = `http://localhost:5000/api/reports?page=${pagination.page}&limit=${pagination.limit}`

      if (typeFilter) {
        url += `&type=${typeFilter}`
      }

      const response = await fetch(url, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch reports")
      }

      const data = await response.json()
      setReports(data.data.reports)
      setPagination({
        ...pagination,
        total: data.data.pagination.total,
        pages: data.data.pagination.pages,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchCrops = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/crops?limit=100", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch crops")
      }

      const data = await response.json()
      setCrops(data.data.crops)
    } catch (err) {
      console.error("Failed to fetch crops:", err)
    }
  }

  useEffect(() => {
    fetchReports()
    fetchCrops()
  }, [pagination.page, typeFilter])

  const handleDeleteReport = async (reportId) => {
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

      toast({
        title: "Success",
        description: "Report deleted successfully",
      })

      // Refresh the reports list
      fetchReports()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      })
    }
  }

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    try {
      // Validate form
      if (!newReportType || !newReportData.title || !newReportData.startDate || !newReportData.endDate) {
        throw new Error("Please fill in all required fields")
      }

      let endpoint = ""
      const payload = {
        title: newReportData.title,
        startDate: newReportData.startDate,
        endDate: newReportData.endDate,
      }

      // Add specific fields based on report type
      switch (newReportType) {
        case "crop-health":
          endpoint = "/api/reports/crop-health"
          if (newReportData.cropId && newReportData.cropId !== "all") {
            payload.cropId = newReportData.cropId
          }
          break
        case "inventory":
          endpoint = "/api/reports/inventory"
          if (newReportData.category && newReportData.category !== "all") {
            payload.category = newReportData.category
          }
          break
        case "land":
          endpoint = "/api/reports/land"
          break
        default:
          throw new Error("Invalid report type")
      }

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate report")
      }

      toast({
        title: "Success",
        description: "Report generated successfully",
      })

      // Reset form and close dialog
      setNewReportType("")
      setNewReportData({
        title: "",
        startDate: "",
        endDate: "",
        cropId: "",
        category: "",
      })
      setIsGenerateReportOpen(false)

      // Refresh the reports list
      fetchReports()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      })
    } finally {
      setIsGenerating(false)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports Management</h1>
          <p className="text-muted-foreground">Generate and manage farm reports</p>
        </div>
        <Dialog open={isGenerateReportOpen} onOpenChange={setIsGenerateReportOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Generate New Report</DialogTitle>
              <DialogDescription>Select the type of report you want to generate</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="reportType">Report Type *</Label>
                <Select value={newReportType} onValueChange={setNewReportType}>
                  <SelectTrigger id="reportType">
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crop-health">Crop Health Report</SelectItem>
                    <SelectItem value="inventory">Inventory Report</SelectItem>
                    <SelectItem value="land">Land Usage Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newReportType && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="title">Report Title *</Label>
                    <Input
                      id="title"
                      value={newReportData.title}
                      onChange={(e) => setNewReportData({ ...newReportData, title: e.target.value })}
                      placeholder="Enter report title"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="startDate">Start Date *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={newReportData.startDate}
                        onChange={(e) => setNewReportData({ ...newReportData, startDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="endDate">End Date *</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={newReportData.endDate}
                        onChange={(e) => setNewReportData({ ...newReportData, endDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {newReportType === "crop-health" && (
                    <div className="grid gap-2">
                      <Label htmlFor="cropId">Crop (Optional)</Label>
                      <Select
                        value={newReportData.cropId}
                        onValueChange={(value) => setNewReportData({ ...newReportData, cropId: value })}
                      >
                        <SelectTrigger id="cropId">
                          <SelectValue placeholder="All crops" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All crops</SelectItem>
                          {crops.map((crop) => (
                            <SelectItem key={crop._id} value={crop._id}>
                              {crop.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {newReportType === "inventory" && (
                    <div className="grid gap-2">
                      <Label htmlFor="category">Category (Optional)</Label>
                      <Select
                        value={newReportData.category}
                        onValueChange={(value) => setNewReportData({ ...newReportData, category: value })}
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All categories</SelectItem>
                          <SelectItem value="fertilizer">Fertilizer</SelectItem>
                          <SelectItem value="pesticide">Pesticide</SelectItem>
                          <SelectItem value="tool">Tool</SelectItem>
                          <SelectItem value="seed">Seed</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}
            </div>
            <DialogFooter>
              <Button
                onClick={handleGenerateReport}
                disabled={
                  isGenerating ||
                  !newReportType ||
                  !newReportData.title ||
                  !newReportData.startDate ||
                  !newReportData.endDate
                }
              >
                {isGenerating ? "Generating..." : "Generate Report"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-6">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="crop">Crop</SelectItem>
                <SelectItem value="health">Health</SelectItem>
                <SelectItem value="inventory">Inventory</SelectItem>
                <SelectItem value="land">Land</SelectItem>
                <SelectItem value="weather">Weather</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Date Range</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.length > 0 ? (
                        reports.map((report) => (
                          <tr key={report._id} className="border-t">
                            <td className="px-4 py-3 text-sm font-medium">{report.title}</td>
                            <td className="px-4 py-3 text-sm">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  report.type === "crop"
                                    ? "bg-green-100 text-green-800"
                                    : report.type === "health"
                                      ? "bg-red-100 text-red-800"
                                      : report.type === "inventory"
                                        ? "bg-purple-100 text-purple-800"
                                        : report.type === "land"
                                          ? "bg-amber-100 text-amber-800"
                                          : report.type === "weather"
                                            ? "bg-blue-100 text-blue-800"
                                            : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {report.type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {formatDate(report.dateRange.startDate)} - {formatDate(report.dateRange.endDate)}
                            </td>
                            <td className="px-4 py-3 text-sm">{formatDate(report.createdAt)}</td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex space-x-2">
                                <Button variant="ghost" size="icon" asChild>
                                  <Link href={`/admin/reports/${report._id}`}>
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </Button>
                                {report.fileUrl && (
                                  <Button variant="ghost" size="icon" asChild>
                                    <a
                                      href={`http://localhost:5000${report.fileUrl}`}
                                      download
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <Download className="h-4 w-4" />
                                    </a>
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteReport(report._id)}
                                  className="text-red-500 hover:text-red-600"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-3 text-sm text-center text-muted-foreground">
                            No reports found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {pagination.pages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                        className={pagination.page <= 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setPagination((prev) => ({ ...prev, page }))}
                          isActive={page === pagination.page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setPagination((prev) => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))
                        }
                        className={pagination.page >= pagination.pages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
