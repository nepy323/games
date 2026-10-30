'use strict';
/* 直式卡面：上方名稱條＋費用、中間插圖、下方型態條與數值。手牌、爬塔獎勵共用。 */
/* 兵種／效果圖示：幾何線條，24×24 視窗，描邊色取自 currentColor */
const CLASS_GLYPH={
 shield:'<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.500-7-4.500-7-9V6z"/>',
 spear:'<path d="M5 19L18 6M18 6l-5 .5M18 6l-.5 5M7 17l-2 2"/>',
 bow:'<path d="M7 4c7 3 7 13 0 16M7 12h12M16 9l3 3-3 3"/>',
 rider:'<path d="M3 20L17 6M17 6l-5 .5M17 6l-.5 5M3 13l4-1M5 17l3-1"/><path d="M13 20l8-8"/>',
 cross:'<path d="M12 5v14M5 12h14"/><circle cx="12" cy="12" r="8"/>',
 siege:'<circle cx="8" cy="16" r="3.5"/><path d="M10.500 13.500L19 5M17 4l3 3"/>',
 wing:'<path d="M3 15c5-1 8-5 9-10 1 5 4 9 9 10-4 0-6 1-9 5-3-4-5-5-9-5z"/>',
 banner:'<path d="M7 21V4M7 5h12l-3 4 3 4H7"/>',
 tower:'<path d="M6 21V9h12v12M5 9V5h3v2h2V5h4v2h2V5h3v4M10 21v-5h4v5"/>',
 swarm:'<circle cx="7" cy="16" r="2.500"/><circle cx="17" cy="16" r="2.500"/><circle cx="12" cy="8" r="2.500"/>',
 blade:'<path d="M5 19L19 5M14 5h5v5M5 19l3-1-2-2z"/>',
 mage:'<path d="M12 3l2.200 6.300 6.300.2-5 4 1.800 6.500L12 16l-5.300 4 1.800-6.500-5-4 6.300-.2z"/>',
 colossus:'<path d="M5 20V10l3-3h8l3 3v10M9 12h2M13 12h2M9 20v-4h6v4"/>',
 flame:'<path d="M12 3c1 5 6 7 6 12a6 6 0 0 1-12 0c0-3 2-4 3-6 1 2 2 3 3 3-1-3-1-6 0-9z"/>',
 trap:'<path d="M3 19l3-9 3 9M9 19l3-12 3 12M15 19l3-9 3 9"/>',
 burst:'<path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3.500 3.500M14.500 14.500L18 18M18 6l-3.500 3.500M9.500 14.500L6 18"/>',
 up:'<path d="M12 20V6M6 12l6-6 6 6"/>',
 chain:'<circle cx="9" cy="12" r="4.500"/><circle cx="15" cy="12" r="4.500"/>',
 portal:'<ellipse cx="12" cy="12" rx="5" ry="9"/><ellipse cx="12" cy="12" rx="2" ry="5"/>',
 drop:'<path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z"/>',
 aim:'<circle cx="12" cy="12" r="7"/><path d="M12 2v6M12 16v6M2 12h6M16 12h6"/>',
 sq:'<rect x="6" y="6" width="12" height="12" fill="currentColor" stroke="none"/>',
 tri:'<path d="M12 5l8 14H4z" fill="currentColor" stroke="none"/>',
 dia:'<path d="M12 3l8 9-8 9-8-9z" fill="currentColor" stroke="none"/>',
 circ:'<circle cx="12" cy="12" r="7" fill="currentColor" stroke="none"/>',
 hex:'<path d="M12 3l7.500 4.500v9L12 21l-7.500-4.500v-9z" fill="currentColor" stroke="none"/>',
 bar:'<rect x="3" y="9" width="18" height="6" rx="1" fill="currentColor" stroke="none"/>',
 tdown:'<path d="M12 19L4 5h16z" fill="currentColor" stroke="none"/>'
};
/* 兵種職業形狀：方塊＝前排、三角＝突擊、菱形＝遠程、圓＝法術控制、六邊形＝支援、橫條＝攻城、倒三角＝飛行 */
const SHAPE_BY_CATEGORY={'前排':'sq','防護':'sq','反重甲':'sq','巨獸':'sq','突擊':'tri','騎兵':'tri','獵獸':'tri','反騎兵':'tri','集群':'tri','噴火兵':'tri','射手':'dia','投石兵':'dia','砲兵':'dia','區域傷害':'dia','法師':'circ','控制法師':'circ','召喚師':'circ','控制':'circ','控制巨獸':'circ','支援':'hex','治療':'hex','軍團增益':'hex','軍團核心':'hex','攻城':'bar','攻城砲兵':'bar','攻城機械':'bar','攻城巨獸':'bar','飛行突擊':'tdown'};
const CLASS_BY_CATEGORY={'前排':'shield','防護':'shield','反騎兵':'spear','射手':'bow','投石兵':'bow','騎兵':'rider','突擊':'blade','支援':'cross','治療':'cross','砲兵':'siege','攻城砲兵':'siege','轟擊':'siege','攻城機械':'siege','攻城':'siege','飛行突擊':'wing','軍團增益':'banner','軍團核心':'banner','防禦建築':'tower','產兵建築':'tower','傳送門':'portal','集群':'swarm','獵獸':'blade','法師':'mage','控制法師':'mage','召喚師':'mage','召喚':'mage','詛咒':'mage','控制':'mage','攻城巨獸':'colossus','控制巨獸':'colossus','噴火兵':'flame','陷阱':'trap','區域傷害':'burst','單體傷害':'aim'};
const EFFECT_GLYPH={bomb:'burst',barrage:'burst',fire:'flame',bolt:'aim',heal:'cross',shield:'shield',armor:'shield',haste:'up',speed:'up',rush:'up',power:'up',frenzy:'flame',sacrifice:'drop',curse:'chain',slow:'chain',root:'chain',summon:'portal',portal:'portal',mine:'trap',resonate:'chain'};
const glyphSVG=(key,cls='')=>`<svg class="yc-glyph ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${CLASS_GLYPH[key]||CLASS_GLYPH.shield}</svg>`;
/* 兵種職能圖示：GPT 生成的白色剪影（assets/roles/*.png），用 mask 上色，顏色跟著卡框；沒有對應圖示的職能退回上面的幾何形狀 */
const ROLE_BY_CATEGORY={'前排':'shield','防護':'shield','反重甲':'antiarmor','巨獸':'colossus','反騎兵':'spear','射手':'bow','投石兵':'sling','騎兵':'rider','突擊':'blade','獵獸':'claw','飛行突擊':'wing','支援':'support','治療':'support','軍團增益':'banner','軍團核心':'banner','集群':'swarm','法師':'mage','控制法師':'control','控制':'control','控制巨獸':'colossus','召喚師':'summoner','召喚':'summoner','詛咒':'curse','砲兵':'cannon','攻城砲兵':'cannon','轟擊':'cannon','攻城':'ram','攻城機械':'ram','攻城巨獸':'colossus','噴火兵':'flame','區域傷害':'burst','單體傷害':'aim','防禦建築':'tower','產兵建築':'tower','圖騰':'tower','陷阱':'trap','傳送門':'portal'};
const ROLE_BY_EFFECT={bomb:'burst',barrage:'cannon',fire:'flame',bolt:'aim',heal:'support',shield:'shield',armor:'shield',haste:'haste',speed:'haste',rush:'haste',power:'haste',frenzy:'flame',sacrifice:'sacrifice',curse:'curse',slow:'curse',root:'curse',summon:'summoner',portal:'portal',mine:'trap',resonate:'summoner'};
const roleKey=c=>c.type==='tactic'?ROLE_BY_EFFECT[c.effect]:c.type==='building'||c.totem?'tower':ROLE_BY_CATEGORY[c.category];
const roleIcon=(k,cls='')=>`<span class="yc-glyph yc-role ${cls}" style="--m:url(assets/roles/${k}.png)" aria-hidden="true"></span>`;
const badgeGlyph=c=>{const k=roleKey(c);return k?roleIcon(k):glyphSVG(classGlyphKey(c));};
const classGlyphKey=c=>c.type==='tactic'?(EFFECT_GLYPH[c.effect]||'burst'):c.type==='building'||c.totem?'tower':(SHAPE_BY_CATEGORY[c.category]||'sq');

