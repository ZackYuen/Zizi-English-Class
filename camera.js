// ==========================================
// 📷 探索魔鏡功能 (加入全局語音中斷、廣東話 TTS 及思考動畫)
// ==========================================

window.lastCapturedImg = null;

// 🌟 新增：全局音頻控制，確保唔會重疊
window.uiAudio = new Audio();
window.mAudio = window.mAudio || new Audio(); // 確保 mAudio 存在

window.stopAllAudio = function() {
    if (window.uiAudio) { window.uiAudio.pause(); window.uiAudio.currentTime = 0; }
    if (window.mAudio) { window.mAudio.pause(); window.mAudio.currentTime = 0; }
    window.speechSynthesis.cancel(); // 停埋瀏覽器自帶嘅 TTS (安全網)
};

// 🌟 新增：專門負責廣東話 UI 指示嘅 Google TTS 函數
window.playCantoneseTTS = async function(text) {
    window.stopAllAudio(); // 播放新指示前，斬斷所有舊聲
    let key = localStorage.getItem('google_tts_key');
    if (!key) {
        // 冇 Key 嘅後備方案：用瀏覽器原生廣東話發音
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
                voice: { languageCode: 'yue-HK', name: 'yue-HK-Standard-A' }, // Google TTS 廣東話女聲
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

// 覆蓋舊版 speakAlert，全面轉用 Google TTS
window.speakAlert = function(msg) {
    window.playCantoneseTTS(msg);
};

// 🌟 新增：注入思考中嘅 CSS 動畫
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

window.openCamera = async function() {
    window.stopAllAudio(); // 中斷上一個動作嘅聲
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("瀏覽器唔支援相機！請用 HTTPS 網址。");
        return;
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        window.stream = stream;
        const video = document.getElementById('camera-video');
        video.srcObject = stream;
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
        
        // 🌟 語音提示
        window.playCantoneseTTS("打開相機啦，影低你想學嘅嘢啦！");
    } catch (err) { alert("開唔到相機：" + err.message); }
};

window.closeCamera = function() {
    window.stopAllAudio();
    if (window.stream) window.stream.getTracks().forEach(track => track.stop());
    document.getElementById('camera-overlay').style.display = 'none';
};

window.takePhoto = async function() {
    window.stopAllAudio(); // 㩒掣即刻停聲
    document.getElementById('camera-controls').style.display = 'none';
    const loadingMsg = document.getElementById('loading-msg');
    loadingMsg.style.display = 'block';
    
    // 🌟 語音提示 + 動畫準備
    window.playCantoneseTTS("收到！俾少少時間我諗下呢個係咩先。");
    loadingMsg.innerHTML = `<span class="thinking-anim">📸</span> Freeze 緊畫面...`;

    const video = document.getElementById('camera-video');
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
        // 🌟 加入 thinking 動畫
        document.getElementById('loading-msg').innerHTML = `<span class="thinking-anim">🧠</span> 嘗試用 ${model.split('/')[1]} 分析緊...`;
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 25000);

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
        
        // 🌟 搵到字嘅發聲提示
        window.speakAlert(`搵到喇！係 ${word}，孜孜，一齊寫 ${firstLetter} 啦。`);
    } else {
        window.speakAlert(`搵到係 ${word}，但系統未有 ${firstLetter} 嘅筆順，試下影其他嘢啦。`);
    }
    if (document.getElementById('canvas-wrapper')) document.getElementById('canvas-wrapper').style.display = 'block';
    resetCanvas();
};
