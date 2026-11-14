"use strict";
/* Faithbound — govern one town.
   Pick any town in the world and lead its council. The town has its own people, food, timber and treasury; you set the taxes,
   decide what to do with the harvest and how many men stand guard, and you choose what to build: new streets, a granary, a market,
   walls, a harbour, a school, later a railway station or a factory. What you build stands in the town.
   The world goes on around you: the crown asks for taxes and soldiers, wars come to the gates, pirates and outlaws raid, harvests fail,
   refugees knock. Every few years the council has to decide something. Keep the people fed, happy and loyal, or lead them to freedom.
   You stay the god as well: every power still works. */

const MB={
  houses:{name:'New street',max:6,era:0,gold:[30,45,65,90,120,160],wood:[15,20,25,30,40,50],yrs:3,fx:'More room for people to live'},
  granary:{name:'Granary',max:2,era:0,gold:[40,90],wood:[20,30],yrs:4,fx:'Stores food for lean years'},
  temple:{name:'Temple',max:1,era:0,gold:[60],wood:[20],yrs:8,fx:'Happier, more devout people'},
  market:{name:'Market hall',max:2,era:1,gold:[50,120],wood:[15,25],yrs:4,fx:'More taxes and trade, a livelier town'},
  mill:{name:'Mill',max:1,era:1,gold:[45],wood:[25],yrs:3,fx:'A fifth more food from the fields'},
  harbour:{name:'Harbour',max:2,era:1,coast:1,gold:[60,140],wood:[40,50],yrs:6,fx:'More fishing boats and sea trade'},
  walls:{name:'Walls',max:3,era:1,gold:[80,180,320],wood:[30,20,10],yrs:[8,12,15],fx:'Holds out against sieges, pirates and outlaws'},
  barracks:{name:'Barracks',max:1,era:1,gold:[70],wood:[20],yrs:5,fx:'A stronger guard; soldiers for the realm'},
  workshop:{name:'Guild hall',max:2,era:2,gold:[90,180],wood:[20,20],yrs:6,fx:'Craftsmen: more income and new ideas'},
  school:{name:'School',max:2,era:2,gold:[100,220],wood:[15,15],yrs:8,fx:'Learning for the whole realm'},
  shipyard:{name:'Shipyard',max:1,era:3,coast:1,gold:[150],wood:[60],yrs:10,fx:'Warships and merchantmen for the realm'},
  hospital:{name:'Hospital',max:1,era:5,gold:[200],wood:[10],yrs:8,fx:'Fewer deaths from plague; faster growth'},
  station:{name:'Railway station',max:1,era:5,gold:[180],wood:[20],yrs:6,fx:'Joins the railways: trade and growth'},
  factory:{name:'Factory',max:2,era:5,gold:[220,320],wood:[30,30],yrs:6,fx:'Much more income, but smoke and grumbling'},
  park:{name:'Park',max:1,era:5,gold:[80],wood:[0],yrs:3,fx:'A green place to breathe'}};
const MB_LEVEL={walls:['Palisade','Stone walls','Bastions'],houses:null,granary:['Granary','Great granary'],market:['Market','Market hall'],harbour:['Quay','Harbour'],workshop:['Guild hall','Guild quarter'],school:['School','Academy'],factory:['Factory','Mills and factories']};
const TAX={low:{label:'Low',inc:6,hap:.1},fair:{label:'Fair',inc:10,hap:0},high:{label:'High',inc:15,hap:-.12}};
const GUARD={none:{label:'None',cost:0,def:0},watch:{label:'Night watch',cost:2,def:1},garrison:{label:'Garrison',cost:5,def:2},army:{label:'Town army',cost:10,def:3}};
let MAYOR_TL=0;

/* ---------- where is my town ---------- */
function myTown(){for(const n of nations){if(!n.alive)continue;for(let k=0;k<n.cities.length;k++){const c=n.cities[k];if(c.mayor)return {n,c,cap:k===0}}}return null}
const unitOf=(n,cap)=>Math.max(4,n.pop/Math.max(1,n.cities.length))*(cap?1.5:1);
function rankOf(T){const r=T.c.mayor.P/unitOf(T.n,false),e=T.n.era;return r<.5?(e>=5?'Small town':'Hamlet'):r<1?(e>=5?'Town':'Village'):r<1.6?'Town':r<2.4?'City':r<3.6?'Great city':'Metropolis'}
const mbLabel=(id,l)=>MB_LEVEL[id]&&MB_LEVEL[id][l-1]||MB[id].name;
const mbYrs=(id,l)=>Array.isArray(MB[id].yrs)?MB[id].yrs[l]:MB[id].yrs;
const mbCost=(id,l,e)=>({gold:Math.round(MB[id].gold[l]*(1+Math.max(0,e-MB[id].era)*.12)),wood:MB[id].wood[l]||0});
function forestNear(c){let k=0;for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const X=c.x+dx,Y=c.y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const b=biome[Y*W+X];if(b===5||b===6)k++}return k}
function fieldsNear(n,c){let s=0,k=0;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const X=c.x+dx,Y=c.y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const j=Y*W+X;if(isWater(j))continue;k++;if(owner[j]===n.id)s+=hab[j]}return k?s/k:0}
function mlog(m,t,kind){m.log.unshift({y:year,t});if(m.log.length>40)m.log.length=40;if(kind)log(t,kind)}

function govern(n,c){const T=myTown();if(T&&T.c!==c){delete T.c.mayor;propsDirty=true}
  const U=unitOf(n,n.cities[0]===c);
  c.mayor={since:year,P:U,food:U*.4,wood:30,gold:60,happy:.6,loyal:.65,tax:'fair',share:'keep',guard:'watch',b:{},q:[],log:[],ask:null,next:year+4+((rng()*4)|0),best:U,fest:0,mood:0,hist:[]};
  GODW.mayorLost=null;mlog(c.mayor,`You took your seat at the head of the council of ${c.name}, in ${n.name}.`);propsDirty=true;
  log(`The council of ${c.name} has a new head: you.`,'life');milestone('mayor','First among citizens','You took charge of a town.');
  if(typeof toast==='function')toast(`You govern ${c.name}`,'Open Town to set taxes, build and decide.',wx(c.x),wz(c.y));
  if(typeof openSheet==='function'&&sheetPanel!=='town')openSheet('town');focusOn(wx(c.x),wz(c.y),Math.min(camDistT,7))}
function stepDown(){const T=myTown();if(!T)return;mlog(T.c.mayor,'You stepped down.');log(`You stepped down as head of the council of ${T.c.name}.`,'life');delete T.c.mayor;propsDirty=true;renderSheet(true)}

