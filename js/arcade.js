// ==========================================
// Shared arcade layer: SFX, vocab lookup, tracing race
// Stars go through awardStars so home progress stays in sync.
// ==========================================

window.Arcade = {
    lookup: function (word) {
        var w = String(word || '').trim().toLowerCase();
        var list = window.D || [];
        for (var i = 0; i < list.length; i++) {
            if (list[i] && list[i].w === w) return list[i];
        }
        var letter = (w.charAt(0) || '?').toUpperCase();
        return {
            l: letter,
            w: w,
            emoji: '⭐',
            st: (window.letterStrokes && window.letterStrokes[letter]) || []
        };
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

    addStars: function (n, meta) {
        if (typeof window.awardStars !== 'function') return;
        var info = meta || {};
        window.awardStars(n, {
            word: info.word,
            emoji: info.emoji,
            letter: info.letter,
            reason: info.reason || '遊戲',
            quest: info.quest
        });
    },

    pop: function () {
        if (window.ZiziFX) window.ZiziFX.play('correct');
        else if (window.playSnd) {
            window.playSnd(920, 'square', 0.12);
            setTimeout(function () { if (window.playSnd) window.playSnd(1240, 'sine', 0.1); }, 70);
        }
    },

    boom: function () {
        if (window.ZiziFX) window.ZiziFX.play('wrong');
        else if (window.playSnd) window.playSnd(180, 'sawtooth', 0.18);
    },

    winFanfare: function () {
        if (window.ZiziFX) window.ZiziFX.play('fanfare');
        if (typeof confetti === 'function') {
            confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } });
        }
        [523, 659, 784, 1046].forEach(function (f, i) {
            setTimeout(function () { if (window.playSnd) window.playSnd(f, 'triangle', 0.28); }, i * 90);
        });
    },

    say: function (text) {
        if (window.playCantoneseTTS) {
            try {
                var p = window.playCantoneseTTS(text, { interrupt: true });
                if (p && typeof p.then === 'function') return p;
            } catch (e) { /* ignore */ }
        }
        return Promise.resolve();
    },

    speakEnglish: function (word) {
        if (window.speakEnglish) return window.speakEnglish(word, { rate: 0.88 });
        return Promise.resolve();
    },

    raceKid: 0,
    raceTurtle: 0,
    raceTimer: null,
    raceTotal: 1,
    raceWon: false,

    startRace: function () {
        this.stopRace();
        this.raceKid = 0;
        this.raceTurtle = 0;
        this.raceWon = false;
        var total = 3;
        if (typeof D !== 'undefined' && typeof idx !== 'undefined' && D[idx] && D[idx].st) {
            total = Math.max(1, D[idx].st.length);
        }
        this.raceTotal = total;
        this.paintRace(true);
        var self = this;
        this.raceTimer = setInterval(function () {
            if (window.currentMode !== 'standard' && window.currentMode !== 'camera') return;
            self.raceTurtle = Math.min(100, self.raceTurtle + (100 / (total * 14)));
            self.paintRace(true);
            if (self.raceTurtle >= 100 && self.raceKid < 100 && !self.raceWon) {
                self.stopRace();
                var msg = document.getElementById('msg');
                if (msg) {
                    if (window.setSilentMsg) window.setSilentMsg('🐢 烏龜贏咗！再畫快啲！', '#e63946');
                    else {
                        msg.innerText = '🐢 烏龜贏咗！再畫快啲！';
                        msg.style.color = '#e63946';
                    }
                }
                self.say('烏龜贏咗！再畫多次啦！');
            }
        }, 400);
    },

    stopRace: function () {
        if (this.raceTimer) {
            clearInterval(this.raceTimer);
            this.raceTimer = null;
        }
    },

    hideRace: function () {
        this.stopRace();
        this.raceKid = 0;
        this.raceTurtle = 0;
        this.paintRace(false);
    },

    onStrokeDone: function () {
        if (window.currentMode !== 'standard' && window.currentMode !== 'camera') return;
        var total = this.raceTotal || 1;
        var done = (typeof strokeIdx === 'number') ? strokeIdx : 0;
        this.raceKid = Math.min(100, Math.round((done / total) * 100));
        this.paintRace(true);
        if (this.raceKid >= 100 && this.raceTurtle < 100 && !this.raceWon) {
            this.raceWon = true;
            this.stopRace();
            this.winFanfare();
            var msg = document.getElementById('msg');
            if (msg) {
                if (window.setSilentMsg) window.setSilentMsg('🏎️ 賽車贏咗！撳 ✨ 讀出嚟！', '#06d6a0');
                else {
                    msg.innerText = '🏎️ 賽車贏咗！撳 ✨ 讀出嚟！';
                    msg.style.color = '#06d6a0';
                }
            }
            this.say('賽車贏咗！撳綠色魔術掣聽英文！');
        }
    },

    paintRace: function (show) {
        var track = document.getElementById('race-track');
        var kid = document.getElementById('racer-kid');
        var turtle = document.getElementById('racer-turtle');
        if (track) {
            if (show === false) track.classList.add('is-idle');
            else track.classList.remove('is-idle');
        }
        if (kid) kid.style.left = Math.min(88, this.raceKid) + '%';
        if (turtle) turtle.style.left = Math.min(88, this.raceTurtle) + '%';
    }
};
