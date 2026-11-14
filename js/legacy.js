"use strict";
/* Faithbound — legendary nations.
   Now and then a people becomes more than a country: a warrior state that raises every boy as a soldier, a merchant republic
   whose ships rule the seas, an eternal empire on whose roads the whole world travels, a city of philosophers, a holy city, a horde
   of horse lords. It has to be earned (by wars won, trade, learning, faith or sheer age), it is rare (a few in a whole world,
   never all at once), and every legend ends its own way: the empire splits in two and falls, the horde breaks up among the khan's
   sons, the library burns. */

const LEG={
  warrior:{title:'the Warrior State',mod:{mil:1.6,war:1.2,grow:.93,stab:1.1},col:0xb87333,
    born:n=>`${n.name} has become a warrior state. Its boys are taken from their mothers at seven and raised as soldiers; its towns need no walls, for its men are its walls.`},
  merchant:{title:'Queen of the Seas',mod:{sea:1.5,tech:1.1,grow:1.06,peace:1.2},col:0xd8b860,
    born:n=>`${n.name} has become the great merchant power of the age. Its ships reach every shore and its harbour is the richest in the world.`},
  eternal:{title:'the Eternal Empire',mod:{stab:1.35,exp:1.2,mil:1.15,grow:1.04},col:0xc8a040,
    born:n=>`${n.name} has become the Eternal Empire. All roads lead to ${n.cities[0].name}, its law runs from sea to mountain, and its people think it will last forever.`},
  learning:{title:'the City of Philosophers',mod:{tech:1.35,spread:1.15,peace:1.1},col:0xe8e4d8,
    born:n=>`${n.cities[0].name} of ${n.name} has become the seat of learning of the world. Scholars come from every land to its great library.`},
  holy:{title:'the Holy City',mod:{belief:1.4,stab:1.15,spread:1.3},col:0xf0e0a0,
    born:(n,F)=>`${n.cities[0].name} has become the holy city of ${F?F.name:'the faith'}. Pilgrims walk to it from every land that keeps the faith.`},
  horde:{title:'the Horde',mod:{war:1.7,exp:1.5,mil:1.35,stab:.8,tech:.9},col:0x8a5a3a,
    born:n=>`The horse lords of ${n.name} have become a horde. They ride faster than any army can march, and town after town opens its gates to them.`}};

if(!('legacy' in GODW))GODW.legacy=null;if(!('lastNuke' in GODW))GODW.lastNuke=null;
function L_(){if(!GODW.legacy)GODW.legacy={last:-999,had:{}};return GODW.legacy}
const legends=()=>nations.filter(n=>n.alive&&n.legend);
const taken=n=>n.cities.filter(c=>c.conq&&c.origin!=null&&c.origin!==n.id).length;
const roadsOf=n=>typeof ROAD_LINES!=='undefined'?ROAD_LINES.filter(r=>r.n===n.id||r.a===n.id).length:0;
function avgEra(){const a=nations.filter(n=>n.alive&&n.cities.length);return a.length?a.reduce((s,n)=>s+n.era,0)/a.length:0}

/* has this nation earned a legend? */
function earned(n){const L=L_(),age=year-(n.born||0),cs=n.cities.length,F=n.faith>=0?faiths[n.faith]:null,ports=n.cities.filter(c=>coastWater(c).length).length;
  const ok={};
  ok.warrior=n.era>=1&&n.era<=5&&cs>=2&&cs<=5&&(n.warsFought||0)>=3&&taken(n)>=1&&n.doc!=='peaceful'&&(n.doc==='land'||n.gov==='chiefdom'||n.gov==='monarchy'||n.gov==='junta');
  ok.merchant=n.era>=2&&ports>=2&&(n.trade||[]).length>=4&&n.doc!=='land';
  ok.eternal=n.era>=2&&cs>=8&&age>=250&&n.tiles>=180;
  ok.learning=n.era>=2&&n.era>=avgEra()+1.2&&cs>=2&&(n.wonder||0)>=1;
  ok.holy=!!F&&typeof holyCityOf==='function'&&(()=>{const hc=holyCityOf(n.faith);return hc&&hc.n===n&&hc.c===n.cities[0]&&followersOf(n.faith).length>=3})();
  ok.horde=n.era>=1&&n.era<=4&&taken(n)>=3&&cs>=4&&(n.gov==='chiefdom'||n.gov==='tribal'||n.doc==='land')&&n.cities.filter(c=>c.conq&&year-c.conq<70).length>=3;
  return Object.keys(LEG).filter(k=>ok[k]&&!legends().some(m=>m.legend===k)&&(L.had[k]||0)<2)}

