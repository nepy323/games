/* 圖鑑：每個單位只呈現一張卡面，加上基本資料與說明。 */
const names={troop:'兵種',tactic:'戰術',building:'建築'},factions=SixData.factions,effects={resonate:'逆反共振',portal:'傳送門／共鳴',bomb:'延遲轟擊',barrage:'多段轟擊',fire:'持續傷害',curse:'腐朽／抑制治療',root:'定身',slow:'減速',haste:'攻速強化',shield:'吸收護盾',frenzy:'攻速／自損',sacrifice:'獻祭強化',armor:'區域減傷',mine:'地面陷阱',heal:'持續治療',speed:'移速強化',power:'傷害強化',rush:'疾行／易傷',summon:'召喚',bolt:'單體解場'};
let serial=0;
const scene=c=>{const a=SixScenes[c.id];if(!a){const art=SixArt[c.id];if(!art)return '';const[x,y,w,h]=art.portrait,id='c'+serial++;return `<svg preserveAspectRatio="xMidYMid slice" viewBox="0 0 ${w} ${h}"><defs><clipPath id="${id}"><rect width="${w}" height="${h}"/></clipPath></defs><g clip-path="url(#${id})"><image href="${art.src}" x="${-x}" y="${-y}" width="${art.width}" height="${art.height}"/></g></svg>`;}const id='s'+serial++;return `<svg class="scene-art" preserveAspectRatio="xMidYMid slice" viewBox="0 0 100 100"><defs><clipPath id="${id}"><rect width="100" height="100"/></clipPath></defs><g clip-path="url(#${id})"><image preserveAspectRatio="none" href="${a.src}" x="${-a.col*100}" y="${-a.row*100}" width="${(a.cols||3)*100}" height="${(a.rows||4)*100}"/></g></svg>`;};
const icon=scene;
let cleared0=false;try{cleared0=localStorage.getItem('six-banners-cleared')==='1';}catch{}
const entries=SixData.cards.filter(c=>(SixScenes[c.id]||SixArt[c.id])&&(!c.aiOnly||cleared0));
/* 律靈合體：兩隻特定律靈在 8 秒內相鄰部署會合體。蝕與闇不合體（它們是圖騰），不列入。 */
{const byId=Object.fromEntries(SixData.cards.map(c=>[c.id,c])),FU={fuse_earth:{cat:'前排',line:'大地與生機纏在一起的大型律靈。'},fuse_storm:{cat:'射手',line:'烈焰被風推成一道火嵐。'},fuse_aurora:{cat:'支援',line:'冰與光折射成的極光。'}};
 for(const f of SixEngine.FUSIONS){const s=SixEngine.summons[f.into],a=byId[f.a],b=byId[f.b],m=FU[f.into];if(!s||!a||!b||!m)continue;
  const W=SixEngine.FUSE_WEAK,BW=SixEngine.FUSE_BURST_WEAK,FH=SixEngine.FUSE_FULL_HP,FB=SixEngine.FUSE_FULL_BURST,fmtB=k=>`合體瞬間對周圍 ${f.burst.r} 範圍敵軍造成 ${Math.round(f.burst.dmg*k)} 傷害${f.burst.slow?'，並減速 '+f.burst.slow+' 秒':''}。`;
  const traits=[s.multi?'一次可攻擊 '+s.multi+' 個目標':'',s.armor?'減傷 '+Math.round(s.armor*100)+'%':'',s.regen?'每秒回復 '+s.regen+' 生命':'',s.heal?'為附近友軍回復生命':'',s.ward?'提供護盾':'',s.slowHit?'命中減速':'',s.splash?'命中點周圍濺射':'',s.airHit?'可對空':'',s.ttl?'存在 '+s.ttl+' 秒':''].filter(Boolean).join('、');
  const at=entries.map(c=>c.faction).lastIndexOf(6)+1;
  entries.splice(at,0,{id:f.into,name:s.kin+'合靈',faction:6,type:'troop',cost:a.cost+b.cost,hp:Math.round(s.hp*W),dmg:Math.round(s.dmg*W),n:1,category:m.cat,tier:'elite',race:'律靈',element:'律',
   rules:`${a.name}與${b.name}近距離先後部署時自動合體，免費。${m.line}本體只有${s.kin}悖靈的 ${Math.round(W/FH*100)}%，體型較小。${fmtB(BW)}${traits}。`},
   {id:f.into,name:s.name,faction:6,type:'troop',cost:SixData.cards.find(c=>c.id==='n_res').cost,hp:Math.round(s.hp*FH),dmg:s.dmg,n:1,category:m.cat,tier:'elite',race:'悖靈',element:'律',omen:true,
   rules:`打出「逆共振」獻祭場上任意兩組律靈，裏律降臨，隨機召出一隻悖靈（${s.kin}是其中一種）。體型更大，帶著不祥的氣息。${m.line}${fmtB(FB)}${traits}。`});}}
