"use strict";
/* Faithbound — resources: timber, stone, iron, gold and oil. Towns grow near them, trade and wars follow them */

const RESOURCES={
  wood:{label:'Timber',col:'#6b8a3a',from:0,to:4},stone:{label:'Stone',col:'#9a948a',from:1,to:5},
  iron:{label:'Iron',col:'#a0583a',from:2,to:7},gold:{label:'Gold',col:'#e0b440',from:1,to:7},oil:{label:'Oil',col:'#2a2a2a',from:5,to:6}};
const RKEYS=Object.keys(RESOURCES);
let deposits=[];
function seedDeposits(){deposits=[];const taken=new Set();
  const place=(k,count,ok)=>{for(let t=0,n=0;t<count*60&&n<count;t++){const i=(rng()*N)|0;if(taken.has(i)||!ok(i))continue;
    const x=i%W,y=(i/W)|0;if(deposits.some(d=>d.k===k&&Math.hypot(d.i%W-x,((d.i/W)|0)-y)<6))continue;taken.add(i);deposits.push({i,k});n++}};
  const hill=i=>!isWater(i)&&(biome[i]===11||(biome[i]!==12&&tslope.length===N&&tslope[i]>.25));
  place('iron',Math.round(N/170),hill);place('gold',Math.round(N/420),i=>hill(i)||(river[i]&&!isWater(i)&&rng()<.3));
  place('oil',Math.round(N/240),i=>[7,8,9].includes(biome[i])||(biome[i]===1&&rng()<.35))}
const depAt=new Map();function indexDeposits(){depAt.clear();for(const d of deposits)depAt.set(d.i,d)}
function nearDeposit(j,r){const x=j%W,y=(j/W)|0;for(const d of deposits)if(Math.hypot(d.i%W-x,((d.i/W)|0)-y)<=r)return d;return null}

/* every few years each nation counts what it holds and what it gets through trade */
function resourceTick(n){if(year%5!==n.id%5)return;const has={wood:0,stone:0,iron:0,gold:0,oil:0};
  for(let i=0;i<N;i++){if(owner[i]!==n.id)continue;const b=biome[i];if(b===5||b===6)has.wood++;else if(b===11)has.stone++}
  for(const d of deposits)if(owner[d.i]===n.id)has[d.k]+=1;
  const via={};for(const id of n.trade||[]){const m=nations[id];if(!m||!m.alive||!m.res)continue;for(const k of RKEYS)if(m.res.has[k]>0&&!has[k])via[k]=(via[k]||0)+1}
  const old=n.res;n.res={has,via};
  for(const k of ['gold','oil','iron'])if(has[k]>0&&!(old&&old.has[k]>0)&&n.era>=RESOURCES[k].from&&important(n)){const d=deposits.find(d=>d.k===k&&owner[d.i]===n.id);
    const c=d?nearestTown(n,d.i):null;log(k==='gold'?`${n.name} found gold in the hills${c?' near '+c.name:''}.`:k==='oil'?`${n.name} struck oil${c?' near '+c.name:''}.`:`${n.name} opened iron mines${c?' near '+c.name:''}.`,'era')}
  n._resMod=resMod(n)}
const need=(n,k)=>n.era>=RESOURCES[k].from&&n.era<=RESOURCES[k].to;
const hasRes=(n,k)=>n.res&&(n.res.has[k]>0||(n.res.via[k]||0)>0);
function resMod(n){const o={},m=(k,v)=>{o[k]=(o[k]||1)*v};
  if(need(n,'wood'))m('sea',hasRes(n,'wood')?1.1:.85);
  if(need(n,'stone'))m('grow',hasRes(n,'stone')?1.04:.98);
  if(need(n,'iron')){if(hasRes(n,'iron'))m('mil',1.18);else m('mil',.88)}
  if(n.res.has.gold>0){m('stab',1.06);m('tech',1.05);m('belief',1.1)}
  if(need(n,'oil')){if(hasRes(n,'oil')){m('tech',1.15);m('grow',1.05);m('emit',1.1)}else{m('tech',.88)}}
  return o}
/* a neighbour's mines can be worth a war */
function covets(A,B){if(!B.res)return null;for(const k of ['oil','iron','gold'])if(need(A,k)&&!hasRes(A,k)&&B.res.has[k]>0)return k;return null}
function tradeWant(A,B){if(!A.res||!B.res)return 1;let w=1;for(const k of RKEYS)if(need(A,k)&&!A.res.has[k]&&B.res.has[k]>0)w+=1.5;return w}

