"use strict";
/* Faithbound — modern and future cities: skylines, airports and planes, spaceports and starships, hover traffic, terraforming */

/* ---------- kits ---------- */
const MAT_CONC=stdMat({color:0xffffff,roughness:.6}),MAT_WHITE=stdMat({color:0xffffff,roughness:.35,metalness:.1});
kit('sky',unitBox(),MAT.office,40000);kit('skyG',unitBox(),MAT.glass,40000);kit('gcyl',unitCyl(18),MAT.glass,24000);
kit('conc',unitBox(),MAT_CONC,45000);kit('concCyl',unitCyl(16),MAT_WHITE,16000);kit('glowB',unitBox(),MAT.glow,12000,false);
kit('gdome',(()=>{const g=new THREE.SphereGeometry(.5,18,10,0,Math.PI*2,0,Math.PI/2);return g})(),MAT.glass,5000);
kit('wcone',(()=>{const g=new THREE.ConeGeometry(.5,1,14);g.translate(0,.5,0);return g})(),MAT_WHITE,600);
kit('hover',unitBox(),MAT.glow,700,false);
BUILD_KITS.push('sky','skyG','gcyl','conc','concCyl','glowB','gdome','wcone');
const MOD_COL=[0xd8d4cc,0xc9d5df,0xe6e2da,0xb8c4cc,0xd6cbb8,0xaab8c2,0xe2dcd0];
let MCTX={lvl:1,cap:false,tall:[]};

/* stack a building out of storeys so window textures keep their scale */
function storeys(K,x,y,z,w,d,h,rot,col,seg){const n=MCTX.far?1:Math.max(1,Math.round(h/(seg||.28))),sh=h/n;for(let i=0;i<n;i++)add(K,x,y+i*sh,z,w,sh*1.001,d,rot,col)}
function towerHeight(core,hk){return Math.min(1.2,(.12+core*core*.9+hk*hk*.38)*(MCTX.cap?1.3:1)*(.6+MCTX.lvl*.065))}

/* modern age: glass and concrete towers downtown, apartment slabs, then villas with pools at the edge */
function modernBuilding(n,x,y,z,rot,hk,core,fw){const o=hash(hk*131+7),col=MOD_COL[(o*MOD_COL.length)|0],w=Math.min(fw,.14);
  if(core>.7||(core>.6&&hk>.85)){const H=towerHeight(core,hk),glass=o>.45,K=glass?'skyG':'sky',tint=glass?[0xdaf4ff,0xc8e6f2,0xb8d8e6,0xe6f0f0][(o*4)|0]:col;
    add('conc',x,y-.02,z,w*1.3,.06,w*1.15,rot,0x9a9fa4);
    const tiers=H>.7?3:H>.35?2:1,F=[[1],[.7,.3],[.56,.28,.16]][tiers-1],S=[1,.78,.58];let yy=y+.04;
    for(let t=0;t<tiers;t++){const th=H*F[t],ww=w*S[t];storeys(K,x,yy,z,ww,ww*.92,th,rot,tint,glass?.24:.3);yy+=th;add('conc',x,yy,z,ww*1.04,.01,ww*.96,rot,0x6f747a);yy+=.01}
    if(o<.33){add('cyl',x,yy,z,.006,H*.2,.006,0,0xd0d0d0);add('glowB',x,yy+H*.2,z,.008,.008,.008,0,0xff4030)}
    else if(o<.66){add('concCyl',x,yy,z,w*.42,.006,w*.42,0,0x55585c);add('glowB',x,yy+.006,z,w*.3,.002,.004,rot,0xffe070)}
    else{add('conc',x,yy,z,w*.4,.04,w*.3,rot,0x8a8f94);add('concCyl',x+w*.18,yy,z,.025,.05,.025,0,0x6a5a4a)}
    if(H>.5)MCTX.tall.push([x,z,H,y]);return}
  if(core>.48||(core>.4&&hk>.85)){const H=.1+hk*.16+core*.14;storeys('sky',x,y-.02,z,w,w*.8,H,rot,col,.3);add('conc',x,y-.02+H,z,w*1.02,.012,w*.82,rot,0x5f6368);
    add('conc',x+w*.15,y-.008+H,z,.03,.025,.03,rot,0x9a9fa4);add('concCyl',x-w*.2,y-.008+H,z,.022,.03,.022,0,0x7a6a5a);return}
  /* a villa: white walls, a flat roof, a glass front and a pool */
  P('conc',x,y-.02,z,rot,0,0,0,.08,.065,.06,0xf0eee8);P('conc',x,y-.02,z,rot,.02,.01,.065,.06,.04,.05,0xe8e4dc);P('conc',x,y+.045,z,rot,0,0,0,.09,.008,.07,0x4a4d52);
  P('skyG',x,y-.02,z,rot,0,.031,.012,.06,.035,.002,0xc8eaf6);if(o>.4)P('pool',x,y-.016,z,rot,0,.065,0,.05,.012,.03)}

