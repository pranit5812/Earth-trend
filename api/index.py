import sys
import os

# Add parent directory to sys.path so Backend can be imported
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from Backend import app as raw_app


class VercelPathMiddleware:
    """
    Normalizes incoming ASGI request paths when Vercel rewrites requests to /api/index.py.
    Preserves original requested paths (e.g. /, /docs, /api/v1/alerts) across Vercel environments.
    """
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope.get("type") in ("http", "websocket"):
            headers = dict(scope.get("headers", []))
            orig_uri = headers.get(b"x-forwarded-uri", b"").decode("latin1")
            if not orig_uri:
                orig_uri = headers.get(b"x-matched-path", b"").decode("latin1")

            orig_path = orig_uri.split("?")[0] if orig_uri else ""
            path = scope.get("path", "")

            if orig_path and orig_path not in ("/api/index.py", "/api/index"):
                scope["path"] = orig_path
            elif path in ("/api/index.py", "/api/index", "/api/index.py/", "/api/index/"):
                scope["path"] = "/"
            elif path.startswith("/api/index.py/"):
                scope["path"] = path[len("/api/index.py"):]
            elif path.startswith("/api/index/"):
                scope["path"] = path[len("/api/index"):]

        await self.app(scope, receive, send)


app = VercelPathMiddleware(raw_app)
