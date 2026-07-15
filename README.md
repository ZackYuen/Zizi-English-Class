# 孜孜學英文 (Zizi English Class)

Cantonese-friendly phonics app for kids: letter tracing, camera object recognition, and listening games.

Static site — **no build step, no npm**.

## Run locally

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`. Camera mode needs HTTPS (or `localhost`) and camera permission.

### iPhone Safari

1. Use HTTPS (or a local network IP serving these files).
2. Hard-refresh after deploys (`style.css?v=…` is cache-busted).
3. Set API keys under 設定 before TTS / listening game / camera AI.

## Modes

| Mode | What it does |
|------|----------------|
| 基礎描字 | Trace letter strokes, then ✨ 讀出嚟 (Google TTS) |
| 探索魔鏡 | Photo → circle object → OpenRouter vision → trace + 📸 再影一個 |
| 聽音大挑戰 | Listen for /æ/ /ɛ/ /ɪ/ and pick the matching word |

## Settings (API keys)

Stored in `localStorage` on the device only:

- `google_tts_key` — Google Cloud Text-to-Speech
- `openrouter_api_key` — OpenRouter vision models

Keys are sent from the browser (fine for a personal/demo app; use a proxy for production).

## Project layout

```text
index.html          # UI shell
style.css           # Mobile-first styles (iPhone Safari)
js/
  data.js           # Phonics groups, stroke paths, vocabulary (D)
  state.js          # Shared globals + audio/loop helpers
  ui.js             # Tabs, letter keyboard, startApp
  canvas.js         # Tracing, magic TTS animation, processWord
  camera.js         # Camera, crop, AI identify
  game.js           # Listening challenge
  router.js         # Home menu, settings, mode routing
```

### Script load order

`data → state → ui → canvas → camera → game → router`

### Architecture notes

- Vanilla JS on `window` (no bundler). Keep globals intentional and owned by `state.js`.
- One render loop only (`startRenderLoop` guard).
- Overlays default hidden in CSS; router clears them on home / `pageshow`.
- Camera writing flow reuses the tracing canvas and shows「再影一個」.

## Review checklist (maintainer)

- [ ] Standard mode shows letter keyboard immediately (group 1 active)
- [ ] No stacked animation loops (check DevTools Performance)
- [ ] Camera → recognize → write →「再影一個」
- [ ] Game + back-to-home leave home menu tappable on iPhone