/* 直式卡面：名稱條＋費用、插圖（右下兵種圖示、左下旗徽）、數值條。框色：普通=古銅、菁英=銀藍、英雄=金、戰術=紫。手牌、爬塔獎勵共用。 */
function cardFace(c,o={}){
 const f=factions[c.faction],tier=c.type==='tactic'?'tactic':c.tier==='hero'?'hero':c.tier==='elite'?'elite':'';
 const stats=c.type==='tactic'?`<span class="yc-eff">${effects[c.effect]||'戰術'}</span>`
  :c.totem?`<span class="st-atk" title="攻擊">${c.dmg||0}</span><span class="st-dur" title="持續時間">${c.duration}<i>秒</i></span>`
  :`<span class="st-atk" title="攻擊">${c.dmg||0}</span><span class="st-hp" title="生命">${c.hp}${c.n>1?'<i>×'+c.n+'</i>':''}</span>`;
 const art=String(icon(c)).replace('<svg class="unit-art"','<svg preserveAspectRatio="xMidYMid slice" class="unit-art"');
 const kw=[c.charge?['衝鋒','rider']:null].filter(Boolean).map(([t,k])=>`<span class="yc-kw" title="${t}">${k==='rider'?roleIcon('rider'):glyphSVG(k)}</span>`).join('');
 return `<div class="ycard ${tier} ${c.type==='building'?'bld':''} ${c.omen?'omen':''}" style="--f:${f[2]}"><div class="yc-top"><strong>${c.tier==='hero'?c.name.split('・')[0]:c.name}</strong><span class="yc-cost">${c.cost}</span></div><div class="yc-art">${art}<span class="yc-crest">${SixPresentation.crest(c.faction)}</span>${o.hotkey?`<span class="yc-key">${o.hotkey}</span>`:''}<span class="yc-badges">${kw}<span class="yc-class" title="${c.category||effects[c.effect]||''}">${badgeGlyph(c)}</span></span></div><div class="yc-stats">${stats}</div></div>`;
}

