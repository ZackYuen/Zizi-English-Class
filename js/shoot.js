// ==========================================
// 🎈 音爆射擊 — pop the balloon before it floats away
// Balloons rise. Tap the one you heard; rocket fires.
// Fill 5 stars.
// ==========================================

window.ShootGame = {
    active: false,
    phase: 'play',
    raf: 0,
    STARS: 5,
    got: 0,
    target: null,
    queue: [],
    balloons: [],
    W: 320,
    H: 420,
    ctx: null,
    pending: false,
    bob: 0
};

function shEl(id) { return document.getElementById(id); }

function shootHud() {
    var g = window.ShootGame;
    Curriculum.stars(shEl('shoot-stars'), g.got, g.STARS);
    var tgt = shEl('shoot-target');
    if (tgt) {
        if (g.target) {
            tgt.innerHTML = '🚀 射 <span class="stage-word">' + g.target.w + '</span>';
        } else {
            tgt.textContent = '撳啱氣球，火箭射爆佢';
        }
    }
}

function shootSizeCanvas() {
    var field = shEl('shoot-field');
    if (!field) return;
    var cvs = field.querySelector('.shoot-cvs');
    if (!cvs) {
        cvs = document.createElement('canvas');
        cvs.className = 'shoot-cvs';
        field.innerHTML = '';
        field.appendChild(cvs);
    }
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = Math.max(200, field.clientWidth || 320);
    var h = Math.max(240, field.clientHeight || 400);
    cvs.width = Math.round(w * dpr);
    cvs.height = Math.round(h * dpr);
    var ctx = cvs.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    window.ShootGame.ctx = ctx;
    window.ShootGame.W = w;
    window.ShootGame.H = h;
}

function shootSpawn() {
    var g = window.ShootGame;
    if (!g.queue.length) g.queue = Curriculum.pickLesson(g.STARS + 3, []);
    g.target = g.queue[g.got] || Curriculum.pickLesson(1)[0];
    var decoys = Curriculum.decoys(g.target, 2);
    var items = Curriculum.shuffle([g.target].concat(decoys).slice(0, 3));
    var colors = ['#ff6b6b', '#4dabf7', '#845ef7'];
    g.balloons = items.map(function (item, i) {
        return { item: item, x: 0.18 + i * 0.32, y: 1.15 + i * 0.12, color: colors[i] };
    });
    shootHud();
    if (g.phase === 'play' && g.target) {
        Curriculum.say('射 ' + g.target.w + '！').then(function () {
            if (g.active && g.phase === 'play') return Curriculum.speakEn(g.target.w);
        });
    }
}

