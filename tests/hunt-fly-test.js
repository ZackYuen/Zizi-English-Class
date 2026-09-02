global.window = global;
global.performance = { now: function () { return 0; } };
global.requestAnimationFrame = function () { return 0; };
global.cancelAnimationFrame = function () {};
global.addEventListener = function () {};
global.document = {
    addEventListener: function () {},
    getElementById: function () { return null; }
};

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
eq('paused flyer does not move', b.x, 40);

var flies = [
    { x: 40, y: 40, s: 100 },
    { x: 50, y: 45, s: 100 }
];
hunt.huntSeparate(flies);
var gap = Math.hypot((flies[1].x + 50) - (flies[0].x + 50), (flies[1].y + 50) - (flies[0].y + 50));
eq('overlapping flyers are pushed apart', gap > 10, true);

var size = hunt.huntFlySize({ w: 390, h: 580 });
eq('phone flyers are big', size >= 108 && size <= 156, true);
eq('uses a third of the short side', size >= Math.floor(390 * 0.3), true);

var marked = hunt.huntMarkCatch([
    { item: { w: 'cat' }, paused: false, win: false, poof: false },
    { item: { w: 'bus' }, paused: false, win: false, poof: false },
    { item: { w: 'sun' }, paused: false, win: false, poof: false }
], 'bus');
eq('winner is the matching word', marked[1].win === true && marked[1].poof === false, true);
eq('others are destroyed', marked[0].poof === true && marked[2].poof === true && marked[0].win === false, true);
eq('all pause on catch', marked.every(function (b) { return b.paused; }), true);

if (fails) process.exit(1);
console.log('all hunt fly tests passed');
