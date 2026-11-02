"use strict";
/* Faithbound — scenarios: a world with a goal, a deadline and a verdict */

const degC=t=>((t-.5)*10).toFixed(1);
const SCENARIOS=[
  {id:'faith',title:'One True Faith',icon:'star',size:'small',opts:{land:.55,frag:1,mtn:1,rain:.5,rivers:1},
    desc:'You begin with a faith of your own and one nation that follows it. Make every living nation follow it before the year 1200. Beware: big faiths split.',
    setup(S){const t=Object.keys(TENETS);const f={name:'The '+genName(1,2)+' Way',tenets:['zeal',t[(rng()*t.length)|0]==='zeal'?'wisdom':t[(rng()*t.length)|0]],glyph:'star',color:'#e6a91f',founded:year,holy:null};
      faiths.push(f);S.faith=faiths.length-1;selectedFaith=S.faith;const n=nations[0];n.faith=S.faith;f.holy=n.cities[0].name;S.until=1200},
    check(S){const al=nations.filter(n=>n.alive),c=al.filter(n=>n.faith===S.faith).length;S.text=`${c} of ${al.length} nations follow ${faiths[S.faith].name} · until year ${S.until}`;S.pct=c/Math.max(1,al.length);
      if(al.length>=2&&c===al.length)return 'won';if(year>S.until)return 'lost'}},
  {id:'island',title:'From a Lonely Isle',icon:'tent',size:'medium',opts:{land:.38,frag:1.65,mtn:1,rain:.55,rivers:1},
    desc:'Your people are a small tribe on a world of islands. Make them the greatest nation on earth, with the most people, by the year 2400.',
    setup(S){let best=null,bs=1e9;for(const n of nations){const c=n.cities[0];let land=0;for(let dy=-7;dy<=7;dy++)for(let dx=-7;dx<=7;dx++){const X=c.x+dx,Y=c.y+dy;if(X>=0&&Y>=0&&X<W&&Y<H&&!isWater(Y*W+X))land++}if(land<bs){bs=land;best=n}}
      S.nid=best.id;best.pop*=.6;selected=best.id;S.until=2400},
    check(S){const n=nations[S.nid];if(!n||!n.alive)return 'lost';const al=nations.filter(m=>m.alive).sort((a,b)=>b.pop-a.pop),r=al.indexOf(n)+1;
      S.text=`${n.name} ranks #${r} of ${al.length} by people · until year ${S.until}`;S.pct=1-(r-1)/Math.max(1,al.length-1);if(r===1&&year>=500&&al.length>=3)return 'won';if(year>S.until)return 'lost'}},
  {id:'climate',title:'A Warming World',icon:'thermo',size:'small',opts:{land:.55,frag:1,mtn:1,rain:.5,rivers:1},
    desc:'The first factories are smoking. Keep the world below +2.0 °C for 400 years while its nations grow. You cannot simply cool the world yourself: guide the nations instead.',
    setup(S){for(let i=0;i<1400;i++)tick();for(const n of nations)if(n.alive&&n.era<5){n.era=5;grantTechsUpTo(n);n.pop*=1.5}flags.warm=true;climate.temp=.52;S.start=year;S.until=year+400;S.max=.7;terrainDirty=true;propsDirty=true},
    check(S){S.text=`Warming +${degC(climate.temp)} °C of +${degC(S.max)} °C · ${Math.max(0,S.until-year)} years to go`;S.pct=(year-S.start)/400;if(climate.temp>=S.max)return 'lost';if(year>=S.until)return 'won'}},
  {id:'peace',title:'The Long Peace',icon:'dove',size:'medium',opts:{land:.55,frag:1,mtn:1,rain:.5,rivers:1},
    desc:'Keep the world at peace for 500 years. No more than four wars may break out. You may end wars, but every war that starts counts.',
    setup(S){S.until=year+500;S.wars=0;S.max=4;S.start=year},
    check(S){S.text=`${S.wars} of ${S.max} wars allowed · ${Math.max(0,S.until-year)} years to go`;S.pct=(year-S.start)/500;if(S.wars>S.max)return 'lost';if(year>=S.until)return 'won'}}];
const scen=()=>worldOpts.scenario&&worldOpts.scenario.state==='on'?worldOpts.scenario:null;
const scenDef=S=>SCENARIOS.find(d=>d.id===S.id);
function openScenarios(){openModal(`<h2>Scenarios</h2><p class="note">A world with a goal. Each one starts a new world.</p>
  <div class="scen">${SCENARIOS.map(d=>`<button class="scard" data-scen="${d.id}">${svg(d.icon)}<span><b>${d.title}</b><small>${d.desc}</small></span></button>`).join('')}</div>
  <div class="row" style="margin-top:10px"><button class="btn" data-scen="">Back</button></div>`);$('#modalBox').classList.add('wide')}
function startScenario(id){const d=SCENARIOS.find(s=>s.id===id);if(!d)return;closeModal();
  sizeKey=d.size;Object.assign(worldOpts,d.opts);genWorld();updateHUD();
  const S={id,state:'on',began:Date.now()};worldOpts.scenario=S;d.setup(S);d.check(S);
  worldOpts.slot=Date.now().toString(36)+Math.floor(Math.random()*1e6).toString(36);worldOpts.name=d.title;startPlaying(true);
  if(S.nid!=null){const c=nations[S.nid].cities[0];focusOn(wx(c.x),wz(c.y),9)}
  openModal(`<h2>${d.title}</h2><p>${d.desc}</p><div class="row" style="margin-top:12px"><button class="btn primary" onclick="closeModal()">Begin</button></div>`);saveGame()}
/* every war that breaks out counts in The Long Peace */
{const _sw=startWar;startWar=function(a,b,kind){const had=a.wars.has(b.id);_sw(a,b,kind);const S=scen();if(S&&S.id==='peace'&&!had&&a.wars.has(b.id)&&kind!=='ally')S.wars++}}
function scenarioTick(){const S=scen();if(!S)return;const r=scenDef(S).check(S);if(r){S.state=r;S.ended=year;
  const d=scenDef(S);milestone('scen_'+d.id+'_'+r,r==='won'?'Scenario won':'Scenario lost',d.title);
  if(typeof openModal==='function')openModal(`<h2>${r==='won'?'Victory':'Defeat'}: ${d.title}</h2><p>${r==='won'?'You did it. The world remembers your hand.':'The world went its own way.'}</p><p class="note">${S.text||''}</p>
    <div class="row" style="margin-top:12px"><button class="btn" onclick="closeModal()">Keep playing</button><button class="btn primary" onclick="closeModal();openScenarios()">Scenarios</button></div>`)}
  renderGoal()}
function renderGoal(){const el=$('#goal');if(!el)return;const S=worldOpts.scenario;if(!S||!playing){el.hidden=true;return}el.hidden=false;const d=scenDef(S);
  el.innerHTML=`<b>${d.title}${S.state==='won'?' · won':S.state==='lost'?' · lost':''}</b><span>${esc(S.text||'')}</span><div class="prog"><i style="width:${clamp(S.pct||0,0,1)*100}%"></i></div>`}
