"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Brain, CloudRain, Leaf, Sprout, Bell, AlertTriangle, Info, Check, Loader2, Upload } from "lucide-react"

export default function AIFeaturesPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("smart-notifications")

  return (
    <div className="space-y-8 p-4 max-w-7xl mx-auto">
      <div className="bg-gradient-to-r from-green-600 to-teal-500 rounded-xl p-6 shadow-lg text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Farm AI Assistant</h1>
            <p className="text-green-100 text-lg mt-2">
              Intelligent insights and recommendations to optimize your farming operations
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <Brain className="h-10 w-10" />
          </div>
        </div>
      </div>

      <Tabs 
        defaultValue="smart-notifications" 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="space-y-6"
      >
        <TabsList className="w-full bg-transparent p-0 gap-2">
          <div className="flex flex-wrap gap-2">
            <TabsTrigger 
              value="smart-notifications" 
              className="flex items-center gap-2 bg-white shadow-sm hover:bg-green-50 data-[state=active]:bg-green-600 data-[state=active]:text-white transition-colors"
            >
              <Bell className="h-5 w-5" />
              <span className="hidden sm:inline">Smart Notifications</span>
              <span className="sm:hidden">Notifications</span>
            </TabsTrigger>
            <TabsTrigger 
              value="weather-analysis" 
              className="flex items-center gap-2 bg-white shadow-sm hover:bg-blue-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-colors"
            >
              <CloudRain className="h-5 w-5" />
              <span className="hidden sm:inline">Weather Analysis</span>
              <span className="sm:hidden">Weather</span>
            </TabsTrigger>
            <TabsTrigger 
              value="crop-health" 
              className="flex items-center gap-2 bg-white shadow-sm hover:bg-amber-50 data-[state=active]:bg-amber-600 data-[state=active]:text-white transition-colors"
            >
              <Leaf className="h-5 w-5" />
              <span className="hidden sm:inline">Crop Health</span>
              <span className="sm:hidden">Health</span>
            </TabsTrigger>
            <TabsTrigger 
              value="crop-recommendations" 
              className="flex items-center gap-2 bg-white shadow-sm hover:bg-teal-50 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-colors"
            >
              <Sprout className="h-5 w-5" />
              <span className="hidden sm:inline">Crop Recommendations</span>
              <span className="sm:hidden">Recommendations</span>
            </TabsTrigger>
          </div>
        </TabsList>

        <TabsContent value="smart-notifications">
          <SmartNotificationsTab />
        </TabsContent>

        <TabsContent value="weather-analysis">
          <WeatherAnalysisTab />
        </TabsContent>

        <TabsContent value="crop-health">
          <CropHealthAnalysisTab />
        </TabsContent>

        <TabsContent value="crop-recommendations">
          <CropRecommendationsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SmartNotificationsTab() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [notifications, setNotifications] = useState([])
  const [selectedNotifications, setSelectedNotifications] = useState([])

  const generateNotifications = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("http://localhost:5000/api/ai/smart-notifications", {
        method: "POST",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to generate smart notifications")
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to generate smart notifications")
      }

      setNotifications(data.data.notifications || [])
    } catch (err) {
      setError(err.message)
      toast.error("Failed to generate smart notifications")
    } finally {
      setLoading(false)
    }
  }

  const createSelectedNotifications = async () => {
    if (selectedNotifications.length === 0) {
      toast.error("Please select at least one notification to create")
      return
    }

    setLoading(true)

    try {
      const notificationsToCreate = notifications.filter((_, index) => selectedNotifications.includes(index))

      const response = await fetch("http://localhost:5000/api/ai/create-notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notifications: notificationsToCreate }),
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to create notifications")
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to create notifications")
      }

      toast.success(`${selectedNotifications.length} notifications created successfully`)
      setSelectedNotifications([])
      setNotifications([])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleNotificationSelection = (index) => {
    setSelectedNotifications((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index)
      } else {
        return [...prev, index]
      }
    })
  }

  const getNotificationTypeIcon = (type) => {
    switch (type) {
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case "alert":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case "success":
        return <Check className="h-5 w-5 text-green-500" />
      default:
        return <Bell className="h-5 w-5 text-purple-500" />
    }
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-t-xl">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-2 rounded-lg">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-white">Smart Notifications Generator</CardTitle>
            <CardDescription className="text-purple-100">
              AI-powered alerts and recommendations for your farm
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="flex flex-col md:flex-row gap-4">
          <Button 
            onClick={generateNotifications} 
            disabled={loading} 
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4" />
                Generate Smart Notifications
              </>
            )}
          </Button>

          {notifications.length > 0 && (
            <Button
              onClick={createSelectedNotifications}
              disabled={loading || selectedNotifications.length === 0}
              variant="outline"
              className="flex items-center gap-2 border-purple-600 text-purple-600 hover:bg-purple-50"
            >
              <Bell className="h-4 w-4" />
              Create Selected Notifications ({selectedNotifications.length})
            </Button>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="border-red-500">
            <AlertTitle className="text-red-600">Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {notifications.length > 0 ? (
          <div className="space-y-4 mt-4">
            <h3 className="text-lg font-medium text-gray-700">Generated Notifications</h3>
            <div className="space-y-3">
              {notifications.map((notification, index) => (
                <div
                  key={index}
                  className={`border rounded-xl p-4 transition-all hover:shadow-md ${
                    selectedNotifications.includes(index) 
                      ? "border-green-500 bg-green-50 shadow-sm" 
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center h-6 mt-1">
                      <Checkbox
                        checked={selectedNotifications.includes(index)}
                        onCheckedChange={() => toggleNotificationSelection(index)}
                        id={`notification-${index}`}
                        className="border-gray-400 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <div
                          className={`p-1 rounded-full ${
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
                          {getNotificationTypeIcon(notification.type)}
                        </div>
                        <Label htmlFor={`notification-${index}`} className="font-medium cursor-pointer text-gray-800">
                          {notification.title}
                        </Label>
                        <Badge
                          variant={
                            notification.priority === "low"
                              ? "outline"
                              : notification.priority === "medium"
                                ? "secondary"
                                : "destructive"
                          }
                          className="text-xs"
                        >
                          {notification.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {notification.category}
                        </Badge>
                      </div>
                      <p className="text-gray-600 ml-8">{notification.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-purple-600 font-medium">Analyzing your farm data...</p>
          </div>
        ) : (
          <div className="text-center py-12 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl">
            <Bell className="h-10 w-10 mx-auto text-purple-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-700">No notifications generated yet</h3>
            <p className="text-gray-500 mt-1">
              Click the button above to generate AI-powered notifications based on your farm data
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function WeatherAnalysisTab() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [weatherAnalysis, setWeatherAnalysis] = useState(null)

  const analyzeWeather = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("http://localhost:5000/api/ai/weather-analysis", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to analyze weather data")
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to analyze weather data")
      }

      setWeatherAnalysis(data.data)
    } catch (err) {
      setError(err.message)
      toast.error("Failed to analyze weather data")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-t-xl">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-2 rounded-lg">
            <CloudRain className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-white">Weather Analysis</CardTitle>
            <CardDescription className="text-blue-100">
              AI-powered weather insights and agricultural recommendations
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <Button 
          onClick={analyzeWeather} 
          disabled={loading} 
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <CloudRain className="h-4 w-4" />
              Analyze Weather for Agriculture
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive" className="border-red-500">
            <AlertTitle className="text-red-600">Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {weatherAnalysis ? (
          <div className="space-y-6 mt-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-700">Weather Analysis</h3>
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <p className="mb-4 text-gray-700">{weatherAnalysis.weatherAnalysis?.summary}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border-l-4 border-red-500 pl-4">
                      <h4 className="font-medium mb-2 text-gray-800">Risks</h4>
                      <ul className="space-y-2">
                        {weatherAnalysis.weatherAnalysis?.risks?.map((risk, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 mt-0.5 text-red-500 flex-shrink-0" />
                            <span className="text-gray-700">{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-medium mb-2 text-gray-800">Opportunities</h4>
                      <ul className="space-y-2">
                        {weatherAnalysis.weatherAnalysis?.opportunities?.map((opportunity, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                            <span className="text-gray-700">{opportunity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-700">Crop-Specific Recommendations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {weatherAnalysis.cropSpecificRecommendations?.map((crop, index) => (
                  <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Leaf className="h-4 w-4 text-green-600" />
                        {crop.cropName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-0">
                      <div>
                        <h4 className="font-medium mb-2 text-gray-800">Recommendations</h4>
                        <ul className="space-y-2">
                          {crop.recommendations?.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Check className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                              <span className="text-gray-700">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2 text-gray-800">Warnings</h4>
                        <ul className="space-y-2">
                          {crop.warnings?.map((warning, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-500 flex-shrink-0" />
                              <span className="text-gray-700">{warning}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2 text-gray-800">Irrigation Advice</h4>
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                          <span className="text-gray-700">{crop.irrigationAdvice}</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2 text-gray-800">Pest & Disease Risks</h4>
                        <ul className="space-y-2">
                          {crop.pestDiseaseRisks?.map((risk, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 mt-0.5 text-red-500 flex-shrink-0" />
                              <span className="text-gray-700">{risk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-700">General Recommendations</h3>
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <ul className="space-y-2">
                    {weatherAnalysis.generalRecommendations?.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-700">Long-Term Outlook</h3>
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <p className="text-gray-700">{weatherAnalysis.longTermOutlook}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-blue-600 font-medium">Analyzing weather patterns...</p>
          </div>
        ) : (
          <div className="text-center py-12 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
            <CloudRain className="h-10 w-10 mx-auto text-blue-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-700">No weather analysis yet</h3>
            <p className="text-gray-500 mt-1">
              Click the button above to analyze weather data for agricultural recommendations
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CropHealthAnalysisTab() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [cropName, setCropName] = useState("")
  const [symptoms, setSymptoms] = useState("")
  const [analysisResult, setAnalysisResult] = useState(null)
  const [analysisType, setAnalysisType] = useState("symptoms")
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)

  const analyzeCropHealth = async () => {
    if (analysisType === "symptoms" && (!cropName || !symptoms)) {
      toast.error("Please enter both crop name and symptoms")
      return
    }

    if (analysisType === "image" && (!cropName || !imageFile)) {
      toast.error("Please enter crop name and upload an image")
      return
    }

    setLoading(true)
    setError("")
    setUploadProgress(0)

    try {
      let response

      if (analysisType === "symptoms") {
        const symptomsList = symptoms
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s)

        response = await fetch("http://localhost:5000/api/ai/analyze-crop-health", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cropName,
            symptoms: symptomsList,
            analysisType: "symptoms",
          }),
          credentials: "include",
        })
      } else {
        const formData = new FormData()
        formData.append("cropName", cropName)
        formData.append("image", imageFile)
        formData.append("analysisType", "image")

        const xhr = new XMLHttpRequest()

        const uploadPromise = new Promise((resolve, reject) => {
          xhr.open("POST", "http://localhost:5000/api/ai/analyze-crop-health", true)
          xhr.withCredentials = true

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100)
              setUploadProgress(progress)
            }
          }

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve({
                ok: true,
                json: () => JSON.parse(xhr.responseText),
              })
            } else {
              reject(new Error(`HTTP Error: ${xhr.status}`))
            }
          }

          xhr.onerror = () => {
            reject(new Error("Network Error"))
          }

          xhr.send(formData)
        })

        response = await uploadPromise
      }

      if (!response.ok) {
        throw new Error(`Failed to analyze crop health: ${response.statusText || "Unknown error"}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to analyze crop health")
      }

      setAnalysisResult(data.data)
      toast.success("Crop health analysis completed successfully")
    } catch (err) {
      setError(err.message)
      toast.error(`Failed to analyze crop health: ${err.message}`)
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPEG, PNG, or WebP)")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB")
      return
    }

    setImageFile(file)

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "healthy":
        return "bg-green-100 text-green-800"
      case "mild":
        return "bg-amber-100 text-amber-800"
      case "moderate":
        return "bg-orange-100 text-orange-800"
      case "severe":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 rounded-t-xl">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-2 rounded-lg">
            <Leaf className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-white">Crop Health Analysis</CardTitle>
            <CardDescription className="text-green-100">
              Diagnose plant health issues using AI from symptoms or images
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="symptoms-analysis"
              checked={analysisType === "symptoms"}
              onCheckedChange={() => setAnalysisType("symptoms")}
              className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
            />
            <Label htmlFor="symptoms-analysis" className="cursor-pointer">
              Analyze by Symptoms
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="image-analysis"
              checked={analysisType === "image"}
              onCheckedChange={() => setAnalysisType("image")}
              className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
            />
            <Label htmlFor="image-analysis" className="cursor-pointer">
              Analyze by Image
            </Label>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="cropName">Crop Name *</Label>
            <Input
              id="cropName"
              value={cropName}
              onChange={(e) => setCropName(e.target.value)}
              placeholder="e.g., Tomato, Corn, Rice"
              required
              className="focus-visible:ring-green-500"
            />
          </div>

          {analysisType === "symptoms" ? (
            <div className="grid gap-2">
              <Label htmlFor="symptoms">Symptoms (comma separated) *</Label>
              <Textarea
                id="symptoms"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="e.g., yellow leaves, wilting, brown spots, stunted growth"
                rows={3}
                required
                className="focus-visible:ring-green-500"
              />
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="cropImage">Crop Image *</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="cropImage"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="max-w-sm focus-visible:ring-green-500"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("cropImage").click()}
                  className="flex items-center gap-2 border-green-600 text-green-600 hover:bg-green-50"
                >
                  <Upload className="h-4 w-4" />
                  Upload Image
                </Button>
              </div>

              {imagePreview && (
                <div className="mt-2 border rounded-xl overflow-hidden shadow-sm">
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    alt="Crop preview"
                    className="max-h-48 object-contain mx-auto"
                  />
                </div>
              )}

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full mt-2">
                  <div className="text-xs text-center mb-1">{uploadProgress}% uploaded</div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          )}

          <Button 
            onClick={analyzeCropHealth} 
            disabled={loading} 
            className="flex items-center gap-2 mt-2 bg-green-600 hover:bg-green-700 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {analysisType === "image" ? "Uploading & Analyzing..." : "Analyzing..."}
              </>
            ) : (
              <>
                <Leaf className="h-4 w-4" />
                Analyze Crop Health
              </>
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="border-red-500">
            <AlertTitle className="text-red-600">Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {analysisResult ? (
          <div className="space-y-6 mt-4 border rounded-xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-xl font-medium text-gray-800">{analysisResult.disease}</h3>
              <Badge className={`${getSeverityColor(analysisResult.severity)} px-3 py-1 text-sm`}>
                {analysisResult.severity}
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Confidence:</span>
                  <span className="text-sm font-semibold">{analysisResult.confidenceLevel}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                  <div
                    className="bg-green-600 h-2.5 rounded-full"
                    style={{ width: `${analysisResult.confidenceLevel}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2 text-gray-800">Description</h4>
                <p className="text-gray-700">{analysisResult.description}</p>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-gray-800">Visual Symptoms</h4>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.visualSymptoms?.map((symptom, index) => (
                    <Badge key={index} variant="outline" className="text-gray-700">
                      {symptom}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2 text-gray-800">Recommended Treatments</h4>
                <ul className="space-y-2">
                  {analysisResult.recommendedTreatments?.map((treatment, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{treatment}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-gray-800">Preventive Measures</h4>
                <ul className="space-y-2">
                  {analysisResult.preventiveMeasures?.map((measure, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{measure}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {analysisResult.differentialDiagnosis && (
              <div>
                <h4 className="font-medium mb-2 text-gray-800">Differential Diagnosis</h4>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.differentialDiagnosis?.map((diagnosis, index) => (
                    <Badge key={index} variant="outline" className="text-gray-700">
                      {diagnosis}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {analysisResult.expectedProgression && (
              <div>
                <h4 className="font-medium mb-2 text-gray-800">Expected Progression</h4>
                <p className="text-gray-700">{analysisResult.expectedProgression}</p>
              </div>
            )}

            {analysisResult.environmentalFactors && (
              <div>
                <h4 className="font-medium mb-2 text-gray-800">Environmental Factors</h4>
                <ul className="space-y-2">
                  {analysisResult.environmentalFactors?.map((factor, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                      <span className="text-gray-700">{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-green-600 font-medium">Analyzing crop health...</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function CropRecommendationsTab() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [landData, setLandData] = useState({
    soilType: "",
    soilPh: "",
    soilMoisture: "",
    location: "",
  })
  const [season, setSeason] = useState("current")
  const [recommendations, setRecommendations] = useState(null)
  const [lands, setLands] = useState([])
  const [selectedLand, setSelectedLand] = useState("")

  useEffect(() => {
    const fetchLands = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/land", {
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setLands(data.data.lands || [])
          }
        }
      } catch (err) {
        console.error("Failed to fetch lands:", err)
      }
    }

    fetchLands()
  }, [])

  const handleLandSelect = (landId) => {
    setSelectedLand(landId)

    if (landId && landId !== "manual") {
      const selectedLandData = lands.find((land) => land._id === landId)
      if (selectedLandData) {
        setLandData({
          soilType: selectedLandData.soilType || "",
          soilPh: selectedLandData.soilPh || "",
          soilMoisture: selectedLandData.soilMoisture?.value || "",
          location: selectedLandData.location || "",
        })
      }
    } else {
      setLandData({
        soilType: "",
        soilPh: "",
        soilMoisture: "",
        location: "",
      })
    }
  }

  const getCropRecommendations = async () => {
    if (!landData.soilType) {
      toast.error("Please enter soil type")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("http://localhost:5000/api/ai/crop-recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          landData,
          season,
        }),
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to get crop recommendations")
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to get crop recommendations")
      }

      setRecommendations(data.data)
    } catch (err) {
      setError(err.message)
      toast.error("Failed to get crop recommendations")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-t-xl">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-2 rounded-lg">
            <Sprout className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-white">Crop Recommendations</CardTitle>
            <CardDescription className="text-teal-100">
              AI-powered crop suggestions based on your land characteristics
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="landSelect">Select Land or Enter Manually</Label>
            <Select value={selectedLand} onValueChange={handleLandSelect}>
              <SelectTrigger id="landSelect" className="focus-visible:ring-teal-500">
                <SelectValue placeholder="Select a land plot or enter manually" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual Entry</SelectItem>
                {lands.map((land) => (
                  <SelectItem key={land._id} value={land._id}>
                    {land.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="soilType">Soil Type *</Label>
              <Input
                id="soilType"
                value={landData.soilType}
                onChange={(e) => setLandData({ ...landData, soilType: e.target.value })}
                placeholder="e.g., Clay, Sandy, Loam"
                required
                className="focus-visible:ring-teal-500"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="soilPh">Soil pH</Label>
              <Input
                id="soilPh"
                value={landData.soilPh}
                onChange={(e) => setLandData({ ...landData, soilPh: e.target.value })}
                placeholder="e.g., 6.5"
                type="number"
                min="0"
                max="14"
                step="0.1"
                className="focus-visible:ring-teal-500"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="soilMoisture">Soil Moisture (%)</Label>
              <Input
                id="soilMoisture"
                value={landData.soilMoisture}
                onChange={(e) => setLandData({ ...landData, soilMoisture: e.target.value })}
                placeholder="e.g., 40"
                type="number"
                min="0"
                max="100"
                className="focus-visible:ring-teal-500"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={landData.location}
                onChange={(e) => setLandData({ ...landData, location: e.target.value })}
                placeholder="e.g., Northern Region, Ghana"
                className="focus-visible:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="season">Season</Label>
            <Select value={season} onValueChange={setSeason}>
              <SelectTrigger id="season" className="focus-visible:ring-teal-500">
                <SelectValue placeholder="Select season" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Season</SelectItem>
                <SelectItem value="rainy">Rainy Season</SelectItem>
                <SelectItem value="dry">Dry Season</SelectItem>
                <SelectItem value="spring">Spring</SelectItem>
                <SelectItem value="summer">Summer</SelectItem>
                <SelectItem value="fall">Fall</SelectItem>
                <SelectItem value="winter">Winter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={getCropRecommendations} 
            disabled={loading} 
            className="flex items-center gap-2 mt-2 bg-teal-600 hover:bg-teal-700 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sprout className="h-4 w-4" />
                Get Crop Recommendations
              </>
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="border-red-500">
            <AlertTitle className="text-red-600">Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {recommendations ? (
          <div className="space-y-6 mt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700">Recommended Crops</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.recommendations?.map((crop, index) => (
                  <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Sprout className="h-4 w-4 text-teal-600" />
                          {crop.cropName}
                        </CardTitle>
                        <Badge variant="outline" className="bg-teal-100 text-teal-800">
                          {crop.suitabilityScore}% Suitable
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <div>
                        <h4 className="font-medium mb-1 text-gray-800">Why This Crop?</h4>
                        <p className="text-sm text-gray-700">{crop.reasoning}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-1 text-gray-800">Best Practices</h4>
                          <p className="text-sm text-gray-700">{crop.bestPractices}</p>
                        </div>

                        <div>
                          <h4 className="font-medium mb-1 text-gray-800">Expected Yield</h4>
                          <p className="text-sm text-gray-700">{crop.expectedYield}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-1 text-gray-800">Growth Duration</h4>
                          <p className="text-sm text-gray-700">{crop.growthDuration}</p>
                        </div>

                        <div>
                          <h4 className="font-medium mb-1 text-gray-800">Potential Challenges</h4>
                          <div className="flex flex-wrap gap-1">
                            {crop.potentialChallenges?.map((challenge, idx) => (
                              <Badge key={idx} variant="outline" className="text-red-600">
                                {challenge}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      {crop.companionPlants && crop.companionPlants.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-1 text-gray-800">Companion Plants</h4>
                          <div className="flex flex-wrap gap-1">
                            {crop.companionPlants?.map((plant, idx) => (
                              <Badge key={idx} variant="secondary">
                                {plant}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-700">Soil Improvement Suggestions</h3>
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <ul className="space-y-2">
                    {recommendations.soilImprovementSuggestions?.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 mt-0.5 text-teal-500 flex-shrink-0" />
                        <span className="text-gray-700">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-700">General Recommendations</h3>
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <p className="text-gray-700">{recommendations.generalRecommendations}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-teal-600 font-medium">Analyzing land characteristics...</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}