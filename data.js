const phonicsGroups = [
    { name: '第 1 組 (SATIPN)', letters: ['S','A','T','I','P','N'] },
    { name: '第 2 組 (CKEHRMD)', letters: ['C','K','E','H','R','M','D'] },
    { name: '第 3 組 (GOULFB)', letters: ['G','O','U','L','F','B'] },
    { name: '第 4 組 (JVWXYZQ)', letters: ['J','V','W','X','Y','Z','Q'] }
];

const letterStrokes = {
    'A': [[150,40,90,220],[150,40,210,220],[115,145,185,145]],
    'B': [[100,40,100,220],[100,40,160,40,180,85,150,130,100,130],[100,130,170,130,190,175,160,220,100,220]],
    'C': [[200,70,160,40,110,50,80,130,110,210,160,220,200,190]],
    'D': [[100,40,100,220],[100,40,160,40,200,90,200,170,160,220,100,220]],
    'E': [[100,40,100,220],[100,40,180,40],[100,130,160,130],[100,220,180,220]],
    'F': [[100,40,100,220],[100,40,180,40],[100,130,160,130]],
    'G': [[200,70,160,40,110,50,80,130,110,210,160,220,200,190,200,150,150,150]],
    'H': [[100,40,100,220],[200,40,200,220],[100,130,200,130]],
    'I': [[100,40,200,40],[100,220,200,220],[150,40,150,220]],
    'J': [[120,40,240,40],[180,40,180,180,150,220,120,220,100,190]],
    'K': [[100,40,100,220],[180,40,100,130],[100,130,180,220]],
    'L': [[120,40,120,220,200,220]],
    'M': [[80,220,80,40],[80,40,150,130],[150,130,220,40],[220,40,220,220]],
    'N': [[80,220,80,40],[80,40,220,220],[220,220,220,40]],
    'O': [[150,40,90,80,80,150,100,210,150,230,200,210,220,150,210,80,150,40]],
    'P': [[100,40,100,220],[100,40,160,40,190,85,160,130,100,130]],
    'Q': [[150,40,90,80,80,150,100,210,150,230,200,210,220,150,210,80,150,40],[170,170,230,230]],
    'R': [[100,40,100,220],[100,40,160,40,190,85,160,130,100,130],[140,130,200,220]],
    'S': [[200,70,150,40,100,70,100,110,150,130,200,150,200,190,150,220,100,190]],
    'T': [[80,40,220,40],[150,40,150,220]],
    'U': [[100,40,100,170,120,210,150,220,180,210,200,170,200,40]],
    'V': [[80,40,150,220,220,40]],
    'W': [[80,40,115,220,150,100,185,220,220,40]],
    'X': [[80,40,220,220],[220,40,80,220]],
    'Y': [[80,40,150,130],[220,40,150,130],[150,130,150,220]],
    'Z': [[80,40,220,40,80,220,220,220]]
};

