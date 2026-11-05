"use strict";
/* Faithbound — interface, input, overlay and main loop */

const ICON={
  eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  tent:'<path d="M3 20L12 4l9 16zM12 4v16M9 20l3-6 3 6"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
  bulb:'<path d="M9 18h6M10 21h4M12 3a6 6 0 00-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0012 3z"/>',
  star:'<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>',
  swords:'<path d="M4 4l10 10M4 4h4M4 4v4M20 4L10 14M20 4h-4M20 4v4M6 18l-2 2M18 18l2 2M8 16l-2-2M16 16l2-2"/>',
  feast:'<path d="M6 3h12l-1 6a5 5 0 0 1-10 0z"/><path d="M12 14v6M8 21h8"/><path d="M4 6l2 1M20 6l-2 1"/>',
  link:'<path d="M9 15l6-6"/><path d="M10 6l1-1a4 4 0 0 1 6 6l-1 1M14 18l-1 1a4 4 0 0 1-6-6l1-1"/>',
  dove:'<path d="M3 13c3 0 5-2 7-5 1 3 4 5 8 5l3-2-1 4c-2 3-6 4-10 3l-4 2 1-3c-2-1-3-2-4-4z"/>',
  skull:'<path d="M12 3a7 7 0 00-7 7c0 2.5 1.2 4.3 3 5.4V19h8v-3.6c1.8-1.1 3-2.9 3-5.4a7 7 0 00-7-7z"/><circle cx="9.5" cy="11" r="1.4"/><circle cx="14.5" cy="11" r="1.4"/>',
  quake:'<path d="M2 12h4l2-5 3 10 3-8 2 3h6"/>',
  up:'<path d="M3 19h18M6 19l6-11 6 11M12 3v3"/>',down:'<path d="M3 6h18M6 6l6 11 6-11M12 18v3"/>',smooth:'<path d="M2 15c4-6 6-6 10 0s6 6 10 0"/>',
  volcano:'<path d="M2 20l6-9h8l6 9zM10 11l2-4 2 4M12 2v2M9 3l1 2M15 3l-1 2"/>',
  rain:'<path d="M7 14a4 4 0 010-8 5 5 0 019.6 1.5A3.5 3.5 0 0117 14z"/><path d="M8 17l-1 3M12 17l-1 3M16 17l-1 3"/>',
  drought:'<circle cx="12" cy="9" r="4"/><path d="M3 20c3-2 6 0 9-2s6 0 9-2M12 1v2M4 9H2M22 9h-2"/>',
  crown:'<path d="M3 18h18M4 18l-1-10 5 4 4-7 4 7 5-4-1 10"/>',
  bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  cyclone:'<path d="M12 12m-2 0a2 2 0 104 0 2 2 0 10-4 0M4 9c2-4 8-6 12-3M20 15c-2 4-8 6-12 3M6 18c-3-2-4-7-1-10M18 6c3 2 4 7 1 10"/>',
  fire:'<path d="M12 2c1 4 6 6 6 12a6 6 0 01-12 0c0-3 2-5 3-7 0 3 2 4 3 4 0-4-2-6 0-9z"/>',
  wheat:'<path d="M12 22V8M12 8c-3 0-4-3-4-5 3 0 4 2 4 5zM12 8c3 0 4-3 4-5-3 0-4 2-4 5zM12 13c-3 0-4-3-4-5 3 0 4 2 4 5zM12 13c3 0 4-3 4-5-3 0-4 2-4 5zM12 18c-3 0-4-3-4-5 3 0 4 2 4 5zM12 18c3 0 4-3 4-5-3 0-4 2-4 5z"/>',
  meteor:'<circle cx="15" cy="15" r="5"/><path d="M3 3l8 8M8 3l5 5M3 8l5 5"/>'};
Object.assign(ICON,{
  dagger:'<path d="M14.5 3.5l6 6-9 9-3-3zM8.5 15.5l-4 4M6 13l5 5M3.5 20.5l1-1"/>',
  fist:'<path d="M7 11V7a1.5 1.5 0 013 0v3M10 10V6a1.5 1.5 0 013 0v4M13 10V7a1.5 1.5 0 013 0v4M16 11V9a1.5 1.5 0 013 0v4c0 4-2.5 7-6.5 7S7 18 7 15v-4a1.5 1.5 0 00-3 0v2"/>',
  helmet:'<path d="M4 15a8 8 0 0116 0v2H4zM12 7V4M9 15v4M15 15v4M4 17h16"/>',
  oil:'<path d="M12 3c3 4 5 7 5 10a5 5 0 01-10 0c0-3 2-6 5-10zM9.5 13.5a2.5 2.5 0 002.5 2.5"/>',
  whisper:'<path d="M4 6h12a3 3 0 013 3v4a3 3 0 01-3 3h-5l-4 3v-3H4z M8 10h6M8 13h4"/>'});
const svg=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;
const POWERS=[
  {id:'inspect',tab:'*',label:'Observe',cost:0,icon:'eye',hint:'Drag to move, pinch or scroll to zoom, twist or right-drag to turn. Tap a nation to follow it.'},
  {id:'tribe',tab:'People',label:'Seed tribe',cost:15,icon:'tent',hint:'Tap empty land to call a new tribe of followers.'},
  {id:'migrate',tab:'People',label:'Migration',cost:20,icon:'walk',hint:'Tap a town to pick up a group of its people, then tap empty land to set them down. They found a new town there.'},
  {id:'bless',tab:'People',label:'Bless',cost:20,icon:'sun',hint:'Tap a nation. It grows and fights harder for 30 years.'},
  {id:'festival',tab:'People',label:'Festival',cost:20,icon:'feast',hint:'Tap a nation. Its towns hold a harvest festival: full fields, a growing people and stronger faith in you.'},
  {id:'inspire',tab:'People',label:'Inspire',cost:25,icon:'bulb',hint:'Tap a nation. Its scholars work twice as fast for 20 years.'},
  {id:'carry',tab:'People',label:'Lift & place',cost:25,icon:'hand',hint:'Tap a nation to lift its ruler (or its hero), or tap near a prophet. Then tap where to set them down: a ruler takes the throne there.'},
  {id:'golden',tab:'People',label:'Golden age',cost:45,icon:'laurel',hint:'Tap a nation. It flourishes for 50 years: more growth, faster research and grander towns.'},
  {id:'hero',tab:'People',label:'Hero',cost:40,icon:'shield',hint:'Tap a nation. A great hero is born who wins battles and leads the nation to glory.'},
  {id:'faith',tab:'Faith',label:'Spread faith',cost:30,icon:'star',hint:'Tap a nation to convert it to the selected faith.'},
  {id:'prophet',tab:'Faith',label:'Prophet',cost:35,icon:'staff',hint:'Tap land. A prophet of the selected faith walks from town to town and converts the people. Watch for the column of light.'},
  {id:'miracle',tab:'Faith',label:'Miracle',cost:30,icon:'sparkle',hint:'Tap a nation. Epidemics and famine end at once, and faith in you jumps up.'},
  {id:'anoint',tab:'Faith',label:'Anoint ruler',cost:30,icon:'oil',hint:'Tap a nation. Its ruler becomes your chosen one: the realm steadies, faith in you grows and the ruler lives longer.'},
  {id:'schism',tab:'Faith',label:'Schism',cost:35,icon:'split',hint:'Tap a nation. Its faith splits: that nation and its neighbours form a new branch with a holy city of their own. Brother faiths often go to war.'},
  {id:'eclipse',tab:'Faith',label:'Eclipse',cost:25,icon:'eclipse',hint:'Tap anywhere. The sun goes dark: faithful nations pray, others panic, riot or go to war.'},
  {id:'reform',tab:'Rule',label:'Change rule',cost:30,icon:'crown',hint:'Tap a nation to choose its form of government.'},
  {id:'assassin',tab:'Rule',label:'Assassinate',cost:35,icon:'dagger',hint:'Tap a nation. Its ruler dies tonight. Without an heir, the throne is up for grabs.'},
  {id:'coup',tab:'Rule',label:'Coup',cost:45,icon:'helmet',hint:'Tap a nation. Its army overthrows the ruler and a general takes power. Expect a harder, more warlike realm.'},
  {id:'revolt',tab:'Rule',label:'Revolution',cost:50,icon:'fist',hint:'Tap a nation. The people rise up, depose the ruler and set up a new form of rule (Bronze Age and later).'},
  {id:'spark',tab:'Rule',label:'Spark revolt',cost:35,icon:'torch',hint:'Tap a town (not a capital). It rises up and declares independence.'},
  {id:'ally',tab:'Rule',label:'Alliance',cost:20,icon:'link',hint:'Tap one nation, then another, to bind them in alliance. Tap two allies to break it.'},
  {id:'peace',tab:'Rule',label:'Force peace',cost:15,icon:'dove',hint:'Tap a nation to end all of its wars.'},
  {id:'war',tab:'Strife',label:'Incite war',cost:25,icon:'swords',hint:'Tap the attacker, then its target.'},
  {id:'discord',tab:'Strife',label:'Sow discord',cost:25,icon:'whisper',hint:'Tap a nation. Nobles plot and crowds gather: stability falls for years, and riots, coups or civil war may follow.'},
  {id:'nuke',tab:'Strife',label:'Atomic strike',cost:100,icon:'atom',hint:'Tap a town. A nation at war with it that has the bomb (Modern age, Atomic Power) drops it there. The city is destroyed and the land poisoned for decades.'},
  {id:'pirates',tab:'Strife',label:'Send pirates',cost:30,icon:'skull',hint:'Tap a coastal town. Pirates set sail to plunder it.'},
  {id:'kraken',tab:'Strife',label:'Sea monster',cost:50,icon:'tentacle',hint:'Tap the sea. A kraken wakes and drags ships under, pirates too. Steel warships can wound it.'},
  {id:'locusts',tab:'Strife',label:'Locusts',cost:30,icon:'bug',hint:'Tap land. A swarm of locusts drifts over the land and eats the fields of every nation it crosses.'},
  {id:'plague',tab:'Strife',label:'Epidemic',cost:35,icon:'skull',hint:'Tap a nation. A new disease breaks out and can spread to its neighbours.'},
  {id:'famine',tab:'Strife',label:'Famine',cost:30,icon:'wheat',hint:'Tap a nation. Its harvests fail for years.'},
  {id:'quake',tab:'Strife',label:'Earthquake',cost:40,icon:'quake',hint:'Tap a nation. A town crumbles and the people scatter.'},
  {id:'raise',tab:'Land',label:'Raise land',cost:0,icon:'up',hint:'Drag to lift the land and pull new coasts from the sea.'},
  {id:'lower',tab:'Land',label:'Lower land',cost:0,icon:'down',hint:'Drag to sink the land and carve bays.'},
  {id:'smooth',tab:'Land',label:'Smooth',cost:0,icon:'smooth',hint:'Drag to soften hills and fill hollows.'},
  {id:'fertile',tab:'Land',label:'Fertile land',cost:20,icon:'sprout',hint:'Tap desert, steppe or sand. It turns into green grassland.'},
  {id:'forest',tab:'Land',label:'Plant forest',cost:15,icon:'tree',hint:'Tap land to grow new woodland.'},
  {id:'flood',tab:'Land',label:'River flood',cost:30,icon:'waves',hint:'Tap near a river. It bursts its banks: towns on the water suffer, but the fields grow rich.'},
  {id:'wildfire',tab:'Land',label:'Wildfire',cost:25,icon:'fire',hint:'Tap a forest or grassland. The fire spreads with the wind and the drought.'},
  {id:'volcano',tab:'Land',label:'Volcano',cost:80,icon:'volcano',hint:'Tap to tear open a burning mountain.'},
  {id:'rain',tab:'Sky',label:'Rain',cost:10,icon:'rain',hint:'Tap to soak a region. Deserts turn green for a while.'},
  {id:'drought',tab:'Sky',label:'Drought',cost:10,icon:'drought',hint:'Tap to dry a region out.'},
  {id:'storm',tab:'Sky',label:'Thunderstorm',cost:20,icon:'bolt',hint:'Tap to summon a storm. Lightning can start fires and sink ships.'},
  {id:'hurricane',tab:'Sky',label:'Hurricane',cost:60,icon:'cyclone',hint:'Tap the sea or a coast. The hurricane drifts in and wrecks what it crosses.'},
  {id:'meteor',tab:'Sky',label:'Meteor',cost:60,icon:'meteor',hint:'Tap to strike. Leaves a crater and ruin.'},
  {id:'climate',tab:'Sky',label:'Climate',cost:40,icon:'thermo',hint:'Tap anywhere, then choose a warmer or colder world. Sea level and snow lines shift.'}];
Object.assign(ICON,{
  walk:'<circle cx="13" cy="4" r="2"/><path d="M9 21l2-6 3 3v3M11 15l1-5 3 3 3 1M12 10l-4 2-1 3"/>',
  laurel:'<path d="M12 20V9M8 20c-4-3-5-8-3-12M16 20c4-3 5-8 3-12M5 12l3 1M4 8l3 2M19 12l-3 1M20 8l-3 2M9 4h6l-1 4h-4z"/>',
  shield:'<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M12 7v10M8.5 11h7"/>',
  staff:'<path d="M8 21L15 4"/><circle cx="16" cy="4" r="2"/><path d="M12 4c-2 1-2 3 0 4"/>',
  sparkle:'<path d="M12 3v6M12 15v6M3 12h6M15 12h6M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3"/>',
  eclipse:'<circle cx="12" cy="12" r="7"/><path d="M12 5a7 7 0 010 14" fill="currentColor"/><path d="M12 1v2M12 21v2M1 12h2M21 12h2"/>',
  torch:'<path d="M10 22h4l1-11H9zM12 11c-3-2-2-5 0-8 2 3 3 6 0 8z"/>',
  tentacle:'<path d="M5 21c0-6 4-7 6-10s0-6-3-6M12 21c0-5 3-6 5-8s1-5-2-5M3 21h18"/><circle cx="8.5" cy="7" r=".8"/>',
  bug:'<ellipse cx="12" cy="13" rx="4" ry="6"/><path d="M12 7V4M9 4l3 3 3-3M8 11H4M8 15H4l-1 3M16 11h4M16 15h4l1 3"/>',
  sprout:'<path d="M12 21v-9M12 12c0-4-3-6-7-6 0 4 3 6 7 6zM12 14c0-3 3-5 7-5 0 3-3 5-7 5zM5 21h14"/>',
  tree:'<path d="M12 21v-5M12 3l6 9h-3l4 4H5l4-4H6z"/>',
  waves:'<path d="M3 9c3-2 6 2 9 0s6 2 9 0M3 14c3-2 6 2 9 0s6 2 9 0M3 19c3-2 6 2 9 0s6 2 9 0"/>',
  hand:GLYPHS.hand,
  atom:'<circle cx="12" cy="12" r="1.6" fill="currentColor"/><ellipse cx="12" cy="12" rx="9" ry="3.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(-60 12 12)"/>',
  split:'<path d="M12 21v-7M12 14L6 8M12 14l6-6M6 8V4M18 8V4M4 6h4M16 6h4"/>',
  thermo:'<path d="M10 14V5a2 2 0 014 0v9a4 4 0 11-4 0zM12 9v7"/><path d="M17 6h3M17 10h3"/>'});
const TABS=['People','Faith','Rule','Strife','Land','Sky'];
let curTab='People',sheetPanel=null,shakeT=0,treesDirty=true;

