"use strict";
/* Faithbound — co-op. One player hosts: their browser runs the world. Friends join with an invite link,
   see the same world live, keep their own belief and send every miracle to the host, who works it for them.
   The server only relays messages (Server-Sent Events down, small POSTs up). */

let coop=null;
/* tools that only look or open a dialog: a guest uses these on its own copy */
const COOP_LOCAL=new Set(['inspect','reform','climate']);
const COOP_START_BELIEF=60,COOP_PUMP=1500;
const coopGuest=()=>!!(coop&&coop.role==='guest');
const coopHosting=()=>!!(coop&&coop.role==='host');
const coopMe=()=>coop?coop.players.find(p=>p.pid===coop.pid):null;
const coopName=pid=>{const p=coop&&coop.players.find(q=>q.pid===pid);return p?p.name:pid===0?'The host':'A friend'};
const coopColor=pid=>{const p=coop&&coop.players.find(q=>q.pid===pid);return p?p.color:'#e0b44a'};
function coopDefaultName(){try{return localStorage.getItem('fb.coopName')||account.user||''}catch(e){return account.user||''}}
function coopSaveName(n){try{localStorage.setItem('fb.coopName',n)}catch(e){}}

function coopSend(t,d,to){if(!coop)return Promise.resolve();const body={t,d};if(to!=null)body.to=to;
  return fetch(`/api/coop/send/${coop.room}?tok=${coop.tok}`,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(body)}).then(r=>{if(r.status===403||r.status===404)coopEnded('The co-op world was closed.')}).catch(()=>{})}
function coopConnect(){if(coop.es)coop.es.close();const es=new EventSource(`/api/coop/stream/${coop.room}?tok=${coop.tok}`);coop.es=es;
  es.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch(_){return}try{coopOnMsg(m)}catch(err){console.error('coop',m.t,err)}};
  es.onopen=()=>{coop.online=true;coopBadge()};
  es.onerror=()=>{if(!coop)return;coop.online=false;coopBadge();if(es.readyState===2){if(++coop.fails>4)coopEnded('Lost the connection to the co-op world.');else setTimeout(()=>{if(coop&&coop.es===es)coopConnect()},2500)}}}

/* ---------- start, join and leave ---------- */
async function coopHost(name){if(coop)return;if(!playing){say('Start or load a world first.');return}
  const r=await api('/api/coop/host',{json:{name,world:worldOpts.name||'A world'}});
  if(!r.ok){toast('Could not open your world',r.data&&r.data.error||'Co-op needs the Faithbound server. Play on your own server, not a preview.');return false}
  coopSaveName(name);
  coop={role:'host',room:r.data.room,tok:r.data.tok,pid:0,color:r.data.color,players:[{pid:0,name,color:r.data.color,on:true,host:true}],pools:{},ctx:{},cursors:{},chat:[],lastY:year,sent:{},k:0,fails:0,online:false};
  coopConnect();coop.timer=setInterval(coopPump,COOP_PUMP);coopBadge();log(`${name} opened this world to other gods.`,'faith');return true}
async function coopJoin(room,name){room=String(room||'').toUpperCase().replace(/[^A-Z0-9]/g,'');if(room.length!==6){say('An invite code has 6 letters and numbers.');return false}
  const r=await api('/api/coop/join/'+room,{json:{name}});
  if(!r.ok){toast('Could not join',r.data&&r.data.error||'That co-op world could not be reached.');return false}
  coopSaveName(name);
  coop={role:'guest',room:r.data.room,tok:r.data.tok,pid:r.data.pid,color:r.data.color,hostName:r.data.host,world:r.data.world,players:[],cursors:{},chat:[],ready:false,fails:0,online:false};
  coopConnect();coopBadge();openModal(`<h2>Joining ${esc(r.data.world)}</h2><p class="note">Waiting for ${esc(r.data.host||'the host')} to send the world…</p>`);return true}
function coopLeave(){if(!coop)return;const c=coop;fetch(`/api/coop/leave/${c.room}?tok=${c.tok}`,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:'{}',keepalive:true}).catch(()=>{});
  coopStop();if(c.role==='guest'){worldOpts.slot=null;toast('You left the shared world','You keep a copy of it to play on your own.')}else toast('Co-op closed','Your world is yours alone again.')}
