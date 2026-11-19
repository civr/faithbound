"use strict";
/* Faithbound — the Realistic look.
   A second way to draw the world next to the cozy pixel look: smooth full-resolution rendering, natural colours, and real
   photo-scanned materials (Poly Haven, CC0) at their true size. Walls of plaster and oak beams, rubble stone, brick, planks
   and mud render; clay tiles and thatch on the roofs; trees drawn as pictures of real tree models from sixteen angles.
   Nothing about the simulation changes: this file only swaps the materials and shapes the existing kits are drawn with,
   and swaps them back when the player returns to the pixel look. One world unit is about 33 metres. */

LOOKS.real={label:'Realistic',desc:'Natural colours and real photo materials, drawn smooth at full resolution',pixel:0,soft:.85,
  ground:{3:[170,154,118],4:[70,92,40],5:[46,64,30],6:[42,64,30],7:[176,152,110],8:[124,120,78],9:[52,66,40],10:[118,116,98],11:[86,94,58],12:[118,114,106]},
  sat:.96,exposure:.88,tint:[64,80,46,.05],sun:0xffecd6,sunI:3.05,hemiI:.46,fog:.8,lock:-1,skyTop:0x6a96c8,skyHor:0xc6d4de,shallow:0x356a64,deep:0x0b2a38,
  post:{sat:.95,con:1.15,lift:[0,.004,.012],gain:[1.04,1,.94],vig:.3,tilt:.85,tiltFar:1,ao:.7,mist:.24,bloom:.12,grain:0,split:.9}};

/* the Miniature look: the same real materials, seen as a tabletop model. A narrow band of sharp focus across the middle of the
   view with strong blur above and below (as a tilt-shift lens gives), clear air, bright sun and rich toy-like colour */
LOOKS.mini=Object.assign({},LOOKS.real,{soft:.75,label:'Miniature',desc:'A tiny model world on a table: real materials, strong tilt-shift blur and bright colours',
  sat:1.04,exposure:.96,sunI:3.3,hemiI:.5,fog:.5,skyTop:0x5f94d0,skyHor:0xd2dfe8,
  post:{sat:1.22,con:1.14,lift:[.004,.004,.01],gain:[1.05,1.01,.94],vig:.4,tilt:1.45,tiltAll:1,tiltB:[.05,.36],tiltN:32,ao:.85,mist:0,bloom:.16,grain:0,split:.9}});
const isRealLook=k=>k==='real'||k==='mini';
const REAL={on:false,ready:null,mats:{},swapped:[],trees:[],U:{uTime:null}};
const M_PER_U=33;/* metres in one world unit */

/* ---------- photos ---------- */
const realImg=f=>new Promise((ok,bad)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>bad(new Error('missing '+f));i.src='assets/textures/real/'+f});
function realCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return [c,c.getContext('2d')]}
function realTex(src,srgb){const t=src instanceof HTMLCanvasElement?new THREE.CanvasTexture(src):new THREE.Texture(src);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;
  if(srgb)t.encoding=THREE.sRGBEncoding;t.needsUpdate=true;return t}
function realPattern(x,img,px){const [c,cx]=realCanvas(px,px);cx.drawImage(img,0,0,px,px);return x.createPattern(c,'repeat')}
/* a normal map from a height picture (light = raised) */
function realNormal(hc,k){const w=hc.width,h=hc.height,src=hc.getContext('2d').getImageData(0,0,w,h).data,[c,x]=realCanvas(w,h),img=x.createImageData(w,h),d=img.data;
  const at=(X,Y)=>src[(((Y+h)%h)*w+((X+w)%w))*4]/255;
  for(let y=0;y<h;y++)for(let X=0;X<w;X++){const dx=(at(X+1,y)-at(X-1,y))*k,dy=(at(X,y+1)-at(X,y-1))*k,l=Math.hypot(dx,dy,1),i=(y*w+X)*4;d[i]=(-dx/l*.5+.5)*255;d[i+1]=(dy/l*.5+.5)*255;d[i+2]=(1/l*.5+.5)*255;d[i+3]=255}
  x.putImageData(img,0,0);return c}

/* house fronts, one storey of about 6.4 by 2.9 metres: the photo wall with real-size windows, a relief map, and a mask of window
   panes that glow at night */
