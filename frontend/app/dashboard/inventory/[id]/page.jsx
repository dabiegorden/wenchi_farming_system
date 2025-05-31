"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { use } from "react"

export default function InventoryItemDetailsPage({ params }) {
  // Unwrap the params Promise using React.use()
  const resolvedParams = use(params)
  const itemId = resolvedParams.id

  const [item, setItem] = useState(null)
  const [usageHistory, setUsageHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const fetchInventoryItemDetails = async () => {
      if (!itemId) return

      try {
        console.log(`Fetching inventory item with ID: ${itemId}`)
        const response = await fetch(`http://localhost:5000/api/inventory/items/${itemId}`, {
          credentials: "include",
        })

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Inventory item not found")
          }
          throw new Error("Failed to fetch inventory item details")
        }

        const data = await response.json()
        console.log("Inventory item data:", data)
        setItem(data.data.item)
        setUsageHistory(data.data.usageHistory || [])
        setLoading(false)
      } catch (err) {
        console.error("Error fetching inventory item details:", err)
        setError(err.message)
        setLoading(false)
      }
    }

    fetchInventoryItemDetails()
  }, [itemId])

  // Function to get category badge color
  const getCategoryColor = (category) => {
    const colors = {
      fertilizer: "bg-green-100 text-green-800",
      pesticide: "bg-red-100 text-red-800",
      tool: "bg-blue-100 text-blue-800",
      seed: "bg-yellow-100 text-yellow-800",
      other: "bg-gray-100 text-gray-800",
    }
    return colors[category] || colors.other
  }

  // Function to get usage type badge color
  const getUsageTypeColor = (usageType) => {
    const colors = {
      used: "bg-blue-100 text-blue-800",
      damaged: "bg-red-100 text-red-800",
      expired: "bg-yellow-100 text-yellow-800",
      transferred: "bg-purple-100 text-purple-800",
      other: "bg-gray-100 text-gray-800",
    }
    return colors[usageType] || colors.other
  }

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
          onClick={() => router.push("/dashboard/inventory")}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors"
        >
          Back to Inventory
        </button>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-xl">Inventory item not found</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/dashboard/inventory">
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
          Back to Inventory
        </button>
      </Link>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/3">
            <div className="relative h-64 md:h-full">
              {item.imageUrl ? (
                <div className="relative h-full w-full bg-gray-100">
                  <img
                    src={`http://localhost:5000${item.imageUrl}`}
                    alt={item.name}
                    className="object-cover h-full w-full"
                  />
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(item.category)}`}>
                      {item.category}
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
            <div className="flex justify-between items-start">
              <h1 className="text-3xl font-bold mb-2">{item.name}</h1>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  item.quantity <= item.reorderLevel ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                }`}
              >
                {item.quantity <= item.reorderLevel ? "Low Stock" : "In Stock"}
              </span>
            </div>

            {item.description && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Description</h2>
                <p className="text-gray-700">{item.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Inventory Details</h2>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="font-medium mr-2">Quantity:</span>
                    <span>
                      {item.quantity} {item.unit}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-2">Reorder Level:</span>
                    <span>
                      {item.reorderLevel} {item.unit}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-2">Unit Cost:</span>
                    <span>₵{item.unitCost || "0.00"}</span>
                  </li>
                  {item.expiryDate && (
                    <li className="flex items-start">
                      <span className="font-medium mr-2">Expiry Date:</span>
                      <span>{formatDate(item.expiryDate)}</span>
                    </li>
                  )}
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-2">Supplier Information</h2>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="font-medium mr-2">Supplier:</span>
                    <span>{item.supplier || "Not specified"}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-2">Location:</span>
                    <span>{item.location || "Not specified"}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-2">Added By:</span>
                    <span>{item.createdBy?.name || "Unknown"}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-2">Added On:</span>
                    <span>{formatDate(item.createdAt)}</span>
                  </li>
                </ul>
              </div>
            </div>

            {item.notes && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-2">Notes</h2>
                <p className="text-gray-700">{item.notes}</p>
              </div>
            )}

            {usageHistory && usageHistory.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Recent Usage History</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Date
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Quantity
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Type
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Used For
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Recorded By
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {usageHistory.map((usage) => (
                        <tr key={usage._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(usage.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {usage.quantity} {item.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getUsageTypeColor(usage.usageType)}`}>
                              {usage.usageType}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {usage.landId ? (
                              <Link
                                href={`/dashboard/lands/${usage.landId._id}`}
                                className="text-green-600 hover:underline"
                              >
                                {usage.landId.name}
                              </Link>
                            ) : (
                              "N/A"
                            )}
                            {usage.cropId && (
                              <>
                                {" "}
                                (
                                <Link
                                  href={`/dashboard/crops/${usage.cropId._id}`}
                                  className="text-green-600 hover:underline"
                                >
                                  {usage.cropId.name}
                                </Link>
                                )
                              </>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {usage.recordedBy?.name || "Unknown"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
