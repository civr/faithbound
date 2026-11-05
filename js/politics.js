"use strict";
/* Faithbound — flags, stability, coups, revolutions and the god's hand in politics */

/* ---------- flags: every nation designs its own, and a new regime often raises a new one ---------- */
const FLAGCOL=['#f4f1e8','#e2b33c','#1d1d1d','#b22a2a','#24539c','#2f7a3c','#6a2c7a','#d9772b','#7fb3d9'];
const FLAG_LAYOUTS={west:['tri-v','tri-h','canton','saltire','emblem','bi-h','border','chevron','cross'],nordic:['nordic','nordic','nordic','cross','bi-h','tri-h'],
  med:['stripes','tri-v','canton','emblem','bi-v','cross'],mideast:['tri-h','emblem','bi-v','border','chevron','emblem'],africa:['tri-h','tri-v','diag','chevron','emblem','tri-h'],
  east:['disc','disc','emblem','bi-h','border','plain'],meso:['tri-v','emblem','stripes','chevron','border','tri-v']};
const FLAG_EMBLEMS={west:['crown','tower','bird','cross','star','none'],nordic:['none','none','crown','tree'],med:['sun','bird','tower','star','none'],
  mideast:['crescent','crescent','star','sun','none'],africa:['star','tree','sun','none'],east:['sun','sun','star','wheel','none'],meso:['sun','bird','star','tree','none']};
const GOV_FLAG={communism:{l:'plain',e:'star',ec:'#e2b33c',where:'canton'},fascism:{l:'disc',e:'wheel'},theocracy:{e:'sun'},empire:{e:'bird'},kingdom:{e:'crown'},
  feudal:{e:'tower'},constmon:{e:'crown'},republic:{l:'tri-v'},democracy:{l:'stripes'},federation:{l:'plain',e:'wheel',ec:'#f4f1e8'},directorate:{l:'border',e:'wheel'},
  technocracy:{l:'diag'},merchant:{e:'tower'}};
const colDist=(a,b)=>{const A=hexRgb(a),B=hexRgb(b);return Math.abs(A[0]-B[0])+Math.abs(A[1]-B[1])+Math.abs(A[2]-B[2])};
function makeFlag(n,gov){const cu=typeof cultOf==='function'?cultOf(n):'west',pick=a=>a[(rng()*a.length)|0];
  const c0=n.color,pool=FLAGCOL.filter(c=>colDist(c,c0)>150);const c1=pick(pool),c2=pick(pool.filter(c=>colDist(c,c1)>150))||c1;
  const f={l:pick(FLAG_LAYOUTS[cu]||FLAG_LAYOUTS.west),c:[c0,c1,c2],e:pick(FLAG_EMBLEMS[cu]||FLAG_EMBLEMS.west),ec:colDist(c1,c0)>150?c1:'#f4f1e8'};
  const g=gov&&GOV_FLAG[gov];if(g&&rng()<.75){if(g.l)f.l=g.l;if(g.e)f.e=g.e;if(g.ec)f.ec=g.ec;if(g.where)f.where=g.where}
  if(['nordic','cross','saltire'].includes(f.l)&&!(g&&g.e))f.e='none';return f}
