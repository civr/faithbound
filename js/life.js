"use strict";
/* Faithbound — a living world: prayers you can answer, choices that shape a people, your avatar walking the land,
   great people, tradeTrains on the roads, and animals, birds, seaWhales and fishing boats in the countryside and the sea. */

/* ---------- prayers: peoples in trouble ask you for help; answer in time and their faith soars ---------- */
let prayers=[],prayT=0,prayId=0;
const PRAYER={
  famine:{tools:['rain','fertile','festival','miracle'],text:n=>`${n.name} is starving and begs for rain or a harvest.`,hint:'Rain, Fertile land, Festival or Miracle'},
  plague:{tools:['miracle'],text:n=>`${n.name} is dying of ${n.sick?n.sick.name:'sickness'} and prays to be healed.`,hint:'Miracle'},
  war:{tools:['bless','hero','inspire','miracle','peace'],text:n=>`${n.name} is losing its war and prays for victory or peace.`,hint:'Bless, Hero, Inspire, Miracle or Peace'},
  siege:{tools:['bless','hero','miracle','peace'],text:(n,c)=>`${c?c.name:'A town'} of ${n.name} is under siege. Its people pray to be saved.`,hint:'Bless, Hero, Miracle or Peace'},
  sorrow:{tools:['festival','bless','golden','miracle'],text:n=>`The people of ${n.name} are miserable and pray for better days.`,hint:'Festival, Bless, Golden age or Miracle'},
  faith:{tools:['faith','prophet'],text:n=>`${n.name} seeks a faith and asks for a sign.`,hint:'bring them a Faith or a Prophet'},
  drought:{tools:['rain'],text:n=>`The fields of ${n.name} are cracking. They pray for rain.`,hint:'Rain'}};
function prayerNeed(n){if(n.famine>0)return 'famine';if(n.sick)return 'plague';
  const sc=n.cities.find(c=>c.siege>.25);if(sc)return 'siege';
  if(n.wars.size){for(const b of n.wars){const B=nations[b],w=B&&warData[warKey(n,B)];if(w&&(n.id<B.id?w.score:-w.score)<-6)return 'war'}}
  if((n.happy??.6)<.36)return 'sorrow';if(n.faith<0&&(n.devotion??.3)>.25&&n.era>=1)return 'faith';
  if(climate.rain<.35&&rng()<.3)return 'drought';return null}
function prayerTick(){prayers=prayers.filter(p=>{const n=nations[p.n];if(!n||!n.alive)return false;
    if(year>p.until){n.devotion=clamp((n.devotion??.3)-.12,0,1);n.happy=clamp((n.happy??.6)-.05,0,1);log(`${n.name} prayed and no god answered. Their faith in you cracks.`,'faith');return false}return true});
  {const M=mood();if(--prayT>0||prayers.length>=M.prayMax)return;prayT=M.pray[0]+((rng()*(M.pray[1]-M.pray[0]))|0)}
  const al=nations.filter(n=>n.alive&&n.cities.length&&!prayers.some(p=>p.n===n.id));for(let t=0;t<6&&al.length;t++){const n=al[(rng()*al.length)|0],k=prayerNeed(n);if(!k)continue;
    const c=k==='siege'?n.cities.find(c=>c.siege>.25):n.cities[0];prayers.push({id:++prayId,n:n.id,k,text:PRAYER[k].text(n,c),until:year+(settings.mood==='turbulent'?14:20),c:c?[c.x,c.y]:null});
    log(`Prayer: ${PRAYER[k].text(n,c)}`,'faith');if(c)toast('A prayer rises',PRAYER[k].text(n,c),wx(c.x),wz(c.y));renderPrayers();break}}
function answerPrayers(toolId,i){const o=i>=0?owner[i]:-1;let hit=false;
  for(const p of [...prayers]){if(!PRAYER[p.k].tools.includes(toolId))continue;const n=nations[p.n];if(!n)continue;
    if(o!==p.n&&!(toolId==='rain'&&p.c&&Math.hypot(p.c[0]-i%W,p.c[1]-((i/W)|0))<5))continue;
    prayers.splice(prayers.indexOf(p),1);n.devotion=clamp((n.devotion??.3)+.25,0,1);n.happy=clamp((n.happy??.6)+.1,0,1);n.stab=Math.min(1,stabOf(n)+.06);
    log(`You answered the prayer of ${n.name}. They sing your name in every street.`,'faith');toast('Prayer answered',`${n.name} rejoices. Their faith in you soars.`);if(typeof sfx==='function')sfx('chime');hit=true}
  if(hit)renderPrayers()}
function renderPrayers(){const el=$('#prayers');if(!el)return;if(!prayers.length||!playing){el.hidden=true;return}el.hidden=false;
  el.classList.toggle('fold',!!window.prayFold);el.innerHTML=`<button class="prayHead" data-prayfold><b class="lab">Prayers · ${prayers.length}</b><span>${window.prayFold?'Show ▾':'Hide ▴'}</span></button>`+prayers.map(p=>{const n=nations[p.n];return `<button class="pray" data-pray="${p.id}"><i style="background:${n?n.color:'#999'}"></i><span>${esc(p.text)}<small>${PRAYER[p.k].hint} · ${Math.max(0,p.until-year)} yr left</small></span></button>`}).join('')}
document.addEventListener('click',e=>{if(e.target.closest('[data-prayfold]')){window.prayFold=!window.prayFold;renderPrayers();return}const b=e.target.closest('[data-pray]');if(!b)return;const p=prayers.find(q=>q.id===+b.dataset.pray);if(!p)return;const n=nations[p.n];
  const c=p.c||(n&&n.cities[0]&&[n.cities[0].x,n.cities[0].y]);if(c){focusOn(wx(c[0]),wz(c[1]),Math.min(camDist,14));selected=p.n;renderNationCard()}
  const t=PRAYER[p.k].tools[0],P_=POWERS.find(x=>x.id===t);if(P_){curTab=P_.tab==='*'?curTab:P_.tab;buildDock();setTool(t)}});

/* ---------- choice events: a people brings you a question; your answer shapes them ---------- */
let eventT=40,eventOpen=null;
const EVENTS=[
  {id:'prophet',ok:n=>n.cities.length>0,title:n=>`A prophet in ${n.cities[0].name}`,text:n=>`A wild-eyed preacher in ${n.cities[0].name} claims to speak your words. Crowds follow him.`,
    opts:[['Bless him','Faith in you rises, but the rulers fear him',n=>{n.devotion=clamp((n.devotion??.3)+.18,0,1);n.stab=Math.max(0,stabOf(n)-.08)}],
      ['Silence him','The realm stays calm, faith cools',n=>{n.devotion=clamp((n.devotion??.3)-.08,0,1);n.stab=Math.min(1,stabOf(n)+.06)}],['Let it be','Nothing changes',()=>{}]]},
  {id:'warsign',ok:n=>n.era>=1&&nearFoe(n),title:n=>`${n.name} asks for a sign`,text:n=>`The ruler of ${n.name} asks whether you favour a war on ${nearFoe(n).name}.`,
    opts:[['Grant the sign','They march to war',n=>{const B=nearFoe(n);if(B)startWar(n,B,'god')}],['Forbid it','They swear thirty years of peace',n=>{const B=nearFoe(n);if(B){n.pacts=n.pacts||{};B.pacts=B.pacts||{};n.pacts[B.id]=B.pacts[n.id]=year+30}n.devotion=clamp((n.devotion??.3)+.05,0,1)}],['Stay silent','They decide for themselves',()=>{}]]},
  {id:'scholars',ok:n=>n.era>=2,title:n=>`Doubting scholars`,text:n=>`Scholars in ${n.name} question whether the gods exist at all.`,
    opts:[['Strike them dumb','Faith rises, learning suffers',n=>{n.devotion=clamp((n.devotion??.3)+.12,0,1);n.tech=Math.max(0,n.tech*.8)}],['Inspire them','Learning blooms, faith wavers',n=>{n.inspire=(n.inspire||0)+12;n.devotion=clamp((n.devotion??.3)-.1,0,1)}],['Ignore them','Nothing changes',()=>{}]]},
  {id:'temple',ok:n=>n.faith>=0&&n.cities.length>0,title:n=>`A great temple`,text:n=>`The faithful of ${n.name} want to raise a great temple in your honour, if you show you are worthy. (30 belief)`,
    opts:[['Bless the work',`35 belief: a statue and much more faith`,n=>{if(!spend(30))return;n.devotion=clamp((n.devotion??.3)+.25,0,1);const c=n.cities[0];if(c)c.statue={faith:n.faith,year};propsDirty=true}],['Refuse','They are disappointed',n=>{n.devotion=clamp((n.devotion??.3)-.05,0,1)}]]},
  {id:'comet',ok:n=>true,title:n=>`A comet over ${n.name}`,text:n=>`A comet blazes over ${n.name}. The people ask what it means.`,
    opts:[['A sign of good fortune','The people are happier',n=>{n.happy=clamp((n.happy??.6)+.15,0,1)}],['A warning of doom','Fear brings them to the temples',n=>{n.devotion=clamp((n.devotion??.3)+.15,0,1);n.happy=clamp((n.happy??.6)-.1,0,1)}]]},
  {id:'rats',ok:n=>n.cities.length>1&&!n.sick,title:n=>`Rats in the granaries`,text:n=>`Rats swarm the granaries of ${n.name}. Sickness may follow. (15 belief to drive them out)`,
    opts:[['Drive them out',`15 belief: no sickness`,n=>{if(!spend(15))return;n.devotion=clamp((n.devotion??.3)+.06,0,1)}],['Let it be','They may fall sick',n=>{if(rng()<.6&&typeof infect==='function'&&typeof DISEASES!=='undefined')infect(n,DISEASES[(rng()*DISEASES.length)|0],null);else n.pop*=.97}]]},
  {id:'refugees',ok:n=>n.wars.size>0&&nearFriend(n),title:n=>`Refugees from ${n.name}`,text:n=>`War drives the people of ${n.name} from their homes. ${nearFriend(n).name} could take them in.`,
    opts:[['Open the gates','People move to safety; the hosts grumble',n=>{const B=nearFriend(n);if(!B)return;const m=n.pop*.06;n.pop-=m;B.pop+=m;B.happy=clamp((B.happy??.6)-.06,0,1);n.devotion=clamp((n.devotion??.3)+.08,0,1)}],['Turn them away','Many are lost',n=>{n.pop*=.96;n.happy=clamp((n.happy??.6)-.08,0,1)}]]}];
