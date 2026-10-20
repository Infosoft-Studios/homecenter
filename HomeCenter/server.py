"""Serve HomeCenter locally and proxy companion messages to OpenAI."""

import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parent
HOST = "127.0.0.1"
PORT = int(os.environ.get("HOMECENTER_PORT", "8000"))
DEFAULT_MODEL = "gpt-6-astra"
MAX_BODY_BYTES = 48_000
MAX_MESSAGES = 24
MAX_MESSAGE_CHARS = 4_000


class HomeCenterHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def _json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/api/health":
            self._json(200, {
                "configured": bool(os.environ.get("OPENAI_API_KEY")),
                "model": os.environ.get("OPENAI_MODEL", DEFAULT_MODEL),
            })
            return
        super().do_GET()

    def do_POST(self):
        if self.path != "/api/chat":
            self._json(404, {"error": "Not found."})
            return

        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            self._json(503, {"error": "Milo is not connected yet. Set OPENAI_API_KEY in the terminal, then restart server.py."})
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length < 1 or length > MAX_BODY_BYTES:
                self._json(413, {"error": "This message is too large. Please shorten it and try again."})
                return

            request_data = json.loads(self.rfile.read(length).decode("utf-8"))
            messages = request_data.get("messages")
            if not isinstance(messages, list) or not messages:
                self._json(400, {"error": "Send a message to start the conversation."})
                return

            safe_messages = []
            for message in messages[-MAX_MESSAGES:]:
                if not isinstance(message, dict) or message.get("role") not in ("user", "assistant"):
                    continue
                content = message.get("content")
                if isinstance(content, str) and content.strip():
                    safe_messages.append({"role": message["role"], "content": content[:MAX_MESSAGE_CHARS]})
            if not safe_messages or safe_messages[-1]["role"] != "user":
                self._json(400, {"error": "Your latest message could not be read. Please try again."})
                return
        except (ValueError, UnicodeDecodeError, json.JSONDecodeError):
            self._json(400, {"error": "The chat request was not valid JSON."})
            return

        payload = {
            "model": os.environ.get("OPENAI_MODEL", DEFAULT_MODEL),
            "instructions": (
                "You are Milo, a warm, curious, grounded personal helper and friendly conversation partner. "
                "Help the user talk things through, explore ideas, and solve practical problems step by step. "
                "Be natural and concise, ask one useful follow-up question when context is missing, and never pretend "
                "to have feelings or a human relationship. Be honest about uncertainty. For urgent danger or medical, "
                "legal, or financial decisions, encourage appropriate professional or emergency help."
            ),
            "input": safe_messages,
            "max_output_tokens": 700,
            "store": False,
        }
        api_request = Request(
            "https://api.openai.com/v1/responses",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": "Bearer " + api_key,
                "Content-Type": "application/json",
            },
            method="POST",
        )

        try:
            with urlopen(api_request, timeout=60) as response:
                result = json.loads(response.read().decode("utf-8"))
            answer_parts = []
            for item in result.get("output", []):
                if item.get("type") == "message":
                    for part in item.get("content", []):
                        if part.get("type") == "output_text" and isinstance(part.get("text"), str):
                            answer_parts.append(part["text"])
            answer = "\n".join(answer_parts).strip()
            if not answer:
                self._json(502, {"error": "Milo did not receive a text reply. Please try again."})
                return
            self._json(200, {"reply": answer})
        except HTTPError as error:
            if error.code == 401:
                message = "OpenAI rejected the API key. Check OPENAI_API_KEY and restart server.py."
            elif error.code == 429:
                message = "The OpenAI API is busy or the project has no available quota. Check your API project and try again."
            else:
                message = "The OpenAI API request failed (HTTP %s). Check the server terminal for details." % error.code
            print("OpenAI API error:", error.code, error.read().decode("utf-8", errors="replace")[:1000])
            self._json(502, {"error": message})
        except (URLError, TimeoutError) as error:
            print("OpenAI connection error:", error)
            self._json(502, {"error": "Could not reach the OpenAI API. Check your internet connection and try again."})
        except (json.JSONDecodeError, KeyError, TypeError) as error:
            print("OpenAI response error:", error)
            self._json(502, {"error": "Milo received an unexpected response. Please try again."})


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), HomeCenterHandler)
    print("HomeCenter is running at http://%s:%s" % (HOST, PORT))
    print("Press Ctrl+C to stop the server.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping HomeCenter...")
        server.server_close()
