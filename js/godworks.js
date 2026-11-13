"use strict";
/* Faithbound — more works of a god: new powers for land, sky, people, faith, rule and strife,
   plus quests, the favour and anger of nations, a rival god, turning back time and a chronicle of the world. */

/* ---------- framework ----------
   Each new power is a card in the dock and a handler. Powers that need two taps remember the first one in GW_PICK.
   Lasting effects live in GODW, which is saved with the world. */
const GODW={sinking:[],peaks:[],cold:[],bridges:[],routes:[],bandits:[],monsters:[],marriages:[],burning:[],rival:null,quests:{},chron:[],favourY:0};
const GW={},GW_FX=[];let GW_PICK=null;
function gp(def,fn){POWERS.push(def);GW[def.id]=fn}
const capOf=n=>n&&n.cities[0];
const tileOf=c=>c.y*W+c.x;
const cityNear=(i,r)=>{const x=i%W,y=(i/W)|0;let best=null,bd=r==null?1.6:r;for(const n of nations){if(!n.alive)continue;for(const c of n.cities){const d=Math.hypot(c.x-x,c.y-y);if(d<=bd){bd=d;best={n,c}}}}return best};
const nationsNear=(i,r)=>{const x=i%W,y=(i/W)|0;return nations.filter(n=>n.alive&&n.cities.some(c=>Math.hypot(c.x-x,c.y-y)<=r))};
const townBySea=(c,r)=>{for(let y=Math.max(0,c.y-r);y<=Math.min(H-1,c.y+r);y++)for(let x=Math.max(0,c.x-r);x<=Math.min(W-1,c.x+r);x++)if(isWater(y*W+x)&&!river[y*W+x])return true;return false};
const pickTwo=(id,i,first,second,msg1)=>{if(!GW_PICK||GW_PICK.tool!==id){GW_PICK={tool:id,i,...first};say(msg1,true);return null}const p=GW_PICK;GW_PICK=null;return p};
const gwOnlyHost=()=>{if(typeof coop!=='undefined'&&coop&&typeof coopGuest==='function'&&coopGuest()){say('In co-op only the host can use this power.');return true}return false};
Object.assign(ICON,{
  river:'<path d="M6 3c4 3-2 6 2 9s-3 6 1 9M14 3c4 3-2 6 2 9s-3 6 1 9"/>',
  part:'<path d="M3 8c3-2 5 2 8 0M13 8c3-2 5 2 8 0M3 14c3-2 5 2 8 0M13 14c3-2 5 2 8 0M12 4v17"/>',
  island:'<path d="M3 17c3-2 6 2 9 0s6 2 9 0M7 15c1-4 3-6 5-6s4 2 5 6M12 9V5l3 1"/>',
  sink:'<path d="M3 10c3-2 6 2 9 0s6 2 9 0M8 21v-7h8v7M10 14v-3h4v3"/>',
  peak:'<path d="M2 20l7-12 4 6 3-4 6 10zM15 7l1-3 1 3"/>',
  snow:'<path d="M12 2v20M3 7l18 10M21 7L3 17M9 4l3 3 3-3M9 20l3-3 3 3"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
  gem:'<path d="M6 3h12l3 6-9 12L3 9zM3 9h18M9 3l3 6 3-6M12 9v12"/>',
  rainbow:'<path d="M3 18a9 9 0 0118 0M6 18a6 6 0 0112 0M9 18a3 3 0 016 0"/>',
  aurora:'<path d="M3 6c3 6 6-4 9 2s6-4 9 2M3 12c3 4 6-3 9 1s6-3 9 1"/><path d="M5 20h14"/>',
  hail:'<path d="M6 14a4 4 0 010-8 6 6 0 0111 2 3 3 0 011 6z"/><circle cx="8" cy="18" r="1"/><circle cx="12" cy="20" r="1"/><circle cx="16" cy="18" r="1"/>',
  fog:'<path d="M3 9h14M6 13h15M3 17h12"/>',
  comet:'<circle cx="17" cy="7" r="3"/><path d="M15 9L3 21M14 6L5 15M18 10L9 19"/>',
  moon:'<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/>',
  shower:'<path d="M4 4l5 5M10 3l4 4M15 2l3 3M8 13l-2 6M13 12l-2 7M18 11l-2 7"/>',
  dream:'<path d="M4 15a6 6 0 0010 2 7 7 0 01-6-11 6 6 0 00-4 9zM15 5h4l-4 4h4M17 12h3l-3 3h3"/>',
  bulb:'<path d="M9 18h6M10 21h4M12 3a6 6 0 00-3 11v2h6v-2a6 6 0 00-3-11z"/>',
  baby:'<circle cx="12" cy="7" r="3"/><path d="M7 21v-6a5 5 0 0110 0v6M9 13l-3 2M15 13l3 2"/>',
  exodus:'<path d="M3 20l6-6 4 3 8-9M15 8h6v6"/>',
  star:GLYPHS.star,
  hourglass:'<path d="M6 3h12M6 21h12M7 3c0 6 10 6 10 9s-10 3-10 9M17 3c0 6-10 6-10 9"/>',
  twins:'<circle cx="8" cy="7" r="2.5"/><circle cx="16" cy="7" r="2.5"/><path d="M4 20v-4a4 4 0 018 0v4M12 20v-4a4 4 0 018 0v4"/>',
  relic:'<path d="M8 21h8M10 21v-4h4v4M7 17h10l-1-8H8zM12 9V5M10 5h4"/>',
  path:'<path d="M5 21c2-6 12-4 14-10M8 3h.01M12 6h.01M16 9h.01"/><circle cx="5" cy="21" r="1.5"/><circle cx="19" cy="11" r="1.5"/>',
  oracle:'<circle cx="12" cy="10" r="6"/><path d="M8 20h8M10 16l-1 4M14 16l1 4M10 9a2 2 0 014 0"/>',
  merge:'<path d="M6 3v6a6 6 0 006 6 6 6 0 006-6V3M12 15v6"/>',
  crown:'<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/>',
  scissors:'<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.5 8L20 18M8.5 16L20 6"/>',
  chain:'<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
  dagger:'<path d="M14 3l7 7-9 9-3-3 9-9M5 19l-2 2M7 14l3 3"/>',
  map:'<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15"/>',
  flag:'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  ring:'<circle cx="9" cy="14" r="5"/><circle cx="15" cy="14" r="5"/><path d="M10 6l2-3 2 3"/>',
  rat:'<path d="M3 16c2-5 7-7 11-5 3 1 5 3 7 3M14 11c0-3 2-5 4-4M9 18l-1 3M14 18l1 3M20 14c1 0 1 1 1 1"/>',
  dragon:'<path d="M3 13c4-1 6-6 9-6 4 0 3 5 7 5l2-2M12 7l-2-4 4 2M7 12l-3 6 5-3M15 12l3 6-5-3"/>',
  wolf:'<path d="M4 20l2-9-3-5 5 2 4-4 4 4 5-2-3 5 2 9M9 13h.01M15 13h.01M10 17h4"/>',
  fireCity:'<path d="M4 21V11h4v10M10 21V7h4v14M16 21v-8h4v8M12 5c-1-2 1-3 0-4"/>',
  civil:'<path d="M4 20L20 4M4 4l16 16M2 12h4M18 12h4"/>',
  tent2:'<path d="M3 20L12 4l9 16zM12 20v-6"/>',
  mutiny:'<path d="M12 3v18M8 7l4-4 4 4M6 13h12M7 17h10"/>',
  council:'<circle cx="12" cy="12" r="3"/><circle cx="5" cy="7" r="2"/><circle cx="19" cy="7" r="2"/><circle cx="5" cy="17" r="2"/><circle cx="19" cy="17" r="2"/>',
  quest:'<path d="M5 21V4h10l-1 3 1 3H5M15 14l2 2 4-4"/>',
  shadow:'<circle cx="12" cy="9" r="5"/><path d="M4 21c1-5 4-7 8-7s7 2 8 7M10 8h.01M14 8h.01"/>',
  book:'<path d="M4 4h6a2 2 0 012 2v14a2 2 0 00-2-2H4zM20 4h-6a2 2 0 00-2 2v14a2 2 0 012-2h6z"/>'});
/* the new powers run before the old switch; guests in co-op send them to the host as usual */
{const _at=applyTool;applyTool=function(i,start){const g=GW[tool];
  if(!g||(typeof viewOnly!=='undefined'&&viewOnly)||(typeof rewind!=='undefined'&&rewind)||i<0||(typeof coopGuest==='function'&&coopGuest()&&!COOP_LOCAL.has(tool)))return _at.apply(this,arguments);
  if(!start)return;const o=owner[i],n=o>=0?nations[o]:null;spendMul=n?devCost(n):1;sfx('power');try{g(i,n)}catch(e){console.warn('power',tool,e)}}}
{const _st=setTool;setTool=function(id){if(GW_PICK&&GW_PICK.tool!==id)GW_PICK=null;return _st.apply(this,arguments)}}
/* saving: the lasting effects go into the save, without meshes */
{const _bs=buildSave;buildSave=function(){const d=_bs.apply(this,arguments);d.godw=JSON.parse(JSON.stringify(GODW,(k,v)=>k==='g'||k==='snap'?undefined:v));return d}}
{const _as=applySave;applySave=function(d){for(const m of GODW.monsters)if(m.g)disposeGroup(m.g);const r=_as.apply(this,arguments);const g=d&&d.godw||{};
  for(const k of Object.keys(GODW))GODW[k]=g[k]!=null?g[k]:Array.isArray(GODW[k])?[]:k==='quests'?{}:k==='favourY'?0:null;GW_PICK=null;return r}}
/* drawn things that come and go each frame: shrines, cairns, camps, a monster's body */
kit('gwBox',unitBox(),MAT.plain,1600,true);kit('gwCone',unitCone(8),MAT.plain,600,true);kit('gwCyl',unitCyl(10),MAT.plain,600,true);
const GW_KITS=['gwBox','gwCone','gwCyl'];
PK.fog={life:9,size:1.1,grow:.5,vy:.006,col:[.86,.88,.9],a:.4};

/* ======================= LAND AND SEA ======================= */
/* carve a river: tap where it rises, then where it should run to */
gp({id:'carve',tab:'Land',label:'Carve a river',cost:35,icon:'river',hint:'Tap where a river should rise, then where it should run. Fields and towns follow fresh water.'},(i,n)=>{
  if(isWater(i)){say('Start on land.');return}
  const p=pickTwo('carve',i,{},null,'Now tap where the river should run to.');if(!p)return;if(!spend(35))return;
  let x0=p.i%W,y0=(p.i/W)|0;const x1=i%W,y1=(i/W)|0,tiles=[];const steps=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));
  for(let s=0;s<=steps;s++){const t=steps?s/steps:0,wob=Math.sin(s*.7+x0)*.9,X=Math.round(lerp(x0,x1,t)+(steps>4?wob*Math.abs(y1-y0)/steps:0)),Y=Math.round(lerp(y0,y1,t)+(steps>4?wob*Math.abs(x1-x0)/steps:0));
    if(X<0||Y<0||X>=W||Y>=H)continue;const k=Y*W+X;if(tiles[tiles.length-1]===k)continue;if(isWater(k)){tiles.push(k);break}tiles.push(k)}
  if(tiles.length<3){say('Make the river a little longer.');if(!unlimited)belief+=costOf(35);return}
  for(const k of tiles){river[k]=Math.max(river[k],2);h[k]=Math.max(sea+.004,h[k]-.012);moistD[k]=clamp(moistD[k]+.2,-.6,.6)}
  rivers.push({tiles});terrainDirty=true;propsDirty=true;moistActive=200;if(typeof roadSig!=='undefined')roadSig='';fx(i,'rain');
  log('At your word a new river sprang from the hills and ran to the sea.','life');milestone('carve','A new river','You carved a river into the land.')});

/* part the sea: a land bridge opens for a generation, then the sea closes again */
gp({id:'part',tab:'Land',label:'Part the sea',cost:60,icon:'part',hint:'Tap a strait between two coasts. The sea parts and a land bridge opens for about thirty years.'},(i,n)=>{
  if(!isWater(i)){say('Tap the sea between two coasts.');return}const x=i%W,y=(i/W)|0;let best=null;
  for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]]){let a=null,b=null;for(let k=1;k<16&&!a;k++){const X=x+dx*k,Y=y+dy*k;if(X<0||Y<0||X>=W||Y>=H)break;if(!isWater(Y*W+X))a=k}
    for(let k=1;k<16&&!b;k++){const X=x-dx*k,Y=y-dy*k;if(X<0||Y<0||X>=W||Y>=H)break;if(!isWater(Y*W+X))b=k}if(a&&b&&(!best||a+b<best.l))best={dx,dy,a,b,l:a+b}}
  if(!best){say('There is no other shore close enough. Tap a narrower strait.');return}if(!spend(60))return;const keep=[];
  for(let k=-best.b+1;k<best.a;k++)for(const w of [0,1]){const X=x+best.dx*k+(best.dy?w:0),Y=y+best.dy*k+(best.dy?0:w);if(X<0||Y<0||X>=W||Y>=H)continue;const j=Y*W+X;if(!isWater(j))continue;keep.push([j,h[j]]);h[j]=sea+.014}
  GODW.bridges.push({until:year+30,tiles:keep});terrainDirty=true;fx(i,'bless');burst(i,'dust',20,3);shakeT=.4;
  log('You parted the sea. A path of dry land now runs between the shores.','sky');milestone('part','The sea parted','A land bridge opened at your word.')});

