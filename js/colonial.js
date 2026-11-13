"use strict";
/* Faithbound — the colonial age, and orchards.
   From the Age of Sail a seafaring nation can charter a trading company, like the Dutch VOC or the English East India Company: the
   company sets up trading posts on foreign coasts and empty shores, sails its ships between home and the posts, and its cargoes of
   spices, silk and sugar make the homeland rich. Where the people of the coast are far behind, the company takes their land and rules it.
   Colonies in warm lands become plantations of sugar, tobacco, cotton, coffee and spices for the homeland. Some nations turn to slavery
   to work them: slave ships carry captives from the coasts of weaker peoples, the plantations pay more, and the colonies seethe; the
   enslaved rise up, sometimes winning their freedom and a country of their own, and in time abolition ends it, peacefully or by a split.
   Orchards: towns plant fruit trees around them; they feed people, carry them through lean years, blossom in spring and bear in autumn. */

kit('colBall',(()=>{const g=new THREE.IcosahedronGeometry(.5,1);g.translate(0,.5,0);return g})(),MAT.plain,4000,true);GW_KITS.push('colBall');
const ORCH_TILES=2;
const watchedC=n=>important(n)||n.id===selected;
const capF=s=>s.charAt(0).toUpperCase()+s.slice(1);
const portsOf=n=>n.cities.filter(c=>coastWater(c).length);

/* ---------- trading companies ---------- */
const CO_FORM=[n=>`the ${n.name} East Company`,n=>`the United ${n.name} Company`,n=>`the ${n.name} Trading Company`,n=>`the Company of ${n.name} Merchants`,n=>`the ${n.name} Overseas Company`];
function charter(n){n.company={name:CO_FORM[(rng()*CO_FORM.length)|0](n),founded:year,posts:[],wealth:0};
  log(`Merchants of ${n.name} founded ${n.company.name}, with a charter to trade across the seas.`,'era');milestone('company','The great companies','A nation chartered a trading company.')}
/* a post: a coastal tile of a foreign land (or an empty shore) the company's ships can reach from home */
function postSpot(n,ban){const ports=portsOf(n);if(!ports.length)return null;const cap=n.cities[0],used=new Set();for(const m of nations)if(m.company)for(const p of m.company.posts)used.add(p.i);
  const cands=[];for(let q=0;q<900&&cands.length<40;q++){const j=(rng()*N)|0;if(isWater(j)||used.has(j)||river[j])continue;const o=owner[j];if(o===n.id)continue;const H_=o>=0?nations[o]:null;
    if(H_&&ban&&year-(ban[o]??-99)<30)continue;
    if(H_&&(!H_.alive||H_.era>n.era||(n.allies||[]).includes(o)&&rng()<.5))continue;const x=j%W,y=(j/W)|0;let wet=false;for(let d=0;d<4;d++){const X=x+DX[d],Y=y+DY[d];if(X>=0&&Y>=0&&X<W&&Y<H&&isWater(Y*W+X))wet=true}if(!wet)continue;
    if(H_&&H_.cities.some(c=>c.x===x&&c.y===y))continue;const far=Math.hypot(x-cap.x,y-cap.y);if(far<10)continue;
    const near=H_?Math.min(...H_.cities.map(c=>Math.hypot(c.x-x,c.y-y))):9;if(H_&&near>3)continue;
    cands.push({j,x,y,host:o,sc:far*.05+(H_?(n.era-H_.era)*.8+1:.4)+rng()})}
  cands.sort((a,b)=>b.sc-a.sc);
  for(const c of cands.slice(0,4)){const r=seaPath(ports.flatMap(p=>coastWater(p)),(x,y)=>{for(let d=0;d<4;d++)if(x+DX[d]===c.x&&y+DY[d]===c.y)return c.j;return -1});if(r&&r.path.length>6)return c}
  return null}
