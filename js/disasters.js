"use strict";
/* Faithbound — disasters: thunderstorms, lightning, hurricanes, blizzards, wildfires, famine, epidemics, earthquakes, tsunamis */
let storms=[],fires=new Map(),bolts=[],waves=[],scorched=null,colorDirty=false;
const DIS_LEVEL={off:0,mild:.4,normal:1,wild:2.5};
/* world mood: how much happens at once. Calm keeps wars, prayers and dying rare so the world can breathe */
const MOOD={calm:{war:.3,cap:3,pray:[24,44],prayMax:2,ev:[110,230],dis:.45,riot:.4,ally:.45},lively:{war:.65,cap:6,pray:[12,24],prayMax:3,ev:[65,130],dis:.75,riot:.7,ally:.75},turbulent:{war:1,cap:999,pray:[6,16],prayMax:4,ev:[45,115],dis:1,riot:1,ally:1}};
const mood=()=>MOOD[settings.mood||'calm']||MOOD.calm;
function warCount(){let c=0;for(const n of nations)if(n.alive)c+=n.wars.size;return c/2}
function warRoom(slack){return warCount()<mood().cap+(slack||0)}
const dLevel=()=>{const v=DIS_LEVEL[settings.disasters||'normal'];return (v==null?1:v)*mood().dis};
const DIS_ADJ=['Grey','Red','Sweating','Spotted','Burning','Pale','Black','Shaking','Weeping','Bone','Marsh','Winter'];
const DIS_NOUN=['Fever','Cough','Pox','Flux','Sickness','Rot','Chill','Blight'];
const diseaseName=()=>`${DIS_ADJ[(rng()*DIS_ADJ.length)|0]} ${DIS_NOUN[(rng()*DIS_NOUN.length)|0]}`;
const medicine=n=>{const t=n.techs||[];return(t.includes('genetics')?.15:t.includes('medicine')?.35:1)*(n.era<3?1:.85)};
const FUEL={4:.45,5:1,6:.55,8:.8,9:.35,3:.1};
function tileAt(x,z){const tx=Math.floor(x+W/2),ty=Math.floor(z+H/2);return tx<0||ty<0||tx>=W||ty>=H?-1:ty*W+tx}
function nationAt(x,z){const i=tileAt(x,z);return i>=0&&owner[i]>=0?nations[owner[i]]:null}
function moistAt(i){return clamp(baseMoist[i]+(climate.rain-.5)*.7+moistD[i],0,1)}
function resetDisasters(){storms=[];fires=new Map();bolts=[];waves=[];scorched=new Uint8Array(N);colorDirty=false}
function nationsInRadius(x,z,r){const ids=new Set();for(let q=0;q<12;q++){const a=q/12*6.283,d=q%2?r*.5:r*.9;const n=nationAt(x+Math.cos(a)*d,z+Math.sin(a)*d);if(n)ids.add(n.id)}const c=nationAt(x,z);if(c)ids.add(c.id);return[...ids].map(i=>nations[i]).filter(n=>n.alive)}
function cityAtTile(i){const x=i%W,y=(i/W)|0;for(const n of nations){if(!n.alive)continue;const c=n.cities.find(c=>c.x===x&&c.y===y);if(c)return{n,c}}return null}

/* ---------- storms ---------- */
const STORM_NAME={thunder:'Thunderstorm',hurricane:'Hurricane',blizzard:'Blizzard'};
function spawnStorm(kind,x,z,god){
  if(storms.filter(s=>s.kind!=='shower').length>=(god?10:5)||(!god&&kind==='hurricane'&&storms.some(s=>s.kind==='hurricane')))return null;
  const S={kind,x,z,seed:rng()*1000,t:0,life:kind==='hurricane'?45:kind==='blizzard'?32:24,r:kind==='hurricane'?5.5:kind==='blizzard'?4.5:3,vx:0,vz:0,bolt:1,landfall:false};
  const sp=kind==='hurricane'?.45:.3;
  if(kind==='hurricane'){const d=Math.hypot(x,z)||1;S.vx=-x/d*sp+(rng()-.5)*.2;S.vz=-z/d*sp+(rng()-.5)*.2}else{const a=rng()*6.28;S.vx=Math.cos(a)*sp;S.vz=Math.sin(a)*sp}
  storms.push(S);const n=nationAt(x,z),where=n?` over ${n.name}`:'';
  log(god?`You summoned a ${STORM_NAME[kind].toLowerCase()}${where}.`:`A ${STORM_NAME[kind].toLowerCase()} is gathering${where}.`,'sky');
  if(god||kind!=='thunder')toast(STORM_NAME[kind],god?`Your storm rolls in${where}.`:`Gathering${where}. Tap to watch.`,x,z);
  return S}
