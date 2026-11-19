"use strict";
/* Faithbound — houses of worship and world wonders in the style of each culture.
   Churches and Gothic cathedrals in the west, stave churches in the north, onion domes among the Slavs, Greek temples by the
   Mediterranean, mosques with domes and minarets in the Middle East and on the steppe, mud mosques in Africa, Hindu temple
   towers in South Asia, pagodas in China, shrines and torii in Japan, stepped pyramids in Mesoamerica, Inca sun temples in the
   Andes and marae with sMoai in the Pacific. Each grows with the people's devotion: a temple, a great temple, a whole complex.
   The world wonders follow real ones: the Great Pyramid, Stonehenge, the Parthenon, the Great Wall, Hagia Sophia, Angkor Wat,
   the Taj Mahal, an iron tower, and more. */

const SCOL={lime:0xece6da,marble:0xf2eee6,stone:0xd8d1c4,grey:0x9a968c,sand:0xdcc7a0,redsand:0xc68a6a,mud:0xb8875a,verm:0xb33a2a,dark:0x3a3e44,
  gold:0xd8b04a,turq:0x3aa3a8,blue:0x2f6fa8,green:0x3f7a5a,slate:0x55595e,clay:0xb87458,wood:0x5a4030,glass:0x2a3038};
/* a builder: places pieces relative to the site's centre and turn. Sizes are width (x), height, depth (z); y is the base of the piece */
function sacredB(x,y,z,rot){return (k,dx,dz,dy,w,h,d,col,er)=>P(k,x,y-.02,z,rot,dx,dz,dy,w,h,d,col,er)}
/* a gable roof whose ridge runs along z */
const sRoofZ=(b,dx,dz,dy,len,h,wid,col)=>b('tiles',dx,dz,dy,len,h,wid,col,Math.PI/2);
/* an sOnion dome on a small drum, with a gilded tip */
function sOnion(b,dx,dz,dy,r,col){b('tower',dx,dz,dy,r*.7,r*.45,r*.7,SCOL.lime);b('domeW',dx,dz,dy+r*.45,r,r*1.15,r,col);b('coneTile',dx,dz,dy+r*.45+r*.5,r*.32,r*.75,r*.32,col);b('cyl',dx,dz,dy+r*1.65,r*.05,r*.35,r*.05,SCOL.gold)}
/* a sMinaret: a slender shaft, a balcony and a pointed cap */
function sMinaret(b,dx,dz,h,r,col,cap){b('adobeCyl',dx,dz,0,r,h,r,col);b('adobeCyl',dx,dz,h*.72,r*1.5,h*.035,r*1.5,col);b('adobeCyl',dx,dz,h*.76,r*.8,h*.2,r*.8,col);b('coneTile',dx,dz,h*.96,r*.95,h*.2,r*.95,cap)}
/* tall dark windows down both long sides of a building */
function sSlits(b,W,L,dz0,y,h,n){for(let i=0;i<n;i++){const dz=dz0-L/2+L*(i+.5)/n;for(const s of [-1,1])b('box',s*(W/2+.0015),dz,y,.003,h,Math.min(.02,L/n*.35),SCOL.glass)}}

/* ---------- churches ---------- */
function sChurch(b,k,t,e,cu,fc){
  const stoneAge=e>=2,wall=stoneAge?'stone':'box',wc=cu==='american'?0xf4f2ee:cu==='arctic'?0x8a3a2c:SCOL.lime,rc=cu==='arctic'?0x3a3a3a:SCOL.slate;
  if(cu==='nordic'&&e<=3){/* a stave church: dark tarred timber, roofs stacked in tiers, dragon-tipped ridges */
    const s=.1*k;b('timber',0,0,0,s*1.2,s*.55,s*1.7,SCOL.wood);
    for(let i=0;i<4;i++){const f=1-i*.22;b('hipTile',0,0,s*.55+i*s*.38,s*1.5*f,s*.34,s*1.9*f-(i?s*.4:0),0x2e241c);if(i<3)b('timber',0,0,s*.75+i*s*.38,s*.9*f,s*.2,s*.9*f,SCOL.wood)}
    b('cyl',0,0,s*2,s*.03,s*.35,s*.03,0x2e241c);return}
  const L=.26*k,W=.12*k,H=(cu==='american'?.08:.1)*k;
  b(wall,0,0,0,W,H,L,wc);sRoofZ(b,0,0,H,L*1.04,.07*k,W*1.18,rc);if(!stoneAge||cu==='american')sSlits(b,W,L,0,H*.3,H*.45,4);
  b('tower',0,-L/2,0,W*.85,H*.85,W*.85,wc);b('coneTile',0,-L/2,H*.85,W*.92,.045*k,W*.92,rc);
  const gothic=e>=3&&t>=2&&cu!=='american';
  if(cu==='slavic'){/* an Orthodox church: a white cube under sOnion domes, a bell tower with a tent roof */
    b('box',0,0,H,W*1.02,.012*k,L*.7,wc);const dc=[SCOL.gold,0x2f5f9a,0x3f7a5a][t%3];sOnion(b,0,0,H+.01*k,.07*k,dc);
    if(t>=2)for(const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]])sOnion(b,sx*W*.32,sz*L*.22,H+.01*k,.04*k,t===3?[0x2f5f9a,0x3f7a5a,0xb33a2a,SCOL.gold][(sx+1+sz+1)%4]:dc);
    b('box',0,L/2+.03*k,0,.07*k,.2*k,.07*k,wc);b('pyr',0,L/2+.03*k,.2*k,.08*k,.12*k,.08*k,0x3f7a5a);sOnion(b,0,L/2+.03*k,.3*k,.025*k,SCOL.gold);return}
  if(gothic){/* twin west towers with spires, a transept, a crossing spire and flying buttresses */
    for(const s of [-1,1]){b('stone',s*.045*k,L/2+.035*k,0,.065*k,.3*k,.065*k,wc);b('pyr',s*.045*k,L/2+.035*k,.3*k,.07*k,.16*k,.07*k,rc)}
    b('box',0,L/2+.07*k,0,.035*k,.08*k,.004,0x2a2420);
    b(wall,0,-L*.15,0,.3*k,H,.1*k,wc);b('tiles',0,-L*.15,H,.31*k,.07*k,.11*k,rc);b('pyr',0,-L*.15,H+.05*k,.035*k,.2*k,.035*k,rc);
    for(let i=0;i<5;i++){const dz=-L/2+L*(i+.5)/5;for(const s of [-1,1]){b('box',s*(W/2+.02*k),dz,0,.014*k,H*.75,.016*k,wc);b('box',s*(W/2+.01*k),dz,H*.6,.03*k,.008*k,.01*k,wc)}}}
  else{/* one tower at the front with a spire */const th=(cu==='american'?.26:.22)*k;
    b(cu==='american'?'box':wall,0,L/2+.03*k,0,.065*k,th,.065*k,wc);
    for(const [dx,dz] of [[.0335,0],[-.0335,0],[0,.0335],[0,-.0335]])b('box',dx*k,L/2+.03*k+dz*k,th-.05*k,dx?.002:.025*k,.03*k,dz?.002:.025*k,0x20242a);
    b('pyr',0,L/2+.03*k,th,.072*k,(cu==='american'?.2:.15)*k,.072*k,cu==='american'?0xf4f2ee:rc)}
  if(t===3){/* a cloister and the bishop's house */for(const s of [-1,1])b('stone',s*.22*k,0,0,.03*k,.06*k,.26*k,SCOL.stone);b('stone',0,-.22*k,0,.44*k,.06*k,.03*k,SCOL.stone);
    b('stone',.2*k,-.12*k,0,.1*k,.09*k,.08*k,0xe6dccb);b('tiles',.2*k,-.12*k,.09*k,.11*k,.05*k,.09*k,rc)}}

