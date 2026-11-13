"use strict";
/* Faithbound — renderer, sky, camera, terrain, water, borders */
const gl=$('#gl'),ov=$('#ov'),octx=ov.getContext('2d');
const renderer=new THREE.WebGLRenderer({canvas:gl,antialias:true,powerPreference:'high-performance'});
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
/* ---------- post: the scene renders to a float target, then one pass grades it into the chosen look ---------- */
/* shaders that write display colours directly convert them back to scene light when the post pass is on */
const PLU={uPL:{value:0},uPE:{value:1}};
const TOSCENE=`uniform float uPL,uPE;vec3 toScene(vec3 c){if(uPL<.5)return c;c=clamp(c,0.,.985);c=mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(.04045,c));
  vec3 a=2.51-2.43*c,b=.03-.59*c,k=-.14*c;return (-b+sqrt(b*b-4.*a*k))/(2.*a)/(uPE*.6);}`;
const POST={rt:null,size:new THREE.Vector2(),scene:new THREE.Scene(),cam:new THREE.OrthographicCamera(-1,1,1,-1,0,1),ok:true};
const postU={tCol:{value:null},tDep:{value:null},uRes:{value:new THREE.Vector2(1,1)},uNear:{value:.02},uFar:{value:900},uExp:{value:1},uTime:{value:0},
  uSat:{value:1},uCon:{value:1},uLift:{value:new THREE.Vector3()},uGain:{value:new THREE.Vector3(1,1,1)},uVig:{value:0},uTilt:{value:0},uLine:{value:0},
  uPoster:{value:0},uPaper:{value:0},uBloom:{value:0},uGrain:{value:0},uBars:{value:0},uPx:{value:1},uNoAA:{value:0},uPix:{value:0},uSplit:{value:0},
  uAO:{value:0},uP00:{value:1},uP11:{value:1},uCamW:{value:new THREE.Matrix4()},uWaterY:{value:0},uMist:{value:0},uMistCol:{value:new THREE.Color()}};
const postMat=new THREE.ShaderMaterial({uniforms:postU,depthTest:false,depthWrite:false,
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader:`precision highp float;varying vec2 vUv;uniform sampler2D tCol,tDep;uniform vec2 uRes;uniform float uPix,uSplit,uNoAA,uNear,uFar,uExp,uTime,uSat,uCon,uVig,uTilt,uLine,uPoster,uPaper,uBloom,uGrain,uBars,uPx,uAO,uP00,uP11,uWaterY,uMist;uniform vec3 uLift,uGain,uMistCol;uniform mat4 uCamW;
  float lin(float d){float z=d*2.-1.;return 2.*uNear*uFar/(uFar+uNear-z*(uFar-uNear));}
  float dep(vec2 uv){return lin(texture2D(tDep,uv).x);}
  vec3 aces(vec3 c){c*=uExp*.6;return clamp((c*(2.51*c+.03))/(c*(2.43*c+.59)+.14),0.,1.);}
  vec3 srgb(vec3 c){return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(.0031308,c));}
  float h21(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
  float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
  vec3 fetch(vec2 uv){return texture2D(tCol,uv).rgb;}
  /* light FXAA: soften only where luma jumps */
  vec3 fxaa(vec2 uv){vec2 px=1./uRes;vec3 c=fetch(uv);float l=dot(c,vec3(.299,.587,.114));
    float ln=dot(fetch(uv+vec2(0,px.y)),vec3(.299,.587,.114)),ls=dot(fetch(uv-vec2(0,px.y)),vec3(.299,.587,.114)),le=dot(fetch(uv+vec2(px.x,0)),vec3(.299,.587,.114)),lw=dot(fetch(uv-vec2(px.x,0)),vec3(.299,.587,.114));
    float mx=max(max(ln,ls),max(le,lw)),mn=min(min(ln,ls),min(le,lw));if(mx-mn<max(.04,mx*.15))return c;
    vec2 dir=normalize(vec2(-(ln-ls),(le-lw))+1e-5)*px;return (fetch(uv+dir*.5)+fetch(uv-dir*.5)+c*2.)*.25;}
  /* world position of a pixel, rebuilt from the depth buffer */
  vec3 wpos(vec2 uv,float d){vec3 v=vec3((uv.x*2.-1.)*d/uP00,(uv.y*2.-1.)*d/uP11,-d);return (uCamW*vec4(v,1.)).xyz;}
  void main(){vec2 uv=vUv,px=1./uRes;vec3 c=uNoAA>.5?fetch(uv):fxaa(uv);
    float d0=dep(uv);bool sky0=texture2D(tDep,uv).x>.9999;
    /* tilt-shift blur first, on the plain picture: blurring after the mist mixed misty and unmisted pixels, so the sharp middle strip ended in a hard light line */
    if(uTilt>0.){float b=uTilt*smoothstep(.08,.42,abs(uv.y-.5));if(b>.01){vec3 acc=c;float w=1.;for(int i=0;i<16;i++){float a=float(i)*2.39996,r=sqrt(float(i)+.5)/4.;vec2 o=vec2(cos(a),sin(a))*r*b*9.*uPx*px;acc+=fetch(uv+o);w+=1.;}c=acc/w;}}
    /* ambient occlusion: darken creases, the feet of walls and the gaps between houses and trees */
    if(uAO>0.&&!sky0){float occ=0.;float rad=clamp(.09*uRes.y*uP11*.5/d0,2.,40.);float rot=0.;
      /* pairs of opposite samples: a flat or sloping surface averages out, only real creases and corners darken (no halos around trees) */
      for(int i=0;i<6;i++){float fi=float(i),a=fi*2.39996+rot,r=sqrt((fi+.5)/6.)*rad;vec2 o=vec2(cos(a),sin(a))*r*px;
        float dA=dep(uv+o),dB=dep(uv-o),cr=d0-(dA+dB)*.5,far=max(abs(d0-dA),abs(d0-dB));
        occ+=smoothstep(.001*d0,.008*d0,cr)*(1.-smoothstep(.06*d0,.14*d0,far));}
      c*=1.-uAO*clamp(occ/6.*1.1,0.,.5);}
    /* low mist that pools over water and in the valleys, thicker far away */
    if(uMist>0.&&!sky0){vec3 wp=wpos(uv,d0);float above=max(0.,wp.y-uWaterY);float m=exp(-above*5.)*(1.-exp(-d0*.035))*uMist;c=mix(c,uMistCol*1.04,clamp(m,0.,.38));}
    if(uBloom>0.){vec3 bl=vec3(0);for(int i=0;i<12;i++){float a=float(i)*2.39996,r=sqrt(float(i)+.5)/3.5;vec3 s=fetch(uv+vec2(cos(a),sin(a))*r*22.*uPx*px);bl+=max(s-vec3(.9),0.);}c+=bl/12.*uBloom*1.6;}
    vec3 col=srgb(aces(c));
    float lum=dot(col,vec3(.299,.587,.114));
    if(uPoster>0.){float q=floor(lum*uPoster+.5)/uPoster;col*=mix(1.,q/max(lum,.02),.7);lum=dot(col,vec3(.299,.587,.114));}
    col=mix(vec3(lum),col,uSat);col=(col-.5)*uCon+.5;col=col*uGain+uLift*(1.-col);
    /* daylight split toning: shade takes the cool blue of the open sky, sunlit ground the warmth of the sun */
    if(uSplit>0.){float l2=dot(col,vec3(.299,.587,.114));col+=uSplit*mix(vec3(-.018,-.004,.03),vec3(.028,.012,-.02),smoothstep(.15,.75,l2));}
    if(uLine>0.){float e=0.;vec2 o=uPix>0.?px:px*uPx*1.2;float dn=dep(uv+vec2(0,o.y)),ds=dep(uv-vec2(0,o.y)),de=dep(uv+vec2(o.x,0)),dw=dep(uv-vec2(o.x,0));
      e=max(max(abs(dn-d0),abs(ds-d0)),max(abs(de-d0),abs(dw-d0)))/d0;float ink=smoothstep(.025,.06,e)*(1.-smoothstep(150.,400.,d0));
      vec3 cn=fetch(uv+vec2(0,o.y)),ce=fetch(uv+vec2(o.x,0));float ce2=length(cn-fetch(uv))+length(ce-fetch(uv));if(uPix<=0.)ink=max(ink,smoothstep(.35,.7,ce2)*.6);/* in pixel art only the outlines of things, not the grain of sand and water */
      /* leaves get only a faint outline: inked edges around every leaf clump made crowns look like piles of hexagons */
      vec3 c0=fetch(uv);ink*=1.-.75*smoothstep(.02,.1,c0.g-max(c0.r,c0.b));
      col=mix(col,uPaper>0.?vec3(.23,.15,.08):col*.25,clamp(ink*uLine,0.,.85));}
    if(uPaper>0.){float fib=vn(uv*uRes/3.)*.5+vn(uv*uRes/11.)*.3+vn(uv*vec2(6,9))*.6;vec3 paper=vec3(.92,.85,.69)*(.9+fib*.12);vec3 ink=vec3(.32,.22,.12);
      float l2=dot(col,vec3(.299,.587,.114));vec3 tone=mix(ink,paper,smoothstep(.05,.95,l2));
      float sky=step(.999,texture2D(tDep,uv).x);col=mix(tone,paper,sky);
      float edge=length((uv-.5)*vec2(1.,.8));col*=1.-smoothstep(.45,.85,edge)*.45;col=mix(col,col*vec3(1.,.93,.82),.3);}
    float v=length((uv-.5)*vec2(uRes.x/uRes.y,1.)*.85);col*=1.-uVig*smoothstep(.35,1.05,v);
    col+=(h21(uv*uRes+fract(uTime)*91.)-.5)*uGrain;
    /* pixel art: a limited palette with a soft ordered dither (a 4x4 Bayer pattern in the big pixels), so gradients become calm bands of pixels */
    if(uPix>0.){vec2 fc=floor(gl_FragCoord.xy);vec2 a2=floor(fc*.5);float b2=fract(dot(a2,vec2(.5,a2.y*.75))),b1=fract(dot(fc,vec2(.5,fc.y*.75))),bay=b2*.25+b1;
      float L=uPix;col=floor(col*L+.5+(bay-.5)*.55)/L;}
    if(uBars>0.&&(uv.y<uBars||uv.y>1.-uBars))col=vec3(0);
    gl_FragColor=vec4(clamp(col,0.,1.),1.);}`});
POST.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),postMat));
function postActive(){return POST.ok&&settings.post!==false&&!!LK.post}
let shadowAt=0,shadowSig='';
/* shadows are drawn again only when the view or the sun has really moved: the camera at most 30 times a second, the slow sun 4 times a second */
let shadowSun=-1;
function shadowTick(){if(!renderer.shadowMap.enabled)return;renderer.shadowMap.autoUpdate=false;const now=performance.now(),
    sig=(camT.x*20|0)+','+(camT.z*20|0)+','+(camDist*10|0),moved=sig!==shadowSig,sun=(dayT*400|0),sunMoved=sun!==shadowSun,
    gap=moved?(settings.power==='saver'?66:settings.power==='max'?16:33):sunMoved?(settings.power==='saver'?500:250):(playing?1000:3000);
  if(now-shadowAt>gap||shadowForce||(shadowSoft&&now-shadowAt>(settings.power==='max'?33:settings.power==='saver'?250:100))){shadowAt=now;shadowSig=sig;shadowSun=sun;shadowForce=false;shadowSoft=false;renderer.shadowMap.needsUpdate=true}}
let shadowForce=true,shadowSoft=false;
/* (camera snapping to whole pixels made the view shake while it eased, so it is off) */
const PXS={r:new THREE.Vector3(),u:new THREE.Vector3(),d:new THREE.Vector3()};
function pixSnap(on){if(!on){if(PXS.on){cam.position.sub(PXS.d);cam.updateMatrixWorld();PXS.on=false}return}
  const hpx=renderer.domElement.height||1,ws=2*camDist*Math.tan(cam.fov*Math.PI/360)/hpx;cam.updateMatrixWorld();
  PXS.r.setFromMatrixColumn(cam.matrixWorld,0);PXS.u.setFromMatrixColumn(cam.matrixWorld,1);
  const a=cam.position.dot(PXS.r),b=cam.position.dot(PXS.u),da=Math.round(a/ws)*ws-a,db=Math.round(b/ws)*ws-b;
  PXS.d.copy(PXS.r).multiplyScalar(da).addScaledVector(PXS.u,db);cam.position.add(PXS.d);cam.updateMatrixWorld();PXS.on=true}
