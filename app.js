let currentMode = 'standard'; // 'standard' or 'camera'
let idx=0, isMagic=false, magicStart=0, fired=false;
let strokeIdx=0, doneStrokes=[], curStroke=[], isDrawing=false;
let currentWPs=[], nextWpIdx=0, currentPercent=0, lastCalc=0;
let guideData=null, totalGuide=0;

const cvs=document.getElementById('cvs'), ctx=cvs.getContext('2d', {willReadFrequently:true});
const offCvs=document.createElement('canvas'); offCvs.width=300; offCvs.height=300;
const offCtx=offCvs.getContext('2d', {willReadFrequently:true});
const userCvs=document.createElement('canvas'); userCvs.width=300; userCvs.height=300;
const userCtx=userCvs.getContext('2d', {willReadFrequently:true});

let aCtx, mAudio = new Audio();
const imgCache = {}; 

function preloadImage(url) {
    if(!url || imgCache[url]) return;
    let img = new Image(); img.src = url; imgCache[url] = img;
}

// 啟動 App 並選擇模式
function startApp(mode) {
    mAudio.src='data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
    mAudio.play().catch(()=>{});
    aCtx = new (window.AudioContext || window.webkitAudioContext)();
    document.getElementById('start-overlay').style.display='none';
    
    renderTabs();
    setMode(mode);
    requestAnimationFrame(loop);
}

// 切換模式 (Toggle)
function toggleMode() {
    let newMode = currentMode === 'standard' ? 'camera' : 'standard';
    setMode(newMode);
}

// 設置模式 UI 狀態
function setMode(mode) {
    currentMode = mode;
    if (mode === 'standard') {
        document.getElementById('standard-ui').style.display = 'block';
        document.getElementById('camera-ui-container').style.display = 'none';
        selectGroup(0); // 預設跳去第 1 組
    } else {
        document.getElementById('standard-ui').style.display = 'none';
        document.getElementById('camera-ui-container').style.display = 'block';
        reset();
        document.getElementById('msg').innerText = "撳下面個掣，影低身邊嘅嘢啦！";
    }
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
    if(currentMode !== 'standard') return;
    document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i === gIndex));
    const kb = document.getElementById('kb'); kb.innerHTML = '';
    phonicsGroups[gIndex].letters.forEach(letter => {
        const btn = document.createElement('div'); btn.className = 'key'; btn.innerText = letter;
        btn.onclick = () => {
            let matches = D.map((d, i) => d.l === letter ? i : -1).filter(i => i !== -1);
            idx = matches[Math.floor(Math.random() * matches.length)]; 
            reset();
        };
        kb.appendChild(btn);
    });
    let initMatches = D.map((d, i) => d.l === phonicsGroups[gIndex].letters[0] ? i : -1).filter(i => i !== -1);
    idx = initMatches[Math.floor(Math.random() * initMatches.length)];
    reset();
}

function reset() {
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
}

