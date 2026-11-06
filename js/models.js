"use strict";
/* Faithbound — real 3D models (Quaternius, CC0): animals, people, ships, planes and tanks.
   Each model is loaded once, turned to face +x (vehicles) or +z (people and animals), stood on the ground and scaled.
   Animated ones are posed at a few frames of each cycle ahead of time, so hundreds of them draw as instanced meshes
   with no per-frame skinning. Clothes, skin and hair keep their own colour per instance, so every era and culture can dress its people. */

const MDL={ready:{},geo:{},frames:{},info:{}};let MDL_VER=0;
/* which material is which part: 1 top, 2 bottom, 3 skin, 4 hair, 5 sail */
function partOf(name){const n=(name||'').toLowerCase();
  if(/shirt|jacket|dress|armor|tank ?top|top/.test(n))return 1;if(/pants|sock/.test(n))return 2;if(/skin/.test(n))return 3;if(/hair/.test(n))return 4;if(/fabric|sail/.test(n))return 5;return 0}
/* flatten a posed model into one geometry with vertex colours and part tags, in world space */
const _mv=new THREE.Vector3();
function flatten(root){const P=[],C=[],T=[];root.updateMatrixWorld(true);
  root.traverse(o=>{if(!o.isMesh)return;const g=o.geometry,pos=g.attributes.position,idx=g.index,mats=Array.isArray(o.material)?o.material:[o.material];
    const groups=g.groups&&g.groups.length?g.groups:[{start:0,count:idx?idx.count:pos.count,materialIndex:0}];
    for(const gr of groups){const m=mats[gr.materialIndex||0]||mats[0],col=m&&m.color?m.color:new THREE.Color(1,1,1),part=partOf(m&&m.name);
      for(let k=gr.start;k<gr.start+gr.count;k++){const i=idx?idx.getX(k):k;_mv.fromBufferAttribute(pos,i);
        if(o.isSkinnedMesh)o.boneTransform(i,_mv);_mv.applyMatrix4(o.matrixWorld);P.push(_mv.x,_mv.y,_mv.z);C.push(col.r,col.g,col.b);T.push(part)}}});
  return {P,C,T}}
/* stand it on the ground, centre it, point its length along the wanted axis and scale it to size */
function normalizer(f,o){let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9,z0=1e9,z1=-1e9;const P=f.P;
  for(let i=0;i<P.length;i+=3){x0=Math.min(x0,P[i]);x1=Math.max(x1,P[i]);y0=Math.min(y0,P[i+1]);y1=Math.max(y1,P[i+1]);z0=Math.min(z0,P[i+2]);z1=Math.max(z1,P[i+2])}
  const cx=(x0+x1)/2,cz=(z0+z1)/2,lenX=x1-x0,lenZ=z1-z0,longX=lenX>=lenZ;
  /* people are scaled by height, everything else by length */
  const s=o.h?o.h/(y1-y0):o.len/Math.max(lenX,lenZ),turn=(o.axis==='none'?0:o.axis==='x'?(longX?0:Math.PI/2):(longX?Math.PI/2:0))+(o.flip?Math.PI:0)+(o.yaw||0);
  const c=Math.cos(turn),sn=Math.sin(turn);
  return (P2)=>{const out=new Float32Array(P2.length);for(let i=0;i<P2.length;i+=3){const x=(P2[i]-cx)*s,y=(P2[i+1]-y0)*s,z=(P2[i+2]-cz)*s;out[i]=x*c+z*sn;out[i+1]=y;out[i+2]=-x*sn+z*c}return out}}
function toGeo(P,f){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(f.C,3));g.setAttribute('aPart',new THREE.Float32BufferAttribute(f.T,1));g.computeVertexNormals();g.computeBoundingSphere();return g}

