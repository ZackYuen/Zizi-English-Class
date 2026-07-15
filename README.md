# Zizi English Class

Cantonese-friendly English app for young kids (~age 5). Instructions are spoken aloud in Cantonese so children do not need to read UI text.

## Run

```bash
python3 -m http.server 8080
```

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
