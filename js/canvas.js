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
    window.strokeReports = [];
    window._strokeOn = 0;
    window._strokeOff = 0;
    
    // 準備用嚟計分嘅 User Canvas
    window.userCtx = window.userCtx || document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    window.userCtx.canvas.width = 300;
    window.userCtx.canvas.height = 300;
    
    initWaypoints();
    const wrapper = document.getElementById('canvas-wrapper');
    if(wrapper) wrapper.style.transform = "scale(1) rotate(0deg)";
    if (window.ZiziTeach) window.ZiziTeach.fillWriteChip();
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
    window._strokeOn = 0;
    window._strokeOff = 0;
    window.fingerPos = null;
    window.guidePos = currentWPs[0] ? { x: currentWPs[0].x, y: currentWPs[0].y } : null;
};

window.updateMsg = function() {
    const msg = document.getElementById('msg');
    if(!msg || typeof D === 'undefined' || !D[idx]) return;
    const passAt = window.WRITE_PASS_SCORE || 70;
    const session = window.WritingSession;
    if(strokeIdx < D[idx].st.length) {
        var next = session && session.formatProgressMsg
            ? session.formatProgressMsg(currentPercent, strokeIdx + 1)
            : ('跟住綠點畫（第 ' + (strokeIdx+1) + ' 筆）');
        if (window.setSilentMsg) {
            window.setSilentMsg(next, currentPercent >= passAt ? '#06d6a0' : '#1982c4');
        } else {
            msg.setAttribute('data-silent', '1');
            msg.setAttribute('aria-hidden', 'true');
            if (msg.innerText !== next) msg.innerText = next;
            msg.style.color = currentPercent >= passAt ? '#06d6a0' : '#1982c4';
        }
    } else {
        var done = session && session.formatSuccessMsg
            ? session.formatSuccessMsg(currentPercent)
            : ('真叻！撳 ✨ 讀出嚟啦！');
        if (window.setSilentMsg) {
            window.setSilentMsg(done, '#06d6a0');
        } else {
            msg.setAttribute('data-silent', '1');
            msg.setAttribute('aria-hidden', 'true');
            msg.innerText = done;
            msg.style.color = '#06d6a0';
        }
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
            
            // Green ball stays on the dashed stroke (chase it — not the scribble)
            if (strokeIdx < D[idx].st.length && currentWPs.length > 0) {
                var gpos = window.guidePos || currentWPs[0];
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
                currentPercent = window.computeFollowScore();
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
// Letter tracing: follow each dashed stroke in order
// Score = path following, NOT "did ink cover the letter shape"
// Scribbling / 亂填 cannot advance or pass
// ==========================================
window.WRITE_PASS_SCORE = 62;
var HIT_START = 48;
var PATH_CORRIDOR = 34;
var HIT_END = 52;
var LOOKAHEAD_T = 0.32;     // fast fingers skip ahead — still count
var MIN_FOLLOW = 0.78;      // walk most of this stroke
var MIN_CLEAN = 0.48;       // stay near the dashed line
var STROKE_CONNECT_EPS = 36;

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

/** Only search a short window ahead of current progress — not the whole letter. */
function projectFingerOnLocalPath(pos) {
    if (!currentWPs || !currentWPs.length) return null;
    var n = currentWPs.length;
    var from = Math.max(0, (nextWpIdx || 0) - 2);
    var ahead = Math.max(8, Math.ceil(n * LOOKAHEAD_T));
    var to = Math.min(n - 1, from + ahead);
    var best = null;
    var i;
    for (i = from; i <= to; i++) {
        var wp = currentWPs[i];
        var d = Math.hypot(pos.x - wp.x, pos.y - wp.y);
        if (!best || d < best.dist) {
            best = { x: wp.x, y: wp.y, t: wp.t, dist: d, i: i };
        }
    }
    if (!best || best.dist > PATH_CORRIDOR) {
        to = Math.min(n - 1, from + Math.max(ahead, Math.ceil(n * 0.5)));
        for (i = from; i <= to; i++) {
            var wp2 = currentWPs[i];
            var d2 = Math.hypot(pos.x - wp2.x, pos.y - wp2.y);
            if (!best || d2 < best.dist) {
                best = { x: wp2.x, y: wp2.y, t: wp2.t, dist: d2, i: i };
            }
        }
    }
    return best;
}

function guideAtProgress(t) {
    if (!currentWPs || !currentWPs.length) return null;
    var best = currentWPs[0];
    for (var i = 0; i < currentWPs.length; i++) {
        if (currentWPs[i].t <= t) best = currentWPs[i];
        else break;
    }
    return { x: best.x, y: best.y };
}

function currentStrokeLiveScore() {
    var follow = window.pathT || 0;
    var on = window._strokeOn || 0;
    var off = window._strokeOff || 0;
    var total = on + off;
    var clean = total < 8 ? 1 : on / total;
    return Math.round(Math.max(0, Math.min(1, follow * clean)) * 100);
}

window.computeFollowScore = function () {
    var reports = window.strokeReports || [];
    var totalStrokes = 1;
    if (typeof D !== 'undefined' && D[idx] && D[idx].st && D[idx].st.length) {
        totalStrokes = D[idx].st.length;
    }
    var sum = 0;
    var i;
    for (i = 0; i < reports.length; i++) sum += reports[i].score;
    if (strokeIdx < totalStrokes) sum += currentStrokeLiveScore();
    if (!totalStrokes) return 0;
    return Math.round(sum / totalStrokes);
};

function rejectDirtyStroke() {
    if (window.ZiziFX) window.ZiziFX.play('wrong');
    else if (window.playSnd) window.playSnd(200, 'sawtooth', 0.15);
    if (curStroke && curStroke.length >= 4) {
        window.strokeAttempts = window.strokeAttempts || [];
        window.strokeAttempts.push(curStroke);
    }
    curStroke = [];
    window.pathT = 0;
    nextWpIdx = 0;
    window._strokeOn = 0;
    window._strokeOff = 0;
    window._strokeCommitPending = false;
    window.guidePos = currentWPs[0] ? { x: currentWPs[0].x, y: currentWPs[0].y } : null;
}

function finishLetterComplete(pointerId) {
    var cvsEl = document.getElementById('cvs');
    isDrawing = false;
    window.fingerPos = null;
    if (cvsEl && pointerId != null) {
        try { cvsEl.releasePointerCapture(pointerId); } catch (err) {}
    }

    var reports = window.strokeReports || [];
    var needed = (typeof D !== 'undefined' && D[idx] && D[idx].st) ? D[idx].st.length : 0;
    var passAt = window.WRITE_PASS_SCORE || 80;
    var allFollowed = reports.length >= needed && reports.every(function (r) {
        return r.follow >= MIN_FOLLOW && r.clean >= MIN_CLEAN && r.score >= passAt;
    });
    currentPercent = window.computeFollowScore();

    if (!allFollowed || currentPercent < passAt) {
        var n = window.ZiziTeach ? window.ZiziTeach.bumpWrite() : 1;
        var msg = document.getElementById('msg');
        var hintLine = n >= 2
            ? '跟唔到綠點呀！撳「點畫？」睇提示，再跟住虛線由頭畫到尾。'
            : '要跟住虛線由頭畫到尾，唔可以亂填呀！再試過！';
        if (msg) {
            if (window.setSilentMsg) window.setSilentMsg(hintLine, '#e63946');
            else {
                msg.setAttribute('data-silent', '1');
                msg.setAttribute('aria-hidden', 'true');
                msg.innerText = hintLine;
                msg.style.color = '#e63946';
            }
        }
        if (window.ZiziTeach && n >= 2) {
            window.ZiziTeach.applyWriteHint({ force: true, updateMsg: false });
        } else if (window.playCantoneseTTS) {
            window.playCantoneseTTS(hintLine, { interrupt: true });
        }
        setTimeout(function () { resetCanvas(); }, 900);
        return;
    }

    currentPercent = 100;

    if (window.ZiziTeach) window.ZiziTeach.resetWrite();

    updateMsg();

    if (window.WritingSession && window.WritingSession.onLetterPassed) {
        window.WritingSession.onLetterPassed();
    } else if (window.currentMode === 'camera') {
        var reCam = document.getElementById('btn-re-cam');
        if (reCam) reCam.style.display = 'inline-block';
    }

    if (window.ZiziFX) window.ZiziFX.play('fanfare');
    if (window.markQuest) window.markQuest('write');

    if (typeof D !== 'undefined' && D[idx] && window.awardStars) {
        window.awardStars(1, {
            word: D[idx].w,
            emoji: D[idx].emoji,
            letter: D[idx].l,
            reason: '寫完字母',
            quest: 'write'
        });
    }

    if (window.ZiziFX && window.ZiziFX.celebrate && D[idx]) {
        window.ZiziFX.celebrate({
            emoji: D[idx].emoji || '✍️',
            title: '寫好咗 ' + D[idx].l + '！',
            sub: D[idx].w ? ('單詞：' + D[idx].w) : '真叻！',
            stars: 1
        });
    }

    setTimeout(function () {
        [523, 659, 783, 1046].forEach(function (f, i) {
            setTimeout(function () { playSnd(f, 'triangle', 0.3); }, i * 100);
        });
    }, 200);
    if (D[idx] && D[idx].l) {
        setTimeout(function () {
            var letter = D[idx].l;
            var spoken = window.playCantoneseTTS
                ? window.playCantoneseTTS('叻仔！寫好咗 ' + letter, { interrupt: true })
                : Promise.resolve();
            Promise.resolve(spoken).then(function () {
                if (window.speakEnglish) return window.speakEnglish(letter, { rate: 0.9 });
            });
        }, 400);
    }
}

function advanceStrokeProgress(pos) {
    if (!currentWPs.length) return;
    window.fingerPos = { x: pos.x, y: pos.y };

    var hit = projectFingerOnLocalPath(pos);
    if (!hit) {
        window._strokeOff = (window._strokeOff || 0) + 1;
        return;
    }

    if (hit.dist <= PATH_CORRIDOR) {
        window._strokeOn = (window._strokeOn || 0) + 1;
        var pathT = window.pathT || 0;
        if (hit.t >= pathT - 0.06) {
            var jump = Math.min(hit.t, pathT + 0.32);
            if (jump > pathT) {
                window.pathT = jump;
                nextWpIdx = Math.max(nextWpIdx || 0, hit.i);
            }
        }
        window.guidePos = guideAtProgress(window.pathT || 0);
    } else {
        window._strokeOff = (window._strokeOff || 0) + 1;
    }

    var end = currentWPs[currentWPs.length - 1];
    var distEnd = Math.hypot(pos.x - end.x, pos.y - end.y);
    var prog = window.pathT || 0;
    window._strokeCommitPending = (prog >= MIN_FOLLOW && (distEnd <= HIT_END || prog >= 0.92));
}

function strokeReportNow() {
    var follow = window.pathT || 0;
    var on = window._strokeOn || 0;
    var off = window._strokeOff || 0;
    var total = on + off;
    var clean = total < 8 ? 0 : on / total;
    var score = Math.round(Math.max(0, Math.min(1, follow * clean)) * 100);
    return { follow: follow, clean: clean, score: score, samples: total };
}

function commitCurrentStroke(pointerId, pos) {
    if (!currentWPs.length) return false;
    var report = strokeReportNow();
    if (report.follow < MIN_FOLLOW || report.clean < MIN_CLEAN || report.samples < 8) {
        rejectDirtyStroke();
        return false;
    }

    playSnd(880, 'sine', 0.2);
    window.strokeReports = window.strokeReports || [];
    window.strokeReports.push(report);
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

    if (!window._screenReaderLikely && window.stopSpeech) window.stopSpeech();
    if (isMagic || typeof D === 'undefined' || !D[idx] || strokeIdx >= D[idx].st.length) return;
    if (isDrawing) return;
    if (e.cancelable) e.preventDefault();

    var cvsEl = document.getElementById('cvs');
    if (!cvsEl) return;
    var pos = getCanvasPos(e, cvsEl);

    var startPt = currentWPs[0];
    var guide = window.guidePos || startPt;
    var pathT = window.pathT || 0;
    var nearStart = startPt && Math.hypot(pos.x - startPt.x, pos.y - startPt.y) <= HIT_START;
    var nearGuide = guide && Math.hypot(pos.x - guide.x, pos.y - guide.y) <= HIT_START;
    if (pathT < 0.12) {
        if (!nearStart) return;
    } else if (!nearGuide) {
        return;
    }

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

    var report = strokeReportNow();
    if (
        report.follow >= MIN_FOLLOW &&
        report.clean >= MIN_CLEAN &&
        typeof D !== 'undefined' &&
        D[idx] &&
        strokeIdx + 1 < D[idx].st.length &&
        window.nextStrokeConnects &&
        window.nextStrokeConnects(strokeIdx)
    ) {
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
        var report = strokeReportNow();
        if ((report.follow >= MIN_FOLLOW && report.clean >= MIN_CLEAN) || window._strokeCommitPending) {
            commitCurrentStroke(e && e.pointerId, pos);
        } else if (report.samples >= 12 && report.clean < MIN_CLEAN) {
            rejectDirtyStroke();
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
    if (window.setSilentMsg) window.setSilentMsg('聯絡緊 Google TTS...', '#1982c4');
    else document.getElementById('msg').innerText = "聯絡緊 Google TTS...";
    
    try {
        let url;
        if (window.googleTtsFetch) {
            url = await window.googleTtsFetch({ ssml: D[idx].ssml, lang: 'en-US' });
        } else {
            let res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`, {
                method:'POST', body:JSON.stringify({
                    input:{ssml:D[idx].ssml},
                    voice:{languageCode:'en-US',name:'en-US-Neural2-C'},
                    audioConfig:{audioEncoding:'MP3'}
                })
            });
            let data = await res.json();
            if(data.error) throw data.error;
            url = 'data:audio/mp3;base64,' + data.audioContent;
        }
        window.mAudio = window.mAudio || new Audio();
        window.mAudio.src = url;
    } catch(e) {
        if (e && e.name === 'AbortError') return;
        document.getElementById('msg').innerText = "❌ TTS API Error: " + e.message; 
        return; 
    }
    
    setTimeout(() => {
        isMagic=true; fired=false; magicStart=Date.now(); window.mAudio.play();
        document.getElementById('canvas-wrapper').style.transform = "scale(1) rotate(0deg)";
        const msgEl = document.getElementById('msg');
        if (msgEl) {
            var doneLine = window.WritingSession && window.WritingSession.formatMagicDoneMsg
                ? window.WritingSession.formatMagicDoneMsg()
                : (window.currentMode === 'camera' ? '讀完喇！可以撳 📸 再影一個 繼續玩！' : '成功！');
            if (window.setSilentMsg) window.setSilentMsg(doneLine, '#06d6a0');
            else {
                msgEl.setAttribute('data-silent', '1');
                msgEl.innerText = doneLine;
            }
            if (window.WritingSession && window.WritingSession.onLetterPassed) {
                window.WritingSession.onLetterPassed();
            } else if (window.currentMode === 'camera') {
                const reCam = document.getElementById('btn-re-cam');
                if (reCam) reCam.style.display = 'inline-block';
            }
        }
        window.mAudio.onended = function () {
            if (!D[idx] || !window.ZiziTeach) return;
            var w = window.ZiziTeach.info(D[idx].w);
            var done = document.getElementById('msg');
            if (done) {
                if (window.setSilentMsg) {
                    window.setSilentMsg(w.w + ' = ' + w.yue + '。' + w.story, '#023e8a');
                } else {
                    done.setAttribute('data-silent', '1');
                    done.setAttribute('aria-hidden', 'true');
                    done.innerText = w.w + ' = ' + w.yue + '。' + w.story;
                    done.style.color = '#023e8a';
                }
            }
            window.ZiziTeach.speak(w.w + '就係' + w.yue + '。' + w.story);
        };
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
        window.playCantoneseTTS('搵到喇！係呢個字，孜孜，一齊寫 ' + letter + ' 啦。', { interrupt: true }).then(function () {
            if (window.speakEnglish) return window.speakEnglish(normalized, { rate: 0.88 });
        });
    } else if (window.speakEnglish) {
        window.speakEnglish(normalized, { rate: 0.88 });
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
    if (window.ZiziTeach) window.ZiziTeach.resetWrite();
    resetCanvas();
};

// Start the single render loop once DOM/scripts are ready
window.addEventListener('load', function () {
    window.startRenderLoop();
});