/* the shared look: vertex colours, with instanced colours for clothes, skin and hair (or sails) */
function partMat(){const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.82,metalness:0});
  m.onBeforeCompile=sh=>{sh.vertexShader='attribute float aPart;\n#ifdef USE_INSTANCING\nattribute vec3 iTop;attribute vec3 iBot;attribute vec3 iSkin;attribute vec3 iHair;\n#endif\n'+sh.vertexShader.replace('#include <color_vertex>',`#include <color_vertex>
    #ifdef USE_INSTANCING
    if(aPart>.5&&aPart<1.5)vColor.xyz=iTop;else if(aPart>1.5&&aPart<2.5)vColor.xyz=iBot;else if(aPart>2.5&&aPart<3.5)vColor.xyz=iSkin;else if(aPart>3.5&&aPart<4.5)vColor.xyz=iHair;else if(aPart>4.5)vColor.xyz=iTop;
    #endif`)};m.customProgramCacheKey=()=>'partmat';return m}
const MODEL_MAT=partMat();
/* an instanced kit that also carries per-instance part colours */
function mkit(name,geo,max,shadow){for(const a of ['iTop','iBot','iSkin','iHair'])geo.setAttribute(a,new THREE.InstancedBufferAttribute(new Float32Array(max*3).fill(1),3));kit(name,geo,MODEL_MAT,max,shadow);KITS[name].m=true}
const _mc=new THREE.Color(),_md=new THREE.Object3D();
function addM(name,x,y,z,s,ry,top,bot,skin,hair,tilt){const K=KITS[name];if(!K||K.k>=K.max)return;_md.position.set(x,y,z);_md.rotation.set(tilt||0,ry,0);_md.scale.setScalar(s);_md.updateMatrix();
  K.mesh.setMatrixAt(K.k,_md.matrix);const g=K.mesh.geometry,i=K.k*3;
  for(const [a,h] of [['iTop',top],['iBot',bot],['iSkin',skin],['iHair',hair]]){if(h==null)continue;_mc.set(h).convertSRGBToLinear();const A=g.attributes[a].array;A[i]=_mc.r;A[i+1]=_mc.g;A[i+2]=_mc.b}
  K.k++}
function mcommit(names){for(const n of names){const K=KITS[n];if(!K)continue;K.mesh.count=K.k;K.mesh.instanceMatrix.needsUpdate=true;for(const a of ['iTop','iBot','iSkin','iHair'])K.mesh.geometry.attributes[a].needsUpdate=true}}

/* what to load: size, axis, which way is forward, and which animations to pose */
const MODEL_DEFS={
  cow:{len:.066,axis:'z',anims:{walk:['Walk',8],idle:['Idle',2]}},horse:{len:.07,axis:'z',anims:{walk:['Walk',8],idle:['Idle',2]}},
  sheep:{len:.048,axis:'z',anims:{idle:['Idle',4]}},pig:{len:.044,axis:'z',anims:{idle:['Idle',4]}},
  male_casual:{none:1,h:.05,axis:'z',anims:{walk:['Walk',8],idle:['Idle',2]}},male_shirt:{none:1,h:.05,axis:'z',anims:{walk:['Walk',8],idle:['Idle',2]}},
  female_casual:{none:1,h:.047,axis:'z',anims:{walk:['Walk',8],idle:['Idle',2]}},female_dress:{none:1,h:.047,axis:'z',anims:{walk:['Walk',8],idle:['Idle',2]}},
  knightcharacter:{none:1,h:.052,axis:'z',anims:{walk:['Walk',8],idle:['Idle',2]}},
  viking_boat:{len:.42,axis:'x'},sail_ship:{len:.52,axis:'x'},boatwsail:{len:.2,axis:'x'},cruiseship:{len:.85,axis:'x'},
  commercial_airplane:{len:.25,axis:'x'},military_airplane:{len:.16,axis:'x'},smallplane:{len:.13,axis:'x'},
  tank:{len:.08,axis:'x'},tank2:{len:.08,axis:'x'},tank3:{len:.08,axis:'x'}};
/* per-model corrections found by looking at them in the game */
const MODEL_FIX={male_casual:{yaw:-Math.PI/2},male_shirt:{yaw:-Math.PI/2},female_casual:{yaw:-Math.PI/2},female_dress:{yaw:-Math.PI/2},knightcharacter:{yaw:-Math.PI/2},tank:{flip:1},tank2:{flip:1},tank3:{flip:1},commercial_airplane:{yaw:Math.PI/2},military_airplane:{yaw:Math.PI/2},smallplane:{yaw:Math.PI/2}};
const MODEL_CAP={cow:500,horse:300,sheep:600,pig:300,male_casual:500,male_shirt:500,female_casual:500,female_dress:500,knightcharacter:700,tank:300,tank2:300,tank3:300};