/* an island rises from the deep */
gp({id:'island',tab:'Land',label:'Island from the deep',cost:50,icon:'island',hint:'Tap open sea. A volcanic island rises from the waves; in time tribes may settle it.'},(i,n)=>{
  if(!isWater(i)){say('Tap open sea.');return}if(!spend(50))return;const r=2.6+rng()*1.4;
  brush(i,r,(j,d)=>{const f=1-d/(r+.5);h[j]=Math.max(h[j],sea+.02+f*f*(.09+hash(j)*.05))});terrainDirty=true;shakeT=.6;fx(i,'meteor');burst(i,'dark',30,2);burst(i,'fire',14,1);
  log('The sea boiled and an island rose, steaming, from the deep.','sky');milestone('island','A new island','You raised an island from the sea.')});

/* a land sinks beneath the waves and becomes a legend */
gp({id:'atlantis',tab:'Land',label:'Sink a land',cost:80,icon:'sink',hint:'Tap a coastal town. Over the years its land sinks beneath the waves, and its name becomes a legend.'},(i,n)=>{
  const hit=cityNear(i,2);if(!hit){say('Tap a town.');return}if(!townBySea(hit.c,3)){say('Pick a town by the sea.');return}if(!spend(80))return;
  GODW.sinking.push({x:hit.c.x,y:hit.c.y,name:hit.c.name,nid:hit.n.id,r:2.6});shakeT=.5;fx(i,'quake');
  log(`The ground beneath ${hit.c.name} groans. The sea creeps closer every year.`,'doom')});
function sinkTick(){for(let q=GODW.sinking.length-1;q>=0;q--){const s=GODW.sinking[q],c0=s.y*W+s.x;
    brush(c0,s.r,(j,d)=>{h[j]=Math.max(sea-.06,h[j]-.006*(1-d/(s.r+.6)))});terrainDirty=true;
    if(h[c0]<sea-.004){GODW.sinking.splice(q,1);for(const n of nations)if(n.alive){const k=n.cities.findIndex(c=>c.x===s.x&&c.y===s.y);if(k>=0){n.cities.splice(k,1);n.pop*=.9;if(!n.cities.length){for(let j=0;j<N;j++)if(owner[j]===n.id)owner[j]=-1;fall(n);bordersDirty=true}}}
      ruins.push({x:s.x,y:s.y,year,name:s.name,sunk:true});propsDirty=true;log(`${s.name} sank beneath the waves. Sailors still say they hear its bells on calm nights.`,'doom');milestone('atlantis','A drowned city','A city sank and became a legend.')}}}

/* a sacred mountain draws pilgrims and deepens the faith of the lands around it */
gp({id:'sacredpeak',tab:'Faith',label:'Sacred mountain',cost:40,icon:'peak',hint:'Tap a mountain. It becomes holy: pilgrims climb it and the nations around it grow devout.'},(i,n)=>{
  if(h[i]-sea<.16){say('Tap a mountain or high hill.');return}if(GODW.peaks.some(p=>Math.hypot(p.i%W-i%W,((p.i/W)|0)-((i/W)|0))<4)){say('There is already a sacred mountain here.');return}if(!spend(40))return;
  const nb=nationsNear(i,12),f=selectedFaith>=0?selectedFaith:(nb.find(m=>m.faith>=0)||{faith:-1}).faith;GODW.peaks.push({i,faith:f,name:['Mount '+genName(2,2),'The Holy Peak','The White Mountain','The Throne of Clouds'][(rng()*4)|0]});
  fx(i,'faith');log(`${GODW.peaks[GODW.peaks.length-1].name} became a sacred mountain. Pilgrims begin the long climb.`,'faith')});
function peakTick(){for(const p of GODW.peaks){for(const n of nationsNear(p.i,14)){n.devotion=clamp((n.devotion??.3)+.003,0,1);if(p.faith>=0&&faiths[p.faith]&&n.faith<0&&rng()<.01){n.faith=p.faith;propsDirty=true;log(`Pilgrims to ${p.name} brought ${faiths[p.faith].name} home to ${n.name}.`,'faith')}}}}

/* an ice age over a region, and a thaw that ends it */
gp({id:'iceage',tab:'Sky',label:'Ice age',cost:50,icon:'snow',hint:'Tap a region. Snow and ice hold it for about forty years: harvests fail and harbours freeze.'},(i,n)=>{
  if(!spend(50))return;GODW.cold.push({x:i%W,y:(i/W)|0,r:10,until:year+40});fx(i,'drought');log(`A great cold settled over the lands${n?' of '+n.name:''}. The snow does not melt in spring.`,'sky')});
gp({id:'thaw',tab:'Sky',label:'Thaw',cost:25,icon:'sun',hint:'Tap a frozen region. The ice melts and the rivers run again.'},(i,n)=>{
  const x=i%W,y=(i/W)|0,before=GODW.cold.length;GODW.cold=GODW.cold.filter(c=>Math.hypot(c.x-x,c.y-y)>c.r);if(!spend(25))return;
  if(typeof WXG!=='undefined'&&WXG.snow)brush(i,9,(j,d)=>{WXG.snow[j]=0;WXG.wet[j]=Math.max(WXG.wet[j],.7)});WXG.dirty=true;fx(i,'rain');
  log(before>GODW.cold.length?'You breathed warmth over the frozen land. The ice cracks and the rivers run again.':'You warmed the land. The snow melts away.','sky')});
function coldAt(x,y){for(const c of GODW.cold){const d=Math.hypot(c.x-x,c.y-y);if(d<c.r)return 1-d/c.r}return 0}
function coldTick(){GODW.cold=GODW.cold.filter(c=>{if(year>=c.until){log('The long cold has ended. The land wakes up.','life');return false}return true});
  for(const n of nations){if(!n.alive||!n.cities.length)continue;const f=coldAt(n.cities[0].x,n.cities[0].y);if(f>.2){n.pop*=1-.004*f;if(!n.famine&&rng()<.03*f)startFamine(n,'cold',false)}}}
function coldFrame(){if(!GODW.cold.length||typeof WXG==='undefined'||!WXG.snow)return;for(const c of GODW.cold)brush(c.y*W+c.x,c.r,(j,d)=>{const f=1-d/(c.r+.5);if(!isWater(j))WXG.snow[j]=Math.max(WXG.snow[j],Math.min(1,f*1.6))});WXG.dirty=true}

/* a golden vein: gold that nations will covet and fight over */
gp({id:'gold',tab:'Land',label:'Golden vein',cost:30,icon:'gem',hint:'Tap land. Gold glitters in the rock. Whoever owns it grows rich, and others will want it.'},(i,n)=>{
  if(isWater(i)){say('Tap land.');return}if(!spend(30))return;deposits.push({i,k:'gold'});fx(i,'bless');burst(i,'holy',12,1);propsDirty=true;
  log(`Gold was found${n?' in the hills of '+n.name:' in the wild hills'}. Word spreads fast.`,'life')});

/* ======================= SKY ======================= */
/* sky sights drawn over the scene: rainbows, auroras, comets, a blood moon, the god's own light */
function gwSight(kind,i,dur,extra){GW_FX.push(Object.assign({kind,x:wx(i%W),z:wz((i/W)|0),t0:performance.now(),dur:dur*1000},extra||{}))}
gp({id:'rainbow',tab:'Sky',label:'Rainbow',cost:15,icon:'rainbow',hint:'Tap a land. A rainbow stands over it: a sign of grace and a good harvest.'},(i,n)=>{
  if(!spend(15))return;gwSight('rainbow',i,16);for(const m of nationsNear(i,9)){m.rainbow=year+1;m.happy=clamp((m.happy??.6)+.04,0,1);m.devotion=clamp((m.devotion??.3)+.03,0,1)}
  log(`A rainbow stood over ${n?n.name:'the land'}. People take it as a sign of good things to come.`,'life')});
gp({id:'aurora',tab:'Sky',label:'Aurora',cost:20,icon:'aurora',hint:'Lights dance across the night sky. Scholars and priests alike are inspired.'},(i,n)=>{
  if(!spend(20))return;gwSight('aurora',i,30);for(const m of nationsNear(i,22)){m.inspire=Math.max(m.inspire||0,10);m.devotion=clamp((m.devotion??.3)+.05,0,1)}
  log('Curtains of green and violet light danced across the sky. Astronomers wrote all night; priests spoke of the gods.','sky')});
gp({id:'hail',tab:'Sky',label:'Hailstorm',cost:15,icon:'hail',hint:'Tap a nation. Hail smashes its crops, and nothing else.'},(i,n)=>{
  if(!needNation(n)||!spend(15))return;const c=capOf(n);storms.push({kind:'shower',x:wx(c.x),z:wz(c.y),seed:rng()*1000,t:0,life:14,r:3.2,vx:.05,vz:.03,bolt:1e9,landfall:false,snow:true});
  n.hail=year+1;log(`Hailstones as big as eggs fell on the fields of ${n.name}.`,'sky')});
gp({id:'seafog',tab:'Sky',label:'Sea fog',cost:20,icon:'fog',hint:'Tap the sea. A thick fog rolls in: ships lose their way and invasions by sea fail.'},(i,n)=>{
  if(!isWater(i)){say('Tap the sea.');return}if(!spend(20))return;GODW.fog=GODW.fog||[];GODW.fog.push({x:wx(i%W),z:wz((i/W)|0),r:6,until:year+4,t:performance.now()+60000});log('A grey fog rolled in from the sea. No ship can find its way.','sky')});
const inFog=(x,z)=>(GODW.fog||[]).some(f=>Math.hypot(f.x-x,f.z-z)<f.r);
gp({id:'comet',tab:'Sky',label:'Comet',cost:30,icon:'comet',hint:'A comet hangs in the sky for weeks. Every nation reads it its own way: as doom, as a call to war, or as a sign from you.'},(i,n)=>{
  if(!spend(30))return;gwSight('comet',i,45);const fear=[],war=[],faith=[];
  for(const m of nations){if(!m.alive)continue;const r=rng();
    if(r<.35){m.stab=Math.max(0,stabOf(m)-.08);fear.push(m.name)}
    else if(r<.6&&m.aggr>.5&&warRoom()){const nb=[...m.nb].map(k=>nations[k]).filter(o=>o&&o.alive&&!m.wars.has(o.id)&&!allied(m,o));if(nb.length){const B=nb[(rng()*nb.length)|0];startWar(m,B,null);war.push(`${m.name} attacked ${B.name}`)}}
    else{m.devotion=clamp((m.devotion??.3)+.1,0,1);if(m.faith<0&&selectedFaith>=0&&rng()<.3){m.faith=selectedFaith;propsDirty=true}faith.push(m.name)}}
  log(`A comet blazed across the sky.${fear.length?` Fear in ${fear.slice(0,3).join(', ')}${fear.length>3?' and more':''}.`:''}${war.length?' Taking it as a sign, '+war.slice(0,2).join(' and ')+'.':''}${faith.length?` ${faith.length===1?faith[0]+' prays':faith.length+' nations pray'} to you.`:''}`,'sky');milestone('comet','A comet','A comet hung in the sky.')});
gp({id:'bloodmoon',tab:'Sky',label:'Blood moon',cost:25,icon:'moon',hint:'A red moon rises. The restless riot; the faithful pray.'},(i,n)=>{
  if(!spend(25))return;gwSight('bloodmoon',i,26);if(settings.daynight)dayT=.8;const riots=[];
  for(const m of nations){if(!m.alive)continue;if(stabOf(m)<.45&&m.cities.length>1&&rng()<.45){riot(m);riots.push(m.name)}else if((m.devotion??.3)>.4)m.devotion=clamp(m.devotion+.06,0,1)}
  log(`The moon rose red as blood.${riots.length?' Riots broke out in '+riots.slice(0,3).join(', ')+'.':''} In the temples the faithful prayed all night.`,'sky')});
