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
    
    currentData.st.forEach(st => drawLineToCtx(window.offCtx, st, '#000', false, 26));
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
    if(typeof D === 'undefined' || !D[idx] || strokeIdx >= D[idx].st.length) {
        currentWPs = [];
        window.pathT = 0;
        window.fingerPos = null;
        window.guidePos = null;
        return;
    }
    var st = D[idx].st[strokeIdx];
    currentWPs = [];
    var totalLen = 0;
    var segLens = [];
    for (var i = 0; i < st.length - 2; i += 2) {
        var d = Math.hypot(st[i + 2] - st[i], st[i + 3] - st[i + 1]);
        segLens.push(d);
        totalLen += d;
    }
    // Dense samples along path (~8px) with cumulative t in [0,1]
    for (var i = 0; i < st.length - 2; i += 2) {
        var x1 = st[i], y1 = st[i + 1], x2 = st[i + 2], y2 = st[i + 3];
        var dist = segLens[i / 2];
        var steps = Math.max(1, Math.ceil(dist / 8));
        for (var j = 0; j < steps; j++) {
            var u = j / steps;
            var along = 0;
            for (var k = 0; k < i / 2; k++) along += segLens[k];
            along += dist * u;
            currentWPs.push({
                x: x1 + (x2 - x1) * u,
                y: y1 + (y2 - y1) * u,
                t: totalLen > 0 ? along / totalLen : 0
            });
        }
    }
    currentWPs.push({
        x: st[st.length - 2],
        y: st[st.length - 1],
        t: 1
    });
    nextWpIdx = 0;
    window.pathT = 0;
    window.fingerPos = null;
    window.guidePos = currentWPs[0] ? { x: currentWPs[0].x, y: currentWPs[0].y } : null;
};

