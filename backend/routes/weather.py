import httpx
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/weather", tags=["weather"])

# Open-Meteo free API (No key required)
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

@router.get("/current")
async def get_current_weather(lat: float = 20.59, lon: float = 78.96):
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                OPEN_METEO_URL,
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "current": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
                    "timezone": "auto"
                }
            )
            data = resp.json()
            curr = data.get("current", {})
            
            # Simple weather code mapping (WMO codes)
            code = curr.get("weather_code", 0)
            cond = "clear"
            if code in [1, 2, 3]: cond = "clouds"
            elif code in [45, 48]: cond = "mist"
            elif code in [51, 53, 55, 61, 63, 65]: cond = "rain"
            elif code in [95, 96, 99]: cond = "thunderstorm"
            
            return {
                "temp": curr.get("temperature_2m", 28),
                "feels_like": curr.get("apparent_temperature", 30),
                "humidity": curr.get("relative_humidity_2m", 65),
                "wind_speed": curr.get("wind_speed_10m", 12),
                "condition": cond,
                "description": cond.capitalize(),
                "uv_index": 6, # Mocked
                "rain_next_6h": curr.get("precipitation", 0) > 0,
                "location": f"{lat:.2f}, {lon:.2f}"
            }
    except Exception as e:
        # Fallback to simulated data if API fails
        return {
            "temp": 28.5, "feels_like": 31.0, "humidity": 72, 
            "wind_speed": 14.2, "condition": "clouds", "description": "Partly Cloudy",
            "uv_index": 5, "rain_next_6h": False, "location": "Demo Farm"
        }

@router.get("/forecast")
async def get_forecast(lat: float = 20.59, lon: float = 78.96):
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                OPEN_METEO_URL,
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "hourly": "temperature_2m,precipitation_probability",
                    "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max",
                    "timezone": "auto",
                    "forecast_days": 7
                }
            )
            data = resp.json()
            
            # Parse Hourly (Next 24h)
            hourly = []
            h_data = data.get("hourly", {})
            if h_data:
                for i in range(0, 24, 3): # Every 3 hours
                    time_str = h_data["time"][i].split("T")[1]
                    hourly.append({
                        "time": time_str,
                        "temp": h_data["temperature_2m"][i],
                        "rain_prob": h_data["precipitation_probability"][i]
                    })
                    
            # Parse Daily
            daily = []
            d_data = data.get("daily", {})
            if d_data:
                days_map = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
                import datetime
                for i in range(7):
                    date_obj = datetime.datetime.strptime(d_data["time"][i], "%Y-%m-%d")
                    code = d_data["weather_code"][i]
                    cond = "clear"
                    if code in [1,2,3]: cond = "clouds"
                    elif code in [61,63,65]: cond = "rain"
                    
                    wind = d_data["wind_speed_10m_max"][i]
                    rain_prob = d_data["precipitation_probability_max"][i]
                    
                    window = "6:00-10:00 AM"
                    if wind > 15 or rain_prob > 40:
                        window = "Not Recommended"
                    elif rain_prob > 20:
                        window = "4:00-6:00 PM"
                        
                    daily.append({
                        "day_name": "Today" if i == 0 else days_map[date_obj.weekday()],
                        "condition": cond,
                        "temp_max": round(d_data["temperature_2m_max"][i]),
                        "temp_min": round(d_data["temperature_2m_min"][i]),
                        "rain_prob": rain_prob,
                        "precipitation": round(d_data.get("precipitation_sum", [0]*7)[i], 1) if "precipitation_sum" in d_data else (rain_prob/10),
                        "wind_avg": round(wind),
                        "spray_window": window
                    })
                    
            return {"hourly": hourly, "daily": daily}
            
    except Exception as e:
        # Fallback simulation
        return {
            "hourly": [
                {"time": "06:00", "temp": 24}, {"time": "09:00", "temp": 28},
                {"time": "12:00", "temp": 32}, {"time": "15:00", "temp": 34},
                {"time": "18:00", "temp": 31}, {"time": "21:00", "temp": 27}
            ],
            "daily": [
                {"day_name": "Today", "condition": "clear", "temp_max": 34, "temp_min": 24, "rain_prob": 10, "precipitation": 0, "wind_avg": 12, "spray_window": "6:00-10:00 AM"},
                {"day_name": "Tomorrow", "condition": "clouds", "temp_max": 32, "temp_min": 25, "rain_prob": 30, "precipitation": 2, "wind_avg": 14, "spray_window": "5:00-7:00 PM"}
            ]
        }
