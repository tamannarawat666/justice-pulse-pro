import os
import json
import asyncio
from typing import List
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import pypdf
import io
import google.generativeai as genai 

# Load environment variables
load_dotenv()

app = FastAPI()

# --- CONFIGURATION ---
# Removed MONGO_URL since we aren't using a database anymore
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Configure Google Gemini
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("⚠️ WARNING: GEMINI_API_KEY not found in .env file")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- HELPER FUNCTIONS ---

def extract_text_from_pdf(file_bytes):
    try:
        pdf_reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text[:30000] # Gemini handles large text well
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return ""

def analyze_with_gemini(text):
    print("🤖 Sending text to Gemini...")

    if not GEMINI_API_KEY:
        return {
            "case_type": "Config Error",
            "legal_domain": "Missing API Key",
            "priority_level": "High",
            "summary": "Please add GEMINI_API_KEY to your .env file."
        }

    # FIX: gemini-2.5 does not exist. Using 1.5-flash with a fallback.
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
    except:
        model = genai.GenerativeModel('gemini-pro')

    prompt = f"""
    You are a legal expert assistant. Analyze the following text.
    
    Return a valid JSON object with these exact keys:
    1. "case_type" (e.g., Civil, Criminal)
    2. "legal_domain" (e.g., Intellectual Property, Contract Law)
    3. "priority_level" (High, Medium, Low)
    4. "summary" (Concise summary in 3 sentences)

    Do not use Markdown. Just return the JSON string.

    DOCUMENT TEXT:
    {text}
    """

    try:
        # Generate content
        response = model.generate_content(prompt)
        
        # Clean up response (sometimes it adds ```json markers)
        content = response.text.replace("```json", "").replace("```", "").strip()
        
        return json.loads(content)

    except Exception as e:
        print(f"❌ Gemini Error: {e}")
        return {
            "case_type": "API Error",
            "legal_domain": "Processing Failed",
            "priority_level": "Low",
            "summary": f"Error from Google API: {str(e)}"
        }

# --- API ENDPOINTS ---

@app.post("/analyze") 
async def analyze_file(file: UploadFile = File(...)):
    print(f"📂 Received file: {file.filename}")
    
    content = await file.read()
    raw_text = extract_text_from_pdf(content)
    
    if not raw_text:
        raise HTTPException(status_code=400, detail="Could not read PDF text.")

    # Run AI in background thread
    loop = asyncio.get_event_loop()
    ai_data = await loop.run_in_executor(None, analyze_with_gemini, raw_text)

    # Return the data directly to frontend (No DB Save)
    ai_data["filename"] = file.filename
    
    return ai_data