gp({id:'shower',tab:'Strife',label:'Meteor shower',cost:45,icon:'shower',hint:'Tap a region. Stones rain down over it: small craters, fires and fear.'},(i,n)=>{
  if(!spend(45))return;const x=i%W,y=(i/W)|0;for(let k=0;k<9;k++)setTimeout(()=>{try{const X=clamp(Math.round(x+(rng()-.5)*12),0,W-1),Y=clamp(Math.round(y+(rng()-.5)*12),0,H-1),j=Y*W+X;
    brush(j,1.3,(q,d)=>{h[q]=clamp(h[q]-.05*(1-d/1.8),0,1)});terrainDirty=true;fx(j,'meteor');burst(j,'fire',8,.6);burst(j,'dark',10,1);shakeT=Math.max(shakeT,.25);
    if(owner[j]>=0)nations[owner[j]].pop*=.985;if(FUEL[biome[j]]&&rng()<.4)startWildfire(j,false,true)}catch(e){}},k*650+rng()*300);
  log(`Stones fell from the sky${n?' over '+n.name:''}. Where they struck, the earth burned.`,'doom')});

/* ======================= PEOPLE ======================= */
TRAITS.genius={label:'Genius',desc:'A mind far ahead of its age',tech:1.3};
TRAITS.longlived={label:'Long-lived',desc:'Blessed with an unnaturally long life',stab:1.05};
/* a dream sent to a ruler: you choose what they dream, and most of them act on it */
gp({id:'dream',tab:'People',label:'Dream vision',cost:20,icon:'dream',hint:'Tap a nation and choose what its ruler dreams. Most rulers act on it.'},(i,n)=>{
  if(!needNation(n)||gwOnlyHost())return;const r=rulerOf(n),who=r&&!r.machine?rulerLabel(n):'the leaders';
  openModal(`<h2>A dream for ${esc(who)} of ${esc(n.name)}</h2><p class="note">What should they dream tonight? The more devout the nation, the more likely they listen.</p>
    <div class="tenets">${[['peace','Doves over a burning field','Make peace with every enemy'],['temple','A temple of light','Build to the faith and pray'],['sea','A ship sailing west','Send ships to find new land'],
      ['learn','A library without end','Seek knowledge'],['war','A golden sword','Go to war with a neighbour']].map(([k,t,d])=>`<button data-dream="${k}" data-n="${n.id}"><b>${t}</b><small>${d}</small></button>`).join('')}</div>
    <div class="row"><div class="flex"></div><button class="btn" data-p="close">Cancel</button></div>`)});
document.addEventListener('click',e=>{const b=e.target.closest('[data-dream]');if(!b)return;const n=nations[+b.dataset.n];closeModal();if(!n||!n.alive)return;spendMul=devCost(n);if(!spend(20))return;
  const k=b.dataset.dream,obey=rng()<.45+(n.devotion??.3)*.5,who=rulerOf(n)&&!rulerOf(n).machine?rulerLabel(n):`The leaders of ${n.name}`;fx(tileOf(capOf(n)),'faith');
  if(!obey){log(`${who} of ${n.name} dreamed a strange dream, woke, and shrugged it off.`,'faith');return}
  if(k==='peace'){for(const b2 of [...n.wars])makePeace(n,nations[b2],true);log(`${who} dreamed of doves over a burning field, and sued for peace.`,'faith')}
  if(k==='temple'){n.devotion=clamp((n.devotion??.3)+.2,0,1);n.festival=Math.max(n.festival||0,4);propsDirty=true;log(`${who} dreamed of a temple of light. ${n.name} builds and prays.`,'faith')}
  if(k==='sea'){n.explore=year+20;n.tech+=TECHCOST[n.era]*.1;log(`${who} dreamed of a ship sailing west. Shipwrights in ${n.name} work day and night.`,'faith');if(typeof sendExplorer==='function')try{sendExplorer(n)}catch(_){}}
  if(k==='learn'){n.tech+=TECHCOST[n.era]*.45;n.inspire=Math.max(n.inspire||0,15);log(`${who} dreamed of a library without end, and founded schools across ${n.name}.`,'era')}
  if(k==='war'){const nb=[...n.nb].map(j=>nations[j]).filter(o=>o&&o.alive&&!n.wars.has(o.id)&&!allied(n,o));if(nb.length){const B=nb.sort((a,b)=>a.pop-b.pop)[0];startWar(n,B,'god');log(`${who} dreamed of a golden sword, and marched on ${B.name}.`,'war')}}});
/* a genius is born: an inventor, an artist or a philosopher */
gp({id:'genius',tab:'People',label:'Genius',cost:35,icon:'bulb',hint:'Tap a nation. A great inventor, artist or philosopher is born there. Their work changes the age.'},(i,n)=>{
  if(!needNation(n)||!spend(35))return;const kind=['inventor','artist','philosopher'][(rng()*3)|0],p=newPerson({sex:rng()<(n.era>=4?.4:.2)?'f':'m',born:year-24,house:null,nation:n.id,traits:['genius',kind==='artist'?'just':'wise']});
  if(kind==='inventor'){n.tech+=TECHCOST[n.era]*.9;log(`${p.name}, an inventor of genius, was born in ${n.name}. Their machines are years ahead of their time.`,'era')}
  else if(kind==='artist'){n.happy=clamp((n.happy??.6)+.12,0,1);n.golden=Math.max(n.golden||0,year+15);log(`${p.name} of ${n.name} painted and built like no one before. Pilgrims come just to see their work.`,'era')}
  else{n.stab=Math.min(1,stabOf(n)+.15);n.tech+=TECHCOST[n.era]*.3;log(`The philosopher ${p.name} of ${n.name} taught a new way of thinking. Kings and beggars alike listen.`,'era')}
  n.genius=(n.genius||[]).concat([{id:p.id,kind,year}]);fx(tileOf(capOf(n)),'faith');milestone('genius','A genius','A great mind was born.')});
/* a baby boom: fast growth now, hunger later if the land cannot feed them */
gp({id:'boom',tab:'People',label:'Baby boom',cost:20,icon:'baby',hint:'Tap a nation. For fifteen years every family has more children. If the land cannot feed them, hunger follows.'},(i,n)=>{
  if(!needNation(n)||!spend(20))return;n.boom=year+15;fx(tileOf(capOf(n)),'bless');log(`Cradles fill in ${n.name}. Never have so many children been born.`,'life')});
/* an exodus: a whole people leaves to find a new land */
gp({id:'exodus',tab:'People',label:'Exodus',cost:40,icon:'exodus',hint:'Tap a nation. Part of its people leave together and found a new nation in empty land far away.'},(i,n)=>{
  if(!needNation(n)||!spend(40))return;let best=-1,bs=-1;
  for(let q=0;q<500;q++){const j=(rng()*N)|0;if(owner[j]>=0||isWater(j)||hab[j]<.3)continue;const x=j%W,y=(j/W)|0;if(nations.some(m=>m.alive&&m.cities.some(c=>Math.hypot(c.x-x,c.y-y)<6)))continue;
    const d=Math.hypot(x-capOf(n).x,y-capOf(n).y),s=hab[j]+Math.min(1,d/30);if(s>bs){bs=s;best=j}}
  if(best<0){say('There is no empty land left for them to go to.');if(!unlimited)belief+=costOf(40);return}
  const T=newNation(best%W,(best/W)|0,{culture:cultOf(n),pop:n.pop*.15});n.pop*=.85;T.faith=n.faith;T.era=n.era;T.eraY=n.eraY??year;T.techs=(n.techs||[]).slice();T.gov=n.gov;
  fx(tileOf(capOf(n)),'faith');fx(best,'bless');propsDirty=true;log(`A great exodus: thousands left ${n.name} and walked until they found a land of their own. They named it ${T.name}.`,'life');milestone('exodus','Exodus','A people left to find a new land.')});
/* bless one town: it grows faster and raises a golden statue */
gp({id:'blesstown',tab:'People',label:'Bless a town',cost:25,icon:'star',hint:'Tap a town. It prospers and grows faster, and raises a golden statue in your honour.'},(i,n)=>{
  const hit=cityNear(i);if(!hit){say('Tap a town.');return}if(hit.c.blessed){say(`${hit.c.name} is already blessed.`);return}spendMul=devCost(hit.n);if(!spend(25))return;
  hit.c.blessed=year;propsDirty=true;fx(tileOf(hit.c),'bless');log(`You blessed the town of ${hit.c.name}. Its people raised a golden statue in your honour.`,'life')});
/* a ruler who lives far longer than anyone should; their heirs grow impatient */
gp({id:'longevity',tab:'People',label:'Long life',cost:30,icon:'hourglass',hint:'Tap a nation. Its ruler lives an unnaturally long life: stable times, but the heirs grow restless.'},(i,n)=>{
  if(!needNation(n))return;const r=rulerOf(n);if(!r||r.machine){say(`${n.name} has no ruler to bless with long life.`);return}if(r.traits.includes('longlived')){say(`${r.name} already has a long life.`);return}if(!spend(30))return;
  r.traits.push('longlived');fx(tileOf(capOf(n)),'bless');log(`${rulerLabel(n)} of ${n.name} was granted a long life. The years seem to pass them by.`,'life')});
{const _dc=deathChance;deathChance=function(p){const c=_dc.apply(this,arguments);return p&&p.traits&&p.traits.includes('longlived')&&ageOf(p)<110?c*.06:c}}
function heirTick(n){const r=rulerOf(n);if(!r||!r.traits||!r.traits.includes('longlived')||ageOf(r)<75)return;n.stab=Math.max(0,stabOf(n)-.004);
  if(rng()<.006){log(`The heirs of ${rulerLabel(n)} of ${n.name} tired of waiting. ${r.name} was pushed from the throne at the age of ${ageOf(r)}.`,'era');const dead={p:r,title:titleOf(n,r),label:reignName(n,n.reigns[n.reigns.length-1])};die(r,n);r.cause='a palace coup';succeed(n,dead)}}
/* twin heirs: the ruler dies and two claimants split the land */
gp({id:'twins',tab:'Rule',label:'Twin heirs',cost:45,icon:'twins',hint:'Tap a nation with two or more towns. The ruler dies leaving twins with equal claims, and the realm splits in a war of succession.'},(i,n)=>{
  if(!needNation(n))return;if(n.cities.length<2){say(`${n.name} needs at least two towns to split.`);return}if(!spend(45))return;
  const r=rulerOf(n),cap=capOf(n),far=n.cities.slice(1).sort((a,b)=>Math.hypot(b.x-cap.x,b.y-cap.y)-Math.hypot(a.x-cap.x,a.y-cap.y))[0];
  if(r&&!r.machine){const dead={p:r,title:titleOf(n,r),label:reignName(n,n.reigns[n.reigns.length-1])};die(r,n);succeed(n,dead)}
  const before=nations.length;rebel(n,far,null);const R_=nations.length>before?nations[nations.length-1]:null;
  if(R_)log(`Twins were born to the old ruler of ${n.name}, and both claim the crown. ${R_.name} follows the younger twin: a war of succession has begun.`,'war');fx(tileOf(cap),'war')});

/* ======================= FAITH ======================= */
const RELICS=['the Bones of the First Prophet','the Weeping Chalice','the Shroud of Dawn','the Sacred Tooth','the Crown of Thorns','the Burning Book','the Seed of the World Tree','the Stone Tablets'];
gp({id:'relic',tab:'Faith',label:'Holy relic',cost:35,icon:'relic',hint:'Tap a town. A holy relic is found there: pilgrims come from far away. Enemies may try to steal it.'},(i,n)=>{
  const hit=cityNear(i);if(!hit){say('Tap a town.');return}if(hit.c.relic){say(`${hit.c.name} already keeps a relic.`);return}spendMul=devCost(hit.n);if(!spend(35))return;
  const f=hit.n.faith>=0?hit.n.faith:selectedFaith;hit.c.relic={faith:f,name:RELICS[(rng()*RELICS.length)|0],found:year};propsDirty=true;fx(tileOf(hit.c),'faith');
  log(`${hit.c.relic.name[0].toUpperCase()+hit.c.relic.name.slice(1)} ${hit.c.relic.name.startsWith('the Bones')||hit.c.relic.name.startsWith('the Stone')?'were':'was'} found in ${hit.c.name}. Pilgrims are already on the road.`,'faith');milestone('relic','A holy relic','A relic drew pilgrims from afar.')});
