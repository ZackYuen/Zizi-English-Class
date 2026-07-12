// ==========================================
// 🚀 模式路由與主選單邏輯 (Routing & Menu)
// ==========================================

window.currentMode = 'none';

// 🌟 1. 全局強制 Google TTS (廢除瀏覽器機械聲)
window.playCantoneseTTS = async function(text) {
    if(window.stopAllAudio) window.stopAllAudio();
    
    let key = localStorage.getItem('google_tts_key');
    if (!key) {
        // 如果無 Key，唔會再用 Web Speech API，直接彈設定畫面！
        window.openSettings();
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
            window.uiAudio.play();
        }
    } catch(e) { console.error("TTS Error", e); }
};

// 🌟 2. UI 設定介面開關邏輯
window.openSettings = function() {
    document.getElementById('input-google-tts').value = localStorage.getItem('google_tts_key') || '';
    document.getElementById('input-openrouter').value = localStorage.getItem('openrouter_api_key') || '';
    document.getElementById('settings-modal').style.display = 'flex';
};

window.saveSettings = function() {
    let tts = document.getElementById('input-google-tts').value.trim();
    let or = document.getElementById('input-openrouter').value.trim();
    
    if(tts) localStorage.setItem('google_tts_key', tts);
    else localStorage.removeItem('google_tts_key');
    
    if(or) localStorage.setItem('openrouter_api_key', or);
    else localStorage.removeItem('openrouter_api_key');

    document.getElementById('settings-modal').style.display = 'none';
    
    // 如果入咗 Google Key，即刻讀一句測試下
    if (tts) {
        window.playCantoneseTTS("設定儲存成功！");
    }
};

window.closeSettings = function() {
    document.getElementById('settings-modal').style.display = 'none';
};

// 🌟 3. 路由切換邏輯
window.enterMode = function(mode) {
    window.currentMode = mode;
    document.getElementById('home-menu').style.display = 'none';
    document.getElementById('back-to-home-btn').style.display = 'block';
    
    if (mode === 'standard') {
        document.getElementById('standard-top-bar').style.display = 'flex';
        document.getElementById('app').style.display = 'block';
        document.getElementById('standard-ui').style.display = 'block';
        document.getElementById('btn-re-cam').style.display = 'none';
        
        if (typeof startApp === 'function') startApp('standard'); 
        if (window.playCantoneseTTS) window.playCantoneseTTS("一齊寫字啦！");
    } 
    else if (mode === 'camera') {
        document.getElementById('standard-top-bar').style.display = 'none';
        document.getElementById('app').style.display = 'none';
        document.getElementById('standard-ui').style.display = 'none';
        if (window.openCamera) window.openCamera();
    } 
    else if (mode === 'game') {
        document.getElementById('standard-top-bar').style.display = 'none';
        document.getElementById('app').style.display = 'none';
        document.getElementById('standard-ui').style.display = 'none';
        if (window.startGame) window.startGame();
    }
};

window.backToHome = function() {
    if(window.stopAllAudio) window.stopAllAudio();
    if(window.gameNextTimeout) clearTimeout(window.gameNextTimeout);
    if(window.gameReplayTimeout) clearTimeout(window.gameReplayTimeout);
    
    if (window.currentMode === 'camera') {
        if (window.closeCamera) window.closeCamera();
    } else if (window.currentMode === 'game') {
        window.isGamePlaying = false;
        let gameOverlay = document.getElementById('game-overlay');
        if (gameOverlay) gameOverlay.style.display = 'none';
    }
    
    document.getElementById('app').style.display = 'none';
    document.getElementById('standard-ui').style.display = 'none';
    document.getElementById('standard-top-bar').style.display = 'none';
    if(document.getElementById('camera-overlay')) document.getElementById('camera-overlay').style.display = 'none';
    
    window.currentMode = 'none';
    document.getElementById('home-menu').style.display = 'flex';
    document.getElementById('back-to-home-btn').style.display = 'none';
};
