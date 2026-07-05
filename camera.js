// ==========================================
// 📷 探索魔鏡功能 (UX 強化與即時動態字卡版)
// ==========================================

window.lastCapturedImg = null; // 用來儲存剛剛拍下的照片

window.openCamera = async function() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("瀏覽器唔支援相機！請用 HTTPS 網址。");
        return;
    }
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        const video = document.getElementById('camera-video');
        video.srcObject = stream;
        video.style.display = 'block'; // 確保鏡頭畫面顯示

        // 動態生成預覽圖片元素 (如果 HTML 內沒有)
        let preview = document.getElementById('photo-preview');
        if (!preview) {
            preview = document.createElement('img');
            preview.id = 'photo-preview';
            preview.style.display = 'none';
            preview.style.width = '100%';
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
    loadingMsg.innerText = "📸 影到啦！Freeze 緊畫面...";

    const video = document.getElementById('camera-video');
    const preview = document.getElementById('photo-preview');
    const canvas = document.createElement('canvas');
    
    // 1. Freeze 畫面：將 video 內容畫入 canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // 儲存高畫質圖片作預覽及魔術揭曉用
    const fullBase64 = canvas.toDataURL('image/jpeg', 0.8);
    // 儲存低畫質圖片給 AI 分析以加快速度
    const aiBase64 = canvas.toDataURL('image/jpeg', 0.2).split(',')[1];
    
    window.lastCapturedImg = fullBase64;

    // 隱藏影片，顯示定格相片
    preview.src = fullBase64;
    preview.style.display = 'block';
    video.style.display = 'none';

    loadingMsg.innerText = "🧠 AI 分析緊係咩嚟...";
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
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
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

        // 提取並清理 AI 回傳的單字
        const recognizedWord = data.choices[0].message.content.trim().toLowerCase().replace(/[^a-z]/g, '');

        document.getElementById('loading-msg').innerText = `✨ 認到啦！係 ${recognizedWord}！`;
        
        // 延遲 1 秒關閉，讓使用者看清楚認到的字
        setTimeout(() => {
            window.closeCamera();
            processWord(recognizedWord);
        }, 1000);

    } catch (err) {
        console.error("API Error:", err);
        document.getElementById('loading-msg').innerText = "❌ 分析失敗，試多次！";
        
        // 失敗時恢復相機狀態
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

    // 尋找字典中是否有這個開頭字母的筆順資料
    let letterData = D.find(d => d.l === firstLetter);

    if (letterData) {
        // 🌟 核心改動：即時動態生成字卡，VLM 出咩字就教咩字
        let dynamicEntry = {
            l: firstLetter,
            w: word,
            st: letterData.st, // 借用字典中該字母的筆順
            p: [
                { t: 0, type: 'letter', text: firstLetter },
                { t: 1500, type: 'word', text: word, img: window.lastCapturedImg } // 魔術時間顯示剛拍的照片
            ],
            ssml: `<speak><prosody rate="0.85">${firstLetter}, ${word}</prosody></speak>`
        };

        // 將動態字卡推入字典，並將當前索引指向它
        D.push(dynamicEntry);
        idx = D.length - 1;
        
        speakAlert(`呢個係 ${word}，我哋一齊寫 ${firstLetter}！`);
    } else {
        speakAlert(`認到係 ${word}，但我哋未有 ${firstLetter} 嘅筆順呀。`);
    }
    
    // 顯示畫板開始學習
    const canvasWrapper = document.getElementById('canvas-wrapper');
    if (canvasWrapper) canvasWrapper.style.display = 'block';
    
    resetCanvas();
};
