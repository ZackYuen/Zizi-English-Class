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
    target: null,
    cards: [],
    car: { x: 0.5 },
    scroll: 0,
    bob: 0,
    W: 320,
    H: 420,
    ctx: null,
    pending: false
};

function raceEl(id) { return document.getElementById(id); }

function raceHud() {
    var g = window.RaceGame;
    Curriculum.stars(raceEl('race-stars'), g.got, g.STARS);
    var tgt = raceEl('race-target');
    if (tgt) {
        if (g.target) {
            tgt.innerHTML = '🚗 <span class="stage-word">' + g.target.w + '</span>';
        } else {
            tgt.textContent = '拖住架車去撞啱嗰幅圖';
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
        Curriculum.say('撞 ' + g.target.w + '！').then(function () {
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

function drawCarTop(ctx, x, y, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.shadowColor = '#fff59d';
    ctx.shadowBlur = 12;
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
    ctx.strokeStyle = '#f4d35e';
    ctx.lineWidth = 5;
    ctx.setLineDash([22, 18]);
    ctx.lineDashOffset = g.scroll;
    [1, 2].forEach(function (i) {
        ctx.beginPath();
        ctx.moveTo(W * (i / 3), 0);
        ctx.lineTo(W * (i / 3), H);
        ctx.stroke();
    });
    ctx.setLineDash([]);

    g.cards.forEach(function (card) {
        var x = raceLaneX(card.lane);
        var y = H * card.y;
        var good = g.target && card.item.w === g.target.w;
        var word = card.item.w;
        var w = W * 0.26;
        var h = Math.max(128, H * 0.26);
        var hasArt = window.ZiziArt && window.ZiziArt.has(word);
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = good ? '#d8f3dc' : '#fff';
        ctx.strokeStyle = good ? '#2ecc71' : '#123b63';
        ctx.lineWidth = good ? 6 : 4;
        roundRect(ctx, -w / 2, -h / 2, w, h, 18);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#123b63';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (hasArt) {
            var pulse = good ? 1 + Math.sin(g.bob * 2) * 0.08 : 1;
            window.ZiziArt.drawWord(ctx, word, 0, -h * 0.22, Math.round(h * 0.4 * pulse), g.bob, true);
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
    drawCarTop(ctx, g.car.x * W, cy + Math.sin(g.bob) * 3, '#e63946');

    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = '800 20px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('拖住架紅車', W / 2, 28);
}

function raceHit(card) {
    var g = window.RaceGame;
    if (g.pending || g.phase !== 'play') return;
    g.pending = true;
    var word = g.target.w;
    if (card.item.w === word) {
        g.combo = (g.combo || 0) + 1;
        g.got += 1;
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

function raceUpdate(dt) {
    var g = window.RaceGame;
    if (g.phase !== 'play') return;
    g.scroll += 200 * dt;
    g.bob += dt * 7;
    if (!g.pending) {
        g.cards.forEach(function (card) {
            card.y += 0.14 * dt;
            if (card.y > 0.68 && card.y < 0.96) {
                var cx = g.car.x * g.W;
                var laneX = raceLaneX(card.lane);
                if (Math.abs(cx - laneX) < g.W * 0.16) raceHit(card);
            }
            if (card.y > 1.25) card.y = -0.22;
        });
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

function raceFinish() {
    var g = window.RaceGame;
    g.phase = 'over';
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
        list.innerHTML = g.words.slice(0, g.got).map(function (w) {
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
    g.phase = 'play';
    g.got = 0;
    g.words = Curriculum.pickLesson(g.STARS + 2);
    g.target = null;
    g.car.x = 0.5;
    g.pending = false;
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
    Curriculum.say('拖住架紅車，撞啱嗰幅圖。開始！');
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
        window.RaceGame.car.x = Math.max(0.1, Math.min(0.9, t));
    }
    function down(e) {
        var wrap = raceEl('race-canvas-wrap');
        if (!wrap || !window.RaceGame.active) return;
        if (e.cancelable) e.preventDefault();
        if (e.pointerId != null && wrap.setPointerCapture) {
            try { wrap.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        }
        setCar(x(e));
    }
    function move(e) {
        if (!window.RaceGame.active) return;
        if (e.cancelable) e.preventDefault();
        setCar(x(e));
    }
    function bind() {
        var wrap = raceEl('race-canvas-wrap');
        if (!wrap || wrap._raceBound) return;
        wrap._raceBound = true;
        wrap.addEventListener('pointerdown', down);
        wrap.addEventListener('pointermove', move);
        wrap.addEventListener('touchstart', down, { passive: false });
        wrap.addEventListener('touchmove', move, { passive: false });
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
