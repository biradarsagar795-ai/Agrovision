import httpx
from fastapi import APIRouter
from pydantic import BaseModel
import re
import json

router = APIRouter(prefix="/api/chatbot", tags=["chatbot"])

class ChatRequest(BaseModel):
    message: str
    language: str = "en"
    context: dict = {}

@router.post("/message")
async def chat_message(req: ChatRequest):
    # Keyword-based simulated AI for the demo
    msg = req.message.lower()
    
    response = "I'm your AgriBot! You can ask me about the weather, how to treat diseases, or your upcoming tasks."
    action = None
    
    # 1. Weather Intent
    if any(word in msg for word in ["weather", "rain", "temperature", "spray", "forecast"]):
        # Fetch actual data from OpenMeteo
        try:
            # Example coordinates: New Delhi
            lat, lon = 28.6139, 77.2090
            url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
            async with httpx.AsyncClient() as client:
                res = await client.get(url, timeout=5.0)
            if res.status_code == 200:
                data = res.json()
                current = data.get("current_weather", {})
                
                # IMPORTANT: According to the USER prompt, the backend returned raw JSON string.
                # So we will return this data directly, and the FRONTEND will format it into human-friendly text.
                response = json.dumps({
                    "temperature": current.get("temperature"),
                    "windspeed": current.get("windspeed"),
                    "weathercode": current.get("weathercode")
                })
            else:
                response = "Sorry, I couldn't fetch the weather right now."
        except Exception as e:
            response = "Error fetching weather data."

        action = {"type": "navigate", "target": "/weather"}
        
    # 2. Disease/Health Intent
    elif any(word in msg for word in ["disease", "blight", "mildew", "health", "grade"]):
        response = f"Your farm is currently graded **{req.context.get('grade', 'B')}**. We've detected some Mildew in the North Field. I recommend applying **Neem Oil (5ml/L)** as an organic treatment."
        action = {"type": "navigate", "target": "/farm-health"}
        
    # 3. Tasks Intent
    elif any(word in msg for word in ["task", "remind", "todo", "schedule"]):
        response = "You have 3 pending tasks. The most urgent is **Pesticide Spraying** which is due tomorrow. Would you like me to open your task list?"
        action = {"type": "navigate", "target": "/tasks"}
        
    # 4. Multi-lang demo (Hindi fallback)
    elif req.language.startswith("hi") or "kese" in msg or "kya" in msg:
        response = "नमस्ते! मैं आपका कृषि सहायक हूँ। मौसम आज साफ़ है और स्प्रे करने के लिए सुरक्षित है।"
        
    return {
        "response": response,
        "action": action
    }
