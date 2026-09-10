global.window = global;

var store = {
    zizi_progress_v1: JSON.stringify({
        stars: 1,
        words: {
            iron: { word: 'iron', emoji: '🧯', letter: 'I', count: 2, lastAt: 1 },
            ivy: { word: 'ivy', emoji: '🌱', letter: 'I', count: 3, lastAt: 1 }
        },
        streakDays: 0,
        lastPlayDate: '',
        questDate: '',
        questDone: {},
        todayStars: 0
    })
};
global.localStorage = {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; }
};
global.document = {
    getElementById: function () { return null; },
    addEventListener: function () {}
};
global.addEventListener = function () {};

require('../js/data.js');
require('../js/stories.js');
require('../js/art.js');
require('../js/progress.js');

var fails = 0;
function eq(name, got, want) {
    if (got !== want) {
        fails += 1;
        console.error('FAIL', name, 'got', got, 'want', want);
    } else {
        console.log('ok', name);
    }
}

var iron = window.D.filter(function (d) { return d.w === 'iron'; })[0];
eq('iron is still 熨斗', iron && iron.yue, '熨斗');
eq('iron is not a fire extinguisher', iron && iron.emoji !== '🧯', true);
eq('iron is drawn as a clothes iron', window.ZiziArt.usesShape('iron'), true);
eq('iron story mentions 燙衫', window.WORD_STORIES.iron.story.indexOf('燙衫') !== -1, true);
eq('iron story does not mention 滅火', window.WORD_STORIES.iron.story.indexOf('滅火') === -1, true);

var fs = require('fs');
var artSrc = fs.readFileSync(__dirname + '/../js/art.js', 'utf8');
var ironFn = artSrc.slice(artSrc.indexOf('iron: function'), artSrc.indexOf('window.ZiziArt'));
eq('iron drawing is in art.js', ironFn.indexOf('iron: function') === 0, true);
eq('iron drawing mentions a shirt', ironFn.indexOf('shirt') !== -1, true);
eq('iron drawing is not the red extinguisher body', ironFn.indexOf('#e63946') === -1, true);
eq('iron drawing uses a blue shirt', ironFn.indexOf('#4dabf7') !== -1, true);

var saved = window.getProgress();
eq('album forgets a stored 🧯 for iron', saved.words.iron.emoji !== '🧯', true);
eq('album iron picture follows the word bank', saved.words.iron.emoji, iron.emoji);
eq('other saved pictures stay put when already current', saved.words.ivy.emoji, '🌱');

window.awardStars(0, { word: 'iron', emoji: '🧯', letter: 'I' });
eq('awardStars will not save 🧯 for iron', window.getProgress().words.iron.emoji !== '🧯', true);

var html = window.albumDetailHtml('iron', { word: 'iron', emoji: '🧯' });
eq('detail popup does not embed 🧯', html.indexOf('🧯') === -1, true);
eq('detail popup paints live art for iron', html.indexOf('data-art-word="iron"') !== -1, true);

var page = fs.readFileSync(__dirname + '/../index.html', 'utf8');
eq('iron art is cache-busted', page.indexOf('js/art.js?v=20260910-iron3') !== -1, true);
eq('iron progress is cache-busted', page.indexOf('js/progress.js?v=20260910-iron3') !== -1, true);

if (fails) process.exit(1);
console.log('all iron clothes picture tests passed');
