"use strict";
/* Faithbound — the loading screen. When a world opens (the first visit, Begin, Continue or a loaded save) the land, towns, fields,
   roads and forests round the camera are built one piece per frame, and every new kind of surface is compiled for the graphics card
   the first time it is drawn. Without a cover that looks like a frozen game. Now a loading screen covers it: time stands still,
   the pieces are built as fast as they can be, the shaders are compiled, and the screen fades out when the view is ready. */

const LOADS={on:false,t0:0,done:0,idle:0,compiled:false,step:'',hideT:0};
const LOAD_MAX=40000;
function loadEl(){return document.getElementById('fbLoad')}
function loadingShow(sub){const el=loadEl();if(!el)return;clearTimeout(LOADS.hideT);el.hidden=false;el.classList.remove('out');
  LOADS.on=true;LOADS.t0=performance.now();LOADS.done=0;LOADS.idle=0;LOADS.compiled=false;
  const s=el.querySelector('.ld-sub');if(s)s.textContent=sub||'Shaping the world';loadBar(.04,'Shaping the land');
  try{propsDirty=true;lastProps=-1e9}catch(e){}}
function loadBar(f,step){const el=loadEl();if(!el)return;const b=el.querySelector('.ld-bar i');if(b)b.style.transform='scaleX('+clamp(f,0,1).toFixed(3)+')';
  if(step&&step!==LOADS.step){LOADS.step=step;const t=el.querySelector('.ld-step');if(t)t.textContent=step}}
function loadingHide(){const el=loadEl();LOADS.on=false;if(!el)return;loadBar(1,'Ready');el.classList.add('out');LOADS.hideT=setTimeout(()=>{el.hidden=true},520)}
/* what the next piece of work is, in words */
function loadWhat(){const j=jobs[0];if(!j)return propsDirty?'Raising the towns':terrainDirty?'Shaping the land':'Planting the forests';
  if(j.terr)return 'Shaping the land';if(j===rebuildCities)return 'Raising the towns';if(j===rebuildFields)return 'Ploughing the fields';return 'Laying roads and planting forests'}
function loadBusy(){return jobs.length>0||terrainDirty||(typeof LAY_PEND!=='undefined'&&LAY_PEND)||propsDirty}
{const _fb=frameBody;frameBody=function(now){if(!LOADS.on)return _fb.apply(this,arguments);
    /* while loading no time passes, and the next round of building starts at once instead of waiting its turn */
    const sp=speedIdx;speedIdx=0;acc=0;if(propsDirty&&!jobs.length)lastProps=-1e9;
    try{return _fb.apply(this,arguments)}finally{speedIdx=sp;acc=0;try{loadTick(now)}catch(e){loadingHide()}}}}
function loadTick(now){const t=now-LOADS.t0;
  if(loadBusy()){LOADS.idle=0;LOADS.done++;loadBar(Math.min(.88,.06+.82*LOADS.done/(LOADS.done+jobs.length+4)),loadWhat())}
  else{/* everything is built: compile what the camera sees, draw a few settled frames, then show the world */
    if(!LOADS.compiled){LOADS.compiled=true;loadBar(.92,'Preparing the light and water');try{renderer.compile(scene,cam)}catch(e){}}
    LOADS.idle++;loadBar(.92+LOADS.idle*.02,'Preparing the light and water');if(LOADS.idle>=4&&t>700)loadingHide()}
  if(t>LOAD_MAX)loadingHide()}
/* a new world, a world begun, continued or loaded */
{const _sp=startPlaying;startPlaying=function(fresh){const r=_sp.apply(this,arguments);loadingShow(fresh?'Your world begins':'Welcome back');return r}}
{const _gw=genWorld;genWorld=function(){const r=_gw.apply(this,arguments);if(typeof frameBody==='function')loadingShow('Shaping a new world');return r}}
/* the first visit: the screen is already up from the page itself */
LOADS.on=!!loadEl();LOADS.t0=performance.now();