/* ---------- the year ---------- */
function mayorYear(){const T=myTown();
  if(!T){for(const o of nations)if(o._mayMod)o._mayMod=null;if(GODW.mayorAt&&!GODW.mayorLost){GODW.mayorLost={name:GODW.mayorAt.name,year};log(`${GODW.mayorAt.name} is gone, and with it your seat on its council. Choose another town to govern.`,'doom');if(typeof toast==='function')toast('Your town is lost','Open Town to choose another.')}GODW.mayorAt=null;return}
  const {n,c,cap}=T,m=c.mayor,e=n.era,U=unitOf(n,cap),b=m.b;if(!isFinite(m.mood))m.mood=0;for(const o of nations)if(o!==n&&o._mayMod)o._mayMod=null;GODW.mayorAt={name:c.name,nid:n.id};
  if(m.nid!=null&&m.nid!==n.id){const was=nations[m.nid];mlog(m,`${c.name} now answers to ${n.name}${was?', no longer to '+was.name:''}.`,'war');m.loyal=Math.min(m.loyal,.35)}m.nid=n.id;
  /* building */
  if(m.q.length){const p=m.q[0];p.left--;if(p.left<=0){m.q.shift();b[p.id]=(b[p.id]||0)+1;mlog(m,`The ${mbLabel(p.id,b[p.id]).toLowerCase()} of ${c.name} is finished.`);propsDirty=true;
      if(p.id==='station')c.rail=c.rail||year;if(p.id==='walls')m.wallY=year;if(important(n))log(`${c.name} finished its ${mbLabel(p.id,b[p.id]).toLowerCase()}.`,'life')}}
  /* food: the fields round the town, the mill, the fishing fleet and the orchards */
  const fert=clamp(.5+fieldsNear(n,c)*.9,.55,1.5),harv=n.harvest!=null?clamp(n.harvest,.4,1.4):1,fam=n.famine>0?.55:1;
  const fish=coastWater(c).length?(c.boats||0)*.08*U*(1+.3*(b.harbour||0)):0,orch=typeof grovesOf==='function'?grovesOf(c).filter(g=>g.kind==='fruit').length*.08*U:0;
  const grown=U*.95*fert*harv*fam*(1+.2*(b.mill||0))*(1+.04*e)+fish+orch,need=m.P;let bal=grown-need;
  if(m.share==='share'&&bal>0){const gift=bal*.6;bal-=gift;n.pop+=gift*.05;m.loyal=Math.min(1,m.loyal+.02);if(n.famine>0)n.famine=Math.max(0,n.famine-.15)}
  const store=U*(.5+.9*(b.granary||0)),price=(18+e*2)/U;let f=m.food+bal;m.bought=0;
  if(f<0&&m.gold>0){/* buy grain at the market while the treasury lasts */const buy=Math.min(-f,m.gold/price);f+=buy;m.gold-=buy*price;m.bought=buy*price}
  const fed=f<0?clamp(1+f/need,0,1):1;m.food=clamp(f,0,store);
  m.fedR=grown/need;m.fed=fed;
  /* timber */
  const wg=typeof grovesOf==='function'?grovesOf(c).filter(g=>g.kind==='wood').length:0;if(m.forest==null||year%10===0)m.forest=forestNear(c);
  m.woodIn=Math.round((m.forest*.3+wg*2.5+1)*10)/10;m.wood=Math.min(400,m.wood+m.woodIn);
  /* the treasury */
  const r=m.P/U*(cap?1.5:1),tr=TAX[m.tax],G=GUARD[m.guard];
  const inc=r*tr.inc*(.7+.6*m.happy)*(1+.3*(b.market||0))+(b.harbour&&!m.quar?r*2*Math.min(4,(n.trade||[]).length+1)*(b.harbour):0)+(b.workshop||0)*r*3+(b.factory||0)*r*8+(b.station?r*3:0)-(m.guild?r*2:0)+(m.guild?3:0);
  const upk=G.cost*(1+e*.1)+Object.values(b).reduce((s,v)=>s+v,0)*.5;m.inc=inc;m.upk=upk;m.gold+=inc-upk;if(m.quar>0)m.quar--;
  if(m.gold<0){m.debt=(m.debt||0)+1;if(m.debt>3&&m.guard!=='none'){m.guard=GUARD[m.guard].def>1?'watch':'none';mlog(m,'The treasury is empty: the council could no longer pay the guard and sent most of them home.')}m.happy-=.03}else m.debt=0;
  /* people: room, food and happiness decide whether the town grows */
  const room=U*(1+.3*(b.houses||0)+.1*(b.hospital||0)+.1*(b.station||0))*(cap?1.15:1);m.room=room;
  const g=fed<1?-(1-fed)*.25:(.018+.01*(b.hospital||0))*(m.happy-.25)*(1+.15*(b.station||0))*(m.P<room?1:-.6);
  const P0=m.P;m.P=Math.max(U*.08,m.P*(1+g));if(m.P>room*1.08)m.P=room*1.08;
  /* the town follows the realm: when the whole land grows or shrinks, so does the town */
  const U0=m.lastU||U;m.P*=clamp(U/U0,.8,1.25);m.lastU=U;
  if(fed<.7&&year-(m.hungerY||-99)>6){m.hungerY=year;mlog(m,`Hunger in ${c.name}: the stores ran out and people went hungry.`,'doom')}
  if(m.P>m.best*1.25&&m.P>U*1.2){m.best=m.P;mlog(m,`${c.name} has grown into ${(rankOf(T)==='Metropolis'?'a ':'a ')+rankOf(T).toLowerCase()}.`,'life')}
  /* happiness and loyalty */
  const crowd=Math.max(0,m.P/room-.95)*1.5,siege=c.siege>.05?.15:0,war=n.wars.size?.05:0,sick=n.sick?.1:0;
  m.fest=Math.max(0,m.fest-.025);
  const tgt=.55+tr.hap+(b.temple?.08:0)+.025*(b.market||0)+(b.park?.05:0)-.04*(b.factory||0)+(fed>=1?.04:-.35*(1-fed))-crowd-siege-war-sick+m.fest-(m.guard==='army'?.03:0)+(m.mood||0);
  m.mood=(m.mood||0)*.8;m.happy=clamp(m.happy+(tgt-m.happy)*.25,0,1);
  if(!m.free||!cap)m.loyal=clamp(m.loyal+((.55+(m.happy-.5)*.4)-m.loyal)*.05,0,1);
  /* the realm gains from a well-run town */
  n._mayMod={tech:1+.03*(b.school||0)+.01*(b.workshop||0),mil:1+(b.barracks?.05:0),sea:1+(b.shipyard?.12:0)+(b.harbour?.03:0),belief:1+(b.temple?.04:0),grow:1+(m.happy-.5)*.02};
  if(b.school)n.tech+=TECHCOST[e]*.002*b.school;if(b.temple)n.devotion=Math.min(1,(n.devotion??.3)+.0015);
  if(b.shipyard&&n.era>=SAIL&&rng()<.03&&typeof launch==='function'){const foe=[...n.wars].map(i=>nations[i]).find(x=>x&&x.alive);try{launch(n,foe?'war':'trade',foe||nations.find(x=>x.alive&&x!==n&&(n.trade||[]).includes(x.id))||undefined)}catch(err){}}
  /* defence: walls and the guard hold the town; the auto-rebellion of the realm gives way to your own choices */
  c.walls=(b.walls||0)*.5+GUARD[m.guard].def*.12+(b.barracks?.2:0);c.unrest=Math.min(c.unrest||0,.8);
  if(c.siege>.05&&!m.sieged){m.sieged=year;mlog(m,`${nations[c.besiegedBy]?nations[c.besiegedBy].name:'The enemy'} laid siege to ${c.name}.`,'war')}if(c.siege<=.02&&m.sieged){if(year-m.sieged>1)mlog(m,`The siege of ${c.name} was lifted.`);m.sieged=0}
  /* history for the little chart */
  if(year%5===0){m.hist.push([year,Math.round(m.P*10)/10,Math.round(m.gold)]);if(m.hist.length>60)m.hist.shift()}
  /* the council must decide something */
  if(m.ask&&year-m.ask.y>=5){const A=ASKS[m.ask.id];if(A){const o=A.opts(T,m.ask)[A.def||0];try{o.fn(T,m.ask)}catch(err){}mlog(m,`The council did not wait for you and chose: ${o.label.toLowerCase()}.`)}m.ask=null;m.next=year+5+((rng()*6)|0)}
  if(!m.ask&&year>=m.next){const L=Object.keys(ASKS).filter(k=>{try{return ASKS[k].ok(T)}catch(err){return false}});if(L.length){const tot=L.reduce((s,k)=>s+(ASKS[k].w||1),0);let x=rng()*tot,id=L[0];for(const k of L){x-=(ASKS[k].w||1);if(x<=0){id=k;break}}
      m.ask={id,y:year,v:ASKS[id].v?ASKS[id].v(T):null};if(typeof toast==='function')toast(`${c.name}: the council asks`,ASKS[id].title(T,m.ask),wx(c.x),wz(c.y));townBadge()}
    m.next=year+6+((rng()*8)|0)}}
{const _t=tick;tick=function(){_t.apply(this,arguments);try{mayorYear()}catch(e){console.warn('mayor',e)}}}

