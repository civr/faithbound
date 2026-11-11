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
const LIFE_KITS=['lcart','wheel','beast','fboat'];
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
  /* fishing boats off the coasts of older towns */
  for(const n of nations){if(!n.alive||n.era<1||n.era>5)continue;for(const c of n.cities){const cx=wx(c.x),cz=wz(c.y);if(!near(cx,cz,1.3))continue;const cw=typeof coastWater==='function'?coastWater(c):[];if(!cw.length)continue;
    for(let b=0;b<Math.min(2,cw.length);b++){const j=cw[(b*7+c.x)%cw.length],ph=hash(j+b)*6.28,x=wx(j%W)+Math.sin(now/4000+ph)*.25,z=wz((j/W)|0)+Math.cos(now/5000+ph)*.25,ti=tileAt(x,z);if(ti<0||!isWater(ti))continue;
      add('fboat',x,waterY+.004+Math.sin(now/500+ph)*.003,z,.05,.012,.018,ph,0x7a5a3a);add('fboat',x,waterY+.02,z,.002,.03,.002,0,0xe8e0d0)}}}
  for(const nm of LIFE_KITS){const K=KITS[nm];K.mesh.count=K.k;K.mesh.instanceMatrix.needsUpdate=true;if(K.mesh.instanceColor)K.mesh.instanceColor.needsUpdate=true}
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
/* the crews of the fishing boats: one rows or steers, one hauls the net over the side */
function drawBoatCrews(R2){if(camDist>=14||settings.people===false)return;const now=performance.now()/1000,sea=waterY+(typeof TIDE!=='undefined'?TIDE:0);
  for(const n of nations){if(!n.alive||n.era<1||n.era>5)continue;for(const c of n.cities){const cw=coastWater(c);if(!cw.length)continue;
    for(let b=0;b<Math.min(2,cw.length);b++){const j=cw[(b*7+c.x)%cw.length],ph=hash(j+b)*6.28,x=wx(j%W)+Math.sin(now*1000/4000+ph)*.25,z=wz((j/W)|0)+Math.cos(now*1000/5000+ph)*.25;
      const ex=x-camT.x,ez=z-camT.z;if(ex*ex+ez*ez>R2)continue;const ti=tileAt(x,z);if(ti<0||!isWater(ti)||!fishingNow(x,z))continue;
      const crew=(c._crew||(c._crew={}))[b]||(c._crew[b]=[0,1].map(q=>{const w={seed:(j*13+q*7)|0,t:q*2,ph:0,moving:false,wait:1,act:q?'farm':'chat',x:0,z:0,dir:0};dressFolk(w,n);w.kid=false;w.pack=0;w.tool=false;return w}));
      const y=sea+.004+Math.sin(now*2+ph)*.003+.006,dir=ph+Math.PI/2,cs=Math.cos(ph),sn=Math.sin(ph);
      crew.forEach((w,q)=>{const off=(q?-.012:.012);w.x=x+cs*off;w.z=z-sn*off;w.y=y;w.dir=q?dir+Math.PI/2:dir;w.t=now+q*1.7;w.wait=1;w.act=q?'farm':'chat';drawFolk(w)});
      /* the net over the side: a few floats in a curve on the water */
      for(let q=0;q<5;q++){const t=(q-2)/2,nx=x+Math.cos(dir)*(.05+.012*Math.abs(t))+Math.sin(dir)*t*.025,nz=z-Math.sin(dir)*(.05+.012*Math.abs(t))+Math.cos(dir)*t*.025;
        addR('pHand',nx,sea+.0012+Math.sin(now*1.6+q)*.0007,nz,.0024,.0018,.0024,0,0,0,q%2?0xe8d8a0:0xc84a2a)}}}}}
