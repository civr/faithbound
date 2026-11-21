"use strict";
/* Faithbound — the wild animals of every climate, and the hunt.
   Each kind of land has its own beasts: giraffes, elephants, antelope, lions and rhinos on the savanna, elephants and boar in the
   jungle, bison on the grass plains, bears, boar and moose in the woods, moose and reindeer in the taiga, polar bears on the snow
   and penguins on the southern ice, ibex in the mountains, camels in the desert. Wild game is also food: every town sends its
   hunters into the country round it, which matters most in the early ages. Game that is hunted too hard thins out and comes
   back slowly; where it is gone, fewer animals are seen. */

/* ---------- the animals, drawn from simple parts ---------- */
kit('fBody',new THREE.SphereGeometry(.5,10,7),stdMat({roughness:.95}),3000,false);kit('fHead',new THREE.SphereGeometry(.5,8,6),stdMat({roughness:.9}),3000,false);
kit('fLeg',(()=>{const g=new THREE.CylinderGeometry(.5,.38,1,6);g.translate(0,-.5,0);return g})(),stdMat({roughness:.9}),12000,false);
kit('fPart',unitBox(),stdMat({roughness:.9}),6000,false);
LIFE_KITS.push('fBody','fHead','fLeg','fPart');
/* sizes in world units (a sheep's body is about .03 long): body length, height, width; leg length; head size */
const FAUNA={
  giraffe:{col:0xc88c40,dark:0x6a4220,body:[.05,.034,.028],leg:.07,head:.016,neck:.09,herd:[3,6]},
  elephant:{col:0x6e6a66,body:[.09,.062,.058],leg:.04,legW:.38,head:.038,trunk:1,ears:1,tusk:1,herd:[3,7]},
  lion:{col:0xb08448,dark:0x6a3e1c,body:[.05,.024,.022],leg:.022,head:.019,mane:1,herd:[2,4],pred:1},
  antelope:{col:0x9a6638,light:0xf2e4cc,body:[.036,.019,.015],leg:.028,head:.011,horns:1,herd:[5,10]},
  rhino:{col:0x6a6862,legW:.32,body:[.072,.04,.038],leg:.026,head:.027,horn:1,herd:[1,2]},
  bear:{col:0x4a3220,legW:.32,body:[.052,.034,.03],leg:.02,head:.021,herd:[1,2],pred:1},
  polarbear:{col:0xe8e2d4,legW:.32,body:[.058,.036,.032],leg:.022,head:.021,herd:[1,2],pred:1},
  moose:{col:0x3a281c,body:[.056,.034,.026],leg:.042,head:.021,antler:1,herd:[1,3]},
  boar:{col:0x3e3028,body:[.034,.021,.018],leg:.012,head:.015,tusk:1,herd:[3,6]},
  bison:{col:0x3e2c20,legW:.32,dark:0x2e2018,body:[.062,.04,.034],leg:.025,head:.023,hump:1,herd:[6,12]},
  ibex:{col:0x8a7a62,body:[.03,.018,.014],leg:.021,head:.011,horns:2,herd:[3,6]},
  penguin:{col:0x1c1c22,light:0xf2f2ee,body:[.012,.026,.012],leg:.004,head:.009,upright:1,herd:[8,16]}};
for(const k in FAUNA)if(typeof BEAST!=='undefined'&&!BEAST[k])BEAST[k]=[FAUNA[k].col,FAUNA[k].body[0],FAUNA[k].body[1]];
/* which animals live where: biome -> [kind, weight] (deer, zebra, camel, reindeer are the older kinds) */
const FAUNA_AT={4:[['deer',.4],['bison',.3],['antelope',.15]],5:[['deer',.5],['boar',.18],['bear',.12],['moose',.08]],6:[['elephant',.35],['boar',.25],['deer',.2]],
  7:[['camel',1]],8:[['zebra',.25],['giraffe',.22],['elephant',.15],['antelope',.22],['lion',.1],['rhino',.06]],
  9:[['reindeer',.45],['moose',.25],['bear',.15],['deer',.1]],10:[['polarbear',.35],['reindeer',.35],['penguin',.3]],11:[['ibex',.6],['bear',.2]],12:[['ibex',1]],3:[['penguin',.15]]};
