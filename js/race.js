// ==========================================
// 🏎️ 字母賽車 — drive a car on an oval track
// Hear English, steer through the matching gate before time runs out.
// Lesson words follow SATIPN → later phonics groups.
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
    car: { x: 0, y: 0, a: 0, vx: 0, vy: 0 },
    finger: null,
    W: 320,
    H: 420,
    ctx: null,
    pending: false
};

function raceEl(id) { return document.getElementById(id); }

function raceTrack() {
    var W = window.RaceGame.W;
    var H = window.RaceGame.H;
    return {
        cx: W * 0.5,
        cy: H * 0.52,
        rx: Math.min(W * 0.36, H * 0.34),
        ry: Math.min(H * 0.30, W * 0.40),
        road: Math.min(W, H) * 0.20
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
    var off = (lane || 0) * tr.road * 0.32;
    return { x: px + nx * off, y: py + ny * off, a: Math.atan2(ty, tx), nx: nx, ny: ny };
}

function raceNearestT(x, y) {
    var bestT = 0;
    var bestD = 1e9;
    for (var i = 0; i < 72; i++) {
        var t = (i / 72) * Math.PI * 2;
        var p = racePoint(t, 0);
        var d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
        if (d < bestD) { bestD = d; bestT = t; }
    }
    return { t: bestT, dist: Math.sqrt(bestD) };
}

function raceOnRoad(x, y) {
    var tr = raceTrack();
    var n = raceNearestT(x, y);
    return n.dist <= tr.road * 0.55;
}

function raceSizeCanvas() {
    var wrap = raceEl('race-canvas-wrap');
    var cvs = raceEl('race-cvs');
    if (!wrap || !cvs) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = Math.max(260, wrap.clientWidth || 320);
    var h = Math.max(300, wrap.clientHeight || 400);
    cvs.width = Math.round(w * dpr);
    cvs.height = Math.round(h * dpr);
    cvs.style.width = w + 'px';
    cvs.style.height = h + 'px';
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
            tgt.innerHTML = '<span class="arena-target-emoji">' + g.target.emoji + '</span> ' +
                g.target.w +
                (Curriculum.yue(g.target.w) ? ' · ' + Curriculum.yue(g.target.w) : '');
        } else {
            tgt.textContent = '聽英文，揸車入啱嘅閘！';
        }
    }
}

function racePlaceCarOnTrack() {
    var p = racePoint(-Math.PI / 2, 0);
    window.RaceGame.car.x = p.x;
    window.RaceGame.car.y = p.y;
    window.RaceGame.car.a = p.a;
    window.RaceGame.car.vx = 0;
    window.RaceGame.car.vy = 0;
}

