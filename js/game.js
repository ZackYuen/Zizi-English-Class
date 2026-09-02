// ==========================================
// 🎈 音爆射擊 — hear /æ/ /ɛ/ /ɪ/, pop the matching balloons
// Keeps Chirp3 speech + daily listen quest from the live app.
// ==========================================

window.currentGameTarget = '';
window.currentWord = '';
window.currentEmoji = '';
window.lastWord = '';
window.currentChoices = {};
window.gameAudio = new Audio();
window.isGamePlaying = false;
window.isGameProcessing = false;
window.gameScore = 0;
window.gameStreak = 0;
window.gameAudioToken = 0;
window.uiAudioToken = 0;
window.shootScore = 0;
window.shootLives = 3;
window.shootNeed = 0;
window.shootTimer = null;

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

window.stopAllAudio = function () {
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
        try { window.enAudio.pause(); window.enAudio.currentTime = 0; } catch (e) { /* ignore */ }
    }
    if (window.mAudio) {
        window.mAudio.pause();
        window.mAudio.currentTime = 0;
    }
    if (window.speechSynthesis) {
        try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    }
    window.gameAudioToken = 0;
    window.uiAudioToken = 0;
    if (window.stopSpeech) window.stopSpeech();
};

window.stopShootGame = function () {
    window.isGamePlaying = false;
    window.isGameProcessing = false;
    if (window.shootTimer) {
        clearInterval(window.shootTimer);
        window.shootTimer = null;
    }
    var field = document.getElementById('shoot-field');
    if (field) field.innerHTML = '';
};

window.playGameMessage = async function (text, callback) {
    if (window.stopAllAudio) window.stopAllAudio();

    var token = Date.now();
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

function updateShootHud() {
    var s = document.getElementById('shoot-score');
    var l = document.getElementById('shoot-lives');
    var n = document.getElementById('shoot-need');
    if (s) s.textContent = String(window.shootScore);
    if (l) l.textContent = '❤️'.repeat(Math.max(0, window.shootLives)) || '💔';
    if (n) n.textContent = String(window.shootNeed);
    window.gameScore = window.shootScore;
    var gs = document.getElementById('game-score');
    var gst = document.getElementById('game-streak');
    if (gs) gs.textContent = String(window.shootScore);
    if (gst) gst.textContent = String(window.gameStreak || 0);
}

window.startGame = function () {
    if (window.stopAllAudio) window.stopAllAudio();
    window.stopShootGame();

    var overlay = document.getElementById('game-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        overlay.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');
    }

    window.isGamePlaying = true;
    window.isGameProcessing = false;
    window.lastWord = '';
    window.shootScore = 0;
    window.shootLives = 3;
    window.gameStreak = 0;
    updateShootHud();
    if (window.ZiziFX) window.ZiziFX.play('whoosh');

    window.playGameMessage('音爆射擊開始！聽個音，射爆啱嗰個氣球！', function () {
        window.nextGameQuestion();
    });
};

window.exitGame = function () {
    window.stopShootGame();
    if (window.stopAllAudio) window.stopAllAudio();
    if (window.ZiziTeach) {
        window.ZiziTeach.reset();
        window.ZiziTeach.hideCoach(document.getElementById('game-coach'));
    }
    if (typeof window.backToHome === 'function') {
        window.backToHome();
    }
};

