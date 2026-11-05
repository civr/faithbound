"use strict";
/* Faithbound — long wars and old enemies, world wars, and in the modern age the bomb */

let worldWars=[],nukeLog=[];const ORD=['First','Second','Third','Fourth','Fifth','Sixth'];
const rivalry=(a,b)=>(a.rivals&&a.rivals[b.id])||0;
function addRival(a,b,v){a.rivals=a.rivals||{};b.rivals=b.rivals||{};a.rivals[b.id]=Math.min(5,(a.rivals[b.id]||0)+v);b.rivals[a.id]=Math.min(5,(b.rivals[a.id]||0)+v)}
/* old enemies fight again; two nuclear powers mostly stare at each other */
function grudgeFactor(A,B){let f=1+rivalry(A,B)*.35;if(hasBomb(A)&&hasBomb(B))f*=.35;return f}
/* wars that drag on earn a name */
function longWarTick(){for(const k in warData){const w=warData[k];const [a,b]=k.split('-').map(Number),A=nations[a],B=nations[b];if(!A||!B||!A.alive||!B.alive)continue;
    if(w.years%10===0)addRival(A,B,.3);
    const nm=w.years===30?'Thirty Years’ War':w.years===60?'Long War':w.years===100?'Hundred Years’ War':null;
    if(nm&&!w.named){w.named=nm;log(`The war between ${A.name} and ${B.name} has raged for ${w.years} years. People call it the ${nm}.`,'war');milestone('longwar','A war without end','A war lasted thirty years.')}}}

/* ---------- world wars: when the alliances pull most of the world into one fight ---------- */
function warGroups(){const al=nations.filter(n=>n.alive&&n.wars.size),seen=new Set(),out=[];
  for(const s of al){if(seen.has(s.id))continue;const comp=[],q=[s];seen.add(s.id);while(q.length){const n=q.pop();comp.push(n);for(const id of n.wars){const m=nations[id];if(m&&m.alive&&!seen.has(m.id)){seen.add(m.id);q.push(m)}}}out.push(comp)}return out}
function sides(comp){/* split the fighting nations into two camps: enemies of the strongest, and friends of the strongest */
  const big=comp.slice().sort((a,b)=>b.pop-a.pop)[0],A=new Set([big.id]),B=new Set();let changed=true;
  while(changed){changed=false;for(const n of comp){if(A.has(n.id)||B.has(n.id))continue;if([...n.wars].some(id=>A.has(id))){B.add(n.id);changed=true}else if([...n.wars].some(id=>B.has(id))){A.add(n.id);changed=true}}}
  return [[...A],[...B]]}
