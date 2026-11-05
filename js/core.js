"use strict";
/* Faithbound — core: utilities, game data, shared state */
const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
/* swap in a fresh geometry and free the old GPU buffers (replacing attributes alone leaks video memory) */
function freshGeo(m){if(m.geometry)m.geometry.dispose();m.geometry=new THREE.BufferGeometry();return m.geometry}
const smooth=(a,b,t)=>{t=clamp((t-a)/(b-a),0,1);return t*t*(3-2*t)};
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
let rng=mulberry32((Date.now()^0x5bd1e995)>>>0);
let hseed=1;
const hash=i=>{const s=Math.sin(i*12.9898+hseed*78.233)*43758.5453;return s-Math.floor(s)};
function makeNoise(seed){
  const r=mulberry32(seed);const P=new Uint16Array(512);const p=[];for(let i=0;i<256;i++)p.push(i);
  for(let i=255;i>0;i--){const j=Math.floor(r()*(i+1));const t=p[i];p[i]=p[j];p[j]=t}
  for(let i=0;i<512;i++)P[i]=p[i&255];
  const G=new Float32Array(256);for(let i=0;i<256;i++)G[i]=r();
  const fade=t=>t*t*(3-2*t),g=(x,y)=>G[P[(x&255)+P[y&255]]];
  function v(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;const a=g(xi,yi),b=g(xi+1,yi),c=g(xi,yi+1),d=g(xi+1,yi+1);const u=fade(xf),w=fade(yf);return a+(b-a)*u+(c-a)*w+(a-b-c+d)*u*w}
  return (x,y,oct)=>{let s=0,amp=1,f=1,n=0;for(let o=0;o<oct;o++){s+=v(x*f+o*17.3,y*f+o*9.1)*amp;n+=amp;amp*=.5;f*=2}return s/n};
}

/* ---------- game data ---------- */
/* larger maps with broader landforms, so towns sit in scale with their islands */
const SIZES={small:{W:80,H:60,tribes:5,sc:2.6},medium:{W:112,H:84,tribes:7,sc:3},large:{W:144,H:108,tribes:10,sc:3.4}};
const DX=[1,-1,0,0],DY=[0,0,1,-1];
const ERAS=[
  {name:'Stone Age',tech:0,cap:1,mil:1,emit:0,num:'I'},
  {name:'Bronze Age',tech:150,cap:1.3,mil:1.5,emit:0,num:'II'},
  {name:'Iron Age',tech:450,cap:1.6,mil:2,emit:0,num:'III'},
  {name:'Medieval',tech:1050,cap:2,mil:2.6,emit:0,num:'IV'},
  {name:'Age of Sail',tech:2000,cap:2.6,mil:3.4,emit:0,num:'V'},
  {name:'Industrial',tech:3500,cap:3.6,mil:5,emit:1,num:'VI'},
  {name:'Modern',tech:6000,cap:5,mil:7,emit:2,num:'VII'},
  {name:'Future',tech:9500,cap:6.5,mil:10,emit:.3,num:'VIII'}];
const SAIL=4,SHIPSPEED=[0,0,0,0,.8,1.2,1.8,2.8];
const WONDERS=[null,{era:1,name:'Great Ziggurat'},{era:2,name:'Bronze Colossus'},{era:3,name:'High Cathedral'},{era:4,name:'Harbour Lighthouse'},{era:5,name:'Iron Exhibition Hall'},{era:6,name:'Sky Needle'},{era:7,name:'Orbital Spire'}];
/* faith tenets: a faith picks two; their effects multiply */
const TENETS={
  harmony:{label:'Harmony',desc:'Fewer wars, gentle growth',grow:1.15,war:.4,peace:2.2,stab:1.15},
  conquest:{label:'Conquest',desc:'Stronger armies, quick to war',mil:1.35,exp:1.1,war:2.2,peace:.6},
  abundance:{label:'Abundance',desc:'Large families, fast spread over land',grow:1.35,exp:1.2},
  wisdom:{label:'Wisdom',desc:'Scholars honoured, faster progress',tech:1.5,war:.85},
  pilgrimage:{label:'Pilgrimage',desc:'Followers give far more belief',belief:1.8,spread:1.2},
  seafaring:{label:'Seafaring',desc:'Sacred voyages, more colonists and fleets',sea:1.9,exp:1.05},
  nature:{label:'Nature',desc:'Forests are holy, factories pollute less',emit:.45,peace:1.3,grow:1.05},
  zeal:{label:'Zeal',desc:'Missionaries everywhere, quick to anger',spread:2.4,war:1.3,belief:1.15}};
