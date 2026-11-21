"use strict";
/* Faithbound — the land's many faces. Each broad biome is split into the kinds of country you would meet on a real continent:
   forests become cold dark taiga, old dark woods, pale birch woods, leafy broadleaf woods and dry open woodland; jungle becomes
   rainforest, mangrove along the shore and misty cloud forest on the hills; grassland becomes meadow, dry steppe or purple heath;
   desert becomes sand dunes, red badlands or white salt flats; savanna becomes open savanna or thorn scrub. Each kind has its own
   ground colour, trees, undergrowth and fertility. */

const ECOS=[
  {n:null},
  /* forest */
  {n:'Taiga',b:5,g:[40,58,44,.45],hab:.75,t:{type:'conifer',nk:1.1,sk:1.05,cols:[0x163024,0x1b3828,0x132c1f,0x1f3e2d],bush:0x22402f}},
  {n:'Dark forest',b:5,g:[24,38,26,.62],hab:.6,t:{type:'mix',con:.55,nk:1.5,sk:1.28,cols:[0x1b3121,0x1f3825,0x243d27,0x18291c],bush:0x22361f}},
  {n:'Birch wood',b:5,g:[96,114,58,.4],hab:1.05,t:{type:'broad',nk:.85,sk:.82,cols:[0x7a9446,0x86a04c,0x6e8a42,0x90a454],bush:0x5e7a3c}},
  {n:'Broadleaf forest',b:5},
  {n:'Dry woodland',b:5,g:[118,110,66,.45],hab:1.1,t:{type:'broad',nk:.5,sk:.82,cols:[0x6a7a46,0x74804c,0x5e6e40,0x7e8452],bush:0x7a7a4a},cover:[{n:3,kit:'bush',s:.9,cols:[0x7a7a4a,0x8a8452,0x6e6a40]}]},
  /* jungle */
  {n:'Rainforest',b:6,t:{nk:1.15}},
  {n:'Mangrove',b:6,g:[48,62,40,.5],hab:.55,t:{type:'broad',nk:.7,sk:.62,cols:[0x2a4a26,0x30562c,0x264424],bush:0x2a4a26},cover:[{n:6,kit:'bush',s:1,cols:[0x2a4a26,0x34582e,0x2e4e28]},{n:6,kit:'reed',s:1,cols:[0x5a6a34,0x6a7a3a]}]},
  {n:'Cloud forest',b:6,g:[44,74,54,.38],hab:.85,t:{type:'broad',nk:1.35,sk:.95,cols:[0x2a5038,0x325a40,0x264a34],bush:0x3a6a4a},cover:[{n:4,kit:'bush',s:.9,cols:[0x3a6a4a,0x4a7a50]}]},
  /* grassland */
  {n:'Meadow',b:4},
  {n:'Steppe',b:4,g:[150,138,78,.62],hab:.8,t:{nk:.2},cover:[{n:6,kit:'bush',s:.55,cols:[0x8a7a3a,0x7a6e34,0x96864a]}]},
  {n:'Heath',b:4,g:[98,72,80,.62],hab:.55,t:{nk:.15},cover:[{n:7,kit:'bush',s:.85,cols:[0x7a5a6a,0x6a4a5a,0x8a6a52,0x6a5a48,0x8a5a78]}]},
  /* desert */
  {n:'Sand dunes',b:7,g:[206,168,108,.35]},
  {n:'Badlands',b:7,g:[166,90,56,.66],hab:.6,cover:[{n:3,kit:'rock',s:1,cols:[0x9a5a3a,0xb06a44,0x8a4a30]}]},
  {n:'Salt flats',b:7,g:[228,224,210,.8],hab:.2,t:{nk:0}},
  /* savanna */
  {n:'Savanna',b:8},
  {n:'Thorn scrub',b:8,g:[150,124,84,.45],hab:.75,t:{nk:.6},cover:[{n:5,kit:'bush',s:1,cols:[0x7a7a44,0x8a8048,0x6a6a3c]}]}];
let ECO=null,ECOV=0;
/* smooth value noise that repeats across the seam of a round world */
function ecoN(x,y,s,k){const P=ROUND?Math.max(1,Math.round(W/s)):0,sx=P?W/P:s,X=Math.floor(x/sx),Y=Math.floor(y/s),fx=x/sx-X,fy=y/s-Y;
  const q=(a,b)=>{if(P)a=((a%P)+P)%P;return hash((a+k)*157.31+(b-k)*311.7+k*7.7)},u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
  return lerp(lerp(q(X,Y),q(X+1,Y),u),lerp(q(X,Y+1),q(X+1,Y+1),u),v)}
function ecoCompute(){if(!ECO||ECO.length!==N)ECO=new Uint8Array(N);ECO.fill(0);ECOV++;
  const seed=Math.floor((h[(N/5)|0]||0)*9973)%89;
  for(let y=0;y<H;y++){const lat=1-Math.abs(y/(H-1)-.5)*2;for(let x=0;x<W;x++){const i=y*W+x,b=biome[i];if(b<4||b>8)continue;
    const alt=h[i]-sea,t=lat*.85+(climate.temp-.5)*.75+.08-Math.max(0,alt)*1.25+(TNOISE?TNOISE[i]*.22:0)+(typeof warmD!=='undefined'&&warmD&&warmD.length===N?warmD[i]:0),
      m=clamp(baseMoist[i]+(climate.rain-.5)*.7+moistD[i],0,1),r1=ecoN(x,y,7,seed+1)*.7+ecoN(x,y,2.5,seed+5)*.3,r2=ecoN(x,y,5,seed+13),r3=ecoN(x,y,6,seed+29);let e=0;
    if(b===5){if(r1>.6&&m>.6)e=2;else if(t<.34)e=r1>.64?2:1;else if(t<.44&&r2>.58)e=3;else if(t>.52&&m<.6)e=5;else e=4}
    else if(b===6){let coast=false;for(let d=0;d<4&&!coast;d++){const X=wrapTX(x+DX[d]),Y=y+DY[d];if(X>=0&&Y>=0&&X<W&&Y<H&&isWater(Y*W+X))coast=true}e=alt<.05&&coast?7:alt>.11?8:6}
    else if(b===4){if(m<.37&&t>.28)e=10;else if(t<.44&&m>.46&&r3>.5)e=11;else e=9}
    else if(b===7){if(alt>.1||r1>.63)e=13;else if(alt<.05&&r2<.3)e=14;else e=12}
    else if(b===8)e=m<.36||r3>.68?16:15;
    ECO[i]=e;const E=ECOS[e];if(E.hab!=null&&!(typeof FARMT!=='undefined'&&FARMT&&FARMT[i]))hab[i]=Math.min(1,hab[i]*E.hab)}}}
{const _ct=computeTerrain;computeTerrain=function(){const r=_ct.apply(this,arguments);try{ecoCompute()}catch(e){console.warn('biomes',e)}return r}}
const ecoOf=i=>ECO&&ECO.length===N?ECOS[ECO[i]]:null;
function ecoName(i){const E=ecoOf(i);return E&&E.n?E.n:BIOMES[biome[i]].n}
/* the share of land under each kind of country, for the World panel or a quick look */
function ecoCensus(){const c={};if(!ECO)return c;for(let i=0;i<N;i++){const E=ECOS[ECO[i]];if(E.n)c[E.n]=(c[E.n]||0)+1}return c}
