/* 手機體驗：戰鬥中收起標頭、拖曳部署、PWA 註冊 */
(()=>{
 const body=document.body,hand=document.getElementById('hand');
 /* 戰鬥中標記 body，讓 CSS 收起標頭並放大戰場 */
 setInterval(()=>{const on=typeof mode!=='undefined'&&(mode==='playing'||mode==='paused')&&view==='battle';body.classList.toggle('in-battle',on);},200);

 /* 拖曳部署：按住手牌拖到戰場放開；單純點擊仍走原本的「選牌再點地」 */
 let drag=null,ghost=null,block=0;
 const toField=(e,touch)=>{const r=cv.getBoundingClientRect(),y=e.clientY-(touch?44:0);return{x:(e.clientX-r.left)/r.width*600,y:(y-r.top)/r.height*700,over:e.clientX>=r.left&&e.clientX<=r.right&&y>=r.top&&y<=r.bottom};};
 const end=()=>{if(ghost)ghost.remove();ghost=null;drag=null;mouse=null;};
 hand.addEventListener('pointerdown',e=>{
  const b=e.target.closest('.handcard');if(!b||mode!=='playing'||battle.auto[0]||swapMode)return;
  drag={slot:+b.dataset.slot,x:e.clientX,y:e.clientY,id:e.pointerId,on:false,touch:e.pointerType!=='mouse'};
 });
 hand.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.id)return;
  if(!drag.on){
   if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<8)return;
   drag.on=true;try{hand.setPointerCapture(e.pointerId);}catch(_){}
   if(selected!==drag.slot)selectCard(drag.slot);
   const src=hand.querySelector(`[data-slot="${drag.slot}"]`);
   ghost=document.createElement('div');ghost.className='drag-ghost';ghost.innerHTML=src?src.innerHTML:'';document.body.appendChild(ghost);
  }
  ghost.style.transform=`translate(${e.clientX}px,${e.clientY-(drag.touch?44:0)}px) translate(-50%,-50%)`;
  const p=toField(e,drag.touch);ghost.classList.toggle('on-field',p.over);mouse=p.over?p:null;
 });
 const drop=e=>{
  if(!drag||e.pointerId!==drag.id)return;
  const d=drag;if(!d.on){drag=null;return;}
  block=Date.now();
  const p=toField(e,d.touch);end();
  if(e.type==='pointercancel'||!p.over||selected!==d.slot){if(selected===d.slot)selectCard(d.slot);return;}
  const c=CARDS[battle.players[0].hand[d.slot]],err=battle.play(0,d.slot,p.x,p.y);
  if(err){$('hint').textContent=err;toast(err);beep(90);selectCard(d.slot);return;}
  selected=-1;renderHand();$('hint').textContent=c.name+' 已部署，準備下一步';beep(c.type==='tactic'?140:240,.1);updateUI();
 };
 hand.addEventListener('pointerup',drop);hand.addEventListener('pointercancel',drop);
 /* 拖曳結束後的 click 不再當作選牌 */
 document.addEventListener('click',e=>{if(Date.now()-block<350&&e.target.closest&&e.target.closest('#hand')){e.stopImmediatePropagation();e.preventDefault();}},true);

 /* 大廳滿版要知道標題列高度 */
 const setHH=()=>document.documentElement.style.setProperty('--hh',document.querySelector('header').offsetHeight+'px');
 setHH();addEventListener('resize',setHH);addEventListener('load',setHH);setTimeout(setHH,500);

 if('serviceWorker'in navigator&&location.protocol.startsWith('http')&&location.hostname!=='localhost'&&location.hostname!=='127.0.0.1')navigator.serviceWorker.register('sw.js').catch(()=>{});
})();

/* 功能鈕摺疊：戰場上只留一顆「⋯」，點開才出現暫停／結束 */
(()=>{const t=document.querySelector('.arena-tools');if(!t)return;
 const b=document.createElement('button');b.id='toolsToggle';b.type='button';b.textContent='⋯';b.title='功能';b.setAttribute('aria-expanded','false');
 t.prepend(b);
 const set=o=>{t.classList.toggle('open',o);b.setAttribute('aria-expanded',o);};
 b.addEventListener('click',e=>{e.stopPropagation();set(!t.classList.contains('open'));});
 t.addEventListener('click',e=>{if(e.target!==b&&e.target.closest('button'))set(false);});
})();

/* 結算／暫停時，結果面板上提供「回首頁」 */
(()=>{const ov=document.getElementById('overlay'),st=document.getElementById('start');if(!ov||!st)return;
 const b=document.createElement('button');b.id='homeBtn';b.type='button';b.textContent='回首頁';b.hidden=true;st.after(b);
 b.onclick=()=>{if(typeof newLobby==='function')newLobby();};
 const sync=()=>{const h=!(typeof mode!=='undefined'&&(mode==='ended'||mode==='paused'));if(b.hidden!==h)b.hidden=h;};
 setInterval(sync,300);
})();

/* 追趕提示：外塔被拆後資源回復變快，在能量數字旁標出來 */
(()=>{const r=document.querySelector('.control .resource');if(!r)return;const c=document.createElement('span');c.id='catchUp';c.hidden=true;r.querySelector('div').after(c);
 setInterval(()=>{const on=typeof battle!=='undefined'&&battle&&battle.players&&battle.catchUp&&(mode==='playing'||mode==='paused');const k=on?battle.catchUp(0):1;const t=k>1?'追趕 +'+Math.round((k-1)*100)+'%':'';if(c.textContent!==t)c.textContent=t;const h=!t;if(c.hidden!==h)c.hidden=h;},400);
})();

/* 背景預先下載全部素材：第一次在有網路的地方開著，之後沒訊號也不會黑格子 */
(()=>{if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http')||location.hostname==='localhost'||location.hostname==='127.0.0.1')return;
 const c=navigator.connection;if(c&&c.saveData)return;
 const run=async()=>{try{await navigator.serviceWorker.ready;const list=await (await fetch('assets-list.json',{cache:'no-cache'})).json();
  const ca=await caches.open('assets-v1');let i=0;const todo=[];for(const u of list)if(!(await ca.match(u)))todo.push(u);
  const worker=async()=>{while(i<todo.length){const u=todo[i++];try{await fetch(u);}catch{await new Promise(r=>setTimeout(r,2000));}}};
  await Promise.all([worker(),worker(),worker()]);}catch{}};
 setTimeout(()=>{('requestIdleCallback'in window?requestIdleCallback:fn=>setTimeout(fn,3000))(run);},6000);
})();
