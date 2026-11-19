"use strict";
/* Faithbound — letters.
   Three kinds of messages, all kept in one Letters panel:
   - from beyond the sea: unknown empires past the edge of the map send traders, envoys, refugees, raiders and news, and from the
     Age of Sail the island's nations send expeditions out and some of them come back;
   - between nations: rulers write to each other when they meet, ally, declare war, make peace or finish a wonder;
   - with your people: you speak commandments to the faithful, and they write to you with pleas, thanks and questions,
     some of which you can answer. */

if(!('letters' in GODW))GODW.letters=null;if(!('far' in GODW))GODW.far=null;if(!('cmds' in GODW))GODW.cmds=null;if(!('letT' in GODW))GODW.letT=null;
const LET=()=>GODW.letters||(GODW.letters=[]);
const CMDS=()=>GODW.cmds||(GODW.cmds={});
let letId=0,letFilter='all',letOpen=-1;
const LKIND={world:'Beyond the sea',nation:'Between nations',people:'Your people'};
function letter(kind,from,to,subj,body,ask,opt){const L=LET();const l={id:++letId+year*1000+((Math.random()*1000)|0),y:year,kind,from,to,subj,body,read:false};if(ask)l.ask=ask;if(opt&&opt.nid!=null)l.nid=opt.nid;if(opt&&opt.x!=null){l.x=opt.x;l.z=opt.z}
  L.unshift(l);if(L.length>140)L.length=140;letBadge();if(sheetPanel==='letters')renderSheet(true);
  if(ask||(opt&&opt.toast))toast(subj,from+(ask?' asks for your answer.':''),l.x,l.z);return l}
const lr=a=>a[(rng()*a.length)|0];
const letRuler=n=>(typeof rulerLabel==='function'&&rulerLabel(n))||('the rulers of '+n.name);
const letWatched=n=>n&&(important(n)||n.id===selected);

/* ---------- lands beyond the sea ---------- */
/* names for the far lands: a capitalised start and one or two endings, so they read as places (Velmark, Qasharia, Torvik) */
const FAR_START=['Qa','Vel','Ost','Lin','Ther','Kad','Mor','Zan','Ul','Bel','Tor','Sel','Ash','Yen','Har','Isk','Dor','Ama'];
const FAR_END=['sar','mark','sha','ion','esh','avia','dar','ric','ara','vik','une','kar','tai','enza','ost','abad','heim','oria'];
const FAR_KIND=[['Empire','Emperor','Empress'],['Kingdom','King','Queen'],['Republic','First Consul','First Consul'],['Sultanate','Sultan','Sultana'],['Jade Throne','Son of Heaven','Daughter of Heaven'],['Free Cities','Doge','Dogaressa'],['Khaganate','Khagan','Khatun']];
const FAR_GOODS=['silk and pepper','ivory and gold dust','glass and fine paper','horses and amber','tea and porcelain','dyes and cotton','spices and incense','clocks and lenses'];
function farLands(){if(GODW.far)return GODW.far;const L=[];const used=new Set();
  for(let i=0;i<4;i++){let nm;do{nm=lr(FAR_START)+lr(FAR_END)}while(used.has(nm));used.add(nm);const k=lr(FAR_KIND),f=rng()<.4;
    L.push({name:nm,kind:k[0],title:f?k[2]:k[1],ruler:lr(['Aurel','Tamsin','Kiro','Ishra','Bertil','Navid','Sela','Oren','Yuna','Matthias','Zaid','Ilse','Rhun','Teodor'])+(rng()<.4?' the '+lr(['Great','Wise','Young','Bold','Pious','Old']):''),
      goods:lr(FAR_GOODS),mood:rng()<.7?'friendly':'proud',known:false,fallen:false})}
  return GODW.far=L}
