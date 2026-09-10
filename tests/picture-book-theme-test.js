var fs = require('fs');
var path = require('path');

var fails = 0;
function eq(name, got, want) {
    if (got !== want) {
        fails += 1;
        console.error('FAIL', name, 'got', got, 'want', want);
    } else {
        console.log('ok', name);
    }
}

var theme = fs.readFileSync(path.join(__dirname, '../picture-book-theme.css'), 'utf8');
var page = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
var css = fs.readFileSync(path.join(__dirname, '../style.css'), 'utf8');
var art = fs.readFileSync(path.join(__dirname, '../js/art.js'), 'utf8');

eq('theme file names the picture-book art direction', theme.indexOf('Japanese picture-book') !== -1, true);
eq('theme uses warm paper', theme.indexOf('--paper: #fbf4e5') !== -1, true);
eq('theme uses watercolor coral', theme.indexOf('--coral: #d97860') !== -1, true);
eq('theme uses watercolor sky', theme.indexOf('--sky: #a9d5df') !== -1, true);
eq('page links the theme after style.css', /style\.css[^"]+"[\s\S]*picture-book-theme\.css/.test(page), true);
eq('page cache-busts the theme', page.indexOf('picture-book-theme.css?v=20260910-ehon') !== -1, true);
eq('root tokens match the picture-book paper', css.indexOf('--paper: #fbf4e5') !== -1, true);
eq('home is not the old neon sky', theme.indexOf('#6ec9ff') === -1, true);
eq('word art palette is muted coral', art.indexOf('#d97860') !== -1, true);
eq('word art palette dropped neon orange', art.indexOf('#ff8c42') === -1, true);
eq('word art ink is picture-book ink', art.indexOf('#243e4a') !== -1, true);
var wf = fs.readFileSync(path.join(__dirname, '../.github/workflows/deploy-pages.yml'), 'utf8');
eq('Pages deploy copies the theme stylesheet', wf.indexOf('picture-book-theme.css') !== -1, true);

if (fails) process.exit(1);
console.log('all picture-book theme tests passed');
