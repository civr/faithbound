"use strict";
/* Faithbound — tales of the sea, and legends.
   Every world draws a few of these stories, not all of them, and each comes once, in its own age, so no two worlds play alike:
   the Sea Peoples (raiders or traders, who settle at last), sea nomads with their boat village, a pirate republic, the great storm flood
   that drowns a town (and the dikes and polders that follow), Atlantis, the island in the fog, the ghost ship, the lost colony,
   the sea serpent and the singing rocks. Wrecks lie where ships went down, and in the modern age divers raise them.
   Legends grow out of what really happened: a great town lost to the sea or to fire is retold over the centuries, grander each time,
   until archaeologists find what is left of it. */

if(!('tales' in GODW))GODW.tales=null;
const TALE_IDS=['seapeoples','nomads','republic','flood','atlantis','fog','ghost','lostcol','serpent','sirens'];
const tp=a=>a[(rng()*a.length)|0],tcap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const topEra=()=>{let t=0;for(const n of nations)if(n.alive)t=Math.max(t,n.era);return t};
function T(){if(!GODW.tales||!GODW.tales.picked){const ids=TALE_IDS.slice().sort(()=>rng()-.5),k=3+((rng()*3)|0);
    GODW.tales=Object.assign({picked:ids.slice(0,k),done:{},wrecks:[],legends:[],drowned:[],lost:[],dikes:{}},GODW.tales&&!GODW.tales.picked?{}:{})}return GODW.tales}
const has=id=>T().picked.includes(id)&&!T().done[id];
/* open sea far from any land, and a sheltered bay */
function openSea(minLand){for(let q=0;q<600;q++){const x=4+((rng()*(W-8))|0),y=4+((rng()*(H-8))|0),j=y*W+x;if(!isWater(j)||biome[j]!==0)continue;let ok=true;
    for(let dy=-minLand;dy<=minLand&&ok;dy+=2)for(let dx=-minLand;dx<=minLand;dx+=2){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;if(!isWater(Y*W+X)){ok=false;break}}if(ok)return j}return -1}
function bay(){for(let q=0;q<900;q++){const j=(rng()*N)|0;if(biome[j]!==1)continue;const x=j%W,y=(j/W)|0;let land=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=x+dx,Y=y+dy;if(X>=0&&Y>=0&&X<W&&Y<H&&!isWater(Y*W+X))land++}
    if(land>=3&&land<=5&&!nearCity(x,y,4))return j}return -1}
const nearestNation=(x,y,f)=>{let b=null,bd=1e9;for(const n of nations){if(!n.alive||(f&&!f(n)))continue;for(const c of n.cities){const d=Math.hypot(c.x-x,c.y-y);if(d<bd){bd=d;b={n,c,d}}}}return b};
const told=n=>important(n)||n.id===selected;

/* ---------- the stories ---------- */
const SP_NAMES=['Peleset','Sherden','Shekelesh','Ekwesh','Denyen','Tjeker','Weshesh'];
function taleSeaPeoples(){const S=T(),peaceful=rng()<.4;
  if(peaceful){log('Ships without number came out of the open sea: the Sea Peoples. They came not to raid but to trade, and brought bronze, purple dye and the craft of building better ships.','era');
    for(const n of nations)if(n.alive&&n.cities.some(c=>coastWater(c).length)){n.tech+=TECHCOST[n.era]*.25;n.happy=clamp(happyOf(n)+.03,0,1)}}
  else{log('Ships without number came out of the open sea: the Sea Peoples, whole families aboard, burning and taking the coasts.','war');
    for(let k=0;k<3+((rng()*3)|0);k++){const before=ships.length;spawnPirate();if(ships.length>before)ships[ships.length-1].seaPeople=true}
    let hit=0;for(const n of nations)if(n.alive&&n.era<=2&&(n.trade||[]).length){n.trade=[];n.tech*=.8;n.happy=clamp(happyOf(n)-.06,0,1);hit++;if(rng()<.35&&typeof startFamine==='function')startFamine(n,'hunger')}
    if(hit)log(`Trade along the coasts broke down; ${hit} nation${hit>1?'s':''} lost the learning of a generation.`,'doom')}
  milestone('seapeoples','The Sea Peoples','Strangers came out of the open sea.');S.sp={y:year+6+((rng()*10)|0),peaceful}}
