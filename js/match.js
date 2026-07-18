// ==========================================
// Picture match — 8 questions + progress bar
// Short Cantonese cues; English words use English voice
// ==========================================

window.MATCH_TOTAL = 8;
window.isMatchPlaying = false;
window.isMatchProcessing = false;
window.matchTarget = null;
window.matchChoices = [];
window.matchRound = 0;
window.matchScore = 0;

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
    const baseLen = window._baseVocabLen != null ? window._baseVocabLen : D.length;
    return D.slice(0, baseLen).filter(function (d) { return d && d.w && d.emoji; });
}

function setMatchMsg(text, color) {
    const msg = document.getElementById('match-msg');
    if (!msg) return;
    msg.innerText = text;
    if (color) msg.style.color = color;
}

function updateMatchProgress() {
    const total = window.MATCH_TOTAL;
    const current = Math.min(window.matchRound, total);
    const roundEl = document.getElementById('match-round');
    const fill = document.getElementById('match-progress-fill');
    const label = document.getElementById('match-progress-label');
    if (roundEl) roundEl.innerText = '第 ' + current + ' / ' + total + ' 題';
    if (fill) fill.style.width = Math.round((current / total) * 100) + '%';
    if (label) label.innerText = current + ' / ' + total;
}


function setMatchPlayUi() {
    var speaker = document.getElementById('match-speaker');
    var finish = document.getElementById('match-finish');
    var choices = document.getElementById('match-choices');
    if (speaker) {
        speaker.classList.remove('is-hidden');
        speaker.style.display = '';
    }
    if (finish) {
        finish.style.display = 'none';
        finish.classList.remove('is-open');
    }
    if (choices) choices.style.display = '';
}

function setMatchFinishUi(score, total) {
    var speaker = document.getElementById('match-speaker');
    var finish = document.getElementById('match-finish');
    var choices = document.getElementById('match-choices');
    var emoji = document.getElementById('match-finish-emoji');
    var title = document.getElementById('match-finish-title');

    if (speaker) {
        speaker.classList.add('is-hidden');
        speaker.style.display = 'none';
    }
    if (choices) {
        choices.innerHTML = '';
        choices.style.display = 'none';
    }
    if (emoji) emoji.textContent = score >= total ? '🌟' : '🎉';
    if (title) {
        title.textContent = score >= total ? '全部答啱！超級叻仔！' : '做得好！繼續加油！';
    }
    if (finish) {
        finish.style.display = 'block';
        finish.classList.add('is-open');
    }
}

function celebrateMatchFinish(score, total) {
    if (typeof confetti === 'function') {
        confetti({ particleCount: 140, spread: 75, origin: { y: 0.65 } });
        setTimeout(function () {
            confetti({ particleCount: 90, spread: 60, origin: { y: 0.35 }, angle: 60 });
            confetti({ particleCount: 90, spread: 60, origin: { y: 0.35 }, angle: 120 });
        }, 220);
        if (score >= total) {
            setTimeout(function () {
                confetti({ particleCount: 120, startVelocity: 45, spread: 70, origin: { y: 0.7 } });
            }, 500);
        }
    }
    if (window.playSnd) {
        var notes = score >= total
            ? [523, 659, 784, 1046, 784, 1046]
            : [523, 659, 784, 988];
        notes.forEach(function (f, i) {
            setTimeout(function () { window.playSnd(f, 'triangle', 0.28); }, i * 110);
        });
    }
}

window.startMatchGame = async function () {
    if (window.stopAllAudio) window.stopAllAudio();
    window.isMatchPlaying = true;
    window.isMatchProcessing = false;
    window.matchRound = 0;
    window.matchScore = 0;

    const overlay = document.getElementById('match-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        overlay.classList.add('is-open');
    }

    setMatchPlayUi();
    updateMatchProgress();
    setMatchMsg('聽英文，揀啱嘅圖！', '#1d3557');
    if (window.playCantoneseTTS) {
        await window.playCantoneseTTS('聽英文，揀啱嘅圖！', { interrupt: true });
    }
    if (window.isMatchPlaying) window.nextMatchQuestion();
};

window.exitMatchGame = function () {
    window.isMatchPlaying = false;
    window.isMatchProcessing = false;
    setMatchPlayUi();
    const overlay = document.getElementById('match-overlay');
    if (overlay) {
        overlay.style.display = 'none';
        overlay.classList.remove('is-open');
    }
};

