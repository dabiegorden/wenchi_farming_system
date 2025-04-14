const { GoogleGenAI } = require("@google/genai");
const fs = require("fs")
const path = require("path")
const dotenv = require("dotenv")
dotenv.config();

// Initialize the Gemini API with your API key
const initGeminiAI = () => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables")
  }
  return new GoogleGenAI(apiKey)
}

// Function to analyze crop health based on symptoms
const analyzeCropHealthBySymptoms = async (cropName, symptoms) => {
  try {
    const genAI = initGeminiAI()
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

    const prompt = `
      As an agricultural expert, analyze the following symptoms for ${cropName} and provide a detailed assessment:
      
      Symptoms: ${symptoms.join(", ")}
      
      Please provide the following information in JSON format:
      1. Most likely disease or condition
      2. Confidence level (0-100)
      3. Brief description of the disease
      4. Severity assessment (healthy, mild, moderate, severe)
      5. Recommended treatments or actions
      6. Preventive measures for the future
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Extract JSON from the response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*?}/)
    let parsedResponse

    if (jsonMatch) {
      try {
        parsedResponse = JSON.parse(jsonMatch[1] || jsonMatch[0])
      } catch (e) {
        // If JSON parsing fails, return the raw text
        parsedResponse = { rawResponse: text }
      }
    } else {
      parsedResponse = { rawResponse: text }
    }

    return {
      success: true,
      data: parsedResponse,
    }
  } catch (error) {
    console.error("Gemini AI analysis error:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

// Function to analyze crop health based on image
const analyzeCropHealthByImage = async (cropName, imagePath) => {
  try {
    const genAI = initGeminiAI()
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" })

    // Read the image file
    const imageData = fs.readFileSync(imagePath)
    const imageBase64 = imageData.toString("base64")

    const prompt = `
      As an agricultural expert, analyze this image of ${cropName} and provide a detailed health assessment.
      
      Please provide the following information in JSON format:
      1. Most likely disease or condition (or "healthy" if no issues detected)
      2. Confidence level (0-100)
      3. Brief description of what you observe
      4. Severity assessment (healthy, mild, moderate, severe)
      5. Recommended treatments or actions
      6. Preventive measures for the future
    `

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: "image/jpeg", // Adjust based on your image type
        },
      },
    ])

    const response = await result.response
    const text = response.text()

    // Extract JSON from the response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*?}/)
    let parsedResponse

    if (jsonMatch) {
      try {
        parsedResponse = JSON.parse(jsonMatch[1] || jsonMatch[0])
      } catch (e) {
        // If JSON parsing fails, return the raw text
        parsedResponse = { rawResponse: text }
      }
    } else {
      parsedResponse = { rawResponse: text }
    }

    return {
      success: true,
      data: parsedResponse,
    }
  } catch (error) {
    console.error("Gemini AI image analysis error:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

// Function to get crop recommendations for a land plot
const getCropRecommendations = async (landData, season) => {
  try {
    const genAI = initGeminiAI()
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

    const prompt = `
      As an agricultural expert, recommend suitable crops for a land with the following characteristics:
      
      Land details:
      - Soil type: ${landData.soilType || "Unknown"}
      - Soil pH: ${landData.soilPh || "Unknown"}
      - Soil moisture: ${landData.soilMoisture?.value || "Unknown"}%
      - Location: ${landData.location || "Unknown"}
      - Season: ${season || "Current"}
      
      Please provide recommendations in JSON format with the following structure:
      {
        "recommendations": [
          {
            "cropName": "Crop name",
            "suitabilityScore": 0-100,
            "reasoning": "Brief explanation of why this crop is suitable",
            "bestPractices": "Brief planting and care recommendations"
          }
        ]
      }
      
      Provide at least 3 crop recommendations, sorted by suitability score in descending order.
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Extract JSON from the response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*?}/)
    let parsedResponse

    if (jsonMatch) {
      try {
        parsedResponse = JSON.parse(jsonMatch[1] || jsonMatch[0])
      } catch (e) {
        // If JSON parsing fails, return the raw text
        parsedResponse = { rawResponse: text }
      }
    } else {
      parsedResponse = { rawResponse: text }
    }

    return {
      success: true,
      data: parsedResponse,
    }
  } catch (error) {
    console.error("Gemini AI crop recommendations error:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

module.exports = {
  analyzeCropHealthBySymptoms,
  analyzeCropHealthByImage,
  getCropRecommendations,
}
