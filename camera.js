// ==========================================
// 📷 探索魔鏡功能 (終極版：加入手動圈選 + 自動裁剪 + 5歲設定)
// ==========================================

window.lastCapturedImg = null;
window.uiAudio = new Audio();
window.mAudio = window.mAudio || new Audio(); 
window.fullImgCanvas = null; // 儲存原圖用嚟 Crop

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

// 初始化圈選 UI
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
        drawCanvas.style.zIndex = '10';
        drawCanvas.style.touchAction = 'none'; 
        
        container.appendChild(img);
        container.appendChild(drawCanvas);
        video.parentNode.insertBefore(container, video.nextSibling);
        
        setupDrawingEvents(drawCanvas);
    }
}

function setupDrawingEvents(canvas) {
    window.cropPoints = [];
    window.isCropping = false;
    const ctx = canvas.getContext('2d');

    canvas.addEventListener('pointerdown', e => {
        window.isCropping = true;
        window.cropPoints = [{x: e.offsetX, y: e.offsetY}];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.moveTo(e.offsetX, e.offsetY);
    });

    canvas.addEventListener('pointermove', e => {
        if (!window.isCropping) return;
        window.cropPoints.push({x: e.offsetX, y: e.offsetY});
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.strokeStyle = '#ffca3a'; // 鮮黃色畫筆
        ctx.lineWidth = 6;
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

        // 如果圈得太細（當作唔小心掂到）
        if (maxX - minX < 30 || maxY - minY < 30) {
            window.playCantoneseTTS("圈大少少啦，再畫過！");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        canvas.style.pointerEvents = 'none'; // 鎖住畫布
        
        // 🌟 進行智能裁切 (Auto-Crop)
        const scaleX = window.fullImgCanvas.width / canvas.width;
        const scaleY = window.fullImgCanvas.height / canvas.height;
        
        let srcX = minX * scaleX;
        let srcY = minY * scaleY;
        let srcW = (maxX - minX) * scaleX;
        let srcH = (maxY - minY) * scaleY;

        // 預留 20% 邊界，等 AI 睇到少少環境脈絡
        let padX = srcW * 0.2, padY = srcH * 0.2;
        srcX = Math.max(0, srcX - padX);
        srcY = Math.max(0, srcY - padY);
        srcW = Math.min(window.fullImgCanvas.width - srcX, srcW + padX * 2);
        srcH = Math.min(window.fullImgCanvas.height - srcY, srcH + padY * 2);

        const cropCvs = document.createElement('canvas');
        cropCvs.width = srcW; cropCvs.height = srcH;
        cropCvs.getContext('2d').drawImage(window.fullImgCanvas, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);
        
        let croppedBase64 = cropCvs.toDataURL('image/jpeg', 0.6).split(',')[1];
        
        // 進入 AI 分析階段
        document.getElementById('loading-msg').style.display = 'block';
        window.playCantoneseTTS("收到！等我睇下呢個係咩先。");
        document.getElementById('loading-msg').innerHTML = `<span class="thinking-anim">📸</span> 傳送緊去大腦...`;
        
        await identifyWithAI(croppedBase64);
    });
}

window.openCamera = async function() {
    window.stopAllAudio(); 
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
        
        window.playCantoneseTTS("打開相機啦，影低你想學嘅嘢啦！");
    } catch (err) { alert("開唔到相機：" + err.message); }
};

window.closeCamera = function() {
    window.stopAllAudio();
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
    
    // 計算顯示比例 (防止變形)
    let vW = video.videoWidth, vH = video.videoHeight;
    let maxH = window.innerHeight * 0.55, maxW = window.innerWidth * 0.9;
    let ratio = Math.min(maxW / vW, maxH / vH);
    let finalW = vW * ratio, finalH = vH * ratio;

    let container = document.getElementById('preview-container');
    container.style.width = finalW + 'px';
    container.style.height = finalH + 'px';
    container.style.display = 'block';
    
    // 儲存高清原圖
    window.fullImgCanvas = document.createElement('canvas');
    window.fullImgCanvas.width = vW; window.fullImgCanvas.height = vH;
    window.fullImgCanvas.getContext('2d').drawImage(video, 0, 0, vW, vH);
    
    window.lastCapturedImg = window.fullImgCanvas.toDataURL('image/jpeg', 0.8);
    document.getElementById('photo-preview').src = window.lastCapturedImg;
    
    // 預備畫板
    let drawCanvas = document.getElementById('draw-layer');
    drawCanvas.width = finalW; drawCanvas.height = finalH;
    drawCanvas.style.pointerEvents = 'auto'; // 解鎖畫布
    drawCanvas.getContext('2d').clearRect(0, 0, finalW, finalH);
    
    video.style.display = 'none';
    
    // 🌟 指示孜孜畫圈
    window.playCantoneseTTS("影好喇！孜孜，用手指圈出你想知嘅嘢啦！");
    const loadingMsg = document.getElementById('loading-msg');
    loadingMsg.style.display = 'block';
    loadingMsg.innerHTML = `👆 請喺相度圈出你想學嘅嘢`;
};

