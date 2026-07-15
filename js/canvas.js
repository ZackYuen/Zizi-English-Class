// ==========================================
// Canvas: tracing, magic TTS animation, processWord
// State lives in state.js — do not redeclare it here
// ==========================================

window.preloadImage = function(url) {
    if (!url || window.imgCache[url]) return;
    const img = new Image();
    img.src = url;
    window.imgCache[url] = img;
};

window.resetCanvas = function() {
    if (typeof D === 'undefined' || typeof idx === 'undefined' || !D[idx]) return;
    
    isMagic = false; strokeIdx = 0; doneStrokes = []; curStroke = []; isDrawing = false; currentPercent = 0;
    
    let currentData = D[idx];
    let lastP = currentData.p[currentData.p.length - 1];
    if(lastP && lastP.img) preloadImage(lastP.img);
    
    // 確保 offCtx 存在 (修復 ReferenceError)
    window.offCtx = window.offCtx || document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    window.offCtx.canvas.width = 300; 
    window.offCtx.canvas.height = 300;
    window.offCtx.clearRect(0,0,300,300);
    
    currentData.st.forEach(st => drawLineToCtx(window.offCtx, st, '#000', false, 22));
    window.guideData = window.offCtx.getImageData(0, 0, 300, 300).data;
    
    window.totalGuide = 0;
    for(let i=3; i<window.guideData.length; i+=4) {
        if(window.guideData[i] > 50) window.totalGuide++;
    }
    window.strokeAttempts = [];
    
    // 準備用嚟計分嘅 User Canvas
    window.userCtx = window.userCtx || document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    window.userCtx.canvas.width = 300;
    window.userCtx.canvas.height = 300;
    
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
        let steps = Math.max(1, Math.ceil(dist / 12)); 
        for(let j=0; j<steps; j++) currentWPs.push({x: x1+(x2-x1)*(j/steps), y: y1+(y2-y1)*(j/steps)});
    }
    currentWPs.push({x: st[st.length-2], y: st[st.length-1]});
    nextWpIdx = 0;
};

window.updateMsg = function() {
    const msg = document.getElementById('msg');
    if(!msg || typeof D === 'undefined' || !D[idx]) return;
    const passAt = window.WRITE_PASS_SCORE || 80;
    if(strokeIdx < D[idx].st.length) {
        msg.innerText = '完成度: ' + currentPercent + '% / ' + passAt + '%（第 ' + (strokeIdx+1) + ' 筆）';
        msg.style.color = currentPercent >= passAt ? '#06d6a0' : '#1982c4';
    } else {
        if (window.currentMode === 'camera') {
            msg.innerText = '完成度: ' + currentPercent + '% - 撳 ✨ 讀出嚟，或者 📸 再影一個！';
        } else {
            msg.innerText = '完成度: ' + currentPercent + '% - 好叻！撳 ✨ 讀出嚟啦！';
        }
        msg.style.color = '#06d6a0';
    }
};

window.playSnd = function(f, t, dur=0.3) {
    const ctx = window.ensureAudioContext ? window.ensureAudioContext() : window.aCtx;
    if (!ctx) return;
    try {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination); o.type = t; o.frequency.value = f;
        g.gain.setValueAtTime(0.3, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
        o.start(); o.stop(ctx.currentTime + dur);
    } catch (e) {}
};

window.drawLineToCtx = function(c, pts, col, dash, width=25) {
    if(!pts || pts.length < 2) return;
    c.beginPath(); c.moveTo(pts[0], pts[1]);
    for(let i=2; i<pts.length; i+=2) c.lineTo(pts[i], pts[i+1]);
    c.strokeStyle = col; c.lineWidth = width; c.lineCap = 'round'; c.lineJoin = 'round';
    c.setLineDash(dash ? [10,15] : []); c.stroke();
};