/* ---------- small helpers ---------- */
const hintEl=$('#hint');let hintTimer=0;
function toolHint(){const p=POWERS.find(p=>p.id===tool);hintEl.className='glass hint';hintEl.textContent=p.hint}
function say(msg,sticky){clearTimeout(hintTimer);hintEl.className='glass hint alert';hintEl.textContent=msg;if(!sticky)hintTimer=setTimeout(toolHint,3500)}
function toast(title,text,x,z){const t=document.createElement('div');t.className='glass toast'+(x!=null?' go':'');t.innerHTML=`<b>${esc(title)}</b><span>${esc(text)}</span>`;if(x!=null)t.onclick=()=>{focusOn(x,z,10);t.remove()};$('#toasts').appendChild(t);
  setTimeout(()=>t.remove(),5200);while($('#toasts').children.length>3)$('#toasts').firstChild.remove()}
function log(text,kind){logs.unshift({year,text,kind});if(typeof onLogSound==='function')onLogSound(kind,text);if(logs.length>120)logs.pop()}
/* the great powers cost more, so a god has to choose */
const costOf=c=>c>=40?Math.round(c*1.35/5)*5:c>=25?Math.round(c*1.15/5)*5:c;
for(const p of POWERS)p.cost=costOf(p.cost);
function spend(c){c=costOf(c);if(unlimited)return true;if(belief<c){say(`Not enough belief. This needs ${c}, you have ${Math.floor(belief)}.`);return false}belief-=c;return true}
function fx(i,kind){const x=wx(i%W),z=wz((i/W)|0);effects.push({x,y:surfY(x,z),z,kind,t0:performance.now()})}
function brush(i,r,fn){const x=i%W,y=(i/W)|0,R_=Math.ceil(r);for(let dy=-R_;dy<=R_;dy++)for(let dx=-R_;dx<=R_;dx++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const d=Math.hypot(dx,dy);if(d<=r)fn(Y*W+X,d)}}
function burst(i,kind,n,spread){const x=wx(i%W),z=wz((i/W)|0);for(let k=0;k<n;k++){const px=x+(rng()-.5)*spread,pz=z+(rng()-.5)*spread;emit(kind,px,surfY(px,pz)+.03,pz)}}
const needNation=n=>{if(!n){say("Tap inside a nation's borders.");return false}return true};

/* ---------- powers ---------- */
function applyTool(i,start){if(viewOnly&&tool!=='inspect'){if(start)say('You are watching a shared world. Nothing here can be changed.');return}if(typeof rewind!=='undefined'&&rewind){if(start)say('You are looking at the past. Press Back to now first.');return}
  if(i<0)return;if(typeof coopGuest==='function'&&coopGuest()&&!COOP_LOCAL.has(tool)){coopCmd(i,start);return}
  const o=owner[i],n=o>=0?nations[o]:null;
  if(tool==='raise'||tool==='lower'){const s=tool==='raise'?1:-1;brush(i,2.6,(j,d)=>{h[j]=clamp(h[j]+s*.022*(1-d/3),0,1)});terrainDirty=true;if(rng()<.3)burst(i,'dust',2,1.5);return}
  if(tool==='smooth'){const nh=[];brush(i,2.6,(j,d)=>{let s=0,c=0;brush(j,1,(k)=>{s+=h[k];c++});nh.push([j,lerp(h[j],s/c,.35*(1-d/3))])});for(const [j,v] of nh)h[j]=v;terrainDirty=true;return}
  if(!start)return;
  if(tool!=='inspect')sfx(tool==='bless'?'bless':'power');
  switch(tool){
  case 'inspect':selected=o;inspectTile=i;bordersDirty=true;bordersUrgent=true;renderNationCard();break;
  case 'rain':case 'drought':{if(!spend(10))return;const v=tool==='rain'?.45:-.45;brush(i,7,(j,d)=>{moistD[j]=clamp(moistD[j]+v*(1-d/7.5),-.6,.6)});moistActive=320;terrainDirty=true;fx(i,tool);
    if(tool==='drought')burst(i,'dust',14,6);log(tool==='rain'?'You opened the skies. Rain soaks the land.':'You withheld the rain. The land cracks.','sky');break}
  case 'tribe':if(o>=0||hab[i]<.1){say('Pick empty land that people can live on.');return}
    if(!spend(15))return;{const t=newNation(i%W,(i/W)|0,{});selected=t.id;fx(i,'bless');log(`The ${t.name} gathered at your call.`,'life');propsDirty=true;renderNationCard()}break;
  case 'festival':if(!needNation(n)||!spend(20))return;holdFestival(n,true);fx(i,'bless');sfx('chime');break;
  case 'bless':if(!needNation(n)||!spend(20))return;n.bless=30;n.devotion=clamp((n.devotion??.3)+.08,0,1);fx(i,'bless');log(`You blessed ${n.name}.`,'life');break;
  case 'inspire':if(!needNation(n)||!spend(25))return;n.inspire=20;n.devotion=clamp((n.devotion??.3)+.05,0,1);fx(i,'faith');log(`You inspired the scholars of ${n.name}.`,'era');break;
  case 'plague':if(!needNation(n))return;if(n.sick){say(`${n.name} is already sick with the ${n.sick.name}.`);return}if(!spend(35))return;startEpidemic(n,true);n.pop*=.92;n.devotion=clamp((n.devotion??.3)-.12,0,1);fx(i,'plague');break;
  case 'famine':if(!needNation(n))return;if(n.famine>0){say(`${n.name} is already starving.`);return}if(!spend(30))return;startFamine(n,'god',true);n.devotion=clamp((n.devotion??.3)-.12,0,1);fx(i,'drought');break;
  case 'wildfire':{if(!FUEL[biome[i]]){say('Nothing here will burn. Tap a forest or grassland.');return}if(!spend(25))return;if(!startWildfire(i,true))say('That ground has already burned.');break}
  case 'storm':{if(!spend(20))return;spawnStorm('thunder',wx(i%W),wz((i/W)|0),true);break}
  case 'hurricane':{if(!spend(60))return;spawnStorm('hurricane',wx(i%W),wz((i/W)|0),true);break}
  case 'quake':{if(!needNation(n)||!spend(40))return;earthquake(n,true);n.devotion=clamp((n.devotion??.3)-.1,0,1);break}
  case 'faith':if(selectedFaith<0){say('Found a faith first in the Faiths panel.');openSheet('faiths');return}
    if(!needNation(n))return;if(n.faith===selectedFaith){say(`${n.name} already follows ${faiths[selectedFaith].name}.`);return}
    if(!spend(30))return;n.faith=selectedFaith;fx(i,'faith');propsDirty=true;{const f=faiths[selectedFaith];if(!f.holy&&n.cities[0]){f.holy=n.cities[0].name;log(`${n.cities[0].name} became the holy city of ${f.name}.`,'faith')}}log(`${n.name} embraced ${faiths[selectedFaith].name}.`,'faith');break;
  case 'peace':if(!needNation(n))return;if(!n.wars.size){say(`${n.name} is not at war.`);return}
    if(!spend(15))return;for(const b of [...n.wars])makePeace(n,nations[b],true);fx(i,'bless');break;
  case 'war':if(!needNation(n))return;
    if(warFrom<0||!nations[warFrom].alive){warFrom=n.id;say(`Now tap the nation that ${n.name} should attack.`,true);return}
    if(n.id===warFrom){say('A nation cannot fight itself. Tap another one.',true);return}
    if(nations[warFrom].wars.has(n.id)){say('They are already at war.');warFrom=-1;return}
    if(!spend(25))return;startWar(nations[warFrom],n,'god');fx(i,'war');warFrom=-1;toolHint();break;
  case 'ally':if(!needNation(n))return;
    if(warFrom<0||!nations[warFrom].alive){warFrom=n.id;say(`Now tap the nation that ${n.name} should ally with.`,true);return}
    if(n.id===warFrom){say('Tap a different nation.',true);return}
    {const A=nations[warFrom];if(allied(A,n)){if(!spend(10))return;breakAlliance(A,n,true);fx(i,'war')}else{if(!spend(20))return;ally(A,n,true);fx(i,'bless')}}warFrom=-1;toolHint();break;
  case 'pirates':{if(!needNation(n))return;const cs=n.cities.filter(c=>coastWater(c).length);if(!cs.length){say(`${n.name} has no towns on the coast.`);return}
    const tx=i%W,ty=(i/W)|0;cs.sort((a,b)=>Math.hypot(a.x-tx,a.y-ty)-Math.hypot(b.x-tx,b.y-ty));if(!spend(30))return;if(!coves.length)foundCove();
    spawnPirate(null,0,{n,c:cs[0]});log(`At your call, pirates set sail for ${cs[0].name}.`,'war');fx(i,'war');break}
  case 'reform':if(!needNation(n))return;openGov(n);break;
  case 'migrate':{if(!migrFrom){if(!needNation(n))return;const c=nearestTown(n,i);if(!c){say(`${n.name} has no town.`);return}migrFrom={n,c};fx(c.y*W+c.x,'bless');say(`You hold a band of settlers from ${c.name}. Now tap empty land to set them down.`,true);return}
    const A=migrFrom.n;if(!A.alive||!A.cities.includes(migrFrom.c)){migrFrom=null;say('That town is gone. Pick another.');return}
    if(!unlimited&&belief<20){say('Not enough belief. This needs 20.');return}const err=migrate(A,migrFrom.c,i);if(err){say(err,true);return}spend(20);migrFrom=null;toolHint();break}
  case 'carry':{if(!carry){carryPick(i);return}if(!unlimited&&belief<25){say('Not enough belief. This needs 25.');return}if(carryDrop(i)){spend(25);toolHint()}break}
  case 'nuke':{if(!needNation(n))return;const c=nearestTown(n,i);const A=[...n.wars].map(id=>nations[id]).find(m=>m&&m.alive&&hasBomb(m));
    if(!A){say(`No nation with the bomb is at war with ${n.name}.`);return}if(!c){say(`${n.name} has no towns.`);return}if(!spend(100))return;nuke(A,n,c,true);break}
  case 'golden':if(!needNation(n))return;if(n.golden>year){say(`${n.name} is already in a golden age.`);return}if(!spend(45))return;goldenAge(n);fx(i,'bless');sfx('chime');break;
  case 'hero':if(!needNation(n))return;if(heroOf(n)){say(`${n.name} already has a hero: ${heroOf(n).name}.`);return}if(!spend(40))return;raiseHero(n);fx(i,'bless');break;
  case 'miracle':if(!needNation(n)||!spend(30))return;miracle(n);fx(i,'bless');sfx('chime');break;
  case 'prophet':{const f=selectedFaith>=0?selectedFaith:n&&n.faith>=0?n.faith:-1;if(f<0){say('Found a faith first in the Faiths panel.');openSheet('faiths');return}
    if(isWater(i)){say('Tap land. The prophet walks.');return}if(!spend(35))return;spawnProphet(i,f);fx(i,'faith');break}
  case 'schism':{if(!needNation(n))return;if(n.faith<0){say(`${n.name} follows no faith yet.`);return}if(followersOf(n.faith).length<2){say(`Only ${n.name} follows ${faiths[n.faith].name}. A schism needs at least two nations.`);return}
    if(!spend(35))return;const ni=schism(n.faith,n,true);if(ni>=0){selectedFaith=ni;fx(i,'faith')}break}
  case 'eclipse':if(eclipseT>0){say('The sun is already dark.');return}if(!spend(25))return;eclipse();break;
  case 'spark':{if(!needNation(n))return;const c=nearestTown(n,i);if(!c||c===n.cities[0]||n.cities.length<2){say('Tap a town that is not the capital.');return}if(!spend(35))return;sparkRevolt(n,c);fx(c.y*W+c.x,'war');break}
  case 'kraken':if(!isWater(i)){say('Tap the open sea.');return}if(!spend(50))return;spawnKraken(i);fx(i,'war');shakeT=.4;break;
  case 'locusts':if(isWater(i)){say('Tap land.');return}if(!spend(30))return;spawnLocusts(i);break;
  case 'fertile':{if(isWater(i)){say('Tap land.');return}if(!spend(20))return;const r=fertileLand(i);fx(i,'rain');if(!r.n){say(r.cold?'Too cold to bloom here. Warm the climate first.':'This land is already green.');if(!unlimited)belief+=20;return}log('At your touch the dry land turned green.','life');break}
  case 'forest':{if(isWater(i)){say('Tap land.');return}if(!spend(15))return;const k=plantForest(i);if(!k){say('Nothing can grow here.');if(!unlimited)belief+=15;return}fx(i,'bless');log('A new forest sprang up at your word.','life');break}
  case 'flood':{if(!unlimited&&belief<30){say('Not enough belief. This needs 30.');return}const k=riverFlood(i);if(!k){say('Tap close to a river.');return}spend(30);fx(i,'rain');break}
  case 'climate':if(scen()&&scen().id==='climate'){say('In this scenario you cannot cool the world yourself. Guide the nations instead.');return}openModal(`<h2>Climate</h2><p class="note">Change the whole world. A warmer world melts the ice and raises the seas, so low coasts can drown. A colder world grows glaciers and lowers the seas. Each step costs ${costOf(40)} belief.</p>
    <div class="row" style="gap:8px;margin-top:10px"><button class="btn" data-clim="-1">❄ Colder</button><button class="btn primary" data-clim="1">☀ Warmer</button><button class="btn" data-clim="0">Cancel</button></div>`);break;
  case 'anoint':{if(!needNation(n))return;const r=rulerOf(n);if(!r||r.machine){say(`${n.name} has no ruler you can anoint.`);return}if(r.traits.includes('anointed')){say(`${r.name} is already your chosen one.`);return}
    if(!spend(30))return;anoint(n);fx(i,'bless');sfx('chime');break}
  case 'assassin':{if(!needNation(n))return;const r=rulerOf(n);if(!r||r.machine){say(`There is no one to strike down in ${n.name}.`);return}if(!spend(35))return;assassinate(n);fx(i,'war');break}
  case 'coup':if(!needNation(n)||!spend(45))return;coup(n,true);fx(i,'war');break;
  case 'revolt':if(!needNation(n))return;if(n.era<2){say(`${n.name} is too young for revolution. It needs the Bronze Age.`);return}if(!spend(50))return;revolution(n,true);fx(i,'war');break;
  case 'discord':if(!needNation(n))return;if(n.discord>0){say(`Discord already runs through ${n.name}.`);return}if(!spend(25))return;sowDiscord(n);fx(i,'plague');break;
  case 'meteor':{if(!spend(60))return;const hit=new Set();
    brush(i,4.5,(j,d)=>{h[j]=clamp(h[j]-.2*(1-d/5),0,1);if(owner[j]>=0){hit.add(owner[j]);if(d<=2.2)claim(j,-1)}});
    for(const id of hit)nations[id].pop*=.8;terrainDirty=true;fx(i,'meteor');shakeT=.7;burst(i,'fire',24,2);burst(i,'dark',30,3);
    log(hit.size?`A star fell upon ${[...hit].map(k=>nations[k].name).join(' and ')}.`:'A star fell into the wild lands.','doom');break}
  case 'volcano':if(!spend(80))return;eruptVolcano(i,true);shakeT=.9;fx(i,'meteor');break;
  }
}
function powerOnNation(n,id){const c=n.cities[0];if(!c)return;const prev=tool;tool=id;applyTool(c.y*W+c.x,true);if(id!=='war'&&id!=='ally')tool=prev;else setTool(id)}

/* ---------- dock ---------- */
function buildDock(){$('#ptabs').innerHTML=TABS.map(t=>`<button class="ib" role="tab" data-tab="${t}" aria-pressed="${t===curTab}">${t}</button>`).join('');renderCards()}
function renderCards(){const list=POWERS.filter(p=>p.tab==='*'||p.tab===curTab);
  $('#cards').innerHTML=list.map(p=>`<button class="pc${!unlimited&&p.cost>belief?' poor':''}" data-tool="${p.id}" aria-pressed="${p.id===tool}">${svg(p.icon)}<b>${p.label}</b><small>${p.cost?p.cost+' belief':'Free'}</small></button>`).join('')}
