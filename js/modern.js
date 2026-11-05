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
const MOD_COL=[0xd8d4cc,0xc9d5df,0xe6e2da,0xb8c4cc,0xd6cbb8,0xaab8c2,0xe2dcd0,0xc89a78,0xb8785a,0xe8d8b8,0xd0b090];
let MCTX={lvl:1,cap:false,tall:[]};

/* stack a building out of storeys so window textures keep their scale */
function storeys(K,x,y,z,w,d,h,rot,col,seg){const n=MCTX.far?1:Math.max(1,Math.round(h/(seg||.28))),sh=h/n;for(let i=0;i<n;i++)add(K,x,y+i*sh,z,w,sh*1.001,d,rot,col)}
function towerHeight(core,hk){return Math.min(.85,(.1+core*core*core*.7+hk*hk*.25)*(MCTX.cap?1.3:1)*(.6+MCTX.lvl*.065))}

/* modern age: glass and concrete towers downtown, apartment slabs, then villas with pools at the edge */
function modernBuilding(n,x,y,z,rot,hk,core,fw){const o=hash(hk*131+7),col=MOD_COL[(o*MOD_COL.length)|0],w=Math.min(fw,.14);
  if(core>.84&&hk>.3||(core>.76&&hk>.93)){const H=towerHeight(core,hk),glass=o>.45,K=glass?'skyG':'sky',tint=glass?[0xdaf4ff,0xc8e6f2,0xb8d8e6,0xe6f0f0][(o*4)|0]:col;
    add('conc',x,y-.02,z,w*1.3,.06,w*1.15,rot,0x9a9fa4);
    const tiers=H>.7?3:H>.35?2:1,F=[[1],[.7,.3],[.56,.28,.16]][tiers-1],S=[1,.78,.58];let yy=y+.04;
    for(let t=0;t<tiers;t++){const th=H*F[t],ww=w*S[t];storeys(K,x,yy,z,ww,ww*.92,th,rot,tint,glass?.24:.3);yy+=th;add('conc',x,yy,z,ww*1.04,.01,ww*.96,rot,0x6f747a);yy+=.01}
    if(o<.33){add('cyl',x,yy,z,.006,H*.2,.006,0,0xd0d0d0);add('glowB',x,yy+H*.2,z,.008,.008,.008,0,0xff4030)}
    else if(o<.66){add('concCyl',x,yy,z,w*.42,.006,w*.42,0,0x55585c);add('glowB',x,yy+.006,z,w*.3,.002,.004,rot,0xffe070)}
    else{add('conc',x,yy,z,w*.4,.04,w*.3,rot,0x8a8f94);add('concCyl',x+w*.18,yy,z,.025,.05,.025,0,0x6a5a4a)}
    if(H>.5)MCTX.tall.push([x,z,H,y]);return}
  if(core>.6||(core>.5&&hk>.9)){aptBlock(x,y,z,rot,Math.max(w,.12),hk,core);return}
  if(o<.55){const wc=HOME_WALL[(hash(hk*29)*HOME_WALL.length)|0],rc=o<.3?0xb8553e:o<.42?0x5a6068:0x8a4a3a;
    house(x,y,z,rot,.085,.07,.05+hash(hk*3)*.02,'plaster',wc,'tiles',rc,false,{hk:hash(hk*97+1),annex:o<.2,garden:false,lamp:false,fenceCol:0xe8e2d4});
    if(o>.45)P('conc',x,y-.02,z,rot,.055,0,0,.035,.03,.045,0xd8d4cc);return}
  /* a villa: white walls, a flat roof, a glass front and a pool */
  P('conc',x,y-.02,z,rot,0,0,0,.08,.065,.06,0xf0eee8);P('conc',x,y-.02,z,rot,.02,.01,.065,.06,.04,.05,0xe8e4dc);P('conc',x,y+.045,z,rot,0,0,0,.09,.008,.07,0x4a4d52);
  P('skyG',x,y-.02,z,rot,0,.031,.012,.06,.035,.002,0xc8eaf6);if(o>.4)P('pool',x,y-.016,z,rot,0,.065,0,.05,.012,.03)}