/* ---------- what the council is asked ---------- */
const g$=n=>Math.round(n);
const ASKS={
  fire:{w:1,ok:T=>T.n.era<=5,title:T=>`Fire in the lower town of ${T.c.name}`,text:T=>'A fire broke out among the wooden houses by the river gate. The bucket brigade needs paying, or the fire will burn itself out.',
    opts:T=>[{label:'Pay the bucket brigade',cost:20,fn:T=>{T.c.mayor.gold-=20;mlog(T.c.mayor,'The bucket brigade put out the fire before it spread.')}},
      {label:'Let it burn out',fn:T=>{const m=T.c.mayor;m.P*=.94;m.mood-=.08;if(typeof ignite==='function')ignite(T.c.y*W+T.c.x);mlog(m,`The fire burned a whole street of ${T.c.name}.`,'doom')}}]},
  refugees:{w:1.2,ok:T=>T.n.wars.size||nations.some(x=>x.alive&&x.wars.size&&T.n.nb.has(x.id)),title:T=>'Refugees at the gates',text:T=>'Families fleeing the war are camped outside the gates, asking to be let in.',
    opts:T=>[{label:'Take them in',fn:T=>{const m=T.c.mayor;m.P*=1.08;m.food-=m.P*.05;m.mood+=.03;mlog(m,'The refugees were taken in; some opened workshops, others found work in the fields.')}},
      {label:'Turn them away',fn:T=>{const m=T.c.mayor;m.mood-=.04;mlog(m,'The refugees were turned away. Some townsfolk were ashamed.')}}]},
  guild:{w:.8,ok:T=>T.n.era>=1&&!T.c.mayor.guild,title:T=>'The merchants want a monopoly',text:T=>'The richest merchants offer the council a large gift if only their guild may trade in the town.',
    opts:T=>[{label:'Refuse',fn:T=>mlog(T.c.mayor,'The council refused the merchants a monopoly.')},
      {label:'Grant it (+60 now)',fn:T=>{const m=T.c.mayor;m.gold+=60;m.guild=year;m.mood-=.06;mlog(m,'The merchants\' guild was granted its monopoly. Prices rose in the market.')}}]},
  plague:{w:.7,ok:T=>coastWater(T.c).length&&T.c.mayor.b.harbour,title:T=>'A sick ship in the harbour',text:T=>'A ship has come in with sick men aboard. The harbour master asks whether to let the crew ashore.',
    opts:T=>[{label:'Quarantine the ship',fn:T=>{const m=T.c.mayor;m.quar=3;mlog(m,'The ship was kept in quarantine. Trade suffered for a few years, but no one fell ill.')}},
      {label:'Let them land',fn:T=>{const m=T.c.mayor,hosp=m.b.hospital?.5:1;if(rng()<.4*hosp){m.P*=1-.12*hosp;m.mood-=.1;mlog(m,`Fever spread from the harbour through ${T.c.name}.`,'doom')}else mlog(m,'The sailors landed and recovered. Nothing came of it.')}}]},
  outlaws:{w:1,ok:T=>T.n.era<=4,title:T=>'Outlaws demand tribute',text:T=>'A band of outlaws in the woods has sent word: pay, or they will raid the farms.',
    opts:T=>[{label:'Send the guard after them',fn:T=>{const m=T.c.mayor,d=GUARD[m.guard].def+(m.b.barracks?1:0);if(rng()<.25+d*.22){m.mood+=.04;mlog(m,'The town guard hunted the outlaws down.')}else{m.food*=.75;m.gold-=15;mlog(m,'The guard was beaten; the outlaws raided the farms.','war')}}},
      {label:'Pay them (40)',fn:T=>{T.c.mayor.gold-=40;mlog(T.c.mayor,'The council paid the outlaws to stay away.')}}]},
  drought:{w:1,ok:T=>T.c.mayor.food>T.c.mayor.P*.2,title:T=>'A dry summer',text:T=>'The wells are low and the wheat is thin. The granary holds grain; the council could open it or ration the town.',
    opts:T=>[{label:'Ration the food',fn:T=>{const m=T.c.mayor;m.mood-=.06;m.food*=.9;mlog(m,'Bread was rationed through the dry summer.')}},
      {label:'Open the granary',fn:T=>{const m=T.c.mayor;m.food*=.55;m.mood+=.06;mlog(m,'The granary was opened and no one went hungry.')}}]},
  builder:{w:.8,ok:T=>T.c.mayor.q.length&&T.c.mayor.q[0].left>2,title:T=>'A master builder offers his services',text:T=>`A famous master builder will finish the ${mbLabel(T.c.mayor.q[0].id,(T.c.mayor.b[T.c.mayor.q[0].id]||0)+1).toLowerCase()} quickly, for a price.`,
    opts:T=>[{label:'No, thank you',fn:T=>{}},{label:'Hire him (50)',fn:T=>{const m=T.c.mayor;m.gold-=50;if(m.q[0])m.q[0].left=1;mlog(m,'A master builder was hired to hurry the works.')}}]},
  festival:{w:1,ok:T=>T.c.mayor.fest<.03,title:T=>'The people ask for a festival',text:T=>'It has been a long time since the last feast. The guilds want music, games and a fair in the square.',
    opts:T=>[{label:'Not this year',fn:T=>{T.c.mayor.mood-=.02}},{label:'Hold a festival (25)',fn:T=>{const m=T.c.mayor;m.gold-=25;m.fest=.12;if(typeof GODW!=='undefined')T.n.festival=Math.max(T.n.festival||0,1);mlog(m,`${T.c.name} held a great festival.`)}}]},
  levy:{w:2,ok:T=>T.n.wars.size&&!(T.c.mayor.free&&T.cap),title:T=>`The crown calls for soldiers`,text:T=>`${T.n.name} is at war, and the king's men have come to raise soldiers from ${T.c.name}.`,
    opts:T=>[{label:'Send the young men',fn:T=>{const m=T.c.mayor;m.P*=.95;m.loyal=Math.min(1,m.loyal+.12);m.mood-=.04;T.n.pop+=m.P*.03;mlog(m,`${T.c.name} sent its young men to the war.`)}},
      {label:'Refuse',fn:T=>{const m=T.c.mayor;m.loyal-=.18;mlog(m,'The council refused to send soldiers. The crown will not forget it.')}}]},
  tax:{w:1.5,ok:T=>!(T.c.mayor.free&&T.cap)&&T.c.mayor.gold>30,v:T=>Math.max(20,g$(T.c.mayor.gold*.3)),title:(T,a)=>`The crown demands its share`,text:(T,a)=>`The royal tax collector wants ${a.v} crowns from the town treasury.`,
    opts:(T,a)=>[{label:`Pay ${a?a.v:''}`,fn:(T,a)=>{const m=T.c.mayor;m.gold-=a.v;m.loyal=Math.min(1,m.loyal+.06);T.n.tech+=TECHCOST[T.n.era]*.01;mlog(m,`The council paid ${a.v} crowns to the crown.`)}},
      {label:'Refuse',fn:T=>{const m=T.c.mayor;m.loyal-=.14;mlog(m,'The council refused to pay the crown.')}}]},
  freedom:{w:4,ok:T=>T.c.mayor.loyal<.25&&!T.cap&&T.n.cities.length>1,title:T=>'The people want to rule themselves',text:T=>`Crowds in the square shout that ${T.c.name} owes ${T.n.name} nothing. The council could declare the town free.`,
    opts:T=>[{label:'Stay loyal',fn:T=>{const m=T.c.mayor;m.loyal+=.15;m.mood-=.05;mlog(m,'The council calmed the crowds and stayed loyal.')}},
      {label:'Declare independence',fn:T=>{const m=T.c.mayor;m.free=year;m.loyal=1;const before=nations.length;try{rebel(T.n,T.c,'free',`The council of ${T.c.name} declared the town free of ${T.n.name}.`)}catch(err){}
        if(nations.length>before)mlog(m,`${T.c.name} is free! It is now the capital of a country of its own.`,'era');else{m.free=0;mlog(m,'The declaration came to nothing.')}}}]},
  railway:{w:1.5,ok:T=>T.n.era>=5&&!T.c.mayor.b.station&&!T.c.mayor.q.some(p=>p.id==='station'),title:T=>'A railway company wants to come',text:T=>'A railway company will build a station at its own cost, if it may keep the fares.',
    opts:T=>[{label:'Let them build it',fn:T=>{const m=T.c.mayor;m.q.unshift({id:'station',left:3});mlog(m,'The railway company began building a station.')}},{label:'No railway here',fn:T=>mlog(T.c.mayor,'The council turned the railway away.')}]},
  strike:{w:1.5,ok:T=>T.c.mayor.b.factory,title:T=>'The factory workers are on strike',text:T=>'The mills stand still. The workers want better pay and shorter days.',
    opts:T=>[{label:'Raise their pay (40)',fn:T=>{const m=T.c.mayor;m.gold-=40;m.mood+=.08;mlog(m,'The workers won better pay; the mills turned again.')}},{label:'Break the strike',fn:T=>{const m=T.c.mayor;m.mood-=.12;m.loyal+=.05;mlog(m,'The strike was broken. The workers went back angry.')}}]},
  scholar:{w:.8,ok:T=>T.c.mayor.b.school,title:T=>'A great scholar wants to settle here',text:T=>'A famous scholar asks for a house and a stipend in return for teaching at the school.',
    opts:T=>[{label:'Welcome the scholar (30)',fn:T=>{T.c.mayor.gold-=30;T.n.tech+=TECHCOST[T.n.era]*.06;mlog(T.c.mayor,'A great scholar came to teach in the town.')}},{label:'We cannot afford it',fn:T=>{}}]},
  pilgrims:{w:.7,ok:T=>T.c.mayor.b.temple&&T.n.faith>=0,title:T=>'Pilgrims bring a relic',text:T=>'Pilgrims carrying a holy relic ask to leave it in the temple, if the town builds a shrine for it.',
    opts:T=>[{label:'Build the shrine (30)',fn:T=>{const m=T.c.mayor;m.gold-=30;m.mood+=.05;T.n.devotion=Math.min(1,(T.n.devotion??.3)+.04);mlog(m,'A shrine for the relic was built; pilgrims now come every year.')}},{label:'Send them on',fn:T=>{}}]}};

