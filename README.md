# 孜孜學英文 (Zizi English Class)

Cantonese-friendly English phonics app for young kids (around age 5): play first, learn through stars, pictures, tracing, and listening.

Static site — **no build step, no npm**.

## Run locally

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`. Camera mode needs HTTPS (or `localhost`).

### iPhone Safari

1. Hard-refresh after deploys (`style.css?v=…` is cache-busted).
2. **睇圖識字** works **without API keys** (browser speech).
3. Google TTS / OpenRouter make pronunciation and camera magic clearer, but are optional for the core play loop.

## Modes (suggested order for a 5-year-old)

1. **🖼️ 睇圖識字** — hear English, tap the right emoji (offline-friendly)
2. **✍️ 基礎描字** — trace letters, earn stars, ✨ 讀出嚟
3. **🎧 聽音大挑戰** — A/E/I sound game (browser voice if no Google key)
4. **📸 探索魔鏡** — photo → AI word → write (needs OpenRouter)
5. **📒 我嘅單詞冊** — collection of learned words; tap to hear again

Progress (**stars / words / streak**) is saved on the device in `localStorage`.

## Settings

| Key | Used for |
|-----|----------|
| `google_tts_key` | Clearer Cantonese + English voices |
| `openrouter_api_key` | Camera object recognition |

## Project layout

```text
index.html
style.css
js/
  data.js       vocabulary + stroke paths
  state.js      shared state + audio/loop helpers
  speech.js     English/Cantonese speech helpers + fallbacks
  progress.js   stars, streak, word album
  ui.js         tabs / keyboard / startApp
  canvas.js     tracing + magic TTS
  camera.js     camera / crop / AI
  game.js       listening challenge
  match.js      picture match (kid mode)
  router.js     home / settings / routing
```

## Parent tip

10–15 minutes a day is enough. Start with 睇圖識字, celebrate stars, then try one tracing letter.
