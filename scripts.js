const wordsData = [
    { l: 'A', w: 'ant' }, { l: 'B', w: 'bug' }, { l: 'C', w: 'cat' }, { l: 'D', w: 'dog' }, { l: 'E', w: 'egg' }
]; // 你可以自行加入後續 A-Z
let currentIndex = 0;

// Canvas 繪圖邏輯
const canvas = document.getElementById('letter-canvas');
const ctx = canvas.getContext('2d');
let drawing = false;
ctx.lineWidth = 15; ctx.lineCap = 'round'; ctx.strokeStyle = '#1d3557';

canvas.onmousedown = () => drawing = true;
canvas.onmouseup = () => { drawing = false; ctx.beginPath(); };
canvas.onmousemove = (e) => {
    if(!drawing) return;
    let rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
};

function clearCanvas() { ctx.clearRect(0, 0, 300, 300); }

// Google TTS 核心
async function playGoogleTTS(text) {
    const apiKey = localStorage.getItem('google_tts_key') || prompt("請輸入 Google API Key:");
    localStorage.setItem('google_tts_key', apiKey);
    const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({input:{text}, voice:{languageCode:'en-US', name:'en-US-Wavenet-F'}, audioConfig:{audioEncoding:'MP3'}})
    });
    const data = await response.json();
    if(data.audioContent) {
        new Audio(`data:audio/mp3;base64,${data.audioContent}`).play();
        confetti();
    }
}

// 變身邏輯
function checkAndTransform() {
    canvas.style.transition = "all 0.5s";
    canvas.style.transform = "scale(1.5) rotate(10deg)";
    canvas.style.opacity = "0";
    setTimeout(() => {
        playGoogleTTS(wordsData[currentIndex].w);
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
