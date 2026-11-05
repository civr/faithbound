/* Faithbound — sound: ambience that follows the camera, event effects and generative music per age.
   Everything is synthesised with Web Audio, so there are no sound files to host. */
const SND={ctx:null,on:false,bus:{},amb:{},noise:null,brown:null,verb:null,next:0,bar:0,last:{},chord:0,birdT:0,crackT:0};
const VOL_DEF={master:.8,music:.75,sfx:.5,amb:.6};
function vols(){return Object.assign({},VOL_DEF,settings.vol||{})}
function audioInit(){
  if(SND.ctx){if(SND.ctx.state==='suspended')SND.ctx.resume();return}
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  const c=new AC();SND.ctx=c;
  const comp=c.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=3;comp.connect(c.destination);
  const g=n=>{const x=c.createGain();x.gain.value=0;return x};
  SND.bus.master=g();SND.bus.master.connect(comp);
  for(const k of ['music','sfx','amb']){SND.bus[k]=g();SND.bus[k].connect(SND.bus.master)}
  /* a small hall reverb shared by music and effects */
  const len=c.sampleRate*2.6,ir=c.createBuffer(2,len,c.sampleRate);
  for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.4)}
  SND.verb=c.createConvolver();SND.verb.buffer=ir;const vg=c.createGain();vg.gain.value=.32;SND.verb.connect(vg);vg.connect(SND.bus.master);
  const mk=(brown)=>{const b=c.createBuffer(1,c.sampleRate*3,c.sampleRate),d=b.getChannelData(0);let last=0;
    for(let i=0;i<d.length;i++){const w=Math.random()*2-1;if(brown){last=(last+.02*w)/1.02;d[i]=last*3.5}else d[i]=w}return b};
  SND.noise=mk(false);SND.brown=mk(true);
  const layer=(name,buf,type,freq,q)=>{const s=c.createBufferSource();s.buffer=buf;s.loop=true;s.loopStart=Math.random();
    const f=c.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=q||.7;const gg=c.createGain();gg.gain.value=0;
    s.connect(f);f.connect(gg);gg.connect(SND.bus.amb);s.start();SND.amb[name]={f,g:gg,base:freq}};
  layer('wind',SND.brown,'bandpass',420,.6);layer('waves',SND.brown,'lowpass',380,.5);layer('rain',SND.noise,'highpass',2200,.4);
  layer('crowd',SND.noise,'bandpass',520,2.2);layer('fire',SND.brown,'lowpass',420,.4);layer('river',SND.noise,'bandpass',1500,.8);
  layer('mill',SND.brown,'lowpass',140,3);layer('traffic',SND.noise,'bandpass',300,.6);layer('forest',SND.noise,'highpass',3200,.5);
  SND.next=c.currentTime+.3;SND.on=true;applyVolumes();const sh=document.getElementById('soundHint');if(sh)sh.hidden=true;
}
function applyVolumes(){if(!SND.ctx)return;const v=vols(),t=SND.ctx.currentTime;
  SND.bus.master.gain.setTargetAtTime(settings.mute?0:v.master,t,.1);SND.bus.music.gain.setTargetAtTime(v.music*1.25,t,.2);
  SND.bus.sfx.gain.setTargetAtTime(v.sfx,t,.1);SND.bus.amb.gain.setTargetAtTime(v.amb,t,.2)}
['pointerdown','keydown','touchstart'].forEach(ev=>addEventListener(ev,()=>audioInit(),{passive:true}));
document.addEventListener('visibilitychange',()=>{if(!SND.ctx)return;if(document.hidden)SND.ctx.suspend();else SND.ctx.resume()});

/* ---------- building blocks ---------- */
function env(g,t,a,peak,dec,sus){g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.setTargetAtTime(sus||0,t+a,dec)}
function tone(type,freq,t,dur,peak,dest,o){const c=SND.ctx,os=c.createOscillator(),g=c.createGain();os.type=type;os.frequency.setValueAtTime(freq,t);
  if(o&&o.slide)os.frequency.exponentialRampToValueAtTime(o.slide,t+dur);if(o&&o.detune)os.detune.value=o.detune;
  let node=os;if(o&&o.lp){const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=o.lp;os.connect(f);node=f}
  node.connect(g);g.connect(dest||SND.bus.sfx);if(o&&o.verb)g.connect(SND.verb);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+(o&&o.a||.005));g.gain.setTargetAtTime(0,t+(o&&o.a||.005),dur/4);os.start(t);os.stop(t+dur+.1);return os}
