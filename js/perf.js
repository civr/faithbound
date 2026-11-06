"use strict";
/* Faithbound — keeping it smooth on slow computers.
   The graphics chip is recognised at start (laptop chips begin at a lighter detail level, a browser drawing without
   the graphics card at the lightest), and while you play the frame rate is watched: when the screen cannot keep up even
   at reduced resolution, detail steps down a level; when there is plenty to spare for a while, it steps back up.
   Levels: 0 full · 1 no post effects, smaller shadows · 2 forests cast no shadows, simple shapes sooner, fewer trees
   · 3 no shadows · 4 lightest. */
const PERF={tier:0,base:0,gpu:'',soft:false,lodK:1,treeK:1,folkD:12,minScale:.6,bad:0,good:0,cool:0,shadowOff:false,said:false};
(function detectGpu(){try{const gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info'),s=String(ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER));PERF.gpu=s;
  if(/swiftshader|basic render|llvmpipe|software|softpipe/i.test(s)){PERF.soft=true;PERF.base=3}
  else if(/intel|uhd|iris|hd graphics|radeon\(tm\)( [\w ]*)? graphics|radeon vega|vega \d+ graphics|mali|adreno|powervr|videocore/i.test(s)&&!/arc a\d/i.test(s))PERF.base=2}catch(e){}})();
function perfOn(){return settings.autoPerf!==false&&settings.power!=='max'}
function setShadowsLive(on){if(on===renderer.shadowMap.enabled)return;renderer.shadowMap.enabled=on;sunL.castShadow=on;scene.traverse(o=>{if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true)})}
function applyTier(t){t=Math.max(0,Math.min(4,t));PERF.tier=t;
  PERF.lodK=[1,.8,.6,.45,.35][t];PERF.treeK=[1,1,.8,.6,.45][t];PERF.folkD=[12,10,8,6,5][t];PERF.minScale=[.6,.6,.55,.5,.45][t];
  /* shadows: smaller maps from level 1, none from level 3 */
  if(settings.shadows){setShadowsLive(t<3);const want=t>=1?1024:null;if(want&&sunL.shadow.mapSize.x>want){if(sunL.shadow.map){sunL.shadow.map.dispose();sunL.shadow.map=null}sunL.shadow.mapSize.set(want,want)}
    else if(!want&&typeof applyGraphics==='function'&&sunL.shadow.mapSize.x<(settings.quality==='high'?2048:settings.quality==='medium'?2048:1024))applyGraphics()}
  /* forests stop casting shadows from level 2: thousands of trees drawn a second time for the sun */
  if(typeof KITS!=='undefined')for(const n in KITS){const K=KITS[n];if(K.cast0===undefined)K.cast0=K.mesh.castShadow;const tree=(typeof TREE_KITS!=='undefined'&&TREE_KITS.includes(n))||/^lo_/.test(n)||n==='townTree';K.mesh.castShadow=K.cast0&&!(tree&&t>=2)}
  if(typeof CULLK!=='undefined')CULLK.dirty=true;if(typeof treesDirty!=='undefined')treesDirty=true;if(typeof resize==='function')resize();
  if(typeof shadowForce!=='undefined')shadowForce=true}
/* post effects (outlines, focus blur, colour grading) are full-screen passes: the first thing a laptop chip gives up */
{const _pa=postActive;postActive=function(){return _pa()&&!(perfOn()&&PERF.tier>=1)}}
/* watch the frame rate */
setInterval(()=>{if(!perfOn()||typeof frameEMA==='undefined'||typeof playing==='undefined'||!playing||document.hidden)return;
  const cap=typeof fpsCap==='function'?fpsCap():60,want=1000/(cap||60),r=frameEMA/want,now=performance.now();if(now<PERF.cool)return;
  if(r>1.35&&dynScale<=PERF.minScale+.06){if(++PERF.bad>=3&&PERF.tier<4){PERF.bad=0;PERF.good=0;applyTier(PERF.tier+1);PERF.cool=now+6000}}else PERF.bad=0;
  if(r<.8&&dynScale>=.99){if(++PERF.good>=30&&PERF.tier>Math.max(0,PERF.base-1)){PERF.good=0;applyTier(PERF.tier-1);PERF.cool=now+15000}}else PERF.good=0},1000);
document.addEventListener('DOMContentLoaded',()=>{if(perfOn())applyTier(PERF.base);
  if(PERF.soft&&!PERF.said&&typeof say==='function'){PERF.said=true;setTimeout(()=>say('Your browser is drawing without the graphics card, so the game runs slowly. Turn on hardware acceleration in the browser settings.'),4000)}});
function perfNote(){const lv=['full','high','balanced','light','lightest'][PERF.tier];
  return `Detail is now <b>${lv}</b>${PERF.base>=2&&!PERF.soft?' (a laptop graphics chip was found, so the game starts lighter)':''}. ${PERF.soft?'<b>The browser is not using the graphics card: turn on hardware acceleration in its settings.</b> ':''}<span class="dim">${(PERF.gpu||'').replace(/[<>&]/g,'').slice(0,80)}</span>`}
