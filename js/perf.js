"use strict";
/* Faithbound — keeping it smooth on slow computers.
   The graphics chip is recognised at start (laptop chips begin at a lighter detail level, a browser drawing without
   the graphics card at the lightest), and while you play the frame rate is watched: when the screen cannot keep up even
   at reduced resolution, detail steps down a level; when there is plenty to spare for a while, it steps back up.
   Levels: 0 full · 1 no post effects, smaller shadows · 2 forests cast no shadows, simple shapes sooner, fewer trees
   · 3 no shadows · 4 lightest. */
const PERF={tier:0,base:0,gpu:'',soft:false,lodK:1,treeK:1,folkD:12,minScale:.6,bad:0,good:0,cool:0,shadowOff:false,said:false};
(function detectGpu(){try{const gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info'),s=String(ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER));PERF.gpu=s;
  if(/swiftshader|basic render|llvmpipe|software|softpipe/i.test(s)){PERF.soft=true;PERF.base=3}
  else if(/intel|uhd|iris|hd graphics|radeon\(tm\)( [\w ]*)? graphics|radeon vega|vega \d+ graphics|mali|adreno|powervr|videocore/i.test(s)&&!/arc a\d/i.test(s))PERF.base=2}catch(e){}})();
function perfOn(){return settings.autoPerf!==false&&settings.power!=='max'}
function setShadowsLive(on){if(on===renderer.shadowMap.enabled)return;renderer.shadowMap.enabled=on;sunL.castShadow=on;scene.traverse(o=>{if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true)})}
function applyTier(t){t=Math.max(0,Math.min(4,t));PERF.tier=t;
  PERF.lodK=[1,.8,.6,.45,.35][t];PERF.treeK=[1,1,.8,.6,.45][t];PERF.folkD=[12,10,8,6,5][t];PERF.minScale=[.6,.6,.55,.5,.45][t];
  /* shadows: smaller maps from level 1, none from level 3 */
  if(settings.shadows){setShadowsLive(t<3);const want=t>=1?1024:null;if(want&&sunL.shadow.mapSize.x>want){if(sunL.shadow.map){sunL.shadow.map.dispose();sunL.shadow.map=null}sunL.shadow.mapSize.set(want,want)}
    else if(!want&&typeof applyGraphics==='function'&&sunL.shadow.mapSize.x<(settings.quality==='high'?2048:settings.quality==='medium'?2048:1024))applyGraphics()}
  /* forests stop casting shadows from level 2: thousands of trees drawn a second time for the sun */
  if(typeof KITS!=='undefined')for(const n in KITS){const K=KITS[n];if(K.cast0===undefined)K.cast0=K.mesh.castShadow;const tree=(typeof TREE_KITS!=='undefined'&&TREE_KITS.includes(n))||/^lo_/.test(n)||n==='townTree';K.mesh.castShadow=K.cast0&&!(tree&&t>=2)}
  /* simpler ground and water shading from level 2: no photo detail, meadow patterns, caustics or extra wave layers */
  if(typeof terrU!=='undefined')terrU.uLite.value=t>=2?1:0;if(typeof waterU!=='undefined')waterU.uLite.value=t>=2?1:0;
  if(typeof CULLK!=='undefined')CULLK.dirty=true;if(typeof treesDirty!=='undefined')treesDirty=true;if(typeof resize==='function')resize();
  if(typeof shadowForce!=='undefined')shadowForce=true}
/* post effects (outlines, focus blur, colour grading) are full-screen passes: the first thing a laptop chip gives up */
{const _pa=postActive;postActive=function(){return _pa()&&!(perfOn()&&PERF.tier>=(LK.pixel?3:1))}}
/* (the painted look draws at a reduced resolution, so its effects stay affordable a few levels longer) */
/* watch the frame rate */
setInterval(()=>{if(!perfOn()||typeof frameEMA==='undefined'||typeof playing==='undefined'||!playing||document.hidden)return;
  const cap=typeof fpsCap==='function'?fpsCap():60,want=1000/(cap||60),r=frameEMA/want,now=performance.now();if(now<PERF.cool)return;
  if(r>1.35&&dynScale<=PERF.minScale+.06){if(++PERF.bad>=3&&PERF.tier<4){PERF.bad=0;PERF.good=0;applyTier(PERF.tier+1);PERF.cool=now+6000}}else PERF.bad=0;
  if(r<.8&&dynScale>=.99){if(++PERF.good>=30&&PERF.tier>Math.max(0,PERF.base-1)){PERF.good=0;applyTier(PERF.tier-1);PERF.cool=now+15000}}else PERF.good=0},1000);
document.addEventListener('DOMContentLoaded',()=>{if(perfOn())applyTier(PERF.base);
  if(PERF.soft&&!PERF.said&&typeof say==='function'){PERF.said=true;setTimeout(()=>say('Your browser is drawing without the graphics card, so the game runs slowly. Turn on hardware acceleration in the browser settings.'),4000)}});