/* ---------- Greek temples and Mediterranean basilicas ---------- */
function sGreek(b,k,t,e,fc,athena){
  if(e>=4){/* a domed basilica: a cross of stone halls, a drum and a great lead dome with a lantern, a columned front */
    const H=.11*k;b('box',0,0,0,.14*k,H,.34*k,SCOL.marble);b('box',0,0,0,.32*k,H,.14*k,SCOL.marble);
    b('tower',0,0,H,.13*k,.06*k,.13*k,SCOL.marble);b('dome',0,0,H+.06*k,.14*k,.12*k,.14*k,0x8a9098);b('tower',0,0,H+.17*k,.02*k,.04*k,.02*k,SCOL.marble);b('coneTile',0,0,H+.21*k,.022*k,.03*k,.022*k,0x8a9098);
    for(let i=0;i<6;i++)b('cyl',-.06*k+i*.024*k,.18*k,0,.011*k,H*.85,.011*k,SCOL.marble);b('box',0,.18*k,H*.85,.15*k,.02*k,.03*k,SCOL.marble);b('tiles',0,.18*k,H*.85+.02*k,.16*k,.035*k,.035*k,SCOL.marble);
    if(t===3)for(const s of [-1,1]){b('box',s*.22*k,.3*k,0,.03*k,.06*k,.2*k,SCOL.marble);for(let i=0;i<5;i++)b('cyl',s*.2*k,.22*k+i*.04*k,0,.008*k,.055*k,.008*k,SCOL.marble)}return}
  const lift=t===3?.05*k:0;if(t===3){/* the rock of the acropolis and its gateway */b('box',0,0,0,.42*k,lift,.5*k,0xa89c88);b('box',0,.26*k,0,.12*k,lift,.06*k,0xa89c88);for(let i=0;i<4;i++)b('cyl',-.045*k+i*.03*k,.22*k,lift,.009*k,.06*k,.009*k,SCOL.marble)}
  const W=.2*k,L=.32*k,H=.1*k;for(let i=0;i<3;i++)b('box',0,0,lift+i*.01*k,W+.03*k-i*.01*k,.01*k,L+.03*k-i*.01*k,SCOL.marble);
  const y0=lift+.03*k,nf=t>=2?8:6,ns=t>=2?17:11;b('box',0,0,y0,W*.55,H*.95,L*.72,0xe2dccf);
  for(let i=0;i<nf;i++){const dx=-W/2+.012*k+i*(W-.024*k)/(nf-1);for(const s of [-1,1])b('cyl',dx,s*(L/2-.012*k),y0,.016*k,H,.016*k,SCOL.marble)}
  for(let i=1;i<ns-1;i++){const dz=-L/2+.012*k+i*(L-.024*k)/(ns-1);for(const s of [-1,1])b('cyl',s*(W/2-.012*k),dz,y0,.016*k,H,.016*k,SCOL.marble)}
  b('box',0,0,y0+H,W,.022*k,L,SCOL.marble);sRoofZ(b,0,0,y0+H+.022*k,L,.045*k,W,0xd2c8b8);
  if(athena){/* the great statue of Athena before the temple, with spear and shield */b('box',0,L/2+.06*k,lift,.04*k,.03*k,.04*k,SCOL.marble);b('cyl',0,L/2+.06*k,lift+.03*k,.014*k,.09*k,.014*k,SCOL.gold);
    b('domeW',0,L/2+.06*k,lift+.12*k,.016*k,.02*k,.016*k,SCOL.gold);b('cyl',.012*k,L/2+.06*k,lift+.03*k,.002*k,.15*k,.002*k,SCOL.gold);b('cyl',-.016*k,L/2+.066*k,lift+.06*k,.03*k,.003*k,.03*k,SCOL.gold)}}

