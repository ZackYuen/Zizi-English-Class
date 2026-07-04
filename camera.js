// ==========================================
// 📷 探索魔鏡功能 (Camera & OpenRouter AI 模組)
// ==========================================
window.openCamera = async function() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("瀏覽器唔支援相機！請用 HTTPS 網址。");
        return;
    }
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        const video = document.getElementById('camera-video');
        video.srcObject = stream;
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
    document.getElementById('loading-msg').style.display = 'block';
    
    const video = document.getElementById('camera-video');
    const canvas = document.createElement('canvas');
    // 壓縮解像度，加快 AI 處理速度
    canvas.width = video.videoWidth / 2; 
    canvas.height = video.videoHeight / 2;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const base64Data = canvas.toDataURL('image/jpeg', 0.2).split(',')[1];
    await identifyWithAI(base64Data);
};

async function identifyWithAI(base64Image) {
    let apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) {
        apiKey = prompt("請輸入 OpenRouter API Key (sk-or-v1-...):");
        if (apiKey) localStorage.setItem('openrouter_api_key', apiKey);
        else { window.closeCamera(); return; }
    }

    const msg = document.getElementById('msg');
    msg.innerText = "用緊最新免費 AI 分析緊...";

    try {
        // 直接呼叫 OpenRouter，無需 Proxy
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                // 使用 Meta Llama 3.2 90B 視覺模型 (完全免費)
                model: "meta-llama/llama-3.2-90b-vision-instruct:free", 
                messages: [{
                    role: "user",
                    content: [
                        { type: "text", text: "What is the main physical object in this image? Reply with ONLY ONE English word in lowercase. No punctuation, no articles." },
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

        if (!data.choices || data.choices.length === 0) {
            throw new Error("API 無回傳結果");
        }

        // 提取 AI 回傳嘅單字
        const recognizedWord = data.choices[0].message.content.trim().toLowerCase();
        window.closeCamera();
        processWord(recognizedWord);

    } catch (err) {
        console.error("API Error:", err);
        alert("❌ 發生錯誤:\n" + err.message);
        
        // 發生錯誤時恢復相機按鈕
        document.getElementById('loading-msg').style.display = 'none';
        document.getElementById('camera-controls').style.display = 'flex';
    }
}

window.processWord = function(word) {
    let exactMatchIdx = D.findIndex(d => d.w === word);
    if (exactMatchIdx !== -1) {
        idx = exactMatchIdx;
        speakAlert(`嘩！係 ${word} 呀！我哋一齊學寫！`);
    } else {
        let firstLetter = word.charAt(0).toUpperCase();
        let fallbackMatches = D.map((d, i) => d.l === firstLetter ? i : -1).filter(i => i !== -1);
        if (fallbackMatches.length > 0) {
            idx = fallbackMatches[Math.floor(Math.random() * fallbackMatches.length)];
            speakAlert(`呢個係 ${word}，我哋一齊學 ${firstLetter} for ${D[idx].w} 先啦！`);
        } else { speakAlert(`認到係 ${word}，但我哋未學到呢個字母呀。`); }
    }
    window.closeCamera();
    resetCanvas();
};
