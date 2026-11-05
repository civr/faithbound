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
function setNight(f){for(const m of winMats)m.emissiveIntensity=f*(m===MAT.lamp?3:1.7)}

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
  const push=(g,cf)=>{g=g.index?g.toNonIndexed():g;g.computeVertexNormals();const a=g.attributes.position.array,n=g.attributes.normal.array;for(let i=0;i<a.length;i+=3){pos.push(a[i],a[i+1],a[i+2]);nor.push(n[i],n[i+1],n[i+2]);const c=cf(a[i],a[i+1],a[i+2]);col.push(c[0],c[1],c[2])}};
  const trunk=new THREE.CylinderGeometry(.022,.04,kind==='con'?.2:.24,6);trunk.translate(0,kind==='con'?.1:.12,0);push(trunk,()=>TRUNK);
  if(kind==='con'){for(let t=0;t<5;t++){const cg=new THREE.ConeGeometry(.2-t*.033,.16,9,1);const p=cg.attributes.position;for(let i=0;i<p.count;i++){if(p.getY(i)<0){const k=.85+r()*.3;p.setX(i,p.getX(i)*k);p.setZ(i,p.getZ(i)*k);p.setY(i,p.getY(i)-r()*.02)}}
    cg.translate(0,.12+t*.072,0);push(cg,(x,y,z)=>{const ao=.55+.45*clamp((y-.04)/.42,0,1)*(.8+.2*Math.hypot(x,z)/.2);return[ao*.85,ao*.95,ao*.85]})}}
  else{const n=6+((r()*3)|0);for(let b=0;b<n;b++){const ig=new THREE.IcosahedronGeometry(.5,0),p=ig.attributes.position;for(let i=0;i<p.count;i++){const k=.82+r()*.3;p.setXYZ(i,p.getX(i)*k,p.getY(i)*k,p.getZ(i)*k)}
    const a=r()*6.283,d=b===0?0:.06+r()*.07,s=b===0?.24:.13+r()*.08;ig.scale(s,s*.85,s);ig.translate(Math.cos(a)*d,.27+(b===0?.03:r()*.1-.03),Math.sin(a)*d);
    const tone=.72+r()*.18;push(ig,(x,y,z)=>{const ao=(.45+.55*clamp((y-.16)/.26,0,1))*tone;return[ao,ao,ao]})}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));return g}

/* ---------- instanced kits ---------- */
const KITS={};
function kit(name,geo,mat,max,shadow){const m=new THREE.InstancedMesh(geo,mat,max);m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  for(let i=0;i<max;i++)m.setColorAt(i,tmpC.setRGB(1,1,1));m.count=0;m.frustumCulled=false;m.castShadow=shadow!==false;m.receiveShadow=true;scene.add(m);KITS[name]={mesh:m,k:0,max}}
const treeMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9});
kit('plaster',unitBox(),MAT.plaster,20000);kit('stone',unitBox(),MAT.stone,32000);kit('brick',unitBox(),MAT.brick,16000);
kit('thatch',gableGeo(),MAT.thatch,4000);kit('hipThatch',hipGeo(.3),MAT.thatch2,5000);kit('timber',unitBox(),MAT.timber,8000);kit('bed',unitBox(),MAT.soil,6000,false);kit('hay',unitCone(9),MAT.thatch2,5000);kit('tiles',gableGeo(),MAT.tiles,26000);
kit('coneThatch',unitCone(12),MAT.thatch,12000);kit('coneTile',unitCone(10),MAT.tiles,4000);kit('pyr',(()=>{const g=unitCone(4);g.rotateY(Math.PI/4);return g})(),MAT.tiles,1200);
kit('tower',unitCyl(14),MAT.stone,4000);kit('office',unitBox(),MAT.office,2500);kit('glass',unitBox(),MAT.glass,2000);
kit('dome',(()=>{const g=new THREE.SphereGeometry(.5,16,8,0,Math.PI*2,0,Math.PI/2);return g})(),MAT.metal,700);
kit('box',unitBox(),MAT.plain,90000);kit('adobe',unitBox(),MAT.adobe,9000);kit('adobeCyl',unitCyl(12),MAT.adobe,8000);kit('hipTile',hipGeo(.32),MAT.tiles,6000);
kit('domeW',new THREE.SphereGeometry(.5,14,7,0,Math.PI*2,0,Math.PI/2),MAT.plain,1600);kit('cyl',unitCyl(8),MAT.plain,12000);
kit('ring',(()=>{const g=new THREE.TorusGeometry(.5,.05,6,24);g.rotateX(Math.PI/2);return g})(),MAT.glow,500,false);
kit('flame',unitCone(6),MAT.flame,300,false);
kit('conifer',leafTree(11,'con'),treeMat,32000);
kit('broad',leafTree(7,'broad'),treeMat,32000);
kit('palm',merge([{g:tr(unitCyl(5,.35),0,0,0,.035,.34,.035),c:TRUNK},{g:tr(unitCone(7),0,.3,0,.34,-.1,.34),c:LEAF},{g:tr(new THREE.IcosahedronGeometry(.5,0),0,.33,0,.12,.08,.12),c:LEAF}]),treeMat,8000);
kit('bush',merge([{g:tr(new THREE.IcosahedronGeometry(.5,1),0,.04,0,.14,.1,.14),c:LEAF}]),treeMat,24000);
kit('rock',(()=>{const g=new THREE.DodecahedronGeometry(.5,0);g.translate(0,.25,0);return g})(),stdMat({roughness:1}),6000);
kit('fence',unitBox(),MAT.plain,30000,false);kit('lamp',unitBox(),MAT.lamp,4000,false);kit('awning',gableGeo(),MAT.awning,8000);
kit('plazaStone',unitCyl(24),MAT.plaza,400,false);kit('plazaDirt',unitCyl(18),MAT.dirtPlaza,400,false);kit('pool',unitCyl(16),MAT.water,5000,false);
kit('townTree',leafTree(23,'broad'),treeMat,16000);
kit('boat',(()=>{const g=new THREE.CylinderGeometry(.5,.5,1,6,1,false,0,Math.PI);g.rotateZ(Math.PI);g.rotateY(Math.PI/2);g.scale(1,.6,1);return g})(),MAT.plain,400);
kit('tuft',unitCone(4),stdMat({roughness:1}),16000,false);kit('flower',new THREE.SphereGeometry(.5,5,3),MAT.plain,8000,false);
kit('animal',unitBox(),MAT.plain,1200,false);kit('car',unitBox(),MAT.plain,400,false);
kit('bird',(()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,0,.3,-1,.25,-.3,0,0,0, 0,0,.3,0,0,0,1,.25,-.3],3));g.computeVertexNormals();return g})(),new THREE.MeshBasicMaterial({color:0x2a2a2a,side:THREE.DoubleSide}),300,false);
kit('body',unitBox(),MAT.plain,900,false);kit('cart',unitBox(),MAT.plain,200);kit('cartTop',(()=>{const g=new THREE.CylinderGeometry(.5,.5,1,8,1,false,0,Math.PI);g.rotateZ(Math.PI/2);g.translate(0,.0,0);return g})(),MAT.plain,200);kit('head',new THREE.SphereGeometry(.5,6,4),MAT.plain,900,false);
function kitReset(names){for(const n of names)KITS[n].k=0}
function kitCommit(names){if(typeof shadowForce!=='undefined')shadowForce=true;for(const n of names){const K=KITS[n];K.mesh.count=K.k;K.mesh.instanceMatrix.needsUpdate=true;if(K.mesh.instanceColor)K.mesh.instanceColor.needsUpdate=true}}
function add(name,x,y,z,sx,sy,sz,rot,hex,tilt){const K=KITS[name];if(K.k>=K.max)return;
  dummy.position.set(x,y,z);dummy.rotation.set(tilt||0,rot||0,0);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();
  K.mesh.setMatrixAt(K.k,dummy.matrix);K.mesh.setColorAt(K.k,tmpC.set(hex==null?0xffffff:hex).convertSRGBToLinear());K.k++;
  if(REC){const r=REC.k[name]||(REC.k[name]=[]);const m=dummy.matrix.elements;for(let i=0;i<16;i++)r.push(m[i]);r.push(tmpC.r,tmpC.g,tmpC.b)}}