function renderFrame(){renderFrame0()}
function renderFrame0(){/* the near clipping plane follows the zoom: zoomed out, depth precision stays fine enough that shore sand and water do not flicker */
  {const nr=clamp(camDist*.012,.02,2.5);if(Math.abs(cam.near-nr)>nr*.05){cam.near=nr;cam.updateProjectionMatrix()}}if(typeof cullTick==='function'&&settings.cull!==false)cullTick();shadowTick();pixTick();
  if(!postActive()){PLU.uPL.value=0;renderer.render(scene,cam);return}
  renderer.getDrawingBufferSize(POST.size);const w=POST.size.x,h=POST.size.y;
  if(!POST.rt||POST.rt.width!==w||POST.rt.height!==h){if(POST.rt){POST.rt.depthTexture.dispose();POST.rt.dispose()}
    const flt=renderer.capabilities.isWebGL2&&(renderer.extensions.has('EXT_color_buffer_float')||renderer.extensions.has('EXT_color_buffer_half_float'));
    POST.rt=new THREE.WebGLRenderTarget(w,h,{type:flt?THREE.HalfFloatType:THREE.UnsignedByteType,depthBuffer:true});POST.rt.depthTexture=new THREE.DepthTexture(w,h);POST.rt.depthTexture.type=THREE.UnsignedIntType;
    POST.flt=flt}
  const P=LK.post;
  postU.tCol.value=POST.rt.texture;postU.tDep.value=POST.rt.depthTexture;postU.uRes.value.set(w,h);postU.uNear.value=cam.near;postU.uFar.value=cam.far;
  postU.uExp.value=renderer.toneMappingExposure*(POST.flt?1:.8);postU.uTime.value=performance.now()/1000;postU.uPx.value=renderer.getPixelRatio();
  /* in pixel art the picture has a quarter of the pixels, so ambient occlusion costs little there and grounds houses and trees */
  postU.uAO.value=settings.quality==='low'?0:(P.ao||(pixN?(P.pixAO||0)*(1-smooth(4.5,11,camDist)):0));/* fades out as you zoom out, where it would only muddy whole towns */postU.uSplit.value=P.split||0;postU.uP00.value=cam.projectionMatrix.elements[0];postU.uP11.value=cam.projectionMatrix.elements[5];postU.uCamW.value.copy(cam.matrixWorld);
  postU.uWaterY.value=waterY;postU.uMist.value=(P.mist??.5)*(1-.7*smooth(.02,.3,Math.sin(dayT*6.283)-.1)+.2*(typeof weatherDim!=='undefined'?weatherDim:0));postU.uMistCol.value.copy(scene.fog.color);
  postU.uSat.value=P.sat*(pixN&&P.pixSat?P.pixSat:1);postU.uCon.value=P.con*(pixN&&P.pixCon?P.pixCon:1);postU.uLift.value.fromArray(P.lift||[0,0,0]);postU.uGain.value.fromArray(P.gain||[1,1,1]);postU.uVig.value=P.vig||0;
  postU.uTilt.value=(P.tilt||0)*(P.tiltFar?smooth(9,34,camDist):1-smooth(20,60,camDist));postU.uNoAA.value=pixN?1:0;postU.uPix.value=pixN?(P.pixL||18):0;postU.uLine.value=P.line||(pixN?(P.pixLine==null?.5:P.pixLine):0);postU.uPoster.value=P.poster||0;postU.uPaper.value=P.paper||0;postU.uBloom.value=POST.flt?(P.bloom||0):0;postU.uGrain.value=P.grain||0;postU.uBars.value=P.bars||0;
  PLU.uPL.value=1;PLU.uPE.value=postU.uExp.value;renderer.setRenderTarget(POST.rt);renderer.render(scene,cam);renderer.setRenderTarget(null);
  try{renderer.render(POST.scene,POST.cam)}catch(e){POST.ok=false;throw e}}
renderer.toneMappingExposure=1;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
const cam=new THREE.PerspectiveCamera(38,1,.02,900);
const hemi=new THREE.HemisphereLight(0xcfe3ff,0x4a4636,.9);scene.add(hemi);
const sunL=new THREE.DirectionalLight(0xfff1dd,2.4);sunL.castShadow=true;scene.add(sunL);scene.add(sunL.target);
sunL.shadow.bias=-.0004;sunL.shadow.normalBias=.025;sunL.shadow.camera.near=1;sunL.shadow.camera.far=400;
const tmpC=new THREE.Color(),tmpC2=new THREE.Color(),dummy=new THREE.Object3D(),V3=new THREE.Vector3();
const colL=hex=>new THREE.Color(hex).convertSRGBToLinear();
const BASE=-2.2,HS=6,SEA0=.44,R=3;let terrVer=0,terrBase=0,terrBio=0;/* terrVer: any change to the ground; terrBase: the land itself changed, not just the flattening under a growing town */

function applyGraphics(){
  const sz=settings.quality==='high'?(settings.power==='max'?4096:2048):settings.quality==='medium'?2048:1024;
  if(sunL.shadow.map){sunL.shadow.map.dispose();sunL.shadow.map=null}
  sunL.shadow.mapSize.set(sz,sz);renderer.shadowMap.enabled=settings.shadows;sunL.castShadow=settings.shadows;
  scene.traverse(o=>{if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true)}});
  resize();
}

