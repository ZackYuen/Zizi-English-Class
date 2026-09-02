// ==========================================
// Fun layer for age ~5: SFX, VFX, soft BGM
// Pure Web Audio — no asset downloads required
// ==========================================

var ZIZI_MUSIC_VOL = 0.06;

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

    unlock: function () {
        this.ensureCtx();
    },

    isMusicOn: function () { return this._musicOn; },

    ensureMusic: function () {
        this.ensureCtx();
        if (this._musicOn && !this._bgmTimer) this.startMusic();
    },

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
        this._bgmGain.gain.value = ZIZI_MUSIC_VOL;
        this._bgmGain.connect(ctx.destination);

        var melody = [262, 294, 330, 392, 440, 392, 330, 294, 330, 392, 523, 392, 330, 294, 262, 247];
        var bass = [131, 131, 165, 165, 196, 196, 147, 147];
        var self = this;
        this._step = 0;
        this._bgmTimer = setInterval(function () {
            if (!self._musicOn || !self._bgmGain || !self._ctx) return;
            var c = self._ctx;
            var t = c.currentTime;
            var freq = melody[self._step % melody.length];
            var low = bass[Math.floor(self._step / 2) % bass.length];
            self._step++;

            function note(hz, type, vol, dur) {
                var o = c.createOscillator();
                var g = c.createGain();
                o.type = type;
                o.frequency.value = hz;
                g.gain.setValueAtTime(0.0001, t);
                g.gain.exponentialRampToValueAtTime(vol, t + 0.03);
                g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
                o.connect(g);
                g.connect(self._bgmGain);
                o.start(t);
                o.stop(t + dur + 0.02);
            }
            note(freq, 'triangle', 0.38, 0.42);
            if (self._step % 2 === 1) note(low, 'sine', 0.22, 0.55);
        }, 460);
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
            g.linearRampToValueAtTime(ZIZI_MUSIC_VOL, t + Math.max(0.4, seconds || 1.2));
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

    noise: function (dur, vol) {
        if (!this._sfxOn) return;
        var ctx = this.ensureCtx();
        if (!ctx) return;
        var n = Math.max(1, Math.floor(ctx.sampleRate * (dur || 0.12)));
        var buf = ctx.createBuffer(1, n, ctx.sampleRate);
        var data = buf.getChannelData(0);
        for (var i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
        var src = ctx.createBufferSource();
        var g = ctx.createGain();
        src.buffer = buf;
        g.gain.value = vol != null ? vol : 0.08;
        src.connect(g);
        g.connect(ctx.destination);
        src.start();
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
                this.noise(0.08, 0.04);
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
                this.noise(0.16, 0.07);
                this.tone(420, 'sine', 0.18, 0.08);
                break;
            case 'pop':
                this.noise(0.05, 0.07);
                this.tone(980, 'square', 0.06, 0.1);
                break;
            case 'fanfare':
                [523, 659, 784, 1046].forEach(function (f, i) {
                    setTimeout(function () { self.tone(f, 'triangle', 0.28, 0.2); }, i * 100);
                });
                break;
            case 'countdown':
                this.tone(784, 'square', 0.12, 0.16);
                break;
            case 'go':
                this.tone(523, 'triangle', 0.1, 0.18);
                setTimeout(function () { self.tone(784, 'triangle', 0.16, 0.2); }, 70);
                setTimeout(function () { self.tone(1046, 'triangle', 0.22, 0.22); }, 140);
                break;
            case 'tick':
                this.tone(1100, 'square', 0.045, 0.09);
                break;
            case 'combo':
                [659, 784, 988, 1175].forEach(function (f, i) {
                    setTimeout(function () { self.tone(f, 'triangle', 0.14, 0.18); }, i * 60);
                });
                break;
            case 'engine':
                this.noise(0.07, 0.03);
                this.tone(88, 'sawtooth', 0.08, 0.045);
                break;
            case 'slam':
                this.tone(120, 'sine', 0.16, 0.16);
                this.tone(880, 'triangle', 0.1, 0.1);
                break;
            default:
                this.tone(520, 'sine', 0.1, 0.1);
        }
    },

    flash: function (color) {
        var el = document.createElement('div');
        el.className = 'z-fx-flash';
        el.style.background = color || 'rgba(255,255,255,.35)';
        document.body.appendChild(el);
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 280);
    },

    floatScore: function (host, text, kind) {
        var wrap = host || document.body;
        var el = document.createElement('div');
        el.className = 'z-fx-score' + (kind === 'bad' ? ' is-bad' : '');
        el.textContent = text;
        wrap.appendChild(el);
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 900);
    },

    burst: function (host) {
        var wrap = host || document.body;
        var colors = ['#ff6b6b', '#ffc93c', '#2ecc71', '#4dabf7', '#845ef7', '#ff8fab'];
        for (var i = 0; i < 12; i++) {
            var p = document.createElement('span');
            p.className = 'z-fx-bit';
            p.style.left = (38 + Math.random() * 24) + '%';
            p.style.top = (36 + Math.random() * 22) + '%';
            p.style.background = colors[i % colors.length];
            p.style.setProperty('--dx', (Math.random() * 180 - 90) + 'px');
            p.style.setProperty('--dy', (Math.random() * 180 - 110) + 'px');
            wrap.appendChild(p);
            setTimeout((function (el) {
                return function () { if (el.parentNode) el.parentNode.removeChild(el); };
            })(p), 700);
        }
    },

    shake: function (el) {
        if (!el) return;
        el.classList.remove('z-fx-shake');
        void el.offsetWidth;
        el.classList.add('z-fx-shake');
        setTimeout(function () { el.classList.remove('z-fx-shake'); }, 420);
    },

    boomConfetti: function (n) {
        if (typeof confetti !== 'function') return;
        confetti({ particleCount: n || 80, spread: 70, origin: { y: 0.58 } });
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
        this.flash('rgba(255,201,58,.28)');
        this.burst(overlay);
        if (typeof confetti === 'function') {
            confetti({ particleCount: 140, spread: 85, origin: { y: 0.6 } });
            setTimeout(function () {
                confetti({ particleCount: 80, spread: 100, origin: { y: 0.3 }, angle: 60 });
                confetti({ particleCount: 80, spread: 100, origin: { y: 0.3 }, angle: 120 });
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