const MODKEYS=['grow','tech','mil','exp','war','peace','stab','belief','spread','sea','emit'];
const NOTENET=Object.fromEntries(MODKEYS.map(k=>[k,1]));
const GLYPHS={
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
  moon:'<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/>',
  flame:'<path d="M12 3c1 4 6 6 6 11a6 6 0 01-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-3-1-5 1-8z"/>',
  tree:'<path d="M12 21v-6M12 3l6 8h-3l4 5H5l4-5H6z"/>',
  wave:'<path d="M2 9c3-3 5-3 8 0s5 3 8 0 3-2 4-2M2 15c3-3 5-3 8 0s5 3 8 0 3-2 4-2"/>',
  star:'<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>',
  eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  peak:'<path d="M2 20l7-12 4 6 3-4 6 10z"/>',
  spiral:'<path d="M12 12a1.5 1.5 0 113 0 3 3 0 11-6 0 4.5 4.5 0 119 0 6 6 0 11-12 0"/>',
  hand:'<path d="M8 13V6a1.5 1.5 0 013 0v5M11 11V4.5a1.5 1.5 0 013 0V11M14 11V6a1.5 1.5 0 013 0v7c0 4-3 7-6.5 7S6 18 5 16l-2-4a1.5 1.5 0 012.6-1.4L8 13"/>'};
const glyph=(k,c)=>`<svg viewBox="0 0 24 24" fill="none" stroke="${c||'currentColor'}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLYPHS[k]||GLYPHS.star}</svg>`;

/* governments: each unlocks at an era and some fall out of use later (max) */
const GOVS={
  tribal:{name:'Tribal Council',era:0,max:1,desc:'Elders decide together around the fire.',grow:1.05,tech:.95,mil:.9,war:.7,peace:1.4},
  chiefdom:{name:'Chiefdom',era:0,max:2,desc:'One strong chief leads the raids.',mil:1.15,war:1.4,exp:1.1,stab:.9},
  kingdom:{name:'Kingdom',era:1,max:7,desc:'A crowned ruler and loyal nobles.',mil:1.1,stab:1.2,exp:1.05},
  theocracy:{name:'Theocracy',era:1,max:7,faith:true,desc:'Priests rule in the name of the faith.',belief:1.6,spread:1.8,tech:.85,war:1.2},
  republic:{name:'Republic',era:2,max:4,desc:'Citizens elect their magistrates.',tech:1.2,grow:1.05,stab:.9,war:.8},
  empire:{name:'Empire',era:2,max:6,desc:'One emperor over many peoples.',mil:1.25,exp:1.25,war:1.5,stab:.8},
  feudal:{name:'Feudal Realm',era:3,max:4,desc:'Lords hold land in return for loyalty and soldiers.',mil:1.15,stab:.85,tech:.9},
  merchant:{name:'Merchant Republic',era:4,max:5,desc:'Guilds and trading houses run the state.',tech:1.15,sea:1.8,grow:1.1,war:.7},
  constmon:{name:'Constitutional Monarchy',era:4,max:7,desc:'A crown with a parliament beside it.',stab:1.3,tech:1.1,sea:1.3},
  democracy:{name:'Democracy',era:5,max:7,desc:'Free elections and a free press.',tech:1.25,grow:1.1,war:.5,peace:2,stab:1.1},
  communism:{name:'Communist State',era:5,max:6,desc:'One party runs a planned economy.',tech:1.15,grow:.95,mil:1.2,emit:1.4,stab:.9,war:1.2},
  fascism:{name:'Fascist State',era:5,max:6,desc:'One leader, one party, and the army comes first.',mil:1.45,war:2.6,peace:.3,exp:1.2,stab:.6,grow:.95},
  technocracy:{name:'Technocracy',era:6,max:7,desc:'Engineers and data steer the nation.',tech:1.5,emit:.7,war:.7},
  federation:{name:'Global Federation',era:7,max:7,desc:'Many peoples share one council.',grow:1.2,tech:1.3,war:.3,peace:3,stab:1.3},
  directorate:{name:'Machine Directorate',era:7,max:7,desc:'An artificial mind runs the state.',tech:1.8,mil:1.3,stab:1.2,grow:.9}};
