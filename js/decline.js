"use strict";
/* Faithbound — towns that die.
   A town lives off the land around it: fields, water, fish, and in later ages trade and the railway. When that runs out (the land
   turns to desert or ice, the river dries up, the soil is poisoned by fallout or the forest is gone), the town shrinks year by year,
   houses stand empty, and at last its people leave. What is left becomes a ruin that the grass or the sand slowly covers, and
   a big town that dies this way can live on in legend. A nation that loses its only town this way packs up and moves to better land. */

/* how well can the land round a town feed and water it: 0 nothing, about 1 a good place */
function livelihood(n,c){const x=c.x,y=c.y;let farm=0,fn=0,riv=0,wat=0,sea_=0,ice=0,dry=0,poison=0;
  for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const d=Math.hypot(dx,dy);if(d>3.2)continue;const q=Y*W+X;
    if(isWater(q)){if(d<=2.3){wat++;if(biome[q]===0)sea_++}continue}
    const w=owner[q]===n.id||owner[q]<0?1:.5;farm+=hab[q]*w;fn++;if(d<=1.5&&river[q])riv++;
    if(biome[q]===10||biome[q]===9)ice++;if(biome[q]===7)dry++;if(window.fallout&&fallout[q]>20)poison++}
  const fert=fn?farm/fn:0,j=y*W+x;
  let water=riv?.2:wat?.15:0;if(!water){const B=brookTiles();for(let dy=-2;dy<=2&&!water;dy++)for(let dx=-2;dx<=2;dx++){const X=x+dx,Y=y+dy;if(X>=0&&Y>=0&&X<W&&Y<H&&B.has(Y*W+X)){water=.12;break}}}
  const fish=sea_&&climate.temp>.25?.12:0;
  /* later ages bring food from elsewhere: harbours, roads and above all the railway */
  const e=n.era,trade=(e>=3&&(n.trade||[]).length?.08:0)+(e>=4&&sea_?.08:0)+(e>=5&&(c.rail||(n.techs||[]).includes('railroads'))?.2:0)+(e>=6?.25:0);
  const res=fert+water+fish+trade-(poison?.4:0);
  const why=poison>3?'poison':ice>fn*.5?'ice':dry>fn*.5||fert<.25&&!water?'dry':!water&&!fish?'water':'land';
  return {res,why,fert,water:water>0}}

const DECAY_WHY={dry:'its fields have turned to dust',ice:'the ice has buried its fields',poison:'the land round it is poisoned',water:'its wells have run dry',land:'the land can no longer feed it'};
const DECAY_GO={dry:'The desert took it.',ice:'The ice took it.',poison:'No one could live there any more.',water:'Without water, no one could stay.',land:'The land could no longer feed it.'};
let DECAY_TL=0;
function abandonTown(n,c,L){const k=n.cities.indexOf(c);if(k<0)return;const lv=townLevel(n,k===0),share=n.pop/Math.max(1,n.cities.length);
  n.cities.splice(k,1);ruins.push({x:c.x,y:c.y,year,name:c.name,abandoned:L.why});n.pop=Math.max(1,n.pop-share*.4);propsDirty=true;bordersDirty=true;
  /* most people move to the other towns; the fields round the old town go back to the wild */
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const X=c.x+dx,Y=c.y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const q=Y*W+X;if(owner[q]===n.id&&!n.cities.some(o=>Math.hypot(o.x-X,o.y-Y)<4)&&rng()<.6)claim(q,-1)}
  if(lv>=6&&typeof addLegend==='function')addLegend({name:c.name,x:c.x,y:c.y,kind:'abandoned',lv,nation:n.name,why:L.why});
  const cap=k===0&&n.cities.length?n.cities[0]:null;
  log(`${c.name} of ${n.name} has been abandoned. ${DECAY_GO[L.why]}${cap?` ${n.name} moved its capital to ${cap.name}.`:''}`,important(n)?'doom':'life');
  milestone('abandoned','Ghost town','A town was abandoned when its land gave out.')}