function nburst(buf,t,dur,peak,type,freq,dest,o){const c=SND.ctx,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=buf;
  f.type=type;f.frequency.setValueAtTime(freq,t);if(o&&o.to)f.frequency.exponentialRampToValueAtTime(o.to,t+dur);f.Q.value=o&&o.q||.7;
  s.connect(f);f.connect(g);g.connect(dest||SND.bus.sfx);if(o&&o.verb)g.connect(SND.verb);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+(o&&o.a||.01));g.gain.setTargetAtTime(0,t+(o&&o.a||.01),dur/3);s.start(t,Math.random()*2);s.stop(t+dur*2+.2)}
const hz=m=>440*Math.pow(2,(m-69)/12);
function bell(m,t,peak,dest){for(const [r,a,d] of [[1,1,2.2],[2.76,.45,1.1],[5.4,.25,.6],[.5,.3,2.6]])tone('sine',hz(m)*r,t,d,peak*a,dest,{verb:true})}

/* ---------- effects ---------- */
const SFX_GAP={click:.05,horn:20,bell:12,chime:40,toll:30,doom:25,thunder:.4,quake:3,power:.15,cannon:6,faith:40,splash:.3,fire:1.5};
function sfx(name,o){if(!SND.on)return;const c=SND.ctx,t=c.currentTime+(o&&o.delay||0);if(SND.last[name]&&c.currentTime-SND.last[name]<(SFX_GAP[name]||.2))return;SND.last[name]=c.currentTime;
  const near=o&&o.near!=null?o.near:1;
  switch(name){
  case 'click':tone('sine',700,t,.04,.025,null,{slide:520});break;
  case 'power':nburst(SND.noise,t,.7,.22*near,'bandpass',300,null,{to:2400,q:2,a:.15,verb:true});tone('sine',220,t,.8,.06,null,{slide:660,verb:true});break;
  case 'bless':[72,76,79,84].forEach((m,i)=>bell(m,t+i*.09,.07));break;
  case 'thunder':nburst(SND.noise,t,.12,.35*near,'highpass',1800,null,{});nburst(SND.brown,t+.05,2.8,.9*near,'lowpass',260,null,{to:60,a:.08,verb:true});break;
  case 'quake':nburst(SND.brown,t,3.5,1,'lowpass',120,null,{to:40,a:.4});tone('sine',38,t,3,.35,null,{slide:30});break;
  case 'horn':[0,7].forEach(d=>{tone('sawtooth',hz(45+d),t,2.4,.1,null,{lp:900,a:.5,verb:true});tone('sawtooth',hz(45+d)*1.005,t+.05,2.4,.07,null,{lp:700,a:.6,verb:true})});break;
  case 'bell':bell(64,t,.16);bell(71,t+.35,.11);bell(76,t+.7,.09);break;
  case 'chime':[72,76,79].forEach((m,i)=>tone('sine',hz(m),t+i*.14,1.2,.025,null,{verb:true}));break;
  case 'toll':bell(43,t,.22);bell(43,t+2.2,.15);break;
  case 'doom':tone('sawtooth',hz(36),t,3,.12,null,{lp:400,a:.4,verb:true});tone('sawtooth',hz(37),t,3,.1,null,{lp:400,a:.4,verb:true});nburst(SND.brown,t,2,.4,'lowpass',200,null,{a:.3});break;
  case 'faith':[60,64,67,72].forEach(m=>tone('sine',hz(m),t,3,.05,null,{a:.8,verb:true,detune:(Math.random()-.5)*10}));break;
  case 'cannon':nburst(SND.brown,t,.6,.8*near,'lowpass',400,null,{to:80,a:.004});nburst(SND.noise,t,.08,.3*near,'lowpass',2500,null,{});break;
  case 'splash':nburst(SND.noise,t,.5,.25*near,'bandpass',900,null,{to:300,q:1,a:.02});break;
  case 'fire':nburst(SND.noise,t,1.6,.25*near,'bandpass',600,null,{to:1800,q:1.5,a:.2});break;
  }}
/* the chronicle drives most effects */
function onLogSound(kind,text){if(!SND.on||catching||speedIdx>=3)return;const sel=selected>=0&&nations[selected]?nations[selected].name:null;if(kind!=='era'&&kind!=='war'&&sel&&!text.includes(sel))return;
  if(kind==='war'){if(/war on|declared war|invaded|joined the war|marched with/i.test(text))sfx('horn');else if(/fleet|stormed|pirate|siege/i.test(text))sfx('cannon')}
  else if(kind==='era'&&/completed the/.test(text))sfx('bell');else if(kind==='faith')sfx('faith');
  else if(kind==='doom'){if(/died|passed away|was killed|fallen/i.test(text))sfx('toll');else sfx('doom')}
  else if(kind==='life'&&/founded|rises|alliance|festival|free country|in peace/i.test(text))sfx('chime')}

