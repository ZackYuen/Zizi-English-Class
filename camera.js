async function identifyWithAI(base64Image) {
    // 🌟 Nvidia 模型優先，失敗自動轉 Gemma/Gemini/Qwen
    const models = [
        "google/gemma-4-31b-it:free",
        "google/gemini-1.5-flash:free",
        "qwen/qwen-2-vl-7b-instruct:free",
        "nvidia/nemotron-nano-12b-v2-vl:free"
    ];

    let apiKey = localStorage.getItem('openrouter_api_key');
    if (!apiKey) {
        apiKey = prompt("請輸入 OpenRouter API Key:");
        if(apiKey) localStorage.setItem('openrouter_api_key', apiKey);
        else { window.closeCamera(); return; }
    }

    for (const model of models) {
        document.getElementById('loading-msg').innerText = `🧠 嘗試用 ${model.split('/')[1]} 分析...`;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000);

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
            const word = data.choices[0].message.content.trim().toLowerCase().replace(/[^a-z]/g, '');
            
            document.getElementById('loading-msg').innerText = `✨ 認到啦！係 ${word}！`;
            setTimeout(() => { window.closeCamera(); processWord(word); }, 1000);
            return; // 成功即結束

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
