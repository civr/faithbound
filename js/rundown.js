"use strict";
/* Faithbound — run-down towns.
   Hard times show on a town: after hunger, plague, a siege or a sack, in a poor and unhappy land, in a dying town, or in a town
   its council runs badly. Houses go grey and unpainted, windows are boarded up, roofs get holes, weeds grow by the walls, the
   flower boxes and lanterns disappear, and in the worst towns houses fall in. Big industrial cities in a poor, restless land grow
   slums at their edges. When times get better the town is slowly mended again. */

const SHAB_WHY={decay:'its land is failing',famine:'years of hunger',plague:'the plague',siege:'the siege',sack:'it was sacked',poor:'its people are poor and unhappy',unrest:'unrest',council:'its council'};
function shabbyTarget(n,c){const f={};
  if(c.decay>.1)f.decay=Math.min(1,c.decay*1.1);if(n.famine>0)f.famine=.45;if(n.sick)f.plague=.35;if(c.siege>.05)f.siege=.55;
  if(c.conq&&year-c.conq<20)f.sack=.6*(1-(year-c.conq)/20);const h=typeof happyOf==='function'?happyOf(n):.5,st=typeof stabOf==='function'?stabOf(n):.6;
  if(h<.35)f.poor=(.35-h)*2;if(st<.3)f.poor=Math.max(f.poor||0,(.3-st)*1.6);if((c.unrest||0)>.5)f.unrest=(c.unrest-.5)*.8;
  if(c.mayor){const m=c.mayor;f.council=Math.max(0,(.4-m.happy)*1.8)+(m.debt>2?.25:0)+(m.fed<.8?.3:0);if(f.council<=0)delete f.council}
  let best=null,v=0;for(const k in f)if(f[k]>v){v=f[k];best=k}return {v:clamp(v,0,1),why:best}}
function rundownTick(){for(const n of nations){if(!n.alive)continue;for(const c of n.cities){const T=shabbyTarget(n,c),old=c.shab||0;
    /* things fall apart quicker than they are mended */c.shab=clamp(old+(T.v>old?(T.v-old)*.25:(T.v-old)*.06),0,1);if(c.shab<.02)c.shab=0;
    const lv=shabLevel(c),was=c.shabL||0;if(lv!==was){c.shabL=lv;propsDirty=true;
      if(lv===3&&was<3&&(important(n)||c.mayor||n.id===selected))log(`${c.name} has become run-down: ${SHAB_WHY[T.why]||'hard times'} left it poor and broken.`,'doom');
      if(lv===0&&was>=2&&(important(n)||c.mayor))log(`${c.name} has been mended: fresh paint, new roofs and flowers in the windows again.`,'life')}
    c._shabWhy=T.why;
    /* slums at the edge of a big city in a poor, restless land (switching on and off with some slack, so the city is not rebuilt all the time) */
    const h=typeof happyOf==='function'?happyOf(n):.5,st=typeof stabOf==='function'?stabOf(n):.6,big=n.era>=5&&townLevel(n,n.cities[0]===c)>=9;
    const sl=c.slum?big&&(h<.5||st<.5):big&&(h<.42||st<.4);if(!!sl!==!!c.slum){c.slum=sl?year:0;propsDirty=true}}}}
const shabLevel=c=>{const s=c.shab||0;return s<.15?0:s<.35?1:s<.6?2:3};
{const _t=tick;tick=function(){_t.apply(this,arguments);try{rundownTick()}catch(e){console.warn('rundown',e)}}}

/* ---------- how it looks ---------- */
let SHAB=0,SHAB_C=null;
const dullHex=(h,k)=>{const r=(h>>16)&255,g=(h>>8)&255,b=h&255,gr=(r+g+b)/3*.92;const f=c=>Math.round((c+(gr-c)*k)*(1-k*.32));return (f(r)<<16)|(f(g)<<8)|f(b)};
function shabAt(x,z){/* how worn is this spot: the whole town by its level, and the edge of a big poor city as a slum */
  let f=SHAB/3;if(SHAB_C&&SHAB_C.slum){const d=Math.hypot(x-SHAB_C.x,z-SHAB_C.z);if(d>SHAB_C.R*.62)f=Math.max(f,.55)}return f}
function ruinHouse(x,y,z,rot,w,d,hh,hv){/* a house fallen in: broken walls, a heap of rubble, a charred beam, weeds */
  P('stone',x,y-.02,z,rot,0,-d*.42,0,w*.95,hh*.75+.02,.014,0x9a948a);P('stone',x,y-.02,z,rot,-w*.45,0,0,.014,hh*.55+.02,d*.85,0x9a948a);P('stone',x,y-.02,z,rot,w*.45,-d*.2,0,.014,hh*.35+.02,d*.4,0x9a948a);
  add('stone',x,y-.02,z,w*.6,.045,d*.55,rot+.4,0x8a847a);add('stone',x+w*.15,y-.02,z-d*.1,w*.3,.06,d*.3,rot+1.1,0x7a746a);
  P('box',x,y+.03,z,rot,w*.05,d*.05,0,w*.8,.01,.01,0x3a2e24,.6);P('box',x,y+.02,z,rot,-w*.1,d*.15,0,w*.6,.009,.009,0x4a3a2a,-.4);
  if(typeof greenAdd==='function')for(let q=0;q<2;q++){const bx=x+(hash(hv*3+q)-.5)*w*.8,bz=z+(hash(hv*7+q)-.5)*d*.7;if(groundY(bx,bz)<waterY+.015||riverNear(bx,bz,.03))continue;greenAdd('bush',bx,y-.012,bz,.16,.13,.16,hv*6+q,0x5a6a3a)}}
