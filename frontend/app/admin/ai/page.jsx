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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Features</h1>
          <p className="text-muted-foreground">Use AI to get insights and recommendations for your farm</p>
        </div>
      </div>

      <Tabs defaultValue="smart-notifications" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <TabsTrigger value="smart-notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Smart Notifications</span>
            <span className="sm:hidden">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="weather-analysis" className="flex items-center gap-2">
            <CloudRain className="h-4 w-4" />
            <span className="hidden sm:inline">Weather Analysis</span>
            <span className="sm:hidden">Weather</span>
          </TabsTrigger>
          <TabsTrigger value="crop-health" className="flex items-center gap-2">
            <Leaf className="h-4 w-4" />
            <span className="hidden sm:inline">Crop Health Analysis</span>
            <span className="sm:hidden">Health</span>
          </TabsTrigger>
          <TabsTrigger value="crop-recommendations" className="flex items-center gap-2">
            <Sprout className="h-4 w-4" />
            <span className="hidden sm:inline">Crop Recommendations</span>
            <span className="sm:hidden">Recommendations</span>
          </TabsTrigger>
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
        return <Info className="h-5 w-5 text-blue-600" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-600" />
      case "alert":
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case "success":
        return <Check className="h-5 w-5 text-green-600" />
      default:
        return <Bell className="h-5 w-5 text-purple-600" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          Smart Notifications Generator
        </CardTitle>
        <CardDescription>Generate AI-powered notifications based on your farm data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <Button onClick={generateNotifications} disabled={loading} className="flex items-center gap-2">
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
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              Create Selected Notifications ({selectedNotifications.length})
            </Button>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {notifications.length > 0 ? (
          <div className="space-y-4 mt-4">
            <h3 className="text-lg font-medium">Generated Notifications</h3>
            <div className="space-y-3">
              {notifications.map((notification, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 transition-colors ${
                    selectedNotifications.includes(index) ? "border-green-500 bg-green-50" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center h-6">
                      <Checkbox
                        checked={selectedNotifications.includes(index)}
                        onCheckedChange={() => toggleNotificationSelection(index)}
                        id={`notification-${index}`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
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
                        <Label htmlFor={`notification-${index}`} className="font-medium cursor-pointer">
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
                        >
                          {notification.priority}
                        </Badge>
                        <Badge variant="outline">{notification.category}</Badge>
                      </div>
                      <p className="text-muted-foreground ml-8">{notification.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Click the button above to generate AI-powered notifications based on your farm data
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CloudRain className="h-5 w-5 text-blue-600" />
          Weather Analysis for Agriculture
        </CardTitle>
        <CardDescription>Get AI-powered weather analysis and recommendations for your crops</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={analyzeWeather} disabled={loading} className="flex items-center gap-2">
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
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {weatherAnalysis ? (
          <div className="space-y-6 mt-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Weather Analysis</h3>
              <Card>
                <CardContent className="pt-6">
                  <p className="mb-4">{weatherAnalysis.weatherAnalysis?.summary}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Risks</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {weatherAnalysis.weatherAnalysis?.risks?.map((risk, index) => (
                          <li key={index} className="text-red-600">
                            {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Opportunities</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {weatherAnalysis.weatherAnalysis?.opportunities?.map((opportunity, index) => (
                          <li key={index} className="text-green-600">
                            {opportunity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">Crop-Specific Recommendations</h3>
              <div className="space-y-4">
                {weatherAnalysis.cropSpecificRecommendations?.map((crop, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-base">{crop.cropName}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Recommendations</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {crop.recommendations?.map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Warnings</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {crop.warnings?.map((warning, idx) => (
                            <li key={idx} className="text-amber-600">
                              {warning}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Irrigation Advice</h4>
                        <p>{crop.irrigationAdvice}</p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Pest & Disease Risks</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {crop.pestDiseaseRisks?.map((risk, idx) => (
                            <li key={idx} className="text-red-600">
                              {risk}
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
              <h3 className="text-lg font-medium">General Recommendations</h3>
              <Card>
                <CardContent className="pt-6">
                  <ul className="list-disc pl-5 space-y-1">
                    {weatherAnalysis.generalRecommendations?.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">Long-Term Outlook</h3>
              <Card>
                <CardContent className="pt-6">
                  <p>{weatherAnalysis.longTermOutlook}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Click the button above to analyze weather data for agricultural recommendations
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
  const [analysisType, setAnalysisType] = useState("symptoms") // symptoms or image
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
        // Split symptoms by commas
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
        // Handle image upload with progress tracking
        const formData = new FormData()
        formData.append("cropName", cropName)
        formData.append("image", imageFile)
        formData.append("analysisType", "image")

        // Create a custom fetch with upload progress
        const xhr = new XMLHttpRequest()

        // Create a promise to handle the XHR request
        const uploadPromise = new Promise((resolve, reject) => {
          xhr.open("POST", "http://localhost:5000/api/ai/analyze-crop-health", true)

          // Include credentials
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

        // Wait for the upload to complete
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

      // Show success message
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

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPEG, PNG, or WebP)")
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB")
      return
    }

    setImageFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "healthy":
        return "text-green-600"
      case "mild":
        return "text-amber-600"
      case "moderate":
        return "text-orange-600"
      case "severe":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-green-600" />
          Crop Health Analysis
        </CardTitle>
        <CardDescription>Analyze crop health based on symptoms or images</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="symptoms-analysis"
              checked={analysisType === "symptoms"}
              onCheckedChange={() => setAnalysisType("symptoms")}
            />
            <Label htmlFor="symptoms-analysis">Analyze by Symptoms</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="image-analysis"
              checked={analysisType === "image"}
              onCheckedChange={() => setAnalysisType("image")}
            />
            <Label htmlFor="image-analysis">Analyze by Image</Label>
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
                  className="max-w-sm"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("cropImage").click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Image
                </Button>
              </div>

              {imagePreview && (
                <div className="mt-2 border rounded-md overflow-hidden">
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

          <Button onClick={analyzeCropHealth} disabled={loading} className="flex items-center gap-2 mt-2">
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
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {analysisResult ? (
          <div className="space-y-4 mt-4 border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-medium">{analysisResult.disease}</h3>
              <Badge
                variant={analysisResult.severity === "healthy" ? "outline" : "default"}
                className={`${getSeverityColor(analysisResult.severity)}`}
              >
                {analysisResult.severity}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Confidence:</span>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-green-600 h-2.5 rounded-full"
                  style={{ width: `${analysisResult.confidenceLevel}%` }}
                ></div>
              </div>
              <span className="text-sm">{analysisResult.confidenceLevel}%</span>
            </div>

            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-muted-foreground">{analysisResult.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Recommended Treatments</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {analysisResult.recommendedTreatments?.map((treatment, index) => (
                    <li key={index}>{treatment}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Preventive Measures</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {analysisResult.preventiveMeasures?.map((measure, index) => (
                    <li key={index}>{measure}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Differential Diagnosis</h4>
              <div className="flex flex-wrap gap-2">
                {analysisResult.differentialDiagnosis?.map((diagnosis, index) => (
                  <Badge key={index} variant="outline">
                    {diagnosis}
                  </Badge>
                ))}
              </div>
            </div>

            {analysisResult.expectedProgression && (
              <div>
                <h4 className="font-medium mb-2">Expected Progression</h4>
                <p className="text-muted-foreground">{analysisResult.expectedProgression}</p>
              </div>
            )}

            {analysisResult.environmentalFactors && (
              <div>
                <h4 className="font-medium mb-2">Environmental Factors</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {analysisResult.environmentalFactors?.map((factor, index) => (
                    <li key={index}>{factor}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysisResult.affectedParts && (
              <div>
                <h4 className="font-medium mb-2">Affected Parts</h4>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.affectedParts?.map((part, index) => (
                    <Badge key={index} variant="secondary">
                      {part}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {analysisResult.visualSymptoms && (
              <div>
                <h4 className="font-medium mb-2">Visual Symptoms</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {analysisResult.visualSymptoms?.map((symptom, index) => (
                    <li key={index}>{symptom}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
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

  // Fetch lands on component mount
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
      // Reset form if "Manual Entry" is selected
      setLandData({
        soilType: "",
        soilPh: "",
        soilMoisture: "",
        location: "",
      })
    }
  }

  const getCropRecommendations = async () => {
    // Validate inputs
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sprout className="h-5 w-5 text-green-600" />
          Crop Recommendations
        </CardTitle>
        <CardDescription>Get AI-powered crop recommendations based on land characteristics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="landSelect">Select Land or Enter Manually</Label>
            <Select value={selectedLand} onValueChange={handleLandSelect}>
              <SelectTrigger id="landSelect">
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
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={landData.location}
                onChange={(e) => setLandData({ ...landData, location: e.target.value })}
                placeholder="e.g., Northern Region, Ghana"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="season">Season</Label>
            <Select value={season} onValueChange={setSeason}>
              <SelectTrigger id="season">
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

          <Button onClick={getCropRecommendations} disabled={loading} className="flex items-center gap-2 mt-2">
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
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {recommendations ? (
          <div className="space-y-6 mt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Recommended Crops</h3>
              <div className="space-y-4">
                {recommendations.recommendations?.map((crop, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{crop.cropName}</CardTitle>
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          {crop.suitabilityScore}% Suitable
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <div>
                        <h4 className="font-medium mb-1">Why This Crop?</h4>
                        <p className="text-sm text-muted-foreground">{crop.reasoning}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-1">Best Practices</h4>
                          <p className="text-sm text-muted-foreground">{crop.bestPractices}</p>
                        </div>

                        <div>
                          <h4 className="font-medium mb-1">Expected Yield</h4>
                          <p className="text-sm text-muted-foreground">{crop.expectedYield}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-1">Growth Duration</h4>
                          <p className="text-sm text-muted-foreground">{crop.growthDuration}</p>
                        </div>

                        <div>
                          <h4 className="font-medium mb-1">Potential Challenges</h4>
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
                          <h4 className="font-medium mb-1">Companion Plants</h4>
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
              <h3 className="text-lg font-medium">Soil Improvement Suggestions</h3>
              <Card>
                <CardContent className="pt-6">
                  <ul className="list-disc pl-5 space-y-1">
                    {recommendations.soilImprovementSuggestions?.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">General Recommendations</h3>
              <Card>
                <CardContent className="pt-6">
                  <p>{recommendations.generalRecommendations}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