// 104 個精選具象字彙
const rawD = [
    ['A','ant','🐜',[['æ','a'],['n','n'],['t','t']],'https://encrypted-tbn0.gstatic.com/licensed-image?q=tbn:ANd9GcRTqZsTppo-y06ojxPqRMtZYTLTxYptA0k0o_RxZxEhuc-JYo0uOqHo5AQsKGl06czjVwr3m-l55-MrtQ8'],
    ['A','axe','🪓',[['æ','a'],['k s','xe']]],
    ['A','arm','💪',[['ɑː','ar'],['m','m']]],
    ['A','art','🎨',[['ɑː','ar'],['t','t']]],
    ['B','bug','🐛',[['b','b'],['ʌ','u'],['g','g']],'https://encrypted-tbn0.gstatic.com/licensed-image?q=tbn:ANd9GcQhUl7djA2u2Toee8Y9oZNTf2rog3BP0zIJMeV8t1q_TI8HQDWp0ha_UKpKS9DvkZWkUEWM_0JwfAZF6SA'],
    ['B','bat','🦇',[['b','b'],['æ','a'],['t','t']]],
    ['B','bed','🛏️',[['b','b'],['ɛ','e'],['d','d']]],
    ['B','bus','🚌',[['b','b'],['ʌ','u'],['s','s']]],
    ['C','cat','🐱',[['k','c'],['æ','a'],['t','t']],'https://encrypted-tbn2.gstatic.com/licensed-image?q=tbn:ANd9GcTY5Ow415BCLiENvY-XltdMQwjw-ZEHqV12EXDOIk22qkrOwpaaClbWXnGSWrQKfeizSqc7xJkpCLSXdB8'],
    ['C','cup','🍵',[['k','c'],['ʌ','u'],['p','p']]],
    ['C','car','🚗',[['k','c'],['ɑː','ar']]],
    ['C','cap','🧢',[['k','c'],['æ','a'],['p','p']]],
    ['D','dog','🐶',[['d','d'],['ɒ','o'],['g','g']],'https://encrypted-tbn1.gstatic.com/licensed-image?q=tbn:ANd9GcQxNXQhyLhFHqkHzUr19pCRHNWVY05Fh373O0jxRxMjgWj_dfvVLVmLnUJLISk6AdTj1BmhVbHSHA0J5UQ'],
    ['D','dad','👨',[['d','d'],['æ','a'],['d','d']]],
    ['D','dot','🔴',[['d','d'],['ɒ','o'],['t','t']]],
    ['D','duck','🦆',[['d','d'],['ʌ','u'],['k','ck']]],
    ['E','egg','🥚',[['ɛ','e'],['g','gg']],'https://encrypted-tbn1.gstatic.com/licensed-image?q=tbn:ANd9GcQCE-9NVZEDxG3ekJDIPeyfYLCBWuatFqJyB6IO3nYGgIp9Q3DcTuI7vGeq0SNEka7c3pjrIbkHdmcXE0A'],
    ['E','elf','🧝',[['ɛ','e'],['l','l'],['f','f']]],
    ['E','elk','🦌',[['ɛ','e'],['l','l'],['k','k']]],
    ['E','eat','🍽️',[['iː','ea'],['t','t']]],
    ['F','fox','🦊',[['f','f'],['ɒ','o'],['k s','x']],'https://encrypted-tbn1.gstatic.com/licensed-image?q=tbn:ANd9GcR5UwT41ltm42FcjXeocyAyPdTt1AmUUd2yXos8fYkCU2FWDOt3GHX0zZA1OkTzeYicm3NW2H7Zme7PzS4'],
    ['F','fan','🎐',[['f','f'],['æ','a'],['n','n']]],
    ['F','fin','🦈',[['f','f'],['ɪ','i'],['n','n']]],
    ['F','fog','🌫️',[['f','f'],['ɒ','o'],['g','g']]],
    ['G','gum','🍬',[['g','g'],['ʌ','u'],['m','m']],'https://encrypted-tbn3.gstatic.com/licensed-image?q=tbn:ANd9GcSttm5fKjDTpwXf6ZPUelc9pt2UzOjgySXzuYRvqYi13HT8M5zpBK_AtpHHGV_AnshxUO5v3TkYvwDTtYc'],
    ['G','gas','⛽',[['g','g'],['æ','a'],['s','s']]],
    ['G','gift','🎁',[['g','g'],['ɪ','i'],['f','f'],['t','t']]],
    ['G','goat','🐐',[['g','g'],['oʊ','oa'],['t','t']]],
    ['H','hat','🎩',[['h','h'],['æ','a'],['t','t']],'https://encrypted-tbn0.gstatic.com/licensed-image?q=tbn:ANd9GcRA9ZgNqzvABD4as-ZwcdLsr6d86yWaIQmFbkm1_Rq8vry8rR0yDtxxC5sj0FboMzsJDxm8hFFd-b3BPJw'],
    ['H','hen','🐔',[['h','h'],['ɛ','e'],['n','n']]],
    ['H','hit','🥊',[['h','h'],['ɪ','i'],['t','t']]],
    ['H','hop','🦘',[['h','h'],['ɒ','o'],['p','p']]],
    ['I','ink','✒️',[['ɪ','i'],['ŋ','n'],['k','k']],'https://encrypted-tbn0.gstatic.com/licensed-image?q=tbn:ANd9GcTEXL-Ev2FmxrLxkIaoOu0fmjtQLhnbSzQFh1gLLChUBoy8VfoLi7YuYUNeOMqT7qPqT7Hvqd4fICCSMbA'],
    ['I','ice','🧊',[['aɪ','i'],['s','ce']]],
    ['I','ill','🤒',[['ɪ','i'],['l','ll']]],
    ['I','itch','🦟',[['ɪ','i'],['tʃ','tch']]],
    ['J','jam','🍯',[['dʒ','j'],['æ','a'],['m','m']],'https://encrypted-tbn2.gstatic.com/licensed-image?q=tbn:ANd9GcTDM_lMgpzKbhrj_NAn55jRkq70QgcdVMGth6vRoZDI5iv1H9q5lbkWgQ-55pheVXS_MK0TKDWvRqntR9Y'],
    ['J','jet','✈️',[['dʒ','j'],['ɛ','e'],['t','t']]],
    ['J','jog','🏃',[['dʒ','j'],['ɒ','o'],['g','g']]],
    ['J','jug','🫙',[['dʒ','j'],['ʌ','u'],['g','g']]],
    ['K','kid','👦',[['k','k'],['ɪ','i'],['d','d']],'https://encrypted-tbn3.gstatic.com/licensed-image?q=tbn:ANd9GcQAfPmFNM3kpCpySAIbjUnuW6y1Tp7Owahxz1SlMh745qhcgbtjAtbJKV7tQ3BlQBnBXxkDR16IbVp7Uno'],
    ['K','kit','🧰',[['k','k'],['ɪ','i'],['t','t']]],
    ['K','keg','🛢️',[['k','k'],['ɛ','e'],['g','g']]],
    ['K','king','🤴',[['k','k'],['ɪ','i'],['ŋ','ng']]],
    ['L','log','🪵',[['l','l'],['ɒ','o'],['g','g']],'https://encrypted-tbn1.gstatic.com/licensed-image?q=tbn:ANd9GcT_0QFKA_34cABAQUsqNFJWLxM6TAid_QI7F8X6BZqIpmvIv6-OW0YkJFbr-a9rh7CPR4v6BQpSMWUtPqA'],
    ['L','leg','🦵',[['l','l'],['ɛ','e'],['g','g']]],
    ['L','lip','👄',[['l','l'],['ɪ','i'],['p','p']]],
    ['L','lid','🥫',[['l','l'],['ɪ','i'],['d','d']]],
    ['M','map','🗺️',[['m','m'],['æ','a'],['p','p']],'https://encrypted-tbn2.gstatic.com/licensed-image?q=tbn:ANd9GcRNi0R0rSCZlU0LlXWFvIeZtCXvg1JGIOe_El_kQrfkfuzPamx-WUeOrza7_6pSMqs6Zzr-qZSPAKDRm5Q'],
    ['M','man','👨',[['m','m'],['æ','a'],['n','n']]],
    ['M','mat','🔲',[['m','m'],['æ','a'],['t','t']]],
    ['M','mug','☕',[['m','m'],['ʌ','u'],['g','g']]],
    ['N','net','🥅',[['n','n'],['ɛ','e'],['t','t']],'https://encrypted-tbn3.gstatic.com/licensed-image?q=tbn:ANd9GcQEwVNmghxotUlk7i1K-tn6PKsPDstqTyfEvNtikmeGuy6OzKcBMHjD3B6Qblf9SgNqFD3inN6mhkiBszM'],
    ['N','nut','🥜',[['n','n'],['ʌ','u'],['t','t']]],
    ['N','nap','😴',[['n','n'],['æ','a'],['p','p']]],
    ['N','nail','💅',[['n','n'],['eɪ','ai'],['l','l']]],
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
    ['Q','quiz','❓',[['k w','qu'],['ɪ','i'],['z','z']]],
    ['Q','quilt','🛌',[['k w','qu'],['ɪ','i'],['l','l'],['t','t']]],
    ['R','rat','🐀',[['r','r'],['æ','a'],['t','t']],'https://encrypted-tbn2.gstatic.com/licensed-image?q=tbn:ANd9GcQu0L6o30Effc2t3NFJlldZ9o_V2UqrhtX_cWGeg5bAuQj-CWXYMG8Y1lb8XuqxIE-gG2tGiXhLIDdS2Bw'],
    ['R','red','🔴',[['r','r'],['ɛ','e'],['d','d']]],
    ['R','run','🏃',[['r','r'],['ʌ','u'],['n','n']]],
    ['R','rug','🧶',[['r','r'],['ʌ','u'],['g','g']]],
    ['S','sun','☀️',[['s','s'],['ʌ','u'],['n','n']],'https://encrypted-tbn0.gstatic.com/licensed-image?q=tbn:ANd9GcQNyhYS-HfjJZP5MiJql07BHXUYre7kbwUIPvzDu1dRTLjXFgFeIZ6G4fU_ML20vtHByLfgXpjZSXvTa0s'],
    ['S','sad','😢',[['s','s'],['æ','a'],['d','d']]],
    ['S','sit','🪑',[['s','s'],['ɪ','i'],['t','t']]],
    ['S','six','6️⃣',[['s','s'],['ɪ','i'],['k s','x']]],
    ['T','toy','🧸',[['t','t'],['ɔɪ','oy']]],
    ['T','ten','🔟',[['t','t'],['ɛ','e'],['n','n']]],
    ['T','tap','🚰',[['t','t'],['æ','a'],['p','p']]],
    ['T','tub','🛁',[['t','t'],['ʌ','u'],['b','b']]],
    ['U','up','⬆️',[['ʌ','u'],['p','p']]],
    ['U','urn','🏺',[['ɜː','ur'],['n','n']]],
    ['U','ufo','🛸',[['j uː','u'],['ɛ f','f'],['oʊ','o']]],
    ['U','uncle','🧔',[['ʌ','u'],['ŋ','n'],['k','c'],['əl','le']]],
    ['V','van','🚐',[['v','v'],['æ','a'],['n','n']],'https://encrypted-tbn2.gstatic.com/licensed-image?q=tbn:ANd9GcQ3ABZcWjPe2pk3Tv-MtkKkgswf96awAFM6XmFefBZgLK_iVgyASs3682A1K-0RKsidewn13s0bDxrUusM'],
    ['V','vet','🩺',[['v','v'],['ɛ','e'],['t','t']]],
    ['V','vat','🛢️',[['v','v'],['æ','a'],['t','t']]],
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
    ['Y','yak','🐂',[['j','y'],['æ','a'],['k','k']]],
    ['Y','yell','🗣️',[['j','y'],['ɛ','e'],['l','ll']]],
    ['Y','yolk','🍳',[['j','y'],['oʊ','ol'],['k','k']]],
    ['Z','zip','🤐',[['z','z'],['ɪ','i'],['p','p']],'https://encrypted-tbn1.gstatic.com/licensed-image?q=tbn:ANd9GcQzR1g7zbgxsmYBH_wQxH1Kbg1xop5bjoFvZDA_mLrJ8ND3hi7sq1nxmEjG3c7fKMtDk2tIGemgaZAYSUo'],
    ['Z','zoo','🦓',[['z','z'],['uː','oo']]],
    ['Z','zag','⚡',[['z','z'],['æ','a'],['g','g']]],
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
