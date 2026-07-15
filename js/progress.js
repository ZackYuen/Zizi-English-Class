// ==========================================
// ⭐ Stars + Word Album for a 5-year-old learner
// Persists in localStorage — works offline
// ==========================================

const PROGRESS_KEY = 'zizi_progress_v1';

function loadProgress() {
    try {
        const raw = localStorage.getItem(PROGRESS_KEY);
        if (!raw) return { stars: 0, words: {}, streakDays: 0, lastPlayDate: '' };
        const data = JSON.parse(raw);
        return {
            stars: Number(data.stars) || 0,
            words: data.words && typeof data.words === 'object' ? data.words : {},
            streakDays: Number(data.streakDays) || 0,
            lastPlayDate: data.lastPlayDate || ''
        };
    } catch (e) {
        return { stars: 0, words: {}, streakDays: 0, lastPlayDate: '' };
    }
}

function saveProgress(data) {
    try {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn('progress save failed', e);
    }
}

window.getProgress = function () {
    return loadProgress();
};

function todayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}

function bumpStreak(data) {
    const today = todayKey();
    if (data.lastPlayDate === today) return data;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = yesterday.getFullYear() + '-' + (yesterday.getMonth() + 1) + '-' + yesterday.getDate();
    data.streakDays = data.lastPlayDate === yKey ? (data.streakDays || 0) + 1 : 1;
    data.lastPlayDate = today;
    return data;
}

/** Show floating +⭐ toast + optional confetti */
window.showStarBurst = function (n, label) {
    const amount = n || 1;
    let toast = document.getElementById('star-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'star-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = (label ? label + ' ' : '') + '+' + amount + '⭐';
    toast.classList.remove('show');
    // force reflow
    void toast.offsetWidth;
    toast.classList.add('show');
    if (typeof confetti === 'function') {
        confetti({ particleCount: 60 + amount * 20, spread: 70, origin: { y: 0.65 } });
    }
    setTimeout(function () { toast.classList.remove('show'); }, 1600);
};

window.refreshHomeProgress = function () {
    const data = loadProgress();
    const starsEl = document.getElementById('home-stars-count');
    const wordsEl = document.getElementById('home-words-count');
    const streakEl = document.getElementById('home-streak-count');
    if (starsEl) starsEl.textContent = String(data.stars);
    if (wordsEl) wordsEl.textContent = String(Object.keys(data.words).length);
    if (streakEl) streakEl.textContent = String(data.streakDays || 0);
};

/**
 * Award stars and optionally collect a word into the album.
 * @param {number} stars
 * @param {{word?:string, emoji?:string, letter?:string, reason?:string}} meta
 */
window.awardStars = function (stars, meta) {
    const amount = Math.max(0, Number(stars) || 0);
    const info = meta || {};
    let data = loadProgress();
    data = bumpStreak(data);
    data.stars += amount;

    if (info.word) {
        const key = String(info.word).toLowerCase();
        const prev = data.words[key] || { word: key, emoji: '⭐', letter: '', count: 0 };
        data.words[key] = {
            word: key,
            emoji: info.emoji || prev.emoji || '⭐',
            letter: info.letter || prev.letter || (key.charAt(0) || '').toUpperCase(),
            count: (prev.count || 0) + 1,
            lastAt: Date.now()
        };
    }

    saveProgress(data);
    window.refreshHomeProgress();
    if (amount > 0) {
        window.showStarBurst(amount, info.reason || '叻仔');
    }
    return data;
};

window.collectWord = function (word, emoji, letter) {
    return window.awardStars(0, { word: word, emoji: emoji, letter: letter });
};

window.openWordAlbum = function () {
    const data = loadProgress();
    const modal = document.getElementById('album-overlay');
    const grid = document.getElementById('album-grid');
    const empty = document.getElementById('album-empty');
    if (!modal || !grid) return;

    const entries = Object.keys(data.words)
        .map(function (k) { return data.words[k]; })
        .sort(function (a, b) { return (b.lastAt || 0) - (a.lastAt || 0); });

    grid.innerHTML = '';
    if (entries.length === 0) {
        if (empty) empty.style.display = 'block';
    } else {
        if (empty) empty.style.display = 'none';
        entries.forEach(function (item) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'album-card';
            btn.innerHTML =
                '<span class="album-emoji">' + (item.emoji || '⭐') + '</span>' +
                '<span class="album-word">' + item.word + '</span>' +
                '<span class="album-count">×' + (item.count || 1) + '</span>';
            btn.onclick = function () {
                if (window.speakEnglish) window.speakEnglish(item.word);
                else if (window.playCantoneseTTS) {
                    window.playCantoneseTTS('呢個係 ' + item.word);
                }
            };
            grid.appendChild(btn);
        });
    }

    modal.style.display = 'flex';
    modal.classList.add('is-open');
};

window.closeWordAlbum = function () {
    const modal = document.getElementById('album-overlay');
    if (!modal) return;
    modal.style.display = 'none';
    modal.classList.remove('is-open');
};

// Boot home counters when DOM ready
window.addEventListener('load', function () {
    // touch streak on open so kids see continuity
    let data = loadProgress();
    data = bumpStreak(data);
    saveProgress(data);
    window.refreshHomeProgress();
});