window.getPointOnPath = function(pts, prog) {
    let len=0, dists=[];
    for(let i=0; i<pts.length-2; i+=2) {
        let d = Math.hypot(pts[i+2]-pts[i], pts[i+3]-pts[i+1]);
        dists.push(d); len += d;
    }
    let target = len * prog, cur = 0;
    for(let i=0; i<dists.length; i++) {
        if(cur + dists[i] >= target) {
            let ratio = dists[i]===0 ? 0 : (target - cur) / dists[i];
            return { x: pts[i*2] + (pts[i*2+2]-pts[i*2])*ratio, y: pts[i*2+1] + (pts[i*2+3]-pts[i*2+1])*ratio };
        }
        cur += dists[i];
    }
    return { x: pts[pts.length-2], y: pts[pts.length-1] };
};

window.loop = function() {
    const cvs = document.getElementById('cvs');
    if(!cvs) { requestAnimationFrame(window.loop); return; }
    const ctx = cvs.getContext('2d');
    
    ctx.clearRect(0,0,300,300);
    if(!isMagic) {
        if(typeof D !== 'undefined' && D[idx]) {
            D[idx].st.forEach(st => drawLineToCtx(ctx, st, '#e0e0e0', true, 25));
            if (window.strokeAttempts && window.strokeAttempts.length) {
                window.strokeAttempts.forEach(st => drawLineToCtx(ctx, st, 'rgba(255,159,28,0.35)', false, 22));
            }
            doneStrokes.forEach(st => drawLineToCtx(ctx, st, '#ff9f1c', false, 25));
            drawLineToCtx(ctx, curStroke, '#ffca3a', false, 25); 
            
            // 畫引導點同進度球
            if(strokeIdx < D[idx].st.length && currentWPs.length > 0) {
                let gi = Math.min(nextWpIdx, currentWPs.length - 1);
                let targetWP = currentWPs[gi];
                if(targetWP) { ctx.beginPath(); ctx.arc(targetWP.x, targetWP.y, 16, 0, 7); ctx.fillStyle='#06d6a0'; ctx.fill(); }
                let pt = getPointOnPath(D[idx].st[strokeIdx], (Date.now()%2000)/2000);
                ctx.beginPath(); ctx.arc(pt.x, pt.y, 10, 0, 7); ctx.fillStyle='#1982c4'; ctx.fill();
            }
            
            // 計分邏輯（較嚴格）
            if(Date.now() - lastCalc > 150 && window.totalGuide > 0 && strokeIdx < D[idx].st.length && window.userCtx) {
                lastCalc = Date.now();
                currentPercent = window.computeWriteCoverage();
                updateMsg();
            }
        }
    } else {
        // 魔術動畫邏輯
        let dt = Date.now() - magicStart;
        if(typeof D !== 'undefined' && D[idx]) {
            let phase = D[idx].p.slice().reverse().find(p => dt >= p.t);
            if(phase) {
                ctx.textAlign='center'; ctx.textBaseline='middle';
                if(phase.type === 'letter') { 
                    ctx.font='bold 200px Arial'; ctx.fillStyle='#ff595e'; ctx.fillText(phase.text, 150, 150); 
                }
                else if(phase.type === 'phonic') {
                    let baseFSize = 65;
                    let ipaFSize = 26;
                    
                    let widths = phase.pData.map(pd => {
                        if (pd.letter === ' ') return 15; 
                        ctx.font = `bold ${baseFSize}px Comic Sans MS`;
                        return ctx.measureText(pd.letter).width + 10;
                    });
                    let totalW = widths.reduce((a,b) => a + b, 0);
                    
                    let scale = totalW > 280 ? 280 / totalW : 1;
                    let scaledBaseFSize = Math.floor(baseFSize * scale);
                    let scaledIpaFSize = Math.floor(ipaFSize * scale);
                    let startX = 150 - (totalW * scale / 2);

                    phase.pData.forEach((pd, i) => {
                        let w = widths[i] * scale;
                        if (pd.letter !== ' ') {
                            let isVowel = ['a','e','i','o','u'].includes(pd.letter.toLowerCase());
                            let isHl = (i === phase.hlIdx);
                            
                            ctx.font = `bold ${scaledBaseFSize}px Comic Sans MS`; 
                            ctx.fillStyle = isHl ? '#e63946' : (isVowel ? '#f4a261' : '#1d3557');
                            ctx.fillText(pd.letter, startX + w/2, 120);
                            
                            ctx.font = `bold ${scaledIpaFSize}px Arial`; 
                            ctx.fillStyle = isHl ? '#ffca3a' : '#8ac926';
                            ctx.fillText(pd.ipa, startX + w/2, 190);
                        }
                        startX += w;
                    });
                } else if(phase.type === 'word') {
                    if(phase.img && window.imgCache[phase.img] && window.imgCache[phase.img].complete) {
                        let img = window.imgCache[phase.img];
                        let maxWidth = 220, maxHeight = 160;
                        let ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
                        let drawW = img.width * ratio, drawH = img.height * ratio;
                        ctx.drawImage(img, 150 - (drawW / 2), 110 - (drawH / 2), drawW, drawH);
                    }
                    else { ctx.font='100px Arial'; ctx.fillText(D[idx].emoji || '', 150, 100); }
                    
                    let fSize = 50;
                    ctx.font = `bold ${fSize}px Comic Sans MS`;
                    while(ctx.measureText(phase.text).width > 280 && fSize > 20) {
                        fSize -= 2;
                        ctx.font = `bold ${fSize}px Comic Sans MS`;
                    }
                    ctx.fillStyle='#1d3557'; 
                    ctx.fillText(phase.text, 150, 260);
                    
                    if(!fired && typeof confetti !== 'undefined') { 
                        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }}); 
                        fired=true; 
                    }
                }
            }
        }
    }
    requestAnimationFrame(window.loop);
};

