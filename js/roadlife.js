"use strict";
/* Faithbound — life on the roads. Every road you can see has travellers on it, of their age: people on foot with bundles and packs, riders,
   ox carts with hay and sacks, and from the Middle Ages coaches drawn by two horses. They keep to their side of the road and turn back at
   the towns. (The modern age has its cars and buses already.) Only the roads near the camera are peopled. */

const ROAD_KINDS=[['walk','walk','pack'],['walk','pack','ox','rider'],['walk','pack','ox','rider'],['walk','ox','rider','coach','cart'],['walk','ox','rider','coach','cart'],['walk','coach','cart','rider','coach']];
const ROAD_SPD={walk:.05,pack:.045,ox:.04,cart:.06,rider:.12,coach:.1};
const COACH_COL=[0x5a1e1e,0x1e3a2a,0x1e2a4a,0x2a2420,0x6a4a2a];
function roadAt(L,s){const A=L.acc;let lo=0,hi=A.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(A[m]<=s)lo=m;else hi=m}
  const a=L.pts[lo],b=L.pts[Math.min(hi,L.pts.length-1)],seg=(A[hi]-A[lo])||1,t=clamp((s-A[lo])/seg,0,1);return [lerp(a[0],b[0],t),lerp(a[1],b[1],t),Math.atan2(b[1]-a[1],b[0]-a[0])]}
const roadNear=(L,R)=>L.box[0]-R<camT.x&&L.box[1]+R>camT.x&&L.box[2]-R<camT.z&&L.box[3]+R>camT.z;
function roadPeople(L,n){const e=Math.min(5,n.era),K=ROAD_KINDS[e],cnt=clamp(Math.round(L.len/1.3),1,40);L.trav=[];
  for(let q=0;q<cnt;q++){const r=mulberry32((L.nid*977+q*131+Math.round(L.len*100))|0),kind=K[(r()*K.length)|0];
    const T={kind,s:r()*L.len,dir:r()<.5?1:-1,spd:ROAD_SPD[kind]*(.8+r()*.4),seed:(r()*1e9)|0,col:COACH_COL[(r()*COACH_COL.length)|0],x:0,z:0,a:0,w:null};
    if(kind!=='ox'&&kind!=='cart'||r()<.7){/* the traveller, or the driver */const w={seed:T.seed,t:q,ph:r()*6,moving:true,wait:0,act:'walk',x:0,z:0,dir:0};dressFolk(w,n);w.kid=false;w.pack=kind==='pack'?0x8a6a44:w.pack;T.w=w}
    L.trav.push(T)}}
/* move them along: each frame, near the camera */
function roadTick(dt){if(camDist>=14||settings.people===false||typeof ROAD_LINES==='undefined')return;const R=camDist*1.3+2.5;
  for(const L of ROAD_LINES){if(L.len<.6||!roadNear(L,R))continue;const n=nations[L.nid];if(!n||!n.alive||n.era>=6){L.trav=null;continue}
    if(!L.trav||L.trav.era!==Math.min(5,n.era)){roadPeople(L,n);L.trav.era=Math.min(5,n.era)}
    for(const T of L.trav){T.s+=T.dir*T.spd*dt;if(T.s>L.len-.15){T.s=L.len-.15;T.dir=-1}else if(T.s<.15){T.s=.15;T.dir=1}
      const [x,z,a]=roadAt(L,T.s),side=.014*T.dir;T.x=x-Math.sin(a)*side;T.z=z+Math.cos(a)*side;T.a=T.dir>0?a:a+Math.PI}}}
