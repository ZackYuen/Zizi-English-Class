global.window = global;
var race = require('../js/race.js');
var fails = 0;
function eq(name, got, want) {
    if (Math.abs(got - want) > 0.001 && got !== want) {
        fails += 1;
        console.error('FAIL', name, 'got', got, 'want', want);
    } else {
        console.log('ok', name);
    }
}

eq('cruise is slower than boost', race.raceCardSpeed(0) < race.raceCardSpeed(1), true);
eq('full boost is at least 3x cruise', race.raceCardSpeed(1) >= race.raceCardSpeed(0) * 3, true);
eq('dash boost is faster too', race.raceDashSpeed(1) > race.raceDashSpeed(0), true);
eq('boost 0 is cruise', race.raceCardSpeed(0), 0.10);
eq('clamps above 1', race.raceCardSpeed(3), race.raceCardSpeed(1));

if (fails) process.exit(1);
console.log('all race boost tests passed');
