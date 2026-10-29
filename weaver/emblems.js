/* 軍旗：戰場計分列顯示雙方主旗（牌組中張數最多的勢力）。征服旅程的戰旗與徽章在 tower.js。 */
(()=>{
 const dominant=deck=>{const n=SixEngine.bannerCount(deck);let best=-1,f=-1;n.forEach((c,i)=>{if(c>best){best=c;f=i;}});return best>0?f:-1;};
 const spans=[document.querySelector('.army.enemy span'),document.querySelector('.army.ally span')];
 const imgs=spans.map(sp=>{const im=document.createElement('img');im.className='army-flag';im.alt='';im.hidden=true;sp.prepend(im);return im;});
 const last=[null,null];
 setInterval(()=>{
  if(typeof battle==='undefined'||!battle||!battle.players)return;
  [1,0].forEach((team,i)=>{const f=dominant(battle.players[team].deck),key=team+':'+f;if(last[i]===key)return;last[i]=key;
   if(f<0){imgs[i].hidden=true;return;}imgs[i].src=f>=6?'assets/emblems/badge-6.webp':`assets/emblems/badge-${f}.webp`;imgs[i].hidden=false;});
 },300);
})();