function crownLegend(n,k){const L=L_(),D=LEG[k];n.legend=k;n.legY=year;n.legCap=n.cities[0].name;n.legPeak=n.cities.length;L.last=year;L.had[k]=(L.had[k]||0)+1;
  log(D.born(n,n.faith>=0?faiths[n.faith]:null),'era');milestone('legendary','A legendary nation',`${n.name} became ${D.title}.`);propsDirty=true}

function endLegend(n,why,text){const k=n.legend;if(!k)return;n.legend=null;n._legMod=null;n.legEnd=year;n.legWas=k;if(text)log(text,why==='fall'?'doom':'era');
  /* the legend lives on in story */
  if(typeof addLegend==='function'&&n.legCap&&!n.alive){const c=n.cities.find(q=>q.name===n.legCap)||n.cities[0];if(c)addLegend({name:n.legCap,x:c.x,y:c.y,kind:'fallen',lv:12,nation:n.name})}}

/* each legend has its own story, and its own end */
function legYear(n){const k=n.legend,age=year-n.legY;n.legPeak=Math.max(n.legPeak||0,n.cities.length);
  if(!n.cities.length||n.cities[0].name!==n.legCap&&k!=='horde'){/* its heart is lost */
    endLegend(n,'fall',k==='eternal'?`${n.legCap} has fallen. The Eternal Empire, which thought it would last forever, is no more.`:k==='learning'?`${n.legCap} was sacked and its great library burned. The learning of centuries went up in smoke.`:k==='holy'?`The holy city ${n.legCap} has been lost to ${n.name}.`:`${n.name} is no longer ${LEG[k].title}.`);
    if(k==='learning')for(const m of nations)if(m.alive&&m.known.includes(n.id))m.tech*=.85;return}
  n._legMod=LEG[k].mod;
  if(k==='eternal'){
    /* in old age a great empire splits east and west, and the west falls first */
    if(age>200&&n.cities.length>=8&&!n.split&&rng()<.004){const c0=n.cities[0];let far=null,fd=0;for(const c of n.cities){const d=Math.hypot(c.x-c0.x,c.y-c0.y);if(d>fd){fd=d;far=c}}
      if(far&&fd>12){const before=nations.length;try{rebel(n,far,'free',`The Eternal Empire grew too large to rule from one city. ${far.name} became the capital of an empire of its own in the far half of ${n.name}.`)}catch(e){}
        if(nations.length>before){n.split=1;const E=nations[nations.length-1];E.legend='eternal';E.legY=year;E.legCap=E.cities[0]?E.cities[0].name:far.name;E.split=1;E.heirOf=n.id}}}
    if(n.cities.length<n.legPeak*.4&&rng()<.05){endLegend(n,'fall',`${n.name} has shrunk to a shadow of the Eternal Empire. Barbarians walk its old roads.`);return}}
  if(k==='horde'){/* the horde breaks up among the khan's sons */
    if((age>60&&rng()<.025)||age>130){let parts=0;for(let q=0;q<2;q++){const before=nations.length;try{rebel(n,null,'free',`The khan of ${n.name} is dead, and his sons divided the horde between them.`)}catch(e){}if(nations.length>before)parts++}
      endLegend(n,'end',parts?null:`The horde of ${n.name} settled down; its riders became farmers.`);return}}
  if(k==='warrior'){if(n.era>=6&&rng()<.03){endLegend(n,'end',`The warrior ways of ${n.name} are gone; its sons now go to school instead of the barracks.`);return}
    if(n.pop<12&&rng()<.04){endLegend(n,'end',`${n.name} has too few citizens left to keep its army; the warrior state is no more.`);return}}
  if(k==='merchant'){if((n.trade||[]).length<2&&rng()<.03){endLegend(n,'end',`The trade of ${n.name} has dried up; other ports now rule the seas.`);return}
    /* a great land power next door comes to hate it */
    if(n.wars.size===0&&rng()<.006){const R_=nations.find(m=>m.alive&&m!==n&&(m.legend==='eternal'||m.legend==='warrior'||m.doc==='land')&&m.nb.has(n.id)&&m.pop>n.pop*.8);
      if(R_&&typeof warRoom==='function'&&warRoom()){log(`In ${R_.name} one old senator ended every speech the same way: ${n.name} must be destroyed.`,'war');startWar(R_,n,null);n.rival=R_.id}}}
  if(k==='learning'&&n.era<avgEra()+.3&&rng()<.03){endLegend(n,'end',`Other lands have caught up with ${n.name}; its scholars are no longer the wisest in the world.`);return}
  if(k==='holy'){if(n.faith<0||followersOf(n.faith).length<2&&rng()<.05){endLegend(n,'end',`Few pilgrims come to ${n.legCap} any more.`);return}
    /* pilgrims bring wealth and news */if(rng()<.3)n.tech+=TECHCOST[n.era]*.004*followersOf(n.faith).length}}