function faunaPick(i,z){let L=FAUNA_AT[biome[i]];if(!L)return null;
  /* penguins only on the southern ice and shores; polar bears only in the north */
  L=L.filter(([k])=>k==='penguin'?z>H*.2:k==='polarbear'?z<-H*.15:true);if(!L.length)return null;
  let s=0;for(const q of L)s+=q[1];let r=rng()*s;for(const [k,w] of L){r-=w;if(r<=0)return k}return L[0][0]}

/* the herds near the camera: chosen by the land and by how much game is left there */
spawnHerd=function(){for(let t=0;t<30;t++){const x=camT.x+(rng()-.5)*(camDist*1.8+6),z=camT.z+(rng()-.5)*(camDist*1.2+5),i=tileAt(x,z);if(i<0||isWater(i)||occupied.has(i)||fieldTiles.has(i))continue;
    if(typeof seenTile==='function'&&!seenTile(i))continue;
    const b=biome[i],n=owner[i]>=0?nations[owner[i]]:null,tame=n&&n.era>=1&&(b===4||b===8)&&rng()<.55;
    if(GAME&&rng()>.15+.85*GAME[i])continue;/* hunted out: fewer to be seen */
    const kind=tame?(rng()<.5?'sheep':'cattle'):faunaPick(i,z);if(!kind)continue;
    /* rhinos, bears, polar bears and penguins have no real model yet: they are not shown */if(FAUNA[kind]&&!FAUNA_REAL[kind])continue;
    const F=FAUNA[kind],cnt=F?F.herd[0]+((rng()*(F.herd[1]-F.herd[0]+1))|0):5+((rng()*6)|0),spread=F?Math.min(.6,.18+F.body[0]*2.6):.4;
    const m=[];for(let k=0;k<cnt;k++)m.push({dx:(rng()-.5)*spread,dz:(rng()-.5)*spread,a:rng()*6.28,ph:rng()*6.28,young:F&&k>1&&rng()<.25});
    wildHerds.push({x,z,kind,m,t:0,vx:(rng()-.5)*.02,vz:(rng()-.5)*.02});return}};

