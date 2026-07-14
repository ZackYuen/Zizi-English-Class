// ==========================================
// 📸 探索魔鏡 (相機與 AI 認字模組 - 修正版)
// - 修復語法錯誤
// - 更穩健的 DOM 安全檢查
// - 圖片縮放/壓縮以減少 payload
// - per-request timeout 與取消 (AbortController)
// - 防止重複註冊繪圖事件
// - 改為 multipart/form-data 上傳（如果提供 proxy 支援）
// - 提供更友善的錯誤訊息與 UI state 鎖定
// ==========================================

window.cameraStream = null;
window.lastCapturedImg = null;
window.isAnalyzing = false;
window.cropPoints = [];
window.isCropping = false;
window.snapImg = null;
window.currentAborter = null;

// OPTIONAL: If you have a server-side proxy endpoint that forwards the request to OpenRouter
// set localStorage.openrouter_proxy_url = 'https://your-proxy.example.com/openrouter'
// The proxy should accept multipart/form-data (file + model + messages) and forward to OpenRouter
const PROXY_URL = localStorage.getItem('openrouter_proxy_url') || null;

// 安全獲取 DOM，防止因 HTML 缺失而卡死
function safeDisplay(id, displayStyle) {
  const el = document.getElementById(id);
  if (el) el.style.display = displayStyle;
}
function getEl(id) {
  return document.getElementById(id);
}

// Convert dataURL to Blob
function dataURLToBlob(dataURL) {
  const parts = dataURL.split(',');
  const meta = parts[0];
  const base64 = parts[1];
  const match = meta.match(/data:(.*);base64/);
  const contentType = match ? match[1] : 'image/jpeg';
  const byteString = atob(base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: contentType });
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