function seaPeoplesSettle(){const S=T();let best=-1,bs=-1;for(let q=0;q<1500;q++){const j=(rng()*N)|0;if(owner[j]>=0||isWater(j)||!coastWater({x:j%W,y:(j/W)|0}).length)continue;const sc=siteScore(j);if(sc>bs){bs=sc;best=j}}
  const nm=tp(SP_NAMES);if(best>=0&&bs>.3){const n=newNation(best%W,(best/W)|0,{name:nm});n.era=Math.max(1,Math.min(3,topEra()));n.techs=TECHS.filter(t=>t.era<n.era).map(t=>t.id);n.doc='naval';n.pop=30;
    log(`The Sea Peoples settled on an empty shore and founded the land of ${n.name}.`,'era')}
  else if(!S.sp.peaceful){const t=nearestNation(W/2,H/2,n=>n.cities.length>=2);if(t){const c=t.n.cities.find(q=>q!==t.n.cities[0]&&coastWater(q).length);if(c)try{rebel(t.n,c,'free',`The Sea Peoples seized ${c.name} from ${t.n.name} and made it their home.`)}catch(e){}}}
  S.sp=null}

const NOMAD_NAMES=['Bajo','Moken','Orang Laut','Tanka','Sama'];
function taleNomads(){const S=T(),j=bay();if(j<0)return false;S.nom={i:j,since:year,name:tp(['the Sea Folk','the Boat People','the Drifters','the Tide People','the Salt Clans'])};
  const t=nearestNation(j%W,(j/W)|0);log(`${tcap(S.nom.name)}, who live their whole lives on the water, moored their boat village in a sheltered bay${t?' near '+t.c.name:''}.`,'life');return true}
function nomadsYear(){const S=T(),m=S.nom;if(!m)return;if(topEra()>=6){const t=nearestNation(m.i%W,(m.i/W)|0);if(t){t.n.pop*=1.02;log(`${tcap(m.name)} left their boats at last and settled ashore in ${t.n.name}.`,'life')}S.nom=null;S.done.nomads=1;return}
  const t=nearestNation(m.i%W,(m.i/W)|0);if(t&&t.d<12){t.n.fishCatch=(t.n.fishCatch||0)+.25;t.n.tech+=TECHCOST[t.n.era]*.003}
  if(year-m.since>40&&rng()<.025){const j=bay();if(j>=0){m.i=j;m.since=year;const t2=nearestNation(j%W,(j/W)|0);if(t2&&told(t2.n))log(`${tcap(m.name)} poled their boat village away to a new bay near ${t2.c.name}; the old fishing grounds were spent.`,'life')}}}

function taleRepublic(){if(!coves.length)return false;const cv=coves[0];cv.republic=year;T().rep={x:cv.x,y:cv.y,name:cv.name};
  log(`Pirate captains made ${cv.name} a free port with its own laws, its own flag and its own council: a pirate republic.`,'war');milestone('republic','A pirate republic','Pirates made a free port of their own.');return true}
function republicYear(){const S=T(),R_=S.rep;if(!R_)return;const cv=coves.find(c=>c.x===R_.x&&c.y===R_.y);if(!cv){S.rep=null;S.done.republic=1;return}
  if(rng()<.12)spawnPirate();
  const navy=nations.find(n=>n.alive&&n.era>=SAIL&&n.doc==='naval'&&n.cities.some(c=>Math.hypot(c.x-cv.x,c.y-cv.y)<30));
  if(navy&&rng()<.03){coves.splice(coves.indexOf(cv),1);propsDirty=true;if(typeof ignite==='function')ignite(cv.y*W+cv.x);log(`The fleet of ${navy.name} stormed the free port of ${cv.name} and hanged its captains.`,'war');S.rep=null;S.done.republic=1;return}
  if(topEra()>=5&&year-cv.republic>40&&rng()<.025&&owner[cv.y*W+cv.x]<0){coves.splice(coves.indexOf(cv),1);const n=newNation(cv.x,cv.y,{name:cv.name.split(' ')[0]+' Haven'});n.era=topEra()-1;n.techs=TECHS.filter(t=>t.era<n.era).map(t=>t.id);n.doc='naval';
    log(`The free port of ${cv.name} gave up piracy and became a respectable trading town: ${n.name}.`,'era');S.rep=null;S.done.republic=1}}