let REC=null;
/* place relative to a rotated frame */
function P(name,cx,cy,cz,rot,dx,dz,dy,sx,sy,sz,hex,extraRot){const c=Math.cos(rot),s=Math.sin(rot);add(name,cx+dx*c+dz*s,cy+dy,cz-dx*s+dz*c,sx,sy,sz,rot+(extraRot||0),hex)}
const BUILD_KITS=['adobe','adobeCyl','hipTile','domeW','hipThatch','timber','bed','hay','plaster','stone','brick','thatch','tiles','coneThatch','coneTile','pyr','tower','office','glass','dome','box','cyl','ring','flame','fence','lamp','awning','plazaStone','plazaDirt','pool','townTree','boat'];
kit('puddle',unitCyl(12),new THREE.MeshLambertMaterial({color:new THREE.Color(0x46707c).convertSRGBToLinear()}),6000,false);kit('reed',unitCone(4),stdMat({roughness:1}),12000,false);
kit('hedge',unitBox(),stdMat({roughness:1}),20000,false);kit('farmW',unitBox(),MAT.plain,3000);kit('farmR',gableGeo(),MAT.plain,3000);
const TREE_KITS=['conifer','broad','palm','bush','rock','tuft','flower','puddle','reed','hedge','farmW','farmR'];
/* the countryside: hedgerows, dry-stone walls or fences round the fields, and a farmstead with a barn here and there */
function countryside(){const farm=new Set();
  for(const i of fieldTiles){const o=owner[i],n=o>=0?nations[o]:null;if(!n)continue;const e=n.era,x=i%W,y=(i/W)|0,X0=x-W/2,Z0=y-H/2;
    if(Math.hypot(X0+.5-camT.x,Z0+.5-camT.z)>camDist*1.5+5)continue;
    const kind=e<=1?'stone':e>=5?'fence':hash(i*3.3)<.6?'hedge':'stone',col=kind==='hedge'?0x46682e:kind==='stone'?0x9a948a:0xd8cfbc,hh=kind==='hedge'?.03:kind==='stone'?.018:.016,th=kind==='hedge'?.03:kind==='stone'?.02:.004;
    for(let d=0;d<4;d++){const X=x+DX[d],Y=y+DY[d];if(X>=0&&Y>=0&&X<W&&Y<H&&fieldTiles.has(Y*W+X)&&hash(i*7+d)<.55)continue;
      const horiz=DY[d]!==0,cx=X0+.5+DX[d]*.5,cz=Z0+.5+DY[d]*.5,segs=4;
      for(let s=0;s<segs;s++){const f=(s+.5)/segs-.5,px=horiz?cx+f:cx,pz=horiz?cz:cz+f,gy=groundY(px,pz);if(gy<waterY+.03)continue;
        add('hedge',px,gy-.008,pz,horiz?.25:th,hh,horiz?th:.25,0,col)}
      if(kind==='hedge'&&hash(i*11+d)<.35){const px=cx+(horiz?(hash(i+d)-.5)*.7:0),pz=cz+(horiz?0:(hash(i+d)-.5)*.7);add('broad',px,groundY(px,pz)-.01,pz,.5,.55,.5,hash(i)*6,0x5a7a3a)}}
    /* a farmstead on open ground beside the field */
    if(e>=1&&e<=5&&hash(i*17.1)<.18)for(let d=0;d<4;d++){const X=x+DX[d],Y=y+DY[d];if(X<0||Y<0||X>=W||Y>=H)continue;const j=Y*W+X;
      if(fieldTiles.has(j)||occupied.has(j)||farm.has(j)||isWater(j)||owner[j]!==o)continue;farm.add(j);
      const fx=X-W/2+.5-DX[d]*.25,fz=Y-H/2+.5-DY[d]*.25,gy=groundY(fx,fz),rot=hash(j)*1.57;if(gy<waterY+.04)break;
      const wall=e<=2?0x9a8468:e<=4?0xf0e8d8:0xb8604a,roof=e<=2?0xc8b070:0x8e3f2c,c=Math.cos(rot),s=Math.sin(rot);
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
const ROOF_RED=[0xa04a32,0x8e3f2c,0xb3593a,0x7c3a2b],ROOF_SLATE=[0x5d6672,0x4f5864,0x6a707a];
function house(x,y,z,rot,w,d,hh,wall,wallTint,roof,roofTint,chim,o){
  const hk=o?o.hk:.5,floors=hh>.075?2:1,gableFront=hk>.45&&roof!=='thatch';
  if(floors===2&&wall==='plaster'&&hk<.75){/* jettied upper floor: stone or plaster below, timber-framed above and overhanging */
    const lo=hh*.48;add(hk<.35?'stone':'plaster',x,y-.02,z,w,lo+.02,d,rot,hk<.35?0xd8d2c6:wallTint);
    add('plaster',x,y+lo,z,w*1.05,hh-lo,d*1.08,rot,wallTint);framing(x,y+lo,z,rot,w*1.05,d*1.08,hh-lo,1);
    P('box',x,y+lo-.003,z,rot,0,d*.54,0,w*1.06,.004,.006,0x3a2a1c)}
  else{add(wall,x,y-.02,z,w,hh+.02,d,rot,wallTint);if(wall==='plaster')framing(x,y,z,rot,w,d,hh,floors)}
  const rh=roof==='thatch'?.85:AR().roofH*(gableFront?1.25:1);
  if(gableFront)P(roof,x,y+hh,z,rot,0,0,0,d*1.2,hh*rh,w*1.1,roofTint,Math.PI/2);else P(roof,x,y+hh,z,rot,0,0,0,w*1.12,hh*rh,d*1.25,roofTint);
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
  if(cu==='east'){/* a pagoda of stacked roofs */add('stone',x,y-.03,z,.2,.03,.2,.4,0xc8c2b8);for(let k=0;k<5;k++){const s=.15-k*.022,yy=y+k*.06;add('plaster',x,yy,z,s,.045,s,.4,k%2?0xb83a2a:0xf0ece4);add('hipTile',x,yy+.04,z,s*1.6,.028,s*1.6,.4,0x3e4248)}
    add('cyl',x,y+.33,z,.006,.08,.006,0,0xd4af37);return true}
  if(cu==='africa'&&e<3){roundHut(x,y,z,.11,.065,0xa86040,0xd8cca8);for(let k=0;k<20;k++){const a=k/20*6.283;add('cyl',x+Math.cos(a)*.3,y-.03,z+Math.sin(a)*.3,.016,.07,.016,0,0x6e5236)}add('cyl',x+.15,y,z+.15,.006,.16,.006,0,0x5a4632);add('box',x+.172,y+.13,z+.15,.04,.024,.003,0,nc);return true}
  if(cu==='mideast'||cu==='africa'&&e>=3){const col=cu==='africa'?0xb8784a:0xe8d8b8;add('adobe',x,y-.03,z,.3,.12,.24,0,col);
    if(cu==='africa'){for(let k=0;k<9;k++)add('adobe',x-.14+k*.035,y-.03,z+.12,.014,.15,.014,0,col);for(const dx of [-.1,0,.1])add('adobeCyl',x+dx,y+.09,z+.1,.05,.11,.05,0,col);for(let k=0;k<12;k++)add('box',x-.14+k*.025,y+.06,z+.123,.004,.004,.02,0,0x4a3826)}
    else{add('domeW',x,y+.09,z,.17,.15,.17,0,[0x3a6a9a,0xd4af37,0x4a8a7a][n.id%3]);for(const dx of [-.16,.16]){add('adobe',x+dx,y-.03,z+.13,.03,.3,.03,0,col);add('domeW',x+dx,y+.27,z+.13,.035,.03,.035,0,0xf2eee6)}}
    add('cyl',x,y+.12,z,.005,.1,.005,0,0x444444);add('box',x+.022,y+.2,z,.04,.024,.003,0,nc);return true}
  if(cu==='meso'){/* a stepped pyramid with a temple on top */for(let k=0;k<5;k++){const s=.38-k*.065;add('stone',x,y-.03+k*.045,z,s,.05,s,0,k%2?0xc8bca4:0xb8ac94)}
    add('stone',x,y+.2,z+.0,.1,.012,.1,0,0xc8bca4);add('adobe',x,y+.21,z,.08,.05,.07,0,0xd8ccb4);add('hipThatch',x,y+.26,z,.11,.05,.1,0,0xc0b080);add('box',x,y-.03,z+.19,.05,.2,.08,0,0xb0a48c);return true}
  if(cu==='nordic'&&e<=2){add('timber',x,y-.02,z,.36,.07,.12,.3,0x9a8a7a);add('hipThatch',x,y+.045,z,.42,.09,.18,.3,0x7a9850);add('cyl',x+.2,y,z+.1,.006,.16,.006,0,0x5a4632);add('box',x+.222,y+.13,z+.1,.04,.024,.003,0,nc);return true}
  return false}
/* a great castle: moat, curtain wall with battlements, round towers, a gatehouse, a tall keep, a hall and a chapel */
function crenel(x,y,z,len,rot,col){const k=Math.max(2,Math.round(len/.026)),c=Math.cos(rot),s=Math.sin(rot);for(let i=0;i<k;i+=2){const t=(i+.5)/k-.5;add('stone',x+t*len*c,y,z-t*len*s,len/k*.9,.014,.026,rot,col)}}
function castle(n,x,y,z,e,nc){const S=.42,WH=.15,T=.032,col=0xd4cdbe,roof=e>=4?0x4a5560:ROOF_SLATE[0];
  if(typeof bareRect==='function')bareRect(x,z,0,S*3.1,S*3.1);add('moat',x,y-.008,z,S*2.95,.014,S*2.95,0);/* the moat */
  add('stone',x,y-.035,z,S*2.15,.035,S*2.15,0,0xa8a090);/* the bailey ground */
  const sides=[[0,-S,S*2,0],[0,S,S*2,0],[-S,0,S*2,Math.PI/2],[S,0,S*2,Math.PI/2]];
  sides.forEach(([dx,dz,L,r],si)=>{if(si===1){/* the gate side: two halves and a gatehouse */for(const sd of [-1,1])add('stone',x+sd*S*.6,y-.03,z+dz,S*.8,WH+.03,T,0,col),crenel(x+sd*S*.6,y+WH,z+dz,S*.8,0,col);
      for(const sd of [-1,1]){add('tower',x+sd*.07,y-.03,z+dz,.075,WH+.09,.075,0,col);add('coneTile',x+sd*.07,y+WH+.06,z+dz,.09,.07,.09,0,roof)}
      add('stone',x,y+WH*.55,z+dz,.1,WH*.5,T*1.3,0,col);add('box',x,y-.03,z+dz+.005,.06,WH*.6,.004,0,0x3a2a1e);add('box',x,y-.03,z+dz+S*.25,.07,.008,S*.5,0,0x6a4a30)/* drawbridge */}
    else{add('stone',x+dx,y-.03,z+dz,r?T:L,WH+.03,r?L:T,0,col);crenel(x+dx,y+WH,z+dz,L,r,col)}});
  for(const [dx,dz] of [[-1,-1],[1,-1],[-1,1],[1,1],[0,-1],[-1,0],[1,0]]){const X=x+dx*S,Z=z+dz*S,big=dx&&dz;
    add('tower',X,y-.03,Z,big?.12:.09,WH+(big?.13:.08),big?.12:.09,0,col);add('coneTile',X,y+WH+(big?.1:.05),Z,big?.14:.11,big?.13:.1,big?.14:.11,0,roof);
    if(big){add('cyl',X,y+WH+.22,Z,.004,.06,.004,0,0x444444);add('box',X+.016,y+WH+.265,Z,.03,.018,.002,0,nc)}}
  /* the keep */const kx=x-.06,kz=z-.08;add('stone',kx,y-.03,kz,.22,.42,.22,0,0xe2dccf);crenel(kx,y+.39,kz-.11,.22,0,0xe2dccf);crenel(kx,y+.39,kz+.11,.22,0,0xe2dccf);crenel(kx-.11,y+.39,kz,.22,Math.PI/2,0xe2dccf);crenel(kx+.11,y+.39,kz,.22,Math.PI/2,0xe2dccf);
  for(const [dx,dz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){add('tower',kx+dx*.11,y+.2,kz+dz*.11,.05,.24,.05,0,0xe2dccf);add('coneTile',kx+dx*.11,y+.44,kz+dz*.11,.065,.08,.065,0,roof)}
  add('cyl',kx,y+.39,kz,.005,.16,.005,0,0x444444);add('box',kx+.03,y+.5,kz,.06,.036,.003,0,nc);
  for(let f=1;f<4;f++)for(const sd of [-1,1])add('box',kx+sd*.05,y+f*.1,kz+.111,.016,.03,.003,0,0x2a2420);
  /* the great hall and a chapel in the bailey */
  house(x+.16,y,z-.06,Math.PI/2,.24,.12,.08,'stone',0xd8d0c0,'tiles',roof,true,{hk:.3,annex:false,garden:false,lamp:false,fenceCol:0x8a6a46});
  add('stone',x-.18,y-.03,z+.18,.1,.09,.16,0,0xe8e2d4);add('tiles',x-.18,y+.06,z+.18,.12,.05,.18,Math.PI/2,roof);add('tower',x-.18,y-.03,z+.1,.035,.16,.035,0,0xe8e2d4);add('coneTile',x-.18,y+.13,z+.1,.045,.1,.045,0,roof);
  /* stables, a well and banners */add('timber',x+.18,y-.02,z+.22,.16,.05,.06,0,0x8a6a4a);add('thatch',x+.18,y+.03,z+.22,.17,.035,.07,0,0xffffff);
  add('cyl',x+.05,y-.02,z+.2,.025,.03,.025,0,0x9a948a);for(let k=0;k<4;k++){const a=k*1.57+.3;add('box',x+Math.cos(a)*S*1.02,y+WH*.5,z+Math.sin(a)*S*1.02,.022,.05,.002,-a+Math.PI/2,nc)}}
/* a town wall: stone in the middle ages, a palisade before, with towers and gates where the main streets leave */
function townWall(n,plan,cx,cz,R,e,far,i0){if(R<.3)return;const stone=e>=3,col=stone?0xcfc8b8:0x6e5236,H=stone?.09:.07,L=.075,K=Math.max(16,Math.ceil(6.283*R/L)),ph=hash(i0*4.4)*6.283,gates=[];
  for(const st of plan.streets){if(!st.main)continue;for(const q of st.pts){const d=Math.hypot(q[0]-cx,q[1]-cz);if(d>=R){gates.push(Math.atan2(q[1]-cz,q[0]-cx));break}}}
  const rad=t=>R*(1+.07*Math.sin(3*t+ph)+.04*Math.sin(5*t+ph*1.7)),pt=t=>[cx+Math.cos(t)*rad(t),cz+Math.sin(t)*rad(t)];
  const nearGate=t=>gates.some(g=>Math.abs(((t-g+9.42)%6.283)-3.14)<.055/R+.02);
  for(let k=0;k<K;k++){const t0=k/K*6.283,t1=(k+1)/K*6.283,[x0,z0]=pt(t0),[x1,z1]=pt(t1),mx=(x0+x1)/2,mz=(z0+z1)/2,ti=tileAt(mx,mz);
    if(ti<0||isWater(ti)||owner[ti]!==n.id)continue;const y=groundY(mx,mz);if(y<waterY+.02)continue;
    if(nearGate((t0+t1)/2)){continue}
    const len=Math.hypot(x1-x0,z1-z0)+.004,rot=Math.atan2(-(z1-z0),x1-x0);
    if(stone){add('stone',mx,y-.03,mz,len,H+.03,.024,rot,col);if(!far)crenel(mx,y+H,mz,len,rot,col)}
    else{for(let q=0;q<3;q++){const f=(q+.5)/3;add('cyl',x0+(x1-x0)*f,y-.03,z0+(z1-z0)*f,.012,H+.03+hash(k*3+q)*.02,.012,0,col)}}
    if(k%7===0){add(stone?'tower':'cyl',mx,y-.03,mz,stone?.065:.03,H+.08,stone?.065:.03,0,col);if(stone)add('coneTile',mx,y+H+.05,mz,.08,.07,.08,0,ROOF_SLATE[0])}}
  for(const g of gates){const [gx,gz]=pt(g),ti=tileAt(gx,gz);if(ti<0||isWater(ti)||owner[ti]!==n.id)continue;const y=groundY(gx,gz),tx=-Math.sin(g),tz=Math.cos(g),o=.045;
    for(const sd of [-1,1]){const X=gx+tx*o*sd,Z=gz+tz*o*sd;add(stone?'tower':'cyl',X,y-.03,Z,stone?.06:.035,H+.1,stone?.06:.035,0,col);if(stone)add('coneTile',X,y+H+.07,Z,.075,.07,.075,0,ROOF_SLATE[0])}
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
function facade(x,y,z,rot,w,d,hh,hk,floors,plain){const q=plain?0:hash(hk*71+5),sc=SHUTTER[(q*SHUTTER.length)|0],fr=0xe8dfcc,dz=d/2+.0012;
  const dx=(q<.5?-1:1)*w*.22;P('box',x,y,z,rot,dx,dz,0,.017,.027,.003,0x3b2a1e);P('box',x,y,z,rot,dx,dz+.0006,.027,.021,.004,.003,fr);
  const fh=hh/floors;
  for(let f=0;f<floors;f++){const wy=fh*f+Math.min(fh*.42,.022),n=w>.115?3:2;
    for(let k=0;k<n;k++){const wxp=-w*.36+k*w*.72/(n-1);if(f===0&&Math.abs(wxp-dx)<.02)continue;
      P('box',x,y,z,rot,wxp,dz,wy,.016,.015,.002,fr);P('box',x,y,z,rot,wxp,dz+.0007,wy+.0015,.012,.012,.002,0x1d232a);
      if(q>.25){P('box',x,y,z,rot,wxp-.0115,dz+.0004,wy,.006,.015,.002,sc);P('box',x,y,z,rot,wxp+.0115,dz+.0004,wy,.006,.015,.002,sc)}
      if(f===0&&hash(hk*13+k)<.45){P('box',x,y,z,rot,wxp,dz+.003,wy-.006,.017,.004,.005,0x6a4a30);P('box',x,y,z,rot,wxp,dz+.003,wy-.002,.015,.003,.004,[0xd8504a,0xe8d84a,0xf2f2f2,0x9a6ad0][(hash(hk+k*3)*4)|0])}}
    for(const sd of [-1,1])if(hash(hk*5+f+sd)<.7){P('box',x,y,z,rot+Math.PI/2,0,sd*(w/2+.0012),wy,.014,.014,.002,fr);P('box',x,y,z,rot+Math.PI/2,0,sd*(w/2+.0019),wy+.001,.011,.011,.002,0x1d232a)}}}
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
function yard(x,z,rot,w,d,pd,pw,hk){const c=Math.cos(rot),s=Math.sin(rot);
  const L=(name,lx,lz,dy,sx,sy,sz,col,er)=>{const X=x+lx*c+lz*s,Z=z-lx*s+lz*c,Y=groundY(X,Z);if(Y<waterY+.02)return;add(name,X,Y+dy,Z,sx,sy,sz,rot+(er||0),col);if(name==='bed'||name==='timber'||name==='hay')bareRect(X,Z,rot+(er||0),sx,sz)};
  const z0=-d/2-.008,z1=z0-pd,zc=(z0+z1)/2,fc=0x7d6c55;
  L('fence',-pw/2,zc,0,.004,.013,pd,fc);L('fence',pw/2,zc,0,.004,.013,pd,fc);L('fence',0,z1,0,pw,.013,.004,fc);
  for(let q=0;q<=Math.round(pd/.04);q++){const zz=z0-q*pd/Math.round(pd/.04);L('fence',-pw/2,zz,0,.006,.018,.006,0x5e4f3c);L('fence',pw/2,zz,0,.006,.018,.006,0x5e4f3c)}
  const h2=hash(hk*91+7),nb=1+((h2*3)|0),bw=pw*.8/nb;
  for(let b=0;b<nb;b++){const bx=-pw*.4+bw*(b+.5),bl=pd*(.45+hash(hk*13+b)*.25);L('bed',bx,z1+.012+bl/2,-.004,bw*.82,.008,bl,[0xffffff,0xe0d0c0,0xd8e0c8][b%3])}
  const ex=hash(hk*29+1),zx=z0-pd*.22,xx=(hash(hk*7)<.5?-1:1)*pw*.28;
  if(ex<.28){L('hay',xx,zx,0,.045,.05,.045,0xe8d8a8);L('hay',xx+.04,zx-.02,0,.035,.04,.035,0xe8d8a8)}
  else if(ex<.48){L('timber',xx,zx,0,.06,.022,.022,0xb09070)}
  else if(ex<.68){L('timber',xx,zx,-.01,.05,.04,.045,0xd0c8c0);L('hipThatch',xx,zx,.028,.064,.04,.065,0xe0d8cc)}
  else if(ex<.85){L('townTree',xx,zx,-.01,.13,.13,.13,0x5e8a3a)}}
/* ---------- regional architecture ---------- */
const PASTEL=[0xe8a8a0,0x9ec8e0,0xf0d070,0xa8d8a0,0xf0c090,0xe8e0f0];
function flatHouse(x,y,z,rot,w,d,hh,col,hk,opt){/* flat-roofed house: parapet, small windows, sometimes a dome or a wind tower */
  add('adobe',x,y-.02,z,w,hh+.02,d,rot,col);const pc=col;
  for(const [dx,dz,sx,sz] of [[0,d/2-.003,w,.006],[0,-d/2+.003,w,.006],[w/2-.003,0,.006,d],[-w/2+.003,0,.006,d]])P('adobe',x,y+hh,z,rot,dx,dz,0,sx,.008,sz,pc);
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
    flatHouse(x,y,z,rot,.1,.085,h,col,hk,{});if(o<.7)P('hipTile',x,y+h,z,rot,0,0,0,.12,.03,.105,pick([0xc0603a,0xb85a36,0xa85030]));
    if(e>=3&&o>.5)facade(x,y,z,rot,.1,.085,h,hk,h>.07?2:1,false);return true}
  if(cu==='nordic'){
    if(e===0||e>=5)return false;
    if(e<=2||core<.3){add('timber',x,y-.02,z,.15,.052,.065,rot,pick([0xc8b8a8,0xb0a090,0xd0c4b4]));P('hipThatch',x,y+.03,z,rot,0,0,0,.18,.06,.1,pick([0x8aa860,0x7a9850,0x98b070]));
      facade(x,y,z,rot,.15,.065,.032,hk,1,true);return true}
    add('plaster',x,y-.02,z,.1,.075,.08,rot,pick([0xb04a3a,0xa84434,0xd8b050,0xf0ece4,0x8aa0b8]));framing(x,y,z,rot,.1,.08,.055,1);
    P('tiles',x,y+.055,z,rot,0,0,0,.115,.05,.095,0x3e3e42);facade(x,y,z,rot,.1,.08,.055,hk,1);chimney(x,y+.03,z,rot,.1,.08,y+.1,hk,o<.4);return true}
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
    const h=.045+core*.04,col=pick(PASTEL);add('adobe',x,y-.02,z,.1,h+.02,.085,rot,col);P('hipTile',x,y+h,z,rot,0,0,0,.118,.028,.1,0xb85a36);
    facade(x,y,z,rot,.1,.085,h,hk,h>.07?2:1);if(o>.6)P('box',x,y,z,rot,0,.047,h*.62,.07,.004,.012,0x5a3a26);return true}
  return false}
function dwelling(n,x,y,z,rot,e,hk,k,core){core=core||0;
  if(e<=5&&n&&cultOf(n)!=='west'&&cultureDwelling(cultOf(n),n,x,y,z,rot,e,hk,k,core))return;const tall=1+(e>=3&&e<=5?core*core*(.6+hk*.9):0);
  const pick=a=>a[(hk*a.length)|0],o={hk:hash(hk*97+1),annex:e>=1,garden:e>=1&&e<=5,lamp:e>=4&&e<=5&&k%3===0,fenceCol:e>=3?0xe8e2d4:0x8a6a46};
  const A=AR(),WALLS=A.walls,ROOF_RED=A.red,ROOF_SLATE=A.slate;
  if(e===0){add('cyl',x,y-.02,z,.08,.04,.08,0,0x7d6248);add('coneThatch',x,y+.02,z,.11,.07,.11,rot);return}
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
  nordic:{label:'Northland',desc:'Falu red, ochre and steep dark roofs',walls:[0x8e2f25,0xb36b2a,0x34403f,0xe8e0cc,0x7a2a22,0x8e2f25],red:[0x2f3436,0x3a3f40,0x4a3a2e],slate:[0x2f3436,0x3a3f40],roofH:1.2},
  harbour:{label:'Harbour Town',desc:'Bright painted fronts and gabled rows',walls:[0xe9b44c,0x6fa8c8,0xd9786a,0x8fbf8a,0xf0e6d8,0xc79ad1],red:[0x8e3f2c,0x7c3a2b],slate:[0x4f5864,0x3f4652],roofH:.95}};
const AR=()=>ARCH[settings.arch]||ARCH.classic;
const AWN=[0xc0392b,0xe0b030,0x2e6fb0,0x3f8f4a,0xe8e2d4,0x9b4fa0];
/* street life for towns near the camera: avenue trees, lamps, road markings, café terraces and gardens */
kit('smog',new THREE.SphereGeometry(.5,14,7),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.2,depthWrite:false,fog:true}),300,false);KITS.smog.mesh.renderOrder=2;BUILD_KITS.push('smog');
kit('moat',unitCyl(28),new THREE.MeshLambertMaterial({color:new THREE.Color(0x3d7488).convertSRGBToLinear()}),400,false);BUILD_KITS.push('moat');
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
    if(ti>=0&&ti<N&&owner[ti]===n.id&&(biome[ti]===4||biome[ti]===8)&&groundY(hx,hz)>waterY+.05)herds.push({x:hx,z:hz,kind:hash(i0+h*3)<.55?'sheep':'cow',n:3+((hash(i0*17+h)*4)|0),seed:i0*7+h})}}}
