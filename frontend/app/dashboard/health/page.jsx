"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

export default function HealthAssessmentsPage() {
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchHealthAssessments = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/health", {
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to fetch health assessments")
        }

        const data = await response.json()

        console.log("Health assessments data:", data)
        setAssessments(data.data.assessments)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching health assessments:", err)
        setError(err.message)
        setLoading(false)
      }
    }

    fetchHealthAssessments()
  }, [])

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
      month: "short",
      day: "numeric",
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-xl">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Health Assessments</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {assessments.map((assessment) => (
          <Link href={`/dashboard/health/${assessment._id}`} key={assessment._id}>
            <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-lg cursor-pointer h-full">
              <div className="relative h-48 w-full">
                {assessment.imageUrl ? (
                  <div className="relative h-full w-full bg-gray-100">
                    <img
                      src={`http://localhost:5000${assessment.imageUrl}`}
                      alt="Health assessment"
                      className="object-cover h-full w-full"
                    />
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
                  </div>
                ) : (
                  <div className="bg-gray-200 h-full w-full flex items-center justify-center">
                    <span className="text-gray-400">No image available</span>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assessment.status)}`}>
                    {assessment.status}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold">
                    {assessment.cropId ? assessment.cropId.name : "Unknown Crop"}
                  </h2>
                  <span className="text-xs text-gray-500">{formatDate(assessment.createdAt)}</span>
                </div>

                {assessment.landId && (
                  <p className="text-sm text-gray-600 italic mb-2">
                    Location: {assessment.landId.name || assessment.landId.location}
                  </p>
                )}

                {assessment.symptoms && assessment.symptoms.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700">Symptoms:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {assessment.symptoms.map((symptom, index) => (
                        <span key={index} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {assessment.aiAnalysis && assessment.aiAnalysis.disease && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700">Diagnosis:</p>
                    <p className="text-sm text-gray-800">{assessment.aiAnalysis.disease}</p>
                  </div>
                )}

                {assessment.notes && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 line-clamp-2">{assessment.notes}</p>
                  </div>
                )}

                <div className="mt-2 flex justify-end">
                  <span className="text-green-600 text-sm">View Details →</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {assessments.length === 0 && (
        <div className="text-center text-gray-500 mt-10">No health assessments available at the moment.</div>
      )}
    </div>
  )
}
