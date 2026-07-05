# Project Status

## Current features

- Static local web UI for Ollama-compatible chat APIs
- Local model selector
- Manual model fallback
- Streaming chat responses
- Unity/C# focused system prompt
- Prompt templates for pasted code, debugging, and small script generation
- Chat import/export as JSON
- Browser `localStorage` persistence
- Responsive futuristic UI

## Known limitations

- Requires a separate local Ollama-compatible server.
- Browser CORS settings may require Ollama configuration.
- No authentication is provided.
- Chat history is stored only in the current browser.
- The markdown renderer is intentionally simple.
- Model quality depends on the model selected by the user.

## Planned improvements

- Improve accessibility labels and keyboard flow.
- Add clearer connection diagnostics.
- Add more editable prompt presets.
- Add optional theme controls.
- Improve exported chat metadata.

## Not supported features

- Automatic file explorer
- Autonomous file editing
- Codebase indexing
- Included AI models
