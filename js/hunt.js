// ==========================================
// 🦋 飛天搵字 — three pictures fly around the sky
// Hear English, tap the matching picture. No timer.
// ==========================================

window.HuntGame = {
    active: false,
    phase: 'play',
    STARS: 5,
    got: 0,
    found: [],
    target: null,
    queue: [],
    items: [],
    fly: [],
    raf: 0,
    busy: false,
    bob: 0,
    paintT: 0
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
            tgt.textContent = '聽英文，捉住飛緊嗰幅圖';
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

function huntFlySize(field) {
    return Math.round(Math.min(156, Math.max(108, Math.min(field.w, field.h) * 0.34)));
}

/** Bounce a flyer inside the field. Pure math for tests. */
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
    var extra = '';
    if (!b.paused && !b.win && !b.poof) {
        extra = ' rotate(' + (Math.sin(window.HuntGame.bob * 2.4 + b.wob) * 6) + 'deg)';
    }
    b.el.style.transform = 'translate(' + Math.round(b.x) + 'px,' + Math.round(b.y) + 'px)' + extra;
}

/** Flag the matching flyer as the winner and the rest as destroyed. */
function huntMarkCatch(flies, word) {
    var list = flies || [];
    list.forEach(function (b) {
        var ok = !!(b.item && b.item.w === word);
        b.paused = true;
        b.win = ok;
        b.poof = !ok;
    });
    return list;
}

function huntBurstBits(el, kind) {
    var scene = huntEl('hunt-scene');
    if (!scene || !el || !el.getBoundingClientRect) return;
    var box = scene.getBoundingClientRect();
    var r = el.getBoundingClientRect();
    var cx = r.left - box.left + r.width / 2;
    var cy = r.top - box.top + r.height / 2;
    var win = kind === 'win';
    var glyphs = win ? ['⭐', '✨', '🎉', '🌟', '💛', '🎊'] : ['💨', '💥', '☁️'];
    var n = win ? 12 : 7;
    var i;
    for (i = 0; i < n; i++) {
        var bit = document.createElement('span');
        bit.className = win ? 'hunt-cheer' : 'hunt-poofbit';
        bit.textContent = glyphs[i % glyphs.length];
        var ang = (i / n) * Math.PI * 2 + (win ? 0 : 0.4);
        var dist = win ? (56 + (i % 3) * 18) : (36 + (i % 2) * 14);
        bit.style.left = cx + 'px';
        bit.style.top = cy + 'px';
        bit.style.setProperty('--dx', Math.round(Math.cos(ang) * dist) + 'px');
        bit.style.setProperty('--dy', Math.round(Math.sin(ang) * dist - (win ? 24 : 0)) + 'px');
        scene.appendChild(bit);
        setTimeout(function (node) {
            if (node && node.parentNode) node.parentNode.removeChild(node);
        }, win ? 1000 : 520, bit);
    }
}

function huntCheerWinner(dt) {
    var g = window.HuntGame;
    var field = huntSceneSize();
    g.fly.forEach(function (b) {
        if (b.win) {
            var tx = (field.w - b.s) / 2;
            var ty = (field.h - b.s) / 2;
            b.x += (tx - b.x) * Math.min(1, dt * 7);
            b.y += (ty - b.y) * Math.min(1, dt * 7);
        } else if (b.poof) {
            var ox = (b.x + b.s / 2) - field.w / 2 || 1;
            var oy = (b.y + b.s / 2) - field.h / 2 || 1;
            b.x += ox * dt * 2.2;
            b.y += oy * dt * 2.2;
        }
        huntApplyFly(b);
    });
}

