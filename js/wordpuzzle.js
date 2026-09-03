// ==========================================
// 🧩 單詞拼圖 — tap letters to reveal the picture
// Glowing box says which letter goes next. Fill 5 stars.
// ==========================================

window.PuzzleGame = {
    active: false,
    phase: 'play',
    STARS: 5,
    got: 0,
    found: [],
    words: [],
    item: null,
    next: 0
};

function pzEl(id) { return document.getElementById(id); }

function pzHud() {
    var g = window.PuzzleGame;
    Curriculum.stars(pzEl('pz-stars'), g.got, g.STARS);
    var prompt = pzEl('pz-prompt');
    if (prompt) {
        if (g.item) {
            Curriculum.fillTarget(prompt, g.item.w);
        } else {
            prompt.textContent = '撳下面啲字母填格仔';
        }
    }
}

function pzShowOver(on) {
    var el = pzEl('pz-over');
    if (!el) return;
    el.style.display = on ? 'flex' : 'none';
    el.classList.toggle('is-open', on);
}

function pzPaintHidden(item, size) {
    var c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    var ctx = c.getContext('2d');
    var grd = ctx.createLinearGradient(0, 0, size, size);
    grd.addColorStop(0, '#fff3b0');
    grd.addColorStop(1, '#a2d2ff');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#123b63';
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, size - 12, size - 12);
    if (window.ZiziArt) {
        window.ZiziArt.drawWord(ctx, item.w, size / 2, size / 2, size * 0.78, performance.now() / 1000);
    }
    return c;
}

function pzStartWord() {
    var g = window.PuzzleGame;
    g.phase = 'play';
    g.next = 0;
    g.item = g.words[g.got];
    pzHud();
    var reveal = pzEl('pz-reveal');
    var spell = pzEl('pz-spell');
    if (!reveal || !spell || !g.item) return;
    reveal.innerHTML = '';
    spell.innerHTML = '';
    var size = 240;
    var src = pzPaintHidden(g.item, size);
    var revealCvs = document.createElement('canvas');
    revealCvs.width = size;
    revealCvs.height = size;
    reveal.appendChild(revealCvs);
    g._revealCtx = revealCvs.getContext('2d');
    g._revealSrc = src;

    var letters = g.item.w.split('');
    var decoyPool = 'satipnckehrmdgoulfbjvwxyzq'.split('').filter(function (ch) {
        return letters.indexOf(ch) === -1;
    });
    var decoys = Curriculum.shuffle(decoyPool).slice(0, Math.min(2, letters.length));
    var tiles = Curriculum.shuffle(letters.concat(decoys));

    var slots = document.createElement('div');
    slots.className = 'pz-slots-row';
    letters.forEach(function (ch, i) {
        var s = document.createElement('div');
        s.className = 'pz-letter-slot' + (i === 0 ? ' is-next' : '');
        s.dataset.i = String(i);
        s.dataset.ch = ch;
        slots.appendChild(s);
    });
    slots.addEventListener('click', pzHintTapBelow);
    spell.appendChild(slots);

    var arrow = document.createElement('div');
    arrow.className = 'pz-tap-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '▼ 撳呢啲';
    spell.appendChild(arrow);

    var row = document.createElement('div');
    row.className = 'pz-pop-row';
    tiles.forEach(function (ch, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'pz-pop';
        b.style.animationDelay = (i * 0.12) + 's';
        b.textContent = ch;
        b.onclick = function () { pzTapLetter(ch, b); };
        row.appendChild(b);
    });
    spell.appendChild(row);
    pzPaintReveal();
    g.talkId = (g.talkId || 0) + 1;
    var talkId = g.talkId;
    var word = g.item.w;
    Curriculum.voiceCatch(
        Curriculum.say('撳下面啲字母砌呢個字！').then(function () {
            if (!g.active || g.talkId !== talkId || !g.item || g.item.w !== word) return;
            return Curriculum.speakEn(word);
        })
    );
}

function pzHintTapBelow() {
    var g = window.PuzzleGame;
    if (!g.active || g.phase !== 'play') return;
    var row = document.querySelector('.pz-pop-row');
    if (row) {
        row.classList.remove('is-nudge');
        void row.offsetWidth;
        row.classList.add('is-nudge');
    }
    Curriculum.voiceCatch(Curriculum.say('撳下面啲字母！'));
}

