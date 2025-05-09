import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Map, Ruler, Droplet } from "lucide-react"

export default function LandCard({ land }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "planted":
        return "bg-green-500"
      case "fallow":
        return "bg-amber-500"
      case "available":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative w-full h-48">
        <img
          src={land.imageUrl || "/placeholder.svg?height=200&width=300"}
          alt={land.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2">
          <Badge className={getStatusColor(land.status)}>
            {land.status.charAt(0).toUpperCase() + land.status.slice(1)}
          </Badge>
        </div>
      </div>
      <CardHeader className="pb-2">
        <h3 className="font-bold text-lg">{land.name}</h3>
        <p className="text-sm text-gray-600">{land.location}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-500">
            <Ruler className="h-4 w-4 mr-2" />
            <span>
              Size: {land.size.value} {land.size.unit}
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Droplet className="h-4 w-4 mr-2" />
            <span>Soil: {land.soilType}</span>
          </div>
          {land.currentCrop && (
            <div className="flex items-center text-sm text-gray-500">
              <Map className="h-4 w-4 mr-2" />
              <span>Current Crop: {land.currentCrop.name}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/dashboard/lands/${land._id}`}>
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
