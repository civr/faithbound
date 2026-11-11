"use strict";
/* Faithbound — the god's newer works: miracles, prophets, heroes, migrations, locusts, the kraken, floods, climate and eclipses */

TRAITS.hero={label:'Hero',desc:'A legend who wins battles',mil:1.35,stab:1.08,exp:1.15};
if(typeof FAMINE_CAUSE==='object')FAMINE_CAUSE.locusts='Locusts devoured the fields';
PK.locust={life:.8,size:.04,grow:0,vy:.04,col:[.12,.1,.05],a:1};
PK.holy={life:1.6,size:.09,grow:.08,vy:.14,col:[1,.86,.45],a:.7};GLOWK.holy=1;

/* ---------- miracle: heal the sick and the hungry ---------- */
function miracle(n){const healed=[];if(n.sick){healed.push('the '+n.sick.name);n.sick=null;n.immune=year+30}
  if(n.famine>0){healed.push('the famine');n.famine=0;propsDirty=true}if(n.plague>0){n.plague=0}
  n.pop*=healed.length?1.04:1.01;n.devotion=clamp((n.devotion??.3)+(healed.length?.22:.12),0,1);n.stab=Math.min(1,stabOf(n)+.1);
  for(const c of n.cities)for(let q=0;q<10;q++)emit('holy',wx(c.x)+(rng()-.5)*.4,groundY(wx(c.x),wz(c.y))+.05,wz(c.y)+(rng()-.5)*.4);
  log(healed.length?`A miracle in ${n.name}: ${healed.join(' and ')} ended overnight. The people fall to their knees.`:`A miracle in ${n.name}: the lame walk and the wells run sweet. Faith in you soars.`,'faith');
  milestone('miracle','A miracle','You healed a nation with a word.')}

/* ---------- golden age and heroes ---------- */
function goldenAge(n){n.golden=year+50;n.stab=Math.max(stabOf(n),.75);n.devotion=clamp((n.devotion??.3)+.08,0,1);propsDirty=true;
  log(`By your grace a golden age dawns in ${n.name}: fifty years of plenty, learning and splendour.`,'era');milestone('golden','A golden age','A nation flourished in peace and plenty.')}
function raiseHero(n){const war=n.wars.size>0||n.aggr>.5,p=newPerson({sex:rng()<(n.era>=5?.35:.15)?'f':'m',born:year-22,house:n.house,nation:n.id,traits:[war?'brave':'wise','hero']});
  n.hero={p:p.id,until:year+45,wins:0};n.stab=Math.min(1,stabOf(n)+.05);
  log(`A hero rises in ${n.name}: ${p.name}, ${war?'a born commander whom no army can stand against':'a champion the whole realm follows'}.`,'era');milestone('hero','A hero is born','A legend walked among the people.');return p}
const heroOf=n=>n&&n.hero&&n.hero.until>year?per(n.hero.p):null;
function heroTag(A){const h=heroOf(A);if(!h||h.died!=null)return '';A.hero.wins++;return `, led by the hero ${h.name}`}
function heroTick(n){if(!n.hero)return;const h=per(n.hero.p);
  if(!h||h.died!=null||year>=n.hero.until){if(h&&h.died==null){h.died=year;h.cause=n.hero.wins>2?'old wounds':'old age'}
    log(`${h?h.name:'The hero'} of ${n.name} has died.${n.hero.wins?` Songs will tell of ${n.hero.wins} victories.`:''}`,'life');n.hero=null;return}
  if(!n.wars.size&&n.aggr>.45&&warRoom()&&rng()<.01*mood().war){const nb=[...n.nb].map(i=>nations[i]).filter(m=>m&&m.alive&&!allied(n,m));if(nb.length){const B=nb[(rng()*nb.length)|0];startWar(n,B,null);log(`${h.name} of ${n.name} longs for glory and leads the army against ${B.name}.`,'war')}}}

