"""
Unit & Integration Tests for AstroKites Smart Travel Planner (India Only)
Validates:
1. India-only boundary checks and rejection of international destinations.
2. NASA POWER multi-variable climate analysis.
3. Travel Comfort Score formula (0-100) and activity weights.
4. Best Time to Travel 12-month evaluation.
5. Best Date Finder (flexible windows & fixed dates).
6. Destination comparison (Goa vs Kerala).
7. Meteorological risk assessment.
8. FastAPI endpoints.
"""

import os
import sys
import unittest
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from services.travel_destinations import (
    is_within_india,
    get_all_destinations,
    resolve_indian_destination,
    search_indian_destinations
)
from services.travel_climate_service import analyze_destination_climate
from services.travel_comfort_engine import (
    get_best_time_to_travel,
    find_best_travel_dates,
    compare_destinations,
    assess_travel_weather_risks,
    calculate_month_comfort_score
)
from Backend import app
from fastapi.testclient import TestClient


class TestIndiaDestinationValidation(unittest.TestCase):
    """Test boundary checks and strict India-only requirement."""

    def test_indian_coordinates_valid(self):
        # Goa (15.29, 74.12)
        self.assertTrue(is_within_india(15.2993, 74.1240))
        # Manali (32.24, 77.18)
        self.assertTrue(is_within_india(32.2432, 77.1892))
        # Leh (34.15, 77.57)
        self.assertTrue(is_within_india(34.1526, 77.5771))
        # Ooty (11.41, 76.69)
        self.assertTrue(is_within_india(11.4102, 76.6950))
        # Port Blair, Andaman (11.62, 92.72)
        self.assertTrue(is_within_india(11.6234, 92.7265))

    def test_international_coordinates_rejected(self):
        # Paris (48.85, 2.35)
        self.assertFalse(is_within_india(48.8566, 2.3522))
        # Dubai (25.20, 55.27) - Lon < 68.0
        self.assertFalse(is_within_india(25.2048, 55.2708))
        # London (51.50, -0.12)
        self.assertFalse(is_within_india(51.5074, -0.1278))
        # Bangkok (13.75, 100.50) - Lon > 97.5
        self.assertFalse(is_within_india(13.7563, 100.5018))

    def test_reject_international_destinations(self):
        res = resolve_indian_destination("Paris")
        self.assertEqual(res["status"], "error")
        self.assertEqual(res["error_code"], "INTERNATIONAL_DESTINATION_REJECTED")

        res_dubai = resolve_indian_destination("Dubai")
        self.assertEqual(res_dubai["status"], "error")
        self.assertEqual(res_dubai["error_code"], "INTERNATIONAL_DESTINATION_REJECTED")

    def test_resolve_curated_indian_destinations(self):
        res_goa = resolve_indian_destination("Goa")
        self.assertEqual(res_goa["status"], "success")
        self.assertEqual(res_goa["destination"]["state_id"], "IN-GA")

        res_manali = resolve_indian_destination("Manali")
        self.assertEqual(res_manali["status"], "success")
        self.assertEqual(res_manali["destination"]["state_name"], "Himachal Pradesh")


class TestTravelClimateService(unittest.TestCase):
    """Test NASA POWER multi-variable climate analysis for Indian destinations."""

    def test_climate_analysis_goa(self):
        res = analyze_destination_climate("Goa", 2015, 2024)
        self.assertEqual(res["status"], "success")
        profile = res["climate_profile"]
        self.assertEqual(len(profile["months"]), 12)
        # Check monsoon rainfall pattern (June-August is wet in Goa)
        july = profile["months"][6] # Index 6 = July
        self.assertTrue(july["rainfall_total_mm"] > 200.0)
        self.assertTrue(july["is_monsoon_month"])

    def test_climate_analysis_ladakh_dry_summer(self):
        res = analyze_destination_climate("Leh", 2015, 2024)
        self.assertEqual(res["status"], "success")
        profile = res["climate_profile"]
        # Ladakh is in rain shadow; rainfall is very low in summer compared to monsoon plains
        july = profile["months"][6]
        self.assertLess(july["rainfall_total_mm"], 100.0)


class TestTravelComfortEngine(unittest.TestCase):
    """Test Travel Comfort Score engine and activity weighting."""

    def test_goa_beach_best_time(self):
        # Beach vacation in Goa: Winter months (Nov-Feb) should rank highest
        res = get_best_time_to_travel("Goa", "beach")
        self.assertEqual(res["status"], "success")
        best_months = res["top_recommended_months"]
        # December or January should be in the top recommended months
        self.assertTrue(any(m in ["December", "January", "February", "November"] for m in best_months))
        # July (heavy monsoon) should NOT be top recommendation for beaches
        self.assertNotIn("July", best_months[:2])

    def test_manali_mountain_summer(self):
        # Mountain tourism in Manali: May/June or autumn should rank high
        res = get_best_time_to_travel("Manali", "mountain")
        self.assertEqual(res["status"], "success")
        top_months = res["top_recommended_months"]
        self.assertTrue(len(top_months) > 0)

    def test_best_dates_flexible(self):
        res = find_best_travel_dates("Goa", "beach", duration_days=7, is_flexible=True)
        self.assertEqual(res["status"], "success")
        self.assertIn("top_recommended_windows", res)
        self.assertEqual(len(res["top_recommended_windows"]), 5)
        top = res["top_recommended_windows"][0]
        self.assertGreaterEqual(top["comfort_score"], 60.0)

    def test_destination_comparison(self):
        res = compare_destinations(["Goa", "Kerala"], "beach")
        self.assertEqual(res["status"], "success")
        self.assertEqual(len(res["destinations_compared"]), 2)
        self.assertIn("recommendation_verdict", res)

    def test_risk_assessment_goa(self):
        res = assess_travel_weather_risks("Goa")
        self.assertEqual(res["status"], "success")
        risks = res["assessed_risks"]
        risk_types = [r["risk_type"] for r in risks]
        self.assertTrue(any("Monsoon" in rt for rt in risk_types))


class TestFastAPITravelEndpoints(unittest.TestCase):
    """Test FastAPI /travel endpoints."""

    def setUp(self):
        self.client = TestClient(app)

    def test_get_destinations(self):
        resp = self.client.get("/travel/destinations")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "success")
        self.assertGreater(data["count"], 20)

    def test_post_climate_analysis(self):
        resp = self.client.post("/travel/climate-analysis", json={
            "destination": "Goa",
            "start_year": 2018,
            "end_year": 2024
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "success")

    def test_post_best_time(self):
        resp = self.client.post("/travel/best-time", json={
            "destination": "Jaipur",
            "travel_type": "cultural"
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("monthly_calendar", data)
        self.assertEqual(len(data["monthly_calendar"]), 12)

    def test_post_foreign_destination_rejected(self):
        resp = self.client.post("/travel/best-time", json={
            "destination": "Paris",
            "travel_type": "city"
        })
        self.assertEqual(resp.status_code, 400)
        self.assertIn("international", resp.json()["detail"].lower())


if __name__ == "__main__":
    unittest.main()