/* ---------- sky ---------- */
const skyU={top:{value:new THREE.Color()},hor:{value:new THREE.Color()},gnd:{value:new THREE.Color(0x3a3a34)},sunDir:{value:new THREE.Vector3(0,1,0)},sunCol:{value:new THREE.Color(1,1,1)},stars:{value:0},uLinear:{value:0},uPL:PLU.uPL,uPE:PLU.uPE};
const skyMat=new THREE.ShaderMaterial({uniforms:skyU,side:THREE.BackSide,depthWrite:false,fog:false,
  vertexShader:`varying vec3 vDir;void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:TOSCENE+`uniform vec3 top,hor,gnd,sunCol,sunDir;uniform float stars,uLinear;varying vec3 vDir;
  void main(){vec3 d=normalize(vDir);float y=d.y;vec3 c=y>0.?mix(hor,top,pow(clamp(y,0.,1.),.55)):mix(hor,gnd,clamp(-y*4.,0.,1.));
  float s=max(dot(d,normalize(sunDir)),0.);c+=sunCol*(pow(s,900.)*3.+pow(s,10.)*.22);
  if(stars>0.01&&y>0.){vec3 p=floor(d*220.);float r=fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);c+=vec3(step(.9975,r))*stars*clamp(y*4.,0.,1.);}
  if(uLinear>.5)c=pow(c,vec3(2.2));else c=toScene(c);gl_FragColor=vec4(c,1.);}`});
const sky=new THREE.Mesh(new THREE.SphereGeometry(700,32,16),skyMat);sky.renderOrder=-1;scene.add(sky);
const pmrem=new THREE.PMREMGenerator(renderer);let envRT=null,lastEnv=-1e9,envKey='';const envCan=document.createElement('canvas');envCan.width=128;envCan.height=64;
function refreshEnv(){const x=envCan.getContext('2d'),g=x.createLinearGradient(0,0,0,64),hx=c=>'#'+c.getHexString();
  g.addColorStop(0,hx(skyU.top.value));g.addColorStop(.5,hx(skyU.hor.value));g.addColorStop(.56,hx(skyU.gnd.value));g.addColorStop(1,'#1d2620');x.fillStyle=g;x.fillRect(0,0,128,64);
  const t=new THREE.CanvasTexture(envCan);t.mapping=THREE.EquirectangularReflectionMapping;t.encoding=THREE.sRGBEncoding;
  const rt=pmrem.fromEquirectangular(t);t.dispose();if(envRT)envRT.dispose();envRT=rt;scene.environment=rt.texture}
scene.fog=new THREE.Fog(0xcfe3ee,60,240);

const V3b=new THREE.Vector3(),V3c=new THREE.Vector3(),V3d=new THREE.Vector3(),SNAPT=new THREE.Vector3();
let dayT=.22,nightF=0;const DAYLEN=200;
const C_NTOP=new THREE.Color(0x070d22),C_NHOR=new THREE.Color(0x1a2850),C_DTOP=new THREE.Color(0x4a5688),C_DHOR=new THREE.Color(0xf09a5c),C_MOON=new THREE.Color(0x8ea4ff),C_DUSKSUN=new THREE.Color(0xff9a58);
function updateSky(dt,now){
  if(LK.lock>=0)dayT=LK.lock;else if(settings.daynight&&playing)dayT=(dayT+dt/DAYLEN)%1;else if(!settings.daynight)dayT=.22;
  const a=dayT*Math.PI*2,el=Math.sin(a),az=Math.cos(a);
  const day=smooth(-.1,.25,el),dusk=clamp(1-Math.abs(el)/.32,0,1);
  nightF=1-smooth(-.06,.14,el);
  const top=tmpC.set(LK.skyTop).lerp(C_DTOP,dusk*.55),hor=tmpC2.set(LK.skyHor).lerp(C_DHOR,dusk*.75);
  skyU.top.value.copy(C_NTOP).lerp(top,day);skyU.hor.value.copy(C_NHOR).lerp(hor,day);
  skyU.gnd.value.copy(skyU.hor.value).lerp(tmpC.set(0x2a4a5e),.35);
  skyU.sunDir.value.set(az,el,.32).normalize();skyU.sunCol.value.set(LK.sun).lerp(C_DUSKSUN,dusk).multiplyScalar(day);
  skyU.stars.value=1-day;
  const ld=el>0?V3.set(az,Math.max(el,.06),.32):V3.set(-az,Math.max(-el,.06),.32);ld.normalize();
  {/* keep shadows steady while the camera moves: snap the shadow box to whole shadow-map texels in the light's own frame */
    const sc0=sunL.shadow.camera,tx=(sc0.right-sc0.left)/Math.max(1,sunL.shadow.mapSize.x);const fw=V3b.copy(ld).negate(),rt=V3c.crossVectors(fw,V3d.set(0,1,0)).normalize(),up=V3d.crossVectors(rt,fw).normalize();
    const pr=camT.dot(rt),pu=camT.dot(up),pf=camT.dot(fw),sr=Math.round(pr/tx)*tx,su=Math.round(pu/tx)*tx;SNAPT.copy(rt).multiplyScalar(sr).addScaledVector(up,su).addScaledVector(fw,pf);
    sunL.position.copy(SNAPT).addScaledVector(ld,150);sunL.target.position.copy(SNAPT)}
  if(el>0){sunL.color.set(LK.sun).lerp(C_DUSKSUN,1-smooth(.02,.35,el));sunL.intensity=LK.sunI*smooth(0,.12,el)}
  else{sunL.color.copy(C_MOON);sunL.intensity=1.1*smooth(0,.15,-el)}/* a soft moonlit night: the village stays visible round its lit windows */
  hemi.intensity=LK.hemiI*(.55+.45*day)*(1-.35*weatherDim)+flashT*9;sunL.intensity*=1-.7*weatherDim;
  if(flashT>0)flashT=Math.max(0,flashT-dt);hemi.color.copy(skyU.top.value).lerp(new THREE.Color(1,1,1),.4);
  renderer.toneMappingExposure=LK.exposure*(.9+.1*day);
  if(weatherDim>0){const g=tmpC.setRGB(.42,.45,.5);skyU.top.value.lerp(g,weatherDim*.7);skyU.hor.value.lerp(g,weatherDim*.6);skyU.sunCol.value.multiplyScalar(1-weatherDim)}
  {const ec=typeof eclipseAmt==='function'?eclipseAmt():0;if(ec>0){sunL.intensity*=1-ec;hemi.intensity*=1-ec*.75;skyU.top.value.multiplyScalar(1-ec*.8);skyU.hor.value.lerp(tmpC.setRGB(.35,.22,.18),ec*.7);skyU.sunCol.value.multiplyScalar(1-ec);skyU.stars.value=Math.max(skyU.stars.value,ec)}}
  scene.fog.color.copy(skyU.hor.value).convertSRGBToLinear();
  const fd=camDist*LK.fog;scene.fog.near=camDist*.9+18/LK.fog;scene.fog.far=(camDist*2.4+120/LK.fog+fd*.2)*(1-.55*weatherDim);scene.fog.near*=1-.6*weatherDim;
  sky.position.copy(cam.position);
  /* the sky reflection (water, glass, metal) is rebuilt only when the sky's colours have visibly changed: a rebuild is some twenty passes on the graphics card and a new texture */
  if(now-lastEnv>4000){lastEnv=now;const q=c=>((c.r*48)|0)+'.'+((c.g*48)|0)+'.'+((c.b*48)|0),key=q(skyU.top.value)+'/'+q(skyU.hor.value)+'/'+q(skyU.gnd.value);if(key!==envKey||!envRT){envKey=key;refreshEnv()}}
  if(typeof setNight==='function')setNight(nightF);
  /* shadow box follows the view */
  const s=clamp(camDist*.75,6,Math.max(W,H)*.75),sc=sunL.shadow.camera;
  if(Math.abs(sc.right-s)>.5){sc.left=-s;sc.right=s;sc.top=s;sc.bottom=-s;sc.updateProjectionMatrix()}
}

/* ---------- camera ---------- */
const camT=new THREE.Vector3();let camDist=60,camDistT=60,camYaw=.7,camYawT=.7;
const camPitch=()=>lerp(.46,1.02,Math.pow(clamp((camDist-.42)/(130-.42),0,1),.55));
function camLimits(){return{min:.55,max:Math.max(W,H)*1.35}}
function placeCamera(dt){
  const k=Math.min(1,dt*9);camDist=lerp(camDist,camDistT,k);camYaw=lerp(camYaw,camYawT,k);
  const gy=Math.max(groundY(camT.x,camT.z),waterY);camT.y=lerp(camT.y,gy,Math.min(1,dt*5));
  const p=camPitch();
  cam.position.set(camT.x+Math.sin(camYaw)*Math.cos(p)*camDist,camT.y+Math.sin(p)*camDist,camT.z+Math.cos(camYaw)*Math.cos(p)*camDist);
  const floor=Math.max(groundY(cam.position.x,cam.position.z),waterY)+.1;if(cam.position.y<floor)cam.position.y=floor;
  cam.lookAt(camT);
}
function panBy(dx,dy){
  const k=2*camDist*Math.tan(cam.fov*Math.PI/360)/innerHeight,p=camPitch();
  const rx=Math.cos(camYaw),rz=-Math.sin(camYaw),fx=-Math.sin(camYaw),fz=-Math.cos(camYaw);
  camT.x-=rx*dx*k;camT.z-=rz*dx*k;camT.x+=fx*dy*k/Math.sin(p);camT.z+=fz*dy*k/Math.sin(p);
  camT.x=clamp(camT.x,-W/2,W/2);camT.z=clamp(camT.z,-H/2,H/2);
}
function zoomBy(f){const L=camLimits();camDistT=clamp(camDistT*f,L.min,L.max)}
function focusOn(x,z,dist){camT.x=x;camT.z=z;if(dist)camDistT=dist}
/* pixel looks: the scene is drawn at a lower resolution and the browser scales it up with hard edges. Like a sprite game, the pixels grow as
   the camera comes closer (whole device pixels each, so every pixel is the same size); far out it is close to full detail. It is also much cheaper to draw. */
let pixN=0,pixWant=0,pixSince=0;
/* the painted look: soft pixels of a fixed size (about two screen pixels) at every zoom, so it never jumps between sharp and blocky */
/* cozy pixel art: the scene is drawn at a lower resolution and enlarged with crisp square pixels, the same size at every zoom
   (Settings > Pixel art: Cozy is two screen pixels per pixel, Chunky three, Retro four; Off draws smooth at LK.soft). It is also the cheapest way to draw:
   at two pixels the graphics card colours a quarter as many. On sharp screens the pixel keeps its size on screen, not in device pixels. */
const PIX_SIZES=[['off','Off'],[2,'Cozy'],[3,'Chunky'],[4,'Retro']];
function pixSize(){const v=settings.pixelSize;return v==null?2:v==='off'?0:+v||0}
function pixTarget(){if(!LK.pixel)return 0;const ps=pixSize();if(!ps)return 0;return Math.max(2,Math.round(ps*(devicePixelRatio||1)))}
function pixTick(){const t=pixTarget(),now=performance.now();if(t===pixN){pixWant=t;return}
  if(t!==pixWant){pixWant=t;pixSince=now;return}if(now-pixSince>40)resize()}
function resize(){const w=innerWidth,hh=innerHeight,dpr=Math.min(settings.power==='saver'?1:settings.power==='max'?(settings.quality==='high'?2:1.5):1.25,devicePixelRatio||1);
  pixN=pixTarget();pixWant=pixN;gl.style.imageRendering=pixN?'pixelated':'';
  renderer.setPixelRatio(pixN?(devicePixelRatio||1)/pixN:(settings.quality==='low'?Math.min(1,dpr):dpr)*(typeof dynScale==='number'?dynScale:1)*(LK.soft||1));renderer.setSize(w,hh,false);
  ov.width=Math.round(w*Math.min(2,devicePixelRatio||1));ov.height=Math.round(hh*Math.min(2,devicePixelRatio||1));
  cam.aspect=w/hh;cam.fov=w<hh?52:38;cam.updateProjectionMatrix()}

/* ---------- terrain ---------- */
let VW,VH,VY,detail,terrainMesh=null,skirtMesh=null,waterMesh=null,waterSide=null,waterY=0;
/* ---------- tides: the sea rises and falls twice a day, higher at spring tides and lower at neap tides about once a week.
   waterY stays the mean level (towns, harbours and the land are laid out against it); TIDE is how far the sea stands above it now. */
let TIDE=0,tideT=.1;const TIDE_A=.0095,TIDEU={uTide:{value:0},uSeaY:{value:0}};
const seaNow=()=>waterY+TIDE;
/* the height of the sea surface at (x,z) right now, exactly as the water shader draws it: the tide plus the swell, which
   fades out over the shallows. The shader moves the vertices of a half-tile grid, so sample the swell at the four grid
   corners around the point and blend, the way the triangles in between do. Anything afloat sits on this. */
function swellV(px,pz,t){let d=clamp((waterY-groundY(px,pz))*2,0,1);if(d>0&&biome[clamp(Math.floor(pz+H/2),0,H-1)*W+clamp(Math.floor(px+W/2),0,W-1)]===2)d*=1-iceEdge(px,pz);return d>0?(Math.sin(px*1.7+t*1.1)*.03+Math.cos(pz*1.4+t*1.35)*.026)*d:0}
function seaY(x,z){const t=waterU.uTime.value,fx=(x+W/2)*2,fz=(z+H/2)*2,i=Math.floor(fx),j=Math.floor(fz),u=fx-i,v=fz-j,X0=i/2-W/2,Z0=j/2-H/2,X1=X0+.5,Z1=Z0+.5;
  const a=swellV(X0,Z0,t),b=swellV(X1,Z0,t),c=swellV(X0,Z1,t),d=swellV(X1,Z1,t);return waterY+TIDE+(a+(b-a)*u)*(1-v)+(c+(d-c)*u)*v}
/* ships riding at anchor (the pirate coves) bob on it too */
function rideAnchored(){if(typeof coveShips==='undefined')return;for(const g of coveShips){const p=g.position;p.y=seaY(p.x,p.z)}}
function tideRange(){return TIDE_A*(.72+.28*Math.cos(tideT/7.4*6.283))}
function tideTick(dt){if(typeof playing!=='undefined'&&playing&&!(typeof speedIdx!=='undefined'&&speedIdx===0))tideT+=dt/DAYLEN;
  const want=settings.tides!==false?tideRange()*Math.sin(tideT*1.93*6.283):0;TIDE+=(want-TIDE)*Math.min(1,dt*2);
  TIDEU.uTide.value=TIDE;TIDEU.uSeaY.value=waterY;if(typeof terrU!=='undefined'){terrU.uTide.value=TIDE;terrU.uTideA.value=settings.tides!==false?tideRange():0}
  if(waterMesh){waterMesh.position.y=waterY+TIDE;if(typeof ocean!=='undefined'&&ocean)ocean.position.y=waterY+TIDE;if(waterSide)waterSide.scale.y=Math.max(.01,waterY+TIDE-BASE-.03)}rideAnchored()}
function tideWord(){if(settings.tides===false)return '';const r=tideRange(),f=TIDE/Math.max(1e-4,r),rising=Math.cos(tideT*1.93*6.283)>0,spring=Math.cos(tideT/7.4*6.283)>.6?'spring ':Math.cos(tideT/7.4*6.283)<-.6?'neap ':'';
  return f>.8?`High ${spring}tide`:f<-.8?`Low ${spring}tide`:rising?'Tide rising':'Tide falling'}
const shapeH=v=>{const d=v-SEA0;return d>=0?SEA0*HS+d*HS*(.5+d*2.9+Math.max(0,d-.32)*2.4):SEA0*HS+d*HS*1.4};
/* towns flatten the ground they stand on, like a real settlement on a terrace */
let flatSpots=[],flatSig='',tslope=new Float32Array(1);
function cityRadius(n,cap){return (cap?.62:.42)+Math.min(.9,Math.floor(cityLevel(n))*.05)}
function citySig(){let s='';for(const n of nations)if(n.alive)n.cities.forEach((c,ci)=>{s+=c.x+','+c.y+','+(cityRadius(n,ci===0)*100|0)+';'});return s}
function sampleH(tx,ty){tx=clamp(tx,0,W-1);ty=clamp(ty,0,H-1);const x0=Math.floor(tx),y0=Math.floor(ty),x1=Math.min(x0+1,W-1),y1=Math.min(y0+1,H-1),fx=tx-x0,fy=ty-y0;
  return lerp(lerp(h[y0*W+x0],h[y0*W+x1],fx),lerp(h[y1*W+x0],h[y1*W+x1],fx),fy)}
function groundY(x,z){if(!VY)return 0;let u=(x+W/2)*R,v=(z+H/2)*R;u=clamp(u,0,VW-1.001);v=clamp(v,0,VH-1.001);
  const u0=u|0,v0=v|0,fu=u-u0,fv=v-v0,k=v0*VW+u0;
  return lerp(lerp(VY[k],VY[k+1],fu),lerp(VY[k+VW],VY[k+VW+1],fu),fv)}
const surfY=(x,z)=>Math.max(groundY(x,z),waterY);

/* ---------- detail textures, made once at start: grass, soil, rock and sand for the land, ripples for the sea ---------- */
function tileNoise(S,seed){const g=new Float32Array(S*S);let a=seed>>>0;for(let i=0;i<S*S;i++){a=(a*1664525+1013904223)>>>0;g[i]=a/4294967296}
  return (x,y)=>{x=((x%S)+S)%S;y=((y%S)+S)%S;const x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0,x1=(x0+1)%S,y1=(y0+1)%S,ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy);
    const a_=g[y0*S+x0],b=g[y0*S+x1],c=g[y1*S+x0],d=g[y1*S+x1];return a_+(b-a_)*ux+(c-a_)*uy+(a_-b-c+d)*ux*uy}}
function makeDetailTex(){const R=512,d=new Uint8Array(R*R*4);
  const n8=tileNoise(8,11),n16=tileNoise(16,23),n32=tileNoise(32,37),n64=tileNoise(64,41),n128=tileNoise(128,53),n256=tileNoise(256,67),w16=tileNoise(16,71);
  for(let y=0;y<R;y++)for(let x=0;x<R;x++){const u=x/R,v=y/R,q=(y*R+x)*4;
    const cl=n8(u*8,v*8)*.35+n32(u*32,v*32)*.3,bl=n128(u*128,v*32)*.5+n256(u*64,v*256)*.5;const gr=cl+bl*.35+n64(u*64,v*64)*.15;
    const crumb=n64(u*64,v*64)*.5+n128(u*128,v*128)*.3+n256(u*256,v*256)*.2,peb=n128(u*128+3.1,v*128+7.7);const so=crumb*.8+(peb>.78?.35:0)-(peb<.12?.15:0);
    const r1=1-Math.abs(2*n16(u*16,v*16)-1),r2=1-Math.abs(2*n32(u*32+5,v*32+2)-1),st=Math.sin((v+n8(u*8,v*8)*.12)*Math.PI*2*24)*.5+.5;const ro=Math.pow(r1,5)*.45+Math.pow(r2,7)*.3+st*.15+n128(u*128,v*128)*.2;
    const wv=w16(u*16,v*16),rp=Math.sin((u*40+wv*2.2+n32(u*32,v*32)*.6)*Math.PI*2)*.5+.5;const sa=rp*.6+n256(u*256,v*256)*.4;
    d[q]=Math.min(255,gr*230)|0;d[q+1]=Math.max(0,Math.min(255,so*230))|0;d[q+2]=Math.min(255,ro*255)|0;d[q+3]=Math.min(255,sa*255)|0}
  const t=new THREE.DataTexture(d,R,R,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=8;t.needsUpdate=true;return t}
function makeWaveTex(){const R=256,d=new Uint8Array(R*R*4),hgt=new Float32Array(R*R);const a=tileNoise(8,91),b=tileNoise(16,97),c=tileNoise(32,101),e=tileNoise(64,103);
  for(let y=0;y<R;y++)for(let x=0;x<R;x++){const u=x/R,v=y/R;hgt[y*R+x]=a(u*8,v*8)*.45+b(u*16,v*16)*.28+c(u*32,v*32)*.17+e(u*64,v*64)*.1}
  for(let y=0;y<R;y++)for(let x=0;x<R;x++){const H_=(X,Y)=>hgt[((Y+R)%R)*R+((X+R)%R)];const dx=(H_(x+1,y)-H_(x-1,y))*R*.06,dy=(H_(x,y+1)-H_(x,y-1))*R*.06;
    const l=Math.hypot(dx,dy,1),q=(y*R+x)*4;d[q]=((-dx/l)*.5+.5)*255;d[q+1]=((-dy/l)*.5+.5)*255;d[q+2]=(1/l*.5+.5)*255;d[q+3]=hgt[y*R+x]*255}
  const t=new THREE.DataTexture(d,R,R,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=4;t.needsUpdate=true;return t}
const WAVE_TEX=makeWaveTex();
const terrainMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95,metalness:0});
const NOISE_GLSL=`varying vec3 vWP;float hn(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hn(i),hn(i+vec2(1,0)),f.x),mix(hn(i+vec2(0,1)),hn(i+vec2(1,1)),f.x),f.y);}`;
/* ---------- weather on the land: where rain fell lately (dark, shiny ground) and where snow lies, one value per tile.
   The simulation fills it (disasters.js); the ground, the buildings and the trees all read the same small texture. */
const WXU={uWx:{value:null},uWxM:{value:new THREE.Vector2(1,1)}};
const WXG={wet:null,snow:null,rain:null,tex:null,dirty:false,up:0,acc:0};
function wxEnsure(){if(WXG.wet&&WXG.wet.length===N&&WXG.tex&&WXG.tex.image.width===W)return;
  WXG.wet=new Float32Array(N);WXG.snow=new Float32Array(N);WXG.rain=new Float32Array(N);WXG.anom=new Float32Array(N);
  if(WXG.tex)WXG.tex.dispose();WXG.tex=new THREE.DataTexture(new Uint8Array(N*4),W,H,THREE.RGBAFormat);WXG.tex.magFilter=WXG.tex.minFilter=THREE.LinearFilter;WXG.tex.needsUpdate=true;
  WXU.uWx.value=WXG.tex;WXU.uWxM.value.set(W,H)}
function wxUpload(){if(!WXG.tex)return;const d=WXG.tex.image.data,w=WXG.wet,s=WXG.snow;const a=WXG.anom;for(let i=0;i<N;i++){d[i*4]=Math.min(255,w[i]*255)|0;d[i*4+1]=Math.min(255,s[i]*255)|0;d[i*4+2]=clamp((a[i]+1)*127.5,0,255)|0}WXG.tex.needsUpdate=true;WXG.dirty=false}
/* any lit material can show it: snow settles on surfaces facing up, rain darkens and wets them */
function weatherHook(m){if(!m||!m.isMeshStandardMaterial||m._wx)return;m._wx=true;const prev=m.onBeforeCompile,pk=m.customProgramCacheKey();
  m.onBeforeCompile=function(sh,r){if(prev)prev.call(this,sh,r);sh.uniforms.uWx=WXU.uWx;sh.uniforms.uWxM=WXU.uWxM;
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWxP,vWxN;').replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
  {vec4 wp=vec4(transformed,1.);vec3 wn=objectNormal;
  #ifdef USE_INSTANCING
  wp=instanceMatrix*wp;wn=mat3(instanceMatrix)*wn;
  #endif
  vWxP=(modelMatrix*wp).xyz;vWxN=normalize(mat3(modelMatrix)*wn);}`);
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D uWx;uniform vec2 uWxM;varying vec3 vWxP,vWxN;').replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
  {vec4 wx=texture2D(uWx,(vWxP.xz+uWxM*.5)/uWxM);float up=smoothstep(.12,.55,vWxN.y);float sn=smoothstep(.12,.5,wx.g)*up;float wt=smoothstep(.08,.6,wx.r)*(1.-sn);
   diffuseColor.rgb=mix(diffuseColor.rgb*(1.-.22*wt),vec3(.9,.92,.96),sn*.86);roughnessFactor=mix(roughnessFactor,.3,wt*.7*up);}`)};
  m.customProgramCacheKey=()=>'wx|'+pk;m.needsUpdate=true}
const terrU={uWx:WXU.uWx,uTide:{value:0},uTideA:{value:0},uHam:{value:0},uLite:{value:0},uWaterY:{value:0},uSnow:{value:0},uAutumn:{value:0},uHalfH:{value:30},uOwn:{value:null},uWar:{value:null},uMap:{value:new THREE.Vector2(1,1)},uTint:{value:0},uTime:{value:0},uPhoto:{value:0},
  tG:{value:null},tD:{value:null},tS:{value:null},tR:{value:null},tW:{value:null},nG:{value:null},nR:{value:null},
  mG:{value:new THREE.Vector3(.57,.53,.36)},mD:{value:new THREE.Vector3(.5,.41,.35)},mS:{value:new THREE.Vector3(.62,.54,.51)},mR:{value:new THREE.Vector3(.43,.36,.2)},mW:{value:new THREE.Vector3(.53,.53,.58)}};
/* photo-scanned ground (Poly Haven, CC0): grass, earth, sand, rock and snow, with normal maps for grass and rock */
{const ph=new THREE.DataTexture(new Uint8Array([128,128,128,255]),1,1,THREE.RGBAFormat);ph.needsUpdate=true;const nf=new THREE.DataTexture(new Uint8Array([128,128,255,255]),1,1,THREE.RGBAFormat);nf.needsUpdate=true;
 for(const k of ['tG','tD','tS','tR','tW'])terrU[k].value=ph;terrU.nG.value=terrU.nR.value=nf;
 const L=new THREE.TextureLoader(),files={tG:'grass',tD:'ground',tS:'sand',tR:'rock',tW:'snow',nG:'grass_n',nR:'rock_n'};let left=Object.keys(files).length;
 const done=()=>{if(--left<=0){terrU.uPhoto.value=1;if(typeof colorTerrain==='function')requestAnimationFrame(()=>{})}};
 for(const [k,f] of Object.entries(files))L.load('assets/textures/'+f+'.jpg',t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;terrU[k].value=t;done()},undefined,()=>{done()});}
terrainMat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,terrU);sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\nroughnessFactor=mix(roughnessFactor,.32,gWet*.75);');
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;').replace('#include <begin_vertex>','#include <begin_vertex>\nvWP=(modelMatrix*vec4(transformed,1.0)).xyz;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D uWx;float gWet=0.;uniform float uTide;uniform float uTideA;uniform float uHam;uniform float uLite;uniform float uWaterY;uniform float uSnow;uniform float uAutumn;uniform float uHalfH;uniform sampler2D uOwn;uniform sampler2D uWar;uniform vec2 uMap;uniform float uTint;uniform float uTime;uniform float uPhoto;uniform sampler2D tG,tD,tS,tR,tW,nG,nR;uniform vec3 mG,mD,mS,mR,mW;\n'+NOISE_GLSL)
   .replace('#include <color_fragment>',`#include <color_fragment>
    float camD=length(vWP-cameraPosition),dfade=(1.-smoothstep(14.+uHam*16.,52.+uHam*30.,camD))*uPhoto*(1.-uLite);
    /* two scales of the same photo, turned against each other, so the tiling does not show */
    vec2 P1=vWP.xz*.42,P2=mat2(.8,-.6,.6,.8)*vWP.xz*.13+.37;vec4 bumpW=vec4(0.);
    float dn=vn(vWP.xz*11.)*.45+vn(vWP.xz*37.)*.3+vn(vWP.xz*2.7)*.25;diffuseColor.rgb*=.9+dn*.2;
    /* meadows: lush and dry patches, mown strips and fine blades, so grass never reads as flat paint */
    float gr=smoothstep(.0,.06,diffuseColor.g-max(diffuseColor.r,diffuseColor.b)*.92);
    if(uLite<.5){float p1=vn(vWP.xz*.7),p2=vn(vWP.xz*3.1+7.),p4=vn(vWP.xz*13.+3.);
    vec3 lush=diffuseColor.rgb*vec3(.74,.93,.66),dry=diffuseColor.rgb*vec3(1.22,1.12,.78);
    vec3 mead=mix(lush,dry,smoothstep(.4,.8,p1*.6+p2*.4));mead*=.84+.3*p4;
    float bl=vn(vWP.xz*vec2(190.,60.))*.5+vn(vWP.xz*vec2(70.,210.))*.5;mead*=.96+bl*.08*dfade;
    diffuseColor.rgb=mix(diffuseColor.rgb,mead,gr*.85);}
    /* the painted countryside: grass in irregular darker clumps and tussocks, so a meadow reads as real turf from any height */
    if(uHam>0.){float hq1=vn(vWP.xz*1.45+vec2(3.1)),hq2=vn(vWP.xz*4.7+vec2(1.7)),hq3=vn(vWP.xz*17.),hq4=vn(vWP.xz*.38);
      float clump=smoothstep(.4,.8,hq1*.55+hq2*.45);diffuseColor.rgb*=mix(1.,.8,clump*gr*uHam);
      diffuseColor.rgb*=1.+(hq3-.5)*.14*gr*uHam;diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.12,1.06,.86),smoothstep(.55,.85,hq4)*gr*.5*uHam);}
    /* steep ground shows bare earth and rock */
    vec3 gn=normalize(cross(dFdx(vWP),dFdy(vWP)));float st=smoothstep(.62,.86,1.-abs(gn.y));
    vec3 rockC=mix(vec3(.075,.065,.05),vec3(.13,.12,.10),vn(vWP.xz*9.+vWP.y*3.));diffuseColor.rgb=mix(diffuseColor.rgb,rockC*(.85+dn*.3),st*.85*step(.01,vWP.y-uWaterY));
    /* real ground: grass tufts, crumbly soil, sand ripples and cracked rock, fading out with distance */
    {float lum=dot(diffuseColor.rgb,vec3(.3,.59,.11));float above=step(.006,vWP.y-uWaterY);
     float sandy=(1.-gr)*smoothstep(.02,.1,diffuseColor.r-diffuseColor.b)*smoothstep(.14,.3,lum)*(1.-st);
     float soil=(1.-gr)*(1.-sandy)*(1.-st);
     float snowy=smoothstep(.62,.8,min(diffuseColor.r,min(diffuseColor.g,diffuseColor.b)))*(1.-gr);
     if(dfade>.003){
      /* the photo's own light and colour, measured against its average, laid over the land's colour so every biome keeps its tone */
      vec3 g=(texture2D(tG,P1).rgb*.62+texture2D(tG,P2).rgb*.38)/mG,so=(texture2D(tD,P1).rgb*.62+texture2D(tD,P2).rgb*.38)/mD,sa=(texture2D(tS,P1*1.3).rgb*.7+texture2D(tS,P2).rgb*.3)/mS;
      vec3 an=abs(gn)+1e-3;an/=an.x+an.y+an.z;vec3 rk=(texture2D(tR,vWP.zy*.35).rgb*an.x+texture2D(tR,vWP.xy*.35).rgb*an.z+texture2D(tR,P1*.8).rgb*an.y)/mR;
      vec3 sn=texture2D(tW,P1).rgb/mW;
      float wG=gr*above,wR=st*above,wS=sandy*(1.-wR),wD=soil*(1.-wR),wW=snowy;float wsum=wG+wR+wS+wD+wW+1e-3;
      vec3 det=(g*wG+rk*wR+sa*wS+so*wD+sn*wW)/wsum;det=mix(vec3(1.),det,min(1.,wsum));det=mix(vec3(1.),det,1.+uHam*.15);det=clamp(det,.4,1.7);
      diffuseColor.rgb*=mix(vec3(1.),det,dfade*.92);
      bumpW=vec4(wG+wD*.7+wS*.5,wR,0.,0.)/wsum;}}
    /* tides: sand the sea has just left is dark and wet, with a line of weed and shells at the high-water mark */
    if(uTideA>0.){float hw=uWaterY+uTideA,lw=uWaterY+uTide,ex=step(lw,vWP.y);float wet=(1.-smoothstep(hw-.003,hw+.004,vWP.y))*ex;float fresh=1.-smoothstep(lw,lw+.01,vWP.y);
      diffuseColor.rgb*=1.-(.3+.16*fresh)*wet;diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.86,.92,1.),wet*.5);float wrack=exp(-pow((vWP.y-hw)/.0022,2.))*ex;diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.72,.7,.6),wrack*.55);}
    /* sunlight dancing on the shallow seabed */
    if(vWP.y<uWaterY&&uLite<.5){float dep=uWaterY-vWP.y;vec2 cp=vWP.xz*2.2;float c1=vn(cp+vec2(uTime*.35,uTime*.2)),c2=vn(cp*1.3-vec2(uTime*.27,-uTime*.31));float ca=pow(1.-abs(c1-c2),7.);
      diffuseColor.rgb+=vec3(.55,.75,.7)*ca*.35*exp(-dep*2.5)*dfade;}
    /* seasons: golden autumn meadows, snow on cold and high ground in winter */
    diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.28,1.02,.58),uAutumn*gr*.65);
    float lat=abs(vWP.z)/uHalfH,sn=uSnow*smoothstep(.64,.86,lat+(vWP.y-uWaterY)*.11+(vn(vWP.xz*2.3)-.5)*.2)*step(.02,vWP.y-uWaterY)*(1.-st*.6);
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.9,.93,.97),clamp(sn,0.,1.)*.9);
    /* the weather of the last days: fresh snow where it fell, dark wet ground where it rained */
    {vec4 wxs=texture2D(uWx,(vWP.xz+uMap*.5)/uMap);float wsn=smoothstep(.12,.55,wxs.g+(vn(vWP.xz*3.1)-.5)*.3)*step(.012,vWP.y-uWaterY)*(1.-st*.55);
     diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.9,.93,.97),wsn*.92);
     gWet=smoothstep(.08,.6,wxs.r+(vn(vWP.xz*4.3)-.5)*.25)*(1.-wsn)*step(uWaterY,vWP.y);diffuseColor.rgb*=1.-.3*gWet;
     /* years of drought scorch the grass yellow and brown; a run of wet years makes it lush */
     float an=wxs.b*2.-1.,dr=smoothstep(-.3,-.8,an+(vn(vWP.xz*1.7)-.5)*.25)*step(uWaterY+.01,vWP.y)*(1.-wsn),lu=smoothstep(.45,.9,an)*step(uWaterY+.01,vWP.y)*(1.-wsn);
     float gg=smoothstep(.0,.05,diffuseColor.g-max(diffuseColor.r,diffuseColor.b)*.95);
     diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.22,1.02,.6)+vec3(.04,.02,0.),dr*gg*.7);diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.9,1.04,.88),lu*gg*.5);}
    /* nations: a soft wash of their colour; war fronts: a scorched, striped conflict zone */
    if(uTint>0.){vec2 tuv=(vWP.xz+uMap*.5)/uMap;vec4 own=texture2D(uOwn,tuv);float ab=step(uWaterY+.004,vWP.y);
      diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*.6+own.rgb*.55,own.a*uTint*ab);
      float wz=texture2D(uWar,tuv).r*ab;if(wz>.02){float stp=step(.86,fract((vWP.x+vWP.z)*3.2));float sc=vn(vWP.xz*6.);diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.78,.66,.56)*(.85+sc*.3),wz*.5);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.72,.12,.07),wz*stp*.45);}}`)
   .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
    if(dfade>.01){/* photo normal maps: ground and grass from above, rock on the slopes */
     vec3 n1=texture2D(nG,P1).xyz*2.-1.,n2=texture2D(nR,P1*.8).xyz*2.-1.;vec2 nn=n1.xy*bumpW.x+n2.xy*bumpW.y;
     vec3 pw=vec3(nn.x,0.,-nn.y)*.55*dfade;normal=normalize(normal+(viewMatrix*vec4(pw,0.)).xyz);}`);
};
function buildTerrain(){
  for(const m of [terrainMesh,skirtMesh,waterMesh,waterSide]){if(m){scene.remove(m);m.geometry.dispose()}}
  VW=W*R+1;VH=H*R+1;const nv=VW*VH;VY=new Float32Array(nv);detail=new Float32Array(nv);
  /* a new world: nothing laid out for the last one carries over (colour tables, pending layout steps, the old heights) */
  CT_U=null;LAY_TOKEN++;LAY_PEND=0;LAY={base:-1,wy:null,keys:null};LAYOLD=null;LAYDIRTY=null;HPREV=null;RLY_RECT=null;LAYBIO=-1;
  const dn=makeNoise((hseed*1000)|0);
  for(let v=0;v<VH;v++)for(let u=0;u<VW;u++)detail[v*VW+u]=(dn(u/R*.9,v/R*.9,3)-.5)*2;
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(nv*3),3));
  g.setAttribute('color',new THREE.BufferAttribute(new Float32Array(nv*3),3));
  const idx=new Uint32Array((VW-1)*(VH-1)*6);let k=0;
  for(let v=0;v<VH-1;v++)for(let u=0;u<VW-1;u++){const a=v*VW+u,b=a+1,c=a+VW,d=c+1;idx[k++]=a;idx[k++]=c;idx[k++]=b;idx[k++]=b;idx[k++]=c;idx[k++]=d}
  g.setIndex(new THREE.BufferAttribute(idx,1));
  terrainMesh=new THREE.Mesh(g,terrainMat);terrainMesh.receiveShadow=true;terrainMesh.castShadow=true;scene.add(terrainMesh);
  const segs=2*(VW-1)+2*(VH-1),sg=new THREE.BufferGeometry();
  sg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(segs*12*3),3));sg.setAttribute('color',new THREE.BufferAttribute(new Float32Array(segs*12*3),3));
  skirtMesh=new THREE.Mesh(sg,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide}));skirtMesh.receiveShadow=true;skirtMesh.visible=false;scene.add(skirtMesh);buildOcean();
  const wg=new THREE.PlaneGeometry(W,H,W*2,H*2);wg.rotateX(-Math.PI/2);
  const wn=wg.attributes.position.count;wg.setAttribute('aDepth',new THREE.BufferAttribute(new Float32Array(wn),1));wg.setAttribute('aIce',new THREE.BufferAttribute(new Float32Array(wn),1));
  waterMesh=new THREE.Mesh(wg,waterMat);waterMesh.receiveShadow=true;waterMesh.renderOrder=2;scene.add(waterMesh);
  const bg=new THREE.BoxGeometry(W+.02,1,H+.02);bg.translate(0,.5,0);
  waterSide=new THREE.Mesh(bg,[waterSideMat,waterSideMat,hiddenMat,hiddenMat,waterSideMat,waterSideMat]);waterSide.visible=false;scene.add(waterSide);
}
const hiddenMat=new THREE.MeshBasicMaterial({visible:false});
const oceanMat=new THREE.MeshStandardMaterial({color:colL(0x0f3f63),roughness:.12,metalness:0});
let ocean=new THREE.Mesh(new THREE.BufferGeometry(),oceanMat);ocean.receiveShadow=true;scene.add(ocean);
/* the open sea around the map: rings of the same water as the map's own sea, joined vertex for vertex at the edge and getting deeper outward,
   out to the horizon, so the world no longer sits in a flat blue plane like a block */