function findClip(anims,want){const w=want.toLowerCase();return anims.find(a=>{const n=a.name.toLowerCase().split('|').pop();return n===w||n.endsWith('_'+w)})||anims.find(a=>a.name.toLowerCase().includes(w))}
function prepModel(name,gltf){const d=Object.assign({},MODEL_DEFS[name],MODEL_FIX[name]||{});if(d.none)d.axis='none';const root=gltf.scene;root.updateMatrixWorld(true);
  const rest=flatten(root),norm=normalizer(rest,d);MDL.info[name]={d};
  if(d.anims){const mixer=new THREE.AnimationMixer(root);MDL.frames[name]={};
    for(const [key,[clipName,n]] of Object.entries(d.anims)){const clip=findClip(gltf.animations,clipName);if(!clip)continue;const act=mixer.clipAction(clip);act.play();const list=[];
      for(let f=0;f<n;f++){mixer.setTime(clip.duration*f/n+1e-4);root.updateMatrixWorld(true);const fr=flatten(root);const kn=`m_${name}_${key}${f}`;mkit(kn,toGeo(norm(fr.P),fr),MODEL_CAP[name]||300,false);list.push(kn)}
      act.stop();MDL.frames[name][key]=list}
    if(!MDL.frames[name].walk&&MDL.frames[name].idle)MDL.frames[name].walk=MDL.frames[name].idle;
    if(!MDL.frames[name].idle&&MDL.frames[name].walk)MDL.frames[name].idle=[MDL.frames[name].walk[0]]}
  else{if(/military/.test(name))for(let i=0;i<rest.C.length;i++)rest.C[i]*=.66;/* military grey */const g=toGeo(norm(rest.P),rest);MDL.geo[name]=g;if(/^tank/.test(name))mkit('m_'+name,g,MODEL_CAP[name]||300,true)}
  MDL.ready[name]=true;MDL_VER++;if(typeof propsDirty!=='undefined')propsDirty=true}
const MODEL_KITS=()=>Object.keys(KITS).filter(n=>KITS[n].m&&n.startsWith('m_')&&!/^m_tank/.test(n));
(function loadModels(){if(typeof THREE.GLTFLoader!=='function')return;const L=new THREE.GLTFLoader();
  const ok=(name,g)=>{try{prepModel(name,g)}catch(e){console.warn('model',name,e)}};
  /* a web host that cannot serve .glb gets the same model packed as base64 in a .json file */
  const viaJson=name=>fetch('assets/models/'+name+'.json').then(r=>r.ok?r.json():null).then(j=>{if(!j||!j.b64)return;const bin=atob(j.b64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);L.parse(u.buffer,'',g=>ok(name,g),()=>{})}).catch(()=>{});
  for(const name of Object.keys(MODEL_DEFS))L.load('assets/models/'+name+'.glb',g=>ok(name,g),undefined,()=>viaJson(name))})();
const modelOn=name=>settings.models!==false&&!!MDL.ready[name];

/* ---------- animals ---------- */
function drawHerdModel(h,k,x,y,z,rot,T,graze,moving){const name=h.kind==='sheep'?'sheep':h.kind==='cow'?'cow':h.kind;if(!modelOn(name))return false;
  const F=MDL.frames[name],list=moving&&F.walk?F.walk:F.idle,fi=Math.floor((T*(moving?7:1.5)+k*1.7))%list.length;
  addM(list[(fi+list.length)%list.length],x,y,z,1,rot,null,null,null,null);return true}