function companySail(n,P,home){const ports=portsOf(n);if(!ports.length)return;const px=P.i%W,py=(P.i/W)|0;
  let starts,goal;if(!home){starts=ports.flatMap(p=>coastWater(p));goal=(x,y)=>{for(let d=0;d<4;d++)if(x+DX[d]===px&&y+DY[d]===py)return P.i;return -1}}
  else{starts=[];for(let d=0;d<4;d++){const X=px+DX[d],Y=py+DY[d];if(X>=0&&Y>=0&&X<W&&Y<H&&isWater(Y*W+X))starts.push(Y*W+X)}const hs=new Set(ports.flatMap(p=>coastWater(p)));goal=(x,y)=>hs.has(y*W+x)?y*W+x:-1}
  const res=seaPath(starts,goal);if(!res||res.path.length<2)return;const p0=res.path[0];
  const s={owner:n.id,kind:'company',foe:home?n.id:P.host,era:n.era,path:res.path,wp:shipRoute(res.path),seg:0,target:res.target,x:wx(p0%W),z:wz((p0/W)|0),sink:0,g:makeShip(n.era,'trade',n.color,ensureFlag(n)),foamT:0,post:P.i,homeward:!!home};
  s.g.position.set(s.x,waterY,s.z);ships.push(s)}
function companyArrive(s){const n=nations[s.owner];if(!n||!n.alive)return;const P=n.company&&n.company.posts.find(p=>p.i===s.post);
  if(!s.homeward){/* trading at the post, then home with the cargo */const Hn=P&&P.host>=0?nations[P.host]:null;if(Hn&&Hn.alive)Hn.tech+=TECHCOST[Hn.era]*.01;if(P){P.visits=(P.visits||0)+1;companySail(n,P,true)}return}
  /* home with a full hold */n.tech+=TECHCOST[n.era]*.03;n.pop*=1.004;n.happy=clamp(happyOf(n)+.01,0,1);if(n.company){n.company.wealth++;
    if(watchedC(n)&&year-(n.company._log||-99)>25){n.company._log=year;log(`A ship of ${n.company.name} came home laden with ${pickC(['spices and silk','tea and porcelain','pepper and cloves','sugar and indigo','furs and timber'])}.`,'life')}}}
const pickC=a=>a[(rng()*a.length)|0];
{const _ar=arrive;arrive=function(s){if(s&&s.kind==='company')return companyArrive(s);return _ar.apply(this,arguments)}}
function companyTick(n){
  if(!n.company){if(n.era>=SAIL&&n.era<=5&&n.tiles>=20&&portsOf(n).length>=2&&nations.filter(m=>m.alive&&m.company).length<3&&rng()<.015*(n.gov==='merchant'?2.5:n.gov==='constmon'||n.gov==='republic'?1.4:1)*(ten(n).sea||1))charter(n);return}
  const C=n.company;
  /* the age of the great companies ends with the industrial nations: the crown takes over */
  if(n.era>=6){if(watchedC(n))log(`${capF(C.name)} was wound up; the state took over its posts and lands.`,'era');n.companyPast={name:C.name,from:C.founded,to:year};n.company=null;return}
  C.posts=C.posts.filter(P=>{if(P.ruled)return owner[P.i]===n.id;const o=owner[P.i];if(o===n.id){P.ruled=true;return true}
    if(P.host>=0&&o!==P.host){if(o>=0&&nations[o].alive)P.host=o;else if(o<0)P.host=-1}if(P.host>=0&&(!nations[P.host]||!nations[P.host].alive))P.host=-1;
    if(P.host>=0&&nations[P.host].wars.has(n.id)&&rng()<.25){(C.ban||(C.ban={}))[P.host]=year;if(watchedC(n))log(`${nations[P.host].name} burned the trading post of ${C.name}.`,'war');return false}return true});
  const want=Math.min(5,2+(n.era-SAIL)*2);if(C.posts.length<want&&rng()<.18){const P=postSpot(n,C.ban);if(P){C.posts.push({i:P.j,host:P.host,year,visits:0});const Hn=P.host>=0?nations[P.host]:null;
      if(watchedC(n)||Hn&&watchedC(Hn))log(Hn?`${capF(C.name)} opened a trading post on the coast of ${Hn.name}.`:`${capF(C.name)} built a fort and trading post on an empty shore across the sea.`,'life')}}
  for(const P of C.posts){const Hn=P.host>=0?nations[P.host]:null;n.tech+=TECHCOST[n.era]*.0025;
    if(Hn){Hn.tech+=TECHCOST[Hn.era]*.003;if(n.era-Hn.era>=2)Hn.happy=clamp(happyOf(Hn)-.003,0,1)}
    /* where the people of the coast are far behind, the company takes their land and rules it */
    if(!P.ruled&&Hn&&n.era-Hn.era>=2&&year-P.year>15&&rng()<.012){if(companyRule(n,P,Hn))continue}
    /* a fort on an empty shore grows into a colony */
    if(!P.ruled&&!Hn&&year-P.year>20&&owner[P.i]<0&&rng()<.04)companyRule(n,P,null)}
  const atSea=ships.filter(s=>s.owner===n.id&&s.kind==='company'&&!s.sink).length;if(atSea<C.posts.length&&rng()<.45){const P=C.posts[(rng()*C.posts.length)|0];companySail(n,P,false)}}
