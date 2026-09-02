// ==========================================
// 🧩 單詞拼圖 — timed jigsaw + letter spelling
// Curriculum words, then hear English + etymology.
// ==========================================

window.PuzzleGame = {
    active: false,
    phase: 'rules', // rules | jigsaw | spell | teach | over
    clock: null,
    TIME: 50,
    ROUNDS: 4,
    timeLeft: 50,
    score: 0,
    round: 0,
    words: [],
    item: null,
    placed: 0,
    spell: [],
    spellNext: 0
};

function pzEl(id) { return document.getElementById(id); }

function pzHud() {
    var g = window.PuzzleGame;
    var t = pzEl('pz-time');
    var s = pzEl('pz-score');
    var r = pzEl('pz-round');
    if (t) t.textContent = String(Math.max(0, Math.ceil(g.timeLeft)));
    if (s) s.textContent = String(g.score);
    if (r) r.textContent = Math.min(g.round + 1, g.ROUNDS) + ' / ' + g.ROUNDS;
}

function pzShow(panel) {
    ['pz-rules', 'pz-play', 'pz-over'].forEach(function (id) {
        var el = pzEl(id);
        if (!el) return;
        el.style.display = id === panel ? (id === 'pz-play' ? 'flex' : 'block') : 'none';
    });
}

function pzPaintCard(item, size) {
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
    ctx.font = Math.round(size * 0.42) + 'px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.emoji, size / 2, size * 0.40);
    ctx.fillStyle = '#123b63';
    ctx.font = 'bold ' + Math.round(size * 0.16) + 'px Fredoka, sans-serif';
    ctx.fillText(item.w, size / 2, size * 0.78);
    ctx.font = 'bold ' + Math.round(size * 0.10) + 'px Fredoka, sans-serif';
    ctx.fillStyle = '#e63946';
    ctx.fillText(item.l, size * 0.16, size * 0.16);
    return c;
}

function pzStartJigsaw() {
    var g = window.PuzzleGame;
    g.phase = 'jigsaw';
    g.placed = 0;
    g.timeLeft = g.TIME;
    g.item = g.words[g.round];
    pzHud();
    var board = pzEl('pz-board');
    var tray = pzEl('pz-tray');
    var spell = pzEl('pz-spell');
    var prompt = pzEl('pz-prompt');
    if (spell) { spell.style.display = 'none'; spell.innerHTML = ''; }
    if (prompt) {
        prompt.innerHTML = '砌返幅圖 · 呢個字係 <b>' + g.item.w + '</b> ' + g.item.emoji;
    }
    if (!board || !tray) return;
    board.innerHTML = '';
    tray.innerHTML = '';
    var size = 280;
    var src = pzPaintCard(g.item, size);
    var order = Curriculum.shuffle([0, 1, 2, 3]);
    for (var i = 0; i < 4; i++) {
        var slot = document.createElement('div');
        slot.className = 'pz-slot';
        slot.dataset.slot = String(i);
        board.appendChild(slot);
    }
    for (var s = 0; s < 4; s++) {
        board.children[s].onclick = function () { pzDropOnSlot(this); };
    }
    order.forEach(function (idx) {
        var piece = document.createElement('button');
        piece.type = 'button';
        piece.className = 'pz-piece';
        piece.dataset.idx = String(idx);
        var tile = document.createElement('canvas');
        tile.width = size / 2;
        tile.height = size / 2;
        var col = idx % 2;
        var row = Math.floor(idx / 2);
        tile.getContext('2d').drawImage(src, col * size / 2, row * size / 2, size / 2, size / 2, 0, 0, size / 2, size / 2);
        piece.appendChild(tile);
        piece.addEventListener('click', function () { pzPickPiece(piece); });
        tray.appendChild(piece);
    });
    Curriculum.say('砌返幅圖。砌完用字母砌返 ' + g.item.w + '。').then(function () {
        if (g.active) return Curriculum.speakEn(g.item.w);
    });
}

function pzClearPick() {
    document.querySelectorAll('.pz-piece.is-picked').forEach(function (p) {
        p.classList.remove('is-picked');
    });
}