function legacyTick(){const L=L_();
  for(const n of nations){if(!n.alive){if(n.legend)endLegend(n,'fall',n.legend==='eternal'?`The Eternal Empire is no more. Its name will be remembered for a thousand years.`:null);continue}
    if(n.legend){legYear(n);continue}
    if(n.legEnd&&year-n.legEnd<150)continue;
    /* rare: at most three at once, and a long time between new ones */
    if(year-L.last<110||legends().length>=3||!n.cities.length||rng()>.02)continue;const ks=earned(n);if(ks.length)crownLegend(n,ks[(rng()*ks.length)|0])}}
{const _t=tick;tick=function(){_t.apply(this,arguments);try{legacyTick()}catch(e){console.warn('legacy',e)}}}

/* wars: count them, and the last stand of a warrior state */
{const _sw=startWar;startWar=function(a,b,kind){const was=a&&b&&a.wars.has(b.id);const r=_sw.apply(this,arguments);
  if(!was&&a&&b&&a.wars.has(b.id)){a.warsFought=(a.warsFought||0)+1;b.warsFought=(b.warsFought||0)+1;
    if(b.legend==='warrior'&&a.pop>b.pop*2.5&&rng()<.6){log(`A vast army of ${a.name} marched on ${b.name}. A few hundred of its warriors held the pass against them for three days; the tale will be told for ever.`,'war');
      a.pop*=.94;b.happy=clamp(happyOf(b)+.08,0,1);b.stab=Math.min(1,(b.stab||.6)+.1)}
    if(b.legend==='learning'&&important(b))log(`War has come to ${b.name}. Scholars across the world fear for its library.`,'war')}
  return r}}

/* the card */
{const _rn=renderNationCard;renderNationCard=function(){_rn.apply(this,arguments);const n=nations[selected];if(!n||!n.alive)return;const el=$('#nationCard');if(!el)return;const kv=el.querySelector('.kv');if(!kv||kv.querySelector('[data-leg]'))return;
  if(!n.legend&&!n.legWas)return;const v=document.createElement('div');v.dataset.leg='1';
  v.innerHTML=n.legend?`<span>Legend</span><b style="color:#d8b860">${tcapL(LEG[n.legend].title)}</b>`:`<span>Once</span><b>${tcapL(LEG[n.legWas].title)}</b>`;kv.appendChild(v)}}
