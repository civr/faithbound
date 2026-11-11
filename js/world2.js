"use strict";
/* Faithbound — temples that grow with faith, seasons, rising seas and dikes, carrying and following people, shared worlds */

/* ---------- sacred sites: a wayside shrine, a temple, a cathedral, a great temple complex ---------- */
const devTier=n=>{const d=n.devotion??.3;return d<.22?0:d<.5?1:d<.78?2:3};
function sacredSite(f,n,x,y,z,e,rot,cap){const fc=parseInt(f.color.slice(1),16),t=Math.min(devTier(n),cap?3:2),W_=0xece6da,ST=0xd8d1c4;
  if(t===0){/* a wayside shrine */P('stone',x,y-.02,z,rot,0,0,0,.05,.05,.05,ST);P('pyr',x,y+.03,z,rot,0,0,0,.06,.035,.06,fc);P('glowB',x,y+.01,z,rot,0,.026,0,.008,.012,.002,0xffd890);return}
  if(t===1){temple(f,x,y,z,e,rot);return}
  if(e<=2){/* a stepped great temple */for(let k=0;k<4;k++){const s=.28-k*.06;P('stone',x,y-.02+k*.045,z,rot,0,0,0,s,.05,s,k%2?ST:0xe0d8c8)}
    P('stone',x,y+.16,z,rot,0,0,0,.08,.06,.08,W_);P('dome',x,y+.22,z,rot,0,0,0,.07,.06,.07,fc);P('stone',x,y-.02,z,rot,0,.16,0,.05,.012,.06,0xc8c0b0);
    if(t===3)for(const s of [-1,1])for(const u of [-1,1]){P('stone',x,y-.02,z,rot,s*.2,u*.2,0,.05,.12,.05,ST);P('pyr',x,y+.1,z,rot,s*.2,u*.2,0,.06,.05,.06,fc)}return}
  if(e<=5){/* a cathedral: long nave, transept, twin towers with spires, a rose window */
    P('stone',x,y-.02,z,rot,0,0,0,.14,.13,.32,W_);P('tiles',x,y+.11,z,rot,0,0,0,.15,.08,.33,ROOF_SLATE[0],Math.PI/2);
    P('stone',x,y-.02,z,rot,0,-.04,0,.3,.11,.1,W_);P('tiles',x,y+.09,z,rot,0,-.04,0,.31,.07,.11,ROOF_SLATE[0]);
    for(const s of [-1,1]){P('stone',x,y-.02,z,rot,s*.05,.17,0,.06,.27,.06,ST);P('coneTile',x,y+.25,z,rot,s*.05,.17,0,.065,.14,.065,fc)}
    P('glowB',x,y+.07,z,rot,0,.162,0,.04,.04,.003,0xffc860);P('dome',x,y+.12,z,rot,0,-.04,0,.06,.06,.06,fc);
    if(t===3){/* a cloister and a bishop's palace */for(const s of [-1,1])P('stone',x,y-.02,z,rot,s*.2,.05,0,.03,.06,.26,ST);P('stone',x,y-.02,z,rot,0,-.2,0,.4,.06,.03,ST);P('stone',x,y-.02,z,rot,.22,-.12,0,.1,.09,.08,0xe6dccb)}return}
  /* modern and future: a great dome on a colonnade */
  P('stone',x,y-.02,z,rot,0,0,0,.3,.04,.3,0xf2f0ea);for(let k=0;k<12;k++){const a=k/12*6.283;add('cyl',x+Math.cos(a)*.11,y+.02,z+Math.sin(a)*.11,.008,.09,.008,0,0xf4f2ee)}
  add('cyl',x,y+.11,z,.13,.015,.13,0,0xf4f2ee);add('dome',x,y+.12,z,.2,.16,.2,0,fc);add('cyl',x,y+.28,z,.01,.08,.01,0,0xffe8a0);add('ring',x,y+.12,z,.24,1,.24);
  if(t===3)for(const s of [-1,1])for(const u of [-1,1]){add('cyl',x+s*.2,y,z+u*.2,.02,.28,.02,0,0xf4f2ee);add('glowB',x+s*.2,y+.28,z+u*.2,.012,.012,.012,0,0xffe8a0)}}

/* ---------- seasons: a year turns while you watch ---------- */
let seasonT=.25;const SEASONS=['Spring','Summer','Autumn','Winter'];
const seasonName=()=>SEASONS[Math.floor(((seasonT%1)+1)%1*4)];
function seasonAmounts(){const p=((seasonT%1)+1)%1;const tri=(c,w)=>{let d=Math.abs(p-c);d=Math.min(d,1-d);return clamp(1-d/w,0,1)};return {snow:tri(.875,.2),autumn:tri(.625,.17)}}
const SEASON_C={grass:new THREE.Color(),tree:new THREE.Color()};
function updateSeasons(dt,k){terrU.uHalfH.value=H/2;if(settings.seasons===false){terrU.uSnow.value=0;terrU.uAutumn.value=0;return}seasonT+=dt*k/90;const s=seasonAmounts(),cold=clamp(1.15-climate.temp*1.2,.3,1);
  terrU.uSnow.value=s.snow*cold;terrU.uAutumn.value=s.autumn;
  if(KITS.grass){const w=s.snow*cold*.12;KITS.grass.mesh.material.color.setRGB(1+s.autumn*.25+w-s.snow*.06,1-s.autumn*.05+w-s.snow*.04,1-s.autumn*.35+w)}
  if(typeof treeMat!=='undefined')treeMat.color.setRGB(1+s.autumn*.45+s.snow*cold*.08,1-s.autumn*.08+s.snow*cold*.08,1-s.autumn*.5+s.snow*cold*.12)}
