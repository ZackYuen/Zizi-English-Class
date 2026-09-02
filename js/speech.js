// ==========================================
// Speech engine — same voices as 小學預備 (ZiZiPrimaryPrep)
// Preferred: Google Cloud TTS Chirp3 HD (Safari cannot use iPhone Siri 聲音 2)
//   Cantonese: yue-HK-Chirp3-HD-Kore → yue-HK-Standard-A
//   English:   en-US-Chirp3-HD-Kore → en-US-Neural2-C → en-US-Standard-C
// Browser fallback: Spoken Content 「Siri 聲音 2」; never Compact 善怡; never Mandarin
// ==========================================

window._speechQueue = [];
window._speechBusy = false;
window._speechToken = 0;
window._audioUnlocked = false;
window._screenReaderLikely = false;
window._lastPointerAt = 0;
window._ttsAbort = null;
window._ttsCache = Object.create(null);
window._ttsCacheKeys = [];
window._TTS_CACHE_MAX = 40;

var GOOGLE_YUE_VOICES = ['yue-HK-Chirp3-HD-Kore', 'yue-HK-Standard-A'];
var GOOGLE_EN_VOICES = ['en-US-Chirp3-HD-Kore', 'en-US-Neural2-C', 'en-US-Standard-C'];
var GOOGLE_EN_SSML_VOICES = ['en-US-Neural2-C', 'en-US-Wavenet-F', 'en-US-Standard-C'];

function isAppleWebKit() {
    if (typeof navigator === 'undefined') return false;
    var ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua)) return true;
    if (/Safari/i.test(ua) && !/Chrome|Chromium|Edg|OPR|CriOS|FxiOS/i.test(ua)) return true;
    return typeof navigator.vendor === 'string' && navigator.vendor.indexOf('Apple') >= 0;
}

/** Same as 小學預備: if a Google key exists, always use Chirp3 (Safari cannot use Siri 聲音 2). */
function migrateVoiceDefaults() {
    try {
        var googleKey = window.getApiKey
            ? window.getApiKey('google_tts_key')
            : (localStorage.getItem('google_tts_key') || '');
        var saved = localStorage.getItem('zizi_voice_provider');
        if (googleKey && saved !== 'azure') {
            localStorage.setItem('zizi_voice_provider', 'google');
        }
        var yue = localStorage.getItem('google_yue_voice') || '';
        if (!yue || yue.indexOf('Chirp3') < 0) {
            localStorage.setItem('google_yue_voice', 'yue-HK-Chirp3-HD-Kore');
        }
        localStorage.setItem('zizi_voice_v', 'chirp3-2');
    } catch (e) { /* ignore */ }
}

window.getVoiceSettings = function () {
    migrateVoiceDefaults();
    var deployedProvider = (window.ZIZI_SECRETS && window.ZIZI_SECRETS.voiceProvider) || '';
    var azureKey = window.getApiKey
        ? window.getApiKey('azure_speech_key')
        : (localStorage.getItem('azure_speech_key') || '');
    var googleKey = window.getApiKey
        ? window.getApiKey('google_tts_key')
        : (localStorage.getItem('google_tts_key') || '');
    var saved = localStorage.getItem('zizi_voice_provider');
    var defaultProvider;
    if (saved === 'azure' && azureKey) defaultProvider = 'azure';
    else if (googleKey) defaultProvider = 'google';
    else defaultProvider = saved || deployedProvider || (azureKey ? 'azure' : 'iphone');
    return {
        provider: defaultProvider || 'google',
        azureKey: azureKey,
        azureRegion: window.getApiKey
            ? window.getApiKey('azure_speech_region')
            : (localStorage.getItem('azure_speech_region') || 'eastasia'),
        azureVoice: localStorage.getItem('azure_voice_name') || 'zh-HK-HiuMaanNeural',
        googleKey: googleKey,
        googleYueVoice: localStorage.getItem('google_yue_voice') || 'yue-HK-Chirp3-HD-Kore',
        autoRead: localStorage.getItem('zizi_auto_read') !== '0'
    };
};

