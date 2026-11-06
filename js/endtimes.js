"use strict";
/* Faithbound — the end of days. The world plays on forever by default, but once a people has reached the Future age
   the god may end it: a total war in which every nation turns on its neighbours and the bombs fall, or an invasion
   from the stars. When the last towns burn the world goes dark and a new one is born in the Stone Age. */

POWERS.push({id:'endofdays',tab:'Strife',label:'End of days',cost:0,icon:'skull',hint:'Only when a people has reached the Future age. Tap anywhere and choose how this world ends: a total war or an invasion from the stars. Afterwards a new world is born.'});
let doom=null;const SAUCERS=[];

function endReady(){return nations.some(n=>n.alive&&n.era>=ERAS.length-1)}
function openEndOfDays(){
  if(typeof coopGuest==='function'&&coopGuest()){say('Only the host of a shared world can end it.');return}
  if(doom){say('This world is already ending.');return}
  if(!endReady()){say(`The end of days can only come when a people has reached the ${ERAS[ERAS.length-1].name}.`);return}
  openModal(`<h2>End of days</h2><p class="note">This world ends, and after the last fires a new world is born in the Stone Age. Nothing here can be undone. Your followers remember you: the next world starts with more belief.</p>
    <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn primary" data-end="war">☢ Total war</button><button class="btn primary" data-end="stars">🛸 Invasion from the stars</button><button class="btn" data-end="">Cancel</button></div>`)}
document.addEventListener('click',e=>{const b=e.target.closest('[data-end]');if(!b)return;const k=b.dataset.end;closeModal();if(k)beginDoom(k)});
{const _at=applyTool;applyTool=function(i,start){if(tool==='endofdays'){if(start)openEndOfDays();return}return _at.apply(this,arguments)}}

function allCities(){const out=[];for(const n of nations)if(n.alive)for(const c of n.cities)out.push([n,c]);return out}
function beginDoom(kind){doom={kind,t0:performance.now(),next:0,dark:false,left:allCities().length};
  if(typeof setTool==='function')setTool('inspect');
  if(kind==='war'){log('The great powers have turned on each other. Every border is a front, and the silos open.','doom');
    for(const n of nations){if(!n.alive)continue;n.pacts={};for(const b of n.nb||[]){const m=nations[b];if(m&&m.alive&&!n.wars.has(b))startWar(n,m,'god')}n.nukes=Math.max(n.nukes||0,6);if(n.techs&&!n.techs.includes('atomic'))n.techs.push('atomic')}}
  else{log('Lights in the sky. Great ships from beyond the stars descend over the cities of the world.','doom');
    for(let k=0;k<Math.min(9,3+Math.round(doom.left/8));k++)SAUCERS.push(makeSaucer(k))}
  if(typeof sfx==='function')sfx('doom');shakeT=.6;
  const ov=document.createElement('div');ov.id='doomFade';ov.style.cssText='position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;transition:opacity 3.5s ease;z-index:50';document.body.appendChild(ov)}

/* a ship from beyond: a broad hull, a glowing rim and a pale beam that burns what it touches */
const SAUCER_M={hull:new THREE.MeshStandardMaterial({color:0x6a7078,metalness:.85,roughness:.32}),dome:new THREE.MeshStandardMaterial({color:0x9fe8ff,metalness:.2,roughness:.1,emissive:0x2a6a80,emissiveIntensity:.8}),
  rim:new THREE.MeshBasicMaterial({color:0xb8ffd8}),beam:new THREE.MeshBasicMaterial({color:0xb8ffd8,transparent:true,opacity:.28,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})};
function makeSaucer(k){const g=new THREE.Group();
  const hull=new THREE.Mesh(new THREE.LatheGeometry([[0,-.05],[.25,-.06],[.62,-.01],[.66,.02],[.5,.06],[.2,.09],[0,.1]].map(p=>new THREE.Vector2(p[0],p[1])),28),SAUCER_M.hull);hull.castShadow=true;g.add(hull);
  const dome=new THREE.Mesh(new THREE.SphereGeometry(.2,18,9,0,Math.PI*2,0,Math.PI/2),SAUCER_M.dome);dome.position.y=.09;g.add(dome);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.64,.018,6,40),SAUCER_M.rim);rim.rotation.x=Math.PI/2;g.add(rim);
  for(let q=0;q<10;q++){const l=new THREE.Mesh(new THREE.SphereGeometry(.025,6,4),SAUCER_M.rim);const a=q/10*6.283;l.position.set(Math.cos(a)*.42,-.05,Math.sin(a)*.42);g.add(l)}
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.06,.5,1,20,1,true),SAUCER_M.beam);beam.position.y=-.5;beam.visible=false;g.add(beam);
  const s=1.3+rng()*.8;g.scale.setScalar(s);const a=k*2.4;g.position.set(Math.cos(a)*W*.7,9+rng()*3,Math.sin(a)*H*.7);scene.add(g);
  return {g,beam,tgt:null,t:0,phase:'fly',spin:(rng()<.5?-1:1)*(1+rng())}}

