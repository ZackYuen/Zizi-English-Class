var fs = require('fs');
var css = fs.readFileSync(__dirname + '/../style.css', 'utf8');
var js = fs.readFileSync(__dirname + '/../js/canvas.js', 'utf8');
var fails = 0;
function eq(name, got, want) {
    if (got !== want) {
        fails += 1;
        console.error('FAIL', name, 'got', got, 'want', want);
    } else {
        console.log('ok', name);
    }
}

var wrap = css.split('body.tracing-mode #canvas-wrapper')[1] || '';
wrap = wrap.split('body.tracing-mode .controls')[0];
eq('tracing pad does not flex-grow', wrap.indexOf('flex: 0 0 auto') !== -1, true);
eq('tracing pad keeps square aspect', wrap.indexOf('aspect-ratio: 1') !== -1, true);
eq('tracing pad is not a stretching height', wrap.indexOf('flex: 1 1 auto') === -1, true);

eq('follow is not 90% hard', /MIN_FOLLOW = 0\.7/.test(js), true);
eq('pass score is easier than 80', /WRITE_PASS_SCORE = 6/.test(js), true);
eq('green ball follows progress', js.indexOf('guideAtProgress') !== -1, true);
eq('lift can finish without exact end hit', js.indexOf('nearEnd && report.clean') === -1, true);

if (fails) process.exit(1);
console.log('all write square/completable tests passed');
