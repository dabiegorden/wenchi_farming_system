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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Search, Plus, Eye, Edit, Trash, Thermometer } from "lucide-react"

export default function HealthAssessmentManagement() {
  const router = useRouter()
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  })

  const fetchAssessments = async () => {
    setLoading(true)
    try {
      let url = `http://localhost:5000/api/health?page=${pagination.page}&limit=${pagination.limit}`

      if (searchTerm) {
        url += `&search=${searchTerm}`
      }

      if (statusFilter && statusFilter !== "all") {
        url += `&status=${statusFilter}`
      }

      const response = await fetch(url, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch health assessments")
      }

      const data = await response.json()
      setAssessments(data.data.assessments)
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

  useEffect(() => {
    fetchAssessments()
  }, [pagination.page, statusFilter])

  const handleSearch = (e) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchAssessments()
  }

  const handleDeleteAssessment = async (assessmentId) => {
    if (!confirm("Are you sure you want to delete this health assessment?")) {
      return
    }

    try {
      const response = await fetch(`http://localhost:5000/api/health/${assessmentId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to delete health assessment")
      }

      toast.success("Health assessment deleted successfully")

      // Refresh the assessments list
      fetchAssessments()
    } catch (err) {
      toast.error(err.message)
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
          <h1 className="text-3xl font-bold">Health Assessment Management</h1>
          <p className="text-muted-foreground">Monitor and manage crop health assessments</p>
        </div>
        <Button asChild>
          <Link href="/admin/health/new">
            <Plus className="h-4 w-4 mr-2" />
            Add New Assessment
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Health Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex space-x-2">
              <Input
                placeholder="Search by crop or condition..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Button type="submit" variant="secondary" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </form>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="healthy">Healthy</SelectItem>
                <SelectItem value="mild">Mild Issues</SelectItem>
                <SelectItem value="moderate">Moderate Issues</SelectItem>
                <SelectItem value="severe">Severe Issues</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
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
                        <th className="px-4 py-3 text-left text-sm font-medium">Crop</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Condition</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Assessment Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Land Plot</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assessments.length > 0 ? (
                        assessments.map((assessment) => (
                          <tr key={assessment._id} className="border-t">
                            <td className="px-4 py-3 text-sm">
                              <div className="flex items-center gap-2">
                                {assessment.cropId?.imageUrl ? (
                                  <img
                                    src={`http://localhost:5000${assessment.cropId.imageUrl}`}
                                    alt={assessment.cropId.name}
                                    className="h-8 w-8 object-cover rounded-md"
                                  />
                                ) : (
                                  <div className="h-8 w-8 bg-green-100 flex items-center justify-center rounded-md">
                                    <Thermometer className="h-4 w-4 text-green-600" />
                                  </div>
                                )}
                                <span className="font-medium">{assessment.cropId?.name || "Unknown Crop"}</span>
                              </div>
                            </td>
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
                            <td className="px-4 py-3 text-sm">{assessment.aiAnalysis?.disease || "-"}</td>
                            <td className="px-4 py-3 text-sm">{formatDate(assessment.createdAt)}</td>
                            <td className="px-4 py-3 text-sm">{assessment.landId?.name || "-"}</td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex space-x-2">
                                <Button variant="ghost" size="icon" asChild>
                                  <Link href={`/admin/health/${assessment._id}`}>
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <Button variant="ghost" size="icon" asChild>
                                  <Link href={`/admin/health/${assessment._id}/edit`}>
                                    <Edit className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteAssessment(assessment._id)}
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
                          <td colSpan={6} className="px-4 py-3 text-sm text-center text-muted-foreground">
                            No health assessments found
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
