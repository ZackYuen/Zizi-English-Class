const wordsData = [
    { l: 'A', w: 'ant' }, { l: 'B', w: 'bug' }, { l: 'C', w: 'cat' }, { l: 'D', w: 'dog' }, { l: 'E', w: 'egg' }
];
let currentIndex = 0;

const canvas = document.getElementById('letter-canvas');
const ctx = canvas.getContext('2d');
const tCtx = document.getElementById('tracing-layer').getContext('2d');

// 初始化
window.onload = () => { loadWord(0); };

function loadWord(index) {
    currentIndex = index;
    document.getElementById('current-letter').innerText = wordsData[index].l;
    clearCanvas();
    drawTracingGuide(wordsData[index].l);
}

function drawTracingGuide(letter) {
    tCtx.clearRect(0, 0, 300, 300);
    tCtx.font = '220px Arial';
    tCtx.textAlign = 'center'; tCtx.textBaseline = 'middle';
    tCtx.setLineDash([10, 10]); tCtx.strokeStyle = '#d1d1d1'; tCtx.lineWidth = 5;
    tCtx.strokeText(letter, 150, 150);
}

// 繪圖邏輯
let drawing = false;
canvas.onmousedown = () => drawing = true;
canvas.onmouseup = () => { drawing = false; ctx.beginPath(); };
canvas.onmousemove = (e) => {
    if(!drawing) return;
    let rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
};

function clearCanvas() { ctx.clearRect(0, 0, 300, 300); }

// Google TTS 與變身
async function checkAndTransform() {
    canvas.style.transition = "all 0.5s";
    canvas.style.transform = "scale(1.5) rotate(10deg)";
    canvas.style.opacity = "0";
    setTimeout(async () => {
        const apiKey = localStorage.getItem('google_tts_key') || prompt("請輸入 API Key:");
        localStorage.setItem('google_tts_key', apiKey);
        
        const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
            method: 'POST',
            body: JSON.stringify({input:{text: wordsData[currentIndex].w}, voice:{languageCode:'en-US', name:'en-US-Wavenet-F'}, audioConfig:{audioEncoding:'MP3'}})
        });
        const data = await res.json();
        if(data.audioContent) {
            new Audio(`data:audio/mp3;base64,${data.audioContent}`).play();
            confetti();
        }
        canvas.style.transform = "scale(1) rotate(0)";
        canvas.style.opacity = "1";
        clearCanvas();
    }, 600);
}

// 語音辨識
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'en-US';
function startListening() {
    recognition.start();
    recognition.onresult = (e) => {
        if(e.results[0][0].transcript.toLowerCase().includes(wordsData[currentIndex].w)) {
            alert("Perfect!"); confetti();
        } else {
            alert("Try again!");
        }
    };
}
