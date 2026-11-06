"use strict";
/* Faithbound — real 3D models (Quaternius, CC0): animals, people, ships, planes and tanks.
   Each model is loaded once, turned to face +x (vehicles) or +z (people and animals), stood on the ground and scaled.
   Animated ones are posed at a few frames of each cycle ahead of time, so hundreds of them draw as instanced meshes
   with no per-frame skinning. Clothes, skin and hair keep their own colour per instance, so every era and culture can dress its people. */

const MDL={ready:{},geo:{},frames:{},info:{}};let MDL_VER=0;
/* which material is which part: 1 top, 2 bottom, 3 skin, 4 hair, 5 sail */
function partOf(name){const n=(name||'').toLowerCase();
  if(/^leaves|^rock/.test(n))return 6;if(/shirt|jacket|dress|armor|tank ?top|top/.test(n))return 1;if(/pants|sock/.test(n))return 2;if(/skin/.test(n))return 3;if(/hair/.test(n))return 4;if(/fabric|sail/.test(n))return 5;return 0}
/* flatten a posed model into one geometry with vertex colours and part tags, in world space */
const _mv=new THREE.Vector3();
function flatten(root){const P=[],C=[],T=[];root.updateMatrixWorld(true);
  root.traverse(o=>{if(!o.isMesh)return;const g=o.geometry,pos=g.attributes.position,idx=g.index,mats=Array.isArray(o.material)?o.material:[o.material];
    const groups=g.groups&&g.groups.length?g.groups:[{start:0,count:idx?idx.count:pos.count,materialIndex:0}],bk=g.attributes._bake;
    for(const gr of groups){const m=mats[gr.materialIndex||0]||mats[0],col=m&&m.color?m.color:new THREE.Color(1,1,1),part=partOf(m&&m.name);
      for(let k=gr.start;k<gr.start+gr.count;k++){const i=idx?idx.getX(k):k;_mv.fromBufferAttribute(pos,i);
        if(o.isSkinnedMesh)o.boneTransform(i,_mv);_mv.applyMatrix4(o.matrixWorld);P.push(_mv.x,_mv.y,_mv.z);if(bk)C.push(bk.getX(i),bk.getY(i),bk.getZ(i));else C.push(col.r,col.g,col.b);T.push(part)}}});
  return {P,C,T}}
/* stand it on the ground, centre it, point its length along the wanted axis and scale it to size */
function normalizer(f,o){let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9,z0=1e9,z1=-1e9;const P=f.P;
  for(let i=0;i<P.length;i+=3){x0=Math.min(x0,P[i]);x1=Math.max(x1,P[i]);y0=Math.min(y0,P[i+1]);y1=Math.max(y1,P[i+1]);z0=Math.min(z0,P[i+2]);z1=Math.max(z1,P[i+2])}
  const cx=(x0+x1)/2,cz=(z0+z1)/2,lenX=x1-x0,lenZ=z1-z0,longX=lenX>=lenZ;
  /* people are scaled by height, everything else by length */
  if(o.unit){const ux=1/lenX,uy=1/(y1-y0),uz=1/lenZ,m=Math.max(lenX,lenZ);o.dim=[lenX/m,(y1-y0)/m,lenZ/m];return (P2)=>{const out=new Float32Array(P2.length);for(let i=0;i<P2.length;i+=3){out[i]=(P2[i]-cx)*ux;out[i+1]=(P2[i+1]-y0)*uy+(o.dy||0);out[i+2]=(P2[i+2]-cz)*uz}return out}}
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
  tank:{len:.17,axis:'x'},tank2:{len:.17,axis:'x'},tank3:{len:.17,axis:'x'},
  zebra:{len:.068,axis:'z',anims:{walk:['Walk',8],idle:['Idle',2]}},llama:{len:.06,axis:'z',anims:{idle:['Idle',4]}},wolf:{len:.056,axis:'z',anims:{walk:['Walking',8],idle:['Idle',2]}},
  dolphin:{len:.1,axis:'z',anims:{swim:['Swim',6]}},shark:{len:.11,axis:'z',anims:{swim:['Swim',6]}},whale:{len:.3,axis:'z',anims:{swim:['Swim',6]}},manta_ray:{len:.09,axis:'z',anims:{swim:['Swim',6]}},
  fish1:{len:.022,axis:'z',anims:{swim:['Swim',4]}},fish2:{len:.02,axis:'z',anims:{swim:['Swim',4]}},fish3:{len:.02,axis:'z',anims:{swim:['Swim',4]}}};
