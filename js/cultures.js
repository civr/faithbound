"use strict";
/* Faithbound — more peoples of the world.
   Slavic log houses and onion domes, Indian havelis and stupas, yurts on the steppe and turquoise domes on the Silk Road,
   Pacific islanders with their open-sided houses and stone platforms, Andean stone towns and mountain temples, snow houses
   and later bright wooden towns in the far north, and Japan with its own castles and shrines (the East Asian people are now
   Chinese, with pagodas and a palace of yellow roofs).
   Americans are not on the map at the start: they grow out of the colonies that Western and Nordic nations found across the
   sea. Colonial towns are built the American way, and a colony that breaks free becomes an American nation. */

Object.assign(CULTURES,{
  slavic:{label:'Slavic',pre:['Vol','Nov','Kras','Bel','Yar','Mir','Vlad','Rad','Zel','Polo','Smol','Tver','Zor','Gor','Ves','Sud','Bor'],suf:['ograd','gorod','grad','sk','ov','ava','ino','evo','ice','in','yansk','omir','itsa']},
  southasia:{label:'South Asian',pre:['Jai','Rad','Ud','Ama','Kan','Pat','Har','Ind','Sur','Mad','Raj','Vij','Ban','Chan','Nag','Gov','Del','Agr'],suf:['pur','abad','nagar','garh','pura','ganj','kot','gaon','ore','pat','dwar','mer','ala']},
  steppe:{label:'Steppe',syl:['kar','bal','tash','sar','kor','tem','ur','khan','gol','su','bek','ak','ken','tal','ord','ulan','bai','tur','oy','jin']},
  pacific:{label:'Pacific',syl:['ma','na','ka','hi','lo','pa','ta','wai','ko','mo','nu','ra','ki','hu','fa','tu','le','vai','po','ao','ha']},
  andean:{label:'Andean',pre:['Cuz','Ta','Pa','Hua','Vil','Ma','Cha','Coll','Qui','Ayu','Ura','Pis','Tiwa','Oll','Sac','Can'],suf:['co','pa','ri','cay','bamba','marca','pata','huasi','cocha','tambo','llacta','naku','quiri']},
  arctic:{label:'Arctic',syl:['ik','qa','nu','vik','tu','ka','aq','si','mi','luk','pa','sar','naq','ivi','uk','ta','qi','nar']},
  japan:{label:'Japanese',pre:['Kawa','Yama','Taka','Naga','Shira','Hira','Fuji','Mori','Matsu','Hama','Kiri','Sakura','Oka','Tsu','Ichi','Asa','Kita','Minami'],suf:['saki','moto','hara','ta','shima','gawa','no','yama','zawa','mura','ura','oka','kawa','to']},
  american:{label:'American',pre:['Spring','Green','Fair','Oak','Maple','Cedar','Pine','Silver','Mill','Clay','Elm','Brook','Rock','Lex','Liber','Harmon','Jeffer','Frank','Madi','Bright'],suf:['field','ville','burg','town','port','haven','dale','ton','wood','ford','view','ridge','ington','son']}});
CULTURES.east.label='Chinese';CULTURES.east.syl=['shan','lin','hua','jin','yun','zhou','qi','dao','wan','an','ning','yang','he','chang','xi','bei','nan','hai','tai','ping','guang','su'];
const NEW_CU=['slavic','southasia','steppe','pacific','andean','arctic','japan','american'];

/* who lives where: by land, climate, mountains and islands */
function landShare(i,r){const x=i%W,y=(i/W)|0;let l=0,t=0;for(let dy=-r;dy<=r;dy+=2)for(let dx=-r;dx<=r;dx+=2){const X=wrapTX(x+dx),Y=y+dy;if(X<0||Y<0||X>=W||Y>=H)continue;t++;if(!isWater(Y*W+X))l++}return t?l/t:1}
pickCulture=function(i){const b=biome[i],y=(i/W)|0,lat=1-Math.abs(y/(H-1)-.5)*2,r=rng(),pk=a=>a[(r*a.length)|0];
  if(b===9||b===10)return pk(['arctic','arctic','nordic','slavic']);
  if(lat<.3)return pk(['nordic','nordic','slavic','arctic','west']);
  if((b===11||b===12)&&lat>.4)return pk(['andean','andean','slavic','steppe','meso','east']);
  if(b===7)return pk(['mideast','mideast','mideast','africa','steppe','southasia']);
  if(b===8)return pk(['africa','africa','africa','southasia','meso']);
  if(b===6)return pk(['meso','meso','east','southasia','pacific','africa']);
  const isle=landShare(i,6)<.42;
  if(isle&&lat>.6)return pk(['pacific','pacific','pacific','japan']);
  if(isle)return pk(['japan','japan','nordic','west','east']);
  if(lat>.72)return pk(['med','meso','east','africa','mideast','mideast','southasia','pacific']);
  if(lat<.55&&b===4&&(typeof baseMoist==='undefined'||!baseMoist||baseMoist[i]<.45))return pk(['steppe','steppe','slavic','west']);
  return pk(['west','west','east','med','med','meso','nordic','slavic','japan','steppe','mideast','southasia'])};
seedCultures=function(){cultSeeds=[];const k=Math.round((7+((rng()*3)|0))*Math.sqrt(N/(144*108)));let tries=0;
  while(cultSeeds.length<Math.max(5,k)&&tries<3000){tries++;const i=(rng()*N)|0;if(isWater(i))continue;cultSeeds.push({x:i%W,y:(i/W)|0,c:pickCulture(i)})}
  const kinds=new Set(cultSeeds.map(s=>s.c));for(const s of cultSeeds){if(kinds.size>=4)break;const m=['west','east','med','slavic','southasia','nordic'].find(c=>!kinds.has(c));if(m){kinds.add(m);s.c=m}}};

