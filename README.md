# 孜孜學英文 (Zizi English Class)

Cantonese-friendly phonics app for kids: letter tracing, camera object recognition, and listening games.

## Run locally

This is a static site (no build step, no npm).

```bash
# any static server works, e.g.:
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

Camera mode needs HTTPS (or `localhost`) and browser camera permission.

## Modes

1. **基礎描字模式** — trace letter strokes, then play Google TTS “magic” animation
2. **探索魔鏡模式** — take a photo, circle an object, identify via OpenRouter vision models, then trace
3. **聽音大挑戰** — listen for /æ/ /ɛ/ /ɪ/ and pick the matching word

## Settings (API keys)

Stored in `localStorage` on the device:

- `google_tts_key` — Google Cloud Text-to-Speech
- `openrouter_api_key` — OpenRouter (camera vision)

## Project layout

| File | Role |
|------|------|
| `index.html` | Shell UI + script load order |
| `data.js` | Phonics groups, stroke paths, vocabulary |
| `state.js` | Shared canvas / audio state |
| `ui.js` | Tabs, keyboard, `startApp` |
| `canvas.js` | Tracing, magic animation, TTS |
| `camera.js` | Camera, crop circle, AI identify |
| `game.js` | Listening challenge |
| `router.js` | Home menu + settings |
| `style.css` | Layout styles |

Legacy unused files (not loaded by `index.html`): `app.js`, `scripts.js`.
