// ==========================================
// 📸 探索魔鏡 (相機與 AI 認字模組 - 防白屏/防失聯版)
// ==========================================

window.cameraStream = null;
window.lastCapturedImg = null;
window.isAnalyzing = false; 
window.cropPoints = [];
window.isCropping = false;
window.snapImg = null;

// 安全獲取 DOM，防止因 HTML 缺失而卡死
function safeDisplay(id, displayStyle) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = displayStyle;
    if (displayStyle === 'none') {
        el.classList.remove('is-open');
        el.setAttribute('aria-hidden', 'true');
    } else if (id === 'camera-overlay') {
        el.classList.add('is-open');
        el.setAttribute('aria-hidden', 'false');
    }
}
function getEl(id) { return document.getElementById(id); }

window.openCamera = async function() {
    if (window.stopAllAudio) window.stopAllAudio();
    window.isAnalyzing = false;
    if (window.Curriculum && window.Curriculum.bootFx) window.Curriculum.bootFx();

    safeDisplay('app', 'none');
    safeDisplay('game-overlay', 'none');
    safeDisplay('match-overlay', 'none');
    safeDisplay('play-overlay', 'none');
    safeDisplay('race-overlay', 'none');
    safeDisplay('puzzle-overlay', 'none');
    safeDisplay('hunt-overlay', 'none');
    safeDisplay('shoot-overlay', 'none');
    safeDisplay('standard-top-bar', 'none');
    safeDisplay('back-to-home-btn', 'none');
    safeDisplay('standard-ui', 'none');
    safeDisplay('camera-overlay', 'flex');
    const cam = getEl('camera-overlay');
    if (cam) cam.classList.add('is-open');
    safeDisplay('camera-video', 'block');
    safeDisplay('crop-canvas', 'none');
    safeDisplay('capture-btn', 'inline-block');
    safeDisplay('confirm-crop-btn', 'none');
    safeDisplay('cancel-analyze-btn', 'none');
    safeDisplay('loading-msg', 'none');
    const cropCtrl = getEl('canvas-controls');
    if (cropCtrl) cropCtrl.style.display = 'none';
    // Hide writing UI while camera is open
    safeDisplay('btn-re-cam', 'none');

    // iPhone Safari often needs an explicit play() after getUserMedia
    try {
        window.cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
        });
        const video = document.getElementById('camera-video');
        if (video) {
            video.setAttribute('playsinline', 'true');
            video.setAttribute('webkit-playsinline', 'true');
            video.muted = true;
            video.srcObject = window.cameraStream;
            const playPromise = video.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(function (e) { console.warn('video.play failed', e); });
            }
        }

        if (window.playCantoneseTTS) {
            window.playCantoneseTTS("魔鏡開咗喇！搵下有咩得意嘢，影低佢啦！");
        }
    } catch (err) {
        console.error("相機權限錯誤:", err);
        alert("開唔到相機，請檢查瀏覽器權限！（Safari 要用 HTTPS 或本機網址）");
        if (typeof window.backToHome === 'function') window.backToHome();
        else window.closeCamera();
    }
};

