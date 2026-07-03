let idx=0, isMagic=false, magicStart=0, fired=false;
let strokeIdx=0, doneStrokes=[], curStroke=[], isDrawing=false;

// 防作弊與計分變數
let currentWPs=[], nextWpIdx=0, currentPercent=0, lastCalc=0;
let guideData=null, totalGuide=0;

const cvs=document.getElementById('cvs'), ctx=cvs.getContext('2d', {willReadFrequently:true});

// 背景隱藏畫布 (用來精準計算百分比)
const offCvs=document.createElement('canvas'); offCvs.width=300; offCvs.height=300;
const offCtx=offCvs.getContext('2d', {willReadFrequently:true});
const userCvs=document.createElement('canvas'); userCvs.width=300; userCvs.height=300;
const userCtx=userCvs.getContext('2d', {willReadFrequently:true});

let aCtx, mAudio = new Audio();

function start() {
    mAudio.src='data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
    mAudio.play().catch(()=>{});
    aCtx = new (window.AudioContext || window.webkitAudioContext)();
    document.getElementById('start-overlay').style.display='none';
    
    renderTabs();
    selectGroup(0); 
    requestAnimationFrame(loop);
}

function renderTabs() {
    const tabsDiv = document.getElementById('group-tabs');
    tabsDiv.innerHTML = '';
    phonicsGroups.forEach((g, i) => {
        const btn = document.createElement('button');
        btn.className = 'tab'; btn.innerText = g.name;
        btn.onclick = () => selectGroup(i);
        tabsDiv.appendChild(btn);
    });
}

function selectGroup(gIndex) {
    document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i === gIndex));
    const kb = document.getElementById('kb'); kb.innerHTML = '';
    phonicsGroups[gIndex].letters.forEach(letter => {
        const btn = document.createElement('div'); btn.className = 'key'; btn.innerText = letter;
        btn.onclick = () => { idx = D.findIndex(d => d.l === letter); reset(); };
        kb.appendChild(btn);
    });
    idx = D.findIndex(d => d.l === phonicsGroups[gIndex].letters[0]);
    reset();
}

function reset() {
    isMagic=false; strokeIdx=0; doneStrokes=[]; curStroke=[]; isDrawing=false; currentPercent=0;
    
    // 預先畫好完美字體，用來計 100% 總像素
    offCtx.clearRect(0,0,300,300);
    D[idx].st.forEach(st => drawLineToCtx(offCtx, st, '#000', false, 25));
    guideData = offCtx.getImageData(0,0,300,300).data;
    totalGuide = 0;
    for(let i=3; i<guideData.length; i+=4) if(guideData[i] > 50) totalGuide++;
    
    initWaypoints();
    document.getElementById('canvas-wrapper').style.transform="scale(1) rotate(0deg)";
    updateMsg();
}

// 建立密集打卡點 (防亂畫作弊)
function initWaypoints() {
    if(strokeIdx >= D[idx].st.length) { currentWPs=[]; return; }
    let st = D[idx].st[strokeIdx];
    currentWPs = [];
    for(let i=0; i<st.length-2; i+=2) {
        let x1=st[i], y1=st[i+1], x2=st[i+2], y2=st[i+3];
        let dist = Math.hypot(x2-x1, y2-y1);
        let steps = Math.max(1, Math.ceil(dist / 15)); // 每 15px 一個打卡點
        for(let j=0; j<steps; j++) {
            currentWPs.push({x: x1+(x2-x1)*(j/steps), y: y1+(y2-y1)*(j/steps)});
        }
    }
    currentWPs.push({x: st[st.length-2], y: st[st.length-1]});
    nextWpIdx = 0;
}

function updateMsg() {
    const msg = document.getElementById('msg');
    if(strokeIdx < D[idx].st.length) {
        msg.innerText = `完成度: ${currentPercent}% (第 ${strokeIdx+1} 筆)`;
        msg.style.color = "#1982c4";
    } else {
        msg.innerText = `完成度: 100% - 好叻！撳 ✨ 變魔術啦！`;
        msg.style.color = "#06d6a0";
    }
}

function playSnd(f, t, dur=0.3) {
    if(!aCtx) return;
    let o=aCtx.createOscillator(), g=aCtx.createGain();
    o.connect(g); g.connect(aCtx.destination); o.type=t; o.frequency.value=f;
    g.gain.setValueAtTime(0.3, aCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, aCtx.currentTime+dur);
    o.start(); o.stop(aCtx.currentTime+dur);
}

function drawLineToCtx(c, pts, col, dash, width=25) {
    if(pts.length < 2) return;
    c.beginPath(); c.moveTo(pts[0], pts[1]);
    for(let i=2; i<pts.length; i+=2) c.lineTo(pts[i], pts[i+1]);
    c.strokeStyle=col; c.lineWidth=width; c.lineCap='round'; c.lineJoin='round';
    c.setLineDash(dash ? [10,15] : []); c.stroke();
}

function getPointOnPath(pts, prog) {
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
}

