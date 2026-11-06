"use strict";
/* Faithbound — armies you can see. Troops march from their towns to the front, camp round a besieged town with their
   siege engines and bombard it, and meet the enemy in the field. They follow the real war: sieges, fronts and peace. */

kit('soldier',unitBox(),MAT.plain,7000,false);kit('pike',unitCyl(5),MAT.plain,7000,false);kit('tent',unitCone(6),MAT.plain,1600,false);
kit('engine',unitBox(),MAT.plain,2000,false);kit('barrel',unitCyl(8),MAT.plain,1600,false);
const ARMY_KITS=['soldier','pike','tent','engine','barrel'];
let armies=[],armyT=0,armyDrawn=false;

/* where a nation wants its troops: round an enemy town it besieges, or on the front line */
function armyGoal(A,B){
  const sc=B.cities.find(c=>c.siege>.02&&c.besiegedBy===A.id);if(sc)return {x:wx(sc.x),z:wz(sc.y),c:sc};
  const f=(A.front||[]).filter(i=>owner[i]===A.id);if(!f.length)return null;const i=f[(rng()*f.length)|0];return {x:wx(i%W),z:wz((i/W)|0),c:null}}
function landLine(x0,z0,x1,z1){for(let k=1;k<10;k++){const t=k/10,i=tileAt(lerp(x0,x1,t),lerp(z0,z1,t));if(i<0||isWater(i))return false}return true}
function spawnArmy(A,B){const g=armyGoal(A,B);if(!g)return;let home=null,bd=1e9;for(const c of A.cities){const d=Math.hypot(wx(c.x)-g.x,wz(c.y)-g.z);if(d<bd){bd=d;home=c}}
  if(!home||bd>18)return;let x=wx(home.x),z=wz(home.y);if(!landLine(x,z,g.x,g.z)){x=g.x+(rng()-.5)*.6;z=g.z+(rng()-.5)*.6}
  armies.push({n:A.id,foe:B.id,x,z,tx:g.x,tz:g.z,c:g.c,mode:'march',str:1,t:0,ph:rng()*6.28,face:Math.atan2(g.z-z,g.x-x)})}

