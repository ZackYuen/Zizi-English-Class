// ==========================================
// 📷 探索魔鏡功能 (動態生成 Jolly Phonics + 修正預覽比例版)
// ==========================================

window.lastCapturedImg = null;

window.openCamera = async function() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("瀏覽器唔支援相機！請用 HTTPS 網址。");
        return;
    }
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        const video = document.getElementById('camera-video');
        video.srcObject = stream;
        video.style.display = 'block';

        // 動態生成預覽圖片元素
        let preview = document.getElementById('photo-preview');
        if (!preview) {
            preview = document.createElement('img');
            preview.id = 'photo-preview';
            preview.style.display = 'none';
            preview.style.width = '100%';
            preview.style.maxHeight = '55vh';    // 🌟 限制最高高度，不撐爆版面
            preview.style.objectFit = 'contain';  // 🌟 保持原圖長寬比，不變形
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
    if (stream) stream.getTracks().forEach(track => track.stop());
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
    
    const fullBase64 = canvas.toDataURL('image/jpeg', 0.8);
    const aiBase64 = canvas.toDataURL('image/jpeg', 0.2).split(',')[1];
    
    window.lastCapturedImg = fullBase64;

    // 即時凍結長方形畫面
    preview.src = fullBase64;
    preview.style.display = 'block';
    video.style.display = 'none';

    loadingMsg.innerText = "🧠 AI 分析緊...";
    await identifyWithAI(aiBase64);
};

async function identifyWithAI(base64Image) {
    let apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) {
        apiKey = prompt("請輸入 OpenRouter API Key (sk-or-v1-...):");
        if (apiKey) localStorage.setItem('openrouter_api_key', apiKey);
        else { window.closeCamera(); return; }
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "nvidia/nemotron-nano-12b-v2-vl:free", 
                messages: [{
                    role: "user",
                    content: [
                        { type: "text", text: "What is the main physical object in this image? Reply with ONLY ONE English noun in lowercase. No punctuation, no articles." },
                        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
                    ]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP ${response.status}: ${errorData.error?.message || '未知錯誤'}`);
        }

        const data = await response.json();
        if (!data.choices || data.choices.length === 0) throw new Error("API 無回傳結果");

        const recognizedWord = data.choices[0].message.content.trim().toLowerCase().replace(/[^a-z]/g, '');

        document.getElementById('loading-msg').innerText = `✨ 係 ${recognizedWord}！`;
        
        setTimeout(() => {
            window.closeCamera();
            processWord(recognizedWord);
        }, 1000);

    } catch (err) {
        document.getElementById('loading-msg').innerText = "❌ 分析失敗，試多次。";
        setTimeout(() => {
            document.getElementById('loading-msg').style.display = 'none';
            document.getElementById('camera-controls').style.display = 'flex';
            document.getElementById('photo-preview').style.display = 'none';
            document.getElementById('camera-video').style.display = 'block';
        }, 2000);
    }
}

window.processWord = function(word) {
    if (!word) return;
    let firstLetter = word.charAt(0).toUpperCase();
    let letterData = D.find(d => d.l === firstLetter);

    if (letterData) {
        // 建立簡易 Jolly Phonics 字典 (動態配音標)
        const simpleIPA = { a:'/æ/', b:'/b/', c:'/k/', d:'/d/', e:'/ɛ/', f:'/f/', g:'/g/', h:'/h/', i:'/ɪ/', j:'/dʒ/', k:'/k/', l:'/l/', m:'/m/', n:'/n/', o:'/ɒ/', p:'/p/', q:'/kw/', r:'/r/', s:'/s/', t:'/t/', u:'/ʌ/', v:'/v/', w:'/w/', x:'/ks/', y:'/j/', z:'/z/' };
        
        let pData = word.split('').map(char => ({
            letter: char,
            ipa: simpleIPA[char.toLowerCase()] || ''
        }));

        let dynamicP = [ { t: 0, type: 'letter', text: firstLetter } ];
        let currentTime = 1000;
        let ssmlPhonics = "";
        
        // 動態生成畫板高光拆音動畫及 SSML 讀音語法
        word.split('').forEach((char, i) => {
            dynamicP.push({ t: currentTime, type: 'phonic', pData: pData, hlIdx: i });
            currentTime += 700; // 每個音停留 0.7 秒
            
            let ipa = simpleIPA[char.toLowerCase()] || char;
            let cleanIpa = ipa.replace(/\//g, '');
            ssmlPhonics += `<phoneme alphabet="ipa" ph="${cleanIpa}">${char}</phoneme> <break time="0.2s"/> `;
        });
        
        // 魔術時間顯示剛拍的照片 (已處理防變形邏輯)
        dynamicP.push({ t: currentTime + 500, type: 'word', text: word, img: window.lastCapturedImg });
        
        let dynamicEntry = {
            l: firstLetter,
            w: word,
            st: letterData.st, 
            p: dynamicP, 
            ssml: `<speak><prosody rate="0.85">${ssmlPhonics} <break time="0.4s"/> ${word}</prosody></speak>`
        };

        D.push(dynamicEntry);
        idx = D.length - 1;
        
        speakAlert(`呢個係 ${word}，一齊寫 ${firstLetter} 啦。`);
    } else {
        speakAlert(`認到係 ${word}，但未有 ${firstLetter} 嘅筆順。`);
    }
    
    const canvasWrapper = document.getElementById('canvas-wrapper');
    if (canvasWrapper) canvasWrapper.style.display = 'block';
    
    resetCanvas();
};