function initWaypoints() {
    if(strokeIdx >= D[idx].st.length) { currentWPs=[]; return; }
    let st = D[idx].st[strokeIdx];
    currentWPs = [];
    for(let i=0; i<st.length-2; i+=2) {
        let x1=st[i], y1=st[i+1], x2=st[i+2], y2=st[i+3];
        let dist = Math.hypot(x2-x1, y2-y1);
        let steps = Math.max(1, Math.ceil(dist / 15)); 
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
        D[idx].st.forEach(st => drawLineToCtx(ctx, st, '#e0e0e0', true, 25)); 
        doneStrokes.forEach(st => drawLineToCtx(ctx, st, '#ff9f1c', false, 25)); 
        drawLineToCtx(ctx, curStroke, '#ffca3a', false, 25); 
        
        if(strokeIdx < D[idx].st.length && currentWPs.length > 0) {
            let targetWP = currentWPs[nextWpIdx];
            if(targetWP) {
                ctx.beginPath(); ctx.arc(targetWP.x, targetWP.y, 16, 0, 7); ctx.fillStyle='#06d6a0'; ctx.fill();
            }
            let pt = getPointOnPath(D[idx].st[strokeIdx], (Date.now()%2000)/2000);
            ctx.beginPath(); ctx.arc(pt.x, pt.y, 10, 0, 7); ctx.fillStyle='#1982c4'; ctx.fill();
        }

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
        let dt = Date.now() - magicStart;
        let phase = D[idx].p.slice().reverse().find(p => dt >= p.t);
        if(phase) {
            ctx.textAlign='center'; ctx.textBaseline='middle';
            if(phase.type === 'letter') {
                ctx.font='bold 200px Arial'; ctx.fillStyle='#ff595e'; ctx.fillText(phase.text, 150, 150);
            } else if(phase.type === 'phonic') {
                let totalW = 0;
                let widths = phase.pData.map(pd => { 
                    ctx.font='bold 65px Comic Sans MS'; 
                    let w = ctx.measureText(pd.letter).width + 15; 
                    totalW += w; return w; 
                });
                
                let startX = 150 - (totalW / 2); 
                phase.pData.forEach((pd, i) => {
                    let isHl = (i === phase.hlIdx);
                    ctx.font='bold 65px Comic Sans MS';
                    ctx.fillStyle = isHl ? '#ff595e' : '#1d3557';
                    ctx.fillText(pd.letter, startX + widths[i]/2, 120);
                    ctx.font='bold 26px Arial';
                    ctx.fillStyle = isHl ? '#ffca3a' : '#8ac926';
                    ctx.fillText(pd.ipa, startX + widths[i]/2, 190);
                    startX += widths[i];
                });
            } else if(phase.type === 'word') {
                if(phase.img && imgCache[phase.img] && imgCache[phase.img].complete && imgCache[phase.img].naturalWidth > 0) {
                    ctx.drawImage(imgCache[phase.img], 50, 20, 200, 200);
                } else {
                    ctx.font='100px Arial'; ctx.fillText(D[idx].emoji || '', 150, 100);
                }
                ctx.font='bold 50px Comic Sans MS'; ctx.fillStyle='#1d3557'; ctx.fillText(phase.text, 150, 260);
                if(!fired) { confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }}); fired=true; }
            }
        }
    }
    requestAnimationFrame(loop);
}

cvs.addEventListener('pointerdown', e => {
    if(isMagic || strokeIdx >= D[idx].st.length) return;
    const r=cvs.getBoundingClientRect(), x = e.clientX-r.left, y = e.clientY-r.top;
    let target = currentWPs[nextWpIdx];
    if(target && Math.hypot(x-target.x, y-target.y) < 60) {
        cvs.setPointerCapture(e.pointerId); isDrawing=true;
        if(curStroke.length === 0) curStroke.push(target.x, target.y); 
        curStroke.push(x, y);
    }
});

