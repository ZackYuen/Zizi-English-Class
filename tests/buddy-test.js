global.window = global;
global.document = {
    getElementById: function () { return null; },
    querySelectorAll: function () { return []; },
    body: { classList: { remove: function () {}, add: function () {} }, offsetWidth: 1 }
};

var buddy = require('../js/buddy.js');
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

eq('home cheer names Zizi', buddy.next('home').indexOf('孜孜') !== -1, true);
eq('miss comforts Zizi', buddy.lines.miss.join('').indexOf('孜孜') !== -1, true);
eq('win line encourages', buddy.lines.win.join('').indexOf('孜孜') !== -1, true);
eq('lines rotate', buddy.next('hit') !== buddy.next('hit') || buddy.lines.hit.length === 1, true);
eq('miss pose is comfort', buddy.poseName('miss'), 'comfort');
eq('hit pose is cheer', buddy.poseName('hit'), 'cheer');
eq('idle pose stays idle', buddy.poseName('idle'), 'idle');

var page = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
var css = fs.readFileSync(path.join(__dirname, '../style.css'), 'utf8');
var curriculum = fs.readFileSync(path.join(__dirname, '../js/curriculum.js'), 'utf8');
var fx = fs.readFileSync(path.join(__dirname, '../js/fx.js'), 'utf8');
var deploy = fs.readFileSync(path.join(__dirname, '../.github/workflows/deploy-pages.yml'), 'utf8');

function count(hay, needle) {
    var n = 0;
    var i = 0;
    while ((i = hay.indexOf(needle, i)) !== -1) {
        n += 1;
        i += needle.length;
    }
    return n;
}

eq('yellow face is gone from home', page.indexOf('zizi-face') === -1 && page.indexOf('zizi-cap') === -1, true);
eq('home uses the picture-book idle pose', page.indexOf('class="buddy-home"') !== -1 && page.indexOf('img/characters/buddy-idle.png') !== -1, true);
eq('home tap speaks', page.indexOf("ZiziBuddy.poke('home')") !== -1, true);
eq('photo cutout is not the mascot', page.indexOf('zizi-buddy.png') === -1 && page.indexOf('id="buddy-float"') === -1, true);
eq('race chip', page.indexOf('id="race-overlay"') !== -1 && count(page, 'class="buddy-chip"') >= 6, true);
eq('puzzle chip', page.indexOf('id="puzzle-overlay"') < page.lastIndexOf('class="buddy-chip"'), true);
eq('hunt chip', page.indexOf('id="hunt-overlay"') < page.lastIndexOf('class="buddy-chip"'), true);
eq('shoot chip', page.indexOf('id="shoot-overlay"') < page.lastIndexOf('class="buddy-chip"'), true);
eq('writing chip', page.indexOf('id="standard-top-bar"') < page.indexOf('class="buddy-chip"'), true);
eq('camera chip', page.indexOf('buddy-chip-cam') !== -1, true);
eq('album chip', page.indexOf('id="album-overlay"') < page.lastIndexOf('class="buddy-chip"'), true);
eq('chips can be poked', count(page, 'ZiziBuddy.poke()') >= 7, true);
eq('celebration shows the cheer pose', page.indexOf('img/characters/buddy-cheer.png') !== -1, true);
eq('page loads buddy.js', page.indexOf('js/buddy.js?v=20260929-ehonbuddy') !== -1, true);
eq('correct answers cheer the companion', curriculum.indexOf("ZiziBuddy.react('hit')") !== -1, true);
eq('wrong answers comfort', curriculum.indexOf("ZiziBuddy.react('miss')") !== -1, true);
eq('mid-step answers nudge the companion', curriculum.indexOf("ZiziBuddy.react('spark')") !== -1, true);
eq('celebration updates the cheer line', fx.indexOf('celebrate-buddy-line') !== -1 && fx.indexOf("setPose('win'") !== -1, true);
eq('css sways, hops, and nods', css.indexOf('@keyframes buddy-idle') !== -1 && css.indexOf('@keyframes buddy-hop') !== -1 && css.indexOf('@keyframes buddy-nod') !== -1, true);
eq('Pages deploy copies images', deploy.indexOf('cp -r img _site/img') !== -1, true);

['buddy-idle.png', 'buddy-cheer.png', 'buddy-comfort.png'].forEach(function (name) {
    var png = fs.readFileSync(path.join(__dirname, '../img/characters/' + name));
    eq(name + ' is a png', png[0] === 0x89 && png[1] === 0x50, true);
});

if (fails) process.exit(1);
console.log('all buddy tests passed');