const curWW=()=>worldWars.find(w=>!w.end);
function worldWarTick(){const al=nations.filter(n=>n.alive);if(!al.length)return;const tot=al.reduce((s,n)=>s+n.pop,0),top=al.reduce((m,n)=>Math.max(m,n.era),0),ww=curWW();
  if(!ww){if(top<4)return;const last=worldWars.length?worldWars[worldWars.length-1].end||year:-1e9;if(top>=5&&year-last>50&&rng()<.012*mood().war/(1+worldWars.length*.6))escalate();for(const comp of warGroups()){const pop=comp.reduce((s,n)=>s+n.pop,0);if(comp.length>=5&&pop>tot*.35){
      const [a,b]=sides(comp),i=worldWars.length;worldWars.push({n:i,start:year,a,b,deaths:0,end:null});const lead=nations[a[0]],foe=nations[b[0]];
      log(`The ${ORD[i]||(i+1)+'th'} World War has begun. ${comp.length} nations are at war, led by ${lead.name}${foe?' and '+foe.name:''}.`,'doom');
      milestone('worldwar','World war','Most of the world went to war at once.');if(typeof toast==='function')toast('World war',`${comp.length} nations are at war.`);for(const n of comp)n.stab=Math.max(0,stabOf(n)-.1);return}}return}
  /* the war goes on until the camps are exhausted or one side is beaten */
  const inWar=id=>nations[id]&&nations[id].alive&&nations[id].wars.size;ww.deaths+=ww.a.concat(ww.b).filter(inWar).reduce((s,id)=>s+nations[id].pop*.004,0);
  const left=ww.a.filter(inWar).length+ww.b.filter(inWar).length;
  if(left<3||year-ww.start>60){ww.end=year;const pa=ww.a.filter(id=>nations[id]&&nations[id].alive).reduce((s,id)=>s+nations[id].tiles,0),pb=ww.b.filter(id=>nations[id]&&nations[id].alive).reduce((s,id)=>s+nations[id].tiles,0);
    const win=nations[(pa>=pb?ww.a:ww.b)[0]],cap=win&&win.cities[0];
    if(year-ww.start>60)for(const id of ww.a.concat(ww.b)){const n=nations[id];if(!n||!n.alive)continue;for(const o of [...n.wars])if(nations[o])makePeace(n,nations[o],false)}
    log(`The ${ORD[ww.n]||(ww.n+1)+'th'} World War is over after ${year-ww.start} years and ${fmtPop(ww.deaths)} dead.${cap?` The Treaty of ${cap.name} redraws the map; ${win.name} stands victorious.`:''}`,'doom');
    for(const n of al)n.devotion=clamp((n.devotion??.3)+.05,0,1)}}
/* a war between two great powers drags in their allies, rivals and fellow believers */
function escalate(){const big=nations.filter(n=>n.alive).sort((a,b)=>b.pop-a.pop).slice(0,6);let A=null,B=null,best=0;
  for(const a of big)for(const id of a.wars){const b=nations[id];if(b&&b.alive&&a.pop+b.pop>best){best=a.pop+b.pop;A=a;B=b}}
  if(!A){/* tensions between the two greatest neighbours boil over */for(const a of big){const nb=[...a.nb].map(i=>nations[i]).filter(m=>m&&m.alive&&!allied(a,m)).sort((x,y)=>y.pop-x.pop)[0];if(nb){A=a;B=nb;break}}if(!A)return;startWar(A,B,null)}
  for(const n of nations){if(!n.alive||n===A||n===B||n.era<4||n.wars.has(A.id)||n.wars.has(B.id))continue;
    const forA=(allied(n,A)?3:0)+rivalry(n,B)+(n.faith>=0&&n.faith===A.faith&&n.faith!==B.faith?1:0)+(n.nb.has(B.id)?1:0),forB=(allied(n,B)?3:0)+rivalry(n,A)+(n.faith>=0&&n.faith===B.faith&&n.faith!==A.faith?1:0)+(n.nb.has(A.id)?1:0);
    if(Math.max(forA,forB)<1&&rng()>.3)continue;if(forA>=forB)startWar(n,B,'ally');else startWar(n,A,'ally')}}
const wwPeace=(A,B)=>{const ww=curWW();if(!ww||year-ww.start>25)return 1;const ids=ww.a.concat(ww.b);return ids.includes(A.id)&&ids.includes(B.id)?.3:1};

/* ---------- the bomb ---------- */
const hasBomb=n=>n&&n.techs&&n.techs.includes('atomic')&&(n.nukes||0)>0;
function nukeTick(n){if(!n.techs||!n.techs.includes('atomic'))return;if(!n.bombYear){n.bombYear=year;log(`${n.name} tested its first atomic bomb. The world holds its breath.`,'doom');milestone('atom','The atomic age','A nation built the bomb.')}
  if(year%8===n.id%8&&(n.nukes||0)<12)n.nukes=(n.nukes||0)+1;
  if(!n.wars.size||!(n.nukes>0))return;for(const id of n.wars){const B=nations[id];if(!B||!B.alive)continue;const w=warData[warKey(n,B)]||{score:0},losing=(n.id<B.id?-w.score:w.score)>4;
    const p=.0035*(losing?4:1)*(n.aggr+.2)*(hasBomb(B)?.4:1)*(GOVS[n.gov]&&GOVS[n.gov].war>1.5?1.6:1)*(n.gov==='democracy'||n.gov==='federation'?.4:1);if(rng()<p){const c=B.cities.length>1&&rng()<.7?B.cities[1+((rng()*(B.cities.length-1))|0)]:B.cities[0];if(c)nuke(n,B,c,false);return}}}