/* ---------- migration: pick a people up and set them down elsewhere ---------- */
let migrFrom=null;
function nearestTown(n,i){const x=i%W,y=(i/W)|0;let best=null,bd=1e9;for(const c of n.cities){const d=Math.hypot(c.x-x,c.y-y);if(d<bd){bd=d;best=c}}return best}
function migrate(src,c,j){const n=src,x=j%W,y=(j/W)|0;
  if(isWater(j)||hab[j]<.1)return 'Set them down on land where people can live.';if(owner[j]>=0&&owner[j]!==n.id)return 'That land belongs to another nation. Pick empty land or your own.';
  if(n.cities.some(t=>Math.hypot(t.x-x,t.y-y)<3)||nations.some(m=>m.alive&&m.cities.some(t=>Math.hypot(t.x-x,t.y-y)<3)))return 'Too close to another town. Pick a spot a little further away.';
  if(n.pop<12)return `${n.name} has too few people to spare.`;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const k=Y*W+X;if(owner[k]<0&&hab[k]>=.1)claim(k,n.id)}
  if(owner[j]!==n.id)claim(j,n.id);
  const far=Math.hypot(n.cities[0].x-x,n.cities[0].y-y)>14,t={x,y,name:cultureName(cultOf(n)),origin:n.id};if(far)t.colony=true;n.cities.push(t);
  n.pop*=.99;propsDirty=true;bordersDirty=true;
  for(const [a,b] of [[c.x,c.y],[x,y]])for(let q=0;q<14;q++)emit('holy',wx(a)+(rng()-.5)*.35,groundY(wx(a),wz(b))+.04,wz(b)+(rng()-.5)*.35);
  log(`You lifted a people out of ${c.name} and set them down far away. They founded ${t.name}${far?', a colony of '+n.name:''}.`,'life');milestone('migrate','A new home','You carried a people to a new land.');return null}

/* ---------- prophets walk from town to town ---------- */
let prophets=[];
const PROPHET_MAT={robe:stdMat({color:colL(0xf2eee4),roughness:.9}),skin:stdMat({color:colL(0xc89a78)}),staff:stdMat({color:colL(0x6a4a2e)}),
  grey:stdMat({color:colL(0x8a8274),roughness:.9}),halo:new THREE.MeshBasicMaterial({color:0xffd877}),
  beam:new THREE.MeshBasicMaterial({color:0xffd877,transparent:true,opacity:.16,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})};
function makeProphet(){const g=new THREE.Group(),M=PROPHET_MAT;const add=(geo,m,x,y,z)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;g.add(o);return o};
  add(new THREE.ConeGeometry(.02,.065,10),M.robe,0,.0325,0);add(new THREE.SphereGeometry(.01,10,8),M.skin,0,.072,0);
  add(new THREE.CylinderGeometry(.0018,.0018,.09,5),M.staff,.016,.045,0);
  const h=add(new THREE.TorusGeometry(.013,.0022,6,18),M.halo,0,.082,-.004);h.castShadow=false;
  const b=add(new THREE.CylinderGeometry(.02,.07,1.1,14,1,true),M.beam,0,.55,0);b.castShadow=false;
  const fol=[];for(let k=0;k<4;k++){const f=new THREE.Group();const r=new THREE.Mesh(new THREE.ConeGeometry(.014,.048,8),M.grey);r.position.y=.024;const hd=new THREE.Mesh(new THREE.SphereGeometry(.0075,8,6),M.skin);hd.position.y=.054;f.add(r,hd);g.add(f);fol.push(f)}
  g.userData.fol=fol;g.scale.setScalar(1.5);scene.add(g);return g}
function spawnProphet(i,faith){const x=wx(i%W),z=wz((i/W)|0);const p={faith,x,z,tile:i,path:null,pi:0,target:null,visits:0,life:0,seen:new Set(),g:makeProphet(),wait:1.5};
  prophets.push(p);log(`A prophet of ${faiths[faith].name} rose from the wilderness and set out to preach.`,'faith');milestone('prophet','A prophet walks','A holy one went from town to town.');prophetNext(p);return p}
