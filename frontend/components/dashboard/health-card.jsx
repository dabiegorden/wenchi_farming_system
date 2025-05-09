import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Leaf, Calendar } from "lucide-react"

export default function HealthCard({ assessment }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "healthy":
        return "bg-green-500"
      case "mild":
        return "bg-yellow-500"
      case "moderate":
        return "bg-orange-500"
      case "severe":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-lg">{assessment.crop?.name || "Unknown Crop"}</h3>
          <Badge className={getStatusColor(assessment.status)}>
            {assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-500">
            <Leaf className="h-4 w-4 mr-2" />
            <span>Type: {assessment.assessmentType}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Date: {formatDate(assessment.createdAt)}</span>
          </div>

          {assessment.symptoms && assessment.symptoms.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">Symptoms:</p>
              <div className="flex flex-wrap gap-1">
                {assessment.symptoms.map((symptom, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {symptom}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {assessment.notes && <p className="text-sm text-gray-600 line-clamp-2">{assessment.notes}</p>}
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/dashboard/health/${assessment._id}`}>
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