function strike(S){
  const a=rng()*6.283,d=Math.sqrt(rng())*S.r*.85,x=S.x+Math.cos(a)*d,z=S.z+Math.sin(a)*d,y=surfY(x,z);
  bolts.push({x,z,y,top:y+4.4,t0:performance.now(),seed:rng()*1000});
  const dCam=Math.hypot(x-camT.x,z-camT.z);if(dCam<camDist*1.3)flashT=Math.max(flashT,.14);
  if(typeof sfx==='function'&&dCam<camDist*1.2+4&&Math.random()<.35)sfx('thunder',{delay:.6+Math.min(2.5,dCam*.12),near:1-smooth(0,camDist*1.2+4,dCam)});
  const i=tileAt(x,z);if(i<0)return;
  if(FUEL[biome[i]]&&rng()<.12*(moistAt(i)<.4?1.8:1)*(S.kind==='hurricane'?.3:1))startWildfire(i,false,true);
  const hit=cityAtTile(i);if(hit){hit.n.pop*=.995;if(rng()<.15)log(`Lightning struck ${hit.c.name}.`,'sky')}
  for(const s of ships)if(!s.sink&&Math.hypot(s.x-x,s.z-z)<.5&&rng()<.5){s.sink=.01;log(`Lightning sank a ${s.owner<0?"pirate ship":"ship of "+nations[s.owner].name}.`,'sky')}
}
function updateStorms(dt,k){
  weatherDim=0;
  for(let q=storms.length-1;q>=0;q--){const S=storms[q];
    S.t+=dt*k;S.x+=S.vx*dt*k;S.z+=S.vz*dt*k;
    if(S.kind==='hurricane'){const c=Math.cos(dt*k*.04),s=Math.sin(dt*k*.04),vx=S.vx;S.vx=vx*c-S.vz*s;S.vz=vx*s+S.vz*c}
    const onLand=groundY(S.x,S.z)>waterY+.05;
    if(S.kind==='hurricane'&&onLand){S.t+=dt*k*1.2;if(!S.landfall){S.landfall=true;const hit=nationsInRadius(S.x,S.z,S.r);
      if(hit.length){log(`The hurricane made landfall in ${hit.map(n=>n.name).join(' and ')}.`,'doom');toast('Landfall',`The hurricane hits ${hit[0].name}.`,S.x,S.z);milestone('hurricane','Eye of the storm','A hurricane reached land.')}}}
    const fade=Math.min(1,S.t/2.5)*Math.min(1,Math.max(0,S.life-S.t)/4);S.fade=fade;
    const dCam=Math.hypot(S.x-camT.x,S.z-camT.z);
    weatherDim=Math.max(weatherDim,(1-smooth(S.r*.8,S.r*2.4,dCam))*fade*(S.kind==='hurricane'?1:S.kind==='blizzard'?.7:S.kind==='shower'?.5:.8));
    if(k>0&&dCam<camDist*1.4+S.r){const rate=(S.kind==='hurricane'?140:S.kind==='blizzard'?70:S.kind==='shower'?55:90)*dt*fade;
      for(let e=0;e<rate;e++){const a=rng()*6.283,d=Math.sqrt(rng())*S.r,x=S.x+Math.cos(a)*d,z=S.z+Math.sin(a)*d;
        emit(S.kind==='blizzard'||S.snow?'snow':'rain',x,surfY(x,z)+(S.kind==='shower'?2.6:3.4),z,S.vx*.6+(S.kind==='hurricane'?-Math.sin(a)*1.2:0),S.vz*.6+(S.kind==='hurricane'?Math.cos(a)*1.2:0))}}
    if(k>0&&S.kind!=='blizzard'&&S.kind!=='shower'){S.bolt-=dt*k;if(S.bolt<=0){S.bolt=(S.kind==='hurricane'?.5:.7)+rng()*1.4;if(fade>.3)strike(S)}}
    if(k>0){const hit=nationsInRadius(S.x,S.z,S.r);
      for(const n of hit){if(S.kind==='hurricane'&&onLand){n.pop*=1-.006*dt*k;if(!n.famine&&rng()<.02*dt*k)startFamine(n,'storm')}
        if(S.kind==='blizzard'){n.pop*=1-(n.era>=6?.0008:.003)*dt*k;if(!n.famine&&n.era<5&&rng()<.012*dt*k)startFamine(n,'cold')}}
      if(S.kind==='hurricane')for(const s of ships)if(!s.sink&&Math.hypot(s.x-S.x,s.z-S.z)<S.r*.8&&rng()<.35*dt*k){s.sink=.01;log(`The hurricane sank a ${s.owner<0?"pirate ship":"ship of "+nations[s.owner].name}.`,'doom')}
      for(const [i] of fires){const x=wx(i%W),z=wz((i/W)|0);if(S.kind!=='blizzard'&&Math.hypot(x-S.x,z-S.z)<S.r&&rng()<dt*k*.8)endFire(i)}
      if(S.kind!=='blizzard')brushWorld(S.x,S.z,S.r,(j,f)=>{moistD[j]=Math.min(.5,moistD[j]+.004*dt*k*f)})}
    if(S.t>S.life||Math.abs(S.x)>W*.75||Math.abs(S.z)>H*.75){storms.splice(q,1);if(S.kind!=='thunder'&&S.kind!=='shower')log(`The ${STORM_NAME[S.kind].toLowerCase()} has passed.`,'sky')}}
}
/* ---------- everyday weather ----------
   Grey days come and go, and showers drift across the land (snow over cold ground). They do no harm; they just make the sky
   change. Wetter worlds see more of them. Showers start near where you are looking, so you actually see them. */