/* a nation seen through another culture's eyes: for the Japanese, the old East Asian buildings */
const asCu=(n,cu)=>Object.create(n,{culture:{value:cu}});
const pkH=(a,o)=>a[Math.min(a.length-1,(o*a.length)|0)];
function porch(x,y,z,rot,w,d,col){P('box',x,y-.004,z,rot,0,d/2+.012,0,w*.9,.006,.024,0xa8a098);P('box',x,y+.034,z,rot,0,d/2+.014,0,w*.94,.004,.03,col);for(const s of [-1,0,1])P('cyl',x,y,z,rot,s*w*.42,d/2+.024,0,.003,.034,.003,0xf0ece4)}
function chhatri(x,y,z,s,col){for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]])add('cyl',x+a*s*.4,y,z+b*s*.4,.003,s*.6,.003,0,col);add('stone',x,y+s*.6,z,s*1.1,.005,s*1.1,0,col);add('domeW',x,y+s*.62,z,s*.9,s*.7,s*.9,0,col)}
function yurt(x,y,z,s,col,door){add('adobeCyl',x,y-.02,z,s,s*.45+.02,s,0,col);add('domeW',x,y+s*.44,z,s*1.05,s*.42,s*1.05,0,shadeHex(col,.95));add('box',x,y-.02,z+s*.5,s*.22,s*.34,.003,0,door);add('cyl',x,y+s*.82,z,s*.16,.006,s*.16,0,0x8a6a44)}