/* the great storm flood: the sea breaks through a low coast, a town drowns, its tower left standing in the water; then dikes and polders */
function lowTown(){const L=[];for(const n of nations){if(!n.alive)continue;for(const c of n.cities){if(c===n.cities[0]&&n.cities.length<3)continue;const j=c.y*W+c.x;if(h[j]-sea<.035&&coastWater(c).length)L.push({n,c})}}return L.length?tp(L):null}
function taleFlood(){const t=lowTown();if(!t)return false;const {n,c}=t,j=c.y*W+c.x,keep={name:c.name,x:c.x,y:c.y,year,nid:n.id,lv:townLevel(n,c===n.cities[0])};let drowned=false,tiles=0;
  brush(j,2.4,(q,d)=>{if(isWater(q)||h[q]-sea>=.032)return;h[q]=sea-.012;tiles++;if(q===j)drowned=true});if(!tiles)return false;
  if(drowned){const k=n.cities.indexOf(c);if(k>0)n.cities.splice(k,1);else drowned=false}
  brush(j,2.4,(q)=>{if(h[q]<sea&&owner[q]>=0)claim(q,-1,'flood')});terrainDirty=true;propsDirty=true;bordersDirty=true;shakeT=Math.max(shakeT||0,.3);
  if(typeof spawnStorm==='function')try{spawnStorm('storm',wx(c.x),wz(c.y))}catch(e){}
  log(`In the great storm flood of ${year} the sea broke through the low coast of ${n.name}. ${drowned?`The town of ${c.name} drowned; only its tower still stands above the waves.`:'Farms and villages were drowned.'}`,'doom');
  if(drowned){T().drowned.push(keep);addLegend({name:keep.name,x:keep.x,y:keep.y,kind:'drowned',lv:keep.lv,nation:n.name})}
  T().dikes[n.id]=year;milestone('stormflood','The great storm flood','The sea broke through a low coast.');return true}
function polderYear(){const S=T();for(const id in S.dikes){const n=nations[id];if(!n||!n.alive||n.era<3)continue;if(!S.dikes[id+'_said']){S.dikes[id+'_said']=1;if(told(n))log(`${n.name} began to build dikes along its low coast, so the sea would never take its land again.`,'era')}
    if(rng()>.035)continue;/* a polder: shallow water behind the dikes drained and made land */
    const got=[];for(const c of n.cities){if(got.length)break;for(let dy=-5;dy<=5&&got.length<4;dy++)for(let dx=-5;dx<=5&&got.length<4;dx++){const X=c.x+dx,Y=c.y+dy;if(X<1||Y<1||X>=W-1||Y>=H-1)continue;const q=Y*W+X;
      if(!isWater(q)||biome[q]!==1||h[q]<sea-.035)continue;let own=0;for(let d=0;d<4;d++)if(owner[(Y+DY[d])*W+X+DX[d]]===n.id)own++;if(own>=2)got.push(q)}}
    if(!got.length)continue;for(const q of got){h[q]=sea+.012;S.polders=(S.polders||[]);S.polders.push(q)}terrainDirty=true;propsDirty=true;
    setTimeout(()=>{for(const q of got)if(!isWater(q)&&owner[q]<0)claim(q,n.id)},50);
    if(told(n))log(`${n.name} won new land from the sea: the ${cultureName(cultOf(n))} polder.`,'era')}}

/* Atlantis: a small island far out to sea, far ahead of everyone, until it sinks */
function taleAtlantis(){const j=openSea(8);if(j<0)return false;const x=j%W,y=(j/W)|0;
  brush(j,2.8,(q,d)=>{const f=1-d/3.3;h[q]=Math.max(h[q],sea+.025+f*.07+hash(q)*.01)});terrainDirty=true;if(typeof computeTerrain==='function')try{computeTerrain()}catch(e){}
  const n=newNation(x,y,{name:'Atlantis'});n.atl=1;n.era=Math.min(7,Math.max(2,topEra()+1));n.techs=TECHS.filter(t=>t.era<n.era).map(t=>t.id).concat(['sailing']);n.doc='naval';n.pop=45;n.gov='republic';
  brush(j,3,(q)=>{if(!isWater(q)&&owner[q]<0)claim(q,n.id)});T().atl={x,y,id:n.id,doom:year+350+((rng()*450)|0)};
  log('Far out on the open sea lies an island the sailors call Atlantis, whose people know things no one else has dreamt of.','era');return true}
