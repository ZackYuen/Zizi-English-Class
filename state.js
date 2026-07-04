// 全局狀態與共享變數管理
window.currentMode = 'standard'; 
window.idx = 0;
window.isMagic = false;
window.magicStart = 0;
window.fired = false;
window.strokeIdx = 0;
window.doneStrokes = [];
window.curStroke = [];
window.isDrawing = false;
window.currentWPs = [];
window.nextWpIdx = 0;
window.currentPercent = 0;
window.lastCalc = 0;
window.guideData = null;
window.totalGuide = 0;

window.cvs = document.getElementById('cvs');
window.ctx = window.cvs ? window.cvs.getContext('2d', {willReadFrequently:true}) : null;
window.offCvs = document.createElement('canvas'); window.offCvs.width = 300; window.offCvs.height = 300;
window.offCtx = window.offCvs.getContext('2d', {willReadFrequently:true});
window.userCvs = document.createElement('canvas'); window.userCvs.width = 300; window.userCvs.height = 300;
window.userCtx = window.userCvs.getContext('2d', {willReadFrequently:true});

window.aCtx = null;
window.mAudio = new Audio();
window.imgCache = {};
window.stream = null;
