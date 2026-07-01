// 加入終極 Debug 工具：如果網頁出錯，會即刻彈 Alert 話你知
window.onerror = function(message, source, lineno) {
    alert("系統錯誤: " + message + " (行數: " + lineno + ")");
    return true;
};

const wordsData = [
    { l: 'A', w: 'ant' }, { l: 'B', w: 'bug' }, { l: 'C', w: 'cat' }, 
    { l: 'D', w: 'dog' }, { l: 'E', w: 'egg' }, { l: 'F', w: 'fox' }
];
let currentIndex = 0;

const canvas = document.getElementById('letter-canvas');
const ctx = canvas.getContext('2d');
const tracingLayer = document.getElementById('tracing-layer');
const tCtx = tracingLayer.getContext('2d');

// 畫筆設定
ctx.lineWidth = 25; 
ctx.lineCap = 'round'; 
ctx.lineJoin = 'round';
ctx.strokeStyle = '#ff9f1c'; 

// 確保 HTML 載入完先執行
window.onload = function() {
    initKeyboard();
    loadWord(0);
};

function initKeyboard() {
    const grid = document.getElementById('grid-container');
    grid.innerHTML = '';
    wordsData.forEach((item, index) => {
        const key = document.createElement('div');
        key.className = 'key';
        key.innerText = item.l;
        key.onclick = () => loadWord(index);
        grid.appendChild(key);
    });
}

function loadWord(index) {
    currentIndex = index;
    document.getElementById('current-letter').innerText = wordsData[index].l;
    clearCanvas();
    drawTracingGuide(wordsData[index].l);
}

// 畫深灰色虛線
function drawTracingGuide(letter) {
    tCtx.clearRect(0, 0, 300, 300);
    tCtx.font = 'bold 220px Arial';
    tCtx.textAlign = 'center'; 
    tCtx.textBaseline = 'middle';
    tCtx.setLineDash([12, 12]); 
    tCtx.strokeStyle = '#aaaaaa'; 
    tCtx.lineWidth = 8;
    tCtx.strokeText(letter, 150, 160);
}

function clearCanvas() { 
    ctx.clearRect(0, 0, 300, 300); 
}

// ========== 完美支援 iOS 嘅 Touch 事件 ==========
let drawing = false;

// 觸控 (iPhone/iPad)
canvas.addEventListener('touchstart', function(e) {
    e.preventDefault(); 
    drawing = true;
    let rect = canvas.getBoundingClientRect();
    let touch = e.touches[0];
    ctx.beginPath();
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
}, { passive: false });

canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
    if (!drawing) return;
    let rect = canvas.getBoundingClientRect();
    let touch = e.touches[0];
    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    ctx.stroke();
}, { passive: false });

canvas.addEventListener('touchend', function(e) {
    e.preventDefault();
    drawing = false;
});

// 滑鼠 (電腦測試用)
canvas.addEventListener('mousedown', function(e) {
    drawing = true;
    let rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
});
canvas.addEventListener('mousemove', function(e) {
    if (!drawing) return;
    let rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
});
canvas.addEventListener('mouseup', function() { drawing = false; });
canvas.addEventListener('mouseout', function() { drawing = false; });


// ========== 變身與發音邏輯 ==========
async function checkAndTransform() {
    const imgData = ctx.getImageData(0, 0, 300, 300);
    let hasDrawn = false;
    for(let i=3; i<imgData.data.length; i+=4) { if(imgData.data[i] > 50) { hasDrawn = true; break; } }
    
    if(!hasDrawn) {
        alert("請跟住虛線寫個字先啦！");
        return;
    }

    canvas.style.transition = "all 0.5s";
    canvas.style.transform = "scale(1.2) rotate(15deg)";
    canvas.style.opacity = "0";
    
    setTimeout(async () => {
        let apiKey = localStorage.getItem('google_tts_key');
        if (!apiKey) {
            apiKey = prompt("請輸入 Google API Key 啟動發音:");
            if (apiKey) localStorage.setItem('google_tts_key', apiKey);
        }
        
        if (apiKey) {
            try {
                const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
                    method: 'POST',
                    body: JSON.stringify({input:{text: wordsData[currentIndex].w}, voice:{languageCode:'en-US', name:'en-US-Wavenet-F'}, audioConfig:{audioEncoding:'MP3'}})
                });
                const data = await res.json();
                if(data.audioContent) {
                    new Audio(`data:audio/mp3;base64,${data.audioContent}`).play();
                    if(typeof confetti === 'function') confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                }
            } catch(e) { alert("網絡連線錯誤，發音失敗"); }
        }
        
        canvas.style.transform = "scale(1) rotate(0)";
        canvas.style.opacity = "1";
        clearCanvas();
    }, 500);
}

// ========== 延遲載入語音辨識 (避免 iOS 崩潰) ==========
function startListening() {
    try {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) {
            alert("呢部機嘅 Safari 未支援語音辨識，請試用 Chrome。");
            return;
        }
        
        const recognition = new SpeechRec();
        recognition.lang = 'en-US';
        
        recognition.onresult = function(e) {
            const spoken = e.results[0][0].transcript.toLowerCase();
            if(spoken.includes(wordsData[currentIndex].w)) {
                alert("叻仔！讀得好啱！");
                if(typeof confetti === 'function') confetti({ particleCount: 150, spread: 80 });
            } else {
                alert("差少少，你讀咗: " + spoken + "。再試多次！");
            }
        };
        
        recognition.onerror = function(e) { 
            alert("語音錯誤: " + e.error); 
        };
        
        recognition.start();
        
    } catch (err) {
        alert("無法啟動咪高風：" + err.message);
    }
}
