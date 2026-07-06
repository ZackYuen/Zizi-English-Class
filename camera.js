// ==========================================
// 📷 探索魔鏡功能 (修正 Cancel 後無法圈選 Bug)
// ==========================================

window.lastCapturedImg = null;
window.uiAudio = new Audio();
window.mAudio = window.mAudio || new Audio(); 
window.fullImgCanvas = null; 
window.isAnalyzing = false; 
window.currentAborter = null; 

window.stopAllAudio = function() {
    if (window.uiAudio) { window.uiAudio.pause(); window.uiAudio.currentTime = 0; }
    if (window.mAudio) { window.mAudio.pause(); window.mAudio.currentTime = 0; }
    window.speechSynthesis.cancel(); 
};

window.playCantoneseTTS = async function(text) {
    window.stopAllAudio(); 
    let key = localStorage.getItem('google_tts_key');
    if (!key) {
        let u = new SpeechSynthesisUtterance(text);
        u.lang = 'zh-HK';
        window.speechSynthesis.speak(u);
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
            window.uiAudio.src = 'data:audio/mp3;base64,' + data.audioContent;
            window.uiAudio.play();
        }
    } catch(e) { console.error("TTS Error", e); }
};

window.speakAlert = function(msg) {
    window.playCantoneseTTS(msg);
};

if (!document.getElementById('thinking-style')) {
    const style = document.createElement('style');
    style.id = 'thinking-style';
    style.innerHTML = `
        @keyframes pulse-brain {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.3); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
        }
        .thinking-anim { display: inline-block; animation: pulse-brain 0.8s infinite ease-in-out; }
    `;
    document.head.appendChild(style);
}

function initCropUI() {
    let video = document.getElementById('camera-video');
    let container = document.getElementById('preview-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'preview-container';
        container.style.position = 'relative';
        container.style.margin = '0 auto';
        container.style.display = 'none';
        container.style.borderRadius = '10px';
        container.style.overflow = 'hidden';
        
        let img = document.createElement('img');
        img.id = 'photo-preview';
        img.style.position = 'absolute';
        img.style.top = '0'; img.style.left = '0';
        img.style.width = '100%'; img.style.height = '100%';
        img.style.objectFit = 'cover';
        
        let drawCanvas = document.createElement('canvas');
        drawCanvas.id = 'draw-layer';
        drawCanvas.style.position = 'absolute';
        drawCanvas.style.top = '0'; drawCanvas.style.left = '0';
        drawCanvas.style.width = '100%';
        drawCanvas.style.height = '100%';
        // 🌟 確保畫布層級最高
        drawCanvas.style.zIndex = '200';
        drawCanvas.style.touchAction = 'none'; 
        drawCanvas.style.userSelect = 'none';
        drawCanvas.style.webkitUserSelect = 'none';
        
        container.appendChild(img);
        container.appendChild(drawCanvas);
        video.parentNode.insertBefore(container, video.nextSibling);
        
        setupDrawingEvents(drawCanvas);
    }

    if (!document.getElementById('cancel-analyze-btn')) {
        let btnDiv = document.createElement('div');
        btnDiv.id = 'cancel-analyze-btn';
        btnDiv.style.display = 'none';
        btnDiv.style.marginTop = '20px';
        btnDiv.style.zIndex = '300';
        btnDiv.innerHTML = `<button class="cam-btn cam-btn-close" style="font-size: 18px; padding: 12px 25px;" onpointerdown="cancelAnalysis()">❌ 太耐喇，影過張</button>`;
        document.getElementById('camera-overlay').appendChild(btnDiv);
    }
}

function setupDrawingEvents(canvas) {
    window.cropPoints = [];
    window.isCropping = false;
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
        ctx.strokeStyle = '#ffca3a'; 
        ctx.lineWidth = 20; 
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

        if (maxX - minX < 30 || maxY - minY < 30) {
            window.playCantoneseTTS("圈大少少啦，再畫過！");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        canvas.style.pointerEvents = 'none'; 
        
        const scaleX = window.fullImgCanvas.width / canvas.width;
        const scaleY = window.fullImgCanvas.height / canvas.height;
        
        let srcX = minX * scaleX;
        let srcY = minY * scaleY;
        let srcW = (maxX - minX) * scaleX;
        let srcH = (maxY - minY) * scaleY;

        let padX = srcW * 0.2, padY = srcH * 0.2;
        srcX = Math.max(0, srcX - padX);
        srcY = Math.max(0, srcY - padY);
        srcW = Math.min(window.fullImgCanvas.width - srcX, srcW + padX * 2);
        srcH = Math.min(window.fullImgCanvas.height - srcY, srcH + padY * 2);

        const cropCvs = document.createElement('canvas');
        cropCvs.width = srcW; cropCvs.height = srcH;
        cropCvs.getContext('2d').drawImage(window.fullImgCanvas, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);
        
        let croppedBase64 = cropCvs.toDataURL('image/jpeg', 0.6).split(',')[1];
        
        document.getElementById('loading-msg').style.display = 'block';
        window.playCantoneseTTS("收到！等我睇下呢個係咩先。");
        document.getElementById('loading-msg').innerHTML = `<span class="thinking-anim">📸</span> 傳送緊去大腦...`;
        
        await identifyWithAI(croppedBase64);
    });
}