/* future age: tapering glass spires, twisting towers, garden pods and domes */
function futureBuilding(n,x,y,z,rot,hk,core,fw){const o=hash(hk*173+3),w=Math.min(fw,.13);
  if(core>.7||(core>.6&&hk>.85)){const H=towerHeight(core,hk)*1.12;
    if(o<.4){const segs=Math.max(3,Math.round(H/.16)),sh=H/segs;let yy=y-.02;
      for(let i=0;i<segs;i++){const t=i/segs,r=w*(1-.45*t);add('gcyl',x,yy,z,r,sh*1.001,r,0,0xe8fbff);if(i%3===2){add('concCyl',x,yy+sh-.006,z,r*1.08,.012,r*1.08,0,0xf4f6f8)}
        if(i%4===1)add('ring',x,yy+sh*.5,z,r*1.35,1,r*1.35);yy+=sh}
      add('concCyl',x,yy,z,.008,H*.22,.008,0,0xf4f6f8);add('glowB',x,yy+H*.22,z,.01,.01,.01,0,0x9ff4ff)}
    else if(o<.75){const segs=Math.max(4,Math.round(H/.09)),sh=H/segs;let yy=y-.02;
      for(let i=0;i<segs;i++){add('skyG',x,yy,z,w*.85,sh*1.001,w*.85,rot+i*.085,0xe0f8ff);if(i%4===3)add('conc',x,yy+sh-.004,z,w*.9,.008,w*.9,rot+i*.085,0xf4f6f8);yy+=sh}
      add('glowB',x,yy,z,w*.5,.006,w*.5,rot+segs*.085,0x9ff4ff)}
    else{const segs=Math.max(3,Math.round(H/.14)),sh=H/segs;let yy=y-.02;
      for(let i=0;i<segs;i++){const r=w*(i%2?.7:1.05);add('concCyl',x,yy,z,r,sh*.35,r,0,0xf2f4f6);add('gcyl',x,yy+sh*.35,z,r*.82,sh*.65,r*.82,0,0xd8f4ff);
        for(let q=0;q<3;q++){const a=q*2.1+i;add('townTree',x+Math.cos(a)*r*.38,yy+sh*.35,z+Math.sin(a)*r*.38,.16,.16,.16,0,0x4f8a3a)}yy+=sh}
      add('gdome',x,yy,z,w*.9,w*.6,w*.9,0,0xe8fbff)}
    const prev=MCTX.tall[MCTX.tall.length-1];if(prev&&Math.hypot(prev[0]-x,prev[1]-z)<.38&&Math.hypot(prev[0]-x,prev[1]-z)>.08){/* a sky bridge between neighbours */
      const by=Math.min(H,prev[2])*.62+Math.min(y,prev[3]),mx=(x+prev[0])/2,mz=(z+prev[1])/2,L=Math.hypot(prev[0]-x,prev[1]-z),a=Math.atan2(prev[0]-x,prev[1]-z);
      add('skyG',mx,by,mz,.02,.014,L,a,0xe8fbff);add('glowB',mx,by-.002,mz,.022,.002,L,a,0x9ff4ff)}
    MCTX.tall.push([x,z,H,y]);return}
  if(core>.48||(core>.4&&hk>.85)){/* terraced apartments: white floors stepping back, glass between, gardens on the roofs */const H=.1+hk*.14,fl=Math.max(2,Math.round(H/.04));let yy=y-.02;
    for(let f=0;f<fl;f++){const s_=1-f*.06;P('conc',x,yy,z,rot,0,-f*.006,0,w*s_,.008,w*.85*s_,0xf4f5f6);P('skyG',x,yy+.008,z,rot,0,-f*.006,0,w*s_*.94,.032,w*.8*s_,0xd4f2ff);yy+=.04}
    P('conc',x,yy,z,rot,0,-fl*.006,0,w*.8,.006,w*.65,0xf4f5f6);P('townTree',x,yy,z,rot,w*.2,0,0,.18,.18,.18,0x4f8a3a);P('townTree',x,yy,z,rot,-w*.22,-.01,0,.15,.15,.15,0x5a9a40);
    P('glowB',x,y-.02,z,rot,0,w*.43,.008,w,.003,.003,0x9ff4ff);return}
  futureHome(x,y,z,rot,o)}
