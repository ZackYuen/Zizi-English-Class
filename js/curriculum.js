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
        var idx = gi != null ? gi : this.groupIndex();
        var letters = [];
        var seen = {};
        for (var i = 0; i <= idx && i < groups.length; i++) {
            var g = groups[i];
            var ls = (g && g.letters) ? g.letters : [];
            for (var j = 0; j < ls.length; j++) {
                if (seen[ls[j]]) continue;
                seen[ls[j]] = true;
                letters.push(ls[j]);
            }
        }
        return letters.length ? letters : ['S', 'A', 'T', 'I', 'P', 'N'];
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

    _recent: [],

    remember: function (words) {
        var self = this;
        (words || []).forEach(function (w) {
            var key = String(typeof w === 'string' ? w : (w && w.w) || '').toLowerCase();
            if (!key) return;
            self._recent.push(key);
        });
        if (this._recent.length > 28) this._recent = this._recent.slice(-28);
    },

    pickLesson: function (n, except) {
        except = except || [];
        var gi = this.groupIndex();
        var primary = this.shuffle(this.wordsForGroup(gi));
        var extra = this.shuffle(this.pool());
        var out = [];
        var seen = {};
        except.forEach(function (w) { seen[String(w).toLowerCase()] = true; });
        var recent = {};
        this._recent.forEach(function (w) { recent[String(w).toLowerCase()] = true; });
        var self = this;
        function take(list, skipRecent) {
            for (var i = 0; i < list.length && out.length < n; i++) {
                var item = list[i];
                if (!item || seen[item.w]) continue;
                if (skipRecent && recent[item.w]) continue;
                seen[item.w] = true;
                out.push(item);
            }
        }
        take(primary, true);
        take(extra, true);
        if (out.length < n) take(primary, false);
        if (out.length < n) take(extra, false);
        this.remember(out);
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
        word = String(word || '').toLowerCase();
        var s = window.WORD_STORIES && window.WORD_STORIES[word];
        if (s && s.yue) return s.yue;
        var list = window.D || [];
        for (var i = 0; i < list.length; i++) {
            if (list[i] && list[i].w === word && list[i].yue) return list[i].yue;
        }
        return '';
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

    speakEn: function (word, opts) {
        opts = opts || {};
        if (window.ZiziFX) window.ZiziFX.duckMusic(3.2);
        if (window.speakEnglish) {
            return window.speakEnglish(word, {
                rate: opts.rate != null ? opts.rate : 0.88,
                interrupt: opts.interrupt !== false
            });
        }
        return Promise.resolve();
    },

    /** Speak English, then wait until both the word AND minMs have finished. */
    afterSpeakEn: function (word, minMs) {
        var started = Date.now();
        var wait = Math.max(0, minMs || 0);
        var self = this;
        return this.voiceCatch(Promise.resolve(this.speakEn(word)).then(function () {
            var left = wait - (Date.now() - started);
            if (left <= 0) return;
            return new Promise(function (resolve) { setTimeout(resolve, left); });
        }));
    },

    /** Skip leftover lines when a newer voice cuts in. */
    voiceCatch: function (p) {
        if (!p || typeof p.catch !== 'function') return p;
        return p.catch(function (err) {
            if (err && err.name === 'AbortError') return;
            throw err;
        });
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
        if (window.ZiziFX) window.ZiziFX.play('tick');
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
            }, 900);
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

    drawWord: function (ctx, item, x, y, s) {
        if (window.ZiziArt) {
            window.ZiziArt.drawWord(ctx, item.w, x, y, s);
            return;
        }
        ctx.font = Math.round(s * 0.7) + 'px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.emoji, x, y);
    },

    wordPic: function (word, cssPx) {
        var size = cssPx || 44;
        if (window.ZiziArt && window.ZiziArt.pictureEl) {
            var el = window.ZiziArt.pictureEl(word, size);
            el.classList.add('stage-pic');
            return el;
        }
        var cvs = document.createElement('canvas');
        cvs.className = 'stage-pic';
        cvs.setAttribute('aria-hidden', 'true');
        var dpr = Math.min(2, window.devicePixelRatio || 1);
        cvs.width = Math.round(size * dpr);
        cvs.height = Math.round(size * dpr);
        cvs.style.width = size + 'px';
        cvs.style.height = size + 'px';
        var ctx = cvs.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (window.ZiziArt) {
            window.ZiziArt.drawWord(ctx, word, size / 2, size / 2, size * 0.9, 0);
        } else {
            var item = this.pool().filter(function (d) { return d.w === word; })[0];
            ctx.font = Math.round(size * 0.72) + 'px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText((item && item.emoji) || '', size / 2, size / 2);
        }
        return cvs;
    },

    fillTarget: function (el, word) {
        if (!el) return;
        el.innerHTML = '';
        el.appendChild(this.wordPic(word, 44));
        var sp = document.createElement('span');
        sp.className = 'stage-word';
        sp.textContent = word;
        el.appendChild(sp);
    },

    stars: function (el, n, total) {
        if (!el) return;
        total = total || 5;
        var s = '';
        for (var i = 0; i < total; i++) s += i < n ? '⭐' : '☆';
        el.textContent = s;
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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.Curriculum;
}
