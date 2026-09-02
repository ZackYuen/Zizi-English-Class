// ==========================================
// 🎈 音爆射擊 — lots of balloons, fill 10 energy drops per word
// Tap matching balloons. Each hit adds one energy drop.
// Fill 10 drops to learn the word and move on. 5 words = done.
// ==========================================

window.ShootGame = {
    active: false,
    phase: 'play',
    raf: 0,
    STARS: 5,
    NEED: 10,
    FLOAT: 10,
    got: 0,
    power: 0,
    found: [],
    target: null,
    decoys: [],
    queue: [],
    balloons: [],
    W: 320,
    H: 420,
    ctx: null,
    busy: false,
    bob: 0,
    beam: null
};

function shEl(id) { return document.getElementById(id); }

function shootColors() {
    return ['#ff6b6b', '#4dabf7', '#845ef7', '#51cf66', '#ff922b', '#f06595', '#20c997', '#fcc419'];
}

function shootRadius() {
    var W = window.ShootGame.W || 320;
    return Math.min(40, Math.max(30, W * 0.1));
}

function shootCountCorrect() {
    var g = window.ShootGame;
    var word = g.target && g.target.w;
    var n = 0;
    for (var i = 0; i < g.balloons.length; i++) {
        if (g.balloons[i].item && g.balloons[i].item.w === word) n += 1;
    }
    return n;
}

function shootPickItem() {
    var g = window.ShootGame;
    if (!g.target) return Curriculum.pickLesson(1)[0];
    if (shootCountCorrect() < 4) return g.target;
    if (Math.random() < 0.55) return g.target;
    if (g.decoys && g.decoys.length) {
        return g.decoys[Math.floor(Math.random() * g.decoys.length)];
    }
    return g.target;
}

function shootMakeBalloon(item, fromBottom) {
    var colors = shootColors();
    return {
        item: item,
        x: 0.12 + Math.random() * 0.76,
        y: fromBottom ? (1.08 + Math.random() * 0.28) : (0.16 + Math.random() * 0.72),
        vy: 0.07 + Math.random() * 0.055,
        color: colors[Math.floor(Math.random() * colors.length)],
        wob: Math.random() * Math.PI * 2
    };
}

function shootFillSky(fresh) {
    var g = window.ShootGame;
    if (fresh) g.balloons = [];
    while (g.balloons.length < g.FLOAT) {
        g.balloons.push(shootMakeBalloon(shootPickItem(), g.balloons.length >= 6));
    }
}

function shootEnergyHud() {
    var g = window.ShootGame;
    var el = shEl('shoot-energy');
    if (!el) return;
    var bits = [];
    for (var i = 0; i < g.NEED; i++) {
        bits.push('<span class="shoot-drop' + (i < g.power ? ' is-on' : '') + '"></span>');
    }
    el.innerHTML = '<div class="shoot-energy-track">' + bits.join('') +
        '<b class="shoot-energy-n">' + g.power + '/' + g.NEED + '</b></div>';
}