function prophetNext(p){const x=p.tile%W,y=(p.tile/W)|0;let best=null,bd=1e9;
  for(const n of nations){if(!n.alive)continue;for(const c of n.cities){const k=c.y*W+c.x;if(p.seen.has(k))continue;const d=Math.hypot(c.x-x,c.y-y)*(n.faith===p.faith?2.5:1);if(d<bd&&d<40){bd=d;best=c}}}
  if(!best){p.path=null;p.target=null;return}
  const path=roadPath({x,y},best,-1,new Uint8Array(N));p.seen.add(best.y*W+best.x);if(!path||path.length<1){p.target=null;return prophetNext(p)}
  p.path=path;p.pi=0;p.target=best}
function preach(p){const c=p.target;const n=nations[owner[c.y*W+c.x]];p.visits++;if(!n||!n.alive)return;
  for(let q=0;q<18;q++)emit('holy',wx(c.x)+(rng()-.5)*.3,groundY(wx(c.x),wz(c.y))+.04,wz(c.y)+(rng()-.5)*.3);
  n.devotion=clamp((n.devotion??.3)+.06,0,1);
  if(n.faith===p.faith){if(important(n)&&rng()<.4)log(`The prophet of ${faiths[p.faith].name} preached in ${c.name}. The faithful wept.`,'faith');return}
  n.convert=n.convert||{};const k=p.faith;n.convert[k]=(n.convert[k]||0)+(c===n.cities[0]?2:1);
  if(n.convert[k]>=2||rng()<.35){n.faith=p.faith;n.convert={};propsDirty=true;const f=faiths[p.faith];if(!f.holy){f.holy=c.name}
    log(`The prophet preached in ${c.name}, and ${n.name} embraced ${f.name}.`,'faith')}
  else log(`The prophet of ${faiths[p.faith].name} preached in ${c.name}. Many in ${n.name} listen.`,'faith')}
function updateProphets(dt,k,now){for(let q=prophets.length-1;q>=0;q--){const p=prophets[q];p.life+=dt*k;
    if(p.life>260||p.visits>=9||(!p.target&&p.wait<=0)){for(let e=0;e<30;e++)emit('holy',p.x+(rng()-.5)*.1,groundY(p.x,p.z)+.05+rng()*.3,p.z+(rng()-.5)*.1);
      log(`The prophet of ${faiths[p.faith]?faiths[p.faith].name:'your faith'} ascended in a column of light.`,'faith');disposeGroup(p.g);prophets.splice(q,1);continue}
    const g=p.g;let moving=false;
    if(p.wait>0)p.wait-=dt*k;
    else if(p.path){const t=p.path[Math.min(p.pi,p.path.length-1)],tx=wx(t%W),tz=wz((t/W)|0),dx=tx-p.x,dz=tz-p.z,d=Math.hypot(dx,dz),sp=.32*dt*k;
      if(d<=sp){p.x=tx;p.z=tz;p.tile=t;p.pi++;if(p.pi>=p.path.length){preach(p);p.wait=3;prophetNext(p)}}
      else{p.x+=dx/d*sp;p.z+=dz/d*sp;g.rotation.y=Math.atan2(dx,dz);moving=true}}
    else if(p.wait<=0)p.target=null;
    const y=groundY(p.x,p.z);g.position.set(p.x,y+(moving?Math.abs(Math.sin(now/160))*.004:0),p.z);
    g.userData.fol.forEach((f,i)=>{f.position.set(Math.sin(i*2.1)*.035,0,-.045-i*.028);f.position.y=moving?Math.abs(Math.sin(now/150+i))*.003:0});
    if(rng()<dt*6)emit('holy',p.x,y+.12,p.z)}}

