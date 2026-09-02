// ==========================================
// Hide-and-seek + spot the difference
// Used after camera identify, and as its own 搵唔同 game.
// Speaks through Chirp3 (playCantoneseTTS / speakEnglish).
// ==========================================

window.Play = {
    active: false,
    word: '',
    emoji: '⭐',
    photo: null,
    source: 'puzzle', // camera | puzzle
    round: 0,
    found: 0,
    mode: 'seek',
    hideAt: -1,
    diffAt: -1,
    cells: []
};

function playStage() { return document.getElementById('play-stage'); }

function playMsg(text, color) {
    var el = document.getElementById('play-msg');
    if (!el) return;
    el.innerText = text;
    if (color) el.style.color = color;
}

function showPlayOverlay() {
    if (typeof window.setDisplay === 'function') {
        window.setDisplay('home-menu', 'none');
        window.setDisplay('camera-overlay', 'none');
        window.setDisplay('game-overlay', 'none');
        window.setDisplay('match-overlay', 'none');
        window.setDisplay('app', 'none');
        window.setDisplay('standard-ui', 'none');
        window.setDisplay('standard-top-bar', 'none');
        window.setDisplay('play-overlay', 'flex');
        return;
    }
    var overlay = document.getElementById('play-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        overlay.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');
    }
}

window.stopPlayGames = function () {
    window.Play.active = false;
    var overlay = document.getElementById('play-overlay');
    if (!overlay) return;
    if (typeof window.setDisplay === 'function') {
        window.setDisplay('play-overlay', 'none');
    } else {
        overlay.style.display = 'none';
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
    }
    var stage = playStage();
    if (stage) stage.innerHTML = '';
};

window.startHideSeek = function (opts) {
    opts = opts || {};
    if (!window.Arcade) return;
    var info = window.Arcade.lookup(opts.word);
    window.Play.active = true;
    window.Play.word = info.w;
    window.Play.emoji = info.emoji || '⭐';
    window.Play.photo = opts.photo || null;
    window.Play.source = opts.source || (opts.photo ? 'camera' : 'puzzle');
    window.Play.round = 0;
    window.Play.found = 0;
    window.Play.mode = 'seek';
    window.currentMode = window.Play.source === 'camera' ? 'camera' : 'puzzle';

    if (window.closeCamera) window.closeCamera();
    showPlayOverlay();

    var title = document.getElementById('play-title');
    if (title) title.innerText = '🙈 捉迷藏';
    playMsg(info.w.toUpperCase() + ' 匿咗喺草叢！搵佢出嚟！', '#1d3557');
    var foundEl = document.getElementById('play-found');
    if (foundEl) foundEl.innerText = '0';

    var intro = window.Play.source === 'camera'
        ? ('搵到喇！係 ' + info.w + '。聽完英文，去草叢搵返佢！')
        : (info.w + ' 匿咗喺草叢。聽完英文，搵返佢！');
    window.Arcade.say(intro).then(function () {
        if (window.Play.active) return window.Arcade.speakEnglish(info.w);
    });
    window.renderSeekRound();
};

window.renderSeekRound = function () {
    if (!window.Play.active) return;
    window.Play.mode = 'seek';
    window.Play.round += 1;
    var decoys = window.Arcade.randomItems(8, window.Play.word);
    var cells = decoys.map(function (d) { return { emoji: d.emoji, target: false }; });
    while (cells.length < 8) cells.push({ emoji: '🌸', target: false });
    window.Play.hideAt = Math.floor(Math.random() * 9);
    cells.splice(window.Play.hideAt, 0, { emoji: window.Play.emoji, target: true });
    window.Play.cells = cells;

    var stage = playStage();
    if (!stage) return;
    stage.className = 'play-stage seek-grid';
    stage.innerHTML = '';
    cells.forEach(function (cell, i) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'seek-bush' + (cell.target ? ' is-target' : '');
        btn.setAttribute('aria-label', cell.target ? '可能喺呢度' : '草叢');
        btn.innerHTML = '<span class="bush" aria-hidden="true">🌳</span><span class="peek" aria-hidden="true">' + cell.emoji + '</span>';
        btn.onclick = function () { window.checkSeekTap(i); };
        stage.appendChild(btn);
    });
};

window.checkSeekTap = function (i) {
    if (!window.Play.active || window.Play.mode !== 'seek') return;
    var cell = window.Play.cells[i];
    if (!cell) return;
    if (cell.target) {
        window.Play.found += 1;
        var foundEl = document.getElementById('play-found');
        if (foundEl) foundEl.innerText = String(window.Play.found);
        window.Arcade.pop();
        window.Arcade.addStars(1, {
            word: window.Play.word,
            emoji: window.Play.emoji,
            reason: '捉迷藏'
        });
        playMsg('搵到 ' + window.Play.word + ' ' + window.Play.emoji + '！', '#06d6a0');
        if (typeof confetti === 'function') confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
        if (window.Play.found >= 3) {
            setTimeout(window.startSpotDiff, 700);
        } else {
            window.Arcade.say('叻仔！再搵多次！');
            setTimeout(window.renderSeekRound, 650);
        }
    } else {
        window.Arcade.boom();
        playMsg('唔係呢度！睇真啲 ' + window.Play.emoji, '#e63946');
    }
};

