"use client"

import { useState } from "react"
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

export default function AddInventoryItem() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    category: "tool",
    description: "",
    quantity: "",
    unit: "pcs",
    unitCost: "",
    reorderLevel: "",
    supplier: "",
    location: "",
    notes: "",
  })
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleCategoryChange = (value) => {
    setFormData({ ...formData, category: value })
  }

  const handleUnitChange = (value) => {
    setFormData({ ...formData, unit: value })
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Create form data for multipart/form-data
      const formDataToSend = new FormData()

      // Add text fields
      formDataToSend.append("name", formData.name)
      formDataToSend.append("category", formData.category)
      if (formData.description) formDataToSend.append("description", formData.description)
      formDataToSend.append("quantity", formData.quantity)
      formDataToSend.append("unit", formData.unit)
      if (formData.unitCost) formDataToSend.append("unitCost", formData.unitCost)
      if (formData.reorderLevel) formDataToSend.append("reorderLevel", formData.reorderLevel)
      if (formData.supplier) formDataToSend.append("supplier", formData.supplier)
      if (formData.location) formDataToSend.append("location", formData.location)
      if (formData.notes) formDataToSend.append("notes", formData.notes)

      // Add image if selected
      if (image) {
        formDataToSend.append("image", image)
      }

      // Updated to use the correct API endpoint
      const response = await fetch(`http://localhost:5000/api/inventory/items`, {
        method: "POST",
        body: formDataToSend,
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to create inventory item")
      }

      toast.success("Inventory item created successfully")
      router.push("/admin/inventory")
    } catch (err) {
      setError(err.message)
      toast.error("Error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/inventory">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Add New Inventory Item</h1>
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
            <CardTitle>Item Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={handleCategoryChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fertilizer">Fertilizer</SelectItem>
                    <SelectItem value="pesticide">Pesticide</SelectItem>
                    <SelectItem value="tool">Tool</SelectItem>
                    <SelectItem value="seed">Seed</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                <Select value={formData.unit} onValueChange={handleUnitChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pcs">Pieces</SelectItem>
                    <SelectItem value="kg">Kilograms</SelectItem>
                    <SelectItem value="g">Grams</SelectItem>
                    <SelectItem value="l">Liters</SelectItem>
                    <SelectItem value="ml">Milliliters</SelectItem>
                    <SelectItem value="bags">Bags</SelectItem>
                    <SelectItem value="boxes">Boxes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitCost">Unit Cost (₵)</Label>
                <Input
                  id="unitCost"
                  name="unitCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unitCost}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorderLevel">Reorder Level</Label>
              <Input
                id="reorderLevel"
                name="reorderLevel"
                type="number"
                min="0"
                value={formData.reorderLevel}
                onChange={handleChange}
                placeholder={`When to alert for low stock (in ${formData.unit})`}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Storage Location</Label>
              <Input id="location" name="location" value={formData.location} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input id="supplier" name="supplier" value={formData.supplier} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Item Image</Label>
              <Input id="image" type="file" accept="image/*" onChange={handleImageChange} />
              {imagePreview && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground mb-1">Preview:</p>
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    alt="Preview"
                    className="h-40 object-contain border rounded-md"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Additional information about this item"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/admin/inventory">Cancel</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Item"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