function setTool(id){tool=id;if(id!=='carry')carry=null;if(id!=='war'&&id!=='ally')warFrom=-1;if(id!=='migrate')migrFrom=null;renderCards();toolHint()}
$('#ptabs').onclick=e=>{const b=e.target.closest('[data-tab]');if(!b)return;curTab=b.dataset.tab;buildDock()};
$('#cards').onclick=e=>{const b=e.target.closest('[data-tool]');if(b)setTool(b.dataset.tool)};

/* ---------- nation card ---------- */
function renderNationCard(){
  const el=$('#nationCard'),n=selected>=0?nations[selected]:null;
  if(!n&&inspectTile<0){el.hidden=true;return}el.hidden=false;
  if(!n){const b=BIOMES[biome[inspectTile]],hgt=Math.round((h[inspectTile]-sea)*900);
    el.innerHTML=`<div class="nc-head"><h3>${b.n}</h3><button class="ib x" data-x aria-label="Close">✕</button></div><div class="kv"><div><span>Fertility</span><b>${Math.round(b.hab*100)}%</b></div><div><span>Height</span><b>${hgt} m</b></div><div><span>Owner</span><b>Nobody</b></div></div>`;return}
  const wars=[...n.wars].map(b=>nations[b].name),fleet=ships.filter(s=>s.owner===n.id&&!s.sink).length;
  const rt=n.research?TECH[n.research]:null,pct=rt?clamp(n.tech/TECHCOST[rt.era],0,1):1;
  const st=stabOf(n),sp=stabParts(n).sort((p,q)=>Math.abs(q[1])-Math.abs(p[1])),stTip=sp.map(p=>`${p[0]} ${p[1]>0?'+':''}${Math.round(p[1]*100)}`).join('\n');
  el.innerHTML=`<div class="nc-head">${flagImg(n,'flag big')}<div><h3>${esc(n.name)}</h3>
    <span class="tag">${n.alive?ERAS[n.era].name:'Fallen'}</span> ${wars.length?'<span class="tag war">At war</span>':''} ${n.bless>0?'<span class="tag">Blessed</span>':''} ${n.golden>year?'<span class="tag gold">Golden age</span>':''} ${heroOf(n)?`<span class="tag gold">Hero ${esc(heroOf(n).name)}</span>`:''} ${n.famine>0?'<span class="tag war">Famine</span>':''} ${n.sick?`<span class="tag war">${esc(n.sick.name)}</span>`:''}</div>
    <button class="ib x" data-x aria-label="Close">✕</button></div>
    ${(()=>{const r=rulerOf(n);if(!r||!n.alive)return '';const rg=n.reigns[n.reigns.length-1];return `<button class="ruler" data-q="court">${portrait(r,n,42)}<span><b>${esc(titleOf(n,r))} ${esc(reignName(n,rg))}</b><small>${r.machine?'Ruling since '+rg.from:`${r.house!=null?'House '+esc(houseName(r.house))+' · ':''}age ${ageOf(r)} · ${r.traits.map(t=>TRAITS[t].label).join(', ')}`}</small></span><span class="lab">Court</span></button>`})()}
    <div><div class="row" style="justify-content:space-between"><span class="lab">${rt?'Researching '+rt.name+(rt.key?' · opens '+ERAS[rt.key].name:''):'All known discoveries made'}</span><span class="lab">${rt?Math.round(pct*100)+'%':''}</span></div><div class="prog"><i style="width:${pct*100}%"></i></div></div>
    <div class="kv"><div><span>People</span><b>${people(n)}</b></div><div><span>Lands</span><b>${n.tiles}</b></div>
    <div><span>Cities</span><b>${n.cities.length}</b></div><div><span>Fleet</span><b>${fleet}</b></div>
    <div><span>Rule</span><b>${GOVS[n.gov]?GOVS[n.gov].name:'None'}</b></div><div><span>Faith</span><b>${n.faith>=0?esc(faiths[n.faith].name):'Ancestors'}</b></div><div><span>Temper</span><b>${n.aggr>.65?'Warlike':n.aggr>.4?'Wary':'Calm'}</b></div>
    <div><span>Capital</span><b>${n.cities[0]?esc(n.cities[0].name):'None'}</b></div><div><span>Wonder</span><b>${n.wonder?esc(WONDERS[n.wonder].name):'None'}</b></div></div>
    ${wars.length?`<p class="note"><b style="color:#f0a196">Fighting:</b> ${esc(wars.join(', '))}</p>`:''}
    <div title="${esc(stTip)}"><div class="row" style="justify-content:space-between"><span class="lab">Stability · ${stabLabel(st)}</span><span class="lab">${sp.slice(0,2).map(p=>`${esc(p[0])} ${p[1]>0?'+':''}${Math.round(p[1]*100)}`).join(' · ')}</span></div><div class="prog"><i style="width:${st*100}%;background:${stabColor(st)}"></i></div></div>
    <div><div class="row" style="justify-content:space-between"><span class="lab">Faith in you</span><span class="lab">${Math.round((n.devotion??.3)*100)}%${n.cities.filter(c=>c.statue).length?' · '+n.cities.filter(c=>c.statue).length+' statues':''}${n.festival>0?' · festival':''}</span></div><div class="prog"><i style="width:${(n.devotion??.3)*100}%;background:#e8c060"></i></div></div>
    ${resourceLine(n)}<p class="note">${esc(CULTURES[cultOf(n)].label)} culture${n.allies&&n.allies.length?` · <b style="color:#9ec8f0">Allies:</b> ${esc(n.allies.map(i=>nations[i].name).join(', '))}`:''}</p>
    ${n.trade&&n.trade.length?`<p class="note"><b style="color:#a9dba5">Trading with:</b> ${esc(n.trade.map(i=>nations[i].name).join(', '))}</p>`:''}
    ${n.alive?`<div class="quick"><button class="ib" data-q="follow">Follow</button><button class="ib" data-q="bless">Bless</button><button class="ib" data-q="festival">Festival</button><button class="ib" data-q="ally">Ally</button><button class="ib" data-q="inspire">Inspire</button><button class="ib" data-q="faith">Faith</button><button class="ib" data-q="gov">Rule</button><button class="ib" data-q="tech">Tech</button><button class="ib" data-q="war">War</button>${wars.length?'<button class="ib" data-q="peace">Peace</button>':''}</div>`:''}`;
}
$('#nationCard').onclick=e=>{if(e.target.closest('[data-x]')){selected=-1;inspectTile=-1;bordersDirty=true;renderNationCard();return}
  const q=e.target.closest('[data-q]');if(!q)return;const n=nations[selected];if(!n)return;const a=q.dataset.q;
  if(a==='follow'){const c=n.cities[0];if(c)focusOn(wx(c.x),wz(c.y),9);return}
  if(a==='gov'){openGov(n);return}
  if(a==='tech'){openTech(n);return}
  if(a==='court'){openCourt(n);return}
  if(a==='war'){warFrom=n.id;setTool('war');curTab='Strife';buildDock();say(`Now tap the nation that ${n.name} should attack.`,true);return}
  if(a==='ally'){warFrom=n.id;setTool('ally');curTab='Rule';buildDock();say(`Now tap the nation that ${n.name} should ally with (or an ally to break with).`,true);return}
  powerOnNation(n,a);renderNationCard()};

/* ---------- side sheet ---------- */
const SHEETS={nations:'Nations',faiths:'Faiths',wars:'Wars and Relations',world:'World',chronicle:'Chronicle'};
let natSort='pop';
function openSheet(p){if(sheetPanel===p){closeSheet();return}sheetPanel=p;$('#sheet').hidden=false;$('#sheetTitle').textContent=SHEETS[p];
  $$('[data-panel]').forEach(b=>b.classList.toggle('on',b.dataset.panel===p));renderSheet(true)}