/* per-model corrections found by looking at them in the game */
const MODEL_FIX={wolf:{flip:1},male_casual:{yaw:-Math.PI/2},male_shirt:{yaw:-Math.PI/2},female_casual:{yaw:-Math.PI/2},female_dress:{yaw:-Math.PI/2},knightcharacter:{yaw:-Math.PI/2},tank:{flip:1},tank2:{flip:1},tank3:{flip:1},commercial_airplane:{yaw:Math.PI/2},military_airplane:{yaw:Math.PI/2},smallplane:{yaw:Math.PI/2}};
const MODEL_CAP={zebra:300,llama:200,wolf:200,dolphin:60,shark:30,whale:20,manta_ray:30,fish1:300,fish2:300,fish3:300,cow:500,horse:300,sheep:600,pig:300,male_casual:500,male_shirt:500,female_casual:500,female_dress:500,knightcharacter:700,tank:300,tank2:300,tank3:300};

function findClip(anims,want){const w=want.toLowerCase();return anims.find(a=>{const n=a.name.toLowerCase().split('|').pop();return n===w||n.endsWith('_'+w)})||anims.find(a=>a.name.toLowerCase().includes(w))}
function prepModel(name,gltf){const d=Object.assign({},MODEL_DEFS[name],MODEL_FIX[name]||{});if(d.none)d.axis='none';const root=gltf.scene;root.updateMatrixWorld(true);
  const rest=flatten(root),norm=normalizer(rest,d);MDL.info[name]={d};
  if(d.anims){const mixer=new THREE.AnimationMixer(root);MDL.frames[name]={};
    for(const [key,[clipName,n]] of Object.entries(d.anims)){const clip=findClip(gltf.animations,clipName);if(!clip)continue;const act=mixer.clipAction(clip);act.play();const list=[];
      for(let f=0;f<n;f++){mixer.setTime(clip.duration*f/n+1e-4);root.updateMatrixWorld(true);const fr=flatten(root);const kn=`m_${name}_${key}${f}`;mkit(kn,toGeo(norm(fr.P),fr),MODEL_CAP[name]||300,false);list.push(kn)}
      act.stop();MDL.frames[name][key]=list}
    if(MDL.frames[name].swim){MDL.frames[name].walk=MDL.frames[name].idle=MDL.frames[name].swim}
    if(!MDL.frames[name].walk&&MDL.frames[name].idle)MDL.frames[name].walk=MDL.frames[name].idle;
    if(!MDL.frames[name].idle&&MDL.frames[name].walk)MDL.frames[name].idle=[MDL.frames[name].walk[0]]}
  else{if(/military/.test(name))for(let i=0;i<rest.C.length;i++)rest.C[i]*=.66;/* military grey */const g=toGeo(norm(rest.P),rest);MDL.geo[name]=g;if(/^tank/.test(name))mkit('m_'+name,g,MODEL_CAP[name]||300,true)}
  MDL.ready[name]=true;MDL_VER++;if(typeof propsDirty!=='undefined')propsDirty=true}
/* ---------- static models: trees, rocks, buildings, landmarks and vehicles, each one an instanced kit ----------
   tree: leaves take the instance colour (so every biome and season tints them), the trunk keeps its own; wind and photo leaves as the other trees.
   unit: squeezed into a 1x1x1 box standing on the ground, so add(name,x,y,z,w,h,d) places it at exactly that size and its footprint is solid. */