const OCEAN_OFF=[0,1.5,4,9,18,36,80,180,420,1500],OCEAN_DEEP=[0,.45,.8,1,1,1,1,1,1,1];let OCEAN_P=0;
function buildOcean(){const pts=[],hw=W/2,hh=H/2;
  for(let k=0;k<W*2;k++)pts.push([-hw+k*.5,-hh]);for(let k=0;k<H*2;k++)pts.push([hw,-hh+k*.5]);for(let k=0;k<W*2;k++)pts.push([hw-k*.5,hh]);for(let k=0;k<H*2;k++)pts.push([-hw,hh-k*.5]);
  const P=OCEAN_P=pts.length,RN=OCEAN_OFF.length,pos=new Float32Array(P*RN*3),idx=[];
  for(let r=0;r<RN;r++){const o=OCEAN_OFF[r],sx=(hw+o)/hw,sz=(hh+o)/hh;for(let k=0;k<P;k++){const [x,z]=pts[k],q=(r*P+k)*3;
    /* each edge point moves straight out from its side, the corners out along the diagonal */
    pos[q]=Math.abs(x)>=hw-1e-6?Math.sign(x)*(hw+o):x*sx;pos[q+1]=0;pos[q+2]=Math.abs(z)>=hh-1e-6?Math.sign(z)*(hh+o):z*sz}}
  for(let r=0;r<RN-1;r++)for(let k=0;k<P;k++){const a=r*P+k,b=r*P+(k+1)%P,c=a+P,d=b+P;idx.push(a,b,c,b,d,c)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setIndex(idx);
  const nrm=new Float32Array(P*RN*3);for(let k=1;k<nrm.length;k+=3)nrm[k]=1;g.setAttribute('normal',new THREE.BufferAttribute(nrm,3));
  g.setAttribute('aDepth',new THREE.BufferAttribute(new Float32Array(P*RN),1));g.setAttribute('aIce',new THREE.BufferAttribute(new Float32Array(P*RN),1));
  ocean.geometry.dispose();ocean.geometry=g;ocean.material=waterMat;ocean.renderOrder=2;ocean.frustumCulled=false;
  /* a dark sea floor under it, like the deep seabed inside the map, so the slightly see-through water looks the same on both sides of the edge */
  if(!oceanFloor){oceanFloor=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:new THREE.Color(LIN[38],LIN[70],LIN[92]),roughness:1}));oceanFloor.frustumCulled=false;oceanFloor.receiveShadow=false;scene.add(oceanFloor)}else oceanFloor.geometry=g}