/* a harsh winter can starve the cold north */
function winterTick(n){if(!n.cities.length||n.famine>0)return;const c=n.cities[0],lat=Math.abs(c.y/(H-1)-.5)*2;if(lat<.45)return;
  if(rng()<.006*dLevel()*lat*(1.4-climate.temp)){if(important(n))log(`A harsh winter gripped ${n.name}. The stores ran out before spring.`,'doom');startFamine(n,'cold',false)}}

/* ---------- rising seas: low towns build dikes, move inland or drown ---------- */
function seaTick(){if(year%5!==0)return;
  for(const n of nations){if(!n.alive)continue;for(const c of n.cities.slice()){const j=c.y*W+c.x;if(c.dike){if(h[j]<sea+.016){h[j]=sea+.016;terrainDirty=true}continue}
      if(h[j]>=sea+.012)continue;
      if(n.era>=4||(n.era>=3&&rng()<.4)){c.dike=year;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=c.x+dx,Y=c.y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;const q=Y*W+X;if(h[q]<sea+.016&&h[q]>sea-.05){h[q]=sea+.016;if(owner[q]<0)claim(q,n.id)}}
        terrainDirty=true;propsDirty=true;log(`The sea rose against ${c.name}. ${n.name} built dikes to hold it back.`,'sky');milestone('dike','Dikes against the sea','A town held back the rising sea.');continue}
      const k=n.cities.indexOf(c),nj=bestSite(n,c.x,c.y,4);
      if(nj>=0&&nj!==j&&h[nj]>sea+.03){const old=c.name;c.x=nj%W;c.y=(nj/W)|0;c._plan=null;propsDirty=true;log(`The sea swallowed the old streets of ${old}. Its people rebuilt it further inland.`,'sky')}
      else if(k>0){n.cities.splice(k,1);ruins.push({x:c.x,y:c.y,year,name:c.name});propsDirty=true;log(`${c.name} of ${n.name} was lost beneath the rising sea.`,'doom')}}}}
function dikeRing(c,cx,cz){const r=.42;for(let k=0;k<20;k++){const a=k/20*6.283,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r,t=tileAt(x,z);if(t>=0&&!isWater(t)&&groundY(x,z)>waterY+.05)continue;
    add('stone',x,waterY-.06,z,.07,.11,.035,-a+Math.PI/2,0x7d7a62)}}

/* ---------- carrying and following people ---------- */
let carry=null,followId=null;
function carryPick(i){const x=wx(i%W),z=wz((i/W)|0);
  const pr=prophets.find(p=>Math.hypot(p.x-x,p.z-z)<.8);if(pr){carry={kind:'prophet',p:pr};pr.wait=1e9;say('You hold the prophet. Tap land to set him down.',true);return true}
  const o=owner[i];if(o<0)return false;const n=nations[o];const hero=heroOf(n);if(hero&&hero.died==null){carry={kind:'hero',id:hero.id,from:n.id};say(`You hold the hero ${hero.name} of ${n.name}. Tap another nation to set them down.`,true);return true}
  const r=rulerOf(n);if(!r||r.machine){say(`${n.name} has no one you can lift.`);return false}carry={kind:'ruler',id:r.id,from:n.id};say(`You hold ${rulerLabel(n)} of ${n.name}. Tap another nation to set them down.`,true);return true}
function carryDrop(i){const c=carry;if(!c)return false;const x=wx(i%W),z=wz((i/W)|0);
  if(c.kind==='prophet'){if(isWater(i)){say('Set the prophet down on land.');return false}c.p.x=x;c.p.z=z;c.p.tile=i;c.p.wait=1.5;c.p.seen.clear();prophetNext(c.p);for(let k=0;k<12;k++)emit('holy',x,groundY(x,z)+.05,z);carry=null;log('You carried the prophet to a new land.','faith');return true}
  const o=owner[i];if(o<0){say('Set them down inside a nation.');return false}const to=nations[o],from=nations[c.from],p=per(c.id);if(!p||p.died!=null){carry=null;return false}if(to===from){say('Pick a different nation.');return false}
  if(c.kind==='hero'){from.hero=null;to.hero={p:p.id,until:year+30,wins:0};p.nation=to.id;log(`You lifted the hero ${p.name} out of ${from.name} and set them down in ${to.name}.`,'era')}
  else{const lab=rulerLabel(from),dead={p,title:titleOf(from,p),label:reignName(from,from.reigns[from.reigns.length-1])};p.nation=to.id;succeed(from,null);
    crown(to,p,'god');to.house=p.house;to.upheaval=year;log(`By your hand ${lab} vanished from ${from.name} and was set on the throne of ${to.name}. ${rulerLabel(from)} now rules ${from.name}.`,'era')}
  const cap=to.cities[0];if(cap)for(let k=0;k<12;k++)emit('holy',wx(cap.x)+(rng()-.5)*.3,groundY(wx(cap.x),wz(cap.y))+.05,wz(cap.y)+(rng()-.5)*.3);carry=null;return true}
