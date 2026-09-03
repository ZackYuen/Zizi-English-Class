global.window = global;
require('../js/data.js');
require('../js/stories.js');
require('../js/art.js');

var fails = 0;
function eq(name, got, want) {
    if (got !== want) {
        fails += 1;
        console.error('FAIL', name, 'got', got, 'want', want);
    } else {
        console.log('ok', name);
    }
}

var iron = window.D.filter(function (d) { return d.w === 'iron'; })[0];
eq('iron is still 熨斗', iron && iron.yue, '熨斗');
eq('iron is not a fire extinguisher', iron && iron.emoji !== '🧯', true);
eq('iron is drawn as a clothes iron', window.ZiziArt.usesShape('iron'), true);
eq('iron story mentions 燙衫', window.WORD_STORIES.iron.story.indexOf('燙衫') !== -1, true);
eq('iron story does not mention 滅火', window.WORD_STORIES.iron.story.indexOf('滅火') === -1, true);

if (fails) process.exit(1);
console.log('all iron clothes picture tests passed');