let oceanFloor=null;
/* pack ice breaks up and thins out over the last few tiles before the map's edge, with a ragged margin, so it drifts off into the open sea instead of ending in a straight line */
function iceEdge(x,z){const e=Math.min(W/2-Math.abs(x),H/2-Math.abs(z)),n=Math.sin(x*.71+z*.33)*.5+Math.sin(x*.23-z*.61+1.7)*.35+Math.sin(x*1.9+z*1.3)*.15;return smooth(.5,4.5,e+n*2.2)}
/* depth along the seam follows the map's own sea; further out it deepens */
function layoutOcean(){const g=ocean.geometry;if(!g.attributes.aDepth||!OCEAN_P)return;const p=g.attributes.position.array,dA=g.attributes.aDepth.array,iA=g.attributes.aIce.array,P=OCEAN_P;
  for(let k=0;k<P;k++){const x=p[k*3],z=p[k*3+2],d0=Math.max(0,waterY-groundY(x,z));
    for(let r=0;r<OCEAN_OFF.length;r++){const f=OCEAN_DEEP[r];dA[r*P+k]=d0+(Math.max(d0,1.6)-d0)*f;iA[r*P+k]=0}}
  g.attributes.aDepth.needsUpdate=true;g.attributes.aIce.needsUpdate=true}