// Drawing: ink follows finger to the end; commit only at stroke end
window.WRITE_PASS_SCORE = 80;
var HIT_START = 70;
var HIT_PROGRESS = 56;
var HIT_END = 40;

window.getCanvasPos = function(e, canvas) {
    var r = canvas.getBoundingClientRect();
    var scaleX = canvas.width / Math.max(r.width, 1);
    var scaleY = canvas.height / Math.max(r.height, 1);
    var clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    return {
        x: (clientX - r.left) * scaleX,
        y: (clientY - r.top) * scaleY
    };
};

window.computeWriteCoverage = function () {
    if (!window.userCtx || !window.guideData || !window.totalGuide) return 0;
    window.userCtx.clearRect(0, 0, 300, 300);
    var scoreW = 14;
    if (window.strokeAttempts) {
        window.strokeAttempts.forEach(function (st) {
            drawLineToCtx(window.userCtx, st, '#000', false, scoreW);
        });
    }
    doneStrokes.forEach(function (st) {
        drawLineToCtx(window.userCtx, st, '#000', false, scoreW);
    });
    drawLineToCtx(window.userCtx, curStroke, '#000', false, scoreW);
    var drawData = window.userCtx.getImageData(0, 0, 300, 300).data;
    var covered = 0;
    for (var i = 3; i < window.guideData.length; i += 4) {
        if (window.guideData[i] > 50 && drawData[i] > 50) covered++;
    }
    return Math.min(100, Math.round((covered / window.totalGuide) * 100));
};

function finishLetterComplete(pointerId) {
    var cvsEl = document.getElementById('cvs');
    isDrawing = false;
    window._strokeCommitPending = false;
    if (cvsEl && pointerId != null) {
        try { cvsEl.releasePointerCapture(pointerId); } catch (err) {}
    }

    currentPercent = window.computeWriteCoverage();
    var passAt = window.WRITE_PASS_SCORE || 80;

    if (currentPercent < passAt) {
        var msg = document.getElementById('msg');
        if (msg) {
            msg.innerText = '仲差啲！而家 ' + currentPercent + '%，要 ' + passAt + '% 先得。再跟實虛線畫過！';
            msg.style.color = '#e63946';
        }
        if (window.playCantoneseTTS) {
            window.playCantoneseTTS('仲差啲！要跟實虛線再畫過！');
        }
        setTimeout(function () { resetCanvas(); }, 900);
        return;
    }

    updateMsg();

    if (window.currentMode === 'camera') {
        var reCam = document.getElementById('btn-re-cam');
        if (reCam) reCam.style.display = 'inline-block';
    }

    if (typeof D !== 'undefined' && D[idx] && window.awardStars) {
        window.awardStars(1, {
            word: D[idx].w,
            emoji: D[idx].emoji,
            letter: D[idx].l,
            reason: '寫完字母'
        });
    }

    setTimeout(function () {
        [523, 659, 783, 1046].forEach(function (f, i) {
            setTimeout(function () { playSnd(f, 'triangle', 0.3); }, i * 100);
        });
    }, 200);
    if (D[idx] && D[idx].l) {
        setTimeout(function () {
            if (window.playCantoneseTTS) window.playCantoneseTTS('叻仔！寫好咗 ' + D[idx].l);
            if (window.speakEnglish) window.speakEnglish(D[idx].l, { rate: 0.9 });
        }, 500);
    }
}