function raceSpawnGates() {
    var g = window.RaceGame;
    if (!g.words.length) g.words = Curriculum.pickLesson(g.NEED + 4, g.collected.map(function (w) { return w.w; }));
    g.target = g.words[g.got] || Curriculum.pickLesson(1)[0];
    var decoys = Curriculum.decoys(g.target, 2);
    var items = Curriculum.shuffle([g.target].concat(decoys).slice(0, 3));
    while (items.length < 3) items.push(Curriculum.decoys(g.target, 1)[0] || g.target);
    var near = raceNearestT(g.car.x, g.car.y);
    g.stationT = near.t + 1.15;
    if (g.stationT > Math.PI * 2) g.stationT -= Math.PI * 2;
    g.gates = [-1, 0, 1].map(function (lane, i) {
        var p = racePoint(g.stationT, lane);
        return { lane: lane, item: items[i], x: p.x, y: p.y, a: p.a, hit: false };
    });
    raceHud();
    if (g.phase === 'play' && g.target) {
        Curriculum.say('去 ' + g.target.w + ' 嗰度！').then(function () {
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
    ctx.lineWidth = tr.road - 10;
    ctx.stroke();

    ctx.save();
    ctx.setLineDash([12, 14]);
    ctx.beginPath();
    ctx.ellipse(tr.cx, tr.cy, tr.rx, tr.ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#f4d35e';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.ellipse(tr.cx, tr.cy, Math.max(8, tr.rx - tr.road * 0.52), Math.max(8, tr.ry - tr.road * 0.52), 0, 0, Math.PI * 2);
    ctx.fillStyle = '#8ed87a';
    ctx.fill();

    var start = racePoint(-Math.PI / 2, 0);
    ctx.save();
    ctx.translate(start.x, start.y);
    ctx.rotate(start.a);
    ctx.fillStyle = '#fff';
    for (var r = 0; r < 2; r++) {
        for (var c = 0; c < 6; c++) {
            ctx.fillStyle = ((r + c) % 2) ? '#111' : '#fff';
            ctx.fillRect(-30 + c * 10, -tr.road * 0.42 + r * 10, 10, 10);
        }
    }
    ctx.restore();

    g.gates.forEach(function (gate) {
        ctx.save();
        ctx.translate(gate.x, gate.y);
        ctx.rotate(gate.a);
        ctx.fillStyle = gate.item.w === g.target.w ? 'rgba(46, 204, 113, 0.92)' : 'rgba(255, 255, 255, 0.92)';
        ctx.strokeStyle = '#123b63';
        ctx.lineWidth = 3;
        roundRect(ctx, -34, -42, 68, 84, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#123b63';
        ctx.font = '32px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(gate.item.emoji, 0, -10);
        ctx.font = 'bold 13px Fredoka, sans-serif';
        ctx.fillText(gate.item.w, 0, 22);
        ctx.restore();
    });

    var car = g.car;
    var on = raceOnRoad(car.x, car.y);
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.a);
    ctx.fillStyle = on ? '#e63946' : '#9b2226';
    roundRect(ctx, -16, -11, 32, 22, 7);
    ctx.fill();
    ctx.fillStyle = '#ffddd2';
    ctx.fillRect(-4, -8, 14, 16);
    ctx.font = '22px serif';
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

function raceHitGate(gate) {
    var dx = window.RaceGame.car.x - gate.x;
    var dy = window.RaceGame.car.y - gate.y;
    var ca = Math.cos(-gate.a);
    var sa = Math.sin(-gate.a);
    var lx = dx * ca - dy * sa;
    var ly = dx * sa + dy * ca;
    return Math.abs(lx) < 36 && Math.abs(ly) < 44;
}

function raceUpdate(dt) {
    var g = window.RaceGame;
    if (g.phase !== 'play' || g.pending) return;
    var car = g.car;
    var max = raceOnRoad(car.x, car.y) ? 220 : 70;
    if (g.finger) {
        var fx = g.finger.x - car.x;
        var fy = g.finger.y - car.y;
        var d = Math.hypot(fx, fy) || 1;
        var pull = Math.min(max, d * 6);
        car.vx = (fx / d) * pull;
        car.vy = (fy / d) * pull;
        car.a = Math.atan2(car.vy, car.vx);
    } else {
        car.vx *= 0.86;
        car.vy *= 0.86;
    }
    car.x += car.vx * dt;
    car.y += car.vy * dt;
    car.x = Math.max(12, Math.min(g.W - 12, car.x));
    car.y = Math.max(12, Math.min(g.H - 12, car.y));

    for (var i = 0; i < g.gates.length; i++) {
        var gate = g.gates[i];
        if (gate.hit) continue;
        if (!raceHitGate(gate)) continue;
        gate.hit = true;
        raceOnGate(gate);
        break;
    }
}

function raceOnGate(gate) {
    var g = window.RaceGame;
    if (g.pending) return;
    g.pending = true;
    if (gate.item.w === g.target.w) {
        Curriculum.pop();
        g.combo += 1;
        var bonus = 100 + g.combo * 20 + Math.ceil(g.timeLeft);
        g.score += bonus;
        g.got += 1;
        g.collected.push(g.target);
        Curriculum.award(0, {
            word: g.target.w,
            emoji: g.target.emoji,
            letter: g.target.l,
            reason: '賽車學到 ' + g.target.w
        });
        raceHud();
        if (typeof confetti === 'function') confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
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
        g.combo = 0;
        g.score = Math.max(0, g.score - 30);
        g.timeLeft = Math.max(0, g.timeLeft - 4);
        raceHud();
        Curriculum.say('唔係呢個閘！聽多次 ' + g.target.w).then(function () {
            return Curriculum.speakEn(g.target.w);
        }).then(function () {
            g.pending = false;
            gate.hit = false;
        });
    }
}

function raceTickClock() {
    var g = window.RaceGame;
    if (!g.active || g.phase === 'rules' || g.phase === 'over') return;
    if (g.phase === 'play') {
        g.timeLeft -= 0.25;
        raceHud();
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
}

function raceFinish(ok) {
    var g = window.RaceGame;
    g.phase = 'over';
    g.active = true;
    if (g.clock) { clearInterval(g.clock); g.clock = null; }
    if (g.raf) { cancelAnimationFrame(g.raf); g.raf = 0; }
    Curriculum.win();
    var stars = Curriculum.starsForScore(g.score, 500);
    Curriculum.award(stars, { reason: '完成字母賽車', quest: 'listen' });
    if (window.markQuest) window.markQuest('listen');
    raceShow('race-over');
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
        : '時間到！入到閘先有分，我哋再揸過。');
}

window.stopRaceGame = function () {
    var g = window.RaceGame;
    g.active = false;
    g.phase = 'rules';
    g.finger = null;
    g.pending = false;
    if (g.clock) { clearInterval(g.clock); g.clock = null; }
    if (g.raf) { cancelAnimationFrame(g.raf); g.raf = 0; }
    var overlay = raceEl('race-overlay');
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
    raceShow('race-rules');
    var group = raceEl('race-group');
    if (group) group.textContent = Curriculum.groupName();
    Curriculum.say('字母賽車。用手指揸車，喺賽道上面行。聽英文，喺時間內揸入啱嗰個閘。');
};

window.beginRaceDrive = function () {
    var g = window.RaceGame;
    g.phase = 'go';
    raceShow('race-play');
    raceSizeCanvas();
    racePlaceCarOnTrack();
    raceSpawnGates();
    raceHud();
    raceDraw();
    var count = raceEl('race-count');
    var n = 3;
    if (count) { count.style.display = 'flex'; count.textContent = '3'; }
    Curriculum.say('三、二、一，開始！');
    var iv = setInterval(function () {
        n -= 1;
        if (count) count.textContent = n > 0 ? String(n) : 'GO';
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
    function pos(e, cvs) {
        var r = cvs.getBoundingClientRect();
        var x = e.clientX;
        var y = e.clientY;
        if (e.touches && e.touches[0]) {
            x = e.touches[0].clientX;
            y = e.touches[0].clientY;
        }
        return { x: x - r.left, y: y - r.top };
    }
    function down(e) {
        var cvs = raceEl('race-cvs');
        if (!cvs || !window.RaceGame.active) return;
        if (e.cancelable) e.preventDefault();
        window.RaceGame.finger = pos(e, cvs);
    }
    function move(e) {
        if (!window.RaceGame.finger) return;
        var cvs = raceEl('race-cvs');
        if (!cvs) return;
        if (e.cancelable) e.preventDefault();
        window.RaceGame.finger = pos(e, cvs);
    }
    function up(e) {
        if (e && e.cancelable) e.preventDefault();
        window.RaceGame.finger = null;
    }
    window.addEventListener('load', function () {
        var cvs = raceEl('race-cvs');
        if (!cvs) return;
        cvs.addEventListener('pointerdown', down);
        cvs.addEventListener('pointermove', move);
        cvs.addEventListener('pointerup', up);
        cvs.addEventListener('pointercancel', up);
        cvs.addEventListener('touchstart', down, { passive: false });
        cvs.addEventListener('touchmove', move, { passive: false });
        cvs.addEventListener('touchend', up, { passive: false });
    });
    window.addEventListener('resize', function () {
        if (window.RaceGame.active && window.RaceGame.phase !== 'rules') raceSizeCanvas();
    });
})();