/* ---------- strife: spark a revolt, locusts, the kraken ---------- */
function sparkRevolt(n,c){rebel(n,c,'free');n.stab=Math.max(0,stabOf(n)-.08)}
let swarms=[];
function spawnLocusts(i){const s={x:wx(i%W),z:wz((i/W)|0),a:rng()*6.28,life:0,hit:new Set(),home:owner[i]};swarms.push(s);log('A black cloud rose on the horizon. Locusts!','doom');milestone('locusts','Locusts','A swarm darkened the sky.');return s}
function updateSwarms(dt,k){for(let q=swarms.length-1;q>=0;q--){const s=swarms[q];s.life+=dt*k;if(s.life>40){swarms.splice(q,1);continue}
    s.a+=(rng()-.5)*dt*k*1.2;{const j=tileAt(s.x+Math.cos(s.a)*.6,s.z+Math.sin(s.a)*.6);if(j<0||isWater(j))s.a+=dt*k*3;else{const n=nations[s.home];if(n&&n.alive&&n.cities.length&&rng()<dt*k*.5){const c=n.cities[(rng()*n.cities.length)|0];s.a=Math.atan2(wz(c.y)-s.z,wx(c.x)-s.x)}}}const sp=.28*dt*k;s.x=clamp(s.x+Math.cos(s.a)*sp,-W/2+1,W/2-1);s.z=clamp(s.z+Math.sin(s.a)*sp,-H/2+1,H/2-1);
    const y=Math.max(groundY(s.x,s.z),waterY)+.12;for(let e=0;e<26;e++)emit('locust',s.x+(rng()-.5)*.6,y+(rng()-.5)*.14,s.z+(rng()-.5)*.7,(rng()-.5)*.6,(rng()-.5)*.6);
    if(k>0&&rng()<dt*3){const j=tileAt(s.x,s.z);if(j>=0&&owner[j]>=0&&!s.hit.has(owner[j])){const n=nations[owner[j]];s.hit.add(n.id);startFamine(n,'locusts',true);n.pop*=.97}}}}
let krakens=[];
const KRAKEN_MAT={skin:stdMat({color:colL(0x4a2a44),roughness:.45}),belly:stdMat({color:colL(0xb07a7a),roughness:.6}),eye:new THREE.MeshBasicMaterial({color:0xffd23a})};
function makeKraken(){const g=new THREE.Group(),M=KRAKEN_MAT;const head=new THREE.Mesh(new THREE.SphereGeometry(.13,18,14),M.skin);head.scale.set(1,.85,1.25);head.position.y=.02;head.castShadow=true;g.add(head);
  for(const s of [-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.022,10,8),M.eye);e.position.set(.1,.06,s*.06);g.add(e)}
  const tents=[];for(let t=0;t<8;t++){const root=new THREE.Group();const a=t/8*Math.PI*2+.2;root.position.set(Math.cos(a)*.11,-.01,Math.sin(a)*.11);root.rotation.y=-a;g.add(root);
    let par=root;const segs=[];for(let s=0;s<8;s++){const r0=.026*(1-s/8)+.004,r1=.026*(1-(s+1)/8)+.003,L=.055;const geo=new THREE.CylinderGeometry(r1,r0,L,8);geo.translate(0,L/2,0);
      const m=new THREE.Mesh(geo,s%2?M.skin:M.belly);m.castShadow=true;par.add(m);const j=new THREE.Group();j.position.y=L;m.add(j);segs.push(m);par=j}
    tents.push({segs,ph:rng()*6.28})}
  g.userData.tents=tents;g.userData.head=head;scene.add(g);return g}
function spawnKraken(i){const k={x:wx(i%W),z:wz((i/W)|0),life:0,hp:3,g:makeKraken(),tx:0,tz:0,prey:null,rise:0,cool:0,sunk:0};k.tx=k.x;k.tz=k.z;krakens.push(k);
  log('Something vast stirs beneath the waves. The kraken has woken.','doom');milestone('kraken','The kraken','A sea monster hunts the ships.');return k}
