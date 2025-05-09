import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, BarChart, PieChart, LineChart, Leaf, Warehouse, Tractor } from "lucide-react"
import Link from "next/link"

export default function ReportCard({ report }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getIcon = () => {
    switch (report.type) {
      case "health":
        return <Leaf className="h-5 w-5 text-green-600" />
      case "inventory":
        return <Warehouse className="h-5 w-5 text-purple-600" />
      case "land":
        return <Tractor className="h-5 w-5 text-amber-600" />
      case "bar":
        return <BarChart className="h-5 w-5 text-blue-600" />
      case "pie":
        return <PieChart className="h-5 w-5 text-red-600" />
      case "line":
        return <LineChart className="h-5 w-5 text-indigo-600" />
      default:
        return <FileText className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4 flex items-start gap-3">
        <div className="bg-gray-100 p-2 rounded-full">{getIcon()}</div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <Link href={`/dashboard/reports/${report._id}`}>
              <h3 className="font-medium text-blue-600 hover:underline">{report.title}</h3>
            </Link>
            <Badge variant="outline" className="text-xs">
              {report.type}
            </Badge>
          </div>
          {report.dateRange && (
            <p className="text-xs text-gray-500 mt-1">
              {formatDate(report.dateRange.startDate)} - {formatDate(report.dateRange.endDate)}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">Created: {formatDate(report.createdAt)}</p>
        </div>
      </CardContent>
    </Card>
  )
}
