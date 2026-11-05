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
    for(let i=0;i<men;i++){const u=((i%cols)-(cols-1)/2)*sp,v=-Math.floor(i/cols)*sp-(e>=6?.2:0),x=a.x+c*v-sn*u,z=a.z+sn*v+c*u,y=groundY(x,z);if(y<waterY+.01)continue;
      const bob=walk?Math.abs(Math.sin(now/140+i*.7+a.ph))*.009:0,col=i%3===0?L.cloth:nc;/* tunics in the nation's colour */
      add('soldier',x,y+bob-.002,z,.017,.04,.013,-f,col);add('soldier',x,y+bob+.038,z,.011,.011,.011,-f,e===3?0xb8bcc4:0xe0c0a0);
      if(i%2===0||e>=4)add('pike',x+sn*.009,y+bob,z-c*.009,.003,L.len*1.5,.003,0,L.tool,e>=4?.6:0)}
    {const bx=a.x+c*.04,bz=a.z+sn*.04,by=groundY(bx,bz);add('pike',bx,by,bz,.004,.17,.004,0,0x5a4a3a);add('soldier',bx+.022*c,by+.13,bz+.022*sn,.045,.032,.004,-f,nc)}}
  armyCommitNow()}
function armyCommitNow(){for(const n of ARMY_KITS){const K=KITS[n];K.mesh.count=K.k;K.mesh.instanceMatrix.needsUpdate=true;if(K.mesh.instanceColor)K.mesh.instanceColor.needsUpdate=true}}
function siegeEngine(e,x,y,z,f,nc){const c=Math.cos(f),s=Math.sin(f);
  if(e<=2){add('engine',x,y-.01,z,.08,.03,.04,-f,0x6a4a30);add('engine',x,y+.02,z,.09,.02,.05,-f,0x8a6a40);add('barrel',x+c*.05,y+.015,z+s*.05,.012,.06,.012,-f,0x5a3a20,Math.PI/2)}
  else if(e===3){add('engine',x,y-.01,z,.05,.02,.05,-f,0x6a4a30);add('engine',x,y,z,.012,.12,.05,-f,0x7a5a38);add('barrel',x-c*.03,y+.1,z-s*.03,.006,.14,.006,-f,0x5a3a20,-.9)}
  else if(e<=5){add('engine',x,y-.012,z,.035,.012,.03,-f,0x4a3a2a);add('barrel',x,y+.008,z,.01,.07,.01,-f,e===5?0x3a3a3a:0x1a1a1a,Math.PI/2-.25);for(const sd of [-1,1])add('barrel',x-s*.018*sd,y,z+c*.018*sd,.016,.004,.016,-f,0x5a4030,Math.PI/2)}
  else tank(e,x,y,z,f,nc)}
function tank(e,x,y,z,f,nc){const fut=e>=7,body=fut?0xe8ecef:0x5a6448;add('engine',x,y-.01,z,.06,.016,.036,-f,fut?0xd8dde2:0x3a3a30);add('engine',x,y+.006,z,.05,.014,.032,-f,body);
  add('engine',x,y+.02,z,.024,.012,.022,-f,body);add('barrel',x+Math.cos(f)*.03,y+.026,z+Math.sin(f)*.03,.0045,.05,.0045,-f+Math.PI/2,fut?0x9ff4ff:0x2a2a2a,Math.PI/2);add('engine',x,y+.032,z,.008,.004,.008,-f,nc)}

/* a siege bar over every besieged town in view */
document.addEventListener('DOMContentLoaded',()=>{const _draw=drawOverlay;drawOverlay=function(now){_draw(now);if(!playing||typeof spaceView!=='undefined'&&spaceView)return;const dpr=ov.width/innerWidth;
  for(const n of nations){if(!n.alive)continue;for(const c of n.cities){if(!(c.siege>.04))continue;const x=wx(c.x),z=wz(c.y),[sx,sy,sz]=project(x,groundY(x,z)+.35,z);if(sz>1||sx<0||sy<0||sx>ov.width||sy>ov.height)continue;
    const by=nations[c.besiegedBy],w=64*dpr,h=7*dpr,p=Math.min(1,c.siege);octx.fillStyle='rgba(20,16,10,.75)';octx.fillRect(sx-w/2-2*dpr,sy-h-14*dpr,w+4*dpr,h+16*dpr);
    octx.fillStyle='rgba(255,255,255,.15)';octx.fillRect(sx-w/2,sy-h,w,h);octx.fillStyle=by?by.color:'#c0392b';octx.fillRect(sx-w/2,sy-h,w*p,h);
    octx.font=`600 ${Math.round(10*dpr)}px system-ui,sans-serif`;octx.textAlign='center';octx.fillStyle='#f3e6c4';octx.fillText(`Siege ${Math.round(p*100)}%`,sx,sy-h-3*dpr);octx.textAlign='left'}}}})