/* ---------- ambience follows what the camera sees ---------- */
function updateAudio(dt){if(!SND.on)return;const c=SND.ctx,t=c.currentTime,A=SND.amb;
  const close=1-smooth(1,30,camDist),R=Math.max(1.5,camDist*.35);let water=0,land=0,riv=0,forest=0,city=0;
  for(let q=0;q<24;q++){const a=q*2.399,r=Math.sqrt((q+.5)/24)*R,i=tileAt(camT.x+Math.cos(a)*r,camT.z+Math.sin(a)*r);if(i<0){water++;continue}
    if(isWater(i))water++;else{land++;if(river[i])riv++;if(biome[i]===5||biome[i]===6)forest++;if(occupied.has(i))city++}}
  const wf=water/24,coast=wf>0&&wf<1?1-Math.abs(wf-.5)*1.6:wf*.5;
  let rain=0;for(const S of storms){const d=Math.hypot(S.x-camT.x,S.z-camT.z);rain=Math.max(rain,1-smooth(S.r*.6,S.r*1.6+camDist*.3,d))}
  let fire=0;if(fires.size){let k=0;for(const i of fires.keys()){if(++k>60)break;const d=Math.hypot(wx(i%W)-camT.x,wz((i/W)|0)-camT.z);fire=Math.max(fire,1-smooth(.5,4+camDist*.2,d))}}
  const night=nightF||0,set=(L,v,tc)=>L.g.gain.setTargetAtTime(v,t,tc||.6);
  set(A.wind,.07+.22*(1-close)+rain*.25+(biome[tileAt(camT.x,camT.z)]>=10?.2:0));A.wind.f.frequency.setTargetAtTime(A.wind.base*(1+.35*Math.sin(t*.13)+.2*Math.sin(t*.41)),t,.5);
  set(A.waves,.32*coast*(.6+.4*Math.sin(t*.55)*Math.sin(t*.21)+.4));
  set(A.rain,.28*rain);set(A.river,.06*close*(riv/24)*4);
  set(A.crowd,.11*close*close*Math.min(1,city/6)*(1-night*.7),.4);A.crowd.f.frequency.setTargetAtTime(480+Math.random()*160,t,.08);
  set(A.fire,.11*fire*(.75+.25*Math.sin(t*1.7)*Math.sin(t*.63)),.3);A.fire.f.frequency.setTargetAtTime(380+120*Math.sin(t*.9),t,.2);
  /* birds by day near trees, crickets at night */
  SND.birdT-=dt;if(SND.birdT<=0){SND.birdT=.6+Math.random()*2.5;const life=close*(land/24);
    if(life>.25&&rain<.3){if(night<.5&&(forest>2||Math.random()<.4)){const base=2200+Math.random()*1800,n=2+((Math.random()*5)|0);for(let k=0;k<n;k++)tone('sine',base*(1+Math.random()*.2),t+k*.09,.07,.025*life,SND.bus.amb,{slide:base*(.75+Math.random()*.6)})}
      else if(night>.5)for(let k=0;k<3;k++)tone('sine',4400,t+k*.05,.03,.012*life,SND.bus.amb)}}
  /* the sound of the age around the camera: mills thump in industrial towns, traffic rushes in modern ones, leaves rustle in the woods */
  let ind=0,mod=0;{const i0=tileAt(camT.x,camT.z),o=i0>=0?owner[i0]:-1,n=o>=0?nations[o]:null;if(n&&city>0){if(n.era===5)ind=Math.min(1,city/5);else if(n.era>=6)mod=Math.min(1,city/5)}}
  if(A.mill){set(A.mill,.16*close*ind,.8);A.mill.f.frequency.setTargetAtTime(120+30*Math.sin(t*3.1),t,.05);set(A.traffic,.09*close*mod*(1-night*.5),.8);A.traffic.f.frequency.setTargetAtTime(260+90*Math.sin(t*.37),t,.3);
    set(A.forest,.05*close*Math.min(1,forest/8)*(.5+.5*Math.sin(t*.3)),1)}
  /* battle near the front: clashing steel, then musket and cannon fire, then guns and shells */
  SND.warT=(SND.warT||0)-dt;if(SND.warT<=0){SND.warT=.12+Math.random()*.35;let war=0,we=0;
    for(const n of nations){if(!n.alive||!n.wars.size||!n.front)continue;for(let k=0;k<n.front.length;k+=3){const i=n.front[k],d=Math.hypot(wx(i%W)-camT.x,wz((i/W)|0)-camT.z),v=1-smooth(.8,3+camDist*.25,d);if(v>war){war=v;we=n.era}}}
    if(war>.05){const v=war*(.4+.6*close);
      if(we<4){if(Math.random()<.6){tone('triangle',1800+Math.random()*1600,t,.05,.03*v,SND.bus.amb);nburst(SND.noise,t,.04,.06*v,'highpass',3000,SND.bus.amb,{a:.001})}if(Math.random()<.08)nburst(SND.brown,t,.5,.12*v,'lowpass',300,SND.bus.amb)}
      else if(we<6){nburst(SND.noise,t,.06,.1*v*Math.random(),'bandpass',1400,SND.bus.amb,{a:.001});if(Math.random()<.12)nburst(SND.brown,t,.9,.3*v,'lowpass',160,SND.bus.amb,{a:.003})}
      else{for(let q=0;q<3;q++)nburst(SND.noise,t+q*.07,.03,.08*v,'bandpass',2200,SND.bus.amb,{a:.001});if(Math.random()<.15)nburst(SND.brown,t,1.2,.35*v,'lowpass',120,SND.bus.amb,{a:.002})}}}
  SND.crackT-=dt;if(fire>.1&&SND.crackT<=0){SND.crackT=.05+Math.random()*.35/(.5+fire);const n=1+((Math.random()*3.5)|0),loud=Math.random()<.12;
    for(let q=0;q<n;q++){const tt=t+q*(.012+Math.random()*.04);nburst(SND.noise,tt,.004+Math.random()*.01,(loud?.05:.016+Math.random()*.016)*fire,'bandpass',1800+Math.random()*3200,SND.bus.amb,{a:.0005,q:1.4+Math.random()*2})}
    if(loud)nburst(SND.brown,t,.08,.03*fire,'lowpass',500,SND.bus.amb,{a:.002})}
  if(t>SND.next-.2)musicBar()}

