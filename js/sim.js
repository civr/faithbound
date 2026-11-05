"use strict";
/* Faithbound — world generation, simulation, fleets, saving */

function genWorld(seedIn){
  for(const s of ships)disposeShip(s);ships=[];for(const r of rockets)scene.remove(r.g);rockets=[];walkers=[];parts=[];eruptions=[];
  const S=SIZES[sizeKey];N=S.W*S.H;resetDisasters();folk={};folkId=0;houses=[];W=S.W;H=S.H;N=W*H;
  const seed=seedIn||((rng()*1e9)|0);worldSeed=seed;hseed=(seed%9973)/7;
  const n1=makeNoise(seed),n2=makeNoise(seed+77),n3=makeNoise(seed+191),WO=worldOpts,sc=S.sc*(WO.frag||1);
  h=new Float32Array(N);baseMoist=new Float32Array(N);moistD=new Float32Array(N);warmD=null;
  owner=new Int16Array(N).fill(-1);biome=new Uint8Array(N);hab=new Float32Array(N);
  let mn=9,mx=-9,mm=9,mM=-9;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,nx=x/W,ny=y/H;
    let e=n1(nx*sc,ny*sc*H/W*1.35,6);const ridge=1-Math.abs(n3(nx*sc*1.6,ny*sc*1.6,4)-.5)*2;e+=Math.pow(ridge,3)*.18*(e>.5?1:.3);
    h[i]=e;mn=Math.min(mn,e);mx=Math.max(mx,e);const m=n2(nx*sc*1.4,ny*sc*1.4,4);baseMoist[i]=m;mm=Math.min(mm,m);mM=Math.max(mM,m)}
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,dx=(x/(W-1)-.5)*2,dy=(y/(H-1)-.5)*2,d=Math.sqrt(dx*dx*.85+dy*dy);
    h[i]=clamp((h[i]-mn)/(mx-mn)*.95+.12-Math.pow(d,2.6)*.45,0,1);baseMoist[i]=(baseMoist[i]-mm)/(mM-mm)}
  {/* the world sliders: share of land, and how rugged it is */const L=clamp(WO.land??.5,.1,.9),srt=Float32Array.from(h).sort(),q=srt[Math.floor((1-L)*(N-1))],sh=.44-q,mt=WO.mtn??1;
    let A=.01;for(let i=0;i<N;i++)A=Math.max(A,h[i]+sh-.44);
    let D=.01;for(let i=0;i<N;i++)D=Math.max(D,.44-(h[i]+sh));
    for(let i=0;i<N;i++){let v=h[i]+sh;if(v>.44)v=.44+.56*mt*Math.pow((v-.44)/A,1.75);else v=.44-.38*Math.pow((.44-v)/D,.6);h[i]=clamp(v,0,1)}}
  genRivers();
  nations=[];faiths=[];logs=[];year=0;ruins=[];warData={};coves=[];belief=100;climate.temp=.5;climate.anth=0;climate.rain=worldOpts.rain??.5;flags={warm:false,sail:false};milestones=new Set();
  selected=-1;inspectTile=-1;selectedFaith=-1;warFrom=-1;moistActive=0;effects=[];
  buildTerrain();computeTerrain();layoutTerrain();
  seedCultures();seedDeposits();indexDeposits();annals=[];endedWars=[];hist=[];snaps=[];worldWars=[];colonies=[];planets={moon:{terra:0,life:0},mars:{terra:0,life:0}};
  let placed=0,tries=0;
  while(placed<S.tribes&&tries<6000){tries++;const i=(rng()*N)|0;if(hab[i]<.7||owner[i]>=0||(tries<4000&&siteScore(i)<.6))continue;
    const x=i%W,y=(i/W)|0;let ok=true;for(const n of nations){const c=n.cities[0];if(Math.hypot(c.x-x,c.y-y)<W/(S.tribes>5?5.5:4.2)){ok=false;break}}
    if(ok){newNation(x,y,{});placed++}}
  log(`A new world rose from the deep. ${placed} tribes wander its shores.`,'era');
  seedClouds();camT.set(0,0,0);camDistT=camDist=Math.max(W,H)*(innerWidth<innerHeight?1.25:.85);camYawT=camYaw=.7;
  propsDirty=true;bordersDirty=true;
}
let worldSeed=0,bordersDirty=true,eruptions=[];

/* rivers: least-cost paths from wet highlands to the sea, carved into the land */
let rivers=[],river=null;
function genRivers(){river=new Uint8Array(N);rivers=[];
  const want=Math.round(({small:6,medium:9,large:13}[sizeKey]||8)*(worldOpts.rivers??1)),src=[];
  for(let q=0;q<4000&&src.length<want*4;q++){const i=(rng()*N)|0;if(h[i]>sea+.16&&h[i]<sea+.42&&baseMoist[i]>.38)src.push(i)}
  const used=[];
  for(const s of src){if(rivers.length>=want)break;const sx=s%W,sy=(s/W)|0;if(used.some(u=>Math.hypot(u%W-sx,((u/W)|0)-sy)<7))continue;
    const dist=new Float32Array(N).fill(1e9),prev=new Int32Array(N).fill(-1),open=[s];dist[s]=0;let end=-1,it=0;
    while(open.length&&it++<6000){let bi=0;for(let q=1;q<open.length;q++)if(dist[open[q]]<dist[open[bi]])bi=q;const i=open[bi];open[bi]=open[open.length-1];open.pop();
      if(h[i]<sea||(river[i]&&i!==s)){end=i;break}const x=i%W,y=(i/W)|0;
      for(let d=0;d<4;d++){const X=x+DX[d],Y=y+DY[d];if(X<0||Y<0||X>=W||Y>=H)continue;const j=Y*W+X;const c=dist[i]+1+Math.max(0,h[j]-h[i])*80+h[j]*3;if(c<dist[j]){if(dist[j]>=1e9)open.push(j);dist[j]=c;prev[j]=i}}}
    if(end<0)continue;const path=[];for(let k=end;k!==-1;k=prev[k])path.push(k);path.reverse();if(path.length<6)continue;
    let cur=h[path[0]];const tiles=[];
    path.forEach((t,k)=>{const last=k===path.length-1;if(!last||h[t]>=sea){h[t]=Math.max(sea+(last?-.01:.004),Math.min(h[t],cur-.0025)-.006);cur=h[t];
        for(let d=0;d<4;d++){const X=t%W+DX[d],Y=((t/W)|0)+DY[d];if(X<0||Y<0||X>=W||Y>=H)continue;const j=Y*W+X;if(!river[j]&&h[j]>h[t])h[j]=Math.max(h[t]+.004,h[j]-.008);baseMoist[j]=Math.min(1,baseMoist[j]+.12)}}
      river[t]=Math.min(4,Math.max(river[t],1+Math.floor(k/7)));tiles.push(t)});
    rivers.push({tiles});used.push(s)}
}
/* a beach only where land actually meets the sea; low inland plains stay green */
function nearSea(x,y){for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=W||Y>=H)return true;if(h[Y*W+X]<sea)return true}return false}
let TNOISE=null;
function computeTerrain(){if(typeof roadCache!=='undefined')roadCache.clear();
  sea=.44+(climate.temp-.5)*.16;
  /* temperature: latitude, height and wandering weather fronts; ice sheets then creep out from where ice already lies */
  if(!TNOISE||TNOISE.length!==N||TNOISE.key!==h[(N/3)|0]){TNOISE=new Float32Array(N);TNOISE.key=h[(N/3)|0];const off=Math.floor(h[(N/3)|0]*9973)%97;const vn=(x,y,s,k)=>{const X=Math.floor(x/s),Y=Math.floor(y/s),fx=x/s-X,fy=y/s-Y,q=(a,b)=>hash((a+k)*157.31+(b-k)*311.7),u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
      return lerp(lerp(q(X,Y),q(X+1,Y),u),lerp(q(X,Y+1),q(X+1,Y+1),u),v)};for(let y=0;y<H;y++)for(let x=0;x<W;x++)TNOISE[y*W+x]=vn(x,y,9,3+off)*.6+vn(x,y,4,11+off)*.3+vn(x,y,2,29+off)*.1-.5}
  const TT=new Float32Array(N);
  for(let y=0;y<H;y++){const lat=1-Math.abs(y/(H-1)-.5)*2;for(let x=0;x<W;x++){const i=y*W+x,alt=h[i]-sea;
    TT[i]=lat*.85+(climate.temp-.5)*.75+.08-Math.max(0,alt)*1.25+TNOISE[i]*.22+(warmD&&warmD.length===N?warmD[i]:0)}}
  for(let pass=0;pass<3;pass++){const T2=TT.slice();for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;let ice=0;for(let d=0;d<4;d++)if(TT[i+DX[d]+DY[d]*W]<.1)ice++;if(ice)T2[i]-=ice*.012}TT.set(T2)}
  for(let y=0;y<H;y++){const lat=1-Math.abs(y/(H-1)-.5)*2;
    for(let x=0;x<W;x++){const i=y*W+x,alt=h[i]-sea;
      const t=TT[i],m=clamp(baseMoist[i]+(climate.rain-.5)*.7+moistD[i],0,1);
      let b;if(alt<0)b=t+TNOISE[i]*.1<.1?2:(alt>-.06?1:0);else if(alt>.38)b=12;else if(alt>.26)b=11;else if(t<.1)b=10;else if(t<.22)b=9;
      else if(alt<.012&&nearSea(x,y))b=3;else if(t>.6&&m<.3)b=7;else if(t>.55&&m<.45)b=8;else if(t>.62&&m>.62)b=6;else if(m>.52)b=5;else b=4;
      biome[i]=b;hab[i]=BIOMES[b].hab;if(river&&river[i]&&alt>=0&&b!==10&&b!==12)hab[i]=Math.min(1,hab[i]+.25);if(owner[i]>=0&&hab[i]<.015)claim(i,-1,'flood')}}
}