window.takePhoto = function() {
    const video = document.getElementById('camera-video');
    const cropCanvas = document.getElementById('crop-canvas');
    if (!video || !cropCanvas || !window.cameraStream) {
        alert("系統錯誤：找不到相機畫面或畫布元素 (crop-canvas)。");
        return;
    }

    if (window.playCantoneseTTS) window.playCantoneseTTS("影咗喇！用手指圈出你想認嘅嘢啦！");

    const tempCanvas = document.createElement('canvas');
    // safe fallbacks for video dimensions
    const vW = video.videoWidth || video.clientWidth || 640;
    const vH = video.videoHeight || video.clientHeight || 480;
    tempCanvas.width = vW;
    tempCanvas.height = vH;
    const tempCtx = tempCanvas.getContext('2d');
    try { tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height); } catch(e) { console.warn('drawImage failed:', e); }
    
    let maxW = window.innerWidth;
    let maxH = Math.max(200, window.innerHeight - 120);
    let ratio = 1;
    if (vW > 0 && vH > 0) ratio = Math.min(maxW / vW, maxH / vH);
    if (!isFinite(ratio) || ratio <= 0) ratio = 1;

    cropCanvas.width = Math.max(1, Math.round(vW * ratio));
    cropCanvas.height = Math.max(1, Math.round(vH * ratio));
    // Ensure canvas CSS size matches its pixel buffer to avoid layout/position shifts
    cropCanvas.style.width = cropCanvas.width + 'px';
    cropCanvas.style.height = cropCanvas.height + 'px';
    // center canvas horizontally
    cropCanvas.style.display = 'block';
    cropCanvas.style.margin = '0 auto';

    window.snapImg = new Image();
    window.snapImg.onload = () => {
        const ctx = cropCanvas.getContext('2d');
        ctx.clearRect(0,0,cropCanvas.width,cropCanvas.height);
        ctx.drawImage(window.snapImg, 0, 0, cropCanvas.width, cropCanvas.height);
        
        video.style.display = 'none';
        cropCanvas.style.display = 'block';
        safeDisplay('capture-btn', 'none');
        safeDisplay('confirm-crop-btn', 'inline-block');
        
        setupDrawingEvents(cropCanvas);
        ensureCanvasControls();
        // Show crop helpers: retake + clear (no duplicate "magic" button)
        const ctrl = document.getElementById('canvas-controls');
        if (ctrl) ctrl.style.display = 'flex';
    };
    window.snapImg.src = tempCanvas.toDataURL('image/jpeg', 0.9);
};

function setupDrawingEvents(canvas) {
    const ctx = canvas.getContext('2d');

    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        // 兼容觸控與滑鼠
        let clientX = e.clientX;
        let clientY = e.clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }
        return {
            x: (clientX - rect.left) * (canvas.width / rect.width),
            y: (clientY - rect.top) * (canvas.height / rect.height)
        };
    };

    const startCrop = (e) => {
        if(e.cancelable) e.preventDefault();
        window.isCropping = true;
        const pos = getPos(e);
        window.cropPoints = [pos];
        
        ctx.drawImage(window.snapImg, 0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    };

    const moveCrop = (e) => {
        if(e.cancelable) e.preventDefault();
        if (!window.isCropping) return;
        const pos = getPos(e);
        window.cropPoints.push(pos);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = '#ffca3a'; 
        ctx.lineWidth = 5; 
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    };

    const endCrop = (e) => {
        if(e.cancelable) e.preventDefault();
        if (!window.isCropping) return;
        window.isCropping = false;
    };

    // remove previous handlers to prevent duplicates
    if (canvas._handlers) {
        canvas.removeEventListener('mousedown', canvas._handlers.start);
        canvas.removeEventListener('mousemove', canvas._handlers.move);
        canvas.removeEventListener('mouseup', canvas._handlers.end);
        canvas.removeEventListener('mouseleave', canvas._handlers.end);
        canvas.removeEventListener('touchstart', canvas._handlers.start);
        canvas.removeEventListener('touchmove', canvas._handlers.move);
        canvas.removeEventListener('touchend', canvas._handlers.end);
    }

    canvas._handlers = { start: startCrop, move: moveCrop, end: endCrop };

    canvas.addEventListener('mousedown', startCrop);
    canvas.addEventListener('mousemove', moveCrop);
    canvas.addEventListener('mouseup', endCrop);
    canvas.addEventListener('mouseleave', endCrop);
    
    // 解決部分手機 passive 報錯問題
    canvas.addEventListener('touchstart', startCrop, {passive: false});
    canvas.addEventListener('touchmove', moveCrop, {passive: false});
    canvas.addEventListener('touchend', endCrop, {passive: false});
}

