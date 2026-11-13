"use strict";
/* Faithbound — towns that work and live. From the Bronze Age to the Industrial age each town has its trades at the doors of its houses:
   a smithy with an anvil and a glowing forge, a baker's oven, a carpenter's sawhorse, a potter's table, a dyer's racks of coloured cloth
   and later a cooper's barrels; a well on the square and, where a river or brook runs by, a washing place on the bank.
   The townspeople take up the work: smiths hammer and the sparks fly, carpenters saw, bakers knead while the oven smokes, stall keepers
   call out at the market and shoppers come and go with baskets, people fetch water and carry the buckets home, porters haul sacks
   from the workshops to the market, children run about, chickens peck in the yards and dogs wander the streets. At night they go home.
   Only towns near the camera are worked out and drawn. */

const TRADES=[
  {k:'smith',act:'hammer',from:1,col:0x3a3a3e},{k:'baker',act:'knead',from:1},{k:'carpenter',act:'saw',from:1},{k:'potter',act:'pot',from:1},
  {k:'dyer',act:'hang',from:2},{k:'smith',act:'hammer',from:2},{k:'cooper',act:'hammer',from:3},{k:'baker',act:'knead',from:3},{k:'carpenter',act:'saw',from:2}];
const DYE=[0xc83a3a,0x3a5ac8,0xe8c040,0x5a9a4a,0x8a4ab0,0xe88a3a];
/* where a town works: worked out once per layout, from its doors, its square and the water near it */
function townWork(c,n){const e=n.era,key=(c._doors?c._doors.length:0)+'|'+e+'|'+(c._poi?c._poi.r:0);if(c._tw&&c._tw.key===key)return c._tw;
  const T={key,jobs:[],well:null,wash:[],stalls:[],homes:[]};c._tw=T;if(!c._doors||!c._doors.length||e<1||e>5)return T;
  const P_=c._poi,cx=P_.plaza[0],cz=P_.plaza[1],pr=P_.r,used=[];const okAt=(x,z)=>!inBuilding(x,z)&&groundY(x,z)>waterY+.015&&!riverNear(x,z,.02);
  /* workshops at the doors of some houses, spread round the town */
  const doors=c._doors.slice().sort((a,b)=>hash(a[0]*13.1+a[1]*7.7)-hash(b[0]*13.1+b[1]*7.7)),want=clamp(Math.round(doors.length/7),1,9);let ti=0;
  for(const d of doors){if(T.jobs.length>=want)break;const [fx,fz,hx,hz]=d;if(Math.hypot(fx-cx,fz-cz)<pr+.05||used.some(u=>Math.hypot(u[0]-fx,u[1]-fz)<.14))continue;
    let ox=fx-hx,oz=fz-hz;const ol=Math.hypot(ox,oz)||1;ox/=ol;oz/=ol;const ax=-oz,az=ox;
    const px=fx+ox*.03+ax*.035,pz=fz+oz*.03+az*.035,wx_=fx+ox*.035-ax*.012,wz_=fz+oz*.035-az*.012;if(!okAt(px,pz)||!okAt(wx_,wz_))continue;
    let tr=null;for(let q=0;q<TRADES.length;q++){const t=TRADES[(ti+q)%TRADES.length];if(t.from<=e){tr=t;ti=(ti+q+1)%TRADES.length;break}}if(!tr)break;
    used.push([fx,fz]);T.jobs.push({k:tr.k,act:tr.act,px,pz,x:wx_,z:wz_,face:Math.atan2(px-wx_,pz-wz_),ax,az,ox,oz,w:null,seed:(hash(fx*31+fz*17)*1e6)|0})}
  /* the stalls of the market, with a keeper each */
  for(const s of c._stalls||[]){const vx=s.x-Math.cos(s.a)*.028,vz=s.z-Math.sin(s.a)*.028;T.stalls.push({x:vx,z:vz,face:Math.atan2(s.x-vx,s.z-vz),fx:s.x+Math.cos(s.a)*.035,fz:s.z+Math.sin(s.a)*.035,w:null})}
  /* a well on the square, away from the stalls */
  for(let q=0;q<8;q++){const a=q*.785+hash(c.x*3+c.y)*.6,x=cx+Math.cos(a)*pr*.42,z=cz+Math.sin(a)*pr*.42;if((c._stalls||[]).some(s=>Math.hypot(s.x-x,s.z-z)<.06)||!okAt(x,z))continue;T.well={x,z};break}
  /* a washing place on a bank near the town */
  if(typeof riverSegs==='function'){const R=riverSegs(),reach=(c._townR||.45)+.35;let best=null,bd=1e9;
    for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const L=R.get((c.y+dy)*W+c.x+dx);if(!L)continue;for(const g of L){const mx=(g[0]+g[2])/2,mz=(g[1]+g[3])/2,dd=Math.hypot(mx-cx,mz-cz);if(dd>reach||dd>bd)continue;
      let nx=-(g[3]-g[1]),nz=g[2]-g[0];const nl=Math.hypot(nx,nz)||1;nx/=nl;nz/=nl;if((cx-mx)*nx+(cz-mz)*nz<0){nx=-nx;nz=-nz}const bx=mx+nx*(g[4]+.025),bz=mz+nz*(g[4]+.025);if(!okAt(bx,bz))continue;bd=dd;best={x:bx,z:bz,face:Math.atan2(-nx,-nz),nx,nz}}}
    if(best){T.wash.push(best,{x:best.x+best.nz*.03,z:best.z-best.nx*.03,face:best.face,nx:best.nx,nz:best.nz})}}
  T.homes=c._doors.map(d=>[d[0],d[1]]);return T}