function realFacade(kind,P){if(kind==='office'||kind==='glassw')return realModern(kind,P);const W=1024,H=512,[c,x]=realCanvas(W,H),[hc,hx]=realCanvas(W,H),[ec,ex]=realCanvas(W,H);let s=kind.length*7+3;const r=()=>((s=(s*16807)%2147483647)/2147483647);
  ex.fillStyle='#000';ex.fillRect(0,0,W,H);hx.fillStyle='#808080';hx.fillRect(0,0,W,H);
  const solid=kind==='stone'||kind==='brick';
  if(solid){x.fillStyle=realPattern(x,kind==='stone'?P.stone:P.brick,kind==='stone'?400:300);x.fillRect(0,0,W,H);
    const src=x.getImageData(0,0,W,H).data,hi=hx.getImageData(0,0,W,H),hd=hi.data;for(let i=0;i<src.length;i+=4)hd[i]=hd[i+1]=hd[i+2]=src[i]*.3+src[i+1]*.55+src[i+2]*.15;hx.putImageData(hi,0,0)}
  else if(kind==='planks'){x.save();x.translate(W/2,H/2);x.rotate(Math.PI/2);x.translate(-H/2,-W/2);x.fillStyle=realPattern(x,P.planks,256);x.fillRect(-W,-W,W*3,W*3);x.restore();
    for(let i=0;i<20;i++){hx.fillStyle='#585858';hx.fillRect(i*W/20,0,3,H)}}
  else{x.fillStyle=realPattern(x,P.plaster,512);x.fillRect(0,0,W,H);
    if(kind==='adobe'){x.globalCompositeOperation='multiply';x.fillStyle='#f2e6d4';x.fillRect(0,0,W,H);x.globalCompositeOperation='source-over'}
    for(let i=0;i<9000;i++){hx.fillStyle=r()<.5?'#787878':'#888888';hx.fillRect(r()*W,r()*H,2,2)}}
  /* damp and grime rising from the street */
  {const g=x.createLinearGradient(0,H,0,H*.7);g.addColorStop(0,'rgba(70,60,46,.42)');g.addColorStop(1,'rgba(70,60,46,0)');x.fillStyle=g;x.fillRect(0,H*.7,W,H*.3)}
  if(kind==='half'){const wp=realPattern(x,P.wood,200);const beam=(x0,y0,x1,y1,w)=>{x.strokeStyle=wp;x.lineWidth=w;x.beginPath();x.moveTo(x0,y0);x.lineTo(x1,y1);x.stroke();
      x.globalCompositeOperation='multiply';x.strokeStyle='#5a4e42';x.stroke();x.globalCompositeOperation='source-over';hx.strokeStyle='#e0e0e0';hx.lineWidth=w;hx.beginPath();hx.moveTo(x0,y0);hx.lineTo(x1,y1);hx.stroke()};
    beam(0,14,W,14,28);beam(0,498,W,498,28);for(const px of [14,512,1010])beam(px,0,px,H,28);for(const px of [263,761])beam(px,340,px,H,22);
    beam(30,486,150,340,18);beam(496,486,376,340,18);beam(528,486,648,340,18);beam(994,486,874,340,18)}
  const win=(cx,cy,w,h)=>{const sur=solid||kind==='adobe';
    x.fillStyle=kind==='stone'?'#bdb8ad':kind==='brick'?'#d8d0c2':kind==='adobe'?'#6a5440':'#3a3028';const m=sur?16:10;x.fillRect(cx-w/2-m,cy-h/2-m,w+2*m,h+2*m);
    const gr=x.createLinearGradient(cx-w/2,cy-h/2,cx+w/2,cy+h/2);gr.addColorStop(0,'#74838c');gr.addColorStop(.45,'#2e3a42');gr.addColorStop(1,'#161d22');x.fillStyle=gr;x.fillRect(cx-w/2,cy-h/2,w,h);
    x.fillStyle='rgba(255,255,255,.1)';x.beginPath();x.moveTo(cx-w/2,cy-h/2);x.lineTo(cx-w/2+w*.4,cy-h/2);x.lineTo(cx-w/2,cy-h/2+h*.5);x.fill();
    if(kind!=='stone'&&kind!=='adobe'){x.fillStyle='#2a2018';x.fillRect(cx-3,cy-h/2,6,h);x.fillRect(cx-w/2,cy-4,w,8);x.fillRect(cx-w/2,cy-h/2+h/3-1,w,2);x.fillRect(cx-w/2,cy-h/2+2*h/3-1,w,2)}
    if(sur||kind==='half'){x.fillStyle=kind==='brick'?'#d6cdbb':'#b8b2a6';x.fillRect(cx-w/2-12,cy+h/2+6,w+24,12)}
    hx.fillStyle='#1a1a1a';hx.fillRect(cx-w/2,cy-h/2,w,h);ex.fillStyle='#fff';ex.fillRect(cx-w/2+5,cy-h/2+5,w-10,h-10);
    if(kind==='half'||kind==='planks'){const col=['#4a5a4c','#55606a','#5e4438','#6a6458','#3e4a44'][(r()*5)|0];
      for(const sd of [-1,1]){const sx=sd<0?cx-w/2-14-w*.42:cx+w/2+14;x.fillStyle=col;x.fillRect(sx,cy-h/2-4,w*.42,h+8);x.fillStyle='rgba(0,0,0,.2)';for(let q=0;q<4;q++)x.fillRect(sx,cy-h/2+q*h/4,w*.42,2)}}};
  if(kind==='half'){/* the same front without the oak frame, for tall houses and flats */
    const [c2,x2]=realCanvas(W,H);x2.fillStyle=realPattern(x2,P.plaster,512);x2.fillRect(0,0,W,H);x2.globalCompositeOperation='multiply';x2.fillStyle='#f0ebe2';x2.fillRect(0,0,W,H);x2.globalCompositeOperation='source-over';
    {const g=x2.createLinearGradient(0,H,0,H*.7);g.addColorStop(0,'rgba(70,60,46,.3)');g.addColorStop(1,'rgba(70,60,46,0)');x2.fillStyle=g;x2.fillRect(0,H*.7,W,H*.3)}
    for(const cx of [263,761]){const cy=232,w=140,h=180;x2.fillStyle='#d8d2c6';x2.fillRect(cx-w/2-12,cy-h/2-12,w+24,h+24);const gr=x2.createLinearGradient(cx-w/2,cy-h/2,cx+w/2,cy+h/2);gr.addColorStop(0,'#74838c');gr.addColorStop(.45,'#2e3a42');gr.addColorStop(1,'#161d22');
      x2.fillStyle=gr;x2.fillRect(cx-w/2,cy-h/2,w,h);x2.fillStyle='#e8e4dc';x2.fillRect(cx-3,cy-h/2,6,h);x2.fillRect(cx-w/2,cy-4,w,8);x2.fillStyle='#cfc8bb';x2.fillRect(cx-w/2-14,cy+h/2+8,w+28,14)}
    REAL.halfTall=realTex(c2,true)}
  if(kind==='stone'){win(263,240,58,120);win(761,240,58,120)}
  else if(kind==='adobe'){win(300,250,96,96);win(780,250,96,96)}
  else if(kind==='planks')win(512,240,110,110);
  else{win(263,232,140,180);win(761,232,140,180)}
  return {map:realTex(c,true),normal:realTex(realNormal(hc,solid?2.2:1.5)),emissive:realTex(ec,true)}}

/* modern fronts. Offices: board-marked concrete with a band of aluminium windows on every floor (one tile is two bays, about
   6 by 3.5 metres). Glass towers: a curtain wall of tinted panes in a metal grid, with a dark band at each floor (3 by 3.5 metres). */
function realModern(kind,P){const W=1024,H=512,[c,x]=realCanvas(W,H),[hc,hx]=realCanvas(W,H),[ec,ex]=realCanvas(W,H);
  ex.fillStyle='#000';ex.fillRect(0,0,W,H);hx.fillStyle='#808080';hx.fillRect(0,0,W,H);
  const glass=(x0,y0,w,h,tint)=>{const g=x.createLinearGradient(x0,y0,x0+w*.6,y0+h);g.addColorStop(0,tint[0]);g.addColorStop(.5,tint[1]);g.addColorStop(1,tint[2]);x.fillStyle=g;x.fillRect(x0,y0,w,h);
    x.fillStyle='rgba(255,255,255,.07)';x.beginPath();x.moveTo(x0,y0);x.lineTo(x0+w*.35,y0);x.lineTo(x0,y0+h*.6);x.fill();hx.fillStyle='#606060';hx.fillRect(x0,y0,w,h);ex.fillStyle='#fff';ex.fillRect(x0+6,y0+6,w-12,h-12)};
  if(kind==='office'){x.fillStyle=realPattern(x,P.conc,512);x.fillRect(0,0,W,H);
    {const g=x.createLinearGradient(0,H,0,H*.75);g.addColorStop(0,'rgba(50,48,44,.3)');g.addColorStop(1,'rgba(50,48,44,0)');x.fillStyle=g;x.fillRect(0,H*.75,W,H*.25)}
    for(const bx of [40,552]){x.fillStyle='#5c6166';x.fillRect(bx-8,112,448,276);glass(bx,120,432,260,['#8a9aa4','#3c4a54','#1c252c']);
      x.fillStyle='#62676c';for(const mx of [bx+142,bx+286])x.fillRect(mx-4,120,8,260);x.fillRect(bx,236,432,6);hx.fillStyle='#c0c0c0';hx.fillRect(bx-8,112,448,8);hx.fillRect(bx-8,380,448,8)}
    x.fillStyle='rgba(30,30,30,.25)';x.fillRect(0,0,W,6)}
  else{glass(0,0,W,H,['#c2d0d8','#7890a0','#3c505e']);
    x.fillStyle='#2a2f34';x.fillRect(0,420,W,92);hx.fillStyle='#404040';hx.fillRect(0,420,W,92);ex.fillStyle='#000';ex.fillRect(0,414,W,98);
    x.fillStyle='#7a8086';hx.fillStyle='#e0e0e0';for(const mx of [0,512,1024]){x.fillRect(mx-10,0,20,H);hx.fillRect(mx-10,0,20,H)}x.fillRect(0,414,W,10);x.fillRect(0,0,W,8);hx.fillRect(0,414,W,10)}
  return {map:realTex(c,true),normal:realTex(realNormal(hc,1.2)),emissive:realTex(ec,true)}}

