"use client"

import React, { useState, useEffect } from 'react';
import Loading from '@/components/loading';

const Weather = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('current');
  const [weatherData, setWeatherData] = useState(null);
  const [weatherForecast, setWeatherForecast] = useState(null);
  const [agriculturalData, setAgriculturalData] = useState(null);
  const [error, setError] = useState('');
  const [city, setCity] = useState('');
  const [cityWeather, setCityWeather] = useState(null);
  const [cityError, setCityError] = useState('');

  // Weather icons mapping based on conditions
  const weatherIcons = {
    'Clear': '☀️',
    'Mostly Clear': '🌤️',
    'Partly Cloudy': '⛅',
    'Mostly Cloudy': '🌥️',
    'Cloudy': '☁️',
    'Clouds': '☁️',
    'Fog': '🌫️',
    'Light Fog': '🌫️',
    'Light Wind': '🍃',
    'Wind': '💨',
    'Strong Wind': '🌬️',
    'Drizzle': '🌦️',
    'Rain': '🌧️',
    'Light Rain': '🌦️',
    'Heavy Rain': '⛈️',
    'Snow': '❄️',
    'Flurries': '🌨️',
    'Light Snow': '🌨️',
    'Heavy Snow': '❄️',
    'Freezing Drizzle': '🌧️❄️',
    'Freezing Rain': '🌧️❄️',
    'Ice Pellets': '🧊',
    'Thunderstorm': '⛈️',
    'Atmosphere': '🌫️'
  };

  // Fetch all weather data
  useEffect(() => {
    const fetchAllWeatherData = async () => {
      setLoading(true);
      try {
        // Update API endpoints based on the backend routes
        const currentResponse = await fetch('/api/weather/current', {
          credentials: 'include'
        });
        
        const forecastResponse = await fetch('/api/weather/forecast', {
          credentials: 'include'
        });
        
        const agricultureResponse = await fetch('/api/weather/agricultural', {
          credentials: 'include'
        });
        
        if (currentResponse.ok) {
          const data = await currentResponse.json();
          setWeatherData(data.data);
        } else {
          console.error('Failed to fetch current weather:', await currentResponse.text());
        }
        
        if (forecastResponse.ok) {
          const data = await forecastResponse.json();
          setWeatherForecast(data.data.daily);
        } else {
          console.error('Failed to fetch forecast:', await forecastResponse.text());
        }
        
        if (agricultureResponse.ok) {
          const data = await agricultureResponse.json();
          setAgriculturalData(data.data);
        } else {
          console.error('Failed to fetch agricultural data:', await agricultureResponse.text());
        }
      } catch (err) {
        console.error('Failed to fetch weather data:', err);
        setError('Unable to load weather data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllWeatherData();
    
    // Refresh weather data every 30 minutes
    const weatherInterval = setInterval(fetchAllWeatherData, 30 * 60 * 1000);
    
    return () => clearInterval(weatherInterval);
  }, []);

  // Handle city search
  const handleCitySearch = async (e) => {
    e.preventDefault();
    if (!city.trim()) return;
    
    try {
      setCityError('');
      const response = await fetch(`/api/weather/by-city?city=${encodeURIComponent(city)}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        setCityError(errorData.message || 'Failed to fetch weather data for this city');
        setCityWeather(null);
        return;
      }
      
      const data = await response.json();
      setCityWeather(data.data);
    } catch (err) {
      console.error('City search error:', err);
      setCityError('An error occurred while searching for this city');
      setCityWeather(null);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get weather advice based on conditions
  const getWeatherAdvice = () => {
    if (!weatherData) return null;
    
    const { temperature, condition, precipitation, uvIndex } = weatherData;
    
    if (condition.includes('Rain') || precipitation > 50) {
      return "Consider delaying outdoor farm activities. Ensure proper drainage systems are working.";
    } else if (temperature > 32) {
      return "High temperatures may stress crops. Ensure adequate irrigation and consider shade for sensitive plants.";
    } else if (uvIndex > 8) {
      return "High UV levels today. Consider working in early morning or late afternoon.";
    } else if (condition.includes('Wind') || condition.includes('Strong Wind')) {
      return "Windy conditions expected. Secure any loose structures or equipment on the farm.";
    }
    
    return "Weather conditions are favorable for most farm activities today.";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Farm Weather Dashboard</h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      {/* City Search Form */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="p-4">
          <h2 className="text-lg font-medium mb-3">Search Weather by City</h2>
          <form onSubmit={handleCitySearch} className="flex">
            <input
              type="text"
              className="flex-grow px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter city name..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Search
            </button>
          </form>
          
          {cityError && (
            <p className="mt-2 text-red-600 text-sm">{cityError}</p>
          )}
          
          {cityWeather && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{cityWeather.city}, {cityWeather.country}</h3>
                  <div className="flex items-center mt-2">
                    <span className="text-4xl mr-3">{weatherIcons[cityWeather.condition] || '🌡️'}</span>
                    <div>
                      <p className="text-3xl font-bold">{cityWeather.temperature}°C</p>
                      <p className="text-gray-600">{cityWeather.description}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Humidity: {cityWeather.humidity}%</p>
                  <p className="text-sm text-gray-500">Wind: {cityWeather.windSpeed} km/h</p>
                  <p className="text-sm text-gray-500">UV Index: {cityWeather.uvIndex}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button 
          className={`py-2 px-4 font-medium ${activeTab === 'current' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('current')}
        >
          Current Weather
        </button>
        <button 
          className={`py-2 px-4 font-medium ${activeTab === 'forecast' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('forecast')}
        >
          5-Day Forecast
        </button>
        <button 
          className={`py-2 px-4 font-medium ${activeTab === 'agriculture' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('agriculture')}
        >
          Agricultural Data
        </button>
      </div>
      
      {/* Current Weather Tab */}
      {activeTab === 'current' && weatherData && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center mb-4 md:mb-0">
                <span className="text-6xl mr-4">{weatherIcons[weatherData.condition] || '🌡️'}</span>
                <div>
                  <h2 className="text-4xl font-bold">{weatherData.temperature}°C</h2>
                  <p className="text-xl text-gray-600">{weatherData.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-gray-500">{new Date(weatherData.timestamp).toLocaleTimeString()} - Wenchi, Ghana</p>
              </div>
            </div>
            
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Humidity</p>
                <p className="text-xl font-semibold">{weatherData.humidity}%</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Wind Speed</p>
                <p className="text-xl font-semibold">{weatherData.windSpeed} km/h</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Precipitation</p>
                <p className="text-xl font-semibold">{weatherData.precipitation} mm</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">UV Index</p>
                <p className="text-xl font-semibold">{weatherData.uvIndex}</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <h3 className="text-lg font-semibold text-yellow-800">Farm Advisory</h3>
              <p className="text-yellow-700">{getWeatherAdvice()}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Forecast Tab */}
      {activeTab === 'forecast' && weatherForecast && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">5-Day Weather Forecast</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {weatherForecast.slice(0, 5).map((day, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="font-medium">{formatDate(day.date)}</p>
                  <div className="text-4xl my-2">{weatherIcons[day.weatherCondition] || '🌡️'}</div>
                  <p className="text-xl font-bold">{day.temperatureMax}°C</p>
                  <p className="text-sm text-gray-500">{day.temperatureMin}°C</p>
                  <p className="mt-2 text-sm">{day.description}</p>
                  <div className="mt-3 text-xs text-gray-500">
                    <p>Rain: {day.precipitationProbability}%</p>
                    <p>Humidity: {day.humidity}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
{/* Agricultural Data Tab */}
{activeTab === 'agriculture' && agriculturalData && (
  <div className="bg-white shadow rounded-lg overflow-hidden">
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Agricultural Weather Metrics</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Current Soil & Crop Conditions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Soil Moisture</p>
            <p className="text-xl font-semibold">
              {agriculturalData.current.soilMoisture.toFixed(1)}%
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Temperature</p>
            <p className="text-xl font-semibold">
              {agriculturalData.current.temperature.toFixed(1)}°C
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Humidity</p>
            <p className="text-xl font-semibold">
              {agriculturalData.current.humidity}%
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Precipitation</p>
            <p className="text-xl font-semibold">
              {agriculturalData.current.precipitation} mm
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">UV Index</p>
            <p className="text-xl font-semibold">
              {agriculturalData.current.uvIndex}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Wind Speed</p>
            <p className="text-xl font-semibold">
              {agriculturalData.current.windSpeed} km/h
            </p>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-3">Agricultural Forecast</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Soil Moisture</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min/Max Temp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precipitation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UV Index</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {agriculturalData.forecast.slice(0, 7).map((day, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">{formatDate(day.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {day.soilMoisture.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {day.temperatureMin}°C / {day.temperatureMax}°C
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{day.precipitationProbability}%</td>
                  <td className="px-6 py-4 whitespace-nowrap">{day.uvIndex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-100">
        <h3 className="text-lg font-semibold text-green-800">Agricultural Advisory</h3>
        {agriculturalData.current.soilMoisture < 30 ? (
          <p className="text-green-700">Soil moisture levels are low. Consider irrigation for optimal crop health.</p>
        ) : agriculturalData.current.soilMoisture > 70 ? (
          <p className="text-green-700">Soil moisture levels are high. Monitor drainage to prevent waterlogging.</p>
        ) : (
          <p className="text-green-700">Soil moisture levels are optimal for most crops.</p>
        )}
        
        {agriculturalData.current.uvIndex > 8 && (
          <p className="text-green-700 mt-2">High UV index. Consider providing shade for sensitive crops and limiting midday field work.</p>
        )}
        
        {agriculturalData.current.precipitation > 0 && (
          <p className="text-green-700 mt-2">Recent precipitation detected. Consider adjusting irrigation schedules accordingly.</p>
        )}
      </div>
    </div>
  </div>
)}
      
      <div className="mt-6 text-sm text-gray-500 text-center">
        <p>Weather data provided by Tomorrow.io API • Last updated: {weatherData && new Date(weatherData.timestamp).toLocaleString()}</p>
      </div>
    </main>
  );
};

export default Weather;