/* future homes: white villas with glass fronts, solar roofs, gardens and a glowing trim */
function futureHome(x,y,z,rot,o){const v=(o*5)|0;
  if(v===0){P('concCyl',x,y-.02,z,rot,0,0,0,.075,.03,.075,0xf2f4f6);P('gdome',x,y+.01,z,rot,0,0,0,.072,.05,.072,0xeefcff);P('glowB',x,y+.008,z,rot,0,0,0,.076,.002,.076,0x9ff4ff)}
  else if(v===1){P('conc',x,y-.02,z,rot,0,0,0,.085,.045,.06,0xf4f4f2);P('conc',x,y+.025,z,rot,.012,-.006,0,.06,.035,.045,0xeceeef);P('skyG',x,y-.02,z,rot,0,.0305,.006,.07,.03,.002,0xbfe9f8);
    P('skyG',x,y+.06,z,rot,.012,-.006,0,.05,.003,.035,0x2a3a50);P('glowB',x,y+.024,z,rot,0,.031,0,.086,.002,.002,0x9ff4ff)}
  else if(v===2){P('conc',x,y-.02,z,rot,0,0,0,.09,.035,.065,0xf2f2ee);P('gcyl',x,y+.015,z,rot,.02,0,0,.04,.03,.04,0xdaf6ff);P('skyG',x,y+.015,z,rot,-.018,0,0,.045,.003,.06,0x2a3a50);
    P('pool',x,y-.016,z,rot,0,.05,0,.045,.012,.025)}
  else if(v===3){P('conc',x,y-.02,z,rot,0,0,0,.07,.05,.07,0xf0f2f4);P('wcone',x,y+.03,z,rot,0,0,0,.075,.035,.075,0xe8ecef);P('skyG',x,y-.01,z,rot,0,.0355,0,.04,.03,.002,0xbfe9f8)}
  else{P('conc',x,y-.02,z,rot,0,0,0,.1,.03,.05,0xf6f6f4);P('conc',x,y+.01,z,rot,-.02,0,0,.05,.03,.05,0xeceeef);P('skyG',x,y+.04,z,rot,-.02,0,0,.05,.003,.05,0x2a3a50);P('glowB',x,y+.009,z,rot,.03,.026,0,.03,.002,.002,0xffd890)}
  P('townTree',x,y,z,rot,.05+o*.01,-.03,0,.2,.2,.2,0x4f8a3a);if(o>.5)P('townTree',x,y,z,rot,-.05,.04,0,.16,.16,.16,0x5a9a40)}