function ensureFlag(n){if(!n.flag)n.flag=makeFlag(n,null);return n.flag}
function emblem(x,k,cx,cy,s,col,bg){x.fillStyle=col;x.strokeStyle=col;x.lineWidth=s*.12;x.beginPath();
  if(k==='star'){for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?s*.4:s;x.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r)}x.closePath();x.fill()}
  else if(k==='sun'){x.arc(cx,cy,s*.5,0,7);x.fill();for(let i=0;i<12;i++){const a=i*Math.PI/6;x.beginPath();x.moveTo(cx+Math.cos(a)*s*.62,cy+Math.sin(a)*s*.62);x.lineTo(cx+Math.cos(a)*s,cy+Math.sin(a)*s);x.stroke()}}
  else if(k==='crescent'){x.arc(cx,cy,s*.8,0,7);x.fill();x.fillStyle=bg||'#000';x.beginPath();x.arc(cx+s*.32,cy-s*.08,s*.66,0,7);x.fill();x.fillStyle=col}
  else if(k==='crown'){x.moveTo(cx-s*.8,cy+s*.5);x.lineTo(cx-s*.8,cy-s*.4);x.lineTo(cx-s*.4,cy);x.lineTo(cx,cy-s*.7);x.lineTo(cx+s*.4,cy);x.lineTo(cx+s*.8,cy-s*.4);x.lineTo(cx+s*.8,cy+s*.5);x.closePath();x.fill()}
  else if(k==='tree'){x.moveTo(cx,cy-s);x.lineTo(cx+s*.7,cy+s*.35);x.lineTo(cx-s*.7,cy+s*.35);x.closePath();x.fill();x.fillRect(cx-s*.12,cy+s*.3,s*.24,s*.6)}
  else if(k==='tower'){x.fillRect(cx-s*.5,cy-s*.4,s,s*1.3);for(let i=0;i<3;i++)x.fillRect(cx-s*.5+i*s*.4,cy-s*.75,s*.22,s*.4)}
  else if(k==='wheel'){x.arc(cx,cy,s*.75,0,7);x.stroke();for(let i=0;i<4;i++){const a=i*Math.PI/4;x.beginPath();x.moveTo(cx-Math.cos(a)*s*.75,cy-Math.sin(a)*s*.75);x.lineTo(cx+Math.cos(a)*s*.75,cy+Math.sin(a)*s*.75);x.stroke()}}
  else if(k==='bird'){x.moveTo(cx,cy-s*.5);x.lineTo(cx+s,cy-s*.8);x.lineTo(cx+s*.55,cy);x.lineTo(cx+s*.2,cy+s*.1);x.lineTo(cx+s*.25,cy+s*.85);x.lineTo(cx,cy+s*.55);x.lineTo(cx-s*.25,cy+s*.85);x.lineTo(cx-s*.2,cy+s*.1);x.lineTo(cx-s*.55,cy);x.lineTo(cx-s,cy-s*.8);x.closePath();x.fill()}
  else if(k==='cross'){x.fillRect(cx-s*.18,cy-s*.8,s*.36,s*1.6);x.fillRect(cx-s*.65,cy-s*.35,s*1.3,s*.36)}}
function drawFlag(x,f,w,h){const [a,b,c]=f.c;const R=(col,X,Y,W_,H_)=>{x.fillStyle=col;x.fillRect(X,Y,W_,H_)};let ex=w/2,ey=h/2,es=h*.28;
  switch(f.l){
  case 'tri-v':R(a,0,0,w/3+1,h);R(b,w/3,0,w/3+1,h);R(c,2*w/3,0,w/3+1,h);es=h*.22;break;
  case 'tri-h':R(a,0,0,w,h/3+1);R(b,0,h/3,w,h/3+1);R(c,0,2*h/3,w,h/3+1);es=h*.13;break;
  case 'bi-h':R(a,0,0,w,h/2+1);R(c,0,h/2,w,h/2);break;
  case 'bi-v':R(b,0,0,w*.3,h);R(a,w*.3,0,w*.7,h);ex=w*.62;break;
  case 'nordic':R(a,0,0,w,h);R(b,w*.28,0,h*.24,h);R(b,0,h*.38,w,h*.24);R(c,w*.31,0,h*.1,h);R(c,0,h*.45,w,h*.1);break;
  case 'cross':R(a,0,0,w,h);R(b,w/2-h*.1,0,h*.2,h);R(b,0,h*.4,w,h*.2);break;
  case 'saltire':R(a,0,0,w,h);x.strokeStyle=b;x.lineWidth=h*.18;x.beginPath();x.moveTo(0,0);x.lineTo(w,h);x.moveTo(w,0);x.lineTo(0,h);x.stroke();break;
  case 'canton':for(let i=0;i<5;i++)R(i%2?b:a,0,i*h/5,w,h/5+1);R(c,0,0,w*.42,h*.6);ex=w*.21;ey=h*.3;es=h*.2;break;
  case 'border':R(b,0,0,w,h);R(a,w*.08,h*.12,w*.84,h*.76);break;
  case 'chevron':R(a,0,0,w,h/2+1);R(c,0,h/2,w,h/2);x.fillStyle=b;x.beginPath();x.moveTo(0,0);x.lineTo(w*.42,h/2);x.lineTo(0,h);x.fill();ex=w*.14;es=h*.16;break;
  case 'diag':R(a,0,0,w,h);x.fillStyle=c;x.beginPath();x.moveTo(w,0);x.lineTo(w,h);x.lineTo(0,h);x.fill();x.strokeStyle=b;x.lineWidth=h*.16;x.beginPath();x.moveTo(0,h);x.lineTo(w,0);x.stroke();ex=w*.22;ey=h*.28;es=h*.16;break;
  case 'disc':R(b==='#1d1d1d'?'#f4f1e8':b,0,0,w,h);x.fillStyle=a;x.beginPath();x.arc(w/2,h/2,h*.32,0,7);x.fill();es=h*.2;break;
  case 'stripes':for(let i=0;i<7;i++)R(i%2?b:a,0,i*h/7,w,h/7+1);R(c,0,0,w*.4,h*4/7);ex=w*.2;ey=h*2/7;es=h*.17;break;
  default:R(a,0,0,w,h)}
  if(f.where==='canton'){ex=w*.2;ey=h*.28;es=h*.18}
  if(f.e&&f.e!=='none'){let col=f.ec||b;if(f.l==='disc')col=a==='#1d1d1d'?'#f4f1e8':'#1d1d1d';else if(colDist(col,f.l==='tri-v'?b:a)<120)col=colDist('#f4f1e8',a)>200?'#f4f1e8':'#1d1d1d';emblem(x,f.e,ex,ey,es,col,x.getImageData(Math.max(0,Math.min(w-1,ex+es*.5|0)),Math.max(0,Math.min(h-1,ey-es*.1|0)),1,1).data.slice(0,3).reduce((s,v)=>s+v.toString(16).padStart(2,'0'),'#'))}
  x.fillStyle='rgba(0,0,0,.08)';x.fillRect(0,h-2,w,2)}
