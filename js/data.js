const phonicsGroups = [
    { name: '第 1 組 (SATIPN)', letters: ['S','A','T','I','P','N'] },
    { name: '第 2 組 (CKEHRMD)', letters: ['C','K','E','H','R','M','D'] },
    { name: '第 3 組 (GOULFB)', letters: ['G','O','U','L','F','B'] },
    { name: '第 4 組 (JVWXYZQ)', letters: ['J','V','W','X','Y','Z','Q'] }
];

const letterStrokes = {
    // A: left slant, right slant, crossbar
    'A': [[150,40,90,220],[150,40,210,220],[110,145,190,145]],
    // B: stem → top bowl → bottom bowl (bowl1 end = bowl2 start)
    'B': [[100,40,100,220],[100,40,168,40,192,78,168,112,100,112],[100,112,172,112,198,158,172,220,100,220]],
    // C: one open curve
    'C': [[205,80,175,42,125,38,82,88,78,150,88,205,130,230,180,222,208,185]],
    // D: stem → big curve (curve starts at stem top)
    'D': [[100,40,100,220],[100,40,168,40,208,90,208,170,168,220,100,220]],
    // E: stem → top → mid → bottom
    'E': [[100,40,100,220],[100,40,195,40],[100,130,175,130],[100,220,195,220]],
    // F: stem → top → mid
    'F': [[100,40,100,220],[100,40,195,40],[100,130,170,130]],
    // G: C-curve → inward bar (bar starts at curve end)
    'G': [[205,80,175,42,125,38,82,88,78,150,88,205,130,230,180,222,205,185,205,150],[205,150,145,150]],
    // H: left stem → right stem → crossbar
    'H': [[100,40,100,220],[200,40,200,220],[100,130,200,130]],
    // I: top bar → vertical (from bar center) → bottom bar
    'I': [[100,40,200,40],[150,40,150,220],[100,220,200,220]],
    // J: top bar → hook from bar center
    'J': [[110,40,230,40],[170,40,170,175,150,220,115,220,95,190]],
    // K: stem → upper arm → lower arm (arms meet on stem)
    'K': [[100,40,100,220],[190,40,100,130],[100,130,190,220]],
    // L: down then right (one stroke)
    'L': [[110,40,110,220,205,220]],
    // M: left down → to middle → to top-right → right down (2→3→4 connected)
    'M': [[80,40,80,220],[80,40,150,145],[150,145,220,40],[220,40,220,220]],
    // N: left down → diagonal → right up (diagonal end = right stem start)
    'N': [[85,40,85,220],[85,40,215,220],[215,220,215,40]],
    // O: closed oval
    'O': [[150,38,95,70,78,130,90,195,150,232,210,195,222,130,205,70,150,38]],
    // P: stem → bowl
    'P': [[100,40,100,220],[100,40,168,40,198,80,168,125,100,125]],
    // Q: oval → tail (tail from lower-right of oval)
    'Q': [[150,38,95,70,78,130,90,195,150,232,210,195,222,130,205,70,150,38],[175,185,230,235]],
    // R: stem → bowl → leg (bowl end ≈ leg start on stem)
    'R': [[100,40,100,220],[100,40,168,40,198,80,168,125,100,125],[100,125,195,220]],
    // S: one continuous curve
    'S': [[200,75,160,40,110,45,90,85,120,120,180,145,205,180,180,220,125,225,95,195]],
    // T: top bar → stem from center
    'T': [[75,40,225,40],[150,40,150,220]],
    // U: one cup
    'U': [[95,40,95,165,115,210,150,228,185,210,205,165,205,40]],
    // V: one stroke
    'V': [[80,40,150,220,220,40]],
    // W: one stroke
    'W': [[70,40,110,220,150,110,190,220,230,40]],
    // X: two diagonals
    'X': [[85,40,215,220],[215,40,85,220]],
    // Y: left → right into crotch → stem down (2→3 connected at crotch)
    'Y': [[80,40,150,125],[220,40,150,125],[150,125,150,220]],
    // Z: top → diagonal → bottom (one continuous stroke)
    'Z': [[80,40,220,40,80,220,220,220]]
};


