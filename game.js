// ==========================================
// 🎮 聽音大挑戰 (a, e, i) 遊戲模組 (代表字強化版)
// ==========================================

window.currentGameTarget = '';
window.gameAudio = new Audio();
window.isGamePlaying = false;
window.isGameProcessing = false; 

const originalStopAllAudio = window.stopAllAudio;
window.stopAllAudio = function() {
    if (originalStopAllAudio) originalStopAllAudio();
    if (window.gameAudio) { window.gameAudio.pause(); window.gameAudio.currentTime = 0; }
};

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
    window.isGameProcessing = false;
    
    if(window.playCantoneseTTS) {
        window.playCantoneseTTS("聽音大挑戰開始！睇下上面嘅音標，聽清楚係咩音啦！");
    }
    setTimeout(window.nextGameQuestion, 3500);
};

window.exitGame = function() {
    window.isGamePlaying = false;
    window.isGameProcessing = false;
    if(window.stopAllAudio) window.stopAllAudio();
    document.getElementById('game-overlay').style.display = 'none';
    document.getElementById('start-overlay').style.display = 'flex';
};

window.nextGameQuestion = function() {
    if(!window.isGamePlaying) return;
    
    const targets = ['A', 'E', 'I'];
    window.currentGameTarget = targets[Math.floor(Math.random() * targets.length)];
    
    document.getElementById('game-msg').innerText = "👇 聽清楚喇，係邊個音？";
    document.getElementById('game-msg').style.color = "#1d3557";
    
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
    
    // 🌟 新增：將純發音綁定代表字 (Anchor Word)
    const ipaMap = { 'A': 'æ', 'E': 'ɛ', 'I': 'ɪ' };
    const letterMap = { 'A': 'a', 'E': 'e', 'I': 'i' };
    const anchorMap = { 'A': 'ant', 'E': 'egg', 'I': 'ink' };
    
    const targetIPA = ipaMap[window.currentGameTarget];
    const targetLetter = letterMap[window.currentGameTarget];
    const targetWord = anchorMap[window.currentGameTarget];
    
    // 🌟 SSML 升級：讀兩次音標，然後讀出代表字 (例如： /æ/ ... /æ/ ... ant)
    let ssml = `<speak><prosody rate="0.8">
        <phoneme alphabet="ipa" ph="${targetIPA}">${targetLetter}</phoneme> 
        <break time="0.5s"/> 
        <phoneme alphabet="ipa" ph="${targetIPA}">${targetLetter}</phoneme> 
        <break time="0.5s"/> 
        ${targetWord}
    </prosody></speak>`;

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
    if(!window.isGamePlaying || window.isGameProcessing) return;
    window.isGameProcessing = true;
    
    const btn = document.getElementById(`btn-${choice}`);
    const ipaSymbolMap = { 'A': '/æ/', 'E': '/ɛ/', 'I': '/ɪ/' };
    const letterMap = { 'A': 'a', 'E': 'e', 'I': 'i' };
    
    if (choice === window.currentGameTarget) {
        if(typeof confetti !== 'undefined') confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
        document.getElementById('game-msg').innerText = `✨ 叻仔！係 ${ipaSymbolMap[choice]} 音！`;
        document.getElementById('game-msg').style.color = "#06d6a0";
        if(window.playCantoneseTTS) window.playCantoneseTTS("叻仔！答啱喇！");
        
        setTimeout(() => {
            window.isGameProcessing = false;
            window.nextGameQuestion();
        }, 2500);
        
    } else {
        btn.classList.add('shake-anim');
        setTimeout(() => btn.classList.remove('shake-anim'), 400);
        
        document.getElementById('game-msg').innerText = `❌ 呢個係 ${ipaSymbolMap[choice]} 喎，聽真啲！`;
        document.getElementById('game-msg').style.color = "#e63946";
        
        if(window.playCantoneseTTS) {
            window.playCantoneseTTS(`呢個係 ${letterMap[choice]} 嘅音，唔係呢個喎。聽多次啦！`);
        }
        
        setTimeout(() => {
            window.isGameProcessing = false;
            window.playGameSound();
        }, 3000);
    }
};
