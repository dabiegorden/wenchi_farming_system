"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Loading from "@/components/loading"

export default function UserDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [weatherData, setWeatherData] = useState(null)
  const [weatherForecast, setWeatherForecast] = useState([])
  const [agriculturalData, setAgriculturalData] = useState(null)
  const [updates, setUpdates] = useState([])

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/auth/user-info", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        })

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/sign-in")
            return
          }
          throw new Error("Failed to fetch user information")
        }

        const data = await response.json()
        setUser(data.data.user)

        // If user is admin, redirect to admin dashboard
        if (data.data.user.role === "admin") {
          router.push("/admin/dashboard")
          return
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchUserInfo()
  }, [router])

  // Fetch weather data
  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/weather/current", {
          credentials: "include",
        })
        if (response.ok) {
          const data = await response.json()
          setWeatherData(data.data)
        }
      } catch (err) {
        console.error("Failed to fetch weather data:", err)
      }
    }

    const fetchWeatherForecast = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/weather/forecast", {
          credentials: "include",
        })
        if (response.ok) {
          const data = await response.json()
          setWeatherForecast(data.data.daily)
        }
      } catch (err) {
        console.error("Failed to fetch weather forecast:", err)
      }
    }

    const fetchAgriculturalData = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/weather/agricultural", {
          credentials: "include",
        })
        if (response.ok) {
          const data = await response.json()
          setAgriculturalData(data.data)
        }
      } catch (err) {
        console.error("Failed to fetch agricultural data:", err)
      }
    }

    fetchWeatherData()
    fetchWeatherForecast()
    fetchAgriculturalData()

    // Refresh weather data every 30 minutes
    const weatherInterval = setInterval(
      () => {
        fetchWeatherData()
        fetchWeatherForecast()
        fetchAgriculturalData()
      },
      30 * 60 * 1000,
    )

    return () => clearInterval(weatherInterval)
  }, [])

  // Mock function to fetch updates from admin
  // In a real application, this would be an API call to get updates
  useEffect(() => {
    // Simulating fetching updates from the backend
    const mockUpdates = [
      { id: 1, date: "2025-04-10", title: "New Crop Added", message: "Admin has added a new crop: Cassava" },
      { id: 2, date: "2025-04-09", title: "Weather Alert", message: "Heavy rainfall expected in the next week" },
      {
        id: 3,
        date: "2025-04-08",
        title: "Inventory Update",
        message: "New fertilizer stock has been added to inventory",
      },
    ]

    setUpdates(mockUpdates)
  }, [])

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true)

      const response = await fetch("http://localhost:5000/api/auth/signout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to sign out")
      }

      setUser(null)
      router.push("/sign-in")
    } catch (err) {
      setError(err.message)
      setIsLoggingOut(false)
    }
  }

  // Helper function to format dates for the forecast
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
  }

  // Helper function to get weather icon class
  const getWeatherIcon = (condition) => {
    switch (condition?.toLowerCase()) {
      case "clear":
        return "☀️"
      case "clouds":
        return "☁️"
      case "rain":
        return "🌧️"
      case "drizzle":
        return "🌦️"
      case "thunderstorm":
        return "⛈️"
      case "snow":
        return "❄️"
      case "atmosphere":
        return "🌫️"
      default:
        return "🌤️"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loading />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl font-semibold text-red-500">Error: {error}</p>
          <button
            onClick={() => router.push("/sign-in")}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-200 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6 bg-green-600 px-4 border-b border-green-600">
          <h1 className="text-3xl font-bold text-gray-50">Wenchi Farm Institute</h1>
          <button
            onClick={handleSignOut}
            disabled={isLoggingOut}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-slate-900 bg-gray-50 hover:bg-green-700 hover:text-white disabled:bg-green-500 cursor-pointer"
          >
            {isLoggingOut ? "Signing Out..." : "Sign Out"}
          </button>
        </div>

        {/* User Info Card */}
        <div className="py-6">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-bold text-gray-900">User Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and account information.</p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Full name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user?.name || "Not provided"}</dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Email address</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user?.email}</dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Account created</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleString() : "Not available"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Admin Updates Section */}
        <div className="mb-6">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-bold text-gray-900">Recent Updates</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Latest updates from administrators.</p>
            </div>
            <div className="border-t border-gray-200">
              {updates.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {updates.map((update) => (
                    <li key={update.id} className="px-4 py-4">
                      <div className="flex justify-between">
                        <h4 className="text-sm font-medium text-gray-900">{update.title}</h4>
                        <p className="text-sm text-gray-500">{formatDate(update.date)}</p>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{update.message}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-4 py-5 text-sm text-gray-500">No recent updates.</p>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {/* Weather Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Weather</h2>
              <Link href="/weather" className="text-sm text-green-600 hover:text-green-800">
                View Details
              </Link>
            </div>
            {weatherData ? (
              <div>
                <div className="flex items-center mb-4">
                  <span className="text-5xl mr-3">{getWeatherIcon(weatherData.condition)}</span>
                  <div>
                    <p className="text-3xl font-bold">{weatherData.temperature}°C</p>
                    <p className="text-gray-600 capitalize">{weatherData.description}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center py-10">
                <p className="text-gray-500">Loading weather data...</p>
              </div>
            )}
          </div>

          {/* Crops Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Crops</h2>
              <Link href="/dashboard/crops" className="text-sm text-green-600 hover:text-green-800">
                View Crops
              </Link>
            </div>
            <p className="text-gray-600">View crop information and planting schedules</p>
            <div className="mt-4">
              <Link
                href="/dashboard/crops"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                View Crops
              </Link>
            </div>
          </div>

          {/* Land Management Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Land Management</h2>
              <Link href="/dashboard/lands" className="text-sm text-green-600 hover:text-green-800">
                View Fields
              </Link>
            </div>
            <p className="text-gray-600">View field information and crop assignments</p>
            <div className="mt-4">
              <Link
                href="/dashboard/lands"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                View Land
              </Link>
            </div>
          </div>

          {/* Inventory Management Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Inventory </h2>
              <Link href="/dashboard/inventory" className="text-sm text-green-600 hover:text-green-800">
                View Inventory
              </Link>
            </div>
            <p className="text-gray-600">View field information and crop assignments</p>
            <div className="mt-4">
              <Link
                href="/dashboard/inventory"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                View Inventory
              </Link>
            </div>
          </div>

          {/* Report Management Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Report </h2>
              <Link href="/dashboard/reports" className="text-sm text-green-600 hover:text-green-800">
                View reports
              </Link>
            </div>
            <p className="text-gray-600">View field information and crop assignments</p>
            <div className="mt-4">
              <Link
                href="/dashboard/reports"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                View Report
              </Link>
            </div>
          </div>

          {/* Health Management Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Health </h2>
              <Link href="/dashboard/health" className="text-sm text-green-600 hover:text-green-800">
                View Health
              </Link>
            </div>
            <p className="text-gray-600">View field information and crop assignments</p>
            <div className="mt-4">
              <Link
                href="/dashboard/health"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                View Health
              </Link>
            </div>
          </div>

          {/* AI Management Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">AI </h2>
              <Link href="/dashboard/ai" className="text-sm text-green-600 hover:text-green-800">
                AI Analysis
              </Link>
            </div>
            <p className="text-gray-600">AI Analysis information and crop assignments</p>
            <div className="mt-4">
              <Link
                href="/dashboard/ai"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                AI Analysis
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
