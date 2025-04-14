"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import { ArrowLeft, Trash, Bell, AlertTriangle, Info, User, Calendar } from "lucide-react"

export default function NotificationDetails({ params }) {
  // Unwrap the params Promise
  const unwrappedParams = use(params)
  const notificationId = unwrappedParams.id

  const router = useRouter()
  const [notification, setNotification] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchNotification = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}`, {
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to fetch notification details")
        }

        const data = await response.json()
        setNotification(data.data.notification)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchNotification()
  }, [notificationId])

  const handleDeleteNotification = async () => {
    if (!confirm("Are you sure you want to delete this notification?")) {
      return
    }

    try {
      const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to delete notification")
      }

      toast.success("Notification deleted successfully")
      router.push("/admin/notifications")
    } catch (err) {
      toast.error(err.message)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!notification) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Notification not found</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/notifications">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{notification.title}</h1>
            <p className="text-muted-foreground">{formatDate(notification.createdAt)}</p>
          </div>
        </div>
        <Button variant="destructive" onClick={handleDeleteNotification}>
          <Trash className="h-4 w-4 mr-2" />
          Delete Notification
        </Button>
      </div>

      <Card>
        <div
          className={`h-1 ${
            notification.type === "info"
              ? "bg-blue-500"
              : notification.type === "warning"
                ? "bg-amber-500"
                : "bg-red-500"
          }`}
        ></div>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-full ${
                notification.type === "info"
                  ? "bg-blue-100"
                  : notification.type === "warning"
                    ? "bg-amber-100"
                    : "bg-red-100"
              }`}
            >
              {notification.type === "info" ? (
                <Info
                  className={`h-5 w-5 ${
                    notification.type === "info"
                      ? "text-blue-600"
                      : notification.type === "warning"
                        ? "text-amber-600"
                        : "text-red-600"
                  }`}
                />
              ) : notification.type === "warning" ? (
                <AlertTriangle
                  className={`h-5 w-5 ${
                    notification.type === "info"
                      ? "text-blue-600"
                      : notification.type === "warning"
                        ? "text-amber-600"
                        : "text-red-600"
                  }`}
                />
              ) : (
                <Bell
                  className={`h-5 w-5 ${
                    notification.type === "info"
                      ? "text-blue-600"
                      : notification.type === "warning"
                        ? "text-amber-600"
                        : "text-red-600"
                  }`}
                />
              )}
            </div>
            <CardTitle>{notification.title}</CardTitle>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                notification.priority === "low"
                  ? "bg-gray-100 text-gray-800"
                  : notification.priority === "normal"
                    ? "bg-blue-100 text-blue-800"
                    : notification.priority === "high"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-red-100 text-red-800"
              }`}
            >
              {notification.priority}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-lg">{notification.message}</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium">Created At</h3>
                <p className="text-muted-foreground mt-1">{formatDate(notification.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <User className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h3 className="font-medium">Created By</h3>
                <p className="text-muted-foreground mt-1">{notification.createdBy?.name || "System"}</p>
              </div>
            </div>
          </div>

          {notification.targetUsers && notification.targetUsers.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Target Users</h3>
              <div className="flex flex-wrap gap-2">
                {notification.targetUsers.map((user) => (
                  <div key={user._id} className="bg-muted px-3 py-1 rounded-md text-sm">
                    {user.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {notification.readBy && notification.readBy.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Read By</h3>
              <div className="flex flex-wrap gap-2">
                {notification.readBy.map((user) => (
                  <div key={user._id} className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm">
                    {user.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