function harbour(c,cx,cz,e,i0){let d=-1;for(let q=0;q<4;q++){const X=c.x+DX[q],Y=c.y+DY[q];if(X<0||Y<0||X>=W||Y>=H)continue;if(isWater(Y*W+X)){d=q;break}}if(d<0)return;
  const len=e>=SAIL?.55:.32,px=cx+DX[d]*.45,pz=cz+DY[d]*.45,ax=DX[d]?len:.06,az=DY[d]?len:.06;
  add('box',px,waterY-.04,pz,ax,.06,az,0,e>=6?0x9a9a96:0x6b5038);
  for(const s of [-1,0,1])add('cyl',px+DX[d]*len*.45*s,waterY-.15,pz+DY[d]*len*.45*s,.016,.18,.016,0,0x4a3828);
  const boats=e>=SAIL?3:2;for(let k=0;k<boats;k++){const side=k%2?1:-1,t=(k/boats-.3)*len,bx=px+DX[d]*t+DY[d]*.07*side,bz=pz+DY[d]*t+DX[d]*.07*side,rot=DX[d]?0:Math.PI/2;
    add('boat',bx,waterY+.012,bz,.1,.04,.035,rot,hash(i0+k)<.5?0x6b4a2e:0x8a5a3a);add('cyl',bx,waterY+.012,bz,.004,.09,.004,0,0x5a4632);
    if(e<5)add('awning',bx,waterY+.03,bz,.004,.05,.045,rot+Math.PI/2,0xf0ead8)}
  if(e>=SAIL){const wx_=cx+DX[d]*.25+DY[d]*.2,wz_=cz+DY[d]*.25+DX[d]*.2,wy=groundY(wx_,wz_);add(e>=5?'brick':'plaster',wx_,wy-.02,wz_,.14,.08,.09,DX[d]?Math.PI/2:0,0xffffff);add('tiles',wx_,wy+.06,wz_,.15,.05,.11,DX[d]?Math.PI/2:0,ROOF_SLATE[1])}
  if(e>=5){const kx=px+DX[d]*len*.3+DY[d]*.05,kz=pz+DY[d]*len*.3+DX[d]*.05;add('cyl',kx,waterY,kz,.012,.22,.012,0,0xd8a02a);add('box',kx,waterY+.21,kz,DX[d]?.016:.14,.012,DX[d]?.14:.016,0,0xd8a02a)}}
/* grass: a dense field of swaying blades around the camera when zoomed in */
const grassU={uTime:{value:0}};
/* grass: clumps of curved blades, a dense carpet around the camera that thins out at the edge */
const grassGeo=(()=>{const P=[],C=[],r=mulberry32(5),base=[.05,.085,.025],mid=[.15,.25,.06],tip=[.27,.38,.1];
  const v=(p,c)=>{P.push(...p);C.push(...c)};
  for(let k=0;k<11;k++){const a=r()*6.283,d=Math.sqrt(r())*.5,bx=Math.cos(a)*d,bz=Math.sin(a)*d,h=.45+r()*.65,w=.05+r()*.05,fa=r()*6.283,fx=Math.cos(fa),fz=Math.sin(fa),la=r()*6.283,lean=.12+r()*.4,lx=Math.cos(la)*lean,lz=Math.sin(la)*lean;
    const bL=[bx-fx*w,0,bz-fz*w],bR=[bx+fx*w,0,bz+fz*w],m=.55,mL=[bx-fx*w*.6+lx*h*m*m,h*m,bz-fz*w*.6+lz*h*m*m],mR=[bx+fx*w*.6+lx*h*m*m,h*m,bz+fz*w*.6+lz*h*m*m],T=[bx+lx*h,h,bz+lz*h];
    const tone=.8+r()*.4,t=c=>c.map(q=>q*tone);
    v(bL,t(base));v(bR,t(base));v(mR,t(mid));v(bL,t(base));v(mR,t(mid));v(mL,t(mid));v(mL,t(mid));v(mR,t(mid));v(T,t(tip))}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.computeVertexNormals();
  /* normals point mostly up so blades light like a meadow, not like cards */
  const n=g.attributes.normal;for(let i=0;i<n.count;i++){const x=n.getX(i)*.6,y=Math.abs(n.getY(i))*.4+.55,z=n.getZ(i)*.6,l=Math.hypot(x,y,z);n.setXYZ(i,x/l,y/l,z/l)}return g})();
