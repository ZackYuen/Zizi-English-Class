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
global.Curriculum = {
    stars: function () {},
    fillTarget: function () {},
    pickLesson: function () { return [{ w: 'frog', emoji: '🐸', l: 'F' }]; },
    decoys: function () { return []; },
    speakEn: function () {},
    pop: function () {},
    missFx: function () {},
    award: function () {},
    popBalloon: function () {},
    say: function () { return Promise.resolve(); }
};
window.Curriculum = global.Curriculum;
var shoot = require('../js/shoot.js');
var fails = 0;
function eq(name, got, want) {
    if (got !== want) {
        fails += 1;
        console.error('FAIL', name, 'got', got, 'want', want);
    } else {
        console.log('ok', name);
    }
}

eq('bullet is a small ball', shoot.shootBulletRadius(320, 420) >= 8 && shoot.shootBulletRadius(320, 420) <= 11, true);
eq('phone-width bullet is not huge', shoot.shootBulletRadius(390, 700) <= 11, true);
eq('still bigger than a 4px laser', shoot.shootBulletRadius(320, 420) > 4, true);

var start = shoot.shootBulletPos({ x: 100, y: 40, t: 0.28, life: 0.28 }, 160, 380);
eq('starts at rocket', start && Math.round(start.x) === 160 && Math.round(start.y) === 380, true);

var end = shoot.shootBulletPos({ x: 100, y: 40, t: 0, life: 0.28 }, 160, 380);
eq('ends at balloon', end && Math.round(end.x) === 100 && Math.round(end.y) === 40, true);

var fs = require('fs');
var src = fs.readFileSync(__dirname + '/../js/shoot.js', 'utf8');
eq('shot is not a laser line', src.indexOf('lineTo(g.beam') === -1, true);
eq('shot uses the bullet drawer', src.indexOf('shootDrawBullet') !== -1, true);
eq('burst drawer exists', src.indexOf('shootDrawBurst') !== -1, true);

var burst = shoot.shootMakeBurst(100, 80, '#51cf66');
eq('burst has rubber bits', burst.bits.length >= 8, true);
eq('burst lasts a beat', burst.life >= 0.3, true);

window.ShootGame.active = true;
window.ShootGame.phase = 'play';
window.ShootGame.target = { w: 'frog' };
window.ShootGame.NEED = 10;
window.ShootGame.STARS = 5;
window.ShootGame.got = 0;
window.ShootGame.power = 0;
window.ShootGame.balloons = [{ item: { w: 'bell' }, color: '#ff6b6b', x: 0.4, y: 0.3, shot: true }];
window.ShootGame.bursts = [];
window.ShootGame.W = 320;
window.ShootGame.H = 420;
window.ShootGame.decoys = [{ w: 'mat', emoji: '🎈', l: 'M' }];
shoot.shootExplodeShot({ x: 128, y: 126, target: window.ShootGame.balloons[0] });
eq('explode removes the balloon', window.ShootGame.balloons.filter(function (b) { return b.item.w === 'bell'; }).length === 0, true);
eq('explode spawns a burst', window.ShootGame.bursts.length >= 1, true);

if (fails) process.exit(1);
console.log('all shoot bullet and burst tests passed');
