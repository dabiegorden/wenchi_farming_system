import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, User, Leaf, Map, Package } from "lucide-react"

export default function ActivityCard({ activity }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getIcon = () => {
    switch (activity.entityType) {
      case "user":
        return <User className="h-5 w-5 text-blue-500" />
      case "crop":
        return <Leaf className="h-5 w-5 text-green-500" />
      case "land":
        return <Map className="h-5 w-5 text-amber-500" />
      case "inventory":
        return <Package className="h-5 w-5 text-purple-500" />
      default:
        return <Activity className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4 flex items-start gap-3">
        <div className="bg-gray-100 p-2 rounded-full">{getIcon()}</div>
        <div className="flex-1">
          <p className="text-sm">{activity.description}</p>
          <div className="flex justify-between items-center mt-1">
            <Badge variant="outline" className="text-xs">
              {activity.entityType}
            </Badge>
            <span className="text-xs text-gray-500">{formatDate(activity.createdAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