function drawFauna(hd,m,x,y,z,now){const F=FAUNA[hd.kind];if(!F)return false;
  const run=hd.flee>0,mv=Math.hypot(hd.vx,hd.vz)>.009||run,rot=mv?Math.atan2(hd.vx,hd.vz):m.a,c=Math.cos(rot),s=Math.sin(rot),sc=m.young?.62:1;
  const [bl,bh,bw]=F.body.map(v=>v*sc),L=F.leg*sc,at=(fw,side)=>[x+s*fw+c*side,z+c*fw-s*side];
  const gait=mv?Math.sin(now/(run?70:150)+m.ph)*(run?.7:.4):0,graze=!mv&&Math.sin(now/700+m.ph)>.35;
  if(F.upright){/* a penguin: an upright body, white front, a small head, waddling */const wob=mv?Math.sin(now/90+m.ph)*.12:0;
    addR('fBody',x,y+bh*.5+L,z,bw,bh,bw*.9,rot,0,wob,F.col);const [fx,fz]=at(bw*.22,0);addR('fBody',fx,y+bh*.46+L,fz,bw*.7,bh*.8,bw*.5,rot,0,wob,F.light);
    addR('fHead',x,y+bh+L+F.head*.3,z,F.head,F.head,F.head,rot,0,0,F.col);const [bx,bz]=at(F.head*.6,0);addR('fPart',bx,y+bh+L+F.head*.2,bz,.002,.002,.007,rot,0,0,0xe8a020);return true}
  const by=y+L+bh*.45;addR('fBody',x,by,z,bw,bh,bl,rot,0,0,F.col);
  if(F.hump){const [hx,hz]=at(bl*.22,0);addR('fBody',hx,by+bh*.32,hz,bw*.85,bh*.7,bl*.45,rot,0,0,F.dark)}
  if(F.light){addR('fBody',x,by-bh*.18,z,bw*.82,bh*.6,bl*.86,rot,0,0,F.light)}
  /* legs: front and back pairs swing against each other */
  for(const [fw,side,ph] of [[.34,.32,1],[.34,-.32,-1],[-.34,.32,-1],[-.34,-.32,1]]){const [lx,lz]=at(bl*fw,bw*side);addR('fLeg',lx,by-bh*.2,lz,bw*(F.legW||.22)+.002,L+bh*.25,bw*(F.legW||.22)+.002,rot,gait*ph,0,F.col)}
  /* neck and head */
  let hx,hz,hy;if(F.neck){const N=F.neck*sc,lean=graze?1.1:.32,[nx,nz]=at(bl*.42,0);addR('fLeg',nx,by+bh*.25,nz,bw*.32,N,bw*.32,rot,Math.PI+lean,0,F.col);
      /* the neck hangs down from its top end, so it is drawn from the head end: put the head at the top */
      const tx=nx+s*Math.sin(lean)*N,tz=nz+c*Math.sin(lean)*N;hx=tx;hz=tz;hy=by+bh*.25+Math.cos(lean)*N;
      /* giraffe patches: a few dark blotches on body and neck */for(let q=0;q<3;q++){const [px,pz]=at(bl*(q-1)*.28,bw*.36*(q%2?1:-1));addR('fPart',px,by+bh*.12,pz,bl*.16,bh*.25,.004,rot,0,0,F.dark)}}
  else{const [fx,fz]=at(bl*.55+F.head*.3,0);hx=fx;hz=fz;hy=by+(graze?-bh*.35:bh*.25)}
  const hs=F.head*sc;addR('fHead',hx,hy,hz,hs*.9,hs,hs*1.3,rot,graze?.5:0,0,F.col);
  if(F.mane&&!m.young&&hd.m.indexOf(m)===0){const [mx,mz]=at(bl*.48,0);addR('fHead',mx,by+bh*.25,mz,hs*1.9,hs*1.8,hs*1.4,rot,0,0,F.dark)}
  if(F.trunk){const [tx,tz]=at(bl*.5+hs*1.1,0);addR('fLeg',tx,hy+hs*.1,tz,hs*.28,hs*1.6,hs*.28,rot,graze?-.45:-.12,0,F.col)}
  if(F.ears)for(const sd of [-1,1]){const [ex,ez]=at(bl*.5+hs*.2,hs*.62*sd);addR('fPart',ex,hy+hs*.05,ez,.003,hs*1.1,hs*.9,rot,0,0,F.col)}
  if(F.tusk)for(const sd of [-1,1]){const [ex,ez]=at(bl*.5+hs*1.05,hs*.22*sd);addR('fLeg',ex,hy-hs*.2,ez,hs*.08,hs*(F.trunk?.9:.35),hs*.08,rot,-1.1,0,0xf2ece0)}
  if(F.horn){const [ex,ez]=at(bl*.5+hs*1.15,0);addR('fLeg',ex,hy+hs*.35,ez,hs*.12,hs*.55,hs*.12,rot,Math.PI-.3,0,0xc8c4b8)}
  if(F.horns&&!m.young)for(const sd of [-1,1]){const [ex,ez]=at(bl*.5+hs*.3,hs*.25*sd);addR('fLeg',ex,hy+hs*.45,ez,hs*.09,hs*(F.horns===2?1.4:1.1),hs*.09,rot,Math.PI-(F.horns===2?.9:.25),0,0x3a3228)}
  if(F.antler&&!m.young&&hd.m.indexOf(m)===0)for(const sd of [-1,1]){const [ex,ez]=at(bl*.5+hs*.1,hs*.9*sd);addR('fPart',ex,hy+hs*.6,ez,hs*1.1,.004,hs*.7,rot,0,sd*.35,0xd8c8a8)}
  if(F.neck)for(const sd of [-1,1]){const [ox,oz]=at(bl*.5+hs*.1,hs*.25*sd);addR('fLeg',ox,hy+hs*.75,oz,hs*.1,hs*.4,hs*.1,rot,Math.PI,0,F.dark)}
  return true}