const SMODEL={tree_a:{k:'tree',h:1.05,max:6000},tree_b:{k:'tree',h:.95,max:6000},tree_d:{k:'tree',h:1.1,max:6000},
  tree_c:{k:'tree',h:1.1,max:9000},bush_a:{k:'tree',h:.95,max:9000},bush_b:{k:'tree',h:1,max:9000},bush_c:{k:'tree',h:.9,max:9000},
  car1:{k:'veh',len:.05,max:400},car2:{k:'veh',len:.05,max:400},suv:{k:'veh',len:.054,max:400},sports1:{k:'veh',len:.05,max:300},sports2:{k:'veh',len:.05,max:300},taxi:{k:'veh',len:.05,max:300},cop:{k:'veh',len:.05,max:200},
  bus:{k:'veh',len:.08,max:200},schoolbus:{k:'veh',len:.075,max:100},
  loco_front:{k:'veh',len:.1,max:60},loco_tender:{k:'veh',len:.055,max:60},loco_wagon:{k:'veh',len:.09,max:180},hs_front:{k:'veh',len:.12,max:60},hs_wagon:{k:'veh',len:.1,max:180},
  cargo_front:{k:'veh',len:.1,max:60},cargo_box:{k:'veh',len:.09,max:180},cargo_coal:{k:'veh',len:.08,max:180},
  rock_a:{k:'rock',unit:1,dy:-.22,max:3000},rock_b:{k:'rock',unit:1,dy:-.22,max:3000},rock_c:{k:'rock',unit:1,dy:-.22,max:3000}};
Object.assign(SMODEL,{med_house:{k:'build',unit:1,max:3000},town2s:{k:'build',unit:1,max:2000},
  town3b:{k:'build',unit:1,max:1500},town3s:{k:'build',unit:1,max:2000},town4:{k:'build',unit:1,max:900},cottage1:{k:'build',unit:1,max:2000},
  sub_house1:{k:'build',unit:1,max:2500},sub_house2:{k:'build',unit:1,max:2500},sub_house3:{k:'build',unit:1,max:2500},sub_house4:{k:'build',unit:1,max:2500},sub_house5:{k:'build',unit:1,max:2500},
  flat1:{k:'build',unit:1,max:1200},flat2:{k:'build',unit:1,max:1200},shop:{k:'build',unit:1,max:1200},hospital:{k:'build',unit:1,max:200},bank:{k:'build',unit:1,max:200},
  egypt_temple:{k:'build',unit:1,max:80},japan_temple:{k:'build',unit:1,max:80},maya_temple:{k:'build',unit:1,max:80},pantheon:{k:'build',unit:1,max:80},
  farm_barn:{k:'farm',unit:1,max:1500},farm_bigbarn:{k:'farm',unit:1,max:1000},farm_smallbarn:{k:'farm',unit:1,max:1500},farm_openbarn:{k:'farm',unit:1,max:1000},farm_silo:{k:'farm',unit:1,max:1500},
  farm_silo_house:{k:'farm',unit:1,max:800},farm_windmill:{k:'farm',unit:1,max:800},farm_towerwindmill:{k:'farm',unit:1,max:400},farm_watertower:{k:'farm',unit:1,max:600},farm_well:{k:'farm',unit:1,max:800},farm_chickencoop:{k:'farm',unit:1,max:1200}});
let MTREE_MAT=null,SBVER=0;
function modelTreeMat(){if(MTREE_MAT)return MTREE_MAT;const m=treeMat.clone();const base=treeMat.onBeforeCompile;
  m.onBeforeCompile=sh=>{base(sh);sh.vertexShader=sh.vertexShader.replace('#include <color_vertex>',`vColor=color.xyz;
    #ifdef USE_INSTANCING_COLOR
    {float lf=1.-step(.025,abs(color.r-color.b));vColor.xyz*=mix(vec3(1.),instanceColor.xyz,lf);}
    #endif`)};m.customProgramCacheKey=()=>'mtree';return MTREE_MAT=m}