function nearFoe(n){for(const b of n.nb||[]){const B=nations[b];if(B&&B.alive&&!n.wars.has(b)&&!allied(n,B))return B}return null}
function nearFriend(n){for(const b of n.nb||[]){const B=nations[b];if(B&&B.alive&&!n.wars.has(b))return B}return null}
function eventTick(){if(settings.events===false||eventOpen||!playing||(typeof coopGuest==='function'&&coopGuest()))return;if(--eventT>0)return;{const M=mood();eventT=M.ev[0]+((rng()*(M.ev[1]-M.ev[0]))|0)}
  if(!$('#modal').hidden)return;const al=nations.filter(n=>n.alive&&n.cities.length);if(!al.length)return;
  for(let t=0;t<8;t++){const n=al[(rng()*al.length)|0],E=EVENTS[(rng()*EVENTS.length)|0];if(!E.ok(n))continue;openEvent(E,n);break}}
function openEvent(E,n){eventOpen={E,n:n.id,speed:speedIdx};speedIdx=0;updateHUD();$('#modalBox').classList.remove('wide');
  openModal(`<h2>${esc(E.title(n))}</h2><p class="note" style="font-size:.95rem">${esc(E.text(n))}</p><div class="evopts">${E.opts.map((o,k)=>`<button class="btn${k===0?' primary':''}" data-evo="${k}"><b>${esc(o[0])}</b><small>${esc(o[1])}</small></button>`).join('')}</div>`)}
document.addEventListener('click',e=>{const b=e.target.closest('[data-evo]');if(!b||!eventOpen)return;const {E,n,speed}=eventOpen,N_=nations[n],o=E.opts[+b.dataset.evo];eventOpen=null;
  if(N_&&N_.alive){o[2](N_);log(`${E.title(N_)}: you chose “${o[0]}”.`,'faith')}closeModal();speedIdx=speed;updateHUD();renderNationCard()});

/* ---------- the avatar: your god walks among the people ---------- */
let avatars={};const AV_R=3.2;
function avatarOf(g){return avatars[g]}
function avatarNear(g,x,z){const a=avatars[g];return a&&Math.hypot(a.x-x,a.z-z)<AV_R}
function moveAvatar(g,i){const x=wx(i%W),z=wz((i/W)|0);let a=avatars[g];
  if(!a){let best=null;for(const n of nations)if(n.alive&&n.cities.length&&n.faith>=0&&godOf(n.faith)===g&&(!best||n.pop>best.pop))best=n;const c=(best||nations.find(n=>n.alive&&n.cities.length)||{cities:[{x:i%W,y:(i/W)|0}]}).cities[0];
    a=avatars[g]={x:wx(c.x),z:wz(c.y),tx:x,tz:z,col:g===0?'#f3d27a':(typeof coopColor==='function'?coopColor(g):'#9ff4ff')}}
  a.tx=x;a.tz=z}
function avatarYear(){for(const g in avatars){const a=avatars[g];for(const n of nations){if(!n.alive)continue;let near=false;for(const c of n.cities)if(Math.hypot(wx(c.x)-a.x,wz(c.y)-a.z)<AV_R){near=true;break}
    if(near){n.devotion=clamp((n.devotion??.3)+.015,0,1);n.happy=clamp((n.happy??.6)+.004,0,1)}}}}
const AVM={body:new THREE.MeshStandardMaterial({color:0xfff4d8,emissive:0xffd890,emissiveIntensity:.8,roughness:.4}),halo:new THREE.MeshBasicMaterial({color:0xffe9a0,transparent:true,opacity:.8,depthWrite:false})};
const AVG={body:(()=>{const g=new THREE.ConeGeometry(.5,1,10);g.translate(0,.5,0);return g})(),head:new THREE.SphereGeometry(.5,12,8),halo:new THREE.TorusGeometry(.5,.08,6,24)};
const avatarMeshes={};
function drawAvatars(dt,now){for(const g in avatarMeshes)if(!avatars[g]){scene.remove(avatarMeshes[g]);delete avatarMeshes[g]}
  for(const g in avatars){const a=avatars[g];let m=avatarMeshes[g];
    if(!m){m=new THREE.Group();const b=new THREE.Mesh(AVG.body,AVM.body);b.scale.set(.05,.11,.05);m.add(b);const h=new THREE.Mesh(AVG.head,AVM.body);h.scale.setScalar(.035);h.position.y=.125;m.add(h);
      const ring=new THREE.Mesh(AVG.halo,AVM.halo);ring.scale.setScalar(.06);ring.rotation.x=Math.PI/2;ring.position.y=.165;m.add(ring);m.userData.ring=ring;scene.add(m);avatarMeshes[g]=m}
    const d=Math.hypot(a.tx-a.x,a.tz-a.z);if(d>.02){const st=Math.min(d,dt*.7),nx=a.x+(a.tx-a.x)/d*st,nz=a.z+(a.tz-a.z)/d*st,ti=tileAt(nx,nz);if(ti>=0&&!isWater(ti)){a.x=nx;a.z=nz}else{a.tx=a.x;a.tz=a.z}m.rotation.y=Math.atan2(a.tx-a.x,a.tz-a.z)}
    const y=groundY(a.x,a.z);m.position.set(a.x,y+.01+Math.sin(now/300)*.008,a.z);m.userData.ring.rotation.z=now/700;
    if(rng()<dt*8&&typeof emit==='function')emit('spark',a.x+(rng()-.5)*.06,y+.08,a.z+(rng()-.5)*.06)}}

/* ---------- great people ---------- */
const GREAT={scientist:{label:'scientist',verb:'a great mind',fx:'Learning ×1.3'},artist:{label:'artist',verb:'a great artist',fx:'Happier people'},general:{label:'general',verb:'a great general',fx:'Armies ×1.3'},
  saint:{label:'saint',verb:'a saint',fx:'Faith in you grows'},explorer:{label:'explorer',verb:'a great explorer',fx:'Ships sail far'}};
function greatTick(n){n.greats=(n.greats||[]).filter(g=>g.until>year);n.gpTech=n.greats.some(g=>g.k==='scientist')?1.3:1;n.gpMil=n.greats.some(g=>g.k==='general')?1.3:1;
  if(n.greats.some(g=>g.k==='saint'))n.devotion=clamp((n.devotion??.3)+.008,0,1);if(n.greats.some(g=>g.k==='artist'))n.happy=clamp((n.happy??.6)+.003,0,1);
  if(n.greats.length<2&&n.era>=1&&rng()<.0025*(1+n.era*.25)*(.6+stabOf(n))*(n.golden>year?2.5:1)){
    const ks=Object.keys(GREAT).filter(k=>k!=='explorer'||n.era>=SAIL),k=ks[(rng()*ks.length)|0],nm=givenName(rng()<.5?'f':'m')+' of '+(n.cities[(rng()*n.cities.length)|0]||{name:n.name}).name;
    n.greats.push({k,name:nm,born:year,until:year+30+((rng()*20)|0)});log(`${nm}, ${GREAT[k].verb}, was born in ${n.name}.`,'era');
    if(important(n))toast(`A great ${GREAT[k].label}`,`${nm} was born in ${n.name}.`);if(k==='explorer'&&typeof launch==='function')launch(n,'explore')}}

