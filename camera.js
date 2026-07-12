// ==========================================
// 📸 探索魔鏡 (相機與 AI 認字模組 - 自由畫圈修復版)
// ==========================================

window.cameraStream = null;
window.lastCapturedImg = null;
window.fullImgCanvas = null; 
window.isAnalyzing = false; 

window.cropPoints = [];
window.isCropping = false;

window.openCamera = async function() {
    if (window.stopAllAudio) window.stopAllAudio();
    window.isAnalyzing = false;

    const overlay = document.getElementById('camera-overlay');
    if (overlay) overlay.style.display = 'flex';
    
    const appDiv = document.getElementById('app');
    if (appDiv) appDiv.style.display = 'none';
    
    const loadingMsg = document.getElementById('loading-msg');
    if (loadingMsg) loadingMsg.style.display = 'none';
    
    const btnReCam = document.getElementById('btn-re-cam');
    if (btnReCam) btnReCam.style.display = 'none';

    const video = document.getElementById('camera-video');
    if (video) video.style.display = 'block';
    
    const controls = document.getElementById('camera-controls');
    if (controls) controls.style.display = 'flex';
    
    const container = document.getElementById('preview-container');
    if (container) container.style.display = 'none';

    // 初始化畫圈圖層
    initCropUI();

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
        if (typeof window.backToHome === 'function') window.backToHome();
    }
};

function initCropUI() {
    let video = document.getElementById('camera-video');
    if (!video) return;
    
    let container = document.getElementById('preview-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'preview-container';
        container.style.cssText = 'position:relative; margin:0 auto; display:none; border-radius:10px; overflow:hidden;';
        
        let img = document.createElement('img');
        img.id = 'photo-preview';
        img.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover;';
        
        let drawCanvas = document.createElement('canvas');
        drawCanvas.id = 'draw-layer';
        drawCanvas.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; z-index:200; touch-action:none; user-select:none; -webkit-user-select:none;';
        
        let retakeBtnDiv = document.createElement('div');
        retakeBtnDiv.id = 'retake-btn-div';
        retakeBtnDiv.style.cssText = 'position:absolute; bottom:15px; width:100%; text-align:center; z-index:300;';
        retakeBtnDiv.innerHTML = `<button class="btn" style="background-color:#118ab2; color:white; font-size:18px; padding:10px 20px; border:none; border-radius:10px;" onclick="window.retakePhoto()">🔄 重影一幅</button>`;
        
        container.appendChild(img);
        container.appendChild(drawCanvas);
        container.appendChild(retakeBtnDiv);
        video.parentNode.insertBefore(container, video.nextSibling);
        
        setupDrawingEvents(drawCanvas);
    }
}

function setupDrawingEvents(canvas) {
    const ctx = canvas.getContext('2d');

    const getPos = (e) => {
        const r = canvas.getBoundingClientRect();
        const scaleX = canvas.width / r.width;
        const scaleY = canvas.height / r.height;
        // 🌟 修正：相容滑鼠點擊同手機 Touch 事件
        const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
        return {
            x: (clientX - r.left) * scaleX,
            y: (clientY - r.top) * scaleY
        };
    };

    const startCrop = (e) => {
        let rb = document.getElementById('retake-btn-div');
        if (rb) rb.style.display = 'none';

        window.isCropping = true;
        const pos = getPos(e);
        window.cropPoints = [pos];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    };

    const moveCrop = (e) => {
        if (!window.isCropping) return;
        const pos = getPos(e);
        window.cropPoints.push(pos);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = '#ffca3a'; 
        ctx.lineWidth = 15; 
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    };

    const endCrop = async (e) => {
        if (!window.isCropping) return;
        window.isCropping = false;
        
        let xs = window.cropPoints.map(p => p.x);
        let ys = window.cropPoints.map(p => p.y);
        let minX = Math.min(...xs), maxX = Math.max(...xs);
        let minY = Math.min(...ys), maxY = Math.max(...ys);

        if (maxX - minX < 20 || maxY - minY < 20) {
            if (window.playCantoneseTTS) window.playCantoneseTTS("圈大少少啦，再畫過！");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let rb = document.getElementById('retake-btn-div');
            if (rb) rb.style.display = 'block';
            return;
        }

        canvas.style.pointerEvents = 'none'; 
        
        const scaleX = window.fullImgCanvas.width / canvas.width;
        const scaleY = window.fullImgCanvas.height / canvas.height;
        
        let srcX = minX * scaleX;
        let srcY = minY * scaleY;
        let srcW = (maxX - minX) * scaleX;
        let srcH = (maxY - minY) * scaleY;

        let padX = srcW * 0.15, padY = srcH * 0.15;
        srcX = Math.max(0, srcX - padX);
        srcY = Math.max(0, srcY - padY);
        srcW = Math.min(window.fullImgCanvas.width - srcX, srcW + padX * 2);
        srcH = Math.min(window.fullImgCanvas.height - srcY, srcH + padY * 2);

        const cropCvs = document.createElement('canvas');
        cropCvs.width = srcW; cropCvs.height = srcH;
        cropCvs.getContext('2d').drawImage(window.fullImgCanvas, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);
        
        window.lastCapturedImg = cropCvs.toDataURL('image/jpeg', 0.8);
        
        document.getElementById('preview-container').style.display = 'none';
        document.getElementById('loading-msg').style.display = 'block';
        
        if (window.playCantoneseTTS) window.playCantoneseTTS("收到！等我睇下呢個係咩先。");
        
        await window.identifyWithAI(window.lastCapturedImg);
    };

    canvas.addEventListener('mousedown', startCrop);
    canvas.addEventListener('mousemove', moveCrop);
    canvas.addEventListener('mouseup', endCrop);
    canvas.addEventListener('touchstart', startCrop, {passive: true});
    canvas.addEventListener('touchmove', moveCrop, {passive: true});
    canvas.addEventListener('touchend', endCrop);
}

