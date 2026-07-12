// ==========================================
// 📸 探索魔鏡 (相機與 AI 認字模組 - 自由畫圈切割版)
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

    // 顯示相機，隱藏其餘 UI
    const overlay = document.getElementById('camera-overlay');
    if(overlay) overlay.style.display = 'flex';
    document.getElementById('app').style.display = 'none';
    document.getElementById('loading-msg').style.display = 'none';
    document.getElementById('btn-re-cam').style.display = 'none';

    // 確保回到相機鏡頭預覽狀態
    const video = document.getElementById('camera-video');
    if(video) video.style.display = 'block';
    document.getElementById('camera-controls').style.display = 'flex';
    
    const container = document.getElementById('preview-container');
    if(container) container.style.display = 'none';

    // 初始化或重置自由畫圈 UI 图层
    initCropUI();

    try {
        window.cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false
        });
        if(video) video.srcObject = window.cameraStream;
        
        if(window.playCantoneseTTS) {
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
    let container = document.getElementById('preview-container');
    
    if (!container && video) {
        container = document.createElement('div');
        container.id = 'preview-container';
        container.style.cssText = 'position:relative; margin:0 auto; display:none; border-radius:10px; overflow:hidden;';
        
        let img = document.createElement('img');
        img.id = 'photo-preview';
        img.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover;';
        
        let drawCanvas = document.createElement('canvas');
        drawCanvas.id = 'draw-layer';
        drawCanvas.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; z-index:200; touch-action:none; user-select:none; -webkit-user-select:none;';
        
        // 新增重影按鈕
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
        return {
            x: (e.clientX - r.left) * scaleX,
            y: (e.clientY - r.top) * scaleY
        };
    };

    canvas.addEventListener('pointerdown', e => {
        // 開始劃圈時隱藏重影按鈕以免遮擋
        let rb = document.getElementById('retake-btn-div');
        if(rb) rb.style.display = 'none';

        window.isCropping = true;
        const pos = getPos(e);
        window.cropPoints = [pos];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    });

    canvas.addEventListener('pointermove', e => {
        if (!window.isCropping) return;
        const pos = getPos(e);
        window.cropPoints.push(pos);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = '#ffca3a'; // 黃色自由劃圈線
        ctx.lineWidth = 15; 
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    });

    canvas.addEventListener('pointerup', async e => {
        if (!window.isCropping) return;
        window.isCropping = false;
        
        let xs = window.cropPoints.map(p => p.x);
        let ys = window.cropPoints.map(p => p.y);
        let minX = Math.min(...xs), maxX = Math.max(...xs);
        let minY = Math.min(...ys), maxY = Math.max(...ys);

        // 如果劃得太細，當作無效重劃
        if (maxX - minX < 20 || maxY - minY < 20) {
            if(window.playCantoneseTTS) window.playCantoneseTTS("圈大少少啦，再畫過！");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let rb = document.getElementById('retake-btn-div');
            if(rb) rb.style.display = 'block';
            return;
        }

        canvas.style.pointerEvents = 'none'; 
        
        // 將劃圈坐標投射回大圖 Canvas 進行精準切割
        const scaleX = window.fullImgCanvas.width / canvas.width;
        const scaleY = window.fullImgCanvas.height / canvas.height;
        
        let srcX = minX * scaleX;
        let srcY = minY * scaleY;
        let srcW = (maxX - minX) * scaleX;
        let srcH = (maxY - minY) * scaleY;

        // 稍微外擴 15% 邊界以免切得太死
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
        
        if(window.playCantoneseTTS) window.playCantoneseTTS("收到！等我睇下呢個係咩先。");
        
        await window.identifyWithAI(window.lastCapturedImg);
    });
}

window.takePhoto = function() {
    const video = document.getElementById('camera-video');
    if (!video || !window.cameraStream) return;

    // 計算符合屏幕比例嘅大小
    let vW = video.videoWidth, vH = video.videoHeight;
    let maxH = window.innerHeight * 0.55, maxW = window.innerWidth * 0.95;
    let ratio = Math.min(maxW / vW, maxH / vH);
    let finalW = vW * ratio, finalH = vH * ratio;

    let container = document.getElementById('preview-container');
    if(container) {
        container.style.width = finalW + 'px';
        container.style.height = finalH + 'px';
        container.style.display = 'block';
    }
    
    // 儲存全高解像度原始大圖
    window.fullImgCanvas = document.createElement('canvas');
    window.fullImgCanvas.width = vW; window.fullImgCanvas.height = vH;
    window.fullImgCanvas.getContext('2d').drawImage(video, 0, 0, vW, vH);
    
    document.getElementById('photo-preview').src = window.fullImgCanvas.toDataURL('image/jpeg', 0.9);
    
    let drawCanvas = document.getElementById('draw-layer');
    if(drawCanvas) {
        drawCanvas.width = finalW; drawCanvas.height = finalH;
        drawCanvas.style.pointerEvents = 'auto'; 
        let ctx = drawCanvas.getContext('2d');
        ctx.clearRect(0, 0, finalW, finalH);
    }
    
    let rb = document.getElementById('retake-btn-div');
    if(rb) rb.style.display = 'block';

    video.style.display = 'none';
    document.getElementById('camera-controls').style.display = 'none';
    
    if(window.playCantoneseTTS) window.playCantoneseTTS("影好喇！孜孜，用手指圈出你想知嘅嘢啦！");
};

window.retakePhoto = function() {
    let container = document.getElementById('preview-container');
    if(container) container.style.display = 'none';
    
    let video = document.getElementById('camera-video');
    if(video) video.style.display = 'block';
    
    document.getElementById('camera-controls').style.display = 'flex';
    document.getElementById('loading-msg').style.display = 'none';
    if(window.playCantoneseTTS) window.playCantoneseTTS("再影過啦！");
};

window.closeCamera = function() {
    if (window.cameraStream) {
        window.cameraStream.getTracks().forEach(track => track.stop());
        window.cameraStream = null;
    }
    const overlay = document.getElementById('camera-overlay');
    if(overlay) overlay.style.display = 'none';
    
    const container = document.getElementById('preview-container');
    if(container) container.style.display = 'none';
};

window.identifyWithAI = async function(base64Img)
