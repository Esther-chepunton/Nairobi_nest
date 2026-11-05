import requests
from flask import Blueprint, current_app, jsonify, request

weather_bp = Blueprint("weather", __name__)


@weather_bp.route("/weather", methods=["GET"])
def get_weather():
    lat = request.args.get("lat", -1.286389)
    lon = request.args.get("lon", 36.817223)
    api_key = current_app.config.get("OPENWEATHER_API_KEY")

    if not api_key:
        return jsonify({
            "condition": "clear",
            "description": "Clear skies",
            "temp_c": 22,
            "is_rainy": False,
            "source": "default",
        }), 200

    try:
        url = "https://api.openweathermap.org/data/2.5/weather"
        resp = requests.get(
            url,
            params={"lat": lat, "lon": lon, "appid": api_key, "units": "metric"},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        main = data.get("weather", [{}])[0]
        condition = main.get("main", "Clear").lower()
        is_rainy = condition in ("rain", "drizzle", "thunderstorm")
        return jsonify({
            "condition": condition,
            "description": main.get("description", ""),
            "temp_c": round(data.get("main", {}).get("temp", 22)),
            "is_rainy": is_rainy,
            "source": "openweather",
        }), 200
    except Exception:
        return jsonify({
            "condition": "clear",
            "description": "Weather unavailable",
            "temp_c": 22,
            "is_rainy": False,
            "source": "fallback",
        }), 200
