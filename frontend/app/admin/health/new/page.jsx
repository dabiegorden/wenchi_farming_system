"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { ArrowLeft, Plus, X } from "lucide-react"

export default function NewHealthAssessment() {
  const router = useRouter()
  const [crops, setCrops] = useState([])
  const [lands, setLands] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("image")
  const [imagePreview, setImagePreview] = useState(null)
  const [formData, setFormData] = useState({
    cropId: "",
    landId: "",
    notes: "",
    symptoms: [],
    image: null,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch crops
        const cropsResponse = await fetch("http://localhost:5000/api/crops", {
          credentials: "include",
        })

        if (!cropsResponse.ok) {
          throw new Error("Failed to fetch crops")
        }

        const cropsData = await cropsResponse.json()
        setCrops(cropsData.data.crops || [])

        // Fetch lands
        const landsResponse = await fetch("http://localhost:5000/api/land", {
          credentials: "include",
        })

        if (!landsResponse.ok) {
          throw new Error("Failed to fetch lands")
        }

        const landsData = await landsResponse.json()
        setLands(landsData.data.lands || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }))
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSymptomAdd = () => {
    const symptomInput = document.getElementById("symptom-input")
    if (symptomInput.value.trim()) {
      setFormData((prev) => ({
        ...prev,
        symptoms: [...prev.symptoms, symptomInput.value.trim()],
      }))
      symptomInput.value = ""
    }
  }

  const handleSymptomRemove = (index) => {
    setFormData((prev) => ({
      ...prev,
      symptoms: prev.symptoms.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      if (!formData.cropId) {
        throw new Error("Please select a crop")
      }

      let response
      let endpoint = ""
      let requestData

      if (activeTab === "image") {
        if (!formData.image) {
          throw new Error("Please upload an image")
        }

        endpoint = "http://localhost:5000/api/health/image"

        // Create form data for file upload
        const formDataObj = new FormData()
        formDataObj.append("cropId", formData.cropId)
        if (formData.landId) formDataObj.append("landId", formData.landId)
        if (formData.notes) formDataObj.append("notes", formData.notes)
        formDataObj.append("image", formData.image)

        response = await fetch(endpoint, {
          method: "POST",
          body: formDataObj,
          credentials: "include",
        })
      } else {
        // Symptoms-based assessment
        if (formData.symptoms.length === 0) {
          throw new Error("Please add at least one symptom")
        }

        endpoint = "http://localhost:5000/api/health/symptoms"
        requestData = {
          cropId: formData.cropId,
          landId: formData.landId || undefined,
          symptoms: formData.symptoms,
          notes: formData.notes || undefined,
        }

        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
          credentials: "include",
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create health assessment")
      }

      const data = await response.json()
      toast.success("Health assessment created successfully")
      router.push(`/admin/health/${data.data.assessment._id}`)
    } catch (err) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/health">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New Health Assessment</h1>
          <p className="text-muted-foreground">Create a new crop health assessment</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assessment Information</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="cropId" className="block text-sm font-medium mb-1">
                    Crop <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.cropId}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, cropId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a crop" />
                    </SelectTrigger>
                    <SelectContent>
                      {crops.map((crop) => (
                        <SelectItem key={crop._id} value={crop._id}>
                          {crop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label htmlFor="landId" className="block text-sm font-medium mb-1">
                    Land Plot (Optional)
                  </label>
                  <Select
                    value={formData.landId}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, landId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a land plot" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {lands.map((land) => (
                        <SelectItem key={land._id} value={land._id}>
                          {land.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="image">Image-based Assessment</TabsTrigger>
                    <TabsTrigger value="symptoms">Symptoms-based Assessment</TabsTrigger>
                  </TabsList>
                  <TabsContent value="image" className="space-y-4 pt-4">
                    <div>
                      <label htmlFor="image" className="block text-sm font-medium mb-1">
                        Upload Image <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-4">
                        <Input
                          id="image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="flex-1"
                        />
                      </div>
                      {imagePreview && (
                        <div className="mt-4">
                          <img
                            src={imagePreview || "/placeholder.svg"}
                            alt="Preview"
                            className="max-h-64 rounded-md border object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="symptoms" className="space-y-4 pt-4">
                    <div>
                      <label htmlFor="symptoms" className="block text-sm font-medium mb-1">
                        Symptoms <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <Input id="symptom-input" placeholder="Enter a symptom" className="flex-1" />
                        <Button type="button" onClick={handleSymptomAdd} variant="secondary">
                          <Plus className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      </div>
                      {formData.symptoms.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {formData.symptoms.map((symptom, index) => (
                            <div
                              key={index}
                              className="bg-muted px-3 py-1 rounded-full text-sm flex items-center gap-1"
                            >
                              <span>{symptom}</span>
                              <button
                                type="button"
                                onClick={() => handleSymptomRemove(index)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium mb-1">
                    Notes (Optional)
                  </label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Add any additional notes about this health assessment"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" asChild>
                  <Link href="/admin/health">Cancel</Link>
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Assessment"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