/* ---------- cultures: names and buildings follow the region a people comes from ---------- */
const CULTURES={
  west:{label:'Western',pre:['Ash','Bran','Dun','Wick','Hal','Mer','Thorn','Elder','Stan','Gold','Ald','Wen','Roth','Lind','Bel','Cor','Hart','Brom'],suf:['ford','ham','ton','bury','wick','field','mouth','dale','mere','stead','ley','wood','gate','brook','cester']},
  nordic:{label:'Nordic',pre:['Sval','Hrafn','Bjor','Thor','Skag','Frey','Ulf','Ys','Vin','Gunn','Hald','Kval','Sig','Eir','Rau','Tro'],suf:['vik','heim','fjord','by','dal','stad','holm','nes','gard','borg','havn']},
  med:{label:'Mediterranean',pre:['Sal','Vel','Mar','Cas','Por','Ter','Lu','Ard','Ost','Pal','Cor','Ver','Mon','Ser','Cal','Siv'],suf:['ona','ano','ia','ento','ara','etta','ino','ola','eria','enza','ossa','ago','ilia']},
  africa:{label:'African',syl:['ka','zu','mba','ndo','ta','wa','lu','go','sa','ko','bu','nya','ti','ma','ra','fu','djen','tim','ke','sho','na','ba']},
  mideast:{label:'Desert',pre:['Al','Qar','Zah','Sam','Bah','Kad','Mar','Tar','Sid','Hal','Nas','Raq','Ish','Dam'],suf:['abad','ira','esh','qand','ara','um','ad','ish','oun','ah','iyya','ir']},
  meso:{label:'Latin American',syl:['tla','xo','co','ma','te','pan','tzin','chi','que','hua','cal','mi','ix','pa','can','zal','cuz','ya','tu','na']},
  east:{label:'East Asian',syl:['shan','lin','hua','jin','kyo','ta','ka','mei','yun','ro','ha','zhou','sen','to','ri','qi','na','dao','sai','wan']}};
let cultSeeds=[];
function pickCulture(i){const b=biome[i],y=(i/W)|0,lat=1-Math.abs(y/(H-1)-.5)*2,r=rng();
  if(b===7)return r<.6?'mideast':'africa';if(b===8)return r<.75?'africa':'meso';if(b===6)return r<.55?'meso':'east';
  if(lat<.35||b===9)return r<.8?'nordic':'west';
  if(lat>.7)return ['med','meso','east','africa','mideast'][(r*5)|0];
  return ['west','west','east','med','meso','nordic','east'][(r*7)|0]}
function seedCultures(){cultSeeds=[];const k=6+((rng()*3)|0);let tries=0;
  while(cultSeeds.length<k&&tries<2000){tries++;const i=(rng()*N)|0;if(isWater(i))continue;cultSeeds.push({x:i%W,y:(i/W)|0,c:pickCulture(i)})}
  const kinds=new Set(cultSeeds.map(s=>s.c)),all=Object.keys(CULTURES);for(const s of cultSeeds){if(kinds.size>=4)break;const m=all.find(c=>!kinds.has(c));if(m){s.c=m;kinds.add(m)}}}
function cultureAt(x,y){if(!cultSeeds.length)return 'west';let best=cultSeeds[0],bd=1e9;for(const s of cultSeeds){const d=Math.hypot(s.x-x,s.y-y);if(d<bd){bd=d;best=s}}return best.c}
function cultureName(cul){const C=CULTURES[cul]||CULTURES.west,pk=a=>a[(rng()*a.length)|0];
  if(C.pre)return pk(C.pre)+pk(C.suf);let s='';const k=2+(rng()<.5?1:0);for(let i=0;i<k;i++)s+=pk(C.syl);return s[0].toUpperCase()+s.slice(1)}
const cultOf=n=>n&&n.culture||'west';

/* ---------- nations ---------- */
function newNation(x,y,o){
  const id=nations.length,color=NCOL[id%NCOL.length];
  const culture=o.culture||cultureAt(x,y);
  let nm=o.name||cultureName(culture);if(nations.some(m=>m.alive&&m.name===nm))nm=['Free ','New ','Upper ','Lower ','Greater '][(rng()*5)|0]+nm;
  const n={id,culture,allies:[],devotion:.3,festival:0,name:nm,color,rgb:hexRgb(color),pop:o.pop!=null?o.pop:20,tech:0,era:0,tiles:0,cap:20,
    aggr:.2+rng()*.7,faith:-1,gov:null,techs:[],research:null,known:[],trade:[],ties:[],ruler:null,house:null,reigns:[],wars:new Set(),cities:[],alive:true,bless:0,plague:0,born:year,nb:new Set(),wonder:0,front:[],_walk:0,kills:0};
  n.gov=o.gov||(n.aggr>.6?'chiefdom':'tribal');n.stab=.6;n.flag=makeFlag(n,null);nations.push(n);
  if(o.claim!==false){n.cities.push({x,y,name:n.name,born:year});
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;
      const j=Y*W+X;if(owner[j]<0&&(hab[j]>=.1||(dx===0&&dy===0)))claim(j,id)}}
  bordersDirty=true;return n;
}
function claim(j,nid,why){
  const prev=owner[j];if(prev===nid)return;const x=j%W,y=(j/W)|0;
  if(prev>=0){const P_=nations[prev];P_.tiles--;const ci=P_.cities.findIndex(c=>c.x===x&&c.y===y);
    if(ci>=0){const c=P_.cities.splice(ci,1)[0];
      if(nid>=0){if(c.origin==null)c.origin=prev;c.conq=year;nations[nid].cities.push(c);if(ci===0&&P_.tiles>0)log(`${nations[nid].name} captured ${c.name}, capital of ${P_.name}.`,'war')}
      else log(why==='flood'?`The city of ${c.name} was lost to the rising sea.`:`The city of ${c.name} was destroyed.`,'doom');propsDirty=true}}
  owner[j]=nid;if(nid>=0)nations[nid].tiles++;bordersDirty=true;
}
function nearCity(x,y,d){for(const n of nations){if(!n.alive)continue;for(const c of n.cities)if(Math.abs(c.x-x)<d&&Math.abs(c.y-y)<d)return true}return false}
/* towns want flat, fertile ground: valleys, river banks and coasts, never a mountainside */
const SL_CITY=.5;
const flatOk=j=>tslope.length===N?tslope[j]<SL_CITY:true;
function rugged(j){const x=j%W,y=(j/W)|0;let m=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const q=Y*W+X;if(h[q]>sea)m=Math.max(m,Math.abs(h[q]-h[j]))}return m}
function siteScore(j){if(hab[j]<.45||!flatOk(j)||biome[j]>=10||h[j]-sea>.2||rugged(j)>.045)return -1;let s=hab[j]-(tslope.length===N?tslope[j]:0)*.8;if(river[j])s+=.35;if(deposits.length&&nearDeposit(j,2.5))s+=.3;
  const x=j%W,y=(j/W)|0;for(let d=0;d<4;d++){const X=x+DX[d],Y=y+DY[d];if(X>=0&&Y>=0&&X<W&&Y<H&&isWater(Y*W+X)){s+=.25;break}}return s}
function bestSite(A,x,y,r){let best=-1,bs=-1;for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const j=Y*W+X;
  if(owner[j]!==A.id)continue;const sc=siteScore(j);if(sc>bs){bs=sc;best=j}}return best}
/* rivers and ridges slow a nation down, so borders tend to settle on them */
function terrFactor(i,j){let f=1;if((river[i]>0)!==(river[j]>0))f*=.3;if(tslope.length===N)f*=clamp(1.25-tslope[j]*.9,.2,1);if(biome[j]===11||biome[j]===12)f*=.35;return f}
function maybeCity(A,x,y,j){if(rng()>.07)return;j=bestSite(A,x,y,1);if(j<0)return;x=j%W;y=(j/W)|0;if(nearCity(x,y,3))return;A.cities.push({x,y,name:cultureName(cultOf(A)),origin:A.id,born:year});propsDirty=true;
  if(!milestones.has('city2')){milestone('city2','A second city rises','The '+A.name+' founded a new town.')}}
function foundTown(A,x,y,j){if((A.tiles/Math.max(1,A.cities.length))<9)return;j=bestSite(A,x,y,2);if(j<0)return;x=j%W;y=(j/W)|0;if(nearCity(x,y,3))return;A.cities.push({x,y,name:cultureName(cultOf(A)),origin:A.id,born:year});propsDirty=true}
const mil=n=>n.pop/Math.max(1,n.tiles)*ERAS[n.era].mil*ten(n).mil*(n.gpMil||1)*(n.bless>0?1.3:1)*(n.hero&&n.hero.until>year?1.6:1);
/* ---------- alliances: sworn friends join each other's wars ---------- */
const allied=(a,b)=>!!(a.allies&&a.allies.includes(b.id));
function ally(a,b,god){if(a===b||!a.alive||!b.alive||allied(a,b))return;if(a.wars.has(b.id))makePeace(a,b,false);a.allies=a.allies||[];b.allies=b.allies||[];a.allies.push(b.id);b.allies.push(a.id);
  log(god?`By your will, ${a.name} and ${b.name} swore an alliance.`:`${a.name} and ${b.name} formed an alliance.`,'life');milestone('ally','Sworn allies','Two nations bound themselves in alliance.')}
function breakAlliance(a,b,god){if(!allied(a,b))return;a.allies=a.allies.filter(x=>x!==b.id);b.allies=b.allies.filter(x=>x!==a.id);
  log(god?`You broke the alliance between ${a.name} and ${b.name}.`:`The alliance between ${a.name} and ${b.name} fell apart.`,'war')}
function allianceTick(n){if(!n.known)return;
  for(const id of n.known){const m=nations[id];if(!m||!m.alive||m.id<=n.id)continue;
    const shared=[...n.wars].some(w=>m.wars.has(w)),sameFaith=n.faith>=0&&n.faith===m.faith;
    if(allied(n,m)){if(!shared&&rng()<.0015*(sameFaith?.4:1))breakAlliance(n,m,false);continue}
    if(n.wars.has(m.id)||(n.allies||[]).length>=3||(m.allies||[]).length>=3)continue;
    const p=.0012*(shared?7:1)*(sameFaith?2:1)*(n.trade.includes(m.id)?1.6:1)*(n.ties&&n.ties.includes(m.id)?2:1)*(n.aggr<.45&&m.aggr<.45?1.5:1);
    if(rng()<p)ally(n,m,false)}}
