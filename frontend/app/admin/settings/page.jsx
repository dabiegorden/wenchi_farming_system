"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SystemSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // API keys state
  const [weatherApiKey, setWeatherApiKey] = useState("")
  const [geminiApiKey, setGeminiApiKey] = useState("")
  const [isUpdatingWeatherKey, setIsUpdatingWeatherKey] = useState(false)
  const [isUpdatingGeminiKey, setIsUpdatingGeminiKey] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/admin/settings", {
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to fetch settings")
        }

        const data = await response.json()
        setSettings(data.data.settings)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handleUpdateSettings = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("http://localhost:5000/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appName: settings.appName,
          appVersion: settings.appVersion,
          farmLocation: settings.farmLocation,
          contactEmail: settings.contactEmail,
          allowRegistration: settings.allowRegistration,
          defaultUserRole: settings.defaultUserRole,
          maintenanceMode: settings.maintenanceMode,
          theme: settings.theme,
        }),
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to update settings")
      }

      toast({
        title: "Success",
        description: "Settings updated successfully",
      })

      // Update settings with the response
      setSettings(data.data.settings)
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateWeatherApiKey = async (e) => {
    e.preventDefault()
    setIsUpdatingWeatherKey(true)

    try {
      const response = await fetch("http://localhost:5000/api/admin/settings/weather-api-key", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          weatherApiKey,
        }),
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to update Weather API key")
      }

      toast({
        title: "Success",
        description: "Weather API key updated successfully",
      })

      setWeatherApiKey("")
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      })
    } finally {
      setIsUpdatingWeatherKey(false)
    }
  }

  const handleUpdateGeminiApiKey = async (e) => {
    e.preventDefault()
    setIsUpdatingGeminiKey(true)

    try {
      const response = await fetch("http://localhost:5000/api/admin/settings/gemini-api-key", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          geminiApiKey,
        }),
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to update Gemini API key")
      }

      toast({
        title: "Success",
        description: "Gemini API key updated successfully",
      })

      setGeminiApiKey("")
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      })
    } finally {
      setIsUpdatingGeminiKey(false)
    }
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

  if (!settings) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Settings not found</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">System Settings</h1>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <form onSubmit={handleUpdateSettings}>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="appName">Application Name</Label>
                  <Input
                    id="appName"
                    value={settings.appName}
                    onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="appVersion">Version</Label>
                  <Input
                    id="appVersion"
                    value={settings.appVersion}
                    onChange={(e) => setSettings({ ...settings, appVersion: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="latitude">Farm Latitude</Label>
                    <Input
                      id="latitude"
                      value={settings.farmLocation.latitude}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          farmLocation: {
                            ...settings.farmLocation,
                            latitude: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="longitude">Farm Longitude</Label>
                    <Input
                      id="longitude"
                      value={settings.farmLocation.longitude}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          farmLocation: {
                            ...settings.farmLocation,
                            longitude: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="allowRegistration">Allow Registration</Label>
                    <p className="text-sm text-muted-foreground">Allow new users to register accounts</p>
                  </div>
                  <Switch
                    id="allowRegistration"
                    checked={settings.allowRegistration}
                    onCheckedChange={(checked) => setSettings({ ...settings, allowRegistration: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">Put the system in maintenance mode</p>
                  </div>
                  <Switch
                    id="maintenanceMode"
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Weather API Key</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateWeatherApiKey} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="weatherApiKey">OpenWeather API Key</Label>
                  <Input
                    id="weatherApiKey"
                    type="password"
                    value={weatherApiKey}
                    onChange={(e) => setWeatherApiKey(e.target.value)}
                    placeholder="Enter new API key"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Current status: {settings.weatherApiKey ? "Configured" : "Not configured"}
                  </p>
                </div>
                <Button type="submit" disabled={isUpdatingWeatherKey}>
                  {isUpdatingWeatherKey ? "Updating..." : "Update Weather API Key"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gemini AI API Key</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateGeminiApiKey} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="geminiApiKey">Gemini API Key</Label>
                  <Input
                    id="geminiApiKey"
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="Enter new API key"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Current status: {settings.geminiApiKey ? "Configured" : "Not configured"}
                  </p>
                </div>
                <Button type="submit" disabled={isUpdatingGeminiKey}>
                  {isUpdatingGeminiKey ? "Updating..." : "Update Gemini API Key"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4 mt-4">
          <Card>
            <form onSubmit={handleUpdateSettings}>
              <CardHeader>
                <CardTitle>Theme Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={settings.theme.primaryColor}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          theme: {
                            ...settings.theme,
                            primaryColor: e.target.value,
                          },
                        })
                      }
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={settings.theme.primaryColor}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          theme: {
                            ...settings.theme,
                            primaryColor: e.target.value,
                          },
                        })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={settings.theme.secondaryColor}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          theme: {
                            ...settings.theme,
                            secondaryColor: e.target.value,
                          },
                        })
                      }
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={settings.theme.secondaryColor}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          theme: {
                            ...settings.theme,
                            secondaryColor: e.target.value,
                          },
                        })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={settings.theme.accentColor}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          theme: {
                            ...settings.theme,
                            accentColor: e.target.value,
                          },
                        })
                      }
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={settings.theme.accentColor}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          theme: {
                            ...settings.theme,
                            accentColor: e.target.value,
                          },
                        })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