function closeSheet(){sheetPanel=null;$('#sheet').hidden=true;$$('[data-panel]').forEach(b=>b.classList.remove('on'))}
$$('[data-panel]').forEach(b=>b.onclick=()=>{if(spaceView)closeSpace();openSheet(b.dataset.panel)});$('#spaceBtn').onclick=()=>spaceView?closeSpace():openSpace(colonies.some(c=>c.planet==='mars')&&!colonies.some(c=>c.planet==='moon')?'mars':'moon');$('#sheetX').onclick=closeSheet;
function renderSheet(full){const B=$('#sheetBody');if(!sheetPanel)return;
  if(sheetPanel==='nations'){if(full)B.innerHTML=`<div class="seg" id="natSort"><button data-s="pop">People</button><button data-s="tiles">Land</button><button data-s="tech">Progress</button></div><p class="note" id="natCount"></p><ul class="list" id="natList"></ul>`;
    $$('#natSort button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.s===natSort));
    const sk=n=>natSort==='tech'?n.era*100+(n.techs?n.techs.length:0):n[natSort];const alive=nations.filter(n=>n.alive).sort((a,b)=>sk(b)-sk(a));
    $('#natCount').textContent=`${alive.length} living · ${nations.length-alive.length} fallen · ${ships.length} ships at sea`;
    $('#natList').innerHTML=alive.map(n=>`<li><button data-id="${n.id}" class="${n.id===selected?'sel':''}">${flagImg(n,'flag')}
      <span class="nm">${esc(n.name)} ${n.wars.size?'<span class="sword">⚔</span>':''}<small>${GOVS[n.gov]?GOVS[n.gov].name:ERAS[n.era].name} · ${n.faith>=0?esc(faiths[n.faith].name):'Ancestors'}</small></span><span class="pp">${fmtPop(n.pop)}<br>${n.tiles} lands</span></button></li>`).join('')}
  else if(sheetPanel==='faiths'){if(full)B.innerHTML=`<div class="sec"><button class="btn primary" id="newFaith">Reveal a new faith · ${costOf(40)} belief</button>
      <p class="note">Design it yourself: name, symbol, colour and two tenets. Followers give you belief.</p></div>
      <div class="sec"><h4>Your faiths</h4><div class="flist" id="faithList"></div><p class="note">Tap a faith, then tap a nation to spread it. Faiths also spread on their own between neighbours at peace.</p></div>`;
    $('#faithList').innerHTML=faiths.length?faiths.map((f,i)=>{const c=nations.filter(n=>n.alive&&n.faith===i),pop=c.reduce((s,n)=>s+n.pop,0);
      return `<button class="fcard" data-f="${i}" aria-pressed="${i===selectedFaith}"><span class="fg" style="background:${f.color}">${glyph(f.glyph,'#fff')}</span>
        <span class="nm">${esc(f.name)}<small>${(f.tenets||[f.tenet]).map(t=>TENETS[t].label).join(' · ')}${f.holy?' · Holy city '+esc(f.holy):''}${f.parent!=null&&faiths[f.parent]?' · branch of '+esc(faiths[f.parent].name):''}</small></span>
        <span class="pp">${c.length} nations<br>${fmtPop(pop)}</span></button>`}).join(''):'<p class="note">None yet. Your first faith starts your flow of belief.</p>'}
  else if(sheetPanel==='wars'){if(full||performance.now()-warsAt>1500){warsAt=performance.now();B.innerHTML=`<div class="seg" id="warSeg"><button data-ws="wars" aria-pressed="${warTab==='wars'}">Wars</button><button data-ws="rel" aria-pressed="${warTab==='rel'}">Relations</button></div>`+(warTab==='wars'?warsHTML():relationsHTML())}}
  else if(sheetPanel==='world'){if(full)B.innerHTML=`<div class="sec"><h4>Climate</h4>
      <div class="slider"><div class="top"><label for="tempR">Global temperature</label><output id="tempO"></output></div><input type="range" id="tempR" min="0" max="100"></div>
      <div class="slider"><div class="top"><label for="rainR">Rainfall</label><output id="rainO"></output></div><input type="range" id="rainR" min="0" max="100"></div>
      <div class="kv"><div><span>Sea level</span><b id="seaO"></b></div><div><span>Time of day</span><b id="todO"></b></div></div>
      <p class="note">Factories in the Industrial and Modern ages warm the world. Warm seas rise and swallow coasts; cold freezes the poles.</p></div>
      <div class="sec"><h4>Pace of history</h4><div id="paceBox2"></div></div>
      <div class="sec"><h4>Disasters now</h4><div class="list" id="disList"></div></div>
      <div class="sec"><h4>State of the world</h4><div class="kv" id="worldStats"></div></div>
      <div class="sec"><h4>Look</h4><div class="looks" id="looks2"></div></div>`;
    if(full){renderPaceBox('#paceBox2');$('#tempR').value=Math.round(climate.temp*100);$('#rainR').value=Math.round(climate.rain*100);renderLooks('#looks2')}
    $('#tempO').textContent=(14+(climate.temp-.5)*24).toFixed(1)+' °C';$('#rainO').textContent=Math.round(40+climate.rain*120)+'%';
    const s=Math.round((sea-.44)*900);$('#seaO').textContent=(s>=0?'+':'')+s+' m';
    const hr=(dayT*24+6)%24;$('#todO').textContent=`${String(Math.floor(hr)).padStart(2,'0')}:${String(Math.floor(hr%1*60)).padStart(2,'0')}`;
    if(document.activeElement!==$('#tempR'))$('#tempR').value=Math.round(climate.temp*100);
    const al=nations.filter(n=>n.alive),cities=al.reduce((s,n)=>s+n.cities.length,0),won=al.filter(n=>n.wonder).length,wars=al.reduce((s,n)=>s+n.wars.size,0)/2;
    {const items=[];for(const S of storms)items.push({t:STORM_NAME[S.kind],d:(nationAt(S.x,S.z)||{}).name||'Open sea',x:S.x,z:S.z});
      if(fires.size){const [i]=fires.keys().next().value!=null?[fires.keys().next().value]:[0];items.push({t:'Wildfire',d:`${fires.size} lands burning`,x:wx(i%W),z:wz((i/W)|0)})}
      for(const n of al){const c=n.cities[0];if(!c)continue;if(n.famine>0)items.push({t:'Famine',d:`${n.name} · ${n.famine} years left`,x:wx(c.x),z:wz(c.y)});if(n.sick)items.push({t:n.sick.name,d:`Epidemic in ${n.name}`,x:wx(c.x),z:wz(c.y)})}
      $('#disList').innerHTML=items.length?items.slice(0,12).map(it=>`<button class="dis" data-go="${it.x.toFixed(2)},${it.z.toFixed(2)}"><span class="nm">${esc(it.t)}<small>${esc(it.d)}</small></span><span class="pp">Look</span></button>`).join(''):'<p class="note">All is calm, for now.</p>'}
    $('#worldStats').innerHTML=`<div><span>People</span><b>${fmtPop(al.reduce((s,n)=>s+n.pop,0))}</b></div><div><span>Cities</span><b>${cities}</b></div><div><span>Wars</span><b>${wars}</b></div><div><span>Wonders</span><b>${won}</b></div><div><span>Ships</span><b>${ships.length}</b></div><div><span>Faiths</span><b>${faiths.length}</b></div>`}
  else if(sheetPanel==='chronicle'){if(full)B.innerHTML=`<div class="sec row" style="gap:8px"><button class="btn primary" onclick="openBook()">Open the history book</button><button class="btn" onclick="startRewind()">Rewind the borders</button></div><div class="sec"><h4>Milestones</h4><div class="ms" id="msGrid"></div></div><div class="sec"><h4>Chronicle</h4><ul class="log" id="logList"></ul></div>`;
    $('#msGrid').innerHTML=MILESTONES.map(id=>{const m=milestoneInfo[id],done=milestones.has(id);const title=m?m.title:({city2:'A second city rises',war:'First war',faith:'A faith revealed',era1:'Bronze Age',era3:'Medieval',sail:'Across the sea',colony:'New World',wonder:'A wonder of the world',famine:'The hungry years',contact:'First contact',trade:'Merchants on the road',explore:'Uncharted shores',hurricane:'Eye of the storm',pandemic:'Pandemic',tsunami:'The great wave',era5:'Industrial',democracy:'The first vote',federation:'One world council',naval:'Naval battle',rebel:'Civil war',million:'A million souls',era7:'Future',stars:'To the stars'})[id];
      return `<div class="${done?'done':''}"><b>${esc(title)}</b>${done&&m?'Year '+m.year:'Not yet'}</div>`}).join('');
    $('#logList').innerHTML=logs.slice(0,80).map(l=>`<li><time>Y${l.year}</time><span class="k-${l.kind}">${esc(l.text)}</span></li>`).join('')}
}
/* ---------- every war being fought right now ---------- */
let warsAt=0,warTab='wars';
/* ---------- relations: who is allied, who trades, who hates whom ---------- */
function relationsHTML(){const al=nations.filter(n=>n.alive).sort((a,b)=>b.pop-a.pop);if(al.length<2)return '<p class="note">There is no one to deal with yet.</p>';
  const nm=n=>`<span class="wn"><img src="${flagURL(n.flag)}" alt=""><b style="color:${n.color}">${esc(n.name)}</b></span>`,chip=(m,cls,t)=>`<span class="rchip ${cls}" title="${t}" data-rel="${m.id}"><i style="background:${m.color}"></i>${esc(m.name)}</span>`;
  return `<p class="note" style="margin:2px 0 8px">Tap a name to see it on the map.</p><div class="rlegend"><span class="rchip war">at war</span><span class="rchip ally">allied</span><span class="rchip trade">trade</span><span class="rchip rival">rival</span><span class="rchip kin">same faith</span></div>`+al.map(n=>{
    const L=[];for(const m of al){if(m===n)continue;
      if(n.wars.has(m.id))L.push(chip(m,'war','At war'));else if(allied(n,m))L.push(chip(m,'ally','Allies'));
      if((n.trade||[]).includes(m.id))L.push(chip(m,'trade','Trade partners'));
      const rv=rivalry(n,m);if(rv>=1&&!n.wars.has(m.id))L.push(chip(m,'rival',`Rivals (${rv.toFixed(1)} of 5)`));
      if(n.faith>=0&&n.faith===m.faith&&!n.wars.has(m.id))L.push(chip(m,'kin','Same faith'))}
    return `<div class="war rel"><div class="wh">${nm(n)}<small style="margin-left:auto;opacity:.7">${GOVS[n.gov]?GOVS[n.gov].name:''}</small></div><div class="rlist">${L.join('')||'<span class="note">Keeps to itself.</span>'}</div></div>`}).join('')}const fmtN=v=>v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e4?Math.round(v/1e3)+'k':Math.round(v).toLocaleString('en-US');
function activeWars(){const out=[];for(const A of nations){if(!A.alive)continue;for(const bid of A.wars){const B=nations[bid];if(!B||!B.alive||A.id>B.id)continue;
    const w=warData[warKey(A,B)]||{score:0,years:0},ww=worldWars.find(x=>x.end==null&&((x.a.includes(A.id)&&x.b.includes(B.id))||(x.b.includes(A.id)&&x.a.includes(B.id))));
    const sieges=[];for(const [X,Y] of [[A,B],[B,A]])for(const c of Y.cities)if(c.siege>0&&c.besiegedBy===X.id)sieges.push({by:X,c});
    out.push({A,B,w,ww,sieges,heat:w.years+Math.abs(w.score)+sieges.length*5})}}return out.sort((a,b)=>(b.ww?1:0)-(a.ww?1:0)||b.heat-a.heat)}
function warFront(A,B){const f=A.front.find(i=>owner[i]===A.id||owner[i]===B.id)??B.front[0];if(f!=null)return f;const c=B.cities[0]||A.cities[0];return c?c.y*W+c.x:-1}
function warsHTML(){const L=activeWars();if(!L.length)return '<p class="note" style="padding:8px 4px">The world is at peace. No war is being fought.</p>';
  const nm=n=>`<span class="wn"><img src="${flagURL(n.flag)}" alt=""><b style="color:${n.color}">${esc(n.name)}</b></span>`;
  const wws=worldWars.filter(x=>x.end==null).map(x=>`<div class="wwbar">⚔ The ${ORD[x.n]||(x.n+1)+'th'} World War · since ${x.start} · ${x.a.length+x.b.length} nations</div>`).join('');
  return `<p class="note" style="margin:2px 0 8px">${L.length} war${L.length>1?'s':''} being fought. The bar shows who is winning.</p>${wws}`+L.map(({A,B,w,ww,sieges})=>{
    const s=clamp(w.score/24,-1,1),lead=w.score>3?A:w.score<-3?B:null;
    return `<div class="war"><div class="wh">${nm(A)}<i>vs</i>${nm(B)}</div>
      <div class="wbar"><span style="width:${(50+s*50).toFixed(1)}%;background:${A.color}"></span><span style="background:${B.color}"></span></div>
      <div class="wstat"><span>Since year ${w.start??year-w.years} · ${w.years} yr</span><span>${lead?esc(lead.name)+' is winning':'Neither side is winning'}</span></div>
      <div class="wstat"><span>Land taken: ${w.ta||0} / ${w.tb||0}</span><span>Dead: ${fmtN(w.da||0)} / ${fmtN(w.db||0)}</span></div>
      ${ww?`<div class="wtag">Part of the ${ORD[ww.n]||''} World War</div>`:''}
      ${sieges.map(x=>`<div class="wsiege">🏰 ${esc(x.by.name)} besieges ${esc(x.c.name)} · ${Math.round(Math.min(1,x.c.siege)*100)}%</div>`).join('')}
      <div class="row" style="gap:6px;margin-top:6px"><button class="btn" data-wgo="${A.id}-${B.id}">Show the front</button><div class="flex"></div><button class="btn primary" data-wpeace="${A.id}-${B.id}">Force peace · 15</button></div></div>`}).join('')}
$('#sheetBody').addEventListener('click',e=>{
  const ws=e.target.closest('[data-ws]');if(ws){warTab=ws.dataset.ws;renderSheet(true);return}
  const rl=e.target.closest('[data-rel]');if(rl){const m=nations[+rl.dataset.rel];if(m&&m.cities[0]){focusOn(wx(m.cities[0].x),wz(m.cities[0].y),Math.min(camDist,22));selected=m.id;renderNationCard()}return}
  const wg=e.target.closest('[data-wgo]');if(wg){const [a,b]=wg.dataset.wgo.split('-').map(Number),i=warFront(nations[a],nations[b]);if(i>=0){focusOn(wx(i%W),wz((i/W)|0),Math.min(camDist,16));fx(i,'war')}if(innerWidth<700)closeSheet();return}
  const wp=e.target.closest('[data-wpeace]');if(wp){const [a,b]=wp.dataset.wpeace.split('-').map(Number),p={a,b};if(typeof coopGuest==='function'&&coopGuest()){coopAct('peace',p);return}if(doAct('peace',p))renderSheet(true);return}
  const ns=e.target.closest('#natSort [data-s]');if(ns){natSort=ns.dataset.s;renderSheet(false);return}
  const nb=e.target.closest('#natList [data-id]');if(nb){selected=+nb.dataset.id;inspectTile=-1;bordersDirty=true;const c=nations[selected].cities[0];if(c)focusOn(wx(c.x),wz(c.y),Math.min(camDistT,16));renderNationCard();renderSheet(false);if(innerWidth<700)closeSheet();return}
  if(e.target.closest('#newFaith')){openFaithMaker();return}
  const fb=e.target.closest('#faithList [data-f]');if(fb){selectedFaith=+fb.dataset.f;curTab='People';buildDock();setTool('faith');renderSheet(false);if(innerWidth<700)closeSheet();return}
  const go=e.target.closest('[data-go]');if(go){const [x,z]=go.dataset.go.split(',').map(Number);focusOn(x,z,11);if(innerWidth<700)closeSheet();return}
  const lb=e.target.closest('#looks2 [data-look]');if(lb){applyLook(lb.dataset.look);renderLooks('#looks2')}});
$('#sheetBody').addEventListener('input',e=>{if(e.target.id==='tempR'){climate.temp=e.target.value/100;terrainDirty=true;renderSheet(false)}if(e.target.id==='rainR'){climate.rain=e.target.value/100;terrainDirty=true;renderSheet(false)}});
/* ---------- faith maker ---------- */
let draft=null;
function freeFaithName(){const used=new Set(faiths.map(f=>f.name)),free=FAITH_NAMES.filter(n=>!used.has(n));return free.length?free[(rng()*free.length)|0]:'Faith of '+genName(2,2)}
function chipsFor(o){return modList(o).map(m=>`<span class="mod ${m.good?'up':'down'}">${m.label} ${m.pct>0?'+':''}${m.pct}%</span>`).join('')}
function openFaithMaker(){if(faiths.length>=8){say('Eight faiths is the most this world can hold.');return}
  const used=new Set(faiths.map(f=>f.color));draft={name:freeFaithName(),glyph:Object.keys(GLYPHS)[(rng()*10)|0],color:FCOL.find(c=>!used.has(c))||FCOL[0],tenets:['harmony']};renderFaithMaker()}
function renderFaithMaker(){const d=draft,combo={};for(const k of MODKEYS)combo[k]=1;for(const t of d.tenets)for(const k of MODKEYS)if(TENETS[t][k]!=null)combo[k]*=TENETS[t][k];
  openModal(`<h2>Reveal a faith</h2>
  <div class="fprev"><span class="fg big" style="background:${d.color}">${glyph(d.glyph,'#fff')}</span><div><b id="fpName">${esc(d.name)}</b><div class="mods">${chipsFor(combo)||'<span class="note">Pick tenets below</span>'}</div></div></div>
  <div class="sec"><label class="lab" for="fmName">Name</label><div class="row"><input type="text" id="fmName" maxlength="28" value="${esc(d.name)}" style="flex:1"><button class="btn" data-fm="dice" aria-label="Suggest a name">Suggest</button></div></div>
  <div class="sec"><span class="lab">Symbol</span><div class="glyphs">${Object.keys(GLYPHS).map(k=>`<button data-fm="glyph" data-v="${k}" aria-pressed="${k===d.glyph}" aria-label="${k}">${glyph(k)}</button>`).join('')}</div></div>
  <div class="sec"><span class="lab">Colour</span><div class="row">${FCOL.map(c=>`<button class="swatch" data-fm="color" data-v="${c}" aria-pressed="${c===d.color}" style="background:${c}" aria-label="Colour ${c}"></button>`).join('')}</div></div>
  <div class="sec"><span class="lab">Tenets · pick two</span><div class="tenets">${Object.keys(TENETS).map(k=>`<button data-fm="tenet" data-v="${k}" aria-pressed="${d.tenets.includes(k)}"><b>${TENETS[k].label}</b><small>${TENETS[k].desc}</small></button>`).join('')}</div></div>
  <div class="row"><button class="btn" data-p="close">Cancel</button><div class="flex"></div><button class="btn primary" data-fm="found" ${d.tenets.length?'':'disabled'}>Reveal faith · 40 belief</button></div>`)}
/* actions that change the world from a dialog; in co-op a guest's choice runs on the host through these */
function doAct(k,p){
  if(k==='guide'){const n=nations[p.n];if(!n||!n.alive||!TECH[p.t]||!techAvailable(n,TECH[p.t])||!spend(10))return false;n.research=p.t;n.tech=0;n.guided=true;log(`You guided the scholars of ${n.name} towards ${TECH[n.research].name}.`,'era');return true}
  if(k==='gov'){const n=nations[p.n];if(!n||!n.alive||!govOptions(n).includes(p.g)||!spend(30))return false;setGov(n,p.g,true);if(n.cities[0])fx(n.cities[0].y*W+n.cities[0].x,'faith');return true}
  if(k==='peace'){const A=nations[p.a],B=nations[p.b];if(!A||!B||!A.alive||!B.alive||!A.wars.has(B.id)){say('That war is already over.');return false}if(!spend(15))return false;makePeace(A,B,true);delete warData[warKey(A,B)];const c=B.cities[0];if(c)fx(c.y*W+c.x,'bless');return true}
  if(k==='space'){return typeof spaceAction==='function'?spaceAction(p.a,p.k):false}
  if(k==='clim'){if(!p.d||!spend(40))return false;shiftClimate(p.d);return true}
  if(k==='found'){const name=String(p.name||'').trim().slice(0,40);if(!name){say('Give your faith a name first.');return -1}if(!spend(40))return -1;
    faiths.push({name,tenets:(p.tenets||[]).slice(0,2),glyph:p.glyph,color:p.color,founded:year,holy:null});
    log(`${p.by?p.by+' revealed':'You revealed'} a new faith: ${name}.`,'faith');milestone('faith','A faith revealed',`${name} spreads its first words.`);return faiths.length-1}
  return false}
function afterFound(idx,name){if(idx<0)return;selectedFaith=idx;curTab='People';buildDock();setTool('faith');say(`Now tap a nation to bring it ${name}. Its capital becomes the holy city.`,true);renderSheet(true);if(innerWidth<700)closeSheet()}
function faithMakerClick(b){const a=b.dataset.fm,v=b.dataset.v;const nm=$('#fmName');if(nm)draft.name=nm.value;
  if(a==='dice')draft.name=freeFaithName();
  if(a==='glyph')draft.glyph=v;if(a==='color')draft.color=v;
  if(a==='tenet'){const t=draft.tenets;if(t.includes(v))t.splice(t.indexOf(v),1);else{t.push(v);if(t.length>2)t.shift()}}
  if(a==='found'){const name=draft.name.trim();if(!name){say('Give your faith a name first.');return}const p={name,tenets:draft.tenets.slice(),glyph:draft.glyph,color:draft.color};
    if(typeof coopGuest==='function'&&coopGuest()){coopAct('found',p);closeModal();say('Your faith is being revealed…');return}
    const idx=doAct('found',p);if(idx<0)return;closeModal();afterFound(idx,name);return}
  renderFaithMaker()}

/* ---------- court: ruler, family, dynasty, governors ---------- */
function personCard(p,n,extra){if(!p)return '';const a=ageOf(p);
  return `<div class="pcard${p.died!=null?' dead':''}">${portrait(p,n,48)}<div><b>${esc(p.name)}</b><small>${p.died!=null?`Died ${p.died} at ${a}${p.cause?' of '+esc(p.cause):''}`:`Age ${a}`}${extra?' · '+extra:''}</small><small>${p.traits.map(t=>TRAITS[t]?TRAITS[t].label:t).join(', ')}</small></div>${p.died==null?`<button class="ib" data-follow="${p.id}">Follow</button>`:''}</div>`}
function openCourt(n){const r=rulerOf(n);if(!r)return;const rg=n.reigns[n.reigns.length-1],kind=SUCCESSION[n.gov];
  const mods=chipsFor(r.traits.reduce((o,t)=>{for(const k of MODKEYS)if(TRAITS[t][k]!=null)o[k]=(o[k]||1)*TRAITS[t][k];return o},{}));
  const sp=per(r.spouse),par=[per(r.father),per(r.mother)].filter(Boolean),kids=r.children.map(per).filter(Boolean).sort((a,b)=>a.born-b.born);
  const heir=kind==='blood'?heirOf(r):null,ties=(n.ties||[]).map(i=>nations[i]).filter(m=>m&&m.alive);
  const law={blood:'The eldest child inherits',vote:`Leaders are elected${TERM[n.gov]?' every '+TERM[n.gov]+' years':''}`,council:'A council chooses the next leader',machine:'The machine rules on'}[kind];
  openModal(`<div class="court-head">${portrait(r,n,88)}<div><h2>${esc(titleOf(n,r))} ${esc(reignName(n,rg))}</h2>
    <p class="note">${r.machine?`Has ruled ${esc(n.name)} since year ${rg.from}.`:`${r.house!=null?'House '+esc(houseName(r.house))+' · ':''}Age ${ageOf(r)} · Ruling ${esc(n.name)} since year ${rg.from}`}</p>
    <div class="mods">${r.traits.map(t=>`<span class="mod up" title="${TRAITS[t].desc}">${TRAITS[t].label}</span>`).join('')}</div><div class="mods">${mods}</div></div></div>
    <p class="note">${GOVS[n.gov].name}. ${law}.${ties.length?' Bound by marriage to '+esc(ties.map(m=>m.name).join(', '))+'.':''}</p>
    ${r.machine?'':`<div class="sec"><h4>Family</h4><div class="tree">
      ${par.length?`<div class="trow"><span class="lab">Parents</span>${par.map(p=>personCard(p,n)).join('')}</div>`:''}
      <div class="trow"><span class="lab">${sp?'Ruler and spouse':'Ruler'}</span>${personCard(r,n,'ruler')}${sp?personCard(sp,nations[sp.nation]||n,sp.nation!==n.id&&nations[sp.nation]?'from '+esc(nations[sp.nation].name):'spouse'):''}</div>
      ${kids.length?`<div class="trow"><span class="lab">Children</span>${kids.map(c=>personCard(c,n,heir&&c.id===heir.id?'<b style="color:var(--gold2)">heir</b>':'')).join('')}</div>`:'<p class="note">No children yet.</p>'}</div></div>`}
    <div class="sec"><h4>Rulers of ${esc(n.name)}</h4><ul class="log">${n.reigns.slice().reverse().slice(0,14).map(x=>`<li><time>${x.from}</time><span>${esc(x.title)} ${esc(reignName(n,x))}${x.to?' · until '+x.to:' · now'}${x.how==='crisis'?' · seized power':x.how==='elected'?' · elected':x.how==='rebel'?' · led the revolt':''}</span></li>`).join('')}</ul></div>
    <div class="sec"><h4>Cities and governors</h4><ul class="log">${n.cities.map((c,ci)=>{const g=per(c.governor);return `<li><time>${ci===0?'Capital':'City'}</time><span>${esc(c.name)}${g&&g.died==null?' · '+(ci===0?'seat of the ruler':'governed by '+esc(g.name)+(g.house===r.house&&ci?' (family)':'')):''}</span></li>`}).join('')}</ul></div>
    <div class="row"><div class="flex"></div><button class="btn" data-p="close">Close</button></div>`)}

/* ---------- tech tree ---------- */
let techFor=-1;
function openTech(n){techFor=n.id;const cols=[];
  for(let e=0;e<ERAS.length;e++){const list=TECHS.filter(t=>t.era===e);const capped=e>worldOpts.maxEra;
    cols.push(`<div class="tcol${capped?' capped':''}"><h5>${ERAS[e].num} · ${ERAS[e].name}</h5>${list.map(t=>{const st=capped?'locked':techState(n,t);
      const need=t.req.filter(r=>!(n.techs||[]).includes(r)).map(r=>TECH[r].name);
      const mods=modList(t).map(m=>`${m.label} ${m.pct>0?'+':''}${m.pct}%`).join(' · ');
      return `<button class="tn ${st}" data-tech="${t.id}" ${st==='open'?'':'tabindex="-1"'}>${t.key?`<span class="key">Opens ${ERAS[t.key].name}</span>`:''}<b>${t.name}</b><small>${t.desc}</small>${mods?`<small>${mods}</small>`:''}
        ${st==='current'?`<div class="prog"><i style="width:${clamp(n.tech/TECHCOST[t.era],0,1)*100}%"></i></div><small>Researching${n.guided?' · guided by you':''}</small>`:st==='open'?'<small style="color:var(--gold)">Tap to research next · 10 belief</small>':st==='locked'&&need.length&&!capped?`<small>Needs ${need.join(', ')}</small>`:''}</button>`}).join('')}${capped?'<p class="note">Beyond the final age of this world.</p>':''}</div>`)}
  openModal(`<h2>${esc(n.name)} · Discoveries</h2><p class="note">${(n.techs||[]).length} of ${TECHS.length} discovered. Nations research on their own; each age needs its key discovery. Pace: ${fmtDuration(ageSeconds())} per age${worldOpts.calendar?' (calendar world)':''}. Final age: ${ERAS[worldOpts.maxEra].name}.</p>
    <div class="ttree">${cols.join('')}</div><div class="row"><div class="flex"></div><button class="btn" data-p="close">Close</button></div>`);
  $('#modalBox').classList.add('wide');
  const cur=$('#modalBox .tn.current');if(cur)cur.scrollIntoView({block:'nearest',inline:'center'})}

/* ---------- government picker ---------- */
let govFor=-1;
function openGov(n){govFor=n.id;const opts=govOptions(n);
  const all=Object.keys(GOVS).filter(k=>GOVS[k].max>=n.era||k===n.gov);
  openModal(`<h2>Government</h2><p class="note">${esc(n.name)} is in the ${ERAS[n.era].name}. Forms of rule unlock as the ages advance; some fall out of use. A change costs 30 belief and causes a little unrest.</p>
  <div class="govs">${all.map(k=>{const g=GOVS[k],ok=opts.includes(k),cur=k===n.gov;const why=!ok&&!cur?(n.era<g.era?`Unlocks in the ${ERAS[g.era].name}`:g.faith?'Needs a faith':`Outdated after the ${ERAS[g.max].name}`):'';
    return `<button data-gov="${k}" ${ok&&!cur?'':'disabled'} aria-pressed="${cur}"><span class="gname">${g.name}${cur?' <span class="tag">Current</span>':''}</span><small>${g.desc}</small><span class="mods">${chipsFor(g)}</span>${why?`<span class="lock">${why}</span>`:''}</button>`}).join('')}</div>
  <div class="row"><div class="flex"></div><button class="btn" data-p="close">Close</button></div>`)}
/* ---------- looks ---------- */
function renderArchs(sel){const el=$(sel);if(!el)return;el.innerHTML=Object.keys(ARCH).map(k=>`<button data-arch="${k}" aria-pressed="${k===(settings.arch||'classic')}"><b>${ARCH[k].label}</b><small>${ARCH[k].desc}</small></button>`).join('')}
function applyArch(k){settings.arch=k;saveSettings();propsDirty=true;lastProps=-1e9}
document.addEventListener('click',e=>{const b=e.target.closest('[data-arch]');if(!b)return;applyArch(b.dataset.arch);renderArchs('#'+b.parentElement.id)});
function renderLooks(sel){$(sel).innerHTML=Object.keys(LOOKS).map(k=>`<button data-look="${k}" aria-pressed="${k===lookKey}"><b>${LOOKS[k].label}</b><small>${LOOKS[k].desc}</small></button>`).join('')}
const UIS=[['brass','Dark brass'],['navy','Imperial blue'],['parchment','Parchment'],['marble','Marble']];
function applyUI(k){settings.ui=k;document.body.classList.remove('ui-navy','ui-parchment','ui-marble');if(k!=='brass')document.body.classList.add('ui-'+k);saveSettings()}
applyUI(settings.ui||'parchment');
function applyLook(k){lookKey=k;LK=LOOKS[k];if(VY)colorTerrain();lastEnv=-1e9;settings.look=k;saveSettings()}

/* ---------- HUD ---------- */
function updateHUD(){renderGoal();{const wc=$('#warCnt');if(wc){let k=0;for(const n of nations)if(n.alive)for(const b of n.wars)if(n.id<b)k++;wc.textContent=k||''}}worldPopMul=POPMUL[nations.reduce((m,n)=>n.alive?Math.max(m,n.era):m,0)];if(spaceView&&year%5===0)renderSpacePanel();
  const al=nations.filter(n=>n.alive),top=al.reduce((m,n)=>Math.max(m,n.era),0);
  $('#yr').textContent=`Year ${year}${settings.seasons!==false?' · '+seasonName():''}`;if(followId!=null)followTick();$('#eraLbl').textContent=ERAS[top].name;
  $('#bel').textContent=unlimited?'∞':Math.floor(belief);$('#belRate').textContent=unlimited?'':`+${beliefRate.toFixed(1)}`;
  $('#wpop').textContent=fmtPop(al.reduce((s,n)=>s+n.pop,0));$('#wnat').textContent=al.length;
  $$('.speed [data-s]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.s===speedIdx));
  const cal=!!worldOpts.calendar;$('#liveChip').hidden=!cal;$('.speed').hidden=cal;if(cal){const p=paceInfo();$('#liveNote').textContent=p.yearRate>=1?`${Math.round(p.yearRate)} years per second`:`1 year every ${fmtDuration(1/p.yearRate)}`}
  if(selected>=0||inspectTile>=0)renderNationCard();
  if(sheetPanel)renderSheet(false);
  $$('#cards .pc').forEach(b=>{const p=POWERS.find(p=>p.id===b.dataset.tool);b.classList.toggle('poor',!unlimited&&p.cost>belief)});
}
$$('.speed [data-s]').forEach(b=>b.onclick=()=>{speedIdx=+b.dataset.s;updateHUD()});

/* ---------- overlay: labels and effects ---------- */
const FXC={meteor:'255,140,50',rain:'90,170,230',drought:'230,170,60',bless:'250,210,110',plague:'130,180,90',faith:'136,179,238',war:'226,87,74'};
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
function rr(x,y,w,h,r){octx.beginPath();octx.moveTo(x+r,y);octx.arcTo(x+w,y,x+w,y+h,r);octx.arcTo(x+w,y+h,x,y+h,r);octx.arcTo(x,y+h,x,y,r);octx.arcTo(x,y,x+w,y,r);octx.closePath()}
function drawOverlay(now){
  const dpr=ov.width/innerWidth;octx.clearRect(0,0,ov.width,ov.height);
  if(settings.labels&&playing&&coves.length){octx.textBaseline='middle';octx.textAlign='center';
    for(const cv of coves){const x=wx(cv.x),z=wz(cv.y),[sx,sy,sz]=project(x,surfY(x,z)+.5,z);if(sz>1)continue;
      octx.font=`500 ${Math.round(12*dpr)}px "Marcellus SC", Georgia, serif`;const t='☠ '+cv.name,tw=octx.measureText(t).width;
      octx.fillStyle='rgba(10,10,10,.75)';octx.fillRect(sx-tw/2-8*dpr,sy-11*dpr,tw+16*dpr,22*dpr);octx.fillStyle='#e8e0d0';octx.fillText(t,sx,sy)}octx.textAlign='left'}
  if(settings.labels&&playing){drawDepositLabels(dpr);
    octx.textBaseline='middle';
    for(const n of nations){if(!n.alive||!n.cities[0])continue;const c=n.cities[0],x=wx(c.x),z=wz(c.y);
      const lift=n.era>=7?1.5:n.era===6?1.1:n.era>=3?.6:.4;const [sx,sy,sz]=project(x,surfY(x,z)+lift,z);if(sz>1||sx<-50||sy<-50||sx>ov.width+50||sy>ov.height+50)continue;
      if(camDist>Math.max(W,H)*.9&&n.tiles<6&&n.id!==selected)continue;
      octx.font=`500 ${Math.round(13*dpr)}px "Marcellus SC", Georgia, serif`;
      const tw=octx.measureText(n.name).width,bh=22*dpr,cw=bh,w=tw+cw+14*dpr,x0=sx-w/2,y0=sy-bh-6*dpr;
      octx.fillStyle=n.id===selected?'rgba(40,32,18,.88)':'rgba(13,18,26,.78)';rr(x0,y0,w,bh,5*dpr);octx.fill();
      octx.strokeStyle=n.id===selected?'rgba(243,215,150,.9)':'rgba(232,210,160,.28)';octx.lineWidth=dpr;octx.stroke();
      octx.fillStyle=n.color;rr(x0+2*dpr,y0+2*dpr,cw-4*dpr,bh-4*dpr,3*dpr);octx.fill();
      octx.fillStyle='#fff';octx.font=`600 ${Math.round(9*dpr)}px Figtree, system-ui, sans-serif`;octx.textAlign='center';octx.fillText(ERAS[n.era].num,x0+cw/2,y0+bh/2+.5);
      octx.font=`500 ${Math.round(13*dpr)}px "Marcellus SC", Georgia, serif`;octx.textAlign='left';octx.fillStyle=n.wars.size?'#f6b2a8':'#efe7d4';octx.fillText(n.name,x0+cw+6*dpr,y0+bh/2+1);
      octx.beginPath();octx.moveTo(sx,y0+bh);octx.lineTo(sx,sy-2*dpr);octx.strokeStyle='rgba(232,210,160,.4)';octx.stroke()}
    if(camDist<14){octx.font=`500 ${Math.round(11*dpr)}px Figtree, system-ui, sans-serif`;octx.textAlign='center';
      for(const n of nations){if(!n.alive)continue;for(const c of n.cities.slice(1)){const x=wx(c.x),z=wz(c.y),[sx,sy,sz]=project(x,surfY(x,z)+.3,z);if(sz>1||sx<0||sy<0||sx>ov.width||sy>ov.height)continue;
        octx.lineWidth=3*dpr;octx.strokeStyle='rgba(10,14,20,.75)';octx.strokeText(c.name,sx,sy);octx.fillStyle='#efe7d4';octx.fillText(c.name,sx,sy)}}}}
  if(warFrom>=0&&nations[warFrom].cities[0]){const c=nations[warFrom].cities[0],x=wx(c.x),z=wz(c.y),[sx,sy]=project(x,surfY(x,z),z);
    octx.strokeStyle=tool==='ally'?'#6ab0f0':'#e2574a';octx.lineWidth=3*dpr;octx.beginPath();octx.ellipse(sx,sy,(34+Math.sin(now/180)*5)*dpr,(20+Math.sin(now/180)*3)*dpr,0,0,7);octx.stroke()}
  drawBolts(dpr,now);
  effects=effects.filter(e=>now-e.t0<1200);
  for(const e of effects){const p=clamp((now-e.t0)/1200,0,1),[sx,sy,sz]=project(e.x,e.y,e.z);if(sz>1)continue;
    const R_=(reduceMotion?.6:p)*dpr*(e.kind==='meteor'?220:e.kind==='rain'||e.kind==='drought'?260:110)*(30/Math.max(8,camDist));
    octx.strokeStyle=`rgba(${FXC[e.kind]},${(1-p)*.9})`;octx.lineWidth=3*dpr;octx.beginPath();if(R_>0){octx.ellipse(sx,sy,R_,R_*.5,0,0,7);octx.stroke()}}
}

/* ---------- minimap ---------- */
const mini=$('#mini'),mctx=mini.getContext('2d');let miniImg=null;
const MINI_COL=[[22,52,80],[40,96,128],[214,226,236],[206,190,140],[100,136,66],[62,96,50],[50,90,48],[200,172,116],[160,146,84],[128,132,108],[232,236,240],[112,104,96],[206,208,212]];
function drawMini(){if(getComputedStyle(mini).display==='none')return;
  const dpr=Math.min(2,devicePixelRatio||1);if(mini.width!==196*dpr){mini.width=196*dpr;mini.height=148*dpr}
  const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d'),img=x.createImageData(W,H),d=img.data;
  for(let i=0;i<N;i++){let col=MINI_COL[biome[i]];const o=owner[i];let r=col[0],g=col[1],b=col[2];
    if(o>=0){const nc=nations[o].rgb,m=o===selected?.7:.5;r=lerp(r,nc[0],m);g=lerp(g,nc[1],m);b=lerp(b,nc[2],m)}
    d[i*4]=r;d[i*4+1]=g;d[i*4+2]=b;d[i*4+3]=255}
  x.putImageData(img,0,0);mctx.clearRect(0,0,mini.width,mini.height);mctx.imageSmoothingEnabled=false;
  const pad=6*dpr,sw=mini.width-pad*2,sh=mini.height-pad*2,s=Math.min(sw/W,sh/H),ox=(mini.width-W*s)/2,oy=(mini.height-H*s)/2;
  mctx.drawImage(c,ox,oy,W*s,H*s);
  const pts=[[0,0],[innerWidth,0],[innerWidth,innerHeight],[0,innerHeight]].map(([a,b])=>pickPoint(a,b));
  mctx.strokeStyle='#f3d796';mctx.lineWidth=1.5*dpr;mctx.beginPath();let ok=0;
  pts.forEach((p,k)=>{if(!p)return;ok++;const px=ox+(p.x+W/2)*s,py=oy+(p.z+H/2)*s;k===0?mctx.moveTo(px,py):mctx.lineTo(px,py)});
  if(ok===4){mctx.closePath();mctx.stroke()}else{const px=ox+(camT.x+W/2)*s,py=oy+(camT.z+H/2)*s;mctx.strokeRect(px-6*dpr,py-6*dpr,12*dpr,12*dpr)}
  mini._map={ox,oy,s,dpr}}
mini.addEventListener('pointerdown',e=>{const m=mini._map;if(!m)return;const r=mini.getBoundingClientRect(),px=(e.clientX-r.left)*m.dpr,py=(e.clientY-r.top)*m.dpr;
  focusOn(clamp((px-m.ox)/m.s-W/2,-W/2,W/2),clamp((py-m.oy)/m.s-H/2,-H/2,H/2))});

/* ---------- input ---------- */
const ptrs=new Map();let gest=null,mode='none',moved=0,sculptTile=-1,lastSculpt=0;const keys=new Set();
const isSculpt=t=>t==='raise'||t==='lower'||t==='smooth';
gl.addEventListener('pointerdown',e=>{if(!playing)return;try{gl.setPointerCapture(e.pointerId)}catch(_){}
  ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size===2){const [a,b]=[...ptrs.values()];gest={d:Math.hypot(a.x-b.x,a.y-b.y),ang:Math.atan2(b.y-a.y,b.x-a.x),dist0:camDistT,yaw0:camYawT};mode='multi';sculptTile=-1;return}
  moved=0;mode=e.button===2?'rotate':e.button===1?'pan':tool==='inspect'?'pan':'tool';
  if(mode==='tool'){const t=pickTile(e.clientX,e.clientY);if(t>=0){applyTool(t,true);sculptTile=t;lastSculpt=performance.now()}}});
gl.addEventListener('pointermove',e=>{const p=ptrs.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
  if(ptrs.size>=2&&gest){const [a,b]=[...ptrs.values()],d=Math.hypot(a.x-b.x,a.y-b.y),ang=Math.atan2(b.y-a.y,b.x-a.x);const L=camLimits();
    camDistT=clamp(gest.dist0*gest.d/Math.max(1,d),L.min,L.max);camYawT=gest.yaw0-(ang-gest.ang);panBy(dx/2,dy/2);return}
  moved+=Math.abs(dx)+Math.abs(dy);
  if(mode==='pan')panBy(dx,dy);else if(mode==='rotate')camYawT-=dx*.006;
  else if(mode==='tool'&&isSculpt(tool)){const t=pickTile(e.clientX,e.clientY);if(t>=0&&t!==sculptTile){sculptTile=t;lastSculpt=performance.now();applyTool(t,false)}}});
function endPtr(e){const had=ptrs.has(e.pointerId);ptrs.delete(e.pointerId);
  if(had&&ptrs.size===0){if(mode==='pan'&&moved<8&&e.button===0&&tool==='inspect')applyTool(pickTile(e.clientX,e.clientY),true);sculptTile=-1;gest=null;mode='none'}
  else if(ptrs.size===1){gest=null;mode='none'}}
gl.addEventListener('pointerup',endPtr);gl.addEventListener('pointercancel',endPtr);
gl.addEventListener('wheel',e=>{e.preventDefault();zoomBy(Math.exp(e.deltaY*.0012))},{passive:false});
gl.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;const k=e.key.toLowerCase();
  if(k==='escape'){if(!$('#modal').hidden){closeModal();return}if(sheetPanel){closeSheet();return}if(playing)openPause();return}
  if(!playing)return;
  if(k==='f'){toggleFullscreen();return}
  if(k===' '){speedIdx=speedIdx?0:1;updateHUD();e.preventDefault();return}
  if('1234'.includes(k)&&k.length===1){speedIdx=+k-1;updateHUD();return}
  keys.add(k)});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