function startWar(a,b,kind){
  if(a===b||a.wars.has(b.id))return;
  if(a.pacts&&a.pacts[b.id]>year){if(!kind)return;/* only a god's hand breaks a sworn treaty */delete a.pacts[b.id];if(b.pacts)delete b.pacts[a.id];log(`${a.name} broke its treaty with ${b.name}.`,'war')}
  if(allied(a,b)){breakAlliance(a,b,false);log(`${a.name} betrayed its ally ${b.name}.`,'war')}a.wars.add(b.id);b.wars.add(a.id);bordersDirty=true;meet(a,b);
  if(a.trade.includes(b.id)){a.trade=a.trade.filter(x=>x!==b.id);b.trade=b.trade.filter(x=>x!==a.id);if(kind!=='rebel')log(`The trade between ${a.name} and ${b.name} collapsed.`,'war')}
  if(kind==='god')log(`By your hand, ${a.name} marched on ${b.name}.`,'war');
  else if(kind!=='rebel'){const why=a.faith>=0&&a.faith!==b.faith?` in the name of ${faiths[a.faith].name}`:'';log(`${a.name} declared war on ${b.name}${why}.`,'war')}
  milestone('war','First war','Blood was spilled between nations.');
  if(kind==='ally')return;
  /* the call to arms: allies of the attacked rush to help, allies of the attacker sometimes follow */
  for(const id of [...(b.allies||[])]){const C=nations[id];if(!C||!C.alive||C===a||C.wars.has(a.id)||allied(C,a))continue;if(rng()<.75*mood().ally&&warRoom(1)){startWar(C,a,'ally');log(`${C.name} joined the war on the side of its ally ${b.name}.`,'war')}}
  for(const id of [...(a.allies||[])]){const C=nations[id];if(!C||!C.alive||C===b||C.wars.has(b.id)||allied(C,b))continue;if(rng()<.35*mood().ally&&warRoom(1)){startWar(C,b,'ally');log(`${C.name} marched with its ally ${a.name}.`,'war')}}
}
/* ---------- wars: campaigns along the front, sieges of towns, and peace terms ---------- */
let warData={},ruins=[];
const warKey=(a,b)=>a.id<b.id?a.id+'-'+b.id:b.id+'-'+a.id;
function frontPairs(A,B){const out=[];for(let i=0;i<N;i++){if(owner[i]!==A.id)continue;const x=i%W,y=(i/W)|0;
  for(let d=0;d<4;d++){const X=x+DX[d],Y=y+DY[d];if(X<0||Y<0||X>=W||Y>=H)continue;const j=Y*W+X;if(owner[j]===B.id)out.push([i,j])}}return out}
/* push into enemy land: take the tile and a little of what lies behind it */
/* fronts move as a line: a tile is easy to take when the attacker already holds two sides of it, hard when it would make a spike */
function frontW(A,j){const x=j%W,y=(j/W)|0;let c=0;for(let d=0;d<4;d++){const X=x+DX[d],Y=y+DY[d];if(X>=0&&Y>=0&&X<W&&Y<H&&owner[Y*W+X]===A.id)c++}return [0,.22,1,1,1][c]}
function advance(A,B,j){if(rng()>frontW(A,j))return;claim(j,A.id);const x=j%W,y=(j/W)|0;for(let d=0;d<4;d++){const X=x+DX[d],Y=y+DY[d];if(X<0||Y<0||X>=W||Y>=H)continue;const k=Y*W+X;
  if(owner[k]===B.id&&!cityAtTile(k)&&rng()<.35*frontW(A,k))claim(k,A.id)}}
function besieged(c,A){/* attacker land within two tiles of the town */let n=0;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const X=c.x+dx,Y=c.y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;if(owner[Y*W+X]===A.id)n++}return n}
function siegeTick(A,B,w,sg){
  for(const c of [...B.cities]){const near=besieged(c,A);if(!near){c.siege=Math.max(0,(c.siege||0)-.1);continue}
    const sa=mil(A)*(1+near*.15),sb=mil(B)*(c===B.cities[0]?1.6:1)*(1+(c.walls||0));
    c.siege=(c.siege||0)+Math.max(.025,.12*sa/(sa+sb))*(1+A.era*.05);c.besiegedBy=A.id;
    if(c.siege<1)continue;
    c.siege=0;c.besiegedBy=-1;const i=c.y*W+c.x,cap=c===B.cities[0];
    const razeP=(A.era<=2?.45:A.era<=4?.25:.1)+(A.faith>=0&&A.faith!==B.faith?.15:0)+(A.aggr>.75?.1:0);
    if(rng()<razeP){/* sacked and burned */const k=B.cities.indexOf(c);if(k>=0)B.cities.splice(k,1);if(typeof refugees==='function')refugees(B,A,B.pop*.18);B.pop*=.82;
      ruins.push({x:c.x,y:c.y,year,name:c.name});claim(i,A.id);if(typeof ignite==='function')ignite(i);
      log(`${A.name} sacked and burned ${c.name}${cap?', capital of '+B.name:''}${heroTag(A)}.`,'doom');w.score+=4*sg;if(typeof fx==='function')fx(i,'war')}
    else{/* taken: the town and its fields change hands */claim(i,A.id);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=c.x+dx,Y=c.y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const k=Y*W+X;if(owner[k]===B.id)claim(k,A.id)}
      const moved=B.pop*(cap?.3:.18);B.pop-=moved;A.pop+=moved*.6;if(!cap)log(`${A.name} took ${c.name} from ${B.name} after a siege${heroTag(A)}.`,'war');w.score+=3*sg}
    propsDirty=true;bordersDirty=true;
    if(!B.cities.length){conquer(A,B);return true}}
  return false}
/* the last wars that ended, for the Wars panel */
let endedWars=[];
function noteWarEnd(a,b,how){const w=warData[warKey(a,b)];endedWars.unshift({a:a.id,b:b.id,an:a.name,bn:b.name,from:w&&w.start!=null?w.start:year-(w?w.years:0),to:year,how});if(endedWars.length>10)endedWars.length=10}
function conquer(A,B){noteWarEnd(A,B,'conquest');/* the last town fell: the realm is no more */for(let i=0;i<N;i++)if(owner[i]===B.id)claim(i,A.id);A.pop+=B.pop*.4;B.pop=0;
  log(`${B.name} was conquered by ${A.name}.`,'doom');fall(B)}
/* sieges that no longer have a war behind them, or drag on without getting anywhere, are lifted */
function siegeCleanup(){for(const B of nations){if(!B.alive)continue;for(const c of B.cities){if(!(c.siege>0)){c.siegeY=0;continue}
  const A=nations[c.besiegedBy];if(!A||!A.alive||!B.wars.has(A.id)){c.siege=0;c.besiegedBy=-1;c.siegeY=0;continue}
  c.siegeY=(c.siegeY||0)+1;if(c.siegeY>30&&c.siege<.7){c.siege=0;c.besiegedBy=-1;c.siegeY=0;if(important(B)||important(A))log(`${c.name} held out. ${A.name} gave up the siege.`,'war')}}}}
function warTick(){siegeCleanup();
  for(const A of nations){if(!A.alive)continue;for(const bid of [...A.wars]){const B=nations[bid];if(!B||!B.alive||A.id>B.id)continue;
    const key=warKey(A,B),w=warData[key]||(warData[key]={score:0,years:0,start:year});w.years++;if(w.start==null)w.start=year-w.years;w.ta=w.ta||0;w.tb=w.tb||0;w.da=w.da||0;w.db=w.db||0;
    const pairs=frontPairs(A,B);
    if(pairs.length){const sa=mil(A),sb=mil(B),battles=2+Math.floor((A.era+B.era)/2)+Math.min(6,pairs.length>>3);
      for(let k=0;k<battles;k++){const [i,j]=pairs[(rng()*pairs.length)|0];const tf=terrFactor(i,j);
        if(rng()<sa/(sa+sb)){if(owner[j]===B.id&&!cityAtTile(j)&&rng()<tf){advance(A,B,j);if(owner[j]===A.id)w.ta++}w.score++;w.db+=B.pop*.008*POPMUL[B.era];w.da+=A.pop*.003*POPMUL[A.era];B.pop*=.992;A.pop*=.997}
        else{if(owner[i]===A.id&&!cityAtTile(i)&&rng()<terrFactor(j,i)){advance(B,A,i);if(owner[i]===B.id)w.tb++}w.score--;w.da+=A.pop*.008*POPMUL[A.era];w.db+=B.pop*.003*POPMUL[B.era];A.pop*=.992;B.pop*=.997}
        if(A.front.length<60)A.front.push(i);if(B.front.length<60)B.front.push(j)}}
    if(siegeTick(A,B,w,1)||siegeTick(B,A,w,-1)){delete warData[key];continue}
    /* peace grows likelier with time and with a clear winner; the loser cedes the land the winner holds */
    /* wars drag on: no one sues for peace in the first decade, then weariness grows year by year; a crushed side gives in sooner */
    const tired=(w.years<15?0:.002+(w.years-15)*.0006)+(w.years<8?0:Math.abs(w.score)*.0004)+(Math.abs(w.score)>60?.03:0);
    if(rng()<tired*ten(A).peace*ten(B).peace*wwPeace(A,B)){addRival(A,B,.4);const win=w.score>6?A:w.score<-6?B:null,lose=win===A?B:A;
      makePeace(A,B,false);if(win)log(`${lose.name} ceded land to ${win.name} in the peace treaty.`,'war');delete warData[key]}}}}
