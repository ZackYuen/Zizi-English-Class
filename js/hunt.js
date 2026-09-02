// ==========================================
// 🖼️ 尋寶圖 — three bushes fly around the field
// Hear English, tap the matching bush. No timer.
// ==========================================

window.HuntGame = {
    active: false,
    phase: 'play',
    STARS: 5,
    got: 0,
    found: [],
    target: null,
    queue: [],
    bushes: [],
    fly: [],
    raf: 0,
    busy: false,
    bob: 0
};

function huntEl(id) { return document.getElementById(id); }

function huntHud() {
    var g = window.HuntGame;
    Curriculum.stars(huntEl('hunt-stars'), g.got, g.STARS);
    var tgt = huntEl('hunt-target');
    if (tgt) {
        if (g.target) {
            Curriculum.fillTarget(tgt, g.target.w);
        } else {
            tgt.textContent = '聽英文，揭開草叢搵佢';
        }
    }
}

function huntShowOver(on) {
    var el = huntEl('hunt-over');
    if (!el) return;
    el.style.display = on ? 'flex' : 'none';
    el.classList.toggle('is-open', on);
}

function huntSceneSize() {
    var scene = huntEl('hunt-scene');
    if (!scene) return { w: 320, h: 420 };
    return {
        w: Math.max(200, scene.clientWidth || 320),
        h: Math.max(240, scene.clientHeight || 400)
    };
}

function huntBushSize(field) {
    return Math.min(128, Math.max(92, Math.min(field.w, field.h) * 0.28));
}

/** Bounce a flying bush inside the field. Pure math for tests. */
function huntStepFly(b, field, dt) {
    if (b.paused) return b;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    var maxX = Math.max(0, field.w - b.s);
    var maxY = Math.max(0, field.h - b.s);
    if (b.x < 0) { b.x = 0; b.vx = Math.abs(b.vx); }
    if (b.y < 0) { b.y = 0; b.vy = Math.abs(b.vy); }
    if (b.x > maxX) { b.x = maxX; b.vx = -Math.abs(b.vx); }
    if (b.y > maxY) { b.y = maxY; b.vy = -Math.abs(b.vy); }
    return b;
}

function huntSeparate(flies) {
    for (var i = 0; i < flies.length; i++) {
        for (var j = i + 1; j < flies.length; j++) {
            var a = flies[i];
            var b = flies[j];
            var dx = (b.x + b.s / 2) - (a.x + a.s / 2);
            var dy = (b.y + b.s / 2) - (a.y + a.s / 2);
            var d = Math.hypot(dx, dy) || 0.01;
            var min = (a.s + b.s) * 0.52;
            if (d >= min) continue;
            var push = (min - d) / 2;
            var ux = dx / d;
            var uy = dy / d;
            a.x -= ux * push;
            a.y -= uy * push;
            b.x += ux * push;
            b.y += uy * push;
        }
    }
}

function huntApplyFly(b) {
    if (!b.el) return;
    var wob = Math.sin(window.HuntGame.bob * 2.2 + b.wob) * 4;
    b.el.style.transform = 'translate(' + Math.round(b.x) + 'px,' + Math.round(b.y) + 'px) rotate(' + wob + 'deg)';
}

function huntPaintScene() {
    var g = window.HuntGame;
    var scene = huntEl('hunt-scene');
    if (!scene) return;
    scene.innerHTML = '';
    var field = huntSceneSize();
    var size = huntBushSize(field);
    g.fly = [];
    g.bushes.forEach(function (item, i) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'hunt-bush';
        btn.dataset.word = item.w;
        btn.setAttribute('aria-label', item.w);
        btn.style.width = size + 'px';
        btn.style.height = size + 'px';
        btn.innerHTML =
            '<canvas class="hunt-cover"></canvas>' +
            '<canvas class="hunt-art"></canvas>';
        btn.onclick = function () { huntTap(item, btn); };
        scene.appendChild(btn);

        var speed = 42 + Math.random() * 36;
        var ang = (i / 3) * Math.PI * 2 + Math.random() * 0.8;
        var fly = {
            el: btn,
            item: item,
            s: size,
            x: 12 + (i * (field.w - size - 24) / 2),
            y: 16 + (i % 2 === 0 ? field.h * 0.12 : field.h * 0.48) + Math.random() * 24,
            vx: Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed,
            wob: i * 1.7,
            paused: false
        };
        if (fly.y > field.h - size - 8) fly.y = Math.max(8, field.h - size - 8);
        g.fly.push(fly);
        huntApplyFly(fly);
    });
    huntSeparate(g.fly);
    g.fly.forEach(huntApplyFly);
    requestAnimationFrame(function () { huntPaintCanvases(); });
}

function huntPaintCanvases() {
    var scene = huntEl('hunt-scene');
    if (!scene || !window.ZiziArt) return;
    Array.prototype.forEach.call(scene.querySelectorAll('.hunt-bush'), function (btn, i) {
        var box = Math.max(80, Math.floor(Math.min(btn.clientWidth || 110, btn.clientHeight || 110) * 0.9));
        ['cover', 'art'].forEach(function (cls) {
            var cvs = btn.querySelector('.hunt-' + cls);
            if (!cvs) return;
            cvs.width = box * 2;
            cvs.height = box * 2;
            cvs.style.width = box + 'px';
            cvs.style.height = box + 'px';
            var c = cvs.getContext('2d');
            c.setTransform(2, 0, 0, 2, 0, 0);
            c.clearRect(0, 0, box, box);
            var word = cls === 'cover' ? 'bush' : btn.dataset.word;
            var size = cls === 'cover' ? box * 0.96 : box * 0.72;
            window.ZiziArt.drawWord(c, word, box / 2, box / 2, size, performance.now() / 1000 + i);
        });
    });
}