function seaAt(x,z){const j=tileAt(x,z);return j>=0&&isWater(j)}
function updateKrakens(dt,k,now){for(let q=krakens.length-1;q>=0;q--){const K=krakens[q];K.life+=dt*k;if(K.cool>0)K.cool-=dt*k;
    if(K.life>220||K.hp<=0){log(K.hp<=0?'The kraken was slain by warships and sank into the deep.':`The kraken sank back into the deep after taking ${K.sunk} ships.`,'sky');disposeGroup(K.g);krakens.splice(q,1);continue}
    if(!K.prey||K.prey.sink||!ships.includes(K.prey)){K.prey=null;let bd=9;for(const s of ships){if(s.sink)continue;const d=Math.hypot(s.x-K.x,s.z-K.z);if(d<bd){bd=d;K.prey=s}}}
    if(K.prey){K.tx=K.prey.x;K.tz=K.prey.z}else if(Math.hypot(K.tx-K.x,K.tz-K.z)<.2){for(let t=0;t<12;t++){const a=rng()*6.28,r=1+rng()*4,x=K.x+Math.cos(a)*r,z=K.z+Math.sin(a)*r;if(seaAt(x,z)){K.tx=x;K.tz=z;break}}}
    const dx=K.tx-K.x,dz=K.tz-K.z,d=Math.hypot(dx,dz),sp=(K.prey?.55:.25)*dt*k;
    if(d>.05){const nx=K.x+dx/d*sp,nz=K.z+dz/d*sp;if(seaAt(nx,nz)){K.x=nx;K.z=nz}else{K.tx=K.x;K.tz=K.z;K.prey=null}}
    if(K.prey&&d<.3&&K.cool<=0){const s=K.prey;K.cool=4;
      if(s.kind==='war'&&s.era>=5&&rng()<.6){K.hp--;for(let e=0;e<6;e++)emit('flash',K.x+(rng()-.5)*.2,waterY+.1,K.z+(rng()-.5)*.2);if(K.hp>0)log('Warships fired on the kraken and wounded it.','war')}
      else{s.sink=.01;K.sunk++;log(`The kraken dragged ${s.owner<0?'a pirate ship':'a ship of '+nations[s.owner].name} beneath the waves.`,'doom');for(let e=0;e<12;e++)emit('foam',s.x+(rng()-.5)*.3,waterY+.02,s.z+(rng()-.5)*.3)}}
    const want=K.prey&&d<1.2?1:0;K.rise+=(want-K.rise)*Math.min(1,dt*2);
    const g=K.g;g.position.set(K.x,seaNow()-.06+K.rise*.07,K.z);if(d>.05)g.rotation.y+=((Math.atan2(-dz,dx)-g.rotation.y+Math.PI*3)%(Math.PI*2)-Math.PI)*Math.min(1,dt*2);
    const t=now/1000;for(const T of g.userData.tents)T.segs.forEach((m,i)=>{m.rotation.z=(i===0?-.35-K.rise*.5:0)+Math.sin(t*2.2+T.ph+i*.7)*(.18+K.rise*.25);m.rotation.x=Math.cos(t*1.7+T.ph+i*.5)*.12});
    if(rng()<dt*5)emit('foam',K.x+(rng()-.5)*.4,waterY+.01,K.z+(rng()-.5)*.4)}}
function disposeGroup(g){scene.remove(g);g.traverse(o=>{if(o.geometry)o.geometry.dispose()})}

/* ---------- nature: fertile land, forests, floods, climate ---------- */
function moistTo(j,m){baseMoist[j]=clamp(m-(climate.rain-.5)*.7-moistD[j],0,1)}
function fertileLand(i){let n=0,cold=0;brush(i,4.5,(j,d)=>{if(isWater(j)||biome[j]>=11)return;if(biome[j]===9||biome[j]===10){cold++;return}if([3,7,8].includes(biome[j])||baseMoist[j]<.45){moistTo(j,.46+hash(j)*.04);n++}});
  terrainDirty=true;treesDirty=true;colorDirty=true;return {n,cold}}
