/* 牌組三層入口：旗系精編（六旗各一套純旗牌組）／名將戰法（跨旗流派）／自由編成 */
(()=>{
 const THEME=[0,1,2,3,4,5,6,7],BANNER=[8,9,10,11,12,13];
 const box=document.createElement('section');box.id='presetPicker';
 box.innerHTML='<div class="pp-tabs"><button data-g="banner">旗系精編</button><button data-g="theme">名將戰法</button><button data-g="free">自由編成</button></div><div class="pp-note"></div><div class="pp-list"></div>';
 const layout=document.querySelector('#deckView .deck-layout');layout.before(box);
 let group=null;
 const same=(a,b)=>a.length===b.length&&a.every((id,i)=>id===b[i]);
 const match=()=>presets.findIndex(p=>same(p[2],draft));
 const groupOf=i=>BANNER.includes(i)?'banner':THEME.includes(i)?'theme':'free';
 function paint(){
  const cur=match();if(group===null||!box.dataset.touched)group=cur<0?'free':groupOf(cur);
  box.querySelectorAll('.pp-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.g===group));
  const note=box.querySelector('.pp-note'),list=box.querySelector('.pp-list');
  if(group==='free'){note.textContent='從下方卡池自由挑八張；同一勢力湊滿 2／4／6 張可解鎖旗印。';list.innerHTML='';return;}
  note.textContent=group==='banner'?'六面勢力各一套：整副同旗，旗印直達最高檔。':'跨旗流派：把不同勢力的長處湊成一套戰法。';
  const idx=group==='banner'?BANNER:THEME;
  list.innerHTML=idx.map(i=>{const p=presets[i],f=group==='banner'?factions[i-8]:null;return `<button class="pp-item ${cur===i?'on':''}" data-i="${i}" ${f?`style="--f:${f[2]}"`:''}>${f?`<span class="pp-crest">${SixPresentation.crest(i-8)}</span>`:''}<span class="pp-txt"><b>${p[0]}</b><small>${p[1]}</small></span></button>`;}).join('');
 }
 box.addEventListener('click',e=>{
  const t=e.target.closest('.pp-tabs button');if(t){group=t.dataset.g;box.dataset.touched='1';paint();return;}
  const it=e.target.closest('.pp-item');if(it){const pr=presets[+it.dataset.i];draft=[...pr[2]];if(pr[3]&&pr[3][0])draftHero=pr[3][0];box.dataset.touched='';renderDraft();renderCollection();paintHero();}
 });
 const _rd=renderDraft;renderDraft=function(){_rd.apply(this,arguments);paint();};
 /* 英雄格：選一位英雄（不占 8 張牌）；登場條件與主動技在卡片上顯示 */
 const heroBox=document.createElement('section');heroBox.id='heroPicker';
 heroBox.innerHTML='<div class="hp-head"><b class="hp-title">英雄格</b><small>不占 8 張牌；算一張同勢力牌</small></div><div class="hp-row"></div><div class="hp-detail"></div>';
 const pickers=document.createElement('div');pickers.id='deckPickers';box.before(pickers);pickers.append(box,heroBox);
 function paintHero(){
  heroBox.querySelector('.hp-row').innerHTML=Object.keys(SixEngine.HEROES).map(id=>{const c=CARDS[id],f=factions[c.faction];return `<button class="hp-av ${draftHero===id?'on':''}" data-hero="${id}" style="--f:${f[2]}" title="${c.name}"><span class="hp-face">${artSVG(id,'portrait')}</span><small>${c.name.split('・')[0]}</small></button>`;}).join('');
  const id=draftHero&&SixEngine.HEROES[draftHero]?draftHero:Object.keys(SixEngine.HEROES)[0],H=SixEngine.HEROES[id],c=CARDS[id],f=factions[c.faction];
  heroBox.querySelector('.hp-detail').innerHTML=`<b style="color:${f[2]}"><img class="hp-skill" src="assets/icons/skill-${id}.webp" alt="">${c.name}</b><span>登場：${H.cond} ${H.need}${H.timeNeed?'（或 '+H.timeNeed+' 秒）':''}，花 ◆${c.cost+SixEngine.HERO_SUMMON_EXTRA}</span><span>技能「${H.skill}」：${H.desc}</span>`;
 }
 heroBox.addEventListener('click',e=>{const b=e.target.closest('.hp-av');if(!b)return;draftHero=b.dataset.hero;paintHero();renderDraft();});
 const _od=openDeck;openDeck=function(){box.dataset.touched='';_od.apply(this,arguments);draftHero=heroSlot;paintHero();paint();renderDraft();filter=String(CARDS[heroSlot].faction);$('factionFilters').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x.dataset.f===filter));renderCollection();};
 const _save=$('saveDeck').onclick;$('saveDeck').onclick=()=>{heroSlot=draftHero||heroSlot;try{localStorage.setItem('six-banners-hero',heroSlot);}catch{}_save();};
 $('deckTab').onclick=$('editDeck').onclick=openDeck;
})();