/* ---------- airports and spaceports, sited on flat open ground outside the capital ---------- */
let airports=[],spaceports=[];
function findPad(n,cx,cz,r0,L,Wd){for(let ring=0;ring<9;ring++)for(let q=0;q<20;q++){const a=q/20*6.283+ring*.2,d=r0+ring*.4,x=cx+Math.cos(a)*d,z=cz+Math.sin(a)*d,rot=a+Math.PI/2;
    const c=Math.cos(rot),s=Math.sin(rot);let mn=1e9,mx=-1e9,ok=true;
    for(let u=-1;u<=1;u+=.5)for(let v=-1;v<=1;v+=1){const px=x+u*L/2*c+v*Wd/2*s,pz=z-u*L/2*s+v*Wd/2*c,t=tileAt(px,pz);if(t<0||isWater(t)||biome[t]>=11||occupied.has(t)){ok=false;break}const gy=groundY(px,pz);if(gy<waterY+.03){ok=false;break}mn=Math.min(mn,gy);mx=Math.max(mx,gy)}
    if(ok&&mx-mn<.13)return {x,z,rot,y:mx,mn}}return null}
function airport(n,cx,cz,pr){const s=findPad(n,cx,cz,pr+.75,1,.45);if(!s)return;const {x,z,rot,y}=s,nc=parseInt(n.color.slice(1),16);
  add('conc',x,s.mn-.03,z,1.05,y-s.mn+.035,.5,rot,0x8a8c86);bareRect(x,z,rot,1.1,.55);
  P('conc',x,y,z,rot,0,-.12,0,1,.006,.08,0x34373b);for(let k=-4;k<=4;k++)P('conc',x,y,z,rot,k*.1,-.12,.006,.05,.002,.006,0xf2f2f2);
  P('conc',x,y,z,rot,0,0,0,.8,.004,.03,0x4a4d50);P('conc',x,y,z,rot,0,.1,0,.5,.005,.13,0x6a6d70);
  P('skyG',x,y,z,rot,0,.2,0,.42,.05,.07,0xd4f0fa);P('conc',x,y,z,rot,0,.2,.05,.45,.01,.09,0xe0e0dc);
  P('concCyl',x,y,z,rot,.3,.17,0,.022,.17,.022,0xe8e8e4);P('skyG',x,y,z,rot,.3,.17,.17,.045,.025,.045,0xbfe6f4);P('conc',x,y,z,rot,.3,.17,.195,.05,.006,.05,0x55585c);
  for(let k=0;k<3;k++){const dx=-.15+k*.15,dz=.1;P('conc',x,y,z,rot,dx,dz,.012,.012,.012,.1,0xf4f4f2);P('conc',x,y,z,rot,dx,dz-.005,.016,.11,.003,.022,0xe8e8e6);P('conc',x,y,z,rot,dx,dz-.045,.018,.004,.024,.018,nc)}
  for(const t of [tileAt(x,z)])if(t>=0)occupied.add(t);
  const c=Math.cos(rot),sn=Math.sin(rot);airports.push({x,y,z,rot,nid:n.id,ax:x-.45*c-.12*sn,az:z+.45*sn-.12*c,bx:x+.45*c-.12*sn,bz:z-.45*sn-.12*c})}
function spaceport(n,cx,cz,pr){const s=findPad(n,cx,cz,pr+1.25,.5,.5);if(!s)return;const {x,z,rot,y}=s;
  add('conc',x,s.mn-.03,z,.55,y-s.mn+.035,.55,rot,0x7a7c7e);bareRect(x,z,rot,.6,.6);
  add('concCyl',x,y,z,.26,.012,.26,0,0x5a5d60);add('ring',x,y+.014,z,.24,1,.24);
  P('conc',x,y,z,rot,.13,0,0,.035,.42,.035,0xd8d8d4);for(let k=1;k<5;k++)P('conc',x,y,z,rot,.09,0,k*.08,.06,.006,.012,0xd8d8d4);
  add('concCyl',x,y+.012,z,.05,.28,.05,0,0xf4f4f4);add('wcone',x,y+.29,z,.05,.1,.05,0,0xf4f4f4);
  for(let k=0;k<4;k++){const a=k*Math.PI/2;add('conc',x+Math.cos(a)*.03,y+.012,z+Math.sin(a)*.03,.03,.06,.004,-a,0x2a2c30)}
  add('skyG',x-.18*Math.cos(rot),y,z+.18*Math.sin(rot),.12,.07,.1,rot,0xd8f4ff);
  const t=tileAt(x,z);if(t>=0)occupied.add(t);spaceports.push({x,y,z,nid:n.id})}
