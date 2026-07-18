// ==========================================
// Speech engine for 5-year-olds
// - Reads ALL Cantonese instructions aloud
// - Voice providers (best → ok):
//   1) Azure Neural zh-HK-HiuMaanNeural (most natural cloud voice)
//   2) iPhone / browser Siri Cantonese (often nicer than Google Standard)
//   3) Google yue-HK Standard (fallback)
// ==========================================

window._speechQueue = [];
window._speechBusy = false;
window._speechToken = 0;
window._audioUnlocked = false;

window.getVoiceSettings = function () {
    var deployedProvider = (window.ZIZI_SECRETS && window.ZIZI_SECRETS.voiceProvider) || '';
    var azureKey = window.getApiKey
        ? window.getApiKey('azure_speech_key')
        : (localStorage.getItem('azure_speech_key') || '');
    // If Pages injected Azure and no local provider choice, prefer azure
    var defaultProvider = localStorage.getItem('zizi_voice_provider')
        || deployedProvider
        || (azureKey ? 'azure' : 'iphone');
    return {
        // azure | iphone | google
        provider: defaultProvider || 'iphone',
        azureKey: azureKey,
        azureRegion: window.getApiKey
            ? window.getApiKey('azure_speech_region')
            : (localStorage.getItem('azure_speech_region') || 'eastasia'),
        azureVoice: localStorage.getItem('azure_voice_name') || 'zh-HK-HiuMaanNeural',
        googleKey: window.getApiKey
            ? window.getApiKey('google_tts_key')
            : (localStorage.getItem('google_tts_key') || ''),
        googleYueVoice: localStorage.getItem('google_yue_voice') || 'yue-HK-Standard-C',
        autoRead: localStorage.getItem('zizi_auto_read') !== '0' // default ON
    };
};

window.unlockAudio = function () {
    window._audioUnlocked = true;
    if (window.ensureAudioContext) window.ensureAudioContext();
    // Warm up speechSynthesis on iOS (needs a user gesture)
    if (window.speechSynthesis) {
        try {
            window.speechSynthesis.cancel();
            const warm = new SpeechSynthesisUtterance(' ');
            warm.volume = 0;
            warm.rate = 1;
            window.speechSynthesis.speak(warm);
            window.speechSynthesis.cancel();
        } catch (e) { /* ignore */ }
    }
};

window.stopSpeech = function () {
    window._speechToken += 1;
    window._speechQueue = [];
    window._speechBusy = false;
    if (window.speechSynthesis) {
        try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    }
    if (window.uiAudio) {
        try {
            window.uiAudio.pause();
            window.uiAudio.onended = null;
            window.uiAudio.currentTime = 0;
        } catch (e) { /* ignore */ }
    }
};

