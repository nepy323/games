'use strict';
const $=id=>document.getElementById(id),{cards,factions,presets}=SixData,{Battle,CARDS}=SixEngine,cv=$('field'),ctx=cv.getContext('2d');
const names={troop:'兵種',tactic:'戰術',building:'建築'},effects={portal:'傳送門／共鳴',bomb:'延遲轟擊',barrage:'多段轟擊',fire:'持續傷害',curse:'腐朽／抑制治療',root:'定身',slow:'減速',haste:'攻速強化',shield:'吸收護盾',frenzy:'攻速／自損',sacrifice:'獻祭強化',armor:'區域減傷',mine:'地面陷阱',heal:'持續治療',speed:'移速強化',power:'傷害強化',rush:'疾行／易傷',summon:'召喚',bolt:'單體解場'};
let legacyDeck=null;
let deck=[...presets[0][2]],draft=[],battle,selected=-1,mode='ready',speed=1,mouse=null,filter='all',view='battle',sound=false,audioContext,lastHand='',lastLog='',uiClock=0;
try{const saved=JSON.parse(localStorage.getItem('six-banners-deck'));if(Array.isArray(saved)&&saved.length===8&&new Set(saved).size===8&&saved.every(x=>CARDS[x])){if(saved.filter(x=>CARDS[x].tier==='hero').length<=1)deck=saved;else legacyDeck=saved;}sound=localStorage.getItem('six-banners-sound')==='1';}catch{}
/* 英雄格：英雄不在牌組內。舊存檔牌組中的英雄會移到英雄格，原位補一張同勢力普通牌 */
let draftHero='';
let heroSlot=(()=>{try{return localStorage.getItem('six-banners-hero')||'';}catch{return '';}})();
if(!SixEngine.HEROES[heroSlot])heroSlot=presets[0][3][0];
{const h=deck.find(id=>CARDS[id].tier==='hero');if(h){heroSlot=h;const fill=Object.values(CARDS).find(c=>c.faction===CARDS[h].faction&&c.type==='troop'&&c.tier==='standard'&&c.cost<=4&&!deck.includes(c.id));deck=deck.map(id=>id===h?(fill||CARDS.f0_0).id:id);try{localStorage.setItem('six-banners-deck',JSON.stringify(deck));}catch{}}}
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('show'),2700);}
function beep(freq=240,length=.06){if(!sound)return;try{audioContext??=new(window.AudioContext||window.webkitAudioContext)();const o=audioContext.createOscillator(),g=audioContext.createGain();o.type='triangle';o.frequency.value=freq;g.gain.setValueAtTime(.025,audioContext.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+length);o.connect(g);g.connect(audioContext.destination);o.start();o.stop(audioContext.currentTime+length);}catch{}}

const atlasImages={};for(const a of Object.values(SixArt)){if(!atlasImages[a.src]){const im=new Image();im.src=a.src;atlasImages[a.src]=im;}}
let artSerial=0;
function sceneArt(c){const a=SixScenes[c.id];if(!a)return artSVG(c.id,'portrait');const clip='scene'+(++artSerial);return `<svg class="scene-art" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${c.name}插畫"><defs><clipPath id="${clip}"><rect width="100" height="100"/></clipPath></defs><g clip-path="url(#${clip})"><image preserveAspectRatio="none" href="${a.src}" x="${-a.col*100}" y="${-a.row*100}" width="${(a.cols||3)*100}" height="${(a.rows||4)*100}"/></g></svg>`;}

function artSVG(id,side){const a=SixArt[id];if(!a)return '';const [x,y,w,h]=a[side],clip='art'+(++artSerial);return `<svg class="unit-art" viewBox="0 0 ${w} ${h}" aria-hidden="true"><defs><clipPath id="${clip}"><rect width="${w}" height="${h}"/></clipPath></defs><g clip-path="url(#${clip})"><image href="${a.src}" x="${-x}" y="${-y}" width="${a.width}" height="${a.height}"/></g></svg>`;}
function directions(c){return SixArt[c.id]?`<div class="unit-directions"><figure>${artSVG(c.id,'back')}<figcaption>我方 · 背面</figcaption></figure><figure>${artSVG(c.id,'front')}<figcaption>敵方 · 正面</figcaption></figure></div>`:'';}