window.nextMatchQuestion = async function () {
    if (!window.isMatchPlaying) return;

    if (window.matchRound >= window.MATCH_TOTAL) {
        await window.finishMatchGame();
        return;
    }

    const pool = matchPool();
    if (pool.length < 3) {
        setMatchMsg('詞庫唔夠玩喎！', '#e63946');
        if (window.playCantoneseTTS) {
            await window.playCantoneseTTS('詞庫唔夠玩喎！', { interrupt: true });
        }
        return;
    }

    window.isMatchProcessing = false;
    window.matchRound += 1;
    updateMatchProgress();

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
    if (prompt) prompt.innerText = '❓';
    setMatchMsg('聽吓，揀圖！', '#1d3557');

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

    if (window.isMatchPlaying) await window.playMatchPrompt();
};

window.playMatchPrompt = async function () {
    if (!window.isMatchPlaying || !window.matchTarget) return;
    var speakerEl = document.getElementById('match-speaker');
    if (speakerEl && speakerEl.classList.contains('is-hidden')) return;
    const word = window.matchTarget.w;
    const sp = document.getElementById('match-speaker');
    if (sp) {
        sp.style.transform = 'scale(1.08)';
        setTimeout(function () { sp.style.transform = 'scale(1)'; }, 220);
    }
    if (window.speakEnglish) {
        await window.speakEnglish(word, { rate: 0.85 });
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
        window.matchScore += 1;
        if (prompt) prompt.innerText = window.matchTarget.emoji;
        setMatchMsg('啱喇！' + window.matchTarget.w.toUpperCase() + ' ' + window.matchTarget.emoji, '#06d6a0');
        if (window.ZiziFX) window.ZiziFX.play('correct');
        else if (window.playSnd) {
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
            await window.playCantoneseTTS('啱喇！', { interrupt: true });
        }
        if (window.speakEnglish) {
            await window.speakEnglish(window.matchTarget.w, { rate: 0.88 });
        }
        window.isMatchProcessing = false;
        if (window.isMatchPlaying) window.nextMatchQuestion();
    } else {
        setMatchMsg('再試吓！', '#e63946');
        if (window.ZiziFX) window.ZiziFX.play('wrong');
        else if (window.playSnd) window.playSnd(200, 'sawtooth', 0.15);
        const box = document.getElementById('match-choices');
        if (box) {
            box.classList.add('shake-anim');
            setTimeout(function () { box.classList.remove('shake-anim'); }, 400);
        }
        if (window.playCantoneseTTS) {
            await window.playCantoneseTTS('再試吓！', { interrupt: true });
        }
        window.isMatchProcessing = false;
        if (window.isMatchPlaying) await window.playMatchPrompt();
    }
};

window.finishMatchGame = async function () {
    const total = window.MATCH_TOTAL;
    const score = window.matchScore;
    window.isMatchPlaying = false;
    window.isMatchProcessing = false;
    window.matchTarget = null;

    updateMatchProgress();
    setMatchFinishUi(score, total);
    setMatchMsg('完成！答啱 ' + score + ' / ' + total + ' 題', '#06d6a0');

    celebrateMatchFinish(score, total);
    if (window.markQuest) window.markQuest('match');
    if (window.ZiziFX) window.ZiziFX.play('fanfare');

    var praise = score >= total
        ? '全部答啱！超級叻仔！'
        : '做得好！答啱 ' + score + ' 題，共 ' + total + ' 題！';

    if (window.ZiziFX && window.ZiziFX.celebrate) {
        window.ZiziFX.celebrate({
            emoji: score >= total ? '🏆' : '🎉',
            title: score >= total ? '全部答啱！' : '做得好！',
            sub: '答啱 ' + score + ' / ' + total + ' 題',
            stars: score >= total ? 2 : 0
        });
    }

    if (window.playCantoneseTTS) {
        await window.playCantoneseTTS(praise, { interrupt: true });
    }

    if (score >= total && window.awardStars) {
        window.awardStars(2, { reason: '全部答啱', quest: 'match' });
    } else if (window.awardStars) {
        window.awardStars(0, { quest: 'match' });
    }
    if (window.refreshHomeProgress) window.refreshHomeProgress();
};

