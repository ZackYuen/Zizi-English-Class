// ==========================================
// 🏎️ 字母賽車 — finger car hits the right picture
// Car follows your finger. Cards roll down. Crash the one you heard.
// No timer, no rival — fill 5 stars.
// ==========================================

window.RaceGame = {
    active: false,
    phase: 'play',
    raf: 0,
    STARS: 5,
    got: 0,
    words: [],
    found: [],
    target: null,
    cards: [],
    car: { x: 0.5 },
    scroll: 0,
    bob: 0,
    W: 320,
    H: 420,
    ctx: null,
    pending: false,
    holding: false,
    boost: 0,
    streaks: []
};

function raceEl(id) { return document.getElementById(id); }

function raceHud() {
    var g = window.RaceGame;
    Curriculum.stars(raceEl('race-stars'), g.got, g.STARS);
    var tgt = raceEl('race-target');
    if (tgt) {
        if (g.target) {
            Curriculum.fillTarget(tgt, g.target.w);
        } else {
            tgt.textContent = '拖住架車，按住就加速';
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

function raceLaneX(i) {
    var g = window.RaceGame;
    return g.W * (0.2 + i * 0.3);
}

function raceSpawn() {
    var g = window.RaceGame;
    if (!g.words.length) g.words = Curriculum.pickLesson(g.STARS + 3, []);
    g.target = g.words[g.got] || Curriculum.pickLesson(1)[0];
    var decoys = Curriculum.decoys(g.target, 2);
    var items = Curriculum.shuffle([g.target].concat(decoys).slice(0, 3));
    g.cards = items.map(function (item, i) {
        return { item: item, lane: i, y: -0.22 };
    });
    raceHud();
    if (g.phase === 'play' && g.target) {
        Curriculum.voiceCatch(
            Curriculum.say('撞 ' + g.target.w + '！').then(function () {
                if (g.active && g.phase === 'play') return Curriculum.speakEn(g.target.w);
            })
        );
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

function drawCarTop(ctx, x, y, color, boost) {
    ctx.save();
    ctx.translate(x, y);
    boost = boost || 0;
    if (boost > 0.08) {
        var wob = Math.sin(performance.now() / 40) * (8 + boost * 10);
        var flame = 22 + boost * 48 + wob;
        ctx.globalAlpha = 0.55 + boost * 0.4;
        ctx.fillStyle = '#7df9ff';
        ctx.beginPath();
        ctx.moveTo(-16, 36);
        ctx.lineTo(0, 40 + flame * 1.15);
        ctx.lineTo(16, 36);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffe066';
        ctx.beginPath();
        ctx.moveTo(-13, 38);
        ctx.lineTo(0, 38 + flame);
        ctx.lineTo(13, 38);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.moveTo(-7, 38);
        ctx.lineTo(0, 38 + flame * 0.62);
        ctx.lineTo(7, 38);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fff8e1';
        ctx.beginPath();
        ctx.moveTo(-3, 38);
        ctx.lineTo(0, 38 + flame * 0.32);
        ctx.lineTo(3, 38);
        ctx.closePath();
        ctx.fill();
    }
    ctx.shadowColor = boost > 0.2 ? '#ff9f1c' : '#fff59d';
    ctx.shadowBlur = boost > 0.2 ? 22 : 12;
    ctx.fillStyle = color;
    roundRect(ctx, -24, -42, 48, 84, 14);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#123b63';
    roundRect(ctx, -16, -24, 32, 20, 7);
    ctx.fill();
    ctx.fillStyle = '#a8e4ff';
    roundRect(ctx, -12, -20, 24, 12, 4);
    ctx.fill();
    ctx.fillStyle = '#1f1f1f';
    [-18, 18].forEach(function (wx) {
        ctx.beginPath();
        ctx.arc(wx, -22, 8, 0, Math.PI * 2);
        ctx.arc(wx, 22, 8, 0, Math.PI * 2);
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
    roundRect(ctx, W * 0.04, -20, W * 0.92, H + 40, 24);
    ctx.fill();
    if (g.boost > 0.2) {
        var heat = ctx.createLinearGradient(0, 0, 0, H);
        heat.addColorStop(0, 'rgba(255, 180, 40, 0)');
        heat.addColorStop(1, 'rgba(255, 90, 20, ' + (0.12 + g.boost * 0.22) + ')');
        ctx.fillStyle = heat;
        roundRect(ctx, W * 0.04, -20, W * 0.92, H + 40, 24);
        ctx.fill();
    }
    ctx.strokeStyle = g.boost > 0.35 ? '#fff3b0' : '#f4d35e';
    ctx.lineWidth = g.boost > 0.35 ? 7 : 5;
    ctx.setLineDash([22, 18]);
    ctx.lineDashOffset = g.scroll;
    [1, 2].forEach(function (i) {
        ctx.beginPath();
        ctx.moveTo(W * (i / 3), 0);
        ctx.lineTo(W * (i / 3), H);
        ctx.stroke();
    });
    ctx.setLineDash([]);

    if (g.streaks) {
        g.streaks.forEach(function (s) {
            if (g.boost < 0.12) return;
            var x = s.x * W;
            var y = s.y * H;
            var len = s.len * H * (0.7 + g.boost);
            ctx.strokeStyle = 'rgba(255,255,255,' + (0.25 + g.boost * 0.55) + ')';
            ctx.lineWidth = s.w + g.boost * 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + len);
            ctx.stroke();
        });
    }

    g.cards.forEach(function (card) {
        var x = raceLaneX(card.lane);
        var y = H * card.y;
        var word = card.item.w;
        var w = W * 0.26;
        var h = Math.max(128, H * 0.26);
        var hasArt = window.ZiziArt && window.ZiziArt.has(word);
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#123b63';
        ctx.lineWidth = 4;
        roundRect(ctx, -w / 2, -h / 2, w, h, 18);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#123b63';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (hasArt) {
            window.ZiziArt.drawWord(ctx, word, 0, -h * 0.22, Math.round(h * 0.4), g.bob, true);
            var fs = window.ZiziArt.fitWord(ctx, word, w * 0.88, h * 0.32);
            ctx.fillStyle = '#123b63';
            ctx.font = '800 ' + fs + 'px Fredoka, sans-serif';
            ctx.fillText(word, 0, h * 0.28);
        } else {
            var fs2 = window.ZiziArt && window.ZiziArt.fitWord
                ? window.ZiziArt.fitWord(ctx, word, w * 0.88, h * 0.46)
                : Math.round(h * 0.36);
            ctx.font = '800 ' + fs2 + 'px Fredoka, sans-serif';
            ctx.fillText(word, 0, 0);
        }
        ctx.restore();
    });

    var cy = H * 0.82;
    var shake = g.boost > 0.25 ? (Math.random() - 0.5) * g.boost * 8 : 0;
    drawCarTop(ctx, g.car.x * W + shake, cy + Math.sin(g.bob) * 3, '#e63946', g.boost);
    ctx.fillStyle = g.holding ? '#ff9f1c' : 'rgba(255,255,255,0.92)';
    ctx.font = g.holding ? '800 28px Fredoka, sans-serif' : '800 18px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = g.holding ? '#123b63' : 'transparent';
    ctx.lineWidth = g.holding ? 5 : 0;
    var label = g.holding ? '🔥 加速！！' : '拖住架紅車 · 按住加速';
    if (g.holding) ctx.strokeText(label, W / 2, 34);
    ctx.fillText(label, W / 2, 34);
}

function raceHit(card) {
    var g = window.RaceGame;
    if (g.pending || g.phase !== 'play') return;
    g.pending = true;
    var word = g.target.w;
    if (card.item.w === word) {
        g.combo = (g.combo || 0) + 1;
        g.got += 1;
        g.found.push(g.target);
        Curriculum.hitFx(raceEl('race-overlay'), null, g.combo);
        Curriculum.award(0, {
            word: word,
            emoji: card.item.emoji,
            letter: card.item.l,
            reason: '賽車學到 ' + word
        });
        raceHud();
        Curriculum.speakEn(word);
        setTimeout(function () {
            g.pending = false;
            if (!g.active) return;
            if (g.got >= g.STARS) {
                raceFinish();
                return;
            }
            raceSpawn();
        }, 500);
    } else {
        Curriculum.missFx(raceEl('race-play'), '碰！');
        Curriculum.speakEn(card.item.w);
        card.y = -0.22;
        g.pending = false;
    }
}

/** 0 = cruise, 1 = full boost. Cards fall this much of the track per second. */
function raceCardSpeed(boost) {
    boost = Math.max(0, Math.min(1, boost || 0));
    return 0.10 + boost * 0.38;
}

function raceDashSpeed(boost) {
    boost = Math.max(0, Math.min(1, boost || 0));
    return 140 + boost * 420;
}

function raceEnsureStreaks() {
    var g = window.RaceGame;
    if (g.streaks && g.streaks.length) return;
    g.streaks = [];
    for (var i = 0; i < 22; i++) {
        g.streaks.push({
            x: 0.08 + Math.random() * 0.84,
            y: Math.random(),
            len: 0.05 + Math.random() * 0.14,
            w: 1 + Math.random() * 2.2
        });
    }
}

function raceSyncBoostFx() {
    var g = window.RaceGame;
    var overlay = raceEl('race-overlay');
    var on = g.active && g.phase === 'play' && g.boost > 0.22;
    if (overlay) overlay.classList.toggle('is-boosting', on);
    if (window.ZiziFX) window.ZiziFX.setEngine(g.active && g.holding ? g.boost : 0);
}

function raceUpdate(dt) {
    var g = window.RaceGame;
    if (g.phase !== 'play') return;
    var want = g.holding ? 1 : 0;
    g.boost += (want - g.boost) * Math.min(1, dt * 8);
    g.scroll += raceDashSpeed(g.boost) * dt;
    g.bob += dt * (7 + g.boost * 10);
    raceEnsureStreaks();
    var fall = raceCardSpeed(g.boost);
    g.streaks.forEach(function (s) {
        s.y += (0.9 + g.boost * 3.4) * dt;
        if (s.y > 1.1) {
            s.y = -0.15;
            s.x = 0.08 + Math.random() * 0.84;
        }
    });
    if (!g.pending) {
        g.cards.forEach(function (card) {
            card.y += fall * dt;
            if (card.y > 0.68 && card.y < 0.96) {
                var cx = g.car.x * g.W;
                var laneX = raceLaneX(card.lane);
                if (Math.abs(cx - laneX) < g.W * 0.16) raceHit(card);
            }
            if (card.y > 1.25) card.y = -0.22;
        });
    }
    raceSyncBoostFx();
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

function raceFinish() {
    var g = window.RaceGame;
    g.phase = 'over';
    g.holding = false;
    g.boost = 0;
    if (window.ZiziFX) window.ZiziFX.stopEngine();
    var overlay = raceEl('race-overlay');
    if (overlay) overlay.classList.remove('is-boosting');
    if (g.raf) { cancelAnimationFrame(g.raf); g.raf = 0; }
    Curriculum.award(1, { reason: '完成字母賽車', quest: 'listen' });
    if (window.markQuest) window.markQuest('listen');
    raceShowOver(true);
    Curriculum.finishFx({
        emoji: '🏁',
        title: '撞齊晒！',
        sub: '學咗 ' + g.got + ' 個字',
        stars: 1
    });
    var title = raceEl('race-over-title');
    var sub = raceEl('race-over-sub');
    var list = raceEl('race-over-words');
    if (title) title.textContent = '撞齊晒！';
    if (sub) sub.textContent = '學咗 ' + g.got + ' 個字 · +1⭐';
    if (list) {
        list.innerHTML = (g.found.length ? g.found : g.words.slice(0, g.got)).map(function (w) {
            return '<li><span>' + w.emoji + '</span> <b>' + w.w + '</b> ' + (Curriculum.yue(w.w) || '') + '</li>';
        }).join('') || '<li>再拖車撞多啲圖！</li>';
    }
    Curriculum.say('撞齊晒！你架車好快。');
}

window.stopRaceGame = function () {
    var g = window.RaceGame;
    g.active = false;
    g.phase = 'play';
    g.pending = false;
    g.holding = false;
    g.boost = 0;
    g.streaks = [];
    if (window.ZiziFX) window.ZiziFX.stopEngine();
    if (g.raf) { cancelAnimationFrame(g.raf); g.raf = 0; }
    raceShowOver(false);
    var overlay = raceEl('race-overlay');
    if (overlay) overlay.classList.remove('is-urgent', 'z-fx-shake', 'is-boosting');
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
    g.phase = 'play';
    g.got = 0;
    g.found = [];
    g.words = Curriculum.pickLesson(g.STARS + 2);
    g.target = null;
    g.car.x = 0.5;
    g.pending = false;
    g.holding = false;
    g.boost = 0;
    g.streaks = [];
    Curriculum.bootFx();
    raceShowOver(false);
    raceHud();
    raceSizeCanvas();
    raceSpawn();
    raceDraw();
    requestAnimationFrame(function () {
        raceSizeCanvas();
        raceSpawn();
        raceDraw();
    });
    if (g.raf) cancelAnimationFrame(g.raf);
    g.raf = requestAnimationFrame(function () { raceLoop(performance.now()); });
    Curriculum.say('拖住架紅車，按住就加速。開始！');
};

window.replayRaceWord = function () {
    var g = window.RaceGame;
    if (!g.target) return;
    Curriculum.speakEn(g.target.w);
};

(function bindRaceInput() {
    if (typeof document === 'undefined') return;
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
        window.RaceGame.car.x = Math.max(0.1, Math.min(0.9, t));
    }
    function setHold(on) {
        var g = window.RaceGame;
        var was = g.holding;
        g.holding = !!on && g.active && g.phase === 'play';
        if (g.holding && !was && window.ZiziFX) {
            window.ZiziFX.play('nitro');
            window.ZiziFX.startEngine();
        }
        if (!g.holding && window.ZiziFX) window.ZiziFX.stopEngine();
    }
    function down(e) {
        var wrap = raceEl('race-canvas-wrap');
        if (!wrap || !window.RaceGame.active) return;
        if (e.cancelable) e.preventDefault();
        if (e.pointerId != null && wrap.setPointerCapture) {
            try { wrap.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        }
        setHold(true);
        setCar(x(e));
    }
    function move(e) {
        if (!window.RaceGame.active) return;
        if (e.cancelable) e.preventDefault();
        setCar(x(e));
    }
    function up() {
        setHold(false);
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
        wrap.addEventListener('touchend', up);
        wrap.addEventListener('touchcancel', up);
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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { raceCardSpeed: raceCardSpeed, raceDashSpeed: raceDashSpeed };
}