const alive=w=>w&&walkers.includes(w);
/* the working day: where a townsperson goes next. Returns true when it has set the goal */
function townGoal(w,n,c,night,sn){if(night||n.era<1||n.era>5||!c||!c._doors)return false;const T=townWork(c,n);if(!T.homes.length)return false;
  const pick=a=>a[(rng()*a.length)|0],go=(x,z,act,t,face)=>{w.tx=x+(rng()-.5)*.004;w.tz=z+(rng()-.5)*.004;w.act=act;w.workT=t;w.face=face??null;return true};
  if(w.carry&&!w.homeTo){w.carry=null}
  /* a role, kept while they live in this town */
  if(w.roleC!==c){w.roleC=c;w.role=null;w.job=null;w.carry=null}
  if(!w.role){if(w.kid)w.role='kid';else{const j=T.jobs.find(j=>!alive(j.w))||null,s=!j&&T.stalls.find(s=>!alive(s.w))||null;
      if(j&&rng()<.85){j.w=w;w.role='work';w.job=j}else if(s&&rng()<.85){s.w=w;w.role='sell';w.job=s}
      else{const r=rng();w.role=r<.25&&T.well?'water':r<.55?'shop':r<.7&&T.jobs.length?'porter':r<.8&&T.wash.length?'washer':'idle'}}}
  if(w.role==='kid'){/* children play: short dashes round a spot on the square or a doorstep, now and then home */
    if(!w.play||rng()<.08)w.play=rng()<.5?[c._poi.plaza[0]+(rng()-.5)*c._poi.r,c._poi.plaza[1]+(rng()-.5)*c._poi.r]:pick(T.homes);
    const a=rng()*6.283,r=.02+rng()*.05;return go(w.play[0]+Math.cos(a)*r,w.play[1]+Math.sin(a)*r,'play',.05+rng()*.3)}
  if(w.role==='work'&&w.job){const j=w.job;if(rng()<.12)return false;/* a break now and then */return go(j.x,j.z,j.act,10+rng()*16,j.face)}
  if(w.role==='sell'&&w.job){const s=w.job;if(rng()<.1)return false;return go(s.x,s.z,'sell',12+rng()*18,s.face)}
  if(w.role==='water'&&T.well){/* to the well, then home with the bucket */
    if(w.carry==='bucket'){const h=w.homeTo||pick(T.homes);w.homeTo=null;w.carry=null;return go(h[0],h[1],'idle',1+rng()*3)}
    const wl=T.well,a=rng()*6.283;w.carry='bucket';w.homeTo=pick(T.homes);return go(wl.x+Math.cos(a)*.03,wl.z+Math.sin(a)*.03,'draw',3+rng()*3,Math.atan2(-Math.cos(a),-Math.sin(a)))}
  if(w.role==='washer'&&T.wash.length){if(rng()<.3)return false;const b=pick(T.wash);return go(b.x,b.z,'wash',8+rng()*12,b.face)}
  if(w.role==='shop'&&T.stalls.length){/* to a stall, then home with the basket */
    if(w.carry==='basket'){const h=w.homeTo||pick(T.homes);w.homeTo=null;w.carry=null;return go(h[0],h[1],'idle',2+rng()*4)}
    if(rng()<.35)return false;const s=pick(T.stalls);w.carry='basket';w.homeTo=pick(T.homes);return go(s.fx,s.fz,'chat',2+rng()*4,Math.atan2(s.x-s.fx,s.z-s.fz))}
  if(w.role==='porter'&&T.jobs.length){/* from a workshop to the market with a sack, and back */
    if(w.carry==='sack'){w.carry=null;const s=T.stalls.length?pick(T.stalls):null;if(s)return go(s.fx,s.fz,'chat',1+rng()*2);return false}
    const j=pick(T.jobs);w.carry='sack';return go(j.x+j.ox*.02,j.z+j.oz*.02,'idle',1+rng()*2)}
  return false}