const tcapL=s=>s.charAt(0).toUpperCase()+s.slice(1);

/* a monument by the capital: a gilded column for the empire, a bronze warrior, a colossus at the harbour, a library dome, a golden shrine, the horse-tail standards of the horde */
function legacyFrame(R2){for(const n of nations){if(!n.alive||!n.legend||!n.cities.length)continue;const c=n.cities[0];let x=wx(c.x)+.28,z=wz(c.y)+.18;
    if(n.legend==='merchant'){const w=coastWater(c)[0];if(w!=null){x=wx(w%W)*.6+wx(c.x)*.4;z=wz((w/W)|0)*.6+wz(c.y)*.4}}
    const ex=x-camT.x,ez=z-camT.z;if(ex*ex+ez*ez>R2*2)continue;const g=Math.max(groundY(x,z),waterY),col=LEG[n.legend].col;
    switch(n.legend){
      case 'eternal':add('gwBox',x,g,z,.07,.03,.07,0,0xd8d0c0);add('gwCyl',x,g+.03,z,.022,.24,.022,0,0xe8e2d4);add('gwBox',x,g+.27,z,.04,.012,.04,0,col);add('gwCone',x,g+.285,z,.035,.04,.02,0,col);break;
      case 'warrior':add('gwBox',x,g,z,.06,.05,.06,0,0x8a8278);add('gwCyl',x,g+.05,z,.016,.08,.016,0,col);add('colBall',x,g+.14,z,.026,.026,.026,0,col);add('gwBox',x+.03,g+.08,z,.006,.016,.04,0,col);add('gwBox',x-.025,g+.06,z,.003,.14,.003,0,0x5a4430);break;
      case 'merchant':add('gwBox',x,g,z,.07,.04,.07,0,0x9a9288);add('gwCyl',x,g+.04,z,.025,.2,.025,0,col);add('colBall',x,g+.26,z,.03,.03,.03,0,col);if(rng()<.2)emit('holy',x,g+.28,z);break;
      case 'learning':add('gwBox',x,g,z,.16,.06,.12,0,0xe8e4d8);for(let q=0;q<5;q++)add('gwCyl',x-.064+q*.032,g+.06,z+.065,.007,.05,.007,0,0xf0ece4);add('colBall',x,g+.06,z,.06,.05,.05,0,0xc8b890);break;
      case 'holy':add('gwBox',x,g,z,.08,.08,.08,0,0xf0e8d0);add('colBall',x,g+.08,z,.05,.05,.05,0,col);if(rng()<.15)emit('holy',x,g+.14,z);break;
      case 'horde':for(let q=0;q<3;q++){const a=q*2.1,px=x+Math.cos(a)*.06,pz=z+Math.sin(a)*.06;add('gwBox',px,g,pz,.004,.2,.004,0,0x5a4430);add('gwCone',px,g+.17,pz,.016,.05,.016,Math.PI,col)}break}}}
{const _bf=banditFrame;banditFrame=function(R2){_bf.apply(this,arguments);try{legacyFrame(R2)}catch(e){}}}
/* a new world starts with a clean slate: no bandits, tales or legends carried over from the last one */
{const _g=genWorld;genWorld=function(){for(const m of GODW.monsters||[])if(m.g&&typeof disposeGroup==='function')disposeGroup(m.g);
  for(const k of Object.keys(GODW))GODW[k]=Array.isArray(GODW[k])?[]:k==='quests'?{}:k==='favourY'?0:null;if(typeof GW_PICK!=='undefined')GW_PICK=null;CITYSEEN=new Map();TORPS=[];return _g.apply(this,arguments)}}