function pickIphoneCantoneseVoice() {
    if (!window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    const preferred = [
        /sinji/i, /ting-?ting/i, /meijia/i, /susan/i,
        /zh[-_]?hk/i, /yue/i, /cantonese/i, /香港|粤|粵/
    ];
    for (let i = 0; i < preferred.length; i++) {
        const re = preferred[i];
        const hit = voices.find(function (v) {
            return re.test(v.name) || re.test(v.lang);
        });
        if (hit) return hit;
    }
    return voices.find(function (v) {
        return (v.lang || '').toLowerCase().indexOf('zh-hk') === 0;
    }) || null;
}

window.speakCantoneseBrowser = function (text, opts) {
    const options = opts || {};
    if (!window.speechSynthesis) return Promise.resolve();
    return new Promise(function (resolve) {
        try {
            // Don't cancel if we're mid-queue item unless forced
            if (options.cancel !== false) window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(String(text || ''));
            u.lang = 'zh-HK';
            u.rate = options.rate != null ? options.rate : 0.92;
            u.pitch = 1.05;
            const voice = pickIphoneCantoneseVoice();
            if (voice) u.voice = voice;
            u.onend = function () { resolve(); };
            u.onerror = function () { resolve(); };
            window.speechSynthesis.speak(u);
        } catch (e) {
            console.warn('speakCantoneseBrowser failed', e);
            resolve();
        }
    });
};

async function speakAzureCantonese(text, settings) {
    const key = settings.azureKey;
    const region = settings.azureRegion || 'eastasia';
    const voice = settings.azureVoice || 'zh-HK-HiuMaanNeural';
    if (!key) throw new Error('no azure key');

    const ssml =
        "<speak version='1.0' xml:lang='zh-HK'>" +
        "<voice name='" + voice + "'>" +
        "<prosody rate='-5%' pitch='+5%'>" + escapeXml(text) + '</prosody>' +
        '</voice></speak>';

    const res = await fetch('https://' + region + '.tts.speech.microsoft.com/cognitiveservices/v1', {
        method: 'POST',
        headers: {
            'Ocp-Apim-Subscription-Key': key,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
            'User-Agent': 'ZiziEnglishClass'
        },
        body: ssml
    });
    if (!res.ok) throw new Error('azure ' + res.status);
    const buf = await res.arrayBuffer();
    const blob = new Blob([buf], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    await playUrl(url);
    URL.revokeObjectURL(url);
}

async function speakGoogleYue(text, settings) {
    const key = settings.googleKey;
    if (!key) throw new Error('no google key');
    const voiceName = settings.googleYueVoice || 'yue-HK-Standard-C';
    const res = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize?key=' + key, {
        method: 'POST',
        body: JSON.stringify({
            input: { text: text },
            voice: { languageCode: 'yue-HK', name: voiceName },
            audioConfig: { audioEncoding: 'MP3', speakingRate: 0.95, pitch: 1.0 }
        })
    });
    const data = await res.json();
    if (!data.audioContent) throw new Error('google empty');
    await playUrl('data:audio/mp3;base64,' + data.audioContent);
}

