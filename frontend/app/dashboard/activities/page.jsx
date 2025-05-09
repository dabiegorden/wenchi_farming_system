"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Loading from "@/components/loading"
import { Search, ArrowLeft } from "lucide-react"
import Link from "next/link"
import ActivityCard from "@/components/dashboard/activity-card"

export default function ActivitiesPage() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [entityTypeFilter, setEntityTypeFilter] = useState("all")
  const [actionFilter, setActionFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // Build query parameters
        const params = new URLSearchParams()
        if (entityTypeFilter !== "all") params.append("entityType", entityTypeFilter)
        if (actionFilter !== "all") params.append("action", actionFilter)
        if (searchTerm) params.append("search", searchTerm)

        // Date filter
        if (dateFilter === "today") {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          params.append("startDate", today.toISOString())
        } else if (dateFilter === "week") {
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          params.append("startDate", weekAgo.toISOString())
        } else if (dateFilter === "month") {
          const monthAgo = new Date()
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          params.append("startDate", monthAgo.toISOString())
        }

        const response = await fetch(`http://localhost:5000/api/activities?${params.toString()}`, {
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          setActivities(data.data.activities || [])
        }
      } catch (err) {
        console.error("Failed to fetch activities:", err)
        // Fallback mock data
        setActivities([
          {
            _id: "67fbb55c6c7c7c04b64a8904",
            action: "other",
            entityType: "user",
            entityId: "67fa92a245ba4b794ae2396a",
            description: "User signed in: Admin",
            performedBy: "67fa92a245ba4b794ae2396a",
            isPublic: false,
            createdAt: "2025-04-13T13:00:12.555+00:00",
          },
          {
            _id: "67fbb5ca6c7c7c04b64a8915",
            action: "other",
            entityType: "user",
            entityId: "67fa9e599c8147cde89ca1b6",
            description: "User signed in: DABIE GORDON",
            performedBy: "67fa9e599c8147cde89ca1b6",
            isPublic: false,
            createdAt: "2025-04-13T13:02:02.911+00:00",
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [searchTerm, entityTypeFilter, actionFilter, dateFilter])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" className="pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">Activity Log</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filter Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search activities..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="crop">Crop</SelectItem>
                <SelectItem value="land">Land</SelectItem>
                <SelectItem value="inventory">Inventory</SelectItem>
                <SelectItem value="health">Health</SelectItem>
              </SelectContent>
            </Select>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="list" className="w-full">
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-gray-500">Showing {activities.length} activities</p>
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="compact">Compact View</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list" className="mt-0">
          <div className="space-y-4">
            {activities.map((activity) => (
              <ActivityCard key={activity._id} activity={activity} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="compact" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Description</th>
                      <th className="text-left p-3 font-medium">Entity Type</th>
                      <th className="text-left p-3 font-medium">Action</th>
                      <th className="text-left p-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((activity) => (
                      <tr key={activity._id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{activity.description}</td>
                        <td className="p-3">
                          <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{activity.entityType}</span>
                        </td>
                        <td className="p-3">{activity.action}</td>
                        <td className="p-3 text-sm text-gray-500">{new Date(activity.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {activities.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No activities found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}
