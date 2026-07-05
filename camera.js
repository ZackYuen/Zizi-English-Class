// ==========================================
// 📷 探索魔鏡功能 (完整優化版)
// ==========================================

window.lastCapturedImg = null;

window.openCamera = async function() {
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
            preview.style.objectFit = 'contain'; // 🌟 修正：防止圖片變形
            preview.style.borderRadius = '10px';
            video.parentNode.insertBefore(preview, video.nextSibling);
        }
        preview.style.display = 'none';

        document.getElementById('camera-overlay').style.display = 'flex';
        document.getElementById('camera-controls').style.display = 'flex';
        document.getElementById('loading-msg').style.display = 'none';
    } catch (err) { alert("開唔到相機：" + err.message); }
};

window.closeCamera = function() {
    if (window.stream) window.stream.getTracks().forEach(track => track.stop());
    document.getElementById('camera-overlay').style.display = 'none';
};

window.takePhoto = async function() {
    document.getElementById('camera-controls').style.display = 'none';
    const loadingMsg = document.getElementById('loading-msg');
    loadingMsg.style.display = 'block';
    loadingMsg.innerText = "📸 Freeze 緊畫面...";

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
    // 🌟 模型順序：穩定視覺模型優先，Nvidia 放最後
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
        document.getElementById('loading-msg').innerText = `🧠 嘗試用 ${model.split('/')[1]} 分析...`;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 25000); // 25秒強制切換

            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: model,
                    messages: [{
                        role: "user",
                        content: [
                            { type: "text", text: "What is the main physical object in this image? Reply with ONLY ONE English noun in lowercase. No punctuation, no articles." },
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
                const word = data.choices[0].message.content.trim().toLowerCase().replace(/[^a-z]/g, '');
                if (word.length > 0) {
                    document.getElementById('loading-msg').innerText = `✨ 認到啦！係 ${word}！`;
                    setTimeout(() => { window.closeCamera(); processWord(word); }, 1000);
                    return; 
                }
            }
            throw new Error("無內容回傳");

        } catch (err) {
            console.error(`${model} 失敗: ${err.message}`);
        }
    }

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
        
        let pData = word.split('').map(char => ({ letter: char, ipa: simpleIPA[char.toLowerCase()] || '' }));
        let dynamicP = [ { t: 0, type: 'letter', text: firstLetter } ];
        let currentTime = 1000;
        let ssmlPhonics = "";
        
        word.split('').forEach((char, i) => {
            dynamicP.push({ t: currentTime, type: 'phonic', pData: pData, hlIdx: i });
            currentTime += 700;
            let ipa = simpleIPA[char.toLowerCase()] || char;
            ssmlPhonics += `<phoneme alphabet="ipa" ph="${ipa.replace(/\//g, '')}">${char}</phoneme> <break time="0.2s"/> `;
        });
        
        dynamicP.push({ t: currentTime + 500, type: 'word', text: word, img: window.lastCapturedImg });
        
        D.push({
            l: firstLetter, w: word, st: letterData.st, p: dynamicP,
            ssml: `<speak><prosody rate="0.85">${ssmlPhonics} <break time="0.4s"/> ${word}</prosody></speak>`
        });
        idx = D.length - 1;
        speakAlert(`呢個係 ${word}，一齊寫 ${firstLetter} 啦。`);
    } else {
        speakAlert(`認到係 ${word}，但未有 ${firstLetter} 嘅筆順。`);
    }
    if (document.getElementById('canvas-wrapper')) document.getElementById('canvas-wrapper').style.display = 'block';
    resetCanvas();
};
