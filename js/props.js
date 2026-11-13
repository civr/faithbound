"use strict";
/* Faithbound — props: textures, buildings, trees, fields, roads, people, particles, ships */

/* ---------- procedural textures ---------- */
function canvasTex(size,draw,repeat){const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d');draw(x,size);
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;t.wrapS=t.wrapT=THREE.RepeatWrapping;if(repeat)t.repeat.set(repeat[0],repeat[1]);return t}
const trand=mulberry32(4242);
function speckle(x,s,a){for(let i=0;i<s*s/6;i++){x.fillStyle=`rgba(${trand()<.5?0:255},${trand()<.5?0:255},${trand()<.5?0:255},${a*trand()})`;x.fillRect(trand()*s,trand()*s,2,2)}}
const winLit=[];
function windowsLayer(x,s,cols,rows,ww,wh,lit,frameCol,glassCol){for(let r=0;r<rows;r++)for(let k=0;k<cols;k++){const px=(k+.5)*s/cols-ww/2,py=(r+.5)*s/rows-wh/2;
  if(lit){if(trand()<.55){x.fillStyle='#ffc56e';x.fillRect(px+1,py+1,ww-2,wh-2)}}else{x.fillStyle=frameCol;x.fillRect(px-1,py-1,ww+2,wh+2);x.fillStyle=glassCol;x.fillRect(px,py,ww,wh)}}}
const TX={
  plaster:canvasTex(128,(x,s)=>{x.fillStyle='#e9e0cb';x.fillRect(0,0,s,s);speckle(x,s,.05);x.fillStyle='#4a3324';
    for(const px of [0,42,86,122])x.fillRect(px,0,6,s);for(const py of [0,62,122])x.fillRect(0,py,s,6);
    x.lineWidth=5;x.strokeStyle='#4a3324';x.beginPath();x.moveTo(6,62);x.lineTo(42,6);x.moveTo(86,62);x.lineTo(122,6);x.stroke();
    windowsLayer(x,s,2,2,16,14,false,'#4a3324','#2a3440')}),
  plasterE:canvasTex(128,(x,s)=>{x.fillStyle='#000';x.fillRect(0,0,s,s);windowsLayer(x,s,2,2,16,14,true)}),
  stone:canvasTex(128,(x,s)=>{x.fillStyle='#9b958a';x.fillRect(0,0,s,s);for(let r=0;r<8;r++)for(let k=0;k<5;k++){const v=140+trand()*50|0;x.fillStyle=`rgb(${v},${v-6},${v-14})`;x.fillRect(k*28-(r%2)*14+2,r*16+2,24,12)}
    speckle(x,s,.06);x.fillStyle='#1f232a';x.fillRect(58,40,10,22);x.fillRect(58,92,10,22)}),
  stoneE:canvasTex(128,(x,s)=>{x.fillStyle='#000';x.fillRect(0,0,s,s);x.fillStyle='#ffbf60';if(trand()<.7)x.fillRect(59,41,8,20);x.fillRect(59,93,8,20)}),
  brick:canvasTex(128,(x,s)=>{x.fillStyle='#6d4a3c';x.fillRect(0,0,s,s);for(let r=0;r<16;r++)for(let k=0;k<9;k++){const v=trand()*30|0;x.fillStyle=`rgb(${150+v},${78+v/2},${60+v/3})`;x.fillRect(k*16-(r%2)*8+1,r*8+1,14,6)}
    windowsLayer(x,s,3,3,16,20,false,'#e6dccb','#25303c')}),
  brickE:canvasTex(128,(x,s)=>{x.fillStyle='#000';x.fillRect(0,0,s,s);windowsLayer(x,s,3,3,16,20,true)}),
  thatch:canvasTex(128,(x,s)=>{x.fillStyle='#a88a52';x.fillRect(0,0,s,s);for(let i=0;i<900;i++){const v=trand()*60|0;x.strokeStyle=`rgba(${120+v},${95+v},${50+v/2},.6)`;x.beginPath();const px=trand()*s,py=trand()*s;x.moveTo(px,py);x.lineTo(px+trand()*2-1,py+8+trand()*10);x.stroke()}
    x.fillStyle='rgba(60,40,20,.25)';for(let r=0;r<6;r++)x.fillRect(0,r*22,s,3)}),
  tiles:canvasTex(128,(x,s)=>{x.fillStyle='#d9d9d9';x.fillRect(0,0,s,s);for(let r=0;r<12;r++){for(let k=0;k<10;k++){const v=200+trand()*55|0;x.fillStyle=`rgb(${v},${v},${v})`;x.beginPath();x.arc(k*13+(r%2)*6+6,r*11+11,6.5,Math.PI,0);x.fill()}
    x.fillStyle='rgba(0,0,0,.25)';x.fillRect(0,r*11+10,s,1.5)}}),
  office:canvasTex(128,(x,s)=>{x.fillStyle='#d4d6d8';x.fillRect(0,0,s,s);for(let r=0;r<10;r++){x.fillStyle='#2b3746';x.fillRect(4,r*12.8+3,s-8,7)}speckle(x,s,.03)}),
  officeE:canvasTex(128,(x,s)=>{x.fillStyle='#000';x.fillRect(0,0,s,s);for(let r=0;r<10;r++)for(let k=0;k<8;k++)if(trand()<.45){x.fillStyle=trand()<.8?'#ffd68a':'#cfe6ff';x.fillRect(4+k*15,r*12.8+3,13,7)}}),
  glass:canvasTex(128,(x,s)=>{const g=x.createLinearGradient(0,0,0,s);g.addColorStop(0,'#cfeff7');g.addColorStop(1,'#7fb6c9');x.fillStyle=g;x.fillRect(0,0,s,s);x.strokeStyle='rgba(255,255,255,.55)';x.lineWidth=1.5;for(let i=0;i<=8;i++){x.beginPath();x.moveTo(i*16,0);x.lineTo(i*16,s);x.stroke();x.beginPath();x.moveTo(0,i*16);x.lineTo(s,i*16);x.stroke()}}),
  glassE:canvasTex(128,(x,s)=>{x.fillStyle='#000';x.fillRect(0,0,s,s);for(let r=0;r<8;r++)for(let k=0;k<8;k++)if(trand()<.5){x.fillStyle='#9ff3ff';x.fillRect(k*16+2,r*16+2,12,12)}}),
  furrow:canvasTex(64,(x,s)=>{x.fillStyle='#ffffff';x.fillRect(0,0,s,s);for(let i=0;i<8;i++){x.fillStyle='rgba(0,0,0,.22)';x.fillRect(0,i*8,s,3)}speckle(x,s,.08)}),
  soft:(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.5,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})()
};
/* photo detail (Poly Haven, CC0) blended over the painted building textures once it has loaded: real grain in plaster, stone, brick, thatch and tiles, while the paint keeps windows, beams and colours */
function photoLayer(key,file,alpha){const t=TX[key];if(!t||!t.image)return;const im=new Image();im.onload=()=>{const src=t.image,S=Math.max(256,src.width);const c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d');
  x.imageSmoothingQuality='high';x.drawImage(src,0,0,S,S);x.globalCompositeOperation='overlay';x.globalAlpha=alpha;x.drawImage(im,0,0,S,S);t.image=c;t.needsUpdate=true};im.src='assets/textures/'+file+'.jpg'}
/* pale packed-earth lanes with wheel ruts, pebbles and a grassy crown, like a medieval village track */
TX.dirt=canvasTex(256,(x,s)=>{x.fillStyle='#6e6452';x.fillRect(0,0,s,s);
  for(let i=0;i<5000;i++){const v=trand();x.fillStyle=v<.5?`rgba(90,72,50,${.08+trand()*.12})`:`rgba(230,220,200,${.06+trand()*.12})`;const r=.6+trand()*1.8;x.beginPath();x.arc(trand()*s,trand()*s,r,0,7);x.fill()}
  for(const cx of [62,194]){const g=x.createLinearGradient(cx-22,0,cx+22,0);g.addColorStop(0,'rgba(95,78,55,0)');g.addColorStop(.5,'rgba(95,78,55,.32)');g.addColorStop(1,'rgba(95,78,55,0)');x.fillStyle=g;x.fillRect(cx-22,0,44,s)}
  for(let i=0;i<260;i++){x.strokeStyle=`rgba(${90+trand()*40|0},${120+trand()*40|0},${50+trand()*20|0},${.25+trand()*.35})`;x.lineWidth=1;const px=s/2+(trand()-.5)*34,py=trand()*s;x.beginPath();x.moveTo(px,py);x.lineTo(px+(trand()-.5)*3,py-4-trand()*5);x.stroke()}
  for(let i=0;i<120;i++){const ex=trand()<.5?trand()*10:s-trand()*10;x.strokeStyle=`rgba(90,${120+trand()*40|0},50,.4)`;x.beginPath();const py=trand()*s;x.moveTo(ex,py);x.lineTo(ex+(trand()-.5)*3,py-5);x.stroke()}});
/* smooth mud render and whitewash: neutral, tinted per culture */
TX.adobe=canvasTex(128,(x,s)=>{x.fillStyle='#e6ded2';x.fillRect(0,0,s,s);for(let i=0;i<2600;i++){const v=trand();x.fillStyle=v<.5?`rgba(120,100,80,${.05+trand()*.08})`:`rgba(255,255,255,${.05+trand()*.1})`;x.fillRect(trand()*s,trand()*s,1+trand()*3,1+trand()*2)}
  for(let i=0;i<30;i++){x.fillStyle=`rgba(110,90,70,${.04+trand()*.05})`;x.fillRect(0,trand()*s,s,1+trand()*2)}const g=x.createLinearGradient(0,s*.8,0,s);g.addColorStop(0,'rgba(90,70,50,0)');g.addColorStop(1,'rgba(90,70,50,.25)');x.fillStyle=g;x.fillRect(0,0,s,s)});
/* weathered grey-brown thatch with combed straw, moss and darker courses */
TX.thatch2=canvasTex(256,(x,s)=>{x.fillStyle='#75674f';x.fillRect(0,0,s,s);
  for(let r=0;r<9;r++){const y0=r*s/9;x.fillStyle='rgba(40,30,20,.28)';x.fillRect(0,y0,s,4)}
  for(let i=0;i<5200;i++){const v=trand(),px=trand()*s,py=trand()*s,l=8+trand()*14;x.strokeStyle=v<.6?`rgba(${120+trand()*50|0},${105+trand()*40|0},${70+trand()*30|0},.55)`:v<.85?`rgba(60,48,34,.5)`:`rgba(170,155,115,.5)`;
    x.lineWidth=.8+trand()*.8;x.beginPath();x.moveTo(px,py);x.lineTo(px+(trand()-.5)*2.5,py+l);x.stroke()}
  for(let i=0;i<40;i++){const px=trand()*s,py=trand()*s,r=6+trand()*16,g=x.createRadialGradient(px,py,0,px,py,r);g.addColorStop(0,'rgba(80,96,44,.35)');g.addColorStop(1,'rgba(80,96,44,0)');x.fillStyle=g;x.fillRect(px-r,py-r,r*2,r*2)}});
/* log and plank walls with a dark door and small shuttered window */
TX.timber=canvasTex(256,(x,s)=>{x.fillStyle='#6a5640';x.fillRect(0,0,s,s);
  for(let k=0;k<16;k++){const v=trand()*30|0;x.fillStyle=`rgb(${92+v},${74+v*.8|0},${54+v*.6|0})`;x.fillRect(k*16+1,0,14,s);
    for(let i=0;i<30;i++){x.strokeStyle=`rgba(40,30,20,${.15+trand()*.2})`;x.lineWidth=.7;const px=k*16+2+trand()*12;x.beginPath();x.moveTo(px,trand()*s);x.lineTo(px+(trand()-.5)*2,trand()*s);x.stroke()}}
  const g=x.createLinearGradient(0,s*.75,0,s);g.addColorStop(0,'rgba(40,32,22,0)');g.addColorStop(1,'rgba(40,32,22,.45)');x.fillStyle=g;x.fillRect(0,0,s,s);
  x.fillStyle='#2a2018';x.fillRect(s*.18,s*.42,s*.16,s*.58);x.fillStyle='#3a2c20';x.fillRect(s*.6,s*.38,s*.18,s*.16);x.fillStyle='#1c1814';x.fillRect(s*.63,s*.41,s*.12,s*.1)});
TX.timberE=canvasTex(64,(x,s)=>{x.fillStyle='#000';x.fillRect(0,0,s,s);x.fillStyle='#ffb050';x.fillRect(s*.63,s*.41,s*.12,s*.1)});
/* dug garden beds: dark rows with seedlings */
TX.soil=canvasTex(128,(x,s)=>{x.fillStyle='#4a3a2a';x.fillRect(0,0,s,s);speckle(x,s,.1);
  for(let r=0;r<8;r++){x.fillStyle='rgba(30,22,14,.55)';x.fillRect(0,r*16+11,s,4);for(let k=0;k<14;k++){if(trand()<.25)continue;x.fillStyle=`rgb(${70+trand()*40|0},${110+trand()*50|0},${40+trand()*20|0})`;x.beginPath();x.arc(k*9+4+trand()*3,r*16+6,1.8+trand()*1.6,0,7);x.fill()}}},[1,1]);
TX.cobble=canvasTex(128,(x,s)=>{x.fillStyle='#55504a';x.fillRect(0,0,s,s);for(let r=0;r<12;r++)for(let k=0;k<12;k++){const v=96+trand()*50|0;x.fillStyle=`rgb(${v},${v-4},${v-10})`;x.beginPath();x.ellipse(k*11+(r%2)*5+5,r*11+5,4.6,4.2,trand(),0,7);x.fill()}});
TX.asphalt=canvasTex(128,(x,s)=>{x.fillStyle='#3a3c40';x.fillRect(0,0,s,s);speckle(x,s,.08);x.fillStyle='#d8d4c0';x.fillRect(4,0,3,s);x.fillRect(s-7,0,3,s);x.fillStyle='#e8c24a';for(let i=0;i<4;i++)x.fillRect(s/2-2,i*32+4,4,18)});
TX.plaza=canvasTex(128,(x,s)=>{x.fillStyle='#8c857a';x.fillRect(0,0,s,s);for(let r=0;r<16;r++)for(let k=0;k<16;k++){const v=140+trand()*50|0;x.fillStyle=`rgb(${v},${v-6},${v-14})`;x.fillRect(k*8+1,r*8+1,6.5,6.5)}},[3,3]);
TX.lampE=canvasTex(8,(x)=>{x.fillStyle='#fff';x.fillRect(0,0,8,8)});
const WARM=new THREE.Color(0xffd38a);
const winMats=[];
function stdMat(o){const m=new THREE.MeshStandardMaterial(Object.assign({roughness:.85,metalness:0},o));if(o.emissiveMap){m.emissive=WARM.clone();m.emissiveIntensity=0;winMats.push(m)}return m}
/* copies that float at the waterline (moored boats, rowing boats, fishing boats) are lifted by the tide on the graphics chip */
function tideHook(m){const prev=m.onBeforeCompile;m.onBeforeCompile=function(sh,r){if(prev)prev.call(this,sh,r);sh.uniforms.uTide=TIDEU.uTide;sh.uniforms.uSeaY=TIDEU.uSeaY;
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uTide;uniform float uSeaY;').replace('#include <project_vertex>',`vec4 mvPosition=vec4(transformed,1.0);
#ifdef USE_INSTANCING
mvPosition=instanceMatrix*mvPosition;{float oy=instanceMatrix[3].y;mvPosition.y+=uTide*step(uSeaY+.001,oy)*step(oy,uSeaY+.035);}
#endif
mvPosition=modelViewMatrix*mvPosition;gl_Position=projectionMatrix*mvPosition;`)};m.customProgramCacheKey=()=>'tide'+m.uuid;m.needsUpdate=true}
const MAT={
  plaster:stdMat({map:TX.plaster,emissiveMap:TX.plasterE}),
  stone:stdMat({map:TX.stone,emissiveMap:TX.stoneE,roughness:.95}),
  brick:stdMat({map:TX.brick,emissiveMap:TX.brickE}),
  thatch:stdMat({map:TX.thatch,roughness:1,side:THREE.DoubleSide}),
  thatch2:stdMat({map:TX.thatch2,roughness:1,side:THREE.DoubleSide}),adobe:stdMat({map:TX.adobe,roughness:.95}),timber:stdMat({map:TX.timber,emissiveMap:TX.timberE,roughness:.95}),soil:stdMat({map:TX.soil,roughness:1}),
  tiles:stdMat({map:TX.tiles,roughness:.8,side:THREE.DoubleSide}),
  office:stdMat({map:TX.office,emissiveMap:TX.officeE,roughness:.4,metalness:.2}),
  glass:stdMat({map:TX.glass,emissiveMap:TX.glassE,roughness:.12,metalness:.5}),
  plain:stdMat({}),
  metal:stdMat({roughness:.35,metalness:.6}),
  glow:new THREE.MeshStandardMaterial({color:0x9ff3ff,emissive:0x5fe8ff,emissiveIntensity:1.4,roughness:.3}),
  flame:new THREE.MeshBasicMaterial({color:0xffb347,toneMapped:false}),
  lamp:stdMat({color:new THREE.Color(0x3a3a30),emissiveMap:TX.lampE,roughness:.5}),
  awning:stdMat({side:THREE.DoubleSide,roughness:.9}),
  plaza:stdMat({map:TX.plaza,roughness:.95}),
  dirtPlaza:stdMat({map:TX.dirt,roughness:1}),
  water:new THREE.MeshStandardMaterial({color:0x4aa0c8,roughness:.1,metalness:.1})};
function setNight(f){for(const m of winMats)m.emissiveIntensity=f*(m===MAT.lamp?3.6:2.2)}

/* ---------- geometry helpers ---------- */
const unitBox=()=>{const g=new THREE.BoxGeometry(1,1,1);g.translate(0,.5,0);return g};
const unitCyl=(s,top)=>{const g=new THREE.CylinderGeometry(top==null?.5:top,.5,1,s||10);g.translate(0,.5,0);return g};
const unitCone=s=>{const g=new THREE.ConeGeometry(.5,1,s||10);g.translate(0,.5,0);return g};
function gableGeo(){const P=[-.5,0,-.5,-.5,1,0,-.5,0,.5, .5,0,.5,.5,1,0,.5,0,-.5, -.5,0,-.5,.5,0,-.5,.5,1,0, -.5,0,-.5,.5,1,0,-.5,1,0, -.5,0,.5,-.5,1,0,.5,1,0, -.5,0,.5,.5,1,0,.5,0,.5];
  const U=[0,0,.5,1,1,0, 0,0,.5,1,1,0, 0,0,1,0,1,1, 0,0,1,1,0,1, 0,0,0,1,1,1, 0,0,1,1,1,0];
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.computeVertexNormals();return g}
/* hipped roof: a ridge shorter than the house, sloping on all four sides, the classic thatched cottage */
function hipGeo(r){r=r==null?.32:r;const A=[-.5,0,-.5],B=[.5,0,-.5],C=[.5,0,.5],D=[-.5,0,.5],E=[-.5+r,1,0],F=[.5-r,1,0];const P=[],U=[];
  const tri=(a,b,c,ua,ub,uc)=>{P.push(...a,...b,...c);U.push(...ua,...ub,...uc)};
  tri(D,C,F,[0,0],[1,0],[1-r,1]);tri(D,F,E,[0,0],[1-r,1],[r,1]);tri(B,A,E,[0,0],[1,0],[1-r,1]);tri(B,E,F,[0,0],[1-r,1],[r,1]);
  tri(A,D,E,[0,0],[1,0],[.5,1]);tri(C,B,F,[0,0],[1,0],[.5,1]);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.computeVertexNormals();return g}
function merge(parts){let pos=[],nor=[],col=[];
  for(const p of parts){const g=p.g.index?p.g.toNonIndexed():p.g;g.computeVertexNormals();const a=g.attributes.position.array,n=g.attributes.normal.array;
    for(let i=0;i<a.length;i+=3){pos.push(a[i],a[i+1],a[i+2]);nor.push(n[i],n[i+1],n[i+2]);col.push(p.c[0],p.c[1],p.c[2])}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));return g}
const tr=(g,x,y,z,sx,sy,sz)=>{g.scale(sx,sy,sz);g.translate(x,y,z);return g};
const TRUNK=[.28,.2,.13],LEAF=[1,1,1];
/* trees built from lumpy leaf clusters with darker undersides, so forests read as canopy instead of balls */
function leafTree(seed,kind){const r=mulberry32(seed),pos=[],nor=[],col=[];
  const push=(g,cf,smooth)=>{if(smooth&&g.index)g.computeVertexNormals();g=g.index?g.toNonIndexed():g;if(!smooth)g.computeVertexNormals();const a=g.attributes.position.array,n=g.attributes.normal.array;for(let i=0;i<a.length;i+=3){pos.push(a[i],a[i+1],a[i+2]);nor.push(n[i],n[i+1],n[i+2]);const c=cf(a[i],a[i+1],a[i+2]);col.push(c[0],c[1],c[2])}};
  const trunk=new THREE.CylinderGeometry(.022,.04,kind==='con'?.2:.24,6);trunk.translate(0,kind==='con'?.1:.12,0);push(trunk,()=>TRUNK);
  if(kind==='con'){for(let t=0;t<5;t++){const cg=new THREE.ConeGeometry(.2-t*.033,.16,9,1);const p=cg.attributes.position;for(let i=0;i<p.count;i++){if(p.getY(i)<0){const k=.85+r()*.3;p.setX(i,p.getX(i)*k);p.setZ(i,p.getZ(i)*k);p.setY(i,p.getY(i)-r()*.02)}}
    /* each tier of branches is lit at its outer edge and shaded towards the trunk under the tier above, so the tiers read */
    const rw=.2-t*.033;cg.translate(0,.12+t*.072,0);push(cg,(x,y,z)=>{const h=clamp((y-.04)/.42,0,1),edge=clamp(Math.hypot(x,z)/rw,0,1),ao=(.55+.6*edge*edge)*(.86+.22*h);return[ao*(.86+.08*h),ao*.98,ao*(.92-.08*h)]},true)}}
  else{/* soft, rounded leaf clumps: smooth normals and a lumpy surface that stays closed (shared corners move together) */
    const n=6+((r()*3)|0),sd=r()*100;for(let b=0;b<n;b++){const ig=new THREE.IcosahedronGeometry(.5,b<3?1:0),P=ig.attributes.position,N=ig.attributes.normal;
    for(let i=0;i<P.count;i++){const x=P.getX(i),y=P.getY(i),z=P.getZ(i),l=Math.hypot(x,y,z)||1;const k=.84+.3*(Math.sin(x*9.1+sd+b)*Math.cos(z*8.3-sd)*.5+.5);P.setXYZ(i,x*k,y*k,z*k);N.setXYZ(i,x/l,y/l,z/l)}
    const a=r()*6.283,d=b===0?0:.06+r()*.07,s=b===0?.24:.13+r()*.08;ig.scale(s,s*.85,s);ig.translate(Math.cos(a)*d,.27+(b===0?.03:r()*.1-.03),Math.sin(a)*d);
    for(let i=0;i<N.count;i++){const nx=N.getX(i)/s,ny=N.getY(i)/(s*.85),nz=N.getZ(i)/s,l=Math.hypot(nx,ny,nz)||1;N.setXYZ(i,nx/l,ny/l,nz/l)}
    const tone=.72+r()*.18;push(ig,(x,y,z)=>{const ao=(.45+.55*clamp((y-.16)/.26,0,1))*tone;return[ao,ao,ao]},true)}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));return g}

/* geometry with shared, smooth normals: pos/nor/col arrays filled part by part */
function softParts(){const pos=[],nor=[],col=[];return{pos,nor,col,
  add(g,cf){if(g.index&&!g.attributes.normal)g.computeVertexNormals();g=g.index?g.toNonIndexed():g;const a=g.attributes.position.array,n=g.attributes.normal.array;for(let i=0;i<a.length;i+=3){pos.push(a[i],a[i+1],a[i+2]);nor.push(n[i],n[i+1],n[i+2]);const c=cf(a[i],a[i+1],a[i+2]);col.push(c[0],c[1],c[2])}},
  geo(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));return g}}}
/* a round lump of leaves: a sphere pushed in and out, with normals that stay spherical so it shades soft */
function leafLump(s,sy,x,y,z,det,sd){const ig=new THREE.IcosahedronGeometry(.5,det),P=ig.attributes.position,N=ig.attributes.normal;
  for(let i=0;i<P.count;i++){const px=P.getX(i),py=P.getY(i),pz=P.getZ(i),l=Math.hypot(px,py,pz)||1;const k=.84+.3*(Math.sin(px*9.1+sd)*Math.cos(pz*8.3-sd)*.5+.5);P.setXYZ(i,px*k,py*k,pz*k);N.setXYZ(i,px/l,py/l,pz/l)}
  ig.scale(s,s*sy,s);ig.translate(x,y,z);for(let i=0;i<N.count;i++){const nx=N.getX(i)/s,ny=N.getY(i)/(s*sy),nz=N.getZ(i)/s,l=Math.hypot(nx,ny,nz)||1;N.setXYZ(i,nx/l,ny/l,nz/l)}return ig}
/* a bush: a few soft leaf lumps hugging the ground */
function bushGeo(seed){const r=mulberry32(seed),S=softParts();const n=3+((r()*2)|0);
  for(let b=0;b<n;b++){const a=r()*6.283,d=b?.04+r()*.04:0,s=b?.08+r()*.05:.13;const y=.05+(b?r()*.02:.015);
    S.add(leafLump(s,.78,Math.cos(a)*d,y,Math.sin(a)*d,0,r()*50+b),(x,yy,z)=>{const ao=.5+.5*clamp((yy-.0)/.13,0,1);return[ao,ao,ao]})}
  return S.geo()}
/* a palm: a gently bent, ringed trunk and a crown of arching fronds that droop at the tips */
function palmGeo(seed){const r=mulberry32(seed),S=softParts();
  const tk=new THREE.CylinderGeometry(.02,.033,.34,7,6);tk.translate(0,.17,0);{const P=tk.attributes.position;for(let i=0;i<P.count;i++){const y=P.getY(i);P.setX(i,P.getX(i)+y*y*.35);const ring=1+.08*Math.max(0,Math.sin(y*90));P.setX(i,(P.getX(i)-y*y*.35)*ring+y*y*.35);P.setZ(i,P.getZ(i)*ring)}}
  tk.computeVertexNormals();S.add(tk,()=>TRUNK);
  const top=[.34*.34*.35,.335,0],nf=8;
  for(let f=0;f<nf;f++){const ang=f/nf*6.283+r()*.3,L=.2+r()*.05,dx=Math.cos(ang),dz=Math.sin(ang),px=-dz,pz=dx,seg=6;const P=[],I=[];
    for(let k=0;k<=seg;k++){const t=k/seg,w=.034*Math.sin(Math.PI*Math.min(1,t*1.08))+.003,cx=top[0]+dx*t*L,cz=top[2]+dz*t*L,cy=top[1]+.05*Math.sin(Math.PI*t*.6)-.13*t*t;
      P.push(cx-px*w,cy-w*.45,cz-pz*w, cx,cy,cz, cx+px*w,cy-w*.45,cz+pz*w)}
    for(let k=0;k<seg;k++){const a=k*3,b=a+3;I.push(a,b,a+1, a+1,b,b+1, a+1,b+1,a+2, a+2,b+1,b+2)}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setIndex(I);g.computeVertexNormals();
    if(g.attributes.normal.getY(1)<0){for(let i=0;i<I.length;i+=3){const t=I[i+1];I[i+1]=I[i+2];I[i+2]=t}g.setIndex(I);g.computeVertexNormals()}
    const tone=.78+r()*.2;S.add(g,(x,y,z)=>{const ao=(.6+.4*clamp(Math.hypot(x-top[0],z)/.2,0,1))*tone;return[ao,ao,ao]})}
  S.add(leafLump(.05,1,top[0],top[1]-.01,0,1,3),()=>[.55,.55,.55]);
  return S.geo()}

/* ---------- instanced kits ---------- */
const KITS={};
/* a kit starts small and doubles as it fills, up to its maximum: most kits only ever hold a few hundred things, and reserving the maximum for every one of them took 150 MB */
function kit(name,geo,mat,max,shadow){const cap=Math.min(max,128),m=new THREE.InstancedMesh(geo,mat,cap);m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  for(let i=0;i<cap;i++)m.setColorAt(i,tmpC.setRGB(1,1,1));m.count=0;m.frustumCulled=false;m.castShadow=shadow!==false;m.receiveShadow=true;scene.add(m);KITS[name]={mesh:m,k:0,max,cap}}
function kitGrow(K,need){if(need<=K.cap)return true;if(K.cap>=K.max)return false;const nc=Math.min(K.max,Math.max(need,K.cap*2)),m=K.mesh;
  m.dispatchEvent({type:'dispose'});/* frees the old buffers on the graphics card */
  const A=new Float32Array(nc*16);A.set(m.instanceMatrix.array);const cnt=m.count;m.instanceMatrix=new THREE.InstancedBufferAttribute(A,16);m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const C=new Float32Array(nc*3).fill(1);if(m.instanceColor)C.set(m.instanceColor.array);m.instanceColor=new THREE.InstancedBufferAttribute(C,3);m.instanceColor.setUsage(THREE.DynamicDrawUsage);
  m.count=cnt;K.cap=nc;return true}
const treeMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9});

const TREEU={uEarth:{value:0},uTime:{value:0},tL:{value:null},tB:{value:null},nL:{value:null},uPh:{value:0}};
/* photo leaves and bark (Poly Haven, CC0), projected from three sides onto every crown and trunk */
{const g=new THREE.DataTexture(new Uint8Array([128,128,128,255]),1,1,THREE.RGBAFormat);g.needsUpdate=true;const nf=new THREE.DataTexture(new Uint8Array([128,128,255,255]),1,1,THREE.RGBAFormat);nf.needsUpdate=true;
 TREEU.tL.value=TREEU.tB.value=g;TREEU.nL.value=nf;let left=3;const L=new THREE.TextureLoader();
 for(const [k,f] of [['tL','t_leaf'],['tB','t_bark'],['nL','t_leaf_n']])L.load('assets/textures/'+f+'.jpg',t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;TREEU[k].value=t;if(--left<=0)TREEU.uPh.value=1},undefined,()=>{left--})}
treeMat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,TREEU);
  sh.vertexShader='uniform float uTime;varying float vTH;varying vec3 vTW,vTN;\n'+sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
  vTH=position.y;
  #ifdef USE_INSTANCING
  vec3 ip=vec3(instanceMatrix[3][0],instanceMatrix[3][1],instanceMatrix[3][2]);float gust=sin(uTime*.45+ip.x*.21+ip.z*.17)*.5+.5;
  float hgt=max(0.,position.y-.06);float sw=(sin(uTime*1.6+ip.x*3.1+ip.z*2.3)*.6+sin(uTime*2.7+ip.x*7.+ip.z*5.)*.25)*(.35+gust*.9)*hgt*hgt*.55;
  transformed.x+=sw;transformed.z+=sw*.6;
  #endif`).replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
  {vec4 tw=vec4(transformed,1.);
  #ifdef USE_INSTANCING
  tw=instanceMatrix*tw;vTN=normalize(mat3(modelMatrix)*mat3(instanceMatrix)*objectNormal);
  #else
  vTN=normalize(mat3(modelMatrix)*objectNormal);
  #endif
  vTW=(modelMatrix*tw).xyz;}`);
  sh.fragmentShader='uniform sampler2D tL,tB,nL;uniform float uPh,uEarth;varying float vTH;varying vec3 vTW,vTN;\nvec3 tri(sampler2D t,vec3 p,vec3 w){return texture2D(t,p.zy).rgb*w.x+texture2D(t,p.xz).rgb*w.y+texture2D(t,p.xy).rgb*w.z;}\n'+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
  diffuseColor.rgb*=.92+.16*smoothstep(.18,.45,vTH);
  float tf=(1.-smoothstep(5.,26.,length(vTW-cameraPosition)))*uPh;float leafW=max(smoothstep(0.,.05,diffuseColor.g-diffuseColor.r),smoothstep(.12,.2,vTH));
  vec3 tw3=pow(abs(vTN),vec3(4.));tw3/=tw3.x+tw3.y+tw3.z+1e-4;
  if(tf>.01){float lv=tri(tL,vTW*5.5,tw3).r,bv=tri(tB,vTW*vec3(14.,5.,14.),tw3).r;
    float d=mix(bv,lv,leafW);diffuseColor.rgb*=mix(1.,.45+1.1*d,tf*.85);}`).replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
  if(tf>.01){vec3 nn=tri(nL,vTW*5.5,tw3)*2.-1.;normal=normalize(normal+(viewMatrix*vec4(nn.x*vTN.z,nn.y*.4,-nn.x*vTN.x,0.)).xyz*.6*tf*leafW);}`)};
kit('plaster',unitBox(),MAT.plaster,20000);kit('stone',unitBox(),MAT.stone,32000);kit('brick',unitBox(),MAT.brick,16000);
kit('thatch',gableGeo(),MAT.thatch,4000);kit('hipThatch',hipGeo(.3),MAT.thatch2,5000);kit('timber',unitBox(),MAT.timber,8000);kit('bed',unitBox(),MAT.soil,6000,false);kit('hay',unitCone(9),MAT.thatch2,5000);kit('tiles',gableGeo(),MAT.tiles,26000);
kit('coneThatch',unitCone(12),MAT.thatch,12000);kit('coneTile',unitCone(10),MAT.tiles,4000);kit('pyr',(()=>{const g=unitCone(4);g.rotateY(Math.PI/4);return g})(),MAT.tiles,1200);
kit('tower',unitCyl(14),MAT.stone,4000);kit('office',unitBox(),MAT.office,2500);kit('glass',unitBox(),MAT.glass,2000);
kit('dome',(()=>{const g=new THREE.SphereGeometry(.5,16,8,0,Math.PI*2,0,Math.PI/2);return g})(),MAT.metal,700);
kit('box',unitBox(),MAT.plain,220000);kit('adobe',unitBox(),MAT.adobe,24000);kit('adobeCyl',unitCyl(12),MAT.adobe,8000);kit('hipTile',hipGeo(.32),MAT.tiles,6000);
kit('domeW',new THREE.SphereGeometry(.5,14,7,0,Math.PI*2,0,Math.PI/2),MAT.plain,1600);kit('cyl',unitCyl(8),MAT.plain,12000);
/* the woodcutters' work: stumps, stacked logs and their camps (drawn with the trees, so they come and go with the forest) */
kit('stump',unitCyl(7),MAT.plain,20000);kit('logs',(()=>{const g=unitCyl(7);g.computeBoundingBox();const b=g.boundingBox;g.translate(0,-(b.min.y+b.max.y)/2,0);g.rotateZ(Math.PI/2);return g})(),MAT.plain,12000);/* a log lies along x */kit('camp',unitBox(),MAT.plain,4000);
kit('ring',(()=>{const g=new THREE.TorusGeometry(.5,.05,6,24);g.rotateX(Math.PI/2);return g})(),MAT.glow,500,false);
kit('flame',unitCone(6),MAT.flame,300,false);
kit('conifer',leafTree(11,'con'),treeMat,48000);
kit('broad',leafTree(7,'broad'),treeMat,32000);
/* the painted countryside's broadleaf tree: a slim dark trunk and a full, round crown of many leaf clumps, dark underneath and lit on top */
function hamTree(seed,tall){const r=mulberry32(seed),pos=[],nor=[],col=[];
  const push=(g,cf)=>{g=g.index?g.toNonIndexed():g;const a=g.attributes.position.array,n=g.attributes.normal.array;for(let i=0;i<a.length;i+=3){pos.push(a[i],a[i+1],a[i+2]);nor.push(n[i],n[i+1],n[i+2]);const c=cf(a[i],a[i+1],a[i+2]);col.push(c[0],c[1],c[2])}};
  /* a sturdy mid-brown trunk that disappears into the crown, not a long dark stick */
  const th=tall?.3:.24,bark=()=>[.36,.26,.17],trunk=new THREE.CylinderGeometry(.02,.034,th,6);trunk.translate(0,th/2,0);push(trunk,bark);
  for(const s of [-1,1]){const br=new THREE.CylinderGeometry(.008,.014,.11,4);br.rotateZ(s*.7);br.translate(s*.04,th*.82,0);push(br,bark)}
  const cy=th+(tall?.08:.05),R=tall?.17:.2,sd=r()*100;
  /* a round core and many smaller, lumpy clumps around it, so the outline reads as leaves rather than as one big many-sided ball
     (about 250 triangles a tree, as before; far away the simple stand-ins take over) */
  const clump=(det,s,ox,oy,oz,b)=>{const ig=new THREE.IcosahedronGeometry(.5,det),P=ig.attributes.position,N=ig.attributes.normal;
    for(let i=0;i<P.count;i++){const x=P.getX(i),y=P.getY(i),z=P.getZ(i),k=.8+.38*(Math.sin(x*13.1+sd+b*1.7)*Math.cos(z*11.3-sd+b)*.5+.5)+(Math.sin(y*17.+b*3.1)*.06);
      const px=x*k*s+ox,py=y*k*s*(tall?1.2:.9)+cy+oy,pz=z*k*s+oz;P.setXYZ(i,px,py,pz);
      /* normals point out from the crown's centre, so the whole crown shades as one soft ball */
      const nx=px,ny=(py-cy)*(tall?.8:1.1),nz=pz,l=Math.hypot(nx,ny,nz)||1;N.setXYZ(i,nx/l,ny/l,nz/l)}
    const tone=.9+r()*.1;
    /* lit from above: warm, yellow-green tops; cool, darker undersides */
    push(ig,(x,y,z)=>{const t=clamp((y-(cy-R*.9))/(R*1.9),0,1),ao=(.48+.54*t)*tone*(.86+.14*clamp(Math.hypot(x,z)/R,0,1));return[ao*(.94+.1*t),ao*(.98+.04*t),ao*(1.04-.16*t)]})};
  clump(0,R*.8,0,0,0,0);
  const n=10+((r()*3)|0);for(let b=1;b<=n;b++){const a=r()*6.283,el=(r()-.3)*1.5,d=R*(.46+r()*.38),s=R*(.34+r()*.22);
    clump(0,s,Math.cos(a)*Math.cos(el)*d,Math.sin(el)*d*(tall?1.45:1),Math.sin(a)*Math.cos(el)*d,b)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));return g}
kit('hamA',hamTree(17,false),treeMat,40000);kit('hamB',hamTree(29,true),treeMat,30000);
kit('palm',palmGeo(5),treeMat,8000);
kit('bush',bushGeo(3),treeMat,80000);
kit('rock',(()=>{const g=new THREE.DodecahedronGeometry(.5,0);g.translate(0,.25,0);return g})(),stdMat({roughness:1}),6000);
tideHook(MAT.plain);tideHook(MAT.awning);
kit('fence',unitBox(),MAT.plain,30000,false);kit('lamp',unitBox(),MAT.lamp,4000,false);kit('awning',gableGeo(),MAT.awning,8000);
kit('plazaStone',unitCyl(24),MAT.plaza,400,false);kit('plazaDirt',unitCyl(18),MAT.dirtPlaza,400,false);kit('pool',unitCyl(16),inlandWaterMat(false),5000,false);
kit('townTree',leafTree(23,'broad'),treeMat,16000);
/* a wooden boat hull: pointed bow, square stern, a rising sheer line; length along x, centred on its waterline height.
   With colours it gets a tarred bottom, plank sides, a painted top strake and two thwarts to sit on. */
function boatHullGeo(colored){const S=14,K=4,P=[],C=[],I=[],c=new THREE.Color(),tar=0x3a2a1e,wood=0x8a6a44,paint=0xe8e2d4,seat=0xa8865a;
  const wOf=t=>.5*Math.pow(Math.sin(Math.PI*Math.min(1,t*.86+.14)),.55),top=t=>.22+.22*(2*t-1)**2+.12*Math.max(0,t-.72)/.28,bot=t=>-.5*(1-.65*(2*t-1)**4);
  const push=(x,y,z,hex)=>{P.push(x,y,z);c.set(hex);C.push(c.r,c.g,c.b);return P.length/3-1};
  const row=[];for(let i=0;i<=S;i++){const t=i/S,x=t-.5,w=wOf(t),yt=top(t),yb=Math.min(bot(t),yt-.12),r=[];
    for(let j=-K;j<=K;j++){const th=Math.abs(j)/K*Math.PI/2,px=w*Math.sin(th)*Math.sign(j),py=yb+(yt-yb)*(1-Math.cos(th)),f=(py-yb)/(yt-yb);r.push(push(x,py,px,f>.82?paint:f>.32?wood:tar))}row.push(r)}
  for(let i=0;i<S;i++)for(let j=0;j<2*K;j++){const a=row[i][j],b=row[i+1][j],d=row[i][j+1],e=row[i+1][j+1];I.push(a,b,d,d,b,e)}
  {const r=row[0],m=push(-.5,(top(0)+bot(0))/2,0,tar);for(let j=0;j<2*K;j++)I.push(m,r[j+1],r[j])}/* the stern board */
  const seats=[[-.18,.16],[.12,.13]];for(const [sx,sw] of seats){const t=sx+.5,w=wOf(t)*.92,y=top(t)-.12,h=.05;const q=[[-sw/2,-w],[sw/2,-w],[sw/2,w],[-sw/2,w]].map(([dx,dz])=>push(sx+dx,y,dz,seat));I.push(q[0],q[2],q[1],q[0],q[3],q[2]);
    const q2=[[-sw/2,-w],[sw/2,-w],[sw/2,w],[-sw/2,w]].map(([dx,dz])=>push(sx+dx,y-h,dz,seat));I.push(q2[0],q2[1],q2[2],q2[0],q2[2],q2[3])}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));if(colored)g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.setIndex(I);g.computeVertexNormals();return g}
/* a mast with a boom and a triangular sail, for the fishing boats; same frame as the hull */
function boatSailGeo(){const P=[],C=[],I=[],c=new THREE.Color(),push=(x,y,z,hex)=>{P.push(x,y,z);c.set(hex);C.push(c.r,c.g,c.b);return P.length/3-1};
  const box=(x0,x1,y0,y1,z0,z1,hex)=>{const v=[];for(const y of [y0,y1])for(const z of [z0,z1])for(const x of [x0,x1])v.push(push(x,y,z,hex));
    for(const f of [[0,1,3,2],[4,6,7,5],[0,4,5,1],[2,3,7,6],[0,2,6,4],[1,5,7,3]])I.push(v[f[0]],v[f[1]],v[f[2]],v[f[0]],v[f[2]],v[f[3]])};
  box(.07,.11,.1,2.1,-.02,.02,0x5a4632);box(-.3,.12,.42,.46,-.015,.015,0x5a4632);
  const a=push(.1,2.05,0,0xe8dfc8),b=push(.1,.48,0,0xe8dfc8),d=push(-.32,.48,0,0xd8ccb0);I.push(a,b,d,a,d,b);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.setIndex(I);g.computeVertexNormals();return g}
kit('boat',boatHullGeo(false),MAT.plain,400);
kit('tuft',unitCone(4),stdMat({roughness:1}),16000,false);kit('flower',new THREE.SphereGeometry(.5,5,3),MAT.plain,20000,false);
kit('animal',unitBox(),MAT.plain,1200,false);
kit('aBody',new THREE.SphereGeometry(.5,10,7),stdMat({roughness:.95}),1400,false);kit('aHead',new THREE.SphereGeometry(.5,8,6),stdMat({roughness:.9}),1400,false);
kit('aLeg',(()=>{const g=new THREE.CylinderGeometry(.5,.38,1,5);g.translate(0,-.5,0);return g})(),stdMat({roughness:.9}),5600,false);kit('car',unitBox(),MAT.plain,400,false);
kit('bird',(()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,0,.3,-1,.25,-.3,0,0,0, 0,0,.3,0,0,0,1,.25,-.3],3));g.computeVertexNormals();return g})(),new THREE.MeshBasicMaterial({color:0x2a2a2a,side:THREE.DoubleSide}),300,false);
kit('body',unitBox(),MAT.plain,900,false);kit('cart',unitBox(),MAT.plain,200);kit('cartTop',(()=>{const g=new THREE.CylinderGeometry(.5,.5,1,8,1,false,0,Math.PI);g.rotateZ(Math.PI/2);g.translate(0,.0,0);return g})(),MAT.plain,200);kit('head',new THREE.SphereGeometry(.5,6,4),MAT.plain,900,false);
function kitReset(names){for(const n of names)KITS[n].k=0}
/* ---------- only what the camera can see is drawn: buildings, trees and props outside the view cost nothing ---------- */
const CULLK={dirty:true,last:0,sig:'',fr:new THREE.Frustum(),pm:new THREE.Matrix4(),k2:0,cx:0,cy:0,cz:0};
const cullable=n=>n==='bridge'||BUILD_KITS.includes(n)||TREE_KITS.includes(n)||GREEN_KITS.includes(n);
/* town gardens and orchards have their own lists, sharing the trees' shapes, so a growing town never makes the whole forest be redone */
const GREEN_KITS=[];
function gKit(n){const g='g_'+n;if(!KITS[g]){const B=KITS[n];if(!B)return n;kit(g,B.mesh.geometry,B.mesh.material,Math.min(B.max,24000),B.mesh.castShadow);if(B.lodP)KITS[g].lodP=B.lodP;GREEN_KITS.push(g)}return g}
function rebuildGreen(){kitReset(GREEN_KITS);for(const g of TOWN_GREEN)add(gKit(g[0]),g[1],g[2],g[3],g[4],g[5],g[6],g[7],g[8]);kitCommit(GREEN_KITS)}
/* the sphere around each copy, for culling: worked out from its matrix */
function spheresOf(K,M,from,n,cs){const g=K.mesh.geometry;if(!g.boundingSphere)g.computeBoundingSphere();const bc=g.boundingSphere.center,br=g.boundingSphere.radius;
  for(let i=from;i<n;i++){const o=i*16;cs[i*4]=M[o]*bc.x+M[o+4]*bc.y+M[o+8]*bc.z+M[o+12];cs[i*4+1]=M[o+1]*bc.x+M[o+5]*bc.y+M[o+9]*bc.z+M[o+13];cs[i*4+2]=M[o+2]*bc.x+M[o+6]*bc.y+M[o+10]*bc.z+M[o+14];
    cs[i*4+3]=br*Math.max(Math.hypot(M[o],M[o+1],M[o+2]),Math.hypot(M[o+4],M[o+5],M[o+6]),Math.hypot(M[o+8],M[o+9],M[o+10]))}return cs}
/* the freshly filled buffers become the kit's store and the graphics buffers get the spare pair, so a town rebuild no longer copies every part of every town;
   the cull, which runs before the next draw, fills the spare with what is in view. With culling switched off the store is copied as before. */
function cullStore(K){const n=K.k,IM=K.mesh.instanceMatrix,A=IM.array,IC=K.mesh.instanceColor;
  if(settings.cull===false){K.mm=A.slice(0,n*16);K.mc=IC?IC.array.slice(0,n*3):null}
  else{const sm=K.mm&&K.mm.length===A.length&&K.mm!==A?K.mm:new Float32Array(A.length);K.mm=A;IM.array=sm;
    if(IC){const sc=K.mc&&K.mc.length===IC.array.length&&K.mc!==IC.array?K.mc:new Float32Array(IC.array.length).fill(1);K.mc=IC.array;IC.array=sc}else K.mc=null}
  K.n=n;
  const cs=K.cs=new Float32Array(n*4),pre=Math.min(n,K.csPre||0);K.csPre=0;
  /* towns replayed from their records bring their spheres along; only the rest are worked out */
  if(pre&&K.csS){cs.set(K.csS.subarray(0,pre*4));spheresOf(K,K.mm,pre,n,cs)}else spheresOf(K,K.mm,0,n,cs);
  cullCells(K);K.culled=true;CULLK.dirty=true}
function cullStoreOld(K){const n=K.k,A=K.mesh.instanceMatrix.array;K.mm=A.slice(0,n*16);K.mc=K.mesh.instanceColor?K.mesh.instanceColor.array.slice(0,n*3):null;K.n=n;
  const g=K.mesh.geometry;if(!g.boundingSphere)g.computeBoundingSphere();const bc=g.boundingSphere.center,br=g.boundingSphere.radius,M=K.mm,cs=K.cs=new Float32Array(n*4);
  for(let i=0;i<n;i++){const o=i*16;cs[i*4]=M[o]*bc.x+M[o+4]*bc.y+M[o+8]*bc.z+M[o+12];cs[i*4+1]=M[o+1]*bc.x+M[o+5]*bc.y+M[o+9]*bc.z+M[o+13];cs[i*4+2]=M[o+2]*bc.x+M[o+6]*bc.y+M[o+10]*bc.z+M[o+14];
    cs[i*4+3]=br*Math.max(Math.hypot(M[o],M[o+1],M[o+2]),Math.hypot(M[o+4],M[o+5],M[o+6]),Math.hypot(M[o+8],M[o+9],M[o+10]))}
  K.culled=true;CULLK.dirty=true}
/* culling in groups: when a kit is stored its copies are sorted into map cells of 6 tiles, split by size, with one sphere around each group.
   A cull then tests the groups first and only looks at the copies in groups that are in view and big enough on screen, instead of every copy every time. */
function cullCells(K){const n=K.n,cs=K.cs,CS=6,GX=Math.ceil(W/CS)+2,GZ=Math.ceil(H/CS)+2,NK=GX*GZ*5,key=new Int32Array(n),cnt=new Int32Array(NK);
  for(let i=0;i<n;i++){const r=cs[i*4+3],gx=clamp(Math.floor((cs[i*4]+W/2)/CS)+1,0,GX-1),gz=clamp(Math.floor((cs[i*4+2]+H/2)/CS)+1,0,GZ-1),sc=r<.02?0:r<.05?1:r<.12?2:r<.3?3:4,k=(gz*GX+gx)*5+sc;key[i]=k;cnt[k]++}
  const at=new Int32Array(NK).fill(-1);let nc=0;for(let k=0;k<NK;k++)if(cnt[k])at[k]=nc++;
  const st=new Int32Array(nc+1);for(let k=0;k<NK;k++)if(cnt[k])st[at[k]+1]=cnt[k];for(let c=0;c<nc;c++)st[c+1]+=st[c];
  const fill=st.slice(0,nc),ord=new Int32Array(n),bb=new Float32Array(nc*6),mr=new Float32Array(nc);for(let c=0;c<nc;c++){bb[c*6]=bb[c*6+1]=bb[c*6+2]=1e9;bb[c*6+3]=bb[c*6+4]=bb[c*6+5]=-1e9}
  for(let i=0;i<n;i++){const c=at[key[i]];ord[fill[c]++]=i;const x=cs[i*4],y=cs[i*4+1],z=cs[i*4+2],r=Math.max(0,cs[i*4+3]),o=c*6;
    if(x-r<bb[o])bb[o]=x-r;if(y-r<bb[o+1])bb[o+1]=y-r;if(z-r<bb[o+2])bb[o+2]=z-r;if(x+r>bb[o+3])bb[o+3]=x+r;if(y+r>bb[o+4])bb[o+4]=y+r;if(z+r>bb[o+5])bb[o+5]=z+r;if(r>mr[c])mr[c]=r}
  const cb=new Float32Array(nc*5);for(let c=0;c<nc;c++){const o=c*6;cb[c*5]=(bb[o]+bb[o+3])/2;cb[c*5+1]=(bb[o+1]+bb[o+4])/2;cb[c*5+2]=(bb[o+2]+bb[o+5])/2;
    cb[c*5+3]=Math.hypot(bb[o+3]-bb[o],bb[o+4]-bb[o+1],bb[o+5]-bb[o+2])/2;cb[c*5+4]=mr[c]}
  K.cN=nc;K.cSt=st;K.cOrd=ord;K.cB=cb;if(!K._cl||K._cl.length<n)K._cl=new Int32Array(Math.max(16,n));K._cst=-1}
/* the copies worth testing in this cull: the groups in view, minus groups whose biggest copy is under a pixel. Worked out once per kit per cull. */
function cullCands(K,P,margin){if(K._cst===CULLK.last&&K._cm===margin)return K._cn;K._cst=CULLK.last;K._cm=margin;
  if(!K.cOrd||K.cOrd.length!==K.n)cullCells(K);const cb=K.cB,st=K.cSt,ord=K.cOrd,cl=K._cl,k2=CULLK.k2,cx=CULLK.cx,cy=CULLK.cy,cz=CULLK.cz;let m=0;
  for(let c=0;c<K.cN;c++){const x=cb[c*5],y=cb[c*5+1],z=cb[c*5+2],R=cb[c*5+3],r=-(R+margin);let ok=true;
    for(let p=0;p<6;p++){const q=P[p];if(q.normal.x*x+q.normal.y*y+q.normal.z*z+q.constant<r){ok=false;break}}if(!ok)continue;
    if(k2>0){const d=Math.max(0,Math.sqrt((x-cx)**2+(y-cy)**2+(z-cz)**2)-R),mr=cb[c*5+4];if(mr*mr<k2*d*d)continue}
    for(let j=st[c];j<st[c+1];j++)cl[m++]=ord[j]}
  K._cn=m;return m}
/* copying an instance without making a subarray each time */
/* show the first n instances of a kit, sending only those to the graphics card */
function kitUp(K,n){K.mesh.count=n;const c=Math.max(1,n),IM=K.mesh.instanceMatrix;IM.needsUpdate=true;IM.updateRange.offset=0;IM.updateRange.count=c*16;const IC=K.mesh.instanceColor;if(IC){IC.needsUpdate=true;IC.updateRange.offset=0;IC.updateRange.count=c*3}}
function copy16(D,d,S,o){for(let j=0;j<16;j++)D[d+j]=S[o+j]}
function copy3(D,d,S,o){D[d]=S[o];D[d+1]=S[o+1];D[d+2]=S[o+2]}
function cullKit(K,P,margin){const A=K.mesh.instanceMatrix.array,C=K.mesh.instanceColor?K.mesh.instanceColor.array:null,cs=K.cs,M=K.mm,MC=K.mc;let v=0;
  const NC=cullCands(K,P,margin),CL=K._cl;for(let j=0;j<NC;j++){const i=CL[j],x=cs[i*4],y=cs[i*4+1],z=cs[i*4+2],r=-(cs[i*4+3]+margin);let ok=true;
    for(let p=0;p<6;p++){const q=P[p];if(q.normal.x*x+q.normal.y*y+q.normal.z*z+q.constant<r){ok=false;break}}
    if(!ok)continue;if((cs[i*4+3]*cs[i*4+3])<CULLK.k2*((x-CULLK.cx)**2+(y-CULLK.cy)**2+(z-CULLK.cz)**2))continue;copy16(A,v*16,M,i*16);if(C&&MC)copy3(C,v*3,MC,i*3);v++}
  K.mesh.count=v;const IM=K.mesh.instanceMatrix;IM.needsUpdate=true;if(IM.updateRange){IM.updateRange.offset=0;IM.updateRange.count=v*16}
  if(K.mesh.instanceColor){const IC=K.mesh.instanceColor;IC.needsUpdate=true;if(IC.updateRange){IC.updateRange.offset=0;IC.updateRange.count=v*3}}}
/* re-cull when the camera has moved or turned, at most a dozen times a second while it moves */
function cullTick(){if(typeof cam==='undefined')return;const now=performance.now();
  const sig=cam.position.x.toFixed(2)+','+cam.position.y.toFixed(2)+','+cam.position.z.toFixed(2)+','+cam.quaternion.x.toFixed(3)+','+cam.quaternion.y.toFixed(3)+','+cam.quaternion.w.toFixed(3);
  if(!CULLK.dirty&&(sig===CULLK.sig||now-CULLK.last<80))return;CULLK.sig=sig;CULLK.last=now;CULLK.dirty=false;
  cam.updateMatrixWorld();CULLK.pm.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse);CULLK.fr.setFromProjectionMatrix(CULLK.pm);
  const P=CULLK.fr.planes,margin=.6+(typeof camDist!=='undefined'?camDist:10)*.12;
  /* things smaller than about a pixel on screen are left out: zoomed out, tens of thousands of tiny parts (crops, posts, steps) would cost
     a million triangles and their shadows while showing nothing. The size test uses the real drawing resolution, so they come back as you zoom in. */
  {const hp=Math.max(1,renderer.domElement.height),k=.6*Math.tan(cam.fov*Math.PI/360)/(hp/2);CULLK.k2=settings.tinyCull===false?0:k*k;CULLK.cx=cam.position.x;CULLK.cy=cam.position.y;CULLK.cz=cam.position.z}
  for(const nm in KITS){const K=KITS[nm];if(K.culled&&K.n)cullKit(K,P,margin);else if(K.culled){K.mesh.count=0}}
  if(typeof shadowForce!=='undefined')shadowForce=true}
/* static things (towns, trees) redraw the shadows at once; moving things (animals, birds, grass) only ask for a redraw a few times a second */
function kitCommit(names){if(typeof shadowForce!=='undefined'){if(names.some(cullable))shadowForce=true;else shadowSoft=true}for(const n of names){const K=KITS[n];if(cullable(n)){cullStore(K);continue}K.mesh.count=K.k;const IM=K.mesh.instanceMatrix;IM.needsUpdate=true;IM.updateRange.offset=0;IM.updateRange.count=Math.max(1,K.k)*16;if(K.mesh.instanceColor){const IC=K.mesh.instanceColor;IC.needsUpdate=true;IC.updateRange.offset=0;IC.updateRange.count=Math.max(1,K.k)*3}}}
function add(name,x,y,z,sx,sy,sz,rot,hex,tilt){const K=KITS[name];if(K.k>=K.cap&&!kitGrow(K,K.k+1))return;if(SJ)sjTouch(name,K);if(CAPT)CAPT.push(x,z,sx,sz,rot||0);
  dummy.position.set(x,y,z);dummy.rotation.set(tilt||0,rot||0,0);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();
  K.mesh.setMatrixAt(K.k,dummy.matrix);K.mesh.setColorAt(K.k,tmpC.set(hex==null?0xffffff:hex).convertSRGBToLinear());K.k++;
  if(REC){const r=REC.k[name]||(REC.k[name]=[]);const m=dummy.matrix.elements;for(let i=0;i<16;i++)r.push(m[i]);r.push(tmpC.r,tmpC.g,tmpC.b)}
  if(TREC){const r=TREC.k[name]||(TREC.k[name]=[]);const m=dummy.matrix.elements;for(let i=0;i<16;i++)r.push(m[i]);r.push(tmpC.r,tmpC.g,tmpC.b,TREC.t)}}
let REC=null,TREC=null;
/* ---------- buildings are solid things: each one's real footprint is measured from what it is built of, and nothing may stand inside another ---------- */
let CAPT=null,FOOTREC=null;const FOOT=new Map(),FCELL=.25;
function footOf(a,ox,oz,rot,pad){if(!a.length)return null;const c=Math.cos(rot),s=Math.sin(rot);let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;
  for(let i=0;i<a.length;i+=5){const dx=a[i]-ox,dz=a[i+1]-oz,lx=dx*c-dz*s,lz=dx*s+dz*c,dr=a[i+4]-rot,cd=Math.abs(Math.cos(dr)),sd=Math.abs(Math.sin(dr)),hx=Math.abs(a[i+2])/2,hz=Math.abs(a[i+3])/2;
    const ex=cd*hx+sd*hz,ez=sd*hx+cd*hz;if(lx-ex<x0)x0=lx-ex;if(lx+ex>x1)x1=lx+ex;if(lz-ez<z0)z0=lz-ez;if(lz+ez>z1)z1=lz+ez}
  const mx=(x0+x1)/2,mz=(z0+z1)/2,hw=(x1-x0)/2+pad,hd=(z1-z0)/2+pad;return {x:ox+mx*c+mz*s,z:oz-mx*s+mz*c,hw,hd,c,s,r:Math.hypot(hw,hd)}}
function footEach(o,cb){for(let gx=Math.floor((o.x-o.r)/FCELL);gx<=Math.floor((o.x+o.r)/FCELL);gx++)for(let gz=Math.floor((o.z-o.r)/FCELL);gz<=Math.floor((o.z+o.r)/FCELL);gz++)if(cb(gx*100003+gz))return true;return false}
function footAdd(o){footEach(o,k=>{let L=FOOT.get(k);if(!L)FOOT.set(k,L=[]);L.push(o)});if(FOOTREC)FOOTREC.push(o)}
/* two footprints overlap unless some edge direction separates them */
function obbHit(a,b){const dx=b.x-a.x,dz=b.z-a.z;if(dx*dx+dz*dz>(a.r+b.r)**2)return false;
  for(const [nx,nz] of [[a.c,-a.s],[a.s,a.c],[b.c,-b.s],[b.s,b.c]]){const ra=a.hw*Math.abs(a.c*nx-a.s*nz)+a.hd*Math.abs(a.s*nx+a.c*nz),rb=b.hw*Math.abs(b.c*nx-b.s*nz)+b.hd*Math.abs(b.s*nx+b.c*nz);
    if(Math.abs(dx*nx+dz*nz)>ra+rb)return false}return true}
function footHits(o,ign){return footEach(o,k=>{const L=FOOT.get(k);if(L)for(const q of L)if(q.t!==ign&&obbHit(o,q))return true;return false})}
/* build something as a solid thing: if it would stand inside anything already there, it is taken down again */
/* what a building added is noted as it goes (each kit the first time it is touched, with its count then), so a building that does not fit can be taken
   down again without first writing down the count of every one of the 150 kits for every house */
let SJ=null,SJID=0;
function sjTouch(name,K){if(K._sj===SJ.id)return;K._sj=SJ.id;SJ.n.push(name);SJ.k.push(K.k);SJ.r.push(REC&&REC.k[name]?REC.k[name].length:0)}
function solid(fn,ox,oz,rot,force,pad,tag){const em0=emitters.length,tall0=MCTX&&MCTX.tall?MCTX.tall.length:0,fr={id:++SJID,n:[],k:[],r:[]},psj=SJ;SJ=fr;
  const prev=CAPT;CAPT=[];let cap;try{fn()}finally{cap=CAPT;CAPT=prev;SJ=psj;
    /* the outer building, if any, takes over the notes so it can undo these too */
    if(psj)for(let i=0;i<fr.n.length;i++){psj.n.push(fr.n[i]);psj.k.push(fr.k[i]);psj.r.push(fr.r[i]);KITS[fr.n[i]]._sj=psj.id}}
  const o=footOf(cap,ox,oz,rot,pad??.002);if(!o)return true;
  if(!force&&footHits(o,tag==='tower'?'wall':null)){for(let i=fr.n.length-1;i>=0;i--){const nm=fr.n[i];KITS[nm].k=fr.k[i];if(REC&&REC.k[nm])REC.k[nm].length=fr.r[i]}
    if(psj){/* rolled back: the outer notes for these stay valid, they hold the counts from before */}
    emitters.length=em0;if(MCTX&&MCTX.tall)MCTX.tall.length=tall0;return false}
  o.f=!!force;o.t=tag||(force?'big':'house');footAdd(o);if(prev)for(const v of cap)prev.push(v);return true}
/* place relative to a rotated frame */
function P(name,cx,cy,cz,rot,dx,dz,dy,sx,sy,sz,hex,extraRot){const c=Math.cos(rot),s=Math.sin(rot);add(name,cx+dx*c+dz*s,cy+dy,cz-dx*s+dz*c,sx,sy,sz,rot+(extraRot||0),hex)}
const BUILD_KITS=['adobe','adobeCyl','hipTile','domeW','hipThatch','timber','bed','hay','plaster','stone','brick','thatch','tiles','coneThatch','coneTile','pyr','tower','office','glass','dome','box','cyl','ring','flame','fence','lamp','awning','plazaStone','plazaDirt','pool','townTree','boat'];
kit('puddle',unitCyl(14),inlandWaterMat(false),6000,false);kit('reed',unitCone(4),stdMat({roughness:1}),12000,false);
kit('hedge',unitBox(),stdMat({roughness:1}),20000,false);kit('farmW',unitBox(),MAT.plain,3000);kit('farmR',gableGeo(),MAT.plain,3000);
/* painted looks: leaves turn a deeper, olive woodland green (bright lime crowns read as plastic in a painted scene) */
{const _tb=treeMat.onBeforeCompile;treeMat.onBeforeCompile=sh=>{_tb(sh);sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
  if(uEarth>0.){vec3 c=diffuseColor.rgb;float gl=smoothstep(.0,.04,c.g-max(c.r,c.b));vec3 d=c*vec3(.52,.58,.42);d=mix(d,vec3(dot(d,vec3(.3,.59,.11))),.22);diffuseColor.rgb=mix(c,d,gl*uEarth);}`)}}
const TREE_KITS=['hamA','hamB','conifer','broad','palm','bush','rock','tuft','flower','puddle','reed','hedge','farmW','farmR','stump','logs','camp'];
/* the countryside: hedgerows, dry-stone walls or fences round the fields, and a farmstead with a barn here and there */
function countryside(){const farm=new Set();
  for(const i of fieldTiles){const o=owner[i],n=o>=0?nations[o]:null;if(!n)continue;const e=n.era,x=i%W,y=(i/W)|0,X0=x-W/2,Z0=y-H/2;
    const px_=!!LK.pixel,kind=e<=1?'stone':e>=5?'fence':hash(i*3.3)<(px_?.8:.6)?'hedge':'stone',col=kind==='hedge'?(px_?0x34502a:0x46682e):kind==='stone'?(px_?0x7f7a6e:0x9a948a):(px_?0x6e5840:0xd8cfbc),hh=kind==='hedge'?(px_?.022:.03):kind==='stone'?.018:.016,th=kind==='hedge'?(px_?.05:.03):kind==='stone'?.02:.004;
    for(let d=0;d<4;d++){const X=x+DX[d],Y=y+DY[d];if(X>=0&&Y>=0&&X<W&&Y<H&&fieldTiles.has(Y*W+X)&&hash(i*7+d)<.55)continue;
      const horiz=DY[d]!==0,cx=X0+.5+DX[d]*.5,cz=Z0+.5+DY[d]*.5,segs=4;
      for(let s=0;s<segs;s++){const f=(s+.5)/segs-.5,px=horiz?cx+f:cx,pz=horiz?cz:cz+f,gy=groundY(px,pz);if(gy<waterY+.03)continue;
        if(!(px_&&kind==='hedge'))add('hedge',px,gy-.008,pz,horiz?.25:th,hh,horiz?th:.25,0,col)}
      if(kind==='hedge'&&hash(i*11+d)<.35){const px=cx+(horiz?(hash(i+d)-.5)*.7:0),pz=cz+(horiz?0:(hash(i+d)-.5)*.7);add('broad',px,groundY(px,pz)-.01,pz,.5,.55,.5,hash(i)*6,0x5a7a3a)}
      /* the pixel look: hedgerows are lumpy lines of shrubs, some in flower, as in an old painted countryside */
      if(kind==='hedge'&&px_)for(let s=0;s<9;s++){const f=(s+.5)/9-.5+(hash(i*3+d*7+s)-.5)*.06,px=horiz?cx+f:cx,pz=horiz?cz:cz+f,gy=groundY(px,pz),hv=hash(i*5+d*3+s);if(gy<waterY+.03)continue;
        add('bush',px,gy-.012,pz,.26+hv*.1,.2+hv*.1,.26+hv*.1,hv*6,hv<.2?0x5f7a3c:hv<.6?0x42602c:0x3a5628);if(hv>.72)add('flower',px+.02,gy+.04,pz+.015,.013,.01,.013,0,hv>.86?0xe8e2d0:0xc85a5a)}}
    /* a farmstead on open ground beside the field */
    if(e>=1&&e<=6&&hash(i*17.1)<.18)for(let d=0;d<4;d++){const X=x+DX[d],Y=y+DY[d];if(X<0||Y<0||X>=W||Y>=H)continue;const j=Y*W+X;
      if(fieldTiles.has(j)||occupied.has(j)||farm.has(j)||isWater(j)||owner[j]!==o)continue;farm.add(j);
      const fx=X-W/2+.5-DX[d]*.25,fz=Y-H/2+.5-DY[d]*.25,gy=groundY(fx,fz),rot=hash(j)*1.57;if(gy<waterY+.04)break;
      const wall=e<=2?0x9a8468:e<=4?0xf0e8d8:0xb8604a,roof=e<=2?0xc8b070:0x8e3f2c,c=Math.cos(rot),s=Math.sin(rot);
      if(e>=4&&typeof farmModel==='function'&&farmModel(n,i,j,fx,gy,fz,rot,e))break;if(e>=6)break;
      add('farmW',fx,gy-.02,fz,.11,.055,.07,rot,wall);add('farmR',fx,gy+.035,fz,.12,.045,.08,rot,roof);/* the farmhouse */
      const bx=fx+.11*c,bz=fz-.11*s;add('farmW',bx,groundY(bx,bz)-.02,bz,.14,.065,.09,rot+Math.PI/2,e>=3?0x8a3a2a:0x7a6450);add('farmR',bx,groundY(bx,bz)+.045,bz,.15,.055,.1,rot+Math.PI/2,e>=4?0x5a5e66:0xc8b070);/* the barn */
      if(e>=2){const hx=fx-.07*c+.08*s,hz=fz+.07*s+.08*c;add('tuft',hx,groundY(hx,hz)-.01,hz,.035,.045,.035,0,0xd8c070)}
      break}}
  return farm}
/* marshes: wet, low, flat ground beside rivers, lakes and coasts */
const MARSH_C=[72,88,52];let MARSH=null,marshVer=-1;
function marshAt(i){if(!MARSH||MARSH.length!==N||marshVer!==terrVer){MARSH=new Uint8Array(N);marshVer=terrVer;
    for(let j=0;j<N;j++){if(isWater(j)||!(biome[j]===4||biome[j]===5||biome[j]===8))continue;const m=baseMoist[j]+moistD[j]+(climate.rain-.5)*.7;if(h[j]-sea>.035||m<.5||hash(j*1.71)>.8)continue;
      const x=j%W,y=(j/W)|0;let wet=false;for(let dy=-2;dy<=2&&!wet;dy++)for(let dx=-2;dx<=2;dx++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const q=Y*W+X;if(isWater(q)||river[q]){wet=true;break}}if(wet)MARSH[j]=1}}
  return MARSH[i]===1}

/* ---------- building recipes ---------- */
/* roofs in warm, weathered colours: red tiles, warm grey slate with a little moss, and old brown shingle, for a cozy village */
const ROOF_RED=[0xa04a32,0x8e3f2c,0xb3593a,0x7c3a2b,0x9a5236],ROOF_SLATE=[0x6c6462,0x5e5856,0x76706a,0x6a6e52,0x7a5e4a];
function house(x,y,z,rot,w,d,hh,wall,wallTint,roof,roofTint,chim,o){
  const hk=o?o.hk:.5,floors=hh>.075?2:1,gableFront=hk>.45&&roof!=='thatch';
  if(floors===2&&wall==='plaster'&&hk<.75){/* jettied upper floor: stone or plaster below, timber-framed above and overhanging */
    const lo=hh*.48;add(hk<.35?'stone':'plaster',x,y-.02,z,w,lo+.02,d,rot,hk<.35?0xd8d2c6:wallTint);
    add('plaster',x,y+lo,z,w*1.05,hh-lo,d*1.08,rot,wallTint);framing(x,y+lo,z,rot,w*1.05,d*1.08,hh-lo,1);
    P('box',x,y+lo-.003,z,rot,0,d*.54,0,w*1.06,.004,.006,0x3a2a1c)}
  else{add(wall,x,y-.02,z,w,hh+.02,d,rot,wallTint);if(wall==='plaster')framing(x,y,z,rot,w,d,hh,floors)}
  const rh=roof==='thatch'?.85:AR().roofH*(gableFront?1.25:1);
  if(gableFront)P(roof,x,y+hh,z,rot,0,0,0,d*1.2,hh*rh,w*1.1,roofTint,Math.PI/2);else P(roof,x,y+hh,z,rot,0,0,0,w*1.12,hh*rh,d*1.25,roofTint);
  if(roof!=='thatch'){eaves(x,y+hh,z,rot,w*(gableFront?1.08:1.1),d*(gableFront?1.17:1.22));if(hh>.07&&hk>.4)P('cyl',x,y-.02,z,rot,w/2+.002,d/2+.002,0,.0035,hh+.02,.0035,0x5a5a58)}
  if(gableFront&&hk>.7){/* a dormer looking onto the street */P(wall,x,y+hh,z,rot,0,d*.25,0,.03,.022,.025,wallTint);P(roof,x,y+hh+.022,z,rot,0,d*.25,0,.034,.014,.03,roofTint,Math.PI/2);P('box',x,y+hh,z,rot,0,d*.25+.0128,.006,.014,.012,.002,0x1d232a)}
  facade(x,y,z,rot,w*(floors===2?1.04:1),d*(floors===2?1.06:1),hh,hk,floors);
  if(chim)chimney(x,y+hh*.6,z,rot,w,d,y+hh+hh*rh*.9,hk,hash(hk*23)<.35);
  if(!o)return;
  if(o.annex&&hk<.5){const aw=w*.5,ad=d*.75,ah=hh*.75,ax=(hk<.25?-1:1)*(w/2+aw*.35);P(wall,x,y-.02,z,rot,ax,-d*.1,0,aw,ah+.02,ad,wallTint);P(roof,x,y+ah,z,rot,ax,-d*.1,0,ad*1.2,ah*.8,aw*1.25,roofTint,Math.PI/2)}
  if(o.garden){const gz=-(d/2+.045),gw=w*1.05,gd=.07,ft=.004,fh=.018,fc=o.fenceCol||0x8a6a46;
    P('fence',x,y,z,rot,0,gz-gd/2,0,gw,fh,ft,fc);P('fence',x,y,z,rot,-gw/2,gz,0,ft,fh,gd,fc);P('fence',x,y,z,rot,gw/2,gz,0,ft,fh,gd,fc);
    P('fence',x,y-.008,z,rot,-gw*.2,gz,0,gw*.45,.012,gd*.8,hk<.5?0x6a5236:0x5f8a3a);
    if(hk>.6)P('townTree',x,y-.01,z,rot,gw*.25,gz,0,.2,.2,.2,0x5a8a3c)}
  if(o.lamp){P('cyl',x,y,z,rot,w*.6,d/2+.03,0,.004,.075,.004,0x2e2e2e);P('lamp',x,y+.07,z,rot,w*.6,d/2+.03,0,.012,.014,.012)}}
function smokeAt(x,y,z,dark,rate){emitters.push({x,y,z,dark,rate})}
function cultureLandmark(n,x,y,z,e,nc){const cu=cultOf(n);if(e<1||e>4)return false;
  if(cu==='east'&&e>=3){/* a Japanese castle: a sloping stone base, a white keep of four storeys under dark curved roofs, and a white outer wall with corner turrets */
    const S=.4,wall=0xf2f0ea,rf=0x34383e;add('moat',x,y-.012,z,S*2.9,.02,S*2.9,0);
    for(let k=0;k<4;k++){const s=S*2-k*.04;add('stone',x,y-.03+k*.018,z,s,.022,.022,0,0xa8a49a);add('stone',x,y-.03+k*.018,z,.022,.022,s,0,0xa8a49a)}
    for(const [dx,dz,r] of [[0,-S,0],[0,S,0],[-S,0,Math.PI/2],[S,0,Math.PI/2]]){add('plaster',x+dx,y+.04,z+dz,r?.018:S*2,.05,r?S*2:.018,0,wall);add('hipTile',x+dx,y+.09,z+dz,r?.04:S*2.04,.018,r?S*2.04:.04,0,rf)}
    for(const [dx,dz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const X=x+dx*S,Z=z+dz*S;add('stone',X,y-.03,Z,.1,.08,.1,0,0xa8a49a);add('plaster',X,y+.05,Z,.08,.05,.08,0,wall);add('hipTile',X,y+.1,Z,.12,.03,.12,0,rf);add('plaster',X,y+.13,Z,.05,.03,.05,0,wall);add('hipTile',X,y+.16,Z,.08,.025,.08,0,rf)}
    for(let k=0;k<5;k++){const s=.24-k*.045;add('stone',x,y-.03+k*.03,z-.04,.3-k*.012,.03,.3-k*.012,0,0xa8a49a)}
    let yy=y+.12;for(let k=0;k<4;k++){const s=.22-k*.04,hh=.055-k*.004;add('plaster',x,yy,z-.04,s,hh,s*.9,0,wall);
      for(let q=0;q<3;q++)for(const sd of [-1,1])add('box',x+(q-1)*s*.28,yy+hh*.45,z-.04+sd*(s*.45+.0012),.012,.012,.002,0,0x26221e);
      add('hipTile',x,yy+hh-.004,z-.04,s*1.5,.032,s*1.36,0,rf);yy+=hh+.024}
    for(const sd of [-1,1])add('box',x+sd*.035,yy-.006,z-.04,.008,.014,.004,0,0xd4af37);/* golden fish on the ridge */
    add('box',x,y-.03,z+S+.005,.07,.08,.01,0,0x2a2420);add('hipTile',x,y+.05,z+S+.01,.11,.03,.05,0,rf);
    add('cyl',x+.2,y,z+.12,.006,.2,.006,0,0x5a4632);add('box',x+.222,y+.17,z+.12,.04,.024,.003,0,nc);return true}
  if(cu==='east'){/* a pagoda of stacked roofs */add('stone',x,y-.03,z,.2,.03,.2,.4,0xc8c2b8);for(let k=0;k<5;k++){const s=.15-k*.022,yy=y+k*.06;add('plaster',x,yy,z,s,.045,s,.4,k%2?0xb83a2a:0xf0ece4);add('hipTile',x,yy+.04,z,s*1.6,.028,s*1.6,.4,0x3e4248)}
    add('cyl',x,y+.33,z,.006,.08,.006,0,0xd4af37);return true}
  if(cu==='africa'&&e<3){roundHut(x,y,z,.11,.065,0xa86040,0xd8cca8);for(let k=0;k<20;k++){const a=k/20*6.283;add('cyl',x+Math.cos(a)*.3,y-.03,z+Math.sin(a)*.3,.016,.07,.016,0,0x6e5236)}add('cyl',x+.15,y,z+.15,.006,.16,.006,0,0x5a4632);add('box',x+.172,y+.13,z+.15,.04,.024,.003,0,nc);return true}
  if(cu==='mideast'&&e>=3){/* a kasbah: mud-brick walls with square tapering towers, a domed palace and a minaret */
    const S=.38,col=0xd8b888,dk=shadeHex(col,.86);CRENEL_KIT='adobe';
    for(const [dx,dz,r] of [[0,-S,0],[0,S,0],[-S,0,Math.PI/2],[S,0,Math.PI/2]]){add('adobe',x+dx,y-.03,z+dz,r?.03:S*2,.14,r?S*2:.03,0,col);crenel(x+dx,y+.11,z+dz,S*2,r,col);
      for(let q=0;q<6;q++){const t=(q+.5)/6-.5,o=(dx||dz)>0?1:-1;add('box',x+dx+(r?o*.0155:t*S*2),y+.06,z+dz+(r?t*S*2:o*.0155),r?.002:.006,.018,r?.006:.002,0,0x3a2a1e)}}
    for(const [dx,dz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const X=x+dx*S,Z=z+dz*S;add('adobe',X,y-.03,Z,.1,.12,.1,0,col);add('adobe',X,y+.09,Z,.082,.1,.082,0,col);add('adobe',X,y+.19,Z,.07,.05,.07,0,dk);crenel(X,y+.24,Z-.035,.07,0,col);crenel(X,y+.24,Z+.035,.07,0,col)}
    CRENEL_KIT='stone';
    add('box',x,y-.03,z+S+.012,.06,.09,.006,0,0x2a2018);add('adobe',x,y+.06,z+S+.01,.08,.03,.04,0,dk);
    add('adobe',x-.04,y-.03,z-.05,.32,.13,.24,0,0xe8d8b8);add('domeW',x-.04,y+.1,z-.05,.16,.14,.16,0,[0x3a6a9a,0xd4af37,0x4a8a7a][n.id%3]);
    for(let q=0;q<5;q++)add('box',x-.16+q*.06,y+.03,z+.071,.024,.05,.003,0,0x3a2a1e);
    add('adobeCyl',x+.2,y-.03,z-.15,.05,.42,.05,0,0xf0e6d2);add('adobeCyl',x+.2,y+.3,z-.15,.07,.012,.07,0,dk);add('adobeCyl',x+.2,y+.39,z-.15,.035,.05,.035,0,0xf0e6d2);add('domeW',x+.2,y+.44,z-.15,.04,.04,.04,0,0xf2eee6);
    add('cyl',x-.04,y+.24,z-.05,.004,.08,.004,0,0x444444);add('box',x-.02,y+.3,z-.05,.04,.024,.003,0,nc);return true}
  if(cu==='mideast'||cu==='africa'&&e>=3){const col=cu==='africa'?0xb8784a:0xe8d8b8;add('adobe',x,y-.03,z,.3,.12,.24,0,col);
    if(cu==='africa'){for(let k=0;k<9;k++)add('adobe',x-.14+k*.035,y-.03,z+.12,.014,.15,.014,0,col);for(const dx of [-.1,0,.1])add('adobeCyl',x+dx,y+.09,z+.1,.05,.11,.05,0,col);for(let k=0;k<12;k++)add('box',x-.14+k*.025,y+.06,z+.123,.004,.004,.02,0,0x4a3826)}
    else{add('domeW',x,y+.09,z,.17,.15,.17,0,[0x3a6a9a,0xd4af37,0x4a8a7a][n.id%3]);for(const dx of [-.16,.16]){add('adobe',x+dx,y-.03,z+.13,.03,.3,.03,0,col);add('domeW',x+dx,y+.27,z+.13,.035,.03,.035,0,0xf2eee6)}}
    add('cyl',x,y+.12,z,.005,.1,.005,0,0x444444);add('box',x+.022,y+.2,z,.04,.024,.003,0,nc);return true}
  if(cu==='meso'&&e>=4){/* a colonial cathedral: a white and ochre front with two bell towers, a tiled nave and a dome on a drum, on a broad plaza */
    const w=0xf2ead8,o=0xd8a860;add('plazaStone',x,y-.03,z+.1,.7,.035,.7,0);
    add('adobe',x,y-.03,z-.04,.16,.14,.32,0,w);add('tiles',x,y+.11,z-.04,.18,.06,.34,Math.PI/2,0xb85a36);
    add('adobe',x,y-.03,z+.13,.2,.2,.03,0,o);add('adobe',x,y+.17,z+.13,.1,.05,.03,0,o);add('box',x,y-.03,z+.146,.05,.09,.004,0,0x3a2a1e);add('box',x,y+.1,z+.146,.03,.03,.002,0,0x26221e);
    for(const sd of [-1,1]){const X=x+sd*.11;add('adobe',X,y-.03,z+.12,.07,.3,.07,0,w);add('adobe',X,y+.27,z+.12,.06,.06,.06,0,o);for(const [ox,oz,rr] of [[0,.0302,0],[.0302,0,Math.PI/2],[-.0302,0,Math.PI/2]])add('box',X+ox,y+.285,z+.12+oz,.022,.035,.002,rr,0x26221e);add('domeW',X,y+.33,z+.12,.06,.05,.06,0,o);add('box',X,y+.375,z+.12,.003,.03,.003,0,0x6a5a3a)}
    add('adobeCyl',x,y+.15,z-.1,.11,.05,.11,0,w);add('domeW',x,y+.2,z-.1,.11,.1,.11,0,0xe0b870);add('box',x,y+.3,z-.1,.003,.04,.003,0,0x6a5a3a);add('box',x,y+.315,z-.1,.02,.003,.003,0,0x6a5a3a);
    add('cyl',x+.25,y,z+.3,.006,.18,.006,0,0x5a4632);add('box',x+.272,y+.15,z+.3,.04,.024,.003,0,nc);return true}
  if(cu==='meso'){/* a stepped pyramid with a temple on top */for(let k=0;k<5;k++){const s=.38-k*.065;add('stone',x,y-.03+k*.045,z,s,.05,s,0,k%2?0xc8bca4:0xb8ac94)}
    add('stone',x,y+.2,z+.0,.1,.012,.1,0,0xc8bca4);add('adobe',x,y+.21,z,.08,.05,.07,0,0xd8ccb4);add('hipThatch',x,y+.26,z,.11,.05,.1,0,0xc0b080);add('box',x,y-.03,z+.19,.05,.2,.08,0,0xb0a48c);return true}
  if(cu==='nordic'&&e<=2){add('timber',x,y-.02,z,.36,.07,.12,.3,0x9a8a7a);add('hipThatch',x,y+.045,z,.42,.09,.18,.3,0x7a9850);add('cyl',x+.2,y,z+.1,.006,.16,.006,0,0x5a4632);add('box',x+.222,y+.13,z+.1,.04,.024,.003,0,nc);return true}
  return false}
/* a great castle: moat, curtain wall with battlements, round towers, a gatehouse, a tall keep, a hall and a chapel */
let CRENEL_FORK=false,CRENEL_KIT='stone';
function crenel(x,y,z,len,rot,col){const k=Math.max(2,Math.round(len/.026)),c=Math.cos(rot),s=Math.sin(rot),mw=len/k*.9;for(let i=0;i<k;i+=2){const t=(i+.5)/k-.5,mx=x+t*len*c,mz=z-t*len*s;
    if(CRENEL_FORK){/* swallowtail merlons: each one split into two horns */add(CRENEL_KIT,mx,y,mz,mw,.012,.026,rot,col);for(const sd of [-1,1])add(CRENEL_KIT,mx+sd*mw*.3*c,y+.012,mz-sd*mw*.3*s,mw*.34,.009,.026,rot,col)}
    else add(CRENEL_KIT,mx,y,mz,mw,.014,.026,rot,col)}}
/* each culture builds its castle its own way */
const CASTLE_STYLE={
  west:{col:0xd4cdbe,keep:0xe2dccf,light:0xe8e2d4,yard:0xa8a090,roof:e=>e>=4?0x4a5560:ROOF_SLATE[0],coneH:1},
  nordic:{col:0xaaaba6,keep:0xb8b9b4,light:0xc4c4be,yard:0x8e8c84,roof:()=>0x2b2f33,coneH:1.45},
  med:{col:0xdcc29a,keep:0xe6d0aa,light:0xeedcbc,yard:0xb8a07c,roof:()=>0xb85a36,sq:true,flat:true,fork:true,torre:true}};
function castle(n,x,y,z,e,nc){const ST=CASTLE_STYLE[cultOf(n)]||CASTLE_STYLE.west,S=.42,WH=.15,T=.032,col=ST.col,roof=ST.roof(e);CRENEL_FORK=!!ST.fork;
  const twr=(X,Y,Z,sx,sy,sz,r,c)=>ST.sq?add('stone',X,Y,Z,sx*.9,sy,sz*.9,r,c):add('tower',X,Y,Z,sx,sy,sz,r,c);
  /* a cone roof, or for square towers a flat top ringed with battlements */
  const cap=(X,Y,Z,sx,sy,sz,r,c)=>{if(!ST.flat){add('coneTile',X,Y,Z,sx,sy*(ST.coneH||1),sz,r,c);return}const w=sx*.72;add('stone',X,Y-.004,Z,w*1.06,.006,w*1.06,0,shadeHex(col,.9));for(const [ox,oz,rr] of [[0,-w/2,0],[0,w/2,0],[-w/2,0,Math.PI/2],[w/2,0,Math.PI/2]])crenel(X+ox,Y+.002,Z+oz,w,rr,col)};
  if(typeof bareRect==='function')bareRect(x,z,0,S*3.1,S*3.1);{let lo=y;for(let q=0;q<12;q++){const a=q/12*6.283;lo=Math.min(lo,groundY(x+Math.cos(a)*S*1.3,z+Math.sin(a)*S*1.3))}if(y-lo<.03)add('moat',x,y-.012,z,S*2.95,.02,S*2.95,0)}/* the moat, only on level ground */
  add('stone',x,y-.035,z,S*2.15,.035,S*2.15,0,ST.yard);/* the bailey ground */
  const sides=[[0,-S,S*2,0],[0,S,S*2,0],[-S,0,S*2,Math.PI/2],[S,0,S*2,Math.PI/2]];
  sides.forEach(([dx,dz,L,r],si)=>{if(si===1){/* the gate side: two halves and a gatehouse */for(const sd of [-1,1])add('stone',x+sd*S*.6,y-.03,z+dz,S*.8,WH+.03,T,0,col),crenel(x+sd*S*.6,y+WH,z+dz,S*.8,0,col);
      for(const sd of [-1,1]){twr(x+sd*.07,y-.03,z+dz,.075,WH+.09,.075,0,col);cap(x+sd*.07,y+WH+.06,z+dz,.09,.07,.09,0,roof)}
      add('stone',x,y+WH*.55,z+dz,.1,WH*.5,T*1.3,0,col);add('box',x,y-.03,z+dz+.005,.06,WH*.6,.004,0,0x1e1812);
      /* the portcullis: iron bars across the dark gateway */for(let q=0;q<5;q++)add('box',x-.024+q*.012,y-.03,z+dz+.0075,.0018,WH*.58,.0015,0,0x4a4a4a);for(let q=0;q<3;q++)add('box',x,y-.02+q*.025,z+dz+.0078,.055,.0018,.0015,0,0x4a4a4a);add('box',x,y-.03,z+dz+S*.25,.07,.008,S*.5,0,0x6a4a30)/* drawbridge */}
    else{add('stone',x+dx,y-.03,z+dz,r?T:L,WH+.03,r?L:T,0,col);crenel(x+dx,y+WH,z+dz,L,r,col);
      /* a corbelled ledge under the battlements, and arrow slits along the wall */
      add('stone',x+dx,y+WH-.014,z+dz,r?T*1.55:L,.013,r?L:T*1.55,0,shadeHex(col,.88));
      for(let q=0;q<5;q++){const t=(q+.5)/5-.5,o=(dx||dz)>0?1:-1;add('box',x+dx+(r?o*T*.51:t*L),y+WH*.45,z+dz+(r?t*L:o*T*.51),r?.002:.005,.024,r?.005:.002,0,0x26221e)}}});
  for(const [dx,dz] of [[-1,-1],[1,-1],[-1,1],[1,1],[0,-1],[-1,0],[1,0]]){const X=x+dx*S,Z=z+dz*S,big=dx&&dz;
    twr(X,y-.03,Z,big?.12:.09,WH+(big?.13:.08),big?.12:.09,0,col);
    {const rr=(big?.12:.09)/2+.0006,th=WH+(big?.13:.08);for(let q=0;q<4;q++){const a=q*1.5708+.785;for(const f of [.4,.78])add('box',X+Math.cos(a)*rr,y-.03+th*f,Z+Math.sin(a)*rr,.005,.022,.005,-a,0x26221e)}
     twr(X,y+WH+(big?.13:.08)-.04,Z,(big?.12:.09)*1.12,.014,(big?.12:.09)*1.12,0,shadeHex(col,.88))}cap(X,y+WH+(big?.1:.05),Z,big?.14:.11,big?.13:.1,big?.14:.11,0,roof);
    if(big){add('cyl',X,y+WH+.22,Z,.004,.06,.004,0,0x444444);add('box',X+.016,y+WH+.265,Z,.03,.018,.002,0,nc)}}
  /* the keep */const kx=x-.06,kz=z-.08;add('stone',kx,y-.03,kz,.22,.42,.22,0,ST.keep);crenel(kx,y+.39,kz-.11,.22,0,ST.keep);crenel(kx,y+.39,kz+.11,.22,0,ST.keep);crenel(kx-.11,y+.39,kz,.22,Math.PI/2,ST.keep);crenel(kx+.11,y+.39,kz,.22,Math.PI/2,ST.keep);
  for(const [dx,dz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){twr(kx+dx*.11,y+.2,kz+dz*.11,.05,.24,.05,0,ST.keep);cap(kx+dx*.11,y+.44,kz+dz*.11,.065,.08,.065,0,roof)}
  add('cyl',kx,y+.39,kz,.005,.16,.005,0,0x444444);add('box',kx+.03,y+.5,kz,.06,.036,.003,0,nc);
  for(let f=1;f<4;f++)for(const sd of [-1,1])add('box',kx+sd*.05,y+f*.1,kz+.111,.016,.03,.003,0,0x2a2420);
  /* the great hall and a chapel in the bailey */
  house(x+.16,y,z-.06,Math.PI/2,.24,.12,.08,'stone',0xd8d0c0,'tiles',roof,true,{hk:.3,annex:false,garden:false,lamp:false,fenceCol:0x8a6a46});
  add('stone',x-.18,y-.03,z+.18,.1,.09,.16,0,ST.light);add('tiles',x-.18,y+.06,z+.18,.12,.05,.18,Math.PI/2,roof);twr(x-.18,y-.03,z+.1,.035,.16,.035,0,ST.light);cap(x-.18,y+.13,z+.1,.045,.1,.045,0,roof);
  /* stables, a well and banners */add('timber',x+.18,y-.02,z+.22,.16,.05,.06,0,0x8a6a4a);add('thatch',x+.18,y+.03,z+.22,.17,.035,.07,0,0xffffff);
  add('cyl',x+.05,y-.02,z+.2,.025,.03,.025,0,0x9a948a);for(let k=0;k<4;k++){const a=k*1.57+.3;add('box',x+Math.cos(a)*S*1.02,y+WH*.5,z+Math.sin(a)*S*1.02,.022,.05,.002,-a+Math.PI/2,nc)}
  /* an Italian castle has a slender bell tower with a tiled spire */
  if(ST.torre){const tx=kx+.15,tz=kz-.12;add('stone',tx,y-.03,tz,.055,.62,.055,0,ST.keep);for(const [ox,oz,rr] of [[0,.0281,0],[0,-.0281,0],[.0281,0,Math.PI/2],[-.0281,0,Math.PI/2]])add('box',tx+ox,y+.5,tz+oz,.02,.04,.002,rr,0x26221e);add('pyr',tx,y+.59,tz,.075,.09,.075,0,0xb85a36)}
  CRENEL_FORK=false}
/* a town wall: stone in the middle ages, a palisade before, with towers and gates where the main streets leave */
let WALL_TIGHT=false;
function packInside(n,plan,cx,cz,R,e,KO,HP,k0){const SP=[];for(const st of plan.streets)for(let i=1;i<st.pts.length;i++){const a=st.pts[i-1],b=st.pts[i];for(let q=0;q<3;q++){const t=q/3;SP.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t])}}
  const G=new Map(),gk=(x,z)=>Math.floor(x/.15)+','+Math.floor(z/.15);for(const q of SP){const kk=gk(q[0],q[1]);if(!G.has(kk))G.set(kk,[]);G.get(kk).push(q)}
  const nearSt=(x,z)=>{const gx=Math.floor(x/.15),gz=Math.floor(z/.15);let b=null,bd=9;for(let a=-2;a<=2;a++)for(let c=-2;c<=2;c++){const L=G.get((gx+a)+','+(gz+c));if(L)for(const q of L){const d=Math.hypot(q[0]-x,q[1]-z);if(d<bd){bd=d;b=q}}}return [b,bd]};
  const st=.086;let kk=k0;
  for(let gx=-R;gx<=R;gx+=st)for(let gz=-R;gz<=R;gz+=st){const x=cx+gx,z=cz+gz,d=Math.hypot(gx,gz);if(d>R*.97||d<plan.pr*.75)continue;
    const t=tileAt(x,z);if(t<0||isWater(t)||owner[t]!==n.id||river[t]||riverNear(x,z,.065))continue;
    if(KO.some(q=>Math.hypot(x-q[0],z-q[1])<q[2]+.03))continue;
    const [q,sd]=nearSt(x,z);if(!q||sd<.075||sd>.5)continue;/* keep the lanes clear; deep inside a block, face the nearest lane anyway */
    const rot=Math.atan2(q[0]-x,q[1]-z),hk=hash(x*91.7+z*53.3),w=.082+hash(hk*3)*.016,dd=.074+hash(hk*5)*.012;
    let mn=1e9,mx=-1e9;for(const [a,b] of [[-w/2,-dd/2],[w/2,-dd/2],[-w/2,dd/2],[w/2,dd/2]]){const yy=groundY(x+a*Math.cos(rot)+b*Math.sin(rot),z-a*Math.sin(rot)+b*Math.cos(rot));mn=Math.min(mn,yy);mx=Math.max(mx,yy)}
    if(mn<waterY+.03||mx-mn>.06)continue;
    const sl={x,z,rot,w,d:dd,core:.7,terr:true};kk++;
    const up=solid(()=>{if(mx-mn>.012)add('stone',x,mn-.03,z,w*1.04,mx-mn+.03,dd*1.04,rot,0xa8a090);terraceHouse(n,sl,mx,e,hk)},x,z,rot,false,-.016);
    if(up){HP.push([x,z,Math.max(w,dd)*.62]);occupied.add(t)}}}
/* inside a walled city: a market square with stalls and a well, and a stone church with a spire, each on its own open ground */
function innerCity(n,plan,cx,cy,cz,e,cap,i0,wR,KO){const cu=cultOf(n);
  const spot=(a0,d,r)=>{for(let q=0;q<8;q++){const a=a0+q*.79,x=cx+Math.cos(a)*d,z=cz+Math.sin(a)*d,t=tileAt(x,z);if(t<0||isWater(t)||owner[t]!==n.id)continue;const y=groundY(x,z);if(y<waterY+.03)continue;
    if(KO.some(k=>Math.hypot(k[0]-x,k[1]-z)<k[2]+r))continue;let mn=1e9,mx=-1e9;for(const [u,v] of [[r,0],[-r,0],[0,r],[0,-r]]){const yy=groundY(x+u,z+v);mn=Math.min(mn,yy);mx=Math.max(mx,yy)}if(mx-mn>.05)continue;return [x,y,z]}return null};
  const a0=hash(i0*5.5)*6.283,dm=Math.min(wR-.2,plan.pr+(cap?.24:.16));
  if(dm>plan.pr+.08){const R0=cap?.17:.12,m=spot(a0,dm+(cap?.04:0),R0+.01);if(m){const [x,y,z]=m,r=R0;KO.push([x,z,r+.02]);
    solid(()=>{add(e>=3?'plazaStone':'plazaDirt',x,y-.012,z,r*2,.016,r*2,a0);
      add('cyl',x,y,z,.028,.022,.028,0,0x9a948a);add('pool',x,y+.005,z,.02,.02,.02);add('cyl',x-.012,y,z,.003,.04,.003,0,0x5a4632);add('cyl',x+.012,y,z,.003,.04,.003,0,0x5a4632);add('tiles',x,y+.04,z,.036,.016,.032,0,0x8e3f2c);
      const st=(cap?8:5)+((hash(i0*3.1)*3)|0);for(let k=0;k<st;k++){const a=k/st*6.283+a0,sx=x+Math.cos(a)*r*.68,sz=z+Math.sin(a)*r*.68,rt=-a;
        P('box',sx,y,sz,rt,0,0,0,.032,.015,.02,0x7a5a3a);P('cyl',sx,y,sz,rt,-.014,.008,0,.003,.036,.003,0x5a4632);P('cyl',sx,y,sz,rt,.014,.008,0,.003,.036,.003,0x5a4632);
        P('awning',sx,y+.032,sz,rt,0,0,0,.038,.013,.028,AWN[(hash(i0*7+k)*AWN.length)|0]);if(hash(i0*9+k)<.5)add('hay',sx+Math.cos(a)*.03,y,sz+Math.sin(a)*.03,.018,.02,.018,0,0xc8a060)}},x,z,0,true,undefined,'big')}}
  if(['west','nordic','med'].includes(cu)){const c2=spot(a0+2.4,Math.min(wR-.18,plan.pr+(cap?.22:.15)),.11);if(c2){const [x,y,z]=c2,rot=hash(i0*7.7)*6.283,sc=cap?1.25:1;KO.push([x,z,.12*sc]);
    solid(()=>{const col=0x9a9282,rc=LK.pixel?0x5a5e66:ROOF_SLATE[0];
      P('stone',x,y-.02,z,rot,0,.01*sc,0,.075*sc,.07*sc,.15*sc,col);P('tiles',x,y+.05*sc,z,rot,0,.01*sc,0,.085*sc,.045*sc,.16*sc,rc);
      P('stone',x,y-.02,z,rot,0,-.085*sc,0,.05*sc,.15*sc,.05*sc,col);P('pyr',x,y+.13*sc,z,rot,0,-.085*sc,0,.06*sc,.09*sc,.06*sc,rc);
      for(const sd of [-1,1])for(let q=0;q<3;q++)P('box',x,y+.02*sc,z,rot,sd*.0385*sc,(-.03+q*.045)*sc,0,.002,.03*sc,.012*sc,0x2a3038)},x,z,rot,true,undefined,'big')}}}
function townWall(n,plan,cx,cz,R,e,far,i0){if(R<.3)return;CRENEL_FORK=cultOf(n)==='med';try{townWall0(n,plan,cx,cz,R,e,far,i0)}finally{CRENEL_FORK=false}}
function townWall0(n,plan,cx,cz,R,e,far,i0){const stone=e>=3,col=stone?(LK.pixel?0x8e8576:0xcfc8b8):0x6e5236,H=stone?(LK.pixel?.062:.09):.07,TR=LK.pixel?0x5a4c3e:ROOF_SLATE[0],L=.075,K=Math.max(16,Math.ceil(6.283*R/L)),ph=hash(i0*4.4)*6.283,gates=[];
  for(const st of plan.streets){if(!st.main)continue;for(const q of st.pts){const d=Math.hypot(q[0]-cx,q[1]-cz);if(d>=R){gates.push(Math.atan2(q[1]-cz,q[0]-cx));break}}}
  const wb=WALL_TIGHT?.35:1,rad=t=>R*(1+wb*(.07*Math.sin(3*t+ph)+.04*Math.sin(5*t+ph*1.7))),pt=t=>[cx+Math.cos(t)*rad(t),cz+Math.sin(t)*rad(t)];
  const nearGate=t=>gates.some(g=>Math.abs(((t-g+9.42)%6.283)-3.14)<.055/R+.02);
  for(let k=0;k<K;k++){const t0=k/K*6.283,t1=(k+1)/K*6.283,[x0,z0]=pt(t0),[x1,z1]=pt(t1),mx=(x0+x1)/2,mz=(z0+z1)/2,ti=tileAt(mx,mz);
    if(ti<0||isWater(ti)||owner[ti]!==n.id)continue;const y=groundY(mx,mz);if(y<waterY+.02)continue;
    if(nearGate((t0+t1)/2)){continue}
    const len=Math.hypot(x1-x0,z1-z0)+.004,rot=Math.atan2(-(z1-z0),x1-x0);
    solid(()=>{if(stone){add('stone',mx,y-.03,mz,len,H+.03,.024,rot,col);if(!far)crenel(mx,y+H,mz,len,rot,col)}
    else{for(let q=0;q<3;q++){const f=(q+.5)/3;add('cyl',x0+(x1-x0)*f,y-.03,z0+(z1-z0)*f,.012,H+.03+hash(k*3+q)*.02,.012,0,col)}}},mx,mz,rot,false,-.005,'wall');
    if(k%7===0)solid(()=>{add(stone?'tower':'cyl',mx,y-.03,mz,stone?.065:.03,H+.08,stone?.065:.03,0,col);if(stone)add('coneTile',mx,y+H+.05,mz,.08,.07,.08,0,TR)},mx,mz,0,false,undefined,'tower')}
  for(const g of gates){const [gx,gz]=pt(g),ti=tileAt(gx,gz);if(ti<0||isWater(ti)||owner[ti]!==n.id)continue;const y=groundY(gx,gz),tx=-Math.sin(g),tz=Math.cos(g),o=.045;
    for(const sd of [-1,1]){const X=gx+tx*o*sd,Z=gz+tz*o*sd;solid(()=>{add(stone?'tower':'cyl',X,y-.03,Z,stone?.06:.035,H+.1,stone?.06:.035,0,col);if(stone)add('coneTile',X,y+H+.07,Z,.075,.07,.075,0,TR)},X,Z,0,false,undefined,'tower')}
    if(stone)add('stone',gx,y+H*.7,gz,.1,H*.45,.03,Math.atan2(-tz,tx),col)}}
function landmark(n,x,y,z,e){const nc=parseInt(n.color.slice(1),16);if(cultureLandmark(n,x,y,z,e,nc))return;
  if(e===0){add('cyl',x,y-.02,z,.14,.06,.14,0,0x7d6248);add('coneThatch',x,y+.035,z,.2,.13,.2);
    for(let k=0;k<7;k++){const a=k/7*Math.PI*2;add('box',x+Math.cos(a)*.24,y-.02,z+Math.sin(a)*.24,.025,.07,.02,a,0x8f8a82)}
    add('flame',x+.12,y,z+.12,.025,.04,.025);smokeAt(x+.12,y+.04,z+.12,false,.6);return}
  if(e<=2){house(x,y,z,0,.28,.13,.08,'plaster',0xb49a74,'thatch',0xffffff,false);
    for(let k=0;k<22;k++){const a=k/22*Math.PI*2;add('cyl',x+Math.cos(a)*.42,y-.03,z+Math.sin(a)*.42,.02,.09,.02,0,0x6e5236)}
    add('cyl',x,y,z+.22,.008,.18,.008,0,0x5a4632);add('box',x+.02,y+.14,z+.22,.04,.025,.003,0,nc);return}
  if(e>=3&&e<=4){castle(n,x,y,z,e,nc);return}
  if(e<=4){const s=.5,th=.035,hh=.11;
    for(const [dx,dz,w,d] of [[0,-s/2,s,th],[0,s/2,s,th],[-s/2,0,th,s],[s/2,0,th,s]])add('stone',x+dx,y-.03,z+dz,w,hh+.03,d,0,0xd8d2c6);
    for(const [dx,dz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){add('tower',x+dx*s/2,y-.03,z+dz*s/2,.09,.2,.09,0,0xd8d2c6);add('coneTile',x+dx*s/2,y+.17,z+dz*s/2,.11,.1,.11,0,nc)}
    add('stone',x,y-.03,z,.16,.26,.16,0,0xe2dccf);add('pyr',x,y+.23,z,.2,.12,.2,0,ROOF_SLATE[0]);
    add('cyl',x,y+.33,z,.006,.12,.006,0,0x444444);add('box',x+.025,y+.41,z,.05,.03,.003,0,nc);return}
  if(e===5){add('stone',x,y-.02,z,.36,.14,.2,0,0xe8e2d4);add('dome',x,y+.12,z,.16,.14,.16,0,0x5f8f86);
    add('tower',x+.22,y-.02,z,.06,.3,.06,0,0xe8e2d4);add('coneTile',x+.22,y+.28,z,.07,.08,.07,0,ROOF_SLATE[1]);
    add('cyl',x,y+.19,z,.006,.08,.006,0,0x444444);add('box',x+.02,y+.24,z,.04,.025,.003,0,nc);return}
  if(e===6){add('office',x,y-.02,z,.16,.85,.16,0,0xc8d4de);add('box',x,y+.83,z,.13,.04,.13,0,0x60656c);add('cyl',x,y+.86,z,.01,.22,.01,0,0xd0d0d0);return}
  add('glass',x,y-.02,z,.13,1.25,.13,0,0xe6fbff);add('ring',x,y+.45,z,.3,1,.3);add('ring',x,y+.85,z,.22,1,.22);add('cyl',x,y+1.22,z,.008,.3,.008,0,0xffffff);
}
function wonder(n,x,y,z,k){const nc=parseInt(n.color.slice(1),16);
  switch(k){
  case 1:for(let t=0;t<4;t++)add('stone',x,y-.03+t*.07,z,.42-t*.09,.1,.42-t*.09,0,0xcfb98f);add('stone',x,y+.27,z,.08,.06,.08,0,0xcfb98f);break;
  case 2:add('stone',x,y-.02,z,.12,.08,.12,0,0xbab3a6);add('cyl',x,y+.06,z,.05,.34,.05,0,0xb4783c);add('dome',x,y+.4,z,.07,.07,.07,0,0xb4783c);add('flame',x,y+.43,z,.03,.06,.03);break;
  case 3:add('stone',x,y-.02,z,.36,.14,.13,0,0xe0d9cb);add('tiles',x,y+.12,z,.38,.1,.15,0,ROOF_SLATE[0]);
    for(const dx of [-.19,.19]){add('tower',x+dx,y-.02,z,.07,.32,.07,0,0xe0d9cb);add('coneTile',x+dx,y+.3,z,.08,.18,.08,0,ROOF_SLATE[2])}break;
  case 4:add('tower',x,y-.02,z,.1,.5,.1,0,0xf2eee6);add('tower',x,y+.48,z,.07,.06,.07,0,0x2b2b2b);add('ring',x,y+.5,z,.12,1,.12);add('flame',x,y+.5,z,.04,.05,.04);add('coneTile',x,y+.54,z,.09,.07,.09,0,0xb33);break;
  case 5:add('glass',x,y-.02,z,.42,.12,.18,0,0xffffff);add('dome',x,y+.1,z,.2,.16,.2,0,0xbfe3ec);break;
  case 6:add('cyl',x,y-.02,z,.035,1.1,.035,0,0xe8e8e8);add('cyl',x,y+1.02,z,.16,.04,.16,0,0xffffff);add('ring',x,y+1.04,z,.18,1,.18);break;
  case 7:add('glass',x,y-.02,z,.07,1.9,.07,0,0xe8fdff);for(let r=1;r<5;r++)add('ring',x,y+r*.38,z,.24-r*.025,1,.24-r*.025);break}
  if(k>=1)add('box',x+.2,y-.02,z+.2,.02,.02,.02,0,nc);
}
function temple(f,x,y,z,e,rot){const fc=parseInt(f.color.slice(1),16);
  if(e<=2){add('stone',x,y-.02,z,.12,.07,.12,rot,0xd6cfc2);add('dome',x,y+.05,z,.11,.08,.11,0,fc);return}
  if(e<=5){P('stone',x,y-.02,z,rot,0,0,0,.16,.1,.09,0xddd6c9);P('tiles',x,y+.08,z,rot,0,0,0,.17,.07,.11,ROOF_SLATE[0]);
    P('stone',x,y-.02,z,rot,-.09,0,0,.06,.2,.06,0xddd6c9);P('coneTile',x,y+.18,z,rot,-.09,0,0,.07,.13,.07,fc);return}
  add('stone',x,y-.02,z,.16,.1,.16,rot,0xf0ece4);add('dome',x,y+.08,z,.15,.13,.15,0,fc);add('cyl',x,y+.2,z,.008,.08,.008,0,0xffffff);
}
/* the face of a house: door, framed windows with painted shutters, flower boxes, and windows on the sides */
const SHUTTER=[0x3f6b4a,0x34557a,0x7a3b2c,0x5a4a3a,0x2f4f4f,0x8a6a2a];
const DOORS=[0x3b2a1e,0x5a3a22,0x2f4f4f,0x6a2a22,0x34557a,0x4a3a2a];
let ROWHOUSE=false;/* row houses share their side walls: no windows there */
function facade(x,y,z,rot,w,d,hh,hk,floors,plain){const q=plain?0:hash(hk*71+5),sc=SHUTTER[(q*SHUTTER.length)|0],fr=plain?0xd8cfbc:0xe8dfcc,dz=d/2+.0012,glass=0x202c38,sill=0xd8d2c4;
  /* a stone footing round the house */
  P('stone',x,y-.02,z,rot,0,0,0,w+.005,.027,d+.005,0xa8a094);
  /* the door: a surround, a panelled door and a step */
  const dx=(q<.5?-1:1)*w*.22,dc=DOORS[(hash(hk*37+2)*DOORS.length)|0];
  P('box',x,y,z,rot,dx,dz-.0004,0,.024,.032,.003,fr);P('box',x,y,z,rot,dx,dz+.0006,.0,.017,.027,.003,dc);P('box',x,y,z,rot,dx,dz+.0012,.012,.013,.001,.002,0x18120c);
  P('box',x,y-.006,z,rot,dx,dz+.004,0,.028,.0075,.008,0xb0a898);
  const fh=hh/floors,gw=Math.min(.019,w*.17),gh=Math.min(.021,fh*.38);
  const win=(rr,ox,oz,wy,full)=>{P('box',x,y,z,rr,ox,oz,wy-.0025,gw+.006,gh+.006,.002,fr);P('box',x,y,z,rr,ox,oz+.0007,wy,gw,gh,.002,glass);
    if(full){P('box',x,y,z,rr,ox,oz+.0012,wy,.0016,gh,.0015,fr);P('box',x,y,z,rr,ox,oz+.0012,wy+gh*.55,gw,.0016,.0015,fr)}
    P('box',x,y,z,rr,ox,oz+.002,wy-.0042,gw+.009,.0028,.006,sill)};
  for(let f=0;f<floors;f++){const wy=fh*f+Math.min(fh*.4,.022),n=w>.115?3:2;
    for(let k=0;k<n;k++){const wxp=-w*.36+k*w*.72/(n-1);if(f===0&&Math.abs(wxp-dx)<.024)continue;
      win(rot,wxp,dz,wy,!plain);
      if(q>.25){for(const sd of [-1,1])P('box',x,y,z,rot,wxp+sd*(gw*.5+.0055),dz+.0004,wy-.002,gw*.5,gh+.004,.002,sc)}
      if(f===0&&hash(hk*13+k)<.45){P('box',x,y,z,rot,wxp,dz+.004,wy-.008,.019,.0045,.006,0x6a4a30);P('box',x,y,z,rot,wxp,dz+.004,wy-.0035,.017,.0035,.005,[0xd8504a,0xe8d84a,0xf2f2f2,0x9a6ad0][(hash(hk+k*3)*4)|0])}}
    if(!ROWHOUSE)for(const sd of [-1,1])if(hash(hk*5+f+sd)<.7)win(rot+Math.PI/2,0,sd*(w/2+.0012),wy,!plain)}}
/* the underside of the roof: a dark band where it overhangs the walls, so the roof reads as a solid slab with eaves */
function eaves(x,y,z,rot,w,d){P('box',x,y-.005,z,rot,0,0,0,w,.006,d,0x2e2620)}
const shadeHex=(h,f)=>((Math.min(255,((h>>16)&255)*f)|0)<<16)|((Math.min(255,((h>>8)&255)*f)|0)<<8)|(Math.min(255,(h&255)*f)|0);
/* timber framing on plaster walls: corner posts, floor beams and braces */
function framing(x,y,z,rot,w,d,hh,floors){const c=0x3a2a1c;
  for(const sx of [-1,1])for(const sz of [-1,1])P('box',x,y-.01,z,rot,sx*(w/2-.002),sz*(d/2-.002),0,.005,hh+.01,.005,c);
  for(let f=1;f<=floors;f++){const by=hh*f/floors-.003;for(const sz of [-1,1])P('box',x,y,z,rot,0,sz*(d/2+.0008),by,w,.004,.002,c)}
  for(const sx of [-1,1])P('box',x,y,z,rot,sx*w*.3,d/2+.0008,hh/floors*.5,.003,hh/floors*.9,.002,c,sx*.6)}
function chimney(x,y,z,rot,w,d,top,hk,smoke){const lx=(hash(hk*31)<.5?-1:1)*w*.28;const c=Math.cos(rot),s=Math.sin(rot),X=x+lx*c-d*.1*s,Z=z-lx*s-d*.1*c;
  add('stone',X,y,Z,.014,top-y+.012,.014,rot,0xa49c90);add('stone',X,top+.01,Z,.018,.004,.018,rot,0x8a8278);if(smoke)smokeAt(X,top+.02,Z,false,.35)}
/* a thatched cottage: log or whitewashed walls under a steep hipped roof that comes down low */
function cottage(x,y,z,rot,w,d,hh,hk){const o=hash(hk*53+3);
  if(o<.58)add('timber',x,y-.02,z,w,hh+.02,d,rot,[0xffffff,0xe8e0d6,0xd8d0c8,0xc8beb4][(hk*4)|0]);else add('plaster',x,y-.02,z,w,hh+.02,d,rot,o<.8?0xf2ede2:0xdccbb0);
  const tint=[0xb4ac9e,0xa49a88,0x9c968a,0xbcae94,0x8e8678][(o*5)|0];P('hipThatch',x,y+hh-.004,z,rot,0,0,0,w*1.3,hh*(1.7+o*.5),d*1.5,tint);
  if(o>.72){const ax=(o>.86?1:-1)*(w/2+w*.18);P('timber',x,y-.02,z,rot,ax,-d*.1,0,w*.36,hh*.7+.02,d*.7,0xd8d0c8);P('hipThatch',x,y+hh*.7-.004,z,rot,ax,-d*.1,0,w*.46,hh*.9,d*.95,tint)}
  const rh=hh*(1.7+o*.5);P('box',x,y+hh-.004+rh*.97,z,rot,0,0,0,w*1.3*.42,.006,.012,0x5a5246);
  if(o>=.58)framing(x,y,z,rot,w,d,hh,1);facade(x,y,z,rot,w,d,hh,hk,1);
  if(hash(hk*17)<.45)chimney(x,y+hh*.5,z,rot,w,d,y+hh+rh*.85,hk,hash(hk*19)<.5)}
/* the plot behind a house: wattle fence, dug beds, and a haystack, woodpile, shed or fruit tree */
/* a house in a terraced row: it fills its plot exactly, wall to wall with its neighbours, its ridge along the lane so the roofs run on as one line.
   Heights, plaster and roof colours vary from house to house, as in an old street that grew one house at a time */
function terraceHouse(n,sl,y,e,hk){ROWHOUSE=true;try{terraceHouse0(n,sl,y,e,hk)}finally{ROWHOUSE=false}}
function terraceHouse0(n,sl,y,e,hk){const cu=cultOf(n),x=sl.x,z=sl.z,rot=sl.rot,w=sl.w*1.01,d=sl.d,pick=(a,k)=>a[(hash(hk*k)*a.length)|0];
  const flat=(wall,wc,hh,cap,capC)=>{add(wall,x,y-.02,z,w,hh+.02,d,rot,wc);add('box',x,y+hh,z,w*1.02,cap,d*1.02,rot,capC)};
  if(e>=7){/* the future: smooth white blocks joined in a curve, a band of glass on every floor */
    const hh=.09+hash(hk*7.1)*.08;flat('plaster',pick([0xf4f6f8,0xeef2f4,0xe6ecf0],3.3),hh,.008,0xdfe6ea);
    for(let f=0;f<Math.floor(hh/.04);f++)add('glass',x,y+.02+f*.04,z,w*1.005,.014,d*1.005,rot,0x9fc4d8);return}
  if(e===6){/* modern townhouses and small blocks of flats: flat roofs, rows of windows */
    const hh=.07+hash(hk*7.1)*.09+(sl.core>.6?.04:0),fl=Math.max(2,Math.round(hh/.035));flat(hash(hk*6.6)<.3?'brick':'plaster',pick([0xe8e4dc,0xd8d4cc,0xcfc8bc,0xe0d8c8,0xbfc4c8],3.3),hh,.01,0x5a5c60);
    facade(x,y,z,rot,w,d,hh,hk,fl,true);return}
  if(e===5){/* industrial terraces: red brick, slate roofs, a chimney stack on every house */
    house(x,y,z,rot,w,d,.075+hash(hk*7.1)*.02,'brick',pick([0xffffff,0xf0e0d8,0xe8d8d0],3.3),'tiles',pick(ROOF_SLATE,2.2),true,{hk:hk*.44});return}
  const hh=.06+hash(hk*7.1)*.045+(sl.core>.6?.02:0);
  if(cu==='mideast'||cu==='africa'){/* mud-brick houses joined wall to wall, flat roofs with a parapet; now and then a little dome or a roof shelter */
    const wc=pick(cu==='africa'?[0xc89a6a,0xb88a5a,0xd0a878,0xbc9060]:[0xe0cca8,0xd8c098,0xe8d8b8,0xcdb48c,0xc8ae86,0xece0c8],3.3),h2=hh*(.8+hash(hk*4.4)*.55);
    add('adobe',x,y-.02,z,w,h2+.02,d,rot,wc);add('adobe',x,y+h2,z,w*1.02,.012,d*1.02,rot,wc);
    if(hash(hk*5.1)<.18)add('domeW',x,y+h2+.008,z,w*.5,w*.3,w*.5,0,0xeee8dc);else if(hash(hk*5.1)<.35)add('box',x,y+h2+.012,z,w*.4,.025,d*.4,rot,0x8a6a48);
    facade(x,y,z,rot,w,d,h2,hk,1,true);return}
  if(cu==='meso'){flat('stone',pick([0xd8ccb4,0xcfc2a8,0xe0d4bc],3.3),hh*.8,.012,0xb8a88c);facade(x,y,z,rot,w,d,hh*.8,hk,1,true);return}
  if(cu==='east'){/* wooden townhouses with deep dark tile roofs, ridges along the street */
    house(x,y,z,rot,w,d,hh*.85,'plaster',pick([0xd8c4a4,0xccb490,0xe0ceb0],3.3),'tiles',pick([0x5e5654,0x6a605a,0x544c4a,0x7a4a38],2.2),false,{hk:hk*.44});return}
  if(cu==='nordic'){house(x,y,z,rot,w,d,hh,'timber',pick([0x8a6040,0x7a5236,0x9a704c,0x6e4a30],3.3),hash(hk*5.7)<.6?'thatch':'tiles',hash(hk*5.7)<.6?0xffffff:0x5a4a3e,hash(hk*8.8)<.4,{hk:hk*.44});return}
  /* the west and the Mediterranean: plaster and timber-framed fronts, thatch, tile or slate; Mediterranean in warm stucco and red tile */
  const med=cu==='med',hh2=e<=1?hh*.85:hh;
  const walls=med?[0xe8dcc4,0xdcc8a8,0xeee4d0,0xd8c09c]:[0xe6dcc8,0xd8ccb4,0xcfc2a6,0xe0d4bc,0xbfae92],wc=walls[(hash(hk*3.3)*walls.length)|0];
  const thatch=!med&&(e<=3)&&hash(hk*5.7)<(e<=2?.8:.45),roof=thatch?'thatch':'tiles',rc=thatch?0xffffff:med?ROOF_RED[(hash(hk*2.2)*ROOF_RED.length)|0]:(hash(hk*9.9)<.5?ROOF_RED[(hash(hk)*ROOF_RED.length)|0]:ROOF_SLATE[(hash(hk*4)*ROOF_SLATE.length)|0]);
  const wall=hash(hk*6.6)<.18?'stone':'plaster';
  house(x,y,z,rot,w,d,hh2,wall,wc,roof,rc,e>=3&&hash(hk*8.8)<.4,{hk:hk*.44})}
function townInfill(n,plan,cx,cz,HP,i0,KO){const ds=HP.map(h=>Math.hypot(h[0]-cx,h[1]-cz)).sort((a,b)=>a-b),RT=ds[Math.floor(ds.length*.85)]+.06,st=.085;
  const SP=[];for(const s of plan.streets)for(const q of s.pts)SP.push(q);
  for(let gx=-RT;gx<=RT;gx+=st)for(let gz=-RT;gz<=RT;gz+=st){const hv=hash(i0*7.7+gx*131.3+gz*71.9),x=cx+gx+(hash(hv*9.1)-.5)*.05,z=cz+gz+(hash(hv*5.3)-.5)*.05,d=Math.hypot(x-cx,z-cz);
    if(d>RT||d<plan.pr+.08||hv<.5)continue;const inW=plan.wallR>.3&&d<plan.wallR+.05;const t=tileAt(x,z);if(t<0||isWater(t)||owner[t]!==n.id||fieldTiles.has(t))continue;const y=groundY(x,z);if(y<waterY+.03)continue;
    let ok=true;for(const h of HP)if(Math.hypot(h[0]-x,h[1]-z)<h[2]+.05){ok=false;break}if(!ok)continue;
    for(const q of SP)if(Math.hypot(q[0]-x,q[1]-z)<.055){ok=false;break}if(!ok)continue;
    if(KO&&KO.some(q=>Math.hypot(x-q[0],z-q[1])<q[2]+.05))continue;
    /* inside the walls and in the heart of the town: courtyard gardens and shrubs; a few small fruit trees only out at the edge */
    const r=inW||d<RT*.78?.32+hash(hv*3.7)*.62:hash(hv*3.7);
    if(r<.2)greenAdd(natKit('broad',hv),x,y-.01,z,.17+hv*.05,.17+hv*.05,.17+hv*.05,hv*6,hv<.5?0x4e6a32:0x5a7236);/* fruit tree */
    else if(r<.8){for(let q=0;q<2;q++){const a=hv*6+q*2.1,bx=x+Math.cos(a)*.02,bz=z+Math.sin(a)*.02;greenAdd('bush',bx,groundY(bx,bz)-.01,bz,.22+q*.04,.19+q*.04,.22+q*.04,a,q%2?0x44622e:0x50703a)}}
    else if(r<.94){const rot=hash(hv*2.2)*3.14;add('bed',x,y-.004,z,.07,.008,.05,rot,0xe0d0c0);bareRect(x,z,rot,.075,.055)}
    else{add('hay',x,y,z,.04,.045,.04,0,0xe8d8a8)}}}
/* the small things that make a street homely: flower boxes under the front windows or a bed of flowers by the door, barrels and
   crates, a bench by the wall, and from the Middle Ages a lantern beside the door that glows warm at night */
const COZY_FL=[0xd8504a,0xf0c040,0xf0ecf4,0xd070b0,0xf08a40,0x9a6ad0,0xe84a6a];
function cozyBits(sl,y,e,hk){const fx=Math.sin(sl.rot),fz=Math.cos(sl.rot),rx=Math.cos(sl.rot),rz=-Math.sin(sl.rot);
  const F=(along,out)=>[sl.x+fx*(sl.d/2+out)+rx*along,sl.z+fz*(sl.d/2+out)+rz*along],fl=q=>COZY_FL[(hash(hk*7.7+q)*COZY_FL.length)|0];
  const h1=hash(hk*61+5);
  if(h1<.42){for(const sd of [-1,1]){const [x,z]=F(sd*sl.w*.27,.006);add('box',x,y+.02,z,.026,.005,.007,sl.rot,0x6a4a2e);
      for(let q=0;q<3;q++){const [bx,bz]=F(sd*sl.w*.27+(q-1)*.008,.007);add('bloom',bx,y+.025,bz,.008,.008,.008,0,fl(q+sd*5))}}}
  else if(h1<.68){for(let q=0;q<5;q++){const [x,z]=F(sl.w*.26+(q-2)*.011,.016+(q%2)*.006);const g=groundY(x,z);if(g>waterY+.01)add('bloom',x,g+.003,z,.009,.009,.009,0,fl(q))}}
  const h2=hash(hk*29+11);
  if(h2<.22){const [x,z]=F(-sl.w*.34,.018),g=groundY(x,z);add('cyl',x,g,z,.014,.02,.014,0,0x7a5434);add('cyl',x+rx*.017,g,z+rz*.017,.012,.017,.012,0,0x6a4a2e)}
  else if(h2<.36){const [x,z]=F(-sl.w*.3,.018),g=groundY(x,z);add('box',x,g,z,.018,.016,.018,sl.rot+.3,0x9a7a4e);add('box',x,g+.016,z,.013,.011,.013,sl.rot-.2,0x8a6a40)}
  else if(h2<.48){const [x,z]=F(-sl.w*.08,.014),g=groundY(x,z);add('box',x,g+.009,z,.036,.004,.011,sl.rot,0x7a5a3a);for(const sd of [-1,1])add('box',x+rx*sd*.015,g,z+rz*sd*.015,.003,.009,.009,sl.rot,0x5a4430)}
  if(e>=3&&hash(hk*13+7)<.3){const [x,z]=F(sl.w*.16,.004);add('lamp',x,y+.03,z,.008,.011,.008,sl.rot)}}
function yard(x,z,rot,w,d,pd,pw,hk){const c=Math.cos(rot),s=Math.sin(rot);
  const L=(name,lx,lz,dy,sx,sy,sz,col,er)=>{const X=x+lx*c+lz*s,Z=z-lx*s+lz*c,Y=groundY(X,Z);if(Y<waterY+.02)return;add(name,X,Y+dy,Z,sx,sy,sz,rot+(er||0),col);if(name==='bed'||name==='timber'||name==='hay')bareRect(X,Z,rot+(er||0),sx,sz)};
  const z0=-d/2-.008,z1=z0-pd,zc=(z0+z1)/2,fc=0x7d6c55;
  L('fence',-pw/2,zc,0,.004,.013,pd,fc);L('fence',pw/2,zc,0,.004,.013,pd,fc);L('fence',0,z1,0,pw,.013,.004,fc);
  for(let q=0;q<=Math.round(pd/.04);q++){const zz=z0-q*pd/Math.round(pd/.04);L('fence',-pw/2,zz,0,.006,.018,.006,0x5e4f3c);L('fence',pw/2,zz,0,.006,.018,.006,0x5e4f3c)}
  /* the painted look: gardens end in a low hedge, and some have a fruit tree */
  if(LK.pixel){const G=(k,lx,lz,dy,sx,sy,sz,col,er)=>{const X=x+lx*c+lz*s,Z=z-lx*s+lz*c,Y=groundY(X,Z);if(Y<waterY+.02)return;greenAdd(k,X,Y+dy,Z,sx,sy,sz,rot+(er||0),col)};
    const nh=Math.max(2,Math.round(pw/.035));for(let q=0;q<nh;q++){const hv=hash(hk*17+q*3.1);if(hv<.25)continue;G('bush',-pw/2+pw*(q+.5)/nh,z1-.006,-.008,.2+hv*.06,.16+hv*.05,.2+hv*.06,0x44622e,hv*6)}
    if(hash(hk*53+2)<.12){const fx=(hash(hk*5)<.5?-1:1)*pw*.3;G(natKit('broad',hash(hk*3)),fx,z1+pd*.3,-.01,.17,.17,.17,0x4e6a32,hash(hk)*6)}}
  /* now and then a washing line across the garden */
  if(hash(hk*71+3)<.2&&pd>.06){const zl=z0-pd*.62;L('fence',-pw*.36,zl,0,.004,.036,.004,0x6a5034);L('fence',pw*.36,zl,0,.004,.036,.004,0x6a5034);L('fence',0,zl,.034,pw*.72,.0015,.0015,0xe8e8e0);
    for(let q=0;q<4;q++){if(hash(hk*5+q)<.25)continue;L('box',(q-1.5)*pw*.16,zl,.02,.016,.014,.002,[0xf0ece4,0x8aa0c8,0xd86a5a,0xe8d890,0xa8c8a0][(hash(hk*9+q)*5)|0])}}
  const h2=hash(hk*91+7),nb=1+((h2*3)|0),bw=pw*.8/nb;
  for(let b=0;b<nb;b++){const bx=-pw*.4+bw*(b+.5),bl=pd*(.45+hash(hk*13+b)*.25);L('bed',bx,z1+.012+bl/2,-.004,bw*.82,.008,bl,[0xffffff,0xe0d0c0,0xd8e0c8][b%3])}
  const ex=hash(hk*29+1),zx=z0-pd*.22,xx=(hash(hk*7)<.5?-1:1)*pw*.28;
  if(ex<.28){L('hay',xx,zx,0,.045,.05,.045,0xe8d8a8);L('hay',xx+.04,zx-.02,0,.035,.04,.035,0xe8d8a8)}
  else if(ex<.48){L('timber',xx,zx,0,.06,.022,.022,0xb09070)}
  else if(ex<.68){L('timber',xx,zx,-.01,.05,.04,.045,0xd0c8c0);L('hipThatch',xx,zx,.028,.064,.04,.065,0xe0d8cc)}
  else if(ex<.75){L('townTree',xx,zx,-.01,.09,.09,.09,0x5e8a3a)}}
/* ---------- regional architecture ---------- */
const PASTEL=[0xe8a8a0,0x9ec8e0,0xf0d070,0xa8d8a0,0xf0c090,0xe8e0f0];
function flatHouse(x,y,z,rot,w,d,hh,col,hk,opt){/* flat-roofed house: parapet, small windows, sometimes a dome or a wind tower */
  add('adobe',x,y-.02,z,w,hh+.02,d,rot,col);const pc=col;
  for(const [dx,dz,sx,sz] of [[0,d/2-.003,w,.006],[0,-d/2+.003,w,.006],[w/2-.003,0,.006,d],[-w/2+.003,0,.006,d]])P('adobe',x,y+hh,z,rot,dx,dz,0,sx,.008,sz,pc);
  P('adobe',x,y+hh-.005,z,rot,0,0,0,w+.007,.005,d+.007,shadeHex(pc,.86));
  facade(x,y,z,rot,w,d,hh,hk,hh>.07?2:1,true);
  if(opt&&opt.beams)for(let k=0;k<4;k++)for(const sd of [-1,1])P('box',x,y,z,rot,-w*.4+k*w*.27,sd*(d/2+.004),hh*(.35+.4*(k%2)),.003,.003,.01,0x4a3826);
  if(opt&&opt.dome)add('domeW',x,y+hh,z,w*.5,w*.38,w*.5,0,opt.dome);
  if(opt&&opt.tower)P('adobe',x,y+hh,z,rot,w*.3,-d*.25,0,.016,hh*.6,.016,pc)}
function roundHut(x,y,z,r,h,wall,roof){add('adobeCyl',x,y-.02,z,r*2,h+.02,r*2,0,wall);add('coneThatch',x,y+h-.004,z,r*2.7,r*2.1,r*2.7,0,roof)}
function cultureDwelling(cu,n,x,y,z,rot,e,hk,k,core){const o=hash(hk*97+1),pick=a=>a[(o*a.length)|0];
  if(cu==='africa'){
    if(e<=2||(e===3&&core<.4)){roundHut(x,y,z,.044,.032,pick([0xb06a40,0xa86040,0xc08050]),0xd8cca8);if(o>.4)roundHut(x+.055*Math.cos(rot),y,z-.055*Math.sin(rot),.026,.024,0xb87048,0xd0c4a0);
      if(o>.7){add('adobeCyl',x-.05*Math.sin(rot),y+.012,z-.05*Math.cos(rot),.03,.026,.03,0,0xb07040);add('coneThatch',x-.05*Math.sin(rot),y+.036,z-.05*Math.cos(rot),.04,.03,.04,0,0xd8cca8)}return true}
    if(e<=4){flatHouse(x,y,z,rot,.1,.085,.045+core*.03,pick([0xb8784a,0xc08858,0xa86a44]),hk,{beams:true});return true}
    flatHouse(x,y,z,rot,.1,.09,.05+core*.05,pick(PASTEL),hk,{});P('tiles',x,y+.05+core*.05,z,rot,0,0,0,.104,.012,.094,0x9aa0a6);return true}
  if(cu==='mideast'){
    if(e===0)return false;
    const tall=.045+core*core*.06;flatHouse(x,y,z,rot,.1,.09,tall,pick([0xe0cca4,0xefe8dc,0xd8c094,0xf2eee6]),hk,{dome:core>.5&&o>.6?pick([0xf2eee6,0x3a6a9a,0x4a8a7a]):0,tower:o<.15});return true}
  if(cu==='med'){
    if(e===0)return false;
    const col=e<=2?pick([0xd8c49a,0xe6d6b4]):pick([0xf6f2ea,0xf2eee6,0xe8c890,0xf0d8b0,0xe0b080]),h=.045+(e>=3?core*.045:0);
    flatHouse(x,y,z,rot,.1,.085,h,col,hk,{});if(o<.7){P('hipTile',x,y+h,z,rot,0,0,0,.12,.03,.105,pick([0xc0603a,0xb85a36,0xa85030]));eaves(x,y+h,z,rot,.116,.101)}
    if(e>=3&&o>.5)facade(x,y,z,rot,.1,.085,h,hk,h>.07?2:1,false);return true}
  if(cu==='nordic'){
    if(e===0||e>=6)return false;
    if(e===5){house(x,y,z,rot,.085,.09,(.075+core*.04),'timber',pick([0xb04a3a,0xd8a848,0xf0ece4,0x8aa0b8,0x6a3a2a,0x3a5a4a]),'tiles',0x34383c,true,{hk:hash(hk*97+1),annex:false,garden:o<.5,lamp:k%3===0,fenceCol:0xe8e2d4});return true}
    if(e<=2||core<.3){add('timber',x,y-.02,z,.15,.052,.065,rot,pick([0xc8b8a8,0xb0a090,0xd0c4b4]));P('hipThatch',x,y+.03,z,rot,0,0,0,.18,.06,.1,pick([0x8aa860,0x7a9850,0x98b070]));
      facade(x,y,z,rot,.15,.065,.032,hk,1,true);return true}
    add('plaster',x,y-.02,z,.1,.075,.08,rot,pick([0xb04a3a,0xa84434,0xd8b050,0xf0ece4,0x8aa0b8]));framing(x,y,z,rot,.1,.08,.055,1);
    P('tiles',x,y+.055,z,rot,0,0,0,.115,.05,.095,0x3e3e42);eaves(x,y+.055,z,rot,.112,.092);facade(x,y,z,rot,.1,.08,.055,hk,1);chimney(x,y+.03,z,rot,.1,.08,y+.1,hk,o<.4);return true}
  if(cu==='east'){
    if(e===0)return false;
    const h=.04+(e>=3?core*.03:0),col=pick([0xf2eee6,0xe8dcc8,0xd8c8b0]);
    add('stone',x,y-.025,z,.106,.012,.09,rot,0xb8b2a8);add('plaster',x,y-.02,z,.09,h+.02,.075,rot,col);framing(x,y,z,rot,.09,.075,h,1);
    const rc=e<=2?0xb8ac98:pick([0x4a4e56,0x3e4248,0x5a5e66,0x6a4a3a]),roofKit=e<=2?'hipThatch':'hipTile';
    P(roofKit,x,y+h-.003,z,rot,0,0,0,.15,.032,.13,rc);P('box',x,y+h+.027,z,rot,0,0,0,.075,.006,.01,0x2e3034);
    if(core>.55&&e>=3){P('plaster',x,y+h+.012,z,rot,0,0,0,.06,.028,.05,col);P(roofKit,x,y+h+.038,z,rot,0,0,0,.1,.026,.088,rc)}
    facade(x,y,z,rot,.09,.075,h,hk,1,true);return true}
  if(cu==='meso'){
    if(e===0)return false;
    if(e<=3){const col=pick([0xd8c8a8,0xc8b490,0xe0d4bc]);if(o<.5){flatHouse(x,y,z,rot,.095,.08,.042,col,hk,{beams:o<.2})}
      else{add('adobe',x,y-.02,z,.09,.04,.075,rot,col);P('hipThatch',x,y+.036,z,rot,0,0,0,.12,.07,.105,0xc8b890);facade(x,y,z,rot,.09,.075,.038,hk,1,true)}return true}
    const h=.045+core*.04,col=pick(PASTEL);add('adobe',x,y-.02,z,.1,h+.02,.085,rot,col);P('hipTile',x,y+h,z,rot,0,0,0,.118,.028,.1,0xb85a36);eaves(x,y+h,z,rot,.114,.097);
    facade(x,y,z,rot,.1,.085,h,hk,h>.07?2:1);if(o>.6)P('box',x,y,z,rot,0,.047,h*.62,.07,.004,.012,0x5a3a26);return true}
  return false}
/* the heart of a lagoon capital: a pink and white palace with an arcade, a tall brick bell tower and a basilica of five domes */
function lagoonCapital(n,x,y,z,e){const nc=parseInt(n.color.slice(1),16);
  add('plazaStone',x,y-.03,z,.6,.035,.6,0);
  const px=x+.1,pz=z-.12;add('adobe',px,y-.02,pz,.3,.11,.12,0,0xf0d8d0);add('stone',px,y-.02,pz,.31,.035,.125,0,0xece6da);
  for(let q=0;q<9;q++)add('box',px-.13+q*.0325,y-.02,pz+.061,.018,.03,.002,0,0x3a2e28);/* the arcade */
  for(let q=0;q<7;q++)add('box',px-.12+q*.04,y+.05,pz+.061,.014,.022,.002,0,0x26221e);
  CRENEL_FORK=true;crenel(px,y+.09,pz+.06,.3,0,0xf2ece4);crenel(px,y+.09,pz-.06,.3,0,0xf2ece4);CRENEL_FORK=false;
  const tx=x-.15,tz=z-.14;add('brick',tx,y-.03,tz,.05,.46,.05,0,0xc06a4a);add('stone',tx,y+.43,tz,.058,.05,.058,0,0xece6da);for(const [ox,oz,rr] of [[0,.0292,0],[0,-.0292,0],[.0292,0,Math.PI/2],[-.0292,0,Math.PI/2]])add('box',tx+ox,y+.445,tz+oz,.03,.03,.002,rr,0x26221e);add('pyr',tx,y+.48,tz,.06,.09,.06,0,0x6a9a7a);add('box',tx,y+.57,tz,.004,.02,.004,0,0xd4af37);
  const bx=x-.07,bz=z+.1;add('stone',bx,y-.03,bz,.2,.1,.16,0,0xe8e0d0);add('box',bx,y-.03,bz+.081,.03,.05,.002,0,0x2a2420);for(let q=0;q<4;q++)add('box',bx-.075+q*.05,y+.035,bz+.081,.025,.02,.002,0,0xd4af37);
  for(const [dx,dz,r] of [[0,0,.075],[-.06,0,.05],[.06,0,.05],[0,-.05,.05],[0,.05,.05]])add('domeW',bx+dx,y+.07,bz+dz,r,r*.95,r,0,0x8aa8a0);
  add('cyl',x+.24,y,z+.2,.006,.2,.006,0,0x5a4632);add('box',x+.262,y+.17,z+.2,.04,.024,.003,0,nc)}
function palazzo(x,y,z,rot,hk,core){const o=hash(hk*61+3),col=[0xd8905a,0xe8b088,0xc86a50,0xf0d8b0,0xe8c890,0xd07860,0xf2e6d0][(o*7)|0],hh=.075+core*.06+o*.02,w=.09,d=.08;
  add('adobe',x,y-.01,z,w,hh+.01,d,rot,col);P('stone',x,y-.01,z,rot,0,0,0,w*1.02,.014,d*1.02,0xd8d0c0);
  const floors=hh>.11?3:2;facade(x,y,z,rot,w,d,hh,hk,floors,false);
  for(let f=1;f<floors;f++)P('box',x,y,z,rot,0,d/2+.002,hh*f/floors-.002,w*1.01,.003,.004,0xe8e2d4);/* stone string courses */
  if(o>.5)P('box',x,y,z,rot,0,d/2+.006,hh/floors+.006,w*.5,.003,.012,0xe8e2d4);/* a balcony over the water */
  P('hipTile',x,y+hh,z,rot,0,0,0,w*1.12,.026,d*1.14,0xc0603a);eaves(x,y+hh,z,rot,w*1.08,d*1.1);
  if(o<.6){const cx_=(o<.3?-1:1)*w*.3;P('stone',x,y+hh,z,rot,cx_,-d*.15,0,.012,.03,.012,0xd8b098);P('coneTile',x,y+hh+.045,z,rot,cx_,-d*.15,0,.022,-.018,.022,0xb85a36)}}/* a funnel chimney */
function dwelling(n,x,y,z,rot,e,hk,k,core){core=core||0;
  if(MCTX.lagoon&&e>=2&&e<=5&&hash(hk*5.1)<.8){palazzo(x,y,z,rot,hk,core);return}
  if(e<=5&&n&&cultOf(n)!=='west'&&cultureDwelling(cultOf(n),n,x,y,z,rot,e,hk,k,core))return;const tall=1+(e>=3&&e<=5?core*core*(.6+hk*.9):0);
  const pick=a=>a[(hk*a.length)|0],o={hk:hash(hk*97+1),annex:e>=1,garden:e>=1&&e<=5,lamp:e>=4&&e<=5&&k%3===0,fenceCol:e>=3?0xe8e2d4:0x8a6a46};
  const A=AR(),WALLS=A.walls,ROOF_RED=A.red,ROOF_SLATE=A.slate;
  if(e===0){const cu=cultOf(n);/* Stone Age homes differ from land to land */
    if(cu==='nordic'){add('timber',x,y-.02,z,.1,.035,.065,rot,0x8a7a62);P('hipThatch',x,y+.012,z,rot,0,0,0,.13,.045,.09,0x6a8a48);return}/* turf-roofed hut */
    if(cu==='mideast'){P('thatch',x,y-.012,z,rot,0,0,0,.13,.045,.095,0x3a3028);for(const sd of [-1,1])P('cyl',x,y-.01,z,rot,sd*.055,0,0,.003,.05,.003,0x6a5236);return}/* goat-hair tent */
    if(cu==='med'){add('adobeCyl',x,y-.02,z,.075,.042,.075,0,0xe8e2d4);add('coneTile',x,y+.02,z,.082,.06,.082,0,0x9a948a);return}/* drystone trullo */
    if(cu==='east'){add('cyl',x,y-.03,z,.1,.03,.1,0,0x6a5a48);add('coneThatch',x,y-.004,z,.15,.085,.15,0,0xc8b888);return}/* pit house */
    if(cu==='meso'){add('adobe',x,y-.02,z,.08,.035,.06,rot,0xc8b490);P('hipThatch',x,y+.012,z,rot,0,0,0,.11,.065,.09,0xb8a870);return}/* palm-thatched hut */
    add('cyl',x,y-.02,z,.08,.04,.08,0,0x7d6248);add('coneThatch',x,y+.02,z,.11,.07,.11,rot);return}
  if(e<=2||(e===3&&core<.22)||(e===4&&core<.12&&hk<.5)){cottage(x,y,z,rot,.1,.075,.04+hk*.012,hk);return}
  if(e<=2){house(x,y,z,rot,.13,.07,.045,'plaster',0xa8916e,'thatch',0xffffff,false,o);return}
  if(e===3){if(hk<.12)house(x,y,z,rot,.1,.08,.055,'plaster',WALLS[(o.hk*3)|0],'thatch',0xffffff,true,o);
    else house(x,y,z,rot,.1,.08,.06*tall,hk<.85?'plaster':'stone',WALLS[(o.hk*6)|0],'tiles',pick(ROOF_RED),true,o);return}
  if(e===4){house(x,y,z,rot,.1,.08,.1*tall,hk<.55?'plaster':hk<.8?'brick':'stone',WALLS[(o.hk*6)|0],'tiles',hk<.7?pick(ROOF_RED):pick(ROOF_SLATE),true,o);return}
  if(e===5){const v=o.hk,s=clamp((MCTX.w||.12)/.12,.62,1.1);/* houses fit their plot, so streets stay open */
    if(v<.42)house(x,y,z,rot,.13*s,.08*s,.09*tall*Math.max(s,.8),'brick',0xffffff,'tiles',pick(ROOF_SLATE),true,o);
    else if(v<.78)house(x,y,z,rot,.12*s,.08*s,.085*tall*Math.max(s,.8),'plaster',WALLS[(hash(hk*41)*WALLS.length)|0],'tiles',pick(ROOF_RED),true,o);
    else house(x,y,z,rot,.12*s,.08*s,.09*tall*Math.max(s,.8),'stone',0xe8e0d0,'tiles',pick(ROOF_SLATE),true,o);return}
  if(e===6){modernBuilding(n,x,y,z,rot,hk,core,MCTX.w||.12);return}
  futureBuilding(n,x,y,z,rot,hk,core,MCTX.w||.12);
}
function factory(x,y,z,rot,dark){P('brick',x,y-.02,z,rot,0,0,0,.26,.1,.15,0xffffff);
  for(let k=-1;k<=1;k++)P('tiles',x,y+.08,z,rot,k*.085,0,0,.085,.05,.16,ROOF_SLATE[0],Math.PI/2);
  for(const dx of [-.09,.1]){P('cyl',x,y-.02,z,rot,dx,-.09,0,.035,.36,.035,0x5b4136);const c=Math.cos(rot),s=Math.sin(rot);smokeAt(x+dx*c-.09*s,y+.34,z-dx*s-.09*c,dark,2.4)}
}
function windmill(x,y,z,rot){const g=new THREE.Group();
  const t=new THREE.Mesh(KITS.tower.mesh.geometry,MAT.plaster);t.scale.set(.07,.16,.07);t.castShadow=true;g.add(t);
  const cap=new THREE.Mesh(KITS.coneThatch.mesh.geometry,MAT.thatch);cap.scale.set(.085,.07,.085);cap.position.y=.16;cap.castShadow=true;g.add(cap);
  const hub=new THREE.Group();hub.position.set(0,.17,.05);g.add(hub);
  for(let k=0;k<4;k++){const b=new THREE.Mesh(KITS.box.mesh.geometry,MAT.plain);b.scale.set(.018,.14,.004);b.rotation.z=k*Math.PI/2;b.castShadow=true;hub.add(b)}
  g.position.set(x,y-.02,z);g.rotation.y=rot;g.userData.hub=hub;scene.add(g);windmills.push(g)}
let coveShips=[],windmills=[],emitters=[],herds=[],townFlags=[];const bgrid=new Set();
const FLAGGEO=(()=>{const g=new THREE.PlaneGeometry(1,1,8,2);g.translate(.5,0,0);const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i);p.setZ(i,Math.sin(x*5.5)*.07*x)}g.computeVertexNormals();return g})();
const FLAGMAT=new Map();
function flagMat(n){const f=ensureFlag(n),k=flagKey(f);let m=FLAGMAT.get(k);if(!m){m=stdMat({map:flagTexture(f),side:THREE.DoubleSide,roughness:.9});FLAGMAT.set(k,m)}return m}
function townFlag(n,x,y,z,cap,e){const ht=cap?.2:.13,pc=e>=5?0xb8bcc0:0x6a5236;add('cyl',x,y,z,.0045,ht,.0045,0,pc);if(e>=1)add('stone',x,y-.005,z,.018,.012,.018,0,0xa8a090);
  const m=new THREE.Mesh(FLAGGEO,flagMat(n));const s=cap?.075:.055;m.scale.set(s,s*.66,s);m.position.set(x,y+ht-s*.36,z);m.userData.ph=hash(x*13+z*7)*6.28;m.castShadow=true;scene.add(m);townFlags.push(m)}
const ARCH={classic:{label:'Old World',desc:'Timber, plaster, red and slate roofs',walls:[0xffffff,0xf3e6c8,0xf0d9b8,0xe8d6d0,0xdfe6ea,0xf6efe0],red:ROOF_RED,slate:ROOF_SLATE,roofH:.85},
  mediterranean:{label:'Sun Coast',desc:'Whitewash, terracotta and low roofs',walls:[0xfbf8f2,0xf4eee2,0xf0e4cc,0xf6f0e6],red:[0xc0603a,0xb5532f,0xc9704a,0xd07a52],slate:[0xc0603a,0xb5532f],roofH:.42},
  nordic:{label:'Northland',desc:'Falu red, ochre and steep dark roofs',walls:[0x8e2f25,0xb36b2a,0x34403f,0xe8e0cc,0x7a2a22,0x8e2f25],red:[0x4a3e36,0x564a3e,0x5a3a2e],slate:[0x4a4440,0x544a42],roofH:1.2},
  harbour:{label:'Harbour Town',desc:'Bright painted fronts and gabled rows',walls:[0xe9b44c,0x6fa8c8,0xd9786a,0x8fbf8a,0xf0e6d8,0xc79ad1],red:[0x8e3f2c,0x7c3a2b],slate:[0x4f5864,0x3f4652],roofH:.95}};
const AR=()=>ARCH[settings.arch]||ARCH.classic;
const AWN=[0xc0392b,0xe0b030,0x2e6fb0,0x3f8f4a,0xe8e2d4,0x9b4fa0];
/* street life for towns near the camera: avenue trees, lamps, road markings, café terraces and gardens */
kit('smog',new THREE.SphereGeometry(.5,14,7),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.2,depthWrite:false,fog:true}),300,false);KITS.smog.mesh.renderOrder=2;BUILD_KITS.push('smog');
kit('moat',unitCyl(28),inlandWaterMat('moat'),400,false);BUILD_KITS.push('moat');
kit('parasol',unitCone(6),MAT.plain,3000);kit('bloom',new THREE.SphereGeometry(.5,5,3),MAT.plain,20000,false);BUILD_KITS.push('parasol','bloom');
const HOME_WALL=[0xf0e0c8,0xe8c4bc,0xd8dde2,0xf2ead6,0xe2c9a4,0xc8d8c8,0xf4d6a0],BLOOMS=[0xe8506a,0xf2c040,0xf4f0f0,0xb070d0,0xe87a3a];
function streetLife(n,c,plan,e,cx,cy,cz,cap,i0,reach){if(e<4)return;let trees=0,lamps=0;const TMAX=cap?520:260;
  plan.streets.forEach((st,si)=>{const pts=st.pts,lim=reach?reach.get(si):1e9;if(pts.length<4||!lim)return;const w=st.main?(e<5?.05:.066):(e<5?.034:.044);
    for(let k=2;k<pts.length-2;k++){if(pts[k][2]>lim)break;const p=pts[k],q=pts[k+1],dx=q[0]-p[0],dz=q[1]-p[1],L=Math.hypot(dx,dz)||1,nx=-dz/L,nz=dx/L,hk=hash(i0*7+si*131+k*17);
      const dc=Math.hypot(p[0]-cx,p[1]-cz);if(dc<plan.pr+.04)continue;
      /* trees line the avenues; in the suburbs they shade the side streets too */
      if(trees<TMAX&&k%3===0&&(st.main||plan.metro&&hk<.45)&&e>=5)for(const sd of [1,-1]){const x=p[0]+nx*sd*(w/2+.014),z=p[1]+nz*sd*(w/2+.014),t=tileAt(x,z);if(t<0||owner[t]!==n.id||isWater(t))continue;const y=groundY(x,z);if(y<waterY+.03)continue;
        const s=.17+hash(hk*9+sd)*.08;add('townTree',x,y,z,s,s*1.15,s,hk*6,e>=7?0x6fae58:0x5a8a3e);trees++}
      /* lamps along the main roads */
      if(st.main&&k%5===2&&lamps<160){const sd=k%10===2?1:-1,x=p[0]+nx*sd*(w/2+.006),z=p[1]+nz*sd*(w/2+.006),y=groundY(x,z);if(y>waterY+.03){add('fence',x,y,z,.004,.05,.004,0,e>=6?0x8a9096:0x2e2a26);add('lamp',x,y+.05,z,.01,.006,.01,0);lamps++}}
      /* a dashed white line down the middle of modern roads */
      if(e>=6&&st.main&&k%2===0){const y=groundY(p[0],p[1])+.0205,a=Math.atan2(dx,dz);add('fence',p[0],y,p[1],.006,.0015,.034,a,0xf2f0ea)}}});
  if(e>=4&&!cap){/* café terraces around the square */const r=plan.pr*.78,m=3+((hash(i0*5.5)*4)|0);for(let k=0;k<m;k++){const a=k/m*6.283+hash(i0*2.1)+.35,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r,y=groundY(x,z),col=[0xf2e8d0,0xd8443a,0xf0c040,0x3a7ab8][(hash(i0+k*3)*4)|0];
    add('fence',x,y,z,.003,.034,.003,0,0x5a4a3a);add('parasol',x,y+.026,z,.04,.014,.04,a,col);add('box',x+.014,y,z+.01,.014,.012,.014,a,0x7a5a3a);add('box',x-.014,y,z-.01,.014,.012,.014,a,0x7a5a3a)}
    /* benches and flower beds */for(let k=0;k<6;k++){const a=k/6*6.283+.8,r2=plan.pr*.5,x=cx+Math.cos(a)*r2,z=cz+Math.sin(a)*r2,y=groundY(x,z);
      if(k%2)add('box',x,y,z,.03,.008,.01,-a,0x6a4a30);else{add('box',x,y-.004,z,.03,.012,.03,a,0x4a7a34);for(let b=0;b<3;b++)add('bloom',x+(hash(i0+k+b)-.5)*.02,y+.009,z+(hash(i0*3+k+b)-.5)*.02,.01,.008,.01,0,BLOOMS[(hash(i0*k+b)*5)|0])}}}}
function frontGarden(x,y,z,rot,w,d,hk){/* a hedge or a white fence around a little lawn with flowers */const c=Math.cos(rot),s=Math.sin(rot),W2=w*.8,D2=d*.85,hedge=hash(hk*5)<.6,col=hedge?0x3f6a2e:0xf0ece2,hh=hedge?.016:.012,th=hedge?.01:.003;
  const sides=[[0,D2,W2*2,th],[W2,0,th,D2*2],[-W2,0,th,D2*2]];for(const [a,b,ww,dd] of sides)add(hedge?'box':'fence',x+a*c+b*s,y-.004,z-a*s+b*c,ww,hh,dd,rot,col);
  if(hash(hk*13)<.6)for(let k=0;k<3;k++){const a=(k-1)*W2*.6,b=D2*.75;add('bloom',x+a*c+b*s,y+.003,z-a*s+b*c,.012,.009,.012,0,BLOOMS[(hash(hk*7+k)*5)|0])}}
function cityCenter(n,c,cx,cy,cz,e,cap,i0){
  const r=cap?.3:.15;if(e>=1){add(e>=3?'plazaStone':'plazaDirt',cx,cy-.012,cz,r*2,.016,r*2,hash(i0)*6)}
  if(cap)return;
  if(e>=1&&e<=3){add('cyl',cx,cy,cz,.04,.025,.04,0,0x9a948a);add('pool',cx,cy+.005,cz,.03,.022,.03);add('cyl',cx-.016,cy,cz,.004,.05,.004,0,0x5a4632);add('cyl',cx+.016,cy,cz,.004,.05,.004,0,0x5a4632);add(e>=3?'tiles':'thatch',cx,cy+.05,cz,.05,.02,.045,0,0x8e3f2c)}
  else if(e<=5){add('cyl',cx,cy,cz,.09,.018,.09,0,0xd8d2c6);add('pool',cx,cy+.004,cz,.078,.016,.078);add('cyl',cx,cy,cz,.012,.05,.012,0,0xd8d2c6);emitters.push({x:cx,y:cy+.05,z:cz,fountain:true,rate:6})}
  else if(e===6){add('pool',cx,cy-.008,cz,r*1.7,.012,r*1.7,0,0x4f8a3a);for(let k=0;k<4;k++){const a=k*1.57+.4;add('townTree',cx+Math.cos(a)*.08,cy,cz+Math.sin(a)*.08,.4,.4,.4,0,0x4f8a3a)}}
  else{/* a green square: a pond among trees and flowers */add('pool',cx,cy-.008,cz,r*1.4,.012,r*1.4,0);for(let k=0;k<6;k++){const a=k/6*6.283+.3;add('townTree',cx+Math.cos(a)*r*.85,cy,cz+Math.sin(a)*r*.85,.32,.36,.32,0,0x4f8a3a);add('bloom',cx+Math.cos(a+.5)*r*.75,cy-.004,cz+Math.sin(a+.5)*r*.75,.03,.02,.03,0,BLOOMS[k%5])}}
  if(e>=1&&e<=5){const stalls=2+((hash(i0*3.3)*4)|0);for(let k=0;k<stalls;k++){const a=k/stalls*6.283+hash(i0+k),sx=cx+Math.cos(a)*r*.72,sz=cz+Math.sin(a)*r*.72,rt=-a;
    P('box',sx,cy,sz,rt,0,0,0,.035,.016,.022,0x7a5a3a);P('cyl',sx,cy,sz,rt,-.015,.009,0,.003,.04,.003,0x5a4632);P('cyl',sx,cy,sz,rt,.015,.009,0,.003,.04,.003,0x5a4632);
    P('awning',sx,cy+.035,sz,rt,0,0,0,.042,.014,.03,AWN[(hash(i0*7+k)*AWN.length)|0])}}
  if(e>=4&&e<=5)for(let k=0;k<6;k++){const a=k/6*6.283+.3,lx=cx+Math.cos(a)*(r+.02),lz=cz+Math.sin(a)*(r+.02);add('cyl',lx,cy,lz,.004,.075,.004,0,0x2e2e2e);add('lamp',lx,cy+.072,lz,.012,.014,.012)}
  if(e>=1&&e<=5&&herds.length<120){for(let h=0;h<1+(hash(i0*5)<.5?1:0);h++){const a=hash(i0*11+h)*6.283,d=.55+hash(i0*13+h)*.4,hx=cx+Math.cos(a)*d,hz=cz+Math.sin(a)*d,ti=Math.floor(hz+H/2)*W+Math.floor(hx+W/2);
    if(ti>=0&&ti<N&&owner[ti]===n.id&&(biome[ti]===4||biome[ti]===8)&&groundY(hx,hz)>waterY+.05)herds.push({x:hx,z:hz,kind:(q=>q<.45?'sheep':q<.78?'cow':q<.9?'pig':'horse')(hash(i0+h*3)),n:3+((hash(i0*17+h)*4)|0),seed:i0*7+h})}}}
function harbour(c,cx,cz,e,i0,lvl){let d=-1;for(let q=0;q<4;q++){const X=c.x+DX[q],Y=c.y+DY[q];if(X<0||Y<0||X>=W||Y>=H)continue;if(isWater(Y*W+X)){d=q;break}}if(d<0)return;
  if((lvl||0)>=5&&bigHarbour(c,cx,cz,e,i0,lvl,d))return;
  const len=e>=SAIL?.55:.32,px=cx+DX[d]*.45,pz=cz+DY[d]*.45,ax=DX[d]?len:.06,az=DY[d]?len:.06;
  add('box',px,waterY-.04,pz,ax,.06,az,0,e>=6?0x9a9a96:0x6b5038);
  for(const s of [-1,0,1])add('cyl',px+DX[d]*len*.45*s,waterY-.15,pz+DY[d]*len*.45*s,.016,.18,.016,0,0x4a3828);
  const boats=e>=SAIL?3:2;for(let k=0;k<boats;k++){const side=k%2?1:-1,t=(k/boats-.3)*len,bx=px+DX[d]*t+DY[d]*.07*side,bz=pz+DY[d]*t+DX[d]*.07*side,rot=DX[d]?0:Math.PI/2;
    add('boat',bx,waterY+.012,bz,.1,.04,.035,rot,hash(i0+k)<.5?0x6b4a2e:0x8a5a3a);add('cyl',bx,waterY+.012,bz,.004,.09,.004,0,0x5a4632);
    if(e<5)add('awning',bx,waterY+.03,bz,.004,.05,.045,rot+Math.PI/2,0xf0ead8)}
  if(e>=SAIL){const wx_=cx+DX[d]*.25+DY[d]*.2,wz_=cz+DY[d]*.25+DX[d]*.2,wy=groundY(wx_,wz_);add(e>=5?'brick':'plaster',wx_,wy-.02,wz_,.14,.08,.09,DX[d]?Math.PI/2:0,0xffffff);add('tiles',wx_,wy+.06,wz_,.15,.05,.11,DX[d]?Math.PI/2:0,ROOF_SLATE[1])}
  if(e>=5){const kx=px+DX[d]*len*.3+DY[d]*.05,kz=pz+DY[d]*len*.3+DX[d]*.05;add('cyl',kx,waterY,kz,.012,.22,.012,0,0xd8a02a);add('box',kx,waterY+.21,kz,DX[d]?.016:.14,.012,DX[d]?.14:.016,0,0xd8a02a)}}
/* ---------- big harbours for big cities ----------
   A growing port builds out along its shore: a stone quay following the waterline, jetties reaching into the sea with
   boats and ships moored alongside, warehouses behind the quay, cranes (wooden treadwheel cranes, later steel ones),
   and in the great ports a breakwater with a lighthouse at its end. Ships use the real ship models when they are loaded. */
const HB_MAT=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8});tideHook(HB_MAT);
const HB_SHIPS=[['viking_boat',0,2],['sail_ship',3,5],['liner',5,6],['cruiseship',6,7]];
function hbShipKit(e){for(const [m,a,b] of HB_SHIPS){if(e<a||e>b||typeof modelOn!=='function'||!modelOn(m))continue;const kn='hb_'+m;
    if(!KITS[kn]){kit(kn,MDL.geo[m],HB_MAT,160,true);BUILD_KITS.push(kn)}return kn}return null}
function hbShipSig(){return typeof modelOn==='function'?HB_SHIPS.map(s=>modelOn(s[0])?1:0).join(''):''}
function bigHarbour(c,cx,cz,e,i0,lvl,d){const fx=DX[d],fz=DY[d],px=-fz,pz=fx,big=lvl>=9,rot=Math.atan2(-fz,fx),wood=0x6b5038,stoneC=e>=6?0xa8a49c:0x9a8e78;
  /* where the water starts, looking out to sea from a point along the shore */
  const shoreAt=l=>{let wasLand=false;for(let t=-.2;t<1.8;t+=.02){const x=cx+fx*t+px*l,z=cz+fz*t+pz*l,g=groundY(x,z);if(g>waterY+.004)wasLand=true;else if(wasLand&&g<waterY-.002)return t;}return null};
  const span=Math.min(1.7,.45+lvl*.09),seg=.16,pts=[];
  for(let l=-span;l<=span+1e-6;l+=seg){const t=shoreAt(l);if(t!=null)pts.push([l,t])}
  if(pts.length<3)return false;
  /* the quay: a stone wall along the waterline, with a paved top */
  for(const [l,t] of pts){const x=cx+fx*(t-.03)+px*l,z=cz+fz*(t-.03)+pz*l;add('stone',x,waterY-.03,z,.08,.06,seg*1.02,rot,stoneC);add('stone',x-fx*.07,waterY+.026,z-fz*.07,.08,.006,seg*1.02,rot,0xb8b0a0)}
  /* jetties out over the water, with boats and ships alongside */
  const nj=Math.min(pts.length-1,big?Math.min(6,2+((lvl-5)/2|0)):2+(lvl>=7?1:0)),ship=e>=2?hbShipKit(e):null;
  for(let k=0;k<nj;k++){const [l,t]=pts[Math.round((k+.5)/nj*(pts.length-1))],len=(big?.42:.32)+hash(i0+k*3)*.12;
    const x0=cx+fx*t+px*l,z0=cz+fz*t+pz*l,mx=x0+fx*len/2,mz=z0+fz*len/2;
    if(groundY(x0+fx*len,z0+fz*len)>waterY-.003)continue;
    add(e>=5?'stone':'box',mx,waterY-.012,mz,len,.03,.05,rot,e>=5?stoneC:wood);
    if(e<5)for(let q=0;q<=3;q++)for(const sd of [-1,1])add('cyl',x0+fx*len*q/3+px*.022*sd,waterY-.1,z0+fz*len*q/3+pz*.022*sd,.007,.13,.007,0,0x4a3828);
    for(const sd of [-1,1]){const h=hash(i0+k*7+sd),bx=mx+px*sd*(.06+(ship?.03:0)),bz=mz+pz*sd*(.06+(ship?.03:0));
      if(ship&&h<.6)add(ship,bx,waterY+.003,bz,big?.62:.48,big?.62:.48,big?.62:.48,rot+(h<.3?Math.PI:0),0xffffff);
      else{add('boat',bx,waterY+.012,bz,.1,.04,.035,rot,h<.5?0x6b4a2e:0x8a5a3a);add('cyl',bx,waterY+.012,bz,.004,.09,.004,0,0x5a4632)}}}
  /* warehouses in a row behind the quay */
  if(e>=2){const nw=big?4:2;for(let k=0;k<nw;k++){const [l,t]=pts[Math.round((k+.5)/nw*(pts.length-1))],x=cx+fx*(t-.2)+px*(l+.04),z=cz+fz*(t-.2)+pz*(l+.04),g=groundY(x,z);if(g<waterY+.008)continue;
    const wl=.15+hash(i0+k)*.05;add(e>=5?'brick':e>=3?'timber':'plaster',x,g-.02,z,.09,.075,wl,rot,0xffffff);add('tiles',x,g+.055,z,.1,.045,wl+.01,rot,e>=5?ROOF_SLATE[1]:0x9a4a32)}}
  /* cranes on the quay */
  const nc=big?3:1;for(let k=0;k<nc;k++){const [l,t]=pts[Math.round((k+1)/(nc+1)*(pts.length-1))],x=cx+fx*(t-.05)+px*l,z=cz+fz*(t-.05)+pz*l;
    if(e>=5){const col=k%2?0xc83a2a:0xe0a828;for(const a of [-1,1])for(const b of [-1,1])add('box',x+fx*.025*a+px*.02*b,waterY+.025,z+fz*.025*a+pz*.02*b,.006,.12,.006,rot,col);
      add('box',x+fx*.03,waterY+.145,z+fz*.03,.2,.012,.05,rot,col);add('box',x+fx*.1,waterY+.08,z+fz*.1,.003,.065,.003,rot,0x2a2a2a);add('box',x+fx*.1,waterY+.072,z+fz*.1,.014,.01,.014,rot,0x3a3a3a)}
    else if(e>=2){/* a treadwheel crane: a timber housing with its big wheel, and the jib leaning out over the water */add('box',x,waterY+.025,z,.035,.05,.035,rot,wood);add('tiles',x,waterY+.075,z,.04,.02,.04,rot,0x6a4a32);
      add('box',x-fx*.03,waterY+.025,z-fz*.03,.008,.05,.05,rot,0x7a5a3a);add('box',x+fx*.06,waterY+.08,z+fz*.06,.12,.008,.008,rot,0x5a4030);add('box',x+fx*.115,waterY+.045,z+fz*.115,.002,.035,.002,rot,0x2a2a2a)}}
  /* the great ports: a breakwater of rough stone out to sea, and a lighthouse at its end */
  if(big&&e>=2){const [l,t]=pts[pts.length-1],bx0=cx+fx*t+px*l,bz0=cz+fz*t+pz*l;let x=bx0,z=bz0,ang=0;const n=10;let ok=0;
    for(let q=0;q<n;q++){ang=q/n*.9;const dx=fx*Math.cos(ang)-px*Math.sin(ang),dz=fz*Math.cos(ang)-pz*Math.sin(ang);x+=dx*.07;z+=dz*.07;if(groundY(x,z)>waterY+.01)continue;
      add('rock',x,waterY-.02,z,.07,.05,.06,hash(q+i0)*3,0x8a8478);ok++}
    if(ok>=6){add('cyl',x,waterY-.02,z,.032,.06,.032,0,0x8a8478);add('cyl',x,waterY+.04,z,.02,.12,.02,0,0xf0ece4);add('cyl',x,waterY+.1,z,.0205,.025,.0205,0,0xc8382a);
      add('cyl',x,waterY+.16,z,.016,.022,.016,0,0xfff2c0);add('cyl',x,waterY+.182,z,.022,.008,.022,0,0x3a3a3a)}}
  return true}
/* grass: a dense field of swaying blades around the camera when zoomed in */
const grassU={uTime:{value:0},uC:{value:new THREE.Vector2()},uR:{value:3},uG:{value:1}};
/* grass: clumps of curved blades, a dense carpet around the camera that thins out at the edge */
const grassGeo=(()=>{const P=[],C=[],r=mulberry32(5),base=[.46,.54,.28],mid=[.62,.73,.37],tip=[.74,.85,.45];
  const v=(p,c)=>{P.push(...p);C.push(...c)};
  for(let k=0;k<11;k++){const a=r()*6.283,d=Math.sqrt(r())*.5,bx=Math.cos(a)*d,bz=Math.sin(a)*d,h=.45+r()*.65,w=.05+r()*.05,fa=r()*6.283,fx=Math.cos(fa),fz=Math.sin(fa),la=r()*6.283,lean=.12+r()*.4,lx=Math.cos(la)*lean,lz=Math.sin(la)*lean;
    const bL=[bx-fx*w,0,bz-fz*w],bR=[bx+fx*w,0,bz+fz*w],m=.55,mL=[bx-fx*w*.6+lx*h*m*m,h*m,bz-fz*w*.6+lz*h*m*m],mR=[bx+fx*w*.6+lx*h*m*m,h*m,bz+fz*w*.6+lz*h*m*m],T=[bx+lx*h,h,bz+lz*h];
    const tone=.8+r()*.4,t=c=>c.map(q=>q*tone);
    v(bL,t(base));v(bR,t(base));v(mR,t(mid));v(bL,t(base));v(mR,t(mid));v(mL,t(mid));v(mL,t(mid));v(mR,t(mid));v(T,t(tip))}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.computeVertexNormals();
  /* normals point mostly up so blades light like a meadow, not like cards */
  const n=g.attributes.normal;for(let i=0;i<n.count;i++){const x=n.getX(i)*.6,y=Math.abs(n.getY(i))*.4+.55,z=n.getZ(i)*.6,l=Math.hypot(x,y,z);n.setXYZ(i,x/l,y/l,z/l)}return g})();
const grassMat=new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:1,envMapIntensity:.55});
grassMat.onBeforeCompile=sh=>{sh.uniforms.uTime=grassU.uTime;sh.uniforms.uC=grassU.uC;sh.uniforms.uR=grassU.uR;sh.uniforms.uG=grassU.uG;sh.vertexShader='uniform float uTime,uR,uG;uniform vec2 uC;\n'+sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
  #ifdef USE_INSTANCING
  vec3 ip=vec3(instanceMatrix[3][0],instanceMatrix[3][1],instanceMatrix[3][2]);
  /* blades grow in and out smoothly at the edge of the carpet and as you zoom, instead of popping */
  transformed*=uG*(1.-smoothstep(uR*.55,uR,distance(ip.xz,uC)));float gust=sin(uTime*.7+ip.x*.6+ip.z*.4)*.5+.5;float sw=(sin(uTime*2.1+ip.x*9.7+ip.z*6.9)+.5*sin(uTime*3.7+ip.x*15.))*(.4+gust);transformed.x+=sw*.1*position.y*position.y;transformed.z+=sw*.05*position.y*position.y;
  #endif`)};
kit('grass',grassGeo,grassMat,44000,false);
kit('wflower',(()=>{const g=new THREE.SphereGeometry(.5,6,4);g.scale(1,.55,1);return g})(),stdMat({roughness:.7}),4000,false);
kit('pebble',(()=>{const g=new THREE.DodecahedronGeometry(.5,0);g.scale(1,.55,1);return g})(),stdMat({roughness:1}),2500,false);
/* ground the grass must not grow on: house floors, roads, garden beds */
/* where grass must not grow: one bit per small cell of the map, instead of millions of entries in a list */
class BitGrid{constructor(){this.w=0;this.h=0;this.ox=0;this.oz=0;this.a=new Uint32Array(0)}
  fit(){const ox=Math.ceil(W/2/BC)+4,oz=Math.ceil(H/2/BC)+4;if(ox!==this.ox||oz!==this.oz){this.ox=ox;this.oz=oz;this.w=ox*2;this.h=oz*2;this.a=new Uint32Array(Math.ceil(this.w*this.h/32))}}
  idx(k){const X=Math.round(k/100003),x=X+this.ox,z=k-X*100003+this.oz;return x<0||z<0||x>=this.w||z>=this.h?-1:x*this.h+z}
  add(k){if(!this.w)this.fit();const i=this.idx(k);if(i>=0)this.a[i>>5]|=1<<(i&31);return this}
  has(k){if(!this.w)return false;const i=this.idx(k);return i>=0&&(this.a[i>>5]&(1<<(i&31)))!==0}
  setIdx(i){if(i>=0)this.a[i>>5]|=1<<(i&31)}
  idxs(keys){if(!this.w)this.fit();const o=new Int32Array(keys.length);for(let j=0;j<keys.length;j++)o[j]=this.idx(keys[j]);return o}
  clear(){this.fit();this.a.fill(0)}}
const BC=.035,bare=new BitGrid(),roadBare=new BitGrid();const bk=(x,z)=>Math.floor(x/BC)*100003+Math.floor(z/BC);
function bareMark(x,z,r){const n=Math.ceil(r/BC);const cx=Math.floor(x/BC),cz=Math.floor(z/BC);for(let a=-n;a<=n;a++)for(let b=-n;b<=n;b++){if((a*a+b*b)*BC*BC>r*r+BC*BC)continue;bare.add((cx+a)*100003+cz+b)}}
function bareRect(x,z,rot,w,d){const c=Math.cos(rot),s=Math.sin(rot);for(let a=-w/2;a<=w/2+1e-6;a+=BC*.8)for(let b=-d/2;b<=d/2+1e-6;b+=BC*.8)bare.add(bk(x+a*c+b*s,z-a*s+b*c))}
const gNoise=makeNoise(9911);
const FLOWERS=[0xf4f0e6,0xf2d23c,0xf0e060,0xc84a3a,0x9a6ad0,0xf6f6ff,0xe8a0c0];
let grassAt={x:1e9,z:1e9,d:0};
function updateGrass(now){grassU.uTime.value=now/1000;
  const kn=['grass','wflower','pebble'];
  {const R0=Math.min(4.6,camDist*.85+.7);grassU.uC.value.set(camT.x-Math.sin(camYaw)*R0*.25,camT.z-Math.cos(camYaw)*R0*.25);grassU.uR.value=Math.max(.8,R0-.45);grassU.uG.value=1-smooth(8.5,11,camDist)}
  if(camDist>11||settings.quality==='low'){if(KITS.grass.mesh.count){kitReset(kn);kitCommit(kn)}grassAt.x=1e9;return}
  if(Math.hypot(camT.x-grassAt.x,camT.z-grassAt.z)<.35&&Math.abs(camDist-grassAt.d)<grassAt.d*.2)return;
  grassAt={x:camT.x,z:camT.z,d:camDist};kitReset(kn);
  const R=Math.min(4.6,camDist*.85+.7),max=settings.quality==='high'?43000:22000,sp=Math.sqrt(Math.PI*R*R/max);
  /* centre the carpet a little ahead of the target, toward where the camera looks */
  const ox=camT.x-Math.sin(camYaw)*R*.25,oz=camT.z-Math.cos(camYaw)*R*.25;
  for(let gx=-R;gx<=R;gx+=sp)for(let gz=-R;gz<=R;gz+=sp){const dd=gx*gx+gz*gz;if(dd>R*R)continue;
    const ax=Math.round((ox+gx)/sp),az=Math.round((oz+gz)/sp),hs=hash(ax*73.1+az*19.7),x=ax*sp+(hs-.5)*sp*.9,z=az*sp+(hash(ax*11.3+az*91.1)-.5)*sp*.9;
    const i=tileAt(x,z);if(i<0)continue;const b=biome[i];if(!(b===4||b===8||b===5||b===9||b===6||b===3))continue;
    /* without grass blades only the odd flower or pebble is drawn: skip the costly checks for the spots that get neither */
    if(!settings.grassBlades){const fq=hash(ax*3.7+az*5.3);if(fq>=.048&&fq<=.993)continue}
    if(fieldTiles.has(i)||(scorched&&scorched[i]>0)||bare.has(bk(x,z))||roadBare.has(bk(x,z)))continue;
    if(b===3&&hs<.9)continue;if((b===5||b===6)&&hs<.35)continue;if(occupied.has(i)&&hs<.25)continue;
    const y=groundY(x,z);if(y<waterY+.03)continue;
    const nz=gNoise(x*.35,z*.35,2),pat=gNoise(x*2.2+40,z*2.2,2),fade=1,ff=1-smooth(R*.45,R*.8,Math.sqrt(dd));
    const tall=(b===8?1.35:b===9?.7:1)*(.65+pat*.8)*(occupied.has(i)?.6:1),s=(.7+hs*.6)*fade;
    const dry=smooth(.45,.75,nz),col=b===8?0xe0c880:b===9?0xb0b098:b===3?0xc8c088:dry>.5?(hs<.5?0xd8cc88:0xcac080):(hs<.33?0xb4d098:hs<.66?0xc4dca8:0xa4c48c);
    /* the photo ground now carries the grass; blades only as the odd taller tuft, so the meadow is calm instead of speckled */
    if(settings.grassBlades)add('grass',x,y-.002,z,.034*s,.02*tall*s,.034*s,hs*6.283,col);
    const fh=hash(ax*3.7+az*5.3);
    if(fh<.03*(b===4?1.6:.6)*(1-dry*.5)&&b!==9){const fc=FLOWERS[(hash(ax*9.1+az*2.3)*FLOWERS.length)|0];if(ff>.05)add('wflower',x+.004,y+.02*tall*s,z,.007*ff,.007*ff,.007*ff,0,fc);
      if(fh<.012&&ff>.05)add('wflower',x-.006,y+.016*tall*s,z+.005,.006*ff,.006*ff,.006*ff,0,fc)}
    else if(fh>.993)add('pebble',x,y-.002,z,.012+hs*.012,.01,.012+hs*.01,hs*6,hs<.5?0x8a847a:0x9e978a)}
  kitCommit(kn)}

/* herds wander slowly; birds circle */
let flocks=[];
function updateLife(dt,now){
  TX.river.offset.y=-now/1000*.35;INWU.uTime.value=now/1000;updateGrass(now);
  if(typeof MODEL_KITS==='function'&&updateLife.v!==MDL_VER){updateLife.v=MDL_VER;updateLife.ak=MODEL_KITS().filter(n=>/^m_(cow|horse|sheep|pig)_/.test(n))}kitReset(['animal','bird','aBody','aHead','aLeg',...(updateLife.ak||[])]);
  /* sheep and cattle: a round body, a head that dips to graze, four legs that step as they wander, and a tail */
  const T=now/1000,R2a=(camDist*1.4+2)**2;
  for(const h of herds){if((h.x-camT.x)**2+(h.z-camT.z)**2>R2a)continue;for(let k=0;k<h.n;k++){const s=h.seed*13+k,a1=hash(s+1),a3=hash(s+3),t=T*.06+hash(s)*20,
      x=h.x+Math.cos(t+k)*.08*a1+(hash(s+2)-.5)*.14,z=h.z+Math.sin(t*.8+k)*.08*a3+(hash(s+4)-.5)*.14,y=groundY(x,z);
    const vx=-Math.sin(t+k)*.08*a1,vz=Math.cos(t*.8+k)*.8*.08*a3,rot=Math.atan2(vx,vz),c=Math.cos(rot),sn=Math.sin(rot),Lp=(lx,lz)=>[x+lx*c+lz*sn,z-lx*sn+lz*c];
    const sheep=h.kind==='sheep',col=sheep?0xf2efe6:hash(s+5)<.5?0x6b4a32:hash(s+6)<.5?0x2a2622:0xd8cfc0,dark=sheep?0x2a2622:col,
      L=sheep?.016:.022,bw=sheep?.03:.032,bh=sheep?.026:.03,bl=sheep?.044:.06,graze=Math.sin(T*.35+hash(s+7)*9)>.25,sw=Math.sin(T*6+k*1.7)*.38;
    if(typeof drawHerdModel==='function'&&drawHerdModel(h,k,x,y,z,rot,T,graze,h.kind==='cow'||h.kind==='horse'))continue;
    addR('aBody',x,y+L+bh*.42,z,bw,bh,bl,rot,0,0,col);
    for(const [lx,lz,ph] of [[-.4,.32,1],[.4,.32,-1],[-.4,-.32,-1],[.4,-.32,1]]){const [px,pz]=Lp(lx*bw,lz*bl);addR('aLeg',px,y+L+.004,pz,sheep?.006:.008,L+.004,sheep?.006:.008,rot,sw*ph,0,dark)}
    const hd=graze?[.0,bl*.55,-.004]:[0,bl*.52,bh*.45],[hx,hz]=Lp(hd[0],hd[1]);addR('aHead',hx,y+L+bh*.5+hd[2],hz,sheep?.014:.018,sheep?.014:.017,sheep?.02:.026,rot,graze?.5:-.1,0,dark);
    if(!sheep){for(const sd of [-1,1]){const [ex,ez]=Lp(sd*.008,bl*.6+(graze?0:.004));addR('aLeg',ex,y+L+bh*.5+hd[2]+.01,ez,.002,.008,.002,rot,0,sd*1.1,0xe8e0d0)}
      const [tx,tz]=Lp(0,-bl*.5);addR('aLeg',tx,y+L+bh*.7,tz,.002,.022,.002,rot,.25+Math.sin(T*2+k)*.15,0,dark)}}}
  if(!flocks.length&&W){for(let f=0;f<6;f++)flocks.push({x:(rng()-.5)*W*.7,z:(rng()-.5)*H*.7,r:1+rng()*2,sp:.15+rng()*.15,ph:rng()*6})}
  for(const f of flocks){const a=now/1000*f.sp+f.ph,fx=f.x+Math.cos(a)*f.r,fz=f.z+Math.sin(a)*f.r,dir=a+Math.PI/2,y=Math.max(groundY(fx,fz),waterY)+1.1;
    for(let k=0;k<7;k++){const row=Math.ceil(k/2),side=k%2?1:-1,bx=fx-Math.cos(dir)*.0+(-Math.sin(-dir))*0,ox=-row*.07,oz=side*row*.06,c=Math.cos(dir),s=Math.sin(dir);
      const px=fx+ox*c-oz*s,pz=fz+ox*s+oz*c,flap=.6+Math.abs(Math.sin(now/120+k))*.8;add('bird',px,y+Math.sin(now/700+k)*.03,pz,.035,.035*flap,.035,-dir+Math.PI/2)}}
  kitCommit(['animal','bird','aBody','aHead','aLeg']);if(updateLife.ak&&updateLife.ak.length)mcommit(updateLife.ak)}
const occupied=new Set();
/* fewer towns, so each can grow larger: the size scale goes to 18 */
const TOWN_MAX=18;
function cityLevel(n){return clamp(Math.sqrt(n.pop/Math.max(1,n.cities.length))/2.3,1,TOWN_MAX)}
/* one great city per country: the capital draws people in and grows well beyond the rest, which stay market towns and villages */
function townLevel(n,cap){const l=cityLevel(n);return cap?Math.min(TOWN_MAX,l*1.35+1.5):Math.max(1,l*.8)}
/* ---------- town plans: every town grows its own street network from a centre ---------- */
function chaikin2(p,it){for(let k=0;k<it;k++){const o=[p[0]];for(let i=0;i<p.length-1;i++){const a=p[i],b=p[i+1];o.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75])}o.push(p[p.length-1]);p=o}return p}
/* how far a city sprawls: from the Industrial age big cities grow into metropolises that cover many miles */
function metroRadius(n,c,cap,e){if(e<5||!n)return 0;const m=clamp(Math.sqrt(n.pop/Math.max(1,n.cities.length))*(cap?1.5:1)/40,0,1);
  const ws=clamp(W/112,.6,1.4);return (e===5?lerp(.4,cap?1.8:1.1,m):lerp(.6,cap?3.4:2,m))*ws}
function isLagoon(n,c,e){if(e<2||e>5||!n)return false;if(c._lagT===terrVer)return c._lag;let w=0;
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const X=c.x+dx,Y=c.y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const j=Y*W+X;if(isWater(j)&&waterY-groundY(wx(X),wz(Y))<.95)w++}
  const lucky=hash(c.x*7.3+c.y*13.1)<(cultOf(n)==='med'?.85:.22);c._lagT=terrVer;return c._lag=w>=2&&w<=17&&lucky}
function townPlan(n,c,cap,e){
  const MR=metroRadius(n,c,cap,e),mb=MR>.75?Math.round(MR*4)/4:0;
  const band=e===0?0:e<5?1:e<6?2:3,tl=townLevel(n,cap),gf=clamp(.8+tl*.055,.9,1.9),dens=clamp((tl-6)/6,0,1),key=band+'|'+flatSig.length+'|'+(cap?1:0)+'|'+mb+'|'+(isLagoon(n,c,e)?1:0)+'|'+Math.round(gf*5)+'|'+Math.round(dens*4);if(c._plan&&c._plan.key===key)return c._plan;
  const R_=mulberry32((c.x*73856093^c.y*19349663^(cap?777:0))>>>0),cx=wx(c.x),cz=wz(c.y),pr=e===0?.06:cap&&e>=3&&e<=4&&!isLagoon(n,c,e)?.66:cap?.24:.1;
  /* never build up a mountain: not much higher than the town square, and not on a steep slope */
  /* a lagoon town, like Venice: houses rise straight out of the shallow water and the streets become canals */
  const lag=isLagoon(n,c,e),LR=cap?1.25:.8;
  const cy0=groundY(cx,cz),bad=(x,z)=>{const t=tileAt(x,z);if(t<0||biome[t]>=11)return true;const y=groundY(x,z);
    if(lag&&(isWater(t)||y<waterY+.035)){return !(waterY-y<.95&&Math.hypot(x-cx,z-cz)<LR)}
    if(isWater(t))return true;if(y<waterY+.035||y>cy0+.2)return true;
    /* future cities leave their forests standing as green belts */
    if(e>=6&&(biome[t]===5||biome[t]===6)&&Math.hypot(x-cx,z-cz)>Math.max(.5,MR*.45))return true;
    return Math.abs(groundY(x+.05,z)-groundY(x-.05,z))+Math.abs(groundY(x,z+.05)-groundY(x,z-.05))>.075};
  /* a house must keep clear of the river and the brooks as they are drawn, by its own size and a little more */
  const badH=(x,z,r)=>bad(x,z)||riverNear(x,z,(r||.05)+.015);
  const streets=[],slots=[],grid=new Map(),gk=(x,z)=>Math.floor(x/.09)+'_'+Math.floor(z/.09);
  const free=(x,z,r)=>{const gx=Math.floor(x/.09),gz=Math.floor(z/.09);for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++){const L=grid.get((gx+a)+'_'+(gz+b));if(L)for(const o of L)if(Math.hypot(o[0]-x,o[1]-z)<r+o[2])return false}return true};
  const mark=(x,z,r)=>{const k=gk(x,z);if(!grid.has(k))grid.set(k,[]);grid.get(k).push([x,z,r])};
  if(band===0){/* a loose camp: huts gather in little clusters around the fire */
    const huts=[[cx+.09,cz]];for(let k=0;k<70;k++){const b=huts[(R_()*huts.length)|0],a=R_()*6.283,d=.085+R_()*.05,x=b[0]+Math.cos(a)*d,z=b[1]+Math.sin(a)*d;
      if(Math.hypot(x-cx,z-cz)<.07||badH(x,z,.04)||!free(x,z,.04))continue;mark(x,z,.04);huts.push([x,z]);{const hr=R_()*6.283;slots.push({x,z,rot:hr,w:.1,d:.1,core:0,st:-1,at:0,fx:x+Math.sin(hr)*.075,fz:z+Math.cos(hr)*.075,dd:Math.hypot(x-cx,z-cz)+R_()*.15})}}
    slots.sort((a,b)=>a.dd-b.dd);return c._plan={key,streets,slots,pr}}
  if(mb)return c._plan=organicMetro(c,cap,e,mb,key,R_,cx,cz,pr,bad,free,mark);
  const straight=band>=2?.65:1,len=gf*(cap?2.1:1.4)*(e>=3&&e<=4?(cap?1.15:.85):1)*(band>=2?1.25:1)*(band===3?1.4:1)*Math.sqrt(clamp(W/112,.6,1.4));
  const walk=(x,z,h,L,main)=>{const pts=[[x,z,0]],step=.06;let d=0;
    const gy=(x,z)=>lag?Math.max(groundY(x,z),waterY):groundY(x,z);/* in a lagoon the canals are as flat as streets */
    for(let s=0;s<L/step;s++){let best=null,bc=1e9;const y0=gy(x,z);
      for(const dh of [-.32,-.16,0,.16,.32]){const hh=h+dh*straight+(R_()-.5)*.12*straight,X=x+Math.cos(hh)*step,Z=z+Math.sin(hh)*step;if(bad(X,Z))continue;
        const cost=Math.abs(gy(X,Z)-y0)*14+Math.abs(dh)*(main?1.2:.6)+R_()*.08;if(cost<bc){bc=cost;best=[X,Z,hh]}}
      if(!best||bc>1.6)break;x=best[0];z=best[1];h=best[2];d+=step;pts.push([x,z,d])}
    return pts};
  /* main streets leave the square in a few directions; one arm is a street village, five is a star town */
  const nm=e>=3&&e<=4?[3,3,4,4,5,5,6][(R_()*7)|0]:[1,2,2,3,3,3,4,4,5][(R_()*9)|0],a0=R_()*6.283,arms=nm===1?[a0,a0+Math.PI+(R_()-.5)*.6]:Array.from({length:nm},(_,k)=>a0+k*6.283/nm+(R_()-.5)*.7);
  for(const a of arms){const pts=walk(cx+Math.cos(a)*pr,cz+Math.sin(a)*pr,a,len*(.6+R_()*.6),true);if(pts.length>3)streets.push({pts,main:true,base:pr})}
  const mains=streets.length;
  for(let m=0;m<mains;m++){const st=streets[m];let side=R_()<.5?1:-1;
    for(let i=4;i<st.pts.length-2;i+=(dens>.5?2:3)+((R_()*(4-2*dens))|0)){if(R_()>(e>=3&&e<=4?.95:.6+dens*.3))continue;const p0=st.pts[i],p1=st.pts[i+1],h=Math.atan2(p1[1]-p0[1],p1[0]-p0[0])+side*(Math.PI/2+(R_()-.5)*.6);side=-side;
      const pts=walk(p0[0],p0[1],h,(.25+R_()*.6*(cap?1.3:1))*(1+dens*.5),false);if(pts.length>3)streets.push({pts,main:false,base:p0[2]+st.base})}}
  /* plaza frontage first, then plots along every street, both sides */
  const hs=band===1?[.1,.075]:band===2?[.12,.08]:[.11,.1];
  const ring=pr>.5?0:Math.max(5,Math.round(pr*6.283/(hs[0]+.02)));for(let k=0;k<ring;k++){const a=k/ring*6.283+.2,r=pr+hs[1]/2+.03,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;
    if(badH(x,z,Math.max(hs[0],.1)*.66)||!free(x,z,Math.max(hs[0],.1)*.66))continue;mark(x,z,Math.max(hs[0],.1)*.66);slots.push({x,z,rot:Math.atan2(-Math.cos(a),-Math.sin(a)),w:hs[0],d:hs[1],core:1,st:-1,at:0,fx:cx+Math.cos(a)*pr*.8,fz:cz+Math.sin(a)*pr*.8,dd:pr*.5})}
  for(const st of streets)for(const q of st.pts)mark(q[0],q[1],st.main?.035:.025);
  streets.forEach((st,si)=>{const sw=st.main?.035:.025;
    const fine=band>=1&&dens>.25;const PT=fine?(()=>{const o=[];st.pts.forEach((q,i)=>{if(!i){o.push(q);return}const a=st.pts[i-1];for(let k=1;k<=6;k++){const t=k/6;o.push([a[0]+(q[0]-a[0])*t,a[1]+(q[1]-a[1])*t,a[2]+(q[2]-a[2])*t])}});return o})():st.pts;
    for(let i=1;i<PT.length;i++){const p0=PT[i-1],p1=PT[i],h=Math.atan2(p1[1]-p0[1],p1[0]-p0[0]);
      for(const side of [1,-1]){const dd=st.base+p1[2],core=clamp(1-dd/((cap?1.1:.6)*(1+dens*.8)),0,1),rural=band===1&&core<(e>=3&&e<=4?.28:.6)*(1-dens*.8);
        if(R_()<(rural?.3*(1-dens*.6):band>=2?.28*(1-dens*.85):e>=3?.05*(1-dens):.12*(1-dens*.8)))continue;
        /* villages: detached cottages on long plots with gaps of meadow; town cores: houses shoulder to shoulder */
        /* the heart of a big town: terraced rows, each house wall to wall with the next and its front on the lane, no gaps and no gardens */
        const terr=band>=1&&dens>.25&&core>.3-dens*.22&&!rural;
        let w=hs[0]*(.85+R_()*.35),d=hs[1]*(.85+R_()*.3),off=sw+d/2+(rural?.02+R_()*.04:.008+R_()*.012);
        if(terr){w=hs[0]*(.92+(w/hs[0]-.85)*.3);d=hs[1]*(1.05+(d/hs[1]-.85)*.4);off=sw+w*.5+.004}
        const nx=-Math.sin(h)*side,nz=Math.cos(h)*side,x=p1[0]+nx*off,z=p1[1]+nz*off;
        const rr=terr?w*.5+.001:rural?Math.max(w,d,.1)*.7:Math.max(w,d,.1)*.66+.003;if(badH(x,z,rr)||!free(x,z,rr))continue;
        let pd=terr?0:band===1?(rural?.11+R_()*.15:LK.pixel?.05+R_()*.04:.05+R_()*.04):0;const pw=w*(1.05+R_()*.45),bx=x+nx*(d/2+pd/2),bz=z+nz*(d/2+pd/2);
        if(pd>0&&(bad(bx,bz)||!free(bx,bz,pd*.42)))pd=0;
        mark(x,z,rr);if(pd>0){mark(bx,bz,pd*.45);mark(x+nx*(d/2+pd*.9),z+nz*(d/2+pd*.9),pw*.4)}
        slots.push({x,z,rot:Math.atan2(-nx,-nz),w,d,pd,pw,core,st:si,at:p1[2],fx:p1[0],fz:p1[1],dd:dd+R_()*(terr?.02:.25)-(terr?.3:0),terr})}}});
  slots.sort((a,b)=>a.dd-b.dd);
  {const td=slots.filter(q=>q.terr).map(q=>Math.hypot(q.x-cx,q.z-cz)).sort((a,b)=>a-b),cr=td.length?td[td.length-1]:0,w8=td.length>12?td[Math.floor(td.length*.8)]:0;return c._plan={key,streets,slots,pr,coreR:cr*.85,wallR:w8}}}
/* a grown city: avenues leave the old square like spokes, ring roads curve round them at the old wall lines,
   and crooked lanes fill the gaps. Towers stand in the middle, flats around them, houses with gardens far out. */
function organicMetro(c,cap,e,MR,key,R_,cx,cz,pr,bad,free,mark){const streets=[],slots=[],ph=R_()*6.283;
  const walk=(x,z,h,L,bend)=>{const pts=[[x,z,0]],step=.06;let d=0;
    for(let s=0;s<L/step;s++){let best=null,bc=1e9;const y0=groundY(x,z);
      for(const dh of [-.26,-.13,0,.13,.26]){const hh=h+dh*bend+(R_()-.5)*.1*bend,X=x+Math.cos(hh)*step,Z=z+Math.sin(hh)*step;if(bad(X,Z))continue;
        const cost=Math.abs(groundY(X,Z)-y0)*14+Math.abs(dh)*.7+R_()*.1;if(cost<bc){bc=cost;best=[X,Z,hh]}}
      if(!best||bc>1.6)break;x=best[0];z=best[1];h=best[2];d+=step;pts.push([x,z,d])}return pts};
  /* avenues */
  const nA=5+((R_()*3)|0);for(let k=0;k<nA;k++){const a=ph+k*6.283/nA+(R_()-.5)*.5,pts=walk(cx+Math.cos(a)*pr,cz+Math.sin(a)*pr,a,MR*(.95+R_()*.25),.55);if(pts.length>3)streets.push({pts,main:true,base:pr})}
  /* ring roads where the old walls once stood */
  for(const f of [.3,.58,.86]){const r=MR*f;if(r<pr+.14)continue;let pts=null,d=0;const flush=()=>{if(pts&&pts.length>3)streets.push({pts,main:f<.5,base:r});pts=null};
    const st=.06/r,wob=R_()*6.283;for(let t=0;t<=6.2832+st;t+=st){const rr=r*(1+.08*Math.sin(3*t+wob)+.05*Math.sin(7*t+wob*2)),x=cx+Math.cos(t)*rr,z=cz+Math.sin(t)*rr;
      if(bad(x,z)){flush();continue}if(!pts){pts=[];d=0}else d+=.06;pts.push([x,z,d])}flush()}
  /* lanes branch off at a near right angle and run until they meet another street, so the net is joined up, not a tangle of dead ends */
  const SG=new Map(),sk=(x,z)=>Math.floor(x/.08)+','+Math.floor(z/.08),addS=(st,si)=>{for(const q of st.pts){const k=sk(q[0],q[1]);if(!SG.has(k))SG.set(k,[]);SG.get(k).push([q[0],q[1],si])}};
  streets.forEach(addS);
  const near=(x,z,not)=>{const gx=Math.floor(x/.08),gz=Math.floor(z/.08);let best=null,bd=.05;for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const L=SG.get((gx+a)+','+(gz+b));if(L)for(const q of L){if(q[2]===not)continue;const d=Math.hypot(q[0]-x,q[1]-z);if(d<bd){bd=d;best=q}}}return best};
  const laneBad=(x,z)=>{if(bad(x,z))return true;const t=tileAt(x,z);return t>=0&&river[t]>0};
  const lane=(x,z,h,L,parent)=>{const pts=[[x,z,0]],step=.06;let d=0,hit=false;
    for(let s=0;s<L/step;s++){const X=x+Math.cos(h)*step,Z=z+Math.sin(h)*step;if(laneBad(X,Z))break;
      if(Math.abs(groundY(X,Z)-groundY(x,z))>.03)break;x=X;z=Z;h+=(R_()-.5)*.12;d+=step;pts.push([x,z,d]);
      if(s>=2){const q=near(x,z,parent);if(q){d+=Math.hypot(q[0]-x,q[1]-z);pts.push([q[0],q[1],d]);hit=true;break}}}
    return {pts,hit}};
  const gen=streets.map((s,i)=>i);for(let g=0;g<2;g++){const next=[];
    for(const si of gen){const st=streets[si];const rowE=e===5||e===6;for(let i=3;i<st.pts.length-2;i+=(rowE?3:4)+((R_()*(rowE?3:4))|0)){if(R_()>(g?(rowE?.65:.45):(rowE?.92:.8)))continue;const p0=st.pts[i],p1=st.pts[i+1],side=R_()<.5?1:-1,h=Math.atan2(p1[1]-p0[1],p1[0]-p0[0])+side*(Math.PI/2+(R_()-.5)*.25);
      if(Math.hypot(p0[0]-cx,p0[1]-cz)>MR*1.02)continue;const r=lane(p0[0],p0[1],h,.25+R_()*(g?.4:.6),si);
      if(r.pts.length<4||(!r.hit&&R_()<.65))continue;/* a few quiet cul-de-sacs are fine, not a maze of them */
      const s={pts:r.pts,main:false,base:0},k=streets.length;streets.push(s);addS(s,k);next.push(k)}}
    gen.length=0;gen.push(...next)}
  for(const st of streets)for(const q of st.pts)mark(q[0],q[1],st.main?.04:.03);
  /* plots along every street */
  /* industrial cities: whole quarters of brick terraces; modern cities: joined townhouses and flats in the middle ring. The towers and the villa suburbs stay as they are */
  streets.forEach((st,si)=>{const sw=st.main?.04:.03,fineP=e===5||e===6,PT=fineP?(()=>{const o=[];st.pts.forEach((q,i)=>{if(!i){o.push(q);return}const a=st.pts[i-1];for(let k=1;k<=6;k++){const t=k/6;o.push([a[0]+(q[0]-a[0])*t,a[1]+(q[1]-a[1])*t,a[2]+(q[2]-a[2])*t])}});return o})():st.pts;
    for(let i=1;i<PT.length;i++){const p0=PT[i-1],p1=PT[i],h=Math.atan2(p1[1]-p0[1],p1[0]-p0[0]),dist=Math.hypot(p1[0]-cx,p1[1]-cz);if(dist<pr+.05)continue;
      const core=clamp(1-dist/MR,0,1),kind=core>.84?2:core>.55?1:0,row=(e===5&&kind<2)||(e===6&&kind===1);
      for(const side of [1,-1]){if(R_()<(row?.05:kind===2?.25:kind===1?.18:.32))continue;
        let w=kind===2?.15:kind===1?.12+R_()*.03:.07+R_()*.015,d=kind===2?.13:kind===1?.1:.062;if(row){w=e===5?.085+R_()*.012:.1+R_()*.02;d=e===5?.075:.09}
        const rr=row?w*.5+.001:Math.hypot(w,d)*.5+.004,off=row?sw+rr+.004:sw+rr+(kind===0?.012+R_()*.02:.006),nx=-Math.sin(h)*side,nz=Math.cos(h)*side,x=p1[0]+nx*off,z=p1[1]+nz*off;
        if(bad(x,z)||riverNear(x,z,rr+.015)||!free(x,z,rr))continue;mark(x,z,rr);
        slots.push({x,z,rot:Math.atan2(-nx,-nz),w,d,pd:0,pw:0,core,st:si,at:p1[2],fx:p1[0],fz:p1[1],dd:dist+R_()*(row?.03:.15),metro:1,terr:row})}}});
  slots.sort((a,b)=>a.dd-b.dd);return {key,streets,slots,pr,metro:MR}}
/* a metropolis: a street grid of blocks out to a ragged edge; towers crowd the middle, flats and villas spread outward */
function metroPlan(c,cap,e,MR,key,R_,cx,cz,pr,bad,free,mark){const streets=[],slots=[],ang=R_()*Math.PI/2,ca=Math.cos(ang),sa=Math.sin(ang),B=e>=6?.38:.34,ph=R_()*6.28;
  const toW=(u,v)=>[cx+u*ca-v*sa,cz+u*sa+v*ca],edge=(u,v)=>{const t=Math.atan2(v,u);return MR*(.82+.14*Math.sin(3*t+ph)+.08*Math.sin(5*t+ph*2))},inR=(u,v)=>Math.hypot(u,v)<=edge(u,v);
  const NB=Math.ceil(MR/B)+1;
  for(const axis of [0,1])for(let i=-NB;i<=NB;i++){let pts=null,d=0;const flush=()=>{if(pts&&pts.length>2)streets.push({pts,main:i%3===0,base:0});pts=null};
    for(let s=-MR*1.2;s<=MR*1.2;s+=.06){const u=axis?s:i*B,v=axis?i*B:s;const [x,z]=toW(u,v);
      if(!inR(u,v)||bad(x,z)){flush();continue}if(!pts){pts=[];d=0}else d+=.06;pts.push([x,z,d])}flush()}
  for(const st of streets)for(const q of st.pts)mark(q[0],q[1],st.main?.035:.025);
  for(let i=-NB;i<NB;i++)for(let j=-NB;j<NB;j++){const u0=(i+.5)*B,v0=(j+.5)*B,dist=Math.hypot(u0,v0);if(!inR(u0,v0)||dist<pr+.06)continue;
    const core=clamp(1-dist/MR,0,1),inner=B-.09,big=core>.84,mid=core>.6;
    /* parks and squares: a green block among the towers, more among the flats, a few in the suburbs */
    if(R_()<(big?.2:mid?.24:.12))continue;
    const hs=Math.min(inner*.24,.062),mw=Math.min(inner*.42,.12),spots=big?[[0,0,Math.min(inner*.72,.2)]]:mid?[[-.25,-.25,mw],[.25,-.25,mw],[-.25,.25,mw],[.25,.25,mw]].filter(()=>R_()>.2):
      [[-.34,-.34,hs],[.34,-.34,hs],[-.34,.34,hs],[.34,.34,hs],[0,-.36,hs],[0,.36,hs]].filter(()=>R_()>.15);
    if(big&&R_()<.45)spots.splice(0,1,[-.22,0,inner*.5],[.22,0,inner*.5]);
    for(const [du,dv,w] of spots){const u=u0+du*inner,v=v0+dv*inner,[x,z]=toW(u,v);if(bad(x,z)||riverNear(x,z,w*.45+.015)||!free(x,z,w*.45))continue;mark(x,z,w*.45);
      const fu=Math.abs(du)>=Math.abs(dv)?Math.sign(du||1):0,fv=fu?0:Math.sign(dv||1),rot=Math.atan2(fu*ca-fv*sa,fu*sa+fv*ca);
      slots.push({x,z,rot,w,d:w,pd:0,pw:0,core,st:-1,at:0,fx:x,fz:z,dd:dist+R_()*.1,metro:1})}}
  slots.sort((a,b)=>a.dd-b.dd);return {key,streets,slots,pr,metro:MR}}
/* towns are cached: a town whose look has not changed is replayed from its recorded instances instead of rebuilt */
const CITYCACHE=new WeakMap();let setsPatched=false;
function patchSets(){if(setsPatched)return;setsPatched=true;for(const [S_,key] of [[occupied,'occ'],[bare,'bare'],[bgrid,'bg']]){const o=S_.add.bind(S_);S_.add=v=>{if(REC)REC[key].push(v);return o(v)}}}
const townGrowth=c=>c.born==null?1:clamp((year-c.born)/200,.15,1);
function cityKey(n,c,ci,e,lvl,gold,cap){const MR=metroRadius(n,c,cap,e),rad=Math.ceil(Math.max(MR,.6))+1;let oh=0;
  for(let dy=-rad;dy<=rad;dy++)for(let dx=-rad;dx<=rad;dx++){const X=c.x+dx,Y=c.y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const j=Y*W+X;if(owner[j]===n.id)oh++}oh=Math.round(oh/4)
  const far=Math.hypot(wx(c.x)-camT.x,wz(c.y)-camT.z)>camDist*1.3+2.5;
  return [n.id,e,lvl,cap?1:0,gold?1:0,n.festival>0?1:0,c.statue?c.statue.faith:-1,c.siege>.08?1:0,c.riot&&year-c.riot<6?1:0,n.faith,n.wonder,flagKey(n.flag),cultOf(n),settings.arch,terrBase+':'+sea.toFixed(3)+':'+(c._flat||'')+':'+(c._gv||0),oh,far?1:0,Math.round(MR*4),
    n.techs&&n.techs.includes('aviation')?1:0,devTier(n),c.dike?1:0,cap?4:Math.round(townGrowth(c)*5),hbShipSig(),n.techs&&n.techs.includes('starships')?1:0,ci,settings.models!==false?1:0].join('|')}
/* a town's copies are kept as plain blocks (matrices, colours, culling spheres) so replaying it is a straight copy */
function stageSpheres(K,s,at,n){if(!K.csS||K.csS.length<(at+n)*4){const o=K.csS,c=new Float32Array(Math.min(K.max,Math.max(at+n,o?o.length/2:0,256))*4);if(o)c.set(o.subarray(0,Math.min(o.length,c.length)));K.csS=c}K.csS.set(n*4<s.length?s.subarray(0,n*4):s,at*4)}
function replayCity(Rc){if(Rc.ft){const fr=FOOTREC;FOOTREC=null;for(const o of Rc.ft)footAdd(o);FOOTREC=fr}for(const name in Rc.m){const K=KITS[name],m=Rc.m[name],cnt=Math.min(m.length/16,K.max-K.k);if(cnt<=0)continue;kitGrow(K,K.k+cnt);
    K.mesh.instanceMatrix.array.set(cnt*16<m.length?m.subarray(0,cnt*16):m,K.k*16);const c=Rc.c[name];K.mesh.instanceColor.array.set(cnt*3<c.length?c.subarray(0,cnt*3):c,K.k*3);stageSpheres(K,Rc.s[name],K.k,cnt);K.k+=cnt}
  for(const v of Rc.occ)occupied.add(v);for(const v of Rc.bareI)bare.setIdx(v);for(const v of Rc.bg)bgrid.add(v);
  emitters.push(...Rc.em);herds.push(...Rc.hd);cityStreets.push(...Rc.cs);airports.push(...Rc.ap);spaceports.push(...Rc.sp);
  for(const g of Rc.wm){scene.add(g);windmills.push(g)}for(const m of Rc.tf){scene.add(m);townFlags.push(m)}}
let RB0=0;
let sootSig='';
/* trees and shrubs that belong to towns (orchards, garden hedges, fruit trees). They go in with the world's trees, which are drawn after the towns,
   so the towns hand them over here instead of drawing them themselves */
let TOWN_GREEN=[],TGSIG='',CUR_GREEN=null;
const greenAdd=(k,x,y,z,sx,sy,sz,r,col)=>{if(CUR_GREEN)CUR_GREEN.push([k,x,y,z,sx,sy,sz,r,col])};
/* towns only look different from afar in their smoke and street life, so panning rebuilds them only when a town crosses that line */
const isFar=c=>Math.hypot(wx(c.x)-camT.x,wz(c.y)-camT.z)>camDist*1.3+2.5;
function farChanged(){for(const n of nations)if(n.alive)for(const c of n.cities)if(c._farS!==isFar(c))return true;return false}
function rebuildCities(){patchSets();RB0=performance.now();for(const n of nations)if(n.alive)for(const c of n.cities)c._farS=isFar(c);try{rebuildCities0()}finally{CUR_GREEN=null;TOWN_GREEN=[];for(const n of nations)if(n.alive)for(const c of n.cities)if(c._green)for(const g of c._green)TOWN_GREEN.push(g);const sig=TOWN_GREEN.length+':'+(TOWN_GREEN[0]?TOWN_GREEN[0][1].toFixed(2):'');if(sig!==TGSIG){TGSIG=sig;if(typeof jobs!=='undefined')jobs.push(rebuildGreen)}}}
/* when every town, lair, ruin and mine would come out exactly as it is now, the whole rebuild is skipped */
let RC_SIG='';
const cityModelsSame=h=>typeof mdlSame!=='function'||mdlSame(h.mu);
function rcSig(){let s=terrBase+'/'+settings.quality+'/'+(settings.models!==false)+'/'+(typeof MDL_VER!=='undefined'?MDL_VER:0)+'/'+lookKey+'/'+settings.arch+'/';for(const n of nations){if(!n.alive)continue;const e=n.era,gold=n.golden>year,lvl=Math.floor(Math.min(TOWN_MAX,cityLevel(n)+(gold?1.5:0))*2)/2;
    n.cities.forEach((c,ci)=>{const key=cityKey(n,c,ci,e,lvl,gold,ci===0),hit=CITYCACHE.get(c);s+=(hit&&hit.key===key&&cityModelsSame(hit)?'=':'!')+c.x+','+c.y+';'})}
  s+='|'+coves.map(c=>c.x+','+c.y).join(';')+'|'+ruins.map(r=>r.x+','+r.y+':'+Math.floor((year-r.year)/10)).join(';')+'|'+deposits.map(d=>d.i+d.k+':'+owner[d.i]+':'+(owner[d.i]>=0&&nations[owner[d.i]]?nations[owner[d.i]].era:-1)).join(';');return s}
function rebuildCities0(){{const sig=rcSig();if(sig===RC_SIG&&!sig.includes('!'))return;RC_SIG=sig}{let s='';for(const n of nations)if(n.alive&&n.era>=5&&n.era<=6)s+=n.id+':'+n.era+':'+n.cities.length+';';if(s!==sootSig){sootSig=s;if(typeof colorDirty!=='undefined')colorDirty=true}}
  for(const m of townFlags)scene.remove(m);townFlags=[];airports=[];spaceports=[];bgrid.clear();FOOT.clear();kitReset(BUILD_KITS);occupied.clear();bare.clear();grassAt.x=1e9;emitters=[];herds=[];cityStreets=[];for(const g of windmills)scene.remove(g);windmills=[];
  const stale=[];
  for(const n of nations){if(!n.alive)continue;const e=n.era,gold=n.golden>year,lvl=Math.floor(Math.min(TOWN_MAX,cityLevel(n)+(gold?1.5:0))*2)/2;
    n.cities.forEach((c,ci)=>{const key=cityKey(n,c,ci,e,lvl,gold,ci===0),hit=CITYCACHE.get(c);
      if(hit&&hit.key===key&&cityModelsSame(hit)){replayCity(hit);return}
      if(!hit){buildOne(n,c,ci,e,gold,lvl,key);return}
      /* stale: rebuild the most out-of-date towns first so none is left showing an old age */
      const d=Math.hypot(wx(c.x)-camT.x,wz(c.y)-camT.z);stale.push({n,c,ci,e,gold,lvl,key,hit,pr:(hit.era!==e?0:1e4)+(hit.key.split('|')[1]!==key.split('|')[1]?0:5e3)+Math.min(4e3,d*20)-Math.min(3e3,(performance.now()-(hit.t||0))/100)})})}
  stale.sort((a,b)=>a.pr-b.pr);
  for(const q of stale){if(performance.now()-RB0<14||q.hit.era!==q.e)buildOne(q.n,q.c,q.ci,q.e,q.gold,q.lvl,q.key);else{propsDirty=true;replayCity(q.hit)}}
  /* anyone a new house went up around steps back out into the street */
  for(const w of walkers)if(inBuilding(w.x,w.z)&&w.ci){const p=cityPoint(w.ci);w.x=w.tx=p[0];w.z=w.tz=p[1];w.moving=false}
  for(const nm of BUILD_KITS)KITS[nm].csPre=KITS[nm].k;
  buildExtras();RC_SIG=rcSig()}
function buildOne(n,c,ci,e,gold,lvl,key){const L0={em:emitters.length,hd:herds.length,cs:cityStreets.length,ap:airports.length,sp:spaceports.length,wm:windmills.length,tf:townFlags.length};
  REC={k:{},occ:[],bare:[],bg:[]};FOOTREC=[];const mu0=typeof MDL_USED!=='undefined'?MDL_USED:null,mu={};if(typeof MDL_USED!=='undefined')MDL_USED=mu;try{buildCity(n,c,ci,e,gold,lvl)}finally{if(typeof MDL_USED!=='undefined')MDL_USED=mu0;const Rc=REC;REC=null;Rc.ft=FOOTREC;FOOTREC=null;Rc.mu=mu;Rc.m={};Rc.c={};Rc.s={};
    for(const nm in Rc.k){const a=Rc.k[nm],cnt=a.length/19,m=new Float32Array(cnt*16),cl=new Float32Array(cnt*3);for(let i=0;i<cnt;i++){for(let j=0;j<16;j++)m[i*16+j]=a[i*19+j];cl[i*3]=a[i*19+16];cl[i*3+1]=a[i*19+17];cl[i*3+2]=a[i*19+18]}
      const K=KITS[nm];Rc.m[nm]=m;Rc.c[nm]=cl;Rc.s[nm]=spheresOf(K,m,0,cnt,new Float32Array(cnt*4));if(K.k>=cnt)stageSpheres(K,Rc.s[nm],K.k-cnt,cnt)}delete Rc.k;Rc.bareI=bare.idxs(Rc.bare);delete Rc.bare;
    Object.assign(Rc,{key,era:e,t:performance.now(),em:emitters.slice(L0.em),hd:herds.slice(L0.hd),cs:cityStreets.slice(L0.cs),ap:airports.slice(L0.ap),sp:spaceports.slice(L0.sp),wm:windmills.slice(L0.wm),tf:townFlags.slice(L0.tf)});CITYCACHE.set(c,Rc)}}
function buildCity(n,c,ci,e,gold,lvl){{const i0=c.y*W+c.x,cx=wx(c.x),cz=wz(c.y),cap=ci===0;occupied.add(i0);
      const cy=surfY(cx,cz);
      if(e>=1)bareMark(cx,cz,(cap?.3:.15)*.95);cityCenter(n,c,cx,cy,cz,e,cap,i0);
      const KO=[],lag0=isLagoon(n,c,e);if(cap){/* the palace or castle stands on dry ground: a capital built on a river puts it a little to one side */
        const kr=lag0&&e>=3?.32:e===0?.3:e<=2?.46:e<=4?.7:e===5?.32:.2;let lx=cx,lz=cz;if(!lag0&&riverNear(cx,cz,kr*.35)){let best=null;for(const r of [.15,.3,.45])for(let q=0;q<8&&!best;q++){const x=cx+Math.cos(q*.785)*r,z=cz+Math.sin(q*.785)*r;if(!riverNear(x,z,kr*.35)&&groundY(x,z)>waterY+.04)best=[x,z]}if(best){lx=best[0];lz=best[1]}}
        const ly=lx===cx&&lz===cz?cy:surfY(lx,lz);solid(()=>{if(lag0&&e>=3)lagoonCapital(n,cx,cy,cz,e);else landmark(n,lx,ly,lz,e)},lx,lz,0,true);KO.push([lx,lz,kr])}
      const CO=cap&&e>=3&&e<=4?2.3:1;
      /* the wonder and the temple stand clear of rivers and brooks: if their usual spot is wet, they move round the centre */
      const dryOff=(ox,oz,r)=>{for(let q=0;q<8;q++){const a=q*.785,x=cx+ox*Math.cos(a)-oz*Math.sin(a),z=cz+ox*Math.sin(a)+oz*Math.cos(a);if(!riverNear(x,z,r)&&groundY(x,z)>waterY+.03)return [x,z]}return [cx+ox,cz+oz]};
      if(cap&&n.wonder){const [wx_,wz_]=dryOff(.42*CO,-.3*CO,.2);solid(()=>wonder(n,wx_,surfY(wx_,wz_),wz_,n.wonder),wx_,wz_,0,false,undefined,'big');occupied.add(Math.floor(wz_+H/2)*W+Math.floor(wx_+W/2));KO.push([wx_,wz_,.3])}
      if(n.faith>=0&&(cap||hash(i0*3)<.35)){const [tx,tz]=dryOff(-.32*CO,.2*CO,cap?.2:.15);solid(()=>sacredSite(faiths[n.faith],n,tx,surfY(tx,tz),tz,e,hash(i0)*3,cap),tx,tz,0,false,undefined,'big');KO.push([tx,tz,cap?.26:.2])}
      if(c.dike)dikeRing(c,cx,cz);
      MCTX={lvl,cap,tall:[],w:.12,cu:cultOf(n),n};const lagoon=isLagoon(n,c,e);MCTX.lagoon=lagoon;const plan=townPlan(n,c,cap,e),slots=plan.slots,reach=new Map(),youth=cap?1:townGrowth(c);const count=Math.round(youth*(plan.metro?Math.min(slots.length,cap?2800:1300):Math.round(((cap?6:3)+Math.min(TOWN_MAX,townLevel(n,cap)+(gold?1.5:0))*(cap?3.6:2.3))*(e>=3&&e<=4?(cap?3.4:3.2):e>=1&&e<=5?1.7:e>=6?2.3:1.2)*clamp(W/112,.6,1.4))));
      if(plan.metro)plan.streets.forEach((st,si)=>{if(st.main&&st.base<=plan.pr+.01)reach.set(si,.5)});let k=0,placed=0;const HP=[];CUR_GREEN=c._green=[];c._poi={pts:[],plaza:[cx,cz],r:plan.pr};
      const far=Math.hypot(cx-camT.x,cz-camT.z)>camDist*1.3+2.5;MCTX.far=far;
      if(e>=2&&e<=4&&!plan.metro&&!lagoon&&count>=(cap?14:18)){const ds=[];for(const sl of slots){if(ds.length>=count)break;const t=tileAt(sl.x,sl.z);if(t<0||(owner[t]>=0&&owner[t]!==n.id))continue;ds.push(Math.hypot(sl.x-cx,sl.z-cz))}
        /* a big town with a dense core is a walled city: the wall runs just outside the packed streets, with the market and the church inside;
           cottages, gardens and orchards spread outside the gates */
        const tight=plan.wallR>.3,wR=tight?plan.wallR+.05:0;
        if(tight){WALL_TIGHT=true;try{townWall(n,plan,cx,cz,wR,e,false,i0)}finally{WALL_TIGHT=false}innerCity(n,plan,cx,cy,cz,e,cap,i0,wR,KO)}
        else if(ds.length>=(cap?14:18)){ds.sort((a,b)=>a-b);townWall(n,plan,cx,cz,ds[Math.floor(ds.length*.8)]+.09,e,false,i0)}}
      if(e>=1)solid(()=>harbour(c,cx,cz,e,i0,lvl),cx,cz,0,true,undefined,'big');
      c._canals=[];
      for(const sl of slots){if(placed>=count)break;k++;MCTX.w=sl.metro?sl.w:.12;
        if(e>=1){/* two towns that meet never build on the same spot */const bk=Math.round(sl.x*12)+','+Math.round(sl.z*12);if(bgrid.has(bk))continue;bgrid.add(bk)}
        const ti=tileAt(sl.x,sl.z);if(ti<0||(owner[ti]>=0&&owner[ti]!==n.id))continue;
        if(KO.some(q=>Math.hypot(sl.x-q[0],sl.z-q[1])<q[2]+Math.max(sl.w,sl.d)*.6))continue;/* never on top of the temple, the palace or a wonder */
        if(!lagoon&&riverNear(sl.x,sl.z,Math.hypot(sl.w,sl.d)*.5+(sl.pd||0)+.01))continue;/* nor in a river or a brook, house and garden */
        const hw=sl.w/2,hd=sl.d/2,ca=Math.cos(sl.rot),sa=Math.sin(sl.rot);let mn=1e9,mx=-1e9;
        for(const [a,b] of [[-hw,-hd],[hw,-hd],[-hw,hd],[hw,hd],[0,0]]){const y=groundY(sl.x+a*ca+b*sa,sl.z-a*sa+b*ca);if(y<mn)mn=y;if(y>mx)mx=y}
        const wet=lagoon&&mn<waterY+.03;if((!wet&&mn<waterY+.03)||(!wet&&mx-mn>.09))continue;
        let y=mx;const hk=hash(c.x*31+c.y*17+k*13);
        const up=solid(()=>{
        if(wet){/* a stone footing rising out of the lagoon, green with weed at the waterline */y=Math.max(mx,waterY+.022);add('stone',sl.x,mn-.03,sl.z,sl.w*1.04,y-mn+.03,sl.d*1.04,sl.rot,0xc2b8a4);add('box',sl.x,waterY-.004,sl.z,sl.w*1.05,.01,sl.d*1.05,sl.rot,0x4a5a3a);
          if(hash(k*3.3)<.45){const fx=Math.sin(sl.rot),fz=Math.cos(sl.rot),px=sl.x+fx*(sl.d/2+.02),pz=sl.z+fz*(sl.d/2+.02);/* mooring posts and a gondola */
            for(const sd of [-1,1])add('cyl',px+fz*sd*.02,waterY-.02,pz-fx*sd*.02,.004,.06,.004,0,hash(k+sd)<.5?0xc84a3a:0x2a4a7a);
            add('boat',px+fx*.012,waterY+.002,pz+fz*.012,.07,.008,.014,sl.rot+Math.PI,0x161616)}}
        else if(mx-mn>.012&&e>=1)add('stone',sl.x,mn-.03,sl.z,sl.w*1.04,mx-mn+.03,sl.d*1.04,sl.rot,0xa8a090);
        const fa=hash(i0*2.7)*6.283,inD=Math.abs(((Math.atan2(sl.z-cz,sl.x-cx)-fa+9.42)%6.283)-3.14)<1;/* the mills crowd into one smoky quarter */
        if(e===5&&sl.core<.4&&inD&&hk<.55&&(MCTX.fac|0)<(cap?7:3+lvl)){MCTX.fac=(MCTX.fac|0)+1;factory(sl.x,y,sl.z,sl.rot,true)}
        else if(sl.terr&&e>=1&&!wet)terraceHouse(n,sl,y,e,hk);
        else dwelling(n,sl.x,y,sl.z,sl.rot,e,hk,k,sl.core);
        if(!far&&!wet&&!sl.terr&&!sl.metro&&e>=1&&e<=5)cozyBits(sl,y,e,hk);
        if(sl.pd>0&&e>=1&&e<=4&&cultOf(n)!=='mideast'&&cultOf(n)!=='africa'&&!(plan.wallR>.3&&Math.hypot(sl.x-cx,sl.z-cz)<plan.wallR+.05))yard(sl.x,sl.z,sl.rot,sl.w,sl.d,sl.pd,sl.pw,hk);
        if(plan.metro&&e>=5&&e<=6&&sl.core<.5&&hk>.35)frontGarden(sl.x,y,sl.z,sl.rot,Math.min(sl.w,.075),Math.min(sl.d,.075),hk);
        },sl.x,sl.z,sl.rot,false,sl.terr?-.016:undefined);
        if(!up)continue;placed++;HP.push([sl.x,sl.z,Math.max(sl.w,sl.d)*.62+(sl.pd||0)*.9]);occupied.add(ti);(MCTX.dists||(MCTX.dists=[])).push(Math.hypot(sl.x-cx,sl.z-cz));bareRect(sl.x,sl.z,sl.rot,sl.w*1.15,sl.d*1.2);
        if(sl.st>=0)reach.set(sl.st,Math.max(reach.get(sl.st)||0,sl.at+.12));
        if(!lagoon||groundY(sl.fx,sl.fz)>waterY+.02)c._poi.pts.push([sl.fx,sl.fz]);
        if(!far&&e>=1&&e<=5&&hk<.24)smokeAt(sl.x,y+.13*(1+sl.core*.6),sl.z,false,.25)}
      /* a walled city is packed: every open patch inside the wall fills with houses, each facing the nearest lane, wall to wall with its neighbours */
      if(plan.wallR>.3&&e>=2&&e<=4&&!plan.metro&&!lagoon)packInside(n,plan,cx,cz,plan.wallR+.05,e,KO,HP,k);
      /* the painted look: the green between the lanes fills with orchards, garden shrubs, vegetable plots and haystacks, as in an old village */
      /* how far the houses reach: orchards and plantations are laid out beyond it */
      {const ds=HP.map(h=>Math.hypot(h[0]-cx,h[1]-cz)+h[2]).sort((a,b)=>a-b);c._townR=Math.max(plan.pr,plan.wallR>.3?plan.wallR+.06:0,ds.length?ds[Math.floor(ds.length*.9)]:0)}
      if(LK.pixel&&e>=1&&e<=4&&!plan.metro&&!lagoon&&HP.length>4)townInfill(n,plan,cx,cz,HP,i0,KO);
      if(e===7&&typeof windTurbine==='function'){/* wind turbines on the open ground beyond the town */const R2=(plan.metro||(cap?1.1:.7))+.45;for(let k=0;k<(cap?5:3);k++){const a=hash(i0*3.1+k)*6.283,x=cx+Math.cos(a)*R2,z=cz+Math.sin(a)*R2,t=tileAt(x,z);if(t<0||isWater(t)||owner[t]!==n.id)continue;windTurbine(x,groundY(x,z),z,.34,hash(i0)*6.28)}}
      if(MCTX.fac>0){/* smog: a brown haze hangs over the mill towns */const R_=(plan.metro||(cap?1.1:.7))*1.05+.3;add('smog',cx,cy+.05,cz,R_*2,.3+MCTX.fac*.02,R_*2,0,0x6a5a48);
        const fa=hash(i0*2.7)*6.283;add('smog',cx+Math.cos(fa)*R_*.45,cy+.08,cz+Math.sin(fa)*R_*.45,R_*1.1,.36,R_*1.1,0,0x4a4038)}
      {const fa=hash(i0*11)*6.283,fr=(cap?.3:.15)*.62,fx=cx+Math.cos(fa)*fr,fz=cz+Math.sin(fa)*fr;townFlag(n,fx,groundY(fx,fz),fz,cap,e)}
      if(c.riot&&year-c.riot<6){for(let q=0;q<2;q++){const a=hash(i0*7+q)*6.283;smokeAt(cx+Math.cos(a)*.12,cy+.06,cz+Math.sin(a)*.12,true,.5)}}
      if(c.siege>.08){for(let q=0;q<3;q++){const a=hash(i0*5+q)*6.283;smokeAt(cx+Math.cos(a)*.2,cy+.08,cz+Math.sin(a)*.2,true,.6+c.siege)}}
      if(c.statue&&e>=1){/* a statue of the god this people believe in */const big=cap?2:1.2,sa=hash(i0*9)*6.283,sx=cx+Math.cos(sa)*plan.pr*.55,sz=cz+Math.sin(sa)*plan.pr*.55,sy=groundY(sx,sz),
        sc=e<=3?0xdcd6ca:e<=5?0x6f9a8e:0xd8b04a,fc=faiths[c.statue.faith]?parseInt(faiths[c.statue.faith].color.slice(1),16):0xd8b04a;
        add('stone',sx,sy-.01,sz,.03*big,.022*big,.03*big,sa,0xb8b2a6);add('stone',sx,sy+.012*big,sz,.022*big,.006*big,.022*big,sa,0xc8c2b6);
        add('tower',sx,sy+.018*big,sz,.016*big,.04*big,.012*big,sa,sc);add('domeW',sx,sy+.058*big,sz,.012*big,.014*big,.012*big,0,sc);
        add('box',sx+.008*big,sy+.05*big,sz,.004*big,.026*big,.004*big,sa,sc,-.5);add('box',sx,sy+.006*big,sz+.016*big,.024*big,.006*big,.002,sa,fc)}
      if(n.festival>0&&e>=1){/* a harvest festival: bonfire, maypole and bunting on the green */const fy=groundY(cx,cz);
        add('flame',cx+plan.pr*.3,fy,cz-plan.pr*.2,.03,.05,.03);smokeAt(cx+plan.pr*.3,fy+.05,cz-plan.pr*.2,false,.8);
        add('cyl',cx-plan.pr*.3,fy,cz+plan.pr*.2,.005,.12,.005,0,0xe8e0d0);for(let k=0;k<6;k++){const a=k/6*6.283;add('box',cx-plan.pr*.3+Math.cos(a)*.02,fy+.06,cz+plan.pr*.2+Math.sin(a)*.02,.003,.11,.003,a,AWN[k%AWN.length],.35)}
        for(let k=0;k<16;k++){const a=k/16*6.283,r=plan.pr*.95;add('box',cx+Math.cos(a)*r,fy+.035,cz+Math.sin(a)*r,.008,.006,.002,-a,AWN[k%AWN.length])}
        for(let k=0;k<4;k++){const a=k/4*6.283+.4,r=plan.pr*.95;add('cyl',cx+Math.cos(a)*r,fy,cz+Math.sin(a)*r,.003,.045,.003,0,0x6a5236)}}
      if(gold&&e>=1){/* a golden age: a ring of white columns with gilded caps around the square */for(let k=0;k<(cap?10:6);k++){const a=k/(cap?10:6)*6.283+.2,r=plan.pr*.82,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r,y=groundY(x,z);
          add('cyl',x,y,z,.009,cap?.09:.065,.009,0,0xf2ede0);add('domeW',x,y+(cap?.09:.065),z,.014,.012,.014,0,0xe0b440)}}
      if(e>=6)modernExtras(n,c,cx,cz,cap,e,plan.pr);
      if(!far)streetLife(n,c,plan,e,cx,cy,cz,cap,i0,reach);
      if(e>=1){const t=e<4?0:e<6?1:2;
        plan.streets.forEach((st,si)=>{const lim=reach.get(si);if(!lim)return;const pts=[];
          const sw=st.main?(e<3?.04:e<5?.05:.066):(e<3?.028:e<5?.034:.044),flush=()=>{if(pts.length>1)cityStreets.push({pts:chaikin2(pts.slice(),2),w:sw,t});pts.length=0};let wetRun=0;
          for(const q of st.pts){if(q[2]>lim)break;
            if(lagoon&&groundY(q[0],q[1])<waterY-.01){flush();/* a canal: every so often a humped stone bridge crosses it */
              wetRun++;if(lagoon){const cr=c._canals,last=cr[cr.length-1];if(wetRun===1||!last)cr.push([[q[0],q[1]]]);else last.push([q[0],q[1]])}continue}
            wetRun=0;pts.push([q[0],q[1]])}
          flush()})}
    }}
function buildExtras(){
  /* the pirate lair: shacks behind a palisade, a jetty, beached boats and the black flag */
  for(const g of coveShips)disposeShip({g});coveShips=[];
  for(const cv of coves){const i0=cv.y*W+cv.x,cx=wx(cv.x),cz=wz(cv.y),cy=groundY(cx,cz);occupied.add(i0);
    for(let k=0;k<8;k++){const a=hash(i0+k*7)*6.283,d=.07+hash(i0*3+k)*.18,x=cx+Math.cos(a)*d,z=cz+Math.sin(a)*d,y=groundY(x,z);if(y<waterY+.02)continue;
      add('timber',x,y-.02,z,.1,.055,.075,a,0x6a5a4a);add('tiles',x,y+.034,z,.115,.035,.09,a,0x3a3430)}
    for(let k=0;k<5;k++){const a=hash(i0*5+k)*6.283,x=cx+Math.cos(a)*.12,z=cz+Math.sin(a)*.12;add('cyl',x,groundY(x,z),z,.018,.025,.018,0,0x5a4030)}
    for(let k=0;k<26;k++){const a=k/26*6.283,x=cx+Math.cos(a)*.3,z=cz+Math.sin(a)*.3,y=groundY(x,z);if(y<waterY+.02)continue;add('cyl',x,y-.02,z,.012,.06,.012,0,0x5a4a3a)}
    add('cyl',cx,cy,cz,.006,.22,.006,0,0x3a3028);add('box',cx+.03,cy+.19,cz,.06,.04,.003,0,0x111111);add('box',cx+.03,cy+.19,cz,.014,.014,.004,0,0xf2f2f2);
    add('flame',cx+.06,cy,cz+.05,.025,.04,.025);smokeAt(cx+.06,cy+.04,cz+.05,false,.5);
    let wd=-1;for(let d=0;d<4;d++){const X=cv.x+DX[d],Y=cv.y+DY[d];if(X>=0&&Y>=0&&X<W&&Y<H&&isWater(Y*W+X)){wd=d;break}}
    if(wd>=0){const px=cx+DX[wd]*.45,pz=cz+DY[wd]*.45;add('box',px,waterY-.04,pz,DX[wd]?.4:.06,.06,DX[wd]?.06:.4,0,0x4a3a2a);
      {const sx=px+DX[wd]*.3,sz=pz+DY[wd]*.3,g=makeShip(SAIL,'pirate','#121212');g.position.set(sx,waterY,sz);g.rotation.y=DX[wd]?0:Math.PI/2;scene.add(g);coveShips.push(g)}
      for(const sd of [-1,1]){const bx=px+DY[wd]*.09*sd,bz=pz+DX[wd]*.09*sd;add('boat',bx,waterY+.012,bz,.12,.05,.04,DX[wd]?0:Math.PI/2,0x2a2420);add('cyl',bx,waterY+.012,bz,.004,.11,.004,0,0x2a2420);add('awning',bx,waterY+.05,bz,.004,.06,.05,DX[wd]?Math.PI/2:0,0x151515)}}}
  /* ruins of sacked towns: broken walls and charred beams, slowly grown over */
  for(const r of ruins){const age=year-r.year;if(age>260)continue;const i0=r.y*W+r.x;if(occupied.has(i0))continue;const cx=wx(r.x),cz=wz(r.y);if(typeof drawRuinModel==='function'&&drawRuinModel(r,cx,cz,age,i0))continue;
    for(let k=0;k<14;k++){const a=hash(i0*7+k)*6.283,d=.05+hash(i0*3+k)*.3,x=cx+Math.cos(a)*d,z=cz+Math.sin(a)*d,y=groundY(x,z);if(y<waterY+.03)continue;
      const hgt=(.012+hash(i0+k*5)*.04)*(1-age/400);add('stone',x,y-.01,z,.07+hash(k+i0)*.05,hgt,.012,a,0x8a8478);
      if(k%3===0)add('box',x+.02,y,z+.01,.06,.008,.008,a+1,0x2a2420)}
    if(age<25)smokeAt(cx,groundY(cx,cz)+.05,cz,true,.5*(1-age/25))}
  if(typeof buildDeposits==='function')buildDeposits();
  kitCommit(BUILD_KITS);
}

/* ---------- fields & roads (merged ground ribbons) ---------- */
const fieldMat=new THREE.MeshStandardMaterial({map:TX.furrow,vertexColors:true,roughness:1});
/* photo soil and leafy crops (Poly Haven, CC0) laid over the painted crop rows, close up only */
const FIELDU={uHam:{value:0},fS:{value:null},fC:{value:null},fN:{value:null},uPh:{value:0}};
{const g=new THREE.DataTexture(new Uint8Array([128,128,128,255]),1,1,THREE.RGBAFormat);g.needsUpdate=true;const nf=new THREE.DataTexture(new Uint8Array([128,128,255,255]),1,1,THREE.RGBAFormat);nf.needsUpdate=true;
 FIELDU.fS.value=FIELDU.fC.value=g;FIELDU.fN.value=nf;let left=3;const L=new THREE.TextureLoader();
 for(const [k,f] of [['fS','f_soil'],['fC','f_crop'],['fN','f_soil_n']])L.load('assets/textures/'+f+'.jpg',t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;FIELDU[k].value=t;if(--left<=0)FIELDU.uPh.value=1},undefined,()=>{left--})}
fieldMat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,FIELDU);
  sh.vertexShader='varying vec3 vFW;\n'+sh.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\n  vFW=(modelMatrix*vec4(transformed,1.)).xyz;');
  sh.fragmentShader='uniform sampler2D fS,fC,fN;uniform float uPh,uHam;varying vec3 vFW;float fFade,fCrop;\nfloat wh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float wn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(wh(i),wh(i+vec2(1,0)),f.x),mix(wh(i+vec2(0,1)),wh(i+vec2(1,1)),f.x),f.y);}\n'+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
  fFade=(1.-smoothstep(12.,46.,length(vFW-cameraPosition)))*uPh;fCrop=smoothstep(-.02,.06,diffuseColor.g-diffuseColor.r*.92);
  if(fFade>.01){vec2 P=vFW.xz*.45;float so=texture2D(fS,P).r*.6+texture2D(fS,P*.31+.31).r*.4,cr=texture2D(fC,P*1.3).r*.65+texture2D(fC,P*.4+.17).r*.35;
    /* broad patches where the crop grows thicker or thinner, and wetter or drier soil */
    float pa=texture2D(fC,P*.07+.53).r*.6+texture2D(fS,P*.11+.2).r*.4;
    float d=mix(so,cr,fCrop*.75)+(pa-.5)*.9;diffuseColor.rgb*=mix(1.,.45+d*1.1,fFade*.95);}
  /* the painted look, close up: ears of wheat and clods of soil at their real size, streaked along the rows */
  if(uHam>0.){float cf=(1.-smoothstep(1.5,10.,length(vFW-cameraPosition)))*uHam;
    if(cf>.01){
    #ifdef USE_MAP
      vec2 R=vUv*vec2(9.,2.2);
    #else
      vec2 R=vFW.xz*vec2(9.,22.);
    #endif
      /* stalks streak along the rows, ears catch the light in specks; soil breaks into clods */
      float st=wn(vec2(R.x*4.,R.y*90.)),sp=wn(R*vec2(38.,70.)),ear=step(.78,wh(floor(R*vec2(30.,60.)))),cl=wn(vFW.xz*55.)*.55+wn(vFW.xz*150.)*.45;
      float ripe=smoothstep(.04,.14,diffuseColor.r-diffuseColor.b*1.2)*smoothstep(.1,.25,dot(diffuseColor.rgb,vec3(.3,.59,.11)));
      float det=mix(.78+cl*.44,.8+st*.28+(sp-.5)*.16+ear*.08,ripe);diffuseColor.rgb*=mix(1.,det,cf*.8);}}
  #ifdef USE_MAP
  if(uHam>0.){vec4 fm=texture2D(map,vUv);diffuseColor.rgb*=mix(1.,(.72+fm.r*.28)/max(fm.r,.2),.55*uHam);}
  #endif
  diffuseColor.rgb*=.86;`).replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
  if(fFade>.01){vec3 nn=texture2D(fN,vFW.xz*.45).xyz*2.-1.;normal=normalize(normal+(viewMatrix*vec4(nn.x,0.,-nn.y,0.)).xyz*.5*fFade*(1.-fCrop*.6));}`)};
const roadMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95});
let fieldMesh=null,roadMesh=null;const fieldTiles=new Set();
const CROPS_H=[[192,152,70],[204,164,78],[110,80,52],[96,70,46],[90,110,50],[176,144,76]];
const CROPS=[[214,176,70],[196,158,58],[104,150,52],[136,178,64],[132,96,58],[160,150,70],[186,160,48]];
let FIELD_SIG='';
function rebuildFields(){
  const pos=[],uv=[],col=[];fieldTiles.clear();let fsig=terrVer+'|'+(LK.pixel?1:0)+'|';const work=[];
  const vtx=(x,z,u,v,c)=>{pos.push(x,groundY(x,z)+.012,z);uv.push(u,v);col.push(c[0],c[1],c[2])};
  for(const n of nations){if(!n.alive||n.era<1)continue;const rad=(n.era>=4?3:2)+(LK.pixel?1:0),R2=Math.max(rad,typeof farmReach==='function'?farmReach(n):0);
    for(const c of n.cities)for(let dy=-R2;dy<=R2;dy++)for(let dx=-R2;dx<=R2;dx++){const X=c.x+dx,Y=c.y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const i=Y*W+X;
      /* clearings the woodcutters left are always farmed */
      const fm=typeof FARMT!=='undefined'&&FARMT&&FARMT[i];if(!fm&&(Math.abs(dx)>rad||Math.abs(dy)>rad))continue;
      if(owner[i]!==n.id||occupied.has(i)||fieldTiles.has(i))continue;const b=biome[i];if(!fm&&!(b===4||b===8||(b===5&&n.era>=3)))continue;
      if(!fm&&hash(i*5.3)>(n.era>=5?.8:LK.pixel?.82:.62))continue;
      const X0=X-W/2,Z0=Y-H/2;if(groundY(X0+.5,Z0+.5)<waterY+.08)continue;
      /* no fields on steep ground: a hillside or the foot of a mountain stays grass or woods */
      if(tslope.length===N&&tslope[i]>.24)continue;
      fieldTiles.add(i);fsig+=i+(n.famine>0?'f':'')+n.id+(n.era>=6?'m':'')+',';work.push(()=>{
      /* the painted countryside: neighbouring tiles form one large field of a single crop (ripe wheat, ploughed rows, young green or hay),
         its rows running straight on across the whole field */
      if(LK.pixel){const pk=hash(Math.floor(X/2+hash(Y*.37)*.9)*7.31+Math.floor(Y/2)*13.7+n.id*3.1),crop=n.famine>0?[132,104,70]:CROPS_H[(pk*CROPS_H.length*.999)|0],cc=crop.map(v=>LIN[v|0]),alongP=hash(pk*9.1)<.5,M=3;
        for(let q=0;q<M;q++)for(let r2=0;r2<M;r2++){const a0=q/M,a1=(q+1)/M,b0=r2/M,b1=(r2+1)/M,P=(a,b)=>[X0+a,Z0+b],U=(x,z)=>alongP?[x*2.4,z*1.1]:[z*2.4,x*1.1];
          const p00=P(a0,b0),p10=P(a1,b0),p01=P(a0,b1),p11=P(a1,b1),u00=U(...p00),u10=U(...p10),u01=U(...p01),u11=U(...p11);
          /* a patch that runs up a slope is left as grass */{const hs=[p00,p10,p01,p11].map(q=>groundY(q[0],q[1]));if(Math.max(...hs)-Math.min(...hs)>.07)continue}
          vtx(p00[0],p00[1],u00[0],u00[1],cc);vtx(p01[0],p01[1],u01[0],u01[1],cc);vtx(p11[0],p11[1],u11[0],u11[1],cc);
          vtx(p00[0],p00[1],u00[0],u00[1],cc);vtx(p11[0],p11[1],u11[0],u11[1],cc);vtx(p10[0],p10[1],u10[0],u10[1],cc)}
        return}
      const along=hash(i*2.1)<.5,strips=n.era>=6?1:2+((hash(i*9.7)*3)|0);
      for(let s=0;s<strips;s++){const c0=CROPS[(hash(i*13+s)*CROPS.length)|0],cc=(n.famine>0?[lerp(c0[0],132,.75),lerp(c0[1],104,.75),lerp(c0[2],70,.75)]:c0).map(v=>LIN[v|0]),a0=s/strips+.012,a1=(s+1)/strips-.012;
        for(let q=0;q<3;q++){const b0=q/3+.02*(q===0),b1=(q+1)/3-.02*(q===2);
          const pt=(a,b)=>along?[X0+a,Z0+b]:[X0+b,Z0+a];
          const p00=pt(a0,b0),p10=pt(a1,b0),p01=pt(a0,b1),p11=pt(a1,b1),L=strips*1.2;
          {const hs=[p00,p10,p01,p11].map(q=>groundY(q[0],q[1]));if(Math.max(...hs)-Math.min(...hs)>.07)continue}
          vtx(p00[0],p00[1],0,b0*3,cc);vtx(p01[0],p01[1],0,b1*3,cc);vtx(p11[0],p11[1],L/strips,b1*3,cc);
          vtx(p00[0],p00[1],0,b0*3,cc);vtx(p11[0],p11[1],L/strips,b1*3,cc);vtx(p10[0],p10[1],L/strips,b0*3,cc)}}})}}
  /* the same farmland as last time: the field meshes stand as they are */
  if(fsig===FIELD_SIG&&fieldMesh)return;FIELD_SIG=fsig;for(const f of work)f();
  /* the painted look: where a field meets meadow, its outer edge fades into the grass instead of stopping on a hard line */
  if(LK.pixel){const gc=((LK.ground||{})[4]||[78,104,48]).map(v=>LIN[v|0]*.95);
    const isF=(X,Z)=>X>=0&&Z>=0&&X<W&&Z<H&&fieldTiles.has(Z*W+X);
    for(let v=0;v<pos.length/3;v++){const gx=pos[v*3]+W/2,gz=pos[v*3+2]+H/2,tx=Math.floor(gx+1e-4),tz=Math.floor(gz+1e-4),fx=gx-tx,fz=gz-tz;
      const xs=fx<.02?[tx-1,tx]:fx>.98?[tx,tx+1]:[tx],zs=fz<.02?[tz-1,tz]:fz>.98?[tz,tz+1]:[tz];let e=0;
      for(const X of xs)for(const Z of zs)if(!isF(X,Z))e=1;
      if(e){for(let k=0;k<3;k++)col[v*3+k]=col[v*3+k]*.45+gc[k]*.55}}}
  if(!fieldMesh){fieldMesh=new THREE.Mesh(new THREE.BufferGeometry(),fieldMat);fieldMesh.receiveShadow=true;fieldMesh.frustumCulled=false;scene.add(fieldMesh)}
  const g=freshGeo(fieldMesh);g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.deleteAttribute('normal');g.computeVertexNormals();g.computeBoundingSphere();
}
TX.river=canvasTex(64,(x,s)=>{x.fillStyle='#ffffff';x.fillRect(0,0,s,s);for(let i=0;i<40;i++){x.strokeStyle=`rgba(255,255,255,${.3+trand()*.4})`;x.fillStyle='rgba(180,210,230,.35)';const px=trand()*s,py=trand()*s;x.fillRect(px,py,2+trand()*10,1.5)}});
TX.river.encoding=THREE.sRGBEncoding;
/* inland water: rivers, ponds, marsh pools and moats share one shader. Deep and dark in the middle, muddy and clear at the banks,
   soft edges that melt into the ground, rippling normals that move with the current, and a glossy surface that picks up the sky */
const INWU={uTime:{value:0}};
function inlandWaterMat(kind){const river=kind===true||kind==='river',moat=kind==='moat';const m=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.2,metalness:0,transparent:true,depthWrite:false,envMapIntensity:.5});
  m.onBeforeCompile=sh=>{sh.uniforms.uTime=INWU.uTime;sh.uniforms.uWave={value:WAVE_TEX};
    sh.vertexShader='varying vec2 vIU,vIL;varying vec3 vIW;varying float vIY;\n'+sh.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\n  vIU=uv;vIY=normal.y;vIL=position.xz*2.;').replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
    {vec4 tw=vec4(transformed,1.);
    #ifdef USE_INSTANCING
    tw=instanceMatrix*tw;
    #endif
    vIW=(modelMatrix*tw).xyz;}`);
    sh.fragmentShader='uniform float uTime;uniform sampler2D uWave;varying vec2 vIU,vIL;varying vec3 vIW;varying float vIY;float iwDepth;\n'+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    ${river?'float acr=abs(vIU.x-.5)*2.;iwDepth=1.-acr*acr;':moat?'float rr=length(vIL);iwDepth=clamp(1.-abs(rr-.87)/.14,0.,1.);':'float rr=length(vIL);iwDepth=clamp(1.-rr,0.,1.);'}
    vec2 fp=${river?'vec2(vIU.x*.35,vIU.y*.22-uTime*.12)':'vIW.xz*.9+vec2(uTime*.012,uTime*.008)'};
    float wh=texture2D(uWave,fp).a*.6+texture2D(uWave,vIW.xz*2.1-vec2(uTime*.03,-uTime*.02)).a*.4;
    vec3 bank=vec3(.11,.12,.075),mid=vec3(.025,.065,.075),deep=vec3(.012,.035,.05);
    vec3 wc=mix(bank,mid,smoothstep(.0,.55,iwDepth));wc=mix(wc,deep,smoothstep(.55,1.,iwDepth)*.8);wc*=.9+wh*.22;
    ${river?'float rip=smoothstep(.8,.96,wh)*(1.-smoothstep(.0,.5,iwDepth))*.3+smoothstep(.9,.98,wh)*.08;wc=mix(wc,vec3(.6,.66,.66),rip);':''}
    diffuseColor.rgb=wc;diffuseColor.a=smoothstep(0.,.38,iwDepth)*.94${river?'':'*step(.5,vIY)'};`).replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
    {vec3 n1=texture2D(uWave,${river?'vec2(vIU.x*.35,vIU.y*.22-uTime*.12)':'vIW.xz*.9+vec2(uTime*.012,uTime*.008)'}).xyz*2.-1.,n2=texture2D(uWave,vIW.xz*2.1-vec2(uTime*.03,-uTime*.02)).xyz*2.-1.;
     vec3 wn=normalize(vec3((n1.x+n2.x*.6)*.28,1.,(n1.y+n2.y*.6)*.28));normal=normalize(mix(normal,(viewMatrix*vec4(wn,0.)).xyz,.9));}`)};
  m.customProgramCacheKey=()=>'inland-'+(river?'river':moat?'moat':'pond');return m}
const riverMat=inlandWaterMat(true),pondMat=inlandWaterMat(false);
let riverMesh=null;
function chaikin(p,it){for(let k=0;k<it;k++){const o=[p[0]];for(let i=0;i<p.length-1;i++){const a=p[i],b=p[i+1];o.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25,a[2]*.75+b[2]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75,a[2]*.25+b[2]*.75])}o.push(p[p.length-1]);p=o}return p}
function brooks(){const out=[],src=[];for(let i=0;i<N;i++){if(isWater(i)||river[i]||biome[i]>=11)continue;const a=h[i]-sea,m=baseMoist[i]+moistD[i];if(a<.04||a>.34||m<.4||hash(i*9.13)>.07)continue;src.push(i)}
  const taken=new Uint8Array(N);
  for(const s of src){if(taken[s])continue;const path=[s];let cur=s;
    for(let k=0;k<30;k++){const x=cur%W,y=(cur/W)|0;let best=-1,bh=h[cur];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const q=Y*W+X;if(h[q]<bh-.0005){bh=h[q];best=q}}
      if(best<0)break;path.push(best);cur=best;if(isWater(best)||river[best]||taken[best]||marshAt(best))break}
    if(path.length<4)continue;for(const t of path)taken[t]=1;out.push(path)}
  return out}
function riverNear(x,z,r){const R=riverSegs(),t=tileAt(x,z);if(t<0)return false;const X=t%W,Y=(t/W)|0;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(X+dx<0||X+dx>=W||Y+dy<0||Y+dy>=H)continue;const L=R.get((Y+dy)*W+X+dx);if(!L)continue;
    for(const g of L){const ex=g[2]-g[0],ez=g[3]-g[1],l2=ex*ex+ez*ez||1e-9,u=clamp(((x-g[0])*ex+(z-g[1])*ez)/l2,0,1),d=Math.hypot(x-g[0]-ex*u,z-g[1]-ez*u);if(d<g[4]+r)return true}}return false}
/* the drawn rivers and brooks as line segments [x0,z0,x1,z1,half width,water height], filed under the tiles they touch, for the bridges */
let RSEG=null,RSEGK='';
function riverSegs(){const key=terrVer+'|'+rivers.length;if(RSEG&&RSEGK===key)return RSEG;RSEG=new Map();RSEGK=key;
  const put=(p,q,w,y)=>{const g=[p[0],p[1],q[0],q[1],w,y];for(const ti of new Set([tileAt(p[0],p[1]),tileAt(q[0],q[1]),tileAt((p[0]+q[0])/2,(p[1]+q[1])/2)])){if(ti<0)continue;let L=RSEG.get(ti);if(!L)RSEG.set(ti,L=[]);L.push(g)}};
  const run=(pts,wf,lift)=>{for(let k=0;k<pts.length-1;k++){const p=pts[k],q=pts[k+1],w=wf(p),y=Math.max(Math.min(groundY(p[0],p[1]),groundY(q[0],q[1]))+lift,waterY-.02);put(p,q,w,y)}};
  for(const r of rivers)run(chaikin(r.tiles.map(t=>[wx(t%W)+(hash(t)-.5)*.3,wz((t/W)|0)+(hash(t*3)-.5)*.3,river[t]||1]),2),p=>.045+.03*p[2],.03);
  for(const path of brooks())run(chaikin(path.map((t,k)=>[wx(t%W)+(hash(t*2.1)-.5)*.5,wz((t/W)|0)+(hash(t*4.7)-.5)*.5,k/path.length]),2),p=>.012+.02*p[2],.008);
  return RSEG}
function rebuildRivers(){const pos=[],uv=[],idx=[];let base=0;
  for(const r of rivers){const pts=chaikin(r.tiles.map(t=>[wx(t%W)+(hash(t)-.5)*.3,wz((t/W)|0)+(hash(t*3)-.5)*.3,river[t]||1]),2);let v=0;
    for(let k=0;k<pts.length;k++){const p=pts[k],q=pts[Math.min(k+1,pts.length-1)],o=pts[Math.max(k-1,0)];let dx=q[0]-o[0],dz=q[1]-o[1];const L=Math.hypot(dx,dz)||1;dx/=L;dz/=L;
      const w=.045+.03*p[2],nx=-dz*w,nz=dx*w,gl=groundY(p[0]+nx,p[1]+nz),gr=groundY(p[0]-nx,p[1]-nz),gc=groundY(p[0],p[1]);
      const y=Math.max(Math.min(gl,gr,gc)+.03,waterY-.02);if(k>0)v+=Math.hypot(p[0]-pts[k-1][0],p[1]-pts[k-1][1])*2.5;
      pos.push(p[0]+nx,y,p[1]+nz,p[0]-nx,y,p[1]-nz);uv.push(0,v,1,v);
      if(k>0){const a=base+(k-1)*2;idx.push(a,a+2,a+1,a+1,a+2,a+3)}}base+=pts.length*2}
  for(const path of brooks()){const pts=chaikin(path.map((t,k)=>[wx(t%W)+(hash(t*2.1)-.5)*.5,wz((t/W)|0)+(hash(t*4.7)-.5)*.5,k/path.length]),2);let v=0;
    for(let k=0;k<pts.length;k++){const p=pts[k],q=pts[Math.min(k+1,pts.length-1)],o=pts[Math.max(k-1,0)];let dx=q[0]-o[0],dz=q[1]-o[1];const L=Math.hypot(dx,dz)||1;dx/=L;dz/=L;
      const w=.012+.02*p[2],nx=-dz*w,nz=dx*w,y=Math.max(Math.min(groundY(p[0]+nx,p[1]+nz),groundY(p[0]-nx,p[1]-nz),groundY(p[0],p[1]))+.008,waterY-.02);if(k>0)v+=Math.hypot(p[0]-pts[k-1][0],p[1]-pts[k-1][1])*4;
      pos.push(p[0]+nx,y,p[1]+nz,p[0]-nx,y,p[1]-nz);uv.push(0,v,1,v);if(k>0){const a=base+(k-1)*2;idx.push(a,a+2,a+1,a+1,a+2,a+3)}}base+=pts.length*2}
  if(!riverMesh){riverMesh=new THREE.Mesh(new THREE.BufferGeometry(),riverMat);riverMesh.receiveShadow=true;riverMesh.frustumCulled=false;riverMesh.renderOrder=2;scene.add(riverMesh)}
  const g=freshGeo(riverMesh);g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.deleteAttribute('normal');g.computeVertexNormals()}
kit('bridge',unitBox(),MAT.stone,600);
let cityStreets=[];
const ROADMATS=[stdMat({map:TX.dirt,roughness:1}),stdMat({map:TX.cobble,roughness:.95}),stdMat({map:TX.asphalt,roughness:.85})];
[['plaster','b_plaster',.55],['stone','b_stone',.75],['brick','b_brick',.6],['thatch','b_thatch',.7],['thatch2','b_thatch',.7],['tiles','b_tiles',.7],['adobe','b_plaster',.6],['timber','b_timber',.6],['cobble','b_cobble',.7],['plaza','b_plaza',.6],['dirt','b_gravel',.65],['soil','b_ground',.5],['asphalt','b_asphalt',.7]].forEach(a=>photoLayer(...a));
let roadMeshes=[];const roadCache=new Map();
/* A* over tiles: slopes, rivers and mountains cost extra, roads already built are cheap to reuse */
function roadPath(a,b,nid,used){const key=a.x+','+a.y+'>'+b.x+','+b.y+'|'+nid;if(roadCache.has(key)){const p=roadCache.get(key);if(p)for(const j of p)used[j]=1;return p}
  const S=a.y*W+a.x,T=b.y*W+b.x,g=new Float32Array(N).fill(1e9),from=new Int32Array(N).fill(-1),heap=[];g[S]=0;
  const hx=j=>Math.hypot(j%W-b.x,((j/W)|0)-b.y);const push=(j,f)=>{heap.push([f,j]);let i=heap.length-1;while(i>0){const p=(i-1)>>1;if(heap[p][0]<=heap[i][0])break;[heap[p],heap[i]]=[heap[i],heap[p]];i=p}};
  const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let i=0;for(;;){const l=i*2+1,r=l+1;let m=i;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===i)break;[heap[m],heap[i]]=[heap[i],heap[m]];i=m}}return top};
  push(S,hx(S));let found=false,steps=0;
  while(heap.length&&steps++<20000){const [f,j]=pop();if(j===T){found=true;break}if(f-hx(j)>g[j]+1e-6)continue;const x=j%W,y=(j/W)|0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const k=Y*W+X;if(isWater(k))continue;
      if(dx&&dy&&(isWater(y*W+X)||isWater(Y*W+x)))continue;
      let c=(dx&&dy?1.414:1)*(1+tslope[k]*5+(biome[k]>=11?4:0)+(nid>=0&&owner[k]!==nid?3:0));
      if(river[k]&&!river[j])c+=2.5;if(used[k])c*=.45;const ng=g[j]+c;if(ng<g[k]){g[k]=ng;from[k]=j;push(k,ng+hx(k))}}}
  let path=null;if(found){path=[];for(let j=T;j>=0;j=from[j])path.push(j);path.reverse();for(const j of path)used[j]=1}
  if(roadCache.size>800)roadCache.clear();roadCache.set(key,path);return path}
const DISCS=new Map();function discOff(n){if(!DISCS.has(n)){const o=[];for(let a=-n;a<=n;a++)for(let b=-n;b<=n;b++)if(a*a+b*b<=n*n+1)o.push([a,b]);DISCS.set(n,o)}return DISCS.get(n)}
let riverVer=-1;
/* finished road ribbons are kept: a road or street that has not changed is copied, not traced again */
const RIBC=new Map();let ribcVer=-1;
/* when only the ground under some towns was re-flattened, only the road pieces there are worked out again */
let ribcBase=-1,RIB_DIRTY=[];
let ROAD_LINES=[];
let BRIDGES=[];
function rebuildRoads(){roadBare.clear();grassAt.x=1e9;BRIDGES=[];
  if(ribcVer!==terrVer){if(ribcBase===terrBase&&RIB_DIRTY.length<40){for(const [k,c] of RIBC)if(RIB_DIRTY.some(r=>c.x1>=r[0]&&c.x0<=r[1]&&c.z1>=r[2]&&c.z0<=r[3]))RIBC.delete(k)}else RIBC.clear();ribcVer=terrVer;ribcBase=terrBase;RIB_DIRTY=[]}
  const P3=[[],[],[]],U3=[[],[],[]],C3=[[],[],[]];
  kitReset(['bridge']);const bridged=new Set();
  const rib=(ax,az,bx,bz,w,t)=>{const L=Math.hypot(bx-ax,bz-az);if(L<1e-4)return;const S=Math.max(1,Math.ceil(L/.1)),nx=-(bz-az)/L*w/2,nz=(bx-ax)/L*w/2,rep=t===2?3:t===1?w*40:2;
    /* bridges stand where the road really crosses the water: the river (or brook) as it is drawn, not the tile it belongs to */
    {const R=riverSegs(),seen=new Set(),dX=bx-ax,dZ=bz-az;for(let s=0;s<=S;s+=2){const ti=tileAt(lerp(ax,bx,s/S),lerp(az,bz,s/S));const L_=R.get(ti);if(!L_)continue;
      for(const g of L_){if(seen.has(g))continue;seen.add(g);const eX=g[2]-g[0],eZ=g[3]-g[1],den=dX*eZ-dZ*eX;if(Math.abs(den)<1e-9)continue;
        const u=((g[0]-ax)*eZ-(g[1]-az)*eX)/den,v=((g[0]-ax)*dZ-(g[1]-az)*dX)/den;if(u<0||u>1||v<0||v>1)continue;
        const x=ax+dX*u,z=az+dZ*u,key=Math.round(x*20)+','+Math.round(z*20);if(bridged.has(key)||g[5]<waterY-.005)continue;bridged.add(key);
        const sin=Math.abs(den)/(L*Math.hypot(eX,eZ)),len=Math.min(.5,2*g[4]/Math.max(.35,sin)+.07),rot=Math.atan2(dX,dZ),ux=dX/L,uz=dZ/L;
        const y=Math.max(g[5]+.035,groundY(x-ux*len/2,z-uz*len/2)+.012,groundY(x+ux*len/2,z+uz*len/2)+.012),col=t===0?0x6b4a2e:t===1?0xb8b0a2:0x9a9a96,bw=w*1.5;
        add('bridge',x,y-.02,z,bw,.02,len,rot,col);add('bridge',x+Math.cos(rot)*bw*.5,y-.005,z-Math.sin(rot)*bw*.5,.006,.02,len,rot,col);add('bridge',x-Math.cos(rot)*bw*.5,y-.005,z+Math.sin(rot)*bw*.5,.006,.02,len,rot,col);
        BRIDGES.push({x,z,y:y+.002,h:len/2})}}}
    {const D=discOff(Math.ceil((w*.5+.012)/BC)),st=Math.max(1,Math.round(w/BC*.5));for(let s=0;s<=S;s+=st){const X=Math.floor(lerp(ax,bx,s/S)/BC),Z=Math.floor(lerp(az,bz,s/S)/BC);for(const [a,b] of D)roadBare.add((X+a)*100003+Z+b)}}
    for(let s=0;s<S;s++){const t0=s/S,t1=(s+1)/S,x0=lerp(ax,bx,t0),z0=lerp(az,bz,t0),x1=lerp(ax,bx,t1),z1=lerp(az,bz,t1);
      /* each corner of the road lies on the ground under it, so the road follows a slope across it as well as along it; it rises onto the
         deck only right at a bridge, with a short ramp either side, instead of hovering over the whole river tile */
      const v0=t0*L*rep/(w*8),v1=t1*L*rep/(w*8),ya=roadY(x0+nx,z0+nz),yb=roadY(x1-nx,z1-nz),yc=roadY(x0-nx,z0-nz),yd=roadY(x1+nx,z1+nz);
      P3[t].push(x0+nx,ya,z0+nz,x1-nx,yb,z1-nz,x0-nx,yc,z0-nz, x0+nx,ya,z0+nz,x1+nx,yd,z1+nz,x1-nx,yb,z1-nz);
      U3[t].push(0,v0,1,v1,1,v0, 0,v0,0,v1,1,v1)}};
  const roadY=(x,z)=>{const g=groundY(x,z)+.01,ti=tileAt(x,z);let best=g;
    for(const B of BRIDGES){const d=Math.hypot(x-B.x,z-B.z);if(d>B.h+.1)continue;if(d<B.h)best=Math.max(best,B.y);else best=Math.max(best,lerp(B.y,g,(d-B.h)/.1))}return best};
  /* roads: towns link to their nearest connected neighbour along the easiest ground (valleys, fords, existing roads) */
  const used=new Uint8Array(N),lines=[];
  for(const n of nations){if(!n.alive||n.cities.length<2)continue;const e=n.era,t=e<4?0:e<6?1:2,w=e<3?.055:e<5?.07:.1;
    const conn=[n.cities[0]],rest=n.cities.slice(1);
    while(rest.length){let bi=0,bj=0,bd=1e9;for(let i=0;i<rest.length;i++)for(let j=0;j<conn.length;j++){const d=Math.hypot(rest[i].x-conn[j].x,rest[i].y-conn[j].y);if(d<bd){bd=d;bi=i;bj=j}}
      const a=rest.splice(bi,1)[0],b=conn[bj];conn.push(a);if(bd>22)continue;
      const path=roadPath(a,b,n.id,used);if(path)lines.push({path,w,t,nid:n.id})}}
  for(const n of nations){if(!n.alive||!n.cities.length)continue;for(const m of n.trade){const B=nations[m];if(!B||!B.alive||m<n.id||!B.cities.length||!n.nb.has(m))continue;
    const path=roadPath(n.cities[0],B.cities[0],-1,used);if(path){const e=Math.min(n.era,B.era);lines.push({path,w:e<3?.05:e<5?.065:.09,t:e<4?0:e<6?1:2,nid:n.id})}}}
  /* trading partners that can be reached over land are joined where their towns lie nearest, so the two road networks meet */
  {const done=new Set();for(const n of nations){if(!n.alive||!n.cities.length)continue;for(const m of n.trade||[]){const B=nations[m];if(!B||!B.alive||!B.cities.length)continue;const key=Math.min(n.id,m)+':'+Math.max(n.id,m);if(done.has(key))continue;done.add(key);
      let a=null,b=null,bd=1e9;for(const p of n.cities)for(const q of B.cities){const d=Math.hypot(p.x-q.x,p.y-q.y);if(d<bd){bd=d;a=p;b=q}}if(!a||bd>34)continue;
      const path=roadPath(a,b,-1,used);if(path){const e=Math.min(n.era,B.era);lines.push({path,w:e<3?.05:e<5?.065:.09,t:e<4?0:e<6?1:2,nid:n.id,trade:m})}}}}
  /* the roads as they are drawn, for the travellers on them */
  ROAD_LINES=lines.map(L=>{const pts=chaikin2(L.path.map(j=>[wx(j%W)+(hash(j*3.1)-.5)*.25,wz((j/W)|0)+(hash(j*7.3)-.5)*.25]),3);let len=0;const acc=[0];for(let k=1;k<pts.length;k++){len+=Math.hypot(pts[k][0]-pts[k-1][0],pts[k][1]-pts[k-1][1]);acc.push(len)}
    let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(const q of pts){x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);z0=Math.min(z0,q[1]);z1=Math.max(z1,q[1])}return{pts,acc,len,nid:L.nid,trade:L.trade,box:[x0,x1,z0,z1]}});
  const cached=(key,t,fn)=>{let c=RIBC.get(key);const K=KITS.bridge;
    if(!c){const p0=P3[t].length,u0=U3[t].length,b0=K.k,bare=[];roadBare.add=v=>{bare.push(v);return BitGrid.prototype.add.call(roadBare,v)};try{fn()}finally{delete roadBare.add}
      c={P:new Float32Array(P3[t].slice(p0)),U:new Float32Array(U3[t].slice(u0)),bi:roadBare.idxs(bare),bn:K.k-b0,bm:K.mesh.instanceMatrix.array.slice(b0*16,K.k*16),bc:K.mesh.instanceColor?K.mesh.instanceColor.array.slice(b0*3,K.k*3):null};{let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;const P=c.P;for(let i=0;i<P.length;i+=3){if(P[i]<x0)x0=P[i];if(P[i]>x1)x1=P[i];if(P[i+2]<z0)z0=P[i+2];if(P[i+2]>z1)z1=P[i+2]}if(K.k>b0){x0=-1e9;x1=1e9;z0=-1e9;z1=1e9}Object.assign(c,{x0,x1,z0,z1})}if(RIBC.size>5000)RIBC.clear();RIBC.set(key,c);return}
    C3[t].push(c);for(const v of c.bi)roadBare.setIdx(v);
    if(c.bn&&K.k+c.bn<=K.max){kitGrow(K,K.k+c.bn);K.mesh.instanceMatrix.array.set(c.bm,K.k*16);if(c.bc&&K.mesh.instanceColor)K.mesh.instanceColor.array.set(c.bc,K.k*3);K.k+=c.bn}};
  for(const L of lines){const pa=L.path;cached('L'+L.t+'|'+L.w+'|'+pa.length+'|'+pa[0]+'|'+pa[pa.length>>1]+'|'+pa[pa.length-1],L.t,()=>{const pts=chaikin2(pa.map(j=>[wx(j%W)+(hash(j*3.1)-.5)*.25,wz((j/W)|0)+(hash(j*7.3)-.5)*.25]),3);
    for(let k=0;k<pts.length-1;k++)rib(pts[k][0],pts[k][1],pts[k+1][0],pts[k+1][1],L.w,L.t)})}
  for(const st0 of cityStreets){/* thin out street points: short segments cost as much as long ones */const P0=st0.pts,q=[P0[0]];for(let k=1;k<P0.length;k++){const l=q[q.length-1];if(k===P0.length-1||Math.hypot(P0[k][0]-l[0],P0[k][1]-l[1])>=.1)q.push(P0[k])}const st={pts:q,w:st0.w,t:st0.t};
    const f=q[0],m=q[q.length>>1],l=q[q.length-1];cached('S'+st.t+'|'+st.w+'|'+q.length+'|'+f[0].toFixed(3)+','+f[1].toFixed(3)+'|'+m[0].toFixed(3)+','+m[1].toFixed(3)+'|'+l[0].toFixed(3)+','+l[1].toFixed(3),st.t,()=>{
    for(let k=0;k<st.pts.length-1;k++){const a=st.pts[k],b=st.pts[k+1];if(groundY(a[0],a[1])>waterY+.03&&groundY(b[0],b[1])>waterY+.03)rib(a[0],a[1],b[0],b[1],st.w,st.t)}})}
  kitCommit(['bridge']);if(riverVer!==terrVer){riverVer=terrVer;rebuildRivers()}grassAt.x=1e9;
  for(let t=0;t<3;t++){if(!roadMeshes[t]){const m=new THREE.Mesh(new THREE.BufferGeometry(),ROADMATS[t]);m.receiveShadow=true;m.frustumCulled=false;m.renderOrder=1;scene.add(m);roadMeshes[t]=m}
    /* new pieces were built into plain lists; pieces from the cache are copied in as blocks */
    let np=P3[t].length,nu=U3[t].length;for(const c of C3[t]){np+=c.P.length;nu+=c.U.length}const PA=new Float32Array(np),UA=new Float32Array(nu);PA.set(P3[t]);UA.set(U3[t]);
    {let o=P3[t].length,q=U3[t].length;for(const c of C3[t]){PA.set(c.P,o);o+=c.P.length;UA.set(c.U,q);q+=c.U.length}}
    const g=freshGeo(roadMeshes[t]);g.setAttribute('position',new THREE.BufferAttribute(PA,3));g.setAttribute('uv',new THREE.BufferAttribute(UA,2));const nm=new Float32Array(PA.length);for(let q=1;q<nm.length;q+=3)nm[q]=1;g.setAttribute('normal',new THREE.BufferAttribute(nm,3));g.computeBoundingSphere()}
}

/* ---------- forests ---------- */
/* how many trees a tile carries. Woods are dense; open country has groves where a slow noise runs high and only the odd lone tree
   elsewhere, so the land reads as woods and meadows, not an even sprinkle. It never depends on where the camera is, so trees stay put. */
function groveN(x,y){const s=4.2,X=Math.floor(x/s),Y=Math.floor(y/s),fx=x/s-X,fy=y/s-Y,q=(a,b)=>hash(a*131.7+b*71.3+5.1),u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
  return lerp(lerp(q(X,Y),q(X+1,Y),u),lerp(q(X,Y+1),q(X+1,Y+1),u),v)}
function treeWant(i){const b=biome[i],g=groveN(i%W,(i/W)|0),lone=hash(i*1.3);
  switch(b){case 5:return 16;case 6:return 10;case 9:return g>.42?11:lone<.1?1:0;case 4:return g>.64?8:LK.pixel?(lone<.16?2:lone<.48?1:0):lone<.07?1:0;case 8:return lone<.22?1:0;
    case 3:return lone<.3&&(1-Math.abs(((i/W)|0)/(H-1)-.5)*2)>.5?1:0;case 11:return g>.55?5:lone<.25?1:0;case 12:return 3;case 7:return lone<.3?1:0}return 0}
/* one even scale for the whole world, so the forests always fit in the drawing budget instead of thinning out away from the camera */
let TGS=1;
/* the countryside is recorded once and replayed when only the towns' own gardens changed, which happens every few seconds as towns grow;
   trees standing where a town has since spread, or where fire burned, are left out of the replay. Everything is redone from scratch
   when the land, the settings or half a minute has passed. */
let FCACHE=null,greenDirty=false,TREE_LIGHT=false;
const forestSig=()=>[terrBase,terrBio,waterY,settings.quality,typeof PERF!=='undefined'&&perfOn()?PERF.treeK:1,!!LK.pixel,settings.models!==false,N].join('|');
function replayForest(){const D=LAYDIRTY&&LAYOLD&&LAYOLD.length===VY.length?LAYDIRTY:null;
  for(const name in FCACHE.k){const K=KITS[name],a=FCACHE.k[name],cnt=a.length/20;kitGrow(K,Math.min(K.max,K.k+cnt));const M=K.mesh.instanceMatrix.array,C=K.mesh.instanceColor.array;
  for(let i=0;i<cnt&&K.k<K.max;i++){const o=i*20,t=a[o+19];if(t>=0&&(occupied.has(t)||fieldTiles.has(t)||(scorched&&scorched[t]>0)||fires.has(t)))continue;
    if(D){const x=a[o+12],z=a[o+14],ti=tileAt(x,z);if(D.has(ti))a[o+13]+=groundY(x,z)-groundYIn(LAYOLD,x,z)}/* the ground under a growing town was flattened: the tree moves with it */
    M.set(a.subarray(o,o+16),K.k*16);C.set(a.subarray(o+16,o+19),K.k*3);K.k++}}
  if(D){LAYOLD=null;LAYDIRTY=null}}
function rebuildTrees(light){TREE_LIGHT=false;greenDirty=false;
  if(light===true&&FCACHE&&FCACHE.sig===forestSig()){TREE_LIGHT=true;kitReset(TREE_KITS);replayForest();kitCommit(TREE_KITS);return}
  TREC={k:{},t:-1};LAYOLD=null;LAYDIRTY=null;try{rebuildTrees0()}finally{const R=TREC;TREC=null;for(const nm in R.k)R.k[nm]=new Float32Array(R.k[nm]);R.sig=forestSig();FCACHE=R}}
function rebuildTrees0(){
  {let tot=0;for(let i=0;i<N;i++)if(!isWater(i))tot+=treeWant(i);TGS=Math.min(1,62000/Math.max(1,tot))}
  kitReset(TREE_KITS);rebuildGreen();const dens=(settings.quality==='high'?1:settings.quality==='medium'?.65:.4)*(typeof PERF!=='undefined'&&perfOn()?PERF.treeK:1),farm=countryside();
  /* trees near towns are drawn at a believable size next to the houses */
  const near=new Float32Array(N).fill(1);for(const n of nations)if(n.alive)for(const c of n.cities)for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const X=c.x+dx,Y=c.y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const d=Math.hypot(dx,dy);near[Y*W+X]=Math.min(near[Y*W+X],.5+smooth(1,3.2,d)*.5)}
  for(let i=0;i<N;i++){const b=biome[i];if(occupied.has(i)||fieldTiles.has(i)||farm.has(i)||(scorched&&scorched[i]>0)||fires.has(i))continue;if(TREC)TREC.t=i;
    const x0=i%W-W/2,z0=((i/W)|0)-H/2,lat=1-Math.abs(((i/W)|0)/(H-1)-.5)*2;let n=0,type='broad';
    if(marshAt(i)){/* a marsh: reeds and a few willows */for(let t=0;t<0;t++){const x=x0+.1+hash(i*2.3+t)*.8,z=z0+.1+hash(i*5.1+t)*.8,y=groundY(x,z);if(y<waterY+.01)continue;const s=.12+hash(i+t*9)*.22;let lo=y,hi=y;for(let q=0;q<4;q++){const a=q*1.571,g=groundY(x+Math.cos(a)*s*.45,z+Math.sin(a)*s*.32);lo=Math.min(lo,g);hi=Math.max(hi,g)}if(hi-lo>.03)continue;add('puddle',x,lo-.004,z,s,hi-lo+.0055,s*.7,hash(i*t+1)*6)}
      for(let t=0;t<16;t++){const x=x0+hash(i*3.7+t)*.98,z=z0+hash(i*6.3+t*2)*.98,y=groundY(x,z);if(y<waterY+.01)continue;add('reed',x,y-.003,z,.008,.05+hash(i*t+3)*.04,.008,0,hash(i+t)<.5?0x6a7a3a:0x8a7a48)}
      if(hash(i*4.4)<.5){const x=x0+.5,z=z0+.5,y=groundY(x,z);if(y>waterY+.02)add('broad',x,y-.01,z,.55,.6,.55,hash(i)*6,0x5f7a3a)}continue}
    n=treeWant(i);type=b===5?(!LK.pixel&&(lat<.45||climate.temp<.4)?'conifer':'mix'):b===6?'jungle':b===4?'broad':b===8?'acacia':b===9?'conifer':b===3?'palm':b===11?'mount':b===12||b===7?'rock':'broad';
    if((b===4||b===8)&&dens>.5&&settings.quality!=='high'){const tn=b===4?3:2;for(let t=0;t<tn;t++){const x=x0+hash(i*2.7+t*5)*.96+.02,z=z0+hash(i*4.3+t*7)*.96+.02,y=groundY(x,z);if(y>waterY+.04)add('tuft',x,y-.004,z,.016,.022+hash(i+t)*.014,.016,hash(i*t),b===4?0x4e7232:0x8a8a44)}
      if(hash(i*8.1)<.22){const fc=[0xe8d84a,0xd8504a,0xf2f2f2,0x9a6ad0,0xf0a040][(hash(i*3.9)*5)|0];for(let t=0;t<5;t++){const x=x0+hash(i*6.1+t)*.9+.05,z=z0+hash(i*1.9+t*3)*.9+.05,y=groundY(x,z);if(y>waterY+.04)add('flower',x,y+.006,z,.012,.012,.012,0,fc)}}}
    if(owner[i]>=0&&nations[owner[i]].era>=3&&type!=='rock')n=Math.round(n*.45);
    /* felled forest: stumps and log piles at first, then saplings growing into young woodland */
    let grow=1;if((b===5||b===6)&&typeof forestGrowth==='function'){grow=forestGrowth(i);if(grow<1){const age=typeof CUTY!=='undefined'&&CUTY?year-CUTY[i]:99;
      if(grow<.45){const ns=Math.round((LK.pixel?4:6)*(1-grow*1.6));for(let t=0;t<ns;t++){const x=x0+.08+hash(i*3.1+t)*.84,z=z0+.08+hash(i*7.7+t)*.84,y=groundY(x,z);if(y<waterY+.04)continue;
          const r=.03+hash(i*2.3+t)*.02;add('stump',x,y-.008,z,r,.03+hash(i+t*4)*.02,r,0,hash(i*5+t)<.5?0x7a5a38:0x8a6a44)}
        for(let t=0;t<5;t++){const x=x0+.1+hash(i*4.1+t*3)*.8,z=z0+.1+hash(i*8.3+t)*.8,y=groundY(x,z);if(y>waterY+.04)add('tuft',x,y-.004,z,.018,.024+hash(i+t)*.012,.018,hash(i*t),0x6a8a3a)}}
      if(age<8&&hash(i*6.7)<.25){/* a stack of logs waiting for the cart */const x=x0+.3+hash(i*1.9)*.4,z=z0+.3+hash(i*9.1)*.4,y=groundY(x,z),ro=hash(i*3.3)*3.14;
        if(y>waterY+.04)for(let r=0;r<3;r++)for(let q=0;q<3-r;q++){const off=(q-(2-r)/2)*.026;add('logs',x+Math.sin(ro)*off,y+.012+r*.021,z+Math.cos(ro)*off,.12,.024,.024,ro,r===2?0x9a7448:0x8a6440)}}
      n=Math.round(n*grow*grow)}}
    const lod=1;n=Math.round(n*dens*TGS);
    for(let t=0;t<n;t++){const x=x0+.08+hash(i*3.1+t)*.84,z=z0+.08+hash(i*7.7+t)*.84,y=groundY(x,z);if(y<waterY+.05)continue;
      const s=(.62+hash(i*11.3+t)*.5)*near[i]*(grow<1?.4+.6*grow:1),hv=hash(i*5.9+t);
      if(type==='rock'||(type==='mount'&&hv<.45)){if(hv<.6)add(natKit('rock',hv),x,y-.03,z,.08+hv*.25,.06+hv*.16,.08+hv*.2,hv*6,hv<.3?0x8a8378:0x9a9488);continue}
      if(type==='mount'){if(y<shapeH(.8))add('conifer',x,y-.01,z,s*.85,s*.95,s*.85,hv*6,0x2f4a30);continue}
      if((type==='mix'||type==='conifer'||type==='jungle')&&hv<.45&&lod>.5)add('bush',x+.04,y-.01,z+.03,s*.9,s*.7,s*.9,hv*6,type==='jungle'?0x3f6a2a:0x45602e);
      let k=type;if(type==='mix')k=hv<(LK.pixel?(lat<.35?.5:.12):.4)?'conifer':'broad';if(type==='jungle')k=hv<.35?'palm':'broad';if(type==='acacia')k='broad';
      const col=k==='conifer'?(hv<.5?0x2e5434:0x3a6338):k==='palm'?0x5d8a3a:type==='jungle'?(hv<.5?0x2f6a32:0x3d7a35):(hv<.25?0x3a6428:hv<.5?0x46702e:hv<.75?0x527a32:0x5e7f30);
      if(type==='acacia'){const ak=natKit('acacia',hv);if(ak==='broad')add('broad',x,y-.01,z,s*1.2,s*.55,s*1.2,hv*6,0x7a8a3c);else add(ak,x,y-.01,z,s,s,s,hv*6,0x7a8a3c)}else add(k==='broad'?natKit('broad',hv):k,x,y-.01,z,s,s,s,hv*6,col);
      if(hv>.8&&k!=='palm')add('bush',x+.06,y-.01,z+.04,s,s,s,0,0x4f7a36)}}
  /* woodcutters' camps where a town is felling now: a hut, a chopping block and stacked logs; a sawmill with a chimney from the Industrial age */
  for(const nn of nations){if(!nn.alive)continue;for(const c of nn.cities){const L=c._lumber;if(!L||year-L.y>30||occupied.has(L.i))continue;if(TREC)TREC.t=L.i;
    const X=L.i%W,Y=(L.i/W)|0,ax=wx(X),az=wz(Y),dx=c.x-X,dy=c.y-Y,dl=Math.hypot(dx,dy)||1,x=ax+dx/dl*.32,z=az+dy/dl*.32,y=groundY(x,z),ro=Math.atan2(dx,dy);if(y<waterY+.04)continue;
    if(nn.era>=5){add('camp',x,y-.01,z,.14,.06,.08,ro,0x8a7a68);add('camp',x,y+.05,z,.15,.012,.09,ro,0x5a4a3e,.18);add('stump',x+.05,y,z+.02,.008,.12,.008,0,0x6a6866)}
    else{add('camp',x,y-.01,z,.06,.065,.05,ro,0x8a6a48);add('camp',x,y+.058,z,.075,.012,.065,ro,0x5a4028,.3)}
    add('stump',x+.07*Math.cos(ro),y-.004,z-.07*Math.sin(ro),.04,.035,.04,0,0x8a6a44);
    for(let r=0;r<2;r++)for(let q=0;q<4-r;q++){const off=(q-(3-r)/2)*.024,px=x-.07*Math.sin(ro+1.57),pz=z-.07*Math.cos(ro+1.57);add('logs',px+Math.sin(ro)*off,y+.01+r*.02,pz+Math.cos(ro)*off,.11,.022,.022,ro,0x8a6440)}}}
  if(TREC)TREC.t=-1;
  /* the painted countryside: pale stones and pebbles along the river banks */
  if(LK.pixel&&river)for(let i=0;i<N;i++){if(!river[i]||isWater(i)||occupied.has(i))continue;const x0=i%W-W/2,z0=((i/W)|0)-H/2;
    for(let t=0;t<4;t++){const hv=hash(i*9.13+t*3.7);if(hv<.35)continue;const x=x0+.1+hash(i*2.9+t)*.8,z=z0+.1+hash(i*6.7+t*1.3)*.8,y=groundY(x,z);if(y<waterY+.01)continue;
      const sz=.02+hv*.03;add(natKit('rock',hv),x,y-.008,z,sz,sz*.6,sz*.8,hv*6,hv<.6?0x9a958a:0xb0aa9c)}}
  /* hedgerows along field edges and orchards near villages */
  if(dens>.4)for(const i of fieldTiles){const X=i%W,Y=(i/W)|0;for(let d=0;d<4;d++){const nx=X+DX[d],ny=Y+DY[d];if(nx<0||ny<0||nx>=W||ny>=H)continue;const j=ny*W+nx;if(fieldTiles.has(j)||hash(i*7+d)<.5)continue;
    for(let q=0;q<9;q++){if(hash(i*17+d*3+q)<.2)continue;const t=(q+.5)/9+(hash(i*5+q)-.5)*.06,ex=wx(X)+(DX[d]?DX[d]*.48:t-.5),ez=wz(Y)+(DY[d]?DY[d]*.48:t-.5),ey=groundY(ex,ez);if(ey<waterY+.04)continue;
      const hs=hash(i*13+d*5+q),f=near[i];if(hs<.14)add(natKit('broad',hs),ex,ey-.01,ez,(.4+hs)*f,(.42+hs)*f,(.4+hs)*f,q,0x4f7a36);else add('bush',ex,ey-.01,ez,(.5+hs*.3)*f,(.45+hs*.4)*f,(.5+hs*.3)*f,q,hs<.6?0x456f32:0x557a3a)}}}
  for(const n of nations){if(!n.alive||n.era<2)continue;for(const c of n.cities){for(let q=0;q<2;q++){const a=hash(c.x*31+c.y*7+q)*6.283,X=Math.round(c.x+Math.cos(a)*1.6),Y=Math.round(c.y+Math.sin(a)*1.6);
    if(X<0||Y<0||X>=W||Y>=H)continue;const j=Y*W+X;if(owner[j]!==n.id||occupied.has(j)||fieldTiles.has(j)||biome[j]!==4||hash(j*1.7)>.5)continue;
    for(let gx=0;gx<4;gx++)for(let gz=0;gz<4;gz++){const ox=wx(X)-.3+gx*.2,oz=wz(Y)-.3+gz*.2,oy=groundY(ox,oz);if(oy>waterY+.04)add(natKit('broad',(gx*4+gz)/16+.03),ox,oy-.01,oz,.24,.22,.24,gx+gz,0x5e8f3a)}}}}
  kitCommit(TREE_KITS);
}

/* ---------- people: articulated figures with era clothing, tools and simple animation ---------- */
let walkers=[];
const SKIN=[0xf1c6a0,0xd9a07a,0xa86e4b,0x7a4a30,0xe8b890,0xc68c64];
const FHAIR=[0x2a1d14,0x3b2a1c,0x5a3c22,0x8a6a3a,0xc9a45a,0x1a1a1a,0x6e3a1e,0x9a9a96];
/* clothing by era: [tops, bottoms, hats(null = bare)] */
const CLOTH=[
  {top:[0x8a6a48,0x7a5a3a,0x9a7a52,0x6e5236],bot:[0x6e5236,0x5a4630],dress:[0x8a6a48,0x7a5a3a],hat:[null]},
  {top:[0xe8e0cc,0xd8c8a0,0xb8743a,0x9a4a2e,0x3a4a7a],bot:[0x7a6248,0xe8e0cc],dress:[0xe8e0cc,0xc0603a,0x5a6a9a],hat:[null,null,'cap']},
  {top:[0xe8e0cc,0xc0603a,0x8a3a3a,0x4a5a8a,0xb89a5a],bot:[0x6a5238,0xd8ccb0],dress:[0xe8e0cc,0x9a3a3a,0x4a5a8a,0xd8b060],hat:[null,null,'cap']},
  {top:[0x5a6a3a,0x7a3a2a,0x3a4a6a,0x6a5236,0x8a7a5a,0x4a3a2a],bot:[0x4a3a2a,0x5a5040,0x3a3a3a],dress:[0x6a3a3a,0x3a4a6a,0x5a6a3a,0x8a7a5a],hat:[null,'hood','hood','straw']},
  {top:[0x2a3a5a,0x6a2a2a,0x3a5a3a,0x6a5236,0xd8d0c0],bot:[0xd8d0c0,0x4a3a2a,0x2a2a2a],dress:[0x7a3a4a,0x3a5a7a,0xd8c8a8,0x5a6a4a],hat:[null,'tricorn','tricorn','straw']},
  {top:[0x2a2a2e,0x4a4a48,0x5a4a3a,0x3a3a4a,0x6a6a62],bot:[0x2a2a2e,0x3a3a3a,0x4a4038],dress:[0x2a2a3a,0x4a3a3a,0x3a4a4a],hat:[null,'cap','bowler','top']},
  {top:[0xd84a3a,0x3a7ac8,0xe8e8e8,0x2a2a2a,0x5ab05a,0xe8c040,0x8a4ab0],bot:[0x3a5a8a,0x2a3a5a,0x4a4a4a,0xc8b890],dress:[0xd84a6a,0x3a9ac8,0xe8d040,0x2a2a2a],hat:[null,null,null,'cap']},
  {top:[0xe8eef2,0xb8c8d0,0x3ab0b0,0x8a9aa8],bot:[0xd0d8e0,0x5a6a78],dress:[0xe8eef2,0x3ab0b0],hat:[null,null,'visor']}];
const limbGeo=(w,l,d)=>{const g=new THREE.BoxGeometry(w,l,d);g.translate(0,-l/2,0);return g};
const upGeo=g=>{g.computeBoundingBox();g.translate(0,-g.boundingBox.min.y,0);return g};
const figMat=stdMat({roughness:.8});
const limbCyl=(t,b)=>{const g=new THREE.CylinderGeometry(t,b,1,7);g.translate(0,-.5,0);return g};
kit('pLeg',limbCyl(.5,.42),figMat,5200,false);kit('pArm',limbCyl(.5,.4),figMat,5200,false);kit('pShin',limbCyl(.44,.36),figMat,5200,false);
kit('pShoe',(()=>{const g=new THREE.SphereGeometry(.5,7,4,0,Math.PI*2,0,Math.PI/2);g.translate(0,0,.12);return g})(),figMat,5200,false);
kit('pHand',new THREE.SphereGeometry(.5,6,4),figMat,5200,false);
/* a torso with hips, a waist, a chest and rounded shoulders */
kit('pTorso',new THREE.LatheGeometry([[0,0],[.46,0],[.47,.16],[.41,.44],[.47,.68],[.5,.8],[.42,.95],[.2,1.02],[0,1.03]].map(p=>new THREE.Vector2(p[0],p[1])),10),figMat,2600,false);
kit('pHead',new THREE.SphereGeometry(.5,10,8),figMat,2600,false);
kit('pHair',new THREE.SphereGeometry(.5,10,6,0,Math.PI*2,0,Math.PI*.55),figMat,2600,false);
kit('pSkirt',(()=>{const g=new THREE.CylinderGeometry(.35,.62,1,10,1,true);g.translate(0,-.5,0);return g})(),stdMat({roughness:.85,side:THREE.DoubleSide}),1200,false);
kit('pCone',upGeo(new THREE.ConeGeometry(.5,1,10)),figMat,2600,false);kit('pBrim',new THREE.CylinderGeometry(.5,.5,1,12),figMat,1200,false);
kit('pTri',upGeo(new THREE.ConeGeometry(.5,1,3)),figMat,600,false);
kit('pStick',limbGeo(1,1,1),figMat,2600,false);kit('pPack',new THREE.BoxGeometry(1,1,1),figMat,2600,false);
kit('pGondola',unitBox(),figMat,400,false);
kit('pShield',(()=>{const g=new THREE.CylinderGeometry(.5,.5,1,12);g.rotateZ(Math.PI/2);return g})(),figMat,1800,false);
const FIG_KITS=['pGondola','pLeg','pArm','pShin','pShoe','pHand','pTorso','pHead','pHair','pSkirt','pCone','pBrim','pTri','pStick','pPack','pShield'];
/* add with heading (ry) then a swing around the local x axis (rx) and a sideways lean (rz) */
const dummyR=new THREE.Object3D();dummyR.rotation.order='YXZ';
function addR(name,x,y,z,sx,sy,sz,ry,rx,rz,hex){const K=KITS[name];if(K.k>=K.cap&&!kitGrow(K,K.k+1))return;if(SJ)sjTouch(name,K);
  dummyR.position.set(x,y,z);dummyR.rotation.set(rx||0,ry||0,rz||0);dummyR.scale.set(sx,sy,sz);dummyR.updateMatrix();
  K.mesh.setMatrixAt(K.k,dummyR.matrix);K.mesh.setColorAt(K.k,tmpC.set(hex).convertSRGBToLinear());K.k++}
function dressFolk(w,n){const e=n.era,C=CLOTH[e],r=mulberry32(w.seed),pk=a=>a[(r()*a.length)|0];
  w.fem=r()<.5;w.kid=r()<.14;w.skin=pk(SKIN);w.hair=e>=5&&r()<.15?0x9a9a96:pk(FHAIR);w.top=r()<.18?parseInt(n.color.slice(1),16):pk(C.top);w.bot=pk(C.bot);
  w.dress=w.fem&&(e<6||r()<.4)?pk(C.dress):0;w.hat=w.kid?null:pk(C.hat);w.hatCol=w.hat==='straw'?0xd8c078:w.hat==='hood'?w.top:w.hat==='visor'?0x9ad8e8:0x2a2420;
  w.pack=!w.kid&&r()<(e<5?.3:.12)?(e<3?0x8a6a3a:e<6?0x9a7a4a:0x3a4a5a):0;w.shoe=e===0?w.skin:e>=7?0xd8dee4:pk([0x2a2018,0x3a2a1c,0x4a3424,0x1e1a18]);w.tool=!w.kid&&!w.fem&&r()<.25&&e<5;w.long=w.fem&&r()<.6;w.era=e}
function soldierKit(w,n){const e=n.era,nc=parseInt(n.color.slice(1),16);w.top=e<=1?0x7a5a3a:e<=3?nc:e===4?nc:e===5?(r=>r)(0x5a5a3a):e===6?0x4a5a3a:0xd8dee4;
  w.bot=e===4?0xe8e0d0:e>=5&&e<7?0x4a4a3a:e===7?0xc8ced4:0x5a4630;w.dress=0;w.pack=e>=5?0x4a4a32:0;w.hat=e<=1?null:e<=3?'helm':e===4?'tricorn':e===7?'visor':'helm';w.hatCol=e<=3?0x9aa0a8:e===4?0x1a1a1a:e===7?0x9ad8e8:0x4a5038;w.kid=false;w.fem=false;w.uni=e}
function cityPoint(c,near,fest){const P_=c._poi;if(!P_||!P_.pts.length){const a=rng()*6.28,r=.08+rng()*.25;return[wx(c.x)+Math.cos(a)*r,wz(c.y)+Math.sin(a)*r]}
  if(rng()<(fest?.75:.25)){const a=rng()*6.28,r=rng()*P_.r*.8;return[P_.plaza[0]+Math.cos(a)*r,P_.plaza[1]+Math.sin(a)*r]}
  for(let q=0;q<6;q++){const p=P_.pts[(rng()*P_.pts.length)|0];if(!near||Math.hypot(p[0]-near[0],p[1]-near[1])<.6)return[p[0]+(rng()-.5)*.02,p[1]+(rng()-.5)*.02]}
  const p=P_.pts[(rng()*P_.pts.length)|0];return[p[0],p[1]]}
function fieldPoint(c){const cx=c.x,cy=c.y;for(let q=0;q<10;q++){const X=cx+((rng()*5)|0)-2,Y=cy+((rng()*5)|0)-2;if(X<0||Y<0||X>=W||Y>=H)continue;const j=Y*W+X;if(fieldTiles.has(j))return[wx(X)+(rng()-.5)*.7,wz(Y)+(rng()-.5)*.7]}return null}
function updateWalkers(dt,yrs){
  if(!settings.people){for(const k of FIG_KITS)KITS[k].mesh.count=0;return}
  const cap=settings.quality==='high'?900:settings.quality==='medium'?550:250;
  /* towns near the camera fill up with people: walkers far away move to the town you are looking at */
  if(camDist<16&&(updateWalkers._t=(updateWalkers._t||0)-dt)<=0){updateWalkers._t=.4;const RR=(camDist*1.2+2)**2,loc=[];
    for(const n of nations){if(!n.alive||n.era<1)continue;for(const c of n.cities){const ex=wx(c.x)-camT.x,ez=wz(c.y)-camT.z;if(ex*ex+ez*ez<RR)loc.push([n,c])}}
    if(loc.length){const have=new Map();for(const w of walkers)have.set(w.ci,(have.get(w.ci)||0)+1);
      for(const [n,c] of loc){const want=Math.min(90,Math.round(Math.sqrt(n.pop/Math.max(1,n.cities.length))*2.4*(settings.quality==='low'?.5:1)));let h=have.get(c)||0;
        for(let q=0;q<8&&h<want;q++){let w=null;
          if(walkers.length<cap){w={x:0,z:0,wait:rng()*2,sol:false,t:rng()*10,ph:rng()*6,dir:rng()*6.28,act:'idle',seed:(rng()*1e9)|0};walkers.push(w)}
          else{for(let t=0;t<12;t++){const v=walkers[(rng()*walkers.length)|0];if(v.sol||loc.some(l=>l[1]===v.ci))continue;w=v;break}if(!w)break;const on=nations[w.nid];if(on)on._walk=(on._walk||1)-1}
          const p=cityPoint(c);w.nid=n.id;w.ci=c;w.x=w.tx=p[0];w.z=w.tz=p[1];w.wait=rng()*2;w.moving=false;w.sheaf=false;dressFolk(w,n);n._walk=(n._walk||0)+1;h++}
        have.set(c,h)}}}
  for(const n of nations){if(!n.alive||!n.cities.length)continue;
    const want=Math.min(80,Math.round(Math.sqrt(n.pop)*1.1)),have=n._walk||0;
    if(have<want&&walkers.length<cap&&rng()<.3){const c=n.cities[(rng()*n.cities.length)|0],p=cityPoint(c);
      const w={nid:n.id,ci:c,x:p[0],z:p[1],tx:p[0],tz:p[1],wait:rng()*2,sol:false,t:rng()*10,ph:rng()*6,dir:rng()*6.28,act:'idle',seed:(rng()*1e9)|0};dressFolk(w,n);walkers.push(w);n._walk=have+1}}
  for(let k=walkers.length-1;k>=0;k--){const w=walkers[k],n=nations[w.nid];
    if(!n||!n.alive||!n.cities.length){walkers.splice(k,1);if(n)n._walk--;continue}
    if(w.era!==n.era&&!w.sol)dressFolk(w,n);
    w.t+=dt;
    if(w.wait>0){w.wait-=dt;if(w.wait<=0){
        const wasSol=w.sol;w.sol=n.wars.size>0&&n.front&&n.front.length>0&&rng()<.45;if(w.sol)soldierKit(w,n);else if(wasSol)dressFolk(w,n);
        const c=n.cities.includes(w.ci)?w.ci:n.cities[(rng()*n.cities.length)|0];w.ci=c;
        if(w.sol){const f=n.front[(rng()*n.front.length)|0];w.tx=wx(f%W)+(rng()-.5)*.6;w.tz=wz((f/W)|0)+(rng()-.5)*.6;w.act='march'}
        else{const sn=typeof seasonName==='function'&&settings.seasons!==false?seasonName():'Summer',night=typeof nightF!=='undefined'&&nightF>.55;
          if(w.sheaf){w.sheaf=false;w.pack=w._pk||0}
          if(w.act==='farm'&&sn==='Autumn'&&!w.kid){w._pk=w.pack;w.pack=0xd8b860;w.sheaf=true}
          const fp=!night&&!w.kid&&n.era>=1&&n.era<6&&rng()<({Spring:.35,Summer:.3,Autumn:.5,Winter:.04}[sn]||.3)?fieldPoint(c):null;
          if(night&&rng()<.75){const p=cityPoint(c,[w.x,w.z]);w.tx=p[0];w.tz=p[1];w.act='home'}
          else if(fp){w.tx=fp[0];w.tz=fp[1];w.act='farm'}else{const p=cityPoint(c,[w.x,w.z],n.festival>0);w.tx=p[0];w.tz=p[1];w.act=rng()<.5?'chat':'idle'}}}
      continue}
    const dx=w.tx-w.x,dz=w.tz-w.z,d=Math.hypot(dx,dz),spd=(w.sol?.15:w.kid?.14:.11)*(.85+Math.min(3,yrs/dt||1)*.15),sp=spd*dt;
    if(d<.012){w.wait=w.act==='home'?8+rng()*10:w.act==='farm'?3+rng()*4:w.sol?.6+rng()*1.6:w.act==='chat'?1+rng()*2.2:.3+rng()*1.4;w.moving=false;
      if(w.sol&&n.wars.size&&rng()<.45){const gy=groundY(w.x,w.z),fx=w.x+Math.sin(w.dir)*.02,fz=w.z+Math.cos(w.dir)*.02;
        if(n.era>=4){emit('flash',fx,gy+.022,fz,0,0);for(let q=0;q<3;q++)emit('smoke',fx+(rng()-.5)*.02,gy+.025,fz+(rng()-.5)*.02);if(typeof sfx==='function'&&Math.hypot(w.x-camT.x,w.z-camT.z)<camDist*.6)sfx('cannon',{near:.25})}
        else emit('dust',w.x,gy+.01,w.z);
        if(rng()<.25){emit('dust',w.x,gy+.01,w.z);walkers.splice(k,1);n._walk--;continue}}continue}
    let nx=w.x+dx/d*Math.min(sp,d),nz=w.z+dz/d*Math.min(sp,d);
    /* people walk round houses, gardens and walls instead of through them */
    if(inBuilding(nx,nz)&&!inBuilding(w.x,w.z)){let ok=false;const a0=Math.atan2(dz,dx),st=Math.min(sp,d);
      for(const da of [.7,-.7,1.4,-1.4,2.1,-2.1]){const ax=w.x+Math.cos(a0+da)*st,az=w.z+Math.sin(a0+da)*st;if(!inBuilding(ax,az)&&groundY(ax,az)>=waterY+.01){nx=ax;nz=az;ok=true;break}}
      if(!ok){if(d<.09&&(w.act==='home'||inBuilding(w.tx,w.tz))){w.x=w.tx;w.z=w.tz;w.moving=false;w.wait=w.act==='home'?6+rng()*8:.5;continue}
        const c2=w.ci&&n.cities.includes(w.ci)?w.ci:n.cities[0];const p2=c2?cityPoint(c2,[w.x,w.z]):null;if(p2&&!inBuilding(p2[0],p2[1])){w.tx=p2[0];w.tz=p2[1]}else{w.tx=w.x;w.tz=w.z;w.wait=.3+rng()*.5}continue}}
    if(groundY(nx,nz)<waterY+.01){w.wait=.3;w.tx=w.x;w.tz=w.z;continue}
    w.x=nx;w.z=nz;w.moving=true;const td=Math.atan2(dx,dz);let dd=td-w.dir;dd=Math.atan2(Math.sin(dd),Math.cos(dd));w.dir+=dd*Math.min(1,dt*10);w.ph+=Math.min(sp,d)*(w.kid?620:480)}
  if(typeof MODEL_KITS==='function'&&updateWalkers.v!==MDL_VER){updateWalkers.v=MDL_VER;updateWalkers.pk=MODEL_KITS().filter(n=>/^m_(male|female|knight)/.test(n))}kitReset(FIG_KITS);if(updateWalkers.pk)kitReset(updateWalkers.pk);
  if(camDist<16)updateGondolas(dt,(camDist*1.2+1.5)**2);
  if(camDist<16){const R2=(camDist*1.2+1.5)**2;
    for(const w of walkers){const ex=w.x-camT.x,ez=w.z-camT.z;if(ex*ex+ez*ez>R2)continue;if(w.act==='home'&&w.wait>0&&!w.moving)continue;drawFolk(w)}
    if(typeof drawArmyFolk==='function')drawArmyFolk(R2)}
  kitCommit(FIG_KITS);if(updateWalkers.pk&&updateWalkers.pk.length)mcommit(updateWalkers.pk);
}
/* is this point inside a house, its garden or a wall? */
function inBuilding(x,z){const L=FOOT.get(Math.floor(x/FCELL)*100003+Math.floor(z/FCELL));if(!L)return false;
  for(const q of L){if(q.t!=='house'&&q.t!=='wall'&&q.t!=='tower')continue;const dx=x-q.x,dz=z-q.z,lx=dx*q.c-dz*q.s,lz=dx*q.s+dz*q.c;if(Math.abs(lx)<q.hw&&Math.abs(lz)<q.hd)return true}return false}
/* gondolas glide up and down the canals of lagoon towns, a gondolier at the stern */
let gondolas=[];
function updateGondolas(dt,R2){
  for(let i=gondolas.length-1;i>=0;i--){const g=gondolas[i];if(!g.c._canals||!g.c._canals[g.r]||g.c._canals[g.r].length<2||(wx(g.c.x)-camT.x)**2+(wz(g.c.y)-camT.z)**2>R2*1.6)gondolas.splice(i,1)}
  for(const n of nations){if(!n.alive)continue;for(const c of n.cities){if(!c._canals||!c._canals.length)continue;const ex=wx(c.x)-camT.x,ez=wz(c.y)-camT.z;if(ex*ex+ez*ez>R2)continue;
    const runs=c._canals.map((r,i)=>[r,i]).filter(([r])=>r.length>=2);const have=gondolas.filter(g=>g.c===c).length;
    for(let q=have;q<Math.min(6,runs.length*2);q++){const [r,ri]=runs[q%runs.length];const w={x:0,z:0,dir:0,t:rng()*10,ph:0,act:'idle',moving:false,seed:(rng()*1e9)|0};dressFolk(w,n);w.kid=false;w.dress=0;w.hat='straw';w.hatCol=0x1a1a1a;w.top=0xf2f2f2;w.bot=0x1a1a1a;
      gondolas.push({c,r:ri,s:rng()*(r.length-1),v:(rng()<.5?1:-1)*(.35+rng()*.3),w})}}}
  const wy=waterY+.004;
  for(const g of gondolas){const r=g.c._canals[g.r];g.s+=g.v*dt;if(g.s<=0){g.s=0;g.v=Math.abs(g.v)}if(g.s>=r.length-1){g.s=r.length-1.001;g.v=-Math.abs(g.v)}
    const i=Math.floor(g.s),f=g.s-i,a=r[i],b=r[Math.min(r.length-1,i+1)],x=a[0]+(b[0]-a[0])*f,z=a[1]+(b[1]-a[1])*f,h=Math.atan2(b[0]-a[0],b[1]-a[1])+(g.v<0?Math.PI:0);
    addR('pGondola',x,wy,z,.014,.008,.075,h,0,0,0x141414);addR('pGondola',x+Math.sin(h)*.036,wy+.006,z+Math.cos(h)*.036,.004,.012,.006,h,-.4,0,0x141414);
    const sx=x-Math.sin(h)*.028,sz=z-Math.cos(h)*.028,w=g.w;w.x=sx;w.z=sz;w.y=wy+.008;w.dir=h;w.t+=dt;drawFolk(w);
    addR('pStick',sx+Math.cos(h)*.008,wy+.04,sz-Math.sin(h)*.008,.0012,.06,.0012,h,.35+Math.sin(w.t*1.6)*.15,0,0x6a4a2a)}}
function drawFolk(w){
  const sc=w.kid?.68:1,ry=w.dir,c=Math.cos(ry),s=Math.sin(ry),gy=w.y??groundY(w.x,w.z);
  /* seated people (in boats) are always drawn as figures: the people models only stand */
  if(typeof drawFolkModel==='function'&&!w.sit&&drawFolkModel(w,gy))return;
  const L=(lx,ly,lz)=>[w.x+lx*c+lz*s,gy+ly,w.z-lx*s+lz*c];
  let leg=0,arm=0,bend=0,armR=0,bob=0,lean=0;
  if(w.moving){leg=Math.sin(w.ph)*.7;arm=-leg*.9;bob=Math.abs(Math.cos(w.ph))*.0016*sc}
  else if(w.act==='farm'&&w.wait>0){bend=.55;const q=Math.sin(w.t*5);armR=-.9-q*.5;arm=armR}
  else if(w.act==='fish'){arm=w.armR??-1.25;armR=arm;lean=Math.sin(w.t*.4)*.02}
  /* in a boat: pulling on the oars, a paddle stroke, or hauling in the net hand over hand */
  else if(w.act==='row'){const q=Math.sin(w.t*3);arm=armR=-1.15-q*.45;bend=.12+q*.14}
  else if(w.act==='paddle'){const q=Math.sin(w.t*4);arm=-1.1+q*.5;armR=-.7-q*.5;bend=.18}
  else if(w.act==='haul'){const q=Math.sin(w.t*2.6);arm=-1.35+q*.35;armR=-1.35-q*.35;bend=.32+Math.abs(q)*.1}
  else if(w.act==='chat'&&w.wait>0){arm=Math.sin(w.t*2.3)*.12;armR=-.35+Math.sin(w.t*3.1)*.3;lean=Math.sin(w.t*.7)*.05}
  else{arm=Math.sin(w.t*1.3)*.05}
  if(w.sol&&w.moving)armR=-.15;
  const legL=.0165*sc,hipY=w.sit?legL*.42:legL+bob,hx=.0026*sc;
  const lw=.0044*sc,ld=.0048*sc,th=legL*.52,shn=legL*.5,sw=w.moving?1:0,legCol=w.dress&&w.long?0x3a2a1a:w.bot;
  /* two-part legs: the knee bends as the foot swings forward, and the shoe follows */
  for(const sd of [-1,1]){const a=w.sit?-1.45:sd<0?leg:-leg,kb=w.sit?1.25:sw*Math.max(0,(sd<0?-1:1)*Math.cos(w.ph))*.85+bend*.5,a2=a+kb;/* seated: thighs forward, shins down */
    const ky=hipY-Math.cos(a)*th,kz=-Math.sin(a)*th,ay=ky-Math.cos(a2)*shn,az=kz-Math.sin(a2)*shn;
    addR('pLeg',...L(sd*hx,hipY,0),lw,th+.0006,ld,ry,a,0,legCol);addR('pShin',...L(sd*hx,ky,kz),lw,shn,ld,ry,a2,0,legCol);
    addR('pShoe',...L(sd*hx,Math.max(0,ay-.0008),az+.0008),lw*1.15,.0034*sc,.0072*sc,ry,0,0,w.shoe||0x2a2018)}
  const tl=.0125*sc,tw=.0105*sc,cb=Math.cos(bend),sb=Math.sin(bend);
  addR('pTorso',...L(0,hipY-.001,0),tw,tl+.001,tw*.62,ry,bend,lean,w.top);
  if(w.dress)addR('pSkirt',...L(0,hipY+.0015,sb*.002),tw*1.05,w.long?hipY-.001:hipY*.45,tw*.95,ry,bend*.3,0,w.dress);
  else if(w.uni===4)addR('pSkirt',...L(0,hipY+.001,0),tw*1.02,.006*sc,tw*.8,ry,0,0,w.top);
  const sh=(f)=>L(0,hipY+cb*tl*f,sb*tl*f),shY=hipY+cb*tl*.9,shZ=sb*tl*.9,ax=tw*.6;
  const aL=.0122*sc,aw=.0034*sc;
  addR('pArm',...L(-ax,shY,shZ),aw,aL,aw,ry,arm-bend*.3,.06,w.top);addR('pArm',...L(ax,shY,shZ),aw,aL,aw,ry,(armR||-arm)-bend*.3,-.06,w.top);
  for(const [sd,sa] of [[-1,arm],[1,armR||-arm]]){const a=sa-bend*.3;addR('pHand',...L(sd*ax*1.04,shY-Math.cos(a)*aL,shZ-Math.sin(a)*aL),aw*1.15,aw*1.25,aw*1.15,ry,0,0,w.skin)}
  const hr=.0092*sc,hp=L(0,hipY+cb*(tl+hr*.48),sb*(tl+hr*.48));
  addR('pHead',hp[0],hp[1],hp[2],hr*.92,hr,hr*.95,ry,0,0,w.skin);
  const hat=w.hat;
  if(!hat||hat==='cap')addR('pHair',hp[0],hp[1]+hr*.06,hp[2],hr*1.04,hr*1.04,hr*1.04,ry,-.25,0,w.hair);
  if(w.fem&&w.long&&!hat)addR('pPack',...L(0,hipY+tl*.82,-.0035*sc),hr*.7,hr*.9,hr*.3,ry,bend,0,w.hair);
  if(hat==='cap')addR('pBrim',...L(0,hp[1]-gy+hr*.38,hr*.22),hr*1.05,hr*.12,hr*1.15,ry,0,0,w.hatCol);
  else if(hat==='hood')addR('pCone',hp[0],hp[1]-hr*.15,hp[2],hr*1.25,hr*1.5,hr*1.25,ry,-.15,0,w.hatCol);
  else if(hat==='straw'){addR('pBrim',hp[0],hp[1]+hr*.35,hp[2],hr*2.2,hr*.1,hr*2.2,ry,0,0,w.hatCol);addR('pCone',hp[0],hp[1]+hr*.35,hp[2],hr*1.1,hr*.6,hr*1.1,ry,0,0,w.hatCol)}
  else if(hat==='tricorn'){addR('pTri',hp[0],hp[1]+hr*.25,hp[2],hr*2,hr*.5,hr*2,ry+Math.PI/3,0,0,w.hatCol);addR('pHair',hp[0],hp[1]+hr*.1,hp[2],hr*1.04,hr*.8,hr*1.04,ry,0,0,0xe8e4dc)}
  else if(hat==='bowler'){addR('pBrim',hp[0],hp[1]+hr*.3,hp[2],hr*1.5,hr*.08,hr*1.5,ry,0,0,w.hatCol);addR('pHair',hp[0],hp[1]+hr*.32,hp[2],hr*1.02,hr*1.2,hr*1.02,ry,0,0,w.hatCol)}
  else if(hat==='top'){addR('pBrim',hp[0],hp[1]+hr*.3,hp[2],hr*1.5,hr*.08,hr*1.5,ry,0,0,w.hatCol);addR('pBrim',hp[0],hp[1]+hr*.85,hp[2],hr*1,hr*1.1,hr*1,ry,0,0,w.hatCol)}
  else if(hat==='helm')addR('pHair',hp[0],hp[1]+hr*.12,hp[2],hr*1.12,hr*1.12,hr*1.12,ry,0,0,w.hatCol);
  else if(hat==='visor'){addR('pHair',hp[0],hp[1]+hr*.06,hp[2],hr*1.15,hr*1.15,hr*1.15,ry,0,0,0xe8eef2);addR('pPack',...L(0,hp[1]-gy,hr*.45),hr*.9,hr*.35,hr*.2,ry,0,0,w.hatCol)}
  if(w.pack)addR('pPack',...L(0,hipY+tl*.55,-tw*.42),tw*.8,tl*.6,tw*.42,ry,bend,0,w.pack);
  const hand=(side,sw)=>{const a=sw-bend*.3;return L(side*ax,shY-Math.cos(a)*aL,shZ-Math.sin(a)*aL)};
  if(w.sol){const e=w.uni,h=hand(1,armR||-arm);
    if(e<=3){addR('pStick',h[0],h[1]+.03*sc,h[2],.0012,.05,.0012,ry,.08,0,0x6a4a2a);addR('pCone',h[0],h[1]+.03*sc,h[2],.0028,.006,.0028,ry,.08,0,0xb8bcc0);
      const g=hand(-1,arm);addR('pShield',...L(-ax-.003,shY-aL*.6,shZ+.002),.002,.012,.012,ry,0,0,w.shieldCol??(e<=1||!nations[w.nid]?0x8a6a3a:parseInt(nations[w.nid].color.slice(1),16)))}
    else addR('pStick',h[0],h[1]+.016,h[2],.0016,.03,.0016,ry,.35,0,e===7?0xd8dee4:0x3a2a1e)}
  else if(w.act==='farm'&&!w.moving){const h=hand(1,armR);addR('pStick',h[0],h[1]+.012,h[2],.0011,.026,.0011,ry,armR+1.9,0,0x7a5a3a)}
  else if(w.tool){const h=hand(1,armR||-arm);addR('pStick',h[0],h[1]+.02,h[2],.0011,.03,.0011,ry,-.2,0,0x7a5a3a)}
}

let caravans=[];
function landPath(a,b){const ax=wx(a.x),az=wz(a.y),bx=wx(b.x),bz=wz(b.y);for(let q=1;q<10;q++){const x=lerp(ax,bx,q/10),z=lerp(az,bz,q/10);if(groundY(x,z)<waterY+.03)return null}return[ax,az,bx,bz]}
function updateCaravans(dt,k){
  if(k>0&&caravans.length<80&&rng()<dt*2.5){const al=nations.filter(n=>n.alive&&n.trade&&n.trade.length&&n.cities[0]);if(al.length){const n=al[(rng()*al.length)|0],m=nations[n.trade[(rng()*n.trade.length)|0]];
    if(m&&m.alive&&m.cities[0]&&n.nb.has(m.id)){const p=landPath(n.cities[0],m.cities[0]);if(p&&Math.hypot(p[0]-camT.x,p[1]-camT.z)<camDist*2.5)caravans.push({p,t:0,len:Math.hypot(p[2]-p[0],p[3]-p[1]),col:n.color,era:n.era,car:[0xc0392b,0x2e6fb0,0xe8e2d4,0x2a2a2a,0xe0b030][(rng()*5)|0]})}}}
  kitReset(['cart','cartTop','car']);
  for(let q=caravans.length-1;q>=0;q--){const c=caravans[q];c.t+=dt*k*.35/Math.max(1,c.len);if(c.t>=1){caravans.splice(q,1);continue}
    const x=lerp(c.p[0],c.p[2],c.t),z=lerp(c.p[1],c.p[3],c.t),y=groundY(x,z),rot=Math.atan2(c.p[2]-c.p[0],c.p[3]-c.p[1]);
    if(c.era>=5){const ox=Math.cos(rot)*.035,oz=-Math.sin(rot)*.035;if(typeof drawCarModel==='function'&&drawCarModel(c,x+ox,y+.002,z+oz,rot))continue;add('car',x+ox,y+.006,z+oz,.028,.02,.05,rot,c.car);add('car',x+ox,y+.024,z+oz,.024,.012,.026,rot,0x9ab0c0);continue}
    add('cart',x,y+.01,z,.035,.022,.06,rot,0x6b4a2e);add('cartTop',x,y+.035,z,.034,.03,.05,rot+Math.PI/2,0xeee6d2);
    if(!(typeof addV==='function'&&addV('donkey',x+Math.sin(rot)*.06,y,z+Math.cos(rot)*.06,rot)))add('body',x+Math.sin(rot)*.06,y,z+Math.cos(rot)*.06,.02,.025,.04,rot,0x7a5a3a)}
  kitCommit(['cart','cartTop','car'])}

/* ---------- particles: smoke, fire, foam, clouds ---------- */
const MAXP=2200;
const pGeo=new THREE.BufferGeometry();
pGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(MAXP*3),3));
pGeo.setAttribute('aSize',new THREE.BufferAttribute(new Float32Array(MAXP),1));
pGeo.setAttribute('aAlpha',new THREE.BufferAttribute(new Float32Array(MAXP),1));
pGeo.setAttribute('aColor',new THREE.BufferAttribute(new Float32Array(MAXP*3),3));
const pU={map:{value:TX.soft},uScale:{value:500},uNight:{value:0},uPL:PLU.uPL,uPE:PLU.uPE};
const pMat=new THREE.ShaderMaterial({uniforms:pU,transparent:true,depthWrite:false,
  vertexShader:`attribute float aSize;attribute float aAlpha;attribute vec3 aColor;varying float vA;varying vec3 vC;uniform float uScale;
  void main(){vA=aAlpha;vC=aColor;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=aSize*uScale/-mv.z;gl_Position=projectionMatrix*mv;}`,
  fragmentShader:TOSCENE+`uniform sampler2D map;uniform float uNight;varying float vA;varying vec3 vC;void main(){vec4 t=texture2D(map,gl_PointCoord);gl_FragColor=vec4(toScene(vC*(1.-uNight*.6)),t.a*vA);}`});
const pts=new THREE.Points(pGeo,pMat);pts.frustumCulled=false;pts.renderOrder=5;scene.add(pts);
/* glowing particles (flames, embers, muzzle flashes) are drawn additively so they light up the night */
const GLOWK={fire:1,ember:1,glow:1,flash:1};
const gGeo=new THREE.BufferGeometry();for(const [a,n] of [['position',3],['aSize',1],['aAlpha',1],['aColor',3]])gGeo.setAttribute(a,new THREE.BufferAttribute(new Float32Array(MAXP*n),n));
const gMat=new THREE.ShaderMaterial({uniforms:pU,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:pMat.vertexShader,fragmentShader:TOSCENE+`uniform sampler2D map;varying float vA;varying vec3 vC;void main(){vec4 t=texture2D(map,gl_PointCoord);gl_FragColor=vec4(toScene(vC)*t.a*vA,1.);}`});
const gPts=new THREE.Points(gGeo,gMat);gPts.frustumCulled=false;gPts.renderOrder=6;scene.add(gPts);
const fireLight=new THREE.PointLight(0xff8a3a,0,3.5,2);scene.add(fireLight);
kit('flameFx',(()=>{const g=new THREE.ConeGeometry(.5,1,7,1,true);g.translate(0,.5,0);return g})(),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,side:THREE.DoubleSide}),900,false);
KITS.flameFx.mesh.renderOrder=6;
let parts=[];
const PK={smoke:{life:3.2,size:.16,grow:.35,vy:.16,col:[.62,.62,.6],a:.5},dark:{life:4,size:.2,grow:.45,vy:.2,col:[.28,.27,.26],a:.6},
  fire:{life:.8,size:.13,grow:-.06,vy:.32,col:[1,.6,.2],a:.85},ember:{life:2.2,size:.022,grow:-.01,vy:.45,col:[1,.62,.22],a:1},glow:{life:1.1,size:.55,grow:.1,vy:.02,col:[1,.42,.12],a:.32},flash:{life:.12,size:.06,grow:.05,vy:0,col:[1,.85,.5],a:1},foam:{life:1.2,size:.07,grow:.06,vy:0,col:[.95,.97,1],a:.7},
  rain:{life:.55,size:.035,grow:0,vy:-6.5,col:[.72,.78,.88],a:.55},snow:{life:4,size:.05,grow:0,vy:-.85,col:[1,1,1],a:.9},
  miasma:{life:4,size:.45,grow:.6,vy:.03,col:[.56,.64,.4],a:.22},
  spray:{life:.6,size:.02,grow:.01,vy:.18,col:[.85,.92,1],a:.8},
  dust:{life:1.4,size:.25,grow:.4,vy:.05,col:[.6,.5,.38],a:.45},spark:{life:1.6,size:.1,grow:.1,vy:.5,col:[.7,.9,1],a:.8}};
function emit(kind,x,y,z,vx,vz){if(parts.length>=MAXP)return;const K=PK[kind];parts.push({kind,x,y,z,vx:vx||(rng()-.5)*.04,vz:vz||(rng()-.5)*.04,vy:K.vy*(.7+rng()*.6),t:0,life:K.life*(.7+rng()*.6)})}
let clouds=[];
/* clouds are camera-facing cards, not points: points have a size limit on many graphics cards and pop or turn square */
const CLOUDMAX=900,cloudGeo=new THREE.InstancedBufferGeometry();cloudGeo.index=new THREE.PlaneGeometry(1,1).index;cloudGeo.setAttribute('position',new THREE.PlaneGeometry(1,1).attributes.position);cloudGeo.setAttribute('uv',new THREE.PlaneGeometry(1,1).attributes.uv);
cloudGeo.setAttribute('aOff',new THREE.InstancedBufferAttribute(new Float32Array(CLOUDMAX*4),4));cloudGeo.setAttribute('aInf',new THREE.InstancedBufferAttribute(new Float32Array(CLOUDMAX*2),2));cloudGeo.instanceCount=0;
const cloudU={map:{value:TX.soft},uCol:{value:new THREE.Color(1,1,1)},uSun:{value:new THREE.Color(1,1,1)},uSunDir:{value:new THREE.Vector3(0,1,0)},uA:{value:.26},uPL:PLU.uPL,uPE:PLU.uPE};
const cloudMesh=new THREE.Mesh(cloudGeo,new THREE.ShaderMaterial({uniforms:cloudU,transparent:true,depthWrite:false,
  vertexShader:`attribute vec4 aOff;attribute vec2 aInf;uniform vec3 uSunDir;varying vec2 vUv;varying float vF,vH,vSd;varying vec3 vSun;void main(){vUv=uv;vH=aInf.x;vSd=aInf.y;vec3 R=vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0]),U=vec3(viewMatrix[0][1],viewMatrix[1][1],viewMatrix[2][1]);
    vSun=normalize(mat3(viewMatrix)*uSunDir);vec3 p=aOff.xyz+(R*position.x+U*position.y*.62)*aOff.w;vec4 mv=viewMatrix*vec4(p,1.);vF=smoothstep(2.,9.,-mv.z);gl_Position=projectionMatrix*mv;}`,
  /* each puff is drawn as a little sphere lit by the sun, with a ragged edge; puffs low in the cloud are grey, the crowns bright */
  fragmentShader:TOSCENE+`uniform sampler2D map;uniform vec3 uCol,uSun;uniform float uA;varying vec2 vUv;varying float vF,vH,vSd;varying vec3 vSun;
    float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+1.),f.x),f.y);}
    void main(){float soft=texture2D(map,vUv).a;vec2 q=vUv*2.-1.;float d2=dot(q,q);
    float n=vn(vUv*4.+vSd*13.)*.6+vn(vUv*9.-vSd*7.)*.4;float a=clamp(soft*1.35-(1.-soft)*.2-(n-.5)*.55*(1.-soft*.6),0.,1.);
    vec3 nrm=vec3(q.x,q.y,sqrt(max(0.,1.-d2)));float lam=clamp(dot(nrm,vSun)*.5+.5,0.,1.);
    float lit=clamp(lam*.75+vH*.55-.12+(n-.5)*.15,0.,1.);
    vec3 under=uCol*vec3(.58,.62,.7),top=uCol*mix(vec3(1.),uSun,.5)*1.08;vec3 col=mix(under,top,lit);
    col+=uSun*pow(1.-soft,2.)*max(0.,dot(normalize(q+1e-4),vSun.xy))*.35;
    gl_FragColor=vec4(toScene(col),a*uA*vF);}`}));
cloudMesh.frustumCulled=false;cloudMesh.renderOrder=6;scene.add(cloudMesh);
function updateCloudCards(dt){const a=cloudGeo.attributes.aOff.array,inf=cloudGeo.attributes.aInf.array;let n=0;for(const c of clouds){c.x+=dt*.25;if(c.x>W*.75)c.x=-W*.75;if(n>=CLOUDMAX)break;a[n*4]=c.x;a[n*4+1]=c.y;a[n*4+2]=c.z;a[n*4+3]=c.s*1.3;inf[n*2]=c.h??.5;inf[n*2+1]=c.sd??0;n++}
  cloudGeo.attributes.aInf.needsUpdate=true;if(typeof skyU!=='undefined')cloudU.uSunDir.value.copy(skyU.sunDir.value);
  cloudGeo.instanceCount=settings.clouds===false?0:n;cloudGeo.attributes.aOff.needsUpdate=true;const cs=1-nightF*.7;cloudU.uCol.value.setRGB(cs,cs,cs*1.02);if(typeof skyU!=='undefined'){const sc=skyU.sunCol.value,mx=Math.max(.001,sc.r,sc.g,sc.b);cloudU.uSun.value.setRGB(sc.r/mx,sc.g/mx,sc.b/mx)}cloudU.uA.value=.3*smooth(18,45,camDist)}
/* each cloud: a flat grey base and a heaped, sunlit crown in the middle */
function seedClouds(){clouds=[];const nc=Math.min(Math.round(W*H/260),Math.floor(CLOUDMAX/16));for(let c=0;c<nc;c++){const cx=(rng()-.5)*W*1.3,cz=(rng()-.5)*H*1.3,cy=13+rng()*5,n=11+((rng()*6)|0),sw=2.6+rng()*2.6,tall=.8+rng()*1.2;
  for(let k=0;k<n;k++){const a=rng()*6.283,r=Math.sqrt(rng())*sw,core=1-r/sw,h=clamp(core*(.4+rng()*.7),0,1);
    clouds.push({x:cx+Math.cos(a)*r*1.4,y:cy+h*tall,z:cz+Math.sin(a)*r*.8,s:1.5+1.9*(.35+core*.65)*(.7+rng()*.5),h,sd:rng()*10})}}}
function updateParticles(dt,windT){
  const wind=.12;let n=0,g=0;const pa=pGeo.attributes.position.array,sa=pGeo.attributes.aSize.array,aa=pGeo.attributes.aAlpha.array,ca=pGeo.attributes.aColor.array;
  const ga=gGeo.attributes.position.array,gs=gGeo.attributes.aSize.array,gaa=gGeo.attributes.aAlpha.array,gc=gGeo.attributes.aColor.array,tt=performance.now()/1000;
  for(let k=parts.length-1;k>=0;k--){const p=parts[k];p.t+=dt;if(p.t>=p.life){parts.splice(k,1);continue}
    const K=PK[p.kind],f=p.t/p.life;p.x+=(p.vx+wind*(p.kind==='foam'?0:1))*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;
    if(p.kind==='ember'){p.vx+=Math.sin(tt*7+k)*dt*.3;p.vz+=Math.cos(tt*6+k*1.3)*dt*.3;p.vy*=1-dt*.6}
    if(GLOWK[p.kind]){const fl=p.kind==='ember'?.6+.4*Math.sin(tt*20+k*3):1;
      ga[g*3]=p.x;ga[g*3+1]=p.y;ga[g*3+2]=p.z;gs[g]=K.size+K.grow*f;gaa[g]=K.a*(f<.12?f/.12:1-f)*fl;
      const c=p.kind==='fire'?[1,lerp(.8,.22,f),lerp(.35,.05,f)]:K.col;gc[g*3]=c[0];gc[g*3+1]=c[1];gc[g*3+2]=c[2];g++;continue}
    pa[n*3]=p.x;pa[n*3+1]=p.y;pa[n*3+2]=p.z;sa[n]=K.size+K.grow*f;aa[n]=K.a*(f<.15?f/.15:1-f);
    const c=K.col;ca[n*3]=c[0];ca[n*3+1]=c[1];ca[n*3+2]=c[2];n++}
  gGeo.setDrawRange(0,g);for(const a of ['position','aSize','aAlpha','aColor'])gGeo.attributes[a].needsUpdate=true;
  if(typeof stormPuffs==='function')n=stormPuffs(pa,sa,aa,ca,n);
  updateCloudCards(dt);
  pGeo.setDrawRange(0,n);for(const a of ['position','aSize','aAlpha','aColor'])pGeo.attributes[a].needsUpdate=true;
  pU.uScale.value=renderer.domElement.height/(2*Math.tan(cam.fov*Math.PI/360));
}
function updateEmitters(dt){for(const e of emitters){if(rng()<e.rate*dt){if(e.fountain){if(Math.hypot(e.x-camT.x,e.z-camT.z)<camDist)emit('spray',e.x,e.y,e.z,(rng()-.5)*.05,(rng()-.5)*.05)}else emit(e.dark?'dark':'smoke',e.x+(rng()-.5)*.01,e.y,e.z+(rng()-.5)*.01)}}
  for(const n of nations){if(!n.alive||!n.wars.size||!n.front||!n.front.length)continue;if(rng()<dt*1.2){const f=n.front[(rng()*n.front.length)|0],x=wx(f%W)+(rng()-.5)*.8,z=wz((f/W)|0)+(rng()-.5)*.8;const y=groundY(x,z);emit('fire',x,y+.02,z);emit('dark',x,y+.06,z)}}
  for(const g of windmills)g.userData.hub.rotation.z+=dt*1.6;
  {const t=performance.now()/1000;for(const m of townFlags)m.rotation.y=.8+Math.sin(t*1.7+m.userData.ph)*.22}}

/* ---------- ships ---------- */
const SM={wood:stdMat({color:colL(0x6b4a2e)}),dark:stdMat({color:colL(0x2f3439),roughness:.6,metalness:.3}),hullRed:stdMat({color:colL(0x8a2f25)}),
  grey:stdMat({color:colL(0x8d969f),roughness:.5,metalness:.4}),white:stdMat({color:colL(0xf0f0ea)}),sail:stdMat({color:colL(0xf3eee0),side:THREE.DoubleSide}),
  hover:stdMat({color:colL(0xe8f6fa),roughness:.2,metalness:.6}),glow:MAT.glow};
const SG={box:new THREE.BoxGeometry(1,1,1),cyl:new THREE.CylinderGeometry(.5,.5,1,10),bow:(()=>{const g=new THREE.ConeGeometry(.5,1,4);g.rotateZ(-Math.PI/2);g.rotateX(Math.PI/4);return g})(),sail:new THREE.PlaneGeometry(1,1)};
function sp(g,geo,mat,x,y,z,sx,sy,sz){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;g.add(m);return m}
/* ---------- ships: lofted hulls, planked and painted, decks, castles, billowing sails, rigging and flags ---------- */
const shipTex=(w,h,draw,rx)=>{const t=canvasTex(w,draw);t.repeat.set(rx||1,1);return t};
function hullTexture(kind){/* painted hull, deck edge at the top of the image, keel at the bottom */
  const c=document.createElement('canvas');c.width=256;c.height=128;const x=c.getContext('2d');
  const band=(y0,y1,col)=>{x.fillStyle=col;x.fillRect(0,y0,256,y1-y0)};
  if(kind==='iron'){band(0,52,'#1e1f22');band(52,58,'#e8e4da');band(58,128,'#8a2a22');x.fillStyle='rgba(255,255,255,.06)';for(let i=0;i<256;i+=32)x.fillRect(i,0,1,128)}
  else if(kind==='grey'){band(0,60,'#7d868e');band(60,64,'#2a2c30');band(64,128,'#5a3a34');x.fillStyle='rgba(0,0,0,.08)';for(let i=0;i<256;i+=24)x.fillRect(i,0,1,60)}
  else if(kind==='white'){band(0,128,'#eef4f6');band(30,34,'#5fe8ff')}
  else{const dark=kind==='pirate',base=dark?'#2a2420':'#6b4a2e',plank=dark?'#3a312a':'#7c5636';band(0,128,base);
    for(let r=0;r<16;r++){x.fillStyle=r%2?plank:base;x.fillRect(0,r*8,256,7);x.fillStyle='rgba(0,0,0,.35)';x.fillRect(0,r*8+7,256,1)}
    for(let i=0;i<40;i++){x.fillStyle='rgba(0,0,0,.25)';x.fillRect((i*53)%256,((i*37)%16)*8,1,7)}
    if(kind==='galleon'||kind==='pirate'){band(10,13,dark?'#1a1a1a':'#2a1e14');band(30,40,dark?'#1a1714':'#c9a24a');
      for(let i=0;i<8;i++){x.fillStyle='#120e0b';x.fillRect(i*32+10,17,11,10);x.fillStyle=dark?'#4a1a14':'#8a2a1e';x.fillRect(i*32+10,14,11,3)}}
    if(kind==='galley'){for(let i=0;i<16;i++){x.fillStyle='#120e0b';x.beginPath();x.arc(i*16+8,22,2.4,0,7);x.fill()}band(8,12,'#b8862e')}
    band(70,128,dark?'#2a2a24':'#5d6b4f');x.fillStyle='rgba(0,0,0,.15)';for(let r=0;r<7;r++)x.fillRect(0,70+r*8,256,1)}
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.wrapS=THREE.RepeatWrapping;t.anisotropy=4;return t}
const HULLTX={};const hullMat=k=>HULLTX[k]||(HULLTX[k]=stdMat({map:hullTexture(k),roughness:.8,side:THREE.DoubleSide}));
const DECKMAT=stdMat({map:canvasTex(128,(x,s)=>{x.fillStyle='#a07e56';x.fillRect(0,0,s,s);for(let r=0;r<16;r++){x.fillStyle=r%2?'#9a7850':'#a8865c';x.fillRect(0,r*8,s,7);x.fillStyle='rgba(0,0,0,.25)';x.fillRect(0,r*8+7,s,1);x.fillRect((r*37)%s,r*8,1,7)}},[3,1]),roughness:.9});
const CANVAS=canvasTex(128,(x,s)=>{x.fillStyle='#fff';x.fillRect(0,0,s,s);for(let i=0;i<8;i++){x.fillStyle='rgba(120,100,70,.18)';x.fillRect(i*16,0,1.5,s)}for(let i=0;i<4;i++){x.fillStyle='rgba(120,100,70,.12)';x.fillRect(0,i*32,s,1)}speckle(x,s,.04)});
const RIGMAT=new THREE.LineBasicMaterial({color:0x2a2420,transparent:true,opacity:.75});
const SHIPGEO={};const SHIPDECK2=stdMat({color:colL(0x55595d),roughness:.7});
/* hull lofted from cross sections: blunt stern, fine bow, sheer rising fore and aft */
function hullGeo(o){const NS=26,NP=12,pos=[],uv=[],idx=[],deck=[],L=o.L;
  const wAt=u=>o.W*(u<.42?lerp(o.stern||.6,1,Math.sin(u/.42*Math.PI/2)):Math.pow(Math.max(0,Math.cos((u-.42)/.58*Math.PI/2)),o.bowPow||.75));
  const topAt=u=>o.H*(1+o.sheer*Math.pow(2*u-1,2)+(u>.85?(o.bowRise||0)*((u-.85)/.15):0)+(u<.12?(o.sternRise||0)*(1-u/.12):0));
  const botAt=u=>-o.D*(u<.06?lerp(.55,1,u/.06):u>.88?lerp(1,.15,(u-.88)/.12):1);
  for(let i=0;i<=NS;i++){const u=i/NS,x=(u-.5)*L,w=Math.max(wAt(u),.0005),t=topAt(u),b=botAt(u);
    for(let j=0;j<=NP;j++){const a=j/NP*Math.PI,ca=Math.cos(a),sa=Math.sin(a);pos.push(x,t-(t-b)*Math.pow(sa,.85),w*Math.sign(ca)*Math.pow(Math.abs(ca),.75));uv.push(u*L*(o.uvx||8),Math.abs(j/NP-.5)*2)}
    deck.push([x,t,w])}
  for(let i=0;i<NS;i++)for(let j=0;j<NP;j++){const a=i*(NP+1)+j,b=a+1,c=a+NP+1,d=c+1;idx.push(a,b,c,c,b,d)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
  /* deck: a strip between the two rails, just below the top */
  const dp=[],du=[],di=[];deck.forEach(([x,t,w],i)=>{dp.push(x,t-.004,w*.96,x,t-.004,-w*.96);du.push(x*20,0,x*20,1);if(i){const k=i*2;di.push(k-2,k,k-1,k,k+1,k-1)}});
  const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.Float32BufferAttribute(dp,3));dg.setAttribute('uv',new THREE.Float32BufferAttribute(du,2));dg.setIndex(di);dg.computeVertexNormals();
  /* transom: close the stern */
  const tp=[],ti=[];const s0=deck[0];tp.push(s0[0],(s0[1]+botAt(0))/2,0);for(let j=0;j<=NP;j++)tp.push(pos[j*3],pos[j*3+1],pos[j*3+2]);for(let j=1;j<=NP;j++)ti.push(0,j+1,j);
  const tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.Float32BufferAttribute(tp,3));tg.setIndex(ti);tg.computeVertexNormals();
  return {hull:g,deck:dg,transom:tg,topAt:u=>topAt(u),wAt,L}}
/* a square sail bellied by the wind, hanging below its yard */
function sailGeo(w,h,belly,taper){const NX=6,NY=5,p=[],u=[],ix=[];for(let j=0;j<=NY;j++)for(let i=0;i<=NX;i++){const s=i/NX,t=j/NY,ww=w*lerp(1,taper||1,t);
    p.push(Math.sin(Math.PI*s)*Math.sin(Math.PI*(t*.85+.08))*belly,-t*h,(s-.5)*ww);u.push(s,1-t)}
  for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){const a=j*(NX+1)+i,b=a+1,c=a+NX+1,d=c+1;ix.push(a,c,b,b,c,d)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(u,2));g.setIndex(ix);g.computeVertexNormals();return g}
/* a triangular jib or lateen sail between three points */
function triSail(a,b,c,belly){const p=[],u=[],ix=[],N=5;for(let j=0;j<=N;j++)for(let i=0;i<=N-j;i++){const s=i/N,t=j/N,q=new THREE.Vector3().copy(a).multiplyScalar(1-s-t).addScaledVector(b,s).addScaledVector(c,t);q.x+=belly*s*t*(1-s-t)*9;p.push(q.x,q.y,q.z);u.push(s,t)}
  let k=0;const id=[];for(let j=0;j<=N;j++){id.push([]);for(let i=0;i<=N-j;i++)id[j].push(k++)}
  for(let j=0;j<N;j++)for(let i=0;i<N-j;i++){ix.push(id[j][i],id[j][i+1],id[j+1][i]);if(i<N-j-1)ix.push(id[j][i+1],id[j+1][i+1],id[j+1][i])}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(u,2));g.setIndex(ix);g.computeVertexNormals();return g}
function flagTex(color,skull){return canvasTex(64,(x,s)=>{x.fillStyle=color;x.fillRect(0,0,s,s);if(skull){x.fillStyle='#eee';x.beginPath();x.arc(32,26,11,0,7);x.fill();x.fillRect(25,33,14,8);x.fillStyle='#111';x.beginPath();x.arc(27,25,3,0,7);x.arc(37,25,3,0,7);x.fill();
  x.strokeStyle='#eee';x.lineWidth=4;x.beginPath();x.moveTo(14,44);x.lineTo(50,58);x.moveTo(50,44);x.lineTo(14,58);x.stroke()}else{x.fillStyle='rgba(255,255,255,.85)';x.fillRect(0,s*.42,s,s*.16);x.fillRect(s*.3,0,s*.12,s)}})}
const LIFEBOAT_M=stdMat({color:colL(0xe8742a),roughness:.6});
function makeShip(era,kind,color,nflag){
  const g=new THREE.Group(),mats=[],nc=colL(parseInt(color.slice(1),16)),pir=kind==='pirate',war=kind==='war'||pir;g.userData.mats=mats;
  const own=m=>{mats.push(m);return m};
  const mesh=(geo,mat,x,y,z,sx,sy,sz,shadow)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);if(sx!=null)m.scale.set(sx,sy,sz);m.castShadow=shadow!==false;g.add(m);return m};
  const lines=[];const line=(a,b)=>{lines.push(a[0],a[1],a[2],b[0],b[1],b[2])};
  const flag=(x,y,z,w,skull)=>{const fm=own(stdMat({map:!pir&&nflag&&typeof flagTexture==='function'?flagTexture(nflag):flagTex(pir?'#111':color,skull),side:THREE.DoubleSide,roughness:.9}));const f=mesh(SG.sail,fm,x-w*.55,y,z,w,w*.62,1,false);f.rotation.y=0;f.userData.flag=true;return f};
  const sailMat=own(stdMat({map:CANVAS,color:pir?new THREE.Color(.09,.09,.09):kind==='war'?new THREE.Color(1,1,1).lerp(nc,.25):new THREE.Color(.95,.92,.84),side:THREE.DoubleSide,roughness:.95}));
  const mast=(x,base,h,r)=>mesh(SG.cyl,SM.wood,x,base+h/2,0,r,h,r);
  const yard=(x,y,w)=>{const m=mesh(SG.cyl,SM.wood,x,y,0,.004,w,.004);m.rotation.x=Math.PI/2;return m};
  if(era<=2){/* galley: a long low hull, a ram, one square sail and banks of oars */
    const key='galley';const H=SHIPGEO[key]||(SHIPGEO[key]=hullGeo({L:.42,W:.04,H:.028,D:.03,sheer:.35,sternRise:1.6,bowRise:.3,stern:.45,bowPow:.9}));
    mesh(H.hull,hullMat('galley'),0,0,0);mesh(H.deck,DECKMAT,0,0,0);mesh(H.transom,SM.wood,0,0,0);
    mesh(SG.cyl,SM.dark,.22,-.006,0,.01,.06,.01).rotation.z=Math.PI/2;
    const st=mesh(SG.cyl,SM.wood,-.215,.055,0,.008,.06,.008);st.rotation.z=-.5;
    mast(0,.02,.24,.007);yard(0,.24,.2);const sm=own(stdMat({map:CANVAS,color:new THREE.Color(1,1,1).lerp(nc,.5),side:THREE.DoubleSide}));mesh(sailGeo(.19,.15,.03,1.05),sm,0,.235,0);
    for(let k=0;k<9;k++)for(const sd of [-1,1]){const o=mesh(SG.box,SM.wood,-.12+k*.03,.012,sd*.06,.003,.003,.07);o.rotation.x=sd*.5;o.userData.oar=sd}
    line([0,.26,0],[.2,.04,0]);line([0,.26,0],[-.2,.06,0]);for(const sd of [-1,1])line([0,.25,0],[0,.03,sd*.04]);
    flag(-.215,.1,0,.03)}
  else if(era<=4){const galleon=era===4,key=galleon?'galleon':'cog';
    const H=SHIPGEO[key]||(SHIPGEO[key]=galleon?hullGeo({L:.5,W:.058,H:.045,D:.045,sheer:.45,sternRise:.9,bowRise:.25,stern:.7,bowPow:.7}):hullGeo({L:.32,W:.06,H:.04,D:.04,sheer:.5,sternRise:.8,bowRise:.6,stern:.75,bowPow:.6}));
    mesh(H.hull,hullMat(pir?'pirate':galleon?'galleon':'cog'),0,0,0);mesh(H.deck,DECKMAT,0,0,0);mesh(H.transom,pir?SM.dark:SM.wood,0,0,0);
    const L=H.L,sx=-L/2,tS=H.topAt(.08),wS=H.wAt(.1);
    /* stern castle with windows and lanterns, a forecastle at the bow */
    mesh(SG.box,pir?SM.dark:SM.wood,sx+.06,tS+.018,0,.1,.036,wS*1.7);mesh(SG.box,SM.wood,sx+.05,tS+.04,0,.075,.012,wS*1.6);
    for(let k=0;k<4;k++)mesh(SG.box,SM.glow,sx+.008,tS+.01,(k-1.5)*.016,.003,.008,.009,false);
    for(const sd of [-1,1])mesh(SG.box,SM.glow,sx+.01,tS+.052,sd*wS*.7,.006,.009,.006,false);
    const tB=H.topAt(.88);mesh(SG.box,pir?SM.dark:SM.wood,L*.36,tB+.012,0,.07,.024,H.wAt(.86)*1.6);
    /* rails along the deck */
    for(const sd of [-1,1])for(let k=0;k<10;k++){const u=.15+k*.07,x=(u-.5)*L;mesh(SG.box,SM.wood,x,H.topAt(u)+.006,sd*H.wAt(u)*.95,.003,.012,.003,false)}
    const bs=mesh(SG.cyl,SM.wood,L*.55,H.topAt(.98)+.02,0,.005,.14,.005);bs.rotation.z=-1.25;
    const masts=galleon?[[-.11,.27,.15],[.04,.34,.2],[.16,.29,.17]]:[[0,.3,.2]];
    for(const [mx,mh,yw] of masts){const base=H.topAt(.5+mx/L);mast(mx,base,mh,.006);
      const tiers=galleon?3:1;for(let t=0;t<tiers;t++){const yy=base+mh*(galleon?[.48,.75,.95][t]:.9),w=yw*(1-t*.22),hh=mh*(galleon?.25:.62)*(1-t*.1);
        yard(mx,yy,w);mesh(sailGeo(w*.95,hh,.025,1.08),sailMat,mx,yy-.004,0)}
      line([mx,base+mh,0],[mx+.05,base,0]);for(const sd of [-1,1]){line([mx,base+mh*.95,0],[mx-.01,base+.005,sd*H.wAt(.5+mx/L)]);line([mx,base+mh*.7,0],[mx+.01,base+.005,sd*H.wAt(.5+mx/L)])}
      flag(mx,base+mh+.02,0,.035,pir)}
    /* jib from the bowsprit and a lateen on the mizzen */
    if(galleon){const top=[.16,H.topAt(.82)+.27,0];mesh(triSail(new THREE.Vector3(...top),new THREE.Vector3(L*.6,H.topAt(.98)+.06,0),new THREE.Vector3(.2,H.topAt(.85)+.03,0),.004),sailMat,0,0,0);line(top,[L*.62,H.topAt(.98)+.06,0])}
    if(galleon){for(const sd of [-1,1])for(let k=0;k<7;k++){const u=.25+k*.08;mesh(SG.cyl,SM.dark,(u-.5)*L,H.topAt(u)-.022,sd*(H.wAt(u)+.004),.004,.012,.004,false).rotation.x=Math.PI/2}}
    if(pir)flag(sx+.02,tS+.11,0,.045,true)}
  else if(era===5){/* steamship: iron hull, white deckhouses, two funnels and a pair of masts */
    const H=SHIPGEO.steam||(SHIPGEO.steam=hullGeo({L:.56,W:.05,H:.04,D:.04,sheer:.18,stern:.75,bowPow:.65,uvx:3}));
    mesh(H.hull,hullMat('iron'),0,0,0);mesh(H.deck,DECKMAT,0,0,0);mesh(H.transom,SM.dark,0,0,0);
    const t=H.topAt(.5);mesh(SG.box,SM.white,-.02,t+.016,0,.2,.032,.06);mesh(SG.box,SM.white,.04,t+.04,0,.07,.02,.05);
    for(let k=0;k<10;k++)for(const sd of [-1,1])mesh(SG.box,SM.dark,-.11+k*.022,t+.018,sd*.0302,.008,.008,.002,false);
    /* lifeboats on davits, portholes along the hull and the bridge windows */
    for(let k=0;k<3;k++)for(const sd of [-1,1]){mesh(SG.box,SM.white,-.09+k*.05,t+.038,sd*.032,.026,.008,.009);mesh(SG.box,SM.wood,-.09+k*.05,t+.042,sd*.032,.024,.002,.007,false)}
    for(let k=0;k<16;k++)for(const sd of [-1,1]){const u=.2+k*.04;mesh(SG.box,SM.dark,(u-.5)*.56,H.topAt(u)-.012,sd*(H.wAt(u)+.0008),.004,.004,.001,false)}
    for(let k=0;k<4;k++)mesh(SG.box,SM.dark,.076,t+.044,(k-1.5)*.011,.001,.007,.008,false);
    const fm=own(stdMat({color:nc}));for(const fx of [-.05,.03]){mesh(SG.cyl,SM.dark,fx,t+.07,0,.026,.08,.026);mesh(SG.cyl,fm,fx,t+.09,0,.027,.016,.027)}
    for(const mx of [-.2,.2]){mast(mx,H.topAt(.5+mx/.56),.17,.004);line([mx,H.topAt(.5)+.17,0],[0,t+.06,0])}line([-.2,t+.17,0],[-.28,t+.01,0]);line([.2,t+.17,0],[.28,t+.02,0]);
    flag(-.27,t+.06,0,.03)}
  else if(era===6&&war&&Math.random()<.4){/* aircraft carrier: a long flat deck, an island on the side and planes ready to fly */
      const H=SHIPGEO.cv||(SHIPGEO.cv=hullGeo({L:.95,W:.07,H:.06,D:.035,sheer:.04,stern:.95,bowPow:.45,uvx:3}));mesh(H.hull,hullMat('grey'),0,0,0);mesh(H.transom,SM.grey,0,0,0);
      const t=H.topAt(.5);mesh(SG.box,SHIPDECK2,0,t+.006,.01,.98,.012,.16);mesh(SG.box,SM.white,0,t+.0125,-.03,.9,.001,.004);mesh(SG.box,SM.white,.1,t+.0125,.03,.5,.001,.003).rotation.y=-.12;
      mesh(SG.box,SM.grey,-.05,t+.04,-.06,.12,.06,.03);mesh(SG.box,SM.dark,-.02,t+.07,-.06,.05,.012,.032);mesh(SG.cyl,SM.grey,-.06,t+.1,-.06,.004,.05,.004);mesh(SG.box,SM.dark,-.06,t+.12,-.06,.004,.004,.03);
      const pm=own(stdMat({color:colL(0x6a7078),metalness:.4,roughness:.5}));for(let k=0;k<6;k++){const px=-.34+k*.1,pz=.035+(k%2)*.025,jy=t+.016;
        mesh(SG.cyl,pm,px,jy,pz,.006,.06,.006).rotation.z=Math.PI/2;if(typeof WING==='function')for(const s of [-1,1]){mesh(WING(s),pm,px+.004,jy-.002,pz,.034,.03,.026);mesh(WING(s),pm,px-.024,jy-.001,pz,.014,.02,.012)}
        const fn=mesh(SG.box,pm,px-.026,jy+.008,pz,.012,.012,.0015);mesh(SG.box,SM.glass||SM.dark,px+.018,jy+.004,pz,.012,.004,.004,false)}
      for(let k=0;k<4;k++)mesh(SG.box,SM.dark,-.035,t+.062,-.06+(k-1.5)*.0001,.001,.008,.028,false);
      flag(-.47,t+.05,0,.03)}
  else if(era===6&&!war&&Math.random()<.4){/* cruise liner: tiers of white decks with rows of windows and a funnel */
      const H=SHIPGEO.cruise||(SHIPGEO.cruise=hullGeo({L:.85,W:.065,H:.05,D:.04,sheer:.08,stern:.9,bowPow:.5,uvx:3}));mesh(H.hull,hullMat('iron'),0,0,0);mesh(H.deck,SHIPDECK2,0,0,0);mesh(H.transom,SM.dark,0,0,0);
      const t=H.topAt(.5);for(let d=0;d<4;d++){const L=.66-d*.1,w=.12-d*.012,y=t+.012+d*.026;mesh(SG.box,SM.white,-.03+d*.01,y,0,L,.026,w);for(const sd of [-1,1])mesh(SG.box,SM.hover,-.03+d*.01,y+.003,sd*(w/2+.0005),L*.96,.008,.001,false)}
      const lbm=LIFEBOAT_M;for(let k=0;k<9;k++)for(const sd of [-1,1])mesh(SG.box,lbm,-.3+k*.07,t+.046,sd*.062,.04,.012,.012);
      for(let k=0;k<22;k++)for(const sd of [-1,1]){const u=.12+k*.035;mesh(SG.box,SM.dark,(u-.5)*.85,H.topAt(u)-.018,sd*(H.wAt(u)+.0008),.006,.005,.001,false)}
      const fm=own(stdMat({color:nc}));mesh(SG.cyl,fm,-.18,t+.13,0,.05,.05,.034);mesh(SG.box,SM.hover,-.02,t+.12,0,.2,.006,.06);mesh(SG.box,SM.glow,.12,t+.115,0,.04,.004,.08,false);flag(-.42,t+.04,0,.03)}
  else if(era===6){if(war){/* destroyer: sleek grey hull, gun turrets, bridge and radar mast */
      const H=SHIPGEO.dd||(SHIPGEO.dd=hullGeo({L:.66,W:.042,H:.046,D:.03,sheer:.16,bowRise:.25,stern:.85,bowPow:.55,uvx:3}));mesh(H.hull,hullMat('grey'),0,0,0);mesh(H.deck,SHIPDECK2,0,0,0);mesh(H.transom,SM.grey,0,0,0);
      const t=H.topAt(.5);mesh(SG.box,SM.grey,.02,t+.02,0,.16,.04,.05);mesh(SG.box,SM.grey,.07,t+.05,0,.06,.03,.042);for(let k=0;k<5;k++)mesh(SG.box,SM.dark,.1,t+.058,(k-2)*.008,.002,.008,.006,false);
      for(const [tx,dir] of [[.2,1],[-.18,-1]]){mesh(SG.box,SM.grey,tx,t+.008,0,.04,.016,.03);const b=mesh(SG.cyl,SM.dark,tx+dir*.04,t+.016,0,.004,.06,.004);b.rotation.z=Math.PI/2}
      mesh(SG.cyl,SM.grey,.05,t+.11,0,.006,.08,.006);mesh(SG.box,SM.dark,.05,t+.14,0,.004,.004,.05);mesh(SG.cyl,SM.dark,-.04,t+.06,0,.03,.04,.024);flag(-.3,t+.04,0,.025)}
    else{/* container ship: dark hull, stacks of coloured boxes, bridge at the stern */
      const H=SHIPGEO.cargo||(SHIPGEO.cargo=hullGeo({L:.7,W:.06,H:.04,D:.045,sheer:.1,stern:.9,bowPow:.5,uvx:3}));mesh(H.hull,hullMat('iron'),0,0,0);mesh(H.deck,SM.grey,0,0,0);mesh(H.transom,SM.dark,0,0,0);
      const t=H.topAt(.5),CC=[0xc0392b,0x2e6fb0,0xe0b030,0x3f8f4a,0x8a8f96,0xd35400];for(let i=0;i<9;i++)for(let j=0;j<3;j++)for(let k=0;k<1+((hash(i*7+j)*3)|0);k++)
        mesh(SG.box,own(stdMat({color:colL(CC[(hash(i*13+j*5+k)*6)|0])})),-.16+i*.045,t+.012+k*.02,(j-1)*.03,.042,.019,.028,k===0);
      mesh(SG.box,SM.white,-.29,t+.04,0,.05,.08,.07);for(let k=0;k<5;k++)mesh(SG.box,SM.dark,-.264,t+.07,(k-2)*.012,.002,.01,.008,false);mesh(SG.cyl,SM.dark,-.3,t+.1,0,.016,.03,.016);flag(-.34,t+.05,0,.025)}}
  else{/* future: a white trimaran with glowing seams */
    const H=SHIPGEO.fut||(SHIPGEO.fut=hullGeo({L:.5,W:.035,H:.02,D:.02,sheer:.1,stern:.8,bowPow:.45,uvx:2}));
    mesh(H.hull,hullMat('white'),0,0,0);mesh(H.deck,SM.hover,0,0,0);for(const sd of [-1,1]){const m=mesh(H.hull,hullMat('white'),.04,0,sd*.08,.6,.6,.6);m.scale.set(.6,.6,.5)}
    for(const sd of [-1,1])mesh(SG.box,SM.hover,.04,.02,sd*.04,.12,.006,.08);mesh(SG.box,SM.hover,0,.04,0,.14,.03,.05);mesh(SG.box,SM.glow,.02,.05,0,.1,.004,.052,false);
    const wing=mesh(triSail(new THREE.Vector3(-.06,.04,0),new THREE.Vector3(.08,.04,0),new THREE.Vector3(-.03,.18,0),0),SM.hover,0,0,0);flag(-.24,.06,0,.02)}
  g.scale.setScalar(era>=6?1.05:.85);scene.add(g);
  if(lines.length){const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(lines,3));const ls=new THREE.LineSegments(lg,RIGMAT);g.add(ls);g.userData.lineGeo=lg}
  return g}
function disposeShip(s){scene.remove(s.g);for(const m of s.g.userData.mats||[]){if(m.map&&m.map!==CANVAS&&!m.map.shared)m.map.dispose();m.dispose()}if(s.g.userData.lineGeo)s.g.userData.lineGeo.dispose()}
function makeRocket(n,x,y,z){const g=new THREE.Group(),nc=stdMat({color:colL(parseInt(n.color.slice(1),16))});
  sp(g,SG.cyl,SM.white,0,.25,0,.07,.5,.07);const nose=new THREE.Mesh(new THREE.ConeGeometry(.035,.12,10),nc);nose.position.y=.56;g.add(nose);
  for(let k=0;k<3;k++){const f=sp(g,SG.box,nc,Math.cos(k*2.1)*.04,.04,Math.sin(k*2.1)*.04,.03,.08,.006);f.rotation.y=-k*2.1}
  g.position.set(x,y,z);scene.add(g);return g}
