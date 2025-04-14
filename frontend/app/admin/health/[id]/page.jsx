"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import { ArrowLeft, Edit, Thermometer, Leaf, Map, Calendar, User } from "lucide-react"

export default function HealthAssessmentDetails({ params }) {
  // Unwrap the params Promise
  const unwrappedParams = use(params)
  const assessmentId = unwrappedParams.id

  const router = useRouter()
  const [assessment, setAssessment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/health/${assessmentId}`, {
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to fetch health assessment details")
        }

        const data = await response.json()
        setAssessment(data.data.assessment)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAssessment()
  }, [assessmentId])

  const handleDeleteAssessment = async () => {
    if (!confirm("Are you sure you want to delete this health assessment?")) {
      return
    }

    try {
      const response = await fetch(`http://localhost:5000/api/health/${assessmentId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to delete health assessment")
      }

      toast.success("Health assessment deleted successfully")
      router.push("/admin/health")
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

  if (!assessment) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Health assessment not found</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/health">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Health Assessment</h1>
            <p className="text-muted-foreground">
              {assessment.crop?.name || "Unknown Crop"} - {formatDate(assessment.date)}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button asChild>
            <Link href={`/admin/health/${assessmentId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Assessment
            </Link>
          </Button>
          <Button variant="destructive" onClick={handleDeleteAssessment}>
            Delete Assessment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <div
                className={`w-32 h-32 rounded-full flex items-center justify-center mb-4 ${
                  assessment.status === "healthy"
                    ? "bg-green-100"
                    : assessment.status === "mild"
                      ? "bg-yellow-100"
                      : assessment.status === "moderate"
                        ? "bg-orange-100"
                        : "bg-red-100"
                }`}
              >
                <Thermometer
                  className={`h-16 w-16 ${
                    assessment.status === "healthy"
                      ? "text-green-600"
                      : assessment.status === "mild"
                        ? "text-yellow-600"
                        : assessment.status === "moderate"
                          ? "text-orange-600"
                          : "text-red-600"
                  }`}
                />
              </div>
              <h2 className="text-2xl font-bold capitalize">{assessment.status}</h2>
              <p className="text-muted-foreground mt-2">{assessment.condition || "No specific condition noted"}</p>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Leaf className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Crop</h3>
                    <p className="text-muted-foreground mt-1">{assessment.crop?.name || "Unknown Crop"}</p>
                    {assessment.crop?.scientificName && (
                      <p className="text-xs text-muted-foreground">{assessment.crop.scientificName}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Map className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Land Plot</h3>
                    <p className="text-muted-foreground mt-1">{assessment.landPlot?.name || "Not specified"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Assessment Date</h3>
                    <p className="text-muted-foreground mt-1">{formatDate(assessment.date)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <User className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Assessed By</h3>
                    <p className="text-muted-foreground mt-1">{assessment.assessedBy?.name || "System"}</p>
                  </div>
                </div>
              </div>

              {assessment.symptoms && assessment.symptoms.length > 0 && (
                <div>
                  <h3 className="font-medium">Symptoms</h3>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    {assessment.symptoms.map((symptom, index) => (
                      <li key={index} className="text-muted-foreground">
                        {symptom}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {assessment.diagnosis && (
                <div>
                  <h3 className="font-medium">Diagnosis</h3>
                  <p className="text-muted-foreground mt-1">{assessment.diagnosis}</p>
                </div>
              )}

              {assessment.treatmentRecommendations && (
                <div>
                  <h3 className="font-medium">Treatment Recommendations</h3>
                  <p className="text-muted-foreground mt-1">{assessment.treatmentRecommendations}</p>
                </div>
              )}

              {assessment.notes && (
                <div>
                  <h3 className="font-medium">Notes</h3>
                  <p className="text-muted-foreground mt-1">{assessment.notes}</p>
                </div>
              )}

              {assessment.images && assessment.images.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Assessment Images</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {assessment.images.map((image, index) => (
                      <img
                        key={index}
                        src={`http://localhost:5000${image}`}
                        alt={`Assessment image ${index + 1}`}
                        className="rounded-md border object-cover aspect-square"
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
