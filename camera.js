// ==========================================
// 📸 探索魔鏡 (相機與 AI 認字模組 - 畫框精準切割版)
// ==========================================

window.cameraStream = null;
window.lastCapturedImg = null;
window.isAnalyzing = false;

// 🌟 畫框切割專用變量
window.cropCanvas = null;
window.cropCtx = null;
window.snapImg = null; 
window.cropRect = null;
window.isDragging = false;
window.dragStart = {x: 0, y: 0};

window.openCamera = async function() {
    if (window.stopAllAudio) window.stopAllAudio();
    window.isAnalyzing = false;

    const overlay = document.getElementById('camera-overlay');
    if(overlay) overlay.style.display = 'flex';
    document.getElementById('app').style.display = 'none';
    document.getElementById('loading-msg').style.display = 'none';
    
    // 重置為鏡頭模式
    document.getElementById('camera-video').style.display = 'block';
    document.getElementById('capture-btn').style.display = 'inline-block';
    
    let cc = document.getElementById('crop-container');
    if(cc) cc.style.display = 'none';
    
    // 🌟 動態生成畫框 UI (如果未建立)
    if (!document.getElementById('crop-container')) {
        let ccDiv = document.createElement('div');
        ccDiv.id = 'crop-container';
        ccDiv.style.cssText = 'display:none; position:absolute; top:0; left:0; width:100%; height:100%; flex-direction:column; align-items:center; justify-content:center; background:rgba(0,0,0,0.9); z-index:50;';
        
        let header = document.createElement('div');
        header.innerText = '👆 用手指圈出要認嘅嘢';
        header.style.cssText = 'color:#fff; font-size:24px; font-weight:bold; margin-bottom:20px;';
        
        let cvs = document.createElement('canvas');
        cvs.id = 'crop-canvas';
        cvs.style.cssText = 'max-width:95%; max-height:60vh; border:2px solid #fff; border-radius:10px; touch-action:none;';
        
        let btnDiv = document.createElement('div');
        btnDiv.style.cssText = 'display:flex; gap:20px; margin-top:25px;';
        
        let btnRetake = document.createElement('button');
        btnRetake.innerHTML = '🔄 再影過';
        btnRetake.style.cssText = 'padding:15px 25px; font-size:20px; border-radius:15px; border:none; background:#ff595e; color:#fff; font-weight:bold; cursor:pointer; box-shadow:0 4px 6px rgba(0,0,0,0.3);';
        btnRetake.onclick = window.retakePhoto;
        
        let btnConfirm = document.createElement('button');
        btnConfirm.innerHTML = '✅ 確定';
        btnConfirm.style.cssText = 'padding:15px 25px; font-size:20px; border-radius:15px; border:none; background:#06d6a0; color:#fff; font-weight:bold; cursor:pointer; box-shadow:0 4px 6px rgba(0,0,0,0.3);';
        btnConfirm.onclick = window.confirmCrop;
        
        btnDiv.appendChild(btnRetake);
        btnDiv.appendChild(btnConfirm);
        ccDiv.appendChild(header);
        ccDiv.appendChild(cvs);
        ccDiv.appendChild(btnDiv);
        
        document.getElementById('camera-overlay').appendChild(ccDiv);
        
        window.cropCanvas = cvs;
        window.cropCtx = cvs.getContext('2d');
        
        // 🌟 註冊畫框拖拉事件
        const getPos = (e) => {
            const rect = cvs.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: (clientX - rect.left) * (cvs.width / rect.width),
                y: (clientY - rect.top) * (cvs.height / rect.height)
            };
        };

        const startDrag = (e) => {
            e.preventDefault();
            window.isDragging = true;
            window.dragStart = getPos(e);
            window.cropRect = { x: window.dragStart.x, y: window.dragStart.y, w: 0, h: 0 };
        };

        const onDrag = (e) => {
            if (!window.isDragging) return;
            e.preventDefault();
            let pos = getPos(e);
            window.cropRect.w = pos.x - window.dragStart.x;
            window.cropRect.h = pos.y - window.dragStart.y;
            window.drawCropUI();
        };

        const endDrag = (e) => {
            if (!window.isDragging) return;
            e.preventDefault();
            window.isDragging = false;
            // 修正反向拖拉嘅負數長闊
            if (window.cropRect.w < 0) { window.cropRect.x += window.cropRect.w; window.cropRect.w = Math.abs(window.cropRect.w); }
            if (window.cropRect.h < 0) { window.cropRect.y += window.cropRect.h; window.cropRect.h = Math.abs(window.cropRect.h); }
        };

        cvs.addEventListener('mousedown', startDrag);
        cvs.addEventListener('mousemove', onDrag);
        cvs.addEventListener('mouseup', endDrag);
        cvs.addEventListener('mouseleave', endDrag);
        cvs.addEventListener('touchstart', startDrag, {passive: false});
        cvs.addEventListener('touchmove', onDrag, {passive: false});
        cvs.addEventListener('touchend', endDrag);
    }

    try {
        window.cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false
        });
        const video = document.getElementById('camera-video');
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

