var fs = require('fs');
var src = fs.readFileSync(__dirname + '/../js/race.js', 'utf8');
var draw = src.split('g.cards.forEach')[1] || '';
draw = draw.split('var cy =')[0];

var fails = 0;
function eq(name, got, want) {
    if (got !== want) {
        fails += 1;
        console.error('FAIL', name, 'got', got, 'want', want);
    } else {
        console.log('ok', name);
    }
}

eq('cards are not tinted green', draw.indexOf('#d8f3dc') === -1, true);
eq('cards are not outlined green', draw.indexOf('#2ecc71') === -1, true);
eq('no good-card pulse', draw.indexOf('var good') === -1, true);

if (fails) process.exit(1);
console.log('all race no-green-hint tests passed');