function huntUpdate(dt) {
    var g = window.HuntGame;
    if (g.phase !== 'play' || g.busy) return;
    g.bob += dt;
    var field = huntSceneSize();
    g.fly.forEach(function (b) {
        huntStepFly(b, field, dt);
    });
    huntSeparate(g.fly);
    var maxX = Math.max(0, field.w - (g.fly[0] && g.fly[0].s || 100));
    var maxY = Math.max(0, field.h - (g.fly[0] && g.fly[0].s || 100));
    g.fly.forEach(function (b) {
        b.x = Math.max(0, Math.min(maxX, b.x));
        b.y = Math.max(0, Math.min(maxY, b.y));
        huntApplyFly(b);
    });
}

function huntLoop(prev) {
    if (!window.HuntGame.active) return;
    var now = performance.now();
    var dt = Math.min(0.05, (now - prev) / 1000);
    huntUpdate(dt);
    window.HuntGame.raf = requestAnimationFrame(function () { huntLoop(now); });
}

function huntAsk() {
    var g = window.HuntGame;
    g.target = g.queue[g.got];
    g.busy = false;
    huntHud();
    if (!g.target) return;
    var others = Curriculum.decoys(g.target, 2);
    g.bushes = Curriculum.shuffle([g.target].concat(others)).slice(0, 3);
    huntPaintScene();
    Curriculum.say('邊個草叢入面係 ' + g.target.w + '？').then(function () {
        if (g.active && g.phase === 'play') return Curriculum.speakEn(g.target.w);
    });
}

function huntTap(item, btn) {
    var g = window.HuntGame;
    if (!g.active || g.phase !== 'play' || !g.target || g.busy) return;
    btn.classList.add('is-open');
    btn.style.zIndex = '6';
    if (item.w === g.target.w) {
        g.busy = true;
        g.fly.forEach(function (b) { b.paused = true; });
        g.got += 1;
        g.found.push(g.target);
        Curriculum.hitFx(huntEl('hunt-overlay'), null, g.got);
        Curriculum.award(0, {
            word: item.w,
            emoji: item.emoji,
            letter: item.l,
            reason: '尋寶學到 ' + item.w
        });
        huntHud();
        Curriculum.speakEn(item.w);
        setTimeout(function () {
            if (!g.active) return;
            if (g.got >= g.STARS) {
                huntFinish();
                return;
            }
            huntAsk();
        }, 800);
    } else {
        Curriculum.boom();
        Curriculum.speakEn(item.w);
        setTimeout(function () {
            btn.classList.remove('is-open');
            btn.style.zIndex = '';
        }, 900);
    }
}

function huntFinish() {
    var g = window.HuntGame;
    g.phase = 'over';
    g.busy = false;
    if (g.raf) { cancelAnimationFrame(g.raf); g.raf = 0; }
    Curriculum.award(1, { reason: '完成尋寶圖', quest: 'match' });
    if (window.markQuest) window.markQuest('match');
    huntShowOver(true);
    Curriculum.finishFx({
        emoji: '🖼️',
        title: '搵到晒！',
        sub: '揭開咗 ' + g.got + ' 個草叢',
        stars: 1
    });
    var title = huntEl('hunt-over-title');
    var sub = huntEl('hunt-over-sub');
    var list = huntEl('hunt-over-words');
    if (title) title.textContent = '搵到晒！';
    if (sub) sub.textContent = '揭開咗 ' + g.got + ' 個草叢 · +1⭐';
    if (list) {
        list.innerHTML = (g.found.length ? g.found : g.queue.slice(0, g.got)).map(function (w) {
            return '<li><span>' + w.emoji + '</span> <b>' + w.w + '</b> ' + (Curriculum.yue(w.w) || '') + '</li>';
        }).join('') || '<li>再揭開多啲草叢！</li>';
    }
    Curriculum.say('搵到晒！你耳朵好叻。');
}

window.stopHuntGame = function () {
    var g = window.HuntGame;
    g.active = false;
    g.phase = 'play';
    g.busy = false;
    g.fly = [];
    if (g.raf) { cancelAnimationFrame(g.raf); g.raf = 0; }
    huntShowOver(false);
    var overlay = huntEl('hunt-overlay');
    if (overlay) overlay.classList.remove('is-urgent', 'z-fx-shake');
    if (window.setDisplay) window.setDisplay('hunt-overlay', 'none');
};

window.startPictureHunt = function () {
    window.stopHuntGame();
    window.currentMode = 'match';
    if (window.setDisplay) {
        window.setDisplay('home-menu', 'none');
        window.setDisplay('hunt-overlay', 'flex');
    }
    var g = window.HuntGame;
    g.active = true;
    g.got = 0;
    g.found = [];
    g.queue = Curriculum.pickLesson(g.STARS);
    Curriculum.bootFx();
    huntShowOver(false);
    window.beginHuntPlay();
    if (g.raf) cancelAnimationFrame(g.raf);
    g.raf = requestAnimationFrame(function () { huntLoop(performance.now()); });
};

window.beginHuntPlay = function () {
    var g = window.HuntGame;
    g.phase = 'play';
    Curriculum.startFx();
    huntHud();
    huntAsk();
};

window.replayHuntWord = function () {
    var g = window.HuntGame;
    if (g.target) Curriculum.speakEn(g.target.w);
};

if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('resize', function () {
        if (window.HuntGame.active) huntPaintCanvases();
    });
}

window.startMatchGame = window.startPictureHunt;
window.exitMatchGame = window.stopHuntGame;
window.isMatchPlaying = false;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { huntStepFly: huntStepFly, huntSeparate: huntSeparate };
}