function atlantisYear(){const S=T(),A=S.atl;if(!A)return;const n=nations[A.id];
  if(!A.sunk){if(!n||!n.alive){A.sunk=year;return}n.tech+=TECHCOST[n.era]*.02;n.happy=clamp(happyOf(n)+.002,0,1);
    if(n.era>=3&&rng()<.04){const o=nations.filter(m=>m.alive&&m!==n);if(o.length)try{launch(n,'trade',tp(o))}catch(e){}}
    if(year>=A.doom||topEra()>=5){/* the sinking */const j=A.y*W+A.x;log('Atlantis had grown proud beyond all measure. In one day and one night the earth shook and the sea rose over it, and the island sank beneath the waves.','doom');
      brush(j,3.4,(q)=>{if(!isWater(q)||h[q]>sea-.02){h[q]=Math.min(h[q],sea-.02)}if(owner[q]===A.id)claim(q,-1,'flood')});terrainDirty=true;propsDirty=true;bordersDirty=true;shakeT=1;
      if(n&&n.alive&&typeof fall==='function')try{fall(n,true)}catch(e){}
      A.sunk=year;addLegend({name:'Atlantis',x:A.x,y:A.y,kind:'atlantis',lv:12,nation:'Atlantis'});milestone('atlantis','Atlantis','An island sank beneath the waves.')}}
  else if(!A.found&&topEra()>=6&&rng()<.02){const t=nearestNation(A.x,A.y,m=>m.era>=6);if(t){A.found=year;t.n.tech+=TECHCOST[t.n.era]*.4;
      log(`Divers of ${t.n.name} found the ruins of Atlantis on the sea floor: a temple, a harbour and machines no one can explain. It was real.`,'era');const L=S.legends.find(l=>l.kind==='atlantis');if(L)L.found=year}}}

/* the island in the fog: seen only in certain years */
function taleFog(){const j=openSea(6);if(j<0)return false;T().fog={x:wx(j%W),z:wz((j/W)|0),on:year,off:year+3,next:year+50+((rng()*60)|0),seen:{}};
  log('Sailors swear that an island rose out of the fog where the charts show open sea.','sky');return true}
function fogYear(){const F=T().fog;if(!F)return;if(topEra()>=6){log('The island in the fog was never seen again; the charts of the modern age show only open sea.','sky');T().fog=null;T().done.fog=1;return}
  if(year>=F.next){F.on=year;F.off=year+2+((rng()*3)|0);F.next=year+45+((rng()*70)|0);F.seen={}}
  if(year>F.off||year<F.on)return;
  for(const s of ships){if(s.sink||s.kind==='war'||s.kind==='ghost'||s.owner<0||F.seen[s.owner]||Math.hypot(s.x-F.x,s.z-F.z)>1.8)continue;const n=nations[s.owner];if(!n)continue;F.seen[s.owner]=1;
    if(rng()<.7){n.tech+=TECHCOST[n.era]*.15;log(`Sailors of ${n.name} landed on the island in the fog. They came home with strange seeds and stranger stories.`,'sky')}
    else{s.sink=.01;log(`A ship of ${n.name} sailed into the fog bank and was never seen again.`,'sky')}}}

/* the ghost ship: a pale ship sailing against the wind at night; a storm follows */
function ghostSail(){const a=openSea(4),b=openSea(4);if(a<0||b<0||Math.hypot(a%W-b%W,((a/W)|0)-((b/W)|0))<25)return;const res=seaPath([a],(x,y)=>y*W+x===b?b:-1);if(!res)return;
  const g=makeShip(4,'trade','#d8e2e8');const mats=[];g.traverse(m=>{if(m.material){m.material=m.material.clone();m.material.transparent=true;m.material.opacity=.42;if(m.material.emissive)m.material.emissive.setHex(0x5a7a8a);mats.push(m.material)}});g.userData.mats=(g.userData.mats||[]).concat(mats);
  const p0=res.path[0],s={owner:-1,kind:'ghost',era:4,path:res.path,wp:null,seg:0,target:b,x:wx(p0%W),z:wz((p0/W)|0),sink:0,g,foamT:0};g.position.set(s.x,waterY,s.z);ships.push(s);
  const mid=res.path[res.path.length>>1],t=nearestNation(mid%W,(mid/W)|0);if(t){log(`Sailors of ${t.n.name} saw a pale ship sailing against the wind at night, with no one at the helm.`,'sky');T().omen={y:year+1+((rng()*2)|0),x:wx(t.c.x),z:wz(t.c.y),name:t.c.name}}}
function ghostYear(){const S=T();if(topEra()>=7){S.done.ghost=1;return}if(!S.ghostY||year>=S.ghostY){if(S.ghostY)ghostSail();S.ghostY=year+20+((rng()*40)|0)}
  if(S.omen&&year>=S.omen.y){try{spawnStorm('storm',S.omen.x,S.omen.z)}catch(e){}log(`A storm fell on ${S.omen.name}, as the old sailors had said it would.`,'sky');S.omen=null}}
{const _ar=arrive;arrive=function(s){if(s&&s.kind==='ghost')return;return _ar.apply(this,arguments)}}