const APT_WALL=[0xefe4cc,0xe8c6b4,0xd8dcdc,0xf2e6c4,0xc9b49a,0xe6d2b0,0xd4c8bc,0xb8c4c8];
function aptBlock(x,y,z,rot,w,hk,core){const o=hash(hk*211+9),col=APT_WALL[(o*APT_WALL.length)|0],fl=2+Math.round(core*2.5+hash(hk*5)*1.5),fh=.032,H=fl*fh,pitched=o<.45,
    rc=o<.25?0xc8604a:o<.35?0xb8553e:0x6a6e74,shape=(hash(hk*17)*3)|0,t=w*.32;
  /* wings: a bar, an L or a U round a courtyard */
  const wings=shape===0?[[0,0,w,w*.55]]:shape===1?[[0,-w*.34,w,t],[-w*.34,w*.1,t,w*.62]]:[[0,-w*.34,w,t],[-w*.34,w*.12,t,w*.56],[w*.34,w*.12,t,w*.56]];
  for(const [dx,dz,ww,dd] of wings){
    P('plaster',x,y-.02,z,rot,dx,dz,0,ww,fh*.9+.02,dd,0xd8d0c4);/* shops on the ground floor */
    if(!MCTX.far){P('skyG',x,y-.004,z,rot,dx,dz,0,ww*1.002,fh*.5,dd*1.002,0x9fc8d8);P('awning',x,y+fh*.62,z,rot,dx,dz+dd/2+.006,0,ww*.8,.008,.012,AWN[(hash(hk*7+dx)*AWN.length)|0])}
    P('plaster',x,y+fh*.9,z,rot,dx,dz,0,ww,H-fh*.9,dd,col);
    if(!MCTX.far)for(let f=1;f<fl;f++){P('box',x,y+f*fh+fh*.25,z,rot,dx,dz,0,ww*1.01,fh*.36,dd*1.01,0x3a4a58)}/* window bands */
    if(pitched)P('tiles',x,y+H,z,rot,dx,dz,0,ww*1.04,.035,dd*1.08,rc,ww>=dd?0:Math.PI/2);
    else{P('conc',x,y+H,z,rot,dx,dz,0,ww*1.02,.008,dd*1.02,0x5f6368);if(o>.7)P('conc',x,y+H+.008,z,rot,dx*.5,dz*.5,0,.025,.018,.025,0x9a9fa4)}}
  if(shape>0&&!MCTX.far){P('box',x,y-.018,z,rot,0,w*.12,0,w*.4,.004,w*.4,0x5a8a3e);P('townTree',x,y-.02,z,rot,0,w*.12,0,.18,.2,.18,0x4f8a3a)}}
/* future age, the green way: vertical forests, timber and glass terraces, planted roofs, solar and wind */
const WOOD=0xc8925a,WOOD2=0xb07a46,GLEAF=[0x4f8a3a,0x6aa84a,0x5a9a40,0x7ab858],SOLAR=0x24344e;
function windTurbine(x,y,z,h,face){add('concCyl',x,y-.02,z,h*.03,h,h*.03,0,0xf4f4f2);add('conc',x,y+h-.02,z,h*.06,h*.05,h*.12,face,0xf4f4f2);
  for(let k=0;k<3;k++)add('conc',x+Math.sin(face)*h*.07,y+h,z+Math.cos(face)*h*.07,h*.012,h*.48,h*.03,face,0xf8f8f6,k*2.094+hash(x*9+z)*2)}
