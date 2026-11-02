"use strict";
/* Faithbound — faiths that split: schisms, branches, holy wars, saints and pilgrims */

function faithRoot(f){let i=f;const seen=new Set();while(faiths[i]&&faiths[i].parent!=null&&!seen.has(i)){seen.add(i);i=faiths[i].parent}return i}
const sameRoot=(a,b)=>a>=0&&b>=0&&a!==b&&faithRoot(a)===faithRoot(b);
function holyCityOf(fi){const F=faiths[fi];if(!F||!F.holy)return null;for(const n of nations)if(n.alive)for(const c of n.cities)if(c.name===F.holy)return {n,c};return null}
const followersOf=fi=>nations.filter(n=>n.alive&&n.faith===fi&&n.cities.length);
function hueShift(hex,deg){const [r,g,b]=hexRgb(hex).map(v=>v/255),mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,d=mx-mn;let h=0,s=0;
  if(d){s=d/(1-Math.abs(2*l-1));h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;h*=60}h=(h+deg+360)%360;
  const C=(1-Math.abs(2*l-1))*s,X=C*(1-Math.abs((h/60)%2-1)),m=l-C/2,[R,G,B]=h<60?[C,X,0]:h<120?[X,C,0]:h<180?[0,C,X]:h<240?[0,X,C]:h<300?[X,0,C]:[C,0,X];
  return '#'+[R,G,B].map(v=>Math.round((v+m)*255).toString(16).padStart(2,'0')).join('')}
/* split a faith: the nations far from its holy city, or around the one you chose, form a new branch */
function schism(fi,seed,god){const F=faiths[fi];if(!F)return -1;const fol=followersOf(fi);if(fol.length<2)return -1;
  const hc=holyCityOf(fi),hx=hc?hc.c.x:fol[0].cities[0].x,hy=hc?hc.c.y:fol[0].cities[0].y;
  const dist=n=>Math.hypot(n.cities[0].x-hx,n.cities[0].y-hy);
  const s0=seed&&seed.faith===fi?seed:fol.slice().sort((a,b)=>dist(b)-dist(a))[0];
  const sx=s0.cities[0].x,sy=s0.cities[0].y;let split=fol.filter(n=>Math.hypot(n.cities[0].x-sx,n.cities[0].y-sy)<dist(n)*.9||n===s0);
  if(split.length>=fol.length){split=split.filter(n=>!(hc&&n===hc.n));if(split.length>=fol.length)split=split.slice(0,fol.length-1)}if(!split.length)return -1;
  const base=F.name.replace(/^The /,''),dx=sx-hx,dy=sy-hy,dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'East':'West'):(dy>0?'South':'North');
  const forms=[`The Reformed ${base}`,`The True ${base}`,`${F.name} of the ${dir}`,`The Free ${base}`,`The Old ${base}`,`The New ${base}`];let name=forms[(rng()*forms.length)|0];
  if(faiths.some(f=>f.name===name))name=`${F.name} of the ${dir}`+(faiths.some(f=>f.name===`${F.name} of the ${dir}`)?' '+ROMAN[2+faiths.length%8]:'');
  const keys=Object.keys(TENETS),ten0=(F.tenets||[F.tenet]),nt=[ten0[0]];const pool=keys.filter(k=>!ten0.includes(k));nt.push(pool[(rng()*pool.length)|0]);
  const nf={name,tenets:nt,glyph:F.glyph,color:hueShift(F.color,40+rng()*60),founded:year,holy:s0.cities[0].name,parent:fi};faiths.push(nf);const ni=faiths.length-1;
  for(const n of split){n.faith=ni;n.convert={};n.devotion=clamp((n.devotion??.3)+.04,0,1)}propsDirty=true;
  log(`${god?'At your word, a':'A'} schism split ${F.name}: ${split.map(n=>n.name).slice(0,3).join(', ')}${split.length>3?' and others':''} now follow ${name}, with its holy city at ${nf.holy}.`,'faith');
  milestone('schism','Schism','A faith split in two.');return ni}
function faithTick(){if(year%10!==0)return;
  faiths.forEach((F,fi)=>{const fol=followersOf(fi);if(!fol.length)return;
    if(fol.length>=4&&year-(F.founded||0)>120&&rng()<.012*(fol.length-3))schism(fi,null,false);
    if(rng()<.03){const n=fol[(rng()*fol.length)|0],c=n.cities[(rng()*n.cities.length)|0];for(const m of fol)m.devotion=clamp((m.devotion??.3)+.06,0,1);
      if(fol.some(important))log(`Saint ${givenName(rng()<.4?'f':'m')} of ${c.name} worked wonders. The faithful of ${F.name} take heart.`,'faith')}});}
/* nations of sibling faiths fight bitterly, and a faith wants its holy city back */
function holyWarFactor(A,B){if(A.faith<0||B.faith<0)return 1;let f=sameRoot(A.faith,B.faith)?2.2:1;const hc=holyCityOf(A.faith);if(hc&&hc.n===B&&B.faith!==A.faith)f*=2.5;return f}
function holyWarLog(A,B){const hc=holyCityOf(A.faith);if(hc&&hc.n===B&&B.faith!==A.faith)log(`${A.name} launched a holy war to take ${hc.c.name}, the holy city of ${faiths[A.faith].name}.`,'faith');
  else if(sameRoot(A.faith,B.faith))log(`Brother faiths at war: ${A.name} of ${faiths[A.faith].name} marched on ${B.name} of ${faiths[B.faith].name}.`,'faith')}

/* pilgrims walk the roads to their holy city */
kit('pilgR',upGeo(new THREE.ConeGeometry(.5,1,8)),figMat,500,false);kit('pilgH',new THREE.SphereGeometry(.5,8,6),figMat,500,false);
let pilgrims=[];
function updatePilgrims(dt,k){if(k>0&&pilgrims.length<14&&rng()<dt*.8){
    const cand=nations.filter(n=>n.alive&&n.faith>=0&&n.cities.length&&Math.hypot(wx(n.cities[0].x)-camT.x,wz(n.cities[0].y)-camT.z)<camDist*2+2);
    if(cand.length){const n=cand[(rng()*cand.length)|0],hc=holyCityOf(n.faith),c=n.cities[(rng()*n.cities.length)|0];
      if(hc&&hc.c!==c){const p=landPath(c,hc.c);if(p)pilgrims.push({p,t:0,len:Math.hypot(p[2]-p[0],p[3]-p[1]),cnt:3+((rng()*4)|0),col:faiths[n.faith].color})}}}
  kitReset(['pilgR','pilgH']);
  for(let q=pilgrims.length-1;q>=0;q--){const g=pilgrims[q];g.t+=dt*k*.22/Math.max(1,g.len);if(g.t>=1){pilgrims.splice(q,1);continue}
    const dx=g.p[2]-g.p[0],dz=g.p[3]-g.p[1],L=Math.hypot(dx,dz)||1,ux=dx/L,uz=dz/L;
    for(let i=0;i<g.cnt;i++){const tt=g.t-i*.012/Math.max(1,g.len)*3;if(tt<0)continue;const x=lerp(g.p[0],g.p[2],tt)-uz*((i%2)-.5)*.02,z=lerp(g.p[1],g.p[3],tt)+ux*((i%2)-.5)*.02,y=groundY(x,z);
      add('pilgR',x,y,z,.018,.042,.018,0,i===0?parseInt(g.col.slice(1),16):0xe8e2d4);add('pilgH',x,y+.048,z,.011,.011,.011,0,0xc89a78)}}
  kitCommit(['pilgR','pilgH'])}
