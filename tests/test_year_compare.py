"""
Unit tests for Single Region Multi-Year Comparison Service & Endpoint
"""

import unittest
from fastapi.testclient import TestClient
from Backend import app
from services.year_compare_service import compare_region_years, resolve_region


class TestYearCompare(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_01_resolve_region(self):
        goa = resolve_region("Goa")
        self.assertEqual(goa["name"], "Goa")
        self.assertEqual(goa["id"], "IN-GA")

        manali = resolve_region("Manali")
        self.assertEqual(manali["name"], "Manali")

        shimla = resolve_region("Shimla")
        self.assertEqual(shimla["name"], "Shimla")

    def test_02_compare_goa_temperature_2026_vs_2020(self):
        res = compare_region_years("Goa", "temperature", 2026, 2020)
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["region"]["name"], "Goa")
        self.assertEqual(res["year1"], 2026)
        self.assertEqual(res["year2"], 2020)
        self.assertTrue(res["is_year1_projection"])
        self.assertFalse(res["is_year2_projection"])

        # 12 monthly records
        self.assertEqual(len(res["monthly_records"]), 12)
        m1 = res["monthly_records"][0]
        self.assertEqual(m1["month_num"], 1)
        self.assertIn("year1_val", m1)
        self.assertIn("year2_val", m1)
        self.assertIn("diff", m1)

        # Summary verification
        summary = res["summary"]
        self.assertIn("annual_diff", summary)
        self.assertIn("verdict", summary)
        self.assertIn("year1_max", summary)
        self.assertIn("year2_max", summary)

    def test_03_compare_manali_rainfall(self):
        res = compare_region_years("Manali", "rainfall", 2026, 2021)
        self.assertEqual(res["status"], "success")
        self.assertEqual(len(res["monthly_records"]), 12)
        self.assertEqual(res["variable"]["id"], "rainfall")

    def test_04_api_endpoint_post(self):
        resp = self.client.post("/api/v1/compare/years", json={
            "region": "Goa",
            "variable": "temperature",
            "year1": 2026,
            "year2": 2020
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["region"]["name"], "Goa")
        self.assertEqual(data["year1"], 2026)
        self.assertEqual(data["year2"], 2020)

    def test_05_api_endpoint_get(self):
        resp = self.client.get("/api/v1/compare/years?region=Shimla&variable=humidity&year1=2026&year2=2015")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(len(data["monthly_records"]), 12)


if __name__ == "__main__":
    unittest.main()