/* texture size in world units, from the size of each copy: every house shows windows, stones and tiles at their real size.
   Shapes: box (walls), roof (gable and hipped roofs), cyl (round towers), cone (round and pointed roofs) */
function realScaledUV(m,tw,th,mode,win){const prev=m.onBeforeCompile;
  m.onBeforeCompile=function(sh,rr){if(prev)prev.call(this,sh,rr);
    const fs=mode==='roof'?'abs(normal.x)>.5?vec2(sz,sy):vec2(sx,length(vec2(sz*.5,sy)))':mode==='cyl'?'abs(normal.y)>.5?vec2(sx,sz):vec2(3.1416*sx,sy)':mode==='cone'?'abs(normal.y)>.9?vec2(sx,sz):vec2(3.1416*sx,length(vec2(sx*.5,sy)))':
      'abs(normal.x)>.5?vec2(sz,sy):abs(normal.y)>.5?vec2(sx,sz):vec2(sx,sy)';
    if(m.userData.tall){sh.uniforms.tTall={value:m.userData.tall};sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D tTall;varying float vRSy;')
      .replace('#include <map_fragment>','#ifdef USE_MAP\n vec4 texelColor=vRSy>.205?texture2D(tTall,vUv):texture2D(map,vUv);texelColor=mapTexelToLinear(texelColor);diffuseColor*=texelColor;\n#endif')}
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vRWin;varying float vRSy;').replace('#include <uv_vertex>',`#include <uv_vertex>
#ifdef USE_UV
{vec2 tuv;vec3 seed=vec3(0.);
#ifdef USE_INSTANCING
 float sx=length(instanceMatrix[0].xyz),sy=length(instanceMatrix[1].xyz),sz=length(instanceMatrix[2].xyz);tuv=uv*(${fs});seed=instanceMatrix[3].xyz;vRSy=sy;
#else
 vRSy=0.;vec3 wp=(modelMatrix*vec4(position,1.)).xyz;vec3 wn=normalize(mat3(modelMatrix)*normal);tuv=abs(wn.y)>.72?wp.xz:abs(wn.x)>abs(wn.z)?vec2(wp.z,wp.y):vec2(wp.x,wp.y);
#endif
 tuv/=vec2(${tw.toFixed(4)},${th.toFixed(4)});vUv=tuv;vRWin=vec3(tuv,fract(dot(seed.xz,vec2(17.31,24.17)))*97.+floor(normal.x*2.+normal.z*3.)*13.);}
#endif`);
    sh.fragmentShader=sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n diffuseColor.rgb=mix(vec3(dot(diffuseColor.rgb,vec3(.3,.59,.11))),diffuseColor.rgb,.84);');
    if(win)sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vRWin;').replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
  {vec2 cell=floor(vRWin.xy*vec2(2.,1.));float hw=fract(sin(dot(cell+vRWin.z,vec2(12.9898,78.233)))*43758.5453);totalEmissiveRadiance*=step(hw,.5)*(.4+hw);}`)};
  m.customProgramCacheKey=()=>'real|'+mode+'|'+tw+'|'+th+(win?'w':'')+(m.userData.tall?'t':'');return m}

const REAL_TILE={office:[.182,.106],glassw:[.09,.106],half:[.194,.088],stone:[.194,.088],brick:[.194,.088],planks:[.194,.088],adobe:[.194,.088],rubble:[.11,.11],tiles:[.08,.08],thatch:[.1,.1]};
/* which real material each of the game's materials becomes; a few kits take a plain variant (no windows on bridges and steps) */
const REAL_OF={office:'office',glass:'glassw',dirtPlaza:'dirt',conc:'conc',plaza:'cobble',plaster:'half',stone:'stone',brick:'brick',timber:'planks',adobe:'adobe',tiles:'tiles',thatch:'thatch',thatch2:'thatch2'};
const REAL_KIT_BYNAME={hedge:'hedge'};
const REAL_KIT_OVERRIDE={bridge:'rubble',stP:'rubble',pyr:'rubble'};

async function realLoad(){
  const files={plaster:'r_plaster.jpg',wood:'r_wood.jpg',planks:'r_planks.jpg',stone:'r_stone.jpg',brick:'r_brick.jpg',tiles:'r_tiles.jpg',thatch:'r_thatch.jpg',cobble:'r_cobble.jpg',leaf:'../t_leaf.jpg',sky:'r_sky.jpg',snow:'r_snow.jpg',dirt:'r_dirt.jpg',asphalt:'r_asphalt.jpg',conc:'r_conc.jpg',conc2:'r_conc2.jpg',
    stoneN:'r_stone_n.jpg',brickN:'r_brick_n.jpg',tilesN:'r_tiles_n.jpg',thatchN:'r_thatch_n.jpg',planksN:'r_planks_n.jpg',impB:'imp_broadleaf.webp',impF:'imp_fir.webp'};
  const P={};await Promise.all(Object.entries(files).map(async([k,f])=>{P[k]=await realImg(f)}));
  const F={};for(const k of ['half','stone','brick','planks','adobe','office','glassw'])F[k]=realFacade(k,P);
  REAL.F=F;REAL.P=P;REAL.sky=P.sky;REAL.T={stone:realTex(P.stone,true),stoneN:realTex(P.stoneN),tiles:realTex(P.tiles,true),tilesN:realTex(P.tilesN),thatch:realTex(P.thatch,true),thatchN:realTex(P.thatchN),cobble:realTex(P.cobble,true),leaf:realTex(P.leaf,true),dirt:realTex(P.dirt,true),asphalt:realTex(P.asphalt,true),conc2:realTex(P.conc2,true),
    impB:realTex(P.impB,true),impF:realTex(P.impF,true)};
  for(const t of [REAL.T.impB,REAL.T.impF]){t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;t.anisotropy=4}}

/* one material per kind of surface and shape, made when first needed */
function realMat(kind,mode,orig){const key=kind+'|'+mode;if(REAL.mats[key])return REAL.mats[key];const F=REAL.F,T=REAL.T;let m,tile;
  if(F[kind]){m=new THREE.MeshStandardMaterial({map:F[kind].map,normalMap:F[kind].normal,emissiveMap:F[kind].emissive,emissive:new THREE.Color(1,.56,.22),emissiveIntensity:0,roughness:.9,metalness:0});tile=REAL_TILE[kind];
    if(kind==='half'&&REAL.halfTall)m.userData.tall=REAL.halfTall;m=realScaledUV(m,tile[0],tile[1],mode==='roof'||mode==='cone'?'box':mode,true);if(typeof winMats!=='undefined')winMats.push(m);
    if(kind==='glassw'){m.roughness=.06;m.metalness=.55;m.envMapIntensity=1.1;m.emissive.setRGB(1,.78,.5).multiplyScalar(.32)}else if(kind==='office'){m.roughness=.75;m.emissive.setRGB(1,.8,.52).multiplyScalar(.42)}}
  else if(kind==='rubble'){m=realScaledUV(new THREE.MeshStandardMaterial({map:T.stone,normalMap:T.stoneN,roughness:.95,color:0xe6e4de}),.11,.11,mode,false)}
  else if(kind==='conc'){m=realScaledUV(new THREE.MeshStandardMaterial({map:T.conc2,roughness:.85}),.12,.12,mode,false)}
  else if(kind==='hedge'){m=realScaledUV(new THREE.MeshStandardMaterial({map:T.leaf,roughness:.95,color:0x9aa88a}),.05,.05,mode,false)}
  else if(kind==='dirt'){m=realScaledUV(new THREE.MeshStandardMaterial({map:T.dirt,roughness:1}),.1,.1,mode,false)}
  else if(kind==='cobble'){m=realScaledUV(new THREE.MeshStandardMaterial({map:T.cobble,roughness:.9}),.12,.12,mode,false)}
  else if(kind==='tiles'){m=realScaledUV(new THREE.MeshStandardMaterial({map:T.tiles,normalMap:T.tilesN,roughness:.8,side:THREE.DoubleSide}),.08,.08,mode==='box'?'roof':mode,false)}
  else{/* thatch, and the weathered grey-brown thatch of hipped cottage roofs */
    m=realScaledUV(new THREE.MeshStandardMaterial({map:T.thatch,normalMap:T.thatchN,roughness:1,side:THREE.DoubleSide,color:kind==='thatch2'?0xb4a690:0xffffff}),.1,.1,mode==='box'?'roof':mode,false)}
  if(orig&&orig.side===THREE.DoubleSide)m.side=THREE.DoubleSide;
  if(typeof weatherHook==='function')weatherHook(m);realCloud(m,'vWxP');REAL.mats[key]=m;return m}
function realMode(geo){const t=geo.type||'';return t==='ConeGeometry'?'cone':t==='CylinderGeometry'?'cyl':t==='BoxGeometry'?'box':geo.attributes&&geo.attributes.position&&geo.attributes.position.count<=36?'roof':'box'}

/* ---------- trees: camera-facing pictures of real tree models ---------- */
/* atlas: eight angles around the tree in two rows (seen from 22 and 55 degrees up); each copy keeps its own turn */
function realImpostor(atlas,h0,cf,qk){const U={uH0:{value:h0},uCF:{value:cf},uQK:{value:qk},uTime:TREEU.uTime};
  const head=`uniform float uH0,uCF,uQK,uTime;vec3 bbC,bbR,bbU,bbN,bbW;float bbS,bbY;
void bbFrame(){mat4 im=modelMatrix;
#ifdef USE_INSTANCING
 im=modelMatrix*instanceMatrix;
#endif
 bbS=length(im[1].xyz)*uH0;bbY=atan(-im[0].z,im[0].x);bbC=(im*vec4(0.,0.,0.,1.)).xyz+vec3(0.,bbS*uCF,0.);
 bbN=normalize(cameraPosition-bbC);bbR=normalize(cross(vec3(0.,1.,0.),bbN));bbU=cross(bbN,bbR);}
vec2 bbAtlas(vec2 uv){vec3 tc=cameraPosition-bbC;float a=atan(tc.x,tc.z)-bbY;float fr=mod(floor(a/6.2831853*8.+.5),8.);float row=bbN.y>.62?1.:0.;return vec2((fr+uv.x)/8.,(1.-(row+1.)*.5)+uv.y*.5);}`;
  const inject=(sh,full)=>{Object.assign(sh.uniforms,U);
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\n'+head)
      .replace('#include <uv_vertex>','#include <uv_vertex>\nbbFrame();\n#ifdef USE_UV\nvUv=bbAtlas(uv);\n#endif')
      .replace('#include <project_vertex>',`{float hgt=position.y+.5;float ph=bbC.x*2.1+bbC.z*1.7;vec3 sw=vec3(sin(uTime*1.1+ph)+.4*sin(uTime*2.7+ph*2.3),0.,cos(uTime*.9+ph*1.4)*.6)*.03*hgt*hgt*bbS;
 bbW=bbC+(bbR*position.x+bbU*position.y)*bbS*uQK+sw;}
vec4 mvPosition=viewMatrix*vec4(bbW,1.);gl_Position=projectionMatrix*mvPosition;`);
    if(full)sh.vertexShader=sh.vertexShader.replace('#include <worldpos_vertex>','vec4 worldPosition=vec4(bbW,1.);')
      .replace('#include <defaultnormal_vertex>','#include <defaultnormal_vertex>\ntransformedNormal=normalize((viewMatrix*vec4(normalize(mix(bbN,vec3(0.,1.,0.),.55)),0.)).xyz);');
    else sh.vertexShader=sh.vertexShader.replace('#include <worldpos_vertex>','vec4 worldPosition=vec4(bbW,1.);')};
  const m=new THREE.MeshStandardMaterial({map:atlas,alphaTest:.5,roughness:.92,side:THREE.DoubleSide});
  const cut=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <alphatest_fragment>',`
#ifdef USE_UV
 {float tpp=length(fwidth(vUv*vec2(3072.,768.)));if(diffuseColor.a<mix(.5,.16,smoothstep(1.5,9.,tpp)))discard;}
#endif`)};
  m.onBeforeCompile=sh=>{inject(sh,true);cut(sh);
    /* the kit's own colour only nudges the hue: the photo already carries the green */
    sh.fragmentShader=sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
#ifdef USE_COLOR
 {float l=max(dot(vColor,vec3(.3,.59,.11)),.02);diffuseColor.rgb=diffuseColor.rgb/max(vColor,vec3(.01))*mix(vec3(1.),clamp(vColor/l,.6,1.5),.35);}
#endif`)};
  m.customProgramCacheKey=()=>'realImp';
  const d=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:atlas,alphaTest:.5,side:THREE.DoubleSide});d.onBeforeCompile=sh=>{inject(sh,false);cut(sh)};d.customProgramCacheKey=()=>'realImpD';
  return {m,d}}