/* ---------- generative music: every age has its own band, scale, tempo and rhythm ---------- */
const MODES={penta:[0,3,5,7,10],dorian:[0,2,3,5,7,9,10],mixo:[0,2,4,5,7,9,10],major:[0,2,4,5,7,9,11],minor:[0,2,3,5,7,8,10],harm:[0,2,3,5,7,8,11],lydian:[0,2,4,6,7,9,11]};
/* plucked string (Karplus-Strong): a burst of noise ringing in a tuned delay; lyre, lute and harp */
function pluck(f,t,dur,peak,bright,dest){if(f>320){/* the delay loop cannot tune this high: a bright plucked tone instead */tone('triangle',f,t,dur*.8,peak*.7,dest,{verb:true});tone('sine',f*2,t,dur*.3,peak*.25,dest);return}const c=SND.ctx,len=Math.max(.02,1.2/f),src=c.createBufferSource(),bb=c.createBuffer(1,Math.ceil(c.sampleRate*len),c.sampleRate),d=bb.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);src.buffer=bb;
  const dl=c.createDelay(.1),fb=c.createGain(),lp=c.createBiquadFilter(),g=c.createGain();dl.delayTime.value=1/f;fb.gain.value=.975;lp.type='lowpass';lp.frequency.value=bright||3200;lp.Q.value=-8;/* no resonance: the loop must stay below unity gain or it blows up */
  src.connect(dl);dl.connect(lp);lp.connect(fb);fb.connect(dl);lp.connect(g);g.connect(dest);g.connect(SND.verb);
  g.gain.setValueAtTime(peak,t);g.gain.setTargetAtTime(0,t+dur*.6,dur*.25);src.start(t);src.stop(t+len);setTimeout(()=>{try{fb.disconnect();lp.disconnect();dl.disconnect()}catch(e){}},(t-c.currentTime+dur*2+1)*1000)}
/* breathy flute or recorder: a sine with slow vibrato and a whisper of air */
function flute(f,t,dur,peak,dest){const c=SND.ctx,o=c.createOscillator(),v=c.createOscillator(),vg=c.createGain(),g=c.createGain();o.type='sine';o.frequency.value=f;v.frequency.value=5.2;vg.gain.value=f*.006;
  v.connect(vg);vg.connect(o.frequency);o.connect(g);g.connect(dest);g.connect(SND.verb);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+.08);g.gain.setTargetAtTime(peak*.7,t+.1,.3);g.gain.setTargetAtTime(0,t+dur*.85,.08);
  o.start(t);v.start(t);o.stop(t+dur+.5);v.stop(t+dur+.5);nburst(SND.noise,t,.12,peak*.25,'bandpass',f*2,dest,{q:3,a:.02})}
