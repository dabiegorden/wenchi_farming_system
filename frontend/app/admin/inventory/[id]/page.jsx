"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import { ArrowLeft, Edit, Package, AlertTriangle, Calendar, DollarSign } from "lucide-react"

export default function InventoryItemDetails() {
  const params = useParams()
  const itemId = params.id

  const router = useRouter()
  const [item, setItem] = useState(null)
  const [usageHistory, setUsageHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchItem = async () => {
      try {
        // Updated to use the correct API endpoint
        const response = await fetch(`http://localhost:5000/api/inventory/items/${itemId}`, {
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to fetch inventory item details")
        }

        const data = await response.json()

        if (data.success) {
          setItem(data.data.item)
          if (data.data.usageHistory) {
            setUsageHistory(data.data.usageHistory)
          }
        } else {
          throw new Error(data.message || "Failed to fetch inventory item details")
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (itemId) {
      fetchItem()
    }
  }, [itemId])

  const handleDeleteItem = async () => {
    if (!confirm("Are you sure you want to delete this inventory item?")) {
      return
    }

    try {
      // Updated to use the correct API endpoint
      const response = await fetch(`http://localhost:5000/api/inventory/items/${itemId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to delete inventory item")
      }

      const data = await response.json()

      if (data.success) {
        toast.success("Inventory item deleted successfully")
        router.push("/admin/inventory")
      } else {
        throw new Error(data.message || "Failed to delete inventory item")
      }
    } catch (err) {
      toast.error("Error: " + err.message)
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
                    <h3 className="font-medium">Unit Cost</h3>
                    <p className="text-muted-foreground mt-1">${item.unitCost?.toFixed(2) || "0.00"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Reorder Level</h3>
                    <p className="text-muted-foreground mt-1">
                      {item.reorderLevel} {item.unit}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Created At</h3>
                    <p className="text-muted-foreground mt-1">{formatDate(item.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Updated At</h3>
                    <p className="text-muted-foreground mt-1">{formatDate(item.updatedAt)}</p>
                  </div>
                </div>
              </div>

              {item.supplier && (
                <div>
                  <h3 className="font-medium">Supplier Information</h3>
                  <div className="mt-2 p-4 bg-muted/20 rounded-md">
                    {typeof item.supplier === "object" ? (
                      <>
                        <p className="font-medium">{item.supplier.name}</p>
                        {item.supplier.contactPerson && <p>{item.supplier.contactPerson}</p>}
                        {item.supplier.email && <p>{item.supplier.email}</p>}
                        {item.supplier.phone && <p>{item.supplier.phone}</p>}
                      </>
                    ) : (
                      <p className="font-medium">{item.supplier}</p>
                    )}
                  </div>
                </div>
              )}

              {item.location && (
                <div>
                  <h3 className="font-medium">Storage Location</h3>
                  <p className="text-muted-foreground mt-1">{item.location}</p>
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

      {usageHistory && usageHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Usage History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Quantity</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Usage Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Recorded By</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {usageHistory.map((usage) => (
                    <tr key={usage._id} className="border-t">
                      <td className="px-4 py-3 text-sm">{formatDate(usage.createdAt)}</td>
                      <td className="px-4 py-3 text-sm">
                        {usage.quantity} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-sm capitalize">{usage.usageType}</td>
                      <td className="px-4 py-3 text-sm">{usage.recordedBy?.name || "Unknown"}</td>
                      <td className="px-4 py-3 text-sm">{usage.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