/* 長按手牌（或右鍵）開啟完整卡牌；不影響一般點選 */
(()=>{let timer=null,fired=false;
 const cancel=()=>{clearTimeout(timer);timer=null;};
 document.addEventListener('pointerdown',e=>{const b=e.target.closest&&e.target.closest('.handcard');if(!b||typeof openCardArt!=='function')return;fired=false;cancel();
  timer=setTimeout(()=>{fired=true;const id=battle&&battle.players[0].hand[+b.dataset.slot];if(id)openCardArt(id);},450);});
 ['pointerup','pointerleave','pointercancel','pointermove'].forEach(t=>document.addEventListener(t,e=>{if(t==='pointermove'&&Math.abs(e.movementX)+Math.abs(e.movementY)<3)return;cancel();}));
 document.addEventListener('click',e=>{if(fired&&e.target.closest&&e.target.closest('.handcard')){e.stopImmediatePropagation();e.preventDefault();fired=false;}},true);
 document.addEventListener('contextmenu',e=>{const b=e.target.closest&&e.target.closest('.handcard');if(b&&typeof openCardArt==='function'){e.preventDefault();const id=battle&&battle.players[0].hand[+b.dataset.slot];if(id)openCardArt(id);}});
})();

/* 旗印：同旗 2/4/6 張解鎖三檔。回傳牌組中每個有卡的旗系，附亮點與目前效果 */
function bannerSummary(deck,extra=[]){
 const {BANNERS,BANNER_NEED,bannerCount,bannerLevels}=SixEngine,cnt=bannerCount(deck,extra),lv=bannerLevels(deck,extra);
 return cnt.map((n,f)=>({f,n,lv:lv[f],b:BANNERS[f],fac:factions[f]})).filter(o=>o.n>0);
}
function bannerHTML(deck,extra=[]){
 const {BANNER_NEED}=SixEngine,rows=bannerSummary(deck,extra);
 if(!rows.length)return '';
 return '<div class="banner-box"><div class="banner-title">旗印<small>同旗 2／4／6 張解鎖</small></div>'+rows.map(o=>{
  const next=o.lv<3?`再 ${BANNER_NEED[o.lv]-o.n} 張：${o.b.text[o.lv]}`:'已達最高檔';
  const now=o.lv?o.b.text[o.lv-1]:'尚未解鎖';
  return `<div class="banner-row ${o.lv?'on':''}" style="--f:${o.fac[2]}"><span class="b-crest">${SixPresentation.crest(o.f)}</span><span class="b-name"><b>${o.fac[0].slice(0,2)}·${o.b.name}</b><i class="pips">${[0,1,2].map(k=>`<s class="${k<o.lv?'lit':''}"></s>`).join('')}</i><em>${o.n} 張</em></span><span class="b-fx">${now}</span><span class="b-next">${next}</span></div>`;
 }).join('')+'</div>';
}

/* 開戰前的一行旗印摘要（只列已解鎖的） */
function bannerLine(deck,extra=[]){
 const on=bannerSummary(deck,extra).filter(o=>o.lv);
 if(!on.length)return '';
 return '<div class="banner-line">'+on.map(o=>`<span style="--f:${o.fac[2]}"><b>${o.fac[0].slice(0,2)}·${o.b.name} ${['Ⅰ','Ⅱ','Ⅲ'][o.lv-1]}</b> ${o.b.text[o.lv-1]}</span>`).join('')+'</div>';
}