function plantForest(i){let n=0;brush(i,3.6,(j,d)=>{if(isWater(j)||biome[j]>=9||biome[j]===3)return;if(occupied.has(j))return;moistTo(j,.6+hash(j*3)*.08);n++});terrainDirty=true;treesDirty=true;return n}
let floods=[];
const FLOODMAT=stdMat({color:colL(0x6f7a5e),roughness:.15,metalness:.1,transparent:true,opacity:.78});
function riverFlood(i){const x0=i%W,y0=(i/W)|0;let hit=null,bd=9;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const X=x0+dx,Y=y0+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const k=Y*W+X;if(river[k]&&!isWater(k)){const d=Math.hypot(dx,dy);if(d<bd){bd=d;hit=k}}}
  if(hit==null)return null;const tiles=new Set();const hx=hit%W,hy=(hit/W)|0;
  for(let dy=-7;dy<=7;dy++)for(let dx=-7;dx<=7;dx++){const X=hx+dx,Y=hy+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const k=Y*W+X;if(!river[k]||isWater(k))continue;
    for(let ey=-2;ey<=2;ey++)for(let ex=-2;ex<=2;ex++){const XX=X+ex,YY=Y+ey;if(XX<0||YY<0||XX>=W||YY>=H)continue;const q=YY*W+XX;if(!isWater(q)&&biome[q]<11&&h[q]-h[k]<.05)tiles.add(q)}}
  /* the water level: the river's surface at the nearest river tile, raised by the flood. Each tile is cut into a fine grid that
     follows the ground; where the ground lies below the flood level the water stands, shallow at the edges. */
  const lvl=new Map(),rise=.022+rng()*.012;
  const levelAt=(tx,ty)=>{let best=null,bd=9;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const X=Math.round(tx)+dx,Y=Math.round(ty)+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const k=Y*W+X;if(!river[k]||isWater(k))continue;
      const d=Math.hypot(X-tx,Y-ty);if(d<bd){bd=d;best=k}}if(best==null)return -1e9;if(!lvl.has(best))lvl.set(best,groundY(wx(best%W),wz((best/W)|0))+.012);return lvl.get(best)+rise*(1-Math.min(1,bd/3))};
  const pos=[],gnd=[],lev=[],idx=[],S=5;const hit_=new Set(),lost=[],wet=new Set();
  for(const q of tiles){const X=q%W,Y=(q/W)|0,b=pos.length/3;let any=false;
    for(let v=0;v<=S;v++)for(let u=0;u<=S;u++){const tx=X-.5+u/S,ty=Y-.5+v/S,x=wx(X)+(u/S-.5),z=wz(Y)+(v/S-.5),g=groundY(x,z),L=levelAt(tx,ty);pos.push(x,g,z);gnd.push(g);lev.push(L);if(L>g)any=true}
    if(!any){pos.length=b*3;gnd.length=b;lev.length=b;continue}
    for(let v=0;v<S;v++)for(let u=0;u<S;u++){const a=b+v*(S+1)+u;idx.push(a,a+S+1,a+1,a+1,a+S+1,a+S+2)}
    wet.add(q);moistD[q]=clamp(moistD[q]+.35,-.6,.6);if(owner[q]>=0)hit_.add(owner[q])}
  if(!idx.length)return 0;
  for(const id of hit_){const n=nations[id];n.pop*=.97;for(const c of n.cities)if(wet.has(c.y*W+c.x)){n.pop*=.97;lost.push(c.name)}}
  moistActive=320;terrainDirty=true;
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('aG',new THREE.Float32BufferAttribute(gnd,1));g.setAttribute('aL',new THREE.Float32BufferAttribute(lev,1));g.setIndex(idx);
  const mat=new THREE.ShaderMaterial({uniforms:{uPh:{value:0},uT:{value:0},uSun:{value:new THREE.Vector3(.5,.8,.3)}},transparent:true,depthWrite:false,
    vertexShader:`attribute float aG,aL;uniform float uPh;varying float vD;varying vec3 vW;void main(){float L=mix(aG-.004,aL,uPh);vD=L-aG;vec3 p=position;p.y=max(aG-.004,L)+.0015;vW=p;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader:`uniform float uT;varying float vD;varying vec3 vW;void main(){if(vD<=0.)discard;float d=smoothstep(0.,.02,vD);
      vec3 mud=vec3(.38,.34,.24),deep=vec3(.2,.25,.24),c=mix(mud,deep,d);float r=sin(vW.x*90.+uT*1.7)*sin(vW.z*80.-uT*1.3);c+=vec3(.05,.06,.06)*smoothstep(.6,1.,r);
      c=mix(c*1.12,c,smoothstep(0.,.006,vD));gl_FragColor=vec4(c,smoothstep(0.,.004,vD)*(.62+.25*d));}`});
  const m=new THREE.Mesh(g,mat);m.renderOrder=2;m.frustumCulled=false;scene.add(m);floods.push({m,t:0,wet:[...wet]});
  log(`The river burst its banks${lost.length?' and flooded '+lost.slice(0,3).join(', '):''}. When the water drains, the fields will be rich.`,'sky');
  if(typeof toast==='function'&&!lost.length&&Math.hypot(wx(hx)-camT.x,wz(hy)-camT.z)<camDist*1.5+3)toast('Flood','The river has burst its banks.',wx(hx),wz(hy));return wet.size}
/* a flood rises over a few seconds, stands, and drains away, leaving the ground dark and wet */
function updateFloods(dt){for(let q=floods.length-1;q>=0;q--){const f=floods[q];f.t+=dt;const U=f.m.material.uniforms;
    U.uPh.value=f.t<4?smooth(0,4,f.t):f.t<14?1:1-smooth(14,24,f.t);U.uT.value=f.t;
    if(typeof WXG!=='undefined'&&WXG.wet&&f.wet&&f.t>3)for(const j of f.wet)WXG.wet[j]=Math.max(WXG.wet[j],.9),WXG.dirty=true;
    if(f.t>24){scene.remove(f.m);f.m.geometry.dispose();f.m.material.dispose();floods.splice(q,1)}}}
function shiftClimate(dir){climate.temp=clamp(climate.temp+dir*.12,.08,.95);terrainDirty=true;colorDirty=true;treesDirty=true;
  log(dir>0?'You breathed warmth over the world. Ice melts, the seas rise and the snow retreats up the mountains.':'You breathed cold over the world. Glaciers grow, the seas fall and winters bite.','sky')}

/* ---------- eclipse: an omen everyone must answer ---------- */
let eclipseT=0;const ECL_LEN=14;
const eclipseAmt=()=>eclipseT>0?Math.sin(Math.PI*clamp(1-eclipseT/ECL_LEN,0,1))*.85:0;
function eclipse(){eclipseT=ECL_LEN;const pray=[],panic=[],war=[];
  for(const n of nations){if(!n.alive)continue;
    if((n.devotion??.3)>.35||n.faith>=0&&rng()<.35){pray.push(n.name);n.devotion=clamp((n.devotion??.3)+.08,0,1);n.stab=Math.min(1,stabOf(n)+.05)}
    else{n.stab=Math.max(0,stabOf(n)-.12);if(n.aggr>.6&&warRoom()&&rng()<.4){const nb=[...n.nb].map(i=>nations[i]).filter(m=>m&&m.alive&&!n.wars.has(m.id)&&!allied(n,m));if(nb.length){const B=nb[(rng()*nb.length)|0];startWar(n,B,null);war.push(`${n.name} attacked ${B.name}`);continue}}
      panic.push(n.name);if(n.cities.length>1&&rng()<.3)riot(n)}}
  log(`The sun went dark at midday.${pray.length?` ${pray.length===1?pray[0]+' prays':pray.length+' nations pray'} for your mercy.`:''}${panic.length?` Panic in ${panic.slice(0,3).join(', ')}${panic.length>3?' and others':''}.`:''}${war.length?' Seeing a sign, '+war.join(' and ')+'.':''}`,'sky');
  milestone('eclipse','The sun went dark','An eclipse shook the world.')}

function updateGodWorks(dt,k,now){if(eclipseT>0)eclipseT-=dt;updateProphets(dt,k,now);updateSwarms(dt,k);updateKrakens(dt,k,now);updateFloods(dt)}
