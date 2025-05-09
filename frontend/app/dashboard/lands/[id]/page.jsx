"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { use } from "react"

export default function LandDetailsPage({ params }) {
  // Unwrap the params Promise using React.use()
  const resolvedParams = use(params)
  const landId = resolvedParams.id

  const [land, setLand] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const fetchLandDetails = async () => {
      if (!landId) return

      try {
        console.log(`Fetching land with ID: ${landId}`)
        const response = await fetch(`http://localhost:5000/api/land/${landId}`, {
          credentials: "include",
        })

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Land not found")
          }
          throw new Error("Failed to fetch land details")
        }

        const data = await response.json()
        console.log("Land data:", data)
        setLand(data.data.land)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching land details:", err)
        setError(err.message)
        setLoading(false)
      }
    }

    fetchLandDetails()
  }, [landId])

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return "Not specified"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
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
      <div className="min-h-screen flex items-center justify-center flex-col">
        <div className="text-red-500 text-xl mb-4">Error: {error}</div>
        <button
          onClick={() => router.push("/dashboard/lands")}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors"
        >
          Back to Lands
        </button>
      </div>
    )
  }

  if (!land) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-xl">Land not found</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/dashboard/lands">
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
          Back to All Lands
        </button>
      </Link>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/3">
            <div className="relative h-64 md:h-full">
              {land.imageUrl ? (
                <div className="relative h-full w-full bg-gray-100">
                  <img
                    src={`http://localhost:5000${land.imageUrl}`}
                    alt={land.name}
                    className="object-cover h-full w-full"
                  />
                  <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-medium">
                    {land.status || "N/A"}
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
            <h1 className="text-3xl font-bold mb-2">{land.name}</h1>
            <p className="text-gray-600 italic mb-4">{land.location}</p>

            {land.notes && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Notes</h2>
                <p className="text-gray-700">{land.notes}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Land Information</h2>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="font-medium mr-2">Size:</span>
                    <span>{land.size ? `${land.size.value} ${land.size.unit}` : "Not specified"}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-2">Soil Type:</span>
                    <span>{land.soilType || "Not specified"}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-2">Soil pH:</span>
                    <span>{land.soilPh || "Not specified"}</span>
                  </li>
                  {land.soilMoisture && (
                    <li className="flex items-start">
                      <span className="font-medium mr-2">Soil Moisture:</span>
                      <span>
                        {land.soilMoisture.value}% (Last updated: {formatDate(land.soilMoisture.lastUpdated)})
                      </span>
                    </li>
                  )}
                  {land.coordinates && (
                    <li className="flex items-start">
                      <span className="font-medium mr-2">Coordinates:</span>
                      <span>
                        {land.coordinates.latitude}, {land.coordinates.longitude}
                      </span>
                    </li>
                  )}
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-2">Crop Information</h2>
                {land.currentCrop ? (
                  <div>
                    <div className="flex items-center mb-3">
                      <span className="font-medium mr-2">Current Crop:</span>
                      <Link
                        href={`/dashboard/crops/${land.currentCrop._id}`}
                        className="text-green-600 hover:underline"
                      >
                        {land.currentCrop.name}
                      </Link>
                    </div>

                    {land.currentCrop.imageUrl && (
                      <div className="mb-3 h-24 w-24 rounded overflow-hidden">
                        <img
                          src={`http://localhost:5000${land.currentCrop.imageUrl}`}
                          alt={land.currentCrop.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}

                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <span className="font-medium mr-2">Planting Date:</span>
                        <span>{formatDate(land.plantingDate)}</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-medium mr-2">Expected Harvest:</span>
                        <span>{formatDate(land.expectedHarvestDate)}</span>
                      </li>
                    </ul>
                  </div>
                ) : (
                  <p className="text-gray-500">No crop currently planted on this land.</p>
                )}
              </div>
            </div>

            {land.seasonalRecommendations && land.seasonalRecommendations.length > 0 && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-2">Seasonal Recommendations</h2>
                {land.seasonalRecommendations.map((season, index) => (
                  <div key={index} className="mb-4">
                    <h3 className="font-medium text-lg capitalize">{season.season} Season</h3>
                    {season.crops && season.crops.length > 0 ? (
                      <ul className="mt-2 space-y-2">
                        {season.crops.map((crop, cropIndex) => (
                          <li key={cropIndex} className="flex items-start">
                            {crop.cropId ? (
                              <Link
                                href={`/dashboard/crops/${crop.cropId._id}`}
                                className="text-green-600 hover:underline mr-2"
                              >
                                {crop.cropId.name}
                              </Link>
                            ) : (
                              <span className="mr-2">Unknown crop</span>
                            )}
                            <span className="text-sm text-gray-600">(Suitability: {crop.suitabilityScore}/10)</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 mt-1">No recommendations available.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