/* a town burned from the sky */
function burnTown(n,c,how){const k=n.cities.indexOf(c);if(k<0)return;n.cities.splice(k,1);ruins.push({x:c.x,y:c.y,year,name:c.name});const i0=c.y*W+c.x;
  n.pop*=.7;brush(i0,1.6,(j,d)=>{if(scorched)scorched[j]=Math.max(scorched[j],40);if(owner[j]===n.id&&d<1.3)claim(j,-1)});
  burst(i0,'fire',30,1.2);burst(i0,'dark',40,1.6);shakeT=Math.max(shakeT,.35);terrainDirty=true;colorDirty=true;propsDirty=true;bordersDirty=true;
  if(rng()<.35||n.cities.length===0)log(`${how} ${c.name} of ${n.name} is gone.`,'doom')}

function doomStep(){if(!doom)return;const now=performance.now(),el=(now-doom.t0)/1000,left=allCities();
  if(!doom.dark&&(left.length===0||el>95)){doom.dark=true;doom.tDark=now;const ov=document.getElementById('doomFade');if(ov)ov.style.opacity='1';
    log(doom.kind==='war'?'The last fires burn out under a black sky. Nothing moves on the face of the world.':'The ships rise and are gone. The world below is silent.','doom')}
  if(doom.dark){if(now-doom.tDark>4200)rebirth();return}
  if(doom.kind==='war'){if(now<doom.next)return;doom.next=now+Math.max(900,2600-el*25);
    const [B,c]=left[(rng()*left.length)|0];const foes=[...B.wars].map(id=>nations[id]).filter(m=>m&&m.alive);const A=foes.length?foes[(rng()*foes.length)|0]:nations.find(m=>m.alive&&m!==B)||B;
    if(typeof nuke==='function'&&A!==B){A.nukes=Math.max(1,A.nukes||0);nuke(A,B,c,false)}else burnTown(B,c,'Fire took')}
  else{const dt=1/30;for(const s of SAUCERS){s.g.rotation.y+=dt*s.spin;s.t+=dt;
      if(!s.tgt||!s.tgt[0].cities.includes(s.tgt[1])){const L=allCities();if(!L.length){s.beam.visible=false;s.g.position.y+=dt*3;continue}
        let best=null,bd=1e9;for(const p of L){if(SAUCERS.some(o=>o!==s&&o.tgt&&o.tgt[1]===p[1]))continue;const d=Math.hypot(wx(p[1].x)-s.g.position.x,wz(p[1].y)-s.g.position.z);if(d<bd){bd=d;best=p}}
        s.tgt=best||L[(rng()*L.length)|0];s.phase='fly';s.beam.visible=false}
      const [n,c]=s.tgt,tx=wx(c.x),tz=wz(c.y),gy=groundY(tx,tz),hy=gy+2.2,dx=tx-s.g.position.x,dz=tz-s.g.position.z,d=Math.hypot(dx,dz);
      if(s.phase==='fly'){const sp=Math.min(d,dt*3.2);s.g.position.x+=dx/(d||1)*sp;s.g.position.z+=dz/(d||1)*sp;s.g.position.y+=(hy-s.g.position.y)*Math.min(1,dt*1.5);if(d<.05){s.phase='burn';s.t=0}}
      else{s.beam.visible=true;s.beam.scale.set(1,(s.g.position.y-gy)/s.g.scale.y,1);s.beam.position.y=-(s.g.position.y-gy)/s.g.scale.y/2;SAUCER_M.beam.opacity=.2+.12*Math.sin(now/90);
        if(rng()<.5)emit('fire',tx+(rng()-.5)*.4,gy+.03,tz+(rng()-.5)*.4);if(s.t>3.6){burnTown(n,c,'A pale beam burned');s.tgt=null;s.beam.visible=false;if(typeof sfx==='function')sfx('thunder',{near:.5})}}}}}
setInterval(doomStep,1000/30);

/* a new world: the old one is remembered as a past age, and the god starts with more belief */
function rebirth(){const cyc=(worldOpts.cycle||1)+1;
  for(const s of SAUCERS)scene.remove(s.g);SAUCERS.length=0;doom=null;
  const t=climate.temp;genWorld();climate.temp=.5;worldOpts.cycle=cyc;belief=100+Math.min(150,(cyc-1)*40);terrainDirty=true;
  if(typeof startPlaying==='function')startPlaying(true);
  log(`A new world rises from the dark waters. This is world ${cyc} you have watched over.`,'era');
  const ov=document.getElementById('doomFade');if(ov){ov.style.opacity='0';setTimeout(()=>ov.remove(),3800)}
  if(typeof updateHUD==='function')updateHUD();say(`A new world is born. Your followers remember you: you begin with ${belief} belief.`)}

if(typeof renderCards==='function')try{renderCards()}catch(e){}