cvs.addEventListener('pointermove', e => {
    if(!isDrawing || isMagic) return;
    const r=cvs.getBoundingClientRect(), x = e.clientX-r.left, y = e.clientY-r.top;
    curStroke.push(x, y);
    while(nextWpIdx < currentWPs.length && Math.hypot(x - currentWPs[nextWpIdx].x, y - currentWPs[nextWpIdx].y) < 60) {
        nextWpIdx++;
    }
    if(nextWpIdx >= currentWPs.length) {
        let endWp = currentWPs[currentWPs.length-1];
        curStroke.push(endWp.x, endWp.y); 
        playSnd(880, 'sine', 0.2); 
        doneStrokes.push(curStroke); curStroke=[]; strokeIdx++; isDrawing=false;
        cvs.releasePointerCapture(e.pointerId);
        initWaypoints(); 
        if(strokeIdx >= D[idx].st.length) { 
            currentPercent = 100; updateMsg();
            setTimeout(()=>{ [523,659,783,1046].forEach((f,i)=>setTimeout(()=>playSnd(f,'triangle',0.3),i*100)); }, 200);
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
    if(!key) { key = prompt("請輸入 Google TTS API Key:"); if(key) localStorage.setItem('google_tts_key', key); else return; }
    
    document.getElementById('canvas-wrapper').style.transform = "scale(0.1) rotate(360deg)";
    document.getElementById('msg').innerText = "聯絡緊 Google TTS...✨";
    
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
        document.getElementById('msg').innerText = currentMode === 'camera' ? "魔術成功！再撳下面掣影過啦！" : "魔術成功！";
    }, 600);
}

// ==========================================
// 📷 探索魔鏡功能 (Camera & Gemini API)
// ==========================================
let stream = null;

async function openCamera() {
    // 檢查瀏覽器是否支援
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("你嘅瀏覽器唔支援相機！請確保你用緊 Safari / Chrome，並且網址係 https:// 或者 localhost。");
        return;
    }

    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        const video = document.getElementById('camera-video');
        video.srcObject = stream;
        document.getElementById('camera-overlay').style.display = 'flex';
        document.getElementById('camera-controls').style.display = 'flex';
        document.getElementById('loading-msg').style.display = 'none';
    } catch (err) {
        alert("開唔到相機呀！原因：" + err.message);
    }
}

function closeCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    document.getElementById('camera-overlay').style.display = 'none';
}

async function takePhoto() {
    document.getElementById('camera-controls').style.display = 'none';
    document.getElementById('loading-msg').style.display = 'block';
    
    const video = document.getElementById('camera-video');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const base64Data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    
    await identifyWithGemini(base64Data);
}

async function identifyWithGemini(base64Image) {
    let apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
        apiKey = prompt("請輸入 Gemini API Key (用於影像識別):");
        if (apiKey) localStorage.setItem('gemini_api_key', apiKey);
        else { closeCamera(); return; }
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: "What is the main physical object in this image? Reply with ONLY ONE English word in lowercase. No punctuation, no articles." },
                        { inline_data: { mime_type: "image/jpeg", data: base64Image } }
                    ]
                }]
            })
        });
        
        const data = await response.json();
        if (data.error) throw data.error;
        
        const recognizedWord = data.candidates[0].content.parts[0].text.trim().toLowerCase();
        closeCamera();
        processWord(recognizedWord);
        
    } catch (err) {
        alert("API 錯誤，請檢查 Key 或網絡連線。");
        closeCamera();
    }
}

function processWord(word) {
    let exactMatchIdx = D.findIndex(d => d.w === word);
    
    if (exactMatchIdx !== -1) {
        idx = exactMatchIdx;
        speakAlert(`嘩！係 ${word} 呀！我哋一齊學寫！`);
        if (currentMode === 'standard') {
            let groupIdx = phonicsGroups.findIndex(g => g.letters.includes(D[idx].l));
            if (groupIdx !== -1) selectGroup(groupIdx);
        }
        reset();
    } else {
        let firstLetter = word.charAt(0).toUpperCase();
        let fallbackMatches = D.map((d, i) => d.l === firstLetter ? i : -1).filter(i => i !== -1);
        
        if (fallbackMatches.length > 0) {
            idx = fallbackMatches[Math.floor(Math.random() * fallbackMatches.length)];
            let fallbackWord = D[idx].w;
            speakAlert(`呢個係 ${word}，我哋一齊學 ${firstLetter} for ${fallbackWord} 先啦！`);
            if (currentMode === 'standard') {
                let groupIdx = phonicsGroups.findIndex(g => g.letters.includes(D[idx].l));
                if (groupIdx !== -1) selectGroup(groupIdx);
            }
            reset();
        } else {
            speakAlert(`我認到係 ${word}，但我哋未學到呢個字母呀，試下影第二樣？`);
        }
    }
}

function speakAlert(text) {
    document.getElementById('msg').innerText = text;
    document.getElementById('msg').style.color = "#ff595e";
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-HK';
    window.speechSynthesis.speak(utterance);
}