const SMODEL_MAT=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,metalness:0});
const VEH_MAT=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5,metalness:.15});const VEH_KITS=[];
function prepStatic(name,gltf){const d=Object.assign({},SMODEL[name]);gltf.scene.updateMatrixWorld(true);const f=flatten(gltf.scene);
  /* leaves and rocks become white with a little height shading, so the instance colour paints them */
  if(d.k==='tree'||d.k==='rock'){let y0=1e9,y1=-1e9;for(let i=1;i<f.P.length;i+=3){y0=Math.min(y0,f.P[i]);y1=Math.max(y1,f.P[i])}
    for(let v=0;v<f.T.length;v++)if(f.T[v]===6){const t=(f.P[v*3+1]-y0)/((y1-y0)||1),ao=d.k==='rock'?.82+.18*t:.62+.38*t;f.C[v*3]=f.C[v*3+1]=f.C[v*3+2]=ao}}
  if(d.k==='tree'&&KITS.broad){const g=KITS.broad.mesh.geometry;g.computeBoundingBox();d.h*=g.boundingBox.max.y-Math.max(0,g.boundingBox.min.y)}
  const norm=normalizer(f,Object.assign(d,{axis:d.k==='veh'?'z':'none'},MODEL_FIX[name]||{}));const geo=toGeo(norm(f.P),f);const kn='s_'+name;MDL.info[name]={d};
  kit(kn,geo,d.k==='tree'||d.k==='rock'?modelTreeMat():d.k==='veh'?VEH_MAT:SMODEL_MAT,d.max||2000,d.k!=='rock');
  if(d.k==='veh')VEH_KITS.push(kn);else (d.k==='build'?BUILD_KITS:TREE_KITS).push(kn);MDL.ready[name]=true;MDL_VER++;if(d.k==='build')SBVER++;
  if(d.k!=='build'){if(typeof treesDirty!=='undefined')treesDirty=true}if(typeof propsDirty!=='undefined')propsDirty=true}
