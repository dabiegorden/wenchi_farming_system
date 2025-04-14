"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ArrowLeft, Save, Upload, X } from "lucide-react"

export default function NewLand() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [crops, setCrops] = useState([])
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    coordinates: { latitude: "", longitude: "" },
    size: "",
    unit: "hectare",
    soilType: "",
    soilPh: "",
    soilMoisture: "",
    currentCrop: "",
    plantingDate: "",
    expectedHarvestDate: "",
    status: "available",
    notes: "",
  })

  useEffect(() => {
    const fetchCrops = async () => {
      setLoading(true)
      try {
        const response = await fetch("http://localhost:5000/api/crops", {
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to fetch crops")
        }

        const data = await response.json()
        setCrops(data.data.crops)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchCrops()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === "latitude" || name === "longitude") {
      setFormData({
        ...formData,
        coordinates: {
          ...formData.coordinates,
          [name]: value,
        },
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      // Create a FormData object for multipart/form-data submission
      const formDataToSubmit = new FormData()

      // Add all the text fields
      formDataToSubmit.append("name", formData.name)
      formDataToSubmit.append("location", formData.location)
      if (formData.coordinates.latitude) {
        formDataToSubmit.append("coordinates[latitude]", formData.coordinates.latitude)
      }
      if (formData.coordinates.longitude) {
        formDataToSubmit.append("coordinates[longitude]", formData.coordinates.longitude)
      }
      formDataToSubmit.append("size", formData.size)
      formDataToSubmit.append("unit", formData.unit)
      if (formData.soilType) {
        formDataToSubmit.append("soilType", formData.soilType)
      }
      if (formData.soilPh) {
        formDataToSubmit.append("soilPh", formData.soilPh)
      }
      if (formData.soilMoisture) {
        formDataToSubmit.append("soilMoisture", formData.soilMoisture)
      }
      formDataToSubmit.append("status", formData.status)
      if (formData.notes) {
        formDataToSubmit.append("notes", formData.notes)
      }

      // Add crop-related fields if a crop is selected
      if (formData.currentCrop && formData.currentCrop !== "none") {
        formDataToSubmit.append("currentCrop", formData.currentCrop)

        if (formData.plantingDate) {
          formDataToSubmit.append("plantingDate", formData.plantingDate)
        }

        if (formData.expectedHarvestDate) {
          formDataToSubmit.append("expectedHarvestDate", formData.expectedHarvestDate)
        }
      }

      // Add the image file if one was selected
      if (imageFile) {
        formDataToSubmit.append("image", imageFile)
      }

      // Submit the form data to the API
      const response = await fetch("http://localhost:5000/api/land", {
        method: "POST",
        credentials: "include",
        body: formDataToSubmit,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create land plot")
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: "Land plot created successfully",
      })

      router.push(`/admin/land/${data.data.land._id}`)
    } catch (err) {
      setError(err.message)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/land">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Add New Land Plot</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Land Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <Label>Land Image</Label>
              <div className="flex flex-col space-y-2">
                {imagePreview ? (
                  <div className="relative w-full h-48 rounded-md overflow-hidden border">
                    <Image src={imagePreview || "/placeholder.svg"} alt="Land preview" fill className="object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={clearImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label
                    htmlFor="image"
                    className="border border-dashed rounded-md p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const file = e.dataTransfer.files[0]
                      if (file && file.type.startsWith("image/")) {
                        setImageFile(file)
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          setImagePreview(reader.result)
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  >
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">Drag and drop an image, or click to browse</p>
                  </label>
                )}
                <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Input
                  id="size"
                  name="size"
                  type="number"
                  step="0.01"
                  value={formData.size}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select name="unit" value={formData.unit} onValueChange={(value) => handleSelectChange("unit", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hectare">Hectare</SelectItem>
                    <SelectItem value="acre">Acre</SelectItem>
                    <SelectItem value="sqm">Square Meter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" value={formData.location} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  name="latitude"
                  value={formData.coordinates.latitude}
                  onChange={handleChange}
                  placeholder="7.7340"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  name="longitude"
                  value={formData.coordinates.longitude}
                  onChange={handleChange}
                  placeholder="-2.1009"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="soilType">Soil Type</Label>
                <Input
                  id="soilType"
                  name="soilType"
                  value={formData.soilType}
                  onChange={handleChange}
                  placeholder="Loamy"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="soilPh">Soil pH</Label>
                <Input
                  id="soilPh"
                  name="soilPh"
                  type="number"
                  step="0.1"
                  min="0"
                  max="14"
                  value={formData.soilPh}
                  onChange={handleChange}
                  placeholder="6.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="soilMoisture">Soil Moisture (%)</Label>
                <Input
                  id="soilMoisture"
                  name="soilMoisture"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.soilMoisture}
                  onChange={handleChange}
                  placeholder="40"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="planted">Planted</SelectItem>
                    <SelectItem value="fallow">Fallow</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Crop Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentCrop">Current Crop</Label>
                <Select
                  value={formData.currentCrop}
                  onValueChange={(value) => handleSelectChange("currentCrop", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select crop" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {crops.map((crop) => (
                      <SelectItem key={crop._id} value={crop._id}>
                        {crop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.currentCrop && formData.currentCrop !== "none" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="plantingDate">Planting Date</Label>
                    <Input
                      id="plantingDate"
                      name="plantingDate"
                      type="date"
                      value={formData.plantingDate}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expectedHarvestDate">Expected Harvest Date</Label>
                    <Input
                      id="expectedHarvestDate"
                      name="expectedHarvestDate"
                      type="date"
                      value={formData.expectedHarvestDate}
                      onChange={handleChange}
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2 border-t px-6 py-4">
            <Button variant="outline" asChild>
              <Link href="/admin/land">Cancel</Link>
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Land Plot
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
