/**
 * Uploads a file to the server
 * @param {File} file The file to upload
 * @param {string} endpoint The API endpoint to upload to (defaults to /api/land)
 * @returns {Promise<string>} Promise with the uploaded file path
 */
export async function uploadFile(file, endpoint = "/uploads") {
    try {
      const formData = new FormData()
      formData.append("image", file)
  
      const response = await fetch(`http://localhost:5000/api/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      })
  
      if (!response.ok) {
        throw new Error("Failed to upload file")
      }
  
      const data = await response.json()
      return data.url || data.path || ""
    } catch (error) {
      console.error("File upload error:", error)
      throw error
    }
  }
  