// ==========================================
// Shared English curriculum helpers for the real games
// SATIPN → CKEHRMD → GOULFB → JVWXYZQ  (Jolly-style groups)
// ==========================================

window.Curriculum = {
    pool: function () {
        var list = window.D || [];
        var base = window._baseVocabLen != null ? window._baseVocabLen : list.length;
        return list.slice(0, base).filter(function (d) { return d && d.w && d.emoji; });
    },

    groupIndex: function () {
        var stars = 0;
        try {
            if (window.getProgress) stars = window.getProgress().stars || 0;
        } catch (e) { stars = 0; }
        var groups = window.phonicsGroups || [];
        if (!groups.length) return 0;
        return Math.min(groups.length - 1, Math.floor(stars / 12));
    },

    groupLetters: function (gi) {
        var groups = window.phonicsGroups || [];
        var g = groups[gi != null ? gi : this.groupIndex()] || groups[0];
        return (g && g.letters) ? g.letters.slice() : ['S', 'A', 'T', 'I', 'P', 'N'];
    },

    groupName: function (gi) {
        var groups = window.phonicsGroups || [];
        var g = groups[gi != null ? gi : this.groupIndex()] || groups[0];
        return g ? g.name : '第 1 組';
    },

    wordsForGroup: function (gi) {
        var letters = this.groupLetters(gi);
        var pool = this.pool().filter(function (d) { return letters.indexOf(d.l) !== -1; });
        return pool.length ? pool : this.pool();
    },

    shuffle: function (arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    },

    pickLesson: function (n, except) {
        except = except || [];
        var gi = this.groupIndex();
        var primary = this.shuffle(this.wordsForGroup(gi));
        var extra = this.shuffle(this.pool());
        var out = [];
        var seen = {};
        except.forEach(function (w) { seen[String(w).toLowerCase()] = true; });
        function take(list) {
            for (var i = 0; i < list.length && out.length < n; i++) {
                var item = list[i];
                if (!item || seen[item.w]) continue;
                seen[item.w] = true;
                out.push(item);
            }
        }
        take(primary);
        take(extra);
        return out;
    },

    decoys: function (item, n) {
        var same = this.pool().filter(function (d) { return d.w !== item.w && d.l === item.l; });
        var rest = this.pool().filter(function (d) { return d.w !== item.w; });
        var mixed = this.shuffle(same.concat(this.shuffle(rest)));
        var out = [];
        var seen = {};
        for (var i = 0; i < mixed.length && out.length < n; i++) {
            if (seen[mixed[i].w]) continue;
            seen[mixed[i].w] = true;
            out.push(mixed[i]);
        }
        return out;
    },

    yue: function (word) {
        var s = window.WORD_STORIES && window.WORD_STORIES[String(word || '').toLowerCase()];
        return s && s.yue ? s.yue : '';
    },

    info: function (word) {
        if (window.ZiziTeach && window.ZiziTeach.info) return window.ZiziTeach.info(word);
        return { word: word, yue: this.yue(word), loan: '', parts: [], story: '' };
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

    speakEn: function (word) {
        if (window.ZiziFX) window.ZiziFX.duckMusic(1.8);
        if (window.speakEnglish) return window.speakEnglish(word, { rate: 0.88 });
        return Promise.resolve();
    },

    bootFx: function () {
        if (window.unlockAudio) window.unlockAudio();
        if (!window.ZiziFX) return;
        window.ZiziFX.unlock();
        window.ZiziFX.ensureMusic();
        this._lastWarnSec = null;
    },

    startFx: function () {
        this.bootFx();
        if (window.ZiziFX) window.ZiziFX.play('whoosh');
    },

    countFx: function (n) {
        if (window.ZiziFX) window.ZiziFX.play(n > 0 ? 'countdown' : 'go');
    },

    tapFx: function () {
        if (window.ZiziFX) window.ZiziFX.play('tap');
        else this.pop();
    },

    hitFx: function (host, pts, combo) {
        if (window.ZiziFX) {
            window.ZiziFX.play(combo >= 2 ? 'combo' : 'correct');
            window.ZiziFX.flash('rgba(46,204,113,.20)');
            if (host && pts) window.ZiziFX.floatScore(host, '+' + pts, 'good');
            if (combo >= 2) window.ZiziFX.burst(host);
            window.ZiziFX.boomConfetti(combo >= 3 ? 90 : 55);
        } else {
            this.pop();
        }
    },

    popBalloon: function (host, pts, combo) {
        if (window.ZiziFX) {
            window.ZiziFX.play('pop');
            var fx = this;
            setTimeout(function () { fx.hitFx(host, pts, combo); }, 40);
        } else {
            this.pop();
        }
    },

    missFx: function (host, label) {
        this.boom();
        if (window.ZiziFX) {
            window.ZiziFX.shake(host);
            window.ZiziFX.flash('rgba(255,80,80,.22)');
            if (host) window.ZiziFX.floatScore(host, label || '-time', 'bad');
        }
    },

    warnLowTime: function (seconds, overlay) {
        var sec = Math.ceil(seconds);
        if (sec > 10 || sec < 1) {
            if (overlay) overlay.classList.remove('is-urgent');
            if (sec > 10) this._lastWarnSec = null;
            return;
        }
        if (this._lastWarnSec === sec) return;
        this._lastWarnSec = sec;
        if (overlay) overlay.classList.add('is-urgent');
        if (window.ZiziFX) {
            window.ZiziFX.play('tick');
            if (sec <= 5) window.ZiziFX.flash('rgba(255,90,95,.16)');
        }
    },

    finishFx: function (opts) {
        opts = opts || {};
        if (window.ZiziFX && window.ZiziFX.celebrate) {
            window.ZiziFX.celebrate({
                emoji: opts.emoji || '🌟',
                title: opts.title || '太棒了！',
                sub: opts.sub || '',
                stars: opts.stars || 0
            });
        } else {
            this.win();
        }
    },

    cheer: function (word, coachId) {
        var el = typeof coachId === 'string' ? document.getElementById(coachId) : coachId;
        if (window.ZiziTeach && window.ZiziTeach.showWordStory && el) {
            window.ZiziTeach.showWordStory(word, el, { speak: false });
        }
        var yue = this.yue(word);
        var talk = this.speakEn(word).then(function () {
            if (yue) return Curriculum.say(word + '！' + yue);
        });
        return new Promise(function (resolve) {
            setTimeout(function () {
                if (el && window.ZiziTeach) window.ZiziTeach.hideCoach(el);
                resolve();
            }, 1800);
        }).then(function () { return talk; });
    },

    teach: function (word, coachId) {
        var self = this;
        return this.speakEn(word).then(function () {
            if (window.ZiziTeach && window.ZiziTeach.showWordStory) {
                return window.ZiziTeach.showWordStory(word, coachId);
            }
            var yue = self.yue(word);
            if (yue) return self.say(word + '，廣東話係 ' + yue);
            return null;
        });
    },

    award: function (stars, meta) {
        if (typeof window.awardStars !== 'function') return;
        window.awardStars(stars, meta || {});
    },

    pop: function () {
        if (window.ZiziFX) window.ZiziFX.play('correct');
        else if (window.playSnd) window.playSnd(920, 'square', 0.12);
    },

    boom: function () {
        if (window.ZiziFX) window.ZiziFX.play('wrong');
        else if (window.playSnd) window.playSnd(180, 'sawtooth', 0.18);
    },

    win: function () {
        if (window.ZiziFX) window.ZiziFX.play('fanfare');
        if (typeof confetti === 'function') {
            confetti({ particleCount: 140, spread: 80, origin: { y: 0.55 } });
        }
    },

    starsForScore: function (score, good) {
        if (score >= good * 1.2) return 3;
        if (score >= good * 0.7) return 2;
        return 1;
    }
};
