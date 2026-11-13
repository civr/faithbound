"use strict";
/* Faithbound — outlaws and barbarians.
   Outlaws rise inside a nation when its people are unhappy, hungry or worn down by war: a band makes camp in the woods or the hills,
   takes in the desperate, and raids the towns nearby for food, timber and silver. The nation sends its soldiers to clear them out; when
   the soldiers lose, the band grows, and a big band in a shaky country can seize a town and rule it as a free company.
   Barbarians are the wild tribes of the unclaimed land in the early ages: a horde camps in the wilderness beyond the borders and falls on
   the towns of any nation within reach, burning and looting. The strong drive them off and march on their camps; a weak town can be
   taken and become the seat of a chieftain. As the ages turn and the wild land is settled, the hordes break up.
   The bands live in GODW.bandits (saved with the world), the same list the Bandits power fills. */

const OUTLAW_A=['Red','Black','Grey','Hooded','Broken','Silent','Crooked','Merry','Burnt','Iron','Hollow','Ragged'],OUTLAW_B=['Hand','Brothers','Company','Wolves','Knives','Crows','Lanterns','Oak Men','Foxes','Hounds','Ravens','Free Riders'];
const HORDE_A=['Grey Wolf','Ashen','Bone','Horse','Storm','Red Elk','Black Boar','Iron Antler','Thunder','Wild Ox','Raven','Bear'],HORDE_B=['Horde','Clan','Riders','Host','Tribe','Warband'];
const pickOf=a=>a[(rng()*a.length)|0];
function bandName(kind){return kind==='barbarian'?`the ${pickOf(HORDE_A)} ${pickOf(HORDE_B)}`:`the ${pickOf(OUTLAW_A)} ${pickOf(OUTLAW_B)}`}
const BAND_MAX={outlaw:6,barbarian:3};
/* runtime only (not saved): what is being drawn for each band */
let BANDFX=[];
/* tallies of what the bands did this session, for the curious (and for testing) */
const BANDSTAT={};const bstat=k=>{BANDSTAT[k]=(BANDSTAT[k]||0)+1};
function bandNorm(b){if(!b.id)b.id=((rng()*1e9)|0)+1;if(!b.kind)b.kind='outlaw';if(b.str==null)b.str=b.kind==='barbarian'?20:12;if(!b.name)b.name=bandName(b.kind);
  if(b.nextRaid==null)b.nextRaid=year+2+((rng()*5)|0);if(b.born==null)b.born=year;if(b.nid==null)b.nid=owner[b.i]??-1;return b}
const bandX=b=>wx(b.i%W),bandZ=b=>wz((b.i/W)|0);
/* wild ground for a camp: forest, jungle, hills and mountains, away from the water */
function wildScore(j){const B=biome[j];if(isWater(j)||river[j]||B===2||B===10||B===12)return -1;return (B===5||B===6?1.2:B===11?1:B===9?.6:B===7?.3:0)+h[j]*2}
function townDist(x,y,nid){let best=1e9;for(const n of nations){if(!n.alive||(nid!=null&&n.id!==nid))continue;for(const c of n.cities){const d=Math.hypot(c.x-x,c.y-y);if(d<best)best=d}}return best}
function outlawCamp(n,X0,Y0,R){let camp=-1,bs=-1;
  const tiles=[];if(X0==null){for(let j=0;j<N;j++)if(owner[j]===n.id)tiles.push(j)}else for(let y=Math.max(0,Y0-R);y<=Math.min(H-1,Y0+R);y++)for(let x=Math.max(0,X0-R);x<=Math.min(W-1,X0+R);x++){const j=y*W+x;if(owner[j]===n.id)tiles.push(j)}
  for(const j of tiles){const s0=wildScore(j);if(s0<0)continue;const x=j%W,y=(j/W)|0,dc=townDist(x,y,n.id);if(dc<2.5||dc>9)continue;if(GODW.bandits.some(b=>Math.hypot(b.i%W-x,((b.i/W)|0)-y)<4))continue;
    const sc=s0+rng()*.4-(X0!=null?Math.hypot(x-X0,y-Y0)*.05:0);if(sc>bs){bs=sc;camp=j}}return camp}
