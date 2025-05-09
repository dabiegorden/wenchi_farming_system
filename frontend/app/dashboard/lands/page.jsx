"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

export default function LandsPage() {
  const [lands, setLands] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchLands = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/land", {
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to fetch lands")
        }

        const data = await response.json()

        console.log("Lands data:", data)
        setLands(data.data.lands)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching lands:", err)
        setError(err.message)
        setLoading(false)
      }
    }

    fetchLands()
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
      <h1 className="text-3xl font-bold mb-8">Available Lands</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {lands.map((land) => (
          <Link href={`/dashboard/lands/${land._id}`} key={land._id}>
            <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-lg cursor-pointer h-full">
              <div className="relative h-48 w-full">
                {land.imageUrl ? (
                  <div className="relative h-full w-full bg-gray-100">
                    <img
                      src={`http://localhost:5000${land.imageUrl}`}
                      alt={land.name}
                      className="object-cover h-full w-full"
                    />
                  </div>
                ) : (
                  <div className="bg-gray-200 h-full w-full flex items-center justify-center">
                    <span className="text-gray-400">No image available</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-xs font-medium">
                  {land.status || "N/A"}
                </div>
              </div>
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">{land.name}</h2>
                <p className="text-sm text-gray-600 italic mb-2">{land.location}</p>

                <div className="flex flex-col gap-2 mb-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Size:</span>
                    <span className="font-medium">
                      {land.size.value} {land.size.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Soil Type:</span>
                    <span className="font-medium">{land.soilType || "N/A"}</span>
                  </div>
                  {land.currentCrop && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Crop:</span>
                      <span className="font-medium">{land.currentCrop.name}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {land.soilPh ? `pH ${land.soilPh}` : "pH N/A"}
                  </span>
                  {land.soilMoisture && (
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      {land.soilMoisture.value}% moisture
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {lands.length === 0 && <div className="text-center text-gray-500 mt-10">No lands available at the moment.</div>}
    </div>
  )
}
