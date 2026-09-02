// ==========================================
// 🏎️ 字母賽車 — side-on race vs a rival car
// Real race: two cars, one road. Steer left/mid/right,
// overtake when the English gate glows green.
// ==========================================

window.RaceGame = {
    active: false,
    phase: 'go',
    raf: 0,
    clock: null,
    timeLeft: 45,
    TIME: 45,
    LAPS: 5,
    score: 0,
    combo: 0,
    laps: 0,
    words: [],
    collected: [],
    target: null,
    gates: [],
    gateAt: 0.62,
    me: { x: 0.42, lane: 1 },
    rival: { x: 0.58, lane: 1 },
    roadOff: 0,
    bob: 0,
    blink: 0,
    laneTouch: null,
    W: 320,
    H: 420,
    ctx: null,
    pending: false
};

function raceEl(id) { return document.getElementById(id); }

function raceLaneX(lane) {
    var g = window.RaceGame;
    var pad = g.W * 0.1;
    return pad + (g.W - pad * 2) * (lane / 2);
}

function raceHud() {
    var g = window.RaceGame;
    var t = raceEl('race-time');
    var s = raceEl('race-score');
    var n = raceEl('race-need');
    var tgt = raceEl('race-target');
    if (t) t.textContent = String(Math.max(0, Math.ceil(g.timeLeft)));
    if (s) s.textContent = String(g.score);
    if (n) n.textContent = g.laps + '/' + g.LAPS;
    if (tgt) {
        if (g.target) {
            tgt.textContent = '快！' + g.target.emoji + ' ' + g.target.w;
        } else {
            tgt.textContent = '向左／右撳，衝過綠色閘！';
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
    if (!g.words.length) g.words = Curriculum.pickLesson(g.LAPS + 4, g.collected.map(function (w) { return w.w; }));
    g.target = g.words[g.laps] || Curriculum.pickLesson(1)[0];
    var decoys = Curriculum.decoys(g.target, 2);
    var items = Curriculum.shuffle([g.target].concat(decoys).slice(0, 3));
    while (items.length < 3) items.push(Curriculum.decoys(g.target, 1)[0] || g.target);
    g.gates = items;
    g.gateAt = 0.62;
    raceHud();
    if (g.phase === 'play' && g.target) {
        Curriculum.say('過 ' + g.target.w + ' 閘！').then(function () {
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

function drawCarSide(ctx, x, y, color, flip) {
    ctx.save();
    ctx.translate(x, y);
    if (flip) ctx.scale(-1, 1);
    ctx.fillStyle = color;
    roundRect(ctx, -34, -20, 68, 26, 10);
    ctx.fill();
    ctx.fillStyle = shade(color, -18);
    roundRect(ctx, -20, -34, 38, 20, 8);
    ctx.fill();
    ctx.fillStyle = '#a8e4ff';
    roundRect(ctx, -14, -30, 26, 13, 5);
    ctx.fill();
    ctx.fillStyle = '#1f1f1f';
    ctx.beginPath();
    ctx.arc(-18, 8, 11, 0, Math.PI * 2);
    ctx.arc(20, 8, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cfd8dc';
    ctx.beginPath();
    ctx.arc(-18, 8, 5, 0, Math.PI * 2);
    ctx.arc(20, 8, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function shade(hex, pct) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.max(0, Math.min(255, (n >> 16) + pct));
    var g = Math.max(0, Math.min(255, ((n >> 8) & 255) + pct));
    var b = Math.max(0, Math.min(255, (n & 255) + pct));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function raceDraw() {
    var g = window.RaceGame;
    var ctx = g.ctx;
    if (!ctx) return;
    var W = g.W;
    var H = g.H;
    var horizon = H * 0.3;

    var sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, '#7ec8ff');
    sky.addColorStop(1, '#d9f3ff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, horizon);

    ctx.fillStyle = '#fff59d';
    ctx.beginPath();
    ctx.arc(W * 0.86, H * 0.09, H * 0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#8ed87a';
    ctx.fillRect(0, horizon, W, H - horizon);

    var roadTop = horizon;
    var roadBot = H * 0.94;
    ctx.fillStyle = '#4d4d4d';
    ctx.beginPath();
    ctx.moveTo(W * 0.12, roadTop);
    ctx.lineTo(W * 0.88, roadTop);
    ctx.lineTo(W, roadBot);
    ctx.lineTo(0, roadBot);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#f4d35e';
    ctx.lineWidth = 4;
    ctx.setLineDash([20, 18]);
    ctx.lineDashOffset = -g.roadOff;
    for (var lane = 0; lane < 3; lane++) {
        var xTop = W * 0.12 + (W * 0.76) * (lane + 0.5) / 3;
        var xBot = W * (lane + 0.5) / 3;
        ctx.beginPath();
        ctx.moveTo(xTop, roadTop);
        ctx.lineTo(xBot, roadBot);
        ctx.stroke();
    }
    ctx.setLineDash([]);

    var gz = g.gateAt;
    var gy = roadTop + (roadBot - roadTop) * gz;
    var gh = 26 + 90 * gz;
    var laneW = (W - W * 0.1 * 2) / 3;
    for (var gi = 0; gi < 3; gi++) {
        var item = g.gates[gi];
        if (!item) continue;
        var good = g.target && item.w === g.target.w;
        var gx = raceLaneX(gi);
        ctx.save();
        ctx.translate(gx, gy);
        ctx.fillStyle = good ? '#2ecc71' : '#ffffff';
        ctx.strokeStyle = good ? '#0b7a3b' : '#123b63';
        ctx.lineWidth = good ? 5 : 3;
        var hw = laneW * 0.4;
        roundRect(ctx, -hw, -gh, hw * 2, gh, 10);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#123b63';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (window.ZiziArt) {
            var pulse = 1 + Math.sin(g.bob * 1.4) * 0.08;
            window.ZiziArt.drawWord(ctx, item.w, 0, -gh * 0.55, Math.round((26 + 24 * gz) * pulse), g.bob);
        } else {
            ctx.font = Math.round(18 + 18 * gz) + 'px serif';
            ctx.fillText(item.emoji, 0, -gh * 0.55);
        }
        ctx.font = 'bold ' + Math.round(11 + 8 * gz) + 'px Fredoka, sans-serif';
        ctx.fillText(item.w, 0, -gh * 0.14);
        ctx.restore();
    }

    var roadT = Math.max(0, Math.min(1, (gy - roadTop) / (roadBot - roadTop)));
    var bobY = Math.sin(g.bob) * 3;
    var squash = (Math.floor(g.blink * 0.7) % 6 === 0) ? 0.9 : 1;
    var cyMe = roadTop + (roadBot - roadTop) * g.me.x;
    var cyRv = roadTop + (roadBot - roadTop) * g.rival.x;
    ctx.save();
    ctx.translate(raceLaneX(g.me.lane), cyMe + bobY);
    ctx.scale(1, squash);
    drawCarSide(ctx, 0, 0, '#e63946', false);
    ctx.restore();
    ctx.save();
    ctx.translate(raceLaneX(g.rival.lane), cyRv - bobY);
    ctx.scale(1, 1 / squash);
    drawCarSide(ctx, 0, 0, '#4dabf7', true);
    ctx.restore();

    ctx.fillStyle = 'rgba(18,59,99,0.8)';
    ctx.font = 'bold 14px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('手指向左／向右掃', W / 2, H - 14);
}

function raceHit() {
    var g = window.RaceGame;
    if (g.pending || g.phase !== 'play') return;
    g.pending = true;
    var item = g.gates[g.me.lane];
    if (item && g.target && item.w === g.target.w) {
        g.combo += 1;
        var bonus = 120 + g.combo * 20 + Math.ceil(g.timeLeft);
        g.score += bonus;
        Curriculum.hitFx(raceEl('race-overlay'), bonus, g.combo);
        g.laps += 1;
        g.collected.push(g.target);
        Curriculum.award(0, {
            word: g.target.w,
            emoji: g.target.emoji,
            letter: g.target.l,
            reason: '賽車學到 ' + g.target.w
        });
        g.me.x = Math.min(0.9, g.me.x + 0.12);
        g.rival.x = Math.max(0.1, g.rival.x - 0.05);
        raceHud();
        var word = g.target.w;
        Curriculum.say('快過佢！' + word);
        Curriculum.speakEn(word);
        g.pending = false;
        if (!g.active) return;
        if (g.laps >= g.LAPS || g.timeLeft <= 0) {
            raceFinish(true);
            return;
        }
        raceSpawnGates();
    } else {
        Curriculum.boom();
        if (window.ZiziFX) {
            window.ZiziFX.flash('rgba(255,80,80,.22)');
            window.ZiziFX.floatScore(raceEl('race-overlay'), '-4s', 'bad');
        }
        g.combo = 0;
        g.score = Math.max(0, g.score - 30);
        g.timeLeft = Math.max(0, g.timeLeft - 4);
        g.rival.x = Math.min(0.94, g.rival.x + 0.1);
        raceHud();
        Curriculum.say('入錯閘！藍車追過嚟喇。');
        g.pending = false;
        if (!g.active) return;
        raceSpawnGates();
    }
}

function raceSteer(dir) {
    var g = window.RaceGame;
    if (!g.active) return;
    g.me.lane = Math.max(0, Math.min(2, g.me.lane + dir));
    if (window.ZiziFX) window.ZiziFX.play('tap');
}

function raceLaneFromClient(clientX) {
    var wrap = raceEl('race-canvas-wrap');
    if (!wrap) return;
    var r = wrap.getBoundingClientRect();
    var x = clientX - r.left;
    var t = x / r.width;
    var g = window.RaceGame;
    g.me.lane = t < 0.34 ? 0 : (t > 0.66 ? 2 : 1);
    if (window.ZiziFX) window.ZiziFX.play('tap');
}

window.raceLeft = function () { raceSteer(-1); };
window.raceRight = function () { raceSteer(1); };

(function bindRaceInput() {
    function x(e) {
        if (e.touches && e.touches[0]) return e.touches[0].clientX;
        if (e.changedTouches && e.changedTouches[0]) return e.changedTouches[0].clientX;
        return e.clientX;
    }
    function down(e) {
        var wrap = raceEl('race-canvas-wrap');
        if (!wrap || !window.RaceGame.active) return;
        if (e.cancelable) e.preventDefault();
        if (e.pointerId != null && wrap.setPointerCapture) {
            try { wrap.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        }
        var g = window.RaceGame;
        g.laneTouch = x(e);
        raceLaneFromClient(g.laneTouch);
    }
    function move(e) {
        var g = window.RaceGame;
        if (g.laneTouch == null) return;
        var wrap = raceEl('race-canvas-wrap');
        if (!wrap) return;
        if (e.cancelable) e.preventDefault();
        raceLaneFromClient(x(e));
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

function raceUpdate(dt) {
    var g = window.RaceGame;
    if (g.phase !== 'play' || g.pending) return;
    g.roadOff += 260 * dt;
    g.gateAt += 0.34 * dt;
    g.bob += dt * 8;
    g.blink += dt;
    g.rival.x += (0.5 + Math.sin(g.roadOff * 0.01) * 0.03 - g.rival.x) * dt * 0.4;
    g.rival.lane = Math.max(0, Math.min(2, g.rival.lane + (Math.random() < 0.01 ? (Math.random() < 0.5 ? -1 : 1) : 0)));
    if (g.gateAt >= 1) raceHit();
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
            raceFinish(g.laps > 0);
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
    var won = g.me.x >= g.rival.x;
    var stars = Curriculum.starsForScore(g.score, 500);
    Curriculum.award(stars, { reason: '完成字母賽車', quest: 'listen' });
    if (window.markQuest) window.markQuest('listen');
    raceShowOver(true);
    var overlay = raceEl('race-overlay');
    if (overlay) overlay.classList.remove('is-urgent');
    Curriculum.finishFx({
        emoji: '🏁',
        title: won ? '贏咗！' : (ok ? '衝線喇！' : '時間到！'),
        sub: '分數 ' + g.score + ' · 過咗 ' + g.laps + ' 閘',
        stars: stars
    });
    var title = raceEl('race-over-title');
    var sub = raceEl('race-over-sub');
    var list = raceEl('race-over-words');
    if (title) title.textContent = won ? '贏咗架藍車！' : (ok ? '衝線喇！' : '時間到！');
    if (sub) sub.textContent = '分數 ' + g.score + ' · 過咗 ' + g.laps + ' 閘 · +' + stars + '⭐';
    if (list) {
        list.innerHTML = g.collected.map(function (w) {
            return '<li><span>' + w.emoji + '</span> <b>' + w.w + '</b> ' + (Curriculum.yue(w.w) || '') + '</li>';
        }).join('') || '<li>未過到閘，再追過！</li>';
    }
    Curriculum.say(won
        ? '贏咗！紅車快過藍車。'
        : '時間到！要入啱閘先快過藍車。');
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
    g.laps = 0;
    g.collected = [];
    g.words = Curriculum.pickLesson(g.LAPS + 3);
    g.target = null;
    g.me = { x: 0.42, lane: 1 };
    g.rival = { x: 0.58, lane: 1 };
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
    Curriculum.say('拖住掃左掃右，入綠色閘。三、二、一！');

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
    function down(e) {
        var wrap = raceEl('race-canvas-wrap');
        if (!wrap || !window.RaceGame.active) return;
        if (e.cancelable) e.preventDefault();
        var r = wrap.getBoundingClientRect();
        var x = (e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX) - r.left;
        raceSteer(x < r.width / 2 ? -1 : 1);
    }
    function bind() {
        var wrap = raceEl('race-canvas-wrap');
        if (!wrap || wrap._raceBound) return;
        wrap._raceBound = true;
        wrap.addEventListener('pointerdown', down);
        wrap.addEventListener('touchstart', down, { passive: false });
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
