// ==========================================
// 🚀 模式路由與主選單邏輯 (Routing & Menu)
// ==========================================

window.currentMode = 'none';

window.enterMode = function(mode) {
    window.currentMode = mode;
    
    // 1. 隱藏主選單
    document.getElementById('home-menu').style.display = 'none';
    
    // 2. 顯示返回主頁按鈕
    document.getElementById('back-to-home-btn').style.display = 'block';
    
    // 3. 根據模式啟動對應功能
    if (mode === 'standard') {
        document.getElementById('start-overlay').style.display = 'flex';
        document.getElementById('canvas-wrapper').style.display = 'block';
        if (window.playCantoneseTTS) window.playCantoneseTTS("一齊寫字啦！");
        // 確保畫布重置
        if (window.resetCanvas) window.resetCanvas();
    } 
    else if (mode === 'camera') {
        document.getElementById('start-overlay').style.display = 'none';
        document.getElementById('canvas-wrapper').style.display = 'none';
        if (window.openCamera) window.openCamera();
    } 
    else if (mode === 'game') {
        document.getElementById('start-overlay').style.display = 'none';
        document.getElementById('canvas-wrapper').style.display = 'none';
        if (window.startGame) window.startGame();
    }
};

window.backToHome = function() {
    // 1. 停止所有聲音同進行中嘅邏輯
    if(window.stopAllAudio) window.stopAllAudio();
    if(window.gameNextTimeout) clearTimeout(window.gameNextTimeout);
    if(window.gameReplayTimeout) clearTimeout(window.gameReplayTimeout);
    
    // 2. 關閉所有子模式嘅專屬 UI
    if (window.currentMode === 'camera') {
        if (window.closeCamera) window.closeCamera();
    } else if (window.currentMode === 'game') {
        window.isGamePlaying = false;
        let gameOverlay = document.getElementById('game-overlay');
        if (gameOverlay) gameOverlay.style.display = 'none';
    } else if (window.currentMode === 'standard') {
        document.getElementById('start-overlay').style.display = 'none';
        document.getElementById('canvas-wrapper').style.display = 'none';
    }
    
    // 3. 隱藏額外彈出嘅嘢 (例如相機模式搵完字彈出嚟嘅畫布)
    let extraCanvas = document.getElementById('canvas-wrapper');
    if (extraCanvas) extraCanvas.style.display = 'none';
    
    // 4. 重置狀態
    window.currentMode = 'none';
    
    // 5. 顯示主選單，隱藏返回按鈕
    document.getElementById('home-menu').style.display = 'flex';
    document.getElementById('back-to-home-btn').style.display = 'none';
};