window.takePhoto = function() {
    const video = document.getElementById('camera-video');
    if (!video || !window.cameraStream) return;

    let vW = video.videoWidth, vH = video.videoHeight;
    let maxH = window.innerHeight * 0.55, maxW = window.innerWidth * 0.95;
    let ratio = Math.min(maxW / vW, maxH / vH);
    let finalW = vW * ratio, finalH = vH * ratio;

    let container = document.getElementById('preview-container');
    if (container) {
        container.style.width = finalW + 'px';
        container.style.height = finalH + 'px';
        container.style.display = 'block';
    }
    
    window.fullImgCanvas = document.createElement('canvas');
    window.fullImgCanvas.width = vW; window.fullImgCanvas.height = vH;
    window.fullImgCanvas.getContext('2d').drawImage(video, 0, 0, vW, vH);
    
    const photoPreview = document.getElementById('photo-preview');
    if (photoPreview) photoPreview.src = window.fullImgCanvas.toDataURL('image/jpeg', 0.9);
    
    let drawCanvas = document.getElementById('draw-layer');
    if (drawCanvas) {
        drawCanvas.width = finalW; drawCanvas.height = finalH;
        drawCanvas.style.pointerEvents = 'auto'; 
        let ctx = drawCanvas.getContext('2d');
        ctx.clearRect(0, 0, finalW, finalH);
    }
    
    let rb = document.getElementById('retake-btn-div');
    if (rb) rb.style.display = 'block';

    video.style.display = 'none';
    const controls = document.getElementById('camera-controls');
    if (controls) controls.style.display = 'none';
    
    if (window.playCantoneseTTS) window.playCantoneseTTS("影好喇！孜孜，用手指圈出你想知嘅嘢啦！");
};

window.retakePhoto = function() {
    let container = document.getElementById('preview-container');
    if (container) container.style.display = 'none';
    
    let video = document.getElementById('camera-video');
    if (video) video.style.display = 'block';
    
    const controls = document.getElementById('camera-controls');
    if (controls) controls.style.display = 'flex';
    
    const loadingMsg = document.getElementById('loading-msg');
    if (loadingMsg) loadingMsg.style.display = 'none';
    
    if (window.playCantoneseTTS) window.playCantoneseTTS("再影過啦！");
};

window.closeCamera = function() {
    if (window.cameraStream) {
        window.cameraStream.getTracks().forEach(track => track.stop());
        window.cameraStream = null;
    }
    const overlay = document.getElementById('camera-overlay');
    if (overlay) overlay.style.display = 'none';
    
    const container = document.getElementById('preview-container');
    if (container) container.style.display = 'none';
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
            
            document.getElementById('app').style.display = 'block';
            document.getElementById('btn-re-cam').style.display = 'inline-block';
            document.getElementById('standard-top-bar').style.display = 'flex';
            
            if (window.processWord) window.processWord(word, window.lastCapturedImg);
        } else {
            throw new Error("AI 無法識別");
        }

    } catch (error) {
        console.error("AI 辨識失敗:", error);
        window.isAnalyzing = false;
        
        if (window.playCantoneseTTS) window.playCantoneseTTS("哎呀，我睇唔清楚，不如重影多次啦！");
        window.retakePhoto();
    }
};
