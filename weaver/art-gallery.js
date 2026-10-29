/* 圖鑑：每個單位只呈現一張卡面，加上基本資料與說明。 */
const names={troop:'兵種',tactic:'戰術',building:'建築'},factions=SixData.factions,effects={portal:'傳送門／共鳴',bomb:'延遲轟擊',barrage:'多段轟擊',fire:'持續傷害',curse:'腐朽／抑制治療',root:'定身',slow:'減速',haste:'攻速強化',shield:'吸收護盾',frenzy:'攻速／自損',sacrifice:'獻祭強化',armor:'區域減傷',mine:'地面陷阱',heal:'持續治療',speed:'移速強化',power:'傷害強化',rush:'疾行／易傷',summon:'召喚',bolt:'單體解場'};
let serial=0;
const scene=c=>{const a=SixScenes[c.id];if(!a){const art=SixArt[c.id];if(!art)return '';const[x,y,w,h]=art.portrait,id='c'+serial++;return `<svg preserveAspectRatio="xMidYMid slice" viewBox="0 0 ${w} ${h}"><defs><clipPath id="${id}"><rect width="${w}" height="${h}"/></clipPath></defs><g clip-path="url(#${id})"><image href="${art.src}" x="${-x}" y="${-y}" width="${art.width}" height="${art.height}"/></g></svg>`;}const id='s'+serial++;return `<svg class="scene-art" preserveAspectRatio="xMidYMid slice" viewBox="0 0 100 100"><defs><clipPath id="${id}"><rect width="100" height="100"/></clipPath></defs><g clip-path="url(#${id})"><image preserveAspectRatio="none" href="${a.src}" x="${-a.col*100}" y="${-a.row*100}" width="${(a.cols||3)*100}" height="${(a.rows||4)*100}"/></g></svg>`;};
const icon=scene;
const entries=SixData.cards.filter(c=>SixScenes[c.id]||SixArt[c.id]);
factions.forEach((f,i)=>filter.insertAdjacentHTML('beforeend',`<option value="${i}">${f[0]}</option>`));
function render(){grid.innerHTML=entries.filter(c=>filter.value==='all'||c.faction===+filter.value).map(c=>`<article><div class="gcard">${cardFace(c)}</div><div class="ginfo"><small>${factions[c.faction][0]} · ${c.race||'—'} · ${c.category||'—'} · ${c.element||'物理'}</small><p>${c.rules||c.desc||''}</p></div></article>`).join('');}
filter.onchange=render;render();