const grassMat=new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:1,envMapIntensity:.55});
grassMat.onBeforeCompile=sh=>{sh.uniforms.uTime=grassU.uTime;sh.vertexShader='uniform float uTime;\n'+sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
  #ifdef USE_INSTANCING
  vec3 ip=vec3(instanceMatrix[3][0],instanceMatrix[3][1],instanceMatrix[3][2]);float gust=sin(uTime*.7+ip.x*.6+ip.z*.4)*.5+.5;float sw=(sin(uTime*2.1+ip.x*9.7+ip.z*6.9)+.5*sin(uTime*3.7+ip.x*15.))*(.4+gust);transformed.x+=sw*.1*position.y*position.y;transformed.z+=sw*.05*position.y*position.y;
  #endif`)};
kit('grass',grassGeo,grassMat,44000,false);
kit('wflower',(()=>{const g=new THREE.SphereGeometry(.5,6,4);g.scale(1,.55,1);return g})(),stdMat({roughness:.7}),4000,false);
kit('pebble',(()=>{const g=new THREE.DodecahedronGeometry(.5,0);g.scale(1,.55,1);return g})(),stdMat({roughness:1}),2500,false);
/* ground the grass must not grow on: house floors, roads, garden beds */
const bare=new Set(),roadBare=new Set(),BC=.035;const bk=(x,z)=>Math.floor(x/BC)*100003+Math.floor(z/BC);
function bareMark(x,z,r){const n=Math.ceil(r/BC);const cx=Math.floor(x/BC),cz=Math.floor(z/BC);for(let a=-n;a<=n;a++)for(let b=-n;b<=n;b++){if((a*a+b*b)*BC*BC>r*r+BC*BC)continue;bare.add((cx+a)*100003+cz+b)}}
function bareRect(x,z,rot,w,d){const c=Math.cos(rot),s=Math.sin(rot);for(let a=-w/2;a<=w/2+1e-6;a+=BC*.8)for(let b=-d/2;b<=d/2+1e-6;b+=BC*.8)bare.add(bk(x+a*c+b*s,z-a*s+b*c))}
const gNoise=makeNoise(9911);
const FLOWERS=[0xf4f0e6,0xf2d23c,0xf0e060,0xc84a3a,0x9a6ad0,0xf6f6ff,0xe8a0c0];
let grassAt={x:1e9,z:1e9,d:0};
function updateGrass(now){grassU.uTime.value=now/1000;
  const kn=['grass','wflower','pebble'];
  if(camDist>11||settings.quality==='low'){if(KITS.grass.mesh.count){kitReset(kn);kitCommit(kn)}grassAt.x=1e9;return}
  if(Math.hypot(camT.x-grassAt.x,camT.z-grassAt.z)<.35&&Math.abs(camDist-grassAt.d)<grassAt.d*.2)return;
  grassAt={x:camT.x,z:camT.z,d:camDist};kitReset(kn);
  const R=Math.min(4.6,camDist*.85+.7),max=settings.quality==='high'?43000:22000,sp=Math.sqrt(Math.PI*R*R/max);
  /* centre the carpet a little ahead of the target, toward where the camera looks */
  const ox=camT.x-Math.sin(camYaw)*R*.25,oz=camT.z-Math.cos(camYaw)*R*.25;
  for(let gx=-R;gx<=R;gx+=sp)for(let gz=-R;gz<=R;gz+=sp){const dd=gx*gx+gz*gz;if(dd>R*R)continue;
    const ax=Math.round((ox+gx)/sp),az=Math.round((oz+gz)/sp),hs=hash(ax*73.1+az*19.7),x=ax*sp+(hs-.5)*sp*.9,z=az*sp+(hash(ax*11.3+az*91.1)-.5)*sp*.9;
    const i=tileAt(x,z);if(i<0)continue;const b=biome[i];if(!(b===4||b===8||b===5||b===9||b===6||b===3))continue;
    if(fieldTiles.has(i)||(scorched&&scorched[i]>0)||bare.has(bk(x,z))||roadBare.has(bk(x,z)))continue;
    if(b===3&&hs<.75)continue;if((b===5||b===6)&&hs<.35)continue;if(occupied.has(i)&&hs<.25)continue;
    const y=groundY(x,z);if(y<waterY+.03)continue;
    const nz=gNoise(x*.35,z*.35,2),pat=gNoise(x*2.2+40,z*2.2,2),fade=1-smooth(R*.72,R,Math.sqrt(dd));if(fade<=.02)continue;
    const tall=(b===8?1.35:b===9?.7:1)*(.65+pat*.8)*(occupied.has(i)?.6:1),s=(.7+hs*.6)*fade;
    const dry=smooth(.45,.75,nz),col=b===8?0xe0c880:b===9?0xb0b098:b===3?0xc8c088:dry>.5?(hs<.5?0xd8cc88:0xcac080):(hs<.33?0xb4d098:hs<.66?0xc4dca8:0xa4c48c);
    add('grass',x,y-.002,z,.03*s,.017*tall*s,.03*s,hs*6.283,col);
    const fh=hash(ax*3.7+az*5.3);
    if(fh<.03*(b===4?1.6:.6)*(1-dry*.5)&&b!==9){const fc=FLOWERS[(hash(ax*9.1+az*2.3)*FLOWERS.length)|0];add('wflower',x+.004,y+.02*tall*s,z,.007*fade,.007*fade,.007*fade,0,fc);
      if(fh<.012)add('wflower',x-.006,y+.016*tall*s,z+.005,.006*fade,.006*fade,.006*fade,0,fc)}
    else if(fh>.993)add('pebble',x,y-.002,z,.012+hs*.012,.01,.012+hs*.01,hs*6,hs<.5?0x8a847a:0x9e978a)}
  kitCommit(kn)}

/* herds wander slowly; birds circle */
let flocks=[];
function updateLife(dt,now){
  TX.river.offset.y=-now/1000*.35;updateGrass(now);
  kitReset(['animal','bird']);
  for(const h of herds){for(let k=0;k<h.n;k++){const s=h.seed*13+k,t=now/1000*.06+hash(s)*20,x=h.x+Math.cos(t+k)*.08*hash(s+1)+(hash(s+2)-.5)*.14,z=h.z+Math.sin(t*.8+k)*.08*hash(s+3)+(hash(s+4)-.5)*.14,y=groundY(x,z),rot=t+k;
    if(h.kind==='sheep'){add('animal',x,y,z,.026,.02,.038,rot,0xf2efe6);add('animal',x+Math.sin(rot)*.022,y+.012,z+Math.cos(rot)*.022,.012,.012,.014,rot,0x2a2622)}
    else{const c=hash(s+5)<.5?0x6b4a32:0x2a2622;add('animal',x,y+.004,z,.03,.026,.05,rot,c);add('animal',x+Math.sin(rot)*.028,y+.016,z+Math.cos(rot)*.028,.016,.016,.018,rot,c)}}}
  if(!flocks.length&&W){for(let f=0;f<6;f++)flocks.push({x:(rng()-.5)*W*.7,z:(rng()-.5)*H*.7,r:1+rng()*2,sp:.15+rng()*.15,ph:rng()*6})}
  for(const f of flocks){const a=now/1000*f.sp+f.ph,fx=f.x+Math.cos(a)*f.r,fz=f.z+Math.sin(a)*f.r,dir=a+Math.PI/2,y=Math.max(groundY(fx,fz),waterY)+1.1;
    for(let k=0;k<7;k++){const row=Math.ceil(k/2),side=k%2?1:-1,bx=fx-Math.cos(dir)*.0+(-Math.sin(-dir))*0,ox=-row*.07,oz=side*row*.06,c=Math.cos(dir),s=Math.sin(dir);
      const px=fx+ox*c-oz*s,pz=fz+ox*s+oz*c,flap=.6+Math.abs(Math.sin(now/120+k))*.8;add('bird',px,y+Math.sin(now/700+k)*.03,pz,.035,.035*flap,.035,-dir+Math.PI/2)}}
  kitCommit(['animal','bird'])}
const occupied=new Set();
function cityLevel(n){return clamp(Math.sqrt(n.pop/Math.max(1,n.cities.length))/2.3,1,10)}
/* ---------- town plans: every town grows its own street network from a centre ---------- */
function chaikin2(p,it){for(let k=0;k<it;k++){const o=[p[0]];for(let i=0;i<p.length-1;i++){const a=p[i],b=p[i+1];o.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75])}o.push(p[p.length-1]);p=o}return p}
/* how far a city sprawls: from the Industrial age big cities grow into metropolises that cover many miles */
function metroRadius(n,c,cap,e){if(e<5||!n)return 0;const m=clamp(Math.sqrt(n.pop/Math.max(1,n.cities.length))*(cap?1.5:1)/40,0,1);
  const ws=clamp(W/112,.6,1.4);return (e===5?lerp(.4,cap?1.8:1.1,m):lerp(.6,cap?3.4:2,m))*ws}
function townPlan(n,c,cap,e){
  const MR=metroRadius(n,c,cap,e),mb=MR>.75?Math.round(MR*4)/4:0;
  const band=e===0?0:e<5?1:e<6?2:3,key=band+'|'+flatSig.length+'|'+(cap?1:0)+'|'+mb;if(c._plan&&c._plan.key===key)return c._plan;
  const R_=mulberry32((c.x*73856093^c.y*19349663^(cap?777:0))>>>0),cx=wx(c.x),cz=wz(c.y),pr=e===0?.06:cap&&e>=3&&e<=4&&cultOf(n)!=='east'?.66:cap?.2:.1;
  /* never build up a mountain: not much higher than the town square, and not on a steep slope */
  const cy0=groundY(cx,cz),bad=(x,z)=>{const t=tileAt(x,z);if(t<0||isWater(t)||biome[t]>=11)return true;const y=groundY(x,z);if(y<waterY+.035||y>cy0+.2)return true;
    return Math.abs(groundY(x+.05,z)-groundY(x-.05,z))+Math.abs(groundY(x,z+.05)-groundY(x,z-.05))>.075};
  const streets=[],slots=[],grid=new Map(),gk=(x,z)=>Math.floor(x/.09)+'_'+Math.floor(z/.09);
  const free=(x,z,r)=>{const gx=Math.floor(x/.09),gz=Math.floor(z/.09);for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++){const L=grid.get((gx+a)+'_'+(gz+b));if(L)for(const o of L)if(Math.hypot(o[0]-x,o[1]-z)<r+o[2])return false}return true};
  const mark=(x,z,r)=>{const k=gk(x,z);if(!grid.has(k))grid.set(k,[]);grid.get(k).push([x,z,r])};
  if(band===0){/* a loose camp: huts gather in little clusters around the fire */
    const huts=[[cx+.09,cz]];for(let k=0;k<70;k++){const b=huts[(R_()*huts.length)|0],a=R_()*6.283,d=.085+R_()*.05,x=b[0]+Math.cos(a)*d,z=b[1]+Math.sin(a)*d;
      if(Math.hypot(x-cx,z-cz)<.07||bad(x,z)||!free(x,z,.04))continue;mark(x,z,.04);huts.push([x,z]);slots.push({x,z,rot:R_()*6.283,w:.1,d:.1,core:0,st:-1,at:0,fx:x,fz:z,dd:Math.hypot(x-cx,z-cz)+R_()*.15})}
    slots.sort((a,b)=>a.dd-b.dd);return c._plan={key,streets,slots,pr}}
  if(mb)return c._plan=organicMetro(c,cap,e,mb,key,R_,cx,cz,pr,bad,free,mark);
  const straight=band>=2?.65:1,len=(cap?2.1:1.4)*(e>=3&&e<=4?(cap?1.15:.85):1)*(band>=2?1.25:1)*(band===3?1.4:1)*Math.sqrt(clamp(W/112,.6,1.4));
  const walk=(x,z,h,L,main)=>{const pts=[[x,z,0]],step=.06;let d=0;
    for(let s=0;s<L/step;s++){let best=null,bc=1e9;const y0=groundY(x,z);
      for(const dh of [-.32,-.16,0,.16,.32]){const hh=h+dh*straight+(R_()-.5)*.12*straight,X=x+Math.cos(hh)*step,Z=z+Math.sin(hh)*step;if(bad(X,Z))continue;
        const cost=Math.abs(groundY(X,Z)-y0)*14+Math.abs(dh)*(main?1.2:.6)+R_()*.08;if(cost<bc){bc=cost;best=[X,Z,hh]}}
      if(!best||bc>1.6)break;x=best[0];z=best[1];h=best[2];d+=step;pts.push([x,z,d])}
    return pts};
  /* main streets leave the square in a few directions; one arm is a street village, five is a star town */
  const nm=e>=3&&e<=4?[3,3,4,4,5,5,6][(R_()*7)|0]:[1,2,2,3,3,3,4,4,5][(R_()*9)|0],a0=R_()*6.283,arms=nm===1?[a0,a0+Math.PI+(R_()-.5)*.6]:Array.from({length:nm},(_,k)=>a0+k*6.283/nm+(R_()-.5)*.7);
  for(const a of arms){const pts=walk(cx+Math.cos(a)*pr,cz+Math.sin(a)*pr,a,len*(.6+R_()*.6),true);if(pts.length>3)streets.push({pts,main:true,base:pr})}
  const mains=streets.length;
  for(let m=0;m<mains;m++){const st=streets[m];let side=R_()<.5?1:-1;
    for(let i=4;i<st.pts.length-2;i+=3+((R_()*4)|0)){if(R_()>(e>=3&&e<=4?.95:.6))continue;const p0=st.pts[i],p1=st.pts[i+1],h=Math.atan2(p1[1]-p0[1],p1[0]-p0[0])+side*(Math.PI/2+(R_()-.5)*.6);side=-side;
      const pts=walk(p0[0],p0[1],h,.25+R_()*.6*(cap?1.3:1),false);if(pts.length>3)streets.push({pts,main:false,base:p0[2]+st.base})}}
  /* plaza frontage first, then plots along every street, both sides */
  const hs=band===1?[.1,.075]:band===2?[.12,.08]:[.11,.1];
  const ring=pr>.5?0:Math.max(5,Math.round(pr*6.283/(hs[0]+.02)));for(let k=0;k<ring;k++){const a=k/ring*6.283+.2,r=pr+hs[1]/2+.03,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;
    if(bad(x,z)||!free(x,z,hs[0]*.45))continue;mark(x,z,hs[0]*.45);slots.push({x,z,rot:Math.atan2(-Math.cos(a),-Math.sin(a)),w:hs[0],d:hs[1],core:1,st:-1,at:0,fx:cx+Math.cos(a)*pr*.8,fz:cz+Math.sin(a)*pr*.8,dd:pr*.5})}
  for(const st of streets)for(const q of st.pts)mark(q[0],q[1],st.main?.035:.025);
  streets.forEach((st,si)=>{const sw=st.main?.035:.025;
    for(let i=1;i<st.pts.length;i++){const p0=st.pts[i-1],p1=st.pts[i],h=Math.atan2(p1[1]-p0[1],p1[0]-p0[0]);
      for(const side of [1,-1]){const dd=st.base+p1[2],core=clamp(1-dd/(cap?1.1:.6),0,1),rural=band===1&&core<(e>=3&&e<=4?.28:.6);
        if(R_()<(rural?.3:band>=2?.28:e>=3?.05:.12))continue;
        /* villages: detached cottages on long plots with gaps of meadow; town cores: houses shoulder to shoulder */
        const w=hs[0]*(.85+R_()*.35),d=hs[1]*(.85+R_()*.3),off=sw+d/2+(rural?.02+R_()*.04:.008+R_()*.012),nx=-Math.sin(h)*side,nz=Math.cos(h)*side,x=p1[0]+nx*off,z=p1[1]+nz*off;
        const rr=rural?Math.max(w,d)*.66:Math.min(w,d)*.5;if(bad(x,z)||!free(x,z,rr))continue;
        let pd=band===1?(rural?.11+R_()*.15:.05+R_()*.04):0;const pw=w*(1.05+R_()*.45),bx=x+nx*(d/2+pd/2),bz=z+nz*(d/2+pd/2);
        if(pd>0&&(bad(bx,bz)||!free(bx,bz,pd*.42)))pd=0;
        mark(x,z,rr);if(pd>0){mark(bx,bz,pd*.45);mark(x+nx*(d/2+pd*.9),z+nz*(d/2+pd*.9),pw*.4)}
        slots.push({x,z,rot:Math.atan2(-nx,-nz),w,d,pd,pw,core,st:si,at:p1[2],fx:p1[0],fz:p1[1],dd:dd+R_()*.25})}}});
  slots.sort((a,b)=>a.dd-b.dd);
  return c._plan={key,streets,slots,pr}}
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
    for(const si of gen){const st=streets[si];for(let i=3;i<st.pts.length-2;i+=4+((R_()*4)|0)){if(R_()>(g?.45:.8))continue;const p0=st.pts[i],p1=st.pts[i+1],side=R_()<.5?1:-1,h=Math.atan2(p1[1]-p0[1],p1[0]-p0[0])+side*(Math.PI/2+(R_()-.5)*.25);
      if(Math.hypot(p0[0]-cx,p0[1]-cz)>MR*1.02)continue;const r=lane(p0[0],p0[1],h,.25+R_()*(g?.4:.6),si);
      if(r.pts.length<4||(!r.hit&&R_()<.65))continue;/* a few quiet cul-de-sacs are fine, not a maze of them */
      const s={pts:r.pts,main:false,base:0},k=streets.length;streets.push(s);addS(s,k);next.push(k)}}
    gen.length=0;gen.push(...next)}
  for(const st of streets)for(const q of st.pts)mark(q[0],q[1],st.main?.04:.03);
  /* plots along every street */
  streets.forEach((st,si)=>{const sw=st.main?.04:.03;
    for(let i=1;i<st.pts.length;i++){const p0=st.pts[i-1],p1=st.pts[i],h=Math.atan2(p1[1]-p0[1],p1[0]-p0[0]),dist=Math.hypot(p1[0]-cx,p1[1]-cz);if(dist<pr+.05)continue;
      const core=clamp(1-dist/MR,0,1),kind=core>.84?2:core>.55?1:0;
      for(const side of [1,-1]){if(R_()<(kind===2?.25:kind===1?.18:.32))continue;
        const w=kind===2?.15:kind===1?.12+R_()*.03:.07+R_()*.015,d=kind===2?.13:kind===1?.1:.062,rr=Math.max(w,d)*.5,off=sw+rr+(kind===0?.012+R_()*.02:.006),nx=-Math.sin(h)*side,nz=Math.cos(h)*side,x=p1[0]+nx*off,z=p1[1]+nz*off;
        if(bad(x,z)||!free(x,z,rr))continue;mark(x,z,rr);
        slots.push({x,z,rot:Math.atan2(-nx,-nz),w,d,pd:0,pw:0,core,st:si,at:p1[2],fx:p1[0],fz:p1[1],dd:dist+R_()*.15,metro:1})}}});
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
    for(const [du,dv,w] of spots){const u=u0+du*inner,v=v0+dv*inner,[x,z]=toW(u,v);if(bad(x,z)||!free(x,z,w*.45))continue;mark(x,z,w*.45);
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
  return [n.id,e,lvl,cap?1:0,gold?1:0,n.festival>0?1:0,c.statue?c.statue.faith:-1,c.siege>.08?1:0,c.riot&&year-c.riot<6?1:0,n.faith,n.wonder,flagKey(n.flag),cultOf(n),settings.arch,terrVer,flatSig.length,oh,far?1:0,Math.round(MR*4),
    n.techs&&n.techs.includes('aviation')?1:0,devTier(n),c.dike?1:0,cap?4:Math.round(townGrowth(c)*5),n.techs&&n.techs.includes('starships')?1:0,ci].join('|')}
