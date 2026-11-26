"use strict";
/* Faithbound — the open sea, as in the ocean mockup. Four cascades of FFT waves are worked out on the graphics card every frame from a
   wind-sea spectrum (JONSWAP) baked once at the start: the long swell, the waves, the chop and the ripples. The sea's surface takes its
   heave from the long cascades and its light from all four: sharper sun glitter, crests that glow green-blue where the sun shines through
   them, and white horses where the waves break. Lakes and the shallows stay calm. It needs WebGL2 with float render targets; without
   them, or in the pixel look, the sea is drawn as before. */

const OCN={ok:null,N:128,M:64,L:[6,1.6,.42,.11],wind:9,chop:1.15,t0:performance.now(),rts:null,disp:[],deriv:[],h0:null,on:false,frame:0};
const OCU={uOcean:{value:0},uOL:{value:new THREE.Vector4(...OCN.L)},uOAmp:{value:.02},uOEx:{value:2.2},
  uOD0:{value:null},uOD1:{value:null},uOD2:{value:null},uOD3:{value:null},uON0:{value:null},uON1:{value:null},uON2:{value:null},uON3:{value:null},
  uOSun:{value:new THREE.Vector3(0,1,0)},uOSunC:{value:new THREE.Color(1,1,1)},uSkT:skyU.top,uSkH:skyU.hor,uSkC:skyU.sunCol};
function oceanSupported(){if(OCN.ok!==null)return OCN.ok;try{OCN.ok=!!(renderer.capabilities.isWebGL2&&renderer.extensions.get('EXT_color_buffer_float'))}catch(e){OCN.ok=false}return OCN.ok}

