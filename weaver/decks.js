/* 牌組入口：上方並列「旗系精編」與「英雄陣容」（點一套直接套用）；英雄直接在卡池裡挑；右側是出戰英雄與八張編制 */
(()=>{
 const THEME=[0,1,2,25,3,4,5,6,7,21,22,23,24],BANNER=[8,15,9,16,10,17,11,18,12,19,13,20,14]; /* 每勢力兩套（主戰／輔助英雄各一），律靈一套 */
 const facOf=i=>{const c={};for(const id of presets[i][2]){const f=CARDS[id].faction;c[f]=(c[f]||0)+1;}return +Object.keys(c).sort((a,b)=>c[b]-c[a])[0];};
 const box=document.createElement('section');box.id='presetPicker';
 box.innerHTML='<div class="pp-top"><b>預設牌組</b><div class="pp-tabs"><button data-g="banner">旗系精編</button><button data-g="theme">英雄陣容</button></div><button class="pp-fold" type="button">收合</button></div><div class="pp-cols"><div class="pp-col" data-g="banner"><h4>旗系精編</h4><div class="pp-list"></div></div><div class="pp-col" data-g="theme"><h4>英雄陣容</h4><div class="pp-list"></div></div></div>';
 const layout=document.querySelector('#deckView .deck-layout');layout.before(box);
 /* 往下捲到看不見預設牌組區時，頂端凍結一條：目前套用的預設牌組名稱與玩法簡介（點一下回到預設牌組區） */
 const bar=document.createElement('div');bar.id='presetBar';bar.innerHTML='<b>預設牌組</b><span class="pb-n"></span><span class="pb-d"></span>';box.before(bar);
 try{new IntersectionObserver(([e])=>bar.classList.toggle('show',!e.isIntersecting&&e.boundingClientRect.top<0)).observe(box);}catch{}
 bar.addEventListener('click',()=>box.scrollIntoView({behavior:'smooth',block:'start'}));
 let group='theme',folded=false;try{folded=localStorage.getItem('six-banners-ppfold')==='1';}catch{}
 box.classList.toggle('folded',folded);box.querySelector('.pp-fold').textContent=folded?'展開':'收合';
 const same=(a,b)=>a.length===b.length&&a.every((id,i)=>id===b[i]);
 const match=()=>presets.findIndex(p=>same(p[2],draft));
 const groupOf=i=>BANNER.includes(i)?'banner':'theme';
 const item=(i,cur,banner)=>{const p=presets[i],fi=banner?facOf(i):CARDS[(p[3]||[])[0]]?CARDS[p[3][0]].faction:-1,f=fi>=0?factions[fi]:null;return `<button class="pp-item ${cur===i?'on':''}" data-i="${i}" title="${p[1]}" ${f?`style="--f:${f[2]}"`:''}>${f?`<span class="pp-crest">${SixPresentation.crest(fi)}</span>`:''}<span class="pp-txt"><b>${p[0]}</b><small>${p[1]}</small></span></button>`;};
 let lastCur=-2;
 function paint(){
  const cur=match();if(cur>=0&&cur!==lastCur)group=groupOf(cur);lastCur=cur; /* 只在套用的牌組換了才自動切分頁，不然手動點分頁會被切回去 */
  bar.querySelector('.pb-n').textContent=cur>=0?presets[cur][0]:'自訂牌組';bar.querySelector('.pb-d').textContent=cur>=0?presets[cur][1]:'目前的八張牌與任何預設牌組都不完全相同。';
  box.dataset.g=group;box.querySelectorAll('.pp-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.g===group));
  box.querySelector('.pp-col[data-g="banner"] .pp-list').innerHTML=BANNER.map(i=>item(i,cur,true)).join('');
  box.querySelector('.pp-col[data-g="theme"] .pp-list').innerHTML=THEME.map(i=>item(i,cur,false)).join('');
 }
 box.addEventListener('click',e=>{
  const f=e.target.closest('.pp-fold');if(f){folded=!folded;box.classList.toggle('folded',folded);f.textContent=folded?'展開':'收合';try{localStorage.setItem('six-banners-ppfold',folded?'1':'0');}catch{}return;}
  const t=e.target.closest('.pp-tabs button');if(t){group=t.dataset.g;paint();return;}
  const it=e.target.closest('.pp-item');if(it){const pr=presets[+it.dataset.i];draft=[...pr[2]];if(pr[3]&&pr[3][0])draftHero=pr[3][0];renderDraft();renderCollection();paintHero();}
 });
 const _rd=renderDraft;renderDraft=function(){_rd.apply(this,arguments);paint();};
 /* 出戰英雄：放在右側編制欄最上面（不占 8 張牌）；英雄本人在左邊卡池裡挑 */
 const heroSlotEl=document.createElement('section');heroSlotEl.id='heroSlotBox';
 document.querySelector('#deckView .deck-sidebar').prepend(heroSlotEl);
 function paintHero(){
  const id=draftHero&&SixEngine.HEROES[draftHero]&&!CARDS[draftHero].aiOnly?draftHero:Object.keys(SixEngine.HEROES).filter(k=>!CARDS[k].aiOnly)[0],H=SixEngine.HEROES[id],c=CARDS[id],f=factions[c.faction];
  heroSlotEl.style.setProperty('--f',f[2]);
  heroSlotEl.innerHTML=`<div class="hs-head"><b>出戰英雄</b></div><div class="hs-body"><span class="hs-face">${artSVG(id,'portrait')}</span><div class="hs-txt"><b style="color:${f[2]}">${c.name}</b><span>登場條件：${SixEngine.heroCond(H)}</span><span class="hs-rules">${SixPresentation.rules(c)}</span></div></div>`;
 }
 window.paintHero=paintHero;
 heroSlotEl.addEventListener('click',()=>{if(!draftHero)return;filter=String(CARDS[draftHero].faction);$('factionFilters').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x.dataset.f===filter));renderCollection();});
 /* 模擬勝率：用目前的八張牌＋出戰英雄，自動對戰每一套預設牌組（先後手各半），在瀏覽器裡分批跑；電腦對電腦，真人手動會比這個高 */
 const simBtn=document.createElement('button');simBtn.id='simBtn';simBtn.type='button';simBtn.className='outline wide';simBtn.textContent='模擬勝率';
 const simBox=document.createElement('div');simBox.id='simBox';
 $('clearDeck').after(simBtn,simBox);
 let simRun=0;
 simBtn.onclick=async()=>{
  if(!Battle.prototype.validDeck(draft)){toast('先編滿八張合法牌組再模擬。');return;}
  const run=++simRun,per=4,list=presets.map((p,i)=>[p,i]),total=list.length*per,deckNow=[...draft],heroNow=draftHero||heroSlot;
  simBtn.disabled=true;simBtn.textContent='模擬中…';const rows=[];let win=0,done=0;
  for(const [p,i] of list){
   if(run!==simRun)break;let w=0;
   for(let s=0;s<per;s++){
    const side=s%2,seed=(i+1)*7919+s*104729;
    try{
     const b=side?new Battle(p[2],deckNow,seed,{heroes:[p[3]||[],[heroNow]]}):new Battle(deckNow,p[2],seed,{heroes:[[heroNow],p[3]||[]]});
     b.auto=[true,true];b.state='playing';let st=0;while(b.state==='playing'&&st<9000){b.step(.1);st++;}
     w+=b.winner===(side?1:0)?1:b.winner===-1||b.winner==null?.5:0;
    }catch(e){}
    done++;
   }
   win+=w;rows.push([p[0],w,per]);
   simBox.innerHTML=`<div class="sim-head">模擬中 ${done} / ${total}（目前 ${Math.round(100*win/done)}%）</div>`;
   await new Promise(r=>setTimeout(r,0));
  }
  if(run===simRun){
   const pct=Math.round(100*win/total);rows.sort((a,b)=>b[1]-a[1]);
   simBox.innerHTML=`<div class="sim-head"><b>${pct}%</b> 整體勝率<small>（${total} 場，電腦對電腦）</small></div><div class="sim-list">${rows.map(([n,w,t])=>`<div class="sim-row ${w/t>=.75?'good':w/t<=.25?'bad':''}"><span>${n}</span><b>${w} / ${t}</b></div>`).join('')}</div>`;
  }
  simBtn.disabled=false;simBtn.textContent='重新模擬';
 };
 const _rd2=renderDraft;renderDraft=function(){_rd2.apply(this,arguments);if(!simBtn.disabled&&simBox.innerHTML){simBtn.textContent='牌組已變，重新模擬';}};
 const _od=openDeck;openDeck=function(){_od.apply(this,arguments);draftHero=heroSlot;paintHero();paint();renderDraft();filter=String(CARDS[heroSlot].faction);$('factionFilters').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x.dataset.f===filter));renderCollection();};
 const _save=$('saveDeck').onclick;$('saveDeck').onclick=()=>{heroSlot=draftHero||heroSlot;try{localStorage.setItem('six-banners-hero',heroSlot);}catch{}_save();};
 $('deckTab').onclick=$('editDeck').onclick=openDeck;
})();