window.unlockAudio = function () {
    window._audioUnlocked = true;
    if (window.ensureAudioContext) window.ensureAudioContext();
    if (window.speechSynthesis) {
        try {
            window.speechSynthesis.cancel();
            var warm = new SpeechSynthesisUtterance(' ');
            warm.volume = 0;
            warm.rate = 1;
            window.speechSynthesis.speak(warm);
            window.speechSynthesis.cancel();
        } catch (e) { /* ignore */ }
    }
};

window._voiceChain = Promise.resolve();

function stopAudioEl(a) {
    if (!a) return;
    try {
        a.pause();
        a.onended = null;
        a.currentTime = 0;
    } catch (e) { /* ignore */ }
}

window.stopSpeech = function () {
    window._speechToken += 1;
    window._speechQueue = [];
    window._speechBusy = false;
    window._voiceChain = Promise.resolve();
    if (window._ttsAbort) {
        try { window._ttsAbort.abort(); } catch (e) { /* ignore */ }
        window._ttsAbort = null;
    }
    if (window.speechSynthesis) {
        try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    }
    stopAudioEl(window.uiAudio);
    stopAudioEl(window.enAudio);
    stopAudioEl(window.mAudio);
};

/** One voice at a time: later lines wait, interrupt cuts in. */
window._enqueueVoice = function (fn, interrupt) {
    if (interrupt) {
        window.stopSpeech();
    }
    var tokenAtStart = window._speechToken;
    var run = window._voiceChain.then(function () {
        if (tokenAtStart !== window._speechToken) return;
        return fn();
    }, function () {
        if (tokenAtStart !== window._speechToken) return;
        return fn();
    });
    window._voiceChain = run.then(function () {}, function () {});
    return run;
};

/** Write HUD text without the instruction reader speaking it. */
window.setSilentMsg = function (text, color) {
    var msg = document.getElementById('msg');
    if (!msg) return;
    msg.setAttribute('data-silent', '1');
    msg.setAttribute('aria-hidden', 'true');
    if (text != null && msg.innerText !== text) msg.innerText = text;
    if (color) msg.style.color = color;
};

/** Kid-friendly spoken form (same as 小學預備): skip UI symbols, don't say “equals”. */
window.prepareSpokenText = function (raw, lang) {
    var s = String(raw || '').replace(/\u00a0/g, ' ').trim();
    if (!s) return '';
    s = s.replace(/[＿_]{2,}/g, '…');
    s = s.replace(/□+/g, '…');
    s = s.replace(/\.{3,}/g, '…');
    s = s.replace(/…+/g, '…');
    s = s.replace(/[▶►●■★☆✓✔✕×⌫$]/g, ' ');
    s = s.replace(/\s*[→←➔➡︎⇒⇐]+\s*/g, '，');
    s = s.replace(/／/g, '，');
    if (lang === 'en-US') {
        s = s.replace(/(\d)\s*\+\s*(\d)/g, '$1 plus $2');
        s = s.replace(/\s*=\s*\?/g, ' equals what');
        s = s.replace(/(\d)\s*=\s*(\d)/g, '$1 equals $2');
    } else {
        s = s.replace(/(\d)\s*\+\s*(\d)/g, '$1 加 $2');
        s = s.replace(/\s*=\s*\?/g, ' 等於幾多');
        s = s.replace(/(\d)\s*=\s*(\d)/g, '$1 等於 $2');
    }
    s = s.replace(/\s*=\s*/g, '，');
    s = s.replace(/[「」『』“”]/g, '');
    s = s.replace(/＋/g, ' ');
    s = s.replace(/－/g, ' ');
    s = s.replace(/\s+/g, ' ').replace(/\s+([，。！？、,.!?…])/g, '$1').trim();
    s = s.replace(/…([^\s，。！？,.!?])/g, '… $1');
    return s;
};

function voiceBlob(v) {
    var uri = v && typeof v.voiceURI === 'string' ? v.voiceURI : '';
    return ((v && v.lang) || '') + ' ' + ((v && v.name) || '') + ' ' + uri;
}