function advanceStrokeProgress(pos) {
    if (!currentWPs.length) return;

    // Advance along path while finger stays in corridor (monotonic)
    var i = Math.max(0, nextWpIdx - 1);
    while (i < currentWPs.length) {
        var d = Math.hypot(pos.x - currentWPs[i].x, pos.y - currentWPs[i].y);
        if (d <= HIT_PROGRESS) {
            nextWpIdx = Math.max(nextWpIdx, i + 1);
            i++;
            continue;
        }
        // small look-ahead (1 step) for fast fingers
        if (i + 1 < currentWPs.length) {
            var d2 = Math.hypot(pos.x - currentWPs[i + 1].x, pos.y - currentWPs[i + 1].y);
            if (d2 <= HIT_PROGRESS) {
                nextWpIdx = Math.max(nextWpIdx, i + 2);
                i += 2;
                continue;
            }
        }
        break;
    }

    // Never mark complete until finger is close to the REAL end
    // and almost all waypoints were visited (prevents cutting off at ~78%)
    var end = currentWPs[currentWPs.length - 1];
    var distEnd = Math.hypot(pos.x - end.x, pos.y - end.y);
    var prog = nextWpIdx / Math.max(1, currentWPs.length);
    if (distEnd <= HIT_END && prog >= 0.94) {
        nextWpIdx = currentWPs.length;
        window._strokeCommitPending = true;
    } else {
        window._strokeCommitPending = false;
    }
}

function commitCurrentStroke(pointerId, pos) {
    if (!currentWPs.length || nextWpIdx < currentWPs.length) return false;

    playSnd(880, 'sine', 0.2);
    if (curStroke && curStroke.length >= 2) doneStrokes.push(curStroke);
    curStroke = [];
    window._strokeCommitPending = false;
    strokeIdx++;
    initWaypoints();

    if (typeof D !== 'undefined' && D[idx] && strokeIdx >= D[idx].st.length) {
        finishLetterComplete(pointerId);
        return true;
    }

    var nextStart = currentWPs[0];
    if (pos && nextStart && Math.hypot(pos.x - nextStart.x, pos.y - nextStart.y) < HIT_START) {
        isDrawing = true;
        curStroke = [pos.x, pos.y];
    } else {
        isDrawing = false;
        var cvsEl = document.getElementById('cvs');
        if (cvsEl && pointerId != null) {
            try { cvsEl.releasePointerCapture(pointerId); } catch (err) {}
        }
    }
    return true;
}

function onStrokeStart(e) {
    if (e.type.startsWith('touch') && window._strokeInput === 'pointer') return;
    if (e.type.startsWith('pointer')) window._strokeInput = 'pointer';
    if (e.type.startsWith('touch')) window._strokeInput = 'touch';

    if (window.stopAllAudio) window.stopAllAudio();
    if (isMagic || typeof D === 'undefined' || !D[idx] || strokeIdx >= D[idx].st.length) return;
    if (isDrawing) return;
    if (e.cancelable) e.preventDefault();

    var cvsEl = document.getElementById('cvs');
    if (!cvsEl) return;
    var pos = getCanvasPos(e, cvsEl);
    var target = currentWPs[nextWpIdx] || currentWPs[0];
    var startPt = currentWPs[0];
    var nearTarget = target && Math.hypot(pos.x - target.x, pos.y - target.y) <= HIT_START;
    var nearStart = startPt && nextWpIdx <= 2 && Math.hypot(pos.x - startPt.x, pos.y - startPt.y) <= HIT_START;
    if (!nearTarget && !nearStart) return;

    isDrawing = true;
    window._strokeCommitPending = false;
    if (curStroke && curStroke.length >= 4) {
        window.strokeAttempts = window.strokeAttempts || [];
        window.strokeAttempts.push(curStroke);
    }
    curStroke = [pos.x, pos.y];
    if (e.pointerId != null && cvsEl.setPointerCapture) {
        try { cvsEl.setPointerCapture(e.pointerId); } catch (err) {}
    }
}