function updateArmies(dt,k,now){
  const s=dt*(k>0?Math.min(2.4,.7+k*.3):0);
  armyT-=s;if(k>0&&armyT<=0){armyT=1.1;
    for(const A of nations){if(!A.alive||!A.wars.size)continue;for(const b of A.wars){const B=nations[b];if(!B||!B.alive)continue;
      const mine=armies.filter(a=>a.n===A.id&&a.foe===B.id).length;if(mine<(A.era>=5?3:2)&&armies.length<20&&rng()<.5)spawnArmy(A,B)}}}
  for(let q=armies.length-1;q>=0;q--){const a=armies[q],A=nations[a.n],B=nations[a.foe];a.t+=s;
    const atWar=A&&A.alive&&B&&B.alive&&A.wars.has(B.id);
    if(!atWar&&a.mode!=='home'){a.mode='home';const c=A&&A.cities[0];if(c){a.tx=wx(c.x);a.tz=wz(c.y)}else a.str=0}
    if(a.str<=0){armies.splice(q,1);continue}
    /* a siege ends when the town falls or is relieved */
    if(a.c&&(!B||!B.cities.includes(a.c)||a.c.siege<=0)){a.c=null;if(a.mode==='siege'){const g=atWar&&armyGoal(A,B);if(g){a.tx=g.x;a.tz=g.z;a.c=g.c;a.mode='march'}else a.mode='home'}}
    const d=Math.hypot(a.tx-a.x,a.tz-a.z);
    if(a.mode==='march'||a.mode==='home'){if(d>.06){const st=Math.min(d,s*.32);a.x+=(a.tx-a.x)/d*st;a.z+=(a.tz-a.z)/d*st;a.face=Math.atan2(a.tz-a.z,a.tx-a.x)}
      else if(a.mode==='home'){a.str-=s*.5}else a.mode=a.c?'siege':'field'}
    if(a.mode==='field'&&rng()<s*.05){const g=armyGoal(A,B);if(g){a.tx=g.x;a.tz=g.z;a.c=g.c;a.mode='march'}}
    /* battle: enemy armies that meet in the field fight until one breaks */
    if(a.mode!=='home'&&k>0)for(const o of armies){if(o===a||o.n!==a.foe||o.mode==='home')continue;const dd=Math.hypot(o.x-a.x,o.z-a.z);if(dd>.7)continue;
      a.face=Math.atan2(o.z-a.z,o.x-a.x);if(dd>.22){a.x+=(o.x-a.x)/dd*s*.1;a.z+=(o.z-a.z)/dd*s*.1}
      const ma=mil(A)*a.str,mb=mil(nations[o.n])*o.str;a.str-=s*.06*mb/(ma+mb+1e-6)*(.5+rng());
      if(rng()<s*6){const mx=(a.x+o.x)/2+(rng()-.5)*.2,mz=(a.z+o.z)/2+(rng()-.5)*.2,y=groundY(mx,mz);emit(A.era>=4?'smoke':'dust',mx,y+.03,mz);if(A.era>=4)emit('flash',mx,y+.04,mz)}
      if(a.str<=.25){a.mode='home';const c=A.cities[0];if(c){a.tx=wx(c.x);a.tz=wz(c.y)}}break}
    /* bombard the besieged town */
    if(a.mode==='siege'&&a.c&&k>0&&rng()<s*(A.era>=5?2.5:1.2)){const c=a.c,r=rng()*.35,an=rng()*6.28,x=wx(c.x)+Math.cos(an)*r,z=wz(c.y)+Math.sin(an)*r,y=groundY(x,z);
      emit('fire',x,y+.03,z);emit(A.era>=5?'dark':'smoke',x,y+.06,z);if(A.era>=4){const ex=a.x+(rng()-.5)*.3,ez=a.z+(rng()-.5)*.3;emit('flash',ex,groundY(ex,ez)+.05,ez)}
      if(Math.hypot(x-camT.x,z-camT.z)<camDist*.6&&typeof sfx==='function'&&A.era>=4)sfx('cannon')}}
  drawArmies(now)}

/* ---------- drawing ---------- */
const ARMY_LOOK=[/* tunic, metal, weapon length */
  {cloth:0x8a6a48,tool:0x6a5a48,len:.05},{cloth:0x9a7a50,tool:0xb08040,len:.055},{cloth:0xa04030,tool:0x9a9a9a,len:.06},
  {cloth:0xb8b8c0,tool:0x8a8a90,len:.065},{cloth:0x2e4a8a,tool:0x3a3a3a,len:.04},{cloth:0x6a6a4a,tool:0x2a2a2a,len:.035},{cloth:0x5a6448,tool:0x2a2a2a,len:.03},{cloth:0xe8ecef,tool:0x9ff4ff,len:.03}];