function wornBits(x,y,z,rot,w,d,hh,hv){/* boarded windows, holes in the roof, weeds by the wall */
  for(const s of [-1,1])if(hash(hv*3+s)<.75){for(const k of [.42,.58])P('box',x,y,z,rot,s*w*.26,d/2+.004,hh*k,w*.3,.011,.005,0x9a7a52)}
  if(hash(hv*5)<.65)for(let q=0;q<2;q++)P('box',x,y+hh+.018,z,rot,(hash(hv*7+q)-.5)*w*.5,(q?-1:1)*d*.18,0,w*.24,.03,d*.2,0x1a1612);
  if(typeof greenAdd==='function'){for(let q=0;q<2;q++){if(hash(hv*11+q)>.75)continue;const a=hv*6.283+q*2.2,bx=x+Math.cos(a)*w*.58,bz=z+Math.sin(a)*d*.58;if(groundY(bx,bz)<waterY+.015||riverNear(bx,bz,.03))continue;greenAdd('bush',bx,y-.014,bz,.13,.1,.13,a,0x6a7a40)}}}
{const _h=house;house=function(x,y,z,rot,w,d,hh,wall,wt,roof,rt,chim,o){if(!SHAB&&!(SHAB_C&&SHAB_C.slum))return _h.apply(this,arguments);
  const f=shabAt(x,z),hv=hash(x*91.3+z*57.1);if(f<=0||hv>=f*.95)return _h.apply(this,arguments);
  if(f>.7&&hv<f*.2){ruinHouse(x,y,z,rot,w,d,hh,hv);return}
  _h.call(this,x,y,z,rot,w,d,hh,wall,dullHex(wt,.62),roof,roof==='thatch'?0x8a8270:dullHex(rt,.55),false,Object.assign({},o||{},{garden:false,lamp:false}));wornBits(x,y,z,rot,w,d,hh,hv)}}
{const _f=flatHouse;flatHouse=function(x,y,z,rot,w,d,hh,col,hk,opt){if(!SHAB&&!(SHAB_C&&SHAB_C.slum))return _f.apply(this,arguments);
  const f=shabAt(x,z),hv=hash(x*91.3+z*57.1);if(f<=0||hv>=f*.95)return _f.apply(this,arguments);
  if(f>.7&&hv<f*.16){ruinHouse(x,y,z,rot,w,d,hh,hv);return}_f.call(this,x,y,z,rot,w,d,hh,dullHex(col,.62),hk,{});wornBits(x,y,z,rot,w,d,hh-.012,hv)}}
{const _cb=cozyBits;cozyBits=function(sl){if((SHAB||SHAB_C&&SHAB_C.slum)&&hash(sl.x*31.7+sl.z*17.3)<shabAt(sl.x,sl.z)*1.6)return;return _cb.apply(this,arguments)}}
if(typeof addB==='function'){const _ab=addB;addB=function(name,x,y,z,w,d,rot,tint){if((SHAB||SHAB_C&&SHAB_C.slum)&&!/temple|pantheon|castle|torii|keep/.test(name)){const f=shabAt(x,z);if(f>0&&hash(x*91.3+z*57.1)<f*.95){arguments[7]=dullHex(tint==null?0xffffff:tint,.62);const r=_ab.apply(this,arguments);if(r)wornBits(x,y+.01,z,rot,w*.8,d*.8,w*.6,hash(x*7+z));return r}}return _ab.apply(this,arguments)}}
{const _bc=buildCity;buildCity=function(n,c){const lv=c?shabLevel(c):0,slum=c&&c.slum&&n.era>=5;
  SHAB=lv;SHAB_C=slum?{x:wx(c.x),z:wz(c.y),R:c._townR||.9,slum:true}:null;try{return _bc.apply(this,arguments)}finally{SHAB=0;SHAB_C=null}}}
{const _ck=cityKey;cityKey=function(n,c){const k=_ck.apply(this,arguments);if(!c)return k;const lv=shabLevel(c),slum=c.slum&&n.era>=5;return lv||slum?k+'|S'+lv+(slum?'s':''):k}}

/* the nation card names its run-down towns; the town panel shows its condition */
{const _rn=renderNationCard;renderNationCard=function(){_rn.apply(this,arguments);const n=selected>=0?nations[selected]:null;if(!n||!n.alive)return;const el=$('#nationCard');if(!el)return;const kv=el.querySelector('.kv');if(!kv||kv.querySelector('[data-shab]'))return;
  const d=n.cities.filter(c=>shabLevel(c)>=2);if(!d.length)return;const v=document.createElement('div');v.dataset.shab='1';v.innerHTML=`<span>Run-down</span><b style="color:#d8b07a">${d.slice(0,3).map(c=>esc(c.name)).join(', ')}${d.length>3?' +'+(d.length-3):''}</b>`;kv.appendChild(v)}}
const SHAB_WORD=['Well kept','Worn','Shabby','Run-down'];