function hordeCamp(){let best=-1,bs=-1;for(let q=0;q<500;q++){const j=(rng()*N)|0;if(owner[j]>=0||hab[j]<.02)continue;const s0=wildScore(j);if(s0<0)continue;const x=j%W,y=(j/W)|0,d=townDist(x,y);if(d<4||d>14)continue;
    if(GODW.bandits.some(b=>Math.hypot(b.i%W-x,((b.i/W)|0)-y)<6))continue;const sc=s0+rng()*.5-Math.abs(d-7)*.08;if(sc>bs){bs=sc;best=j}}return best}
/* the towns a band can reach: outlaws prey on the nation they hide in, a horde on anyone near */
function bandTargets(b,maxD){const x=b.i%W,y=(b.i/W)|0,out=[];
  for(const n of nations){if(!n.alive||(b.kind==='outlaw'&&n.id!==b.nid))continue;for(const c of n.cities){const d=Math.hypot(c.x-x,c.y-y);if(d<=maxD)out.push({n,c,d})}}
  return out.sort((a,b2)=>a.d-b2.d)}
/* strength in battle: a town's people and walls against the band's numbers; outlaws take up the weapons of their age, barbarians do not */
const walled=(n,c)=>typeof cityLevel==='function'&&cityLevel(n,n.cities.indexOf(c)===0)>=4;
function townDef(n,c){const cap=n.cities[0]===c,lv=typeof townLevel==='function'?townLevel(n,cap):3;return ERAS[n.era].mil*(walled(n,c)?1.35:1)*(1+.025*lv)*(cap?1.2:1)*(n.wars.size?.75:1.1)*(n.bless>0?1.3:1)*(.6+rng())}
function bandAtk(b,n){const w=b.kind==='barbarian'?ERAS[1].mil*1.2:ERAS[Math.min(n.era,4)].mil*1.2;return b.str/15*w*(.6+rng())}
function troopStr(n){return ERAS[n.era].mil*1.25*(1+.2*Math.min(8,n.cities.length))*(n.wars.size?.6:1)*(.5+stabOf(n))*(.7+rng())*(n.hero&&n.hero.until>year?1.4:1)}
const watched=n=>important(n)||n.id===selected;

