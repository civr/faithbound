"use strict";
/* Faithbound — rulers, families, dynasties and governors */
let folk={},folkId=0,houses=[];
const TRAITS={
  brave:{label:'Brave',desc:'Leads from the front',mil:1.1},
  wise:{label:'Wise',desc:'A patron of scholars',tech:1.1},
  ambitious:{label:'Ambitious',desc:'Hungry for land',exp:1.1,war:1.25},
  pious:{label:'Pious',desc:'Devoted to the faith',belief:1.15,spread:1.2},
  cruel:{label:'Cruel',desc:'Rules by fear',mil:1.05,stab:.85,war:1.2},
  just:{label:'Just',desc:'Fair to rich and poor',stab:1.2},
  peaceful:{label:'Peaceful',desc:'Prefers treaties to battles',war:.6,peace:1.4},
  reckless:{label:'Reckless',desc:'Acts first, thinks later',war:1.4,stab:.95},
  builder:{label:'Builder',desc:'Loves great works',grow:1.05},
  charming:{label:'Charming',desc:'Wins friends everywhere',peace:1.3,stab:1.05},
  scholar:{label:'Scholar',desc:'Reads more than rules',tech:1.15,mil:.95},
  sickly:{label:'Sickly',desc:'Often ill',grow:.98},
  seafarer:{label:'Seafarer',desc:'Dreams of distant shores',sea:1.4},
  greedy:{label:'Greedy',desc:'Taxes heavily',grow:.96,mil:1.05}};
const TKEYS=Object.keys(TRAITS);
const CLASH={brave:'sickly',peaceful:'reckless',just:'cruel',wise:'reckless',charming:'cruel',greedy:'just'};
const clash=(a,b)=>CLASH[a]===b||CLASH[b]===a;
const NSTART=['Al','Ber','Cor','Da','El','Fen','Gal','Hal','Is','Jor','Ka','Lu','Mer','Nor','Os','Per','Ro','Sel','Tor','Ul','Vi','Wil','Yr','Ze','Ae','Bri','Ca','Edw','Gre','Mo','Ser','Tam'];
const M_END=['ric','an','or','en','us','ald','win','mar','ian','o','eth','ar','ard','ek'],F_END=['a','ia','ine','wen','ra','elle','is','ya','eth','ora','isse','an'];
const HOUSE_END=['ford','mark','vale','holm','wick','stead','crest','mont','wyn','heim','dor','gard','ley','burn'];
const TITLE={tribal:['Elder','Elder'],chiefdom:['Chief','Chieftess'],kingdom:['King','Queen'],theocracy:['High Priest','High Priestess'],republic:['Consul','Consul'],
  empire:['Emperor','Empress'],feudal:['High King','High Queen'],merchant:['Doge','Dogaressa'],constmon:['King','Queen'],democracy:['President','President'],
  communism:['General Secretary','General Secretary'],fascism:['Supreme Leader','Supreme Leader'],technocracy:['Director','Director'],federation:['Chancellor','Chancellor'],directorate:['Directorate','Directorate']};
const SUCCESSION={tribal:'council',chiefdom:'blood',kingdom:'blood',theocracy:'council',republic:'vote',empire:'blood',feudal:'blood',merchant:'council',constmon:'blood',
  democracy:'vote',communism:'council',fascism:'council',technocracy:'vote',federation:'vote',directorate:'machine'};
const TERM={republic:10,democracy:4,technocracy:12,federation:8};
const HEADGEAR={kingdom:'crown',empire:'crown',feudal:'crown',constmon:'crown',merchant:'cap',chiefdom:'band',tribal:'band',theocracy:'mitre',republic:'laurel'};
const ROMAN=['','','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV'];

const givenName=sex=>NSTART[(rng()*NSTART.length)|0]+(sex==='f'?F_END:M_END)[(rng()*(sex==='f'?F_END:M_END).length)|0];
function newHouse(nid){const h={id:houses.length,name:genName(1,2)+HOUSE_END[(rng()*HOUSE_END.length)|0],nation:nid,founded:year};houses.push(h);return h.id}
function pickTraits(parents){const t=[];if(parents)for(const p of parents)if(p&&rng()<.35){const c=p.traits[(rng()*p.traits.length)|0];if(c&&c!=='anointed'&&!t.includes(c))t.push(c)}
  while(t.length<2){const c=TKEYS[(rng()*TKEYS.length)|0];if(!t.includes(c)&&!t.some(x=>clash(x,c)))t.push(c)}return t.slice(0,2)}
function newPerson(o){const p={id:folkId++,name:o.name||givenName(o.sex),sex:o.sex,born:o.born,died:null,house:o.house,father:o.father==null?null:o.father,mother:o.mother==null?null:o.mother,
  spouse:null,children:[],traits:o.traits||pickTraits(o.parents),nation:o.nation,cause:null,machine:!!o.machine};folk[p.id]=p;return p}
const ageOf=p=>(p.died==null?year:p.died)-p.born;
const per=id=>id==null?null:folk[id]||null;
const rulerOf=n=>per(n.ruler);
const titleOf=(n,p,gov)=>{const t=TITLE[gov||n.gov]||['Ruler','Ruler'];return p&&p.sex==='f'?t[1]:t[0]};
const houseName=id=>houses[id]?houses[id].name:'unknown';
function reignName(n,rg){const p=per(rg.p);return p?`${p.name}${rg.num>1?' '+(ROMAN[rg.num]||rg.num):''}`:'A forgotten ruler'}
function rulerLabel(n){const r=rulerOf(n);if(!r)return '';const rg=n.reigns[n.reigns.length-1];return `${titleOf(n,r)} ${reignName(n,rg)}`}
const important=n=>n.id===selected||topSet.has(n.id);
let topSet=new Set();

function deathChance(p){if(p.machine)return 0;const a=ageOf(p);let c=a<1?.04:a<5?.012:a<40?.004:.004+Math.pow((a-40)/42,3)*.45;if(p.traits.includes('sickly'))c*=1.7;if(p.traits.includes('anointed'))c*=.6;return Math.min(.6,c)}
function crown(n,p,how){n.ruler=p.id;n.reigns=n.reigns||[];const last=n.reigns[n.reigns.length-1];if(last&&last.to==null)last.to=year;
  const blood=SUCCESSION[n.gov]==='blood';const num=blood?n.reigns.filter(r=>per(r.p)&&per(r.p).name===p.name&&SUCCESSION[r.gov]==='blood').length+1:0;
  n.reigns.push({p:p.id,from:year,to:null,gov:n.gov,num,how,title:titleOf(n,p)});if(n.reigns.length>40)n.reigns.splice(0,n.reigns.length-40);
  n.termEnd=TERM[n.gov]?year+TERM[n.gov]:null;if(p.house!=null&&blood)n.house=p.house}
function withFamily(n,r){if(r.spouse==null&&ageOf(r)>=20&&rng()<.8){marry(n,r,true);const sp=per(r.spouse);const kids=Math.min(4,Math.floor((ageOf(r)-20)/6*rng()))+(rng()<.6?1:0);for(let k=0;k<kids;k++)birth(n,r,sp,true,year-((rng()*Math.max(1,ageOf(r)-20))|0))}}
function initRuler(n){const hid=n.house!=null?n.house:newHouse(n.id);n.house=hid;
  const r=newPerson({sex:rng()<.3?'f':'m',born:year-22-((rng()*18)|0),house:hid,nation:n.id});crown(n,r,'founder');withFamily(n,r)}
function marry(n,r,quiet){
  const known=(n.known||[]).map(i=>nations[i]).filter(m=>m&&m.alive&&m!==n&&!n.wars.has(m.id)&&m.house!=null);
  const foreign=known.length&&rng()<.35?known[(rng()*known.length)|0]:null;
  const sp=newPerson({sex:r.sex==='m'?'f':'m',born:r.born+((rng()*10)|0)-4,house:foreign?foreign.house:newHouse(n.id),nation:foreign?foreign.id:n.id});
  r.spouse=sp.id;sp.spouse=r.id;
  if(foreign){n.ties=n.ties||[];foreign.ties=foreign.ties||[];if(!n.ties.includes(foreign.id))n.ties.push(foreign.id);if(!foreign.ties.includes(n.id))foreign.ties.push(n.id);
    if(!quiet&&(important(n)||important(foreign)))log(`${rulerLabel(n)} of ${n.name} married ${sp.name} of House ${houseName(sp.house)}, binding ${n.name} to ${foreign.name}.`,'life')}
  else if(!quiet&&important(n))log(`${rulerLabel(n)} of ${n.name} married ${sp.name} of House ${houseName(sp.house)}.`,'life')}
