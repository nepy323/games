(function(root){
'use strict';
const D=typeof module!=='undefined'?require('./cards.js'):root.SixData;
const CARDS=Object.fromEntries(D.cards.map(c=>[c.id,c]));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const summons={fuse_fallen:{artId:'fuse_fallen',size:2,ring:true,kin:'暗蝕',tier:'elite',multi:3,name:'暗蝕悖靈',hp:1100,dmg:80,speed:28,range:95,rate:1.2,role:'闇',faction:6,airHit:true,slowHit:true,lifesteal:.2},fuse_earth:{artId:'fuse_earth',size:2,ring:true,kin:'地脈',tier:'elite',multi:3,name:'地脈悖靈',hp:1200,dmg:84,speed:26,range:30,rate:1.2,role:'岩',faction:6,armor:.25,heal:30,regen:10},fuse_storm:{artId:'fuse_storm',size:1.9,ring:true,kin:'焰嵐',tier:'elite',multi:2,name:'焰嵐悖靈',hp:520,dmg:120,speed:40,range:145,rate:1.5,role:'火',faction:6,splash:70,airHit:true,ttl:30},fuse_aurora:{artId:'fuse_aurora',size:1.9,ring:true,kin:'極光',tier:'elite',multi:3,name:'極光悖靈',hp:600,dmg:32,speed:30,range:125,rate:1.1,role:'光',faction:6,slowHit:true,airHit:true,heal:46,ward:true},spirit:{artId:"f2_4",name:"界隙靈",hp:300,dmg:12,speed:42,range:24,rate:1.3,role:"魂",faction:4,ttl:12},skel:{artId:"f2_0",name:'衍生骷髏',hp:125,dmg:35,speed:40,range:22,rate:.85,role:'骨',faction:2},thrall:{artId:"f1_0",name:'血肉僕役',hp:155,dmg:42,speed:45,range:22,rate:.8,role:'刃',faction:1},gob:{artId:"f5_0",name:'營地刀兵',hp:170,dmg:40,speed:52,range:22,rate:.8,role:'刃',faction:5},guard:{artId:"f2_3",name:'骸骨守衛',hp:1600,dmg:85,speed:25,range:28,rate:1.3,role:'盾',armor:.15,faction:2},wolf:{artId:"summon_wolf",name:'狼靈',hp:230,dmg:48,speed:65,range:23,rate:.85,role:'狼',faction:4},treant:{artId:'f4_23',name:'樹人',hp:1300,dmg:105,speed:25,range:30,rate:1.3,role:'樹',regen:10,faction:4,treantAura:{r:70,pct:.01,floor:20,heal:.005}},hawk:{artId:"summon_hawk",name:'獵鷹',hp:220,dmg:43,speed:63,range:28,rate:.85,role:'翼',faction:4,flying:true,airHit:true}};
/* 悖靈：逆反共振召出的唯一一種裏律單位（借暗蝕的外觀與特性，與環行者專屬的暗蝕悖靈是兩回事）；吃掉的律靈把一個小特性帶給它 */
summons.omen=Object.assign({},summons.fuse_fallen,{name:'悖靈',kin:'悖',artId:'paradox',armor:.2});
const OMEN_BURST={dmg:240,r:110,slow:2};
const OMEN_TRAITS={n_rock:u=>{u.armor=(u.armor||0)+.15;},n_dew:u=>{u.regen=(u.regen||0)+12;},n_wind:u=>{u.speed*=1.25;},n_fire:u=>{u.splash=Math.max(u.splash||0,55);},n_frost:u=>{u.multi=(u.multi||1)+1;},n_light:u=>{u.heal=Math.max(u.heal||0,30);},n_rot:u=>{u.curseHit=true;},n_dark:u=>{u.lifesteal=(u.lifesteal||0)+.1;}};
/* 旗印：牌組中同旗卡牌達 2 / 4 / 6 張，依序解鎖三檔加成（各旗主題不同，數值為草案） */
const SWAP_COST=1,SWAP_COOLDOWN=3;
/* 律靈融煉：兩組指定的律靈在 FUSE_WINDOW 秒內、距離 FUSE_RANGE 以內先後部署，兩組消失，換成一隻大律靈（免費）。配方是資料，之後其他單位也能加。 */
const FUSE_WINDOW=6,FUSE_RANGE=80,FUSE_COOLDOWN=6,FUSE_AUTO=true,FUSE_WEAK=.9,FUSE_BURST_WEAK=.5,OMEN_BASE=.8,MOVE_SCALE=.6,PURE_NEED=8,PURE_BONUS=.12,PURE_BONUS_SPIRIT=.05,PURE_CD=.8,OMEN_MULT=[1,1.1,1.2],OMEN_PURE=6,OMEN_TTL=12,STASIS_SLOW=.01; /* 常規合靈：配對的兩組近距離先後部署就融煉，本體 ×0.75、衝擊 ×0.5、共享冷卻；悖靈（逆反共振）基準 ×0.8、本身減傷 20%，吃 0／1／2 組再乘 1／1.1／1.2（界律精編對盃賽對手約 63%，更高就是 imba） */
const FUSIONS=[
 {a:'n_rock',b:'n_dew',into:'fuse_earth',burst:{dmg:240,r:100,slow:2}},{a:'n_fire',b:'n_wind',into:'fuse_storm',burst:{dmg:320,r:110}},
 {a:'n_frost',b:'n_light',into:'fuse_aurora',burst:{dmg:140,r:110,slow:3}},
 {a:'n_rot',b:'n_dark',into:'fuse_fallen',burst:{dmg:200,r:120,slow:2},dark:true}];
/* 英雄格：英雄不在牌組內，累積條件達成後花資源（原費用 +1）登場；登場後有主動技（冷卻）。 */
const THREAT_AGGRO=230,SPLASH_VS_BUILD=.3,DARK_FUSIONS=4,BIND_MAX=6,HERO_COUNTER_COST=1,HERO_ACTIVE_COST=2; /* 英雄放技能要花水晶：計數技能自動扣 1（可預扣至 -2），主動技要有 2 點才放得出來 */
/* 守城人：己方外塔第一次降到半血，塔旁自動出現一隻菁英級守城單位（限時、免費）；種類看牌組裡最多的勢力 */
const GUARD_TTL=18,GUARD_LEASH=165; /* 護印英魂只在塔前這個範圍活動，不過河 */
/* 護印英魂：每位英雄的「前世殘影」（異化版）。一座塔降臨一種，一個勢力兩種；由帶的英雄所屬勢力決定，兩座塔隨機各得其一 */
const GUARD_ECHOES={
 f0_4:{art:'guard_0',name:'聖堂殘影',hp:1700,dmg:75,speed:30,range:30,rate:1.1,attackKind:'melee',role:'盾',element:'戰令',ward:true,splash:45,note:'護佑附近友軍（減傷），近戰濺射'},
 f0_30:{art:'guard_0',name:'銃陣殘影',hp:1200,dmg:85,speed:30,range:135,rate:1,attackKind:'bullet',role:'銃',element:'戰令',bounce:2,bounceFall:.7,note:'彈跳銃彈清兵'},
 f1_5:{art:'guard_1',name:'血怒殘影',hp:1500,dmg:130,speed:34,range:28,rate:1,attackKind:'melee',role:'狂',element:'血誓',aoe:70,lifesteal:.1,note:'橫掃吸血'},
 f1_30:{art:'guard_1',name:'縫魂殘影',hp:1300,dmg:90,speed:32,range:110,rate:1.1,attackKind:'magic',role:'鎖',element:'血誓',bounce:2,bounceFall:.7,lifesteal:.2,note:'血鏈彈跳，吸血'},
 f2_7:{art:'guard_2',name:'墓冠殘影',hp:1500,dmg:95,speed:26,range:30,rate:1.3,attackKind:'melee',role:'王',element:'靈魂',splash:55,curseHit:true,summon:'skel',spawnEvery:9,note:'濺射詛咒，召喚骷髏'},
 f2_30:{art:'guard_2',name:'喪鐘殘影',hp:1400,dmg:70,speed:28,range:120,rate:1.2,attackKind:'magic',role:'鐘',element:'靈魂',chime:90,airHit:true,note:'鐘聲詛咒周圍敵軍'},
 f3_30:{art:'guard_3',name:'砲匠殘影',hp:1300,dmg:130,speed:28,range:150,rate:1.2,attackKind:'bullet',role:'鉚',element:'符文',trueDmg:true,note:'真實傷害（無視減傷）'},
 f3_4:{art:'guard_3',name:'符盾殘影',hp:2000,dmg:65,speed:26,range:30,rate:1.2,attackKind:'melee',role:'盾',element:'符文',armor:.25,block:160,blockEvery:4,note:'高減傷，定時自帶護盾'},
 f4_7:{art:'guard_4',name:'古根殘影',hp:1800,dmg:90,speed:22,range:32,rate:1.4,attackKind:'melee',role:'樹',element:'自然',splash:50,slowHit:true,regen:15,zone:{r:80,slow:true},note:'範圍緩速，濺射，緩慢再生'},
 f4_30:{art:'guard_4',name:'孢雲殘影',hp:1500,dmg:55,speed:30,range:110,rate:1.1,attackKind:'magic',role:'菇',element:'自然',bounce:2,bounceFall:.8,bounceHeal:50,slowHit:true,note:'孢子彈跳，治療友軍並緩速'},
 f5_30:{art:'guard_5',name:'獵群殘影',hp:1400,dmg:110,speed:32,range:130,rate:1,attackKind:'arrow',role:'索',element:'物理',multi:2,slowHit:true,airHit:true,note:'雙發套索，緩速，可對空'},
 f5_5:{art:'guard_5',name:'投矛殘影',hp:1200,dmg:60,speed:30,range:130,rate:1.1,attackKind:'arrow',role:'矛',element:'物理',multi:3,multiRepeat:true,paraHit:true,airHit:true,note:'三矛齊出，命中癱瘓'}
};
for(const k of Object.keys(GUARD_ECHOES))GUARD_ECHOES[k].art='guard_'+k; /* 圖集鍵：guardian-art.js */
const GUARD_PAIR={0:['f0_4','f0_30'],1:['f1_5','f1_30'],2:['f2_7','f2_30'],3:['f3_4','f3_30'],4:['f4_7','f4_30'],5:['f5_5','f5_30']};
/* 戰術施放特效：效果→畫法與時間；元素→顏色（只影響畫面） */
const TFX_STYLE={bomb:['shell',null],barrage:['stone',1.4],fire:['flame',null],bolt:['spear',.9],haste:['dash',1.1],speed:['dash',1.1],rush:['dash',1.1],power:['surge',1.2],frenzy:['surge',1.2],sacrifice:['surge',1.2],shield:['dome',1.4],armor:['dome',1.4],heal:['heal',1.8],curse:['mist',1.8],slow:['chains',1.4],root:['chains',1.4],mine:['glyph',1.3],summon:['summon',1.3]};
const TFX_COL={物理:'#f2c46a',戰令:'#ffd36a',神聖:'#fff0c0',血誓:'#e0605a',火焰:'#ff8a3a',靈魂:'#b58cff',腐朽:'#8fb35a',符文:'#6fd0ff',火藥:'#ffb060',自然:'#7be07b',疾風:'#bfe9ff',律:'#fff0c0'};
const HERO_SPLASH=.5; /* 英雄的濺射／橫掃只有一般單位的約 4 成，避免一擊清掉整群小兵 */
const START_ENERGY=0,REGEN_SLOW=.35,REGEN_MID=.5,REGEN_FAST=.625,REGEN_MID_AT=40,REGEN_FAST_AT=100,GROW_AT=20; /* 水晶：開局 0，前 40 秒慢（快攻牌有價值）、中期正常、100 秒後加速（優質單位發力） */
const HERO_SUMMON_EXTRA=1,HERO_RESPAWN=40,TREANTS=['f4_6','f4_23'];
const HEROES={
 f0_4:{pas:'走過的路徑 6 秒內讓友軍加速 15%；衝擊波只有第一次撞擊',metric:'troopCards',need:5,cond:'累計部署兵種',enter:'聖堂號令',desc:'登場時全場友軍獲得 250 護盾（8 秒）；帶 2 名騎兵護衛（各 250 生命）',escort:{from:'f5_3',n:2,hpAbs:250,dmg:.35},hs:{name:'聖堂衝擊波',need:5,desc:'周圍敵軍受 120 傷害，附近友軍獲得 120 護盾'}},
 f0_30:{pas:'強力彈藥 10 發（彈跳 3 次），打完冷卻 15 秒；冷卻期間改用較弱的普通彈藥',metric:'tacticSpent',need:10,cond:'累計花費於戰術',enter:'統領列陣',desc:'登場時帶 2 名火槍兵護衛（各 250 生命）',escort:{from:'f0_3',n:2,hpAbs:250,dmg:.35},hs:{name:'齊射',need:6,desc:'前方一條直線上所有敵人受 100 傷害，附近友軍攻速 +60%（3 秒）'}},
 f1_5:{pas:'附近友軍陣亡疊層（傷害、減傷）；生命低於 35% 的「惡來」越低越強',metric:'ownDeaths',need:6,cond:'己方累計陣亡',enter:'士氣大振',desc:'登場時全場友軍攻速與移速 +15%（6 秒）；帶一組血誓奴兵',escort:{from:'f1_0',n:4,hp:.5,dmg:.35},hs:{name:'血祭爆發',need:5,desc:'周圍敵軍受 100 傷害，自身回復 100 生命'}},
 f1_30:{pas:'黑甲屠夫替奈爾承受 40% 傷害；屠夫在場時，奈爾傷害 +20%',metric:'allDeaths',need:14,cond:'場上累計陣亡',enter:'血契',desc:'登場時全場友軍每次攻擊吸血 20%（6 秒）；帶 1 名黑甲屠夫',escort:{from:'f1_3',n:1,hp:.6,dmg:.35},hs:{name:'血網',need:5,desc:'附近友軍損失 12% 當前生命，攻擊 +30%（5 秒），期間回補所損失的血'}},
 f2_7:{pas:'每 4 秒生出骷髏（最多 4）；每 4 個敵人陣亡收服 1 具殘軀；友軍陣亡時削弱附近敵軍（最多 −10% 傷害與攻速）',summon:{every:4,cap:4},metric:'allDeaths',need:14,cond:'場上累計陣亡',enter:null,desc:''},
 f2_30:{alt:{metric:'allDeaths',need:9},metric:'controls',need:6,cond:'累計施加控制',enter:'喪鐘預響',desc:'登場時全場友軍獲得「對抗死亡」（致命傷害時延後 2 秒才死亡，6 秒內有效）',hs:{name:'喪鐘',need:6,desc:'大範圍敵軍減速 3 秒並詛咒 4 秒；附近友軍獲得「對抗死亡」6 秒（致命傷害時延後 2 秒才死亡，期間不受傷）'}},
 f3_30:{pas:'每 36 秒生出一台砲車（最多 1 台）',summon:{every:36,cap:1},metric:'troopCards',need:10,cond:'累計部署兵種',enter:null,desc:'',hs:{name:'燃燒轟炸',need:4,desc:'隨機一處落下燃燒彈（威力減半），持續灼傷'}},
 f3_4:{pas:'周圍友軍受傷 −20% 並由他分擔 30%；光環內友軍越多，他越硬、近戰傷害越高',metric:'tacticSpent',need:12,cond:'累計花費於戰術與建築',enter:null,desc:''},
 f4_7:{pas:'每 4 秒生出小樹人（最多 5 隻）：範圍緩速，並以汲取每秒奪取 0.5% 最大生命（至少 8）',summon:{every:4,cap:5},metric:'treants',need:2,cond:'累計部署樹人類單位',enter:'根鎖',desc:'登場時全場地面敵軍定身 2 秒'},
 f4_30:{pas:'攻擊使目標中毒 4 秒（每秒 12 傷害，最多 5 層），毒傷的 60% 轉成友軍回血',metric:'unitsDeployed',need:12,cond:'累計部署單位',enter:'生息',desc:'登場時全場友軍回復 15% 生命；帶 1 隻月蛾馭手',escort:{from:'f4_21',n:1,hp:.5,dmg:.35},hs:{name:'孢子雲',need:5,desc:'周圍敵軍各疊 2 層中毒（4 秒，每秒 24 傷害）'}},
 f5_30:{pas:'獵殺：鎖定場上費用最高的敵方單位，優先追擊並對其傷害 +50%',metric:'troopCards',need:5,cond:'累計部署兵種',enter:null,desc:'登場時帶 1 隻狼騎兵',escort:{from:'f5_3',n:1,hp:.5,dmg:.35},hs:{name:'衝鋒號',need:4,desc:'自身與附近友軍移速 +50%（4 秒），周圍敵軍受 90 傷害'}},
 f5_5:{pas:'一次擲 4 根矛，命中者癱瘓（緩速、降傷、流血）',metric:'unitsDeployed',need:5,cond:'累計部署單位',enter:null,desc:'登場時帶 1 組投石獸人',escort:{from:'f5_4',n:2,hp:.5,dmg:.35},hs:{name:'癱瘓矛',need:4,desc:'周圍友軍的下一次攻擊附帶癱瘓'}},
 n_king:{metric:'fusions',need:2,cond:'累計融煉',skill:'環行',cd:9999,passive:true,desc:'持有資源加成全軍傷害；命中累積，召喚隨機合靈；累計融煉 4 次後解放裏律，加入暗蝕合靈'},
 n_hero:{metric:'fusions',need:2,cond:'累計融煉',skill:'環行',cd:9999,passive:true,desc:'持有資源加成全軍傷害；命中累積，丟出隨機合靈'}
};
/* 寶物：系統隨機給的單次道具（不在牌組內），無盡鏖戰專用；數值為弱化版遺物效果 */
const ITEM_FIRST=30,ITEM_EVERY=50,ITEM_EVERY_BEHIND=32,ITEM_BEHIND_GAP=1000,ITEM_MAX=2; /* 落後方（堡壘總血量少 1000 以上）的寶物 32 秒就來一個，平常 50 秒 */
const ITEMS=[
 {id:'brass',name:'黃銅機心',art:8,desc:'立即回復 2 點資源'},
 {id:'hourglass',name:'紫砂時計',art:2,desc:'10 秒內資源回復 +40%'},
 {id:'anvil',name:'古符鐵砧',art:7,desc:'8 秒內我方堡壘受到的傷害 −50%，並獲得 500 點護盾'},
 {id:'drum',name:'先祖戰鼓',art:12,desc:'全場友軍攻速 +20%（8 秒）'},
 {id:'seed',name:'世界樹種',art:9,desc:'全場友軍回復 15% 生命'},
 {id:'horn',name:'軍團號角',art:4,desc:'全場友軍攻擊 +30%（6 秒）'},
 {id:'chalice',name:'血誓聖杯',art:3,desc:'我方堡壘立即回復 4%，8 秒內再持續回復 12%'},
 {id:'tome',name:'封骨魔典',art:6,desc:'免費部署牌組中一張隨機兵牌，放在敵軍較多的那一路'},
 {id:'tusk',name:'獵王巨牙',art:11,desc:'對敵方一座外塔造成 6% 最大生命傷害'},
 {id:'knell',name:'幽魂喪鐘',art:5,desc:'對手失去 2 點資源'},
 {id:'moth',name:'琥珀月蛾',art:10,desc:'最受損的我方堡壘回復 20% 生命'},
 {id:'crown',name:'破王之冠',art:1,desc:'英雄登場條件進度 +50%'},
 {id:'foresight',name:'預知儲蓄',art:13,desc:'鎖住目前所有資源，5 秒後全額還回（上限暫時提高到 14）'}
];
/* 計數技能：精英以上單位的命中次數累積，滿了自動施放，花 1 點資源（可預扣，最低 -2） */
const SKILL_COST=0,ENERGY_FLOOR=-2; /* 菁英計數技能免費；只有環行（cost:3）要花資源 */
const SKILLS={
 banner:{name:'號令護盾',need:5,desc:'附近友軍獲得 120 護盾'},
 leech:{name:'奪魂',need:4,desc:'恢復 180 生命'},
 runes:{name:'符文庇佑',need:5,desc:'為附近生命比例最低的友軍提供 160 護盾'},
 rally:{name:'戰鼓',need:6,desc:'附近友軍攻速提高，持續 4 秒'},
 trample:{name:'震地',need:3,desc:'周圍敵軍受到 100 傷害並減速'},
 ringwalk:{name:'環行',need:5,cost:3,desc:'召喚一隻隨機合靈（12 秒），花 3 點水晶'},
 mend:{name:'縫魂',need:4,desc:'附近友軍回復 12% 生命'},
 shackle:{name:'縛魂',need:4,desc:'周圍敵軍定身 1.5 秒'},
 drill:{name:'鑽破',need:3,desc:'目標追加 220 點無視減傷傷害，並使其 3 秒內受傷 +25%'},
 moth:{name:'蛾粉',need:4,desc:'目標周圍敵軍減速並降低傷害'}
};
const BANNER_NEED=[2,4,6];
const BANNERS=[
 {key:'shield',name:'軍紀',text:['部署單位獲 40 點護盾','部署單位獲 70 點護盾','部署單位獲 110 點護盾'],val:[40,70,110]},
 {key:'dmg',name:'獻祭',text:['全軍傷害 +4%','全軍傷害 +8%','全軍傷害 +12%'],val:[.04,.08,.12]},
 {key:'regen',name:'亡魂',text:['資源回復 +3%','資源回復 +6%','資源回復 +10%'],val:[.03,.06,.10]},
 {key:'hp',name:'符文',text:['全軍生命 +4%','全軍生命 +8%','全軍生命 +12%'],val:[.04,.08,.12]},
 {key:'speed',name:'疾風',text:['全軍移速 +5%','全軍移速 +9%','全軍移速 +14%'],val:[.05,.09,.14]},
 {key:'rate',name:'蠻勇',text:['全軍攻速 +4%','全軍攻速 +8%','全軍攻速 +12%'],val:[.04,.08,.12]},
 {key:'start',name:'界律',text:['開局資源 +1','開局資源 +2','開局資源 +3'],val:[1,2,3]}
];
/* 旗印效果跟英雄掛鉤：同一勢力帶不同英雄，旗印效果不同（沒列在這裡的英雄用勢力預設）。parts = [欄位, 說明, 三檔數值, 是否為百分比] */
const BANNER_HERO={
 f0_30:{name:'齊射',parts:[['rate','全軍攻速',[.04,.08,.12],1],['hp','全軍生命',[.02,.03,.04],1]]},
 f1_30:{name:'血脈',parts:[['hp','全軍生命',[.04,.08,.12],1],['lifesteal','全軍吸血',[.02,.03,.04],1]]},
 f2_30:{name:'守靈',parts:[['shield','部署單位獲得護盾',[30,50,80],0,' 點']]},
 f3_30:{name:'重砲',parts:[['hp','全軍生命',[.04,.08,.12],1],['armor','全軍減傷',[.02,.03,.04],1]]},
 f3_4:{name:'堡壘',parts:[['tower','外塔、主堡與建築生命',[.08,.15,.25],1]]},
 f4_7:{name:'生長',parts:[['grow','開場 20 秒時一次獲得水晶',[1,2,2],0,' 點','+']]},
 f5_30:{name:'蠻勇',parts:[['rate','全軍攻速',[.04,.08,.12],1],['speed','全軍移速',[.02,.03,.04],1]]},
 f5_5:{name:'先手',parts:[['firstHit','每個單位第一次攻擊傷害（爆擊）',[.1,.15,.2],1]]},
 f4_30:{name:'毒襲',parts:[['firstPoison','每個單位第一次攻擊使目標中毒 4 秒（每秒 12 傷害），疊加',[1,2,3],0,' 層']]},
 n_hero:{name:'共鳴',parts:[['start','開局水晶',[1,2,3],0,' 點','+'],['spiritHp','律靈與悖靈生命（隨時間成長）',[.06,.12,.2],1],['fuseCd','融煉冷卻縮短（隨時間成長）',[.1,.2,.3],1]]},
 f2_7:{name:'亡魂',parts:[['deathGem','友軍單位陣亡，每',[8,6,4],0,' 個回復 1 點水晶']]},
};
const fmtPart=([k,label,v,pct,suffix,prefix],i)=>label+' '+(pct?'+'+Math.round(v[i]*100)+'%':(prefix||'')+v[i]+(suffix||''));
const bannerDef=(f,extra=[])=>{
 const hid=extra.find(id=>CARDS[id]&&CARDS[id].faction===f&&BANNER_HERO[id]);
 if(hid){const h=BANNER_HERO[hid],val={};h.parts.forEach(p=>{val[p[0]]=p[2];});return {key:h.parts[0][0],name:h.name,hero:hid,val,text:[0,1,2].map(i=>h.parts.map(p=>fmtPart(p,i)).join('，'))};}
 const b=BANNERS[f];return {key:b.key,name:b.name,val:{[b.key]:b.val},text:b.text};
};
const bannerCount=(d,extra=[])=>{const n=[0,0,0,0,0,0,0];for(const id of [...d,...extra]){const c=CARDS[id];if(c&&c.faction>=0&&c.faction<7)n[c.faction]++;}return n;};
const bannerLevels=(d,extra=[])=>bannerCount(d,extra).map(n=>BANNER_NEED.filter(k=>n>=k).length);
const bannerMods=(d,extra=[])=>{const m={};bannerLevels(d,extra).forEach((lv,f)=>{if(!lv)return;const def=bannerDef(f,extra);for(const k of Object.keys(def.val))m[k]=(m[k]||0)+def.val[k][lv-1];});return m;};
/* 純系滿編：同系牌加上同系英雄合計達 PURE_NEED 張，同系的英雄與菁英生命傷害提高（界律的菁英由融煉不斷產出，加成較小），英雄技能冷卻縮短 */
const pureFaction=(deck,heroes=[])=>{const cnt={};for(const id of [...deck,...heroes]){const f=CARDS[id]&&CARDS[id].faction;if(f>=0&&f<7)cnt[f]=(cnt[f]||0)+1;}const k=Object.keys(cnt).find(f=>cnt[f]>=PURE_NEED);return k===undefined?-1:+k;};
class Battle{
 constructor(deck,enemy,seed=Date.now(),options={}){
  if(!this.validDeck(deck)||!this.validDeck(enemy))throw Error('牌組需有八張不重複的有效卡牌，英雄最多一張');
  this.aiStyles=options.aiStyles||['steady','steady'];const hs=(options.heroes||[[],[]]).map(l=>(l||[]).filter(id=>HEROES[id]));this.bannerMods=[deck,enemy].map((d,i)=>bannerMods(d,hs[i]||[]));
  this.teamMods=[{},{}];this.seed=seed>>>0;this.clock=0;this.remaining=180;this.overtime=false;this.state='playing';this.winner=null;this.units=[];this.towers=[];this.fields=[];this.projectiles=[];this.fx=[];this.logs=[];this.id=0;this.aiTimers=[1,1.8];this.auto=[false,true];this.stats=[{spent:0,casts:0,kills:0,towerDamage:0},{spent:0,casts:0,kills:0,towerDamage:0}];
  this.players=[deck,enemy].map((d,i)=>({energy:START_ENERGY+((this.bannerMods[i]||{}).start||0),resonance:0,hand:d.slice(0,4),queue:d.slice(4),deck:[...d]}));
  this.heroSlots=[0,1].map(i=>(hs[i]||[]).map(id=>({id,nextAt:0,skillAt:0,boost:0})));this.heroLimit=options.heroLimit||1;this.heroAuto=options.heroAuto!==false;
  this.fuseReadyAt=[0,0];this.pureF=[0,1].map(t=>pureFaction(this.players[t].deck,(this.heroSlots[t]||[]).map(h=>h.id)));this.cardStats=[{},{}];this._src=null;this.counters=[0,1].map(()=>({troopCards:0,ownDeaths:0,allDeaths:0,tacticSpent:0,controls:0,unitsDeployed:0,fusions:0}));
  this.groups=[];this.notice=[];this.items=[[],[]];this.itemsOn=!!options.items;this.nextItemT=[ITEM_FIRST,ITEM_FIRST];
  /* 洗牌：實戰開局抽牌順序隨機；測試預設不洗牌以保持可重現 */
  if(options.shuffle){for(let k=0;k<8;k++)this.random();this.players.forEach(p=>{const d=[...p.deck];for(let i=d.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[d[i],d[j]]=[d[j],d[i]];}p.hand=d.slice(0,4);p.queue=d.slice(4);});}
  for(let team=0;team<2;team++){
   for(const x of [155,445])this.towers.push(this.entity({name:'外塔',hp:2600,dmg:90,range:175,rate:.95,role:'塔',airHit:true},team,x,team?150:550,{tower:true,r:25}));
   this.towers.push(this.entity({name:'主堡',hp:4000,dmg:110,range:195,rate:.9,role:'堡',airHit:true},team,300,team?60:640,{tower:true,core:true,r:32}));
  }
  this.towers.forEach(t=>{const bm=this.bannerMods[t.team];if(bm&&bm.tower){t.hp=t.max=Math.round(t.max*(1+bm.tower));}});
  this.log('戰鬥開始：守住主堡，掌握雙線。');
 }
 validDeck(d){return Array.isArray(d)&&d.length===8&&new Set(d).size===8&&d.every(id=>CARDS[id])&&d.filter(id=>CARDS[id].tier==='hero').length<=1;}
 random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 entity(c,team,x,y,extra={}){const u=this.entity0(c,team,x,y,extra),m=this.teamMods&&this.teamMods[team],bm=this.bannerMods&&this.bannerMods[team];if(u.buffCast&&!extra.derived)u.castUntil=this.clock+u.buffCast.duration;
  if(bm&&!u.tower&&!extra.derived&&u.type!=='tactic'){if(bm.hp){u.hp=u.max=Math.round(u.hp*(1+bm.hp));}if(bm.dmg&&u.dmg)u.dmg=Math.round(u.dmg*(1+bm.dmg));if(bm.speed&&u.speed)u.speed=Math.round(u.speed*(1+bm.speed));if(bm.rate&&u.rate)u.rate=+(u.rate*(1-bm.rate)).toFixed(3);if(bm.shield){u.shield=bm.shield;u.shieldUntil=this.clock+8;}if(bm.firstHit)u.firstHit=bm.firstHit;if(bm.firstPoison)u.firstPoison=bm.firstPoison;if(bm.spiritHp&&u.faction===6){u.hp=u.max=Math.round(u.hp*(1+bm.spiritHp*this.growth()));}if(bm.lifesteal)u.bannerLs=bm.lifesteal;if(bm.armor)u.armor=Math.min(.5,(u.armor||0)+bm.armor);if(bm.tower&&u.type==='building'){u.hp=u.max=Math.round(u.max*(1+bm.tower));}}if(this.pureF&&!u.tower&&u.type!=='tactic'&&(u.tier==='hero'||u.tier==='elite')&&u.faction===this.pureF[team]){const pb=u.faction===6?PURE_BONUS_SPIRIT:PURE_BONUS;u.hp=u.max=Math.round(u.hp*(1+pb));if(u.dmg)u.dmg=Math.round(u.dmg*(1+pb));}if(m&&!u.tower){let hp=m.hp||1,dm=m.dmg||1;if(u.tier==='hero'&&!extra.derived){hp*=m.heroHp||1;dm*=m.heroDmg||1;if(m.heroSpeed&&u.speed)u.speed=Math.round(u.speed*m.heroSpeed);if(m.heroShield){u.shield=m.heroShield;u.shieldUntil=this.clock+10;}if(m.heroGrant&&this.players){const p=this.players[team];if(p)p.energy=Math.min(10,p.energy+m.heroGrant);}}if(hp!==1){u.hp=u.max=Math.round(u.hp*hp);}if(dm!==1&&u.dmg)u.dmg=Math.round(u.dmg*dm);}return u;}
 entity0(c,team,x,y,extra={}){return {...c,artId:c.artId||c.id,id:++this.id,team,x,y,max:c.hp,hp:c.hp,r:(c.hp>=1700?19:12)+((!extra.derived&&c.size===undefined)?(c.tier==='hero'?3:c.tier==='elite'?2:0):0),cool:.4,walk:0,moving:false,attackAt:-99,hitAt:-99,buffs:{},shield:0,shieldUntil:0,travel:0,spawnCool:c.spawnEvery||0,life:c.type==='building'?c.duration:Infinity,angle:team?Math.PI:0,...extra};}
 log(text){this.logs.unshift({time:this.clock,text});this.logs=this.logs.slice(0,6);}
 effect(type,x,y,team,r=30,extra={}){this.fx.push({type,x,y,team,r,life:.55,max:.55,...extra});}
 all(){return [...this.towers,...this.units].filter(u=>u.hp>0);}
 legal(c,team,x,y){
  if(c.tier==='hero'&&this.units.some(u=>u.team===team&&u.artId===c.id&&u.hp>0))return '這名英雄仍在戰場，陣亡後才能再次部署';
  if(x<25||x>575||y<22||y>678)return '請點擊戰場內';
  const home=(c.type!=='tactic'&&!c.anywhere)||c.homeOnly||c.effect==='mine'; /* 兵種、建築、英雄只能放己方半場；戰術（含援軍）可放全圖，地雷與傳送門限己方半場 */
  if(home&&(team===0?y<382:y>318))return '此卡只能部署於己方半場';
  if((c.type!=='tactic'||c.effect==='portal')&&this.all().some(t=>(t.tower||t.type==='building')&&dist(t,{x,y})<t.r+19))return '請避開現有建築';
  return '';
 }
 /* ---------- 融煉 ---------- */
 noteGroup(c,team,before){
  const made=this.units.slice(before).filter(u=>u.team===team&&u.artId===c.id);if(!made.length)return;
  const g={cardId:c.id,team,t:this.clock,ids:made.map(u=>u.id)};this.groups.push(g);if(FUSE_AUTO)this.tryFuse(g);
 }
 groupUnits(g){return this.units.filter(u=>g.ids.includes(u.id)&&u.hp>0&&!u.dead);}
 /* 這一方能不能用某個配方：暗蝕合靈只有帶著環行者的織律者能用 */
 canRecipe(team,rec){return !rec.dark||this.heroSlots[team].some(s=>s.id==='n_hero');}
 tryFuse(g,force=false){
  if(g.fused||(!force&&this.clock<this.fuseReadyAt[g.team]))return false;
  const rec=FUSIONS.find(f=>(f.a===g.cardId||f.b===g.cardId)&&this.canRecipe(g.team,f));if(!rec)return false;
  const partner=rec.a===g.cardId?rec.b:rec.a,mine=this.groupUnits(g);if(!mine.length)return false;
  const cx=a=>a.reduce((s,u)=>s+u.x,0)/a.length,cy=a=>a.reduce((s,u)=>s+u.y,0)/a.length;
  const other=this.groups.find(h=>h!==g&&!h.fused&&h.team===g.team&&h.cardId===partner&&this.clock-h.t<=FUSE_WINDOW&&this.groupUnits(h).length&&Math.hypot(cx(this.groupUnits(h))-cx(mine),cy(this.groupUnits(h))-cy(mine))<=FUSE_RANGE);
  if(!other)return false;
  return this.doFuse(g,other,rec);
 }
 doFuse(g,other,rec,full=false){
  const mine=this.groupUnits(g),theirs=this.groupUnits(other),all=[...mine,...theirs];if(!mine.length||!theirs.length)return false;
  const x=all.reduce((s,u)=>s+u.x,0)/all.length,y=all.reduce((s,u)=>s+u.y,0)/all.length;
  for(const u of all){u.dead=true;u.hp=0;}this.units=this.units.filter(u=>!u.dead);
  g.fused=other.fused=true;if(!full)this.fuseReadyAt[g.team]=this.clock+FUSE_COOLDOWN*(1-((this.bannerMods[g.team]||{}).fuseCd||0)*this.growth());this.counters[g.team].fusions++;
  this.spawn(summons[rec.into],g.team,x,y,1,{derived:true,src:rec.into}); /* 融煉產物另列一行統計 */
  const nu=this.units.at(-1);if(nu&&!full){nu.hp*=FUSE_WEAK;nu.max*=FUSE_WEAK;nu.dmg*=FUSE_WEAK;nu.name=nu.kin+'合靈';nu.ring=false;nu.size=(nu.size||1)*.8;}
  if(rec.burst){/* 融煉當下的衝擊波：像一張免費的解場戰術 */for(const u of this.all().filter(v=>v.team!==g.team&&!v.tower&&v.type!=='building'&&dist(v,{x,y})<=rec.burst.r+v.r)){this.hit({team:g.team},u,rec.burst.dmg*FUSE_BURST_WEAK,true);if(rec.burst.slow)this.buff(u,'slow',rec.burst.slow);}this.effect('blast',x,y,g.team,rec.burst.r);}
  const nm=this.units.at(-1)?.name||summons[rec.into].name;
  if(full){this.effect('omen',x,y,g.team,150,{life:1.3,max:1.3});this.effect('cast',x,y,g.team,90,{label:'裏律降臨：'+nm,big:true});}else{this.effect('cast',x,y,g.team,70,{label:'融煉：'+nm});this.effect('fusion',x,y,g.team,80,{life:.9,max:.9,seed:Math.floor(x+y)%7});}
  this.log((g.team?'敵方':'我方')+(full?'逆反共振，裏律降臨：':'律靈融煉：')+nm);this.notice.push({team:g.team,text:(full?'裏律降臨：':'融煉：')+nm,kind:'fuse'});
  return true;
 }
 /* 共振：範圍內任意兩組己方律靈都可以被吃掉（以一次部署為一組），最靠近施放點的兩組優先 */
 spiritIds(){return new Set(FUSIONS.flatMap(f=>[f.a,f.b]));}
 resonanceGroups(team,x,y,r){
  const ids=this.spiritIds(),out=[];
  for(const g of this.groups){if(g.fused||g.team!==team||!ids.has(g.cardId))continue;
   const us=this.groupUnits(g);if(!us.length)continue;const d=Math.min(...us.map(u=>dist(u,{x,y})));if(d<=r)out.push({g,d});}
  return out.sort((p,q)=>p.d-q.d).map(o=>o.g);
 }
 /* 場上最靠近的兩組可共振律靈（不看施放點）；只有一組時回傳那一組（n:1）；一組都沒有回傳 null。AI 與提示用 */
 anyResonance(team){
  const ids=this.spiritIds(),gs=this.groups.filter(g=>!g.fused&&g.team===team&&ids.has(g.cardId)&&this.groupUnits(g).length);
  const pos=g=>{const us=this.groupUnits(g);return {x:us.reduce((s,u)=>s+u.x,0)/us.length,y:us.reduce((s,u)=>s+u.y,0)/us.length};};
  let best=null;
  for(let i=0;i<gs.length;i++)for(let k=i+1;k<gs.length;k++){const a=pos(gs[i]),b=pos(gs[k]),d=Math.hypot(a.x-b.x,a.y-b.y);if(d<=300&&(!best||d<best.d))best={d,n:2,x:(a.x+b.x)/2,y:(a.y+b.y)/2,ax:a.x,ay:a.y,bx:b.x,by:b.y};}
  if(!best&&gs.length){const a=pos(gs[0]);best={d:0,n:1,x:a.x,y:a.y,ax:a.x,ay:a.y,bx:a.x,by:a.y};}
  return best;
 }
 /* 牌組有 6 張以上律靈系卡牌＝純牌（第三級旗印）；混牌打逆反共振是禁忌法術，悖靈只能撐 OMEN_TTL 秒 */
 pureSpirit(team){return this.players[team].deck.filter(id=>CARDS[id]&&CARDS[id].faction===6).length>=OMEN_PURE;}
 /* 儀式完成：吃掉施放點範圍內最近的 0～2 組己方律靈，召出悖靈。吃得越多越強（1／1.1／1.2 倍），被吃掉的律靈各把一個小特性帶給悖靈 */
 resolveResonance(f){
  const gs=this.resonanceGroups(f.team,f.x,f.y,f.c.radius).slice(0,2);
  const n=Math.floor(this.random()*(gs.length+1)),eaten=gs.slice(0,n),all=eaten.flatMap(g=>this.groupUnits(g));
  const x=all.length?all.reduce((s,u)=>s+u.x,0)/all.length:f.x,y=all.length?all.reduce((s,u)=>s+u.y,0)/all.length:f.y;
  for(const u of all){u.dead=true;u.hp=0;}this.units=this.units.filter(u=>!u.dead);eaten.forEach(g=>{g.fused=true;});
  this.summonOmen(f.team,x,y,OMEN_MULT[eaten.length],eaten.map(g=>g.cardId));
 }
 summonOmen(team,x,y,mult,traits=[]){
  this.counters[team].fusions++;
  this.spawn(summons.omen,team,x,y,1,{derived:true,src:'omen'});
  const nu=this.units.at(-1);if(nu){const sh=1+((this.bannerMods[team]||{}).spiritHp||0)*this.growth();nu.hp*=OMEN_BASE*mult*sh;nu.max*=OMEN_BASE*mult*sh;nu.dmg*=OMEN_BASE*mult;if(!this.pureSpirit(team))nu.ttl=OMEN_TTL;for(const id of traits)if(OMEN_TRAITS[id])OMEN_TRAITS[id](nu);}
  for(const u of this.all().filter(v=>v.team!==team&&!v.tower&&v.type!=='building'&&dist(v,{x,y})<=OMEN_BURST.r+v.r)){this.hit({team},u,OMEN_BURST.dmg*OMEN_BASE*mult,true);this.buff(u,'slow',OMEN_BURST.slow);}this.effect('blast',x,y,team,OMEN_BURST.r);
  this.effect('omen',x,y,team,150,{life:1.3,max:1.3});this.effect('cast',x,y,team,90,{label:'裏律降臨：悖靈',big:true});
  this.log((team?'敵方':'我方')+'逆反共振，裏律降臨：悖靈');this.notice.push({team,text:'裏律降臨：悖靈',kind:'fuse'});
 }
 /* 每 0.5 秒重新檢查窗口內的律靈（冷卻結束後仍相鄰就會融煉） */
 fuseSweep(){if(FUSE_AUTO)for(const g of this.groups)if(!g.fused&&this.clock-g.t<=FUSE_WINDOW)this.tryFuse(g);this.groups=this.groups.filter(g=>!g.fused&&this.groupUnits(g).length>0);}
 countPlay(team,c){const k=this.counters[team];if(c.type==='tactic'||c.type==='building')k.tacticSpent+=c.cost;if(c.type!=='tactic'){k.unitsDeployed+=c.tier==='hero'?1:(c.n||1);if(c.type==='troop')k.troopCards++;}if(TREANTS.includes(c.id))k.treants=(k.treants||0)+(c.n||1);} /* 樹人類（含援軍戰術喚醒古樹）累計部署，供瑟恩登場條件 */
 /* ---------- 英雄格 ---------- */
 heroStatus(team){
  return this.heroSlots[team].map((sl,idx)=>{
   const H=HEROES[sl.id],k=this.counters[team],card=CARDS[sl.id];
   const progress=Math.min(1,Math.max((k[H.metric]||0)/H.need,H.alt?(k[H.alt.metric]||0)/H.alt.need:0,H.timeNeed?this.clock/H.timeNeed:0)+sl.boost);
   const hero=this.units.find(u=>u.team===team&&u.artId===sl.id&&u.hp>0&&!u.derived);
   const onField=!!hero,cost=0,wait=Math.max(0,sl.nextAt-this.clock);
   return {idx,id:sl.id,name:card.name,progress,onField,cost,wait,cond:H.cond,need:H.need,alt:H.alt?H.alt.need:0,count:k[H.metric]||0,
    ready:progress>=1&&!onField&&wait<=0,skill:H.enter||H.skill,skillDesc:H.desc,pas:H.pas||'',skillWait:0,skillReady:false,ammo:hero&&hero.artId==='f0_30'?{left:(hero.ammoCd||0)>this.clock?0:(hero.ammo??10),max:10,cd:Math.max(0,(hero.ammoCd||0)-this.clock)}:null};
  });
 }
 playHero(team,idx,x,y){
  if(this.state!=='playing')return '對局未進行';
  const st=this.heroStatus(team)[idx];if(!st)return '沒有英雄';
  if(st.onField)return '英雄已在戰場';
  if(st.wait>0)return '英雄重整中';
  if(st.progress<1)return '登場條件尚未達成';
  if(this.heroSlots[team].filter(q=>this.units.some(u=>u.team===team&&u.artId===q.id&&u.hp>0&&!u.derived)).length>=this.heroLimit)return '場上英雄已達上限';
  const c=CARDS[st.id];if(x===undefined){x=300;y=team?110:590;}else{const err=this.legal(c,team,x,y);if(err)return err;} /* 沒指定位置＝從己方主堡前出發 */
  this.stats[team].casts++;this.cstat(team,st.id).casts++;this.heroSlots[team][idx].enteredAt=this.clock;if(this.heroSlots[team][idx].firstAt===undefined)this.heroSlots[team][idx].firstAt=this.clock;this._src=st.id;
  this.spawn(c,team,x,y,1);this.heroSlots[team][idx].skillAt=this.clock+5;this.countPlay(team,c);this.heroEnter(team,st.id,x,y);this._src=null;
  this.log((team?'敵方':'我方')+'英雄登場：'+c.name);this.notice.push({team,kind:'heroenter',art:st.id,text:c.name+' 自主堡出發'});return '';
 }
 /* 結算用：每張牌（含英雄）的打出次數、花費、造成傷害、塔傷、擊殺 */
 cstat(team,key){const m=this.cardStats[team];return m[key]||(m[key]={casts:0,spent:0,dmg:0,tower:0,kills:0,taken:0,units:0,life:0,deaths:0});}
 growth(){return .4+.6*Math.min(1,this.clock/120);} /* 界律旗印：隨時間成長，開局 40%，120 秒後滿檔 */
 baseRegen(){return this.overtime||this.remaining<=60||this.clock>=REGEN_FAST_AT?REGEN_FAST:this.clock<REGEN_MID_AT?REGEN_SLOW:REGEN_MID;}
 /* 登場一次性效果與護衛（取代原本的手動主動技） */
 heroEnter(team,id,x,y){
  const H=HEROES[id],hero=this.units.find(u=>u.team===team&&u.artId===id&&u.hp>0&&!u.derived);if(!H||!hero)return;
  const e=H.escort;
  if(e){
   const b=CARDS[e.from],def=Object.assign({},b,{artId:b.artId||b.id,hp:e.hpAbs||Math.round(b.hp*(e.hp||1)),dmg:Math.round(b.dmg*e.dmg)});
   this.spawn(def,team,hero.x,hero.y+(team?32:-32),e.n,{derived:true,escort:true});
  }
  const friends=this.units.filter(u=>u.team===team&&u.hp>0&&u.type!=='building'),foes=this.units.filter(u=>u.team!==team&&u.hp>0&&u.type!=='building'&&!u.tower);
  if(id==='f0_4')friends.forEach(u=>{u.shield=Math.max(u.shield||0,250);u.shieldUntil=this.clock+8;});
  else if(id==='f1_5')friends.forEach(u=>this.buff(u,'morale',6));
  else if(id==='f1_30')friends.forEach(u=>this.buff(u,'steal',6));
  else if(id==='f2_30')friends.forEach(u=>this.buff(u,'deathward',6));
  else if(id==='f4_7')foes.filter(u=>!u.flying).forEach(u=>this.buff(u,'root',2));
  else if(id==='f4_30')friends.forEach(u=>this.restore(u,u.max*.15));
  const es=this.units.filter(u=>u.escort&&u.team===team&&!u.escortOf);es.forEach(u=>{u.escortOf=hero.id;});
  if(id==='f0_4')es.forEach(u=>{u.charge=true;u.onceCharge=true;u.chargeArea=60;});
  if(id==='f1_30'&&es[0])hero.linkId=es[0].id;
  if(id==='f3_30')this.napalm(team,hero,2,30,5);
  if(id==='f3_4'){(this.bldBuff||(this.bldBuff={}))[team]={heroId:hero.id,endAt:Infinity};}
  if(H.enter)this.effect('cast',hero.x,hero.y,team,90,{label:H.enter,big:true});
 }

 /* ---------- 英雄被動與狀態（登場批次 B–E） ---------- */
 heroMul(a,b){
  let m=1;
  if(a.tier==='hero'&&!a.derived){
   const id=a.artId;
   if(id==='f1_5'){const f=Math.max(0,(.35-a.hp/a.max)/.35);m*=(1+.06*(a.rage||0))*(1+.6*f);}
   else if(id==='f3_4')m*=1+Math.min(.6,.08*(a.auraN||0));
   else if(id==='f1_30'&&a.linkId&&this.units.some(u=>u.id===a.linkId&&u.hp>0))m*=1.2;
   else if(id==='f5_30'&&a.huntId===b.id)m*=1.5;
  }
  if(this.has(a,'bnet'))m*=1.3;
  if(this.has(a,'para'))m*=.8;
  if(a.necro&&a.necro.until>this.clock)m*=1-a.necro.n/100;
  return m;
 }
 heroSpd(a){
  let s=1;
  if(a.tier==='hero'&&!a.derived&&a.artId==='f1_5')s*=1+.4*Math.max(0,(.35-a.hp/a.max)/.35);
  if(a.necro&&a.necro.until>this.clock)s/=1-a.necro.n/100;
  return s;
 }
 heroRed(b){
  let r=0;
  if(this.has(b,'bw'))r+=.2;
  if(b.tier==='hero'&&!b.derived){
   if(b.artId==='f1_5')r+=.03*(b.rage||0)+.25*Math.max(0,(.35-b.hp/b.max)/.35);
   else if(b.artId==='f3_4'){r=Math.max(0,r-.2);r+=Math.min(.25,.03*(b.auraN||0));}
  }
  return r;
 }
 trailMul(a){
  const tr=this.trails&&this.trails[a.team];if(!tr||!tr.length||a.tower)return 1;
  for(const p of tr)if(p.until>this.clock&&Math.abs(p.x-a.x)<32&&Math.abs(p.y-a.y)<32)return 1.15;
  return 1;
 }
 applyPoison(src,b,n){
  if(!b||b.hp<=0||b.tower||b.type==='building')return;
  const old=b.poison&&b.poison.until>this.clock?b.poison.n:0;
  b.poison={n:Math.min(5,old+n),until:this.clock+4,team:src.team,src:src};
 }
 applyPara(src,b){
  if(!b||b.hp<=0||b.tower||b.type==='building')return;
  this.buff(b,'para',4);b.paraTeam=src.team;
 }
 napalm(team,src,count,dps,dur){
  const foes=this.units.filter(u=>u.team!==team&&u.hp>0&&u.type!=='building'&&!u.flying),spots=[];
  const pool=foes.slice();
  for(let i=0;i<count;i++){
   if(pool.length){const k=Math.floor(this.random()*pool.length);spots.push({x:pool[k].x,y:pool[k].y});pool.splice(k,1);}
   else spots.push({x:this.random()<.5?155:445,y:team?470:230});
  }
  this.burns=this.burns||[];
  for(const s of spots){this.burns.push({x:s.x,y:s.y,r:70,until:this.clock+dur,dps,team,tick:0});this.effect('blast',s.x,s.y,team,70,{big:true,element:'火'});}
  this.effect('cast',src.x,src.y,team,60,{label:'燃燒轟炸',big:true,element:'火'});
 }
 heroDeathHooks(u){
  for(const h of this.units){
   if(h.hp<=0||h.dead||h.tier!=='hero'||h.derived)continue;
   if(h.team===u.team){
    if(h.artId==='f1_5'&&dist(h,u)<200){h.rage=Math.min(6,(h.rage||0)+1);h.rageAt=this.clock;}
    if(h.artId==='f2_7'&&dist(h,u)<220){h.necroN=Math.min(10,(h.necroN||0)+1);h.necroAt=this.clock;}
   }else if(h.artId==='f2_7'&&(!u.derived||u.cardSummon)&&dist(h,u)<200){
    h.caught=(h.caught||0)+1;
    if(h.caught>=4){
     h.caught=0;
     const def=Object.assign({},summons.skel,{name:'收服的殘軀',hp:Math.min(900,Math.max(130,Math.round(u.max*.5))),dmg:Math.round(Math.min(120,Math.max(38,u.dmg*.6)))});
     this.spawn(def,h.team,u.x,u.y,1,{derived:true,ownerId:h.id,captured:true});this.effect('cast',u.x,u.y,h.team,50,{label:'收服',big:true,element:'暗'});
    }
   }
  }
 }
 heroTick(a,dt){
  const id=a.artId,H=HEROES[id],team=a.team,dir=team?1:-1;this._src=id;
  /* 定時召喚（莫爾骷髏、布倫砲車、瑟恩小樹人） */
  if(H.summon){
   if(a.sumAt===undefined)a.sumAt=this.clock+H.summon.every;
   if(this.clock>=a.sumAt){
    a.sumAt=this.clock+H.summon.every;
    if(this.units.filter(u=>u.ownerId===a.id&&u.hp>0).length<H.summon.cap){
     let def;
     if(id==='f2_7')def=Object.assign({},summons.skel,{name:'墓穴骷髏'});
     else if(id==='f3_30'){const b=CARDS.f3_6;def=Object.assign({},b,{artId:b.artId||b.id,name:'砲車',hp:Math.round(b.hp*.5),dmg:Math.round(b.dmg*.5),threat:false,tier:'standard'});}
     else if(id==='f4_7')def=Object.assign({},summons.treant,{name:'小樹人',hp:400,dmg:30,zone:{r:80,slow:true},treantAura:{r:80,pct:.005,floor:8,heal:.005},ttl:45,size:.8});
     if(def){this.spawn(def,team,a.x+(this.random()-.5)*40,a.y+dir*-28,1,{derived:true,ownerId:a.id});this.effect('cast',a.x,a.y+dir*-28,team,40,{label:def.name});}
    }
   }
  }
  if(id==='f0_4'&&a.moving){const last=a.lastTrail;if(!last||Math.hypot(a.x-last.x,a.y-last.y)>=20){a.lastTrail={x:a.x,y:a.y};this.trails=this.trails||[[],[]];this.trails[team].push({x:a.x,y:a.y,until:this.clock+6});}}
  if(id==='f1_5'&&a.rage&&this.clock-(a.rageAt||0)>10){a.rage--;a.rageAt=this.clock-8;}
  if(id==='f2_7'){
   if(a.necroN&&this.clock-(a.necroAt||0)>30){a.necroN--;a.necroAt=this.clock-27;}
   a.necroTick=(a.necroTick||0)-dt;
   if(a.necroN&&a.necroTick<=0){a.necroTick=.5;for(const u of this.units)if(u.team!==team&&u.hp>0&&!u.tower&&u.type!=='building'&&dist(a,u)<220+u.r)u.necro={n:a.necroN,until:this.clock+1};}
  }
  if(id==='f3_4'){
   a.auraTick=(a.auraTick||0)-dt;
   if(a.auraTick<=0){a.auraTick=.5;let n=0;for(const u of this.units)if(u.team===team&&u.hp>0&&u!==a&&u.type!=='building'&&dist(a,u)<180+u.r){this.buff(u,'bw',.8);u.bwSrc=a;n++;}a.auraN=n;}
  }
  if(id==='f5_30'){
   a.huntTick=(a.huntTick||0)-dt;
   if(a.huntTick<=0){a.huntTick=.5;let best=null;for(const u of this.units)if(u.team!==team&&u.hp>0&&!u.tower&&u.type!=='building'&&dist(a,u)<350){const c=u.cost||0;if(!best||c>(best.cost||0)||(c===(best.cost||0)&&dist(a,u)<dist(a,best)))best=u;}a.huntId=best?best.id:0;}
  }
  this._src=null;
 }
 statusStep(dt){
  /* 毒（瑟葵）：持續傷害，60% 轉成友軍回血 */
  for(const u of this.units){
   if(u.hp<=0||u.dead)continue;
   if(u.poison&&u.poison.until>this.clock){
    const dmg=12*u.poison.n*dt,src=u.poison.src;
    this.hit({team:u.poison.team},u,dmg,true);
    if(src&&src.hp>0){
     const al=this.units.filter(v=>v.team===src.team&&v.hp>0&&v.hp<v.max&&v.type!=='building'&&dist(v,src)<160).sort((p,q)=>p.hp/p.max-q.hp/q.max).slice(0,2);
     al.forEach(v=>this.restore(v,dmg*.6/al.length,true));
    }
   }
   if(this.has(u,'para'))this.hit({team:u.paraTeam},u,15*dt,true);
   if(u.bnet&&u.bnet.until>this.clock&&u.hp>0)this.restore(u,u.bnet.debt*dt/5,true);
  }
  /* 燃燒彈（布倫） */
  if(this.burns&&this.burns.length){
   for(const f of this.burns){
    f.tick-=dt;if(f.tick>0)continue;f.tick=.5;
    for(const u of this.all())if(u.team!==f.team&&u.hp>0&&!u.flying&&dist(u,f)<f.r+u.r)this.hit({team:f.team},u,f.dps*.5,true);
    this.effect('blast',f.x+(this.random()-.5)*30,f.y+(this.random()-.5)*30,f.team,26,{element:'火'});
   }
   this.burns=this.burns.filter(f=>f.until>this.clock);
  }
  if(this.trails)this.trails.forEach((tr,i)=>{this.trails[i]=tr.filter(p=>p.until>this.clock);});
  /* 布洛克：登場時強化全部我方建築，直到他倒下後 5 秒 */
  if(this.bldBuff)for(const k of Object.keys(this.bldBuff)){
   const B=this.bldBuff[k],team=+k,hero=this.units.find(u=>u.id===B.heroId&&u.hp>0);
   if(!hero&&B.endAt===Infinity)B.endAt=this.clock+5;
   const exp=this.clock>=B.endAt;
   for(const u of this.units)if(u.team===team&&u.type==='building'&&u.hp>0){
    if(!exp&&!u.bb){u.bb=true;u.max*=1.25;u.hp*=1.25;if(u.dmg)u.dmg*=1.25;}
    else if(exp&&u.bb){u.bb=false;u.max/=1.25;u.hp=Math.min(u.hp,u.max);if(u.dmg)u.dmg/=1.25;}
   }
   if(exp)delete this.bldBuff[k];
  }
 }
 /* 英雄主動技已取消：改成登場時一次性效果（heroEnter） */
 castSkill(){return '英雄沒有主動技';}
 /* 環行者：持有的資源每 1 點，己方全軍傷害 +1%（上限 +10%） */
 ringBonus(team){return this.units.some(u=>u.team===team&&u.ability==='ringwalk'&&u.hp>0)?1+Math.min(.1,.01*Math.max(0,this.players[team].energy)):1;}
 /* 補牌：從整副牌裡、目前不在手上的牌隨機抽一張（剛打出的牌也算候選，下一張無法預測） */
 /* 補牌：循環佇列。打出（或換掉）的牌排到隊尾，下一張取隊首；其他牌輪過一輪之前不會再抽到 */
 cycleCard(p,slot){const out=p.hand[slot],inn=p.queue.length?p.queue.shift():null;if(!inn)return out;p.hand[slot]=inn;p.queue.push(out);return inn;}
 drawCard(p){const pool=p.deck.filter(id=>!p.hand.includes(id));return pool[Math.floor(this.random()*pool.length)];}
 /* 追趕：外塔被拆得越多，資源回復越快（每座 +25%），讓落後的一方保有翻盤空間 */
 catchUp(team){const lost=this.towers.filter(t=>t.team===team&&!t.core&&t.hp<=0).length;return 1+.25*lost;}
 /* ---------- 寶物 ---------- */
 behindBy(team){const h=t=>this.towers.filter(x=>x.team===t).reduce((s,x)=>s+Math.max(0,x.hp),0);return h(1-team)-h(team);}
 grantItem(team){
  const it=ITEMS[Math.floor(this.random()*ITEMS.length)],list=this.items[team];
  list.push({id:it.id,gotAt:this.clock});while(list.length>ITEM_MAX)list.shift();
  if(team===0)this.log('獲得寶物：'+it.name);return it;
 }
 useItem(team,slot){
  if(this.state!=='playing')return '對局未進行';
  const list=this.items[team],ent=list[slot];if(!ent)return '沒有寶物';
  const p=this.players[team],friends=this.units.filter(u=>u.team===team&&u.hp>0&&u.type!=='building'),myTowers=this.towers.filter(t=>t.team===team&&t.hp>0);
  const it=ent.id;
  if(it==='brass')p.energy=Math.min(10,p.energy+2);
  else if(it==='hourglass'){p.regenUntil=this.clock+10;p.regenMul=1.4;}
  else if(it==='anvil'){p.towerGuard=this.clock+8;myTowers.forEach(t=>{t.shield=Math.max(t.shield||0,500);t.shieldUntil=this.clock+8;});}
  else if(it==='drum')friends.forEach(u=>this.buff(u,'aura',8));
  else if(it==='seed')friends.forEach(u=>this.restore(u,u.max*.15));
  else if(it==='horn')friends.forEach(u=>this.buff(u,'power',6));
  else if(it==='chalice'){myTowers.forEach(t=>this.restore(t,t.max*.04));p.towerHot={until:this.clock+8,pct:.015};}
  else if(it==='tome'){const pool=p.deck.filter(id=>CARDS[id]&&CARDS[id].type==='troop'&&CARDS[id].tier!=='hero');if(!pool.length)return '牌組裡沒有可部署的兵牌';const c=CARDS[pool[Math.floor(this.random()*pool.length)]],thr=this.units.filter(u=>u.team!==team&&u.hp>0&&u.type!=='building'&&(team?u.y<330:u.y>370)),x=thr[0]?clamp(thr[0].x,60,540):(this.random()<.5?155:445),y=team?230:470,before=this.units.length;this.spawn(c,team,x,y,c.n);this.noteGroup(c,team,before);this.countPlay(team,c);this.effect('cast',x,y,team,45,{label:c.name});}
  else if(it==='tusk'){const t=this.towers.filter(t=>t.team!==team&&!t.core&&t.hp>0).sort((a,b)=>b.hp-a.hp)[0]||this.towers.find(t=>t.team!==team&&t.hp>0);if(!t)return '沒有目標';this.hit({team},t,t.max*.06);this.effect('blast',t.x,t.y,team,40);}
  else if(it==='knell')this.players[1-team].energy=Math.max(0,this.players[1-team].energy-2);
  else if(it==='moth'){const t=myTowers.sort((a,b)=>a.hp/a.max-b.hp/b.max)[0];if(t)this.restore(t,t.max*.2);}
  else if(it==='crown')this.heroSlots[team].forEach(q=>{q.boost=Math.min(1,q.boost+.5);});
  else if(it==='foresight'){if(p.bank)return '已在儲蓄中';p.bank={amount:p.energy,until:this.clock+5};p.energy=0;}
  list.splice(slot,1);this.effect('cast',300,team?150:550,team,60,{label:ITEMS.find(x=>x.id===it).name});this.notice.push({team,kind:'item',item:it});return '';
 }
 aiExtras(team){
  const p=this.players[team];
  // 寶物：持有 4 秒後使用（資源類看時機）
  const items=this.items[team];
  for(let i=0;i<items.length;i++){const e=items[i];if(this.clock-e.gotAt<4)continue;
   if(e.id==='foresight'&&p.energy<9)continue;if(e.id==='brass'&&p.energy>8)continue;if(e.id==='tome'&&p.energy>=9)continue;
   if(this.useItem(team,i)==='')break;}
  // 英雄：條件達成且資源足夠就登場；在場時敵軍靠近就放技能
  const st=this.heroStatus(team);
  for(const h of st){
   /* 英雄現在自動從主堡出發，AI 不需要處理 */
  }
 }
 /* 換牌：花 1 點資源，把手中一張牌放到牌序末端並抽下一張；3 秒冷卻。成功回傳 undefined，失敗回傳原因 */
 swap(team,slot){
  if(this.state!=='playing')return '開戰後才能換牌';
  const p=this.players[team];if(!p||slot<0||slot>=p.hand.length)return '無效的牌位';
  if((p.swapAt||0)>this.clock)return '換牌冷卻中';
  if(p.energy+1e-6<SWAP_COST)return '資源不足，無法換牌';
  if(!p.queue.length)return '沒有可換的牌';
  this.cycleCard(p,slot);p.energy-=SWAP_COST;p.swapAt=this.clock+SWAP_COOLDOWN;this.stats[team].spent+=SWAP_COST;
  return undefined;
 }
 play(team,slot,x,y){
  if(this.state!=='playing')return '對局未進行';
  const p=this.players[team],id=p.hand[slot],c=CARDS[id];if(!c)return '請先選卡';
  const err=this.legal(c,team,x,y);if(err)return err;
  if(p.energy+1e-6<c.cost)return '資源不足，等待回復';
  p.energy-=c.cost;this.stats[team].spent+=c.cost;this.stats[team].casts++;{const cs=this.cstat(team,c.id);cs.casts++;cs.spent+=c.cost;}this._src=c.id;this.countPlay(team,c);this.cycleCard(p,slot);
  if(c.type==='tactic'){p.resonance=Math.min(12,p.resonance+c.cost);this.cast(c,team,x,y);}else{const before=this.units.length;this.spawn(c,team,x,y,c.n);this.noteGroup(c,team,before);if(c.zone&&c.zone.burst){const z=c.zone;for(const u of this.all().filter(v=>v.team!==team&&!v.tower&&v.type!=='building'&&dist(v,{x,y})<=z.r+v.r))this.hit({team},u,z.burst,true);this.effect('blast',x,y,team,z.r);}}
  this._src=null;this.log((team?'敵方':'我方')+'施放 '+c.name);return '';
 }
  spawn(c,team,x,y,n=1,extra={}){
  if(!extra.src)extra={...extra,src:this._src||c.id};
  if(c.tier==='hero'&&this.units.some(u=>u.team===team&&u.artId===c.id&&u.hp>0))return;
  for(let i=0;i<(c.tier==='hero'?1:n);i++){
   const angle=i*2.4,r=n>1?16+Math.floor(i/3)*12:0;
   const u=this.entity(c,team,clamp(x+Math.cos(angle)*r,28,572),clamp(y+Math.sin(angle)*r,25,675),extra);
   if(c.type==='building')u.r=22;
   u.bornAt=this.clock;if(c.type!=='building'&&u.src)this.cstat(team,u.src).units++;
   this.units.push(u);
  }
  this.effect('spawn',x,y,team,40);
  if(c.companion)this.spawn(summons.hawk,team,x+22,y,1,{derived:true});
 }
 summon(kind,team,x,y,n=1,extra={}){this.spawn(summons[kind],team,x,y,n,{derived:true,...extra});}
 buff(u,key,duration){if((key==='slow'||key==='root'||key==='bind')&&!u.tower&&u.type!=='building'&&this.counters&&!this.has(u,key))this.counters[1-u.team].controls++;u.buffs[key]=Math.max(u.buffs[key]||0,this.clock+duration);}
 has(u,key){return (u.buffs[key]||0)>this.clock;}
 cast(c,team,x,y){
  if(c.effect==='resonate'){this.effect('cast',x,y,team,c.radius,{label:'禁忌召喚'});this.effect('omen',x,y,team,c.radius,{life:1,max:1});this.fields.push({c,team,x,y,age:0,tick:0,duration:1});return;}
  this.effect('cast',x,y,team,c.radius,{label:c.name,element:c.element});
  {const st=TFX_STYLE[c.effect];if(st)this.effect('tfx',x,y,team,c.radius,{style:st[0],col:TFX_COL[c.element]||'#ffe3ad',el:c.element,dir:team?1:-1,life:st[1]||(st[0]==='shell'?(c.delay||1):c.duration||1.5),max:st[1]||(st[0]==='shell'?(c.delay||1):c.duration||1.5)});}
  if(c.effect==='calamity'){const pl=this.players[team];pl.calamity=(pl.calamity||0)+1;const second=pl.calamity%2===0;if(second)this.notice.push({team,text:'破滅法則疊加：結束時凝成暗蝕合靈',kind:'fuse'});this.effect('calfx',x,y,team,110,{life:2.4,max:2.4}); /* 破滅法則：蝕根靈＋闇幕靈同時降下，持續時間與傷害 ×0.8 */
   for(const [id,dx] of [['n_rot',-34],['n_dark',34]]){const b=CARDS[id],z={...b.zone};if(z.dot)z.dot*=.8;if(z.burst)z.burst*=.8;
    this.spawn({...b,zone:z,duration:b.duration*.8},team,x+dx,y,1);
    if(id==='n_dark'&&second){const tu=this.units.at(-1);if(tu)tu.fuseOnEnd=true;}
    if(z.burst){for(const u of this.all().filter(v=>v.team!==team&&!v.tower&&v.type!=='building'&&dist(v,{x:x+dx,y})<=z.r+v.r))this.hit({team},u,z.burst,true);this.effect('blast',x+dx,y,team,z.r);}}
   return;}
  if(c.effect==='proj'){this.effect('projfx',x,y,team,90,{life:1.4,max:1.4}); /* 英靈投影：召喚大地、焰嵐、極光合靈各 1 隻（生命、傷害 ×0.25；合靈基準再乘 FUSE_WEAK） */
   for(let k=0;k<3;k++){const kind=['fuse_earth','fuse_storm','fuse_aurora'][k];this.spawn(summons[kind],team,x+(k-1)*26,y+(team?-8:8)*Math.abs(k-1),1,{derived:true,cardSummon:true});const nu=this.units.at(-1);if(nu){const m=.25*FUSE_WEAK;nu.hp*=m;nu.max*=m;nu.dmg*=m;nu.name='投影'+(nu.kin||'')+'合靈';nu.size=(nu.size||1)*.8;}}
   return;}
  if(c.effect==='portal'){this.spawn({name:c.name,artId:'x_portal',type:'building',hp:800,dmg:0,range:0,speed:0,rate:1,duration:12,portal:true,portalWave:0,portalAt:this.clock,role:'門',faction:4},team,x,y);this.portalStep(this.units.at(-1));return;}
  if(['bomb','summon'].includes(c.effect)){this.fields.push({c,team,x,y,age:0,tick:0,duration:c.delay||1});return;}
  if(['fire','curse','heal','barrage','mine'].includes(c.effect)){this.fields.push({c,team,x,y,age:0,tick:0,duration:c.duration});return;}
  let targets=this.all().filter(u=>dist(u,{x,y})<=c.radius+u.r);
  if(c.effect==='bolt'){
   targets=targets.filter(u=>u.team!==team&&!u.tower&&u.type!=='building').sort((a,b)=>b.hp-a.hp);
   if(targets[0])this.hit({team},targets[0],c.damage,true);return;
  }
  const bindRec=c.bind?{n:0}:null;
  for(const u of targets){
   if(c.bind){if(u.team!==team&&!u.tower&&u.type!=='building'){this.buff(u,'bind',c.duration);u.bindTeam=team;u.bindRec=bindRec;u.bindSrc=c.id;}continue;} /* 靈魂禁錮：近乎定身；期間陣亡的敵軍化為己方骷髏 */
   if(['root','slow'].includes(c.effect)){if(u.team!==team&&!u.tower&&u.type!=='building'){this.buff(u,c.effect,c.duration);if(c.dot)this.hit({team},u,c.dot,true);if(c.poison&&u.hp>0){const old=u.poison&&u.poison.until>this.clock?u.poison.n:0;u.poison={n:Math.min(5,Math.max(old,c.poison.n)),until:this.clock+c.poison.secs,team,src:null};}}continue;}
   if(u.team!==team||u.tower||u.type==='building')continue;
   if(c.effect==='shield'){u.shield=Math.max(u.shield,280);u.shieldUntil=this.clock+c.duration;}
   else {if(c.effect==='sacrifice')u.hp=Math.max(1,u.hp-u.max*.22);this.buff(u,c.effect,c.duration);}
  }
 }
 hitT(a,b,amount){this._true=!!a.trueDmg;this.hit(a,b,amount);this._true=false;}
 hit(a,b,amount,spell=false){
  if(!b||b.hp<=0||b.totem)return;
  if(b.deathAt&&this.clock<b.deathAt)return; /* 對抗死亡的延後期間不受傷 */
  if(spell&&(b.tower||b.type==='building'))amount*=b.tower?.32:.8;
  let armor=this._true?0:Math.max(b.ability==='plating'&&b.hp>b.max*.5?.35:b.armor||0,this.has(b,'armor')?.35:0,this.has(b,'ward')?.2:0);
  amount*=1-armor;if(this.has(b,'rush'))amount*=1.25;if(b.tower&&this.players&&(this.players[b.team].towerGuard||0)>this.clock)amount*=.5;
  amount*=1-Math.min(.8,this.heroRed(b));
  if(this.has(b,'bw')&&b.bwSrc&&b.bwSrc.hp>0&&b.bwSrc!==b&&!b.tower){const share=amount*.3;b.bwSrc.hp-=share*(1-Math.min(.8,this.heroRed(b.bwSrc)));amount-=share;b.bwSrc.hitAt=this.clock;if(b.bwSrc.hp<=0)b.bwSrc.killer=a.team;} /* 布洛克：替光環內友軍分擔 30% */
  if(b.linkId){const bt=this.units.find(u=>u.id===b.linkId&&u.hp>0);if(bt){const share=amount*.4;bt.hp-=share;amount-=share;bt.hitAt=this.clock;if(bt.hp<=0)bt.killer=a.team;}} /* 奈爾：黑甲屠夫替他承受 40% */
  if(b.src&&!b.tower&&b.type!=='building'&&b.team!==undefined)this.cstat(b.team,b.src).taken+=amount; /* 承受傷害：減傷後、護盾前 */
  if(b.shieldUntil>this.clock){const block=Math.min(amount,b.shield);b.shield-=block;amount-=block;}
  if(b.bloodUntil>this.clock){const block=Math.min(amount,b.bloodShield||0);b.bloodShield-=block;amount-=block;}
  if(!b.tower&&b.type!=='building'&&!b.guardShare){
   const guard=this.units.filter(u=>u.guardShare&&u.team===b.team&&u.hp>0&&u.guardTarget===b.id&&dist(u,b)<(u.guardRange||85)).sort((u,v)=>u.id-v.id)[0];
   if(guard){const share=Math.min(amount*guard.guardShare,guard.hp);guard.hp-=share;amount-=share;guard.hitAt=this.clock;if(guard.hp<=0)guard.killer=a.team;}
  }
  if(b.tower&&a.team!==b.team)this.stats[a.team].towerDamage+=Math.min(b.hp,amount);
  const actual=Math.min(b.hp,amount);b.hp-=amount;if(b.hp<=0)b.killer=a.team;
  if(a&&a.team!==undefined&&a.team!==b.team&&(a.src||(a.c&&a.c.id))){const cs=this.cstat(a.team,a.src||a.c.id);if(b.tower||b.type==='building')cs.tower+=actual;else cs.dmg+=actual;if(b.hp<=0&&!b.cred){b.cred=1;cs.kills++;}}
  if(b.hp<=0&&this.has(b,'deathward')&&!b.tower&&b.type!=='building'&&!b.deathAt){b.hp=1;b.deathAt=this.clock+2;b.deathKiller=a.team;delete b.buffs.deathward;this.effect('deathward',b.x,b.y,b.team,46,{life:.9,max:.9});}
  if(a.lifesteal&&a.hp>0&&!spell&&!b.tower&&b.type!=='building'&&a.team!==b.team)this.restore(a,actual*a.lifesteal);
  if(a.bannerLs&&a.hp>0&&!spell&&!b.tower&&b.type!=='building'&&a.team!==b.team)this.restore(a,actual*a.bannerLs,true);
  if(amount>0){b.hitAt=this.clock;const dx=b.x-(a.x??b.x),dy=b.y-(a.y??b.y),n=Math.hypot(dx,dy)||1;b.hitDX=dx/n;b.hitDY=dy/n;if(this.clock-(b.lastSpark??-99)>.09){b.lastSpark=this.clock;this.effect('impact',b.x,b.y,b.team,amount>=180?24:12,{element:a.element||a.c?.element||'物理',life:.25,max:.25});}}
 }
 fieldsStep(dt){
  for(const f of this.fields){
   const c=f.c;f.age+=dt;f.tick-=dt;
   if(c.effect==='resonate'){for(const u of this.units)if(u.hp>0&&!u.tower&&u.type!=='building'&&dist(u,f)<=c.radius+u.r)u.buffs.stasis=this.clock+.2;if(f.age<f.duration)continue;this.resolveResonance(f);f.done=true;continue;}
   if(['bomb','summon'].includes(c.effect)){
    if(f.age<f.duration)continue;
    if(c.squad){const dir=f.team?1:-1;c.squad.forEach((pt,k)=>{const b=CARDS[pt.from],sc=pt.scale||1,def=Object.assign({},b,{artId:b.artId||b.id,hp:Math.round(b.hp*sc),dmg:Math.round(b.dmg*sc)});const py=f.y+dir*(pt.row!==undefined?pt.row:(k?-1:1))*18;this.spawn(def,f.team,f.x,py,pt.count||b.n,{derived:true,cardSummon:true,src:c.id});this.effect('spawn',f.x,py,f.team,48);});this.effect('cast',f.x,f.y,f.team,c.radius+15,{element:c.element,label:'援軍抵達'});}
    else if(c.effect==='summon'){this._src=c.id;this.summon(c.summon,f.team,f.x,f.y,c.count,{cardSummon:true});this._src=null;} /* 援軍戰術召喚物：陣亡要算進英雄的陣亡計數 */
    else {this.all().filter(u=>u.team!==f.team&&dist(u,f)<=c.radius+u.r).forEach(u=>this.hit(f,u,c.damage,true));this.effect('blast',f.x,f.y,f.team,c.radius);this.effect('tfx',f.x,f.y,f.team,c.radius,{style:'shock',col:TFX_COL[c.element]||'#ffe3ad',el:c.element,life:.8,max:.8});}
    f.done=true;continue;
   }
   if(c.effect==='mine'){
    if(f.age>.7&&this.units.some(u=>u.team!==f.team&&!u.flying&&u.hp>0&&dist(u,f)<c.radius)){
     this.all().filter(u=>u.team!==f.team&&!u.flying&&dist(u,f)<c.radius+u.r).forEach(u=>this.hit(f,u,c.damage,true));
     this.effect('blast',f.x,f.y,f.team,c.radius);this.effect('tfx',f.x,f.y,f.team,c.radius,{style:'shock',col:TFX_COL[c.element]||'#ffe3ad',el:c.element,life:.8,max:.8});f.done=true;
    }
   }else if(f.tick<=0){
    const tick=c.effect==='barrage'?1:.5;f.tick+=tick;
    for(const u of this.all().filter(u=>dist(u,f)<c.radius+u.r)){
     if(c.effect==='heal'){if(u.team===f.team&&!u.tower)this.restore(u,c.heal*tick);}
     else if(u.team!==f.team){this.hit(f,u,c.damage*(c.effect==='barrage'?1:tick),true);if(c.effect==='curse')this.buff(u,'curse',1);}
    }
    if(c.effect==='barrage'){const bx=f.x+(this.random()-.5)*c.radius,by=f.y+(this.random()-.5)*c.radius*.8;this.effect('blast',bx,by,f.team,c.radius*.5);this.effect('tfx',bx,by,f.team,c.radius*.5,{style:'shock',col:TFX_COL[c.element]||'#ffe3ad',el:c.element,life:.55,max:.55});}
   }
   if(f.age>=f.duration)f.done=true;
  }
  this.fields=this.fields.filter(f=>!f.done);
 }
 canTarget(a,b){return !b.totem&&b.team!==a.team&&b.hp>0&&(!b.flying||a.airHit)&&(!a.siege||b.tower||b.type==='building');}
 attack(a,b,extra=false){
  let amount=a.dmg*this.ringBonus(a.team)*(this.has(a,'power')?1.3:1)*(this.has(a,'sacrifice')?1.55:1)*(this.has(a,'weak')?.65:1);
  if(a.antiLarge&&b.max>=1200)amount*=a.antiLarge;
  amount*=this.heroMul(a,b);
  let fp=0;if(!a.firstUsed&&(a.firstHit||a.firstPoison)){a.firstUsed=true;if(a.firstHit){amount*=1+a.firstHit;this.effect('cast',a.x,a.y,a.team,26,{label:'先手',element:'物理'});}fp=a.firstPoison||0;}
  let weak=false;
  if(a.artId==='f0_30'&&!a.derived){if((a.ammoCd||0)>this.clock){amount*=.4;weak=true;}else{a.ammo=(a.ammo??10)-1;if(a.ammo<=0){a.ammoCd=this.clock+15;a.ammo=10;}}} /* 奧倫：強力彈藥 10 發，打完冷卻 15 秒，期間只能用普通彈藥 */
  const charged=!!(a.charge&&a.travel>=90);
  if(charged){amount*=1.8;a.travel=0;this.effect('charge',a.x,a.y,a.team,36);if(a.onceCharge)a.charge=false;}
  const kind=a.attackKind||(a.range>60?'arrow':'melee');
  const duration=kind==='melee'?.14:kind==='bullet'?.065:kind==='flame'?.12:kind==='shell'||kind==='stone'?Math.max(.35,dist(a,b)/270):Math.max(.12,dist(a,b)/(kind==='magic'?330:500));
  const dx=b.x-a.x,dy=b.y-a.y,n=Math.hypot(dx,dy)||1;
  a.attackAt=this.clock;a.attackDX=dx/n;a.attackDY=dy/n;a.attackDuration=duration;
  this.projectiles.push({source:a,target:b,kind,amount,charged,weak,extra,fp,team:a.team,x:a.x,y:a.y,tx:b.x,ty:b.y,age:0,duration,element:a.element||'物理'});
  if(kind==='bullet')this.effect('muzzle',a.x,a.y,a.team,14,{dx:dx/n,dy:dy/n,life:.12,max:.12});
  const haste=Math.max(this.has(a,'haste')?1.4:1,this.has(a,'aura')?1.2:1,this.has(a,'frenzy')?1.6:1,this.has(a,'morale')?1.15:1,this.has(a,'volley')?1.6:1)*this.heroSpd(a);if(!extra)a.cool=a.rate/haste;
 }
 projectileStep(dt){
  for(const p of this.projectiles){
   p.age+=dt;const a=p.source,b=p.target;
   // Arrows and spells track their acquired target. Artillery lands at its original ground point.
   if(!['shell','stone'].includes(p.kind)){p.tx=b.x;p.ty=b.y;}
   if(p.age<p.duration)continue;
   const alive=b.hp>0&&!b.dead;const landed={x:p.tx,y:p.ty};
   if(p.kind==='melee'&&(!alive||a.hp<=0||dist(a,b)>a.range+b.r+22)){p.done=true;continue;}
   const primary=alive&&(!['shell','stone'].includes(p.kind)||dist(b,landed)<(a.splash||16)+b.r);
   if(primary){
    if(a.ability==='combo'){a.comboTarget===b.id?a.comboCount++:(a.comboTarget=b.id,a.comboCount=1);if(a.comboCount%3===0)p.amount*=1.6;}
    this.hitT(a,b,p.amount);this.onImpact(a,b,p);this.heroHit(a,b,p);
   }
   if(a.splash||a.cone){const dx=p.tx-p.x,dy=p.ty-p.y,norm=Math.hypot(dx,dy)||1;for(const u of this.all())if((u!==b||!primary)&&u.team!==a.team&&u.hp>0&&(!u.flying||a.airHit)){
    const d=dist(a,u);let ok=a.splash&&dist(u,landed)<a.splash+u.r;
    if(a.cone)ok=d<a.range+18&&((u.x-a.x)*dx+(u.y-a.y)*dy)/(d*norm||1)>.65;
    if(ok){this.hitT(a,u,p.amount*(a.tier==='hero'&&!a.derived?HERO_SPLASH:.8)*((u.tower||u.type==='building')?SPLASH_VS_BUILD:1));if(a.ability==='trample'&&!u.tower&&u.type!=='building')this.buff(u,'slow',1);}
   }}
   if(primary){if(a.curseHit)this.buff(b,'curse',3);if(a.rushHit)this.buff(b,'rush',4);if(a.slowHit)this.buff(b,'slow',1.7);if(a.antiCharge){b.travel=0;this.buff(b,'slow',1);}}
   if(['shell','stone'].includes(p.kind))this.effect('blast',p.tx,p.ty,p.team,a.splash||24,{element:p.element});
   else if(p.kind==='melee')this.effect('slash',p.tx,p.ty,p.team,22,{angle:Math.atan2(p.ty-p.y,p.tx-p.x),life:.18,max:.18});
   p.done=true;
  }
  this.projectiles=this.projectiles.filter(p=>!p.done);
 }
 /* 汲取：樹人型態（森林守衛、喚醒古樹的樹人、小樹人）的範圍光環。範圍內敵軍每秒損失一定比例最大生命、但不低於保底值（純傷害、不吃減傷），
    同一個敵人最多受最強的 3 隻樹人影響；有打到敵人的樹人每秒回復自身最大生命的一定比例。塔與建築不受影響。 */
 treantStep(dt){
  const src=this.units.filter(u=>u.treantAura&&u.hp>0&&!u.dead);if(!src.length)return;
  const fed=new Set();
  for(const u of this.units){
   if(u.hp<=0||u.dead||u.tower||u.type==='building')continue;
   const hits=src.filter(s=>s.team!==u.team&&dist(s,u)<=s.treantAura.r+u.r);if(!hits.length)continue;
   const val=s=>Math.max(s.treantAura.floor||0,u.max*s.treantAura.pct); /* 每隻樹人每秒：最大生命的百分比，但不低於保底值 */
   hits.sort((a,b)=>val(b)-val(a));
   const top=hits.slice(0,3),dmg=top.reduce((v,s)=>v+val(s),0);
   this._true=true;try{this.hit({team:top[0].team,src:top[0].src},u,dmg*dt,true);}finally{this._true=false;}
   top.forEach(s=>fed.add(s));
  }
  fed.forEach(s=>this.restore(s,s.max*s.treantAura.heal*dt,true));
 }
 restore(u,amount,quiet=false){
  if(u.hp<=0)return;const effective=amount*(this.has(u,'curse')?.35:1),over=Math.max(0,effective-(u.max-u.hp));u.hp=Math.min(u.max,u.hp+effective);
  if(over>0&&u.type!=='building'&&!u.tower&&this.units.some(h=>h.ability==='overflow'&&h.team===u.team&&h.hp>0&&dist(h,u)<105)){
   u.bloodShield=Math.min(u.max*.25,240,(u.bloodUntil>this.clock?u.bloodShield||0:0)+over);u.bloodUntil=this.clock+4;
  }
  if(!quiet)this.effect('heal',u.x,u.y,u.team,20);
 }
 portalStep(a){
  if(!a.portal||a.hp<=0||this.clock<a.portalAt)return;this._src=a.src;try{this.portalStep0(a);}finally{this._src=null;}
 }
 portalStep0(a){
  const n=[1,2,4][a.portalWave];if(!n)return;
  const p=this.players[a.team],charge=Math.min(4,p.resonance);p.resonance-=charge;
  this.spawn(summons.spirit,a.team,a.x,a.y+(a.team?28:-28),n,{derived:true,shield:charge*35,shieldUntil:this.clock+8});
  a.portalWave++;a.portalAt=this.clock+4;this.effect('cast',a.x,a.y,a.team,38,{label:'第 '+a.portalWave+' 波 · '+n+' 隻 / 共鳴 '+charge});
  if(a.portalWave===3){a.hp=0;a.closed=true;}
 }
 shieldUnit(u,amount){u.shield=Math.max(u.shieldUntil>this.clock?u.shield:0,amount);u.shieldUntil=this.clock+4;}
 abilityEffect(a){this.effect('cast',a.x,a.y,a.team,45,{label:a.abilityName});}
 /* 技能施放：先扣 1 點資源（不夠也照扣，最低 -2），再產生效果 */
 fireSkill(a,sk,b){
  this._src=a.src;try{this.fireSkill0(a,sk,b);}finally{this._src=null;}
 }
 fireSkill0(a,sk,b){
  const p=this.players[a.team],before=p.energy;p.energy=Math.max(ENERGY_FLOOR,p.energy-(sk.cost||SKILL_COST));
  if(before-p.energy>0)this.notice.push({team:a.team,kind:'skillcost',paid:before-p.energy,name:sk.name,unit:a.id});
  const near=this.units.filter(u=>u.team===a.team&&u.hp>0&&u.type!=='building'&&dist(a,u)<105);
  if(a.ability==='banner')near.forEach(u=>this.shieldUnit(u,120));
  else if(a.ability==='leech')this.restore(a,180);
  else if(a.ability==='runes'){const t=near.sort((u,v)=>u.hp/u.max-v.hp/v.max)[0];if(t)this.shieldUnit(t,160);}
  else if(a.ability==='rally')near.forEach(u=>this.buff(u,'aura',4));
  else if(a.ability==='ringwalk'){const small=a.artId==='n_king'&&a.dark,pool=a.artId==='n_hero'?['fuse_earth','fuse_storm','fuse_aurora','fuse_fallen']:['fuse_earth','fuse_storm','fuse_aurora'],pick=small?'fuse_fallen':pool[Math.floor(this.random()*pool.length)];this.spawn(summons[pick],a.team,a.x+(a.team?0:0),a.y+(a.team?35:-35),1,{derived:true,src:small?'fuse_fallen':undefined});const u=this.units.at(-1);if(u){if(small){const m=.25*FUSE_WEAK;u.hp*=m;u.max*=m;u.dmg*=m;u.name='縮小暗蝕合靈';u.size=(u.size||1)*.7;}u.ttl=12;this.effect('cast',u.x,u.y,a.team,50,{label:summons[pick].name,big:true});}}
  else if(a.ability==='mend')near.forEach(u=>this.restore(u,u.max*.12));
  else if(a.ability==='shackle')this.units.filter(u=>u.team!==a.team&&u.hp>0&&!u.tower&&u.type!=='building'&&dist(a,u)<110+u.r).forEach(u=>this.buff(u,'root',1.5));
  else if(a.ability==='drill'&&b&&b.hp>0){this._true=true;this.hit(a,b,220);this._true=false;this.buff(b,'rush',3);}
  else if(a.ability==='moth'&&b)this.units.filter(u=>u.team!==a.team&&u.hp>0&&!u.tower&&u.type!=='building'&&dist(b,u)<100+u.r).forEach(u=>{this.buff(u,'slow',2.5);this.buff(u,'weak',3);});
  else if(a.ability==='trample')this.units.filter(u=>u.team!==a.team&&u.hp>0&&!u.tower&&u.type!=='building'&&dist(a,u)<110+u.r).forEach(u=>{this.hit(a,u,100);this.buff(u,'slow',2.5);});
  this.effect('cast',a.x,a.y,a.team,60,{label:sk.name,big:true});
 }
 /* 守城人：外塔第一次降到 50% 以下時，在塔前方跳出一隻守城單位 */
 guardFaction(team){
  const cnt={};for(const id of this.players[team].deck){const c=CARDS[id];if(c&&c.faction>=0&&c.faction<=6)cnt[c.faction]=(cnt[c.faction]||0)+1;}
  const top=Math.max(0,...Object.values(cnt)),fs=Object.keys(cnt).filter(f=>cnt[f]===top);return +fs[Math.floor(this.random()*fs.length)];
 }
 /* 英魂所屬勢力：看帶的英雄的勢力；沒帶英雄才退回牌組裡最多的勢力 */
 guardFactionOf(team){const h=(this.heroSlots[team]||[]).map(s=>CARDS[s.id]).find(c=>c&&c.faction>=0&&c.faction<=6);return h?h.faction:this.guardFaction(team);}
 /* 這座塔降臨的英魂：該勢力兩位英雄的殘影，每局隨機排序，兩座塔各得其一 */
 guardEcho(team,f){const o=this.guardOrder||(this.guardOrder=[null,null]),n=this.guardCount||(this.guardCount=[0,0]);if(!o[team]){const p=[...GUARD_PAIR[f]];if(this.random()<.5)p.reverse();o[team]=p;}return o[team][n[team]++%2];}
 guardStep(){
  for(const u of this.units)if(u.guardian&&u.hp>0&&u.guardTowerRef&&u.guardTowerRef.hp<=0){u.hp=0;u.ttl=0;this.effect('spawn',u.x,u.y,u.team,46);} /* 塔倒了，護印英魂跟著消失 */
  for(const t of this.towers){
   if(t.core||t.guarded||t.hp<=0||t.hp>t.max*.5)continue;
   t.guarded=true;const team=t.team,dir=team?1:-1,f=this.guardFactionOf(team),x=t.x,y=t.y+dir*50;
   let u;
   if(f===6){const k=['fuse_earth','fuse_storm','fuse_aurora'][Math.floor(this.random()*3)];this.spawn(summons[k],team,x,y,1,{derived:true});u=this.units.at(-1);if(u){u.kingGuard=true;u.artId='guard_king_'+k.slice(5);u.name='王之護衛';}} /* 界環之王的護衛：金白色遮罩與光效（不是悖靈的紫黑） */
   else{const hid=this.guardEcho(team,f),g=GUARD_ECHOES[hid];this.spawn({...g,id:'guard_'+hid,artId:g.art,type:'troop',faction:f,tier:'elite',n:1,cost:0},team,x,y,1,{derived:true});u=this.units.at(-1);if(u){u.size=1.2;u.r=15;u.cool=.7;u.echoOf=hid;}}
   if(u){u.ttl=GUARD_TTL;u.guardian=true;u.guardFaction=f;u.guardAt=this.clock;u.guardTower={x:t.x,y:t.y};u.guardTowerRef=t;u.cool=Math.max(u.cool,.7);}
   this.effect('guardfall',x,y,team,80,{f,life:1.4,max:1.4});this.effect('cast',x,y,team,80,{label:'護印降臨',big:true,element:'聖'});
   this.log((team?'敵方':'我方')+t.name+'半血，護印降臨');
  }
 }
 /* 英雄命中附加：吸血、彈跳、範圍橫掃、鐘聲詛咒、衝鋒落點範圍 */
 heroHit(a,b,p){
  const ls=(a.lifesteal||0)+(this.has(a,'steal')?.2:0);
  if(ls)this.restore(a,p.amount*ls,true);
  if(a.poisonHit)this.applyPoison(a,b,1);
  if(p.fp)this.applyPoison({team:a.team,hp:0},b,p.fp);
  if(a.paraHit||a.paraNext){this.applyPara(a,b);a.paraNext=false;}
  const foesNear=(x,y,r)=>this.all().filter(u=>u.team!==a.team&&u.hp>0&&(!u.flying||a.airHit)&&dist(u,{x,y})<r+u.r);
  if(a.bounce&&!p.weak){
   let from=b,amt=p.amount;const done=[b];
   for(let k=0;k<a.bounce;k++){
    const nx=this.all().filter(u=>!done.includes(u)&&this.canTarget(a,u)&&!u.tower&&u.type!=='building'&&dist(u,from)<150).sort((u,v)=>dist(u,from)-dist(v,from))[0];if(!nx)break;
    amt*=a.bounceFall||.7;this.hitT(a,nx,amt);if(a.poisonHit)this.applyPoison(a,nx,1);done.push(nx);
    this.effect('chain',from.x,from.y,a.team,0,{tx:nx.x,ty:nx.y,element:a.element,life:.4,max:.4});
    if(ls)this.restore(a,amt*ls,true);
    if(a.bounceHeal){const al=this.units.filter(u=>u.team===a.team&&u.hp>0&&u.type!=='building'&&u.hp<u.max&&dist(u,nx)<170).sort((u,v)=>u.hp/u.max-v.hp/v.max)[0];if(al)this.restore(al,a.bounceHeal);}
    if(a.slowHit)this.buff(nx,'slow',1.2);
    from=nx;
   }
  }
  if(a.aoe){for(const u of foesNear(a.x,a.y,a.aoe))if(u!==b&&!u.flying)this.hitT(a,u,p.amount*(a.tier==='hero'&&!a.derived?HERO_SPLASH*.8:.6)*((u.tower||u.type==='building')?SPLASH_VS_BUILD:1));this.effect('sweep',a.x,a.y,a.team,a.aoe,{life:.35,max:.35,element:a.element});}
  if(a.chime){for(const u of foesNear(a.x,a.y,a.chime))if(!u.tower&&u.type!=='building')this.buff(u,'curse',3);this.effect('bell',a.x,a.y,a.team,a.chime,{life:.6,max:.6});}
  if(p.charged&&a.chargeArea){for(const u of foesNear(b.x,b.y,a.chargeArea))if(u!==b)this.hitT(a,u,p.amount*(a.tier==='hero'&&!a.derived?HERO_SPLASH*.6:.7)*((u.tower||u.type==='building')?SPLASH_VS_BUILD:1));this.effect('blast',b.x,b.y,a.team,a.chargeArea,{element:a.element,big:true});}
 }
 /* 英雄計數技能：命中累積滿了自動施放（不花資源）。特效標籤與環一起顯示 */
 heroCounter(a,hs){
  this._src=a.src;const id=a.artId,t=a.team,F=this.units.filter(u=>u.team===t&&u.hp>0&&u.type!=='building'),E=this.all().filter(u=>u.team!==t&&u.hp>0);
  const nearF=r=>F.filter(u=>dist(a,u)<r+u.r),nearE=r=>E.filter(u=>dist(a,u)<r+u.r&&(!u.flying||a.airHit));
  const dir=t?1:-1;
  if(id==='f0_4'){nearE(130).forEach(u=>this.hit(a,u,120));nearF(130).forEach(u=>this.shieldUnit(u,120));this.effect('blast',a.x,a.y,t,130,{big:true,element:'聖'});}
  else if(id==='f0_30'){
   const tg=E.filter(u=>!u.flying||a.airHit).sort((u,v)=>dist(a,u)-dist(a,v))[0],vx=tg?tg.x-a.x:0,vy=tg?tg.y-a.y:dir,n=Math.hypot(vx,vy)||1,ux=vx/n,uy=vy/n,L=330;
   E.forEach(u=>{const rx=u.x-a.x,ry=u.y-a.y,along=rx*ux+ry*uy,side=Math.abs(rx*uy-ry*ux);if(along>0&&along<L&&side<30+u.r&&(!u.flying||a.airHit))this.hit(a,u,100);});
   this.effect('volley',a.x,a.y,t,0,{tx:a.x+ux*L,ty:a.y+uy*L,life:.5,max:.5});
   nearF(160).forEach(u=>this.buff(u,'volley',3));
  }
  else if(id==='f1_5'){nearE(120).forEach(u=>this.hit(a,u,100));this.restore(a,100);this.effect('blast',a.x,a.y,t,120,{big:true,element:'血'});}
  else if(id==='f1_30'){nearF(200).forEach(u=>{const loss=Math.max(0,Math.min(u.hp-1,u.hp*.12));u.hp-=loss;u.bnet={debt:(u.bnet&&u.bnet.until>this.clock?u.bnet.debt:0)+loss,until:this.clock+5};this.buff(u,'bnet',5);});this.effect('blast',a.x,a.y,t,200,{big:true,element:'血'});}
  else if(id==='f2_7'){this.summon('skel',t,a.x,a.y+dir*-28,3);nearE(120).forEach(u=>{if(!u.tower&&u.type!=='building')this.buff(u,'curse',4);});this.effect('blast',a.x,a.y,t,120,{big:true,element:'暗'});}
  else if(id==='f2_30'){nearE(190).forEach(u=>{if(!u.tower&&u.type!=='building'){this.buff(u,'slow',3);this.buff(u,'curse',4);}});nearF(190).forEach(u=>this.buff(u,'deathward',6));this.effect('bell',a.x,a.y,t,190,{life:.9,max:.9,big:true});}
  else if(id==='f3_30')this.napalm(t,a,1,15,5);
  else if(id==='f3_4'){nearF(130).forEach(u=>this.buff(u,'armor',5));this.effect('cast',a.x,a.y,t,100,{big:true,element:'符文'});}
  else if(id==='f4_7'){nearE(130).forEach(u=>{if(!u.tower&&u.type!=='building')this.buff(u,'root',2);});this.effect('blast',a.x,a.y,t,130,{big:true,element:'自然'});}
  else if(id==='f4_30'){nearE(140).forEach(u=>this.applyPoison(a,u,2));this.effect('blast',a.x,a.y,t,140,{big:true,element:'毒'});}
  else if(id==='f5_30'){nearF(150).forEach(u=>this.buff(u,'speed',4));this.buff(a,'speed',4);nearE(110).forEach(u=>this.hit(a,u,90));this.effect('blast',a.x,a.y,t,110,{big:true,element:'物理'});}
  else if(id==='f5_5'){nearF(160).forEach(u=>{u.paraNext=true;});this.effect('cast',a.x,a.y,t,100,{big:true,element:'自然'});}
  {const p=this.players[t],before=p.energy;p.energy=Math.max(ENERGY_FLOOR,p.energy-HERO_COUNTER_COST);if(before-p.energy>0)this.notice.push({team:t,kind:'skillcost',paid:before-p.energy,name:hs.name,unit:a.id});}
  this._src=null;this.effect('cast',a.x,a.y,t,64,{label:hs.name,big:true});
  this.notice.push({team:t,kind:'herocount',name:hs.name,unit:a.id,art:a.artId});
 }
 onImpact(a,b,p){
  if(a.hp<=0)return;
  if(p.charged&&a.ability==='dive'&&!b.tower&&b.type!=='building')this.buff(b,'slow',2);
  const HC=HEROES[a.artId];if(HC&&HC.hs&&!a.derived&&!a.summoned&&!p.weak&&!p.extra){a.hcount=(a.hcount||0)+1;if(a.hcount>=HC.hs.need){a.hcount=0;this.heroCounter(a,HC.hs);}}
  const sk=SKILLS[a.ability];if(sk&&!a.derived){a.skillHits=(a.skillHits||0)+1;if(a.skillHits>=sk.need){a.skillHits=0;this.fireSkill(a,sk,b);}}
  if(a.ability==='roots'){a.rootHits=(a.rootHits||0)+1;if(a.rootHits%3===0&&!b.tower&&b.type!=='building'){this.buff(b,'root',1.2);this.abilityEffect(a);}}
 }
 support(a,dt){
  if(a.artId==='n_king'&&!a.dark&&!a.derived&&this.counters[a.team].fusions>=DARK_FUSIONS){a.dark=true;this.effect('cast',a.x,a.y,a.team,70,{label:'裏律解放',big:true,element:'暗'});this.effect('omen',a.x,a.y,a.team,90,{life:1,max:1});this.log((a.team?'敵方':'我方')+'梭解放裏律：環行可丟出暗蝕合靈');}
  if(a.portal){this.portalStep(a);return;}
  if(a.tier==='hero'&&!a.derived&&HEROES[a.artId])this.heroTick(a,dt);
  if(a.guardShare){const ally=this.units.filter(u=>u!==a&&u.team===a.team&&u.hp>0&&!u.guardShare&&u.type!=='building'&&dist(u,a)<(a.guardRange||85)).sort((u,v)=>u.hp/u.max-v.hp/v.max||u.id-v.id)[0];a.guardTarget=ally?.id;}

  if(a.tier==='hero'){
   const nearby=this.units.filter(u=>u.team===a.team&&u.hp>0&&u.type!=='building'&&dist(a,u)<105);
   if(a.ability==='rally'&&nearby.filter(u=>u!==a).length>=3)nearby.forEach(u=>this.buff(u,'march',1.2));
   if(a.ability==='souls'&&(a.souls||0)>=3&&this.clock>=(a.soulAt||0)){a.souls-=3;a.soulAt=this.clock+6;this.summon('skel',a.team,a.x,a.y+(a.team?25:-25),2);this.abilityEffect(a);}
  }
  if(a.regen)this.restore(a,a.regen*dt,true);
  if(a.zone){a.zoneCool=(a.zoneCool||0)-dt;if(a.zoneCool<=0){a.zoneCool=.5;for(const u of this.units){if(u.team===a.team||u.hp<=0||u.tower||u.dead)continue;if(dist(u,a)>a.zone.r+u.r)continue;if(a.zone.curse)this.buff(u,'curse',1);if(a.zone.rush)this.buff(u,'rush',1);if(a.zone.weak)this.buff(u,'weak',1);if(a.zone.slow)this.buff(u,'slow',1);if(a.zone.dot)this.hit(a,u,a.zone.dot*.5,true);}}}
  if(a.block&&this.clock>=(a.blockAt||0)){this.shieldUnit(a,a.block);a.blockAt=this.clock+(a.blockEvery||4);}
  if(this.has(a,'frenzy'))a.hp=Math.max(1,a.hp-a.max*.02*dt);
  if(a.buffCast&&this.clock<(a.castUntil||0)){a.castCool=(a.castCool||0)-dt;if(a.castCool<=0){a.castCool=1;const bc=a.buffCast;
   for(const u of this.units){if(u.hp<=0||u.tower||u.dead||dist(u,a)>bc.radius)continue;
    if(u.team===a.team){if(u!==a){for(const k of bc.ally||[])this.buff(u,k,1.3);if(bc.heal)this.restore(u,bc.heal);}}
    else if(u.type!=='building')for(const k of bc.foe||[])this.buff(u,k,1.3);}}}
  if(a.heal||a.ward||a.aura){
   a.supportCool=(a.supportCool||0)-dt;
   if(a.supportCool<=0){a.supportCool=1;
    const friends=this.units.filter(u=>u.hp>0&&u.team===a.team&&dist(u,a)<105);
    if(a.heal){const u=friends.filter(u=>u.hp<u.max).sort((b,c)=>b.hp/b.max-c.hp/c.max)[0];if(u){this.restore(u,a.heal);this.effect('heal',u.x,u.y,u.team,22);}}
    if(a.ward||a.aura)friends.forEach(u=>this.buff(u,a.ward?'ward':'aura',1.2));
   }
  }
  if(a.summon){a.spawnCool-=dt;if(a.spawnCool<=0){a.spawnCool=a.spawnEvery;this._src=a.src;this.summon(a.summon,a.team,a.x,a.y+(a.team?30:-30),a.type==='building'?2:2);this._src=null;}}
 }
 /* 重量：大型單位推得動小兵，小兵推不動大型單位（橋上排隊與卡橋用） */
 mass(u){if(u._m)return u._m;const r=Math.max(8,u.r||12);return u._m=r*r*(u.max>=1500?2.6:u.max>=800?1.6:1)*(u.tier==='hero'||u.tier==='elite'?1.3:1);}
 onBridge(u){return !u.flying&&u.y>296&&u.y<404&&(Math.abs(u.x-155)<56||Math.abs(u.x-445)<56);}
 move(a,b,dt){
  if(this.has(a,'root'))return;
  let tx=b.x,ty=b.y;const bridge=a.x<300?155:445;
  if(!a.flying&&(a.y-350)*(b.y-350)<0){
   if(Math.abs(a.y-350)>28){tx=bridge;ty=a.y>350?374:326;}
   else {tx=bridge;ty=a.y>350?318:382;}
  }
  const dx=tx-a.x,dy=ty-a.y,d=Math.hypot(dx,dy);if(d<1)return;
  let speed=a.speed*MOVE_SCALE*(this.has(a,'stasis')?STASIS_SLOW:1)*(this.has(a,'slow')?.45:1)*(this.has(a,'bind')?.01:1)*Math.max(this.has(a,'speed')?1.5:1,this.has(a,'rush')?1.75:1,this.has(a,'march')?1.2:1)*(this.has(a,'morale')?1.15:1)*(this.has(a,'para')?.75:1)*this.trailMul(a);
  let move=Math.min(speed*dt,d);
  /* 橋上排隊：前方有明顯比自己重（1.3 倍以上）的地面單位擋著，就停下來；大型單位能當塞子（飛行單位不受影響） */
  if(!a.flying&&this.onBridge(a)){const nx=a.x+dx/d*move,ny=a.y+dy/d*move,ma=this.mass(a);
   for(const o of this.units){if(o===a||o.hp<=0||o.flying||o.type==='building'||o.tower)continue;
    const dn=Math.hypot(o.x-nx,o.y-ny),dc=Math.hypot(o.x-a.x,o.y-a.y);
    if(dn<(a.r+o.r)*.85&&dn<dc&&this.mass(o)>=ma*1.3){move=0;a.blocked=(a.blocked||0)+dt;break;}}
  }
  if(move>0)a.blocked=0;
  a.x+=dx/d*move;a.y+=dy/d*move;a.travel+=move;a.walk+=move;a.moving=move>0;a.moveDX=dx/d;a.moveDY=dy/d;
  if(!a.flying&&a.walk-(a.lastDust||0)>14){a.lastDust=a.walk;this.effect(a.role==='輪'?'steam':'dust',a.x,a.y,a.team,a.max>=1700?13:7,{dx:-dx/d,dy:-dy/d,seed:a.id+a.walk,life:.55,max:.55});}
  a.angle=Math.atan2(dx,-dy);
  a.x=clamp(a.x,24,576);a.y=clamp(a.y,22,678);
  if(!a.flying&&a.y>328&&a.y<372)a.x=clamp(a.x,bridge-33,bridge+33);
 }
 ai(team,dt){
  this.aiTimers[team]-=dt;if(this.aiTimers[team]>0)return;this.aiTimers[team]=.8+this.random()*.7;
  this.aiExtras(team);
  const p=this.players[team];const reso=this.anyResonance(team);const choices=p.hand.map((id,slot)=>({c:CARDS[id],slot})).filter(o=>o.c.cost<=p.energy&&(o.c.effect!=='resonate'||reso)&&!(o.c.tier==='hero'&&this.units.some(u=>u.team===team&&u.artId===o.c.id&&u.hp>0)));if(!choices.length)return;
  {const rc=choices.find(o=>o.c.effect==='resonate');if(rc&&reso){this.play(team,rc.slot,reso.x,reso.y);return;}}
  const enemies=this.units.filter(u=>u.team!==team&&u.hp>0),friends=this.units.filter(u=>u.team===team&&u.hp>0);
  const threats=enemies.filter(u=>team?u.y<320:u.y>380);
  const style=this.aiStyles[team]||'steady';
  if(threats.length<2&&this.heroStatus(team).some(h=>h.ready&&!h.onField&&p.energy<h.cost+1))return; /* 英雄條件已達成：沒有大威脅就先存資源登場 */
  if(!threats.length&&p.energy<(style==='aggressive'?3:style==='conservative'?8:6))return;
  let choice=choices[Math.floor(this.random()*choices.length)];
  if(style==='aggressive')choice=choices.filter(o=>o.c.type==='troop').sort((a,b)=>a.c.cost-b.c.cost)[0]||choice;
  if(style==='conservative'&&threats.length)choice=choices.find(o=>o.c.type==='building')||choices.find(o=>o.c.armor||o.c.hp>=1000)||choice;
  if(style==='steady'&&!threats.length){const frontline=friends.some(u=>u.hp>=600&&u.range<60);choice=choices.find(o=>frontline?o.c.range>80:o.c.hp>=600&&o.c.type==='troop')||choice;}

  if(threats.length>=3)choice=choices.find(o=>['bomb','fire','barrage'].includes(o.c.effect))||choices.find(o=>o.c.splash)||choice;
  const c=choice.c;let x=this.random()<.5?155:445,y=team?220:480;
  if(threats.length){const t=threats[0];x=clamp(t.x+(this.random()-.5)*55,50,550);y=team?clamp(t.y-65,100,295):clamp(t.y+65,405,600);}
  else if(style==='aggressive')y=team?290:410;else y=team?110:590;
  if(c.type==='tactic'){
   if(['haste','shield','frenzy','sacrifice','armor','heal','speed','power','rush'].includes(c.effect)){
    const good=friends.filter(u=>!u.tower&&u.type!=='building'&&(c.effect!=='heal'||u.hp<u.max*.8));if(!good.length)return;
    const t=good.sort((a,b)=>b.cost-a.cost)[0];x=t.x;y=t.y;
   }else if(c.effect==='proj'){x=threats[0]?.x||x;y=team?280:420;
   }else if(c.effect==='summon'){
    if(c.homeOnly||c.aiHome){x=threats[0]?.x||x;y=team?280:420;} /* 玩家可丟全圖；電腦對手仍把援軍放在己方半場 */
    else {const t=this.towers.find(t=>t.team!==team&&!t.core&&t.hp>0)||this.towers.find(t=>t.team!==team&&t.core);x=t.x;y=t.y+(team?-50:50);}
   }else if(c.effect!=='mine'&&c.effect!=='portal'){
    let t=enemies.sort((a,b)=>b.max-a.max)[0];if(!t){if(['bolt','root','slow'].includes(c.effect))return;t=this.towers.find(t=>t.team!==team&&!t.core&&t.hp>0)||this.towers.find(t=>t.team!==team&&t.core);}
    x=t.x;y=t.y;
   }
  }
  if(c.zone){const foes=enemies.filter(u=>!u.tower&&u.type!=='building');if(!foes.length)return;const t=foes.sort((p,q)=>foes.filter(o=>dist(o,q)<90).length-foes.filter(o=>dist(o,p)<90).length)[0];x=t.x;y=t.y;}
  else if(c.type==='building'||c.effect==='portal'){x=this.random()<.5?220:380;y=team?250:450;}
  for(let i=0;i<4;i++){const err=this.legal(c,team,x,y);if(!err)break;x=clamp(x+36,40,560);}
  this.play(team,choice.slot,x,y);
 }
 deaths(){
  for(const u of [...this.units,...this.towers])if(u.hp<=0&&!u.dead){
   if(u.revive&&!u.revived){u.revived=true;u.hp=u.max*.4;u.cool=1.2;this.effect('spawn',u.x,u.y,u.team,45);continue;}
   if(!u.tower&&u.type!=='building'&&u.bindRec&&this.has(u,'bind')&&u.bindRec.n<BIND_MAX){u.bindRec.n++;const bt=u.bindTeam;this.spawn(CARDS.f2_0,bt,u.x,u.y,1,{derived:true,src:u.bindSrc});const sk=this.units.at(-1);if(sk){sk.name='囚魂骷髏';this.effect('spawn',u.x,u.y,bt,40);}}
   u.dead=true;if(!u.tower&&u.type!=='building'&&u.src&&u.bornAt!==undefined){const cs=this.cstat(u.team,u.src);cs.deaths++;cs.life+=this.clock-u.bornAt;}
   if(!u.tower&&u.type!=='building'&&(!u.derived||u.cardSummon)){this.counters[u.team].ownDeaths++;this.counters[0].allDeaths++;this.counters[1].allDeaths++;}
   if(!u.tower&&u.type!=='building'&&(!u.derived||u.cardSummon)){const bm=this.bannerMods[u.team];if(bm&&bm.deathGem){const p=this.players[u.team];p.gemDeaths=(p.gemDeaths||0)+1;if(p.gemDeaths>=bm.deathGem){p.gemDeaths=0;p.energy=Math.min(10,p.energy+1);}}}
   if(u.tier==='hero'&&!u.derived){const sl=this.heroSlots[u.team].find(q=>q.id===u.artId);if(sl)sl.nextAt=this.clock+HERO_RESPAWN;}
   if(u.tower)this.effect('towerfall',u.x,u.y,u.team,70,{life:1.5,max:1.5});
   if(u.tower&&!u.core&&this.itemsOn)this.grantItem(u.team);
   if(!u.derived&&!u.tower&&u.type!=='building')for(const king of this.units)if(king.ability==='souls'&&king.hp>0&&!king.dead&&dist(king,u)<130)king.souls=Math.min(3,(king.souls||0)+1);
   if(!u.tower&&u.type!=='building')this.heroDeathHooks(u);
   if(u.ability==='rupture')this.units.filter(v=>v.team!==u.team&&v.hp>0&&v.type!=='building'&&dist(u,v)<70+v.r).forEach(v=>this.buff(v,'slow',2));
   this.effect('death',u.x,u.y,u.team,u.tower?60:25,{tower:!!u.tower});
   if(u.killer!==undefined&&u.killer!==u.team)this.stats[u.killer].kills++;
   if(u.deathBlast&&!u.derived){this.all().filter(b=>b.team!==u.team&&dist(u,b)<70+b.r).forEach(b=>this.hit(u,b,u.deathBlast));this.effect('blast',u.x,u.y,u.team,70);}
   if(u.tower)this.log((u.team?'敵方':'我方')+u.name+'已陷落');
  }
  this.units=this.units.filter(u=>!u.dead);
 }
 score(team){return this.towers.filter(u=>u.team!==team&&!u.core&&u.hp<=0).length;}
 finish(winner,reason){this.state='ended';this.winner=winner;this.reason=reason;this.log(reason);}
 step(dt){
  if(this.state!=='playing')return;dt=Math.min(dt,.1);this.clock+=dt;this.remaining=Math.max(0,this.remaining-dt);
  this.players.forEach((p,i)=>{
   const gain=dt*this.baseRegen()*((this.teamMods&&this.teamMods[i].regen)||1)*(1+((this.bannerMods&&this.bannerMods[i].regen)||0))*((p.regenUntil||0)>this.clock?p.regenMul:1)*this.catchUp(i);
   if(p.energy<10){const room=10-p.energy;if(gain>room)this.stats[i].wasted=(this.stats[i].wasted||0)+gain-room;p.energy=Math.min(10,p.energy+gain);}else this.stats[i].wasted=(this.stats[i].wasted||0)+gain;
   if(p.bank&&this.clock>=p.bank.until){p.energy+=p.bank.amount;p.bank=null;}
  });
  this.players.forEach((p,i)=>{const g=this.bannerMods[i]&&this.bannerMods[i].grow;if(g&&!p.grown&&this.clock>=GROW_AT){p.grown=true;p.energy=Math.min(10,p.energy+g);this.notice.push({team:i,text:'生長：水晶 +'+g,kind:'banner'});this.effect('cast',300,i?150:550,i,70,{label:'生長 +'+g,big:true,element:'自然'});}});
  if(this.heroAuto&&this.clock>=(this.nextHero||0)){this.nextHero=this.clock+.5;for(let t=0;t<2;t++)for(const h of this.heroStatus(t))if(h.ready)this.playHero(t,h.idx);} /* 英雄條件達成就自動從主堡出發，不花水晶 */
  if(this.clock>=(this.nextSweep||0)){this.nextSweep=this.clock+.5;this.fuseSweep();}
  if(this.itemsOn)this.players.forEach((_,t)=>{if(this.clock>=this.nextItemT[t]){this.grantItem(t);this.nextItemT[t]+=this.behindBy(t)>=ITEM_BEHIND_GAP?ITEM_EVERY_BEHIND:ITEM_EVERY;}});
  this.players.forEach((p,t)=>{if(p.towerHot&&this.clock<p.towerHot.until)this.towers.forEach(x=>{if(x.team===t&&x.hp>0)this.restore(x,x.max*p.towerHot.pct*dt,true);});});
  for(let t=0;t<2;t++)if(this.auto[t])this.ai(t,dt);
  this.fieldsStep(dt);this.projectileStep(dt);this.guardStep();this.statusStep(dt);this.treantStep(dt);
  for(const a of this.all()){
   if(a.deathAt&&this.clock>=a.deathAt){a.deathAt=0;a.hp=0;a.killer=a.deathKiller;continue;}
   if(a.hp<=0)continue;a.moving=false;if(a.ttl!==undefined){a.ttl-=dt;if(a.ttl<=0){a.hp=0;continue;}}
   if(a.type==='building'){a.life-=dt;if(!a.totem)a.hp-=a.max/a.duration*dt;if(a.life<=0&&a.fuseOnEnd){a.fuseOnEnd=false;this.spawn(summons.fuse_fallen,a.team,a.x,a.y,1,{derived:true,src:'fuse_fallen'});{const fu=this.units.at(-1);if(fu)fu.name='暗蝕合靈';}this.effect('fusion',a.x,a.y,a.team,60,{life:1,max:1});this.log((a.team?'敵方':'我方')+'破滅法則疊加，凝成暗蝕合靈');}if(a.life<=0||a.hp<=0){a.hp=0;continue;}}
   a.cool-=dt;this.support(a,dt);if(a.hp<=0)continue;
   let enemies=this.all().filter(b=>this.canTarget(a,b));
   const reach=a.range*(this.has(a,'reach')?1.25:1);let range=enemies.filter(b=>dist(a,b)<=reach+b.r&&(!a.minRange||dist(a,b)>=a.minRange));
   if(!a.siege&&!a.tower){const us=range.filter(b=>!b.tower&&b.type!=='building');if(us.length)range=us;}
   if(a.huntId){const hv=range.find(b=>b.id===a.huntId);if(hv)range=[hv];}
   {const th=range.filter(b=>b.threat);if(th.length&&!a.tower)range=th;else if(th.length&&a.tower)range=th;} /* 高威脅（砲兵）：射程內有就先打它 */ /* 目標優先：有敵方單位在射程內時先打單位，沒有才打塔／建築 */
   if(range.length&&a.dmg>0){range.sort((b,c)=>dist(a,b)-dist(a,c));if(a.cool<=0){this.attack(a,range[0]);if(a.multi){let ex=range.slice(1).filter(u=>!u.tower&&u.type!=='building');if(a.multiRepeat){const pool=range.filter(u=>!u.tower&&u.type!=='building');ex=[];for(let i=0;i<a.multi-1&&pool.length;i++)ex.push(pool[(i+1)%pool.length]);}for(const t of ex.slice(0,a.multi-1))this.attack(a,t,true);}}a.angle=Math.atan2(range[0].x-a.x,-(range[0].y-a.y));continue;}
   if(a.guardian&&a.guardTower){ /* 護印英魂：只守塔，不追過河 */
    const an={x:a.guardTower.x,y:a.guardTower.y+(a.team?50:-50),r:0},tg=enemies.filter(u=>dist(u,an)<GUARD_LEASH+u.r).sort((u,v)=>dist(a,u)-dist(a,v))[0];
    if(tg)this.move(a,tg,dt);else if(dist(a,an)>16)this.move(a,an,dt);
    a.y=a.team?Math.min(a.y,326):Math.max(a.y,374);continue;
   }
   if(a.tower||a.type==='building')continue;
   if(a.buffCast&&this.clock<(a.castUntil||0)){const al=this.units.filter(u=>u!==a&&u.team===a.team&&u.hp>0&&!(u.buffCast&&this.clock<(u.castUntil||0))&&u.dmg>0&&u.type!=='building'&&!u.flying&&!u.totem);let best=null,bs=-1;for(const u of al){const k=al.filter(o=>dist(o,u)<90).length*1000-dist(a,u);if(k>bs){bs=k;best=u;}}if(best&&dist(a,best)>42)this.move(a,best,dt);continue;}
   if(a.huntId){const hv=enemies.find(b=>b.id===a.huntId);if(hv){this.move(a,hv,dt);continue;}}
   const bait=enemies.filter(b=>b.threat&&dist(a,b)<THREAT_AGGRO&&!b.tower).sort((b,c)=>dist(a,b)-dist(a,c))[0];
   if(bait&&!(a.minRange&&dist(a,bait)<a.minRange)){this.move(a,bait,dt);continue;}
   let targets=enemies.filter(b=>!b.tower&&dist(a,b)<145&&((a.y-350)*(b.y-350)>0||a.flying||Math.abs(a.x-b.x)<55));
   if(!targets.length)targets=enemies.filter(b=>b.tower||b.type==='building');
   targets.sort((b,c)=>dist(a,b)-dist(a,c));if(targets[0]){
    if(a.minRange&&dist(a,targets[0])<a.minRange)continue;
    this.move(a,targets[0],dt);
   }
  }
  for(let i=0;i<this.units.length;i++)for(let j=i+1;j<this.units.length;j++){
   const a=this.units[i],b=this.units[j];if(a.hp<=0||b.hp<=0||!!a.flying!==!!b.flying)continue;
   let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),min=(a.r+b.r)*.72;if(d<min){if(d<.01){dx=.1;dy=.1;d=.142;}
    const strong=this.onBridge(a)||this.onBridge(b),push=(min-d)*(strong?.4:.12),am=a.type!=='building'&&!a.tower,bm=b.type!=='building'&&!b.tower,wa=bm?(am?this.mass(b)/(this.mass(a)+this.mass(b)):1):0,wb=am?(bm?this.mass(a)/(this.mass(a)+this.mass(b)):1):0;
    if(am){a.x-=dx/d*push*2*wa*.5*(bm?1:1);a.y-=dy/d*push*2*wa*.5;}
    if(bm){b.x+=dx/d*push*2*wb*.5;b.y+=dy/d*push*2*wb*.5;}}
  }
  this.deaths();this.fx.forEach(f=>f.life-=dt);this.fx=this.fx.filter(f=>f.life>0);
  const cores=this.towers.filter(u=>u.core),dead=cores.filter(u=>u.hp<=0);
  if(dead.length)this.finish(dead.length===2?2:1-dead[0].team,'主堡被摧毀');
  else if(this.overtime&&this.score(0)!==this.score(1))this.finish(this.score(0)>this.score(1)?0:1,'加時外塔決勝');
  else if(this.remaining<=0){
   if(this.score(0)!==this.score(1))this.finish(this.score(0)>this.score(1)?0:1,'摧毀外塔較多者獲勝');
   else if(!this.overtime){this.overtime=true;this.remaining=60;this.log('進入加時 60 秒：下一座外塔決勝。');}
   else {const hp=t=>this.towers.filter(u=>u.team===t).reduce((v,u)=>v+Math.max(0,u.hp),0);this.finish(Math.abs(hp(0)-hp(1))<1?2:hp(0)>hp(1)?0:1,'加時結束，依剩餘建築總生命判定');}
  }
 }
}
const RETIRED=D.retired||[];
const heroCond=H=>H.cond+' '+H.need+(H.alt?'（或場上陣亡 '+H.alt.need+'）':'')+(H.timeNeed?'（或 '+H.timeNeed+' 秒）':'');
const api={heroCond,Battle,HERO_SPLASH,START_ENERGY,REGEN_SLOW,REGEN_MID,REGEN_FAST,REGEN_MID_AT,REGEN_FAST_AT,GROW_AT,THREAT_AGGRO,SPLASH_VS_BUILD,HERO_COUNTER_COST,HERO_ACTIVE_COST,RETIRED,GUARD_ECHOES,GUARD_PAIR,MOVE_SCALE,ITEM_EVERY_BEHIND,ITEM_BEHIND_GAP,pureFaction,PURE_NEED,PURE_BONUS,PURE_BONUS_SPIRIT,PURE_CD,FUSE_COOLDOWN,FUSE_WEAK,FUSE_BURST_WEAK,OMEN_BASE,OMEN_MULT,OMEN_BURST,OMEN_TRAITS,SKILLS,SKILL_COST,ENERGY_FLOOR,CARDS,summons,FUSIONS,FUSE_WINDOW,FUSE_RANGE,SWAP_COST,SWAP_COOLDOWN,HEROES,ITEMS,HERO_SUMMON_EXTRA,HERO_RESPAWN,ITEM_FIRST,ITEM_EVERY,ITEM_MAX,BANNERS,BANNER_HERO,bannerDef,BANNER_NEED,bannerCount,bannerLevels,bannerMods};if(typeof module!=='undefined')module.exports=api;else root.SixEngine=api;
})(globalThis);