// Crop helpers only: Retake + Clear. "魔法" was removed — it duplicated ✅ 確定.
function ensureCanvasControls() {
    const preview = document.getElementById('camera-controls') || document.body;
    if (!preview) return;

    let ctrl = document.getElementById('canvas-controls');
    if (ctrl) {
        // Remove leftover magic button from older sessions / cached DOM
        const oldMagic = document.getElementById('magic-btn');
        if (oldMagic) oldMagic.remove();
        return;
    }

    ctrl = document.createElement('div');
    ctrl.id = 'canvas-controls';

    const retake = document.createElement('button');
    retake.type = 'button';
    retake.id = 'retake-btn';
    retake.innerText = '再影一次';
    retake.onclick = () => {
        const video = document.getElementById('camera-video');
        const cropCanvas = document.getElementById('crop-canvas');
        if (video && cropCanvas) {
            cropCanvas.style.display = 'none';
            video.style.display = 'block';
            safeDisplay('capture-btn', 'inline-block');
            safeDisplay('confirm-crop-btn', 'none');
            if (ctrl) ctrl.style.display = 'none';
            window.cropPoints = [];
            const ctx = cropCanvas.getContext('2d');
            ctx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
            if (window.playCantoneseTTS) window.playCantoneseTTS('可以再影一次喇！');
        }
    };

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.id = 'clear-draw-btn';
    clearBtn.innerText = '清除圈畫';
    clearBtn.onclick = () => {
        const cropCanvas = document.getElementById('crop-canvas');
        if (!cropCanvas || !window.snapImg) return;
        const ctx = cropCanvas.getContext('2d');
        ctx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
        ctx.drawImage(window.snapImg, 0, 0, cropCanvas.width, cropCanvas.height);
        window.cropPoints = [];
        if (window.playCantoneseTTS) window.playCantoneseTTS('已經清除圈畫！');
    };

    ctrl.appendChild(retake);
    ctrl.appendChild(clearBtn);
    preview.appendChild(ctrl);
}

window.confirmCrop = function() {
    if (!window.cropPoints || window.cropPoints.length < 2) {
        if (window.playCantoneseTTS) window.playCantoneseTTS("你仲未圈出要認嘅嘢喎！");
        alert("未圈好喎！請用手指畫個圈。");
        return;
    }
    
    const cropCanvas = document.getElementById('crop-canvas');
    let xs = window.cropPoints.map(p => p.x);
    let ys = window.cropPoints.map(p => p.y);
    let minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = Math.max(10, maxX - minX);
    finalCanvas.height = Math.max(10, maxY - minY);
    const finalCtx = finalCanvas.getContext('2d');
    
    const scaleX = window.snapImg.width / cropCanvas.width;
    const scaleY = window.snapImg.height / cropCanvas.height;
    
    finalCtx.drawImage(window.snapImg, 
                       minX * scaleX, minY * scaleY, finalCanvas.width * scaleX, finalCanvas.height * scaleY, 
                       0, 0, finalCanvas.width, finalCanvas.height);
                       
    window.lastCapturedImg = finalCanvas.toDataURL('image/jpeg', 0.8);
    
    safeDisplay('loading-msg', 'block');
    if (window.playCantoneseTTS) window.playCantoneseTTS("收到！等我睇下呢個係咩先。");
    
    // disable controls while analyzing
    setTimeout(() => { setCameraControlsEnabled(false); }, 0);
    
    window.identifyWithAI(window.lastCapturedImg).finally(() => {
        setCameraControlsEnabled(true);
    });
};

// helper to disable/enable main camera buttons
function setCameraControlsEnabled(enabled) {
    const capture = document.getElementById('capture-btn');
    const confirm = document.getElementById('confirm-crop-btn');
    const retake = document.getElementById('retake-btn');
    const clearBtn = document.getElementById('clear-draw-btn');
    if (capture) capture.disabled = !enabled;
    if (confirm) confirm.disabled = !enabled;
    if (retake) retake.disabled = !enabled;
    if (clearBtn) clearBtn.disabled = !enabled;
}

