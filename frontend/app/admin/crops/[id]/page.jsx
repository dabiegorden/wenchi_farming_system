"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Edit, Droplets, Thermometer, Calendar, Leaf } from "lucide-react"

export default function CropDetails({ params }) {
  // Unwrap the params Promise in Next.js 15
  const unwrappedParams = use(params)
  const cropId = unwrappedParams.id

  const router = useRouter()
  const [crop, setCrop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchCrop = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/crops/${cropId}`, {
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to fetch crop details")
        }

        const data = await response.json()
        setCrop(data.data.crop)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchCrop()
  }, [cropId])

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

  if (!crop) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Crop not found</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/crops">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{crop.name}</h1>
            <p className="text-muted-foreground">{crop.scientificName || "No scientific name provided"}</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/admin/crops/${cropId}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Crop
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Crop Image</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              {crop.imageUrl ? (
                <img
                  src={`http://localhost:5000${crop.imageUrl}`}
                  alt={crop.name}
                  className="max-h-64 object-contain rounded-md"
                />
              ) : (
                <div className="h-64 w-full bg-green-100 flex items-center justify-center rounded-md">
                  <Leaf className="h-16 w-16 text-green-600" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="growing">Growing Conditions</TabsTrigger>
              <TabsTrigger value="health">Health & Diseases</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium">Description</h3>
                    <p className="text-muted-foreground mt-1">{crop.description || "No description provided"}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium">Growth Duration</h3>
                      <p className="text-muted-foreground mt-1">
                        {crop.growthDuration ? `${crop.growthDuration} days` : "Not specified"}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium">Nutritional Value</h3>
                      <p className="text-muted-foreground mt-1">{crop.nutritionalValue || "Not specified"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="growing" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Growing Conditions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-start gap-2">
                      <Droplets className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium">Water Requirements</h3>
                        <p className="text-muted-foreground mt-1 capitalize">
                          {crop.waterRequirements || "Not specified"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Thermometer className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium">Ideal Temperature</h3>
                        <p className="text-muted-foreground mt-1">
                          {crop.idealTemperature?.min && crop.idealTemperature?.max
                            ? `${crop.idealTemperature.min}°C - ${crop.idealTemperature.max}°C`
                            : crop.idealTemperature?.min
                              ? `Min: ${crop.idealTemperature.min}°C`
                              : crop.idealTemperature?.max
                                ? `Max: ${crop.idealTemperature.max}°C`
                                : "Not specified"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium">Planting Seasons</h3>
                        <p className="text-muted-foreground mt-1">
                          {crop.plantingSeasons && crop.plantingSeasons.length > 0
                            ? crop.plantingSeasons.join(", ")
                            : "Not specified"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium">Soil Requirements</h3>
                    <p className="text-muted-foreground mt-1">
                      {crop.soilRequirements && crop.soilRequirements.length > 0
                        ? crop.soilRequirements.join(", ")
                        : "Not specified"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="health" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Health & Diseases</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <h3 className="font-medium">Common Diseases</h3>
                    {crop.commonDiseases && crop.commonDiseases.length > 0 ? (
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        {crop.commonDiseases.map((disease, index) => (
                          <li key={index} className="text-muted-foreground">
                            {disease}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground mt-1">No common diseases specified</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
