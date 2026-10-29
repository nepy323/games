'use strict';
/* 單人模式 v3（織律者）：玩家是「織律者」，選一位旗主同行。序章＋六境（各兩場，第二場為守護戰，取得律種）＋終章，共 15 場。
   每場勝利強化英雄、換卡；堡壘耐久跨場保留，營地可修復；精英掉遺物。故事文字在 story.js。
   依賴 game.js / experience.js / relics.js 的全域：deck、CARDS、presets、factions、names、cardFace、
   commanders、portrait、findMatch、newLobby、endUI、RELICS、HERO_UPS、relicIcon。 */
const TOWER_FLOORS=15,TOWER_LIVES=3,TOWER_KEY='six-banners-tower',TOWER_VERSION=8;
let towerCtx=null,realDeck=null,towerRun=null,towerBest=0,towerSelected=null;
const towerPick=a=>a[Math.floor(Math.random()*a.length)];
const towerShuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const NODE_INFO={battle:{name:'戰鬥',glyph:'⚔',note:'擊敗指揮官，強化英雄並獲得新卡'},elite:{name:'精英',glyph:'♛',note:'敵軍帶有英雄；額外掉落一件遺物'},camp:{name:'營地',glyph:'⛺',note:'修復堡壘、招募新卡或訓練英雄'},guardian:{name:'守護戰',glyph:'⚑',note:'章節對手；擊敗後取得律種'},finale:{name:'終章守衛',glyph:'☠',note:'舊都中樞的守衛'},boss:{name:'最後的守環者',glyph:'♚',note:'維索與界律之環的最後一戰，敵軍堡壘更堅固'}};
/* 第幾章：序章 -1；六境 0–5（每章兩層：第一場可選、第二場守護戰）；終章 6 */
const towerChapter=f=>f<=1?-1:f<=13?(f-2)>>1:6;
/* 隨機文本：同一局內同一個文本庫不重複，抽完才重來（記在存檔裡，重新整理也不會變） */
function towerLine(key,pool){
 const r=towerRun;if(!pool||!pool.length)return '';
 r.seen=r.seen||{};let used=r.seen[key]||[];if(used.length>=pool.length)used=[];
 const left=pool.map((_,i)=>i).filter(i=>!used.includes(i)),i=towerPick(left);
 r.seen[key]=[...used,i];return pool[i];
}
const towerHas=id=>!!(towerRun&&towerRun.relics.includes(id));
const heroUpCount=()=>Object.values(towerRun.ups).reduce((a,b)=>a+b,0);

function towerLoad(){try{const s=JSON.parse(localStorage.getItem(TOWER_KEY));if(s&&s.version===TOWER_VERSION&&Array.isArray(s.deck)&&Battle.prototype.validDeck(s.deck)&&s.deck.every(id=>CARDS[id]))towerRun=s;}catch{}try{towerBest=+localStorage.getItem(TOWER_KEY+'-best')||0;}catch{}}
function towerSave(){try{if(towerRun)localStorage.setItem(TOWER_KEY,JSON.stringify(towerRun));else localStorage.removeItem(TOWER_KEY);localStorage.setItem(TOWER_KEY+'-best',String(towerBest));}catch{}}

