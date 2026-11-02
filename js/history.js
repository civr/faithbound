"use strict";
/* Faithbound — the world's memory: annals, samples for charts, border snapshots every century, the history book and the rewind */

const ANNAL_RE=/declared war|sacked|was conquered|broke away|Revolution|seized power|schism|holy war|golden age|discovered .* and entered|completed the|found gold|struck oil|founded|embraced|kraken|Famine in|broke out in|A star fell|sank|independence|raised new land|terraform|colon/i;
/* keep the important lines of the chronicle for the book, far longer than the scrolling log */
{const _log=log;log=function(text,kind){_log(text,kind);if(kind==='era'||kind==='doom'||ANNAL_RE.test(text)){annals.push({y:year,t:text,k:kind});if(annals.length>1500)annals.splice(0,annals.length-1500)}}}
function historyTick(){
  if(year%10===0){const al=nations.filter(n=>n.alive);const fp={};for(const n of al)if(n.faith>=0)fp[n.faith]=(fp[n.faith]||0)+n.pop;
    hist.push({y:year,t:+climate.temp.toFixed(3),n:al.map(n=>[n.id,Math.round(n.pop),n.tiles,n.era]),f:Object.entries(fp).map(([k,v])=>[+k,Math.round(v)])});
    if(hist.length>600)hist=hist.filter((_,i)=>i%2===0)}
  if(year%100===0&&year>0)snapBorders()}
function snapBorders(){const r=[];let v=owner[0],c=0;for(let i=0;i<N;i++){if(owner[i]===v)c++;else{r.push(v,c);v=owner[i];c=1}}r.push(v,c);snaps.push({y:year,r});if(snaps.length>80)snaps.splice(0,snaps.length-80)}
function unsnap(s){const o=new Int16Array(N);let p=0;for(let i=0;i<s.r.length;i+=2){o.fill(s.r[i],p,p+s.r[i+1]);p+=s.r[i+1]}return o}

/* ---------- charts drawn as simple SVG lines ---------- */
function lineChart(series,{h=150,pct=false,stack=false}={}){if(!hist.length)return '<p class="note">History is still being written.</p>';
  const W_=600,x0=hist[0].y,x1=Math.max(x0+1,hist[hist.length-1].y),X=y=>(y-x0)/(x1-x0)*W_;let mx=1e-9;
  if(stack){for(let i=0;i<hist.length;i++){let s=0;for(const se of series)s+=se.v[i]||0;mx=Math.max(mx,s)}}else for(const se of series)for(const v of se.v)mx=Math.max(mx,v||0);
  const Y=v=>h-(v/mx)*(h-8)-2;let paths='';
  if(stack){const base=new Array(hist.length).fill(0);for(const se of series){const top=se.v.map((v,i)=>base[i]+(v||0));
      const d='M'+hist.map((s,i)=>X(s.y).toFixed(1)+','+Y(top[i]).toFixed(1)).join('L')+'L'+hist.map((s,i)=>X(s.y).toFixed(1)+','+Y(base[i]).toFixed(1)).reverse().join('L')+'Z';
      paths+=`<path d="${d}" fill="${se.c}" fill-opacity=".75" stroke="${se.c}" stroke-width="1"/>`;top.forEach((v,i)=>base[i]=v)}}
  else for(const se of series){const d='M'+hist.map((s,i)=>X(s.y).toFixed(1)+','+Y(se.v[i]||0).toFixed(1)).join('L');paths+=`<path d="${d}" fill="none" stroke="${se.c}" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`}
  const ticks=[],labs=[];const step=Math.max(100,Math.round((x1-x0)/5/100)*100);for(let y=Math.ceil(x0/step)*step;y<=x1;y+=step){ticks.push(`<line x1="${X(y)}" x2="${X(y)}" y1="0" y2="${h}" stroke="rgba(255,255,255,.08)" vector-effect="non-scaling-stroke"/>`);labs.push(`<span style="left:${(X(y)/W_*100).toFixed(2)}%">${y}</span>`)}
  const legend=series.map(se=>`<span><i style="background:${se.c}"></i>${esc(se.l)}</span>`).join('');
  return `<svg viewBox="0 0 ${W_} ${h}" class="chart" preserveAspectRatio="none">${ticks.join('')}${paths}</svg><div class="axis">${labs.join('')}</div><div class="legend">${legend}</div>`}
function topNations(by,k){const peak={};for(const s of hist)for(const r of s.n)peak[r[0]]=Math.max(peak[r[0]]||0,r[by]);return Object.keys(peak).sort((a,b)=>peak[b]-peak[a]).slice(0,k).map(Number)}
function nationSeries(by,ids){return ids.map(id=>({l:nations[id]?nations[id].name:'?',c:nations[id]?nations[id].color:'#888',v:hist.map(s=>{const r=s.n.find(r=>r[0]===id);return r?r[by]:0})}))}
function faithSeries(){const tot={};for(const s of hist)for(const [f,v] of s.f)tot[f]=(tot[f]||0)+v;const ids=Object.keys(tot).sort((a,b)=>tot[b]-tot[a]).slice(0,7).map(Number);
  return ids.map(f=>({l:faiths[f]?faiths[f].name:'?',c:faiths[f]?faiths[f].color:'#888',v:hist.map(s=>{const r=s.f.find(r=>r[0]===f);return r?r[1]:0})}))}