function drawArmies(now){
  if(!armies.length){if(armyDrawn){kitReset(ARMY_KITS);armyCommitNow();armyDrawn=false}return}
  kitReset(ARMY_KITS);armyDrawn=true;const lim=camDist*2+8;
  for(const a of armies){if(Math.hypot(a.x-camT.x,a.z-camT.z)>lim)continue;const A=nations[a.n];if(!A)continue;const e=Math.min(7,A.era),L=ARMY_LOOK[e],nc=parseInt(A.color.slice(1),16);
    const fade=a.mode==='home'?Math.max(0,a.str*2-.0):1,men=Math.max(6,Math.round(48*Math.min(1,a.str)*fade)),walk=a.mode==='march'||a.mode==='home',f=a.face,c=Math.cos(f),sn=Math.sin(f);
    if(a.mode==='siege'&&a.c){/* camp: a ring of tents and the engines facing the walls */const cx=wx(a.c.x),cz=wz(a.c.y),ang0=Math.atan2(a.z-cz,a.x-cx);
      for(let t=0;t<7;t++){const an=ang0+(t-3)*.16,r=.95+(t%2)*.12,x=cx+Math.cos(an)*r,z=cz+Math.sin(an)*r,y=groundY(x,z);if(y<waterY+.02)continue;add('tent',x,y-.005,z,.05,.05,.05,an,t%3?0xe8dcc0:nc)}
      for(let t=0;t<3;t++){const an=ang0+(t-1)*.22,x=cx+Math.cos(an)*.75,z=cz+Math.sin(an)*.75,y=groundY(x,z),face=Math.atan2(cz-z,cx-x);if(y<waterY+.02)continue;siegeEngine(e,x,y,z,face,nc)}}
    /* the troops in blocks, with a banner at the front */
    const rows=e>=6?2:4,cols=Math.ceil(men/rows),sp=e>=6?.07:.046;
    if(e>=6){for(let i=0;i<Math.max(2,Math.round(men/9));i++){const u=(i%3-1)*.09,v=-Math.floor(i/3)*.1,x=a.x+c*v-sn*u,z=a.z+sn*v+c*u,y=groundY(x,z);if(y<waterY+.01)continue;tank(e,x,y,z,f,nc)}}
    a._men=men;a._walk=walk;a._rows=rows;a._cols=cols;a._sp=sp;
    if(!FOLKMODE())for(let i=0;i<men;i++){const u=((i%cols)-(cols-1)/2)*sp,v=-Math.floor(i/cols)*sp-(e>=6?.2:0),x=a.x+c*v-sn*u,z=a.z+sn*v+c*u,y=groundY(x,z);if(y<waterY+.01)continue;
      const bob=walk?Math.abs(Math.sin(now/140+i*.7+a.ph))*.009:0,col=i%3===0?L.cloth:nc;/* tunics in the nation's colour */
      add('soldier',x,y+bob-.002,z,.017,.04,.013,-f,col);add('soldier',x,y+bob+.038,z,.011,.011,.011,-f,e===3?0xb8bcc4:0xe0c0a0);
      if(i%2===0||e>=4)add('pike',x+sn*.009,y+bob,z-c*.009,.003,L.len*1.5,.003,0,L.tool,e>=4?.6:0)}
    {const bx=a.x+c*.04,bz=a.z+sn*.04,by=groundY(bx,bz);add('pike',bx,by,bz,.004,.17,.004,0,0x5a4a3a);add('soldier',bx+.022*c,by+.13,bz+.022*sn,.045,.032,.004,-f,nc)}}
  armyCommitNow()}
function armyCommitNow(){for(const n of ARMY_KITS){const K=KITS[n];K.mesh.count=K.k;K.mesh.instanceMatrix.needsUpdate=true;if(K.mesh.instanceColor)K.mesh.instanceColor.needsUpdate=true}}
/* parts placed in the frame of a vehicle facing angle f: lx forward, lz to the side; rx/rz turn a cylinder onto its axle or barrel */
const dummyA=new THREE.Object3D();dummyA.rotation.order='YZX';
function addA(name,x,y,z,sx,sy,sz,yaw,rz,hex,rx){const K=KITS[name];if(K.k>=K.max)return;dummyA.position.set(x,y,z);dummyA.rotation.set(rx||0,yaw,rz||0);dummyA.scale.set(sx,sy,sz);dummyA.updateMatrix();
  K.mesh.setMatrixAt(K.k,dummyA.matrix);K.mesh.setColorAt(K.k,tmpC.set(hex).convertSRGBToLinear());K.k++}
function vehicle(x,y,z,f){const c=Math.cos(f),s=Math.sin(f),yaw=-f;
  return {box:(lx,ly,lz,sx,sy,sz,hex,rz)=>addA('engine',x+lx*c-lz*s,y+ly,z+lx*s+lz*c,sx,sy,sz,yaw,rz||0,hex),
    wheel:(lx,ly,lz,r,w,hex)=>addA('barrel',x+lx*c-lz*s,y+ly,z+lx*s+lz*c,r,w,r,yaw,0,hex,Math.PI/2),
    tube:(lx,ly,lz,r,len,el,hex)=>{const ce=Math.cos(el),se=Math.sin(el);addA('barrel',x+(lx+ce*len/2)*c-lz*s,y+ly+se*len/2,z+(lx+ce*len/2)*s+lz*c,r,len,r,yaw,-(Math.PI/2-el),hex)},
    post:(lx,ly,lz,r,len,hex)=>addA('barrel',x+lx*c-lz*s,y+ly+len/2,z+lx*s+lz*c,r,len,r,yaw,0,hex)}}