function isEnglishVoice(v) {
    return /^(en\b)|english|samantha|karen|daniel|moira|rishi|veena|fred|nicky|gordon/i.test(voiceBlob(v).toLowerCase());
}

function isChineseVoice(v) {
    return /zh|yue|cantonese|chinese|中文|粵|普通話|普通话/.test(voiceBlob(v));
}

/** Apple HK Cantonese. Mei-Jia / 美嘉 is Taiwan Mandarin — never pick it. */
function isHkCantoneseVoice(v) {
    var b = voiceBlob(v).toLowerCase();
    if (/eloquence/.test(b)) return false;
    if (
        /zh([-_]?cn)|zh([-_]?tw)|putonghua|mandarin|ting-?ting|mei-?jia|meijia|美嘉|婷婷|普通话|普通話/.test(b) &&
        !/hk|yue|cantonese|sin[-.\s]?ji|善怡|阿成|香港/.test(b)
    ) {
        return false;
    }
    return (
        /yue([-_]|$)/.test(b) ||
        /zh([-_]?hk)/.test(b) ||
        /sin[-.\s]?ji|善怡|阿成/.test(b) ||
        (/\bsiri\b/.test(b) && /zh|yue|hk|cantonese|香港|廣東|粤/.test(b)) ||
        /聲音\s*[12]/.test(b) ||
        b.indexOf('cantonese') >= 0 ||
        b.indexOf('粵語') >= 0 ||
        b.indexOf('广东话') >= 0 ||
        b.indexOf('廣東話') >= 0 ||
        b.indexOf('hong kong') >= 0 ||
        b.indexOf('hongkong') >= 0 ||
        (v.lang || '').toLowerCase() === 'zh-hk' ||
        (v.name || '').toLowerCase() === 'zh-hk'
    );
}

function isCompactVoice(v) {
    return /compact|精簡/.test(voiceBlob(v));
}

function isSiriVoice2(v) {
    if (!isHkCantoneseVoice(v)) return false;
    var b = voiceBlob(v);
    return /聲音\s*2|voice\s*2|siri[\s._-]*2|\bvoice2\b/i.test(b);
}

function isSiriYueVoice(v) {
    if (!isHkCantoneseVoice(v) || isCompactVoice(v)) return false;
    var b = voiceBlob(v);
    return /\bsiri\b/i.test(b) || /聲音\s*[12]/.test(b);
}

function scoreCantoneseVoice(v) {
    var b = voiceBlob(v).toLowerCase();
    var score = 0;
    if (!isHkCantoneseVoice(v)) {
        if (/zh([-_]?cn)|zh([-_]?tw)|putonghua|mandarin|普通话|普通話|汉语|漢語|ting-?ting|mei-?jia/.test(b)) {
            return -100;
        }
        return 0;
    }
    if (/yue([-_]|$)/.test(b) || b.indexOf('cantonese') >= 0 || b.indexOf('粵語') >= 0 || b.indexOf('广东话') >= 0 || b.indexOf('廣東話') >= 0) {
        score += 100;
    }
    if (/zh([-_]?hk)/.test(b) || b.indexOf('hong kong') >= 0 || b.indexOf('hongkong') >= 0 || b.indexOf('香港') >= 0) {
        score += 90;
    }
    if (isSiriVoice2(v)) score += 260;
    else if (isSiriYueVoice(v)) score += 180;
    if (/阿成|\bfung\b|\bwing\b/.test(b)) score += 36;
    if (/sin[-.\s]?ji|善怡/.test(b)) score += 18;
    if (/premium|優質/.test(b)) score += 40;
    if (/enhanced|已強化|增強/.test(b)) score += 28;
    if (v.default) score += 24;
    if (v.localService) score += 5;
    if (/compact|精簡/.test(b)) score -= 50;
    if (/eloquence/.test(b)) score -= 80;
    return score;
}

