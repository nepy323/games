/* Shared presentation metadata. Classification does not imply elemental damage multipliers. */
(function(root){
const D=typeof module!=='undefined'?require('./cards.js'):root.SixData;
const colors={'物理':'#dfceb2','火藥':'#e8b777','火焰':'#ff915e','神聖':'#ffdf8b','靈魂':'#9cddd7','混沌':'#d59aef','符文':'#91d4ee','自然':'#a5d68e','疾風':'#bbe5d6','血誓':'#e68e8a','腐朽':'#bbbc79','戰令':'#e3ca94','冰霜':'#a8d8f0'};
const paths=['M20 3v5M20 32v5M3 20h5M32 20h5M8 8l4 4M28 28l4 4M8 32l4-4M28 12l4-4M20 11l3 5 6 1-4 5 1 6-6-3-6 3 1-6-4-5 6-1z','M20 4C16 13 9 17 9 24a11 11 0 0022 0C31 17 24 13 20 4zM14 23l6 7 6-7M20 14v16','M7 11l6 7 7-11 7 11 6-7-4 19H11zM13 25h14M14 34h12','M7 11h26v7l-9 4v6h6v6H10v-6h6v-6l-9-4zM20 5v7','M30 5Q7 6 8 25q3 12 14 5Q34 22 30 5zM10 31l16-19M16 24l-1-9M21 20l8 1','M7 7l8 9-2 18-6-11zM33 7l-8 9 2 18 6-11zM16 9l4-4 4 4-4 10z'];
function crest(f,kind='logo'){if(f>=6)kind='badge';return `<img class="faction-crest" src="assets/emblems/${kind}-${f}.webp" alt="" draggable="false">`;}
const TYPE_NAME={troop:'兵種',tactic:'戰術',building:'建築'};
/* 標題下方的類型標記：【戰術】、【兵種】、【建築】，用勢力色 */
function typeTag(c){const col=((D.factions[c.faction]||[])[2])||'#d7b778';return `<b class="kw" style="color:${col}">【${TYPE_NAME[c.type]||''}】</b>`;}
function chips(c){return `<div class="card-chips">${c.tier!=='standard'?`<b class="rank-badge ${c.tier}">${c.tier==='hero'?'英雄':'菁英'}</b>`:''}<span>${typeTag(c)}${c.category}${c.treant?' · 樹人':''}</span><b style="color:${colors[c.element]||'#ddd'}">${c.element}</b></div>`;}
const maps=[{id:'crown',name:'王道殘城',subtitle:'舊王道 · 餘燼與殘旗',weather:'ash',tint:'#beac82',center:.46},{id:'frost',name:'霜墓渡口',subtitle:'永凍河 · 霜雪與魂火',weather:'snow',tint:'#b9d8e9',center:.46},{id:'forge',name:'熔爐隘口',subtitle:'玄鐵山脈 · 火星與蒸氣',weather:'ember',tint:'#e49b5d',center:.46},{id:'grove',name:'蒼林遺跡',subtitle:'古林界線 · 落葉與薄霧',weather:'leaf',tint:'#a1c4a4',center:.46},
 {id:'ch0',story:1,name:'關門之城',subtitle:'舊王道 · 城外的難民道',weather:'ash',tint:'#beac82',center:.45},{id:'ch1',story:1,name:'不眠血渠',subtitle:'血渠 · 泵聲不停',weather:'ember',tint:'#df786c',center:.45},{id:'ch2',story:1,name:'無名之城',subtitle:'空白的路牌',weather:'snow',tint:'#b5a1de',center:.45},{id:'ch3',story:1,name:'不落之爐',subtitle:'凝固的火星',weather:'ember',tint:'#e49b5d',center:.45},{id:'ch4',story:1,name:'一夜千秋',subtitle:'被吞沒的村鎮',weather:'leaf',tint:'#a1c4a4',center:.45},{id:'ch5',story:1,name:'停風長原',subtitle:'不動的風與草',weather:'leaf',tint:'#d5a26d',center:.44}];
function chooseMap(previous,requested='random',random=Math.random){const pool=maps.filter(m=>!m.story&&m.id!==previous);return maps.find(m=>m.id===requested)||pool[Math.floor(random()*pool.length)];}
/* 卡面說明：【關鍵字】用勢力色標出；換行後的段落是技能說明 */
function rules(c){const t=c.rules||c.desc||'',col=((D.factions[c.faction]||[])[2])||'#d7b778';return t.split('\n').map((l,i)=>`<span class="rl${i?' sk':''}">${l.replace(/【([^】]+)】/g,`<b class="kw" style="color:${col}">$1</b>`)}</span>`).join('');}
function rulesText(c){return (c.rules||c.desc||'').replace(/【|】/g,'').replace(/\n/g,' ');}
/* 無背景的單位立繪墊勢力底色：依卡牌勢力（或 f0_ 前綴、guard_N）取色，混入深色避免刺眼 */
function artBack(id){const c=D.cards.find(k=>k.id===id),m=String(id).match(/^f(\d)_|^guard_(\d)/),f=c?c.faction:m?+(m[1]||m[2]):(/^(n_|fuse_|paradox|omen|ringwalker)/.test(id)?6:-1),col=D.factions[f]&&D.factions[f][2];if(!col)return ['#2a312c','#171c18'];const mix=(h,k)=>{const n=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),d=[18,24,20];return '#'+n.map((v,i)=>Math.round(v*k+d[i]*(1-k)).toString(16).padStart(2,'0')).join('');};return [mix(col,.5),mix(col,.2)];}
function artBackDefs(id,k){const [c1,c2]=artBack(id);return `<radialGradient id="${k}g" cx=".5" cy=".42" r=".75"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient>`;}
const api={typeTag,colors,crest,chips,maps,chooseMap,rules,rulesText,artBack,artBackDefs};if(typeof module!=='undefined')module.exports=api;else root.SixPresentation=api;
})(globalThis);
/* 圖面遮罩：維索本人套紫黑色；界環之王的護衛（王之護衛）套金白色。filter 作用在圖上，mul／over 是疊在上面的兩層色 */
globalThis.ART_TINT=Object.assign({story_veso:{filter:'saturate(.55) contrast(1.1)',mul:'#3a1458',mulA:.5,over:'#0c0214',overA:.28,overBlend:'normal'}},
 Object.fromEntries(['earth','storm','aurora'].map(k=>['guard_king_'+k,{filter:'sepia(.3) saturate(1.25) brightness(1.02)',mul:'#f2d98a',mulA:.38,over:'#fff7da',overA:.1,overBlend:'screen'}])));
globalThis.tintLayers=(id,w,h)=>{const t=ART_TINT[id];return t?`<rect width="${w}" height="${h}" fill="${t.mul}" opacity="${t.mulA}" style="mix-blend-mode:multiply"/><rect width="${w}" height="${h}" fill="${t.over}" opacity="${t.overA}" style="mix-blend-mode:${t.overBlend}"/>`:'';};