function bandTick(){
  for(const b of GODW.bandits)bandNorm(b);
  /* ---- new bands ---- */
  const cnt=k=>GODW.bandits.filter(b=>b.kind===k).length;
  if(cnt('outlaw')<BAND_MAX.outlaw)for(const n of nations){if(!n.alive||n.tiles<8||!n.cities.length)continue;if(GODW.bandits.some(b=>b.kind==='outlaw'&&b.nid===n.id))continue;
    const hp=happyOf(n),st=stabOf(n),f=1+Math.max(0,.5-hp)*6+(n.famine>0?2:0)+(n.wars.size?1:0)+(st<.4?1.5:0)+(n.cities.some(c=>c.plundered&&year-c.plundered<10)?.5:0);
    if(rng()>.0015*f*(n.era>=7?.1:n.era>=6?.3:1)*dLevel())continue;const camp=outlawCamp(n);if(camp<0)continue;
    const b=bandNorm({i:camp,nid:n.id,kind:'outlaw',str:6+((rng()*6)|0),born:year});GODW.bandits.push(b);bstat('outSpawn');
    if(watched(n))log(`Outlaws calling themselves ${b.name} made camp in the wilds of ${n.name}. ${n.famine>0?'Hunger drove them to it.':hp<.4?'The poor and the angry flock to them.':n.wars.size?'Deserters from the war are among them.':'No road is safe.'}`,'war');break}
  if(cnt('barbarian')<BAND_MAX.barbarian&&nations.some(n=>n.alive&&n.era<=3)&&rng()<.012*dLevel()){const camp=hordeCamp();if(camp>=0){
      const b=bandNorm({i:camp,nid:-1,kind:'barbarian',str:14+((rng()*12)|0),born:year});GODW.bandits.push(b);bstat('barSpawn');const t=bandTargets(b,14)[0];
      if(t)log(`Barbarians of ${b.name} gather in the wild lands beyond ${t.n.name}.`,'war');milestone('barbarians','Barbarians','A horde gathered in the wild lands.')}}
  /* ---- the bands live ---- */
  GODW.bandits=GODW.bandits.filter(b=>{
    if(b.kind==='outlaw'){const o=owner[b.i];if(o>=0&&nations[o].alive)b.nid=o;const n=nations[b.nid];if(!n||!n.alive){return false}
      /* they take in the hungry and the angry, and lose men who drift home in good years */
      const hp=happyOf(n);b.str=clamp(b.str+(1-hp)*1.6+(n.famine>0?2:0)+(n.wars.size?.6:0)-.9+(rng()-.5),0,45);
      if(b.str<3){bstat('melt');if(watched(n))log(`${cap1(b.name)} melted away; its men went home to ${n.name}'s farms.`,'life');return false}
      /* while they hold the woods, merchants stay home and travellers are robbed */
      n.happy=clamp(hp-.003,0,1);n.tech=Math.max(0,n.tech-.15-.02*b.str);
      /* the soldiers come */
      if(year-(b.swept||-99)>4&&rng()<(.05+.012*n.era)*(n.wars.size?.35:1)*(.5+stabOf(n))){b.swept=year;const t=bandTargets(b,30)[0];
        const camp=1.3,won=troopStr(n)>bandAtk(b,n)*camp;bandFx(b,'troops',t?t.c:null,n,won);
        if(won){bstat('sweepWon');if(watched(n))log(`Soldiers of ${n.name} stormed the camp of ${b.name} and hanged their leaders.`,'war');return false}
        bstat('sweepLost');b.str=Math.min(45,b.str+3);n.happy=clamp(n.happy-.02,0,1);if(watched(n))log(`${cap1(b.name)} ambushed the soldiers of ${n.name} sent against them. Their fame spreads.`,'war')}
      /* a big band in a shaky country takes a town for itself */
      if(b.str>=26&&stabOf(n)<.45&&n.cities.length>=3){const t=bandTargets(b,7).find(q=>q.c!==q.n.cities[0]);if(t&&townDef(n,t.c)<bandAtk(b,n)){if(seizeTown(b,n,t.c))return false}}}
    else{/* barbarians: settled land swallows their camp, the civilised ages break them up */
      const o=owner[b.i];if(o>=0&&nations[o].alive){const n=nations[o];const won=troopStr(n)>bandAtk(b,n)*1.2;bandFx(b,'troops',bandTargets(b,30).find(q=>q.n===n)?.c||null,n,won);
        if(won){bstat('settledOver');if(watched(n))log(`${n.name} drove ${b.name} from their camp as its settlers moved in.`,'war');return false}
        b.i=hordeCamp();if(b.i<0)return false}
      const near=bandTargets(b,14);if(!near.length||near.every(t=>t.n.era>=4)){bstat('breakUp');if(near.length&&watched(near[0].n))log(`${cap1(b.name)} broke up; its families settled among the towns.`,'life');return false}
      b.str=clamp(b.str+.4+(rng()-.5)*1.2,0,35);
      if(b.str<6){bstat('scattered');if(near.length&&watched(near[0].n))log(`${cap1(b.name)} scattered after its defeats.`,'life');return false}
      /* the strong march on the horde's camp after it has raided them */
      const vic=nations[b.lastHit];if(vic&&vic.alive&&vic.era>=1&&year-(b.swept||-99)>5&&year-(b.hitY||-99)<12&&rng()<.06+.02*vic.era){b.swept=year;const won=troopStr(vic)>bandAtk(b,vic)*1.2;bandFx(b,'troops',bandTargets(b,30).find(q=>q.n===vic)?.c||null,vic,won);
        if(won){bstat('sweepWon');if(watched(vic))log(`An army of ${vic.name} marched on the camp of ${b.name} and scattered them.`,'war');return false}bstat('sweepLost');b.str=Math.min(35,b.str+3);if(watched(vic))log(`The army ${vic.name} sent against ${b.name} was cut down in the wild.`,'war')}}
    /* ---- the raid ---- */
    if(year>=b.nextRaid){let T=bandTargets(b,b.kind==='barbarian'?14:9);/* outlaws keep away from the capital and its garrison when they can */if(b.kind==='outlaw'&&T.some(t=>t.c!==t.n.cities[0]))T=T.filter(t=>t.c!==t.n.cities[0]);
      if(T.length){const t=T[Math.min(T.length-1,(rng()*Math.min(2,T.length))|0)],n=t.n,c=t.c;
        if(!(n.danegeld>year&&b.kind==='barbarian')){const won=bandAtk(b,n)>townDef(n,c);bandRaid(b,n,c,won)}}
      b.nextRaid=year+(b.kind==='barbarian'?5:3)+((rng()*(b.kind==='barbarian'?9:6))|0)}
    return true})}
