// ==========================================
// 📸 探索魔鏡 (相機與 AI 認字模組 - 防白屏/防失聯版)
// ==========================================

window.cameraStream = null;
window.lastCapturedImg = null;
window.isAnalyzing = false; 
window.cropPoints = [];
window.isCropping = false;
window.snapImg = null;

// 安全獲取 DOM，防止因 HTML 缺失而卡死
function safeDisplay(id, displayStyle) {
    const el = document.getElementById(id);
    if (el) el.style.display = displayStyle;
}
function getEl(id) { return document.getElementById(id); }

window.openCamera = async function() {
    if (window.stopAllAudio) window.stopAllAudio();
    window.isAnalyzing = false;

    safeDisplay('start-overlay', 'none');
    safeDisplay('app', 'none');
    safeDisplay('camera-overlay', 'flex');
    safeDisplay('camera-video', 'block');
    safeDisplay('crop-canvas', 'none');
    safeDisplay('capture-btn', 'inline-block');
    safeDisplay('confirm-crop-btn', 'none');
    safeDisplay('loading-msg', 'none');

    try {
        window.cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false
        });
        const video = document.getElementById('camera-video');
        if (video) video.srcObject = window.cameraStream;
        
        if (window.playCantoneseTTS) {
            window.playCantoneseTTS("魔鏡開咗喇！搵下有咩得意嘢，影低佢啦！");
        }
    } catch (err) {
        console.error("相機權限錯誤:", err);
        alert("開唔到相機，請檢查瀏覽器權限！");
        window.closeCamera();
    }
};

window.takePhoto = function() {
    const video = document.getElementById('camera-video');
    const cropCanvas = document.getElementById('crop-canvas');
    if (!video || !cropCanvas || !window.cameraStream) {
        alert("系統錯誤：找不到相機畫面或畫布元素 (crop-canvas)。");
        return;
    }

    if (window.playCantoneseTTS) window.playCantoneseTTS("影咗喇！用手指圈出你想認嘅嘢啦！");

    const tempCanvas = document.createElement('canvas');
    // safe fallbacks for video dimensions
    const vW = video.videoWidth || video.clientWidth || 640;
    const vH = video.videoHeight || video.clientHeight || 480;
    tempCanvas.width = vW;
    tempCanvas.height = vH;
    const tempCtx = tempCanvas.getContext('2d');
    try { tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height); } catch(e) { console.warn('drawImage failed:', e); }
    
    let maxW = window.innerWidth * 0.95;
    let maxH = window.innerHeight * 0.6;
    let ratio = 1;
    if (vW > 0 && vH > 0) ratio = Math.min(maxW / vW, maxH / vH);
    if (!isFinite(ratio) || ratio <= 0) ratio = 1;

    cropCanvas.width = Math.max(1, Math.round(vW * ratio));
    cropCanvas.height = Math.max(1, Math.round(vH * ratio));
    // Ensure canvas CSS size matches its pixel buffer to avoid layout/position shifts
    cropCanvas.style.width = cropCanvas.width + 'px';
    cropCanvas.style.height = cropCanvas.height + 'px';
    // center canvas horizontally
    cropCanvas.style.display = 'block';
    cropCanvas.style.margin = '0 auto';

    window.snapImg = new Image();
    window.snapImg.onload = () => {
        const ctx = cropCanvas.getContext('2d');
        ctx.clearRect(0,0,cropCanvas.width,cropCanvas.height);
        ctx.drawImage(window.snapImg, 0, 0, cropCanvas.width, cropCanvas.height);
        
        video.style.display = 'none';
        cropCanvas.style.display = 'block';
        safeDisplay('capture-btn', 'none');
        safeDisplay('confirm-crop-btn', 'inline-block');
        
        setupDrawingEvents(cropCanvas);
        ensureCanvasControls();
    };
    window.snapImg.src = tempCanvas.toDataURL('image/jpeg', 0.9);
};

function setupDrawingEvents(canvas) {
    const ctx = canvas.getContext('2d');

    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        // 兼容觸控與滑鼠
        let clientX = e.clientX;
        let clientY = e.clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }
        return {
            x: (clientX - rect.left) * (canvas.width / rect.width),
            y: (clientY - rect.top) * (canvas.height / rect.height)
        };
    };

    const startCrop = (e) => {
        if(e.cancelable) e.preventDefault();
        window.isCropping = true;
        const pos = getPos(e);
        window.cropPoints = [pos];
        
        ctx.drawImage(window.snapImg, 0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    };

    const moveCrop = (e) => {
        if(e.cancelable) e.preventDefault();
        if (!window.isCropping) return;
        const pos = getPos(e);
        window.cropPoints.push(pos);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = '#ffca3a'; 
        ctx.lineWidth = 5; 
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    };

    const endCrop = (e) => {
        if(e.cancelable) e.preventDefault();
        if (!window.isCropping) return;
        window.isCropping = false;
    };

    // remove previous handlers to prevent duplicates
    if (canvas._handlers) {
        canvas.removeEventListener('mousedown', canvas._handlers.start);
        canvas.removeEventListener('mousemove', canvas._handlers.move);
        canvas.removeEventListener('mouseup', canvas._handlers.end);
        canvas.removeEventListener('mouseleave', canvas._handlers.end);
        canvas.removeEventListener('touchstart', canvas._handlers.start);
        canvas.removeEventListener('touchmove', canvas._handlers.move);
        canvas.removeEventListener('touchend', canvas._handlers.end);
    }

    canvas._handlers = { start: startCrop, move: moveCrop, end: endCrop };

    canvas.addEventListener('mousedown', startCrop);
    canvas.addEventListener('mousemove', moveCrop);
    canvas.addEventListener('mouseup', endCrop);
    canvas.addEventListener('mouseleave', endCrop);
    
    // 解決部分手機 passive 報錯問題
    canvas.addEventListener('touchstart', startCrop, {passive: false});
    canvas.addEventListener('touchmove', moveCrop, {passive: false});
    canvas.addEventListener('touchend', endCrop, {passive: false});
}