function companyRule(n,P,Hn){const x=P.i%W,y=(P.i/W)|0;let took=0;
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const j=Y*W+X;if(isWater(j))continue;if(Hn?owner[j]===Hn.id:owner[j]<0){if(Hn&&Hn.cities.some(c=>c.x===X&&c.y===Y))continue;claim(j,n.id);took++}}
  if(!took)return false;P.ruled=true;if(!n.cities.some(c=>c.x===x&&c.y===y)&&owner[P.i]===n.id){n.cities.push({x,y,name:cultureName(cultOf(n)),origin:Hn?Hn.id:n.id,colony:true,company:true,born:year,conq:Hn?year:undefined});propsDirty=true}
  if(Hn){log(`${capF(n.company.name)} seized the lands of ${Hn.name} around its post. The Company rules them now.`,'war');addRival(Hn,n,.5);if(rng()<.35&&typeof warRoom==='function'&&warRoom(1))startWar(Hn,n)}
  else if(watchedC(n))log(`The fort of ${n.company.name} grew into a colony of ${n.name}.`,'life');bordersDirty=true;return true}

/* ---------- plantations ---------- */
const WARM_CROPS={6:['sugar','spices','coffee'],8:['cotton','tobacco','sugar'],4:['tobacco','sugar'],7:['cotton']};
const CROP_COL={sugar:0x8ac858,spices:0x4a7a32,coffee:0x2e5a2a,cotton:0xeeeae0,tobacco:0x6a8a3a};
function warmTown(c){const B=biome[c.y*W+c.x];if(!WARM_CROPS[B])return null;if(typeof coldAt==='function'&&coldAt(c.x,c.y)>0)return null;if(B===4&&climate.temp<.42)return null;return WARM_CROPS[B]}
const plantations=n=>n.cities.filter(c=>c.plant);
function plantTick(n){if(n.era<SAIL)return;let first=false;
  for(const c of n.cities){if(!c.colony&&!c.company)continue;if(!c.plant){const cr=warmTown(c);if(cr&&rng()<.08){c.plant=cr[(rng()*cr.length)|0];c.plantY=year;first=!plantations(n).some(q=>q!==c)}}
    if(!c.plant)continue;const sl=n.slavery?1.6:1;n.tech+=TECHCOST[n.era]*.002*sl;n.pop*=1+.0008*sl;c.unrest=(c.unrest||0)+.0012+(n.slavery?.003:0)}
  if(first&&watchedC(n)){const c=plantations(n)[0];log(`Plantations of ${c.plant} spread around ${c.name}; the cargoes sail home to ${n.name}.`,'life')}}

