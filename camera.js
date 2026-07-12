// ==========================================
// 📸 探索魔鏡 (相機與 AI 認字模組 - 回歸原始成功版)
// ==========================================

window.cameraStream = null;
window.lastCapturedImg = null;
window.isAnalyzing = false; 

// 畫圈用變數
window.cropPoints = [];
window.isCropping = false;
window.snapImg = null;

window.openCamera = async function() {
    if (window.stopAllAudio) window.stopAllAudio();
    window.isAnalyzing = false;

    // 開相機介面，隱藏畫布
    const overlay = document.getElementById('camera-overlay');
    if (overlay) overlay.style.display = 'flex';
    
    document.getElementById('app').style.display = 'none';
    document.getElementById('loading-msg').style.display = 'none';
    
    const video = document.getElementById('camera-video');
    if (video) video.style.display = 'block';
    
    const cropCanvas = document.getElementById('crop-canvas');
    if (cropCanvas) cropCanvas.style.display = 'none';
    
    const captureBtn = document.getElementById('capture-btn');
    if (captureBtn) captureBtn.style.display = 'inline-block';
    
    const confirmCropBtn = document.getElementById('confirm-crop-btn');
    if (confirmCropBtn) confirmCropBtn.style.display = 'none';

    try {
        window.cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false
        });
        if (video) video.srcObject = window.cameraStream;
        
        if (window.playCantoneseTTS) {
            window.playCantoneseTTS("魔鏡開咗喇！搵下有咩得意嘢，影低佢啦！");
        }
    } catch (err) {
        console.error("相機權限錯誤:", err);
        alert("開唔到相機呀，請檢查瀏覽器權限！");
        window.closeCamera();
    }
};

window.takePhoto = function() {
    const video = document.getElementById('camera-video');
    const cropCanvas = document.getElementById('crop-canvas');
    if (!video || !cropCanvas || !window.cameraStream) return;

    if (window.playCantoneseTTS) window.playCantoneseTTS("影咗喇！用手指圈出你想認嘅嘢啦！");

    // 將影片畫面截取到內部 Canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
    
    // 設定畫圈 Canvas 尺寸
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
        document.getElementById('capture-btn').style.display = 'none';
        document.getElementById('confirm-crop-btn').style.display = 'inline-block';
        
        setupDrawingEvents(cropCanvas);
    };
    window.snapImg.src = tempCanvas.toDataURL('image/jpeg', 0.9);
};

// 原始畫圈事件綁定
function setupDrawingEvents(canvas) {
    const ctx = canvas.getContext('2d');

    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: (clientX - rect.left) * (canvas.width / rect.width),
            y: (clientY - rect.top) * (canvas.height / rect.height)
        };
    };

    const startCrop = (e) => {
        e.preventDefault();
        window.isCropping = true;
        const pos = getPos(e);
        window.cropPoints = [pos];
        
        // 重畫底圖
        ctx.drawImage(window.snapImg, 0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    };

    const moveCrop = (e) => {
        e.preventDefault();
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
        e.preventDefault();
        if (!window.isCropping) return;
        window.isCropping = false;
    };

    // 確保事件唔會重複綁定
    canvas.onmousedown = startCrop;
    canvas.onmousemove = moveCrop;
    canvas.onmouseup = endCrop;
    canvas.onmouseleave = endCrop;
    canvas.ontouchstart = startCrop;
    canvas.ontouchmove = moveCrop;
    canvas.ontouchend = endCrop;
}

window.confirmCrop = function() {
    if (window.cropPoints.length < 2) {
        if (window.playCantoneseTTS) window.playCantoneseTTS("你仲未圈出要認嘅嘢喎！");
        return;
    }
    
    const cropCanvas = document.getElementById('crop-canvas');
    let xs = window.cropPoints.map(p => p.x);
    let ys = window.cropPoints.map(p => p.y);
    let minX = Math.min(...xs), maxX = Math.max(...xs);
    let minY = Math.min(...ys), maxY = Math.max(...ys);

    // 切割圖片
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = maxX - minX;
    finalCanvas.height = maxY - minY;
    const finalCtx = finalCanvas.getContext('2d');
    
    // 從大圖等比例抽返出嚟
    const scaleX = window.snapImg.width / cropCanvas.width;
    const scaleY = window.snapImg.height / cropCanvas.height;
    
    finalCtx.drawImage(window.snapImg, 
                       minX * scaleX, minY * scaleY, finalCanvas.width * scaleX, finalCanvas.height * scaleY, 
                       0, 0, finalCanvas.width, finalCanvas.height);
                       
    window.lastCapturedImg = finalCanvas.toDataURL('image/jpeg', 0.8);
    
    document.getElementById('loading-msg').style.display = 'block';
    if (window.playCantoneseTTS) window.playCantoneseTTS("收到！等我睇下呢個係咩先。");
    
    window.identifyWithAI(window.lastCapturedImg);
};

window.closeCamera = function() {
    if (window.cameraStream) {
        window.cameraStream.getTracks().forEach(track => track.stop());
        window.cameraStream = null;
    }
    const overlay = document.getElementById('camera-overlay');
    if (overlay) overlay.style.display = 'none';
};

window.identifyWithAI = async function(base64Img) {
    window.isAnalyzing = true;
    
    let apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) {
        window.isAnalyzing = false;
        window.closeCamera();
        if (window.openSettings) window.openSettings();
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
            window.isAnalyzing = false;
            window.closeCamera();
            
            // 🌟 無縫切換返去基礎寫字模式
            document.getElementById('app').style.display = 'block';
            document.getElementById('btn-re-cam').style.display = 'inline-block';
            document.getElementById('standard-top-bar').style.display = 'flex';
            
            if (window.processWord) {
                window.processWord(word, window.lastCapturedImg);
            }
        } else {
            throw new Error("AI 無法識別");
        }

    } catch (error) {
        console.error("AI 辨識失敗:", error);
        window.isAnalyzing = false;
        
        if (window.playCantoneseTTS) window.playCantoneseTTS("哎呀，我睇唔清楚，不如重影多次啦！");
        
        // 恢復影相狀態
        document.getElementById('loading-msg').style.display = 'none';
        document.getElementById('camera-video').style.display = 'block';
        document.getElementById('crop-canvas').style.display = 'none';
        document.getElementById('capture-btn').style.display = 'inline-block';
        document.getElementById('confirm-crop-btn').style.display = 'none';
    }
};
