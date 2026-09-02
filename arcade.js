// ==========================================
// Shared arcade layer: stars, SFX, vocab lookup
// ==========================================

window.Arcade = {
    starsKey: 'zizi_arcade_stars',

    getStars: function () {
        return parseInt(localStorage.getItem(this.starsKey) || '0', 10) || 0;
    },

    addStars: function (n) {
        var next = this.getStars() + (n || 1);
        localStorage.setItem(this.starsKey, String(next));
        this.refreshHud();
        return next;
    },

    refreshHud: function () {
        var nodes = document.querySelectorAll('[data-arcade-stars]');
        for (var i = 0; i < nodes.length; i++) nodes[i].textContent = String(this.getStars());
    },

    lookup: function (word) {
        var w = String(word || '').trim().toLowerCase();
        var list = window.D || [];
        for (var i = 0; i < list.length; i++) {
            if (list[i] && list[i].w === w) return list[i];
        }
        var letter = (w.charAt(0) || '?').toUpperCase();
        return { l: letter, w: w, emoji: '⭐', st: (window.letterStrokes && window.letterStrokes[letter]) || [] };
    },

    randomItems: function (n, exceptWord) {
        var list = (window.D || []).slice();
        var out = [];
        var guard = 0;
        while (out.length < n && guard < 80) {
            guard++;
            var item = list[Math.floor(Math.random() * list.length)];
            if (!item || item.w === exceptWord) continue;
            if (out.some(function (x) { return x.w === item.w; })) continue;
            out.push(item);
        }
        return out;
    },

    pop: function () {
        if (window.playSnd) {
            window.playSnd(920, 'square', 0.12);
            setTimeout(function () { if (window.playSnd) window.playSnd(1240, 'sine', 0.1); }, 70);
        }
    },

    boom: function () {
        if (window.playSnd) window.playSnd(180, 'sawtooth', 0.18);
    },

    winFanfare: function () {
        if (typeof confetti === 'function') {
            confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } });
        }
        [523, 659, 784, 1046].forEach(function (f, i) {
            setTimeout(function () { if (window.playSnd) window.playSnd(f, 'triangle', 0.28); }, i * 90);
        });
    },

    say: function (text) {
        if (window.playCantoneseTTS) window.playCantoneseTTS(text);
    },

    speakEnglish: function (word) {
        var key = localStorage.getItem('google_tts_key');
        if (!key || !word) return Promise.resolve();
        return fetch('https://texttospeech.googleapis.com/v1/text:synthesize?key=' + key, {
            method: 'POST',
            body: JSON.stringify({
                input: { text: String(word) },
                voice: { languageCode: 'en-US', name: 'en-US-Wavenet-F' },
                audioConfig: { audioEncoding: 'MP3', speakingRate: 0.88 }
            })
        }).then(function (res) { return res.json(); }).then(function (data) {
            if (!data.audioContent) return;
            window.enAudio = window.enAudio || new Audio();
            window.enAudio.src = 'data:audio/mp3;base64,' + data.audioContent;
            return window.enAudio.play().catch(function () {});
        }).catch(function () {});
    },

    raceKid: 0,
    raceTurtle: 0,
    raceTimer: null,
    raceTotal: 1,

    startRace: function () {
        this.stopRace();
        this.raceKid = 0;
        this.raceTurtle = 0;
        var total = 3;
        if (typeof D !== 'undefined' && D[window.idx] && D[window.idx].st) {
            total = Math.max(1, D[window.idx].st.length);
        }
        this.raceTotal = total;
        this.paintRace();
        var self = this;
        this.raceTimer = setInterval(function () {
            if (window.currentMode !== 'standard') return;
            self.raceTurtle = Math.min(100, self.raceTurtle + (100 / (total * 14)));
            self.paintRace();
            if (self.raceTurtle >= 100 && self.raceKid < 100) {
                self.stopRace();
                var msg = document.getElementById('msg');
                if (msg) {
                    msg.innerText = '烏龜贏咗！再畫快啲！';
                    msg.style.color = '#e63946';
                }
                if (window.Arcade) window.Arcade.say('烏龜贏咗！再畫多次啦！');
            }
        }, 400);
    },

    stopRace: function () {
        if (this.raceTimer) {
            clearInterval(this.raceTimer);
            this.raceTimer = null;
        }
    },

    onStrokeDone: function () {
        if (window.currentMode !== 'standard') return;
        var total = this.raceTotal || 1;
        var done = (typeof strokeIdx === 'number') ? strokeIdx : 0;
        this.raceKid = Math.min(100, Math.round((done / total) * 100));
        this.paintRace();
        if (this.raceKid >= 100 && this.raceTurtle < 100) {
            this.stopRace();
            if (this.winFanfare) this.winFanfare();
            this.addStars(2);
            var msg = document.getElementById('msg');
            if (msg) {
                msg.innerText = '賽車贏咗！撳 ✨ 變魔術聽英文！';
                msg.style.color = '#06d6a0';
            }
            if (window.playCantoneseTTS) window.playCantoneseTTS('賽車贏咗！撳綠色魔術掣聽英文！');
        }
    },

    paintRace: function () {
        var kid = document.getElementById('racer-kid');
        var turtle = document.getElementById('racer-turtle');
        if (kid) kid.style.left = Math.min(88, this.raceKid) + '%';
        if (turtle) turtle.style.left = Math.min(88, this.raceTurtle) + '%';
    }
};

window.addEventListener('load', function () {
    if (window.Arcade) window.Arcade.refreshHud();
});