function birth(n,r,sp,quiet,born){const mom=r.sex==='f'?r:sp,dad=r.sex==='m'?r:sp;
  const c=newPerson({sex:rng()<.5?'f':'m',born:born==null?year:born,house:r.house,father:dad?dad.id:null,mother:mom?mom.id:null,parents:[r,sp],nation:n.id});
  r.children.push(c.id);if(sp)sp.children.push(c.id);
  if(!quiet&&important(n)&&r.children.length<=2)log(`A ${c.sex==='f'?'daughter':'son'}, ${c.name}, was born to ${rulerLabel(n)} of ${n.name}.`,'life')}
const DEATH=['a fever','old wounds','a fall from a horse','a winter chill','a bad heart','a hunting accident','a sudden illness'];
function die(p,n){p.died=year;const a=ageOf(p);
  p.cause=a>62&&rng()<.7?'old age':n&&n.wars.size&&rng()<.35?'battle':n&&n.sick&&rng()<.5?'the '+n.sick.name:DEATH[(rng()*DEATH.length)|0]}
function heirOf(r){const kids=r.children.map(per).filter(c=>c&&c.died==null).sort((a,b)=>a.born-b.born);if(kids.length)return kids[0];
  const par=per(r.father)||per(r.mother);if(par){const sib=par.children.map(per).filter(c=>c&&c.died==null&&c.id!==r.id).sort((a,b)=>a.born-b.born);if(sib.length)return sib[0]}
  let best=null;for(const id in folk){const p=folk[id];if(p.house===r.house&&p.died==null&&p.id!==r.id&&p.nation===r.nation&&ageOf(p)>=14&&(!best||p.born<best.born))best=p}return best}
function notable(n){const hid=rng()<.5&&houses.some(h=>h.nation===n.id&&h.id!==n.house)?houses.filter(h=>h.nation===n.id&&h.id!==n.house)[0].id:newHouse(n.id);
  const p=newPerson({sex:rng()<(n.era>=5?.45:.2)?'f':'m',born:year-24-((rng()*18)|0),house:hid,nation:n.id});withFamily(n,p);return p}
function succeed(n,dead){
  const kind=SUCCESSION[n.gov]||'blood',imp=important(n),old=dead?`${dead.title} ${dead.label}`:'';
  if(kind==='machine'){const m=newPerson({sex:'m',born:year,house:null,nation:n.id,name:'The '+genName(1,2)+' Mind',traits:['wise','just'],machine:true});crown(n,m,'machine');return}
  if(kind==='blood'){const heir=dead?heirOf(dead.p):null;
    if(heir){crown(n,heir,'inherit');if(imp)log(`${old} died of ${dead.p.cause} at ${ageOf(dead.p)}. ${rulerLabel(n)} takes the throne${ageOf(heir)<16?' under a regent':''}.`,'era');return}
    const p=notable(n);crown(n,p,'crisis');n.house=p.house;
    log(`${dead?old+' died without heirs. ':''}${p.name} of House ${houseName(p.house)} seized the throne of ${n.name}.`,'war');
    if(n.cities.length>=4&&rng()<.15/Math.sqrt(paceInfo().techMult))rebel(n);return}
  const p=notable(n);crown(n,p,kind==='vote'?'elected':'chosen');
  if(imp)log(`${dead?old+' died of '+dead.p.cause+'. ':''}${rulerLabel(n)} now leads ${n.name}${kind==='vote'?', chosen by vote':''}.`,'era');
  if(n.gov==='fascism'&&dead&&rng()<.35)aiReform(n)}