const sOn=name=>settings.models!==false&&!!MDL.ready[name];
/* which kit draws a tree of this kind: the model when it has loaded, the old shape otherwise */
const NAT_SETS={broad:['bush_a','bush_b','tree_c','bush_c'],acacia:['tree_a','tree_b','tree_d'],rock:['rock_a','rock_b','rock_c']};
function natKit(kind,hv){const L=NAT_SETS[kind];if(L){const n=L[Math.floor(((hv*7.31)%1)*L.length)];if(sOn(n))return 's_'+n}return kind==='acacia'?'broad':kind}
/* a building model fitted inside a w x d plot, keeping its own proportions; it stands as a solid thing like any other house */
function addB(name,x,y,z,w,d,rot,hex,hs){if(!sOn(name))return false;const [a,b,c]=MDL.info[name].d.dim,s=Math.min(w/a,d/c);add('s_'+name,x,y,z,a*s,b*s*(hs||1),c*s,rot||0,hex==null?0xffffff:hex);return true}
const pickH=(L,h)=>L[Math.floor(((h*9.73)%1)*L.length)];
const HOUSE_TINT=[0xffffff,0xfff2e4,0xf2f0ff,0xffead8,0xeef6ee,0xfff8f0];
/* western and northern towns: half-timbered houses in the Middle Ages, tall gabled townhouses in the Age of Sail and the Industrial age, suburbs in the Modern age */
function modelDwelling(n,x,y,z,rot,e,hk,k,core){if((typeof MCTX!=='undefined'&&MCTX&&MCTX.lagoon)||settings.models===false)return false;const cu=n?cultOf(n):'west';if(cu!=='west'&&cu!=='nordic')return false;
  const w=Math.max(.09,Math.min(.15,(MCTX&&MCTX.w)||.12)),r=hash(hk*13.7+k*.37),tint=pickH(HOUSE_TINT,r*3.1),yy=y-.012;
  if(e===3)return r<.45&&addB('med_house',x,yy,z,.1,.09,rot,tint);
  if(e===4){if(core>.3)return addB(pickH(['town3s','town2s','town3s'],r),x,yy,z,.11,.09,rot,tint);return r<.55&&addB('med_house',x,yy,z,.1,.09,rot,tint)}
  if(e===5){const L=core>.62?['town4','town3b','town2s','town4']:core>.25?['town2s','town3s','town3b']:['cottage1','town2s','town3s','cottage1'];return addB(pickH(L,r),x,yy,z,w,w*.85,rot,tint)}
  if(e===6){if(core<.42)return addB(pickH(['sub_house1','sub_house2','sub_house3','sub_house4','sub_house5'],r),x,yy,z,w*.95,w*.85,rot,tint);
    if(core<.62&&r<.45)return addB(pickH(['flat1','flat2','shop','flat1'],r),x,yy,z,w*.85,w*.8,rot,tint);return false}
  return false}
{const _dw=dwelling;dwelling=function(n,x,y,z,rot,e,hk,k,core){if(modelDwelling(n,x,y,z,rot,e,hk,k||0,core||0))return;return _dw.apply(this,arguments)}}
/* great temples for the old capitals: a stepped Maya pyramid, an Egyptian temple, a Japanese temple hall and a Roman pantheon */
function modelLandmark(n,x,y,z,e,nc){const cu=cultOf(n);let m=null,w=.42;
  if(cu==='meso'&&e>=1&&e<=3){m='maya_temple';w=.44}else if(cu==='mideast'&&e>=1&&e<=2){m='egypt_temple';w=.4}else if(cu==='east'&&e>=1&&e<=2){m='japan_temple';w=.38}else if(cu==='med'&&e>=2&&e<=3){m='pantheon';w=.4}
  return !!m&&addB(m,x,y-.03,z,w,w,0,m==='maya_temple'?0xc8b49a:m==='egypt_temple'?0xe0d0b8:0xf0ece4)}
{const _cl=cultureLandmark;cultureLandmark=function(n,x,y,z,e,nc){return modelLandmark(n,x,y,z,e,nc)||_cl.apply(this,arguments)}}
/* a farmstead of real barns: a red barn in the Age of Sail, silos and a wind pump in the Industrial age, big barns and grain silos in the Modern age */
function farmModel(n,i,j,fx,gy,fz,rot,e){if(!sOn('farm_barn')||!sOn('farm_silo'))return false;const cu=cultOf(n),western=cu==='west'||cu==='nordic';if(!western&&e<6)return false;
  const c=Math.cos(rot),s=Math.sin(rot),h=hash(j*3.7);
  const put=(name,dx,dz,w,d,r,hex)=>{const X=fx+dx*c+dz*s,Z=fz-dx*s+dz*c,Y=groundY(X,Z);if(Y<waterY+.03)return;addB(name,X,Y-.008,Z,w,d,rot+(r||0),hex)};
  if(western){if(e<=5)put(e===5&&h<.5?'cottage1':'med_house',0,0,.1,.08);else put(pickH(['sub_house2','sub_house4','sub_house1'],h),0,0,.11,.09)}
  if(e===4){put(h<.5?'farm_smallbarn':'farm_openbarn',.12,0,.13,.1,Math.PI/2);if(h>.6)put('farm_well',-.06,.07,.03,.03);if(h<.3)put('farm_chickencoop',-.07,-.06,.035,.03)}
  else if(e===5){put(h<.5?'farm_barn':'farm_smallbarn',.12,0,.14,.11,Math.PI/2);put(h<.4?'farm_silo_house':'farm_silo',.12,.11,.06,.06);if(h>.55)put('farm_windmill',-.07,.08,.05,.05);else put('farm_watertower',-.07,.08,.04,.04)}
  else{put(h<.5?'farm_bigbarn':'farm_barn',.13,0,.17,.13,Math.PI/2);put('farm_silo',.13,.12,.05,.05);put('farm_silo',.07,.13,.05,.05);if(h>.5)put('farm_openbarn',-.02,-.12,.11,.08)}
  return true}