/* which tree kits become which picture, and how the picture sits on the old shape (centre height and size, as shares of its height) */
const REAL_TREES={conifer:'F',townTree:'B',broad:'B',s_tree_a:'B',s_tree_b:'B',s_tree_c:'B',s_tree_d:'B',s_bush_a:'B',s_bush_b:'B',s_bush_c:'B',bush:'B'};
function realTreeSwap(on){
  if(on){const quad=new THREE.PlaneGeometry(1,1);
    for(const name in KITS){const base=name.replace(/^(g_|lo_)+/,''),kind=REAL_TREES[base];const K=KITS[name];if(!kind||!K||K._real)continue;
      const g=K.mesh.geometry;if(!g.boundingBox)g.computeBoundingBox();const h0=Math.max(.05,g.boundingBox.max.y);
      const I=kind==='F'?realImpostor(REAL.T.impF,h0,.42,1.11):realImpostor(REAL.T.impB,h0,.47,1.11);
      K._real={geo:g,mat:K.mesh.material,depth:K.mesh.customDepthMaterial,rs:K.mesh.receiveShadow};K.mesh.geometry=quad;K.mesh.material=I.m;K.mesh.customDepthMaterial=I.d;K.mesh.receiveShadow=false;REAL.trees.push(K)}}
  else{for(const K of REAL.trees){if(!K._real)continue;K.mesh.geometry=K._real.geo;K.mesh.material=K._real.mat;K.mesh.customDepthMaterial=K._real.depth;K.mesh.receiveShadow=K._real.rs;delete K._real}REAL.trees.length=0}}

