"use client"

import { useState, useEffect } from "react"
import { use } from "react"
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

export default function EditCrop({ params }) {
  // Unwrap the params Promise in Next.js 15
  const unwrappedParams = use(params)
  const cropId = unwrappedParams.id

  const router = useRouter()
  const [crop, setCrop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    scientificName: "",
    description: "",
    growthDuration: "",
    waterRequirements: "medium",
    idealTemperature: {
      min: "",
      max: "",
    },
    plantingSeasons: [],
    soilRequirements: [],
    commonDiseases: [],
    nutritionalValue: "",
  })
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  useEffect(() => {
    const fetchCrop = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/crops/${cropId}`, {
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to fetch crop")
        }

        const data = await response.json()
        setCrop(data.data.crop)

        // Initialize form data
        setFormData({
          name: data.data.crop.name || "",
          scientificName: data.data.crop.scientificName || "",
          description: data.data.crop.description || "",
          growthDuration: data.data.crop.growthDuration || "",
          waterRequirements: data.data.crop.waterRequirements || "medium",
          idealTemperature: {
            min: data.data.crop.idealTemperature?.min || "",
            max: data.data.crop.idealTemperature?.max || "",
          },
          plantingSeasons: data.data.crop.plantingSeasons || [],
          soilRequirements: data.data.crop.soilRequirements || [],
          commonDiseases: data.data.crop.commonDiseases || [],
          nutritionalValue: data.data.crop.nutritionalValue || "",
        })

        // Set image preview if exists
        if (data.data.crop.imageUrl) {
          setImagePreview(`http://localhost:5000${data.data.crop.imageUrl}`)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchCrop()
  }, [cropId])

  const handleChange = (e) => {
    const { name, value } = e.target

    // Handle nested properties
    if (name.includes(".")) {
      const [parent, child] = name.split(".")
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value,
        },
      })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleWaterRequirementsChange = (value) => {
    setFormData({ ...formData, waterRequirements: value })
  }

  const handleArrayChange = (e, field) => {
    const values = e.target.value.split(",").map((item) => item.trim())
    setFormData({ ...formData, [field]: values })
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
    setSaving(true)
    setError("")

    try {
      // Create form data for multipart/form-data
      const formDataToSend = new FormData()

      // Add text fields
      formDataToSend.append("name", formData.name)
      if (formData.scientificName) formDataToSend.append("scientificName", formData.scientificName)
      if (formData.description) formDataToSend.append("description", formData.description)
      if (formData.growthDuration) formDataToSend.append("growthDuration", formData.growthDuration)
      formDataToSend.append("waterRequirements", formData.waterRequirements)

      // Add temperature as JSON
      if (formData.idealTemperature.min || formData.idealTemperature.max) {
        formDataToSend.append(
          "idealTemperature",
          JSON.stringify({
            min: formData.idealTemperature.min ? Number(formData.idealTemperature.min) : undefined,
            max: formData.idealTemperature.max ? Number(formData.idealTemperature.max) : undefined,
          }),
        )
      }

      // Add arrays as JSON
      if (formData.plantingSeasons.length > 0) {
        formDataToSend.append("plantingSeasons", JSON.stringify(formData.plantingSeasons))
      }
      if (formData.soilRequirements.length > 0) {
        formDataToSend.append("soilRequirements", JSON.stringify(formData.soilRequirements))
      }
      if (formData.commonDiseases.length > 0) {
        formDataToSend.append("commonDiseases", JSON.stringify(formData.commonDiseases))
      }

      if (formData.nutritionalValue) formDataToSend.append("nutritionalValue", formData.nutritionalValue)

      // Add image if selected
      if (image) {
        formDataToSend.append("image", image)
      }

      const response = await fetch(`http://localhost:5000/api/crops/${cropId}`, {
        method: "PUT",
        body: formDataToSend,
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to update crop")
      }

      toast({
        title: "Success",
        description: "Crop updated successfully",
      })

      // Update local crop data
      setCrop(data.data.crop)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error && !crop) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/crops">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Edit Crop</h1>
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
            <CardTitle>Crop Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Crop Name *</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scientificName">Scientific Name</Label>
                <Input
                  id="scientificName"
                  name="scientificName"
                  value={formData.scientificName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="growthDuration">Growth Duration (days)</Label>
                <Input
                  id="growthDuration"
                  name="growthDuration"
                  type="number"
                  min="1"
                  value={formData.growthDuration}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="waterRequirements">Water Requirements</Label>
                <Select value={formData.waterRequirements} onValueChange={handleWaterRequirementsChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select water requirements" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ideal Temperature (°C)</Label>
                <div className="flex gap-2">
                  <Input
                    id="idealTemperature.min"
                    name="idealTemperature.min"
                    type="number"
                    placeholder="Min"
                    value={formData.idealTemperature.min}
                    onChange={handleChange}
                  />
                  <Input
                    id="idealTemperature.max"
                    name="idealTemperature.max"
                    type="number"
                    placeholder="Max"
                    value={formData.idealTemperature.max}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="plantingSeasons">Planting Seasons</Label>
                <Input
                  id="plantingSeasons"
                  placeholder="Spring, Summer, etc. (comma separated)"
                  value={formData.plantingSeasons.join(", ")}
                  onChange={(e) => handleArrayChange(e, "plantingSeasons")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="soilRequirements">Soil Requirements</Label>
                <Input
                  id="soilRequirements"
                  placeholder="Loamy, Clay, etc. (comma separated)"
                  value={formData.soilRequirements.join(", ")}
                  onChange={(e) => handleArrayChange(e, "soilRequirements")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="commonDiseases">Common Diseases</Label>
                <Input
                  id="commonDiseases"
                  placeholder="Leaf rust, Blight, etc. (comma separated)"
                  value={formData.commonDiseases.join(", ")}
                  onChange={(e) => handleArrayChange(e, "commonDiseases")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nutritionalValue">Nutritional Value</Label>
                <Input
                  id="nutritionalValue"
                  name="nutritionalValue"
                  value={formData.nutritionalValue}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Crop Image</Label>
              <Input id="image" type="file" accept="image/*" onChange={handleImageChange} />
              {imagePreview && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground mb-1">Current Image:</p>
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    alt="Preview"
                    className="h-40 object-contain border rounded-md"
                  />
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href={`/admin/crops/${cropId}`}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
