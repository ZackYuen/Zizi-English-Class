// 相機擷取與 Gemini AI 圖像識別模組
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
    canvas.width = video.videoWidth / 2; 
    canvas.height = video.videoHeight / 2;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const base64Data = canvas.toDataURL('image/jpeg', 0.2).split(',')[1];
    await identifyWithGemini(base64Data);
};

async function identifyWithGemini(base64Image) {
    let apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
        apiKey = prompt("請輸入 Gemini API Key:");
        if (apiKey) localStorage.setItem('gemini_api_key', apiKey);
        else { window.closeCamera(); return; }
    }

    const msg = document.getElementById('msg');
    msg.innerText = "分析緊...";

    const proxyUrl = 'https://corsproxy.io/?'; 
    
    // 🌟 核心修正：使用 v1beta 以及 gemini-1.5-flash-latest 確保一定搵到模型
    const targetUrl = encodeURIComponent(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`);

    try {
        const response = await fetch(proxyUrl + targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: "What is the main physical object in this image? Reply with ONLY ONE English word in lowercase. No punctuation, no articles." },
                        { inline_data: { mime_type: "image/jpeg", data: base64Image } }
                    ]
                }]
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP ${response.status}: ${errorData.error?.message || '未知錯誤'}`);
        }
        
        const data = await response.json();
        if (data.error) throw new Error(`API Error: ${data.error.message}`);
        
        const recognizedWord = data.candidates[0].content.parts[0].text.trim().toLowerCase();
        window.closeCamera();
        processWord(recognizedWord);
        
    } catch (err) {
        console.error("Gemini Error:", err);
        alert("❌ 發生錯誤:\n" + err.message);
        
        document.getElementById('loading-msg').style.display = 'none';
        document.getElementById('camera-controls').style.display = 'flex';
    }
}

function processWord(word) {
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
}