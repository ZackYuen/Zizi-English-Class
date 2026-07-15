// ==========================================
// Shared app state (single source of truth)
// Loaded after data.js, before ui/canvas/camera/game/router
// ==========================================

window.currentMode = 'none';
window.idx = 0;
window.isMagic = false;
window.magicStart = 0;
window.fired = false;
window.strokeIdx = 0;
window.doneStrokes = [];
window.curStroke = [];
window.isDrawing = false;
window.currentWPs = [];
window.nextWpIdx = 0;
window.currentPercent = 0;
window.lastCalc = 0;
window.guideData = null;
window.totalGuide = 0;

// Animation loop guard — only one rAF chain should ever run
window._loopStarted = false;

window.cvs = document.getElementById('cvs');
window.ctx = window.cvs
    ? window.cvs.getContext('2d', { willReadFrequently: true })
    : null;

window.offCvs = document.createElement('canvas');
window.offCvs.width = 300;
window.offCvs.height = 300;
window.offCtx = window.offCvs.getContext('2d', { willReadFrequently: true });

window.userCvs = document.createElement('canvas');
window.userCvs.width = 300;
window.userCvs.height = 300;
window.userCtx = window.userCvs.getContext('2d', { willReadFrequently: true });

// Created on first user gesture (Safari requires this)
window.aCtx = null;
window.mAudio = new Audio();
window.imgCache = {};

window.ensureAudioContext = function () {
    if (window.aCtx) {
        if (window.aCtx.state === 'suspended') {
            window.aCtx.resume().catch(function () { /* ignore */ });
        }
        return window.aCtx;
    }
    try {
        var Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        window.aCtx = new Ctx();
        // Unlock with a silent blip on iOS
        window.mAudio.src =
            'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        window.mAudio.play().catch(function () { /* ignore */ });
        return window.aCtx;
    } catch (e) {
        console.log('Web Audio API not supported', e);
        return null;
    }
};

window.startRenderLoop = function () {
    if (window._loopStarted) return;
    if (typeof window.loop !== 'function') return;
    window._loopStarted = true;
    requestAnimationFrame(window.loop);
};