/* follow one person through their life: the camera stays on their town, a card tells their story */
function followPerson(id){followId=id;closeModal();renderFollow()}
function whereIs(p){const n=nations[p.nation];if(!n||!n.alive)return null;if(n.ruler===p.id||!n.cities.length)return n.cities[0];return n.cities.find(c=>c.governor===p.id)||n.cities[0]}
function renderFollow(){const el=$('#follow');if(!el)return;const p=per(followId);if(!p||!playing){el.hidden=true;return}el.hidden=false;const n=nations[p.nation];
  const life=annals.filter(a=>a.y>=p.born&&(p.died==null||a.y<=p.died)&&a.t.includes(p.name)).slice(-4).reverse();const role=n&&n.ruler===p.id?titleOf(n,p):n&&heroOf(n)===p?'Hero':n?'Of '+n.name:'';
  el.innerHTML=`<div class="fh">${n?portrait(p,n,40):''}<div><b>${esc(p.name)}</b><small>${esc(role)}${n?' · '+esc(n.name):''} · ${p.died!=null?'died '+p.died+' aged '+ageOf(p)+(p.cause?', '+esc(p.cause):''):'age '+ageOf(p)}</small></div><button class="ib x" data-unfollow aria-label="Stop following">✕</button></div>
    <div class="fl">${p.traits.map(t=>TRAITS[t]?`<span class="tag">${TRAITS[t].label}</span>`:'').join(' ')}</div>${life.length?`<ul>${life.map(a=>`<li><time>Y${a.y}</time>${esc(a.t)}</li>`).join('')}</ul>`:''}
    ${p.died!=null&&n&&rulerOf(n)?`<button class="btn" data-follow="${rulerOf(n).id}">Follow ${esc(rulerLabel(n))}</button>`:''}`}
function followTick(){const p=per(followId);if(!p)return;const c=p.died==null?whereIs(p):null;if(c){const x=wx(c.x),z=wz(c.y);if(Math.hypot(camT.x-x,camT.z-z)>.4)focusOn(x,z,Math.min(camDist,6))}renderFollow()}
document.addEventListener('click',e=>{if(e.target.closest('[data-unfollow]')){followId=null;renderFollow();return}const f=e.target.closest('[data-follow]');if(f)followPerson(+f.dataset.follow)});

/* ---------- shared worlds: anyone with the link can watch, nothing they do is saved ---------- */
let viewOnly=false;
async function shareWorld(slot){const r=await api('/api/share/'+encodeURIComponent(slot),{json:{}});if(!r.ok){toast('Could not share',(r.data&&r.data.error)||'Try again.');return}
  const link=location.origin+location.pathname+'#view='+r.data.token;openModal(`<h2>Share this world</h2><p class="note">Anyone with this link can watch the world. They cannot change your save.</p>
    <input type="text" readonly value="${esc(link)}" id="shareLink" style="width:100%"><div class="row" style="gap:8px"><button class="btn primary" id="shareCopy">Copy link</button><button class="btn danger" data-unshare="${esc(slot)}">Stop sharing</button><div class="flex"></div><button class="btn" data-p="close">Close</button></div>`);
  $('#shareCopy').onclick=()=>{const i=$('#shareLink');i.select();try{navigator.clipboard.writeText(i.value)}catch(_){document.execCommand('copy')}toast('Link copied','Send it to whoever you like.')}}
document.addEventListener('click',async e=>{const s=e.target.closest('[data-share]');if(s){shareWorld(s.dataset.share);return}
  const u=e.target.closest('[data-unshare]');if(u){await api('/api/share/'+encodeURIComponent(u.dataset.unshare),{method:'DELETE',headers:{'Content-Type':'application/json'}});closeModal();toast('Sharing stopped','The old link no longer works.')}});
async function openSharedFromHash(){const m=location.hash.match(/^#view=([a-f0-9]{16,64})$/);if(!m)return false;
  try{const r=await fetch('/api/shared/'+m[1],{credentials:'same-origin'});if(!r.ok)throw 0;const d=await r.json();if(!d.owner&&r.headers.get('X-Owner'))d.owner=decodeURIComponent(r.headers.get('X-Owner'));applySave(d);viewOnly=true;startPlaying(false);
    document.body.classList.add('viewonly');toast('Watching a shared world',`${d.worldName||'A world'} by ${d.owner||'another god'}. Nothing you do here is saved.`);return true}
  catch(_){toast('That shared world could not be opened','The link may have been withdrawn.');return false}}