function shootDraw() {
    var g = window.ShootGame;
    var ctx = g.ctx;
    if (!ctx) return;
    var W = g.W;
    var H = g.H;

    var sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#7ec8ff');
    sky.addColorStop(1, '#d4f4ff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#fff59d';
    ctx.beginPath();
    ctx.arc(W * 0.85, H * 0.1, H * 0.045, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (var i = 0; i < 4; i++) {
        var cy = H * (0.14 + (i % 2) * 0.12);
        var cx = ((g.bob * 20 + i * 90) % (W + 120)) - 60;
        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.arc(cx + 18, cy + 4, 14, 0, Math.PI * 2);
        ctx.fill();
    }

    g.balloons.forEach(function (b) {
        var x = b.x * W;
        var y = b.y * H + Math.sin(g.bob * 2 + b.x * 5) * 6;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.ellipse(x, y, W * 0.14, W * 0.175, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.beginPath();
        ctx.ellipse(x - W * 0.04, y - W * 0.06, W * 0.03, W * 0.045, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#123b63';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y + W * 0.175);
        ctx.lineTo(x, y + W * 0.175 + H * 0.05);
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        var fs = window.ZiziArt
            ? window.ZiziArt.fitWord(ctx, b.item.w, W * 0.24, W * 0.13)
            : 32;
        ctx.font = '800 ' + fs + 'px Fredoka, sans-serif';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#123b63';
        ctx.lineWidth = 5;
        ctx.strokeText(b.item.w, x, y);
        ctx.fillStyle = '#fff';
        ctx.fillText(b.item.w, x, y);
    });

    if (window.ZiziArt) {
        window.ZiziArt.drawWord(ctx, 'rocket', W / 2, H - H * 0.12, H * 0.16, g.bob);
    }
}

function shootHit(b) {
    var g = window.ShootGame;
    if (g.pending || g.phase !== 'play') return;
    g.pending = true;
    var word = g.target.w;
    if (b.item.w === word) {
        g.got += 1;
        Curriculum.popBalloon(shEl('shoot-overlay'), null, g.got);
        Curriculum.award(0, {
            word: word,
            emoji: b.item.emoji,
            letter: b.item.l,
            reason: '射擊學到 ' + word
        });
        shootHud();
        Curriculum.speakEn(word);
        g.balloons = g.balloons.filter(function (x) { return x !== b; });
        setTimeout(function () {
            g.pending = false;
            if (!g.active) return;
            if (g.got >= g.STARS) {
                shootFinish();
                return;
            }
            shootSpawn();
        }, 500);
    } else {
        Curriculum.missFx(shEl('shoot-play'), '碰！');
        Curriculum.speakEn(b.item.w);
        b.y = 1.2;
        g.pending = false;
    }
}

function shootUpdate(dt) {
    var g = window.ShootGame;
    if (g.phase !== 'play') return;
    g.bob += dt * 4;
    if (!g.pending) {
        g.balloons.forEach(function (b) {
            b.y -= 0.12 * dt;
            if (b.y < -0.25) b.y = 1.15;
        });
    }
}

function shootLoop(prev) {
    if (!window.ShootGame.active) return;
    var now = performance.now();
    var dt = Math.min(0.05, (now - prev) / 1000);
    shootUpdate(dt);
    shootDraw();
    window.ShootGame.raf = requestAnimationFrame(function () { shootLoop(now); });
}

function shootShowOver(on) {
    var el = shEl('shoot-over');
    if (!el) return;
    el.style.display = on ? 'flex' : 'none';
    el.classList.toggle('is-open', on);
}

function shootFinish() {
    var g = window.ShootGame;
    g.phase = 'over';
    if (g.raf) { cancelAnimationFrame(g.raf); g.raf = 0; }
    Curriculum.award(1, { reason: '完成音爆射擊', quest: 'listen' });
    if (window.markQuest) window.markQuest('listen');
    shootShowOver(true);
    Curriculum.finishFx({
        emoji: '🎈',
        title: '射爆晒！',
        sub: '射中 ' + g.got + ' 個氣球',
        stars: 1
    });
    var title = shEl('shoot-over-title');
    var sub = shEl('shoot-over-sub');
    var list = shEl('shoot-over-words');
    if (title) title.textContent = '射爆晒！';
    if (sub) sub.textContent = '射中 ' + g.got + ' 個氣球 · +1⭐';
    if (list) {
        list.innerHTML = g.queue.slice(0, g.got).map(function (w) {
            return '<li><span>' + w.emoji + '</span> <b>' + w.w + '</b> ' + (Curriculum.yue(w.w) || '') + '</li>';
        }).join('') || '<li>再射多啲氣球！</li>';
    }
    Curriculum.say('射爆晒！你手好快。');
}

window.stopShootGame = function () {
    var g = window.ShootGame;
    g.active = false;
    g.phase = 'play';
    g.pending = false;
    if (g.raf) { cancelAnimationFrame(g.raf); g.raf = 0; }
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
    g.phase = 'play';
    g.got = 0;
    g.queue = Curriculum.pickLesson(g.STARS + 2);
    g.target = null;
    g.pending = false;
    Curriculum.bootFx();
    shootShowOver(false);
    shootSizeCanvas();
    shootSpawn();
    shootDraw();
    requestAnimationFrame(function () {
        shootSizeCanvas();
        shootSpawn();
        shootDraw();
    });
    if (g.raf) cancelAnimationFrame(g.raf);
    g.raf = requestAnimationFrame(function () { shootLoop(performance.now()); });
    Curriculum.say('氣球會飛走，撳啱嗰個射爆佢。開始！');
};

window.replayShootWord = function () {
    var g = window.ShootGame;
    if (g.target) Curriculum.speakEn(g.target.w);
};

(function bindShootInput() {
    function pos(e, el) {
        var r = el.getBoundingClientRect();
        var x = (e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX) - r.left;
        var y = (e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY) - r.top;
        return { x: x, y: y };
    }
    function down(e) {
        var g = window.ShootGame;
        if (!g.active) return;
        var field = shEl('shoot-field');
        if (!field) return;
        if (e.cancelable) e.preventDefault();
        var p = pos(e, field);
        var W = g.W;
        var H = g.H;
        for (var i = 0; i < g.balloons.length; i++) {
            var b = g.balloons[i];
            var bx = b.x * W;
            var by = b.y * H + Math.sin(g.bob * 2 + b.x * 5) * 6;
            if (Math.hypot(p.x - bx, p.y - by) < W * 0.17) {
                shootHit(b);
                return;
            }
        }
    }
    function bind() {
        var field = shEl('shoot-field');
        if (!field || field._shootBound) return;
        field._shootBound = true;
        field.addEventListener('pointerdown', down);
        field.addEventListener('touchstart', down, { passive: false });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();
    window.addEventListener('load', bind);
    window.addEventListener('resize', function () {
        if (window.ShootGame.active) {
            shootSizeCanvas();
            shootDraw();
        }
    });
})();

window.startGame = window.startShootGame;
window.exitGame = function () {
    window.stopShootGame();
    if (window.backToHome) window.backToHome();
};
