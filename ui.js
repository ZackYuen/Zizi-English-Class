// UI 介面控制與系統發音模組
if (typeof D === 'undefined') {
    alert("載入詞庫失敗，請檢查 data.js 檔案係咪正確放在同一個資料夾。");
}

window.preloadImage = function(url) {
    if(!url || imgCache[url]) return;
    let img = new Image(); img.src = url; imgCache[url] = img;
};

window.startApp = function(mode) {
    if(!aCtx) {
        try {
            aCtx = new (window.AudioContext || window.webkitAudioContext)();
            mAudio.src='data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
            mAudio.play().catch(e => console.log("Audio play blocked", e));
        } catch(e) { console.log("Web Audio API not supported", e); }
    }
    document.getElementById('start-overlay').style.display = 'none';
    if (typeof D !== 'undefined' && D.length > 0) {
        // 🌟 基礎 Mode 一開始隨機揀一個字，唔好次次都一樣
        window.idx = Math.floor(Math.random() * D.length);
        
        renderTabs();
        setMode(mode);
        requestAnimationFrame(loop);
    }
};

window.toggleMode = function() {
    setMode(currentMode === 'standard' ? 'camera' : 'standard');
};

window.setMode = function(mode) {
    currentMode = mode;
    document.getElementById('standard-ui').style.display = (mode === 'standard') ? 'block' : 'none';
    document.getElementById('camera-ui-container').style.display = (mode === 'camera') ? 'block' : 'none';
    
    const canvasWrapper = document.getElementById('canvas-wrapper');
    
    if (mode === 'camera') {
        // 🌟 未影相之前隱藏畫板，乾淨 UI
        if (canvasWrapper) canvasWrapper.style.display = 'none';
        document.getElementById('msg').innerText = "撳下面個掣，影低身邊嘅嘢啦！";
    } else {
        // 🌟 基礎模式顯示畫板
        if (canvasWrapper) canvasWrapper.style.display = 'block';
        document.getElementById('msg').innerText = "由綠色點出發，畫到尾為止！";
        resetCanvas();
    }
    document.getElementById('msg').style.color = "#1982c4";
};

function renderTabs() {
    const tabsDiv = document.getElementById('group-tabs');
    if(!tabsDiv) return;
    tabsDiv.innerHTML = '';
    phonicsGroups.forEach((g, i) => {
        const btn = document.createElement('button');
        btn.className = 'tab'; btn.innerText = g.name;
        btn.onclick = () => selectGroup(i);
        tabsDiv.appendChild(btn);
    });
}

function selectGroup(gIndex) {
    if(currentMode !== 'standard' || typeof D === 'undefined') return;
    document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i === gIndex));
    const kb = document.getElementById('kb'); 
    if(!kb) return;
    kb.innerHTML = '';
    phonicsGroups[gIndex].letters.forEach(letter => {
        const btn = document.createElement('div'); btn.className = 'key'; btn.innerText = letter;
        btn.onclick = () => {
            let matches = D.map((d, i) => d.l === letter ? i : -1).filter(i => i !== -1);
            if(matches.length > 0) { idx = matches[Math.floor(Math.random() * matches.length)]; resetCanvas(); }
        };
        kb.appendChild(btn);
    });
    let initMatches = D.map((d, i) => d.l === phonicsGroups[gIndex].letters[0] ? i : -1).filter(i => i !== -1);
    if(initMatches.length > 0) { idx = initMatches[Math.floor(Math.random() * initMatches.length)]; resetCanvas(); }
}

window.speakAlert = function(text) {
    const msg = document.getElementById('msg');
    msg.innerText = text;
    msg.style.color = "#ff595e";
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-HK';
    window.speechSynthesis.speak(utterance);
};