/* ---------- the book: one chapter per age ---------- */
function chapters(){const starts=[{e:0,y:0}];for(let e=1;e<ERAS.length;e++){const m=milestoneInfo['era'+e];if(m)starts.push({e,y:m.year})}starts.sort((a,b)=>a.y-b.y);
  return starts.map((s,i)=>{const end=i+1<starts.length?starts[i+1].y:year,ev=annals.filter(a=>a.y>=s.y&&a.y<end);
    const atEnd=hist.filter(h=>h.y<=end).pop();let sum='';if(atEnd){const top=atEnd.n.slice().sort((a,b)=>b[1]-a[1])[0];sum=`${atEnd.n.length} nations · ${fmtPop(atEnd.n.reduce((a,r)=>a+r[1],0))} people${top&&nations[top[0]]?' · greatest: '+esc(nations[top[0]].name):''}`}
    const wars=ev.filter(a=>/declared war/.test(a.t)).length,pick=ev.filter(a=>a.k==='era'||a.k==='doom'||/schism|holy war|Revolution|conquered|golden age|sacked/i.test(a.t));
    const shown=(pick.length>9?pick.filter((_,j)=>j%Math.ceil(pick.length/9)===0):pick).slice(0,9);
    return {title:ERAS[s.e].name,from:s.y,to:end,sum,wars,lines:shown}})}
function openBook(){const ch=chapters(),pop=topNations(1,6),land=topNations(2,6);
  $('#modalBox').classList.add('wide');openModal(`<h2>The Book of ${esc(worldOpts.name||'this World')}</h2><p class="note">Year ${year}. ${nations.filter(n=>n.alive).length} living nations, ${nations.length-nations.filter(n=>n.alive).length} fallen, ${faiths.length} faiths.</p>
    <div class="book"><div class="sec"><h4>People of the great nations</h4>${lineChart(nationSeries(1,pop))}</div>
    <div class="sec"><h4>Power: land held</h4>${lineChart(nationSeries(2,land))}</div>
    <div class="sec"><h4>Faith: followers of each faith</h4>${lineChart(faithSeries(),{stack:true})}</div>
    ${ch.map(c=>`<div class="sec chap"><h3>${c.title}<small>Year ${c.from}${c.to>c.from?' to '+c.to:''}</small></h3><p class="note">${c.sum}${c.wars?' · '+c.wars+' wars declared':''}</p><ul>${c.lines.map(a=>`<li><time>Y${a.y}</time>${esc(a.t)}</li>`).join('')||'<li>A quiet age.</li>'}</ul></div>`).join('')}
    <div class="sec"><h4>Achievements</h4><div class="ms">${[...milestones].map(id=>{const m=milestoneInfo[id];return m?`<div class="done"><b>${esc(m.title)}</b>Year ${m.year}</div>`:''}).join('')}</div></div></div>
    <div class="row" style="margin-top:10px"><button class="btn" onclick="closeModal()">Close</button><div class="flex"></div><button class="btn primary" onclick="closeModal();startRewind()">Rewind the borders</button></div>`);$('#modalBox').classList.add('wide')}

/* ---------- rewind: show the borders of any past century ---------- */
let rewind=null;
function startRewind(){if(!snaps.length){say('The first snapshot is taken at the next turn of a century.');return}if(rewind)return;closeSheet();
  rewind={own:owner.slice(),speed:speedIdx,i:snaps.length-1};speedIdx=0;updateHUD();const bar=$('#rewindBar');bar.hidden=false;
  bar.innerHTML=`<b id="rwY"></b><input type="range" id="rwR" min="0" max="${snaps.length}" value="${snaps.length}"><button class="btn primary" id="rwBack">Back to now</button>`;
  $('#rwR').oninput=e=>showSnap(+e.target.value);$('#rwBack').onclick=endRewind;showSnap(snaps.length)}
function showSnap(i){if(!rewind)return;if(i>=snaps.length){owner.set(rewind.own);$('#rwY').textContent=`Year ${year} (now)`}else{owner.set(unsnap(snaps[i]));$('#rwY').textContent=`Borders of year ${snaps[i].y}`}
  bordersDirty=true;bordersUrgent=true;if(typeof drawMini==='function')drawMini()}
function endRewind(){if(!rewind)return;owner.set(rewind.own);speedIdx=rewind.speed;rewind=null;$('#rewindBar').hidden=true;bordersDirty=true;bordersUrgent=true;updateHUD();if(typeof drawMini==='function')drawMini()}