function huntPaintScene() {
    var g = window.HuntGame;
    var scene = huntEl('hunt-scene');
    if (!scene) return;
    scene.innerHTML = '';
    var field = huntSceneSize();
    var size = huntFlySize(field);
    var spots = [
        { x: 8, y: 10 },
        { x: Math.max(8, field.w - size - 12), y: field.h * 0.38 },
        { x: field.w * 0.28, y: Math.max(8, field.h - size - 14) }
    ];
    g.fly = [];
    g.items.forEach(function (item, i) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'hunt-fly';
        btn.dataset.word = item.w;
        btn.setAttribute('aria-label', item.w);
        btn.style.width = size + 'px';
        btn.style.height = size + 'px';
        btn.innerHTML = '<span class="hunt-fly-inner"><canvas class="hunt-art"></canvas></span>';
        btn.onclick = function () { huntTap(item, btn); };
        scene.appendChild(btn);

        var speed = 58 + Math.random() * 42;
        var ang = (i / 3) * Math.PI * 2 + 0.4 + Math.random() * 0.5;
        var spot = spots[i] || { x: 12, y: 12 };
        var fly = {
            el: btn,
            item: item,
            s: size,
            x: spot.x,
            y: spot.y,
            vx: Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed,
            wob: i * 1.9,
            paused: false
        };
        g.fly.push(fly);
        huntApplyFly(fly);
    });
    huntSeparate(g.fly);
    g.fly.forEach(function (b) {
        b.x = Math.max(0, Math.min(Math.max(0, field.w - b.s), b.x));
        b.y = Math.max(0, Math.min(Math.max(0, field.h - b.s), b.y));
        huntApplyFly(b);
    });
    requestAnimationFrame(function () { huntPaintCanvases(); });
}

function huntPaintCanvases() {
    var scene = huntEl('hunt-scene');
    if (!scene || !window.ZiziArt) return;
    var t = performance.now() / 1000;
    Array.prototype.forEach.call(scene.querySelectorAll('.hunt-fly'), function (btn, i) {
        var cvs = btn.querySelector('.hunt-art');
        if (!cvs) return;
        var box = Math.max(72, Math.floor((parseFloat(btn.style.width) || btn.clientWidth || 110) * 0.82));
        if (cvs.width !== box * 2) {
            cvs.width = box * 2;
            cvs.height = box * 2;
            cvs.style.width = box + 'px';
            cvs.style.height = box + 'px';
        }
        var c = cvs.getContext('2d');
        c.setTransform(2, 0, 0, 2, 0, 0);
        c.clearRect(0, 0, box, box);
        window.ZiziArt.drawWord(c, btn.dataset.word, box / 2, box / 2, box * 0.92, t + i, true);
    });
}

function huntUpdate(dt) {
    var g = window.HuntGame;
    if (g.phase !== 'play') return;
    g.bob += dt;
    g.paintT += dt;
    if (g.busy) {
        huntCheerWinner(dt);
        if (g.paintT > 0.07) {
            g.paintT = 0;
            huntPaintCanvases();
        }
        return;
    }
    var field = huntSceneSize();
    g.fly.forEach(function (b) { huntStepFly(b, field, dt); });
    huntSeparate(g.fly);
    var size = g.fly[0] ? g.fly[0].s : 100;
    var maxX = Math.max(0, field.w - size);
    var maxY = Math.max(0, field.h - size);
    g.fly.forEach(function (b) {
        b.x = Math.max(0, Math.min(maxX, b.x));
        b.y = Math.max(0, Math.min(maxY, b.y));
        huntApplyFly(b);
    });
    if (g.paintT > 0.07) {
        g.paintT = 0;
        huntPaintCanvases();
    }
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
    g.items = Curriculum.shuffle([g.target].concat(others)).slice(0, 3);
    huntPaintScene();
    Curriculum.voiceCatch(
        Curriculum.say('邊幅圖係 ' + g.target.w + '？捉住佢！').then(function () {
            if (g.active && g.phase === 'play') return Curriculum.speakEn(g.target.w);
        })
    );
}