/* bowed fiddle or cello: sawtooth through a body filter with vibrato */
function bow(f,t,dur,peak,dest,dark){const c=SND.ctx,o=c.createOscillator(),v=c.createOscillator(),vg=c.createGain(),lp=c.createBiquadFilter(),g=c.createGain();o.type='sawtooth';o.frequency.value=f;
  v.frequency.value=5.6;vg.gain.value=f*.008;v.connect(vg);vg.connect(o.frequency);lp.type='lowpass';lp.frequency.value=dark?900:2200;lp.Q.value=1.2;o.connect(lp);lp.connect(g);g.connect(dest);g.connect(SND.verb);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+.15);g.gain.setTargetAtTime(0,t+dur*.9,.12);o.start(t);v.start(t);o.stop(t+dur+.6);v.stop(t+dur+.6)}
/* electric piano: a little FM bell-tone */
function epiano(f,t,dur,peak,dest){const c=SND.ctx,car=c.createOscillator(),mod=c.createOscillator(),mg=c.createGain(),g=c.createGain();car.frequency.value=f;mod.frequency.value=f;mg.gain.setValueAtTime(f*1.6,t);mg.gain.setTargetAtTime(f*.2,t,.25);
  mod.connect(mg);mg.connect(car.frequency);car.connect(g);g.connect(dest);g.connect(SND.verb);g.gain.setValueAtTime(peak,t);g.gain.setTargetAtTime(0,t,dur*.35);car.start(t);mod.start(t);car.stop(t+dur+1);mod.stop(t+dur+1)}
function drum(kind,t,peak,dest){
  if(kind==='frame'){tone('sine',110,t,.35,peak,dest,{slide:55});nburst(SND.brown,t,.12,peak*.5,'lowpass',400,dest,{a:.002})}
  else if(kind==='tabor'){tone('triangle',180,t,.18,peak*.8,dest,{slide:120});nburst(SND.noise,t,.08,peak*.35,'bandpass',1800,dest,{a:.002,q:1})}
  else if(kind==='clap'){nburst(SND.noise,t,.06,peak*.5,'bandpass',1300,dest,{a:.001,q:1.5})}
  else if(kind==='kick'){tone('sine',120,t,.3,peak,dest,{slide:42})}
  else if(kind==='hat'){nburst(SND.noise,t,.03,peak*.25,'highpass',7000,dest,{a:.001})}
  else if(kind==='snare'){nburst(SND.noise,t,.12,peak*.4,'bandpass',2200,dest,{a:.001,q:.8});tone('triangle',200,t,.1,peak*.3,dest)}
  else if(kind==='timpani'){tone('sine',73,t,1.2,peak,dest,{slide:68,verb:true});nburst(SND.brown,t,.3,peak*.3,'lowpass',300,dest,{a:.003})}}
