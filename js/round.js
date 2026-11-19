"use strict";
/* Faithbound — the round world, drawn. East and west meet: near the seam the far side of the world is drawn again a world-width
   away, so you look straight across it. The ground, water, roads and fields get a copy (sharing the same shapes and materials);
   towns, trees and the like are culled once for each side and the copies that show are moved across; ships, labels and
   people are placed at whichever copy is nearest the camera. */

/* which sides need a copy: the seam is within sight */
function roundSides(){if(!ROUND||typeof camT==='undefined')return[];const reach=camDist*2.4+16,o=[];if(camT.x+reach>W/2)o.push(W);if(camT.x-reach<-W/2)o.push(-W);return o}

/* ---------- culled kits: one pass per side, the matches shifted by that side ---------- */
{const _ck=cullKit,tmp={A:null,C:null};
  const shift=(K,S)=>{const cs=K.cs,M=K.mm,n=K.n;for(let i=0;i<n;i++){cs[i*4]+=S;M[i*16+12]+=S}if(K.cB)for(let c=0;c<K.cN;c++)K.cB[c*5]+=S;K._cst=-1};
  cullKit=function(K,P,margin){if(CULL_S.length<2||!K.cs||!K.mm)return _ck(K,P,margin);
    const IM=K.mesh.instanceMatrix,A=IM.array,IC=K.mesh.instanceColor,C=IC?IC.array:null,cap=A.length/16;
    if(!tmp.A||tmp.A.length<A.length)tmp.A=new Float32Array(A.length);if(C&&(!tmp.C||tmp.C.length<C.length))tmp.C=new Float32Array(C.length);
    let tot=0;
    for(const S of CULL_S){if(S)shift(K,S);try{K._cst=-1;_ck(K,P,margin)}finally{if(S)shift(K,-S)}
      const v=Math.min(K.mesh.count,cap-tot);if(v>0){tmp.A.set(A.subarray(0,v*16),tot*16);if(C)tmp.C.set(C.subarray(0,v*3),tot*3);tot+=v}}
    A.set(tmp.A.subarray(0,tot*16));if(C)C.set(tmp.C.subarray(0,tot*3));K.mesh.count=tot;
    IM.needsUpdate=true;if(IM.updateRange){IM.updateRange.offset=0;IM.updateRange.count=tot*16}
    if(IC){IC.needsUpdate=true;if(IC.updateRange){IC.updateRange.offset=0;IC.updateRange.count=tot*3}}}}

/* ---------- copies of the ground, water, roads, rivers, fields and the kits that are not culled ---------- */
const RGH={list:[],at:0,map:new Map()};
function roundSources(){const out=[];const take=o=>{if(o&&(o.isMesh||o.isInstancedMesh))out.push(o)};
  if(typeof TLOD!=='undefined'){for(const L of [TLOD.t,TLOD.w])if(L&&L.grp.visible)for(const m of L.grp.children)take(m)}
  take(terrainMesh);take(waterMesh);
  if(typeof roadMeshes!=='undefined')for(const m of roadMeshes)take(m);
  take(riverMesh);take(fieldMesh);take(borderMesh);
  if(typeof KITS!=='undefined')for(const n in KITS){const K=KITS[n];if(K&&K.mesh&&!K.culled)take(K.mesh)}
  return [...new Set(out)]}
function roundGhost(src,S){const key=src.uuid+'|'+S;let g=RGH.map.get(key);
  if(!g){g=src.isInstancedMesh?new THREE.InstancedMesh(src.geometry,src.material,1):new THREE.Mesh(src.geometry,src.material);g.matrixAutoUpdate=false;g.frustumCulled=src.frustumCulled;g.userData.ghost=1;scene.add(g);RGH.map.set(key,g)}
  g.geometry=src.geometry;g.material=src.material;g.castShadow=src.castShadow;g.receiveShadow=src.receiveShadow;g.renderOrder=src.renderOrder;
  if(src.isInstancedMesh){g.instanceMatrix=src.instanceMatrix;g.instanceColor=src.instanceColor;g.count=src.count}
  g.matrix.copy(src.matrixWorld);g.matrix.elements[12]+=S;g.matrixWorldNeedsUpdate=true;g.userData.used=RGH.at;return g}
const visibleUp=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true};
/* the maps the ground shader reads (who owns what, war fronts, wet ground) repeat sideways, so the copies read the right place */
let RWRAP=null;function roundTextures(){const want=ROUND?THREE.RepeatWrapping:THREE.ClampToEdgeWrapping,ts=[typeof ownTex!=='undefined'?ownTex:null,typeof warTex!=='undefined'?warTex:null,typeof WXG!=='undefined'?WXG.tex:null];
  const key=ts.map(t=>t?t.uuid:'-').join()+want;if(key===RWRAP)return;RWRAP=key;for(const t of ts)if(t&&t.wrapS!==want){t.wrapS=want;t.needsUpdate=true}}
function roundTick(){RGH.at++;roundTextures();const sides=roundSides();
  if(sides.length){RGH.list=roundSources();/* every frame: the ground's detail level changes as you move, and with it which piece is shown */
    for(const src of RGH.list){if(!src.parent||!visibleUp(src)||(src.isInstancedMesh&&!src.count)){continue}src.updateMatrixWorld();for(const S of sides){const g=roundGhost(src,S);g.visible=true}}}
  for(const [k,g] of RGH.map){if(g.userData.used!==RGH.at){g.visible=false;if(RGH.at-g.userData.used>600){scene.remove(g);RGH.map.delete(k)}}}}
{const _rf=renderFrame;renderFrame=function(){try{roundTick()}catch(e){}return _rf.apply(this,arguments)}}
/* a new world (or a loaded one) drops the old copies */
{const _gw=genWorld;genWorld=function(){for(const g of RGH.map.values())scene.remove(g);RGH.map.clear();RGH.list=[];return _gw.apply(this,arguments)}}
{const _as=applySave;applySave=function(){for(const g of RGH.map.values())scene.remove(g);RGH.map.clear();RGH.list=[];return _as.apply(this,arguments)}}