/* ---------- the animals as real models ----------
   Elephant, giraffe and lion are Poly by Google models (CC-BY 3.0, standing still in one pose); bison, antelope, moose, ibex and boar are Quaternius' bull, deer and pig in their colours (CC0, walking and galloping). */
const FAUNA_REAL={elephant:1,giraffe:1,lion:1,bison:1,antelope:1,moose:1,ibex:1,boar:1};
function drawFaunaModel(hd,m,x,y,z,now){if(!FAUNA_REAL[hd.kind])return false;const name='rw_'+hd.kind,run=hd.flee>0,mv=Math.hypot(hd.vx,hd.vz)>.009||run,rot=mv?Math.atan2(hd.vx,hd.vz):m.a,sc=m.young?.62:1;
  if(SMODEL[name]){if(!sOn(name))return false;const bob=mv?Math.abs(Math.sin(now/(run?90:150)+m.ph))*.002:0;add('s_'+name,x,y+bob,z,sc,sc,sc,rot,null);return true}
  if(typeof modelOn!=='function'||!modelOn(name))return false;const F=MDL.frames[name];if(!F)return false;
  const list=(run&&F.run)||(mv&&F.walk)||F.idle;if(!list||!list.length)return false;
  const fi=Math.floor(now/1000*(run?11:mv?7:1.5)+m.ph*3)%list.length,kn=list[(fi+list.length)%list.length];
  addM(kn,x,y,z,sc,rot);if(typeof WILD_USED!=='undefined')WILD_USED.add(kn);return true}
{const _dw=drawWildModel;drawWildModel=function(hd,m,x,y,z,now){if(FAUNA[hd.kind])return drawFaunaModel(hd,m,x,y,z,now)||drawFauna(hd,m,x,y,z,now);return _dw.apply(this,arguments)}}

