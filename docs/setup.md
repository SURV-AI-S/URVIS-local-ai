# Setup

URVIS Local AI is a static web interface. It connects to a locally running Ollama-compatible API.

## Requirements

- Windows 10/11 or Linux
- Browser
- Local Ollama-compatible server
- Python 3, optional, for serving the static files

## Start Ollama

Start Ollama or another compatible local server before using the web UI.

Expected API URL:

```text
http://127.0.0.1:11434
```

## Start the web UI

From the repository folder:

```bat
cd /d G:\URVIS\ollama-chat-ui-github
py -m http.server 3000
```

Open:

```text
http://127.0.0.1:3000
```

## CORS note

If the browser blocks requests, restart Ollama with `OLLAMA_ORIGINS` including the web app URL, such as:

```text
http://127.0.0.1:3000
```

Exact environment-variable setup depends on how Ollama is launched on your system.