// Create (or ensure) canvas controls: Retake, Clear, Magic
function ensureCanvasControls() {
    const preview = document.getElementById('preview-container') || document.getElementById('camera-controls') || document.body;
    if (!preview) return;

    let ctrl = document.getElementById('canvas-controls');
    if (ctrl) return; // already created

    ctrl = document.createElement('div');
    ctrl.id = 'canvas-controls';
    ctrl.style.display = 'flex';
    ctrl.style.justifyContent = 'center';
    ctrl.style.gap = '8px';
    ctrl.style.marginTop = '8px';

    const retake = document.createElement('button');
    retake.id = 'retake-btn';
    retake.innerText = '再影一次';
    retake.onclick = () => {
        // show video, hide canvas, reset points
        const video = document.getElementById('camera-video');
        const cropCanvas = document.getElementById('crop-canvas');
        if (video && cropCanvas) {
            cropCanvas.style.display = 'none';
            video.style.display = 'block';
            safeDisplay('capture-btn', 'inline-block');
            safeDisplay('confirm-crop-btn', 'none');
            window.cropPoints = [];
            // clear drawing
            const ctx = cropCanvas.getContext('2d');
            ctx.clearRect(0,0,cropCanvas.width,cropCanvas.height);
            if (window.playCantoneseTTS) window.playCantoneseTTS('可以再影一次喇！');
        }
    };

    const clearBtn = document.createElement('button');
    clearBtn.id = 'clear-draw-btn';
    clearBtn.innerText = '清除圈畫';
    clearBtn.onclick = () => {
        const cropCanvas = document.getElementById('crop-canvas');
        if (!cropCanvas || !window.snapImg) return;
        const ctx = cropCanvas.getContext('2d');
        ctx.clearRect(0,0,cropCanvas.width,cropCanvas.height);
        ctx.drawImage(window.snapImg, 0, 0, cropCanvas.width, cropCanvas.height);
        window.cropPoints = [];
        if (window.playCantoneseTTS) window.playCantoneseTTS('已經清除圈畫！');
    };

    const magicBtn = document.createElement('button');
    magicBtn.id = 'magic-btn';
    magicBtn.innerText = '魔法';
    magicBtn.onclick = () => {
        // trigger same as confirmCrop
        const confirmBtn = document.getElementById('confirm-crop-btn');
        if (confirmBtn) confirmBtn.click();
        else window.confirmCrop();
    };

    // Basic styles to match existing UI (developers may override in CSS)
    [retake, clearBtn, magicBtn].forEach(b => {
        b.style.padding = '8px 12px';
        b.style.fontSize = '14px';
        b.style.borderRadius = '6px';
        b.style.cursor = 'pointer';
    });

    ctrl.appendChild(retake);
    ctrl.appendChild(clearBtn);
    ctrl.appendChild(magicBtn);

    // append to preview container (or camera-controls), prefer after the canvas
    if (preview.appendChild) preview.appendChild(ctrl);
}

window.confirmCrop = function() {
    if (!window.cropPoints || window.cropPoints.length < 2) {
        if (window.playCantoneseTTS) window.playCantoneseTTS("你仲未圈出要認嘅嘢喎！");
        alert("未圈好喎！請用手指畫個圈。");
        return;
    }
    
    const cropCanvas = document.getElementById('crop-canvas');
    let xs = window.cropPoints.map(p => p.x);
    let ys = window.cropPoints.map(p => p.y);
    let minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = Math.max(10, maxX - minX);
    finalCanvas.height = Math.max(10, maxY - minY);
    const finalCtx = finalCanvas.getContext('2d');
    
    const scaleX = window.snapImg.width / cropCanvas.width;
    const scaleY = window.snapImg.height / cropCanvas.height;
    
    finalCtx.drawImage(window.snapImg, 
                       minX * scaleX, minY * scaleY, finalCanvas.width * scaleX, finalCanvas.height * scaleY, 
                       0, 0, finalCanvas.width, finalCanvas.height);
                       
    window.lastCapturedImg = finalCanvas.toDataURL('image/jpeg', 0.8);
    
    safeDisplay('loading-msg', 'block');
    if (window.playCantoneseTTS) window.playCantoneseTTS("收到！等我睇下呢個係咩先。");
    
    // disable controls while analyzing
    setTimeout(() => { setCameraControlsEnabled(false); }, 0);
    
    window.identifyWithAI(window.lastCapturedImg).finally(() => {
        setCameraControlsEnabled(true);
    });
};