/* ---------- mosques ---------- */
function sMosque(b,k,t,e,cu){
  if(cu==='africa'){/* a mud mosque in the style of Djenné: towers of plastered earth with pinnacles, palm beams jutting from the walls */
    const W=.26*k,L=.22*k,H=.1*k,mc=SCOL.mud;b('adobe',0,0,0,W,H,L,mc);b('adobe',0,0,0,W*1.08,.02*k,L*1.08,0xa87a50);
    const nt=t>=2?3:2;for(let i=0;i<nt;i++){const dx=-W*.32+i*W*.64/(nt-1);b('adobe',dx,L/2,0,.055*k,H*1.65,.05*k,mc);b('adobeCyl',dx,L/2,H*1.65,.035*k,.03*k,.035*k,mc);b('coneTile',dx,L/2,H*1.65+.03*k,.03*k,.03*k,.03*k,mc)}
    for(let i=0;i<9;i++)b('adobeCyl',-W/2+W*i/8,L/2-.004,H,.016*k,.025*k,.016*k,mc);
    for(let r=0;r<3;r++)for(let i=0;i<10;i++){const dx=-W/2+W*(i+.5)/10;b('box',dx,L/2+.006*k,H*(.25+r*.28),.004*k,.004*k,.03*k,SCOL.wood);if(i<7)for(const s of [-1,1])b('box',s*(W/2+.006*k),-L/2+L*(i+.5)/7,H*(.25+r*.28),.03*k,.004*k,.004*k,SCOL.wood)}
    if(t===3){b('adobe',0,-L/2-.08*k,0,W,.05*k,.14*k,0xa87a50)}return}
  const steppe=cu==='steppe',wc=steppe?0xd8c8a8:0xe8dcc4,dc=steppe?SCOL.turq:t>=2?0x4a8aa0:0xe8e0d0,H=.08*k,W=.24*k,L=.2*k;
  b('adobe',0,0,0,W,H,L,wc);b('adobeCyl',0,0,H,.12*k,.035*k,.12*k,wc);b('domeW',0,0,H+.035*k,.17*k,steppe?.19*k:.15*k,.17*k,dc);b('cyl',0,0,H+.035*k+(steppe?.19:.15)*k,.004*k,.04*k,.004*k,SCOL.gold);
  if(t>=2)for(const s of [-1,1]){b('adobeCyl',s*.08*k,-.04*k,H,.06*k,.015*k,.06*k,wc);b('domeW',s*.08*k,-.04*k,H+.015*k,.07*k,.06*k,.07*k,dc)}
  if(steppe){/* a great tiled portal (iwan) at the front */b('adobe',0,L/2+.02*k,0,.15*k,.17*k,.04*k,wc);b('box',0,L/2+.041*k,.01*k,.08*k,.12*k,.003,0x2a5a7a);b('box',0,L/2+.042*k,.13*k,.12*k,.02*k,.003,SCOL.turq)}
  else{for(let i=0;i<5;i++)b('box',-W*.4+i*W*.2,L/2+.001,.015*k,.025*k,.045*k,.003,0x5a4a3a)}
  const mh=.3*k,mr=.022*k,mp=t===1?[[W/2+.02*k,L/2]]:t===2?[[W/2+.02*k,L/2],[-W/2-.02*k,L/2]]:[[W/2+.03*k,L/2+.12*k],[-W/2-.03*k,L/2+.12*k],[W/2+.03*k,-L/2],[-W/2-.03*k,-L/2]];
  for(const [dx,dz] of mp)sMinaret(b,dx,dz,mh,mr,wc,dc);
  if(t===3){/* a courtyard with arcades and a fountain */const cz=L/2+.08*k;for(const s of [-1,1])b('adobe',s*W/2,cz,0,.02*k,.05*k,.16*k,wc);b('adobe',0,cz+.08*k,0,W,.05*k,.02*k,wc);b('adobeCyl',0,cz,0,.04*k,.012*k,.04*k,0x5a8aa0)}}

/* ---------- Hindu temples ---------- */
function sHindu(b,k,t,e){const sc=SCOL.redsand;
  b('box',0,0,0,.28*k,.03*k,.3*k,0xb8806a);
  /* the pillared hall in front, under a stepped roof */b('box',0,.06*k,.03*k,.12*k,.06*k,.11*k,sc);for(let i=0;i<3;i++)b('box',0,.06*k,.09*k+i*.015*k,.13*k-i*.03*k,.015*k,.12*k-i*.03*k,sc);
  const tower=(dx,dz,s)=>{b('box',dx,dz,.03*k,.11*k*s,.07*k*s,.11*k*s,sc);for(let j=0;j<9;j++){const f=1-j*.085;b('box',dx,dz,(.1+j*.03)*k*s,.11*k*s*f,.03*k*s,.11*k*s*f,j%2?sc:0xd09a7a)}
    b('domeW',dx,dz,.37*k*s,.05*k*s,.025*k*s,.05*k*s,sc);b('cyl',dx,dz,.39*k*s,.008*k*s,.03*k*s,.008*k*s,SCOL.gold)};
  tower(0,-.06*k,1);if(t===3)for(const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]])tower(sx*.11*k,sz*.11*k-.02*k,.5)}

