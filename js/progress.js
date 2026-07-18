// ==========================================
// ⭐ Stars + levels + daily quest + word album
// Persists in localStorage — works offline
// ==========================================

const PROGRESS_KEY = 'zizi_progress_v1';
const STARS_PER_LEVEL = 10;

function loadProgress() {
    try {
        const raw = localStorage.getItem(PROGRESS_KEY);
        if (!raw) {
            return {
                stars: 0, words: {}, streakDays: 0, lastPlayDate: '',
                questDate: '', questDone: {}, todayStars: 0
            };
        }
        const data = JSON.parse(raw);
        return {
            stars: Number(data.stars) || 0,
            words: data.words && typeof data.words === 'object' ? data.words : {},
            streakDays: Number(data.streakDays) || 0,
            lastPlayDate: data.lastPlayDate || '',
            questDate: data.questDate || '',
            questDone: data.questDone && typeof data.questDone === 'object' ? data.questDone : {},
            todayStars: Number(data.todayStars) || 0
        };
    } catch (e) {
        return {
            stars: 0, words: {}, streakDays: 0, lastPlayDate: '',
            questDate: '', questDone: {}, todayStars: 0
        };
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

/** Parent-only: wipe stars, album, streak, and daily quests (keeps API keys / voice settings). */
window.resetProgress = function () {
    var ok = window.confirm(
        '確定要重設孜孜嘅進度？\n\n' +
        '會清走：星星、等級、單詞冊、連續日數、今日任務。\n' +
        '唔會清：聲線同 API Key 設定。'
    );
    if (!ok) return false;

    try {
        localStorage.removeItem(PROGRESS_KEY);
    } catch (e) {
        console.warn('progress reset failed', e);
    }

    if (window.refreshHomeProgress) window.refreshHomeProgress();
    if (window.closeWordAlbum) {
        try { window.closeWordAlbum(); } catch (err) { /* ignore */ }
    }
    if (window.ZiziFX) window.ZiziFX.play('whoosh');
    if (window.playCantoneseTTS) {
        window.playCantoneseTTS('進度已經重設喇。可以重新開始玩！', { interrupt: true });
    }
    if (window.closeSettings) window.closeSettings();
    return true;
};

window.getLevelInfo = function (stars) {
    const total = Math.max(0, Number(stars) || 0);
    const level = Math.floor(total / STARS_PER_LEVEL) + 1;
    const into = total % STARS_PER_LEVEL;
    return {
        level: level,
        into: into,
        need: STARS_PER_LEVEL,
        pct: Math.round((into / STARS_PER_LEVEL) * 100),
        title: levelTitle(level)
    };
};

function levelTitle(level) {
    if (level >= 20) return '拼音大王';
    if (level >= 12) return '字母勇士';
    if (level >= 7) return '識字小飛俠';
    if (level >= 4) return '勇敢探險家';
    if (level >= 2) return '小小冒險家';
    return '新手探險家';
}

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

function ensureQuestDay(data) {
    const today = todayKey();
    if (data.questDate !== today) {
        data.questDate = today;
        data.questDone = {};
        data.todayStars = 0;
    }
    return data;
}

/** Mark a daily quest step: 'match' | 'write' | 'listen' | 'stars3' | 'newword' */
window.markQuest = function (key) {
    let data = ensureQuestDay(loadProgress());
    if (!data.questDone[key]) {
        data.questDone[key] = true;
        saveProgress(data);
        window.refreshHomeProgress();
        return true;
    }
    return false;
};

window.getDailyQuest = function () {
    const data = ensureQuestDay(loadProgress());
    const items = [
        { key: 'match', label: '玩一局睇圖識字', emoji: '🖼️', done: !!data.questDone.match },
        { key: 'listen', label: '玩一局聽音挑戰', emoji: '🎧', done: !!data.questDone.listen },
        { key: 'stars3', label: '今日攞 3 粒星', emoji: '⭐', done: (data.todayStars || 0) >= 3 || !!data.questDone.stars3 },
        { key: 'newword', label: '學一個新單詞', emoji: '📚', done: !!data.questDone.newword }
    ];
    const doneCount = items.filter(function (i) { return i.done; }).length;
    return { items: items, doneCount: doneCount, total: items.length, allDone: doneCount >= items.length };
};

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
    void toast.offsetWidth;
    toast.classList.add('show');
    if (window.ZiziFX) window.ZiziFX.play('star');
    if (typeof confetti === 'function') {
        confetti({ particleCount: 60 + amount * 20, spread: 70, origin: { y: 0.65 } });
    }
    setTimeout(function () { toast.classList.remove('show'); }, 1600);
};

window.refreshHomeProgress = function () {
    const data = ensureQuestDay(loadProgress());
    const info = window.getLevelInfo(data.stars);

    const starsEl = document.getElementById('home-stars-count');
    const wordsEl = document.getElementById('home-words-count');
    const streakEl = document.getElementById('home-streak-count');
    if (starsEl) starsEl.textContent = String(data.stars);
    if (wordsEl) wordsEl.textContent = String(Object.keys(data.words).length);
    if (streakEl) streakEl.textContent = String(data.streakDays || 0);

    const levelNum = document.getElementById('home-level-num');
    const levelTitleEl = document.getElementById('home-level-title');
    const levelFill = document.getElementById('home-level-fill');
    const levelLabel = document.getElementById('home-level-label');
    if (levelNum) levelNum.textContent = String(info.level);
    if (levelTitleEl) levelTitleEl.textContent = info.title;
    if (levelFill) levelFill.style.width = info.pct + '%';
    if (levelLabel) levelLabel.textContent = info.into + ' / ' + info.need + ' 升下一級';

    const quest = window.getDailyQuest();
    const questList = document.getElementById('home-quest-list');
    const questMeta = document.getElementById('home-quest-meta');
    if (questMeta) questMeta.textContent = quest.doneCount + ' / ' + quest.total;
    if (questList) {
        questList.innerHTML = '';
        quest.items.forEach(function (item) {
            const li = document.createElement('li');
            li.className = 'home-quest-item' + (item.done ? ' is-done' : '');
            li.innerHTML =
                '<span class="home-quest-emoji" aria-hidden="true">' + item.emoji + '</span>' +
                '<span class="home-quest-label">' + item.label + '</span>' +
                '<span class="home-quest-check" aria-hidden="true">' + (item.done ? '✓' : '') + '</span>';
            questList.appendChild(li);
        });
    }
};

/**
 * Award stars and optionally collect a word into the album.
 * @param {number} stars
 * @param {{word?:string, emoji?:string, letter?:string, reason?:string, quest?:string}} meta
 */
window.awardStars = function (stars, meta) {
    const amount = Math.max(0, Number(stars) || 0);
    const info = meta || {};
    let data = ensureQuestDay(loadProgress());
    const prevLevel = window.getLevelInfo(data.stars).level;
    data = bumpStreak(data);
    data.stars += amount;
    data.todayStars = (data.todayStars || 0) + amount;

    if (data.todayStars >= 3) data.questDone.stars3 = true;

    var isNewWord = false;
    if (info.word) {
        const key = String(info.word).toLowerCase();
        const prev = data.words[key];
        isNewWord = !prev;
        data.words[key] = {
            word: key,
            emoji: info.emoji || (prev && prev.emoji) || '⭐',
            letter: info.letter || (prev && prev.letter) || (key.charAt(0) || '').toUpperCase(),
            count: ((prev && prev.count) || 0) + 1,
            lastAt: Date.now()
        };
        if (isNewWord) data.questDone.newword = true;
    }

    if (info.quest) data.questDone[info.quest] = true;

    saveProgress(data);
    window.refreshHomeProgress();

    const newLevel = window.getLevelInfo(data.stars).level;
    if (amount > 0) {
        window.showStarBurst(amount, info.reason || '叻仔');
    }
    if (newLevel > prevLevel && window.ZiziFX) {
        setTimeout(function () {
            window.ZiziFX.play('levelup');
            window.ZiziFX.celebrate({
                emoji: '🚀',
                title: '升咗級！',
                sub: '而家係第 ' + newLevel + ' 級 · ' + levelTitle(newLevel),
                stars: 0
            });
            if (window.announce) {
                window.announce('哇！升咗去第 ' + newLevel + ' 級！', { force: true });
            }
        }, 700);
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
                if (window.ZiziFX) window.ZiziFX.play('pop');
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

window.addEventListener('load', function () {
    let data = ensureQuestDay(loadProgress());
    data = bumpStreak(data);
    saveProgress(data);
    window.refreshHomeProgress();
});