function makePeace(a,b,god){if(a.wars.has(b.id))noteWarEnd(a,b,god?'forced':'peace');a.wars.delete(b.id);b.wars.delete(a.id);bordersDirty=true;if(typeof consolidate==='function')consolidate();log(god?`You forced peace between ${a.name} and ${b.name}.`:`${a.name} and ${b.name} made peace.`,'life')}
function fall(n){n.alive=false;for(const o of nations)if(o.allies)o.allies=o.allies.filter(x=>x!==n.id);n.allies=[];for(const o of nations)o.wars.delete(n.id);n.wars.clear();if(warFrom===n.id)warFrom=-1;log(`${n.name} has fallen.`,'doom');propsDirty=true;bordersDirty=true}
function rebel(n,forced,why){
  const cands=n.cities.slice(1);if(!cands.length)return;const c=forced||cands[(rng()*cands.length)|0];
  const maxD=Math.max(3,Math.round(Math.sqrt(n.tiles)*.45)),limit=Math.floor(n.tiles*.45),start=c.y*W+c.x;if(owner[start]!==n.id)return;
  const seen=new Uint8Array(N),q=[start],region=[];seen[start]=1;let head=0;
  while(head<q.length&&region.length<limit){const i=q[head++];region.push(i);const x=i%W,y=(i/W)|0;
    for(let d=0;d<4;d++){const X=x+DX[d],Y=y+DY[d];if(X<0||Y<0||X>=W||Y>=H)continue;const j=Y*W+X;
      if(seen[j]||owner[j]!==n.id||Math.max(Math.abs(X-c.x),Math.abs(Y-c.y))>maxD)continue;seen[j]=1;q.push(j)}}
  if(region.length<4)return;
  const oc=c.origin!=null&&nations[c.origin]?cultOf(nations[c.origin]):cultOf(n);
  const share=region.length/n.tiles,R_=newNation(c.x,c.y,{claim:false,name:c.name,pop:0,culture:c.colony?cultOf(n):oc});
  for(const j of region)claim(j,R_.id);const ci=R_.cities.indexOf(c);if(ci>0){R_.cities.splice(ci,1);R_.cities.unshift(c)}
  R_.pop=n.pop*share;n.pop-=R_.pop;R_.tech=0;R_.era=n.era;R_.techs=(n.techs||[]).slice();R_.faith=rng()<.5?n.faith:-1;R_.aggr=.6+rng()*.3;R_.gov=n.gov;if(!govOptions(R_).includes(R_.gov))R_.gov=govOptions(R_)[0]||n.gov;
  R_.known=n.known.slice();R_.known.push(n.id);n.known.push(R_.id);const gv=per(c.governor);if(gv&&gv.died==null&&gv.id!==n.ruler&&!gv.machine){gv.nation=R_.id;R_.house=gv.house;crown(R_,gv,'rebel')}
  if(why){/* a town that grew into a country of its own */
    const msg=why==='colony'?`The colony of ${c.name} declared independence from ${n.name}.`:why==='conquered'?`The people of ${c.name} rose up and threw off the rule of ${n.name}.`:`${c.name} declared itself a free country, no longer ruled by ${n.name}.`;
    if(rng()<.5&&warRoom(1)){startWar(R_,n,'rebel');log(msg+' War follows.','war')}else{log(msg+` ${n.name} let it go in peace.`,'life')}
    milestone('indep','A new country','A town broke away and became a nation of its own.');c.unrest=0;return}
  startWar(R_,n,'rebel');log(`${R_.name} broke away from ${n.name}${gv&&R_.ruler===gv.id?' under '+gv.name:''}. Civil war follows.`,'war');milestone('rebel','Civil war','An empire split in two.');
}

function independenceTick(n,t){if(n.cities.length<2)return;const cap=n.cities[0];
  for(const c of n.cities.slice(1)){const d=Math.hypot(c.x-cap.x,c.y-cap.y);
    let u=Math.max(0,d-7)*.00045;
    const conquered=c.origin!=null&&c.origin!==n.id;if(conquered)u+=.0045*Math.exp(-(year-(c.conq||year))/180);
    if(c.colony)u+=n.era>=SAIL?.0035:.0015;
    if(n.wars.size)u+=.0012;if(n.famine>0)u+=.002;if(c.plundered&&year-c.plundered<20)u+=.002;
    u/=Math.max(.5,t.stab||1);u*=stabUnrest(n);u*=1.25-(n.devotion||0)*.5;
    c.unrest=Math.max(0,(c.unrest||0)+u-.0015);
    if(c.unrest>1&&n.tiles>6){rebel(n,c,c.colony?'colony':conquered?'conquered':'free');return}}}

/* ---------- pirates: a hidden cove on a lonely shore, black ships that raid and plunder coastal towns ---------- */
let coves=[];
function coastalTargets(){const out=[];for(const n of nations){if(!n.alive||n.era<2)continue;for(const c of n.cities)if(coastWater(c).length)out.push({n,c})}return out}
function findCoveSite(){let best=-1,bs=-1;
  for(let q=0;q<1500;q++){const j=(rng()*N)|0;if(owner[j]>=0||isWater(j)||hab[j]<.05||[2,9,10,11,12].includes(biome[j]))continue;const x=j%W,y=(j/W)|0;let coast=false;
    for(let d=0;d<4;d++){const X=x+DX[d],Y=y+DY[d];if(X>=0&&Y>=0&&X<W&&Y<H&&isWater(Y*W+X)){coast=true;break}}if(!coast)continue;
    let dmin=1e9;for(const n of nations)if(n.alive)for(const c of n.cities)dmin=Math.min(dmin,Math.hypot(c.x-x,c.y-y));
    if(dmin<6)continue;const sc=Math.min(dmin,20)+rng()*3;if(sc>bs){bs=sc;best=j}}
  return best}
function foundCove(){const j=findCoveSite();if(j<0)return null;const cv={x:j%W,y:(j/W)|0,year,loot:0,name:['Black','Skull','Rum','Gallows','Shark','Raven','Bones','Cutlass'][(rng()*8)|0]+' '+['Cove','Bay','Hollow','Haven','Reef','Point'][(rng()*6)|0]};
  coves.push(cv);propsDirty=true;log(`Pirates made their lair at ${cv.name}. Black sails will follow.`,'war');
  if(typeof toast==='function')toast('Pirates',`They hide at ${cv.name}.`,wx(cv.x),wz(cv.y));milestone('pirates','Pirates','Raiders made a lair on a lonely shore.');return cv}
function pirateShip(starts,goal,raids,home){const res=seaPath(starts,goal);if(!res||res.path.length<2)return null;const p0=res.path[0];
  const g=makeShip(SAIL,'pirate','#121212');
  const s={owner:-1,kind:'pirate',foe:-1,era:SAIL,path:res.path,seg:0,target:res.target,x:wx(p0%W),z:wz((p0/W)|0),sink:0,g,foamT:0,raids:raids||0,home:home||null};
  g.position.set(s.x,waterY,s.z);ships.push(s);return s}
function spawnPirate(from,raids,T0){const ts=coastalTargets();if(!ts.length&&!T0)return;const T=T0||ts[(rng()*ts.length)|0];
  const cv=coves[0];let starts=[];
  if(from!=null)starts=[from];else if(cv)starts=coastWater({x:cv.x,y:cv.y});
  if(!starts.length){for(let q=0;q<80&&!starts.length;q++){const e=(rng()*4)|0,x=e<2?((rng()*W)|0):e===2?0:W-1,y=e<2?(e===0?0:H-1):((rng()*H)|0),j=y*W+x;if(isWater(j))starts.push(j)}}
  if(!starts.length)return;
  const s=pirateShip(starts,(x,y)=>{for(let d=0;d<4;d++){if(x+DX[d]===T.c.x&&y+DY[d]===T.c.y)return (y+DY[d])*W+x+DX[d]}return -1},raids,null);
  if(s){s.foe=T.n.id;if(!milestones.has('blacksails')){milestone('blacksails','Black sails','A pirate ship put to sea.');if(typeof toast==='function')toast('Black sails',`Pirates are sailing for ${T.c.name}.`,s.x,s.z)}}}
function sailHome(from,raids){const cv=coves[0];if(!cv){if(raids<2)spawnPirate(from,raids+1);return}
  pirateShip([from],(x,y)=>{for(let d=0;d<4;d++){if(x+DX[d]===cv.x&&y+DY[d]===cv.y)return cv.y*W+cv.x}return -1},raids,cv)}
function pirateTick(){let top=0;for(const n of nations)if(n.alive)top=Math.max(top,n.era);
  if(top<2||top>=6){if(top>=6&&coves.length){log(`The age of pirates is over. ${coves[0].name} lies abandoned.`,'life');coves=[];propsDirty=true}return}
  if(!coves.length&&rng()<.02)foundCove();
  /* a nation that claims the shore, or a strong navy nearby, clears out the lair */
  for(const cv of [...coves]){const o=owner[cv.y*W+cv.x];let by=o>=0?nations[o]:null;
    if(!by)for(const n of nations){if(!n.alive||n.era<SAIL)continue;if(n.cities.some(c=>Math.hypot(c.x-cv.x,c.y-cv.y)<10)&&rng()<.006){by=n;break}}
    if(by){coves.splice(coves.indexOf(cv),1);propsDirty=true;log(`${by.name} burned the pirate lair at ${cv.name}.`,'war');if(typeof ignite==='function')ignite(cv.y*W+cv.x)}}
  const now=ships.filter(s=>s.kind==='pirate'&&!s.sink).length;
  if(now<(top>=SAIL?4:2)&&rng()<(coves.length?.05:.02)*(top>=SAIL?1.4:1))spawnPirate()}
function pirateRaid(s){if(s.home){s.home.loot++;return}
  const hit=cityAtTile(s.target);if(!hit)return;const {n,c}=hit;
  const def=ERAS[n.era].mil*(.6+rng())*(n.wars.size?.7:1.1),atk=ERAS[SAIL].mil*(.6+rng());
  if(def>atk*1.15){log(`${c.name} drove off a pirate raid.`,'war');sailHome(s.path[s.path.length-1],s.raids+1);return}
  n.pop*=.94;n.tech=Math.max(0,n.tech-TECHCOST[n.era]*.04);c.plundered=year;c.unrest=(c.unrest||0)+.12;
  if(rng()<.35){if(typeof ignite==='function')ignite(s.target);log(`Pirates plundered and burned ${c.name} in ${n.name}.`,'war')}else log(`Pirates plundered ${c.name} in ${n.name} and sailed off with its riches.`,'war');
  if(typeof fx==='function')fx(s.target,'war');sailHome(s.path[s.path.length-1],s.raids+1)}

/* ---------- devotion, festivals and statues ----------
   faith in you is what a god lives on: the devout give much more belief, take your miracles cheaply and do as you ask; the faithless barely hear you */
