// ==========================================
// 🏎️ 字母賽車 — 3-lane auto racer for age ~5
// Car drives the oval. Kid picks a lane. Go through the green gate.
// ==========================================

window.RaceGame = {
    active: false,
    phase: 'rules', // rules | go | play | teach | over
    raf: 0,
    clock: null,
    timeLeft: 75,
    TIME: 75,
    NEED: 5,
    score: 0,
    combo: 0,
    got: 0,
    words: [],
    collected: [],
    target: null,
    gates: [],
    stationT: 0,
    car: { t: -Math.PI / 2, lane: 0, laneTarget: 0, x: 0, y: 0, a: 0 },
    finger: null,
    swipeX: null,
    W: 320,
    H: 420,
    ctx: null,
    pending: false,
    prevT: -Math.PI / 2
};

function raceEl(id) { return document.getElementById(id); }

function raceTrack() {
    var W = window.RaceGame.W;
    var H = window.RaceGame.H;
    var short = Math.min(W, H);
    return {
        cx: W * 0.5,
        cy: H * 0.52,
        rx: Math.min(W * 0.40, H * 0.38),
        ry: Math.min(H * 0.34, W * 0.42),
        road: short * 0.24,
        gap: short * 0.155
    };
}

function racePoint(t, lane) {
    var tr = raceTrack();
    var px = tr.cx + tr.rx * Math.cos(t);
    var py = tr.cy + tr.ry * Math.sin(t);
    var tx = -tr.rx * Math.sin(t);
    var ty = tr.ry * Math.cos(t);
    var len = Math.hypot(tx, ty) || 1;
    var nx = -ty / len;
    var ny = tx / len;
    var off = (lane || 0) * tr.gap;
    return { x: px + nx * off, y: py + ny * off, a: Math.atan2(ty, tx), nx: nx, ny: ny };
}

function raceLaneFromPoint(x, y) {
    var g = window.RaceGame;
    var p0 = racePoint(g.car.t, 0);
    var signed = (x - p0.x) * p0.nx + (y - p0.y) * p0.ny;
    var gap = raceTrack().gap;
    if (signed < -gap * 0.42) return -1;
    if (signed > gap * 0.42) return 1;
    return 0;
}

function raceCrossed(prevT, nextT, mark) {
    var two = Math.PI * 2;
    var a = prevT;
    var b = nextT;
    var s = mark;
    while (a < 0) a += two;
    while (b < 0) b += two;
    while (s < 0) s += two;
    a %= two; b %= two; s %= two;
    if (b < a) b += two;
    if (s < a) s += two;
    return s >= a && s <= b;
}

function raceSizeCanvas() {
    var wrap = raceEl('race-canvas-wrap');
    var cvs = raceEl('race-cvs');
    if (!wrap || !cvs) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = Math.max(240, wrap.clientWidth || 320);
    var h = Math.max(260, wrap.clientHeight || 360);
    cvs.width = Math.round(w * dpr);
    cvs.height = Math.round(h * dpr);
    cvs.style.width = '100%';
    cvs.style.height = '100%';
    var ctx = cvs.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    window.RaceGame.ctx = ctx;
    window.RaceGame.W = w;
    window.RaceGame.H = h;
}

function raceHud() {
    var g = window.RaceGame;
    var t = raceEl('race-time');
    var s = raceEl('race-score');
    var n = raceEl('race-need');
    var tgt = raceEl('race-target');
    if (t) t.textContent = String(Math.max(0, Math.ceil(g.timeLeft)));
    if (s) s.textContent = String(g.score);
    if (n) n.textContent = g.got + ' / ' + g.NEED;
    if (tgt) {
        if (g.target) {
            tgt.innerHTML = '<span class="arena-target-emoji">' + g.target.emoji + '</span> 入綠色閘 · ' +
                g.target.w +
                (Curriculum.yue(g.target.w) ? ' · ' + Curriculum.yue(g.target.w) : '');
        } else {
            tgt.textContent = '掃左掃右揀線，入綠色閘！';
        }
    }
}