function pzPickPiece(piece) {
    var g = window.PuzzleGame;
    if (!g.active || g.phase !== 'jigsaw' || piece.classList.contains('is-locked')) return;
    if (piece.classList.contains('is-picked')) {
        piece.classList.remove('is-picked');
        return;
    }
    pzClearPick();
    piece.classList.add('is-picked');
    Curriculum.tapFx();
}

function pzDropOnSlot(slot) {
    var g = window.PuzzleGame;
    if (!g.active || g.phase !== 'jigsaw') return;
    var piece = document.querySelector('.pz-piece.is-picked');
    if (!piece) {
        Curriculum.tapFx();
        Curriculum.say('先撳下面一塊圖，再放上去。');
        return;
    }
    if (slot.classList.contains('is-filled')) {
        Curriculum.missFx(pzEl('puzzle-overlay'), 'already');
        return;
    }
    var idx = piece.dataset.idx;
    if (slot.dataset.slot !== idx) {
        Curriculum.missFx(pzEl('puzzle-overlay'), '-2s');
        g.score = Math.max(0, g.score - 6);
        g.timeLeft = Math.max(0, g.timeLeft - 2);
        pzHud();
        slot.classList.add('is-wrong');
        setTimeout(function () { slot.classList.remove('is-wrong'); }, 280);
        return;
    }
    pzClearPick();
    slot.classList.add('is-filled');
    slot.appendChild(piece);
    piece.disabled = true;
    piece.classList.add('is-locked');
    g.placed += 1;
    g.score += 20;
    Curriculum.hitFx(pzEl('puzzle-overlay'), 20, g.placed);
    pzHud();
    if (g.placed >= 4) {
        g.score += Math.ceil(g.timeLeft) * 2;
        pzStartSpell();
    }
}

function pzStartSpell() {
    var g = window.PuzzleGame;
    g.phase = 'spell';
    g.spellNext = 0;
    var letters = g.item.w.split('');
    g.spell = letters.slice();
    var decoyPool = 'satipnckehrmdgoulfbjvwxyzq'.split('').filter(function (ch) {
        return letters.indexOf(ch) === -1;
    });
    var decoys = Curriculum.shuffle(decoyPool).slice(0, Math.min(2, letters.length > 3 ? 2 : 1));
    var tiles = Curriculum.shuffle(letters.concat(decoys));
    var spell = pzEl('pz-spell');
    var prompt = pzEl('pz-prompt');
    if (prompt) prompt.innerHTML = '跟住讀音，撳字母砌 <b>' + g.item.w + '</b>';
    if (!spell) return;
    spell.style.display = 'block';
    spell.innerHTML = '<div class="pz-slots-row" id="pz-letter-slots"></div><div class="pz-tiles-row" id="pz-letter-tiles"></div>';
    var slots = pzEl('pz-letter-slots');
    var row = pzEl('pz-letter-tiles');
    letters.forEach(function (_, i) {
        var s = document.createElement('div');
        s.className = 'pz-letter-slot';
        s.dataset.i = String(i);
        s.textContent = '_';
        slots.appendChild(s);
    });
    tiles.forEach(function (ch) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'pz-letter-tile';
        b.textContent = ch;
        b.onclick = function () { pzTapLetter(ch, b); };
        row.appendChild(b);
    });
    Curriculum.speakEn(g.item.w);
}

function pzTapLetter(ch, btn) {
    var g = window.PuzzleGame;
    if (!g.active || g.phase !== 'spell') return;
    var need = g.spell[g.spellNext];
    if (ch !== need) {
        Curriculum.missFx(pzEl('puzzle-overlay'), '-3s');
        g.score = Math.max(0, g.score - 8);
        g.timeLeft = Math.max(0, g.timeLeft - 3);
        pzHud();
        Curriculum.say(ch + ' 唔啱，聽多次。').then(function () {
            if (g.active) return Curriculum.speakEn(g.item.w);
        });
        return;
    }
    Curriculum.hitFx(pzEl('puzzle-overlay'), 25, g.spellNext + 1);
    btn.disabled = true;
    btn.classList.add('is-used');
    var slot = document.querySelector('.pz-letter-slot[data-i="' + g.spellNext + '"]');
    if (slot) {
        slot.textContent = ch;
        slot.classList.add('is-done');
    }
    g.spellNext += 1;
    g.score += 25;
    pzHud();
    if (g.spellNext >= g.spell.length) pzWordDone();
}