const cap1=s=>s.charAt(0).toUpperCase()+s.slice(1);
function bandRaid(b,n,c,won){bandFx(b,'raid',c,n,won);bstat(b.kind+(won?'RaidWon':'RaidLost'));
  if(won){const bar=b.kind==='barbarian';n.pop*=bar?.95:.985;n.tech=Math.max(0,n.tech-TECHCOST[n.era]*(bar?.03:.01));if(n.wood!=null)n.wood=Math.max(0,n.wood-(bar?8:4));
    c.plundered=year;c.unrest=(c.unrest||0)+(bar?.12:.07);n.happy=clamp(happyOf(n)-(bar?.05:.025),0,1);b.str=clamp(b.str+(bar?-1:1),0,bar?35:45);b.loot=(b.loot||0)+1;b.lastHit=n.id;b.hitY=year;
    if(bar&&rng()<.5&&typeof ignite==='function')setTimeout(()=>{try{ignite(c.y*W+c.x)}catch(e){}},6000);
    if(watched(n))log(bar?`Barbarians of ${b.name} fell on ${c.name} in ${n.name}, burning and looting.`:`Outlaws of ${b.name} raided ${c.name} in ${n.name} and carried off grain and silver.`,'war');
    /* a horde that overruns a small town keeps it */
    if(bar&&b.str>=28&&n.cities.length>=2&&c!==n.cities[0]&&rng()<.35&&seizeTown(b,n,c))b.gone=true}
  else{b.str*=.65;b.lastHit=n.id;b.hitY=year;if(watched(n))log(`The people of ${c.name} drove off ${b.kind==='barbarian'?'the barbarians of '+b.name:b.name}.`,'war')}}
function seizeTown(b,n,c){const before=nations.length;
  const msg=b.kind==='barbarian'?`${cap1(b.name)} took ${c.name} from ${n.name}; their chieftain rules it now.`:`${cap1(b.name)} seized ${c.name} and rule it as a free company, no longer subjects of ${n.name}.`;
  try{rebel(n,c,'free',msg)}catch(e){return false}
  if(nations.length===before)return false;bstat(b.kind+'Seized');const R_=nations[nations.length-1];if(R_){R_.aggr=Math.max(R_.aggr||.5,.75);R_.outlawBorn=b.kind}return true}
{const _bt=banditTick;banditTick=function(){try{bandTick()}catch(e){console.warn('bands',e)}GODW.bandits=GODW.bandits.filter(b=>!b.gone)}}

/* ---------- what you see ---------- */
/* a raiding party walks from the camp to the town and back; soldiers march from their town to the camp and fight there */
function bandFx(b,kind,c,n,won){if(!c)return;BANDFX.push({kind,bk:b.kind,from:[bandX(b),bandZ(b)],to:[wx(c.x),wz(c.y)],c,nid:n.id,won,t:0,dur:kind==='raid'?16:18,seed:(rng()*1e9)|0,men:null,size:Math.round(clamp(b.str/2.5,4,16))});if(BANDFX.length>12)BANDFX.shift()}
function bandMen(F){const n=nations[F.nid],men=[];
  for(let i=0;i<F.size;i++){const r=mulberry32(F.seed+i*31),w={seed:F.seed+i*17,t:i,ph:r()*6,moving:true,wait:0,act:'walk',x:F.from[0],z:F.from[1],dir:0,sol:true,off:[(r()-.5)*.3,(r()-.5)*.3],lag:r()*.12};
    if(F.kind==='troops'&&n){soldierKit(w,n);w.skin=SKIN[(r()*SKIN.length)|0];w.hair=FHAIR[(r()*FHAIR.length)|0];w.nid=n.id;w.wpn='pike'}
    else if(F.bk==='barbarian'){soldierKit(w,{era:0,color:'#6a4a2a'});w.top=[0x8a7254,0x6a5a40,0x9a8a6a,0x5a4a34][(r()*4)|0];w.bot=0x4a3a28;w.skin=SKIN[(r()*SKIN.length)|0];w.hair=[0xc9a45a,0x6e3a1e,0x2a2018,0x8a6a3a][(r()*4)|0];w.long=r()<.6;
      w.hat=r()<.3?'helm':null;w.hatCol=0x8a7a5a;w.nid=-1;w.shieldCol=[0x6a4a2a,0x8a2a1e,0xd8c8a0][(r()*3)|0];w.wpn='axe'}
    else{soldierKit(w,{era:1,color:'#3a4a2a'});w.top=[0x3a4a2a,0x4a3a2a,0x2a3a2a,0x5a4a34][(r()*4)|0];w.bot=0x3a3024;w.skin=SKIN[(r()*SKIN.length)|0];w.hair=FHAIR[(r()*FHAIR.length)|0];
      w.hat='hood';w.hatCol=w.top;w.nid=-1;w.wpn=r()<.4?'bow':'club'}
    w.uni=w.uni??1;men.push(w)}return men}