/* the lost colony */
function taleLostColony(){const L=[];for(const n of nations){if(!n.alive||n.cities.length<2)continue;for(const c of n.cities)if(c.colony&&c!==n.cities[0])L.push({n,c})}if(!L.length)return false;
  const {n,c}=tp(L);n.cities.splice(n.cities.indexOf(c),1);brush(c.y*W+c.x,1.5,(q)=>{if(owner[q]===n.id)claim(q,-1)});propsDirty=true;bordersDirty=true;
  T().lost.push({name:c.name,x:c.x,y:c.y,year,nation:n.name,why:tp(['storm','plague','inland'])});
  log(`When the supply ships came back to ${c.name}, the colony of ${n.name} was empty: the houses standing, the fires cold, and one word carved into a post.`,'doom');milestone('lostcolony','The lost colony','A colony vanished without a trace.');return true}
function lostYear(){for(const L of T().lost){if(L.solved||year-L.year<60||rng()>.01)continue;L.solved=year;
  log(L.why==='storm'?`Explorers found the truth about ${L.name}: a storm had driven the colonists' boats onto the reef as they fled a hungry winter.`:L.why==='plague'?`Old graves were found near ${L.name}: a fever took the colonists one by one, and the last buried the others.`:`The mystery of ${L.name} was solved at last: its people had gone inland to live with the folk there, and their grandchildren still tell of it.`,'era')}}

/* the sea serpent and the singing rocks */
function taleSerpent(){for(let q=0;q<400;q++){const j=(rng()*N)|0;if(!isWater(j)||biome[j]!==0)continue;const t=nearestNation(j%W,(j/W)|0,n=>!n.atl);if(!t||t.d<3||t.d>8)continue;
    T().ser={x:wx(j%W),z:wz((j/W)|0),until:year+100+((rng()*100)|0),hp:3};log(`Sailors of ${t.n.name} tell of a great serpent in the waters off ${t.c.name}.`,'sky');return true}return false}
const serPos=(S,t)=>[S.x+Math.cos(t*.04)*2+Math.sin(t*.09)*.6,S.z+Math.sin(t*.05)*1.6];
function serpentYear(){const S=T().ser;if(!S)return;if(year>S.until||topEra()>=5){log('The sea serpent has not been seen for a generation; perhaps it never was.','sky');T().ser=null;T().done.serpent=1;return}
  const [x,z]=serPos(S,performance.now()/1000);for(const s of ships){if(s.sink||s.kind==='ghost'||Math.hypot(s.x-x,s.z-z)>1.3)continue;const n=nations[s.owner];
    if(s.kind==='war'){if(rng()<.3){S.hp--;if(S.hp<=0){log(`The warships of ${n?n.name:'a nation'} killed the sea serpent; its bones washed up on the shore.`,'war');T().ser=null;T().done.serpent=1;return}}else if(rng()<.15){s.sink=.01;if(n)log(`The sea serpent dragged a warship of ${n.name} under.`,'war')}}
    else if(rng()<.3){s.sink=.01;if(n&&told(n))log(`The sea serpent took a ship of ${n.name}.`,'war')}}}
function taleSirens(){const t=nearestNation(W/2,H/2,n=>!n.atl&&n.cities.some(c=>coastWater(c).length));if(!t)return false;const c=t.n.cities.find(q=>coastWater(q).length);
  for(let q=0;q<60;q++){const a=rng()*6.283,r=2+rng()*2,x=Math.round(c.x+Math.cos(a)*r),y=Math.round(c.y+Math.sin(a)*r);if(x<0||y<0||x>=W||y>=H||!isWater(y*W+x))continue;
    T().sir={x:wx(x),z:wz(y),name:c.name};log(`Ships began to founder on the rocks off ${c.name}; sailors swear they hear singing there at dusk.`,'sky');return true}return false}
function sirenYear(){const S=T().sir;if(!S||S.light)return;if(topEra()>=6){S.light=year;log(`A lighthouse now stands on the singing rocks off ${S.name}. No one has heard the singing since.`,'era');T().done.sirens=1;return}
  for(const s of ships){if(s.sink||s.kind==='war'||s.kind==='ghost'||Math.hypot(s.x-S.x,s.z-S.z)>.9||rng()>.12)continue;s.sink=.01;const n=nations[s.owner];if(n&&told(n)&&year-(S.said||-99)>15){S.said=year;log(`A ship of ${n.name} broke up on the singing rocks off ${S.name}.`,'sky')}}}