// 精選具象字彙 + 合體字（air+plane 呢類）
const rawD = [
    ['A','ant','🐜',[['æ','a'],['n','n'],['t','t']],'https://encrypted-tbn0.gstatic.com/licensed-image?q=tbn:ANd9GcRTqZsTppo-y06ojxPqRMtZYTLTxYptA0k0o_RxZxEhuc-JYo0uOqHo5AQsKGl06czjVwr3m-l55-MrtQ8'],
    ['A','axe','🪓',[['æ','a'],['k s','xe']]],
    ['A','arm','💪',[['ɑː','ar'],['m','m']]],
    ['A','art','🎨',[['ɑː','ar'],['t','t']]],
    ['A','airplane','✈️',[['eə','air'],['pleɪn','plane']]],
    ['B','bug','🐛',[['b','b'],['ʌ','u'],['g','g']],'https://encrypted-tbn0.gstatic.com/licensed-image?q=tbn:ANd9GcQhUl7djA2u2Toee8Y9oZNTf2rog3BP0zIJMeV8t1q_TI8HQDWp0ha_UKpKS9DvkZWkUEWM_0JwfAZF6SA'],
    ['B','bat','🦇',[['b','b'],['æ','a'],['t','t']]],
    ['B','bed','🛏️',[['b','b'],['ɛ','e'],['d','d']]],
    ['B','bus','🚌',[['b','b'],['ʌ','u'],['s','s']]],
    ['B','bicycle','🚲',[['baɪ','bi'],['saɪkəl','cycle']]],
    ['C','cat','🐱',[['k','c'],['æ','a'],['t','t']],'https://encrypted-tbn2.gstatic.com/licensed-image?q=tbn:ANd9GcTY5Ow415BCLiENvY-XltdMQwjw-ZEHqV12EXDOIk22qkrOwpaaClbWXnGSWrQKfeizSqc7xJkpCLSXdB8'],
    ['C','cup','🥤',[['k','c'],['ʌ','u'],['p','p']]],
    ['C','car','🚗',[['k','c'],['ɑː','ar']]],
    ['C','cap','🧢',[['k','c'],['æ','a'],['p','p']]],
    ['C','cupcake','🧁',[['kʌp','cup'],['keɪk','cake']]],
    ['D','dog','🐶',[['d','d'],['ɒ','o'],['g','g']],'https://encrypted-tbn1.gstatic.com/licensed-image?q=tbn:ANd9GcQxNXQhyLhFHqkHzUr19pCRHNWVY05Fh373O0jxRxMjgWj_dfvVLVmLnUJLISk6AdTj1BmhVbHSHA0J5UQ'],
    ['D','dad','🧔',[['d','d'],['æ','a'],['d','d']]],
    ['D','dot','⚫',[['d','d'],['ɒ','o'],['t','t']]],
    ['D','duck','🦆',[['d','d'],['ʌ','u'],['k','ck']]],
    ['E','egg','🥚',[['ɛ','e'],['g','gg']],'https://encrypted-tbn1.gstatic.com/licensed-image?q=tbn:ANd9GcQCE-9NVZEDxG3ekJDIPeyfYLCBWuatFqJyB6IO3nYGgIp9Q3DcTuI7vGeq0SNEka7c3pjrIbkHdmcXE0A'],
    ['E','elf','🧝',[['ɛ','e'],['l','l'],['f','f']]],
    ['E','elk','🦌',[['ɛ','e'],['l','l'],['k','k']]],
    ['E','eat','🍽️',[['iː','ea'],['t','t']]],
    ['F','fox','🦊',[['f','f'],['ɒ','o'],['k s','x']],'https://encrypted-tbn1.gstatic.com/licensed-image?q=tbn:ANd9GcR5UwT41ltm42FcjXeocyAyPdTt1AmUUd2yXos8fYkCU2FWDOt3GHX0zZA1OkTzeYicm3NW2H7Zme7PzS4'],
    ['F','fan','🪭',[['f','f'],['æ','a'],['n','n']]],
    ['F','fin','🐟',[['f','f'],['ɪ','i'],['n','n']]],
    ['F','fog','🌫️',[['f','f'],['ɒ','o'],['g','g']]],
    ['F','football','⚽',[['fʊt','foot'],['bɔːl','ball']]],
    ['G','gum','🫧',[['g','g'],['ʌ','u'],['m','m']],'https://encrypted-tbn3.gstatic.com/licensed-image?q=tbn:ANd9GcSttm5fKjDTpwXf6ZPUelc9pt2UzOjgySXzuYRvqYi13HT8M5zpBK_AtpHHGV_AnshxUO5v3TkYvwDTtYc'],
    ['G','gas','⛽',[['g','g'],['æ','a'],['s','s']]],
    ['G','gift','🎁',[['g','g'],['ɪ','i'],['f','f'],['t','t']]],
    ['G','goat','🐐',[['g','g'],['oʊ','oa'],['t','t']]],
    ['H','hat','🎩',[['h','h'],['æ','a'],['t','t']],'https://encrypted-tbn0.gstatic.com/licensed-image?q=tbn:ANd9GcRA9ZgNqzvABD4as-ZwcdLsr6d86yWaIQmFbkm1_Rq8vry8rR0yDtxxC5sj0FboMzsJDxm8hFFd-b3BPJw'],
    ['H','hen','🐔',[['h','h'],['ɛ','e'],['n','n']]],
    ['H','hit','🥊',[['h','h'],['ɪ','i'],['t','t']]],
    ['H','hop','🦘',[['h','h'],['ɒ','o'],['p','p']]],
    ['I','ink','✒️',[['ɪ','i'],['ŋ k','nk']],'https://encrypted-tbn0.gstatic.com/licensed-image?q=tbn:ANd9GcTEXL-Ev2FmxrLxkIaoOu0fmjtQLhnbSzQFh1gLLChUBoy8VfoLi7YuYUNeOMqT7qPqT7Hvqd4fICCSMbA'],
    ['I','ice','🧊',[['aɪ','i'],['s','ce']]],
    ['I','ill','🤒',[['ɪ','i'],['l','ll']]],
    ['I','insect','🐞',[['ɪn','in'],['sɛkt','sect']]],
    ['J','jam','🫙',[['dʒ','j'],['æ','a'],['m','m']],'https://encrypted-tbn2.gstatic.com/licensed-image?q=tbn:ANd9GcTDM_lMgpzKbhrj_NAn55jRkq70QgcdVMGth6vRoZDI5iv1H9q5lbkWgQ-55pheVXS_MK0TKDWvRqntR9Y'],
    ['J','jet','✈️',[['dʒ','j'],['ɛ','e'],['t','t']]],
    ['J','jog','🚶',[['dʒ','j'],['ɒ','o'],['g','g']]],
    ['J','jug','🫙',[['dʒ','j'],['ʌ','u'],['g','g']]],
    ['K','kid','👦',[['k','k'],['ɪ','i'],['d','d']],'https://encrypted-tbn3.gstatic.com/licensed-image?q=tbn:ANd9GcQAfPmFNM3kpCpySAIbjUnuW6y1Tp7Owahxz1SlMh745qhcgbtjAtbJKV7tQ3BlQBnBXxkDR16IbVp7Uno'],
    ['K','kit','🧰',[['k','k'],['ɪ','i'],['t','t']]],
    ['K','keg','🛢️',[['k','k'],['ɛ','e'],['g','g']]],
    ['K','king','🤴',[['k','k'],['ɪ','i'],['ŋ','ng']]],
    ['L','log','🪵',[['l','l'],['ɒ','o'],['g','g']],'https://encrypted-tbn1.gstatic.com/licensed-image?q=tbn:ANd9GcT_0QFKA_34cABAQUsqNFJWLxM6TAid_QI7F8X6BZqIpmvIv6-OW0YkJFbr-a9rh7CPR4v6BQpSMWUtPqA'],
    ['L','leg','🦵',[['l','l'],['ɛ','e'],['g','g']]],
    ['L','lip','👄',[['l','l'],['ɪ','i'],['p','p']]],
    ['L','lamp','💡',[['l','l'],['æ','a'],['m','m'],['p','p']]],
    ['M','map','🗺️',[['m','m'],['æ','a'],['p','p']],'https://encrypted-tbn2.gstatic.com/licensed-image?q=tbn:ANd9GcRNi0R0rSCZlU0LlXWFvIeZtCXvg1JGIOe_El_kQrfkfuzPamx-WUeOrza7_6pSMqs6Zzr-qZSPAKDRm5Q'],
    ['M','man','👨',[['m','m'],['æ','a'],['n','n']]],
    ['M','mat','🧘',[['m','m'],['æ','a'],['t','t']]],
    ['M','mug','☕',[['m','m'],['ʌ','u'],['g','g']]],
    ['N','net','🥅',[['n','n'],['ɛ','e'],['t','t']],'https://encrypted-tbn3.gstatic.com/licensed-image?q=tbn:ANd9GcQEwVNmghxotUlk7i1K-tn6PKsPDstqTyfEvNtikmeGuy6OzKcBMHjD3B6Qblf9SgNqFD3inN6mhkiBszM'],
    ['N','nut','🥜',[['n','n'],['ʌ','u'],['t','t']]],
    ['N','nap','😴',[['n','n'],['æ','a'],['p','p']]],
    ['N','nail','🔩',[['n','n'],['eɪ','ai'],['l','l']]],
    ['O','ox','🐂',[['ɒ','o'],['k s','x']],'https://encrypted-tbn2.gstatic.com/licensed-image?q=tbn:ANd9GcThnW2IKxgUaso2iv-eUTnXj0AbxAgZczA1dZD6uOHfbHyZ6yg7atG3GERxvwtEcsZcOVpJChohv-AcOcM'],
    ['O','owl','🦉',[['aʊ','ow'],['l','l']]],
    ['O','oil','🛢️',[['ɔɪ','oi'],['l','l']]],
    ['O','oak','🌳',[['oʊ','oa'],['k','k']]],
    ['P','pig','🐷',[['p','p'],['ɪ','i'],['g','g']],'https://encrypted-tbn2.gstatic.com/licensed-image?q=tbn:ANd9GcQKeXVO6_P7iX_M8qKtcMiE_6tX-jp5F1DMc8OS4t9tagZiAlKCTwpzbzWLNhM5VI-EDr_WYzEnWuvi6jI'],
    ['P','pan','🍳',[['p','p'],['æ','a'],['n','n']]],
    ['P','pot','🍲',[['p','p'],['ɒ','o'],['t','t']]],
    ['P','pen','🖊️',[['p','p'],['ɛ','e'],['n','n']]],
    ['Q','queen','👑',[['k w','qu'],['iː','ee'],['n','n']],'https://encrypted-tbn0.gstatic.com/licensed-image?q=tbn:ANd9GcS7OekNWBK0RgpM6fRVHR9i8OJiqpUkKAk1zv_UpAQovoGyeWQBIejBjBxm2Xw-Tf2xno4I04y6BeJH3I0'],
    ['Q','quack','🦆',[['k w','qu'],['æ','a'],['k','ck']]],
    ['Q','quiz','📝',[['k w','qu'],['ɪ','i'],['z','z']]],
    ['Q','quilt','🛏️',[['k w','qu'],['ɪ','i'],['l','l'],['t','t']]],
    ['R','rat','🐀',[['r','r'],['æ','a'],['t','t']],'https://encrypted-tbn2.gstatic.com/licensed-image?q=tbn:ANd9GcQu0L6o30Effc2t3NFJlldZ9o_V2UqrhtX_cWGeg5bAuQj-CWXYMG8Y1lb8XuqxIE-gG2tGiXhLIDdS2Bw'],
    ['R','red','🟥',[['r','r'],['ɛ','e'],['d','d']]],
    ['R','run','🏃',[['r','r'],['ʌ','u'],['n','n']]],
    ['R','rug','🧶',[['r','r'],['ʌ','u'],['g','g']]],
    ['R','rainbow','🌈',[['reɪn','rain'],['boʊ','bow']]],
    ['S','sun','☀️',[['s','s'],['ʌ','u'],['n','n']],'https://encrypted-tbn0.gstatic.com/licensed-image?q=tbn:ANd9GcQNyhYS-HfjJZP5MiJql07BHXUYre7kbwUIPvzDu1dRTLjXFgFeIZ6G4fU_ML20vtHByLfgXpjZSXvTa0s'],
    ['S','sad','😢',[['s','s'],['æ','a'],['d','d']]],
    ['S','sit','🪑',[['s','s'],['ɪ','i'],['t','t']]],
    ['S','six','6️⃣',[['s','s'],['ɪ','i'],['k s','x']]],
    ['S','sunflower','🌻',[['sʌn','sun'],['flaʊər','flower']]],
    ['T','toy','🧸',[['t','t'],['ɔɪ','oy']]],
    ['T','ten','🔟',[['t','t'],['ɛ','e'],['n','n']]],
    ['T','tap','🚰',[['t','t'],['æ','a'],['p','p']]],
    ['T','tub','🛁',[['t','t'],['ʌ','u'],['b','b']]],
    ['T','telephone','☎️',[['tɛli','tele'],['foʊn','phone']]],
    ['U','up','⬆️',[['ʌ','u'],['p','p']]],
    ['U','urn','🏺',[['ɜː','ur'],['n','n']]],
    ['U','ufo','🛸',[['juː','U'],['ɛf','F'],['oʊ','O']]],
    ['U','uncle','👨',[['ʌ','u'],['ŋ','n'],['k','c'],['əl','le']]],
    ['V','van','🚐',[['v','v'],['æ','a'],['n','n']],'https://encrypted-tbn2.gstatic.com/licensed-image?q=tbn:ANd9GcQ3ABZcWjPe2pk3Tv-MtkKkgswf96awAFM6XmFefBZgLK_iVgyASs3682A1K-0RKsidewn13s0bDxrUusM'],
    ['V','vet','🩺',[['v','v'],['ɛ','e'],['t','t']]],
    ['V','vine','🌿',[['v','v'],['aɪ','i'],['n','ne']]],
    ['V','vest','🦺',[['v','v'],['ɛ','e'],['s','s'],['t','t']]],
    ['W','web','🕸️',[['w','w'],['ɛ','e'],['b','b']],'https://encrypted-tbn2.gstatic.com/licensed-image?q=tbn:ANd9GcQzSoXPhCnWP5WguUR3ItXofRAFHiFtL6-0ZrUu65dEJ3uuC1h_2_MetLtPlwT6QB4Q9EbTT431judW0s8'],
    ['W','wig','💇‍♀️',[['w','w'],['ɪ','i'],['g','g']]],
    ['W','wet','💦',[['w','w'],['ɛ','e'],['t','t']]],
    ['W','win','🏆',[['w','w'],['ɪ','i'],['n','n']]],
    ['X','box','📦',[['b','b'],['ɒ','o'],['k s','x']],'https://encrypted-tbn3.gstatic.com/licensed-image?q=tbn:ANd9GcTWHlMZTybVuOeL3MEU3IBT_9aJx_lWWWui0tFrh4fMWl8uCu_70vCRm4L7qH2BMdq7pfZalNKmEXhr-gg'],
    ['X','fox','🦊',[['f','f'],['ɒ','o'],['k s','x']]],
    ['X','six','6️⃣',[['s','s'],['ɪ','i'],['k s','x']]],
    ['X','wax','🕯️',[['w','w'],['æ','a'],['k s','x']]],
    ['Y','yam','🍠',[['j','y'],['æ','a'],['m','m']],'https://encrypted-tbn0.gstatic.com/licensed-image?q=tbn:ANd9GcTvn_X48yY-erqiLzYg1zUYU_-6R24CdFaVo6iq6cKECcJ-necfuSuIeFFIeGBsO6BFG5HH8Ot2FjX0fYU'],
    ['Y','yak','🦬',[['j','y'],['æ','a'],['k','k']]],
    ['Y','yell','🗣️',[['j','y'],['ɛ','e'],['l','ll']]],
    ['Y','yolk','🟡',[['j','y'],['oʊ','ol'],['k','k']]],
    ['Z','zip','🤐',[['z','z'],['ɪ','i'],['p','p']],'https://encrypted-tbn1.gstatic.com/licensed-image?q=tbn:ANd9GcQzR1g7zbgxsmYBH_wQxH1Kbg1xop5bjoFvZDA_mLrJ8ND3hi7sq1nxmEjG3c7fKMtDk2tIGemgaZAYSUo'],
    ['Z','zoo','🦁',[['z','z'],['uː','oo']]],
    ['Z','zebra','🦓',[['z','z'],['iː','e'],['b','b'],['r','r'],['ə','a']]],
    ['Z','zero','0️⃣',[['z','z'],['ɪə','e'],['r','r'],['oʊ','o']]]
];