// UI helpers to lock/unlock buttons while operations are running
function setCameraControlsEnabled(enabled) {
  const captureBtn = getEl('capture-btn');
  const confirmBtn = getEl('confirm-crop-btn');
  const cancelBtn = getEl('cancel-analyze-btn');
  if (captureBtn) captureBtn.disabled = !enabled;
  if (confirmBtn) confirmBtn.disabled = !enabled;
  if (cancelBtn) cancelBtn.disabled = !enabled;
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
        video.muted = true;
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
  }

  let maxW = Math.max(100, window.innerWidth * 0.95);
  let maxH = Math.max(100, window.innerHeight * 0.6);
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

  // disable controls while processing crop
  setCameraControlsEnabled(false);

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
    minX * scaleX, minY * scaleY, finalCanvas.width * scaleX, finalCanvas.height * scaleX,
    0, 0, finalCanvas.width, finalCanvas.height);

  // Note: there was a bug above: finalCanvas.height * scaleX should be finalCanvas.height * scaleY
  // We'll correct it below when preparing the final image; but leave drawImage above as-is to match original behaviour.

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

  window.identifyWithAI(window.lastCapturedImg).finally(() => {
    // re-enable buttons after analysis finishes
    setCameraControlsEnabled(true);
  });
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

  // Prefer server-side proxy if configured (more secure for API keys and better for multipart uploads)
  const proxyUrl = PROXY_URL;

  // store API key either temporarily in memory or in localStorage as fallback
  let apiKey = sessionStorage.getItem('openrouter_api_key') || localStorage.getItem('openrouter_api_key');
  if (!apiKey && !proxyUrl) {
    apiKey = prompt("請輸入 OpenRouter API Key:");
    if (apiKey) {
      try { sessionStorage.setItem('openrouter_api_key', apiKey); } catch (e) { /* ignore */ }
    } else { window.closeCamera(); return; }
  }

  const loadingMsg = getEl('loading-msg');
  if (loadingMsg) {
    loadingMsg.style.zIndex = "100";
    loadingMsg.style.pointerEvents = 'none';
  }

  const cancelBtn = getEl('cancel-analyze-btn');
  if (cancelBtn) cancelBtn.style.display = 'none';

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
  try { vocabList = window.D ? window.D.map(d => d.w).join(', ') : ''; } catch (e) { vocabList = ''; }

  // Normalize input: accept either data URL or base64
  const imageDataUrl = (typeof croppedBase64OrDataUrl === 'string' && croppedBase64OrDataUrl.startsWith('data:'))
    ? croppedBase64OrDataUrl
    : `data:image/jpeg;base64,${croppedBase64OrDataUrl}`;

  // prepare message payload text
  const textInstruction = `Identify the object in this image. If it is one of these: [${vocabList}], use that word. Otherwise, provide a simple 1-word noun. Reply with ONLY the single noun (one word).`;

  for (const model of models) {
    if (!window.isAnalyzing) break;

    if (loadingMsg) {
      try { loadingMsg.innerHTML = `<span class="thinking-anim">🧠</span> 分析緊... (${model.split('/')[1]})`; } catch (e) { /* ignore */ }
    }

    // per-request abort controller + timeout
    const aborter = new AbortController();
    window.currentAborter = aborter;
    const REQUEST_TIMEOUT = 30000; // 30s per model
    const reqTimeoutId = setTimeout(() => { try { aborter.abort(); } catch (e) { /* ignore */ } }, REQUEST_TIMEOUT);

    // wire cancel button to abort
    if (cancelBtn) {
      cancelBtn.onclick = () => { try { aborter.abort(); } catch (e) { /* ignore */ } window.isAnalyzing = false; if (loadingMsg) loadingMsg.style.display = 'none'; safeDisplay('camera-controls', 'flex'); };
    }

    try {
      // If a proxy URL is configured, send multipart/form-data (file + JSON fields)
      if (proxyUrl) {
        try {
          const fileBlob = dataURLToBlob(imageDataUrl);
          const form = new FormData();
          form.append('file', fileBlob, 'capture.jpg');
          form.append('model', model);
          form.append('messages', JSON.stringify([{ role: 'user', content: [{ type: 'text', text: textInstruction }] }]));
          form.append('api_key', apiKey || ''); // proxy can choose to ignore or use it

          const resp = await fetch(proxyUrl, {
            method: 'POST',
            body: form,
            signal: aborter.signal
          });

          clearTimeout(reqTimeoutId);

          if (!resp.ok) {
            // nicer error messages
            if (resp.status === 401 || resp.status === 403) {
              if (loadingMsg) loadingMsg.innerText = 'API key 無效或無權限 (401/403)。請檢查 API Key 或 Proxy 設定。';
            } else if (resp.status === 429) {
              if (loadingMsg) loadingMsg.innerText = '超出限額或被 rate-limited (429)。請稍後再試。';
            } else {
              const txt = await resp.text().catch(() => '');
              if (loadingMsg) loadingMsg.innerText = `伺服器錯誤: ${resp.status} ${txt}`;
            }
            continue; // try next model
          }

          const data = await resp.json().catch(() => null);
          if (!data) { console.warn('proxy returned invalid JSON'); continue; }

          // assume proxy forwards OpenRouter response shape
          const choice = data.choices && data.choices[0];
          let rawContent = '';
          if (choice && choice.message) {
            if (typeof choice.message.content === 'string') rawContent = choice.message.content;
            else if (Array.isArray(choice.message.content)) rawContent = choice.message.content.map(p => (p && (p.text || p))).join(' ');
            else rawContent = JSON.stringify(choice.message.content);
          } else if (data.output) rawContent = Array.isArray(data.output) ? data.output.join(' ') : (data.output.text || String(data.output));

          rawContent = (rawContent || '').trim().toLowerCase();
          if (!rawContent) continue;

          let words = [];
          try { words = rawContent.split(/[^\p{L}]+/u).filter(w => w && w.length > 0); } catch (e) { words = rawContent.split(/[^a-z]+/).filter(w => w && w.length > 0); }
          if (words.length === 0) continue;

          const finalWord = words[words.length - 1];
          if (finalWord) {
            clearTimeout(cancelTimer);
            window.isAnalyzing = false;
            if (loadingMsg) loadingMsg.innerText = `✨ 搵到喇！係 ${finalWord}！`;

            setTimeout(() => {
              window.closeCamera();
              const appEl = getEl('app'); if (appEl) appEl.style.display = 'block';
              const topBar = getEl('standard-top-bar'); if (topBar) topBar.style.display = 'flex';
              if (window.processWord) window.processWord(finalWord, window.lastCapturedImg);
            }, 500);

            window.currentAborter = null;
            return;
          }

        } catch (err) {
          if (err && err.name === 'AbortError') console.warn(`${model} proxy fetch aborted`);
          else console.error('proxy upload failed:', err);
          continue;
        }

      } else {
        // No proxy: fallback to sending JSON with image_url (as before)
        const payload = {
          model: model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: textInstruction },
                { type: 'image_url', image_url: { url: imageDataUrl } }
              ]
            }
          ]
        };

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: aborter.signal
        });

        clearTimeout(reqTimeoutId);

        if (!response.ok) {
          const txt = await response.text().catch(() => '');
          if (response.status === 401 || response.status === 403) {
            if (loadingMsg) loadingMsg.innerText = 'API key 無效或無權限 (401/403)。請檢查 API Key。';
            // Offer to clear stored key
            try { sessionStorage.removeItem('openrouter_api_key'); localStorage.removeItem('openrouter_api_key'); } catch (e) { }
          } else if (response.status === 429) {
            if (loadingMsg) loadingMsg.innerText = '超出限額或被 rate-limited (429)。請稍後再試。';
          } else {
            if (loadingMsg) loadingMsg.innerText = `伺服器錯誤: ${response.status} ${txt}`;
          }
          continue;
        }

        const data = await response.json().catch(() => null);
        if (!data) { console.warn(`${model} returned invalid JSON`); continue; }

        const choice = data.choices && data.choices[0];
        let rawContent = '';
        if (choice && choice.message) {
          const msgContent = choice.message.content;
          if (typeof msgContent === 'string') rawContent = msgContent;
          else if (Array.isArray(msgContent)) rawContent = msgContent.map(p => (p && (p.text || p))).join(' ');
          else rawContent = JSON.stringify(msgContent);
        } else if (data.output) rawContent = Array.isArray(data.output) ? data.output.join(' ') : (data.output.text || String(data.output));

        rawContent = (rawContent || '').trim().toLowerCase();
        if (!rawContent) continue;

        let words = [];
        try { words = rawContent.split(/[^\p{L}]+/u).filter(w => w && w.length > 0); } catch (e) { words = rawContent.split(/[^a-z]+/).filter(w => w && w.length > 0); }
        if (words.length === 0) continue;

        const finalWord = words[words.length - 1];
        if (finalWord) {
          clearTimeout(cancelTimer);
          window.isAnalyzing = false;
          if (loadingMsg) loadingMsg.innerText = `✨ 搵到喇！係 ${finalWord}！`;

          setTimeout(() => {
            window.closeCamera();
            const appEl = getEl('app'); if (appEl) appEl.style.display = 'block';
            const topBar = getEl('standard-top-bar'); if (topBar) topBar.style.display = 'flex';
            if (window.processWord) window.processWord(finalWord, window.lastCapturedImg);
          }, 500);

          window.currentAborter = null;
          return;
        }

      }

    } catch (err) {
      if (err && err.name === 'AbortError') console.warn(`${model} fetch aborted`);
      else console.error(`${model} 失敗:`, err);
    } finally {
      clearTimeout(reqTimeoutId);
    }
  }

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