function updateBandFx(dt){for(let q=BANDFX.length-1;q>=0;q--){const F=BANDFX[q];F.t+=dt;if(F.t>F.dur){BANDFX.splice(q,1);continue}
    if(Math.hypot(F.to[0]-camT.x,F.to[1]-camT.z)>camDist*1.4+3&&Math.hypot(F.from[0]-camT.x,F.from[1]-camT.z)>camDist*1.4+3)continue;const f=F.t/F.dur;
    /* a looted town burns a little; a camp stormed by soldiers goes up in flames */
    if(F.kind==='raid'&&F.won&&f>.32&&f<.75&&rng()<dt*(F.bk==='barbarian'?8:4)){const a=rng()*6.28,r=rng()*.32,x=F.to[0]+Math.cos(a)*r,z=F.to[1]+Math.sin(a)*r,y=groundY(x,z);emit('fire',x,y+.02,z);emit('smoke',x,y+.06,z)}
    if(F.kind==='troops'&&F.won&&f>.42&&f<.8&&rng()<dt*6){const a=rng()*6.28,r=rng()*.15,x=F.from[0]+Math.cos(a)*r,z=F.from[1]+Math.sin(a)*r,y=groundY(x,z);emit('fire',x,y+.02,z);emit('smoke',x,y+.06,z)}}}
function drawBandFx(R2){if(!BANDFX.length||camDist>=16||settings.people===false)return;const now=performance.now()/1000;
  for(const F of BANDFX){const mx=(F.from[0]+F.to[0])/2,mz=(F.from[1]+F.to[1])/2,ex=mx-camT.x,ez=mz-camT.z;if(ex*ex+ez*ez>R2*2)continue;
    if(!F.men)F.men=bandMen(F);const f=F.t/F.dur;
    /* raiders go from camp to town; troops from town to camp. The losers run back early, the winners take their time */
    const A=F.kind==='raid'?F.from:F.to,B=F.kind==='raid'?F.to:F.from;
    for(const w of F.men){const goal=[B[0]+w.off[0],B[1]+w.off[1]];let x,z,mv=true,fight=false;
      if(f<.32+w.lag){const k=clamp((f-w.lag*.5)/.32,0,1);x=lerp(A[0],goal[0],k);z=lerp(A[1],goal[1],k)}
      else if(f<.72){x=goal[0]+Math.sin(now*.9+w.seed)*.05;z=goal[1]+Math.cos(now*.7+w.seed)*.05;mv=Math.sin(now*2+w.seed)>0;fight=true;if(F.kind==='raid'&&F.won)w.pack=0x8a6a44}
      else{const k=clamp((f-.72)/.25,0,1);x=lerp(goal[0],A[0],k);z=lerp(goal[1],A[1],k)}
      /* the losing side does not all come home */
      if(f>.72&&!F.won&&(w.seed%3===0))continue;
      if(groundY(x,z)<waterY+.004)continue;
      const dx=x-(w.x??x),dz=z-(w.z??z);if(Math.hypot(dx,dz)>1e-5)w.dir=Math.atan2(dx,dz);w.x=x;w.z=z;w.moving=mv;if(mv)w.ph+=.35;w.t=now;w.act=fight?'chat':'walk';
      drawFolk(w);
      const fx=Math.sin(w.dir),fz=Math.cos(w.dir),rx=Math.cos(w.dir),rz=-Math.sin(w.dir),gy=groundY(x,z),sw=fight?Math.sin(now*7+w.seed)*.9:mv?Math.sin(w.ph)*.4:0;
      if(w.wpn==='pike')addR('pStick',x-rx*.008,gy+.03,z-rz*.008,.001,.05,.001,w.dir,fight?-1.1+sw*.2:-.15,0,0x6a5034);
      else if(w.wpn==='bow')addR('pStick',x-rx*.008+fx*.004,gy+.026,z-rz*.008+fz*.004,.0011,.024,.0011,w.dir,.25,0,0x6a4a2a);
      else{addR('pStick',x-rx*.008+fx*.004,gy+.026,z-rz*.008+fz*.004,.0012,.02,.0012,w.dir,-.6+sw,0,0x5a3e28);if(w.wpn==='axe')addR('pPack',x-rx*.008+fx*.013,gy+.013+sw*.004,z-rz*.008+fz*.013,.0015,.007,.006,w.dir,0,0,0xa8b0b8)}}}}