/* ---------- swapping the kits' materials ---------- */
function realSwap(on){
  if(on){const byMat=new Map();for(const k in REAL_OF)if(MAT[k])byMat.set(MAT[k],k);if(typeof MAT_CONC!=='undefined')byMat.set(MAT_CONC,'conc');
    for(const name in KITS){const K=KITS[name];if(!K||!K.mesh||K._realM)continue;const base=name.replace(/^g_/,'');let k=byMat.get(K.mesh.material);if(!k&&!REAL_KIT_BYNAME[base])continue;
      const kind=REAL_KIT_BYNAME[base]||REAL_KIT_OVERRIDE[base]||REAL_OF[k];const m=realMat(kind,realMode(K.mesh.geometry),K.mesh.material);K._realM=K.mesh.material;K.mesh.material=m;REAL.swapped.push(K)}
    realTreeSwap(true)}
  else{for(const K of REAL.swapped){if(K._realM){K.mesh.material=K._realM;delete K._realM}}REAL.swapped.length=0;realTreeSwap(false)}}

/* kits made later (copies for far-away detail) pick up the swap */
{const _k=kit;kit=function(name){const r=_k.apply(this,arguments);if(REAL.on&&REAL.F)try{realSwap(true)}catch(e){console.warn('real kit',e)}return r}}

/* ---------- photo grain on the 3D model buildings ---------- */
/* castles, village houses, inns and mills are models painted in flat colours: in the Realistic look they take the grain of stone,
   lime plaster, wood or clay tiles (chosen by their colour), projected from three sides, while keeping their own colours */
const REALM={uRM:{value:0},rS:{value:null},rP:{value:null},rW:{value:null},rT:{value:null}};
if(typeof SMODEL_MAT!=='undefined'){const prev=SMODEL_MAT.onBeforeCompile,pk=SMODEL_MAT.customProgramCacheKey();
  SMODEL_MAT.onBeforeCompile=function(sh,r){prev.call(this,sh,r);if(!REALM.rS.value)return;Object.assign(sh.uniforms,REALM);
    if(sh.fragmentShader.indexOf('vWxP')<0)return;
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uRM;uniform sampler2D rS,rP,rW,rT;')
      .replace('#include <color_fragment>',`#include <color_fragment>
  if(uRM>.5&&length(vWxP-cameraPosition)<14.){vec3 bw=pow(abs(vWxN),vec3(4.));bw/=bw.x+bw.y+bw.z+1e-4;vec3 q=vWxP;
   #define TRI(t,k) (dot(texture2D(t,q.zy*k).rgb,vec3(.3,.59,.11))*bw.x+dot(texture2D(t,q.xz*k).rgb,vec3(.3,.59,.11))*bw.y+dot(texture2D(t,q.xy*k).rgb,vec3(.3,.59,.11))*bw.z)
   diffuseColor.rgb=mix(vec3(dot(diffuseColor.rgb,vec3(.3,.59,.11))),diffuseColor.rgb,.62);
   vec3 c=diffuseColor.rgb;float l=dot(c,vec3(.3,.59,.11)),sat=max(c.r,max(c.g,c.b))-min(c.r,min(c.g,c.b));
   float wT=smoothstep(.06,.16,c.r-c.g)*smoothstep(.04,.1,sat),wW=(1.-wT)*smoothstep(.03,.09,c.r-c.b)*(1.-smoothstep(.3,.5,l)),wP=(1.-wT-wW)*smoothstep(.8,.92,l)*smoothstep(.015,.05,c.r-c.b),wS=max(0.,1.-wT-wW-wP);
   float d=TRI(rS,9.)/.62*wS+TRI(rP,4.)/.84*wP+TRI(rW,10.)/.46*wW+TRI(rT,12.)/.78*wT;
   diffuseColor.rgb*=clamp(mix(1.,d,.85),.45,1.6)*mix(1.,.82,wS);}`)};
  SMODEL_MAT.customProgramCacheKey=()=>pk+'|realm'+(REALM.rS.value?1:0);}

/* ---------- the ground: photo detail reaches much further out ---------- */
{const prev=terrainMat.onBeforeCompile,pk=terrainMat.customProgramCacheKey();terrU.uReal={value:0};
  terrainMat.onBeforeCompile=function(sh,r){prev.call(this,sh,r);sh.uniforms.uReal=terrU.uReal;
    sh.fragmentShader=sh.fragmentShader.replace('uniform float uPhoto;','uniform float uPhoto;uniform float uReal;')
      .replace('smoothstep(14.+uHam*16.,52.+uHam*30.,camD)','smoothstep(14.+uHam*16.+uReal*12.,52.+uHam*30.+uReal*38.,camD)')
      .replace('det=clamp(det,.4,1.7);','det=clamp(det,.4,1.7);det=mix(det,pow(det,vec3(1.25)),uReal);')
      .replace('vec2 P1=vWP.xz*.42,P2=mat2(.8,-.6,.6,.8)*vWP.xz*.13+.37;','vec2 P1=vWP.xz*(.42+uReal*5.4),P2=mat2(.8,-.6,.6,.8)*vWP.xz*(.13+uReal*1.5)+.37;')
      .replace('texture2D(tR,vWP.zy*.35)','texture2D(tR,vWP.zy*(.35+uReal*3.))').replace('texture2D(tR,vWP.xy*.35)','texture2D(tR,vWP.xy*(.35+uReal*3.))')};
  terrainMat.customProgramCacheKey=()=>pk+'|real';terrainMat.needsUpdate=true}

