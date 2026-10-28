'use strict';
/* 單人模式 v2：以英雄為主角。選一位英雄開局，每場勝利強化英雄、換卡；堡壘耐久跨場保留，營地可修復；精英掉遺物。
   依賴 game.js / experience.js / relics.js 的全域：deck、CARDS、presets、factions、names、cardFace、
   commanders、portrait、findMatch、newLobby、endUI、RELICS、HERO_UPS、relicIcon。 */
const TOWER_FLOORS=10,TOWER_LIVES=2,TOWER_KEY='six-banners-tower',TOWER_VERSION=2;
let towerCtx=null,realDeck=null,towerRun=null,towerBest=0,towerSelected=null;
const towerPick=a=>a[Math.floor(Math.random()*a.length)];
const towerShuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const NODE_INFO={battle:{name:'戰鬥',glyph:'⚔',note:'擊敗指揮官，強化英雄並獲得新卡'},elite:{name:'精英',glyph:'♛',note:'敵軍帶有英雄；額外掉落一件遺物'},camp:{name:'營地',glyph:'⛺',note:'修復堡壘、招募新卡或訓練英雄'},boss:{name:'首領',glyph:'☠',note:'王座前的最後一戰，敵軍堡壘更堅固'}};
const towerHas=id=>!!(towerRun&&towerRun.relics.includes(id));
const heroUpCount=()=>Object.values(towerRun.ups).reduce((a,b)=>a+b,0);

function towerLoad(){try{const s=JSON.parse(localStorage.getItem(TOWER_KEY));if(s&&s.version===TOWER_VERSION&&Array.isArray(s.deck)&&Battle.prototype.validDeck(s.deck)&&s.deck.every(id=>CARDS[id]))towerRun=s;}catch{}try{towerBest=+localStorage.getItem(TOWER_KEY+'-best')||0;}catch{}}
function towerSave(){try{if(towerRun)localStorage.setItem(TOWER_KEY,JSON.stringify(towerRun));else localStorage.removeItem(TOWER_KEY);localStorage.setItem(TOWER_KEY+'-best',String(towerBest));}catch{}}

/* ---------- 資料生成 ---------- */
function towerStarterDeck(heroId){
 const hero=CARDS[heroId],pool=towerShuffle(Object.values(CARDS).filter(c=>c.faction===hero.faction&&c.tier==='standard'));
 const cheap=pool.filter(c=>c.cost<=3).slice(0,3),rest=pool.filter(c=>!cheap.includes(c)&&c.cost<=5).slice(0,4);
 const ids=[heroId,...cheap.map(c=>c.id),...rest.map(c=>c.id)];
 for(const c of pool){if(ids.length>=8)break;if(!ids.includes(c.id))ids.push(c.id);}
 return ids.slice(0,8);
}
function towerCardOffer(count,withRare){
 const have=towerRun.deck,std=towerShuffle(Object.values(CARDS).filter(c=>c.tier==='standard'&&!have.includes(c.id))),out=[];
 if(withRare){const rare=towerPick(Object.values(CARDS).filter(c=>c.tier==='elite'&&!have.includes(c.id)));if(rare)out.push(rare);}
 for(const c of std){if(out.length>=count)break;out.push(c);}
 return towerShuffle(out).map(c=>c.id);
}
function towerRelicOffer(count){return towerShuffle(RELICS.filter(r=>!towerRun.relics.includes(r.id))).slice(0,count).map(r=>r.id);}
function towerHeroUpOffer(){return towerShuffle(HERO_UPS).slice(0,towerHas('kingsring')?4:3).map(u=>u.id);}
function towerMakeNode(kind,floor){
 if(kind==='camp')return {kind};
 const base=towerPick(presets),commander=towerPick(commanders);let enemy=[...base[2]];
 if(kind!=='battle'){
  const heroes=Object.values(CARDS).filter(c=>c.tier==='hero'&&!enemy.includes(c.id)&&enemy.every(id=>CARDS[id].tier!=='hero'));
  if(heroes.length){const swapIdx=enemy.findIndex(id=>CARDS[id].type==='troop'&&CARDS[id].tier==='standard');enemy[swapIdx<0?7:swapIdx]=towerPick(heroes).id;}
 }
 const tower=kind==='boss'?1.3:(floor<=2?.85:1+.03*(floor-1));
 return {kind,deckName:base[0],enemy,style:commander.style,commander:commander.name,tower:+tower.toFixed(2),energy:kind==='boss'?2:floor>=6?1:0};
}
function towerBuildMap(){
 const map=[];
 for(let f=1;f<=TOWER_FLOORS;f++){
  if(f===TOWER_FLOORS){map.push([towerMakeNode('boss',f)]);continue;}
  if(f===1){map.push([towerMakeNode('battle',f)]);continue;}
  const kinds=f<3?['battle','battle']:f===TOWER_FLOORS-1?['camp','elite']:['battle',Math.random()<.5?'elite':'camp'];
  map.push(towerShuffle(kinds).map(k=>towerMakeNode(k,f)));
 }
 return map;
}