/* ---------- homes, from the first huts to the industrial age ---------- */
const DWELL={
  slavic(n,x,y,z,rot,e,hk,k,core,o){
    if(e===0){add('cyl',x,y-.03,z,.09,.03,.09,0,0x6a5a48);add('coneThatch',x,y-.005,z,.13,.08,.13,0,0xb8a878);return true}
    if(e<=3||(e===4&&core<.35)){const h=.05+(e>=3?core*.02:0);house(x,y,z,rot,.095,.075,h,'timber',pkH([0x8a6040,0x7a5236,0x9a704c,0x6e4a30],o),e<=1?'thatch':'tiles',e<=1?0xffffff:pkH([0x5a4a3a,0x6a5a48,0x4a5a4a],o),true,{hk:o,garden:e>=1,annex:false});
      P('box',x,y,z,rot,0,.0395,h*.55,.07,.004,.004,0xf0ece4);P('box',x,y,z,rot,0,.0395,h*.15,.07,.004,.004,0xf0ece4);return true}
    house(x,y,z,rot,.1,.08,.06+core*.035,'plaster',pkH([0xe8d090,0xb8d0a0,0xa8c0d8,0xf0e6d0,0xe8b8a0],o),'tiles',pkH([0x3a7a5a,0x9a3a2a,0x5a6a7a],hash(hk*3.3)),true,{hk:o});return true},
  southasia(n,x,y,z,rot,e,hk,k,core,o){
    if(e===0){roundHut(x,y,z,.045,.032,0xb88a5a,0xc8b080);return true}
    if(e<=2){const col=pkH([0xc8986a,0xd8b088,0xe8d8c0,0xd0a070],o);flatHouse(x,y,z,rot,.095,.08,.042,col,hk,{});if(o<.5)P('hipThatch',x,y+.042,z,rot,-.02,0,0,.05,.025,.06,0xc8b080);return true}
    const h=.05+core*.05,col=pkH([0xe89a8a,0xf0b060,0xf2ece0,0x7aa0d0,0xe8c8a0,0xd8706a],o);flatHouse(x,y,z,rot,.1,.085,h,col,hk,{});
    P('box',x,y,z,rot,0,.046,h*.55,.04,.022,.014,shadeHex(col,.82));P('box',x,y,z,rot,0,.05,h*.55+.022,.046,.004,.02,shadeHex(col,.7));
    if(o>.62&&e>=3)chhatri(x,y+h+.008,z,.035,0xf2eee6);return true},
  steppe(n,x,y,z,rot,e,hk,k,core,o){
    if(e<=2||(e===3&&core<.3)){yurt(x,y,z,.075,pkH([0xf0e8d8,0xe8dcc4,0xd8ccb4,0xece4d4],o),pkH([0xb83a2a,0x2a5a9a,0xd8a838],o));
      if(o>.65)yurt(x+.07*Math.cos(rot),y,z-.07*Math.sin(rot),.05,0xe8dcc4,0xb83a2a);
      if(o<.25){for(let q=0;q<6;q++){const a=q/6*6.283;add('cyl',x+Math.cos(a)*.08,y-.01,z+Math.sin(a)*.08,.003,.02,.003,0,0x6a5034)}}return true}
    const h=.045+core*.04,col=pkH([0xd8b888,0xe0c8a0,0xc8a070,0xe8d8b8],o);flatHouse(x,y,z,rot,.1,.085,h,col,hk,{dome:core>.5&&o>.55?pkH([0x3aa0a8,0x2a7aa8,0x4ab0b0],hash(hk*2.2)):0});return true},
  pacific(n,x,y,z,rot,e,hk,k,core,o){
    if(e<=3){const s=e===0?.8:1;for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1],[0,-1],[0,1]])P('cyl',x,y-.01,z,rot,a*.042*s,b*.032*s,0,.004,.045,.004,0x6a4a30);
      P('box',x,y+.008,z,rot,0,0,0,.1*s,.008,.075*s,0x9a7a50);if(e>=1)P('timber',x,y+.016,z,rot,0,-.02*s,0,.09*s,.022,.03*s,0xb89a6a);
      P('hipThatch',x,y+.03,z,rot,0,0,0,.13*s,.075,.105*s,pkH([0xc8b07a,0xb8a068,0xd0b884],o));return true}
    house(x,y,z,rot,.095,.075,.05+core*.02,'timber',pkH(PASTEL,o),'tiles',pkH([0x8a9098,0x9aa0a8,0xb85a36],hash(hk*2.7)),false,{hk:o,garden:true});porch(x,y,z,rot,.095,.075,0xe8e8e4);return true},
  andean(n,x,y,z,rot,e,hk,k,core,o){
    if(e===0){add('adobeCyl',x,y-.02,z,.08,.035,.08,0,0x9a9080);add('coneThatch',x,y+.012,z,.11,.07,.11,0,0xb8a870);return true}
    if(e<=3){const col=pkH([0xa8a090,0x9a9284,0xb0a898,0x8e887c],o);add('stone',x,y-.02,z,.095,.055,.075,rot,col);P('box',x,y,z,rot,0,.0378,.012,.018,.026,.003,0x2a2420);
      P('box',x,y,z,rot,.03,.0378,.022,.012,.014,.003,0x2a2420);P('hipThatch',x,y+.034,z,rot,0,0,0,.115,.07,.095,0xc0a868);return true}
    const h=.05+core*.035;add('adobe',x,y-.02,z,.1,h+.02,.085,rot,pkH([0xf2eee6,0xece4d4,0xf0e8dc],o));P('hipTile',x,y+h,z,rot,0,0,0,.118,.03,.1,0xb85a36);eaves(x,y+h,z,rot,.114,.097);
    P('box',x,y,z,rot,0,.0435,.018,.02,.036,.003,pkH([0x3a6aaa,0x2a8a6a,0x3a5a9a],o));if(o>.5)P('box',x,y,z,rot,0,.05,h*.62,.07,.004,.016,0x6a4a30);facade(x,y,z,rot,.1,.085,h,hk,h>.07?2:1,true);return true},
  arctic(n,x,y,z,rot,e,hk,k,core,o){
    if(e<=2){const t=tileAt(x,z),snowy=t>=0&&(biome[t]===10||biome[t]===9||biome[t]===2)||climate.temp<.35;
      if(snowy&&o<.7){add('domeW',x,y-.015,z,.08,.05,.08,0,0xf4f6f8);P('domeW',x,y-.015,z,rot,0,.045,0,.035,.025,.04,0xeef2f4);return true}
      add('coneThatch',x,y-.02,z,.075,.085,.075,0,pkH([0x8a6a4a,0x9a7a58,0x7a5e40],o));add('cyl',x,y+.06,z,.012,.02,.012,0,0x5a4430);return true}
    if(e<=4){add('timber',x,y-.02,z,.09,.04,.07,rot,0x7a6a5a);P('hipThatch',x,y+.02,z,rot,0,0,0,.11,.045,.09,pkH([0x7a8a5a,0x6a7a4a,0x8a9a6a],o));facade(x,y,z,rot,.09,.07,.025,hk,1,true);return true}
    house(x,y,z,rot,.09,.075,.06+core*.03,'timber',pkH([0xc83a2a,0xe8b830,0x2a5a9a,0x3a8a5a,0xf0ece4,0x6a3a8a],o),'tiles',0x2b2f33,true,{hk:o,garden:false,annex:false});return true},
  japan(n,x,y,z,rot,e,hk,k,core,o){return cultureDwelling('east',asCu(n,'east'),x,y,z,rot,e,hk,k,core)},
  american(n,x,y,z,rot,e,hk,k,core,o){
    if(e<=2)return false;
    if(core<.16&&o<.3&&e<=5){/* a farm at the edge of town: a red barn and a silo */house(x,y,z,rot,.11,.075,.055,'timber',0xa83a2a,'tiles',0x4a4a4e,false,{hk:o,garden:false,annex:false});
      add('adobeCyl',x+.07*Math.cos(rot),y-.02,z-.07*Math.sin(rot),.04,.13,.04,0,0xb8b8b0);add('domeW',x+.07*Math.cos(rot),y+.11,z-.07*Math.sin(rot),.042,.03,.042,0,0x9aa0a6);return true}
    if(e===5&&core>.55){/* brick row houses with a cornice */const h=.08+core*.04;add('brick',x,y-.02,z,.1,h+.02,.085,rot,pkH([0xa8503a,0x9a4a36,0xb86a4a],o));P('box',x,y+h,z,rot,0,0,0,.104,.008,.09,0x3a3a3a);facade(x,y,z,rot,.1,.085,h,hk,3,false);
      P('box',x,y,z,rot,.02,.05,0,.03,.012,.02,0xc8c0b0);return true}
    const h=.055+core*.025,col=pkH([0xf2f0ea,0xe8e0c8,0xd8e0e8,0xf0e8d0,0xc8d8c8,0xe8d0c8],o);house(x,y,z,rot,.1,.08,h,'plaster',col,'tiles',pkH([0x6a6a6e,0x7a6a5a,0x5a6470],hash(hk*1.7)),true,{hk:o,garden:true,annex:false,fenceCol:0xf0ece4});
    porch(x,y,z,rot,.1,.08,shadeHex(col,.9));for(const s of [-1,1])P('box',x,y,z,rot,s*.03,.0405,h*.55,.008,.02,.002,0x2a4a3a);
    if(e===5&&o>.72){add('adobeCyl',x+.035*Math.cos(rot),y-.02,z-.035*Math.sin(rot),.03,h+.04,.03,0,col);add('coneTile',x+.035*Math.cos(rot),y+h+.02,z-.035*Math.sin(rot),.036,.045,.036,0,0x4a4a4e)}return true}};
{const _cd=cultureDwelling;cultureDwelling=function(cu,n,x,y,z,rot,e,hk,k,core){const f=DWELL[cu];if(f)return f(n,x,y,z,rot,e,hk,k||0,core||0,hash(hk*97+1));return _cd.apply(this,arguments)}}

