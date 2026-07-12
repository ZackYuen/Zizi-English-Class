// ==========================================
// 📸 探索魔鏡 (相機與 AI 認字模組)
// ==========================================

window.cameraStream = null;
window.lastCapturedImg = null;
window.isAnalyzing = false;

window.openCamera = async function() {
    if (window.stopAllAudio) window.stopAllAudio();
    window.isAnalyzing = false;

    // 顯示相機介面，隱藏畫布
    const overlay = document.getElementById('camera-overlay');
    if(overlay) overlay.style.display = 'flex';
    document.getElementById('app').style.display = 'none';
    document.getElementById('loading-msg').style.display = 'none';
    document.getElementById('btn-re-cam').style.display = 'none';

    try {
        // 強制要求後置鏡頭
        window.cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false
        });
        const video = document.getElementById('camera-video');
        if(video) {
            video.srcObject = window.cameraStream;
        }
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

window.closeCamera = function() {
    // 徹底釋放相機資源
    if (window.cameraStream) {
        window.cameraStream.getTracks().forEach(track => track.stop());
        window.cameraStream = null;
    }
    const overlay = document.getElementById('camera-overlay');
    if(overlay) overlay.style.display = 'none';
};

window.takePhoto = function() {
    if (window.isAnalyzing) return;

    const video = document.getElementById('camera-video');
    if (!video || !window.cameraStream) return;

    if(window.playCantoneseTTS) window.playCantoneseTTS("影咗喇！等我睇下係咩先！");

    // 將 Video 畫面畫落 Canvas 轉做 Base64
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // 壓縮圖片質素以加快上傳速度
    window.lastCapturedImg = canvas.toDataURL('image/jpeg', 0.7);
    
    // 顯示 Loading
    document.getElementById('loading-msg').style.display = 'block';
    
    // 進行 AI 分析
    identifyWithAI(window.lastCapturedImg);
};

window.identifyWithAI = async function(base64Img) {
    window.isAnalyzing = true;
    
    let apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) {
        window.isAnalyzing = false;
        window.closeCamera();
        // 🌟 自動彈出你整好嘅設定介面
        if(window.openSettings) {
            window.openSettings();
        } else {
            alert("請先設定 OpenRouter API Key");
        }
        return;
    }

    try {
        // 使用 OpenRouter 免費 Vision 模型
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
        
        if (data.error) {
            throw new Error(data.error.message || "API 發生錯誤");
        }

        // 清理 AI 回應，確保淨係得一個英文生字
        let word = data.choices[0].message.content.trim().toLowerCase();
        word = word.replace(/[^a-z]/g, '');

        if (word.length > 0) {
            window.isAnalyzing = false;
            window.closeCamera();
            
            // 🌟 手動恢復畫布 UI (因為相機模式下預設係隱藏嘅)
            document.getElementById('app').style.display = 'block';
            document.getElementById('btn-re-cam').style.display = 'inline-block'; // 顯示「影下一個」
            document.getElementById('standard-top-bar').style.display = 'flex';
            
            // 將生字交畀 canvas.js 處理
            if(window.processWord) {
                window.processWord(word, window.lastCapturedImg);
            }
        } else {
            throw new Error("AI 無法識別");
        }

    } catch (error) {
        console.error("AI 辨識失敗:", error);
        document.getElementById('loading-msg').style.display = 'none';
        window.isAnalyzing = false;
        
        if(window.playCantoneseTTS) {
            window.playCantoneseTTS("哎呀，我睇唔清楚，不如你影多次啦！");
        }
        
        // 遇到 Error 嗰陣，如果 API Key 錯咗，可以清空佢等家長重新入
        if (error.message.includes("401") || error.message.includes("key")) {
            localStorage.removeItem('openrouter_api_key');
            alert("API Key 可能無效，請重新輸入！");
        }
    }
};
