'use strict';
/* 直式卡面：上方名稱條＋費用、中間插圖、下方型態條與數值。手牌、爬塔獎勵共用。 */
function cardFace(c,o={}){
 const f=factions[c.faction],tier=c.tier==='hero'?'hero':c.tier==='elite'?'elite':'';
 const tierName=tier==='hero'?'英雄':tier==='elite'?'菁英':names[c.type];
 const kind=c.siege?'攻城':c.airHit?'對空':c.type==='tactic'?effects[c.effect]:c.type==='building'?'陣地':'地面';
 const stats=c.type==='tactic'?`<span class="yc-eff">${effects[c.effect]||'戰術'}</span>`
  :`<span title="攻擊">⚔ ${c.dmg||0}</span><span title="生命">♥ ${c.hp}${c.n>1?'<i>×'+c.n+'</i>':''}</span>`;
 const art=String(icon(c)).replace('<svg class="unit-art"','<svg preserveAspectRatio="xMidYMid slice" class="unit-art"');
 return `<div class="ycard ${tier}" style="--f:${f[2]}"><div class="yc-top"><strong>${c.tier==='hero'?c.name.split('・')[0]:c.name}</strong><span class="yc-cost">${c.cost}</span></div><div class="yc-art">${art}<span class="yc-crest">${SixPresentation.crest(c.faction)}</span>${o.hotkey?`<span class="yc-key">${o.hotkey}</span>`:''}</div><div class="yc-type">${tierName} · ${kind}</div><div class="yc-stats">${stats}</div></div>`;
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
