// ==========================================
// 🖼️ 尋寶圖 — three bushes, tap to open
// Hear English, open the bush that matches. No timer.
// ==========================================

window.HuntGame = {
    active: false,
    phase: 'play',
    STARS: 5,
    got: 0,
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
            tgt.innerHTML = '搵 <span class="stage-word">' + g.target.w + '</span>';
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
        ['cover', 'art'].forEach(function (cls) {
            var cvs = btn.querySelector('.hunt-' + cls);
            if (cvs && window.ZiziArt) {
                var cs = Math.max(72, Math.floor(btn.clientHeight * 0.7));
                cvs.width = cs * 2;
                cvs.height = cs * 2;
                var c = cvs.getContext('2d');
                c.scale(2, 2);
                if (cls === 'cover') {
                    window.ZiziArt.drawWord(c, 'bush', cs / 2, cs / 2, cs, performance.now() / 1000 + i);
                } else {
                    window.ZiziArt.drawWord(c, item.w, cs / 2, cs / 2, cs * 0.7, performance.now() / 1000 + i);
                }
            }
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
        list.innerHTML = g.queue.slice(0, g.got).map(function (w) {
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