/* ---------- people ---------- */
function folkModel(w){if(w.sol)return w.uni<=4?'knightcharacter':(w.seed&1?'male_shirt':'male_casual');if(w.fem)return w.dress&&w.long?'female_dress':(w.seed&2?'female_casual':'female_dress');return w.seed&4?'male_shirt':'male_casual'}
function drawFolkModel(w,gy){const name=folkModel(w);if(!modelOn(name)||(typeof camDist!=='undefined'&&camDist>9))return false;
  const F=MDL.frames[name],moving=w.moving&&F.walk,list=moving?F.walk:F.idle,TAU=6.2832;
  const fi=moving?Math.floor((((w.ph%TAU)+TAU)%TAU)/TAU*list.length):Math.floor((w.t||0)*1.2)%list.length;
  const s=w.kid?.7:1,top=w.dress||w.top,bot=w.dress&&w.long?w.dress:w.bot;
  addM(list[fi%list.length],w.x,gy,w.z,s,w.dir,top,bot,w.skin,w.hair);return true}

/* ---------- ships: a real hull for galleys, galleons and liners ---------- */
const SHIP_GEO_CACHE={};
function shipModelFor(era,kind){if(era<=2)return 'viking_boat';if(era<=4)return 'sail_ship';if(era===6&&kind!=='war'&&Math.random()<.5)return 'cruiseship';return null}
function shipGeoVariant(name,sail){const key=name+'|'+sail;if(SHIP_GEO_CACHE[key])return SHIP_GEO_CACHE[key];const g=MDL.geo[name].clone(),C=g.attributes.color,T=g.attributes.aPart,c=new THREE.Color(sail).convertSRGBToLinear();
  if(sail!=null)for(let i=0;i<T.count;i++)if(T.getX(i)>4.5)C.setXYZ(i,c.r,c.g,c.b);C.needsUpdate=true;return SHIP_GEO_CACHE[key]=g}
const SHIP_MODEL_MAT=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8});
function modelShip(era,kind,color,nflag){const name=shipModelFor(era,kind);if(!name||!modelOn(name))return null;
  const g=new THREE.Group(),mats=[];g.userData.mats=mats;const pir=kind==='pirate';
  const sail=pir?0x1a1a1a:kind==='war'?(()=>{const a=new THREE.Color(0xf2ead8),b=new THREE.Color(color);return a.lerp(b,.3).getHex()})():null;
  const m=new THREE.Mesh(shipGeoVariant(name,sail),SHIP_MODEL_MAT);m.castShadow=true;g.add(m);
  /* the nation's flag at the stern */
  if(typeof flagTexture==='function'||pir){const geo=MDL.geo[name];geo.computeBoundingBox();const bb=geo.boundingBox,fm=stdMat({map:!pir&&nflag&&typeof flagTexture==='function'?flagTexture(nflag):flagTex(pir?'#111':color,pir),side:THREE.DoubleSide,roughness:.9});mats.push(fm);
    /* a flagpole at the stern, the flag at its top */
    const px=bb.min.x+(bb.max.x-bb.min.x)*.06,ph=bb.max.y*.42,pole=new THREE.Mesh(SG.cyl,SM.wood);pole.scale.set(.0035,ph,.0035);pole.position.set(px,bb.max.y*.12+ph/2,0);g.add(pole);
    const f=new THREE.Mesh(SG.sail,fm);const w=.03;f.scale.set(w,w*.62,1);f.position.set(px-w*.55,bb.max.y*.12+ph-.004,0);f.userData.flag=true;g.add(f)}
  return g}
{const _ms=makeShip;makeShip=function(era,kind,color,nflag){return modelShip(era,kind,color,nflag)||_ms.apply(this,arguments)}}

/* ---------- planes ---------- */
const PLANE_MAT=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.45,metalness:.15});
function modelPlane(name,scale){if(!modelOn(name))return null;const g=new THREE.Group();const m=new THREE.Mesh(MDL.geo[name],PLANE_MAT);m.castShadow=true;g.add(m);g.userData.props=[];g.scale.setScalar(scale||1);scene.add(g);return g}
{const _mp=makePlane;makePlane=function(color,future){return (!future&&modelPlane('commercial_airplane'))||_mp.apply(this,arguments)}}
{const _mw=makeWarPlane;makeWarPlane=function(n,kind){const g=kind==='fighter'?modelPlane('military_airplane'):kind==='bomber'?modelPlane('military_airplane',1.5):kind==='bi'?modelPlane('smallplane'):null;if(g){g.userData.kind=kind;return g}return _mw.apply(this,arguments)}}