/* ---------- farm fields: natural crops, real soil and crop grain, rows along each strip ---------- */
const REALF={uReal:{value:0},white:null,map0:null};
const CROPS0=CROPS.map(c=>c.slice()),CROPS_REAL=[[194,166,98],[182,158,104],[94,118,58],[122,136,72],[102,80,60],[148,138,90],[178,162,84]];
{const prev=fieldMat.onBeforeCompile,pk=fieldMat.customProgramCacheKey();
  fieldMat.onBeforeCompile=function(sh,r){prev.call(this,sh,r);sh.uniforms.uReal=REALF.uReal;
    sh.fragmentShader=sh.fragmentShader.replace('uniform float uPh,uHam;','uniform float uPh,uHam,uReal;')
      .replace('fFade=(1.-smoothstep(12.,46.,','fFade=(1.-smoothstep(12.+uReal*30.,46.+uReal*110.,')
      .replace('vec2 P=vFW.xz*.45;','vec2 P=vFW.xz*(.45+uReal*5.5);')
      .replace('texture2D(fN,vFW.xz*.45)','texture2D(fN,vFW.xz*(.45+uReal*5.5))')
      .replace('diffuseColor.rgb*=.86;',`diffuseColor.rgb*=.86;
  #ifdef USE_MAP
  if(uReal>.5){float rc=vUv.x*12.;float fw=fwidth(rc);float rowA=1.-smoothstep(.3,1.,fw);float row=.5+.5*sin(rc*6.2832);
    float ripe=smoothstep(.03,.12,diffuseColor.r-diffuseColor.b*1.25),soil=smoothstep(.0,.05,diffuseColor.r-diffuseColor.g)*(1.-ripe),grn=max(0.,1.-ripe-soil);
    diffuseColor.rgb*=mix(1.,.7+.45*row,rowA*(soil*.85+grn*.5+ripe*.2));}
  #endif`)};
  fieldMat.customProgramCacheKey=()=>pk+'|real';fieldMat.needsUpdate=true}
function realFields(on){if(!REALF.white){REALF.white=new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1,THREE.RGBAFormat);REALF.white.needsUpdate=true;REALF.map0=fieldMat.map}
  fieldMat.map=on?REALF.white:REALF.map0;REALF.uReal.value=on?1:0;
  CROPS.forEach((c,i)=>{const src=on?CROPS_REAL[i%CROPS_REAL.length]:CROPS0[i];c[0]=src[0];c[1]=src[1];c[2]=src[2]});
  if(typeof FIELD_SIG!=='undefined')FIELD_SIG='';if(typeof VY!=='undefined'&&VY&&typeof rebuildFields==='function')try{rebuildFields()}catch(e){console.warn('fields',e)}}

/* ---------- roads: packed earth with wheel ruts and a grassy crown, cobbles with kerbs, asphalt with its markings; soft edges ---------- */
const ROADMATS0=ROADMATS.slice(),REALR=[];
function realRoadMat(t){if(REALR[t])return REALR[t];const T=REAL.T,o=ROADMATS0[t],tile=t===1?.08:.1;
  const m=new THREE.MeshStandardMaterial({map:t===0?T.dirt:t===1?T.cobble:T.asphalt,roughness:t===2?.8:.95,transparent:true,depthWrite:false,
    polygonOffset:o.polygonOffset,polygonOffsetFactor:o.polygonOffsetFactor,polygonOffsetUnits:o.polygonOffsetUnits});
  m.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vRU;').replace('#include <uv_vertex>',`#include <uv_vertex>
#ifdef USE_UV
 vRU=uv;{vec3 rw=(modelMatrix*vec4(position,1.)).xyz;vUv=rw.xz/${tile.toFixed(3)};}
#endif`);
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vRU;').replace('#include <map_fragment>',`#include <map_fragment>
 {float ax=abs(vRU.x-.5)*2.;
 ${t===0?'float rut=exp(-pow((ax-.42)/.13,2.));diffuseColor.rgb*=1.-.24*rut;diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.78,1.02,.6),(1.-smoothstep(.08,.24,ax))*.45);diffuseColor.a=1.-smoothstep(.62,1.,ax);'
  :t===1?'diffuseColor.rgb*=mix(1.,.7,smoothstep(.86,.92,ax));diffuseColor.a=1.-smoothstep(.94,1.,ax);'
  :'float dash=step(.55,fract(vRU.y*2.))*(1.-smoothstep(.025,.045,ax));float edg=smoothstep(.8,.83,ax)*(1.-smoothstep(.87,.9,ax));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.8,.79,.74),max(dash,edg)*.85);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.46,.44,.41),smoothstep(.93,.96,ax));diffuseColor.a=1.-smoothstep(.97,1.,ax);'}}`)};
  m.customProgramCacheKey=()=>'realroad'+t;if(typeof weatherHook==='function')weatherHook(m);realCloud(m,'vWxP');REALR[t]=m;return m}
function realRoads(on){for(let t=0;t<3;t++){const m=on?realRoadMat(t):ROADMATS0[t];ROADMATS[t]=m;if(roadMeshes[t])roadMeshes[t].material=m}}

/* ---------- water: less bright sky in it, so seas, rivers and moats read as deep natural water ---------- */
/* and the shallow sea is less clear: green-grey coastal water instead of a tropical lagoon over white sand */
waterU.uReal={value:0};
{const prev=waterMat.onBeforeCompile,pk=waterMat.customProgramCacheKey();
  waterMat.onBeforeCompile=function(sh,r){prev.call(this,sh,r);sh.uniforms.uReal=waterU.uReal;
    sh.fragmentShader=sh.fragmentShader.replace('uniform float uLite;','uniform float uLite;uniform float uReal;')
      .replace('diffuseColor.a=mix(.5,.97,smoothstep(0.,.3,vDepth))','diffuseColor.a=mix(.5+uReal*.32,.97,smoothstep(0.,.3-uReal*.12,vDepth))')};
  waterMat.customProgramCacheKey=()=>pk+'|real';waterMat.needsUpdate=true}
const REALW=[];
function realWater(on){if(!REALW.length){REALW.push([waterMat,waterMat.envMapIntensity,.26]);
    const seen=new Set([waterMat]);const add=m=>{if(m&&!seen.has(m)&&/^inland-/.test(m.customProgramCacheKey()||'')){seen.add(m);REALW.push([m,m.envMapIntensity,.3])}};
    if(typeof riverMat!=='undefined')add(riverMat);if(typeof pondMat!=='undefined')add(pondMat);for(const k in KITS)if(KITS[k].mesh)add(KITS[k].mesh.material)}
  if(typeof FLOODMAT!=='undefined'&&!REALW.some(r=>r[0]===FLOODMAT)){REALW.push([FLOODMAT,FLOODMAT.envMapIntensity,.25]);REAL.floodCol=FLOODMAT.color.clone()}
  if(REAL.floodCol){FLOODMAT.color.copy(REAL.floodCol);if(on)FLOODMAT.color.multiply(new THREE.Color(.82,.74,.62));FLOODMAT.roughness=on?.35:.15}
  for(const [m,a,b] of REALW)m.envMapIntensity=on?b:a;waterU.uReal.value=on?1:0}

/* ---------- people, animals, ships and vehicles ---------- */
/* clothes in natural dyes with a fabric grain, animals and cars in softer natural tones, ships of planked wood with sailcloth.
   The shapes stay the game's own; only how their colours are painted changes. */
const REALP={uRealP:{value:0}};
const REALP_BODY={
  part:`float l=dot(c,vec3(.3,.59,.11));float cloth=step(.5,vRP)*step(vRP,2.5)+step(4.5,vRP),hair=step(3.5,vRP)*step(vRP,4.5);
    c=mix(vec3(l),c,mix(mix(.72,.55,cloth),.6,hair));c*=mix(1.,.9+.2*rpN(vROP.xy*900.+vROP.z*300.),cloth);c*=mix(1.,.9,cloth);`,
  veh:`float l=dot(c,vec3(.3,.59,.11));c=mix(vec3(l),c,.78);c*=.95+.1*rpN(vROP.xz*400.+vROP.y*200.);`,
  ship:`float l=dot(c,vec3(.3,.59,.11)),mx=max(c.r,max(c.g,c.b)),sat=(mx-min(c.r,min(c.g,c.b)))/max(mx,.001);
    float wood=smoothstep(.02,.08,c.r-c.b)*(1.-smoothstep(.45,.7,l)),canvas=smoothstep(.45,.7,l)*(1.-smoothstep(.15,.3,sat));
    float fy=fract(vROP.y*160.),seam=smoothstep(0.,.07,fy)*smoothstep(1.,.93,fy),grain=.88+.24*rpN(vec2(vROP.x*40.+vROP.z*40.,vROP.y*900.));
    c*=mix(1.,(.74+.26*seam)*grain,wood*.9);c*=mix(1.,.92+.12*rpN(vROP.xy*700.+vROP.z*500.),canvas);c=mix(vec3(l),c,.82);`};
function realPatchMat(mat,kind){if(!mat||mat._realP)return;mat._realP=true;const prev=mat.onBeforeCompile,pk=mat.customProgramCacheKey();
  mat.onBeforeCompile=function(sh,r){if(prev)prev.call(this,sh,r);sh.uniforms.uRealP=REALP.uRealP;
    const decl=/attribute float aPart/.test(sh.vertexShader)?'':'attribute float aPart;';
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\n'+decl+'varying float vRP;varying vec3 vROP;').replace('#include <begin_vertex>','#include <begin_vertex>\nvRP=aPart;vROP=position;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uRealP;varying float vRP;varying vec3 vROP;\nfloat rpH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float rpN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(rpH(i),rpH(i+vec2(1,0)),f.x),mix(rpH(i+vec2(0,1)),rpH(i+vec2(1,1)),f.x),f.y);}')
      .replace('#include <color_fragment>','#include <color_fragment>\n if(uRealP>.5){vec3 c=diffuseColor.rgb;'+REALP_BODY[kind]+'diffuseColor.rgb=c;}')};
  mat.customProgramCacheKey=()=>pk+'|realp';mat.needsUpdate=true}
if(typeof MODEL_MAT!=='undefined')realPatchMat(MODEL_MAT,'part');
if(typeof VEH_MAT!=='undefined')realPatchMat(VEH_MAT,'veh');
if(typeof SHIP_MODEL_MAT!=='undefined')realPatchMat(SHIP_MODEL_MAT,'ship');

/* ---------- cloud shadows: slow patches of shade drifting over the land, the fields and the roofs ---------- */
const CLOUDU={uCS:{value:0},uCT:{value:0}};
const CLOUD_GLSL=`uniform float uCS,uCT;float rcH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float rcN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(rcH(i),rcH(i+vec2(1,0)),f.x),mix(rcH(i+vec2(0,1)),rcH(i+vec2(1,1)),f.x),f.y);}
float rCloud(vec2 w){vec2 p=w*.07+uCT*vec2(.012,.005);float n=rcN(p)*.55+rcN(p*2.1+3.7)*.3+rcN(p*4.3-1.3)*.15;return 1.-uCS*.55*smoothstep(.5,.64,n);}`;
function realCloud(m,pos){if(!m||m._rc||!m.isMeshStandardMaterial)return;m._rc=true;const prev=m.onBeforeCompile,pkf=m.customProgramCacheKey.bind(m);
  m.onBeforeCompile=function(sh,r){if(prev)prev.call(this,sh,r);sh.uniforms.uCS=CLOUDU.uCS;sh.uniforms.uCT=CLOUDU.uCT;
    if(sh.fragmentShader.indexOf(pos)<0||sh.fragmentShader.indexOf('#include <lights_fragment_end>')<0)return;
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\n'+CLOUD_GLSL)
      .replace('#include <lights_fragment_end>',`#include <lights_fragment_end>\n{float cs=rCloud(${pos}.xz);reflectedLight.directDiffuse*=cs;reflectedLight.directSpecular*=cs;}`)};
  m.customProgramCacheKey=()=>pkf()+'|rc';m.needsUpdate=true}