/* ---------- tradeTrains on the trade roads ---------- */
kit('lcart',unitBox(),MAT.plain,3000,false);kit('wheel',unitCyl(8),MAT.plain,3000,false);kit('beast',unitBox(),MAT.plain,4000,false);kit('fboat',unitBox(),MAT.plain,600,false);
/* fishing boats: a proper wooden hull, and on some a mast with a sail */
const FBOAT_MAT=stdMat({vertexColors:true,roughness:.85,side:THREE.DoubleSide});tideHook(FBOAT_MAT);
kit('fbHull',boatHullGeo(true),FBOAT_MAT,400,false);kit('fbSail',boatSailGeo(),FBOAT_MAT,300,false);
const LIFE_KITS=['lcart','wheel','beast','fboat','fbHull','fbSail'];
let tradeTrains=[],tradeTrainT=0;
function tradeTrainRoutes(){const out=[],dummy=new Uint8Array(N);
  for(const n of nations){if(!n.alive||!n.cities.length)continue;for(const m of n.trade||[]){const B=nations[m];if(!B||!B.alive||m<n.id||!B.cities.length||!(n.nb&&n.nb.has&&n.nb.has(m)))continue;
      const path=roadPath(n.cities[0],B.cities[0],-1,dummy);if(!path||path.length<3)continue;const pts=chaikin2(path.map(j=>[wx(j%W)+(hash(j*3.1)-.5)*.25,wz((j/W)|0)+(hash(j*7.3)-.5)*.25]),3);
      let L=0;const acc=[0];for(let k=1;k<pts.length;k++){L+=Math.hypot(pts[k][0]-pts[k-1][0],pts[k][1]-pts[k-1][1]);acc.push(L)}
      const old=tradeTrains.find(c=>c.a===n.id&&c.b===m);out.push({a:n.id,b:m,pts,acc,L,t:old?old.t:rng()*L,dir:old?old.dir:1})}}
  /* inside a realm too: from the capital to its towns */
  for(const n of nations){if(!n.alive||n.cities.length<2||n.era<1)continue;for(let k=1;k<Math.min(n.cities.length,3);k++){const path=roadPath(n.cities[0],n.cities[k],n.id,dummy);if(!path||path.length<3)continue;
      const pts=chaikin2(path.map(j=>[wx(j%W)+(hash(j*3.1)-.5)*.25,wz((j/W)|0)+(hash(j*7.3)-.5)*.25]),3);let L=0;const acc=[0];for(let q=1;q<pts.length;q++){L+=Math.hypot(pts[q][0]-pts[q-1][0],pts[q][1]-pts[q-1][1]);acc.push(L)}
      const old=tradeTrains.find(c=>c.a===n.id&&c.b===-k);out.push({a:n.id,b:-k,pts,acc,L,t:old?old.t:rng()*L,dir:old?old.dir:1})}}
  tradeTrains=out.slice(0,30)}
function tradeTrainAt(c){let lo=0,hi=c.acc.length-1;while(lo<hi-1){const m=(lo+hi)>>1;if(c.acc[m]<=c.t)lo=m;else hi=m}const s=c.acc[hi]-c.acc[lo]||1,f=(c.t-c.acc[lo])/s,a=c.pts[lo],b=c.pts[hi];return [lerp(a[0],b[0],f),lerp(a[1],b[1],f),Math.atan2(b[1]-a[1],b[0]-a[0])]}

/* ---------- animals, birds, seaWhales and fishing boats near the camera ---------- */
let wildHerds=[],birdFlocks=[],seaWhales=[],lifeT=0;
function spawnHerd(){for(let t=0;t<30;t++){const x=camT.x+(rng()-.5)*(camDist*1.8+6),z=camT.z+(rng()-.5)*(camDist*1.2+5),i=tileAt(x,z);if(i<0||isWater(i)||occupied.has(i)||fieldTiles.has(i))continue;const b=biome[i];if(!(b===4||b===5||b===8||b===9||b===7))continue;
    const n=owner[i]>=0?nations[owner[i]]:null,tame=n&&n.era>=1&&b!==5&&rng()<.6;const kind=b===9?'reindeer':b===7?'camel':b===8?(tame?'cattle':'zebra'):tame?(rng()<.5?'sheep':'cattle'):'deer';
    const m=[];for(let k=0;k<5+((rng()*6)|0);k++)m.push({dx:(rng()-.5)*.4,dz:(rng()-.5)*.4,a:rng()*6.28,ph:rng()*6.28});wildHerds.push({x,z,kind,m,t:0,vx:(rng()-.5)*.02,vz:(rng()-.5)*.02});return}}
const BEAST={deer:[0x8a5a34,.024,.014],reindeer:[0x8a7a68,.024,.015],camel:[0xc8a060,.028,.02],zebra:[0xe8e4dc,.026,.016],sheep:[0xf0ece2,.02,.012],cattle:[0x6a4a30,.028,.016]};
/* ---------- fishing boats ----------
   Every coastal town has its boats, more for bigger towns: dugout canoes in the Stone Age, rowing boats (some with a small sail) from the
   Bronze Age, sailing smacks in the Age of Sail, small motor trawlers with a wheelhouse in the modern world. They put out in the morning to
   fishing grounds a few tiles off the coast (shallow water first), drift there while the crew works the nets, and come home in the
   evening; at night and in storms they lie at the shore. */
const FB_SPEED=[.1,.13,.13,.14,.2,.22,.32,.34];
const fbType=e=>e===0?'canoe':e<=3?'row':e<=5?'sail':'motor';
function lineWater(x0,z0,x1,z1){const L=Math.hypot(x1-x0,z1-z0),n=Math.max(2,Math.ceil(L/.18));for(let q=1;q<=n;q++){const t=q/n,ti=tileAt(x0+(x1-x0)*t,z0+(z1-z0)*t);if(ti<0||!isWater(ti))return false}return true}
function fbGrounds(c){if(c._fbgV===terrVer&&c._fbg)return c._fbg;const homes=[],spots=[];const cx=wx(c.x),cz=wz(c.y);
  for(const j of seaNear(c)){const tx=wx(j%W),tz=wz((j/W)|0),d=Math.hypot(cx-tx,cz-tz)||1,pull=Math.min(.32,.45/d);homes.push({x:tx+(cx-tx)*pull,z:tz+(cz-tz)*pull})}
  if(homes.length){const h=homes[0];const cand=[];
    for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=5;dx++){const X=c.x+dx,Y=c.y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const j=Y*W+X;if(!isWater(j))continue;const x=wx(X),z=wz(Y),d=Math.hypot(x-h.x,z-h.z);
      if(d<1.4||d>5.2||!lineWater(h.x,h.z,x,z))continue;cand.push({x,z,s:(biome[j]===1?1.5:1)+hash(j*3.7)*.6-d*.06})}
    cand.sort((a,b)=>b.s-a.s);for(const q of cand){if(spots.every(o=>Math.hypot(o.x-q.x,o.z-q.z)>.9))spots.push(q);if(spots.length>=6)break}}
  c._fbgV=terrVer;c._fbg={homes,spots};return c._fbg}
function fishFleet(n,c,dt,now){if(!seaNear(c).length)return;const G=fbGrounds(c);if(!G.homes.length||!G.spots.length){c._fbs=null;return}
  const cnt=Math.min(typeof fishBoats==='function'?fishBoats(n,c):2,G.spots.length+1,5);
  if(!c._fbs||c._fbs.era!==n.era||c._fbs.length!==cnt){c._fbs=[];c._fbs.era=n.era;for(let b=0;b<cnt;b++){const h=G.homes[b%G.homes.length],ph=hash(c.x*31+c.y*7+b*13);
      c._fbs.push({x:h.x+(ph-.5)*.12,z:h.z+(hash(ph*91)-.5)*.12,hd:ph*6.28,st:'home',b,ph,wait:ph*6,h,s:G.spots[b%G.spots.length],ox:(hash(b*5.1+c.x)-.5)*.5,oz:(hash(b*8.3+c.y)-.5)*.5,mv:0,foam:0})}}
  const type=fbType(n.era),sp=FB_SPEED[n.era]||.15;
  for(const B of c._fbs){const day=nightF<.3&&fishingNow(B.x,B.z);
    if(B.st==='home'&&day){B.wait-=dt;if(B.wait<=0)B.st='go'}else if(B.st==='home')B.wait=B.ph*6;
    if((B.st==='go'||B.st==='fish')&&!day)B.st='back';
    let tx=B.x,tz=B.z;if(B.st==='go'){tx=B.s.x+B.ox;tz=B.s.z+B.oz}else if(B.st==='back'){tx=B.h.x;tz=B.h.z}else if(B.st==='fish'){B.t=(B.t||0)+dt;tx=B.s.x+B.ox+Math.cos(B.t*.05+B.ph*6)*.18;tz=B.s.z+B.oz+Math.sin(B.t*.05+B.ph*6)*.18}
    const dx=tx-B.x,dz=tz-B.z,d=Math.hypot(dx,dz);B.mv=0;
    if(d>.02&&dt>0){const want=Math.atan2(dz,dx);let da=want-B.hd;da=Math.atan2(Math.sin(da),Math.cos(da));B.hd+=clamp(da,-1.6*dt,1.6*dt);
      const v=(B.st==='fish'?.03:sp)*(Math.abs(da)>1.2?.35:1)*dt,nx=B.x+Math.cos(B.hd)*Math.min(v,d),nz=B.z+Math.sin(B.hd)*Math.min(v,d),ti=tileAt(nx,nz);
      /* never onto land: if the bow points at the shore, slip straight towards the goal along the open water */
      if(ti>=0&&isWater(ti)){B.x=nx;B.z=nz}else{B.x+=dx/d*Math.min(v,d);B.z+=dz/d*Math.min(v,d)}B.mv=B.st==='fish'?0:1}
    if(B.st==='go'&&d<.06){B.st='fish';B.t=0}if(B.st==='back'&&d<.04)B.st='home';
    /* draw: a hull for each age, rolling with the swell */
    const by=(B.by=seaY(B.x,B.z)+.006+Math.sin(now/500+B.ph*6)*.0015),roll=Math.sin(now/700+B.ph*6)*(B.mv?.03:.05),R=-B.hd;
    if(type==='canoe'){add('fbHull',B.x,by-.001,B.z,.075,.018,.022,R,0x7a5434,roll)}
    else if(type==='row'){add('fbHull',B.x,by,B.z,.09,.024,.034,R,[0xffffff,0xf2e6d6,0xdfe8f2,0xf0dcd0][B.b%4],roll);if(n.era>=2&&B.b%2&&B.st!=='home')add('fbSail',B.x,by,B.z,.08,.026,.08,R,0xf2ead8,roll)}
    else if(type==='sail'){if(fishBoatModel())addM('m_boatwsail',B.x,by-.012,B.z,.5,R,null,null,null,null,roll);else{add('fbHull',B.x,by,B.z,.1,.026,.036,R,[0xffffff,0xf2e6d6,0xdfe8f2][B.b%3],roll);add('fbSail',B.x,by,B.z,.1,.034,.1,R,0xffffff,roll)}}
    else{const col=[0x2a4a6a,0x8a2a22,0x2a5a3a,0x3a3a42][B.b%4],ca=Math.cos(B.hd),sa=Math.sin(B.hd);add('fbHull',B.x,by,B.z,.12,.03,.044,R,col,roll);
      /* the wheelhouse aft, the deck forward free for the crew */
      add('beast',B.x-ca*.034,by+.02,B.z-sa*.034,.03,.026,.026,R,0xf0ece4);add('beast',B.x-ca*.034,by+.035,B.z-sa*.034,.034,.005,.03,R,col)}
    /* a wake behind a boat under way; motor boats churn more */
    if(B.mv&&dt>0){B.foam-=dt;if(B.foam<=0){B.foam=type==='motor'?.12:.3;emit('foam',B.x-Math.cos(B.hd)*.06,(B.by||waterY)+.002,B.z-Math.sin(B.hd)*.06,0,0)}}}}
