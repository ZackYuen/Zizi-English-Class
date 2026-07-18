// ==========================================
// Deploy-time secrets (filled by GitHub Actions)
// Keep this file EMPTY in git. Real values are written
// into the Pages artifact from repository Secrets.
// ==========================================
window.ZIZI_SECRETS = {
    googleTtsKey: '',
    openRouterKey: '',
    azureSpeechKey: '',
    azureSpeechRegion: 'eastasia',
    // optional default: 'azure' | 'iphone' | 'google'
    voiceProvider: ''
};
