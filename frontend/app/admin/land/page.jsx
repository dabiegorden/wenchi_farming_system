"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
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
import { Search, Plus, Eye, Edit, Trash } from "lucide-react"

export default function LandManagement() {
  const router = useRouter()
  const [lands, setLands] = useState([])
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

  const fetchLands = async () => {
    setLoading(true)
    try {
      let url = `http://localhost:5000/api/land?page=${pagination.page}&limit=${pagination.limit}`

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
        throw new Error("Failed to fetch land plots")
      }

      const data = await response.json()
      setLands(data.data.lands)
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
    fetchLands()
  }, [pagination.page, statusFilter])

  const handleSearch = (e) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchLands()
  }

  const handleDeleteLand = async (landId) => {
    if (!confirm("Are you sure you want to delete this land plot?")) {
      return
    }

    try {
      const response = await fetch(`http://localhost:5000/api/land/${landId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to delete land plot")
      }

      toast({
        title: "Success",
        description: "Land plot deleted successfully",
      })

      // Refresh the lands list
      fetchLands()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Land Management</h1>
          <p className="text-muted-foreground">Manage farm land plots and allocations</p>
        </div>
        <Button asChild>
          <Link href="/admin/land/new">
            <Plus className="h-4 w-4 mr-2" />
            Add New Land Plot
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Land Plots</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex space-x-2">
              <Input
                placeholder="Search by name or location..."
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
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="planted">Planted</SelectItem>
                <SelectItem value="fallow">Fallow</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {lands.length > 0 ? (
                  lands.map((land) => (
                    <Card key={land._id} className="overflow-hidden">
                      <div className="relative h-40 w-full">
                        <Image
                          src={
                            land.imageUrl
                              ? `http://localhost:5000${land.imageUrl}`
                              : "/placeholder.svg?height=200&width=400"
                          }
                          alt={land.name}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-2 right-2">
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
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-1">{land.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {typeof land.size === "object"
                            ? `${land.size.value} ${land.size.unit}`
                            : `${land.size} hectares`}
                          {land.location ? ` • ${land.location}` : ""}
                        </p>
                        <p className="text-sm mb-4">
                          {land.currentCrop ? `Currently growing: ${land.currentCrop.name}` : "No crop planted"}
                        </p>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" asChild className="flex-1">
                            <Link href={`/admin/land/${land._id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild className="flex-1">
                            <Link href={`/admin/land/${land._id}/edit`}>
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteLand(land._id)}
                            className="flex-1 text-red-500 hover:text-red-600"
                          >
                            <Trash className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-muted-foreground">No land plots found</div>
                )}
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