const devBelief=n=>.2+1.6*(n.devotion??.3);
const devCost=n=>clamp(1.35-.75*(n.devotion??.3),.65,1.35);
const devLabel=d=>d>.75?'Devout':d>.5?'Faithful':d>.3?'Believing':d>.15?'Doubting':'Faithless';
function devotionTick(n){const yours=n.faith>=0;n.devotion=clamp((n.devotion??.3)+(yours?.004*(1-n.devotion):-.004*n.devotion)+(n.festival>0?.004:0)-(n.plague>0||n.famine>0?.003:0),0,1);
  if(n.festival>0)n.festival--;
  if(yours&&n.devotion>.62&&n.festival<=0&&rng()<.006){n.festival=3;n.pop*=1.02;log(`${n.name} held a harvest feast in honour of ${faiths[n.faith].name}.`,'faith')}
  const want=yours&&n.devotion>.5?Math.min(n.cities.length,Math.floor((n.devotion-.45)*n.cities.length*1.8)+1):0;let have=0;for(const c of n.cities)if(c.statue)have++;
  if(have<want&&n.era>=1&&rng()<.04){const c=n.cities.find(c=>!c.statue);if(c){c.statue={faith:n.faith,year};propsDirty=true;
    log(`The people of ${c.name} raised a statue to ${faiths[n.faith].name}.`,'faith');milestone('statue','Carved in stone','A people raised a statue to their god.')}}
  if(n.devotion<.28)for(const c of n.cities)if(c.statue&&rng()<.03){c.statue=null;propsDirty=true;log(`The people of ${c.name} toppled the statue of their old god.`,'doom');break}}
function holdFestival(n,god){n.festival=6;n.devotion=clamp((n.devotion??.3)+.2,0,1);n.famine=0;n.pop*=1.05;propsDirty=true;
  log(god?`At your sign, ${n.name} held a great harvest festival. The fields will be full.`:`${n.name} held a harvest festival.`,'life')}

/* ---------- fleets ---------- */
function coastWater(c){const out=[];for(let d=0;d<4;d++){const X=c.x+DX[d],Y=c.y+DY[d];if(X<0||Y<0||X>=W||Y>=H)continue;const j=Y*W+X;if(isWater(j))out.push(j)}return out}
function seaPath(starts,goal){
  const prev=new Int32Array(N).fill(-2),q=[];for(const s of starts){prev[s]=-1;q.push(s)}let head=0;
  while(head<q.length&&head<8000){const j=q[head++],x=j%W,y=(j/W)|0;const t=goal(x,y);
    if(t>=0){const path=[];let k=j;while(k!==-1){path.push(k);k=prev[k]}path.reverse();return{path,target:t}}
    for(let d=0;d<4;d++){const X=x+DX[d],Y=y+DY[d];if(X<0||Y<0||X>=W||Y>=H)continue;const k=Y*W+X;if(prev[k]===-2&&isWater(k)){prev[k]=j;q.push(k)}}}
  return null}
/* a sailing route: the tile path pulled tight into straight legs over open water, then rounded at the corners */
function clearSea(x0,z0,x1,z1){const d=Math.hypot(x1-x0,z1-z0),n=Math.ceil(d/.12);for(let k=1;k<n;k++){const t=k/n,i=tileAt(lerp(x0,x1,t),lerp(z0,z1,t));if(i<0||!isWater(i))return false}return true}
function shipRoute(path){const P=path.map(t=>[wx(t%W),wz((t/W)|0)]),out=[P[0]];let i=0;
  while(i<P.length-1){let j=Math.min(P.length-1,i+60);while(j>i+1&&!clearSea(P[i][0],P[i][1],P[j][0],P[j][1]))j--;out.push(P[j]);i=j}
  let r=out;for(let it=0;it<3;it++){if(r.length<3)break;const q=[r[0]];for(let k=0;k<r.length-1;k++){const a=r[k],b=r[k+1];
      for(const f of [.25,.75]){const x=lerp(a[0],b[0],f),z=lerp(a[1],b[1],f),ti=tileAt(x,z);q.push(ti>=0&&isWater(ti)?[x,z]:(f<.5?a:b))}}q.push(r[r.length-1]);r=q}
  return r}