/* ---------- 資料生成 ---------- */
/* 起點：織律者帶著八隻律靈（界律之環上的六條律，加上環外變質的蝕與闇），整副牌就是它們 */
const TOWER_SPIRITS=['n_wind','n_dew','n_frost','n_fire','n_rock','n_light','n_rot','n_dark'];
function towerStarterDeck(){return [...TOWER_SPIRITS];}
function towerCardOffer(count,withRare){
 const have=towerRun.deck,std=towerShuffle(Object.values(CARDS).filter(c=>c.tier==='standard'&&!have.includes(c.id))),out=[];
 if(withRare){const rare=towerPick(Object.values(CARDS).filter(c=>c.tier==='elite'&&!have.includes(c.id)));if(rare)out.push(rare);}
 for(const c of std){if(out.length>=count)break;out.push(c);}
 return towerShuffle(out).map(c=>c.id);
}
function towerRelicOffer(count){return towerShuffle(RELICS.filter(r=>!towerRun.relics.includes(r.id))).slice(0,count).map(r=>r.id);}
function towerHeroUpOffer(){return towerShuffle(HERO_UPS).slice(0,towerHas('kingsring')?4:3).map(u=>u.id);}
const towerScale=(kind,f)=>kind==='boss'?1.4:(kind==='finale'?1.1:kind==='guardian'?1.05:1)*(f<=3?.7:f===4?.85:1+.02*(f-2));
const towerEnergy=(kind,f)=>kind==='boss'?2:kind==='finale'?1:(kind==='guardian'&&f>=7)||f>=8?1:0;
/* 維索的軍械：以 AI 對 AI 模擬挑選（自動操作的玩家牌組勝率約 26%，真人手動會更高）。調整難度先改這裡與 towerScale。 */
const TOWER_TROOP_ART=['sd_0','sd_2','sd_4','sd_6','sd_8','sd_10'],TOWER_ELITE_ART=['sd_1','sd_3','sd_5','sd_7','sd_9','sd_11'];
const towerBossDeck=['f3_2','f4_1','f0_20','f0_21','f2_21','f3_21','n_fire','f0_8'];
function towerMakeNode(kind,floor){
 if(kind==='camp')return {kind};
 const ch=towerChapter(floor);let base,cm,enemy,title;
 if(kind==='guardian'){const c=STORY.chapters[ch];base=presets[8+c.faction];cm=c.guardian;title=c.guardian.name;}
 else if(kind==='finale'){base=towerPick(presets.slice(8));cm=STORY.finale.guard;title=cm.name;}
 else if(kind==='boss'){base=['最後的守環者','維索的守衛與軍械',towerBossDeck];cm=STORY.finale.boss;title=cm.name;}
 else if(floor===1){base=['橋哨守軍','序章',['f0_0','f0_1','f0_2','f0_5','f0_10','f0_11','f0_20','f0_21'],[]];cm=STORY.prologueGuard;title=cm.name;}
 else{ /* 章節中的一般戰與精英戰：該勢力的守軍／精銳，不再出現與劇情無關的隨機指揮官 */
  const c=STORY.chapters[ch],f=c.faction;base=ch===0&&kind!=='elite'?presets[0]:presets[8+f];
  cm={name:c.place+(kind==='elite'?'精銳':'守軍'),art:kind==='elite'?TOWER_ELITE_ART[f]:TOWER_TROOP_ART[f],glyph:'旗',color:c.guardian.color,style:c.guardian.style,label:c.guardian.label,note:c.name+(kind==='elite'?' · 帶著英雄的精銳':' · 守住此境的部隊')};title=cm.name;}
 enemy=[...base[2]];
 const commander=cm||towerPick(commanders);
 /* 敵方英雄：精英戰隨機一位；守護戰與終章守衛帶該牌組的英雄；普通戰與維索沒有 */
 let enemyHeroes=[];
 if(kind==='elite')enemyHeroes=[towerPick(Object.keys(SixEngine.HEROES))];
 else if(kind==='guardian'||kind==='finale')enemyHeroes=[...(base[3]||[])];
 return {kind,deckName:base[0],enemy,enemyHeroes,style:commander.style,commander:commander.name,cm:cm||null,title:title||null,tower:+towerScale(kind,floor).toFixed(2),energy:towerEnergy(kind,floor)};
}
function towerBuildMap(){
 const map=[];
 for(let f=1;f<=TOWER_FLOORS;f++){
  if(f===TOWER_FLOORS){map.push([towerMakeNode('boss',f)]);continue;}
  if(f===TOWER_FLOORS-1){map.push([towerMakeNode('finale',f)]);continue;}
  if(f===1){map.push([towerMakeNode('battle',f)]);continue;}
  if(f%2===1){map.push([towerMakeNode('guardian',f)]);continue;}
  map.push(towerShuffle(['battle','elite']).map(k=>towerMakeNode(k,f)));
 }
 return map;
}