// helper to disable/enable main camera buttons
function setCameraControlsEnabled(enabled) {
    const capture = document.getElementById('capture-btn');
    const confirm = document.getElementById('confirm-crop-btn');
    const retake = document.getElementById('retake-btn');
    const clearBtn = document.getElementById('clear-draw-btn');
    const magic = document.getElementById('magic-btn');
    if (capture) capture.disabled = !enabled;
    if (confirm) confirm.disabled = !enabled;
    if (retake) retake.disabled = !enabled;
    if (clearBtn) clearBtn.disabled = !enabled;
    if (magic) magic.disabled = !enabled;
}

window.closeCamera = function() {
    if (window.cameraStream) {
        window.cameraStream.getTracks().forEach(track => track.stop());
        window.cameraStream = null;
    }
    safeDisplay('camera-overlay', 'none');
};

async function identifyWithAI(croppedBase64) {
    window.isAnalyzing = true;
    
    // 🌟 核心調整：Nvidia 放第一位，確保優先調用
    const models = [
        "nvidia/nemotron-nano-12b-v2-vl:free",
        "qwen/qwen-2-vl-7b-instruct:free",
        "google/gemini-1.5-flash:free"
    ];

    let apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) {
        apiKey = prompt("請輸入 OpenRouter API Key:");
        if(apiKey) localStorage.setItem('openrouter_api_key', apiKey);
        else { window.closeCamera(); return; }
    }

    const loadingMsg = document.getElementById('loading-msg');
    if (loadingMsg) { loadingMsg.style.zIndex = "100"; loadingMsg.style.pointerEvents = 'none'; }
    
    // 超時提示
    let cancelTimer = setTimeout(() => {
        if (window.isAnalyzing) {
            let btn = document.getElementById('cancel-analyze-btn');
            if (btn) btn.style.display = 'block';
            window.playCantoneseTTS("諗得太耐喇，你可以撳紅色掣取消，影過第二樣。");
        }
    }, 10000); 

    let vocabList = window.D ? window.D.map(d => d.w).join(', ') : '';

    for (const model of models) {
        if (!window.isAnalyzing) break;
        
        if (loadingMsg) loadingMsg.innerHTML = `<span class="thinking-anim">🧠</span> 分析緊... (${model.split('/')[1]})`;
        
        window.currentAborter = new AbortController();
        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: model,
                    messages: [{
                        role: "user",
                        content: [
                            { type: "text", text: `Identify the object in this image. If it is one of these: [${vocabList}], use that word. Otherwise, provide a simple 1-word noun. Reply with ONLY the[...]`
                        ]
                    }]
                }),
                signal: window.currentAborter.signal
            });

            if (!response.ok) continue;

            const data = await response.json();
            if (data.choices && data.choices[0] && data.choices[0].message) {
                // 🌟 強力清洗回應：只保留最後一個詞，移除所有句子結構
                let rawWord = data.choices[0].message.content.trim().toLowerCase();
                // 拆解所有文字只留英文單字
                let words = rawWord.split(/[^a-z]+/).filter(w => w.length > 0);
                
                // 簡單邏輯：最後一個出現的單字通常就是目標物
                let finalWord = words[words.length - 1]; 

                if (finalWord && finalWord.length > 0) {
                    clearTimeout(cancelTimer);
                    window.isAnalyzing = false;
                    
                    // 成功認字，即刻切換
                    if (loadingMsg) loadingMsg.innerText = `✨ 搵到喇！係 ${finalWord}！`;
                    
                    setTimeout(() => { 
                        window.closeCamera(); 
                        
                        // 🌟 強制恢復寫字 UI，確保唔會卡死
                        const appEl = document.getElementById('app'); if (appEl) appEl.style.display = 'block';
                        const tb = document.getElementById('standard-top-bar'); if (tb) tb.style.display = 'flex';
                        
                        if(window.processWord) {
                            window.processWord(finalWord, window.lastCapturedImg);
                        }
                    }, 500);
                    return; 
                }
            }
        } catch (err) {
            console.error(`${model} 失敗: ${err.message}`);
        }
    }

    clearTimeout(cancelTimer);
    if (window.isAnalyzing) {
        window.isAnalyzing = false;
        if (window.playCantoneseTTS) window.playCantoneseTTS("哎呀，認唔到呀，不如影過第二樣啦。");
        if (loadingMsg) loadingMsg.innerText = "❌ 認唔到，請重試。";
        setTimeout(() => {
            if (loadingMsg) loadingMsg.style.display = 'none';
            const cc = document.getElementById('camera-controls'); if (cc) cc.style.display = 'flex';
            const pc = document.getElementById('preview-container'); if (pc) pc.style.display = 'none';
            const vid = document.getElementById('camera-video'); if (vid) vid.style.display = 'block';
        }, 2000);
    }
}