function launch(n,kind,foe){
  const coastal=n.cities.filter(c=>coastWater(c).length);if(!coastal.length)return;
  const c=coastal[(rng()*coastal.length)|0],starts=coastWater(c);
  const goal=kind==='colony'
    ?(x,y)=>{for(let d=0;d<4;d++){const X=x+DX[d],Y=y+DY[d];if(X<0||Y<0||X>=W||Y>=H)continue;const L=Y*W+X;
        if(owner[L]<0&&hab[L]>=.4&&flatOk(L)&&Math.max(Math.abs(X-c.x),Math.abs(Y-c.y))>=6&&!nearCity(X,Y,4))return L}return -1}
    :kind==='explore'?(()=>{let T=-1;for(let q=0;q<60;q++){const j=(rng()*N)|0;if(isWater(j)&&Math.hypot(j%W-c.x,((j/W)|0)-c.y)>Math.max(W,H)*.35){T=j;break}}return (x,y)=>y*W+x===T?T:-1})()
    :(x,y)=>{for(let d=0;d<4;d++){const X=x+DX[d],Y=y+DY[d];if(X<0||Y<0||X>=W||Y>=H)continue;const L=Y*W+X;if(owner[L]===foe.id)return L}return -1};
  const res=seaPath(starts,goal);if(!res||res.path.length<2)return;const p0=res.path[0];
  const s={owner:n.id,kind,foe:foe?foe.id:-1,era:n.era,path:res.path,wp:shipRoute(res.path),seg:0,target:res.target,x:wx(p0%W),z:wz((p0/W)|0),sink:0,g:makeShip(n.era,kind,n.color,ensureFlag(n)),foamT:0};
  s.g.position.set(s.x,waterY,s.z);ships.push(s);
  if(kind==='war'){/* warships sail as a small squadron */const extra=n.era>=6?2:1;for(let e_=0;e_<extra;e_++){const o={...s,g:makeShip(n.era,kind,n.color,ensureFlag(n)),x:s.x+(rng()-.5)*.3,z:s.z+(rng()-.5)*.3,foamT:0,escort:true};
      const ti=tileAt(o.x,o.z);if(ti<0||!isWater(ti)){o.x=s.x;o.z=s.z}o.g.position.set(o.x,waterY,o.z);ships.push(o)}}
  if(kind==='colony'&&!flags.sail){flags.sail=true;log(`The first colony ships of ${n.name} set sail.`,'era');milestone('sail','Across the sea','Colonists set sail for distant shores.')}
}
function arrive(s){
  if(s.kind==='pirate'){pirateRaid(s);return}
  const n=nations[s.owner],L=s.target,X=L%W,Y=(L/W)|0;if(!n.alive)return;
  if(s.kind==='explore'){exploreArrive(n,X,Y);return}
  if(s.kind==='trade'){const B=nations[s.foe];if(B&&B.alive&&n.trade.includes(B.id)){n.tech+=TECHCOST[n.era]*.04;B.tech+=TECHCOST[B.era]*.04;if(n.sick&&rng()<.3)infect(B,n.sick,n);if(rng()<.15&&(important(n)||important(B)))log(`Merchants of ${n.name} reached ${B.name} with full holds.`,'life')}return}
  if(s.kind==='colony'){if(owner[L]<0&&hab[L]>=.1){claim(L,n.id);
      for(let d=0;d<4;d++){const x=X+DX[d],y=Y+DY[d];if(x<0||y<0||x>=W||y>=H)continue;const j=y*W+x;if(owner[j]<0&&hab[j]>=.1)claim(j,n.id)}
      const name=cultureName(cultOf(n));n.cities.push({x:X,y:Y,name,origin:n.id,colony:true,born:year});n.pop+=3;fx(L,'bless');propsDirty=true;
      log(`Colonists from ${n.name} founded ${name} across the sea.`,'life');milestone('colony','New World','The first overseas colony was founded.')}}
  else{if(s.escort)return;const B=nations[s.foe];if(!B||!B.alive||!n.wars.has(B.id)||owner[L]!==B.id)return;
    const lim=3+(s.era-SAIL)*2,q=[L],seen=new Set([L]);let took=0,head=0;
    while(head<q.length&&took<lim){const j=q[head++];if(owner[j]!==B.id)continue;const moved=B.pop/Math.max(1,B.tiles);B.pop=Math.max(2,B.pop-moved*.6);claim(j,n.id);took++;
      const x=j%W,y=(j/W)|0;for(let d=0;d<4;d++){const x2=x+DX[d],y2=y+DY[d];if(x2<0||y2<0||x2>=W||y2>=H)continue;const k=y2*W+x2;if(!seen.has(k)){seen.add(k);q.push(k)}}}
    fx(L,'war');log(`A fleet of ${n.name} stormed the shores of ${B.name}.`,'war');if(n.sick&&rng()<.5)infect(B,n.sick,n)}
}
function updateShips(dy,dt,now){
  for(let k=ships.length-1;k>=0;k--){const s=ships[k];
    if(s.sink>0){s.sink+=dt;s.g.position.y=waterY-s.sink*.15;s.g.rotation.z=s.sink*.4;if(rng()<dt*8)emit('dark',s.x,waterY+.05,s.z);if(s.sink>2){disposeShip(s);ships.splice(k,1)}continue}
    if(s.owner>=0&&!nations[s.owner].alive){s.sink=.01;continue}
    if(!s.wp)s.wp=shipRoute(s.path);const WP=s.wp;
    /* ships move at sailing speed on screen, whatever the speed of the years */let rem=SHIPSPEED[s.era]*Math.min(dy,dt*2.2)*.9;if(s.fight)rem=0;
    if(s.hunt&&!s.fight&&!s.hunt.sink){const h=s.hunt,ddx=h.x-s.x,ddz=h.z-s.z,d=Math.hypot(ddx,ddz)||1,st=Math.min(d,rem),nx=s.x+ddx/d*st,nz=s.z+ddz/d*st,ti=tileAt(nx,nz);if(ti>=0&&isWater(ti)){s.x=nx;s.z=nz;s.head=Math.atan2(-ddz,ddx);rem=0}else s.hunt=null}
    if(s.wasOff&&!s.fight&&!s.hunt){/* back from a fight or a chase: rejoin the route at the nearest point ahead */let bi=s.seg,bd=1e9;for(let q2=s.seg;q2<WP.length;q2++){const d2=Math.hypot(WP[q2][0]-s.x,WP[q2][1]-s.z);if(d2<bd){bd=d2;bi=q2}}s.seg=Math.max(s.seg,bi-1);s.wasOff=false}
    if(s.fight||s.hunt)s.wasOff=true;
    /* steer for a point a little way ahead on the route, so the ship sweeps round bends instead of jerking at each corner */
    if(rem>0&&s.seg<WP.length-1){while(s.seg<WP.length-1&&Math.hypot(WP[s.seg+1][0]-s.x,WP[s.seg+1][1]-s.z)<.14)s.seg++;
      if(s.seg<WP.length-1){let la=.38,px=s.x,pz=s.z,j=s.seg+1,tx=WP[j][0],tz=WP[j][1],d=Math.hypot(tx-px,tz-pz);
        while(d<la&&j<WP.length-1){la-=d;px=tx;pz=tz;j++;tx=WP[j][0];tz=WP[j][1];d=Math.hypot(tx-px,tz-pz)}
        const f=Math.min(1,la/(d||1));let gx=px+(tx-px)*f,gz=pz+(tz-pz)*f,ddx=gx-s.x,ddz=gz-s.z,D=Math.hypot(ddx,ddz)||1,st=Math.min(rem,D),nx=s.x+ddx/D*st,nz=s.z+ddz/D*st,ti=tileAt(nx,nz);
        if(ti<0||!isWater(ti)){gx=WP[s.seg+1][0];gz=WP[s.seg+1][1];ddx=gx-s.x;ddz=gz-s.z;D=Math.hypot(ddx,ddz)||1;st=Math.min(rem,D);nx=s.x+ddx/D*st;nz=s.z+ddz/D*st}
        s.x=nx;s.z=nz;s.head=Math.atan2(-ddz,ddx)}}
    if(s.head!=null){const turn=((s.head-s.g.rotation.y+Math.PI*3)%(Math.PI*2)-Math.PI);s.g.rotation.y+=turn*Math.min(1,dt*3);s.lean=lerp(s.lean||0,clamp(turn*.25,-.12,.12),Math.min(1,dt*3))}
    s.g.position.set(s.x,waterY+(s.era>=7?.06:0)+Math.sin(now/500+k)*.005,s.z);s.g.rotation.x=Math.sin(now/700+k)*.025+(s.lean||0);
    if(dy>0){s.foamT+=dt;if(s.foamT>.12){s.foamT=0;const a=s.g.rotation.y;emit('foam',s.x-Math.cos(a)*.2,waterY+.01,s.z+Math.sin(a)*.2,0,0)}
      if(s.era===5&&rng()<dt*3)emit('dark',s.x,waterY+.2,s.z)}
    if(s.seg>=WP.length-1){arrive(s);disposeShip(s);ships.splice(k,1)}}
  if(dy<=0)return;
  /* naval war: warships hunt enemy ships they sight, close in, trade broadsides until one sinks */
  for(const a of ships){if(a.sink||a.kind!=='war'||a.fight)continue;const A=nations[a.owner];if(!A)continue;let best=null,bd=3.2;
    for(const b of ships){if(b===a||b.sink||b.owner===a.owner||(b.kind!=='pirate'&&!A.wars.has(b.owner)))continue;const d=Math.hypot(a.x-b.x,a.z-b.z);if(d<bd){bd=d;best=b}}
    if(best){if(bd<.9){a.fight=best;if(!best.fight)best.fight=a}else a.hunt=best}else a.hunt=null}
  for(const s_ of ships){if(s_.sink)continue;s_.hp=s_.hp??(s_.kind==='war'?3+s_.era*.6:s_.kind==='pirate'?2.5:1.2);
    const f=s_.fight;if(f&&(f.sink||Math.hypot(f.x-s_.x,f.z-s_.z)>2.2)){s_.fight=null;continue}if(!f)continue;
    /* hold a broadside: turn side-on and keep a cannon shot away */
    const dx=f.x-s_.x,dz=f.z-s_.z,d=Math.hypot(dx,dz)||1,side=Math.atan2(-dz,dx)+Math.PI/2;s_.head=side;
    const want=s_.kind==='war'?.55:.9,mv=(d-want)*dt*.4,nx=s_.x+dx/d*mv,nz=s_.z+dz/d*mv,ti=tileAt(nx,nz);if(ti>=0&&isWater(ti)){s_.x=nx;s_.z=nz}
    if(s_.kind==='colony'||s_.kind==='trade'||s_.kind==='explore')continue;/* unarmed ships only flee */
    s_.gun=(s_.gun??rng()*.6)-dt;if(s_.gun>0)continue;s_.gun=(s_.era>=6?.35:s_.era>=5?.6:.9)+rng()*.5;
    const sx=s_.x+dx/d*.08,sz=s_.z+dz/d*.08;emit('flash',sx,waterY+.06,sz);emit(s_.era>=5?'dark':'smoke',sx,waterY+.06,sz);
    const hit=rng()<.45+s_.era*.03,tx=f.x+(hit?0:(rng()-.5)*.5),tz=f.z+(hit?0:(rng()-.5)*.5);
    for(let q=0;q<(hit?2:4);q++)emit(hit?'fire':'spray',tx,waterY+.04,tz,(rng()-.5)*.06,(rng()-.5)*.06);
    if(hit){f.hp-=ERAS[s_.era].mil/ERAS[f.era].mil*(s_.owner<0?.6:1)*(.6+rng()*.6);if(f.era>=5||rng()<.5)emit('dark',f.x,waterY+.08,f.z)}
    if(Math.hypot(s_.x-camT.x,s_.z-camT.z)<camDist*.8&&typeof sfx==='function')sfx('cannon');
    if(f.hp<=0){const win=s_,lose=f;lose.sink=.01;win.fight=null;for(let q=0;q<6;q++)emit('fire',lose.x,waterY+.06,lose.z);
      const nm=x_=>x_.owner<0?'pirates':nations[x_.owner].name;log(lose.kind==='pirate'?`Warships of ${nm(win)} sank a pirate ship.`:win.kind==='pirate'?`Pirates sank a ship of ${nm(lose)}.`:`Ships of ${nm(win)} sank a ${lose.kind==='war'?'warship':lose.kind+' ship'} of ${nm(lose)}.`,'war');
      milestone('naval','Naval battle','Warships fought on the open sea.')}}
}
function launchRocket(n){const c=n.cities[0];if(!c)return;const x=wx(c.x)+.3,z=wz(c.y)+.1,y=surfY(x,z);
  rockets.push({g:makeRocket(n,x,y,z),t:0});log(`${n.name} launched a starship toward the stars.`,'era');milestone('stars','To the stars','A starship left the world.')}

