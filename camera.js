// ==========================================
// 📸 探索魔鏡 (相機與 AI 認字模組 - 修正版)
// - 修復語法錯誤
// - 更穩健的 DOM 安全檢查
// - 圖片縮放/壓縮以減少 payload
// - per-request timeout 與取消 (AbortController)
// - 防止重複註冊繪圖事件
// ==========================================

window.cameraStream = null;
window.lastCapturedImg = null;
window.isAnalyzing = false;
window.cropPoints = [];
window.isCropping = false;
window.snapImg = null;
window.currentAborter = null;

// 安全獲取 DOM，防止因 HTML 缺失而卡死
function safeDisplay(id, displayStyle) {
  const el = document.getElementById(id);
  if (el) el.style.display = displayStyle;
}
function getEl(id) {
  return document.getElementById(id);
}

// Resize canvas down to maxSide (preserve aspect). Returns new canvas.
function resizeCanvasMax(srcCanvas, maxSide) {
  const w = srcCanvas.width;
  const h = srcCanvas.height;
  const max = Math.max(w, h);
  if (max <= maxSide) return srcCanvas;
  const scale = maxSide / max;
  const dst = document.createElement('canvas');
  dst.width = Math.max(1, Math.round(w * scale));
  dst.height = Math.max(1, Math.round(h * scale));
  const ctx = dst.getContext('2d');
  ctx.drawImage(srcCanvas, 0, 0, dst.width, dst.height);
  return dst;
}

window.openCamera = async function () {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('此瀏覽器不支援相機 (navigator.mediaDevices 未提供)。');
    return;
  }

  if (window.stopAllAudio) window.stopAllAudio();
  window.isAnalyzing = false;

  safeDisplay('start-overlay', 'none');
  safeDisplay('app', 'none');
  safeDisplay('camera-overlay', 'flex');
  safeDisplay('camera-video', 'block');
  safeDisplay('crop-canvas', 'none');
  safeDisplay('capture-btn', 'inline-block');
  safeDisplay('confirm-crop-btn', 'none');
  safeDisplay('loading-msg', 'none');

  try {
    window.cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false
    });
    const video = getEl('camera-video');
    if (video) {
      try {
        video.srcObject = window.cameraStream;
        video.autoplay = true;
        video.playsInline = true;
        // Some browsers require muted for autoplay to work
        video.muted = true;
        // play() may reject in some contexts; swallow error
        video.play().catch(() => { /* ignore */ });
      } catch (e) {
        console.warn('video element setup failed:', e);
      }
    }

    if (window.playCantoneseTTS) {
      window.playCantoneseTTS("魔鏡開咗喇！搵下有咩得意嘢，影低佢啦！");
    }
  } catch (err) {
    console.error("相機權限錯誤:", err);
    alert("開唔到相機，請檢查瀏覽器權限！");
    window.closeCamera();
  }
};

window.takePhoto = function () {
  const video = getEl('camera-video');
  const cropCanvas = getEl('crop-canvas');
  if (!video || !cropCanvas || !window.cameraStream) {
    alert("系統錯誤：找不到相機畫面或畫布元素 (crop-canvas)。");
    return;
  }

  if (window.playCantoneseTTS) window.playCantoneseTTS("影咗喇！用手指圈出你想認嘅嘢啦！");

  // fallback for video dimensions
  const vW = video.videoWidth || video.clientWidth || 640;
  const vH = video.videoHeight || video.clientHeight || 480;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = vW;
  tempCanvas.height = vH;
  const tempCtx = tempCanvas.getContext('2d');
  try {
    tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
  } catch (e) {
    console.warn('drawImage failed (maybe video not ready):', e);
    // still continue with blank canvas if needed
  }

  let maxW = Math.max(100, window.innerWidth * 0.95);
  let maxH = Math.max(100, window.innerHeight * 0.6);
  // avoid division by zero
  let ratio = 1;
  if (vW > 0 && vH > 0) ratio = Math.min(maxW / vW, maxH / vH);
  if (!isFinite(ratio) || ratio <= 0) ratio = 1;

  cropCanvas.width = Math.max(1, Math.round(vW * ratio));
  cropCanvas.height = Math.max(1, Math.round(vH * ratio));

  window.snapImg = new Image();
  window.snapImg.onload = () => {
    const ctx = cropCanvas.getContext('2d');
    ctx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
    ctx.drawImage(window.snapImg, 0, 0, cropCanvas.width, cropCanvas.height);

    video.style.display = 'none';
    cropCanvas.style.display = 'block';
    safeDisplay('capture-btn', 'none');
    safeDisplay('confirm-crop-btn', 'inline-block');

    setupDrawingEvents(cropCanvas);
  };
  // quality 0.9 here; we'll resize and compress later before upload
  try {
    window.snapImg.src = tempCanvas.toDataURL('image/jpeg', 0.9);
  } catch (e) {
    console.error('toDataURL failed:', e);
    window.snapImg.src = '';
  }
};