function modernExtras(n,c,cx,cz,cap,e,pr){if(!cap)return;
  if(e>=6&&n.techs&&n.techs.includes('aviation'))airport(n,cx,cz,pr);
  if(e>=7&&n.techs&&n.techs.includes('starships'))spaceport(n,cx,cz,pr)}

/* ---------- planes, shuttles and starliners ---------- */
const FLY={white:stdMat({color:colL(0xf4f4f2),roughness:.4,metalness:.2}),dark:stdMat({color:colL(0x3a3d42),roughness:.5}),glass:stdMat({color:colL(0x6fb8d6),roughness:.1,metalness:.6}),
  glow:new THREE.MeshBasicMaterial({color:0x9ff4ff}),fire:new THREE.MeshBasicMaterial({color:0xffb050,transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false})};
const FLYGEO={fus:(()=>{const g=new THREE.CylinderGeometry(.5,.5,1,12);g.rotateZ(Math.PI/2);return g})(),nose:new THREE.SphereGeometry(.5,12,8),box:new THREE.BoxGeometry(1,1,1),
  cone:(()=>{const g=new THREE.ConeGeometry(.5,1,16);return g})(),cyl:new THREE.CylinderGeometry(.5,.5,1,14)};
const FLYMAT=new Map();const flyCol=hex=>{if(!FLYMAT.has(hex))FLYMAT.set(hex,stdMat({color:colL(parseInt(hex.slice(1),16))}));return FLYMAT.get(hex)};
function partM(g,geo,m,x,y,z,sx,sy,sz){const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;g.add(o);return o}
function makePlane(color,future){const g=new THREE.Group(),c=flyCol(color),M=future?FLY.white:FLY.white;
  partM(g,FLYGEO.fus,M,0,0,0,.15,.018,.018);partM(g,FLYGEO.nose,M,.075,0,0,.03,.018,.018);partM(g,FLYGEO.nose,FLY.glass,.078,.004,0,.016,.008,.012);
  partM(g,FLYGEO.box,M,.005,-.002,0,.035,.003,future?.11:.16);partM(g,FLYGEO.box,c,-.068,.014,0,.026,.026,.003);partM(g,FLYGEO.box,M,-.068,.004,0,.018,.003,.055);
  for(const s of [-1,1])partM(g,FLYGEO.fus,future?FLY.glow:FLY.dark,.012,-.01,s*.04,.03,.01,.01);
  partM(g,FLYGEO.box,c,0,.001,0,.12,.004,.0185);g.scale.setScalar(1.6);scene.add(g);return g}
function makeShuttle(big){const g=new THREE.Group();
  if(!big){partM(g,FLYGEO.cyl,FLY.white,0,.11,0,.06,.22,.06);partM(g,FLYGEO.cone,FLY.white,0,.26,0,.06,.08,.06);
    for(let k=0;k<4;k++){const f=partM(g,FLYGEO.box,FLY.dark,Math.cos(k*Math.PI/2)*.035,.03,Math.sin(k*Math.PI/2)*.035,.03,.06,.004);f.rotation.y=-k*Math.PI/2}
    partM(g,FLYGEO.cone,FLY.fire,0,-.04,0,.05,.09,.05).rotation.x=Math.PI}
  else{partM(g,FLYGEO.box,FLY.white,0,0,0,.5,.05,.12);partM(g,FLYGEO.cone,FLY.white,.3,0,0,.08,.14,.08).rotation.z=-Math.PI/2;partM(g,FLYGEO.box,FLY.dark,0,.035,0,.3,.02,.06);
    partM(g,FLYGEO.box,FLY.white,-.08,0,0,.18,.012,.36);for(const s of [-1,1])partM(g,FLYGEO.cyl,FLY.white,-.12,0,s*.16,.05,.16,.05).rotation.z=Math.PI/2;
    for(const s of [-1,0,1])partM(g,FLYGEO.box,FLY.glow,-.255,0,s*.04,.01,.03,.03);partM(g,FLYGEO.box,FLY.glow,.05,.026,0,.3,.003,.122)}
  scene.add(g);return g}