/* ---------- simulation tick (1 year) ---------- */
function tick(){
  year++;
  const capA=new Float32Array(nations.length);for(let i=0;i<N;i++){const o=owner[i];if(o>=0)capA[o]+=hab[i]}
  let emis=0,worldPop=0;
  for(const n of nations){if(!n.alive)continue;
    if(n.tiles<=0){fall(n);continue}
    if(!n.cities.length&&year-(n.born||0)>5){for(let i=0;i<N;i++)if(owner[i]===n.id)claim(i,-1);log(`With its last town gone, ${n.name} broke apart.`,'doom');fall(n);continue}
    const t=ten(n),e=ERAS[n.era];
    n.cap=Math.max(5,(capA[n.id]||0)*e.cap*30);if(!isFinite(n.pop))n.pop=10;if(!isFinite(n.tech))n.tech=0;
    n.pop+=n.pop*.035*[.6,.68,.76,.82,.88,.95,1,1][n.era]*t.grow*stabGrow(n)*(.85+.3*(n.happy??.6))*(n.bless>0?1.8:1)*(n.festival>0?1.25:1)*(1-n.pop/n.cap);
    /* settlers: a people with room to spare sends families out to found small villages inside its own lands */
    if(n.tiles/Math.max(1,n.cities.length)>=10&&n.pop>n.cities.length*12&&rng()<.03){const c0=n.cities[(rng()*n.cities.length)|0];
      for(let q=0;q<6;q++){const x=c0.x+Math.round((rng()-.5)*10),y=c0.y+Math.round((rng()-.5)*10);if(x<0||y<0||x>=W||y>=H)continue;const j=y*W+x;if(owner[j]===n.id&&!nearCity(x,y,3)&&hab[j]>.3){const k=n.cities.length;foundTown(n,x,y,j);if(n.cities.length>k){if(rng()<.25)log(`Settlers from ${c0.name} founded ${n.cities[k].name}.`,'');break}}}}
    if(n.plague>0){n.plague--;n.pop*=.975}
    if(n.wars.size)n.pop*=1-.002*n.wars.size;
    n.pop=Math.max(2,n.pop);worldPop+=n.pop;
    research(n,Math.sqrt(n.pop)*.055*[1.35,1.25,1.15,1.08,1.04,1,1,1][n.era]*t.tech*stabTech(n)*(n.gpTech||1)*(1+n.cities.length*.04)*(n.inspire>0?2:1)/paceInfo().techMult);if(n.inspire>0)n.inspire--;
    if(n.bless>0)n.bless--;
    if(!govOptions(n).includes(n.gov)||rng()<.0015/Math.sqrt(paceInfo().techMult))aiReform(n);
    emis+=n.pop*e.emit*t.emit;n.nb=new Set();n.front=[];
    if(n.era>=1&&n.wonder<n.era&&n.cities.length>=2&&rng()<.004){n.wonder=n.era;propsDirty=true;const wd=WONDERS[n.era];
      log(`${n.name} completed the ${wd.name}.`,'era');milestone('wonder','A wonder of the world',`${n.name} built the ${wd.name}.`)}
    if(n.era>=SAIL){let col=0,war=0;for(const s of ships)if(s.owner===n.id&&!s.sink)s.kind==='colony'?col++:war++;
      if(col<2&&rng()<.02*t.exp*t.sea)launch(n,'colony');
      if(n.wars.size&&war<2+(n.era-SAIL)&&rng()<.05){const foes=[...n.wars];launch(n,'war',nations[foes[(rng()*foes.length)|0]])}}
    if(n.era===7&&n.techs&&n.techs.includes('starships')&&rng()<.004)launchRocket(n);
    if(year%5===n.id%5)tradeTick(n);
    if(year%3===n.id%3)allianceTick(n);independenceTick(n,t);devotionTick(n);politicsTick(n);heroTick(n);terraformTick(n);resourceTick(n);winterTick(n);nukeTick(n);if(!n.alive)continue;if(!n.alive)continue;
    if(n.era>=SAIL||(n.era>=3&&n.techs.includes('sailing'))){let ex=0,tr=0;for(const s of ships)if(s.owner===n.id&&!s.sink){if(s.kind==='explore')ex++;if(s.kind==='trade')tr++}
      if(ex<1&&rng()<.006*t.sea)launch(n,'explore');
      if(tr<1&&n.trade.length&&rng()<.03){const p=nations[n.trade[(rng()*n.trade.length)|0]];if(p&&p.alive)launch(n,'trade',p)}}
  }
  const K=Math.floor(N*.1);
  for(let k=0;k<K;k++){
    const i=(rng()*N)|0,a=owner[i];if(a<0)continue;
    const x=i%W,y=(i/W)|0,d=(rng()*4)|0,X=x+DX[d],Y=y+DY[d];if(X<0||Y<0||X>=W||Y>=H)continue;
    const j=Y*W+X,b=owner[j],A=nations[a];if(b===a){if(rng()<.004&&A.pop>A.cities.length*15)foundTown(A,x,y,i);continue}
    if(b<0){if(hab[j]<.1)continue;const pr=A.pop/A.cap;if(rng()<hab[j]*.4*(pr>.6?1:.2)*ten(A).exp*(1+A.era*.08)*terrFactor(i,j)){claim(j,a);maybeCity(A,X,Y,j)}continue}
    A.nb.add(b);const B=nations[b];
    if(A.wars.has(b)){if(A.front.length<60)A.front.push(i);if(B.front.length<60)B.front.push(j);
      const sa=mil(A),sb=mil(B);if(rng()<sa/(sa+sb)*.25*terrFactor(i,j)*frontW(A,j)&&!cityAtTile(j)){const moved=B.pop/Math.max(1,B.tiles);B.pop=Math.max(2,B.pop-moved*.7);A.pop+=moved*.2;claim(j,a)}}
    else if(A.faith>=0&&B.faith!==A.faith&&rng()<.0008*ten(A).spread*(B.gov==='theocracy'?.3:1)*Math.min(3,A.pop/(B.pop+1))){B.faith=A.faith;propsDirty=true;log(`${B.name} adopted ${faiths[A.faith].name}.`,'faith')}
  }
  warTick();pirateTick();terraformFlush();faithTick();scenarioTick();historyTick();seaTick();spaceTick();longWarTick();worldWarTick();falloutTick();if(year%4===0)consolidate();
  for(const n of nations){if(!n.alive)continue;const t=ten(n);
    for(const b of n.nb){meet(n,nations[b]);if(n.wars.has(b))continue;const B=nations[b];if(!B.alive)continue;/* crowded realms fight over land; different faiths fight more */const crowd=(n.pop/n.cap>.8?1.8:1)*(B.pop/B.cap>.8?1.3:1);const hw=holyWarFactor(n,B)*grudgeFactor(n,B),cv=covets(n,B);if(!allied(n,B)&&warRoom()&&rng()<.0035*mood().war*n.aggr*t.war*crowd*(n.faith!==B.faith?1.6:.6)*(n.ties.includes(b)?.35:1)*(n.trade.includes(b)?.6:1)*hw*(cv?1.8:1)){startWar(n,B,null);if(hw>1&&rng()<.7)holyWarLog(n,B);else if(cv&&(important(n)||important(B)))log(`${n.name} wants the ${RESOURCES[cv].label.toLowerCase()} of ${B.name}.`,'war')}}
    if(n.era>=SAIL&&!n.wars.size&&warRoom()&&rng()<.0006*mood().war*n.aggr*t.war){const o=nations.filter(m=>m.alive&&m!==n&&m.era>=SAIL-1&&n.known.includes(m.id)&&!n.ties.includes(m.id));if(o.length)startWar(n,o[(rng()*o.length)|0],null)}
    if(n.tiles>N*.07&&n.cities.length>=3&&rng()<.002*(1+n.wars.size)/t.stab/Math.sqrt(paceInfo().techMult))rebel(n);
  }
  if(dLevel()>0)naturalEvents();disasterTick();peopleTick();
  climate.emis=emis;
  /* warming follows the smoke, slowly, and levels off at about +2 °C; when the smoke clears, the extra heat slowly fades */
  {const capA=worldOpts.scenario&&worldOpts.scenario.id==='climate'?.2:.1;/* +2 °C at most from people, approached slowly and then it levels off */
   const dT=emis>0?.0005*(1-Math.exp(-emis/1.5e5))*Math.max(0,1-(climate.anth||0)/capA):0;
   if(dT>0){const d=Math.min(dT,1-climate.temp);climate.temp+=d;climate.anth=(climate.anth||0)+d}
   if(emis<2e4&&climate.anth>0){const c=climate.anth*.004;climate.anth-=c;climate.temp-=c}}
  if(emis>0){
    if(!flags.warm){flags.warm=true;log('Smoke rises from the first factories. The world begins to warm.','sky')}
    if(year%5===0)terrainDirty=true}
  if(worldPop*POPMUL[Math.max(0,...nations.filter(n=>n.alive).map(n=>n.era))]>=1e6)milestone('million','A million souls','The world population passed one million.');
  /* belief: a trickle from every faithful people, growing slowly with their numbers; a full treasury fills more slowly */
  /* in co-op every god lives on their own followers: the host counts only the faiths the host revealed */
  const rival=typeof coopHosting==='function'&&coopHosting();let inc=.45;for(const n of nations)if(n.alive&&n.faith>=0&&(!rival||((faiths[n.faith]&&faiths[n.faith].god)|0)===0))inc+=Math.cbrt(n.pop)*.045*ten(n).belief*devBelief(n);
  /* even peoples without a faith of yours pray a little, if they still believe in you */
  for(const n of nations)if(n.alive&&n.faith<0&&(n.devotion??.3)>.3)inc+=Math.cbrt(n.pop)*.02*((n.devotion??.3)-.3);
  inc*=clamp(2/paceInfo().yearRate,1,4);inc/=1+Math.max(0,belief-200)/200;belief+=inc;beliefRate=inc;
  if(moistActive>0){moistActive--;for(let i=0;i<N;i++)moistD[i]*=.985;if(year%4===0)terrainDirty=true}
}
/* research: points flow into the current discovery; a key discovery opens the next age */
function pickResearch(n){const open=TECHS.filter(t=>techAvailable(n,t));if(!open.length){n.research=null;return}
  const w=open.map(t=>(t.key?1.6:1)*(t.mil&&n.aggr>.6?1.4:1)*(t.belief&&n.faith>=0?1.3:1)*(t.sea&&n.era>=3?1.2:1));
  let r=rng()*w.reduce((a,b)=>a+b,0);for(let q=0;q<open.length;q++){r-=w[q];if(r<=0){n.research=open[q].id;return}}n.research=open[0].id}
function research(n,pts){if(!n.techs)n.techs=[];if(!n.research||!techAvailable(n,TECH[n.research]))pickResearch(n);if(!n.research){n.tech=0;return}
  n.tech+=pts;const t=TECH[n.research],cost=TECHCOST[t.era];
  /* an age is never rushed: the key discovery waits until the age has lasted its full time */
  if(t.key&&n.tech>=cost&&year-(n.eraY??n.born??0)<paceInfo().yearsPerAge){n.tech=cost;return}
  if(n.tech>=cost){n.tech-=cost;n.techs.push(t.id);n.research=null;n.guided=false;
    if(t.key){n.eraY=year;n.era=t.key;propsDirty=true;log(`${n.name} discovered ${t.name} and entered the ${ERAS[n.era].name}.`,'era');milestone('era'+n.era,ERAS[n.era].name,`${n.name} was the first to reach it.`)}
    else if(n.id===selected||rng()<.15)log(`${n.name} discovered ${t.name}.`,'era');
    pickResearch(n)}}
function grantTechsUpTo(n){n.techs=TECHS.filter(t=>t.era<n.era).map(t=>t.id);n.research=null}
/* governments: nations reform on their own when an age changes or unrest builds */
function aiReform(n){const opts=govOptions(n).filter(k=>k!==n.gov);if(!opts.length)return;
  const w=opts.map(k=>{const g=GOVS[k];let v=1;const war=(g.war||1),pc=(g.peace||1);
    v*=n.aggr>.6?war*1.2:pc;if(g.faith)v*=n.faith>=0?1.6:0;if(GOVS[n.gov]&&n.era>GOVS[n.gov].max)v*=1;return Math.max(.05,v)});
  let r=rng()*w.reduce((a,b)=>a+b,0),k=opts[0];for(let q=0;q<opts.length;q++){r-=w[q];if(r<=0){k=opts[q];break}}
  setGov(n,k,false)}
function setGov(n,k,god){const old=n.gov?GOVS[n.gov].name:null,oldK=n.gov;n.gov=k;onGovChange(n,oldK,k);n.pop*=god?.97:.96;if(oldK){n.upheaval=god?year-8:year;if(rng()<.6)newFlag(n,'')}
  const art=/^[AEIOU]/.test(GOVS[k].name)?'an':'a';
  log(god?`By your hand, ${n.name} became ${art} ${GOVS[k].name}.`:old?`Revolution in ${n.name}: the ${old} gave way to ${art} ${GOVS[k].name}.`:`${n.name} became ${art} ${GOVS[k].name}.`,god?'era':'war');
  if(k==='democracy')milestone('democracy','The first vote',`${n.name} held free elections.`);
  if(k==='federation')milestone('federation','One world council',`${n.name} formed a Global Federation.`)}
/* contact, trade and exploration */
function meet(a,b){if(!a||!b||a===b)return;if(!a.known.includes(b.id)){a.known.push(b.id);b.known.push(a.id);
  if(year>5&&(important(a)||important(b)))log(`First contact: ${a.name} met ${b.name}.`,'life');milestone('contact','First contact','Two peoples met for the first time.')}}