addEventListener('blur',()=>keys.clear());
function keyCam(dt){const s=500*dt;if(keys.has('w')||keys.has('arrowup'))panBy(0,s);if(keys.has('s')||keys.has('arrowdown'))panBy(0,-s);
  if(keys.has('a')||keys.has('arrowleft'))panBy(s,0);if(keys.has('d')||keys.has('arrowright'))panBy(-s,0);
  if(keys.has('q'))camYawT+=dt*1.5;if(keys.has('e'))camYawT-=dt*1.5;if(keys.has('=')||keys.has('+'))zoomBy(1-dt*1.5);if(keys.has('-'))zoomBy(1+dt*1.5)}
addEventListener('resize',resize);

/* ---------- title, setup, modals ---------- */
function renderTitle(){const si=saveInfo(),cw=account.user&&account.worlds[0];
  let skip=false;try{skip=sessionStorage.getItem('fb.nologin')==='1'}catch(_){}
  if(account.online&&!account.user&&!skip){const reg=account.loginMode==='register'&&account.signup;$('#acct').innerHTML='';$('.credit').textContent='Sign in to keep your worlds on this server, on every device.';
    $('#titleMenu').innerHTML=`<form class="glass login form2" id="authForm" data-mode="${reg?'register':'login'}"><h3>${reg?'Create your account':'Sign in'}</h3>
      <label>Name<input type="text" name="username" autocomplete="username" required minlength="3" maxlength="24"></label>
      <label>Password<input type="password" name="password" autocomplete="${reg?'new-password':'current-password'}" required ${reg?'minlength="8"':''}></label>
      ${reg&&account.code?'<label>Invite code<input type="text" name="code" required></label>':''}<p class="err" id="authErr"></p>
      <button class="btn primary" type="submit">${reg?'Create account':'Sign in'}</button>
      <div class="alt">${account.signup?`<button type="button" data-lm="${reg?'login':'register'}">${reg?'I have an account':'Create an account'}</button>`:'<span></span>'}<button type="button" data-lm="skip">Play without an account</button></div></form>`;return}
  $('#acct').innerHTML=!account.online?'':account.user?`<span>Signed in as <b>${esc(account.user)}</b></span><button class="btn" data-m="logout">Sign out</button>`
    :`<span>Sign in to keep your worlds on this server.</span><button class="btn" data-m="login">Sign in</button>${account.signup?'<button class="btn" data-m="register">Create account</button>':''}`;
  const cont=cw?`<button class="btn primary" data-m="continue-cloud" data-slot="${esc(cw.slot)}">Continue <small>${esc(cw.name)} · Year ${cw.year.toLocaleString('en-US')}</small></button>`
    :si?`<button class="btn primary" data-m="continue">Continue <small>${esc(si.name||'This browser')} · Year ${si.year.toLocaleString('en-US')}</small></button>`:'';
  $('#titleMenu').innerHTML=`${cont}${account.user?`<button class="btn" data-m="worlds">Your worlds <small>${account.worlds.length}</small></button>`:''}
    <button class="btn ${cont?'':'primary'}" data-m="new">New world</button><button class="btn" data-m="scen">Scenarios</button><button class="btn" data-m="settings">Settings</button><button class="btn" data-m="help">How to play</button>`;
  $('.credit').textContent=account.user?'Your worlds are saved on this server.':account.online?'Without an account, your world is saved in this browser only.':'Your world is saved in this browser.'}
/* ---------- accounts and server saves ---------- */
async function api(path,opts){const o=Object.assign({credentials:'same-origin',headers:{}},opts||{});if(o.json!==undefined){o.method=o.method||'POST';o.headers['Content-Type']='application/json';o.body=JSON.stringify(o.json);delete o.json}
  const r=await fetch(path,o);let data=null;try{data=await r.json()}catch(e){}return{ok:r.ok,status:r.status,data}}
async function probeAccount(){try{const c=await api('/api/config');if(!c.ok||!c.data||c.data.signup===undefined)return;account.online=true;account.signup=c.data.signup;account.code=c.data.code;
  const me=await api('/api/me');if(me.ok){account.user=me.data.username;await refreshWorlds();await uploadLocalIfNewer()}}catch(e){}renderTitle()}
async function refreshWorlds(){const r=await api('/api/saves');account.worlds=r.ok?r.data:[]}
async function uploadLocalIfNewer(){let d;try{d=JSON.parse(localStorage.getItem('faithbound.save')||'null')}catch(e){}if(!d||(d.owner&&d.owner!==account.user))return;
  if(!d.slot)d.slot=Date.now().toString(36);const srv=account.worlds.find(w=>w.slot===d.slot);if(srv&&srv.saved>=d.saved)return;
  d.owner=account.user;if(await cloudSave(d)){saveLocal(d);await refreshWorlds();toast('World saved to your account',`${d.worldName||'Your world'} is now on the server.`)}}
function openAuth(mode){const reg=mode==='register';
  openModal(`<h2>${reg?'Create account':'Sign in'}</h2><form class="form2" id="authForm" data-mode="${mode}">
    <label>Name<input type="text" name="username" autocomplete="username" required minlength="3" maxlength="24"></label>
    <label>Password<input type="password" name="password" autocomplete="${reg?'new-password':'current-password'}" required ${reg?'minlength="8"':''}></label>
    ${reg&&account.code?'<label>Invite code<input type="text" name="code" required></label>':''}
    <p class="err" id="authErr"></p>
    <div class="row"><button type="button" class="btn" data-p="close">Cancel</button><div class="flex"></div>${!reg&&account.signup?'<button type="button" class="btn" data-m="register">Create account</button>':''}<button class="btn primary" type="submit">${reg?'Create account':'Sign in'}</button></div></form>`);
  setTimeout(()=>{const i=$('#authForm input');if(i)i.focus()},50)}
document.addEventListener('submit',async e=>{if(e.target.id!=='authForm')return;e.preventDefault();const f=e.target,fd=Object.fromEntries(new FormData(f));
  const r=await api(f.dataset.mode==='register'?'/api/register':'/api/login',{json:fd}).catch(()=>({ok:false,data:{error:'The server cannot be reached.'}}));
  if(!r.ok){const er=f.querySelector('.err')||$('#authErr');er.textContent=(r.data&&r.data.error)||'Something went wrong.';return}
  account.user=r.data.username;closeModal();await refreshWorlds();await uploadLocalIfNewer();renderTitle();toast(`Welcome, ${account.user}`,'Your worlds are saved on this server now.')});
async function logout(){await api('/api/logout',{json:{}}).catch(()=>{});account.user=null;account.worlds=[];renderTitle();toast('Signed out','Your worlds stay safe on the server.')}
async function loadCloud(slot){const r=await api('/api/saves/'+encodeURIComponent(slot));if(!r.ok||!r.data){toast('Could not load that world',(r.data&&r.data.error)||'Try again.');return false}
  applySave(r.data);saveLocal(r.data);return true}
function rel(t){const s=(Date.now()-t)/1000;return s<90?'just now':s<5400?Math.round(s/60)+' minutes ago':s<172800?Math.round(s/3600)+' hours ago':Math.round(s/86400)+' days ago'}
async function openWorlds(){await refreshWorlds();const w=account.worlds;
  openModal(`<h2>Your worlds</h2><p class="note">${w.length} of 30 saved on this server.</p><div class="wlist">${w.map(x=>`<div class="wrow"><div><b>${esc(x.name)}</b><small>Year ${x.year.toLocaleString('en-US')} · ${ERAS[x.era]?ERAS[x.era].name:''} · ${x.nations} nations${x.calendar?' · calendar':''} · saved ${rel(x.saved)}</small></div>
    <button class="btn" data-w="load" data-slot="${esc(x.slot)}">Load</button><button class="btn" data-share="${esc(x.slot)}">Share</button><button class="btn danger" data-w="del" data-slot="${esc(x.slot)}">Delete</button></div>`).join('')||'<p class="note">No worlds yet. Start a new one and it is saved here.</p>'}</div>
    <div class="row"><div class="flex"></div><button class="btn" data-p="close">Close</button></div>`)}
document.addEventListener('click',async e=>{const b=e.target.closest('[data-w]');if(!b)return;const slot=b.dataset.slot;
  if(b.dataset.w==='load'){closeModal();if(await loadCloud(slot)){startPlaying(false);if(worldOpts.calendar)awayFrom=year}return}
  if(b.dataset.w==='del'){if(!b.classList.contains('armed')){b.classList.add('armed');b.textContent='Tap again to delete';setTimeout(()=>{b.classList.remove('armed');b.textContent='Delete'},3000);return}
    await api('/api/saves/'+encodeURIComponent(slot),{method:'DELETE',headers:{'Content-Type':'application/json'}});if(worldOpts.slot===slot&&!playing){try{localStorage.removeItem('faithbound.save')}catch(e){}}await openWorlds();renderTitle()}});
$('#acct').onclick=e=>{const b=e.target.closest('[data-m]');if(!b)return;const m=b.dataset.m;if(m==='login')openAuth('login');if(m==='register')openAuth('register');if(m==='logout')logout()};
document.addEventListener('click',e=>{const b=e.target.closest('#modalBox [data-m="register"]');if(b)openAuth('register')});
$('#titleMenu').onclick=async e=>{const lm=e.target.closest('[data-lm]');if(lm){if(lm.dataset.lm==='skip'){try{sessionStorage.setItem('fb.nologin','1')}catch(_){}}else account.loginMode=lm.dataset.lm;renderTitle();return}
  const b=e.target.closest('[data-m]');if(!b)return;const m=b.dataset.m;
  if(m==='continue'){if(loadGame()){startPlaying(false);if(worldOpts.calendar)awayFrom=year}else{toast('No save found','Start a new world instead.');renderTitle()}}
  if(m==='continue-cloud'){if(await loadCloud(b.dataset.slot)){startPlaying(false);if(worldOpts.calendar)awayFrom=year}}
  if(m==='worlds')openWorlds();if(m==='login')openAuth('login');if(m==='register')openAuth('register');if(m==='logout')logout();
  if(m==='new')openSetup();if(m==='scen')openScenarios();if(m==='settings')openSettings();if(m==='help')openHelp()};
const WSL=[['land','Land','More sea','More land',.2,.85,.01,v=>Math.round(v*100)+'%'],['frag','Shape','Continents','Islands',.6,1.8,.05,v=>v<.85?'Big':v>1.3?'Many':'Mixed'],
  ['mtn','Mountains','Flat','Rugged',.4,1.8,.05,v=>v<.75?'Low':v>1.3?'High':'Some'],['rain','Rainfall','Deserts','Forests',.25,.75,.01,v=>v<.42?'Dry':v>.58?'Wet':'Mild'],['rivers','Rivers','Few','Many',.3,2.2,.1,v=>v<.7?'Few':v>1.4?'Many':'Some']];