function relicTick(){for(const n of nations){if(!n.alive)continue;for(const c of n.cities){if(!c.relic)continue;n.devotion=clamp((n.devotion??.3)+.004,0,1);n.pop*=1.0015;
      if(c.relic.faith>=0&&godOf(c.relic.faith)===myGod())belief+=.4;
      for(const m of nationsNear(tileOf(c),25))if(m!==n&&m.faith===c.relic.faith){m.devotion=clamp((m.devotion??.3)+.002,0,1);const t=m.pop*.0008;m.pop-=t;n.pop+=t}
      /* enemies at war may carry it off */
      for(const w of n.wars){const E=nations[w];if(E&&E.alive&&E.cities.length&&rng()<.02){const to=E.cities[0];to.relic=c.relic;delete c.relic;propsDirty=true;log(`Raiders from ${E.name} stole ${to.relic.name} from ${c.name} and carried it to ${to.name}.`,'war');break}}}}}
/* a pilgrimage route between two towns: cairns along the way, pilgrims walking it, trade and devotion at both ends */
gp({id:'pilgrim',tab:'Faith',label:'Pilgrimage route',cost:30,icon:'path',hint:'Tap one town, then another. A pilgrims’ road joins them: devotion and trade grow at both ends.'},(i,n)=>{
  const hit=cityNear(i);if(!hit){say('Tap a town.');return}const p=pickTwo('pilgrim',i,{c:hit.c,nid:hit.n.id},null,`Now tap the town the pilgrims walk to from ${hit.c.name}.`);if(!p)return;
  if(p.c===hit.c){say('Pick a different town.');return}if(!spend(30))return;GODW.routes.push({a:[p.c.x,p.c.y],b:[hit.c.x,hit.c.y],an:p.c.name,bn:hit.c.name});
  const A=nations[p.nid],B=hit.n;if(A&&B&&A!==B){A.trade=A.trade||[];B.trade=B.trade||[];if(!A.trade.includes(B.id))A.trade.push(B.id);if(!B.trade.includes(A.id))B.trade.push(A.id)}
  fx(i,'faith');log(`A pilgrims’ road now runs from ${p.c.name} to ${hit.c.name}. Inns and chapels spring up along the way.`,'faith')});
function routeTick(){for(const r of GODW.routes)for(const end of [r.a,r.b]){const j=end[1]*W+end[0];if(owner[j]>=0){const n=nations[owner[j]];n.devotion=clamp((n.devotion??.3)+.003,0,1);n.pop*=1.001}}}
/* divine judgement: strike one ruler down before their people */
gp({id:'judge',tab:'Faith',label:'Divine judgement',cost:40,icon:'bolt',hint:'Tap a nation. Lightning strikes its ruler before the eyes of the people. A tyrant’s fall is cheered; a good ruler’s is mourned.'},(i,n)=>{
  if(!needNation(n))return;const r=rulerOf(n);if(!r||r.machine){say(`There is no one to judge in ${n.name}.`);return}if(!spend(40))return;
  const c=capOf(n),x=wx(c.x),z=wz(c.y),y=surfY(x,z);bolts.push({x,z,y,top:y+4.4,t0:performance.now(),seed:rng()*1000});flashT=Math.max(flashT,.3);if(typeof sfx==='function')sfx('thunder',{delay:.1,near:1});
  const tyrant=r.traits.includes('cruel')||r.traits.includes('reckless'),dead={p:r,title:titleOf(n,r),label:reignName(n,n.reigns[n.reigns.length-1])};die(r,n);r.cause='lightning from a clear sky';succeed(n,dead);
  n.devotion=clamp((n.devotion??.3)+.15,0,1);n.stab=clamp(stabOf(n)+(tyrant?.12:-.12),0,1);
  log(`Lightning from a clear sky struck ${dead.title} ${dead.label} of ${n.name} before the gathered people. ${tyrant?'The crowd cheered the fall of a tyrant.':'The people mourn, and fear your judgement.'}`,'faith')});
/* an oracle speaks a prophecy; nations make it come true */
gp({id:'oracle',tab:'Faith',label:'Oracle',cost:25,icon:'oracle',hint:'Tap a nation and choose what its oracle foretells. People act on prophecies, and so make them come true.'},(i,n)=>{
  if(!needNation(n)||gwOnlyHost())return;
  openModal(`<h2>The oracle of ${esc(n.name)}</h2><p class="note">What does the oracle foretell?</p><div class="tenets">${[['war','A great war is coming','They arm, and strike first'],['gold','A golden age awaits the faithful','The devout prosper'],
      ['land','The sea hides new lands','Explorers set sail'],['fall','The ruler will fall','Plotters take heart'],['plague','Plague follows the unbelievers','Unbelievers convert']].map(([k,t,d])=>`<button data-oracle="${k}" data-n="${n.id}"><b>${t}</b><small>${d}</small></button>`).join('')}</div>
    <div class="row"><div class="flex"></div><button class="btn" data-p="close">Cancel</button></div>`)});
document.addEventListener('click',e=>{const b=e.target.closest('[data-oracle]');if(!b)return;const n=nations[+b.dataset.n];closeModal();if(!n||!n.alive)return;spendMul=devCost(n);if(!spend(25))return;const k=b.dataset.oracle;fx(tileOf(capOf(n)),'faith');
  if(k==='war'){n.aggr=Math.min(1,(n.aggr||.5)+.25);n.armed=year+20;const nb=[...n.nb].map(j=>nations[j]).filter(o=>o&&o.alive&&!n.wars.has(o.id)&&!allied(n,o));if(nb.length&&warRoom()){const B=nb[(rng()*nb.length)|0];startWar(n,B,null);log(`The oracle of ${n.name} foretold a great war. Fearing it, ${n.name} struck ${B.name} first, and so it came.`,'war')}else log(`The oracle of ${n.name} foretold a great war. The smiths work day and night.`,'war')}
  if(k==='gold'){for(const m of nations)if(m.alive&&m.faith>=0&&m.faith===n.faith){m.devotion=clamp((m.devotion??.3)+.08,0,1);if((m.devotion??.3)>.6)m.golden=Math.max(m.golden||0,year+25)}log(`The oracle of ${n.name} foretold a golden age for the faithful. The temples overflow.`,'faith')}
  if(k==='land'){n.explore=year+25;n.tech+=TECHCOST[n.era]*.1;log(`The oracle of ${n.name} spoke of new lands beyond the sea. Every captain wants to be first.`,'faith');if(typeof sendExplorer==='function')try{sendExplorer(n)}catch(_){}}
  if(k==='fall'){n.stab=Math.max(0,stabOf(n)-.2);if(rng()<.5){const r=rulerOf(n);if(r&&!r.machine){assassinate(n)}}else log(`The oracle of ${n.name} foretold the fall of the ruler. Whispers fill the palace.`,'era')}
  if(k==='plague'){const conv=[];for(const m of nations)if(m.alive&&m!==n&&m.faith!==n.faith&&n.faith>=0&&m.nb&&m.nb.has(n.id)&&rng()<.4){m.faith=n.faith;conv.push(m.name)}propsDirty=true;
    log(`The oracle of ${n.name} said plague would follow the unbelievers.${conv.length?' Terrified, '+conv.join(', ')+' took up the faith.':' The neighbours laughed.'}`,'faith')}});
/* reveal yourself to the whole world */
gp({id:'reveal',tab:'Faith',label:'Reveal yourself',cost:150,icon:'sparkle',hint:'Show yourself to every nation at once. The faithful rejoice; unbelievers convert or panic.'},(i,n)=>{
  if(!spend(150))return;gwSight('reveal',i,14);flashT=Math.max(flashT,.4);let conv=0,panic=0;
  for(const m of nations){if(!m.alive)continue;if(m.faith>=0&&godOf(m.faith)===myGod()){m.devotion=clamp((m.devotion??.3)+.25,0,1);m.happy=clamp((m.happy??.6)+.05,0,1)}
    else if(selectedFaith>=0&&rng()<.45){m.faith=selectedFaith;m.devotion=.5;conv++}else{m.stab=Math.max(0,stabOf(m)-.15);panic++}}
  propsDirty=true;log(`You showed yourself to the world. The sky split with light. ${conv?conv+' nations fell to their knees and took up your faith. ':''}${panic?'Elsewhere there was panic in the streets.':''}`,'faith');milestone('reveal','Revealed','You showed yourself to all the world.')});
/* two faiths grow into one */
gp({id:'mergefaith',tab:'Faith',label:'Merge faiths',cost:50,icon:'merge',hint:'Tap a nation of one faith, then a nation of another. The two faiths grow together into a new one.'},(i,n)=>{
  if(!needNation(n))return;if(n.faith<0){say(`${n.name} follows no faith.`);return}const p=pickTwo('mergefaith',i,{f:n.faith},null,`Now tap a nation of another faith to merge with ${faiths[n.faith].name}.`);if(!p)return;
  if(p.f===n.faith||n.faith<0){say('Pick a nation of a different faith.');return}if(!spend(50))return;const A=faiths[p.f],B=faiths[n.faith];
  const wa=A.name.replace(/^(The|Way of the|Order of the|Children of the|Keepers of the|Choir of) /,'').split(' ').pop(),wb=B.name.replace(/^(The|Way of the|Order of the|Children of the|Keepers of the|Choir of) /,'').split(' ').pop();
  const ca=new THREE.Color(A.color),cb=new THREE.Color(B.color),nf={name:`The ${wa} and ${wb}`,tenets:[(A.tenets||[A.tenet])[0],(B.tenets||[B.tenet])[0]].filter((t,k,a)=>t&&a.indexOf(t)===k),glyph:A.glyph,color:'#'+ca.lerp(cb,.5).getHexString(),founded:year,holy:A.holy||B.holy,god:A.god|0,merged:[A.name,B.name]};
  faiths.push(nf);const fi=faiths.length-1;let k=0;for(const m of nations)if(m.alive&&(m.faith===p.f||m.faith===n.faith)){m.faith=fi;k++}A.mergedInto=fi;B.mergedInto=fi;if(selectedFaith===p.f||selectedFaith===n.faith)selectedFaith=fi;propsDirty=true;fx(i,'faith');
  log(`${A.name} and ${B.name} became one faith: ${nf.name}. ${k} nations now share it.`,'faith')});
/* a prophet dies for the faith, and the faith spreads faster for a generation */
gp({id:'martyr',tab:'Faith',label:'Martyr',cost:30,icon:'torch',hint:'Tap a walking prophet. They die for the faith in a column of light, and the faith spreads twice as fast for forty years.'},(i,n)=>{
  const x=wx(i%W),z=wz((i/W)|0),k=prophets.findIndex(p=>Math.hypot(p.x-x,p.z-z)<2.5);if(k<0){say('Tap close to a walking prophet. Send one with the Prophet power first.');return}if(!spend(30))return;
  const p=prophets[k];for(let e=0;e<40;e++)emit('holy',p.x+(rng()-.5)*.1,groundY(p.x,p.z)+.05+rng()*.4,p.z+(rng()-.5)*.1);disposeGroup(p.g);prophets.splice(k,1);
  const f=faiths[p.faith];if(f)f.martyr=year+40;log(`The prophet of ${f?f.name:'the faith'} died for the faith. Their story spreads faster than any sermon.`,'faith')});
function martyrTick(){for(let fi=0;fi<faiths.length;fi++){const f=faiths[fi];if(!f||!f.martyr||f.martyr<year)continue;
    for(const n of nations){if(!n.alive||n.faith!==fi)continue;for(const b of n.nb){const B=nations[b];if(B&&B.alive&&B.faith!==fi&&rng()<.012){B.faith=fi;propsDirty=true;if(important(B))log(`Moved by the martyr's story, ${B.name} took up ${f.name}.`,'faith')}}}}}

/* ======================= RULE ======================= */
/* a grand council of every ruler; you set the agenda */
gp({id:'council',tab:'Rule',label:'Grand council',cost:60,icon:'council',hint:'Call every ruler to one table and choose what they agree on: peace, trade, or a common enemy.'},(i,n)=>{
  if(gwOnlyHost())return;const al=nations.filter(m=>m.alive);if(al.length<3){say('There are too few nations for a council.');return}
  const big=al.slice().sort((a,b)=>b.pop-a.pop)[0];
  openModal(`<h2>A grand council</h2><p class="note">Every ruler is summoned to ${esc(capOf(big)?capOf(big).name:'the greatest city')}. What should they agree on?</p>
    <div class="tenets">${[['peace','Peace','All wars end, with thirty years of treaties'],['trade','Trade','Every neighbour opens its markets'],['enemy','A common enemy',`Everyone stands together against ${big.name}`],['faith','One faith','Many take up the most common faith']].map(([k,t,d])=>`<button data-council="${k}"><b>${t}</b><small>${esc(d)}</small></button>`).join('')}</div>
    <div class="row"><div class="flex"></div><button class="btn" data-p="close">Cancel</button></div>`)});
