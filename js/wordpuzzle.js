// ==========================================
// 🧩 單詞拼圖 — tap two tiles to swap, then spell
// One field, no extra tray, fits one iPhone screen.
// ==========================================

window.PuzzleGame = {
    active: false,
    phase: 'jigsaw',
    clock: null,
    TIME: 45,
    ROUNDS: 3,
    timeLeft: 45,
    score: 0,
    round: 0,
    words: [],
    item: null,
    order: [0, 1, 2, 3],
    picked: -1,
    drag: null,
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
    if (r) r.textContent = Math.min(g.round + 1, g.ROUNDS) + '/' + g.ROUNDS;
}

function pzShowOver(on) {
    var el = pzEl('pz-over');
    if (!el) return;
    el.style.display = on ? 'flex' : 'none';
    el.classList.toggle('is-open', on);
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
    if (window.ZiziArt) {
        window.ZiziArt.drawWord(ctx, item.w, size / 2, size * 0.40, size * 0.4);
    } else {
        ctx.fillText(item.emoji, size / 2, size * 0.40);
    }
    ctx.fillStyle = '#123b63';
    ctx.font = 'bold ' + Math.round(size * 0.16) + 'px Fredoka, sans-serif';
    ctx.fillText(item.w, size / 2, size * 0.78);
    ctx.font = 'bold ' + Math.round(size * 0.10) + 'px Fredoka, sans-serif';
    ctx.fillStyle = '#e63946';
    ctx.fillText(item.l, size * 0.16, size * 0.16);
    return c;
}

function pzSolved() {
    var o = window.PuzzleGame.order;
    return o[0] === 0 && o[1] === 1 && o[2] === 2 && o[3] === 3;
}

function pzStartJigsaw() {
    var g = window.PuzzleGame;
    g.phase = 'jigsaw';
    g.picked = -1;
    g.timeLeft = g.TIME;
    g.item = g.words[g.round];
    pzHud();
    var board = pzEl('pz-board');
    var spell = pzEl('pz-spell');
    var prompt = pzEl('pz-prompt');
    if (spell) { spell.style.display = 'none'; spell.innerHTML = ''; }
    if (board) board.style.display = 'grid';
    if (prompt) prompt.textContent = '拖塊圖對調 · ' + g.item.emoji + ' ' + g.item.w;
    if (!board) return;
    board.innerHTML = '';
    var size = 280;
    var src = pzPaintCard(g.item, size);
    g.order = Curriculum.shuffle([0, 1, 2, 3]);
    if (pzSolved()) g.order = [1, 0, 3, 2];
    g.order.forEach(function (idx, slot) {
        var piece = document.createElement('button');
        piece.type = 'button';
        piece.className = 'pz-piece';
        piece.dataset.slot = String(slot);
        var tile = document.createElement('canvas');
        tile.width = size / 2;
        tile.height = size / 2;
        var col = idx % 2;
        var row = Math.floor(idx / 2);
        tile.getContext('2d').drawImage(src, col * size / 2, row * size / 2, size / 2, size / 2, 0, 0, size / 2, size / 2);
        piece.appendChild(tile);
        piece.addEventListener('pointerdown', function (e) { pzDragStart(e, piece, slot); });
        piece.addEventListener('pointermove', function (e) { pzDragMove(e, piece); });
        piece.addEventListener('pointerup', function (e) { pzDragEnd(e, piece); });
        piece.addEventListener('pointercancel', function (e) { pzDragEnd(e, piece); });
        board.appendChild(piece);
    });
    Curriculum.say('拖塊圖去另一塊上面，砌返 ' + g.item.w + '。').then(function () {
        if (g.active) return Curriculum.speakEn(g.item.w);
    });
}

function pzRedrawPieces() {
    var g = window.PuzzleGame;
    var board = pzEl('pz-board');
    if (!board) return;
    var size = 280;
    var src = pzPaintCard(g.item, size);
    Array.prototype.forEach.call(board.children, function (piece, slot) {
        var idx = g.order[slot];
        var tile = piece.querySelector('canvas');
        if (!tile) return;
        var col = idx % 2;
        var row = Math.floor(idx / 2);
        tile.getContext('2d').clearRect(0, 0, size / 2, size / 2);
        tile.getContext('2d').drawImage(src, col * size / 2, row * size / 2, size / 2, size / 2, 0, 0, size / 2, size / 2);
        piece.classList.toggle('is-picked', g.picked === slot);
    });
}

