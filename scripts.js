const wordsData = [
    { l: 'A', w: 'ant' }, { l: 'B', w: 'bug' }, { l: 'C', w: 'cat' }, 
    { l: 'D', w: 'dog' }, { l: 'E', w: 'egg' }, { l: 'F', w: 'fox' }
];
let currentIndex = 0;

const canvas = document.getElementById('letter-canvas');
const ctx = canvas.getContext('2d');
const tracingLayer = document.getElementById('tracing-layer');
const tCtx = tracingLayer.getContext('2d');

// 畫筆設定 (粗身、圓頭、鮮艷橙色)
ctx.lineWidth = 25; 
ctx.lineCap = 'round'; 
ctx.lineJoin = 'round';
ctx.strokeStyle = '#ff9f1c'; 

// 確保網頁完全載入先執行，防止 iOS 偷步 Crash
document.addEventListener('DOMContentLoaded', () => {
    initKeyboard();
    loadWord(0);
});

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

// 畫深色虛線底稿
function drawTracingGuide(letter) {
    tCtx.clearRect(0, 0, 300, 300);
    tCtx.font = 'bold 220px Arial';
    tCtx.textAlign = 'center'; 
    tCtx.textBaseline = 'middle';
    tCtx.setLineDash([12, 12]); 
    tCtx.strokeStyle = '#aaaaaa'; // 深灰色，等孜孜易啲睇
    tCtx.lineWidth = 8;
    tCtx.strokeText(letter, 150, 160);
}

function clearCanvas() { 
    ctx.clearRect(0, 0, 300, 300); 
}

// ========== 完美支援 iOS 嘅 Pointer Events ==========
let drawing = false;

function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

// 使用 pointerdown / pointermove 完美解決 Mouse + Touch 兼容問題
canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    drawing = true;
    const pos = getPointerPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
});

canvas.addEventListener('pointermove', (e) => {
    e.preventDefault();
    if(!drawing) return;
    const pos = getPointerPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
});

canvas.addEventListener('pointerup', (e) => {
    e.preventDefault();
    drawing = false;
});

canvas.addEventListener('pointercancel', () => drawing = false);
canvas.addEventListener('pointerout', () => drawing = false);


// ========== 變身與發音邏輯 ==========
async function checkAndTransform() {
    // 檢查有冇畫過嘢
    const imgData = ctx.getImageData(0, 0, 300, 300);
    let hasDrawn = false;
    for(let i=3; i<imgData.data.length; i+=4) { if(imgData.data[i] > 50) { hasDrawn = true; break; } }
    
    if(!hasDrawn) {
        alert("孜孜，請跟住虛線寫個字先啦！");
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
            } catch(e) { console.log("發音錯誤"); }
        }
        
        canvas.style.transform = "scale(1) rotate(0)";
        canvas.style.opacity = "1";
        clearCanvas();
    }, 500);
}

// ========== 安全語音辨識檢查 ==========
let recognition;
const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRec) {
    recognition = new SpeechRec();
    recognition.lang = 'en-US';
    recognition.onresult = (e) => {
        const spoken = e.results[0][0].transcript.toLowerCase();
        if(spoken.includes(wordsData[currentIndex].w)) {
            alert("叻仔！讀得好啱！");
            if(typeof confetti === 'function') confetti({ particleCount: 150, spread: 80 });
        } else {
            alert("差少少，你讀咗: " + spoken + "。再試多次！");
        }
    };
    recognition.onerror = () => { alert("聽唔清楚，撳多次掣再講啦！"); };
}

function startListening() {
    if (recognition) {
        recognition.start();
    } else {
        alert("呢部機嘅瀏覽器暫時未支援語音辨識功能，但係你都可以繼續寫字同聽發音！");
    }
}