window.nextGameQuestion = function () {
    if (!window.isGamePlaying) return;
    var field = document.getElementById('shoot-field');
    if (field) field.innerHTML = '';

    var targets = ['A', 'E', 'I'];
    window.currentGameTarget = targets[Math.floor(Math.random() * targets.length)];
    window.currentChoices = {};
    targets.forEach(function (letter) {
        var wordList = gameWordBank[letter];
        var randomItem;
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

    window.shootNeed = 3;
    window.isGameProcessing = false;
    updateShootHud();

    var msg = document.getElementById('game-msg');
    if (msg) {
        msg.innerText = '聽清楚，射 ' + window.currentGameTarget.toLowerCase() + ' 氣球！';
        msg.style.color = '#1d3557';
    }
    var emojiEl = document.getElementById('game-emoji-display');
    if (emojiEl) emojiEl.innerText = '❓';
    if (window.ZiziTeach) {
        window.ZiziTeach.reset();
        window.ZiziTeach.hideCoach(document.getElementById('game-coach'));
    }

    if (window.shootTimer) clearInterval(window.shootTimer);
    window.spawnBalloon();
    window.shootTimer = setInterval(function () {
        if (window.isGamePlaying && !window.isGameProcessing) window.spawnBalloon();
    }, 1100);

    setTimeout(function () {
        if (window.isGamePlaying) window.playGameSound();
    }, 400);
};

window.spawnBalloon = function () {
    var field = document.getElementById('shoot-field');
    if (!field || !window.isGamePlaying) return;
    if (field.querySelectorAll('.balloon').length >= 7) return;

    var letters = ['A', 'E', 'I'];
    var letter = Math.random() < 0.55 ? window.currentGameTarget : letters[Math.floor(Math.random() * 3)];
    var item = window.currentChoices[letter] || gameWordBank[letter][0];
    var colors = { A: '#ff6b6b', E: '#4dabf7', I: '#845ef7' };
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'balloon';
    b.style.left = (8 + Math.random() * 72) + '%';
    b.style.background = colors[letter];
    b.style.animationDuration = (4.2 + Math.random() * 2.4) + 's';
    b.dataset.letter = letter;
    b.setAttribute('aria-label', letter.toLowerCase() + ' 氣球');
    b.innerHTML = '<span class="balloon-emoji">' + item.e + '</span><span class="balloon-letter">' + letter.toLowerCase() + '</span>';
    b.onclick = function (ev) {
        ev.preventDefault();
        window.shootBalloon(b, letter);
    };
    b.addEventListener('animationend', function () {
        if (b.parentNode) b.parentNode.removeChild(b);
    });
    field.appendChild(b);
};

window.shootBalloon = function (el, letter) {
    if (!window.isGamePlaying || window.isGameProcessing) return;
    if (el.classList.contains('is-pop')) return;
    el.classList.add('is-pop');

    if (letter === window.currentGameTarget) {
        if (window.Arcade) window.Arcade.pop();
        else if (window.ZiziFX) window.ZiziFX.play('correct');
        window.shootNeed = Math.max(0, window.shootNeed - 1);
        window.shootScore += 1;
        window.gameStreak = (window.gameStreak || 0) + 1;
        updateShootHud();

        if (window.shootNeed <= 0) {
            window.isGameProcessing = true;
            if (window.shootTimer) {
                clearInterval(window.shootTimer);
                window.shootTimer = null;
            }
            var emojiEl = document.getElementById('game-emoji-display');
            if (emojiEl) emojiEl.innerText = window.currentEmoji;
            var msg = document.getElementById('game-msg');
            if (msg) {
                msg.innerText = '💥 啱喇！' + window.currentWord + '！';
                msg.style.color = '#06d6a0';
            }
            if (typeof confetti === 'function') confetti({ particleCount: 100, spread: 70, origin: { y: 0.55 } });
            if (window.awardStars) {
                window.awardStars(1, {
                    word: window.currentWord,
                    emoji: window.currentEmoji,
                    letter: window.currentGameTarget,
                    reason: '音爆射擊',
                    quest: 'listen'
                });
            }
            if (window.markQuest) window.markQuest('listen');

            window.playGameMessage('啱喇！' + window.currentWord, async function () {
                if (window.speakEnglish) {
                    await window.speakEnglish(window.currentWord, { rate: 0.88 });
                }
                if (window.ZiziTeach && window.ZiziTeach.showWordStory) {
                    await window.ZiziTeach.showWordStory(window.currentWord, 'game-coach');
                }
                window.isGameProcessing = false;
                if (window.isGamePlaying) window.nextGameQuestion();
            });
        }
    } else {
        if (window.Arcade) window.Arcade.boom();
        else if (window.ZiziFX) window.ZiziFX.play('wrong');
        window.shootLives -= 1;
        window.gameStreak = 0;
        updateShootHud();
        var wrong = window.currentChoices[letter];
        var msg = document.getElementById('game-msg');
        if (msg) {
            msg.innerText = '唔係呢個！呢個係 ' + (wrong && wrong.w) + '。';
            msg.style.color = '#e63946';
        }
        if (window.ZiziTeach) window.ZiziTeach.bump();
        if (window.shootLives <= 0) {
            window.isGameProcessing = true;
            if (window.shootTimer) {
                clearInterval(window.shootTimer);
                window.shootTimer = null;
            }
            window.playGameMessage('冇命喇！再嚟過！', function () {
                window.shootLives = 3;
                window.shootScore = 0;
                window.gameStreak = 0;
                window.isGameProcessing = false;
                if (window.isGamePlaying) window.nextGameQuestion();
            });
        }
    }
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 180);
};

window.playGameSound = async function () {
    if (window.stopAllAudio) window.stopAllAudio();

    var token = Date.now();
    window.gameAudioToken = token;

    var letterMap = { A: 'a', E: 'e', I: 'i' };
    var targetLetter = letterMap[window.currentGameTarget];
    var key = window.getApiKey ? window.getApiKey('google_tts_key') : localStorage.getItem('google_tts_key');

    if (!key) {
        if (window.speakEnglish) {
            window.speakEnglish(targetLetter + '. ' + window.currentWord, { rate: 0.8 });
        }
        return;
    }

    var ipaMap = { A: 'æ', E: 'ɛ', I: 'ɪ' };
    var targetIPA = ipaMap[window.currentGameTarget];
    var ssml = '<speak><prosody rate="0.8">' +
        '<phoneme alphabet="ipa" ph="' + targetIPA + '">' + targetLetter + '</phoneme>' +
        '<break time="0.5s"/>' +
        '<phoneme alphabet="ipa" ph="' + targetIPA + '">' + targetLetter + '</phoneme>' +
        '<break time="0.5s"/>' +
        window.currentWord +
        '</prosody></speak>';

    try {
        if (window.googleTtsFetch) {
            var url = await window.googleTtsFetch({
                ssml: ssml,
                lang: 'en-US',
                rate: 0.8
            });
            if (window.gameAudioToken !== token || !window.isGamePlaying) return;
            window.gameAudio.src = url;
            window.gameAudio.play();
            return;
        }
        var res = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize?key=' + key, {
            method: 'POST',
            body: JSON.stringify({
                input: { ssml: ssml },
                voice: { languageCode: 'en-US', name: 'en-US-Neural2-C' },
                audioConfig: { audioEncoding: 'MP3', speakingRate: 0.8 }
            })
        });
        var data = await res.json();
        if (data.error) throw data.error;
        if (window.gameAudioToken !== token || !window.isGamePlaying) return;
        window.gameAudio.src = 'data:audio/mp3;base64,' + data.audioContent;
        window.gameAudio.play();
    } catch (e) {
        console.error('Game Audio Error', e);
        if (window.speakEnglish) {
            window.speakEnglish(targetLetter + '. ' + window.currentWord, { rate: 0.8 });
        } else {
            var msg = document.getElementById('game-msg');
            if (msg) msg.innerText = '❌ 語音系統錯誤';
        }
    }
};

// Kept so leftover HTML / hint callers do not crash
window.checkAnswer = function () {};