const MODEL_KITS=()=>Object.keys(KITS).filter(n=>KITS[n].m&&n.startsWith('m_')&&!/^m_tank/.test(n));
(function loadModels(){if(typeof THREE.GLTFLoader!=='function')return;const L=new THREE.GLTFLoader();
  const ok=(name,g)=>{try{prepModel(name,g)}catch(e){console.warn('model',name,e)}};
  /* a web host that cannot serve .glb gets the same model packed as base64 in a .json file */
  const viaJson=name=>fetch('assets/models/'+name+'.json').then(r=>r.ok?r.json():null).then(j=>{if(!j||!j.b64)return;const bin=atob(j.b64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);L.parse(u.buffer,'',g=>ok(name,g),()=>{})}).catch(()=>{});
  const okS=(name,g)=>{try{prepStatic(name,g)}catch(e){console.warn('model',name,e)}};
  const load=(name,fn)=>L.load('assets/models/'+name+'.glb',g=>fn(name,g),undefined,()=>fetch('assets/models/'+name+'.json').then(r=>r.ok?r.json():null).then(j=>{if(!j||!j.b64)return;const bin=atob(j.b64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);L.parse(u.buffer,'',g=>fn(name,g),()=>{})}).catch(()=>{}));
  for(const name of Object.keys(MODEL_DEFS))load(name,ok);
  for(const name of Object.keys(SMODEL))load(name,okS)})();
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

/* ---------- wild animals: zebras on the savanna, wolves in the forests, wild horses on the plains, llamas where camels would roam ---------- */
const WILD_MODEL={zebra:'zebra',cattle:'cow',sheep:'sheep',camel:'llama',reindeer:'horse'},WILD_ONLY=['zebra','llama','wolf','dolphin','shark','whale','manta_ray','fish1','fish2','fish3'];
let WILD_USED=new Set();
function wildModelOf(hd){if(hd.kind==='deer'){const i=tileAt(hd.x,hd.z);return i>=0&&biome[i]===5?'wolf':'horse'}return WILD_MODEL[hd.kind]||null}
function drawWildModel(hd,m,x,y,z,now){const name=hd._mn!==undefined?hd._mn:(hd._mn=wildModelOf(hd));if(!name||!modelOn(name))return false;const F=MDL.frames[name],mv=Math.hypot(hd.vx,hd.vz)>.009&&F.walk!==F.idle;
  const list=mv?F.walk:F.idle,fi=Math.floor(now/1000*(mv?7:1.5)+m.ph*3)%list.length,kn=list[(fi+list.length)%list.length];addM(kn,x,y,z,1,mv?Math.atan2(hd.vx,hd.vz):m.a);WILD_USED.add(kn);return true}
function drawWhaleModel(w,up,now){if(!modelOn('whale'))return false;const F=MDL.frames.whale.swim,kn=F[Math.floor(now/260)%F.length];
  addM(kn,w.x,waterY-.05+up*.04,w.z,1,Math.atan2(Math.cos(w.a),Math.sin(w.a)),null,null,null,null,-Math.cos(w.t*.6)*.12);WILD_USED.add(kn);return true}

/* ---------- the sea: pods of dolphins that leap, a shark's fin, manta rays in warm water and shoals of bright fish in the shallows ---------- */
let seaLife=[],seaT=0;
function spawnSea(){for(let t=0;t<25;t++){const x=camT.x+(rng()-.5)*(camDist*1.6+4),z=camT.z+(rng()-.5)*(camDist*1.2+3),i=tileAt(x,z);if(i<0||!isWater(i)||(typeof river!=='undefined'&&river[i]))continue;
    const deep=h[i]<sea-.05,lat=1-Math.abs(((i/W)|0)/(H-1)-.5)*2,r=rng();let kind,n;
    if(!deep){if(camDist>7)continue;kind=['fish1','fish2','fish3'][(rng()*3)|0];n=8+((rng()*10)|0)}
    else if(r<.6){kind='dolphin';n=3+((rng()*4)|0)}else if(r<.8){kind='shark';n=1}else{kind=lat>.45?'manta_ray':'dolphin';n=kind==='dolphin'?3:1+((rng()*2)|0)}
    const m=[];for(let k=0;k<n;k++)m.push({dx:(rng()-.5)*(kind[0]==='f'?.12:.35),dz:(rng()-.5)*(kind[0]==='f'?.12:.35),ph:rng()*6.28});
    seaLife.push({kind,x,z,a:rng()*6.28,t:0,m,sp:kind==='dolphin'?.12:kind==='shark'?.05:kind==='manta_ray'?.04:.06});return}}
