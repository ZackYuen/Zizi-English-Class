// ==========================================
// Routing & home menu
// iPhone Safari: never leave ghost overlays capturing taps
// ==========================================

window.currentMode = 'none';

function setDisplay(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    // Home menu must stay block-stacked (flex row bug on some iOS Safari)
    if (id === 'home-menu' && value !== 'none') {
        el.style.display = 'block';
        el.style.position = 'fixed';
        el.style.top = '0';
        el.style.right = '0';
        el.style.bottom = '0';
        el.style.left = '0';
        el.style.width = '100%';
        el.style.zIndex = '9000';
        el.style.overflowX = 'hidden';
        el.style.overflowY = 'auto';
        el.style.textAlign = 'center';
        el.style.flexDirection = '';
        el.style.alignItems = '';
        el.style.justifyContent = '';
    } else {
        el.style.display = value;
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
    setDisplay('celebrate-overlay', 'none');
    setDisplay('camera-overlay', 'none');
    setDisplay('game-overlay', 'none');
    setDisplay('match-overlay', 'none');
    setDisplay('album-overlay', 'none');
    setDisplay('settings-modal', 'none');
    setDisplay('play-overlay', 'none');
    setDisplay('race-overlay', 'none');
    setDisplay('puzzle-overlay', 'none');
    setDisplay('hunt-overlay', 'none');
    setDisplay('shoot-overlay', 'none');
    setDisplay('app', 'none');
    setDisplay('standard-ui', 'none');
    setDisplay('standard-top-bar', 'none');
    setDisplay('back-to-home-btn', 'none');
}

window.openSettings = function () {
    const vs = window.getVoiceSettings ? window.getVoiceSettings() : {};
    const provider = document.getElementById('input-voice-provider');
    const azureKey = document.getElementById('input-azure-speech');
    const azureRegion = document.getElementById('input-azure-region');
    const azureVoice = document.getElementById('input-azure-voice');
    const googleYue = document.getElementById('input-google-yue-voice');
    const tts = document.getElementById('input-google-tts');
    const or = document.getElementById('input-openrouter');
    const autoRead = document.getElementById('input-auto-read');

    if (provider) provider.value = vs.provider || 'google';
    if (azureKey) azureKey.value = vs.azureKey || '';
    if (azureRegion) azureRegion.value = vs.azureRegion || 'eastasia';
    if (azureVoice) azureVoice.value = vs.azureVoice || 'zh-HK-HiuMaanNeural';
    if (googleYue) googleYue.value = vs.googleYueVoice || 'yue-HK-Chirp3-HD-Kore';
    // Show local overrides only (not deploy secrets) so Pages keys stay out of the form
    if (tts) tts.value = localStorage.getItem('google_tts_key') || '';
    if (or) or.value = localStorage.getItem('openrouter_api_key') || '';
    if (autoRead) autoRead.checked = vs.autoRead !== false;
    if (window.refreshSecretsStatus) window.refreshSecretsStatus();

    setDisplay('settings-modal', 'flex');
    if (window.announce) {
        window.announce('設定頁面。而家預設用同小學預備班一樣嘅 Google 高質聲線。', { force: true });
    }
};

window.saveSettings = function () {
    const provider = (document.getElementById('input-voice-provider') || {}).value || 'google';
    const azureKey = ((document.getElementById('input-azure-speech') || {}).value || '').trim();
    const azureRegion = ((document.getElementById('input-azure-region') || {}).value || 'eastasia').trim();
    const azureVoice = ((document.getElementById('input-azure-voice') || {}).value || 'zh-HK-HiuMaanNeural').trim();
    const googleYue = ((document.getElementById('input-google-yue-voice') || {}).value || 'yue-HK-Chirp3-HD-Kore').trim();
    const tts = ((document.getElementById('input-google-tts') || {}).value || '').trim();
    const or = ((document.getElementById('input-openrouter') || {}).value || '').trim();
    const autoRead = document.getElementById('input-auto-read');

    localStorage.setItem('zizi_voice_provider', provider);
    if (azureKey) localStorage.setItem('azure_speech_key', azureKey);
    else localStorage.removeItem('azure_speech_key');
    localStorage.setItem('azure_speech_region', azureRegion || 'eastasia');
    localStorage.setItem('azure_voice_name', azureVoice || 'zh-HK-HiuMaanNeural');
    localStorage.setItem('google_yue_voice', googleYue || 'yue-HK-Chirp3-HD-Kore');
    localStorage.setItem('zizi_voice_v', 'chirp3-2');
    localStorage.setItem('zizi_auto_read', autoRead && autoRead.checked ? '1' : '0');

    if (tts) localStorage.setItem('google_tts_key', tts);
    else localStorage.removeItem('google_tts_key');
    if (or) localStorage.setItem('openrouter_api_key', or);
    else localStorage.removeItem('openrouter_api_key');

    setDisplay('settings-modal', 'none');

    if (window.unlockAudio) window.unlockAudio();
    if (window.playCantoneseTTS) {
        window.playCantoneseTTS('設定儲存成功！而家用呢把聲同你講嘢。', { interrupt: true });
    }
};

window.closeSettings = function () {
    setDisplay('settings-modal', 'none');
    if (window.announce) window.announce('已關閉設定。', { force: true });
};

window.testVoice = function () {
    if (window.unlockAudio) window.unlockAudio();
    // Temporarily apply form values without saving? Use current saved + form preview
    const providerEl = document.getElementById('input-voice-provider');
    if (providerEl) localStorage.setItem('zizi_voice_provider', providerEl.value);
    const azureKey = document.getElementById('input-azure-speech');
    if (azureKey && azureKey.value.trim()) localStorage.setItem('azure_speech_key', azureKey.value.trim());
    const azureVoice = document.getElementById('input-azure-voice');
    if (azureVoice) localStorage.setItem('azure_voice_name', azureVoice.value);
    const googleYue = document.getElementById('input-google-yue-voice');
    if (googleYue) localStorage.setItem('google_yue_voice', googleYue.value);
    const tts = document.getElementById('input-google-tts');
    if (tts && tts.value.trim()) localStorage.setItem('google_tts_key', tts.value.trim());

    if (window.playCantoneseTTS) {
        window.playCantoneseTTS('你好呀孜孜！呢把係而家嘅廣東話聲線，聽唔聽得清楚？', { interrupt: true });
    }
    if (window.speakEnglish) {
        window.speakEnglish('Hello Zizi! This is the English voice.');
    }
};

window.enterMode = function (mode) {
    if (window.unlockAudio) window.unlockAudio();
    if (window.stopSpeech) window.stopSpeech();
    if (window.ZiziFX) {
        window.ZiziFX.play('tap');
        window.ZiziFX.ensureMusic();
    }

    window.currentMode = mode;
    setDisplay('home-menu', 'none');
    setDisplay('settings-modal', 'none');
    setDisplay('album-overlay', 'none');
    setDisplay('play-overlay', 'none');
    // Back control sits inside each mode header — never as a floating overlay
    setDisplay('back-to-home-btn', 'none');
    setDisplay('standard-top-bar', 'none');
    if (window.stopRaceGame) window.stopRaceGame();
    if (window.stopPuzzleGame) window.stopPuzzleGame();
    if (window.stopHuntGame) window.stopHuntGame();
    if (window.stopShootGame) window.stopShootGame();

    if (mode === 'race') {
        setDisplay('app', 'none');
        setDisplay('standard-ui', 'none');
        setDisplay('camera-overlay', 'none');
        if (window.startRaceGame) window.startRaceGame();
    } else if (mode === 'puzzle') {
        setDisplay('app', 'none');
        setDisplay('standard-ui', 'none');
        setDisplay('camera-overlay', 'none');
        if (window.startWordPuzzle) window.startWordPuzzle();
    } else if (mode === 'match') {
        setDisplay('app', 'none');
        setDisplay('standard-ui', 'none');
        setDisplay('camera-overlay', 'none');
        if (window.startPictureHunt) window.startPictureHunt();
    } else if (mode === 'game') {
        setDisplay('app', 'none');
        setDisplay('standard-ui', 'none');
        setDisplay('camera-overlay', 'none');
        if (window.startShootGame) window.startShootGame();
    } else if (mode === 'standard') {
        setDisplay('camera-overlay', 'none');
        setDisplay('standard-top-bar', 'flex');
        setDisplay('back-to-home-btn', 'inline-block');
        setDisplay('app', 'flex');
        setDisplay('standard-ui', 'block');
        const reCam = document.getElementById('btn-re-cam');
        if (reCam) reCam.style.display = 'none';

        if (typeof startApp === 'function') startApp('standard');
        if (window.announce) {
            window.announce('手指描字。跟住綠點畫字母，唔識可以撳提示。', { force: true, interrupt: true });
        }
    } else if (mode === 'camera') {
        setDisplay('app', 'none');
        setDisplay('standard-ui', 'none');
        if (window.openCamera) window.openCamera();
    } else if (mode === 'album') {
        setDisplay('home-menu', 'block');
        window.currentMode = 'none';
        if (window.openWordAlbum) window.openWordAlbum();
        if (window.announce) {
            window.announce('呢度係你嘅單詞冊。撳吓卡片可以再聽英文讀音。', { force: true });
        }
    }
};

window.backToHome = function () {
    if (window.stopAllAudio) window.stopAllAudio();
    if (window.stopSpeech) window.stopSpeech();

    if (window.gameNextTimeout) clearTimeout(window.gameNextTimeout);
    if (window.gameReplayTimeout) clearTimeout(window.gameReplayTimeout);
    if (window.stopRaceGame) window.stopRaceGame();
    if (window.stopPuzzleGame) window.stopPuzzleGame();
    if (window.stopHuntGame) window.stopHuntGame();
    if (window.stopShootGame) window.stopShootGame();

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
    if (window.ZiziTeach) {
        window.ZiziTeach.reset();
        window.ZiziTeach.resetWrite();
        window.ZiziTeach.hideCoach(document.getElementById('match-coach'));
        window.ZiziTeach.hideCoach(document.getElementById('game-coach'));
        window.ZiziTeach.hideCoach(document.getElementById('write-coach'));
        window.ZiziTeach.clearGlow(document);
    }

    hideAllOverlays();
    window.currentMode = 'none';
    document.body.classList.remove('tracing-mode');
    setDisplay('home-menu', 'block');
    if (window.refreshHomeProgress) window.refreshHomeProgress();
    if (window.announce) {
        window.announce('返到主選單喇。想聽選單可以撳黃色喇叭掣。', { force: true });
    }
};

window.addEventListener('pageshow', function () {
    if (window.currentMode === 'none') {
        setDisplay('camera-overlay', 'none');
        setDisplay('game-overlay', 'none');
        setDisplay('match-overlay', 'none');
        setDisplay('album-overlay', 'none');
        setDisplay('play-overlay', 'none');
        setDisplay('race-overlay', 'none');
        setDisplay('puzzle-overlay', 'none');
        setDisplay('hunt-overlay', 'none');
        setDisplay('shoot-overlay', 'none');
        setDisplay('settings-modal', 'none');
        setDisplay('home-menu', 'block');
        setDisplay('back-to-home-btn', 'none');
        if (window.refreshHomeProgress) window.refreshHomeProgress();
    }
});