function futureBuilding(n,x,y,z,rot,hk,core,fw){const o=hash(hk*173+3),w=Math.min(fw,.13),c=Math.cos(rot),s=Math.sin(rot);
  if(core>.84&&hk>.3||(core>.76&&hk>.93)){const H=towerHeight(core,hk)*1.05;let yy=y-.02;
    if(o<.5){/* a vertical forest: every floor a balcony of trees */const fl=Math.max(6,Math.round(H/.045)),fh=H/fl;
      for(let f=0;f<fl;f++){add('skyG',x,yy,z,w*.78,fh,w*.78,rot,0xd8eef0);add('conc',x,yy+fh-.005,z,w*.98,.007,w*.98,rot,0xf2efe8);
        if(!MCTX.far)for(let q=0;q<2;q++){const a=(f+q*2)%4,ox=(a&1?1:-1)*w*.38,oz=(a&2?1:-1)*w*.38;add('bloom',x+ox*c+oz*s,yy+fh,z-ox*s+oz*c,w*.34,w*.24,w*.34,0,GLEAF[(f+q)%4])}
        yy+=fh}
      add('conc',x,yy,z,w*.9,.01,w*.9,rot,0xf2efe8);add('bloom',x,yy+.008,z,w*.7,w*.32,w*.7,0,GLEAF[1])}
    else if(o<.8){/* timber and glass stepping back, a garden on every step, sun panels on top */const F=[.5,.32,.18],S=[1,.76,.54];
      for(let t=0;t<3;t++){const th=H*F[t],ww=w*S[t];storeys('skyG',x,yy,z,ww*.9,ww*.84,th,rot,0xcfe8e6,.2);
        P('plaster',x,yy,z,rot,ww*.43,0,0,ww*.08,th,ww*.88,WOOD);P('plaster',x,yy,z,rot,-ww*.43,0,0,ww*.08,th,ww*.88,WOOD2);
        yy+=th;add('conc',x,yy,z,ww*1.02,.008,ww*.96,rot,0xf2efe8);add('box',x,yy+.006,z,ww*.98,.008,ww*.92,rot,0x5f9a45);
        if(!MCTX.far&&t<2)for(let q=0;q<4;q++){const ox=(q&1?1:-1)*ww*.4,oz=(q&2?1:-1)*ww*.38;add('bloom',x+ox*c+oz*s,yy+.012,z-ox*s+oz*c,ww*.18,ww*.14,ww*.18,0,GLEAF[q])}}
      add('box',x,yy+.014,z,w*.36,.004,w*.3,rot,SOLAR,-.3)}
    else{/* two slim towers clad in wood, joined by a garden bridge */for(const sd of [-1,1]){const X=x+c*w*.32*sd,Z=z-s*w*.32*sd,hh=H*(sd>0?1:.82);
        storeys('skyG',X,y-.02,Z,w*.46,w*.5,hh,rot,0xd4ecea,.2);P('plaster',X,y-.02,Z,rot,0,w*.26,0,w*.48,hh,.008,WOOD);add('bloom',X,y-.02+hh,Z,w*.4,w*.2,w*.4,0,GLEAF[0])}
      const by=y+H*.55;add('conc',x,by,z,w*.3,.01,w*.2,rot+Math.PI/2,0xf2efe8);add('bloom',x,by+.01,z,w*.24,w*.1,w*.16,rot,GLEAF[2])}
    MCTX.tall.push([x,z,H,y]);return}
  if(core>.6||(core>.5&&hk>.9)){/* green terraces: white floors stepping back, wooden screens, a planted edge on every level */
    const fl=2+Math.round(core*3+hash(hk*5)*1.5),fh=.034,W_=Math.max(w,.12),D=W_*.8;let yy=y-.02;
    for(let f=0;f<fl;f++){const bk=f*.012,dd=D-bk*1.5;P('conc',x,yy,z,rot,0,-bk,0,W_,fh*.9,dd,0xf4f1ea);P('skyG',x,yy+fh*.15,z,rot,0,dd/2-bk+.001,0,W_*.9,fh*.55,.004,0xbfe4ea);
      if(!MCTX.far){P('box',x,yy+fh*.9,z,rot,0,dd/2-bk-.004,0,W_,.012,.014,0x5f9a45);if(f%2===0)P('plaster',x,yy,z,rot,W_*.44,-bk,0,.012,fh*.9,dd,WOOD)}
      yy+=fh}
    P('box',x,yy+.004,z,rot,0,-fl*.012,0,W_*.6,.004,D*.4,SOLAR,-.25);if(!MCTX.far)P('bloom',x,yy,z,rot,-W_*.3,-fl*.012,0,.03,.022,.03,GLEAF[3]);return}
  futureHome(x,y,z,rot,o)}
