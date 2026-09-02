// ==========================================
// Balloon shoot -- hear English, pop the matching balloon
// Timed, scored, uses SATIPN curriculum words + etymology.
// ==========================================

window.ShootGame = {
    active: false,
    phase: 'rules',
    clock: null,
    spawnTimer: null,
    TIME: 60,
    NEED: 6,
    timeLeft: 60,
    score: 0,
    combo: 0,
    got: 0,
    target: null,
    queue: [],
    collected: [],
    pending: false
};

function shEl(id) { return document.getElementById(id); }

function shootHud() {
    var g = window.ShootGame;
    var t = shEl('shoot-time');
    var s = shEl('shoot-score');
    var n = shEl('shoot-need');
    var tgt = shEl('shoot-target');
    var bar = shEl('shoot-time-fill');
    if (t) t.textContent = String(Math.max(0, Math.ceil(g.timeLeft)));
    if (s) s.textContent = String(g.score);
    if (n) n.textContent = g.got + ' / ' + g.NEED;
    if (bar) bar.style.width = Math.max(0, Math.min(100, (g.timeLeft / g.TIME) * 100)) + '%';
    if (tgt) {
        if (g.target) {
            var yue = Curriculum.yue(g.target.w);
            tgt.innerHTML = '射 <b>' + g.target.w + '</b>' + (yue ? '（' + yue + '）' : '');
        } else {
            tgt.textContent = '聽英文，射爆啱嘅氣球！';
        }
    }
}

function shootShow(panel) {
    ['shoot-rules', 'shoot-play', 'shoot-over'].forEach(function (id) {
        var el = shEl(id);
        if (!el) return;
        el.style.display = id === panel ? (id === 'shoot-play' ? 'flex' : 'block') : 'none';
    });
}

function shootAsk() {
    var g = window.ShootGame;
    g.target = g.queue[g.got];
    g.pending = false;
    shootHud();
    var field = shEl('shoot-field');
    if (field) field.innerHTML = '';
    if (!g.target) return;
    Curriculum.say('射 ' + g.target.w + ' 嗰個氣球！').then(function () {
        if (g.active && g.phase === 'play') return Curriculum.speakEn(g.target.w);
    });
}

function shootSpawn() {
    var g = window.ShootGame;
    var field = shEl('shoot-field');
    if (!field || !g.active || g.phase !== 'play' || !g.target || g.pending) return;
    if (field.querySelectorAll('.shoot-balloon').length >= 7) return;

    var item = Math.random() < 0.5
        ? g.target
        : (Curriculum.decoys(g.target, 1)[0] || g.target);
    var colors = ['#ff6b6b', '#4dabf7', '#845ef7', '#ffc93c', '#2ecc71'];
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'shoot-balloon';
    b.style.left = (8 + Math.random() * 70) + '%';
    b.style.background = colors[Math.floor(Math.random() * colors.length)];
    b.style.animationDuration = (4.0 + Math.random() * 2.2) + 's';
    b.dataset.word = item.w;
    b.setAttribute('aria-label', item.w);
    b.innerHTML = '<span class="shoot-balloon-emoji">' + item.emoji + '</span>' +
        '<span class="shoot-balloon-word">' + item.w + '</span>' +
        '<span class="shoot-balloon-letter">' + item.l + '</span>';
    b.onclick = function (ev) {
        ev.preventDefault();
        shootPop(b, item);
    };
    b.addEventListener('animationend', function () {
        if (b.parentNode) b.parentNode.removeChild(b);
    });
    field.appendChild(b);
}

function shootPop(el, item) {
    var g = window.ShootGame;
    if (!g.active || g.phase !== 'play' || g.pending || !g.target) return;
    if (el.classList.contains('is-pop')) return;
    el.classList.add('is-pop');
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 160);

    if (item.w === g.target.w) {
        g.combo += 1;
        g.got += 1;
        g.collected.push(g.target);
        var bonus = 90 + g.combo * 15 + Math.ceil(g.timeLeft / 2);
        g.score += bonus;
        g.pending = true;
        Curriculum.popBalloon(shEl('shoot-overlay'), bonus, g.combo);
        shootHud();
        Curriculum.award(0, {
            word: item.w,
            emoji: item.emoji,
            letter: item.l,
            reason: '射擊學到 ' + item.w
        });
        g.phase = 'teach';
        var field = shEl('shoot-field');
        if (field) field.innerHTML = '';
        Curriculum.say('射中 ' + item.w + '！').then(function () {
            return Curriculum.teach(item.w, 'shoot-coach');
        }).then(function () {
            if (!g.active) return;
            if (g.got >= g.NEED || g.timeLeft <= 0) {
                shootFinish(true);
                return;
            }
            g.phase = 'play';
            shootAsk();
        });
    } else {
        Curriculum.missFx(shEl('shoot-overlay'), '-4s');
        g.combo = 0;
        g.score = Math.max(0, g.score - 18);
        g.timeLeft = Math.max(0, g.timeLeft - 4);
        shootHud();
        Curriculum.say('唔係 ' + item.w + '。聽多次 ' + g.target.w).then(function () {
            if (g.active && g.target) return Curriculum.speakEn(g.target.w);
        });
    }
}