const farFull=f=>`the ${f.kind} of ${f.name}`;
function coastNations(minEra){return nations.filter(n=>n.alive&&n.era>=minEra&&n.cities.some(c=>coastWater(c).length))}
function portOf(n){for(const c of n.cities){const w=coastWater(c);if(w.length){const j=w[(w.length/2)|0];return {c,x:wx(j%W),z:wz((j/W)|0)}}}return null}
/* a ship from or to the horizon: it sails in a straight line between the edge of the open sea and a nation's port */
const FARSHIPS=[];
function farShip(n,dir,kind,onArrive){const p=portOf(n);if(!p||typeof makeShip!=='function')return false;const era=Math.max(2,Math.min(6,n.era));
  const ex=p.x/(W/2),ez=p.z/(H/2),far=Math.abs(ex)>Math.abs(ez)?[Math.sign(p.x||1)*(W/2+8),p.z]:[p.x,Math.sign(p.z||1)*(H/2+8)];
  let g;try{g=makeShip(era,kind==='raid'?'pirate':'trade',kind==='raid'?'#2a2a2a':kind==='out'?n.color:'#8a6a3a',kind==='out'&&typeof ensureFlag==='function'?ensureFlag(n):undefined)}catch(e){return false}
  if(!g)return false;const a=dir==='in'?far:[p.x,p.z],b=dir==='in'?[p.x,p.z]:far;g.position.set(a[0],waterY,a[1]);g.rotation.y=Math.atan2(-(b[1]-a[1]),b[0]-a[0]);scene.add(g);
  FARSHIPS.push({g,a,b,t:0,len:Math.hypot(b[0]-a[0],b[1]-a[1]),onArrive,dir});return true}
(function farLoop(last){requestAnimationFrame(t=>{const dt=Math.min(.1,(t-(last||t))/1000);
  if(playing&&speedIdx>0)for(let i=FARSHIPS.length-1;i>=0;i--){const s=FARSHIPS[i];s.t+=dt*1.2*Math.min(3,speedIdx)/Math.max(1,s.len);const k=Math.min(1,s.t);
    const x=s.a[0]+(s.b[0]-s.a[0])*k,z=s.a[1]+(s.b[1]-s.a[1])*k;s.g.position.set(x,(typeof seaY==='function'?seaY(x,z):waterY),z);
    if(k>=1){if(s.onArrive)try{s.onArrive()}catch(e){console.warn(e)}if(s.back){disposeGroup(s.g);FARSHIPS.splice(i,1)}else{s.back=true;s.t=0;[s.a,s.b]=[s.b,s.a];s.onArrive=null;s.g.rotation.y+=Math.PI;s.hold=0}}}
  farLoop(t)})})();

