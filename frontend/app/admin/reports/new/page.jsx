"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { ArrowLeft, FileText } from "lucide-react"

export default function NewReportPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [crops, setCrops] = useState([])
  const [reportType, setReportType] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    startDate: "",
    endDate: "",
    cropId: "",
    category: "",
    landId: "",
  })

  useEffect(() => {
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
        toast.error("Failed to load crops data")
      }
    }

    fetchCrops()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate form
      if (!reportType || !formData.title || !formData.startDate || !formData.endDate) {
        throw new Error("Please fill in all required fields")
      }

      let endpoint = ""
      const payload = {
        title: formData.title,
        startDate: formData.startDate,
        endDate: formData.endDate,
      }

      // Add specific fields based on report type
      switch (reportType) {
        case "crop-health":
          endpoint = "/api/reports/crop-health"
          if (formData.cropId && formData.cropId !== "all") {
            payload.cropId = formData.cropId
          }
          break
        case "inventory":
          endpoint = "/api/reports/inventory"
          if (formData.category && formData.category !== "all") {
            payload.category = formData.category
          }
          break
        case "land":
          endpoint = "/api/reports/land"
          if (formData.landId && formData.landId !== "all") {
            payload.landId = formData.landId
          }
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

      toast.success("Report generated successfully")

      // Redirect to the report details page
      router.push(`/admin/reports/${data.data.report._id}`)
    } catch (err) {
      toast.error(err.message || "Failed to generate report")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/reports">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Generate New Report</h1>
          <p className="text-muted-foreground">Create a new farm report</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Report Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="reportType">Report Type *</Label>
              <Select value={reportType} onValueChange={setReportType} required>
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

            <div className="grid gap-2">
              <Label htmlFor="title">Report Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter report title"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            {reportType === "crop-health" && (
              <div className="grid gap-2">
                <Label htmlFor="cropId">Crop (Optional)</Label>
                <Select value={formData.cropId} onValueChange={(value) => setFormData({ ...formData, cropId: value })}>
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

            {reportType === "inventory" && (
              <div className="grid gap-2">
                <Label htmlFor="category">Category (Optional)</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
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
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline" asChild>
              <Link href="/admin/reports">Cancel</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