/* the camps: tents round a fire, a few men about it; a horde's camp is bigger, with hide tents and a totem */
banditFrame=function(R2){for(const b of GODW.bandits){bandNorm(b);const x=bandX(b),z=bandZ(b),ex=x-camT.x,ez=z-camT.z;if(ex*ex+ez*ez>R2*3)continue;const y=groundY(x,z),bar=b.kind==='barbarian';
    const nT=bar?5:3;for(let k=0;k<nT;k++){const a=k*6.283/nT+(b.id%7),r=bar?.15:.11,tx=x+Math.cos(a)*r,tz=z+Math.sin(a)*r;add('gwCone',tx,groundY(tx,tz),tz,bar?.09:.085,bar?.1:.08,bar?.09:.085,a,bar?[0x8a7254,0x6a5440,0x9a8466][k%3]:k?0xb09a70:0x8a5a3a)}
    if(bar){add('gwBox',x+.05,y,z-.05,.012,.16,.012,0,0x5a4430);add('gwBox',x+.05,y+.15,z-.05,.04,.02,.012,0,0xd8d0b8)}
    if(rng()<.15){emit('fire',x,y+.01,z);emit('smoke',x,y+.05,z)}}};
function drawCampFolk(R2){if(camDist>=12||settings.people===false)return;const now=performance.now()/1000;
  for(const b of GODW.bandits){const x=bandX(b),z=bandZ(b),ex=x-camT.x,ez=z-camT.z;if(ex*ex+ez*ez>R2)continue;
    const fx_=BANDFX.find(F=>F.kind==='raid'&&F.bk===b.kind&&F.from[0]===x&&F.from[1]===z);const n=Math.min(fx_?2:5,Math.ceil(b.str/6));
    if(!b._folk||b._folk.length!==n){b._folk=bandMen({kind:'camp',bk:b.kind,nid:-1,size:n,seed:b.id,from:[x,z]})}
    b._folk.forEach((w,i)=>{const a=i*2.4+b.id,r=.06+(i%2)*.025;w.x=x+Math.cos(a)*r;w.z=z+Math.sin(a)*r;w.dir=Math.atan2(x-w.x,z-w.z);w.moving=false;w.sit=i%3!==2;w.act='chat';w.t=now+i;w.wait=1;drawFolk(w)})}}
{const _da=drawArmyFolk;drawArmyFolk=function(R2){_da.apply(this,arguments);try{drawBandFx(R2);drawCampFolk(R2)}catch(e){console.warn('bands draw',e)}}}
{const _ul=updateLiving;updateLiving=function(dt,k,now){const r=_ul.apply(this,arguments);try{updateBandFx(dt*(k>0?1:0))}catch(e){BANDFX=[]}return r}}
/* the save must not carry the drawn men */
{const _bs=buildSave;buildSave=function(){const d=_bs.apply(this,arguments);if(d&&d.godw&&d.godw.bandits)for(const b of d.godw.bandits)delete b._folk;return d}}
{const _as=applySave;applySave=function(){const r=_as.apply(this,arguments);BANDFX=[];return r}}

/* a name over each camp you can see */
document.addEventListener('DOMContentLoaded',()=>{const _draw=drawOverlay;drawOverlay=function(now){_draw(now);if(!playing||typeof spaceView!=='undefined'&&spaceView||camDist>26)return;const dpr=ov.width/innerWidth;
  for(const b of GODW.bandits){const x=bandX(b),z=bandZ(b),[sx,sy,sz]=project(x,groundY(x,z)+.22,z);if(sz>1||sx<0||sy<0||sx>ov.width||sy>ov.height)continue;
    const txt=`${cap1(b.name)} · ${Math.round(b.str)} ${b.kind==='barbarian'?'warriors':'men'}`;octx.font=`600 ${Math.round(10*dpr)}px system-ui,sans-serif`;const tw=octx.measureText(txt).width;
    octx.fillStyle='rgba(20,16,10,.72)';octx.fillRect(sx-tw/2-5*dpr,sy-13*dpr,tw+10*dpr,16*dpr);octx.textAlign='center';octx.fillStyle=b.kind==='barbarian'?'#f0a196':'#e8c87a';octx.fillText(txt,sx,sy-1*dpr);octx.textAlign='left'}}});

