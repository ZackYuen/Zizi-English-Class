// ==========================================
// Visual hints + word-story coach (age ~5)
// Ladder: 1 wrong → meaning, 2 → story, 3 / 提示 → glow answer
// ==========================================

window.ZiziTeach = (function () {
    var misses = 0;
    var writeFails = 0;

    function escapeHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function info(word) {
        word = String(word || '').trim().toLowerCase();
        var stories = window.WORD_STORIES || {};
        var s = stories[word] || {};
        var d = null;
        var list = window.D;
        if (list && list.length) {
            for (var i = 0; i < list.length; i++) {
                if (list[i] && list[i].w === word) { d = list[i]; break; }
            }
        }
        var yue = s.yue || (d && d.yue) || word;
        var loans = window.WORD_LOANS || window.WORD_NICKS || {};
        var loan = s.loan || loans[word] || '';
        var nick = loan || '';
        var letter = (d && d.l) || (word.charAt(0) || '').toUpperCase();
        var parts = s.parts || (d && d.parts) || [{ en: word, yue: yue }];
        var partsLine = parts.map(function (p) {
            return p.en + ' ' + (p.yue || '');
        }).join(' 加 ');
        var speakParts = parts.map(function (p) {
            return p.en + ' 係' + (p.yue || '');
        }).join('，');
        if (parts.length > 1) speakParts += '。合埋就係 ' + word;
        var speakNick = nick ? ('廣東話借咗英文，叫' + nick) : '';
        return {
            w: word,
            emoji: (d && d.emoji) || '⭐',
            letter: letter,
            yue: yue,
            loan: loan,
            nick: nick,
            speakNick: speakNick,
            story: s.story || (d && d.story) || ('呢個英文字叫 ' + word + '。'),
            parts: parts,
            from: s.from || (d && d.from) || '',
            also: s.also || null,
            partsLine: partsLine,
            speakParts: speakParts,
            letterHint: (window.LETTER_HINTS && window.LETTER_HINTS[letter]) || ('跟住綠點畫 ' + letter + '。')
        };
    }

    function reset() {
        misses = 0;
        return misses;
    }

    function resetWrite() {
        writeFails = 0;
        return writeFails;
    }

    function bump() {
        misses += 1;
        return misses;
    }

    function bumpWrite() {
        writeFails += 1;
        return writeFails;
    }

    function level() { return misses; }
    function writeLevel() { return writeFails; }

    function speak(text) {
        if (!text) return Promise.resolve();
        if (window.playCantoneseTTS) {
            return window.playCantoneseTTS(text, { interrupt: true });
        }
        if (window.speakCantoneseBrowser) {
            return window.speakCantoneseBrowser(text);
        }
        return Promise.resolve();
    }

    function partsHtml(parts) {
        if (!parts || !parts.length) return '';
        var html = '<div class="etym-parts">';
        for (var i = 0; i < parts.length; i++) {
            if (i > 0) html += '<span class="etym-plus" aria-hidden="true">+</span>';
            html += '<span class="etym-part">' +
                '<b>' + escapeHtml(parts[i].en) + '</b>' +
                '<small>' + escapeHtml(parts[i].yue || '') + '</small>' +
                '</span>';
        }
        html += '</div>';
        return html;
    }

    function alsoHtml(also) {
        if (!also || !also.parts || !also.parts.length) return '';
        return '<p class="etym-also-label">又可以叫 ' + escapeHtml(also.word) + '</p>' + partsHtml(also.parts);
    }

    function renderCoach(el, payload) {
        if (!el) return;
        payload = payload || {};
        var emoji = payload.emoji || '💡';
        var title = payload.title || '';
        var body = payload.body || '';
        var from = payload.from || '';
        var nick = payload.nick || '';
        var parts = payload.parts || [];
        var also = payload.also || null;
        if (!title && !body && !parts.length) {
            el.classList.add('is-empty');
            el.innerHTML = '';
            el.setAttribute('hidden', 'hidden');
            return;
        }
        el.classList.remove('is-empty');
        el.removeAttribute('hidden');
        el.innerHTML =
            '<div class="zizi-coach-emoji" aria-hidden="true">' + escapeHtml(emoji) + '</div>' +
            '<div class="zizi-coach-body">' +
                (title ? '<p class="zizi-coach-title">' + escapeHtml(title) + '</p>' : '') +
                (nick ? '<p class="etym-nick">香港叫 <b>' + escapeHtml(nick) + '</b></p>' : '') +
                partsHtml(parts) +
                alsoHtml(also) +
                (body ? '<p class="zizi-coach-story">' + escapeHtml(body) + '</p>' : '') +
            '</div>';
    }

    function hideCoach(el) {
        renderCoach(el, {});
    }

    function clearGlow(root) {
        var scope = root || document;
        var nodes = scope.querySelectorAll('.is-hint');
        for (var i = 0; i < nodes.length; i++) nodes[i].classList.remove('is-hint');
    }

    function glowById(id) {
        var el = document.getElementById(id);
        if (el) el.classList.add('is-hint');
    }

    function fillWriteChip() {
        var chip = document.getElementById('write-word-chip');
        if (!chip || typeof D === 'undefined' || typeof idx === 'undefined' || !D[idx]) {
            if (chip) chip.classList.add('is-empty');
            hideCoach(document.getElementById('write-coach'));
            return;
        }
        var w = info(D[idx].w);
        chip.classList.remove('is-empty');
        var yueLine = w.loan
            ? ('香港叫 ' + w.loan + (w.loan !== w.yue ? '（' + w.yue + '）' : ''))
            : (w.yue || '');
        chip.innerHTML =
            '<span class="write-chip-emoji" aria-hidden="true">' + escapeHtml(w.emoji) + '</span>' +
            '<span class="write-chip-text">' +
                '<span class="write-chip-en">' + escapeHtml(w.w) + '</span>' +
                '<span class="write-chip-yue">' + escapeHtml(yueLine) + '</span>' +
            '</span>';
        hideCoach(document.getElementById('write-coach'));
    }

    function withNickSpeak(w, rest) {
        return (w.speakNick ? w.speakNick + '。' : '') + rest;
    }

    function matchHintPayload(word, n) {
        var w = info(word);
        if (n <= 0) return null;
        var meaning = w.loan || w.yue;
        if (n === 1) {
            return {
                emoji: w.emoji,
                title: w.w,
                body: '聽多次英文，揀「' + meaning + '」嗰幅圖。',
                nick: w.loan,
                parts: w.parts && w.parts.length > 1 ? w.parts : [],
                from: w.from,
                speak: withNickSpeak(w, '聽多次，揀啱嘅圖。')
            };
        }
        if (n === 2) {
            return {
                emoji: w.emoji,
                title: w.w,
                body: w.story,
                nick: w.loan,
                parts: w.parts,
                from: w.from,
                also: w.also,
                speak: withNickSpeak(w, w.speakParts + '。' + w.story)
            };
        }
        return {
            emoji: w.emoji,
            title: '係呢個！' + w.w,
            body: w.story + ' 揀發光嗰幅圖啦。',
            nick: w.loan,
            parts: w.parts,
            from: w.from,
            also: w.also,
            speak: '答案係' + meaning + '。' + w.speakParts + '。揀發光嗰幅圖。'
        };
    }

    function listenHintPayload(letter, word, n) {
        var w = info(word);
        var sounds = { A: '呀', E: '欸', I: '衣' };
        var cue = sounds[letter] || letter;
        if (n <= 0) return null;
        if (n === 1) {
            return {
                emoji: '👂',
                title: '聽開頭個音',
                body: letter + ' 好似「' + cue + '」。',
                speak: '聽開頭。' + letter + '好似' + cue + '。'
            };
        }
        if (n === 2) {
            return {
                emoji: w.emoji,
                title: '呢個字係 ' + w.w,
                body: '開頭音係 ' + letter + '。',
                nick: w.loan,
                parts: w.parts,
                from: w.from,
                speak: '呢個字係' + w.w + '。' + withNickSpeak(w, w.speakParts + '。開頭係' + letter + '。')
            };
        }
        return {
            emoji: w.emoji,
            title: '揀發光個掣！',
            body: w.w + ' 開頭係 ' + letter + '。',
            nick: w.loan,
            parts: w.parts,
            from: w.from,
            speak: '揀發光嗰個。' + withNickSpeak(w, '開頭係' + letter + '。')
        };
    }

    function applyMatchHint(n, opts) {
        opts = opts || {};
        var target = window.matchTarget;
        var coach = document.getElementById('match-coach');
        var box = document.getElementById('match-choices');
        clearGlow(box);
        if (!target) {
            hideCoach(coach);
            return Promise.resolve();
        }
        var payload = matchHintPayload(target.w, n);
        if (!payload) {
            hideCoach(coach);
            return Promise.resolve();
        }
        renderCoach(coach, payload);
        if (n >= 3 && box) {
            var buttons = box.querySelectorAll('.match-choice-btn');
            for (var i = 0; i < buttons.length; i++) {
                if (buttons[i].getAttribute('aria-label') === target.w) {
                    buttons[i].classList.add('is-hint');
                }
            }
        }
        if (opts.speak !== false) return speak(payload.speak);
        return Promise.resolve();
    }

    function applyListenHint(n, opts) {
        opts = opts || {};
        var coach = document.getElementById('game-coach');
        var letter = window.currentGameTarget;
        var word = window.currentWord;
        ['btn-A', 'btn-E', 'btn-I'].forEach(function (id) {
            var b = document.getElementById(id);
            if (b) b.classList.remove('is-hint');
        });
        var display = document.getElementById('game-emoji-display');
        if (n >= 2 && display && window.currentEmoji) {
            display.innerText = window.currentEmoji;
        } else if (n < 2 && display && display.innerText !== '🔊' && !opts.keepEmoji) {
            // keep ❓ during question; nextGameQuestion sets it
        }
        if (!letter || !word) {
            hideCoach(coach);
            return Promise.resolve();
        }
        var payload = listenHintPayload(letter, word, n);
        if (!payload) {
            hideCoach(coach);
            return Promise.resolve();
        }
        renderCoach(coach, payload);
        if (n >= 2 && display) display.innerText = window.currentEmoji || '❓';
        if (n >= 3) glowById('btn-' + letter);
        if (opts.speak !== false) return speak(payload.speak);
        return Promise.resolve();
    }

    function applyWriteHint(opts) {
        opts = opts || {};
        fillWriteChip();
        var n = writeFails;
        if (typeof D === 'undefined' || typeof idx === 'undefined' || !D[idx]) return Promise.resolve();
        var w = info(D[idx].w);
        var letter = D[idx].l;
        var strokeNum = (typeof strokeIdx === 'number' ? strokeIdx : 0) + 1;
        var title;
        var body;
        var say;
        if (n <= 0 && !opts.force) {
            return Promise.resolve();
        }
        if (n <= 1) {
            title = w.w;
            body = (w.loan ? ('香港叫' + w.loan + '。') : (w.yue + '。')) + '跟住綠點，由頭畫到尾。第 ' + strokeNum + ' 筆。';
            say = withNickSpeak(w, '跟住綠點由頭畫到尾。');
        } else if (n === 2) {
            title = '點畫 ' + letter + '？';
            body = w.letterHint;
            say = w.letterHint;
        } else {
            title = w.w;
            body = w.story + ' ' + w.letterHint;
            say = withNickSpeak(w, w.story + w.letterHint);
        }
        var msg = document.getElementById('msg');
        if (msg && opts.updateMsg !== false) {
            if (window.setSilentMsg) window.setSilentMsg(body, '#1982c4');
            else {
                msg.setAttribute('data-silent', '1');
                msg.setAttribute('aria-hidden', 'true');
                msg.innerText = body;
                msg.style.color = '#1982c4';
            }
        }
        if (opts.speak !== false) return speak(say);
        return Promise.resolve();
    }

    function speakFull(w) {
        var story = w.story || '';
        var head = w.speakNick ? w.speakNick + '。' : '';
        return speak(head + w.speakParts + '。' + story);
    }

    function tellCurrentWordStory() {
        if (typeof D === 'undefined' || typeof idx === 'undefined' || !D[idx]) return;
        var w = info(D[idx].w);
        fillWriteChip();
        var msg = document.getElementById('msg');
        var line = (w.loan ? ('香港叫' + w.loan + '。') : '') + (w.partsLine ? w.partsLine + '。' : '') + w.story;
        if (msg) {
            if (window.setSilentMsg) {
                window.setSilentMsg(line, '#023e8a');
            } else {
                msg.setAttribute('data-silent', '1');
                msg.setAttribute('aria-hidden', 'true');
                msg.innerText = line;
                msg.style.color = '#023e8a';
            }
        }
        speakFull(w).then(function () {
            if (window.speakEnglish) return window.speakEnglish(w.w, { rate: 0.88 });
        });
    }

    function storyCard(word, extra) {
        var w = info(word);
        extra = extra || {};
        return {
            emoji: extra.emoji || w.emoji,
            title: extra.title || w.w,
            body: extra.body != null ? extra.body : w.story,
            nick: w.nick,
            parts: extra.parts || [],
            from: '',
            also: extra.also || null
        };
    }

    /** Show word-parts + why. 香港叫 only for real English→Cantonese loans. */
    function showWordStory(word, coachId, opts) {
        opts = opts || {};
        var el = typeof coachId === 'string' ? document.getElementById(coachId) : coachId;
        if (!el) {
            return opts.speak === false ? Promise.resolve() : speakStory(word);
        }
        renderCoach(el, storyCard(word, opts));
        if (opts.speak === false) return Promise.resolve();
        return speakFull(info(word));
    }

    function fillWriteCoach() {
        var el = document.getElementById('write-coach');
        if (!el) return;
        if (typeof D === 'undefined' || typeof idx === 'undefined' || !D[idx]) {
            hideCoach(el);
            return;
        }
        hideCoach(el);
    }

    function speakStory(word) {
        return speakFull(info(word));
    }

    return {
        info: info,
        reset: reset,
        resetWrite: resetWrite,
        bump: bump,
        bumpWrite: bumpWrite,
        level: level,
        writeLevel: writeLevel,
        speak: speak,
        renderCoach: renderCoach,
        hideCoach: hideCoach,
        clearGlow: clearGlow,
        fillWriteChip: fillWriteChip,
        fillWriteCoach: fillWriteCoach,
        showWordStory: showWordStory,
        applyMatchHint: applyMatchHint,
        applyListenHint: applyListenHint,
        applyWriteHint: applyWriteHint,
        tellCurrentWordStory: tellCurrentWordStory,
        speakStory: speakStory
    };
})();

window.requestMatchHint = function () {
    if (!window.isMatchPlaying || window.isMatchProcessing) return;
    var n = Math.max(window.ZiziTeach.level() + 1, 1);
    while (window.ZiziTeach.level() < n) window.ZiziTeach.bump();
    window.ZiziTeach.applyMatchHint(window.ZiziTeach.level());
};

window.requestGameHint = function () {
    if (!window.isGamePlaying || window.isGameProcessing) return;
    var n = Math.max(window.ZiziTeach.level() + 1, 1);
    while (window.ZiziTeach.level() < n) window.ZiziTeach.bump();
    window.ZiziTeach.applyListenHint(window.ZiziTeach.level());
};

window.requestWriteHint = function () {
    window.ZiziTeach.bumpWrite();
    window.ZiziTeach.applyWriteHint({ force: true });
};