function icon(c){
 if(SixScenes[c.id])return sceneArt(c);
 if(SixArt[c.id])return artSVG(c.id,"portrait");
 const col=factions[c.faction][2],r=c.role;let art='';
 if(c.type==='tactic')art='<circle cx="50" cy="39" r="23"/><circle cx="50" cy="39" r="17" stroke-dasharray="3 6"/><path d="M50 10v10m0 38v10M20 39h10m40 0h10M43 29l14 10-14 10 4-10z"/>';
 else if(c.type==='building')art='<path d="M29 63V27h9v9h8V22h8v14h8v-9h9v36zM44 63V49h12v14M25 63h50"/><path d="M49 22V10h20l-6 6 6 6H49"/>';
 else if(['弩','弓','鷹'].includes(r))art='<path d="M39 14q32 24 0 49l11-24zM24 39h47m-9-7 9 7-9 7"/>';
 else if(['砲','銃','輪'].includes(r))art='<circle cx="35" cy="55" r="10"/><circle cx="62" cy="55" r="10"/><path d="M30 46h40l-7-10H42l26-19 7 9-24 19M26 64h50"/>';
 else if(['杖','符','鼓'].includes(r))art='<path d="M40 65l18-45M52 12l13 4 3 13-13 6-9-10zM27 34l8-5m31 17 8 5M27 54l7 2"/><circle cx="57" cy="24" r="5"/>';
 else if(['盾','王'].includes(r))art='<path d="M50 14l22 8v22Q69 57 50 67 31 57 28 44V22zM50 23v31M39 34h22"/>';
 else if(['翼','魂'].includes(r))art='<path d="M49 53Q20 52 14 19l24 12 12-8 12 8 24-12Q80 52 51 53L50 65zM25 31l17 10m33-10L58 41"/>';
 else if(['巨','樹','獠'].includes(r))art='<path d="M32 62l5-21-9-13 11-9 11 7 11-7 11 9-9 13 5 21H55l-5-16-5 16zM39 34h5m12 0h5M36 15l-7-8m35 8 7-8"/>';
 else if(['騎','狼'].includes(r))art='<path d="M26 59l7-25 18-8 9-13 15 9-5 18-14 1-4 18M34 35l-8-9M34 44l14 4M39 59l4-13M59 25l7 3"/>';
 else if(r==='骨')art='<path d="M35 37Q26 14 50 13q24 1 15 24l-8 5v9H43v-9zM43 51v7m7-7v7m7-7v7M26 65l48-12M26 53l48 12"/><circle cx="41" cy="30" r="4"/><circle cx="59" cy="30" r="4"/>';
 else art='<path d="M32 62l7-11M36 47l11 11M40 51L61 14l9 0 0 9-25 33M31 18l33 44M26 57l13 8"/>';
 if(c.type==='tactic'){const symbols={summon:'M37 45l5-17 8 7 8-7 5 17-13 9z',bomb:'M40 26l20 26M60 26L40 52M50 22v34M34 39h32',barrage:'M38 25l-5 23m17-25-5 23m17-21-5 23',fire:'M50 20q18 20 8 32-8 9-17-3-8-12 9-29z',curse:'M37 28l26 23M38 50l24-22M43 23l15 31',root:'M50 23v32M50 42L36 29m14 7 13-9M50 50l-14 1',heal:'M46 25h8v10h10v8H54v10h-8V43H36v-8h10z',shield:'M50 23l16 7-4 18-12 8-12-8-4-18z',armor:'M50 23l16 7-4 18-12 8-12-8-4-18z',bolt:'M53 20L40 41h10l-3 17 15-23H51z',speed:'M37 29l13 10-13 10m15-20 13 10-13 10',rush:'M37 29l13 10-13 10m15-20 13 10-13 10',slow:'M39 26h22L42 52h18M39 52l22-26',mine:'M50 25v28M36 39h28M40 29l20 20m0-20L40 49',power:'M38 48l12-22 12 22M43 42h14',haste:'M38 48l12-22 12 22m-24-9 12-16 12 16',frenzy:'M50 23l-12 20 12 10 12-10z',sacrifice:'M50 23l-12 20 12 10 12-10z'};art='<circle cx="50" cy="39" r="26"/><circle cx="50" cy="39" r="22" stroke-dasharray="2 7"/><path d="'+(symbols[c.effect]||symbols.power)+'"/>'; }
 return `<svg viewBox="0 0 100 80" aria-hidden="true"><path d="M15 7h70v55L50 76 15 62z" fill="${col}09" stroke="${col}20"/><g stroke="${col}" stroke-width="2.1" fill="${col}12" stroke-linecap="round" stroke-linejoin="round">${art}</g></svg>`;
}
function info(c){
 let stats=[['種族',c.race],['定位',c.category],['屬性',c.element],['資源',c.cost],['部署',c.type!=='tactic'||c.homeOnly||c.effect==='mine'?'己方半場':'全戰場']];
 if(c.type!=='tactic')stats.push(['生命',c.hp+(c.n>1?' × '+c.n:'')],['傷害／間隔',c.dmg+' / '+c.rate+' 秒'],['攻擊目標',c.siege?'僅建築':c.airHit?'地面、空中、建築':'地面、建築'],['射程',c.range],['特性',[c.flying?'飛行':null,c.charge?'衝鋒':null,c.splash?'範圍攻擊':null,c.cone?'錐形火焰':null,c.revive?'一次復起':null,c.deathBlast?'死亡爆炸':null,c.antiLarge?'反大型':null,c.heal?'治療':null,c.ward?'裝甲光環':null,c.aura?'攻速光環':null,c.companion?'伴隨獵鷹':null,c.regen?'生命恢復':null,c.slowHit?'命中緩速':null,c.summon?'週期產兵':null,c.armor?'護甲':null].filter(Boolean).join('、')||'基礎作戰']);
 else stats.push(['效果',effects[c.effect]],['作用半徑',c.radius],...(c.damage?[['傷害',c.damage+(c.effect==='fire'||c.effect==='curse'?' / 秒':'')]]:[]),...(c.duration?[['持續',c.duration+' 秒']]:[]),...(c.delay?[['預告',c.delay+' 秒']]:[]));
 if(c.type==='building')stats.push(['存在時間',c.duration+' 秒，持續衰敗']);
 return `<div class="detail-head"><span class="detail-art" data-inspect="${c.id}" title="點擊查看完整卡牌">${icon(c)}</span><div><h3>${c.name}</h3><small style="color:${factions[c.faction][2]}">${factions[c.faction][0]} · ${names[c.type]}</small></div></div>${SixPresentation.chips(c)}<p class="detail-desc">${c.rules||c.desc}${c.experimental?' <span class="testtag">原型新增</span>':''}</p><dl>${stats.map(([a,b])=>`<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl>`;
}
function selectedPreset(){return presets.findIndex(p=>p[2].every((id,i)=>deck[i]===id));}
function deckMeta(){if($('runeStatus'))$('runeStatus').textContent='';if($('bannerNote'))$('bannerNote').innerHTML=bannerLine(deck,heroSlot?[heroSlot]:[]);const i=selectedPreset();$('preset').value=i<0?'custom':String(i);$('strategy').textContent=i<0?'自由混編：留意對空、解場與穩定的攻塔手段。':presets[i][1];$('factionStrip').innerHTML=factions.map((f,i)=>{const n=deck.filter(id=>CARDS[id].faction===i).length;return n?`<span title="${f[0]} ${n} 張" style="color:${f[2]}">${f[3]}${n}</span>`:'';}).join('');}
$('preset').innerHTML=presets.map((p,i)=>`<option value="${i}">${p[0]}</option>`).join('')+'<option value="custom" disabled>自訂混編</option>';
$('enemyPreset').innerHTML+=presets.map((p,i)=>`<option value="${i}">${p[0]}</option>`).join('');
function newLobby(){
 if(typeof cancelMatch==='function')cancelMatch();
 const e=$('enemyPreset').value;const enemy=e==='random'?presets[Math.floor(Math.random()*presets.length)]:presets[+e];
 battle=new Battle(deck,enemy[2],Date.now(),{shuffle:true,heroes:[[heroSlot],enemy[3]||[]],items:true});resetVisuals();battle.enemyName=enemy[0];battle.state='ready';mode='ready';selected=-1;lastHand='';lastLog='';
 $('overlay').style.display='flex';$('modalTitle').textContent='把停下的世界，接回去。';$('modalText').innerHTML='佈陣、反制、突破。<br>摧毀敵方主堡，贏下這一局。';$('start').innerHTML='尋找對戰 <span>→</span>';$('modalHint').textContent='';$('resultStats').innerHTML='';$('pause').textContent='暫停';$('preset').disabled=false;$('enemyPreset').disabled=false;$('mapChoice').disabled=false;$('hint').textContent='你的軍團已就緒';deckMeta();$('detail').innerHTML='';renderHand();updateUI();
}
function start(){
 if(mode==='paused'){resume();return;}
 if(mode==='ended')newLobby();
 selectBattlefield();battle.state='playing';mode='playing';battle.auto[0]=$('watch').checked;$('overlay').style.display='none';$('preset').disabled=true;$('enemyPreset').disabled=true;$('mapChoice').disabled=true;$('hint').textContent=battle.auto[0]?'觀戰中：雙方使用相同資源與輪替規則':'選擇卡牌，再點擊己方半場部署';beep(290,.14);
}
function pause(){if(mode!=='playing')return;battle.state='paused';mode='paused';$('overlay').style.display='flex';$('modalHint').textContent='調整部署思路，準備繼續交鋒';$('modalTitle').textContent='軍令暫止';$('modalText').innerHTML='戰場已暫停。<br>繼續後，部隊將恢復交戰。';$('start').textContent='繼續作戰 →';$('resultStats').innerHTML='';$('pause').textContent='繼續';}
function resume(){if(mode!=='paused')return;battle.state='playing';mode='playing';$('overlay').style.display='none';$('pause').textContent='暫停';}
function endUI(){mode='ended';$('overlay').style.display='flex';$('modalTitle').textContent=battle.winner===0?'你贏下了這一局。':battle.winner===1?'這一局沒守住，再來一次。':'兩軍相持，未分勝負。';$('modalText').textContent=battle.reason+' · 敵軍：'+battle.enemyName;const s=battle.stats[0];$('resultStats').innerHTML=`施放 ${s.casts} 張卡牌　消耗 ${s.spent} 點資源<br>造成塔傷 ${Math.round(s.towerDamage)}　摧毀外塔 ${battle.score(0)}`;$('start').textContent='再次尋找對戰 →';$('modalHint').textContent='可前往「軍備與構築」調整下一場牌組';$('preset').disabled=false;$('enemyPreset').disabled=false;beep(battle.winner===0?440:110,.35);}
function renderHand(){const p=battle.players[0];const key=p.hand.join(',')+selected;if(key===lastHand)return;lastHand=key;$('hand').innerHTML=p.hand.map((id,i)=>{const c=CARDS[id];return `<button style="--f:${factions[c.faction][2]}" data-faction="${c.faction}" class="handcard ${selected===i?'selected':''}" data-slot="${i}" aria-label="${c.name}，${c.cost} 費，${names[c.type]}">${cardFace(c,{hotkey:i+1})}</button>`;}).join('');$('hand').querySelectorAll('button').forEach((b,i)=>b.onclick=()=>selectCard(i));$('next').textContent=CARDS[p.queue[0]].name;}
function selectCard(i){
 const c=CARDS[battle.players[0].hand[i]];$('detail').innerHTML=info(c);
 if(mode!=='playing'){if(mode==='ready')toast('開戰後即可部署；目前可查看卡牌資訊。');return;}
 if(battle.auto[0]){toast('目前為觀戰模式，取消觀戰勾選即可接管。');return;}
 selected=selected===i?-1:i;renderHand();if(selected<0){$('hint').textContent='選擇卡牌，再點擊戰場';return;}
 $('hint').textContent=c.type==='tactic'&&!c.homeOnly&&c.effect!=='mine'?c.name+'：點擊目標區域':c.name+'：點擊己方半場';beep(330);
}
function updateUI(){
 const t=Math.ceil(battle.remaining),p=battle.players[0];$('resonance').hidden=!p.deck.includes('x_portal');$('resonance').textContent='共鳴 '+p.resonance+' / 12 · 下一波最多消耗 4';$('timer').textContent=String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');$('phase').textContent=battle.overtime?'加時 · 外塔決勝':t<=60?'雙倍資源 ×2':'';$('energy').textContent=Math.trunc(p.energy);$('energy').classList.toggle('debt',p.energy<0);$('energyFill').style.width=Math.max(0,p.energy)*10+'%';$('regen').textContent=p.energy>=9.99?'資源已滿':t<=60||battle.overtime?'雙倍回復':'戰力回復';$('playerScore').textContent='◆'.repeat(battle.score(0))+'◇'.repeat(2-battle.score(0));$('enemyScore').textContent='◆'.repeat(battle.score(1))+'◇'.repeat(2-battle.score(1));renderHand();$('hand').querySelectorAll('button').forEach((b,i)=>{const c=CARDS[p.hand[i]],alive=c.tier==='hero'&&battle.units.some(u=>u.team===0&&u.artId===c.id&&u.hp>0);b.classList.toggle('poor',c.cost>p.energy||alive);b.title=alive?'英雄仍在場，陣亡後可再次部署':c.abilityName||c.name;});
 const lk=battle.logs.map(x=>x.text+x.time).join('');if(lk!==lastLog){lastLog=lk;$('log').innerHTML=battle.logs.map(l=>`<div><time>${Math.floor(l.time/60)}:${String(Math.floor(l.time%60)).padStart(2,'0')}</time>${l.text}</div>`).join('');}
}
function point(e){const r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*600,y:(e.clientY-r.top)/r.height*700};}
cv.onpointermove=e=>mouse=point(e);cv.onpointerleave=()=>mouse=null;cv.onpointerdown=e=>{if(mode!=='playing'||selected<0||battle.auto[0])return;const p=point(e),c=CARDS[battle.players[0].hand[selected]],err=battle.play(0,selected,p.x,p.y);if(err){$('hint').textContent=err;toast(err);beep(90);return;}selected=-1;renderHand();$('hint').textContent=c.name+' 已部署，準備下一步';beep(c.type==='tactic'?140:240,.1);updateUI();};
function openDeck(){if(typeof cancelMatch==='function')cancelMatch();if(mode==='playing')pause();view='deck';draft=[...deck];$('battleView').hidden=true;$('deckView').hidden=false;$('battleTab').classList.remove('active');$('deckTab').classList.add('active');renderCollection();renderDraft();$('cardInspect').innerHTML=info(CARDS[draft[0]]);}
function openBattle(){view='battle';$('battleView').hidden=false;$('deckView').hidden=true;$('battleTab').classList.add('active');$('deckTab').classList.remove('active');}
function renderCollection(){
 const query=$('search').value.trim(),type=$('typeFilter').value;const list=cards.filter(c=>c.tier!=='hero'&&(filter==='all'||c.faction===+filter)&&(type==='all'||c.type===type||c.tier===type)&&($('raceFilter').value==='all'||c.race===$('raceFilter').value)&&($('elementFilter').value==='all'||c.element===$('elementFilter').value)&&(!query||(c.name+c.desc+c.race+c.category+c.element+c.tags.join('')).includes(query)));
 $('collectionCount').textContent=list.length+' 張';$('collectionGrid').innerHTML=list.map(c=>`<button style="--f:${factions[c.faction][2]}" data-faction="${c.faction}" class="collection-card ${draft.includes(c.id)?'chosen':''}" data-card="${c.id}" aria-label="${draft.includes(c.id)?'移除':'加入'} ${c.name}">${cardFace(c)}<span class="chosenmark">${draft.includes(c.id)?'已編入':''}</span></button>`).join('');
 $('collectionGrid').querySelectorAll('button').forEach(b=>{const c=CARDS[b.dataset.card];b.onclick=()=>toggleCard(c.id);b.onmouseenter=()=>{$('cardInspect').innerHTML=info(c);};b.onfocus=()=>{$('cardInspect').innerHTML=info(c);};});
}
function toggleCard(id){$('cardInspect').innerHTML=info(CARDS[id]);const i=draft.indexOf(id);if(i>=0)draft.splice(i,1);else if(draft.length<8)draft.push(id);else {toast('編制已滿八張，先移除一張再加入。');return;}renderDraft();renderCollection();}
function renderDraft(){
 $('draftCount').textContent=draft.length+' / 8';$('saveDeck').disabled=!Battle.prototype.validDeck(draft);$('draftDeck').innerHTML=Array.from({length:8},(_,i)=>{const c=CARDS[draft[i]];return c?`<button class="deckslot" data-id="${c.id}" aria-label="移除 ${c.name}">${icon(c)}<span class="slotcost">${c.cost}</span><span>${c.name}</span><span class="remove">×</span></button>`:`<div class="empty-slot">${i+1} ／ 待編入</div>`;}).join('');$('draftDeck').querySelectorAll('button').forEach(b=>b.onclick=()=>toggleCard(b.dataset.id));
 const cs=draft.map(id=>CARDS[id]),avg=cs.length?(cs.reduce((v,c)=>v+c.cost,0)/cs.length).toFixed(1):'—';$('deckSummary').innerHTML=`菁英 ${cs.filter(c=>c.tier==='elite').length}<br>平均費用 <b>${avg}</b>　兵種 ${cs.filter(c=>c.type==='troop').length} ／ 戰術 ${cs.filter(c=>c.type==='tactic').length} ／ 建築 ${cs.filter(c=>c.type==='building').length}<br>`+bannerHTML(draft,draftHero?[draftHero]:[])+(cs.length&&!cs.some(c=>c.airHit||['bomb','bolt','fire','barrage'].includes(c.effect))?'<br>編制提醒：缺乏直接對空工具。':'');
}
$('factionFilters').innerHTML='<button data-f="all" class="active">全部勢力</button>'+factions.map((f,i)=>`<button data-f="${i}" style="--f:${f[2]}">${f[0]}</button>`).join('');$('factionFilters').querySelectorAll('button').forEach(b=>b.onclick=()=>{filter=b.dataset.f;$('factionFilters').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));renderCollection();});
$('raceFilter').innerHTML='<option value="all">全部種族</option>'+[...new Set(cards.map(c=>c.race))].map(x=>'<option>'+x+'</option>').join('');
$('elementFilter').innerHTML='<option value="all">全部屬性</option>'+[...new Set(cards.map(c=>c.element))].map(x=>'<option>'+x+'</option>').join('');
$('raceFilter').onchange=$('elementFilter').onchange=renderCollection;
$('search').oninput=renderCollection;$('typeFilter').onchange=renderCollection;$('clearDeck').onclick=()=>{draft=[];renderDraft();renderCollection();};
$('saveDeck').onclick=()=>{if(!Battle.prototype.validDeck(draft)){toast('需八張不重複卡牌。');return;}deck=[...draft];try{localStorage.setItem('six-banners-deck',JSON.stringify(deck));}catch{}openBattle();newLobby();toast('編制已儲存，新對局將使用此牌組。');};
$('deckTab').onclick=$('editDeck').onclick=openDeck;$('battleTab').onclick=openBattle;$('preset').onchange=()=>{if($('preset').value==='custom')return;deck=[...presets[+$('preset').value][2]];newLobby();};$('enemyPreset').onchange=newLobby;
$('watch').onchange=()=>{battle.auto[0]=$('watch').checked;selected=-1;renderHand();$('hint').textContent=battle.auto[0]?'觀戰中：雙方自動部署':'已接管：選卡後點擊戰場部署';};
$('start').onclick=start;$('pause').onclick=()=>mode==='paused'?resume():pause();$('restart').onclick=()=>{newLobby();toast('已回到整備狀態。');};$('speed').onclick=()=>{speed=speed===1?2:speed===2?4:1;$('speed').textContent=speed+'×';};$('sound').onclick=()=>{sound=!sound;$('sound').textContent='音效 '+(sound?'開':'關');try{localStorage.setItem('six-banners-sound',sound?'1':'0');}catch{}beep(400);};$('sound').textContent='音效 '+(sound?'開':'關');
$('guideBtn').onclick=()=>{if(typeof cancelMatch==='function')cancelMatch();if(mode==='playing')pause();$('guide').showModal();};$('closeGuide').onclick=()=>$('guide').close();
window.addEventListener('keydown',e=>{if(['INPUT','SELECT'].includes(e.target.tagName)||$('guide').open||view!=='battle')return;if(e.key>='1'&&e.key<='4')selectCard(+e.key-1);if(e.key.toLowerCase()==='p')mode==='paused'?resume():pause();if(e.key==='Escape'){selected=-1;renderHand();}});document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing')pause();});
function line(x,y,tx,ty,col,w=1){ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(tx,ty);ctx.stroke();}
function circle(x,y,r,col,fill=false){ctx.beginPath();ctx.arc(x,y,Math.max(.1,r),0,Math.PI*2);ctx[fill?'fillStyle':'strokeStyle']=col;ctx[fill?'fill':'stroke']();}
function bar(x,y,f,w,col){ctx.fillStyle='#0e150c';ctx.fillRect(x-w/2-1,y-1,w+2,6);ctx.fillStyle=col;ctx.fillRect(x-w/2,y,w*Math.max(0,Math.min(1,f)),4);}
const teamColor=t=>t?'#df8b75':'#bad49f';
function drawTowerFallback(t){
 const {x,y,r}=t;if(t.hp<=0){ctx.fillStyle='#33392b';ctx.fillRect(x-23,y-15,46,30);for(let i=0;i<5;i++){ctx.fillStyle=i%2?'#545543':'#414938';ctx.fillRect(x-24+i*10,y-10+(i%2)*8,9,13);}return;}
 ctx.save();ctx.translate(x,y);ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(4,22,r+14,15,0,0,7);ctx.fill();
 const core=t.core;ctx.fillStyle=t.team?'#6c5b48':'#697252';ctx.strokeStyle=t.team?'#ad8b70':'#a2ac80';ctx.lineWidth=2;ctx.fillRect(-r,-r+8,r*2,r*2-5);ctx.strokeRect(-r,-r+8,r*2,r*2-5);ctx.fillStyle=t.team?'#3f322b':'#35412e';ctx.fillRect(-r+6,-r+15,r*2-12,r*2-18);
 for(let i=0;i<3;i++){ctx.fillStyle=t.team?'#82705b':'#84916a';ctx.fillRect(-r+i*(r-4),-r,9,15);ctx.strokeRect(-r+i*(r-4),-r,9,15);}
 ctx.fillStyle=teamColor(t.team);ctx.fillRect(-7,-r+17,14,core?28:20);ctx.fillStyle='#293122';ctx.beginPath();ctx.moveTo(-7,-r+(core?45:37));ctx.lineTo(0,-r+(core?38:30));ctx.lineTo(7,-r+(core?45:37));ctx.fill();
 if(core){ctx.strokeStyle='#d4b977';ctx.beginPath();ctx.moveTo(-10,-r+23);ctx.lineTo(-8,-r+15);ctx.lineTo(-2,-r+20);ctx.lineTo(2,-r+12);ctx.lineTo(6,-r+20);ctx.lineTo(11,-r+15);ctx.lineTo(9,-r+25);ctx.closePath();ctx.stroke();}
 ctx.fillStyle='#121b12';ctx.beginPath();ctx.arc(0,r-9,8,Math.PI,0);ctx.lineTo(8,r);ctx.lineTo(-8,r);ctx.fill();ctx.restore();bar(x,y+r+6,t.hp/t.max,core?65:51,teamColor(t.team));ctx.font='10px Georgia';ctx.fillStyle='#d8d9c6';ctx.textAlign='center';ctx.fillText(Math.ceil(t.hp),x,y+r+23);
}

function drawUnitFallback(u){
 const col=factions[u.faction??0][2],tc=teamColor(u.team);ctx.save();ctx.translate(u.x,u.y);ctx.fillStyle='#08100655';ctx.beginPath();ctx.ellipse(3,u.flying?12:5,u.r+4,6,0,0,7);ctx.fill();
 if(u.flying)ctx.translate(0,-8-Math.sin(battle.clock*5+u.id)*2);
 ctx.strokeStyle=tc;ctx.lineWidth=1.5;ctx.fillStyle=u.team?'#4b3229':'#303e2a';
 if(u.type==='building'){
  ctx.fillRect(-17,-14,34,30);ctx.strokeRect(-17,-14,34,30);for(let i=0;i<3;i++)ctx.fillRect(-17+i*13,-20,8,12);ctx.fillStyle=col;ctx.fillRect(-5,-10,10,15);ctx.font='12px serif';ctx.textAlign='center';ctx.fillStyle='#f2e4c2';ctx.fillText(u.summon?'召':'砲',0,8);
 }else{
  ctx.rotate(u.angle||0);
  if(u.flying){ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(-6,-3);ctx.lineTo(-22,-9);ctx.lineTo(-12,9);ctx.lineTo(0,5);ctx.lineTo(12,9);ctx.lineTo(22,-9);ctx.lineTo(6,-3);ctx.closePath();ctx.fill();ctx.stroke();}
  else if(['砲','銃','輪'].includes(u.role)){ctx.fillStyle='#44452f';ctx.fillRect(-12,-9,24,21);ctx.strokeRect(-12,-9,24,21);ctx.fillStyle=col;ctx.fillRect(-4,-25,8,28);ctx.fillStyle='#20281b';ctx.fillRect(-17,0,6,15);ctx.fillRect(11,0,6,15);}
  else{
   const big=u.max>=1700,s=big?1.35:1;ctx.scale(s,s);
   ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(-9,-2);ctx.lineTo(0,-10);ctx.lineTo(9,-2);ctx.lineTo(10,12);ctx.lineTo(-10,12);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#d1c9a7';ctx.beginPath();ctx.arc(0,-7,5,0,7);ctx.fill();
   if(['盾','王'].includes(u.role)){ctx.fillStyle='#536044';ctx.beginPath();ctx.moveTo(-15,-10);ctx.lineTo(-6,-6);ctx.lineTo(-7,9);ctx.lineTo(-15,13);ctx.lineTo(-20,4);ctx.lineTo(-20,-7);ctx.closePath();ctx.fill();ctx.stroke();}
   if(['杖','符','鼓'].includes(u.role)){line(14,13,14,-17,'#c2b187',2);circle(14,-18,4,col,true);}
   else if(['弓','弩','鷹'].includes(u.role)){ctx.beginPath();ctx.arc(5,-7,14,-1.2,1.2);ctx.stroke();line(10,-20,10,7,tc);}
   else {line(13,9,13,-16,'#ddd4ab',2);line(8,-2,18,-2,'#c0ad78',2);}
  }
 }
 ctx.restore();bar(u.x,u.y-(u.flying?34:25),u.hp/u.max,u.type==='building'?40:28,tc);
 if(u.shield>0&&u.shieldUntil>battle.clock){ctx.lineWidth=1;circle(u.x,u.y,u.r+7,'#d9c78c99');}
 if(battle.has(u,'root')){line(u.x-14,u.y+8,u.x+14,u.y-8,'#a0b987',2);line(u.x-14,u.y-8,u.x+14,u.y+8,'#a0b987',2);}
 else if(battle.has(u,'slow'))circle(u.x,u.y,u.r+5,'#aab7d080');
 if(battle.has(u,'frenzy')||battle.has(u,'sacrifice'))circle(u.x,u.y,u.r+4,'#df786c88');
}
function draw(){
 ctx.clearRect(0,0,600,700);ctx.save();
 const heavy=battle.fx.find(f=>(f.type==='blast'&&f.r>=70)||(f.type==='death'&&f.tower));
 if(heavy&&!reducedMotion){const amp=1.8*heavy.life/heavy.max;ctx.translate(Math.sin(battle.clock*73)*amp,Math.cos(battle.clock*61)*amp);}
 drawBattlefield();
 if(selected>=0&&mode==='playing'){
  const c=CARDS[battle.players[0].hand[selected]],home=c.type!=='tactic'||c.homeOnly||c.effect==='mine';ctx.fillStyle=home?'#c4d3930b':'#d9bb8a09';ctx.fillRect(17,home?382:17,566,home?301:666);ctx.setLineDash([5,5]);line(17,382,583,382,'#c4d39388');ctx.setLineDash([]);
  if(mouse){const err=battle.legal(c,0,mouse.x,mouse.y);ctx.lineWidth=1.5;circle(mouse.x,mouse.y,c.type==='tactic'?c.radius:25,err?'#e48a79':'#ead6a0');ctx.fillStyle=err?'#d7675a15':'#dccb8d15';ctx.fill();}
 }
 for(const f of battle.fields){const c=f.c;ctx.lineWidth=1.2;ctx.setLineDash([5,6]);const col=c.effect==='heal'?'#b7d7a1':c.effect==='summon'?'#c7b3e5':c.effect==='mine'?'#c1aa79':'#db9b75';circle(f.x,f.y,c.radius,col+'88');ctx.setLineDash([]);circle(f.x,f.y,c.radius,col+'10',true);if(c.effect==='bomb'||c.effect==='summon'){ctx.lineWidth=3;ctx.strokeStyle=col;ctx.beginPath();ctx.arc(f.x,f.y,c.radius,-Math.PI/2,-Math.PI/2+Math.PI*2*f.age/f.duration);ctx.stroke();}ctx.font='9px sans-serif';ctx.fillStyle=col;ctx.fillText(c.name,f.x,f.y-c.radius-6);}
 battle.towers.forEach(drawFortress);[...battle.units].sort((a,b)=>Number(!!a.flying)-Number(!!b.flying)||a.y-b.y).forEach(drawAnimatedUnit);
 drawProjectiles();drawBattleEffects();drawWeather();ctx.restore();
}
initVisualUI();newLobby();$('detail').innerHTML='';let last=performance.now();function loop(now){let dt=Math.min(.06,(now-last)/1000);last=now;if(mode==='playing'){for(let i=0;i<speed;i++)battle.step(dt);if(battle.state==='ended')endUI();}uiClock+=dt;if(uiClock>.1){updateUI();uiClock=0;}if(view==='battle')draw();requestAnimationFrame(loop);}requestAnimationFrame(loop);
// Read-only access for prototype diagnostics.
window.sixBanners={get battle(){return battle;},get deck(){return [...deck];},get mode(){return mode;}};

if(legacyDeck){openDeck();draft=[...legacyDeck];renderDraft();renderCollection();toast('舊編制含多名英雄，請保留一名再完成整備；原存檔尚未覆寫。');}
