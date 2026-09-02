global.window = global;
var race = require('../js/race.js');

var fails = 0;
function eq(name, got, want) {
    if (got !== want) {
        fails += 1;
        console.error('FAIL', name, 'got', got, 'want', want);
    } else {
        console.log('ok', name);
    }
}
function near(name, got, want, eps) {
    if (Math.abs(got - want) > (eps || 0.001)) {
        fails += 1;
        console.error('FAIL', name, 'got', got, 'want', want);
    } else {
        console.log('ok', name);
    }
}

near('cruise cards slower than old 0.14', race.raceCardSpeed(0), 0.10);
near('full boost cards much faster', race.raceCardSpeed(1), 0.48);
eq('boost faster than cruise', race.raceCardSpeed(1) > race.raceCardSpeed(0) * 3, true);
eq('boost dash faster than cruise', race.raceDashSpeed(1) > race.raceDashSpeed(0) * 3, true);
near('clamped low', race.raceCardSpeed(-2), 0.10);
near('clamped high', race.raceCardSpeed(9), 0.48);

if (fails) process.exit(1);
console.log('all race boost tests passed');
