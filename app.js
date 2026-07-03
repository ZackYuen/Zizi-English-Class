let idx=0, isMagic=false, magicStart=0, fired=false, strokeIdx=0, doneStrokes=[], curStroke=[], isDrawing=false;
const cvs=document.getElementById('cvs'), ctx=cvs.getContext('2d', {willReadFrequently:true});
let aCtx, mAudio = new Audio();

function start() {
    mAudio.src='data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
    mAudio.play().catch(()=>{});
    aCtx = new (window.AudioContext || window.webkitAudioContext)();
    document.getElementById('start-overlay').style.display='none';
    
    renderTabs();
    selectGroup(0); // 預設打開第 1 組
    requestAnimationFrame(loop);
}

// 渲染分組標籤
function renderTabs() {
    const tabsDiv = document.getElementById('group-tabs');
    tabsDiv.innerHTML = '';
    phonicsGroups.forEach((g, i) => {
        const btn = document.createElement('button');
        btn.className = 'tab';
        btn.innerText = g.name;
        btn.onclick = () => selectGroup(i);
        tabsDiv.appendChild(btn);
    });
}

// 選擇分組
function selectGroup(gIndex) {
    // 更新按鈕樣式
    document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i === gIndex));
    
    // 渲染該組嘅字母鍵盤
    const kb = document.getElementById('kb');
    kb.innerHTML = '';
    phonicsGroups[gIndex].letters.forEach(letter => {
        const btn = document.createElement('div');
        btn.className = 'key';
        btn.innerText = letter;
        btn.onclick = () => {
            idx = D.findIndex(d => d.l === letter);
            reset();
        };
        kb.appendChild(btn);
    });
    
    // 自動載入該組第一個字母
    idx = D.findIndex(d => d.l === phonicsGroups[gIndex].letters[0]);
    reset();
}

function reset() {
    isMagic=false; strokeIdx=0; doneStrokes=[]; curStroke=[]; isDrawing=false;
    document.getElementById('canvas-wrapper').style.transform="scale(1) rotate(0deg)";
    document.getElementById('msg').innerText = "由綠色點出發，畫到尾為止！";
    document.getElementById('msg').style.color = "#1982c4";
}

function playSnd(f, t, dur=0.3) {
    if(!aCtx) return;
    let o=aCtx.createOscillator(), g=aCtx.createGain();
    o.connect(g); g.connect(aCtx.destination); o.type=t; o.frequency.value=f;
    g.gain.setValueAtTime(0.3, aCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, aCtx.currentTime+dur);
    o.start(); o.stop(aCtx.currentTime+dur);
}

function drawLine(pts, col, dash) {
    if(pts.length < 2) return;
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    for(let i=2; i<pts.length; i+=2) ctx.lineTo(pts[i], pts[i+1]);
    ctx.strokeStyle=col; ctx.lineWidth=25; ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.setLineDash(dash ? [10,15] : []); ctx.stroke();
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
        const s = D[idx].st;
        s.forEach(st => drawLine(st, '#e0e0e0', true)); 
        doneStrokes.forEach(st => drawLine(st, '#ff9f1c', false)); 
        drawLine(curStroke, '#ffca3a', false); 
        
        if(strokeIdx < s.length) {
            let st = s[strokeIdx];
            let gx = curStroke.length ? curStroke[curStroke.length-2] : st[0];
            let gy = curStroke.length ? curStroke[curStroke.length-1] : st[1];
            ctx.beginPath(); ctx.arc(gx, gy, 16, 0, 7); ctx.fillStyle='#06d6a0'; ctx.fill();
            
            let pt = getPointOnPath(st, (Date.now()%2000)/2000);
            ctx.beginPath(); ctx.arc(pt.x, pt.y, 10, 0, 7); ctx.fillStyle='#1982c4'; ctx.fill();
        }
    } else {
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

cvs.addEventListener('pointerdown', e => {
    if(isMagic || strokeIdx >= D[idx].st.length) return;
    const r=cvs.getBoundingClientRect(), x = e.clientX-r.left, y = e.clientY-r.top;
    let st = D[idx].st[strokeIdx];
    let gx = curStroke.length ? curStroke[curStroke.length-2] : st[0];
    let gy = curStroke.length ? curStroke[curStroke.length-1] : st[1];
    
    if(Math.hypot(x-gx, y-gy) < 60) {
        cvs.setPointerCapture(e.pointerId); isDrawing=true;
        if(curStroke.length === 0) curStroke.push(x, y);
    }
});

cvs.addEventListener('pointermove', e => {
    if(!isDrawing || isMagic) return;
    const r=cvs.getBoundingClientRect(), x = e.clientX-r.left, y = e.clientY-r.top;
    curStroke.push(x, y);
    
    let st = D[idx].st[strokeIdx];
    let tx = st[st.length-2], ty = st[st.length-1];
    
    if(Math.hypot(x-tx, y-ty) < 50) {
        playSnd(880, 'sine', 0.2); 
        doneStrokes.push(curStroke); curStroke=[]; strokeIdx++; isDrawing=false;
        cvs.releasePointerCapture(e.pointerId);
        
        if(strokeIdx >= D[idx].st.length) { 
            setTimeout(()=>{
                [523,659,783,1046].forEach((f,i)=>setTimeout(()=>playSnd(f,'triangle',0.3),i*100)); 
                document.getElementById('msg').innerText = "好叻！撳 ✨ 變魔術啦！";
            }, 200);
        }
    }
});

cvs.addEventListener('pointerup', e => { isDrawing=false; cvs.releasePointerCapture(e.pointerId); });

async function magic() {
    if(strokeIdx < D[idx].st.length) { document.getElementById('msg').innerText = "未畫完喎！"; return; }
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
