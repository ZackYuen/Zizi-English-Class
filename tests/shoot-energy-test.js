// Energy-drop rules for balloon shooting: 10 hits per word, 5 words to finish.
global.window = global;
var shoot = require('../js/shoot.js');
var apply = shoot.shootApplyCorrect;
var fails = 0;

function eq(name, got, want) {
    if (got !== want) {
        fails += 1;
        console.error('FAIL', name, 'got', got, 'want', want);
    } else {
        console.log('ok', name);
    }
}

function fresh() {
    return { power: 0, NEED: 10, got: 0, STARS: 5 };
}

var g = fresh();
eq('first hit is energy', apply(g), 'energy');
eq('power is 1', g.power, 1);

g = fresh();
g.power = 9;
eq('tenth hit is a new word', apply(g), 'word');
eq('power stays full until UI advances', g.power, 10);
eq('stars not granted by apply', g.got, 0);

g = fresh();
g.power = 9;
g.got = 4;
eq('last word tenth hit finishes', apply(g), 'finish');
eq('fifth star still applied by UI', g.got, 4);

g = fresh();
for (var i = 0; i < 9; i++) eq('hit ' + (i + 1), apply(g), 'energy');
eq('hit 10', apply(g), 'word');

if (fails) {
    process.exit(1);
}
console.log('all shoot energy tests passed');