/* ---------- wrecks ---------- */
{const _us=updateShips;updateShips=function(dy,dt,now){for(const s of ships){if(s.sink>0&&!s._wr){s._wr=1;const S=T();if(['company','trade','war','pirate'].includes(s.kind)&&S.wrecks.length<14&&rng()<.3){const n=nations[s.owner];
        S.wrecks.push({x:s.x,z:s.z,a:s.g?s.g.rotation.y:0,kind:s.kind,year,who:n?n.name:'pirates',value:s.kind==='company'?3:s.kind==='pirate'?2:1})}}
    if(s.kind==='ghost'&&s.g)s.g.visible=typeof nightF==='undefined'||nightF>.35}return _us.apply(this,arguments)}}
function wreckYear(){if(topEra()<6)return;const S=T();S.wrecks=S.wrecks.filter(w=>{if(rng()>.01)return true;const t=nearestNation(w.x+W/2,w.z+H/2,n=>n.era>=6);if(!t)return true;
    t.n.tech+=TECHCOST[t.n.era]*.05*w.value;log(`Divers of ${t.n.name} raised ${w.value>=3?'silver and porcelain':w.value>=2?'pirate gold':'cannon and old timbers'} from the wreck of a ${w.kind==='company'?'company ship':w.kind==='pirate'?'pirate ship':w.kind==='war'?'warship':'merchant ship'} of ${w.who}, sunk in ${w.year}.`,'era');return false})}

/* ---------- legends: grown from what really happened ---------- */
function addLegend(o){const S=T();if(S.legends.some(l=>l.name===o.name&&Math.abs(l.x-o.x)<2))return;S.legends.push(Object.assign({year,told:0,next:year+120+((rng()*150)|0),found:0},o))}
let CITYSEEN=new Map();
function legendWatch(){const now=new Map();for(const n of nations){if(!n.alive)continue;n.cities.forEach((c,k)=>now.set(c,{name:c.name,x:c.x,y:c.y,cap:k===0,lv:townLevel(n,k===0),nation:n.name}))}
  for(const [c,info] of CITYSEEN)if(!now.has(c)&&(info.lv>=6||info.cap&&info.lv>=4)){const j=info.y*W+info.x;addLegend({name:info.name,x:info.x,y:info.y,kind:isWater(j)?'drowned':'fallen',lv:info.lv,nation:info.nation})}
  CITYSEEN=now}
const GRAND=['golden roofs','silver gates','hanging gardens','a hundred temples','streets paved with marble'];
const standing=L=>(L.kind==='fallen'||L.kind==='abandoned')&&nations.some(n=>n.alive&&n.cities.some(c=>c.name===L.name));
function legendYear(){const S=T();for(const L of S.legends){if(standing(L))continue;if(L.told<3&&year>=L.next){const o=nations.filter(n=>n.alive&&n.name!==L.nation);if(!o.length)continue;const n=tp(o),k=Math.round(L.lv*10*Math.pow(1.9,L.told+1));
      log(L.kind==='atlantis'?`Sailors in ${n.name} tell of Atlantis, the island beyond the sea, so wise that ${tp(['its ships needed no wind','its lamps burned without oil','it knew the paths of the stars','its people never fell ill'])}, until the gods drowned it for its pride.`
        :L.kind==='drowned'?`In ${n.name} they tell of ${L.name}, a city of ${k} towers that the sea swallowed in a single night${L.told?', for the pride of its rulers':''}. On still days, they say, you can hear its bells under the water.`
        :L.kind==='abandoned'?`Travellers in ${n.name} tell of ${L.name}, a city of ${tp(GRAND)} that the ${L.why==='dry'?'desert':L.why==='ice'?'ice':'wilderness'} swallowed${L.told?' when its people forgot the gods':''}.`:`Bards in ${n.name} sing of ${L.name}, a city of ${tp(GRAND)}, ${k} thousand strong, burned in a single day.`,'sky');
      L.told++;L.next=year+150+((rng()*250)|0);if(!milestones.has('legend'))milestone('legend','Legends','A lost city became a legend.')}
    if(!L.found&&L.told>=1&&L.kind!=='atlantis'&&topEra()>=6&&rng()<.008){const t=nearestNation(L.x,L.y,n=>n.era>=6);if(!t)continue;L.found=year;t.n.tech+=TECHCOST[t.n.era]*.15;
      log(`Archaeologists of ${t.n.name} found the ruins of ${L.name}. The tales spoke of ${L.kind==='drowned'?'a city of towers under the sea':'a city of '+tp(GRAND)}; they found ${L.kind==='drowned'?`the foundations of a town of some ${Math.round(L.lv*40)} houses under the silt, and a church bell`:L.kind==='abandoned'?`streets and wells under the ${L.why==='dry'?'sand':'soil'}, and the foundations of some ${Math.round(L.lv*40)} houses`:`burnt walls, a market square and the foundations of some ${Math.round(L.lv*40)} houses`}.`,'era')}}}

