"""
AstroKites Email Alert Dispatch Tests
Validates the /send-email endpoint:
1. Input validation (missing email, invalid email, empty body)
2. Successful dispatch with configured SMTP credentials
"""

import unittest
from fastapi.testclient import TestClient
from Backend import app, _send_smtp_email


class TestEmailDispatch(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_01_send_email_validation_missing_fields(self):
        # Missing body
        res = self.client.post("/send-email", json={"email": "test@example.com", "body": ""})
        self.assertEqual(res.status_code, 400)

        # Missing email
        res = self.client.post("/send-email", json={"email": "", "body": "Weather alert text"})
        self.assertEqual(res.status_code, 400)

        # Invalid email (no @)
        res = self.client.post("/send-email", json={"email": "invalid-email-address", "body": "Weather alert text"})
        self.assertEqual(res.status_code, 400)

    def test_02_send_email_success(self):
        # Test sending a real alert email to the configured email
        res = self.client.post("/send-email", json={
            "email": "harshparmar1617@gmail.com",
            "subject": "AstroKites Automated Test Advisory",
            "body": "ALERT: High rainfall forecast in the region. Advisory sent to State Government.",
            "location": "Ahmedabad, Gujarat"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("sent"))
        self.assertEqual(data.get("recipient"), "harshparmar1617@gmail.com")
        self.assertIn("AstroKites Automated Test Advisory", data.get("subject"))


if __name__ == "__main__":
    unittest.main()