function renderWorldSliders(){$('#worldSliders').innerHTML=WSL.map(([k,l,a,b,mn,mx,st,f])=>{const v=worldOpts[k]??(k==='land'||k==='rain'?.5:1);
  return `<label class="sl"><span>${l}</span><input type="range" min="${mn}" max="${mx}" step="${st}" value="${v}" data-wo="${k}"><b id="wov_${k}">${f(v)}</b><span class="ends"><span>${a}</span><span>${b}</span></span></label>`}).join('')}
let woTimer=0;
$('#worldSliders').addEventListener('input',e=>{const k=e.target.dataset.wo;if(!k)return;const v=+e.target.value;worldOpts[k]=v;const d=WSL.find(s=>s[0]===k);$('#wov_'+k).textContent=d[7](v);
  clearTimeout(woTimer);woTimer=setTimeout(()=>{const t=climate.temp;genWorld(worldSeed);climate.temp=t;terrainDirty=true;updateHUD()},220)});
function openSetup(){renderWorldSliders();$('#titleMain').hidden=true;$('#setup').hidden=false;if(!$('#worldName').value)$('#worldName').value=genName(2,3)+(rng()<.5?' Reach':' Realm');
  renderPaceBox('#paceBox');
  $('#maxEra').innerHTML=ERAS.map((e,i)=>`<option value="${i}" ${i===worldOpts.maxEra?'selected':''}>${e.name}${i===7?' (no limit)':''}</option>`).join('');
  $$('#disSeg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.dis===(settings.disasters||'normal')));
  $$('#sizeSeg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.size===sizeKey));renderLooks('#looks');renderArchs('#archs');
  $$('#climSeg button').forEach(b=>b.setAttribute('aria-pressed',Math.abs(+b.dataset.c-climate.temp)<.02))}
$('#sizeSeg').onclick=e=>{const b=e.target.closest('[data-size]');if(!b)return;sizeKey=b.dataset.size;genWorld();updateHUD();openSetup()};
$('#looks').onclick=e=>{const b=e.target.closest('[data-look]');if(b){applyLook(b.dataset.look);renderLooks('#looks')}};
$('#climSeg').onclick=e=>{const b=e.target.closest('[data-c]');if(!b)return;climate.temp=+b.dataset.c;terrainDirty=true;openSetup()};
/* ---------- pace controls (setup and World panel) ---------- */
function renderPaceBox(sel){const o=worldOpts,el=$(sel);if(!el)return;
  el.innerHTML=`<div class="pacebox"><div class="seg">${Object.keys(PACES).map(k=>`<button data-pace="${k}" aria-pressed="${o.pace===k}">${PACES[k].label}</button>`).join('')}</div>
    ${o.pace==='custom'?`<div class="custom"><label class="lab" for="paceN">One age lasts</label><input type="number" id="paceN" min="1" max="999" value="${o.customN}"><select id="paceU">${Object.keys(TIME_UNITS).map(u=>`<option value="${u}" ${u===o.customUnit?'selected':''}>${u}</option>`).join('')}</select></div>`:''}
    <label class="tog">Calendar world: keeps living while the game is closed<input type="checkbox" id="paceCal" ${o.calendar?'checked':''}></label>
    <p class="note">${paceSummary()}.${o.calendar?' Time follows the real clock; when you come back, the world catches up on what happened.':' Time only passes while you play; speed buttons still work.'}</p></div>`}
function paceChanged(){if(playing){worldOpts.anchorReal=Date.now();worldOpts.anchorYear=year;acc=0}updateHUD()}
document.addEventListener('click',e=>{const b=e.target.closest('.pacebox [data-pace]');if(!b)return;worldOpts.pace=b.dataset.pace;paceChanged();renderPaceBox('#'+b.closest('.pacebox').parentElement.id)});
document.addEventListener('change',e=>{const box=e.target.closest('.pacebox');if(!box)return;const host='#'+box.parentElement.id;
  if(e.target.id==='paceN')worldOpts.customN=clamp(Math.round(+e.target.value||1),1,999);if(e.target.id==='paceU')worldOpts.customUnit=e.target.value;
  if(e.target.id==='paceCal')worldOpts.calendar=e.target.checked;paceChanged();renderPaceBox(host)});
$('#maxEra').onchange=e=>{worldOpts.maxEra=+e.target.value};
$('#disSeg').onclick=e=>{const b=e.target.closest('[data-dis]');if(!b)return;settings.disasters=b.dataset.dis;saveSettings();openSetup()};
$('#reroll').onclick=()=>{const t=climate.temp;genWorld();climate.temp=t;terrainDirty=true};
$('#setupBack').onclick=()=>{$('#setup').hidden=true;$('#titleMain').hidden=false};
$('#begin').onclick=()=>{const t=climate.temp;if(year>30){genWorld();climate.temp=t;terrainDirty=true}
  worldOpts.slot=Date.now().toString(36)+Math.floor(Math.random()*1e6).toString(36);worldOpts.name=($('#worldName').value.trim()||'Unnamed world').slice(0,40);$('#worldName').value='';startPlaying(true);saveGame()};
function startPlaying(fresh){playing=true;if(fresh||!worldOpts.anchorReal){worldOpts.anchorReal=Date.now();worldOpts.anchorYear=year}$('#title').classList.add('hidden');$('#hud').classList.remove('hidden');speedIdx=1;
  curTab='People';buildDock();setTool('inspect');updateHUD();lastSave=performance.now();
  if(fresh){toast('Your world begins',`${nations.length} tribes wait for a sign.`);maybeGuide();const c=nations[0]&&nations[0].cities[0];if(c)focusOn(wx(c.x),wz(c.y),18)}else toast('Welcome back',`Year ${year}.`)}
function openModal(html){$('#modalBox').classList.remove('wide');$('#modalBox').innerHTML=html;$('#modal').hidden=false}
function closeModal(){$('#modal').hidden=true}
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal()});
function openPause(){const si=saveInfo();
  openModal(`<h2>Paused</h2><div class="menu"><button class="btn primary" data-p="resume">Resume</button><button class="btn" data-p="save">Save game</button>
    <button class="btn" data-p="load" ${si||account.user?'':'disabled'}>${account.user?'Your worlds':'Load last save'} ${!account.user&&si?`<small>Year ${si.year}</small>`:''}</button><button class="btn" data-p="settings">Settings</button>
    <button class="btn" data-p="help">How to play</button><button class="btn danger" data-p="quit">Save and quit to title</button></div>`)}
$('#menuBtn').onclick=openPause;
/* full screen: real browser full screen where the device allows it */
const fsEl=()=>document.fullscreenElement||document.webkitFullscreenElement;
const fsOK=!!(document.fullscreenEnabled||document.webkitFullscreenEnabled);
function toggleFullscreen(){const d=document.documentElement;
  try{if(fsEl()){(document.exitFullscreen||document.webkitExitFullscreen).call(document)}
    else{const p=(d.requestFullscreen||d.webkitRequestFullscreen).call(d);if(p&&p.catch)p.catch(()=>say('Full screen is not allowed here. Press F11 in your browser instead.'))}}
  catch(e){say('Full screen is not allowed here. Press F11 in your browser instead.')}}
$('#fsBtn').hidden=!fsOK;$('#fsBtn').onclick=toggleFullscreen;
['fullscreenchange','webkitfullscreenchange'].forEach(ev=>document.addEventListener(ev,()=>{$('#fsBtn').setAttribute('aria-pressed',!!fsEl());setTimeout(resize,60)}));
$('#modalBox').addEventListener('click',e=>{const fm=e.target.closest('[data-fm]');if(fm){faithMakerClick(fm);return}
  const tn=e.target.closest('.tn.open');if(tn){const n=nations[techFor],p={n:techFor,t:tn.dataset.tech};if(typeof coopGuest==='function'&&coopGuest()){coopAct('guide',p);closeModal();return}if(n&&doAct('guide',p))openTech(n);return}
  const gv=e.target.closest('[data-gov]');if(gv&&!gv.disabled){const p={n:govFor,g:gv.dataset.gov};if(typeof coopGuest==='function'&&coopGuest()){coopAct('gov',p);closeModal();return}if(doAct('gov',p)){closeModal();renderNationCard();updateHUD()}return}
  const b=e.target.closest('[data-p]');if(b){const p=b.dataset.p;if(p==='close'){closeModal();return}
    if(p==='resume')closeModal();
    if(p==='save'){closeModal();saveGame().then(w=>toast(w==='none'?'Could not save':'Game saved',w==='cloud'?'Saved to your account on the server.':w==='local'?(account.user?'Server unreachable; saved in this browser for now.':'Saved in this browser.'):'The browser refused to store it.'))}
    if(p==='load'){closeModal();if(account.user){openWorlds();return}if(loadGame()){toast('Save loaded',`Year ${year}.`);updateHUD();selected=-1;renderNationCard()}}
    if(p==='settings')openSettings();if(p==='help')openHelp();
    if(p==='quit'){saveGame();closeModal();playing=false;closeSheet();$('#hud').classList.add('hidden');$('#title').classList.remove('hidden');$('#setup').hidden=true;$('#titleMain').hidden=false;renderTitle()}
    if(p==='back')playing?openPause():closeModal();return}
  const ds=e.target.closest('[data-dis]');if(ds){settings.disasters=ds.dataset.dis;saveSettings();openSettings();return}
  const sc_=e.target.closest('[data-scen]');if(sc_){if(sc_.dataset.scen)startScenario(sc_.dataset.scen);else closeModal();return}
  const cl=e.target.closest('[data-clim]');if(cl){const d=+cl.dataset.clim;if(d){if(typeof coopGuest==='function'&&coopGuest())coopAct('clim',{d});else doAct('clim',{d})}closeModal();return}
  const ub=e.target.closest('[data-ui]');if(ub){applyUI(ub.dataset.ui);openSettings();return}
  const pw=e.target.closest('[data-pow]');if(pw){settings.power=pw.dataset.pow;saveSettings();resize();openSettings();return}
  const q=e.target.closest('[data-q]');if(q){settings.quality=q.dataset.q;saveSettings();applyGraphics();treesDirty=true;propsDirty=true;openSettings()}
  const lb=e.target.closest('[data-look]');if(lb){applyLook(lb.dataset.look);renderLooks('#looks3')}});
$('#modalBox').addEventListener('input',e=>{const v=e.target.dataset.vol;if(!v)return;settings.vol=Object.assign({},vols(),{[v]:+e.target.value});saveSettings();audioInit();applyVolumes()});
$('#modalBox').addEventListener('change',e=>{const k=e.target.dataset.set;if(!k)return;
  if(k==='unlimited'){unlimited=e.target.checked;updateHUD();return}
  settings[k]=e.target.checked;saveSettings();if(k==='mute')applyVolumes();if(k==='shadows')applyGraphics();if(k==='borders')bordersDirty=true});
function openSettings(){const t=(k,label,v)=>`<label class="tog">${label}<input type="checkbox" data-set="${k}" ${v?'checked':''}></label>`;
  openModal(`<h2>Settings</h2><div class="sec"><span class="lab">Graphics quality</span><div class="seg">${['low','medium','high'].map(q=>`<button data-q="${q}" aria-pressed="${settings.quality===q}">${q[0].toUpperCase()+q.slice(1)}</button>`).join('')}</div>
    <p class="note">Lower quality draws fewer trees and smaller shadows. Use it on older phones.</p></div>
    <div class="sec"><span class="lab">Interface</span><div class="seg">${UIS.map(([k,l])=>`<button data-ui="${k}" aria-pressed="${(settings.ui||'parchment')===k}">${l}</button>`).join('')}</div></div>
    <div class="sec"><span class="lab">Power</span><div class="seg">${[['saver','Battery saver'],['balanced','Balanced'],['max','Maximum']].map(([k,l])=>`<button data-pow="${k}" aria-pressed="${(settings.power||'balanced')===k}">${l}</button>`).join('')}</div>
    <p class="note">Battery saver runs at 30 frames a second and fewer pixels, so laptops stay cool and quiet. Balanced runs at 60, and at 30 on battery. Maximum has no limit.</p></div>
    <div class="sec">${t('shadows','Shadows',settings.shadows)}${t('daynight','Day and night cycle',settings.daynight)}${t('borders','Territory borders',settings.borders)}${t('labels','Nation names',settings.labels)}${t('people','People walking around',settings.people)}${t('clouds','Clouds',settings.clouds!==false)}${t('seasons','Seasons (snow in winter, golden autumns)',settings.seasons!==false)}${t('post','Look effects (outlines, focus blur, grading)',settings.post!==false)}${t('fps','Show frame rate',!!settings.fps)}${t('unlimited','Sandbox: unlimited belief',unlimited)}</div>
    <div class="sec"><span class="lab">Sound</span>${t('mute','Mute all sound',settings.mute)}
      ${[['master','Master'],['music','Music'],['sfx','Effects'],['amb','Ambience']].map(([k,l])=>`<label class="slid">${l}<input type="range" min="0" max="1" step="0.05" data-vol="${k}" value="${vols()[k]}"></label>`).join('')}
      <p class="note">Sound starts after your first click. Ambience follows the camera: waves on the coast, birds in the woods, crowds in town.</p></div>
    <div class="sec"><span class="lab">Disasters</span><div class="seg">${['off','mild','normal','wild'].map(q=>`<button data-dis="${q}" aria-pressed="${(settings.disasters||'normal')===q}">${q[0].toUpperCase()+q.slice(1)}</button>`).join('')}</div>
    <p class="note">Storms, wildfires, famine, epidemics, earthquakes and eruptions. Your own powers always work.</p></div>
    <div class="sec"><span class="lab">Look</span><div class="looks" id="looks3"></div></div>
    <div class="sec"><span class="lab">Building style</span><div class="looks" id="archs3"></div></div>
    <div class="row"><div class="flex"></div><button class="btn primary" data-p="back">Done</button></div>`);renderLooks('#looks3');renderArchs('#archs3')}
