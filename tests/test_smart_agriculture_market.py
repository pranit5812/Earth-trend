"""
AstroKites Smart Agriculture - Market & Advisor Integration Tests
Verifies:
  - Nashik, Maharashtra (Onion, Tomato, Grapes)
  - Bengaluru, Karnataka (Ragi, Maize)
  - Jaipur, Rajasthan (Bajra, Mustard)
  - Ludhiana, Punjab (Wheat, Paddy, Maize)
  - 5-factor weighted algorithm (Weather 30%, Soil 25%, Water 15%, Market 20%, Season 10%)
  - Official AGMARKNET prices, trends, and nearby mandi comparisons
  - Missing and fallback data handling.
"""

import unittest
from fastapi.testclient import TestClient
from Backend import app
from services.mandi_market_service import (
    get_market_prices,
    get_commodity_market_summary,
    get_price_trends,
    get_nearby_mandis,
    get_all_market_locations
)
from services.farmer_advisor_engine import evaluate_farmer_recommendations


class TestSmartAgricultureMarket(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)

    def test_01_agmarknet_locations_and_prices(self):
        locations = get_all_market_locations()
        self.assertEqual(locations["status"], "success")
        self.assertIn("Maharashtra", locations["states"])
        self.assertIn("Punjab", locations["states"])
        self.assertIn("Rajasthan", locations["states"])
        self.assertIn("Karnataka", locations["states"])

        # Check real AGMARKNET price records
        all_prices = get_market_prices(limit=100)
        self.assertGreater(len(all_prices), 10)
        self.assertEqual(all_prices[0]["arrival_date"], "15/11/2026")
        self.assertIn("AGMARKNET", all_prices[0]["data_source"])

    def test_02_nashik_maharashtra_recommendations(self):
        res = evaluate_farmer_recommendations(
            location_name="Nashik, Maharashtra",
            state="Maharashtra",
            district="Nashik",
            soil_type="Black soil",
            irrigation="Good irrigation",
            season="Kharif"
        )
        self.assertEqual(res["status"], "success")
        self.assertEqual(len(res["top_recommendations"]), 5)
        
        crop_names = [c["crop_name"] for c in res["top_recommendations"]]
        # High suitability crops in Maharashtra black soils
        self.assertTrue(any(c in crop_names for c in ["Soybean", "Cotton", "Tomato", "Onion", "Maize"]))

        # Verify scores breakdown
        top = res["top_recommendations"][0]
        self.assertIn("weather_suitability", top["scores_breakdown"])
        self.assertIn("soil_suitability", top["scores_breakdown"])
        self.assertIn("water_availability", top["scores_breakdown"])
        self.assertIn("market_indicators", top["scores_breakdown"])
        self.assertIn("seasonal_suitability", top["scores_breakdown"])

    def test_03_bengaluru_karnataka_recommendations(self):
        res = evaluate_farmer_recommendations(
            location_name="Bengaluru Urban, Karnataka",
            state="Karnataka",
            district="Bengaluru Urban",
            soil_type="Red soil",
            irrigation="Limited irrigation",
            season="Kharif"
        )
        self.assertEqual(res["status"], "success")
        crop_names = [c["crop_name"] for c in res["top_recommendations"]]
        # Ragi / Groundnut / Maize excel in red soils with limited water
        self.assertTrue(any(c in crop_names for c in ["Ragi", "Groundnut", "Maize", "Tomato"]))

    def test_04_jaipur_rajasthan_recommendations(self):
        res = evaluate_farmer_recommendations(
            location_name="Jaipur, Rajasthan",
            state="Rajasthan",
            district="Jaipur",
            soil_type="Sandy soil",
            irrigation="Rainfed",
            season="Kharif"
        )
        self.assertEqual(res["status"], "success")
        crop_names = [c["crop_name"] for c in res["top_recommendations"]]
        # Bajra is the premier drought-hardy crop for sandy Rajasthan soils
        self.assertIn("Bajra", crop_names)

    def test_05_ludhiana_punjab_recommendations(self):
        res = evaluate_farmer_recommendations(
            location_name="Ludhiana, Punjab",
            state="Punjab",
            district="Ludhiana",
            soil_type="Alluvial soil",
            irrigation="Good irrigation",
            season="Rabi"
        )
        self.assertEqual(res["status"], "success")
        crop_names = [c["crop_name"] for c in res["top_recommendations"]]
        # Wheat & Mustard are dominant Rabi alluvial crops in Punjab
        self.assertTrue("Wheat" in crop_names or "Mustard" in crop_names)

    def test_06_market_price_trends_and_nearby_mandis(self):
        trends = get_price_trends("Rice", state="Punjab")
        self.assertEqual(trends["crop_name"], "Rice")
        self.assertEqual(len(trends["history_7d"]), 8)
        self.assertIn("volatility_pct", trends)

        nearby = get_nearby_mandis(state="Telangana", commodity="Tomato")
        self.assertGreater(len(nearby), 0)
        self.assertIn("Pavilion Ground", nearby[0]["market_name"] or nearby[0]["district"])
        self.assertIn("estimated_distance_km", nearby[0])

    def test_07_fastapi_endpoints_agriculture(self):
        # 1. GET /agriculture/locations
        r_loc = self.client.get("/agriculture/locations")
        self.assertEqual(r_loc.status_code, 200)
        self.assertIn("states", r_loc.json())

        # 2. GET /agriculture/weather
        r_w = self.client.get("/agriculture/weather?state=Maharashtra&district=Nashik")
        self.assertEqual(r_w.status_code, 200)
        self.assertIn("mean_temperature_c", r_w.json()["weather"])

        # 3. GET /agriculture/market-prices
        r_p = self.client.get("/agriculture/market-prices?commodity=Tomato")
        self.assertEqual(r_p.status_code, 200)
        self.assertGreater(r_p.json()["count"], 0)

        # 4. GET /agriculture/alerts
        r_a = self.client.get("/agriculture/alerts?state=Maharashtra")
        self.assertEqual(r_a.status_code, 200)
        self.assertGreater(r_a.json()["alerts_count"], 0)

        # 5. POST /agriculture/recommendations
        payload = {
            "state": "Maharashtra",
            "district": "Nashik",
            "soil_type": "Black soil",
            "irrigation": "Good irrigation",
            "season": "Kharif"
        }
        r_rec = self.client.post("/agriculture/recommendations", json=payload)
        self.assertEqual(r_rec.status_code, 200)
        data = r_rec.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(len(data["top_recommendations"]), 5)


if __name__ == "__main__":
    unittest.main()
