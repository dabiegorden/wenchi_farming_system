"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"

export default function RecordInventoryUsage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetchingItems, setFetchingItems] = useState(true)
  const [error, setError] = useState("")
  const [inventoryItems, setInventoryItems] = useState([])
  const [lands, setLands] = useState([])
  const [crops, setCrops] = useState([])
  const [formData, setFormData] = useState({
    itemId: "none",
    quantity: "",
    usageType: "used",
    landId: "",
    cropId: "",
    notes: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      setFetchingItems(true)
      try {
        // Fetch inventory items - updated to use the correct API endpoint
        const itemsResponse = await fetch(`http://localhost:5000/api/inventory/items?limit=100`, {
          credentials: "include",
        })

        if (!itemsResponse.ok) {
          throw new Error("Failed to fetch inventory items")
        }

        const itemsData = await itemsResponse.json()
        if (itemsData.success) {
          setInventoryItems(itemsData.data.items || [])
        }

        // Fetch lands
        const landsResponse = await fetch(`http://localhost:5000/api/land?limit=100`, {
          credentials: "include",
        })

        if (landsResponse.ok) {
          const landsData = await landsResponse.json()
          if (landsData.success) {
            setLands(landsData.data.lands || [])
          }
        }

        // Fetch crops
        const cropsResponse = await fetch(`http://localhost:5000/api/crops?limit=100`, {
          credentials: "include",
        })

        if (cropsResponse.ok) {
          const cropsData = await cropsResponse.json()
          if (cropsData.success) {
            setCrops(cropsData.data.crops || [])
          }
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setFetchingItems(false)
      }
    }

    fetchData()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Updated to use the correct API endpoint
      const response = await fetch(`http://localhost:5000/api/inventory/usage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to record inventory usage")
      }

      if (data.success) {
        toast.success("Inventory usage recorded successfully")
        router.push("/admin/inventory")
      } else {
        throw new Error(data.message || "Failed to record inventory usage")
      }
    } catch (err) {
      setError(err.message)
      toast.error("Error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Find the selected item to display its unit
  const selectedItem = inventoryItems.find((item) => item._id === formData.itemId)

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/inventory">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Record Inventory Usage</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Usage Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="itemId">Inventory Item *</Label>
              {fetchingItems ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-muted-foreground">Loading items...</span>
                </div>
              ) : (
                <Select value={formData.itemId} onValueChange={(value) => handleSelectChange("itemId", value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an item"></SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>
                      Select an item
                    </SelectItem>
                    {inventoryItems.map((item) => (
                      <SelectItem key={item._id} value={item._id}>
                        {item.name} ({item.quantity} {item.unit} available)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity Used *</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                />
                {selectedItem && <p className="text-sm text-muted-foreground mt-1">Unit: {selectedItem.unit}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="usageType">Usage Type *</Label>
                <Select
                  value={formData.usageType}
                  onValueChange={(value) => handleSelectChange("usageType", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select usage type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="used">Used</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="transferred">Transferred</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="landId">Land Plot (Optional)</Label>
                <Select value={formData.landId} onValueChange={(value) => handleSelectChange("landId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a land plot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {lands.map((land) => (
                      <SelectItem key={land._id} value={land._id}>
                        {land.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cropId">Crop (Optional)</Label>
                <Select value={formData.cropId} onValueChange={(value) => handleSelectChange("cropId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a crop" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {crops.map((crop) => (
                      <SelectItem key={crop._id} value={crop._id}>
                        {crop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Additional information about this usage"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/admin/inventory">Cancel</Link>
            </Button>
            <Button type="submit" disabled={loading || fetchingItems}>
              {loading ? "Recording..." : "Record Usage"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