/* each age: scale, root, tempo, beats per bar, and a band that plays one bar from the chord it is given */
const BANDS=[
  {name:'Stone Age',mode:'penta',root:45,bpm:76,beats:4,prog:[0,0,3,0,4,3,0,0],play(b){
    tone('sawtooth',hz(b.root-12),b.t,b.beat*b.beats,.05,b.bus,{lp:260,a:.5});tone('sawtooth',hz(b.root-5),b.t,b.beat*b.beats,.025,b.bus,{lp:300,a:.6});
    for(let k=0;k<b.beats;k++){drum('frame',b.t+k*b.beat,k%2?.25:.42,b.bus);if(Math.random()<.4)drum('clap',b.t+(k+.5)*b.beat,.3,b.bus)}
    b.melody(6,.42,(f,t,d)=>flute(f,t,d,.05,b.bus),1)}},
  {name:'Bronze Age',mode:'harm',root:50,bpm:84,beats:4,prog:[0,0,1,0,3,4,0,0],play(b){
    tone('triangle',hz(b.root-12),b.t,b.beat*b.beats,.05,b.bus,{a:.3});
    for(let k=0;k<b.beats;k++){drum('frame',b.t+k*b.beat,k===0?.4:.2,b.bus);if(k===2)drum('tabor',b.t+k*b.beat+b.beat*.5,.25,b.bus)}
    b.melody(8,.35,(f,t,d)=>pluck(f,t,d*1.6,.16,2600,b.bus),1)}},
  {name:'Iron Age',mode:'dorian',root:50,bpm:88,beats:4,prog:[0,3,0,4,0,3,6,0],play(b){
    b.chord((f)=>pluck(f,b.t,b.beat*3,.09,2200,b.bus),0);b.chord((f)=>pluck(f,b.t+b.beat*2,b.beat*3,.07,2200,b.bus),0);
    for(let k=0;k<b.beats;k++)drum(k%2?'clap':'frame',b.t+k*b.beat,.3,b.bus);
    b.melody(8,.38,(f,t,d)=>flute(f,t,d,.045,b.bus),1)}},
  {name:'Medieval',mode:'dorian',root:52,bpm:96,beats:3,prog:[0,6,0,4,3,6,0,0],play(b){
    /* a lute strums, a recorder sings and a tabor keeps a dance in three */
    for(let k=0;k<3;k++)b.chord((f,i)=>pluck(f,b.t+k*b.beat+i*.025,b.beat*1.4,k===0?.1:.06,2800,b.bus),0);
    drum('tabor',b.t,.35,b.bus);drum('tabor',b.t+b.beat*2,.2,b.bus);
    b.melody(6,.32,(f,t,d)=>flute(f,t,d,.05,b.bus),1);
    if(b.bar%8===0)bell(b.root+12,b.t,.05,b.bus)}},
  {name:'Age of Sail',mode:'major',root:55,bpm:108,beats:3,prog:[0,4,0,3,0,4,1,4],play(b){
    /* a sea shanty: fiddle tune, plucked harp chords, stomps on the deck */
    b.chord((f)=>pluck(f,b.t,b.beat*2.5,.07,4200,b.bus),0);b.chord((f)=>pluck(f,b.t+b.beat,b.beat*1.2,.04,4200,b.bus),1);b.chord((f)=>pluck(f,b.t+b.beat*2,b.beat*1.2,.04,4200,b.bus),1);
    drum('kick',b.t,.32,b.bus);drum('clap',b.t+b.beat,.18,b.bus);drum('clap',b.t+b.beat*2,.18,b.bus);
    b.melody(6,.22,(f,t,d)=>bow(f,t,d,.045,b.bus),1)}},
  {name:'Industrial',mode:'minor',root:48,bpm:72,beats:4,prog:[0,5,3,4,0,5,2,4],play(b){
    /* a romantic piano and a cello under smoky skies */
    bow(hz(b.note(0,-1)),b.t,b.beat*4,.05,b.bus,true);
    for(let k=0;k<4;k++)b.chord((f,i)=>epiano(f*.5,b.t+k*b.beat+i*.04,b.beat*1.5,.045,b.bus),0,k%2);
    b.melody(6,.3,(f,t,d)=>tone('triangle',f,t,d*1.6,.06,b.bus,{verb:true}),1);
    if(b.bar%4===0)drum('timpani',b.t,.3,b.bus)}},
  {name:'Modern',mode:'mixo',root:50,bpm:98,beats:4,prog:[0,6,3,4,0,6,3,4],play(b){
    /* electric piano, round bass and a light beat */
    for(let k=0;k<4;k++){drum('kick',b.t+k*b.beat,k%2?.18:.3,b.bus);drum('hat',b.t+(k+.5)*b.beat,.4,b.bus);if(k%2)drum('snare',b.t+k*b.beat,.22,b.bus)}
    tone('triangle',hz(b.note(0,-2)),b.t,b.beat*1.8,.09,b.bus,{lp:500});tone('triangle',hz(b.note(4,-2)),b.t+b.beat*2,b.beat*1.8,.08,b.bus,{lp:500});
    b.chord((f,i)=>epiano(f,b.t+i*.02,b.beat*3,.05,b.bus),0);b.melody(8,.4,(f,t,d)=>epiano(f*2,t,d,.04,b.bus),0)}},
  {name:'Future',mode:'lydian',root:55,bpm:84,beats:4,prog:[0,1,0,4,0,1,5,4],play(b){
    /* shimmering pads and a running arpeggio */
    b.chord((f)=>{tone('sawtooth',f,b.t,b.beat*4.5,.018,b.bus,{lp:1400,a:b.beat,verb:true,detune:6});tone('sawtooth',f,b.t,b.beat*4.5,.018,b.bus,{lp:1400,a:b.beat,verb:true,detune:-6})},0);
    for(let k=0;k<16;k++){const f=hz(b.note([0,2,4,7][k%4]+(k>7?7:0),1));tone('triangle',f,b.t+k*b.beat/4,b.beat*.3,.03,b.bus,{verb:true})}
    if(b.bar%2===0)drum('kick',b.t,.18,b.bus)}}];
/* the Faithbound theme on the title screen: a composed tune in D dorian, lute, flute and drums, then fiddle on the repeat */
const THEME={bpm:84,chords:[[62,65,69],[60,64,67],[55,59,62],[62,65,69],[53,57,60],[60,64,67],[55,59,62],[62,65,69]],
  mel:[[[69,1],[74,1],[76,1],[77,1]],[[76,2],[74,1],[72,1]],[[74,2],[71,1],[67,1]],[[69,4]],[[77,1],[76,1],[74,1],[72,1]],[[76,1],[79,1],[76,1],[72,1]],[[74,1],[76,1],[71,1],[67,1]],[[74,4]]]};
