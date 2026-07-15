// ==========================================
// 🚀 模式路由與主選單邏輯 (Routing & Menu)
// iPhone Safari: never leave ghost overlays capturing taps
// ==========================================

window.currentMode = 'none';

function setDisplay(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = value;
    if (value === 'none') {
        el.classList.remove('is-open');
        el.setAttribute('aria-hidden', 'true');
    } else {
        el.classList.add('is-open');
        el.setAttribute('aria-hidden', 'false');
    }
}

function hideAllOverlays() {
    setDisplay('start-overlay', 'none');
    setDisplay('camera-overlay', 'none');
    setDisplay('game-overlay', 'none');
    setDisplay('settings-modal', 'none');
    setDisplay('app', 'none');
    setDisplay('standard-ui', 'none');
    setDisplay('standard-top-bar', 'none');
    setDisplay('camera-ui-container', 'none');
    setDisplay('back-to-home-btn', 'none');
}

// 🌟 1. Google TTS — missing key does NOT steal taps (silent skip for ambience)
window.playCantoneseTTS = async function(text, opts) {
    const options = opts || {};
    if (window.stopAllAudio) window.stopAllAudio();

    let key = localStorage.getItem('google_tts_key');
    if (!key) {
        if (options.requireKey) window.openSettings();
        return;
    }

    try {
        let res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`, {
            method: 'POST',
            body: JSON.stringify({
                input: { text: text },
                voice: { languageCode: 'yue-HK', name: 'yue-HK-Standard-A' },
                audioConfig: { audioEncoding: 'MP3' }
            })
        });
        let data = await res.json();
        if (data.audioContent) {
            window.uiAudio = window.uiAudio || new Audio();
            window.uiAudio.src = 'data:audio/mp3;base64,' + data.audioContent;
            const playPromise = window.uiAudio.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(function (e) { console.log('Audio play blocked', e); });
            }
        }
    } catch (e) {
        console.error('TTS Error', e);
    }
};

// 🌟 2. UI 設定介面開關邏輯
window.openSettings = function() {
    const tts = document.getElementById('input-google-tts');
    const or = document.getElementById('input-openrouter');
    if (tts) tts.value = localStorage.getItem('google_tts_key') || '';
    if (or) or.value = localStorage.getItem('openrouter_api_key') || '';
    setDisplay('settings-modal', 'flex');
};

window.saveSettings = function() {
    let tts = (document.getElementById('input-google-tts').value || '').trim();
    let or = (document.getElementById('input-openrouter').value || '').trim();

    if (tts) localStorage.setItem('google_tts_key', tts);
    else localStorage.removeItem('google_tts_key');

    if (or) localStorage.setItem('openrouter_api_key', or);
    else localStorage.removeItem('openrouter_api_key');

    setDisplay('settings-modal', 'none');

    if (tts) {
        window.playCantoneseTTS('設定儲存成功！');
    }
};

window.closeSettings = function() {
    setDisplay('settings-modal', 'none');
};

// 🌟 3. 路由切換邏輯
window.enterMode = function(mode) {
    window.currentMode = mode;
    setDisplay('home-menu', 'none');
    setDisplay('settings-modal', 'none');
    setDisplay('start-overlay', 'none');
    setDisplay('back-to-home-btn', 'block');

    if (mode === 'standard') {
        setDisplay('camera-overlay', 'none');
        setDisplay('game-overlay', 'none');
        setDisplay('standard-top-bar', 'flex');
        setDisplay('app', 'block');
        setDisplay('standard-ui', 'block');
        const reCam = document.getElementById('btn-re-cam');
        if (reCam) reCam.style.display = 'none';

        if (typeof startApp === 'function') startApp('standard');
        if (window.playCantoneseTTS) window.playCantoneseTTS('一齊寫字啦！');
    } else if (mode === 'camera') {
        setDisplay('standard-top-bar', 'none');
        setDisplay('app', 'none');
        setDisplay('standard-ui', 'none');
        setDisplay('game-overlay', 'none');
        if (window.openCamera) window.openCamera();
    } else if (mode === 'game') {
        setDisplay('standard-top-bar', 'none');
        setDisplay('app', 'none');
        setDisplay('standard-ui', 'none');
        setDisplay('camera-overlay', 'none');
        if (window.startGame) window.startGame();
    }
};

window.backToHome = function() {
    if (window.stopAllAudio) window.stopAllAudio();
    if (window.gameNextTimeout) clearTimeout(window.gameNextTimeout);
    if (window.gameReplayTimeout) clearTimeout(window.gameReplayTimeout);

    window.isGamePlaying = false;
    window.isGameProcessing = false;
    window.isAnalyzing = false;

    if (window.currentAborter) {
        try { window.currentAborter.abort(); } catch (e) { /* ignore */ }
        window.currentAborter = null;
    }

    if (window.closeCamera) window.closeCamera();

    hideAllOverlays();
    window.currentMode = 'none';
    setDisplay('home-menu', 'flex');
};

// Ensure home is tappable after first paint (Safari bfcache / restored tabs)
window.addEventListener('pageshow', function () {
    if (window.currentMode === 'none') {
        setDisplay('start-overlay', 'none');
        setDisplay('camera-overlay', 'none');
        setDisplay('game-overlay', 'none');
        setDisplay('settings-modal', 'none');
        setDisplay('home-menu', 'flex');
        setDisplay('back-to-home-btn', 'none');
    }
});
