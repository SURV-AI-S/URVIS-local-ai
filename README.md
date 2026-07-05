# URVIS Local AI

URVIS Local AI is a local-first web interface for chatting with Ollama-compatible local models. It is designed for pasted-code assistance, Unity/C# explanations, refactoring snippets, debugging pasted errors, generating small Unity scripts, and local AI experimentation.

## What this project is

URVIS Local AI is a static browser-based chat UI that connects to a locally running Ollama-compatible API, usually at `http://127.0.0.1:11434`.

It works best with pasted code, pasted errors, and direct questions. The app stores basic settings and chat history in the browser with `localStorage`.

## What this project is not

This project is not an AI model.

This project does not include model weights, downloaded models, Ollama binaries, IPEX-LLM binaries, or model cache files.

It does not automatically scan, index, or read a user's project files. Users must paste the code, error messages, or context they want to discuss.

Users are responsible for downloading and using models according to their respective licenses.

## Features

- Local-first chat interface for Ollama-compatible models
- Model selector from the local Ollama API
- Manual model fallback
- Streaming responses
- Prompt templates for pasted snippets, debugging, and Unity script generation
- Unity/C# focused default assistant behavior
- Chat import and export as JSON
- Browser `localStorage` persistence
- Futuristic static UI with no build step

## Requirements

- Windows 10/11 or Linux
- A locally running Ollama-compatible server
- Browser
- Python 3, optional, only for serving the static page locally

## Setup

Clone or download this repository, then make sure an Ollama-compatible server is running locally.

Expected local API URL:

```text
http://127.0.0.1:11434
```

If browser requests are blocked by CORS, restart Ollama with `OLLAMA_ORIGINS` including the web app URL, for example `http://127.0.0.1:3000`.

## Running locally

From this folder:

```bat
cd /d G:\URVIS\ollama-chat-ui-github
py -m http.server 3000
```

Then open:

```text
http://127.0.0.1:3000
```

On Linux/macOS, use:

```sh
python3 -m http.server 3000
```

You can also review and edit `scripts/start_windows.bat` for a Windows helper script.

## Recommended models

- `qwen2.5-coder:7b-instruct`
- `qwen2.5-coder:14b`
- `llama3.1:8b`
- `nomic-embed-text` only if used elsewhere for embeddings

Model availability, performance, and licensing are controlled by the model authors and distribution source.

## Usage examples

- Paste a Unity C# script and ask for an explanation.
- Paste a Unity Console error and ask for debugging help.
- Ask for a safe refactor of a pasted snippet.
- Ask for a small Unity MonoBehaviour script.
- Ask direct questions about local development experiments.

## Troubleshooting

See [docs/troubleshooting.md](docs/troubleshooting.md) for common issues including Ollama connectivity, missing models, CORS, Python command differences, browser cache issues, and occupied ports.

## Security notes

- Keep Ollama local.
- Do not expose port `11434` publicly.
- Do not paste secrets, passwords, API keys, private keys, or sensitive company code.
- This app does not provide authentication.
- This app is local-first, but users are responsible for their own environment.

## Credits

- Ollama-compatible API support
- Qwen Coder models belong to their respective authors
- Llama models belong to their respective authors
- Other models belong to their respective authors
- UI/workflow by `[Your Name]`

Model weights are not included in this repository.

## License

The app code in this repository is released under the MIT License. See [LICENSE](LICENSE).
