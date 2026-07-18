# Zizi English Class

Cantonese-friendly English app for young kids (~age 5). Instructions are spoken aloud in Cantonese so children do not need to read UI text.

## Sky Island adventure (kid UX)

- Big picture home with mascot **孜孜**, levels, daily quests, stars / streak
- Soft background music + tap/correct/wrong SFX (Web Audio, toggle on home)
- Modes: 睇圖識字 · 手指描字 · 聽音大挑戰 · 探索魔鏡 · 單詞冊
- Progress saved in `localStorage` (offline-friendly)

## Run

```bash
python3 -m http.server 8080
```



## Why JavaScript (not Python)

This app runs on the child's **iPhone browser** (GitHub Pages / static files):

- Touch drawing, canvas, camera, and speech must run **in the browser**
- Python cannot receive iPhone touch events or draw to a web canvas from the server
- `python3 -m http.server` is only used to **serve** the files locally

So the interactive app stays HTML/CSS/JS. Python is fine for tooling/data scripts, but not for replacing the tracing game itself.

## Voices (important)

Google yue-HK-Standard voices sound robotic. Prefer:

1. **iPhone / browser Cantonese (default)** — free on-device Siri-style `zh-HK` voice; usually the most natural option without setup.
2. **Azure Neural `zh-HK-HiuMaanNeural`（曉曼）** — best cloud quality for kids. Needs Azure Speech key + region (e.g. `eastasia`). If the browser blocks Azure (CORS), the app falls back to iPhone voice.
3. **Google Yue Standard** — last resort; pick Standard-C if you must use Google.

In Settings: choose provider, keep **自動讀出畫面上所有指示** on, tap **試聽廣東話聲線**.
On home: tap **讀出選單同指示** so the child hears the options before playing.

## Modes

1. Picture match (8 questions, progress bar; English words use English voice)
2. Letter tracing
3. Listening challenge
4. Camera magic
5. Word album

## Code

`js/speech.js` owns Cantonese/English engines, `announce()`, and auto-reading status text.