const govOptions=n=>Object.keys(GOVS).filter(k=>{const g=GOVS[k];return n.era>=g.era&&n.era<=g.max&&(!g.faith||n.faith>=0)});
const MOD_LABEL={grow:'Growth',tech:'Progress',mil:'Army',exp:'Expansion',war:'War-making',peace:'Peace-making',stab:'Stability',belief:'Belief',spread:'Faith spread',sea:'Seafaring',emit:'Pollution'};
function modList(o){return MODKEYS.filter(k=>o[k]!=null&&o[k]!==1).map(k=>{const p=Math.round((o[k]-1)*100);return{k,label:MOD_LABEL[k],pct:p,good:(k==='emit'||k==='war')?p<0:p>0}})}
const BIOMES=[
  {n:'Deep ocean',hab:0},{n:'Shallow sea',hab:0},{n:'Pack ice',hab:0},{n:'Beach',hab:.5},{n:'Grassland',hab:1},
  {n:'Forest',hab:.7},{n:'Jungle',hab:.45},{n:'Desert',hab:.15},{n:'Savanna',hab:.75},{n:'Tundra',hab:.25},
  {n:'Snowfield',hab:.03},{n:'Mountains',hab:.12},{n:'High peaks',hab:.02}];
/* natural ground colours (sRGB) */
const GROUND=[[38,70,92],[150,140,110],[226,236,242],[140,136,88],[76,98,48],[48,68,38],[56,80,46],[170,134,88],[150,134,82],[132,134,108],[236,240,244],[110,102,90],[140,134,124]];
const ROCK=[94,90,80],SNOW=[238,242,247],SAND=[184,160,116],SEABED=[150,138,108];
const NCOL=['#d9483b','#2f74d0','#e6a91f','#8a4fd0','#17a085','#e06aa0','#ec7a22','#36b0d0','#78a82c','#a85038','#5560cc','#c9b41a','#2e9e56','#b83d74'];
const FCOL=['#3f7fd1','#e6a91f','#d84a4a','#3faa66','#9a62e0','#ec8a32','#28aaaa','#c2b01d'];
const SYL=['ka','ri','on','ma','tel','su','dor','an','vi','eth','or','la','mun','za','bel','ish','no','ra','gul','the','ar','io','nem','sa','ve','ul','ko','mir','thas','en','wy','bran','hel','cor'];
const FAITH_NAMES=['The Ember Path','Children of the Tide','The Quiet Sky','Order of the Seed','The Iron Covenant','Way of the Lantern','The Long Dawn','Keepers of the Well','The Ninth Wind','Choir of Stones'];
const SPEEDS=[0,2,6,20];

/* ---------- looks (colour grades on one realistic renderer) ---------- */
/* looks: lighting plus a full-screen grade. post: sat, con(trast), lift/gain (shadow and highlight tint), vig(nette), tilt (tilt-shift blur),
   line (ink outlines), poster (toon light bands), paper (parchment atlas), bloom, grain */
