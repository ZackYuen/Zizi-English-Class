// ==========================================
// 🎈 音爆射擊 — rocket fires at the target you tap
// One target card glows. Tap it, rocket hits it.
// ==========================================

window.ShootGame = {
    active: false,
    phase: 'play',
    clock: null,
    TIME: 40,
    NEED: 6,
    timeLeft: 40,
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
    if (t) t.textContent = String(Math.max(0, Math.ceil(g.timeLeft)));
    if (s) s.textContent = String(g.score);
    if (n) n.textContent = g.got + '/' + g.NEED;
    if (tgt) {
        if (g.target) {
            tgt.textContent = '🚀 撳 ' + g.target.w;
        } else {
            tgt.textContent = '撳發光嗰張，火箭射佢';
        }
    }
}

function shootShowOver(on) {
    var el = shEl('shoot-over');
    if (!el) return;
    el.style.display = on ? 'flex' : 'none';
    el.classList.toggle('is-open', on);
}

function shootAsk() {
    var g = window.ShootGame;
    g.target = g.queue[g.got];
    g.pending = false;
    shootHud();
    if (!g.target) return;
    shootFill();
    Curriculum.say('火箭射 ' + g.target.w + '！').then(function () {
        if (g.active && g.phase === 'play') return Curriculum.speakEn(g.target.w);
    });
}

function shootFill() {
    var g = window.ShootGame;
    var field = shEl('shoot-field');
    if (!field || !g.target) return;
    field.innerHTML = '<div class="shoot-ship" aria-hidden="true">🚀</div>';
    var decoys = Curriculum.decoys(g.target, 2);
    var items = Curriculum.shuffle([g.target].concat(decoys).slice(0, 3));
    var spots = [
        { left: '10%', top: '16%' },
        { left: '38%', top: '40%' },
        { left: '66%', top: '16%' }
    ];
    var colors = ['#ff6b6b', '#4dabf7', '#845ef7'];
    items.forEach(function (item, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'shoot-balloon' + (item.w === g.target.w ? ' is-target' : '');
        b.style.left = spots[i].left;
        b.style.top = spots[i].top;
        b.style.background = colors[i % colors.length];
        b.style.animationDelay = (i * 0.2) + 's';
        b.dataset.word = item.w;
        b.setAttribute('aria-label', item.w);
        b.innerHTML = '<canvas class="shoot-art"></canvas>' +
            '<span class="shoot-balloon-word">' + item.w + '</span>';
        b.onclick = function (ev) {
            ev.preventDefault();
            shootPop(b, item);
        };
        field.appendChild(b);
        var art = b.querySelector('.shoot-art');
        if (art && window.ZiziArt) {
            var cs = 44;
            art.width = cs * 2;
            art.height = cs * 2;
            var ac = art.getContext('2d');
            ac.scale(2, 2);
            window.ZiziArt.drawWord(ac, item.w, cs / 2, cs / 2, cs, performance.now() / 1000);
        }
    });
}

function shootBeam(toEl, done) {
    var field = shEl('shoot-field');
    var ship = field && field.querySelector('.shoot-ship');
    if (!field || !ship || !toEl) {
        if (done) done();
        return;
    }
    var fr = field.getBoundingClientRect();
    var a = ship.getBoundingClientRect();
    var b = toEl.getBoundingClientRect();
    var x1 = a.left + a.width / 2 - fr.left;
    var y1 = a.top + 8 - fr.top;
    var x2 = b.left + b.width / 2 - fr.left;
    var y2 = b.top + b.height / 2 - fr.top;
    var len = Math.hypot(x2 - x1, y2 - y1);
    var ang = Math.atan2(y2 - y1, x2 - x1);
    var beam = document.createElement('div');
    beam.className = 'shoot-laser';
    beam.style.left = x1 + 'px';
    beam.style.top = y1 + 'px';
    beam.style.width = len + 'px';
    beam.style.transform = 'rotate(' + ang + 'rad)';
    field.appendChild(beam);
    if (window.ZiziFX) window.ZiziFX.play('slam');
    setTimeout(function () {
        if (beam.parentNode) beam.parentNode.removeChild(beam);
        if (done) done();
    }, 140);
}

