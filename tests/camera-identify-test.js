global.window = global;

var parse = require('../js/camera.js').parseIdentifyNoun;
var fails = 0;
function eq(name, got, want) {
    if (got !== want) {
        fails += 1;
        console.error('FAIL', name, 'got', JSON.stringify(got), 'want', JSON.stringify(want));
    } else {
        console.log('ok', name);
    }
}

eq('single noun', parse('dog', []), 'dog');
eq('capitalized', parse('Dog.', []), 'dog');
eq('sentence', parse("It's a foot.", []), 'foot');
eq('fenced', parse('```\napple\n```', []), 'apple');
eq('vocab preferred', parse('I think it is a mat or rug', ['sit', 'mat', 'pan']), 'mat');
eq('safety skipped', parse('User Safety: safe\nResponse Safety: safe', []), '');
eq('empty', parse('', []), '');
eq('sorry skipped', parse('Sorry I cannot identify the object', []), '');

if (fails) process.exit(1);
console.log('all camera identify parse tests passed');