function pickIphoneCantoneseVoice() {
    if (!window.speechSynthesis) return null;
    var voices = window.speechSynthesis.getVoices() || [];
    var ranked = voices
        .map(function (v) { return { v: v, score: scoreCantoneseVoice(v) }; })
        .filter(function (x) { return x.score > 0; })
        .sort(function (a, b) { return b.score - a.score; })
        .map(function (x) { return x.v; });
    if (!ranked.length) return null;

    var siri2 = ranked.filter(isSiriVoice2)[0];
    if (siri2) return siri2;
    var siri = ranked.filter(isSiriYueVoice)[0];
    if (siri) return siri;

    var best = ranked[0];
    // Do not pin Compact 善怡 on iPhone — that overrides Spoken Content 「Siri 聲音 2」.
    if (isAppleWebKit() && isCompactVoice(best) && !isSiriYueVoice(best)) {
        var nonCompact = ranked.filter(function (v) { return !isCompactVoice(v); })[0];
        if (nonCompact) return nonCompact;
        var selected = ranked.filter(function (v) { return v.default; })[0];
        return selected || null;
    }
    return best;
}

function pickEnglishVoice() {
    if (!window.speechSynthesis) return null;
    var voices = window.speechSynthesis.getVoices() || [];
    var ranked = voices
        .filter(isEnglishVoice)
        .map(function (v) {
            var b = voiceBlob(v).toLowerCase();
            var s = 0;
            if (/samantha|karen|daniel|moira|serena/.test(b)) s += 60;
            if (/en([-_]?us)/.test(b)) s += 50;
            if (/en([-_]?gb)/.test(b)) s += 40;
            if (/en([-_]?hk)/.test(b)) s += 35;
            if (v.localService) s += 10;
            if (/eloquence/.test(b)) s -= 40;
            if (/compact|精簡/.test(b)) s -= 20;
            return { v: v, s: s };
        })
        .sort(function (a, b) { return b.s - a.s; });
    return ranked.length ? ranked[0].v : null;
}

function waitForVoices() {
    return new Promise(function (resolve) {
        if (!window.speechSynthesis) return resolve();
        var synth = window.speechSynthesis;
        if ((synth.getVoices() || []).length) return resolve();
        var done = false;
        var finish = function () {
            if (done) return;
            done = true;
            if (typeof synth.removeEventListener === 'function') {
                try { synth.removeEventListener('voiceschanged', finish); } catch (e) { /* ignore */ }
            }
            resolve();
        };
        if (typeof synth.addEventListener === 'function') {
            synth.addEventListener('voiceschanged', finish);
        } else {
            synth.onvoiceschanged = finish;
        }
        setTimeout(finish, 400);
    });
}

window.speakCantoneseBrowser = function (text, opts) {
    var options = opts || {};
    if (!window.speechSynthesis) return Promise.resolve();
    var prepared = window.prepareSpokenText(text, 'zh-HK');
    if (!prepared) return Promise.resolve();
    return waitForVoices().then(function () {
        return new Promise(function (resolve) {
            try {
                if (options.cancel !== false) window.speechSynthesis.cancel();
                var u = new SpeechSynthesisUtterance(prepared);
                var voice = pickIphoneCantoneseVoice();
                var skip = voice && isEnglishVoice(voice) && !isHkCantoneseVoice(voice);
                if (voice && !skip) {
                    u.voice = voice;
                    u.lang = voice.lang || 'zh-HK';
                } else {
                    u.lang = 'zh-HK';
                }
                u.rate = options.rate != null ? options.rate : (isAppleWebKit() ? 1 : 0.92);
                u.pitch = 1;
                u.onend = function () { resolve(); };
                u.onerror = function () { resolve(); };
                window.speechSynthesis.speak(u);
            } catch (e) {
                console.warn('speakCantoneseBrowser failed', e);
                resolve();
            }
        });
    });
};