/* a host who reloads the page picks the shared world up again */
function coopRemember(){if(!coopHosting())return;try{sessionStorage.setItem('fb.coopHost',JSON.stringify({room:coop.room,tok:coop.tok,color:coop.color,name:(coopMe()||{}).name||'Host',pools:coop.pools,slot:worldOpts.slot||null,at:Date.now()}))}catch(e){}}
function coopResume(){if(coop)return;let d=null;try{d=JSON.parse(sessionStorage.getItem('fb.coopHost')||'null')}catch(e){}if(!d||Date.now()-d.at>110000||(d.slot&&worldOpts.slot&&d.slot!==worldOpts.slot))return;
  coop={role:'host',room:d.room,tok:d.tok,pid:0,color:d.color,players:[{pid:0,name:d.name,color:d.color,on:true,host:true}],pools:d.pools||{},ctx:{},cursors:{},chat:[],lastY:year,sent:{},k:0,fails:0,online:false};
  coopConnect();coop.timer=setInterval(coopPump,COOP_PUMP);coopBadge();toast('Your shared world is open again','Your friends are still here.');setTimeout(()=>{if(coopHosting())coopSend('snap',coopSnapshot())},1500)}
{const _sp=startPlaying;startPlaying=function(fresh){const r=_sp(fresh);if(!fresh)setTimeout(coopResume,400);return r}}
function coopStop(){if(!coop)return;try{sessionStorage.removeItem('fb.coopHost')}catch(e){}if(coop.es)coop.es.close();clearInterval(coop.timer);clearTimeout(coop.soon);coop=null;coopBadge();if(location.hash.startsWith('#coop='))history.replaceState(null,'',location.pathname+location.search)}
function coopEnded(why){if(!coop)return;const g=coopGuest();coopStop();if(g){worldOpts.slot=null;toast('The shared world closed',(why||'The host left.')+' You keep a copy to play on your own.')}}
addEventListener('pagehide',()=>{if(coopHosting()){coopRemember();return}/* the host may only be reloading: the world stays open for two minutes */if(coop)try{fetch(`/api/coop/leave/${coop.room}?tok=${coop.tok}`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',keepalive:true})}catch(e){}});

/* ---------- messages ---------- */
function coopOnMsg(m){if(!coop)return;const t=m.t;
  if(t==='ping')return;
  if(t==='hello'){coop.players=m.list||coop.players;coop.fails=0;if(coopGuest())coopSend('need',{});coopBadge();return}
  if(t==='players'){coop.players=m.list||[];coopBadge();coopRefresh();return}
  if(t==='join'){if(coopHosting()){if(coop.pools[m.pid]==null)coop.pools[m.pid]=COOP_START_BELIEF;toast(`${m.name} joined`,'A new god walks your world.')}return}
  if(t==='leave'){toast(`${m.name} left`,'');delete coop.cursors[m.pid];return}
  if(t==='end'){coopEnded(m.why);return}
  if(t==='cur'){coop.cursors[m.from]={x:m.d.x,z:m.d.z,at:performance.now()};return}
  if(t==='chat'){const txt=String(m.d&&m.d.m||'').slice(0,200);coop.chat.push({pid:m.from,m:txt});if(coop.chat.length>30)coop.chat.shift();toast(coopName(m.from),txt);coopRefresh();return}
  if(coopHosting()){
    if(t==='need'){coopSend('snap',coopSnapshot(),m.from);return}
    if(t==='cmd'){coopRunCmd(m.from,m.d||{});return}
    return}
  /* guest */
  if(t==='snap'){coopFirstWorld(m.d);return}
  if(t==='live'){if(coop.ready)coopApply(m.d);return}
  if(t==='ack'){coopAck(m.d||{});return}
  if(t==='fx'){coopShowFx(m.d||{});return}
  if(t==='ev'){if(coop.ready)coopReplay(m.d||{});return}}

/* ---------- host: send the world ---------- */
function coopSnapshot(){const d=buildSave();d.coopPools=coop.pools;return d}
const coopSum=a=>{if(!a)return 0;let s=0;const st=Math.max(1,(a.length/4000)|0);for(let i=0;i<a.length;i+=st)s=(s*31+((a[i]*4096)|0))|0;return s+a.length};
function coopLive(full){
  const d={y:year,sp:speedIdx,cl:climate,dt:dayT,o:b64(owner),bl:belief,pools:coop.pools,rates:coop.rates||{},
    nat:nations.map(n=>Object.assign({},n,{wars:[...n.wars],nb:[],front:[],_walk:0,_resMod:null,cities:n.cities.map(c=>{const o={};for(const k in c)if(k[0]!=='_')o[k]=c[k];return o})})),
    fa:faiths,lg:logs.slice(0,40),wdat:warData,ru:ruins,ww:worldWars,co:colonies,pt:planets,ms:[...milestones],mi:milestoneInfo,deps:deposits,cv:coves,fl:flags};
  const hs=coopSum(h),ms=coopSum(moistD),ws=coopSum(warmD),rs=coopSum(river);
  if(full||hs!==coop.sent.h){d.h=b64(h);coop.sent.h=hs}
  if(full||ms!==coop.sent.m){d.md=b64(moistD);coop.sent.m=ms}
  if(warmD&&warmD.length===N&&(full||ws!==coop.sent.w)){d.wd=b64(warmD);coop.sent.w=ws}
  if(full||rs!==coop.sent.r){d.riv=b64(river);d.rivers=rivers;coop.sent.r=rs}
  if(full||coop.k%8===0){d.folk=folk;d.folkId=folkId;d.houses=houses}
  if(full){d.an=annals;d.hi=hist;d.sn=snaps}
  return d}
/* every god's belief comes from the peoples who follow that god's own faiths */
function coopIncome(pid,pool){let inc=.45;for(const n of nations)if(n.alive&&n.faith>=0&&faiths[n.faith]&&(faiths[n.faith].god|0)===pid)inc+=Math.cbrt(n.pop)*.045*ten(n).belief*(.6+(n.devotion??.3));return inc/(1+Math.max(0,pool-200)/200)}
function coopFollowers(pid){let k=0,ppl=0;for(const n of nations)if(n.alive&&n.faith>=0&&faiths[n.faith]&&(faiths[n.faith].god|0)===pid){k++;ppl+=n.pop*POPMUL[n.era]}return {k,ppl}}
function coopPump(){if(!coopHosting()||!playing)return;coop.k++;coop.rates=coop.rates||{};coop.rates[0]=beliefRate;
  const dy=year-coop.lastY;if(dy>0){for(const p of coop.players)if(p.pid){const pool=coop.pools[p.pid]??COOP_START_BELIEF,r=coopIncome(p.pid,pool);coop.rates[p.pid]=r;coop.pools[p.pid]=pool+r*dy}coop.lastY=year}else if(dy<0)coop.lastY=year;
  if(coop.players.filter(p=>p.pid&&p.on).length===0)return;
  coopSend('live',coopLive(coop.k%40===0));if(coop.k%10===0)coopRemember()}
function coopSoon(){if(!coopHosting())return;clearTimeout(coop.soon);coop.soon=setTimeout(()=>{if(coopHosting()&&playing)coopSend('live',coopLive(false))},120)}

/* ---------- host: work a guest's miracle with that guest's belief and choices ---------- */
function coopRun(pid,fn){const ctx=coop.ctx[pid]||(coop.ctx[pid]={warFrom:-1,carry:null,migrFrom:null,selectedFaith:-1});
  const sv={belief,tool,warFrom,carry,migrFrom,selectedFaith,selected,inspectTile,curTab,say,openSheet,openModal,openGov,focusOn,renderNationCard,setTool,toast};const who=coopName(pid);
  belief=coop.pools[pid]??COOP_START_BELIEF;warFrom=ctx.warFrom;carry=ctx.carry;migrFrom=ctx.migrFrom;selectedFaith=ctx.selectedFaith;
  const msgs=[],noop=()=>{};say=m=>{msgs.push(String(m))};openSheet=noop;openModal=noop;openGov=noop;focusOn=noop;renderNationCard=noop;coop.running=pid;toast=(a,b,x,z)=>sv.toast(a,String(b||'').replace(/^Your /,who+'’s ').replace(/\byou\b/g,who),x,z);
  setTool=id=>{tool=id;ctx.tool=id;if(id!=='carry')carry=null;if(id!=='war'&&id!=='ally')warFrom=-1;if(id!=='migrate')migrFrom=null};tool=ctx.tool||'inspect';
  let r,spent=0;const b0=belief;
  try{r=fn(ctx)}catch(e){console.error('coop cmd',e);msgs.push('That did not work.')}
  finally{spent=b0-belief;coop.pools[pid]=belief;Object.assign(ctx,{warFrom,carry,migrFrom,selectedFaith});
    belief=sv.belief;tool=sv.tool;warFrom=sv.warFrom;carry=sv.carry;migrFrom=sv.migrFrom;selectedFaith=sv.selectedFaith;selected=sv.selected;inspectTile=sv.inspectTile;curTab=sv.curTab;
    say=sv.say;openSheet=sv.openSheet;openModal=sv.openModal;openGov=sv.openGov;focusOn=sv.focusOn;renderNationCard=sv.renderNationCard;setTool=sv.setTool;toast=sv.toast;coop.running=null;
    buildDock();if(selected>=0)renderNationCard()}
  return {r,msgs,spent,ctx}}
function coopRunCmd(pid,c){if(!playing)return;const name=coopName(pid);
  if(c.k==='tool'){const P=POWERS.find(p=>p.id===c.tool);if(!P||COOP_LOCAL.has(c.tool)||!Number.isInteger(c.i)||c.i<0||c.i>=N)return;
    const res=coopRun(pid,ctx=>{if(tool!==c.tool)setTool(c.tool);if(c.wf>=0&&(c.tool==='war'||c.tool==='ally'))warFrom=c.wf;if(c.sf>=0&&faiths[c.sf])selectedFaith=c.sf;applyTool(c.i,!!c.start)});
    if(res.spent>0){coopSend('fx',{by:pid,tool:c.tool,i:c.i});if(c.start)toast(name,`used ${P.label}${owner[c.i]>=0&&nations[owner[c.i]]?' on '+nations[owner[c.i]].name:''}.`,wx(c.i%W),wz((c.i/W)|0))}
    if(c.start||res.msgs.length)coopSend('ack',{k:'tool',msgs:res.msgs,wf:res.ctx.warFrom,sf:res.ctx.selectedFaith,carry:!!res.ctx.carry,mf:!!res.ctx.migrFrom},pid);coopSoon();return}
  if(c.k==='act'&&c.a==='speed'){if(doAct('speed',c.p||{}))toast(name,['paused the world.','set the world to normal speed.','sped the world up.','set the world racing.'][c.p.s|0]||'changed the speed.');coopSoon();return}
  if(c.k==='act'&&['guide','gov','clim','found','peace','space'].includes(c.a)){const p=Object.assign({},c.p||{});if(c.a==='found'){p.by=name;p.pid=pid}
    const res=coopRun(pid,ctx=>{const r=doAct(c.a,p);if(c.a==='found'&&r>=0)selectedFaith=r;return r});
    if(res.spent>0)toast(name,{guide:'guided a nation\'s scholars.',gov:'changed how a nation is ruled.',clim:'changed the climate of the world.',peace:'forced a peace.',space:'worked a wonder on another world.',found:`revealed the faith ${p.name}.`}[c.a]);
    coopSend('ack',{k:c.a,r:res.r,name:p.name,msgs:res.msgs,sf:res.ctx.selectedFaith},pid);coopSoon()}}
/* the host's own miracles also show up for the guests */
{const _apply=applyTool;applyTool=function(i,start){const b0=belief;const r=_apply(i,start);
  if(coopHosting()&&coop.running==null&&start&&tool!=='inspect'&&belief<b0){coopSend('fx',{by:0,tool,i});coopSoon()}return r}}

/* ---------- disasters: when one begins on the host, the guests see it begin too ---------- */
const COOP_EV={spawnStorm:a=>a,startWildfire:a=>a,spawnLocusts:a=>a,spawnKraken:a=>a,eruptVolcano:a=>a,riverFlood:a=>a,tsunami:a=>[a[0],a[1],a[2]?a[2].id:-1]};
for(const f in COOP_EV){const orig=window[f];if(typeof orig!=='function')continue;
  window[f]=function(...a){const r=orig.apply(this,a);if(coopHosting()&&!coop.replay)try{coopSend('ev',{f,a:COOP_EV[f](a),by:coop.running==null?0:coop.running})}catch(e){}return r}}
function coopReplay(d){const f=window[d.f];if(!COOP_EV[d.f]||typeof f!=='function'||!Array.isArray(d.a))return;const a=d.a.slice();if(d.f==='tsunami')a[2]=nations[a[2]]||null;
  const sv=toast,who=coopName(d.by|0);if((d.by|0)!==coop.pid)toast=(t,b,x,z)=>sv(t,String(b||'').replace(/^Your /,who+'’s ').replace(/\byou\b/g,who),x,z);
  try{coop.replay=true;f.apply(null,a)}catch(e){console.error('coop ev',e)}finally{coop.replay=false;toast=sv}}
/* ---------- guest: send taps, take in the world ---------- */
function coopCmd(i,start){if(!coop.ready)return;const now=performance.now();if(!start&&now-(coop.lastSculpt||0)<100)return;coop.lastSculpt=now;
  coopSend('cmd',{k:'tool',tool,i,start:!!start,wf:warFrom,sf:selectedFaith});
  if(start&&tool!=='raise'&&tool!=='lower'&&tool!=='smooth')sfx('click')}
function coopAct(a,p){coopSend('cmd',{k:'act',a,p})}
function coopAck(d){for(const m of d.msgs||[])say(m);
  if(d.k==='tool'){if(d.wf>=0)warFrom=d.wf;if(d.sf>=0)selectedFaith=d.sf;if((d.msgs||[]).some(m=>/Found a faith first/.test(m)))openSheet('faiths')}
  if(d.k==='found'&&d.r>=0){coopWhenFaith(d.r,()=>afterFound(d.r,d.name||'your faith'))}}
function coopWhenFaith(idx,fn,tries){if(faiths[idx]||(tries|0)>20){fn();return}setTimeout(()=>coopWhenFaith(idx,fn,(tries|0)+1),200)}
const FXKIND={rain:'rain',drought:'drought',plague:'plague',famine:'drought',faith:'faith',prophet:'faith',inspire:'faith',schism:'faith',bless:'bless',festival:'bless',miracle:'bless',golden:'bless',fertile:'bless',forest:'bless',anoint:'bless'};
function coopShowFx(d){if(!Number.isInteger(d.i)||d.i<0||d.i>=N)return;const P=POWERS.find(p=>p.id===d.tool);
  fx(d.i,FXKIND[d.tool]||'bless');if(d.by!==coop.pid){sfx('power');if(P)toast(coopName(d.by),`used ${P.label}${owner[d.i]>=0&&nations[owner[d.i]]?' on '+nations[owner[d.i]].name:''}.`,wx(d.i%W),wz((d.i/W)|0))}}
function coopFirstWorld(d){if(coop.ready){coopApply(coopFromSave(d));return}
  try{applySave(d)}catch(e){console.error(e);coopEnded('The world could not be loaded.');return}
  worldOpts.calendar=false;viewOnly=false;coop.ready=true;if(d.coopPools&&d.coopPools[coop.pid]!=null)belief=d.coopPools[coop.pid];
  closeModal();startPlaying(false);toast(`Welcome to ${worldOpts.name||'the world'}`,`${coop.hostName||'The host'} runs the years. Your miracles use your own belief.`);coopBadge()}
function coopFromSave(d){return {y:d.year,cl:d.climate,o:d.owner16,nat:d.nations,fa:d.faiths,lg:d.logs,wdat:d.warData,ru:d.ruins,ww:d.worldWars,co:d.colonies,pt:d.planets,ms:d.milestones,mi:d.mi,deps:d.deps,cv:d.coves,
  h:d.h,md:d.md,wd:d.wd,riv:d.riv,rivers:d.rivers,folk:d.folk,folkId:d.folkId,houses:d.houses,an:d.annals,hi:d.hist,sn:d.snaps,pools:d.coopPools||{}}}
function coopApply(d){
  year=d.y;if(d.sp!=null)speedIdx=d.sp;
  const t0=climate.temp,r0=climate.rain;if(d.cl)Object.assign(climate,d.cl);let terr=climate.temp!==t0||climate.rain!==r0;
  if(d.h){const a=unb64(d.h,Float32Array);if(a.length===N){h.set(a);terr=true}}
  if(d.md){const a=unb64(d.md,Float32Array);if(a.length===N){moistD.set(a);terr=true}}
  if(d.wd){const a=unb64(d.wd,Float32Array);if(a.length===N){warmD=a;terr=true}}
  if(d.riv){const a=unb64(d.riv,Uint8Array);if(a.length===N){river.set(a);rivers=d.rivers||rivers;terr=true}}
  if(terr)terrainDirty=true;
  if(d.o&&!(typeof rewind!=='undefined'&&rewind)){const o=unb64(d.o,Int16Array);if(o.length===N){let ch=false;for(let i=0;i<N;i++)if(owner[i]!==o[i]){ch=true;break}if(ch){owner.set(o);bordersDirty=true}}}
  if(d.nat){/* keep the same objects: towns are cached by object, so only changed towns are rebuilt */
    for(const nd of d.nat){let n=nations[nd.id];const old=n?n.cities:[];if(!n){n={};nations[nd.id]=n}
      const cities=nd.cities.map(c=>{const o=old.find(q=>q.x===c.x&&q.y===c.y);if(!o)return c;for(const k in o)if(k[0]!=='_'&&!(k in c))delete o[k];return Object.assign(o,c)});
      Object.assign(n,nd,{wars:new Set(nd.wars),nb:n.nb instanceof Set?n.nb:new Set(),front:n.front||[],_walk:n._walk||0,cities})}
    nations.length=d.nat.length;propsDirty=true}
  if(d.fa)faiths=d.fa.map(f=>Object.assign({tenets:f.tenets||[f.tenet],glyph:f.glyph||'star'},f));
  if(d.lg)logs=d.lg;if(d.wdat)warData=d.wdat;if(d.ru)ruins=d.ru;if(d.ww)worldWars=d.ww;if(d.co)colonies=d.co;if(d.pt)planets=d.pt;
  if(d.ms)milestones=new Set(d.ms);if(d.mi)Object.assign(milestoneInfo,d.mi);if(d.cv)coves=d.cv;if(d.fl)flags=d.fl;
  if(d.deps&&d.deps.length!==deposits.length){deposits=d.deps;indexDeposits()}else if(d.deps)deposits=d.deps;
  if(d.folk){folk=d.folk;folkId=d.folkId;houses=d.houses||houses}if(d.an)annals=d.an;if(d.hi)hist=d.hi;if(d.sn)snaps=d.sn;
  if(d.pools&&d.pools[coop.pid]!=null)belief=d.pools[coop.pid];if(d.rates&&d.rates[coop.pid]!=null)beliefRate=d.rates[coop.pid];
  if(selected>=0&&(!nations[selected]||!nations[selected].alive)){selected=-1;inspectTile=-1}
  if(selected>=0&&performance.now()-(coop.lastCard||0)>2000){coop.lastCard=performance.now();renderNationCard()}
  if(typeof spaceView!=='undefined'&&spaceView&&typeof refreshPlanet==='function'&&performance.now()-(coop.lastPlanet||0)>2000){coop.lastPlanet=performance.now();refreshPlanet()}
  if(sheetPanel&&performance.now()-(coop.lastSheet||0)>2500){coop.lastSheet=performance.now();renderSheet(false)}}

/* ---------- cursors: see where the other gods are looking ---------- */
let coopCurAt=0;
addEventListener('pointermove',e=>{if(!coop||!playing||e.target!==renderer.domElement)return;const now=performance.now();if(now-coopCurAt<220)return;coopCurAt=now;
  const i=pickTile(e.clientX,e.clientY);if(i<0)return;coopSend('cur',{x:+(wx(i%W)).toFixed(2),z:+(wz((i/W)|0)).toFixed(2)})},{passive:true});
{const _draw=drawOverlay;drawOverlay=function(now){_draw(now);if(!coop||!playing)return;const dpr=ov.width/innerWidth,t=performance.now();
  for(const pid in coop.cursors){const c=coop.cursors[pid];if(t-c.at>8000)continue;const y=groundY(c.x,c.z),[sx,sy,sz]=project(c.x,y,c.z);if(sz>1)continue;
    const col=coopColor(+pid),a=1-Math.max(0,(t-c.at-5000)/3000),r=(9+3*Math.sin(t/260))*dpr;octx.globalAlpha=a;
    octx.strokeStyle=col;octx.lineWidth=2.5*dpr;octx.beginPath();octx.arc(sx,sy,r,0,Math.PI*2);octx.stroke();
    octx.font=`600 ${Math.round(12*dpr)}px "Marcellus SC", Georgia, serif`;octx.textAlign='center';octx.textBaseline='bottom';const nm=coopName(+pid),tw=octx.measureText(nm).width;
    octx.fillStyle='rgba(20,16,10,.72)';octx.fillRect(sx-tw/2-6*dpr,sy-r-20*dpr,tw+12*dpr,17*dpr);octx.fillStyle=col;octx.fillText(nm,sx,sy-r-5*dpr);octx.globalAlpha=1;octx.textAlign='left'}}}

/* ---------- the Together panel ---------- */
function coopLink(){return `${location.origin}${location.pathname}#coop=${coop.room}`}
function coopBadge(){const b=$('#coopBtn');if(!b)return;const n=coop?coop.players.filter(p=>p.on).length:0;b.classList.toggle('on',!!coop);const s=b.querySelector('em');if(s)s.textContent=coop&&n>1?n:'';}
function coopPanelHTML(){
  if(!coop){const nm=esc(coopDefaultName());return `<h2>Play together</h2><p class="note">Invite friends into this world. Your browser runs the years; every god keeps their own belief and works their own miracles. Friends only need the link.</p>
    <div class="sec"><span class="lab">Your name as a god</span><input id="coopName" type="text" maxlength="20" value="${nm}" placeholder="Your name"></div>
    <div class="row" style="gap:8px"><button class="btn" data-p="close">Close</button><div class="flex"></div><button class="btn primary" data-coop="host">Invite friends</button></div>
    <div class="sec"><span class="lab">Have a code?</span><div class="row" style="gap:8px"><input id="coopCode" type="text" maxlength="6" placeholder="ABC123" style="text-transform:uppercase;flex:1"><button class="btn" data-coop="join">Join</button></div><p class="note">Joining leaves this world. It stays saved.</p></div>`}
  const pl=coop.players.map(p=>`<li><i class="dot" style="background:${p.color}"></i><b>${esc(p.name)}</b>${p.host?' <span class="tag">Host</span>':''}${p.pid===coop.pid?' <span class="tag">You</span>':''}${p.on?'':' <small>(away)</small>'}${(()=>{const f=coopFollowers(p.pid),fs=faiths.filter(x=>(x.god|0)===p.pid).map(x=>esc(x.name));return `<small style="margin-left:auto;text-align:right">${fs.length?fs.join(', ')+' · '+f.k+' nation'+(f.k===1?'':'s'):'No faith yet'}${coopHosting()&&p.pid?' · '+Math.floor(coop.pools[p.pid]??COOP_START_BELIEF)+' belief':''}</small>`})()}</li>`).join('');
  const chat=coop.chat.slice(-8).map(c=>`<li><b style="color:${coopColor(c.pid)}">${esc(coopName(c.pid))}</b> ${esc(c.m)}</li>`).join('');
  return `<h2>${coopHosting()?'Your shared world':'A shared world'}</h2>
    ${coopHosting()?`<div class="sec"><span class="lab">Invite link</span><div class="row" style="gap:8px"><input type="text" id="coopLinkI" readonly value="${esc(coopLink())}" style="flex:1"><button class="btn primary" data-coop="copy">Copy</button></div><p class="note">Or give them the code <b class="code">${coop.room}</b>. Anyone with it can join while your world is open.</p></div>`
      :`<p class="note">${esc(coop.hostName||'The host')} runs the years and the speed. Your miracles are sent to their world and use your own belief.</p>`}
    <p class="note">Rival gods: each god earns belief only from the peoples who follow their own faiths. Reveal a faith, spread it, and keep your followers from turning to another god.</p>
    <div class="sec"><span class="lab">Gods in this world</span><ul class="coopl">${pl}</ul></div>
    <div class="sec"><span class="lab">Talk</span><ul class="coopc">${chat||'<li class="note">No words yet.</li>'}</ul><div class="row" style="gap:8px"><input id="coopMsg" type="text" maxlength="200" placeholder="Say something" style="flex:1"><button class="btn" data-coop="say">Send</button></div></div>
    <div class="row" style="gap:8px"><button class="btn danger" data-coop="leave">${coopHosting()?'Close to others':'Leave'}</button><div class="flex"></div><button class="btn primary" data-p="close">Back to the world</button></div>`}
function openCoop(){openModal(coopPanelHTML());$('#modalBox').dataset.coop='1';const i=$('#coopMsg');if(i)i.onkeydown=e=>{if(e.key==='Enter')coopChat()}}
function coopRefresh(){const mb=$('#modalBox');if(!$('#modal').hidden&&mb.dataset.coop==='1'&&$('#coopMsg')){const v=$('#coopMsg').value,f=document.activeElement&&document.activeElement.id==='coopMsg';openCoop();$('#coopMsg').value=v;if(f)$('#coopMsg').focus()}}
function coopChat(){const i=$('#coopMsg');if(!i||!coop)return;const m=i.value.trim();if(!m)return;i.value='';coop.chat.push({pid:coop.pid,m});coopSend('chat',{m});coopRefresh()}
$('#modalBox').addEventListener('click',async e=>{const b=e.target.closest('[data-coop]');if(!b)return;const a=b.dataset.coop;
  if(a==='host'){const nm=($('#coopName').value||'').trim()||'Host';b.disabled=true;if(await coopHost(nm))openCoop();else b.disabled=false}
  if(a==='join'){const nm=($('#coopName').value||'').trim()||'Guest',code=$('#coopCode').value;if(playing&&!coopGuest())saveGame();b.disabled=true;if(!await coopJoin(code,nm))b.disabled=false}
  if(a==='joinlink'){const nm=($('#coopName').value||'').trim()||'Guest';b.disabled=true;if(!await coopJoin(b.dataset.room,nm))b.disabled=false}
  if(a==='copy'){const v=coopLink();try{await navigator.clipboard.writeText(v);toast('Link copied','Send it to your friends.')}catch(_){$('#coopLinkI').select()}}
  if(a==='say')coopChat();
  if(a==='leave'){coopLeave();closeModal()}});
{const _open=openModal;openModal=function(html){const r=_open(html);$('#modalBox').dataset.coop='';return r}}
/* an invite link opens straight into the join screen */
function coopFromHash(){const m=location.hash.match(/^#coop=([A-Za-z0-9]{6})$/);if(!m)return false;const room=m[1].toUpperCase();
  openModal(`<h2>Join a shared world</h2><p class="note">A friend invited you into their world. Their browser runs the years; you work your own miracles with your own belief.</p>
    <div class="sec"><span class="lab">Your name as a god</span><input id="coopName" type="text" maxlength="20" value="${esc(coopDefaultName())}" placeholder="Your name"></div>
    <div class="row" style="gap:8px"><button class="btn" data-p="close">Not now</button><div class="flex"></div><button class="btn primary" data-coop="joinlink" data-room="${room}">Join ${room}</button></div>`);return true}
setTimeout(coopFromHash,350);addEventListener('hashchange',coopFromHash);
$('#coopBtn')&&($('#coopBtn').onclick=openCoop);
