// ==========================================
// 📷 探索魔鏡功能 (修復相機重用 Bug、加入全局語音及思考動畫)
// ==========================================

window.lastCapturedImg = null;
window.uiAudio = new Audio();
window.mAudio = window.mAudio || new Audio(); 

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

// 🌟 修復 1：打開相機時，強制重置並播放影片
window.openCamera = async function() {
    window.stopAllAudio(); 
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("瀏覽器唔支援相機！請用 HTTPS 網址。");
        return;
    }
    try {
        // 確保舊嘅 Stream 已經完全死心
        if (window.stream) {
            window.stream.getTracks().forEach(track => track.stop());
            window.stream = null;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        window.stream = stream;
        const video = document.getElementById('camera-video');
        
        video.srcObject = stream;
        // 🌟 關鍵：iOS 需要明確呼叫 play() 先會識得郁
        video.play().catch(e => console.error("Video play error:", e));
        
        video.style.display = 'block';

        let preview = document.getElementById('photo-preview');
        if (!preview) {
            preview = document.createElement('img');
            preview.id = 'photo-preview';
            preview.style.display = 'none';
            preview.style.width = '100%';
            preview.style.maxHeight = '55vh'; 
            preview.style.objectFit = 'contain'; 
            preview.style.borderRadius = '10px';
            video.parentNode.insertBefore(preview, video.nextSibling);
        }
        preview.style.display = 'none';

        document.getElementById('camera-overlay').style.display = 'flex';
        document.getElementById('camera-controls').style.display = 'flex';
        document.getElementById('loading-msg').style.display = 'none';
        
        window.playCantoneseTTS("打開相機啦，影低你想學嘅嘢啦！");
    } catch (err) { alert("開唔到相機：" + err.message); }
};

// 🌟 修復 2：關閉相機時，徹底清空影片來源
window.closeCamera = function() {
    window.stopAllAudio();
    if (window.stream) {
        window.stream.getTracks().forEach(track => track.stop());
        window.stream = null;
    }
    const video = document.getElementById('camera-video');
    if (video) video.srcObject = null; // 徹底釋放鏡頭資源

    document.getElementById('camera-overlay').style.display = 'none';
};

window.takePhoto = async function() {
    window.stopAllAudio(); 
    const video = document.getElementById('camera-video');
    
    // 🌟 修復 3：防呆機制。如果畫面未載入（0x0），唔畀影相，避免 AI 報錯
    if (!video.videoWidth || video.videoWidth === 0) {
        window.playCantoneseTTS("鏡頭仲未準備好呀，等多一秒先啦！");
        return; 
    }

    document.getElementById('camera-controls').style.display = 'none';
    const loadingMsg = document.getElementById('loading-msg');
    loadingMsg.style.display = 'block';
    
    window.playCantoneseTTS("收到！俾少少時間我諗下呢個係咩先。");
    loadingMsg.innerHTML = `<span class="thinking-anim">📸</span> Freeze 緊畫面...`;

    const preview = document.getElementById('photo-preview');
    const canvas = document.createElement('canvas');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    
    window.lastCapturedImg = canvas.toDataURL('image/jpeg', 0.8);
    preview.src = window.lastCapturedImg;
    preview.style.display = 'block';
    video.style.display = 'none';

    await identifyWithAI(canvas.toDataURL('image/jpeg', 0.2).split(',')[1]);
};

async function identifyWithAI(base64Image) {
    const models = [
        "google/gemini-1.5-flash:free",
        "qwen/qwen-2-vl-7b-instruct:free",
        "qwen/qwen2.5-vl-7b-instruct:free",
        "nvidia/nemotron-nano-12b-v2-vl:free"
    ];

    let apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) {
        apiKey = prompt("請輸入 OpenRouter API Key (sk-or-v1-...):");
        if(apiKey) localStorage.setItem('openrouter_api_key', apiKey);
        else { window.closeCamera(); return; }
    }

    for (const model of models) {
        document.getElementById('loading-msg').innerHTML = `<span class="thinking-anim">🧠</span> 嘗試用 ${model.split('/')[1]} 分析緊...`;
        let timeoutId; // 🌟 確保 timeout 會被正確清理
        try {
            const controller = new AbortController();
            timeoutId = setTimeout(() => controller.abort(), 25000);

            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: model,
                    messages: [{
                        role: "user",
                        content: [
                            { type: "text", text: "What is the main physical object in this image? Reply with a simple English noun or short noun phrase (e.g. 'cat', 'remote control'). Lowercase only, no articles, no punctuation." },
                            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
                        ]
                    }]
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            if (data.choices && data.choices[0] && data.choices[0].message) {
                const word = data.choices[0].message.content.trim().toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ');
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
    document.getElementById('loading-msg').innerText = "❌ 所有免費伺服器都忙緊，請稍後再試。";
    setTimeout(() => {
        document.getElementById('loading-msg').style.display = 'none';
        document.getElementById('camera-controls').style.display = 'flex';
        document.getElementById('photo-preview').style.display = 'none';
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
