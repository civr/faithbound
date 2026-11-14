"use strict";
/* Faithbound — how a nation arms itself, and war at sea.
   Not every people keeps a great army or a war fleet. Each nation has its own way, from its land and its history:
   - a great army: a land power ringed by neighbours, with a big standing army, quick to go to war;
   - a sea power: a coastal or island people with a large fleet, more warships to a squadron, and in the modern age submarines;
   - a militia only: a quiet people with few neighbours that keeps no real army, rarely makes war, and grows and trades instead;
   - balanced: some of each.
   A peaceful people that is attacked again and again raises a standing army; now and then a nation changes its ways.
   At sea, hits set ships afire and the fire can finish them; submarines sail submerged, are only found close by, and fire torpedoes. */

const DOC={land:{label:'Great army',mod:{mil:1.35,war:1.4,exp:1.08,sea:.85}},naval:{label:'Sea power',mod:{sea:1.6,mil:1.05,tech:1.03}},
  peaceful:{label:'Militia only',mod:{mil:.65,war:.35,peace:1.6,grow:1.05,tech:1.05}},balanced:{label:'Balanced',mod:{}}};
function pickDoctrine(n){const ports=n.cities.filter(c=>coastWater(c).length).length,cs=n.cities.length?ports/n.cities.length:0,nb=n.nb?n.nb.size:0;
  const w={naval:.2+cs*2+(n.tiles<60&&cs>.3?.6:0),land:.2+nb*.35+(cs<.25?.8:0),peaceful:(nb<=1?1.1:nb<=2?.4:.1)+(n.gov==='tribal'||n.gov==='republic'||n.gov==='democracy'?.3:0),balanced:1};
  let r=rng()*(w.naval+w.land+w.peaceful+w.balanced);for(const k of ['naval','land','peaceful','balanced']){r-=w[k];if(r<=0)return k}return 'balanced'}
function doctrineTick(){for(const n of nations){if(!n.alive||!n.cities.length)continue;
    if(!n.doc){n.doc=pickDoctrine(n);n.docY=year}
    /* now and then a people changes its ways */
    else if(year-(n.docY||0)>120&&rng()<.01){const d=pickDoctrine(n);if(d!==n.doc){const was=n.doc;n.doc=d;n.docY=year;
        if(important(n)||n.id===selected)log(d==='naval'?`${n.name} turned to the sea and built a great fleet.`:d==='land'?`${n.name} raised a great standing army.`:d==='peaceful'?`${n.name} disbanded most of its army${was==='land'?' after generations of war':''}; a militia guards its towns.`:`${n.name} now keeps both an army and a fleet.`,'war')}}
    let m=DOC[n.doc]?DOC[n.doc].mod:null;
    /* the bomb: a nation that has it, and knows what it can do to its own cities, goes to war far less readily */
    if((n.techs||[]).includes('atomic')||(n.nukes||0)>0){m=Object.assign({},m||{});m.war=(m.war||1)*.22;m.peace=(m.peace||1)*1.8;
      if(!milestones.has('deterrence'))milestone('deterrence','The age of deterrence','The bomb made great wars rare.')}
    n._docMod=m}}
{const _sw=startWar;startWar=function(a,b,kind){const was=a&&b&&a.wars.has(b.id);const r=_sw.apply(this,arguments);
  /* a peaceful people that is attacked twice raises a standing army */
  if(!was&&b&&b.doc==='peaceful'&&a&&a.wars.has(b.id)){b.docShock=(b.docShock||0)+1;if(b.docShock>=2){b.doc='balanced';b.docY=year;b.docShock=0;b._docMod=DOC.balanced.mod;if(important(b)||b.id===selected)log(`Attacked once too often, ${b.name} raised a standing army.`,'war')}}
  return r}}
{const _t=tick;tick=function(){_t.apply(this,arguments);try{doctrineTick()}catch(e){console.warn('navy',e)}}}

/* ---------- submarines and torpedoes ---------- */
const SUBMAT=new THREE.MeshStandardMaterial({color:0x2e3236,roughness:.7,metalness:.2});
function makeSub(col){const g=new THREE.Group(),hull=new THREE.Mesh(new THREE.CylinderGeometry(.026,.026,.26,10),SUBMAT);hull.rotation.z=Math.PI/2;g.add(hull);
  for(const s of [-1,1]){const cap=new THREE.Mesh(new THREE.SphereGeometry(.026,8,6),SUBMAT);cap.position.x=s*.13;cap.scale.x=1.6;g.add(cap)}
  const tower=new THREE.Mesh(new THREE.BoxGeometry(.05,.045,.018),SUBMAT);tower.position.set(.02,.035,0);g.add(tower);
  const scope=new THREE.Mesh(new THREE.CylinderGeometry(.002,.002,.05,4),SUBMAT);scope.position.set(.03,.07,0);g.add(scope);
  const band=new THREE.Mesh(new THREE.BoxGeometry(.03,.006,.019),new THREE.MeshStandardMaterial({color:new THREE.Color(col),roughness:.8}));band.position.set(.02,.05,0);g.add(band);
  g.userData.mats=[band.material];scene.add(g);return g}
let TORPS=[];
function fireTorpedo(s,f){TORPS.push({x:s.x,z:s.z,t:f,from:s,v:.55,trail:0});if(Math.hypot(s.x-camT.x,s.z-camT.z)<camDist*.8&&typeof sfx==='function')sfx('splash')}
function torpTick(dt){for(let q=TORPS.length-1;q>=0;q--){const T=TORPS[q],f=T.t;if(!f||f.sink||!ships.includes(f)){TORPS.splice(q,1);continue}
    const dx=f.x-T.x,dz=f.z-T.z,d=Math.hypot(dx,dz)||1,st=Math.min(d,T.v*dt);T.x+=dx/d*st;T.z+=dz/d*st;T.trail+=dt;if(T.trail>.05){T.trail=0;emit('foam',T.x,waterY+.008,T.z,0,0)}
    if(d<.06){TORPS.splice(q,1);/* a column of water, then fire */for(let k=0;k<10;k++)emit('spray',f.x,waterY+.05,f.z,(rng()-.5)*.12,(rng()-.5)*.12);for(let k=0;k<5;k++)emit('fire',f.x,waterY+.07,f.z);emit('flash',f.x,waterY+.06,f.z);
      f.hp=(f.hp??2)-2.2*(.7+rng()*.6);f.burn=Math.max(f.burn||0,8);if(Math.hypot(f.x-camT.x,f.z-camT.z)<camDist*.8&&typeof sfx==='function')sfx('cannon');
      if(f.hp<=0&&!f.sink){f.sink=.01;const A=nations[T.from.owner],B=nations[f.owner];if(A&&B&&(important(A)||important(B))&&year-(A._torpLog||-99)>10){A._torpLog=year;log(`A submarine of ${A.name} torpedoed a ship of ${B.name}.`,'war')}}}}}
{const _us=updateShips;updateShips=function(dy,dt,now){_us.apply(this,arguments);if(dy>0)try{torpTick(dt)}catch(e){TORPS=[]}}}

/* ---------- the nation card ---------- */
{const _rn=renderNationCard;renderNationCard=function(){_rn.apply(this,arguments);const n=nations[selected];if(!n||!n.alive||!n.doc)return;const el=$('#nationCard');if(!el)return;const kv=el.querySelector('.kv');if(!kv||kv.querySelector('[data-doc]'))return;
  const v=document.createElement('div');v.dataset.doc='1';v.innerHTML=`<span>Military</span><b>${DOC[n.doc].label}</b>`;kv.appendChild(v)}}
