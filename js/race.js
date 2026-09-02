// ==========================================
// 🏎️ 字母賽車 — push a toy car into the green garage
// How a 5-year-old plays Hot Wheels: finger glued to the car.
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
    car: { x: 0.5, y: 0.78 },
    finger: null,
    W: 320,
    H: 420,
    ctx: null,
    pending: false,
    bounce: 0
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
            tgt.textContent = '🚗 入 ' + g.target.emoji + ' ' + g.target.w;
        } else {
            tgt.textContent = '推架車入綠色車房';
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

function raceGarage(i) {
    var g = window.RaceGame;
    var pad = g.W * 0.04;
    var gw = (g.W - pad * 4) / 3;
    var gh = g.H * 0.32;
    return {
        x: pad + i * (gw + pad),
        y: g.H * 0.04,
        w: gw,
        h: gh
    };
}

function raceSpawnGates() {
    var g = window.RaceGame;
    if (!g.words.length) g.words = Curriculum.pickLesson(g.NEED + 4, g.collected.map(function (w) { return w.w; }));
    g.target = g.words[g.got] || Curriculum.pickLesson(1)[0];
    var decoys = Curriculum.decoys(g.target, 2);
    var items = Curriculum.shuffle([g.target].concat(decoys).slice(0, 3));
    while (items.length < 3) items.push(Curriculum.decoys(g.target, 1)[0] || g.target);
    g.gates = items;
    g.car.x = 0.5;
    g.car.y = 0.78;
    g.bounce = 0;
    raceHud();
    if (g.phase === 'play' && g.target) {
        Curriculum.say('推架車入 ' + g.target.w + ' 車房！').then(function () {
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

function raceDraw() {
    var g = window.RaceGame;
    var ctx = g.ctx;
    if (!ctx) return;
    var W = g.W;
    var H = g.H;

    var sky = ctx.createLinearGradient(0, 0, 0, H * 0.4);
    sky.addColorStop(0, '#7ec8ff');
    sky.addColorStop(1, '#d4f4ff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#6ecf4e';
    ctx.fillRect(0, H * 0.38, W, H);

    ctx.fillStyle = '#4a4a4a';
    roundRect(ctx, W * 0.08, H * 0.4, W * 0.84, H * 0.56, 18);
    ctx.fill();
    ctx.strokeStyle = '#f4d35e';
    ctx.lineWidth = 4;
    ctx.setLineDash([16, 14]);
    ctx.beginPath();
    ctx.moveTo(W * 0.5, H * 0.42);
    ctx.lineTo(W * 0.5, H * 0.94);
    ctx.stroke();
    ctx.setLineDash([]);

    g.gates.forEach(function (item, i) {
        var box = raceGarage(i);
        var good = g.target && item.w === g.target.w;
        ctx.fillStyle = '#8d6e63';
        roundRect(ctx, box.x, box.y, box.w, box.h, 12);
        ctx.fill();
        ctx.fillStyle = good ? '#2ecc71' : '#5d4037';
        roundRect(ctx, box.x + 8, box.y + box.h * 0.28, box.w - 16, box.h * 0.66, 8);
        ctx.fill();
        if (good) {
            ctx.strokeStyle = '#fff59d';
            ctx.lineWidth = 5;
            ctx.stroke();
        }
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = Math.round(box.w * 0.38) + 'px serif';
        ctx.fillText(item.emoji, box.x + box.w / 2, box.y + box.h * 0.55);
        ctx.fillStyle = good ? '#fff59d' : '#fff';
        ctx.font = 'bold ' + Math.round(14 + box.w * 0.04) + 'px Fredoka, sans-serif';
        ctx.fillText(item.w, box.x + box.w / 2, box.y + box.h * 0.16);
    });

    var cx = g.car.x * W;
    var cy = g.car.y * H + (g.bounce ? Math.sin(g.bounce) * 8 : 0);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(g.bounce ? Math.sin(g.bounce) * 0.2 : 0);
    ctx.fillStyle = '#e63946';
    roundRect(ctx, -36, -24, 72, 48, 14);
    ctx.fill();
    ctx.font = '56px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚗', 0, -2);
    ctx.restore();

    ctx.fillStyle = 'rgba(18,59,99,0.8)';
    ctx.font = 'bold 15px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('拖住架車，推進綠色車房', W / 2, H - 16);
}

function raceInsideGarage() {
    var g = window.RaceGame;
    var cx = g.car.x * g.W;
    var cy = g.car.y * g.H;
    for (var i = 0; i < 3; i++) {
        var box = raceGarage(i);
        if (cx > box.x + 8 && cx < box.x + box.w - 8 && cy > box.y + box.h * 0.3 && cy < box.y + box.h) {
            return i;
        }
    }
    return -1;
}

function raceOnDoor(i) {
    var g = window.RaceGame;
    if (g.pending || g.phase !== 'play') return;
    var item = g.gates[i];
    if (!item) return;
    g.pending = true;
    g.finger = null;
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
        Curriculum.say('衝入！' + word).then(function () {
            return Curriculum.cheer(word, 'race-coach');
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
        Curriculum.missFx(raceEl('race-play'), '碰！');
        g.combo = 0;
        g.score = Math.max(0, g.score - 20);
        g.timeLeft = Math.max(0, g.timeLeft - 4);
        g.bounce = 12;
        g.car.x = 0.5;
        g.car.y = 0.8;
        raceHud();
        Curriculum.say('碰！唔係呢間。入綠色車房。').then(function () {
            if (g.active && g.target) return Curriculum.speakEn(g.target.w);
        }).then(function () {
            g.pending = false;
        });
    }
}

function raceUpdate(dt) {
    var g = window.RaceGame;
    if (g.bounce > 0) g.bounce = Math.max(0, g.bounce - dt * 18);
    if (g.phase !== 'play' || g.pending) return;
    if (g.finger) {
        g.car.x += (g.finger.x / g.W - g.car.x) * Math.min(1, dt * 18);
        g.car.y += (g.finger.y / g.H - g.car.y) * Math.min(1, dt * 18);
        g.car.x = Math.max(0.1, Math.min(0.9, g.car.x));
        g.car.y = Math.max(0.12, Math.min(0.9, g.car.y));
        var door = raceInsideGarage();
        if (door >= 0) raceOnDoor(door);
    }
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
        }).join('') || '<li>今轉未入到車房，再試過！</li>';
    }
    Curriculum.say(ok
        ? '衝線喇！今轉學咗 ' + g.got + ' 個英文單詞。'
        : '時間到！拖架車入綠色車房先有分。');
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
    g.car.x = 0.5;
    g.car.y = 0.78;
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
    Curriculum.say('拖住架紅色車，推進綠色車房。三、二、一！');

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
