// ==========================================
// Camera reward games: hide-and-seek + spot the difference
// ==========================================

window.Play = {
    active: false,
    word: '',
    emoji: '⭐',
    photo: null,
    round: 0,
    found: 0,
    mode: 'seek', // seek | diff
    hideAt: -1,
    diffAt: -1,
    cells: [],
    timer: null
};

function playStage() { return document.getElementById('play-stage'); }
function playMsg(text, color) {
    var el = document.getElementById('play-msg');
    if (!el) return;
    el.innerText = text;
    if (color) el.style.color = color;
}

window.stopPlayGames = function () {
    window.Play.active = false;
    if (window.Play.timer) {
        clearInterval(window.Play.timer);
        window.Play.timer = null;
    }
    var overlay = document.getElementById('play-overlay');
    if (overlay) {
        overlay.style.display = 'none';
        overlay.classList.remove('is-open');
    }
};

window.startHideSeek = function (opts) {
    opts = opts || {};
    var info = window.Arcade.lookup(opts.word);
    window.Play.active = true;
    window.Play.word = info.w;
    window.Play.emoji = info.emoji || '⭐';
    window.Play.photo = opts.photo || null;
    window.Play.round = 0;
    window.Play.found = 0;
    window.Play.mode = 'seek';

    var overlay = document.getElementById('play-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        overlay.classList.add('is-open');
    }
    document.getElementById('play-title').innerText = '🙈 捉迷藏';
    playMsg(info.w.toUpperCase() + ' 匿咗喺草叢！搵佢出嚟！', '#1d3557');
    document.getElementById('play-found').innerText = '0';

    if (window.Arcade) {
        window.Arcade.say('搵到喇！係 ' + info.w + '。聽完英文，去草叢搵返佢！');
        setTimeout(function () { window.Arcade.speakEnglish(info.w); }, 900);
    }
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
        btn.innerHTML = '<span class="bush">🌳</span><span class="peek">' + cell.emoji + '</span>';
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
        document.getElementById('play-found').innerText = String(window.Play.found);
        if (window.Arcade) {
            window.Arcade.pop();
            window.Arcade.addStars(1);
        }
        playMsg('搵到 ' + window.Play.word + ' ' + window.Play.emoji + '！', '#06d6a0');
        if (typeof confetti === 'function') confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
        if (window.Play.found >= 3) {
            setTimeout(window.startSpotDiff, 700);
        } else {
            if (window.Arcade) window.Arcade.say('叻仔！再搵多次！');
            setTimeout(window.renderSeekRound, 650);
        }
    } else {
        if (window.Arcade) window.Arcade.boom();
        playMsg('唔係呢度！睇真啲 ' + window.Play.emoji, '#e63946');
    }
};

window.startSpotDiff = function () {
    if (!window.Play.active) return;
    window.Play.mode = 'diff';
    document.getElementById('play-title').innerText = '👀 搵唔同';
    playMsg('兩張相差咗一樣嘢。撳右邊唔同嗰格！', '#1d3557');
    if (window.Arcade) window.Arcade.say('而家玩搵唔同！睇兩張相，撳右邊唔同嗰格。');

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
    stage.className = 'play-stage diff-wrap';
    stage.innerHTML = '';

    function makeGrid(emojis, clickable) {
        var grid = document.createElement('div');
        grid.className = 'diff-grid';
        emojis.forEach(function (em, i) {
            var cell = document.createElement(clickable ? 'button' : 'div');
            cell.className = 'diff-cell';
            if (clickable) cell.type = 'button';
            cell.textContent = em;
            if (clickable) {
                cell.onclick = function () { window.checkDiffTap(i); };
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
        if (window.Arcade) {
            window.Arcade.winFanfare();
            window.Arcade.addStars(2);
            window.Arcade.say('全部過關！' + window.Play.word + ' 好叻！');
        }
        playMsg('全部過關！' + window.Play.word.toUpperCase() + ' ' + window.Play.emoji, '#06d6a0');
        window.showPlayWin();
    } else {
        if (window.Arcade) window.Arcade.boom();
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
    stage.innerHTML =
        photo +
        '<p class="play-win-word">' + window.Play.word + '</p>' +
        '<div class="play-win-actions">' +
            '<button type="button" class="play-win-btn" onclick="playAgainCamera()">📸 再影一樣</button>' +
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
    window.stopPlayGames();
    if (typeof window.enterMode === 'function') window.enterMode('standard');
    if (window.processWord) window.processWord(word, photo);
};

window.startPuzzleGame = function () {
    var pool = window.D || [];
    var item = pool[Math.floor(Math.random() * pool.length)] || { w: 'cat', emoji: '🐱' };
    window.startHideSeek({ word: item.w });
};