/* ---------- the year ---------- */
const TALE_WIN={seapeoples:[1,2,.006,taleSeaPeoples],nomads:[0,5,.005,taleNomads],republic:[4,5,.012,taleRepublic],flood:[2,6,.004,taleFlood],atlantis:[0,2,.02,taleAtlantis],
  fog:[2,5,.005,taleFog],ghost:[3,6,.008,()=>{T().ghostY=year;return true}],lostcol:[4,5,.006,taleLostColony],serpent:[0,4,.005,taleSerpent],sirens:[1,5,.005,taleSirens]};
function talesTick(){const S=T(),te=topEra();
  for(const id of S.picked){if(S.done[id]||S['run_'+id])continue;const [a,b,p,fn]=TALE_WIN[id];if(te<a)continue;if(te>b){S.done[id]=1;continue}if(rng()<p){if(fn()!==false){S['run_'+id]=year;if(['seapeoples','flood','lostcol'].includes(id))S.done[id]=1}}}
  if(S.sp&&year>=S.sp.y)seaPeoplesSettle();
  nomadsYear();republicYear();polderYear();atlantisYear();fogYear();if(S.run_ghost&&!S.done.ghost)ghostYear();lostYear();serpentYear();sirenYear();wreckYear();legendWatch();legendYear()}
{const _t=tick;tick=function(){_t.apply(this,arguments);try{talesTick()}catch(e){console.warn('tales',e)}}}
{const _as=applySave;applySave=function(){const r=_as.apply(this,arguments);CITYSEEN=new Map();return r}}

