"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"
import { ArrowLeft, Trash, Bell, AlertTriangle, Info, User, Calendar, Edit, LinkIcon, Tag } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import React from "react"

export default function NotificationDetails({ params }) {
  const notificationId = React.use(params).id

  const router = useRouter()
  const [notification, setNotification] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/auth/user-info", {
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          setCurrentUser(data.data.user)
        }
      } catch (err) {
        console.error("Failed to identify current user:", err)
      }
    }

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

    fetchCurrentUser()
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
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const isCreatedByCurrentUser = () => {
    return currentUser && notification && notification.createdBy && notification.createdBy._id === currentUser._id
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
        <div className="flex space-x-2">
          {isCreatedByCurrentUser() && (
            <Button variant="outline" asChild>
              <Link href={`/admin/notifications/${notificationId}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Notification
              </Link>
            </Button>
          )}
          <Button variant="destructive" onClick={handleDeleteNotification}>
            <Trash className="h-4 w-4 mr-2" />
            Delete Notification
          </Button>
        </div>
      </div>

      <Card>
        <div
          className={`h-1 ${
            notification.type === "info"
              ? "bg-blue-500"
              : notification.type === "warning"
                ? "bg-amber-500"
                : notification.type === "alert"
                  ? "bg-red-500"
                  : notification.type === "success"
                    ? "bg-green-500"
                    : "bg-purple-500"
          }`}
        ></div>
        <CardHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className={`p-2 rounded-full ${
                notification.type === "info"
                  ? "bg-blue-100"
                  : notification.type === "warning"
                    ? "bg-amber-100"
                    : notification.type === "alert"
                      ? "bg-red-100"
                      : notification.type === "success"
                        ? "bg-green-100"
                        : "bg-purple-100"
              }`}
            >
              {notification.type === "info" ? (
                <Info
                  className={`h-5 w-5 ${
                    notification.type === "info"
                      ? "text-blue-600"
                      : notification.type === "warning"
                        ? "text-amber-600"
                        : notification.type === "alert"
                          ? "text-red-600"
                          : notification.type === "success"
                            ? "text-green-600"
                            : "text-purple-600"
                  }`}
                />
              ) : notification.type === "warning" ? (
                <AlertTriangle
                  className={`h-5 w-5 ${
                    notification.type === "info"
                      ? "text-blue-600"
                      : notification.type === "warning"
                        ? "text-amber-600"
                        : notification.type === "alert"
                          ? "text-red-600"
                          : notification.type === "success"
                            ? "text-green-600"
                            : "text-purple-600"
                  }`}
                />
              ) : (
                <Bell
                  className={`h-5 w-5 ${
                    notification.type === "info"
                      ? "text-blue-600"
                      : notification.type === "warning"
                        ? "text-amber-600"
                        : notification.type === "alert"
                          ? "text-red-600"
                          : notification.type === "success"
                            ? "text-green-600"
                            : "text-purple-600"
                  }`}
                />
              )}
            </div>
            <CardTitle>{notification.title}</CardTitle>
            <Badge
              variant={
                notification.priority === "low"
                  ? "outline"
                  : notification.priority === "medium"
                    ? "secondary"
                    : "destructive"
              }
            >
              {notification.priority}
            </Badge>
            <Badge variant="outline">{notification.category}</Badge>
            {notification.isActionRequired && <Badge variant="default">Action Required</Badge>}
            {!notification.read && <Badge variant="secondary">Unread</Badge>}
            {isCreatedByCurrentUser() && (
              <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">
                Sent by me
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-lg">{notification.message}</div>

          {notification.tags && notification.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {notification.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

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

            {notification.expiresAt && (
              <div className="flex items-start gap-2">
                <Calendar className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-medium">Expires At</h3>
                  <p className="text-muted-foreground mt-1">{formatDate(notification.expiresAt)}</p>
                </div>
              </div>
            )}

            {notification.actionUrl && (
              <div className="flex items-start gap-2">
                <LinkIcon className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium">Action URL</h3>
                  <Link href={notification.actionUrl} className="text-blue-600 hover:underline mt-1 inline-block">
                    {notification.actionUrl}
                  </Link>
                </div>
              </div>
            )}
          </div>

          {notification.isGlobal && (
            <Alert>
              <AlertTitle>Global Notification</AlertTitle>
              <AlertDescription>This notification was sent to all users in the system.</AlertDescription>
            </Alert>
          )}

          {!notification.isGlobal && notification.recipients && notification.recipients.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Recipients</h3>
              <div className="flex flex-wrap gap-2">
                {notification.recipients.map((recipient) => (
                  <div key={recipient._id} className="bg-muted px-3 py-1 rounded-md text-sm">
                    {recipient.name || recipient.userId}
                    {recipient.read && <span className="ml-2 text-green-600">✓</span>}
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
