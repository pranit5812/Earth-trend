"""
AstroKites / AgriNova - AI Climate Agent
Orchestrates the tool-calling loop, OpenRouter integration, session memory,
and ground-truth response synthesis.
"""

import json
import logging
from typing import Dict, Any, List, Optional, Tuple, Iterator
from schemas.chatbot_schemas import PageContext, ChatResponse
from ai.openrouter_client import OpenRouterClient, OpenRouterConfigError, OpenRouterAPIError
from ai.system_prompt import build_system_prompt
from ai.tool_registry import get_registered_tools
from ai.tool_executor import execute_tool_call
from ai.conversation_manager import conversation_manager

logger = logging.getLogger("astroke.ai.agent")

MAX_TOOL_ITERATIONS = 5


class ClimateAgent:
    def __init__(self, client: Optional[OpenRouterClient] = None):
        self.client = client or OpenRouterClient()

    def process_chat(
        self,
        user_message: str,
        context: Optional[PageContext] = None,
        conversation_id: Optional[str] = None
    ) -> ChatResponse:
        """
        Executes the full conversational agent pipeline:
        1. Injects live page context & conversation history.
        2. Queries OpenRouter with backend tool definitions.
        3. Executes tool calls iteratively on real services.
        4. Returns validated grounded response with citation chips & metrics.
        """
        session = conversation_manager.get_or_create(conversation_id)
        cid = session.conversation_id

        # Merge or update remembered session location & variable
        if context:
            if context.selected_location:
                session.last_location = context.selected_location
            if context.selected_variable:
                session.last_variable = context.selected_variable
        elif session.last_location or session.last_variable:
            # Re-inject remembered session attributes
            context = context or PageContext()
            if not context.selected_location and session.last_location:
                context.selected_location = session.last_location
            if not context.selected_variable and session.last_variable:
                context.selected_variable = session.last_variable

        # Check OpenRouter configuration
        if not self.client.is_configured():
            err_msg = (
                "The AstroKites AI Assistant is not configured. "
                "Please configure OPENROUTER_API_KEY in the backend .env file to enable live intelligence."
            )
            return ChatResponse(
                status="error",
                conversation_id=cid,
                message=err_msg,
                error="MISSING_OPENROUTER_KEY"
            )

        # Build message history for OpenRouter
        system_content = build_system_prompt(context)
        messages: List[Dict[str, Any]] = [{"role": "system", "content": system_content}]

        # Append recent conversation history from session
        for m in session.messages:
            # Sanitize message fields for OpenRouter
            clean_m: Dict[str, Any] = {"role": m["role"], "content": m.get("content") or ""}
            if m.get("name"):
                clean_m["name"] = m["name"]
            if m.get("tool_call_id"):
                clean_m["tool_call_id"] = m["tool_call_id"]
            if m.get("tool_calls"):
                clean_m["tool_calls"] = m["tool_calls"]
            messages.append(clean_m)

        # Append current user prompt
        messages.append({"role": "user", "content": user_message})

        tools = get_registered_tools()
        executed_tools: List[str] = []
        collected_sources: List[Dict[str, Any]] = []
        last_metrics: Optional[Dict[str, Any]] = None
        last_evidence: Optional[Dict[str, Any]] = None
        last_viz_type: Optional[str] = None

        # Tool execution loop
        for iteration in range(MAX_TOOL_ITERATIONS):
            try:
                resp = self.client.chat_completion(messages=messages, tools=tools)
            except OpenRouterConfigError as e:
                return ChatResponse(status="error", conversation_id=cid, message=str(e), error="CONFIG_ERROR")
            except OpenRouterAPIError as e:
                logger.error("OpenRouter API error in agent loop: %s", str(e))
                return ChatResponse(
                    status="error",
                    conversation_id=cid,
                    message=f"I couldn't retrieve the requested climate information because the AI service encountered an error: {str(e)}",
                    error="API_ERROR"
                )

            choice = resp.get("choices", [{}])[0]
            msg = choice.get("message", {})
            tool_calls = msg.get("tool_calls")

            # Case A: Model requested tool execution
            if tool_calls:
                logger.info("Agent iteration %d: Model requested %d tool calls", iteration + 1, len(tool_calls))
                # Append assistant tool_calls message
                messages.append(msg)

                for tc in tool_calls:
                    call_id = tc.get("id")
                    fn_info = tc.get("function", {})
                    fn_name = fn_info.get("name")
                    fn_args = fn_info.get("arguments", "{}")

                    executed_tools.append(fn_name)

                    # Execute tool against actual backend with active user location and page context
                    tool_res, sources, metrics, viz_type = execute_tool_call(fn_name, fn_args, context=context)

                    collected_sources.extend(sources)
                    if metrics:
                        last_metrics = metrics
                    if viz_type:
                        last_viz_type = viz_type
                    if tool_res.get("status") == "success":
                        last_evidence = tool_res

                    # Append tool result message
                    messages.append({
                        "role": "tool",
                        "tool_call_id": call_id,
                        "name": fn_name,
                        "content": json.dumps(tool_res)
                    })

                # Continue loop to allow model to synthesize final answer from real data
                continue

            # Case B: Model completed response with final text
            final_text = msg.get("content", "").strip()

            # Record in session memory
            session.add_message(role="user", content=user_message)
            session.add_message(role="assistant", content=final_text)
            if last_evidence:
                session.last_evidence = last_evidence

            # Deduplicate sources safely
            unique_sources = []
            seen_src = set()
            for s in collected_sources:
                if isinstance(s, dict):
                    name_val = s.get("name") or s.get("dataset_source") or "NASA Earth Science Data"
                    if name_val not in seen_src:
                        seen_src.add(name_val)
                        unique_sources.append(s)
                elif isinstance(s, str) and s not in seen_src:
                    seen_src.add(s)
                    unique_sources.append({"name": s})

            return ChatResponse(
                status="success",
                conversation_id=cid,
                message=final_text,
                sources=unique_sources,
                metrics=last_metrics,
                evidence_data=last_evidence,
                visualization_type=last_viz_type,
                tool_calls_executed=executed_tools
            )

        # Fallback if tool iterations exceeded
        return ChatResponse(
            status="error",
            conversation_id=cid,
            message="The analysis required more calculation steps than permitted. Please refine your query.",
            error="MAX_ITERATIONS_EXCEEDED"
        )


# Global agent instance
climate_agent = ClimateAgent()