/* ---------- what you see ---------- */
function talesFrame(R2){if(!GODW.tales)return;const S=GODW.tales,now=performance.now()/1000,near=(x,z,k=1)=>{const ex=x-camT.x,ez=z-camT.z;return ex*ex+ez*ez<R2*k};
  /* the boat village */if(S.nom){const x=wx(S.nom.i%W),z=wz((S.nom.i/W)|0);if(near(x,z)){for(let q=0;q<7;q++){const a=q*.9+S.nom.since,r=.12+(q%3)*.07,bx=x+Math.cos(a)*r,bz=z+Math.sin(a)*r,y=seaY(bx,bz);
        add('gwBox',bx,y-.004,bz,.085,.016,.032,a,0x6a4a30);add('colBall',bx,y+.008,bz,.045,.026,.03,a,0xc8a868)}
      for(let q=0;q<3;q++){const a=q*2.1+1,bx=x+Math.cos(a)*.32,bz=z+Math.sin(a)*.32,g=Math.min(groundY(bx,bz),waterY);for(const [ox,oz] of [[-.02,-.02],[.02,-.02],[-.02,.02],[.02,.02]])add('gwBox',bx+ox,g,bz+oz,.004,waterY-g+.03,.004,0,0x5a4430);
        add('gwBox',bx,waterY+.03,bz,.055,.03,.05,a,0x8a6a44);add('gwCone',bx,waterY+.06,bz,.07,.035,.065,a+.785,0xc8a868)}if(rng()<.05)emit('smoke',x,waterY+.05,z)}}
  /* drowned towers */for(const d of S.drowned){const x=wx(d.x),z=wz(d.y);if(!near(x,z))continue;const g=groundY(x,z),ht=waterY-g+.14;add('gwBox',x,g,z,.06,ht,.06,.3,0x8a8278);add('gwCone',x,g+ht,z,.075,.07,.075,1.085,0x4a4a52)}
  /* dikes along the low coast of nations that build them */if(Object.keys(S.dikes).length&&camDist<14){for(const id in S.dikes){if(id.includes('_'))continue;const n=nations[id];if(!n||!n.alive||n.era<3)continue;
      for(const c of n.cities){const cx=wx(c.x),cz=wz(c.y);if(!near(cx,cz,2))continue;for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const X=c.x+dx,Y=c.y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const q=Y*W+X;if(isWater(q)||owner[q]!==n.id||h[q]-sea>.04)continue;
          for(let d=0;d<4;d++){const q2=(Y+DY[d])*W+X+DX[d];if(!isWater(q2))continue;const ex=wx(X)+DX[d]*.42,ez=wz(Y)+DY[d]*.42;add('gwBox',ex,groundY(ex,ez)-.01,ez,DX[d]?.08:1,.035,DX[d]?1:.08,0,0x6a7a4a)}}}}}
  /* Atlantis: white columns under the shallow sea */if(S.atl&&S.atl.sunk){const x=wx(S.atl.x),z=wz(S.atl.y);if(near(x,z,2))for(let q=0;q<10;q++){const a=q/10*6.283,r=.35+(q%2)*.2,cx=x+Math.cos(a)*r,cz=z+Math.sin(a)*r,g=groundY(cx,cz);add('gwBox',cx,g,cz,.025,.06+(q%3)*.04,.025,0,0xe8e4d8)}}
  /* the island in the fog */if(S.fog&&year>=S.fog.on&&year<=S.fog.off&&near(S.fog.x,S.fog.z,3)){const F=S.fog;add('colBall',F.x,waterY-.12,F.z,1.4,.3,1.1,0,0x5a7a4a);
    for(let q=0;q<9;q++){const a=q*.7,r=.2+(q%3)*.15;add('gwCone',F.x+Math.cos(a)*r,waterY+.04,F.z+Math.sin(a)*r,.07,.18,.07,0,0x2e4a34)}if(rng()<.6)emit('smoke',F.x+(rng()-.5)*1.6,waterY+.05,F.z+(rng()-.5)*1.4)}
  /* the lost colony: empty huts and the carved post */for(const L of S.lost){const x=wx(L.x),z=wz(L.y);if(!near(x,z))continue;for(let q=0;q<4;q++){const a=q*1.6,hx=x+Math.cos(a)*.12,hz=z+Math.sin(a)*.12;add('gwBox',hx,groundY(hx,hz),hz,.06,.028,.05,a,0x7a6a5a)}add('gwBox',x,groundY(x,z),z,.008,.07,.008,0,0x5a4430)}
  /* the sea serpent: arched coils rolling through the water, and a head */if(S.ser){const [x,z]=serPos(S.ser,now);if(near(x,z,2)){const hd=Math.atan2(Math.cos(now*.05)*1.6*.05,-Math.sin(now*.04)*2*.04);
      for(let q=1;q<=4;q++){const t=q*.1,px=x-Math.cos(hd)*t,pz=z+Math.sin(hd)*t,up=Math.sin(now*1.6-q*1.3)*.012;add('colBall',px,waterY-.012+up,pz,.05-q*.004,.035,.024,hd,0x2e5246)}
      add('gwCyl',x+Math.cos(hd)*.03,waterY-.02,z-Math.sin(hd)*.03,.014,.08,.014,0,0x2e5246);add('colBall',x+Math.cos(hd)*.045,waterY+.065+Math.sin(now*1.6)*.01,z-Math.sin(hd)*.045,.04,.024,.024,hd,0x2e5246);if(rng()<.2)emit('foam',x,waterY+.01,z,0,0)}}
  /* the singing rocks, later a lighthouse */if(S.sir&&near(S.sir.x,S.sir.z,2)){const R_=S.sir;for(let q=0;q<5;q++){const a=q*1.3,rx=R_.x+Math.cos(a)*.12,rz=R_.z+Math.sin(a)*.1;add('gwCone',rx,waterY-.03,rz,.08,.08+(q%2)*.05,.08,a,0x6a6660)}
    if(R_.light){add('gwBox',R_.x,waterY,R_.z,.05,.22,.05,0,0xf0ece4);add('gwBox',R_.x,waterY+.12,R_.z,.052,.03,.052,0,0xc83a2a);add('gwCone',R_.x,waterY+.22,R_.z,.06,.05,.06,0,0x3a3a3a)}else if(rng()<.15)emit('smoke',R_.x,waterY+.03,R_.z)}
  /* wrecks on the sea floor, seen through shallow water */for(const w of S.wrecks){if(!near(w.x,w.z))continue;const g=groundY(w.x,w.z);if(waterY-g>.4)continue;add('gwBox',w.x,g,w.z,.18,.04,.05,w.a,0x3a2a1e);add('gwBox',w.x+.03,g+.02,w.z,.006,.1,.006,w.a,0x3a2a1e)}
  /* the pirate republic's flag */if(S.rep){const x=wx(S.rep.x),z=wz(S.rep.y),g=groundY(x,z);if(near(x,z)){add('gwBox',x,g,z,.006,.2,.006,0,0x4a3a2a);add('gwBox',x+.03,g+.17,z,.06,.035,.004,0,0x161616)}}}
{const _bf=banditFrame;banditFrame=function(R2){_bf.apply(this,arguments);try{talesFrame(R2)}catch(e){console.warn('tales draw',e)}}}
