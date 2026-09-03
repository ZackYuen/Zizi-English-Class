global.window = global;
global.document = { getElementById: function () { return null; } };
global.addEventListener = function () {};

require('../js/curriculum.js');

var fs = require('fs');
var fails = 0;
function eq(name, got, want) {
    if (got !== want) {
        fails += 1;
        console.error('FAIL', name, 'got', got, 'want', want);
    } else {
        console.log('ok', name);
    }
}

var said = [];
Curriculum.say = function (line) {
    said.push('yue:' + line);
    return Promise.resolve();
};
Curriculum.speakEn = function (word) {
    said.push('en:' + word);
    return Promise.resolve();
};

eq('playPrompt exists', typeof Curriculum.playPrompt, 'function');

var g = { introSaid: false };
Curriculum.playPrompt(g, '撳下面啲字母砌呢個字！', 'heart').then(function () {
    eq('first prompt says Cantonese how-to', said[0], 'yue:撳下面啲字母砌呢個字！');
    eq('first prompt then English', said[1], 'en:heart');
    eq('marks intro as said', g.introSaid, true);

    said = [];
    return Curriculum.playPrompt(g, '撳下面啲字母砌呢個字！', 'envelope');
}).then(function () {
    eq('later prompt skips Cantonese', said.join('|'), 'en:envelope');

    said = [];
    var stale = { introSaid: false };
    return Curriculum.playPrompt(stale, '開始！', 'bus', function () { return false; });
}).then(function () {
    eq('stale after how-to skips English', said.join('|'), 'yue:開始！');

    var puzzle = fs.readFileSync(__dirname + '/../js/wordpuzzle.js', 'utf8');
    var hunt = fs.readFileSync(__dirname + '/../js/hunt.js', 'utf8');
    var race = fs.readFileSync(__dirname + '/../js/race.js', 'utf8');
    var shoot = fs.readFileSync(__dirname + '/../js/shoot.js', 'utf8');
    eq('puzzle uses playPrompt', puzzle.indexOf('Curriculum.playPrompt') !== -1, true);
    eq('hunt uses playPrompt', hunt.indexOf('Curriculum.playPrompt') !== -1, true);
    eq('race uses playPrompt', race.indexOf('Curriculum.playPrompt') !== -1, true);
    eq('shoot uses playPrompt', shoot.indexOf('Curriculum.playPrompt') !== -1, true);
    eq('hunt does not repeat 邊幅圖係', hunt.indexOf('邊幅圖係') === -1, true);
    eq('race spawn does not say 撞 word', /say\('撞 /.test(race), false);
    eq('shoot does not say 射十個 word', shoot.indexOf('射十個 \'') === -1 && shoot.indexOf('射十個 "') === -1, true);

    if (fails) process.exit(1);
    console.log('all howto-once tests passed');
}).catch(function (err) {
    console.error(err);
    process.exit(1);
});
