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
import { Search, Plus, Eye, Trash, Bell, AlertTriangle, Info, Edit, Tag } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePicker } from "@/components/ui/date-picker"

export default function NotificationsManagement() {
  const router = useRouter()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")
  const [sentByMeFilter, setSentByMeFilter] = useState(false)
  const [unreadOnlyFilter, setUnreadOnlyFilter] = useState(false)
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
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
    priority: "medium",
    category: "system",
    isGlobal: true,
    recipients: [],
    tags: [],
    actionUrl: "",
    isActionRequired: false,
    expiresAt: null,
  })
  const [users, setUsers] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

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

      if (categoryFilter && categoryFilter !== "all") {
        url += `&category=${categoryFilter}`
      }

      if (priorityFilter && priorityFilter !== "all") {
        url += `&priority=${priorityFilter}`
      }

      if (unreadOnlyFilter) {
        url += `&unreadOnly=true`
      }

      if (startDate) {
        url += `&startDate=${startDate.toISOString().split("T")[0]}`
      }

      if (endDate) {
        url += `&endDate=${endDate.toISOString().split("T")[0]}`
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
    fetchCurrentUser()
    fetchUsers()
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [
    pagination.page,
    typeFilter,
    categoryFilter,
    priorityFilter,
    unreadOnlyFilter,
    sentByMeFilter,
    startDate,
    endDate,
  ])

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
      // Prepare the notification data
      const notificationData = {
        ...newNotification,
        // Convert recipients array to the format expected by the backend
        recipients: newNotification.isGlobal ? [] : newNotification.recipients,
      }

      const response = await fetch("http://localhost:5000/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notificationData),
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
        priority: "medium",
        category: "system",
        isGlobal: true,
        recipients: [],
        tags: [],
        actionUrl: "",
        isActionRequired: false,
        expiresAt: null,
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

  const isCreatedByCurrentUser = (notification) => {
    return currentUser && notification.createdBy && notification.createdBy._id === currentUser._id
  }

  const handleTagInput = (e) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      e.preventDefault()
      const newTag = e.target.value.trim()
      if (!newNotification.tags.includes(newTag)) {
        setNewNotification({
          ...newNotification,
          tags: [...newNotification.tags, newTag],
        })
      }
      e.target.value = ""
    }
  }

  const removeTag = (tagToRemove) => {
    setNewNotification({
      ...newNotification,
      tags: newNotification.tags.filter((tag) => tag !== tagToRemove),
    })
  }

  const clearFilters = () => {
    setTypeFilter("")
    setCategoryFilter("")
    setPriorityFilter("")
    setSentByMeFilter(false)
    setUnreadOnlyFilter(false)
    setStartDate(null)
    setEndDate(null)
    setSearchTerm("")
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
    <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-2 px-4 py-2 transition-colors">
      <Plus className="h-4 w-4" />
      Create Notification
    </Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[600px] bg-white rounded-xl shadow-lg border-0">
    <DialogHeader className="pb-2">
      <DialogTitle className="text-xl font-semibold text-gray-800">Create New Notification</DialogTitle>
      <DialogDescription className="text-gray-500">Create and send a notification to users</DialogDescription>
    </DialogHeader>
    <form onSubmit={handleCreateNotification}>
      <div className="grid gap-5 py-4">
        <div className="grid gap-2">
          <Label htmlFor="title" className="font-medium text-gray-700">Title <span className="text-red-500">*</span></Label>
          <Input
            id="title"
            value={newNotification.title}
            onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
            required
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="message" className="font-medium text-gray-700">Message <span className="text-red-500">*</span></Label>
          <Textarea
            id="message"
            value={newNotification.message}
            onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
            rows={3}
            required
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="type" className="font-medium text-gray-700">Type</Label>
            <Select
              value={newNotification.type}
              onValueChange={(value) => setNewNotification({ ...newNotification, type: value })}
            >
              <SelectTrigger id="type" className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-white rounded-lg shadow-lg border-0">
                <SelectItem value="info" className="hover:bg-blue-50">Information</SelectItem>
                <SelectItem value="warning" className="hover:bg-blue-50">Warning</SelectItem>
                <SelectItem value="alert" className="hover:bg-blue-50">Alert</SelectItem>
                <SelectItem value="success" className="hover:bg-blue-50">Success</SelectItem>
                <SelectItem value="task" className="hover:bg-blue-50">Task</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="priority" className="font-medium text-gray-700">Priority</Label>
            <Select
              value={newNotification.priority}
              onValueChange={(value) => setNewNotification({ ...newNotification, priority: value })}
            >
              <SelectTrigger id="priority" className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent className="bg-white rounded-lg shadow-lg border-0">
                <SelectItem value="low" className="hover:bg-blue-50">Low</SelectItem>
                <SelectItem value="medium" className="hover:bg-blue-50">Medium</SelectItem>
                <SelectItem value="high" className="hover:bg-blue-50">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="category" className="font-medium text-gray-700">Category</Label>
            <Select
              value={newNotification.category}
              onValueChange={(value) => setNewNotification({ ...newNotification, category: value })}
            >
              <SelectTrigger id="category" className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-white rounded-lg shadow-lg border-0">
                <SelectItem value="system" className="hover:bg-blue-50">System</SelectItem>
                <SelectItem value="crop" className="hover:bg-blue-50">Crop</SelectItem>
                <SelectItem value="inventory" className="hover:bg-blue-50">Inventory</SelectItem>
                <SelectItem value="land" className="hover:bg-blue-50">Land</SelectItem>
                <SelectItem value="health" className="hover:bg-blue-50">Health</SelectItem>
                <SelectItem value="weather" className="hover:bg-blue-50">Weather</SelectItem>
                <SelectItem value="other" className="hover:bg-blue-50">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="expiresAt" className="font-medium text-gray-700">Expires At <span className="text-gray-500 text-sm">(Optional)</span></Label>
            <DatePicker
              date={newNotification.expiresAt}
              setDate={(date) => setNewNotification({ ...newNotification, expiresAt: date })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="actionUrl" className="font-medium text-gray-700">Action URL <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Input
            id="actionUrl"
            value={newNotification.actionUrl}
            onChange={(e) => setNewNotification({ ...newNotification, actionUrl: e.target.value })}
            placeholder="e.g., /crops/details/123"
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
          <Checkbox
            id="isActionRequired"
            checked={newNotification.isActionRequired}
            onCheckedChange={(checked) => setNewNotification({ ...newNotification, isActionRequired: checked })}
            className="text-blue-600 focus:ring-blue-500"
          />
          <Label htmlFor="isActionRequired" className="text-gray-700 cursor-pointer">Action Required</Label>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="tags" className="font-medium text-gray-700">Tags <span className="text-gray-500 text-sm">(Press Enter to add)</span></Label>
          <Input 
            id="tags" 
            placeholder="Add tags..." 
            onKeyDown={handleTagInput}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
          />
          {newNotification.tags && newNotification.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {newNotification.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-blue-100 text-blue-800 flex items-center gap-1 px-3 py-1 rounded-full">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-blue-700 hover:text-blue-900 font-bold ml-1"
                  >
                    &times;
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-2">
          <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
            <Checkbox
              id="isGlobal"
              checked={newNotification.isGlobal}
              onCheckedChange={(checked) => setNewNotification({ ...newNotification, isGlobal: checked })}
              className="text-blue-600 focus:ring-blue-500"
            />
            <Label htmlFor="isGlobal" className="text-gray-700 cursor-pointer">Send to all users</Label>
          </div>
        </div>

        {!newNotification.isGlobal && (
          <div className="grid gap-2">
            <Label htmlFor="recipients" className="font-medium text-gray-700">Select Recipients</Label>
            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-white">
              {users && users.length > 0 ? (
                users.map((user) => (
                  <div key={user._id} className="flex items-center space-x-2 py-1.5 hover:bg-gray-50 px-2 rounded">
                    <Checkbox
                      id={`user-${user._id}`}
                      checked={newNotification.recipients.includes(user._id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNewNotification({
                            ...newNotification,
                            recipients: [...newNotification.recipients, user._id],
                          })
                        } else {
                          setNewNotification({
                            ...newNotification,
                            recipients: newNotification.recipients.filter((id) => id !== user._id),
                          })
                        }
                      }}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor={`user-${user._id}`} className="cursor-pointer text-gray-800">
                      {user.name} <span className="text-gray-500">({user.email})</span>
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm py-2 italic">Loading users...</p>
              )}
            </div>
            {newNotification.recipients && newNotification.recipients.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {newNotification.recipients.length} recipient(s) selected
              </p>
            )}
          </div>
        )}
      </div>
      <DialogFooter className="pt-2 border-t border-gray-100">
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg px-4 py-2 transition-colors"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              Sending...
            </span>
          ) : "Send Notification"}
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
          <div className="flex flex-col space-y-4 mb-6">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="info">Information</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="alert">Alert</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="crop">Crop</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                  <SelectItem value="land">Land</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="weather">Weather</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="unreadOnly" checked={unreadOnlyFilter} onCheckedChange={setUnreadOnlyFilter} />
                <Label htmlFor="unreadOnly">Unread only</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="sentByMe" checked={sentByMeFilter} onCheckedChange={setSentByMeFilter} />
                <Label htmlFor="sentByMe">Sent by me</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Label>Date range:</Label>
                <DatePicker date={startDate} setDate={setStartDate} placeholder="Start date" />
                <span>to</span>
                <DatePicker date={endDate} setDate={setEndDate} placeholder="End date" />
              </div>

              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
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
                {notifications && notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <Card key={notification._id} className="overflow-hidden">
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
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div
                              className={`mt-1 p-2 rounded-full ${
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
                              ) : notification.type === "success" ? (
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
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-medium">{notification.title}</h3>
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
                                {isCreatedByCurrentUser(notification) && (
                                  <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">
                                    Sent by me
                                  </Badge>
                                )}
                              </div>
                              <p className="text-muted-foreground mt-1">{notification.message}</p>
                              {notification.tags && notification.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {notification.tags.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      <Tag className="h-3 w-3 mr-1" />
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <span>{formatDate(notification.createdAt)}</span>
                                {notification.createdBy && (
                                  <>
                                    <span>•</span>
                                    <span>By: {notification.createdBy.name}</span>
                                  </>
                                )}
                                {notification.expiresAt && (
                                  <>
                                    <span>•</span>
                                    <span>Expires: {formatDate(notification.expiresAt)}</span>
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
                            {isCreatedByCurrentUser(notification) && (
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={`/admin/notifications/${notification._id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}
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
