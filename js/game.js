// ==========================================
// 🎮 聽音大挑戰 (a, e, i) 遊戲模組 (精準無縫不截斷版)
// ==========================================

window.currentGameTarget = '';
window.currentWord = '';
window.currentEmoji = '';
window.lastWord = ''; 
window.currentChoices = {}; 
window.gameAudio = new Audio();
window.isGamePlaying = false;
window.isGameProcessing = false; 

// 🌟 異步音效防重疊 Token
window.gameAudioToken = 0;
window.uiAudioToken = 0;

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

// 🌟 全局強行停止所有音效 (並清除事件監聽)
window.stopAllAudio = function() {
    if (window.gameAudio) {
        window.gameAudio.pause();
        window.gameAudio.currentTime = 0;
        window.gameAudio.onended = null;
    }
    if (window.uiAudio) {
        window.uiAudio.pause();
        window.uiAudio.currentTime = 0;
        window.uiAudio.onended = null;
    }
    if (window.enAudio) {
        try { window.enAudio.pause(); window.enAudio.currentTime = 0; } catch (e) {}
    }
    if (window.mAudio) {
        window.mAudio.pause();
        window.mAudio.currentTime = 0;
    }
    if (window.speechSynthesis) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
    }
    window.gameAudioToken = 0;
    window.uiAudioToken = 0;
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
`;
document.head.appendChild(gameStyle);

// 🌟 核心升級：精準等待廣東話讀完先執行 Callback
window.playGameMessage = async function(text, callback) {
    if (window.stopAllAudio) window.stopAllAudio();

    let token = Date.now();
    window.uiAudioToken = token;

    if (window.playCantoneseTTS) {
        await window.playCantoneseTTS(text, { interrupt: true });
    } else if (window.speakCantoneseBrowser) {
        await window.speakCantoneseBrowser(text);
    }

    if (window.uiAudioToken === token && window.isGamePlaying && callback) {
        setTimeout(callback, 300);
    }
};

window.startGame = function() {
    if (window.stopAllAudio) window.stopAllAudio();

    const overlay = document.getElementById('game-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        overlay.classList.add('is-open');
    }

    window.isGamePlaying = true;
    window.isGameProcessing = false;
    window.lastWord = '';

    // 講完開場白自動出題
    window.playGameMessage("聽音大挑戰開始！打開對耳仔，聽下要搵咩圖案出嚟啦！", () => {
        window.nextGameQuestion();
    });
};

window.exitGame = function() {
    window.isGamePlaying = false;
    window.isGameProcessing = false;
    if (window.stopAllAudio) window.stopAllAudio();

    const overlay = document.getElementById('game-overlay');
    if (overlay) {
        overlay.style.display = 'none';
        overlay.classList.remove('is-open');
    }
    if (typeof window.backToHome === 'function') {
        window.backToHome();
        return;
    }
    const home = document.getElementById('home-menu');
    if (home) {
        home.style.display = 'block';
        home.classList.add('is-open');
    }
};

window.nextGameQuestion = function() {
    if(!window.isGamePlaying) return;
    
    const targets = ['A', 'E', 'I'];
    window.currentGameTarget = targets[Math.floor(Math.random() * targets.length)];
    
    window.currentChoices = {};
    targets.forEach(letter => {
        let wordList = gameWordBank[letter];
        let randomItem;
        if (letter === window.currentGameTarget) {
            do { randomItem = wordList[Math.floor(Math.random() * wordList.length)]; } 
            while (randomItem.w === window.lastWord && wordList.length > 1);
            window.currentWord = randomItem.w;
            window.lastWord = randomItem.w;
            window.currentEmoji = randomItem.e;
        } else {
            randomItem = wordList[Math.floor(Math.random() * wordList.length)];
        }
        window.currentChoices[letter] = randomItem;
    });
    
    document.getElementById('game-emoji-display').innerText = '❓';
    document.getElementById('game-msg').innerText = "👇 聽清楚喇，係邊個音？";
    document.getElementById('game-msg').style.color = "#1d3557";
    
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
        if(speaker) {
            speaker.style.transform = "scale(1.1)";
            setTimeout(() => speaker.style.transform = "scale(1)", 300);
        }
        playGameSound();
    }, 500);
};

window.playGameSound = async function() {
    if (window.stopAllAudio) window.stopAllAudio();

    let token = Date.now();
    window.gameAudioToken = token;

    const letterMap = { 'A': 'a', 'E': 'e', 'I': 'i' };
    const targetLetter = letterMap[window.currentGameTarget];
    const key = localStorage.getItem('google_tts_key');

    // Offline-friendly: browser English voice when no Google key
    if (!key) {
        if (window.speakEnglish) {
            window.speakEnglish(targetLetter + '. ' + window.currentWord, { rate: 0.8 });
        }
        return;
    }

    const ipaMap = { 'A': 'æ', 'E': 'ɛ', 'I': 'ɪ' };
    const targetIPA = ipaMap[window.currentGameTarget];

    const ssml = `<speak><prosody rate="0.8">
        <phoneme alphabet="ipa" ph="${targetIPA}">${targetLetter}</phoneme>
        <break time="0.5s"/>
        <phoneme alphabet="ipa" ph="${targetIPA}">${targetLetter}</phoneme>
        <break time="0.5s"/>
        ${window.currentWord}
    </prosody></speak>`;

    try {
        const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`, {
            method: 'POST',
            body: JSON.stringify({
                input: { ssml: ssml },
                voice: { languageCode: 'en-US', name: 'en-US-Wavenet-F' },
                audioConfig: { audioEncoding: 'MP3' }
            })
        });
        const data = await res.json();
        if (data.error) throw data.error;

        if (window.gameAudioToken !== token || !window.isGamePlaying) return;

        window.gameAudio.src = 'data:audio/mp3;base64,' + data.audioContent;
        window.gameAudio.play();
    } catch (e) {
        console.error('Game Audio Error', e);
        if (window.speakEnglish) {
            window.speakEnglish(targetLetter + '. ' + window.currentWord, { rate: 0.8 });
        } else {
            document.getElementById('game-msg').innerText = '❌ 語音系統錯誤';
        }
    }
};