/* ---------- 流程 ---------- */
function towerNewRun(){
 towerRun={version:TOWER_VERSION,hero:null,heroes:[],ups:{},relics:[],deck:towerStarterDeck(),floor:1,lives:TOWER_LIVES,fort:[1,1,1],map:towerBuildMap(),chosen:[],stage:'story',story:{id:'prologue',after:'spirits'},seeds:[],camps:0,queue:[],options:null,pending:null,wins:0};
 towerSave();towerRender();
}
function towerChooseNode(i){
 const r=towerRun,n=r.map[r.floor-1][i];r.chosen[r.floor-1]=n.kind;
 if(n.kind==='camp'){r.stage='camp';r.pending={kind:'camp'};towerSave();towerRender();return;}
 r.pending={kind:n.kind,node:n};towerSave();towerLaunch(n);
}
function towerLaunch(n){
 towerCtx={node:n,commander:n.cm||commanders.find(c=>c.name===n.commander)||commanders[0]};
 if(!realDeck)realDeck=[...deck];
 deck=[...towerRun.deck];
 towerHidePanel();
 if(mode==='ended')mode='ready';
 newLobbyRaw();findMatch();
}
/* 出戰英雄：依進度開放格數（開局 1，第 3 章後 2，第 5 章後 3），依加入順序帶入；場上同時最多 2 位 */
function towerHeroSlots(){const c=towerChapter(towerRun.floor);return 1+(c>=2?1:0)+(c>=4?1:0);}
function towerBattleHeroes(){return towerRun.heroes.slice(0,towerHeroSlots());}
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
  r.winLine=towerLine('win',STORY.win);
  r.queue=n.kind==='guardian'?['seed','hero','reward','camp']:n.kind==='elite'?['relic','hero','reward']:['hero','reward'];
  r.stage='next';$('modalHint').textContent='選擇獎勵';
 }else{
  r.lives--;r.loseLine=towerLine('lose',STORY.lose);r.fort=frac.map(x=>Math.max(x,.6));
  if(r.lives<=0){towerFinish(false);return;}
  r.stage='map';r.pending=null;r.chosen[r.floor-1]=undefined;
  $('modalText').textContent+=' · 剩餘戰旗 '+r.lives;$('modalHint').textContent='堡壘稍作修補，重整後再戰';
 }
 towerSave();
}
function towerWhere(){const c=towerChapter(towerRun.floor);return c<0?'序章':c<6?STORY.chapters[c].name:'環中無王';}
function towerFinish(victory){
 towerRun.stage=victory?'story':'defeat';if(victory)towerRun.story={id:'ending',after:'victory'};towerBest=Math.max(towerBest,victory?TOWER_FLOORS:towerRun.floor-1);towerSave();
 $('modalTitle').textContent=victory?'環已重轉，征程通關！':'戰旗倒下，這輪征程到此為止。';
 $('modalHint').textContent=victory?'六枚律種已歸位':'止步於「'+towerWhere()+'」';
}
function towerNextStage(){
 const r=towerRun;r.options=null;
 const next=r.queue.shift();
 if(!next){towerAdvance();return;}
 if(next==='seed'){const c=towerChapter(r.floor);if(!r.seeds.includes(c))r.seeds.push(c);const hid=Object.keys(SixEngine.HEROES).find(id=>CARDS[id].faction===STORY.chapters[c].faction);const recruit=hid&&!r.heroes.includes(hid)?hid:null;if(recruit)r.heroes.push(recruit);r.stage='story';r.story={id:'seed'+c,after:'next',recruit};towerSave();towerRender();return;}
 if(next==='camp'){r.stage='camp';r.pending={kind:'camp'};r.camps=(r.camps||0)+1;{const who=towerPick(Object.keys(STORY.camps)),c=STORY.camps[who];r.camp={who,role:c.role,text:towerLine('camp'+who,c.lines)};}towerSave();towerRender();return;}
 if(next==='hero'&&!r.heroes.length){towerNextStage();return;}
 r.stage=next;
 if(next==='relic')r.options=towerRelicOffer(2);
 else if(next==='hero')r.options=towerHeroUpOffer();
 else if(next==='reward')r.options=towerCardOffer(towerHas('bounty')?4:3,r.pending&&r.pending.kind==='elite');
 if(next==='relic'&&!r.options.length){towerNextStage();return;}
 towerSave();towerRender();
}
const towerIntroOf=f=>f>=2&&f<=12&&f%2===0?'ch'+towerChapter(f):f===14?'finale':f===15?'confront':null;
function towerAdvance(){
 const r=towerRun;r.floor++;r.options=null;r.pending=null;r.queue=[];r.winLine=null;
 const intro=towerIntroOf(r.floor);
 if(intro){r.stage='story';r.story={id:intro,after:'map'};}else r.stage='map';
 towerSave();towerRender();
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
function towerUpHTML(u,attrs=''){return `<button class="tw-relic rare" ${attrs}>${relicIcon({rarity:'rare',frame:'hex',glyph:u.glyph,tint:u.tint,src:u.src},56)}<strong>${u.name}${towerRun.ups[u.id]?' <small>→ Lv.'+(towerRun.ups[u.id]+1)+'</small>':''}</strong><em>${u.desc}</em></button>`;}
function towerFlagSrc(){const r=towerRun;return r.heroes.length?`assets/emblems/flag-${CARDS[r.heroes[0]].faction}.webp`:'assets/emblems/logo-6.webp';}
function towerFlags(){const r=towerRun,total=Math.max(TOWER_LIVES,r.lives);return Array.from({length:total},(_,i)=>`<img class="tw-flag ${i<r.lives?'':'lost'}" src="${towerFlagSrc()}" alt="戰旗">`).join('');}
function towerRingHTML(){
 const r=towerRun,n=(r.seeds||[]).length;
 return `<div class="tw-ring" title="界律之環：已取得 ${n} / 6 枚律種"><img class="tw-ring-img" src="assets/story/ring-${n>=6?2:1}.webp" alt=""><div class="tw-seeds">${[0,1,2,3,4,5].map(i=>`<img class="tw-seed ${(r.seeds||[]).includes(i)?'lit':''}" src="assets/story/seed-${i}.webp" alt="${STORY.chapters[i].seed.name}" title="${STORY.chapters[i].seed.name}">`).join('')}</div></div>`;
}
function towerStoryHTML(id){
 const r=towerRun;
 let bg='',kicker='',title='',sub='',lines=[],extra='',button='繼續';
 if(id==='prologue'){const p=STORY.prologue;bg=p.bg;kicker=p.kicker;title=p.title;lines=[...p.lines,'',...p.after];button=p.button;}
 else if(/^ch\d$/.test(id)){const c=+id.slice(2),ch=STORY.chapters[c],g=ch.guardian;bg=ch.scene;kicker='第 '+(c+1)+' 章';title=ch.name;sub=ch.place;lines=[...ch.lines,'目標：'+ch.goal];
  extra=`<div class="ts-foe"><span class="tw-face" style="--ec:${g.color}">${portrait(g)}</span><div><b>${g.name}</b><small>${g.note}</small></div><img class="ts-badge" src="assets/emblems/badge-${ch.faction}.webp" alt=""></div>`;button='進入此境';}
 else if(/^seed\d$/.test(id)){const c=+id.slice(4),ch=STORY.chapters[c];kicker='律種';title=ch.seed.name+'・'+ch.seed.item;lines=[...(r.seeds.length===1?[STORY.firstSeed]:[]),ch.seed.line];
  extra=`<img class="ts-seed" src="assets/story/seed-${c}.webp" alt="">`+towerRingHTML()+(r.story&&r.story.recruit?`<div class="ts-foe"><span class="tw-face" style="--ec:${factions[CARDS[r.story.recruit].faction][2]}">${artSVG(r.story.recruit,'portrait')}</span><div><b>${CARDS[r.story.recruit].name}</b><small>${towerPick(STORY.answer)} 他願意借你力量。</small></div></div>`:'');button='收起律種';}
 else if(id==='spirits'){const f=STORY.spirits;bg=f.bg;kicker=f.kicker;title=f.title;lines=f.lines;button=f.button;extra=`<div class="tw-deck">${TOWER_SPIRITS.map(id=>towerCardHTML(id,'')).join('')}</div>`;}
 else if(id==='finale'){const f=STORY.finale;bg=f.bg;kicker=f.kicker;title=f.title;lines=f.lines;button=f.button;extra=towerRingHTML();}
 else if(id==='confront'){const f=STORY.confront;bg=f.bg;kicker=f.kicker;title=f.title;lines=f.lines;button=f.button;extra=`<div class="ts-foe big"><span class="tw-face" style="--ec:#e6d79a">${artSVG(f.portrait,'portrait')}</span><div><b>${STORY.finale.boss.name}</b><small>${STORY.finale.boss.note}</small></div></div>`;}
 else if(id==='ending'){const f=STORY.ending;bg=f.bg;kicker=f.kicker;title=f.title;if(!r.endLines){const hs=towerShuffle(r.heroes).slice(0,3).map(h=>towerPick(STORY.epilogue[h]||[''])).filter(Boolean),lost=Math.max(0,TOWER_LIVES-r.lives);r.endLines=[...hs,STORY.endLives[Math.min(2,lost)]];}lines=[...f.lines,'',...r.endLines];button=f.button;extra=`<img class="tw-ring-img big" src="assets/story/ring-2.webp" alt="">`;}
 const fx=/^ch\d$/.test(id)?STORY.chapters[+id.slice(2)]:/^seed\d$/.test(id)?STORY.chapters[+id.slice(4)]:null;
 return `<div class="tw-story ${bg?'has-bg':''} ${fx?'tint':''}" style="${bg?`--bg:url(${bg});`:''}${fx?`--tint:${fx.guardian.color}`:''}">${fx?`<img class="ts-flagbg" src="assets/emblems/flag-${fx.faction}.webp" alt="">`:''}<div class="ts-body"><small class="ts-kicker">${kicker}</small><h2>${title}</h2>${sub?`<small class="ts-sub">${sub}</small>`:''}<div class="ts-lines">${lines.map((t,i)=>t?`<p class="ts-line" style="--i:${i}">${t}</p>`:'<br>').join('')}</div>${extra}<div class="tw-actions"><button class="primary" id="twStoryNext">${button} →</button></div></div></div>`;
}
function towerStoryDone(){
 const r=towerRun,after=r.story&&r.story.after;r.story=null;
 if(after==='next'){towerNextStage();return;}
 if(after==='spirits'){r.stage='story';r.story={id:'spirits',after:'map'};towerSave();towerRender();return;}
 r.stage=after||'map';towerSave();towerRender();
}
function towerMe(){
 const r=towerRun,lead=r.heroes[0]?CARDS[r.heroes[0]]:null;
 const fort=r.fort.map(f=>`<i style="--p:${Math.round(f*100)}%"></i>`).join('');
 const face=id=>`<span class="tw-hface" title="${CARDS[id].name}" style="--ec:${factions[CARDS[id].faction][2]}">${artSVG(id,'portrait')}</span>`;
 return `<div class="tw-me"><div class="tw-hero"><span class="tw-hface tw-pface" title="織律者">${artSVG('story_player','portrait')}</span><div><b>${lead?'織律者 · '+lead.name.split('・')[0]+(r.heroes.length>1?' 等 '+r.heroes.length+' 位旗主':''):'織律者'}</b><small>${lead?'Lv.'+(1+heroUpCount())+' · ':'中立精靈同行 · '}${r.wins} 勝</small></div>${r.heroes.map(face).join('')}</div>
 <div class="tw-fort" title="堡壘耐久（跨場保留，營地可修復）"><small>堡壘</small>${fort}</div>
 <div class="tw-lives" title="剩餘戰旗">${towerFlags()}</div>
 <div class="tw-relics">${r.relics.map(id=>{const x=relicById(id);return `<span title="${x.name}：${x.desc}">${relicIcon(x,32)}</span>`;}).join('')||'<small>尚無遺物</small>'}</div></div>`;
}
function towerHeader(){return `<div class="tw-head">${towerMe()}<button class="outline" id="twExit">離開（可續玩）</button></div>${towerRun.winLine&&towerRun.stage!=='camp'?`<p class="tw-flavor">${towerRun.winLine}</p>`:''}`;}
function towerDeckStrip(clickable){return `<div class="tw-deck">${towerRun.deck.map(id=>towerCardHTML(id,clickable&&CARDS[id].tier!=='hero'?`data-replace="${id}"`:'')).join('')}</div>`;}
function towerFlavorHTML(){
 const r=towerRun,c=towerChapter(r.floor),key=c<0?'p':c<6?c:'f';r.flavor=r.flavor||{};
 if(!r.flavor[r.floor])r.flavor[r.floor]=towerLine('pre'+key,STORY.pre[key]);
 const lose=r.loseLine;r.loseLine=null;
 return `<p class="tw-flavor">${lose?lose+'　':''}${r.flavor[r.floor]}</p>`;
}
function towerMapHTML(){
 const r=towerRun;let track='';
 for(let f=1;f<=TOWER_FLOORS;f++){
  const nodes=r.map[f-1],cur=f===r.floor,past=f<r.floor,kinds=past?[r.chosen[f-1]||'battle']:nodes.map(n=>n.kind);
  track+=`<div class="tw-cell ${cur?'cur':past?'past':'future'} ${kinds.length===1?kinds[0]:''}"><b>${f}</b><span>${kinds.map(k=>NODE_INFO[k].glyph).join('')}</span></div>`;
 }
 const nodes=r.map[r.floor-1];
 const cards=nodes.map((n,i)=>{const info=NODE_INFO[n.kind],cm=n.cm||(n.commander&&commanders.find(c=>c.name===n.commander));
  if(!cm)return `<button class="tw-node ${n.kind}" data-node="${i}"><span class="glyph">${info.glyph}</span><strong>${info.name}</strong><em>${info.note}</em></button>`;
  return `<button class="tw-node foe ${n.kind}" data-node="${i}"><span class="tw-badge">${info.glyph} ${info.name}</span><span class="tw-face" style="--ec:${cm.color}">${portrait(cm)}</span><strong>${cm.name}</strong><small>${n.cm?cm.note:cm.label+'型 · '+n.deckName}</small><span class="tw-go">開始戰鬥 →</span></button>`;}).join('');
 const chn=towerChapter(r.floor),chTitle=chn<0?'序章 · 斷橋':chn<6?'第 '+(chn+1)+' 章 · '+STORY.chapters[chn].name+'（'+STORY.chapters[chn].place+'）':'終章 · 環中無王';
 return `<div class="tw-top"><b>單人模式</b><button class="outline" id="twExit">離開（可續玩）</button></div><div class="tw-track">${track}</div>${towerRingHTML()}<h3 class="tw-sec foe">${chTitle}</h3>${towerFlavorHTML()}<div class="tw-nodes">${cards}</div>`;
}
function towerRender(){
 if(towerPanel.hidden)return;
 const r=towerRun;let h='';
 if(r&&r.stage==='next'){towerNextStage();return;}
 if(!r){
  h=`<div class="tw-head"><div><b>單人模式</b></div><button class="outline" id="twExit">返回</button></div><div class="tw-story has-bg" style="--bg:url(assets/story/camp.webp)"><div class="ts-body"><small class="ts-kicker">織律者</small><h2>沒有旗，也沒有牌組</h2><div class="ts-lines"><p class="ts-line" style="--i:0">你想修復這個世界。</p><p class="ts-line" style="--i:1">世界聽見了，把失律洩出的六個精靈借給你。</p><p class="ts-line" style="--i:2">先靠它們走出這座橋。旗主們也會一個一個回應你。</p></div><div class="tw-deck">${TOWER_SPIRITS.map(id=>towerCardHTML(id,'')).join('')}</div><p class="tw-sub">世界借給你八隻律靈，整副牌就是它們。兩隻特定的律靈相鄰部署，會合體成更大的律靈。你有 ${TOWER_LIVES} 面戰旗，敗北一次折一面。</p><div class="tw-actions"><button class="primary" data-start="go">出發 →</button></div></div></div>`;
 }else if(r.stage==='story'){
  h=towerStoryHTML(r.story.id);
 }else if(r.stage==='map'){
  h=towerMapHTML()+`<h3 class="tw-sec me">我方</h3>`+towerMe()+towerDeckStrip(false);
 }else if(r.stage==='camp'){
  const cp=r.camp||{who:'布倫',role:STORY.camps['布倫'].role,text:STORY.camps['布倫'].lines[0]},cpArt={'伊芙':'cp_0','布倫':'cp_1','瑟葵':'cp_2'}[cp.who];
  h=towerHeader()+`<div class="tw-camp" style="--bg:url(assets/story/camp.webp)"><span class="tw-face cp-face">${artSVG(cpArt,'portrait')}</span><div class="tw-companion"><b>${cp.who}</b><small>${cp.role}</small><p>「${cp.text}」</p></div></div><h2>營地</h2><p class="tw-sub">做一件事再出發。</p><div class="tw-nodes"><button class="tw-node camp" data-camp="repair"><span class="glyph">🛠</span><strong>布倫 · 修復堡壘</strong><em>堡壘耐久全部回滿（目前 ${r.fort.map(f=>Math.round(f*100)+'%').join(' / ')}）</em></button><button class="tw-node camp" data-camp="recruit"><span class="glyph">✚</span><strong>伊芙 · 招募新卡</strong><em>五選一（含一張菁英），可換掉牌組中一張卡</em></button>${r.heroes.length?'<button class="tw-node camp" data-camp="hero"><span class="glyph">★</span><strong>瑟葵 · 旗主訓練</strong><em>強化旗主一次</em></button>':''}</div>`;
 }else if(r.stage==='relic'){
  h=towerHeader()+`<h2>精英戰利品：選擇一件遺物</h2><div class="tw-offer relics">${r.options.map(id=>towerRelicHTML(relicById(id),`data-relic="${id}"`)).join('')}</div>`;
 }else if(r.stage==='hero'){
  h=towerHeader()+`<h2>強化旗主</h2><div class="tw-offer relics">${r.options.map(id=>towerUpHTML(upById(id),`data-up="${id}"`)).join('')}</div>`;
 }else if(r.stage==='reward'){
  h=towerHeader()+`<h2>戰利品：選擇一張卡</h2><p class="tw-sub">先點選要加入的卡，再點選牌組中要換掉的卡（主角英雄不能換）；也可以略過。</p><div class="tw-offer">${r.options.map(id=>towerCardHTML(id,`data-offer="${id}"`)).join('')}</div><div class="tw-actions"><button class="outline" id="twSkip">略過獎勵</button></div><h3 id="twReplaceLabel">目前牌組</h3>`+towerDeckStrip(true);
 }else{
  const win=r.stage==='victory';
  h=`<div class="tw-result"><img class="tw-emblem big" src="${r.heroes.length?'assets/emblems/badge-'+CARDS[r.heroes[0]].faction+'.webp':'assets/emblems/logo-6.webp'}" alt="">${win?'':`<img class="tw-flag lost big" src="${towerFlagSrc()}" alt="">`}</div><h2>${win?'環重新轉動':'戰旗倒下'}</h2><p class="tw-sub">${win?'六枚律種歸位，界環重新轉動。':'止步於「'+towerWhere()+'」。'}</p>${win?'':towerRingHTML()}`+towerDeckStrip(false)+`<div class="tw-actions"><button class="primary" id="twAgain">再爬一次</button><button class="outline" id="twExit">返回</button></div>`;
 }
 towerPanel.innerHTML='<div class="tw-inner">'+h+'</div>';
 towerSelected=null;towerPanel.classList.remove('choosing');
}
towerPanel.addEventListener('click',e=>{
 const q=s=>e.target.closest(s);let t;
 if(q('#twExit')){towerHidePanel();exitTowerMode();return;}
 if(q('#twStoryNext')){towerStoryDone();return;}
 if(q('.tw-story')&&!q('button')){q('.tw-story').classList.add('skip');return;}
 if(q('#twAgain')){towerRun=null;towerSave();towerRender();return;}
 if(t=q('[data-start]')){towerNewRun();return;}
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
/* 單人模式：戰場依章節固定（序章、終章用關門之城） */
const _selectBattlefield=selectBattlefield;
selectBattlefield=function(){
 if(towerCtx&&towerRun){const c=towerChapter(towerRun.floor),id='ch'+(c<0||c>5?0:c);currentMap=SixPresentation.maps.find(m=>m.id===id)||currentMap;lastMap=currentMap.id;updateMapLabel();return;}
 return _selectBattlefield();
};
const newLobbyRaw=newLobby;
function exitTowerMode(){if(towerCtx||realDeck){towerCtx=null;if(realDeck){deck=realDeck;realDeck=null;}towerHud.hidden=true;newLobbyRaw();}}
newLobby=function(){if(towerCtx)exitTowerMode();else{newLobbyRaw();if(typeof STORY!=='undefined'&&mode==='ready')$('modalTitle').textContent=towerPick(STORY.lobby);}};
const baseEndUI=endUI;
endUI=function(){baseEndUI();if(towerCtx){towerBattleEnded();}};
$('deckTab').addEventListener('click',()=>{if(towerCtx)exitTowerMode();},true);
function towerUpdateHud(){if(towerCtx&&towerRun){towerHud.hidden=false;towerHud.innerHTML='單人模式 · 英雄 Lv.'+(1+heroUpCount())+' · <span class="hud-flags">'+towerFlags()+'</span>';}else towerHud.hidden=true;}
setInterval(towerUpdateHud,300);
towerLoad();