const D = rawD.map(r => {
    let ssml = `<speak><emphasis level="strong">${r[0]}</emphasis>.<break time="1s"/>`;
    let phases = [{t:0, type:'letter', text: r[0]}];
    let curT = 1500;
    
    // 綁定音標 (IPA) 同 英文字母 (Grapheme)
    let phonicsData = r[3].map(ph => ({ ipa: `/${ph[0]}/`, letter: ph[1] }));
    
    r[3].forEach((ph, index) => {
        ssml += `<phoneme alphabet="ipa" ph="${ph[0]}">${ph[1]}</phoneme><break time="1s"/>`;
        phases.push({t: curT, type:'phonic', pData: phonicsData, hlIdx: index});
        curT += 1300;
    });
    ssml += `${r[1]}.</speak>`;
    phases.push({t: curT, type:'word', text: r[1].toUpperCase(), emoji: r[2], img: r[4] || null});
    
    return { l: r[0], w: r[1], emoji: r[2], ssml: ssml, p: phases, st: letterStrokes[r[0]] };
});

// Expose on window so modules that read window.D / window.letterStrokes work
// (top-level const is not attached to window in browsers).
window.phonicsGroups = phonicsGroups;
window.letterStrokes = letterStrokes;
window.D = D;

window._baseVocabLen = window.D.length;
