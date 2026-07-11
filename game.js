// ==========================================
// 🎮 聽音大挑戰 (a, e, i) 遊戲模組
// ==========================================

window.currentGameTarget = '';
window.gameAudio = new Audio();
window.isGamePlaying = false;

// 注入遊戲專用嘅 CSS 動畫
const gameStyle = document.createElement('style');
gameStyle.innerHTML = `
    @keyframes shake-wrong {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        50% { transform: translateX(10px); }
        75% { transform: translateX(-10px); }
    }
    .shake-anim { animation: shake-wrong 0.4s ease-in-out; }
    .game-ans-btn { cursor: pointer; transition: transform 0.1s; }
    .game-ans-btn:active { transform: scale(0.9); }
`;
document.head.appendChild(gameStyle);

window.startGame = function() {
    if(window.stopAllAudio) window.stopAllAudio();
    document.getElementById('start-overlay').style.display = 'none';
    document.getElementById('game-overlay').style.display = 'flex';
    window.isGamePlaying = true;
    
    if(window.playCantoneseTTS) {
        window.playCantoneseTTS("聽音大挑戰開始！聽清楚係咩音，然後揀啱嘅圖案啦！");
    }
    setTimeout(window.nextGameQuestion, 3500);
};

window.exitGame = function() {
    window.isGamePlaying = false;
    if(window.stopAllAudio) window.stopAllAudio();
    document.getElementById('game-overlay').style.display = 'none';
    document.getElementById('start-overlay').style.display = 'flex';
};

window.nextGameQuestion = function() {
    if(!window.isGamePlaying) return;
    
    // 隨機揀選 A, E, I 考孜孜
    const targets = ['A', 'E', 'I'];
    window.currentGameTarget = targets[Math.floor(Math.random() * targets.length)];
    
    document.getElementById('game-msg').innerText = "👇 聽清楚喇，係咩音？";
    document.getElementById('game-msg').style.color = "#1d3557";
    
    // 放大喇叭提佢聽
    const speaker = document.getElementById('game-speaker');
    speaker.style.transform = "scale(1.2)";
    setTimeout(() => speaker.style.transform = "scale(1)", 300);
    
    playGameSound();
};

window.playGameSound = async function() {
    if(window.stopAllAudio) window.stopAllAudio();
    
    let key = localStorage.getItem('google_tts_key');
    if(!key) { 
        alert("請先設定 Google TTS API Key"); 
        window.exitGame();
        return; 
    }
    
    // a, e, i 嘅精準 IPA 設定
    const ipaMap = { 'A': 'æ', 'E': 'ɛ', 'I': 'ɪ' };
    const charMap = { 'A': 'a', 'E': 'e', 'I': 'i' };
    const targetChar = charMap[window.currentGameTarget];
    const targetIPA = ipaMap[window.currentGameTarget];
    
    // SSML：純粹讀出兩次音標，中間停頓 0.6 秒
    let ssml = `<speak><prosody rate="0.75"><phoneme alphabet="ipa" ph="${targetIPA}">${targetChar}</phoneme> <break time="0.6s"/> <phoneme alphabet="ipa" ph="${targetIPA}">${targetChar}</phoneme></prosody></speak>`;

    try {
        let res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`, {
            method:'POST', body:JSON.stringify({
                input: { ssml: ssml },
                voice: { languageCode: 'en-US', name: 'en-US-Wavenet-F' },
                audioConfig: { audioEncoding: 'MP3' }
            })
        });
        let data = await res.json();
        if(data.error) throw data.error;
        window.gameAudio.src = 'data:audio/mp3;base64,' + data.audioContent;
        window.gameAudio.play();
    } catch(e) { 
        console.error("Game Audio Error", e); 
        document.getElementById('game-msg').innerText = "❌ 語音系統錯誤";
    }
};

window.checkAnswer = function(choice) {
    if(!window.isGamePlaying) return;
    
    const btn = document.getElementById(`btn-${choice}`);
    
    if (choice === window.currentGameTarget) {
        // 答啱：放紙炮 + 讚賞
        if(typeof confetti !== 'undefined') confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
        document.getElementById('game-msg').innerText = "✨ 好叻仔！答啱喇！";
        document.getElementById('game-msg').style.color = "#06d6a0";
        if(window.playCantoneseTTS) window.playCantoneseTTS("叻仔！答啱喇！");
        
        // 兩秒後自動出下一題
        setTimeout(window.nextGameQuestion, 2000);
    } else {
        // 答錯：按鈕震動 + 鼓勵
        btn.classList.add('shake-anim');
        setTimeout(() => btn.classList.remove('shake-anim'), 400);
        
        document.getElementById('game-msg').innerText = "❌ 唔係呢個喎，再聽真啲！";
        document.getElementById('game-msg').style.color = "#e63946";
        if(window.playCantoneseTTS) window.playCantoneseTTS("唔係呢個喎，試多次啦。");
        
        // 鼓勵完自動播多次音畀佢聽
        setTimeout(window.playGameSound, 1500);
    }
};
