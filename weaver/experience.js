'use strict';
let testMode=false,matchToken=0,matchTimers=[];
const launchBattle=start;
const commanders=[
 {name:'赤隼',art:'f1_5',glyph:'隼',color:'#c4573a',style:'aggressive',label:'激進',note:'快速出兵，從橋頭施壓',decks:[9,7]},
 {name:'灰岩',art:'f3_4',glyph:'岩',color:'#8b8f7a',style:'steady',label:'沉穩',note:'保留資源，前排與遠程協同',decks:[11,4]},
 {name:'霜鴉',art:'f2_7',glyph:'鴉',color:'#5a8fb0',style:'conservative',label:'保守',note:'蓄積資源，優先防守反擊',decks:[10,3]},
 {name:'銀環',art:'sd_0',glyph:'環',color:'#dab66e',style:'steady',label:'沉穩',note:'陣線整齊，穩穩推進',decks:[8,0]},
 {name:'鐵律',art:'sd_1',glyph:'律',color:'#e0c27a',style:'steady',label:'沉穩',note:'照著章程出牌，很少失誤',decks:[0,8]},
 {name:'紅渠',art:'sd_2',glyph:'渠',color:'#df786c',style:'aggressive',label:'激進',note:'血誓出身，賭上一切搶攻',decks:[9,1]},
 {name:'沉燈',art:'sd_4',glyph:'燈',color:'#b5a1de',style:'conservative',label:'保守',note:'慢慢鋪場，等你先出錯',decks:[10,6]},
 {name:'啞鐘',art:'sd_5',glyph:'鐘',color:'#a090cc',style:'steady',label:'沉穩',note:'亡者人海，一波接一波',decks:[10,3]},
 {name:'玄鈴',art:'sd_6',glyph:'鈴',color:'#88b7c4',style:'conservative',label:'保守',note:'堡壘與符文，守得很穩',decks:[11,5]},
 {name:'鉚星',art:'sd_7',glyph:'星',color:'#7fb0bd',style:'steady',label:'沉穩',note:'攻城機具慢慢壓上來',decks:[11,4]},
 {name:'落葉',art:'sd_8',glyph:'葉',color:'#96c39b',style:'conservative',label:'保守',note:'藤蔓與控場，拖慢你的節奏',decks:[12]},
 {name:'青棘',art:'sd_9',glyph:'棘',color:'#7fb386',style:'steady',label:'沉穩',note:'林地守軍，進退有序',decks:[12,5]},
 {name:'裂風',art:'sd_10',glyph:'風',color:'#d5a26d',style:'aggressive',label:'激進',note:'獸群衝鋒，不給你喘息',decks:[13,1]},
 {name:'斷牙',art:'sd_11',glyph:'牙',color:'#c98d57',style:'aggressive',label:'激進',note:'兩路同時突擊',decks:[13,2]}];
let lastRival=-1;
const emblem=document.createElement('div');emblem.id='emblem';emblem.hidden=true;$('modalTitle').before(emblem);
const REEL_H=104,REEL_LAPS=4;
function portrait(c){return artSVG(c.art,'portrait');}
function spinReel(idx){const items=[];for(let i=0;i<REEL_LAPS*commanders.length;i++)items.push(commanders[i%commanders.length]);const target=(REEL_LAPS-1)*commanders.length+idx;
 emblem.hidden=false;emblem.className='emblem reel spinning';emblem.style.removeProperty('--ec');
 emblem.innerHTML='<div class="reel-window"><div class="reel-strip">'+items.map(c=>'<div class="reel-item" style="--ec:'+c.color+'">'+portrait(c)+'</div>').join('')+'</div></div><small>搜尋對手中…</small>';
 const strip=emblem.querySelector('.reel-strip');strip.style.transform='translateY(0)';void strip.offsetHeight;
 strip.style.transition=reducedMotion?'none':'transform 2s cubic-bezier(.1,.75,.12,1)';strip.style.transform='translateY(-'+target*REEL_H+'px)';}
function showEmblem(c){emblem.hidden=false;emblem.className='emblem reel found';emblem.style.setProperty('--ec',c.color);
 emblem.innerHTML='<div class="reel-window"><div class="reel-item" style="--ec:'+c.color+'">'+portrait(c)+'</div></div><small>'+c.name+' · '+c.label+'</small><div class="match-word">MATCH!</div>';
 document.body.classList.remove('match-shake');void document.body.offsetWidth;if(!reducedMotion)document.body.classList.add('match-shake');}