/* ---------- decisions and building, from the panel ---------- */
function canBuild(T,id){const m=T.c.mayor,B=MB[id],l=(m.b[id]||0)+m.q.filter(p=>p.id===id).length;if(l>=B.max||T.n.era<B.era)return null;if(B.coast&&!coastWater(T.c).length)return null;if(id==='walls'&&l===2&&T.n.era<3)return null;return {l,...mbCost(id,l,T.n.era)}}
function orderBuild(id){const T=myTown();if(!T)return;const m=T.c.mayor,k=canBuild(T,id);if(!k||m.q.length>=3)return;if(m.gold<k.gold||m.wood<k.wood){toast('Not enough',`The ${MB[id].name.toLowerCase()} needs ${k.gold} crowns and ${k.wood} timber.`);return}
  m.gold-=k.gold;m.wood-=k.wood;m.q.push({id,left:mbYrs(id,k.l)});mlog(m,`The council ordered a ${mbLabel(id,k.l+1).toLowerCase()}.`);renderSheet(true)}
function answer(i){const T=myTown();if(!T||!T.c.mayor.ask)return;const m=T.c.mayor,A=ASKS[m.ask.id],o=A.opts(T,m.ask)[i];if(!o)return;try{o.fn(T,m.ask)}catch(err){console.warn(err)}m.ask=null;m.next=Math.max(m.next,year+5);townBadge();renderSheet(true)}
const woodPrice=e=>12+e*3;
function buyWood(){const T=myTown();if(!T)return;const m=T.c.mayor,p=woodPrice(T.n.era);if(m.gold<p)return;m.gold-=p;m.wood=Math.min(400,m.wood+20);renderSheet(true)}
function townBadge(){const b=document.querySelector('[data-panel="town"]');if(!b)return;const T=myTown();b.classList.toggle('ask',!!(T&&T.c.mayor.ask))}