const waterSideMat=new THREE.MeshStandardMaterial({color:colL(0x1d5f86),transparent:true,opacity:.72,roughness:.2,depthWrite:false});
const waterU={uLite:{value:0},uTime:{value:0},uDeep:{value:colL(0x0f3f63)},uShallow:{value:colL(0x2f9bb0)},uWave:{value:WAVE_TEX}};
const waterMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.16,metalness:0,transparent:true,envMapIntensity:.85});
waterMat.onBeforeCompile=sh=>{
  Object.assign(sh.uniforms,waterU);
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float aDepth;attribute float aIce;varying float vDepth;varying float vIce;varying vec3 vWP;uniform float uTime;')
   .replace('#include <beginnormal_vertex>','float wa=position.x*1.7+uTime*1.1,wb=position.z*1.4+uTime*1.35;vec3 objectNormal=normalize(vec3(-cos(wa)*.05,1.,sin(wb)*.045));')
   .replace('#include <begin_vertex>','vec3 transformed=vec3(position);transformed.y+=(sin(wa)*.03+cos(wb)*.026)*(1.-aIce)*clamp(aDepth*2.,0.,1.);vDepth=aDepth;vIce=aIce;vWP=(modelMatrix*vec4(transformed,1.)).xyz;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uLite;uniform float uTime;uniform vec3 uDeep;uniform vec3 uShallow;uniform sampler2D uWave;varying float vDepth;varying float vIce;\n'+NOISE_GLSL)
   .replace('#include <color_fragment>',`#include <color_fragment>
    /* clear at the very edge, then quickly deeper and darker, so lakes and coasts are not milky */
    float dd=clamp(vDepth/.8,0.,1.);vec3 wc=mix(uShallow*.95,uDeep,pow(dd,.5));
    vec4 w1=texture2D(uWave,vWP.xz*.32+vec2(uTime*.018,uTime*.011)),w2=texture2D(uWave,vWP.xz*.81-vec2(uTime*.024,-uTime*.017));float wh=w1.a*.6+w2.a*.4;
    wc*=.95+wh*.09;
    float edge=1.-smoothstep(0.,.022,vDepth);float surf=smoothstep(.8,.97,sin(vDepth*42.-uTime*1.6+wh*5.)*.5+.5)*(1.-smoothstep(.015,.09,vDepth));
    /* a thin, broken line of foam at the shore instead of a white sheet over wide shallows */
    float brk=smoothstep(.45,.75,vn(vWP.xz*9.+uTime*.25)*.7+wh*.5);
    float fo=clamp((edge*.5*(.3+.7*brk)+surf*.4*brk)*(.5+.6*smoothstep(.35,.7,wh+vn(vWP.xz*16.+uTime*.3)*.35)),0.,.7);
    float caps=smoothstep(.83,.9,wh)*smoothstep(.6,1.,dd)*.35;
    diffuseColor.rgb=mix(wc,vec3(.92,.96,.97),max(fo,caps));diffuseColor.a=mix(.5,.97,smoothstep(0.,.3,vDepth))+fo*.35;
    float ic=vIce*(.85+.15*vn(vWP.xz*5.));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.86,.92,.97),ic);diffuseColor.a=max(diffuseColor.a,ic);`)
   .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.55,vIce);')
   .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
    if(uLite<.5){vec3 n1=texture2D(uWave,vWP.xz*.32+vec2(uTime*.018,uTime*.011)).xyz*2.-1.,n2=texture2D(uWave,vWP.xz*.81-vec2(uTime*.024,-uTime*.017)).xyz*2.-1.,n3=texture2D(uWave,vWP.xz*2.3+vec2(-uTime*.05,uTime*.04)).xyz*2.-1.;
     float camD=length(vWP-cameraPosition),k=(1.-vIce)*(.55+.45*(1.-smoothstep(10.,60.,camD)));
     vec3 wn=normalize(vec3((n1.x+n2.x*.7+n3.x*.18)*k*.48,1.,(n1.y+n2.y*.7+n3.y*.18)*k*.48));normal=normalize(mix(normal,(viewMatrix*vec4(wn,0.)).xyz,.85));}`);
};

/* the flat ground under each town: where it is, how wide, and at what height */
function townSpots(){const out=[];for(const n of nations)if(n.alive)n.cities.forEach((c,ci)=>{const r=cityRadius(n,ci===0);let s=0,k=0;
    for(let a=0;a<12;a++)for(const f of [0,.4,.8]){const hb=sampleH(c.x+Math.cos(a*.5236)*r*f,c.y+Math.sin(a*.5236)*r*f);if(hb>sea){s+=shapeH(hb);k++}}
    c._flat=k?(r*100|0)+':'+Math.round(Math.max(s/k,waterY+.05)*1000):'w';if(k)out.push({x:c.x,y:c.y,r:r*1.35,r0:r*.75,h:Math.max(s/k,waterY+.05),key:c.x+','+c.y+':'+c._flat})});return out}
function spotGrid(spots){const FB=new Map();for(const f of spots){const r=Math.ceil(f.r);for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const k=(Math.floor(f.x)+dx)+','+(Math.floor(f.y)+dy);if(!FB.has(k))FB.set(k,[]);FB.get(k).push(f)}}return FB}
function vertY(u,v,FB){const tx=u/R-.5,ty=v/R-.5,hb=sampleH(tx,ty);
    let y=shapeH(hb);y+=detail[v*VW+u]*(hb>SEA0?.16*(.12+clamp((hb-SEA0)*3.4,0,1.5)):.06);
    const near=y>waterY&&FB.get(Math.floor(tx+.5)+','+Math.floor(ty+.5));if(near)for(const f of near){const dx=tx-f.x,dy=ty-f.y;if(Math.abs(dx)>f.r||Math.abs(dy)>f.r)continue;const d=Math.hypot(dx,dy);if(d>=f.r)continue;
      const w=d<=f.r0?1:1-smooth(f.r0,f.r,d);y=lerp(y,Math.max(f.h,Math.min(y,f.h+.02)),w*.92)}return y}
function tileSlope(i){const x=i%W,yy=(i/W)|0;let mn=1e9,mx=-1e9;for(let b=0;b<=R;b++)for(let a=0;a<=R;a++){const q=VY[(yy*R+b)*VW+x*R+a];if(q<mn)mn=q;if(q>mx)mx=q}return mx-mn}
/* when only the towns changed (one grew, one was founded), just the ground around those towns is redone */
let LAY={base:-1,wy:null,keys:null},LAYOLD=null,LAYDIRTY=null;
/* the heights the ground was last laid out from: when only a corner of the land changed (a raised hill, a carved river), only that corner is laid out again */
let HPREV=null,LAYBIO=-1;
function heightChange(){if(!HPREV||HPREV.length!==N)return null;let x0=W,x1=-1,y0=H,y1=-1,n=0;
  for(let i=0;i<N;i++)if(h[i]!==HPREV[i]){const x=i%W,y=(i/W)|0;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;n++}
  return n?[x0,x1,y0,y1]:'same'}
function layoutTerrain(){const wy=shapeH(sea),g0=terrainMesh.geometry;
  if(!LAY_PEND&&LAY.wy===wy&&LAY.keys&&g0.attributes.normal&&VY&&tslope.length===N){const hc=heightChange();
    if(hc==='same'||(hc&&(hc[1]-hc[0]+5)*(hc[3]-hc[2]+5)<N*.3)){
      if(hc!=='same'){HPREV.set(h);relayRect(hc)}
      const bio=LAYBIO!==terrBio;LAYBIO=terrBio;if(bio)terrVer++;
      if(layoutPatch(bio)){return 'patch'}}}
  for(const f of layoutFullSteps(wy))f();return 'full'}
/* the whole ground laid out again, as a list of steps. Called from the frame loop the steps run one per frame, so a shift of the coastline never freezes the view. */
let LAY_TOKEN=0,LAY_PEND=0;
function layoutFullSteps(wy){const tok=++LAY_TOKEN;LAY_PEND=tok;let FB;const g=terrainMesh.geometry,st=[];
  st.push(()=>{terrBase++;terrVer++;HPREV=h.slice();LAYBIO=terrBio;RLY_RECT=null;waterY=wy;terrU.uWaterY.value=waterY;flatSig=citySig();flatSpots=townSpots();FB=spotGrid(flatSpots)});
  const CH=Math.ceil(VH/4);for(let c=0;c<VH;c+=CH){const a=c,b=Math.min(VH,c+CH);st.push(()=>{const pos=g.attributes.position.array;
    for(let v=a;v<b;v++)for(let u=0;u<VW;u++){const k=v*VW+u,y=vertY(u,v,FB);VY[k]=y;pos[k*3]=u/R-W/2;pos[k*3+1]=y;pos[k*3+2]=v/R-H/2}g.attributes.position.needsUpdate=true})}
  st.push(()=>{const t=new Float32Array(N);for(let i=0;i<N;i++)t[i]=tileSlope(i);tslope=t;g.computeVertexNormals();g.computeBoundingSphere();g.computeBoundingBox()});
  st.push(()=>colorTerrain());
  st.push(()=>{layoutSkirt();layoutWater();LAY={base:terrBase,wy,keys:new Set(flatSpots.map(f=>f.key))};LAYOLD=null;LAYDIRTY=null;if(LAY_PEND===tok)LAY_PEND=0});
  return st.map(f=>{const j=()=>{if(tok===LAY_TOKEN)f()};j.terr=1;return j})}
/* for the frame loop: the cheap patch runs now; a full layout comes back as steps to spread over frames */
function layoutTerrainJobs(){if(LAY_PEND){terrainDirty=true;return null}const wy=shapeH(sea),g0=terrainMesh.geometry;
  if(LAY.wy===wy&&LAY.keys&&g0.attributes.normal&&VY&&tslope.length===N){const hc=heightChange();if(hc==='same'||(hc&&(hc[1]-hc[0]+5)*(hc[3]-hc[2]+5)<N*.3)){layoutTerrain();return null}}
  return layoutFullSteps(wy)}
/* lay out one rectangle of tiles again after the heights under it changed */
function relayRect(hc){const x0=Math.max(0,hc[0]-2),x1=Math.min(W-1,hc[1]+2),y0=Math.max(0,hc[2]-2),y1=Math.min(H-1,hc[3]+2);
  if(!LAYOLD){LAYOLD=VY.slice();LAYDIRTY=new Set()}terrVer++;const FB=spotGrid(flatSpots);
  relayVerts(Math.max(0,x0*R-1),Math.min(VW-1,(x1+1)*R+1),Math.max(0,y0*R-1),Math.min(VH-1,(y1+1)*R+1),FB);
  /* towns standing on the changed ground are drawn again on the new ground */
  for(const n of nations)if(n.alive)for(const c of n.cities)if(c.x>=x0-4&&c.x<=x1+4&&c.y>=y0-4&&c.y<=y1+4)c._gv=(c._gv||0)+1;
  RLY_RECT=RLY_RECT?[Math.min(RLY_RECT[0],x0*R-2),Math.max(RLY_RECT[1],(x1+1)*R+2),Math.min(RLY_RECT[2],y0*R-2),Math.max(RLY_RECT[3],(y1+1)*R+2)]:[x0*R-2,(x1+1)*R+2,y0*R-2,(y1+1)*R+2]}
let RLY_RECT=null;
/* heights, normals and slopes of the vertices in one rectangle */
function relayVerts(u0,u1,v0,v1,FB){const g=terrainMesh.geometry,pos=g.attributes.position.array,nor=g.attributes.normal.array;
  for(let v=v0;v<=v1;v++)for(let u=u0;u<=u1;u++){const k=v*VW+u,y=vertY(u,v,FB);VY[k]=y;pos[k*3+1]=y}
  const a0=Math.max(0,u0-1),a1=Math.min(VW-1,u1+1),b0=Math.max(0,v0-1),b1=Math.min(VH-1,v1+1),inR=(u,v)=>u>=a0&&u<=a1&&v>=b0&&v<=b1;
  for(let v=b0;v<=b1;v++)for(let u=a0;u<=a1;u++){const k=(v*VW+u)*3;nor[k]=nor[k+1]=nor[k+2]=0}
  const P=(i,o)=>pos[i*3+o],face=(A,B,C)=>{const cbx=P(C,0)-P(B,0),cby=P(C,1)-P(B,1),cbz=P(C,2)-P(B,2),abx=P(A,0)-P(B,0),aby=P(A,1)-P(B,1),abz=P(A,2)-P(B,2);
    const nx=cby*abz-cbz*aby,ny=cbz*abx-cbx*abz,nz=cbx*aby-cby*abx;for(const q of [A,B,C]){const qu=q%VW,qv=(q/VW)|0;if(!inR(qu,qv))continue;nor[q*3]+=nx;nor[q*3+1]+=ny;nor[q*3+2]+=nz}};
  for(let v=Math.max(0,b0-1);v<Math.min(VH-1,b1+1);v++)for(let u=Math.max(0,a0-1);u<Math.min(VW-1,a1+1);u++){const A=v*VW+u,B=A+1,C=A+VW,D=C+1;face(A,C,B);face(B,C,D)}
  for(let v=b0;v<=b1;v++)for(let u=a0;u<=a1;u++){const k=(v*VW+u)*3,l=Math.hypot(nor[k],nor[k+1],nor[k+2])||1;nor[k]/=l;nor[k+1]/=l;nor[k+2]/=l}
  if(typeof RIB_DIRTY!=='undefined')RIB_DIRTY.push([u0/R-W/2-.3,u1/R-W/2+.3,v0/R-H/2-.3,v1/R-H/2+.3]);
  for(let ty=Math.max(0,Math.floor(v0/R)-1);ty<=Math.min(H-1,Math.ceil(v1/R));ty++)for(let tx=Math.max(0,Math.floor(u0/R)-1);tx<=Math.min(W-1,Math.ceil(u1/R));tx++){const i=ty*W+tx;tslope[i]=tileSlope(i);LAYDIRTY.add(i)}
  g.attributes.position.needsUpdate=true;g.attributes.normal.needsUpdate=true}
function layoutPatch(bio){const spots=townSpots(),keys=new Set(spots.map(f=>f.key)),changed=[];
  for(const f of spots)if(!LAY.keys.has(f.key))changed.push(f);
  for(const f of flatSpots)if(!keys.has(f.key))changed.push(f);
  if(changed.length>16)return false;
  if(!changed.length){flatSig=citySig();const r=RLY_RECT;RLY_RECT=null;if(bio)colorTerrain();else if(r)colorTerrain(r);if(r){layoutWater(r);g0b()}return true}
  if(!LAYOLD){LAYOLD=VY.slice();LAYDIRTY=new Set()}
  terrVer++;flatSig=citySig();flatSpots=spots;LAY.keys=keys;const FB=spotGrid(spots);
  const RU=RLY_RECT||[1e9,-1,1e9,-1];RLY_RECT=null;for(const f of changed){const u0=Math.max(0,Math.floor((f.x+.5-f.r-.2)*R)),u1=Math.min(VW-1,Math.ceil((f.x+.5+f.r+.2)*R)),v0=Math.max(0,Math.floor((f.y+.5-f.r-.2)*R)),v1=Math.min(VH-1,Math.ceil((f.y+.5+f.r+.2)*R));RU[0]=Math.min(RU[0],u0-2);RU[1]=Math.max(RU[1],u1+2);RU[2]=Math.min(RU[2],v0-2);RU[3]=Math.max(RU[3],v1+2);
    relayVerts(u0,u1,v0,v1,FB)}
  if(bio)colorTerrain();else colorTerrain(RU);layoutWater(RU);g0b();return true}
function g0b(){const g=terrainMesh.geometry;g.computeBoundingSphere();g.computeBoundingBox()}
/* the ground height in an older copy of the heights, to move trees by as much as the ground under them moved */
function groundYIn(A,x,z){let u=(x+W/2)*R,v=(z+H/2)*R;u=clamp(u,0,VW-1.001);v=clamp(v,0,VH-1.001);const u0=u|0,v0=v|0,fu=u-u0,fv=v-v0,k=v0*VW+u0;
  return lerp(lerp(A[k],A[k+1],fu),lerp(A[k+VW],A[k+VW+1],fu),fv)}
/* ground colours. Every vertex blends the colours of the four tiles around it, then shore sand, rock, snow and the look's tint.
   It can redo just one rectangle (a town that grew), and it makes no garbage: the per-row and per-column blend weights are worked out once. */
let CT_TC=null,CT_SOOT=null,CT_U=null,CT_V=null;
function ctTables(){if(CT_U&&CT_U.x0.length===VW&&CT_V.y0.length===VH&&CT_SOOT.length===N&&CT_U.W===W)return;CT_U={W,x0:new Int32Array(VW),x1:new Int32Array(VW),f:new Float32Array(VW)};CT_V={y0:new Int32Array(VH),y1:new Int32Array(VH),f:new Float32Array(VH)};
  for(let u=0;u<VW;u++){const t=clamp(u/R-.5,0,W-1),x0=Math.floor(t);CT_U.x0[u]=x0;CT_U.x1[u]=Math.min(x0+1,W-1);CT_U.f[u]=t-x0}
  for(let v=0;v<VH;v++){const t=clamp(v/R-.5,0,H-1),y0=Math.floor(t);CT_V.y0[v]=y0*W;CT_V.y1[v]=Math.min(y0+1,H-1)*W;CT_V.f[v]=t-y0}
  CT_TC=new Float32Array(N*3);CT_SOOT=new Float32Array(N)}
function colorTerrain(rect){ctTables();
  const TINT=LK.tint||null;if(!!LK.flat!==terrainMat.flatShading){terrainMat.flatShading=!!LK.flat;terrainMat.needsUpdate=true}
  waterU.uDeep.value.copy(colL(LK.deep||0x0f3f63));waterU.uShallow.value.copy(colL(LK.shallow||0x2f9bb0));
  const attr=terrainMesh.geometry.attributes.color,col=attr.array,nor=terrainMesh.geometry.attributes.normal.array;
  const TC=CT_TC,SOOT=CT_SOOT;SOOT.fill(0);
  /* the tile rectangle that feeds this vertex rectangle */
  let u0=0,u1=VW-1,v0=0,v1=VH-1;if(rect){u0=Math.max(0,rect[0]|0);u1=Math.min(VW-1,rect[1]|0);v0=Math.max(0,rect[2]|0);v1=Math.min(VH-1,rect[3]|0)}
  const tx0=Math.max(0,CT_U.x0[u0]-1),tx1=Math.min(W-1,CT_U.x1[u1]+1),ty0=Math.max(0,CT_V.y0[v0]/W-1),ty1=Math.min(H-1,CT_V.y1[v1]/W+1);
  for(const n of nations){if(!n.alive||n.era<5||n.era>6)continue;const k_=n.era===5?1:.4;n.cities.forEach((c,ci)=>{const R2=(ci===0?3.2:2.2)+Math.min(2,n.pop/Math.max(1,n.cities.length)/600),RC=Math.ceil(R2);
    if(c.x+RC<tx0||c.x-RC>tx1||c.y+RC<ty0||c.y-RC>ty1)return;
    for(let dy=-RC;dy<=RC;dy++)for(let dx=-RC;dx<=RC;dx++){const X=c.x+dx,Y=c.y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const d=Math.hypot(dx,dy);if(d>R2)continue;const j=Y*W+X;SOOT[j]=Math.max(SOOT[j],k_*(1-d/R2))}})}
  const GRD=LK.ground||{},mA=typeof marshAt==='function',sc=typeof scorched!=='undefined'&&scorched;
  for(let ty=ty0;ty<=ty1;ty++)for(let tx=tx0;tx<=tx1;tx++){const i=ty*W+tx;const c=mA&&marshAt(i)?MARSH_C:GRD[biome[i]]||GROUND[biome[i]],v=1-.1*hash(i*1.7);let r=c[0]*v,g=c[1]*v,b=c[2]*v;
    if(sc&&scorched[i]>0&&!isWater(i)){const t=Math.min(1,scorched[i]/18)*.85;r=lerp(r,56,t);g=lerp(g,50,t);b=lerp(b,44,t)}
    if(SOOT[i]>0&&!isWater(i)){const t=SOOT[i]*.5;r=lerp(r,82,t);g=lerp(g,76,t);b=lerp(b,62,t)}
    TC[i*3]=r;TC[i*3+1]=g;TC[i*3+2]=b}
  const snowY=shapeH(.9+(climate.temp-.5)*.3),cold=climate.temp<.3,sat=LK.sat,wl=waterY-.01,sandHi=waterY+.045,sandLo=waterY+.012;
  const SA0=SAND[0],SA1=SAND[1],SA2=SAND[2],SB0=SEABED[0]*.55,SB1=SEABED[1]*.55,SB2=SEABED[2]*.6,TI=TINT||[0,0,0,0];
  for(let v=v0;v<=v1;v++){const ya=CT_V.y0[v],yb=CT_V.y1[v],fy=CT_V.f[v];
    for(let u=u0;u<=u1;u++){const k=v*VW+u,xa=CT_U.x0[u],xb=CT_U.x1[u],fx=CT_U.f[u];
      const w0=(1-fx)*(1-fy),w1=fx*(1-fy),w2=(1-fx)*fy,w3=fx*fy,a=(ya+xa)*3,bq=(ya+xb)*3,cq=(yb+xa)*3,dq=(yb+xb)*3;
      let r=TC[a]*w0+TC[bq]*w1+TC[cq]*w2+TC[dq]*w3,g=TC[a+1]*w0+TC[bq+1]*w1+TC[cq+1]*w2+TC[dq+1]*w3,b=TC[a+2]*w0+TC[bq+2]*w1+TC[cq+2]*w2+TC[dq+2]*w3;
      const y=VY[k];
      if(y<wl){const t=smooth(0,1.6,waterY-y);r=SA0+(SB0-SA0)*t;g=SA1+(SB1-SA1)*t;b=SA2+(SB2-SA2)*t}
      else{
        if(y<sandHi&&!cold){const t=1-smooth(sandLo,sandHi,y);r+=(SA0-r)*t;g+=(SA1-g)*t;b+=(SA2-b)*t}
        const sl=1-nor[k*3+1];if(sl>.32){const t=smooth(.32,.62,sl)*.75;r+=(ROCK[0]-r)*t;g+=(ROCK[1]-g)*t;b+=(ROCK[2]-b)*t}
        if(y>snowY){const t=smooth(snowY,snowY+.45,y)*(sl>.5?.5:1);r+=(SNOW[0]-r)*t;g+=(SNOW[1]-g)*t;b+=(SNOW[2]-b)*t}}
      if(TINT){const q=TI[3]*(y<wl?.4:1);r+=(TI[0]-r)*q;g+=(TI[1]-g)*q;b+=(TI[2]-b)*q}
      const l=(r+g+b)/3;r=l+(r-l)*sat;g=l+(g-l)*sat;b=l+(b-l)*sat;
      col[k*3]=LIN[r<0?0:r>255?255:r|0];col[k*3+1]=LIN[g<0?0:g>255?255:g|0];col[k*3+2]=LIN[b<0?0:b>255?255:b|0]}}
  attr.needsUpdate=true;
}
function layoutSkirt(){
  const pos=skirtMesh.geometry.attributes.position.array,col=skirtMesh.geometry.attributes.color.array;let n=0;
  const soil=[LIN[92],LIN[68],LIN[44]],rock=[LIN[86],LIN[78],LIN[70]],deep=[LIN[46],LIN[40],LIN[36]];
  const vtx=(x,y,z,c)=>{pos[n*3]=x;pos[n*3+1]=y;pos[n*3+2]=z;col[n*3]=c[0];col[n*3+1]=c[1];col[n*3+2]=c[2];n++};
  const quad=(ax,ay,az,bx,by,bz,ay2,by2,c1,c2)=>{vtx(ax,ay,az,c1);vtx(bx,by,bz,c1);vtx(bx,by2,bz,c2);vtx(ax,ay,az,c1);vtx(bx,by2,bz,c2);vtx(ax,ay2,az,c2)};
  const seg=(ka,kb,ax,az,bx,bz)=>{const ya=VY[ka],yb=VY[kb],ma=Math.max(BASE,ya-.45),mb=Math.max(BASE,yb-.45);
    quad(ax,ya,az,bx,yb,bz,ma,mb,soil,rock);quad(ax,ma,az,bx,mb,bz,BASE,BASE,rock,deep)};
  for(let u=0;u<VW-1;u++){const x0=u/R-W/2,x1=(u+1)/R-W/2;seg(u,u+1,x0,-H/2,x1,-H/2);const o=(VH-1)*VW;seg(o+u,o+u+1,x0,H/2,x1,H/2)}
  for(let v=0;v<VH-1;v++){const z0=v/R-H/2,z1=(v+1)/R-H/2;seg(v*VW,(v+1)*VW,-W/2,z0,-W/2,z1);seg(v*VW+VW-1,(v+1)*VW+VW-1,W/2,z0,W/2,z1)}
  const g=skirtMesh.geometry;g.attributes.position.needsUpdate=true;g.attributes.color.needsUpdate=true;g.computeVertexNormals();g.computeBoundingSphere();
}
function layoutWater(rect){
  const g=waterMesh.geometry,p=g.attributes.position.array,dA=g.attributes.aDepth.array,iA=g.attributes.aIce.array;
  const X0=rect?rect[0]/R-W/2-.5:-1e9,X1=rect?rect[1]/R-W/2+.5:1e9,Z0=rect?rect[2]/R-H/2-.5:-1e9,Z1=rect?rect[3]/R-H/2+.5:1e9;
  for(let k=0;k<dA.length;k++){const x=p[k*3],z=p[k*3+2];if(x<X0||x>X1||z<Z0||z>Z1)continue;dA[k]=Math.max(0,waterY-groundY(x,z));
    const tx=clamp(Math.floor(x+W/2),0,W-1),ty=clamp(Math.floor(z+H/2),0,H-1);iA[k]=biome[ty*W+tx]===2?iceEdge(x,z):0}
  g.attributes.aDepth.needsUpdate=true;g.attributes.aIce.needsUpdate=true;
  if(!rect||rect[0]<=1||rect[2]<=1||rect[1]>=VW-2||rect[3]>=VH-2)layoutOcean();
  if(oceanFloor)oceanFloor.position.y=Math.max(BASE,waterY-1.6);
  waterMesh.position.y=waterY;waterSide.position.y=BASE;waterSide.scale.y=waterY-BASE-.03;ocean.position.y=waterY;
}

/* ---------- territory borders ---------- */
let borderMesh=null;
/* borders: smoothed outlines traced around each realm, with a soft wash of the realm's colour fading inward */
const borderMat=new THREE.ShaderMaterial({uniforms:{uOp:{value:.9},uPL:PLU.uPL,uPE:PLU.uPE},transparent:true,depthWrite:false,
  vertexShader:'attribute vec4 aCol;varying vec4 vC;void main(){vC=aCol;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:TOSCENE+'uniform float uOp;varying vec4 vC;void main(){gl_FragColor=vec4(toScene(vC.rgb),vC.a*uOp);}'});
/* territory: a soft colour wash over each nation's land, a striped conflict zone along war fronts, and smooth border lines */
let ownTex=null,warTex=null;
function ensureOwnTex(){if(ownTex&&ownTex.image.width===W&&ownTex.image.height===H)return;if(ownTex){ownTex.dispose();warTex.dispose()}
  ownTex=new THREE.DataTexture(new Uint8Array(W*H*4),W,H,THREE.RGBAFormat);ownTex.magFilter=ownTex.minFilter=THREE.LinearFilter;
  warTex=new THREE.DataTexture(new Uint8Array(W*H*4),W,H,THREE.RGBAFormat);warTex.magFilter=warTex.minFilter=THREE.LinearFilter;
  terrU.uOwn.value=ownTex;terrU.uWar.value=warTex;terrU.uMap.value.set(W,H)}
const contested=new Uint8Array(1<<16);let contestedList=[];
function updateTerritoryTex(){ensureOwnTex();const a=ownTex.image.data,w=warTex.image.data;contestedList=[];
  for(let i=0;i<N;i++){const o=owner[i],q=i*4;if(o<0||!nations[o]){a[q+3]=0;w[q]=0;continue}const c=nations[o].rgb;a[q]=LIN[c[0]]*255;a[q+1]=LIN[c[1]]*255;a[q+2]=LIN[c[2]]*255;a[q+3]=isWater(i)?0:255;
    let war=0;if(nations[o].wars.size){const x=i%W,y=(i/W)|0;for(let dy=-1;dy<=1&&!war;dy++)for(let dx=-1;dx<=1;dx++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const p=owner[Y*W+X];if(p>=0&&p!==o&&nations[o].wars.has(p)){war=255;break}}}
    w[q]=war;w[q+3]=255;if(war&&!isWater(i))contestedList.push(i)}
  ownTex.needsUpdate=true;warTex.needsUpdate=true}
/* marching squares over a blurred membership field gives each nation an organic outline instead of tile steps */
const MS=[[],[[3,0]],[[0,1]],[[3,1]],[[1,2]],null,[[0,2]],[[3,2]],[[2,3]],[[0,2]],null,[[1,2]],[[1,3]],[[0,1]],[[3,0]],[]];
function nationLoops(o){let x0=W,y0=H,x1=-1,y1=-1;for(let i=0;i<N;i++)if(owner[i]===o){const x=i%W,y=(i/W)|0;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
  if(x1<0)return[];x0-=2;y0-=2;x1+=2;y1+=2;const GW=x1-x0+1,GH=y1-y0+1;let f=new Float32Array(GW*GH);
  for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const X=x0+i,Y=y0+j;f[j*GW+i]=X>=0&&Y>=0&&X<W&&Y<H&&owner[Y*W+X]===o?1:0}
  for(let pass=0;pass<2;pass++){const g=new Float32Array(GW*GH);for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){let s=0,ws=0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const I=i+a,J=j+b;if(I<0||J<0||I>=GW||J>=GH)continue;const wt=(a?1:2)*(b?1:2);s+=f[J*GW+I]*wt;ws+=wt}g[j*GW+i]=s/ws}f=g}
  const F=(i,j)=>f[j*GW+i],segs=[],pts=new Map();
  const ep=(e,i,j)=>{const a=F(i,j),b=F(i+1,j),c=F(i+1,j+1),d=F(i,j+1),t=(u,v)=>clamp((.5-u)/((v-u)||1e-6),0,1);
    if(e===0)return['h'+i+','+j,i+t(a,b),j];if(e===1)return['v'+(i+1)+','+j,i+1,j+t(b,c)];if(e===2)return['h'+i+','+(j+1),i+t(d,c),j+1];return['v'+i+','+j,i,j+t(a,d)]};
  for(let j=0;j<GH-1;j++)for(let i=0;i<GW-1;i++){const a=F(i,j),b=F(i+1,j),c=F(i+1,j+1),d=F(i,j+1);const k=(a>=.5?1:0)|(b>=.5?2:0)|(c>=.5?4:0)|(d>=.5?8:0);if(!k||k===15)continue;
    let L=MS[k];if(!L){const ctr=(a+b+c+d)/4>=.5;L=k===5?(ctr?[[0,1],[2,3]]:[[3,0],[1,2]]):(ctr?[[3,0],[1,2]]:[[0,1],[2,3]])}
    for(const [e1,e2] of L){const A=ep(e1,i,j),B=ep(e2,i,j),id=segs.length;segs.push({a:A,b:B,u:false});for(const P of [A,B]){if(!pts.has(P[0]))pts.set(P[0],[]);pts.get(P[0]).push(id)}}}
  const loops=[];for(let s0=0;s0<segs.length;s0++){if(segs[s0].u)continue;const loop=[];let s=s0,from=segs[s0].a[0];
    while(s!=null&&!segs[s].u){const S=segs[s];S.u=true;const P=S.a[0]===from?S.a:S.b,Q=S.a[0]===from?S.b:S.a;loop.push([P[1]+x0+.5,P[2]+y0+.5]);from=Q[0];const nx=(pts.get(Q[0])||[]).find(q=>!segs[q].u);s=nx==null?null:nx}
    if(loop.length>=4)loops.push(loop)}
  return loops}
/* the border outlines are traced in a worker thread, so the game never stalls while borders move; without workers they are traced here */
const smoothLoop=p=>{for(let it=0;it<2;it++){const q=[];for(let i=0;i<p.length;i++){const A=p[i],B=p[(i+1)%p.length];q.push([A[0]*.75+B[0]*.25,A[1]*.75+B[1]*.25],[A[0]*.25+B[0]*.75,A[1]*.25+B[1]*.75])}p=q}return p};
let borderWorker=null,borderBusy=0,borderAgain=false,borderLoops=null;
function borderWorkerInit(){if(borderWorker!==null)return;try{
  const src=`"use strict";let owner,W,H,N;const clamp=(v,a,b)=>v<a?a:v>b?b:v;const MS=${JSON.stringify(MS)};const smoothLoop=${smoothLoop.toString()};${nationLoops.toString()}
