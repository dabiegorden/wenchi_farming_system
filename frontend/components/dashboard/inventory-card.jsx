import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"

export default function InventoryCard({ item }) {
  const isLowStock = item.quantity <= item.reorderLevel

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative w-full h-48">
        <img
          src={item.imageUrl || "/placeholder.svg?height=200&width=300"}
          alt={item.name}
          className="w-full h-full object-cover"
        />
        {isLowStock && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-red-500">Low Stock</Badge>
          </div>
        )}
      </div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-lg">{item.name}</h3>
          <Badge variant="outline">{item.category}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{item.description}</p>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Quantity:</span>
            <span className={`text-sm ${isLowStock ? "text-red-500 font-medium" : ""}`}>
              {item.quantity} {item.unit}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Reorder Level:</span>
            <span className="text-sm">
              {item.reorderLevel} {item.unit}
            </span>
          </div>
          {isLowStock && (
            <div className="flex items-center text-red-500 text-sm mt-2">
              <AlertTriangle className="h-4 w-4 mr-1" />
              <span>Low stock alert</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/dashboard/inventory/${item._id}`}>
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
