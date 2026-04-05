# main.py (FINAL WORKING VERSION - FIXED MODEL ERROR)

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv
import PyPDF2
import io

# Load environment variables
load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
print("API KEY =", API_KEY)

if not API_KEY:
    raise ValueError("GEMINI_API_KEY not found in .env file")

# Configure Gemini
genai.configure(api_key=API_KEY)

# ✅ FIXED MODEL (WORKS FOR ALL USERS)
model = genai.GenerativeModel("models/gemini-flash-latest")

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Model
class ChatRequest(BaseModel):
    message: str

# Home Route
@app.get("/")
def home():
    return {"message": "Placement AI Bot Backend Running"}

# Static Roadmap
@app.get("/roadmap/{salary}")
def get_roadmap(salary: int):
    if salary <= 6:
        return {"level": "Beginner", "topics": ["Arrays", "Strings", "DBMS"]}
    elif salary <= 12:
        return {"level": "Intermediate", "topics": ["Trees", "Graphs", "OS"]}
    elif salary <= 25:
        return {"level": "Advanced", "topics": ["DP", "System Design"]}
    else:
        return {"level": "Elite", "topics": ["Competitive Programming", "Distributed Systems"]}

# AI Roadmap
@app.get("/ai-roadmap/{salary}")
def ai_roadmap(salary: int):
    try:
        prompt = f"Create a detailed roadmap to achieve {salary} LPA software job"
        response = model.generate_content(prompt)
        return {"roadmap": getattr(response, "text", "No response")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Daily Plan
@app.get("/daily/{salary}")
def daily_plan(salary: int):
    try:
        prompt = f"Give a daily study plan for a student aiming for {salary} LPA tech job"
        response = model.generate_content(prompt)
        return {"plan": getattr(response, "text", "No response")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Resume Analyzer
@app.post("/resume")
def analyze_resume(file: UploadFile = File(...)):
    try:
        if not file.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files allowed")

        content = file.file.read()

        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")

        reader = PyPDF2.PdfReader(io.BytesIO(content))
        text = ""

        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted

        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")

        prompt = (
            "Analyze this resume and give strengths, weaknesses, and improvements. "
            "Treat the current year as 2026 when evaluating timelines, durations, and experience.\n\n"
            f"Resume Text:\n{text}"
        )
        response = model.generate_content(prompt)

        return {"analysis": getattr(response, "text", "No response")}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resume processing failed: {str(e)}")

# Chatbot
@app.post("/chat")
def chat(request: ChatRequest):
    try:
        if not request.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")

        response = model.generate_content(request.message)

        reply = getattr(response, "text", None)

        if not reply:
            reply = "AI did not return a valid response"

        return {"reply": reply}

    except Exception as e:
        print("ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

# Run: