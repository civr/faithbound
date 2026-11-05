"use strict";
/* Faithbound — beyond the world: colonies on the Moon and Mars, which the god can terraform */

let colonies=[],planets={moon:{terra:0,life:0},mars:{terra:0,life:0}};
const PLANETS={moon:{label:'The Moon',r:1,base:[150,148,142],seed:11},mars:{label:'Mars',r:1.25,base:[176,92,58],seed:23}};
const COLONY_NAMES=['Tranquility','Serenity','New Dawn','Harbor','Olympus','Arcadia','Hellas','Elysium','Copernicus','Tycho','Utopia','Valles','Hope','Ares','Selene','Kepler'];

/* ---------- the simulation: launches, colonies, slow terraforming ---------- */
function spaceTick(){
  for(const n of nations){if(!n.alive||n.era<7||!n.techs||!n.techs.includes('starships'))continue;
    const mine=colonies.filter(c=>c.nid===n.id);if(mine.length>=4||rng()>.02)continue;
    const pl=!mine.some(c=>c.planet==='moon')?'moon':rng()<.6?'mars':'moon';launchRocket(n);
    const c={planet:pl,nid:n.id,pop:2,founded:year,name:(()=>{let nm;for(let t=0;t<20;t++){nm=COLONY_NAMES[(rng()*COLONY_NAMES.length)|0];if(!colonies.some(x=>x.name===nm))return nm}return nm+' '+ROMAN[2+colonies.length%9]})(),lat:(rng()-.5)*1.6,lon:rng()*6.283,free:false};
    colonies.push(c);log(`${n.name} founded ${c.name} on ${PLANETS[pl].label.replace('The ','the ')}.`,'era');milestone(pl==='moon'?'moon':'mars',pl==='moon'?'A town on the Moon':'Life on Mars',`${n.name} built the first settlement there.`)}
  for(const c of colonies){const P=planets[c.planet],cap=40+P.terra*1500;c.pop=Math.min(cap,c.pop+c.pop*(.012+P.terra*.03)*(1-c.pop/cap)+.05);
    const n=nations[c.nid];if(n&&n.alive&&n.techs&&n.techs.includes('terraform')&&P.terra<.6)P.terra=Math.min(.6,P.terra+.00012);
    if(!c.free&&c.pop>250&&rng()<.004){c.free=true;log(`${c.name} on ${PLANETS[c.planet].label.replace('The ','the ')} declared itself free of ${n?n.name:'Earth'}.`,'war')}}
  for(const k in planets){const P=planets[k];if(P.terra>.55)P.life=Math.min(1,P.life+.004);if(P.terra>.25&&!P.said){P.said=1;log(`The air of ${PLANETS[k].label.replace('The ','the ')} can now be breathed for a few minutes at a time.`,'sky')}}}

/* ---------- planet textures, drawn from noise and terraforming ---------- */
const SPACE={scene:null,cam:null,mesh:null,atmo:null,domes:null,stars:null,cur:'moon',yaw:0,pitch:.3,dist:3.4,texKey:''};
function planetTexture(k){const P=PLANETS[k],T=planets[k],nz=makeNoise(P.seed),nz2=makeNoise(P.seed+5),W_=512,H_=256,cv=document.createElement('canvas');cv.width=W_;cv.height=H_;
  const x=cv.getContext('2d'),img=x.createImageData(W_,H_),d=img.data,sea=T.terra*.55;
  for(let j=0;j<H_;j++){const lat=(j/H_-.5)*Math.PI;for(let i=0;i<W_;i++){const lon=i/W_*Math.PI*2,cx=Math.cos(lon)*Math.cos(lat)*2.2,cy=Math.sin(lon)*Math.cos(lat)*2.2+Math.sin(lat)*1.7;
      let e=nz(cx+5,cy+5,6);const det=nz2(cx*4+9,cy*4+9,3);let r=P.base[0],g=P.base[1],b=P.base[2];const sh=.65+e*.6+det*.15;r*=sh;g*=sh;b*=sh;
      if(k==='moon'){const cr=nz2(cx*9,cy*9,2);if(cr>.62){const t=(cr-.62)*4;r*=1-t*.35;g*=1-t*.35;b*=1-t*.35}}
      else{if(e<.42){r*=.72;g*=.7;b*=.72}if(Math.abs(lat)>1.25-T.terra*.3){r=232;g=236;b=240}}
      if(T.terra>0){const wet=e<sea;if(wet){const dpt=(sea-e)/Math.max(.01,sea);r=lerp(r,30,.85);g=lerp(g,70+30*(1-dpt),.85);b=lerp(b,120+40*(1-dpt),.85)}
        else{const gr=clamp((T.terra-.3)*2*(1-Math.abs(lat)/1.6),0,1)*clamp((sea+.18-e)*6,0,1);r=lerp(r,70,gr);g=lerp(g,110,gr);b=lerp(b,55,gr)}}
      const q=(j*W_+i)*4;d[q]=clamp(r,0,255);d[q+1]=clamp(g,0,255);d[q+2]=clamp(b,0,255);d[q+3]=255}}
  x.putImageData(img,0,0);const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t}
