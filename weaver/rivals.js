/* 多人模式的 AI 織律者：名稱、頭像、出牌風格、偏好牌組（decks = presets 索引）。圖鑑與配對共用。 */
const RIVALS=[
 {name:'赤隼',faction:1,art:'f1_5',glyph:'隼',color:'#c4573a',style:'aggressive',label:'激進',note:'快速出兵，從橋頭施壓',decks:[9,7],trait:"血誓出身，從不等人。一開局就把便宜的兵連續送上橋頭，用壓力逼你先交資源。",counter:"開局別把好牌丟出去換血，先用前排擋住第一波，再反打他空掉的場面。"},
 {name:'灰岩',faction:3,art:'f3_4',glyph:'岩',color:'#8b8f7a',style:'steady',label:'沉穩',note:'保留資源，前排與遠程協同',decks:[11,4],trait:"玄鐵盟約的工匠，前排扛、後排射，兵種搭配得很整齊。",counter:"他不會先動手。你若太晚出牌，他的遠程會在前排掩護下一路壓過橋。優先清掉後排。"},
 {name:'霜鴉',faction:2,art:'f2_7',glyph:'鴉',color:'#5a8fb0',style:'conservative',label:'保守',note:'蓄積資源，優先防守反擊',decks:[10,3],trait:"永寂王庭的守夜人，資源會存到很高才出手，專門打防守反擊。",counter:"別在他資源滿的時候衝橋。等他出完牌、資源見底再推。"},
 {name:'銀環',faction:0,art:'sd_0',glyph:'環',color:'#dab66e',style:'steady',label:'沉穩',note:'陣線整齊，穩穩推進',decks:[8,0],trait:"燼冠帝國的老兵，陣線整齊，出牌穩定，很少出錯。",counter:"沒有明顯弱點，靠你的節奏取勝。抓他換牌或資源空檔時下重手。"},
 {name:'鐵律',faction:0,art:'sd_1',glyph:'律',color:'#e0c27a',style:'steady',label:'沉穩',note:'照著章程出牌，很少失誤',decks:[0,8],trait:"嚴守章程的軍官，永遠先放前排再補輸出，連順序都固定。",counter:"出牌順序可預測。針對他的前排備好反大型或穿透的牌。"},
 {name:'紅渠',faction:1,art:'sd_2',glyph:'渠',color:'#df786c',style:'aggressive',label:'激進',note:'血誓出身，賭上一切搶攻',decks:[9,1],trait:"血誓戰團的狂熱者，資源一夠就往前線扔，沒有後路。",counter:"他的牌組脆。守住第一波後，用範圍傷害收割他擠在一起的兵。"},
 {name:'沉燈',faction:2,art:'sd_4',glyph:'燈',color:'#b5a1de',style:'conservative',label:'保守',note:'慢慢鋪場，等你先出錯',decks:[10,6],trait:"永寂王庭的書吏，慢慢鋪滿場面，等你自己犯錯。",counter:"不要急。他會用召喚與建築拖時間，優先拆建築，別被消耗戰拖垮。"},
 {name:'啞鐘',faction:2,art:'sd_5',glyph:'鐘',color:'#a090cc',style:'steady',label:'沉穩',note:'亡者人海，一波接一波',decks:[10,3],trait:"亡者人海，一波接一波，數量多但單隻很弱。",counter:"範圍傷害與分裂攻擊剋制他。別用單體高傷的牌去對付人海。"},
 {name:'玄鈴',faction:3,art:'sd_6',glyph:'鈴',color:'#88b7c4',style:'conservative',label:'保守',note:'堡壘與符文，守得很穩',decks:[11,5],trait:"玄鐵盟約的守備官，堡壘和符文護甲讓他的陣線很難攻破。",counter:"攻城與遠程是破口。靠長線消耗，不要硬撞他的前排。"},
 {name:'鉚星',faction:3,art:'sd_7',glyph:'星',color:'#7fb0bd',style:'steady',label:'沉穩',note:'攻城機具慢慢壓上來',decks:[11,4],trait:"玄鐵的攻城師，慢，但每一發都很重。",counter:"他的機具移動慢，靠快速單位繞開正面，直接壓他的外塔。"},
 {name:'落葉',faction:4,art:'sd_8',glyph:'葉',color:'#96c39b',style:'conservative',label:'保守',note:'藤蔓與控場，拖慢你的節奏',decks:[12],trait:"蒼林議會的隱者，藤蔓與控場，讓你的單位動不起來。",counter:"別讓單位卡在他的減速範圍裡，先拆控場單位，或用快兵繞過去。"},
 {name:'青棘',faction:4,art:'sd_9',glyph:'棘',color:'#7fb386',style:'steady',label:'沉穩',note:'林地守軍，進退有序',decks:[12,5],trait:"蒼林的巡林人，進退有序，會在你推進時側翼夾擊。",counter:"別讓兵線拉太長。守住兩路，避免被側翼包夾。"},
 {name:'裂風',faction:5,art:'sd_10',glyph:'風',color:'#d5a26d',style:'aggressive',label:'激進',note:'獸群衝鋒，不給你喘息',decks:[13,1],trait:"裂牙部族的獵手，獸群衝鋒，兩路齊發。",counter:"他的兵跑得快但耐打度低。用高生命前排扛住衝鋒，再反擊。"},
 {name:'斷牙',faction:5,art:'sd_11',glyph:'牙',color:'#c98d57',style:'aggressive',label:'激進',note:'兩路同時突擊',decks:[13,2],trait:"裂牙的先鋒，專挑你資源不足的瞬間同時突擊兩條路。",counter:"留 3 點資源當預備，別把能量花光；兩路都要有人守。"},
 {name:'環行者',faction:6,art:'n_hero',glyph:'環',color:'#8e6fd0',style:'aggressive',label:'激進',note:'律靈流，持著資源出手',hidden:true,mods:{hp:.75,dmg:.75},deck:['n_rock','n_wind','n_dew','n_fire','n_frost','n_light','n_rot','n_dark'],hero:'n_hero',trait:'只有他能讓蝕與闇合體。手上資源越多，全軍越痛，打到一定次數還會隨手丟出一隻合靈。',counter:'別讓他囤資源。壓著他打，逼他出牌；合靈只存在 12 秒，躲過去就好。'}];
/* 對手的牌組（預設牌組索引或自訂牌組） */
function rivalPreset(r){return r.deck?[r.name,'',r.deck,[r.hero]]:presets[r.decks[Math.floor(Math.random()*r.decks.length)]];}