/* row houses in the dense heart of a town */
const TERR={slavic:[{to:2,wall:'timber',wc:[0x8a6040,0x7a5236,0x9a704c,0x6e4a30],roof:'thatch',rc:[0xffffff]},{to:3,wall:'timber',wc:[0x8a6040,0x7a5236,0x9a704c],roof:'tiles',rc:[0x5a4a3a,0x6a5a48,0x4a5a4a]},
    {to:4,wall:'plaster',wc:[0xe8d090,0xb8d0a0,0xa8c0d8,0xf0e6d0,0xe8b8a0],roof:'tiles',rc:[0x3a7a5a,0x9a3a2a,0x5a6a7a,0x6a6a6e]}],
  southasia:[{to:2,flat:1,wc:[0xc8986a,0xd8b088,0xe8d8c0,0xd0a070]},{to:4,flat:1,wc:[0xe89a8a,0xf0b060,0xf2ece0,0x7aa0d0,0xe8c8a0,0xd8706a]}],
  steppe:[{to:2,hut:1},{to:4,flat:1,wc:[0xd8b888,0xe0c8a0,0xc8a070,0xe8d8b8]}],
  pacific:[{to:2,hut:1},{to:3,wall:'timber',wc:[0xb89a6a,0xa88a5a,0xc8aa7a],roof:'thatch',rc:[0xffffff]},{to:4,wall:'timber',wc:PASTEL,roof:'tiles',rc:[0x8a9098,0x9aa0a8,0xb85a36]}],
  andean:[{to:3,wall:'stone',wc:[0xa8a090,0x9a9284,0xb0a898],roof:'thatch',rc:[0xffffff]},{to:4,wall:'plaster',wc:[0xf2eee6,0xece4d4],roof:'tiles',rc:[0xb85a36,0xc0603a]}],
  arctic:[{to:2,hut:1},{to:4,wall:'timber',wc:[0x7a6a5a,0x6a5a4a,0x8a7a6a],roof:'thatch',rc:[0x8a9a6a,0x7a8a5a]}],
  american:[{to:4,wall:'plaster',wc:[0xf2f0ea,0xe8e0c8,0xd8e0e8,0xf0e8d0,0xc8d8c8],roof:'tiles',rc:[0x6a6a6e,0x7a6a5a,0x5a6470]}]};
{const _th=terraceHouse0;terraceHouse0=function(n,sl,y,e,hk){const cu=cultOf(n);
  if(cu==='japan')return _th.call(this,asCu(n,'east'),sl,y,e,hk);
  const x=sl.x,z=sl.z,rot=sl.rot,w=sl.w*1.01,d=sl.d,pick=(a,q)=>a[(hash(hk*q)*a.length)|0];
  /* the industrial age keeps each people's colours and roofs instead of the same red brick everywhere */
  if(e===5&&cu!=='west'&&cu!=='nordic'&&MOD_CULT[cu]){const mc=MOD_CULT[cu],hh=.07+hash(hk*7.1)*.035;
    if(cu==='american'&&sl.core>.5){add('brick',x,y-.02,z,w,hh+.02,d,rot,pick([0xa8503a,0x9a4a36,0xb86a4a],3.3));add('box',x,y+hh,z,w*1.02,.008,d*1.02,rot,0x3a3a3a);facade(x,y,z,rot,w,d,hh,hk,3,false);return}
    if(mc.pitch<.12){flatHouse(x,y,z,rot,w,d,hh,pick(mc.wall,3.3),hk,{});return}
    house(x,y,z,rot,w,d,hh,hash(hk*6.6)<.3?'brick':'plaster',pick(mc.wall,3.3),'tiles',pick(mc.roof,2.2),true,{hk:hk*.44});return}
  if(e>=5||!TERR[cu]||(cu==='american'&&e<=2))return _th.apply(this,arguments);
  const T=TERR[cu].find(t=>e<=t.to)||TERR[cu][TERR[cu].length-1],hh=.055+hash(hk*7.1)*.04+(sl.core>.6?.02:0);
  if(T.hut){DWELL[cu](n,x,y,z,rot,e,hk,0,.3,hash(hk*97+1));return}
  if(T.flat){const wc=pick(T.wc,3.3);flatHouse(x,y,z,rot,w,d,hh,wc,hk,{dome:cu==='steppe'&&hash(hk*5.1)<.15?0x3aa0a8:0});if(cu==='southasia'&&e>=3&&hash(hk*4.4)<.5)P('box',x,y,z,rot,0,d/2+.006,hh*.55,w*.4,.02,.012,shadeHex(wc,.82));return}
  house(x,y,z,rot,w,d,hh,T.wall,pick(T.wc,3.3),T.roof,pick(T.rc,2.2),hash(hk*8.8)<.4,{hk:hk*.44})}}

