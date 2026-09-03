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
        { key: 'listen', label: '玩一局賽車或射擊', emoji: '🎈', done: !!data.questDone.listen },
        { key: 'match', label: '玩一局飛天搵字', emoji: '🦋', done: !!data.questDone.match },
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

function albumEscape(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function albumLetterOf(item) {
    var L = String((item && item.letter) || '').toUpperCase();
    if (/^[A-Z]$/.test(L)) return L;
    if (window.ZiziTeach && window.ZiziTeach.info) {
        L = String(window.ZiziTeach.info(item && item.word).letter || '').toUpperCase();
        if (/^[A-Z]$/.test(L)) return L;
    }
    L = String((item && item.word) || '').charAt(0).toUpperCase();
    return /^[A-Z]$/.test(L) ? L : '?';
}

function albumCaption(item) {
    var info = (window.ZiziTeach && window.ZiziTeach.info)
        ? window.ZiziTeach.info(item && item.word)
        : null;
    if (!info) return '';
    if (info.loan) return info.loan;
    var yue = String(info.yue || '');
    var word = String((item && item.word) || '');
    if (yue && yue.toLowerCase() !== word.toLowerCase()) return yue;
    return '';
}

function albumGroupLetterSet() {
    var groups = window.phonicsGroups || [];
    var letterToGroup = {};
    groups.forEach(function (g, gi) {
        (g.letters || []).forEach(function (L) {
            if (letterToGroup[L] == null) letterToGroup[L] = gi;
        });
    });
    return { groups: groups, letterToGroup: letterToGroup };
}

window.buildAlbumModel = function (wordsMap) {
    var map = wordsMap && typeof wordsMap === 'object' ? wordsMap : {};
    var entries = Object.keys(map).map(function (k) { return map[k] || { word: k }; });
    var pack = albumGroupLetterSet();
    var groups = pack.groups;
    var letterToGroup = pack.letterToGroup;
    var sections = groups.map(function (g, gi) {
        var buckets = {};
        (g.letters || []).forEach(function (L) { buckets[L] = []; });
        return {
            id: 'album-group-' + gi,
            className: 'album-group album-group--' + gi,
            title: g.name || ('第 ' + (gi + 1) + ' 組'),
            short: String(g.name || '').replace(/^第\s*\d+\s*組\s*/, '').replace(/[()]/g, '') || ('第' + (gi + 1) + '組'),
            letters: g.letters || [],
            buckets: buckets,
            count: 0
        };
    });
    var other = {
        id: 'album-group-other',
        className: 'album-group album-group--other',
        title: '其他',
        short: '其他',
        letters: ['?'],
        buckets: { '?': [] },
        count: 0
    };

    entries.forEach(function (item) {
        var L = albumLetterOf(item);
        var gi = letterToGroup[L];
        var section = (gi == null) ? other : sections[gi];
        if (!section.buckets[L]) section.buckets[L] = [];
        section.buckets[L].push(item);
        section.count += 1;
    });

    sections.forEach(function (section) {
        Object.keys(section.buckets).forEach(function (L) {
            section.buckets[L].sort(function (a, b) {
                return String(a.word || '').localeCompare(String(b.word || ''));
            });
        });
    });
    other.buckets['?'].sort(function (a, b) {
        return String(a.word || '').localeCompare(String(b.word || ''));
    });

    var visible = sections.filter(function (s) { return s.count > 0; });
    if (other.count) visible.push(other);
    return { total: entries.length, sections: visible };
};

function albumCardHtml(item) {
    var yue = albumCaption(item);
    var count = Number(item.count) || 1;
    var word = item.word || '';
    return '<button type="button" class="album-card" data-word="' + albumEscape(word) + '">' +
        '<span class="album-emoji" data-art-word="' + albumEscape(word) + '"></span>' +
        '<span class="album-word">' + albumEscape(word) + '</span>' +
        (yue ? '<span class="album-yue">' + albumEscape(yue) + '</span>' : '') +
        (count > 1 ? '<span class="album-count">×' + count + '</span>' : '') +
        '</button>';
}

function albumPartsHtml(parts) {
    if (!parts || !parts.length) return '';
    var html = '<div class="etym-parts">';
    for (var i = 0; i < parts.length; i++) {
        if (i > 0) html += '<span class="etym-plus" aria-hidden="true">+</span>';
        html += '<span class="etym-part">' +
            '<b>' + albumEscape(parts[i].en) + '</b>' +
            '<small>' + albumEscape(parts[i].yue || '') + '</small>' +
            '</span>';
    }
    html += '</div>';
    return html;
}

window.albumDetailHtml = function (word, item) {
    var info = (window.ZiziTeach && window.ZiziTeach.info)
        ? window.ZiziTeach.info(word)
        : null;
    var yue = info ? info.yue : '';
    var loan = info ? (info.loan || info.nick || '') : '';
    var parts = info && info.parts ? info.parts : [];
    var from = info ? info.from : '';
    var story = info ? info.story : '';
    var also = info && info.also ? info.also : null;
    var yueLine = '';
    if (loan && yue && yue !== loan) {
        yueLine = albumEscape(yue);
    } else if (yue && String(yue).toLowerCase() !== String(word || '').toLowerCase()) {
        yueLine = albumEscape(yue);
    }
    var alsoHtml = '';
    if (also && also.word) {
        alsoHtml = '<p class="etym-also-label">又可以叫 ' + albumEscape(also.word) + '</p>' +
            albumPartsHtml(also.parts);
    }
    return '<span class="album-detail-emoji" data-art-word="' + albumEscape(word) + '"></span>' +
        '<p class="album-detail-word" id="album-detail-word">' + albumEscape(word) + '</p>' +
        (yueLine ? '<p class="album-detail-yue">' + yueLine + '</p>' : '') +
        (loan ? '<p class="etym-nick">香港叫 <b>' + albumEscape(loan) + '</b></p>' : '') +
        albumPartsHtml(parts) +
        alsoHtml +
        (from ? '<p class="etym-from">' + albumEscape(from) + '</p>' : '') +
        (story ? '<p class="album-detail-story">' + albumEscape(story) + '</p>' : '');
};

function albumLiveEmoji(word, fallback) {
    var key = String(word || '').toLowerCase();
    var list = window.D || [];
    for (var i = 0; i < list.length; i++) {
        if (String(list[i].w || '').toLowerCase() === key) return list[i].emoji || fallback;
    }
    return fallback || '⭐';
}

function albumPaintArt(root) {
    if (!root) return;
    Array.prototype.forEach.call(root.querySelectorAll('[data-art-word]'), function (el) {
        var word = el.getAttribute('data-art-word');
        if (!word) return;
        el.innerHTML = '';
        if (window.ZiziArt && window.ZiziArt.pictureEl) {
            var size = el.classList.contains('album-detail-emoji') ? 92 : 56;
            el.appendChild(window.ZiziArt.pictureEl(word, size));
            return;
        }
        el.textContent = albumLiveEmoji(word, '⭐');
    });
}

function albumSpeakWord(word) {
    var p = window.speakEnglish ? window.speakEnglish(word) : Promise.resolve();
    Promise.resolve(p).then(function () {
        if (window.ZiziTeach && window.ZiziTeach.speakStory) return window.ZiziTeach.speakStory(word);
        if (window.playCantoneseTTS) return window.playCantoneseTTS('呢個係 ' + word);
    }).catch(function (err) {
        if (err && err.name === 'AbortError') return;
    });
}

window.openAlbumDetail = function (word, item) {
    var panel = document.getElementById('album-detail');
    var body = document.getElementById('album-detail-body');
    if (!panel || !body || !word) return;
    body.innerHTML = window.albumDetailHtml(word, item);
    albumPaintArt(body);
    panel.hidden = false;
    panel.classList.add('is-open');
};

window.closeAlbumDetail = function () {
    var panel = document.getElementById('album-detail');
    if (!panel) return;
    panel.hidden = true;
    panel.classList.remove('is-open');
    var body = document.getElementById('album-detail-body');
    if (body) body.innerHTML = '';
};

window.openWordAlbum = function () {
    const data = loadProgress();
    const modal = document.getElementById('album-overlay');
    const scroll = document.getElementById('album-scroll');
    const empty = document.getElementById('album-empty');
    const jumps = document.getElementById('album-jumps');
    const hint = document.getElementById('album-hint');
    if (!modal || !scroll) return;

    const model = window.buildAlbumModel(data.words);
    scroll.innerHTML = '';
    if (jumps) {
        jumps.innerHTML = '';
        jumps.hidden = true;
    }

    if (model.total === 0) {
        if (empty) empty.style.display = 'block';
        if (hint) hint.textContent = '撳張卡睇點解咁寫，同聽英文。';
    } else {
        if (empty) empty.style.display = 'none';
        if (hint) hint.textContent = '已經識咗 ' + model.total + ' 個字 · 撳卡睇拆字';

        var groupBtns = '';
        var letterBtns = '';
        var html = '';

        model.sections.forEach(function (section) {
            groupBtns += '<button type="button" class="album-jump is-group" data-jump="' +
                section.id + '">' + albumEscape(section.short) + '</button>';
            html += '<section class="' + section.className + '" id="' + section.id + '">';
            html += '<h3 class="album-group-title">' + albumEscape(section.title) +
                ' · ' + section.count + ' 個</h3>';

            var letterOrder = section.letters.slice();
            Object.keys(section.buckets).forEach(function (L) {
                if (letterOrder.indexOf(L) === -1) letterOrder.push(L);
            });
            letterOrder.forEach(function (L) {
                var list = section.buckets[L] || [];
                if (!list.length) return;
                var lid = 'album-letter-' + L;
                letterBtns += '<button type="button" class="album-jump" data-jump="' + lid + '">' +
                    albumEscape(L) + '</button>';
                html += '<div class="album-letter-block" id="' + lid + '">';
                html += '<div class="album-letter-head">' + albumEscape(L) + '</div>';
                html += '<div class="album-grid">';
                list.forEach(function (item) { html += albumCardHtml(item); });
                html += '</div></div>';
            });
            html += '</section>';
        });

        if (jumps) {
            jumps.innerHTML =
                (groupBtns ? '<div class="album-jump-row">' + groupBtns + '</div>' : '') +
                (letterBtns ? '<div class="album-jump-row">' + letterBtns + '</div>' : '');
            jumps.hidden = false;
            jumps.onclick = function (e) {
                var t = e.target.closest('[data-jump]');
                if (!t) return;
                var el = document.getElementById(t.getAttribute('data-jump'));
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            };
        }

        scroll.innerHTML = html;
        albumPaintArt(scroll);
        scroll.scrollTop = 0;
        scroll.onclick = function (e) {
            var btn = e.target.closest('.album-card');
            if (!btn) return;
            var word = btn.getAttribute('data-word');
            if (!word) return;
            if (window.ZiziFX) window.ZiziFX.play('pop');
            window.openAlbumDetail(word, { word: word });
            albumSpeakWord(word);
        };
    }

    modal.style.display = 'flex';
    modal.classList.add('is-open');
};

window.closeWordAlbum = function () {
    if (window.closeAlbumDetail) window.closeAlbumDetail();
    const modal = document.getElementById('album-overlay');
    if (!modal) return;
    modal.style.display = 'none';
    modal.classList.remove('is-open');
    var scroll = document.getElementById('album-scroll');
    if (scroll) scroll.scrollTop = 0;
};

(function bindAlbumDetail() {
    if (typeof document === 'undefined' || !document.addEventListener) return;
    document.addEventListener('click', function (e) {
        var panel = document.getElementById('album-detail');
        if (!panel || panel.hidden || !panel.classList.contains('is-open')) return;
        if (e.target === panel) window.closeAlbumDetail();
    });
})();

window.addEventListener('load', function () {
    let data = ensureQuestDay(loadProgress());
    data = bumpStreak(data);
    saveProgress(data);
    window.refreshHomeProgress();
});