function updateLiving(dt,k,now){
  const near=(x,z,f)=>Math.hypot(x-camT.x,z-camT.z)<camDist*f+6;
  tradeTrainT-=dt;if(tradeTrainT<=0){tradeTrainT=6;try{tradeTrainRoutes()}catch(e){tradeTrains=[]}}
  lifeT-=dt;if(lifeT<=0){lifeT=1;wildHerds=wildHerds.filter(h=>near(h.x,h.z,2.2));if(wildHerds.length<(camDist<30?10:5))spawnHerd();
    if(birdFlocks.length<3&&rng()<.5){const a=rng()*6.28,r=camDist*.9+4;birdFlocks.push({x:camT.x-Math.cos(a)*r,z:camT.z-Math.sin(a)*r,a,y:.9+rng()*.6,t:0,n:5+((rng()*6)|0)})}
    if(seaWhales.length<2&&rng()<.3){for(let t=0;t<20;t++){const x=camT.x+(rng()-.5)*camDist*1.6,z=camT.z+(rng()-.5)*camDist*1.2,i=tileAt(x,z);if(i>=0&&isWater(i)&&h[i]<sea-.06){seaWhales.push({x,z,a:rng()*6.28,t:0});break}}}}
  kitReset(LIFE_KITS);const spd=k>0?1:0;
  /* tradeTrains */
  for(const c of tradeTrains){c.t+=dt*.25*spd*c.dir;if(c.t>=c.L){c.t=c.L;c.dir=-1}else if(c.t<=0){c.t=0;c.dir=1}const [x,z,a]=tradeTrainAt(c);if(!near(x,z,1.8))continue;const n=nations[c.a];if(!n)continue;const e=n.era,y=groundY(x,z),r=c.dir>0?a:a+Math.PI,cs=Math.cos(r),sn=Math.sin(r),nc=parseInt(n.color.slice(1),16);
    if(e<=4&&typeof drawCaravanModel==='function'&&drawCaravanModel(c,e,x,y,z,r,nc))continue;
    if(e<=2){for(let q=0;q<3;q++){const bx=x-cs*q*.04,bz=z-sn*q*.04;add('beast',bx,y+.008,bz,.03,.014,.012,-r,0x9a7a50);add('beast',bx,y+.022,bz,.018,.01,.016,-r,q?0xc8b088:nc)}}
    else if(e<=4){add('lcart',x,y+.012,z,.05,.022,.03,-r,0x7a5a3a);add('lcart',x,y+.034,z,.044,.016,.028,-r,0xe8e0c8);for(const s of [-1,1])add('wheel',x-sn*.016*s,y+.01,z+cs*.016*s,.016,.004,.016,-r+Math.PI/2,0x4a3a2a,Math.PI/2);add('beast',x+cs*.05,y+.008,z+sn*.05,.03,.016,.012,-r,0x6a4a30)}
    else if(e<=6){if(e>=5&&typeof drawTrainModel==='function'&&drawTrainModel(c,e,x,y,z,r,nc))continue;add('lcart',x,y+.01,z,.06,.026,.028,-r,nc);add('lcart',x+cs*.036,y+.01,z+sn*.036,.022,.022,.026,-r,0xe8e8e8);for(const s of [-1,1])for(const f of [-.02,.03])add('wheel',x+cs*f-sn*.015*s,y+.008,z+sn*f+cs*.015*s,.012,.004,.012,-r+Math.PI/2,0x222222,Math.PI/2)}
    else{add('lcart',x,y+.03+Math.sin(now/300+c.t)*.004,z,.05,.016,.026,-r,0xf2f4f6);add('lcart',x,y+.026,z,.052,.003,.028,-r,0x9ff4ff)}}
  /* wildHerds wander and graze */
  for(const hd of wildHerds){hd.t+=dt*spd;hd.x+=hd.vx*dt*spd;hd.z+=hd.vz*dt*spd;if(rng()<dt*.2){hd.vx=(rng()-.5)*.03;hd.vz=(rng()-.5)*.03}const ti=tileAt(hd.x,hd.z);if(ti<0||isWater(ti)||occupied.has(ti)){hd.vx*=-1;hd.vz*=-1;hd.x+=hd.vx*.5;hd.z+=hd.vz*.5}
    if(!near(hd.x,hd.z,1.6))continue;const B=BEAST[hd.kind];for(const m of hd.m){const x=hd.x+m.dx,z=hd.z+m.dz,y=groundY(x,z);if(y<waterY+.01)continue;const graze=Math.sin(now/600+m.ph)>.3;
      if(typeof drawWildModel==='function'&&drawWildModel(hd,m,x,y,z,now))continue;add('beast',x,y+B[2]*.5,z,B[1],B[2],B[2]*.7,m.a,B[0]);add('beast',x+Math.cos(m.a)*B[1]*.55,y+B[2]*(graze?.5:1.1),z-Math.sin(m.a)*B[1]*.55,B[2]*.7,B[2]*.7,B[2]*.6,m.a,B[0])}}
  /* birds in a V across the sky */
  for(let q=birdFlocks.length-1;q>=0;q--){const f=birdFlocks[q];f.t+=dt;f.x+=Math.cos(f.a)*dt*.5;f.z+=Math.sin(f.a)*dt*.5;if(f.t>40){birdFlocks.splice(q,1);continue}const cs=Math.cos(f.a),sn=Math.sin(f.a),gy=groundY(f.x,f.z);
    for(let b=0;b<f.n;b++){const s=b%2?1:-1,row=Math.ceil(b/2),x=f.x-cs*row*.06-sn*s*row*.05,z=f.z-sn*row*.06+cs*s*row*.05,flap=Math.sin(now/120+b)*.4;
      add('beast',x,Math.max(gy,waterY)+f.y,z,.008,.002,.03,-f.a,0x2a2a2a,flap)}}
  /* seaWhales surface and blow */
  for(let q=seaWhales.length-1;q>=0;q--){const w=seaWhales[q];w.t+=dt;w.x+=Math.cos(w.a)*dt*.06;w.z+=Math.sin(w.a)*dt*.06;if(w.t>30||!near(w.x,w.z,2)){seaWhales.splice(q,1);continue}
    const up=Math.max(0,Math.sin(w.t*.6));if(typeof drawWhaleModel==='function'&&drawWhaleModel(w,up,now)){if(up>.9&&rng()<dt*6)emit('spray',w.x,waterY+.04,w.z,0,0)}else if(up>.2){add('beast',w.x,waterY-.02+up*.015,w.z,.12,.03,.04,-w.a,0x3a4650);if(up>.9&&rng()<dt*6)emit('spray',w.x,waterY+.04,w.z,0,0)}
    else if(up<.05&&Math.sin(w.t*.6+.3)<0)add('beast',w.x-Math.cos(w.a)*.08,waterY+.01,w.z-Math.sin(w.a)*.08,.02,.02,.06,-w.a,0x3a4650,.6)}
  /* fishing boats: out to the fishing grounds in the morning, home in the evening */
  for(const n of nations){if(!n.alive)continue;for(const c of n.cities){if(!near(wx(c.x),wz(c.y),1.3))continue;try{fishFleet(n,c,dt*(k>0?1:0),now)}catch(e){c._fbs=null}}}
  for(const nm of LIFE_KITS){const K=KITS[nm];kitUp(K,K.k)}
  drawAvatars(dt,now)}

/* ---------- the god's air: cleanse the skies of smoke ---------- */
function cleanseSkies(){const d=Math.max(0,climate.temp-(worldOpts.t0??.5));climate.temp-=Math.min(d,.035);terrainDirty=true;log('At your breath the smoke thinned and the air turned clean and cold.','sky')}