/* ---------- the panel ---------- */
const barH=(v,col)=>`<div class="prog"><i style="width:${clamp(v,0,1)*100}%;background:${col}"></i></div>`;
const goldC=v=>`${Math.round(v)} crowns`;
function chartSvg(hist){if(hist.length<3)return '';const W_=280,H_=46,ps=hist.map(h=>h[1]),mx=Math.max(...ps),mn=Math.min(...ps),sx=i=>i/(hist.length-1)*W_,sy=v=>H_-4-(v-mn)/(mx-mn||1)*(H_-8);
  return `<svg viewBox="0 0 ${W_} ${H_}" style="width:100%;height:46px;display:block"><polyline fill="none" stroke="#e2bd6a" stroke-width="1.6" points="${hist.map((h,i)=>sx(i).toFixed(1)+','+sy(h[1]).toFixed(1)).join(' ')}"/><text x="0" y="10" fill="#a49f92" font-size="9">People since ${hist[0][0]}</text></svg>`}
function townHTML(){const T=myTown();
  if(!T){const n=selected>=0?nations[selected]:null,L=n&&n.alive?n.cities.map((c,k)=>({n,c,k})):nations.filter(x=>x.alive).flatMap(x=>x.cities.map((c,k)=>({n:x,c,k}))).sort((a,b)=>unitOf(b.n,!b.k)-unitOf(a.n,!a.k)).slice(0,10);
    return `<div class="sec"><p class="note">${GODW.mayorLost?`<b>${esc(GODW.mayorLost.name)} was lost in ${GODW.mayorLost.year}.</b> `:''}Lead the council of one town. Set its taxes, feed its people, choose what to build and decide what the crown, wars and fortune bring. The rest of the world goes on around you, and you are still its god.</p>
      <h4>${n&&n.alive?'Towns of '+esc(n.name):'Some of the greatest towns'}</h4><ul class="list">${L.map(o=>`<li><button data-govern="${o.n.id}:${o.k}">${flagImg(o.n,'flag')}<span class="nm">${esc(o.c.name)}<small>${o.k===0?'Capital of ':''}${esc(o.n.name)} · ${ERAS[o.n.era].name}${coastWater(o.c).length?' · on the coast':''}</small></span><span class="pp">${fmtPop(unitOf(o.n,!o.k))}</span></button></li>`).join('')}</ul>
      <p class="note">Or tap a nation on the map to see its towns here.</p></div>`}
  const {n,c,cap}=T,m=c.mayor,e=n.era,room=m.room||m.P,net=(m.inc||0)-(m.upk||0),fedTxt=m.fedR==null?'—':m.fedR>=1.15?'Plenty':m.fedR>=1?'Enough':m.fedR>=.85?'Short':'Hungry';
  const ask=m.ask&&ASKS[m.ask.id],role=e<=1?'Elder of':e<=4?'Head of the council of':'Mayor of';
  let h=`<div class="sec"><div class="row" style="gap:8px;align-items:center">${flagImg(n,'flag big')}<div><b style="font-size:16px">${esc(c.name)}</b><br><small class="lab">${role} ${esc(c.name)} since ${m.since} · ${rankOf(T)}${cap?' · capital of ':' · in '}${esc(n.name)}${m.free?' · free since '+m.free:''}</small></div></div>
    ${c.siege>.05?`<p class="note" style="color:#f0a196"><b>Under siege</b> by ${esc(nations[c.besiegedBy]?nations[c.besiegedBy].name:'the enemy')} · ${Math.round(c.siege*100)}%</p>`:''}
    <div class="kv"><div><span>People</span><b>${fmtPop(m.P)}</b></div><div><span>Room</span><b>${Math.round(m.P/room*100)}%</b></div>
    <div><span>Food</span><b>${fedTxt}${m.food>1?` · ${Math.round(m.food/Math.max(1,m.P)*12)} months stored`:''}</b></div><div><span>Timber</span><b>${Math.round(m.wood)} <small style="font-weight:400">+${m.woodIn||0}/yr</small></b></div>
    <div><span>Treasury</span><b>${goldC(m.gold)} <small style="font-weight:400;color:${net>=0?'#a9dba5':'#f0a196'}">${net>=0?'+':''}${Math.round(net)}/yr</small></b></div><div><span>Defence</span><b>${['Open town','Some defence','Well defended','A fortress','A fortress'][Math.min(4,Math.round((m.b.walls||0)*.8+GUARD[m.guard].def*.5+(m.b.barracks?.5:0)))]}</b></div></div>
    <div><span class="lab">Happiness · ${happyLabel(m.happy)}</span>${barH(m.happy,happyColor(m.happy))}</div>
    ${m.free&&cap?'':`<div><span class="lab">Loyalty to ${esc(n.name)} · ${m.loyal>.7?'Loyal':m.loyal>.45?'Dutiful':m.loyal>.25?'Restless':'Rebellious'}</span>${barH(m.loyal,'#88b3ee')}</div>`}${chartSvg(m.hist)}</div>`;
  if(ask)h+=`<div class="sec" style="border:1px solid var(--gold);border-radius:10px;padding:10px"><h4 style="color:var(--gold2)">${esc(ask.title(T,m.ask))}</h4><p class="note">${esc(ask.text(T,m.ask))}</p><div class="row" style="gap:6px;flex-wrap:wrap">${ask.opts(T,m.ask).map((o,i)=>`<button class="btn${i===0?'':' primary'}" data-answer="${i}">${esc(o.label)}</button>`).join('')}</div><p class="note" style="margin-top:4px">If you don't decide within ${Math.max(1,5-(year-m.ask.y))} years, the council decides for you.</p></div>`;
  const seg=(k,o)=>`<div class="seg" style="margin:4px 0 8px">${Object.entries(o).map(([v,d])=>`<button data-pol="${k}:${v}" aria-pressed="${m[k]===v}">${d.label}</button>`).join('')}</div>`;
  h+=`<div class="sec"><h4>Policies</h4><span class="lab">Taxes</span>${seg('tax',TAX)}<span class="lab">Harvest</span>${seg('share',{keep:{label:'Keep it in town'},share:{label:'Send surplus to the realm'}})}<span class="lab">Guard · ${Math.round(GUARD[m.guard].cost*(1+e*.1))} crowns a year</span>${seg('guard',GUARD)}</div>`;
  const built=Object.entries(m.b).filter(([k,v])=>v>0);
  const wp=woodPrice(e);h+=`<div class="sec"><h4>Building</h4><div class="row" style="gap:6px;margin-bottom:6px"><button class="btn" data-buywood ${m.gold>=wp?'':'disabled style="opacity:.55"'}>Buy 20 timber · ${wp} crowns</button></div>${m.q.length?m.q.map((p,i)=>`<p class="note" style="margin:2px 0">${i===0?'<b>Building</b>':'Then'} ${esc(mbLabel(p.id,(m.b[p.id]||0)+1+m.q.slice(0,i).filter(q=>q.id===p.id).length).toLowerCase())} · ${p.left} year${p.left===1?'':'s'}${i===0?' left':''}</p>`).join(''):'<p class="note">Nothing is being built.</p>'}
    <ul class="list">${Object.keys(MB).map(id=>{const k=canBuild(T,id);if(!k)return '';const ok=m.gold>=k.gold&&m.wood>=k.wood&&m.q.length<3;
      return `<li><button class="dis" data-build="${id}" ${ok?'':'disabled style="opacity:.55"'}><span class="nm">${esc(mbLabel(id,k.l+1))}${MB[id].max>1?` <small style="display:inline">(${k.l+1}/${MB[id].max})</small>`:''}<small>${esc(MB[id].fx)} · ${mbYrs(id,k.l)} years</small></span><span class="pp">${k.gold} crowns${k.wood?'<br>'+k.wood+' timber':''}</span></button></li>`}).join('')}</ul>
    ${built.length?`<p class="note"><b>Built:</b> ${built.map(([k,v])=>k==='houses'?esc(v+' new street'+(v>1?'s':'')):`<a href="#" data-mbgo="${k}" style="color:var(--gold2)">${esc(mbLabel(k,v))}</a>`).join(', ')}<br><small>Tap a building to see it.</small></p>`:''}</div>`;
  h+=`<div class="sec"><h4>Town chronicle</h4>${m.log.slice(0,8).map(l=>`<p class="note" style="margin:2px 0"><b>${l.y}</b> ${esc(l.t)}</p>`).join('')}</div>
    <div class="row" style="gap:6px"><button class="btn" data-towngo>Go to ${esc(c.name)}</button><div class="flex"></div><button class="btn danger" data-stepdown>Step down</button></div>`;
  return h}