window.startSpotDiff = function () {
    if (!window.Play.active) return;
    window.Play.mode = 'diff';
    var title = document.getElementById('play-title');
    if (title) title.innerText = '👀 搵唔同';
    playMsg('兩張相差咗一樣嘢。撳右邊唔同嗰格！', '#1d3557');
    window.Arcade.say('而家玩搵唔同！睇兩張相，撳右邊唔同嗰格。');

    var base = window.Arcade.randomItems(8, window.Play.word);
    var left = base.map(function (d) { return d.emoji; });
    while (left.length < 8) left.push('⭐');
    left.splice(Math.floor(Math.random() * 8), 0, window.Play.emoji);
    var right = left.slice();
    window.Play.diffAt = Math.floor(Math.random() * 9);
    var swapPool = ['🌈', '🎈', '🍀', '🎀', '🌙', '🍓', '🧸', '⚽'];
    var other = swapPool[Math.floor(Math.random() * swapPool.length)];
    if (other === right[window.Play.diffAt]) other = '🚀';
    right[window.Play.diffAt] = other;

    var stage = playStage();
    if (!stage) return;
    stage.className = 'play-stage diff-wrap';
    stage.innerHTML = '';

    function makeGrid(emojis, clickable) {
        var grid = document.createElement('div');
        grid.className = 'diff-grid';
        emojis.forEach(function (em, idx) {
            var cell = document.createElement(clickable ? 'button' : 'div');
            cell.className = 'diff-cell';
            if (clickable) cell.type = 'button';
            cell.textContent = em;
            if (clickable) {
                cell.onclick = function () { window.checkDiffTap(idx); };
            }
            grid.appendChild(cell);
        });
        return grid;
    }

    var colA = document.createElement('div');
    colA.innerHTML = '<p class="diff-label">相 A</p>';
    colA.appendChild(makeGrid(left, false));
    var colB = document.createElement('div');
    colB.innerHTML = '<p class="diff-label">相 B · 撳唔同</p>';
    colB.appendChild(makeGrid(right, true));
    stage.appendChild(colA);
    stage.appendChild(colB);
};

window.checkDiffTap = function (i) {
    if (!window.Play.active || window.Play.mode !== 'diff') return;
    if (i === window.Play.diffAt) {
        window.Arcade.winFanfare();
        window.Arcade.addStars(2, {
            word: window.Play.word,
            emoji: window.Play.emoji,
            reason: '搵唔同過關'
        });
        window.Arcade.say('全部過關！' + window.Play.word + ' 好叻！');
        playMsg('全部過關！' + window.Play.word.toUpperCase() + ' ' + window.Play.emoji, '#06d6a0');
        window.showPlayWin();
    } else {
        window.Arcade.boom();
        playMsg('再睇真啲，右邊邊格唔同？', '#e63946');
    }
};

window.showPlayWin = function () {
    var stage = playStage();
    if (!stage) return;
    stage.className = 'play-stage play-win';
    var photo = window.Play.photo
        ? '<img class="play-win-photo" alt="" src="' + window.Play.photo + '">'
        : '<div class="play-win-emoji">' + window.Play.emoji + '</div>';
    var again = window.Play.source === 'camera'
        ? '<button type="button" class="play-win-btn" onclick="playAgainCamera()">📸 再影一樣</button>'
        : '<button type="button" class="play-win-btn" onclick="startPuzzleGame()">🙈 再玩一次</button>';
    stage.innerHTML =
        photo +
        '<p class="play-win-word">' + window.Play.word + '</p>' +
        '<div class="play-win-actions">' +
            again +
            '<button type="button" class="play-win-btn play-win-write" onclick="writeFoundWord()">🏎️ 寫呢個字</button>' +
        '</div>';
};

window.playAgainCamera = function () {
    window.stopPlayGames();
    if (window.openCamera) window.openCamera();
};

window.writeFoundWord = function () {
    var word = window.Play.word;
    var photo = window.Play.photo;
    var fromCamera = window.Play.source === 'camera';
    window.stopPlayGames();
    if (window.WritingSession && typeof window.WritingSession.begin === 'function') {
        window.WritingSession.begin({
            mode: fromCamera ? 'camera' : 'standard',
            word: word,
            imgUrl: photo || null
        });
        return;
    }
    if (typeof window.enterMode === 'function') window.enterMode('standard');
    if (window.processWord) window.processWord(word, photo);
};

window.startPuzzleGame = function () {
    var pool = window.D || [];
    var item = pool.length ? pool[Math.floor(Math.random() * pool.length)] : { w: 'cat', emoji: '🐱' };
    window.startHideSeek({ word: item.w, source: 'puzzle' });
};