function tradeTick(n){
  if(n.era<1)return;const cap=1+Math.floor(n.era/2);n.trade=n.trade.filter(i=>nations[i]&&nations[i].alive&&!n.wars.has(i));if(n.trade.length>=cap)return;
  const coastal=x=>x.cities.some(c=>coastWater(c).length);
  const cands=n.known.map(i=>nations[i]).filter(m=>m&&m.alive&&m.era>=1&&!n.wars.has(m.id)&&!n.trade.includes(m.id)&&m.trade.length<1+Math.floor(m.era/2)&&(n.nb.has(m.id)||(n.era>=SAIL&&coastal(n)&&coastal(m))));
  if(!cands.length||rng()>.25)return;let m=cands[0];{const w=cands.map(c=>tradeWant(n,c)*tradeWant(c,n));let r=rng()*w.reduce((a,b)=>a+b,0);for(let q=0;q<cands.length;q++){r-=w[q];if(r<=0){m=cands[q];break}}}n.trade.push(m.id);m.trade.push(n.id);
  if(important(n)||important(m))log(`${n.name} and ${m.name} opened a trade route.`,'life');milestone('trade','Merchants on the road','Two nations began to trade.')}
function exploreArrive(n,X,Y){let found=0,land=0;const seen=new Set();
  for(let dy=-7;dy<=7;dy++)for(let dx=-7;dx<=7;dx++){const x=X+dx,y=Y+dy;if(x<0||y<0||x>=W||y>=H)continue;const j=y*W+x;
    if(owner[j]>=0&&owner[j]!==n.id&&!seen.has(owner[j])){seen.add(owner[j]);const m=nations[owner[j]];if(m.alive&&!n.known.includes(m.id)){meet(n,m);found++}}
    else if(owner[j]<0&&hab[j]>=.4)land++}
  n.tech+=TECHCOST[n.era]*.12;
  if(found||land>6||important(n)){const msg=found?`Explorers of ${n.name} made contact with ${[...seen].map(i=>nations[i].name).filter(x=>x).slice(0,2).join(' and ')}.`:land>6?`Explorers of ${n.name} charted unclaimed land across the sea.`:`Explorers of ${n.name} returned with new charts.`;
    log(msg,'life');if(land>6)milestone('explore','Uncharted shores','Explorers found land no one had claimed.')}}
function naturalEvents(){
  const L=dLevel();if(rng()<.0015*L){let tries=0;while(tries++<200){const i=(rng()*N)|0;if(biome[i]===11||biome[i]===12){eruptVolcano(i,false);break}}}
  if(rng()<.002){const al=nations.filter(n=>n.alive&&n.cities.length);if(al.length){const n=al[(rng()*al.length)|0];n.bless=Math.max(n.bless,20);log(`A golden age dawns in ${n.name}.`,'life')}}
}
function eruptVolcano(i,god){
  const x=i%W,y=(i/W)|0,hit=new Set();
  brush(i,4,(j,d)=>{h[j]=clamp(h[j]+.2*(1-d/4.5),0,1);if(d<=2&&owner[j]>=0){hit.add(owner[j]);claim(j,-1)}});
  for(const id of hit)nations[id].pop*=.85;terrainDirty=true;eruptions.push({x:wx(x),z:wz(y),t:0});
  log(god?`At your word, the mountain tore open.`:`A volcano erupted${hit.size?' near '+[...hit].map(k=>nations[k].name).join(' and '):''}.`,'doom');
}

/* ---------- milestones ---------- */
const MILESTONES=['city2','war','contact','faith','era1','trade','famine','era3','sail','explore','colony','wonder','hurricane','era5','democracy','naval','rebel','pandemic','tsunami','million','era7','federation','stars'];
const milestoneInfo={};
function milestone(id,title,text){if(milestones.has(id))return;milestones.add(id);milestoneInfo[id]={title,text,year};if(typeof toast==='function')toast(title,text)}

/* ---------- save / load ---------- */
function b64(arr){const u=new Uint8Array(arr.buffer,arr.byteOffset,arr.byteLength);let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s)}
function unb64(s,T){const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return new T(u.buffer)}
function buildSave(){
  if(!worldOpts.slot)worldOpts.slot=Date.now().toString(36)+Math.floor(rng()*1e6).toString(36);
  return {v:4,slot:worldOpts.slot,worldName:worldOpts.name||'Unnamed world',owner:account.user||null,worldOpts,sizeKey,lookKey,W,H,worldSeed,year,belief,climate,flags,dayT,
    deps:deposits,annals,hist,snaps,colonies,planets,worldWars,h:b64(h),bm:b64(baseMoist),md:b64(moistD),wd:warmD&&warmD.length===N?b64(warmD):null,owner16:b64(owner),
    nations:nations.map(n=>Object.assign({},n,{wars:[...n.wars],nb:[],front:[],_walk:0,_resMod:null,cities:n.cities.map(c=>{const o={};for(const k in c)if(k[0]!=='_')o[k]=c[k];return o})})),ruins,warData,cultSeeds,coves,faiths,logs:logs.slice(0,60),
    milestones:[...milestones],mi:milestoneInfo,rivers,riv:b64(river),folk,folkId,houses,saved:Date.now(),
    summary:{nations:nations.filter(n=>n.alive).length,era:nations.reduce((m,n)=>n.alive?Math.max(m,n.era):m,0)}}}
function saveLocal(d){try{localStorage.setItem('faithbound.save',JSON.stringify(d));return true}catch(e){return false}}
/* saves locally always, and to the account when signed in; returns a promise of where it landed */
function saveGame(){if(typeof viewOnly!=='undefined'&&viewOnly)return Promise.resolve('none');if(typeof coopGuest==='function'&&coopGuest())return Promise.resolve('none');if(typeof rewind!=='undefined'&&rewind)return Promise.resolve('none');const d=buildSave(),local=saveLocal(d);
  if(account.user)return cloudSave(d).then(ok=>ok?'cloud':local?'local':'none');return Promise.resolve(local?'local':'none')}
async function cloudSave(d,keepalive){try{const body=JSON.stringify(d);
  const r=await fetch('/api/saves/'+d.slot,{method:'PUT',headers:{'Content-Type':'application/json'},credentials:'same-origin',body,keepalive:!!keepalive&&body.length<60000});
  if(r.ok){account.lastCloud=Date.now();return true}if(r.status===401){account.user=null}}catch(e){}return false}
function saveInfo(){try{const d=JSON.parse(localStorage.getItem('faithbound.save')||'null');return d?{year:d.year,saved:d.saved,size:d.sizeKey,count:d.nations.filter(n=>n.alive).length,name:d.worldName,slot:d.slot,owner:d.owner}:null}catch(e){return null}}
function loadGame(){let d;try{d=JSON.parse(localStorage.getItem('faithbound.save')||'null')}catch(e){}return d?applySave(d):false}
function applySave(d){

  for(const s of ships)disposeShip(s);ships=[];for(const r of rockets)scene.remove(r.g);rockets=[];walkers=[];parts=[];eruptions=[];
  sizeKey=d.sizeKey;W=d.W;H=d.H;N=W*H;worldSeed=d.worldSeed;hseed=(worldSeed%9973)/7;
  h=unb64(d.h,Float32Array);baseMoist=unb64(d.bm,Float32Array);moistD=unb64(d.md,Float32Array);warmD=d.wd?unb64(d.wd,Float32Array):null;owner=unb64(d.owner16||d.owner,Int16Array);
  biome=new Uint8Array(N);hab=new Float32Array(N);resetDisasters();
  worldOpts=Object.assign({pace:'standard',customN:1,customUnit:'weeks',calendar:false,anchorReal:0,anchorYear:0,maxEra:7},d.worldOpts||{});if(!PACES[worldOpts.pace])worldOpts.pace='standard';worldOpts.slot=d.slot||worldOpts.slot||null;worldOpts.name=d.worldName||worldOpts.name||'Unnamed world';if(!PACES[worldOpts.pace])worldOpts.pace='quick';
  year=d.year;belief=d.belief;climate=d.climate;flags=d.flags;dayT=d.dayT||.22;
  ruins=d.ruins||[];warData=d.warData||{};cultSeeds=d.cultSeeds||[];coves=d.coves||[];
  nations=d.nations.map(n=>Object.assign(n,{wars:new Set(n.wars),nb:new Set(),front:[],_walk:0,gov:n.gov||'tribal'}));if(!cultSeeds.length)seedCultures();for(const n of nations){if(!n.culture){const c=n.cities[0];n.culture=c?cultureAt(c.x,c.y):'west'}if(!n.allies)n.allies=[];if(n.devotion==null)n.devotion=.3;if(n.festival==null)n.festival=0;if(!n.techs){grantTechsUpTo(n);n.tech=0}for(const k of ['known','trade','ties','reigns'])if(!n[k])n[k]=[];if(n.ruler===undefined)n.ruler=null;if(n.house===undefined)n.house=null}faiths=d.faiths.map(f=>Object.assign({tenets:f.tenets||[f.tenet],glyph:f.glyph||'star'},f));logs=d.logs;
  rivers=d.rivers||[];river=d.riv?unb64(d.riv,Uint8Array):new Uint8Array(N);
  folk=d.folk||{};folkId=d.folkId||0;houses=d.houses||[];
  milestones=new Set(d.milestones);Object.assign(milestoneInfo,d.mi||{});
  selected=-1;inspectTile=-1;selectedFaith=-1;warFrom=-1;moistActive=60;effects=[];
  if(d.lookKey&&LOOKS[d.lookKey])applyLook(d.lookKey);
  buildTerrain();computeTerrain();layoutTerrain();seedClouds();deposits=d.deps||[];if(!deposits.length)seedDeposits();indexDeposits();annals=d.annals||[];hist=d.hist||[];snaps=d.snaps||[];colonies=d.colonies||[];worldWars=d.worldWars||[];planets=d.planets||{moon:{terra:0,life:0},mars:{terra:0,life:0}};
  camT.set(0,0,0);camDistT=camDist=Math.max(W,H)*.85;propsDirty=true;bordersDirty=true;return true;
}