/* ---------- pagodas and shrines ---------- */
function sPagoda(b,k,t,e,cu){const red=SCOL.verm,roof=cu==='japan'?0x2e3036:SCOL.dark;
  if(cu==='japan'){/* a torii gate, then a shrine hall of dark timber under a great roof */
    for(const s of [-1,1])b('cyl',s*.04*k,.2*k,0,.008*k,.1*k,.008*k,red);b('box',0,.2*k,.09*k,.12*k,.01*k,.012*k,red);b('box',0,.2*k,.075*k,.095*k,.006*k,.008*k,red);
    b('box',0,0,0,.2*k,.025*k,.16*k,0x9a968c);b('timber',0,0,.025*k,.16*k,.06*k,.12*k,SCOL.wood);b('hipTile',0,0,.085*k,.24*k,.07*k,.19*k,roof)}
  else{/* a temple hall on a stone terrace under double eaves */b('box',0,0,0,.26*k,.03*k,.2*k,0xb0aca2);b('box',0,0,.03*k,.2*k,.07*k,.13*k,red);b('hipTile',0,0,.1*k,.27*k,.04*k,.19*k,roof);b('box',0,0,.13*k,.13*k,.03*k,.08*k,red);b('hipTile',0,0,.16*k,.17*k,.035*k,.12*k,roof)}
  if(t>=2){/* a pagoda of five storeys */const px=.17*k,pz=-.08*k;let y=0;b('box',px,pz,0,.09*k,.02*k,.09*k,0xb0aca2);y=.02*k;
    for(let i=0;i<5;i++){const f=1-i*.13;b('box',px,pz,y,.06*k*f,.035*k,.06*k*f,red);b('hipTile',px,pz,y+.033*k,.1*k*f,.02*k,.1*k*f,roof);y+=.055*k}
    b('cyl',px,pz,y,.005*k,.06*k,.005*k,SCOL.gold);for(let i=0;i<4;i++)b('cyl',px,pz,y+.01*k+i*.012*k,.014*k,.003*k,.014*k,SCOL.gold)}
  if(t===3){/* a walled precinct */const R=.3*k;for(const [dx,dz,w,d] of [[0,R,2*R,.01*k],[0,-R,2*R,.01*k],[R,0,.01*k,2*R],[-R,0,.01*k,2*R]]){b('box',dx,dz,0,w,.035*k,d,red);b('hipTile',dx,dz,.035*k,w+.01*k,.012*k,d+.02*k,roof)}}}

/* ---------- pyramids and sun temples ---------- */
function sPyramid(b,k,t,e,cu,fc){
  if(cu==='andean'){/* Inca: fitted grey stone terraces, a sun temple with a thatched roof and a golden sun */
    const n=t+1;for(let j=0;j<n;j++){const s=.32*k-j*.07*k;b('box',0,0,j*.03*k,s,.03*k,s*.85,SCOL.grey)}const yt=n*.03*k;
    b('box',0,0,yt,.13*k,.05*k,.08*k,0x8a867c);for(const s of [-1,1])b('box',s*.03*k,.0405*k,yt+.005*k,.015*k,.03*k,.002,0x2a2620);b('hipThatch',0,0,yt+.05*k,.16*k,.06*k,.11*k,0x8a7a58);
    b('cyl',0,.05*k,yt+.07*k,.035*k,.003*k,.035*k,SCOL.gold);for(let j=0;j<n;j++)b('box',0,.32*k*.85/2-j*.03*k,j*.03*k,.04*k,.03*k,.04*k,0xa8a498);return}
  /* Mesoamerica: a stepped pyramid of limestone with a steep stair and a painted temple on top */
  const n=3+t,lc=0xc8bca4;for(let j=0;j<n;j++){const s=.34*k*(1-j*.13);b('box',0,0,j*.04*k,s,.04*k,s,j%2?lc:0xbfb39b)}const yt=n*.04*k,st=.34*k*(1-(n-1)*.13);
  for(let j=0;j<n;j++){const s=.34*k*(1-j*.13);b('box',0,s/2,j*.04*k,.06*k,.04*k,.03*k,0xd6cdb8)}
  b('box',0,0,yt,st*.7,.05*k,st*.6,0xd8cfbc);b('box',0,st*.3+.001,yt+.005*k,.02*k,.03*k,.003,0x2a2420);b('box',0,0,yt+.05*k,st*.75,.025*k,st*.65,fc);
  if(t===3)for(const s of [-1,1]){const x=s*.32*k;for(let j=0;j<3;j++){const q=.14*k*(1-j*.2);b('box',x,.1*k,j*.03*k,q,.03*k,q,lc)}b('box',x,.1*k,.09*k,.05*k,.035*k,.04*k,0xd8cfbc)}}

/* ---------- Pacific marae ---------- */
function sMoai(b,dx,dz,dy,s){b('box',dx,dz,dy,.026*s,.055*s,.018*s,0x6a645a);b('box',dx,dz+.002*s,dy+.055*s,.022*s,.05*s,.02*s,0x6a645a);b('box',dx,dz+.011*s,dy+.07*s,.008*s,.03*s,.006*s,0x5a544a);b('cyl',dx,dz,dy+.105*s,.022*s,.014*s,.022*s,0x9a5040)}
function sMarae(b,k,t,e){const n=t===1?3:t===2?5:7;b('box',0,.06*k,0,.07*k+n*.04*k,.025*k,.06*k,0x7a776e);for(let i=0;i<n;i++)sMoai(b,-(n-1)*.02*k+i*.04*k,.06*k,.025*k,k*1.1);
  b('box',0,-.08*k,0,.22*k,.01*k,.16*k,0x8a8270);b('timber',0,-.08*k,.01*k,.16*k,.045*k,.08*k,SCOL.wood);b('hipThatch',0,-.08*k,.055*k,.2*k,.08*k,.12*k,0x9a8a60);
  for(const s of [-1,1])for(const u of [-1,1])b('cyl',s*.09*k,-.08*k+u*.05*k,0,.008*k,.08*k,.008*k,0x4a3428)}