window.checkAnswer = function(choice) {
    if(!window.isGamePlaying || window.isGameProcessing) return;
    
    // 一撳即刻打斷上一把聲
    if(window.stopAllAudio) window.stopAllAudio();
    
    const btn = document.getElementById(`btn-${choice}`);
    const ipaSymbolMap = { 'A': '/æ/', 'E': '/ɛ/', 'I': '/ɪ/' };
    const letterMap = { 'A': 'a', 'E': 'e', 'I': 'i' };
    
    if (choice === window.currentGameTarget) {
        window.isGameProcessing = true;

        if (typeof confetti !== 'undefined') confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });

        const correctPhrases = ['啱喇！', '無錯！', '正確！', '對喇！', '搵到喇！'];
        const randomPhrase = correctPhrases[Math.floor(Math.random() * correctPhrases.length)];

        document.getElementById('game-emoji-display').innerText = window.currentEmoji;
        document.getElementById('game-msg').innerText = `✨ ${randomPhrase}${window.currentWord} 係 ${ipaSymbolMap[choice]} 音！`;
        document.getElementById('game-msg').style.color = '#06d6a0';

        if (window.awardStars) {
            const choiceItem = window.currentChoices[choice] || {};
            window.awardStars(1, {
                word: window.currentWord,
                emoji: window.currentEmoji || choiceItem.e,
                letter: choice,
                reason: '聽音挑戰'
            });
        }

        window.playGameMessage(randomPhrase, async () => {
            if (window.speakEnglish) {
                await window.speakEnglish(window.currentWord, { rate: 0.88 });
            }
            window.isGameProcessing = false;
            window.nextGameQuestion();
        });

    } else {
        btn.classList.add('shake-anim');
        setTimeout(() => btn.classList.remove('shake-anim'), 400);
        
        let clickedWord = window.currentChoices[choice].w;
        document.getElementById('game-msg').innerText = `❌ 呢個係 ${clickedWord} (${ipaSymbolMap[choice]}) 喎，聽真啲！`;
        document.getElementById('game-msg').style.color = "#e63946";
        
        // Cantonese cue, then English word with English voice
        window.playGameMessage('唔係呢個，聽多次啦！', async () => {
            if (window.speakEnglish) {
                await window.speakEnglish(clickedWord, { rate: 0.88 });
            }
            if(window.isGamePlaying && !window.isGameProcessing) {
                setTimeout(() => {
                    if(window.isGamePlaying && !window.isGameProcessing) window.playGameSound();
                }, 400);
            }
        });
    }
};
