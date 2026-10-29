/* 換牌：花 1 點資源，把一張手牌放回牌序末端並抽下一張（3 秒冷卻）。按「換牌」後點要換掉的牌。 */
let swapMode=false;
(()=>{
 const btn=document.createElement('button');btn.id='swapBtn';btn.type='button';btn.innerHTML='換牌 <b>◆1</b>';btn.title='花 1 點資源換掉一張手牌（3 秒冷卻）';
 document.querySelector('.resource').appendChild(btn);
 const sync=()=>{
  const on=typeof battle!=='undefined'&&battle&&battle.players&&mode==='playing'&&!battle.auto[0];
  const p=on&&battle.players[0],cool=on?Math.max(0,(p.swapAt||0)-battle.clock):0;
  btn.disabled=!on||cool>0||p.energy<SixEngine.SWAP_COST;
  btn.classList.toggle('active',swapMode&&!btn.disabled);
  btn.innerHTML=cool>0?`冷卻 ${Math.ceil(cool)}s`:'換牌 <b>◆1</b>';
  if(swapMode&&btn.disabled)swapMode=false;
  document.body.classList.toggle('swap-mode',swapMode);
 };
 btn.onclick=()=>{swapMode=!swapMode;if(swapMode){selected=-1;renderHand();$('hint').textContent='點選要換掉的手牌';}else $('hint').textContent='選擇卡牌，再點擊戰場';sync();};
 const base=selectCard;
 selectCard=function(i){
  if(!swapMode)return base(i);
  const old=CARDS[battle.players[0].hand[i]],err=battle.swap(0,i);
  swapMode=false;
  if(err){toast(err);beep(90);sync();return;}
  const now=CARDS[battle.players[0].hand[i]];
  toast('換牌：'+old.name+' → '+now.name);beep(300,.08);lastHand='';selected=-1;renderHand();updateUI();sync();
 };
 setInterval(sync,150);
 window.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='s'&&!['INPUT','SELECT'].includes(e.target.tagName)&&!btn.disabled)btn.click();});
})();
