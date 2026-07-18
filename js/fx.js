// ==========================================
// Fun layer for age ~5: SFX, soft BGM, big celebrations
// Pure Web Audio — no asset downloads required
// ==========================================

window.ZiziFX = {
    _ctx: null,
    _bgmTimer: null,
    _bgmGain: null,
    _musicOn: localStorage.getItem('zizi_music') !== '0',
    _sfxOn: localStorage.getItem('zizi_sfx') !== '0',
    _step: 0,

    ensureCtx: function () {
        if (!this._ctx) {
            var AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            this._ctx = new AC();
        }
        if (this._ctx.state === 'suspended') {
            try { this._ctx.resume(); } catch (e) { /* ignore */ }
        }
        return this._ctx;
    },

    isMusicOn: function () { return this._musicOn; },

    setMusicOn: function (on) {
        this._musicOn = !!on;
        localStorage.setItem('zizi_music', this._musicOn ? '1' : '0');
        if (this._musicOn) this.startMusic();
        else this.stopMusic();
        this.syncMusicButton();
    },

    toggleMusic: function () {
        this.setMusicOn(!this._musicOn);
        this.play(this._musicOn ? 'tap' : 'whoosh');
        return this._musicOn;
    },

    syncMusicButton: function () {
        var btn = document.getElementById('btn-music-toggle');
        if (!btn) return;
        btn.textContent = this._musicOn ? '🎵 音樂開' : '🔇 音樂關';
        btn.setAttribute('aria-pressed', this._musicOn ? 'true' : 'false');
    },

    /** Soft pentatonic loop — cheerful, not loud */
    startMusic: function () {
        if (!this._musicOn) return;
        var ctx = this.ensureCtx();
        if (!ctx) return;
        this.stopMusic(true);
        this._bgmGain = ctx.createGain();
        this._bgmGain.gain.value = 0.045;
        this._bgmGain.connect(ctx.destination);

        var notes = [262, 294, 330, 392, 440, 392, 330, 294];
        var self = this;
        this._step = 0;
        this._bgmTimer = setInterval(function () {
            if (!self._musicOn || !self._bgmGain || !self._ctx) return;
            var c = self._ctx;
            var t = c.currentTime;
            var freq = notes[self._step % notes.length];
            self._step++;
            var o = c.createOscillator();
            var g = c.createGain();
            o.type = 'triangle';
            o.frequency.value = freq;
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(0.35, t + 0.03);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
            o.connect(g);
            g.connect(self._bgmGain);
            o.start(t);
            o.stop(t + 0.45);
        }, 480);
    },

    stopMusic: function (keepFlag) {
        if (this._bgmTimer) {
            clearInterval(this._bgmTimer);
            this._bgmTimer = null;
        }
        if (this._bgmGain) {
            try { this._bgmGain.disconnect(); } catch (e) { /* ignore */ }
            this._bgmGain = null;
        }
        if (!keepFlag) { /* flag unchanged */ }
    },

    duckMusic: function (seconds) {
        if (!this._bgmGain) return;
        var ctx = this._ctx;
        if (!ctx) return;
        var g = this._bgmGain.gain;
        var t = ctx.currentTime;
        try {
            g.cancelScheduledValues(t);
            g.setValueAtTime(g.value, t);
            g.linearRampToValueAtTime(0.012, t + 0.08);
            g.linearRampToValueAtTime(0.045, t + Math.max(0.4, seconds || 1.2));
        } catch (e) { /* ignore */ }
    },

    tone: function (freq, type, dur, vol) {
        if (!this._sfxOn) return;
        var ctx = this.ensureCtx();
        if (!ctx) return;
        var t = ctx.currentTime;
        var o = ctx.createOscillator();
        var g = ctx.createGain();
        o.type = type || 'sine';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol != null ? vol : 0.22, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.25));
        o.connect(g);
        g.connect(ctx.destination);
        o.start(t);
        o.stop(t + (dur || 0.25) + 0.02);
    },

    play: function (name) {
        var self = this;
        switch (name) {
            case 'tap':
                this.tone(660, 'sine', 0.08, 0.12);
                break;
            case 'correct':
                this.tone(523, 'triangle', 0.12, 0.18);
                setTimeout(function () { self.tone(784, 'triangle', 0.18, 0.2); }, 90);
                break;
            case 'wrong':
                this.tone(180, 'sawtooth', 0.22, 0.1);
                break;
            case 'star':
                [659, 784, 988, 1319].forEach(function (f, i) {
                    setTimeout(function () { self.tone(f, 'sine', 0.16, 0.16); }, i * 70);
                });
                break;
            case 'levelup':
                [392, 523, 659, 784, 1046].forEach(function (f, i) {
                    setTimeout(function () { self.tone(f, 'triangle', 0.2, 0.18); }, i * 90);
                });
                break;
            case 'whoosh':
                this.tone(420, 'sine', 0.15, 0.08);
                break;
            case 'pop':
                this.tone(880, 'square', 0.06, 0.08);
                break;
            case 'fanfare':
                [523, 659, 784, 1046].forEach(function (f, i) {
                    setTimeout(function () { self.tone(f, 'triangle', 0.28, 0.2); }, i * 100);
                });
                break;
            default:
                this.tone(520, 'sine', 0.1, 0.1);
        }
    },

    /**
     * Big kid celebration overlay
     * @param {{emoji?:string, title?:string, sub?:string, stars?:number, onDone?:Function}} opts
     */
    celebrate: function (opts) {
        opts = opts || {};
        var overlay = document.getElementById('celebrate-overlay');
        if (!overlay) return;
        var emoji = document.getElementById('celebrate-emoji');
        var title = document.getElementById('celebrate-title');
        var sub = document.getElementById('celebrate-sub');
        var stars = document.getElementById('celebrate-stars');

        if (emoji) emoji.textContent = opts.emoji || '🌟';
        if (title) title.textContent = opts.title || '叻仔！';
        if (sub) sub.textContent = opts.sub || '';
        if (stars) {
            var n = opts.stars || 0;
            stars.textContent = n > 0 ? ('+' + n + ' ⭐') : '';
            stars.style.display = n > 0 ? 'block' : 'none';
        }

        overlay.style.display = 'flex';
        overlay.classList.add('is-open');
        this.play(opts.stars ? 'star' : 'fanfare');
        if (typeof confetti === 'function') {
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            setTimeout(function () {
                confetti({ particleCount: 70, spread: 100, origin: { y: 0.3 }, angle: 60 });
                confetti({ particleCount: 70, spread: 100, origin: { y: 0.3 }, angle: 120 });
            }, 200);
        }

        overlay._onDone = typeof opts.onDone === 'function' ? opts.onDone : null;
    },

    closeCelebrate: function () {
        var overlay = document.getElementById('celebrate-overlay');
        if (!overlay) return;
        overlay.style.display = 'none';
        overlay.classList.remove('is-open');
        var done = overlay._onDone;
        overlay._onDone = null;
        this.play('tap');
        if (done) done();
    }
};

window.toggleZiziMusic = function () {
    if (window.unlockAudio) window.unlockAudio();
    return window.ZiziFX.toggleMusic();
};

window.closeCelebrate = function () {
    window.ZiziFX.closeCelebrate();
};

// Start soft music after first user gesture (iOS)
document.addEventListener('pointerdown', function ziziMusicBoot() {
    document.removeEventListener('pointerdown', ziziMusicBoot);
    if (window.ZiziFX) {
        window.ZiziFX.ensureCtx();
        window.ZiziFX.syncMusicButton();
        if (window.ZiziFX.isMusicOn()) window.ZiziFX.startMusic();
    }
}, { once: true, passive: true });

window.addEventListener('load', function () {
    if (window.ZiziFX) window.ZiziFX.syncMusicButton();
});
