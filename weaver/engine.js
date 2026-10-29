(function(root){
'use strict';
const D=typeof module!=='undefined'?require('./cards.js'):root.SixData;
const CARDS=Object.fromEntries(D.cards.map(c=>[c.id,c]));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const summons={fuse_earth:{artId:'fuse_earth',size:1.6,tier:'elite',multi:3,name:'地脈靈',hp:1500,dmg:105,speed:26,range:30,rate:1.2,role:'岩',faction:6,armor:.25,heal:30,regen:10},fuse_storm:{artId:'fuse_storm',size:1.5,tier:'elite',multi:2,name:'焰嵐靈',hp:650,dmg:150,speed:40,range:145,rate:1.5,role:'火',faction:6,splash:70,airHit:true,ttl:30},fuse_aurora:{artId:'fuse_aurora',size:1.5,tier:'elite',multi:3,name:'極光靈',hp:750,dmg:40,speed:30,range:125,rate:1.1,role:'光',faction:6,slowHit:true,airHit:true,heal:46,ward:true},spirit:{artId:"f2_4",name:"界隙靈",hp:300,dmg:12,speed:42,range:24,rate:1.3,role:"魂",faction:4,ttl:12},skel:{artId:"f2_0",name:'衍生骷髏',hp:125,dmg:35,speed:40,range:22,rate:.85,role:'骨',faction:2},thrall:{artId:"f1_0",name:'血肉僕役',hp:155,dmg:42,speed:45,range:22,rate:.8,role:'刃',faction:1},gob:{artId:"f5_0",name:'營地刀兵',hp:170,dmg:40,speed:52,range:22,rate:.8,role:'刃',faction:5},guard:{artId:"f2_3",name:'骸骨壁壘守衛',hp:1600,dmg:85,speed:25,range:28,rate:1.3,role:'盾',armor:.15,faction:2},wolf:{artId:"summon_wolf",name:'狼靈',hp:230,dmg:48,speed:65,range:23,rate:.85,role:'狼',faction:4},hawk:{artId:"summon_hawk",name:'獵鷹',hp:220,dmg:43,speed:63,range:28,rate:.85,role:'翼',faction:4,flying:true,airHit:true}};
/* 旗印：牌組中同旗卡牌達 2 / 4 / 6 張，依序解鎖三檔加成（各旗主題不同，數值為草案） */
const SWAP_COST=1,SWAP_COOLDOWN=3;
/* 律靈合體：兩組指定的律靈在 FUSE_WINDOW 秒內、距離 FUSE_RANGE 以內先後部署，兩組消失，換成一隻大律靈（免費）。配方是資料，之後其他單位也能加。 */
const FUSE_WINDOW=8,FUSE_RANGE=150;
const FUSIONS=[
 {a:'n_rock',b:'n_dew',into:'fuse_earth',burst:{dmg:240,r:100,slow:2}},{a:'n_fire',b:'n_wind',into:'fuse_storm',burst:{dmg:320,r:110}},
 {a:'n_frost',b:'n_light',into:'fuse_aurora',burst:{dmg:140,r:110,slow:3}}];
/* 英雄格：英雄不在牌組內，累積條件達成後花資源（原費用 +1）登場；登場後有主動技（冷卻）。 */
const HERO_SUMMON_EXTRA=1,HERO_RESPAWN=40;
const HEROES={
 f0_4:{metric:'troopCards',need:4,cond:'累計部署兵種',skill:'號令',cd:30,desc:'全場友軍獲得 250 點護盾（8 秒）'},
 f1_5:{metric:'ownDeaths',need:6,cond:'己方累計陣亡',skill:'血祭',cd:35,desc:'全場友軍攻速 +60%（6 秒），每秒損失 2% 生命'},
 f2_7:{metric:'allDeaths',need:8,cond:'場上累計陣亡',skill:'收魂',cd:30,desc:'立刻召喚 4 隻骷髏'},
 f3_4:{metric:'tacticSpent',need:10,cond:'累計花費於戰術與建築',skill:'符文庇佑',cd:35,desc:'全場友軍受到傷害 -35%（6 秒）'},
 f4_7:{metric:'controls',need:4,timeNeed:25,cond:'累計施加控制',skill:'盤根',cd:30,desc:'敵人較多的一條路線上的地面敵軍定身 4 秒，並在 8 秒內受傷 +25%'},
 f5_5:{metric:'unitsDeployed',need:6,cond:'累計部署單位',skill:'戰鼓',cd:30,desc:'全場友軍攻速 +40%（8 秒）'}
};
/* 寶物：系統隨機給的單次道具（不在牌組內），無盡鏖戰專用；數值為弱化版遺物效果 */
const ITEM_FIRST=30,ITEM_EVERY=50,ITEM_MAX=2;
const ITEMS=[
 {id:'brass',name:'黃銅機心',art:8,desc:'立即回復 2 點資源'},
 {id:'hourglass',name:'紫砂時計',art:2,desc:'10 秒內資源回復 +40%'},
 {id:'anvil',name:'古符鐵砧',art:7,desc:'8 秒內我方堡壘受到的傷害 -50%'},
 {id:'drum',name:'先祖戰鼓',art:12,desc:'全場友軍攻速 +20%（8 秒）'},
 {id:'seed',name:'世界樹種',art:9,desc:'全場友軍回復 15% 生命'},
 {id:'horn',name:'軍團號角',art:4,desc:'全場友軍攻擊 +30%（6 秒）'},
 {id:'chalice',name:'血誓聖杯',art:3,desc:'我方每座堡壘回復 8% 生命'},
 {id:'tome',name:'封骨魔典',art:6,desc:'免費換掉手中最貴的一張牌'},
 {id:'tusk',name:'獵王巨牙',art:11,desc:'對敵方一座外塔造成 6% 最大生命傷害'},
 {id:'knell',name:'幽魂喪鐘',art:5,desc:'對手失去 2 點資源'},
 {id:'moth',name:'琥珀月蛾',art:10,desc:'最受損的我方堡壘回復 20% 生命'},
 {id:'crown',name:'破王之冠',art:1,desc:'英雄登場條件進度 +50%'},
 {id:'foresight',name:'預知儲蓄',art:13,desc:'鎖住目前所有資源，5 秒後全額還回（上限暫時提高到 14）'}
];
const BANNER_NEED=[2,4,6];
const BANNERS=[
 {key:'shield',name:'軍紀',text:['部署單位獲 40 點護盾','部署單位獲 70 點護盾','部署單位獲 110 點護盾'],val:[40,70,110]},
 {key:'dmg',name:'獻祭',text:['全軍傷害 +4%','全軍傷害 +8%','全軍傷害 +12%'],val:[.04,.08,.12]},
 {key:'regen',name:'亡魂',text:['資源回復 +3%','資源回復 +6%','資源回復 +10%'],val:[.03,.06,.10]},
 {key:'hp',name:'符文',text:['全軍生命 +4%','全軍生命 +8%','全軍生命 +12%'],val:[.04,.08,.12]},
 {key:'speed',name:'疾風',text:['全軍移速 +5%','全軍移速 +9%','全軍移速 +14%'],val:[.05,.09,.14]},
 {key:'rate',name:'蠻勇',text:['全軍攻速 +4%','全軍攻速 +8%','全軍攻速 +12%'],val:[.04,.08,.12]},
 {key:'start',name:'界律',text:['開局資源 +1','開局資源 +2','開局資源 +3'],val:[1,2,3]}
];
const bannerCount=(d,extra=[])=>{const n=[0,0,0,0,0,0,0];for(const id of [...d,...extra]){const c=CARDS[id];if(c&&c.faction>=0&&c.faction<7)n[c.faction]++;}return n;};
const bannerLevels=(d,extra=[])=>bannerCount(d,extra).map(n=>BANNER_NEED.filter(k=>n>=k).length);
const bannerMods=(d,extra=[])=>{const m={};bannerLevels(d,extra).forEach((lv,f)=>{if(lv)m[BANNERS[f].key]=BANNERS[f].val[lv-1];});return m;};
class Battle{
 constructor(deck,enemy,seed=Date.now(),options={}){
  if(!this.validDeck(deck)||!this.validDeck(enemy))throw Error('牌組需有八張不重複的有效卡牌，英雄最多一張');
  this.aiStyles=options.aiStyles||['steady','steady'];const hs=(options.heroes||[[],[]]).map(l=>(l||[]).filter(id=>HEROES[id]));this.bannerMods=[deck,enemy].map((d,i)=>bannerMods(d,hs[i]||[]));
  this.teamMods=[{},{}];this.seed=seed>>>0;this.clock=0;this.remaining=180;this.overtime=false;this.state='playing';this.winner=null;this.units=[];this.towers=[];this.fields=[];this.projectiles=[];this.fx=[];this.logs=[];this.id=0;this.aiTimers=[1,1.8];this.auto=[false,true];this.stats=[{spent:0,casts:0,kills:0,towerDamage:0},{spent:0,casts:0,kills:0,towerDamage:0}];
  this.players=[deck,enemy].map((d,i)=>({energy:5+((this.bannerMods[i]||{}).start||0),resonance:0,hand:d.slice(0,4),queue:d.slice(4),deck:[...d]}));
  this.heroSlots=[0,1].map(i=>(hs[i]||[]).map(id=>({id,nextAt:0,skillAt:0,boost:0})));this.heroLimit=options.heroLimit||1;
  this.counters=[0,1].map(()=>({troopCards:0,ownDeaths:0,allDeaths:0,tacticSpent:0,controls:0,unitsDeployed:0}));
  this.groups=[];this.notice=[];this.items=[[],[]];this.itemsOn=!!options.items;this.nextItem=ITEM_FIRST;
  /* 洗牌：實戰開局抽牌順序隨機；測試預設不洗牌以保持可重現 */
  if(options.shuffle){for(let k=0;k<8;k++)this.random();this.players.forEach(p=>{const d=[...p.deck];for(let i=d.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[d[i],d[j]]=[d[j],d[i]];}p.hand=d.slice(0,4);p.queue=d.slice(4);});}
  for(let team=0;team<2;team++){
   for(const x of [155,445])this.towers.push(this.entity({name:'外塔',hp:2200,dmg:69,range:155,rate:.95,role:'塔',airHit:true},team,x,team?150:550,{tower:true,r:25}));
   this.towers.push(this.entity({name:'主堡',hp:3600,dmg:87,range:170,rate:.9,role:'堡',airHit:true},team,300,team?60:640,{tower:true,core:true,r:32}));
  }
  this.log('戰鬥開始：守住主堡，掌握雙線。');
 }
 validDeck(d){return Array.isArray(d)&&d.length===8&&new Set(d).size===8&&d.every(id=>CARDS[id])&&d.filter(id=>CARDS[id].tier==='hero').length<=1;}
 random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 entity(c,team,x,y,extra={}){const u=this.entity0(c,team,x,y,extra),m=this.teamMods&&this.teamMods[team],bm=this.bannerMods&&this.bannerMods[team];if(bm&&!u.tower&&!extra.derived&&u.type!=='tactic'){if(bm.hp){u.hp=u.max=Math.round(u.hp*(1+bm.hp));}if(bm.dmg&&u.dmg)u.dmg=Math.round(u.dmg*(1+bm.dmg));if(bm.speed&&u.speed)u.speed=Math.round(u.speed*(1+bm.speed));if(bm.rate&&u.rate)u.rate=+(u.rate*(1-bm.rate)).toFixed(3);if(bm.shield){u.shield=bm.shield;u.shieldUntil=this.clock+8;}}if(m&&!u.tower){let hp=m.hp||1,dm=m.dmg||1;if(u.tier==='hero'&&!extra.derived){hp*=m.heroHp||1;dm*=m.heroDmg||1;if(m.heroSpeed&&u.speed)u.speed=Math.round(u.speed*m.heroSpeed);if(m.heroShield){u.shield=m.heroShield;u.shieldUntil=this.clock+10;}if(m.heroGrant&&this.players){const p=this.players[team];if(p)p.energy=Math.min(10,p.energy+m.heroGrant);}}if(hp!==1){u.hp=u.max=Math.round(u.hp*hp);}if(dm!==1&&u.dmg)u.dmg=Math.round(u.dmg*dm);}return u;}
 entity0(c,team,x,y,extra={}){return {...c,artId:c.artId||c.id,id:++this.id,team,x,y,max:c.hp,hp:c.hp,r:c.hp>=1700?19:12,cool:.4,walk:0,moving:false,attackAt:-99,hitAt:-99,buffs:{},shield:0,shieldUntil:0,travel:0,spawnCool:c.spawnEvery||0,life:c.type==='building'?c.duration:Infinity,angle:team?Math.PI:0,...extra};}
 log(text){this.logs.unshift({time:this.clock,text});this.logs=this.logs.slice(0,6);}
 effect(type,x,y,team,r=30,extra={}){this.fx.push({type,x,y,team,r,life:.55,max:.55,...extra});}
 all(){return [...this.towers,...this.units].filter(u=>u.hp>0);}
 legal(c,team,x,y){
  if(c.tier==='hero'&&this.units.some(u=>u.team===team&&u.artId===c.id&&u.hp>0))return '這名英雄仍在戰場，陣亡後才能再次部署';
  if(x<25||x>575||y<22||y>678)return '請點擊戰場內';
  const home=(c.type!=='tactic'&&!c.anywhere)||c.homeOnly||c.effect==='mine';
  if(home&&(team===0?y<382:y>318))return '此卡只能部署於己方半場';
  if((c.type!=='tactic'||c.effect==='portal')&&this.all().some(t=>(t.tower||t.type==='building')&&dist(t,{x,y})<t.r+19))return '請避開現有建築';
  return '';
 }
 /* ---------- 合體 ---------- */
 noteGroup(c,team,before){
  const made=this.units.slice(before).filter(u=>u.team===team&&u.artId===c.id);if(!made.length)return;
  const g={cardId:c.id,team,t:this.clock,ids:made.map(u=>u.id)};this.groups.push(g);this.tryFuse(g);
 }
 groupUnits(g){return this.units.filter(u=>g.ids.includes(u.id)&&u.hp>0&&!u.dead);}
 tryFuse(g){
  const rec=FUSIONS.find(f=>(f.a===g.cardId||f.b===g.cardId));if(!rec)return;
  const partner=rec.a===g.cardId?rec.b:rec.a,mine=this.groupUnits(g);if(!mine.length)return;
  const cx=a=>a.reduce((s,u)=>s+u.x,0)/a.length,cy=a=>a.reduce((s,u)=>s+u.y,0)/a.length;
  const other=this.groups.find(h=>h!==g&&!h.fused&&h.team===g.team&&h.cardId===partner&&this.clock-h.t<=FUSE_WINDOW&&this.groupUnits(h).length&&Math.hypot(cx(this.groupUnits(h))-cx(mine),cy(this.groupUnits(h))-cy(mine))<=FUSE_RANGE);
  if(!other)return;
  const theirs=this.groupUnits(other),all=[...mine,...theirs],x=cx(all),y=cy(all);
  for(const u of all){u.dead=true;u.hp=0;}this.units=this.units.filter(u=>!u.dead);
  g.fused=other.fused=true;this.spawn(summons[rec.into],g.team,x,y,1,{derived:true});
  if(rec.burst){/* 合體當下的衝擊波：像一張免費的解場戰術 */for(const u of this.all().filter(v=>v.team!==g.team&&!v.tower&&v.type!=='building'&&dist(v,{x,y})<=rec.burst.r+v.r)){this.hit({team:g.team},u,rec.burst.dmg,true);if(rec.burst.slow)this.buff(u,'slow',rec.burst.slow);}this.effect('blast',x,y,g.team,rec.burst.r);}
  const nm=summons[rec.into].name;this.effect('cast',x,y,g.team,70,{label:'合體：'+nm});this.log((g.team?'敵方':'我方')+'律靈合體：'+nm);this.notice.push({team:g.team,text:'合體：'+nm});
 }
 countPlay(team,c){const k=this.counters[team];if(c.type==='tactic'||c.type==='building')k.tacticSpent+=c.cost;if(c.type!=='tactic'){k.unitsDeployed+=c.tier==='hero'?1:(c.n||1);if(c.type==='troop')k.troopCards++;}}
 /* ---------- 英雄格 ---------- */
 heroStatus(team){
  return this.heroSlots[team].map((sl,idx)=>{
   const H=HEROES[sl.id],k=this.counters[team],card=CARDS[sl.id];
   const progress=Math.min(1,Math.max((k[H.metric]||0)/H.need,H.timeNeed?this.clock/H.timeNeed:0)+sl.boost);
   const hero=this.units.find(u=>u.team===team&&u.artId===sl.id&&u.hp>0&&!u.derived);
   const onField=!!hero,cost=card.cost+HERO_SUMMON_EXTRA,wait=Math.max(0,sl.nextAt-this.clock);
   return {idx,id:sl.id,name:card.name,progress,onField,cost,wait,cond:H.cond,need:H.need,count:k[H.metric]||0,
    ready:progress>=1&&!onField&&wait<=0,skill:H.skill,skillDesc:H.desc,skillWait:onField?Math.max(0,sl.skillAt-this.clock):0,skillReady:onField&&this.clock>=sl.skillAt};
  });
 }
 playHero(team,idx,x,y){
  if(this.state!=='playing')return '對局未進行';
  const st=this.heroStatus(team)[idx];if(!st)return '沒有英雄';
  if(st.onField)return '英雄已在戰場';
  if(st.wait>0)return '英雄重整中';
  if(st.progress<1)return '登場條件尚未達成';
  if(this.heroSlots[team].filter(q=>this.units.some(u=>u.team===team&&u.artId===q.id&&u.hp>0&&!u.derived)).length>=this.heroLimit)return '場上英雄已達上限';
  const c=CARDS[st.id],err=this.legal(c,team,x,y);if(err)return err;
  const p=this.players[team];if(p.energy+1e-6<st.cost)return '資源不足，英雄登場需 '+st.cost+' 點';
  p.energy-=st.cost;this.stats[team].spent+=st.cost;this.stats[team].casts++;
  this.spawn(c,team,x,y,1);this.heroSlots[team][idx].skillAt=this.clock+5;this.countPlay(team,c);
  this.log((team?'敵方':'我方')+'英雄登場：'+c.name);return '';
 }
 castSkill(team,idx){
  if(this.state!=='playing')return '對局未進行';
  const sl=this.heroSlots[team][idx],st=sl&&this.heroStatus(team)[idx];if(!st||!st.onField)return '英雄不在場上';
  if(!st.skillReady)return '技能冷卻中';
  const hero=this.units.find(u=>u.team===team&&u.artId===sl.id&&u.hp>0&&!u.derived);
  const friends=this.units.filter(u=>u.team===team&&u.hp>0&&u.type!=='building'),foes=this.units.filter(u=>u.team!==team&&u.hp>0&&u.type!=='building');
  const id=sl.id;
  if(id==='f0_4')friends.forEach(u=>{u.shield=Math.max(u.shield||0,250);u.shieldUntil=this.clock+8;});
  else if(id==='f1_5')friends.forEach(u=>this.buff(u,'frenzy',6));
  else if(id==='f2_7')this.summon('skel',team,hero.x,hero.y+(team?30:-30),4);
  else if(id==='f3_4')friends.forEach(u=>this.buff(u,'armor',6));
  else if(id==='f5_5')friends.forEach(u=>this.buff(u,'haste',8));
  else if(id==='f4_7'){
   const ground=foes.filter(u=>!u.flying),near=x=>ground.filter(u=>Math.abs(u.x-x)<110);
   const lane=near(155).length>near(445).length?155:near(445).length>near(155).length?445:(hero.x<300?155:445);
   const hit=near(lane);if(!hit.length)return '路線上沒有地面敵軍';
   hit.forEach(u=>{this.buff(u,'root',4);this.buff(u,'rush',8);});
   this.effect('cast',lane,350,team,120,{label:'盤根'});
  }
  this.effect('cast',hero.x,hero.y,team,70,{label:HEROES[id].skill});
  sl.skillAt=this.clock+HEROES[id].cd;this.log((team?'敵方':'我方')+CARDS[id].name+'發動「'+HEROES[id].skill+'」');return '';
 }
 /* ---------- 寶物 ---------- */
 grantItem(team){
  const it=ITEMS[Math.floor(this.random()*ITEMS.length)],list=this.items[team];
  list.push({id:it.id,gotAt:this.clock});while(list.length>ITEM_MAX)list.shift();
  if(team===0)this.log('獲得寶物：'+it.name);return it;
 }
 useItem(team,slot){
  if(this.state!=='playing')return '對局未進行';
  const list=this.items[team],ent=list[slot];if(!ent)return '沒有寶物';
  const p=this.players[team],friends=this.units.filter(u=>u.team===team&&u.hp>0&&u.type!=='building'),myTowers=this.towers.filter(t=>t.team===team&&t.hp>0);
  const it=ent.id;
  if(it==='brass')p.energy=Math.min(10,p.energy+2);
  else if(it==='hourglass'){p.regenUntil=this.clock+10;p.regenMul=1.4;}
  else if(it==='anvil')p.towerGuard=this.clock+8;
  else if(it==='drum')friends.forEach(u=>this.buff(u,'aura',8));
  else if(it==='seed')friends.forEach(u=>this.restore(u,u.max*.15));
  else if(it==='horn')friends.forEach(u=>this.buff(u,'power',6));
  else if(it==='chalice')myTowers.forEach(t=>this.restore(t,t.max*.08));
  else if(it==='tome'){let s=0;p.hand.forEach((id,i)=>{if(CARDS[id].cost>CARDS[p.hand[s]].cost)s=i;});const out=p.hand[s],inn=p.queue.shift();if(!inn)return '沒有可換的牌';p.hand[s]=inn;p.queue.push(out);}
  else if(it==='tusk'){const t=this.towers.filter(t=>t.team!==team&&!t.core&&t.hp>0).sort((a,b)=>b.hp-a.hp)[0]||this.towers.find(t=>t.team!==team&&t.hp>0);if(!t)return '沒有目標';this.hit({team},t,t.max*.06);this.effect('blast',t.x,t.y,team,40);}
  else if(it==='knell')this.players[1-team].energy=Math.max(0,this.players[1-team].energy-2);
  else if(it==='moth'){const t=myTowers.sort((a,b)=>a.hp/a.max-b.hp/b.max)[0];if(t)this.restore(t,t.max*.2);}
  else if(it==='crown')this.heroSlots[team].forEach(q=>{q.boost=Math.min(1,q.boost+.5);});
  else if(it==='foresight'){if(p.bank)return '已在儲蓄中';p.bank={amount:p.energy,until:this.clock+5};p.energy=0;}
  list.splice(slot,1);this.effect('cast',300,team?150:550,team,60,{label:ITEMS.find(x=>x.id===it).name});return '';
 }
 aiExtras(team){
  const p=this.players[team];
  // 寶物：持有 4 秒後使用（資源類看時機）
  const items=this.items[team];
  for(let i=0;i<items.length;i++){const e=items[i];if(this.clock-e.gotAt<4)continue;
   if(e.id==='foresight'&&p.energy<9)continue;if(e.id==='brass'&&p.energy>8)continue;if(e.id==='tome'&&p.energy>=9)continue;
   if(this.useItem(team,i)==='')break;}
  // 英雄：條件達成且資源足夠就登場；在場時敵軍靠近就放技能
  const st=this.heroStatus(team);
  for(const h of st){
   if(h.ready&&p.energy>=h.cost+1){const threats=this.units.filter(u=>u.team!==team&&u.hp>0&&(team?u.y<330:u.y>370));const x=threats[0]?threats[0].x:(this.random()<.5?155:445);this.playHero(team,h.idx,clamp(x,60,540),team?230:470);}
   else if(h.skillReady){const hero=this.units.find(u=>u.team===team&&u.artId===h.id&&u.hp>0);const foes=this.units.filter(u=>u.team!==team&&u.hp>0&&u.type!=='building'&&hero&&dist(u,hero)<190).length;if(foes>=2)this.castSkill(team,h.idx);}
  }
 }
 /* 換牌：花 1 點資源，把手中一張牌放到牌序末端並抽下一張；3 秒冷卻。成功回傳 undefined，失敗回傳原因 */
 swap(team,slot){
  if(this.state!=='playing')return '開戰後才能換牌';
  const p=this.players[team];if(!p||slot<0||slot>=p.hand.length)return '無效的牌位';
  if((p.swapAt||0)>this.clock)return '換牌冷卻中';
  if(p.energy+1e-6<SWAP_COST)return '資源不足，無法換牌';
  const out=p.hand[slot],inn=p.queue.shift();if(!inn)return '沒有可換的牌';
  p.hand[slot]=inn;p.queue.push(out);p.energy-=SWAP_COST;p.swapAt=this.clock+SWAP_COOLDOWN;this.stats[team].spent+=SWAP_COST;
  return undefined;
 }
 play(team,slot,x,y){
  if(this.state!=='playing')return '對局未進行';
  const p=this.players[team],id=p.hand[slot],c=CARDS[id];if(!c)return '請先選卡';
  const err=this.legal(c,team,x,y);if(err)return err;
  if(p.energy+1e-6<c.cost)return '資源不足，等待回復';
  p.energy-=c.cost;this.stats[team].spent+=c.cost;this.stats[team].casts++;this.countPlay(team,c);p.queue.push(id);p.hand[slot]=p.queue.shift();
  if(c.type==='tactic'){p.resonance=Math.min(12,p.resonance+c.cost);this.cast(c,team,x,y);}else{const before=this.units.length;this.spawn(c,team,x,y,c.n);this.noteGroup(c,team,before);if(c.zone&&c.zone.burst){const z=c.zone;for(const u of this.all().filter(v=>v.team!==team&&!v.tower&&v.type!=='building'&&dist(v,{x,y})<=z.r+v.r))this.hit({team},u,z.burst,true);this.effect('blast',x,y,team,z.r);}}
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
 buff(u,key,duration){if((key==='slow'||key==='root')&&!u.tower&&u.type!=='building'&&this.counters&&!this.has(u,key))this.counters[1-u.team].controls++;u.buffs[key]=Math.max(u.buffs[key]||0,this.clock+duration);}
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
  if(!b||b.hp<=0||b.totem)return;
  if(spell&&(b.tower||b.type==='building'))amount*=b.tower?.32:.8;
  let armor=Math.max(b.ability==='plating'&&b.hp>b.max*.5?.35:b.armor||0,this.has(b,'armor')?.35:0,this.has(b,'ward')?.2:0);
  amount*=1-armor;if(this.has(b,'rush'))amount*=1.25;if(b.tower&&this.players&&(this.players[b.team].towerGuard||0)>this.clock)amount*=.5;
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
 canTarget(a,b){return !b.totem&&b.team!==a.team&&b.hp>0&&(!b.flying||a.airHit)&&(!a.siege||b.tower||b.type==='building');}
 attack(a,b,extra=false){
  let amount=a.dmg*(this.has(a,'power')?1.3:1)*(this.has(a,'sacrifice')?1.55:1)*(this.has(a,'weak')?.65:1);
  if(a.antiLarge&&b.max>=1200)amount*=a.antiLarge;
  const charged=!!(a.charge&&a.travel>=90);
  if(charged){amount*=1.8;a.travel=0;this.effect('charge',a.x,a.y,a.team,36);}
  const kind=a.attackKind||(a.range>60?'arrow':'melee');
  const duration=kind==='melee'?.14:kind==='bullet'?.065:kind==='flame'?.12:kind==='shell'||kind==='stone'?Math.max(.35,dist(a,b)/270):Math.max(.12,dist(a,b)/(kind==='magic'?330:500));
  const dx=b.x-a.x,dy=b.y-a.y,n=Math.hypot(dx,dy)||1;
  a.attackAt=this.clock;a.attackDX=dx/n;a.attackDY=dy/n;a.attackDuration=duration;
  this.projectiles.push({source:a,target:b,kind,amount,charged,team:a.team,x:a.x,y:a.y,tx:b.x,ty:b.y,age:0,duration,element:a.element||'物理'});
  if(kind==='bullet')this.effect('muzzle',a.x,a.y,a.team,14,{dx:dx/n,dy:dy/n,life:.12,max:.12});
  const haste=Math.max(this.has(a,'haste')?1.4:1,this.has(a,'aura')?1.2:1,this.has(a,'frenzy')?1.6:1);if(!extra)a.cool=a.rate/haste;
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
   if(primary){if(a.curseHit)this.buff(b,'curse',3);if(a.rushHit)this.buff(b,'rush',4);if(a.slowHit)this.buff(b,'slow',1.7);if(a.antiCharge){b.travel=0;this.buff(b,'slow',1);}}
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
  if(a.zone){a.zoneCool=(a.zoneCool||0)-dt;if(a.zoneCool<=0){a.zoneCool=.5;for(const u of this.units){if(u.team===a.team||u.hp<=0||u.tower||u.dead)continue;if(dist(u,a)>a.zone.r+u.r)continue;if(a.zone.curse)this.buff(u,'curse',1);if(a.zone.rush)this.buff(u,'rush',1);if(a.zone.weak)this.buff(u,'weak',1);if(a.zone.slow)this.buff(u,'slow',1);if(a.zone.dot)this.hit(a,u,a.zone.dot*.5,true);}}}
  if(a.block&&this.clock>=(a.blockAt||0)){this.shieldUnit(a,a.block);a.blockAt=this.clock+(a.blockEvery||4);}
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
  this.aiExtras(team);
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
  if(c.zone){const foes=enemies.filter(u=>!u.tower&&u.type!=='building');if(!foes.length)return;const t=foes.sort((p,q)=>foes.filter(o=>dist(o,q)<90).length-foes.filter(o=>dist(o,p)<90).length)[0];x=t.x;y=t.y;}
  else if(c.type==='building'||c.effect==='portal'){x=this.random()<.5?220:380;y=team?250:450;}
  for(let i=0;i<4;i++){const err=this.legal(c,team,x,y);if(!err)break;x=clamp(x+36,40,560);}
  this.play(team,choice.slot,x,y);
 }
 deaths(){
  for(const u of [...this.units,...this.towers])if(u.hp<=0&&!u.dead){
   if(u.revive&&!u.revived){u.revived=true;u.hp=u.max*.4;u.cool=1.2;this.effect('spawn',u.x,u.y,u.team,45);continue;}
   u.dead=true;
   if(!u.tower&&u.type!=='building'&&!u.derived){this.counters[u.team].ownDeaths++;this.counters[0].allDeaths++;this.counters[1].allDeaths++;}
   if(u.tier==='hero'&&!u.derived){const sl=this.heroSlots[u.team].find(q=>q.id===u.artId);if(sl)sl.nextAt=this.clock+HERO_RESPAWN;}
   if(u.tower&&!u.core&&this.itemsOn)this.grantItem(u.team);
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
  this.players.forEach((p,i)=>{
   const gain=dt*(this.remaining<=60||this.overtime?1.25:.625)*((this.teamMods&&this.teamMods[i].regen)||1)*(1+((this.bannerMods&&this.bannerMods[i].regen)||0))*((p.regenUntil||0)>this.clock?p.regenMul:1);
   if(p.energy<10)p.energy=Math.min(10,p.energy+gain);
   if(p.bank&&this.clock>=p.bank.until){p.energy+=p.bank.amount;p.bank=null;}
  });
  if(this.itemsOn&&this.clock>=this.nextItem){this.players.forEach((_,t)=>this.grantItem(t));this.nextItem+=ITEM_EVERY;}
  for(let t=0;t<2;t++)if(this.auto[t])this.ai(t,dt);
  this.fieldsStep(dt);this.projectileStep(dt);
  for(const a of this.all()){
   if(a.hp<=0)continue;a.moving=false;if(a.ttl!==undefined){a.ttl-=dt;if(a.ttl<=0){a.hp=0;continue;}}
   if(a.type==='building'){a.life-=dt;if(!a.totem)a.hp-=a.max/a.duration*dt;if(a.life<=0||a.hp<=0){a.hp=0;continue;}}
   a.cool-=dt;this.support(a,dt);if(a.hp<=0)continue;
   let enemies=this.all().filter(b=>this.canTarget(a,b));
   const range=enemies.filter(b=>dist(a,b)<=a.range+b.r&&(!a.minRange||dist(a,b)>=a.minRange));
   if(range.length&&a.dmg>0){range.sort((b,c)=>dist(a,b)-dist(a,c));if(a.cool<=0){this.attack(a,range[0]);if(a.multi)for(const t of range.slice(1,a.multi))this.attack(a,t,true);}a.angle=Math.atan2(range[0].x-a.x,-(range[0].y-a.y));continue;}
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
const api={Battle,CARDS,summons,FUSIONS,FUSE_WINDOW,FUSE_RANGE,SWAP_COST,SWAP_COOLDOWN,HEROES,ITEMS,HERO_SUMMON_EXTRA,HERO_RESPAWN,ITEM_FIRST,ITEM_EVERY,ITEM_MAX,BANNERS,BANNER_NEED,bannerCount,bannerLevels,bannerMods};if(typeof module!=='undefined')module.exports=api;else root.SixEngine=api;
})(globalThis);
