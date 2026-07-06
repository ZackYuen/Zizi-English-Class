// ==========================================
// 🎨 畫布渲染與描寫演算法模組
// ==========================================

window.resetCanvas = function() {
    if (typeof D === 'undefined' || !D[idx]) return;
    isMagic=false; strokeIdx=0; doneStrokes=[]; curStroke=[]; isDrawing=false; currentPercent=0;
    let currentImgUrl = D[idx].p[D[idx].p.length-1].img;
    if(currentImgUrl) preloadImage(currentImgUrl);
    offCtx.clearRect(0,0,300,300);
    D[idx].st.forEach(st => drawLineToCtx(offCtx, st, '#000', false, 25));
    guideData = offCtx.getImageData(0,0,300,300).data;
    totalGuide = 0;
    for(let i=3; i<guideData.length; i+=4) if(guideData[i] > 50) totalGuide++;
    initWaypoints();
    document.getElementById('canvas-wrapper').style.transform="scale(1) rotate(0deg)";
    updateMsg();
};

window.initWaypoints = function() {
    if(strokeIdx >= D[idx].st.length) { currentWPs=[]; return; }
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
    if(!msg) return;
    if(strokeIdx < D[idx].st.length) {
        msg.innerText = `完成度: ${currentPercent}% (第 ${strokeIdx+1} 筆)`;
        msg.style.color = "#1982c4";
    } else {
        msg.innerText = `完成度: 100% - 好叻！撳 ✨ 變魔術啦！`;
        msg.style.color = "#06d6a0";
    }
}

window.playSnd = function(f, t, dur=0.3) {
    if(!aCtx) return;
    try {
        let o=aCtx.createOscillator(), g=aCtx.createGain();
        o.connect(g); g.connect(aCtx.destination); o.type=t; o.frequency.value=f;
        g.gain.setValueAtTime(0.3, aCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, aCtx.currentTime+dur);
        o.start(); o.stop(aCtx.currentTime+dur);
    } catch(e) {}
};

window.drawLineToCtx = function(c, pts, col, dash, width=25) {
    if(pts.length < 2) return;
    c.beginPath(); c.moveTo(pts[0], pts[1]);
    for(let i=2; i<pts.length; i+=2) c.lineTo(pts[i], pts[i+1]);
    c.strokeStyle=col; c.lineWidth=width; c.lineCap='round'; c.lineJoin='round';
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
    if (!ctx) return;
    ctx.clearRect(0,0,300,300);
    if(!isMagic) {
        if(D && D[idx]) D[idx].st.forEach(st => drawLineToCtx(ctx, st, '#e0e0e0', true, 25)); 
        doneStrokes.forEach(st => drawLineToCtx(ctx, st, '#ff9f1c', false, 25)); 
        drawLineToCtx(ctx, curStroke, '#ffca3a', false, 25); 
        if(D && D[idx] && strokeIdx < D[idx].st.length && currentWPs.length > 0) {
            let targetWP = currentWPs[nextWpIdx];
            if(targetWP) { ctx.beginPath(); ctx.arc(targetWP.x, targetWP.y, 16, 0, 7); ctx.fillStyle='#06d6a0'; ctx.fill(); }
            let pt = getPointOnPath(D[idx].st[strokeIdx], (Date.now()%2000)/2000);
            ctx.beginPath(); ctx.arc(pt.x, pt.y, 10, 0, 7); ctx.fillStyle='#1982c4'; ctx.fill();
        }
        if(D && D[idx] && Date.now() - lastCalc > 150 && totalGuide > 0 && strokeIdx < D[idx].st.length) {
            lastCalc = Date.now();
            userCtx.clearRect(0,0,300,300);
            doneStrokes.forEach(st => drawLineToCtx(userCtx, st, '#000', false, 25));
            drawLineToCtx(userCtx, curStroke, '#000', false, 25);
            let drawData = userCtx.getImageData(0,0,300,300).data;
            let covered = 0;
            for(let i=3; i<guideData.length; i+=4) if(guideData[i] > 50 && drawData[i] > 50) covered++;
            currentPercent = Math.round((covered / totalGuide) * 100);
            updateMsg();
        }
    } else {
        let dt = Date.now() - magicStart;
        if(D && D[idx]) {
            let phase = D[idx].p.slice().reverse().find(p => dt >= p.t);
            if(phase) {
                ctx.textAlign='center'; ctx.textBaseline='middle';
                if(phase.type === 'letter') { 
                    ctx.font='bold 200px Arial'; ctx.fillStyle='#ff595e'; ctx.fillText(phase.text, 150, 150); 
                }
                else if(phase.type === 'phonic') {
                    let baseFSize = 65;
                    let ipaFSize = 26;
                    ctx.font = `bold ${baseFSize}px Comic Sans MS`;
                    
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
                            let isHl = (i === phase.hlIdx);
                            ctx.font = `bold ${scaledBaseFSize}px Comic Sans MS`; 
                            ctx.fillStyle = isHl ? '#ff595e' : '#1d3557';
                            ctx.fillText(pd.letter, startX + w/2, 120);
                            
                            ctx.font = `bold ${scaledIpaFSize}px Arial`; 
                            ctx.fillStyle = isHl ? '#ffca3a' : '#8ac926';
                            ctx.fillText(pd.ipa, startX + w/2, 190);
                        }
                        startX += w;
                    });
                } else if(phase.type === 'word') {
                    if(phase.img && imgCache[phase.img] && imgCache[phase.img].complete) {
                        let img = imgCache[phase.img];
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
                    
                    if(!fired) { confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }}); fired=true; }
                }
            }
        }
    }
    requestAnimationFrame(loop);
};

