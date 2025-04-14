"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Leaf, Search, Plus, Eye, Edit, Trash } from "lucide-react"

export default function CropsManagement() {
  const router = useRouter()
  const [crops, setCrops] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  })

  const fetchCrops = async () => {
    setLoading(true)
    try {
      let url = `http://localhost:5000/api/crops?page=${pagination.page}&limit=${pagination.limit}`

      if (searchTerm) {
        url += `&search=${searchTerm}`
      }

      const response = await fetch(url, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch crops")
      }

      const data = await response.json()
      setCrops(data.data.crops)
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
    fetchCrops()
  }, [pagination.page])

  const handleSearch = (e) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchCrops()
  }

  const handleDeleteCrop = async (cropId) => {
    if (!confirm("Are you sure you want to delete this crop?")) {
      return
    }

    try {
      const response = await fetch(`http://localhost:5000/api/crops/${cropId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to delete crop")
      }

      toast({
        title: "Success",
        description: "Crop deleted successfully",
      })

      // Refresh the crops list
      fetchCrops()
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
          <h1 className="text-3xl font-bold">Crop Management</h1>
          <p className="text-muted-foreground">Manage crop varieties and information</p>
        </div>
        <Button asChild>
          <Link href="/admin/crops/new">
            <Plus className="h-4 w-4 mr-2" />
            Add New Crop
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crops</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex space-x-2 mb-6">
            <Input
              placeholder="Search crops..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button type="submit" variant="secondary" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </form>

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
                        <th className="px-4 py-3 text-left text-sm font-medium">Image</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Scientific Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Growth Duration</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {crops.length > 0 ? (
                        crops.map((crop) => (
                          <tr key={crop._id} className="border-t">
                            <td className="px-4 py-3 text-sm">
                              {crop.imageUrl ? (
                                <img
                                  src={`http://localhost:5000${crop.imageUrl}`}
                                  alt={crop.name}
                                  className="h-10 w-10 object-cover rounded-md"
                                />
                              ) : (
                                <div className="h-10 w-10 bg-green-100 flex items-center justify-center rounded-md">
                                  <Leaf className="h-5 w-5 text-green-600" />
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium">{crop.name}</td>
                            <td className="px-4 py-3 text-sm">{crop.scientificName || "-"}</td>
                            <td className="px-4 py-3 text-sm">
                              {crop.growthDuration ? `${crop.growthDuration} days` : "-"}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex space-x-2">
                                <Button variant="ghost" size="icon" asChild>
                                  <Link href={`/admin/crops/${crop._id}`}>
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <Button variant="ghost" size="icon" asChild>
                                  <Link href={`/admin/crops/${crop._id}/edit`}>
                                    <Edit className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteCrop(crop._id)}
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
                            No crops found
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
