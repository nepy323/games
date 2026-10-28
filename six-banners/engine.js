(function(root){
'use strict';
const D=typeof module!=='undefined'?require('./cards.js'):root.SixData;
const CARDS=Object.fromEntries(D.cards.map(c=>[c.id,c]));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const summons={spirit:{artId:"f2_4",name:"界隙靈",hp:300,dmg:12,speed:42,range:24,rate:1.3,role:"魂",faction:4,ttl:12},skel:{artId:"f2_0",name:'衍生骷髏',hp:125,dmg:35,speed:40,range:22,rate:.85,role:'骨',faction:2},thrall:{artId:"f1_0",name:'血肉僕役',hp:155,dmg:42,speed:45,range:22,rate:.8,role:'刃',faction:1},gob:{artId:"f5_0",name:'營地刀兵',hp:170,dmg:40,speed:52,range:22,rate:.8,role:'刃',faction:5},guard:{artId:"f2_3",name:'骸骨壁壘守衛',hp:1600,dmg:85,speed:25,range:28,rate:1.3,role:'盾',armor:.15,faction:2},wolf:{artId:"summon_wolf",name:'狼靈',hp:230,dmg:48,speed:65,range:23,rate:.85,role:'狼',faction:4},hawk:{artId:"summon_hawk",name:'獵鷹',hp:220,dmg:43,speed:63,range:28,rate:.85,role:'翼',faction:4,flying:true,airHit:true}};
class Battle{
 constructor(deck,enemy,seed=Date.now(),options={}){
  if(!this.validDeck(deck)||!this.validDeck(enemy))throw Error('牌組需有八張不重複的有效卡牌，英雄最多一張');
  this.aiStyles=options.aiStyles||['steady','steady'];this.runeDecks=[deck,enemy].map(d=>this.runeEligible(d));
  this.teamMods=[{},{}];this.seed=seed>>>0;this.clock=0;this.remaining=180;this.overtime=false;this.state='playing';this.winner=null;this.units=[];this.towers=[];this.fields=[];this.projectiles=[];this.fx=[];this.logs=[];this.id=0;this.aiTimers=[1,1.8];this.auto=[false,true];this.stats=[{spent:0,casts:0,kills:0,towerDamage:0},{spent:0,casts:0,kills:0,towerDamage:0}];
  this.players=[deck,enemy].map(d=>({energy:5,resonance:0,hand:d.slice(0,4),queue:d.slice(4),deck:[...d]}));
  for(let team=0;team<2;team++){
   for(const x of [155,445])this.towers.push(this.entity({name:'外塔',hp:2200,dmg:69,range:155,rate:.95,role:'塔',airHit:true},team,x,team?150:550,{tower:true,r:25}));
   this.towers.push(this.entity({name:'主堡',hp:3600,dmg:87,range:170,rate:.9,role:'堡',airHit:true},team,300,team?60:640,{tower:true,core:true,r:32}));
  }
  this.log('戰鬥開始：守住主堡，掌握雙線。');
 }
 runeEligible(d){const cs=d.map(id=>CARDS[id]),troops=cs.filter(c=>c.type==='troop');return troops.length===2&&troops.every(c=>c.cost<=3)&&cs.filter(c=>c.type==='tactic').length===6;}
 validDeck(d){return Array.isArray(d)&&d.length===8&&new Set(d).size===8&&d.every(id=>CARDS[id])&&d.filter(id=>CARDS[id].tier==='hero').length<=1;}
 random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 entity(c,team,x,y,extra={}){const u=this.entity0(c,team,x,y,extra),m=this.teamMods&&this.teamMods[team];if(m&&!u.tower){let hp=m.hp||1,dm=m.dmg||1;if(u.tier==='hero'&&!extra.derived){hp*=m.heroHp||1;dm*=m.heroDmg||1;if(m.heroSpeed&&u.speed)u.speed=Math.round(u.speed*m.heroSpeed);if(m.heroShield){u.shield=m.heroShield;u.shieldUntil=this.clock+10;}if(m.heroGrant&&this.players){const p=this.players[team];if(p)p.energy=Math.min(10,p.energy+m.heroGrant);}}if(hp!==1){u.hp=u.max=Math.round(u.hp*hp);}if(dm!==1&&u.dmg)u.dmg=Math.round(u.dmg*dm);}return u;}
 entity0(c,team,x,y,extra={}){return {...c,...(this.runeDecks?.[team]&&c.type==='troop'&&c.cost<=3&&!extra.derived?{armor:Math.max(c.armor||0,.25),runeArmor:true}:{}),artId:c.artId||c.id,id:++this.id,team,x,y,max:c.hp,hp:c.hp,r:c.hp>=1700?19:12,cool:.4,walk:0,moving:false,attackAt:-99,hitAt:-99,buffs:{},shield:0,shieldUntil:0,travel:0,spawnCool:c.spawnEvery||0,life:c.type==='building'?c.duration:Infinity,angle:team?Math.PI:0,...extra};}
 log(text){this.logs.unshift({time:this.clock,text});this.logs=this.logs.slice(0,6);}
 effect(type,x,y,team,r=30,extra={}){this.fx.push({type,x,y,team,r,life:.55,max:.55,...extra});}
 all(){return [...this.towers,...this.units].filter(u=>u.hp>0);}
 legal(c,team,x,y){
  if(c.tier==='hero'&&this.units.some(u=>u.team===team&&u.artId===c.id&&u.hp>0))return '這名英雄仍在戰場，陣亡後才能再次部署';
  if(x<25||x>575||y<22||y>678)return '請點擊戰場內';
  const home=c.type!=='tactic'||c.homeOnly||c.effect==='mine';
  if(home&&(team===0?y<382:y>318))return '此卡只能部署於己方半場';
  if((c.type!=='tactic'||c.effect==='portal')&&this.all().some(t=>(t.tower||t.type==='building')&&dist(t,{x,y})<t.r+19))return '請避開現有建築';
  return '';
 }
 play(team,slot,x,y){
  if(this.state!=='playing')return '對局未進行';
  const p=this.players[team],id=p.hand[slot],c=CARDS[id];if(!c)return '請先選卡';
  const err=this.legal(c,team,x,y);if(err)return err;
  if(p.energy+1e-6<c.cost)return '資源不足，等待回復';
  p.energy-=c.cost;this.stats[team].spent+=c.cost;this.stats[team].casts++;p.queue.push(id);p.hand[slot]=p.queue.shift();
  if(c.type==='tactic'){p.resonance=Math.min(12,p.resonance+c.cost);this.cast(c,team,x,y);}else this.spawn(c,team,x,y,c.n);
  this.log((team?'敵方':'我方')+'施放 '+c.name);return '';
 }
 spawn(c,team,x,y,n=1,extra={}){
  if(c.tier==='hero'&&this.units.some(u=>u.team===team&&u.artId===c.id&&u.hp>0))return;
  for(let i=0;i<(c.tier==='hero'?1:n);i++){
   const angle=i*2.4,r=n>1?16+Math.floor(i/3)*12:0;
   const u=this.entity(c,team,clamp(x+Math.cos(angle)*r,28,572),clamp(y+Math.sin(angle)*r,25,675),extra);
   if(c.type==='building')u.r=22;
   this.units.push(u);
  }
  this.effect('spawn',x,y,team,40);
  if(c.companion)this.spawn(summons.hawk,team,x+22,y,1,{derived:true});
 }
 summon(kind,team,x,y,n=1){this.spawn(summons[kind],team,x,y,n,{derived:true});}
 buff(u,key,duration){u.buffs[key]=Math.max(u.buffs[key]||0,this.clock+duration);}
 has(u,key){return (u.buffs[key]||0)>this.clock;}
 cast(c,team,x,y){
  this.effect('cast',x,y,team,c.radius,{label:c.name});
  if(c.effect==='portal'){this.spawn({name:c.name,artId:'x_portal',type:'building',hp:800,dmg:0,range:0,speed:0,rate:1,duration:12,portal:true,portalWave:0,portalAt:this.clock,role:'門',faction:4},team,x,y);this.portalStep(this.units.at(-1));return;}
  if(['bomb','summon'].includes(c.effect)){this.fields.push({c,team,x,y,age:0,tick:0,duration:c.delay||1});return;}
  if(['fire','curse','heal','barrage','mine'].includes(c.effect)){this.fields.push({c,team,x,y,age:0,tick:0,duration:c.duration});return;}
  let targets=this.all().filter(u=>dist(u,{x,y})<=c.radius+u.r);
  if(c.effect==='bolt'){
   targets=targets.filter(u=>u.team!==team&&!u.tower&&u.type!=='building').sort((a,b)=>b.hp-a.hp);
   if(targets[0])this.hit({team},targets[0],c.damage,true);return;
  }
  for(const u of targets){
   if(['root','slow'].includes(c.effect)){if(u.team!==team&&!u.tower&&u.type!=='building')this.buff(u,c.effect,c.duration);continue;}
   if(u.team!==team||u.tower||u.type==='building')continue;
   if(c.effect==='shield'){u.shield=Math.max(u.shield,280);u.shieldUntil=this.clock+c.duration;}
   else {if(c.effect==='sacrifice')u.hp=Math.max(1,u.hp-u.max*.22);this.buff(u,c.effect,c.duration);}
  }
 }
 hit(a,b,amount,spell=false){
  if(!b||b.hp<=0)return;
  if(spell&&(b.tower||b.type==='building'))amount*=b.tower?.32:.8;
  let armor=Math.max(b.ability==='plating'&&b.hp>b.max*.5?.35:b.armor||0,this.has(b,'armor')?.35:0,this.has(b,'ward')?.2:0);
  amount*=1-armor;if(this.has(b,'rush'))amount*=1.25;
  if(b.shieldUntil>this.clock){const block=Math.min(amount,b.shield);b.shield-=block;amount-=block;}
  if(b.bloodUntil>this.clock){const block=Math.min(amount,b.bloodShield||0);b.bloodShield-=block;amount-=block;}
  if(!b.tower&&b.type!=='building'&&!b.guardShare){
   const guard=this.units.filter(u=>u.guardShare&&u.team===b.team&&u.hp>0&&u.guardTarget===b.id&&dist(u,b)<85).sort((u,v)=>u.id-v.id)[0];
   if(guard){const share=Math.min(amount*guard.guardShare,guard.hp);guard.hp-=share;amount-=share;guard.hitAt=this.clock;if(guard.hp<=0)guard.killer=a.team;}
  }
  if(b.tower&&a.team!==b.team)this.stats[a.team].towerDamage+=Math.min(b.hp,amount);
  const actual=Math.min(b.hp,amount);b.hp-=amount;if(b.hp<=0)b.killer=a.team;
  if(a.lifesteal&&a.hp>0&&!spell&&!b.tower&&b.type!=='building'&&a.team!==b.team)this.restore(a,actual*(a.hp<a.max*.5?.4:a.lifesteal));
  if(amount>0){b.hitAt=this.clock;const dx=b.x-(a.x??b.x),dy=b.y-(a.y??b.y),n=Math.hypot(dx,dy)||1;b.hitDX=dx/n;b.hitDY=dy/n;if(this.clock-(b.lastSpark??-99)>.09){b.lastSpark=this.clock;this.effect('impact',b.x,b.y,b.team,amount>=180?24:12,{element:a.element||a.c?.element||'物理',life:.25,max:.25});}}
 }
 fieldsStep(dt){
  for(const f of this.fields){
   const c=f.c;f.age+=dt;f.tick-=dt;
   if(['bomb','summon'].includes(c.effect)){
    if(f.age<f.duration)continue;
    if(c.effect==='summon')this.summon(c.summon,f.team,f.x,f.y,c.count);
    else {this.all().filter(u=>u.team!==f.team&&dist(u,f)<=c.radius+u.r).forEach(u=>this.hit(f,u,c.damage,true));this.effect('blast',f.x,f.y,f.team,c.radius);}
    f.done=true;continue;
   }
   if(c.effect==='mine'){
    if(f.age>.7&&this.units.some(u=>u.team!==f.team&&!u.flying&&u.hp>0&&dist(u,f)<c.radius)){
     this.all().filter(u=>u.team!==f.team&&!u.flying&&dist(u,f)<c.radius+u.r).forEach(u=>this.hit(f,u,c.damage,true));
     this.effect('blast',f.x,f.y,f.team,c.radius);f.done=true;
    }
   }else if(f.tick<=0){
    const tick=c.effect==='barrage'?1:.5;f.tick+=tick;
    for(const u of this.all().filter(u=>dist(u,f)<c.radius+u.r)){
     if(c.effect==='heal'){if(u.team===f.team&&!u.tower)this.restore(u,c.heal*tick);}
     else if(u.team!==f.team){this.hit(f,u,c.damage*(c.effect==='barrage'?1:tick),true);if(c.effect==='curse')this.buff(u,'curse',1);}
    }
    if(c.effect==='barrage')this.effect('blast',f.x+(this.random()-.5)*25,f.y+(this.random()-.5)*25,f.team,c.radius);
   }
   if(f.age>=f.duration)f.done=true;
  }
  this.fields=this.fields.filter(f=>!f.done);
 }
 canTarget(a,b){return b.team!==a.team&&b.hp>0&&(!b.flying||a.airHit)&&(!a.siege||b.tower||b.type==='building');}
 attack(a,b){
  let amount=a.dmg*(this.has(a,'power')?1.3:1)*(this.has(a,'sacrifice')?1.55:1);
  if(a.antiLarge&&b.max>=1200)amount*=a.antiLarge;
  const charged=!!(a.charge&&a.travel>=90);
  if(charged){amount*=1.8;a.travel=0;this.effect('charge',a.x,a.y,a.team,36);}
  const kind=a.attackKind||(a.range>60?'arrow':'melee');
  const duration=kind==='melee'?.14:kind==='bullet'?.065:kind==='flame'?.12:kind==='shell'||kind==='stone'?Math.max(.35,dist(a,b)/270):Math.max(.12,dist(a,b)/(kind==='magic'?330:500));
  const dx=b.x-a.x,dy=b.y-a.y,n=Math.hypot(dx,dy)||1;
  a.attackAt=this.clock;a.attackDX=dx/n;a.attackDY=dy/n;a.attackDuration=duration;
  this.projectiles.push({source:a,target:b,kind,amount,charged,team:a.team,x:a.x,y:a.y,tx:b.x,ty:b.y,age:0,duration,element:a.element||'物理'});
  if(kind==='bullet')this.effect('muzzle',a.x,a.y,a.team,14,{dx:dx/n,dy:dy/n,life:.12,max:.12});
  const haste=Math.max(this.has(a,'haste')?1.4:1,this.has(a,'aura')?1.2:1,this.has(a,'frenzy')?1.6:1);a.cool=a.rate/haste;
 }
 projectileStep(dt){
  for(const p of this.projectiles){
   p.age+=dt;const a=p.source,b=p.target;
   // Arrows and spells track their acquired target. Artillery lands at its original ground point.
   if(!['shell','stone'].includes(p.kind)){p.tx=b.x;p.ty=b.y;}
   if(p.age<p.duration)continue;
   const alive=b.hp>0&&!b.dead;const landed={x:p.tx,y:p.ty};
   if(p.kind==='melee'&&(!alive||a.hp<=0||dist(a,b)>a.range+b.r+22)){p.done=true;continue;}
   const primary=alive&&(!['shell','stone'].includes(p.kind)||dist(b,landed)<(a.splash||16)+b.r);
   if(primary){
    if(a.ability==='combo'){a.comboTarget===b.id?a.comboCount++:(a.comboTarget=b.id,a.comboCount=1);if(a.comboCount%3===0)p.amount*=1.6;}
    this.hit(a,b,p.amount);this.onImpact(a,b,p);
   }
   if(a.splash||a.cone){const dx=p.tx-p.x,dy=p.ty-p.y,norm=Math.hypot(dx,dy)||1;for(const u of this.all())if((u!==b||!primary)&&u.team!==a.team&&u.hp>0&&(!u.flying||a.airHit)){
    const d=dist(a,u);let ok=a.splash&&dist(u,landed)<a.splash+u.r;
    if(a.cone)ok=d<110&&((u.x-a.x)*dx+(u.y-a.y)*dy)/(d*norm||1)>.65;
    if(ok){this.hit(a,u,p.amount*.8);if(a.ability==='trample'&&!u.tower&&u.type!=='building')this.buff(u,'slow',1);}
   }}
   if(primary){if(a.slowHit)this.buff(b,'slow',1.7);if(a.antiCharge){b.travel=0;this.buff(b,'slow',1);}}
   if(['shell','stone'].includes(p.kind))this.effect('blast',p.tx,p.ty,p.team,a.splash||24,{element:p.element});
   else if(p.kind==='melee')this.effect('slash',p.tx,p.ty,p.team,22,{angle:Math.atan2(p.ty-p.y,p.tx-p.x),life:.18,max:.18});
   p.done=true;
  }
  this.projectiles=this.projectiles.filter(p=>!p.done);
 }
 restore(u,amount,quiet=false){
  if(u.hp<=0)return;const effective=amount*(this.has(u,'curse')?.35:1),over=Math.max(0,effective-(u.max-u.hp));u.hp=Math.min(u.max,u.hp+effective);
  if(over>0&&u.type!=='building'&&!u.tower&&this.units.some(h=>h.ability==='overflow'&&h.team===u.team&&h.hp>0&&dist(h,u)<105)){
   u.bloodShield=Math.min(u.max*.25,240,(u.bloodUntil>this.clock?u.bloodShield||0:0)+over);u.bloodUntil=this.clock+4;
  }
  if(!quiet)this.effect('heal',u.x,u.y,u.team,20);
 }
 portalStep(a){
  if(!a.portal||a.hp<=0||this.clock<a.portalAt)return;
  const n=[1,2,4][a.portalWave];if(!n)return;
  const p=this.players[a.team],charge=Math.min(4,p.resonance);p.resonance-=charge;
  this.spawn(summons.spirit,a.team,a.x,a.y+(a.team?28:-28),n,{derived:true,shield:charge*35,shieldUntil:this.clock+8});
  a.portalWave++;a.portalAt=this.clock+4;this.effect('cast',a.x,a.y,a.team,38,{label:'第 '+a.portalWave+' 波 · '+n+' 隻 / 共鳴 '+charge});
  if(a.portalWave===3){a.hp=0;a.closed=true;}
 }
 shieldUnit(u,amount){u.shield=Math.max(u.shieldUntil>this.clock?u.shield:0,amount);u.shieldUntil=this.clock+4;}
 abilityEffect(a){this.effect('cast',a.x,a.y,a.team,45,{label:a.abilityName});}
 onImpact(a,b,p){
  if(a.hp<=0)return;
  if(p.charged&&a.ability==='banner'){this.units.filter(u=>u.team===a.team&&u.hp>0&&dist(a,u)<105&&u.type!=='building').forEach(u=>this.shieldUnit(u,120));this.abilityEffect(a);}
  if(p.charged&&a.ability==='dive'&&!b.tower&&b.type!=='building')this.buff(b,'slow',2);
  if(p.charged&&a.ability==='leech'&&!b.tower&&b.type!=='building')this.restore(a,180);
  if(a.ability==='roots'){a.rootHits=(a.rootHits||0)+1;if(a.rootHits%3===0&&!b.tower&&b.type!=='building'){this.buff(b,'root',1.2);this.abilityEffect(a);}}
 }
 support(a,dt){
  if(a.portal){this.portalStep(a);return;}
  if(a.guardShare){const ally=this.units.filter(u=>u!==a&&u.team===a.team&&u.hp>0&&!u.guardShare&&u.type!=='building'&&dist(u,a)<85).sort((u,v)=>u.hp/u.max-v.hp/v.max||u.id-v.id)[0];a.guardTarget=ally?.id;}

  if(a.tier==='hero'){
   const nearby=this.units.filter(u=>u.team===a.team&&u.hp>0&&u.type!=='building'&&dist(a,u)<105);
   if(a.ability==='runes'&&this.clock>=(a.runeAt??0)){const target=nearby.sort((u,v)=>u.hp/u.max-v.hp/v.max)[0];if(target){this.shieldUnit(target,160);a.runeAt=this.clock+6;this.abilityEffect(a);}}
   if(a.ability==='rally'&&nearby.filter(u=>u!==a).length>=3)nearby.forEach(u=>this.buff(u,'march',1.2));
   if(a.ability==='souls'&&(a.souls||0)>=3&&this.clock>=(a.soulAt||0)){a.souls-=3;a.soulAt=this.clock+6;this.summon('skel',a.team,a.x,a.y+(a.team?25:-25),2);this.abilityEffect(a);}
  }
  if(a.regen)this.restore(a,a.regen*dt,true);
  if(this.has(a,'frenzy'))a.hp=Math.max(1,a.hp-a.max*.02*dt);
  if(a.heal||a.ward||a.aura){
   a.supportCool=(a.supportCool||0)-dt;
   if(a.supportCool<=0){a.supportCool=1;
    const friends=this.units.filter(u=>u.hp>0&&u.team===a.team&&dist(u,a)<105);
    if(a.heal){const u=friends.filter(u=>u.hp<u.max).sort((b,c)=>b.hp/b.max-c.hp/c.max)[0];if(u){this.restore(u,a.heal);this.effect('heal',u.x,u.y,u.team,22);}}
    if(a.ward||a.aura)friends.forEach(u=>this.buff(u,a.ward?'ward':'aura',1.2));
   }
  }
  if(a.summon){a.spawnCool-=dt;if(a.spawnCool<=0){a.spawnCool=a.spawnEvery;this.summon(a.summon,a.team,a.x,a.y+(a.team?30:-30),a.type==='building'?2:2);}}
 }
 move(a,b,dt){
  if(this.has(a,'root'))return;
  let tx=b.x,ty=b.y;const bridge=a.x<300?155:445;
  if(!a.flying&&(a.y-350)*(b.y-350)<0){
   if(Math.abs(a.y-350)>28){tx=bridge;ty=a.y>350?374:326;}
   else {tx=bridge;ty=a.y>350?318:382;}
  }
  const dx=tx-a.x,dy=ty-a.y,d=Math.hypot(dx,dy);if(d<1)return;
  let speed=a.speed*(this.has(a,'slow')?.45:1)*Math.max(this.has(a,'speed')?1.5:1,this.has(a,'rush')?1.75:1,this.has(a,'march')?1.2:1);
  const move=Math.min(speed*dt,d);a.x+=dx/d*move;a.y+=dy/d*move;a.travel+=move;a.walk+=move;a.moving=true;a.moveDX=dx/d;a.moveDY=dy/d;
  if(!a.flying&&a.walk-(a.lastDust||0)>14){a.lastDust=a.walk;this.effect(a.role==='輪'?'steam':'dust',a.x,a.y,a.team,a.max>=1700?13:7,{dx:-dx/d,dy:-dy/d,seed:a.id+a.walk,life:.55,max:.55});}
  a.angle=Math.atan2(dx,-dy);
  a.x=clamp(a.x,24,576);a.y=clamp(a.y,22,678);
  if(!a.flying&&a.y>328&&a.y<372)a.x=clamp(a.x,bridge-33,bridge+33);
 }
 ai(team,dt){
  this.aiTimers[team]-=dt;if(this.aiTimers[team]>0)return;this.aiTimers[team]=.8+this.random()*.7;
  const p=this.players[team];const choices=p.hand.map((id,slot)=>({c:CARDS[id],slot})).filter(o=>o.c.cost<=p.energy&&!(o.c.tier==='hero'&&this.units.some(u=>u.team===team&&u.artId===o.c.id&&u.hp>0)));if(!choices.length)return;
  const enemies=this.units.filter(u=>u.team!==team&&u.hp>0),friends=this.units.filter(u=>u.team===team&&u.hp>0);
  const threats=enemies.filter(u=>team?u.y<320:u.y>380);
  const style=this.aiStyles[team]||'steady';
  if(!threats.length&&p.energy<(style==='aggressive'?3:style==='conservative'?8:6))return;
  let choice=choices[Math.floor(this.random()*choices.length)];
  if(style==='aggressive')choice=choices.filter(o=>o.c.type==='troop').sort((a,b)=>a.c.cost-b.c.cost)[0]||choice;
  if(style==='conservative'&&threats.length)choice=choices.find(o=>o.c.type==='building')||choices.find(o=>o.c.armor||o.c.hp>=1000)||choice;
  if(style==='steady'&&!threats.length){const frontline=friends.some(u=>u.hp>=600&&u.range<60);choice=choices.find(o=>frontline?o.c.range>80:o.c.hp>=600&&o.c.type==='troop')||choice;}

  if(threats.length>=3)choice=choices.find(o=>['bomb','fire','barrage'].includes(o.c.effect))||choices.find(o=>o.c.splash)||choice;
  const c=choice.c;let x=this.random()<.5?155:445,y=team?220:480;
  if(threats.length){const t=threats[0];x=clamp(t.x+(this.random()-.5)*55,50,550);y=team?clamp(t.y-65,100,295):clamp(t.y+65,405,600);}
  else if(style==='aggressive')y=team?290:410;else y=team?110:590;
  if(c.type==='tactic'){
   if(['haste','shield','frenzy','sacrifice','armor','heal','speed','power','rush'].includes(c.effect)){
    const good=friends.filter(u=>!u.tower&&u.type!=='building'&&(c.effect!=='heal'||u.hp<u.max*.8));if(!good.length)return;
    const t=good.sort((a,b)=>b.cost-a.cost)[0];x=t.x;y=t.y;
   }else if(c.effect==='summon'){
    if(c.homeOnly){x=threats[0]?.x||x;y=team?280:420;}
    else {const t=this.towers.find(t=>t.team!==team&&!t.core&&t.hp>0)||this.towers.find(t=>t.team!==team&&t.core);x=t.x;y=t.y+(team?-50:50);}
   }else if(c.effect!=='mine'&&c.effect!=='portal'){
    let t=enemies.sort((a,b)=>b.max-a.max)[0];if(!t){if(['bolt','root','slow'].includes(c.effect))return;t=this.towers.find(t=>t.team!==team&&!t.core&&t.hp>0)||this.towers.find(t=>t.team!==team&&t.core);}
    x=t.x;y=t.y;
   }
  }
  if(c.type==='building'||c.effect==='portal'){x=this.random()<.5?220:380;y=team?250:450;}
  for(let i=0;i<4;i++){const err=this.legal(c,team,x,y);if(!err)break;x=clamp(x+36,40,560);}
  this.play(team,choice.slot,x,y);
 }
 deaths(){
  for(const u of [...this.units,...this.towers])if(u.hp<=0&&!u.dead){
   if(u.revive&&!u.revived){u.revived=true;u.hp=u.max*.4;u.cool=1.2;this.effect('spawn',u.x,u.y,u.team,45);continue;}
   u.dead=true;
   if(!u.derived&&!u.tower&&u.type!=='building')for(const king of this.units)if(king.ability==='souls'&&king.hp>0&&!king.dead&&dist(king,u)<130)king.souls=Math.min(3,(king.souls||0)+1);
   if(u.ability==='rupture')this.units.filter(v=>v.team!==u.team&&v.hp>0&&v.type!=='building'&&dist(u,v)<70+v.r).forEach(v=>this.buff(v,'slow',2));
   this.effect('death',u.x,u.y,u.team,u.tower?60:25,{tower:!!u.tower});
   if(u.killer!==undefined&&u.killer!==u.team)this.stats[u.killer].kills++;
   if(u.deathBlast&&!u.derived){this.all().filter(b=>b.team!==u.team&&dist(u,b)<70+b.r).forEach(b=>this.hit(u,b,u.deathBlast));this.effect('blast',u.x,u.y,u.team,70);}
   if(u.tower)this.log((u.team?'敵方':'我方')+u.name+'已陷落');
  }
  this.units=this.units.filter(u=>!u.dead);
 }
 score(team){return this.towers.filter(u=>u.team!==team&&!u.core&&u.hp<=0).length;}
 finish(winner,reason){this.state='ended';this.winner=winner;this.reason=reason;this.log(reason);}
 step(dt){
  if(this.state!=='playing')return;dt=Math.min(dt,.1);this.clock+=dt;this.remaining=Math.max(0,this.remaining-dt);
  this.players.forEach((p,i)=>p.energy=Math.min(10,p.energy+dt*(this.remaining<=60||this.overtime?1.25:.625)*((this.teamMods&&this.teamMods[i].regen)||1)));
  for(let t=0;t<2;t++)if(this.auto[t])this.ai(t,dt);
  this.fieldsStep(dt);this.projectileStep(dt);
  for(const a of this.all()){
   if(a.hp<=0)continue;a.moving=false;if(a.ttl!==undefined){a.ttl-=dt;if(a.ttl<=0){a.hp=0;continue;}}
   if(a.type==='building'){a.life-=dt;a.hp-=a.max/a.duration*dt;if(a.life<=0||a.hp<=0){a.hp=0;continue;}}
   a.cool-=dt;this.support(a,dt);if(a.hp<=0)continue;
   let enemies=this.all().filter(b=>this.canTarget(a,b));
   const range=enemies.filter(b=>dist(a,b)<=a.range+b.r&&(!a.minRange||dist(a,b)>=a.minRange));
   if(range.length&&a.dmg>0){range.sort((b,c)=>dist(a,b)-dist(a,c));if(a.cool<=0)this.attack(a,range[0]);a.angle=Math.atan2(range[0].x-a.x,-(range[0].y-a.y));continue;}
   if(a.tower||a.type==='building')continue;
   let targets=enemies.filter(b=>!b.tower&&dist(a,b)<145&&((a.y-350)*(b.y-350)>0||a.flying||Math.abs(a.x-b.x)<55));
   if(!targets.length)targets=enemies.filter(b=>b.tower||b.type==='building');
   targets.sort((b,c)=>dist(a,b)-dist(a,c));if(targets[0]){
    if(a.minRange&&dist(a,targets[0])<a.minRange)continue;
    this.move(a,targets[0],dt);
   }
  }
  for(let i=0;i<this.units.length;i++)for(let j=i+1;j<this.units.length;j++){
   const a=this.units[i],b=this.units[j];if(a.hp<=0||b.hp<=0||!!a.flying!==!!b.flying)continue;
   let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),min=(a.r+b.r)*.72;if(d<min){if(d<.01){dx=.1;dy=.1;d=.142;}const push=(min-d)*.12;const am=a.type!=='building',bm=b.type!=='building';if(am){a.x-=dx/d*push;a.y-=dy/d*push;}if(bm){b.x+=dx/d*push;b.y+=dy/d*push;}}
  }
  this.deaths();this.fx.forEach(f=>f.life-=dt);this.fx=this.fx.filter(f=>f.life>0);
  const cores=this.towers.filter(u=>u.core),dead=cores.filter(u=>u.hp<=0);
  if(dead.length)this.finish(dead.length===2?2:1-dead[0].team,'主堡被摧毀');
  else if(this.overtime&&this.score(0)!==this.score(1))this.finish(this.score(0)>this.score(1)?0:1,'加時外塔決勝');
  else if(this.remaining<=0){
   if(this.score(0)!==this.score(1))this.finish(this.score(0)>this.score(1)?0:1,'摧毀外塔較多者獲勝');
   else if(!this.overtime){this.overtime=true;this.remaining=60;this.log('進入加時 60 秒：下一座外塔決勝。');}
   else {const hp=t=>this.towers.filter(u=>u.team===t).reduce((v,u)=>v+Math.max(0,u.hp),0);this.finish(Math.abs(hp(0)-hp(1))<1?2:hp(0)>hp(1)?0:1,'加時結束，依剩餘建築總生命判定');}
  }
 }
}
const api={Battle,CARDS,summons};if(typeof module!=='undefined')module.exports=api;else root.SixEngine=api;
})(globalThis);