function siegeEngine(e,x,y,z,f,nc){const V=vehicle(x,y,z,f),wood=0x7a5634,dark=0x4a3424;
  if(e<=2){/* catapult: a wheeled frame and a throwing arm */
    V.box(0,.012,0,.07,.008,.04,wood);for(const sd of [-1,1]){V.wheel(.024,.009,sd*.023,.009,.005,dark);V.wheel(-.024,.009,sd*.023,.009,.005,dark);V.box(0,.026,sd*.014,.012,.028,.005,wood)}
    V.tube(-.02,.03,0,.003,.07,.55,0x8a6a44);V.box(.004,.016,0,.012,.01,.024,0x5a4030)}
  else if(e===3){/* trebuchet: A-frame, long beam and a heavy counterweight */
    V.box(0,.004,0,.08,.008,.05,wood);for(const sd of [-1,1]){V.tube(-.02,.006,sd*.02,.0028,.075,1.2,wood);V.tube(.02,.006,sd*.02,.0028,.075,Math.PI-1.2,wood)}
    V.tube(-.06,.035,0,.0028,.14,-.45+Math.sin(performance.now()/900)*.15,0x8a6a44);V.box(.03,.04,0,.02,.022,.02,0x6a6a66)}
  else if(e<=5){/* field gun on a two-wheeled carriage */
    const steel=e===5?0x3a3c3a:0x2a2a28;for(const sd of [-1,1])V.wheel(0,.012,sd*.02,.012,.004,dark);
    V.box(-.03,.006,0,.06,.006,.012,0x5a4030,.12);V.tube(-.006,.014,0,.0045,.07,.18,steel);V.box(.006,.016,0,.014,.012,.03,e===5?0x4a4c40:0x5a4030)}
  else tank(e,x,y,z,f,nc)}
function tank(e,x,y,z,f,nc){if(e>=5&&e<=6&&typeof modelOn==='function'){const tn=['tank','tank2','tank3'][(Math.abs(Math.round(nc))%3)];if(modelOn(tn)){if(!ARMY_KITS.includes('m_'+tn))ARMY_KITS.push('m_'+tn);addM('m_'+tn,x,y,z,1,-f,null,null,null,null);return}}
  const V=vehicle(x,y,z,f);
  if(e>=7){/* hover tank: sleek white hull floating on a blue glow */const fy=.012+Math.sin(performance.now()/400+x*7)*.003;
    V.box(0,fy-.006,0,.06,.002,.03,0x9ff4ff);V.box(0,fy+.004,0,.072,.012,.036,0xe8ecef);V.box(.03,fy+.004,0,.016,.008,.032,0xd4dadf,-.35);
    V.box(-.004,fy+.016,0,.032,.01,.026,0xf2f4f6);for(const sd of [-1,1])V.tube(.008,fy+.017,sd*.006,.002,.05,.02,0x9ff4ff);V.box(-.004,fy+.022,0,.01,.002,.012,nc);return}
  const olive=0x55603f,dark=0x3a422e,track=0x262622;
  /* tracks with road wheels */
  for(const sd of [-1,1]){V.box(0,.009,sd*.022,.074,.016,.012,track);for(const lx of [-.027,-.009,.009,.027])V.wheel(lx,.008,sd*.0225,.0065,.0135,0x3a3a36);V.box(0,.018,sd*.022,.072,.003,.014,dark)}
  /* hull with a sloped front, turret, gun and a cupola */
  V.box(-.004,.021,0,.064,.012,.032,olive);V.box(.032,.02,0,.014,.008,.032,olive,-.5);V.box(-.036,.024,0,.008,.008,.03,dark);
  V.box(-.006,.033,0,.03,.012,.024,olive);V.box(.009,.033,0,.008,.011,.018,dark);
  V.tube(.012,.034,0,.0022,.056,.04,0x2e3226);V.box(.07,.0365,0,.008,.005,.005,0x2a2e24);
  V.post(-.012,.039,.006,.005,.004,dark);V.post(-.02,.039,-.008,.0007,.04,0x2a2a2a);
  V.box(-.006,.034,.0122,.016,.006,.0008,nc);V.box(-.006,.034,-.0122,.016,.006,.0008,nc)}