function onStrokeMove(e) {
    if (e.type.startsWith('touch') && window._strokeInput === 'pointer') return;
    if (!isDrawing || isMagic) return;
    if (e.cancelable) e.preventDefault();

    var cvsEl = document.getElementById('cvs');
    if (!cvsEl) return;
    var pos = getCanvasPos(e, cvsEl);

    // Always keep painting with the finger — do not cut ink mid-stroke
    curStroke.push(pos.x, pos.y);
    advanceStrokeProgress(pos);

    // Only commit after the finger has actually arrived at the end point
    if (window._strokeCommitPending && currentWPs.length) {
        var end = currentWPs[currentWPs.length - 1];
        if (Math.hypot(pos.x - end.x, pos.y - end.y) <= HIT_END * 0.6) {
            commitCurrentStroke(e.pointerId, pos);
        }
    }
}

function onStrokeEnd(e) {
    if (e && e.type.startsWith('touch') && window._strokeInput === 'pointer') return;
    if (e && e.cancelable) e.preventDefault();

    var cvsEl = document.getElementById('cvs');
    var pos = null;
    if (cvsEl && e) {
        try { pos = getCanvasPos(e, cvsEl); } catch (err) { pos = null; }
    }

    if (isDrawing && currentWPs && currentWPs.length) {
        if (pos) advanceStrokeProgress(pos);
        var end = currentWPs[currentWPs.length - 1];
        var prog = nextWpIdx / Math.max(1, currentWPs.length);
        var nearEnd = !!(end && pos && Math.hypot(pos.x - end.x, pos.y - end.y) <= HIT_END * 1.5);
        if (nextWpIdx >= currentWPs.length || (nearEnd && prog >= 0.9)) {
            nextWpIdx = currentWPs.length;
            commitCurrentStroke(e && e.pointerId, pos);
        }
    }

    isDrawing = false;
    window._strokeInput = null;
    window._strokeCommitPending = false;
    if (cvsEl && e && e.pointerId != null) {
        try { cvsEl.releasePointerCapture(e.pointerId); } catch (err) {}
    }
}

const cvs = document.getElementById('cvs');
if (cvs) {
    cvs.style.touchAction = 'none';

    if (window.PointerEvent) {
        cvs.addEventListener('pointerdown', onStrokeStart);
        cvs.addEventListener('pointermove', onStrokeMove);
        cvs.addEventListener('pointerup', onStrokeEnd);
        cvs.addEventListener('pointercancel', onStrokeEnd);
    } else {
        cvs.addEventListener('touchstart', onStrokeStart, { passive: false });
        cvs.addEventListener('touchmove', onStrokeMove, { passive: false });
        cvs.addEventListener('touchend', onStrokeEnd, { passive: false });
        cvs.addEventListener('touchcancel', onStrokeEnd, { passive: false });
        cvs.addEventListener('mousedown', onStrokeStart);
        cvs.addEventListener('mousemove', onStrokeMove);
        cvs.addEventListener('mouseup', onStrokeEnd);
    }
}