function moveNation(n,c,L){/* the only town: the people pack up and look for better land */
  let best=-1,bs=.55;for(let q=0;q<500;q++){const a=rng()*6.283,r=4+rng()*12,X=Math.round(c.x+Math.cos(a)*r),Y=Math.round(c.y+Math.sin(a)*r);if(X<1||Y<1||X>=W-1||Y>=H-1)continue;const j=Y*W+X;
    if(owner[j]>=0&&owner[j]!==n.id||nearCity(X,Y,8))continue;const s=siteScore(j);if(s>bs){bs=s;best=j}}
  if(best<0)return false;const old={x:c.x,y:c.y,name:c.name};ruins.push({x:c.x,y:c.y,year,name:c.name,abandoned:L.why});
  c.x=best%W;c.y=(best/W)|0;c._plan=null;c.decay=0;c.dying=0;c.born=year;n.pop*=.7;
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const X=c.x+dx,Y=c.y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const q=Y*W+X;if(!isWater(q)&&owner[q]<0)claim(q,n.id)}
  propsDirty=true;bordersDirty=true;log(`The people of ${n.name} left ${old.name}, ${DECAY_WHY[L.why]}, and built a new home on better land.`,important(n)?'era':'life');return true}

function declineTick(){for(const n of nations){if(!n.alive)continue;for(const c of n.cities.slice()){
    if(c._resY==null||year-c._resY>=5){c._res=livelihood(n,c);c._resY=year}const L=c._res;if(!L)continue;
    const young=year-(c.born||0)<30,thr=.36;
    if(L.res<thr&&!young){c.decay=(c.decay||0)+(thr-L.res)*.09+.004+(n.famine>0?.01:0)}
    else if(c.decay>0)c.decay=Math.max(0,c.decay-(L.res>.45?.02:.005));
    if(!c.decay){c.dying=0;continue}
    if(c.decay>.3&&!c.dying){c.dying=year;if(important(n)||n.id===selected||c.mayor)log(`${c.name} of ${n.name} is dying: ${DECAY_WHY[L.why]}. Houses stand empty and families are leaving.`,'doom')}
    if(c.decay<.15&&c.dying){if(year-c.dying>5&&(important(n)||c.mayor))log(`${c.name} has recovered; people are moving back.`,'life');c.dying=0}
    if(c.decay>=1){
      if(c.mayor){c.decay=.95;const m=c.mayor;m.P*=.97;continue}/* a town you govern lives or dies by your choices */
      if(n.cities.length>1)abandonTown(n,c,L);else if(!moveNation(n,c,L)){c.decay=.9;n.pop*=.97}}}}}
{const _t=tick;tick=function(){_t.apply(this,arguments);try{declineTick()}catch(e){console.warn('decline',e)}}}

/* a dying town shrinks on screen: empty plots, fewer houses */
{const _bc=buildCity;buildCity=function(n,c){DECAY_TL=c&&c.decay>.1?-Math.round(c.decay*14):0;try{return _bc.apply(this,arguments)}finally{DECAY_TL=0}}}
{const _tl=townLevel;townLevel=function(n,cap){const v=_tl.apply(this,arguments);return DECAY_TL?Math.max(1,v+DECAY_TL):v}}
{const _ck=cityKey;cityKey=function(n,c){const k=_ck.apply(this,arguments);return c&&c.decay>.1?k+'|D'+Math.round(c.decay*14):k}}

/* the nation card names its dying towns */
{const _rn=renderNationCard;renderNationCard=function(){_rn.apply(this,arguments);const n=selected>=0?nations[selected]:null;if(!n||!n.alive)return;const el=$('#nationCard');if(!el)return;const kv=el.querySelector('.kv');if(!kv||kv.querySelector('[data-dying]'))return;
  const d=n.cities.filter(c=>c.decay>.3);if(!d.length)return;const v=document.createElement('div');v.dataset.dying='1';v.innerHTML=`<span>Dying</span><b style="color:#f0a196">${d.slice(0,3).map(c=>esc(c.name)).join(', ')}${d.length>3?' +'+(d.length-3):''}</b>`;kv.appendChild(v)}}
/* people of a town that is gone (abandoned, sacked or drowned) leave the streets with it */
{const _uw=updateWalkers;updateWalkers=function(dt){if((updateWalkers._p=(updateWalkers._p||0)-dt)<=0){updateWalkers._p=1.5;const live=new Set();for(const n of nations)if(n.alive)for(const c of n.cities)live.add(c);
    for(let q=walkers.length-1;q>=0;q--){const w=walkers[q];if(w.ci&&!w.sol&&!live.has(w.ci))walkers.splice(q,1)}}return _uw.apply(this,arguments)}}