/* ---------- which style each culture builds ---------- */
const SACRED_STYLE={west:'church',american:'church',arctic:'church',nordic:'church',slavic:'church',med:'greek',mideast:'mosque',steppe:'mosque',africa:'mosque',
  southasia:'hindu',east:'pagoda',japan:'pagoda',meso:'pyramid',andean:'pyramid',pacific:'marae'};
var SACRED_SCALE=1;
function sacredStyled(f,n,x,y,z,e,rot,t){const cu=cultOf(n),st=SACRED_STYLE[cu];if(!st||e>=7)return false;const fc=parseInt(f.color.slice(1),16),b=sacredB(x,y,z,rot),k=(t===1?.8:t===2?1.1:1.25)*SACRED_SCALE;
  if(st==='church')sChurch(b,k,t,e,cu,fc);else if(st==='greek')sGreek(b,k,t,e,fc,t===3);else if(st==='mosque')sMosque(b,k,t,e,cu);else if(st==='hindu')sHindu(b,k,t,e);
  else if(st==='pagoda')sPagoda(b,k,t,e,cu);else if(st==='pyramid')sPyramid(b,k,t,e,cu,fc);else sMarae(b,k,t,e);return true}
{const _ss=sacredSite;sacredSite=function(f,n,x,y,z,e,rot,cap){const t=Math.min(devTier(n),cap?3:2);if(t>=1)try{if(sacredStyled(f,n,x,y,z,e,rot,t))return}catch(err){console.warn('sacred',err)}return _ss.apply(this,arguments)}}

/* ---------- world wonders ---------- */
const WGROUP={west:'w',american:'am',arctic:'n',nordic:'n',slavic:'sl',med:'med',mideast:'me',steppe:'st',africa:'af',southasia:'sa',east:'ea',japan:'jp',meso:'ms',andean:'an',pacific:'pa'};
const WONDER_BY={
  1:{w:'Stonehenge',n:'Stonehenge',sl:'Stonehenge',am:'Stonehenge',med:'Great Ziggurat',me:'Great Ziggurat',st:'Kurgan of the Kings',af:'Great Pyramid',sa:'Great Stupa',ea:'Altar of Heaven',jp:'Altar of Heaven',ms:'Pyramid of the Sun',an:'Pyramid of the Sun',pa:'Ring of the Moai'},
  2:{w:'Temple of Athena',am:'Temple of Athena',med:'Temple of Athena',sl:'Temple of Athena',n:'Bronze Colossus',me:'Hanging Gardens',st:'Hanging Gardens',af:'Great Pyramid',sa:'Great Stupa',ea:'Great Wall',jp:'Great Wall',ms:'Temple of the Feathered Serpent',an:'Temple of the Feathered Serpent',pa:'Ring of the Moai'},
  3:{w:'High Cathedral',am:'High Cathedral',n:'High Cathedral',sl:'Cathedral of Saint Basil',med:'Hagia Sophia',me:'Hagia Sophia',st:'Registan',af:'Great Mosque of Djenné',sa:'Angkor Wat',pa:'Angkor Wat',ea:'Forbidden Palace',jp:'Great Hall of Todai',ms:'Temple of Kukulcan',an:'Machu Picchu'},
  4:{w:'Basilica of Saint Peter',am:'Basilica of Saint Peter',med:'Basilica of Saint Peter',sa:'Taj Mahal',me:'Taj Mahal',st:'Taj Mahal'},
  5:{w:'Iron Tower',med:'Iron Tower',am:'Statue of Liberty'}};