/* ---------- slavery and its end ---------- */
const SLAVE_GOV={democracy:.15,republic:.5,communism:0,federation:0,technocracy:0,constmon:.8,merchant:1.4,empire:1.5,fascism:1.2,kingdom:1,theocracy:1,feudal:1.1};
const ABOL_GOV={democracy:3,republic:2,constmon:2,merchant:1.2,communism:6,federation:6,technocracy:4};
function harmonyFaith(n){const f=n.faith>=0?faiths[n.faith]:null;return !!(f&&(f.tenets||[f.tenet]).includes('harmony'))}
function abolish(n,how){if(!n.slavery)return;const since=n.slavery;n.slavery=0;n.abolished=year;n.happy=clamp(happyOf(n)+.03,0,1);for(const c of n.cities)if(c.plant)c.unrest=Math.max(0,(c.unrest||0)-.2);
  log(how==='god'?`Moved by your prophets, ${n.name} abolished slavery after ${year-since} years. On its plantations the enslaved walked free.`:`${n.name} abolished slavery. On its plantations the enslaved walked free.`,'era');milestone('abolition','Abolition','A nation abolished slavery.')}
function slaveTick(n){
  if(!n.slavery){if(!n.abolished&&n.era>=SAIL&&n.era<=5&&plantations(n).length&&rng()<.02*(SLAVE_GOV[n.gov]??1)*(harmonyFaith(n)?.3:1)){n.slavery=year;
      log(`${n.name} turned to slavery to work its plantations. Slave ships begin to sail.`,'doom');milestone('slavery','The slave trade','A nation turned to slavery for its plantations.')}return}
  /* the slave trade: ships carry captives from the coasts of weaker peoples */
  if(rng()<.2){const V=nations.filter(m=>m.alive&&m!==n&&m.era<n.era&&!(n.allies||[]).includes(m.id)&&portsOf(m).length);if(V.length){const v=V[(rng()*V.length)|0];
      v.pop*=.985;v.happy=clamp(happyOf(v)-.03,0,1);addRival(v,n,.25);n.slaveYears=(n.slaveYears||0)+1;
      if((watchedC(n)||watchedC(v))&&year-(n._slog||-99)>12){n._slog=year;log(`Slave ships of ${n.name} carried captives from the coasts of ${v.name} to the plantations.`,'doom')}}}
  n.happy=clamp(happyOf(n)-.002,0,1);
  /* the enslaved rise up */
  for(const c of plantations(n)){if(rng()>.006)continue;n.lastRevolt=year;
    if((c.unrest||0)>.5||rng()<.4){const before=nations.length;try{rebel(n,c,'free',`The enslaved on the plantations of ${c.name} rose up, overthrew the planters and declared ${c.name} free of ${n.name}.`)}catch(e){}
      if(nations.length>before){const R_=nations[nations.length-1];R_.abolished=year;R_.slavery=0;R_.freedBorn=1;milestone('freedom','Freedom','The enslaved rose up and won a country of their own.')}break}
    n.pop*=.995;c.unrest=(c.unrest||0)+.2;if(watchedC(n))log(`A rising of the enslaved on the plantations of ${c.name} was put down with great cruelty.`,'war');break}
  /* abolition: the modern age will not have it; before that it comes with free governments, a gentle faith, risings and the example of others */
  if(n.era>=6){abolish(n);return}
  const others=nations.some(m=>m.alive&&m.abolished);const p=(n.era>=5?.03:.004)*(ABOL_GOV[n.gov]||1)*(harmonyFaith(n)?2:1)*(n.lastRevolt&&year-n.lastRevolt<20?2:1)*(others?1.5:1);
  if(rng()<p){abolish(n);return}
  /* a nation that clings to it in the industrial age can be torn apart over it */
  if(n.era>=5&&others&&n.cities.length>=3&&rng()<.008){const c=n.cities[1+((rng()*(n.cities.length-1))|0)];const before=nations.length;
    try{rebel(n,c,'free',`The quarrel over slavery split ${n.name}: ${c.name} and the lands around it broke away.`)}catch(e){}if(nations.length>before&&rng()<.5)abolish(n)}}