async function speakAzureCantonese(text, settings) {
    var key = settings.azureKey;
    var region = settings.azureRegion || 'eastasia';
    var voice = settings.azureVoice || 'zh-HK-HiuMaanNeural';
    if (!key) throw new Error('no azure key');
    var prepared = window.prepareSpokenText(text, 'zh-HK');
    if (!prepared) return;

    var ssml =
        "<speak version='1.0' xml:lang='zh-HK'>" +
        "<voice name='" + voice + "'>" +
        "<prosody rate='-5%' pitch='+5%'>" + escapeXml(prepared) + '</prosody>' +
        '</voice></speak>';

    var ac = new AbortController();
    window._ttsAbort = ac;
    var res = await fetch('https://' + region + '.tts.speech.microsoft.com/cognitiveservices/v1', {
        method: 'POST',
        headers: {
            'Ocp-Apim-Subscription-Key': key,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
            'User-Agent': 'ZiziEnglishClass'
        },
        body: ssml,
        signal: ac.signal
    });
    if (!res.ok) throw new Error('azure ' + res.status);
    var buf = await res.arrayBuffer();
    var blob = new Blob([buf], { type: 'audio/mpeg' });
    var url = URL.createObjectURL(blob);
    await playUrl(url, 'ui');
    URL.revokeObjectURL(url);
}

function rememberTts(key, dataUrl) {
    window._ttsCache[key] = dataUrl;
    window._ttsCacheKeys.push(key);
    while (window._ttsCacheKeys.length > window._TTS_CACHE_MAX) {
        var old = window._ttsCacheKeys.shift();
        delete window._ttsCache[old];
    }
}

function yueVoiceList(preferred) {
    var list = [];
    if (preferred) list.push(preferred);
    GOOGLE_YUE_VOICES.forEach(function (v) {
        if (list.indexOf(v) < 0) list.push(v);
    });
    return list;
}

async function googleSynthesizeOnce(opts) {
    var ac = opts.abort || window._ttsAbort || new AbortController();
    window._ttsAbort = ac;
    var res = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize?key=' + opts.apiKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            input: opts.ssml ? { ssml: opts.ssml } : { text: opts.text },
            voice: { languageCode: opts.languageCode, name: opts.voiceName },
            audioConfig: {
                audioEncoding: 'MP3',
                speakingRate: opts.rate != null
                    ? opts.rate
                    : (opts.languageCode.indexOf('yue') === 0 ? 0.95 : 0.96)
            }
        }),
        signal: ac.signal
    });
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok || !data.audioContent) {
        throw new Error((data.error && data.error.message) || ('google ' + res.status));
    }
    return 'data:audio/mp3;base64,' + data.audioContent;
}

/**
 * Fetch Google TTS audio (Chirp3 HD, with fallbacks).
 * opts: { text?, ssml?, lang: 'zh-HK'|'en-US', rate?, voices? }
 * Returns a data: URL.
 */
window.googleTtsFetch = async function (opts) {
    var options = opts || {};
    var settings = window.getVoiceSettings();
    var key = settings.googleKey;
    if (!key) throw new Error('no google key');
    var lang = options.lang || 'zh-HK';
    var isEn = lang === 'en-US';
    var prepared = options.ssml
        ? String(options.ssml)
        : window.prepareSpokenText(options.text || '', isEn ? 'en-US' : 'zh-HK');
    if (!prepared) throw new Error('無字');

    var cacheKey = (options.ssml ? 'ssml:' : '') + lang + ':' + prepared + ':' + (options.rate || '');
    if (window._ttsCache[cacheKey]) return window._ttsCache[cacheKey];

    var languageCode = isEn ? 'en-US' : 'yue-HK';
    var voices = options.voices;
    if (!voices || !voices.length) {
        voices = options.ssml
            ? GOOGLE_EN_SSML_VOICES
            : (isEn ? GOOGLE_EN_VOICES : yueVoiceList(settings.googleYueVoice));
    }

    var ac = new AbortController();
    window._ttsAbort = ac;
    var lastErr = 'Google TTS 失敗';
    for (var i = 0; i < voices.length; i++) {
        try {
            var url = await googleSynthesizeOnce({
                apiKey: key,
                languageCode: languageCode,
                voiceName: voices[i],
                text: options.ssml ? undefined : prepared.slice(0, 4000),
                ssml: options.ssml ? prepared : undefined,
                rate: options.rate,
                abort: ac
            });
            rememberTts(cacheKey, url);
            return url;
        } catch (err) {
            if (err && err.name === 'AbortError') throw err;
            lastErr = err && err.message ? err.message : lastErr;
        }
    }
    throw new Error(lastErr);
};

