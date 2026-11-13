/* Faithbound — a more believable world: harvests that follow the weather, families that move to better land,
   wars with a cause, refugees from burned towns, and treaties that hold. */

/* ---------- harvests ---------- */
function harvestOf(n){
  let H=1.02+Math.min(.12,n.era*.02);
  H-=Math.abs(climate.temp-.5)*1.1;H-=Math.max(0,.35-climate.rain)*.8;
  if(typeof dryCapital==='function'&&dryCapital(n))H-=.22;
  n._hw=(n._hw||0)*.45+(rng()-.5)*.2;H+=n._hw;
  /* the weather pattern over this land: drought starves the fields, good rains fill the barns, endless rain rots them */
  const A=rainAnom(n);n.rainA=A;n.harvWhy=null;
  if(A<-.38){H-=.3*Math.min(1,(-A-.38)/.4);n.harvWhy='drought'}else if(A>.7){H-=.12;n.harvWhy='endless rain'}else if(A>.25){H+=.1*Math.min(1,(A-.25)/.3);n.harvWhy='good rains'}
  /* fishermen: what the boats bring in feeds the towns, and matters most when the fields fail */
  /* the catch does not fail with the fields: the share of the food that comes from the sea is a fair harvest whatever the weather does to the
     crops, so a fishing people is hit far less by drought, frost and rot */
  {const fs=clamp(n.fishShare||0,0,.6);if(fs>0)H=H*(1-fs)+Math.max(H,1)*fs}
  /* orchards: fruit carries a town through a lean year */
  {const o=n.cities.length?n.cities.filter(c=>c.orchard).length/n.cities.length:0;if(o)H+=.05*o*(H<.9?1.5:1)}
  if(n.wars.size)H-=.04*n.wars.size+(n.front&&n.front.length>20?.08:0);
  if(n.famine>0)H-=.25;if(n.sick)H-=.08;if(n.bless>0)H+=.22;if(n.festival>0)H+=.04;
  return clamp(H,.3,1.4)}
/* ---------- fishing grounds ----------
   A town's catch depends on its waters (shallow sea is richest, deep sea gives less, a river helps), on its boats (more for bigger towns) and on
   the age: nets, then sails, then motor trawlers. From the modern age the trawlers can take more than the sea gives: the grounds thin out
   and recover only slowly. */
const FISH_ERA=[.6,.8,.9,1,1.1,1.2,1.5,1.4];
/* the sea a town can fish from: water within two tiles of it, nearest first */
function seaNear(c){if(c._snV===terrVer&&c._sn)return c._sn;const out=[];for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const X=c.x+dx,Y=c.y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const j=Y*W+X;if(isWater(j))out.push([Math.hypot(dx,dy),j])}
  out.sort((a,b)=>a[0]-b[0]);c._snV=terrVer;c._sn=out.slice(0,4).map(q=>q[1]);return c._sn}
function fishGrounds(c){if(c._fgV===terrVer&&c._fgN!=null)return c._fgN;let g=0;const coast=seaNear(c).length,riv=!!river[c.y*W+c.x];
  if(coast)for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const X=c.x+dx,Y=c.y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const j=Y*W+X;if(isWater(j))g+=biome[j]===1?1:.4}
  if(riv)g+=coast?3:4;c._fgV=terrVer;c._fgN=Math.min(1,g/12);return c._fgN}
/* how many boats a town's harbour can keep: more for bigger towns */
function fishBoats(n,c){const lv=typeof townLevel==='function'?townLevel(n,c===n.cities[0]):6;return clamp(1+Math.floor(lv/3.5),1,5)}
/* ---------- the fishing fleets ----------
   Every fishing town has a real fleet (c.boats). Boats are built one a year from timber (steel hulls from the modern age need none), and
   they are lost: to the sea itself now and then, far more often when a storm sweeps the grounds, to pirates and Viking raiders who take
   them, and to enemy warships, whose blockade also keeps the rest in port. Only the boats afloat and able to sail bring in the catch, so a
   town that loses its fleet goes hungry until the shipwrights have rebuilt it, and a land short of timber cannot rebuild at all. */