function setupDrawingEvents(canvas) {
  // Remove previously attached handlers if exist
  const prev = canvas._drawHandlers;
  if (prev) {
    canvas.removeEventListener('mousedown', prev.start);
    canvas.removeEventListener('mousemove', prev.move);
    canvas.removeEventListener('mouseup', prev.end);
    canvas.removeEventListener('mouseleave', prev.end);
    canvas.removeEventListener('touchstart', prev.start);
    canvas.removeEventListener('touchmove', prev.move);
    canvas.removeEventListener('touchend', prev.end);
    canvas._drawHandlers = null;
  }

  const ctx = canvas.getContext('2d');

  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    let clientX = (e.clientX !== undefined) ? e.clientX : null;
    let clientY = (e.clientY !== undefined) ? e.clientY : null;
    if ((!clientX || !clientY) && e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }
    if (clientX == null || clientY == null) {
      return { x: 0, y: 0 };
    }
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startCrop = (e) => {
    if (e.cancelable) e.preventDefault();
    window.isCropping = true;
    const pos = getPos(e);
    window.cropPoints = [pos];

    // redraw base image
    if (window.snapImg) ctx.drawImage(window.snapImg, 0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const moveCrop = (e) => {
    if (e.cancelable) e.preventDefault();
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
    if (e && e.cancelable) e.preventDefault();
    if (!window.isCropping) return;
    window.isCropping = false;
  };

  // store references so we can remove later
  canvas._drawHandlers = { start: startCrop, move: moveCrop, end: endCrop };

  // mouse
  canvas.addEventListener('mousedown', startCrop, { passive: false });
  canvas.addEventListener('mousemove', moveCrop, { passive: false });
  canvas.addEventListener('mouseup', endCrop);
  canvas.addEventListener('mouseleave', endCrop);

  // touch
  canvas.addEventListener('touchstart', startCrop, { passive: false });
  canvas.addEventListener('touchmove', moveCrop, { passive: false });
  canvas.addEventListener('touchend', endCrop);
}

window.confirmCrop = function () {
  if (!window.cropPoints || window.cropPoints.length < 2) {
    if (window.playCantoneseTTS) window.playCantoneseTTS("你仲未圈出要認嘅嘢喎！");
    alert("未圈好喎！請用手指畫個圈。");
    return;
  }

  const cropCanvas = getEl('crop-canvas');
  if (!cropCanvas || !window.snapImg) {
    alert("系統錯誤：冇相或畫布。");
    return;
  }

  let xs = window.cropPoints.map(p => p.x);
  let ys = window.cropPoints.map(p => p.y);
  let minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);

  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = Math.max(10, Math.round(maxX - minX));
  finalCanvas.height = Math.max(10, Math.round(maxY - minY));
  const finalCtx = finalCanvas.getContext('2d');

  const scaleX = window.snapImg.width / cropCanvas.width;
  const scaleY = window.snapImg.height / cropCanvas.height;

  finalCtx.drawImage(window.snapImg,
    minX * scaleX, minY * scaleY, finalCanvas.width * scaleX, finalCanvas.height * scaleY,
    0, 0, finalCanvas.width, finalCanvas.height);

  // Resize final image to a reasonable max side (reduce payload)
  const MAX_SIDE = 1024;
  const resized = resizeCanvasMax(finalCanvas, MAX_SIDE);

  // compress to reasonable quality
  try {
    window.lastCapturedImg = resized.toDataURL('image/jpeg', 0.78);
  } catch (e) {
    console.warn('final toDataURL failed, falling back:', e);
    window.lastCapturedImg = finalCanvas.toDataURL('image/jpeg', 0.8);
  }

  safeDisplay('loading-msg', 'block');
  if (window.playCantoneseTTS) window.playCantoneseTTS("收到！等我睇下呢個係咩先。");

  window.identifyWithAI(window.lastCapturedImg);
};

window.closeCamera = function () {
  if (window.cameraStream) {
    try {
      window.cameraStream.getTracks().forEach(track => track.stop());
    } catch (e) { /* ignore */ }
    window.cameraStream = null;
  }
  safeDisplay('camera-overlay', 'none');
};

async function identifyWithAI(croppedBase64OrDataUrl) {
  window.isAnalyzing = true;

  const models = [
    "nvidia/nemotron-nano-12b-v2-vl:free",
    "qwen/qwen-2-vl-7b-instruct:free",
    "google/gemini-1.5-flash:free"
  ];

  let apiKey = localStorage.getItem('openrouter_api_key');
  if (!apiKey) {
    apiKey = prompt("請輸入 OpenRouter API Key:");
    if (apiKey) localStorage.setItem('openrouter_api_key', apiKey);
    else { window.closeCamera(); return; }
  }

  const loadingMsg = getEl('loading-msg');
  if (loadingMsg) {
    loadingMsg.style.zIndex = "100";
    loadingMsg.style.pointerEvents = 'none';
  }

  // show cancel button handler wiring (if button exists)
  const cancelBtn = getEl('cancel-analyze-btn');
  if (cancelBtn) {
    cancelBtn.style.display = 'none';
  }

  // 超時提示（顯示取消按鈕）
  let cancelTimer = setTimeout(() => {
    if (window.isAnalyzing) {
      if (cancelBtn) {
        cancelBtn.style.display = 'block';
        cancelBtn.onclick = () => {
          if (window.currentAborter) {
            try { window.currentAborter.abort(); } catch (e) { /* ignore */ }
          }
          window.isAnalyzing = false;
          if (loadingMsg) loadingMsg.style.display = 'none';
          safeDisplay('camera-controls', 'flex');
        };
      }
      if (window.playCantoneseTTS) window.playCantoneseTTS("諗得太耐喇，你可以撳紅色掣取消，影過第二樣。");
    }
  }, 10000);

  let vocabList = '';
  try {
    vocabList = window.D ? window.D.map(d => d.w).join(', ') : '';
  } catch (e) {
    vocabList = '';
  }

  // Normalize input: accept either data URL or base64
  const imageDataUrl = (typeof croppedBase64OrDataUrl === 'string' && croppedBase64OrDataUrl.startsWith('data:'))
    ? croppedBase64OrDataUrl
    : `data:image/jpeg;base64,${croppedBase64OrDataUrl}`;

  for (const model of models) {
    if (!window.isAnalyzing) break;

    if (loadingMsg) {
      try {
        loadingMsg.innerHTML = `<span class="thinking-anim">🧠</span> 分析緊... (${model.split('/')[1]})`;
      } catch (e) { /* ignore */ }
    }

    // per-request abort controller + timeout
    const aborter = new AbortController();
    window.currentAborter = aborter;
    const REQUEST_TIMEOUT = 30000; // 30s per model
    const reqTimeoutId = setTimeout(() => {
      try { aborter.abort(); } catch (e) { /* ignore */ }
    }, REQUEST_TIMEOUT);

    // wire cancel button to abort this fetch
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        try { aborter.abort(); } catch (e) { /* ignore */ }
        window.isAnalyzing = false;
        if (loadingMsg) loadingMsg.style.display = 'none';
        safeDisplay('camera-controls', 'flex');
      };
    }

    try {
      const payload = {
        model: model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Identify the object in this image. If it is one of these: [${vocabList}], use that word. Otherwise, provide a simple 1-word noun. Reply with ONLY the single noun (one word).`
              },
              {
                type: "image_url",
                image_url: { url: imageDataUrl }
              }
            ]
          }
        ]
      };

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: aborter.signal
      });

      clearTimeout(reqTimeoutId);

      if (!response.ok) {
        const txt = await response.text().catch(() => '');
        console.warn(`${model} returned ${response.status}:`, txt);
        // try next model
        continue;
      }

      const data = await response.json().catch(() => null);
      if (!data) {
        console.warn(`${model} returned invalid JSON`);
        continue;
      }

      // OpenRouter / chat response shape can differ: handle string or array
      let rawContent = '';
      try {
        const choice = data.choices && data.choices[0];
        if (choice && choice.message) {
          const msgContent = choice.message.content;
          if (typeof msgContent === 'string') rawContent = msgContent;
          else if (Array.isArray(msgContent)) {
            // join any text parts
            rawContent = msgContent.map(p => (p && (p.text || p)).toString()).join(' ');
          } else if (typeof msgContent === 'object') {
            rawContent = JSON.stringify(msgContent);
          }
        } else if (data.output) {
          rawContent = Array.isArray(data.output) ? data.output.join(' ') : (data.output.text || String(data.output));
        } else {
          rawContent = JSON.stringify(data);
        }
      } catch (e) {
        rawContent = '';
      }

      rawContent = (rawContent || '').trim().toLowerCase();

      if (!rawContent) {
        // nothing useful, try next model
        continue;
      }

      // split on Unicode non-letter characters to preserve non-latin words too
      let words = [];
      try {
        // use Unicode property escapes if available
        words = rawContent.split(/[^\p{L}]+/u).filter(w => w && w.length > 0);
      } catch (e) {
        // fallback to ascii split
        words = rawContent.split(/[^a-z]+/).filter(w => w && w.length > 0);
      }

      if (words.length === 0) {
        continue;
      }

      const finalWord = words[words.length - 1];

      if (finalWord && finalWord.length > 0) {
        clearTimeout(cancelTimer);
        window.isAnalyzing = false;
        if (loadingMsg) loadingMsg.innerText = `✨ 搵到喇！係 ${finalWord}！`;

        setTimeout(() => {
          window.closeCamera();

          // 強制恢復寫字 UI，確保唔會卡死
          const appEl = getEl('app');
          if (appEl) appEl.style.display = 'block';
          const topBar = getEl('standard-top-bar');
          if (topBar) topBar.style.display = 'flex';

          if (window.processWord) {
            window.processWord(finalWord, window.lastCapturedImg);
          }
        }, 500);

        // cleanup
        window.currentAborter = null;
        return;
      }

    } catch (err) {
      if (err && err.name === 'AbortError') {
        console.warn(`${model} fetch aborted`);
      } else {
        console.error(`${model} 失敗:`, err);
      }
    } finally {
      clearTimeout(reqTimeoutId);
      // unset currentAborter if still pointing to this aborter
      if (window.currentAborter === window.currentAborter) {
        // keep as-is; we'll set to null on success or after loop
      }
    }
  } // end models loop

  clearTimeout(cancelTimer);
  window.currentAborter = null;

  if (window.isAnalyzing) {
    window.isAnalyzing = false;
    if (window.playCantoneseTTS) window.playCantoneseTTS("哎呀，認唔到呀，不如影過第二樣啦。");
    if (loadingMsg) loadingMsg.innerText = "❌ 認唔到，請重試。";
    setTimeout(() => {
      if (loadingMsg) loadingMsg.style.display = 'none';
      safeDisplay('camera-controls', 'flex');
      safeDisplay('preview-container', 'none');
      const vid = getEl('camera-video');
      if (vid) vid.style.display = 'block';
    }, 2000);
  }
}
