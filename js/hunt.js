// ==========================================
// 🖼️ 尋寶圖 — 3x3 grid, every picture stays on screen
// Hear English, tap the matching cell.
// ==========================================

window.HuntGame = {
    active: false,
    phase: 'play',
    clock: null,
    TIME: 55,
    NEED: 5,
    timeLeft: 60,
    score: 0,
    combo: 0,
    got: 0,
    misses: 0,
    scene: [],
    target: null,
    queue: [],
    found: []
};

function huntEl(id) { return document.getElementById(id); }

function huntHud() {
    var g = window.HuntGame;
    var t = huntEl('hunt-time');
    var s = huntEl('hunt-score');
    var n = huntEl('hunt-need');
    var tgt = huntEl('hunt-target');
    if (t) t.textContent = String(Math.max(0, Math.ceil(g.timeLeft)));
    if (s) s.textContent = String(g.score);
    if (n) n.textContent = g.got + '/' + g.NEED;
    if (tgt) {
        if (g.target) {
            tgt.textContent = '揭開草叢搵 ' + g.target.w +
                (Curriculum.yue(g.target.w) ? '（' + Curriculum.yue(g.target.w) + '）' : '');
        } else {
            tgt.textContent = '揭開草叢，搵啱嗰樣';
        }
    }
}

function huntShowOver(on) {
    var el = huntEl('hunt-over');
    if (!el) return;
    el.style.display = on ? 'flex' : 'none';
    el.classList.toggle('is-open', on);
}

function huntPaintScene() {
    var g = window.HuntGame;
    var scene = huntEl('hunt-scene');
    if (!scene) return;
    scene.innerHTML = '';
    var props = ['🌳', '🪨', '📦', '🚗', '🏠', '🌲'];
    g.scene.forEach(function (item, i) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'hunt-item' + (g.found.indexOf(item.w) !== -1 ? ' is-found' : '');
        btn.dataset.word = item.w;
        btn.setAttribute('aria-label', item.w);
        btn.innerHTML = '<span class="hunt-prop">' + props[i % props.length] + '</span>' +
            '<canvas class="hunt-art"></canvas>';
        btn.onclick = function () { huntTap(item, btn); };
        scene.appendChild(btn);
        var art = btn.querySelector('.hunt-art');
        if (art && window.ZiziArt) {
            var cs = Math.max(48, Math.floor(btn.clientHeight * 0.62));
            art.width = cs * 2;
            art.height = cs * 2;
            var ac = art.getContext('2d');
            ac.scale(2, 2);
            window.ZiziArt.drawWord(ac, item.w, cs / 2, cs / 2, cs);
        }
    });
}

function huntAsk() {
    var g = window.HuntGame;
    g.target = g.queue[g.got];
    g.misses = 0;
    huntHud();
    document.querySelectorAll('.hunt-item.is-hint').forEach(function (el) {
        el.classList.remove('is-hint');
    });
    if (!g.target) return;
    Curriculum.say('邊啲草叢後面係 ' + g.target.w + '？').then(function () {
        if (g.active && g.phase === 'play') return Curriculum.speakEn(g.target.w);
    });
}

function huntTap(item, btn) {
    var g = window.HuntGame;
    if (!g.active || g.phase !== 'play' || !g.target) return;
    if (g.found.indexOf(item.w) !== -1) return;
    if (item.w === g.target.w) {
        g.combo += 1;
        g.got += 1;
        g.found.push(item.w);
        var bonus = 80 + g.combo * 15 + Math.ceil(g.timeLeft / 2);
        g.score += bonus;
        btn.classList.add('is-found');
        Curriculum.hitFx(huntEl('hunt-overlay'), bonus, g.combo);
        huntHud();
        Curriculum.award(0, {
            word: item.w,
            emoji: item.emoji,
            letter: item.l,
            reason: '尋寶學到 ' + item.w
        });
        g.phase = 'teach';
        var yue = Curriculum.yue(item.w);
        Curriculum.say('搵到 ' + item.w + (yue ? '，即係 ' + yue : '')).then(function () {
            return Curriculum.cheer(item.w, 'hunt-coach');
        }).then(function () {
            if (!g.active) return;
            if (g.got >= g.NEED || g.timeLeft <= 0) {
                huntFinish(true);
                return;
            }
            g.phase = 'play';
            huntAsk();
        });
    } else {
        Curriculum.missFx(huntEl('hunt-overlay'), '-4s');
        g.combo = 0;
        g.misses += 1;
        g.score = Math.max(0, g.score - 15);
        g.timeLeft = Math.max(0, g.timeLeft - 4);
        huntHud();
        btn.classList.add('is-wrong');
        setTimeout(function () { btn.classList.remove('is-wrong'); }, 280);
        if (g.misses >= 2) {
            var right = document.querySelector('.hunt-item[data-word="' + g.target.w + '"]');
            if (right) right.classList.add('is-hint');
        }
        Curriculum.say('唔係 ' + item.w + '。聽多次。').then(function () {
            if (g.active && g.target) return Curriculum.speakEn(g.target.w);
        });
    }
}