/** After AI recognizes a word: show tracing UI + "影下一個" retake button */
window.enterCameraWritingFlow = function(word) {
    if (window.closeCamera) window.closeCamera();
    safeDisplay('home-menu', 'none');
    safeDisplay('camera-overlay', 'none');
    safeDisplay('game-overlay', 'none');
    safeDisplay('match-overlay', 'none');
    safeDisplay('play-overlay', 'none');
    const cam = getEl('camera-overlay');
    if (cam) {
        cam.classList.remove('is-open');
        cam.style.display = 'none';
        cam.setAttribute('aria-hidden', 'true');
    }

    if (window.WritingSession && typeof window.WritingSession.begin === 'function') {
        window.WritingSession.begin({
            mode: 'camera',
            word: word,
            imgUrl: window.lastCapturedImg || null
        });
        return;
    }

    // Fallback if writing.js failed to load
    window.currentMode = 'camera';
    safeDisplay('standard-ui', 'none');
    safeDisplay('standard-top-bar', 'flex');
    safeDisplay('back-to-home-btn', 'inline-block');
    safeDisplay('app', 'block');

    const reCam = getEl('btn-re-cam');
    if (reCam) {
        reCam.style.display = 'inline-block';
        reCam.onclick = function () { window.openCamera(); };
    }

    if (window.processWord) {
        window.processWord(word, window.lastCapturedImg);
    }
};

window.closeCamera = function() {
    if (window.cameraStream) {
        window.cameraStream.getTracks().forEach(track => track.stop());
        window.cameraStream = null;
    }
    const video = getEl('camera-video');
    if (video) {
        try { video.srcObject = null; } catch (e) { /* ignore */ }
    }
    safeDisplay('camera-overlay', 'none');
    const cam = getEl('camera-overlay');
    if (cam) cam.classList.remove('is-open');
};

var IDENTIFY_JUNK = {
    a: 1, an: 1, and: 1, analysis: 1, cannot: 1, error: 1, identified: 1,
    identification: 1, identify: 1, image: 1, in: 1, is: 1, it: 1, item: 1, main: 1,
    no: 1, none: 1, noun: 1, object: 1, of: 1, ok: 1, okay: 1, on: 1, or: 1,
    please: 1, photo: 1, picture: 1, response: 1, result: 1, retry: 1, safe: 1, safety: 1, sorry: 1,
    that: 1, the: 1, thing: 1, this: 1, to: 1, unknown: 1, user: 1, word: 1,
    yes: 1, with: 1, for: 1
};

