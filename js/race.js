// ==========================================
// 🏎️ 字母賽車 — drag the car, rush the green gate
// Full-screen road. Finger sticks to the car. One row of gates comes at you.
// ==========================================

window.RaceGame = {
    active: false,
    phase: 'go',
    raf: 0,
    clock: null,
    timeLeft: 60,
    TIME: 60,
    NEED: 5,
    score: 0,
    combo: 0,
    got: 0,
    words: [],
    collected: [],
    target: null,
    gates: [],
    gateZ: 0.12,
    carX: 0.5,
    finger: null,
    W: 320,
    H: 420,
    ctx: null,
    pending: false,
    dash: 0
};

function raceEl(id) { return document.getElementById(id); }

function raceHud() {
    var g = window.RaceGame;
    var t = raceEl('race-time');
    var s = raceEl('race-score');
    var n = raceEl('race-need');
    var tgt = raceEl('race-target');
    if (t) t.textContent = String(Math.max(0, Math.ceil(g.timeLeft)));
    if (s) s.textContent = String(g.score);
    if (n) n.textContent = g.got + '/' + g.NEED;
    if (tgt) {
        if (g.target) {
            tgt.textContent = '🚗 ' + g.target.emoji + ' ' + g.target.w +
                (Curriculum.yue(g.target.w) ? ' · ' + Curriculum.yue(g.target.w) : '');
        } else {
            tgt.textContent = '拖住架車入綠色閘';
        }
    }
}

function raceSizeCanvas() {
    var wrap = raceEl('race-canvas-wrap');
    var cvs = raceEl('race-cvs');
    if (!wrap || !cvs) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = Math.max(200, wrap.clientWidth || 320);
    var h = Math.max(240, wrap.clientHeight || 400);
    cvs.width = Math.round(w * dpr);
    cvs.height = Math.round(h * dpr);
    var ctx = cvs.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    window.RaceGame.ctx = ctx;
    window.RaceGame.W = w;
    window.RaceGame.H = h;
}

function raceRoadX(y, side) {
    var g = window.RaceGame;
    var t = Math.max(0, Math.min(1, (y - g.H * 0.18) / (g.H * 0.82)));
    var mid = g.W * 0.5;
    var halfTop = g.W * 0.16;
    var halfBot = g.W * 0.48;
    var half = halfTop + (halfBot - halfTop) * t;
    return side < 0 ? mid - half : mid + half;
}

function raceSetCarFromTouch(x) {
    var g = window.RaceGame;
    var y = g.H * 0.84;
    var left = raceRoadX(y, -1);
    var right = raceRoadX(y, 1);
    var u = (x - left) / Math.max(1, right - left);
    g.carX = Math.max(0.08, Math.min(0.92, u));
}

function raceLane() {
    var x = window.RaceGame.carX;
    if (x < 0.33) return 0;
    if (x > 0.67) return 2;
    return 1;
}

function raceSpawnGates() {
    var g = window.RaceGame;
    if (!g.words.length) g.words = Curriculum.pickLesson(g.NEED + 4, g.collected.map(function (w) { return w.w; }));
    g.target = g.words[g.got] || Curriculum.pickLesson(1)[0];
    var decoys = Curriculum.decoys(g.target, 2);
    var items = Curriculum.shuffle([g.target].concat(decoys).slice(0, 3));
    while (items.length < 3) items.push(Curriculum.decoys(g.target, 1)[0] || g.target);
    g.gates = items;
    g.gateZ = 0.14;
    raceHud();
    if (g.phase === 'play' && g.target) {
        Curriculum.say('拖入 ' + g.target.w).then(function () {
            if (g.active && g.phase === 'play') return Curriculum.speakEn(g.target.w);
        });
    }
}

