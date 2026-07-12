// ==========================================
// 🎨 畫布渲染、描寫演算法與字詞處理模組 (修復版)
// ==========================================

// 預防全域變量缺失
window.aCtx = window.aCtx || (window.AudioContext ? new AudioContext() : null);
window.lastCalc = 0;
window.isMagic = false;
window.strokeIdx = 0;
window.doneStrokes = [];
window.curStroke = [];
window.isDrawing = false;
window.currentPercent = 0;
window.currentWPs = [];
window.nextWpIdx = 0;
window.magicStart = 0;
window.fired = false;
window.imgCache = {};

window.preloadImage = function(url) {
    if(!url || window.imgCache[url]) return;
    let img = new Image();
    img.src = url;
    window.imgCache[url] = img;
};

window.resetCanvas = function() {
    if (typeof D === 'undefined' || typeof idx === 'undefined' || !D[idx]) return;
    isMagic = false; strokeIdx = 0; doneStrokes = []; curStroke = []; isDrawing = false; currentPercent = 0;
    
    let currentData = D[idx];
    let lastP = currentData.p[currentData.p.length - 1];
    if(lastP && lastP.img) preloadImage(lastP.img);
    
    // 初始化離屏畫布
    const offCtx = document.createElement('canvas').getContext('2d');
    offCtx.canvas.width = 300; offCtx.canvas.height = 300;
    currentData.st.forEach(st => drawLineToCtx(offCtx, st, '#000', false, 25));
    window.guideData = offCtx.getImageData(0, 0, 300, 300).data;
    
    window.totalGuide = 0;
    for(let i=3; i<guideData.length; i+=4) if(guideData[i] > 50) totalGuide++;
    
    initWaypoints();
    const wrapper = document.getElementById('canvas-wrapper');
    if(wrapper) wrapper.style.transform = "scale(1) rotate(0deg)";
    updateMsg();
};

window.initWaypoints = function() {
    if(typeof D === 'undefined' || !D[idx] || strokeIdx >= D[idx].st.length) { currentWPs = []; return; }
    let st = D[idx].st[strokeIdx];
    currentWPs = [];
    for(let i=0; i<st.length-2; i+=2) {
        let x1=st[i], y1=st[i+1], x2=st[i+2], y2=st[i+3];
        let dist = Math.hypot(x2-x1, y2-y1);
        let steps = Math.max(1, Math.ceil(dist / 15)); 
        for(let j=0; j<steps; j++) currentWPs.push({x: x1+(x2-x1)*(j/steps), y: y1+(y2-y1)*(j/steps)});
    }
    currentWPs.push({x: st[st.length-2], y: st[st.length-1]});
    nextWpIdx = 0;
};

window.updateMsg = function() {
    const msg = document.getElementById('msg');
    if(!msg || typeof D === 'undefined' || !D[idx]) return;
    if(strokeIdx < D[idx].st.length) {
        msg.innerText = `完成度: ${currentPercent}% (第 ${strokeIdx+1} 筆)`;
        msg.style.color = "#1982c4";
    } else {
        msg.innerText = `完成度: 100% - 好叻！撳 ✨ 變魔術啦！`;
        msg.style.color = "#06d6a0";
    }
};

window.drawLineToCtx = function(c, pts, col, dash, width=25) {
    if(!pts || pts.length < 2) return;
    c.beginPath(); c.moveTo(pts[0], pts[1]);
    for(let i=2; i<pts.length; i+=2) c.lineTo(pts[i], pts[i+1]);
    c.strokeStyle = col; c.lineWidth = width; c.lineCap = 'round'; c.lineJoin = 'round';
    c.setLineDash(dash ? [10,15] : []); c.stroke();
};

