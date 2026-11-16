"""
Unit & Integration Tests for AstroKites AI Climate Intelligence Assistant
Validates OpenRouter client, Tool Registry, Tool Executor, Conversation Manager, and Agent.
"""

import os
import sys
import unittest
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ai.openrouter_client import OpenRouterClient
from ai.tool_registry import get_registered_tools
from ai.tool_executor import execute_tool_call
from ai.conversation_manager import ConversationManager
from ai.agent import ClimateAgent
from schemas.chatbot_schemas import PageContext


class TestOpenRouterConfiguration(unittest.TestCase):
    """Test client initialization and environment validation."""

    def test_client_init(self):
        client = OpenRouterClient()
        self.assertTrue(client.is_configured(), "OpenRouterClient must detect OPENROUTER_API_KEY from .env")
        self.assertIsNotNone(client.model)
        self.assertIn("gpt", client.model.lower())


class TestToolRegistry(unittest.TestCase):
    """Test tool registry schemas conforming to OpenAI tool-calling spec."""

    def test_tool_definitions_present(self):
        tools = get_registered_tools()
        self.assertGreaterEqual(len(tools), 8, "Must define at least 8 real climate & weather tools")
        tool_names = [t["function"]["name"] for t in tools]
        self.assertIn("analyze_climate_trend", tool_names)
        self.assertIn("compare_regional_trends", tool_names)
        self.assertIn("get_weather_forecast", tool_names)
        self.assertIn("get_bivariate_correlation", tool_names)
        self.assertIn("get_nasa_power_observations", tool_names)
        self.assertIn("geocode_location", tool_names)

    def test_tool_definition_structure(self):
        tools = {t["function"]["name"]: t for t in get_registered_tools()}
        defn = tools.get("analyze_climate_trend")
        self.assertIsNotNone(defn)
        self.assertEqual(defn["type"], "function")
        self.assertIn("properties", defn["function"]["parameters"])
        self.assertIn("location", defn["function"]["parameters"]["properties"])
        self.assertIn("variable", defn["function"]["parameters"]["properties"])


class TestToolExecution(unittest.TestCase):
    """Test actual execution of tools with real backend data."""

    def test_geocode_location(self):
        res, sources, metrics, viz = execute_tool_call("geocode_location", {"location_name": "Ahmedabad"})
        self.assertEqual(res["status"], "success")
        self.assertAlmostEqual(res["latitude"], 23.0225, delta=0.5)
        self.assertAlmostEqual(res["longitude"], 72.5714, delta=0.5)

    def test_analyze_climate_trend_real_data(self):
        res, sources, metrics, viz = execute_tool_call("analyze_climate_trend", {
            "location": "Ahmedabad",
            "variable": "temperature",
            "start_year": 1990,
            "end_year": 2024
        })
        self.assertEqual(res["status"], "success")
        # Grounding checks: must return real stats
        self.assertIn("sens_slope", res)
        self.assertIn("p_value", res)
        self.assertIn("is_significant", res)
        self.assertGreater(res["n_observations"], 100)
        self.assertTrue(len(sources) > 0)

    def test_compare_regional_trends_real_data(self):
        res, sources, metrics, viz = execute_tool_call("compare_regional_trends", {
            "locations": ["Ahmedabad", "Mumbai"],
            "variable": "rainfall"
        })
        self.assertEqual(res["status"], "success")
        self.assertIn("regions_compared", res)
        self.assertEqual(len(res["regions_compared"]), 2)

    def test_live_weather_forecast(self):
        res, sources, metrics, viz = execute_tool_call("get_weather_forecast", {
            "location": "Bengaluru",
            "ndays": 7
        })
        self.assertEqual(res["status"], "success")
        self.assertIn("days", res)
        self.assertGreaterEqual(len(res["days"]), 5)


class TestConversationManager(unittest.TestCase):
    """Test thread-safe session conversation memory."""

    def setUp(self):
        self.cm = ConversationManager()

    def test_session_lifecycle(self):
        conv_id = "test_conv_lifecycle_001"
        self.assertEqual(len(self.cm.get_messages(conv_id)), 0)

        session = self.cm.get_or_create(conv_id)
        session.add_message("user", "What is the temperature trend?")
        session.add_message("assistant", "The trend is increasing by 0.024 C/year.")

        messages = self.cm.get_messages(conv_id)
        self.assertEqual(len(messages), 2)
        self.assertEqual(messages[0]["role"], "user")
        self.assertEqual(messages[1]["role"], "assistant")

        # Test clear
        cleared = self.cm.clear(conv_id)
        self.assertTrue(cleared)
        self.assertEqual(len(self.cm.get_messages(conv_id)), 0)


class TestAgentIntegration(unittest.TestCase):
    """Test end-to-end agent query processing."""

    def test_agent_query_with_context(self):
        agent = ClimateAgent()
        context = PageContext(
            route="/trends",
            page_name="Trend Detective",
            selected_city="Ahmedabad",
            selected_variable="temperature",
            current_trend_results={
                "direction": "Increasing",
                "sens_slope": 0.024,
                "p_value": 0.00022,
                "statistically_significant": True
            }
        )

        resp = agent.process_chat(
            user_message="Explain the trend shown on this page in simple terms for Ahmedabad.",
            context=context,
            conversation_id="test_agent_ctx_001"
        )

        self.assertEqual(resp.status, "success")
        self.assertTrue(len(resp.message) > 50)
        self.assertTrue(len(resp.sources) > 0)

    def test_agent_query_with_user_location(self):
        agent = ClimateAgent()
        context = PageContext(
            route="/forecast",
            page_name="Forecast",
            user_latitude=23.0225,
            user_longitude=72.5714,
            user_city="Ahmedabad"
        )

        resp = agent.process_chat(
            user_message="What is the weather in my area tomorrow?",
            context=context,
            conversation_id="test_agent_user_loc_001"
        )

        self.assertEqual(resp.status, "success")
        self.assertIn("get_weather_forecast", resp.tool_calls_executed)
        self.assertTrue(len(resp.sources) > 0)


if __name__ == "__main__":
    unittest.main()