function themeBar(){const c=SND.ctx,beat=60/THEME.bpm,t0=Math.max(SND.next,c.currentTime+.05),bus=SND.bus.music,i=SND.bar%8,loop=Math.floor(SND.bar/8),ch=THEME.chords[i];
  bow(hz(ch[0]-12),t0,beat*4,.06,bus,true);
  for(let k=0;k<8;k++)pluck(hz(ch[[0,1,2,1][k%4]]-(k<4?0:12)),t0+k*beat/2,beat*.9,.08,2600,bus);
  let tt=t0;for(const [m,l] of THEME.mel[i]){if(loop%2)bow(hz(m),tt,l*beat*.95,.05,bus);else flute(hz(m),tt,l*beat*.95,.07,bus);tt+=l*beat}
  drum('frame',t0,.35,bus);drum('frame',t0+2*beat,.22,bus);if(i===7)drum('tabor',t0+3.5*beat,.25,bus);
  if(i===0)drum('timpani',t0,.28,bus);if(i===0&&loop%2===0)bell(62,t0,.05,bus);
  SND.next=t0+beat*4;SND.bar++}
let lastMusicEra=-1;
function musicEra(){if(selected>=0&&nations[selected]&&nations[selected].alive)return nations[selected].era;let e=0;for(const n of nations)if(n.alive)e=Math.max(e,n.era);return e}
/* ---------- music styles: pick one in Settings ----------
   Calm: slow pads, a deep hum and bells, no drums.  Epic: strings and horns over timpani, building in war.  Cozy: plucked harp arpeggios, soft piano and flute. */
function organ(f,t,dur,peak,bus){for(const [h,a] of [[1,1],[2,.5],[3,.28],[4,.18],[6,.08]])tone('sine',f*h,t,dur,peak*a,bus,{a:Math.min(2.5,dur*.3),verb:true})}
const STYLES={
  cinematic:{bpm:(war,ww)=>ww?86:war?62:50,play(b,war,era,ww){const L=b.beats*b.beat,inten=ww?1:war?.5:0;
    /* the organ: long swelling chords */if(b.bar%2===0||ww)b.chord((f,i)=>organ(f,b.t+i*.12,L*(ww?1.05:2.1),.016+.008*inten,b.bus),-1);
    /* the clock: a soft ticking figure, faster as tension rises */const sub=ww?4:war?2:2,step=b.beat/sub,hi=[b.note(4,1),b.note(2,1)];for(let k=0;k<b.beats*sub;k++)tone('triangle',hz(hi[k%2]),b.t+k*step,step*.9,(k%sub===0?.014:.008)*(1+inten),b.bus,{lp:2600});
    /* the deep: a drone under everything, and a distant boom now and then */tone('sine',hz(b.note(0,-2)),b.t,L*1.2,.06+.03*inten,b.bus,{a:1.2,lp:200});
    if(war)tone('sawtooth',hz(b.note(0,-2)),b.t,L,.012+.012*inten,b.bus,{a:.8,lp:180+120*inten});
    if(b.bar%4===0||(ww&&b.bar%2===0)){drum('timpani',b.t,.22+.25*inten,b.bus);nburst(SND.brown,b.t,1.4,.05+.06*inten,'lowpass',120,b.bus,{a:.02})}
    /* a world war: driving low strings and drums on every beat, building over eight bars */
    if(ww){const lift=1+(b.bar%8)*.06;for(let k=0;k<b.beats*2;k++)bow(hz(b.note(k%4===3?1:0,-1)),b.t+k*b.beat/2,b.beat*.4,.03*lift,b.bus,true);for(let k=0;k<b.beats;k++)drum(k%2?'frame':'timpani',b.t+k*b.beat,(k%2?.14:.26)*lift,b.bus)}
    else if(b.bar%4===2)b.melody(3,.4,(f,t,d)=>bow(f,t,d*1.6,.022,b.bus,true),0)}},
  calm:{bpm:56,play(b,war,era){const L=b.beats*b.beat;
    b.chord((f,i)=>bow(f,b.t+i*.08,L*1.1,.034,b.bus,true),-1);tone('sine',hz(b.note(0,-2)),b.t,L,.05,b.bus,{a:.6,lp:300});
    if(b.bar%2===0){const k=1+((Math.random()*3)|0);for(let q=0;q<k;q++){const m=b.note([0,2,4,7][(Math.random()*4)|0],1);bell(m,b.t+(q+.5)*L/k+Math.random()*.3,.035,b.bus)}}
    if(war)tone('sawtooth',hz(b.note(0,-2)),b.t,L,.012,b.bus,{a:1,lp:240})}},
  epic:{bpm:88,play(b,war,era){const L=b.beats*b.beat,eighth=b.beat/2;
    for(let k=0;k<b.beats*2;k++){const d=[0,2,4,2][k%4];pluck(hz(b.note(d,-1)),b.t+k*eighth,eighth*.9,.05,.5,b.bus)}/* strings ostinato */
    b.chord((f,i)=>bow(f,b.t,L*.98,.03+(war?.01:0),b.bus,false),0);/* horns and strings swell */
    drum('timpani',b.t,war?.4:.28,b.bus);if(b.beats>=4)drum('timpani',b.t+2*b.beat,war?.3:.18,b.bus);if(war){for(let k=0;k<b.beats;k++)drum('frame',b.t+k*b.beat+b.beat/2,.18,b.bus)}
    if(b.bar%2===1)b.melody(4,.25,(f,t,d)=>bow(f,t,d*1.2,.045,b.bus,false),1)}},
  cozy:{bpm:74,play(b,war,era){const L=b.beats*b.beat,six=b.beat/2,arp=[0,2,4,7,4,2,0,2];
    for(let k=0;k<b.beats*2;k++)pluck(hz(b.note(arp[k%arp.length],0)),b.t+k*six,six*1.6,.07,.7,b.bus);/* harp */
    b.chord((f,i)=>epiano(f,b.t+i*.02,L*.9,.03,b.bus),-1);tone('sine',hz(b.note(0,-2)),b.t,b.beat*1.6,.07,b.bus,{a:.01});
    for(let k=1;k<b.beats;k+=2)drum('frame',b.t+k*b.beat,war?.12:.06,b.bus);
    if(b.bar%4>=2)b.melody(6,.35,(f,t,d)=>flute(f,t,d,.04,b.bus),1)}}};