/* ---------- 流程 ---------- */
function towerNewRun(heroId){
 towerRun={version:TOWER_VERSION,hero:heroId,ups:{},relics:[],deck:towerStarterDeck(heroId),floor:1,lives:TOWER_LIVES,fort:[1,1,1],map:towerBuildMap(),chosen:[],stage:'map',queue:[],options:null,pending:null,wins:0};
 towerSave();towerRender();
}
function towerChooseNode(i){
 const r=towerRun,n=r.map[r.floor-1][i];r.chosen[r.floor-1]=n.kind;
 if(n.kind==='camp'){r.stage='camp';r.pending={kind:'camp'};towerSave();towerRender();return;}
 r.pending={kind:n.kind,node:n};towerSave();towerLaunch(n);
}
function towerLaunch(n){
 towerCtx={node:n,commander:commanders.find(c=>c.name===n.commander)||commanders[0]};
 if(!realDeck)realDeck=[...deck];
 deck=[...towerRun.deck];
 towerHidePanel();
 if(mode==='ended')mode='ready';
 newLobbyRaw();findMatch();
}
function towerApplyMods(b){
 const r=towerRun,n=towerCtx.node,m=b.teamMods[0],mine=b.towers.filter(t=>t.team===0),foes=b.towers.filter(t=>t.team===1);
 mine.forEach((t,i)=>{if(towerHas('thickwall'))t.max=Math.round(t.max*1.25);if(towerHas('beacon'))t.dmg=Math.round(t.dmg*1.3);t.hp=Math.max(1,Math.round(t.max*r.fort[i]));});
 foes.forEach(t=>{t.hp=Math.round(t.hp*n.tower*(towerHas('breaker')?.85:1));t.max=t.hp;});
 b.players[0].energy+=towerHas('quartermaster')?2:0;
 b.players[1].energy=Math.max(0,b.players[1].energy+n.energy-(towerHas('scout')?1:0));
 if(towerHas('spring'))m.regen=1.15;
 if(towerHas('vetbadge'))m.hp=1.12;
 if(towerHas('whetstone'))m.dmg=1.12;
 const u=r.ups;m.heroHp=1+.2*(u.hp||0);m.heroDmg=1+.2*(u.dmg||0);m.heroSpeed=1+.15*(u.speed||0);m.heroGrant=u.grant||0;m.heroShield=250*(u.shield||0);
}
function towerBattleEnded(){
 const r=towerRun,n=towerCtx.node,won=battle.winner===0;
 const frac=battle.towers.filter(t=>t.team===0).map(t=>t.hp>0?Math.max(.3,t.hp/t.max):.3);
 $('start').textContent='繼續征程 →';
 if(won){
  r.wins++;
  r.fort=frac.map(x=>Math.min(1,x+(towerHas('rations')?.25:0)));
  if(n.kind==='boss'){towerFinish(true);return;}
  r.queue=n.kind==='elite'?['relic','hero','reward']:['hero','reward'];
  r.stage='next';$('modalHint').textContent='選擇獎勵';
 }else{
  r.lives--;r.fort=frac.map(x=>Math.max(x,.6));
  if(r.lives<=0){towerFinish(false);return;}
  r.stage='map';r.pending=null;r.chosen[r.floor-1]=undefined;
  $('modalText').textContent+=' · 剩餘戰旗 '+r.lives;$('modalHint').textContent='堡壘稍作修補，重整後再戰';
 }
 towerSave();
}
function towerFinish(victory){
 towerRun.stage=victory?'victory':'defeat';towerBest=Math.max(towerBest,victory?TOWER_FLOORS:towerRun.floor-1);towerSave();
 $('modalTitle').textContent=victory?'王座已定，征程通關！':'戰旗倒下，這輪征程到此為止。';
 $('modalHint').textContent=victory?'你的英雄已登上王座':'抵達第 '+towerRun.floor+' 層';
}
function towerNextStage(){
 const r=towerRun;r.options=null;
 const next=r.queue.shift();
 if(!next){towerAdvance();return;}
 r.stage=next;
 if(next==='relic')r.options=towerRelicOffer(2);
 else if(next==='hero')r.options=towerHeroUpOffer();
 else if(next==='reward')r.options=towerCardOffer(towerHas('bounty')?4:3,r.pending&&r.pending.kind==='elite');
 if(next==='relic'&&!r.options.length){towerNextStage();return;}
 towerSave();towerRender();
}
function towerAdvance(){
 const r=towerRun;r.floor++;r.options=null;r.pending=null;r.queue=[];r.stage='map';towerSave();towerRender();
}
function towerPickRelic(id){
 const r=towerRun;r.relics.push(id);if(id==='sparebanner')r.lives++;towerNextStage();
}
function towerPickHeroUp(id){const u=towerRun.ups;u[id]=(u[id]||0)+1;towerNextStage();}
function towerTakeCard(newId,replaceId){
 const r=towerRun;
 if(replaceId){
  if(CARDS[replaceId].tier==='hero'){toast('主角英雄不能被換掉。');return false;}
  const next=r.deck.map(id=>id===replaceId?newId:id);
  if(!Battle.prototype.validDeck(next)){toast('這張卡無法加入牌組。');return false;}
  r.deck=next;
 }
 towerNextStage();return true;
}
function towerCamp(choice){
 const r=towerRun;
 if(choice==='repair'){r.fort=[1,1,1];towerAdvance();return;}
 if(choice==='recruit'){r.stage='reward';r.options=towerCardOffer(5,true);r.queue=[];towerSave();towerRender();return;}
 r.queue=['hero'];towerNextStage();
}

