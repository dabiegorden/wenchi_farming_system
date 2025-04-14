"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Users, Leaf, Thermometer, Package, Map, Settings, FileText } from "lucide-react"
import Link from "next/link"

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Fetch dashboard stats
        const statsResponse = await fetch("http://localhost:5000/api/admin/dashboard", {
          credentials: "include",
        })

        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData.data.stats)
        }

        // Fetch users list
        const usersResponse = await fetch("http://localhost:5000/api/auth/users?limit=5", {
          credentials: "include",
        })

        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          setUsers(usersData.data.users)
        }

        // Fetch system settings
        const settingsResponse = await fetch("http://localhost:5000/api/admin/settings", {
          credentials: "include",
        })

        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json()
          setSettings(settingsData.data.settings)
        }
      } catch (err) {
        console.error("Failed to fetch admin data:", err)
        setError("Failed to load admin dashboard data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchAdminData()
  }, [])

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.users?.byRole?.admin || 0} admins, {stats?.users?.byRole?.researcher || 0} researchers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crops</CardTitle>
            <Leaf className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.crops?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Registered crop varieties</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Land Plots</CardTitle>
            <Map className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.lands?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.lands?.byStatus?.planted || 0} planted, {stats?.lands?.byStatus?.available || 0} available
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.inventory?.total || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.inventory?.lowStock || 0} items low in stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/admin/users">
            <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center">
              <Users className="h-6 w-6 mb-2" />
              <span>Manage Users</span>
            </Button>
          </Link>
          <Link href="/admin/settings">
            <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center">
              <Settings className="h-6 w-6 mb-2" />
              <span>System Settings</span>
            </Button>
          </Link>
          <Link href="/admin/reports">
            <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center">
              <FileText className="h-6 w-6 mb-2" />
              <span>Reports</span>
            </Button>
          </Link>
          <Link href="/admin/notifications">
            <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center">
              <Thermometer className="h-6 w-6 mb-2" />
              <span>Send Notifications</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* User Management */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">User Management</h2>
          <Link href="/admin/users">
            <Button>Add New User</Button>
          </Link>
        </div>
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user._id} className="border-t">
                      <td className="px-4 py-3 text-sm">{user.name}</td>
                      <td className="px-4 py-3 text-sm">{user.email}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : user.role === "researcher"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Link href={`/admin/users/${user._id}`} className="text-blue-600 hover:underline mr-2">
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-sm text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-2 text-right">
          <Link href="/admin/users">
            <Button variant="link">View All Users</Button>
          </Link>
        </div>
      </div>

      {/* System Settings */}
      <div>
        <h2 className="text-xl font-semibold mb-4">System Settings</h2>
        <Card>
          <CardContent className="pt-6">
            {settings ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Application Name</p>
                  <p className="text-lg">{settings.appName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Version</p>
                  <p className="text-lg">{settings.appVersion}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Weather API Key</p>
                  <p className="text-lg">{settings.weatherApiKey}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Farm Location</p>
                  <p className="text-lg">
                    {settings.farmLocation.latitude}, {settings.farmLocation.longitude}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Maintenance Mode</p>
                  <p className="text-lg">{settings.maintenanceMode ? "Enabled" : "Disabled"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Allow Registration</p>
                  <p className="text-lg">{settings.allowRegistration ? "Enabled" : "Disabled"}</p>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">Loading settings...</p>
            )}
          </CardContent>
        </Card>
        <div className="mt-2 text-right">
          <Link href="/admin/settings">
            <Button variant="link">Manage Settings</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
