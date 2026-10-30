'use strict';
const sceneImages={};
for(const m of SixPresentation.maps){const im=new Image();im.src='assets/battlefields/'+m.id+'.webp';sceneImages[m.id]=im;}
const fortressImage=new Image();fortressImage.src='assets/battlefields/fortresses.webp';
let currentMap=SixPresentation.maps[0],lastMap='',reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
try{lastMap=localStorage.getItem('six-banners-last-map')||'';const r=localStorage.getItem('six-banners-motion');if(r!==null)reducedMotion=r==='reduced';}catch{}
function resetVisuals(){/* Animation time belongs to the battle and pauses with it. */}
function selectBattlefield(){currentMap=SixPresentation.chooseMap(lastMap,document.getElementById('mapChoice').value);lastMap=currentMap.id;try{localStorage.setItem('six-banners-last-map',lastMap);}catch{}updateMapLabel();}
function updateMapLabel(){document.getElementById('mapName').textContent=currentMap.name;document.getElementById('mapDescription').textContent=currentMap.subtitle;}
function initVisualUI(){document.addEventListener('click',e=>{const b=e.target.closest('[data-inspect]');if(b)openCardArt(b.dataset.inspect);});const choice=document.getElementById('mapChoice');choice.onchange=()=>{if(choice.value==='random'){document.getElementById('mapName').textContent='開戰時隨機抽選';document.getElementById('mapDescription').textContent='四種戰場，相同路線與規則';}else{currentMap=SixPresentation.maps.find(m=>m.id===choice.value);updateMapLabel();}};const motion=document.getElementById('motion');function label(){motion.textContent='動態 '+(reducedMotion?'精簡':'完整');motion.setAttribute('aria-pressed',String(reducedMotion));}motion.onclick=()=>{reducedMotion=!reducedMotion;label();try{localStorage.setItem('six-banners-motion',reducedMotion?'reduced':'full');}catch{}};label();document.getElementById('closeCardArt').onclick=()=>document.getElementById('cardArtDialog').close();}
function openCardArt(id){const c=SixEngine.CARDS[id];if(!c)return;if(mode==='playing')pause();document.getElementById('fullCard').innerHTML=`<article class="full-card" data-faction="${c.faction}" style="--f:${SixData.factions[c.faction][2]}"><div class="full-card-title"><span class="large-cost">${c.cost}</span><h2>${c.name}</h2>${SixPresentation.crest(c.faction)}</div>${sceneArt(c)}<div class="full-card-text"><div class="card-faction">${SixPresentation.crest(c.faction)}${SixData.factions[c.faction][0]} · ${names[c.type]}</div>${SixPresentation.chips(c)}<p>${c.rules||c.desc}</p><div class="tags">${c.tags.map(x=>'<span>'+x+'</span>').join('')}</div><div class="card-bottom">${c.type==='tactic'?effects[c.effect]:'ATK '+c.dmg+' / HP '+c.hp+' / '+c.n+' 單位'}</div><blockquote>${SixData.factionDetails[c.faction].creed}</blockquote><small>${SixData.factionDetails[c.faction].material}</small></div></article>`;document.getElementById('cardArtDialog').showModal();}
function drawBattlefield(){
 const im=sceneImages[currentMap.id];if(im.complete&&im.naturalWidth){
  // Register each generated map's channel to the engine's exact bridge axis.
  const sy=im.naturalHeight*currentMap.center;
  ctx.drawImage(im,0,0,im.naturalWidth,sy,0,0,600,350);
  ctx.drawImage(im,0,sy,im.naturalWidth,im.naturalHeight-sy,0,350,600,350);
  ctx.fillStyle='#07101524';ctx.fillRect(0,0,600,700);
 }else{ctx.fillStyle='#303c31';ctx.fillRect(0,0,600,700);ctx.fillStyle='#122c30';ctx.fillRect(0,329,600,42);for(const x of [155,445]){ctx.fillStyle='#8d8c73';ctx.fillRect(x-42,320,84,60);}}
 // Subtle exact bridge edges retain readable legal crossing widths.
 ctx.strokeStyle=currentMap.tint+'55';ctx.lineWidth=1;for(const x of [155,445]){line(x-33,329,x-33,371,currentMap.tint+'44');line(x+33,329,x+33,371,currentMap.tint+'44');}
 /* 橋頭堵塞提示：有 3 個以上單位被擋在橋上時，橋面泛起一圈暖色脈動 */
 if(battle&&battle.units&&!reducedMotion)for(const x of [155,445]){const n=battle.units.filter(u=>u.hp>0&&u.blocked>.4&&Math.abs(u.x-x)<56).length;if(n>=3){ctx.save();ctx.globalAlpha=.25+.2*Math.sin(battle.clock*6);ctx.strokeStyle='#ffb25a';ctx.lineWidth=3;ctx.strokeRect(x-38,322,76,56);ctx.restore();}}
 const grad=ctx.createRadialGradient(300,350,170,300,350,440);grad.addColorStop(0,'#0000');grad.addColorStop(1,'#02080b85');ctx.fillStyle=grad;ctx.fillRect(0,0,600,700);
 ctx.textAlign='center';ctx.font=Math.round(9*viewScale())+'px system-ui';ctx.fillStyle='#ffdbbd99';ctx.fillText('敵軍領地',300,132);ctx.fillStyle='#dfedc899';ctx.fillText('我方領地',300,580);
}
function drawWeather(){if(reducedMotion)return;const t=battle.clock;ctx.save();for(let i=0;i<34;i++){const x=(i*137+Math.sin(t*.2+i)*18+t*(currentMap.weather==='leaf'?6:2))%600,y=(i*83+t*(currentMap.weather==='ember'?-15:11)+1400)%700;ctx.globalAlpha=.12+(i%4)*.06;ctx.fillStyle=currentMap.tint;ctx.beginPath();if(currentMap.weather==='leaf'){ctx.ellipse(x,y,2.7,1.1,t+i,0,Math.PI*2);ctx.fill();}else if(currentMap.weather==='snow'){ctx.arc(x,y,.7+i%2,0,Math.PI*2);ctx.fill();}else{ctx.fillRect(x,y,1.5,2.5);}}ctx.restore();}
/* 窄螢幕（手機）把場上單位與字放大，畫布縮小後仍看得清楚 */
const viewScale=()=>cv.clientWidth&&cv.clientWidth<520?1.4:1;
function drawFortress(t){
 if(!fortressImage.complete||!fortressImage.naturalWidth||typeof SixFortresses==='undefined')return drawTowerFallback(t);
 if(t.hp<=0){ctx.save();ctx.globalAlpha=.45;for(let i=0;i<9;i++){ctx.fillStyle=i%2?'#887e69':'#4b4f49';ctx.fillRect(t.x-28+i*6,t.y-7+Math.sin(i*7)*8,8,7);}ctx.restore();return;}
 const key=(t.core?'castle':'tower')+(t.team?'Front':'Back'),r=SixFortresses[key],h=(t.core?102:80)*(viewScale()>1?1.2:1),w=h*r[2]/r[3];
 ctx.save();ctx.fillStyle='#0007';ctx.beginPath();ctx.ellipse(t.x,t.y+15,t.core?45:31,12,0,0,7);ctx.fill();if(!reducedMotion&&battle.clock-t.hitAt<.09)ctx.filter='brightness(1.6)';ctx.drawImage(fortressImage,...r,t.x-w/2,t.y+27-h,w,h);ctx.restore();
 bar(t.x,t.y+28,t.hp/t.max,t.core?66:49,teamColor(t.team));ctx.textAlign='center';ctx.font=Math.round(9*viewScale())+'px system-ui';ctx.fillStyle='#f0e7ce';ctx.fillText(Math.max(0,Math.ceil(t.hp)),t.x,t.y+44+(viewScale()>1?6:0));
}
function drawAnimatedUnit(u){
 if(u.portal){ctx.save();ctx.translate(u.x,u.y);ctx.fillStyle='#142c36';ctx.strokeStyle=teamColor(u.team);ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(0,-22,23,37,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle='#aeeade';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,-22,15,29,0,0,Math.PI*2);ctx.stroke();ctx.textAlign='center';ctx.fillStyle='#d8fff0';ctx.font='10px system-ui';ctx.fillText('界隙 '+u.portalWave+'/3',0,-67);ctx.fillText('下一波 '+Math.max(0,Math.ceil(u.portalAt-battle.clock))+'s',0,32);ctx.restore();bar(u.x,u.y+17,u.hp/u.max,45,teamColor(u.team));return;}
 if(u.guardShare&&u.guardTarget){const target=battle.units.find(v=>v.id===u.guardTarget&&v.hp>0);if(target&&Math.hypot(target.x-u.x,target.y-u.y)<85)line(u.x,u.y-12,target.x,target.y-12,'#d7758799',2);}
 if(u.buffCast&&battle.clock<(u.castUntil||0)){const bc=u.buffCast,left=u.castUntil-battle.clock,fade=Math.min(1,left/2),foe=!!(bc.foe&&bc.foe.length&&!(bc.ally&&bc.ally.length)),col=foe?'#c8689e':'#e8d27a';ctx.save();
  const RR={holy:4,fire:7,ice:2,poison:3,arcane:1},row=RR[bc.ring||'holy']??4,pw=Math.min(112,bc.radius*.9);let looped=false;
  for(let i=0;i<9;i++){const t=i/9*Math.PI*2+battle.clock*.35;if(drawFx('circle',u.x+Math.cos(t)*bc.radius*.94,u.y+4+Math.sin(t)*bc.radius*.94*.58,pw,pw*.5,((battle.clock*.7)+(i%3)*.11)%1,row,0,.75*fade))looped=true;}
  if(!looped){const pulse=.5+.5*Math.sin(battle.clock*4+u.id);ctx.globalAlpha=fade*(.32+.14*pulse);ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(u.x,u.y+4,bc.radius,bc.radius*.58,0,0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha=fade*(looped?.45:.85);ctx.strokeStyle=col;ctx.lineWidth=looped?1.2:2;ctx.setLineDash([7,6]);ctx.lineDashOffset=-battle.clock*10;ctx.beginPath();ctx.ellipse(u.x,u.y+4,bc.radius,bc.radius*.58,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
 if(u.bloodShield>0&&u.bloodUntil>battle.clock){ctx.lineWidth=2;circle(u.x,u.y-15,u.r+12,'#ed739cbb');}

 const a=SixArt[u.artId],im=a&&atlasImages[a.src];if(!im||!im.complete||!im.naturalWidth)return drawUnitFallback(u);
 const r=a[u.team===0?'back':'front'],tc=teamColor(u.team),large=u.max>=1700;
 const tierScale=(u.size===undefined&&!u.derived&&u.type!=='building')?(u.tier==='hero'?(large?1.14:1.4):u.tier==='elite'?(large?1.1:1.3):1):1;
 const h=(u.type==='building'?72:large?66:['騎','狼','輪','獠','翼'].includes(u.role)?57:46)*viewScale()*(u.size||1)*tierScale,w=h*r[2]/r[3];
 if(u.ring){ctx.save();const t=battle.clock,pulse=.5+.5*Math.sin(t*2.2+u.id);ctx.globalAlpha=.35+.25*pulse;ctx.fillStyle='#2a1038';ctx.strokeStyle='#a46ae0';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(u.x,u.y+2,h*(.62+.06*pulse),h*.2,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.globalAlpha=.5;ctx.strokeStyle='#e0507a';ctx.setLineDash([5,7]);ctx.lineDashOffset=-t*18;ctx.beginPath();ctx.ellipse(u.x,u.y+2,h*.8,h*.26,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  if(!reducedMotion)for(let i=0;i<6;i++){const k=(t*.45+i/6)%1;ctx.globalAlpha=(1-k)*.7;ctx.fillStyle=i%2?'#8e6fd0':'#c0406a';ctx.beginPath();ctx.arc(u.x+Math.sin(i*2.4+t*1.3)*h*.38,u.y-k*h*1.15,2.2+2*(1-k),0,Math.PI*2);ctx.fill();}ctx.restore();}
 if(u.zone){ctx.save();const zr=u.zone.r*(.97+.03*Math.sin(battle.clock*3)),left=u.totem&&u.duration?Math.max(0,u.life/u.duration):1;ctx.globalAlpha=.14+.06*left;ctx.fillStyle=u.zone.color;ctx.beginPath();ctx.ellipse(u.x,u.y+4,zr,zr*.62,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.75;ctx.strokeStyle=u.zone.color;ctx.lineWidth=2;ctx.setLineDash([]);ctx.beginPath();ctx.ellipse(u.x,u.y+4,zr,zr*.62,0,-Math.PI/2,-Math.PI/2+Math.PI*2*left);ctx.stroke();ctx.restore();}
 if(u.buffs&&u.team!==0&&!u.tower){const ring=[['curse','#6fae5a'],['rush','#a070e6'],['weak','#c58cf0'],['slow','#7fd0ff']].filter(([k])=>battle.has(u,k));ring.forEach(([k,col],i)=>{ctx.save();ctx.globalAlpha=.8;ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(u.x,u.y+6,u.r+4+i*3,5+i*1.5,0,0,Math.PI*2);ctx.stroke();ctx.restore();});}
 if(u.buffs&&!u.tower&&u.type!=='building'&&(battle.has(u,'deathward')||u.deathAt)){const k=(battle.clock*.9)%1,pu=.5+.5*Math.sin(battle.clock*7);ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=(u.deathAt?.9:.55)+.2*pu;ctx.strokeStyle=u.deathAt?'#ff7ad9':'#b58cff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(u.x,u.y+4,u.r+6,7,0,0,Math.PI*2);ctx.stroke();ctx.restore();drawFx('halo',u.x,u.y+2,(u.r+14)*2.6,(u.r+14)*1.3,k,1,0,.8);if(!reducedMotion)for(let i=0;i<3;i++){const q=(battle.clock*.7+i/3)%1;drawFx('spark_s',u.x+Math.sin(i*2.1+battle.clock)*(u.r+2),u.y-q*34,18,18,q,1,0,.8);}}
 const phase=u.walk*.20,flight=u.flying?10+(reducedMotion?0:Math.sin(battle.clock*4+u.id)*2.5):0;
 const bob=!reducedMotion&&u.moving&&!u.flying?Math.abs(Math.sin(phase))*(large?1.8:2.5):0;
 const swing=!reducedMotion&&u.moving?Math.sin(phase)*(large?.014:.032):0;
 const attackAge=battle.clock-u.attackAt,hitAge=battle.clock-u.hitAt;
 const attack=!reducedMotion&&attackAge<.36?(attackAge<.1?-2:Math.sin((attackAge-.1)/.26*Math.PI)*(u.attackKind==='melee'?6:-3)):0;
 const recoil=!reducedMotion&&hitAge<.22?Math.sin(hitAge/.22*Math.PI)*3:0;
 const px=u.x+(u.attackDX||0)*attack+(u.hitDX||0)*recoil,py=u.y+(u.attackDY||0)*attack+(u.hitDY||0)*recoil;
 ctx.save();ctx.fillStyle='#07100888';ctx.strokeStyle=tc;ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(u.x,u.y+5,u.r+3,5,0,0,Math.PI*2);ctx.fill();ctx.stroke();
 if(u.role==='魂'&&!reducedMotion){ctx.globalAlpha=.15;ctx.drawImage(im,...r,px-w/2-(u.moveDX||0)*7,py+10-h-flight-(u.moveDY||0)*7,w,h);ctx.globalAlpha=1;}
 ctx.translate(px,py+10-flight-bob);ctx.rotate(swing);if(!reducedMotion&&hitAge<.085)ctx.filter='brightness(1.8) saturate(.65)';ctx.shadowColor=u.team===0?'rgba(255,255,255,.45)':'rgba(255,70,55,.8)';ctx.shadowBlur=1.2*viewScale();ctx.drawImage(im,...r,-w/2,-h,w,h);ctx.restore();
 if(u.tier==='hero'||u.tier==='elite'){ctx.save();const hero=u.tier==='hero',col=hero?'#ffd36a':'#9fc2ea',pulse=reducedMotion?.6:.55+.45*Math.sin(battle.clock*4);
  ctx.globalAlpha=.35+.4*pulse;ctx.strokeStyle=col;ctx.lineWidth=2;ctx.shadowColor=col;ctx.shadowBlur=hero?14:8;ctx.beginPath();ctx.ellipse(u.x,u.y+5,u.r+8,7,0,0,Math.PI*2);ctx.stroke();
  ctx.globalAlpha=1;ctx.shadowBlur=0;
  const hsd=SixEngine.HEROES[u.artId],sk=SixEngine.SKILLS[u.ability]||(hsd&&hsd.hs),cnt=SixEngine.SKILLS[u.ability]?u.skillHits:u.hcount;if(sk){const pr=Math.min(1,(cnt||0)/sk.need);const rc=u.dark?'#b58cff':'#ffe29a';ctx.strokeStyle=rc;ctx.lineWidth=3;ctx.shadowColor=rc;ctx.shadowBlur=pr>=1-1/sk.need?10:3;ctx.beginPath();ctx.ellipse(u.x,u.y+5,u.r+8,7,0,-Math.PI/2,-Math.PI/2+Math.PI*2*pr);ctx.stroke();ctx.shadowBlur=0;}
  const nm=String(u.name||'').split('・')[0],label=hero?'★ '+(nm||'英雄'):(nm||'菁英'),by=u.y-h-flight-6;ctx.font='bold '+Math.round(10*viewScale())+'px system-ui';const bw=ctx.measureText(label).width+10;
  ctx.fillStyle=hero?'#3a2606ee':'#0f2236ee';ctx.strokeStyle=col;ctx.lineWidth=1.2;ctx.beginPath();ctx.roundRect(u.x-bw/2,by-11*viewScale(),bw,14*viewScale(),7);ctx.fill();ctx.stroke();
  ctx.textAlign='center';ctx.fillStyle=col;ctx.fillText(label,u.x,by);ctx.restore();}
 if(!u.totem)bar(u.x,u.y+14,u.hp/u.max,(u.type==='building'?40:28)*Math.min(viewScale(),1.25),tc);
 if(u.shield>0&&u.shieldUntil>battle.clock){ctx.lineWidth=1.2;circle(u.x,u.y-15,u.r+10,'#f2d996aa');}
 if(battle.has(u,'root')){for(let j=0;j<3;j++)line(u.x-13+j*10,u.y+9,u.x+9-j*4,u.y-9,'#a5c48b',1.5);}
 else if(battle.has(u,'slow'))circle(u.x,u.y,u.r+4,'#aab7d080');
 if(battle.has(u,'frenzy')||battle.has(u,'sacrifice'))circle(u.x,u.y,u.r+4,'#df786c88');
}
function drawProjectiles(){for(const p of battle.projectiles){
 const t=Math.min(1,p.age/p.duration),dx=p.tx-p.x,dy=p.ty-p.y,ang=Math.atan2(dy,dx),col=SixPresentation.colors[p.element]||'#d7e0b5';
 let x=p.x+dx*t,y=p.y+dy*t-18;
 ctx.save();ctx.lineCap='round';
 if(p.kind==='melee'){ctx.globalAlpha=.65;ctx.strokeStyle='#f3e6c7';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y-12,22,ang-1.1+t*.8,ang-.3+t*1.8);ctx.stroke();}
 else if(p.kind==='flame'){const n=Math.hypot(dx,dy)||1;for(let i=0;i<9;i++){const q=i/9,spread=Math.sin(i*17+p.age*40)*q*14;circle(p.x+dx*q-dy/n*spread,p.y-18+dy*q+dx/n*spread,3+q*8,i%2?'#ffaf4caa':'#ed593eaa',true);}}
 else if(p.kind==='bullet'){line(p.x,p.y-18,p.tx,p.ty-18,'#ffe9af',2);circle(p.x,p.y-18,5,'#ffcc7d',true);}
 else if(p.kind==='shell'||p.kind==='stone'){y-=Math.sin(Math.PI*t)*65;circle(p.x+dx*t,p.y+dy*t,3,'#0006',true);ctx.shadowColor='#ffb264';ctx.shadowBlur=p.kind==='shell'?9:0;circle(x,y,p.kind==='shell'?4:6,p.kind==='shell'?'#e8bd78':'#aaa18c',true);line(x-dx*.025,y-dy*.025+4,x,y,'#ddd1ae66',2);circle(p.tx,p.ty,8,'#e2ba6b55');}
 else if(p.kind==='arrow'){ctx.translate(x,y);ctx.rotate(ang);line(-12,0,4,0,'#d9caa5',1.4);ctx.fillStyle='#e1dfcd';ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(1,-2.4);ctx.lineTo(1,2.4);ctx.fill();line(-10,-3,-7,0,'#bfa16c');}
 else {ctx.shadowColor=col;ctx.shadowBlur=10;line(x-dx*.1,y-dy*.1,x,y,col+'88',3);circle(x,y,4,col,true);circle(x,y,1.5,'#fff8df',true);}
 ctx.restore();
}}
/* 像素特效（assets/fx，64 像素格、9 列色彩）：打擊火花、斬擊、逆反共振魔法陣。疊加發光＋平滑縮放；圖沒載入或開了減少動態就退回原本的線條。 */
/* 屬性→色列：帝國（戰令／火藥）金橘、血誓紅、永寂（靈魂／腐朽）紫綠、玄鐵（符文）青藍、蒼林（自然）綠、裂牙（疾風）土黃，物理白，律／混沌紫 */
const FXROW={聖:4,血:7,暗:1,毒:3,火:0,火焰:0,火藥:0,血誓:7,冰霜:2,神聖:4,戰令:4,物理:5,疾風:4,自然:3,腐朽:3,靈魂:1,律:1,混沌:1,符文:2};
const fxSheets={};
function fxSheet(name){let i=fxSheets[name];if(!i){i=fxSheets[name]=new Image();i.src='assets/fx/'+name+'.png';}return i.complete&&i.naturalWidth?i:null;}
function drawFx(name,x,y,w,h,age,row,rot=0,alpha=1,fs=64){const img=fxSheet(name);if(!img||reducedMotion)return false;const n=Math.round(img.naturalWidth/fs),fr=Math.min(n-1,Math.floor(age*n));
 ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=alpha;ctx.imageSmoothingEnabled=true;ctx.translate(x,y);if(rot)ctx.rotate(rot);ctx.drawImage(img,fr*fs,row*fs,fs,fs,-w/2,-h/2,w,h);ctx.restore();return true;}
/* 大範圍特效不把小圖硬放大（會糊成一團）：爆炸改成範圍內散布數個小爆裂，魔法陣改成沿圓周排列小片段；單張最大約 150 像素（約 2.3 倍） */
const fxRnd=(f,k)=>{const t=Math.sin((f.seed||1)*12.9898+k*78.233)*43758.5453;return t-Math.floor(t);};
const fxAge=a=>Math.max(0,Math.min(.999,a));
function drawFxScatter(f,name,R,age,row,alpha=1){const size=Math.min(150,R*1.25),n=Math.max(1,Math.min(9,Math.round(R/60*R/60*.9)));
 for(let i=0;i<n;i++){const ang=fxRnd(f,i*2+1)*6.283,rad=i?Math.sqrt(fxRnd(f,i*2+2))*R*.62:0;drawFx(name,f.x+Math.cos(ang)*rad,f.y-6+Math.sin(ang)*rad*.6,size,size*.78,fxAge(age-i*.04),row,0,alpha);}}
function drawFxRing(f,name,R,age,row,alpha=1){const n=Math.max(6,Math.min(18,Math.round(6.283*R/80))),w=Math.min(130,R*.7);
 for(let i=0;i<n;i++){const t=i/n*6.283;drawFx(name,f.x+Math.cos(t)*R*.92,f.y+Math.sin(t)*R*.92*.42,w,w*.5,fxAge(age-(i%3)*.05),row,0,alpha);}}
function drawBattleEffects(){for(const f of battle.fx){const a=Math.max(0,f.life/f.max),age=1-a;ctx.save();ctx.globalAlpha=a;
 if(f.type==='dust'||f.type==='steam'){if(reducedMotion){ctx.restore();continue;}for(let i=0;i<4;i++){const angle=f.seed+i*2.4;ctx.fillStyle=f.type==='steam'?'#c4d1cb66':currentMap.weather==='snow'?'#dbe5e5aa':'#b7a58a77';const x=f.x+Math.cos(angle)*age*f.r+(f.dx||0)*age*9,y=f.y+Math.sin(angle)*age*f.r*.45+(f.dy||0)*age*8-age*4;ctx.beginPath();ctx.ellipse(x,y,2+age*3,1+age*2,angle,0,7);ctx.fill();}}
 else if(f.type==='impact'&&drawFx(f.r>=24?'spark_l':'spark_s',f.x,f.y-18,f.r>=24?46:32,f.r>=24?46:32,age,FXROW[f.element]??5)){}
 else if(f.type==='impact'||f.type==='muzzle'){const col=SixPresentation.colors[f.element]||'#ffe3ad';ctx.strokeStyle=col;ctx.lineWidth=1.5;for(let i=0;i<(reducedMotion?3:7);i++){const q=i*2.4+f.x;line(f.x+Math.cos(q)*age*f.r*.4,f.y-18+Math.sin(q)*age*f.r*.4,f.x+Math.cos(q)*(3+age*f.r),f.y-18+Math.sin(q)*(3+age*f.r),col,1.4);}if(f.type==='muzzle')circle(f.x,f.y-18,5*a,'#ffe1a5',true);}
 else if(f.type==='slash'&&drawFx('slash',f.x,f.y-15,40,40,age,5,f.angle+Math.PI/2)){}
 else if(f.type==='slash'){ctx.lineWidth=2;ctx.strokeStyle='#eee3c4';ctx.beginPath();ctx.arc(f.x,f.y-15,10+age*12,f.angle-.9,f.angle+.7);ctx.stroke();}
 else if(f.type==='omen'){drawFxRing(f,'circle',f.r,age,1,.85);drawFx('circle',f.x,f.y,Math.min(150,f.r*1.3),Math.min(150,f.r*1.3)*.45,age,1,0,.9);ctx.save();for(let k=0;k<3;k++){const q=Math.max(0,age-k*.14);if(q<=0)continue;ctx.globalAlpha=Math.max(0,(1-q))*.8;ctx.lineWidth=3-k*.7;ctx.strokeStyle=k===1?'#e0507a':'#a46ae0';ctx.beginPath();ctx.ellipse(f.x,f.y,f.r*q+4,(f.r*q+4)*.42,0,0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=Math.max(0,1-age)*.5;ctx.fillStyle='#1a0626';ctx.beginPath();ctx.ellipse(f.x,f.y,f.r*.55,f.r*.22,0,0,Math.PI*2);ctx.fill();ctx.restore();}
 else if(f.type==='towerfall'){const offs=[[0,-8,0],[-28,8,.1],[26,4,.2],[-10,-30,.32],[12,14,.42]];offs.forEach(([dx,dy,dl])=>{const a2=(age-dl)/(1-dl);if(a2>0&&a2<1)drawFx('explosion',f.x+dx,f.y+dy,150,150,a2,0,0,.95,128);});}
 else if(f.type==='fusion'){drawFx('spiral',f.x,f.y-8,112,112,age,1,0,.95);for(let i=0;i<6;i++){const ang=i*1.047+(f.seed||0),rr=(1-age)*72;drawFx('spark_s',f.x+Math.cos(ang)*rr,f.y-8+Math.sin(ang)*rr*.6,30,30,age,1,0,.9);}}
 else if(f.type==='deathward'){drawFx('spiral',f.x,f.y-14,Math.min(120,f.r*2.6),Math.min(120,f.r*2.6),age,1,0,.95);drawFx('burst_s',f.x,f.y-14,70,70,age,1,0,.8);ctx.globalCompositeOperation='lighter';ctx.lineWidth=3*a;ctx.strokeStyle='#c8a0ff';ctx.beginPath();ctx.ellipse(f.x,f.y+4,f.r*(.4+age),f.r*(.4+age)*.5,0,0,Math.PI*2);ctx.stroke();ctx.globalCompositeOperation='source-over';ctx.font='bold '+Math.round(12*viewScale())+'px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#0b0f0bdd';ctx.strokeText('對抗死亡',f.x,f.y-34-age*18);ctx.fillStyle='#e6c8ff';ctx.fillText('對抗死亡',f.x,f.y-34-age*18);}
 else if(f.type==='chain'){const col=SixPresentation.colors[f.element]||'#ffe3ad',x1=f.x,y1=f.y-18,x2=f.tx,y2=f.ty-18,dx=x2-x1,dy=y2-y1,n=Math.max(3,Math.round(Math.hypot(dx,dy)/22)),nx=-dy/(Math.hypot(dx,dy)||1),ny=dx/(Math.hypot(dx,dy)||1);ctx.globalCompositeOperation='lighter';
  for(const [w,al] of [[7,.28],[3.2,.8],[1.4,1]]){ctx.lineWidth=w;ctx.strokeStyle=al>.9?'#fff':col;ctx.globalAlpha=a*al;ctx.beginPath();ctx.moveTo(x1,y1);for(let i=1;i<n;i++){const t=i/n,j=(fxRnd(f,i+Math.floor(age*6))-.5)*16;ctx.lineTo(x1+dx*t+nx*j,y1+dy*t+ny*j);}ctx.lineTo(x2,y2);ctx.stroke();}
  drawFx('spark_s',x2,y2,40,40,age,FXROW[f.element]??5);}
 else if(f.type==='sweep'){const R=f.r;ctx.globalCompositeOperation='lighter';ctx.lineWidth=5*a;ctx.strokeStyle=(SixPresentation.colors[f.element]||'#e8c9a0');ctx.globalAlpha=a*.9;ctx.beginPath();ctx.ellipse(f.x,f.y,R*(.4+age*.6),R*(.4+age*.6)*.5,0,0,Math.PI*2);ctx.stroke();for(let i=0;i<6;i++){const t=i/6*6.283+age*2.6;drawFx('slash',f.x+Math.cos(t)*R*.75,f.y-6+Math.sin(t)*R*.38,46,46,fxAge(age+(i%2)*.1),5,t+1.57);}}
 else if(f.type==='bell'){const R=f.r;ctx.globalCompositeOperation='lighter';for(let k=0;k<3;k++){const q=Math.max(0,age-k*.16);if(q<=0)continue;ctx.globalAlpha=(1-q)*.85;ctx.lineWidth=3.2-k*.8;ctx.strokeStyle=k===1?'#d9b8ff':'#8a5fd0';ctx.beginPath();ctx.ellipse(f.x,f.y,R*q+4,(R*q+4)*.45,0,0,Math.PI*2);ctx.stroke();}drawFxRing(f,'circle',R*Math.max(.3,age),Math.min(.99,age+.1),1,.7);drawFx('spiral',f.x,f.y-10,Math.min(110,R*.8),Math.min(110,R*.8),age,1,0,.8);}
 else if(f.type==='volley'){const x1=f.x,y1=f.y-16,x2=f.tx,y2=f.ty-16,len=Math.hypot(x2-x1,y2-y1)||1,ang=Math.atan2(y2-y1,x2-x1);ctx.globalCompositeOperation='lighter';for(const [w,col,al] of [[16,'#ffb347',.28],[7,'#ffd88a',.7],[2.5,'#fff',1]]){ctx.globalAlpha=a*al;ctx.lineWidth=w*(.6+a*.4);ctx.strokeStyle=col;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}for(let i=0;i<7;i++){const t=(i+.5)/7;drawFx('spark_l',x1+(x2-x1)*t,y1+(y2-y1)*t,38,38,fxAge(age+i*.03),0,ang);}}
 else if(f.type==='blast'){drawFxScatter(f,f.r>=95?'burst_l':'burst_s',f.r,age,0,.75);ctx.lineWidth=3*a;circle(f.x,f.y,f.r*age+3,'#dfb57c');circle(f.x,f.y,Math.max(2,22*a),'#ffd695'+(a>.5?'99':'44'),true);if(!reducedMotion)for(let j=0;j<9;j++){const angle=j*2.4;circle(f.x+Math.cos(angle)*age*f.r,f.y+Math.sin(angle)*age*f.r*.6-15*age,2+3*a,'#c9b39488',true);}}
 else{if(f.type==='spawn')drawFx('ripple',f.x,f.y+4,f.r*3.2,f.r*1.5,age,f.team?0:3);else if(f.type==='heal')drawFx('halo',f.x,f.y+4,f.r*3,f.r*1.4,age,3);else if(f.type==='cast')drawFx('mandala',f.x,f.y+2,Math.min(160,f.r*2.4),Math.min(160,f.r*2.4)*.5,age,FXROW[f.element]??4,0,.85);ctx.lineWidth=1.4;circle(f.x,f.y,f.r*age+2,f.type==='heal'?'#b9dca3':teamColor(f.team));if(f.type==='heal'){line(f.x-4,f.y-17,f.x+4,f.y-17,'#d5f1b8',2);line(f.x,f.y-21,f.x,f.y-13,'#d5f1b8',2);}if(f.type==='cast'&&f.label){if(f.big){ctx.font='bold '+Math.round(16*viewScale())+'px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#0b0f0bdd';ctx.strokeText(f.label,f.x,f.y-34-age*22);ctx.fillStyle='#ffe29a';ctx.fillText(f.label,f.x,f.y-34-age*22);}else{ctx.font=Math.round(12*viewScale())+'px system-ui';ctx.textAlign='center';ctx.fillStyle='#f4e2b5';ctx.fillText(f.label,f.x,f.y-25-age*15);}}}
 ctx.restore();}}

/* 融煉提示：選著「逆反共振」時，場上每一對可融煉的己方律靈之間連線，並標出要點擊的位置 */
function drawFuseHints(){
 if(!battle||!battle.players||selected<0||mode!=='playing')return;
 const id=battle.players[0].hand[selected];if(!id||SixEngine.CARDS[id].effect!=='resonate')return;
 const r=battle.anyResonance(0);if(!r)return;
 ctx.save();ctx.strokeStyle='#ffe29a';ctx.lineWidth=2.5;ctx.shadowColor='#ffe29a';ctx.shadowBlur=10;ctx.globalAlpha=.6+.35*Math.sin(battle.clock*6);ctx.setLineDash([6,5]);
 ctx.beginPath();ctx.moveTo(r.ax,r.ay);ctx.lineTo(r.bx,r.by);ctx.stroke();
 for(const [x,y] of [[r.ax,r.ay],[r.bx,r.by]]){ctx.beginPath();ctx.arc(x,y,22,0,Math.PI*2);ctx.stroke();}
 ctx.beginPath();ctx.arc(r.x,r.y,SixEngine.CARDS[id].radius,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
 ctx.beginPath();ctx.arc(r.x,r.y,10,0,Math.PI*2);ctx.fillStyle='#ffe29a';ctx.fill();ctx.globalAlpha=1;
 ctx.font='bold '+Math.round(12*viewScale())+'px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#0b0f0bdd';ctx.strokeText(r.n>1?'可獻祭這兩組':'可獻祭這組',r.x,r.y-18);ctx.fillStyle='#ffe29a';ctx.fillText(r.n>1?'可獻祭這兩組':'可獻祭這組',r.x,r.y-18);ctx.restore();
}