function musicBar(){if(!playing){themeBar();lastMusicEra=-1;return}
  const style=settings.music||'cinematic';if(style==='off'){SND.next=SND.ctx.currentTime+2;return}
  const c=SND.ctx,era=musicEra(),B=BANDS[era];
  if(era!==lastMusicEra){/* a short fanfare when the age changes */if(lastMusicEra>=0&&playing){const t=Math.max(SND.next,c.currentTime+.05);[0,4,7,12].forEach((m,i)=>bow(hz(B.root+12+m),t+i*.22,.9,.05,SND.bus.music));drum('timpani',t,.35,SND.bus.music);SND.next=t+1.6;SND.bar=0}lastMusicEra=era}
  const war=nations.some(n=>n.alive&&n.wars.size);let mode=B.mode;if(war&&(mode==='major'||mode==='mixo'||mode==='lydian'))mode='minor';
  const ww=typeof worldWars!=='undefined'&&worldWars.some(w=>w.end==null),S=STYLES[style];if(S===STYLES.cinematic&&(war||ww))mode='minor';const sc=MODES[mode],beat=60/(S?(typeof S.bpm==='function'?S.bpm(war,ww):S.bpm):B.bpm)*(war&&!S?.92:1),t0=Math.max(SND.next,c.currentTime+.05),deg=B.prog[SND.bar%B.prog.length];
  const note=(d,oct)=>B.root+12*(oct||0)+sc[((d%sc.length)+sc.length)%sc.length]+12*Math.floor(d/sc.length);
  const b={t:t0,beat,beats:S?4:B.beats,bus:SND.bus.music,root:B.root,bar:SND.bar,note:(d,oct)=>note(deg+d,oct),
    chord(fn,oct,inv){[0,2,4].forEach((d,i)=>fn(hz(note(deg+d+(inv&&i===0?sc.length:0),oct||0)),i))},
    melody(slots,rest,fn,oct){let d=deg+2+((Math.random()*3)|0);const step=B.beats*beat/slots;for(let k=0;k<slots;k++){if(Math.random()<rest)continue;d+=Math.round((Math.random()-.5)*3);d=clamp(d,deg-1,deg+9);
      const len=Math.random()<.3?step*2:step;fn(hz(note(d,oct)),t0+k*step+(Math.random()-.5)*.015,len*.95)}}};
  try{if(S)S.play(b,war,era,ww);else B.play(b)}catch(e){}
  if(!S&&war&&era<5)for(let k=0;k<B.beats;k++)drum('frame',t0+k*beat,.3,SND.bus.music);
  SND.next=t0+beat*b.beats;SND.bar++}