function playUrl(src) {
    return new Promise(function (resolve) {
        window.uiAudio = window.uiAudio || new Audio();
        const a = window.uiAudio;
        a.onended = function () { a.onended = null; resolve(); };
        a.onerror = function () { a.onended = null; resolve(); };
        a.src = src;
        const p = a.play();
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

/** Core Cantonese speak — picks best available voice */
window.playCantoneseTTS = async function (text, opts) {
    if (window.ZiziFX) window.ZiziFX.duckMusic(2.5);
    const options = opts || {};
    const utter = String(text || '').trim();
    if (!utter) return;

    if (options.interrupt !== false) {
        // Stop previous instruction audio, but keep game English channel if requested
        window._speechToken += 1;
        window._speechQueue = [];
        if (window.speechSynthesis) {
            try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
        }
        if (window.uiAudio) {
            try { window.uiAudio.pause(); window.uiAudio.onended = null; } catch (e) { /* ignore */ }
        }
    }

    const token = window._speechToken;
    const settings = window.getVoiceSettings();
    window._lastAnnounce = utter;
    window._lastAnnounceAt = Date.now();

    // Provider preference with automatic fallback
    const order = [];
    if (settings.provider === 'azure') order.push('azure', 'iphone', 'google');
    else if (settings.provider === 'google') order.push('google', 'iphone', 'azure');
    else order.push('iphone', 'azure', 'google');

    for (let i = 0; i < order.length; i++) {
        if (token !== window._speechToken) return;
        const p = order[i];
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
                await window.speakCantoneseBrowser(utter, { cancel: false, rate: 0.92 });
                return;
            }
        } catch (e) {
            console.warn('voice provider failed', p, e);
        }
    }

    // Last resort
    if (options.requireKey) {
        if (window.openSettings) window.openSettings();
        return;
    }
    await window.speakCantoneseBrowser(utter, { cancel: false });
};

/**
 * Announce UI instructions (queued, auto-read).
 * Use for every on-screen instruction the boy needs to hear.
 */
window.announce = function (text, opts) {
    const options = opts || {};
    const utter = String(text || '').trim();
    if (!utter) return;

    const settings = window.getVoiceSettings();
    if (!settings.autoRead && !options.force) return;

    // Dedupe identical back-to-back announces
    if (window._lastAnnounce === utter && Date.now() - (window._lastAnnounceAt || 0) < 2500) {
        return;
    }
    window._lastAnnounce = utter;
    window._lastAnnounceAt = Date.now();

    if (options.interrupt !== false) {
        window.playCantoneseTTS(utter, { interrupt: true });
        return;
    }

    window._speechQueue.push(utter);
    window._drainSpeechQueue();
};

window._drainSpeechQueue = async function () {
    if (window._speechBusy) return;
    window._speechBusy = true;
    while (window._speechQueue.length) {
        const next = window._speechQueue.shift();
        await window.playCantoneseTTS(next, { interrupt: false });
    }
    window._speechBusy = false;
};

function pickEnglishVoice() {
    if (!window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    const preferred = [
        /samantha/i, /karen/i, /moira/i, /serena/i, /martha/i,
        /en[-_]?us/i, /en[-_]?gb/i, /english/i
    ];
    for (let i = 0; i < preferred.length; i++) {
        const re = preferred[i];
        const hit = voices.find(function (v) {
            return re.test(v.name) || re.test(v.lang);
        });
        if (hit) return hit;
    }
    return voices.find(function (v) {
        return (v.lang || '').toLowerCase().indexOf('en') === 0;
    }) || null;
}

/** Speak English words/sounds with an English voice (never Cantonese TTS). */
window.speakEnglish = function (text, opts) {
    const options = opts || {};
    const utter = String(text || '').trim();
    if (!utter) return Promise.resolve();

    const key = window.getApiKey ? window.getApiKey('google_tts_key') : localStorage.getItem('google_tts_key');
    if (key && !options.forceBrowser) {
        return window._speakGoogleEnglish(utter, options);
    }

    if (!window.speechSynthesis) return Promise.resolve();
    return new Promise(function (resolve) {
        try {
            if (options.cancel !== false) {
                try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
            }
            const u = new SpeechSynthesisUtterance(utter);
            u.lang = options.lang || 'en-US';
            u.rate = options.rate != null ? options.rate : 0.88;
            u.pitch = 1.05;
            const voice = pickEnglishVoice();
            if (voice) u.voice = voice;
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
    const key = window.getApiKey ? window.getApiKey('google_tts_key') : localStorage.getItem('google_tts_key');
    if (!key) {
        return window.speakEnglish(text, { forceBrowser: true, rate: (opts && opts.rate) || 0.88 });
    }
    try {
        const res = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize?key=' + key, {
            method: 'POST',
            body: JSON.stringify({
                input: { text: text },
                voice: { languageCode: 'en-US', name: 'en-US-Neural2-F' },
                audioConfig: { audioEncoding: 'MP3', speakingRate: (opts && opts.rate) || 0.88 }
            })
        });
        const data = await res.json();
        if (data.audioContent) {
            window.enAudio = window.enAudio || new Audio();
            const a = window.enAudio;
            a.src = 'data:audio/mp3;base64,' + data.audioContent;
            await new Promise(function (resolve) {
                a.onended = function () { a.onended = null; resolve(); };
                a.onerror = function () { a.onended = null; resolve(); };
                a.play().catch(function () { resolve(); });
            });
            return;
        }
        return window.speakEnglish(text, { forceBrowser: true });
    } catch (e) {
        return window.speakEnglish(text, { forceBrowser: true });
    }
};

/** Watch text nodes / status messages and read them aloud */
window.startInstructionReader = function () {
    const ids = ['msg', 'game-msg', 'loading-msg'];
    ids.forEach(function (id) {
        const el = document.getElementById(id);
        if (!el || el._announceBound) return;
        el._announceBound = true;
        const obs = new MutationObserver(function () {
            const text = (el.innerText || el.textContent || '').trim();
            if (!text) return;
            // Skip pure percent spam mid-stroke unless complete/special
            if (/^完成度:\s*\d+% \(第/.test(text)) return;
            window.announce(text);
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
        '仲有手指描字、聽音大挑戰、探索魔鏡、同單詞冊。' +
        '做完今日任務會升得更快！'
    , { force: true });
};

// iOS loads voices asynchronously
if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = function () { pickIphoneCantoneseVoice(); };
}

window.addEventListener('load', function () {
    window.startInstructionReader();
});