function hideEmblem(){emblem.hidden=true;emblem.innerHTML='';document.body.classList.remove('match-shake');}
function cancelMatch(){hideEmblem();matchToken++;matchTimers.forEach(clearTimeout);matchTimers=[];document.body.classList.remove('match-search');if(mode==='matching'){mode='ready';$('start').disabled=false;$('start').textContent='尋找對戰 →';$('modalHint').textContent='';$('opponentCard').innerHTML='<strong>尚未配對</strong><small>尋找對手，展開雙路交鋒</small>';$('modalTitle').textContent='配對已取消';$('modalText').textContent='調整編制，準備下一場戰鬥。';}}
function startTowerBattle(){
 const T=towerCtx,choice=T.commander;
 battle=new Battle(deck,T.node.enemy,Date.now(),{aiStyles:['steady',choice.style],shuffle:true,heroes:[towerBattleHeroes(),T.node.enemyHeroes||[]],heroLimit:2});towerApplyMods(battle);
 battle.state='ready';battle.enemyName=choice.name;resetVisuals();lastHand='';lastLog='';selected=-1;
 $('opponentCard').innerHTML='<span class="opp-face" style="--ec:'+choice.color+'">'+portrait(choice)+'</span><strong>'+choice.name+' · '+choice.label+'型指揮官</strong><small>'+choice.label+' · '+choice.note+'</small>';
 renderHand();updateUI();mode='ready';
 if(!testMode){$('watch').checked=false;$('mapChoice').value='random';speed=1;$('speed').textContent='1×';}
 launchBattle();toast('對手：'+choice.name+' · '+choice.label+'型');
}
function pickRival(){let i;do{i=Math.floor(Math.random()*commanders.length);}while(i===lastRival&&commanders.length>1);lastRival=i;return commanders[i];}
function findMatch(){
 if(mode==='matching'){cancelMatch();return;}if(mode==='paused'){resume();return;}if(mode==='playing')return;
 if(mode==='ended'&&typeof towerCtx!=='undefined'&&towerCtx){towerShowPanel();return;}
 if(mode==='ended')newLobby();
 if(typeof towerCtx!=='undefined'&&towerCtx){startTowerBattle();return;}
 const token=++matchToken;mode='matching';document.body.classList.add('match-search');$('modalTitle').textContent='正在尋找對戰';$('modalText').textContent='正在挑選指揮官與戰場…';$('modalHint').textContent='';$('start').textContent='取消尋找';
 const schedule=(fn,ms)=>matchTimers.push(setTimeout(()=>{if(token===matchToken)fn();},ms));
 const T=typeof towerCtx!=='undefined'?towerCtx:null;const choice=T?T.commander:testMode&&$('aiStyle').value!=='random'?commanders.find(c=>c.style===$('aiStyle').value):pickRival();spinReel(commanders.indexOf(choice));
 schedule(()=>{const chosen=testMode?$('enemyPreset').value:'random';const enemy=T?['爬塔',T.node.deckName,T.node.enemy]:chosen==='random'?presets[choice.decks?choice.decks[Math.floor(Math.random()*choice.decks.length)]:Math.floor(Math.random()*presets.length)]:presets[+chosen];
 battle=new Battle(deck,enemy[2],Date.now(),T?{aiStyles:['steady',choice.style],shuffle:true,heroes:[towerBattleHeroes(),T.node.enemyHeroes||[]],heroLimit:2}:{aiStyles:['steady',choice.style],shuffle:true,heroes:[[heroSlot],enemy[3]||[]],items:true});if(T)towerApplyMods(battle);battle.state='ready';battle.enemyName=choice.name;resetVisuals();lastHand='';lastLog='';selected=-1;
 renderHand();updateUI();
 },900);
 schedule(()=>{$('opponentCard').innerHTML='<span class="opp-face" style="--ec:'+choice.color+'">'+portrait(choice)+'</span><strong>'+choice.name+' · '+choice.label+'型指揮官</strong><small>'+choice.label+' · '+choice.note+'</small>';$('modalTitle').textContent='找到對手：'+choice.name;$('modalText').textContent=choice.label+'型指揮官 · '+choice.note;$('modalHint').textContent='';showEmblem(choice);},2150);
 schedule(()=>{document.body.classList.remove('match-search');hideEmblem();mode='ready';if(!testMode){$('watch').checked=false;$('mapChoice').value='random';speed=1;$('speed').textContent='1×';}launchBattle();},3500);
}
$('start').onclick=findMatch;
$('secretSeal').addEventListener('click',e=>{e.preventDefault();if(mode==='playing')pause();cancelMatch();$('testCode').value='';$('testError').textContent='';$('testAccess').showModal();$('testCode').focus();});
$('testForm').onsubmit=e=>{e.preventDefault();if($('testCode').value.normalize('NFKC').trim()!=='TEST'){$('testError').textContent='通行碼不正確';return;}testMode=true;document.body.classList.add('test-mode');$('testAccess').close();toast('測試模式已開啟');};
$('closeTest').onclick=()=>$('testAccess').close();
$('lockTest').onclick=()=>{testMode=false;document.body.classList.remove('test-mode');$('watch').checked=false;battle.auto[0]=false;speed=1;$('speed').textContent='1×';$('enemyPreset').value='random';$('mapChoice').value='random';$('aiStyle').value='random';toast('已回到遊戲模式');};
const aiLabel=document.createElement('label');aiLabel.className='debug-only label';aiLabel.htmlFor='aiStyle';aiLabel.textContent='AI 出牌風格';const aiSelect=document.createElement('select');aiSelect.id='aiStyle';aiSelect.className='debug-only';aiSelect.innerHTML='<option value="random">隨機風格</option>'+commanders.map(c=>'<option value="'+c.style+'">'+c.label+'</option>').join('');$('enemyPreset').after(aiLabel,aiSelect);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='matching')cancelMatch();});
deckMeta();