document.addEventListener('click',e=>{const b=e.target.closest('[data-council]');if(!b)return;closeModal();if(!spend(60))return;const k=b.dataset.council,al=nations.filter(m=>m.alive),big=al.slice().sort((a,b2)=>b2.pop-a.pop)[0],host=capOf(big);
  if(host)fx(tileOf(host),'bless');
  if(k==='peace'){for(const a of al)for(const w of [...a.wars])makePeace(a,nations[w],true);for(const a of al){a.pacts=a.pacts||{};for(const c of al)if(c!==a)a.pacts[c.id]=Math.max(a.pacts[c.id]||0,year+30)}log(`At the grand council in ${host?host.name:'the great city'}, every ruler swore peace for thirty years.`,'life')}
  if(k==='trade'){let t=0;for(const a of al){a.trade=a.trade||[];for(const j of a.nb||[]){const c=nations[j];if(c&&c.alive&&!a.trade.includes(c.id)&&!a.wars.has(c.id)){a.trade.push(c.id);c.trade=c.trade||[];if(!c.trade.includes(a.id))c.trade.push(a.id);t++}}}log(`The grand council opened the markets: ${t} new trade pacts were signed.`,'life')}
  if(k==='enemy'){for(const a of al)if(a!==big){for(const c of al)if(c!==a&&c!==big&&!allied(a,c)&&!a.wars.has(c.id)&&rng()<.5)ally(a,c,false)}const foes=al.filter(a=>a!==big&&big.nb&&big.nb.has(a.id));for(const f of foes.slice(0,3))if(!f.wars.has(big.id))startWar(f,big,'god');
    log(`The grand council named ${big.name} the common enemy of all. Alliances were sealed${foes.length?' and armies march':''}.`,'war')}
  if(k==='faith'){const cnt={};for(const a of al)if(a.faith>=0)cnt[a.faith]=(cnt[a.faith]||0)+a.pop;const top=+Object.keys(cnt).sort((x,y)=>cnt[y]-cnt[x])[0];if(isNaN(top)){log('The council could not agree on any faith.','faith');return}
    let c=0;for(const a of al)if(a.faith!==top&&rng()<.5){a.faith=top;c++}propsDirty=true;log(`The grand council declared ${faiths[top].name} the faith of the world. ${c} nations agreed.`,'faith')}
  milestone('council','The grand council','Every ruler met at one table.')});
/* divide a kingdom between heirs, in peace */
gp({id:'divide',tab:'Rule',label:'Divide a kingdom',cost:40,icon:'scissors',hint:'Tap a nation with three or more towns. The far half becomes a kingdom of its own, at peace and allied.'},(i,n)=>{
  if(!needNation(n))return;if(n.cities.length<3){say(`${n.name} needs at least three towns to divide.`);return}if(!spend(40))return;
  const cap=capOf(n),far=n.cities.slice(1).sort((a,b)=>Math.hypot(b.x-cap.x,b.y-cap.y)-Math.hypot(a.x-cap.x,a.y-cap.y))[0],before=nations.length;rebel(n,far,'free');
  const R_=nations.length>before?nations[nations.length-1]:null;if(!R_){say('The land would not divide.');return}if(R_.wars.has(n.id))makePeace(R_,n,true);ally(R_,n,false);
  const dir=far.y<cap.y?'North':far.y>cap.y+2?'South':far.x<cap.x?'West':'East',root=n.root||n.name;R_.name=`${dir} ${root}`.slice(0,40);R_.faith=n.faith;R_.flag=makeFlag(R_,R_.gov);
  log(`${n.name} was divided between heirs. ${R_.name} is now a kingdom of its own, bound to ${n.name} by blood.`,'era')});
/* make one nation the vassal of another */
gp({id:'puppet',tab:'Rule',label:'Vassal',cost:40,icon:'chain',hint:'Tap the overlord, then the nation that must bow to it. The vassal pays tribute and fights in its lord’s wars.'},(i,n)=>{
  if(!needNation(n))return;const p=pickTwo('puppet',i,{nid:n.id},null,`Now tap the nation that should bow to ${n.name}.`);if(!p)return;const O=nations[p.nid];
  if(!O||!O.alive||O===n){say('Tap a different nation.');return}if(!spend(40))return;if(n.wars.has(O.id))makePeace(n,O,true);n.vassalOf=O.id;ally(O,n,false);
  log(`${n.name} bowed to ${O.name} and became its vassal.`,'era')});
function vassalTick(){for(const n of nations){if(!n.alive||n.vassalOf==null)continue;const O=nations[n.vassalOf];if(!O||!O.alive){delete n.vassalOf;continue}
    const t=n.pop*.006;n.pop-=t;O.pop+=t*.7;if(n.wars.has(O.id))makePeace(n,O,true);for(const w of O.wars)if(!n.wars.has(w)&&nations[w]&&nations[w]!==n&&rng()<.2)startWar(n,nations[w],'ally');
    if(stabOf(n)>.7&&mil(n)*n.tiles>mil(O)*O.tiles*1.2&&rng()<.02){delete n.vassalOf;log(`${n.name} threw off the rule of ${O.name} and is free again.`,'era')}}}
/* treachery: a nation turns on its ally */
gp({id:'betray',tab:'Rule',label:'Treachery',cost:35,icon:'dagger',hint:'Tap a nation with allies. It betrays one of them in a surprise attack.'},(i,n)=>{
  if(!needNation(n))return;const al=(n.allies||[]).map(k=>nations[k]).filter(m=>m&&m.alive);if(!al.length){say(`${n.name} has no allies to betray.`);return}if(!spend(35))return;
  const V=al[(rng()*al.length)|0];breakAlliance(n,V,false);startWar(n,V,'god');const k=warKey(n,V);if(warData[k])warData[k].score=(warData[k].score||0)+(warData[k].att===n.id?.25:-.25);
  for(const c of V.cities.slice(0,2))c.unrest=(c.unrest||0)+.1;log(`Treachery! ${n.name} turned on its ally ${V.name} without warning.`,'war')});
/* a peace treaty written by you: tap the nation that gains, then the land it takes */
gp({id:'treaty',tab:'Rule',label:'Redraw a border',cost:35,icon:'map',hint:'Tap the nation that gains land, then tap the land it should take from its neighbour. Any war between them ends.'},(i,n)=>{
  if(!needNation(n))return;const p=pickTwo('treaty',i,{nid:n.id},null,`Now tap the land ${n.name} should take.`);if(!p)return;const A=nations[p.nid];
  if(!A||!A.alive||A===n){say('Tap land of another nation.');return}if(!spend(35))return;let k=0;const moved=[];
  const cap0=capOf(n),capT=cap0?tileOf(cap0):-1,had=n.cities.slice();
  brush(i,2.6,(j,d)=>{if(owner[j]===n.id&&j!==capT){claim(j,A.id);k++}});
  for(const c of n.cities.slice())if(owner[tileOf(c)]===A.id&&c!==cap0){n.cities.splice(n.cities.indexOf(c),1);c.origin=n.id;A.cities.push(c)}
  for(const c of had)if(!n.cities.includes(c))moved.push(c.name)
  if(A.wars.has(n.id))makePeace(A,n,true);A.pacts=A.pacts||{};n.pacts=n.pacts||{};A.pacts[n.id]=n.pacts[A.id]=year+25;bordersDirty=true;propsDirty=true;
  log(`By your treaty ${n.name} handed ${moved.length?moved.join(', ')+' and the lands around '+(moved.length>1?'them':'it'):'a stretch of its land'} to ${A.name}.`,'era')});
/* free a colony or a far town */
gp({id:'freecolony',tab:'Rule',label:'Free a colony',cost:30,icon:'flag',hint:'Tap a town that is not a capital. It declares independence with its own name and flag.'},(i,n)=>{
  const hit=cityNear(i);if(!hit){say('Tap a town.');return}if(hit.c===capOf(hit.n)){say('Pick a town that is not the capital.');return}if(!spend(30))return;
  const before=nations.length;rebel(hit.n,hit.c,'colony');if(nations.length===before)say('That town is too small to stand on its own.');else fx(i,'bless')});
/* a golden marriage: in a generation the two crowns become one */
gp({id:'goldwed',tab:'Rule',label:'Golden marriage',cost:45,icon:'ring',hint:'Tap one nation, then another. Their royal houses marry; in thirty years the two crowns become one country.'},(i,n)=>{
  if(!needNation(n))return;const p=pickTwo('goldwed',i,{nid:n.id},null,`Now tap the nation ${n.name} should marry into.`);if(!p)return;const A=nations[p.nid];
  if(!A||!A.alive||A===n){say('Tap a different nation.');return}if(A.wars.has(n.id)){say('They are at war. Make peace first.');return}if(!spend(45))return;
  ally(A,n,false);A.ties=A.ties||[];n.ties=n.ties||[];if(!A.ties.includes(n.id))A.ties.push(n.id);if(!n.ties.includes(A.id))n.ties.push(A.id);GODW.marriages.push({a:A.id,b:n.id,until:year+30});
  fx(i,'bless');log(`A golden marriage joined the royal houses of ${A.name} and ${n.name}. In a generation, one heir will wear both crowns.`,'life')});
function marriageTick(){GODW.marriages=GODW.marriages.filter(m=>{if(year<m.until)return true;const A=nations[m.a],B=nations[m.b];if(!A||!B||!A.alive||!B.alive||A.wars.has(B.id))return false;
    const K=A.pop>=B.pop?A:B,O=K===A?B:A,o=unionNames(K,O);unite(K,O,(o[2]||o[0])[1],true,(o[2]||o[0])[2]);return false})}

/* ======================= STRIFE ======================= */
gp({id:'rats',tab:'Strife',label:'Plague of rats',cost:45,icon:'rat',hint:'Tap a port town. Rats carry a plague from port to port along the trade routes.'},(i,n)=>{
  if(!needNation(n))return;if(n.sick){say(`${n.name} is already sick.`);return}if(!spend(45))return;n.sick={name:'Black Death',sev:.95,t:20,rats:true};n.pop*=.94;log(`Rats came ashore in ${n.name} carrying the Black Death.`,'doom');fx(i,'plague')});
function ratTick(){for(const n of nations){if(!n.alive||!n.sick||!n.sick.rats)continue;for(const t of (n.trade||[]).concat(n.ties||[])){const B=nations[t];if(B&&B.alive&&!B.sick&&rng()<.2){infect(B,n.sick,n);if(B.sick)B.sick.rats=true}}}}
/* a dragon or a great beast terrorises a region until a hero slays it */
gp({id:'dragon',tab:'Strife',label:'Dragon',cost:70,icon:'dragon',hint:'Tap a region. A dragon makes its lair there and burns towns, until a hero slays it.'},(i,n)=>{if(!spend(70))return;spawnMonster('dragon',i)});
gp({id:'beast',tab:'Strife',label:'Great beast',cost:50,icon:'wolf',hint:'Tap a forest. A monstrous wolf haunts the woods and the roads, until a hero hunts it down.'},(i,n)=>{if(isWater(i)){say('Tap land.');return}if(!spend(50))return;spawnMonster('beast',i)});
function spawnMonster(kind,i){const m={kind,x:wx(i%W),z:wz((i/W)|0),hx:wx(i%W),hz:wz((i/W)|0),tx:0,tz:0,born:year,hit:{},t:0};m.tx=m.x;m.tz=m.z;GODW.monsters.push(m);
  const n=owner[i]>=0?nations[owner[i]]:null;log(kind==='dragon'?`A dragon came down from the mountains and made its lair${n?' in '+n.name:''}.`:`Something huge stalks the woods${n?' of '+n.name:''}. Shepherds go missing.`,'doom');
  if(typeof toast==='function')toast(kind==='dragon'?'A dragon':'A great beast',n?`It haunts ${n.name}.`:'It haunts the wild lands.',m.x,m.z);milestone(kind,kind==='dragon'?'Here be dragons':'The beast','A monster haunts the land.')}
function monsterTick(){for(let q=GODW.monsters.length-1;q>=0;q--){const m=GODW.monsters[q],hit=nationsNear(tileAt(m.hx,m.hz),6);
    for(const n of hit){n.pop*=m.kind==='dragon'?.992:.996;n.happy=clamp((n.happy??.6)-.01,0,1);const hero=heroOf(n);
      const p=(hero?.3:.015*(n.era+1))*(m.kind==='beast'?1.6:1);if(rng()<p){GODW.monsters.splice(q,1);if(m.g)disposeGroup(m.g);
        log(hero?`The hero ${hero.name} of ${n.name} slew the ${m.kind==='dragon'?'dragon':'beast'}. Songs will be sung of it for a thousand years.`:`The hunters of ${n.name} finally killed the ${m.kind==='dragon'?'dragon':'beast'}.`,'era');if(hero&&n.hero)n.hero.wins+=3;
        n.happy=clamp((n.happy??.6)+.1,0,1);break}}
    if(GODW.monsters[q]===m&&year-m.born>150){GODW.monsters.splice(q,1);if(m.g)disposeGroup(m.g);log(`The ${m.kind==='dragon'?'dragon':'beast'} has not been seen for years. Some say it sleeps.`,'life')}}}
