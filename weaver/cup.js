'use strict';
/* 盃賽：無盡鏖戰裡的賽事選項。8 強單淘汰，三輪（8 強、4 強、決賽）。
   籤表開局公開；你的對手每輪都是固定的織律者；其他對戰用快速模擬決勝負。
   進度與名次紀錄存在瀏覽器（six-banners-cup / six-banners-cup-rec）。 */
(()=>{
 const KEY='six-banners-cup',REC='six-banners-cup-rec',ROUNDS=['8 強','4 強','決賽'];
 const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d;}catch{return d;}};
 const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}};
 let run=load(KEY,null);
 const rec=()=>Object.assign({champ:0,runner:0,top4:0,top8:0,runs:0},load(REC,{}));
 const shuffle=a=>{const r=[...a];for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]];}return r;};
 const rv=i=>RIVALS[i];

 /* 快速模擬兩位織律者對戰，回傳勝者（0＝A、1＝B） */
 function simulate(a,b){
  const da=presets[a.decks[Math.floor(Math.random()*a.decks.length)]][2],db=presets[b.decks[Math.floor(Math.random()*b.decks.length)]][2];
  const g=new Battle(da,db,Math.floor(Math.random()*1e9),{aiStyles:[a.style,b.style],shuffle:true,items:true});g.auto=[true,true];
  for(let n=0;n<4805&&g.state==='playing';n++)g.step(.05);
  return g.winner===0?0:g.winner===1?1:(Math.random()<.5?0:1);
 }
 function newRun(){
  const rivals=shuffle(RIVALS.map((_,i)=>i)).slice(0,7);
  run={field:['me',...rivals],round:0,rounds:[],over:false,place:'',pending:null};
  /* rounds[r] = 該輪勝者名單；field 就是第 0 輪的參賽者，順序即籤位 */
  save(KEY,run);
 }
 const current=()=>run.rounds.length?run.rounds[run.rounds.length-1]:run.field;
 const myOpponent=()=>{const cur=current(),i=cur.indexOf('me');return cur[i%2===0?i+1:i-1];};
 function finishRound(myWon){
  const cur=current(),next=[];
  for(let i=0;i<cur.length;i+=2){
   const a=cur[i],b=cur[i+1];
   if(a==='me'||b==='me'){next.push(myWon?'me':(a==='me'?b:a));}
   else next.push(simulate(rv(a),rv(b))===0?a:b);
  }
  run.rounds.push(next);
  const r=run.rounds.length; // 已完成輪數
  if(!myWon){run.over=true;run.place=r===1?'八強':r===2?'四強':'亞軍';}
  else if(next.length===1){run.over=true;run.place='冠軍';}
  if(run.over){const c=rec();c.runs++;if(run.place==='冠軍')c.champ++;else if(run.place==='亞軍')c.runner++;else if(run.place==='四強')c.top4++;else c.top8++;save(REC,c);}
  save(KEY,run);
 }

 /* ---------- 畫面 ---------- */
 const panel=document.createElement('div');panel.id='cupPanel';panel.hidden=true;document.body.appendChild(panel);
 const face=i=>i==='me'?`<span class="cu-face me">${artSVG('story_player','portrait')}</span>`:`<span class="cu-face" style="--ec:${rv(i).color}">${artSVG(rv(i).art,'portrait')}</span>`;
 const nm=i=>i==='me'?'你':rv(i).name;
 function bracketHTML(anim){
  const cols=[run.field,...run.rounds],nc=run.rounds.length;let h='<div class="cp-bracket">';
  for(let r=0;r<4;r++){
   const list=cols[r];
   if(r===3){h+=`<div class="cp-col"><h4>冠軍</h4>${list&&list.length===1?`<div class="cp-slot champ ${list[0]==='me'?'me':''} ${anim&&nc===3?'reveal adv':''}" style="animation-delay:${anim?.9:0}s">${face(list[0])}<b>${nm(list[0])}</b></div>`:'<div class="cp-slot ghost"><b>？</b></div>'}</div>`;continue;}
   h+=`<div class="cp-col"><h4>${ROUNDS[r]}</h4>`;
   const n=[8,4,2][r];
   for(let k=0;k<n;k++){
    const id=list?list[k]:undefined,lost=cols[r+1]&&id!==undefined&&!cols[r+1].includes(id);
    const fresh=anim&&r===nc,prev=anim&&r===nc-1;
    h+=id===undefined?'<div class="cp-slot ghost"><b>？</b></div>':`<div class="cp-slot ${id==='me'?'me':''} ${lost?'out':''} ${fresh?'reveal':''} ${fresh&&id==='me'?'adv':''} ${prev&&lost?'fade':''} ${prev&&id==='me'&&lost?'lose':''}" style="${fresh?'animation-delay:'+(.5+k*.25)+'s':prev&&lost?'animation-delay:.1s':''}">${face(id)}<b>${nm(id)}</b></div>`;
   }
   h+='</div>';
  }
  return h+'</div>';
 }
 function show(msg,anim){
  const c=rec(),r=run?run.rounds.length:0;let body;
  if(!run){
   body=`<p class="cp-lead">8 位織律者，單淘汰。籤表一開始就公開，你要一路打到決賽。輸了就出局。</p><p class="cp-rec">紀錄　冠軍 ${c.champ}　亞軍 ${c.runner}　四強 ${c.top4}　八強 ${c.top8}　參賽 ${c.runs} 次</p><div class="cp-actions"><button class="primary" id="cpNew">報名參賽</button></div>`;
  }else if(run.over){
   body=`${bracketHTML(anim)}${anim?`<div class="cp-banner ${anim.won?'up':'down'}">${run.place==='冠軍'?'冠軍！':anim.won?'晉級 '+ROUNDS[run.rounds.length]+'！':'出局'}</div>`:''}<p class="cp-result ${run.place==='冠軍'?'win':''}">${run.place==='冠軍'?'你是這屆盃賽的冠軍。':'你止步於'+run.place+'。'}</p><p class="cp-rec">紀錄　冠軍 ${c.champ}　亞軍 ${c.runner}　四強 ${c.top4}　八強 ${c.top8}　參賽 ${c.runs} 次</p><div class="cp-actions"><button class="primary" id="cpNew">再報名一次</button><button class="cp-link" id="cpBack">回大廳</button></div>`;
  }else{
   const o=myOpponent(),rr=rv(o);
   body=`${bracketHTML(anim)}${anim?`<div class="cp-banner up">晉級 ${ROUNDS[run.rounds.length]}！</div>`:''}${msg?`<p class="cp-msg">${msg}</p>`:''}<div class="cp-next" style="--ec:${rr.color}">${face(o)}<div><small>${ROUNDS[r]} 對手</small><b>${rr.name}</b><p>${rr.trait}</p><p class="ct">對策：${rr.counter}</p></div></div><p class="cp-hint">每一輪之間可以到「軍備與構築」調整牌組。</p><div class="cp-actions"><button class="primary" id="cpGo">開始 ${ROUNDS[r]}</button><button class="cp-link" id="cpBack">回大廳（進度保留）</button></div>`;
  }
  panel.innerHTML=`<div class="cp-box"><h2>盃賽</h2>${body}</div>`;panel.hidden=false;document.body.classList.add('cup-open');
  const g=id=>document.getElementById(id);
  if(g('cpNew'))g('cpNew').onclick=()=>{newRun();show();};
  if(g('cpGo'))g('cpGo').onclick=startMatch;
  if(g('cpBack'))g('cpBack').onclick=()=>{close();newLobby();};
 }
 function close(){panel.hidden=true;document.body.classList.remove('cup-open');}

 /* ---------- 對戰 ---------- */
 let active=false;
 function startMatch(){
  const o=myOpponent(),rr=rv(o),enemy=presets[rr.decks[Math.floor(Math.random()*rr.decks.length)]];
  close();active=true;
  battle=new Battle(deck,enemy[2],Date.now(),{aiStyles:['steady',rr.style],shuffle:true,heroes:[[heroSlot],enemy[3]||[]],items:true});
  battle.state='ready';battle.enemyName=rr.name;resetVisuals();lastHand='';lastLog='';selected=-1;
  $('opponentCard').innerHTML='<span class="opp-face" style="--ec:'+rr.color+'">'+portrait(rr)+'</span><strong>'+rr.name+' · '+rr.label+'</strong><small>'+rr.note+'</small>';
  renderHand();updateUI();mode='ready';
  $('watch').checked=false;$('mapChoice').value='random';speed=1;$('speed').textContent='1×';
  launchBattle();toast(ROUNDS[run.rounds.length]+' · 對手：'+rr.name);
 }
 /* 結束畫面的主按鈕：盃賽中回到賽程，不是再找一場 */
 const origFind=$('start').onclick;
 $('start').onclick=e=>{
  if(active&&mode==='ended'){
   active=false;
   if(battle.winner===2){show('這場平手，重賽一次。');return;}
   const won=battle.winner===0;finishRound(won);show(null,{won});try{beep(won?560:120,.3);}catch{}return;
  }
  return origFind&&origFind.call($('start'),e);
 };
 const origEnd=endUI;
 endUI=function(){origEnd();if(active){$('start').textContent=battle.winner===2?'查看賽程（重賽）':'查看賽程 →';$('modalHint').textContent=battle.winner===0?'晉級下一輪':battle.winner===1?'這場輸了就出局':'';}};
 /* 對局中途離開（結束對局）不算輸，賽程保留 */
 const origLobby=newLobby;
 newLobby=function(){active=false;return origLobby.apply(this,arguments);};

 /* ---------- 入口：大廳的「參加盃賽」 ---------- */
 const st=$('start'),btn=document.createElement('button');btn.id='cupBtn';btn.type='button';btn.hidden=true;
 (document.getElementById('homeBtn')||st).before(btn);
 btn.onclick=()=>show();
 setInterval(()=>{
  const lobby=typeof mode!=='undefined'&&mode==='ready'&&!(typeof towerCtx!=='undefined'&&towerCtx)&&!active;
  const t=run&&!run.over?'繼續盃賽':'參加盃賽';if(btn.textContent!==t)btn.textContent=t;
  if(btn.hidden===lobby)btn.hidden=!lobby;
 },300);
})();