/** Pull one English noun from a vision-model reply. Prefer curriculum vocab. */
function parseIdentifyNoun(raw, vocab) {
    raw = String(raw || '').replace(/```/g, ' ').trim().toLowerCase();
    if (!raw) return '';
    vocab = vocab || [];
    var bestIdx = Infinity;
    var best = '';
    for (var i = 0; i < vocab.length; i++) {
        var w = String(vocab[i] || '').toLowerCase();
        if (!w) continue;
        var escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        var idx = raw.search(new RegExp('\\b' + escaped + '\\b'));
        if (idx !== -1 && idx < bestIdx) {
            bestIdx = idx;
            best = w;
        }
    }
    if (best) return best;

    var parts = [];
    try {
        parts = raw.split(/[^\p{L}]+/u);
    } catch (e) {
        parts = raw.split(/[^a-z]+/);
    }
    var kept = [];
    for (var j = 0; j < parts.length; j++) {
        var t = parts[j];
        if (!t || t.length < 2 || t.length > 20) continue;
        if (!/^[a-z]+$/.test(t)) continue;
        if (IDENTIFY_JUNK[t]) continue;
        kept.push(t);
    }
    if (!kept.length) return '';
    return kept[kept.length - 1];
}

function readIdentifyMessage(data) {
    if (!data) return '';
    try {
        var choice = data.choices && data.choices[0];
        var msg = choice && choice.message;
        var bits = [];
        if (msg) {
            var content = msg.content;
            if (typeof content === 'string') bits.push(content);
            else if (Array.isArray(content)) {
                bits.push(content.map(function (p) {
                    return p && (p.text || p.content || p);
                }).join(' '));
            }
        }
        if (data.output) {
            bits.push(Array.isArray(data.output)
                ? data.output.join(' ')
                : (data.output.text || String(data.output)));
        }
        return bits.join(' ').trim();
    } catch (e) {
        return '';
    }
}

function shrinkImageDataUrl(dataUrl, maxSide) {
    maxSide = maxSide || 768;
    return new Promise(function (resolve) {
        if (typeof Image === 'undefined') {
            resolve(dataUrl);
            return;
        }
        var img = new Image();
        img.onload = function () {
            var w = img.width || 1;
            var h = img.height || 1;
            var scale = Math.min(1, maxSide / Math.max(w, h));
            if (scale >= 0.98 && dataUrl.length < 400000) {
                resolve(dataUrl);
                return;
            }
            var c = document.createElement('canvas');
            c.width = Math.max(1, Math.round(w * scale));
            c.height = Math.max(1, Math.round(h * scale));
            try {
                c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
                resolve(c.toDataURL('image/jpeg', 0.72));
            } catch (e) {
                resolve(dataUrl);
            }
        };
        img.onerror = function () { resolve(dataUrl); };
        img.src = dataUrl;
    });
}

function identifyFailKeepPhoto(loadingMsg) {
    if (window.Curriculum && window.Curriculum.missFx) {
        window.Curriculum.missFx(document.getElementById('camera-overlay'), '再試');
    }
    if (window.playCantoneseTTS) {
        window.playCantoneseTTS('認唔到呀，相片留住，再撳綠色認呢樣試多次。');
    }
    if (loadingMsg) loadingMsg.innerText = '❌ 認唔到，再撳「認呢樣」試多次。';
    setTimeout(function () {
        if (loadingMsg) loadingMsg.style.display = 'none';
        safeDisplay('camera-controls', 'flex');
        safeDisplay('confirm-crop-btn', 'inline-block');
        safeDisplay('capture-btn', 'none');
        var crop = getEl('crop-canvas');
        if (crop) crop.style.display = 'block';
        var ctrl = getEl('canvas-controls');
        if (ctrl) ctrl.style.display = 'flex';
        var vid = getEl('camera-video');
        if (vid) vid.style.display = 'none';
        setCameraControlsEnabled(true);
    }, 1600);
}

window.identifyWithAI = async function identifyWithAI(croppedBase64OrDataUrl) {
    window.isAnalyzing = true;

    // Current OpenRouter free vision models (old :free IDs 404 forever).
    var models = [
        'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
        'minimax/minimax-m3:free',
        'google/gemma-4-31b-it:free',
        'google/gemma-4-26b-a4b-it:free'
    ];

    var apiKey = window.getApiKey ? window.getApiKey('openrouter_api_key') : localStorage.getItem('openrouter_api_key');
    if (!apiKey) {
        apiKey = prompt('請輸入 OpenRouter API Key:');
        if (apiKey) localStorage.setItem('openrouter_api_key', apiKey);
        else { window.closeCamera(); return; }
    }

    var loadingMsg = getEl('loading-msg');
    if (loadingMsg) {
        loadingMsg.style.display = 'block';
        loadingMsg.style.zIndex = '100';
        loadingMsg.style.pointerEvents = 'none';
        loadingMsg.innerHTML = '<span class="thinking-anim">🧠</span> 分析緊相...';
    }

    var cancelBtn = getEl('cancel-analyze-btn');
    if (cancelBtn) cancelBtn.style.display = 'none';

    var cancelTimer = setTimeout(function () {
        if (window.isAnalyzing) {
            if (cancelBtn) {
                cancelBtn.style.display = 'block';
                cancelBtn.onclick = function () {
                    if (window.currentAborter) {
                        try { window.currentAborter.abort(); } catch (e) { /* ignore */ }
                    }
                    window.isAnalyzing = false;
                    if (loadingMsg) loadingMsg.style.display = 'none';
                    safeDisplay('camera-controls', 'flex');
                    safeDisplay('confirm-crop-btn', 'inline-block');
                };
            }
            if (window.playCantoneseTTS) {
                window.playCantoneseTTS('諗得太耐喇，你可以撳紅色掣取消，或者等陣再試。');
            }
        }
    }, 10000);

    var vocab = [];
    try {
        var dict = window.D || (typeof D !== 'undefined' ? D : null);
        if (dict) vocab = dict.map(function (d) { return d.w; }).filter(Boolean);
    } catch (e) {
        vocab = [];
    }
    var vocabList = vocab.join(', ');

    var imageDataUrl = (typeof croppedBase64OrDataUrl === 'string' && croppedBase64OrDataUrl.startsWith('data:'))
        ? croppedBase64OrDataUrl
        : 'data:image/jpeg;base64,' + croppedBase64OrDataUrl;
    try {
        imageDataUrl = await shrinkImageDataUrl(imageDataUrl, 768);
    } catch (e) { /* keep original */ }

    var referer = 'https://zackyuen.github.io/Zizi-English-Class/';
    try {
        if (window.location && window.location.origin) {
            referer = window.location.origin + (window.location.pathname || '/');
        }
    } catch (e) { /* keep default */ }

    for (var mi = 0; mi < models.length; mi++) {
        var model = models[mi];
        if (!window.isAnalyzing) break;

        if (loadingMsg) {
            loadingMsg.innerHTML = '<span class="thinking-anim">🧠</span> 分析緊相...';
        }

        var aborter = new AbortController();
        window.currentAborter = aborter;
        var REQUEST_TIMEOUT = 30000;
        var reqTimeoutId = setTimeout(function () {
            try { aborter.abort(); } catch (e) { /* ignore */ }
        }, REQUEST_TIMEOUT);

        if (cancelBtn) {
            cancelBtn.onclick = function () {
                try { aborter.abort(); } catch (e) { /* ignore */ }
                window.isAnalyzing = false;
                if (loadingMsg) loadingMsg.style.display = 'none';
                safeDisplay('camera-controls', 'flex');
                safeDisplay('confirm-crop-btn', 'inline-block');
            };
        }

        try {
            var payload = {
                model: model,
                messages: [{
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'Look at this photo of a real object. ' +
                                'Reply with ONLY one simple English noun a 5-year-old can write. ' +
                                (vocabList ? ('Prefer one of: ' + vocabList + '. ') : '') +
                                'No sentence. One word.'
                        },
                        {
                            type: 'image_url',
                            image_url: { url: imageDataUrl }
                        }
                    ]
                }]
            };

            var response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + apiKey,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': referer,
                    'X-Title': 'Zizi English Class'
                },
                body: JSON.stringify(payload),
                signal: aborter.signal
            });

            clearTimeout(reqTimeoutId);

            if (!response.ok) {
                var txt = await response.text().catch(function () { return ''; });
                console.warn(model + ' returned ' + response.status + ':', txt);
                continue;
            }

            var data = await response.json().catch(function () { return null; });
            var rawContent = readIdentifyMessage(data);
            var finalWord = parseIdentifyNoun(rawContent, vocab);
            if (!finalWord) {
                console.warn(model + ' had no usable noun:', rawContent);
                continue;
            }

            clearTimeout(cancelTimer);
            window.isAnalyzing = false;
            if (loadingMsg) loadingMsg.innerText = '✨ 搵到喇！係 ' + finalWord + '！';
            if (window.Curriculum && window.Curriculum.hitFx) {
                window.Curriculum.hitFx(document.getElementById('camera-overlay'), null, 1);
            }

            setTimeout(function () {
                window.closeCamera();
                window.enterCameraWritingFlow(finalWord);
            }, 500);

            window.currentAborter = null;
            return;
        } catch (err) {
            if (err && err.name === 'AbortError') {
                console.warn(model + ' fetch aborted');
            } else {
                console.error(model + ' 失敗:', err);
            }
        } finally {
            clearTimeout(reqTimeoutId);
        }
    }

    clearTimeout(cancelTimer);
    window.currentAborter = null;

    if (window.isAnalyzing) {
        window.isAnalyzing = false;
        identifyFailKeepPhoto(loadingMsg);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { parseIdentifyNoun: parseIdentifyNoun };
}
