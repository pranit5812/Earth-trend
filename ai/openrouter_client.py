"""
AstroKites / AgriNova - OpenRouter API Client
Connects to OpenRouter's OpenAI-compatible completions endpoint.
Supports tool/function calling, retries with exponential backoff, streaming,
and secure credentials handling without exposing secrets.
"""

import os
import json
import time
import logging
from typing import Dict, List, Optional, Any, Iterator
import requests

logger = logging.getLogger("astroke.ai.openrouter")
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s"))
    logger.addHandler(handler)
logger.setLevel(logging.INFO)

OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"


class OpenRouterConfigError(Exception):
    """Raised when OpenRouter API is not configured or key is missing."""
    pass


class OpenRouterAPIError(Exception):
    """Raised when an OpenRouter API request fails."""
    def __init__(self, message: str, status_code: Optional[int] = None, response_body: Optional[str] = None):
        super().__init__(message)
        self.status_code = status_code
        self.response_body = response_body


def _mask_key(key: str) -> str:
    if not key or len(key) < 10:
        return "***"
    return f"{key[:8]}...{key[-4:]}"


def _load_env_file():
    """Lightweight loader for Climate-project/.env"""
    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        env_path = os.path.join(base_dir, ".env")
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    k, v = line.split("=", 1)
                    k, v = k.strip().strip("\ufeff"), v.strip().strip('"').strip("'")
                    if k not in os.environ or not os.environ[k]:
                        os.environ[k] = v
    except Exception:
        pass


class OpenRouterClient:
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        site_url: Optional[str] = None,
        site_name: Optional[str] = None,
        timeout: int = 60
    ):
        _load_env_file()
        self.api_key = api_key or os.environ.get("OPENROUTER_API_KEY", "").strip()
        self.model = model or os.environ.get("OPENROUTER_MODEL", "openai/gpt-4o-mini").strip()
        self.site_url = site_url or os.environ.get("OPENROUTER_SITE_URL", "http://localhost:5173").strip()
        self.site_name = site_name or os.environ.get("OPENROUTER_SITE_NAME", "AstroKites").strip()
        self.timeout = timeout

        if self.api_key:
            logger.info("Initialized OpenRouter client with model: %s, key: %s", self.model, _mask_key(self.api_key))
        else:
            logger.warning("OpenRouterClient initialized without OPENROUTER_API_KEY.")

    def is_configured(self) -> bool:
        return bool(self.api_key and not self.api_key.startswith("your_"))

    def _get_headers(self) -> Dict[str, str]:
        if not self.is_configured():
            raise OpenRouterConfigError(
                "OpenRouter API key is missing or not configured. "
                "Please configure OPENROUTER_API_KEY in the backend .env file."
            )
        return {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": self.site_url,
            "X-Title": self.site_name,
            "Content-Type": "application/json",
        }

    def chat_completion(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        tool_choice: Optional[str] = "auto",
        temperature: float = 0.2,
        max_tokens: int = 1500,
        max_retries: int = 3
    ) -> Dict[str, Any]:
        """
        Executes a synchronous completion call to OpenRouter.
        Retries on 429 rate limits and 5xx server errors with exponential backoff.
        """
        headers = self._get_headers()
        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = tool_choice

        last_error: Optional[Exception] = None
        for attempt in range(max_retries):
            try:
                logger.debug("Calling OpenRouter (attempt %d/%d) with %d messages", attempt + 1, max_retries, len(messages))
                resp = requests.post(
                    OPENROUTER_ENDPOINT,
                    headers=headers,
                    json=payload,
                    timeout=self.timeout
                )

                if resp.status_code == 200:
                    data = resp.json()
                    usage = data.get("usage", {})
                    logger.debug("OpenRouter success tokens: prompt=%s, completion=%s", usage.get("prompt_tokens"), usage.get("completion_tokens"))
                    return data

                # Check retryable status codes
                if resp.status_code in (429, 500, 502, 503, 504):
                    wait_time = (2 ** attempt) + 0.5
                    logger.warning("OpenRouter returned HTTP %d. Retrying in %.1fs...", resp.status_code, wait_time)
                    time.sleep(wait_time)
                    continue

                # Non-retryable error
                error_msg = f"OpenRouter API error (HTTP {resp.status_code}): {resp.text[:300]}"
                logger.error(error_msg)
                raise OpenRouterAPIError(error_msg, status_code=resp.status_code, response_body=resp.text)

            except requests.exceptions.Timeout as e:
                logger.warning("OpenRouter request timed out (attempt %d/%d)", attempt + 1, max_retries)
                last_error = e
                time.sleep(1)
            except requests.exceptions.RequestException as e:
                logger.error("OpenRouter network error: %s", str(e))
                last_error = e
                time.sleep(1)

        raise OpenRouterAPIError(f"Failed to communicate with OpenRouter after {max_retries} attempts: {last_error}")

    def stream_chat_completion(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.2,
        max_tokens: int = 1500
    ) -> Iterator[str]:
        """
        Streams response tokens via Server-Sent Events (SSE).
        Yields raw delta text strings.
        """
        headers = self._get_headers()
        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
        }
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"

        resp = requests.post(
            OPENROUTER_ENDPOINT,
            headers=headers,
            json=payload,
            timeout=self.timeout,
            stream=True
        )

        if resp.status_code != 200:
            raise OpenRouterAPIError(
                f"OpenRouter streaming failed (HTTP {resp.status_code}): {resp.text[:200]}",
                status_code=resp.status_code,
                response_body=resp.text
            )

        for line in resp.iter_lines(decode_unicode=True):
            if not line:
                continue
            if line.startswith("data: "):
                data_str = line[6:].strip()
                if data_str == "[DONE]":
                    break
                try:
                    chunk = json.loads(data_str)
                    choices = chunk.get("choices", [])
                    if choices:
                        delta = choices[0].get("delta", {})
                        content = delta.get("content")
                        if content:
                            yield content
                except Exception:
                    continue