function huntTap(item, btn) {
    var g = window.HuntGame;
    if (!g.active || g.phase !== 'play' || !g.target || g.busy) return;
    if (item.w === g.target.w) {
        g.busy = true;
        huntMarkCatch(g.fly, item.w);
        btn.classList.add('is-win');
        btn.style.zIndex = '8';
        if (!btn.querySelector('.hunt-win-label')) {
            var tag = document.createElement('span');
            tag.className = 'hunt-win-label';
            tag.textContent = item.w;
            btn.appendChild(tag);
        }
        huntBurstBits(btn, 'win');
        var poofDelay = 70;
        g.fly.forEach(function (b) {
            if (!b.poof || !b.el) return;
            (function (el, wait) {
                setTimeout(function () {
                    if (!g.active) return;
                    el.classList.add('is-poof');
                    huntBurstBits(el, 'poof');
                    if (window.ZiziFX) window.ZiziFX.play('pop');
                }, wait);
            })(b.el, poofDelay);
            poofDelay += 110;
        });
        g.got += 1;
        g.found.push(g.target);
        Curriculum.hitFx(huntEl('hunt-overlay'), null, g.got);
        if (window.ZiziFX) {
            window.ZiziFX.play(g.got >= g.STARS ? 'fanfare' : 'star');
            if (window.ZiziFX.burst) window.ZiziFX.burst(huntEl('hunt-play'));
        }
        Curriculum.award(0, {
            word: item.w,
            emoji: item.emoji,
            letter: item.l,
            reason: '捉住咗 ' + item.w
        });
        huntHud();
        Curriculum.afterSpeakEn(item.w, 1300).then(function () {
            if (!g.active) return;
            if (g.got >= g.STARS) {
                huntFinish();
                return;
            }
            huntAsk();
        });
    } else {
        btn.classList.add('is-miss');
        Curriculum.boom();
        Curriculum.speakEn(item.w);
        setTimeout(function () {
            btn.classList.remove('is-miss');
        }, 420);
    }
}

function huntFinish() {
    var g = window.HuntGame;
    g.phase = 'over';
    g.busy = false;
    if (g.raf) { cancelAnimationFrame(g.raf); g.raf = 0; }
    Curriculum.award(1, { reason: '完成飛天搵字', quest: 'match' });
    if (window.markQuest) window.markQuest('match');
    huntShowOver(true);
    Curriculum.finishFx({
        emoji: '🦋',
        title: '捉住晒！',
        sub: '捉到 ' + g.got + ' 幅飛圖',
        stars: 1
    });
    var title = huntEl('hunt-over-title');
    var sub = huntEl('hunt-over-sub');
    var list = huntEl('hunt-over-words');
    if (title) title.textContent = '捉住晒！';
    if (sub) sub.textContent = '捉到 ' + g.got + ' 幅飛圖 · +1⭐';
    if (list) {
        list.innerHTML = (g.found.length ? g.found : g.queue.slice(0, g.got)).map(function (w) {
            return '<li><span>' + w.emoji + '</span> <b>' + w.w + '</b> ' + (Curriculum.yue(w.w) || '') + '</li>';
        }).join('') || '<li>再捉多幾幅圖！</li>';
    }
    Curriculum.say('捉住晒！你耳朵好叻。');
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

function huntOnResize() {
    var g = window.HuntGame;
    if (!g.active || g.phase !== 'play') return;
    var field = huntSceneSize();
    var size = huntFlySize(field);
    g.fly.forEach(function (b) {
        b.s = size;
        if (b.el) {
            b.el.style.width = size + 'px';
            b.el.style.height = size + 'px';
        }
        b.x = Math.max(0, Math.min(Math.max(0, field.w - size), b.x));
        b.y = Math.max(0, Math.min(Math.max(0, field.h - size), b.y));
        huntApplyFly(b);
    });
    huntPaintCanvases();
}

if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('resize', huntOnResize);
}

window.startMatchGame = window.startPictureHunt;
window.exitMatchGame = window.stopHuntGame;
window.isMatchPlaying = false;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        huntStepFly: huntStepFly,
        huntSeparate: huntSeparate,
        huntFlySize: huntFlySize,
        huntMarkCatch: huntMarkCatch
    };
}