/* ---------- drawing: the workshops, the well, the wash and what people carry ---------- */
const nearTowns=R=>{const out=[];for(const n of nations){if(!n.alive||n.era<1||n.era>5)continue;for(const c of n.cities){const ex=wx(c.x)-camT.x,ez=wz(c.y)-camT.z;if(ex*ex+ez*ez<R)out.push([n,c])}}return out};
function workFrame(R2){if(camDist>=12||settings.people===false)return;const now=performance.now()/1000,day=typeof nightF==='undefined'||nightF<.55;
  for(const [n,c] of nearTowns((camDist*1.3+2)**2)){const T=townWork(c,n);
    for(const j of T.jobs){const ex=j.px-camT.x,ez=j.pz-camT.z;if(ex*ex+ez*ez>R2)continue;const g=groundY(j.px,j.pz),rot=Math.atan2(j.oz,j.ax),at=alive(j.w)&&j.w.act===j.act&&j.w.wait>0&&!j.w.moving;
      const P=(a,o)=>[j.px+j.ax*a+j.ox*o,j.pz+j.az*a+j.oz*o];
      if(j.k==='smith'){/* the anvil on its block, and the forge glowing beside it */
        add('gwCyl',j.px,g,j.pz,.012,.012,.012,0,0x5a4430);add('gwBox',j.px,g+.012,j.pz,.018,.007,.009,rot,0x3a3a40);
        const [fx,fz]=P(.032,.004),fg=groundY(fx,fz);add('gwBox',fx,fg,fz,.026,.02,.022,rot,0x7a7268);add('gwBox',fx,fg+.02,fz,.018,.003,.015,rot,day?0xe86a2a:0xffa040);
        if(at&&rng()<.5){const k=Math.abs(Math.sin(now*4));if(k>.95){emit('fire',j.px,g+.02,j.pz,(rng()-.5)*.3,(rng()-.5)*.3)}}if(rng()<.04)emit('smoke',fx,fg+.03,fz)}
      else if(j.k==='baker'){/* a domed bread oven, the table and its loaves */
        const [ox,oz]=P(.028,.006),og=groundY(ox,oz);add('colBall',ox,og-.004,oz,.04,.032,.04,0,0xb8a088);add('gwBox',ox+j.ox*.02,og,oz+j.oz*.02,.012,.012,.004,rot,0x2a1e18);
        add('gwBox',j.px,g,j.pz,.03,.016,.016,rot,0x8a6a44);for(let q=0;q<3;q++){const [lx,lz]=P((q-1)*.009,0);add('colBall',lx,g+.016,lz,.008,.005,.006,rot,0xc89050)}
        if(day&&rng()<.06)emit('smoke',ox,og+.03,oz)}
      else if(j.k==='carpenter'){/* a sawhorse with a log on it, and planks */
        for(const s of [-1,1]){const [lx,lz]=P(s*.012,0);add('gwBox',lx,g,lz,.004,.014,.012,rot,0x6a4a2e)}add('gwBox',j.px,g+.014,j.pz,.04,.008,.008,rot,0x9a7a52);
        const [bx,bz]=P(.03,-.004);for(let q=0;q<3;q++)add('gwBox',bx,g+q*.003,bz,.035,.003,.012,rot+.1*q,0xc8a878);
        if(at&&rng()<.15)emit('dust',j.px,g+.012,j.pz)}
      else if(j.k==='potter'){/* a table of pots */add('gwBox',j.px,g,j.pz,.03,.014,.016,rot,0x7a5a3a);
        for(let q=0;q<4;q++){const [lx,lz]=P((q-1.5)*.007,(q%2)*.004);add('colBall',lx,g+.014,lz,.007,.01,.007,0,[0xb86a40,0xa85a34,0xc8804a][q%3])}}
      else if(j.k==='dyer'){/* drying racks with lengths of coloured cloth */
        for(const s of [-1,1]){const [lx,lz]=P(s*.022,0);add('gwBox',lx,g,lz,.003,.04,.003,rot,0x6a4a2e)}add('gwBox',j.px,g+.038,j.pz,.048,.002,.002,rot,0x6a4a2e);
        for(let q=0;q<3;q++){const [lx,lz]=P((q-1)*.014,0);add('gwBox',lx,g+.022,lz,.011,.03,.002,rot,DYE[(j.seed+q)%DYE.length])}}
      else if(j.k==='cooper'){/* barrels, finished and half made */for(let q=0;q<3;q++){const [lx,lz]=P((q-1)*.014,q===1?.008:0);add('gwCyl',lx,g,lz,.011,.018,.011,0,q===2?0x9a7a52:0x7a5434)}}}
    if(T.well){const wl=T.well,g=groundY(wl.x,wl.z),ex=wl.x-camT.x,ez=wl.z-camT.z;if(ex*ex+ez*ez<R2){
        add('gwCyl',wl.x,g,wl.z,.03,.018,.03,0,0x8a8278);add('gwCyl',wl.x,g+.017,wl.z,.022,.002,.022,0,0x2a3a4a);for(const s of [-1,1])add('gwBox',wl.x+s*.026,g,wl.z,.004,.05,.004,0,0x5a4430);
        add('gwBox',wl.x,g+.05,wl.z,.058,.004,.004,0,0x5a4430);add('gwCone',wl.x,g+.052,wl.z,.07,.025,.045,0,0x7a4a34)}}
    for(const b of T.wash){const ex=b.x-camT.x,ez=b.z-camT.z;if(ex*ex+ez*ez>R2)continue;const g=groundY(b.x,b.z);add('gwBox',b.x-b.nx*.012,g+.002,b.z-b.nz*.012,.02,.003,.014,b.face,0x9a8a7a);
      add('colBall',b.x+b.nz*.018,g,b.z-b.nx*.018,.022,.012,.016,0,0x8a6a44);add('gwBox',b.x+b.nz*.018,g+.011,b.z-b.nx*.018,.016,.004,.012,0,[0xf0ece4,0x8aa0c8,0xd86a5a][(c.x+c.y)%3])}
    /* chickens in the yards, a dog or two in the street */
    if(day&&camDist<9){const doors=T.homes,nc=Math.min(14,(doors.length/3)|0);for(let q=0;q<nc;q++){const d=doors[(q*7)%doors.length],k=hash(q*13+c.x*3+c.y*7);
        const a=now*.15*(k-.5)+k*20,r=.025+k*.02,x=d[0]+Math.cos(a)*r,z=d[1]+Math.sin(a)*r;if(inBuilding(x,z))continue;const g=groundY(x,z),ex=x-camT.x,ez=z-camT.z;if(ex*ex+ez*ez>R2)continue;
        const peck=Math.max(0,Math.sin(now*3+k*40))**6,col=k<.4?0xf4f0e8:k<.75?0xa86a3a:0x3a2a20,hd=a+1.57*(k<.5?1:-1),hx=Math.sin(hd)*.006,hz=Math.cos(hd)*.006;
        add('colBall',x,g+.002,z,.011,.009,.011,0,col);add('colBall',x+hx,g+.009-peck*.007,z+hz,.006,.006,.006,0,col);add('gwBox',x+hx*1.4,g+.013-peck*.007,z+hz*1.4,.002,.003,.002,0,0xc83a2a)}
      for(let q=0;q<Math.min(2,(doors.length/12)|0);q++){const A=doors[(q*11+3)%doors.length],B=doors[(q*17+9)%doors.length],ph=(Math.sin(now*.12+q*2)+1)/2,x=lerp(A[0],B[0],ph),z=lerp(A[1],B[1],ph);if(inBuilding(x,z))continue;
        const g=groundY(x,z),hd=Math.atan2(B[0]-A[0],B[1]-A[1])*(Math.cos(now*.12+q*2)>0?1:-1),R=-hd+1.5708,fx=Math.sin(hd)*.012,fz=Math.cos(hd)*.012,col=[0x8a6a3a,0x2a2420,0xd8c8a8][q%3];
        add('gwBox',x,g+.008,z,.024,.009,.009,R,col);add('gwBox',x+fx,g+.014,z+fz,.009,.008,.008,R,col);for(const s of [-1,1])for(const f of [-.008,.008])add('gwBox',x+Math.sin(hd)*f+Math.cos(hd)*.003*s,g,z+Math.cos(hd)*f-Math.sin(hd)*.003*s,.002,.008,.002,R,col)}}}}