function replayCity(Rc){for(const name in Rc.k){const K=KITS[name],a=Rc.k[name],cnt=a.length/19,M=K.mesh.instanceMatrix.array,C=K.mesh.instanceColor.array;
    for(let i=0;i<cnt&&K.k<K.max;i++){M.set(a.subarray(i*19,i*19+16),K.k*16);C.set(a.subarray(i*19+16,i*19+19),K.k*3);K.k++}}
  for(const v of Rc.occ)occupied.add(v);for(const v of Rc.bare)bare.add(v);for(const v of Rc.bg)bgrid.add(v);
  emitters.push(...Rc.em);herds.push(...Rc.hd);cityStreets.push(...Rc.cs);airports.push(...Rc.ap);spaceports.push(...Rc.sp);
  for(const g of Rc.wm){scene.add(g);windmills.push(g)}for(const m of Rc.tf){scene.add(m);townFlags.push(m)}}
let RB0=0;
let sootSig='';
function rebuildCities(){patchSets();RB0=performance.now();{let s='';for(const n of nations)if(n.alive&&n.era>=5&&n.era<=6)s+=n.id+':'+n.era+':'+n.cities.length+';';if(s!==sootSig){sootSig=s;if(typeof colorDirty!=='undefined')colorDirty=true}}
  for(const m of townFlags)scene.remove(m);townFlags=[];airports=[];spaceports=[];bgrid.clear();kitReset(BUILD_KITS);occupied.clear();bare.clear();grassAt.x=1e9;emitters=[];herds=[];cityStreets=[];for(const g of windmills)scene.remove(g);windmills=[];
  for(const n of nations){if(!n.alive)continue;const e=n.era,gold=n.golden>year,lvl=Math.floor(Math.min(10,cityLevel(n)+(gold?1.5:0))*2)/2;
    n.cities.forEach((c,ci)=>{const key=cityKey(n,c,ci,e,lvl,gold,ci===0),hit=CITYCACHE.get(c);if(hit&&(hit.key===key||performance.now()-RB0>14)){if(hit.key!==key)propsDirty=true;replayCity(hit);return}
      const L0={em:emitters.length,hd:herds.length,cs:cityStreets.length,ap:airports.length,sp:spaceports.length,wm:windmills.length,tf:townFlags.length};
      REC={k:{},occ:[],bare:[],bg:[]};try{buildCity(n,c,ci,e,gold,lvl)}finally{const Rc=REC;REC=null;for(const nm in Rc.k)Rc.k[nm]=new Float32Array(Rc.k[nm]);
        Object.assign(Rc,{key,em:emitters.slice(L0.em),hd:herds.slice(L0.hd),cs:cityStreets.slice(L0.cs),ap:airports.slice(L0.ap),sp:spaceports.slice(L0.sp),wm:windmills.slice(L0.wm),tf:townFlags.slice(L0.tf)});CITYCACHE.set(c,Rc)}})}
  buildExtras()}
