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
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
    
    let maxW = window.innerWidth * 0.95;
    let maxH = window.innerHeight * 0.6;
    let ratio = Math.min(maxW / video.videoWidth, maxH / video.videoHeight);
    cropCanvas.width = video.videoWidth * ratio;
    cropCanvas.height = video.videoHeight * ratio;

    window.snapImg = new Image();
    window.snapImg.onload = () => {
        const ctx = cropCanvas.getContext('2d');
        ctx.drawImage(window.snapImg, 0, 0, cropCanvas.width, cropCanvas.height);
        
        video.style.display = 'none';
        cropCanvas.style.display = 'block';
        safeDisplay('capture-btn', 'none');
        safeDisplay('confirm-crop-btn', 'inline-block');
        
        setupDrawingEvents(cropCanvas);
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

    canvas.onmousedown = startCrop;
    canvas.onmousemove = moveCrop;
    canvas.onmouseup = endCrop;
    canvas.onmouseleave = endCrop;
    
    // 解決部分手機 passive 報錯問題
    canvas.addEventListener('touchstart', startCrop, {passive: false});
    canvas.addEventListener('touchmove', moveCrop, {passive: false});
    canvas.addEventListener('touchend', endCrop, {passive: false});
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
    
    window.identifyWithAI(window.lastCapturedImg);
};

window.closeCamera = function() {
    if (window.cameraStream) {
        window.cameraStream.getTracks().forEach(track => track.stop());
        window.cameraStream = null;
    }
    safeDisplay('camera-overlay', 'none');
};

window.identifyWithAI = async function(base64Img) {
    let apiKey = localStorage.getItem('openrouter_api_key');
    
    if (!apiKey) {
        window.closeCamera();
        if (window.openSettings) window.openSettings();
        else alert("請設定 OpenRouter API Key");
        return;
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "qwen/qwen-2-vl-7b-instruct:free",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "What is the main object in this image? Reply with ONLY ONE English word. Do not include any punctuation or extra text." },
                            { type: "image_url", image_url: { url: base64Img } }
                        ]
                    }
                ]
            })
        });

        const data = await response.json();
        
        if (data.error) throw new Error(data.error.message || "API 發生錯誤");

        let word = data.choices[0].message.content.trim().toLowerCase();
        word = word.replace(/[^a-z]/g, '');

        if (word.length > 0) {
            window.closeCamera();
            
            // 手動恢復寫字畫布
            safeDisplay('app', 'block');
            safeDisplay('standard-top-bar', 'flex');
            safeDisplay('btn-re-cam', 'inline-block');
            
            if (typeof window.processWord === 'function') {
                window.processWord(word, window.lastCapturedImg);
            } else {
                alert("錯誤：搵唔到 processWord，寫字畫布未能載入！請檢查 canvas.js 是否有載入。");
            }
        } else {
            throw new Error("AI 認唔到字");
        }

    } catch (error) {
        console.error("AI 辨識失敗:", error);
        alert("AI 錯誤: " + error.message);
        
        safeDisplay('loading-msg', 'none');
        safeDisplay('camera-video', 'block');
        safeDisplay('crop-canvas', 'none');
        safeDisplay('capture-btn', 'inline-block');
        safeDisplay('confirm-crop-btn', 'none');
    }
};