function onGovChange(n,oldK,newK){if(!oldK||!n.reigns||!n.reigns.length)return;
  const a=SUCCESSION[oldK],b=SUCCESSION[newK];if(a===b&&a==='blood'){const r=rulerOf(n);if(r){n.reigns[n.reigns.length-1].to=year;crown(n,r,'kept')}return}
  const r=rulerOf(n),lab=rulerLabel(n);if(r&&important(n))log(`${lab} of ${n.name} lost power in the change.`,'war');succeed(n,null)}

/* yearly: ageing, marriages, births, deaths, elections, governors */
function peopleTick(){
  const al=nations.filter(n=>n.alive).sort((a,b)=>b.pop-a.pop);topSet=new Set(al.slice(0,3).map(n=>n.id));
  for(const n of al){
    if(n.ruler==null||!per(n.ruler)){initRuler(n);continue}
    const r=rulerOf(n);
    if(n.gov==='directorate'&&!r.machine){succeed(n,null);continue}
    if(r.machine)continue;
    if(r.spouse==null&&ageOf(r)>=17&&rng()<.12)marry(n,r);
    const sp=per(r.spouse);
    if(sp&&sp.died==null&&ageOf(r.sex==='f'?r:sp)<46&&r.children.length<7&&rng()<.16)birth(n,r,sp);
    if(r.spouse!=null&&sp&&sp.died!=null&&ageOf(r)<55&&rng()<.08){r.spouse=null}
    for(const id of r.children){const c=per(id);if(c&&c.died==null&&rng()<deathChance(c))die(c,n)}
    if(sp&&sp.died==null&&rng()<deathChance(sp)){die(sp,n);r.spouse=null}
    if(rng()<deathChance(r)*(n.wars.size?1.3:1)*(n.sick?1.6:1)){const dead={p:r,title:titleOf(n,r),label:reignName(n,n.reigns[n.reigns.length-1])};die(r,n);succeed(n,dead);continue}
    if(n.termEnd&&year>=n.termEnd){const rg=n.reigns[n.reigns.length-1],terms=n.reigns.filter(x=>x.p===r.id).length;
      if(n.gov!=='democracy'||terms<2)if(rng()<.45){n.termEnd=year+TERM[n.gov];if(important(n)&&rng()<.4)log(`${rulerLabel(n)} of ${n.name} won another term.`,'era');continue}
      const lab=rulerLabel(n);succeed(n,null);if(important(n))log(`${lab} stepped down. ${rulerLabel(n)} now leads ${n.name}.`,'era')}
    if(year%10===0)assignGovernors(n)}
  if(year%25===0)pruneFolk();
}
function assignGovernors(n){const r=rulerOf(n);if(!r)return;
  const fam=[...r.children.map(per),per(r.spouse)].filter(p=>p&&p.died==null&&ageOf(p)>=18);
  n.cities.forEach((c,ci)=>{if(ci===0){c.governor=r.id;return}const g=per(c.governor);if(g&&g.died==null)return;
    const pick=fam.length&&rng()<.5?fam[(rng()*fam.length)|0]:newPerson({sex:rng()<(n.era>=5?.45:.2)?'f':'m',born:year-30-((rng()*25)|0),house:newHouse(n.id),nation:n.id});
    c.governor=pick.id})}
function pruneFolk(){const keep=new Set();const add=id=>{if(id!=null&&folk[id])keep.add(id)};
  for(const n of nations){add(n.ruler);for(const rg of n.reigns||[])add(rg.p);for(const c of n.cities)add(c.governor);
    const r=rulerOf(n);if(r){add(r.spouse);add(r.father);add(r.mother);r.children.forEach(add);const par=per(r.father)||per(r.mother);if(par)par.children.forEach(add)}}
  for(const id of Object.keys(folk))if(!keep.has(+id))delete folk[id]}

