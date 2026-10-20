# HomeCenter

## Run Milo with live AI replies

Milo uses the OpenAI Responses API through a small local Python server. Python 3 is required. Keep your API key in the server terminal; do not put it in `app.html`, JavaScript, or `apps.json`.

In PowerShell, open this folder and run:

```powershell
$env:OPENAI_API_KEY = "your-api-key"
python server.py
```

Then open <http://127.0.0.1:8000/app.html>. Leave the terminal running while you use HomeCenter. The badge beside Milo's name shows whether the server is connected and the API key is configured.

The server uses `gpt-6-astra` by default. To choose a different model available to your API project, set `OPENAI_MODEL` before starting the server:

```powershell
$env:OPENAI_MODEL = "gpt-6-astra"
```

OpenAI API usage may be billed to your API project. Chat history stays in the open page session and is not saved by HomeCenter. Your messages are sent to the OpenAI API to generate replies. The server binds to `127.0.0.1`, so it is only available from this computer.
