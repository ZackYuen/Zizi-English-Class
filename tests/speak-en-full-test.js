global.window = global;
global.document = { getElementById: function () { return null; } };
global.addEventListener = function () {};

require('../js/curriculum.js');

var fails = 0;
function eq(name, got, want) {
    if (got !== want) {
        fails += 1;
        console.error('FAIL', name, 'got', got, 'want', want);
    } else {
        console.log('ok', name);
    }
}

var spoken = [];
window.speakEnglish = function (word) {
    spoken.push(word);
    return new Promise(function (resolve) { setTimeout(resolve, 80); });
};

var t0 = Date.now();
Curriculum.afterSpeakEn('yarn', 40).then(function () {
    var elapsed = Date.now() - t0;
    eq('speaks the english word', spoken.join(','), 'yarn');
    eq('waits for the word to finish even if minMs is shorter', elapsed >= 75, true);

    spoken = [];
    window.speakEnglish = function (word) {
        spoken.push(word);
        return Promise.resolve();
    };
    var t1 = Date.now();
    return Curriculum.afterSpeakEn('bus', 90).then(function () {
        var took = Date.now() - t1;
        eq('still waits minMs after a fast voice', took >= 80, true);
        eq('spoke bus', spoken[0], 'bus');
        if (fails) process.exit(1);
        console.log('all afterSpeakEn tests passed');
    });
}).catch(function (err) {
    console.error(err);
    process.exit(1);
});