const BOAT_WOOD=[1,1,1,2,2,3,0,0],BOAT_RISK=[.03,.025,.02,.018,.015,.012,.006,.004];
function fishHazard(n,c){const x=wx(c.x),z=wz(c.y);let storm=0,raid=null,block=null;
  if(typeof storms!=='undefined')for(const S of storms){if(S.kind==='shower')continue;if(Math.hypot(S.x-x,S.z-z)<S.r+3)storm=Math.max(storm,S.kind==='hurricane'?1:.6)}
  if(typeof ships!=='undefined')for(const s of ships){if(s.sink||s.owner===n.id||Math.hypot(s.x-x,s.z-z)>4)continue;
    if(s.kind==='pirate'||(s.kind==='viking'&&!s.homeward))raid=raid||s;else if(s.kind==='war'&&s.owner>=0&&n.wars.has(s.owner))block=block||s}
  return{storm,raid,block}}
function fishTick(n){let tot=0,k=0,boats=0;const eF=FISH_ERA[n.era]||1;
  for(const c of n.cities){const g=fishGrounds(c);if(!g)continue;k++;if(c.fishStock==null)c.fishStock=1;
    const cap=fishBoats(n,c);if(c.boats==null)c.boats=Math.min(2,cap);
    /* the shipwrights: one new boat a year while the harbour has room and there is timber */
    c.noTimber=0;if(c.boats<cap){const w=BOAT_WOOD[n.era]||0;if(!w||(n.wood??30)>=w){if(w)n.wood=(n.wood??30)-w;c.boats++}else{/* no timber in the stores: the fishermen still build now and then from driftwood and the last trees nearby, only slowly */c.noTimber=1;if(rng()<.3)c.boats++}}
    const Z=fishHazard(n,c),risk=(BOAT_RISK[n.era]||.01)*(1+Z.storm*9)+(Z.raid?.22:0)+(Z.block?.12:0);let lost=0;
    for(let b=0;b<c.boats;b++)if(rng()<risk)lost++;
    if(lost){c.boats-=lost;const why=Z.raid?(Z.raid.kind==='viking'?'Viking raiders':'pirates'):Z.block?'enemy warships':Z.storm?(Z.storm>=1?'a hurricane':'a storm'):'the sea';
      c.lost=c.lost&&c.lost.why===why&&year-c.lost.year<=5?{n:c.lost.n+lost,why,year}:{n:lost,why,year};n.boatsLost=(n.boatsLost||0)+lost;
      if((important(n)||n.id===selected)&&(Z.raid||Z.block||Z.storm||lost>1)&&year-(n._boatLog||-99)>6){n._boatLog=year;
        log(Z.raid?`${Z.raid.kind==='viking'?'Viking raiders':'Pirates'} took ${lost} fishing boat${lost>1?'s':''} off ${c.name}.`:Z.block?`Enemy warships sank ${lost} fishing boat${lost>1?'s':''} off ${c.name}; the rest stay in port.`:`${Z.storm>=1?'A hurricane':Z.storm?'A storm':'The sea'} sank ${lost} fishing boat${lost>1?'s':''} off ${c.name}.`,Z.raid||Z.block?'war':'life')}}
    /* only the boats that can put to sea fish: a storm keeps most in port, a blockade nearly all, raiders half */
    const work=(1-.7*Z.storm)*(Z.block?.3:1)*(Z.raid?.5:1),take=g*eF*Math.min(1,c.boats/3)*work;boats+=c.boats;
    /* heavy trawling settles the grounds around half their old wealth; the careful future takes far less */
    if(n.era>=6)c.fishStock=Math.max(.15,c.fishStock-.0035*take*(n.era>=7?.4:1));
    c.fishStock=Math.min(1,c.fishStock+.006*(1-c.fishStock)+(n.era<6?.005:0));
    if(c.fishStock<.35&&!c.fishedOut&&important(n)){c.fishedOut=1;log(`The fishing grounds off ${c.name} are fished out; the boats come home with half-empty nets.`,'era')}
    if(c.fishStock>.7)c.fishedOut=0;c.catch=take*c.fishStock;tot+=c.catch}
  n.fishTowns=k;n.fishCatch=tot;n.fishBoatsN=boats}
