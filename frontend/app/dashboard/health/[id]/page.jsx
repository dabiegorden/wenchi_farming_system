"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { use } from "react"

export default function HealthAssessmentDetailsPage({ params }) {
  // Unwrap the params Promise using React.use()
  const resolvedParams = use(params)
  const assessmentId = resolvedParams.id

  const [assessment, setAssessment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const fetchHealthAssessmentDetails = async () => {
      if (!assessmentId) return

      try {
        console.log(`Fetching health assessment with ID: ${assessmentId}`)
        const response = await fetch(`http://localhost:5000/api/health/${assessmentId}`, {
          credentials: "include",
        })

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Health assessment not found")
          }
          throw new Error("Failed to fetch health assessment details")
        }

        const data = await response.json()
        console.log("Health assessment data:", data)
        setAssessment(data.data.assessment)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching health assessment details:", err)
        setError(err.message)
        setLoading(false)
      }
    }

    fetchHealthAssessmentDetails()
  }, [assessmentId])

  // Function to get status badge color
  const getStatusColor = (status) => {
    const colors = {
      healthy: "bg-green-100 text-green-800",
      mild: "bg-yellow-100 text-yellow-800",
      moderate: "bg-orange-100 text-orange-800",
      severe: "bg-red-100 text-red-800",
      unknown: "bg-gray-100 text-gray-800",
    }
    return colors[status] || colors.unknown
  }

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return "Not specified"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col">
        <div className="text-red-500 text-xl mb-4">Error: {error}</div>
        <button
          onClick={() => router.push("/dashboard/health")}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors"
        >
          Back to Health Assessments
        </button>
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-xl">Health assessment not found</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/dashboard/health">
        <button className="flex items-center mb-6 text-green-600 hover:text-green-800">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Health Assessments
        </button>
      </Link>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/3">
            <div className="relative h-64 md:h-full">
              {assessment.imageUrl ? (
                <div className="relative h-full w-full bg-gray-100">
                  <img
                    src={`http://localhost:5000${assessment.imageUrl}`}
                    alt="Health assessment"
                    className="object-cover h-full w-full"
                  />
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(assessment.status)}`}>
                      {assessment.status}
                    </span>
                  </div>
                </div>
              ) : assessment.cropId && assessment.cropId.imageUrl ? (
                <div className="relative h-full w-full bg-gray-100">
                  <img
                    src={`http://localhost:5000${assessment.cropId.imageUrl}`}
                    alt={assessment.cropId.name}
                    className="object-cover h-full w-full opacity-70"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="px-3 py-1 bg-white/80 rounded-full text-sm font-medium">Symptom Assessment</span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(assessment.status)}`}>
                      {assessment.status}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-200 h-64 md:h-full w-full flex items-center justify-center">
                  <span className="text-gray-400">No image available</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 md:w-2/3">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-3xl font-bold">
                {assessment.assessmentType === "image" ? "Image Assessment" : "Symptom Assessment"}
              </h1>
              <div className="text-sm text-gray-500">
                <p>Created: {formatDate(assessment.createdAt)}</p>
                <p>By: {assessment.createdBy?.name || "Unknown"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Crop Information</h2>
                {assessment.cropId ? (
                  <div>
                    <p className="mb-1">
                      <span className="font-medium">Name:</span>{" "}
                      <Link
                        href={`/dashboard/crops/${assessment.cropId._id}`}
                        className="text-green-600 hover:underline"
                      >
                        {assessment.cropId.name}
                      </Link>
                    </p>
                    {assessment.cropId.scientificName && (
                      <p className="mb-1">
                        <span className="font-medium">Scientific Name:</span> {assessment.cropId.scientificName}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">Crop information not available</p>
                )}

                {assessment.landId && (
                  <div className="mt-4">
                    <h2 className="text-xl font-semibold mb-2">Land Information</h2>
                    <p className="mb-1">
                      <span className="font-medium">Name:</span>{" "}
                      <Link
                        href={`/dashboard/lands/${assessment.landId._id}`}
                        className="text-green-600 hover:underline"
                      >
                        {assessment.landId.name}
                      </Link>
                    </p>
                    {assessment.landId.location && (
                      <p className="mb-1">
                        <span className="font-medium">Location:</span> {assessment.landId.location}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-2">Assessment Details</h2>
                <p className="mb-1">
                  <span className="font-medium">Type:</span> {assessment.assessmentType}
                </p>
                <p className="mb-1">
                  <span className="font-medium">Status:</span>{" "}
                  <span className={`px-2 py-0.5 rounded ${getStatusColor(assessment.status)}`}>
                    {assessment.status}
                  </span>
                </p>
                {assessment.symptoms && assessment.symptoms.length > 0 && (
                  <div className="mb-3 mt-2">
                    <p className="font-medium mb-1">Symptoms:</p>
                    <div className="flex flex-wrap gap-1">
                      {assessment.symptoms.map((symptom, index) => (
                        <span key={index} className="bg-gray-100 text-gray-800 text-sm px-2 py-1 rounded">
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {assessment.notes && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Notes</h2>
                <p className="text-gray-700 whitespace-pre-line">{assessment.notes}</p>
              </div>
            )}

            {assessment.aiAnalysis && (
              <div className="mb-6">
                {/* <h2 className="text-xl font-semibold mb-2">AI Analysis</h2> */}
                {assessment.aiAnalysis.disease && (
                  <div className="mb-3">
                    <p className="font-medium">Diagnosis:</p>
                    <p className="text-gray-700">{assessment.aiAnalysis.disease}</p>
                  </div>
                )}
                {assessment.aiAnalysis.description && (
                  <div className="mb-3">
                    <p className="font-medium">Description:</p>
                    <p className="text-gray-700 whitespace-pre-line">{assessment.aiAnalysis.description}</p>
                  </div>
                )}
                {assessment.aiAnalysis.recommendations && assessment.aiAnalysis.recommendations.length > 0 && (
                  <div className="mb-3">
                    <p className="font-medium">Recommendations:</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      {assessment.aiAnalysis.recommendations.map((rec, index) => (
                        <li key={index} className="text-gray-700">
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {assessment.aiAnalysis.confidence && (
                  <div className="mb-3">
                    <p className="font-medium">Confidence Level:</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                      <div
                        className="bg-green-600 h-2.5 rounded-full"
                        style={{ width: `${assessment.aiAnalysis.confidence * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {(assessment.aiAnalysis.confidence * 100).toFixed(0)}% confidence
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