window.loop = function() {
    const cvs = document.getElementById('cvs');
    if(!cvs) { requestAnimationFrame(loop); return; }
    const ctx = cvs.getContext('2d');
    
    ctx.clearRect(0,0,300,300);
    if(!isMagic) {
        if(typeof D !== 'undefined' && D[idx]) {
            D[idx].st.forEach(st => drawLineToCtx(ctx, st, '#e0e0e0', true, 25)); 
            doneStrokes.forEach(st => drawLineToCtx(ctx, st, '#ff9f1c', false, 25)); 
            drawLineToCtx(ctx, curStroke, '#ffca3a', false, 25); 
        }
    } else {
        let dt = Date.now() - magicStart;
        if(typeof D !== 'undefined' && D[idx]) {
            let phase = D[idx].p.slice().reverse().find(p => dt >= p.t);
            if(phase) {
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                if(phase.type === 'letter') { 
                    ctx.font = 'bold 200px Arial'; ctx.fillStyle = '#ff595e'; ctx.fillText(phase.text, 150, 150); 
                }
                else if(phase.type === 'phonic') {
                   phase.pData.forEach((pd, i) => {
                       let isHl = (i === phase.hlIdx);
                       ctx.font = 'bold 60px Comic Sans MS';
                       ctx.fillStyle = isHl ? '#e63946' : '#1d3557';
                       ctx.fillText(pd.letter, 50 + (i * 40), 150);
                   });
                }
            }
        }
    }
    requestAnimationFrame(loop);
};

// 統一 Phonic 數據生成 (移入 canvas.js 避免重複定義)
window.createPhonicTimeline = function(word, imgUrl = null) {
    let firstLetter = word.charAt(0).toUpperCase();
    const simpleIPA = { a:'/æ/', b:'/b/', c:'/k/', d:'/d/', e:'/ɛ/', f:'/f/', g:'/g/', h:'/h/', i:'/ɪ/', j:'/dʒ/', k:'/k/', l:'/l/', m:'/m/', n:'/n/', o:'/ɒ/', p:'/p/', q:'/kw/', r:'/r/', s:'/s/', t:'/t/', u:'/ʌ/', v:'/v/', w:'/w/', x:'/ks/', y:'/j/', z:'/z/' };
    
    let pData = word.split('').map(char => ({ 
        letter: char, 
        ipa: char === ' ' ? '' : (simpleIPA[char.toLowerCase()] || '') 
    }));
    
    let dynamicP = [{ t: 0, type: 'letter', text: firstLetter }];
    let currentTime = 1500; 
    let ssmlPhonics = "";
    
    word.split('').forEach((char, i) => {
        if (char !== ' ') {
            dynamicP.push({ t: currentTime, type: 'phonic', pData: pData, hlIdx: i });
            currentTime += 850;
            let ipa = simpleIPA[char.toLowerCase()] || char;
            ssmlPhonics += `<phoneme alphabet="ipa" ph="${ipa.replace(/\//g, '')}">${char}</phoneme> <break time="0.6s"/> `;
        }
    });
    
    dynamicP.push({ t: currentTime + 500, type: 'word', text: word.toUpperCase(), img: imgUrl });
    let finalSSML = `<speak><prosody rate="0.85"><say-as interpret-as="characters">${firstLetter}</say-as> <break time="1s"/> ${ssmlPhonics} <break time="0.6s"/> ${word}</prosody></speak>`;
    
    return { 
        l: firstLetter, w: word, ssml: finalSSML, p: dynamicP, 
        st: (typeof letterStrokes !== 'undefined' ? letterStrokes[firstLetter] : []) || [] 
    };
};

window.processWord = function(word, imgUrl = null) {
    if(typeof D === 'undefined') window.D = [];
    let newD = createPhonicTimeline(word, imgUrl);
    D.push(newD);
    window.idx = D.length - 1;
    if(window.playCantoneseTTS) window.playCantoneseTTS(`搵到喇！係 ${word}，孜孜，一齊寫 ${newD.l} 啦。`);
    let wrap = document.getElementById('canvas-wrapper');
    if (wrap) wrap.style.display = 'block';
    resetCanvas();
};

loop();
