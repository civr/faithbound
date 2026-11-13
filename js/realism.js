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
  {const fs=n.cities.length?(n.fishCatch||0)/n.cities.length:0;H+=Math.min(.18,fs*(H<.9?.16:.07))}
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
function fishBoats(n,c){const lv=typeof townLevel==='function'?townLevel(n,c===n.cities[0]):6;return clamp(1+Math.floor(lv/3.5),1,5)}
function fishTick(n){let tot=0,k=0;const eF=FISH_ERA[n.era]||1;
  for(const c of n.cities){const g=fishGrounds(c);if(!g)continue;k++;if(c.fishStock==null)c.fishStock=1;const take=g*eF*Math.min(1,fishBoats(n,c)/3);
    /* heavy trawling settles the grounds around half their old wealth; the careful future takes far less */
    if(n.era>=6)c.fishStock=Math.max(.15,c.fishStock-.0035*take*(n.era>=7?.4:1));
    c.fishStock=Math.min(1,c.fishStock+.006*(1-c.fishStock)+(n.era<6?.005:0));
    if(c.fishStock<.35&&!c.fishedOut&&important(n)){c.fishedOut=1;log(`The fishing grounds off ${c.name} are fished out; the boats come home with half-empty nets.`,'era')}
    if(c.fishStock>.7)c.fishedOut=0;tot+=take*c.fishStock}
  n.fishTowns=k;n.fishCatch=tot}
function fishWord(n){if(!n.fishTowns)return 'None';const per=n.fishCatch/n.fishTowns;const out=n.cities.some(c=>c.fishStock!=null&&c.fishStock<.4);
  return `${n.fishTowns} town${n.fishTowns>1?'s':''} · ${per>.9?'rich':per>.55?'good':per>.3?'modest':'poor'} catch${out?' (fished out in places)':''}`}
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
