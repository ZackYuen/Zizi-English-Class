// Picture-book companion Zizi made. It is the mascot:
// idle sway everywhere, hop on a right answer, nod on a miss, tap to hear a cheer.
window.ZiziBuddy = {
    POSES: {
        idle: 'img/characters/buddy-idle.png',
        cheer: 'img/characters/buddy-cheer.png',
        comfort: 'img/characters/buddy-comfort.png'
    },
    lines: {
        home: [
            '孜孜，我陪你學英文！',
            '今日都要加油呀！',
            '你做到嘅，孜孜！'
        ],
        hello: ['一齊玩呀孜孜！', '我喺度陪你！'],
        hit: ['叻呀孜孜！', '你真係勁！', '繼續呀孜孜！'],
        spark: ['好呀！', '啱喇孜孜！'],
        miss: ['唔緊要，再試下！', '孜孜得嘅！', '我陪住你！'],
        win: ['孜孜，你真係叻！', '小伙伴幫你歡呼！']
    },
    _i: { home: 1 },
    _last: 0,

    next: function (kind) {
        var list = this.lines[kind] || this.lines.hit;
        var i = this._i[kind] || 0;
        this._i[kind] = (i + 1) % list.length;
        return list[i];
    },

    poseName: function (kind) {
        if (kind === 'miss') return 'comfort';
        if (kind === 'idle') return 'idle';
        return 'cheer';
    },

    setPose: function (kind, holdMs) {
        var pose = this.poseName(kind);
        var src = this.POSES[pose];
        var nodes = document.querySelectorAll('.buddy-pose');
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].getAttribute('src') !== src) nodes[i].src = src;
        }
        document.body.classList.remove('is-buddy-cheer', 'is-buddy-comfort');
        if (pose !== 'idle') {
            void document.body.offsetWidth;
            document.body.classList.add(pose === 'comfort' ? 'is-buddy-comfort' : 'is-buddy-cheer');
        }
        var self = this;
        clearTimeout(this._poseTimer);
        if (pose !== 'idle') {
            this._poseTimer = setTimeout(function () { self.setPose('idle'); }, holdMs || 1500);
        }
    },

    flashBubbles: function (text) {
        var chips = document.querySelectorAll('.buddy-chip .buddy-bubble');
        for (var i = 0; i < chips.length; i++) {
            chips[i].textContent = text;
            chips[i].hidden = false;
        }
        var home = document.getElementById('buddy-home-line');
        if (home) home.textContent = text;
        var self = this;
        clearTimeout(this._bubbleTimer);
        this._bubbleTimer = setTimeout(function () {
            var nodes = document.querySelectorAll('.buddy-chip .buddy-bubble');
            for (var j = 0; j < nodes.length; j++) nodes[j].hidden = true;
        }, 1700);
    },

    showLine: function (text, speak) {
        this.flashBubbles(text);
        if (speak && window.announce) {
            if (window.unlockAudio) window.unlockAudio();
            window.announce(text, { force: true, interrupt: true });
        }
    },

    poke: function (where) {
        var kind = where === 'home' ? 'home' : 'hit';
        this.setPose(kind);
        this.showLine(this.next(kind), true);
    },

    setAtHome: function (atHome) {
        if (atHome) {
            this.setPose('idle');
            var home = document.getElementById('buddy-home-line');
            if (home) home.textContent = this.lines.home[0];
            return;
        }
        this.flashBubbles(this.next('hello'));
        this.setPose('hello');
    },

    react: function (kind) {
        var now = Date.now();
        if (kind === 'spark' && this._lastKind === 'spark' && this._last && now - this._last < 500) return;
        this._last = now;
        this._lastKind = kind;
        this.setPose(kind, kind === 'win' ? 8000 : 1500);
        this.flashBubbles(this.next(kind));
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.ZiziBuddy;
}