let flights=[],shuttles=[],flyT=0,shutT=0;
PK.trail={life:2.6,size:.035,grow:.07,vy:0,col:[.96,.97,1],a:.45};
function planeDest(a){const others=airports.filter(b=>b!==a);if(others.length)return others[(rng()*others.length)|0];
  const cs=[];for(const n of nations)if(n.alive)for(const c of n.cities)cs.push(c);const c=cs[(rng()*cs.length)|0];if(!c)return null;return {ax:wx(c.x),az:wz(c.y),bx:wx(c.x)+.1,bz:wz(c.y),y:groundY(wx(c.x),wz(c.y)),far:true}}
function updateFlights(dt,k){
  flyT-=dt*(k>0?1:0);if(k>0&&flyT<=0&&airports.length&&flights.length<12){flyT=2.5+rng()*3;const a=airports[(rng()*airports.length)|0],b=planeDest(a),n=nations[a.nid];
    if(b&&n&&n.alive){const fut=n.era>=7;const f={g:makePlane(n.color,fut),x0:a.ax,z0:a.az,y0:a.y+.02,x1:b.bx,z1:b.bz,y1:(b.y||a.y)+.02,land:!b.far,t:0,alt:1.1+rng()*.5};
      f.len=Math.hypot(f.x1-f.x0,f.z1-f.z0)+1;flights.push(f)}}
  for(let q=flights.length-1;q>=0;q--){const f=flights[q];f.t+=dt*(k>0?.55:0)/f.len;if(f.t>=1){disposeGroup(f.g);flights.splice(q,1);continue}
    const t=f.t,up=smooth(0,.18,t),down=f.land?smooth(1,.82,t):1,x=lerp(f.x0,f.x1,t),z=lerp(f.z0,f.z1,t),y=lerp(f.y0,f.y1,t)+f.alt*up*down;
    const g=f.g;g.position.set(x,y,z);g.rotation.order='YXZ';g.rotation.y=Math.atan2(-(f.z1-f.z0),f.x1-f.x0);g.rotation.z=(t<.18?.18:t>.82&&f.land?-.12:0);
    if(k>0&&y>f.y0+.5&&rng()<dt*14)emit('trail',x-Math.cos(g.rotation.y)*.12,y,z+Math.sin(g.rotation.y)*.12,0,0)}
  shutT-=dt*(k>0?1:0);if(k>0&&shutT<=0&&spaceports.length&&shuttles.length<5){shutT=9+rng()*10;const p=spaceports[(rng()*spaceports.length)|0];
    const big=rng()<.35;shuttles.push({g:makeShuttle(big),x:p.x,y:big?p.y+2.6:p.y+.03,z:p.z,vy:0,t:0,big,a:rng()*6.28,p})}
  for(let q=shuttles.length-1;q>=0;q--){const s=shuttles[q];s.t+=dt*(k>0?1:0);
    if(s.big){s.x+=Math.cos(s.a)*dt*.35;s.z-=Math.sin(s.a)*dt*.35;s.y+=dt*.04;s.g.rotation.y=s.a;if(rng()<dt*10)emit('glow',s.x-Math.cos(s.a)*.28,s.y,s.z+Math.sin(s.a)*.28,0,0)}
    else{s.vy+=dt*(.05+s.t*.12);s.y+=s.vy*dt*4;if(s.t>2.5){s.x+=Math.cos(s.a)*s.vy*dt*2;s.z+=Math.sin(s.a)*s.vy*dt*2;s.g.rotation.z=-Math.min(.9,(s.t-2.5)*.25);s.g.rotation.y=-s.a}
      if(rng()<dt*30)emit(s.t<3?'dark':'glow',s.x,s.y-.04,s.z);if(rng()<dt*30)emit('fire',s.x,s.y-.05,s.z)}
    s.g.position.set(s.x,s.y,s.z);if(s.t>(s.big?40:14)){disposeGroup(s.g);shuttles.splice(q,1)}}}
