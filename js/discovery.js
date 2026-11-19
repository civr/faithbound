"use strict";
/* Faithbound — undiscovered lands. In a world started with "Undiscovered", only the land the peoples know is drawn: the country
   round their towns, the ground they claim and the coasts their ships pass. Everything else is a blank old map, parchment
   with faint lines and an inked edge, and fills in as the peoples spread, sail and trade. In the Modern age, with aircraft
   and then satellites, the last blank corners are mapped. */

const DISC={on:false,seen:null,stamp:null,tex:null,ver:0,dirty:false,up:0,shipT:0,full:false};
const SEENU={uSeen:{value:null},uDisc:{value:0},uPaperK:{value:1}};
const seenTile=i=>!DISC.on||!DISC.seen||i<0||DISC.seen[i]>110;
function discReset(on,data){DISC.on=!!on;DISC.full=false;DISC.ver++;
  if(!DISC.on){DISC.seen=null;DISC.stamp=null;SEENU.uDisc.value=0;return}
  DISC.seen=data&&data.length===N?data:new Uint8Array(N);DISC.stamp=new Uint8Array(N);
  if(data)for(let i=0;i<N;i++)if(owner[i]>=0)DISC.stamp[i]=1;
  if(!DISC.tex||DISC.tex.image.width!==W||DISC.tex.image.height!==H){if(DISC.tex)DISC.tex.dispose();DISC.tex=new THREE.DataTexture(new Uint8Array(N*4),W,H,THREE.RGBAFormat);DISC.tex.magFilter=DISC.tex.minFilter=THREE.LinearFilter}
  DISC.tex.wrapS=ROUND?THREE.RepeatWrapping:THREE.ClampToEdgeWrapping;SEENU.uSeen.value=DISC.tex;SEENU.uDisc.value=1;DISC.dirty=true}
/* uncover a disc of tiles round a point (in tiles), soft at its rim */
function reveal(cx,cy,r){if(!DISC.on)return;const S=DISC.seen,R=Math.ceil(r+1);let got=false;
  for(let dy=-R;dy<=R;dy++){const Y=Math.round(cy)+dy;if(Y<0||Y>=H)continue;for(let dx=-R;dx<=R;dx++){let X=Math.round(cx)+dx;if(ROUND)X=((X%W)+W)%W;else if(X<0||X>=W)continue;
    const d=Math.hypot(Math.round(cx)+dx-cx,Y-cy),v=Math.round(255*(1-smooth(r-1.2,r+.6,d)));const j=Y*W+X;if(v>S[j]){if(S[j]<=110&&v>110)got=true;S[j]=v}}}
  DISC.dirty=true;if(got)DISC.ver++}
/* every year: new ground claimed, new towns, and the shared maps of trading partners */
function discoverTick(){if(!DISC.on)return;const S=DISC.stamp;
  for(let i=0;i<N;i++)if(owner[i]>=0&&!S[i]){S[i]=1;reveal(i%W,(i/W)|0,2.2)}
  for(const n of nations){if(!n.alive)continue;for(const c of n.cities)if(!c._disc){c._disc=1;reveal(c.x,c.y,5)}}
  /* aircraft and satellites map the whole world */
  if(!DISC.full&&nations.some(n=>n.alive&&n.era>=6)){DISC.full=true;DISC.seen.fill(255);DISC.dirty=true;DISC.ver++;log('With aircraft and satellites the whole world is mapped at last.','era')}}
{const _t=tick;tick=function(){_t.apply(this,arguments);try{discoverTick()}catch(e){console.warn('discovery',e)}}}
/* ships see the coasts they pass */
function discoverShips(dt){if(!DISC.on||typeof ships==='undefined')return;DISC.shipT+=dt;if(DISC.shipT<.6)return;DISC.shipT=0;
  for(const s of ships){if(s.sink)continue;reveal(wrapWX(s.x)+W/2-.5,s.z+H/2-.5,2.6)}}
function discUpload(){if(!DISC.on||!DISC.dirty||!DISC.tex)return;const now=performance.now();if(now-DISC.up<400)return;DISC.up=now;DISC.dirty=false;
  const d=DISC.tex.image.data,S=DISC.seen;for(let i=0;i<N;i++)d[i*4]=S[i];DISC.tex.needsUpdate=true}

/* ---------- drawing the blank map ---------- */
const PAPER_GLSL=`
  {vec2 suv=(vWP.xz+DMAP*.5)/DMAP;float sd=uDisc>.5?texture2D(uSeen,suv).r:1.;
   if(sd<.995){float n1=vn(vWP.xz*.35),n2=vn(vWP.xz*2.3+7.1),n3=vn(vWP.xz*9.+3.);
     vec3 paper=vec3(.74,.6,.38)*(.84+.12*n1+.06*n2+.03*n3);
     /* the faint lines of an old chart, every six leagues, and a darker stain here and there */
     vec2 g=abs(fract(vWP.xz/6.)-.5);float ln=1.-smoothstep(.0,.035,min(g.x,g.y));paper*=1.-.12*ln;paper*=1.-.18*smoothstep(.62,.8,n1)*n2;
     /* inked edge where the known world ends */
     float edge=smoothstep(.18,.4,sd)*(1.-smoothstep(.4,.62,sd));paper=mix(paper,vec3(.2,.12,.06),edge*.7);
     float k=smoothstep(.42,.66,sd);gl_FragColor.rgb=mix(paper*uPaperK,gl_FragColor.rgb,k);gl_FragColor.a=mix(1.,gl_FragColor.a,k);}}
  #include <tonemapping_fragment>`;