/* ---------- orchards ---------- */
const ORCH_FRUIT={4:['apple','pear','cherry'],5:['apple','plum'],8:['orange','olive','fig'],6:['mango','orange'],3:['olive']};
function orchardTick(n){if(n.era<1)return;
  for(const c of n.cities){if(c.orchard){/* a sacked town loses trees to fire and axes */if(c.plundered===year&&rng()<.3)delete c.orchard;continue}
    const F=ORCH_FRUIT[biome[c.y*W+c.x]];if(!F||(typeof coldAt==='function'&&coldAt(c.x,c.y)>0))continue;
    const lv=typeof townLevel==='function'?townLevel(n,c===n.cities[0]):3;if(lv<1.4||rng()>.05)continue;
    const o=orchardSpot(c);if(!o)continue;c.orchard={a:o.a,r:o.r,fruit:F[(rng()*F.length)|0],year};
    if(!n._orch&&watchedC(n)){n._orch=1;log(`The people of ${c.name} planted ${c.orchard.fruit} orchards outside the town.`,'life')}}}
function orchardSpot(c){const cx=wx(c.x),cz=wz(c.y);let best=null,bs=-1;
  for(let k=0;k<10;k++){const a=k/10*6.283+hash(c.x*7+c.y)*.6,r=hash(c.x+c.y*13+k)*.1;let ok=0;
    for(let i=0;i<3;i++)for(let j=0;j<4;j++){const [x,z]=orchardTree(cx,cz,{a,r},i,j,c);const g=groundY(x,z);if(g>waterY+.02&&!(typeof inBuilding==='function'&&inBuilding(x,z)))ok++}
    if(ok>bs){bs=ok;best={a,r}}}return bs>=9?best:null}
/* the orchard lies just beyond the last houses (the town's reach, measured when it was built), so it moves out as the town grows; o.r is only a little extra */
function orchardTree(cx,cz,o,i,j,c){const R=(c&&c._townR||.45)+.1+Math.min(o.r,.12),ox=cx+Math.cos(o.a)*R,oz=cz+Math.sin(o.a)*R,ca=Math.cos(o.a+1.57),sa=Math.sin(o.a+1.57),u=(j-1.5)*.062,v=(i-1)*.062;return [ox+ca*u+Math.cos(o.a)*v,oz+sa*u+Math.sin(o.a)*v]}

/* ---------- railways ----------
   With the Railroads discovery a nation lays track from its capital out to its towns, one line every few years, for timber. A town on
   the railway grows and learns faster, gets grain by train in a famine, and no longer feels far from the capital: its people are much
   less likely to break away. The trains you see run on these lines. */
function railTick(n){if(!(n.techs||[]).includes('railroads')||n.cities.length<2)return;const cap=n.cities[0];cap.rail=cap.rail||year;
  const todo=n.cities.filter(c=>!c.rail&&!c.colony&&!c.company);if(todo.length&&rng()<.28&&(n.wood??30)>=4){
    todo.sort((a,b)=>Math.hypot(a.x-cap.x,a.y-cap.y)-Math.hypot(b.x-cap.x,b.y-cap.y));const c=todo[0];
    const path=typeof roadPath==='function'?roadPath(cap,c,n.id,new Uint8Array(N)):1;if(path){n.wood=(n.wood??30)-4;const first=!n.cities.some(q=>q!==cap&&q.rail);c.rail=year;
      if(first){log(`The first railway in ${n.name} opened, from ${cap.name} to ${c.name}.`,'era');milestone('railway','The railway age','The first railway opened.')}else if(watchedC(n)&&rng()<.4)log(`The railway reached ${c.name} in ${n.name}.`,'life')}}
  const linked=n.cities.filter(c=>c.rail&&c!==cap).length;n.railShare=linked/Math.max(1,n.cities.length-1);
  if(n.railShare>0){n.pop*=1+.002*n.railShare;n.tech+=TECHCOST[n.era]*.003*n.railShare}}
{const _t=tick;tick=function(){_t.apply(this,arguments);for(const n of nations){if(!n.alive||!n.cities.length)continue;try{companyTick(n);plantTick(n);slaveTick(n);orchardTick(n);railTick(n)}catch(e){console.warn('colonial',e)}}}}