/* the beasts and wagons, with the scenery kits */
function roadFrame(R2){if(camDist>=14||settings.people===false||typeof ROAD_LINES==='undefined')return;const now=performance.now()/1000;
  for(const L of ROAD_LINES){if(!L.trav)continue;for(const T of L.trav){const ex=T.x-camT.x,ez=T.z-camT.z;if(ex*ex+ez*ez>R2)continue;const g=groundY(T.x,T.z);if(g<waterY+.01)continue;
      const ca=Math.cos(T.a),sa=Math.sin(T.a),R=-T.a,bob=Math.abs(Math.sin(now*6+T.seed))*.002;
      const horse=(x,z,col)=>{const y=groundY(x,z);add('gwBox',x,y+.012+bob,z,.032,.014,.011,R,col);add('gwBox',x+ca*.018,y+.022+bob,z+sa*.018,.012,.012,.008,R,col);
        for(const s of [-1,1])for(const f of [-.011,.011])add('gwBox',x+ca*f-sa*.004*s,y,z+sa*f+ca*.004*s,.003,.012,.003,R,0x3a2a1e)};
      if(T.kind==='rider')horse(T.x,T.z,[0x6a4a34,0x3a2a1e,0x9a7a5a][T.seed%3]);
      else if(T.kind==='ox'||T.kind==='cart'){const bx=T.x-ca*.03,bz=T.z-sa*.03,by=groundY(bx,bz);
        /* the beast in front, the wagon behind with its load */
        if(T.kind==='ox'){add('gwBox',T.x+ca*.012,groundY(T.x,T.z)+.006,T.z+sa*.012,.034,.018,.016,R,[0x6a4a30,0x8a6a48,0x5a3e2a][T.seed%3])}else horse(T.x+ca*.012,T.z+sa*.012,0x5a3e2a);
        add('gwBox',bx,by+.008,bz,.042,.01,.026,R,0x7a5a3a);for(const s of [-1,1])add('gwBox',bx-sa*.014*s,by,bz+ca*.014*s,.014,.014,.003,R,0x3a2a1e);
        if(T.seed%2)add('colBall',bx,by+.014,bz,.03,.018,.022,R,0xd8c078);else add('gwBox',bx,by+.018,bz,.03,.012,.02,R,0xb8a080)}
      else if(T.kind==='coach'){const bx=T.x-ca*.035,bz=T.z-sa*.035,by=groundY(bx,bz);
        horse(T.x+ca*.012-sa*.008,T.z+sa*.012+ca*.008,0x3a2a1e);horse(T.x+ca*.012+sa*.008,T.z+sa*.012-ca*.008,0x5a3e2a);
        add('gwBox',bx,by+.012,bz,.044,.028,.026,R,T.col);add('gwBox',bx,by+.04,bz,.048,.004,.03,R,0x2a2420);add('gwBox',bx+ca*.016,by+.03,bz+sa*.016,.006,.01,.024,R,0xd8d0b8);
        for(const s of [-1,1])for(const f of [-.016,.016])add('gwBox',bx+ca*f-sa*.015*s,by,bz+sa*f+ca*.015*s,.016,.016,.003,R,0x2a2018)}}}}
/* the people: walkers, riders in the saddle, drivers on the box */
function roadFolk(R2){if(camDist>=14||settings.people===false||typeof ROAD_LINES==='undefined')return;const now=performance.now()/1000;
  for(const L of ROAD_LINES){if(!L.trav)continue;for(const T of L.trav){const w=T.w;if(!w)continue;const ex=T.x-camT.x,ez=T.z-camT.z;if(ex*ex+ez*ez>R2)continue;const g=groundY(T.x,T.z);if(g<waterY+.01)continue;
      const ca=Math.cos(T.a),sa=Math.sin(T.a);w.dir=Math.atan2(ca,sa);w.t=now;w.wait=1;
      if(T.kind==='walk'||T.kind==='pack'){w.x=T.x;w.z=T.z;w.y=undefined;w.sit=false;w.moving=true;w.ph=now*9+T.seed%7;w.act='walk'}
      else{const back=T.kind==='rider'?0:T.kind==='coach'?.02:.012;w.x=T.x-ca*back;w.z=T.z-sa*back;w.sit=true;w.moving=false;w.act='chat';w.y=g+(T.kind==='rider'?.02:T.kind==='coach'?.044:.02)}
      drawFolk(w)}}}
{const _ul=updateLiving;updateLiving=function(dt,k,now){const r=_ul.apply(this,arguments);try{roadTick(dt*(k>0?1:0))}catch(e){console.warn('roads',e)}return r}}
{const _bf=banditFrame;banditFrame=function(R2){_bf.apply(this,arguments);try{roadFrame(R2)}catch(e){console.warn('roads draw',e)}}}
{const _da=drawArmyFolk;drawArmyFolk=function(R2){_da.apply(this,arguments);try{roadFolk(R2)}catch(e){console.warn('roads folk',e)}}}
