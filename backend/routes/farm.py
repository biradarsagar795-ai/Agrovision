from fastapi import APIRouter
import json
from config import DATA_DIR

router = APIRouter(prefix="/api/farm", tags=["farm"])

FARM_FILE = DATA_DIR / "farm_data.json"

@router.get("/overview")
async def get_overview():
    # Simulated aggregated dashboard data
    try:
        with open(FARM_FILE, "r") as f:
             data = json.load(f)
             activities = data.get("activities", [])
    except:
        activities = []
        
    return {
        "grade": "B",
        "weather": {
            "temp": 29,
            "humidity": 68,
            "rain_text": "Clear window today"
        },
        "health_pct": 82,
        "pending_tasks": 4,
        "next_task": "Pesticide Spray (6 AM)",
        "active_diseases": 2,
        "latest_disease": "Early Blight — Mild",
        "alerts": [
            {"icon": "⚠️", "text": "Wind speed increasing tomorrow", "type": "warning"},
            {"icon": "🌱", "text": "West field health improved", "type": "success"}
        ],
        "activities": activities
    }

@router.post("/diseases/{disease_id}/resolve")
async def resolve_disease(disease_id: str):
    # In a real app, update DB. Here we just return success.
    return {"message": "Disease marked as resolved", "id": disease_id}