/* a great fire: a city burns, and later rises again more beautiful */
gp({id:'greatfire',tab:'Strife',label:'Great fire',cost:40,icon:'fireCity',hint:'Tap a town. A great fire sweeps through its streets. In time it is rebuilt, finer than before.'},(i,n)=>{
  const hit=cityNear(i);if(!hit){say('Tap a town.');return}if(!spend(40))return;const c=hit.c;c.burned=year;hit.n.pop*=.92;c.unrest=(c.unrest||0)+.1;
  GODW.burning.push({x:c.x,y:c.y,t:performance.now(),dur:28000,rebuild:year+20,name:c.name});log(`The Great Fire of ${c.name}: for three days the city burned.`,'doom');milestone('greatfire','The great fire','A city burned and rose again.')});
function fireTick(){GODW.burning=GODW.burning.filter(b=>{if(year<b.rebuild)return true;for(const n of nations)for(const c of n.cities)if(c.x===b.x&&c.y===b.y){c.blessed=c.blessed||year;propsDirty=true;log(`${c.name} rose from its ashes, built in stone, wider and grander than before.`,'life')}return false})}
/* civil war: the realm splits into two camps */
gp({id:'civilwar',tab:'Strife',label:'Civil war',cost:45,icon:'civil',hint:'Tap a nation with two or more towns. It splits into two camps that fight for the whole realm.'},(i,n)=>{
  if(!needNation(n))return;if(n.cities.length<2){say(`${n.name} needs at least two towns for a civil war.`);return}if(!spend(45))return;
  const cap=capOf(n),far=n.cities.slice(1).sort((a,b)=>Math.hypot(b.x-cap.x,b.y-cap.y)-Math.hypot(a.x-cap.x,a.y-cap.y))[0];rebel(n,far,null);n.stab=Math.max(0,stabOf(n)-.2);fx(i,'war')});
/* bandits on the roads: trade withers until soldiers clear them out */
gp({id:'bandits',tab:'Strife',label:'Bandits',cost:25,icon:'tent2',hint:'Tap land in a nation. Bandits make camp and prey on the roads, until its soldiers clear them out.'},(i,n)=>{
  if(!needNation(n))return;/* the camp sits in the wild, away from the towns */let camp=-1,bs=-1;const X0=i%W,Y0=(i/W)|0;
  for(let y=Math.max(0,Y0-7);y<=Math.min(H-1,Y0+7);y++)for(let x=Math.max(0,X0-7);x<=Math.min(W-1,X0+7);x++){const j=y*W+x;if(owner[j]!==n.id||isWater(j)||river[j])continue;
    const dc=Math.min(...n.cities.map(c=>Math.hypot(c.x-x,c.y-y)));if(dc<2.5)continue;const sc=h[j]*4-Math.hypot(x-X0,y-Y0)*.05+rng()*.1;if(sc>bs){bs=sc;camp=j}}
  if(camp<0){say(`There is no wild land in ${n.name} for a camp.`);return}if(!spend(25))return;i=camp;GODW.bandits.push({i,nid:n.id,born:year});fx(i,'war');log(`Bandits made camp in the hills of ${n.name}. No merchant travels safely.`,'war')});
function banditTick(){GODW.bandits=GODW.bandits.filter(b=>{const n=nations[b.nid];if(!n||!n.alive||owner[b.i]!==n.id)return false;n.pop*=.998;n.happy=clamp((n.happy??.6)-.004,0,1);n.tech=Math.max(0,n.tech-.2);
    if(rng()<.02+.01*n.era*(n.wars.size?.3:1)){log(`Soldiers of ${n.name} stormed the bandits' camp and hanged their leaders.`,'war');return false}return true})}
/* mutiny: the army turns against its own ruler */
gp({id:'mutiny',tab:'Strife',label:'Mutiny',cost:35,icon:'mutiny',hint:'Tap a nation. Its soldiers mutiny: a war turns against it, or the generals seize power.'},(i,n)=>{
  if(!needNation(n)||!spend(35))return;n.stab=Math.max(0,stabOf(n)-.15);
  if(n.wars.size){for(const w of n.wars){const k=warKey(n,nations[w]);if(warData[k])warData[k].score=(warData[k].score||0)+(warData[k].att===n.id?-.35:.35)}log(`The army of ${n.name} mutinied in the middle of the war. Whole regiments threw down their arms.`,'war')}
  else{coup(n,true);log(`The soldiers of ${n.name} mutinied and the generals took power.`,'war')}fx(i,'war')});

/* ======================= PLAY ======================= */
/* ---------- favour and anger: nations remember what their god does to them ---------- */
const KIND_POWERS=new Set(['bless','festival','inspire','miracle','golden','hero','peace','rain','fertile','forest','anoint','blesstown','genius','boom','rainbow','aurora','relic','pilgrim','dream','oracle','longevity','sacredpeak','thaw','gold']);
const CRUEL_POWERS=new Set(['plague','famine','quake','curse','locusts','discord','assassin','drought','meteor','volcano','nuke','wildfire','pirates','kraken','hail','rats','dragon','beast','greatfire','civilwar','bandits','mutiny','shower','iceage','atlantis','judge','betray','twins','spark','revolt','coup']);
let GW_SPENT=false;{const _sp=spend;spend=function(c){const r=_sp.apply(this,arguments);if(r)GW_SPENT=true;return r}}
{const _at2=applyTool;applyTool=function(i,start){GW_SPENT=false;const t=tool,o=i>=0?owner[i]:-1,r=_at2.apply(this,arguments);
  if(start&&GW_SPENT&&o>=0&&nations[o]&&nations[o].alive){const n=nations[o],d=KIND_POWERS.has(t)?.12:CRUEL_POWERS.has(t)?-.15:0;if(d)n.favour=clamp((n.favour||0)+d,-1,1)}return r}}
const favourWord=n=>{const f=n.favour||0;return f>.5?'Grateful':f>.15?'Thankful':f<-.6?'Turning away':f<-.3?'Resentful':f<-.1?'Fearful':'Indifferent'};
function favourTick(){for(const n of nations){if(!n.alive)continue;const f=n.favour||0;if(!f)continue;n.favour=f*.985;
    if(f>.5&&n.faith>=0&&godOf(n.faith)===myGod()){belief+=.3;n.devotion=clamp((n.devotion??.3)+.003,0,1)}
    if(f<-.3)n.devotion=clamp((n.devotion??.3)-.004,0,1);
    if(f<-.7&&n.faith>=0&&godOf(n.faith)===myGod()&&rng()<.03){const others=faiths.map((x,k)=>k).filter(k=>k!==n.faith&&faiths[k]&&!faiths[k].mergedInto&&godOf(k)!==myGod());
      const prev=faiths[n.faith].name;n.faith=others.length?others[(rng()*others.length)|0]:-1;n.favour=0;propsDirty=true;log(`${n.name} turned away from ${prev} after all you did to them${n.faith>=0?', and now follows '+faiths[n.faith].name:''}.`,'faith')}}}
/* ---------- a rival god ---------- */
gp({id:'rival',tab:'Faith',label:'Rival god',cost:0,icon:'shadow',hint:'Wake a rival god with a faith of its own. It spreads its faith, blesses its followers and works against yours. Win back every nation to banish it.'},(i,n)=>{
  if(GODW.rival&&faiths[GODW.rival.faith]&&nations.some(m=>m.alive&&m.faith===GODW.rival.faith)){say(`${GODW.rival.name} is already awake. Win back its nations to banish it.`);return}
  const cand=nations.filter(m=>m.alive&&(m.faith<0||godOf(m.faith)!==myGod()));const start=n&&!cand.includes(n)?null:n||cand[(rng()*cand.length)|0];if(!start){say('Every nation already follows you. There is no one for a rival to take.');return}
  const name=['The Shadow','The Hollow King','The Grey Mother','The Many-Eyed','The Drowned One'][(rng()*5)|0];faiths.push({name:`Cult of ${name.replace(/^The /,'the ')}`,tenets:['zeal','conquest'],glyph:'eye',color:'#5a3a6a',founded:year,holy:capOf(start)?capOf(start).name:null,god:99,rival:true});
  GODW.rival={faith:faiths.length-1,name,next:year+8,since:year};start.faith=GODW.rival.faith;start.devotion=.7;propsDirty=true;fx(tileOf(capOf(start)),'plague');
  log(`A rival god has woken: ${name}. ${start.name} was the first to kneel.`,'faith');if(typeof toast==='function')toast('A rival god',`${name} has taken ${start.name}.`,wx(capOf(start).x),wz(capOf(start).y))});
function rivalTick(){const R=GODW.rival;if(!R)return;const f=faiths[R.faith];if(!f)return;const mine=nations.filter(m=>m.alive&&m.faith===R.faith);
  if(!mine.length){log(`${R.name} has no followers left and fades into nothing. You are the only god again.`,'faith');belief+=200;GODW.rival=null;milestone('banish','The rival banished','You drove a rival god out of the world.');return}
  if(year<R.next)return;R.next=year+10+((rng()*8)|0);const src=mine[(rng()*mine.length)|0],r=rng();
  if(r<.45){const nb=[...src.nb].map(k=>nations[k]).filter(m=>m&&m.alive&&m.faith!==R.faith);if(nb.length){const B=nb[(rng()*nb.length)|0],resist=B.faith>=0&&godOf(B.faith)===myGod()?(B.devotion??.3):0;
      if(rng()>resist){B.faith=R.faith;B.devotion=.5;propsDirty=true;log(`${R.name} whispered to ${B.name}, and ${B.name} turned to ${f.name}.`,'faith')}else log(`${R.name} reached for ${B.name}, but its people held to their faith in you.`,'faith')}}
  else if(r<.7){for(const m of mine){m.pop*=1.03;m.devotion=clamp((m.devotion??.3)+.05,0,1)}log(`${R.name} blessed its followers with a rich harvest.`,'faith')}
  else{const mineYou=nations.filter(m=>m.alive&&m.faith>=0&&godOf(m.faith)===myGod());if(mineYou.length){const V=mineYou[(rng()*mineYou.length)|0];if(rng()<.5&&!V.famine)startFamine(V,'god',false);else{V.devotion=clamp((V.devotion??.3)-.1,0,1)}log(`${R.name} struck at ${V.name}, one of your own.`,'doom')}}}
/* ---------- quests ---------- */
const QUESTS=[
  {id:'iron',title:'Iron and fire',desc:'Bring any nation to the Iron Age.',reward:100,ok:()=>nations.some(n=>n.alive&&n.era>=2)},
  {id:'sail',title:'Over the horizon',desc:'Reach the Age of Sail.',reward:200,ok:()=>nations.some(n=>n.alive&&n.era>=4)},
  {id:'stars',title:'To the stars',desc:'Reach the Future age.',reward:500,ok:()=>nations.some(n=>n.alive&&n.era>=7)},
  {id:'onefaith',title:'One world, one faith',desc:'Every nation follows one of your faiths (at least four nations).',reward:500,ok:()=>{const al=nations.filter(n=>n.alive);return al.length>=4&&al.every(n=>n.faith>=0&&godOf(n.faith)===myGod())}},
  {id:'peace100',title:'The long peace',desc:'A whole century without a single war.',reward:300,ok:()=>{const w=nations.some(n=>n.alive&&n.wars.size);if(w){GODW.quests.lastWar=year;return false}return year-(GODW.quests.lastWar??year)>=100}},
  {id:'cities',title:'Ten great cities',desc:'Have ten cities of level 8 or more at once.',reward:200,ok:()=>{let c=0;for(const n of nations)if(n.alive)n.cities.forEach((t,k)=>{if((typeof townLevel==='function'?townLevel(n,k===0):cityLevel(n))>=8)c++});return c>=10}},
  {id:'faiths3',title:'Many paths',desc:'Have three faiths alive at once.',reward:150,ok:()=>new Set(nations.filter(n=>n.alive&&n.faith>=0).map(n=>n.faith)).size>=3},
  {id:'hero3',title:'A legend',desc:'Raise a hero who wins three battles.',reward:150,ok:()=>nations.some(n=>n.alive&&n.hero&&n.hero.wins>=3)},
  {id:'nofamine',title:'Bread for all',desc:'Two hundred years without a famine anywhere.',reward:250,ok:()=>{if(nations.some(n=>n.alive&&n.famine>0)){GODW.quests.lastFam=year;return false}return year-(GODW.quests.lastFam??year)>=200}},
  {id:'union',title:'Two become one',desc:'Unite two nations into one.',reward:100,ok:()=>nations.some(n=>n.alive&&n.unions&&n.unions.length)},
  {id:'slayer',title:'Dragon slayer',desc:'Have a monster slain by a hero.',reward:150,ok:()=>!!(milestones.has('dragon')||milestones.has('beast'))&&!GODW.monsters.length&&GODW.quests.monsterSeen},
  {id:'empire',title:'An empire',desc:'One nation holds a third of all claimed land.',reward:200,ok:()=>{let t=0,m=0;for(const n of nations)if(n.alive){t+=n.tiles;m=Math.max(m,n.tiles)}return t>0&&m>t/3}},
  {id:'golden3',title:'Golden ages',desc:'Three nations in a golden age at once.',reward:200,ok:()=>nations.filter(n=>n.alive&&(n.golden||0)>year).length>=3},
  {id:'banish',title:'Only god',desc:'Wake a rival god, then banish it.',reward:300,ok:()=>milestones.has('banish')}];
