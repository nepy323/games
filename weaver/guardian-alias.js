/* 王之護衛：沿用律靈合靈的圖集，但用獨立圖鍵以套金白色遮罩（见 presentation.js 的 ART_TINT） */
for(const k of ['earth','storm','aurora']){const s=globalThis.SixArt['fuse_'+k];if(s)globalThis.SixArt['guard_king_'+k]={...s};}
globalThis.SixScenes=globalThis.SixScenes||{};
/* 英靈投影、破滅法則的專屬卡圖 */
Object.assign(globalThis.SixScenes,{n_proj:{src:'assets/cards/proj.webp',col:0,row:0,cols:1,rows:1},n_calamity:{src:'assets/cards/calamity.webp',col:0,row:0,cols:1,rows:1}});