function fishWord(n){if(!n.fishTowns)return 'None';const per=n.fishCatch/n.fishTowns;const out=n.cities.some(c=>c.fishStock!=null&&c.fishStock<.4);
  const fs=Math.round((n.fishShare||0)*100);return `${n.fishBoatsN??0} boat${n.fishBoatsN===1?'':'s'} · ${per>.9?'rich':per>.55?'good':per>.3?'modest':per>0?'poor':'no'} catch${out?', fished out in places':''}${fs>=1?` · ${fs}% of the food`:''}`}
/* what has happened to the fleets lately, for a line under the nation card */
function fishNote(n){if(!n.fishTowns)return '';const L=n.cities.filter(c=>c.lost&&year-c.lost.year<=5).sort((a,b)=>b.lost.year-a.lost.year)[0],idle=n.cities.filter(c=>c.noTimber);
  const p=[];if(L)p.push(`lost ${L.lost.n} boat${L.lost.n>1?'s':''} to ${L.lost.why} off ${esc(L.name)}`);if(idle.length)p.push(`short of timber, boats are built slowly${idle.length===1?' at '+esc(idle[0].name):''}`);
  return p.length?`<p class="note" style="margin:2px 0"><b>Fishing fleets:</b> ${p.join(' · ')}</p>`:''}
function harvestTick(){if(typeof wxPattern==='function')wxPattern();
  for(const n of nations)if(n.alive&&n.cities.length)try{fishTick(n)}catch(e){}
  /* heavy rain years on a river land can end in a flood */
  for(const n of nations){if(!n.alive||!n.cities.length||typeof riverFlood!=='function')continue;const A=rainAnom(n);
    if(A>.6&&rng()<.012*(A-.5)*10*dLevel()){const c=n.cities[(rng()*n.cities.length)|0];if(c&&riverFlood(c.y*W+c.x)){n.pop*=.99}}}
  for(const n of nations){if(!n.alive||!n.cities.length)continue;
  const H=harvestOf(n);n.harvest=H;
  /* droughts and wet spells are news: they start and end */
  {const A=n.rainA??0;if(!n.drought&&A<-.5){n.drought=year;if(important(n)||n.id===selected)log(`A drought grips ${n.name}. The rivers run low and the fields crack.`,'doom')}
   else if(n.drought&&A>-.3){if(year-n.drought>2&&(important(n)||n.id===selected))log(`The rains have returned to ${n.name} after ${year-n.drought} dry years.`,'life');n.drought=0}}
  n.pop*=1+clamp(H-1,-.5,.4)*.03;
  n.happy=clamp((n.happy??.6)+(H-1)*.025,0,1);
  if(n.wars.size){n.warYears=(n.warYears||0)+1;n.happy=clamp(n.happy-.003*Math.min(3,n.wars.size)-(n.warYears>12?.004:0),0,1)}else n.warYears=0;
  if(H<.45&&!n.famine&&typeof startFamine==='function'&&rng()<.12*dLevel())startFamine(n,'hunger');
  if(important(n)&&year-(n._hlog||-99)>40){
    if(H<.55){n._hlog=year;log(`A poor harvest in ${n.name}. Bread is scarce this winter.`,'life')}
    else if(H>1.3){n._hlog=year;log(`A rich harvest in ${n.name}. The barns are full.`,'life')}}}
}
const harvestWord=H=>H==null?'—':H<.55?'Poor':H<.85?'Thin':H<1.1?'Fair':H<1.25?'Good':'Rich';

/* ---------- families move to better land ---------- */
function migrationTick(){if(year%3)return;
  for(const A of nations){if(!A.alive||!A.cities.length||A.harvest==null)continue;
    for(const b of A.nb||[]){const B=nations[b];if(!B||!B.alive||!B.cities.length||B.harvest==null||A.wars.has(b))continue;
      const pull=(A.harvest-B.harvest)+((A.happy??.6)-(B.happy??.6))*.5+(B.wars.size?.25:0);
      if(pull<.35||A.pop>A.cap*.95)continue;const m=Math.min(B.pop*.012*pull,A.cap-A.pop);if(m<1)continue;
      B.pop-=m;A.pop+=m;
      if((important(A)||important(B))&&year-(B._mlog||-99)>40&&m>B.pop*.006){B._mlog=year;log(`Families from ${B.name} moved to ${A.name} in search of ${B.wars.size?'safety':'better land'}.`,'life')}}}}