/* ---------- portraits: small generated busts, original shapes ---------- */
const HAIR=['#2b1d14','#4a2f1d','#7a4e2c','#b98a52','#d8c08a','#8a8a8a','#e8e4dc','#1a1a1a'];
function portrait(p,n,size){const s=size||56,id=p?p.id:0,h=k=>hash(id*7.13+k);
  if(!p)return `<svg viewBox="0 0 64 64" width="${s}" height="${s}"><circle cx="32" cy="32" r="31" fill="#222a36"/></svg>`;
  if(p.machine)return `<svg viewBox="0 0 64 64" width="${s}" height="${s}" aria-hidden="true"><circle cx="32" cy="32" r="31" fill="#10202a"/><path d="M32 12l17 10v20L32 52 15 42V22z" fill="none" stroke="#7fe0f0" stroke-width="2.5"/><circle cx="32" cy="32" r="7" fill="#7fe0f0"/><circle cx="32" cy="32" r="3" fill="#10202a"/></svg>`;
  const skin=['#f1c6a0','#d9a07a','#a86e4b','#7a4a30','#e8b890'][(h(1)*5)|0],a=ageOf(p),hair=a>58?(a>70?'#e8e4dc':'#9a9a9a'):HAIR[(h(2)*6)|0];
  const robe=n?n.color:'#556',gov=n&&n.gov,gear=p.died==null&&n&&n.ruler===p.id?HEADGEAR[gov]:null,f=p.sex==='f';
  let hairP=f?`<path d="M18 30c0-12 6-18 14-18s14 6 14 18v14c-3-6-4-12-4-16-4 2-16 2-20 0 0 4-1 10-4 16z" fill="${hair}"/>`:`<path d="M20 28c0-10 5-15 12-15s12 5 12 15c-2-5-6-7-12-7s-10 2-12 7z" fill="${hair}"/>`;
  const beard=!f&&a>20&&h(3)<.55?`<path d="M23 34c1 9 5 13 9 13s8-4 9-13c-3 4-6 5-9 5s-6-1-9-5z" fill="${hair}"/>`:'';
  const gearP=gear==='crown'?`<path d="M20 17l4 7 4-8 4 8 4-8 4 8 4-7v8H20z" fill="#e2bd6a" stroke="#8a6a20" stroke-width="1"/>`
    :gear==='band'?`<path d="M20 22h24v4H20z" fill="#8a4a2a"/><path d="M38 22l5-11 1 12z" fill="#d8c08a"/>`
    :gear==='mitre'?`<path d="M23 23l9-15 9 15z" fill="#f3eee0" stroke="#c9a24a" stroke-width="1.5"/>`
    :gear==='laurel'?`<path d="M20 22c4-3 8-4 12-4s8 1 12 4" fill="none" stroke="#6c9a3a" stroke-width="3" stroke-dasharray="3 2"/>`
    :gear==='cap'?`<path d="M21 22c2-8 20-8 22 0z" fill="#a8322a"/>`:'';
  const modern=n&&n.era>=5&&!gear;
  return `<svg viewBox="0 0 64 64" width="${s}" height="${s}" aria-hidden="true"><defs><clipPath id="pc${id}"><circle cx="32" cy="32" r="31"/></clipPath></defs>
    <g clip-path="url(#pc${id})"><rect width="64" height="64" fill="#1b2330"/><path d="M6 64c2-14 12-20 26-20s24 6 26 20z" fill="${modern?'#2b3442':robe}"/>
    ${modern?`<path d="M28 45l4 8 4-8z" fill="#f0f0f0"/><path d="M31 47h2l1 9h-4z" fill="${robe}"/>`:`<path d="M24 45c3 3 13 3 16 0" fill="none" stroke="#e2bd6a" stroke-width="2"/>`}
    <rect x="28" y="36" width="8" height="9" fill="${skin}"/>${f?hairP:''}<ellipse cx="32" cy="29" rx="11" ry="13" fill="${skin}"/>${f?'':hairP}${beard}
    <circle cx="28" cy="29" r="1.3" fill="#1a1a1a"/><circle cx="36" cy="29" r="1.3" fill="#1a1a1a"/><path d="M29 36c2 1 4 1 6 0" stroke="#7a4030" stroke-width="1.2" fill="none"/>${gearP}
    ${p.died!=null?'<rect width="64" height="64" fill="#000" opacity=".45"/>':''}</g><circle cx="32" cy="32" r="31" fill="none" stroke="rgba(232,210,160,.4)" stroke-width="1.5"/></svg>`}