/* future homes: white and timber, roofs of grass or sun panels, a garden and a fruit tree */
function futureHome(x,y,z,rot,o){const v=(o*3)|0;
  if(v===0){P('plaster',x,y-.02,z,rot,0,0,0,.085,.045,.065,0xf4f1ea);P('plaster',x,y-.02,z,rot,.03,0,0,.026,.046,.066,WOOD);P('tiles',x,y+.025,z,rot,0,0,0,.095,.034,.075,o<.15?0x6a9a48:SOLAR)}
  else if(v===1){P('conc',x,y-.02,z,rot,0,0,0,.08,.04,.06,0xf4f1ea);P('plaster',x,y-.02,z,rot,0,.031,.006,.07,.03,.003,WOOD);P('skyG',x,y-.016,z,rot,-.02,.0315,0,.03,.03,.002,0xbfe4ea);
    P('conc',x,y+.02,z,rot,.015,-.005,0,.05,.028,.045,0xece8de);P('box',x,y+.02,z,rot,-.025,0,0,.03,.006,.05,0x5f9a45);P('box',x,y+.049,z,rot,.015,-.005,0,.045,.004,.04,SOLAR,-.25)}
  else{/* an earth house under a grassy mound with a round glass front */P('bloom',x,y-.03,z,rot,0,-.01,0,.1,.07,.08,0x6aa04a);P('skyG',x,y-.02,z,rot,0,.03,0,.04,.03,.003,0xbfe4ea);P('plaster',x,y-.02,z,rot,0,.031,0,.048,.034,.002,WOOD)}
  P('box',x,y-.02,z,rot,0,.005,0,.12,.004,.1,0x6aa050);if(o>.3)P('townTree',x,y,z,rot,.055,-.03,0,.17,.19,.17,0x4f8a3a);if(o>.7)P('bloom',x,y-.012,z,rot,-.05,.035,0,.02,.018,.02,[0xe8506a,0xf2c040,0xb070d0][(o*30|0)%3])}

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
/* ---------- war in the air: biplanes, then fighters and bombers, then drones ---------- */
const FLY_OLIVE=stdMat({color:colL(0x5a6248),roughness:.6}),FLY_GREY=stdMat({color:colL(0x7a8088),roughness:.45,metalness:.3});
function makeWarPlane(n,kind){const g=new THREE.Group(),c=flyCol(n.color);g.userData.kind=kind;
  if(kind==='bi'){partM(g,FLYGEO.fus,c,0,0,0,.1,.016,.016);for(const y of [-.011,.013])partM(g,FLYGEO.box,FLY_OLIVE,.012,y,0,.03,.003,.15);
    for(const s of [-1,1])partM(g,FLYGEO.box,FLY.dark,.012,0,s*.05,.002,.024,.002);partM(g,FLYGEO.box,FLY_OLIVE,-.048,.002,0,.018,.003,.05);partM(g,FLYGEO.box,c,-.05,.01,0,.016,.016,.002);
    g.userData.prop=partM(g,FLYGEO.box,FLY.dark,.053,0,0,.002,.034,.004)}
  else if(kind==='fighter'){partM(g,FLYGEO.fus,FLY_GREY,0,0,0,.13,.014,.014);partM(g,FLYGEO.nose,FLY_GREY,.065,0,0,.03,.012,.012);partM(g,FLYGEO.nose,FLY.glass,.03,.008,0,.03,.008,.008);
    for(const s of [-1,1]){const w=partM(g,FLYGEO.box,FLY_GREY,-.005,0,s*.032,.045,.002,.06);w.rotation.y=s*.45}partM(g,FLYGEO.box,FLY_GREY,-.058,.012,0,.02,.022,.002);
    partM(g,FLYGEO.box,c,-.01,.0075,0,.06,.002,.004);partM(g,FLYGEO.fus,FLY.dark,-.068,0,0,.012,.01,.01)}
  else if(kind==='bomber'){partM(g,FLYGEO.fus,FLY_OLIVE,0,0,0,.2,.022,.022);partM(g,FLYGEO.nose,FLY.glass,.1,0,0,.03,.02,.02);partM(g,FLYGEO.box,FLY_OLIVE,.01,0,0,.05,.004,.26);
    for(const s of [-.09,-.045,.045,.09])partM(g,FLYGEO.fus,FLY.dark,.03,-.008,s,.04,.012,.012);partM(g,FLYGEO.box,FLY_OLIVE,-.09,.004,0,.026,.003,.09);partM(g,FLYGEO.box,c,-.095,.018,0,.024,.03,.003)}
  else{partM(g,FLYGEO.box,FLY.white,0,0,0,.05,.01,.012);for(const s of [-1,1])partM(g,FLYGEO.box,FLY.white,-.005,0,s*.03,.02,.003,.05);partM(g,FLYGEO.box,FLY.glow,.026,0,0,.004,.004,.008);partM(g,FLYGEO.box,c,-.02,.006,0,.012,.008,.002)}
  g.scale.setScalar(1.7);scene.add(g);return g}
