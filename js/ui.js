// ==========================================
// Standard-mode UI: tabs, letter keyboard, startApp
// ==========================================

if (typeof D === 'undefined') {
    alert('載入詞庫失敗，請檢查 js/data.js 係咪正確。');
}

window.startApp = function (mode) {
    window.ensureAudioContext();
    if (typeof D === 'undefined' || !D.length) return;

    renderTabs();
    // Activates group-1 tabs/keyboard and picks a starting word from that group
    window.selectGroup(0);
    window.setMode(mode || 'standard');
    window.startRenderLoop();
};

window.setMode = function (mode) {
    const msg = document.getElementById('msg');
    if (msg) {
        msg.innerText = '由綠色點出發，畫到尾為止！';
        msg.style.color = '#1982c4';
    }

    if (window.WritingSession && typeof window.WritingSession.begin === 'function') {
        window.WritingSession.begin({ mode: mode || 'standard' });
        return;
    }

    // Fallback if writing.js failed to load
    const standardUi = document.getElementById('standard-ui');
    const canvasWrapper = document.getElementById('canvas-wrapper');
    if (canvasWrapper) canvasWrapper.style.display = 'block';
    if (mode === 'standard') {
        if (standardUi) standardUi.style.display = 'block';
        if (typeof window.resetCanvas === 'function') window.resetCanvas();
    } else if (mode === 'camera') {
        if (standardUi) standardUi.style.display = 'none';
    }
};

function renderTabs() {
    const tabsDiv = document.getElementById('group-tabs');
    if (!tabsDiv || typeof phonicsGroups === 'undefined') return;
    tabsDiv.innerHTML = '';
    phonicsGroups.forEach(function (g, i) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tab';
        btn.innerText = g.name;
        btn.onclick = function () { window.selectGroup(i); };
        tabsDiv.appendChild(btn);
    });
}

window.selectGroup = function (gIndex) {
    if (typeof D === 'undefined' || typeof phonicsGroups === 'undefined') return;
    // Only change keyboard in standard mode (camera writing hides #standard-ui)
    document.querySelectorAll('.tab').forEach(function (t, i) {
        t.classList.toggle('active', i === gIndex);
    });

    const kb = document.getElementById('kb');
    if (!kb) return;
    kb.innerHTML = '';

    const group = phonicsGroups[gIndex];
    if (!group) return;

    group.letters.forEach(function (letter) {
        const btn = document.createElement('div');
        btn.className = 'key';
        btn.innerText = letter;
        btn.onclick = function () {
            const matches = D.map(function (d, i) {
                return d.l === letter ? i : -1;
            }).filter(function (i) { return i !== -1; });
            if (matches.length > 0) {
                window.idx = matches[Math.floor(Math.random() * matches.length)];
                if (typeof window.resetCanvas === 'function') window.resetCanvas();
            }
        };
        kb.appendChild(btn);
    });

    // Pick a word from the first letter of the group if current idx is outside group
    const firstLetter = group.letters[0];
    const initMatches = D.map(function (d, i) {
        return d.l === firstLetter ? i : -1;
    }).filter(function (i) { return i !== -1; });
    if (initMatches.length > 0) {
        window.idx = initMatches[Math.floor(Math.random() * initMatches.length)];
        if (typeof window.resetCanvas === 'function') window.resetCanvas();
    }
};