const flagKey=f=>f?f.l+f.c.join('')+f.e+(f.ec||'')+(f.where||''):'';
const FLAGURL=new Map(),FLAGTEX=new Map();
function flagURL(f){const k=flagKey(f);if(FLAGURL.has(k))return FLAGURL.get(k);const cv=document.createElement('canvas');cv.width=60;cv.height=40;drawFlag(cv.getContext('2d'),f,60,40);const u=cv.toDataURL();FLAGURL.set(k,u);return u}
function flagTexture(f){const k=flagKey(f);if(FLAGTEX.has(k))return FLAGTEX.get(k);const cv=document.createElement('canvas');cv.width=96;cv.height=64;drawFlag(cv.getContext('2d'),f,96,64);
  const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;t.shared=true;FLAGTEX.set(k,t);return t}
const flagImg=(n,cls)=>`<img class="${cls||'flag'}" src="${flagURL(ensureFlag(n))}" alt="">`;
function newFlag(n,why){const old=flagKey(n.flag);n.flag=makeFlag(n,n.gov);if(flagKey(n.flag)!==old){propsDirty=true;if(why&&important(n))log(`${n.name} raised a new flag${why}.`,'life')}}

/* ---------- happiness: how the common people feel. Unhappy peoples riot, rise up and break away ---------- */
const GOV_HAPPY={tribal:.04,chiefdom:0,kingdom:-.02,theocracy:-.02,republic:.05,empire:-.05,feudal:-.07,merchant:.06,constmon:.05,democracy:.08,communism:-.06,fascism:-.1};
const HAPPY_TRAIT={just:.06,charming:.04,pious:.02,builder:.04,cruel:-.1,greedy:-.08,reckless:-.03,anointed:.05};
function happyParts(n){const P=[],add=(l,v)=>{if(Math.abs(v)>=.005)P.push([l,v])};
  if(n.famine>0)add('Hunger',-.28);if(n.sick)add('Sickness',-.14);
  if(n.wars.size){let ww=0;for(const b of n.wars){const B=nations[b],w=B&&warData[warKey(n,B)];ww+=.04+(w?Math.min(.12,w.years*.005):0)}add('War weariness',-Math.min(.3,ww))}
  add('Rule',GOV_HAPPY[n.gov]||0);
  const r=rulerOf(n);if(r&&!r.machine){let v=0;for(const t of r.traits)v+=HAPPY_TRAIT[t]||0;add('The ruler',v)}
  if(n.trade&&n.trade.length)add('Trade and plenty',Math.min(.1,.025*n.trade.length));
  if(n.res&&typeof RKEYS!=='undefined'){let miss=0;for(const k of RKEYS)if(typeof need==='function'&&need(n,k)&&!(n.res.has[k]>0))miss++;if(miss)add('Shortages',-Math.min(.09,.03*miss))}
  if(n.festival>0)add('Festival',.14);if(n.bless>0)add('Your blessing',.07);if(n.golden>year)add('Golden age',.12);
  add('Faith in you',((n.devotion??.3)-.25)*.3);
  const conq=n.cities.filter(c=>c.conq&&year-c.conq<40).length;if(conq)add('Conquered towns',-Math.min(.16,.04*conq));
  const crowd=Math.max(0,n.pop/Math.max(1,n.cities.length)-(220+n.era*90))/900;if(crowd>0)add('Crowded towns',-Math.min(.1,crowd));
  if(n.era===5)add('Smoke and mills',-.05);if(n.era>=6)add('Comforts of the age',.04);
  if(n.discord>0)add('Discord you sowed',-.12);if(n.cursed>year)add('Cursed by a god',-.16);if(n.tribute&&n.tribute.until>year)add(n.tribute.pay?'Paying tribute':'Tribute flowing in',n.tribute.pay?-.08:.04);if(n.upheaval!=null&&year-n.upheaval<20)add('Hope after upheaval',.06*(1-(year-n.upheaval)/20));
  return P}