function updateSeaLife(dt,k,now){if(!modelOn('dolphin'))return;seaT-=dt;
  if(seaT<=0){seaT=1.2;seaLife=seaLife.filter(s=>s.t<70&&Math.hypot(s.x-camT.x,s.z-camT.z)<camDist*2+6);if(seaLife.length<(camDist<14?7:4))spawnSea()}
  const T=now/1000;
  for(const s of seaLife){s.t+=dt;const nx=s.x+Math.cos(s.a)*dt*s.sp*k,nz=s.z+Math.sin(s.a)*dt*s.sp*k,i=tileAt(nx,nz);
    if(i<0||!isWater(i)){s.a+=Math.PI*(.6+rng()*.8)}else{s.x=nx;s.z=nz}if(rng()<dt*.15)s.a+=(rng()-.5)*1.2;
    if(Math.hypot(s.x-camT.x,s.z-camT.z)>camDist*1.5+3||!modelOn(s.kind))continue;
    const F=MDL.frames[s.kind].swim,ry=Math.atan2(Math.cos(s.a),Math.sin(s.a));
    for(const m of s.m){const x=s.x+m.dx,z=s.z+m.dz,kn=F[Math.floor(T*6+m.ph*2)%F.length];let y=waterY-.012,tilt=0;
      if(s.kind==='dolphin'){const ph=(T*.9+m.ph)%6.283,arc=Math.sin(ph);y=waterY-.03+Math.max(0,arc)*.05;tilt=arc>0?-Math.cos(ph)*.7:0;if(arc>0&&arc<.08&&rng()<dt*8)emit('spray',x,waterY+.01,z,0,0)}
      else if(s.kind==='shark')y=waterY-.026;else if(s.kind==='manta_ray')y=waterY-.022+Math.sin(T+m.ph)*.004;else y=waterY-.008;
      addM(kn,x,y,z,1,ry+(s.kind[0]==='f'?Math.sin(T*2+m.ph)*.4:0),null,null,null,null,tilt);WILD_USED.add(kn)}}}
document.addEventListener('DOMContentLoaded',()=>{if(typeof updateLiving!=='function')return;const _ul=updateLiving;updateLiving=function(dt,k,now){if(settings.models!==false)for(const nm of WILD_ONLY){const F=MDL.frames[nm];if(F)for(const key in F)for(const kn of F[key])if(KITS[kn])KITS[kn].k=0}
  WILD_USED=new Set();const r=_ul.apply(this,arguments);try{updateSeaLife(dt,k,now);drawTraffic(now,k)}catch(e){console.warn('sea',e)}
  mcommit([...WILD_USED]);for(const nm of VEH_KITS){const K=KITS[nm];K.mesh.count=K.k;K.mesh.instanceMatrix.needsUpdate=true;if(K.mesh.instanceColor)K.mesh.instanceColor.needsUpdate=true}return r}});