function ensureSpace(){if(SPACE.scene)return;const S=SPACE;S.scene=new THREE.Scene();S.scene.background=new THREE.Color(0x02030a);
  S.cam=new THREE.PerspectiveCamera(40,innerWidth/innerHeight,.01,200);
  S.scene.add(new THREE.AmbientLight(0x404858,.55));const sun=new THREE.DirectionalLight(0xfff4e0,2.4);sun.position.set(5,2,3);S.scene.add(sun);
  S.mesh=new THREE.Mesh(new THREE.SphereGeometry(1,96,64),new THREE.MeshStandardMaterial({roughness:.95}));S.scene.add(S.mesh);
  S.atmo=new THREE.Mesh(new THREE.SphereGeometry(1.04,64,48),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{op:{value:0}},
    vertexShader:'varying vec3 vN;varying vec3 vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader:'uniform float op;varying vec3 vN;varying vec3 vV;void main(){float f=pow(1.-max(dot(vN,vV),0.),2.5);gl_FragColor=vec4(vec3(.45,.7,1.)*f*op,f*op);}'}));S.scene.add(S.atmo);
  S.domes=new THREE.Group();S.mesh.add(S.domes);
  const sp=[];const r=mulberry32(5);for(let i=0;i<2500;i++){const u=r()*2-1,a=r()*6.283,s=Math.sqrt(1-u*u);sp.push(Math.cos(a)*s*80,u*80,Math.sin(a)*s*80)}
  const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));S.stars=new THREE.Points(sg,new THREE.PointsMaterial({color:0xffffff,size:.25,sizeAttenuation:true}));S.scene.add(S.stars)}
const DOME_G=new THREE.SphereGeometry(1,14,8,0,Math.PI*2,0,Math.PI/2),DOME_M=new THREE.MeshStandardMaterial({color:0xdff4ff,roughness:.15,metalness:.4,transparent:true,opacity:.85}),GLOW_M=new THREE.MeshBasicMaterial({color:0x9ff4ff});
function refreshPlanet(){const S=SPACE,k=S.cur,P=planets[k],key=k+'|'+Math.round(P.terra*40);ensureSpace();
  if(S.texKey!==key){if(S.mesh.material.map)S.mesh.material.map.dispose();S.mesh.material.map=planetTexture(k);S.mesh.material.needsUpdate=true;S.texKey=key}
  S.mesh.scale.setScalar(PLANETS[k].r);S.atmo.scale.setScalar(PLANETS[k].r);S.atmo.material.uniforms.op.value=P.terra*1.4+(k==='mars'?.25:0);
  S.domes.clear();for(const c of colonies.filter(c=>c.planet===k)){const n=nations[c.nid],g=new THREE.Group(),s=.012+Math.min(.025,Math.sqrt(c.pop)*.0015);
    const v=new THREE.Vector3(Math.cos(c.lat)*Math.cos(c.lon),Math.sin(c.lat),Math.cos(c.lat)*Math.sin(c.lon));g.position.copy(v);g.lookAt(v.clone().multiplyScalar(2));g.rotateX(Math.PI/2);
    for(let q=0;q<Math.min(7,1+Math.floor(c.pop/30));q++){const m=new THREE.Mesh(DOME_G,DOME_M);const a=q*2.4,rr=q?s*1.4:0;m.position.set(Math.cos(a)*rr,0,Math.sin(a)*rr);m.scale.setScalar(q?s*.6:s);g.add(m)}
    const fl=new THREE.Mesh(new THREE.BoxGeometry(s*.15,s*1.6,s*.15),GLOW_M);fl.position.y=s*.8;g.add(fl);
    const fm=new THREE.Mesh(new THREE.PlaneGeometry(s*.9,s*.6),new THREE.MeshBasicMaterial({color:n?n.color:'#ffffff',side:THREE.DoubleSide}));fm.position.set(s*.45,s*1.4,0);g.add(fm);S.domes.add(g)}
  renderSpacePanel()}
let spaceView=false;
function openSpace(k){ensureSpace();spaceView=true;SPACE.cur=k||SPACE.cur;closeSheet();$('#nationCard').hidden=true;document.body.classList.add('inspace');refreshPlanet()}
function closeSpace(){spaceView=false;document.body.classList.remove('inspace');$('#spacePanel').hidden=true}
function renderSpace(dt){const S=SPACE;S.yaw+=dt*.05;const r=S.dist*PLANETS[S.cur].r;S.cam.aspect=innerWidth/innerHeight;S.cam.updateProjectionMatrix();
  S.cam.position.set(Math.cos(S.yaw)*Math.cos(S.pitch)*r,Math.sin(S.pitch)*r,Math.sin(S.yaw)*Math.cos(S.pitch)*r);S.cam.lookAt(0,0,0);renderer.render(S.scene,S.cam)}
function renderSpacePanel(){const el=$('#spacePanel');if(!el)return;el.hidden=!spaceView;if(!spaceView)return;const k=SPACE.cur,P=planets[k],cs=colonies.filter(c=>c.planet===k);
  el.innerHTML=`<div class="row" style="gap:6px"><button class="ib" data-sp="earth">Earth</button><button class="ib" data-sp="moon" aria-pressed="${k==='moon'}">The Moon</button><button class="ib" data-sp="mars" aria-pressed="${k==='mars'}">Mars</button></div>
  <h3>${PLANETS[k].label}</h3><div><div class="row" style="justify-content:space-between"><span class="lab">Terraformed</span><span class="lab">${Math.round(P.terra*100)}%</span></div><div class="prog"><i style="width:${P.terra*100}%;background:#6fc0a0"></i></div></div>
  <p class="note">${cs.length?cs.map(c=>`<b>${esc(c.name)}</b> · ${esc(nations[c.nid]?nations[c.nid].name:'?')}${c.free?' (free)':''} · ${fmtPop(c.pop)}`).join('<br>'):'No one lives here yet. Nations in the Future age with Starships will come.'}</p>
  <div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn primary" data-sp="terra">Terraform · 40</button><button class="btn" data-sp="blessc"${cs.length?'':' disabled'}>Bless the colonies · 20</button><button class="btn" data-sp="meteors"${cs.length?'':' disabled'}>Meteor shower · 30</button></div>`}
document.addEventListener('click',e=>{const b=e.target.closest('[data-sp]');if(!b)return;const a=b.dataset.sp,k=SPACE.cur;
  if(a==='earth'){closeSpace();return}if(a==='moon'||a==='mars'){SPACE.cur=a;refreshPlanet();return}
  if(typeof coopGuest==='function'&&coopGuest()){coopAct('space',{a,k});return}spaceAction(a,k)});
function spaceAction(a,k){const P=planets[k];if(!P||!PLANETS[k])return false;const ok=b=>{if(spaceView&&typeof refreshPlanet==='function')(spaceView&&refreshPlanet());return b};
  if(a==='terra'){if(P.terra>=1){say('This world is already as alive as Earth.');return}if(!spend(40))return;P.terra=Math.min(1,P.terra+.08);log(`You breathed on ${PLANETS[k].label.replace('The ','the ')}: ice melted and thin air thickened.`,'sky');sfx('bless');(spaceView&&refreshPlanet())}
  if(a==='blessc'){if(!spend(20))return;for(const c of colonies)if(c.planet===k)c.pop*=1.3;log(`You blessed the colonies of ${PLANETS[k].label.replace('The ','the ')}.`,'life');(spaceView&&refreshPlanet())}
  if(a==='meteors'){if(!spend(30))return;const cs=colonies.filter(c=>c.planet===k);const c=cs[(rng()*cs.length)|0];if(c){c.pop*=.4;log(`Meteors struck ${c.name}. The domes cracked and many died.`,'doom')}(spaceView&&refreshPlanet())}return true}
/* while in space, dragging turns the planet and the wheel zooms */
{const gl=renderer.domElement;let drag=null;
  gl.addEventListener('pointerdown',e=>{if(!spaceView)return;drag={x:e.clientX,y:e.clientY};e.stopImmediatePropagation()},true);
  gl.addEventListener('pointermove',e=>{if(!spaceView||!drag)return;SPACE.yaw+=(e.clientX-drag.x)*.006;SPACE.pitch=clamp(SPACE.pitch+(e.clientY-drag.y)*.005,-1.3,1.3);drag={x:e.clientX,y:e.clientY};e.stopImmediatePropagation()},true);
  gl.addEventListener('pointerup',e=>{if(!spaceView)return;drag=null;e.stopImmediatePropagation()},true);
  gl.addEventListener('wheel',e=>{if(!spaceView)return;SPACE.dist=clamp(SPACE.dist*Math.exp(e.deltaY*.001),1.6,8);e.preventDefault();e.stopImmediatePropagation()},{capture:true,passive:false})}