function pzPaintReveal() {
    var g = window.PuzzleGame;
    var ctx = g._revealCtx;
    var src = g._revealSrc;
    if (!ctx || !src || !g.item) return;
    var size = src.width;
    ctx.clearRect(0, 0, size, size);
    var letters = g.item.w.split('').length;
    var show = letters ? g.next / letters : 0;
    var w = Math.round(size * show);
    if (w > 0) ctx.drawImage(src, 0, 0, w, size, 0, 0, w, size);
    ctx.fillStyle = 'rgba(18,59,99,0.7)';
    ctx.fillRect(w, 0, size - w, size);
    ctx.fillStyle = '#ffc93c';
    ctx.fillRect(w - 4, 0, 8, size);
}

function pzTapLetter(ch, btn) {
    var g = window.PuzzleGame;
    if (!g.active || g.phase !== 'play' || !g.item) return;
    var need = g.item.w.split('')[g.next];
    if (ch !== need) {
        Curriculum.missFx(btn, '聽聲');
        Curriculum.voiceCatch(Curriculum.speakEn(ch));
        return;
    }
    Curriculum.pop();
    btn.disabled = true;
    btn.classList.add('is-used');
    var slot = document.querySelector('.pz-letter-slot[data-i="' + g.next + '"]');
    if (slot) {
        slot.textContent = need;
        slot.classList.add('is-done');
        slot.classList.remove('is-next');
    }
    g.next += 1;
    document.querySelectorAll('.pz-letter-slot.is-next').forEach(function (s) { s.classList.remove('is-next'); });
    var nxt = document.querySelector('.pz-letter-slot[data-i="' + g.next + '"]');
    if (nxt) nxt.classList.add('is-next');
    pzPaintReveal();
    if (g.next >= g.item.w.length) {
        g.got += 1;
        g.found.push(g.item);
        Curriculum.hitFx(pzEl('puzzle-overlay'), null, g.got);
        Curriculum.award(0, {
            word: g.item.w,
            emoji: g.item.emoji,
            letter: g.item.l,
            reason: '拼圖學到 ' + g.item.w
        });
        pzHud();
        g.talkId = (g.talkId || 0) + 1;
        Curriculum.afterSpeakEn(g.item.w, 900).then(function () {
            if (!g.active) return;
            if (g.got >= g.STARS) {
                pzFinish();
                return;
            }
            pzStartWord();
        });
    }
}

function pzFinish() {
    var g = window.PuzzleGame;
    g.phase = 'over';
    Curriculum.award(1, { reason: '完成單詞拼圖', quest: 'write' });
    if (window.markQuest) window.markQuest('write');
    pzShowOver(true);
    Curriculum.finishFx({
        emoji: '🧩',
        title: '揭開晒！',
        sub: '砌咗 ' + g.got + ' 個字',
        stars: 1
    });
    var title = pzEl('pz-over-title');
    var sub = pzEl('pz-over-sub');
    var list = pzEl('pz-over-words');
    if (title) title.textContent = '揭開晒！';
    if (sub) sub.textContent = '砌咗 ' + g.got + ' 個字 · +1⭐';
    if (list) {
        list.innerHTML = (g.found.length ? g.found : g.words.slice(0, g.got)).map(function (w) {
            return '<li><span>' + w.emoji + '</span> <b>' + w.w + '</b> ' + (Curriculum.yue(w.w) || '') + '</li>';
        }).join('') || '<li>再砌多啲字！</li>';
    }
    Curriculum.voiceCatch(Curriculum.say('揭開晒！你砌字好快。'));
}

window.stopPuzzleGame = function () {
    var g = window.PuzzleGame;
    g.active = false;
    g.phase = 'play';
    g.talkId = (g.talkId || 0) + 1;
    pzShowOver(false);
    var overlay = pzEl('puzzle-overlay');
    if (overlay) overlay.classList.remove('is-urgent', 'z-fx-shake');
    if (window.setDisplay) window.setDisplay('puzzle-overlay', 'none');
};

window.startWordPuzzle = function () {
    window.stopPuzzleGame();
    window.currentMode = 'puzzle';
    if (window.setDisplay) {
        window.setDisplay('home-menu', 'none');
        window.setDisplay('puzzle-overlay', 'flex');
    }
    var g = window.PuzzleGame;
    g.active = true;
    g.got = 0;
    g.found = [];
    g.words = Curriculum.pickLesson(g.STARS);
    g.item = null;
    Curriculum.bootFx();
    pzShowOver(false);
    window.beginPuzzlePlay();
};

window.beginPuzzlePlay = function () {
    Curriculum.startFx();
    pzStartWord();
};

window.startPuzzleGame = window.startWordPuzzle;