function buildCity(n,c,ci,e,gold,lvl){{const i0=c.y*W+c.x,cx=wx(c.x),cz=wz(c.y),cap=ci===0;occupied.add(i0);
      const cy=surfY(cx,cz);
      if(e>=1)bareMark(cx,cz,(cap?.3:.15)*.95);cityCenter(n,c,cx,cy,cz,e,cap,i0);
      if(cap)landmark(n,cx,cy,cz,e);
      const CO=cap&&e>=3&&e<=4?2.3:1;if(cap&&n.wonder){const wx_=cx+.42*CO,wz_=cz-.3*CO;wonder(n,wx_,surfY(wx_,wz_),wz_,n.wonder);occupied.add(Math.floor(wz_+H/2)*W+Math.floor(wx_+W/2))}
      if(n.faith>=0&&(cap||hash(i0*3)<.35)){const tx=cx-.32*CO,tz=cz+.2*CO;sacredSite(faiths[n.faith],n,tx,surfY(tx,tz),tz,e,hash(i0)*3,cap)}
      if(c.dike)dikeRing(c,cx,cz);
      MCTX={lvl,cap,tall:[],w:.12};const plan=townPlan(n,c,cap,e),slots=plan.slots,reach=new Map(),youth=cap?1:townGrowth(c);const count=Math.round(youth*(plan.metro?Math.min(slots.length,cap?2800:1300):Math.round(((cap?6:3)+lvl*(cap?3.6:2.3))*(e>=3&&e<=4?(cap?3.4:3.2):e>=1&&e<=5?1.7:e>=6?2.3:1.2)*clamp(W/112,.6,1.4))));
      if(plan.metro)plan.streets.forEach((st,si)=>{if(st.main&&st.base<=plan.pr+.01)reach.set(si,.5)});let k=0,placed=0;c._poi={pts:[],plaza:[cx,cz],r:plan.pr};
      const far=Math.hypot(cx-camT.x,cz-camT.z)>camDist*1.3+2.5;MCTX.far=far;
      for(const sl of slots){if(placed>=count)break;k++;MCTX.w=sl.metro?sl.w:.12;if(far&&plan.metro&&sl.core<.3&&hash(k*7.7)<.75)continue;
        if(e>=5){const bk=Math.round(sl.x*14)+','+Math.round(sl.z*14);if(bgrid.has(bk))continue;bgrid.add(bk)}
        const ti=tileAt(sl.x,sl.z);if(ti<0||owner[ti]!==n.id)continue;
        const hw=sl.w/2,hd=sl.d/2,ca=Math.cos(sl.rot),sa=Math.sin(sl.rot);let mn=1e9,mx=-1e9;
        for(const [a,b] of [[-hw,-hd],[hw,-hd],[-hw,hd],[hw,hd],[0,0]]){const y=groundY(sl.x+a*ca+b*sa,sl.z-a*sa+b*ca);if(y<mn)mn=y;if(y>mx)mx=y}
        if(mn<waterY+.03||mx-mn>.09)continue;placed++;occupied.add(ti);(MCTX.dists||(MCTX.dists=[])).push(Math.hypot(sl.x-cx,sl.z-cz));
        bareRect(sl.x,sl.z,sl.rot,sl.w*1.15,sl.d*1.2);
        const y=mx;if(mx-mn>.012&&e>=1)add('stone',sl.x,mn-.03,sl.z,sl.w*1.04,mx-mn+.03,sl.d*1.04,sl.rot,0xa8a090);
        const hk=hash(c.x*31+c.y*17+k*13);
        const fa=hash(i0*2.7)*6.283,inD=Math.abs(((Math.atan2(sl.z-cz,sl.x-cx)-fa+9.42)%6.283)-3.14)<1;/* the mills crowd into one smoky quarter */
        if(e===5&&sl.core<.4&&inD&&hk<.55&&(MCTX.fac|0)<(cap?7:3+lvl)){MCTX.fac=(MCTX.fac|0)+1;factory(sl.x,y,sl.z,sl.rot,true)}else dwelling(n,sl.x,y,sl.z,sl.rot,e,hk,k,sl.core);
        if(!far&&sl.pd>0&&e>=1&&e<=4&&cultOf(n)!=='mideast'&&cultOf(n)!=='africa')yard(sl.x,sl.z,sl.rot,sl.w,sl.d,sl.pd,sl.pw,hk);
        if(!far&&plan.metro&&e>=5&&e<=6&&sl.core<.5&&hk>.35)frontGarden(sl.x,y,sl.z,sl.rot,Math.min(sl.w,.075),Math.min(sl.d,.075),hk);
        if(sl.st>=0)reach.set(sl.st,Math.max(reach.get(sl.st)||0,sl.at+.12));
        c._poi.pts.push([sl.fx,sl.fz]);
        if(!far&&e>=3&&e<=5&&hk<.16)smokeAt(sl.x,y+.13*(1+sl.core*.6),sl.z,false,.25)}
      if(e===7&&!far&&typeof windTurbine==='function'){/* wind turbines on the open ground beyond the town */const R2=(plan.metro||(cap?1.1:.7))+.45;for(let k=0;k<(cap?5:3);k++){const a=hash(i0*3.1+k)*6.283,x=cx+Math.cos(a)*R2,z=cz+Math.sin(a)*R2,t=tileAt(x,z);if(t<0||isWater(t)||owner[t]!==n.id)continue;windTurbine(x,groundY(x,z),z,.34,hash(i0)*6.28)}}
      if(e>=2&&e<=4&&placed>=(cap?14:18)&&!plan.metro)townWall(n,plan,cx,cz,MCTX.dists.sort((a,b)=>a-b)[Math.floor(MCTX.dists.length*.8)]+.09,e,far,i0);
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
      if(e>=1)harbour(c,cx,cz,e,i0);
      if(e>=1){const t=e<4?0:e<6?1:2;
        plan.streets.forEach((st,si)=>{const lim=reach.get(si);if(!lim)return;const pts=[];
          for(const q of st.pts){if(q[2]>lim)break;pts.push([q[0],q[1]])}
          if(pts.length>1)cityStreets.push({pts:chaikin2(pts,2),w:st.main?(e<3?.04:e<5?.05:.066):(e<3?.028:e<5?.034:.044),t})})}
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
  for(const r of ruins){const age=year-r.year;if(age>260)continue;const i0=r.y*W+r.x;if(occupied.has(i0))continue;const cx=wx(r.x),cz=wz(r.y);
    for(let k=0;k<14;k++){const a=hash(i0*7+k)*6.283,d=.05+hash(i0*3+k)*.3,x=cx+Math.cos(a)*d,z=cz+Math.sin(a)*d,y=groundY(x,z);if(y<waterY+.03)continue;
      const hgt=(.012+hash(i0+k*5)*.04)*(1-age/400);add('stone',x,y-.01,z,.07+hash(k+i0)*.05,hgt,.012,a,0x8a8478);
      if(k%3===0)add('box',x+.02,y,z+.01,.06,.008,.008,a+1,0x2a2420)}
    if(age<25)smokeAt(cx,groundY(cx,cz)+.05,cz,true,.5*(1-age/25))}
  if(typeof buildDeposits==='function')buildDeposits();
  kitCommit(BUILD_KITS);
}

/* ---------- fields & roads (merged ground ribbons) ---------- */
const fieldMat=new THREE.MeshStandardMaterial({map:TX.furrow,vertexColors:true,roughness:1});
const roadMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95});
let fieldMesh=null,roadMesh=null;const fieldTiles=new Set();
const CROPS=[[214,176,70],[196,158,58],[104,150,52],[136,178,64],[132,96,58],[160,150,70],[186,160,48]];
function rebuildFields(){
  const pos=[],uv=[],col=[];fieldTiles.clear();
  const vtx=(x,z,u,v,c)=>{pos.push(x,groundY(x,z)+.012,z);uv.push(u,v);col.push(c[0],c[1],c[2])};
  for(const n of nations){if(!n.alive||n.era<1)continue;const rad=n.era>=4?3:2;
    for(const c of n.cities)for(let dy=-rad;dy<=rad;dy++)for(let dx=-rad;dx<=rad;dx++){const X=c.x+dx,Y=c.y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const i=Y*W+X;
      if(owner[i]!==n.id||occupied.has(i)||fieldTiles.has(i))continue;const b=biome[i];if(!(b===4||b===8||(b===5&&n.era>=3)))continue;
      if(hash(i*5.3)>(n.era>=5?.8:.62))continue;
      const X0=X-W/2,Z0=Y-H/2;if(groundY(X0+.5,Z0+.5)<waterY+.08)continue;
      fieldTiles.add(i);const along=hash(i*2.1)<.5,strips=n.era>=6?1:2+((hash(i*9.7)*3)|0);
      for(let s=0;s<strips;s++){const c0=CROPS[(hash(i*13+s)*CROPS.length)|0],cc=(n.famine>0?[lerp(c0[0],132,.75),lerp(c0[1],104,.75),lerp(c0[2],70,.75)]:c0).map(v=>LIN[v|0]),a0=s/strips+.012,a1=(s+1)/strips-.012;
        for(let q=0;q<3;q++){const b0=q/3+.02*(q===0),b1=(q+1)/3-.02*(q===2);
          const pt=(a,b)=>along?[X0+a,Z0+b]:[X0+b,Z0+a];
          const p00=pt(a0,b0),p10=pt(a1,b0),p01=pt(a0,b1),p11=pt(a1,b1),L=strips*1.2;
          vtx(p00[0],p00[1],0,b0*3,cc);vtx(p01[0],p01[1],0,b1*3,cc);vtx(p11[0],p11[1],L/strips,b1*3,cc);
          vtx(p00[0],p00[1],0,b0*3,cc);vtx(p11[0],p11[1],L/strips,b1*3,cc);vtx(p10[0],p10[1],L/strips,b0*3,cc)}}}}
  if(!fieldMesh){fieldMesh=new THREE.Mesh(new THREE.BufferGeometry(),fieldMat);fieldMesh.receiveShadow=true;fieldMesh.frustumCulled=false;scene.add(fieldMesh)}
  const g=freshGeo(fieldMesh);g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.deleteAttribute('normal');g.computeVertexNormals();g.computeBoundingSphere();
}
TX.river=canvasTex(64,(x,s)=>{x.fillStyle='#ffffff';x.fillRect(0,0,s,s);for(let i=0;i<40;i++){x.strokeStyle=`rgba(255,255,255,${.3+trand()*.4})`;x.fillStyle='rgba(180,210,230,.35)';const px=trand()*s,py=trand()*s;x.fillRect(px,py,2+trand()*10,1.5)}});
TX.river.encoding=THREE.sRGBEncoding;
const riverMat=new THREE.MeshStandardMaterial({map:TX.river,color:colL(0x3f86ad),roughness:.1,metalness:.05,transparent:true,opacity:.9,envMapIntensity:1.2});
let riverMesh=null;
function chaikin(p,it){for(let k=0;k<it;k++){const o=[p[0]];for(let i=0;i<p.length-1;i++){const a=p[i],b=p[i+1];o.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25,a[2]*.75+b[2]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75,a[2]*.25+b[2]*.75])}o.push(p[p.length-1]);p=o}return p}
function brooks(){const out=[],src=[];for(let i=0;i<N;i++){if(isWater(i)||river[i]||biome[i]>=11)continue;const a=h[i]-sea,m=baseMoist[i]+moistD[i];if(a<.04||a>.34||m<.4||hash(i*9.13)>.07)continue;src.push(i)}
  const taken=new Uint8Array(N);
  for(const s of src){if(taken[s])continue;const path=[s];let cur=s;
    for(let k=0;k<30;k++){const x=cur%W,y=(cur/W)|0;let best=-1,bh=h[cur];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const q=Y*W+X;if(h[q]<bh-.0005){bh=h[q];best=q}}
      if(best<0)break;path.push(best);cur=best;if(isWater(best)||river[best]||taken[best]||marshAt(best))break}
    if(path.length<4)continue;for(const t of path)taken[t]=1;out.push(path)}
  return out}
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
function rebuildRoads(){roadBare.clear();grassAt.x=1e9;if(ribcVer!==terrVer){RIBC.clear();ribcVer=terrVer}
  const P3=[[],[],[]],U3=[[],[],[]];
  kitReset(['bridge']);const bridged=new Set();
  const rib=(ax,az,bx,bz,w,t)=>{const L=Math.hypot(bx-ax,bz-az);if(L<1e-4)return;const S=Math.max(1,Math.ceil(L/.1)),nx=-(bz-az)/L*w/2,nz=(bx-ax)/L*w/2,rep=t===2?3:t===1?w*40:2;
    for(let s=0;s<=S;s++){const x=lerp(ax,bx,s/S),z=lerp(az,bz,s/S),ti=tileAt(x,z);if(ti>=0&&river[ti]&&!bridged.has(ti)&&groundY(x,z)>waterY){bridged.add(ti);const rot=Math.atan2(bx-ax,bz-az),y=groundY(x,z)+.04,len=.24+.05*river[ti],col=t===0?0x6b4a2e:t===1?0xb8b0a2:0x9a9a96;
      add('bridge',x,y,z,w*1.5,.02,len,rot,col);add('bridge',x+Math.cos(rot)*w*.75,y+.015,z-Math.sin(rot)*w*.75,.006,.02,len,rot,col);add('bridge',x-Math.cos(rot)*w*.75,y+.015,z+Math.sin(rot)*w*.75,.006,.02,len,rot,col)}}
    {const D=discOff(Math.ceil((w*.5+.012)/BC)),st=Math.max(1,Math.round(w/BC*.5));for(let s=0;s<=S;s+=st){const X=Math.floor(lerp(ax,bx,s/S)/BC),Z=Math.floor(lerp(az,bz,s/S)/BC);for(const [a,b] of D)roadBare.add((X+a)*100003+Z+b)}}
    for(let s=0;s<S;s++){const t0=s/S,t1=(s+1)/S,x0=lerp(ax,bx,t0),z0=lerp(az,bz,t0),x1=lerp(ax,bx,t1),z1=lerp(az,bz,t1);
      const b0=tileAt(x0,z0),b1=tileAt(x1,z1),y0=groundY(x0,z0)+(b0>=0&&river[b0]?.06:.018),y1=groundY(x1,z1)+(b1>=0&&river[b1]?.06:.018),v0=t0*L*rep/(w*8),v1=t1*L*rep/(w*8);
      P3[t].push(x0+nx,y0,z0+nz,x1-nx,y1,z1-nz,x0-nx,y0,z0-nz, x0+nx,y0,z0+nz,x1+nx,y1,z1+nz,x1-nx,y1,z1-nz);
      U3[t].push(0,v0,1,v1,1,v0, 0,v0,0,v1,1,v1)}};
  /* roads: towns link to their nearest connected neighbour along the easiest ground (valleys, fords, existing roads) */
  const used=new Uint8Array(N),lines=[];
  for(const n of nations){if(!n.alive||n.cities.length<2)continue;const e=n.era,t=e<4?0:e<6?1:2,w=e<3?.055:e<5?.07:.1;
    const conn=[n.cities[0]],rest=n.cities.slice(1);
    while(rest.length){let bi=0,bj=0,bd=1e9;for(let i=0;i<rest.length;i++)for(let j=0;j<conn.length;j++){const d=Math.hypot(rest[i].x-conn[j].x,rest[i].y-conn[j].y);if(d<bd){bd=d;bi=i;bj=j}}
      const a=rest.splice(bi,1)[0],b=conn[bj];conn.push(a);if(bd>22)continue;
      const path=roadPath(a,b,n.id,used);if(path)lines.push({path,w,t})}}
  for(const n of nations){if(!n.alive||!n.cities.length)continue;for(const m of n.trade){const B=nations[m];if(!B||!B.alive||m<n.id||!B.cities.length||!n.nb.has(m))continue;
    const path=roadPath(n.cities[0],B.cities[0],-1,used);if(path){const e=Math.min(n.era,B.era);lines.push({path,w:e<3?.05:e<5?.065:.09,t:e<4?0:e<6?1:2})}}}
  const cached=(key,t,fn)=>{let c=RIBC.get(key);const K=KITS.bridge;
    if(!c){const p0=P3[t].length,u0=U3[t].length,b0=K.k,bare=[];roadBare.add=v=>{bare.push(v);return Set.prototype.add.call(roadBare,v)};try{fn()}finally{delete roadBare.add}
      c={P:P3[t].slice(p0),U:U3[t].slice(u0),bare,bn:K.k-b0,bm:K.mesh.instanceMatrix.array.slice(b0*16,K.k*16),bc:K.mesh.instanceColor?K.mesh.instanceColor.array.slice(b0*3,K.k*3):null};if(RIBC.size>5000)RIBC.clear();RIBC.set(key,c);return}
    const A=P3[t],B=U3[t];for(let i=0;i<c.P.length;i++)A.push(c.P[i]);for(let i=0;i<c.U.length;i++)B.push(c.U[i]);for(const v of c.bare)roadBare.add(v);
    if(c.bn&&K.k+c.bn<=K.max){K.mesh.instanceMatrix.array.set(c.bm,K.k*16);if(c.bc&&K.mesh.instanceColor)K.mesh.instanceColor.array.set(c.bc,K.k*3);K.k+=c.bn}};
  for(const L of lines){const pa=L.path;cached('L'+L.t+'|'+L.w+'|'+pa.length+'|'+pa[0]+'|'+pa[pa.length>>1]+'|'+pa[pa.length-1],L.t,()=>{const pts=chaikin2(pa.map(j=>[wx(j%W)+(hash(j*3.1)-.5)*.25,wz((j/W)|0)+(hash(j*7.3)-.5)*.25]),3);
    for(let k=0;k<pts.length-1;k++)rib(pts[k][0],pts[k][1],pts[k+1][0],pts[k+1][1],L.w,L.t)})}
  for(const st0 of cityStreets){/* thin out street points: short segments cost as much as long ones */const P0=st0.pts,q=[P0[0]];for(let k=1;k<P0.length;k++){const l=q[q.length-1];if(k===P0.length-1||Math.hypot(P0[k][0]-l[0],P0[k][1]-l[1])>=.1)q.push(P0[k])}const st={pts:q,w:st0.w,t:st0.t};
    const f=q[0],m=q[q.length>>1],l=q[q.length-1];cached('S'+st.t+'|'+st.w+'|'+q.length+'|'+f[0].toFixed(3)+','+f[1].toFixed(3)+'|'+m[0].toFixed(3)+','+m[1].toFixed(3)+'|'+l[0].toFixed(3)+','+l[1].toFixed(3),st.t,()=>{
    for(let k=0;k<st.pts.length-1;k++){const a=st.pts[k],b=st.pts[k+1];if(groundY(a[0],a[1])>waterY+.03&&groundY(b[0],b[1])>waterY+.03)rib(a[0],a[1],b[0],b[1],st.w,st.t)}})}
  kitCommit(['bridge']);if(riverVer!==terrVer){riverVer=terrVer;rebuildRivers()}grassAt.x=1e9;
  for(let t=0;t<3;t++){if(!roadMeshes[t]){const m=new THREE.Mesh(new THREE.BufferGeometry(),ROADMATS[t]);m.receiveShadow=true;m.frustumCulled=false;m.renderOrder=1;scene.add(m);roadMeshes[t]=m}
    const g=freshGeo(roadMeshes[t]);g.setAttribute('position',new THREE.Float32BufferAttribute(P3[t],3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U3[t],2));const nm=new Float32Array(P3[t].length);for(let q=1;q<nm.length;q+=3)nm[q]=1;g.setAttribute('normal',new THREE.BufferAttribute(nm,3));g.computeBoundingSphere()}
}