/* ---------- the spectrum, baked once ---------- */
function ocnMulberry(s){return function(){s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const OCN_NORM={};function ocnSpread(s){if(OCN_NORM[s])return OCN_NORM[s];let a=0;for(let i=0;i<720;i++){const th=-Math.PI+(i+.5)/720*Math.PI*2;a+=Math.pow(Math.cos(th/2),2*s)}return OCN_NORM[s]=1/(a*Math.PI*2/720)}
function ocnJonswap(w,U,F,gamma){const G=9.81,a=.076*Math.pow(U*U/(F*G),.22),wp=22*Math.pow(G*G/(U*F),1/3),sg=w<=wp?.07:.09,r=Math.exp(-((w-wp)**2)/(2*sg*sg*wp*wp));
  return a*G*G/Math.pow(w,5)*Math.exp(-1.25*Math.pow(wp/w,4))*Math.pow(gamma,r)}
function ocnBake(){const N=OCN.N,NC=4,AW=N*NC,out=new Float32Array(AW*N*4),rng=ocnMulberry(4242),gauss=()=>{const u=Math.max(1e-9,rng()),v=rng();return Math.sqrt(-2*Math.log(u))*Math.cos(Math.PI*2*v)};
  const wdir=.6,sdir=wdir+.8,U=OCN.wind,F=150000,G=9.81;let hs=0;
  for(let c=0;c<NC;c++){const L=OCN.L[c]*OCN.M,dk=Math.PI*2/L,lo=c===0?dk*.5:Math.PI*2/L*6/(OCN.L[c-1]/OCN.L[c])*(OCN.L[c-1]/OCN.L[c]),hi=c<NC-1?Math.PI*2/(OCN.L[c+1]*OCN.M)*6:1e9;
    const lo2=c===0?dk*.5:Math.PI*2/(OCN.L[c]*OCN.M)*6,A=new Float32Array(N*N*2);
    for(let iz=0;iz<N;iz++)for(let ix=0;ix<N;ix++){const kx=(ix<N/2?ix:ix-N)*dk,kz=(iz<N/2?iz:iz-N)*dk,k=Math.hypot(kx,kz),g1=gauss(),g2=gauss(),j=(iz*N+ix)*2;
      if(k<lo2||k>=hi||!k)continue;const w=Math.sqrt(G*k),th=Math.atan2(kz,kx);
      let S=ocnJonswap(w,U,F,3.3)*ocnSpread(10)*Math.pow(Math.abs(Math.cos((th-wdir)/2)),20)+ocnJonswap(w,U*.8,F*5,5)*.3*ocnSpread(26)*Math.pow(Math.abs(Math.cos((th-sdir)/2)),52);
      S*=G/(2*w)/k*Math.exp(-k*k*.0004);const amp=.5*Math.sqrt(S)*dk;A[j]=g1*amp;A[j+1]=g2*amp;hs+=2*amp*amp*2}
    for(let iz=0;iz<N;iz++)for(let ix=0;ix<N;ix++){const j=iz*N+ix,m=(((N-iz)%N)*N+(N-ix)%N)*2,o=(iz*AW+c*N+ix)*4;out[o]=A[j*2];out[o+1]=A[j*2+1];out[o+2]=A[m];out[o+3]=-A[m+1]}}
  OCU.uOAmp.value=Math.max(.004,2*Math.sqrt(hs)/OCN.M);
  if(!OCN.h0){OCN.h0=new THREE.DataTexture(out,AW,N,THREE.RGBAFormat,THREE.FloatType);OCN.h0.magFilter=OCN.h0.minFilter=THREE.NearestFilter}else OCN.h0.image.data=out;OCN.h0.needsUpdate=true}

/* ---------- the passes ---------- */
const OCN_VS='void main(){gl_Position=vec4(position.xy,0.,1.);}';
const OCN_HEAD=`precision highp float;const float NN=${OCN.N}.;uniform vec2 uSize;vec2 cmul(vec2 a,vec2 b){return vec2(a.x*b.x-a.y*b.y,a.x*b.y+a.y*b.x);}vec2 pack(vec2 a,vec2 b){return vec2(a.x-b.y,a.y+b.x);}`;
function ocnMat(fs,u){return new THREE.ShaderMaterial({vertexShader:OCN_VS,fragmentShader:OCN_HEAD+fs,uniforms:Object.assign({uSize:{value:new THREE.Vector2(OCN.N*4,OCN.N)}},u),depthTest:false,depthWrite:false,toneMapped:false})}
let OCP=null;
function ocnInit(){if(OCP)return true;if(!oceanSupported())return false;const N=OCN.N,AW=N*4;
  const rt=(w,h,half,mip)=>{const r=new THREE.WebGLRenderTarget(w,h,{type:half?THREE.HalfFloatType:THREE.FloatType,format:THREE.RGBAFormat,depthBuffer:false,stencilBuffer:false,
      minFilter:mip?THREE.LinearMipmapLinearFilter:THREE.NearestFilter,magFilter:half?THREE.LinearFilter:THREE.NearestFilter,wrapS:half?THREE.RepeatWrapping:THREE.ClampToEdgeWrapping,wrapT:half?THREE.RepeatWrapping:THREE.ClampToEdgeWrapping});
    r.texture.generateMipmaps=!!mip;if(mip)r.texture.anisotropy=4;return r};
  OCN.rts={A0:rt(AW,N),A1:rt(AW,N),B0:rt(AW,N),B1:rt(AW,N)};for(let c=0;c<4;c++){OCN.disp.push(rt(N,N,true,true));OCN.deriv.push(rt(N,N,true,true))}
  ocnBake();
  const spec=ocnMat(`uniform sampler2D uH0;uniform float uTime,uSet;uniform vec4 uL;
    void main(){vec2 px=floor(gl_FragCoord.xy);float c=floor(px.x/NN);float ix=px.x-c*NN,iz=px.y;float L=c<.5?uL.x:c<1.5?uL.y:c<2.5?uL.z:uL.w;
      float kx=(ix<NN*.5?ix:ix-NN)*6.2831853/L,kz=(iz<NN*.5?iz:iz-NN)*6.2831853/L,kl=max(length(vec2(kx,kz)),1e-6);float ph=sqrt(9.81*kl)*uTime;vec2 e=vec2(cos(ph),sin(ph));
      vec4 H=texture2D(uH0,(px+.5)/uSize);vec2 h=cmul(H.xy,e)+cmul(H.zw,vec2(e.x,-e.y));vec2 ih=vec2(-h.y,h.x);
      if(uSet<.5)gl_FragColor=vec4(pack(ih*(kx/kl),h),pack(ih*(kz/kl),ih*kx));
      else gl_FragColor=vec4(pack(ih*kz,h*(-kx*kx/kl)),pack(h*(-kz*kz/kl),h*(-kx*kz/kl)));}`,{uH0:{value:OCN.h0},uTime:{value:0},uSet:{value:0},uL:{value:new THREE.Vector4(...OCN.L.map(l=>l*OCN.M))}});
  /* Stockham inverse FFT, one stage per pass, gathered per output texel */
  const fft=ocnMat(`uniform sampler2D uSrc;uniform float uNs,uVert;
    vec4 at(float c,float x,float y){return texture2D(uSrc,(vec2(c*NN+x,y)+.5)/uSize);}
    void main(){vec2 px=floor(gl_FragCoord.xy);float c=floor(px.x/NN);float lx=px.x-c*NN,ly=px.y;float o=uVert>.5?ly:lx;
      float b2=mod(o,2.*uNs);float k=b2<uNs?b2:b2-uNs;float sg=b2<uNs?1.:-1.;float t=floor(o/(2.*uNs))*uNs+k;
      vec4 v0,v1;if(uVert>.5){v0=at(c,lx,t);v1=at(c,lx,t+NN*.5);}else{v0=at(c,t,ly);v1=at(c,t+NN*.5,ly);}
      float ang=3.14159265*k/uNs;vec2 w=vec2(cos(ang),sin(ang));v1=vec4(cmul(v1.xy,w),cmul(v1.zw,w));gl_FragColor=v0+sg*v1;}`,{uSrc:{value:null},uNs:{value:1},uVert:{value:0}});
  const asm=ocnMat(`uniform sampler2D uA0,uA1;uniform float uC,uOut,uChop,uInvM,uThr;
    void main(){vec2 uv=(vec2(uC*NN,0.)+floor(gl_FragCoord.xy)+.5)/uSize;vec4 a=texture2D(uA0,uv),b=texture2D(uA1,uv);
      float dxdx=b.y*uChop,dzdz=b.z*uChop,dxdz=b.w*uChop,J=(1.+dxdx)*(1.+dzdz)-dxdz*dxdz;
      if(uOut<.5)gl_FragColor=vec4(a.x*uChop*uInvM,a.y*uInvM,a.z*uChop*uInvM,clamp((uThr-J)*2.2,0.,1.));else gl_FragColor=vec4(a.w,b.x,dxdx,dzdz);}`,
    {uA0:{value:null},uA1:{value:null},uC:{value:0},uOut:{value:0},uChop:{value:OCN.chop},uInvM:{value:1/OCN.M},uThr:{value:.62}});
  const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),spec);quad.frustumCulled=false;const sc=new THREE.Scene();sc.add(quad);
  OCP={spec,fft,asm,quad,sc,cam:new THREE.Camera()};
  for(let c=0;c<4;c++){OCU['uOD'+c].value=OCN.disp[c].texture;OCU['uON'+c].value=OCN.deriv[c].texture}
  return true}