const happyTarget=n=>clamp(.64+happyParts(n).reduce((s,p)=>s+p[1],0),0,1);
const happyOf=n=>n.happy==null?.6:n.happy;
const happyLabel=v=>v>.78?'Joyful':v>.6?'Content':v>.44?'Grumbling':v>.28?'Angry':'Seething';
const happyColor=v=>v>.6?'#8fd18a':v>.44?'#e8c060':v>.28?'#e89a50':'#e8645a';
/* the people rise: riots first, then revolution or towns breaking away */
function uprising(n){const w=[['riot',1.4],['revolution',n.era>=2?1.3:.2],['civil',n.cities.length>=3?1:0]];let s=rng()*w.reduce((a,b)=>a+b[1],0),k='riot';for(const [id,v] of w){s-=v;if(s<=0){k=id;break}}
  if(k==='riot')riot(n);else if(k==='revolution'){if(important(n))log(`The angry people of ${n.name} rose against their rulers.`,'war');revolution(n,false)}else{if(important(n))log(`Discontent tore ${n.name} apart: towns broke away.`,'war');rebel(n);n.upheaval=year}
  n.happy=Math.min(1,happyOf(n)+.12)}
/* ---------- stability: how firmly the realm holds together ---------- */
TRAITS.anointed={label:'Anointed',desc:'Chosen by you; the people trust this ruler',stab:1.12,belief:1.2};
const STAB_TRAIT={just:.08,charming:.05,wise:.03,pious:.03,builder:.02,cruel:-.07,greedy:-.06,reckless:-.04,ambitious:-.02,anointed:.14};
function stabParts(n){const P=[],add=(l,v)=>{if(Math.abs(v)>=.005)P.push([l,v])};
  const g=GOVS[n.gov];if(g)add(g.name,((g.stab||1)-1)*.45);
  const r=rulerOf(n);if(r&&!r.machine){let v=0;for(const t of r.traits)v+=STAB_TRAIT[t]||0;add('Ruler’s character',v);
    if(ageOf(r)<16)add('Child on the throne',-.1);else if(ageOf(r)>72)add('Ageing ruler',-.04);
    const rg=n.reigns&&n.reigns[n.reigns.length-1];if(rg&&['crisis','coup'].includes(rg.how)&&year-rg.from<25)add('Seized power',-.12*(1-(year-rg.from)/25))}
  add('Faith in you',((n.devotion??.3)-.3)*.45);
  add('Mood of the people',(happyOf(n)-.55)*.5);
  if(n.wars.size)add('At war',-Math.min(.15,.05*n.wars.size));
  if(n.famine>0)add('Famine',-.12);if(n.sick)add(n.sick.name,-.08);if(n.festival>0)add('Festival',.08);if(n.bless>0)add('Your blessing',.05);
  const over=Math.max(0,n.cities.length-(4+n.era))*.02*(n.gov==='empire'||n.gov==='federation'?.5:1);add('Too large to govern',-Math.min(.2,over));
  if(n.upheaval!=null)add('Recent upheaval',-.15*Math.exp(-(year-n.upheaval)/15));
  if(n.discord>0)add('Discord you sowed',-.25*Math.min(1,n.discord/15));
  if(n.trade&&n.trade.length)add('Trade',Math.min(.08,.02*n.trade.length));
  if(n.golden>year)add('Golden age',.05);
  return P}
