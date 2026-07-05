// ... 保留前面的代碼 (openCamera, closeCamera, takePhoto 等) ...

async function identifyWithAI(base64Image) {
    let apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) {
        apiKey = prompt("請輸入 OpenRouter API Key (sk-or-v1-...):");
        if (apiKey) localStorage.setItem('openrouter_api_key', apiKey);
        else { window.closeCamera(); return; }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "nvidia/llama-nemotron-embed-vl-1b-v2:free", 
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
        clearTimeout(timeoutId);
        
        if (err.name === 'AbortError') {
            document.getElementById('loading-msg').innerText = "⏳ AI 諗得太耐啦 (Timeout 15s)。";
        } else {
            // 🌟 核心改動：直接將系統 Log / 報錯內容顯示喺畫面上，方便手機 Debug
            document.getElementById('loading-msg').innerText = `❌ Error: ${err.message}`;
            console.error("API Error:", err);
        }
        
        // 🌟 延長至 5 秒，等你睇得切個 Error Message，或者 Cap 圖
        setTimeout(() => {
            document.getElementById('loading-msg').style.display = 'none';
            document.getElementById('camera-controls').style.display = 'flex';
            document.getElementById('photo-preview').style.display = 'none';
            document.getElementById('camera-video').style.display = 'block';
        }, 5000); 
    }
}

// ... 保留後面的代碼 (processWord 等) ...