// 🌟 重新補回魔術功能 (讀字)
window.magic = async function() {
    if (window.ensureAudioContext) window.ensureAudioContext();
    if(typeof D === 'undefined' || !D[idx]) return;
    if(strokeIdx < D[idx].st.length) { 
        let msgBox = document.getElementById('msg');
        if(msgBox) { msgBox.innerText = "未畫完喎！"; msgBox.style.color = "#ff595e"; }
        return; 
    }
    
    if(window.stopAllAudio) window.stopAllAudio(); 
    
    let key = localStorage.getItem('google_tts_key');
    if(!key) { 
        if(window.openSettings) window.openSettings(); 
        else alert("請先設定 Google TTS API Key");
        return; 
    }
    
    document.getElementById('canvas-wrapper').style.transform = "scale(0.1) rotate(360deg)";
    document.getElementById('msg').innerText = "聯絡緊 Google TTS...";
    
    try {
        let res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`, {
            method:'POST', body:JSON.stringify({
                input:{ssml:D[idx].ssml},
                voice:{languageCode:'en-US',name:'en-US-Wavenet-F'},
                audioConfig:{audioEncoding:'MP3'}
            })
        });
        let data = await res.json();
        if(data.error) throw data.error;
        window.mAudio = window.mAudio || new Audio();
        window.mAudio.src = 'data:audio/mp3;base64,' + data.audioContent;
    } catch(e) { 
        document.getElementById('msg').innerText = "❌ TTS API Error: " + e.message; 
        return; 
    }
    
    setTimeout(() => {
        isMagic=true; fired=false; magicStart=Date.now(); window.mAudio.play();
        document.getElementById('canvas-wrapper').style.transform = "scale(1) rotate(0deg)";
        const msgEl = document.getElementById('msg');
        if (msgEl) {
            if (window.currentMode === 'camera') {
                msgEl.innerText = '讀完喇！可以撳 📸 再影一個 繼續玩！';
                const reCam = document.getElementById('btn-re-cam');
                if (reCam) reCam.style.display = 'inline-block';
            } else {
                msgEl.innerText = '成功！';
            }
        }
    }, 600);
};

// 統一 Phonic 數據生成
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
    if (typeof D === 'undefined') {
        window.D = [];
    } else if (window.D !== D) {
        window.D = D;
    }

    const normalized = String(word || '').trim().toLowerCase();
    if (!normalized) return;

    // Prefer an existing vocabulary entry when possible
    let matchIdx = D.findIndex(function (d) { return d.w === normalized; });
    if (matchIdx === -1) {
        // Cap dynamic camera words to avoid unbounded growth
        const baseLen = (window._baseVocabLen != null)
            ? window._baseVocabLen
            : D.length;
        window._baseVocabLen = baseLen;
        while (D.length > baseLen + 20) {
            D.pop();
        }
        const newD = createPhonicTimeline(normalized, imgUrl);
        D.push(newD);
        matchIdx = D.length - 1;
    } else if (imgUrl && D[matchIdx]) {
        // Attach captured image to the last phase when matching known word
        const phases = D[matchIdx].p;
        if (phases && phases.length) {
            const last = phases[phases.length - 1];
            if (last && last.type === 'word') last.img = imgUrl;
        }
    }

    window.idx = matchIdx;
    const letter = D[matchIdx] ? D[matchIdx].l : normalized.charAt(0).toUpperCase();

    if (window.playCantoneseTTS) {
        window.playCantoneseTTS('搵到喇！係呢個字，孜孜，一齊寫 ' + letter + ' 啦。');
    }
    if (window.speakEnglish) {
        setTimeout(function () { window.speakEnglish(normalized, { rate: 0.88 }); }, 650);
    }
    if (window.awardStars) {
        const entry = D[matchIdx] || {};
        window.awardStars(1, {
            word: normalized,
            emoji: entry.emoji || '📷',
            letter: letter,
            reason: '魔鏡搵到'
        });
    }

    const wrap = document.getElementById('canvas-wrapper');
    if (wrap) wrap.style.display = 'block';

    if (window.currentMode === 'camera') {
        const reCam = document.getElementById('btn-re-cam');
        if (reCam) reCam.style.display = 'inline-block';
        const stdUi = document.getElementById('standard-ui');
        if (stdUi) stdUi.style.display = 'none';
    }

    window.startRenderLoop();
    resetCanvas();
};

// Start the single render loop once DOM/scripts are ready
window.addEventListener('load', function () {
    window.startRenderLoop();
});