function wonderName(n,k){if(n&&n.wonderName&&n.wonder===k)return n.wonderName;const g=WGROUP[cultOf(n)]||'w',m=WONDER_BY[k];return (m&&m[g])||(WONDERS[k]&&WONDERS[k].name)||'Wonder'}
const WONDER_BUILD={
  'Stonehenge':(b,s)=>{const R=.2*s;for(let i=0;i<15;i++){const a=i/15*6.283,x=Math.cos(a)*R,z=Math.sin(a)*R;b('box',x,z,0,.022*s,.08*s,.014*s,0x9a968c,-a);if(i%2===0)b('box',Math.cos(a+.2)*R,Math.sin(a+.2)*R,.08*s,.05*s,.014*s,.016*s,0x9a968c,-a-.2-Math.PI/2)}
    for(let i=0;i<5;i++){const a=i/5*3.4+1.4,x=Math.cos(a)*R*.5,z=Math.sin(a)*R*.5;b('box',x,z,0,.03*s,.11*s,.018*s,0x8a867c,-a);b('box',x,z,.11*s,.05*s,.016*s,.02*s,0x8a867c,-a)}b('box',0,0,0,.035*s,.008*s,.02*s,0x7a766c)},
  'Great Pyramid':(b,s)=>{for(let j=0;j<16;j++){const q=.5*s*(1-j/16);b('box',0,0,j*.022*s,q,.022*s,q,j%3?0xd9c59a:0xd2bd92)}b('box',0,0,.35*s,.02*s,.01*s,.02*s,SCOL.gold);
    for(const [dx,dz,q] of [[.34,.2,.22],[.28,.42,.16]]){for(let j=0;j<8;j++){const w=q*s*(1-j/8);b('box',dx*s,dz*s,j*.02*s,w,.02*s,w,0xd2bd92)}}},
  'Great Ziggurat':(b,s)=>{for(let t=0;t<4;t++)b('box',0,0,t*.07*s,(.46-t*.1)*s,.07*s,(.42-t*.09)*s,t%2?0xcfb98f:0xc4ad82);b('box',0,.17*s,0,.05*s,.2*s,.12*s,0xd8c49a);b('box',0,0,.28*s,.1*s,.06*s,.08*s,0x3f6fa0)},
  'Kurgan of the Kings':(b,s)=>{b('domeW',0,0,0,.44*s,.16*s,.44*s,0x6e7a48);const R=.26*s;for(let i=0;i<12;i++){const a=i/12*6.283;b('box',Math.cos(a)*R,Math.sin(a)*R,0,.02*s,.05*s,.015*s,0x9a968c,-a)}b('box',0,.27*s,0,.02*s,.09*s,.02*s,0x8a867c)},
  'Great Stupa':(b,s)=>{b('box',0,0,0,.42*s,.03*s,.42*s,0xc8bca4);b('adobeCyl',0,0,.03*s,.32*s,.04*s,.32*s,0xe8e2d4);b('domeW',0,0,.07*s,.3*s,.2*s,.3*s,0xf0ece2);b('box',0,0,.27*s,.05*s,.025*s,.05*s,0xd8cfbc);
    for(let i=0;i<3;i++)b('cyl',0,0,.3*s+i*.025*s,(.07-i*.02)*s,.005*s,(.07-i*.02)*s,0xd8b04a);b('cyl',0,0,.28*s,.006*s,.09*s,.006*s,0xd8b04a);
    for(let i=0;i<24;i++){const a=i/24*6.283;b('cyl',Math.cos(a)*.2*s,Math.sin(a)*.2*s,.03*s,.006*s,.03*s,.006*s,0xc8bca4)}},
  'Altar of Heaven':(b,s)=>{for(let i=0;i<3;i++)b('adobeCyl',0,0,i*.02*s,(.44-i*.08)*s,.02*s,(.44-i*.08)*s,0xece8de);const y=.06*s;
    b('cyl',0,0,y,.18*s,.07*s,.18*s,SCOL.verm);b('coneTile',0,0,y+.07*s,.26*s,.05*s,.26*s,0x2a4a8a);b('cyl',0,0,y+.11*s,.13*s,.05*s,.13*s,SCOL.verm);b('coneTile',0,0,y+.16*s,.19*s,.05*s,.19*s,0x2a4a8a);
    b('cyl',0,0,y+.2*s,.08*s,.04*s,.08*s,SCOL.verm);b('coneTile',0,0,y+.24*s,.12*s,.07*s,.12*s,0x2a4a8a);b('domeW',0,0,y+.3*s,.02*s,.03*s,.02*s,SCOL.gold)},
  'Pyramid of the Sun':(b,s)=>sPyramid(b,s*1.3,3,1,'meso',0x9a5a3a),
  'Ring of the Moai':(b,s)=>{b('box',0,0,0,.5*s,.03*s,.08*s,0x7a776e);for(let i=0;i<9;i++)sMoai(b,-.2*s+i*.05*s,0,.03*s,s*1.6)},
  'Temple of Athena':(b,s)=>sGreek(b,s*1.15,3,2,SCOL.gold,true),
  'Bronze Colossus':(b,s)=>{b('box',0,0,0,.14*s,.06*s,.14*s,0xbab3a6);for(const d of [-1,1])b('cyl',d*.025*s,0,.06*s,.018*s,.16*s,.018*s,0xa86e3c);b('box',0,0,.22*s,.07*s,.14*s,.04*s,0xa86e3c);b('domeW',0,0,.36*s,.035*s,.05*s,.035*s,0xa86e3c);
    b('cyl',.045*s,0,.3*s,.012*s,.14*s,.012*s,0xa86e3c);b('flame',.045*s,0,.44*s,.03*s,.06*s,.03*s)},
  'Hanging Gardens':(b,s)=>{for(let t=0;t<4;t++){const w=(.44-t*.09)*s;b('box',0,0,t*.06*s,w,.06*s,w*.85,0xc8a87a);for(let i=0;i<6;i++){const a=i/6*6.283;b('townTree',Math.cos(a)*w*.42,Math.sin(a)*w*.36,(t+1)*.06*s,.06*s,.07*s,.06*s,0x5a8a3a)}}
    b('box',0,.2*s,0,.04*s,.24*s,.02*s,0x6a9ac0)},
  'Great Wall':(b,s)=>{const pts=[[-.45,.15],[-.2,-.05],[.05,.1],[.3,-.1],[.5,.05]];for(let i=0;i<pts.length-1;i++){const [x0,z0]=pts[i],[x1,z1]=pts[i+1],L=Math.hypot(x1-x0,z1-z0)*s,a=Math.atan2(-(z1-z0),x1-x0);
      b('box',(x0+x1)/2*s,(z0+z1)/2*s,0,L,.07*s,.035*s,0x9a948a,a);for(let q=0;q<8;q++){const f=(q+.5)/8;b('box',(x0+(x1-x0)*f)*s,(z0+(z1-z0)*f)*s+.014*s,.07*s,.012*s,.012*s,.006*s,0x9a948a,a)}}
    for(const [x,z] of pts){b('box',x*s,z*s,0,.07*s,.12*s,.07*s,0x8f8a80);b('hipTile',x*s,z*s,.12*s,.09*s,.04*s,.09*s,SCOL.dark)}},
  'Temple of the Feathered Serpent':(b,s)=>sPyramid(b,s*1.2,3,2,'meso',0x3a7a5a),
  'High Cathedral':(b,s)=>sChurch(b,s*1.55,3,3,'west',0),
  'Cathedral of Saint Basil':(b,s)=>{const b2=b;b2('box',0,0,0,.3*s,.1*s,.3*s,0xa8402e);const cols=[[SCOL.gold,0,0,.09],[0x2f6f4a,-.1,-.1,.055],[0x2f5f9a,.1,-.1,.055],[0xb33a2a,-.1,.1,.055],[0xd8b04a,.1,.1,.055],[0x3f8a96,0,-.14,.045],[0x8a3a8a,.14,0,.045]];
    b2('tower',0,0,.1*s,.08*s,.16*s,.08*s,0xa8402e);b2('pyr',0,0,.26*s,.09*s,.14*s,.09*s,0xd8c49a);sOnion(b2,0,0,.38*s,.04*s,SCOL.gold);
    for(const [c,dx,dz,r] of cols.slice(1)){b2('tower',dx*s,dz*s,.1*s,r*s*.9,.1*s,r*s*.9,0xb8503a);sOnion(b2,dx*s,dz*s,.2*s,r*s,c)}},
  'Hagia Sophia':(b,s)=>{const wc=0xd8b8a0;b('box',0,0,0,.36*s,.12*s,.32*s,wc);for(const dz of [-.12,.12])b('domeW',0,dz*s,.12*s,.16*s,.1*s,.12*s,0x8a9098);b('adobeCyl',0,0,.12*s,.2*s,.04*s,.2*s,wc);
    b('domeW',0,0,.16*s,.26*s,.16*s,.26*s,0x8a9098);b('cyl',0,0,.32*s,.004*s,.04*s,.004*s,SCOL.gold);for(const [dx,dz] of [[-.22,-.2],[.22,-.2],[-.22,.2],[.22,.2]])sMinaret(b,dx*s,dz*s,.4*s,.02*s,0xe8dcc4,0x8a9098)},
  'Registan':(b,s)=>{for(const [dx,dz,a] of [[0,-.18,0],[-.2,0,Math.PI/2],[.2,0,-Math.PI/2]]){b('adobe',dx*s,dz*s,0,.24*s,.12*s,.1*s,0xd8c8a8,a);b('box',dx*s+Math.sin(a)*.051*s,dz*s+Math.cos(a)*.051*s,0,.14*s,.22*s,.02*s,0xd8c8a8,a);
      b('box',dx*s+Math.sin(a)*.062*s,dz*s+Math.cos(a)*.062*s,.02*s,.08*s,.16*s,.004*s,0x2a5a7a,a);b('domeW',dx*s-Math.sin(a)*.03*s,dz*s-Math.cos(a)*.03*s,.12*s,.1*s,.12*s,.1*s,SCOL.turq);
      for(const q of [-1,1])sMinaret(b,dx*s+Math.cos(a)*q*.12*s,dz*s-Math.sin(a)*q*.12*s,.3*s,.016*s,0xd8c8a8,SCOL.turq)}b('box',0,.05*s,0,.3*s,.004*s,.3*s,0xc8bca4)},
  'Great Mosque of Djenné':(b,s)=>sMosque(b,s*1.5,3,3,'africa'),
  'Angkor Wat':(b,s)=>{const sc=0x9a8a74;b('box',0,0,0,.5*s,.008*s,.5*s,0x3a6a6a);b('box',0,0,0,.42*s,.02*s,.42*s,0x8a7a66);for(let t=0;t<3;t++)b('box',0,0,.02*s+t*.03*s,(.36-t*.08)*s,.03*s,(.36-t*.08)*s,t%2?sc:0x8e7e68);
    const tw=(dx,dz,h)=>{for(let j=0;j<7;j++){const f=1-j*.12;b('box',dx*s,dz*s,.11*s+j*h*s/7,.06*s*f,h*s/7,.06*s*f,j%2?sc:0x8e7e68)}b('domeW',dx*s,dz*s,.11*s+h*s,.02*s,.03*s,.02*s,sc)};
    tw(0,0,.26);for(const [dx,dz] of [[-.1,-.1],[.1,-.1],[-.1,.1],[.1,.1]])tw(dx,dz,.17);b('box',0,.3*s,0,.04*s,.01*s,.2*s,0x8a7a66)},
  'Forbidden Palace':(b,s)=>{b('box',0,0,0,.46*s,.04*s,.34*s,0xece8de);b('box',0,0,.04*s,.32*s,.08*s,.18*s,SCOL.verm);b('hipTile',0,0,.12*s,.42*s,.05*s,.26*s,0xd8a83a);b('box',0,0,.17*s,.22*s,.03*s,.12*s,SCOL.verm);b('hipTile',0,0,.2*s,.3*s,.05*s,.18*s,0xd8a83a);
    for(const [dx,dz,w,d] of [[0,.24,.56,.015],[0,-.24,.56,.015],[.28,0,.015,.48],[-.28,0,.015,.48]]){b('box',dx*s,dz*s,0,w*s,.04*s,d*s,SCOL.verm);b('hipTile',dx*s,dz*s,.04*s,(w+.01)*s,.015*s,(d+.02)*s,0xd8a83a)}},
  'Great Hall of Todai':(b,s)=>{b('box',0,0,0,.46*s,.03*s,.34*s,0xa8a49a);b('timber',0,0,.03*s,.36*s,.1*s,.24*s,SCOL.wood);b('hipTile',0,0,.13*s,.46*s,.06*s,.32*s,0x2e3036);b('timber',0,0,.19*s,.26*s,.05*s,.16*s,SCOL.wood);b('hipTile',0,0,.24*s,.34*s,.08*s,.22*s,0x2e3036);
    for(const q of [-1,1])b('cyl',q*.02*s,0,.32*s,.008*s,.03*s,.008*s,SCOL.gold);for(const q of [-1,1])b('cyl',q*.06*s,.3*s,0,.01*s,.12*s,.01*s,SCOL.verm);b('box',0,.3*s,.11*s,.16*s,.015*s,.016*s,SCOL.verm)},
  'Temple of Kukulcan':(b,s)=>sPyramid(b,s*1.35,2,3,'meso',0xb8a888),
  'Machu Picchu':(b,s)=>{for(let t=0;t<5;t++){const w=(.5-t*.07)*s;b('box',0,-t*.02*s,t*.04*s,w,.04*s,w*.7,t%2?0x7a8a5a:0x6e7e50)}
    for(let i=0;i<10;i++){const a=i*2.4,r=(.06+(i%4)*.04)*s,x=Math.cos(a)*r,z=Math.sin(a)*r*.6,lv=Math.min(4,Math.floor(i/2.2));b('box',x,z,(lv+1)*.04*s,.035*s,.025*s,.03*s,SCOL.grey);b('hipThatch',x,z,(lv+1)*.04*s+.025*s,.045*s,.025*s,.04*s,0x8a7a58)}
    b('domeW',0,-.28*s,0,.24*s,.42*s,.2*s,0x4e5e3a)},
  'Basilica of Saint Peter':(b,s)=>sGreek(b,s*1.4,3,4,0,false),
  'Taj Mahal':(b,s)=>{const m=0xf4f2ee;b('box',0,0,0,.44*s,.03*s,.44*s,0xe8e2d6);b('box',0,0,.03*s,.22*s,.14*s,.22*s,m);for(const [dx,dz] of [[0,.111],[0,-.111],[.111,0],[-.111,0]])b('box',dx*s,dz*s,.04*s,(dx?.004:.09)*s,.12*s,(dz?.004:.09)*s,0x5a5040);
    b('adobeCyl',0,0,.17*s,.12*s,.04*s,.12*s,m);sOnion(b,0,0,.21*s,.12*s,m);for(const [dx,dz] of [[-.07,-.07],[.07,-.07],[-.07,.07],[.07,.07]])sOnion(b,dx*s,dz*s,.17*s,.04*s,m);
    for(const [dx,dz] of [[-.2,-.2],[.2,-.2],[-.2,.2],[.2,.2]])sMinaret(b,dx*s,dz*s,.32*s,.016*s,m,m);b('box',0,.36*s,0,.04*s,.004*s,.24*s,0x4a7a9a)},
  'Iron Tower':(b,s)=>{const c=0x6a5a4a,lean=.38;for(const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){for(let j=0;j<6;j++){const f=1-j/6;b('box',sx*.14*s*f,sz*.14*s*f,j*.06*s,.03*s*(.6+.4*f),.062*s,.03*s*(.6+.4*f),c,0)}}
    b('box',0,0,.12*s,.22*s,.015*s,.22*s,c);b('box',0,0,.3*s,.1*s,.012*s,.1*s,c);for(let j=0;j<8;j++)b('box',0,0,.36*s+j*.04*s,(.06-j*.006)*s,.04*s,(.06-j*.006)*s,c);b('cyl',0,0,.68*s,.004*s,.06*s,.004*s,c)},
  'Statue of Liberty':(b,s)=>{const g=0x6a9a8a;b('box',0,0,0,.3*s,.04*s,.3*s,0xb8b0a0);b('box',0,0,.04*s,.12*s,.14*s,.12*s,0xd2cab8);b('cyl',0,0,.18*s,.035*s,.16*s,.035*s,g);b('domeW',0,0,.34*s,.03*s,.035*s,.03*s,g);
    b('coneTile',0,0,.37*s,.03*s,.02*s,.03*s,g);b('cyl',.025*s,0,.3*s,.007*s,.12*s,.007*s,g);b('flame',.025*s,0,.42*s,.02*s,.04*s,.02*s);b('box',-.03*s,.012*s,.24*s,.01*s,.035*s,.025*s,g)}};
{const _w=wonder;wonder=function(n,x,y,z,k){const name=wonderName(n,k),fn=WONDER_BUILD[name];if(!fn)return _w.apply(this,arguments);
  try{fn(sacredB(x,y,z,0),SACRED_SCALE);const nc=parseInt(n.color.slice(1),16);add('box',x+.26,y-.02,z+.26,.02,.02,.02,0,nc)}catch(e){console.warn('wonder',e);return _w.apply(this,arguments)}}}