SHEETS.town='Your town';
{const _rs=renderSheet;renderSheet=function(full){if(sheetPanel!=='town')return _rs.apply(this,arguments);const B=$('#sheetBody');if(!B)return;
  /* don't rebuild under the player's finger: only when something changed */const T=myTown(),m=T&&T.c.mayor,sig=year+'|'+(m?m.q.length+':'+(m.ask?m.ask.id:'')+':'+m.tax+m.share+m.guard+':'+Math.round(m.gold)+':'+Math.round(m.wood):'none'+selected);
  if(!full&&B.dataset.sig===sig)return;B.dataset.sig=sig;B.innerHTML=townHTML()}}
$('#sheetBody').addEventListener('click',e=>{if(sheetPanel!=='town')return;
  const gv=e.target.closest('[data-govern]');if(gv){const [nid,k]=gv.dataset.govern.split(':').map(Number),n=nations[nid];if(n&&n.cities[k])govern(n,n.cities[k]);renderSheet(true);return}
  const bd=e.target.closest('[data-build]');if(bd&&!bd.disabled){orderBuild(bd.dataset.build);return}
  const an=e.target.closest('[data-answer]');if(an){answer(+an.dataset.answer);return}
  const po=e.target.closest('[data-pol]');if(po){const T=myTown();if(!T)return;const [k,v]=po.dataset.pol.split(':');T.c.mayor[k]=v;mlog(T.c.mayor,k==='tax'?`Taxes set to ${TAX[v].label.toLowerCase()}.`:k==='share'?(v==='share'?'The council will send its surplus grain to the realm.':'The council will keep its harvest in town.'):`Guard set to ${GUARD[v].label.toLowerCase()}.`);renderSheet(true);return}
  if(e.target.closest('[data-towngo]')){const T=myTown();if(T)focusOn(wx(T.c.x),wz(T.c.y),Math.min(camDistT,6));return}
  const mg=e.target.closest('[data-mbgo]');if(mg){e.preventDefault();const T=myTown();if(!T)return;const id=mg.dataset.mbgo;let pt=(T.c._mb||[]).find(a=>a[0]===id);
    if(!pt&&(id==='harbour'||id==='shipyard')){const ws=coastWater(T.c);if(ws.length)pt=[id,wx(ws[0]%W),wz((ws[0]/W)|0)]}if(!pt&&id==='walls')pt=[id,wx(T.c.x)+.4,wz(T.c.y)];if(!pt)pt=[id,wx(T.c.x),wz(T.c.y)];focusOn(pt[1],pt[2],Math.min(camDistT,1.4));return}
  if(e.target.closest('[data-buywood]')){buyWood();return}
  if(e.target.closest('[data-stepdown]')){stepDown();return}});

/* a button on the nation card: govern the town you tapped, or one of its towns */
{const _rn=renderNationCard;renderNationCard=function(){_rn.apply(this,arguments);const n=selected>=0?nations[selected]:null;if(!n||!n.alive||!n.cities.length)return;const el=$('#nationCard');if(!el||el.querySelector('[data-mayorcard]'))return;
  let c=null;if(inspectTile>=0){const x=inspectTile%W,y=(inspectTile/W)|0;let bd=3.5;for(const t of n.cities){const d=Math.hypot(t.x-x,t.y-y);if(d<bd){bd=d;c=t}}}
  const v=document.createElement('div');v.dataset.mayorcard='1';v.style.marginTop='6px';
  v.innerHTML=c?(c.mayor?`<button class="btn" data-mayoropen style="width:100%">Your town: ${esc(c.name)}</button>`:`<button class="btn" data-mayorpick="${n.id}:${n.cities.indexOf(c)}" style="width:100%">Govern ${esc(c.name)}</button>`):`<button class="btn" data-mayoropen style="width:100%">Govern a town of ${esc(n.name)}</button>`;el.appendChild(v)}}
document.addEventListener('click',e=>{const p=e.target.closest('[data-mayorpick]');if(p){const [nid,k]=p.dataset.mayorpick.split(':').map(Number),n=nations[nid];if(n&&n.cities[k])govern(n,n.cities[k]);return}
  if(e.target.closest('[data-mayoropen]')){if(sheetPanel!=='town')openSheet('town');else renderSheet(true)}});

