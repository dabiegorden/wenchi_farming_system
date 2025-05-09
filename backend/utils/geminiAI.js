const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

// Initialize the Gemini API with your API key
const initGeminiAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }
  return new GoogleGenerativeAI(apiKey);
};

// Function to analyze crop health based on symptoms
const analyzeCropHealthBySymptoms = async (cropName, symptoms) => {
  try {
    const genAI = initGeminiAI();

    const prompt = ` 
      As an agricultural expert specializing in crop diseases and health assessment, analyze the following symptoms for ${cropName} and provide a detailed assessment.
      
      Crop: ${cropName}
      Symptoms: ${symptoms.join(", ")} 
      
      Consider the following in your analysis:
      - Common diseases that affect ${cropName}
      - How the symptoms correlate with specific diseases
      - The progression stage based on the symptoms
      - Environmental factors that might contribute to these symptoms
      - Potential secondary infections or complications
      
      Please provide the following information in JSON format: 
      {
        "disease": "Most likely disease or condition name",
        "confidenceLevel": number between 0-100,
        "description": "Detailed description of the disease and how it manifests",
        "severity": "healthy", "mild", "moderate", or "severe",
        "recommendedTreatments": ["treatment1", "treatment2", ...],
        "preventiveMeasures": ["measure1", "measure2", ...],
        "differentialDiagnosis": ["other possible condition1", "condition2", ...],
        "expectedProgression": "What will happen if left untreated",
        "environmentalFactors": ["factor1", "factor2", ...]
      }
      
      Return ONLY the JSON object without any additional text.
    `;

    // Get the generative model - updated to use gemini-1.5-flash
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*?}/);
    let parsedResponse;

    if (jsonMatch) {
      try {
        parsedResponse = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch (e) {
        console.error("JSON parsing error:", e);
        // If JSON parsing fails, attempt to extract JSON more aggressively
        const potentialJson = text.replace(/```json|```/g, "").trim();
        try {
          parsedResponse = JSON.parse(potentialJson);
        } catch (e2) {
          // If still fails, return the raw text
          parsedResponse = { rawResponse: text };
        }
      }
    } else {
      parsedResponse = { rawResponse: text };
    }

    return {
      success: true,
      data: parsedResponse,
    };
  } catch (error) {
    console.error("Gemini AI analysis error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Function to analyze crop health based on image
const analyzeCropHealthByImage = async (cropName, imagePath) => {
  try {
    const genAI = initGeminiAI();

    // Read the image file
    const imageData = fs.readFileSync(imagePath);
    // Convert the image to a base64 string
    const imageBase64 = imageData.toString("base64");
    const mimeType = path.extname(imagePath).toLowerCase() === ".png" ? "image/png" : "image/jpeg";

    const prompt = ` 
      As an agricultural expert specializing in crop diseases and visual diagnosis, analyze this image of ${cropName} and provide a detailed health assessment.
      
      Consider the following in your analysis:
      - Visual symptoms visible in the image (discoloration, spots, wilting, etc.)
      - Common diseases that affect ${cropName} with these visual symptoms
      - The progression stage based on the visual evidence
      - Parts of the plant affected (leaves, stems, fruits, etc.)
      - Severity of the condition
      
      Please provide the following information in JSON format: 
      {
        "disease": "Most likely disease or condition name (or 'healthy' if no issues detected)",
        "confidenceLevel": number between 0-100,
        "description": "Detailed description of what you observe in the image",
        "severity": "healthy", "mild", "moderate", or "severe",
        "affectedParts": ["part1", "part2", ...],
        "visualSymptoms": ["symptom1", "symptom2", ...],
        "recommendedTreatments": ["treatment1", "treatment2", ...],
        "preventiveMeasures": ["measure1", "measure2", ...],
        "differentialDiagnosis": ["other possible condition1", "condition2", ...]
      }
      
      Return ONLY the JSON object without any additional text.
    `;

    // Create a model instance - updated to use gemini-1.5-flash which supports multimodal input
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Generate content using the correct format for image data
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: mimeType,
          data: imageBase64,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*?}/);
    let parsedResponse;

    if (jsonMatch) {
      try {
        parsedResponse = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch (e) {
        console.error("JSON parsing error:", e);
        // If JSON parsing fails, attempt to extract JSON more aggressively
        const potentialJson = text.replace(/```json|```/g, "").trim();
        try {
          parsedResponse = JSON.parse(potentialJson);
        } catch (e2) {
          // If still fails, return the raw text
          parsedResponse = { rawResponse: text };
        }
      }
    } else {
      parsedResponse = { rawResponse: text };
    }

    return {
      success: true,
      data: parsedResponse,
    };
  } catch (error) {
    console.error("Gemini AI image analysis error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Function to get crop recommendations for a land plot
const getCropRecommendations = async (landData, season) => {
  try {
    const genAI = initGeminiAI();

    const prompt = ` 
      As an agricultural expert specializing in crop selection and land optimization, recommend suitable crops for a land with the following characteristics:
      
      Land details:
      - Soil type: ${landData.soilType || "Unknown"} 
      - Soil pH: ${landData.soilPh || "Unknown"} 
      - Soil moisture: ${landData.soilMoisture?.value || landData.soilMoisture || "Unknown"}% 
      - Location: ${landData.location || "Unknown"} 
      - Season: ${season || "Current"} 
      
      Consider the following factors in your recommendations:
      - Soil compatibility (pH, type, drainage requirements)
      - Water requirements vs. available soil moisture
      - Seasonal suitability
      - Crop rotation best practices
      - Potential yield and economic value
      - Disease resistance
      - Local market demand (if location is specified)
      
      Please provide recommendations in JSON format with the following structure:
      {
        "recommendations": [
          {
            "cropName": "Crop name",
            "suitabilityScore": number between 0-100,
            "reasoning": "Detailed explanation of why this crop is suitable",
            "bestPractices": "Specific planting and care recommendations for this land",
            "expectedYield": "Estimated yield per hectare under optimal conditions",
            "growthDuration": "Estimated time from planting to harvest",
            "potentialChallenges": ["challenge1", "challenge2", ...],
            "companionPlants": ["plant1", "plant2", ...]
          }
        ],
        "soilImprovementSuggestions": ["suggestion1", "suggestion2", ...],
        "generalRecommendations": "Overall advice for this land"
      }
      
      Provide at least 5 crop recommendations, sorted by suitability score in descending order.
      Return ONLY the JSON object without any additional text.
    `;

    // Get the generative model - updated to use gemini-1.5-flash
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*?}/);
    let parsedResponse;

    if (jsonMatch) {
      try {
        parsedResponse = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch (e) {
        console.error("JSON parsing error:", e);
        // If JSON parsing fails, attempt to extract JSON more aggressively
        const potentialJson = text.replace(/```json|```/g, "").trim();
        try {
          parsedResponse = JSON.parse(potentialJson);
        } catch (e2) {
          // If still fails, return the raw text
          parsedResponse = { rawResponse: text };
        }
      }
    } else {
      parsedResponse = { rawResponse: text };
    }

    return {
      success: true,
      data: parsedResponse,
    };
  } catch (error) {
    console.error("Gemini AI crop recommendations error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Function to generate smart notifications based on farm data
const generateSmartNotifications = async (farmData) => {
  try {
    const genAI = initGeminiAI();

    const prompt = `
      As an agricultural AI assistant, analyze the following farm data and generate smart notifications that would be helpful for the farm manager:
      
      Farm data:
      ${JSON.stringify(farmData, null, 2)}
      
      Generate notifications for any of the following situations:
      - Low inventory items that need reordering
      - Crops approaching harvest time
      - Potential disease outbreaks based on weather conditions
      - Maintenance needs for land plots
      - Optimal planting times based on season and weather
      - Irrigation recommendations based on soil moisture and weather forecast
      - Pest control recommendations based on season and crop types
      
      Please provide the notifications in JSON format with the following structure:
      {
        "notifications": [
          {
            "title": "Short, attention-grabbing title",
            "message": "Detailed message with specific recommendations",
            "type": "info", "warning", "alert", "success", or "task",
            "priority": "low", "medium", or "high",
            "category": "inventory", "crop", "land", "health", "weather", or "other",
            "isActionRequired": true or false,
            "suggestedAction": "Specific action the user should take"
          }
        ]
      }
      
      Generate up to 5 of the most important notifications based on the data.
      Return ONLY the JSON object without any additional text.
    `;

    // Get the generative model - updated to use gemini-1.5-flash
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*?}/);
    let parsedResponse;

    if (jsonMatch) {
      try {
        parsedResponse = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch (e) {
        console.error("JSON parsing error:", e);
        // If JSON parsing fails, attempt to extract JSON more aggressively
        const potentialJson = text.replace(/```json|```/g, "").trim();
        try {
          parsedResponse = JSON.parse(potentialJson);
        } catch (e2) {
          // If still fails, return the raw text
          parsedResponse = { rawResponse: text };
        }
      }
    } else {
      parsedResponse = { rawResponse: text };
    }

    return {
      success: true,
      data: parsedResponse,
    };
  } catch (error) {
    console.error("Gemini AI smart notifications error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Function to analyze weather data and provide agricultural recommendations
const analyzeWeatherForAgriculture = async (weatherData, crops) => {
  try {
    const genAI = initGeminiAI();

    const prompt = `
      As an agricultural meteorologist, analyze the following weather data and provide recommendations for the specified crops:
      
      Weather data:
      ${JSON.stringify(weatherData, null, 2)}
      
      Crops being grown:
      ${JSON.stringify(crops, null, 2)}
      
      Please provide the following information in JSON format:
      {
        "weatherAnalysis": {
          "summary": "Overall assessment of the weather conditions",
          "risks": ["risk1", "risk2", ...],
          "opportunities": ["opportunity1", "opportunity2", ...]
        },
        "cropSpecificRecommendations": [
          {
            "cropName": "Name of the crop",
            "recommendations": ["recommendation1", "recommendation2", ...],
            "warnings": ["warning1", "warning2", ...],
            "irrigationAdvice": "Specific irrigation recommendations",
            "pestDiseaseRisks": ["risk1", "risk2", ...]
          }
        ],
        "generalRecommendations": ["recommendation1", "recommendation2", ...],
        "longTermOutlook": "Assessment of longer-term weather patterns and implications"
      }
      
      Return ONLY the JSON object without any additional text.
    `;

    // Get the generative model - updated to use gemini-1.5-flash
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*?}/);
    let parsedResponse;

    if (jsonMatch) {
      try {
        parsedResponse = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch (e) {
        console.error("JSON parsing error:", e);
        // If JSON parsing fails, attempt to extract JSON more aggressively
        const potentialJson = text.replace(/```json|```/g, "").trim();
        try {
          parsedResponse = JSON.parse(potentialJson);
        } catch (e2) {
          // If still fails, return the raw text
          parsedResponse = { rawResponse: text };
        }
      }
    } else {
      parsedResponse = { rawResponse: text };
    }

    return {
      success: true,
      data: parsedResponse,
    };
  } catch (error) {
    console.error("Gemini AI weather analysis error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  analyzeCropHealthBySymptoms,
  analyzeCropHealthByImage,
  getCropRecommendations,
  generateSmartNotifications,
  analyzeWeatherForAgriculture,
};