const stabTarget=n=>clamp(.6+stabParts(n).reduce((s,p)=>s+p[1],0),0,1);
const stabOf=n=>n.stab==null?.6:n.stab;
const stabLabel=s=>s>.8?'Steadfast':s>.6?'Stable':s>.42?'Uneasy':s>.25?'Restless':'In turmoil';
const stabColor=s=>s>.6?'#8fd18a':s>.42?'#e8c060':s>.25?'#e89a50':'#e8645a';
/* growth, progress and unrest all follow stability */
const stabGrow=n=>(.82+.36*stabOf(n))*(n.golden>year?1.15:1);
const stabTech=n=>(.78+.44*stabOf(n))*(n.golden>year?1.25:1);
const stabUnrest=n=>1.7-stabOf(n)*1.4;

function politicsTick(n){ensureFlag(n);if(n.stab==null)n.stab=.6;if(n.happy==null)n.happy=.6;if(n.discord>0)n.discord--;
  n.happy+=(happyTarget(n)-n.happy)*.08;n.happy=clamp(n.happy,0,1);
  if(n.happy<.32&&n.cities.length&&rng()<(.32-n.happy)*.09*mood().riot){uprising(n);return}
  n.stab+=(stabTarget(n)-n.stab)*.06;n.stab=clamp(n.stab,0,1);
  if(n.golden>year&&n.stab<.55){n.golden=0;if(important(n))log(`The golden age of ${n.name} came to an end.`,'life')}
  if(!(n.golden>year)&&n.stab>.8&&n.era>=1&&rng()<.012){n.golden=year+40;n.devotion=clamp((n.devotion??.3)+.05,0,1);log(`A golden age dawns in ${n.name}: art, learning and plenty.`,'era');milestone('golden','A golden age','A nation flourished in peace and plenty.')}
  if(n.stab<.36&&n.cities.length&&rng()<(.36-n.stab)*.12)crisis(n);
  else if(n.stab<.45&&n.cities.length>1&&rng()<.004)riot(n)}
/* a realm in turmoil breaks: riots, a coup, a revolution or civil war */
function crisis(n){const r=rulerOf(n),w=[['riot',1.2],['coup',(n.wars.size?1.4:.7)*((GOVS[n.gov]&&GOVS[n.gov].mil)||1)*(r&&r.traits.includes('cruel')?1.3:1)],
    ['revolution',n.era>=2?(n.era>=4?1.4:.8):.15],['civil',n.cities.length>=3?.6:0]];
  let s=rng()*w.reduce((a,b)=>a+b[1],0),k='riot';for(const [id,v] of w){s-=v;if(s<=0){k=id;break}}
  if(k==='riot')riot(n);else if(k==='coup')coup(n,false);else if(k==='revolution')revolution(n,false);else{rebel(n);n.upheaval=year;n.stab=Math.min(1,n.stab+.12)}}
function riot(n){const cs=n.cities.slice(),c=cs[(rng()*cs.length)|0];c.riot=year;c.unrest=(c.unrest||0)+.3;n.pop*=.97;propsDirty=true;
  log(`Riots broke out in ${c.name}. The people of ${n.name} have had enough.`,'war');n.stab=Math.min(1,n.stab+.04)}