factions.forEach((f,i)=>filter.insertAdjacentHTML('beforeend',`<option value="${i}">${f[0]}</option>`));
function render(){grid.innerHTML=entries.filter(c=>filter.value==='all'||c.faction===+filter.value).map(c=>`<article><div class="gcard">${cardFace(c)}</div><div class="ginfo"><small>${factions[c.faction][0]} · ${c.race||'—'} · ${c.category||'—'} · ${c.element||'物理'}</small><p>${c.rules||c.desc||''}</p></div></article>`).join('');}
filter.onchange=render;render();

const rvFace=id=>{const a=SixArt[id];if(!a)return '';const[x,y,w,h]=a.portrait,k='rv'+(serial++);return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice"><defs><clipPath id="${k}"><rect width="${w}" height="${h}"/></clipPath></defs><g clip-path="url(#${k})"><image href="${a.src}" x="${-x}" y="${-y}" width="${a.width}" height="${a.height}"/></g></svg>`;};
const rvCard=r=>`<article class="rv" style="--ec:${r.color}"><span class="face">${rvFace(r.art)}</span><div><b>${r.name}</b><span class="tag">${r.label}</span><p>${r.trait}</p><p class="ct">對策：${r.counter}</p><p class="dk">常用牌組：${(r.decks||[]).map(i=>SixData.presets[i]?SixData.presets[i][0]:'').filter(Boolean).join('、')}</p></div></article>`;
document.getElementById('rivals').innerHTML=SixData.factions.map((f,fi)=>{const L=RIVALS.filter(r=>r.faction===fi&&(!r.hidden||cleared0));return L.length?`<h2 class="rv-fac" style="--fc:${f[2]}"><img src="assets/emblems/badge-${fi}.webp" alt="">${f[0]}<small>${L.length} 位</small></h2><div class="rv-grid">${L.map(rvCard).join('')}</div>`:'';}).join('');

document.getElementById('gtabs').onclick=e=>{const b=e.target.closest('button');if(!b)return;const t=b.dataset.t;
 document.querySelectorAll('#gtabs button').forEach(x=>x.classList.toggle('on',x===b));
 document.getElementById('grid').hidden=t!=='cards';for(const id of ['factions','rivals','relics','scenes','story'])document.getElementById(id).hidden=t!==id;filter.hidden=t!=='cards';if(t!=='cards')window.scrollTo(0,0);};

/* 遺物與寶物 */
const esc=t=>String(t).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const relicCard=(src,name,desc,rar)=>`<div class="gp-card"><img class="ic" src="${src}" alt=""><div><b>${esc(name)}</b>${rar?`<span class="rar ${rar}">${rar==='rare'?'稀有':'普通'}</span>`:''}<p>${esc(desc)}</p></div></div>`;
document.getElementById('relics').innerHTML=
 `<h2>征服旅程的遺物 <small>單人模式中帶著走，整輪有效</small></h2><div class="gp-grid">${RELICS.map(r=>relicCard(r.src,r.name,r.desc,r.rarity)).join('')}</div>`+
 `<h2>英雄強化 <small>單人模式中替英雄升級</small></h2><div class="gp-grid">${HERO_UPS.map(r=>relicCard(r.src,r.name,r.desc)).join('')}</div>`+
 `<h2>戰場寶物 <small>無盡鏖戰與征服旅程的戰鬥中隨機取得，單次使用</small></h2><div class="gp-grid">${SixEngine.ITEMS.map(i=>relicCard('assets/relics/relic-'+String(i.art).padStart(2,'0')+'.webp',i.name,i.desc)).join('')}</div>`;
/* 場景 */
document.getElementById('scenes').innerHTML=
 `<h2>戰場 <small>無盡鏖戰會隨機選用；章節戰場只出現在征服旅程</small></h2><div class="gp-grid">${SixPresentation.maps.map(m=>`<article class="sc-card"><img src="assets/battlefields/${m.id}.webp" alt="" loading="lazy"><div><b>${esc(m.name)}</b>${m.story?'<span class="rar rare">章節</span>':''}<p>${esc(m.subtitle)}</p></div></article>`).join('')}</div>`;
/* 故事 */
const cardName=id=>(SixData.cards.find(c=>c.id===id)||{}).name||id;
const lines=a=>`<div class="st-lines">${a.map(t=>`<p>${esc(t)}</p>`).join('')}</div>`;
const pool=(t,a)=>`<details class="pool"><summary>${esc(t)}（${a.length}）</summary>${a.map(x=>`<p>${esc(x)}</p>`).join('')}</details>`;
(()=>{const S=STORY;let h='';
 h+=`<h2>序章 <small>${esc(S.prologue.title)}</small></h2>${lines(S.prologue.lines)}${lines(S.prologue.after||[])}`;
 h+=`<h2>${esc(S.spirits.title)}</h2>${lines(S.spirits.lines)}`;
 h+=`<h2>六境 <small>每境：一場戰鬥或精英、一場守護戰，取得一枚律種</small></h2>`;
 h+=S.chapters.map((c,i)=>`<article class="st-ch"><img class="sc" src="${c.scene}" alt="" loading="lazy"><div><h3>${i+1}．${esc(c.name)} <small style="color:#9ca397;font-weight:400">${esc(c.place)}</small></h3>${c.lines.map(t=>`<p>${esc(t)}</p>`).join('')}<p class="goal">目標：${esc(c.goal)}</p><div class="st-g" style="--ec:${c.guardian.color}"><span class="face">${rvFace(c.guardian.art)}</span><div><b>${esc(c.guardian.name)}</b>（${esc(c.guardian.label)}）<br>${esc(c.guardian.note)}</div></div><p style="font-size:13px;color:#9ca397">${esc(c.seed.name)}・${esc(c.seed.item)}：${esc(c.seed.line)}</p></div></article>`).join('');
 h+=`<h2>終章 <small>${esc(S.finale.title)}</small></h2>${lines(S.finale.lines)}<div class="st-g" style="--ec:${S.finale.boss.color}"><span class="face">${rvFace(S.finale.boss.art)}</span><div><b>${esc(S.finale.boss.name)}</b><br>${esc(S.finale.boss.note)}</div></div>${lines(S.confront.lines)}`;
 h+=`<h2>尾聲 <small>${esc(S.ending.title)}</small></h2>${lines(S.ending.lines)}`;
 h+=`<h2>隨機文本 <small>每局不一樣，同一局內不重複</small></h2>`;
 h+=pool('大廳標語',S.lobby)+pool('戰勝之後',S.win)+pool('敗北之後',S.lose);
 h+=pool('序章戰前旁白',S.pre.p)+S.chapters.map((c,i)=>pool(c.name+' 戰前旁白',S.pre[i])).join('')+pool('終章戰前旁白',S.pre.f);
 h+=Object.entries(S.camps).map(([n,c])=>pool('營地同伴・'+n+'（'+c.role+'）',c.lines)).join('');
 h+=Object.entries(S.heroLines).map(([id,o])=>pool('英雄台詞・'+cardName(id),[...o.summon.map(x=>'登場：'+x),...o.skill.map(x=>'技能：'+x)])).join('');
 h+=Object.entries(S.epilogue).map(([id,a])=>pool('後日談・'+cardName(id),a)).join('');
 let cleared=false;try{cleared=localStorage.getItem('six-banners-cleared')==='1';}catch{}
 const tab=document.getElementById('storyTab');
 if(cleared)document.getElementById('story').innerHTML=h;
 else{tab.classList.add('locked');document.getElementById('story').innerHTML='<div class="lockbox"><b>尚未解鎖</b>通關「征服旅程」後，這裡會整理完整的故事與全部隨機文本。<br>先自己走一遍，會比較有意思。</div>';}})();

/* 勢力介紹：用徽章 */
(()=>{const F=SixData.factions,B=SixEngine.BANNERS,C=SixData.cards;
 document.getElementById('factions').innerHTML=`<h2>七個勢力 <small>同一勢力的牌湊到 2、4、6 張，啟動旗印加成</small></h2>`+F.map((f,i)=>{
  const mine=C.filter(c=>c.faction===i&&(!c.aiOnly||cleared0)),hero=mine.filter(c=>c.tier==='hero').map(c=>c.name.split('・')[0]),elite=mine.filter(c=>c.tier==='elite').map(c=>c.name);
  const b=B[i];
  return `<article class="fac" style="--fc:${f[2]}"><img class="bd" src="assets/emblems/badge-${i}.webp" alt="" loading="lazy"><div><h3>${esc(f[0])}<small>${esc(f[1])}</small></h3>
  <p class="nm">${mine.length} 張牌${hero.length?'　英雄：'+esc(hero.join('、')):''}${elite.length?'　精英：'+esc(elite.join('、')):''}</p>
  <div class="mk">${b.text.map((t,k)=>`<span><b>${[2,4,6][k]} 張・${esc(b.name)}</b>${esc(t)}</span>`).join('')}</div>
  ${i===6?'<p>界律之環洩出的八隻律靈，征服旅程的起始牌組。兩隻特定的律靈相鄰部署會合體成更大的律靈。</p>':''}</div></article>`;}).join('');})();
