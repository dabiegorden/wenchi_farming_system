"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import { ArrowLeft, Edit, Package, AlertTriangle, Calendar, DollarSign } from "lucide-react"

export default function InventoryItemDetails({ params }) {
  // Unwrap the params Promise
  const unwrappedParams = use(params)
  const itemId = unwrappedParams.id

  const router = useRouter()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/inventory/${itemId}`, {
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to fetch inventory item details")
        }

        const data = await response.json()
        setItem(data.data.item)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchItem()
  }, [itemId])

  const handleDeleteItem = async () => {
    if (!confirm("Are you sure you want to delete this inventory item?")) {
      return
    }

    try {
      const response = await fetch(`http://localhost:5000/api/inventory/${itemId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to delete inventory item")
      }

      toast.success("Inventory item deleted successfully")
      router.push("/admin/inventory")
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

  if (!item) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Inventory item not found</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/inventory">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{item.name}</h1>
            <p className="text-muted-foreground capitalize">{item.category}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button asChild>
            <Link href={`/admin/inventory/${itemId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Item
            </Link>
          </Button>
          <Button variant="destructive" onClick={handleDeleteItem}>
            Delete Item
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Item Image</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              {item.imageUrl ? (
                <img
                  src={`http://localhost:5000${item.imageUrl}`}
                  alt={item.name}
                  className="max-h-64 object-contain rounded-md"
                />
              ) : (
                <div className="h-64 w-full bg-purple-100 flex items-center justify-center rounded-md">
                  <Package className="h-16 w-16 text-purple-600" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Item Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium">Description</h3>
                <p className="text-muted-foreground mt-1">{item.description || "No description provided"}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-2">
                  <Package className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Quantity</h3>
                    <p className="text-muted-foreground mt-1">
                      {item.quantity} {item.unit}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Unit Price</h3>
                    <p className="text-muted-foreground mt-1">${item.unitPrice?.toFixed(2) || "0.00"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Low Stock Threshold</h3>
                    <p className="text-muted-foreground mt-1">
                      {item.lowStockThreshold} {item.unit}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Last Restocked</h3>
                    <p className="text-muted-foreground mt-1">
                      {item.lastRestocked ? formatDate(item.lastRestocked) : "Not available"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Created At</h3>
                    <p className="text-muted-foreground mt-1">{formatDate(item.createdAt)}</p>
                  </div>
                </div>
              </div>

              {item.supplier && (
                <div>
                  <h3 className="font-medium">Supplier Information</h3>
                  <div className="mt-2 p-4 bg-muted/20 rounded-md">
                    <p className="font-medium">{item.supplier.name}</p>
                    {item.supplier.contactPerson && <p>{item.supplier.contactPerson}</p>}
                    {item.supplier.email && <p>{item.supplier.email}</p>}
                    {item.supplier.phone && <p>{item.supplier.phone}</p>}
                  </div>
                </div>
              )}

              {item.notes && (
                <div>
                  <h3 className="font-medium">Notes</h3>
                  <p className="text-muted-foreground mt-1">{item.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