function farEvent(){const te=typeof topEra==='function'?topEra():0;if(te<2)return;const L=farLands().filter(f=>!f.fallen);if(!L.length)return;const f=lr(L);
  const coast=coastNations(2);if(!coast.length)return;const n=lr(coast.filter(letWatched).length&&rng()<.7?coast.filter(letWatched):coast);const p=portOf(n);if(!p)return;
  const r=rng(),first=!f.known;f.known=true;const at={x:p.x,z:p.z,nid:n.id};
  if(first||r<.32){/* traders */farShip(n,'in','trade',()=>{n.tech=(n.tech||0)+TECHCOST[Math.min(n.era,TECHCOST.length-1)]*.06;n.gold=(n.gold||0)+20});
    letter('world',`Merchants of ${f.name}`,n.name,first?`Ships from an unknown land reach ${p.c.name}`:`Traders from ${f.name} in ${p.c.name}`,
      first?`Sails appeared on the horizon and a strange ship anchored off ${p.c.name}. Its crew speak of ${farFull(f)} far beyond the sea, ruled by ${f.title} ${f.ruler}. They came to trade ${f.goods}, and they brought new ideas with them.`
        :`A ship of ${farFull(f)} anchored at ${p.c.name} with ${f.goods}. The people of ${n.name} traded eagerly, and its scholars learned from the sailors.`,null,Object.assign({toast:first},at));return}
  if(r<.5){/* an envoy */const friendly=f.mood==='friendly';
    letter('world',`${f.title} ${f.ruler} of ${f.name}`,letRuler(n),friendly?`Greetings from ${f.name}`:`A demand from ${f.name}`,
      friendly?`To ${letRuler(n)} of ${n.name}, greetings across the sea. Our ships have seen your shores and your harbours. Let there be friendship and trade between ${farFull(f)} and your people, and may the winds be kind to both.`
        :`To ${letRuler(n)} of ${n.name}. Your island lies in waters that ${farFull(f)} has sailed for generations. Send us tribute each year, and our fleets will pass you by.`,null,at);
    if(!friendly&&rng()<.5)GODW.letT=Object.assign(GODW.letT||{},{raid:{nid:n.id,f:f.name,y:year+8+((rng()*12)|0)}});return}
  if(r<.64){/* refugees */const c=p.c,k=Math.round(n.pop*.04+40);n.pop+=k;
    letter('world',`The harbour master of ${c.name}`,letRuler(n),`Refugees from beyond the sea`,`Three overloaded ships reached ${c.name}, carrying some ${k*10} people who fled ${lr(['a war','a famine','a great flood','a cruel ruler','a burning city'])} in ${farFull(f)}. They ask for land and a roof. They have been taken in.`,null,at);return}
  if(r<.74){/* news */const what=lr([`${farFull(f)} has crowned a new ${f.title.toLowerCase()}`,`a great plague is raging in ${farFull(f)}`,`${farFull(f)} is at war with its neighbours`,`the scholars of ${f.name} claim the world is round and far larger than anyone thought`,`a new faith is spreading through ${farFull(f)}`]);
    if(/war/.test(what)&&rng()<.3){f.fallen=true}
    letter('world',`Sailors' tales in ${p.c.name}`,n.name,`News from beyond the sea`,`Sailors in the taverns of ${p.c.name} say that ${what}.${f.fallen?` Some say ${f.name} will not survive it.`:''}`,null,at);return}
  if(r<.8&&!n.sick&&!n.immune&&typeof startEpidemic==='function'&&rng()<.4){startEpidemic(n,false);letter('world',`The physicians of ${p.c.name}`,letRuler(n),`A sickness came off a foreign ship`,`Sailors from ${f.name} brought a fever to ${p.c.name}. It is spreading through the town.`,null,at);return}
  /* an expedition from the island */
  const ex=coastNations(4);if(!ex.length)return;const e=lr(ex.filter(letWatched).length?ex.filter(letWatched):ex);const ep=portOf(e);if(!ep)return;
  farShip(e,'out','out',null);letter('world',`The admiralty of ${e.name}`,letRuler(e),`An expedition sets sail`,`A ship of ${e.name} left ${ep.c.name} to find what lies beyond the sea. No one knows when, or whether, it will come back.`,null,{x:ep.x,z:ep.z,nid:e.id});
  GODW.letT=Object.assign(GODW.letT||{},{exp:{nid:e.id,f:f.name,y:year+10+((rng()*25)|0),lost:rng()<.3}})}
function farTick(){const T=GODW.letT||{};
  if(T.exp&&year>=T.exp.y){const n=nations[T.exp.nid],f=farLands().find(q=>q.name===T.exp.f);delete T.exp;if(n&&n.alive){
      const lost=rng()<.3;if(lost)letter('world',`The admiralty of ${n.name}`,letRuler(n),`The expedition is lost`,`Years have passed and the expedition has not returned. The widows of ${n.name} wait at the harbour.`,null,{nid:n.id});
      else{farShip(n,'in','trade',()=>{n.tech=(n.tech||0)+TECHCOST[Math.min(n.era,TECHCOST.length-1)]*.12;n.gold=(n.gold||0)+60});
        letter('world',`The expedition of ${n.name}`,letRuler(n),`The expedition returns`,`After years at sea the expedition came home. It reached ${f?farFull(f):'unknown shores'}${f?`, where ${f.title} ${f.ruler} received the sailors`:''}. They bring maps, ${f?f.goods:'strange goods'} and knowledge that will change ${n.name}.`,null,{nid:n.id,toast:true})}}}
  if(T.raid&&year>=T.raid.y){const n=nations[T.raid.nid],rf=T.raid.f;delete T.raid;if(n&&n.alive){const p=portOf(n);if(p){farShip(n,'in','raid',()=>{n.pop=Math.max(10,Math.round(n.pop*.95))});
      letter('world',`The watch of ${p.c.name}`,letRuler(n),`Raiders from ${rf}`,`Black-sailed ships came out of the sea mist and fell on ${p.c.name}. The raiders burned the warehouses and took what they could carry.`,null,{x:p.x,z:p.z,nid:n.id,toast:true})}}}
  GODW.letT=T;
  if(rng()<.025)farEvent()}

/* ---------- nations writing to each other ---------- */
const NAT_T={meet:(a,b)=>[`Greetings from ${a.name}`,`To ${letRuler(b)} of ${b.name}. Our scouts have found your people. We send gifts and greetings, and we hope our peoples will live as good neighbours.`],
  ally:(a,b)=>[`A pact of friendship`,`To ${letRuler(b)}. From this day ${a.name} and ${b.name} stand together. An enemy of one is an enemy of both. Sealed before the gods.`],
  war:(a,b)=>[`A declaration of war`,lr([`To ${letRuler(b)}. You have wronged ${a.name} once too often. Our armies are marching. Let the gods judge between us.`,`To ${letRuler(b)}. The land you hold was ours before it was yours. We come to take it back.`,`To ${letRuler(b)}. There will be no more talk. ${a.name} declares war on ${b.name}.`])],
  peace:(a,b)=>[`A treaty of peace`,`To ${letRuler(b)}. Enough blood has been spilled. ${a.name} offers peace, and the borders stand where they stand. Let the dead rest.`],
  wonder:(a,b,w)=>[`The ${w} is finished`,`To ${letRuler(b)}. Come and see the ${w}, raised by the hands of ${a.name}. There is nothing like it in all the world, and there never will be.`]};
function natLetter(kind,a,b,extra){if(!a||!b||!a.alive||!b.alive)return;if(!(letWatched(a)||letWatched(b)))return;const T=GODW.letT||(GODW.letT={});const k='n'+kind;if(kind!=='war'&&T[k]&&year-T[k]<3)return;T[k]=year;
  const [s,bd]=NAT_T[kind](a,b,extra);const c=a.cities[0];letter('nation',`${letRuler(a)} of ${a.name}`,`${letRuler(b)} of ${b.name}`,s,bd,null,{nid:a.id,x:c?wx(c.x):undefined,z:c?wz(c.y):undefined})}
{const _m=meet;meet=function(a,b){const knew=a&&b&&a.known&&a.known.includes(b.id);const r=_m.apply(this,arguments);if(!knew&&year>5)natLetter('meet',a,b);return r}}
{const _a=ally;ally=function(a,b){const was=typeof allied==='function'&&allied(a,b);const r=_a.apply(this,arguments);if(!was&&typeof allied==='function'&&allied(a,b))natLetter('ally',a,b);return r}}
{const _w=startWar;startWar=function(a,b){const was=a&&b&&a.wars.has(b.id);const r=_w.apply(this,arguments);if(!was&&a&&b&&a.wars.has(b.id))natLetter('war',a,b);return r}}
{const _p=makePeace;makePeace=function(a,b){const was=a&&b&&a.wars.has(b.id);const r=_p.apply(this,arguments);if(was)natLetter('peace',a,b);return r}}
if(typeof wonderClaim==='function'){const _c=wonderClaim;wonderClaim=function(n,name){_c.apply(this,arguments);const nb=nations.filter(o=>o.alive&&o!==n&&n.known&&n.known.includes(o.id));if(nb.length)natLetter('wonder',n,lr(nb),name)}}

/* ---------- speaking to your people ---------- */
const COMMANDS={
  fruitful:{label:'Be fruitful',say:'Be fruitful and multiply, and fill the land.',fx:'More children are born',cost:25},
  peace:{label:'Lay down your swords',say:'Lay down your swords. Make peace with your neighbours.',fx:'Less eager for war; wars may end',cost:30},
  learn:{label:'Seek knowledge',say:'Open your eyes. Study the stars and the earth, and learn.',fx:'Faster progress',cost:30},
  honour:{label:'Build in my honour',say:'Raise temples in my name, and keep my feasts.',fx:'Devotion grows quickly',cost:20},
  feed:{label:'Feed the hungry',say:'Share your bread. Let no one in your land go hungry.',fx:'Famine ends sooner; people are happier',cost:20},
  sail:{label:'Sail beyond the sea',say:'Build ships and sail beyond the horizon. Others wait there.',fx:'More voyages and news from beyond the sea',cost:25},
  defend:{label:'Guard your land',say:'Guard your homes and your borders. Let no one take what is yours.',fx:'More warlike; harder to conquer',cost:25}};
const CMD_YEARS=30;
const myPeople=()=>nations.filter(n=>n.alive&&n.faith>=0);
function obeys(n){const d=n.devotion??.3;return d<.2?0:d<.45?.5:1}
function command(id){const c=COMMANDS[id];if(!c)return;if(belief<c.cost){toast('Not enough belief',`${c.label} costs ${c.cost} belief.`);return}
  const sel=selected>=0&&nations[selected]&&nations[selected].alive&&nations[selected].faith>=0?[nations[selected]]:myPeople();if(!sel.length){toast('No one to hear you','Found a faith first: only the faithful hear their god.');return}
  belief-=c.cost;const C=CMDS();for(const n of sel)C[n.id]={id,until:year+CMD_YEARS,from:year};
  const n=sel[0],ob=obeys(n),who=sel.length>1?'the faithful':n.name,priest=`The high priest${sel.length>1?'s':''} of ${who}`;
  log(`You spoke to ${who}: "${c.say}"`,'faith');
  letter('people',priest,'You',ob===1?`"${c.label}": we hear and obey`:ob>0?`"${c.label}": your words are debated`:`"${c.label}": the people doubt`,
    ob===1?`Lord, your words were read aloud in every temple${sel.length>1?' of every land that follows you':' of '+n.name}. "${c.say}" The people bow their heads. It will be done.`
      :ob>0?`Lord, we read your words in the temples: "${c.say}" Some hear them gladly, others ask why the gods are so often silent. Half will obey.`
      :`Lord, we read your words aloud: "${c.say}" But few came to listen. The faith is weak here; show them a sign, and they may yet obey.`,null,{nid:n.id})}
function commandTick(){const C=CMDS();for(const k in C){const q=C[k],n=nations[k];if(!n||!n.alive||year>=q.until){delete C[k];continue}const ob=obeys(n);if(!ob)continue;
  switch(q.id){case'fruitful':n.pop+=n.pop*.004*ob;break;case'peace':n.aggr=Math.max(.05,(n.aggr||.5)-.015*ob);if(n.wars.size&&rng()<.04*ob){const b=nations[[...n.wars][0]];if(b)makePeace(n,b,false)}break;
    case'learn':n.tech=(n.tech||0)+TECHCOST[Math.min(n.era,TECHCOST.length-1)]*.004*ob;break;case'honour':n.devotion=Math.min(1,(n.devotion??.3)+.012*ob);break;
    case'feed':if(n.famine>0&&rng()<.3*ob)n.famine=Math.max(0,n.famine-1);n.bless=Math.max(n.bless||0,.2*ob);break;case'sail':if(rng()<.02*ob)farEvent();break;
    case'defend':n.aggr=Math.min(.95,(n.aggr||.5)+.006*ob);break}}}