function loop() {
    ctx.clearRect(0,0,300,300);
    if(!isMagic) {
        // 畫底稿與玩家線條
        D[idx].st.forEach(st => drawLineToCtx(ctx, st, '#e0e0e0', true, 25)); 
        doneStrokes.forEach(st => drawLineToCtx(ctx, st, '#ff9f1c', false, 25)); 
        drawLineToCtx(ctx, curStroke, '#ffca3a', false, 25); 
        
        if(strokeIdx < D[idx].st.length && currentWPs.length > 0) {
            // 綠色點永遠停喺下一個要過嘅打卡點
            let targetWP = currentWPs[nextWpIdx];
            if(targetWP) {
                ctx.beginPath(); ctx.arc(targetWP.x, targetWP.y, 16, 0, 7); ctx.fillStyle='#06d6a0'; ctx.fill();
            }
            
            // 流星完美滑行
            let pt = getPointOnPath(D[idx].st[strokeIdx], (Date.now()%2000)/2000);
            ctx.beginPath(); ctx.arc(pt.x, pt.y, 10, 0, 7); ctx.fillStyle='#1982c4'; ctx.fill();
        }

        // 實時計算百分比 (每 150ms 算一次，減輕手機負擔)
        if(Date.now() - lastCalc > 150 && totalGuide > 0 && strokeIdx < D[idx].st.length) {
            lastCalc = Date.now();
            userCtx.clearRect(0,0,300,300);
            doneStrokes.forEach(st => drawLineToCtx(userCtx, st, '#000', false, 25));
            drawLineToCtx(userCtx, curStroke, '#000', false, 25);
            
            let drawData = userCtx.getImageData(0,0,300,300).data;
            let covered = 0;
            for(let i=3; i<guideData.length; i+=4) {
                if(guideData[i] > 50 && drawData[i] > 50) covered++;
            }
            currentPercent = Math.round((covered / totalGuide) * 100);
            updateMsg();
        }

    } else {
        // 變魔術階段
        let dt = Date.now() - magicStart;
        let phase = D[idx].p.slice().reverse().find(p => dt >= p.t);
        if(phase) {
            ctx.textAlign='center'; ctx.textBaseline='middle';
            if(phase.type === 'letter') {
                ctx.font='bold 200px Arial'; ctx.fillStyle='#ff595e'; ctx.fillText(phase.text, 150, 150);
            } else if(phase.type === 'word') {
                ctx.font='100px Arial'; ctx.fillText(D[idx].emoji, 150, 100);
                ctx.font='bold 50px Comic Sans MS'; ctx.fillStyle='#1d3557'; ctx.fillText(phase.text, 150, 220);
                if(!fired) { confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }}); fired=true; }
            } else {
                ctx.font='bold 70px Comic Sans MS'; ctx.fillStyle='#1982c4'; ctx.fillText(phase.text, 150, 150);
            }
        }
    }
    requestAnimationFrame(loop);
}

// 嚴格觸控系統
cvs.addEventListener('pointerdown', e => {
    if(isMagic || strokeIdx >= D[idx].st.length) return;
    const r=cvs.getBoundingClientRect(), x = e.clientX-r.left, y = e.clientY-r.top;
    
    let target = currentWPs[nextWpIdx];
    // 必須喺目標打卡點 60px 範圍內落筆
    if(target && Math.hypot(x-target.x, y-target.y) < 60) {
        cvs.setPointerCapture(e.pointerId); isDrawing=true;
        if(curStroke.length === 0) curStroke.push(target.x, target.y); // 自動吸附起點
        curStroke.push(x, y);
    }
});

cvs.addEventListener('pointermove', e => {
    if(!isDrawing || isMagic) return;
    const r=cvs.getBoundingClientRect(), x = e.clientX-r.left, y = e.clientY-r.top;
    curStroke.push(x, y);
    
    // 必須順序經過打卡點 (防亂畫跳關)
    while(nextWpIdx < currentWPs.length && Math.hypot(x - currentWPs[nextWpIdx].x, y - currentWPs[nextWpIdx].y) < 60) {
        nextWpIdx++;
    }
    
    // 當成功經過晒所有打卡點
    if(nextWpIdx >= currentWPs.length) {
        let endWp = currentWPs[currentWPs.length-1];
        curStroke.push(endWp.x, endWp.y); // 自動吸附終點
        
        playSnd(880, 'sine', 0.2); 
        doneStrokes.push(curStroke); curStroke=[]; strokeIdx++; isDrawing=false;
        cvs.releasePointerCapture(e.pointerId);
        
        initWaypoints(); // 準備下一筆
        
        if(strokeIdx >= D[idx].st.length) { 
            currentPercent = 100; updateMsg(); // 強制滿分
            setTimeout(()=>{
                [523,659,783,1046].forEach((f,i)=>setTimeout(()=>playSnd(f,'triangle',0.3),i*100)); 
            }, 200);
        }
    }
});

cvs.addEventListener('pointerup', e => { isDrawing=false; cvs.releasePointerCapture(e.pointerId); });

async function magic() {
    if(strokeIdx < D[idx].st.length) { 
        document.getElementById('msg').innerText = "未畫完喎！畫完 100% 先！"; 
        document.getElementById('msg').style.color = "#ff595e"; return; 
    }
    let key = localStorage.getItem('google_tts_key');
    if(!key) { key = prompt("請輸入 Google API Key:"); if(key) localStorage.setItem('google_tts_key', key); else return; }
    
    document.getElementById('canvas-wrapper').style.transform = "scale(0.1) rotate(360deg)";
    document.getElementById('msg').innerText = "聯絡緊 Google...✨";
    
    try {
        let res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`, {
            method:'POST', body:JSON.stringify({input:{ssml:D[idx].ssml},voice:{languageCode:'en-US',name:'en-US-Wavenet-F'},audioConfig:{audioEncoding:'MP3'}})
        });
        let data = await res.json();
        if(data.error) throw data.error;
        mAudio.src = 'data:audio/mp3;base64,' + data.audioContent;
    } catch(e) { document.getElementById('msg').innerText = "API 錯誤，請檢查 Key 或網絡"; return; }
    
    setTimeout(() => {
        isMagic=true; fired=false; magicStart=Date.now(); mAudio.play();
        document.getElementById('canvas-wrapper').style.transform = "scale(1) rotate(0deg)";
        document.getElementById('msg').innerText = "魔術成功！";
    }, 600);
}