const LOOKS={
  manor:{label:'Manor',desc:'Soft natural daylight, hazy distance, lived-in countryside',sat:.9,exposure:.92,sun:0xfff0d8,sunI:1.75,hemiI:.7,fog:1.05,lock:-1,
    skyTop:0x8fb2d4,skyHor:0xd3dee4,post:{sat:.8,con:1.05,lift:[.01,.012,.012],gain:[1,.99,.95],vig:.32,bloom:.1,grain:.016}},
  realistic:{label:'Realistic',desc:'Natural daylight, full day and night',sat:.95,exposure:.9,sun:0xfff1dd,sunI:2.3,hemiI:.7,fog:1.1,lock:-1,deep:0x123a52,shallow:0x3a8a92,
    skyTop:0x5d93cf,skyHor:0xcfe3ee,post:{sat:1.06,con:1.06,lift:[0,.005,.015],gain:[1.02,1,.98],vig:.3,bloom:.18,grain:.015}},
  golden:{label:'Golden Hour',desc:'Warm low sun, long shadows, glowing haze',sat:1.05,exposure:.95,sun:0xffc98a,sunI:2.6,hemiI:.75,fog:1.2,lock:.09,
    skyTop:0x6f86b8,skyHor:0xf3c79a,post:{sat:1.12,con:1.08,lift:[.03,.01,0],gain:[1.1,1,.85],vig:.45,bloom:.55,grain:.02}},
  overcast:{label:'Northern',desc:'Cold, muted, misty fjord light',sat:.78,exposure:.95,sun:0xe6eef7,sunI:1.6,hemiI:1.15,fog:1.6,lock:-1,
    skyTop:0x8a9db0,skyHor:0xd8dee3,post:{sat:.62,con:1.14,lift:[.02,.035,.06],gain:[.92,.98,1.05],vig:.5,bloom:.1,grain:.05}},
  miniature:{label:'Miniature',desc:'Tilt-shift model village, shallow focus',sat:1.22,exposure:.95,sun:0xfff6e8,sunI:2.6,hemiI:1,fog:.5,lock:.22,
    skyTop:0x67b3ea,skyHor:0xdff1f8,post:{sat:1.3,con:1.1,lift:[0,0,0],gain:[1.03,1.01,.97],vig:.25,tilt:1,bloom:.2,grain:0}},
  stillwater:{label:'Still Water',desc:'Pastel haze, soft light, a calm lilac sky',sat:1,exposure:.84,sun:0xfff0e6,sunI:1.8,hemiI:.9,fog:.75,lock:.2,flat:1,tint:[190,214,186,.16],deep:0x4f8fa6,shallow:0x9fd6cc,
    skyTop:0xc4c0e6,skyHor:0xf5e2d8,post:{sat:.92,con:1,lift:[.02,.015,.035],gain:[1.01,.98,1.02],vig:.14,bloom:.15,grain:0}},
  lantern:{label:'Lantern Dusk',desc:'A long blue hour, towns glowing amber',sat:.92,exposure:1.05,sun:0xffae6e,sunI:1.5,hemiI:1,fog:1.3,lock:.499,tint:[60,70,110,.18],deep:0x081830,shallow:0x1a4660,
    skyTop:0x1d2650,skyHor:0x8a6f8e,post:{sat:.95,con:1.04,lift:[0,.012,.045],gain:[1.05,.98,1],vig:.38,bloom:.65,grain:0}},
  clay:{label:'Clay Garden',desc:'Warm matte toy world, soft and bright',sat:1.25,exposure:.88,sun:0xfff2df,sunI:2,hemiI:1.05,fog:.75,lock:.2,tint:[240,214,170,.1],deep:0x3a88b4,shallow:0x86cfe4,
    skyTop:0x9fd3ea,skyHor:0xfff0dc,post:{sat:1.12,con:.96,lift:[.025,.02,.012],gain:[1.03,1,.95],vig:.16,bloom:.1,grain:0}},
  storybook:{label:'Storybook',desc:'Ink outlines and soft painted colour bands',sat:1.15,exposure:1.05,sun:0xfff4e0,sunI:2.3,hemiI:1.25,fog:.7,lock:.2,
    skyTop:0x8cc6ea,skyHor:0xf6ecd8,post:{sat:1.12,con:.96,lift:[.06,.05,.04],gain:[1,.99,.96],vig:.2,line:1,poster:5,bloom:.1,grain:.01}}};


