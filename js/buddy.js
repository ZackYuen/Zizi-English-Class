// Zizi's own green paper companion.
// Stands beside the home mascot and cheers during play.
window.ZiziBuddy = {
    lines: {
        home: [
            '孜孜，我陪你學英文！',
            '今日都要加油呀！',
            '你做到嘅，孜孜！'
        ],
        hit: ['叻呀孜孜！', '你真係勁！', '繼續呀孜孜！'],
        spark: ['好呀！', '啱喇孜孜！'],
        miss: ['唔緊要，再試下！', '孜孜得嘅！', '我陪住你！'],
        win: ['孜孜，你真係叻！', '小伙伴為你歡呼！']
    },
    _i: {},
    _last: 0,

    next: function (kind) {
        var list = this.lines[kind] || this.lines.hit;
        var i = this._i[kind] || 0;
        this._i[kind] = (i + 1) % list.length;
        return list[i];
    },

    setAtHome: function (atHome) {
        var flo = document.getElementById('buddy-float');
        if (flo) flo.hidden = !!atHome;
    },

    showLine: function (id, text, speak) {
        var el = document.getElementById(id);
        if (el) el.textContent = text;
        if (speak && window.announce) {
            if (window.unlockAudio) window.unlockAudio();
            window.announce(text, { force: true, interrupt: true });
        }
    },

    sayHome: function () {
        this.showLine('buddy-home-line', this.next('home'), true);
    },

    react: function (kind) {
        var now = Date.now();
        if (kind !== 'miss' && this._last && now - this._last < 700) return;
        this._last = now;
        var flo = document.getElementById('buddy-float');
        if (!flo || flo.hidden) return;
        flo.classList.remove('is-cheer', 'is-comfort');
        void flo.offsetWidth;
        flo.classList.add(kind === 'miss' ? 'is-comfort' : 'is-cheer');
        var line = document.getElementById('buddy-float-line');
        if (line) line.hidden = false;
        this.showLine('buddy-float-line', this.next(kind), false);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.ZiziBuddy;
}