function racePlaceCar() {
    var g = window.RaceGame;
    g.car.t = -Math.PI / 2;
    g.car.lane = 0;
    g.car.laneTarget = 0;
    g.prevT = g.car.t;
    var p = racePoint(g.car.t, 0);
    g.car.x = p.x;
    g.car.y = p.y;
    g.car.a = p.a;
}

function raceSpawnGates() {
    var g = window.RaceGame;
    if (!g.words.length) g.words = Curriculum.pickLesson(g.NEED + 4, g.collected.map(function (w) { return w.w; }));
    g.target = g.words[g.got] || Curriculum.pickLesson(1)[0];
    var decoys = Curriculum.decoys(g.target, 2);
    var items = Curriculum.shuffle([g.target].concat(decoys).slice(0, 3));
    while (items.length < 3) items.push(Curriculum.decoys(g.target, 1)[0] || g.target);
    g.stationT = g.car.t + 1.35;
    if (g.stationT > Math.PI * 2) g.stationT -= Math.PI * 2;
    if (g.stationT < 0) g.stationT += Math.PI * 2;
    g.gates = [-1, 0, 1].map(function (lane, i) {
        var p = racePoint(g.stationT, lane);
        return { lane: lane, item: items[i], x: p.x, y: p.y, a: p.a, hit: false };
    });
    raceHud();
    if (g.phase === 'play' && g.target) {
        Curriculum.say('去 ' + g.target.w + ' 嗰度！入綠色閘。').then(function () {
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
    var tr = raceTrack();

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#7ecf6a';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    for (var i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(30 + i * 70, 18 + (i % 2) * 12, 16, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.beginPath();
    ctx.ellipse(tr.cx, tr.cy, tr.rx, tr.ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#3d3d3d';
    ctx.lineWidth = tr.road;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(tr.cx, tr.cy, tr.rx, tr.ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#5a5a5a';
    ctx.lineWidth = tr.road - 12;
    ctx.stroke();

    ctx.save();
    ctx.setLineDash([10, 12]);
    ctx.beginPath();
    ctx.ellipse(tr.cx, tr.cy, tr.rx, tr.ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#f4d35e';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.ellipse(tr.cx, tr.cy, Math.max(10, tr.rx - tr.road * 0.52), Math.max(10, tr.ry - tr.road * 0.52), 0, 0, Math.PI * 2);
    ctx.fillStyle = '#8ed87a';
    ctx.fill();

    ctx.fillStyle = '#123b63';
    ctx.font = 'bold 15px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('掃左／右揀線', tr.cx, tr.cy - 8);
    ctx.fillText('入綠色閘', tr.cx, tr.cy + 14);

    var start = racePoint(-Math.PI / 2, 0);
    ctx.save();
    ctx.translate(start.x, start.y);
    ctx.rotate(start.a);
    for (var r = 0; r < 2; r++) {
        for (var c = 0; c < 6; c++) {
            ctx.fillStyle = ((r + c) % 2) ? '#111' : '#fff';
            ctx.fillRect(-30 + c * 10, -tr.road * 0.42 + r * 10, 10, 10);
        }
    }
    ctx.restore();

    var nowLane = Math.round(g.car.lane);
    g.gates.forEach(function (gate) {
        var isGood = g.target && gate.item.w === g.target.w;
        ctx.save();
        ctx.translate(gate.x, gate.y);
        ctx.rotate(gate.a);
        ctx.fillStyle = isGood ? 'rgba(46, 204, 113, 0.96)' : 'rgba(255, 255, 255, 0.94)';
        ctx.strokeStyle = isGood ? '#0b7a3b' : '#123b63';
        ctx.lineWidth = isGood ? 5 : 3;
        if (gate.lane === nowLane) {
            ctx.shadowColor = isGood ? '#2ecc71' : '#ffc93c';
            ctx.shadowBlur = 16;
        }
        roundRect(ctx, -26, -40, 52, 80, 12);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#123b63';
        ctx.font = '30px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(gate.item.emoji, 0, -10);
        ctx.font = 'bold 12px Fredoka, sans-serif';
        ctx.fillText(gate.item.w, 0, 22);
        ctx.restore();
    });

    var car = g.car;
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.a);
    ctx.fillStyle = '#e63946';
    roundRect(ctx, -18, -12, 36, 24, 8);
    ctx.fill();
    ctx.fillStyle = '#ffddd2';
    ctx.fillRect(-4, -8, 16, 16);
    ctx.font = '26px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.rotate(-car.a);
    ctx.fillText('🚗', 0, 0);
    ctx.restore();
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

function raceApplyLane(lane) {
    var g = window.RaceGame;
    lane = Math.max(-1, Math.min(1, Math.round(lane)));
    if (g.car.laneTarget === lane) return;
    g.car.laneTarget = lane;
    if (window.ZiziFX) window.ZiziFX.play('tap');
}

window.raceSteer = function (lane) {
    if (!window.RaceGame.active) return;
    if (window.RaceGame.phase !== 'play' && window.RaceGame.phase !== 'go') return;
    raceApplyLane(lane);
};

function raceTapGate(x, y) {
    var g = window.RaceGame;
    var best = null;
    var bestD = 46;
    for (var i = 0; i < g.gates.length; i++) {
        var d = Math.hypot(x - g.gates[i].x, y - g.gates[i].y);
        if (d < bestD) { bestD = d; best = g.gates[i]; }
    }
    if (best) raceApplyLane(best.lane);
}

function raceOnPointer(x, y, isDown, isMove) {
    var g = window.RaceGame;
    if (!g.active) return;
    if (isDown) {
        g.swipeX = x;
        var before = g.car.laneTarget;
        raceTapGate(x, y);
        if (g.car.laneTarget === before) raceApplyLane(raceLaneFromPoint(x, y));
        return;
    }
    if (isMove && g.swipeX != null) {
        var dx = x - g.swipeX;
        if (dx > 36) {
            raceApplyLane(g.car.laneTarget + 1);
            g.swipeX = x;
        } else if (dx < -36) {
            raceApplyLane(g.car.laneTarget - 1);
            g.swipeX = x;
        } else {
            raceApplyLane(raceLaneFromPoint(x, y));
        }
    }
}

function raceOnGate(gate) {
    var g = window.RaceGame;
    if (g.pending || g.phase !== 'play') return;
    if (gate.hit) return;
    gate.hit = true;
    g.pending = true;
    var overlay = raceEl('race-overlay');
    if (gate.item.w === g.target.w) {
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
        Curriculum.say('唔係呢條線！入綠色閘。').then(function () {
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
    if (g.phase !== 'play' && g.phase !== 'go') return;

    g.car.lane += (g.car.laneTarget - g.car.lane) * Math.min(1, dt * 9);

    if (g.phase === 'play' && !g.pending) {
        var speed = 1.05;
        g.prevT = g.car.t;
        g.car.t += speed * dt;
        if (g.car.t > Math.PI * 2) g.car.t -= Math.PI * 2;
        if (g.gates.length && !g.gates.every(function (gt) { return gt.hit; })) {
            if (raceCrossed(g.prevT, g.car.t, g.stationT)) {
                var lane = Math.max(-1, Math.min(1, Math.round(g.car.lane)));
                var gate = null;
                for (var i = 0; i < g.gates.length; i++) {
                    if (g.gates[i].lane === lane) { gate = g.gates[i]; break; }
                }
                if (gate) raceOnGate(gate);
            }
        }
    }

    var p = racePoint(g.car.t, g.car.lane);
    g.car.x = p.x;
    g.car.y = p.y;
    g.car.a = p.a;
}

function raceTickClock() {
    var g = window.RaceGame;
    if (!g.active || g.phase === 'rules' || g.phase === 'over') return;
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

function raceShow(panel) {
    ['race-rules', 'race-play', 'race-over'].forEach(function (id) {
        var el = raceEl(id);
        if (!el) return;
        el.style.display = id === panel ? (id === 'race-play' ? 'flex' : 'block') : 'none';
    });
    var overlay = raceEl('race-overlay');
    if (overlay) overlay.classList.toggle('is-playing', panel === 'race-play');
}

function raceFinish(ok) {
    var g = window.RaceGame;
    g.phase = 'over';
    g.active = true;
    if (g.clock) { clearInterval(g.clock); g.clock = null; }
    if (g.raf) { cancelAnimationFrame(g.raf); g.raf = 0; }
    var stars = Curriculum.starsForScore(g.score, 500);
    Curriculum.award(stars, { reason: '完成字母賽車', quest: 'listen' });
    if (window.markQuest) window.markQuest('listen');
    raceShow('race-over');
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
        : '時間到！揀綠色閘先有分，我哋再跑過。');
}

window.stopRaceGame = function () {
    var g = window.RaceGame;
    g.active = false;
    g.phase = 'rules';
    g.finger = null;
    g.swipeX = null;
    g.pending = false;
    if (g.clock) { clearInterval(g.clock); g.clock = null; }
    if (g.raf) { cancelAnimationFrame(g.raf); g.raf = 0; }
    var overlay = raceEl('race-overlay');
    if (overlay) overlay.classList.remove('is-urgent', 'z-fx-shake', 'is-playing');
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
    } else {
        var overlay = raceEl('race-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
            overlay.classList.add('is-open');
        }
    }
    var g = window.RaceGame;
    g.active = true;
    g.phase = 'rules';
    g.timeLeft = g.TIME;
    g.score = 0;
    g.combo = 0;
    g.got = 0;
    g.collected = [];
    g.words = Curriculum.pickLesson(g.NEED + 3);
    g.target = null;
    Curriculum.bootFx();
    raceShow('race-rules');
    var group = raceEl('race-group');
    if (group) group.textContent = Curriculum.groupName();
    Curriculum.say('字母賽車。架車自己跑圈。手指掃左掃右，或者撳下面三個掣揀線。入綠色嗰個閘。');
};

window.beginRaceDrive = function () {
    var g = window.RaceGame;
    g.phase = 'go';
    g.pending = false;
    raceShow('race-play');
    raceHud();
    var count = raceEl('race-count');
    var n = 3;
    if (count) { count.style.display = 'flex'; count.textContent = '3'; }
    Curriculum.startFx();
    Curriculum.countFx(3);
    Curriculum.say('三、二、一，開始！掃左掃右入綠色閘。');

    function layoutAndDraw() {
        raceSizeCanvas();
        racePlaceCar();
        raceSpawnGates();
        raceHud();
        raceDraw();
    }
    layoutAndDraw();
    requestAnimationFrame(layoutAndDraw);

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
    }, 700);
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
        var sx = r.width / (g.W || r.width || 1);
        var sy = r.height / (g.H || r.height || 1);
        return { x: (x - r.left) / (sx || 1), y: (y - r.top) / (sy || 1) };
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
        raceOnPointer(p.x, p.y, true, false);
    }
    function move(e) {
        if (!window.RaceGame.finger) return;
        var cvs = raceEl('race-cvs');
        if (!cvs) return;
        if (e.cancelable) e.preventDefault();
        var p = pos(e, cvs);
        window.RaceGame.finger = p;
        raceOnPointer(p.x, p.y, false, true);
    }
    function up(e) {
        if (e && e.cancelable) e.preventDefault();
        window.RaceGame.finger = null;
        window.RaceGame.swipeX = null;
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
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bind);
    } else {
        bind();
    }
    window.addEventListener('load', bind);
    window.addEventListener('resize', function () {
        if (window.RaceGame.active && window.RaceGame.phase !== 'rules') {
            raceSizeCanvas();
            raceDraw();
        }
    });
})();