/* ---------- refugees from a sacked town ---------- */
function refugees(B,A,lost){if(!(lost>0))return;
  const safe=[...(B.nb||[])].map(i=>nations[i]).filter(m=>m&&m.alive&&m!==A&&!m.wars.has(B.id)&&m.cities.length);
  const share=lost*.5;
  if(safe.length){const T=safe[(rng()*safe.length)|0];T.pop+=share;if(important(B)||important(T))log(`Refugees from ${B.name} fled to ${T.name}.`,'life')}
  else B.pop+=share*.6}

/* ---------- why a war starts ---------- */
function warReason(a,b,kind){
  if(kind==='god')return 'By your command';if(kind==='rebel')return 'Independence';if(kind==='ally')return 'Called to arms by an ally';
  if(typeof holyWarFactor==='function'&&a.faith>=0&&a.faith!==b.faith&&holyWarFactor(a,b)>1.2)return `Holy war for ${faiths[a.faith].name}`;
  const cv=typeof covets==='function'&&covets(a,b);if(cv&&RESOURCES[cv])return `For the ${RESOURCES[cv].label.toLowerCase()} of ${b.name}`;
  if(typeof rivalry==='function'&&rivalry(a,b)>=2)return 'Old grudges';
  if(a.pop>a.cap*.8)return 'Land for a growing people';
  if(a.faith>=0&&a.faith!==b.faith)return 'A clash of faiths';
  return 'A border quarrel'}
{const _sw=startWar;startWar=function(a,b,kind){const was=a&&b&&a.wars.has(b.id);const why=!was&&a&&b?warReason(a,b,kind):null;
  const r=_sw.apply(this,arguments);
  if(!was&&a&&b&&a.wars.has(b.id)){const k=warKey(a,b);const w=warData[k]||(warData[k]={score:0,years:0,start:year});if(!w.why)w.why=why;if(w.att==null)w.att=a.id}
  return r}}

/* ---------- peace is a treaty that holds ---------- */
{const _mp=makePeace;makePeace=function(a,b,god){const was=a&&b&&a.wars.has(b.id);const r=_mp.apply(this,arguments);
  if(was&&a.alive&&b.alive){const yrs=god?20:(settings.mood==='turbulent'?12:settings.mood==='lively'?18:25);
    a.pacts=a.pacts||{};b.pacts=b.pacts||{};a.pacts[b.id]=b.pacts[a.id]=Math.max(a.pacts[b.id]||0,year+yrs);
    if(important(a)||important(b))log(`${a.name} and ${b.name} signed a treaty: ${yrs} years of peace.`,'life')}
  return r}}

{const _t=tick;tick=function(){_t.apply(this,arguments);harvestTick();migrationTick()}}

/* ---------- endless play: after the last discovery, nations keep building great future works ---------- */
const FUTURE_WORKS=['Ocean arcologies','A fusion grid','Weather mastery','Orbital gardens','Longevity clinics','Deep-sea farms','Carbon scrubbers','Lunar shipyards','Desert greening','Quantum archives','A sky elevator','Coral restoration','Rewilded continents','Asteroid mining','Living cities'];
const FW_ROMAN=k=>['','II','III','IV','V','VI','VII','VIII','IX','X'][Math.min(9,k)]||String(k+1);
{const _rs=research;research=function(n,pts){_rs.apply(this,arguments);
  if(n.research||n.era<ERAS.length-1)return;
  n.fwT=(n.fwT||0)+pts;const cost=TECHCOST[n.era]*.8;if(n.fwT<cost)return;
  n.fwT-=cost;n.fw=(n.fw||0)+1;const k=n.fw-1,L=FUTURE_WORKS.length,name=FUTURE_WORKS[k%L]+(k>=L?' '+FW_ROMAN(Math.floor(k/L)):'');
  n.lastWork=name;n.pop*=1.03;n.happy=clamp((n.happy??.6)+.03,0,1);
  if(climate.anth>0)climate.anth=Math.max(0,climate.anth-.004);
  if(n.id===selected||important(n))log(`${n.name} completed ${name}.`,'era')}}
