global.window = global;
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
var beamDraw = src.split('if (g.beam && g.beam.t > 0)')[1] || '';
beamDraw = beamDraw.split('g.balloons.forEach')[0];
eq('shot is not a laser line', beamDraw.indexOf('lineTo(g.beam') === -1, true);
eq('shot uses the big bullet drawer', beamDraw.indexOf('shootDrawBullet') !== -1, true);

if (fails) process.exit(1);
console.log('all shoot big-bullet tests passed');