function shootHud() {
    var g = window.ShootGame;
    Curriculum.stars(shEl('shoot-stars'), g.got, g.STARS);
    shootEnergyHud();
    var tgt = shEl('shoot-target');
    if (tgt) {
        if (g.target) {
            Curriculum.fillTarget(tgt, g.target.w);
        } else {
            tgt.textContent = '射十個波波，加滿能源';
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

function shootNewRound(announce) {
    var g = window.ShootGame;
    if (!g.queue.length) g.queue = Curriculum.pickLesson(g.STARS + 3, []);
    g.target = g.queue[g.got] || Curriculum.pickLesson(1)[0];
    g.decoys = Curriculum.decoys(g.target, 6);
    g.power = 0;
    g.busy = false;
    g.beam = null;
    shootFillSky(true);
    shootHud();
    if (announce && g.phase === 'play' && g.target) {
        Curriculum.voiceCatch(
            Curriculum.say('射十個 ' + g.target.w + ' 波波！').then(function () {
                if (g.active && g.phase === 'play' && g.target) return Curriculum.speakEn(g.target.w);
            })
        );
    }
}

/** Pure hit math: one correct pop. Returns 'energy' | 'word' | 'finish'. */
function shootApplyCorrect(g) {
    if (g.power < g.NEED) g.power += 1;
    if (g.power < g.NEED) return 'energy';
    return (g.got + 1 >= g.STARS) ? 'finish' : 'word';
}

function shootDraw() {
    var g = window.ShootGame;
    var ctx = g.ctx;
    if (!ctx) return;
    var W = g.W;
    var H = g.H;
    var r = shootRadius();

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

    var rocketX = W / 2;
    var rocketY = H - H * 0.11;
    if (g.beam && g.beam.t > 0) {
        ctx.strokeStyle = 'rgba(255, 230, 80, 0.95)';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(rocketX, rocketY - 18);
        ctx.lineTo(g.beam.x, g.beam.y);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(rocketX, rocketY - 18);
        ctx.lineTo(g.beam.x, g.beam.y);
        ctx.stroke();
    }

    g.balloons.forEach(function (b) {
        var x = b.x * W;
        var y = b.y * H + Math.sin(g.bob * 2 + b.wob) * 5;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * 1.22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.beginPath();
        ctx.ellipse(x - r * 0.32, y - r * 0.38, r * 0.22, r * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#123b63';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y + r * 1.22);
        ctx.lineTo(x, y + r * 1.22 + H * 0.035);
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        var fs = window.ZiziArt
            ? window.ZiziArt.fitWord(ctx, b.item.w, r * 1.85, Math.min(28, r * 0.72))
            : 22;
        ctx.font = '800 ' + fs + 'px Fredoka, sans-serif';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#123b63';
        ctx.lineWidth = 5;
        ctx.strokeText(b.item.w, x, y);
        ctx.fillStyle = '#fff';
        ctx.fillText(b.item.w, x, y);
    });

    if (window.ZiziArt) {
        window.ZiziArt.drawWord(ctx, 'rocket', rocketX, rocketY, H * 0.14, g.bob);
    }
}

function shootPopFx(label) {
    if (window.ZiziFX) {
        window.ZiziFX.play('pop');
        window.ZiziFX.floatScore(shEl('shoot-play'), label || '+💧', 'good');
    } else if (Curriculum.pop) {
        Curriculum.pop();
    }
}

function shootClearWord() {
    var g = window.ShootGame;
    var item = g.target;
    var word = item && item.w;
    g.found.push(item);
    g.got += 1;
    Curriculum.popBalloon(shEl('shoot-overlay'), null, g.got);
    Curriculum.award(0, {
        word: word,
        emoji: item && item.emoji,
        letter: item && item.l,
        reason: '射擊學到 ' + word
    });
    shootHud();
    if (word) Curriculum.speakEn(word);
    g.busy = true;
    setTimeout(function () {
        g.busy = false;
        if (!g.active) return;
        if (g.got >= g.STARS) {
            shootFinish();
            return;
        }
        shootNewRound(true);
    }, 650);
}

function shootHit(b) {
    var g = window.ShootGame;
    if (g.busy || g.phase !== 'play' || !g.target) return;
    var word = g.target.w;
    var W = g.W;
    var H = g.H;
    g.beam = {
        x: b.x * W,
        y: b.y * H + Math.sin(g.bob * 2 + b.wob) * 5,
        t: 0.16
    };
    if (b.item.w === word) {
        var result = shootApplyCorrect(g);
        shootHud();
        g.balloons = g.balloons.filter(function (x) { return x !== b; });
        if (result === 'energy') {
            shootPopFx('+💧');
            g.balloons.push(shootMakeBalloon(shootPickItem(), true));
            return;
        }
        shootPopFx('能源滿啦！');
        if (result === 'finish' || result === 'word') shootClearWord();
        return;
    }
    if (window.ZiziFX) {
        window.ZiziFX.play('wrong');
        window.ZiziFX.floatScore(shEl('shoot-play'), '唔係呢個', 'bad');
    } else {
        Curriculum.missFx(shEl('shoot-play'), '碰！');
    }
    Curriculum.speakEn(b.item.w);
    g.balloons = g.balloons.filter(function (x) { return x !== b; });
    g.balloons.push(shootMakeBalloon(shootPickItem(), true));
}

function shootUpdate(dt) {
    var g = window.ShootGame;
    if (g.phase !== 'play') return;
    g.bob += dt * 4;
    if (g.beam) {
        g.beam.t -= dt;
        if (g.beam.t <= 0) g.beam = null;
    }
    if (g.busy) return;
    g.balloons.forEach(function (b) {
        b.y -= b.vy * dt;
        b.x += Math.sin(g.bob + b.wob) * 0.012 * dt;
        if (b.x < 0.08) b.x = 0.08;
        if (b.x > 0.92) b.x = 0.92;
        if (b.y < -0.22) {
            b.item = shootPickItem();
            b.x = 0.12 + Math.random() * 0.76;
            b.y = 1.08 + Math.random() * 0.2;
            b.vy = 0.07 + Math.random() * 0.055;
            b.color = shootColors()[Math.floor(Math.random() * shootColors().length)];
        }
    });
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
        title: '能源充滿！',
        sub: '射中 ' + (g.STARS * g.NEED) + ' 個波波',
        stars: 1
    });
    var title = shEl('shoot-over-title');
    var sub = shEl('shoot-over-sub');
    var list = shEl('shoot-over-words');
    if (title) title.textContent = '能源充滿！';
    if (sub) sub.textContent = '每個字射中 ' + g.NEED + ' 個波波 · +1⭐';
    if (list) {
        list.innerHTML = (g.found.length ? g.found : g.queue.slice(0, g.got)).map(function (w) {
            return '<li><span>' + w.emoji + '</span> <b>' + w.w + '</b> ' + (Curriculum.yue(w.w) || '') + '</li>';
        }).join('') || '<li>再射多啲氣球！</li>';
    }
    Curriculum.say('能源充滿！你射得好準。');
}

window.stopShootGame = function () {
    var g = window.ShootGame;
    g.active = false;
    g.phase = 'play';
    g.busy = false;
    g.beam = null;
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
    g.power = 0;
    g.found = [];
    g.queue = Curriculum.pickLesson(g.STARS + 2);
    g.target = null;
    g.busy = false;
    g.beam = null;
    Curriculum.bootFx();
    shootShowOver(false);
    shootSizeCanvas();
    shootNewRound(false);
    shootDraw();
    requestAnimationFrame(function () {
        shootSizeCanvas();
        shootDraw();
        shootHud();
    });
    if (g.raf) cancelAnimationFrame(g.raf);
    g.raf = requestAnimationFrame(function () { shootLoop(performance.now()); });
    Curriculum.voiceCatch(
        Curriculum.say('好多波波，射十個啱嘅先換下一個字。開始！').then(function () {
            if (g.active && g.phase === 'play' && g.target) return Curriculum.speakEn(g.target.w);
        })
    );
};

window.replayShootWord = function () {
    var g = window.ShootGame;
    if (g.target) Curriculum.speakEn(g.target.w);
};

(function bindShootInput() {
    if (typeof document === 'undefined') return;
    function pos(e, el) {
        var r = el.getBoundingClientRect();
        var x = (e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX) - r.left;
        var y = (e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY) - r.top;
        return { x: x, y: y };
    }
    function down(e) {
        var g = window.ShootGame;
        if (!g.active || g.busy) return;
        var field = shEl('shoot-field');
        if (!field) return;
        if (e.cancelable) e.preventDefault();
        var p = pos(e, field);
        var W = g.W;
        var H = g.H;
        var hitR = shootRadius() * 1.15;
        var best = null;
        var bestD = hitR;
        for (var i = 0; i < g.balloons.length; i++) {
            var b = g.balloons[i];
            var bx = b.x * W;
            var by = b.y * H + Math.sin(g.bob * 2 + b.wob) * 5;
            var d = Math.hypot(p.x - bx, p.y - by);
            if (d < bestD) {
                best = b;
                bestD = d;
            }
        }
        if (best) shootHit(best);
    }
    function bind() {
        var field = shEl('shoot-field');
        if (!field || field._shootBound || !field.addEventListener) return;
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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        shootApplyCorrect: shootApplyCorrect,
        shootPickItem: shootPickItem,
        shootFillSky: shootFillSky,
        shootCountCorrect: shootCountCorrect
    };
}