const MIL_GOV=[['chiefdom'],['chiefdom','kingdom'],['empire'],['empire','feudal'],['empire'],['fascism'],['fascism'],['directorate']];
const POP_GOV=[['tribal'],['tribal'],['republic'],['republic'],['merchant','republic'],['democracy','communism'],['democracy','communism'],['federation','democracy']];
function newLeader(n,traits,how){const p=newPerson({sex:rng()<(n.era>=5?.4:n.era>=3?.12:.08)?'f':'m',born:year-32-((rng()*18)|0),house:newHouse(n.id),nation:n.id,traits});return p}
function oust(n,cause){const r=rulerOf(n);if(!r||r.machine)return '';const lab=rulerLabel(n);
  if(rng()<.45){die(r,n);r.cause=cause;return ` ${lab} was put to death.`}r.exiled=true;return ` ${lab} fled into exile.`}
function regime(n,k,leader,how){const oldK=n.gov;if(k&&k!==n.gov)n.gov=k;crown(n,leader,how);n.house=leader.house;n.upheaval=year;n.golden=0;
  if(n.gov!==oldK||rng()<.5)newFlag(n,'');for(const c of n.cities)c.unrest=(c.unrest||0)*.5;propsDirty=true}
function coup(n,god){const opts=govOptions(n);let k=(MIL_GOV[n.era]||[]).find(g=>opts.includes(g))||n.gov;
  const gen=newLeader(n,[['brave','cruel','ambitious','reckless'][(rng()*4)|0],rng()<.5?'ambitious':'brave'].filter((t,i,a)=>a.indexOf(t)===i).concat(rng()<.5?[]:['greedy']).slice(0,2));
  const fate=oust(n,'the swords of the guard');const changed=k!==n.gov;regime(n,k,gen,'coup');n.stab=Math.max(n.stab,.42);n.aggr=Math.min(1,n.aggr+.15);n.pop*=.985;
  log(`${god?'At your sign, the':'The'} army of ${n.name} seized power.${fate} ${titleOf(n,gen)} ${gen.name} now rules${changed?' a '+GOVS[n.gov].name:''}.`,'war');
  milestone('coup','Coup!','An army overthrew its own ruler.')}
function revolution(n,god){const opts=govOptions(n).filter(g=>g!==n.gov);const pool=(POP_GOV[n.era]||[]).filter(g=>opts.includes(g));
  const k=pool.length?pool[(rng()*pool.length)|0]:opts.length?opts[(rng()*opts.length)|0]:n.gov;
  const lead=newLeader(n,[['just','charming','wise','scholar'][(rng()*4)|0],['peaceful','just','builder','charming'][(rng()*4)|0]].filter((t,i,a)=>a.indexOf(t)===i));
  const fate=oust(n,'the people’s court');regime(n,k,lead,SUCCESSION[k]==='vote'?'elected':'revolution');n.stab=Math.max(n.stab,.45);n.aggr*=.85;n.pop*=.97;
  log(`Revolution in ${n.name}!${god?' Your whisper became a roar.':''} The people rose up and proclaimed ${/^[AEIOU]/.test(GOVS[n.gov].name)?'an':'a'} ${GOVS[n.gov].name}.${fate} ${lead.name} now leads them.`,'war');
  milestone('revolution','Revolution','A people overthrew its rulers.');
  if(!god&&n.cities.length>=3&&rng()<.3)rebel(n)}
function assassinate(n){const r=rulerOf(n);if(!r||r.machine)return false;const rg=n.reigns[n.reigns.length-1],dead={p:r,title:titleOf(n,r),label:reignName(n,rg)};
  die(r,n);r.cause='an assassin’s blade';log(`${dead.title} ${dead.label} of ${n.name} was struck down by an assassin.`,'doom');n.stab=Math.max(0,n.stab-.12);n.upheaval=year-6;succeed(n,dead);return true}
function anoint(n){const r=rulerOf(n);if(!r||r.machine)return false;if(r.traits.includes('anointed'))return null;r.traits.push('anointed');
  n.stab=Math.min(1,n.stab+.15);n.devotion=clamp((n.devotion??.3)+.15,0,1);log(`You anointed ${rulerLabel(n)} of ${n.name}. The people kneel before your chosen one.`,'faith');return true}
function sowDiscord(n){n.discord=15;n.stab=Math.max(0,n.stab-.25);for(const c of n.cities)c.unrest=(c.unrest||0)+.15;n.devotion=clamp((n.devotion??.3)-.04,0,1);
  log(`Whispers of discord spread through ${n.name}. Nobles plot, crowds gather.`,'war')}