onmessage=e=>{const d=e.data;owner=d.owner;W=d.W;H=d.H;N=W*H;const out={};for(const o of d.ids)out[o]=nationLoops(o).map(smoothLoop);postMessage(out)}`;
  borderWorker=new Worker(URL.createObjectURL(new Blob([src],{type:'text/javascript'})));
  borderWorker.onmessage=e=>{borderBusy=0;borderLoops=e.data;drawBorderMesh();if(borderAgain){borderAgain=false;rebuildBorders()}};
  borderWorker.onerror=()=>{borderWorker=false;borderBusy=0;borderLoops=null;drawBorderMesh()}}catch(e){borderWorker=false}}
function rebuildBorders(){updateTerritoryTex();
  if(!borderMesh){borderMesh=new THREE.Mesh(new THREE.BufferGeometry(),borderMat);borderMesh.renderOrder=3;borderMesh.frustumCulled=false;scene.add(borderMesh)}
  borderMesh.visible=settings.borders;if(!settings.borders)return;
  borderWorkerInit();
  if(borderWorker){if(borderBusy&&performance.now()-borderBusy>4000){/* the worker never answered: trace here from now on */borderWorker.terminate();borderWorker=false;borderBusy=0}
    else{if(borderBusy){borderAgain=true;return}borderBusy=performance.now();borderWorker.postMessage({owner:owner.slice(),W,H,ids:nations.filter(n=>n.alive&&n.tiles>0).map(n=>n.id)});return}}
  borderLoops=null;drawBorderMesh()}
function drawBorderMesh(){if(!borderMesh)return;
  const pos=[],col=[];const RED=[.95,.18,.12];
  for(const n of nations){if(!n.alive||n.tiles<=0)continue;const o=n.id,c0=n.rgb,base=[LIN[c0[0]],LIN[c0[1]],LIN[c0[2]]],sel=o===selected,lw=sel?.08:.045,band=sel?.6:.36;
    for(let p of (borderLoops?borderLoops[o]||[]:nationLoops(o).map(smoothLoop))){
      const M=p.length,nrm=[];for(let i=0;i<M;i++){const A=p[(i-1+M)%M],B=p[(i+1)%M];const dx=B[0]-A[0],dy=B[1]-A[1],l=Math.hypot(dx,dy)||1;nrm.push([dy/l,-dx/l])}
      let inside=0,tot=0;for(let i=0;i<M;i+=Math.max(1,(M/12)|0)){const X=Math.floor(p[i][0]+nrm[i][0]*.6),Y=Math.floor(p[i][1]+nrm[i][1]*.6);tot++;if(X>=0&&Y>=0&&X<W&&Y<H&&owner[Y*W+X]===o)inside++}
      const sg=inside*2>=tot?1:-1;
      const warAt=i=>{const X=Math.floor(p[i][0]-nrm[i][0]*sg*.7),Y=Math.floor(p[i][1]-nrm[i][1]*sg*.7);if(X<0||Y<0||X>=W||Y>=H)return 0;const nb=owner[Y*W+X];return nb>=0&&n.wars.has(nb)?1:0};
      const at=(i,off)=>{const q=p[i%M],nn=nrm[i%M],x=q[0]+nn[0]*off*sg-W/2,z=q[1]+nn[1]*off*sg-H/2;return[x,surfY(x,z)+.045,z]};
      for(let i=0;i<M;i++){const war=warAt(i)||warAt((i+1)%M),lc=war?RED:base;
        const a0=at(i,.0),b0=at(i+1,.0),a1=at(i,lw),b1=at(i+1,lw),a2=at(i,lw+band),b2=at(i+1,lw+band);
        pos.push(...a0,...b0,...b1,...a0,...b1,...a1);for(let k=0;k<6;k++)col.push(lc[0],lc[1],lc[2],.95);
        pos.push(...a1,...b1,...b2,...a1,...b2,...a2);const A1=war?.4:.28;
        col.push(lc[0],lc[1],lc[2],A1,lc[0],lc[1],lc[2],A1,lc[0],lc[1],lc[2],0,lc[0],lc[1],lc[2],A1,lc[0],lc[1],lc[2],0,lc[0],lc[1],lc[2],0)}}}
  const g=freshGeo(borderMesh);g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('aCol',new THREE.Float32BufferAttribute(col,4));
}

/* ---------- picking (ray march over the heightfield) ---------- */
const raycaster=new THREE.Raycaster(),ndc=new THREE.Vector2();
function pickPoint(cx,cy){ndc.set(cx/innerWidth*2-1,-(cy/innerHeight)*2+1);raycaster.setFromCamera(ndc,cam);
  const o=raycaster.ray.origin,d=raycaster.ray.direction;let t=0,prev=0;const step=Math.max(.04,camDist*.004),maxT=camDist*5;
  while(t<maxT){const x=o.x+d.x*t,y=o.y+d.y*t,z=o.z+d.z*t;if(y<=surfY(x,z)){let a=prev,b=t;
      for(let k=0;k<10;k++){const m=(a+b)/2,mx=o.x+d.x*m,my=o.y+d.y*m,mz=o.z+d.z*m;if(my<=surfY(mx,mz))b=m;else a=m}
      return{x:o.x+d.x*b,z:o.z+d.z*b}}prev=t;t+=step}
  return null}
function pickTile(cx,cy){const p=pickPoint(cx,cy);if(!p)return -1;const x=Math.floor(p.x+W/2),y=Math.floor(p.z+H/2);if(x<0||y<0||x>=W||y>=H)return -1;return y*W+x}
const project=(x,y,z)=>{const v=V3.set(x,y,z).project(cam);return[(v.x+1)/2*ov.width,(1-v.y)/2*ov.height,v.z]};
