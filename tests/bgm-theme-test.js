global.window = global;
global.localStorage = {
    _d: {},
    getItem: function (k) { return this._d[k] == null ? null : this._d[k]; },
    setItem: function (k, v) { this._d[k] = String(v); }
};
global.document = {
    addEventListener: function () {},
    getElementById: function () { return null; }
};
global.addEventListener = function () {};

require('../js/fx.js');

var fails = 0;
function eq(name, got, want) {
    if (got !== want) {
        fails += 1;
        console.error('FAIL', name, 'got', got, 'want', want);
    } else {
        console.log('ok', name);
    }
}

var themes = window.ZiziFX.themes;
['home', 'race', 'puzzle', 'hunt', 'shoot', 'write', 'camera'].forEach(function (name) {
    var spec = themes[name];
    eq(name + ' exists', !!(spec && spec.melody && spec.melody.length && spec.bass && spec.bass.length), true);
    eq(name + ' has tempo', spec.interval > 100 && spec.interval < 800, true);
});

eq('race is faster than puzzle', themes.race.interval < themes.puzzle.interval, true);
eq('shoot is faster than write', themes.shoot.interval < themes.write.interval, true);
eq('hunt alias from match', themes.match, themes.hunt);
eq('shoot alias from game', themes.game, themes.shoot);

window.ZiziFX._musicOn = false;
eq('setTheme race while muted', window.ZiziFX.setTheme('race'), 'race');
eq('stores race theme', window.ZiziFX._theme, 'race');
eq('setTheme unknown falls back', window.ZiziFX.setTheme('nope'), 'home');

eq('nitro sfx exists', window.ZiziFX.play.toString().indexOf('nitro') !== -1, true);
eq('engine helper exists', typeof window.ZiziFX.startEngine, 'function');
eq('setEngine helper exists', typeof window.ZiziFX.setEngine, 'function');

if (fails) process.exit(1);
console.log('all bgm theme tests passed');