/* ---------- forests ---------- */
function rebuildTrees(){
  kitReset(TREE_KITS);const dens=settings.quality==='high'?1:settings.quality==='medium'?.65:.4,farm=countryside();
  /* trees near towns are drawn at a believable size next to the houses */
  const near=new Float32Array(N).fill(1);for(const n of nations)if(n.alive)for(const c of n.cities)for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const X=c.x+dx,Y=c.y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const d=Math.hypot(dx,dy);near[Y*W+X]=Math.min(near[Y*W+X],.5+smooth(1,3.2,d)*.5)}
  for(let i=0;i<N;i++){const b=biome[i];if(occupied.has(i)||fieldTiles.has(i)||farm.has(i)||(scorched&&scorched[i]>0)||fires.has(i))continue;
    const x0=i%W-W/2,z0=((i/W)|0)-H/2,lat=1-Math.abs(((i/W)|0)/(H-1)-.5)*2;let n=0,type='broad';
    if(marshAt(i)){/* a marsh: pools of standing water, reeds and a few willows */for(let t=0;t<4;t++){const x=x0+.1+hash(i*2.3+t)*.8,z=z0+.1+hash(i*5.1+t)*.8,y=groundY(x,z);if(y<waterY+.01)continue;const s=.12+hash(i+t*9)*.22;add('puddle',x,y-.004,z,s,.006,s*.7,hash(i*t+1)*6)}
      for(let t=0;t<16;t++){const x=x0+hash(i*3.7+t)*.98,z=z0+hash(i*6.3+t*2)*.98,y=groundY(x,z);if(y<waterY+.01)continue;add('reed',x,y-.003,z,.008,.05+hash(i*t+3)*.04,.008,0,hash(i+t)<.5?0x6a7a3a:0x8a7a48)}
      if(hash(i*4.4)<.5){const x=x0+.5,z=z0+.5,y=groundY(x,z);if(y>waterY+.02)add('broad',x,y-.01,z,.55,.6,.55,hash(i)*6,0x5f7a3a)}continue}
    if(b===5){n=19;type=lat<.45||climate.temp<.4?'conifer':'mix'}else if(b===6){n=10;type='jungle'}else if(b===4){n=hash(i*1.3)<.4?3:0;type='broad'}
    else if(b===8){n=hash(i*1.3)<.3?1:0;type='acacia'}else if(b===9){n=hash(i*1.3)<.55?3:0;type='conifer'}else if(b===3){n=hash(i*1.3)<.3&&lat>.5?1:0;type='palm'}
    else if(b===11){n=5;type='mount'}else if(b===12){n=3;type='rock'}else if(b===7){n=hash(i*1.3)<.3?1:0;type='rock'}
    if((b===4||b===8)&&dens>.5&&settings.quality!=='high'){const tn=b===4?3:2;for(let t=0;t<tn;t++){const x=x0+hash(i*2.7+t*5)*.96+.02,z=z0+hash(i*4.3+t*7)*.96+.02,y=groundY(x,z);if(y>waterY+.04)add('tuft',x,y-.004,z,.016,.022+hash(i+t)*.014,.016,hash(i*t),b===4?0x4e7232:0x8a8a44)}
      if(hash(i*8.1)<.22){const fc=[0xe8d84a,0xd8504a,0xf2f2f2,0x9a6ad0,0xf0a040][(hash(i*3.9)*5)|0];for(let t=0;t<5;t++){const x=x0+hash(i*6.1+t)*.9+.05,z=z0+hash(i*1.9+t*3)*.9+.05,y=groundY(x,z);if(y>waterY+.04)add('flower',x,y+.006,z,.012,.012,.012,0,fc)}}}
    if(owner[i]>=0&&nations[owner[i]].era>=3&&type!=='rock')n=Math.round(n*.45);
    const lod=(()=>{const dd=Math.hypot(x0+.5-camT.x,z0+.5-camT.z);return dd>camDist*1.6+6?.3:dd>camDist*1.1+3?.6:1})();n=Math.round(n*dens*lod);
    for(let t=0;t<n;t++){const x=x0+.08+hash(i*3.1+t)*.84,z=z0+.08+hash(i*7.7+t)*.84,y=groundY(x,z);if(y<waterY+.05)continue;
      const s=(.62+hash(i*11.3+t)*.5)*near[i],hv=hash(i*5.9+t);
      if(type==='rock'||(type==='mount'&&hv<.45)){if(hv<.6)add('rock',x,y-.03,z,.08+hv*.25,.06+hv*.16,.08+hv*.2,hv*6,hv<.3?0x8a8378:0x9a9488);continue}
      if(type==='mount'){if(y<shapeH(.8))add('conifer',x,y-.01,z,s*.85,s*.95,s*.85,hv*6,0x2f4a30);continue}
      if((type==='mix'||type==='conifer'||type==='jungle')&&hv<.45&&lod>.5)add('bush',x+.04,y-.01,z+.03,s*.9,s*.7,s*.9,hv*6,type==='jungle'?0x3f6a2a:0x45602e);
      let k=type;if(type==='mix')k=hv<.4?'conifer':'broad';if(type==='jungle')k=hv<.35?'palm':'broad';if(type==='acacia')k='broad';
      const col=k==='conifer'?(hv<.5?0x27412a:0x31502f):k==='palm'?0x5d8a3a:type==='jungle'?(hv<.5?0x2f6a32:0x3d7a35):(hv<.25?0x3a6428:hv<.5?0x46702e:hv<.75?0x527a32:0x5e7f30);
      if(type==='acacia')add('broad',x,y-.01,z,s*1.2,s*.55,s*1.2,hv*6,0x7a8a3c);else add(k,x,y-.01,z,s,s,s,hv*6,col);
      if(hv>.8&&k!=='palm')add('bush',x+.06,y-.01,z+.04,s,s,s,0,0x4f7a36)}}
  /* hedgerows along field edges and orchards near villages */
  if(dens>.4)for(const i of fieldTiles){const X=i%W,Y=(i/W)|0;for(let d=0;d<4;d++){const nx=X+DX[d],ny=Y+DY[d];if(nx<0||ny<0||nx>=W||ny>=H)continue;const j=ny*W+nx;if(fieldTiles.has(j)||hash(i*7+d)<.5)continue;
    for(let q=0;q<9;q++){if(hash(i*17+d*3+q)<.2)continue;const t=(q+.5)/9+(hash(i*5+q)-.5)*.06,ex=wx(X)+(DX[d]?DX[d]*.48:t-.5),ez=wz(Y)+(DY[d]?DY[d]*.48:t-.5),ey=groundY(ex,ez);if(ey<waterY+.04)continue;
      const hs=hash(i*13+d*5+q),f=near[i];if(hs<.14)add('broad',ex,ey-.01,ez,(.4+hs)*f,(.42+hs)*f,(.4+hs)*f,q,0x4f7a36);else add('bush',ex,ey-.01,ez,(.5+hs*.3)*f,(.45+hs*.4)*f,(.5+hs*.3)*f,q,hs<.6?0x456f32:0x557a3a)}}}
  for(const n of nations){if(!n.alive||n.era<2)continue;for(const c of n.cities){for(let q=0;q<2;q++){const a=hash(c.x*31+c.y*7+q)*6.283,X=Math.round(c.x+Math.cos(a)*1.6),Y=Math.round(c.y+Math.sin(a)*1.6);
    if(X<0||Y<0||X>=W||Y>=H)continue;const j=Y*W+X;if(owner[j]!==n.id||occupied.has(j)||fieldTiles.has(j)||biome[j]!==4||hash(j*1.7)>.5)continue;
    for(let gx=0;gx<4;gx++)for(let gz=0;gz<4;gz++){const ox=wx(X)-.3+gx*.2,oz=wz(Y)-.3+gz*.2,oy=groundY(ox,oz);if(oy>waterY+.04)add('broad',ox,oy-.01,oz,.24,.22,.24,gx+gz,0x5e8f3a)}}}}
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
kit('pLeg',limbGeo(1,1,1),figMat,2400,false);kit('pArm',limbGeo(1,1,1),figMat,2400,false);
kit('pTorso',upGeo(new THREE.CylinderGeometry(.42,.5,1,8)),figMat,1200,false);
kit('pHead',new THREE.SphereGeometry(.5,10,8),figMat,1200,false);
kit('pHair',new THREE.SphereGeometry(.5,10,6,0,Math.PI*2,0,Math.PI*.55),figMat,1200,false);
kit('pSkirt',(()=>{const g=new THREE.CylinderGeometry(.35,.62,1,10,1,true);g.translate(0,-.5,0);return g})(),stdMat({roughness:.85,side:THREE.DoubleSide}),1200,false);
kit('pCone',upGeo(new THREE.ConeGeometry(.5,1,10)),figMat,1200,false);kit('pBrim',new THREE.CylinderGeometry(.5,.5,1,12),figMat,1200,false);
kit('pTri',upGeo(new THREE.ConeGeometry(.5,1,3)),figMat,600,false);
kit('pStick',limbGeo(1,1,1),figMat,1200,false);kit('pPack',new THREE.BoxGeometry(1,1,1),figMat,1200,false);
kit('pShield',(()=>{const g=new THREE.CylinderGeometry(.5,.5,1,12);g.rotateZ(Math.PI/2);return g})(),figMat,800,false);
const FIG_KITS=['pLeg','pArm','pTorso','pHead','pHair','pSkirt','pCone','pBrim','pTri','pStick','pPack','pShield'];
/* add with heading (ry) then a swing around the local x axis (rx) and a sideways lean (rz) */
const dummyR=new THREE.Object3D();dummyR.rotation.order='YXZ';
function addR(name,x,y,z,sx,sy,sz,ry,rx,rz,hex){const K=KITS[name];if(K.k>=K.max)return;
  dummyR.position.set(x,y,z);dummyR.rotation.set(rx||0,ry||0,rz||0);dummyR.scale.set(sx,sy,sz);dummyR.updateMatrix();
  K.mesh.setMatrixAt(K.k,dummyR.matrix);K.mesh.setColorAt(K.k,tmpC.set(hex).convertSRGBToLinear());K.k++}
function dressFolk(w,n){const e=n.era,C=CLOTH[e],r=mulberry32(w.seed),pk=a=>a[(r()*a.length)|0];
  w.fem=r()<.5;w.kid=r()<.14;w.skin=pk(SKIN);w.hair=e>=5&&r()<.15?0x9a9a96:pk(FHAIR);w.top=r()<.18?parseInt(n.color.slice(1),16):pk(C.top);w.bot=pk(C.bot);
  w.dress=w.fem&&(e<6||r()<.4)?pk(C.dress):0;w.hat=w.kid?null:pk(C.hat);w.hatCol=w.hat==='straw'?0xd8c078:w.hat==='hood'?w.top:w.hat==='visor'?0x9ad8e8:0x2a2420;
  w.pack=!w.kid&&r()<(e<5?.3:.12)?(e<3?0x8a6a3a:e<6?0x9a7a4a:0x3a4a5a):0;w.tool=!w.kid&&!w.fem&&r()<.25&&e<5;w.long=w.fem&&r()<.6;w.era=e}
function soldierKit(w,n){const e=n.era,nc=parseInt(n.color.slice(1),16);w.top=e<=1?0x7a5a3a:e<=3?nc:e===4?nc:e===5?(r=>r)(0x5a5a3a):e===6?0x4a5a3a:0xd8dee4;
  w.bot=e===4?0xe8e0d0:e>=5&&e<7?0x4a4a3a:e===7?0xc8ced4:0x5a4630;w.dress=0;w.pack=e>=5?0x4a4a32:0;w.hat=e<=1?null:e<=3?'helm':e===4?'tricorn':e===7?'visor':'helm';w.hatCol=e<=3?0x9aa0a8:e===4?0x1a1a1a:e===7?0x9ad8e8:0x4a5038;w.kid=false;w.fem=false;w.uni=e}
