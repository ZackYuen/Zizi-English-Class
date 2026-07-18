// ==========================================
// API key resolution for family GitHub Pages deploy
// Priority: localStorage (Settings override) → ZIZI_SECRETS (Pages inject)
// Note: anything sent to the browser can be inspected; this keeps keys
// out of git, which is the goal for a private family app.
// ==========================================

window.ZIZI_SECRETS = window.ZIZI_SECRETS || {
    googleTtsKey: '',
    openRouterKey: '',
    azureSpeechKey: '',
    azureSpeechRegion: 'eastasia',
    voiceProvider: ''
};

/**
 * @param {'google_tts_key'|'openrouter_api_key'|'azure_speech_key'|'azure_speech_region'} name
 * @returns {string}
 */
window.getApiKey = function (name) {
    try {
        var local = localStorage.getItem(name);
        if (local && String(local).trim()) return String(local).trim();
    } catch (e) { /* ignore */ }

    var s = window.ZIZI_SECRETS || {};
    if (name === 'google_tts_key') return String(s.googleTtsKey || '').trim();
    if (name === 'openrouter_api_key') return String(s.openRouterKey || '').trim();
    if (name === 'azure_speech_key') return String(s.azureSpeechKey || '').trim();
    if (name === 'azure_speech_region') {
        return String(s.azureSpeechRegion || 'eastasia').trim() || 'eastasia';
    }
    return '';
};

window.hasDeployedSecrets = function () {
    var s = window.ZIZI_SECRETS || {};
    return !!(
        (s.googleTtsKey && String(s.googleTtsKey).trim()) ||
        (s.openRouterKey && String(s.openRouterKey).trim()) ||
        (s.azureSpeechKey && String(s.azureSpeechKey).trim())
    );
};

window.getDeployedSecretFlags = function () {
    var s = window.ZIZI_SECRETS || {};
    return {
        google: !!(s.googleTtsKey && String(s.googleTtsKey).trim()),
        openRouter: !!(s.openRouterKey && String(s.openRouterKey).trim()),
        azure: !!(s.azureSpeechKey && String(s.azureSpeechKey).trim()),
        region: String((s.azureSpeechRegion || 'eastasia')).trim() || 'eastasia',
        voiceProvider: String(s.voiceProvider || '').trim()
    };
};

/** Update Settings UI badge: which keys came from GitHub Pages */
window.refreshSecretsStatus = function () {
    var el = document.getElementById('secrets-status');
    if (!el) return;
    var flags = window.getDeployedSecretFlags();
    if (!flags.google && !flags.openRouter && !flags.azure) {
        el.textContent = '未偵測到 GitHub Pages 注入嘅 Key。可以喺下面手動填，或者喺 Repo → Settings → Secrets 加好再 Deploy。';
        el.className = 'secrets-status is-empty';
        return;
    }
    var bits = [];
    if (flags.google) bits.push('Google TTS ✓');
    if (flags.azure) bits.push('Azure ✓');
    if (flags.openRouter) bits.push('OpenRouter ✓');
    el.textContent = 'GitHub Pages 已注入：' + bits.join(' · ') +
        '（唔使再填；下面留空都用得。手動填會覆蓋注入值。）';
    el.className = 'secrets-status is-ready';
};