function huntTick() {
    var g = window.HuntGame;
    if (!g.active || g.phase !== 'play') return;
    g.timeLeft -= 0.25;
    huntHud();
    Curriculum.warnLowTime(g.timeLeft, huntEl('hunt-overlay'));
    if (g.timeLeft <= 0) {
        g.timeLeft = 0;
        huntFinish(g.got > 0);
    }
}

function huntFinish(ok) {
    var g = window.HuntGame;
    g.phase = 'over';
    if (g.clock) { clearInterval(g.clock); g.clock = null; }
    var stars = Curriculum.starsForScore(g.score, 500);
    Curriculum.award(stars, { reason: '完成尋寶圖', quest: 'match' });
    if (window.markQuest) window.markQuest('match');
    huntShowOver(true);
    var overlay = huntEl('hunt-overlay');
    if (overlay) overlay.classList.remove('is-urgent');
    Curriculum.finishFx({
        emoji: '🖼️',
        title: ok ? '尋寶成功！' : '時間到！',
        sub: '分數 ' + g.score + ' · 搵到 ' + g.got + ' 樣',
        stars: stars
    });
    var title = huntEl('hunt-over-title');
    var sub = huntEl('hunt-over-sub');
    var list = huntEl('hunt-over-words');
    var learned = g.queue.slice(0, g.got);
    if (title) title.textContent = ok ? '尋寶成功！' : '時間到！';
    if (sub) sub.textContent = '分數 ' + g.score + ' · 搵到 ' + g.got + ' 樣 · +' + stars + '⭐';
    if (list) {
        list.innerHTML = learned.map(function (w) {
            return '<li><span>' + w.emoji + '</span> <b>' + w.w + '</b> ' + (Curriculum.yue(w.w) || '') + '</li>';
        }).join('') || '<li>今轉未搵到，再聽英文試過！</li>';
    }
    Curriculum.say(ok ? '尋寶成功！記住啲英文圖同字。' : '時間到！聽英文再撳啱嗰格。');
}

window.stopHuntGame = function () {
    var g = window.HuntGame;
    g.active = false;
    g.phase = 'play';
    if (g.clock) { clearInterval(g.clock); g.clock = null; }
    huntShowOver(false);
    var overlay = huntEl('hunt-overlay');
    if (overlay) overlay.classList.remove('is-urgent', 'z-fx-shake');
    if (window.setDisplay) window.setDisplay('hunt-overlay', 'none');
};

window.startPictureHunt = function () {
    window.stopHuntGame();
    window.currentMode = 'match';
    if (window.setDisplay) {
        window.setDisplay('home-menu', 'none');
        window.setDisplay('hunt-overlay', 'flex');
    }
    var g = window.HuntGame;
    g.active = true;
    g.score = 0;
    g.combo = 0;
    g.got = 0;
    g.found = [];
    g.queue = Curriculum.pickLesson(g.NEED);
    var extras = Curriculum.decoys(g.queue[0], 4);
    g.scene = Curriculum.shuffle(g.queue.concat(extras)).slice(0, 6);
    Curriculum.bootFx();
    huntShowOver(false);
    window.beginHuntPlay();
};

window.beginHuntPlay = function () {
    var g = window.HuntGame;
    g.phase = 'play';
    g.timeLeft = g.TIME;
    Curriculum.startFx();
    huntPaintScene();
    huntHud();
    if (g.clock) clearInterval(g.clock);
    g.clock = setInterval(huntTick, 250);
    huntAsk();
};

window.replayHuntWord = function () {
    var g = window.HuntGame;
    if (g.target) Curriculum.speakEn(g.target.w);
};

window.startMatchGame = window.startPictureHunt;
window.exitMatchGame = window.stopHuntGame;
window.isMatchPlaying = false;
