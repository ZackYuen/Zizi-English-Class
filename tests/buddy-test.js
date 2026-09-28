global.window = global;
global.document = {
    getElementById: function () { return null; }
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
eq('miss comforts Zizi', buddy.next('miss').indexOf('孜孜') !== -1 || buddy.lines.miss.join('').indexOf('孜孜') !== -1, true);
eq('win line encourages', buddy.lines.win.join('').indexOf('孜孜') !== -1, true);
eq('lines rotate', buddy.next('hit') !== buddy.next('hit') || buddy.lines.hit.length === 1, true);

var page = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
var css = fs.readFileSync(path.join(__dirname, '../style.css'), 'utf8');
var curriculum = fs.readFileSync(path.join(__dirname, '../js/curriculum.js'), 'utf8');
var fx = fs.readFileSync(path.join(__dirname, '../js/fx.js'), 'utf8');
var deploy = fs.readFileSync(path.join(__dirname, '../.github/workflows/deploy-pages.yml'), 'utf8');
var png = fs.readFileSync(path.join(__dirname, '../img/characters/zizi-buddy.png'));

eq('home shows the companion', page.indexOf('img/characters/zizi-buddy.png') !== -1, true);
eq('home can hear the companion', page.indexOf('ZiziBuddy.sayHome') !== -1, true);
eq('play companion is in the page', page.indexOf('id="buddy-float"') !== -1, true);
eq('celebration shows the companion', page.indexOf('celebrate-buddy') !== -1, true);
eq('page loads buddy.js', page.indexOf('js/buddy.js?v=20260928-buddy') !== -1, true);
eq('correct answers cheer the companion', curriculum.indexOf("ZiziBuddy.react('hit')") !== -1, true);
eq('wrong answers comfort', curriculum.indexOf("ZiziBuddy.react('miss')") !== -1, true);
eq('mid-step answers nudge the companion', curriculum.indexOf("ZiziBuddy.react('spark')") !== -1, true);
eq('celebration updates the cheer line', fx.indexOf('celebrate-buddy-line') !== -1, true);
eq('css hops the companion', css.indexOf('@keyframes buddy-hop') !== -1, true);
eq('Pages deploy copies images', deploy.indexOf('cp -r img _site/img') !== -1, true);
eq('companion file is a png', png[0] === 0x89 && png[1] === 0x50, true);

if (fails) process.exit(1);
console.log('all buddy tests passed');