function perfNote(){const lv=['full','high','balanced','light','lightest'][PERF.tier];
  return `Detail is now <b>${lv}</b>${PERF.base>=2&&!PERF.soft?' (a laptop graphics chip was found, so the game starts lighter)':''}. ${PERF.soft?'<b>The browser is not using the graphics card: turn on hardware acceleration in its settings.</b> ':''}<span class="dim">${(PERF.gpu||'').replace(/[<>&]/g,'').slice(0,80)}</span>`}

/* ---------- ground and water in chunks: full detail near the camera, coarser further away ----------
   The chunks share the terrain's own vertices (heights, colours, normals) and only differ in which triangles they draw.
   Chunk borders always keep every vertex, and coarse cells along a border fan out to them, so neighbours of any
   detail meet without cracks. Only the nearby chunks cast shadows. */
function lodIndex(gw,u0,v0,nu,nv,s){const I=[],id=(u,v)=>(v0+v)*gw+(u0+u);
  if(s===1||nu%s||nv%s){for(let v=0;v<nv;v++)for(let u=0;u<nu;u++){const a=id(u,v),b=id(u+1,v),c=id(u,v+1),d=id(u+1,v+1);I.push(a,c,b,b,c,d)}return I}
  const cu=nu/s,cv=nv/s,h=s/2;
  for(let j=0;j<cv;j++)for(let i=0;i<cu;i++){const U=i*s,V=j*s;
    if(i>0&&j>0&&i<cu-1&&j<cv-1){const a=id(U,V),b=id(U+s,V),c=id(U,V+s),d=id(U+s,V+s);I.push(a,c,b,b,c,d);continue}
    const ring=[],side=(fine,f)=>{const n=fine?s:1;for(let q=0;q<n;q++)ring.push(f(q*(s/n)))};
    side(i===0,q=>id(U,V+q));side(j===cv-1,q=>id(U+q,V+s));side(i===cu-1,q=>id(U+s,V+s-q));side(j===0,q=>id(U+s-q,V));
    const m=id(U+h,V+h);for(let q=0;q<ring.length;q++)I.push(m,ring[q],ring[(q+1)%ring.length])}
  return I}
function makeLodGrid(src,gw,gh,C,shadow){const L={src,gw,gh,chunks:[],grp:new THREE.Group(),shadow,ver:-1};const g=src.geometry,P=g.attributes.position.array;
  for(let v0=0;v0<gh-1;v0+=C)for(let u0=0;u0<gw-1;u0+=C){const nu=Math.min(C,gw-1-u0),nv=Math.min(C,gh-1-v0),ch={u0,v0,nu,nv,m:[],lv:-1,c:new THREE.Vector3()};
    for(const s of [1,2,4,8]){if(s>1&&(nu%s||nv%s))continue;const geo=new THREE.BufferGeometry();for(const k in g.attributes)geo.setAttribute(k,g.attributes[k]);
      const I=lodIndex(gw,u0,v0,nu,nv,s);geo.setIndex(new THREE.BufferAttribute(new Uint32Array(I),1));geo.boundingSphere=new THREE.Sphere();
      const m=new THREE.Mesh(geo,src.material);m.receiveShadow=src.receiveShadow;m.renderOrder=src.renderOrder;m.castShadow=false;m.visible=false;m.userData.step=s;ch.m.push(m);L.grp.add(m)}
    L.chunks.push(ch)}
  src.visible=false;scene.add(L.grp);lodSpheres(L);return L}
function lodSpheres(L){const g=L.src.geometry,P=g.attributes.position.array;
  for(const ch of L.chunks){let y0=1e9,y1=-1e9;for(let v=0;v<=ch.nv;v+=2)for(let u=0;u<=ch.nu;u+=2){const k=((ch.v0+v)*L.gw+ch.u0+u)*3+1;if(P[k]<y0)y0=P[k];if(P[k]>y1)y1=P[k]}
    const a=(ch.v0*L.gw+ch.u0)*3,b=((ch.v0+ch.nv)*L.gw+ch.u0+ch.nu)*3,cx=(P[a]+P[b])/2,cz=(P[a+2]+P[b+2])/2,r=Math.hypot(P[b]-P[a],P[b+2]-P[a+2],y1-y0)/2+.3;
    ch.c.set(cx,(y0+y1)/2,cz);ch.coast=typeof waterY!=='undefined'&&y0<waterY+.1&&y1>waterY-.4;for(const m of ch.m){m.geometry.boundingSphere.center.copy(ch.c);m.geometry.boundingSphere.radius=r}}}
