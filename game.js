// ==========================================
// 🎮 聽音大挑戰 (a, e, i) 遊戲模組 (終極隨機解謎版)
// ==========================================

window.currentGameTarget = '';
window.currentWord = '';
window.currentEmoji = '';
window.lastWord = ''; 
window.currentChoices = {}; // 🌟 新增：記住每次下面三個掣出咗咩字
window.gameAudio = new Audio();
window.isGamePlaying = false;
window.isGameProcessing = false; 

// 擴充字庫：a, e, i 各有 6 個精選代表字
const gameWordBank = {
    'A': [
        { w: 'ant', e: '🐜' }, { w: 'cat', e: '🐱' }, { w: 'bat', e: '🦇' },
        { w: 'hat', e: '🎩' }, { w: 'map', e: '🗺️' }, { w: 'pan', e: '🍳' }
    ],
    'E': [
        { w: 'egg', e: '🥚' }, { w: 'bed', e: '🛏️' }, { w: 'hen', e: '🐔' },
        { w: 'net', e: '🥅' }, { w: 'pen', e: '🖊️' }, { w: 'jet', e: '✈️' }
    ],
    'I': [
        { w: 'ink', e: '✒️' }, { w: 'pig', e: '🐷' }, { w: 'lip', e: '👄' },
        { w: 'six', e: '6️⃣' }, { w: 'zip', e: '🤐' }, { w: 'sit', e: '🪑' }
    ]
};

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
    .game-ans-btn { cursor: pointer; transition: transform 0.1s; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:10px 0; border:4px solid #fff; border-radius:20px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); width:100px; height:140px; font-size:40px; }
    .game-ans-btn:active { transform: scale(0.9); }
`;
document.head.appendChild(gameStyle);

window.startGame = function() {
    if(window.stopAllAudio) window.stopAllAudio();
    document.getElementById('start-overlay').style.display = 'none';
    document.getElementById('game-overlay').style.display = 'flex';
    window.isGamePlaying = true;
    window.isGameProcessing = false;
    window.lastWord = ''; 
    
    if(window.playCantoneseTTS) {
        window.playCantoneseTTS("聽音大挑戰開始！打開對耳仔，聽下要搵咩圖案出嚟啦！");
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
    
    // 🌟 核心升級：為 A, E, I 每個掣都隨機抽一個圖案
    window.currentChoices = {};
    targets.forEach(letter => {
        let wordList = gameWordBank[letter];
        let randomItem;
        if (letter === window.currentGameTarget) {
            // 正確答案：確保唔好同上一題重複
            do { randomItem = wordList[Math.floor(Math.random() * wordList.length)]; } 
            while (randomItem.w === window.lastWord && wordList.length > 1);
            window.currentWord = randomItem.w;
            window.lastWord = randomItem.w;
            window.currentEmoji = randomItem.e;
        } else {
            // 錯誤選項：隨便抽一個圖案做干擾
            randomItem = wordList[Math.floor(Math.random() * wordList.length)];
        }
        window.currentChoices[letter] = randomItem;
    });
    
    // 🌟 隱藏答案：出題時上面顯示問號，迫佢聽聲
    document.getElementById('game-emoji-display').innerText = '❓';
    document.getElementById('game-msg').innerText = "👇 聽清楚喇，係邊個音？";
    document.getElementById('game-msg').style.color = "#1d3557";
    
    // 🌟 動態更新三個掣嘅圖案
    const colors = { 'A': '#d90429', 'E': '#023e8a', 'I': '#4a4e69' };
    const ipas = { 'A': '/æ/', 'E': '/ɛ/', 'I': '/ɪ/' };
    
    targets.forEach(letter => {
        const btn = document.getElementById(`btn-${letter}`);
        if(btn) {
            btn.innerHTML = `
                <span style="font-size:45px; margin-bottom:5px;">${window.currentChoices[letter].e}</span>
                <span style="font-size:28px; color:${colors[letter]}; font-weight:bold;">${letter.toLowerCase()}</span>
                <span style="font-size:20px; color:${colors[letter]}; font-family:Arial;">${ipas[letter]}</span>
            `;
        }
    });
    
    setTimeout(() => {
        const speaker = document.getElementById('game-speaker');
        speaker.style.transform = "scale(1.1)";
        setTimeout(() => speaker.style.transform = "scale(1)", 300);
        playGameSound();
    }, 500);
};

window.playGameSound = async function() {
    if(window.stopAllAudio) window.stopAllAudio();
    
    let key = localStorage.getItem('google_tts_key');
    if(!key) { 
        alert("請先設定 Google TTS API Key"); 
        window.exitGame();
        return; 
    }
    
    const ipaMap = { 'A': 'æ', 'E': 'ɛ', 'I': 'ɪ' };
    const letterMap = { 'A': 'a', 'E': 'e', 'I': 'i' };
    
    const targetIPA = ipaMap[window.currentGameTarget];
    const targetLetter = letterMap[window.currentGameTarget];
    
    let ssml = `<speak><prosody rate="0.8">
        <phoneme alphabet="ipa" ph="${targetIPA}">${targetLetter}</phoneme> 
        <break time="0.5s"/> 
        <phoneme alphabet="ipa" ph="${targetIPA}">${targetLetter}</phoneme> 
        <break time="0.5s"/> 
        ${window.currentWord}
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
        
        // 🌟 答啱解鎖圖案：將問號變返做隻動物/物件！
        document.getElementById('game-emoji-display').innerText = window.currentEmoji;
        
        document.getElementById('game-msg').innerText = `✨ 叻仔！${window.currentWord} 係 ${ipaSymbolMap[choice]} 音！`;
        document.getElementById('game-msg').style.color = "#06d6a0";
        if(window.playCantoneseTTS) window.playCantoneseTTS("叻仔！");
        
        setTimeout(() => {
            window.isGameProcessing = false;
            window.nextGameQuestion();
        }, 1800);
        
    } else {
        btn.classList.add('shake-anim');
        setTimeout(() => btn.classList.remove('shake-anim'), 400);
        
        // 🌟 答錯即時糾正：話畀佢聽佢啱啱㩒咗咩字
        let clickedWord = window.currentChoices[choice].w;
        document.getElementById('game-msg').innerText = `❌ 呢個係 ${clickedWord} (${ipaSymbolMap[choice]}) 喎，聽真啲！`;
        document.getElementById('game-msg').style.color = "#e63946";
        
        if(window.playCantoneseTTS) {
            window.playCantoneseTTS(`呢個係 ${clickedWord}，係 ${letterMap[choice]} 嘅音。唔係呢個喎，聽多次啦！`);
        }
        
        setTimeout(() => {
            window.isGameProcessing = false;
            window.playGameSound();
        }, 3500);
    }
};