realCloud(terrainMat,'vWP');realCloud(fieldMat,'vFW');if(typeof SMODEL_MAT!=='undefined')realCloud(SMODEL_MAT,'vWxP');
(function cloudTick(){requestAnimationFrame(cloudTick);CLOUDU.uCT.value=performance.now()/1000;CLOUDU.uCS.value=REAL.on?(1-(typeof nightF==='number'?nightF:0))*(1-.6*(typeof weatherDim==='number'?weatherDim:0)):0})();

/* ---------- photo grain on the small parts: fences, posts, carts, barrels, awnings, steps, doors, beams ---------- */
/* the many plain-coloured pieces take wood, stone or plaster grain by their colour, and woven cloth when brightly dyed */
function realGrain(m){if(!m||m._rg)return;m._rg=true;const prev=m.onBeforeCompile,pkf=m.customProgramCacheKey.bind(m);
  m.onBeforeCompile=function(sh,r){if(prev)prev.call(this,sh,r);if(!REALM.rS.value||sh.fragmentShader.indexOf('vWxP')<0)return;Object.assign(sh.uniforms,REALM);
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uRM;uniform sampler2D rS,rP,rW;float rgH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float rgN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(rgH(i),rgH(i+vec2(1,0)),f.x),mix(rgH(i+vec2(0,1)),rgH(i+vec2(1,1)),f.x),f.y);}')
      .replace('#include <color_fragment>',`#include <color_fragment>
  if(uRM>.5&&length(vWxP-cameraPosition)<10.){vec3 bw=pow(abs(vWxN),vec3(4.));bw/=bw.x+bw.y+bw.z+1e-4;vec3 q=vWxP;
   #define TRG(t,k) (dot(texture2D(t,q.zy*k).rgb,vec3(.3,.59,.11))*bw.x+dot(texture2D(t,q.xz*k).rgb,vec3(.3,.59,.11))*bw.y+dot(texture2D(t,q.xy*k).rgb,vec3(.3,.59,.11))*bw.z)
   vec3 c=diffuseColor.rgb;float l=dot(c,vec3(.3,.59,.11)),mx=max(c.r,max(c.g,c.b)),sat=(mx-min(c.r,min(c.g,c.b)))/max(mx,.001);
   float wood=smoothstep(.02,.08,c.r-c.b)*(1.-smoothstep(.3,.55,l))*(1.-smoothstep(.55,.75,sat)),cloth=smoothstep(.4,.6,sat)*(1.-wood),
     stone=(1.-wood-cloth)*(1.-smoothstep(.6,.85,l)),plast=max(0.,1.-wood-cloth-stone);
   float d=TRG(rW,16.)/.46*wood+TRG(rS,9.)/.62*stone+TRG(rP,5.)/.84*plast+(.9+.2*rgN(q.xz*900.+q.y*700.))*cloth;
   diffuseColor.rgb=mix(vec3(l),c,mix(1.,.7,cloth))*clamp(mix(1.,d,.8),.5,1.5);}`)};
  m.customProgramCacheKey=()=>pkf()+'|rg'+(REALM.rS.value?1:0);m.needsUpdate=true}
