// Simulate a sky of balloons with a mocked Curriculum.
global.window = global;
global.document = {
    readyState: 'complete',
    getElementById: function () {
        return {
            innerHTML: '',
            textContent: '',
            classList: { add: function () {}, remove: function () {}, toggle: function () {} },
            style: {},
            appendChild: function () {},
            querySelector: function () { return null; },
            addEventListener: function () {}
        };
    },
    addEventListener: function () {}
};
global.window.addEventListener = function () {};
global.window.Curriculum = {
    pickLesson: function (n) {
        var words = ['yell', 'mat', 'yak', 'sit', 'pan'];
        return words.slice(0, n).map(function (w) { return { w: w, emoji: '🎈', l: w[0].toUpperCase() }; });
    },
    decoys: function (item, n) {
        return ['mat', 'yak', 'sit', 'pan', 'tin', 'nap'].filter(function (w) {
            return w !== item.w;
        }).slice(0, n).map(function (w) { return { w: w, emoji: '🎈', l: w[0].toUpperCase() }; });
    },
    stars: function () {},
    fillTarget: function () {},
    say: function () { return Promise.resolve(); },
    speakEn: function () { return Promise.resolve(); },
    yue: function () { return ''; },
    award: function () {},
    popBalloon: function () {},
    missFx: function () {},
    bootFx: function () {},
    finishFx: function () {},
    pop: function () {}
};
global.Curriculum = global.window.Curriculum;

var shoot = require('../js/shoot.js');
var g = window.ShootGame;
var fails = 0;
function eq(name, got, want) {
    if (got !== want) {
        fails += 1;
        console.error('FAIL', name, 'got', got, 'want', want);
    } else {
        console.log('ok', name);
    }
}

g.queue = Curriculum.pickLesson(5);
g.got = 0;
g.target = g.queue[0];
g.decoys = Curriculum.decoys(g.target, 6);
g.power = 0;
shoot.shootFillSky(true);

eq('ten balloons on the field', g.balloons.length, 10);
var correct = shoot.shootCountCorrect();
if (correct < 4) {
    fails += 1;
    console.error('FAIL need at least 4 correct, got', correct);
} else {
    console.log('ok at least 4 correct balloons', correct);
}

var decoyHits = g.balloons.filter(function (b) { return b.item.w !== 'yell'; }).length;
if (decoyHits < 1) {
    console.log('note: random fill had no decoys this run (allowed)');
} else {
    console.log('ok mixed in decoy balloons', decoyHits);
}

g.power = 0;
g.got = 0;
var last;
for (var i = 0; i < 9; i++) last = shoot.shootApplyCorrect(g);
eq('nine hits stay on energy', last, 'energy');
eq('nine power', g.power, 9);
last = shoot.shootApplyCorrect(g);
eq('tenth hit clears the word', last, 'word');

if (fails) process.exit(1);
console.log('all balloon mix tests passed');
