// ==========================================
// Routing & home menu
// iPhone Safari: never leave ghost overlays capturing taps
// ==========================================

window.currentMode = 'none';

function setDisplay(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = value;
    if (id === 'home-menu' && value !== 'none') {
        el.style.flexDirection = 'column';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'flex-start';
    }
    if (value === 'none') {
        el.classList.remove('is-open');
        el.setAttribute('aria-hidden', 'true');
    } else {
        el.classList.add('is-open');
        el.setAttribute('aria-hidden', 'false');
    }
}

function hideAllOverlays() {
    setDisplay('camera-overlay', 'none');
    setDisplay('game-overlay', 'none');
    setDisplay('match-overlay', 'none');
    setDisplay('album-overlay', 'none');
    setDisplay('settings-modal', 'none');
    setDisplay('app', 'none');
    setDisplay('standard-ui', 'none');
    setDisplay('standard-top-bar', 'none');
    setDisplay('back-to-home-btn', 'none');
}

// Cantonese TTS — Google preferred, browser zh-HK fallback so kids can play without keys
window.playCantoneseTTS = async function (text, opts) {
    const options = opts || {};
    if (window.stopAllAudio) window.stopAllAudio();

    const key = localStorage.getItem('google_tts_key');
    if (!key) {
        if (options.requireKey) {
            window.openSettings();
            return;
        }
        if (window.speakCantoneseBrowser) window.speakCantoneseBrowser(text);
        return;
    }

    try {
        const res = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize?key=' + key, {
            method: 'POST',
            body: JSON.stringify({
                input: { text: text },
                voice: { languageCode: 'yue-HK', name: 'yue-HK-Standard-A' },
                audioConfig: { audioEncoding: 'MP3' }
            })
        });
        const data = await res.json();
        if (data.audioContent) {
            window.uiAudio = window.uiAudio || new Audio();
            window.uiAudio.src = 'data:audio/mp3;base64,' + data.audioContent;
            const playPromise = window.uiAudio.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(function (e) { console.log('Audio play blocked', e); });
            }
        } else if (window.speakCantoneseBrowser) {
            window.speakCantoneseBrowser(text);
        }
    } catch (e) {
        console.error('TTS Error', e);
        if (window.speakCantoneseBrowser) window.speakCantoneseBrowser(text);
    }
};

window.openSettings = function () {
    const tts = document.getElementById('input-google-tts');
    const or = document.getElementById('input-openrouter');
    if (tts) tts.value = localStorage.getItem('google_tts_key') || '';
    if (or) or.value = localStorage.getItem('openrouter_api_key') || '';
    setDisplay('settings-modal', 'flex');
};

window.saveSettings = function () {
    const tts = (document.getElementById('input-google-tts').value || '').trim();
    const or = (document.getElementById('input-openrouter').value || '').trim();

    if (tts) localStorage.setItem('google_tts_key', tts);
    else localStorage.removeItem('google_tts_key');

    if (or) localStorage.setItem('openrouter_api_key', or);
    else localStorage.removeItem('openrouter_api_key');

    setDisplay('settings-modal', 'none');

    if (tts) window.playCantoneseTTS('設定儲存成功！');
    else window.playCantoneseTTS('已經儲存。冇 Google Key 都可以用瀏覽器聲玩睇圖識字！');
};

window.closeSettings = function () {
    setDisplay('settings-modal', 'none');
};

window.enterMode = function (mode) {
    window.currentMode = mode;
    setDisplay('home-menu', 'none');
    setDisplay('settings-modal', 'none');
    setDisplay('album-overlay', 'none');
    setDisplay('back-to-home-btn', 'block');

    if (mode === 'standard') {
        setDisplay('camera-overlay', 'none');
        setDisplay('game-overlay', 'none');
        setDisplay('match-overlay', 'none');
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
        setDisplay('match-overlay', 'none');
        if (window.openCamera) window.openCamera();
    } else if (mode === 'game') {
        setDisplay('standard-top-bar', 'none');
        setDisplay('app', 'none');
        setDisplay('standard-ui', 'none');
        setDisplay('camera-overlay', 'none');
        setDisplay('match-overlay', 'none');
        if (window.startGame) window.startGame();
    } else if (mode === 'match') {
        setDisplay('standard-top-bar', 'none');
        setDisplay('app', 'none');
        setDisplay('standard-ui', 'none');
        setDisplay('camera-overlay', 'none');
        setDisplay('game-overlay', 'none');
        if (window.startMatchGame) window.startMatchGame();
    } else if (mode === 'album') {
        // Album is a modal over home — bring home back under it
        setDisplay('back-to-home-btn', 'none');
        setDisplay('home-menu', 'flex');
        window.currentMode = 'none';
        if (window.openWordAlbum) window.openWordAlbum();
    }
};

window.backToHome = function () {
    if (window.stopAllAudio) window.stopAllAudio();
    if (window.speechSynthesis) {
        try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    }
    if (window.gameNextTimeout) clearTimeout(window.gameNextTimeout);
    if (window.gameReplayTimeout) clearTimeout(window.gameReplayTimeout);

    window.isGamePlaying = false;
    window.isGameProcessing = false;
    window.isMatchPlaying = false;
    window.isMatchProcessing = false;
    window.isAnalyzing = false;

    if (window.currentAborter) {
        try { window.currentAborter.abort(); } catch (e) { /* ignore */ }
        window.currentAborter = null;
    }

    if (window.closeCamera) window.closeCamera();
    if (window.exitMatchGame) window.exitMatchGame();

    hideAllOverlays();
    window.currentMode = 'none';
    setDisplay('home-menu', 'flex');
    if (window.refreshHomeProgress) window.refreshHomeProgress();
};

window.addEventListener('pageshow', function () {
    if (window.currentMode === 'none') {
        setDisplay('camera-overlay', 'none');
        setDisplay('game-overlay', 'none');
        setDisplay('match-overlay', 'none');
        setDisplay('album-overlay', 'none');
        setDisplay('settings-modal', 'none');
        setDisplay('home-menu', 'flex');
        setDisplay('back-to-home-btn', 'none');
        if (window.refreshHomeProgress) window.refreshHomeProgress();
    }
});
