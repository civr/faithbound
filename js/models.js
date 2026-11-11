"use strict";
/* Faithbound — real 3D models (Quaternius, CC0): animals, people, ships, planes and tanks.
   Each model is loaded once, turned to face +x (vehicles) or +z (people and animals), stood on the ground and scaled.
   Animated ones are posed at a few frames of each cycle ahead of time, so hundreds of them draw as instanced meshes
   with no per-frame skinning. Clothes, skin and hair keep their own colour per instance, so every era and culture can dress its people. */

const MDL={ready:{},geo:{},frames:{},info:{}};let MDL_VER=0;
/* which material is which part: 1 top, 2 bottom, 3 skin, 4 hair, 5 sail */
let PART_EXTRA=null;
function partOf(name){const n=(name||'').toLowerCase();
  if(PART_EXTRA&&PART_EXTRA.test(n))return 7;if(/window|glass|interior/.test(n))return 7;if(/^leaves|^rock/.test(n))return 6;if(/shirt|jacket|dress|armor|tank ?top|top/.test(n))return 1;if(/pants|sock/.test(n))return 2;if(/skin/.test(n))return 3;if(/hair/.test(n))return 4;if(/fabric|sail/.test(n))return 5;return 0}
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
  viking_boat:{len:.42,axis:'x'},liner:{len:.72,axis:'x'},sail_ship:{len:.52,axis:'x'},boatwsail:{len:.2,axis:'x'},cruiseship:{len:.85,axis:'x'},
  commercial_airplane:{len:.6,axis:'x'},military_airplane:{len:.3,axis:'x'},smallplane:{len:.22,axis:'x'},
  tank:{len:.17,axis:'x'},tank2:{len:.17,axis:'x'},tank3:{len:.17,axis:'x'},
  zebra:{len:.068,axis:'z',anims:{walk:['Walk',8],idle:['Idle',2]}},llama:{len:.06,axis:'z',anims:{idle:['Idle',4]}},wolf:{len:.056,axis:'z',anims:{walk:['Walking',8],idle:['Idle',2]}},
  dolphin:{len:.1,axis:'z',anims:{swim:['Swim',6]}},shark:{len:.11,axis:'z',anims:{swim:['Swim',6]}},whale:{len:.3,axis:'z',anims:{swim:['Swim',6]}},manta_ray:{len:.09,axis:'z',anims:{swim:['Swim',6]}},
  fish1:{len:.022,axis:'z',anims:{swim:['Swim',4]}},fish2:{len:.02,axis:'z',anims:{swim:['Swim',4]}},fish3:{len:.02,axis:'z',anims:{swim:['Swim',4]}}};
