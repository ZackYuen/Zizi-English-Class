// ==========================================
// 🎮 聽音大挑戰 (a, e, i) 遊戲模組 (動態反應版)
// ==========================================

window.currentGameTarget = '';
window.currentWord = '';
window.currentEmoji = '';
window.lastWord = ''; 
window.currentChoices = {}; 
window.gameAudio = new Audio();
window.isGamePlaying = false;
window.isGameProcessing = false; 

window.gameNextTimeout = null;
window.gameReplayTimeout = null;

const gameWordBank = {
    'A': [
        { w: 'ant', e: '🐜' }, { w: 'cat', e: '🐱' }, { w: 'bat', e: '🦇' },
        { w: 'hat', e: '🎩' }, { w: 'map', e: '🗺️' }, { w: 'pan', e: '🍳' }
    ],
    'E':
