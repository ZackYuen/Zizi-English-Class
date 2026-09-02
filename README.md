# 孜孜英文大冒險

Cantonese-friendly **games** that sneak in phonics: hide-and-seek, balloon shooting, letter racing, and spot-the-difference.

## Run locally

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`. Camera needs HTTPS (or localhost) and permission.

## Games

1. **魔鏡捉迷藏** — photo an object, AI names it, hear/spell the English, then find it in the bushes. After 3 finds, spot the difference between two “photos”.
2. **描字賽車** — trace the letter to beat a turtle. Magic TTS still plays when you finish.
3. **音爆射擊** — hear /æ/ /ɛ/ /ɪ/, pop the matching balloons.
4. **搵唔同** — hide-and-seek + spot-the-difference with vocab (no camera).

## Settings

`localStorage`: `google_tts_key`, `openrouter_api_key`. Stars: `zizi_arcade_stars`.