function nuke(A,B,c,god){if(!c||!A||!B)return;A.nukes=Math.max(0,(A.nukes||0)-1);const i0=c.y*W+c.x,x=wx(c.x),z=wz(c.y);
  const k=B.cities.indexOf(c);if(k>=0){if(k===0&&B.cities.length>1){B.cities.splice(0,1)}else B.cities.splice(k,1)}ruins.push({x:c.x,y:c.y,year,name:c.name,nuke:true});
  B.pop*=.72;B.stab=Math.max(0,stabOf(B)-.25);A.stab=Math.max(0,stabOf(A)-.08);
  if(!window.fallout||fallout.length!==N)window.fallout=new Uint8Array(N);
  brush(i0,1.8,(j,d)=>{fallout[j]=Math.max(fallout[j],Math.round(60*(1-d/2.2)));if(scorched)scorched[j]=Math.max(scorched[j],30);h[j]=Math.max(0,h[j]-.012*(1-d/3))});
  terrainDirty=true;colorDirty=true;propsDirty=true;bordersDirty=true;nukeLog.push(year);nukeFx(x,surfY(x,z),z);
  log(`${god?'At your sign, ':''}${A.name} dropped an atomic bomb on ${c.name}. The city of ${B.name} is gone.`,'doom');milestone('nuke','The flash','A city was destroyed by an atomic bomb.');
  for(const n of nations)if(n.alive){n.devotion=clamp((n.devotion??.3)+.03,0,1);if(n!==A&&n!==B&&rivalry(n,A)<2)addRival(n,A,.5)}
  const recent=nukeLog.filter(y=>year-y<25).length;if(recent>=3&&!nukeLog.winter){climate.temp=Math.max(.1,climate.temp-.1);terrainDirty=true;nukeLog.winter=year;
    log('Ash from the burning cities darkens the sky. A nuclear winter falls on the world.','doom');for(const n of nations)if(n.alive&&rng()<.5)startFamine(n,'cold',false)}
  if(nukeLog.winter&&year-nukeLog.winter>40)nukeLog.winter=0}
/* fallout keeps the land poisoned for decades */
function falloutTick(){if(!window.fallout||fallout.length!==N)return;let any=false;for(let i=0;i<N;i++)if(fallout[i]){fallout[i]--;hab[i]*=.2;any=true;if(owner[i]>=0&&fallout[i]>30&&rng()<.05)claim(i,-1,'fallout')}if(any&&year%10===0)colorDirty=true}

/* ---------- the blast: a flash, a shockwave ring, then a mushroom cloud of smoke rising and spreading ---------- */
PK.nuke={life:6,size:.42,grow:.32,vy:.03,col:[.46,.41,.37],a:.8};PK.nukefire={life:1.6,size:.38,grow:.25,vy:.2,col:[1,.58,.22],a:.9};GLOWK.nukefire=1;
let blasts=[];
const BLAST_M={fire:new THREE.MeshBasicMaterial({color:0xffc070,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}),ring:new THREE.MeshBasicMaterial({color:0xfff0d0,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false})};
function nukeFx(x,y,z){const g=new THREE.Group();g.position.set(x,y,z);
  const ball=new THREE.Mesh(new THREE.SphereGeometry(1,20,14),BLAST_M.fire.clone());g.add(ball);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.9,1,48),BLAST_M.ring.clone());ring.rotation.x=-Math.PI/2;ring.position.y=.02;g.add(ring);
  scene.add(g);blasts.push({g,ball,ring,t:0,x,y,z});flashT=Math.max(flashT,.5);shakeT=1.2;if(typeof sfx==='function')sfx('doom')}