let warPlanes=[],warPlaneT=0;
function warTarget(A,B){const f=B.front&&B.front.length?B.front[(rng()*B.front.length)|0]:-1;if(f>=0&&owner[f]===B.id)return f;const sc=B.cities.find(c=>c.siege>0&&c.besiegedBy===A.id)||B.cities[(rng()*B.cities.length)|0];return sc?sc.y*W+sc.x:-1}
function updateWarPlanes(dt,k){
  warPlaneT-=dt*(k>0?1:0);
  if(k>0&&warPlaneT<=0&&warPlanes.length<16){warPlaneT=1.2;const pairs=[];for(const A of nations)if(A.alive&&A.era>=5)for(const b of A.wars){const B=nations[b];if(B&&B.alive)pairs.push([A,B])}
    if(pairs.length){warPlaneT=1.6/Math.min(3,1+pairs.length*.3);const [A,B]=pairs[(rng()*pairs.length)|0],ti=warTarget(A,B);
      if(ti>=0){const tx=wx(ti%W),tz=wz((ti/W)|0);let home=null,bd=1e9;for(const c of A.cities){const d=Math.hypot(wx(c.x)-tx,wz(c.y)-tz);if(d<bd){bd=d;home=c}}
        if(home&&bd<26){const kind=A.era===5?'bi':A.era>=7?'drone':rng()<.6?'fighter':'bomber',hx=wx(home.x),hz=wz(home.y);
          warPlanes.push({g:makeWarPlane(A,kind),kind,n:A.id,foe:B.id,x:hx,z:hz,y:groundY(hx,hz)+.3,tx,tz,ti,hx,hz,ph:'out',t:0,ang:Math.atan2(tz-hz,tx-hx),hp:1,drop:0,spd:kind==='bi'?.55:kind==='bomber'?.75:kind==='drone'?.9:1.3})}}}}
  for(let q=warPlanes.length-1;q>=0;q--){const p=warPlanes[q],s=dt*(k>0?Math.min(2.2,.8+k*.25):0);p.t+=s;
    const gy=groundY(p.x,p.z),alt=p.kind==='bomber'?1.1:p.kind==='bi'?.6:.85;
    if(p.ph==='fall'){p.y-=s*.9;p.x+=Math.cos(p.ang)*s*.4;p.z+=Math.sin(p.ang)*s*.4;p.g.rotation.x+=s*6;if(rng()<s*30)emit('dark',p.x,p.y,p.z);if(rng()<s*20)emit('fire',p.x,p.y,p.z);
      if(p.y<=gy){for(let k2=0;k2<10;k2++){emit('fire',p.x,gy+.02,p.z);emit('dark',p.x,gy+.05,p.z)}if(Math.hypot(p.x-camT.x,p.z-camT.z)<camDist*.8)sfx('cannon');disposeGroup(p.g);warPlanes.splice(q,1)}
      else p.g.position.set(p.x,p.y,p.z);continue}
    let gx=p.tx,gz=p.tz;
    if(p.ph==='strike'){const a=p.t*1.6;gx=p.tx+Math.cos(a)*.45;gz=p.tz+Math.sin(a)*.45;
      if(p.kind!=='fighter'){p.drop-=s;if(p.drop<=0){p.drop=p.kind==='bomber'?.35:.6;const bx=p.tx+(rng()-.5)*.6,bz=p.tz+(rng()-.5)*.6,by=groundY(bx,bz);
        for(let k2=0;k2<4;k2++)emit('fire',bx,by+.02,bz);emit('dark',bx,by+.06,bz);emit('flash',bx,by+.05,bz);if(Math.hypot(bx-camT.x,bz-camT.z)<camDist*.7)sfx('cannon')}}
      /* dogfights: fighters hunt enemy planes nearby, and one of them goes down */
      for(const o of warPlanes){if(o===p||o.ph==='fall'||o.n!==p.foe)continue;const d=Math.hypot(o.x-p.x,o.z-p.z);if(d<1.4&&(p.kind==='fighter'||p.kind==='bi')){gx=o.x;gz=o.z;if(d<.35&&rng()<s*.5){(rng()<.5?o:p).ph='fall'}break}}
      if(p.t>(p.kind==='fighter'?7:5))p.ph='home'}
    if(p.ph==='home'){gx=p.hx;gz=p.hz}
    const want=Math.atan2(gz-p.z,gx-p.x);let da=((want-p.ang+9.42)%6.283)-3.14;p.ang+=clamp(da,-s*2.4,s*2.4);
    p.x+=Math.cos(p.ang)*p.spd*s;p.z+=Math.sin(p.ang)*p.spd*s;p.y+=(gy+alt-p.y)*Math.min(1,s*1.5);
    const dg=Math.hypot(gx-p.x,gz-p.z);if(p.ph==='out'&&dg<.5){p.ph='strike';p.t=0}if(p.ph==='home'&&dg<.3){disposeGroup(p.g);warPlanes.splice(q,1);continue}
    const A=nations[p.n],B=nations[p.foe];if(p.ph!=='home'&&(!A||!A.alive||!B||!B.alive||!A.wars.has(B.id)))p.ph='home';
    p.g.position.set(p.x,p.y,p.z);p.g.rotation.order='YXZ';p.g.rotation.y=-p.ang;p.g.rotation.z=0;p.g.rotation.x=clamp(-da*1.2,-.7,.7);
    if(p.g.userData.prop)p.g.userData.prop.rotation.x+=s*60;if(k>0&&p.kind!=='bi'&&rng()<dt*10)emit('trail',p.x-Math.cos(p.ang)*.1,p.y,p.z-Math.sin(p.ang)*.1,0,0)}}
function updateFlights(dt,k){updateWarPlanes(dt,k);
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