/* ---------- hooks into the year and into the powers ---------- */
{const _g=genWorld;genWorld=function(s){const r=_g(s);worldOpts.t0=climate.temp;prayers=[];avatars={};wildHerds=[];birdFlocks=[];seaWhales=[];tradeTrains=[];eventT=40;renderPrayers();return r}}
{const _l=applySave;applySave=function(d){const r=_l(d);if(worldOpts.t0==null)worldOpts.t0=Math.min(climate.temp,.5);prayers=[];avatars={};wildHerds=[];tradeTrains=[];renderPrayers();return r}}
{const _t=tick;tick=function(){_t();if(!playing)return;try{prayerTick();eventTick();avatarYear();for(const n of nations)if(n.alive)greatTick(n);if(year%5===0)renderPrayers()}catch(e){console.error('life',e)}}}
document.addEventListener('DOMContentLoaded',()=>{
  const _a=applyTool;applyTool=function(i,start){
    if(i>=0&&start&&tool==='avatar'){if(typeof coopGuest==='function'&&coopGuest())return _a(i,start);if(isWater(i)){say('Your avatar walks on land.');return}moveAvatar(myGod(),i);fx(i,'bless');say('Your avatar sets out.');return}
    if(i>=0&&start&&tool==='cleanse'){if(typeof coopGuest==='function'&&coopGuest())return _a(i,start);if(climate.temp<=(worldOpts.t0??.5)+.005){say('The air is already clean.');return}if(!spend(50))return;cleanseSkies();fx(i,'rain');return}
    const b0=belief,t0=tool,o=i>=0?owner[i]:-1;
    if(i>=0&&avatarNear(myGod(),wx(i%W),wz((i/W)|0)))spendMulAvatar=.8;const r=_a(i,start);spendMulAvatar=1;
    if(start&&(belief<b0||unlimited))answerPrayers(t0,i);return r};
  renderPrayers()});
let spendMulAvatar=1;

/* ---------- fishermen ----------
   Along the shore near coastal towns, anglers stand at the water's edge with a rod, a line and a bobbing float.
   Now and then a fish bites: the float dips, the rod comes up and a silver fish goes into the basket at their feet.
   Out on the water each fishing boat has its crew, hauling in the nets. Nobody fishes at night or in a storm.
   Towns by the sea also eat better: fish carry them through thin harvests. */
let fishers=[],fisherT=0;
const FISH_LINE=0xd8d4c8,FISH_ROD=0x6a4a2a,FISH_BASKET=0x9a7a48;
/* a thin stick from point P to point Q */
function segR(P,Q,th,hex){const dx=Q[0]-P[0],dy=Q[1]-P[1],dz=Q[2]-P[2],L=Math.hypot(dx,dy,dz);if(L<1e-5)return;const a=Math.acos(clamp(-dy/L,-1,1)),sa=Math.sin(a);
  const b=sa>1e-4?Math.atan2(-dx/sa,-dz/sa):0;addR('pStick',P[0],P[1],P[2],th,L,th,b,a,0,hex)}
/* points on the shore near a town where someone can stand with their feet dry and the water in front */
function shoreSpots(c,max){const cx=wx(c.x),cz=wz(c.y),out=[],sea=waterY;
  for(let k=0;k<28&&out.length<max;k++){const a=hash(c.x*31+c.y*17+k*7.3)*6.283,ca=Math.cos(a),sa=Math.sin(a);
    for(let r=.3;r<2.4;r+=.03){const x=cx+ca*r,z=cz+sa*r,g=groundY(x,z);if(g<sea+.0025)break;if(g>sea+.04)continue;
      const fx=x+ca*.16,fz=z+sa*.16;if(groundY(fx,fz)>sea-.003)continue;if(typeof inBuilding==='function'&&inBuilding(x,z))break;if(fieldTiles.has(tileAt(x,z)))continue;
      if(out.some(o=>Math.hypot(o.x-x,o.z-z)<.18))break;out.push({x,z,dir:Math.atan2(ca,sa)});break}}
  return out}
function makeFisher(n,c,sp,i){const w={x:sp.x,z:sp.z,dir:sp.dir+(hash(i*3.1)-.5)*.4,seed:(c.x*997+c.y*31+i*7)|0,t:hash(i)*9,ph:0,moving:false,act:'fish',wait:1,nid:n.id,fisher:true,
    bite:6+hash(i*5.3)*10,pull:0,fish:0,catch:(hash(i*2.2)*3)|0,cast:hash(i*9.1)*6.283};dressFolk(w,n);w.kid=false;w.tool=false;w.pack=0;if(n.era<5&&hash(i*4.4)<.5){w.hat='straw';w.hatCol=0xd8c078}return w}
function fishingNow(x,z){if(nightF>.55)return false;if(typeof storms!=='undefined')for(const S of storms)if(S.kind!=='shower'&&Math.hypot(S.x-x,S.z-z)<S.r+.5)return false;return true}
function updateFishers(dt){fisherT-=dt;if(fisherT<=0){fisherT=2;fishers=[];if(camDist<14&&settings.people!==false){
    for(const n of nations){if(!n.alive||n.era>6)continue;for(const c of n.cities){const cx=wx(c.x),cz=wz(c.y);if(Math.hypot(cx-camT.x,cz-camT.z)>camDist*1.25+2)continue;
      if(!coastWater(c).length&&!river[c.y*W+c.x])continue;if(c._shoreV!==terrVer){c._shoreV=terrVer;c._shore=shoreSpots(c,3+((hash(c.x+c.y)*3)|0));c._fishers=null}const spots=c._shore;
      spots.forEach((sp,i)=>{if(!fishingNow(sp.x,sp.z))return;const k=c.x*7+c.y*13+i;let f=(c._fishers||(c._fishers={}))[i];if(!f||f.era!==n.era||f.nid!==n.id)f=c._fishers[i]=makeFisher(n,c,sp,k);fishers.push(f)})}}}}
  for(const f of fishers){f.t+=dt;f.bite-=dt;
    if(f.bite<=0&&!f.pull){f.pull=2.2;if(rng()<.55)f.fish=1}
    if(f.pull>0){f.pull-=dt;if(f.pull<=0){f.pull=0;if(f.fish){f.catch=Math.min(6,f.catch+1);f.fish=0}f.bite=7+rng()*14}}}}
function drawFishers(R2){if(!fishers.length)return;const now=performance.now()/1000,sea=waterY+(typeof TIDE!=='undefined'?TIDE:0);
  for(const f of fishers){const ex=f.x-camT.x,ez=f.z-camT.z;if(ex*ex+ez*ez>R2)continue;
    const pulling=f.pull>0,lift=pulling?Math.min(1,(2.2-f.pull)*2.2):0,dip=!pulling&&f.bite<.8?Math.sin(now*22)*.003:0;
    f.armR=-1.25-lift*.6;drawFolkFisher(f);
    const c=Math.cos(f.dir),s=Math.sin(f.dir),gy=groundY(f.x,f.z);
    /* the rod: from the hands, out over the water and up; it bends up as the fish is pulled in */
    const hand=[f.x+s*.012,gy+.022,f.z+c*.012],ang=.55+lift*.55+Math.sin(now*1.3+f.t)*.03,len=.06,tip=[hand[0]+s*Math.cos(ang)*len,hand[1]+Math.sin(ang)*len,hand[2]+c*Math.cos(ang)*len];
    segR(hand,tip,.0008,FISH_ROD);
    /* the line and the float, swaying a little; a bite pulls the float under */
    const reach=.035+.01*Math.sin(f.cast),fx=tip[0]+s*reach+Math.sin(now*.7+f.cast)*.004,fz=tip[2]+c*reach+Math.cos(now*.6+f.cast)*.004;
    if(pulling&&f.fish){const fy=sea+lift*.03;segR(tip,[fx,fy+.006,fz],.00025,FISH_LINE);addR('pPack',fx,fy,fz,.0022,.006,.0014,f.dir,Math.sin(now*18)*.6,0,0xc8d0d8)}
    else{const fy=sea+.0012+Math.sin(now*2+f.cast)*.0008-dip;segR(tip,[fx,fy,fz],.00025,FISH_LINE);addR('pHand',fx,fy,fz,.0026,.0026,.0026,0,0,0,0xd8402a);
      if(f.bite<.8&&rng()<.08)emit('spray',fx,sea+.002,fz,0,0)}
    /* the basket at their feet, with the day's catch */
    const bx=f.x-s*.006+c*.012,bz=f.z-c*.006-s*.012;addR('pPack',bx,gy+.004,bz,.011,.008,.009,f.dir,0,0,FISH_BASKET);
    for(let q=0;q<f.catch;q++)addR('pPack',bx+(q%3-1)*.003,gy+.0085,bz+((q/3)|0)*.003-.0015,.0016,.0012,.0055,f.dir+q,0,0,0xb8c4cc)}}
/* an angler stands still, both hands on the rod held out in front */
function drawFolkFisher(f){const m=f.moving,a=f.act;f.moving=false;f.act='fish';drawFolk(f);f.moving=m;f.act=a}
{const _da=drawArmyFolk;drawArmyFolk=function(R2){_da.apply(this,arguments);try{drawFishers(R2);drawBoatCrews(R2)}catch(e){console.warn('fishers',e)}}}
{const _ul=updateLiving;updateLiving=function(dt,k,now){const r=_ul.apply(this,arguments);try{updateFishers(dt*(k>0?1:0))}catch(e){fishers=[]}return r}}
/* the crews of the fishing boats: a paddler in a canoe, rowers at the oars, and out on the grounds one hauls the net over the side
   while another steers; gulls wheel over the trawlers */