function questTick(){if(GODW.monsters.length)GODW.quests.monsterSeen=true;for(const q of QUESTS){if(GODW.quests[q.id])continue;let ok=false;try{ok=q.ok()}catch(e){}
    if(ok){GODW.quests[q.id]=year;belief+=q.reward;log(`Quest done: ${q.title}. You gained ${q.reward} belief.`,'era');if(typeof toast==='function')toast('Quest done: '+q.title,`+${q.reward} belief.`);if(typeof sfx==='function')sfx('chime')}}}
TABS.push('Quests');
{const _rc=renderCards;renderCards=function(){if(curTab!=='Quests')return _rc.apply(this,arguments);const done=QUESTS.filter(q=>GODW.quests[q.id]).length;
  $('#cards').innerHTML=`<div class="qlist" style="display:flex;gap:8px;overflow-x:auto;padding:2px 2px 6px">${QUESTS.map(q=>{const d=GODW.quests[q.id];return `<div class="pc" style="min-width:150px;text-align:left;cursor:default;${d?'opacity:.6':''}">${svg(d?'quest':'flag')}<b>${esc(q.title)}</b><small style="white-space:normal">${esc(q.desc)}</small><small>${d?'Done in year '+d:'+'+q.reward+' belief'}</small></div>`}).join('')}</div><small style="opacity:.7;padding:0 4px">${done} of ${QUESTS.length} done</small>`}}
/* ---------- turn back time ---------- */
const TIME_SNAPS=[];let lastSnapY=-1e9;
function timeSnapTick(){if(year-lastSnapY<80||typeof buildSave!=='function')return;lastSnapY=year;try{TIME_SNAPS.push({year,s:JSON.stringify(buildSave())});if(TIME_SNAPS.length>6)TIME_SNAPS.shift()}catch(e){}}
gp({id:'timeback',tab:'Sky',label:'Turn back time',cost:150,icon:'hourglass',hint:'Go back to an earlier moment of this world and let history take another road. The world remembers the last few centuries.'},(i,n)=>{
  if(gwOnlyHost())return;if(!TIME_SNAPS.length){say('Time has not run long enough yet. Play on for a while first.');return}
  openModal(`<h2>Turn back time</h2><p class="note">Pick a moment to return to. Everything after it is undone.</p><div class="tenets">${TIME_SNAPS.slice().reverse().map((t,k)=>`<button data-timeback="${TIME_SNAPS.length-1-k}"><b>Year ${t.year.toLocaleString('en-US')}</b><small>${year-t.year} years ago</small></button>`).join('')}</div>
    <div class="row"><div class="flex"></div><button class="btn" data-p="close">Cancel</button></div>`)});
document.addEventListener('click',e=>{const b=e.target.closest('[data-timeback]');if(!b)return;const t=TIME_SNAPS[+b.dataset.timeback];closeModal();if(!t||!spend(150))return;const bl=belief,now=year;
  try{const d=JSON.parse(t.s);applySave(d);TIME_SNAPS.length=TIME_SNAPS.indexOf(t)+1;lastSnapY=year;belief=bl;startPlaying(false);log(`You turned back time from year ${now} to year ${year}. History may take another road.`,'sky');toast('Time turned back',`It is year ${year} again.`)}catch(e){toast('Time would not turn','Something held it in place.')}});
/* ---------- the chronicle: a book of the world, a page per century with a map ---------- */
function chronTick(){const c=Math.floor(year/100);if(GODW.chron.length&&GODW.chron[GODW.chron.length-1].c===c)return;
  let img=null;try{const cv=document.createElement('canvas');cv.width=160;cv.height=Math.round(160*H/W);cv.getContext('2d').drawImage(mini,0,0,cv.width,cv.height);img=cv.toDataURL('image/jpeg',.6)}catch(e){}
  const al=nations.filter(n=>n.alive);GODW.chron.push({c,year,img,nations:al.length,era:al.reduce((m,n)=>Math.max(m,n.era),0),big:al.slice().sort((a,b)=>b.pop-a.pop).slice(0,3).map(n=>n.name)});if(GODW.chron.length>60)GODW.chron.splice(1,1)}
function chronicleHTML(full){const pages=GODW.chron.map((p,k)=>{const next=GODW.chron[k+1],y1=next?next.year:year;const ev=(annals||[]).filter(a=>a.y>=p.year&&a.y<y1).slice(0,full?40:8);
    return `<section style="margin:0 0 18px"><h3 style="margin:0 0 4px">${p.c*100}–${p.c*100+99}</h3><p class="note" style="margin:0 0 6px">${ERAS[p.era]?ERAS[p.era].name:''} · ${p.nations} nations · greatest: ${esc(p.big.join(', '))}</p>
      ${p.img?`<img src="${p.img}" alt="Map of the world around year ${p.year}" style="width:160px;border-radius:6px;float:right;margin:0 0 6px 10px">`:''}<ul style="margin:0;padding-left:18px">${ev.map(a=>`<li><b>${a.y}</b> ${esc(a.t)}</li>`).join('')||'<li>A quiet century.</li>'}</ul><div style="clear:both"></div></section>`}).join('');
  return `<h2>The chronicle of ${esc(worldOpts.name||'this world')}</h2>${pages||'<p>The chronicle begins in the first century.</p>'}`}
function openChronicle(){openModal(`<div style="max-height:70vh;overflow:auto">${chronicleHTML(false)}</div><div class="row"><button class="btn" id="chronDl">Download the book</button><div class="flex"></div><button class="btn" data-p="close">Close</button></div>`);
  $('#chronDl').onclick=()=>{const html=`<!doctype html><meta charset="utf-8"><title>${esc(worldOpts.name||'Faithbound')} chronicle</title><style>body{font:16px/1.5 Georgia,serif;max-width:760px;margin:40px auto;padding:0 16px;color:#2a2418;background:#f6f0e2}h3{border-bottom:1px solid #c9b88a}.note{color:#6a5a3a}</style>${chronicleHTML(true)}`;
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([html],{type:'text/html'}));a.download=(worldOpts.name||'faithbound').replace(/[^a-z0-9]+/gi,'-')+'-chronicle.html';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}}
{const _op=openPause;openPause=function(){_op.apply(this,arguments);const m=$('#modalBox .menu');if(m&&!m.querySelector('[data-chron]')){const b=document.createElement('button');b.className='btn';b.dataset.chron='1';b.textContent='Chronicle';m.insertBefore(b,m.querySelector('[data-p="settings"]'))}}}
document.addEventListener('click',e=>{if(e.target.closest('[data-chron]')){closeModal();openChronicle()}});

/* ======================= EVERY YEAR ======================= */
function bridgeTick(){GODW.bridges=GODW.bridges.filter(b=>{if(year<b.until)return true;for(const [j,v] of b.tiles)h[j]=v;terrainDirty=true;log('The sea closed over the old land bridge.','sky');return false});
  if(GODW.fog)GODW.fog=GODW.fog.filter(f=>year<f.until)}
function boomTick(){for(const n of nations){if(!n.alive||!n.boom)continue;if(n.boom>year){n.pop*=1.014}else{if(n.pop>n.cap*1.05&&!n.famine&&rng()<.5)startFamine(n,'hunger',false);delete n.boom}}}
function blessTick(){for(const n of nations){if(!n.alive)continue;for(const c of n.cities)if(c.blessed){n.pop*=1.0012;n.happy=clamp((n.happy??.6)+.001,0,1)}heirTick(n)}}
{const _t=tick;tick=function(){_t.apply(this,arguments);for(const f of [sinkTick,peakTick,coldTick,relicTick,routeTick,martyrTick,vassalTick,marriageTick,ratTick,monsterTick,fireTick,banditTick,bridgeTick,boomTick,blessTick,favourTick,rivalTick,questTick,timeSnapTick,chronTick])try{f()}catch(e){console.warn('godworks',f.name,e)}}}
/* harvests feel the sky: rainbows help, hail and the great cold hurt */
{const _ho=harvestOf;harvestOf=function(n){let H=_ho.apply(this,arguments);if((n.rainbow||0)>=year)H+=.15;if((n.hail||0)>=year)H-=.3;const c=capOf(n);if(c&&coldAt(c.x,c.y)>.2)H-=.25;return clamp(H,.3,1.4)}}
/* a fleet in the fog never finds its target */
if(typeof vikingArrive==='function'){const _va=vikingArrive;vikingArrive=function(s){if(!s.homeward&&inFog(wx(s.target%W),wz((s.target/W)|0))){log('A Viking fleet lost its way in the fog and turned for home.','sky');return}return _va.apply(this,arguments)}}
/* landmarks in towns: a golden statue where you blessed it, a reliquary where a relic is kept. They belong to the town's own drawing. */
{const _ck=cityKey;cityKey=function(n,c){return _ck.apply(this,arguments)+'|'+(c.blessed?1:0)+(c.relic?1:0)}}
{const _bc=buildCity;buildCity=function(n,c,ci,e,gold,lvl){const r=_bc.apply(this,arguments);try{const cx=wx(c.x),cz=wz(c.y);
  if(c.blessed){const x=cx+.16,z=cz+.12,y=groundY(x,z);add('stone',x,y-.01,z,.045,.03,.045,0,0xd8d0c0);add('cyl',x,y+.02,z,.012,.05,.012,0,0xe0b040);add('cyl',x,y+.07,z,.016,.016,.016,0,0xf0c850)}
  if(c.relic){const x=cx-.15,z=cz-.12,y=groundY(x,z);add('stone',x,y-.02,z,.08,.07,.08,0,0xece6da);add('dome',x,y+.05,z,.07,.06,.07,0,0xe0b040);add('cyl',x,y+.1,z,.004,.04,.004,0,0xf0c850)}}catch(e){}return r}}
/* the nation card tells how a nation feels about you, and whose vassal it is */
{const _rn=renderNationCard;renderNationCard=function(){_rn.apply(this,arguments);const n=nations[selected];if(!n||!n.alive)return;const kv=document.querySelector('#nationCard .kv');if(!kv||kv.querySelector('[data-fav]'))return;
  const d=document.createElement('div');d.dataset.fav='1';d.innerHTML=`<span>Feels about you</span><b>${favourWord(n)}</b>`;kv.appendChild(d);
  if(n.vassalOf!=null&&nations[n.vassalOf]){const v=document.createElement('div');v.innerHTML=`<span>Vassal of</span><b>${esc(nations[n.vassalOf].name)}</b>`;kv.appendChild(v)}
  const rel=n.cities.filter(c=>c.relic);if(rel.length){const v=document.createElement('div');v.innerHTML=`<span>Relic</span><b>${esc(rel[0].relic.name)}</b>`;kv.appendChild(v)}
  if(typeof fishWord==='function'&&n.fishTowns){const v=document.createElement('div');v.innerHTML=`<span>Fishing</span><b>${fishWord(n)}</b>`;kv.appendChild(v)}}}

