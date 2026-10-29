'use strict';
/* 遺物與英雄強化資料；圖示全部用幾何線條即時繪製（48×48 viewBox）。
   若資料帶 src 欄位，圖示改用該圖片，方便日後替換成生成圖。 */
const RELICS=[
 {id:'quartermaster',src:'assets/relics/relic-08.webp',name:'黃銅機心',rarity:'common',frame:'circle',glyph:'key',tint:'#6fd0c4',desc:'每場開局多 2 點資源。'},
 {id:'thickwall',src:'assets/relics/relic-07.webp',name:'古符鐵砧',rarity:'common',frame:'shield',glyph:'wall',tint:'#e2c274',desc:'我方堡壘生命上限 +25%。'},
 {id:'beacon',src:'assets/relics/relic-12.webp',name:'先祖戰鼓',rarity:'common',frame:'hex',glyph:'flame',tint:'#e8895a',desc:'我方堡壘攻擊 +30%。'},
 {id:'spring',src:'assets/relics/relic-02.webp',name:'紫砂時計',rarity:'common',frame:'circle',glyph:'wave',tint:'#6fd0c4',desc:'資源回復速度 +15%。'},
 {id:'vetbadge',src:'assets/relics/relic-09.webp',name:'世界樹種',rarity:'common',frame:'shield',glyph:'chevrons',tint:'#b9c98a',desc:'我方所有單位生命 +12%。'},
 {id:'whetstone',src:'assets/relics/relic-04.webp',name:'軍團號角',rarity:'common',frame:'hex',glyph:'blade',tint:'#e8895a',desc:'我方所有單位攻擊 +12%。'},
 {id:'sparebanner',src:'assets/relics/relic-10.webp',name:'琥珀月蛾',rarity:'rare',frame:'shield',glyph:'flag',tint:'#f0c458',desc:'立即獲得 1 面戰旗（生命）。'},
 {id:'rations',src:'assets/relics/relic-03.webp',name:'血誓聖杯',rarity:'rare',frame:'circle',glyph:'grain',tint:'#d9c58a',desc:'每場勝利後，堡壘耐久回復 25%。'},
 {id:'bounty',src:'assets/relics/relic-06.webp',name:'封骨魔典',rarity:'rare',frame:'hex',glyph:'coin',tint:'#f0c458',desc:'戰後新卡多一個選項（4 選 1）。'},
 {id:'breaker',src:'assets/relics/relic-11.webp',name:'獵王巨牙',rarity:'rare',frame:'shield',glyph:'crack',tint:'#df786c',desc:'敵方堡壘生命 -15%。'},
 {id:'scout',src:'assets/relics/relic-05.webp',name:'幽魂喪鐘',rarity:'rare',frame:'circle',glyph:'eye',tint:'#9fc2ea',desc:'敵方開局資源 -1。'},
 {id:'kingsring',src:'assets/relics/relic-01.webp',name:'破王之冠',rarity:'rare',frame:'hex',glyph:'crown',tint:'#ffd36a',desc:'英雄強化多一個選項（4 選 1）。'}
];
const HERO_UPS=[
 {id:'hp',src:'assets/icons/up-hp.webp',name:'鋼骨',glyph:'wall',tint:'#e2c274',desc:'英雄生命 +20%。'},
 {id:'dmg',src:'assets/icons/up-dmg.webp',name:'利刃',glyph:'blade',tint:'#e8895a',desc:'英雄攻擊 +20%。'},
 {id:'speed',src:'assets/icons/up-speed.webp',name:'疾行',glyph:'chevrons',tint:'#b9c98a',desc:'英雄移動速度 +15%。'},
 {id:'grant',src:'assets/icons/up-grant.webp',name:'戰吼',glyph:'wave',tint:'#6fd0c4',desc:'英雄登場時回復 1 點資源。'},
 {id:'shield',src:'assets/icons/up-shield.webp',name:'聖衣',glyph:'crack',tint:'#9fc2ea',desc:'英雄登場時獲得 250 點護盾（10 秒）。'}
];
const RELIC_PRIMS={
 key:t=>`<circle cx="18" cy="24" r="6" fill="none" stroke="${t}" stroke-width="2.4"/><path d="M24 24h14M33 24v6M38 24v4" fill="none" stroke="${t}" stroke-width="2.4" stroke-linecap="round"/>`,
 wall:t=>`<path d="M12 18h24v6H12zM12 24h11v6H12zM25 24h11v6H25zM12 30h24v5H12z" fill="none" stroke="${t}" stroke-width="2" stroke-linejoin="round"/>`,
 flame:t=>`<path d="M24 11c1 6 8 9 8 17a8 8 0 0 1-16 0c0-4 2-6 3-8 1 3 3 4 4 4-1-4-1-8 1-13z" fill="none" stroke="${t}" stroke-width="2.2" stroke-linejoin="round"/>`,
 wave:t=>`<path d="M10 19q4-5 7 0t7 0 7 0 7 0M10 26q4-5 7 0t7 0 7 0 7 0M10 33q4-5 7 0t7 0 7 0 7 0" fill="none" stroke="${t}" stroke-width="2.2" stroke-linecap="round"/>`,
 chevrons:t=>`<path d="M14 19l10-7 10 7M14 27l10-7 10 7M14 35l10-7 10 7" fill="none" stroke="${t}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
 blade:t=>`<path d="M24 9l5 22-5 8-5-8z" fill="none" stroke="${t}" stroke-width="2.2" stroke-linejoin="round"/><path d="M17 31h14" stroke="${t}" stroke-width="2.4" stroke-linecap="round"/>`,
 flag:t=>`<path d="M16 38V10M16 12h18l-5 6 5 6H16" fill="none" stroke="${t}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>`,
 grain:t=>`<path d="M24 38V14M24 20l-7-5M24 20l7-5M24 27l-7-5M24 27l7-5M24 34l-7-5M24 34l7-5" fill="none" stroke="${t}" stroke-width="2.2" stroke-linecap="round"/>`,
 coin:t=>`<path d="M24 10l12 14-12 14-12-14z" fill="none" stroke="${t}" stroke-width="2.4" stroke-linejoin="round"/><path d="M24 17v14M19 24h10" stroke="${t}" stroke-width="2" stroke-linecap="round"/>`,
 crack:t=>`<path d="M24 9l-7 11 8 4-6 8 9-3-3 9" fill="none" stroke="${t}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>`,
 eye:t=>`<path d="M8 24q16-16 32 0-16 16-32 0z" fill="none" stroke="${t}" stroke-width="2.2" stroke-linejoin="round"/><circle cx="24" cy="24" r="4.5" fill="${t}"/>`,
 crown:t=>`<path d="M11 34l3-16 7 8 3-12 3 12 7-8 3 16z" fill="none" stroke="${t}" stroke-width="2.2" stroke-linejoin="round"/>`
};
const RELIC_FRAMES={
 circle:'<circle cx="24" cy="24" r="21"/>',
 hex:'<path d="M24 3l18 10.5v21L24 45 6 34.5v-21z"/>',
 shield:'<path d="M24 3l18 6v14c0 10-8 17-18 22C14 40 6 33 6 23V9z"/>'
};
function relicIcon(r,size=48){
 if(r.src)return `<img class="relic-ico" width="${size}" height="${size}" src="${r.src}" alt="">`;
 const rare=r.rarity==='rare',line=rare?'#e6c46f':'#a9ad9a';
 return `<svg class="relic-ico ${r.rarity||''}" width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true"><g fill="#0e150f" stroke="${line}" stroke-width="${rare?2.2:1.6}" stroke-linejoin="round">${RELIC_FRAMES[r.frame||'circle']}</g>${rare?`<g fill="none" stroke="${line}" stroke-width=".8" opacity=".5" transform="translate(24 24) scale(.88) translate(-24 -24)">${RELIC_FRAMES[r.frame||'circle']}</g>`:''}${(RELIC_PRIMS[r.glyph]||RELIC_PRIMS.coin)(r.tint)}</svg>`;
}
if(typeof module!=='undefined')module.exports={RELICS,HERO_UPS,relicIcon};
