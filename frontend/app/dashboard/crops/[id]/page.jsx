"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { use } from "react"

export default function CropDetailsPage({ params }) {
  // Unwrap the params Promise using React.use()
  const resolvedParams = use(params)
  const cropId = resolvedParams.id

  const [crop, setCrop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const fetchCropDetails = async () => {
      if (!cropId) return

      try {
        console.log(`Fetching crop with ID: ${cropId}`)
        const response = await fetch(`http://localhost:5000/api/crops/${cropId}`, {
          credentials: "include",
        })

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Crop not found")
          }
          throw new Error("Failed to fetch crop details")
        }

        const data = await response.json()
        console.log("Crop data:", data)
        setCrop(data.data.crop)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching crop details:", err)
        setError(err.message)
        setLoading(false)
      }
    }

    fetchCropDetails()
  }, [cropId])

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
          onClick={() => router.push("/dashboard/crops")}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors"
        >
          Back to Crops
        </button>
      </div>
    )
  }

  if (!crop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-xl">Crop not found</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/dashboard/crops">
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
          Back to All Crops
        </button>
      </Link>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/3">
            <div className="relative h-64 md:h-full">
              {crop.imageUrl ? (
                <div className="relative h-full w-full bg-gray-100">
                  <img
                    src={`http://localhost:5000${crop.imageUrl}`}
                    alt={crop.name}
                    className="object-cover h-full w-full"
                  />
                </div>
              ) : (
                <div className="bg-gray-200 h-64 md:h-full w-full flex items-center justify-center">
                  <span className="text-gray-400">No image available</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 md:w-2/3">
            <h1 className="text-3xl font-bold mb-2">{crop.name}</h1>
            <p className="text-gray-600 italic mb-4">{crop.scientificName}</p>

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-gray-700">{crop.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Growing Information</h2>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="font-medium mr-2">Growth Duration:</span>
                    <span>{crop.growthDuration ? `${crop.growthDuration} days` : "Not specified"}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-2">Water Requirements:</span>
                    <span>{crop.waterRequirements || "Not specified"}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-2">Ideal Temperature:</span>
                    <span>
                      {crop.idealTemperature
                        ? `${crop.idealTemperature.min}°C - ${crop.idealTemperature.max}°C`
                        : "Not specified"}
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-2">Additional Information</h2>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="font-medium mr-2">Planting Seasons:</span>
                    <span>
                      {crop.plantingSeasons && crop.plantingSeasons.length > 0
                        ? crop.plantingSeasons.join(", ")
                        : "Not specified"}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-2">Soil Requirements:</span>
                    <span>
                      {crop.soilRequirements && crop.soilRequirements.length > 0
                        ? crop.soilRequirements.join(", ")
                        : "Not specified"}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-2">Common Diseases:</span>
                    <span>
                      {crop.commonDiseases && crop.commonDiseases.length > 0
                        ? crop.commonDiseases.join(", ")
                        : "Not specified"}
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {crop.nutritionalValue && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-2">Nutritional Value</h2>
                <p className="text-gray-700">{crop.nutritionalValue}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
