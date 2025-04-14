"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Search, Plus, Eye, Trash, Bell, AlertTriangle, Info } from "lucide-react"

export default function NotificationsManagement() {
  const router = useRouter()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  })

  // New notification state
  const [isCreateNotificationOpen, setIsCreateNotificationOpen] = useState(false)
  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    type: "info",
    priority: "normal",
    targetUsers: [],
  })
  const [users, setUsers] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      let url = `http://localhost:5000/api/notifications?page=${pagination.page}&limit=${pagination.limit}`

      if (searchTerm) {
        url += `&search=${searchTerm}`
      }

      if (typeFilter && typeFilter !== "all") {
        url += `&type=${typeFilter}`
      }

      const response = await fetch(url, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch notifications")
      }

      const data = await response.json()
      setNotifications(data.data.notifications)
      setPagination({
        ...pagination,
        total: data.data.pagination.total,
        pages: data.data.pagination.pages,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/users?limit=100", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }

      const data = await response.json()
      setUsers(data.data.users)
    } catch (err) {
      console.error("Failed to fetch users:", err)
    }
  }

  useEffect(() => {
    fetchNotifications()
    fetchUsers()
  }, [pagination.page, typeFilter])

  const handleSearch = (e) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchNotifications()
  }

  const handleDeleteNotification = async (notificationId) => {
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

      // Refresh the notifications list
      fetchNotifications()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleCreateNotification = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("http://localhost:5000/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newNotification),
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to create notification")
      }

      toast.success("Notification created and sent successfully")

      // Reset form and close dialog
      setNewNotification({
        title: "",
        message: "",
        type: "info",
        priority: "normal",
        targetUsers: [],
      })
      setIsCreateNotificationOpen(false)

      // Refresh the notifications list
      fetchNotifications()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications Management</h1>
          <p className="text-muted-foreground">Send and manage system notifications</p>
        </div>
        <Dialog open={isCreateNotificationOpen} onOpenChange={setIsCreateNotificationOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Notification
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Notification</DialogTitle>
              <DialogDescription>Create and send a notification to users</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateNotification}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={newNotification.type}
                      onValueChange={(value) => setNewNotification({ ...newNotification, type: value })}
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Information</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="alert">Alert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={newNotification.priority}
                      onValueChange={(value) => setNewNotification({ ...newNotification, priority: value })}
                    >
                      <SelectTrigger id="priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="targetUsers">Target Users (Optional)</Label>
                  <Select
                    value={newNotification.targetUsers.length === 0 ? "all" : "selected"}
                    onValueChange={(value) =>
                      setNewNotification({
                        ...newNotification,
                        targetUsers: value === "all" ? [] : newNotification.targetUsers,
                      })
                    }
                  >
                    <SelectTrigger id="targetUsers">
                      <SelectValue placeholder="Select target users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="selected">Selected Users</SelectItem>
                    </SelectContent>
                  </Select>
                  {newNotification.targetUsers.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground mb-1">Selected Users:</p>
                      <div className="flex flex-wrap gap-2">
                        {newNotification.targetUsers.map((userId) => {
                          const user = users.find((u) => u._id === userId)
                          return (
                            <div key={userId} className="bg-muted px-2 py-1 rounded-md text-xs flex items-center gap-1">
                              <span>{user?.name || userId}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setNewNotification({
                                    ...newNotification,
                                    targetUsers: newNotification.targetUsers.filter((id) => id !== userId),
                                  })
                                }
                                className="text-muted-foreground hover:text-foreground"
                              >
                                &times;
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send Notification"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex space-x-2">
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Button type="submit" variant="secondary" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </form>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="info">Information</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="alert">Alert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <Card key={notification._id} className="overflow-hidden">
                      <div
                        className={`h-1 ${
                          notification.type === "info"
                            ? "bg-blue-500"
                            : notification.type === "warning"
                              ? "bg-amber-500"
                              : "bg-red-500"
                        }`}
                      ></div>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div
                              className={`mt-1 p-2 rounded-full ${
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
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{notification.title}</h3>
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
                              <p className="text-muted-foreground mt-1">{notification.message}</p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <span>{formatDate(notification.createdAt)}</span>
                                {notification.createdBy && (
                                  <>
                                    <span>•</span>
                                    <span>By: {notification.createdBy.name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/admin/notifications/${notification._id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteNotification(notification._id)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No notifications found</div>
                )}
              </div>

              {pagination.pages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                        className={pagination.page <= 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setPagination((prev) => ({ ...prev, page }))}
                          isActive={page === pagination.page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setPagination((prev) => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))
                        }
                        className={pagination.page >= pagination.pages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