/* ---------- game: how much wild food the land holds ---------- */
const GAME_CAP=[0,0,0,.15,.8,1,.9,.12,1,.6,.25,.4,.1];
let GAME=null,GAME_LOG={};
function gameInit(data){GAME=data&&data.length===N?data:new Float32Array(N);if(!data)for(let i=0;i<N;i++)GAME[i]=GAME_CAP[biome[i]]||0}
/* the share of a people's food that comes from the hunt: nearly all of it among the first tribes, little once farms and herds feed the towns */
const HUNT_K=[.45,.3,.2,.12,.08,.05,.02,.01];
function huntTick(){if(!GAME||GAME.length!==N)gameInit(null);
  for(let i=0;i<N;i++){const cap=GAME_CAP[biome[i]]||0;if(GAME[i]<cap)GAME[i]=Math.min(cap,GAME[i]+.035*cap*(occupied.has(i)?.2:1))}
  for(const n of nations){if(!n.alive||!n.cities.length)continue;const k=HUNT_K[n.era]||0;if(!k){n.huntShare=0;continue}
    const r=2+Math.min(3,n.era),want=k*Math.sqrt(Math.max(1,n.pop))*.08/n.cities.length;let got=0,need=0;
    for(const c of n.cities){let have=0;const T=[];for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const X=wrapTX(c.x+dx),Y=c.y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const j=Y*W+X;if(isWater(j)||(owner[j]>=0&&owner[j]!==n.id))continue;if(GAME[j]>.02){have+=GAME[j];T.push(j)}}
      need+=want;const take=Math.min(want,have*.25);got+=take;if(have>0)for(const j of T)GAME[j]=Math.max(0,GAME[j]-take*GAME[j]/have);
      /* told once when the woods round a town are empty of game */
      const dens=T.length?have/T.length:0;if(dens<.12&&n.era<=3&&!c._huntOut&&year>40){c._huntOut=year;if(important(n)||n.id===selected)log(`The hunters of ${c.name} come home empty-handed: the game round the town is hunted out.`,'life')}else if(dens>.35)c._huntOut=0}
    n.huntShare=need?clamp(got/need,0,1)*k:0}}
{const _t=tick;tick=function(){_t.apply(this,arguments);try{huntTick()}catch(e){console.warn('hunt',e)}}}
/* a good hunt fills the larder: game makes up for part of a poor harvest */
{const _ho=harvestOf;harvestOf=function(n){const H0=_ho.apply(this,arguments),k=HUNT_K[n.era]||0;if(!k)return H0;const s=n.huntShare??k;
  return clamp(H0*(1-k)+Math.max(H0,1.05)*s+H0*(k-s)*.4,.3,1.4)}}
{const _gw=genWorld;genWorld=function(){const r=_gw.apply(this,arguments);gameInit(null);HUNTS.length=0;return r}}
{const _bs=buildSave;buildSave=function(){const d=_bs.apply(this,arguments);if(GAME&&GAME.length===N)d.game=b64(GAME);return d}}
{const _as=applySave;applySave=function(d){const r=_as.apply(this,arguments);try{gameInit(d&&d.game?unb64(d.game,Float32Array):null)}catch(e){gameInit(null)}HUNTS.length=0;return r}}

