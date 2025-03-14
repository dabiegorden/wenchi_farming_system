const express = require('express');
const router = express.Router();

// OpenWeather API key and location
// Add these to your .env file:
// OPEN_WEATHER_API_KEY=01eeef9186c46ff905469f0a242a4d34
// FARM_LATITUDE=your_farm_latitude (e.g., 7.7340 for Wenchi, Ghana)
// FARM_LONGITUDE=your_farm_longitude (e.g., -2.1009 for Wenchi, Ghana)

router.get('/current', async (req, res) => {
  try {
    const apiKey = process.env.OPEN_WEATHER_API_KEY;
    const lat = process.env.FARM_LATITUDE || '7.7340';
    const lon = process.env.FARM_LONGITUDE || '-2.1009';
    
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    
    const weatherData = {
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      condition: data.weather[0].main,
      description: data.weather[0].description,
      windSpeed: data.wind.speed,
      precipitation: data.rain ? data.rain['1h'] || 0 : 0,
      uvIndex: calculateUVIndex(data.weather[0].id, data.clouds.all),
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
    const apiKey = process.env.OPEN_WEATHER_API_KEY;
    const lat = process.env.FARM_LATITUDE || '7.7340';
    const lon = process.env.FARM_LONGITUDE || '-2.1009';
    
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Process the forecast data - OpenWeather returns 5 day forecast in 3-hour intervals
    // Group by day to get daily forecasts
    const forecastMap = new Map();
    
    data.list.forEach(item => {
      const date = new Date(item.dt * 1000).toISOString().split('T')[0];
      
      if (!forecastMap.has(date)) {
        forecastMap.set(date, {
          temps: [],
          humidity: [],
          precipitation: [],
          weatherCodes: [],
          windSpeed: [],
          descriptions: []
        });
      }
      
      const dayData = forecastMap.get(date);
      dayData.temps.push(item.main.temp);
      dayData.humidity.push(item.main.humidity);
      dayData.precipitation.push(item.pop * 100); // Probability of precipitation is 0-1, convert to percentage
      dayData.weatherCodes.push(item.weather[0].id);
      dayData.windSpeed.push(item.wind.speed);
      dayData.descriptions.push(item.weather[0].description);
    });
    
    const dailyForecast = Array.from(forecastMap.entries()).map(([date, dayData]) => {
      const mostCommonWeatherCode = getMostFrequent(dayData.weatherCodes);
      
      return {
        date: date,
        temperatureMin: Math.round(Math.min(...dayData.temps)),
        temperatureMax: Math.round(Math.max(...dayData.temps)),
        humidity: Math.round(dayData.humidity.reduce((sum, val) => sum + val, 0) / dayData.humidity.length),
        precipitationProbability: Math.round(Math.max(...dayData.precipitation)),
        weatherCondition: getWeatherCondition(mostCommonWeatherCode),
        description: getMostFrequent(dayData.descriptions),
        windSpeed: Math.round((dayData.windSpeed.reduce((sum, val) => sum + val, 0) / dayData.windSpeed.length) * 10) / 10,
        uvIndex: calculateUVIndex(mostCommonWeatherCode, 0) // Cloud coverage would be ideal but we're estimating
      };
    });
    
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
    const apiKey = process.env.OPEN_WEATHER_API_KEY;
    const lat = process.env.FARM_LATITUDE || '7.7340';
    const lon = process.env.FARM_LONGITUDE || '-2.1009';
    
    // Get both current and forecast data
    const currentResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
    );
    
    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
    );
    
    if (!currentResponse.ok || !forecastResponse.ok) {
      throw new Error('Failed to fetch complete agricultural data');
    }
    
    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();
    
    // For soil moisture, we'll need to estimate based on rainfall and other factors
    // since OpenWeather doesn't provide this directly
    const estimateSoilMoisture = (rainAmount, humidity, temp) => {
      // Simple estimation algorithm - in a real app, you'd use a more sophisticated model
      let moisture = 40; // Base value (0-100 scale)
      
      // Recent rain increases soil moisture
      moisture += rainAmount * 20;
      
      // Higher humidity slightly increases soil moisture
      moisture += (humidity - 50) * 0.2;
      
      // Higher temperatures decrease soil moisture through evaporation
      moisture -= (temp - 20) * 0.5;
      
      // Clamp between 0-100
      return Math.max(0, Math.min(100, moisture));
    };
    
    // Process forecast data for agricultural metrics
    const forecastMap = new Map();
    
    forecastData.list.forEach(item => {
      const date = new Date(item.dt * 1000).toISOString().split('T')[0];
      
      if (!forecastMap.has(date)) {
        forecastMap.set(date, {
          temps: [],
          humidity: [],
          precipitation: [],
          uvIndices: []
        });
      }
      
      const dayData = forecastMap.get(date);
      dayData.temps.push(item.main.temp);
      dayData.humidity.push(item.main.humidity);
      dayData.precipitation.push(item.pop * 100); // Probability of precipitation
      dayData.uvIndices.push(calculateUVIndex(item.weather[0].id, item.clouds.all));
    });
    
    // Get current rain amount, or 0 if none
    const currentRainAmount = currentData.rain ? currentData.rain['1h'] || 0 : 0;
    
    // Compile agricultural-specific metrics
    const agriculturalData = {
      current: {
        soilMoisture: estimateSoilMoisture(currentRainAmount, currentData.main.humidity, currentData.main.temp),
        precipitation: currentData.rain ? currentData.rain['1h'] || 0 : 0,
        temperature: currentData.main.temp,
        humidity: currentData.main.humidity,
        uvIndex: calculateUVIndex(currentData.weather[0].id, currentData.clouds.all),
        windSpeed: currentData.wind.speed,
        timestamp: new Date()
      },
      forecast: Array.from(forecastMap.entries()).map(([date, dayData]) => {
        const avgTemp = dayData.temps.reduce((sum, val) => sum + val, 0) / dayData.temps.length;
        const avgHumidity = dayData.humidity.reduce((sum, val) => sum + val, 0) / dayData.humidity.length;
        const maxPrecip = Math.max(...dayData.precipitation);
        
        return {
          date: date,
          precipitationProbability: Math.round(maxPrecip),
          temperatureMin: Math.round(Math.min(...dayData.temps)),
          temperatureMax: Math.round(Math.max(...dayData.temps)),
          soilMoisture: estimateSoilMoisture(maxPrecip / 100, avgHumidity, avgTemp),
          uvIndex: Math.round((dayData.uvIndices.reduce((sum, val) => sum + val, 0) / dayData.uvIndices.length) * 10) / 10
        };
      })
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

// Add city search endpoint
router.get('/by-city', async (req, res) => {
  try {
    const apiKey = process.env.OPEN_WEATHER_API_KEY;
    const city = req.query.city;
    
    if (!city) {
      return res.status(400).json({
        success: false,
        message: 'City name is required'
      });
    }
    
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`
    );
    
    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({
          success: false,
          message: 'City not found'
        });
      }
      throw new Error(`API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    
    const weatherData = {
      city: data.name,
      country: data.sys.country,
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      condition: data.weather[0].main,
      description: data.weather[0].description,
      windSpeed: data.wind.speed,
      precipitation: data.rain ? data.rain['1h'] || 0 : 0,
      uvIndex: calculateUVIndex(data.weather[0].id, data.clouds.all),
      timestamp: new Date()
    };
    
    return res.status(200).json({
      success: true,
      data: weatherData
    });
  } catch (error) {
    console.error('City weather API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch city weather data'
    });
  }
});

// Helper function to get the most frequent element in an array
function getMostFrequent(arr) {
  const counts = {};
  let maxCount = 0;
  let maxItem = null;
  
  for (const item of arr) {
    counts[item] = (counts[item] || 0) + 1;
    if (counts[item] > maxCount) {
      maxCount = counts[item];
      maxItem = item;
    }
  }
  
  return maxItem;
}

// Helper function to estimate UV index based on weather code and cloud coverage
function calculateUVIndex(weatherCode, cloudCoverage) {
  // Base UV index - would be more accurate with solar position data
  let uvBase = 5; // Medium UV on a clear day
  
  // Reduce for cloud coverage
  uvBase = uvBase * (1 - (cloudCoverage / 100) * 0.75);
  
  // Further reduce for precipitation weather conditions
  if (weatherCode >= 200 && weatherCode < 700) {
    uvBase *= 0.3; // Significant reduction for rain, snow, etc.
  }
  
  return Math.round(uvBase * 10) / 10;
}

// Helper function to convert OpenWeather weather codes to conditions
function getWeatherCondition(weatherCode) {
  if (weatherCode >= 200 && weatherCode < 300) {
    return 'Thunderstorm';
  } else if (weatherCode >= 300 && weatherCode < 400) {
    return 'Drizzle';
  } else if (weatherCode >= 500 && weatherCode < 600) {
    return 'Rain';
  } else if (weatherCode >= 600 && weatherCode < 700) {
    return 'Snow';
  } else if (weatherCode >= 700 && weatherCode < 800) {
    return 'Atmosphere'; // Mist, smoke, haze, etc.
  } else if (weatherCode === 800) {
    return 'Clear';
  } else if (weatherCode > 800 && weatherCode < 900) {
    return 'Clouds';
  } else {
    return 'Unknown';
  }
}

module.exports = router;