async function identifyWithAI(croppedBase64) {
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

    for (const model of models) {
        document.getElementById('loading-msg').innerHTML = `<span class="thinking-anim">🧠</span> 嘗試用 ${model.split('/')[1]} 分析緊...`;
        let timeoutId; 
        try {
            const controller = new AbortController();
            timeoutId = setTimeout(() => controller.abort(), 15000);

            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: model,
                    messages: [{
                        role: "user",
                        content: [
                            // 因為已經 Crop 咗，直接問呢個係咩就得
                            { type: "text", text: "You are a kindergarten teacher. Look at this cropped image. What is the main object shown? Name it using the everyday English vocabulary suitable for a 5-year-old child to learn (e.g., 'leaf', 'flower', 'tree', 'shoe'). MAXIMUM 2 WORDS. Reply with the noun ONLY. No sentences, no articles. Lowercase only." },
                            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${croppedBase64}` } }
                        ]
                    }]
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            if (data.choices && data.choices[0] && data.choices[0].message) {
                let rawWord = data.choices[0].message.content.trim().toLowerCase();
                rawWord = rawWord.replace(/^(this is a|it is a|i see a|the image shows|here is a|a |an |the )/g, '').trim();
                let word = rawWord.replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ');
                
                let wordsArray = word.split(' ');
                if (wordsArray.length > 2) { word = wordsArray.slice(-2).join(' '); }

                if (word.length > 0) {
                    document.getElementById('loading-msg').innerText = `✨ 搵到喇！係 ${word}！`;
                    setTimeout(() => { window.closeCamera(); processWord(word); }, 500);
                    return; 
                }
            }
            throw new Error("無內容回傳");

        } catch (err) {
            if (timeoutId) clearTimeout(timeoutId);
            console.error(`${model} 失敗: ${err.message}`);
        }
    }

    window.playCantoneseTTS("哎呀，伺服器太忙喇，不如再影過啦。");
    document.getElementById('loading-msg').innerText = "❌ 伺服器忙緊，請重試。";
    setTimeout(() => {
        document.getElementById('loading-msg').style.display = 'none';
        document.getElementById('camera-controls').style.display = 'flex';
        document.getElementById('preview-container').style.display = 'none';
        document.getElementById('camera-video').style.display = 'block';
    }, 3000);
}

window.processWord = function(word) {
    if (!word) return;
    let firstLetter = word.charAt(0).toUpperCase();
    let letterData = D.find(d => d.l === firstLetter);

    if (letterData) {
        const simpleIPA = { a:'/æ/', b:'/b/', c:'/k/', d:'/d/', e:'/ɛ/', f:'/f/', g:'/g/', h:'/h/', i:'/ɪ/', j:'/dʒ/', k:'/k/', l:'/l/', m:'/m/', n:'/n/', o:'/ɒ/', p:'/p/', q:'/kw/', r:'/r/', s:'/s/', t:'/t/', u:'/ʌ/', v:'/v/', w:'/w/', x:'/ks/', y:'/j/', z:'/z/' };
        
        let pData = word.split('').map(char => ({ 
            letter: char, 
            ipa: char === ' ' ? '' : (simpleIPA[char.toLowerCase()] || '') 
        }));
        
        let dynamicP = [ { t: 0, type: 'letter', text: firstLetter } ];
        let currentTime = 1000;
        let ssmlPhonics = "";
        
        word.split('').forEach((char, i) => {
            if (char !== ' ') {
                dynamicP.push({ t: currentTime, type: 'phonic', pData: pData, hlIdx: i });
                currentTime += 700;
                let ipa = simpleIPA[char.toLowerCase()] || char;
                ssmlPhonics += `<phoneme alphabet="ipa" ph="${ipa.replace(/\//g, '')}">${char}</phoneme> <break time="0.2s"/> `;
            }
        });
        
        // 🌟 保留原圖顯示喺結果度，唔係 Crop 完嗰忽，等畫面靚啲
        dynamicP.push({ t: currentTime + 500, type: 'word', text: word, img: window.lastCapturedImg });
        
        D.push({
            l: firstLetter, w: word, st: letterData.st, p: dynamicP,
            ssml: `<speak><prosody rate="0.85">${ssmlPhonics} <break time="0.4s"/> ${word}</prosody></speak>`
        });
        idx = D.length - 1;
        
        window.speakAlert(`搵到喇！係 ${word}，孜孜，一齊寫 ${firstLetter} 啦。`);
    } else {
        window.speakAlert(`搵到係 ${word}，但系統未有 ${firstLetter} 嘅筆順，試下影其他嘢啦。`);
    }
    if (document.getElementById('canvas-wrapper')) document.getElementById('canvas-wrapper').style.display = 'block';
    resetCanvas();
};
