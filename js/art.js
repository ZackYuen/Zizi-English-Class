// ==========================================
// ZiziArt — hand-drawn flat vocab art on canvas
// No emoji: every picture is drawn with shapes.
// ==========================================

(function () {
    function hash(s) {
        var h = 0;
        for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
        return h;
    }
    function col(i) {
        var cs = ['#ff8c42', '#2ecc71', '#4dabf7', '#9b5de5', '#ff6b6b', '#f4a261', '#e76f51', '#2a9d8f'];
        return cs[i % cs.length];
    }
    function text(ctx, word, x, y, size) {
        ctx.fillStyle = '#123b63';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '800 ' + size + 'px Fredoka, sans-serif';
        ctx.fillText(word, x, y);
    }
    function eye(ctx, x, y, r) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1d3557';
        ctx.beginPath();
        ctx.arc(x + r * 0.2, y, r * 0.45, 0, Math.PI * 2);
        ctx.fill();
    }
    function generic(ctx, x, y, s, word) {
        ctx.fillStyle = col(hash(word) % 8);
        ctx.beginPath();
        ctx.arc(x, y, s * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#123b63';
        ctx.lineWidth = s * 0.05;
        ctx.stroke();
    }

    var draw = {
        ant: function (c, x, y, s) {
            c.fillStyle = '#8d5524';
            [x - s * 0.28, x, x + s * 0.28].forEach(function (cx) {
                c.beginPath(); c.arc(cx, y, s * 0.18, 0, Math.PI * 2); c.fill();
            });
            eye(c, x + s * 0.34, y - s * 0.05, s * 0.06);
        },
        apple: function (c, x, y, s) {
            c.fillStyle = '#e63946';
            c.beginPath(); c.arc(x, y + s * 0.06, s * 0.34, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#2ecc71';
            c.beginPath(); c.ellipse(x + s * 0.12, y - s * 0.3, s * 0.16, s * 0.07, 0.6, 0, Math.PI * 2); c.fill();
        },
        car: function (c, x, y, s) {
            c.fillStyle = '#e63946';
            c.fillRect(x - s * 0.4, y - s * 0.12, s * 0.8, s * 0.24);
            c.fillRect(x - s * 0.2, y - s * 0.28, s * 0.42, s * 0.2);
            c.fillStyle = '#1f1f1f';
            [x - s * 0.22, x + s * 0.22].forEach(function (wx) {
                c.beginPath(); c.arc(wx, y + s * 0.14, s * 0.11, 0, Math.PI * 2); c.fill();
            });
            c.fillStyle = '#cfd8dc';
            [x - s * 0.22, x + s * 0.22].forEach(function (wx) {
                c.beginPath(); c.arc(wx, y + s * 0.14, s * 0.05, 0, Math.PI * 2); c.fill();
            });
        },
        bus: function (c, x, y, s) {
            c.fillStyle = '#f4a261';
            c.fillRect(x - s * 0.44, y - s * 0.26, s * 0.88, s * 0.5);
            c.fillStyle = '#fff';
            for (var i = 0; i < 3; i++) c.fillRect(x - s * 0.34 + i * s * 0.24, y - s * 0.18, s * 0.16, s * 0.14);
            c.fillStyle = '#1f1f1f';
            [x - s * 0.26, x + s * 0.26].forEach(function (wx) {
                c.beginPath(); c.arc(wx, y + s * 0.26, s * 0.11, 0, Math.PI * 2); c.fill();
            });
        },
        cat: function (c, x, y, s) {
            c.fillStyle = '#f4a261';
            c.beginPath(); c.arc(x, y, s * 0.36, 0, Math.PI * 2); c.fill();
            c.beginPath();
            c.moveTo(x - s * 0.28, y - s * 0.3);
            c.lineTo(x - s * 0.36, y - s * 0.48);
            c.lineTo(x - s * 0.14, y - s * 0.36);
            c.closePath(); c.fill();
            c.beginPath();
            c.moveTo(x + s * 0.28, y - s * 0.3);
            c.lineTo(x + s * 0.36, y - s * 0.48);
            c.lineTo(x + s * 0.14, y - s * 0.36);
            c.closePath(); c.fill();
            eye(c, x - s * 0.12, y - s * 0.04, s * 0.08);
            eye(c, x + s * 0.12, y - s * 0.04, s * 0.08);
        },
        dog: function (c, x, y, s) {
            c.fillStyle = '#8d5524';
            c.beginPath(); c.arc(x, y, s * 0.36, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.ellipse(x - s * 0.34, y - s * 0.1, s * 0.14, s * 0.26, 0.4, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.ellipse(x + s * 0.34, y - s * 0.1, s * 0.14, s * 0.26, -0.4, 0, Math.PI * 2); c.fill();
            eye(c, x - s * 0.12, y - s * 0.02, s * 0.08);
            eye(c, x + s * 0.12, y - s * 0.02, s * 0.08);
            c.fillStyle = '#333';
            c.beginPath(); c.arc(x, y + s * 0.14, s * 0.07, 0, Math.PI * 2); c.fill();
        },
        pig: function (c, x, y, s) {
            c.fillStyle = '#ff8fab';
            c.beginPath(); c.arc(x, y, s * 0.36, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#f2a1b6';
            c.beginPath(); c.arc(x, y + s * 0.06, s * 0.15, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#7a1f3d';
            c.beginPath(); c.arc(x - s * 0.05, y + s * 0.06, s * 0.025, 0, Math.PI * 2);
            c.arc(x + s * 0.05, y + s * 0.06, s * 0.025, 0, Math.PI * 2); c.fill();
            eye(c, x - s * 0.12, y - s * 0.12, s * 0.08);
            eye(c, x + s * 0.12, y - s * 0.12, s * 0.08);
        },
        sun: function (c, x, y, s) {
            c.fillStyle = '#ffc93c';
            for (var i = 0; i < 8; i++) {
                var a = (i / 8) * Math.PI * 2;
                c.beginPath();
                c.arc(x + Math.cos(a) * s * 0.4, y + Math.sin(a) * s * 0.4, s * 0.1, 0, Math.PI * 2);
                c.fill();
            }
            c.beginPath(); c.arc(x, y, s * 0.3, 0, Math.PI * 2); c.fill();
            eye(c, x - s * 0.09, y - s * 0.04, s * 0.05);
            eye(c, x + s * 0.09, y - s * 0.04, s * 0.05);
        },
        rocket: function (c, x, y, s) {
            c.fillStyle = '#4dabf7';
            c.beginPath();
            c.moveTo(x, y - s * 0.46);
            c.quadraticCurveTo(x + s * 0.26, y, x + s * 0.16, y + s * 0.3);
            c.lineTo(x - s * 0.16, y + s * 0.3);
            c.quadraticCurveTo(x - s * 0.26, y, x, y - s * 0.46);
            c.fill();
            c.fillStyle = '#e63946';
            c.beginPath();
            c.moveTo(x, y - s * 0.46);
            c.quadraticCurveTo(x + s * 0.12, y - s * 0.22, x, y - s * 0.2);
            c.quadraticCurveTo(x - s * 0.12, y - s * 0.22, x, y - s * 0.46);
            c.fill();
            eye(c, x, y - s * 0.05, s * 0.08);
        }
    };

    window.ZiziArt = {
        drawWord: function (ctx, word, x, y, s) {
            var key = String(word || '').toLowerCase();
            if (draw[key]) {
                draw[key](ctx, x, y, s);
            } else {
                generic(ctx, x, y, s, key);
                text(ctx, key.slice(0, 4), x, y + s * 0.02, s * 0.2);
            }
        },
        color: col
    };
})();