function shootTick() {
    var g = window.ShootGame;
    if (!g.active || g.phase !== 'play') return;
    g.timeLeft -= 0.25;
    shootHud();
    Curriculum.warnLowTime(g.timeLeft, shEl('shoot-overlay'));
    if (g.timeLeft <= 0) {
        g.timeLeft = 0;
        shootFinish(g.got > 0);
    }
}

function shootFinish(ok) {
    var g = window.ShootGame;
    g.phase = 'over';
    g.pending = false;
    if (g.clock) { clearInterval(g.clock); g.clock = null; }
    if (g.spawnTimer) { clearInterval(g.spawnTimer); g.spawnTimer = null; }
    var field = shEl('shoot-field');
    if (field) field.innerHTML = '';
    var stars = Curriculum.starsForScore(g.score, 550);
    Curriculum.award(stars, { reason: '完成音爆射擊', quest: 'listen' });
    if (window.markQuest) window.markQuest('listen');
    shootShow('shoot-over');
    var overlay = shEl('shoot-overlay');
    if (overlay) overlay.classList.remove('is-urgent');
    Curriculum.finishFx({
        emoji: '🎈',
        title: ok ? '射擊完成！' : '時間到！',
        sub: '分數 ' + g.score + ' · 射中 ' + g.got + ' 個',
        stars: stars
    });
    var title = shEl('shoot-over-title');
    var sub = shEl('shoot-over-sub');
    var list = shEl('shoot-over-words');
    if (title) title.textContent = ok ? '射擊完成！' : '時間到！';
    if (sub) sub.textContent = '分數 ' + g.score + ' · 射中 ' + g.got + ' 個 · +' + stars + '⭐';
    if (list) {
        list.innerHTML = g.collected.map(function (w) {
            return '<li><span>' + w.emoji + '</span> <b>' + w.w + '</b> ' + (Curriculum.yue(w.w) || '') + '</li>';
        }).join('') || '<li>今轉未射中，再聽英文試過！</li>';
    }
    Curriculum.say(ok ? '射擊完成！記住啲英文圖同字。' : '時間到！聽英文再射啱嗰個氣球。');
}

window.stopShootGame = function () {
    var g = window.ShootGame;
    g.active = false;
    g.phase = 'rules';
    g.pending = false;
    if (g.clock) { clearInterval(g.clock); g.clock = null; }
    if (g.spawnTimer) { clearInterval(g.spawnTimer); g.spawnTimer = null; }
    var field = shEl('shoot-field');
    if (field) field.innerHTML = '';
    var overlay = shEl('shoot-overlay');
    if (overlay) overlay.classList.remove('is-urgent', 'z-fx-shake');
    if (window.setDisplay) window.setDisplay('shoot-overlay', 'none');
};

window.startShootGame = function () {
    window.stopShootGame();
    window.currentMode = 'game';
    if (window.setDisplay) {
        window.setDisplay('home-menu', 'none');
        window.setDisplay('shoot-overlay', 'flex');
    }
    var g = window.ShootGame;
    g.active = true;
    g.phase = 'rules';
    g.score = 0;
    g.combo = 0;
    g.got = 0;
    g.collected = [];
    g.queue = Curriculum.pickLesson(g.NEED);
    g.target = null;
    Curriculum.bootFx();
    shootShow('shoot-rules');
    var group = shEl('shoot-group');
    if (group) group.textContent = Curriculum.groupName();
    Curriculum.say('音爆射擊。限時聽英文，射爆啱嗰個氣球。射錯會扣時間。');
};

window.beginShootPlay = function () {
    var g = window.ShootGame;
    g.phase = 'play';
    g.timeLeft = g.TIME;
    Curriculum.startFx();
    shootShow('shoot-play');
    shootHud();
    if (g.clock) clearInterval(g.clock);
    if (g.spawnTimer) clearInterval(g.spawnTimer);
    g.clock = setInterval(shootTick, 250);
    g.spawnTimer = setInterval(shootSpawn, 900);
    shootAsk();
};

window.replayShootWord = function () {
    var g = window.ShootGame;
    if (g.target) Curriculum.speakEn(g.target.w);
};

window.startGame = window.startShootGame;
window.exitGame = function () {
    window.stopShootGame();
    if (window.backToHome) window.backToHome();
};