/* up close the troops are real people: helmets, tunics in their nation's colour, spears and shields or rifles */
const FOLKMODE=()=>camDist<16&&settings.people!==false;
function drawArmyFolk(R2){if(!FOLKMODE())return;const now=performance.now()/1000;let cnt=0;
  for(const a of armies){const ex=a.x-camT.x,ez=a.z-camT.z;if(ex*ex+ez*ez>R2)continue;const A=nations[a.n];if(!A||!a._men)continue;
    const e=Math.min(7,A.era),f=a.face,c=Math.cos(f),sn=Math.sin(f),dir=Math.atan2(c,sn),fighting=a.mode==='field'&&armies.some(o=>o.n===a.foe&&o.mode!=='home'&&Math.hypot(o.x-a.x,o.z-a.z)<.7);
    if(!a.folk||a.folk.era!==e){a.folk=[];a.folk.era=e}
    for(let i=0;i<a._men&&cnt<900;i++){let w=a.folk[i];if(!w){const r=mulberry32(i*977+a.n*31);w={nid:a.n,sol:true,skin:SKIN[(r()*SKIN.length)|0],hair:FHAIR[(r()*FHAIR.length)|0],long:false,ph:r()*6.3,t:r()*9};soldierKit(w,A);a.folk[i]=w}
      const u=((i%a._cols)-(a._cols-1)/2)*a._sp,v=-Math.floor(i/a._cols)*a._sp-(e>=6?.2:0),x=a.x+c*v-sn*u,z=a.z+sn*v+c*u;if(groundY(x,z)<waterY+.01)continue;
      w.x=x;w.z=z;w.dir=dir+(fighting?Math.sin(now*3+i)*.25:0);w.moving=a._walk;if(a._walk)w.ph=now*11+i*.9;w.t=now+i*.37;w.act=fighting?'chat':'idle';w.wait=1;
      drawFolk(w);cnt++}}}
/* a siege bar over every besieged town in view */
document.addEventListener('DOMContentLoaded',()=>{const _draw=drawOverlay;drawOverlay=function(now){_draw(now);if(!playing||typeof spaceView!=='undefined'&&spaceView)return;const dpr=ov.width/innerWidth;
  for(const n of nations){if(!n.alive)continue;for(const c of n.cities){if(!(c.siege>.04))continue;const x=wx(c.x),z=wz(c.y),[sx,sy,sz]=project(x,groundY(x,z)+.35,z);if(sz>1||sx<0||sy<0||sx>ov.width||sy>ov.height)continue;
    const by=nations[c.besiegedBy],w=64*dpr,h=7*dpr,p=Math.min(1,c.siege);octx.fillStyle='rgba(20,16,10,.75)';octx.fillRect(sx-w/2-2*dpr,sy-h-14*dpr,w+4*dpr,h+16*dpr);
    octx.fillStyle='rgba(255,255,255,.15)';octx.fillRect(sx-w/2,sy-h,w,h);octx.fillStyle=by?by.color:'#c0392b';octx.fillRect(sx-w/2,sy-h,w*p,h);
    octx.font=`600 ${Math.round(10*dpr)}px system-ui,sans-serif`;octx.textAlign='center';octx.fillStyle='#f3e6c4';octx.fillText(`Siege ${Math.round(p*100)}%`,sx,sy-h-3*dpr);octx.textAlign='left'}}}})