function drawBoatCrews(R2){if(camDist>=14||settings.people===false)return;const now=performance.now()/1000,sea=waterY+(typeof TIDE!=='undefined'?TIDE:0);
  for(const n of nations){if(!n.alive)continue;const type=fbType(n.era);for(const c of n.cities){if(!c._fbs)continue;
    for(const B of c._fbs){if(B.st==='home')continue;const ex=B.x-camT.x,ez=B.z-camT.z;if(ex*ex+ez*ez>R2)continue;
      const ca=Math.cos(B.hd),sa=Math.sin(B.hd),bs=seaY(B.x,B.z),y=bs+.003+Math.sin(now/500+B.ph*6)*.0015,fwd=-B.hd+Math.PI/2,fishing=B.st==='fish';
      const nCrew=type==='canoe'?1:type==='motor'?(fishing?2:1):2;
      const crew=B.crew&&B.crew.length===nCrew&&B.crew.era===n.era?B.crew:(B.crew=Array.from({length:nCrew},(_,q)=>{const w={seed:(c.x*97+B.b*13+q*7)|0,t:q*2,ph:0,moving:false,wait:1,act:'chat',x:0,z:0,dir:0};dressFolk(w,n);w.kid=false;w.pack=0;w.tool=false;return w}),B.crew.era=n.era,B.crew);
      /* seated in canoes, rowing and sailing boats: the rower faces the stern and pulls, the paddler kneels forward; out on the grounds one hauls
         the net over the side. On a trawler's deck the crew stands to work, as deckhands do. */
      const sit=type!=='motor';
      crew.forEach((w,q)=>{const off=type==='motor'?(q?.034:.012):nCrew===1?0:(q?-.026:.02);w.x=B.x+ca*off;w.z=B.z+sa*off;w.y=sit?y-.004:y;w.t=now+q*1.7;w.wait=1;w.sit=sit;w.moving=false;
        const hauler=fishing&&q===(nCrew-1);
        if(sit){w.act=hauler?'haul':B.mv?(type==='canoe'?'paddle':type==='row'&&q===0?'row':'chat'):'chat';w.dir=hauler?fwd+Math.PI/2:w.act==='row'?fwd+Math.PI:fwd}
        else{w.act=hauler?'farm':'chat';w.dir=hauler?fwd+Math.PI/2:fwd}
        drawFolk(w)});
      /* paddle or oars while under way */
      if(B.mv&&type==='canoe'){const s=Math.sin(now*4+B.ph*9),side=s>0?1:-1,px=B.x-sa*.012*side,pz=B.z+ca*.012*side;segR([px,y+.02,pz],[px-ca*.02*s,bs-.002,pz-sa*.02*s],.0008,0x6a4a2a)}
      if(B.mv&&type==='row'){const s=Math.sin(now*3+B.ph*9);for(const side of [-1,1]){const px=B.x+ca*.004-sa*.016*side,pz=B.z+sa*.004+ca*.016*side;segR([px,y+.012,pz],[px-sa*.045*side+ca*.018*s,bs-.001+Math.max(0,s)*.008,pz+ca*.045*side+sa*.018*s],.0007,0x7a5a3a)}}
      if(type==='motor'){const mx=B.x-ca*.018,mz=B.z-sa*.018;segR([mx,y+.03,mz],[mx,y+.1,mz],.0012,0xd8d8d0);segR([mx,y+.085,mz],[mx+ca*.05,y+.04,mz+sa*.05],.0007,0xd8d8d0)}
      /* the net out over the side: floats in a curve on the water */
      if(fishing)for(let q=0;q<5;q++){const t=(q-2)/2,a=B.hd+Math.PI/2,nx=B.x+Math.cos(a)*(.05+.012*Math.abs(t))+ca*t*.025,nz=B.z+Math.sin(a)*(.05+.012*Math.abs(t))+sa*t*.025;
        addR('pHand',nx,seaY(nx,nz)+.0012+Math.sin(now*1.6+q)*.0007,nz,.0024,.0018,.0024,0,0,0,q%2?0xe8d8a0:0xc84a2a)}
      /* gulls over the trawlers and over boats coming home with a catch */
      if(type==='motor'||(B.st==='back'&&type!=='canoe'))for(let g=0;g<(type==='motor'?4:2);g++){const a=now*(.7+g*.13)+g*1.7+B.ph*5,r=.05+g*.012,gy=y+.07+Math.sin(now*1.3+g)*.012;
        addR('pPack',B.x+Math.cos(a)*r,gy,B.z+Math.sin(a)*r,.009,.0012,.0032,-a,Math.sin(now*9+g)*.5,0,0xf4f4f0)}}}}}

/* ---------- farmhands ----------
   The fields near you are worked through the year. In spring one ploughs behind an ox (a horse from the age of
   gunpowder, a tractor in the modern age) while another sows; in summer they hoe between the rows; at harvest they
   reap with scythes and stand the sheaves up in stooks that fill the field; in winter the fields lie quiet.
   Nobody works at night, in the pouring rain or in snow. */
let farmhands=[],farmT=0;const FARM=new Map();
const OX=[0x6a4a30,0x8a6a48,0x5a3e2a],HORSE=[0x6a4a34,0x3a2a1e,0x9a7a5a];
function farmSeason(i){if(settings.seasons===false){return ['Spring','Summer','Autumn','Summer'][(Math.floor(year/3)+(hash(i*3.7)*4|0))%4]}return typeof seasonName==='function'?seasonName():'Summer'}
function farmTile(i,n){const sn=farmSeason(i),e=n.era,key=i;let F=FARM.get(key);
  if(!F||F.era!==e||F.nid!==n.id){F={era:e,nid:n.id,axis:hash(i*1.3)<.5?0:1,w:[],stooks:0,sn:null};FARM.set(key,F)}
  if(F.sn!==sn){F.sn=sn;F.w=[];if(sn!=='Autumn')F.stooks=0;const mk=(job,q)=>{const w={seed:(i*31+q*7)|0,t:q*3,ph:0,moving:false,wait:0,act:'idle',x:0,z:0,dir:0,job,u:(hash(i+q)-.5)*.7,v:-.36+q*.24,s:q%2?-1:1,stint:hash(i*7+q)*4};dressFolk(w,n);w.kid=false;w.pack=0;w.tool=false;
      if(e<5&&sn==='Summer'&&hash(i+q*9)<.6){w.hat='straw';w.hatCol=0xd8c078}return w};
    const two=hash(i*5.1)<.55;
    if(sn==='Spring'){F.w.push(mk(e>=6?'tractor':'plough',0));if(two&&e<6)F.w.push(mk('sow',1))}
    else if(sn==='Summer'){if(e>=6){if(hash(i*2.9)<.4)F.w.push(mk('tractor',0))}else{F.w.push(mk('hoe',0));if(two)F.w.push(mk('hoe',1))}}
    else if(sn==='Autumn'){if(e>=6)F.w.push(mk('tractor',0));else{F.w.push(mk('reap',0));if(two)F.w.push(mk('reap',1))}}
    else if(hash(i*4.3)<.25&&e<6)F.w.push(mk('mend',0))}
  return F}
function updateFarmhands(dt){farmT-=dt;
  if(farmT<=0){farmT=1.2;farmhands=[];if(camDist<14&&settings.people!==false&&nightF<=.55){const R=camDist*1.15+1,list=[];
      for(const i of fieldTiles){const x=wx(i%W),z=wz((i/W)|0),d=Math.hypot(x-camT.x,z-camT.z);if(d>R)continue;const o=owner[i];if(o<0)continue;const n=nations[o];if(!n||!n.alive||n.era<1)continue;
        if(typeof WXG!=='undefined'&&WXG.wet&&(WXG.wet[i]>.55||WXG.snow[i]>.3))continue;list.push([d,i,n])}
      list.sort((a,b)=>a[0]-b[0]);let cnt=0;for(const [d,i,n] of list){if(cnt>=70)break;const F=farmTile(i,n);for(const w of F.w){w.tile=i;w.F=F;farmhands.push(w);cnt++}}}}
  for(const w of farmhands){const i=w.tile,F=w.F,cx=wx(i%W),cz=wz((i/W)|0),ax=F.axis,lim=.4;
    const sp=w.job==='tractor'?.11:w.job==='plough'?.035:w.job==='sow'?.05:0;
    if(sp){w.u+=w.s*sp*dt;if(Math.abs(w.u)>lim){w.u=Math.sign(w.u)*lim;w.s*=-1;w.v+=.09;if(w.v>.4)w.v=-.4}w.moving=true;w.ph+=sp*dt*480;w.act='walk'}
    else if(w.job==='mend'){w.moving=false;w.act='chat';w.wait=1}
    else{w.stint-=dt;if(w.stint<=0){w.stint=3+hash(w.seed+w.t)*4;w.u+=w.s*.05;if(Math.abs(w.u)>lim){w.s*=-1;w.v+=.09;if(w.v>.4)w.v=-.4}if(w.job==='reap')F.stooks=Math.min(14,F.stooks+1)}
      w.moving=w.stint>2.6;if(w.moving)w.ph+=dt*12;w.act='farm';w.wait=w.moving?0:1}
    w.t+=dt;const ex=ax?0:1,ez=ax?1:0;w.x=cx+ex*w.u-ez*w.v*0;w.z=cz+ez*w.u;if(ax){w.x=cx+w.v;w.z=cz+w.u}else{w.x=cx+w.u;w.z=cz+w.v}
    w.dir=ax?(w.s>0?0:Math.PI):(w.s>0?Math.PI/2:-Math.PI/2)}}