if(cvs) {
    cvs.addEventListener('pointerdown', e => {
        if(window.stopAllAudio) window.stopAllAudio(); 
        if(isMagic || strokeIdx >= D[idx].st.length) return;
        
        const r = cvs.getBoundingClientRect();
        const scaleX = cvs.width / r.width;
        const scaleY = cvs.height / r.height;
        const x = (e.clientX - r.left) * scaleX;
        const y = (e.clientY - r.top) * scaleY;
        
        let target = currentWPs[nextWpIdx];
        if(target && Math.hypot(x-target.x, y-target.y) < 60) {
            cvs.setPointerCapture(e.pointerId); isDrawing=true;
            if(curStroke.length === 0) curStroke.push(target.x, target.y); 
            curStroke.push(x, y);
        }
    });

    cvs.addEventListener('pointermove', e => {
        if(!isDrawing || isMagic) return;
        
        const r = cvs.getBoundingClientRect();
        const scaleX = cvs.width / r.width;
        const scaleY = cvs.height / r.height;
        const x = (e.clientX - r.left) * scaleX;
        const y = (e.clientY - r.top) * scaleY;
        
        curStroke.push(x, y);
        while(nextWpIdx < currentWPs.length && Math.hypot(x - currentWPs[nextWpIdx].x, y - currentWPs[nextWpIdx].y) < 60) nextWpIdx++;
        
        // 🌟 筆畫完成邏輯更新
        if(nextWpIdx >= currentWPs.length) {
            let endWp = currentWPs[currentWPs.length-1];
            curStroke.push(endWp.x, endWp.y); 
            playSnd(880, 'sine', 0.2); 
            doneStrokes.push(curStroke); curStroke=[]; strokeIdx++; 

            initWaypoints(); 

            if(strokeIdx >= D[idx].st.length) { 
                isDrawing=false;
                cvs.releasePointerCapture(e.pointerId);
                currentPercent = 100; updateMsg(); 
                setTimeout(()=>{ [523,659,783,1046].forEach((f,i)=>setTimeout(()=>playSnd(f,'triangle',0.3),i*100)); }, 200); 
            } else {
                // 🌟 連筆判斷：如果目前位置同下一筆起點距離近於 60px，自動接軌
                let nextStart = currentWPs[0];
                if (nextStart && Math.hypot(x - nextStart.x, y - nextStart.y) < 60) {
                    curStroke.push(x, y);
                } else {
                    isDrawing=false;
                    cvs.releasePointerCapture(e.pointerId);
                }
            }
        }
    });

    cvs.addEventListener('pointerup', e => { isDrawing=false; cvs.releasePointerCapture(e.pointerId); });
}

window.magic = async function() {
    if(strokeIdx < D[idx].st.length) { document.getElementById('msg').innerText = "未畫完喎！"; document.getElementById('msg').style.color = "#ff595e"; return; }
    
    if(window.stopAllAudio) window.stopAllAudio(); 
    
    let key = localStorage.getItem('google_tts_key');
    if(!key) { key = prompt("請輸入 Google TTS API Key:"); if(key) localStorage.setItem('google_tts_key', key); else return; }
    document.getElementById('canvas-wrapper').style.transform = "scale(0.1) rotate(360deg)";
    document.getElementById('msg').innerText = "聯絡緊 Google TTS...";
    try {
        let res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`, {
            method:'POST', body:JSON.stringify({input:{ssml:D[idx].ssml},voice:{languageCode:'en-US',name:'en-US-Wavenet-F'},audioConfig:{audioEncoding:'MP3'}})
        });
        let data = await res.json();
        if(data.error) throw data.error;
        window.mAudio = window.mAudio || new Audio();
        window.mAudio.src = 'data:audio/mp3;base64,' + data.audioContent;
        window.mAudio.playbackRate = 0.75; 
    } catch(e) { document.getElementById('msg').innerText = "❌ TTS API Error: " + e.message; return; }
    setTimeout(() => {
        isMagic=true; fired=false; magicStart=Date.now(); window.mAudio.play();
        document.getElementById('canvas-wrapper').style.transform = "scale(1) rotate(0deg)";
        document.getElementById('msg').innerText = typeof currentMode !== 'undefined' && currentMode === 'camera' ? "魔術成功！再撳下面掣影過啦！" : "成功！";
    }, 600);
};