const WXD={over:0,target:0,next:0,t:0};
function everydayWeather(dt,k){if(!dt||settings.weather===false||typeof camT==='undefined')return;WXD.t+=dt*Math.max(k,.2);
  if(WXD.t>WXD.next){WXD.next=WXD.t+25+rng()*45;const wet=climate.rain??.5;WXD.target=rng()<.3+wet*.35?.45+rng()*.55:rng()*.2;
    if(!WXD.wind||rng()<.3){const a=rng()*6.283;WXD.wind=[Math.cos(a)*.22,Math.sin(a)*.22]}}
  WXD.over+=(WXD.target-WXD.over)*Math.min(1,dt*.06);
  /* showers fall all over the world (so every land gets its share of rain), and some start near where you are looking */
  const showers=storms.filter(s=>s.kind==='shower').length,wet=climate.rain??.5,cap=Math.round(4+wet*6);
  if(k>0&&showers<cap&&rng()<dt*k*(.05+.1*WXD.over)*(.5+wet)){let x,z;
    if(rng()<.35){const a=rng()*6.283,d=camDist*.3+rng()*Math.min(30,camDist*.9);x=clamp(camT.x+Math.cos(a)*d,-W/2,W/2);z=clamp(camT.z+Math.sin(a)*d,-H/2,H/2)}
    else{let i=-1;for(let q=0;q<40;q++){const j=(rng()*N)|0,an=WXG.anom?WXG.anom[j]:0;if(!isWater(j)&&rng()<(.25+moistAt(j))*clamp(.55+an*.7,.04,1.4)){i=j;break}}if(i<0)return;x=wx(i%W);z=wz((i/W)|0)}
    const t=tileAt(x,z);
    const cold=t>=0&&([2,9,10,12].includes(biome[t])||(typeof seasonName==='function'&&/winter/i.test(seasonName())&&climate.temp<.55&&Math.abs(z)>H*.2));
    storms.push({kind:'shower',x,z,seed:rng()*1000,t:0,life:20+rng()*16,r:2+rng()*1.8,vx:WXD.wind[0],vz:WXD.wind[1],bolt:1e9,landfall:false,snow:cold})}
  weatherDim=Math.max(weatherDim,WXD.over*.3)}
/* ---------- the weather leaves its mark: wet ground after rain, snow that settles and melts, and a record of each land's rain ---------- */
function wxRainOn(S,dt,k){const f=(S.fade||0)*dt*k,snow=S.kind==='blizzard'||S.snow,r=S.r,ci=tileAt(S.x,S.z);if(ci<0||f<=0)return;
  const cx=ci%W,cy=(ci/W)|0,R=Math.ceil(r);
  for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){const X=cx+dx,Y=cy+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const d=Math.hypot(wx(X)-S.x,wz(Y)-S.z);if(d>r)continue;
    const j=Y*W+X,w=f*(1-d/r)*(.75+.5*hash(j*1.7+S.seed));
    if(snow){WXG.snow[j]=Math.min(1,WXG.snow[j]+w*.09);WXG.rain[j]+=w*.4}else{WXG.wet[j]=Math.min(1,WXG.wet[j]+w*.16);WXG.rain[j]+=w;if(WXG.snow[j]>0)WXG.snow[j]=Math.max(0,WXG.snow[j]-w*.05)}}
  WXG.dirty=true}
function wxTick(dt,k){if(typeof wxEnsure!=='function'||!N)return;wxEnsure();
  for(const S of storms)wxRainOn(S,dt,k);
  WXG.acc+=dt*k;WXG.up+=dt;
  if(WXG.acc>.5){const t=WXG.acc;WXG.acc=0;const warm=clamp(climate.temp,0,1),sa=typeof seasonAmounts==='function'&&settings.seasons!==false?seasonAmounts():{snow:0},cold=clamp(1.15-climate.temp*1.2,.3,1);
    const dry=Math.exp(-t*(.03+warm*.03)),melt=t*(.004+warm*.02)*(1-sa.snow*.9);
    for(let i=0;i<N;i++){const w=WXG.wet[i];if(w>0)WXG.wet[i]=w<.01?0:w*dry;
      /* winter: snow settles over the cold lands and high ground on its own, as the seasons already paint it */
      const y=(i/W)|0,lat=Math.abs(wz(y))/(H/2),hb=isWater(i)?-1:h[i]-sea,want=hb<0?0:sa.snow*cold*clamp((lat+hb*.66-.64)/.22,0,1);
      let s=WXG.snow[i];if(s<want)s=Math.min(want,s+t*.02);else if(s>0)s=Math.max(0,s-melt);WXG.snow[i]=s}
    WXG.dirty=true}
  if(WXG.dirty&&WXG.up>.35){WXG.up=0;wxUpload()}}
{const _us2=updateStorms;updateStorms=function(dt,k){_us2(dt,k);try{wxTick(dt,k)}catch(e){console.warn('weather',e)}}}
/* how the weather lies on a tile, in words */
function groundWord(i){if(!WXG.wet||i<0)return '';const s=WXG.snow[i],w=WXG.wet[i],a=WXG.anom?WXG.anom[i]:0;return s>.45?'Deep snow':s>.15?'Snow-covered':w>.5?'Soaked from the rain':w>.15?'Wet after rain':a<-.55?'Parched by drought':a>.6?'Sodden after wet years':''}
/* ---------- weather patterns: wet years and droughts sweep over whole regions and last a few decades ---------- */
function wxNoise(x,y,s){const X=Math.floor(x),Y=Math.floor(y),fx=x-X,fy=y-Y,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),q=(a,b)=>hash(a*73.13+b*19.71+s*7.77);
  return lerp(lerp(q(X,Y),q(X+1,Y),u),lerp(q(X,Y+1),q(X+1,Y+1),u),v)}
/* the two 40-year patterns are worked out once per era of weather; each year only blends between them */
let WXP={e:null,seed:null,a:null,b:null};
function wxField(e,seed){const S=18,out=new Float32Array(N);for(let i=0;i<N;i++){const x=(i%W)/S,y=((i/W)|0)/S;out[i]=wxNoise(x+e*.37,y,seed+e)*.65+wxNoise(x*2.1,y*2.1,seed+e+91)*.35}return out}
function wxPattern(){if(typeof wxEnsure!=='function')return;wxEnsure();const P=40,e=Math.floor(year/P),f=smooth(0,1,(year%P)/P),seed=worldSeed||1;
  if(WXP.seed!==seed||!WXP.a||WXP.a.length!==N||WXP.e!==e){WXP.a=WXP.e===e-1&&WXP.b&&WXP.seed===seed&&WXP.b.length===N?WXP.b:wxField(e,seed);WXP.b=wxField(e+1,seed);WXP.e=e;WXP.seed=seed}
  const A=WXP.a,B=WXP.b,an=WXG.anom;for(let i=0;i<N;i++){const v=(A[i]+(B[i]-A[i])*f-.5)*3.4;an[i]=v<-1?-1:v>1?1:v}WXG.dirty=true}
/* how the weather pattern lies over a nation: below zero drier than usual, above wetter */
function rainAnom(n){if(typeof WXG==='undefined'||!WXG.anom)return 0;let s=0,c=0;for(const t of n.cities){for(let dy=-2;dy<=2;dy+=2)for(let dx=-2;dx<=2;dx+=2){const X=t.x+dx,Y=t.y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;s+=WXG.anom[Y*W+X];c++}}return c?s/c:0}
/* armies wade through mud and snow */
function weatherSlow(x,z){const i=tileAt(x,z);if(i<0||!WXG.wet)return 1;return clamp(1-WXG.wet[i]*.35-WXG.snow[i]*.55,.35,1)}
{const _us=updateStorms;updateStorms=function(dt,k){_us(dt,k);try{everydayWeather(dt,k)}catch(e){}}}
function brushWorld(x,z,r,fn){const i=tileAt(x,z);if(i<0)return;brush(i,r,(j,d)=>fn(j,1-d/(r+.5)))}

/* ---------- wildfires ---------- */
function ignite(i){if(fires.has(i)||(scorched&&scorched[i]>0)||fires.size>160)return false;if(WXG.wet&&(WXG.wet[i]>.35||WXG.snow[i]>.3))return false;const f=FUEL[biome[i]];if(!f)return false;
  fires.set(i,{t:0,fuel:f});const c=cityAtTile(i);if(c){c.n.pop*=.96;log(`Fire swept through ${c.c.name}.`,'doom')}return true}
function startWildfire(i,god,quiet){if(!ignite(i))return false;const n=owner[i]>=0?nations[owner[i]]:null,x=wx(i%W),z=wz((i/W)|0);
  if(!quiet||rng()<.3){log(god?`You set the land ablaze${n?' in '+n.name:''}.`:`A wildfire broke out${n?' in the lands of '+n.name:' in the wild forests'}.`,'doom');if(!quiet||god)toast('Wildfire',n?`Burning in ${n.name}.`:'Burning in the wild forests.',x,z)}
  return true}