/* per-model corrections found by looking at them in the game */
const MODEL_FIX={wolf:{flip:1},liner:{flip:1},male_casual:{yaw:-Math.PI/2},male_shirt:{yaw:-Math.PI/2},female_casual:{yaw:-Math.PI/2},female_dress:{yaw:-Math.PI/2},knightcharacter:{yaw:-Math.PI/2},tank:{flip:1},tank2:{flip:1},tank3:{flip:1},commercial_airplane:{yaw:Math.PI/2},military_airplane:{yaw:Math.PI/2},smallplane:{yaw:Math.PI/2}};
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
const SMODEL={tree_a:{k:'tree',h:1.05,max:16000},tree_b:{k:'tree',h:.95,max:16000},tree_d:{k:'tree',h:1.1,max:16000},
  tree_c:{k:'tree',h:1.1,max:16000},bush_a:{k:'tree',h:.95,max:14000},bush_b:{k:'tree',h:1,max:14000},bush_c:{k:'tree',h:.9,max:14000},
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
Object.assign(SMODEL,Object.fromEntries(['ru_wall','ru_broken','ru_double','ru_arch','ru_hole','ru_half','ru_column','ru_colshort','ru_archway','ru_deadtree','ru_deadtree2','ru_bricks'].map(n=>[n,{k:'build',unit:1,max:900}])));
Object.assign(SMODEL,{c_large:{k:'build',unit:1,max:400},c_round:{k:'build',unit:1,max:400},c_tallwall:{k:'build',unit:1,max:3000},c_gate:{k:'build',unit:1,max:300},c_small:{k:'build',unit:1,max:300},
  mv_house1:{k:'build',unit:1,max:1500,win:['windows']},mv_house2:{k:'build',unit:1,max:1500},mv_house3:{k:'build',unit:1,max:1500},mv_house4:{k:'build',unit:1,max:1500},mv_inn:{k:'build',unit:1,max:600},mv_smith:{k:'build',unit:1,max:600},mv_bell:{k:'build',unit:1,max:200},mv_mill:{k:'build',unit:1,max:200},
  rts_h4:{k:'build',unit:1,max:2000},rts_h5:{k:'build',unit:1,max:2000},rts_h6:{k:'build',unit:1,max:2500},torii:{k:'build',unit:1,max:100},
  dt_large:{k:'build',unit:1,max:500},dt_medium:{k:'build',unit:1,max:600},dt_small:{k:'build',unit:1,max:800},
  fut_base:{k:'build',unit:1,max:800},fut_tower:{k:'build',unit:1,max:800},fut_dome:{k:'build',unit:1,max:800},fut_cyl:{k:'build',unit:1,max:1200},fut_long:{k:'build',unit:1,max:800},fut_open:{k:'build',unit:1,max:1200},fut_house:{k:'build',unit:1,max:1500},
  ship_challenger:{k:'veh',len:.045,max:300},ship_dispatcher:{k:'veh',len:.04,max:300},ship_pancake:{k:'veh',len:.04,max:300},ship_zenith:{k:'veh',len:.045,max:300},
  deer:{k:'veh',wild:1,len:.052,max:300},stag:{k:'veh',wild:1,len:.06,max:150},fox:{k:'veh',wild:1,len:.034,max:100},donkey:{k:'veh',wild:1,len:.048,max:400}});
for(const n of ['town2s','town3b','town3s','town4','cottage1'])SMODEL[n].win=['darkgrey'];SMODEL.med_house.win=['darkblue','darkpurple'];
let MTREE_MAT=null,SBVER=0,MDL_LOADER=null;const MDL_REQ=new Set();
/* snow and rain show on trees and on the plain building materials too */
weatherHook(treeMat);for(const k in MAT)weatherHook(MAT[k]);
function modelTreeMat(){if(MTREE_MAT)return MTREE_MAT;const m=treeMat.clone();const base=treeMat.onBeforeCompile;
  m.onBeforeCompile=sh=>{base(sh);sh.vertexShader=sh.vertexShader.replace('#include <color_vertex>',`vColor=color.xyz;
    #ifdef USE_INSTANCING_COLOR
    {float lf=1.-step(.025,abs(color.r-color.b));vColor.xyz*=mix(vec3(1.),instanceColor.xyz,lf);}
    #endif`)};m.customProgramCacheKey=()=>'mtree';return MTREE_MAT=m}
const SMODEL_MAT=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,metalness:0}),BWIN={uNight:{value:0},uEarth:{value:0}};
/* windows glow after dark: the window parts of most houses light up warm, some stay dark */
SMODEL_MAT.onBeforeCompile=sh=>{sh.uniforms.uNight=BWIN.uNight;sh.uniforms.uEarth=BWIN.uEarth;
  sh.vertexShader='attribute float aPart;varying float vWin;varying vec3 vMW,vMN;\n'+sh.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
    {vec4 mw=vec4(transformed,1.);vec3 mn=objectNormal;
    #ifdef USE_INSTANCING
    mw=instanceMatrix*mw;mn=mat3(instanceMatrix)*mn;
    #endif
    vMW=(modelMatrix*mw).xyz;vMN=normalize(mat3(modelMatrix)*mn);}`).replace('#include <begin_vertex>',`#include <begin_vertex>
    vWin=(aPart>6.5&&aPart<7.5)?1.:0.;
    #ifdef USE_INSTANCING
    {vec3 ip=vec3(instanceMatrix[3][0],instanceMatrix[3][1],instanceMatrix[3][2]);vWin*=step(.3,fract(sin(dot(ip.xz,vec2(12.9898,78.233)))*43758.5453));}
    #endif`);
  sh.fragmentShader=`uniform float uNight,uEarth;varying float vWin;varying vec3 vMW,vMN;
float fbH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float fbN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(fbH(i),fbH(i+vec2(1,0)),f.x),mix(fbH(i+vec2(0,1)),fbH(i+vec2(1,1)),f.x),f.y);}
`+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    /* earthy palette for the painted looks: bright teal, navy and red roofs become slate, thatch and weathered brown, khaki plaster turns to whitewash */
    if(uEarth>0.){vec3 c=diffuseColor.rgb;float l=dot(c,vec3(.3,.59,.11)),mx=max(c.r,max(c.g,c.b)),mn=min(c.r,min(c.g,c.b)),sat=(mx-mn)/max(mx,.001);
      float blu=smoothstep(.05,.22,(c.b-max(c.r,c.g*.8))/max(mx,.001)),red=smoothstep(.55,.78,(c.r-max(c.g,c.b))/max(mx,.001)),
        kha=smoothstep(.04,.12,c.g-c.b)*smoothstep(.0,.05,c.r-c.g*.92)*smoothstep(.12,.3,l)*(1.-red);
      vec3 slate=vec3(l*1.05,l*1.02,l*1.)*.9+.012,thatch=vec3(l*1.5,l*1.22,l*.8)+vec3(.03,.02,0.);
      c=mix(c,mix(slate,thatch,smoothstep(.1,.22,l)),blu*.9);
      c=mix(c,vec3(l*1.4,l*1.05,l*.75)+.01,red*.85);c=mix(c,vec3(.62,.58,.5)*(.75+l),kha*.55*uEarth);
      diffuseColor.rgb=mix(diffuseColor.rgb,c,uEarth);
      /* surface texture, close up only: straw on thatched roofs, coursed stone on grey walls, grain on timber, rough plaster elsewhere */
      float tf=1.-smoothstep(2.5,9.,length(vMW-cameraPosition));
      if(tf>.01&&vWin<.5){vec3 nn=normalize(vMN),an=abs(nn);c=diffuseColor.rgb;l=dot(c,vec3(.3,.59,.11));mx=max(c.r,max(c.g,c.b));mn=min(c.r,min(c.g,c.b));sat=(mx-mn)/max(mx,.001);
        vec2 sp=an.x>an.z?vMW.zy:vMW.xy;vec2 tp=an.y>.7?vMW.xz:sp;
        float roof=smoothstep(.3,.5,nn.y)*(1.-smoothstep(.93,.99,nn.y));
        vec2 dn=normalize(nn.xz+vec2(1e-4));vec2 rp=vec2(dot(vMW.xz,vec2(-dn.y,dn.x))*420.,(vMW.y*1.4+dot(vMW.xz,dn))*55.);
        float straw=fbN(rp)*.55+fbN(rp*vec2(.5,2.3)+vec2(3.1))*.45,ridge=fbN(vec2(rp.x*.04,rp.y*.6))*.5;
        float stoneM=(1.-roof)*smoothstep(.22,.08,sat)*smoothstep(.06,.14,l);
        vec2 bp=vec2(sp.x*95.,sp.y*140.);bp.x+=step(1.,mod(floor(bp.y),2.))*.5;vec2 bf=fract(bp);float joint=smoothstep(.0,.08,bf.x)*smoothstep(1.,.92,bf.x)*smoothstep(.0,.12,bf.y)*smoothstep(1.,.88,bf.y);
        float stone=(.84+.16*joint)*(.92+.16*fbN(floor(bp)*.7));
        float woodM=(1.-roof)*smoothstep(.25,.45,sat)*smoothstep(.2,.08,l)*(c.r>c.b?1.:0.);float grain=.92+.16*fbN(vec2(sp.x*30.,sp.y*600.));
        float plast=.96+.08*fbN(tp*180.);
        float m=mix(plast,straw*.3+.82+ridge*.1,roof);m=mix(m,stone,stoneM);m=mix(m,grain,woodM*(1.-roof));
        diffuseColor.rgb*=mix(1.,m,tf*uEarth);}}`).replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n totalEmissiveRadiance+=vec3(1.,.72,.38)*vWin*uNight*1.8;')};
SMODEL_MAT.customProgramCacheKey=()=>'smodel';weatherHook(SMODEL_MAT);
{const _sn=setNight;setNight=function(f){_sn(f);BWIN.uNight.value=f}}
const VEH_MAT=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5,metalness:.15});const VEH_KITS=[];
function prepStatic(name,gltf){const d=Object.assign({},SMODEL[name]);gltf.scene.updateMatrixWorld(true);PART_EXTRA=d.win?new RegExp('^('+d.win.join('|')+')$'):null;let f;try{f=flatten(gltf.scene)}finally{PART_EXTRA=null}
  /* baked window colours (pale cyan glass) count as windows too */
  if(d.k==='build')for(let v=0;v<f.T.length;v++){const r=f.C[v*3],g=f.C[v*3+1],b=f.C[v*3+2];if(f.T[v]===0&&b>.45&&g>.4&&r<.7*b)f.T[v]=7}
  /* leaves and rocks become white with a little height shading, so the instance colour paints them */
  if(d.k==='tree'||d.k==='rock'){let y0=1e9,y1=-1e9;for(let i=1;i<f.P.length;i+=3){y0=Math.min(y0,f.P[i]);y1=Math.max(y1,f.P[i])}
    for(let v=0;v<f.T.length;v++)if(f.T[v]===6){const t=(f.P[v*3+1]-y0)/((y1-y0)||1),ao=d.k==='rock'?.82+.18*t:.62+.38*t;f.C[v*3]=f.C[v*3+1]=f.C[v*3+2]=ao}}
  if(d.k==='tree'&&KITS.broad){const g=KITS.broad.mesh.geometry;g.computeBoundingBox();d.h*=g.boundingBox.max.y-Math.max(0,g.boundingBox.min.y)}
  const norm=normalizer(f,Object.assign(d,{axis:d.k==='veh'?'z':'none'},MODEL_FIX[name]||{}));const geo=toGeo(norm(f.P),f);const kn='s_'+name;MDL.info[name]={d};
  kit(kn,geo,d.k==='tree'||d.k==='rock'?modelTreeMat():d.k==='veh'&&!d.wild?VEH_MAT:SMODEL_MAT,d.max||2000,d.k!=='rock');
  if(d.k==='build'||d.k==='farm'){const K=KITS[kn];let r=0,g=0,b=0,n=0;for(let i=0;i<f.C.length;i+=3){r+=f.C[i];g+=f.C[i+1];b+=f.C[i+2];n++}K.avg=[r/n,g/n,b/n];K.lodC=true}
  if(d.k==='veh')VEH_KITS.push(kn);else (d.k==='build'?BUILD_KITS:TREE_KITS).push(kn);MDL.ready[name]=true;MDL_VER++;modelSettle(d.k)}
/* models arrive in bursts: the towns are rebuilt and the new shaders compiled once, a moment after the last one, instead of after every model */
let SETTLE_T=0,SETTLE_B=false,SETTLE_TR=false;
function modelSettle(k){if(k==='build')SETTLE_B=true;else SETTLE_TR=true;clearTimeout(SETTLE_T);SETTLE_T=setTimeout(()=>{if(SETTLE_B)SBVER++;if(SETTLE_TR&&typeof treesDirty!=='undefined')treesDirty=true;SETTLE_B=SETTLE_TR=false;if(typeof propsDirty!=='undefined')propsDirty=true;setTimeout(prewarmShaders,1500)},1200)}
function prewarmShaders(){try{if(typeof renderer!=='undefined'&&typeof cam!=='undefined'){if(typeof applyTier==='function'&&perfOn())applyTier(PERF.tier);renderer.compile(scene,cam)}}catch(e){}}
const sOn=name=>settings.models!==false&&!!MDL.ready[name];
/* which kit draws a tree of this kind: the model when it has loaded, the old shape otherwise */
const NAT_SETS={broad:['bush_a','bush_b','tree_c','bush_c'],acacia:['tree_a','tree_b','tree_d'],rock:['rock_a','rock_b','rock_c']};
function natKit(kind,hv){if(LK.pixel&&kind==='broad')return ((hv*5.17)%1)<.62?'hamA':'hamB';const L=NAT_SETS[kind];if(L){const n=L[Math.floor(((hv*7.31)%1)*L.length)];if(sOn(n))return 's_'+n}return kind==='acacia'?'broad':kind}
/* a building model fitted inside a w x d plot, keeping its own proportions; it stands as a solid thing like any other house */
function addB(name,x,y,z,w,d,rot,hex,hs){if(!sOn(name))return false;const [a,b,c]=MDL.info[name].d.dim,s=Math.min(w/a,d/c);add('s_'+name,x,y,z,a*s,b*s*(hs||1),c*s,rot||0,hex==null?0xffffff:hex);return true}
const pickH=(L,h)=>L[Math.floor(((h*9.73)%1)*L.length)];
const HOUSE_TINT=[0xffffff,0xfff2e4,0xf2f0ff,0xffead8,0xeef6ee,0xfff8f0];
/* western and northern towns: half-timbered houses in the Middle Ages, tall gabled townhouses in the Age of Sail and the Industrial age, suburbs in the Modern age */
/* southern and eastern peoples keep most of their own homes; flat-roofed and tiled model houses mix in among them */
function otherDwelling(cu,x,y,z,rot,e,hk,k,core){const r=hash(hk*17.3+k*.61),yy=y-.012;
  if(cu==='med'&&e>=2&&e<=4){if(r<.22)return addB('rts_h4',x,yy,z,.1,.09,rot,0xfff4e8);if(r<.4)return addB('rts_h6',x,yy,z,.1,.09,rot,0xfff8f0)}
  if(cu==='mideast'&&e>=2&&e<=4&&r<.32)return addB('rts_h6',x,yy,z,.1,.09,rot,0xf4e4c4);
  if(cu==='africa'&&e>=3&&e<=4&&r<.22)return addB('rts_h6',x,yy,z,.1,.09,rot,0xe8c4a0);
  if((cu==='nordic'||cu==='east')&&e>=2&&e<=3&&r<.2)return addB('rts_h5',x,yy,z,.1,.09,rot,0xffffff);
  return false}
function modelDwelling(n,x,y,z,rot,e,hk,k,core){if((typeof MCTX!=='undefined'&&MCTX&&MCTX.lagoon)||settings.models===false)return false;const cu=n?cultOf(n):'west';if(cu!=='west'&&cu!=='nordic')return otherDwelling(cu,x,y,z,rot,e,hk,k,core);
  const w=Math.max(.09,Math.min(.15,(MCTX&&MCTX.w)||.12)),r=hash(hk*13.7+k*.37),tint=pickH(HOUSE_TINT,r*3.1),yy=y-.012;
  /* a medieval town: houses of plaster and timber, an inn and a smithy near the market, a bell tower at its heart, a mill on the edge */
  const village=()=>{if(core>.86&&r<.07&&sOn('mv_bell'))return addB('mv_bell',x,yy,z,.08,.08,rot,tint);if(core<.18&&r<.05&&sOn('mv_mill'))return addB('mv_mill',x,yy,z,.12,.12,rot,tint);
    if(core>.45&&r<.16)return addB(r<.08?'mv_inn':'mv_smith',x,yy,z,.12,.1,rot,tint);if(r<.3)return addB('med_house',x,yy,z,.1,.09,rot,tint);
    return r<.72&&addB(pickH(['mv_house1','mv_house2','mv_house3','mv_house4'],r),x,yy,z,.1,.09,rot,tint)};
  if(e===3)return village();
  if(e===4){if(core>.3)return addB(pickH(['town3s','town2s','town3s'],r),x,yy,z,.11,.09,rot,tint);return village()}
  if(e===5){const L=core>.62?['town4','town3b','town2s','town4']:core>.25?['town2s','town3s','town3b']:['cottage1','town2s','town3s','cottage1'];return addB(pickH(L,r),x,yy,z,w,w*.85,rot,tint)}
  if(e===6){if(core<.42)return addB(pickH(['sub_house1','sub_house2','sub_house3','sub_house4','sub_house5'],r),x,yy,z,w*.95,w*.85,rot,tint);
    if(core<.62&&r<.45)return addB(pickH(['flat1','flat2','shop','flat1'],r),x,yy,z,w*.85,w*.8,rot,tint);return false}
  return false}
{const _dw=dwelling;dwelling=function(n,x,y,z,rot,e,hk,k,core){if(modelDwelling(n,x,y,z,rot,e,hk,k||0,core||0))return;return _dw.apply(this,arguments)}}
/* great temples for the old capitals: a stepped Maya pyramid, an Egyptian temple, a Japanese temple hall and a Roman pantheon */
function modelLandmark(n,x,y,z,e,nc){const cu=cultOf(n);let m=null,w=.42;
  if(cu==='meso'&&e>=1&&e<=3){m='maya_temple';w=.44}else if(cu==='mideast'&&e>=1&&e<=2){m='egypt_temple';w=.4}else if(cu==='east'&&e>=1&&e<=2){m='japan_temple';w=.38}else if(cu==='med'&&e>=2&&e<=3){m='pantheon';w=.4}
  return !!m&&addB(m,x,y-.03,z,w,w,0,m==='maya_temple'?0xc8b49a:m==='egypt_temple'?0xe0d0b8:0xf0ece4)}
{const _cl=cultureLandmark;cultureLandmark=function(n,x,y,z,e,nc){const r=modelLandmark(n,x,y,z,e,nc)||_cl.apply(this,arguments);
  if(r&&cultOf(n)==='east'&&e>=1&&e<=4)addB('torii',x,y-.02,z+(e>=3?.66:.32),.13,.03,0,0xffffff);return r}}
/* a western castle of real towers: curtain walls with battlements, round corner towers, a gatehouse arch, a square keep and a slender spire */
function modelCastle(n,x,y,z,e,nc){if(!['c_large','c_tallwall','c_gate','c_small','c_round'].every(sOn))return false;const S=.42,WH=.16,T=.05;
  const SC=LK.pixel?0x9a9080:0xd2cdc2;/* weathered grey-brown stone in the painted look, and no moat */
  if(!LK.pixel)add('moat',x,y-.012,z,S*2.9,.02,S*2.9,0);add('plazaStone',x,y-.03,z,S*1.8,.035,S*1.8,0);
  for(const [dx,dz,r] of [[0,S,0],[0,-S,0],[S,0,Math.PI/2],[-S,0,Math.PI/2]]){const L=2*S-.12,ns=Math.max(3,Math.round(L/.11)),sl=L/ns;
    for(let q=0;q<ns;q++){const t=-L/2+sl*(q+.5),gate=dz>0&&q===(ns>>1);add(gate?'s_c_gate':'s_c_tallwall',x+dx+(r?0:t),y-.03,z+dz+(r?t:0),sl,gate?WH*1.15:WH,T,r,SC)}}
  for(const [dx,dz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const kn=dx===dz?'c_round':'c_large';add('s_'+kn,x+dx*S,y-.03,z+dz*S,.13,kn==='c_round'?.38:.27,.13,0,SC)}
  add('s_c_small',x-.02,y-.03,z-.06,.22,e>=4?.4:.34,.22,0,SC);add('s_c_round',x+.15,y-.03,z-.16,.09,.46,.09,0,SC);
  if(sOn('mv_house1'))addB('mv_inn',x-.18,y-.02,z+.18,.16,.12,0);
  add('cyl',x-.02,y+.36,z-.06,.005,.12,.005,0,0x5a4632);add('box',x,y+.45,z-.06,.04,.024,.003,0,nc);return true}
{const _ca=castle;castle=function(n,x,y,z,e,nc){if(cultOf(n)==='west'&&settings.models!==false&&modelCastle(n,x,y,z,e,nc))return;return _ca.apply(this,arguments)}}
/* future towns: white domes, ring habitats and long halls between the glass towers, tinted towards the people's colour */
function modelFuture(n,x,y,z,rot,hk,core,fw){if(core>.84||!sOn('fut_house'))return false;const r=hash(hk*29.1+3),w=Math.min(fw||.12,.13),c=new THREE.Color(0xffffff).lerp(new THREE.Color(n.color),.14).getHex(),yy=y-.014;
  if(core<.45)return addB(pickH(['fut_house','fut_cyl','fut_open','fut_dome','fut_house'],r),x,yy,z,w*.9,w*.9,rot,c);
  if(r<.55)return addB(pickH(['fut_long','fut_base','fut_tower','fut_dome'],r),x,yy,z,w,w*.9,rot,c);return false}
{const _fb=futureBuilding;futureBuilding=function(n,x,y,z,rot,hk,core,fw){if(settings.models!==false&&modelFuture(n,x,y,z,rot,hk,core,fw))return;return _fb.apply(this,arguments)}}
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
  MDL_LOADER=name=>load(name,SMODEL[name]?okS:ok);setTimeout(()=>{try{ensureModels()}catch(e){}},0)})();
const modelOn=name=>settings.models!==false&&!!MDL.ready[name];

/* ---------- animals ---------- */
function drawHerdModel(h,k,x,y,z,rot,T,graze,moving){const name=h.kind==='sheep'?'sheep':h.kind==='cow'?'cow':h.kind;if(!modelOn(name))return false;
  const F=MDL.frames[name],list=moving&&F.walk?F.walk:F.idle,fi=Math.floor((T*(moving?7:1.5)+k*1.7))%list.length;
  addM(list[(fi+list.length)%list.length],x,y,z,1,rot,null,null,null,null);return true}

/* ---------- people ---------- */
function folkModel(w){if(w.sol)return w.uni<=4?'knightcharacter':(w.seed&1?'male_shirt':'male_casual');if(w.fem)return w.dress&&w.long?'female_dress':(w.seed&2?'female_casual':'female_dress');return w.seed&4?'male_shirt':'male_casual'}
function drawFolkModel(w,gy){const name=folkModel(w);if(!modelOn(name)||(typeof camDist!=='undefined'&&camDist>(typeof PERF!=='undefined'?PERF.folkD:12)))return false;
  const F=MDL.frames[name],moving=w.moving&&F.walk,list=moving?F.walk:F.idle,TAU=6.2832;
  const fi=moving?Math.floor((((w.ph%TAU)+TAU)%TAU)/TAU*list.length):Math.floor((w.t||0)*1.2)%list.length;
  const s=w.kid?.7:1,top=w.dress||w.top,bot=w.dress&&w.long?w.dress:w.bot;
  addM(list[fi%list.length],w.x,gy,w.z,s,w.dir,top,bot,w.skin,w.hair);return true}

/* ---------- ships: a real hull for galleys, galleons and liners ---------- */
const SHIP_GEO_CACHE={};
function shipModelFor(era,kind){if(kind==='viking')return 'viking_boat';if(era<=2)return 'viking_boat';if(era<=4)return 'sail_ship';if(kind==='pirate')return null;
  if(era<=6&&kind==='war')return modelOn('liner')?'warship':null;if(era===6&&Math.random()<.5)return 'cruiseship';if(era<=6)return 'liner';return null}
/* a steam warship: the liner's hull and funnels in battleship grey, with gun turrets fore and aft */
let WARSHIP_GEO=null;
function warshipGeo(){if(WARSHIP_GEO)return WARSHIP_GEO;const g=MDL.geo.liner.clone(),C=g.attributes.color;
  for(let i=0;i<C.count;i++){const l=.3*C.getX(i)+.59*C.getY(i)+.11*C.getZ(i),k=.45+.9*Math.min(1,l*1.6);C.setXYZ(i,.085*k,.09*k,.1*k)}C.needsUpdate=true;return WARSHIP_GEO=g}
function shipGeoVariant(name,sail){const key=name+'|'+sail;if(SHIP_GEO_CACHE[key])return SHIP_GEO_CACHE[key];const g=MDL.geo[name].clone(),C=g.attributes.color,T=g.attributes.aPart,c=new THREE.Color(sail).convertSRGBToLinear();
  if(sail!=null)for(let i=0;i<T.count;i++)if(T.getX(i)>4.5)C.setXYZ(i,c.r,c.g,c.b);C.needsUpdate=true;return SHIP_GEO_CACHE[key]=g}
const SHIP_MODEL_MAT=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8});
function modelShip(era,kind,color,nflag){let name=shipModelFor(era,kind);if(!name||(name!=='warship'&&!modelOn(name)))return null;const war=name==='warship';if(war)name='liner';
  const g=new THREE.Group(),mats=[];g.userData.mats=mats;const pir=kind==='pirate';
  const sail=pir?0x1a1a1a:kind==='viking'?0xa8322a:kind==='war'?(()=>{const a=new THREE.Color(0xf2ead8),b=new THREE.Color(color);return a.lerp(b,.3).getHex()})():null;
  const m=new THREE.Mesh(war?warshipGeo():shipGeoVariant(name,sail),SHIP_MODEL_MAT);m.castShadow=true;g.add(m);
  if(war){const geo=MDL.geo.liner;geo.computeBoundingBox();const bb=geo.boundingBox,L=bb.max.x-bb.min.x,dy=bb.max.y*.5;
    for(const fx of [.36,.27,-.36]){const tx=bb.min.x+L*(.5+fx),tr=new THREE.Mesh(SG.box,SM.dark);tr.scale.set(.055,.022,.04);tr.position.set(tx,dy,0);tr.castShadow=true;g.add(tr);
      for(const sd of [-.006,.006]){const b=new THREE.Mesh(SG.cyl,SM.dark);b.scale.set(.004,.05,.004);b.rotation.z=Math.PI/2;b.position.set(tx+(fx>0?.035:-.035),dy+.004,sd);g.add(b)}}}
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
function wildModelOf(hd){const h=hash(hd.x*7.1+hd.z*3.3);if(hd.kind==='deer'){const i=tileAt(hd.x,hd.z),forest=i>=0&&biome[i]===5;if(forest&&h<.25)return 'wolf';if(forest&&h<.36)return 'fox';return h<.8?'deer':'horse'}
  if(hd.kind==='reindeer')return 'deer';return WILD_MODEL[hd.kind]||null}
const WILD_STATIC={deer:1,stag:1,fox:1,donkey:1};
function drawWildModel(hd,m,x,y,z,now){const name=hd._mn!==undefined?hd._mn:(hd._mn=wildModelOf(hd));if(!name)return false;
  if(WILD_STATIC[name]){const k=hd.m.indexOf(m),nm=name==='deer'&&k===0?'stag':name;if(name==='fox'&&k>1)return true;if(!sOn(nm))return false;
    const mv=Math.hypot(hd.vx,hd.vz)>.009,bob=mv?Math.abs(Math.sin(now/140+m.ph))*.003:0;add('s_'+nm,x,y+bob,z,1,1,1,mv?Math.atan2(hd.vx,hd.vz):m.a,hd.kind==='reindeer'?0xd8d0c8:null);return true}
  if(!modelOn(name))return false;const F=MDL.frames[name],mv=Math.hypot(hd.vx,hd.vz)>.009&&F.walk!==F.idle;
  const list=mv?F.walk:F.idle,fi=Math.floor(now/1000*(mv?7:1.5)+m.ph*3)%list.length,kn=list[(fi+list.length)%list.length];addM(kn,x,y,z,1,mv?Math.atan2(hd.vx,hd.vz):m.a);WILD_USED.add(kn);return true}
function drawWhaleModel(w,up,now){if(!modelOn('whale'))return false;const F=MDL.frames.whale.swim,kn=F[Math.floor(now/260)%F.length];
  addM(kn,w.x,seaNow()-.05+up*.04,w.z,1,Math.atan2(Math.cos(w.a),Math.sin(w.a)),null,null,null,null,-Math.cos(w.t*.6)*.12);WILD_USED.add(kn);return true}

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
    for(const m of s.m){const x=s.x+m.dx,z=s.z+m.dz,kn=F[Math.floor(T*6+m.ph*2)%F.length];let y=seaNow()-.012,tilt=0;
      if(s.kind==='dolphin'){const ph=(T*.9+m.ph)%6.283,arc=Math.sin(ph);y=seaNow()-.03+Math.max(0,arc)*.05;tilt=arc>0?-Math.cos(ph)*.7:0;if(arc>0&&arc<.08&&rng()<dt*8)emit('spray',x,seaNow()+.01,z,0,0)}
      else if(s.kind==='shark')y=seaNow()-.026;else if(s.kind==='manta_ray')y=seaNow()-.022+Math.sin(T+m.ph)*.004;else y=seaNow()-.008;
      addM(kn,x,y,z,1,ry+(s.kind[0]==='f'?Math.sin(T*2+m.ph)*.4:0),null,null,null,null,tilt);WILD_USED.add(kn)}}}
document.addEventListener('DOMContentLoaded',()=>{if(typeof updateLiving!=='function')return;const _ul=updateLiving;updateLiving=function(dt,k,now){if(settings.models!==false)for(const nm of WILD_ONLY){const F=MDL.frames[nm];if(F)for(const key in F)for(const kn of F[key])if(KITS[kn])KITS[kn].k=0}
  WILD_USED=new Set();const r=_ul.apply(this,arguments);try{trainStations(dt,k)}catch(e){}try{updateSeaLife(dt,k,now);drawTraffic(now,k)}catch(e){console.warn('sea',e)}
  mcommit([...WILD_USED]);return r}});
{const _um=updateModern;updateModern=function(){const r=_um.apply(this,arguments);for(const nm of VEH_KITS){const K=KITS[nm];K.mesh.count=K.k;K.mesh.instanceMatrix.needsUpdate=true;if(K.mesh.instanceColor)K.mesh.instanceColor.needsUpdate=true}return r}}

/* ---------- caravans: pack donkeys in the old ages, a donkey pulling a covered cart later ---------- */
function drawCaravanModel(c,e,x,y,z,r,nc){if(!sOn('donkey'))return false;const cs=Math.cos(r),sn=Math.sin(r),ry=Math.PI/2-r;
  if(e<=2){for(let q=0;q<3;q++){const bx=x-cs*q*.05,bz=z-sn*q*.05,by=groundY(bx,bz);add('s_donkey',bx,by,bz,1,1,1,ry);add('lcart',bx,by+.03,bz,.018,.012,.022,-r,q?0xc8b088:nc)}return true}
  add('lcart',x,y+.012,z,.05,.022,.03,-r,0x7a5a3a);add('lcart',x,y+.034,z,.044,.016,.028,-r,0xe8e0c8);for(const s of [-1,1])add('wheel',x-sn*.016*s,y+.01,z+cs*.016*s,.016,.004,.016,-r+Math.PI/2,0x4a3a2a,Math.PI/2);
  const dx=x+cs*.06,dz=z+sn*.06;add('s_donkey',dx,groundY(dx,dz),dz,1,1,1,ry);return true}
/* hover traffic of the Future age: small sleek craft instead of glowing bars */
function drawHoverModel(x,y,z,hr,i,h1){const nm=['ship_challenger','ship_dispatcher','ship_zenith','ship_pancake'][(h1*4)|0];if(!sOn(nm))return false;add('s_'+nm,x,y,z,1,1,1,hr+Math.PI/2,i%3?0xe8f8ff:0xfff0d8);return true}
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

/* ---------- railways: a line of sleepers and two steel rails beside the road between towns; trains run on it and slip out of sight at the stations ---------- */
kit('railS',unitBox(),stdMat({color:0x5a4632,roughness:1}),40000,false);kit('railB',unitBox(),stdMat({color:0x8a8d91,roughness:.4,metalness:.6}),60000,false);
let railSig='';
function railPath(c){/* the road route, moved to one side of the road */const P=c.pts,out=[];for(let q=0;q<P.length;q++){const a=P[Math.max(0,q-1)],b=P[Math.min(P.length-1,q+1)],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz)||1;out.push([P[q][0]-dz/l*.1,P[q][1]+dx/l*.1])}
  let L=0;const acc=[0];for(let q=1;q<out.length;q++){L+=Math.hypot(out[q][0]-out[q-1][0],out[q][1]-out[q-1][1]);acc.push(L)}return {pts:out,acc,L}}
function railBlocked(x,z){const i=tileAt(x,z);return i<0||occupied.has(i)||nearTown(x,z,.55)}
function nearTown(x,z,R){for(const n of nations)if(n.alive)for(const c of n.cities)if(Math.hypot(wx(c.x)-x,wz(c.y)-z)<R)return true;return false}
function rebuildRails(){const lines=(typeof tradeTrains!=='undefined'?tradeTrains:[]).filter(c=>{const n=nations[c.a];return n&&n.alive&&n.era>=5&&n.era<=6&&settings.models!==false});
  for(const c of lines)c._rail=railPath(c);
  const sig=lines.map(c=>c.a+':'+c.b+':'+c.pts.length).join('|')+'|'+terrVer;if(sig===railSig)return;railSig=sig;kitReset(['railS','railB']);
  for(const c of lines){const R=c._rail;let px=null,pz=null;
    for(let t=0;t<=R.L;t+=.034){_tt.pts=R.pts;_tt.acc=R.acc;_tt.t=t;const [x,z,a]=tradeTrainAt(_tt),y=groundY(x,z);if(y<waterY+.01||railBlocked(x,z)){px=null;continue}
      const cs=Math.cos(a),sn=Math.sin(a);add('railS',x,y-.003,z,.012,.005,.045,-a,0x5a4632);
      if(px!==null)for(const sd of [-1,1]){const ox=-sn*.014*sd,oz=cs*.014*sd;add('railB',(x+px)/2+ox,y+.002,(z+pz)/2+oz,Math.hypot(x-px,z-pz)+.001,.004,.003,-a)}px=x;pz=z}}
  kitCommit(['railS','railB'])}
document.addEventListener('DOMContentLoaded',()=>{if(typeof tradeTrainRoutes!=='function')return;const _tr=tradeTrainRoutes;tradeTrainRoutes=function(){const r=_tr.apply(this,arguments);try{rebuildRails()}catch(e){console.warn('rails',e)}return r}});
/* trains follow the rails, and are hidden while they stand in a station inside a town or cross open water */
{const _dt=drawTrainModel;drawTrainModel=function(c,e,x,y,z,r,nc){if(!c._rail)return _dt.apply(this,arguments);const R=c._rail,hs=e>=6,cargo=hash(c.a*7.7+c.b*3.1)<.35,front=hs?(cargo?'cargo_front':'hs_front'):'loco_front';if(!sOn(front))return false;
  const cars=hs?(cargo?['cargo_box','cargo_coal','cargo_box']:['hs_wagon','hs_wagon','hs_wagon']):(cargo?['loco_tender','cargo_coal','cargo_box']:['loco_tender','loco_wagon','loco_wagon']);
  const len=n=>MDL.info[n]&&MDL.info[n].d?MDL.info[n].d.len:.08,T0=c.t/c.L*R.L;_tt.pts=R.pts;_tt.acc=R.acc;let off=0;const L=[front,...cars];
  for(let q=0;q<L.length;q++){const nm=L[q],hl=len(nm)/2;if(q)off+=hl+.004;_tt.t=clamp(T0-c.dir*off,0,R.L);const [px,pz,a]=tradeTrainAt(_tt),rr=c.dir>0?a:a+Math.PI,gy=groundY(px,pz);
    if(gy>waterY+.01&&!railBlocked(px,pz))addV(nm,px,gy+.006,pz,Math.PI/2-rr);off+=hl}
  return true}}

/* ---------- far away, a building is drawn as a plain block of its own colour: the detail is invisible there and costs the most ---------- */
/* the far-away stand-in is a little house (walls and a pitched roof, the roof darker), so distant towns still read as villages, not blocks */
kit('lodBox',(()=>{const P=[],C=[],q=(a,b,c,col)=>{P.push(...a,...b,...c);for(let k=0;k<3;k++)C.push(...col)};const W=[1,1,1],R=[.58,.5,.42],G=[.86,.84,.8];
  const x0=-.5,x1=.5,z0=-.5,z1=.5,y0=0,y1=.56,y2=1;
  /* walls */q([x0,y0,z1],[x1,y0,z1],[x1,y1,z1],W);q([x0,y0,z1],[x1,y1,z1],[x0,y1,z1],W);q([x1,y0,z0],[x0,y0,z0],[x0,y1,z0],W);q([x1,y0,z0],[x0,y1,z0],[x1,y1,z0],W);
  q([x1,y0,z1],[x1,y0,z0],[x1,y1,z0],W);q([x1,y0,z1],[x1,y1,z0],[x1,y1,z1],W);q([x0,y0,z0],[x0,y0,z1],[x0,y1,z1],W);q([x0,y0,z0],[x0,y1,z1],[x0,y1,z0],W);
  /* gable ends */q([x0,y1,z1],[x1,y1,z1],[0,y2,z1],G);q([x1,y1,z0],[x0,y1,z0],[0,y2,z0],G);
  /* roof, with a small overhang */const o=.06;q([x1+o,y1-.04,z1+o],[x1+o,y1-.04,z0-o],[0,y2,z0-o],R);q([x1+o,y1-.04,z1+o],[0,y2,z0-o],[0,y2,z1+o],R);
  q([x0-o,y1-.04,z0-o],[x0-o,y1-.04,z1+o],[0,y2,z1+o],R);q([x0-o,y1-.04,z0-o],[0,y2,z1+o],[0,y2,z0-o],R);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.computeVertexNormals();return g})(),
  new THREE.MeshStandardMaterial({roughness:.9,vertexColors:true}),40000,false);
const LODP={stamp:-1,n:0};const _lodM=new THREE.Matrix4(),_lodC=new THREE.Color();
const lodDist=()=>(settings.power==='saver'?6.5:settings.power==='max'?13:settings.quality==='low'?6.5:9)*(typeof PERF!=='undefined'&&perfOn()?PERF.lodK:1)*(LK.pixel?1.35:1);
{const _ck=cullKit;cullKit=function(K,P,margin){if(!K.lodC)return _ck(K,P,margin);
  if(LODP.stamp!==CULLK.last){LODP.stamp=CULLK.last;LODP.n=0}const LK=KITS.lodBox,LA=LK.mesh.instanceMatrix.array,LC=LK.mesh.instanceColor.array,avg=K.avg,LD2=lodDist()**2,cx=cam.position.x,cy=cam.position.y,cz=cam.position.z;
  const A=K.mesh.instanceMatrix.array,C=K.mesh.instanceColor?K.mesh.instanceColor.array:null,cs=K.cs,M=K.mm,MC=K.mc;let v=0;
  for(let i=0;i<K.n;i++){const x=cs[i*4],y=cs[i*4+1],z=cs[i*4+2],r=-(cs[i*4+3]+margin);let ok=true;
    for(let p=0;p<6;p++){const q=P[p];if(q.normal.x*x+q.normal.y*y+q.normal.z*z+q.constant<r){ok=false;break}}
    if(!ok)continue;
    if((x-cx)**2+(y-cy)**2+(z-cz)**2>LD2){if(LODP.n<LK.max){LA.set(M.subarray(i*16,i*16+16),LODP.n*16);const o=LODP.n*3;LC[o]=avg[0]*(MC?MC[i*3]:1);LC[o+1]=avg[1]*(MC?MC[i*3+1]:1);LC[o+2]=avg[2]*(MC?MC[i*3+2]:1);LODP.n++}continue}
    A.set(M.subarray(i*16,i*16+16),v*16);if(C&&MC)C.set(MC.subarray(i*3,i*3+3),v*3);v++}
  K.mesh.count=v;const IM=K.mesh.instanceMatrix;IM.needsUpdate=true;if(IM.updateRange){IM.updateRange.offset=0;IM.updateRange.count=v*16}
  if(K.mesh.instanceColor){const IC=K.mesh.instanceColor;IC.needsUpdate=true;if(IC.updateRange){IC.updateRange.offset=0;IC.updateRange.count=v*3}}}}
{const _ct=cullTick;cullTick=function(){const st=CULLK.last;const r=_ct.apply(this,arguments);if(CULLK.last!==st){const LK=KITS.lodBox;if(LODP.stamp!==CULLK.last){LODP.n=0;LODP.stamp=CULLK.last}
  LK.mesh.count=LODP.n;LK.mesh.instanceMatrix.needsUpdate=true;LK.mesh.instanceColor.needsUpdate=true}return r}}

/* ---------- models load as the world needs them: a Stone Age world never downloads cars or space domes ---------- */
function modelEras(n){
  if(/^(cow|horse|sheep|pig|male_|female_|knight|tree_|bush_|rock_|zebra|llama|wolf|dolphin|shark|whale|manta|fish|deer|stag|fox|donkey)/.test(n))return [0,7];
  if(n==='viking_boat')return [0,3];if(n==='sail_ship'||n==='boatwsail')return [2,5];if(n==='cruiseship')return [6,7];if(/plane/.test(n))return [5,7];if(/^tank/.test(n))return [5,6];
  if(/^(egypt|japan|maya|pantheon)/.test(n))return [1,3];if(n==='torii')return [1,4];if(/^c_/.test(n))return [3,4];if(n==='med_house')return [3,6];if(/^mv_/.test(n))return [3,4];if(/^rts_/.test(n))return [2,4];
  if(/^town|^cottage/.test(n))return [4,5];if(/^farm_/.test(n))return [4,6];if(/^(sub_house|flat|shop|hospital|bank|dt_)/.test(n))return [6,6];
  if(/^(car\d|suv|sports|taxi|cop|bus|schoolbus|loco|hs_|cargo)/.test(n))return [5,6];if(/^fut_|^ship_/.test(n))return [7,7];if(n==='liner')return [5,6];return [0,7]}
function ensureModels(){if(!MDL_LOADER||settings.models===false||typeof nations==='undefined')return;const eras=new Set();for(const n of nations)if(n.alive)eras.add(n.era);if(!eras.size)return;
  for(const name of [...Object.keys(MODEL_DEFS),...Object.keys(SMODEL)]){if(MDL_REQ.has(name))continue;if(/^ru_/.test(name)&&!(typeof ruins!=='undefined'&&ruins.length))continue;const [a,b]=modelEras(name);let need=false;for(const e of eras)if(e>=a&&e<=b){need=true;break}
    if(need){MDL_REQ.add(name);MDL_LOADER(name)}}}
setInterval(ensureModels,2000);
function onModelsToggle(){SBVER++;MDL_VER++;propsDirty=true;treesDirty=true;railSig='';if(settings.models!==false)ensureModels()}

/* ---------- far-away trees become a handful of triangles: a trunk and a simple crown of the same size and colour ---------- */
const TREE_LO={conifer:'cone',broad:'round',townTree:'round',palm:'flat',bush:'bush',s_tree_c:'round',s_bush_a:'round',s_bush_b:'round',s_bush_c:'round',s_tree_a:'flat',s_tree_b:'flat',s_tree_d:'flat'};
function loTreeGeo(src,type){src.computeBoundingBox();const b=src.boundingBox,y0=Math.max(0,b.min.y),h=b.max.y-y0,w=Math.max(b.max.x-b.min.x,b.max.z-b.min.z),P=[],C=[];
  const put=(g,col)=>{g=g.index?g.toNonIndexed():g;const a=g.attributes.position.array;for(let i=0;i<a.length;i+=3){P.push(a[i],a[i+1],a[i+2]);C.push(...col)}};
  if(type!=='bush'){const tk=new THREE.CylinderGeometry(w*.04,w*.06,h*(type==='cone'?.3:.55),4,1,true);tk.translate(0,y0+h*(type==='cone'?.15:.275),0);put(tk,TRUNK)}
  let cr;if(type==='cone'){cr=new THREE.ConeGeometry(w*.48,h*.8,7,1);cr.translate(0,y0+h*.6,0)}
  else if(type==='flat'){cr=new THREE.IcosahedronGeometry(.5,0);cr.scale(w*.95,h*.32,w*.95);cr.translate(0,y0+h*.82,0)}
  else if(type==='bush'){cr=new THREE.IcosahedronGeometry(.5,0);cr.scale(w*.95,h*.95,w*.95);cr.translate(0,y0+h*.47,0)}
  else{cr=new THREE.IcosahedronGeometry(.5,0);cr.scale(w*.92,h*.62,w*.92);cr.translate(0,y0+h*.66,0)}
  const n0=P.length;put(cr,[.82,.82,.82]);
  /* the crown is darker underneath and lighter on top, like the full trees, so the swap between them does not flash */
  {let lo=1e9,hi=-1e9;for(let i=n0;i<P.length;i+=3){lo=Math.min(lo,P[i+1]);hi=Math.max(hi,P[i+1])}for(let i=n0;i<P.length;i+=3){const f=(P[i+1]-lo)/Math.max(1e-4,hi-lo),v=LK.pixel?.4+.42*f:.82;C[i]=C[i+1]=C[i+2]=v}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.computeVertexNormals();
  /* the crown is shaded as one soft round mass: normals point out from its centre, so it never shows sharp shards */
  cr.computeBoundingBox();const cb=cr.boundingBox,cc=new THREE.Vector3(),sz=new THREE.Vector3();cb.getCenter(cc);cb.getSize(sz);const N=g.attributes.normal.array;
  for(let i=n0;i<P.length;i+=3){let nx=(P[i]-cc.x)/Math.max(.01,sz.x*sz.x),ny=(P[i+1]-cc.y)/Math.max(.01,sz.y*sz.y)+(type==='cone'?.6/Math.max(.01,sz.y):0),nz=(P[i+2]-cc.z)/Math.max(.01,sz.z*sz.z);const l=Math.hypot(nx,ny,nz)||1;N[i]=nx/l;N[i+1]=ny/l;N[i+2]=nz/l}
  return g}
const LOD_KITS=['lodBox'];
/* the switch to simple trees follows the zoom: the camera itself is camDist away from what you look at, so a fixed distance would turn
   every tree on screen into a stand-in at an ordinary zoom. Trees within about the camera's distance plus a margin are always the full ones. */
const camD=()=>typeof camDist==='number'?camDist:10,perfK=()=>typeof PERF!=='undefined'&&perfOn()?Math.max(.75,PERF.lodK):1;
const treeLodDist=()=>Math.max(7,lodDist()*.75*(LK.pixel?1.45:1),Math.min(camD()*1.35+5,28)*perfK());/* far out a tree is a few pixels, so the reach stops growing */
function makeTreeLo(name){const K=KITS[name];if(!K||K.lodP)return;const lo='lo_'+name;kit(lo,loTreeGeo(K.mesh.geometry,TREE_LO[name]),modelTreeMat(),K.max,false);KITS[lo].pn=0;K.lodP=lo;LOD_KITS.push(lo)}
TREE_LO.hamA=TREE_LO.hamB='round';for(const n of ['hamA','hamB','conifer','broad','townTree','palm','bush'])makeTreeLo(n);
{const _ps=prepStatic;prepStatic=function(name,g){const r=_ps.apply(this,arguments);if(TREE_LO['s_'+name])makeTreeLo('s_'+name);return r}}
/* trees switch to their simple crowns closer in than buildings do, since a forest is thousands of them */
{const _ck2=cullKit;cullKit=function(K,P,margin){if(!K.lodP)return _ck2(K,P,margin);
  const LK=KITS[K.lodP];if(LK.stamp!==CULLK.last){LK.stamp=CULLK.last;LK.pn=0}const LA=LK.mesh.instanceMatrix.array,LC=LK.mesh.instanceColor.array,LD2=treeLodDist()**2,cx=cam.position.x,cy=cam.position.y,cz=cam.position.z;
  const A=K.mesh.instanceMatrix.array,C=K.mesh.instanceColor?K.mesh.instanceColor.array:null,cs=K.cs,M=K.mm,MC=K.mc;let v=0;
  for(let i=0;i<K.n;i++){const x=cs[i*4],y=cs[i*4+1],z=cs[i*4+2],r=-(cs[i*4+3]+margin);let ok=true;
    for(let p=0;p<6;p++){const q=P[p];if(q.normal.x*x+q.normal.y*y+q.normal.z*z+q.constant<r){ok=false;break}}
    if(!ok)continue;
    if((x-cx)**2+(y-cy)**2+(z-cz)**2>LD2){if(LK.pn<LK.max){LA.set(M.subarray(i*16,i*16+16),LK.pn*16);if(MC)LC.set(MC.subarray(i*3,i*3+3),LK.pn*3);LK.pn++}continue}
    A.set(M.subarray(i*16,i*16+16),v*16);if(C&&MC)C.set(MC.subarray(i*3,i*3+3),v*3);v++}
  K.mesh.count=v;const IM=K.mesh.instanceMatrix;IM.needsUpdate=true;if(IM.updateRange){IM.updateRange.offset=0;IM.updateRange.count=v*16}
  if(K.mesh.instanceColor){const IC=K.mesh.instanceColor;IC.needsUpdate=true;if(IC.updateRange){IC.updateRange.offset=0;IC.updateRange.count=v*3}}}}
{const _ct2=cullTick;cullTick=function(){const st=CULLK.last;const r=_ct2.apply(this,arguments);if(CULLK.last!==st)for(const nm of LOD_KITS){if(nm==='lodBox')continue;const LK=KITS[nm];if(LK.stamp!==CULLK.last){LK.stamp=CULLK.last;LK.pn=0}
  LK.mesh.count=LK.pn;LK.mesh.instanceMatrix.needsUpdate=true;LK.mesh.instanceColor.needsUpdate=true}return r}}

/* ---------- stations: where the railway reaches a town there is a platform and a station hall, and the train waits there before it turns back ---------- */
kit('stP',unitBox(),MAT.stone,600,false);kit('stB',unitBox(),MAT.brick,600);kit('stR',gableGeo(),MAT.tiles,600);kit('stC',unitBox(),MAT.plain,600);
function placeStation(R,t,toward,era){_tt.pts=R.pts;_tt.acc=R.acc;_tt.t=t;const [x,z,a]=tradeTrainAt(_tt),c=Math.cos(a),s=Math.sin(a),nx=-s,nz=c;/* the side away from the road */
  const mid=t-toward*.1;_tt.t=clamp(mid,0,R.L);const [mx,mz]=tradeTrainAt(_tt),y=groundY(mx,mz);if(y<waterY+.02)return;
  add('stP',mx+nx*.03,y-.006,mz+nz*.03,.24,.012,.03,-a,0xb8b0a0);
  for(let tries=0;tries<4;tries++){const bt=clamp(mid-toward*tries*.07,0,R.L);_tt.t=bt;const [bx,bz]=tradeTrainAt(_tt),X=bx+nx*.08,Z=bz+nz*.08;if(typeof inBuilding==='function'&&inBuilding(X,Z))continue;const by=groundY(X,Z);
    if(era>=6){add('stC',X,by-.01,Z,.13,.035,.06,-a,0xd8dde2);add('stC',X,by+.025,Z,.15,.004,.07,-a,0x4a5058);add('stC',mx+nx*.03,y+.035,mz+nz*.03,.2,.003,.035,-a,0x9fb8c8)}
    else{add('stB',X,by-.01,Z,.12,.045,.055,-a,0xffffff);add('stR',X,by+.035,Z,.13,.03,.065,-a,0x5d6672);add('stC',X,by+.072,Z,.012,.02,.012,-a,0xe8e0d0)/* the clock turret */;
      for(let q=0;q<4;q++){_tt.t=clamp(mid+(q-1.5)*.055,0,R.L);const [px,pz]=tradeTrainAt(_tt);add('stC',px+nx*.038,y,pz+nz*.038,.003,.032,.003,0,0x3a3a3a)}add('stC',mx+nx*.035,y+.032,mz+nz*.035,.22,.003,.026,-a,0x6a3a2a)}
    break}}
{const _rr=rebuildRails;rebuildRails=function(){const before=railSig;_rr.apply(this,arguments);const lines=(typeof tradeTrains!=='undefined'?tradeTrains:[]).filter(c=>c._rail);
  /* where along each line the open track starts and ends: the stations */
  for(const c of lines){const R=c._rail;if(R.st)continue;let ra=-1,rb=-1;for(let t=0;t<=R.L;t+=.03){_tt.pts=R.pts;_tt.acc=R.acc;_tt.t=t;const [x,z]=tradeTrainAt(_tt);if(!railBlocked(x,z)&&groundY(x,z)>waterY+.01){if(ra<0)ra=t;rb=t}}R.st=ra>=0&&rb-ra>.6?[ra+.05,rb-.05]:null}
  if(railSig===before)return;kitReset(['stP','stB','stR','stC']);const done=new Set();
  for(const c of lines){const R=c._rail;if(!R.st)continue;const e=nations[c.a].era;for(const [t,tw] of [[R.st[0],-1],[R.st[1],1]]){_tt.pts=R.pts;_tt.acc=R.acc;_tt.t=t;const [x,z]=tradeTrainAt(_tt),key=Math.round(x*5)+','+Math.round(z*5);if(done.has(key))continue;done.add(key);placeStation(R,t,tw,e)}}
  kitCommit(['stP','stB','stR','stC'])}}
/* the train stops at the platform, waits, whistles and sets off back the way it came */
const TRAIN_HOLD=new Map();
function trainStations(dt,k){if(typeof tradeTrains==='undefined')return;for(const c of tradeTrains){const R=c._rail;if(!R||!R.st)continue;const key=c.a+':'+c.b,H=TRAIN_HOLD.get(key)||{w:0,h:0};TRAIN_HOLD.set(key,H);
  const tA=R.st[0]/R.L*c.L,tB=R.st[1]/R.L*c.L;
  if(H.w>0){H.w-=dt*(k>0?1:0);c.t=H.h;if(H.w<=0){H.go=1;if(typeof trainSound==='function')trainSound(c,'whistle')}continue}
  if(c.dir<0&&c.t<=tA){c.t=H.h=tA;H.w=4+hash(c.a+c.b)*3;c.dir=1}else if(c.dir>0&&c.t>=tB){c.t=H.h=tB;H.w=4+hash(c.a*3+c.b)*3;c.dir=-1}
  else if(c.t<tA-.02)c.t=tA;else if(c.t>tB+.02)c.t=tB}}

/* ---------- ruins: broken walls, a fallen arch, toppled columns, rubble and a dead tree where a town once stood ---------- */
const RUIN_PIECES=['ru_broken','ru_double','ru_hole','ru_half','ru_broken','ru_column','ru_colshort','ru_bricks','ru_arch','ru_wall','ru_bricks','ru_deadtree','ru_archway','ru_deadtree2'];
function drawRuinModel(r,cx,cz,age,i0){if(!sOn('ru_broken')||!sOn('ru_column'))return false;const fade=1-age/400,tint=r.nuke?0x6a6660:0xd8d2c8;
  for(let k=0;k<11;k++){const a=hash(i0*7+k)*6.283,d=.05+hash(i0*3+k)*.3,x=cx+Math.cos(a)*d,z=cz+Math.sin(a)*d,y=groundY(x,z);if(y<waterY+.03)continue;
    const nm=RUIN_PIECES[Math.floor(hash(i0*11+k*3)*RUIN_PIECES.length)],big=hash(i0+k*7);if(!sOn(nm))continue;
    if(/deadtree/.test(nm)){if(!r.nuke||k%2)addB(nm,x,y-.005,z,.05,.05,a,0x5a4838);continue}
    if(/column/.test(nm)){addB(nm,x,y-.005,z,.03,.03,a,tint,fade);continue}if(nm==='ru_bricks'){addB(nm,x,y-.004,z,.05,.05,a,tint);continue}
    addB(nm,x,y-.012,z,.09+big*.06,.03,a,tint,fade*(.8+big*.4))}
  if(age<25)smokeAt(cx,groundY(cx,cz)+.05,cz,true,.5*(1-age/25));return true}

/* ---------- sounds of the living world near the camera: steam trains puffing and whistling, traffic, church bells, cattle, sheep, wolves and whales ---------- */
const AUD={chuff:0,horn:0,bell:20,moo:6,baa:9,howl:30,whale:20,traffic:null};
function sndNear(x,z){if(typeof camT==='undefined')return 0;const d=Math.hypot(x-camT.x,z-camT.z);return Math.max(0,1-d/(1.2+camDist*.35))*Math.max(0,1-camDist/26)}
function trainSound(c,what){if(!SND.on)return;const [x,z]=tradeTrainAt(c),v=sndNear(x,z);if(v<.05)return;const t=SND.ctx.currentTime,e=nations[c.a]?nations[c.a].era:5;
  if(what==='whistle'){if(e>=6){tone('sine',660,t,.5,.05*v,null,{verb:true});tone('sine',880,t+.04,.5,.035*v,null,{verb:true})}
    else{for(const [f,d] of [[740,.9],[932,.9]]){tone('sawtooth',f,t,d,.025*v,null,{lp:1800,a:.06,verb:true});tone('sine',f*2,t,d,.012*v,null,{a:.06})}}}}
function worldSounds(dt){if(!SND.on||typeof camT==='undefined')return;const t=SND.ctx.currentTime,night=typeof nightF!=='undefined'?nightF:0;
  /* steam trains puff as they run; high-speed trains hiss past */
  if(typeof tradeTrains!=='undefined')for(const c of tradeTrains){if(!c._rail)continue;const n=nations[c.a];if(!n)continue;const [x,z]=tradeTrainAt(c),v=sndNear(x,z);if(v<.05)continue;const H=TRAIN_HOLD.get(c.a+':'+c.b);if(H&&H.w>0)continue;
    AUD.chuff-=dt;if(AUD.chuff<=0){if(n.era===5){AUD.chuff=.32;nburst(SND.noise,t,.14,.05*v,'bandpass',700,null,{q:1.2,a:.005})}else{AUD.chuff=1.6;nburst(SND.noise,t,1.4,.03*v,'bandpass',1400,null,{to:500,q:.6,a:.4})}}break}
  /* modern streets: a low hum of engines and now and then a horn */
  let cars=0;for(const nm of ['s_car1','s_car2','s_suv','s_sports1','s_sports2','s_taxi','s_bus'])if(KITS[nm])cars+=KITS[nm].k;
  const tv=Math.min(1,cars/60)*Math.max(0,1-camDist/18);
  if(!AUD.traffic&&SND.ctx&&SND.brown){const s=SND.ctx.createBufferSource(),f=SND.ctx.createBiquadFilter(),g=SND.ctx.createGain();s.buffer=SND.brown;s.loop=true;f.type='lowpass';f.frequency.value=260;g.gain.value=0;s.connect(f);f.connect(g);g.connect(SND.bus.amb||SND.bus.sfx);s.start();AUD.traffic=g}
  if(AUD.traffic)AUD.traffic.gain.setTargetAtTime(.09*tv,t,.8);
  AUD.horn-=dt;if(AUD.horn<=0){AUD.horn=4+Math.random()*9;if(tv>.2){const f=380+Math.random()*120;tone('square',f,t,.18,.012*tv,null,{lp:1400});if(Math.random()<.5)tone('square',f,t+.25,.12,.01*tv,null,{lp:1400})}}
  /* the church bell of an old town close by */
  AUD.bell-=dt;if(AUD.bell<=0){AUD.bell=28+Math.random()*30;let best=0;for(const n of nations){if(!n.alive||n.era<3||n.era>5)continue;for(const c of n.cities)best=Math.max(best,sndNear(wx(c.x),wz(c.y)))}
    if(best>.1){for(let q=0;q<3;q++)bell(57,t+q*1.6,.05*best)}}
  /* farm animals and the wild */
  if(camDist<9){let cow=0,sheep=0;for(const h of herds){const v=sndNear(h.x,h.z);if(h.kind==='sheep')sheep=Math.max(sheep,v);else cow=Math.max(cow,v)}
    AUD.moo-=dt;if(AUD.moo<=0){AUD.moo=7+Math.random()*12;if(cow>.15){tone('sawtooth',118,t,1.1,.045*cow,null,{slide:92,lp:520,a:.15});tone('sawtooth',236,t,1.1,.012*cow,null,{slide:184,lp:700,a:.15})}}
    AUD.baa-=dt;if(AUD.baa<=0){AUD.baa=6+Math.random()*10;if(sheep>.15){for(let q=0;q<5;q++)tone('sawtooth',360+(q%2)*24,t+q*.07,.09,.018*sheep,null,{lp:1600})}}}
  AUD.howl-=dt;if(AUD.howl<=0){AUD.howl=25+Math.random()*30;if(night>.4&&typeof wildHerds!=='undefined'){const w=wildHerds.find(h=>h._mn==='wolf');const v=w?sndNear(w.x,w.z):0;if(v>.1){tone('sine',420,t,2.4,.05*v,null,{slide:560,a:.6,verb:true});tone('sine',560,t+2.2,1.4,.035*v,null,{slide:380,a:.2,verb:true})}}}
  AUD.whale-=dt;if(AUD.whale<=0){AUD.whale=18+Math.random()*25;if(typeof seaWhales!=='undefined'){const w=seaWhales[0],v=w?sndNear(w.x,w.z):0;if(v>.1)tone('sine',190,t,3.2,.06*v,null,{slide:120,a:.8,verb:true})}}}
document.addEventListener('DOMContentLoaded',()=>{if(typeof updateAudio!=='function')return;const _ua=updateAudio;updateAudio=function(dt){const r=_ua.apply(this,arguments);try{worldSounds(dt||1/60)}catch(e){}return r}});

/* ---------- forest blocks: far away, a whole wooded tile is drawn as one lumpy canopy instead of dozens of trees ---------- */
function canopyGeo(cone){const P=[],C=[],put=(g,col)=>{g=g.index?g.toNonIndexed():g;const a=g.attributes.position.array;for(let i=0;i<a.length;i+=3){P.push(a[i],a[i+1],a[i+2]);C.push(...col)}};
  /* crowns scattered over the whole tile and a little past its edge, so neighbouring blocks knit into one woodland with no grid showing;
     each crown its own shade, so the canopy reads as many trees with dark gaps between them */
  const spots=[];{let sd=7;const rnd=()=>(sd=(sd*16807)%2147483647)/2147483647;for(let t=0;spots.length<(cone?18:15)&&t<400;t++){const x=(rnd()-.5)*1.08,z=(rnd()-.5)*1.08;
    if(spots.every(q=>Math.hypot(q[0]-x,q[1]-z)>(cone?.2:.24)))spots.push([x,z,.62+rnd()*.42,.46+rnd()*.3])}}
  const NR=[];for(const [x,z,hh,sh] of spots){let g;const n0=P.length,rw=cone?.13:.17+hh*.05;if(cone){g=new THREE.ConeGeometry(rw,hh,6,1);g.translate(x,hh/2,z)}else{g=new THREE.IcosahedronGeometry(.5,0);g.scale(rw*2,hh*.6,rw*2);g.translate(x,hh*.66,z)}put(g,[sh,sh,sh]);
    const cy=cone?hh*.35:hh*.66,sx=rw,sy=cone?hh*.7:hh*.3;for(let i=n0;i<P.length;i+=3){let nx=(P[i]-x)/(sx*sx),ny=(P[i+1]-cy)/(sy*sy)+(cone?.8/sy:0),nz=(P[i+2]-z)/(sx*sx);const l=Math.hypot(nx,ny,nz)||1;NR.push(nx/l,ny/l,nz/l)}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(NR,3));return g}
kit('canopyR',canopyGeo(false),modelTreeMat(),12000,false);kit('canopyC',canopyGeo(true),modelTreeMat(),12000,false);
KITS.canopyR.revLod=KITS.canopyC.revLod=true;TREE_KITS.push('canopyR','canopyC');
let CANOPY=new Uint8Array(1);
const CANOPY_SRC=['hamA','hamB','conifer','broad','palm','s_tree_a','s_tree_b','s_tree_c','s_tree_d','s_bush_a','s_bush_b','s_bush_c'];
const canopyDist=()=>Math.max(13,lodDist()*1.45,treeLodDist()*1.5+4);
function buildCanopies(){if(CANOPY.length!==N)CANOPY=new Uint8Array(N);else CANOPY.fill(0);kitReset(['canopyR','canopyC']);if(settings.canopy===false)return kitCommit(['canopyR','canopyC']);
  const cnt=new Uint16Array(N),con=new Uint16Array(N),top=new Float32Array(N),col=new Float32Array(N*3);
  for(const n of CANOPY_SRC){const K=KITS[n];if(!K||!K.cs)continue;for(let i=0;i<K.n;i++){const x=K.cs[i*4],y=K.cs[i*4+1],z=K.cs[i*4+2],r=K.cs[i*4+3],t=tileAt(x,z);if(t<0)continue;
    cnt[t]++;if(n==='conifer')con[t]++;top[t]+=y+r*.7;if(K.mc){col[t*3]+=K.mc[i*3];col[t*3+1]+=K.mc[i*3+1];col[t*3+2]+=K.mc[i*3+2]}else{col[t*3]+=.2;col[t*3+1]+=.3;col[t*3+2]+=.12}}}
  const c3=new THREE.Color();
  for(let t=0;t<N;t++){const c=cnt[t];if(c<6)continue;const x=wx(t%W)+.5,z=wz((t/W)|0)+.5,gy=groundY(x,z);if(gy<waterY)continue;const hh=Math.max(.15,top[t]/c-gy),cov=Math.min(1.08,.7+c/36);
    c3.setRGB(col[t*3]/c,col[t*3+1]/c,col[t*3+2]/c);c3.convertLinearToSRGB();add(con[t]*2>c?'canopyC':'canopyR',x+(hash(t*5.3)-.5)*.16,gy-.01,z+(hash(t*7.1)-.5)*.16,cov,hh*(.9+hash(t*2.3)*.2),cov,hash(t*3.1)*6.28,c3.getHex());CANOPY[t]=1}
  kitCommit(['canopyR','canopyC'])}
{const _rt=rebuildTrees;rebuildTrees=function(){const r=_rt.apply(this,arguments);if(!TREE_LIGHT)try{buildCanopies()}catch(e){console.warn('canopy',e)}return r}}
/* in the cull: trees on a blocked tile vanish beyond the canopy distance, and the canopy itself only shows out there */
{const _ck3=cullKit;cullKit=function(K,P,margin){
  if(K.revLod){const D2=canopyDist()**2,cx=cam.position.x,cy=cam.position.y,cz=cam.position.z,A=K.mesh.instanceMatrix.array,C=K.mesh.instanceColor.array,cs=K.cs,M=K.mm,MC=K.mc;let v=0;
    for(let i=0;i<K.n;i++){const x=cs[i*4],y=cs[i*4+1],z=cs[i*4+2];if((x-cx)**2+(y-cy)**2+(z-cz)**2<D2)continue;const r=-(cs[i*4+3]+margin);let ok=true;
      for(let p=0;p<6;p++){const q=P[p];if(q.normal.x*x+q.normal.y*y+q.normal.z*z+q.constant<r){ok=false;break}}if(!ok)continue;
      A.set(M.subarray(i*16,i*16+16),v*16);if(MC)C.set(MC.subarray(i*3,i*3+3),v*3);v++}
    K.mesh.count=v;K.mesh.instanceMatrix.needsUpdate=true;K.mesh.instanceColor.needsUpdate=true;return}
  if(K.lodP&&(CANOPY_SRC.includes(K.name||'')||K.name==='bush')){const D2=canopyDist()**2,cx=cam.position.x,cy=cam.position.y,cz=cam.position.z,cs=K.cs;
    /* hide the far trees that a canopy stands in for by temporarily pushing them out of every plane test */
    const keep=K._keep||(K._keep=[]);keep.length=0;for(let i=0;i<K.n;i++){const x=cs[i*4],y=cs[i*4+1],z=cs[i*4+2];if((x-cx)**2+(y-cy)**2+(z-cz)**2>D2){const t=tileAt(x,z);if(t>=0&&CANOPY[t]){keep.push(i,cs[i*4+3]);cs[i*4+3]=-1e6}}}
    _ck3(K,P,margin);for(let q=0;q<keep.length;q+=2)cs[keep[q]*4+3]=keep[q+1];return}
  return _ck3(K,P,margin)}}
for(const n in KITS)if(!KITS[n].name)KITS[n].name=n;
{const _pk=prepStatic;prepStatic=function(name){const r=_pk.apply(this,arguments);const K=KITS['s_'+name];if(K)K.name='s_'+name;return r}}