/* ---------- what you see ---------- */
const FRUIT_COL={apple:0xc8342a,pear:0xc8c048,cherry:0xa8202a,plum:0x5a2a5a,orange:0xe8902a,olive:0x5a6a2a,fig:0x5a3a4a,mango:0xe8a830};
function colonialFrame(R2){const sn=typeof seasonName==='function'&&settings.seasons!==false?seasonName():'Summer';
  for(const n of nations){if(!n.alive)continue;const nc=parseInt(n.color.slice(1),16);
    /* trading posts: a palisade, a warehouse and the company flag; a ruled post becomes a stone fort */
    if(n.company)for(const P of n.company.posts){const x=wx(P.i%W),z=wz((P.i/W)|0),ex=x-camT.x,ez=z-camT.z;if(ex*ex+ez*ez>R2*3)continue;const y=groundY(x,z);if(y<waterY)continue;
      const wall=P.ruled?0xb8b0a0:0x7a5a3a,s=P.ruled?.2:.15;for(const [dx,dz,sx,sz] of [[0,-s/2,s,.012],[0,s/2,s,.012],[-s/2,0,.012,s],[s/2,0,.012,s]])add('gwBox',x+dx,groundY(x+dx,z+dz),z+dz,sx,P.ruled?.05:.035,sz,0,wall);
      add('gwBox',x-.02,y,z+.02,.07,.045,.05,0,0xe8e0d0);add('gwCone',x-.02,y+.045,z+.02,.085,.035,.065,.785,0x8a4a3a);
      add('gwBox',x+.04,y,z-.04,.005,.17,.005,0,0x5a4430);add('gwBox',x+.065,y+.14,z-.04,.05,.03,.004,0,nc);add('gwBox',x+.065,y+.15,z-.04,.05,.006,.0045,0,0xf0f0f0)}
    for(const c of n.cities){const cx=wx(c.x),cz=wz(c.y),ex=cx-camT.x,ez=cz-camT.z;if(ex*ex+ez*ez>R2*2)continue;
      /* plantation rows and the planter's house */
      if(c.plant){const a=hash(c.x*3+c.y*5)*6.283,pr=(c._townR||.45)+.2,ox=cx+Math.cos(a)*pr,oz=cz+Math.sin(a)*pr,ca=Math.cos(a+1.57),sa=Math.sin(a+1.57),col=CROP_COL[c.plant]||0x6a8a3a;
        for(let i=0;i<5;i++)for(let j=0;j<7;j++){const u=(j-3)*.035,v=(i-2)*.04,x=ox+ca*u+Math.cos(a)*v,z=oz+sa*u+Math.sin(a)*v,g=groundY(x,z);if(g<waterY+.01||typeof inBuilding==='function'&&inBuilding(x,z))continue;
          if(c.plant==='cotton'){add('colBall',x,g,z,.018,.016,.018,0,0x5a7a3a);add('colBall',x,g+.012,z,.008,.008,.008,0,col)}else add('gwCone',x,g,z,.018,c.plant==='sugar'?.035:.022,.018,i,col)}
        const hx=ox+Math.cos(a)*.13,hz=oz+Math.sin(a)*.13,hg=groundY(hx,hz);if(hg>waterY+.01&&!(typeof inBuilding==='function'&&inBuilding(hx,hz))){add('gwBox',hx,hg,hz,.075,.05,.055,a,0xf4f0e6);add('gwCone',hx,hg+.05,hz,.09,.035,.07,a+.785,0x6a3a2a)}}
      /* orchards: rows of fruit trees, white and pink in spring, green in summer, heavy with fruit in autumn, bare in winter */
      if(c.orchard){const o=c.orchard,fc=FRUIT_COL[o.fruit]||0xc8342a;
        for(let i=0;i<3;i++)for(let j=0;j<4;j++){const [x,z]=orchardTree(cx,cz,o,i,j,c),g=groundY(x,z);if(g<waterY+.015||typeof inBuilding==='function'&&inBuilding(x,z))continue;const k=hash(i*7+j*3+c.x),sz=.036+k*.01;
          add('gwBox',x,g,z,.006,.028,.006,0,0x5a4030);
          if(sn==='Winter'){add('colBall',x,g+.022,z,sz*.8,sz*.55,sz*.8,0,0x7a6a5a);continue}
          const crown=sn==='Spring'?(k<.5?0xf6eef0:0xf2c8d8):sn==='Autumn'?0x7a8a3a:0x4a7a34;add('colBall',x,g+.022,z,sz,sz*.8,sz,k*3,crown);
          if(sn==='Autumn'||sn==='Summer'&&k>.6)for(let f=0;f<3;f++){const fa=f*2.1+k*5;add('colBall',x+Math.cos(fa)*sz*.42,g+.032+f*.004,z+Math.sin(fa)*sz*.42,.008,.008,.008,0,fc)}}}}}}
{const _bf=banditFrame;banditFrame=function(R2){_bf.apply(this,arguments);try{colonialFrame(R2)}catch(e){console.warn('colonial draw',e)}}}

