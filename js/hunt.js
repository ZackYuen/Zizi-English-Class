// ==========================================
// 🖼️ 尋寶圖 — three bushes, tap to open
// Hear English, open the bush that matches. No timer.
// ==========================================

window.HuntGame = {
    active: false,
    phase: 'play',
    STARS: 5,
    got: 0,
    found: [],
    target: null,
    queue: [],
    bushes: []
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

function huntPaintScene() {
    var g = window.HuntGame;
    var scene = huntEl('hunt-scene');
    if (!scene) return;
    scene.innerHTML = '';
    g.bushes.forEach(function (item, i) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'hunt-bush';
        btn.dataset.word = item.w;
        btn.setAttribute('aria-label', item.w);
        btn.innerHTML =
            '<canvas class="hunt-cover"></canvas>' +
            '<canvas class="hunt-art"></canvas>';
        btn.onclick = function () { huntTap(item, btn); };
        scene.appendChild(btn);
    });
    requestAnimationFrame(function () { huntPaintCanvases(); });
}

function huntPaintCanvases() {
    var scene = huntEl('hunt-scene');
    if (!scene || !window.ZiziArt) return;
    Array.prototype.forEach.call(scene.querySelectorAll('.hunt-bush'), function (btn, i) {
        var box = Math.max(88, Math.floor(Math.min(btn.clientWidth || 120, btn.clientHeight || 160) * 0.72));
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
            var size = cls === 'cover' ? box * 0.96 : box * 0.78;
            window.ZiziArt.drawWord(c, word, box / 2, box / 2, size, performance.now() / 1000 + i);
        });
    });
}

function huntAsk() {
    var g = window.HuntGame;
    g.target = g.queue[g.got];
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
    if (!g.active || g.phase !== 'play' || !g.target) return;
    btn.classList.add('is-open');
    if (item.w === g.target.w) {
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
        }, 900);
    }
}

function huntFinish() {
    var g = window.HuntGame;
    g.phase = 'over';
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

window.startMatchGame = window.startPictureHunt;
window.exitMatchGame = window.stopHuntGame;
window.isMatchPlaying = false;