async function speakGoogleYue(text, settings) {
    var url = await window.googleTtsFetch({
        text: text,
        lang: 'zh-HK',
        voices: yueVoiceList(settings.googleYueVoice)
    });
    await playUrl(url, 'ui');
}

function playUrl(src, which) {
    return new Promise(function (resolve) {
        var slot = which === 'en' ? 'enAudio' : (which === 'magic' ? 'mAudio' : 'uiAudio');
        window[slot] = window[slot] || new Audio();
        var a = window[slot];
        a.onended = function () { a.onended = null; resolve(); };
        a.onerror = function () { a.onended = null; resolve(); };
        a.src = src;
        var p = a.play();
        if (p && typeof p.catch === 'function') {
            p.catch(function () { resolve(); });
        }
    });
}

function escapeXml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** Live percent / stroke HUD — never speak this (VoiceOver + TTS overlap). */
window.isSilentUiText = function (text) {
    var t = String(text || '').trim();
    if (!t) return true;
    if (/完成度/.test(t)) return true;
    if (/\d+\s*%/.test(t)) return true;
    if (/第\s*\d+\s*筆/.test(t)) return true;
    if (/^跟住綠點/.test(t)) return true;
    if (/^由綠色點出發/.test(t)) return true;
    if (/^第\s*\d+\s*\/\s*\d+\s*題/.test(t)) return true;
    if (/^\d+\s*\/\s*\d+$/.test(t)) return true;
    return false;
};

window.shouldAutoSpeak = function (opts) {
    var options = opts || {};
    if (window._screenReaderLikely) return false;
    var settings = window.getVoiceSettings ? window.getVoiceSettings() : { autoRead: true };
    if (!settings.autoRead && !options.force) return false;
    return true;
};

/** Core Cantonese speak — picks best available voice */
window.playCantoneseTTS = async function (text, opts) {
    var options = opts || {};
    var utter = String(text || '').trim();
    if (!utter) return;
    if (window.isSilentUiText && window.isSilentUiText(utter)) return;
    if (window._screenReaderLikely && !options.force) return;

    return window._enqueueVoice(function () {
        return window._speakCantoneseNow(utter, options);
    }, options.interrupt !== false);
};

window._speakCantoneseNow = async function (utter, options) {
    if (window.ZiziFX) window.ZiziFX.duckMusic(2.5);
    var token = window._speechToken;
    var settings = window.getVoiceSettings();
    window._lastAnnounce = utter;
    window._lastAnnounceAt = Date.now();

    var order = [];
    if (settings.provider === 'azure') order.push('azure', 'google', 'iphone');
    else if (settings.provider === 'iphone') order.push('iphone', 'google', 'azure');
    else order.push('google', 'iphone', 'azure');

    for (var i = 0; i < order.length; i++) {
        if (token !== window._speechToken) return;
        var p = order[i];
        try {
            if (p === 'azure' && settings.azureKey) {
                await speakAzureCantonese(utter, settings);
                return;
            }
            if (p === 'google' && settings.googleKey) {
                await speakGoogleYue(utter, settings);
                return;
            }
            if (p === 'iphone') {
                await window.speakCantoneseBrowser(utter, {
                    cancel: false,
                    rate: isAppleWebKit() ? 1 : 0.92
                });
                return;
            }
        } catch (e) {
            if (e && e.name === 'AbortError') return;
            console.warn('voice provider failed', p, e);
        }
    }

    if (token !== window._speechToken) return;
    if (options.requireKey) {
        if (window.openSettings) window.openSettings();
        return;
    }
    await window.speakCantoneseBrowser(utter, { cancel: false });
};

/**
 * Announce UI instructions. Queued on the same voice line — never stacks.
 */