/* ---------- cars, buses and trains ---------- */
const CAR_SET=['car1','car2','suv','sports1','sports2','taxi','car1','car2'],WHITE_CAR={suv:1,sports2:1,cop:0};
function addV(name,x,y,z,rot,hex){if(!sOn(name))return false;add('s_'+name,x,y,z,1,1,1,rot,hex==null?0xffffff:hex);return true}
function carFor(seed){return CAR_SET[Math.floor(((seed*7.13)%1+1)%1*CAR_SET.length)]}
function drawCarModel(c,x,y,z,rot){const name=c._cm||(c._cm=c.era>=6&&hash(c.p[0]*3.1)<.12?'bus':carFor(hash(c.p[0]+c.p[1]*7)));if(!sOn(name))return false;return addV(name,x,y,z,rot,WHITE_CAR[name]?c.car:null)}
{const _uc=updateCaravans;updateCaravans=function(){kitReset(VEH_KITS);return _uc.apply(this,arguments)}}
/* trains along the railways between towns: steam locomotives with a tender and carriages, then high-speed trains and freight */
const _tt={pts:null,acc:null,t:0};
function drawTrainModel(c,e,x,y,z,r,nc){const hs=e>=6,cargo=hash(c.a*7.7+c.b*3.1)<.35,front=hs?(cargo?'cargo_front':'hs_front'):'loco_front';if(!sOn(front))return false;
  const cars=hs?(cargo?['cargo_box','cargo_coal','cargo_box']:['hs_wagon','hs_wagon','hs_wagon']):(cargo?['loco_tender','cargo_coal','cargo_box']:['loco_tender','loco_wagon','loco_wagon']);
  const len=n=>MDL.info[n]&&MDL.info[n].d?MDL.info[n].d.len:.08;
  _tt.pts=c.pts;_tt.acc=c.acc;let off=0;const L=[front,...cars];
  for(let q=0;q<L.length;q++){const nm=L[q],hl=len(nm)/2;if(q)off+=hl+.004;_tt.t=clamp(c.t-c.dir*off,0,c.L);const [px,pz,a]=tradeTrainAt(_tt),rr=c.dir>0?a:a+Math.PI;
    addV(nm,px,groundY(px,pz)+.002,pz,Math.PI/2-rr);off+=hl}
  return true}
/* modern streets fill with traffic: cars keep to their lane, now and then a bus */
function drawTraffic(now,k){if(!sOn('car1')||typeof cityStreets==='undefined')return;const T=now/1000;let n=0;
  for(const st of cityStreets){if(st.t!==2||n>260)continue;const p=st.pts;if(!p||p.length<2)continue;const mx=p[p.length>>1][0],mz=p[p.length>>1][1];if(Math.hypot(mx-camT.x,mz-camT.z)>camDist*1.1+2)continue;
    if(!st._L){let L=0;st._acc=[0];for(let q=1;q<p.length;q++){L+=Math.hypot(p[q][0]-p[q-1][0],p[q][1]-p[q-1][1]);st._acc.push(L)}st._L=L;st._seed=hash(mx*13.1+mz*7.7)}
    const cnt=Math.min(6,Math.floor(st._L/.35));for(let q=0;q<cnt;q++){const dir=q%2?1:-1,sp=.05+hash(st._seed*9+q)*.03;let t=((T*sp*(k>0?1:0)+hash(st._seed+q*3.7)*st._L)%st._L+st._L)%st._L;if(dir<0)t=st._L-t;
      let lo=0;while(lo<st._acc.length-2&&st._acc[lo+1]<t)lo++;const a=p[lo],b=p[lo+1],sl=st._acc[lo+1]-st._acc[lo]||1,f=(t-st._acc[lo])/sl,dx=(b[0]-a[0])/sl,dz=(b[1]-a[1])/sl;
      const fx=dx*dir,fz=dz*dir,lane=st.w*.24,x=a[0]+(b[0]-a[0])*f-fz*lane,z=a[1]+(b[1]-a[1])*f+fx*lane,name=hash(st._seed*3+q)<.08?'bus':carFor(hash(st._seed*5+q*1.3));
      if(addV(name,x,groundY(x,z)+.002,z,Math.atan2(fx,fz),WHITE_CAR[name]?[0xc0392b,0x2e6fb0,0xe8e2d4,0x2a2a2a,0xe0b030,0x3f8f4a][(hash(st._seed+q)*6)|0]:null))n++}}}
