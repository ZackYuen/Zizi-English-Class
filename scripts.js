const wordsData = [
    { l: 'A', w: 'ant' }, { l: 'B', w: 'bug' }, { l: 'C', w: 'cat' }, 
    { l: 'D', w: 'dog' }, { l: 'E', w: 'egg' }, { l: 'F', w: 'fox' }
];
let currentIndex = 0;

const canvas = document.getElementById('letter-canvas');
const ctx = canvas.getContext('2d');
const tCtx = document.getElementById('tracing-layer').getContext('2d');

// 針對 5 歲小朋友，筆畫設定得特別粗，顏色用顯眼嘅橙色
ctx.lineWidth = 25; 
ctx.lineCap = 'round'; 
ctx.lineJoin = 'round';
ctx.strokeStyle = '#ff9f1c'; 

// 初始化
window.onload = () => { loadWord(0); initKeyboard(); };

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

function drawTracingGuide(letter) {
    tCtx.clearRect(0, 0, 300, 300);
    tCtx.font = 'bold 200px Arial';
    tCtx.textAlign = 'center'; tCtx.textBaseline = 'middle';
    tCtx.setLineDash([15, 15]); tCtx.strokeStyle = '#ced4da'; tCtx.lineWidth = 8;
    tCtx.strokeText(letter, 150, 160);
}

function clearCanvas() { 
    ctx.clearRect(0, 0, 300, 300); 
}

// ========== iPhone 專屬觸控修正 ==========
let drawing = false;

// 準確計算畫布座標，扣除邊界偏移
function getTouchPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
}

// Touch Events (iOS Safari)
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // 絕對阻止畫面捲動
    drawing = true;
    const pos = getTouchPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault(); // 絕對阻止畫面捲動
    if(!drawing) return;
    const pos = getTouchPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    drawing = false;
});

// Mouse Events (電腦版備用)
canvas.addEventListener('mousedown', (e) => { drawing = true; const pos = getTouchPos(e); ctx.beginPath(); ctx.moveTo(pos.x, pos.y); });
canvas.addEventListener('mousemove', (e) => { if(drawing) { const pos = getTouchPos(e); ctx.lineTo(pos.x, pos.y); ctx.stroke(); } });
canvas.addEventListener('mouseup', () => drawing = false);
canvas.addEventListener('mouseout', () => drawing = false);

// ========== 發音與邏輯 ==========
async function checkAndTransform() {
    canvas.style.transition = "all 0.5s";
    canvas.style.transform = "scale(1.2) rotate(15deg)";
    canvas.style.opacity = "0";
    
    setTimeout(async () => {
        let apiKey = localStorage.getItem('google_tts_key');
        if (!apiKey) {
            apiKey = prompt("請輸入 API Key 以啟動發音:");
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
                    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                }
            } catch(e) { console.log("發音錯誤"); }
        }
        
        canvas.style.transform = "scale(1) rotate(0)";
        canvas.style.opacity = "1";
        clearCanvas();
    }, 500);
}

// ========== 語音辨識 (兼容檢查) ==========
function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("你嘅瀏覽器暫時未支援語音辨識功能，試下用 Safari 或 Chrome 啦！");
        return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.start();
    
    recognition.onresult = (e) => {
        const spoken = e.results[0][0].transcript.toLowerCase();
        if(spoken.includes(wordsData[currentIndex].w)) {
            alert("叻仔！讀得好啱！");
            confetti({ particleCount: 150, spread: 80 });
        } else {
            alert("差少少，你讀咗: " + spoken + "。再試多次！");
        }
    };
    
    recognition.onerror = () => {
        alert("聽唔清楚，撳多次掣再講啦！");
    };
}