/* ---------- the world, touched by the council's choices ---------- */
{const _ft=typeof fishBoats==='function'?fishBoats:null;if(_ft)fishBoats=function(n,c){const v=_ft.apply(this,arguments);return c&&c.mayor&&c.mayor.b.harbour?v+2*c.mayor.b.harbour:v}}
{const _td=typeof townDef==='function'?townDef:null;if(_td)townDef=function(n,c){const v=_td.apply(this,arguments);if(!c||!c.mayor)return v;const m=c.mayor;return v*(1+.25*GUARD[m.guard].def+.2*(m.b.walls||0)+(m.b.barracks?.2:0))}}
{const _pr=pirateRaid;pirateRaid=function(s){if(!s.home){const hit=cityAtTile(s.target);if(hit&&hit.c.mayor){const m=hit.c.mayor,d=GUARD[m.guard].def*.12+(m.b.walls||0)*.12+(m.b.barracks?.1:0);
      if(rng()<d){mlog(m,`The town guard of ${hit.c.name} drove off a pirate raid.`,'war');sailHome(s.path[s.path.length-1],s.raids+1);return}
      const g0=m.gold;const r=_pr.apply(this,arguments);m.gold=Math.max(0,m.gold*.6);m.food*=.8;mlog(m,`Pirates plundered ${hit.c.name} and carried off ${Math.round(g0-m.gold)} crowns.`);return r}}return _pr.apply(this,arguments)}}
/* the town is drawn bigger or smaller by how many people actually live there */
{const _bc=buildCity;buildCity=function(n,c){if(c&&c.mayor){const cap=n.cities[0]===c,r=c.mayor.P/unitOf(n,cap);MAYOR_TL=clamp(Math.log2(Math.max(.1,r))*3.2,-4,6)}try{return _bc.apply(this,arguments)}finally{MAYOR_TL=0}}}
{const _tl=townLevel;townLevel=function(n,cap){const v=_tl.apply(this,arguments);return MAYOR_TL?clamp(v+MAYOR_TL,1,TOWN_MAX):v}}
{const _ck=cityKey;cityKey=function(n,c){const k=_ck.apply(this,arguments);if(!c||!c.mayor)return k;const m=c.mayor,cap=n.cities[0]===c;return k+'|M'+Math.round(clamp(Math.log2(Math.max(.1,m.P/unitOf(n,cap)))*3.2,-4,6))+Object.entries(m.b).map(([a,v])=>a[0]+a[1]+v).join('')}}
{const _as=applySave;applySave=function(){const r=_as.apply(this,arguments);setTimeout(townBadge,0);return r}}
if(!('mayorLost' in GODW))GODW.mayorLost=null;if(!('mayorAt' in GODW))GODW.mayorAt=null;