/* ======================= EVERY FRAME ======================= */
function monsterMesh(m){const g=new THREE.Group(),dark=stdMat({color:colL(m.kind==='dragon'?0x6a1e1a:0x2a2622),roughness:.7}),belly=stdMat({color:colL(m.kind==='dragon'?0xb88a4a:0x4a4038),roughness:.8}),eye=new THREE.MeshBasicMaterial({color:m.kind==='dragon'?0xffc030:0xff3020});
  const box=(sx,sy,sz,x,y,z,mat,par)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),mat);o.position.set(x,y,z);o.castShadow=true;(par||g).add(o);return o};
  if(m.kind==='dragon'){const body=new THREE.Mesh(new THREE.SphereGeometry(.06,12,8),dark);body.scale.set(2.2,.9,1);body.castShadow=true;g.add(body);
    const neck=box(.09,.03,.03,.13,.04,0,dark);neck.rotation.z=.6;const head=box(.06,.035,.035,.19,.08,0,dark);box(.012,.008,.008,.215,.09,.012,eye,g);box(.012,.008,.008,.215,.09,-.012,eye,g);
    const tail=box(.18,.02,.02,-.2,-.01,0,dark);tail.rotation.z=-.2;box(.1,.02,.06,0,-.035,0,belly);
    for(const s of [-1,1]){const wg=new THREE.Group();wg.position.set(.01,.03,s*.04);const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,-.12,0,s*.26,.08,0,s*.22,0,0,0,.08,0,s*.22,.1,0,0],3));geo.computeVertexNormals();
      const w=new THREE.Mesh(geo,stdMat({color:colL(0x8a2a22),roughness:.8,side:THREE.DoubleSide}));w.castShadow=true;wg.add(w);g.add(wg);(g.userData.wings=g.userData.wings||[]).push([wg,s])}}
  else{box(.12,.05,.05,0,.06,0,dark);box(.05,.045,.04,.08,.075,0,dark);box(.03,.02,.025,.115,.068,0,dark);box(.008,.006,.006,.1,.088,.012,eye);box(.008,.006,.006,.1,.088,-.012,eye);
    for(const s of [-1,1])box(.012,.02,.01,.075,.105,s*.012,dark);const legs=[];for(const [a,b] of [[1,1],[1,-1],[-1,1],[-1,-1]])legs.push(box(.014,.05,.014,a*.04,.02,b*.016,dark));g.userData.legs=legs;box(.08,.012,.012,-.09,.07,0,dark).rotation.z=.4}
  g.scale.setScalar(m.kind==='dragon'?1.05:1.3);scene.add(g);return g}
function monsterFrame(dt,now){for(const m of GODW.monsters){if(!m.g)m.g=monsterMesh(m);m.t+=dt;
    if(Math.hypot(m.tx-m.x,m.tz-m.z)<.15){const a=rng()*6.28,r=.5+rng()*(m.kind==='dragon'?4:2.5);m.tx=m.hx+Math.cos(a)*r;m.tz=m.hz+Math.sin(a)*r;
      /* now and then it goes for a town */const near=cityNear(tileAt(m.hx,m.hz),m.kind==='dragon'?6:4);if(near&&rng()<.35){m.tx=wx(near.c.x)+(rng()-.5)*.3;m.tz=wz(near.c.y)+(rng()-.5)*.3}}
    const dx=m.tx-m.x,dz=m.tz-m.z,d=Math.hypot(dx,dz)||1,sp=(m.kind==='dragon'?.45:.25)*dt*(speedIdx?1:0);m.x+=dx/d*Math.min(sp,d);m.z+=dz/d*Math.min(sp,d);
    const g=m.g,gy=Math.max(groundY(m.x,m.z),waterY);g.rotation.y=Math.atan2(-dz,dx);
    if(m.kind==='dragon'){g.position.set(m.x,gy+.45+Math.sin(now/600)*.05,m.z);for(const [w,s] of g.userData.wings)w.rotation.x=s*Math.sin(now/180)*.7;
      const town=cityNear(tileAt(m.x,m.z),.8);if(town&&rng()<dt*4){const fx2=m.x+(rng()-.5)*.25,fz2=m.z+(rng()-.5)*.25,fy=groundY(fx2,fz2);emit('fire',fx2,fy+.02,fz2);emit('smoke',fx2,fy+.08,fz2)}}
    else{g.position.set(m.x,gy,m.z);g.userData.legs.forEach((l,k)=>l.rotation.z=Math.sin(now/90+k*1.6)*.5*(sp>0?1:0))}}}
function routeFrame(R2){for(const r of GODW.routes){const ax=wx(r.a[0]),az=wz(r.a[1]),bx=wx(r.b[0]),bz=wz(r.b[1]),L=Math.hypot(bx-ax,bz-az);if(L<.1)continue;
    for(let s=.3;s<L-.2;s+=.55){const x=lerp(ax,bx,s/L),z=lerp(az,bz,s/L),ex=x-camT.x,ez=z-camT.z;if(ex*ex+ez*ez>R2*3)continue;const y=groundY(x,z);if(y<waterY)continue;add('gwBox',x,y,z,.05,.03,.05,s,0xa8a090);add('gwBox',x,y+.03,z,.035,.025,.035,s+.5,0xb8b0a0);add('gwCone',x,y+.055,z,.025,.03,.025,s,0xc8c0b0)}}}
function banditFrame(R2){for(const b of GODW.bandits){const x=wx(b.i%W),z=wz((b.i/W)|0),ex=x-camT.x,ez=z-camT.z;if(ex*ex+ez*ez>R2*3)continue;const y=groundY(x,z);
    for(let k=0;k<3;k++){const a=k*2.1,tx=x+Math.cos(a)*.11,tz=z+Math.sin(a)*.11;add('gwCone',tx,groundY(tx,tz),tz,.085,.08,.085,a,k?0xb09a70:0x8a5a3a)}if(rng()<.15){emit('fire',x,y+.01,z);emit('smoke',x,y+.05,z)}}}
function peakFrame(R2){for(const p of GODW.peaks){const x=wx(p.i%W),z=wz((p.i/W)|0),ex=x-camT.x,ez=z-camT.z;if(ex*ex+ez*ez>R2*4)continue;const y=groundY(x,z);
    add('gwBox',x,y,z,.05,.04,.05,0,0xece6da);add('gwCone',x,y+.04,z,.06,.04,.06,0,p.faith>=0&&faiths[p.faith]?parseInt(faiths[p.faith].color.slice(1),16):0xd8b860);if(rng()<.1)emit('holy',x,y+.08,z)}}
let FOG_TEX=null;const FOG_G=new Map();
function fogTex(){if(FOG_TEX)return FOG_TEX;const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,2,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.5,'rgba(255,255,255,.5)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);FOG_TEX=new THREE.CanvasTexture(c);return FOG_TEX}
function fogFrame(){const live=new Set(GODW.fog||[]);for(const [f,g] of FOG_G)if(!live.has(f)){scene.remove(g);g.children.forEach(s=>s.material.dispose());FOG_G.delete(f)}
  const t=performance.now()/1000;for(const f of live){let g=FOG_G.get(f);if(!g){g=new THREE.Group();for(let k=0;k<26;k++){const m=new THREE.SpriteMaterial({map:fogTex(),color:0xdfe4e8,transparent:true,opacity:0,depthWrite:false,fog:true});const sp=new THREE.Sprite(m);
        const a=rng()*6.28,r=Math.sqrt(rng())*f.r;sp.userData={x:Math.cos(a)*r,z:Math.sin(a)*r,s:2.2+rng()*2.4,ph:rng()*6.28};sp.scale.set(sp.userData.s,sp.userData.s*.55,1);g.add(sp)}g.userData.t0=performance.now();scene.add(g);FOG_G.set(f,g)}
    g.position.set(f.x,waterY+.25,f.z);const fade=Math.min(1,Math.max(0,(f.until-year-(typeof yearFrac!=='undefined'?yearFrac:0))*1.5));
    for(const sp of g.children){const u=sp.userData;sp.position.set(u.x+Math.sin(t*.1+u.ph)*.6,Math.sin(t*.3+u.ph)*.05,u.z+Math.cos(t*.08+u.ph)*.6);sp.material.opacity=.45*fade*Math.min(1,(performance.now()-g.userData.t0)/2500)}}
  for(const s of ships)if(!s.sink&&inFog(s.x,s.z))s.hold=Math.max(s.hold||0,.3)}
function burnFrame(now){GODW.burning=GODW.burning.filter(b=>b.rebuild>year);for(const b of GODW.burning){if(!b.t||now-b.t>b.dur)continue;const x=wx(b.x),z=wz(b.y);if(Math.hypot(x-camT.x,z-camT.z)>camDist*1.6+3)continue;
    for(let k=0;k<3;k++){const a=rng()*6.28,r=Math.sqrt(rng())*.55,px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r,py=groundY(px,pz);emit('fire',px,py+.03,pz);if(rng()<.6)emit('dark',px,py+.15,pz);if(rng()<.4)emit('ember',px,py+.08,pz)}
    if(typeof fireLight!=='undefined'){fireLight.position.set(x,groundY(x,z)+.4,z);fireLight.intensity=2.4+Math.sin(now/90);fireLight.distance=4}}}
{const _ul=updateLiving;updateLiving=function(dt,k,now){const r=_ul.apply(this,arguments);try{kitReset(GW_KITS);const R2=Math.pow(camDist*1.4+3,2);if(camDist<18){routeFrame(R2);banditFrame(R2);peakFrame(R2)}kitCommit(GW_KITS);
  monsterFrame(dt,performance.now());fogFrame();burnFrame(performance.now());coldFrame()}catch(e){console.warn('godworks frame',e)}return r}}
/* sky sights, painted over the scene */
{const _dov=drawOverlay;drawOverlay=function(now){_dov.apply(this,arguments);if(!GW_FX.length||!playing)return;const dpr=ov.width/innerWidth,t=performance.now();
  for(let q=GW_FX.length-1;q>=0;q--){const f=GW_FX[q],age=t-f.t0;if(age>f.dur){GW_FX.splice(q,1);continue}const fade=Math.min(1,age/1500,(f.dur-age)/2500);octx.save();
    if(f.kind==='rainbow'){const [sx,sy,sz]=project(f.x,groundY(f.x,f.z),f.z);if(sz<1){const R=Math.min(ov.width,ov.height)*.35;const cols=['#e04040','#f08a30','#f0d040','#50b050','#4080e0','#7050c0'];
        octx.globalAlpha=.38*fade;octx.lineWidth=R*.035;cols.forEach((c,k)=>{octx.strokeStyle=c;octx.beginPath();octx.arc(sx,sy,R-k*octx.lineWidth,Math.PI,2*Math.PI);octx.stroke()})}}
    if(f.kind==='aurora'){const Wd=ov.width,Hh=ov.height*.4;for(let b=0;b<3;b++){const g=octx.createLinearGradient(0,0,0,Hh);g.addColorStop(0,'rgba(80,255,170,0)');g.addColorStop(.5,b===1?'rgba(170,90,255,.35)':'rgba(80,255,170,.35)');g.addColorStop(1,'rgba(80,255,170,0)');
        octx.fillStyle=g;octx.globalAlpha=fade*.8;octx.beginPath();octx.moveTo(0,Hh);for(let x=0;x<=Wd;x+=Wd/40)octx.lineTo(x,Hh*.25+Math.sin(x/(140*dpr)+t/900+b*2)*Hh*.18+b*Hh*.1);octx.lineTo(Wd,Hh);octx.closePath();octx.fill()}}
    if(f.kind==='comet'){const p=age/f.dur,cx=ov.width*(.15+.7*p),cy=ov.height*(.12+.05*Math.sin(p*3)),L=ov.width*.3;const g=octx.createLinearGradient(cx,cy,cx-L,cy-L*.25);g.addColorStop(0,'rgba(255,255,240,.95)');g.addColorStop(1,'rgba(160,200,255,0)');
      octx.globalAlpha=fade;octx.strokeStyle=g;octx.lineWidth=10*dpr;octx.lineCap='round';octx.beginPath();octx.moveTo(cx,cy);octx.lineTo(cx-L,cy-L*.25);octx.stroke();octx.fillStyle='#fffbe8';octx.shadowColor='#bcd8ff';octx.shadowBlur=24*dpr;octx.beginPath();octx.arc(cx,cy,7*dpr,0,7);octx.fill()}
    if(f.kind==='bloodmoon'){octx.globalAlpha=fade*.22;octx.fillStyle='#5a0808';octx.fillRect(0,0,ov.width,ov.height);octx.globalAlpha=fade;octx.fillStyle='#b8261c';octx.shadowColor='#ff3a20';octx.shadowBlur=40*dpr;octx.beginPath();octx.arc(ov.width*.78,ov.height*.15,34*dpr,0,7);octx.fill()}
    if(f.kind==='reveal'){const [sx,sy,sz]=project(f.x,groundY(f.x,f.z),f.z);const g=octx.createLinearGradient(0,0,0,ov.height);g.addColorStop(0,'rgba(255,240,190,.75)');g.addColorStop(1,'rgba(255,240,190,0)');
      octx.globalAlpha=fade;octx.fillStyle=g;const w=ov.width*.12;octx.fillRect((sz<1?sx:ov.width/2)-w/2,0,w,ov.height);octx.globalAlpha=fade*.25;octx.fillStyle='#fff6d8';octx.fillRect(0,0,ov.width,ov.height)}
    octx.restore()}}}