/* ---------- on the map: rocks, mines, headframes, derricks and rigs ---------- */
function buildDeposits(){for(const d of deposits){const X=d.i%W,Y=(d.i/W)|0,x=wx(X)+.15,z=wz(Y)-.1,o=owner[d.i],n=o>=0?nations[o]:null,e=n?n.era:-1,y=groundY(x,z),sea=isWater(d.i);
    const worked=n&&e>=RESOURCES[d.k].from,h=hash(d.i);
    if(d.k==='oil'){if(sea){if(worked&&e>=5){add('box',x,waterY-.05,z,.16,.08,.16,0,0x4a4d52);for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]])add('cyl',x+a*.06,waterY-.1,z+b*.06,.01,.12,.01,0,0x6a6d70);
        add('box',x,waterY+.03,z,.15,.02,.15,0,0x8a8d90);add('cyl',x+.04,waterY+.05,z,.008,.2,.008,0,0xc8c8c8);add('flame',x+.04,waterY+.25,z,.02,.04,.02);occupied.add(d.i)}continue}
      if(y<waterY+.02)continue;add('box',x,y-.005,z,.07,.006,.05,h,0x1a1816);
      if(worked&&e>=5){/* a derrick and a nodding pumpjack */for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]])add('cyl',x+a*.022,y,z+b*.022,.003,.17,.003,0,0x5a4a3a,a*.12);
        add('cyl',x,y+.16,z,.006,.03,.006,0,0x5a4a3a);add('box',x+.07,y,z,.03,.02,.02,h,0x3a3d42);add('box',x+.07,y+.035,z,.07,.008,.008,h+.3,0xd8a020);occupied.add(d.i)}continue}
    if(y<waterY+.03)continue;
    const rc=d.k==='gold'?0xc8a050:0x8a5a40;for(let k=0;k<4;k++){const a=hash(d.i+k*3)*6.28,r=.03+hash(d.i*7+k)*.05;add('rock',x+Math.cos(a)*r,y-.01,z+Math.sin(a)*r,.035,.025,.03,a,rc)}
    if(d.k==='gold'&&!worked)add('glowB',x,y+.012,z,.008,.008,.008,0,0xffd860);
    if(!worked)continue;occupied.add(d.i);
    if(e<=4){/* a mine: timbered entrance, spoil heap and a cart */add('stone',x,y-.02,z+.04,.09,.06,.05,0,0x7a7268);add('box',x,y,z+.066,.04,.035,.004,0,0x161412);
      add('timber',x-.022,y,z+.068,.006,.04,.006,0,0x6a4a2e);add('timber',x+.022,y,z+.068,.006,.04,.006,0,0x6a4a2e);add('timber',x,y+.038,z+.068,.05,.006,.006,0,0x6a4a2e);
      add('rock',x+.07,y-.01,z+.02,.06,.035,.05,h,d.k==='gold'?0xb8985a:0x7a5a48);add('box',x+.03,y+.006,z+.1,.02,.014,.03,0,0x5a4a3a)}
    else{/* a steel headframe with its wheel */add('conc',x,y-.02,z,.12,.03,.1,0,0x7a7c7e);for(const s of [-1,1])add('cyl',x+s*.025,y,z,.004,.2,.004,0,0x8a3020,s*.15);
      add('ring',x,y+.19,z,.04,1,.04);add('conc',x+.06,y,z,.05,.05,.04,0,0x9a948a);add('rock',x-.08,y-.01,z+.03,.08,.05,.06,h,0x5a5048)}}}

/* ---------- labels for deposits when zoomed in ---------- */
function drawDepositLabels(dpr){if(camDist>9)return;octx.textBaseline='middle';octx.textAlign='left';for(const d of deposits){const X=d.i%W,Y=(d.i/W)|0,x=wx(X)+.15,z=wz(Y)-.1;if(Math.hypot(x-camT.x,z-camT.z)>camDist*1.6)continue;
    const [sx,sy,sz]=project(x,Math.max(groundY(x,z),waterY)+.18,z);if(sz>1)continue;const R=RESOURCES[d.k];
    octx.font=`600 ${Math.round(10*dpr)}px Inter, system-ui, sans-serif`;const tw=octx.measureText(R.label).width;
    octx.fillStyle='rgba(16,16,16,.7)';octx.fillRect(sx-tw/2-11*dpr,sy-8*dpr,tw+18*dpr,16*dpr);octx.fillStyle=R.col==='#2a2a2a'?'#c8c8c8':R.col;octx.beginPath();octx.arc(sx-tw/2-4*dpr,sy,3*dpr,0,7);octx.fill();
    octx.fillStyle='#ece6da';octx.fillText(R.label,sx-tw/2+1*dpr,sy)}}
function resourceLine(n){if(!n.res)return '';const parts=[];for(const k of RKEYS){if(!need(n,k)&&!(k==='gold'&&n.res.has.gold))continue;const h=n.res.has[k],v=n.res.via[k]||0;
    parts.push(`<span style="color:${h||v?'#d8d0c0':'#e89a7a'}"><i style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${RESOURCES[k].col==='#2a2a2a'?'#c8c8c8':RESOURCES[k].col};margin-right:4px"></i>${RESOURCES[k].label}${h?'':v?' (trade)':' (lacking)'}</span>`)}
  return parts.length?`<p class="note" style="display:flex;flex-wrap:wrap;gap:4px 10px">${parts.join('')}</p>`:''}