/* ---------- great buildings at the heart of the capital ---------- */
function onion(x,y,z,s,col){add('adobeCyl',x,y,z,s*.75,s*.5,s*.75,0,0xf2eee6);add('domeW',x,y+s*.45,z,s,s*1.15,s,0,col);add('cyl',x,y+s*1.5,z,.003,s*.6,.003,0,0xd4af37);add('box',x,y+s*1.85,z,s*.35,.003,.003,0,0xd4af37)}
const MARK={
  slavic(n,x,y,z,e,nc){if(e>=3)return false;/* a wooden church with shingled onion domes inside a palisade */
    add('timber',x,y-.02,z,.16,.12,.14,0,0x7a5236);add('tiles',x,y+.1,z,.17,.05,.15,0,0x5a5048);add('timber',x,y+.1,z,.08,.1,.08,0,0x7a5236);onion(x,y+.2,z,.06,0x8a9aa8);
    for(const [dx,dz] of [[-.06,.05],[.06,.05]]){add('timber',x+dx,y+.1,z+dz,.035,.05,.035,0,0x7a5236);onion(x+dx,y+.15,z+dz,.03,0x8a9aa8)}
    for(let q=0;q<22;q++){const a=q/22*6.283;add('cyl',x+Math.cos(a)*.34,y-.03,z+Math.sin(a)*.34,.016,.09,.016,0,0x6e5236)}add('cyl',x+.22,y,z+.2,.006,.18,.006,0,0x5a4632);add('box',x+.242,y+.15,z+.2,.04,.024,.003,0,nc);return true},
  east(n,x,y,z,e,nc){const rf=0x3a6a5a,red=0xb03a2a,gold=0xd8a838;
    if(e<=2){/* a pagoda and a painted gate */add('stone',x,y-.03,z,.2,.03,.2,.4,0xc8c2b8);for(let k=0;k<5;k++){const s=.15-k*.022,yy=y+k*.06;add('plaster',x,yy,z,s,.045,s,.4,k%2?red:0xf0ece4);add('hipTile',x,yy+.04,z,s*1.6,.028,s*1.6,.4,0x3e4248)}
      add('cyl',x,y+.33,z,.006,.08,.006,0,gold);for(const s of [-1,1])add('box',x+s*.08,y-.03,z+.3,.014,.14,.014,0,red);add('box',x,y+.1,z+.3,.22,.014,.02,0,red);add('hipTile',x,y+.115,z+.3,.26,.025,.05,0,rf);return true}
    /* a palace of red halls and yellow roofs behind a red wall, on terraces of white stone */
    const S=.4;add('plazaStone',x,y-.03,z,S*2,.035,S*2,0);for(const [dx,dz,r] of [[0,-S,0],[0,S,0],[-S,0,1],[S,0,1]]){add('adobe',x+dx,y-.03,z+dz,r?.03:S*2,.1,r?S*2:.03,0,0xa83a2a);add('hipTile',x+dx,y+.07,z+dz,r?.05:S*2.04,.018,r?S*2.04:.05,0,gold)}
    add('adobe',x,y-.03,z+S,.14,.16,.06,0,red);add('hipTile',x,y+.13,z+S,.2,.04,.1,0,gold);add('box',x,y-.03,z+S+.031,.05,.08,.003,0,0x2a2018);
    for(let k=0;k<3;k++)add('stone',x,y-.03+k*.025,z-.06,.36-k*.04,.025,.26-k*.03,0,0xece8e0);
    add('plaster',x,y+.045,z-.06,.24,.08,.15,0,red);add('hipTile',x,y+.12,z-.06,.34,.04,.22,0,gold);add('plaster',x,y+.15,z-.06,.18,.03,.11,0,red);add('hipTile',x,y+.175,z-.06,.26,.035,.17,0,gold);
    for(const s of [-1,1]){add('plaster',x+s*.25,y-.03,z+.12,.1,.07,.08,0,red);add('hipTile',x+s*.25,y+.04,z+.12,.15,.03,.12,0,gold)}
    add('cyl',x+.32,y,z+.32,.006,.2,.006,0,0x5a4632);add('box',x+.342,y+.17,z+.32,.04,.024,.003,0,nc);return true},
  japan(n,x,y,z,e,nc){return cultureLandmark0(asCu(n,'east'),x,y,z,e,nc)},
  southasia(n,x,y,z,e,nc){
    if(e<=2){/* a stupa with its railing and four gates */add('stone',x,y-.03,z,.36,.04,.36,0,0xd8ccb4);add('domeW',x,y+.01,z,.26,.18,.26,0,0xf0ece0);add('stone',x,y+.18,z,.05,.03,.05,0,0xd8c8a0);
      for(let k=0;k<3;k++)add('cyl',x,y+.21+k*.025,z,.05-k*.012,.004,.05-k*.012,0,0xd4af37);add('cyl',x,y+.21,z,.004,.07,.004,0,0xd4af37);
      for(const [dx,dz,r] of [[0,.22,0],[0,-.22,0],[.22,0,1.571],[-.22,0,1.571]]){for(const s of [-1,1])add('stone',x+dx+(r?0:s*.03),y-.03,z+dz+(r?s*.03:0),.01,.09,.01,0,0xc8b898);add('stone',x+dx,y+.05,z+dz,r?.012:.08,.012,r?.08:.012,0,0xc8b898)}
      add('cyl',x+.25,y,z+.25,.006,.18,.006,0,0x5a4632);add('box',x+.272,y+.15,z+.25,.04,.024,.003,0,nc);return true}
    /* a palace of red sandstone and white marble: a great dome, four minarets with pavilions, and a long pool before it */
    const rs=0xb8604a,wm=0xf2eee6;add('stone',x,y-.03,z,.62,.04,.5,0,rs);add('stone',x,y+.01,z-.06,.3,.13,.22,0,wm);for(let q=0;q<3;q++)add('box',x-.08+q*.08,y+.01,z+.051,.04,.08,.003,0,0x2a3a4a);
    add('adobeCyl',x,y+.14,z-.06,.13,.04,.13,0,wm);add('domeW',x,y+.17,z-.06,.17,.2,.17,0,wm);add('cyl',x,y+.36,z-.06,.004,.05,.004,0,0xd4af37);
    for(const [dx,dz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){add('adobeCyl',x+dx*.27,y+.01,z-.06+dz*.17,.035,.3,.035,0,wm);chhatri(x+dx*.27,y+.31,z-.06+dz*.17,.04,wm);if(dz<0)continue;chhatri(x+dx*.11,y+.14,z+.03,.035,wm)}
    add('pool',x,y+.012,z+.18,.06,.01,.12);add('cyl',x+.3,y,z+.24,.006,.2,.006,0,0x5a4632);add('box',x+.322,y+.17,z+.24,.04,.024,.003,0,nc);return true},
  steppe(n,x,y,z,e,nc){
    if(e<=2){/* the khan's great tent among the horse-tail standards */yurt(x,y,z,.24,0xf2ece0,0xb83a2a);for(let q=0;q<10;q++){const a=q/10*6.283;add('box',x+Math.cos(a)*.121,y+.05,z+Math.sin(a)*.121,.03,.008,.004,-a+1.571,0xb83a2a)}
      for(let q=0;q<4;q++){const a=q*1.571+.785,X=x+Math.cos(a)*.24,Z=z+Math.sin(a)*.24;add('cyl',X,y-.02,Z,.005,.22,.005,0,0x5a4430);add('coneThatch',X,y+.15,Z,.03,.06,.03,0,q%2?0x2a2420:0xe8e2d4)}
      for(let q=0;q<4;q++)yurt(x+Math.cos(q*1.571)*.36,y,z+Math.sin(q*1.571)*.36,.08,0xe8dcc4,0x2a5a9a);add('box',x+.06,y+.2,z,.04,.024,.003,0,nc);return true}
    /* a Silk Road square: a great portal of glazed tiles, a turquoise ribbed dome and two minarets */
    const bk=0xd8b888,tq=0x3aa0a8,bl=0x2a5a9a;add('plazaStone',x,y-.03,z+.08,.6,.035,.5,0);add('adobe',x,y-.03,z-.08,.3,.12,.2,0,bk);
    add('adobe',x,y-.03,z+.03,.22,.24,.05,0,bk);add('box',x,y-.03,z+.056,.11,.17,.004,0,bl);add('box',x,y+.14,z+.056,.18,.03,.004,0,tq);
    add('adobeCyl',x,y+.09,z-.1,.13,.05,.13,0,tq);add('domeW',x,y+.13,z-.1,.13,.15,.13,0,tq);for(const s of [-1,1]){add('adobeCyl',x+s*.19,y-.03,z+.03,.04,.34,.04,0,bk);add('adobeCyl',x+s*.19,y+.2,z+.03,.042,.03,.042,0,tq);add('domeW',x+s*.19,y+.31,z+.03,.04,.03,.04,0,tq)}
    add('cyl',x+.27,y,z+.28,.006,.2,.006,0,0x5a4632);add('box',x+.292,y+.17,z+.28,.04,.024,.003,0,nc);return true},
  pacific(n,x,y,z,e,nc){/* a stone platform with its row of great carved figures; later a great carved meeting house */
    if(e<=2){add('stone',x,y-.03,z-.05,.42,.05,.14,0,0x8a8278);for(let k=0;k<5;k++){const X=x-.16+k*.08;add('stone',X,y+.02,z-.06,.034,.1,.028,0,0x6a6460);add('stone',X,y+.1,z-.055,.038,.012,.034,0,0x5e5854);add('box',X,y+.08,z-.04,.03,.01,.003,0,0x3a3634)}
      DWELL.pacific(n,x,y,z+.15,0,1,.5,0,1,.5);add('cyl',x+.24,y,z+.2,.006,.18,.006,0,0x5a4632);add('box',x+.262,y+.15,z+.2,.04,.024,.003,0,nc);return true}
    add('timber',x,y-.02,z,.18,.08,.3,0,0x7a3a2a);house(x,y+.04,z,Math.PI/2,.32,.2,.001,'timber',0x7a3a2a,'thatch',0xffffff,false,{hk:.3,garden:false,annex:false});
    for(const s of [-1,1])add('box',x+s*.07,y-.02,z+.152,.016,.16,.006,0,0x5a2a1e);add('box',x,y+.13,z+.152,.16,.014,.006,0,0x5a2a1e);add('box',x,y-.02,z+.151,.05,.06,.003,0,0x2a1a14);
    add('cyl',x+.2,y,z+.22,.006,.18,.006,0,0x5a4632);add('box',x+.222,y+.15,z+.22,.04,.024,.003,0,nc);return true},
  andean(n,x,y,z,e,nc){const st=0x9a9284;
    if(e<=2){/* a sun temple on a stepped platform, with a curved tower and a golden disc */for(let k=0;k<3;k++)add('stone',x,y-.03+k*.045,z,.42-k*.1,.05,.36-k*.09,0,k%2?0xa8a090:st);
      add('adobeCyl',x+.05,y+.11,z,.1,.08,.1,0,0xb0a898);add('hipThatch',x+.05,y+.19,z,.13,.05,.13,0,0xc0a868);add('cyl',x-.06,y+.15,z+.06,.05,.004,.05,0,0xd8b030);add('box',x-.06,y+.12,z+.06,.004,.05,.004,0,0x6a5a3a);
      add('cyl',x+.24,y,z+.22,.006,.18,.006,0,0x5a4632);add('box',x+.262,y+.15,z+.22,.04,.024,.003,0,nc);return true}
    /* a fortress of three zigzag terraces of great fitted stones, a round tower on top */
    for(let t=0;t<3;t++){const R=.38-t*.1,yy=y-.03+t*.06;for(let q=0;q<10;q++){const xx=x-R+q*R*.2+.04;add('stone',xx,yy,z+R*.6+(q%2?.02:-.02),R*.22,.07,.04,(q%2?.5:-.5),st)}add('stone',x,yy,z,R*2,.06,R*1.2,0,0xa8a090)}
    add('adobeCyl',x,y+.15,z-.04,.1,.12,.1,0,0xb0a898);add('hipThatch',x,y+.27,z-.04,.13,.05,.13,0,0xc0a868);add('cyl',x+.3,y,z+.24,.006,.2,.006,0,0x5a4632);add('box',x+.322,y+.17,z+.24,.04,.024,.003,0,nc);return true},
  arctic(n,x,y,z,e,nc){
    if(e<=2){/* a great snow house for dances and feasts, stone men on the ridge, kayaks on their racks */add('domeW',x,y-.02,z,.24,.13,.24,0,0xf4f6f8);add('domeW',x,y-.02,z+.13,.07,.05,.08,0,0xeef2f4);
      for(const [dx,dz] of [[.25,-.1],[-.25,.05]]){add('stone',x+dx,y-.02,z+dz,.03,.04,.02,0,0x7a7670);add('stone',x+dx,y+.02,z+dz,.07,.012,.02,0,0x7a7670);add('stone',x+dx,y+.032,z+dz,.022,.03,.02,0,0x7a7670)}
      for(const s of [-1,1])add('box',x+s*.15,y+.02,z+.25,.18,.012,.022,0,0xc8a878);add('cyl',x+.2,y,z+.18,.006,.16,.006,0,0x5a4632);add('box',x+.222,y+.13,z+.18,.04,.024,.003,0,nc);return true}
    /* a white wooden church with a red roof and a bell tower */add('timber',x,y-.02,z,.14,.09,.24,0,0xf2f0ea);add('tiles',x,y+.07,z,.16,.07,.26,Math.PI/2,0xb83a2a);
    add('timber',x,y-.02,z+.13,.07,.17,.07,0,0xf2f0ea);add('pyr',x,y+.15,z+.13,.08,.1,.08,0,0xb83a2a);add('cyl',x+.2,y,z+.2,.006,.18,.006,0,0x5a4632);add('box',x+.222,y+.15,z+.2,.04,.024,.003,0,nc);return true},
  american(n,x,y,z,e,nc){if(e<=2)return false;/* a town green with a white church and steeple, and for the capital a domed capitol with columns */
    add('plazaStone',x,y-.03,z,.66,.035,.66,0);for(let q=0;q<6;q++){const a=q/6*6.283+.3;greenAdd(natKit('broad',q*.17),x+Math.cos(a)*.28,y-.02,z+Math.sin(a)*.28,.16,.16,.16,a,0x4e6a32)}
    if(n.cities.length>=3||e>=4){add('stone',x,y-.03,z-.06,.34,.11,.16,0,0xf2f0ea);for(let q=0;q<8;q++)add('cyl',x-.105+q*.03,y-.02,z+.03,.007,.1,.007,0,0xf6f4ee);add('box',x,y+.08,z+.04,.25,.03,.025,0,0xf2f0ea);
      add('adobeCyl',x,y+.08,z-.06,.12,.06,.12,0,0xf2f0ea);for(let q=0;q<10;q++){const a=q/10*6.283;add('cyl',x+Math.cos(a)*.062,y+.08,z-.06+Math.sin(a)*.062,.004,.06,.004,0,0xf6f4ee)}add('domeW',x,y+.14,z-.06,.13,.12,.13,0,0xf4f2ee);add('cyl',x,y+.26,z-.06,.012,.03,.012,0,0xf4f2ee)}
    else{add('timber',x,y-.02,z,.12,.08,.2,0,0xf4f2ee);add('tiles',x,y+.06,z,.13,.05,.21,Math.PI/2,0x4a4a4e);add('timber',x,y-.02,z+.12,.06,.16,.06,0,0xf4f2ee);add('timber',x,y+.14,z+.12,.045,.05,.045,0,0xf4f2ee);add('pyr',x,y+.19,z+.12,.05,.14,.05,0,0xf4f2ee)}
    add('cyl',x+.24,y,z+.26,.006,.2,.006,0,0x5a4632);add('box',x+.262,y+.17,z+.26,.04,.024,.003,0,nc);return true}};
const cultureLandmark0=cultureLandmark;
cultureLandmark=function(n,x,y,z,e,nc){const cu=cultOf(n),f=MARK[cu];if(f&&e>=1&&e<=4){const r=f(n,x,y,z,e,nc);if(r!==false)return r}return cultureLandmark0.apply(this,arguments)};

/* castles for those who build them */
Object.assign(CASTLE_STYLE,{slavic:{col:0xb8503a,keep:0xf0ece4,light:0xf2eee6,yard:0xa89a88,roof:()=>0x3a7a5a,coneH:2.2,onion:true},
  american:{col:0xb8b0a0,keep:0xd8d0c0,light:0xe8e2d4,yard:0xa8a090,roof:()=>0x4a4a4e,sq:true,flat:true},japan:CASTLE_STYLE.west});
{const _ca=castle;castle=function(n,x,y,z,e,nc){if(cultOf(n)==='japan')return _ca.call(this,asCu(n,'east'),x,y,z,e,nc);const r=_ca.apply(this,arguments);
  if(cultOf(n)==='slavic'){/* a kremlin: golden onion domes rise over the keep */onion(x-.06,y+.39,z-.08,.07,0xd4af37);for(const [dx,dz] of [[-1,-1],[1,-1],[-1,1],[1,1]])onion(x-.06+dx*.11,y+.44,z-.08+dz*.11,.035,pkH([0x3a7a5a,0x2a5a9a,0xd4af37],(dx+dz+2)/4.1))}return r}}

/* the modern age keeps the look of home */
Object.assign(MOD_CULT,{american:{wall:[0xf2f0ea,0xd8d4cc,0xa8503a,0xe8e0c8,0xc8d0d8],pitch:.5,roof:[0x4a4a4e,0x5a5a5e],tower:[0xd8dcdf,0xc4c8cc,0xb8bcc0]},
  slavic:{wall:[0xe8d090,0xb8d0a0,0xa8c0d8,0xf0e6d0,0xe8b8a0],pitch:.55,roof:[0x3a7a5a,0x9a3a2a,0x5a6a7a],tower:[0xe8e4dc,0xd8d4cc,0xc8c4bc]},
  southasia:{wall:[0xe89a8a,0xf0b060,0xf2ece0,0x7aa0d0,0xe8c8a0],pitch:0,roof:[0xc8b088],tower:[0xf0e8d8,0xe8d8c0,0xd8c8b0]},
  steppe:{wall:[0xd8b888,0xe0c8a0,0xf0e8d8,0xc8a070],pitch:.1,roof:[0x3aa0a8,0x8a9098],tower:[0xe6d4b0,0xd8dcdf,0x9ac8c8]},
  pacific:{wall:PASTEL,pitch:.35,roof:[0x8a9098,0x9aa0a8],tower:[0xf0f0e8,0xe8e0d4]},andean:{wall:[0xf2eee6,0xe8d8c0,0xd8c8a8,0xa8a090],pitch:.35,roof:[0xb85a36,0xc0603a],tower:[0xe8e0d4,0xd8d0c4]},
  arctic:{wall:[0xc83a2a,0xe8b830,0x2a5a9a,0x3a8a5a,0xf0ece4],pitch:.8,roof:[0x2b2f33],tower:[0xd8dcdc,0xe8eaec]},japan:MOD_CULT.east});
Object.assign(FLAG_LAYOUTS,{slavic:['tri-h','tri-h','emblem','bi-h','cross'],southasia:['tri-h','emblem','bi-v','border','disc'],steppe:['plain','emblem','bi-v','stripes','disc'],
  pacific:['diag','stripes','emblem','bi-h','chevron'],andean:['tri-v','stripes','emblem','tri-h'],arctic:['bi-h','disc','nordic','plain'],japan:['disc','disc','plain','border'],american:['stripes','canton','stripes','canton','tri-v']});
Object.assign(FLAG_EMBLEMS,{slavic:['bird','cross','crown','star','none'],southasia:['wheel','sun','star','tree','none'],steppe:['sun','star','bird','none'],pacific:['star','sun','bird','tree','none'],
  andean:['sun','sun','bird','star'],arctic:['sun','star','bird','none'],japan:['sun','sun','none','wheel'],american:['star','star','bird','none']});

/* ---------- Americans: born in the colonies ---------- */
const AMERICAN_FROM=['west','nordic'];
{const _bc=buildCity;buildCity=function(n,c,ci,e){if(c&&c.colony&&e>=3&&AMERICAN_FROM.includes(cultOf(n))&&n.culture!=='american'){const was=n.culture;n.culture='american';try{return _bc.apply(this,arguments)}finally{n.culture=was}}return _bc.apply(this,arguments)}}
{const _ck=cityKey;cityKey=function(n,c){const k=_ck.apply(this,arguments);return c&&c.colony&&AMERICAN_FROM.includes(cultOf(n))?k+'|am':k}}
{const _rb=rebel;rebel=function(n,forced,why,msgOver){const before=nations.length,from=cultOf(n);const r=_rb.apply(this,arguments);
  if(nations.length>before){const R_=nations[nations.length-1],c=R_.cities[0];if(c&&c.colony&&AMERICAN_FROM.includes(from)&&n.era>=3){R_.culture='american';R_.flag=makeFlag(R_,R_.gov);
      if(!milestones.has('american'))milestone('american','A new people','A colony became a nation with a culture of its own.');log(`In ${c.name}, the colonists no longer call themselves people of ${n.name}. A new people has been born across the sea.`,'era');propsDirty=true}}return r}}