function endFire(i){fires.delete(i);if(scorched)scorched[i]=40;colorDirty=true;greenDirty=true}/* the burned trees drop out of the replayed forest; regrowth waits for the next full rebuild */
/* a fire front: licking flames on every burning tile, embers drifting up, a glow on the ground and a column of smoke */
function updateFires(dt,k){
  kitReset(['flameFx']);let best=1e9,bx=0,by=0,bz=0;
  if(!fires.size){kitCommit(['flameFx']);fireLight.intensity=Math.max(0,fireLight.intensity-dt*2);return}let em=0;const tt=performance.now()/1000;
  for(const [i,f] of [...fires]){f.t+=dt*k;const x=wx(i%W),z=wz((i/W)|0),dc=Math.hypot(x-camT.x,z-camT.z),life=7*f.fuel+3,heat=Math.sin(Math.min(1,f.t/life)*Math.PI)*.7+.3;
    if(dc<camDist*1.6+2){
      if(dc<best){best=dc;bx=x;bz=z;by=groundY(x,z)}
      const nf=dc<camDist*.8+1.5?5:2;for(let q=0;q<nf;q++){const s=hash(i*13+q),a=s*6.283,r=hash(i*7+q*3)*.38,px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r,py=groundY(px,pz),fl=.75+.25*Math.sin(tt*(9+q*2.3)+s*20)+.15*Math.sin(tt*23+q);
        const hgt=(.07+.08*s)*heat*fl,wd=(.03+.03*s)*heat;add('flameFx',px,py,pz,wd,hgt,wd,tt*2+s*6,q%2?0xff7a1a:0xffc24a);add('flameFx',px,py,pz,wd*.55,hgt*.65,wd*.55,s*3,0xfff0b0)}
      if(em<90&&rng()<dt*10){em++;const px=x+(rng()-.5)*.8,pz=z+(rng()-.5)*.8,y=groundY(px,pz);emit('fire',px,y+.04,pz,(rng()-.5)*.05,(rng()-.5)*.05);
        if(rng()<.6)emit('ember',px,y+.08,pz,(rng()-.5)*.12,(rng()-.5)*.12);if(rng()<.25)emit('glow',x+(rng()-.5)*.3,y+.05,z+(rng()-.5)*.3);
        if(rng()<.55)emit(rng()<.7?'dark':'smoke',px,y+.2+rng()*.15,pz)}}
    /* fires creep rather than explode: fewer spread attempts, damped as the blaze grows, stopped by rivers, fields and towns */
    if(k>0&&rng()<dt*k*.9*(1-Math.min(.85,fires.size/120))){const d=(rng()*4)|0,X=i%W+DX[d],Y=((i/W)|0)+DY[d];if(X>=0&&Y>=0&&X<W&&Y<H){const j=Y*W+X;
      const brk=(river[j]?.15:1)*(fieldTiles.has(j)?.3:1)*(occupied.has(j)?.35:1);
      if(rng()<(FUEL[biome[j]]||0)*.75*(1.3-moistAt(j))*(.7+climate.temp*.6)*brk)ignite(j)}}
    /* people fight fires in their own land, better with each age; rain puts them out */
    if(k>0&&owner[i]>=0&&rng()<dt*k*(.015+nations[owner[i]].era*.012)){endFire(i);continue}
    if(k>0&&storms.length){for(const S of storms){if(S.kind!=='blizzard'&&Math.hypot(S.x-x,S.z-z)<S.r&&rng()<dt*k*.5){endFire(i);break}}if(!fires.has(i))continue}
    if(owner[i]>=0)nations[owner[i]].pop*=1-.0012*dt*k;
    if(f.t>7*f.fuel+3)endFire(i)}
  kitCommit(['flameFx']);
  if(best<camDist*1.2+2){fireLight.position.set(bx,by+.35,bz);fireLight.intensity=(1.4+nightF*2.2)*(.85+.15*Math.sin(tt*13)+.1*Math.sin(tt*31));fireLight.distance=3.5}else fireLight.intensity=Math.max(0,fireLight.intensity-dt*2)
}

/* ---------- famine ---------- */
const FAMINE_CAUSE={hunger:'Too many mouths and too little grain',drought:'The harvest failed in the drought',cold:'Frost killed the harvest',storm:'Storms ruined the fields',god:'By your will the harvest withered'};
function startFamine(n,cause,god){if(n.famine>0)return;n.famine=8+((rng()*10)|0);propsDirty=true;
  log(`Famine in ${n.name}. ${FAMINE_CAUSE[cause]}.`,'doom');const c=n.cities[0];if(c&&(god||n.pop>40))toast('Famine',`${n.name} goes hungry.`,wx(c.x),wz(c.y));milestone('famine','The hungry years','A famine struck a nation.')}
function dryCapital(n){const c=n.cities[0];if(!c)return false;let s=0,k=0;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const X=c.x+dx,Y=c.y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;s+=moistAt(Y*W+X);k++}return s/k<.24}

/* ---------- epidemics ---------- */
function startEpidemic(n,god){if(n.sick)return;n.sick={name:diseaseName(),sev:.55+rng()*.45,t:12+((rng()*10)|0)};
  log(god?`At your word, the ${n.sick.name} broke out in ${n.name}.`:`The ${n.sick.name} broke out in ${n.name}.`,'doom');const c=n.cities[0];if(c)toast('Epidemic',`The ${n.sick.name} spreads in ${n.name}.`,wx(c.x),wz(c.y))}
function infect(B,s,from){if(B.sick||(B.immune||0)>year)return;B.sick={name:s.name,sev:clamp(s.sev*(.85+rng()*.3),.2,1),t:10+((rng()*10)|0)};
  log(`The ${s.name} spread from ${from.name} to ${B.name}.`,'doom');if(nations.filter(n=>n.alive&&n.sick&&n.sick.name===s.name).length>=3)milestone('pandemic','Pandemic',`The ${s.name} reached three nations.`)}