function ocnPass(mat,target){OCP.quad.material=mat;renderer.setRenderTarget(target);renderer.render(OCP.sc,OCP.cam)}
function oceanUpdate(now){const want=settings.ocean!==false&&!LK.pixel&&!(typeof PERF!=='undefined'&&perfOn()&&PERF.tier>=3);
  if(!want||!ocnInit()){OCU.uOcean.value=0;OCN.on=false;return}
  OCN.on=true;OCU.uOcean.value=1;/* the waves are worked out at most 30 times a second */if(now-(OCN.last||0)<32)return;OCN.last=now;const R=OCN.rts,P=OCP,prevT=renderer.getRenderTarget(),ac=renderer.autoClear,xr=renderer.xr.enabled;renderer.autoClear=false;renderer.xr.enabled=false;
  try{const t=((now-OCN.t0)/1000)%3000;P.spec.uniforms.uTime.value=t;
    P.spec.uniforms.uSet.value=0;ocnPass(P.spec,R.A0);P.spec.uniforms.uSet.value=1;ocnPass(P.spec,R.A1);
    for(const [a,b] of [[R.A0,R.B0],[R.A1,R.B1]]){let src=a,dst=b;
      for(const vert of [0,1])for(let ns=1;ns<OCN.N;ns*=2){P.fft.uniforms.uSrc.value=src.texture;P.fft.uniforms.uNs.value=ns;P.fft.uniforms.uVert.value=vert;ocnPass(P.fft,dst);const q=src;src=dst;dst=q}}
    /* an even number of stages: the results are back in A0 and A1 */
    P.asm.uniforms.uA0.value=R.A0.texture;P.asm.uniforms.uA1.value=R.A1.texture;
    for(let c=0;c<4;c++){P.asm.uniforms.uC.value=c;P.asm.uniforms.uOut.value=0;ocnPass(P.asm,OCN.disp[c]);P.asm.uniforms.uOut.value=1;ocnPass(P.asm,OCN.deriv[c])}}
  finally{renderer.setRenderTarget(prevT);renderer.autoClear=ac;renderer.xr.enabled=xr}
  OCU.uOSun.value.copy(skyU.sunDir.value);OCU.uOSunC.value.copy(skyU.sunCol.value)}
{const _rf=renderFrame;renderFrame=function(){try{if(typeof floatDepth==='function')floatDepth()}catch(e){}try{oceanUpdate(performance.now())}catch(e){OCN.ok=false;OCU.uOcean.value=0;console.warn('ocean',e)}return _rf.apply(this,arguments)}}

