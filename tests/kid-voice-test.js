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

var stories = fs.readFileSync(path.join(__dirname, '../js/stories.js'), 'utf8');
var speech = fs.readFileSync(path.join(__dirname, '../js/speech.js'), 'utf8');
var router = fs.readFileSync(path.join(__dirname, '../js/router.js'), 'utf8');
var buddy = fs.readFileSync(path.join(__dirname, '../js/buddy.js'), 'utf8');
var page = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
var teach = fs.readFileSync(path.join(__dirname, '../js/teach.js'), 'utf8');

eq('stories stay spoken: no 請', stories.indexOf('請') === -1, true);
eq('stories stay spoken: no 進行', stories.indexOf('進行') === -1, true);
eq('stories stay spoken: no 他們', stories.indexOf('他們') === -1, true);
eq('stories stay spoken: no 她', /她/.test(stories) === false, true);
eq('stories stay spoken: no 多少', stories.indexOf('多少') === -1, true);
eq('stories use 即係 not 意思係', stories.indexOf('意思係') === -1, true);
eq('home announce is spoken 嚟到', speech.indexOf('嚟到孜孜學英文天空島喇') !== -1, true);
eq('home announce drops 歡迎', speech.indexOf('歡迎嚟到') === -1, true);
eq('English voice is kid-spoken', router.indexOf('Hi Zizi! This is English. Can you hear me?') !== -1, true);
eq('English voice drops textbook Hello', router.indexOf('This is the English voice.') === -1, true);
eq('buddy win is spoken 幫你', buddy.indexOf('小伙伴幫你歡呼') !== -1, true);
eq('home uses 返去玩', page.indexOf('返去玩') !== -1, true);
eq('home drops 返主選單', page.indexOf('返主選單') === -1, true);
eq('coach speak drops 答案係', teach.indexOf('答案係') === -1, true);
eq('coach speak uses 係呢個', teach.indexOf('係呢個，') !== -1, true);

if (fails) process.exit(1);
console.log('all kid-voice tests passed');