/* ---------- each wonder stands once in a world ---------- */
/* a nation builds its own culture's wonder of the age if no one has it yet; otherwise another of that age that is still free;
   when every one of them is taken, it builds none and the race goes on */
if(!('wonders' in GODW))GODW.wonders=null;
const wonderReg=()=>GODW.wonders||(GODW.wonders={});
function wonderPick(n,k){const reg=wonderReg(),want=wonderName(Object.assign({},n,{wonderName:null}),k),m=WONDER_BY[k]||{};
  const all=[want,...Object.values(m),WONDERS[k]&&WONDERS[k].name].filter((x,i,a)=>x&&a.indexOf(x)===i);
  const free=all.find(nm=>reg[nm]==null);n._wpick=free||null;return !!free}
function wonderClaim(n,name){wonderReg()[name]=n.id;n.wonders=n.wonders||[];if(!n.wonders.includes(name))n.wonders.push(name)}
/* the World panel lists the wonders standing and who built them */
{const _rs=renderSheet;renderSheet=function(full){_rs.apply(this,arguments);if(sheetPanel!=='world')return;const B=$('#sheetBody');if(!B||B.querySelector('[data-wonders]'))return;
  const reg=GODW.wonders||{},names=Object.keys(reg);const sec=document.createElement('div');sec.className='sec';sec.dataset.wonders='1';
  sec.innerHTML=`<h4>Wonders of the world</h4>`+(names.length?`<ul class="list">${names.map(nm=>{const o=nations[reg[nm]];return `<li><span class="nm">${esc(nm)}<small>${o?esc(o.name)+(o.alive?'':' (fallen)'):'a lost people'}</small></span></li>`}).join('')}</ul>`:'<p class="note">No wonder has been built yet. Each one can stand only once in a world.</p>');
  B.appendChild(sec)}}
