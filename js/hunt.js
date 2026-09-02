// ==========================================
// 🖼️ 尋寶圖 — timed picture hunt on a busy scene
// Hear English, tap the matching picture. Combo + clock.
// ==========================================

window.HuntGame = {
    active: false,
    phase: 'rules',
    clock: null,
    TIME: 70,
    NEED: 8,
    timeLeft: 70,
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
    var bar = huntEl('hunt-time-fill');
    if (t) t.textContent = String(Math.max(0, Math.ceil(g.timeLeft)));
    if (s) s.textContent = String(g.score);
    if (n) n.textContent = g.got + ' / ' + g.NEED;
    if (bar) bar.style.width = Math.max(0, Math.min(100, (g.timeLeft / g.TIME) * 100)) + '%';
    if (tgt) {
        if (g.target) {
            tgt.innerHTML = '搵 <b>' + g.target.w + '</b>' +
                (Curriculum.yue(g.target.w) ? '（' + Curriculum.yue(g.target.w) + '）' : '');
        } else {
            tgt.textContent = '聽英文，喺圖入面搵佢！';
        }
    }
}

function huntShow(panel) {
    ['hunt-rules', 'hunt-play', 'hunt-over'].forEach(function (id) {
        var el = huntEl(id);
        if (!el) return;
        el.style.display = id === panel ? (id === 'hunt-play' ? 'flex' : 'block') : 'none';
    });
}

function huntLayout(items) {
    var spots = [];
    var guard = 0;
    items.forEach(function () {
        var placed = false;
        while (!placed && guard < 200) {
            guard++;
            var x = 6 + Math.random() * 76;
            var y = 8 + Math.random() * 68;
            var ok = spots.every(function (s) {
                return Math.hypot(s.x - x, s.y - y) > 16;
            });
            if (ok) {
                spots.push({ x: x, y: y });
                placed = true;
            }
        }
        if (!placed) spots.push({ x: 10 + spots.length * 12, y: 20 + (spots.length % 3) * 22 });
    });
    return spots;
}

function huntPaintScene() {
    var g = window.HuntGame;
    var scene = huntEl('hunt-scene');
    if (!scene) return;
    scene.innerHTML = '';
    var spots = huntLayout(g.scene);
    g.scene.forEach(function (item, i) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'hunt-item' + (g.found.indexOf(item.w) !== -1 ? ' is-found' : '');
        btn.style.left = spots[i].x + '%';
        btn.style.top = spots[i].y + '%';
        btn.dataset.word = item.w;
        btn.setAttribute('aria-label', item.w);
        btn.innerHTML = '<span class="hunt-emoji">' + item.emoji + '</span>';
        btn.onclick = function () { huntTap(item, btn); };
        scene.appendChild(btn);
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
    Curriculum.say('圖入面邊個係 ' + g.target.w + '？').then(function () {
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
            return Curriculum.teach(item.w, 'hunt-coach');
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
    var stars = Curriculum.starsForScore(g.score, 600);
    Curriculum.award(stars, { reason: '完成尋寶圖', quest: 'match' });
    if (window.markQuest) window.markQuest('match');
    huntShow('hunt-over');
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
    Curriculum.say(ok ? '尋寶成功！記住啲英文圖同字。' : '時間到！聽英文再入圖搵。');
}

window.stopHuntGame = function () {
    var g = window.HuntGame;
    g.active = false;
    g.phase = 'rules';
    if (g.clock) { clearInterval(g.clock); g.clock = null; }
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
    g.phase = 'rules';
    g.score = 0;
    g.combo = 0;
    g.got = 0;
    g.found = [];
    g.queue = Curriculum.pickLesson(g.NEED);
    var extras = Curriculum.decoys(g.queue[0], 4);
    g.scene = Curriculum.shuffle(g.queue.concat(extras)).slice(0, 12);
    Curriculum.bootFx();
    huntShow('hunt-rules');
    var group = huntEl('hunt-group');
    if (group) group.textContent = Curriculum.groupName();
    Curriculum.say('尋寶圖。限時聽英文，喺圖入面撳啱嘅嘢。撳錯會扣時間。');
};

window.beginHuntPlay = function () {
    var g = window.HuntGame;
    g.phase = 'play';
    g.timeLeft = g.TIME;
    Curriculum.startFx();
    huntShow('hunt-play');
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