for(const k of ['plain','awning','metal'])if(MAT[k]){realGrain(MAT[k]);realCloud(MAT[k],'vWxP')}
for(const k in MAT)realCloud(MAT[k],'vWxP');

/* ---------- fire: the glow round flames stays near them instead of washing the town in orange ---------- */
const PK0=JSON.parse(JSON.stringify({fire:PK.fire,glow:PK.glow,ember:PK.ember}));
function realFire(on){const set=(k,v)=>Object.assign(PK[k],v);
  if(on){set('glow',{size:PK0.glow.size*.45,a:PK0.glow.a*.22});set('fire',{size:PK0.fire.size*.8,a:PK0.fire.a*.75});set('ember',{a:PK0.ember.a*.8})}
  else for(const k in PK0)set(k,PK0[k])}

/* ---------- light from a real sky: a sky photo (Poly Haven) blended into the game's own sky colours, so reflections and the soft
   light from above carry real clouds and a bright horizon, while dawn, dusk and night still colour it ---------- */
{const _re=refreshEnv;refreshEnv=function(){if(!(REAL.on&&REAL.sky))return _re.apply(this,arguments);
  const x=envCan.getContext('2d'),w=envCan.width,h=envCan.height,g=x.createLinearGradient(0,0,0,h),hx=c=>'#'+c.getHexString();
  g.addColorStop(0,hx(skyU.top.value));g.addColorStop(.5,hx(skyU.hor.value));g.addColorStop(.56,hx(skyU.gnd.value));g.addColorStop(1,'#1d2620');x.globalCompositeOperation='source-over';x.globalAlpha=1;x.fillStyle=g;x.fillRect(0,0,w,h);
  x.save();x.beginPath();x.rect(0,0,w,h*.52);x.clip();x.globalCompositeOperation='soft-light';x.globalAlpha=.9;x.drawImage(REAL.sky,0,0,w,h);x.restore();x.globalCompositeOperation='source-over';x.globalAlpha=1;
  const t=new THREE.CanvasTexture(envCan);t.mapping=THREE.EquirectangularReflectionMapping;t.encoding=THREE.sRGBEncoding;
  const rt=pmrem.fromEquirectangular(t);t.dispose();if(envRT)envRT.dispose();envRT=rt;scene.environment=rt.texture}}

/* ---------- clean snow, and no scattered flower and pebble specks (they re-scatter round the camera and read as coloured blobs) ---------- */
const REALS={snow0:null,mW0:null};
function realSnow(on){if(!REAL.P||!REAL.P.snow)return;if(!REALS.tex){REALS.tex=realTex(REAL.P.snow,true);REALS.snow0=terrU.tW.value;REALS.mW0=terrU.mW.value.clone()}
  terrU.tW.value=on?REALS.tex:REALS.snow0;terrU.mW.value.copy(on?new THREE.Vector3(.89,.87,.82):REALS.mW0);
  for(const k of ['wflower','pebble'])if(KITS[k])KITS[k].mesh.visible=!on}
/* the grass carpet is re-scattered as the camera moves, which also shows these again: keep them hidden after every scatter */
{const _ug=updateGrass;updateGrass=function(){const r=_ug.apply(this,arguments);if(REAL.on)for(const k of ['wflower','pebble']){const K=KITS[k];if(K){K.mesh.visible=false;K.mesh.count=0}}return r}}

/* ---------- switching ---------- */
async function realOn(){if(!REAL.ready)REAL.ready=realLoad().catch(e=>{console.warn('Realistic look could not load',e);REAL.ready=null;throw e});
  try{await REAL.ready}catch(e){return}if(!isRealLook(lookKey))return;
  if(!REALM.rS.value){REALM.rS.value=REAL.T.stone;REALM.rP.value=realTex(REAL.P.plaster,true);REALM.rW.value=realTex(REAL.P.planks,true);REALM.rT.value=REAL.T.tiles;if(typeof SMODEL_MAT!=='undefined')SMODEL_MAT.needsUpdate=true}
  REALM.uRM.value=1;REAL.on=true;realSwap(true);realFields(true);realRoads(true);realWater(true);realFire(true);realSnow(true);REALP.uRealP.value=1;lastEnv=-1e9;envKey='';for(const k of ['plain','awning','metal'])if(MAT[k])MAT[k].needsUpdate=true;terrU.uReal.value=1;if(typeof propsDirty!=='undefined')propsDirty=true;if(typeof forestDirty!=='undefined')forestDirty=true;if(typeof shadowForce!=='undefined')shadowForce=true}
function realOff(){if(!REAL.on)return;REAL.on=false;realSwap(false);realFields(false);realRoads(false);realWater(false);realFire(false);realSnow(false);REALP.uRealP.value=0;lastEnv=-1e9;envKey='';terrU.uReal.value=0;REALM.uRM.value=0;if(typeof propsDirty!=='undefined')propsDirty=true;if(typeof shadowForce!=='undefined')shadowForce=true}
{const _al=applyLook;applyLook=function(k){_al.apply(this,arguments);settings.realLook=isRealLook(k);settings.lookPick=k;saveSettings();if(isRealLook(k))realOn();else realOff()}}

/* the choice in Settings, above the pixel size */
{const _os=openSettings;openSettings=function(){_os.apply(this,arguments);const box=document.querySelector('#modalBox .setcol');if(!box||box.querySelector('[data-look]'))return;
  const sec=document.createElement('div');sec.className='sec';const cur=isRealLook(lookKey)?lookKey:'hamlet';
  sec.innerHTML=`<span class="lab">Look</span><div class="seg"><button data-look="hamlet" aria-pressed="${cur==='hamlet'}">Cozy pixel</button><button data-look="real" aria-pressed="${cur==='real'}">Realistic</button><button data-look="mini" aria-pressed="${cur==='mini'}">Miniature</button></div>
    <p class="note">Realistic draws the world smooth with real photo materials: plaster and oak beams, stone, brick, clay tiles, thatch and real trees. Miniature shows the same world as a tiny model on a table, with tilt-shift blur and bright colours. Both need a faster computer than the pixel look.</p>`;
  const anchor=[...box.querySelectorAll('.sec')].find(s=>s.querySelector('[data-pixsize]'));box.insertBefore(sec,anchor||box.children[1]||null)}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-look]');if(!b)return;const k=b.dataset.look;if(LOOKS[k]&&k!==lookKey)applyLook(k);openSettings()});

/* the choice is kept between visits (the pixel look is otherwise forced on start) */
if(settings.realLook)setTimeout(()=>{try{applyLook(isRealLook(settings.lookPick)?settings.lookPick:'real')}catch(e){console.warn(e)}},0);