function raceDraw() {
    var g = window.RaceGame;
    var ctx = g.ctx;
    if (!ctx) return;
    var W = g.W;
    var H = g.H;

    var sky = ctx.createLinearGradient(0, 0, 0, H * 0.4);
    sky.addColorStop(0, '#7ec8ff');
    sky.addColorStop(1, '#c8f0ff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#7ed957';
    ctx.beginPath();
    ctx.moveTo(0, H * 0.18);
    ctx.lineTo(W, H * 0.18);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(raceRoadX(H * 0.18, -1), H * 0.18);
    ctx.lineTo(raceRoadX(H, -1), H);
    ctx.lineTo(raceRoadX(H, 1), H);
    ctx.lineTo(raceRoadX(H * 0.18, 1), H * 0.18);
    ctx.closePath();
    ctx.fillStyle = '#5a5a5a';
    ctx.fill();

    ctx.strokeStyle = '#f4d35e';
    ctx.lineWidth = 4;
    ctx.setLineDash([18, 16]);
    ctx.lineDashOffset = -g.dash;
    ctx.beginPath();
    ctx.moveTo(W * 0.5, H * 0.18);
    ctx.lineTo(W * 0.5, H);
    ctx.stroke();
    ctx.setLineDash([]);

    var z = g.gateZ;
    var y = H * 0.18 + (H * 0.62) * z;
    var left = raceRoadX(y, -1);
    var right = raceRoadX(y, 1);
    var gw = (right - left) / 3;
    var gh = 28 + 70 * z;
    g.gates.forEach(function (item, i) {
        var gx = left + gw * (i + 0.5);
        var good = g.target && item.w === g.target.w;
        ctx.save();
        ctx.translate(gx, y);
        ctx.fillStyle = good ? '#2ecc71' : '#fff';
        ctx.strokeStyle = good ? '#0b7a3b' : '#123b63';
        ctx.lineWidth = good ? 5 : 3;
        var hw = gw * 0.42;
        roundRect(ctx, -hw, -gh, hw * 2, gh, 10);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#123b63';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = Math.round(20 + 16 * z) + 'px serif';
        ctx.fillText(item.emoji, 0, -gh * 0.55);
        ctx.font = 'bold ' + Math.round(10 + 8 * z) + 'px Fredoka, sans-serif';
        ctx.fillText(item.w, 0, -gh * 0.18);
        ctx.restore();
    });

    var cy = H * 0.84;
    var cl = raceRoadX(cy, -1);
    var cr = raceRoadX(cy, 1);
    var cx = cl + (cr - cl) * g.carX;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = '#e63946';
    roundRect(ctx, -28, -18, 56, 36, 10);
    ctx.fill();
    ctx.font = '42px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚗', 0, -4);
    ctx.restore();

    ctx.fillStyle = 'rgba(18,59,99,0.75)';
    ctx.font = 'bold 14px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('手指拖住架車', W / 2, 22);
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function raceHit() {
    var g = window.RaceGame;
    if (g.pending || g.phase !== 'play') return;
    var item = g.gates[raceLane()];
    if (!item) return;
    g.pending = true;
    var overlay = raceEl('race-overlay');
    if (item.w === g.target.w) {
        g.combo += 1;
        var bonus = 100 + g.combo * 20 + Math.ceil(g.timeLeft);
        g.score += bonus;
        Curriculum.hitFx(overlay, bonus, g.combo);
        g.got += 1;
        g.collected.push(g.target);
        Curriculum.award(0, {
            word: g.target.w,
            emoji: g.target.emoji,
            letter: g.target.l,
            reason: '賽車學到 ' + g.target.w
        });
        raceHud();
        g.phase = 'teach';
        var word = g.target.w;
        Curriculum.say('入到！' + word).then(function () {
            return Curriculum.teach(word, 'race-coach');
        }).then(function () {
            g.pending = false;
            if (!g.active) return;
            if (g.got >= g.NEED || g.timeLeft <= 0) {
                raceFinish(true);
                return;
            }
            g.phase = 'play';
            raceSpawnGates();
        });
    } else {
        Curriculum.boom();
        if (window.ZiziFX) {
            window.ZiziFX.flash('rgba(255,80,80,.22)');
            window.ZiziFX.floatScore(overlay, '-4s', 'bad');
        }
        g.combo = 0;
        g.score = Math.max(0, g.score - 30);
        g.timeLeft = Math.max(0, g.timeLeft - 4);
        raceHud();
        Curriculum.say('唔係呢個閘！拖入綠色。').then(function () {
            if (g.active && g.target) return Curriculum.speakEn(g.target.w);
        }).then(function () {
            g.pending = false;
            if (!g.active || g.phase !== 'play') return;
            raceSpawnGates();
        });
    }
}

function raceUpdate(dt) {
    var g = window.RaceGame;
    if (g.phase !== 'play' || g.pending) return;
    g.dash += 180 * dt;
    g.gateZ += 0.32 * dt;
    if (g.gateZ >= 1) raceHit();
}

function raceTickClock() {
    var g = window.RaceGame;
    if (!g.active || g.phase === 'over') return;
    if (g.phase === 'play') {
        g.timeLeft -= 0.25;
        raceHud();
        Curriculum.warnLowTime(g.timeLeft, raceEl('race-overlay'));
        if (g.timeLeft <= 0) {
            g.timeLeft = 0;
            raceFinish(g.got > 0);
        }
    }
}

function raceLoop(prev) {
    if (!window.RaceGame.active) return;
    var now = performance.now();
    var dt = Math.min(0.05, (now - prev) / 1000);
    raceUpdate(dt);
    raceDraw();
    window.RaceGame.raf = requestAnimationFrame(function () { raceLoop(now); });
}

function raceShowOver(on) {
    var el = raceEl('race-over');
    if (!el) return;
    el.style.display = on ? 'flex' : 'none';
    el.classList.toggle('is-open', on);
}

function raceFinish(ok) {
    var g = window.RaceGame;
    g.phase = 'over';
    if (g.clock) { clearInterval(g.clock); g.clock = null; }
    if (g.raf) { cancelAnimationFrame(g.raf); g.raf = 0; }
    var stars = Curriculum.starsForScore(g.score, 500);
    Curriculum.award(stars, { reason: '完成字母賽車', quest: 'listen' });
    if (window.markQuest) window.markQuest('listen');
    raceShowOver(true);
    var overlay = raceEl('race-overlay');
    if (overlay) overlay.classList.remove('is-urgent');
    Curriculum.finishFx({
        emoji: '🏎️',
        title: ok ? '衝線喇！' : '時間到！',
        sub: '分數 ' + g.score + ' · 學到 ' + g.got + ' 個字',
        stars: stars
    });
    var title = raceEl('race-over-title');
    var sub = raceEl('race-over-sub');
    var list = raceEl('race-over-words');
    if (title) title.textContent = ok ? '衝線喇！' : '時間到！';
    if (sub) sub.textContent = '分數 ' + g.score + ' · 學到 ' + g.got + ' 個字 · +' + stars + '⭐';
    if (list) {
        list.innerHTML = g.collected.map(function (w) {
            return '<li><span>' + w.emoji + '</span> <b>' + w.w + '</b> ' + (Curriculum.yue(w.w) || '') + '</li>';
        }).join('') || '<li>今轉未入到閘，再試過！</li>';
    }
    Curriculum.say(ok
        ? '衝線喇！今轉學咗 ' + g.got + ' 個英文單詞。'
        : '時間到！拖架車入綠色閘先有分。');
}

window.stopRaceGame = function () {
    var g = window.RaceGame;
    g.active = false;
    g.phase = 'go';
    g.finger = null;
    g.pending = false;
    if (g.clock) { clearInterval(g.clock); g.clock = null; }
    if (g.raf) { cancelAnimationFrame(g.raf); g.raf = 0; }
    raceShowOver(false);
    var overlay = raceEl('race-overlay');
    if (overlay) overlay.classList.remove('is-urgent', 'z-fx-shake');
    if (overlay && window.setDisplay) window.setDisplay('race-overlay', 'none');
    else if (overlay) {
        overlay.style.display = 'none';
        overlay.classList.remove('is-open');
    }
};

window.startRaceGame = function () {
    window.stopRaceGame();
    window.currentMode = 'race';
    if (window.setDisplay) {
        window.setDisplay('home-menu', 'none');
        window.setDisplay('race-overlay', 'flex');
    }
    var g = window.RaceGame;
    g.active = true;
    g.phase = 'go';
    g.timeLeft = g.TIME;
    g.score = 0;
    g.combo = 0;
    g.got = 0;
    g.collected = [];
    g.words = Curriculum.pickLesson(g.NEED + 3);
    g.target = null;
    g.carX = 0.5;
    g.pending = false;
    Curriculum.bootFx();
    raceShowOver(false);
    raceHud();
    window.beginRaceDrive();
};

window.beginRaceDrive = function () {
    var g = window.RaceGame;
    g.phase = 'go';
    var count = raceEl('race-count');
    var n = 3;
    if (count) { count.style.display = 'flex'; count.textContent = '3'; }
    Curriculum.startFx();
    Curriculum.countFx(3);
    Curriculum.say('拖住架車，入綠色閘。三、二、一！');

    function layout() {
        raceSizeCanvas();
        raceSpawnGates();
        raceDraw();
    }
    layout();
    requestAnimationFrame(function () {
        layout();
        requestAnimationFrame(layout);
    });

    var iv = setInterval(function () {
        n -= 1;
        if (count) count.textContent = n > 0 ? String(n) : 'GO';
        if (n >= 0) Curriculum.countFx(n);
        if (n < 0) {
            clearInterval(iv);
            if (count) count.style.display = 'none';
            if (!g.active) return;
            g.phase = 'play';
            if (g.clock) clearInterval(g.clock);
            g.clock = setInterval(raceTickClock, 250);
            if (g.raf) cancelAnimationFrame(g.raf);
            g.raf = requestAnimationFrame(function () { raceLoop(performance.now()); });
            if (g.target) Curriculum.speakEn(g.target.w);
        }
    }, 650);
};

window.replayRaceWord = function () {
    var g = window.RaceGame;
    if (!g.target) return;
    Curriculum.speakEn(g.target.w);
};

(function bindRaceInput() {
    function pos(e, el) {
        var r = el.getBoundingClientRect();
        var x = e.clientX;
        var y = e.clientY;
        if (e.touches && e.touches[0]) {
            x = e.touches[0].clientX;
            y = e.touches[0].clientY;
        } else if (e.changedTouches && e.changedTouches[0]) {
            x = e.changedTouches[0].clientX;
            y = e.changedTouches[0].clientY;
        }
        var g = window.RaceGame;
        return {
            x: (x - r.left) * (g.W / (r.width || 1)),
            y: (y - r.top) * (g.H / (r.height || 1))
        };
    }
    function down(e) {
        var cvs = raceEl('race-cvs');
        var wrap = raceEl('race-canvas-wrap');
        if (!cvs || !window.RaceGame.active) return;
        if (e.cancelable) e.preventDefault();
        if (e.pointerId != null && wrap && wrap.setPointerCapture) {
            try { wrap.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        }
        var p = pos(e, cvs);
        window.RaceGame.finger = p;
        raceSetCarFromTouch(p.x);
    }
    function move(e) {
        if (!window.RaceGame.finger) return;
        var cvs = raceEl('race-cvs');
        if (!cvs) return;
        if (e.cancelable) e.preventDefault();
        var p = pos(e, cvs);
        window.RaceGame.finger = p;
        raceSetCarFromTouch(p.x);
    }
    function up(e) {
        if (e && e.cancelable) e.preventDefault();
        window.RaceGame.finger = null;
    }
    function bind() {
        var wrap = raceEl('race-canvas-wrap');
        if (!wrap || wrap._raceBound) return;
        wrap._raceBound = true;
        wrap.addEventListener('pointerdown', down);
        wrap.addEventListener('pointermove', move);
        wrap.addEventListener('pointerup', up);
        wrap.addEventListener('pointercancel', up);
        wrap.addEventListener('touchstart', down, { passive: false });
        wrap.addEventListener('touchmove', move, { passive: false });
        wrap.addEventListener('touchend', up, { passive: false });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();
    window.addEventListener('load', bind);
    window.addEventListener('resize', function () {
        if (window.RaceGame.active) {
            raceSizeCanvas();
            raceDraw();
        }
    });
})();
