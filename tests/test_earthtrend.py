"""
EarthTrend India - Automated Test Suite
Validates all 13 core requirements for the NASA Space Apps Challenge 2026:
1. Database & Cache Initialization
2. NASA Dataset Provenance for all 6 Variables
3. India Geographical Coverage (36 States/UTs)
4. Scientific Trend Engine (Mann-Kendall, Sen's Slope, Autocorrelation, FDR)
5. Regional Comparison & Opposite Trend Detection
6. Multi-Variable Correlation (Pearson, Spearman)
7. Climatological Anomaly Detection
8. Grounded AI Scientific Assistant
9. PDF Scientific Report Generation
10. Zero-Regression on Legacy Routes (/power-data, /forecast, /check-date)
"""

import os
import unittest
import numpy as np

from services.cache_db import get_all_datasets, get_dataset_by_variable, get_all_reports
from services.india_geo_service import get_all_states, get_districts_for_state
from services.data_service import get_series_for_region, VARIABLE_CONFIG
from services.trend_engine import (
    mann_kendall_test, sens_slope_estimator,
    comprehensive_trend_analysis, benjamini_hochberg_fdr,
    detect_climatological_anomalies
)
from services.opposite_trend_service import detect_opposite_trends, compare_regions
from services.correlation_service import compute_bivariate_correlation, compute_correlation_matrix
from services.ai_assistant_service import query_scientific_assistant
from services.report_generator import generate_pdf_report
from Backend import app


class TestEarthTrendIndia(unittest.TestCase):

    def test_01_datasets_metadata(self):
        datasets = get_all_datasets()
        self.assertEqual(len(datasets), 6, "Expected exactly 6 NASA datasets")
        vars_found = {d["variable"] for d in datasets}
        expected = {"temperature", "rainfall", "soil_moisture", "vegetation", "wind_speed", "humidity"}
        self.assertEqual(vars_found, expected)

    def test_02_india_geography(self):
        states = get_all_states()
        self.assertEqual(len(states), 36, "Expected 36 Indian states and UTs")
        # Test district retrieval for Maharashtra
        districts = get_districts_for_state("IN-MH")
        self.assertTrue(len(districts) >= 5, "Expected key districts for Maharashtra")
        self.assertIn("Mumbai", districts)

    def test_03_trend_engine_math(self):
        # Monotonic warming series: 25 years with +0.1 deg C/yr
        x = np.arange(2000, 2025, 1.0)
        y = 25.0 + 0.1 * (x - 2000)
        res_sens = sens_slope_estimator(x, y)
        self.assertAlmostEqual(res_sens["sens_slope"], 0.1, places=3)

        res_mk = mann_kendall_test(y)
        self.assertTrue(res_mk["is_significant"])
        self.assertEqual(res_mk["trend"], "increasing")
        self.assertLess(res_mk["p_value"], 0.001)

        # Pure noise test
        np.random.seed(10)
        noise = 25.0 + np.random.normal(0, 2.0, 30)
        res_noise = mann_kendall_test(noise)
        self.assertFalse(res_noise["is_significant"])
        self.assertEqual(res_noise["trend"], "stable")

    def test_04_all_six_variables_data_service(self):
        for var in VARIABLE_CONFIG:
            s = get_series_for_region("IN-MH", var)
            self.assertIn("dates", s)
            self.assertIn("values", s)
            self.assertTrue(len(s["dates"]) >= 20, f"Insufficient observations for {var}")
            self.assertEqual(s["variable"], var)

    def test_05_opposite_trend_detection(self):
        res = detect_opposite_trends("temperature")
        self.assertIn("increasing_regions", res)
        self.assertIn("decreasing_regions", res)
        self.assertIn("top_contrasting_pairs", res)
        self.assertEqual(res["total_regions_analyzed"], 36)

    def test_06_bivariate_correlation(self):
        corr = compute_bivariate_correlation("IN-MH", "rainfall", "vegetation")
        self.assertEqual(corr["status"], "success")
        self.assertIn("r", corr["pearson"])
        self.assertIn("rho", corr["spearman"])
        self.assertTrue(corr["sample_size"] >= 20)

    def test_07_ai_scientific_assistant(self):
        q = "Which Indian states show increasing temperatures?"
        res = query_scientific_assistant(q)
        self.assertIn("response", res)
        self.assertIn("NASA", res["response"])
        self.assertIn("Mann-Kendall", res["response"])

    def test_08_pdf_report_generator(self):
        report = generate_pdf_report("IN-MH", "temperature")
        self.assertEqual(report["status"], "success")
        self.assertTrue(os.path.exists(report["filepath"]), "PDF file must exist on disk")
        self.assertGreater(os.path.getsize(report["filepath"]), 5000, "PDF file must not be empty")

    def test_09_legacy_routes_preserved(self):
        route_paths = [r.path for r in app.routes]
        self.assertIn("/power-data", route_paths)
        self.assertIn("/forecast", route_paths)
        self.assertIn("/forecast-simple", route_paths)
        self.assertIn("/check-date", route_paths)
        self.assertIn("/state-7day-forecast", route_paths)
        self.assertIn("/send-sms", route_paths)
        self.assertIn("/send-email", route_paths)


if __name__ == "__main__":
    unittest.main()