/* the faithful write to you */
const PEOPLE_ASK={
  beyond:n=>({subj:'Is there anything beyond the sea?',body:`Lord, the fishermen of ${n.name} see birds flying in from the open sea, and driftwood that grew on no tree of ours. Is there land out there? Should we build ships and go?`,
    opts:[['Sail and see',()=>{CMDS()[n.id]={id:'sail',until:year+20,from:year};n.devotion=Math.min(1,(n.devotion??.3)+.03)}],['Stay where you are',()=>{n.devotion=Math.min(1,(n.devotion??.3)+.02)}]]}),
  prophet:n=>({subj:'A prophet speaks in your name',body:`Lord, a ${lr(['shepherd','fisherman','widow','blind man','young woman'])} in ${n.cities[0]?n.cities[0].name:n.name} says you appear in dreams and speak through them. Crowds follow. Is it you who speaks?`,
    opts:[['It is me',()=>{n.devotion=Math.min(1,(n.devotion??.3)+.1)}],['A false prophet',()=>{n.devotion=Math.max(0,(n.devotion??.3)-.03);n.aggr=Math.max(.05,(n.aggr||.5)-.02)}]]}),
  temple:n=>({subj:'Shall we build you a great temple?',body:`Lord, the people of ${n.name} wish to raise a temple greater than any before, and give a tenth of their harvest for it. Do you wish it?`,
    opts:[['Build it (15 belief)',()=>{if(belief>=15){belief-=15;n.devotion=Math.min(1,(n.devotion??.3)+.15);propsDirty=true}}],['Feed the poor instead',()=>{n.bless=Math.max(n.bless||0,.3)}]]}),
  war:n=>{const b=nations[[...n.nb||[]].find(j=>nations[j]&&nations[j].alive&&nations[j].faith!==n.faith)];if(!b)return null;return {subj:`Shall we march on ${b.name}?`,body:`Lord, ${b.name} mocks your name and worships other gods. Our young men are ready. Give us a sign, and we will march.`,
    opts:[['March',()=>{startWar(n,b)}],['Keep the peace',()=>{n.aggr=Math.max(.05,(n.aggr||.5)-.04);n.devotion=Math.min(1,(n.devotion??.3)+.02)}]]}}};
function letPeopleTick(){if(rng()>.02)return;const P=myPeople().filter(n=>n.cities.length);if(!P.length)return;const n=lr(P.filter(letWatched).length?P.filter(letWatched):P);const c=n.cities[0];const at={nid:n.id,x:c?wx(c.x):undefined,z:c?wz(c.y):undefined};
  const happy=typeof happyOf==='function'?happyOf(n):.5;
  if(n.famine>0||n.sick){letter('people',`The faithful of ${n.name}`,'You',n.famine>0?'We are starving':'A sickness is killing us',`Lord, ${n.famine>0?'the fields are bare and the granaries empty':'the '+(n.sick&&n.sick.name||'fever')+' goes from house to house'}. We pray to you every day. Do not turn your face from ${n.name}.`,
      {opts:[['Help them (20 belief)',()=>{if(belief>=20){belief-=20;if(n.famine>0)n.famine=Math.max(0,n.famine-4);if(n.sick)n.sick.t=Math.min(n.sick.t,2);n.devotion=Math.min(1,(n.devotion??.3)+.08)}}],['Stay silent',()=>{n.devotion=Math.max(0,(n.devotion??.3)-.05)}]]},at);return}
  if(happy>.75&&rng()<.4){letter('people',`The faithful of ${n.name}`,'You','Thanks be to you',`Lord, the harvest was good, our children are healthy and our towns are at peace. Tonight every hearth in ${n.name} burns in your honour.`,null,at);return}
  const keys=Object.keys(PEOPLE_ASK).filter(k=>k!=='beyond'||(n.cities.some(c=>coastWater(c).length)&&n.era>=2));const q=PEOPLE_ASK[lr(keys)](n);if(!q)return;
  letter('people',`The faithful of ${n.name}`,'You',q.subj,q.body,{opts:q.opts},at)}