function drawFarmhands(R2){if(!farmhands.length)return;const now=performance.now()/1000,done=new Set();
  for(const w of farmhands){const ex=w.x-camT.x,ez=w.z-camT.z;if(ex*ex+ez*ez>R2)continue;const n=nations[w.F.nid];if(!n)continue;
    const d=w.dir,fx=Math.sin(d),fz=Math.cos(d),rx=Math.cos(d),rz=-Math.sin(d),gy=groundY(w.x,w.z);
    if(w.job==='tractor'){drawTractor(w.x,gy,w.z,d,n.era,now);continue}
    drawFolk(w);
    if(w.job==='plough'){/* the beast walks ahead, the plough between them */const bx=w.x+fx*.07,bz=w.z+fz*.07,by=groundY(bx,bz),horse=n.era>=3,col=(horse?HORSE:OX)[w.seed%3];
      drawBeast(bx,by,bz,d,col,horse,now+w.seed);segR([bx-fx*.02,by+.016,bz-fz*.02],[w.x+fx*.016,gy+.012,w.z+fz*.016],.0012,0x6a4a2a);
      addR('pPack',w.x+fx*.02,gy+.003,w.z+fz*.02,.004,.006,.012,d,.5,0,0x5a5a5a);
      if(rng()<.15)emit('dust',w.x+fx*.02,gy+.004,w.z+fz*.02,0,0)}
    if(w.job==='reap'&&!w.moving){/* a scythe blade at the end of the handle */const a=Math.sin(w.t*5),hx=w.x+fx*.018+rx*.006*a,hz=w.z+fz*.018+rz*.006*a;addR('pPack',hx,gy+.003,hz,.016,.0008,.003,d+Math.PI/2+a*.4,0,0,0xb8bcc0)}
    if(w.job==='sow'&&Math.sin(w.t*4)>.85&&rng()<.3)emit('dust',w.x+rx*.012,gy+.012,w.z+rz*.012,rx*.05,rz*.05)
    /* the stooks of the harvest, standing in rows behind the reapers */
    if(w.job==='reap'&&!done.has(w.tile)){done.add(w.tile);const i=w.tile,cx=wx(i%W),cz=wz((i/W)|0),ax=w.F.axis;
      for(let k=0;k<w.F.stooks;k++){const u=-.33+(k%5)*.165,v=-.3+((k/5)|0)*.2+hash(i+k)*.03,x=ax?cx+v:cx+u,z=ax?cz+u:cz+v,y=groundY(x,z);
        addR('pCone',x,y,z,.022,.036,.022,hash(k)*3,0,0,0xd8b860);addR('pCone',x,y+.024,z,.012,.018,.012,0,0,0,0xc8a850)}}}}
function drawBeast(x,y,z,d,col,horse,t){const fx=Math.sin(d),fz=Math.cos(d),rx=Math.cos(d),rz=-Math.sin(d),L=horse?.032:.034,H=horse?.026:.02,step=Math.sin(t*6)*.3;
  /* legs first, then a deep body, a neck and head held forward, and a tail */
  for(const [a,b,s] of [[1,1,1],[-1,1,-1],[1,-1,-1],[-1,-1,1]])addR('pStick',x+rx*.0055*a+fx*L*.36*b,y+H,z+rz*.0055*a+fz*L*.36*b,.0042,H,.0042,d,step*s,0,horse?0x2a2018:col);
  addR('pPack',x,y+H+.008,z,.017,.017,L,d,0,0,col);
  addR('pPack',x+fx*L*.55,y+H+(horse?.02:.009),z+fz*L*.55,.009,horse?.02:.011,.012,d,horse?-.5:.15,0,col);
  addR('pPack',x+fx*L*.72,y+H+(horse?.028:.006),z+fz*L*.72,.009,.01,.014,d,horse?.4:0,0,horse?col:0x4a3424);
  addR('pStick',x-fx*L*.5,y+H+.014,z-fz*L*.5,.0018,.016,.0018,d,-.25,0,horse?0x2a2018:col);
  if(!horse)for(const sd of [-1,1])addR('pStick',x+fx*L*.62+rx*.006*sd,y+H+.016,z+fz*L*.62+rz*.006*sd,.0015,.008,.0015,d,Math.PI*.6,sd*.7,0xe8e0d0)}
function drawTractor(x,y,z,d,e,now){const fx=Math.sin(d),fz=Math.cos(d),rx=Math.cos(d),rz=-Math.sin(d),col=e>=7?0xe8eef2:[0xb83a2a,0x3a7a3a,0x2a5aa0][Math.abs(Math.round(x*7+z*3))%3];
  const P=(f,r,h)=>[x+fx*f+rx*r,y+h,z+fz*f+rz*r];
  addR('pPack',...P(.008,0,.02),.024,.018,.05,d,0,0,col);addR('pPack',...P(-.012,0,.038),.022,.022,.022,d,0,0,0x2a3a40);addR('pPack',...P(-.012,0,.051),.026,.003,.026,d,0,0,col);
  for(const sd of [-1,1]){addR('pShield',...P(-.014,sd*.016,.014),.008,.028,.028,d,0,0,0x1e1e1e);addR('pShield',...P(.024,sd*.014,.009),.006,.018,.018,d,0,0,0x1e1e1e)}
  addR('pPack',...P(-.045,0,.006),.034,.006,.012,d,0,0,0x5a5a5a);addR('pStick',...P(.02,.006,.04),.002,.012,.002,d,0,0,0x2a2a2a);
  if(rng()<.2)emit('dust',...P(-.05,0,.004),0,0);if(rng()<.05)emit('smoke',...P(.02,.006,.055))}
{const _da2=drawArmyFolk;drawArmyFolk=function(R2){_da2.apply(this,arguments);try{drawFarmhands(R2)}catch(e){console.warn('farmhands',e)}}}
{const _ul2=updateLiving;updateLiving=function(dt,k,now){const r=_ul2.apply(this,arguments);try{updateFarmhands(dt*(k>0?1:0))}catch(e){console.warn('farmhands',e);farmhands=[]}return r}}
/* the small sailing boat model, once it has loaded, for the fishing boats */
function fishBoatModel(){if(typeof modelOn!=='function'||!modelOn('boatwsail'))return false;if(!KITS.m_boatwsail){mkit('m_boatwsail',MDL.geo.boatwsail.clone(),300,true);tideHook(MODEL_MAT);LIFE_KITS.push('m_boatwsail')}return true}

/* ---------- Viking raids ----------
   In the early ages a hardy seafaring people of the cold north takes to the sea. Their longships sail for rich
   coastal towns; the raiders run ashore with axes and round shields, plunder and burn, and row home with the loot.
   Strong towns drive them off. A people raided again and again may pay them off with silver (Danegeld).
   When gunpowder comes, the age of the Vikings is over. */
let RAIDS=[],vikingAge=false;
const VIK_SAIL='#a8322a';
function vikingHome(){let best=null,bs=-1;
  for(const n of nations){if(!n.alive||n.era<1||n.era>3||!n.cities.length)continue;const c=n.cities[0];const lat=Math.abs(c.y/(H-1)-.5)*2;
    const coast=n.cities.filter(t=>coastWater(t).length).length;if(!coast||lat<.45)continue;const cold=[9,10,2].includes(biome[c.y*W+c.x])?.3:0;
    const sc=lat+cold+(n.aggr||.5)*.6+rng()*.3;if(sc>bs){bs=sc;best=n}}
  return best}
function vikingTargets(home){const out=[];for(const n of nations){if(!n.alive||n===home||n.era<1||(home&&allied(home,n))||(n.danegeld||0)>year)continue;
    for(const c of n.cities)if(coastWater(c).length)out.push({n,c,w:Math.sqrt(Math.max(1,n.pop))*(c===n.cities[0]?1.6:1)})}return out}
function launchRaid(){const home=nations.find(n=>n.alive&&n.viking)||null;const ts=vikingTargets(home);if(!ts.length)return;
  if(home)ts.sort((a,b)=>Math.hypot(a.c.x-home.cities[0].x,a.c.y-home.cities[0].y)-Math.hypot(b.c.x-home.cities[0].x,b.c.y-home.cities[0].y));
  const T=ts[Math.floor(Math.pow(rng(),2)*Math.min(ts.length,8))];
  let starts=[];if(home)for(const c of home.cities)starts.push(...coastWater(c));
  if(!starts.length)for(let q=0;q<80&&!starts.length;q++){const top=rng()<.5,x=(rng()*W)|0,y=top?0:H-1,j=y*W+x;if(isWater(j))starts.push(j)}
  if(!starts.length)return;
  const goal=(x,y)=>{for(let d=0;d<4;d++){if(x+DX[d]===T.c.x&&y+DY[d]===T.c.y)return y*W+x}return -1};
  const res=seaPath(starts,goal);if(!res||res.path.length<2||res.path.length>W*1.2)return;
  const p0=res.path[0],g=makeShip(2,'viking',VIK_SAIL);
  const s={owner:home?home.id:-1,kind:'viking',foe:T.n.id,era:SAIL,path:res.path,seg:0,target:res.target,x:wx(p0%W),z:wz((p0/W)|0),sink:0,g,foamT:0,town:T.c,home:home?home.id:-1};
  g.position.set(s.x,waterY,s.z);ships.push(s);
  if(!milestones.has('vikings')){milestone('vikings','The longships','Viking raiders put to sea.');if(typeof toast==='function')toast('Longships',`Vikings${home?' of '+home.name:''} are sailing for ${T.c.name}.`,s.x,s.z)}}