/* the nation card names the bands that trouble a nation */
function bandNote(n){const L=GODW.bandits.filter(b=>b.kind==='outlaw'?b.nid===n.id:bandTargets(b,14).some(t=>t.n===n));if(!L.length)return '';
  return `<div><span class="lab">Outlaws and raiders</span>${L.map(b=>`<p class="note" data-band="${b.id}" style="margin:2px 0;cursor:pointer" title="Click to look"><b style="color:${b.kind==='barbarian'?'#a8382a':'#8a6414'}">${esc(cap1(b.name))}</b> · ${Math.round(b.str)} ${b.kind==='barbarian'?'barbarian warriors in the wild lands':'outlaws in the '+(biome[b.i]===5||biome[b.i]===6?'woods':'hills')}${b.hitY&&year-b.hitY<15&&b.lastHit===n.id?` · raided ${year-b.hitY<1?'this year':year-b.hitY===1?'last year':(year-b.hitY)+' years ago'}`:''}</p>`).join('')}</div>`}
{const _rn=renderNationCard;renderNationCard=function(){_rn.apply(this,arguments);const n=nations[selected];if(!n||!n.alive)return;const el=$('#nationCard');if(!el||el.querySelector('[data-bandnote]'))return;
  const h_=bandNote(n);if(!h_)return;const kv=el.querySelector('.kv');const d=document.createElement('div');d.dataset.bandnote='1';d.innerHTML=h_;if(kv)kv.after(d);else el.appendChild(d)}}
document.addEventListener('DOMContentLoaded',()=>{const el=$('#nationCard');if(el)el.addEventListener('click',e=>{const t=e.target.closest('[data-band]');if(!t)return;const b=GODW.bandits.find(q=>q.id===+t.dataset.band);if(b)focusOn(bandX(b),bandZ(b),5)},true)});

/* ---------- the god's hand ---------- */
/* send a horde against a nation: it gathers in the wild land nearest to where you point */
gp({id:'horde',tab:'Strife',label:'Barbarians',cost:35,icon:'tent2',hint:'Tap land near a nation. A barbarian horde gathers in the wild nearby and raids its towns.'},(i,n)=>{
  const X0=i%W,Y0=(i/W)|0;let camp=-1,bs=-1;for(let y=Math.max(0,Y0-8);y<=Math.min(H-1,Y0+8);y++)for(let x=Math.max(0,X0-8);x<=Math.min(W-1,X0+8);x++){const j=y*W+x;const s0=wildScore(j);if(s0<0)continue;
    const dc=townDist(x,y);if(dc<2.5)continue;const sc=s0+(owner[j]<0?1.5:0)-Math.hypot(x-X0,y-Y0)*.08+rng()*.2;if(sc>bs){bs=sc;camp=j}}
  if(camp<0){say('There is no wild land near here for a horde to gather.');return}if(!spend(35))return;
  const b=bandNorm({i:camp,nid:-1,kind:'barbarian',str:26+((rng()*10)|0),born:year,nextRaid:year+1});GODW.bandits.push(b);fx(camp,'war');
  log(`At your call, barbarians of ${b.name} gathered in the wild.`,'war');milestone('barbarians','Barbarians','A horde gathered in the wild lands.')});
if(typeof CRUEL_POWERS!=='undefined')CRUEL_POWERS.add('horde');
/* fire, lightning and falling stars hit a camp hard */
{const _ig=typeof ignite==='function'?ignite:null;if(_ig)ignite=function(i){const r=_ig.apply(this,arguments);if(r){const x=i%W,y=(i/W)|0;for(const b of GODW.bandits){if(Math.hypot(b.i%W-x,((b.i/W)|0)-y)<=1.2&&!b._burnt){b._burnt=1;b.str*=.55;setTimeout(()=>{b._burnt=0},20000);
      const n=nations[b.nid];if(n&&watched(n)||b.kind==='barbarian')log(`Fire swept through the camp of ${b.name}.`,'war')}}}return r}}