/* answers are kept as functions for this session; a letter loaded from a save can still be read but its question has lapsed */
const LETFN={};
function letAnswer(id,i){const l=LET().find(q=>q.id===id);if(!l||!l.ask||l.ask.done!=null)return;const f=LETFN[id];if(!f){l.ask.done=-1;renderSheet(true);return}
  try{f[i]()}catch(e){console.warn(e)}l.ask.done=i;l.read=true;log(`You answered ${l.from}: "${l.ask.opts[i]}".`,'faith');letBadge();renderSheet(true)}
/* pleas use the same mechanism: their functions are stored when written */
{const _l=letter;letter=function(kind,from,to,subj,body,ask,opt){if(ask&&ask.opts&&typeof ask.opts[0]!=='string'){const fns=ask.opts.map(o=>o[1]);ask={opts:ask.opts.map(o=>o[0])};const l=_l(kind,from,to,subj,body,ask,opt);LETFN[l.id]=fns;return l}return _l.apply(this,arguments)}}

{const _t=tick;tick=function(){const r=_t.apply(this,arguments);try{farTick();commandTick();letPeopleTick()}catch(e){console.warn('letters',e)}return r}}

/* ---------- the Letters panel ---------- */
SHEETS.letters='Letters';
function letBadge(){const b=document.querySelector('[data-panel="letters"]');if(!b)return;const u=LET().filter(l=>!l.read).length;b.classList.toggle('ask',u>0);const c=b.querySelector('.cnt');if(c)c.textContent=u?String(Math.min(u,99)):''}
function lettersHTML(){const L=LET().filter(l=>letFilter==='all'||l.kind===letFilter);const sel=selected>=0&&nations[selected]&&nations[selected].alive?nations[selected]:null;
  const C=CMDS(),act=sel?C[sel.id]:null;
  let h=`<div class="sec"><h4>Speak to your people</h4><p class="note">${sel&&sel.faith>=0?`Your words go to ${esc(sel.name)}.`:'Your words go to every land that follows you. Select a nation first to speak to it alone.'} A commandment lasts ${CMD_YEARS} years; the less devout a people is, the less it obeys.${act?`<br><b>Now:</b> ${esc(COMMANDS[act.id].label)}, ${act.until-year} years left.`:''}</p>
    <div class="row" style="flex-wrap:wrap;gap:6px">${Object.entries(COMMANDS).map(([k,c])=>`<button class="btn" data-cmd="${k}" title="${esc(c.fx)}" ${belief>=c.cost?'':'disabled style="opacity:.55"'}>${esc(c.label)} · ${c.cost}</button>`).join('')}</div></div>`;
  h+=`<div class="seg" id="letSeg">${[['all','All'],['world','Beyond the sea'],['nation','Nations'],['people','Your people']].map(([k,l])=>`<button data-lf="${k}" aria-pressed="${letFilter===k}">${l}</button>`).join('')}</div>`;
  if(!L.length)h+=`<p class="note">No letters yet. ${letFilter==='world'?'Ships from beyond the sea come once a people reaches the Bronze Age and lives by the coast.':letFilter==='nation'?'Rulers write when they meet, ally, go to war or make peace.':'Your people write to you once they follow a faith.'}</p>`;
  h+=`<ul class="list letters">${L.slice(0,60).map(l=>{const open=l.id===letOpen;return `<li><button data-let="${l.id}" class="${l.read?'':'sel'}"><span class="nm">${l.read?'':'● '}${esc(l.subj)}<small>${esc(l.from)} · year ${l.y} · ${LKIND[l.kind]}</small></span></button>
    ${open?`<div class="letbody"><p class="note" style="margin:6px 4px">${esc(l.body)}</p>${l.ask?(l.ask.done!=null?`<p class="note" style="margin:4px"><b>${l.ask.done>=0?'You answered: '+esc(l.ask.opts[l.ask.done]):'This question has lapsed.'}</b></p>`:`<div class="row" style="gap:6px;margin:4px">${l.ask.opts.map((o,i)=>`<button class="btn" data-ans="${l.id}:${i}">${esc(o)}</button>`).join('')}</div>`):''}${l.x!=null?`<button class="btn" data-letgo="${l.id}" style="margin:4px">Show me</button>`:''}</div>`:''}</li>`}).join('')}</ul>`;
  return h}
{const _rs=renderSheet;renderSheet=function(full){if(sheetPanel!=='letters')return _rs.apply(this,arguments);const B=$('#sheetBody');if(!B)return;const sig=LET().length+'|'+letFilter+'|'+letOpen+'|'+(LET()[0]&&LET()[0].id)+'|'+selected+'|'+Math.floor(belief/5);
  if(!full&&B.dataset.sig===sig)return;B.dataset.sig=sig;B.innerHTML=lettersHTML()}}
