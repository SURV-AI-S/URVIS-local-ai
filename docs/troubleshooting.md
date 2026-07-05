# Troubleshooting

## Ollama not reachable

Make sure Ollama or another compatible server is running locally. The default expected URL is:

```text
http://127.0.0.1:11434
```

Check the app settings and confirm the host URL is correct.

## Model not found

Pull or install the selected model in Ollama, for example:

```bat
ollama pull qwen2.5-coder:7b-instruct
```

Then refresh the page or reopen settings.

## CORS blocked

If the browser blocks requests, restart Ollama with `OLLAMA_ORIGINS` including the web app origin, for example:

```text
http://127.0.0.1:3000
```

## Python command not found

On Windows, try:

```bat
py -m http.server 3000
```

If `py` is not installed, install Python or use another static file server.

## `py` works but `python` does not

This is normal on some Windows installations. Use `py` in the commands and scripts.

## Browser cache issue

Hard refresh the browser or clear site data for `127.0.0.1:3000`.

## Port 3000 already in use

Use a different port:

```bat
py -m http.server 3001
```

Then open:

```text
http://127.0.0.1:3001
```
