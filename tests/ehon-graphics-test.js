global.window = global;

require('../js/data.js');
require('../js/art.js');

var fs = require('fs');
var path = require('path');

var fails = 0;
function eq(name, got, want) {
    if (got !== want) {
        fails += 1;
        console.error('FAIL', name, 'got', got, 'want', want);
    } else {
        console.log('ok', name);
    }
}

var missing = window.D.filter(function (d) {
    return !window.ZiziArt.usesShape(d.w);
}).map(function (d) { return d.w; });
eq('every vocab word has a picture-book shape', missing.length, 0);
if (missing.length) console.error('missing', missing.join(','));

eq('unknown words stay without a shape', window.ZiziArt.usesShape('zzzzzz'), false);
eq('iron stays a clothes iron', window.ZiziArt.usesShape('iron'), true);
eq('home icons exist', window.ZiziArt.usesShape('butterfly') && window.ZiziArt.usesShape('puzzle') && window.ZiziArt.usesShape('camera'), true);

var page = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
eq('home uses the watercolor wave portrait', page.indexOf('img/characters/zizi-wave.jpg') !== -1, true);
eq('celebration uses the watercolor cheer portrait', page.indexOf('img/characters/zizi-cheer.jpg') !== -1, true);
eq('home buttons use watercolor icons', page.indexOf('img/icons/icon-race.jpg') !== -1 && page.indexOf('img/icons/icon-hunt.jpg') !== -1, true);
eq('home stats use drawn pictures', page.indexOf('data-art-word="star"') !== -1, true);

eq('portrait helper points at characters', window.ZiziArt.portrait('wave').indexOf('zizi-wave.jpg') !== -1, true);
eq('cheer portrait is distinct', window.ZiziArt.portrait('cheer').indexOf('zizi-cheer.jpg') !== -1, true);

['zizi-wave.jpg', 'zizi-cheer.jpg', 'zizi-think.jpg'].forEach(function (name) {
    eq('portrait file ' + name, fs.existsSync(path.join(__dirname, '../img/characters', name)), true);
});
['icon-race.jpg', 'icon-puzzle.jpg', 'icon-hunt.jpg', 'icon-shoot.jpg', 'icon-write.jpg', 'icon-camera.jpg', 'icon-album.jpg'].forEach(function (name) {
    eq('icon file ' + name, fs.existsSync(path.join(__dirname, '../img/icons', name)), true);
});

var hunt = fs.readFileSync(path.join(__dirname, '../js/hunt.js'), 'utf8');
var race = fs.readFileSync(path.join(__dirname, '../js/race.js'), 'utf8');
var puzzle = fs.readFileSync(path.join(__dirname, '../js/wordpuzzle.js'), 'utf8');
var shoot = fs.readFileSync(path.join(__dirname, '../js/shoot.js'), 'utf8');
eq('hunt results paint picture-book art', hunt.indexOf('Curriculum.listHtml') !== -1, true);
eq('race results paint picture-book art', race.indexOf('Curriculum.listHtml') !== -1, true);
eq('puzzle results paint picture-book art', puzzle.indexOf('Curriculum.listHtml') !== -1, true);
eq('shoot results paint picture-book art', shoot.indexOf('Curriculum.listHtml') !== -1, true);

var teach = fs.readFileSync(path.join(__dirname, '../js/teach.js'), 'utf8');
eq('write chip uses drawn pictures', teach.indexOf('data-art-word') !== -1, true);
eq('coach uses drawn pictures', teach.indexOf('zizi-coach-emoji" data-art-word') !== -1, true);

if (fails) process.exit(1);
console.log('all ehon graphics tests passed');
