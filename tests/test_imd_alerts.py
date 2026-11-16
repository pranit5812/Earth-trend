"""
AstroKites IMD Climate Alerts & Forecast Warnings Automated Tests
Tests:
1. Alert retrieval and schema validation
2. Severity sorting order (Orange > Yellow)
3. Verified presence of requested destination alerts (Manali, Ooty, Munnar, Bengaluru, Udaipur/Jaisalmer, Hampi)
4. State filtering (Himachal Pradesh, Karnataka, Kerala, Tamil Nadu, Rajasthan)
5. FastAPI /api/v1/alerts endpoint
"""

import unittest
from fastapi.testclient import TestClient
from Backend import app
from services.imd_alerts_service import get_climate_alerts, SEVERITY_ORDER


class TestIMDAlertsService(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_01_alerts_retrieval_and_schema(self):
        data = get_climate_alerts(force_refresh=True)
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["alerts_count"], 6)
        self.assertIn("summary", data)
        self.assertIn("primary_source", data)

        for alert in data["alerts"]:
            self.assertIn("id", alert)
            self.assertIn("title", alert)
            self.assertIn("state", alert)
            self.assertIn("district", alert)
            self.assertIn("coordinates", alert)
            self.assertIn("latitude", alert["coordinates"])
            self.assertIn("longitude", alert["coordinates"])
            self.assertIn("severity", alert)
            self.assertIn(alert["severity"], ["Red", "Orange", "Yellow", "Green"])
            self.assertIn("forecast_date", alert)
            self.assertIn("description", alert)
            self.assertIn("source", alert)
            self.assertTrue(alert["is_official"])

    def test_02_priority_ranking_severity(self):
        data = get_climate_alerts(force_refresh=True)
        alerts = data["alerts"]
        ranks = [SEVERITY_ORDER[a["severity"]] for a in alerts]
        # Should be non-decreasing (1 <= 2 <= 3 <= 4)
        self.assertEqual(ranks, sorted(ranks))
        # Top alert must be Orange (Manali sub-zero warning)
        self.assertEqual(alerts[0]["severity"], "Orange")

    def test_03_destination_alerts_present(self):
        data = get_climate_alerts(force_refresh=True)
        districts_and_states = [(a["district"], a["state"], a["description"]) for a in data["alerts"]]
        
        # 1. Manali, Himachal Pradesh (-4°C)
        has_manali = any("Manali" in d and s == "Himachal Pradesh" and "-4°C" in desc for d, s, desc in districts_and_states)
        self.assertTrue(has_manali, "Manali -4°C freezing alert should be present")

        # 2. Ooty, Tamil Nadu
        has_ooty = any("Ooty" in d and s == "Tamil Nadu" for d, s, desc in districts_and_states)
        self.assertTrue(has_ooty, "Ooty cloudy & cool alert should be present")

        # 3. Munnar, Kerala
        has_munnar = any("Munnar" in d and s == "Kerala" for d, s, desc in districts_and_states)
        self.assertTrue(has_munnar, "Munnar tea estates post-monsoon alert should be present")

        # 4. Bengaluru, Karnataka
        has_blr = any("Bengaluru" in d and s == "Karnataka" and "27°C" in desc for d, s, desc in districts_and_states)
        self.assertTrue(has_blr, "Bengaluru cloudy and breezy alert should be present")

        # 5. Udaipur and Jaisalmer, Rajasthan
        has_rajasthan = any("Jaisalmer" in d and s == "Rajasthan" for d, s, desc in districts_and_states)
        self.assertTrue(has_rajasthan, "Udaipur & Jaisalmer desert air alert should be present")

        # 6. Hampi, Karnataka
        has_hampi = any("Hampi" in d and s == "Karnataka" for d, s, desc in districts_and_states)
        self.assertTrue(has_hampi, "Hampi sunny and dry alert should be present")

    def test_04_filtering_by_state(self):
        hp_data = get_climate_alerts(state="Himachal Pradesh")
        self.assertGreaterEqual(hp_data["alerts_count"], 1)
        for a in hp_data["alerts"]:
            self.assertEqual(a["state"], "Himachal Pradesh")

        ka_data = get_climate_alerts(state="Karnataka")
        self.assertEqual(ka_data["alerts_count"], 2)  # Bengaluru + Hampi
        for a in ka_data["alerts"]:
            self.assertEqual(a["state"], "Karnataka")

    def test_05_fastapi_alerts_endpoint(self):
        resp = self.client.get("/api/v1/alerts?refresh=true")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(len(data["alerts"]), 6)


if __name__ == "__main__":
    unittest.main()