window.announce = function (text, opts) {
    var options = opts || {};
    var utter = String(text || '').trim();
    if (!utter) return;
    if (window.isSilentUiText && window.isSilentUiText(utter)) return;
    if (!window.shouldAutoSpeak(options)) return;

    if (window._lastAnnounce === utter && Date.now() - (window._lastAnnounceAt || 0) < 2500) {
        return;
    }
    window._lastAnnounce = utter;
    window._lastAnnounceAt = Date.now();

    return window.playCantoneseTTS(utter, {
        interrupt: options.interrupt === true,
        force: options.force
    });
};

/** Speak English words/sounds with an English voice (never Cantonese TTS). */
window.speakEnglish = function (text, opts) {
    var options = opts || {};
    var utter = String(text || '').trim();
    if (!utter) return Promise.resolve();
    return window._enqueueVoice(function () {
        return window._speakEnglishNow(utter, options);
    }, options.interrupt === true);
};

window._speakEnglishNow = async function (utter, options) {
    var settings = window.getVoiceSettings();
    if (settings.googleKey && !options.forceBrowser) {
        try {
            return await window._speakGoogleEnglish(utter, options);
        } catch (e) {
            if (e && e.name === 'AbortError') return;
        }
    }
    if (!window.speechSynthesis) return;
    var prepared = window.prepareSpokenText(utter, 'en-US');
    if (!prepared) return;
    await waitForVoices();
    return new Promise(function (resolve) {
        try {
            var u = new SpeechSynthesisUtterance(prepared);
            var voice = pickEnglishVoice();
            var skip = voice && isChineseVoice(voice);
            if (voice && !skip) {
                u.voice = voice;
                u.lang = voice.lang || options.lang || 'en-US';
            } else {
                u.lang = options.lang || 'en-US';
            }
            u.rate = options.rate != null ? options.rate : (isAppleWebKit() ? 1 : 0.95);
            u.pitch = 1;
            u.onend = function () { resolve(); };
            u.onerror = function () { resolve(); };
            window.speechSynthesis.speak(u);
        } catch (e) {
            console.warn('speakEnglish failed', e);
            resolve();
        }
    });
};

window._speakGoogleEnglish = async function (text, opts) {
    var options = opts || {};
    var url = await window.googleTtsFetch({
        text: text,
        lang: 'en-US',
        rate: options.rate,
        voices: GOOGLE_EN_VOICES
    });
    await playUrl(url, 'en');
};

/** Watch text nodes / status messages and read them aloud */
window.startInstructionReader = function () {
    var ids = ['msg', 'game-msg', 'loading-msg'];
    ids.forEach(function (id) {
        var el = document.getElementById(id);
        if (!el || el._announceBound) return;
        el._announceBound = true;
        var obs = new MutationObserver(function () {
            if (el.getAttribute('data-silent') === '1') return;
            var text = (el.innerText || el.textContent || '').trim();
            if (!text) return;
            if (window.isSilentUiText && window.isSilentUiText(text)) return;
            window.announce(text, { interrupt: false });
        });
        obs.observe(el, { childList: true, characterData: true, subtree: true });
    });
};

window.announceHomeMenu = function () {
    window.unlockAudio();
    if (window.ZiziFX) {
        window.ZiziFX.play('tap');
        window.ZiziFX.duckMusic(4);
    }
    var info = window.getLevelInfo && window.getProgress
        ? window.getLevelInfo(window.getProgress().stars)
        : null;
        var levelBit = info
        ? ('你而家係第 ' + info.level + ' 級，' + info.title + '。')
        : '';
    window.announce(
        '歡迎嚟到孜孜學英文天空島！' + levelBit +
        '今日想玩咩？綠色嘅睇圖識字最啱開始。' +
        '仲有描字賽車、音爆射擊、魔鏡捉迷藏、搵唔同、同單詞冊。' +
        '做完今日任務會升得更快！'
    , { force: true });
};

if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = function () { pickIphoneCantoneseVoice(); };
}

window.addEventListener('pointerdown', function () {
    window._lastPointerAt = Date.now();
}, true);

window.addEventListener('focusin', function () {
    if (Date.now() - (window._lastPointerAt || 0) > 450) {
        window._screenReaderLikely = true;
    }
}, true);

window.addEventListener('load', function () {
    window.startInstructionReader();
});