function updateBlasts(dt){for(let q=blasts.length-1;q>=0;q--){const B=blasts[q];B.t+=dt;const t=B.t;
    B.ball.scale.setScalar(.05+Math.min(1,t/.5)*.3);B.ball.material.opacity=Math.max(0,1-t/1.8);B.ball.position.y=Math.min(1.3,t*.5);
    B.ring.scale.setScalar(.1+t*1.5);B.ring.material.opacity=Math.max(0,.8-t*.3);
    const rise=Math.min(1.5,t*.42),cap=.15+rise*.32;
    if(t<9&&dt>0){const k=Math.ceil(dt*60);for(let e=0;e<k;e++){
        const u=rng();emit(t<2.5?'nukefire':'nuke',B.x+(rng()-.5)*.08*(1+rise),B.y+rise*u*.9,B.z+(rng()-.5)*.08*(1+rise),(rng()-.5)*.02,(rng()-.5)*.02);
        for(let c=0;c<3;c++){const a=rng()*6.283,r=cap*(.3+rng()*.7);emit(t<3?'nukefire':'nuke',B.x+Math.cos(a)*r,B.y+rise+(rng()-.3)*cap*.5,B.z+Math.sin(a)*r,Math.cos(a)*.03,Math.sin(a)*.03)}
        if(t<4){const a=rng()*6.283,r=t*.4;emit('dust',B.x+Math.cos(a)*r,B.y+.03,B.z+Math.sin(a)*r,Math.cos(a)*.1,Math.sin(a)*.1)}}}
    if(t>12){scene.remove(B.g);B.g.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose()});blasts.splice(q,1)}}}

/* ---------- one piece of land: pockets and enclaves are absorbed, so a nation never becomes a sieve ---------- */
function consolidate(){const comp=new Int32Array(N).fill(-1),C=[];let changed=false;
  for(let s=0;s<N;s++){if(comp[s]>=0||isWater(s))continue;const o=owner[s],id=C.length,q=[s],tiles=[];comp[s]=id;
    while(q.length){const i=q.pop();tiles.push(i);const x=i%W,y=(i/W)|0;for(let d=0;d<4;d++){const X=x+DX[d],Y=y+DY[d];if(X<0||Y<0||X>=W||Y>=H)continue;const j=Y*W+X;if(comp[j]<0&&!isWater(j)&&owner[j]===o){comp[j]=id;q.push(j)}}}
    C.push({o,tiles})}
  for(let ci=0;ci<C.length;ci++){const c=C[ci],n=c.o>=0?nations[c.o]:null;
    if(n&&n.cities.some(t=>comp[t.y*W+t.x]===ci))continue;
    const nb={};let coast=false;for(const i of c.tiles){const x=i%W,y=(i/W)|0;for(let d=0;d<4;d++){const X=x+DX[d],Y=y+DY[d];if(X<0||Y<0||X>=W||Y>=H){coast=true;continue}const j=Y*W+X;if(isWater(j)){coast=true;continue}const p=owner[j];if(p!==c.o)nb[p]=(nb[p]||0)+1}}
    const ks=Object.keys(nb).map(Number).sort((a,b)=>nb[b]-nb[a]);if(!ks.length)continue;const best=ks[0];
    if(c.o>=0){/* a pocket cut off from every town of its nation: it goes to whoever surrounds it */
      if(best>=0&&nations[best]&&nations[best].alive){for(const i of c.tiles)claim(i,best);changed=true}else if(c.tiles.length<=4){for(const i of c.tiles)claim(i,-1);changed=true}}
    else if(best>=0&&ks.length===1&&!coast&&c.tiles.length<=30&&nations[best]&&nations[best].alive){/* a hole of empty land inside one nation is filled */for(const i of c.tiles)if(hab[i]>=.05)claim(i,best);changed=true}}
  if(changed){bordersDirty=true;propsDirty=true}}