$('#sheetBody').addEventListener('click',e=>{if(sheetPanel!=='letters')return;
  const f=e.target.closest('[data-lf]');if(f){letFilter=f.dataset.lf;renderSheet(true);return}
  const c=e.target.closest('[data-cmd]');if(c&&!c.disabled){command(c.dataset.cmd);renderSheet(true);return}
  const a=e.target.closest('[data-ans]');if(a){const [id,i]=a.dataset.ans.split(':').map(Number);letAnswer(id,i);return}
  const g=e.target.closest('[data-letgo]');if(g){const l=LET().find(q=>q.id===+g.dataset.letgo);if(l&&l.x!=null)focusOn(l.x,l.z,Math.min(camDistT,4));return}
  const o=e.target.closest('[data-let]');if(o){const id=+o.dataset.let;letOpen=letOpen===id?-1:id;const l=LET().find(q=>q.id===id);if(l){l.read=true;letBadge()}renderSheet(true)}});
/* the nav button, after Chronicle */
{const ch=document.querySelector('[data-panel="chronicle"]');if(ch&&!document.querySelector('[data-panel="letters"]')){const b=document.createElement('button');b.className='ib';b.dataset.panel='letters';
  b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg><span>Letters</span><i class="cnt"></i>';
  ch.after(b);b.onclick=()=>{if(typeof spaceView!=='undefined'&&spaceView)closeSpace();openSheet('letters')}}}
{const st=document.createElement('style');st.textContent='[data-panel="letters"]{position:relative}[data-panel="letters"] .cnt{position:absolute;top:2px;right:4px;font:700 10px/1 sans-serif;font-style:normal;color:#1a1408;background:var(--gold,#d8b04a);border-radius:8px;padding:1px 4px;min-width:8px}[data-panel="letters"] .cnt:empty{display:none}.letters .letbody{padding:2px 6px 8px}.letters li>button{grid-template-columns:minmax(0,1fr)}.letters .nm{white-space:normal;overflow:visible}.letters .nm small{display:block;white-space:normal}';document.head.appendChild(st)}
/* a new world starts with no letters */
{const _g=genWorld;genWorld=function(){const r=_g.apply(this,arguments);for(const s of FARSHIPS)disposeGroup(s.g);FARSHIPS.length=0;letOpen=-1;letBadge();return r}}
{const _a=applySave;applySave=function(){const r=_a.apply(this,arguments);for(const s of FARSHIPS)disposeGroup(s.g);FARSHIPS.length=0;letBadge();return r}}
