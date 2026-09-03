global.window = global;
require('../js/data.js');
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
function near(name, got, want, eps) {
    if (Math.abs(got - want) > (eps || 0.01)) {
        fails += 1;
        console.error('FAIL', name, 'got', got, 'want', want);
    } else {
        console.log('ok', name);
    }
}

eq('heart uses a drawn shape, not emoji', window.ZiziArt.usesShape('heart'), true);
eq('cat still uses a drawn shape', window.ZiziArt.usesShape('cat'), true);
eq('unknown word has no shape', window.ZiziArt.usesShape('zzzzzz'), false);

var nudgeRight = window.ZiziArt.emojiNudge({
    actualBoundingBoxLeft: 10,
    actualBoundingBoxRight: 40,
    actualBoundingBoxAscent: 20,
    actualBoundingBoxDescent: 20
});
near('nudge left when glyph ink sits to the right', nudgeRight.dx, -15);
near('no vertical nudge when ascent equals descent', nudgeRight.dy, 0);

var nudgeUp = window.ZiziArt.emojiNudge({
    actualBoundingBoxLeft: 20,
    actualBoundingBoxRight: 20,
    actualBoundingBoxAscent: 40,
    actualBoundingBoxDescent: 10
});
near('nudge down when ink sits high', nudgeUp.dy, 15);

var place = window.ZiziArt.fitSprite(50, 80, 100);
near('fitted sprite stays inside 88% box', place.dh, 88);
near('fitted sprite is horizontally centered', place.dx, -place.dw / 2);
near('fitted sprite is vertically centered', place.dy, -place.dh / 2);
eq('fitted width is smaller than height for tall ink', place.dw < place.dh, true);

var w = 8;
var h = 8;
var data = new Uint8ClampedArray(w * h * 4);
function setPx(x, y, a) {
    data[(y * w + x) * 4 + 3] = a;
}
setPx(5, 2, 255);
setPx(6, 2, 255);
setPx(5, 3, 255);
setPx(6, 3, 200);
var box = window.ZiziArt.inkRect(data, w, h, 24);
eq('ink left', box && box.x, 5);
eq('ink top', box && box.y, 2);
eq('ink width', box && box.w, 2);
eq('ink height', box && box.h, 2);

var rightHeavy = new Uint8ClampedArray(8 * 8 * 4);
function setA(x, y, a) { rightHeavy[(y * 8 + x) * 4 + 3] = a; }
for (var yy = 0; yy < 8; yy++) {
    for (var xx = 0; xx < 8; xx++) setA(xx, yy, 30);
    setA(6, yy, 255);
    setA(7, yy, 255);
}
var stats = window.ZiziArt.inkStats(rightHeavy, 8, 8, 24);
eq('right-heavy ink has a centroid', !!(stats && stats.cx > 4), true);
var centered = window.ZiziArt.fitSprite(stats.w, stats.h, 100, stats.cx - stats.x, stats.cy - stats.y);
var bboxOnly = window.ZiziArt.fitSprite(stats.w, stats.h, 100);
eq('centroid shifts further left than bbox center', centered.dx < bboxOnly.dx, true);

eq('pictureEl exists', typeof window.ZiziArt.pictureEl, 'function');
var fs = require('fs');
var puzzle = fs.readFileSync(__dirname + '/../js/wordpuzzle.js', 'utf8');
eq('puzzle uses pictureEl for every word', puzzle.indexOf('pictureEl') !== -1, true);
eq('puzzle no longer paints emoji onto the reveal bitmap', puzzle.indexOf('pzPaintHidden') === -1, true);

if (fails) process.exit(1);
console.log('all art center tests passed');