function discHook(mat,mapExpr,declare){const prev=mat.onBeforeCompile;
  mat.onBeforeCompile=function(sh,r){prev.call(this,sh,r);Object.assign(sh.uniforms,SEENU);if(declare)sh.uniforms.uMapD=terrU.uMap;
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D uSeen;uniform float uDisc,uPaperK;'+(declare?'uniform vec2 uMapD;':''))
      .replace('#include <tonemapping_fragment>',PAPER_GLSL.replace(/DMAP/g,mapExpr))};
  mat.needsUpdate=true}
discHook(terrainMat,'uMap',false);discHook(waterMat,'uMapD',true);
/* rivers and ponds on unknown land are not drawn */
function discCut(mat,wp){const prev=mat.onBeforeCompile;mat.onBeforeCompile=function(sh,r){prev.call(this,sh,r);Object.assign(sh.uniforms,SEENU);sh.uniforms.uMapD=terrU.uMap;
    sh.fragmentShader='uniform sampler2D uSeen;uniform float uDisc;uniform vec2 uMapD;\n'+sh.fragmentShader.replace('#include <tonemapping_fragment>',`if(uDisc>.5&&texture2D(uSeen,(${wp}.xz+uMapD*.5)/uMapD).r<.45)discard;\n#include <tonemapping_fragment>`)};mat.needsUpdate=true}
try{discCut(riverMat,'vIW');discCut(pondMat,'vIW')}catch(e){}
/* animals, birds and the like (redrawn every frame, not culled): those on unknown land or sea are dropped before drawing */
function discFilterKits(){if(typeof KITS==='undefined')return;for(const n in KITS){const K=KITS[n],m=K.mesh;if(K.culled||!m.visible||!m.count||m.count>30000)continue;
    const A=m.instanceMatrix.array,IC=m.instanceColor,C=IC?IC.array:null;let v=0;
    for(let i=0;i<m.count;i++){const t=tileAt(A[i*16+12],A[i*16+14]);if(t>=0&&!seenTile(t))continue;if(v!==i){for(let q=0;q<16;q++)A[v*16+q]=A[i*16+q];if(C)for(let q=0;q<3;q++)C[v*3+q]=C[i*3+q]}v++}
    if(v!==m.count){m.count=v;m.instanceMatrix.needsUpdate=true;if(IC)IC.needsUpdate=true}}}

/* trees, rocks, ruins and the like on unknown land are left out when they are culled */
{const _ck=cullKit;cullKit=function(K,P,margin){if(DISC.on&&K.cs){if(K._dv!==DISC.ver||K._dn!==K.n||K._dcs!==K.cs){const cs=K.cs;
      if(K._dh&&K._dcs===cs)for(let q=0;q<K._dh.length;q+=2)cs[K._dh[q]*4+3]=K._dh[q+1];const hid=[];
      for(let i=0;i<K.n;i++){const t=tileAt(cs[i*4],cs[i*4+2]);if(t>=0&&!seenTile(t)&&cs[i*4+3]>-1e5){hid.push(i,cs[i*4+3]);cs[i*4+3]=-1e6}}
      K._dh=hid;K._dv=DISC.ver;K._dn=K.n;K._dcs=cs;K._cst=-1}}
    return _ck(K,P,margin)}}
/* no labels for mines and wells nobody has found */
{const _dl=drawDepositLabels;drawDepositLabels=function(){if(!DISC.on)return _dl.apply(this,arguments);const all=deposits;deposits=all.filter(d=>seenTile(d.i));try{return _dl.apply(this,arguments)}finally{deposits=all}}}
{const _rf=renderFrame;renderFrame=function(){try{if(DISC.on){discUpload();SEENU.uPaperK.value=1.55*(1-.72*(typeof nightF==='number'?nightF:0));if(typeof CULLK!=='undefined'&&DISC._cv!==DISC.ver){DISC._cv=DISC.ver;CULLK.dirty=true}
      if(typeof coveShips!=='undefined')for(const g of coveShips)g.visible=seenTile(tileAt(g.position.x,g.position.z));discFilterKits()}}catch(e){}return _rf.apply(this,arguments)}}
{const _us=updateShips;updateShips=function(y,dt){const r=_us.apply(this,arguments);try{discoverShips(dt||0)}catch(e){}return r}}

/* ---------- a new world, saving and loading ---------- */
{const _gw=genWorld;genWorld=function(){const r=_gw.apply(this,arguments);discReset(!!worldOpts.discover,null);if(DISC.on)discoverTick();return r}}
{const _bs=buildSave;buildSave=function(){const d=_bs.apply(this,arguments);if(DISC.on&&DISC.seen){d.seen=b64(DISC.seen);d.seenFull=DISC.full}return d}}
{const _as=applySave;applySave=function(d){const r=_as.apply(this,arguments);try{discReset(!!(d&&d.worldOpts&&d.worldOpts.discover),d&&d.seen?unb64(d.seen,Uint8Array):null);DISC.full=!!(d&&d.seenFull);if(DISC.on&&!d.seen)discoverTick()}catch(e){console.warn('discovery load',e)}return r}}
/* the World panel: how much of the world is known */
function discShare(){if(!DISC.on||!DISC.seen)return 1;let k=0;for(let i=0;i<N;i++)if(DISC.seen[i]>110)k++;return k/N}
