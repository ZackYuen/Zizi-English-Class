const canvas = document.getElementById('letter-canvas');
const ctx = canvas.getContext('2d');
let drawing = false;

// 設定筆觸
ctx.lineWidth = 10;
ctx.lineCap = 'round';
ctx.strokeStyle = '#1d3557';

function getPos(e) {
    let rect = canvas.getBoundingClientRect();
    let clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
    let clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
    return { x: clientX - rect.left, y: clientY - rect.top };
}

canvas.addEventListener('mousedown', (e) => { drawing = true; ctx.beginPath(); });
canvas.addEventListener('mousemove', (e) => {
    if(!drawing) return;
    let pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
});
canvas.addEventListener('mouseup', () => drawing = false);

// iPhone 專用觸控支援
canvas.addEventListener('touchstart', (e) => { 
    e.preventDefault(); // 防止 iPhone 畫面跳動
    drawing = true; 
    ctx.beginPath(); 
});
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if(!drawing) return;
    let pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
}, { passive: false });
canvas.addEventListener('touchend', () => drawing = false);