function lodTick(L){const g=L.src.geometry,m0=L.chunks[0]&&L.chunks[0].m[0];if(!m0)return;
  /* the terrain may have gained or swapped an attribute (normals are made on the first layout) */
  if(m0.geometry.attributes.normal!==g.attributes.normal||m0.geometry.attributes.position!==g.attributes.position)for(const ch of L.chunks)for(const m of ch.m)for(const k in g.attributes)m.geometry.setAttribute(k,g.attributes[k]);
  L.grp.position.copy(L.src.position);
  const k=typeof PERF!=='undefined'&&perfOn()?Math.max(.55,PERF.lodK):1,T0=9*k,T1=18*k,T2=34*k,cp=cam.position,gy=L.grp.position.y;
  for(const ch of L.chunks){const d=Math.hypot(ch.c.x-cp.x,ch.c.y+gy-cp.y,ch.c.z-cp.z)-ch.m[0].geometry.boundingSphere.radius*.5;let lv=d<T0?0:d<T1?1:d<T2?2:3;if(ch.coast&&L.shadow)lv=Math.min(lv,1);lv=Math.min(lv,ch.m.length-1);/* coasts keep their detail: coarse triangles there pop the beach in and out */
    if(lv!==ch.lv){if(ch.lv>=0)ch.m[ch.lv].visible=false;ch.m[lv].visible=true;ch.lv=lv}
    ch.m[lv].castShadow=L.shadow&&lv<=1&&renderer.shadowMap.enabled}}
const TLOD={t:null,w:null,tv:-1};
function terrainLodTick(){if(settings.terrainLod===false){if(TLOD.t){TLOD.t.grp.visible=false;TLOD.t.src.visible=true}if(TLOD.w){TLOD.w.grp.visible=false;TLOD.w.src.visible=true}return}
  if(typeof terrainMesh==='undefined'||!terrainMesh||!terrainMesh.geometry.attributes.position)return;
  if(!TLOD.t||TLOD.t.src!==terrainMesh){if(TLOD.t){scene.remove(TLOD.t.grp);for(const ch of TLOD.t.chunks)for(const m of ch.m){m.geometry.setIndex(null);m.geometry.dispose()}}TLOD.t=makeLodGrid(terrainMesh,VW,VH,48,true);TLOD.tv=-1}
  if(waterMesh&&(!TLOD.w||TLOD.w.src!==waterMesh)){if(TLOD.w){scene.remove(TLOD.w.grp);for(const ch of TLOD.w.chunks)for(const m of ch.m){m.geometry.setIndex(null);m.geometry.dispose()}}TLOD.w=makeLodGrid(waterMesh,W*2+1,H*2+1,32,false)}
  TLOD.t.grp.visible=true;terrainMesh.visible=false;if(TLOD.w){TLOD.w.grp.visible=true;waterMesh.visible=false}
  if(TLOD.tv!==terrVer){TLOD.tv=terrVer;lodSpheres(TLOD.t);if(TLOD.w)lodSpheres(TLOD.w)}
  lodTick(TLOD.t);if(TLOD.w)lodTick(TLOD.w)}
{const _rf=renderFrame;renderFrame=function(){try{terrainLodTick()}catch(e){console.warn('terrain lod',e);settings.terrainLod=false}return _rf.apply(this,arguments)}}

/* ---------- send the graphics chip only what changed ----------
   Moving things (people, animals, vehicles, armies) rewrite their instance lists every frame. Left alone, the browser
   re-sends each whole buffer up to its maximum size, empty slots included: tens of megabytes a frame, which a laptop
   chip sharing memory with the processor cannot keep up with. Here each changed buffer is trimmed to the slots in use,
   and kinds of object with nothing to show are not drawn at all. */
const UPL={on:true};
function trimUploads(){if(!UPL.on||typeof KITS==='undefined')return;
  for(const n in KITS){const m=KITS[n].mesh,c=m.count;m.visible=c>0;if(!c)continue;
    const a=m.instanceMatrix;if(a.version!==a._lv){a._lv=a.version;if(a.updateRange.count===-1){a.updateRange.offset=0;a.updateRange.count=c*16}}
    const ic=m.instanceColor;if(ic&&ic.version!==ic._lv){ic._lv=ic.version;if(ic.updateRange.count===-1){ic.updateRange.offset=0;ic.updateRange.count=c*3}}
    const G=m.geometry.attributes;for(const k in G){const b=G[k];if(!b.isInstancedBufferAttribute||b.version===b._lv)continue;b._lv=b.version;if(b.updateRange.count===-1){b.updateRange.offset=0;b.updateRange.count=c*b.itemSize}}}}
{const _rf2=renderFrame;renderFrame=function(){try{trimUploads()}catch(e){UPL.on=false}return _rf2.apply(this,arguments)}}

/* ---------- on lighter detail levels, people, animals, carts and caravans move at half rate: they are slow, the eye does not notice, the processor does ---------- */
const HALF={n:0};
{const _rf3=renderFrame;renderFrame=function(){HALF.n++;return _rf3.apply(this,arguments)}}
document.addEventListener('DOMContentLoaded',()=>{for(const f of ['updateWalkers','updateCaravans','updateLife','updateLiving']){const o=window[f];if(typeof o!=='function')continue;let acc=0;
  window[f]=function(dt){if(perfOn()&&PERF.tier>=2&&(HALF.n&1)&&!(typeof camMoveT!=='undefined'&&performance.now()-camMoveT<200)){acc+=dt||0;return}const a=[...arguments];if(typeof a[0]==='number'){a[0]+=acc;acc=0}return o.apply(this,a)}}});
