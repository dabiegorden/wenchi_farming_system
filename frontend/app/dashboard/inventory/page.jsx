"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

export default function InventoryPage() {
  const [inventoryItems, setInventoryItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchInventoryItems = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/inventory/items", {
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to fetch inventory items")
        }

        const data = await response.json()

        console.log("Inventory data:", data)
        setInventoryItems(data.data.items)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching inventory items:", err)
        setError(err.message)
        setLoading(false)
      }
    }

    fetchInventoryItems()
  }, [])

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
      <h1 className="text-3xl font-bold mb-8">Inventory Items</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {inventoryItems.map((item) => (
          <Link href={`/dashboard/inventory/${item._id}`} key={item._id}>
            <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-lg cursor-pointer h-full">
              <div className="relative h-48 w-full">
                {item.imageUrl ? (
                  <div className="relative h-full w-full bg-gray-100">
                    <img
                      src={`http://localhost:5000${item.imageUrl}`}
                      alt={item.name}
                      className="object-cover h-full w-full"
                    />
                  </div>
                ) : (
                  <div className="bg-gray-200 h-full w-full flex items-center justify-center">
                    <span className="text-gray-400">No image available</span>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                    {item.category}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">{item.name}</h2>
                <p className="text-sm text-gray-600 italic mb-2 line-clamp-2">{item.description || "No description"}</p>

                <div className="flex flex-col gap-2 mb-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-medium">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unit Cost:</span>
                    <span className="font-medium">${item.unitCost || "0.00"}</span>
                  </div>
                  {item.supplier && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Supplier:</span>
                      <span className="font-medium truncate max-w-[150px]">{item.supplier}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-medium ${
                      item.quantity <= item.reorderLevel ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                    }`}
                  >
                    {item.quantity <= item.reorderLevel ? "Low Stock" : "In Stock"}
                  </span>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    Reorder: {item.reorderLevel}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {inventoryItems.length === 0 && (
        <div className="text-center text-gray-500 mt-10">No inventory items available at the moment.</div>
      )}
    </div>
  )
}