function shootPop(el, item) {
    var g = window.ShootGame;
    if (!g.active || g.phase !== 'play' || g.pending || !g.target) return;
    if (el.classList.contains('is-pop')) return;
    g.pending = true;
    shootBeam(el, function () {
        g.pending = false;
        shootResolve(el, item);
    });
}

function shootResolve(el, item) {
    var g = window.ShootGame;
    if (!g.active || g.phase !== 'play' || !g.target) return;
    if (el.classList.contains('is-pop')) return;

    if (item.w === g.target.w) {
        el.classList.add('is-pop');
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 150);
        g.combo += 1;
        g.got += 1;
        g.collected.push(g.target);
        var bonus = 100 + g.combo * 20;
        g.score += bonus;
        Curriculum.popBalloon(shEl('shoot-overlay'), bonus, g.combo);
        shootHud();
        Curriculum.award(0, {
            word: item.w,
            emoji: item.emoji,
            letter: item.l,
            reason: '射擊學到 ' + item.w
        });
        Curriculum.speakEn(item.w);
        setTimeout(function () {
            if (!g.active) return;
            if (g.got >= g.NEED || g.timeLeft <= 0) {
                shootFinish(true);
                return;
            }
            shootAsk();
        }, 600);
    } else {
        Curriculum.missFx(el, '碰！');
        g.combo = 0;
        g.score = Math.max(0, g.score - 10);
        shootHud();
        el.classList.add('is-wrong');
        setTimeout(function () { el.classList.remove('is-wrong'); }, 300);
        Curriculum.say('唔係 ' + item.w + '。聽多次。').then(function () {
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
    var field = shEl('shoot-field');
    if (field) field.innerHTML = '';
    var stars = Curriculum.starsForScore(g.score, 500);
    Curriculum.award(stars, { reason: '完成音爆射擊', quest: 'listen' });
    if (window.markQuest) window.markQuest('listen');
    shootShowOver(true);
    var overlay = shEl('shoot-overlay');
    if (overlay) overlay.classList.remove('is-urgent');
    Curriculum.finishFx({
        emoji: '🚀',
        title: ok ? '射中晒！' : '時間到！',
        sub: '分數 ' + g.score + ' · 射中 ' + g.got + ' 個',
        stars: stars
    });
    var title = shEl('shoot-over-title');
    var sub = shEl('shoot-over-sub');
    var list = shEl('shoot-over-words');
    if (title) title.textContent = ok ? '射中晒！' : '時間到！';
    if (sub) sub.textContent = '分數 ' + g.score + ' · 射中 ' + g.got + ' 個 · +' + stars + '⭐';
    if (list) {
        list.innerHTML = g.collected.map(function (w) {
            return '<li><span>' + w.emoji + '</span> <b>' + w.w + '</b> ' + (Curriculum.yue(w.w) || '') + '</li>';
        }).join('') || '<li>今轉未射中，再聽英文試過！</li>';
    }
    Curriculum.say(ok ? '射中晒！記住啲英文。' : '時間到！撳發光嗰張。');
}

window.stopShootGame = function () {
    var g = window.ShootGame;
    g.active = false;
    g.phase = 'play';
    g.pending = false;
    if (g.clock) { clearInterval(g.clock); g.clock = null; }
    var field = shEl('shoot-field');
    if (field) field.innerHTML = '';
    shootShowOver(false);
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
    g.score = 0;
    g.combo = 0;
    g.got = 0;
    g.collected = [];
    g.queue = Curriculum.pickLesson(g.NEED);
    g.target = null;
    Curriculum.bootFx();
    shootShowOver(false);
    window.beginShootPlay();
};

window.beginShootPlay = function () {
    var g = window.ShootGame;
    g.phase = 'play';
    g.timeLeft = g.TIME;
    Curriculum.startFx();
    shootHud();
    if (g.clock) clearInterval(g.clock);
    g.clock = setInterval(shootTick, 250);
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