/* what people carry: a bucket, a basket, a sack */
function carryFolk(R2){if(camDist>=12)return;for(const w of walkers){if(!w.carry||!w.moving&&w.act!=='draw')continue;const ex=w.x-camT.x,ez=w.z-camT.z;if(ex*ex+ez*ez>R2)continue;
    const g=groundY(w.x,w.z),rx=Math.cos(w.dir),rz=-Math.sin(w.dir),sc=w.kid?.7:1;
    if(w.carry==='bucket')addR('pPack',w.x+rx*.007*sc,g+.007*sc,w.z+rz*.007*sc,.006,.007,.006,w.dir,0,0,0x7a6a5a);
    else if(w.carry==='basket')addR('pPack',w.x-rx*.007*sc,g+.012*sc,w.z-rz*.007*sc,.009,.006,.007,w.dir,0,0,0xb89a5a);
    else if(w.carry==='sack')addR('pPack',w.x,g+.028*sc,w.z,.011,.008,.009,w.dir,.3,0,0xc8b088)}}
{const _bf=banditFrame;banditFrame=function(R2){_bf.apply(this,arguments);try{workFrame(R2)}catch(e){console.warn('townlife',e)}}}
{const _da=drawArmyFolk;drawArmyFolk=function(R2){_da.apply(this,arguments);try{carryFolk(R2)}catch(e){console.warn('townlife carry',e)}}}
