global.window = global;
global.navigator = { userAgent: 'node', vendor: '' };
global.localStorage = {
    _d: {},
    getItem: function (k) { return this._d[k] == null ? null : this._d[k]; },
    setItem: function (k, v) { this._d[k] = String(v); }
};
global.Audio = function () {
    this.pause = function () {};
    this.play = function () { return Promise.resolve(); };
    this.src = '';
    this.currentTime = 0;
    this.onended = null;
    this.onerror = null;
};
global.speechSynthesis = {
    cancel: function () {},
    speak: function () {},
    getVoices: function () { return []; }
};
global.addEventListener = function () {};
global.document = { getElementById: function () { return null; } };

require('../js/speech.js');

var fails = 0;
function eq(name, got, want) {
    if (got !== want) {
        fails += 1;
        console.error('FAIL', name, 'got', got, 'want', want);
    } else {
        console.log('ok', name);
    }
}

try {
    window._requireLiveSpeech(window._speechToken);
    console.log('ok live token allowed');
} catch (e) {
    fails += 1;
    console.error('FAIL live token should be allowed');
}

window._speechToken += 1;
try {
    window._requireLiveSpeech(window._speechToken - 1);
    fails += 1;
    console.error('FAIL stale token should throw');
} catch (e) {
    eq('stale token is AbortError', e && e.name, 'AbortError');
}

var interruptFlags = [];
var origEnqueue = window._enqueueVoice;
window._enqueueVoice = function (fn, interrupt) {
    interruptFlags.push(interrupt);
    return Promise.resolve();
};
window.speakEnglish('shirt');
window.speakEnglish('s', { interrupt: false });
window._enqueueVoice = origEnqueue;
eq('english interrupts by default', interruptFlags[0], true);
eq('english can still queue', interruptFlags[1], false);

window._speechToken = 0;
window._voiceChain = Promise.resolve();
var ran = [];
var hung = window._enqueueVoice(function () {
    var myToken = window._speechToken;
    ran.push('first');
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            try {
                window._requireLiveSpeech(myToken);
                ran.push('first-late');
                resolve();
            } catch (e) {
                reject(e);
            }
        }, 25);
    });
}, true);

setTimeout(function () {
    window._enqueueVoice(function () {
        ran.push('second');
        return Promise.resolve('ok');
    }, true).then(function () {
        eq('interrupt starts the new line', ran.indexOf('second') !== -1, true);
        return hung.then(function () {
            fails += 1;
            console.error('FAIL stale job should abort, not succeed');
        }, function (err) {
            eq('stale job is AbortError', err && err.name, 'AbortError');
            eq('cut-off line did not keep talking', ran.indexOf('first-late') === -1, true);
        });
    }).then(function () {
        if (fails) process.exit(1);
        console.log('all speech overlap tests passed');
    }).catch(function (err) {
        console.error(err);
        process.exit(1);
    });
}, 5);
