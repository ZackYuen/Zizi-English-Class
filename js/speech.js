// ==========================================
// Speech helpers — works without API keys
// Google TTS preferred; Web Speech API fallback (iPhone Safari OK)
// ==========================================

window.speakEnglish = function (text, opts) {
    const options = opts || {};
    const utter = String(text || '').trim();
    if (!utter) return;

    // Prefer Google TTS if key present (clearer kid voice)
    const key = localStorage.getItem('google_tts_key');
    if (key && !options.forceBrowser) {
        window._speakGoogleEnglish(utter, options);
        return;
    }

    if (!window.speechSynthesis) return;
    try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(utter);
        u.lang = options.lang || 'en-US';
        u.rate = options.rate != null ? options.rate : 0.9;
        u.pitch = 1.05;
        window.speechSynthesis.speak(u);
    } catch (e) {
        console.warn('speakEnglish failed', e);
    }
};

window.speakCantoneseBrowser = function (text) {
    if (!window.speechSynthesis) return;
    try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(String(text || ''));
        u.lang = 'zh-HK';
        u.rate = 0.95;
        window.speechSynthesis.speak(u);
    } catch (e) {
        console.warn('speakCantoneseBrowser failed', e);
    }
};

window._speakGoogleEnglish = async function (text, opts) {
    const key = localStorage.getItem('google_tts_key');
    if (!key) {
        window.speakEnglish(text, { forceBrowser: true, rate: (opts && opts.rate) || 0.9 });
        return;
    }
    try {
        if (window.stopAllAudio) {
            // don't wipe tokens aggressively for short words — just pause mAudio/ui
            if (window.mAudio) { try { window.mAudio.pause(); } catch (e) {} }
        }
        const res = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize?key=' + key, {
            method: 'POST',
            body: JSON.stringify({
                input: { text: text },
                voice: { languageCode: 'en-US', name: 'en-US-Wavenet-F' },
                audioConfig: { audioEncoding: 'MP3', speakingRate: (opts && opts.rate) || 0.9 }
            })
        });
        const data = await res.json();
        if (data.audioContent) {
            window.uiAudio = window.uiAudio || new Audio();
            window.uiAudio.src = 'data:audio/mp3;base64,' + data.audioContent;
            window.uiAudio.play().catch(function () { /* ignore */ });
        } else {
            window.speakEnglish(text, { forceBrowser: true });
        }
    } catch (e) {
        window.speakEnglish(text, { forceBrowser: true });
    }
};