/* ---------- the hunt, near the camera: a few hunters walk out from a town to a herd; the herd bolts and one animal is taken ---------- */
const HUNTS=[];let huntT=0;
const HUNT_GEAR=['spear','spear','bow','bow','bow','musket','rifle','rifle'];
function updateHunts(dt,now){if(!dt)return;huntT-=dt;
  if(huntT<=0&&HUNTS.length<3){huntT=2;for(const hd of wildHerds){if(hd.hunted||!hd.m.length||(FAUNA[hd.kind]&&FAUNA[hd.kind].pred)||hd.kind==='sheep'||hd.kind==='cattle')continue;
      let best=null,bd=2.2;for(const n of nations){if(!n.alive||n.era>5)continue;for(const c of n.cities){const d=Math.hypot(wx(c.x)-hd.x,wz(c.y)-hd.z);if(d<bd){bd=d;best={n,c}}}}
      if(!best||rng()>.5)continue;hd.hunted=1;const sx=wx(best.c.x)+(hd.x-wx(best.c.x))/bd*.35,sz=wz(best.c.y)+(hd.z-wz(best.c.y))/bd*.35,men=[];
      for(let q=0;q<2+((rng()*2)|0);q++)men.push({dx:(rng()-.5)*.08,dz:(rng()-.5)*.08,ph:rng()*6});HUNTS.push({x:sx,z:sz,hx:sx,hz:sz,hd,men,phase:0,t:0,era:best.n.era,col:parseInt(best.n.color.slice(1),16)});break}}
  for(let q=HUNTS.length-1;q>=0;q--){const H_=HUNTS[q],hd=H_.hd;H_.t+=dt;
    if(!wildHerds.includes(hd)||H_.t>60){HUNTS.splice(q,1);continue}
    const tx=H_.phase===0?hd.x:H_.hx,tz=H_.phase===0?hd.z:H_.hz,dx=tx-H_.x,dz=tz-H_.z,d=Math.hypot(dx,dz),sp=(H_.phase===0?.12:.08)*dt;
    if(d>sp){H_.x+=dx/d*sp;H_.z+=dz/d*sp}
    if(H_.phase===0&&d<.25){/* the herd bolts; one is taken */H_.phase=1;if(hd.m.length>1){hd.m.splice((rng()*hd.m.length)|0,1);H_.carry=hd.kind}const a=Math.atan2(hd.z-H_.z,hd.x-H_.x);hd.vx=Math.cos(a)*.09;hd.vz=Math.sin(a)*.09;hd.flee=4;
      if(typeof sfx==='function'&&H_.era>=5&&Math.random()<.5)try{sfx('cannon',{near:.2})}catch(e){}}
    if(H_.phase===1&&d<.06){HUNTS.splice(q,1);continue}
    /* the hunters: a body, a head and their weapon; on the way home two of them carry the kill */
    const a=Math.atan2(dx,dz),c=Math.cos(a),s=Math.sin(a);
    for(const mn of H_.men){const x=H_.x+mn.dx,z=H_.z+mn.dz,y=groundY(x,z),st=Math.sin(now/110+mn.ph);if(typeof seenTile==='function'&&!seenTile(tileAt(x,z)))continue;
      addR('fLeg',x,y+.032,z,.008,.032,.008,a,st*.15,0,H_.era>=5?0x5a5040:0x8a6a48);addR('fBody',x,y+.042,z,.016,.024,.012,a,0,0,H_.era>=5?0x6a6050:0xa07850);addR('fHead',x,y+.06,z,.01,.01,.01,a,0,0,0xd8a880);
      const g=HUNT_GEAR[H_.era]||'spear';if(g==='spear')addR('fPart',x+c*.008,y+.05,z-s*.008,.0016,.0016,.06,a,-.3,0,0x6a5038);else if(g==='bow')addR('fPart',x+c*.009,y+.045,z-s*.009,.002,.034,.006,a,0,.2,0x5a3a20);else addR('fPart',x+c*.008,y+.048,z-s*.008,.0018,.0018,.04,a,-.5,0,0x2a2622)}
    if(H_.phase===1&&H_.carry){const F=FAUNA[H_.carry],B=BEAST[H_.carry],x=H_.x,z=H_.z,y=groundY(x,z);const L_=F?F.body[0]*.7:B?B[1]*.8:.025;addR('fBody',x,y+.052,z,L_*.45,L_*.35,L_,a,0,1.57,F?F.col:B?B[0]:0x8a5a34)}}
  for(const hd of wildHerds)if(hd.flee>0){hd.flee-=dt;if(hd.flee<=0){hd.vx*=.2;hd.vz*=.2}}}
{const _ul=updateLiving;updateLiving=function(dt,k,now){const r=_ul.apply(this,arguments);try{updateHunts(k>0?dt:0,now)}catch(e){console.warn('hunts',e)}
  /* (the hunters are drawn after the herds, into the same parts, so they are committed here) */for(const nm of ['fBody','fHead','fLeg','fPart']){const K=KITS[nm];kitUp(K,K.k)}return r}}

/* the nation card: how the hunt goes */
function huntWord(n){const k=HUNT_K[n.era]||0;if(!k)return '';const s=(n.huntShare??k)/k;return s>.8?'Plenty of game':s>.5?'Fair hunting':s>.25?'Game is scarce':'Hunted out'}
{const _rn=renderNationCard;renderNationCard=function(){_rn.apply(this,arguments);const n=nations[selected];if(!n||!n.alive)return;const kv=document.querySelector('#nationCard .kv');if(!kv||kv.querySelector('[data-hunt]'))return;
  const w=huntWord(n);if(!w)return;const k=HUNT_K[n.era]||0,pct=Math.round((n.huntShare??k)*100);const v=document.createElement('div');v.dataset.hunt='1';
  v.innerHTML=`<span>Hunting</span><b>${w}${pct>=1?` · ${pct}% of the food`:''}</b>`;kv.appendChild(v)}}
