// ==========================================
// ZiziArt — Japanese picture-book vocab art
// Same ehon look as 小學預備 (ZiZiPrimaryPrep):
// warm paper, watercolor wash, soft ink edges.
// No emoji: every picture is drawn with shapes.
// ==========================================

(function () {
    var INK = '#243e4a';
    var PAPER = '#fffdf7';
    function hash(s) {
        var h = 0;
        for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
        return h;
    }
    function col(i) {
        var cs = ['#d9a066', '#79aa82', '#6faebc', '#8b7e9e', '#d97860', '#e9bd55', '#c4894d', '#6f8f7a'];
        return cs[i % cs.length];
    }
    function ink(c, s, w) {
        c.strokeStyle = INK;
        c.lineWidth = Math.max(1.2, s * (w || 0.036));
        c.lineJoin = 'round';
        c.lineCap = 'round';
    }
    function wash(c, x, y, r, color) {
        c.fillStyle = color;
        c.beginPath();
        c.arc(x, y, r, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = 'rgba(255,253,247,0.32)';
        c.beginPath();
        c.arc(x - r * 0.28, y - r * 0.3, r * 0.4, 0, Math.PI * 2);
        c.fill();
    }
    function disk(c, x, y, r, color, s, w) {
        wash(c, x, y, r, color);
        ink(c, s, w);
        c.beginPath();
        c.arc(x, y, r, 0, Math.PI * 2);
        c.stroke();
    }
    function oval(c, x, y, rx, ry, color, s, rot) {
        c.fillStyle = color;
        c.beginPath();
        c.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = 'rgba(255,253,247,0.28)';
        c.beginPath();
        c.ellipse(x - rx * 0.25, y - ry * 0.3, rx * 0.4, ry * 0.4, rot || 0, 0, Math.PI * 2);
        c.fill();
        if (s) {
            ink(c, s);
            c.beginPath();
            c.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2);
            c.stroke();
        }
    }
    function poly(c, pts, color, s) {
        c.fillStyle = color;
        c.beginPath();
        c.moveTo(pts[0], pts[1]);
        for (var i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
        c.closePath();
        c.fill();
        if (s) { ink(c, s); c.stroke(); }
    }
    function eye(c, x, y, r) {
        c.fillStyle = '#fff';
        c.beginPath();
        c.arc(x, y, r, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = INK;
        c.beginPath();
        c.arc(x + r * 0.2, y, r * 0.45, 0, Math.PI * 2);
        c.fill();
    }
    function eyes(c, x, y, s, gap) {
        var g = gap == null ? 0.12 : gap;
        eye(c, x - s * g, y, s * 0.055);
        eye(c, x + s * g, y, s * 0.055);
    }
    function smile(c, x, y, s) {
        ink(c, s, 0.03);
        c.beginPath();
        c.arc(x, y, s * 0.1, 0.15, Math.PI - 0.15);
        c.stroke();
    }
    function leafOf(c, x, y, s, rot) {
        c.save();
        c.translate(x, y);
        c.rotate(rot || 0);
        oval(c, 0, 0, s * 0.16, s * 0.07, '#79aa82', s, 0.5);
        c.restore();
    }
    function limb(c, x1, y1, x2, y2, w, color) {
        c.strokeStyle = color;
        c.lineWidth = w;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(x1, y1);
        c.lineTo(x2, y2);
        c.stroke();
    }
    function wheels(c, y, s, xs) {
        for (var i = 0; i < xs.length; i++) {
            disk(c, xs[i], y, s * 0.1, INK, s, 0.03);
            disk(c, xs[i], y, s * 0.045, '#cfd8dc', s, 0.02);
        }
    }

    function fruitOf(c, x, y, s, color) {
        disk(c, x, y + s * 0.06, s * 0.32, color, s);
        c.fillStyle = '#5c3d2e';
        c.fillRect(x - s * 0.02, y - s * 0.32, s * 0.04, s * 0.14);
        leafOf(c, x + s * 0.14, y - s * 0.28, s, 0.5);
    }
    function fruit(color) {
        return function (c, x, y, s) { fruitOf(c, x, y, s, color); };
    }
    function bananaOf(c, x, y, s) {
        c.fillStyle = '#e9bd55';
        c.beginPath();
        c.ellipse(x, y, s * 0.34, s * 0.16, 0.5, 0, Math.PI * 2);
        c.fill();
        ink(c, s);
        c.stroke();
        c.fillStyle = '#6f8f7a';
        c.beginPath();
        c.arc(x - s * 0.3, y - s * 0.16, s * 0.05, 0, Math.PI * 2);
        c.fill();
    }
    function grapesOf(c, x, y, s, color) {
        color = color || '#8b7e9e';
        [[0, 0.12], [-0.14, 0.02], [0.14, 0.02], [-0.08, -0.12], [0.08, -0.12], [0, -0.22]].forEach(function (p) {
            disk(c, x + s * p[0], y + s * p[1], s * 0.11, color, s, 0.025);
        });
        leafOf(c, x + s * 0.18, y - s * 0.32, s, 0.2);
    }
    function melonOf(c, x, y, s) {
        poly(c, [x - s * 0.38, y + s * 0.22, x + s * 0.38, y + s * 0.22, x, y - s * 0.34], '#d97860', s);
        poly(c, [x - s * 0.28, y + s * 0.18, x + s * 0.28, y + s * 0.18, x, y - s * 0.2], '#fffdf7', false);
        c.fillStyle = '#79aa82';
        c.beginPath();
        c.arc(x - s * 0.08, y + s * 0.04, s * 0.035, 0, Math.PI * 2);
        c.arc(x + s * 0.1, y + s * 0.08, s * 0.03, 0, Math.PI * 2);
        c.fill();
    }

    function drawCritter(c, x, y, s, kind, color) {
        color = color || '#d9a066';
        if (kind === 'pig') color = '#e2a3ab';
        if (kind === 'panda') color = '#f4eee0';
        if (kind === 'elephant' || kind === 'hippo' || kind === 'mouse' || kind === 'koala') color = color || '#b7c0c6';
        disk(c, x, y + s * 0.08, s * 0.32, color, s);
        if (kind === 'cat' || kind === 'fox' || kind === 'wolf' || kind === 'tiger') {
            poly(c, [x - s * 0.22, y - s * 0.18, x - s * 0.34, y - s * 0.42, x - s * 0.06, y - s * 0.28], color, s);
            poly(c, [x + s * 0.22, y - s * 0.18, x + s * 0.34, y - s * 0.42, x + s * 0.06, y - s * 0.28], color, s);
        } else if (kind === 'dog' || kind === 'puppy' || kind === 'bear') {
            oval(c, x - s * 0.28, y - s * 0.08, s * 0.12, s * 0.2, color, s, 0.4);
            oval(c, x + s * 0.28, y - s * 0.08, s * 0.12, s * 0.2, color, s, -0.4);
        } else if (kind === 'rabbit') {
            oval(c, x - s * 0.14, y - s * 0.38, s * 0.08, s * 0.22, color, s, -0.15);
            oval(c, x + s * 0.14, y - s * 0.38, s * 0.08, s * 0.22, color, s, 0.15);
        } else if (kind === 'mouse') {
            disk(c, x - s * 0.22, y - s * 0.18, s * 0.12, color, s);
            disk(c, x + s * 0.22, y - s * 0.18, s * 0.12, color, s);
            ink(c, s, 0.03);
            c.beginPath();
            c.moveTo(x + s * 0.28, y + s * 0.16);
            c.quadraticCurveTo(x + s * 0.5, y + s * 0.2, x + s * 0.42, y + s * 0.36);
            c.stroke();
        } else if (kind === 'koala' || kind === 'monkey' || kind === 'panda') {
            disk(c, x - s * 0.26, y - s * 0.18, s * 0.14, kind === 'panda' ? INK : color, s);
            disk(c, x + s * 0.26, y - s * 0.18, s * 0.14, kind === 'panda' ? INK : color, s);
        } else if (kind === 'cow' || kind === 'yak' || kind === 'goat' || kind === 'ox') {
            ink(c, s, 0.05);
            c.beginPath();
            c.moveTo(x - s * 0.1, y - s * 0.22);
            c.lineTo(x - s * 0.28, y - s * 0.4);
            c.moveTo(x + s * 0.1, y - s * 0.22);
            c.lineTo(x + s * 0.28, y - s * 0.4);
            c.stroke();
        } else if (kind === 'deer' || kind === 'elk') {
            ink(c, s, 0.04);
            c.beginPath();
            c.moveTo(x - s * 0.08, y - s * 0.22);
            c.lineTo(x - s * 0.22, y - s * 0.42);
            c.lineTo(x - s * 0.3, y - s * 0.34);
            c.moveTo(x + s * 0.08, y - s * 0.22);
            c.lineTo(x + s * 0.22, y - s * 0.42);
            c.lineTo(x + s * 0.3, y - s * 0.34);
            c.stroke();
        } else if (kind === 'lion') {
            disk(c, x, y, s * 0.4, '#c4894d', s, 0.03);
            disk(c, x, y + s * 0.02, s * 0.26, '#e9bd55', s);
        } else {
            disk(c, x - s * 0.22, y - s * 0.2, s * 0.1, color, s);
            disk(c, x + s * 0.22, y - s * 0.2, s * 0.1, color, s);
        }
        if (kind === 'panda') {
            oval(c, x - s * 0.12, y - s * 0.02, s * 0.09, s * 0.07, INK, false);
            oval(c, x + s * 0.12, y - s * 0.02, s * 0.09, s * 0.07, INK, false);
        }
        if (kind === 'tiger' || kind === 'zebra') {
            ink(c, s, 0.04);
            c.beginPath();
            c.moveTo(x - s * 0.16, y - s * 0.08);
            c.lineTo(x - s * 0.08, y + s * 0.12);
            c.moveTo(x + s * 0.04, y - s * 0.1);
            c.lineTo(x + s * 0.12, y + s * 0.1);
            c.stroke();
        }
        if (kind === 'pig') {
            oval(c, x, y + s * 0.08, s * 0.12, s * 0.08, '#f2c1c8', s);
            c.fillStyle = '#7a1f3d';
            c.beginPath();
            c.arc(x - s * 0.04, y + s * 0.08, s * 0.02, 0, Math.PI * 2);
            c.arc(x + s * 0.04, y + s * 0.08, s * 0.02, 0, Math.PI * 2);
            c.fill();
        }
        if (kind === 'elephant') {
            oval(c, x + s * 0.06, y + s * 0.22, s * 0.08, s * 0.22, color, s, 0.2);
        }
        if (kind === 'monkey') {
            disk(c, x, y + s * 0.04, s * 0.16, '#f4c7a1', s, 0.025);
        }
        eyes(c, x, y - (kind === 'lion' ? 0 : s * 0.02), s);
        if (kind !== 'pig') smile(c, x, y + s * 0.12, s);
    }
    function critter(kind, color) {
        return function (c, x, y, s) { drawCritter(c, x, y, s, kind, color); };
    }

    function birdOf(c, x, y, s, color, kind) {
        color = color || '#d97860';
        oval(c, x, y, s * 0.28, s * 0.22, color, s);
        disk(c, x + s * 0.22, y - s * 0.08, s * 0.14, color, s);
        c.fillStyle = '#e9bd55';
        poly(c, [x + s * 0.34, y - s * 0.08, x + s * 0.48, y - s * 0.04, x + s * 0.34, y], '#e9bd55', s);
        oval(c, x - s * 0.04, y + s * 0.02, s * 0.16, s * 0.1, '#fffdf7', s, -0.3);
        if (kind === 'duck' || kind === 'hen' || kind === 'chicken') {
            disk(c, x + s * 0.22, y - s * 0.2, s * 0.06, '#d97860', s);
        }
        if (kind === 'owl') {
            disk(c, x + s * 0.12, y - s * 0.08, s * 0.08, '#fff', s);
            disk(c, x + s * 0.28, y - s * 0.08, s * 0.08, '#fff', s);
        } else {
            eye(c, x + s * 0.26, y - s * 0.1, s * 0.04);
        }
    }
    function bird(color, kind) {
        return function (c, x, y, s) { birdOf(c, x, y, s, color, kind); };
    }
    function fishOf(c, x, y, s, color) {
        color = color || '#6faebc';
        oval(c, x, y, s * 0.3, s * 0.18, color, s);
        poly(c, [x - s * 0.3, y, x - s * 0.48, y - s * 0.16, x - s * 0.48, y + s * 0.16], color, s);
        eye(c, x + s * 0.18, y - s * 0.04, s * 0.045);
    }
    function fish(color) {
        return function (c, x, y, s) { fishOf(c, x, y, s, color); };
    }

    function bugOf(c, x, y, s, kind) {
        if (kind === 'ant') {
            [x - s * 0.22, x, x + s * 0.22].forEach(function (cx) {
                disk(c, cx, y, s * 0.14, '#8d5524', s);
            });
            eye(c, x + s * 0.3, y - s * 0.04, s * 0.04);
            ink(c, s, 0.03);
            c.beginPath();
            c.moveTo(x + s * 0.3, y - s * 0.08);
            c.lineTo(x + s * 0.42, y - s * 0.22);
            c.stroke();
        } else if (kind === 'bee') {
            oval(c, x, y, s * 0.26, s * 0.18, '#e9bd55', s);
            ink(c, s, 0.05);
            c.beginPath();
            c.moveTo(x - s * 0.08, y - s * 0.16);
            c.lineTo(x - s * 0.08, y + s * 0.16);
            c.moveTo(x + s * 0.08, y - s * 0.16);
            c.lineTo(x + s * 0.08, y + s * 0.16);
            c.stroke();
            oval(c, x - s * 0.04, y - s * 0.28, s * 0.14, s * 0.1, 'rgba(255,253,247,0.8)', s);
        } else if (kind === 'lady' || kind === 'insect') {
            disk(c, x, y, s * 0.28, '#d97860', s);
            disk(c, x, y - s * 0.22, s * 0.12, INK, s);
            c.fillStyle = INK;
            c.beginPath();
            c.arc(x - s * 0.1, y, s * 0.05, 0, Math.PI * 2);
            c.arc(x + s * 0.12, y + s * 0.08, s * 0.045, 0, Math.PI * 2);
            c.fill();
        } else if (kind === 'snail') {
            disk(c, x + s * 0.04, y, s * 0.24, '#d9a066', s);
            ink(c, s, 0.04);
            c.beginPath();
            c.arc(x + s * 0.04, y, s * 0.12, 0, Math.PI * 1.5);
            c.stroke();
            oval(c, x - s * 0.22, y + s * 0.1, s * 0.18, s * 0.1, '#79aa82', s);
        } else if (kind === 'snake') {
            ink(c, s, 0.12);
            c.strokeStyle = '#79aa82';
            c.beginPath();
            c.moveTo(x - s * 0.36, y + s * 0.16);
            c.quadraticCurveTo(x - s * 0.1, y - s * 0.28, x + s * 0.1, y + s * 0.1);
            c.quadraticCurveTo(x + s * 0.28, y + s * 0.3, x + s * 0.38, y - s * 0.08);
            c.stroke();
            disk(c, x + s * 0.38, y - s * 0.1, s * 0.1, '#79aa82', s);
            eye(c, x + s * 0.42, y - s * 0.12, s * 0.03);
        } else if (kind === 'worm') {
            ink(c, s, 0.1);
            c.strokeStyle = '#e2a3ab';
            c.beginPath();
            c.moveTo(x - s * 0.32, y);
            c.quadraticCurveTo(x - s * 0.1, y - s * 0.2, x + s * 0.08, y);
            c.quadraticCurveTo(x + s * 0.24, y + s * 0.18, x + s * 0.36, y - s * 0.04);
            c.stroke();
        } else if (kind === 'crab') {
            disk(c, x, y, s * 0.22, '#d97860', s);
            ink(c, s, 0.05);
            c.beginPath();
            c.arc(x - s * 0.32, y - s * 0.08, s * 0.12, 0.2, Math.PI);
            c.stroke();
            c.beginPath();
            c.arc(x + s * 0.32, y - s * 0.08, s * 0.12, 0, Math.PI - 0.2);
            c.stroke();
            eyes(c, x, y - s * 0.04, s, 0.1);
        } else {
            disk(c, x, y, s * 0.26, '#79aa82', s);
            ink(c, s, 0.03);
            for (var i = 0; i < 6; i++) {
                var a = (i / 6) * Math.PI * 2;
                c.beginPath();
                c.moveTo(x, y);
                c.lineTo(x + Math.cos(a) * s * 0.4, y + Math.sin(a) * s * 0.4);
                c.stroke();
            }
        }
    }
    function bug(kind) {
        return function (c, x, y, s) { bugOf(c, x, y, s, kind); };
    }

    function personOf(c, x, y, s, kind) {
        var shirt = '#6faebc';
        var hair = '#5c3d2e';
        var skin = '#f4c7a1';
        if (kind === 'mom' || kind === 'girl' || kind === 'nurse') hair = '#3d2a20';
        if (kind === 'king') shirt = '#e9bd55';
        if (kind === 'nurse') shirt = '#fffdf7';
        if (kind === 'astronaut') shirt = '#cfd8dc';
        if (kind === 'elf') shirt = '#79aa82';
        disk(c, x, y - s * 0.16, s * 0.16, skin, s);
        if (kind === 'dad' || kind === 'man' || kind === 'uncle') {
            c.fillStyle = hair;
            c.fillRect(x - s * 0.12, y - s * 0.08, s * 0.24, s * 0.06);
        } else if (kind === 'mom') {
            oval(c, x, y - s * 0.1, s * 0.18, s * 0.2, hair, s);
            disk(c, x, y - s * 0.14, s * 0.14, skin, false);
        } else {
            c.fillStyle = hair;
            c.beginPath();
            c.ellipse(x, y - s * 0.26, s * 0.14, s * 0.08, 0, Math.PI, 0);
            c.fill();
        }
        oval(c, x, y + s * 0.14, s * 0.16, s * 0.2, shirt, s);
        if (kind === 'king') {
            poly(c, [x - s * 0.16, y - s * 0.28, x - s * 0.08, y - s * 0.42, x, y - s * 0.28, x + s * 0.08, y - s * 0.42, x + s * 0.16, y - s * 0.28], '#e9bd55', s);
        }
        if (kind === 'nurse') {
            c.fillStyle = '#d97860';
            c.fillRect(x - s * 0.03, y + s * 0.08, s * 0.06, s * 0.12);
            c.fillRect(x - s * 0.08, y + s * 0.12, s * 0.16, s * 0.05);
        }
        if (kind === 'astronaut') {
            disk(c, x, y - s * 0.16, s * 0.2, 'rgba(169,213,223,0.55)', s);
        }
        if (kind === 'elf') {
            poly(c, [x - s * 0.14, y - s * 0.24, x, y - s * 0.48, x + s * 0.14, y - s * 0.24], '#79aa82', s);
        }
        eyes(c, x, y - s * 0.16, s * 0.85, 0.08);
        smile(c, x, y - s * 0.08, s * 0.8);
    }
    function person(kind) {
        return function (c, x, y, s) { personOf(c, x, y, s, kind); };
    }

    function vehicleOf(c, x, y, s, kind, color) {
        color = color || '#d97860';
        if (kind === 'bus') {
            oval(c, x, y, s * 0.42, s * 0.22, color, false);
            c.fillStyle = color;
            c.fillRect(x - s * 0.42, y - s * 0.18, s * 0.84, s * 0.36);
            ink(c, s);
            c.strokeRect(x - s * 0.42, y - s * 0.18, s * 0.84, s * 0.36);
            c.fillStyle = '#cfe6ea';
            for (var i = 0; i < 3; i++) c.fillRect(x - s * 0.32 + i * s * 0.22, y - s * 0.1, s * 0.14, s * 0.12);
            wheels(c, y + s * 0.22, s, [x - s * 0.24, x + s * 0.24]);
        } else if (kind === 'truck') {
            c.fillStyle = color;
            c.fillRect(x - s * 0.08, y - s * 0.16, s * 0.42, s * 0.28);
            c.fillRect(x - s * 0.42, y - s * 0.02, s * 0.38, s * 0.16);
            ink(c, s);
            c.strokeRect(x - s * 0.08, y - s * 0.16, s * 0.42, s * 0.28);
            wheels(c, y + s * 0.2, s, [x - s * 0.24, x + s * 0.2]);
        } else if (kind === 'train') {
            c.fillStyle = '#6faebc';
            c.fillRect(x - s * 0.38, y - s * 0.12, s * 0.28, s * 0.28);
            c.fillStyle = '#d97860';
            c.fillRect(x - s * 0.08, y - s * 0.08, s * 0.42, s * 0.24);
            ink(c, s);
            c.strokeRect(x - s * 0.38, y - s * 0.12, s * 0.28, s * 0.28);
            wheels(c, y + s * 0.2, s, [x - s * 0.26, x + s * 0.08, x + s * 0.26]);
        } else if (kind === 'bike') {
            ink(c, s, 0.045);
            c.beginPath();
            c.arc(x - s * 0.22, y + s * 0.12, s * 0.16, 0, Math.PI * 2);
            c.stroke();
            c.beginPath();
            c.arc(x + s * 0.22, y + s * 0.12, s * 0.16, 0, Math.PI * 2);
            c.stroke();
            c.beginPath();
            c.moveTo(x - s * 0.22, y + s * 0.12);
            c.lineTo(x, y - s * 0.08);
            c.lineTo(x + s * 0.22, y + s * 0.12);
            c.lineTo(x, y + s * 0.04);
            c.closePath();
            c.stroke();
        } else if (kind === 'plane' || kind === 'jet') {
            oval(c, x, y, s * 0.38, s * 0.1, '#cfe6ea', s);
            poly(c, [x - s * 0.04, y, x - s * 0.28, y - s * 0.28, x + s * 0.1, y], '#6faebc', s);
            poly(c, [x - s * 0.04, y, x - s * 0.22, y + s * 0.26, x + s * 0.1, y], '#6faebc', s);
            poly(c, [x + s * 0.28, y - s * 0.04, x + s * 0.42, y - s * 0.18, x + s * 0.34, y], '#d97860', s);
        } else if (kind === 'heli') {
            oval(c, x, y + s * 0.06, s * 0.28, s * 0.14, '#6faebc', s);
            ink(c, s, 0.04);
            c.beginPath();
            c.moveTo(x - s * 0.42, y - s * 0.18);
            c.lineTo(x + s * 0.42, y - s * 0.18);
            c.stroke();
            c.beginPath();
            c.moveTo(x, y - s * 0.04);
            c.lineTo(x, y - s * 0.18);
            c.stroke();
        } else if (kind === 'boat' || kind === 'ship') {
            poly(c, [x - s * 0.4, y, x + s * 0.4, y, x + s * 0.28, y + s * 0.22, x - s * 0.28, y + s * 0.22], '#d97860', s);
            c.fillStyle = '#fffdf7';
            c.fillRect(x - s * 0.12, y - s * 0.22, s * 0.24, s * 0.22);
            ink(c, s);
            c.strokeRect(x - s * 0.12, y - s * 0.22, s * 0.24, s * 0.22);
        } else if (kind === 'ufo') {
            oval(c, x, y, s * 0.36, s * 0.12, '#8b7e9e', s);
            disk(c, x, y - s * 0.08, s * 0.16, '#a9d5df', s);
        } else {
            c.fillStyle = color;
            c.fillRect(x - s * 0.36, y - s * 0.08, s * 0.72, s * 0.22);
            c.fillRect(x - s * 0.12, y - s * 0.24, s * 0.36, s * 0.18);
            ink(c, s);
            c.strokeRect(x - s * 0.36, y - s * 0.08, s * 0.72, s * 0.22);
            c.fillStyle = '#cfe6ea';
            c.fillRect(x - s * 0.06, y - s * 0.2, s * 0.24, s * 0.1);
            wheels(c, y + s * 0.16, s, [x - s * 0.2, x + s * 0.22]);
            if (kind === 'ambulance') {
                c.fillStyle = '#d97860';
                c.fillRect(x + s * 0.02, y - s * 0.02, s * 0.16, s * 0.05);
                c.fillRect(x + s * 0.07, y - s * 0.08, s * 0.05, s * 0.16);
            }
        }
    }
    function vehicle(kind, color) {
        return function (c, x, y, s) { vehicleOf(c, x, y, s, kind, color); };
    }

    function treeOf(c, x, y, s, kind) {
        c.fillStyle = '#8d5524';
        c.fillRect(x - s * 0.06, y + s * 0.08, s * 0.12, s * 0.28);
        if (kind === 'palm' || kind === 'jungle') {
            for (var i = 0; i < 5; i++) {
                var a = -1.2 + i * 0.6;
                oval(c, x + Math.cos(a) * s * 0.22, y - s * 0.08 + Math.sin(a) * s * 0.08, s * 0.18, s * 0.07, '#79aa82', s, a);
            }
        } else {
            disk(c, x, y - s * 0.08, s * 0.28, '#79aa82', s);
            disk(c, x - s * 0.16, y + s * 0.04, s * 0.18, '#6f8f7a', s);
        }
    }
    function flowerOf(c, x, y, s, color) {
        color = color || '#d97860';
        for (var i = 0; i < 6; i++) {
            var a = (i / 6) * Math.PI * 2;
            disk(c, x + Math.cos(a) * s * 0.18, y + Math.sin(a) * s * 0.18 - s * 0.04, s * 0.12, color, s, 0.025);
        }
        disk(c, x, y - s * 0.04, s * 0.1, '#e9bd55', s);
        c.fillStyle = '#79aa82';
        c.fillRect(x - s * 0.025, y + s * 0.12, s * 0.05, s * 0.28);
    }
    function plant(kind, color) {
        return function (c, x, y, s) {
            if (kind === 'flower' || kind === 'rose' || kind === 'sunflower') flowerOf(c, x, y, s, color);
            else if (kind === 'leaf' || kind === 'ivy' || kind === 'vine' || kind === 'grass' || kind === 'feather') {
                leafOf(c, x, y, s * 1.8, -0.6);
                leafOf(c, x + s * 0.12, y + s * 0.1, s * 1.4, 0.4);
            } else if (kind === 'cactus' || kind === 'plant') {
                c.fillStyle = '#79aa82';
                c.fillRect(x - s * 0.1, y - s * 0.1, s * 0.2, s * 0.4);
                ink(c, s);
                c.strokeRect(x - s * 0.1, y - s * 0.1, s * 0.2, s * 0.4);
                disk(c, x, y + s * 0.32, s * 0.16, '#c4894d', s);
            } else treeOf(c, x, y, s, kind);
        };
    }

    function houseOf(c, x, y, s, color) {
        color = color || '#d9a066';
        c.fillStyle = color;
        c.fillRect(x - s * 0.28, y - s * 0.02, s * 0.56, s * 0.36);
        poly(c, [x - s * 0.36, y - s * 0.02, x, y - s * 0.36, x + s * 0.36, y - s * 0.02], '#d97860', s);
        c.fillStyle = '#6faebc';
        c.fillRect(x - s * 0.16, y + s * 0.08, s * 0.12, s * 0.12);
        c.fillStyle = '#8d5524';
        c.fillRect(x + s * 0.06, y + s * 0.1, s * 0.12, s * 0.24);
    }
    function house(color) {
        return function (c, x, y, s) { houseOf(c, x, y, s, color); };
    }
    function cupOf(c, x, y, s, color) {
        color = color || '#6faebc';
        c.fillStyle = color;
        c.beginPath();
        c.moveTo(x - s * 0.2, y - s * 0.16);
        c.lineTo(x - s * 0.14, y + s * 0.24);
        c.lineTo(x + s * 0.14, y + s * 0.24);
        c.lineTo(x + s * 0.2, y - s * 0.16);
        c.closePath();
        c.fill();
        ink(c, s);
        c.stroke();
        ink(c, s, 0.04);
        c.beginPath();
        c.arc(x + s * 0.26, y, s * 0.1, -1.2, 1.2);
        c.stroke();
    }
    function cup(color) {
        return function (c, x, y, s) { cupOf(c, x, y, s, color); };
    }
    function bowlOf(c, x, y, s, color) {
        color = color || '#d9a066';
        c.fillStyle = color;
        c.beginPath();
        c.ellipse(x, y + s * 0.08, s * 0.32, s * 0.18, 0, 0, Math.PI);
        c.fill();
        ink(c, s);
        c.beginPath();
        c.ellipse(x, y + s * 0.08, s * 0.32, s * 0.18, 0, 0, Math.PI);
        c.stroke();
        c.beginPath();
        c.ellipse(x, y + s * 0.08, s * 0.32, s * 0.08, 0, 0, Math.PI * 2);
        c.stroke();
    }
    function boxOf(c, x, y, s, color) {
        color = color || '#d9a066';
        c.fillStyle = color;
        c.fillRect(x - s * 0.26, y - s * 0.16, s * 0.52, s * 0.4);
        ink(c, s);
        c.strokeRect(x - s * 0.26, y - s * 0.16, s * 0.52, s * 0.4);
        c.beginPath();
        c.moveTo(x, y - s * 0.16);
        c.lineTo(x, y + s * 0.24);
        c.stroke();
    }
    function box(color) {
        return function (c, x, y, s) { boxOf(c, x, y, s, color); };
    }
    function ballOf(c, x, y, s, color) {
        disk(c, x, y, s * 0.32, color || '#d97860', s);
        ink(c, s, 0.03);
        c.beginPath();
        c.ellipse(x, y, s * 0.12, s * 0.32, 0, 0, Math.PI * 2);
        c.stroke();
        c.beginPath();
        c.moveTo(x - s * 0.32, y);
        c.lineTo(x + s * 0.32, y);
        c.stroke();
    }
    function ball(color) {
        return function (c, x, y, s) { ballOf(c, x, y, s, color); };
    }

    function hatOf(c, x, y, s, kind, color) {
        color = color || '#243e4a';
        if (kind === 'cap') {
            disk(c, x, y - s * 0.04, s * 0.22, color, s);
            c.fillStyle = color;
            c.fillRect(x, y + s * 0.04, s * 0.32, s * 0.08);
        } else if (kind === 'crown') {
            poly(c, [x - s * 0.28, y + s * 0.12, x - s * 0.2, y - s * 0.2, x - s * 0.08, y + s * 0.02, x, y - s * 0.28, x + s * 0.08, y + s * 0.02, x + s * 0.2, y - s * 0.2, x + s * 0.28, y + s * 0.12], '#e9bd55', s);
        } else {
            c.fillStyle = color;
            c.fillRect(x - s * 0.16, y - s * 0.16, s * 0.32, s * 0.22);
            c.fillRect(x - s * 0.3, y + s * 0.06, s * 0.6, s * 0.08);
            ink(c, s);
            c.strokeRect(x - s * 0.3, y + s * 0.06, s * 0.6, s * 0.08);
        }
    }
    function hat(kind, color) {
        return function (c, x, y, s) { hatOf(c, x, y, s, kind, color); };
    }
    function clothesOf(c, x, y, s, kind, color) {
        color = color || '#6faebc';
        if (kind === 'shirt' || kind === 'uniform' || kind === 'vest' || kind === 'coat' || kind === 'jacket' || kind === 'apron' || kind === 'dress') {
            c.fillStyle = color;
            c.beginPath();
            c.moveTo(x - s * 0.28, y - s * 0.16);
            c.lineTo(x - s * 0.1, y - s * 0.22);
            c.lineTo(x + s * 0.1, y - s * 0.22);
            c.lineTo(x + s * 0.28, y - s * 0.16);
            c.lineTo(x + s * 0.2, y + s * 0.28);
            c.lineTo(x - s * 0.2, y + s * 0.28);
            c.closePath();
            c.fill();
            ink(c, s);
            c.stroke();
            if (kind === 'dress') {
                poly(c, [x - s * 0.2, y + s * 0.04, x + s * 0.2, y + s * 0.04, x + s * 0.32, y + s * 0.36, x - s * 0.32, y + s * 0.36], color, s);
            }
        } else if (kind === 'shoe' || kind === 'sock') {
            oval(c, x, y + s * 0.08, s * 0.28, s * 0.14, color, s);
            if (kind === 'sock') oval(c, x - s * 0.16, y - s * 0.08, s * 0.12, s * 0.2, color, s);
        } else if (kind === 'glove') {
            oval(c, x, y, s * 0.18, s * 0.28, color, s);
            disk(c, x + s * 0.16, y - s * 0.08, s * 0.08, color, s);
        } else if (kind === 'wig') {
            oval(c, x, y, s * 0.28, s * 0.24, '#5c3d2e', s);
        } else {
            oval(c, x, y, s * 0.28, s * 0.2, color, s);
        }
    }
    function clothes(kind, color) {
        return function (c, x, y, s) { clothesOf(c, x, y, s, kind, color); };
    }

    function toolOf(c, x, y, s, kind) {
        if (kind === 'key') {
            disk(c, x - s * 0.16, y, s * 0.14, '#e9bd55', s);
            c.fillStyle = '#e9bd55';
            c.fillRect(x - s * 0.04, y - s * 0.04, s * 0.36, s * 0.08);
            c.fillRect(x + s * 0.2, y + s * 0.04, s * 0.06, s * 0.12);
        } else if (kind === 'pen' || kind === 'pencil') {
            poly(c, [x - s * 0.36, y + s * 0.08, x + s * 0.28, y - s * 0.16, x + s * 0.34, y - s * 0.08, x - s * 0.3, y + s * 0.16], kind === 'pencil' ? '#e9bd55' : '#6faebc', s);
            poly(c, [x + s * 0.28, y - s * 0.16, x + s * 0.42, y - s * 0.22, x + s * 0.34, y - s * 0.08], '#f4c7a1', s);
        } else if (kind === 'hammer') {
            c.fillStyle = '#8a96a0';
            c.fillRect(x - s * 0.08, y - s * 0.28, s * 0.34, s * 0.18);
            c.fillStyle = '#8d5524';
            c.fillRect(x - s * 0.04, y - s * 0.12, s * 0.08, s * 0.4);
        } else if (kind === 'axe') {
            poly(c, [x - s * 0.08, y - s * 0.2, x + s * 0.32, y - s * 0.08, x + s * 0.28, y + s * 0.12, x - s * 0.08, y], '#8a96a0', s);
            c.fillStyle = '#8d5524';
            c.fillRect(x - s * 0.32, y - s * 0.06, s * 0.28, s * 0.1);
        } else if (kind === 'lamp' || kind === 'idea') {
            disk(c, x, y - s * 0.08, s * 0.2, '#e9bd55', s);
            c.fillStyle = '#8a96a0';
            c.fillRect(x - s * 0.08, y + s * 0.12, s * 0.16, s * 0.12);
        } else if (kind === 'lock') {
            c.fillStyle = '#e9bd55';
            c.fillRect(x - s * 0.16, y - s * 0.02, s * 0.32, s * 0.24);
            ink(c, s, 0.05);
            c.beginPath();
            c.arc(x, y - s * 0.04, s * 0.12, Math.PI, 0);
            c.stroke();
        } else if (kind === 'hook') {
            ink(c, s, 0.08);
            c.beginPath();
            c.arc(x, y, s * 0.2, -0.4, Math.PI * 1.2);
            c.stroke();
        } else if (kind === 'nail') {
            c.fillStyle = '#8a96a0';
            c.fillRect(x - s * 0.04, y - s * 0.28, s * 0.08, s * 0.5);
            disk(c, x, y - s * 0.28, s * 0.08, '#8a96a0', s);
        } else if (kind === 'kit') {
            boxOf(c, x, y, s, '#d97860');
            c.fillStyle = '#fffdf7';
            c.fillRect(x - s * 0.04, y - s * 0.08, s * 0.08, s * 0.2);
            c.fillRect(x - s * 0.12, y, s * 0.24, s * 0.08);
        } else {
            oval(c, x, y, s * 0.28, s * 0.08, '#8a96a0', s, 0.6);
        }
    }
    function tool(kind) {
        return function (c, x, y, s) { toolOf(c, x, y, s, kind); };
    }

    function natureOf(c, x, y, s, kind) {
        if (kind === 'sun') {
            c.fillStyle = '#e9bd55';
            for (var i = 0; i < 8; i++) {
                var a = (i / 8) * Math.PI * 2;
                c.beginPath();
                c.arc(x + Math.cos(a) * s * 0.38, y + Math.sin(a) * s * 0.38, s * 0.08, 0, Math.PI * 2);
                c.fill();
            }
            disk(c, x, y, s * 0.26, '#e9bd55', s);
            eyes(c, x, y - s * 0.04, s, 0.09);
        } else if (kind === 'moon') {
            disk(c, x, y, s * 0.3, '#e9bd55', s);
            c.fillStyle = PAPER;
            c.beginPath();
            c.arc(x + s * 0.12, y - s * 0.06, s * 0.24, 0, Math.PI * 2);
            c.fill();
        } else if (kind === 'star') {
            c.fillStyle = '#e9bd55';
            c.beginPath();
            for (var i = 0; i < 5; i++) {
                var a = -Math.PI / 2 + (i / 5) * Math.PI * 4;
                c.lineTo(x + Math.cos(a) * s * 0.38, y + Math.sin(a) * s * 0.38);
            }
            c.closePath();
            c.fill();
            ink(c, s, 0.03);
            c.stroke();
        } else if (kind === 'cloud' || kind === 'fog' || kind === 'sheep') {
            disk(c, x - s * 0.16, y, s * 0.18, PAPER, s);
            disk(c, x + s * 0.14, y + s * 0.04, s * 0.2, PAPER, s);
            disk(c, x, y - s * 0.1, s * 0.2, PAPER, s);
        } else if (kind === 'fire') {
            poly(c, [x - s * 0.18, y + s * 0.2, x, y - s * 0.36, x + s * 0.18, y + s * 0.2], '#d97860', s);
            poly(c, [x - s * 0.1, y + s * 0.18, x, y - s * 0.08, x + s * 0.1, y + s * 0.18], '#e9bd55', false);
        } else if (kind === 'water' || kind === 'wet' || kind === 'rain' || kind === 'ocean' || kind === 'lake') {
            ink(c, s, 0.05);
            c.strokeStyle = '#6faebc';
            c.beginPath();
            c.moveTo(x - s * 0.32, y);
            c.quadraticCurveTo(x - s * 0.16, y - s * 0.12, x, y);
            c.quadraticCurveTo(x + s * 0.16, y + s * 0.12, x + s * 0.32, y);
            c.stroke();
            if (kind === 'rain') {
                c.beginPath();
                c.moveTo(x - s * 0.1, y - s * 0.28);
                c.lineTo(x - s * 0.16, y - s * 0.12);
                c.moveTo(x + s * 0.12, y - s * 0.32);
                c.lineTo(x + s * 0.06, y - s * 0.16);
                c.stroke();
            }
        } else if (kind === 'snow') {
            ink(c, s, 0.04);
            for (var i = 0; i < 3; i++) {
                var a = (i / 3) * Math.PI;
                c.beginPath();
                c.moveTo(x - Math.cos(a) * s * 0.28, y - Math.sin(a) * s * 0.28);
                c.lineTo(x + Math.cos(a) * s * 0.28, y + Math.sin(a) * s * 0.28);
                c.stroke();
            }
        } else if (kind === 'rainbow') {
            ['#d97860', '#e9bd55', '#79aa82', '#6faebc', '#8b7e9e'].forEach(function (col, i) {
                ink(c, s, 0.06);
                c.strokeStyle = col;
                c.beginPath();
                c.arc(x, y + s * 0.28, s * 0.4 - i * s * 0.055, Math.PI, 0);
                c.stroke();
            });
        } else if (kind === 'earth') {
            disk(c, x, y, s * 0.32, '#6faebc', s);
            oval(c, x + s * 0.04, y - s * 0.04, s * 0.16, s * 0.1, '#79aa82', false, 0.3);
        } else if (kind === 'mountain' || kind === 'hill' || kind === 'volcano' || kind === 'rock') {
            poly(c, [x - s * 0.4, y + s * 0.28, x - s * 0.08, y - s * 0.32, x + s * 0.16, y + s * 0.08, x + s * 0.4, y + s * 0.28], '#8d5524', s);
            if (kind === 'volcano') {
                poly(c, [x - s * 0.08, y - s * 0.2, x, y - s * 0.4, x + s * 0.08, y - s * 0.2], '#d97860', s);
            }
            if (kind === 'mountain') {
                c.fillStyle = PAPER;
                c.beginPath();
                c.moveTo(x - s * 0.16, y - s * 0.12);
                c.lineTo(x - s * 0.08, y - s * 0.32);
                c.lineTo(x, y - s * 0.08);
                c.fill();
            }
        } else if (kind === 'sand' || kind === 'island') {
            oval(c, x, y + s * 0.16, s * 0.36, s * 0.12, '#e9bd55', s);
            if (kind === 'island') treeOf(c, x, y - s * 0.04, s * 0.7, 'palm');
        } else if (kind === 'night') {
            disk(c, x, y, s * 0.36, '#3d5a80', s);
            disk(c, x + s * 0.08, y - s * 0.08, s * 0.1, '#e9bd55', false);
        } else {
            disk(c, x, y, s * 0.3, '#6faebc', s);
        }
    }
    function nature(kind) {
        return function (c, x, y, s) { natureOf(c, x, y, s, kind); };
    }

    function furnitureOf(c, x, y, s, kind) {
        if (kind === 'chair' || kind === 'sit' || kind === 'table') {
            c.fillStyle = '#c4894d';
            c.fillRect(x - s * 0.24, y, s * 0.48, s * 0.08);
            c.fillRect(x - s * 0.22, y + s * 0.08, s * 0.08, s * 0.24);
            c.fillRect(x + s * 0.14, y + s * 0.08, s * 0.08, s * 0.24);
            if (kind !== 'table') c.fillRect(x - s * 0.24, y - s * 0.24, s * 0.08, s * 0.24);
        } else if (kind === 'door' || kind === 'window') {
            c.fillStyle = '#d9a066';
            c.fillRect(x - s * 0.2, y - s * 0.32, s * 0.4, s * 0.64);
            ink(c, s);
            c.strokeRect(x - s * 0.2, y - s * 0.32, s * 0.4, s * 0.64);
            if (kind === 'window') {
                c.beginPath();
                c.moveTo(x, y - s * 0.32);
                c.lineTo(x, y + s * 0.32);
                c.moveTo(x - s * 0.2, y);
                c.lineTo(x + s * 0.2, y);
                c.stroke();
            } else {
                disk(c, x + s * 0.1, y, s * 0.04, '#e9bd55', s);
            }
        } else if (kind === 'bed' || kind === 'quilt' || kind === 'pillow' || kind === 'mat') {
            c.fillStyle = '#8d5524';
            c.fillRect(x - s * 0.36, y - s * 0.08, s * 0.12, s * 0.36);
            c.fillStyle = '#6faebc';
            c.fillRect(x - s * 0.28, y + s * 0.04, s * 0.6, s * 0.2);
            oval(c, x - s * 0.08, y - s * 0.04, s * 0.14, s * 0.08, PAPER, s);
        } else if (kind === 'clock') {
            disk(c, x, y, s * 0.3, PAPER, s);
            ink(c, s, 0.04);
            c.beginPath();
            c.moveTo(x, y);
            c.lineTo(x, y - s * 0.16);
            c.moveTo(x, y);
            c.lineTo(x + s * 0.12, y);
            c.stroke();
        } else if (kind === 'ladder') {
            ink(c, s, 0.05);
            c.beginPath();
            c.moveTo(x - s * 0.16, y - s * 0.36);
            c.lineTo(x - s * 0.16, y + s * 0.36);
            c.moveTo(x + s * 0.16, y - s * 0.36);
            c.lineTo(x + s * 0.16, y + s * 0.36);
            for (var i = -2; i <= 2; i++) {
                c.moveTo(x - s * 0.16, y + i * s * 0.12);
                c.lineTo(x + s * 0.16, y + i * s * 0.12);
            }
            c.stroke();
        } else {
            boxOf(c, x, y, s, '#d9a066');
        }
    }
    function furniture(kind) {
        return function (c, x, y, s) { furnitureOf(c, x, y, s, kind); };
    }

    function numOf(c, x, y, s, n) {
        disk(c, x, y, s * 0.36, '#efe1c5', s);
        c.fillStyle = INK;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.font = '800 ' + Math.round(s * 0.42) + 'px Fredoka, sans-serif';
        c.fillText(String(n), x, y + s * 0.02);
    }
    function num(n) {
        return function (c, x, y, s) { numOf(c, x, y, s, n); };
    }
    function faceOf(c, x, y, s, kind) {
        disk(c, x, y, s * 0.32, '#f4c7a1', s);
        eyes(c, x, y - s * 0.06, s);
        if (kind === 'sad' || kind === 'ill') {
            ink(c, s, 0.03);
            c.beginPath();
            c.arc(x, y + s * 0.16, s * 0.1, Math.PI + 0.2, -0.2);
            c.stroke();
            if (kind === 'ill') {
                c.fillStyle = '#79aa82';
                c.fillRect(x + s * 0.12, y - s * 0.28, s * 0.08, s * 0.28);
                disk(c, x + s * 0.16, y - s * 0.3, s * 0.06, '#d97860', s);
            }
        } else if (kind === 'nap') {
            c.fillStyle = INK;
            c.font = '700 ' + Math.round(s * 0.18) + 'px Fredoka, sans-serif';
            c.fillText('z', x + s * 0.28, y - s * 0.2);
        } else if (kind === 'quiet') {
            disk(c, x + s * 0.06, y + s * 0.12, s * 0.06, '#f4c7a1', s);
        } else if (kind === 'yell') {
            disk(c, x, y + s * 0.12, s * 0.08, '#5c3d2e', s);
        } else smile(c, x, y + s * 0.1, s);
    }
    function face(kind) {
        return function (c, x, y, s) { faceOf(c, x, y, s, kind); };
    }
    function arrowOf(c, x, y, s, dir) {
        c.fillStyle = '#6faebc';
        if (dir === 'up') poly(c, [x, y - s * 0.32, x + s * 0.22, y + s * 0.08, x - s * 0.22, y + s * 0.08], '#6faebc', s);
        else if (dir === 'down') poly(c, [x, y + s * 0.32, x + s * 0.22, y - s * 0.08, x - s * 0.22, y - s * 0.08], '#6faebc', s);
        else poly(c, [x + s * 0.32, y, x - s * 0.08, y - s * 0.22, x - s * 0.08, y + s * 0.22], '#6faebc', s);
    }
    function arrow(dir) {
        return function (c, x, y, s) { arrowOf(c, x, y, s, dir); };
    }

    function foodOf(c, x, y, s, kind) {
        if (kind === 'bread' || kind === 'toast' || kind === 'cake' || kind === 'muffin' || kind === 'cupcake' || kind === 'cookie' || kind === 'donut') {
            oval(c, x, y, s * 0.28, s * 0.2, '#d9a066', s);
            if (kind === 'cake' || kind === 'cupcake' || kind === 'muffin') {
                oval(c, x, y - s * 0.12, s * 0.24, s * 0.12, '#fffdf7', s);
                disk(c, x, y - s * 0.22, s * 0.06, '#d97860', s);
            }
            if (kind === 'donut') {
                disk(c, x, y, s * 0.1, PAPER, false);
            }
        } else if (kind === 'egg') {
            oval(c, x, y, s * 0.2, s * 0.28, PAPER, s);
        } else if (kind === 'pizza') {
            poly(c, [x, y - s * 0.32, x + s * 0.34, y + s * 0.24, x - s * 0.34, y + s * 0.24], '#e9bd55', s);
            disk(c, x, y, s * 0.05, '#d97860', false);
            disk(c, x + s * 0.12, y + s * 0.08, s * 0.04, '#d97860', false);
        } else if (kind === 'ice' || kind === 'icecream') {
            poly(c, [x - s * 0.14, y + s * 0.02, x + s * 0.14, y + s * 0.02, x, y + s * 0.4], '#d9a066', s);
            disk(c, x, y - s * 0.08, s * 0.18, '#e2a3ab', s);
        } else if (kind === 'honey' || kind === 'jam' || kind === 'jar' || kind === 'jug' || kind === 'urn') {
            oval(c, x, y + s * 0.04, s * 0.2, s * 0.26, '#d9a066', s);
            c.fillStyle = '#c4894d';
            c.fillRect(x - s * 0.1, y - s * 0.28, s * 0.2, s * 0.1);
        } else if (kind === 'milk' || kind === 'juice' || kind === 'yogurt') {
            c.fillStyle = kind === 'juice' ? '#d9a066' : PAPER;
            c.fillRect(x - s * 0.12, y - s * 0.2, s * 0.24, s * 0.44);
            ink(c, s);
            c.strokeRect(x - s * 0.12, y - s * 0.2, s * 0.24, s * 0.44);
        } else if (kind === 'rice' || kind === 'soup' || kind === 'pot' || kind === 'noodle' || kind === 'lunch' || kind === 'popcorn') {
            bowlOf(c, x, y, s, '#fffdf7');
            if (kind === 'noodle') {
                ink(c, s, 0.03);
                c.beginPath();
                c.arc(x, y, s * 0.12, 0, Math.PI);
                c.stroke();
            }
        } else if (kind === 'lollipop' || kind === 'candy') {
            disk(c, x, y - s * 0.1, s * 0.2, '#d97860', s);
            c.fillStyle = '#c4894d';
            c.fillRect(x - s * 0.03, y + s * 0.08, s * 0.06, s * 0.28);
        } else if (kind === 'jelly') {
            oval(c, x, y, s * 0.22, s * 0.18, '#e2a3ab', s);
        } else bowlOf(c, x, y, s, '#d9a066');
    }
    function food(kind) {
        return function (c, x, y, s) { foodOf(c, x, y, s, kind); };
    }

    function miscOf(c, x, y, s, kind) {
        if (kind === 'book' || kind === 'notebook' || kind === 'note' || kind === 'map') {
            c.fillStyle = kind === 'map' ? '#79aa82' : '#d97860';
            c.fillRect(x - s * 0.24, y - s * 0.28, s * 0.48, s * 0.52);
            ink(c, s);
            c.strokeRect(x - s * 0.24, y - s * 0.28, s * 0.48, s * 0.52);
            c.fillStyle = PAPER;
            c.fillRect(x - s * 0.18, y - s * 0.22, s * 0.36, s * 0.4);
        } else if (kind === 'gift') {
            boxOf(c, x, y + s * 0.04, s, '#d97860');
            c.fillStyle = '#e9bd55';
            c.fillRect(x - s * 0.04, y - s * 0.16, s * 0.08, s * 0.4);
            c.fillRect(x - s * 0.26, y - s * 0.02, s * 0.52, s * 0.08);
        } else if (kind === 'bell') {
            oval(c, x, y - s * 0.04, s * 0.2, s * 0.24, '#e9bd55', s);
            disk(c, x, y + s * 0.2, s * 0.06, INK, s);
        } else if (kind === 'drum') {
            oval(c, x, y, s * 0.3, s * 0.18, '#d97860', s);
        } else if (kind === 'guitar' || kind === 'violin') {
            oval(c, x - s * 0.06, y + s * 0.1, s * 0.16, s * 0.22, '#c4894d', s);
            c.fillStyle = '#c4894d';
            c.fillRect(x + s * 0.04, y - s * 0.32, s * 0.06, s * 0.36);
        } else if (kind === 'phone' || kind === 'telephone' || kind === 'radio' || kind === 'video' || kind === 'camera' || kind === 'watch') {
            c.fillStyle = '#8a96a0';
            c.fillRect(x - s * 0.22, y - s * 0.16, s * 0.44, s * 0.32);
            ink(c, s);
            c.strokeRect(x - s * 0.22, y - s * 0.16, s * 0.44, s * 0.32);
            disk(c, x, y, s * 0.1, '#6faebc', s);
        } else if (kind === 'flag') {
            c.fillStyle = '#8d5524';
            c.fillRect(x - s * 0.24, y - s * 0.32, s * 0.06, s * 0.64);
            c.fillStyle = '#d97860';
            c.fillRect(x - s * 0.18, y - s * 0.32, s * 0.4, s * 0.24);
        } else if (kind === 'web') {
            ink(c, s, 0.03);
            for (var i = 1; i <= 3; i++) {
                c.beginPath();
                c.arc(x, y, s * 0.1 * i, 0, Math.PI * 2);
                c.stroke();
            }
            for (var j = 0; j < 6; j++) {
                var a = (j / 6) * Math.PI * 2;
                c.beginPath();
                c.moveTo(x, y);
                c.lineTo(x + Math.cos(a) * s * 0.34, y + Math.sin(a) * s * 0.34);
                c.stroke();
            }
        } else if (kind === 'ring') {
            ink(c, s, 0.08);
            c.beginPath();
            c.arc(x, y, s * 0.2, 0, Math.PI * 2);
            c.stroke();
            disk(c, x, y - s * 0.22, s * 0.08, '#6faebc', s);
        } else if (kind === 'coin' || kind === 'quarter') {
            disk(c, x, y, s * 0.28, '#e9bd55', s);
        } else if (kind === 'anchor') {
            ink(c, s, 0.07);
            c.beginPath();
            c.arc(x, y + s * 0.12, s * 0.2, 0.2, Math.PI - 0.2);
            c.moveTo(x, y - s * 0.28);
            c.lineTo(x, y + s * 0.16);
            c.stroke();
            disk(c, x, y - s * 0.3, s * 0.08, '#6faebc', s);
        } else if (kind === 'envelope') {
            c.fillStyle = PAPER;
            c.fillRect(x - s * 0.3, y - s * 0.16, s * 0.6, s * 0.36);
            ink(c, s);
            c.strokeRect(x - s * 0.3, y - s * 0.16, s * 0.6, s * 0.36);
            c.beginPath();
            c.moveTo(x - s * 0.3, y - s * 0.16);
            c.lineTo(x, y + s * 0.04);
            c.lineTo(x + s * 0.3, y - s * 0.16);
            c.stroke();
        } else if (kind === 'puzzle') {
            c.fillStyle = '#8b7e9e';
            c.fillRect(x - s * 0.28, y - s * 0.28, s * 0.28, s * 0.28);
            c.fillStyle = '#6faebc';
            c.fillRect(x, y - s * 0.28, s * 0.28, s * 0.28);
            c.fillStyle = '#79aa82';
            c.fillRect(x - s * 0.28, y, s * 0.28, s * 0.28);
            c.fillStyle = '#e9bd55';
            c.fillRect(x, y, s * 0.28, s * 0.28);
            ink(c, s, 0.03);
            c.strokeRect(x - s * 0.28, y - s * 0.28, s * 0.56, s * 0.56);
        } else if (kind === 'butterfly') {
            oval(c, x - s * 0.2, y - s * 0.08, s * 0.18, s * 0.26, '#d97860', s, -0.3);
            oval(c, x + s * 0.2, y - s * 0.08, s * 0.18, s * 0.26, '#e9bd55', s, 0.3);
            oval(c, x, y, s * 0.05, s * 0.22, INK, s);
        } else if (kind === 'speaker') {
            poly(c, [x - s * 0.16, y - s * 0.12, x, y - s * 0.12, x + s * 0.16, y - s * 0.28, x + s * 0.16, y + s * 0.28, x, y + s * 0.12, x - s * 0.16, y + s * 0.12], '#6faebc', s);
        } else if (kind === 'music') {
            disk(c, x - s * 0.12, y + s * 0.16, s * 0.1, INK, s);
            disk(c, x + s * 0.16, y + s * 0.08, s * 0.1, INK, s);
            ink(c, s, 0.05);
            c.beginPath();
            c.moveTo(x - s * 0.04, y + s * 0.16);
            c.lineTo(x - s * 0.04, y - s * 0.24);
            c.lineTo(x + s * 0.24, y - s * 0.32);
            c.lineTo(x + s * 0.24, y + s * 0.08);
            c.stroke();
        } else if (kind === 'gear') {
            disk(c, x, y, s * 0.22, '#8a96a0', s);
            for (var i = 0; i < 6; i++) {
                var a = (i / 6) * Math.PI * 2;
                c.fillStyle = '#8a96a0';
                c.beginPath();
                c.arc(x + Math.cos(a) * s * 0.28, y + Math.sin(a) * s * 0.28, s * 0.08, 0, Math.PI * 2);
                c.fill();
            }
            disk(c, x, y, s * 0.08, PAPER, s);
        } else if (kind === 'question') {
            disk(c, x, y, s * 0.32, '#efe1c5', s);
            c.fillStyle = INK;
            c.font = '800 ' + Math.round(s * 0.42) + 'px Fredoka, sans-serif';
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.fillText('?', x, y + s * 0.02);
        } else if (kind === 'zap' || kind === 'quick') {
            poly(c, [x - s * 0.04, y - s * 0.36, x + s * 0.16, y - s * 0.04, x, y - s * 0.04, x + s * 0.08, y + s * 0.36, x - s * 0.18, y + s * 0.02, x, y + s * 0.02], '#e9bd55', s);
        } else if (kind === 'dot') {
            disk(c, x, y, s * 0.22, INK, s);
        } else if (kind === 'red' || kind === 'green' || kind === 'yellow') {
            disk(c, x, y, s * 0.32, kind === 'red' ? '#d97860' : (kind === 'green' ? '#79aa82' : '#e9bd55'), s);
        } else if (kind === 'arm' || kind === 'hand' || kind === 'leg' || kind === 'foot' || kind === 'ankle' || kind === 'elbow' || kind === 'lip' || kind === 'ear' || kind === 'eye' || kind === 'nose' || kind === 'tooth' || kind === 'neck') {
            oval(c, x, y, s * 0.16, s * 0.28, '#f4c7a1', s, kind === 'arm' || kind === 'leg' ? 0.4 : 0);
            if (kind === 'eye') disk(c, x, y, s * 0.22, PAPER, s), eye(c, x, y, s * 0.1);
            if (kind === 'ear') oval(c, x, y, s * 0.14, s * 0.22, '#f4c7a1', s);
            if (kind === 'tooth') oval(c, x, y, s * 0.16, s * 0.22, PAPER, s);
        } else if (kind === 'family') {
            personOf(c, x - s * 0.16, y, s * 0.8, 'dad');
            personOf(c, x + s * 0.18, y + s * 0.06, s * 0.7, 'kid');
        } else if (kind === 'win') {
            poly(c, [x - s * 0.2, y - s * 0.04, x, y - s * 0.32, x + s * 0.2, y - s * 0.04, x + s * 0.16, y + s * 0.24, x - s * 0.16, y + s * 0.24], '#e9bd55', s);
        } else if (kind === 'tent') {
            poly(c, [x - s * 0.36, y + s * 0.24, x, y - s * 0.32, x + s * 0.36, y + s * 0.24], '#6faebc', s);
        } else if (kind === 'igloo') {
            disk(c, x, y, s * 0.3, '#cfe6ea', s);
            c.fillStyle = PAPER;
            c.fillRect(x - s * 0.1, y + s * 0.08, s * 0.2, s * 0.22);
        } else if (kind === 'net') {
            ink(c, s, 0.04);
            c.beginPath();
            c.moveTo(x - s * 0.32, y - s * 0.2);
            c.lineTo(x + s * 0.32, y - s * 0.2);
            c.lineTo(x + s * 0.24, y + s * 0.28);
            c.lineTo(x - s * 0.24, y + s * 0.28);
            c.closePath();
            c.stroke();
        } else if (kind === 'slide' || kind === 'swing') {
            ink(c, s, 0.06);
            c.strokeStyle = '#6faebc';
            c.beginPath();
            c.moveTo(x - s * 0.32, y - s * 0.28);
            c.lineTo(x + s * 0.32, y + s * 0.28);
            c.stroke();
            c.fillStyle = '#d97860';
            c.fillRect(x - s * 0.36, y - s * 0.32, s * 0.12, s * 0.12);
        } else if (kind === 'pool') {
            oval(c, x, y, s * 0.36, s * 0.2, '#6faebc', s);
        } else if (kind === 'road') {
            c.fillStyle = '#8a96a0';
            c.fillRect(x - s * 0.4, y - s * 0.12, s * 0.8, s * 0.24);
            c.fillStyle = '#e9bd55';
            c.fillRect(x - s * 0.2, y - s * 0.02, s * 0.12, s * 0.04);
            c.fillRect(x + s * 0.08, y - s * 0.02, s * 0.12, s * 0.04);
        } else if (kind === 'xray') {
            oval(c, x, y, s * 0.16, s * 0.32, '#cfe6ea', s);
            ink(c, s, 0.03);
            c.beginPath();
            c.moveTo(x, y - s * 0.28);
            c.lineTo(x, y + s * 0.28);
            c.stroke();
        } else if (kind === 'axle') {
            disk(c, x, y, s * 0.16, '#8a96a0', s);
            ink(c, s, 0.06);
            c.beginPath();
            c.moveTo(x - s * 0.36, y);
            c.lineTo(x + s * 0.36, y);
            c.stroke();
        } else if (kind === 'yoyo') {
            disk(c, x, y + s * 0.08, s * 0.22, '#d97860', s);
            ink(c, s, 0.03);
            c.beginPath();
            c.moveTo(x, y - s * 0.32);
            c.lineTo(x, y - s * 0.08);
            c.stroke();
        } else if (kind === 'yarn' || kind === 'rug') {
            disk(c, x, y, s * 0.28, '#d97860', s);
            ink(c, s, 0.03);
            c.beginPath();
            c.arc(x, y, s * 0.14, 0, Math.PI * 1.5);
            c.stroke();
        } else if (kind === 'zigzag') {
            ink(c, s, 0.07);
            c.beginPath();
            c.moveTo(x - s * 0.32, y + s * 0.16);
            c.lineTo(x - s * 0.12, y - s * 0.2);
            c.lineTo(x + s * 0.08, y + s * 0.16);
            c.lineTo(x + s * 0.32, y - s * 0.2);
            c.stroke();
        } else if (kind === 'zip') {
            faceOf(c, x, y, s, 'quiet');
            ink(c, s, 0.04);
            c.beginPath();
            c.moveTo(x - s * 0.12, y + s * 0.12);
            c.lineTo(x + s * 0.12, y + s * 0.12);
            c.stroke();
        } else if (kind === 'open') {
            c.fillStyle = '#d9a066';
            c.fillRect(x - s * 0.24, y - s * 0.08, s * 0.48, s * 0.32);
            c.fillStyle = '#e9bd55';
            c.fillRect(x - s * 0.24, y - s * 0.24, s * 0.48, s * 0.16);
        } else if (kind === 'mix') {
            bowlOf(c, x, y, s, '#fffdf7');
            ink(c, s, 0.04);
            c.beginPath();
            c.moveTo(x + s * 0.08, y - s * 0.28);
            c.lineTo(x - s * 0.04, y + s * 0.08);
            c.stroke();
        } else if (kind === 'hit') {
            disk(c, x, y, s * 0.24, '#d97860', s);
        } else if (kind === 'jump') {
            personOf(c, x, y + s * 0.04, s, 'kid');
        } else if (kind === 'eat') {
            bowlOf(c, x, y, s, '#fffdf7');
            c.fillStyle = '#d9a066';
            c.fillRect(x + s * 0.16, y - s * 0.08, s * 0.06, s * 0.28);
        } else if (kind === 'art') {
            disk(c, x - s * 0.1, y, s * 0.14, '#d97860', s);
            disk(c, x + s * 0.12, y - s * 0.08, s * 0.12, '#6faebc', s);
            disk(c, x + s * 0.06, y + s * 0.12, s * 0.12, '#e9bd55', s);
        } else if (kind === 'mask') {
            oval(c, x, y, s * 0.3, s * 0.2, '#8b7e9e', s);
            disk(c, x - s * 0.1, y, s * 0.06, PAPER, s);
            disk(c, x + s * 0.1, y, s * 0.06, PAPER, s);
        } else if (kind === 'vet') {
            personOf(c, x, y, s, 'nurse');
        } else if (kind === 'quiz') {
            miscOf(c, x, y, s, 'note');
        } else if (kind === 'zoo') {
            drawCritter(c, x, y, s, 'lion', '#e9bd55');
        } else {
            disk(c, x, y, s * 0.32, col(hash(kind) % 8), s);
        }
    }
    function misc(kind) {
        return function (c, x, y, s) { miscOf(c, x, y, s, kind); };
    }

    function jogger(c, x, y, s) {
        c.strokeStyle = '#c4a574';
        c.lineWidth = Math.max(2, s * 0.04);
        c.beginPath();
        c.moveTo(x - s * 0.42, y + s * 0.44);
        c.lineTo(x + s * 0.42, y + s * 0.44);
        c.stroke();
        limb(c, x - s * 0.02, y + s * 0.06, x - s * 0.2, y + s * 0.28, s * 0.08, '#3d5a80');
        limb(c, x - s * 0.2, y + s * 0.28, x - s * 0.3, y + s * 0.4, s * 0.08, '#3d5a80');
        limb(c, x + s * 0.02, y + s * 0.06, x + s * 0.18, y + s * 0.22, s * 0.08, '#3d5a80');
        limb(c, x + s * 0.18, y + s * 0.22, x + s * 0.34, y + s * 0.16, s * 0.08, '#3d5a80');
        c.fillStyle = '#d97860';
        c.beginPath();
        c.ellipse(x - s * 0.32, y + s * 0.42, s * 0.09, s * 0.045, 0, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.ellipse(x + s * 0.38, y + s * 0.16, s * 0.09, s * 0.045, 0.25, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#6faebc';
        c.beginPath();
        c.ellipse(x, y - s * 0.02, s * 0.15, s * 0.2, -0.25, 0, Math.PI * 2);
        c.fill();
        limb(c, x - s * 0.06, y - s * 0.08, x - s * 0.24, y - s * 0.2, s * 0.07, '#f4c7a1');
        limb(c, x + s * 0.08, y - s * 0.02, x + s * 0.26, y + s * 0.1, s * 0.07, '#f4c7a1');
        c.fillStyle = '#f4c7a1';
        c.beginPath();
        c.arc(x + s * 0.08, y - s * 0.28, s * 0.13, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#5c3d2e';
        c.beginPath();
        c.ellipse(x + s * 0.06, y - s * 0.34, s * 0.12, s * 0.08, 0, Math.PI, 0);
        c.fill();
        eye(c, x + s * 0.12, y - s * 0.28, s * 0.035);
        c.fillStyle = '#fff';
        c.beginPath();
        c.arc(x + s * 0.16, y - s * 0.22, s * 0.035, 0, Math.PI);
        c.fill();
    }

    function text(c, word, x, y, size) {
        c.fillStyle = INK;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.font = '800 ' + size + 'px Fredoka, sans-serif';
        c.fillText(word, x, y);
    }
    function generic(c, x, y, s, word, withText) {
        disk(c, x, y, s * 0.46, col(hash(word) % 8), s);
        if (withText === false) return;
        var w = String(word || '');
        var fs = Math.min(s * 0.42, (s * 1.4) / Math.max(1, w.length));
        c.fillStyle = PAPER;
        text(c, w, x, y, Math.round(fs));
    }
    function emojiOf(word) {
        var key = String(word || '').toLowerCase();
        var list = window.D || [];
        for (var i = 0; i < list.length; i++) {
            if (String(list[i].w || '').toLowerCase() === key) return list[i].emoji || '';
        }
        return '';
    }
    function inkRect(data, width, height, alphaMin) {
        var stats = inkStats(data, width, height, alphaMin);
        if (!stats) return null;
        return { x: stats.x, y: stats.y, w: stats.w, h: stats.h };
    }
    function inkStats(data, width, height, alphaMin) {
        var minA = alphaMin == null ? 40 : alphaMin;
        var minX = width;
        var minY = height;
        var maxX = -1;
        var maxY = -1;
        var sx = 0;
        var sy = 0;
        var sw = 0;
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                var a = data[(y * width + x) * 4 + 3];
                if (a < minA) continue;
                if (x < minX) minX = x;
                if (y < minY) minY = y;
                if (x > maxX) maxX = x;
                if (y > maxY) maxY = y;
                sx += x * a;
                sy += y * a;
                sw += a;
            }
        }
        if (maxX < minX || sw <= 0) return null;
        return {
            x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1,
            cx: sx / sw, cy: sy / sw
        };
    }
    function emojiNudge(m) {
        if (!m) return { dx: 0, dy: 0 };
        var left = m.actualBoundingBoxLeft || 0;
        var right = m.actualBoundingBoxRight || 0;
        var ascent = m.actualBoundingBoxAscent || 0;
        var descent = m.actualBoundingBoxDescent || 0;
        return {
            dx: (left + right > 1) ? (left - right) / 2 : 0,
            dy: (ascent + descent > 1) ? (ascent - descent) / 2 : 0
        };
    }
    function hostEmojiShift(s) {
        if (typeof navigator === 'undefined') return 0;
        var ua = navigator.userAgent || '';
        if (/iPhone|iPad|iPod/.test(ua)) return -s * 0.16;
        if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return -s * 0.16;
        return 0;
    }
    function fitSprite(srcW, srcH, box, cx, cy) {
        var fit = box * 0.88;
        var scale = Math.min(fit / Math.max(1, srcW), fit / Math.max(1, srcH));
        var dw = srcW * scale;
        var dh = srcH * scale;
        var ox = cx == null ? srcW / 2 : cx;
        var oy = cy == null ? srcH / 2 : cy;
        return { dw: dw, dh: dh, dx: -(ox * scale), dy: -(oy * scale) };
    }
    var emojiBake = {};
    function bakeEmoji(em) {
        if (emojiBake[em]) return emojiBake[em];
        if (typeof document === 'undefined' || !document.createElement) {
            emojiBake[em] = { fail: true };
            return emojiBake[em];
        }
        var fontPx = 96;
        var pad = 48;
        var side = fontPx + pad * 2;
        var off = document.createElement('canvas');
        off.width = side;
        off.height = side;
        var o = off.getContext('2d', { willReadFrequently: true }) || off.getContext('2d');
        if (!o) {
            emojiBake[em] = { fail: true };
            return emojiBake[em];
        }
        o.font = fontPx + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
        o.textAlign = 'center';
        o.textBaseline = 'middle';
        o.fillText(em, side / 2, side / 2);
        var img;
        try {
            img = o.getImageData(0, 0, side, side);
        } catch (err) {
            emojiBake[em] = { fail: true };
            return emojiBake[em];
        }
        var stats = inkStats(img.data, side, side, 40);
        if (!stats) {
            emojiBake[em] = { fail: true };
            return emojiBake[em];
        }
        var sprite = document.createElement('canvas');
        sprite.width = stats.w;
        sprite.height = stats.h;
        sprite.getContext('2d').drawImage(off, stats.x, stats.y, stats.w, stats.h, 0, 0, stats.w, stats.h);
        emojiBake[em] = {
            canvas: sprite, w: stats.w, h: stats.h,
            cx: stats.cx - stats.x, cy: stats.cy - stats.y
        };
        return emojiBake[em];
    }
    function cloneSprite(baked) {
        var copy = document.createElement('canvas');
        copy.width = baked.w;
        copy.height = baked.h;
        copy.className = 'zizi-pic-sprite';
        copy.getContext('2d').drawImage(baked.canvas, 0, 0);
        return copy;
    }
    function drawCenteredEmoji(c, em, s) {
        var baked = bakeEmoji(em);
        if (baked && !baked.fail) {
            var place = fitSprite(baked.w, baked.h, s, baked.cx, baked.cy);
            c.drawImage(baked.canvas, place.dx, place.dy, place.dw, place.dh);
            return;
        }
        c.fillStyle = INK;
        c.font = Math.round(s * 0.72) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        var n = emojiNudge(c.measureText(em));
        var dx = n.dx || hostEmojiShift(s);
        c.fillText(em, dx, n.dy);
    }

    var draw = {
        ant: bug('ant'),
        apple: fruit('#d97860'),
        car: vehicle('car', '#d97860'),
        bus: vehicle('bus', '#d9a066'),
        cat: critter('cat', '#d9a066'),
        dog: critter('dog', '#8d5524'),
        pig: critter('pig', '#e2a3ab'),
        sun: nature('sun'),
        bush: plant('tree'),
        quilt: furniture('quilt'),
        bed: furniture('bed'),
        balloon: function (c, x, y, s) {
            oval(c, x, y - s * 0.08, s * 0.28, s * 0.36, '#d97860', s);
            ink(c, s, 0.03);
            c.beginPath();
            c.moveTo(x, y + s * 0.28);
            c.quadraticCurveTo(x + s * 0.05, y + s * 0.4, x, y + s * 0.5);
            c.stroke();
        },
        star: nature('star'),
        jog: function (c, x, y, s) { jogger(c, x, y, s); },
        run: function (c, x, y, s) { jogger(c, x, y, s); },
        hop: function (c, x, y, s) { jogger(c, x, y, s); },
        heart: function (c, x, y, s) {
            c.fillStyle = '#d97860';
            c.beginPath();
            c.moveTo(x, y + s * 0.36);
            c.bezierCurveTo(x - s * 0.5, y + s * 0.06, x - s * 0.4, y - s * 0.34, x, y - s * 0.1);
            c.bezierCurveTo(x + s * 0.4, y - s * 0.34, x + s * 0.5, y + s * 0.06, x, y + s * 0.36);
            c.closePath();
            c.fill();
            c.fillStyle = 'rgba(255,255,255,0.45)';
            c.beginPath();
            c.ellipse(x - s * 0.12, y - s * 0.06, s * 0.08, s * 0.05, -0.6, 0, Math.PI * 2);
            c.fill();
        },
        rocket: function (c, x, y, s) {
            c.fillStyle = '#d97860';
            c.beginPath();
            c.moveTo(x, y - s * 0.5);
            c.quadraticCurveTo(x + s * 0.28, y, x + s * 0.18, y + s * 0.34);
            c.lineTo(x - s * 0.18, y + s * 0.34);
            c.quadraticCurveTo(x - s * 0.28, y, x, y - s * 0.5);
            c.fill();
            c.fillStyle = '#cfe6ea';
            c.beginPath(); c.arc(x, y - s * 0.08, s * 0.1, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#6faebc';
            c.beginPath(); c.moveTo(x - s * 0.16, y + s * 0.34); c.lineTo(x - s * 0.3, y + s * 0.5); c.lineTo(x - s * 0.1, y + s * 0.34); c.closePath(); c.fill();
            c.beginPath(); c.moveTo(x + s * 0.16, y + s * 0.34); c.lineTo(x + s * 0.3, y + s * 0.5); c.lineTo(x + s * 0.1, y + s * 0.34); c.closePath(); c.fill();
            c.fillStyle = '#e9bd55';
            c.beginPath();
            c.moveTo(x, y + s * 0.34);
            c.quadraticCurveTo(x + s * 0.08, y + s * 0.52, x, y + s * 0.62);
            c.quadraticCurveTo(x - s * 0.08, y + s * 0.52, x, y + s * 0.34);
            c.fill();
        },
        iron: function (c, x, y, s) {
            // Clothes iron pressing a shirt. Never red — a red body + handle
            // reads as a fire extinguisher (🧯), which is not 熨斗.
            c.fillStyle = '#6faebc';
            c.beginPath();
            c.moveTo(x - s * 0.36, y + s * 0.18);
            c.lineTo(x - s * 0.08, y + s * 0.1);
            c.lineTo(x + s * 0.14, y + s * 0.1);
            c.lineTo(x + s * 0.44, y + s * 0.2);
            c.lineTo(x + s * 0.38, y + s * 0.44);
            c.lineTo(x - s * 0.32, y + s * 0.44);
            c.closePath();
            c.fill();
            c.beginPath();
            c.moveTo(x - s * 0.12, y + s * 0.12);
            c.lineTo(x - s * 0.42, y - s * 0.02);
            c.lineTo(x - s * 0.48, y + s * 0.14);
            c.lineTo(x - s * 0.22, y + s * 0.22);
            c.closePath();
            c.fill();
            c.beginPath();
            c.moveTo(x + s * 0.1, y + s * 0.12);
            c.lineTo(x + s * 0.4, y - s * 0.02);
            c.lineTo(x + s * 0.48, y + s * 0.14);
            c.lineTo(x + s * 0.26, y + s * 0.22);
            c.closePath();
            c.fill();
            c.fillStyle = '#a9d5df';
            c.beginPath();
            c.moveTo(x - s * 0.04, y + s * 0.1);
            c.lineTo(x + s * 0.04, y + s * 0.22);
            c.lineTo(x + s * 0.12, y + s * 0.1);
            c.closePath();
            c.fill();
            c.strokeStyle = 'rgba(186,230,253,0.95)';
            c.lineWidth = Math.max(2, s * 0.04);
            c.lineCap = 'round';
            [[-0.5, -0.06], [-0.44, -0.18], [-0.32, -0.28]].forEach(function (p) {
                c.beginPath();
                c.moveTo(x + s * p[0], y + s * (p[1] + 0.08));
                c.quadraticCurveTo(x + s * p[0] - s * 0.05, y + s * p[1], x + s * p[0], y + s * (p[1] - 0.08));
                c.stroke();
            });
            c.fillStyle = '#cfd8dc';
            c.beginPath();
            c.moveTo(x - s * 0.44, y + s * 0.1);
            c.lineTo(x + s * 0.3, y - s * 0.02);
            c.lineTo(x + s * 0.34, y + s * 0.16);
            c.lineTo(x - s * 0.18, y + s * 0.24);
            c.closePath();
            c.fill();
            c.fillStyle = '#90a4ae';
            c.beginPath();
            c.moveTo(x - s * 0.4, y + s * 0.12);
            c.lineTo(x + s * 0.28, y + s * 0.02);
            c.lineTo(x + s * 0.3, y + s * 0.12);
            c.lineTo(x - s * 0.16, y + s * 0.2);
            c.closePath();
            c.fill();
            c.fillStyle = '#5b7c8a';
            c.beginPath();
            c.moveTo(x - s * 0.18, y + s * 0.02);
            c.lineTo(x + s * 0.22, y - s * 0.08);
            c.lineTo(x + s * 0.26, y + s * 0.08);
            c.lineTo(x - s * 0.04, y + s * 0.14);
            c.closePath();
            c.fill();
            c.strokeStyle = INK;
            c.lineWidth = s * 0.1;
            c.lineCap = 'round';
            c.beginPath();
            c.moveTo(x - s * 0.02, y);
            c.quadraticCurveTo(x + s * 0.1, y - s * 0.34, x + s * 0.22, y - s * 0.04);
            c.stroke();
            c.fillStyle = '#868e96';
            c.beginPath();
            c.arc(x + s * 0.06, y + s * 0.1, s * 0.03, 0, Math.PI * 2);
            c.fill();
            c.beginPath();
            c.arc(x - s * 0.08, y + s * 0.14, s * 0.028, 0, Math.PI * 2);
            c.fill();
        }
    };

    Object.assign(draw, {
        airplane: vehicle('plane'),
        alien: critter('alien', '#79aa82'),
        alligator: critter('alligator', '#79aa82'),
        ambulance: vehicle('ambulance', '#fffdf7'),
        anchor: misc('anchor'),
        ankle: misc('ankle'),
        apron: clothes('apron', '#fffdf7'),
        arm: misc('arm'),
        arrow: arrow('right'),
        art: misc('art'),
        astronaut: person('astronaut'),
        axe: tool('axe'),
        axle: misc('axle'),
        baby: person('kid'),
        bag: box('#c4894d'),
        ball: ball('#d97860'),
        banana: bananaOf,
        barn: house('#d97860'),
        bat: bird('#8b7e9e', 'bat'),
        bear: critter('bear', '#8d5524'),
        bee: bug('bee'),
        bell: misc('bell'),
        berry: fruit('#d97860'),
        bicycle: vehicle('bike'),
        bird: bird('#d97860'),
        boat: vehicle('boat'),
        book: misc('book'),
        box: box('#d9a066'),
        bread: food('bread'),
        bug: bug('bug'),
        butterfly: misc('butterfly'),
        cake: food('cake'),
        camera: misc('camera'),
        candy: food('candy'),
        cap: hat('cap', '#6faebc'),
        carrot: fruit('#d97860'),
        chair: furniture('chair'),
        chicken: bird('#e9bd55', 'chicken'),
        clock: furniture('clock'),
        cloud: nature('cloud'),
        coat: clothes('coat', '#6faebc'),
        coin: misc('coin'),
        cookie: food('cookie'),
        corn: fruit('#e9bd55'),
        cow: critter('cow', '#fffdf7'),
        crab: bug('crab'),
        crown: hat('crown'),
        cup: cup('#6faebc'),
        cupcake: food('cupcake'),
        dad: person('dad'),
        deer: critter('deer', '#c4894d'),
        desk: furniture('table'),
        dinosaur: critter('alligator', '#79aa82'),
        dish: bowlOf,
        doll: person('kid'),
        donut: food('donut'),
        door: furniture('door'),
        dot: misc('dot'),
        dragon: critter('alligator', '#79aa82'),
        dress: clothes('dress', '#e2a3ab'),
        drum: misc('drum'),
        duck: bird('#e9bd55', 'duck'),
        eagle: bird('#c4894d', 'eagle'),
        ear: misc('ear'),
        earth: nature('earth'),
        eat: misc('eat'),
        egg: food('egg'),
        elbow: misc('elbow'),
        elephant: critter('elephant', '#b7c0c6'),
        elf: person('elf'),
        elk: critter('elk', '#c4894d'),
        engine: vehicle('train'),
        envelope: misc('envelope'),
        eye: misc('eye'),
        family: misc('family'),
        fan: nature('star'),
        farm: house('#d9a066'),
        feather: plant('feather'),
        fin: fish('#6faebc'),
        fire: nature('fire'),
        fish: fish('#6faebc'),
        flag: misc('flag'),
        flower: plant('flower', '#d97860'),
        fog: nature('fog'),
        foot: misc('foot'),
        football: ball('#8d5524'),
        fork: tool('pen'),
        fox: critter('fox', '#d97860'),
        frog: critter('frog', '#79aa82'),
        fruit: grapesOf,
        garden: house('#79aa82'),
        gas: vehicle('car', '#d9a066'),
        gear: misc('gear'),
        gift: misc('gift'),
        girl: person('girl'),
        glove: clothes('glove', '#d97860'),
        glue: food('jar'),
        goat: critter('goat', '#efe1c5'),
        gorilla: critter('bear', '#5c3d2e'),
        grape: grapesOf,
        grass: plant('grass'),
        green: misc('green'),
        guitar: misc('guitar'),
        gum: ball('#e2a3ab'),
        hammer: tool('hammer'),
        hand: misc('hand'),
        hat: hat('hat', '#243e4a'),
        helicopter: vehicle('heli'),
        hen: bird('#d97860', 'hen'),
        hill: nature('hill'),
        hippo: critter('hippo', '#b7c0c6'),
        hit: misc('hit'),
        honey: food('honey'),
        hook: tool('hook'),
        horse: critter('horse', '#8d5524'),
        house: house('#d9a066'),
        ice: food('ice'),
        icecream: food('icecream'),
        idea: tool('idea'),
        igloo: misc('igloo'),
        iguana: critter('alligator', '#79aa82'),
        ill: face('ill'),
        ink: cup('#243e4a'),
        insect: bug('insect'),
        island: nature('island'),
        ivy: plant('ivy'),
        jacket: clothes('jacket', '#3d5a80'),
        jam: food('jam'),
        jar: food('jar'),
        jeep: vehicle('car', '#79aa82'),
        jelly: food('jelly'),
        jet: vehicle('jet'),
        jug: food('jug'),
        juice: food('juice'),
        jump: misc('jump'),
        jungle: plant('jungle'),
        kangaroo: critter('kangaroo', '#d9a066'),
        keg: food('urn'),
        ketchup: fruit('#d97860'),
        key: tool('key'),
        kid: person('kid'),
        king: person('king'),
        kit: tool('kit'),
        kitchen: furniture('table'),
        kite: misc('flag'),
        kiwi: fruit('#79aa82'),
        koala: critter('koala', '#b7c0c6'),
        ladder: furniture('ladder'),
        ladybug: bug('lady'),
        lake: nature('lake'),
        lamp: tool('lamp'),
        leaf: plant('leaf'),
        leg: misc('leg'),
        lemon: fruit('#e9bd55'),
        lion: critter('lion', '#e9bd55'),
        lip: misc('lip'),
        lock: tool('lock'),
        log: box('#8d5524'),
        lollipop: food('lollipop'),
        lunch: food('lunch'),
        man: person('man'),
        mango: fruit('#d9a066'),
        map: misc('map'),
        mask: misc('mask'),
        mat: furniture('mat'),
        milk: food('milk'),
        mix: misc('mix'),
        mom: person('mom'),
        monkey: critter('monkey', '#8d5524'),
        moon: nature('moon'),
        mountain: nature('mountain'),
        mouse: critter('mouse', '#b7c0c6'),
        muffin: food('muffin'),
        mug: cup('#d97860'),
        mushroom: plant('plant'),
        music: misc('music'),
        nail: tool('nail'),
        nap: face('nap'),
        neck: misc('neck'),
        nest: bowlOf,
        net: misc('net'),
        night: nature('night'),
        nine: num(9),
        noodle: food('noodle'),
        nose: misc('nose'),
        note: misc('note'),
        notebook: misc('notebook'),
        nurse: person('nurse'),
        nut: fruit('#c4894d'),
        oak: plant('tree'),
        ocean: nature('ocean'),
        octopus: bug('bug'),
        oil: food('urn'),
        olive: fruit('#6f8f7a'),
        onion: fruit('#c9a0c0'),
        open: misc('open'),
        orange: fruit('#d9a066'),
        oven: box('#8a96a0'),
        owl: bird('#c4894d', 'owl'),
        ox: critter('ox', '#8d5524'),
        pan: bowlOf,
        panda: critter('panda'),
        park: plant('tree'),
        peach: fruit('#e2a3ab'),
        pear: fruit('#79aa82'),
        pen: tool('pen'),
        pencil: tool('pencil'),
        pillow: furniture('pillow'),
        pizza: food('pizza'),
        plane: vehicle('plane'),
        plant: plant('plant'),
        pool: misc('pool'),
        popcorn: food('popcorn'),
        pot: food('pot'),
        pumpkin: fruit('#d9a066'),
        puppy: critter('puppy', '#d9a066'),
        puzzle: misc('puzzle'),
        quack: bird('#e9bd55', 'duck'),
        quarter: misc('quarter'),
        queen: hat('crown'),
        question: misc('question'),
        quick: misc('quick'),
        quiet: face('quiet'),
        quiz: misc('quiz'),
        rabbit: critter('rabbit', '#efe1c5'),
        radio: misc('radio'),
        rain: nature('rain'),
        rainbow: nature('rainbow'),
        rat: critter('mouse', '#8a96a0'),
        red: misc('red'),
        rice: food('rice'),
        ring: misc('ring'),
        road: misc('road'),
        robot: person('astronaut'),
        rock: nature('rock'),
        rose: plant('rose', '#d97860'),
        rug: misc('rug'),
        sad: face('sad'),
        sand: nature('sand'),
        seal: critter('seal', '#b7c0c6'),
        ship: vehicle('ship'),
        shirt: clothes('shirt', '#6faebc'),
        shoe: clothes('shoe', '#d97860'),
        sit: furniture('sit'),
        six: num(6),
        slide: misc('slide'),
        snail: bug('snail'),
        snake: bug('snake'),
        snow: nature('snow'),
        soap: box('#cfe6ea'),
        sock: clothes('sock', '#6faebc'),
        soup: food('soup'),
        speaker: misc('speaker'),
        spoon: tool('pen'),
        sunflower: plant('sunflower', '#e9bd55'),
        swing: misc('swing'),
        table: furniture('table'),
        tap: misc('water'),
        taxi: vehicle('car', '#e9bd55'),
        telephone: misc('telephone'),
        ten: num(10),
        tent: misc('tent'),
        tiger: critter('tiger', '#d9a066'),
        toast: food('toast'),
        tomato: fruit('#d97860'),
        tooth: misc('tooth'),
        towel: box('#a9d5df'),
        toy: critter('bear', '#d9a066'),
        train: vehicle('train'),
        tree: plant('tree'),
        truck: vehicle('truck', '#6faebc'),
        tub: bowlOf,
        turtle: critter('turtle', '#79aa82'),
        ufo: vehicle('ufo'),
        umbrella: hat('hat', '#6faebc'),
        uncle: person('uncle'),
        under: arrow('down'),
        unicorn: critter('horse', '#fffdf7'),
        uniform: clothes('uniform', '#6faebc'),
        up: arrow('up'),
        urn: food('urn'),
        vacuum: tool('kit'),
        van: vehicle('van', '#6faebc'),
        vase: food('urn'),
        vest: clothes('vest', '#d97860'),
        vet: misc('vet'),
        video: misc('video'),
        vine: plant('vine'),
        violin: misc('violin'),
        volcano: nature('volcano'),
        wagon: vehicle('truck', '#d9a066'),
        watch: misc('watch'),
        water: nature('water'),
        watermelon: melonOf,
        wax: food('candle'),
        web: misc('web'),
        wet: nature('wet'),
        whale: fish('#6faebc'),
        wig: clothes('wig'),
        win: misc('win'),
        window: furniture('window'),
        wolf: critter('wolf', '#8a96a0'),
        worm: bug('worm'),
        xray: misc('xray'),
        yak: critter('yak', '#8d5524'),
        yam: fruit('#c4894d'),
        yarn: misc('yarn'),
        yell: face('yell'),
        yellow: misc('yellow'),
        yogurt: food('yogurt'),
        yolk: fruit('#e9bd55'),
        yoyo: misc('yoyo'),
        zap: misc('zap'),
        zebra: critter('zebra', '#fffdf7'),
        zero: num(0),
        zigzag: misc('zigzag'),
        zip: misc('zip'),
        zoo: misc('zoo'),
        zucchini: fruit('#79aa82'),
    });

    function pictureEl(word, size) {
        var wrap = document.createElement('div');
        wrap.className = 'zizi-pic';
        wrap.setAttribute('aria-hidden', 'true');
        var px = size || 88;
        wrap.style.width = px + 'px';
        wrap.style.height = px + 'px';
        var key = String(word || '').toLowerCase();
        var dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
        function shapeCanvas(paint) {
            var cvs = document.createElement('canvas');
            cvs.width = Math.round(px * dpr);
            cvs.height = Math.round(px * dpr);
            cvs.style.width = '100%';
            cvs.style.height = '100%';
            var ctx = cvs.getContext('2d');
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            paint(ctx);
            wrap.appendChild(cvs);
            return wrap;
        }
        if (draw[key]) {
            return shapeCanvas(function (ctx) {
                draw[key](ctx, px / 2, px / 2, px * 0.78);
            });
        }
        var em = emojiOf(key);
        if (em) {
            var baked = bakeEmoji(em);
            if (baked && !baked.fail) {
                wrap.appendChild(cloneSprite(baked));
                return wrap;
            }
            var span = document.createElement('span');
            span.className = 'zizi-emoji';
            span.textContent = em;
            wrap.appendChild(span);
            return wrap;
        }
        return shapeCanvas(function (ctx) {
            generic(ctx, px / 2, px / 2, px * 0.78, key, true);
        });
    }

    function sizeFor(el, fallback) {
        var n = parseInt(el.getAttribute('data-art-size'), 10);
        if (n > 0) return n;
        if (el.classList.contains('album-detail-emoji')) return 92;
        if (el.classList.contains('celebrate-emoji')) return 88;
        if (el.classList.contains('album-emoji')) return 56;
        if (el.classList.contains('home-btn-emoji')) return 44;
        if (el.classList.contains('zizi-coach-emoji')) return 40;
        if (el.classList.contains('write-chip-emoji')) return 34;
        if (el.classList.contains('home-stat-emoji')) return 28;
        if (el.classList.contains('home-quest-emoji')) return 24;
        if (el.classList.contains('arena-word-pic')) return 28;
        return fallback || 44;
    }

    function fill(el, word, size) {
        if (!el) return;
        el.innerHTML = '';
        el.appendChild(pictureEl(word, size || sizeFor(el, 44)));
    }

    function fillAll(root) {
        var scope = root || (typeof document !== 'undefined' ? document : null);
        if (!scope || !scope.querySelectorAll) return;
        Array.prototype.forEach.call(scope.querySelectorAll('[data-art-word]'), function (el) {
            var word = el.getAttribute('data-art-word');
            if (!word) return;
            fill(el, word, sizeFor(el, 44));
        });
    }

    window.ZiziArt = {
        has: function (word) {
            var key = String(word || '').toLowerCase();
            return !!draw[key] || !!emojiOf(key);
        },
        fitWord: function (ctx, word, maxW, maxPx) {
            var fs = Math.round(maxPx);
            ctx.font = '800 ' + fs + 'px Fredoka, sans-serif';
            while (fs > 22 && ctx.measureText(word).width > maxW) {
                fs -= 2;
                ctx.font = '800 ' + fs + 'px Fredoka, sans-serif';
            }
            return fs;
        },
        drawWord: function (ctx, word, x, y, s, t, skipLabel) {
            var key = String(word || '').toLowerCase();
            var tt = t || 0;
            var bob = Math.sin(tt * 3) * s * 0.03;
            var blink = (Math.floor(tt * 0.8) + key.length) % 6 === 0;
            ctx.save();
            ctx.translate(x, y + bob);
            ctx.scale(1, blink ? 0.92 : 1);
            if (draw[key]) {
                draw[key](ctx, 0, 0, s);
            } else {
                var em = emojiOf(key);
                if (em) {
                    drawCenteredEmoji(ctx, em, s);
                } else {
                    generic(ctx, 0, 0, s, key, !skipLabel);
                }
            }
            ctx.restore();
        },
        usesShape: function (word) {
            return !!draw[String(word || '').toLowerCase()];
        },
        pictureEl: pictureEl,
        fill: fill,
        fillAll: fillAll,
        portrait: function (pose) {
            var name = pose === 'cheer' ? 'zizi-cheer.jpg' : (pose === 'think' ? 'zizi-think.jpg' : 'zizi-wave.jpg');
            return 'img/characters/' + name;
        },
        inkRect: inkRect,
        inkStats: inkStats,
        emojiNudge: emojiNudge,
        hostEmojiShift: hostEmojiShift,
        fitSprite: fitSprite,
        color: col
    };

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () { fillAll(document); });
        } else {
            fillAll(document);
        }
    }
})();
