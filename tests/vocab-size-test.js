global.window = global;
require('../js/data.js');
require('../js/curriculum.js');

var fails = 0;
function eq(name, got, want) {
    if (got !== want) {
        fails += 1;
        console.error('FAIL', name, 'got', got, 'want', want);
    } else {
        console.log('ok', name);
    }
}

var words = window.D.map(function (d) { return d.w; });
var unique = {};
words.forEach(function (w) { unique[w] = (unique[w] || 0) + 1; });
var dups = Object.keys(unique).filter(function (w) { return unique[w] > 1 && w !== 'fox' && w !== 'six'; });
eq('at least 300 words', window.D.length >= 300, true);
eq('no unexpected duplicate words', dups.length, 0);

var sat = window.D.filter(function (d) { return 'SATIPN'.indexOf(d.l) !== -1; });
eq('SATIPN has at least 80 words', sat.length >= 80, true);

var g0 = Curriculum.groupLetters(0).join('');
eq('group 0 is SATIPN', g0, 'SATIPN');
eq('group 1 still includes S', Curriculum.groupLetters(1).indexOf('S') !== -1, true);
eq('group 1 includes C', Curriculum.groupLetters(1).indexOf('C') !== -1, true);

window.getProgress = function () { return { stars: 0 }; };
var a = Curriculum.pickLesson(8).map(function (d) { return d.w; });
var b = Curriculum.pickLesson(8).map(function (d) { return d.w; });
eq('first lesson has 8 words', a.length, 8);
eq('second lesson has 8 words', b.length, 8);
var overlap = a.filter(function (w) { return b.indexOf(w) !== -1; });
if (overlap.length > 2) {
    fails += 1;
    console.error('FAIL lessons should mostly not repeat, overlap', overlap);
} else {
    console.log('ok lessons rotate, overlap', overlap.length);
}

var apple = window.D.filter(function (d) { return d.w === 'apple'; })[0];
eq('apple has Cantonese', apple && apple.yue === '蘋果', true);
eq('yue helper finds apple', Curriculum.yue('apple'), '蘋果');

if (fails) process.exit(1);
console.log('all vocab expansion tests passed', 'n=' + window.D.length);
