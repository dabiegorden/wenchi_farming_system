"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

export default function CropsPage() {
  const [crops, setCrops] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchCrops = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/crops", {
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to fetch crops")
        }

        const data = await response.json()

        console.log("Crops data:", data)
        setCrops(data.data.crops)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching crops:", err)
        setError(err.message)
        setLoading(false)
      }
    }

    fetchCrops()
  }, [])

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
      <h1 className="text-3xl font-bold mb-8">Available Crops</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {crops.map((crop) => (
          <Link href={`/dashboard/crops/${crop._id}`} key={crop._id}>
            <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-lg cursor-pointer h-full">
              <div className="relative h-48 w-full">
                {crop.imageUrl ? (
                  <div className="relative h-full w-full bg-gray-100">
                    <img
                      src={`http://localhost:5000${crop.imageUrl}`}
                      alt={crop.name}
                      className="object-cover h-full w-full"
                    />
                  </div>
                ) : (
                  <div className="bg-gray-200 h-full w-full flex items-center justify-center">
                    <span className="text-gray-400">No image available</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">{crop.name}</h2>
                <p className="text-sm text-gray-600 italic mb-2">{crop.scientificName}</p>
                <p className="text-gray-700 mb-3 line-clamp-2">{crop.description}</p>
                <div className="flex justify-between items-center">
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {crop.waterRequirements || "N/A"} water
                  </span>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {crop.growthDuration || "N/A"} days
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {crops.length === 0 && <div className="text-center text-gray-500 mt-10">No crops available at the moment.</div>}
    </div>
  )
}