function pzDragStart(e, piece, slot) {
    var g = window.PuzzleGame;
    if (!g.active || g.phase !== 'jigsaw') return;
    if (e.cancelable) e.preventDefault();
    try { piece.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    g.drag = { slot: slot, piece: piece, x: e.clientX, y: e.clientY };
    piece.classList.add('is-drag');
    Curriculum.tapFx();
}

function pzDragMove(e, piece) {
    var g = window.PuzzleGame;
    if (!g.drag || g.drag.piece !== piece) return;
    if (e.cancelable) e.preventDefault();
    var dx = e.clientX - g.drag.x;
    var dy = e.clientY - g.drag.y;
    piece.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(1.08)';
    piece.style.zIndex = '5';
}

function pzDragEnd(e, piece) {
    var g = window.PuzzleGame;
    if (!g.drag || g.drag.piece !== piece) return;
    piece.style.transform = '';
    piece.style.zIndex = '';
    piece.classList.remove('is-drag');
    var from = g.drag.slot;
    g.drag = null;
    piece.style.visibility = 'hidden';
    var over = document.elementFromPoint(e.clientX, e.clientY);
    piece.style.visibility = '';
    var other = over && over.closest ? over.closest('.pz-piece') : null;
    if (!other || other === piece) return;
    var to = Number(other.dataset.slot);
    if (isNaN(to) || to === from) return;
    var tmp = g.order[from];
    g.order[from] = g.order[to];
    g.order[to] = tmp;
    pzRedrawPieces();
    if (pzSolved()) {
        g.score += 80 + Math.ceil(g.timeLeft);
        Curriculum.hitFx(pzEl('puzzle-overlay'), 80, 2);
        pzHud();
        pzStartSpell();
    }
}

function pzTapSlot(slot) {
    var g = window.PuzzleGame;
    if (!g.active || g.phase !== 'jigsaw') return;
    if (g.picked < 0) {
        g.picked = slot;
        Curriculum.tapFx();
        pzRedrawPieces();
        return;
    }
    if (g.picked === slot) {
        g.picked = -1;
        pzRedrawPieces();
        return;
    }
    var a = g.picked;
    var tmp = g.order[a];
    g.order[a] = g.order[slot];
    g.order[slot] = tmp;
    g.picked = -1;
    pzRedrawPieces();
    if (pzSolved()) {
        g.score += 80 + Math.ceil(g.timeLeft);
        Curriculum.hitFx(pzEl('puzzle-overlay'), 80, 2);
        pzHud();
        pzStartSpell();
    } else {
        Curriculum.tapFx();
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
    var board = pzEl('pz-board');
    var spell = pzEl('pz-spell');
    var prompt = pzEl('pz-prompt');
    if (board) board.style.display = 'none';
    if (prompt) prompt.textContent = '爆字母 · ' + g.item.w;
    if (!spell) return;
    spell.style.display = 'flex';
    spell.innerHTML = '<div class="pz-spell-pic">' + g.item.emoji + '</div>' +
        '<div class="pz-slots-row" id="pz-letter-slots"></div>' +
        '<div class="pz-pop-row" id="pz-letter-tiles"></div>';
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
        b.className = 'pz-letter-tile pz-pop';
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
    if (prompt) prompt.textContent = '拼到喇！' + g.item.w;
    if (window.ZiziFX) {
        window.ZiziFX.play('combo');
        window.ZiziFX.burst(pzEl('puzzle-overlay'));
        window.ZiziFX.boomConfetti(80);
    }
    Curriculum.say('拼到 ' + g.item.w + '！').then(function () {
        return Curriculum.cheer(g.item.w, 'pz-coach');
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
    if (!g.active || g.phase === 'over' || g.phase === 'teach') return;
    g.timeLeft -= 0.25;
    pzHud();
    Curriculum.warnLowTime(g.timeLeft, pzEl('puzzle-overlay'));
    if (g.timeLeft <= 0) {
        g.timeLeft = 0;
        pzFinish(g.round > 0);
    }
}

function pzFinish(ok) {
    var g = window.PuzzleGame;
    g.phase = 'over';
    if (g.clock) { clearInterval(g.clock); g.clock = null; }
    var stars = Curriculum.starsForScore(g.score, 350);
    Curriculum.award(stars, { reason: '完成單詞拼圖', quest: 'write' });
    if (window.markQuest) window.markQuest('write');
    pzShowOver(true);
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
    var learned = g.words.slice(0, Math.min(g.round, g.ROUNDS));
    if (title) title.textContent = ok ? '拼圖完成！' : '時間到！';
    if (sub) sub.textContent = '分數 ' + g.score + ' · +' + stars + '⭐';
    if (list) {
        list.innerHTML = learned.map(function (w) {
            return '<li><span>' + w.emoji + '</span> <b>' + w.w + '</b> ' + (Curriculum.yue(w.w) || '') + '</li>';
        }).join('') || '<li>今轉未砌完，再試過！</li>';
    }
    Curriculum.say(ok ? '拼圖完成！記得啲英文點砌。' : '時間到！拖塊圖對調，再爆字母。');
}

window.stopPuzzleGame = function () {
    var g = window.PuzzleGame;
    g.active = false;
    g.phase = 'jigsaw';
    if (g.clock) { clearInterval(g.clock); g.clock = null; }
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
    g.score = 0;
    g.round = 0;
    g.words = Curriculum.pickLesson(g.ROUNDS);
    g.item = null;
    Curriculum.bootFx();
    pzShowOver(false);
    window.beginPuzzlePlay();
};

window.beginPuzzlePlay = function () {
    var g = window.PuzzleGame;
    Curriculum.startFx();
    if (g.clock) clearInterval(g.clock);
    g.clock = setInterval(pzTick, 250);
    pzStartJigsaw();
};

window.startPuzzleGame = window.startWordPuzzle;