/* ---------- tech tree ---------- */
/* each age has four discoveries and one key discovery that opens the next age */
const TECHCOST=[30,60,120,190,300,500,700,900];
const TECHS=[
  {id:'agriculture',name:'Agriculture',era:0,req:[],desc:'Planted fields feed more mouths.',grow:1.1},
  {id:'pottery',name:'Pottery',era:0,req:[],desc:'Grain can be stored for lean years.',grow:1.04,stab:1.05},
  {id:'husbandry',name:'Animal Husbandry',era:0,req:[],desc:'Herds and horses carry people further.',mil:1.05,exp:1.05},
  {id:'mysticism',name:'Mysticism',era:0,req:[],desc:'Shrines and spirits draw the faithful.',belief:1.15,spread:1.1},
  {id:'bronze',name:'Bronze Working',era:0,req:['agriculture','pottery'],key:1,desc:'Metal tools and weapons.',mil:1.05},
  {id:'writing',name:'Writing',era:1,req:['bronze'],desc:'Knowledge outlives the people who found it.',tech:1.1},
  {id:'masonry',name:'Masonry',era:1,req:['bronze'],desc:'Stone walls and great monuments.',stab:1.06},
  {id:'wheel',name:'The Wheel',era:1,req:['husbandry','bronze'],desc:'Carts and chariots.',exp:1.1},
  {id:'calendar',name:'Calendar',era:1,req:['mysticism','writing'],desc:'Feasts and harvests on time.',grow:1.05,belief:1.05},
  {id:'iron',name:'Iron Working',era:1,req:['writing','wheel'],key:2,desc:'Cheap, hard iron for every hand.',mil:1.1},
  {id:'philosophy',name:'Philosophy',era:2,req:['writing','iron'],desc:'Schools of thought and debate.',tech:1.1,peace:1.1},
  {id:'mathematics',name:'Mathematics',era:2,req:['writing','iron'],desc:'Numbers for builders and traders.',tech:1.05},
  {id:'roads',name:'Roads',era:2,req:['wheel','iron'],desc:'Paved roads bind the realm together.',exp:1.1,stab:1.05},
  {id:'sailing',name:'Sailing',era:2,req:['iron'],desc:'Ships that sail against the wind.',sea:1.3},
  {id:'feudalism',name:'Feudalism',era:2,req:['roads','mathematics'],key:3,desc:'Lords, vassals and castles.',mil:1.05,stab:1.05},
  {id:'theology',name:'Theology',era:3,req:['philosophy','feudalism'],desc:'Faith written down and taught.',spread:1.3,belief:1.1},
  {id:'guilds',name:'Guilds',era:3,req:['feudalism'],desc:'Craftsmen organise their trades.',grow:1.05,tech:1.05},
  {id:'astronomy',name:'Astronomy',era:3,req:['mathematics','feudalism'],desc:'The stars as a map.',tech:1.05,sea:1.1},
  {id:'printing',name:'Printing Press',era:3,req:['theology','guilds'],desc:'Books for everyone who can read.',tech:1.15},
  {id:'navigation',name:'Navigation',era:3,req:['astronomy','sailing'],key:4,desc:'Ocean crossings and new worlds.',sea:1.3},
  {id:'gunpowder',name:'Gunpowder',era:4,req:['navigation'],desc:'Muskets and cannon change war.',mil:1.2},
  {id:'banking',name:'Banking',era:4,req:['guilds','navigation'],desc:'Credit and trading companies.',grow:1.05,tech:1.05},
  {id:'science',name:'Scientific Method',era:4,req:['printing','navigation'],desc:'Test, measure, repeat.',tech:1.15},
  {id:'cartography',name:'Cartography',era:4,req:['navigation'],desc:'Charts of every coast.',sea:1.4,exp:1.05},
  {id:'steam',name:'Steam Power',era:4,req:['science','banking'],key:5,desc:'Engines that never tire.',grow:1.05},
  {id:'railroads',name:'Railroads',era:5,req:['steam'],desc:'Iron rails across the land.',exp:1.1,grow:1.05},
  {id:'electricity',name:'Electricity',era:5,req:['steam'],desc:'Light and power on demand.',tech:1.15},
  {id:'medicine',name:'Modern Medicine',era:5,req:['science','steam'],desc:'Vaccines and hospitals; epidemics weaken.',grow:1.1},
  {id:'massprod',name:'Mass Production',era:5,req:['railroads'],desc:'Factories turn out goods by the million.',grow:1.05,emit:1.2},
  {id:'computers',name:'Computers',era:5,req:['electricity','massprod'],key:6,desc:'Machines that calculate.',tech:1.1},
  {id:'aviation',name:'Aviation',era:6,req:['computers'],desc:'Aircraft shrink the world.',mil:1.15,exp:1.05},
  {id:'atomic',name:'Atomic Power',era:6,req:['electricity'],desc:'Splitting the atom: power plants, and a bomb that can end cities.',mil:1.1,tech:1.05},
  {id:'internet',name:'Internet',era:6,req:['computers'],desc:'Every library in every pocket.',tech:1.2},
  {id:'green',name:'Green Energy',era:6,req:['electricity','computers'],desc:'Sun and wind replace coal.',emit:.6},
  {id:'genetics',name:'Genetics',era:6,req:['medicine','computers'],desc:'Better crops and cures.',grow:1.1},
  {id:'fusion',name:'Fusion Power',era:6,req:['internet','green'],key:7,desc:'A star in a bottle.',tech:1.1},
  {id:'ai',name:'Thinking Machines',era:7,req:['fusion'],desc:'Minds of silicon.',tech:1.25},
  {id:'habitats',name:'Orbital Habitats',era:7,req:['fusion'],desc:'Cities above the sky.',grow:1.15},
  {id:'terraform',name:'Terraforming',era:7,req:['green','fusion'],desc:'Reshape climate on purpose.',emit:.5,grow:1.05},
  {id:'starships',name:'Starships',era:7,req:['ai','habitats'],desc:'The first ships to other stars.',mil:1.1}];