/* ---------- the nation card ---------- */
function colonialNote(n){const C=n.company,cols=n.cities.filter(c=>c.colony||c.company),orch=n.cities.filter(c=>c.orchard).length,p=[];
  if(C){const ruled=C.posts.filter(P=>P.ruled).length,sea=ships.filter(s=>s.owner===n.id&&s.kind==='company'&&!s.sink).length;
    p.push(`<p class="note" style="margin:2px 0"><b>${esc(capF(C.name))}</b> · ${C.posts.length} trading post${C.posts.length===1?'':'s'}${ruled?` · rules ${ruled} of them`:''} · ${sea} ship${sea===1?'':'s'} at sea · since ${C.founded}</p>`)}
  else if(n.companyPast)p.push(`<p class="note" style="margin:2px 0">${esc(capF(n.companyPast.name))}, ${n.companyPast.from}–${n.companyPast.to}</p>`);
  if(cols.length)p.push(`<p class="note" style="margin:2px 0"><b>Colonies:</b> ${cols.slice(0,6).map(c=>esc(c.name)+(c.plant?` (${c.plant})`:'')).join(', ')}${cols.length>6?` and ${cols.length-6} more`:''}</p>`);
  if(n.slavery)p.push(`<p class="note" style="margin:2px 0;color:#a8382a"><b>Slavery</b> on its plantations since ${n.slavery}</p>`);else if(n.abolished)p.push(`<p class="note" style="margin:2px 0"><b>Slavery</b> abolished in ${n.abolished}</p>`);
  if(orch)p.push(`<p class="note" style="margin:2px 0"><b>Orchards</b> in ${orch} town${orch===1?'':'s'}</p>`);
  {const rl=n.cities.filter(c=>c.rail&&c!==n.cities[0]).length;if(rl)p.push(`<p class="note" style="margin:2px 0"><b>Railways</b> link ${rl} of ${n.cities.length-1} towns to ${esc(n.cities[0].name)}</p>`)}
  return p.length?`<div><span class="lab">Trade, land and railways</span>${p.join('')}</div>`:''}
{const _rn=renderNationCard;renderNationCard=function(){_rn.apply(this,arguments);const n=nations[selected];if(!n||!n.alive)return;const el=$('#nationCard');if(!el||el.querySelector('[data-colnote]'))return;
  const h_=colonialNote(n);if(!h_)return;const kv=el.querySelector('.kv');const d=document.createElement('div');d.dataset.colnote='1';d.innerHTML=h_;if(kv)kv.after(d);else el.appendChild(d)}}

/* ---------- the god's hand ---------- */
gp({id:'abolish',tab:'Faith',label:'Abolition',cost:40,icon:'dove',hint:'Tap a nation that keeps slaves. Your prophets move it to set them free.'},(i,n)=>{
  if(!needNation(n))return;if(!n.slavery){say(`${n.name} keeps no slaves.`);return}if(!spend(40))return;abolish(n,'god');n.devotion=clamp((n.devotion??.3)+.08,0,1);fx(n.cities[0].y*W+n.cities[0].x,'bless')});