function cityPoint(c,near,fest){const P_=c._poi;if(!P_||!P_.pts.length){const a=rng()*6.28,r=.08+rng()*.25;return[wx(c.x)+Math.cos(a)*r,wz(c.y)+Math.sin(a)*r]}
  if(rng()<(fest?.75:.25)){const a=rng()*6.28,r=rng()*P_.r*.8;return[P_.plaza[0]+Math.cos(a)*r,P_.plaza[1]+Math.sin(a)*r]}
  for(let q=0;q<6;q++){const p=P_.pts[(rng()*P_.pts.length)|0];if(!near||Math.hypot(p[0]-near[0],p[1]-near[1])<.6)return[p[0]+(rng()-.5)*.02,p[1]+(rng()-.5)*.02]}
  const p=P_.pts[(rng()*P_.pts.length)|0];return[p[0],p[1]]}
function fieldPoint(c){const cx=c.x,cy=c.y;for(let q=0;q<10;q++){const X=cx+((rng()*5)|0)-2,Y=cy+((rng()*5)|0)-2;if(X<0||Y<0||X>=W||Y>=H)continue;const j=Y*W+X;if(fieldTiles.has(j))return[wx(X)+(rng()-.5)*.7,wz(Y)+(rng()-.5)*.7]}return null}
function updateWalkers(dt,yrs){
  if(!settings.people){for(const k of FIG_KITS)KITS[k].mesh.count=0;return}
  const cap=settings.quality==='high'?650:settings.quality==='medium'?380:180;
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
        else{const fp=!w.kid&&n.era>=1&&n.era<6&&rng()<.3?fieldPoint(c):null;
          if(fp){w.tx=fp[0];w.tz=fp[1];w.act='farm'}else{const p=cityPoint(c,[w.x,w.z],n.festival>0);w.tx=p[0];w.tz=p[1];w.act=rng()<.5?'chat':'idle'}}}
      continue}
    const dx=w.tx-w.x,dz=w.tz-w.z,d=Math.hypot(dx,dz),spd=(w.sol?.12:w.kid?.1:.075)*(.8+Math.min(3,yrs/dt||1)*.2),sp=spd*dt;
    if(d<.012){w.wait=w.act==='farm'?4+rng()*6:w.sol?1+rng()*3:1+rng()*4;w.moving=false;
      if(w.sol&&n.wars.size&&rng()<.45){const gy=groundY(w.x,w.z),fx=w.x+Math.sin(w.dir)*.02,fz=w.z+Math.cos(w.dir)*.02;
        if(n.era>=4){emit('flash',fx,gy+.022,fz,0,0);for(let q=0;q<3;q++)emit('smoke',fx+(rng()-.5)*.02,gy+.025,fz+(rng()-.5)*.02);if(typeof sfx==='function'&&Math.hypot(w.x-camT.x,w.z-camT.z)<camDist*.6)sfx('cannon',{near:.25})}
        else emit('dust',w.x,gy+.01,w.z);
        if(rng()<.25){emit('dust',w.x,gy+.01,w.z);walkers.splice(k,1);n._walk--;continue}}continue}
    const nx=w.x+dx/d*Math.min(sp,d),nz=w.z+dz/d*Math.min(sp,d);
    if(groundY(nx,nz)<waterY+.01){w.wait=.3;w.tx=w.x;w.tz=w.z;continue}
    w.x=nx;w.z=nz;w.moving=true;const td=Math.atan2(dx,dz);let dd=td-w.dir;dd=Math.atan2(Math.sin(dd),Math.cos(dd));w.dir+=dd*Math.min(1,dt*10);w.ph+=Math.min(sp,d)*(w.kid?620:480)}
  kitReset(FIG_KITS);
  if(camDist<16){const R2=(camDist*1.2+1.5)**2;
    for(const w of walkers){const ex=w.x-camT.x,ez=w.z-camT.z;if(ex*ex+ez*ez>R2)continue;drawFolk(w)}}
  kitCommit(FIG_KITS);
}
function drawFolk(w){
  const sc=w.kid?.68:1,ry=w.dir,c=Math.cos(ry),s=Math.sin(ry),gy=groundY(w.x,w.z);
  const L=(lx,ly,lz)=>[w.x+lx*c+lz*s,gy+ly,w.z-lx*s+lz*c];
  let leg=0,arm=0,bend=0,armR=0,bob=0,lean=0;
  if(w.moving){leg=Math.sin(w.ph)*.55;arm=-leg*.8;bob=Math.abs(Math.cos(w.ph))*.0012*sc}
  else if(w.act==='farm'&&w.wait>0){bend=.55;const q=Math.sin(w.t*5);armR=-.9-q*.5;arm=armR}
  else if(w.act==='chat'&&w.wait>0){arm=Math.sin(w.t*2.3)*.12;armR=-.35+Math.sin(w.t*3.1)*.3;lean=Math.sin(w.t*.7)*.05}
  else{arm=Math.sin(w.t*1.3)*.05}
  if(w.sol&&w.moving)armR=-.15;
  const legL=.0165*sc,hipY=legL+bob,hx=.0026*sc;
  const lw=.0042*sc,ld=.0046*sc;
  if(!w.dress||!w.long){addR('pLeg',...L(-hx,hipY,0),lw,legL,ld,ry,leg,0,w.bot);addR('pLeg',...L(hx,hipY,0),lw,legL,ld,ry,-leg,0,w.bot)}
  else{addR('pLeg',...L(-hx,hipY*.25,0),lw*.9,hipY*.25,ld,ry,leg*.6,0,0x3a2a1a);addR('pLeg',...L(hx,hipY*.25,0),lw*.9,hipY*.25,ld,ry,-leg*.6,0,0x3a2a1a)}
  const tl=.0125*sc,tw=.0105*sc,cb=Math.cos(bend),sb=Math.sin(bend);
  addR('pTorso',...L(0,hipY-.001,0),tw,tl+.001,tw*.62,ry,bend,lean,w.top);
  if(w.dress)addR('pSkirt',...L(0,hipY+.0015,sb*.002),tw*1.05,w.long?hipY-.001:hipY*.45,tw*.95,ry,bend*.3,0,w.dress);
  else if(w.uni===4)addR('pSkirt',...L(0,hipY+.001,0),tw*1.02,.006*sc,tw*.8,ry,0,0,w.top);
  const sh=(f)=>L(0,hipY+cb*tl*f,sb*tl*f),shY=hipY+cb*tl*.9,shZ=sb*tl*.9,ax=tw*.6;
  const aL=.0122*sc,aw=.0034*sc;
  addR('pArm',...L(-ax,shY,shZ),aw,aL,aw,ry,arm-bend*.3,.06,w.top);addR('pArm',...L(ax,shY,shZ),aw,aL,aw,ry,(armR||-arm)-bend*.3,-.06,w.top);
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
      const g=hand(-1,arm);addR('pShield',...L(-ax-.003,shY-aL*.6,shZ+.002),.002,.012,.012,ry,0,0,e<=1?0x8a6a3a:parseInt(nations[w.nid].color.slice(1),16))}
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
    if(c.era>=5){const ox=Math.cos(rot)*.035,oz=-Math.sin(rot)*.035;add('car',x+ox,y+.006,z+oz,.028,.02,.05,rot,c.car);add('car',x+ox,y+.024,z+oz,.024,.012,.026,rot,0x9ab0c0);continue}
    add('cart',x,y+.01,z,.035,.022,.06,rot,0x6b4a2e);add('cartTop',x,y+.035,z,.034,.03,.05,rot+Math.PI/2,0xeee6d2);
    add('body',x+Math.sin(rot)*.06,y,z+Math.cos(rot)*.06,.02,.025,.04,rot,0x7a5a3a)}
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
cloudGeo.setAttribute('aOff',new THREE.InstancedBufferAttribute(new Float32Array(CLOUDMAX*4),4));cloudGeo.instanceCount=0;
const cloudU={map:{value:TX.soft},uCol:{value:new THREE.Color(1,1,1)},uA:{value:.26},uPL:PLU.uPL,uPE:PLU.uPE};
const cloudMesh=new THREE.Mesh(cloudGeo,new THREE.ShaderMaterial({uniforms:cloudU,transparent:true,depthWrite:false,
  vertexShader:`attribute vec4 aOff;varying vec2 vUv;varying float vF;void main(){vUv=uv;vec3 R=vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0]),U=vec3(viewMatrix[0][1],viewMatrix[1][1],viewMatrix[2][1]);
    vec3 p=aOff.xyz+(R*position.x+U*position.y*.62)*aOff.w;vec4 mv=viewMatrix*vec4(p,1.);vF=smoothstep(2.,9.,-mv.z);gl_Position=projectionMatrix*mv;}`,
  fragmentShader:TOSCENE+`uniform sampler2D map;uniform vec3 uCol;uniform float uA;varying vec2 vUv;varying float vF;void main(){float a=texture2D(map,vUv).a;gl_FragColor=vec4(toScene(uCol),a*uA*vF);}`}));
cloudMesh.frustumCulled=false;cloudMesh.renderOrder=6;scene.add(cloudMesh);
function updateCloudCards(dt){const a=cloudGeo.attributes.aOff.array;let n=0;for(const c of clouds){c.x+=dt*.25;if(c.x>W*.75)c.x=-W*.75;if(n>=CLOUDMAX)break;a[n*4]=c.x;a[n*4+1]=c.y;a[n*4+2]=c.z;a[n*4+3]=c.s*1.3;n++}
  cloudGeo.instanceCount=settings.clouds===false?0:n;cloudGeo.attributes.aOff.needsUpdate=true;const cs=1-nightF*.7;cloudU.uCol.value.setRGB(cs,cs,cs*1.02);cloudU.uA.value=.2*smooth(18,45,camDist)}
function seedClouds(){clouds=[];for(let c=0;c<Math.round(W*H/260);c++){const cx=(rng()-.5)*W*1.3,cz=(rng()-.5)*H*1.3,cy=13+rng()*5,n=10+((rng()*8)|0),sw=3+rng()*3;
  for(let k=0;k<n;k++){const a=rng()*6.283,r=Math.sqrt(rng())*sw;clouds.push({x:cx+Math.cos(a)*r*1.4,y:cy+(rng()-.5)*.6+(1-r/sw)*.5,z:cz+Math.sin(a)*r*.8,s:1.6+rng()*1.8*(1-r/sw*.5)})}}}
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
    const fm=own(stdMat({color:nc}));for(const fx of [-.05,.03]){mesh(SG.cyl,SM.dark,fx,t+.07,0,.026,.08,.026);mesh(SG.cyl,fm,fx,t+.09,0,.027,.016,.027)}
    for(const mx of [-.2,.2]){mast(mx,H.topAt(.5+mx/.56),.17,.004);line([mx,H.topAt(.5)+.17,0],[0,t+.06,0])}line([-.2,t+.17,0],[-.28,t+.01,0]);line([.2,t+.17,0],[.28,t+.02,0]);
    flag(-.27,t+.06,0,.03)}
  else if(era===6&&war&&Math.random()<.4){/* aircraft carrier: a long flat deck, an island on the side and planes ready to fly */
      const H=SHIPGEO.cv||(SHIPGEO.cv=hullGeo({L:.95,W:.07,H:.06,D:.035,sheer:.04,stern:.95,bowPow:.45,uvx:3}));mesh(H.hull,hullMat('grey'),0,0,0);mesh(H.transom,SM.grey,0,0,0);
      const t=H.topAt(.5);mesh(SG.box,SHIPDECK2,0,t+.006,.01,.98,.012,.16);mesh(SG.box,SM.white,0,t+.0125,-.03,.9,.001,.004);mesh(SG.box,SM.white,.1,t+.0125,.03,.5,.001,.003).rotation.y=-.12;
      mesh(SG.box,SM.grey,-.05,t+.04,-.06,.12,.06,.03);mesh(SG.box,SM.dark,-.02,t+.07,-.06,.05,.012,.032);mesh(SG.cyl,SM.grey,-.06,t+.1,-.06,.004,.05,.004);mesh(SG.box,SM.dark,-.06,t+.12,-.06,.004,.004,.03);
      const pm=own(stdMat({color:colL(0x6a7078)}));for(let k=0;k<5;k++){const px=-.3+k*.11,pz=.03+(k%2)*.02;mesh(SG.box,pm,px,t+.017,pz,.06,.008,.008);mesh(SG.box,pm,px+.005,t+.017,pz,.014,.003,.05)}
      flag(-.47,t+.05,0,.03)}
  else if(era===6&&!war&&Math.random()<.4){/* cruise liner: tiers of white decks with rows of windows and a funnel */
      const H=SHIPGEO.cruise||(SHIPGEO.cruise=hullGeo({L:.85,W:.065,H:.05,D:.04,sheer:.08,stern:.9,bowPow:.5,uvx:3}));mesh(H.hull,hullMat('iron'),0,0,0);mesh(H.deck,SHIPDECK2,0,0,0);mesh(H.transom,SM.dark,0,0,0);
      const t=H.topAt(.5);for(let d=0;d<4;d++){const L=.66-d*.1,w=.12-d*.012,y=t+.012+d*.026;mesh(SG.box,SM.white,-.03+d*.01,y,0,L,.026,w);for(const sd of [-1,1])mesh(SG.box,SM.hover,-.03+d*.01,y+.003,sd*(w/2+.0005),L*.96,.008,.001,false)}
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