function openHelp(){openModal(`<h2>How to play</h2><div class="help">
  <p>You are a god watching over a young world. <b>Tribes</b> grow into nations on their own, found cities, and advance through eight ages, from the Stone Age to the Future.</p>
  <p><b>Belief</b> pays for your powers. You earn a little on your own, and much more when nations follow a faith you revealed. Open <b>Faiths</b> to design one: name, symbol, colour and two tenets.</p>
  <p>Every nation has a <b>government</b>. Forms of rule unlock with the ages: tribal councils and chiefdoms at the start, kingdoms and republics later, democracy, communism and fascism from the Industrial age, and federations in the Future. Nations reform on their own, or you change it with <b>Change rule</b>.</p>
  <p><b>Powers</b> sit in the bar at the bottom: bless or curse nations, start and end wars, shape the land, and command the sky.</p>
  <p>Every nation researches <b>discoveries</b> in a tech tree. Each age has a key discovery that opens the next one. Open <b>Tech</b> on a nation's card to see its tree and steer its research. When you start a world you choose the <b>pace</b>: a preset from about 2 minutes to an hour per age, or <b>Custom</b> with any length, such as 3 hours, a week or a month. Turn on <b>calendar world</b> and history follows the real clock, even while the game is closed; when you return it catches up and shows what happened. You also pick the <b>final age</b>.</p>
  <p>Every nation has a <b>ruler</b> with traits that shape it, a family and a dynasty. Rulers marry, have children, grow old and die; kingdoms pass to the eldest child, republics and democracies vote, and a dynasty without heirs can end in a power grab or civil war. Tap the ruler on a nation's card to open its <b>court</b>.</p>
  <p>Every nation flies its own <b>flag</b> and has a <b>stability</b>. A steady realm grows and learns faster and can enter a <b>golden age</b>; a realm in turmoil suffers riots, coups, revolutions and civil war. Hover the stability bar to see why. As a god you can steer this from the <b>Rule</b> tab: anoint a ruler, have one assassinated, stage a coup or a revolution, or spark a town into independence.</p>
  <p>In the modern age capitals build skylines, airports and big ships; in the future they raise glass spires, spaceports and terraform the wastes and shallows to grow.</p>
  <p>Nations act on their own: they meet each other, open <b>trade routes</b> with caravans and merchant ships, send <b>explorers</b> across the sea from the Age of Sail, found cities and go to war.</p>
  <p><b>Disasters</b> strike on their own: thunderstorms with lightning, hurricanes from the sea, blizzards, spreading wildfires, famine, epidemics that jump between nations, earthquakes and tsunamis. Tap a message to fly there. Set how often they happen in Settings.</p>
  <p>From the <b>Age of Sail</b>, nations send colonists across the sea and fight with fleets. In the <b>Industrial</b> age factories warm the climate; watch the sea rise in the World panel.</p>
  <p><b>Controls</b>: drag to move, pinch or scroll to zoom, twist with two fingers or right-drag to turn. On a keyboard use WASD, Q and E, space to pause, 1 to 4 for speed, and F for full screen.</p></div>
  <div class="row"><div class="flex"></div><button class="btn primary" data-p="back">Got it</button></div>`)}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing){const d=buildSave();saveLocal(d);if(account.user)cloudSave(d,true)}});

/* ---------- calendar worlds: catch up on time that passed while away ---------- */
let catching=false,awayFrom=-1;
function catchUp(years){catching=true;const total=Math.min(years,25000),startY=year,startLog=logs.length?logs[0]:null;
  const ov=document.createElement('div');ov.className='catch';ov.innerHTML=`<div class="glass"><h2>The world lived on</h2><p class="note" id="catchTxt">Catching up on ${total.toLocaleString('en-US')} years…</p><div class="prog"><i id="catchBar" style="width:0%"></i></div></div>`;document.body.appendChild(ov);
  let done=0;function chunk(){const t0=performance.now();while(done<total&&performance.now()-t0<40){tick();done++}
    $('#catchBar').style.width=(done/total*100)+'%';$('#catchTxt').textContent=`Year ${year.toLocaleString('en-US')} · ${Math.round(done/total*100)}%`;
    if(done<total){setTimeout(chunk,0);return}
    if(years>total){worldOpts.anchorReal=Date.now();worldOpts.anchorYear=year}
    ov.remove();catching=false;propsDirty=true;treesDirty=true;bordersDirty=true;terrainDirty=true;
    const idx=startLog?logs.indexOf(startLog):logs.length;const news=(idx<0?logs:logs.slice(0,idx)).filter(l=>/era|war|doom/.test(l.kind)).slice(0,14);
    openModal(`<h2>While you were away</h2><p class="note">${(year-startY).toLocaleString('en-US')} years passed${years>total?' (the oldest stretch was skipped)':''}. Now year ${year.toLocaleString('en-US')}.</p>
      <ul class="log">${news.map(l=>`<li><time>Y${l.year}</time><span class="k-${l.kind}">${esc(l.text)}</span></li>`).join('')||'<li><span>A quiet time.</span></li>'}</ul>
      <div class="row"><div class="flex"></div><button class="btn primary" data-p="close">Continue</button></div>`);saveGame()}
  setTimeout(chunk,30)}

/* ---------- main loop ---------- */
let fpsN=0,fpsAt=0,lastColor=0,last=performance.now(),acc=0,lastUI=0,lastProps=-1e9,lastTrees=-1e9,lastMini=0,lastSave=0,lastBorders=0;
/* the loop must never die: an error in one frame is reported once and the next frame still runs */
let frameErrs=0,lastErrMsg='';
function reportErr(where,e){frameErrs++;const m=(e&&e.message)||String(e);console.error('Faithbound '+where+':',e);
  if(m!==lastErrMsg){lastErrMsg=m;try{toast('Something went wrong',`${where}: ${m}. The game keeps running.`)}catch(_){}}}
/* frame cap: keeps laptops cool. Balanced runs at 60 fps, drops to 30 on battery, on menus and when the window is in the background */
let jobs=[],lastDraw=0,onBattery=false,propCam={x:0,z:0},roadSig='',lastRoads=0,bordersUrgent=false,dynScale=1,frameEMA=16,dynT=0;
try{if(navigator.getBattery)navigator.getBattery().then(b=>{const u=()=>{onBattery=!b.charging};u();b.addEventListener('chargingchange',u)}).catch(()=>{})}catch(e){}
function fpsCap(){const p=settings.power||'balanced';if(p==='max')return 0;let f=p==='saver'?30:60;
  const md=$('#modal');if(onBattery||!playing||(md&&!md.hidden)||(document.hasFocus&&!document.hasFocus()))f=Math.min(f,30);return f}
function frame(now){requestAnimationFrame(frame);const cap=fpsCap();if(cap&&now-lastDraw<1000/cap-2)return;const gap=now-lastDraw;lastDraw=now;
  if(gap<250){frameEMA=frameEMA*.95+gap*.05;dynT+=gap;if(dynT>1500&&(settings.power||'balanced')!=='max'){dynT=0;const want=1000/(cap||60);
    if(frameEMA>want*1.35&&dynScale>.6){dynScale=Math.max(.6,dynScale-.1);resize()}else if(frameEMA<want*1.08&&dynScale<1){dynScale=Math.min(1,dynScale+.05);resize()}}}try{frameBody(now)}catch(e){reportErr('frame',e)}}
function frameBody(now){
  const dt=Math.min(.1,(now-last)/1000);last=now;
  const paused=!$('#modal').hidden;
  const pr=paceInfo();let yrs;
  if(playing&&worldOpts.calendar){const target=worldOpts.anchorYear+(Date.now()-worldOpts.anchorReal)/1000*pr.yearRate;yrs=Math.max(0,Math.min(target-year-acc,6));
    if(target-year>40&&!catching){catchUp(Math.floor(target-year));}}
  else yrs=paused?0:playing?dt*SPEEDS[speedIdx]*pr.yearRate/2:dt*3;
  acc+=yrs;if(typeof coopGuest==='function'&&coopGuest())acc=0;let steps=0;while(acc>=1&&steps<6){try{tick()}catch(e){reportErr('year '+year,e);year++}acc-=1;steps++}if(steps===6&&!worldOpts.calendar)acc=0;
  const shipYrs=yrs>0?Math.max(yrs,dt*.8):0;
  if(playing)keyCam(dt);else camYawT+=dt*.035;
  updateShips(shipYrs,dt,now);
  for(let k=rockets.length-1;k>=0;k--){const r=rockets[k];r.t+=dt;r.g.position.y+=dt*(.3+r.t*r.t*1.2);emit('dark',r.g.position.x,r.g.position.y,r.g.position.z);emit('fire',r.g.position.x,r.g.position.y-.02,r.g.position.z);if(r.t>6){scene.remove(r.g);rockets.splice(k,1)}}
  for(let k=eruptions.length-1;k>=0;k--){const e=eruptions[k];e.t+=dt;const y=groundY(e.x,e.z)+.1;for(let q=0;q<3;q++){emit('fire',e.x+(rng()-.5)*.3,y,e.z+(rng()-.5)*.3)}emit('dark',e.x,y+.2,e.z);if(e.t>12)eruptions.splice(k,1)}
  try{updateAudio(dt)}catch(e){}updateWalkers(dt,yrs);updateCaravans(dt,paused?0:1);updateLife(dt,now);if(!paused)updateEmitters(dt);
  updateDisasters(dt,paused?0:playing?[0,1,1.6,2.5][speedIdx]:.6);updateGodWorks(dt,paused?0:playing?[0,1,1.6,2.5][speedIdx]:.6,now);updateModern(dt,paused?0:1,now);updateBlasts(paused?0:dt);updatePilgrims(dt,paused?0:playing?[0,1,1.6,2.5][speedIdx]:.6);updateSeasons(dt,paused?0:playing?[0,1,1.6,2.5][speedIdx]:.3);updateParticles(paused?0:dt);
  if(colorDirty&&now-lastColor>1500&&!jobs.length){lastColor=now;colorDirty=false;jobs.push(colorTerrain)}
  if(sculptTile>=0&&isSculpt(tool)&&now-lastSculpt>110){lastSculpt=now;applyTool(sculptTile,false)}
  if(terrainDirty&&(sculptTile>=0||!jobs.some(j=>j.terr))){terrainDirty=false;const tj=()=>{computeTerrain();layoutTerrain();propsDirty=true;bordersDirty=true;treesDirty=true};tj.terr=1;if(sculptTile>=0)tj();else jobs.unshift(tj)}
  waterU.uTime.value=now/1000;
  placeCamera(dt);updateSky(dt,now);
  if(shakeT>0){shakeT-=dt;const a=shakeT*.03*camDist/10;cam.position.x+=(rng()-.5)*a;cam.position.y+=(rng()-.5)*a}
  terrU.uTint.value=settings.borders?(.1+.16*smooth(3,14,camDist)):0;
  if(contestedList.length&&!paused&&rng()<dt*8){const i=contestedList[(rng()*contestedList.length)|0],x=wx(i%W)+(rng()-.5)*.6,z=wz((i/W)|0)+(rng()-.5)*.6;if(Math.hypot(x-camT.x,z-camT.z)<camDist*1.2+2)emit(rng()<.3?'fire':'dark',x,groundY(x,z)+.03,z)}
  if(borderMesh)borderMat.uniforms.uOp.value=.95*smooth(2.5,10,camDist)+.25*(1-smooth(2.5,10,camDist))*(selected>=0?1:.6);
  if(spaceView){renderSpace(dt);octx.clearRect(0,0,ov.width,ov.height)}else{renderFrame();try{drawOverlay(now)}catch(e){reportErr('overlay',e)}}
  if(now-lastUI>500){lastUI=now;if(playing)updateHUD()}
  const camMoved=Math.hypot(camT.x-propCam.x,camT.z-propCam.z)>camDist*.9+1.5;
  let ranJob=false;if(jobs.length){ranJob=true;const j=jobs.shift();try{j()}catch(e){reportErr('job',e)}}
  else if((propsDirty&&now-lastProps>(playing?2500:600))||(playing&&now-lastProps>20000)||(camMoved&&now-lastProps>1500)){lastProps=now;propsDirty=false;if(camMoved)treesDirty=true;propCam.x=camT.x;propCam.z=camT.z;const cs=citySig();
    if(cs!==flatSig)jobs.push(()=>{layoutTerrain();bordersDirty=true;treesDirty=true});jobs.push(rebuildCities,rebuildFields,()=>{const rs=nations.map(n=>n.alive?n.cities.map(c=>c.x+','+c.y).join(';'):'').join('|');if(rs!==roadSig||now-lastRoads>30000){roadSig=rs;lastRoads=now;rebuildRoads()}},()=>{if(treesDirty||performance.now()-lastTrees>30000){rebuildTrees();lastTrees=performance.now();treesDirty=false}})}
  if(!ranJob&&bordersDirty&&now-lastBorders>(playing&&!bordersUrgent?4000:300)){bordersUrgent=false;rebuildBorders();bordersDirty=false;lastBorders=now}
  if(playing&&now-lastMini>900){lastMini=now;drawMini()}
  if(settings.fps){fpsN++;if(now-fpsAt>1000){const el=$('#fpsMeter');if(el){el.hidden=false;const ms=(performance.now()-now).toFixed(1);el.textContent=`${Math.round(fpsN*1000/(now-fpsAt))} fps · ${ms} ms · ${Math.round(dynScale*100)}% res`}fpsN=0;fpsAt=now}}else if(fpsN>=0){fpsN=-1;const el=$('#fpsMeter');if(el)el.hidden=true}
  if(playing&&now-lastSave>60000){lastSave=now;saveGame()}
}

/* ---------- start ---------- */
if(settings.lookV!==2){settings.lookV=2;settings.look='manor';saveSettings()}
if(settings.look&&LOOKS[settings.look]){lookKey=settings.look;LK=LOOKS[lookKey]}
resize();applyGraphics();genWorld();renderTitle();probeAccount();try{if(sessionStorage.getItem('fb.resume')){sessionStorage.removeItem('fb.resume');if(loadGame())startPlaying(false)}}catch(e){}
requestAnimationFrame(frame);
setTimeout(()=>{if(/^#view=/.test(location.hash))openSharedFromHash()},300);

renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();try{if(playing)saveLocal(buildSave())}catch(_){}toast('Graphics were reset','Your browser dropped the 3D view. It will reload in a moment; your world was saved.')});
renderer.domElement.addEventListener('webglcontextrestored',()=>{if(playing){const d=buildSave();saveLocal(d);(account.user?cloudSave(d):Promise.resolve()).finally(()=>{sessionStorage.setItem('fb.resume','1');location.reload()})}else location.reload()});
document.addEventListener('pointerdown',e=>{if(e.target.closest('.btn,.ib,button'))setTimeout(()=>sfx('click'),0)},true);

/* ---------- a short guide the first time someone plays ---------- */
const GUIDE=[
  {sel:null,t:'Welcome, god',b:'Small tribes are waiting for a sign. You never rule them directly. You bless, punish, teach and guide, and watch what they make of it.'},
  {sel:null,t:'Look around',b:'Drag to move. Scroll or pinch to zoom. Right-drag or twist with two fingers to turn. Tap a town to see its people.'},
  {sel:'.status',t:'Belief',b:'Every miracle costs belief. It comes from the people who follow your faiths, so the more faithful they are, the more you can do.'},
  {sel:'#cards',t:'Your powers',b:'Pick a power below, then tap the map. The tabs sort them: People, Faith, Rule, Strife, Land and Sky.'},
  {sel:'[data-panel="faiths"]',t:'Start a faith',b:'Open Faiths and reveal a faith of your own. Bring it to a nation and belief starts to flow.'},
  {sel:'[data-panel="wars"]',t:'Nations and wars',b:'Nations grow, trade, fall out and fight. Wars shows every war being fought, and you can force a peace or start one.'},
  {sel:'.speed',t:'Time',b:'Pause, play or speed up the ages. Your world is saved by itself. Good luck!'}];
let guideI=-1;
function guideShow(){$$('.guide-hi').forEach(e=>e.classList.remove('guide-hi'));const g=GUIDE[guideI];let el=$('#guide');
  if(!g){if(el)el.remove();try{localStorage.setItem('fb.guided','1')}catch(e){}return}
  if(!el){el=document.createElement('div');el.id='guide';el.className='glass guide';document.body.appendChild(el)}
  const tgt=g.sel&&$(g.sel);if(tgt)tgt.classList.add('guide-hi');
  el.innerHTML=`<small>${guideI+1} / ${GUIDE.length}</small><h3>${g.t}</h3><p>${g.b}</p><div class="row" style="gap:8px"><button class="btn" id="gSkip">Skip</button><div class="flex"></div><button class="btn primary" id="gNext">${guideI===GUIDE.length-1?'Begin':'Next'}</button></div>`;
  $('#gSkip').onclick=()=>{guideI=GUIDE.length;guideShow()};$('#gNext').onclick=()=>{guideI++;guideShow()}}
function maybeGuide(){let seen=false;try{seen=localStorage.getItem('fb.guided')==='1'}catch(e){}if(seen||viewOnly||(typeof coopGuest==='function'&&coopGuest()))return;guideI=0;setTimeout(guideShow,900)}