/* hover traffic weaving between the towers of future cities */
function updateHover(now){kitReset(['hover']);const t=now/1000;
  for(const n of nations){if(!n.alive||n.era<7)continue;for(const c of n.cities){const cx=wx(c.x),cz=wz(c.y);if(Math.hypot(cx-camT.x,cz-camT.z)>camDist*2.2+1)continue;
    const cy=groundY(cx,cz),cnt=c===n.cities[0]?26:12,R=c===n.cities[0]?.55:.3;
    for(let i=0;i<cnt;i++){const h1=hash(c.x*31+c.y*7+i),r=.1+h1*R,sp=(.25+hash(i*3.1)*.4)*(i%2?1:-1),a=t*sp/r*.3+h1*6.28,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;
      add('hover',x,cy+.15+hash(i*7.7)*.55,z,.022,.006,.01,-a+(sp>0?-Math.PI/2:Math.PI/2),i%3?0x9ff4ff:0xffd890)}}}
  kitCommit(['hover'])}
function updateModern(dt,k,now){updateFlights(dt,k);updateHover(now)}

/* ---------- terraforming: future nations reshape the wastes and the shallows to expand ---------- */
let warmD=null,tfDirty=0;
function terraformTick(n){if(!n.techs||!n.techs.includes('terraform')||rng()>.35||!n.cities.length)return;if(!warmD||warmD.length!==N)warmD=new Float32Array(N);
  for(let tries=0;tries<30;tries++){const c=n.cities[(rng()*n.cities.length)|0];const r=3+rng()*9,a=rng()*6.283,X=Math.round(c.x+Math.cos(a)*r),Y=Math.round(c.y+Math.sin(a)*r);if(X<1||Y<1||X>=W-1||Y>=H-1)continue;
    const j=Y*W+X;if(owner[j]>=0&&owner[j]!==n.id)continue;let touch=false;for(let d=0;d<4;d++){const k=(Y+DY[d])*W+X+DX[d];if(owner[k]===n.id)touch=true}if(!touch&&owner[j]!==n.id)continue;
    const b=biome[j];let what=null;
    if(b===1){h[j]=sea+.014;what='sea'}else if(b===0||b===2&&h[j]<sea)continue;
    else if(b===11||b===12){h[j]=Math.max(sea+.05,h[j]-.09);what='peak'}
    else if(b===9||b===10||b===2){warmD[j]=Math.min(.5,warmD[j]+.22);what='ice'}
    else if(b===7||b===3||hab[j]<.4){moistTo(j,.47+hash(j)*.04);what='dry'}
    if(!what)continue;
    if(owner[j]<0)claim(j,n.id);tfDirty++;n.tf=(n.tf||0)+1;
    if(n.tf===1)log(`${n.name} began to terraform the wastes around it.`,'era');
    else if(what==='sea'&&rng()<.08&&important(n))log(`${n.name} raised new land from the sea.`,'era');
    if(rng()<.25){const x=wx(X),z=wz(Y);for(let e=0;e<6;e++)emit('spark',x+(rng()-.5)*.6,Math.max(groundY(x,z),waterY)+.05,z+(rng()-.5)*.6)}
    milestone('terraform','Terraforming','A nation began to remake the world.');return}}
function terraformFlush(){if(tfDirty&&year%6===0){tfDirty=0;terrainDirty=true}}
