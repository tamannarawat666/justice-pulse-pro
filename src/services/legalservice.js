// This file handles the communication with your Python Backend

const API_URL = "http://127.0.0.1:8000"; // Pointing to your Python Service

export async function analyzeDocument(file) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(`${API_URL}/analyze`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to analyze document");
    }

    // Returns: { case_type, legal_domain, priority_level, summary, filename }
    return await response.json(); 
    
  } catch (error) {
    console.error("AI Service Error:", error);
    return null;
  }
}