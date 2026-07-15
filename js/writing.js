// ==========================================
// Shared writing session for standard + camera modes
// Keeps chrome, messaging, and letter flow aligned.
// ==========================================

window.WritingSession = {
    mode: 'standard', // 'standard' | 'camera'
    word: null,
    imgUrl: null,

    /** Full mark shown in the progress UI */
    FULL_MARK: 100,

    begin: function (opts) {
        opts = opts || {};
        this.mode = opts.mode || 'standard';
        this.word = opts.word != null ? opts.word : null;
        this.imgUrl = opts.imgUrl != null ? opts.imgUrl : null;
        window.currentMode = this.mode;

        this.applyChrome();

        if (this.word) {
            if (typeof window.processWord === 'function') {
                window.processWord(this.word, this.imgUrl);
            }
        } else if (opts.reset !== false && typeof window.resetCanvas === 'function') {
            window.resetCanvas();
        }

        if (typeof window.startRenderLoop === 'function') {
            window.startRenderLoop();
        }
    },

    /** Show/hide mode-specific controls; keep canvas + top bar consistent */
    applyChrome: function () {
        var standardUi = document.getElementById('standard-ui');
        var canvasWrapper = document.getElementById('canvas-wrapper');
        var reCam = document.getElementById('btn-re-cam');
        var topBar = document.getElementById('standard-top-bar');
        var backBtn = document.getElementById('back-to-home-btn');
        var app = document.getElementById('app');

        if (app) app.style.display = 'block';
        if (canvasWrapper) canvasWrapper.style.display = 'block';
        if (topBar) topBar.style.display = 'flex';
        if (backBtn) backBtn.style.display = 'inline-block';

        if (this.mode === 'camera') {
            if (standardUi) standardUi.style.display = 'none';
            if (reCam) {
                reCam.style.display = 'inline-block';
                reCam.onclick = function () {
                    if (window.openCamera) window.openCamera();
                };
            }
        } else {
            if (standardUi) standardUi.style.display = 'block';
            if (reCam) reCam.style.display = 'none';
        }
    },

    isCamera: function () {
        return this.mode === 'camera' || window.currentMode === 'camera';
    },

    /** Progress line while still tracing */
    formatProgressMsg: function (percent, strokeNum) {
        return '完成度: ' + percent + '% / ' + this.FULL_MARK + '%（第 ' + strokeNum + ' 筆）';
    },

    /** Message after a letter is accepted */
    formatSuccessMsg: function (percent) {
        if (this.isCamera()) {
            return '完成度: ' + percent + '% - 撳 ✨ 讀出嚟，或者 📸 再影一個！';
        }
        return '完成度: ' + percent + '% - 真叻！撳 ✨ 讀出嚟啦！';
    },

    /** After magic TTS finishes */
    formatMagicDoneMsg: function () {
        if (this.isCamera()) {
            return '讀完喇！可以撳 📸 再影一個 繼續玩！';
        }
        return '成功！';
    },

    onLetterPassed: function () {
        this.applyChrome();
    }
};