/* ---------- earthquakes and tsunamis ---------- */
function earthquake(n,god){
  n.pop*=.85;shakeT=Math.max(shakeT,.9);if(typeof sfx==='function')sfx('quake');const c0=n.cities[0];
  const victims=n.cities.slice(1);let c=c0;
  if(victims.length&&rng()<.7){c=victims[(rng()*victims.length)|0];n.cities.splice(n.cities.indexOf(c),1);log(`${god?'Your earthquake':'An earthquake'} levelled ${c.name} in ${n.name}.`,'doom')}
  else log(`${god?'At your word the earth':'The earth'} shook beneath ${n.name}.`,'doom');
  propsDirty=true;const x=wx(c.x),z=wz(c.y);for(let q=0;q<26;q++){const px=x+(rng()-.5)*3,pz=z+(rng()-.5)*3;emit('dust',px,surfY(px,pz)+.03,pz)}
  if(!god)toast('Earthquake',`The ground split in ${n.name}.`,x,z);
  if(coastWater(c).length&&rng()<.6)tsunami(x,z,n)}
function tsunami(x,z,n){waves.push({x,z,t:0});const hit=new Set();
  brushWorld(x,z,7,(j)=>{if(owner[j]>=0&&!isWater(j)&&h[j]-sea<.06){hit.add(owner[j])}});
  for(const id of hit){nations[id].pop*=.93;if(!nations[id].famine&&rng()<.4)startFamine(nations[id],'storm')}
  for(const s of ships)if(!s.sink&&Math.hypot(s.x-x,s.z-z)<7&&rng()<.6)s.sink=.01;
  log(`A tsunami crashed into the coasts${hit.size?' of '+[...hit].map(i=>nations[i].name).join(' and '):''}.`,'doom');toast('Tsunami','The sea rushes inland.',x,z);milestone('tsunami','The great wave','A tsunami struck the coast.')}
function updateWaves(dt,k){for(let q=waves.length-1;q>=0;q--){const w=waves[q];w.t+=dt*Math.max(k,.5);const r=w.t*2.2;
  for(let e=0;e<50*dt;e++){const a=rng()*6.283,x=w.x+Math.cos(a)*r,z=w.z+Math.sin(a)*r;if(groundY(x,z)<waterY+.02)emit('foam',x,waterY+.02,z,Math.cos(a)*.4,Math.sin(a)*.4)}
  if(w.t>4)waves.splice(q,1)}}

