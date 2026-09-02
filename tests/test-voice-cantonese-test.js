var fs = require('fs');
var src = fs.readFileSync(__dirname + '/../js/router.js', 'utf8');
var fn = src.split('window.testVoice = function')[1] || '';
fn = fn.split('window.enterMode')[0];
var fails = 0;
function eq(name, got, want) {
    if (got !== want) {
        fails += 1;
        console.error('FAIL', name, 'got', got, 'want', want);
    } else {
        console.log('ok', name);
    }
}

eq('test voice still speaks Cantonese', fn.indexOf('playCantoneseTTS') !== -1, true);
eq('test voice still speaks English', fn.indexOf('speakEnglish') !== -1, true);
eq('English waits until Cantonese finishes', fn.indexOf('.then(function ()') !== -1, true);
eq('does not fire English in parallel', /playCantoneseTTS\([\s\S]*speakEnglish\(/.test(fn) && fn.indexOf('Promise.resolve(p).then') !== -1, true);

if (fails) process.exit(1);
console.log('all test-voice cantonese tests passed');