/* ---------- what the council built, standing in the town ---------- */
function mayorBuild(n,c,cx,cz,e,cap,KO,dryOff,i0){const m=c.mayor,b=m.b,cu=cultOf(n),roof=e<=1?'thatch':'tiles',roofC=e<=1?0xc8a868:ROOF_RED[(i0>>2)%ROOF_RED.length],wall=e<=1?'timber':e>=5?'brick':'plaster',wallC=e>=5?0xa05a44:0xe6dcc8;
  const R0=(cap?.5:.36)+Math.min(.25,(m.P/unitOf(n,cap))*.05);let ang=hash(i0*5.3)*6.283;
  c._mb=[];const free=(x,z,size)=>groundY(x,z)>waterY+.03&&!(typeof riverNear==='function'&&riverNear(x,z,size*.8))&&!KO.some(k=>Math.hypot(k[0]-x,k[1]-z)<k[2]+size)&&(()=>{const t=tileAt(x,z);return t>=0&&(owner[t]<0||owner[t]===n.id)})();
  const spot=(r,size,id)=>{ang+=1.17;let P_=null;for(const rr of [r,r*1.3,r*.75,r*1.65,r*2])for(let q=0;q<12&&!P_;q++){const a=ang+q*.5236,x=cx+Math.cos(a)*rr,z=cz+Math.sin(a)*rr;if(free(x,z,size))P_=[x,z]}
    if(!P_)P_=dryOff(Math.cos(ang)*r,Math.sin(ang)*r,size);const [x,z]=P_;KO.push([x,z,size]);c._mb.push([id,x,z]);return [x,surfY(x,z),z]};
  const S=(fn,x,z)=>solid(fn,x,z,0,false,undefined,'big');
  if(b.granary){const [x,y,z]=spot(R0,.09,'granary'),rot=ang;S(()=>{for(const [u,v] of [[-.03,-.02],[.03,-.02],[-.03,.02],[.03,.02]])P('stone',x,y-.02,z,rot,u,v,0,.012,.03,.012,0xb8b0a0);
      house(x,y+.01,z,rot,.085,.06,.06+.015*b.granary,e<=1?'timber':'stone',e<=1?0x8a6a44:0xd0c8b8,roof,roofC,false,{hk:.2});if(b.granary>1){house(x,y+.01,z,rot+1.57,.05,.05,.05,'stone',0xd0c8b8,roof,roofC,false,{hk:.2})}},x,z)}
  if(b.market){const [x,y,z]=spot(R0*.7,.1,'market'),rot=ang;S(()=>{const big=b.market>1;for(const u of [-1,1])for(const v of [-1,0,1])P('cyl',x,y-.01,z,rot,u*.045,v*.03,0,.006,.05,.006,0xd8d0c0);
      P(roof,x,y+.045,z,rot,0,0,0,.11,.04,.08,roofC);if(big){P('stone',x,y+.045,z,rot,0,0,0,.1,.03,.075,0xe6dcc8);P(roof,x,y+.075,z,rot,0,0,0,.115,.04,.085,roofC)}
      for(let k=0;k<4;k++){const a=k*1.57+.4;P('awning',x,y,z,rot,Math.cos(a)*.1,Math.sin(a)*.09,.03,.035,.012,.025,[0xc85a3a,0xe8c860,0x5a8ac8,0x7ab85a][k])}},x,z)}
  if(b.temple&&!(n.faith>=0&&(cap||hash(i0*3)<.35))){const [x,y,z]=spot(R0*.8,.12,'temple');if(n.faith>=0)S(()=>sacredSite(faiths[n.faith],n,x,y,z,e,ang,false),x,z);
    else S(()=>{for(let k=0;k<9;k++){const a=k/9*6.283;add('stone',x+Math.cos(a)*.07,y-.01,z+Math.sin(a)*.07,.014,.05,.01,a,0x9a958a)}add('stone',x,y-.01,z,.03,.02,.03,0,0xb8b0a0)},x,z)}
  if(b.mill){const [x,y,z]=spot(R0*1.25,.08,'mill');S(()=>{add('cyl',x,y-.01,z,.04,.14,.04,0,e<=2?0xc8b898:0xd8d0c0);add('coneTile',x,y+.13,z,.048,.05,.048,0,roofC);{const sx=x+Math.sin(ang)*.046,sz=z+Math.cos(ang)*.046,hy=y+.11;add('box',sx,hy-.1,sz,.022,.2,.004,ang,0xe8e0cc);add('box',sx,hy-.011,sz,.2,.022,.004,ang,0xe8e0cc);add('cyl',sx,hy-.008,sz,.01,.016,.01,0,0x5a4430)}},x,z)}
  if(b.barracks){const [x,y,z]=spot(R0*1.05,.1,'barracks'),rot=ang;S(()=>{house(x,y,z,rot,.12,.05,.045,e>=4?'brick':'stone',e>=4?0x9a5a44:0xc8c0b0,roof,ROOF_SLATE[0],false,{hk:.2});P('cyl',x,y,z,rot,.08,0,0,.003,.14,.003,0x5a4430);P('box',x,y+.12,z,rot,.098,0,0,.035,.022,.003,parseInt(n.color.slice(1),16));
      for(const u of [-1,1])P('fence',x,y,z,rot,u*.02,-.06,0,.1,.02,.004,0x7a5a3a)},x,z)}
  if(b.workshop){for(let k=0;k<b.workshop;k++){const [x,y,z]=spot(R0*.95,.08,'workshop'),rot=ang;S(()=>{house(x,y,z,rot,.08,.055,.065,wall,wallC,roof,roofC,true,{hk:.6});if(k===0)P('box',x,y+.05,z,rot,0,.031,0,.03,.016,.003,0x3a2a1c)},x,z);smokeAt(x,y+.11,z,false,1.4)}}
  if(b.school){const [x,y,z]=spot(R0*.9,.1,'school'),rot=ang;S(()=>{house(x,y,z,rot,.1,.06,.07+.02*(b.school-1),b.school>1?'stone':wall,b.school>1?0xe0d8c8:wallC,roof,ROOF_SLATE[1],false,{hk:.8});
      P('stone',x,y+.07,z,rot,0,0,0,.022,.04,.022,0xe8e0d0);P('pyr',x,y+.11,z,rot,0,0,0,.028,.03,.028,ROOF_SLATE[0])},x,z)}
  if(b.hospital){const [x,y,z]=spot(R0*1.1,.1,'hospital'),rot=ang;S(()=>{house(x,y,z,rot,.13,.06,.08,'plaster',0xf2f0ea,'tiles',ROOF_SLATE[2],false,{hk:.9});P('box',x,y+.055,z,rot,0,.031,0,.022,.006,.003,0xc83a2a);P('box',x,y+.055,z,rot,0,.031,0,.006,.022,.003,0xc83a2a)},x,z)}
  if(b.factory){for(let k=0;k<b.factory;k++){const [x,y,z]=spot(R0*1.35,.12,'factory'),rot=ang;S(()=>{P('brick',x,y-.01,z,rot,0,0,0,.16,.07,.09,0x9a4a36);for(let s=0;s<3;s++)P('tiles',x,y+.06,z,rot,-.05+s*.05,0,0,.05,.025,.09,ROOF_SLATE[0],Math.PI/2);
      for(const u of [-1,1])P('cyl',x,y-.01,z,rot,u*.05,-.03,0,.012,.2,.012,0x7a3a2a)},x,z);const c0=Math.cos(rot),s0=Math.sin(rot);for(const u of [-1,1])smokeAt(x+u*.05*c0-.03*s0,y+.2,z-u*.05*s0-.03*c0,true,2.5)}}
  if(b.park){const [x,y,z]=spot(R0*.85,.12,'park');S(()=>{add('plazaStone',x,y-.006,z,.2,.01,.2,0,0x8ab86a);add('cyl',x,y,z,.04,.012,.04,0,0xd8d2c6);add('pool',x,y+.004,z,.034,.01,.034);for(let k=0;k<5;k++){const a=k*1.25+.3;add('townTree',x+Math.cos(a)*.08,y,z+Math.sin(a)*.08,.04,.07,.04,a,0x5a8a44)}},x,z)}
  if(b.station){const [x,y,z]=spot(R0*1.2,.12,'station'),rot=ang;S(()=>{house(x,y,z,rot,.14,.05,.06,'brick',0xb87a5a,'tiles',ROOF_SLATE[0],false,{hk:.7});P('stone',x,y-.015,z,rot,0,.065,0,.24,.012,.035,0xb8b0a0);
      for(const u of [-1,1])P('box',x,y-.012,z,rot,0,.095+u*.008,0,.4,.004,.003,0x4a4a4a);P('cyl',x,y,z,rot,0,0,.075,.012,.004,.012,0xf0ece0)},x,z)}
  /* the harbour and the shipyard stand at the water's edge */
  if((b.harbour||b.shipyard)&&coastWater(c).length){const ws=coastWater(c);let best=null,bd=1e9;for(const j of ws){const x=wx(j%W),z=wz((j/W)|0),d=Math.hypot(x-cx,z-cz);if(d<bd){bd=d;best=[x,z]}}
    if(best){const dx=best[0]-cx,dz=best[1]-cz,dl=Math.hypot(dx,dz)||1,ux=dx/dl,uz=dz/dl;let ex=cx,ez=cz;for(let t=0;t<dl+.6;t+=.04){const x=cx+ux*t,z=cz+uz*t;if(groundY(x,z)<waterY+.005){ex=x;ez=z;break}}
      const rot=Math.atan2(-uz,ux);c._mb.push(['harbour',ex,ez],['shipyard',ex+uz*.18,ez-ux*.18]);
      if(b.harbour){const qx=ex+ux*.03,qz=ez+uz*.03,top=waterY+.012;add('box',qx,waterY-.05,qz,.18,top-waterY+.05,.1*b.harbour,rot,0x7e7464);
        for(let k=0;k<4;k++){const o=(k-1.5)*.035;add('box',qx-uz*o-ux*.03,top,qz+ux*o-uz*.03,.022,.022,.022,rot+k,[0x8a6a44,0x7a5a3a,0x9a7a50,0x6a4a30][k])}
        add('cyl',qx+ux*.07,top,qz+uz*.07,.006,.13,.006,0,0x5a4430);add('box',qx+ux*.07,top+.12,qz+uz*.07,.11,.008,.008,rot,0x5a4430);add('cyl',qx+ux*.12,top+.06,qz+uz*.12,.0015,.06,.0015,0,0x3a3a3a)}
      if(b.harbour>1){const lx=ex+ux*.2-uz*.2,lz=ez+uz*.2+ux*.2;add('cyl',lx,waterY-.05,lz,.02,.2,.02,0,0xf0ece4);add('cyl',lx,waterY+.12,lz,.022,.03,.022,0,0xc83a2a);add('glowB',lx,waterY+.15,lz,.012,.012,.012,0,0xffe8a0)}
      if(b.shipyard){const sx=ex+uz*.18,sz=ez-ux*.18,g=Math.max(groundY(sx,sz),waterY-.02);add('stone',sx,g-.02,sz,.22,.025,.07,rot,0x9a9288);for(let k=0;k<7;k++)add('box',sx+ux*(-.08+k*.025),g+.008,sz+uz*(-.08+k*.025),.004,.04,.05,rot,0x8a6a44);add('box',sx,g+.006,sz,.17,.006,.006,rot,0x6a4a30);add('cyl',sx-uz*.06,g,sz+ux*.06,.004,.16,.004,0,0x5a4430)}}}}
