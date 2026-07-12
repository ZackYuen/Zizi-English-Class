// ==========================================
// 🚀 模式路由與主選單邏輯 (Routing & Menu)
// ==========================================

window.currentMode = 'none';

window.enterMode = function(mode) {
    window.currentMode = mode;
    
    // 隱藏主選單，顯示返回主頁按鈕
    document.getElementById('home-menu').style.display = 'none';
    document.getElementById('back-to-home-btn').style.display = 'block';
    
    if (mode === 'standard') {
        document.getElementById('standard-top-bar').style.display = 'flex';
        document.getElementById('app').style.display = 'block';
        document.getElementById('standard-ui').style.display = 'block';
        document.getElementById('btn-re-cam').style.display = 'none';
        
        // 觸發 state.js 入面嘅邏輯建構標準 UI
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
    // 停止所有聲音及倒數
    if(window.stopAllAudio) window.stopAllAudio();
    if(window.gameNextTimeout) clearTimeout(window.gameNextTimeout);
    if(window.gameReplayTimeout) clearTimeout(window.gameReplayTimeout);
    
    // 關閉目前模式嘅特定 UI
    if (window.currentMode === 'camera') {
        if (window.closeCamera) window.closeCamera();
    } else if (window.currentMode === 'game') {
        window.isGamePlaying = false;
        let gameOverlay = document.getElementById('game-overlay');
        if (gameOverlay) gameOverlay.style.display = 'none';
    }
    
    // 隱藏所有共用層
    document.getElementById('app').style.display = 'none';
    document.getElementById('standard-ui').style.display = 'none';
    document.getElementById('standard-top-bar').style.display = 'none';
    if(document.getElementById('camera-overlay')) document.getElementById('camera-overlay').style.display = 'none';
    
    window.currentMode = 'none';
    
    // 顯示主選單，隱藏返回按鈕
    document.getElementById('home-menu').style.display = 'flex';
    document.getElementById('back-to-home-btn').style.display = 'none';
};
