global.window = global;
var hunt = require('../js/hunt.js');
var fails = 0;
function eq(name, got, want) {
    if (got !== want) {
        fails += 1;
        console.error('FAIL', name, 'got', got, 'want', want);
    } else {
        console.log('ok', name);
    }
}

var field = { w: 300, h: 400 };
var b = { x: 10, y: 20, vx: -80, vy: 50, s: 100, paused: false };
hunt.huntStepFly(b, field, 0.2);
eq('left wall flips vx', b.vx > 0, true);
eq('stays on field', b.x >= 0, true);

b = { x: 280, y: 350, vx: 60, vy: 80, s: 100, paused: false };
hunt.huntStepFly(b, field, 0.5);
eq('right wall flips vx', b.vx < 0, true);
eq('bottom wall flips vy', b.vy < 0, true);

b = { x: 40, y: 40, vx: 10, vy: 10, s: 100, paused: true };
hunt.huntStepFly(b, field, 1);
eq('paused bush does not move', b.x, 40);

var flies = [
    { x: 40, y: 40, s: 100 },
    { x: 50, y: 45, s: 100 }
];
hunt.huntSeparate(flies);
var gap = Math.hypot((flies[1].x + 50) - (flies[0].x + 50), (flies[1].y + 50) - (flies[0].y + 50));
eq('overlapping bushes are pushed apart', gap > 10, true);

if (fails) process.exit(1);
console.log('all hunt fly tests passed');
