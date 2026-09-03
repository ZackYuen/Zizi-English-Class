global.window = global;
global.localStorage = {
    getItem: function () { return null; },
    setItem: function () {},
    removeItem: function () {}
};
global.document = {
    getElementById: function () { return null; },
    addEventListener: function () {}
};
global.addEventListener = function () {};

window.ZiziTeach = {
    info: function (word) {
        return {
            w: word,
            emoji: '🚌',
            yue: '公共車',
            loan: '巴士',
            nick: '巴士',
            parts: [{ en: 'bus', yue: '公共車' }],
            from: '拉丁文 omnibus',
            story: '香港人叫巴士，聽落好似 bus。',
            also: null
        };
    }
};

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

var html = window.albumDetailHtml('bus', { emoji: '🚌' });
eq('keeps etymology origin', html.indexOf('拉丁文 omnibus') !== -1, true);
eq('keeps story', html.indexOf('香港人叫巴士') !== -1, true);
eq('shows Hong Kong loan', html.indexOf('香港叫') !== -1 && html.indexOf('巴士') !== -1, true);
eq('shows parts', html.indexOf('etym-parts') !== -1, true);
eq('shows the word', html.indexOf('bus') !== -1, true);
eq('detail picture is filled from the word', html.indexOf('data-art-word="bus"') !== -1, true);

var fs = require('fs');
var page = fs.readFileSync(__dirname + '/../index.html', 'utf8');
eq('popup markup exists', page.indexOf('id="album-detail"') !== -1, true);
eq('grid cards stay compact', page.indexOf('id="album-scroll"') !== -1, true);

if (fails) process.exit(1);
console.log('all album detail tests passed');
