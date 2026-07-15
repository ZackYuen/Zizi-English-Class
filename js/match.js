// ==========================================
// Picture match — offline for ages ~5
// All Cantonese instructions are spoken aloud
// ==========================================

window.isMatchPlaying = false;
window.isMatchProcessing = false;
window.matchTarget = null;
window.matchChoices = [];
window.matchRound = 0;

function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
}

function matchPool() {
    if (typeof D === 'undefined' || !D.length) return [];
    return D.filter(function (d) { return d && d.w && d.emoji; });
}

function setMatchMsg(text, color) {
    const msg = document.getElementById('match-msg');
    if (!msg) return;
    msg.innerText = text;
    if (color) msg.style.color = color;
}

window.startMatchGame = async function () {
    if (window.stopAllAudio) window.stopAllAudio();
    window.isMatchPlaying = true;
    window.isMatchProcessing = false;
    window.matchRound = 0;

    const overlay = document.getElementById('match-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        overlay.classList.add('is-open');
    }

    const intro = '睇圖識字開始！聽英文，再撳啱嘅圖案啦！';
    setMatchMsg(intro, '#1d3557');
    if (window.playCantoneseTTS) {
        await window.playCantoneseTTS(intro, { interrupt: true });
    }
    if (window.isMatchPlaying) window.nextMatchQuestion();
};

window.exitMatchGame = function () {
    window.isMatchPlaying = false;
    window.isMatchProcessing = false;
    const overlay = document.getElementById('match-overlay');
    if (overlay) {
        overlay.style.display = 'none';
        overlay.classList.remove('is-open');
    }
};

window.nextMatchQuestion = async function () {
    if (!window.isMatchPlaying) return;
    const pool = matchPool();
    if (pool.length < 3) {
        setMatchMsg('詞庫唔夠玩喎！', '#e63946');
        if (window.announce) window.announce('詞庫唔夠玩喎！', { force: true });
        return;
    }

    window.isMatchProcessing = false;
    window.matchRound += 1;

    let target;
    let tries = 0;
    do {
        target = pool[Math.floor(Math.random() * pool.length)];
        tries++;
    } while (window.matchTarget && target.w === window.matchTarget.w && tries < 8);

    window.matchTarget = target;

    const others = shuffle(pool.filter(function (d) { return d.w !== target.w; })).slice(0, 2);
    window.matchChoices = shuffle([target].concat(others));

    const prompt = document.getElementById('match-prompt-emoji');
    const roundEl = document.getElementById('match-round');
    if (prompt) prompt.innerText = '❓';
    if (roundEl) roundEl.innerText = '第 ' + window.matchRound + ' 題';

    const instruct = '第' + window.matchRound + '題。撳藍色喇叭聽英文，再揀啱嘅圖案！';
    setMatchMsg(instruct, '#1d3557');

    const box = document.getElementById('match-choices');
    if (box) {
        box.innerHTML = '';
        window.matchChoices.forEach(function (item) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'match-choice-btn';
            btn.setAttribute('aria-label', item.w);
            btn.innerHTML =
                '<span class="match-choice-emoji">' + item.emoji + '</span>' +
                '<span class="match-choice-letter">' + (item.l || '') + '</span>';
            btn.onclick = function () { window.checkMatchAnswer(item.w); };
            box.appendChild(btn);
        });
    }

    if (window.playCantoneseTTS) {
        await window.playCantoneseTTS(instruct, { interrupt: true });
    }
    if (window.isMatchPlaying) window.playMatchPrompt();
};

window.playMatchPrompt = function () {
    if (!window.matchTarget) return;
    const word = window.matchTarget.w;
    const sp = document.getElementById('match-speaker');
    if (sp) {
        sp.style.transform = 'scale(1.08)';
        setTimeout(function () { sp.style.transform = 'scale(1)'; }, 220);
    }
    if (window.speakEnglish) {
        window.speakEnglish(word, { rate: 0.85 });
    } else if (window.playSnd) {
        window.playSnd(660, 'sine', 0.2);
    }
};

window.checkMatchAnswer = async function (choiceWord) {
    if (!window.isMatchPlaying || window.isMatchProcessing || !window.matchTarget) return;
    window.isMatchProcessing = true;

    const prompt = document.getElementById('match-prompt-emoji');
    const correct = choiceWord === window.matchTarget.w;

    if (correct) {
        if (prompt) prompt.innerText = window.matchTarget.emoji;
        const praise = '啱喇！叻仔！係 ' + window.matchTarget.w + '！';
        setMatchMsg('啱喇！' + window.matchTarget.w.toUpperCase() + ' ' + window.matchTarget.emoji, '#06d6a0');
        if (window.playSnd) {
            [523, 659, 784].forEach(function (f, i) {
                setTimeout(function () { window.playSnd(f, 'triangle', 0.25); }, i * 90);
            });
        }
        if (window.awardStars) {
            window.awardStars(1, {
                word: window.matchTarget.w,
                emoji: window.matchTarget.emoji,
                letter: window.matchTarget.l,
                reason: '睇圖識字'
            });
        }
        if (window.playCantoneseTTS) {
            await window.playCantoneseTTS(praise, { interrupt: true });
        } else if (window.speakEnglish) {
            window.speakEnglish(window.matchTarget.w);
        }
        window.isMatchProcessing = false;
        if (window.isMatchPlaying) window.nextMatchQuestion();
    } else {
        setMatchMsg('唔係呢個呀，再試吓！聽多次英文啦～', '#e63946');
        if (window.playSnd) window.playSnd(200, 'sawtooth', 0.15);
        const box = document.getElementById('match-choices');
        if (box) {
            box.classList.add('shake-anim');
            setTimeout(function () { box.classList.remove('shake-anim'); }, 400);
        }
        if (window.playCantoneseTTS) {
            await window.playCantoneseTTS('唔係呢個呀，再試吓！聽多次英文啦！', { interrupt: true });
        }
        window.isMatchProcessing = false;
        if (window.isMatchPlaying) window.playMatchPrompt();
    }
};