function pzWordDone() {
    var g = window.PuzzleGame;
    g.phase = 'teach';
    g.score += Math.ceil(g.timeLeft);
    pzHud();
    Curriculum.award(0, {
        word: g.item.w,
        emoji: g.item.emoji,
        letter: g.item.l,
        reason: '拼圖學到 ' + g.item.w
    });
    var prompt = pzEl('pz-prompt');
    if (prompt) prompt.innerHTML = '拼到喇！<b>' + g.item.w + '</b> ' + (Curriculum.yue(g.item.w) || '');
    if (window.ZiziFX) {
        window.ZiziFX.play('combo');
        window.ZiziFX.burst(pzEl('puzzle-overlay'));
        window.ZiziFX.boomConfetti(80);
    }
    Curriculum.say('拼到 ' + g.item.w + '！').then(function () {
        return Curriculum.teach(g.item.w, 'pz-coach');
    }).then(function () {
        if (!g.active) return;
        g.round += 1;
        if (g.round >= g.ROUNDS || g.timeLeft <= 0) {
            pzFinish(true);
            return;
        }
        pzStartJigsaw();
    });
}

function pzTick() {
    var g = window.PuzzleGame;
    if (!g.active || g.phase === 'rules' || g.phase === 'over' || g.phase === 'teach') return;
    g.timeLeft -= 0.25;
    pzHud();
    Curriculum.warnLowTime(g.timeLeft, pzEl('puzzle-overlay'));
    if (g.timeLeft <= 0) {
        g.timeLeft = 0;
        pzFinish(g.round > 0 || g.placed > 0);
    }
}

function pzFinish(ok) {
    var g = window.PuzzleGame;
    g.phase = 'over';
    if (g.clock) { clearInterval(g.clock); g.clock = null; }
    var stars = Curriculum.starsForScore(g.score, 400);
    Curriculum.award(stars, { reason: '完成單詞拼圖', quest: 'write' });
    if (window.markQuest) window.markQuest('write');
    pzShow('pz-over');
    var overlay = pzEl('puzzle-overlay');
    if (overlay) overlay.classList.remove('is-urgent');
    Curriculum.finishFx({
        emoji: '🧩',
        title: ok ? '拼圖完成！' : '時間到！',
        sub: '分數 ' + g.score,
        stars: stars
    });
    var title = pzEl('pz-over-title');
    var sub = pzEl('pz-over-sub');
    var list = pzEl('pz-over-words');
    var learned = g.words.slice(0, g.round + (g.phase === 'over' && g.spellNext && g.item && g.spellNext >= (g.item.w || '').length ? 1 : 0));
    if (g.round >= 1) learned = g.words.slice(0, Math.min(g.round, g.ROUNDS));
    if (title) title.textContent = ok ? '拼圖完成！' : '時間到！';
    if (sub) sub.textContent = '分數 ' + g.score + ' · +' + stars + '⭐';
    if (list) {
        list.innerHTML = learned.map(function (w) {
            return '<li><span>' + w.emoji + '</span> <b>' + w.w + '</b> ' + (Curriculum.yue(w.w) || '') + '</li>';
        }).join('') || '<li>今轉未砌完，再試過！</li>';
    }
    Curriculum.say(ok ? '拼圖完成！記得啲英文點砌。' : '時間到！砌圖同砌字母都要快。');
}

window.stopPuzzleGame = function () {
    var g = window.PuzzleGame;
    g.active = false;
    g.phase = 'rules';
    if (g.clock) { clearInterval(g.clock); g.clock = null; }
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
    g.phase = 'rules';
    g.score = 0;
    g.round = 0;
    g.words = Curriculum.pickLesson(g.ROUNDS);
    g.item = null;
    Curriculum.bootFx();
    pzShow('pz-rules');
    var group = pzEl('pz-group');
    if (group) group.textContent = Curriculum.groupName();
    Curriculum.say('單詞拼圖。限時砌圖，再跟讀音撳字母砌英文單詞。');
};

window.beginPuzzlePlay = function () {
    var g = window.PuzzleGame;
    Curriculum.startFx();
    pzShow('pz-play');
    if (g.clock) clearInterval(g.clock);
    g.clock = setInterval(pzTick, 250);
    pzStartJigsaw();
};

window.startPuzzleGame = window.startWordPuzzle;