window.openCamera = async function() {
    window.stopAllAudio(); 
    window.isAnalyzing = false;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("瀏覽器唔支援相機！請用 HTTPS 網址。");
        return;
    }
    try {
        if (window.stream) {
            window.stream.getTracks().forEach(track => track.stop());
            window.stream = null;
        }
        initCropUI();

        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        window.stream = stream;
        const video = document.getElementById('camera-video');
        
        video.srcObject = stream;
        video.play().catch(e => console.error("Video play error:", e));
        
        video.style.display = 'block';
        document.getElementById('preview-container').style.display = 'none';
        document.getElementById('camera-overlay').style.display = 'flex';
        document.getElementById('camera-controls').style.display = 'flex';
        document.getElementById('loading-msg').style.display = 'none';
        
        let cancelBtn = document.getElementById('cancel-analyze-btn');
        if (cancelBtn) cancelBtn.style.display = 'none';
        
        window.playCantoneseTTS("打開相機啦，影低你想學嘅嘢啦！");
    } catch (err) { alert("開唔到相機：" + err.message); }
};

window.closeCamera = function() {
    window.stopAllAudio();
    window.isAnalyzing = false;
    if (window.currentAborter) window.currentAborter.abort();
    if (window.stream) {
        window.stream.getTracks().forEach(track => track.stop());
        window.stream = null;
    }
    if (document.getElementById('camera-video')) document.getElementById('camera-video').srcObject = null;
    document.getElementById('camera-overlay').style.display = 'none';
};

window.takePhoto = async function() {
    window.stopAllAudio(); 
    const video = document.getElementById('camera-video');
    
    if (!video.videoWidth || video.videoWidth === 0) {
        window.playCantoneseTTS("鏡頭仲未準備好呀，等多一秒先啦！");
        return; 
    }

    document.getElementById('camera-controls').style.display = 'none';
    
    let vW = video.videoWidth, vH = video.videoHeight;
    let maxH = window.innerHeight * 0.55, maxW = window.innerWidth * 0.9;
    let ratio = Math.min(maxW / vW, maxH / vH);
    let finalW = vW * ratio, finalH = vH * ratio;

    let container = document.getElementById('preview-container');
    container.style.width = finalW + 'px';
    container.style.height = finalH + 'px';
    container.style.display = 'block';
    
    window.fullImgCanvas = document.createElement('canvas');
    window.fullImgCanvas.width = vW; window.fullImgCanvas.height = vH;
    window.fullImgCanvas.getContext('2d').drawImage(video, 0, 0, vW, vH);
    
    window.lastCapturedImg = window.fullImgCanvas.toDataURL('image/jpeg', 0.8);
    document.getElementById('photo-preview').src = window.lastCapturedImg;
    
    let drawCanvas = document.getElementById('draw-layer');
    drawCanvas.width = finalW; drawCanvas.height = finalH;
    
    // 🌟 徹底重置畫布狀態，解決 Cancel 後死機
    drawCanvas.style.pointerEvents = 'auto'; 
    drawCanvas.style.zIndex = '200';
    window.isCropping = false;
    window.cropPoints = [];
    drawCanvas.getContext('2d').clearRect(0, 0, finalW, finalH);
    
    video.style.display = 'none';
    
    window.playCantoneseTTS("影好喇！孜孜，用手指圈出你想知嘅嘢啦！");
    const loadingMsg = document.getElementById('loading-msg');
    loadingMsg.style.display = 'block';
    // 🌟 防止 loading-msg 遮擋畫布觸控
    loadingMsg.style.pointerEvents = 'none';
    loadingMsg.innerHTML = `👆 請喺相度圈出你想學嘅嘢`;
};

