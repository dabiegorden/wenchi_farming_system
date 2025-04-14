"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import { ArrowLeft, Edit, Trash, MapPin, Ruler, Calendar, SproutIcon as Seedling, Info } from "lucide-react"

export default function LandDetails({ params }) {
  // Unwrap the params Promise in Next.js 15
  const unwrappedParams = use(params)
  const landId = unwrappedParams.id

  const router = useRouter()
  const [land, setLand] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchLandDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/land/${landId}`, {
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to fetch land details")
        }

        const data = await response.json()
        setLand(data.data.land)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchLandDetails()
  }, [landId])

  const handleDeleteLand = async () => {
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

      router.push("/admin/land")
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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

  if (!land) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Land plot not found</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/land">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{land.name}</h1>
          <span
            className={`ml-4 px-2 py-1 rounded-full text-xs font-medium ${
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
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/land/${landId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button variant="destructive" onClick={handleDeleteLand}>
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {land.imageUrl && (
        <div className="w-full overflow-hidden rounded-lg border">
          <div className="relative h-64 w-full">
            <Image
              src={`http://localhost:5000${land.imageUrl}`}
              alt={land.name}
              fill
              className="object-cover"
              onError={(e) => {
                e.target.src = "/placeholder.svg?height=400&width=800"
                e.target.style.objectFit = "contain"
              }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="h-5 w-5 mr-2" />
              Land Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-start space-x-2">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-muted-foreground">{land.location || "Not specified"}</p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Ruler className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Size</p>
                  <p className="text-muted-foreground">
                    {typeof land.size === "object" ? `${land.size.value} ${land.size.unit}` : `${land.size} hectares`}
                  </p>
                </div>
              </div>

              {land.soilType && (
                <div className="flex items-start space-x-2">
                  <div className="h-5 w-5 text-muted-foreground mt-0.5 flex items-center justify-center">
                    <span className="text-sm">🌱</span>
                  </div>
                  <div>
                    <p className="font-medium">Soil Type</p>
                    <p className="text-muted-foreground">{land.soilType}</p>
                  </div>
                </div>
              )}

              {land.soilPh && (
                <div className="flex items-start space-x-2">
                  <div className="h-5 w-5 text-muted-foreground mt-0.5 flex items-center justify-center">
                    <span className="text-sm">🧪</span>
                  </div>
                  <div>
                    <p className="font-medium">Soil pH</p>
                    <p className="text-muted-foreground">{land.soilPh}</p>
                  </div>
                </div>
              )}

              {land.soilMoisture && (
                <div className="flex items-start space-x-2">
                  <div className="h-5 w-5 text-muted-foreground mt-0.5 flex items-center justify-center">
                    <span className="text-sm">💧</span>
                  </div>
                  <div>
                    <p className="font-medium">Soil Moisture</p>
                    <p className="text-muted-foreground">{land.soilMoisture.value}%</p>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-2">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Last Updated</p>
                  <p className="text-muted-foreground">
                    {new Date(land.updatedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Seedling className="h-5 w-5 mr-2" />
              Crop Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {land.currentCrop ? (
              <div className="space-y-4">
                <div>
                  <p className="font-medium">Current Crop</p>
                  <p className="text-muted-foreground">{land.currentCrop.name}</p>
                </div>

                {land.plantingDate && (
                  <div>
                    <p className="font-medium">Planting Date</p>
                    <p className="text-muted-foreground">
                      {new Date(land.plantingDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}

                {land.expectedHarvestDate && (
                  <div>
                    <p className="font-medium">Expected Harvest Date</p>
                    <p className="text-muted-foreground">
                      {new Date(land.expectedHarvestDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No crop currently planted on this land.</p>
            )}
          </CardContent>
        </Card>

        {land.notes && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-line">{land.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