window.updateMsg = function() {
    const msg = document.getElementById('msg');
    if(!msg || typeof D === 'undefined' || !D[idx]) return;
    const passAt = window.WRITE_PASS_SCORE || 70;
    const session = window.WritingSession;
    const fullMark = (session && session.FULL_MARK) || 100;
    if(strokeIdx < D[idx].st.length) {
        msg.innerText = session && session.formatProgressMsg
            ? session.formatProgressMsg(currentPercent, strokeIdx + 1)
            : ('完成度: ' + currentPercent + '% / ' + fullMark + '%（第 ' + (strokeIdx+1) + ' 筆）');
        msg.style.color = currentPercent >= passAt ? '#06d6a0' : '#1982c4';
    } else {
        msg.innerText = session && session.formatSuccessMsg
            ? session.formatSuccessMsg(currentPercent)
            : ('完成度: ' + currentPercent + '% - 真叻！撳 ✨ 讀出嚟啦！');
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
            
            // Green ball: follows finger while drawing; otherwise sits on path progress
            if (strokeIdx < D[idx].st.length && currentWPs.length > 0) {
                var gpos = null;
                if (isDrawing && window.fingerPos) {
                    gpos = window.fingerPos; // follow finger
                } else if (window.guidePos) {
                    gpos = window.guidePos;
                } else {
                    gpos = currentWPs[0];
                }
                if (gpos) {
                    ctx.beginPath();
                    ctx.arc(gpos.x, gpos.y, 18, 0, Math.PI * 2);
                    ctx.fillStyle = '#06d6a0';
                    ctx.fill();
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = '#fff';
                    ctx.stroke();
                }
                // Idle demo: blue ball runs along the dashed stroke
                if (!isDrawing) {
                    var pt = getPointOnPath(D[idx].st[strokeIdx], (Date.now() % 2000) / 2000);
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, 9, 0, Math.PI * 2);
                    ctx.fillStyle = '#1982c4';
                    ctx.fill();
                }
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

// ==========================================
// Letter tracing engine (browser JS — required for touch/canvas on iPhone)
// - Yellow ink = finger
// - Green ball = follows finger while drawing
// - Progress = project finger onto the stroke path
// ==========================================
// Kid-friendly scoring: pass gate + full mark 100% on success
window.WRITE_PASS_SCORE = 70;
var HIT_START = 78;
var PATH_CORRIDOR = 70;
var HIT_END = 52;
var SCORE_INK_WIDTH = 36;   // fat brush when measuring
var SCORE_DILATE_R = 14;    // allow small finger offset from the dashed guide
var STROKE_CONNECT_EPS = 30; // end≈next start → keep drawing without lift

/** True when stroke A's end point matches stroke B's start (consecutive stroke). */
window.strokesConnect = function (strokeA, strokeB) {
    if (!strokeA || !strokeB || strokeA.length < 4 || strokeB.length < 2) return false;
    var ax = strokeA[strokeA.length - 2];
    var ay = strokeA[strokeA.length - 1];
    return Math.hypot(ax - strokeB[0], ay - strokeB[1]) <= STROKE_CONNECT_EPS;
};

window.nextStrokeConnects = function (fromIdx) {
    if (typeof D === 'undefined' || !D[idx] || !D[idx].st) return false;
    return window.strokesConnect(D[idx].st[fromIdx], D[idx].st[fromIdx + 1]);
};

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
    var scoreW = SCORE_INK_WIDTH;
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
    var W = 300, H = 300;
    var ink = new Uint8Array(W * H);
    var i, x, y, p;
    for (y = 0; y < H; y++) {
        for (x = 0; x < W; x++) {
            if (drawData[(y * W + x) * 4 + 3] > 40) ink[y * W + x] = 1;
        }
    }

    // Dilate ink so a slightly-offset but correct shape still scores high
    var R = SCORE_DILATE_R;
    var dil = new Uint8Array(W * H);
    for (y = 0; y < H; y++) {
        for (x = 0; x < W; x++) {
            if (!ink[y * W + x]) continue;
            var y0 = Math.max(0, y - R), y1 = Math.min(H - 1, y + R);
            var x0 = Math.max(0, x - R), x1 = Math.min(W - 1, x + R);
            for (var yy = y0; yy <= y1; yy++) {
                var dy = yy - y;
                for (var xx = x0; xx <= x1; xx++) {
                    var dx = xx - x;
                    if (dx * dx + dy * dy <= R * R) dil[yy * W + xx] = 1;
                }
            }
        }
    }

    var covered = 0;
    for (i = 3; i < window.guideData.length; i += 4) {
        if (window.guideData[i] <= 50) continue;
        p = (i - 3) / 4;
        if (dil[p]) covered++;
    }

    var raw = covered / window.totalGuide;
    // Mild kid boost in the mid range; still caps at 100
    var boosted = Math.min(1, Math.pow(raw, 0.82) * 1.06);
    return Math.min(100, Math.round(boosted * 100));
};

function finishLetterComplete(pointerId) {
    var cvsEl = document.getElementById('cvs');
    isDrawing = false;
    window.fingerPos = null;
    if (cvsEl && pointerId != null) {
        try { cvsEl.releasePointerCapture(pointerId); } catch (err) {}
    }

    currentPercent = window.computeWriteCoverage();
    var passAt = window.WRITE_PASS_SCORE || 70;

    if (currentPercent < passAt) {
        var msg = document.getElementById('msg');
        if (msg) {
            msg.innerText = '\u4ef2\u5dee\u5572\uff01\u800c\u5bb6 ' + currentPercent + '%\uff0c\u8981 ' + passAt + '% \u5148\u5f97\u3002\u518d\u8ddf\u5be6\u865b\u7dda\u756b\u904e\uff01';
            msg.style.color = '#e63946';
        }
        if (window.playCantoneseTTS) {
            window.playCantoneseTTS('\u4ef2\u5dee\u5572\uff01\u8981\u8ddf\u5be6\u865b\u7dda\u518d\u756b\u904e\uff01');
        }
        setTimeout(function () { resetCanvas(); }, 900);
        return;
    }

    // Full mark is 100% once the letter is accepted
    currentPercent = 100;

    updateMsg();

    if (window.WritingSession && window.WritingSession.onLetterPassed) {
        window.WritingSession.onLetterPassed();
    } else if (window.currentMode === 'camera') {
        var reCam = document.getElementById('btn-re-cam');
        if (reCam) reCam.style.display = 'inline-block';
    }

    if (typeof D !== 'undefined' && D[idx] && window.awardStars) {
        window.awardStars(1, {
            word: D[idx].w,
            emoji: D[idx].emoji,
            letter: D[idx].l,
            reason: '\u5beb\u5b8c\u5b57\u6bcd'
        });
    }

    setTimeout(function () {
        [523, 659, 783, 1046].forEach(function (f, i) {
            setTimeout(function () { playSnd(f, 'triangle', 0.3); }, i * 100);
        });
    }, 200);
    if (D[idx] && D[idx].l) {
        setTimeout(function () {
            if (window.playCantoneseTTS) window.playCantoneseTTS('\u53fb\u4ed4\uff01\u5beb\u597d\u5497 ' + D[idx].l);
            if (window.speakEnglish) window.speakEnglish(D[idx].l, { rate: 0.9 });
        }, 500);
    }
}

/** Project finger onto current stroke polyline; returns {x,y,t,dist} */
function projectFingerOnPath(pos) {
    if (!currentWPs || !currentWPs.length) return null;
    var best = null;
    for (var i = 0; i < currentWPs.length; i++) {
        var wp = currentWPs[i];
        var d = Math.hypot(pos.x - wp.x, pos.y - wp.y);
        if (!best || d < best.dist) {
            best = { x: wp.x, y: wp.y, t: wp.t != null ? wp.t : (i / Math.max(1, currentWPs.length - 1)), dist: d, i: i };
        }
    }
    return best;
}

function advanceStrokeProgress(pos) {
    if (!currentWPs.length) return;
    window.fingerPos = { x: pos.x, y: pos.y };

    var hit = projectFingerOnPath(pos);
    if (!hit) return;

    // Update guide marker on path (for idle / progress reference)
    if (hit.dist <= PATH_CORRIDOR) {
        // Monotonic progress along the letter stroke
        if (hit.t >= (window.pathT || 0) - 0.02) {
            window.pathT = Math.max(window.pathT || 0, hit.t);
            nextWpIdx = Math.max(nextWpIdx, hit.i + 1);
            window.guidePos = { x: hit.x, y: hit.y };
        }
    }

    var end = currentWPs[currentWPs.length - 1];
    var distEnd = Math.hypot(pos.x - end.x, pos.y - end.y);
    var prog = window.pathT || 0;
    window._strokeCommitPending = (distEnd <= HIT_END && prog >= 0.88);
    if (window._strokeCommitPending) nextWpIdx = currentWPs.length;
}

function commitCurrentStroke(pointerId, pos) {
    if (!currentWPs.length) return false;
    var prog = window.pathT || 0;
    if (prog < 0.85 && nextWpIdx < currentWPs.length) return false;

    playSnd(880, 'sine', 0.2);
    if (curStroke && curStroke.length >= 2) doneStrokes.push(curStroke);
    curStroke = [];
    window._strokeCommitPending = false;
    window.fingerPos = null;
    var finishedStrokeIdx = strokeIdx;
    strokeIdx++;
    initWaypoints();

    if (typeof D !== 'undefined' && D[idx] && strokeIdx >= D[idx].st.length) {
        finishLetterComplete(pointerId);
        return true;
    }

    var nextStart = currentWPs[0];
    var connected = window.nextStrokeConnects
        ? window.nextStrokeConnects(finishedStrokeIdx)
        : false;
    var nearNext = !!(pos && nextStart && Math.hypot(pos.x - nextStart.x, pos.y - nextStart.y) < HIT_START);
    // Same endpoint as next stroke start → keep finger down and continue
    if (pos && (connected || nearNext)) {
        isDrawing = true;
        window.fingerPos = { x: pos.x, y: pos.y };
        curStroke = [pos.x, pos.y];
        advanceStrokeProgress(pos);
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

    var startPt = currentWPs[0];
    var guide = window.guidePos || startPt;
    var nearGuide = guide && Math.hypot(pos.x - guide.x, pos.y - guide.y) <= HIT_START;
    var nearStart = startPt && Math.hypot(pos.x - startPt.x, pos.y - startPt.y) <= HIT_START;
    // Also allow continuing near current path progress point
    var hit = projectFingerOnPath(pos);
    var nearPath = hit && hit.dist <= HIT_START && hit.t >= (window.pathT || 0) - 0.15;
    if (!nearGuide && !nearStart && !nearPath) return;

    isDrawing = true;
    window._strokeCommitPending = false;
    window.fingerPos = { x: pos.x, y: pos.y };
    if (curStroke && curStroke.length >= 4) {
        window.strokeAttempts = window.strokeAttempts || [];
        window.strokeAttempts.push(curStroke);
    }
    curStroke = [pos.x, pos.y];
    advanceStrokeProgress(pos);
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

    curStroke.push(pos.x, pos.y);
    advanceStrokeProgress(pos);

    // Consecutive strokes: if this stroke ends where the next begins, keep going without lift
    var prog = window.pathT || 0;
    if (
        prog >= 0.90 &&
        typeof D !== 'undefined' &&
        D[idx] &&
        strokeIdx + 1 < D[idx].st.length &&
        window.nextStrokeConnects &&
        window.nextStrokeConnects(strokeIdx)
    ) {
        window.pathT = Math.max(prog, 0.95);
        nextWpIdx = currentWPs.length;
        commitCurrentStroke(e.pointerId, pos);
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
        var prog = window.pathT || 0;
        var nearEnd = !!(end && pos && Math.hypot(pos.x - end.x, pos.y - end.y) <= HIT_END * 1.6);
        if (prog >= 0.88 || (nearEnd && prog >= 0.75) || window._strokeCommitPending) {
            nextWpIdx = currentWPs.length;
            window.pathT = Math.max(prog, 0.95);
            commitCurrentStroke(e && e.pointerId, pos);
        }
    }

    isDrawing = false;
    window.fingerPos = null;
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
    
    let key = window.getApiKey ? window.getApiKey('google_tts_key') : localStorage.getItem('google_tts_key');
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
            if (window.WritingSession && window.WritingSession.formatMagicDoneMsg) {
                msgEl.innerText = window.WritingSession.formatMagicDoneMsg();
            } else if (window.currentMode === 'camera') {
                msgEl.innerText = '讀完喇！可以撳 📸 再影一個 繼續玩！';
            } else {
                msgEl.innerText = '成功！';
            }
            if (window.WritingSession && window.WritingSession.onLetterPassed) {
                window.WritingSession.onLetterPassed();
            } else if (window.currentMode === 'camera') {
                const reCam = document.getElementById('btn-re-cam');
                if (reCam) reCam.style.display = 'inline-block';
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

    if (window.WritingSession && window.WritingSession.applyChrome) {
        window.WritingSession.mode = window.currentMode || window.WritingSession.mode || 'standard';
        window.WritingSession.applyChrome();
    } else if (window.currentMode === 'camera') {
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
