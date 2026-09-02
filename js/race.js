// ==========================================
// 🏎️ 字母賽車 — drag the car, catch the rival
// One road, two cars. Finger sticks to your red car.
// Chase the blue car; drive through the glowing gate.
// ==========================================

window.RaceGame = {
    active: false,
    phase: 'go',
    raf: 0,
    clock: null,
    timeLeft: 50,
    TIME: 50,
    NEED: 4,
    score: 0,
    combo: 0,
    got: 0,
    words: [],
    collected: [],
    target: null,
    gates: [],
    gateAt: 0.5,
    me: { x: 0.5 },
    rival: { x: 0.34 },
    roadOff: 0,
    bob: 0,
    W: 320,
    H: 420,
    ctx: null,
    pending: false
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
            tgt.textContent = '🚗 ' + g.target.w;
        } else {
            tgt.textContent = '拖住架車去發光嗰度';
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

function raceSpawnGates() {
    var g = window.RaceGame;
    if (!g.words.length) g.words = Curriculum.pickLesson(g.NEED + 3, g.collected.map(function (w) { return w.w; }));
    g.target = g.words[g.got] || Curriculum.pickLesson(1)[0];
    var decoys = Curriculum.decoys(g.target, 1);
    var items = Curriculum.shuffle([g.target].concat(decoys).slice(0, 2));
    while (items.length < 2) items.push(Curriculum.decoys(g.target, 1)[0] || g.target);
    g.gates = items;
    g.gateAt = 0.5;
    raceHud();
    if (g.phase === 'play' && g.target) {
        Curriculum.say('入 ' + g.target.w + ' 閘！').then(function () {
            if (g.active && g.phase === 'play') return Curriculum.speakEn(g.target.w);
        });
    }
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

function drawCarTop(ctx, x, y, color, glow) {
    ctx.save();
    ctx.translate(x, y);
    if (glow) {
        ctx.shadowColor = '#fff59d';
        ctx.shadowBlur = 18;
    }
    ctx.fillStyle = color;
    roundRect(ctx, -26, -44, 52, 88, 16);
    ctx.fill();
    ctx.fillStyle = '#123b63';
    roundRect(ctx, -18, -26, 36, 22, 8);
    ctx.fill();
    ctx.fillStyle = '#a8e4ff';
    roundRect(ctx, -14, -22, 28, 14, 5);
    ctx.fill();
    ctx.fillStyle = '#1f1f1f';
    [-20, 20].forEach(function (wx) {
        ctx.beginPath();
        ctx.arc(wx, -24, 9, 0, Math.PI * 2);
        ctx.arc(wx, 24, 9, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();
}

function raceDraw() {
    var g = window.RaceGame;
    var ctx = g.ctx;
    if (!ctx) return;
    var W = g.W;
    var H = g.H;

    ctx.fillStyle = '#8ed87a';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#4d4d4d';
    roundRect(ctx, W * 0.06, -20, W * 0.88, H + 40, 24);
    ctx.fill();
    ctx.strokeStyle = '#f4d35e';
    ctx.lineWidth = 5;
    ctx.setLineDash([22, 18]);
    ctx.lineDashOffset = -g.roadOff;
    ctx.beginPath();
    ctx.moveTo(W * 0.5, 0);
    ctx.lineTo(W * 0.5, H);
    ctx.stroke();
    ctx.setLineDash([]);

    var gz = g.gateAt;
    var gy = H * 0.12 + H * 0.7 * gz;
    var gw = W * 0.32;
    var gh = H * 0.13;
    var xs = [W * 0.3, W * 0.7];
    g.gates.forEach(function (item, i) {
        if (!item) return;
        var good = g.target && item.w === g.target.w;
        var gx = xs[i];
        ctx.save();
        ctx.translate(gx, gy);
        ctx.fillStyle = good ? '#2ecc71' : '#ffffff';
        ctx.strokeStyle = good ? '#fff59d' : '#123b63';
        ctx.lineWidth = good ? 6 : 3;
        roundRect(ctx, -gw / 2, -gh, gw, gh, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#123b63';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (window.ZiziArt) {
            var pulse = good ? 1 + Math.sin(g.bob * 2) * 0.1 : 1;
            window.ZiziArt.drawWord(ctx, item.w, 0, -gh * 0.55, Math.round(30 * pulse), g.bob);
        } else {
            ctx.font = '26px serif';
            ctx.fillText(item.emoji, 0, -gh * 0.55);
        }
        ctx.font = 'bold 15px Fredoka, sans-serif';
        ctx.fillStyle = good ? '#fff' : '#123b63';
        ctx.fillText(item.w, 0, -gh * 0.12);
        ctx.restore();
    });

    var bobY = Math.sin(g.bob) * 3;
    var cyMe = H * 0.82;
    var cyRv = H * 0.82 - (g.me.x - g.rival.x) * H * 0.5;
    drawCarTop(ctx, W * 0.5, cyRv, '#4dabf7', false);
    drawCarTop(ctx, g.me.x * W, cyMe + bobY, '#e63946', true);

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 15px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('拖住紅車，入綠色閘', W / 2, 22);
}

function raceHit() {
    var g = window.RaceGame;
    if (g.pending || g.phase !== 'play') return;
    g.pending = true;
    var idx = g.me.x < 0.5 ? 0 : 1;
    var item = g.gates[idx];
    if (item && g.target && item.w === g.target.w) {
        g.combo += 1;
        var bonus = 120 + g.combo * 20;
        g.score += bonus;
        Curriculum.hitFx(raceEl('race-overlay'), bonus, g.combo);
        g.got += 1;
        g.collected.push(g.target);
        Curriculum.award(0, {
            word: g.target.w,
            emoji: g.target.emoji,
            letter: g.target.l,
            reason: '賽車學到 ' + g.target.w
        });
        g.rival.x = Math.max(0.1, g.rival.x + 0.03);
        raceHud();
        Curriculum.speakEn(g.target.w);
        setTimeout(function () {
            g.pending = false;
            if (!g.active) return;
            if (g.got >= g.NEED || g.timeLeft <= 0) {
                raceFinish(true);
                return;
            }
            raceSpawnGates();
        }, 450);
    } else {
        Curriculum.boom();
        if (window.ZiziFX) {
            window.ZiziFX.flash('rgba(255,80,80,.22)');
            window.ZiziFX.floatScore(raceEl('race-overlay'), '碰！', 'bad');
        }
        g.combo = 0;
        g.score = Math.max(0, g.score - 20);
        g.rival.x = Math.min(0.9, g.rival.x + 0.1);
        raceHud();
        Curriculum.say('碰！入綠色嗰個。');
        g.gateAt = 0.5;
        g.pending = false;
    }
}

function raceUpdate(dt) {
    var g = window.RaceGame;
    if (g.phase !== 'play') return;
    g.roadOff += 260 * dt;
    g.bob += dt * 8;
    g.gateAt += 0.38 * dt;
    if (!g.pending && g.gateAt >= 1) raceHit();
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
    var won = g.got >= g.NEED;
    var stars = Curriculum.starsForScore(g.score, 450);
    Curriculum.award(stars, { reason: '完成字母賽車', quest: 'listen' });
    if (window.markQuest) window.markQuest('listen');
    raceShowOver(true);
    var overlay = raceEl('race-overlay');
    if (overlay) overlay.classList.remove('is-urgent');
    Curriculum.finishFx({
        emoji: '🏁',
        title: won ? '贏咗！' : (ok ? '衝線喇！' : '時間到！'),
        sub: '分數 ' + g.score + ' · 入咗 ' + g.got + ' 閘',
        stars: stars
    });
    var title = raceEl('race-over-title');
    var sub = raceEl('race-over-sub');
    var list = raceEl('race-over-words');
    if (title) title.textContent = won ? '贏咗架藍車！' : (ok ? '衝線喇！' : '時間到！');
    if (sub) sub.textContent = '分數 ' + g.score + ' · 入咗 ' + g.got + ' 閘 · +' + stars + '⭐';
    if (list) {
        list.innerHTML = g.collected.map(function (w) {
            return '<li><span>' + w.emoji + '</span> <b>' + w.w + '</b> ' + (Curriculum.yue(w.w) || '') + '</li>';
        }).join('') || '<li>未入到閘，再拖車入綠色嗰個！</li>';
    }
    Curriculum.say(won
        ? '贏咗！紅車快過藍車。'
        : '時間到！拖住紅車入綠色閘。');
}

window.stopRaceGame = function () {
    var g = window.RaceGame;
    g.active = false;
    g.phase = 'go';
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
    g.words = Curriculum.pickLesson(g.NEED + 2);
    g.target = null;
    g.me.x = 0.5;
    g.rival.x = 0.34;
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
    Curriculum.say('拖住紅車入綠色閘，追過藍車。三、二、一！');

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
    function x(e) {
        if (e.touches && e.touches[0]) return e.touches[0].clientX;
        if (e.changedTouches && e.changedTouches[0]) return e.changedTouches[0].clientX;
        return e.clientX;
    }
    function setCar(clientX) {
        var wrap = raceEl('race-canvas-wrap');
        if (!wrap) return;
        var r = wrap.getBoundingClientRect();
        var t = (clientX - r.left) / (r.width || 1);
        window.RaceGame.me.x = Math.max(0.14, Math.min(0.86, t));
    }
    function down(e) {
        var wrap = raceEl('race-canvas-wrap');
        if (!wrap || !window.RaceGame.active) return;
        if (e.cancelable) e.preventDefault();
        if (e.pointerId != null && wrap.setPointerCapture) {
            try { wrap.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        }
        window.RaceGame.laneTouch = x(e);
        setCar(window.RaceGame.laneTouch);
    }
    function move(e) {
        var g = window.RaceGame;
        if (g.laneTouch == null) return;
        if (e.cancelable) e.preventDefault();
        g.laneTouch = x(e);
        setCar(g.laneTouch);
    }
    function up(e) {
        if (e && e.cancelable) e.preventDefault();
        window.RaceGame.laneTouch = null;
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
