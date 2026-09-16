global.window = global;
global.document = {
    body: { appendChild: function () {}, classList: { add: function () {}, remove: function () {} } },
    createElement: function () {
        return { style: {}, classList: { add: function () {}, remove: function () {} }, className: '', textContent: '' };
    },
    getElementById: function () { return null; }
};

var log = [];
window.ZiziFX = {
    play: function (name) { log.push('play:' + name); },
    flash: function (color) { log.push('flash:' + (color || '')); },
    floatScore: function (host, text, kind) { log.push('float:' + text + ':' + kind); },
    burst: function () { log.push('burst'); },
    boomConfetti: function (n) { log.push('confetti:' + n); },
    shake: function (el) { if (el) log.push('shake'); },
    pulse: function (el) { if (el) log.push('pulse'); },
    ring: function (host) { if (host) log.push('ring'); }
};

var Curriculum = require('../js/curriculum.js');
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
function has(name, list, token) {
    eq(name, list.indexOf(token) !== -1, true);
}

eq('null pts still floats a label', Curriculum.answerLabel(null), '叻！');
eq('numeric pts prefix plus', Curriculum.answerLabel(5), '+5');
eq('string pts pass through', Curriculum.answerLabel('捉住！'), '捉住！');

var host = { id: 'host' };
log = [];
Curriculum.hitFx(host, null, 1);
has('hit plays correct', log, 'play:correct');
eq('hit flashes', log.some(function (x) { return x.indexOf('flash:') === 0; }), true);
has('hit floats without pts', log, 'float:叻！:good');
has('hit bursts even on combo 1', log, 'burst');
has('hit rings', log, 'ring');
has('hit confetti', log, 'confetti:55');

log = [];
Curriculum.hitFx(host, '啱喇！', 3);
has('combo plays combo sfx', log, 'play:combo');
has('combo uses custom label', log, 'float:啱喇！:good');
has('combo bigger confetti', log, 'confetti:90');

log = [];
Curriculum.sparkFx(host, 'S');
has('spark plays pop', log, 'play:pop');
has('spark floats letter', log, 'float:S:good');
has('spark bursts', log, 'burst');
has('spark pulses', log, 'pulse');
has('spark rings', log, 'ring');
eq('spark has no confetti', log.indexOf('confetti:55') === -1 && log.indexOf('confetti:90') === -1, true);

log = [];
Curriculum.missFx(host, '唔係呢個');
has('miss plays wrong', log, 'play:wrong');
eq('miss shakes', log.indexOf('shake') !== -1, true);
eq('miss flashes red', log.some(function (x) { return x.indexOf('flash:') === 0; }), true);
has('miss floats label', log, 'float:唔係呢個:bad');

var hunt = fs.readFileSync(path.join(__dirname, '../js/hunt.js'), 'utf8');
var puzzle = fs.readFileSync(path.join(__dirname, '../js/wordpuzzle.js'), 'utf8');
var shoot = fs.readFileSync(path.join(__dirname, '../js/shoot.js'), 'utf8');
var race = fs.readFileSync(path.join(__dirname, '../js/race.js'), 'utf8');
var canvas = fs.readFileSync(path.join(__dirname, '../js/canvas.js'), 'utf8');
var camera = fs.readFileSync(path.join(__dirname, '../js/camera.js'), 'utf8');
var fx = fs.readFileSync(path.join(__dirname, '../js/fx.js'), 'utf8');
var css = fs.readFileSync(path.join(__dirname, '../style.css'), 'utf8');
var page = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

eq('hunt miss uses missFx', hunt.indexOf('Curriculum.missFx') !== -1, true);
eq('hunt miss no longer boom-only', /is-miss[\s\S]{0,80}Curriculum\.boom\(\)/.test(hunt), false);
eq('puzzle letter uses sparkFx', puzzle.indexOf('Curriculum.sparkFx') !== -1, true);
eq('puzzle letter no longer pop-only', /if \(ch !== need\)[\s\S]{0,200}Curriculum\.pop\(\)/.test(puzzle), false);
eq('shoot miss always missFx', shoot.indexOf("Curriculum.missFx(shEl('shoot-play'), '唔係呢個')") !== -1, true);
eq('shoot energy uses sparkFx', shoot.indexOf('Curriculum.sparkFx') !== -1, true);
eq('race hit has a visible label', race.indexOf("Curriculum.hitFx(raceEl('race-overlay'), '啱喇！'") !== -1, true);
eq('writing dirty stroke uses missFx', canvas.indexOf("missFx(writeFxHost(), '再畫')") !== -1, true);
eq('writing failed letter uses missFx', canvas.split("missFx(writeFxHost(), '再畫')").length >= 3, true);
eq('writing stroke success uses sparkFx', canvas.indexOf("sparkFx(writeFxHost(), '跟到！')") !== -1, true);
eq('camera hit has a visible label', camera.indexOf("hitFx(document.getElementById('camera-overlay'), '搵到！'") !== -1, true);
eq('fx exposes pulse', fx.indexOf('pulse: function') !== -1, true);
eq('fx exposes ring', fx.indexOf('ring: function') !== -1, true);
eq('css has pulse animation', css.indexOf('@keyframes z-fx-pulse') !== -1, true);
eq('css has ring animation', css.indexOf('@keyframes z-fx-ring-out') !== -1, true);
eq('page cache-busts fx scripts', page.indexOf('js/curriculum.js?v=20260916-fx') !== -1 && page.indexOf('js/hunt.js?v=20260916-fx') !== -1, true);

if (fails) process.exit(1);
console.log('all answer fx tests passed');