window.cancelAnalysis = function() {
    window.isAnalyzing = false;
    if (window.currentAborter) window.currentAborter.abort();
    
    window.stopAllAudio();
    window.playCantoneseTTS("無問題，我哋影過第二樣啦！");
    
    document.getElementById('loading-msg').style.display = 'none';
    document.getElementById('cancel-analyze-btn').style.display = 'none';
    document.getElementById('preview-container').style.display = 'none';
    document.getElementById('camera-controls').style.display = 'flex';
    
    const video = document.getElementById('camera-video');
    video.style.display = 'block';
    video.play().catch(e => console.error("Video play error:", e));
};

async function identifyWithAI(croppedBase64) {
    window.isAnalyzing = true;
    const models = [
        "google/gemini-1.5-flash:free",
        "qwen/qwen-2-vl-7b-instruct:free",
        "qwen/qwen2.5-vl-7b-instruct:free",
        "nvidia/nemotron-nano-12b-v2-vl:free"
    ];

    let apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) {
        apiKey = prompt("請輸入 OpenRouter API Key:");
        if(apiKey) localStorage.setItem('openrouter_api_key', apiKey);
        else { window.closeCamera(); return; }
    }

    const loadingMsg = document.getElementById('loading-msg');
    loadingMsg.style.zIndex = "100";
    loadingMsg.style.pointerEvents = 'none';
    
    let cancelTimer = setTimeout(() => {
        if (window.isAnalyzing) {
            let btn = document.getElementById('cancel-analyze-btn');
            if (btn) btn.style.display = 'block';
            window.playCantoneseTTS("諗得太耐喇，你可以撳紅色掣取消，影過第二樣。");
        }
    }, 8000); 

    for (const model of models) {
        if (!window.isAnalyzing) break;
        
        loadingMsg.innerHTML = `<span class="thinking-anim">🧠</span> 嘗試用 ${model.split('/')[1]} 分析緊...`;
        
        window.currentAborter = new AbortController();
        let timeoutId; 
        try {
            timeoutId = setTimeout(() => {
                if(window.currentAborter) window.currentAborter.abort();
            }, 10000);

            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: model,
                    messages: [{
                        role: "user",
                        content: [
                            { type: "text", text: "You are a kindergarten teacher. Look at this cropped image. What is the main object shown? Name it using the everyday English vocabulary suitable for a 5-year-old child to learn (e.g., 'leaf', 'flower', 'tree', 'shoe'). MAXIMUM 2 WORDS. Reply with the noun ONLY. No sentences, no articles. Lowercase only." },
                            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${croppedBase64}` } }
                        ]
                    }]
                }),
                signal: window.currentAborter.signal
            });

            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            if (data.choices && data.choices[0] && data.choices[0].message) {
                let rawWord = data.choices[0].message.content.trim().toLowerCase();
                let cleanWord = rawWord.replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim();
                let wordsArray = cleanWord.split(' ');
                
                const fillers = ['a', 'an', 'the', 'some', 'one', 'this', 'that', 'it', 'its', 'is', 'i', 'see', 'shows', 'picture', 'image', 'of', 'looks', 'like', 'probably', 'maybe', 'here', 'there', 'are'];
                while (wordsArray.length > 1 && fillers.includes(wordsArray[0])) {
                    wordsArray.shift();
                }
                
                let finalWord = wordsArray.length > 2 ? wordsArray.slice(-2).join(' ') : wordsArray.join(' ');

                if (finalWord.length > 0) {
                    clearTimeout(cancelTimer);
                    window.isAnalyzing = false;
                    document.getElementById('cancel-analyze-btn').style.display = 'none';
                    loadingMsg.innerText = `✨ 搵到喇！係 ${finalWord}！`;
                    setTimeout(() => { window.closeCamera(); window.processWord(finalWord, window.lastCapturedImg); }, 500);
                    return; 
                }
            }
            throw new Error("無內容回傳");

        } catch (err) {
            if (timeoutId) clearTimeout(timeoutId);
            if (!window.isAnalyzing) break; 
            console.error(`${model} 失敗: ${err.message}`);
        }
    }

    clearTimeout(cancelTimer);
    if (window.isAnalyzing) {
        window.isAnalyzing = false;
        document.getElementById('cancel-analyze-btn').style.display = 'none';
        window.playCantoneseTTS("哎呀，伺服器太忙喇，不如再影過啦。");
        loadingMsg.innerText = "❌ 伺服器忙緊，請重試。";
        setTimeout(() => {
            loadingMsg.style.display = 'none';
            document.getElementById('camera-controls').style.display = 'flex';
            document.getElementById('preview-container').style.display = 'none';
            document.getElementById('camera-video').style.display = 'block';
            document.getElementById('camera-video').play().catch(e=>console.error(e));
        }, 3000);
    }
}
