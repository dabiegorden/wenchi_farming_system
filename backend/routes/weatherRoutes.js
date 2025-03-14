// In your Express.js backend (e.g., routes/weather.js)
const express = require('express');
const router = express.Router();

// Tomorrow.io API key and location
// Add these to your .env file:
// TOMORROW_API_KEY=LtAGhmdELG9Dg8Go5AGMKAXpIWQs70hb
// FARM_LATITUDE=your_farm_latitude (e.g., 7.7340 for Wenchi, Ghana)
// FARM_LONGITUDE=your_farm_longitude (e.g., -2.1009 for Wenchi, Ghana)

router.get('/current', async (req, res) => {
  try {
    const apiKey = process.env.TOMORROW_API_KEY || 'LtAGhmdELG9Dg8Go5AGMKAXpIWQs70hb';
    const lat = process.env.FARM_LATITUDE || '7.7340';
    const lon = process.env.FARM_LONGITUDE || '-2.1009';
    
    const response = await fetch(
      `https://api.tomorrow.io/v4/weather/realtime?location=${lat},${lon}&apikey=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    
    const weatherData = {
      temperature: Math.round(data.data.values.temperature),
      humidity: data.data.values.humidity,
      condition: getWeatherCondition(data.data.values.weatherCode),
      description: getWeatherDescription(data.data.values.weatherCode),
      windSpeed: data.data.values.windSpeed,
      precipitation: data.data.values.precipitationProbability,
      uvIndex: data.data.values.uvIndex,
      timestamp: new Date()
    };
    
    // Cache this data in your database if needed
    
    return res.status(200).json({
      success: true,
      data: weatherData
    });
  } catch (error) {
    console.error('Weather API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch weather data'
    });
  }
});

// Add forecast endpoint
router.get('/forecast', async (req, res) => {
  try {
    const apiKey = process.env.TOMORROW_API_KEY;
    const lat = process.env.FARM_LATITUDE || '7.7340';
    const lon = process.env.FARM_LONGITUDE || '-2.1009';
    
    const response = await fetch(
      `https://api.tomorrow.io/v4/weather/forecast?location=${lat},${lon}&apikey=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Process the forecast data - Tomorrow.io returns hourly and daily forecasts
    const dailyForecast = data.timelines.daily.map(day => ({
      date: day.time,
      temperatureMin: Math.round(day.values.temperatureMin),
      temperatureMax: Math.round(day.values.temperatureMax),
      humidity: day.values.humidityAvg,
      precipitationProbability: day.values.precipitationProbabilityAvg,
      weatherCondition: getWeatherCondition(day.values.weatherCodeMax),
      description: getWeatherDescription(day.values.weatherCodeMax),
      windSpeed: day.values.windSpeedAvg,
      uvIndex: day.values.uvIndexAvg
    }));
    
    return res.status(200).json({
      success: true,
      data: {
        daily: dailyForecast
      }
    });
  } catch (error) {
    console.error('Weather forecast API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch weather forecast'
    });
  }
});

// Add agricultural-specific data endpoint
router.get('/agricultural', async (req, res) => {
  try {
    const apiKey = process.env.TOMORROW_API_KEY;
    const lat = process.env.FARM_LATITUDE || '7.7340';
    const lon = process.env.FARM_LONGITUDE || '-2.1009';
    
    // Get both realtime and forecast data for agricultural metrics
    const realtimeResponse = await fetch(
      `https://api.tomorrow.io/v4/weather/realtime?location=${lat},${lon}&apikey=${apiKey}`
    );
    
    const forecastResponse = await fetch(
      `https://api.tomorrow.io/v4/weather/forecast?location=${lat},${lon}&apikey=${apiKey}`
    );
    
    if (!realtimeResponse.ok || !forecastResponse.ok) {
      throw new Error('Failed to fetch complete agricultural data');
    }
    
    const realtimeData = await realtimeResponse.json();
    const forecastData = await forecastResponse.json();
    
    // Compile agricultural-specific metrics
    const agriculturalData = {
      current: {
        soilMoisture: realtimeData.data.values.soilMoisture,
        precipitation: realtimeData.data.values.precipitationProbability,
        temperature: realtimeData.data.values.temperature,
        humidity: realtimeData.data.values.humidity,
        uvIndex: realtimeData.data.values.uvIndex,
        windSpeed: realtimeData.data.values.windSpeed,
        timestamp: new Date()
      },
      forecast: forecastData.timelines.daily.map(day => ({
        date: day.time,
        precipitationProbability: day.values.precipitationProbabilityAvg,
        temperatureMin: day.values.temperatureMin,
        temperatureMax: day.values.temperatureMax,
        soilMoisture: day.values.soilMoistureAvg,
        uvIndex: day.values.uvIndexAvg
      }))
    };
    
    return res.status(200).json({
      success: true,
      data: agriculturalData
    });
  } catch (error) {
    console.error('Agricultural weather data error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch agricultural weather data'
    });
  }
});

// Helper function to convert Tomorrow.io weather codes to conditions
function getWeatherCondition(weatherCode) {
  const weatherCodes = {
    0: 'Clear',
    1000: 'Clear',
    1001: 'Cloudy',
    1100: 'Mostly Clear',
    1101: 'Partly Cloudy',
    1102: 'Mostly Cloudy',
    2000: 'Fog',
    2100: 'Light Fog',
    3000: 'Light Wind',
    3001: 'Wind',
    3002: 'Strong Wind',
    4000: 'Drizzle',
    4001: 'Rain',
    4200: 'Light Rain',
    4201: 'Heavy Rain',
    5000: 'Snow',
    5001: 'Flurries',
    5100: 'Light Snow',
    5101: 'Heavy Snow',
    6000: 'Freezing Drizzle',
    6001: 'Freezing Rain',
    6200: 'Light Freezing Rain',
    6201: 'Heavy Freezing Rain',
    7000: 'Ice Pellets',
    7101: 'Heavy Ice Pellets',
    7102: 'Light Ice Pellets',
    8000: 'Thunderstorm'
  };
  
  return weatherCodes[weatherCode] || 'Unknown';
}

// Helper function to get more descriptive weather
function getWeatherDescription(weatherCode) {
  const descriptions = {
    0: 'Clear conditions',
    1000: 'Clear skies',
    1001: 'Cloudy conditions',
    1100: 'Mostly clear with few clouds',
    1101: 'Partly cloudy conditions',
    1102: 'Mostly cloudy with some sun',
    2000: 'Foggy conditions',
    2100: 'Light fog present',
    3000: 'Light winds',
    3001: 'Windy conditions',
    3002: 'Strong winds, take caution',
    4000: 'Light drizzle',
    4001: 'Rainy conditions',
    4200: 'Light rain showers',
    4201: 'Heavy rainfall',
    5000: 'Snowy conditions',
    5001: 'Snow flurries',
    5100: 'Light snowfall',
    5101: 'Heavy snowfall',
    6000: 'Freezing drizzle, caution advised',
    6001: 'Freezing rain, caution advised',
    6200: 'Light freezing rain',
    6201: 'Heavy freezing rain',
    7000: 'Ice pellets (sleet)',
    7101: 'Heavy ice pellets',
    7102: 'Light ice pellets',
    8000: 'Thunderstorm activity'
  };
  
  return descriptions[weatherCode] || 'Weather conditions unavailable';
}

module.exports = router;