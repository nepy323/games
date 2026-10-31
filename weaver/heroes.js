/* 戰鬥中的英雄格與寶物：貼在戰場右上角。英雄達成條件後點一下→點己方半場登場；在場時再點一下發動主動技。寶物點一下使用。 */
let heroPick=-1;
(()=>{
 const bar=document.createElement('div');bar.id='fieldBar';document.querySelector('.control .resource').appendChild(bar);
 let sig='';
 const banner=document.createElement('div');banner.id='heroBanner';banner.hidden=true;document.querySelector('.arena').appendChild(banner);let bt=0;
 let lastQuip=0;const quip=(id,kind)=>{if(kind==='skill'){if(Date.now()-lastQuip<9000||Math.random()>.4)return;}lastQuip=Date.now();const L=typeof STORY!=='undefined'&&STORY.heroLines&&STORY.heroLines[id];if(!L)return;const pool=L[kind],c=CARDS[id],line=pool[Math.floor(Math.random()*pool.length)];
  banner.style.setProperty('--ec',factions[c.faction][2]);
  banner.innerHTML=`<span class="hb-face">${artSVG(id,'portrait')}</span><div><small>${kind==='skill'?'英雄技能':'英雄登場'}</small><b>${c.name.split('・')[0]}</b><p>「${line}」</p></div>`;
  banner.hidden=false;banner.classList.remove('show');void banner.offsetWidth;banner.classList.add('show');clearTimeout(bt);bt=setTimeout(()=>{banner.hidden=true;},2600);};
 window.heroQuip=quip;
 /* 技能扣點：能量數字抖動變紅，旁邊飄出 -1 */
 const energyPay=n=>{const box=document.querySelector('.control .resource>div'),num=document.getElementById('energy');if(!box||!num)return;
  box.classList.remove('pay');void box.offsetWidth;box.classList.add('pay');const tr=document.getElementById('crystals');if(tr){tr.classList.remove('pay');void tr.offsetWidth;tr.classList.add('pay');}
  const f=document.createElement('i');f.className='pay-float';f.textContent='−'+(n.paid||1)+' '+n.name;box.appendChild(f);setTimeout(()=>f.remove(),1100);};
 const ib=document.createElement('div');ib.id='itemBanner';ib.hidden=true;document.querySelector('.arena').appendChild(ib);let it=0;
 const itemBanner=n=>{const d=SixEngine.ITEMS.find(x=>x.id===n.item);if(!d)return;const foe=n.team!==0;
  ib.className=(foe?'foe ':'ally ')+'show';
  ib.innerHTML=`<img src="assets/relics/relic-${String(d.art).padStart(2,'0')}.webp" alt=""><div><small>${foe?'敵方使用寶物':'我方使用寶物'}</small><b>${d.name}</b><p>${d.desc}</p></div>`;
  ib.hidden=false;ib.classList.remove('show');void ib.offsetWidth;ib.classList.add('show');clearTimeout(it);it=setTimeout(()=>{ib.hidden=true;},2800);};
 window.itemBanner=itemBanner;
const SKILL_DOT='data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="#2a2418" stroke="#e7c47a" stroke-width="2.5"/><circle cx="16" cy="16" r="6" fill="#e7c47a"/></svg>');
window.SKILL_DOT=SKILL_DOT;
 const HERO_HS=new Proxy({},{get:(_,k)=>SixEngine.HEROES[k]&&SixEngine.HEROES[k].hs});
 const heroOf=id=>CARDS[id];
 const build=(st,items)=>{
  const keep=bar.querySelector('#fuseChip');
  bar.innerHTML=st.map(h=>`<button class="fb-chip fb-hero" data-hero="${h.idx}" style="--ec:${factions[heroOf(h.id).faction][2]}"><span class="fb-face">${artSVG(h.id,'portrait')}<i class="fb-ring"></i><img class="fb-skill" src="assets/icons/skill-${h.id}.webp" alt="" onerror="this.onerror=null;this.src=window.SKILL_DOT"></span><small class="fb-label"></small></button>`).join('')
   +items.map((it,i)=>{const d=SixEngine.ITEMS.find(x=>x.id===it.id);return `<button class="fb-chip fb-item" data-item="${i}" title="${d.name}：${d.desc}"><span class="fb-face"><img src="assets/relics/relic-${String(d.art).padStart(2,'0')}.webp" alt=""></span><small class="fb-label">${d.name}</small></button>`;}).join('');
 };
 const fmt=s=>Math.ceil(s)+'s';
 const update=()=>{
  const live=typeof battle!=='undefined'&&battle&&battle.players&&(mode==='playing'||mode==='paused')&&!battle.auto[0];
  bar.hidden=!live;if(!live){heroPick=-1;document.body.classList.remove('hero-pick');return;}
  const st=battle.heroStatus(0),items=battle.items[0],key=st.map(h=>h.id).join()+'|'+items.map(i=>i.id+i.gotAt).join();
  if(key!==sig){sig=key;build(st,items);}
  /* 逆反共振：場上有律靈可獻祭時亮起，提醒可以打出「逆反共振」 */
  const canFuse=deck.some(id=>SixEngine.FUSIONS.some(f=>f.a===id||f.b===id));
  let fc=bar.querySelector('#fuseChip');
  if(canFuse&&!fc){fc=document.createElement('button');fc.id='fuseChip';fc.type='button';fc.className='fb-chip fb-fuse';fc.innerHTML='<span class="fb-face"><b>合</b><i class="fb-ring"></i></span><small class="fb-label"></small>';fc.title='逆反共振：時間凍結，獻祭 0～2 組律靈，召出悖靈';fc.onclick=()=>toast('逆反共振（6 費）：施放區時間凍結，隨機獻祭 0～2 組律靈，召出悖靈。場上有律靈時亮起。');bar.prepend(fc);}
  if(fc){const ok=!!battle.anyResonance(0);fc.classList.toggle('ready',ok);fc.style.setProperty('--p','0%');fc.querySelector('.fb-label').textContent=ok?'可逆反共振':'待命';}
  bar.querySelectorAll('[data-hero]').forEach(el=>{
   const h=st[+el.dataset.hero],lab=el.querySelector('.fb-label'),ring=el.querySelector('.fb-ring');
   el.style.setProperty('--p',Math.round(h.progress*100)+'%');
   el.classList.toggle('ready',h.ready);el.classList.toggle('field',h.onField);el.classList.toggle('picked',heroPick===h.idx);el.classList.toggle('skill-ready',h.skillReady);
   lab.textContent=h.onField?(h.ammo?(h.ammo.cd>0?'裝填 '+fmt(h.ammo.cd):'彈藥 '+h.ammo.left+'/'+h.ammo.max):'在場'):h.wait>0?'重整 '+fmt(h.wait):h.ready?'即將登場':Math.min(h.count,h.need)+' / '+h.need;
   el.title=h.onField?(h.skillDesc?'登場效果：'+h.skillDesc:'')+(h.pas?'\n被動：'+h.pas:'')+(HERO_HS[h.id]?'\n計數「'+HERO_HS[h.id].name+'」每 '+HERO_HS[h.id].need+' 次（花 '+SixEngine.HERO_COUNTER_COST+' 點）：'+HERO_HS[h.id].desc:''):'條件：'+h.cond+' '+h.count+'/'+h.need+'；條件達成後自動從主堡出發，不花水晶'+(h.skillDesc?'\n登場效果：'+h.skillDesc:'')+(h.pas?'\n被動：'+h.pas:'')+(HERO_HS[h.id]?'\n計數「'+HERO_HS[h.id].name+'」每 '+HERO_HS[h.id].need+' 次：'+HERO_HS[h.id].desc:'');
  });
  if(heroPick>=0&&(!st[heroPick]||!st[heroPick].ready)){heroPick=-1;}
  document.body.classList.toggle('hero-pick',heroPick>=0);
  if(items.length&&bar.dataset.newItem!==String(items.length)){bar.dataset.newItem=String(items.length);}
 };
 setInterval(update,150);
 setInterval(()=>{if(typeof battle==='undefined'||!battle||!battle.notice)return;while(battle.notice.length){const n=battle.notice.shift();if(n.kind==='item'){itemBanner(n);beep(n.team===0?420:200,.14);}else if(n.kind==='skillcost'){if(n.team===0)energyPay(n);}else if(n.kind==='heroenter'){if(n.team===0){quip(n.art,'summon');beep(260,.12);toast(n.text);}}else if(n.kind==='herocount'){if(n.team===0&&n.art)quip(n.art,'skill');}else if(n.team===0){toast(n.text);beep(520,.14);}}},200);
 bar.addEventListener('click',e=>{
  const hb=e.target.closest('[data-hero]'),ib=e.target.closest('[data-item]');
  if(hb){
   const idx=+hb.dataset.hero,h=battle.heroStatus(0)[idx];
   if(h.onField){toast(h.name+' 已在戰場');return;}
   if(h.ready){toast('條件達成，英雄將自動從主堡出發');return;}
   toast(h.wait>0?'英雄重整中，約 '+Math.ceil(h.wait)+' 秒':h.cond+' '+h.count+' / '+h.need+(h.alt?'（或場上陣亡 '+h.alt+'）':'')+'，達成後可登場');return;
  }
  if(ib){const err=battle.useItem(0,+ib.dataset.item);if(err){toast(err);beep(90);}else{sig='';}}
 });
 /* 點戰場：若選了英雄，改為放置英雄 */
 const baseDown=cv.onpointerdown;
 cv.onpointerdown=e=>{
  if(heroPick>=0&&mode==='playing'&&!battle.auto[0]){
   const p=point(e),err=battle.playHero(0,heroPick,p.x,p.y);
   if(err){$('hint').textContent=err;toast(err);beep(90);return;}
   const hid=battle.heroSlots[0][heroPick].id;heroPick=-1;$('hint').textContent='英雄登場';beep(260,.12);quip(hid,'summon');updateUI();return;
  }
  baseDown&&baseDown(e);
 };
 const base=selectCard;selectCard=function(i){heroPick=-1;return base(i);};
})();