function vikingArrive(s){if(s.homeward){const H_=nations[s.home];if(H_&&H_.alive&&s.loot){H_.pop+=s.loot*.6;H_.tech+=TECHCOST[H_.era]*.03}return}
  const n=nations[s.foe],c=s.town;if(!n||!n.alive||!n.cities.includes(c))return;const home=nations[s.home];
  /* the defence: the age of the town's people, its walls and whether its men are away at war */
  const walls=cityLevel(n,n.cities.indexOf(c)===0)>=4?1.35:1,def=ERAS[n.era].mil*walls*(.6+rng())*(n.wars.size?.75:1.1),atk=ERAS[2].mil*1.35*(.6+rng())*(home?mil(home)/Math.max(.5,ERAS[home.era].mil):1);
  const won=atk>def,dur=12+rng()*6,L=s.target;
  RAIDS.push({x:wx(L%W),z:wz((L/W)|0),c,n:n.id,t:0,dur,won,men:null,seed:(rng()*1e9)|0});
  let loot=0;
  if(won){loot=n.pop*.05;n.pop*=.93;n.tech=Math.max(0,n.tech-TECHCOST[n.era]*.05);c.plundered=year;c.unrest=(c.unrest||0)+.15;n.happy=clamp((n.happy??.6)-.05,0,1);
    const holy=n.faith>=0&&n.era>=2&&rng()<.5;if(rng()<.45&&typeof ignite==='function')setTimeout(()=>{try{ignite(c.y*W+c.x)}catch(e){}},5000);
    n.raids=(n.raids||[]).filter(y=>y>year-30);n.raids.push(year);
    log(`Vikings${home?' of '+home.name:''} fell on ${c.name} in ${n.name}${holy?' and plundered its monastery':''}.${n.raids.length>=3?' The coast lives in fear.':''}`,'war');
    /* raided once too often, a people buys peace with silver */
    if(n.raids.length>=3&&rng()<.45){n.danegeld=year+40;n.pop*=.98;if(home){home.pop+=n.pop*.01;home.tech+=TECHCOST[home.era]*.08}log(`${n.name} paid Danegeld${home?' to the Vikings of '+home.name:' to the Vikings'}: silver for forty years of peace.`,'war');n.raids=[]}}
  else log(`The people of ${c.name} drove the Vikings back into the sea.`,'war');
  /* the ship waits while the raid lasts, then rows home */
  let goal;if(home&&home.alive){const hs=new Set();for(const t of home.cities)for(const j of coastWater(t))hs.add(j);goal=(x,y)=>hs.has(y*W+x)?y*W+x:-1}
  else goal=(x,y)=>(x===0||y===0||x===W-1||y===H-1)?y*W+x:-1;
  const res=seaPath([L],goal);if(!res||res.path.length<2)return;
  const g=makeShip(2,'viking',VIK_SAIL),r={owner:s.owner,kind:'viking',foe:-1,era:SAIL,path:res.path,seg:0,target:res.target,x:wx(L%W),z:wz((L/W)|0),sink:0,g,foamT:0,homeward:true,home:s.home,loot,hold:dur};
  g.position.set(r.x,waterY,r.z);ships.push(r)}
{const _ar=arrive;arrive=function(s){if(s.kind==='viking'){try{vikingArrive(s)}catch(e){console.warn('vikings',e)}return}return _ar.apply(this,arguments)}}
function vikingTick(){let top=0;for(const n of nations)if(n.alive)top=Math.max(top,n.era);
  if(top>=4||top<1){if(vikingAge&&top>=4){vikingAge=false;const h=nations.find(n=>n.viking);if(h)h.viking=false;log('The age of the Vikings is over. The longships rot on the beaches.','life')}return}
  let home=nations.find(n=>n.alive&&n.viking);
  if(!home&&rng()<.02){home=vikingHome();if(home){home.viking=year;home.aggr=Math.max(home.aggr||.5,.7);vikingAge=true;log(`The ${home.name} take to the sea in longships. The age of the Vikings begins.`,'war')}}
  if(!home&&!vikingAge)return;
  const now=ships.filter(s=>s.kind==='viking'&&!s.homeward&&!s.sink).length;
  if(now<3&&rng()<.06*mood().war*1.5)launchRaid()}
{const _t=tick;tick=function(){_t.apply(this,arguments);try{vikingTick()}catch(e){console.warn('vikings',e)}}}

/* the raiders ashore: they run from the boat into the town, plunder, set fires, and run back with their loot */
function updateRaids(dt){for(let q=RAIDS.length-1;q>=0;q--){const R=RAIDS[q];R.t+=dt;if(R.t>R.dur){RAIDS.splice(q,1);continue}
  const c=R.c,cx=wx(c.x),cz=wz(c.y);
  if(R.won&&R.t>R.dur*.3&&R.t<R.dur*.8&&Math.hypot(cx-camT.x,cz-camT.z)<camDist*1.4+3&&rng()<dt*6){const a=rng()*6.28,r=rng()*.35,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r,y=groundY(x,z);emit('fire',x,y+.02,z);emit('smoke',x,y+.06,z)}}}
function drawRaids(R2){if(!RAIDS.length||camDist>=16)return;const now=performance.now()/1000;
  for(const R of RAIDS){const c=R.c,cx=wx(c.x),cz=wz(c.y);const ex=cx-camT.x,ez=cz-camT.z;if(ex*ex+ez*ez>R2*1.5)continue;
    /* where they come ashore: walk from the boat towards the town until the ground is dry */
    if(!R.shore){let sx=R.x,sz=R.z;const dx=cx-R.x,dz=cz-R.z,d=Math.hypot(dx,dz)||1;for(let k=0;k<40;k++){sx+=dx/d*.03;sz+=dz/d*.03;if(groundY(sx,sz)>waterY+.004)break}R.shore=[sx,sz]}
    if(!R.men){R.men=[];const vk={era:2,color:'#6a3a2a'};for(let i=0;i<14;i++){const w={seed:R.seed+i*17,t:i,ph:i,moving:true,wait:0,act:'walk',x:R.shore[0],z:R.shore[1],dir:0,sol:true};soldierKit(w,vk);
        const r=mulberry32(w.seed);w.top=[0x5a3a2a,0x3a4a5a,0x6a5a3a,0x7a2a22,0x4a5a3a][(r()*5)|0];w.bot=[0x4a3a2a,0x5a5040][(r()*2)|0];w.skin=SKIN[(r()*3)|0];w.hair=[0xc9a45a,0x8a6a3a,0x6e3a1e,0xd8b878][(r()*4)|0];
        w.hat=r()<.75?'helm':null;w.hatCol=0x8a9098;w.uni=2;w.nid=-1;w.vk=true;w.shieldCol=[0xb83a2a,0xd8b048,0x2a4a7a,0xe8e0d0,0x3a6a3a][(r()*5)|0];w.off=[(r()-.5)*.3,(r()-.5)*.3];w.lag=r()*.12;R.men.push(w)}}
    const f=R.t/R.dur;
    for(const w of R.men){/* out to the town, about in it, then back to the boat with sacks */
      const p0=R.shore,in_=[cx+w.off[0],cz+w.off[1]],out=f<.3+w.lag?clamp((f-w.lag*.5)/.3,0,1):0;let x,z,mv=true;
      if(!R.won){const k=clamp(f/.25,0,1),back=clamp((f-.35)/.3,0,1);x=lerp(p0[0],lerp(p0[0],in_[0],.45),k-back*k);z=lerp(p0[1],lerp(p0[1],in_[1],.45),k-back*k);mv=f<.25||(f>.35&&f<.65)}
      else if(f<.3+w.lag){x=lerp(p0[0],in_[0],out);z=lerp(p0[1],in_[1],out)}
      else if(f<.75){x=in_[0]+Math.sin(now*.9+w.seed)*.06;z=in_[1]+Math.cos(now*.7+w.seed)*.06;mv=Math.sin(now*2+w.seed)>0;w.pack=0x8a6a44}
      else{const k=clamp((f-.75)/.22,0,1);x=lerp(in_[0],p0[0],k);z=lerp(in_[1],p0[1],k)}
      const dx=x-(w.x??x),dz=z-(w.z??z);if(Math.hypot(dx,dz)>1e-5)w.dir=Math.atan2(dx,dz);w.x=x;w.z=z;w.moving=mv;if(mv)w.ph+=.35;w.t=now;
      drawFolk(w);
      /* the axe in the other hand */
      const fx=Math.sin(w.dir),fz=Math.cos(w.dir),rx=Math.cos(w.dir),rz=-Math.sin(w.dir),gy=groundY(x,z),sw=mv?Math.sin(w.ph)*.4:Math.sin(now*6+w.seed)*.9;
      addR('pStick',x-rx*.008+fx*.004,gy+.026,z-rz*.008+fz*.004,.0012,.022,.0012,w.dir,-.6+sw,0,0x5a3e28);addR('pPack',x-rx*.008+fx*.014,gy+.012+sw*.004,z-rz*.008+fz*.014,.0015,.007,.006,w.dir,0,0,0xa8b0b8)}}}
{const _da3=drawArmyFolk;drawArmyFolk=function(R2){_da3.apply(this,arguments);try{drawRaids(R2)}catch(e){console.warn('raids',e)}}}
{const _ul3=updateLiving;updateLiving=function(dt,k,now){const r=_ul3.apply(this,arguments);try{updateRaids(dt*(k>0?1:0))}catch(e){RAIDS=[]}return r}}