window.drawCropUI = function() {
    if(!window.cropCtx || !window.snapImg) return;
    let cvs = window.cropCanvas;
    let ctx = window.cropCtx;
    
    // 畫底圖
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    ctx.drawImage(window.snapImg, 0, 0, cvs.width, cvs.height);
    
    // 畫半透明黑色遮罩
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, cvs.width, cvs.height);
    
    // 如果有畫框，就喺框入面「𠝹穿」個遮罩
    if (window.cropRect && window.cropRect.w !== 0 && window.cropRect.h !== 0) {
        ctx.clearRect(window.cropRect.x, window.cropRect.y, window.cropRect.w, window.cropRect.h);
        ctx.drawImage(window.snapImg, 
                      window.cropRect.x, window.cropRect.y, window.cropRect.w, window.cropRect.h, 
                      window.cropRect.x, window.cropRect.y, window.cropRect.w, window.cropRect.h);
                      
        // 畫綠色虛線邊框
        ctx.strokeStyle = '#06d6a0';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 8]);
        ctx.strokeRect(window.cropRect.x, window.cropRect.y, window.cropRect.w, window.cropRect.h);
        ctx.setLineDash([]);
    }
};

window.takePhoto = function() {
    if (window.isAnalyzing) return;
    
    const video = document.getElementById('camera-video');
    if (!video || !window.cameraStream) return;

    if(window.playCantoneseTTS) window.playCantoneseTTS("影咗喇！用手指圈出你想認嘅嘢啦！");

    // 截取全畫面
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    window.snapImg = new Image();
    window.snapImg.onload = () => {
        let cvs = window.cropCanvas;
        let ratio = window.snapImg.width / window.snapImg.height;
        let displayWidth = Math.min(window.innerWidth * 0.9, window.snapImg.width);
        let displayHeight = displayWidth / ratio;
        
        cvs.width = displayWidth;
        cvs.height = displayHeight;
        
        window.cropRect = null; 
        window.drawCropUI();
        
        // 隱藏鏡頭，顯示畫框 UI
        video.style.display = 'none';
        document.getElementById('capture-btn').style.display = 'none';
        document.getElementById('crop-container').style.display = 'flex';
    };
    window.snapImg.src = canvas.toDataURL('image/jpeg', 0.9);
};

window.retakePhoto = function() {
    document.getElementById('crop-container').style.display = 'none';
    document.getElementById('camera-video').style.display = 'block';
    document.getElementById('capture-btn').style.display = 'inline-block';
    if(window.playCantoneseTTS) window.playCantoneseTTS("再影過啦！");
};

window.confirmCrop = function() {
    if (!window.cropRect || window.cropRect.w === 0 || window.cropRect.h === 0) {
        if(window.playCantoneseTTS) window.playCantoneseTTS("你仲未圈出要認嘅嘢喎！");
        return;
    }
    
    // 🌟 將畫咗框嗰忽「剪」出嚟
    let finalCanvas = document.createElement('canvas');
    finalCanvas.width = window.cropRect.w;
    finalCanvas.height = window.cropRect.h;
    let finalCtx = finalCanvas.getContext('2d');
    
    finalCtx.drawImage(window.snapImg, 
                       window.cropRect.x, window.cropRect.y, window.cropRect.w, window.cropRect.h, 
                       0, 0, window.cropRect.w, window.cropRect.h);
                       
    // 將剪裁後嘅圖片轉為 Base64
    window.lastCapturedImg = finalCanvas.toDataURL('image/jpeg', 0.8);
    
    document.getElementById('crop-container').style.display = 'none';
    document.getElementById('loading-msg').style.display = 'block';
    if(window.playCantoneseTTS) window.playCantoneseTTS("收到！等我睇下係咩先！");
    
    window.identifyWithAI(window.lastCapturedImg);
};

window.closeCamera = function() {
    if (window.cameraStream) {
        window.cameraStream.getTracks().forEach(track => track.stop());
        window.cameraStream = null;
    }
    const overlay = document.getElementById('camera-overlay');
    if(overlay) overlay.style.display = 'none';
    let cc = document.getElementById('crop-container');
    if(cc) cc.style.display = 'none';
};

window.identifyWithAI = async function(base64Img) {
    window.isAnalyzing = true;
    
    let apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) {
        window.isAnalyzing = false;
        window.closeCamera();
        if(window.openSettings) { window.openSettings(); } 
        else { alert("請先設定 OpenRouter API Key"); }
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
        word = word.replace(/[^a-z]/g, ''); // 過濾符號，確保淨係得英文字

        if (word.length > 0) {
            window.isAnalyzing = false;
            window.closeCamera();
            
            // 恢復畫布 UI
            document.getElementById('app').style.display = 'block';
            document.getElementById('btn-re-cam').style.display = 'inline-block';
            document.getElementById('standard-top-bar').style.display = 'flex';
            
            if(window.processWord) window.processWord(word, window.lastCapturedImg);
        } else {
            throw new Error("AI 無法識別");
        }

    } catch (error) {
        console.error("AI 辨識失敗:", error);
        document.getElementById('loading-msg').style.display = 'none';
        window.isAnalyzing = false;
        
        if(window.playCantoneseTTS) window.playCantoneseTTS("哎呀，我睇唔清楚，不如你影多次啦！");
        
        // 自動重置返去影相畫面
        document.getElementById('camera-video').style.display = 'block';
        document.getElementById('capture-btn').style.display = 'inline-block';
        
        if (error.message.includes("401") || error.message.includes("key")) {
            localStorage.removeItem('openrouter_api_key');
            alert("API Key 可能無效，請重新輸入！");
            window.closeCamera();
            if(window.openSettings) window.openSettings();
        }
    }
};