/* ---------- the sea's surface ---------- */
const OCN_GLSL=`uniform vec3 uSkT,uSkH,uSkC;uniform float uOcean,uOAmp,uOEx;uniform vec4 uOL;uniform sampler2D uOD0,uOD1,uOD2,uOD3,uON0,uON1,uON2,uON3;uniform vec3 uOSun,uOSunC;`;
{const prev=waterMat.onBeforeCompile;waterMat.onBeforeCompile=function(sh,r){prev.call(this,sh,r);Object.assign(sh.uniforms,OCU);
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\n'+OCN_GLSL)
      .replace('#include <project_vertex>',`if(uOcean>.5){vec2 op=(modelMatrix*vec4(transformed,1.)).xz;float od=length(cameraPosition-vec3(op.x,0.,op.y));
        /* the long swell and the waves lift the sea; the short cascades only light it, the mesh is too coarse for them */
        float hy=texture2D(uOD0,op/uOL.x).y+texture2D(uOD1,op/uOL.y).y*(1.-smoothstep(uOL.y*8.,uOL.y*20.,od));
        transformed.y+=hy*uOEx*smoothstep(0.,.25,aDepth)*(1.-smoothstep(60.,160.,od));}
      #include <project_vertex>`);
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\n'+OCN_GLSL)
      .replace('#include <roughnessmap_fragment>',`
      float oFoam=0.,oH=0.,oCalm=0.;vec3 oN=vec3(0.,1.,0.);
      if(uOcean>.5){float camO=length(vWP-cameraPosition),deepO=smoothstep(.05,.45,vDepth)*(1.-vIce);
        vec4 d0=texture2D(uOD0,vWP.xz/uOL.x),d1=texture2D(uOD1,vWP.xz/uOL.y),d2=texture2D(uOD2,vWP.xz/uOL.z);
        oH=(d0.y+d1.y+d2.y)/uOAmp;
        /* white horses where the cascades fold over, and nowhere near the shore */
        oFoam=clamp((d0.w*.5+d1.w+d2.w*.55)*(.45+vn(vWP.xz*14.+uTime*.2)*.9)-.15,0.,1.)*deepO*(1.-smoothstep(25.,90.,camO));
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.92,.96,.97),oFoam*.85);}
      #include <roughnessmap_fragment>
      if(uOcean>.5)roughnessFactor=mix(roughnessFactor,.08,(1.-vIce)*(1.-oFoam)*smoothstep(.15,.6,vDepth));`)
      .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      if(uOcean>.5&&uLite<.5){float camO=length(vWP-cameraPosition),calm=smoothstep(.02,.35,vDepth)*(1.-vIce);
        vec4 n0=texture2D(uON0,vWP.xz/uOL.x),n1=texture2D(uON1,vWP.xz/uOL.y),n2=texture2D(uON2,vWP.xz/uOL.z),n3=texture2D(uON3,vWP.xz/uOL.w);
        float f3=1.-smoothstep(uOL.w*40.,uOL.w*160.,camO),f2=1.-smoothstep(uOL.z*70.,uOL.z*260.,camO);
        vec2 sl=n0.xy+n1.xy+n2.xy*f2+n3.xy*f3;float jx=n0.z+n1.z+n2.z*f2+n3.z*f3,jz=n0.w+n1.w+n2.w*f2+n3.w*f3;
        float sk=1.+stormF(vWP.xz)*1.4;vec3 wn=normalize(vec3(-sl.x*sk/(1.+jx),1.,-sl.y*sk/(1.+jz)));wn=normalize(mix(vec3(0.,1.,0.),wn,calm*(1.-smoothstep(80.,260.,camO)*.7)));
        normal=normalize(mix(normal,(viewMatrix*vec4(wn,0.)).xyz,.92));oN=wn;oCalm=calm;
        /* sunlight through the crests: green-blue, strongest looking towards the sun */
        vec3 Vw=normalize(cameraPosition-vWP);vec3 hv=normalize(vec3(-uOSun.x,0.,-uOSun.z)+1e-5);float into=pow(max(dot(-Vw,-hv)*.5+.5,0.),3.);
        float Fr=.02+.98*pow(1.-max(dot(wn,Vw),0.),5.);
        totalEmissiveRadiance+=vec3(.02,.17,.14)*uOSunC*(max(oH,0.)*.22+.03)*(.35+into)*(1.-Fr)*calm*(1.-oFoam)*step(.0,uOSun.y);}`);
    /* the open sea mirrors the sky it lies under, brighter towards the horizon, with a hard glitter of sun on the waves */
    sh.fragmentShader=sh.fragmentShader.replace(/gl_FragColor\s*=\s*vec4\(\s*outgoingLight\s*,\s*diffuseColor\.a\s*\);/,`
      if(uOcean>.5&&oCalm>0.){vec3 Vw=normalize(cameraPosition-vWP);vec3 Rw=reflect(-Vw,oN);Rw.y=abs(Rw.y);
        vec3 sk=mix(uSkH,uSkT,pow(clamp(Rw.y,0.,1.),.55));float su=max(dot(Rw,normalize(uOSun)),0.);sk=pow(sk,vec3(2.2))+pow(uSkC,vec3(2.2))*pow(su,10.)*.22;
        float Fr=.02+.98*pow(1.-max(dot(oN,Vw),0.),5.);float k=oCalm*(1.-oFoam)*(1.-vIce);
        outgoingLight=mix(outgoingLight,sk*.9,Fr*k*.85);
        vec3 Hh=normalize(Vw+normalize(uOSun));float a2=.0036+.004*smoothstep(20.,120.,length(vWP-cameraPosition));float nh=max(dot(oN,Hh),0.),dd=nh*nh*(a2-1.)+1.;
        outgoingLight+=uOSunC*min(a2/(3.14159*dd*dd),300.)*Fr*.35*max(dot(oN,normalize(uOSun)),0.)*k*step(0.,uOSun.y);}
      gl_FragColor=vec4(outgoingLight,diffuseColor.a);`);
  };
  const ck=waterMat.customProgramCacheKey;waterMat.customProgramCacheKey=function(){return (ck?ck.call(this):'')+'|ocean1'};waterMat.needsUpdate=true}