/* ---------- yearly rolls ---------- */
function disasterTick(){
  const L=dLevel();
  if(scorched&&year%2===0)for(let i=0;i<N;i++)if(scorched[i]>0){scorched[i]=Math.max(0,scorched[i]-2);if(scorched[i]===0){colorDirty=true}}
  for(const n of nations){if(!n.alive)continue;
    if(n.famine>0){n.famine--;n.pop*=.975;if(n.famine===0){log(`The famine in ${n.name} is over.`,'life');propsDirty=true}}
    else if(L>0){const p=L*(n.era>=6?.25:1);
      if(n.pop>n.cap*1.02&&rng()<.01*p)startFamine(n,'hunger');else if(climate.temp<.32&&rng()<.008*p)startFamine(n,'cold');else if(dryCapital(n)&&rng()<.03*p)startFamine(n,'drought')}
    if(n.sick){const s=n.sick;s.t--;n.pop*=1-s.sev*.035*medicine(n);
      for(const b of n.nb){const B=nations[b];if(B&&B.alive&&rng()<.08*mood().dis*s.sev*(n.era>=6?.5:1))infect(B,s,n)}
      if(s.t<=0){log(`${n.name} recovered from the ${s.name}.`,'life');n.sick=null;n.immune=year+60}}}
  if(L<=0)return;
  const pick=(test,tries)=>{for(let q=0;q<(tries||300);q++){const i=(rng()*N)|0;if(test(i))return i}return -1};
  if(rng()<.04*L){const i=pick(j=>!isWater(j)&&moistAt(j)>.35);if(i>=0)spawnStorm('thunder',wx(i%W),wz((i/W)|0))}
  if(climate.temp>.38&&rng()<.007*L*(climate.temp+.3)){const i=pick(j=>biome[j]===0&&Math.abs(((j/W)|0)/(H-1)-.5)<.32);if(i>=0)spawnStorm('hurricane',wx(i%W),wz((i/W)|0))}
  if(rng()<.012*L*clamp(1.25-climate.temp*1.6,0,1.2)){const i=pick(j=>biome[j]===9||biome[j]===10||(biome[j]===5&&Math.abs(((j/W)|0)/(H-1)-.5)>.32));if(i>=0)spawnStorm('blizzard',wx(i%W),wz((i/W)|0))}
  if(rng()<.014*L*(.5+climate.temp)){const i=pick(j=>FUEL[biome[j]]>=.8&&moistAt(j)<.55);if(i>=0)startWildfire(i,false)}
  /* droughts dry the forests out: fires break out far more often there */
  if(WXG.anom&&rng()<.025*L){const i=pick(j=>FUEL[biome[j]]>=.45&&WXG.anom[j]<-.55,400);if(i>=0)startWildfire(i,false)}
  if(rng()<.005*L){const al=nations.filter(n=>n.alive&&n.pop>40&&!n.sick&&(n.immune||0)<year);if(al.length)startEpidemic(al[(rng()*al.length)|0])}
  if(rng()<.004*L){const al=nations.filter(n=>n.alive&&n.cities.length);if(al.length)earthquake(al[(rng()*al.length)|0],false)}
}
function updateDisasters(dt,k){updateStorms(dt,k);updateFires(dt,k);updateWaves(dt,k);
  for(const n of nations){if(!n.alive||!n.sick||!n.cities[0]||k<=0)continue;const c=n.cities[(rng()*n.cities.length)|0];if(rng()<dt*2.5){const x=wx(c.x)+(rng()-.5)*.6,z=wz(c.y)+(rng()-.5)*.6;emit('miasma',x,surfY(x,z)+.1,z)}}}

/* ---------- drawing ---------- */
function stormPuffs(pa,sa,aa,ca,n,now){
  for(const S of storms){const cnt=S.kind==='hurricane'?70:34,base=Math.max(waterY,groundY(S.x,S.z))+3.9,f=S.fade||0;
    const col=S.kind==='blizzard'||S.snow?.78:S.kind==='hurricane'?.46:S.kind==='shower'?.56:.34;
    for(let q=0;q<cnt&&n<MAXP;q++){const r1=hash(S.seed+q*1.7),r2=hash(S.seed+q*3.1),r3=hash(S.seed+q*5.3);let a,d;
      if(S.kind==='hurricane'){const arm=q%3;d=(q/cnt)*S.r;a=arm*2.094+d*.9+S.t*.7;if(q<4){d=.6+r1*.3}}else{a=r1*6.283+S.t*.05;d=Math.sqrt(r2)*S.r*.85}
      pa[n*3]=S.x+Math.cos(a)*d;pa[n*3+1]=base+r3*.9;pa[n*3+2]=S.z+Math.sin(a)*d;sa[n]=(2+r3*1.8)*(S.kind==='hurricane'?1.1:1);aa[n]=.62*f;
      const c=col*(.85+r1*.3);ca[n*3]=c;ca[n*3+1]=c;ca[n*3+2]=c*1.04;n++}}
  return n}
function drawBolts(dpr,now){bolts=bolts.filter(b=>now-b.t0<320);
  for(const b of bolts){const p=(now-b.t0)/320,[x0,y0,z0]=project(b.x,b.top,b.z),[x1,y1,z1]=project(b.x,b.y,b.z);if(z0>1||z1>1)continue;
    octx.save();octx.strokeStyle=`rgba(235,240,255,${1-p})`;octx.shadowColor='rgba(170,200,255,.9)';octx.shadowBlur=14*dpr;octx.lineWidth=2.2*dpr;octx.beginPath();octx.moveTo(x0,y0);
    for(let s=1;s<=8;s++){const t=s/8,j=(hash(b.seed+s)-.5)*26*dpr*(s<8?1:0);octx.lineTo(lerp(x0,x1,t)+j,lerp(y0,y1,t))}
    octx.stroke();octx.restore()}}
