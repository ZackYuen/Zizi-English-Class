global.window = global;
global.performance = { now: function () { return 0; } };
global.requestAnimationFrame = function (fn) { return 0; };
global.addEventListener = function () {};
global.document = {
    addEventListener: function () {},
    getElementById: function () { return null; },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    createElement: function () {
        return {
            style: { setProperty: function () {} },
            classList: { add: function () {}, remove: function () {}, toggle: function () {} },
            dataset: {},
            appendChild: function () {},
            addEventListener: function () {}
        };
    }
};

require('../js/data.js');
require('../js/curriculum.js');
require('../js/wordpuzzle.js');

var fs = require('fs');
var css = fs.readFileSync(__dirname + '/../style.css', 'utf8');
var fails = 0;
function eq(name, got, want) {
    if (got !== want) {
        fails += 1;
        console.error('FAIL', name, 'got', got, 'want', want);
    } else {
        console.log('ok', name);
    }
}

var layout = window.PuzzleGame.slotLayout;
eq('slotLayout is exported', typeof layout, 'function');

var phone = 360;
var eight = layout(phone, 8);
eq('envelope slots fit an iPhone row', eight.slot * 8 + eight.gap * 7 <= phone, true);
eq('envelope slots stay readable', eight.font >= 16, true);

var five = layout(phone, 5);
eq('short words stay bigger than long words', five.slot > eight.slot, true);

var ten = layout(320, 10);
eq('10-letter word still fits a small phone', ten.slot * 10 + ten.gap * 9 <= 320, true);

var block = css.split('.pz-letter-slot {')[1] || '';
block = block.split('.pz-letter-slot.is-next')[0];
eq('slots can shrink below 52px', block.indexOf('min-width: 0') !== -1, true);
eq('slots no longer force 52px min', block.indexOf('min-width: 52px') === -1, true);
eq('slot size comes from --pz-slot', block.indexOf('var(--pz-slot)') !== -1, true);

if (fails) process.exit(1);
console.log('all puzzle slot fit tests passed');