const TECH=Object.fromEntries(TECHS.map(t=>[t.id,t]));
/* pace: how long one age lasts in real time. Short paces only slow research; long ones also slow the clock,
   so a week-long age still has wars, rulers and storms at a watchable rate (at most 14,400 years per age). */
const PACES={quick:{label:'Quick',sec:100},standard:{label:'Standard',sec:600},long:{label:'Long',sec:1800},epic:{label:'Epic',sec:3600},custom:{label:'Custom',sec:0}};
const TIME_UNITS={minutes:60,hours:3600,days:86400,weeks:604800,months:2629800};
let annals=[],hist=[],snaps=[];
let worldOpts={pace:'standard',ageSec:600,customN:1,customUnit:'weeks',calendar:false,anchorReal:0,anchorYear:0,maxEra:7,land:.5,frag:1,mtn:1,rain:.5,rivers:1};
function ageSeconds(o){o=o||worldOpts;if(o.pace==='custom')return Math.max(60,(o.customN||1)*(TIME_UNITS[o.customUnit]||3600));return PACES[o.pace]?PACES[o.pace].sec:600}
function paceInfo(o){const T=ageSeconds(o),yearsPerAge=clamp(2*T,175,14400);return{T,yearsPerAge,techMult:yearsPerAge/175,yearRate:yearsPerAge/T}}
function fmtDuration(s){if(s<90)return Math.round(s)+' seconds';if(s<5400)return Math.round(s/60)+' minutes';if(s<172800)return Math.round(s/3600*10)/10+' hours';
  if(s<1209600)return Math.round(s/86400*10)/10+' days';if(s<5259600)return Math.round(s/604800*10)/10+' weeks';return Math.round(s/2629800*10)/10+' months'}