/* ---------- 介面 ---------- */
const towerPanel=document.createElement('div');towerPanel.id='towerPanel';towerPanel.hidden=true;document.body.appendChild(towerPanel);
const towerHud=document.createElement('div');towerHud.id='towerHud';towerHud.hidden=true;$('opponentCard').after(towerHud);
const towerTab=document.createElement('button');towerTab.id='towerTab';towerTab.textContent='單人模式';$('battleTab').after(towerTab);
function towerHidePanel(){towerPanel.hidden=true;document.body.classList.remove('tower-open');}
function towerShowPanel(){if(mode==='playing')pause();towerPanel.hidden=false;document.body.classList.add('tower-open');towerRender();}
const relicById=id=>RELICS.find(r=>r.id===id),upById=id=>HERO_UPS.find(u=>u.id===id);
function towerCardHTML(id,attrs){const c=CARDS[id];return `<button class="tw-card" ${attrs} title="${c.rules}">${cardFace(c)}<em>${c.rules}</em></button>`;}
function towerRelicHTML(r,attrs=''){return `<button class="tw-relic ${r.rarity}" ${attrs}>${relicIcon(r,56)}<strong>${r.name}</strong><em>${r.desc}</em></button>`;}
function towerUpHTML(u,attrs=''){return `<button class="tw-relic rare" ${attrs}>${relicIcon({rarity:'rare',frame:'hex',glyph:u.glyph,tint:u.tint},56)}<strong>${u.name}${towerRun.ups[u.id]?' <small>→ Lv.'+(towerRun.ups[u.id]+1)+'</small>':''}</strong><em>${u.desc}</em></button>`;}
function towerMe(){
 const r=towerRun,hero=CARDS[r.hero];
 const fort=r.fort.map(f=>`<i style="--p:${Math.round(f*100)}%"></i>`).join('');
 return `<div class="tw-me"><div class="tw-hero"><span class="tw-hface" style="--ec:${factions[hero.faction][2]}">${artSVG(hero.id,'portrait')}</span><div><b>${hero.name}</b><small>我方旗主 · Lv.${1+heroUpCount()} · ${r.wins} 勝</small></div></div>
 <div class="tw-fort" title="堡壘耐久（跨場保留，營地可修復）"><small>堡壘</small>${fort}</div>
 <div class="tw-lives" title="剩餘戰旗">${'⚑'.repeat(r.lives)}</div>
 <div class="tw-relics">${r.relics.map(id=>{const x=relicById(id);return `<span title="${x.name}：${x.desc}">${relicIcon(x,32)}</span>`;}).join('')||'<small>尚無遺物</small>'}</div></div>`;
}
function towerHeader(){return `<div class="tw-head">${towerMe()}<button class="outline" id="twExit">離開（可續玩）</button></div>`;}
function towerDeckStrip(clickable){return `<div class="tw-deck">${towerRun.deck.map(id=>towerCardHTML(id,clickable&&CARDS[id].tier!=='hero'?`data-replace="${id}"`:'')).join('')}</div>`;}
function towerMapHTML(){
 const r=towerRun;let track='';
 for(let f=1;f<=TOWER_FLOORS;f++){
  const nodes=r.map[f-1],cur=f===r.floor,past=f<r.floor,kinds=past?[r.chosen[f-1]||'battle']:nodes.map(n=>n.kind);
  track+=`<div class="tw-cell ${cur?'cur':past?'past':'future'} ${kinds.length===1?kinds[0]:''}"><b>${f}</b><span>${kinds.map(k=>NODE_INFO[k].glyph).join('')}</span></div>`;
 }
 const nodes=r.map[r.floor-1];
 const cards=nodes.map((n,i)=>{const info=NODE_INFO[n.kind],cm=n.commander&&commanders.find(c=>c.name===n.commander);
  if(!cm)return `<button class="tw-node ${n.kind}" data-node="${i}"><span class="glyph">${info.glyph}</span><strong>${info.name}</strong><em>${info.note}</em></button>`;
  return `<button class="tw-node foe ${n.kind}" data-node="${i}"><span class="tw-badge">${info.glyph} ${info.name}</span><span class="tw-face" style="--ec:${cm.color}">${portrait(cm)}</span><strong>${cm.name}</strong><small>${cm.label}型 · ${n.deckName}</small><span class="tw-go">開始戰鬥 →</span></button>`;}).join('');
 return `<div class="tw-top"><b>單人模式 · 最高 ${towerBest} 層</b><button class="outline" id="twExit">離開（可續玩）</button></div><div class="tw-track">${track}</div><h3 class="tw-sec foe">本關對手</h3><div class="tw-nodes">${cards}</div>`;
}
function towerRender(){
 if(towerPanel.hidden)return;
 const r=towerRun;let h='';
 if(r&&r.stage==='next'){towerNextStage();return;}
 if(!r){
  const heroes=Object.values(CARDS).filter(c=>c.tier==='hero');
  h=`<div class="tw-head"><div><b>單人模式</b> · 最高紀錄 ${towerBest} 層</div><button class="outline" id="twExit">返回</button></div><h2>選擇你的英雄</h2><p class="tw-sub">英雄是這輪征程的主角：每場勝利都能強化，並隨身帶著他的陣營牌組。十層，擊敗首領即通關；有 ${TOWER_LIVES} 面戰旗，敗北一次折一面。</p><div class="tw-starts">${heroes.map(c=>`<button class="tw-start" data-start="${c.id}"><div class="tw-startcard">${cardFace(c)}</div><div><strong>${c.name}</strong><small>${factions[c.faction][0]} · ${factions[c.faction][1]}</small><em>${c.rules}</em></div></button>`).join('')}</div>`;
 }else if(r.stage==='map'){
  h=towerMapHTML()+`<h3 class="tw-sec me">我方</h3>`+towerMe()+towerDeckStrip(false);
 }else if(r.stage==='camp'){
  h=towerHeader()+`<h2>營地</h2><p class="tw-sub">做一件事再出發。</p><div class="tw-nodes"><button class="tw-node camp" data-camp="repair"><span class="glyph">🛠</span><strong>修復堡壘</strong><em>堡壘耐久全部回滿（目前 ${r.fort.map(f=>Math.round(f*100)+'%').join(' / ')}）</em></button><button class="tw-node camp" data-camp="recruit"><span class="glyph">✚</span><strong>招募新卡</strong><em>五選一（含一張菁英），可換掉牌組中一張卡</em></button><button class="tw-node camp" data-camp="hero"><span class="glyph">★</span><strong>英雄訓練</strong><em>強化英雄一次</em></button></div>`;
 }else if(r.stage==='relic'){
  h=towerHeader()+`<h2>精英戰利品：選擇一件遺物</h2><div class="tw-offer relics">${r.options.map(id=>towerRelicHTML(relicById(id),`data-relic="${id}"`)).join('')}</div>`;
 }else if(r.stage==='hero'){
  h=towerHeader()+`<h2>強化英雄：${CARDS[r.hero].name}</h2><div class="tw-offer relics">${r.options.map(id=>towerUpHTML(upById(id),`data-up="${id}"`)).join('')}</div>`;
 }else if(r.stage==='reward'){
  h=towerHeader()+`<h2>戰利品：選擇一張卡</h2><p class="tw-sub">先點選要加入的卡，再點選牌組中要換掉的卡（主角英雄不能換）；也可以略過。</p><div class="tw-offer">${r.options.map(id=>towerCardHTML(id,`data-offer="${id}"`)).join('')}</div><div class="tw-actions"><button class="outline" id="twSkip">略過獎勵</button></div><h3 id="twReplaceLabel">目前牌組</h3>`+towerDeckStrip(true);
 }else{
  const win=r.stage==='victory';
  h=`<h2>${win?'王座已定':'戰旗倒下'}</h2><p class="tw-sub">${win?'十層全數通過，贏下 '+r.wins+' 場戰鬥。':'止步於第 '+r.floor+' 層，共贏下 '+r.wins+' 場。'}　最高紀錄 ${towerBest} 層。</p>`+towerDeckStrip(false)+`<div class="tw-actions"><button class="primary" id="twAgain">再爬一次</button><button class="outline" id="twExit">返回</button></div>`;
 }
 towerPanel.innerHTML='<div class="tw-inner">'+h+'</div>';
 towerSelected=null;towerPanel.classList.remove('choosing');
}
towerPanel.addEventListener('click',e=>{
 const q=s=>e.target.closest(s);let t;
 if(q('#twExit')){towerHidePanel();exitTowerMode();return;}
 if(q('#twAgain')){towerRun=null;towerSave();towerRender();return;}
 if(t=q('[data-start]')){towerNewRun(t.dataset.start);return;}
 if(t=q('[data-node]')){towerChooseNode(+t.dataset.node);return;}
 if(t=q('[data-camp]')){towerCamp(t.dataset.camp);return;}
 if(t=q('[data-relic]')){towerPickRelic(t.dataset.relic);return;}
 if(t=q('[data-up]')){towerPickHeroUp(t.dataset.up);return;}
 if(q('#twSkip')){towerNextStage();return;}
 if(t=q('[data-offer]')){towerSelected=t.dataset.offer;towerPanel.querySelectorAll('[data-offer]').forEach(b=>b.classList.toggle('picked',b===t));const l=$('twReplaceLabel');if(l)l.textContent='要換掉哪一張？（點選牌組中的卡）';towerPanel.classList.add('choosing');return;}
 if(t=q('[data-replace]')){if(!towerSelected){toast('先點選上方要加入的卡');return;}towerTakeCard(towerSelected,t.dataset.replace);}
});
towerTab.onclick=()=>towerShowPanel();

/* ---------- 與既有流程銜接 ---------- */
const newLobbyRaw=newLobby;
function exitTowerMode(){if(towerCtx||realDeck){towerCtx=null;if(realDeck){deck=realDeck;realDeck=null;}towerHud.hidden=true;newLobbyRaw();}}
newLobby=function(){if(towerCtx)exitTowerMode();else newLobbyRaw();};
const baseEndUI=endUI;
endUI=function(){baseEndUI();if(towerCtx){towerBattleEnded();}};
$('deckTab').addEventListener('click',()=>{if(towerCtx)exitTowerMode();},true);
function towerUpdateHud(){if(towerCtx&&towerRun){towerHud.hidden=false;towerHud.innerHTML='單人模式 · 英雄 Lv.'+(1+heroUpCount())+' · <span>'+'⚑'.repeat(towerRun.lives)+'</span>';}else towerHud.hidden=true;}
setInterval(towerUpdateHud,300);
towerLoad();
