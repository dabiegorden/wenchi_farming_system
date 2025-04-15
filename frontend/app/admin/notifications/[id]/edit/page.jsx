"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { ArrowLeft, Save, Tag } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePicker } from "@/components/ui/date-picker"
import React from "react"

export default function EditNotificationPage({ params }) {
  const notificationId = React.use(params).id
  const router = useRouter()
  const [notification, setNotification] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [users, setUsers] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [formData, setFormData] = useState({
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
        const notificationData = data.data.notification

        // Check if the user has permission to edit this notification
        if (!currentUser || (notificationData.createdBy && notificationData.createdBy._id !== currentUser._id)) {
          setError("You don't have permission to edit this notification")
          toast.error("You don't have permission to edit this notification")
          setTimeout(() => {
            router.push(`/admin/notifications/${notificationId}`)
          }, 2000)
          return
        }

        setNotification(notificationData)

        // Set form data from notification
        setFormData({
          title: notificationData.title || "",
          message: notificationData.message || "",
          type: notificationData.type || "info",
          priority: notificationData.priority || "medium",
          category: notificationData.category || "system",
          isGlobal: notificationData.isGlobal !== undefined ? notificationData.isGlobal : true,
          recipients:
            notificationData.recipients?.map((recipient) =>
              typeof recipient === "object" ? recipient.userId || recipient._id : recipient,
            ) || [],
          tags: notificationData.tags || [],
          actionUrl: notificationData.actionUrl || "",
          isActionRequired: notificationData.isActionRequired || false,
          expiresAt: notificationData.expiresAt ? new Date(notificationData.expiresAt) : null,
        })
      } catch (err) {
        setError(err.message)
        toast.error("Failed to load notification details")
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

    fetchCurrentUser()
    fetchUsers()
    fetchNotification()
  }, [notificationId, router, currentUser])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to update notification")
      }

      toast.success("Notification updated successfully")
      router.push(`/admin/notifications/${notificationId}`)
    } catch (err) {
      toast.error(err.message || "Failed to update notification")
    } finally {
      setSaving(false)
    }
  }

  const handleTagInput = (e) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      e.preventDefault()
      const newTag = e.target.value.trim()
      if (!formData.tags.includes(newTag)) {
        setFormData({
          ...formData,
          tags: [...formData.tags, newTag],
        })
      }
      e.target.value = ""
    }
  }

  const removeTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
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
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/notifications/${notificationId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Notification</h1>
          <p className="text-muted-foreground">Update notification details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Notification Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter notification title"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Enter notification message"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Information</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="alert">Alert</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="crop">Crop</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
                    <SelectItem value="land">Land</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="weather">Weather</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="actionUrl">Action URL (Optional)</Label>
              <Input
                id="actionUrl"
                value={formData.actionUrl}
                onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                placeholder="e.g., /crops/details/123"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="expiresAt">Expires At (Optional)</Label>
              <DatePicker date={formData.expiresAt} setDate={(date) => setFormData({ ...formData, expiresAt: date })} />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActionRequired"
                checked={formData.isActionRequired}
                onCheckedChange={(checked) => setFormData({ ...formData, isActionRequired: checked })}
              />
              <Label htmlFor="isActionRequired">Action Required</Label>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (Press Enter to add)</Label>
              <Input id="tags" placeholder="Add tags..." onKeyDown={handleTagInput} />
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        &times;
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isGlobal"
                  checked={formData.isGlobal}
                  onCheckedChange={(checked) => setFormData({ ...formData, isGlobal: checked })}
                />
                <Label htmlFor="isGlobal">Send to all users</Label>
              </div>
            </div>

            {!formData.isGlobal && (
              <div className="grid gap-2">
                <Label htmlFor="recipients">Select Recipients</Label>
                <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                  {users.length > 0 ? (
                    users.map((user) => (
                      <div key={user._id} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={`user-${user._id}`}
                          checked={formData.recipients.includes(user._id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({
                                ...formData,
                                recipients: [...formData.recipients, user._id],
                              })
                            } else {
                              setFormData({
                                ...formData,
                                recipients: formData.recipients.filter((id) => id !== user._id),
                              })
                            }
                          }}
                        />
                        <Label htmlFor={`user-${user._id}`} className="cursor-pointer">
                          {user.name} ({user.email})
                        </Label>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">Loading users...</p>
                  )}
                </div>
                {formData.recipients.length > 0 && (
                  <p className="text-sm text-muted-foreground">{formData.recipients.length} recipient(s) selected</p>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline" asChild>
              <Link href={`/admin/notifications/${notificationId}`}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <div className="mr-2 h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