function paceSummary(o){const p=paceInfo(o);const per=p.yearRate>=1?`${Math.round(p.yearRate*10)/10} years per second`:`1 year every ${fmtDuration(1/p.yearRate)}`;
  return `${fmtDuration(p.T)} per age · ${per} · the whole history takes about ${fmtDuration(p.T*7)}`}
function techAvailable(n,t){const has=n.techs||[];if(has.includes(t.id))return false;if(t.era>n.era)return false;if(t.key&&t.key>worldOpts.maxEra)return false;return t.req.every(r=>has.includes(r))}
function techState(n,t){const has=n.techs||[];if(has.includes(t.id))return 'done';if(n.research===t.id)return 'current';if(techAvailable(n,t))return 'open';return 'locked'}

/* ---------- shared state ---------- */
let W=56,H=42,N=W*H,h,baseMoist,moistD,owner,biome,hab;
let nations=[],faiths=[],logs=[],ships=[],rockets=[],effects=[],milestones=new Set();
let year=0,belief=100,beliefRate=.8,climate={temp:.5,rain:.5},sea=.44,moistActive=0,terrainDirty=true,propsDirty=true;
let flags={warm:false,sail:false};
let weatherDim=0,flashT=0;
const account={online:false,user:null,signup:true,code:false,lastCloud:0,worlds:[]};
let sizeKey='medium',lookKey='manor',LK=LOOKS.manor,speedIdx=1,tool='inspect',selected=-1,inspectTile=-1,selectedFaith=-1,warFrom=-1,unlimited=false,playing=false;
const isMobile=matchMedia('(pointer:coarse)').matches;
let settings={quality:isMobile?'medium':'high',shadows:true,daynight:true,borders:true,labels:true,people:true,disasters:'normal',arch:'classic'};
try{const s=JSON.parse(localStorage.getItem('faithbound.settings')||'null');if(s)Object.assign(settings,s)}catch(e){}
function saveSettings(){try{localStorage.setItem('faithbound.settings',JSON.stringify(settings))}catch(e){}}

/* ---------- helpers ---------- */
const hexRgb=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
function genName(a,b){const k=a+Math.floor(rng()*(b-a+1));let s='';for(let i=0;i<k;i++)s+=SYL[(rng()*SYL.length)|0];return s[0].toUpperCase()+s.slice(1)}
/* people per unit of population grows with the age: a Stone Age tribe is thousands, a modern nation millions */
const POPMUL=[6,10,16,25,40,70,100,120];let worldPopMul=6;
const people=n=>Math.round(n.pop*POPMUL[n.era||0]).toLocaleString('en-US');
const fmtPop=(v,e)=>{v=Math.round(v*(e!=null?POPMUL[e]:worldPopMul));return v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e4?Math.round(v/1e3)+'k':v.toLocaleString('en-US')};
/* combined modifiers of a nation: its faith's tenets x its government */
function ten(n){const o=Object.assign({},NOTENET);const f=n.faith>=0?faiths[n.faith]:null;
  const parts=[];if(f)for(const t of (f.tenets||[f.tenet]))if(TENETS[t])parts.push(TENETS[t]);if(n.gov&&GOVS[n.gov])parts.push(GOVS[n.gov]);if(n.techs)for(const id of n.techs)if(TECH[id])parts.push(TECH[id]);
  if(n.ruler!=null&&typeof folk!=='undefined'&&folk[n.ruler])for(const t of folk[n.ruler].traits)if(TRAITS[t])parts.push(TRAITS[t]);
  if(n._resMod)parts.push(n._resMod);
  for(const p of parts)for(const k of MODKEYS)if(p[k]!=null)o[k]*=p[k];
  const tr=n.trade?n.trade.length:0;if(tr){o.grow*=1+.04*tr;o.tech*=1+.05*tr}return o}
const isWater=j=>biome[j]===0||biome[j]===1;
const wx=x=>x-W/2+.5, wz=y=>y-H/2+.5;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const LIN=new Float32Array(256);for(let i=0;i<256;i++)LIN[i]=Math.pow(i/255,2.2);
