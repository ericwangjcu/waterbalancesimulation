(()=>{
const N=45,$=id=>document.getElementById(id);
const SYS={
  cp:{code:'CP',energy:'Electric',imus:4,hyd:32.3,eff:.95,cycle:4},
  lm:{code:'LM',energy:'Diesel',imus:6,hyd:51.8,eff:.95,cycle:6}
};
const REGIONS={
  tablelands:{title:'Atherton Tablelands',query:'Atherton Tablelands Queensland Australia',caption:'Workbook note: irrigation water is non-limiting for the majority of sugarcane farmers. Limited cases are mainly associated with infrastructure that cannot meet peak irrigation demand.'},
  mackay:{title:'Mackay / Eton',query:'Eton Queensland Australia',caption:'Workbook note: Mackay includes a significant rainfed component and genuinely limited-water situations, including about 3 ML/ha in the Eton Irrigation Scheme and up to about 6 ML/ha around Proserpine/off-scheme sources.'},
  bundaberg:{title:'Bundaberg',query:'Bundaberg Queensland Australia',caption:'Workbook note: Bundaberg is suspected to be similar to the Tablelands, but this still needs confirmation.'},
  burdekin:{title:'Burdekin',query:'Burdekin Shire Queensland Australia',caption:'Workbook note: water allocation is treated as non-limiting for Burdekin farmers.'}
};
const SCENARIOS={
  tablelands_cp:{
    label:'Tablelands — Centre Pivot',region:'tablelands',system:'cp',mode:'unlimited',alloc:120,tr:60,irr:32.3,rain:20,prob:70,look:3,
    site:'Atherton Tablelands · Centre Pivot · moderate/high PAW soil',
    sub:'Workbook CP setup: four equal-quarter IMUs, IrrigWeb scheduling, automation and a 4-day minimum irrigation cycle.',
    summary:'A clean non-limited-water benchmark to test whether forecast rainfall can replace some irrigation without reducing production.',
    facts:[['40 L/s','Pump flow'],['40.7 ha','Irrigated area'],['10.18 ha','Area / IMU'],['32.3 mm','Net application'],['4 d','Minimum cycle'],['Electric','Energy']],
    imus:[['IMU 1','F','10.18 ha'],['IMU 2','P','10.18 ha'],['IMU 3','1R','10.18 ha'],['IMU 4','2R','10.18 ha']],
    benchmark:'The workbook CP assumptions use a 60 mm SWD trigger, moderate-to-high PAW soil (Ferrosol suggested), IrrigWeb/APSIM scheduling and a maximum 40 mm irrigation strategy.'
  },
  tablelands_lm:{
    label:'Tablelands — Lateral Move',region:'tablelands',system:'lm',mode:'unlimited',alloc:120,tr:60,irr:40,rain:20,prob:70,look:3,
    site:'Atherton Tablelands · Lateral Move · moderate/high PAW soil',
    sub:'Workbook LM setup: six IMUs, diesel energy, IrrigWeb scheduling, automation and a 6-day minimum cycle.',
    summary:'The same forecast-vs-no-forecast experiment under a different irrigation system and longer hydraulic cycle.',
    facts:[['50 L/s','Pump flow'],['47.5 ha','Irrigated area'],['7.92 ha','Area / IMU'],['40 mm','Max strategy target'],['6 d','Minimum cycle'],['Diesel','Energy']],
    imus:[['IMU 1','F','7.92 ha'],['IMU 2','P','7.92 ha'],['IMU 3','1R','7.92 ha'],['IMU 4','2R','7.92 ha'],['IMU 5','3R','7.92 ha'],['IMU 6','4R','7.92 ha']],
    benchmark:'The detailed LM sheet calculates about 51.8 mm hydraulic net capacity per pass, while the irrigation strategy section says to apply a maximum of 40 mm per irrigation.'
  },
  mackay_cp:{
    label:'Mackay / Eton — CP IrrigWeb test',region:'mackay',system:'cp',mode:'unlimited',alloc:120,tr:60,irr:32.3,rain:20,prob:70,look:3,
    site:'Mackay · Eton Sunwater · Centre Pivot · Black Earth PAW 170 mm',
    sub:'Workbook IrrigWeb proof-of-concept: four CP IMUs of about 10.18 ha each using the 4-day / 34 mm gross management rule.',
    summary:'This preset links the demonstrator to Steve’s existing forecast ON/OFF IrrigWeb comparison rather than only a generic synthetic farm.',
    facts:[['40 L/s','CP pump'],['40.7 ha','Irrigated area'],['170 mm','PAW'],['32.3 mm','Net application'],['4 d','Minimum cycle'],['Eton','Met site']],
    imus:[['CP1_B1','P','10.18 ha'],['CP1_B2','1R','10.18 ha'],['CP1_B3','2R','10.18 ha'],['CP1_B4','3R','10.18 ha']],
    benchmark:'Workbook benchmark: forecast ON reduced irrigation by an average 0.77 ML/ha (about 11.3%; 31.35 ML total across the four IMUs in the example), while reported yields were very similar.'
  }
};
let seed=1056,W=[],activeScenario='tablelands_cp',activeRegion='tablelands';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),fmt=(v,d=0)=>Number(v).toFixed(d),date=i=>new Date(2026,8,7+i).toLocaleDateString('en-AU',{day:'2-digit',month:'short'});
function rng(a){return()=>{let t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function gauss(r){let u=0,v=0;while(!u)u=r();while(!v)v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
function gen(){const r=rng(seed);W=[];for(let i=0;i<N;i++){let event=r()<clamp(.15+.10*Math.sin((i+3)/5.2),.05,.28),actual=event?Math.max(0,5+r()*25+gauss(r)*4):(r()<.08?r()*4:0),fc=Math.max(0,actual*(.65+r()*.75)+gauss(r)*4.5),prob=actual>5?52+r()*43:12+r()*53;if(r()<.1)prob=66+r()*28;if(actual>15&&r()<.1)prob=30+r()*30;W.push({day:i,actual:+actual.toFixed(1),fc:+fc.toFixed(1),prob:Math.round(clamp(prob,5,95)),etc:+clamp(5.4+Math.sin(i/6)+gauss(r)*.7,3.6,7.4).toFixed(1)})}}
function setMap(key){
  let r=REGIONS[key]||REGIONS.tablelands;activeRegion=key in REGIONS?key:'tablelands';
  $('mapRegionTitle').textContent=r.title;$('mapCaption').textContent=r.caption;
  let q=encodeURIComponent(r.query);
  $('farmMap').src='https://www.google.com/maps?q='+q+'&output=embed';
  $('mapOpenLink').href='https://www.google.com/maps/search/?api=1&query='+q;
  document.querySelectorAll('.region-tab').forEach(b=>b.classList.toggle('active',b.dataset.region===activeRegion));
}
function scenarioUI(p){
  let s=SCENARIOS[activeScenario]||SCENARIOS.tablelands_cp,custom=$('scenarioPreset').value==='custom';
  $('scenarioName').textContent=custom?'Customised from '+s.label:s.label;
  $('scenarioSummary').textContent=s.summary+(custom?' Current fine-tuning controls differ from the original preset.':'');
  $('headerBadge').textContent=(REGIONS[s.region]?.title||'Farm scenario')+' · '+p.s.code+' · synthetic weather';
  $('contextTitle').textContent=s.site;$('contextSub').textContent=s.sub;
  $('layoutTitle').textContent=s.imus.length+' IMUs · '+(p.s.code==='CP'?'Centre Pivot':'Lateral Move');
  $('imuLayout').innerHTML=s.imus.map(x=>'<div class="imu-card"><div class="imu-name">'+x[0]+'</div><div class="imu-crop">'+x[1]+'</div><div class="imu-area">'+x[2]+'</div></div>').join('');
  $('scenarioFacts').innerHTML=s.facts.map(x=>'<div class="scenario-fact"><b>'+x[0]+'</b><span>'+x[1]+'</span></div>').join('');
  $('benchmarkBox').textContent=s.benchmark||'';
  setMap(activeRegion);
}
function applyScenario(key){
  if(!SCENARIOS[key])return;let s=SCENARIOS[key];activeScenario=key;activeRegion=s.region;
  $('scenarioPreset').value=key;$('system').value=s.system;$('allocationMode').value=s.mode;
  $('allocation').value=s.alloc;$('trigger').value=s.tr;$('irrAmount').value=s.irr;
  $('rainThreshold').value=s.rain;$('probThreshold').value=s.prob;$('lookahead').value=s.look;
  run();
}
function P(){let s=SYS[$('system').value];return{s,mode:$('allocationMode').value,alloc:+$('allocation').value,tr:+$('trigger').value,irr:+$('irrAmount').value,rain:+$('rainThreshold').value,prob:+$('probThreshold').value,look:+$('lookahead').value,force:+$('trigger').value+20}}
function sig(day,p){let best=null;for(let k=0;k<p.look;k++){let w=W[day+k];if(!w)break;if(w.fc>=p.rain&&w.prob>=p.prob&&(!best||w.fc*w.prob>best.fc*best.prob))best={...w,ahead:k}}return best}
function sim(smart,p){let swd=36,last=-999,left=p.mode==='limited'?p.alloc:Infinity,net=0,eff=0,stress=0,arr=[],irr=[],logs=[];for(let i=0;i<N;i++){let w=W[i];swd+=w.etc;let need=swd>=p.tr,ready=i-last>=p.s.cycle,water=left>.01,sg=sig(i,p),decision='No irrigation',ap=0;if(need){if(!ready)decision=`Wait — ${p.s.code} cycle`;else if(!water)decision='No allocation left';else if(smart&&sg&&swd<p.force)decision='Delay for forecast rain';else{decision=smart&&sg&&swd>=p.force?'Irrigate — crop too dry to delay':'Irrigate';ap=Math.min(p.irr,p.s.hyd,left)}}if(ap>0){net+=ap;if(isFinite(left))left-=ap;swd=Math.max(0,swd-ap);last=i;irr.push({day:i,net:ap})}let er=Math.min(w.actual,Math.max(0,swd));eff+=er;swd=Math.max(0,swd-er);if(swd>75)stress+=(swd-75)/25;let row={day:i,swd:+swd.toFixed(1),appliedNet:+ap.toFixed(1),decision,sig:sg,window:need&&ready&&water};arr.push(row);if(ap>0||decision.startsWith('Delay')||decision==='No allocation left'||decision.startsWith('Irrigate —'))logs.push(row)}return{arr,irr,net:+net.toFixed(1),eff:+eff.toFixed(1),stress:+stress.toFixed(2),yield:+Math.max(75,120-stress*1.35).toFixed(1),left:isFinite(left)?+Math.max(0,left).toFixed(1):null,logs}}
function E(tag,a={},t=''){let e=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(a).forEach(([k,v])=>e.setAttribute(k,v));if(t)e.textContent=t;return e}function clear(s){while(s.firstChild)s.removeChild(s.firstChild)}function path(v,x,y){return v.map((z,i)=>(i?'L':'M')+x(i).toFixed(1)+','+y(z).toFixed(1)).join(' ')}
function dims(H,max,flip=false){let Wd=1100,L=48,R=18,T=24,B=42,pw=Wd-L-R,ph=H-T-B,x=i=>L+i*pw/(N-1),y=v=>flip?T+v/max*ph:T+ph-v/max*ph;return{W:Wd,H,L,R,T,B,pw,ph,x,y}}
function grid(svg,d,max,label){for(let g=0;g<=5;g++){let v=max*g/5,y=d.y(v);svg.append(E('line',{x1:d.L,y1:y,x2:d.W-d.R,y2:y,class:'gridline'}));svg.append(E('text',{x:d.L-8,y:y+3,'text-anchor':'end',class:'axistext'},Math.round(v)))}svg.append(E('text',{x:10,y:17,class:'axistext'},label));for(let i=0;i<N;i+=5)svg.append(E('text',{x:d.x(i),y:d.H-12,'text-anchor':'middle',class:'axistext'},date(i)))}
function rainChart(p){let s=$('rainChart');clear(s);let m=Math.max(50,...W.map(w=>Math.max(w.fc,w.actual)));let d=dims(300,m),bw=Math.max(3,d.pw/N*.5);grid(s,d,m,'mm');W.forEach((w,i)=>{let q=w.fc>=p.rain&&w.prob>=p.prob;s.append(E('rect',{x:d.x(i)-bw*.65,y:d.y(w.fc),width:bw*.58,height:d.y(0)-d.y(w.fc),rx:2,fill:'#a8cde7',opacity:.75,stroke:q?'#2f8f63':'none','stroke-width':q?2:0}));s.append(E('rect',{x:d.x(i),y:d.y(w.actual),width:bw*.58,height:d.y(0)-d.y(w.actual),rx:2,fill:'#3e83b7'}))});let y=d.y(p.rain);s.append(E('line',{x1:d.L,y1:y,x2:d.W-d.R,y2:y,stroke:'#2f8f63','stroke-dasharray':'4 5'}));s.append(E('text',{x:d.L+5,y:y-5,class:'axistext'},`rain threshold ${p.rain} mm`))}
function probChart(p){let s=$('probChart');clear(s),d=dims(250,100);grid(s,d,100,'%');s.append(E('path',{d:path(W.map(w=>w.prob),d.x,d.y),fill:'none',stroke:'#245f8c','stroke-width':2.5,'stroke-dasharray':'5 4'}));W.forEach((w,i)=>s.append(E('circle',{cx:d.x(i),cy:d.y(w.prob),r:2.6,fill:'#245f8c'})));let y=d.y(p.prob);s.append(E('line',{x1:d.L,y1:y,x2:d.W-d.R,y2:y,stroke:'#245f8c','stroke-dasharray':'2 5'}));s.append(E('text',{x:d.W-d.R-5,y:y-5,'text-anchor':'end',class:'axistext'},`threshold ${p.prob}%`))}
function irrChart(b,c,p){let s=$('irrigationChart');clear(s),m=Math.max(40,p.irr,...b.irr.map(x=>x.net),...c.irr.map(x=>x.net)),d=dims(250,m);grid(s,d,m,'mm');b.irr.forEach(e=>s.append(E('line',{x1:d.x(e.day)-2,y1:d.y(e.net),x2:d.x(e.day)-2,y2:d.y(0),stroke:'#b8a28b','stroke-width':4})));c.irr.forEach(e=>s.append(E('line',{x1:d.x(e.day)+2,y1:d.y(e.net),x2:d.x(e.day)+2,y2:d.y(0),stroke:'#d78636','stroke-width':5})));c.arr.forEach(r=>{if(r.decision.startsWith('Delay'))s.append(E('circle',{cx:d.x(r.day),cy:d.y(0)-7,r:5,fill:'#fff',stroke:'#2f8f63','stroke-width':2}))});s.append(E('text',{x:760,y:18,class:'axistext'},'grey = Baseline · orange = CLOVER · green ring = delayed'))}
function swdChart(b,c,p){let s=$('swdChart');clear(s),m=Math.max(110,p.force+20,...b.arr.map(r=>r.swd),...c.arr.map(r=>r.swd)),d=dims(300,m,true);grid(s,d,m,'SWD mm');let tr=d.y(p.tr),fo=d.y(p.force);s.append(E('line',{x1:d.L,y1:tr,x2:d.W-d.R,y2:tr,stroke:'#94a79d','stroke-dasharray':'6 5'}));s.append(E('line',{x1:d.L,y1:fo,x2:d.W-d.R,y2:fo,stroke:'#d7a28f','stroke-dasharray':'3 5'}));s.append(E('path',{d:path(b.arr.map(r=>r.swd),d.x,d.y),fill:'none',stroke:'#84958d','stroke-width':2}));s.append(E('path',{d:path(c.arr.map(r=>r.swd),d.x,d.y),fill:'none',stroke:'#2f8f63','stroke-width':3}));s.append(E('text',{x:760,y:18,class:'axistext'},'grey = Baseline · green = CLOVER'))}
function events(b,c){let days=[...new Set([...b.logs.map(r=>r.day),...c.logs.map(r=>r.day)])].sort((a,z)=>a-z);return days.map(day=>{let B=b.arr[day],C=c.arr[day],res='none';if(C.decision.startsWith('Delay'))res=C.sig&&(W[day+C.sig.ahead]?.actual||0)>=5?'rain':'miss';else if(C.appliedNet>0)res='irr';else if(C.decision==='No allocation left'||B.decision==='No allocation left')res='alloc';return{day,B,C,res}})}
function decisionChart(ev){let s=$('decisionChart');clear(s);$('decisionCount').textContent=`${ev.length} notable decision days`;let Wd=1100,L=105,R=20,T=30,B=42,pw=Wd-L-R,x=i=>L+i*pw/(N-1),ys=[85,155,235,315],labs=['Baseline','CLOVER','Forecast','Result'];labs.forEach((l,j)=>{s.append(E('text',{x:18,y:ys[j]+4,class:'axistext'},l));s.append(E('line',{x1:L,y1:ys[j],x2:Wd-R,y2:ys[j],stroke:'#edf2ef'}))});for(let i=0;i<N;i+=5)s.append(E('text',{x:x(i),y:418,'text-anchor':'middle',class:'axistext'},date(i)));ev.forEach(e=>{let xx=x(e.day);if(e.B.appliedNet>0)s.append(E('circle',{cx:xx,cy:ys[0],r:6,fill:'#b8a28b'}));else if(e.B.decision==='No allocation left')s.append(E('rect',{x:xx-5,y:ys[0]-5,width:10,height:10,fill:'#b85e57'}));if(e.C.decision.startsWith('Delay'))s.append(E('circle',{cx:xx,cy:ys[1],r:6,fill:'#fff',stroke:'#2f8f63','stroke-width':2.5}));else if(e.C.appliedNet>0)s.append(E('circle',{cx:xx,cy:ys[1],r:6,fill:'#d78636'}));else if(e.C.decision==='No allocation left')s.append(E('rect',{x:xx-5,y:ys[1]-5,width:10,height:10,fill:'#b85e57'}));s.append(E('rect',{x:xx-5,y:ys[2]-5,width:10,height:10,rx:2,fill:e.C.sig?'#2f8f63':'#dfe8e3'}));let col={rain:'#2f8f63',miss:'#3e83b7',irr:'#d78636',alloc:'#b85e57',none:'#9daea6'}[e.res];s.append(E('circle',{cx:xx,cy:ys[3],r:7,fill:col}))});s.append(E('text',{x:510,y:18,class:'axistext'},'grey = baseline irrigates · orange = CLOVER irrigates · green ring = delay · red = no allocation'))}
function ui(b,c,p,ev){let s=p.s;$('systemFacts').innerHTML=`<div class="fact"><b>${s.code}</b><span>System</span></div><div class="fact"><b>${s.energy}</b><span>Energy</span></div><div class="fact"><b>${s.imus}</b><span>IMUs</span></div><div class="fact"><b>${fmt(s.hyd,1)} mm</b><span>Hydraulic net</span></div><div class="fact"><b>${s.cycle} d</b><span>Min cycle</span></div>`;let lim=p.mode==='limited';$('pathwayPanel').classList.toggle('benchmark',!lim);$('pathwayEyebrow').textContent=lim?'Drought / limited-water pathway':'Non-limited benchmark pathway';$('pathwayTitle').textContent=lim?'Use forecast rainfall to make scarce irrigation water work harder':'Use forecast rainfall to substitute for irrigation where possible';$('pathwayText').textContent=lim?'Both strategies receive the same limited allocation. CLOVER combines SWD and forecast information to adjust timing and potentially preserve scarce irrigation for later demand.':'With non-limited water, CLOVER can use SWD and forecast information to avoid irrigation where rainfall can meet the need.';$('pathwayFlow').innerHTML=['SWD indicates need','Forecast checked','Delay if worthwhile',lim?'Preserve allocation':'Replace irrigation','Compare outcome'].map((x,i,a)=>`<span>${x}</span>${i<a.length-1?'<span class="arrow">→</span>':''}`).join('');let eff=c.eff-b.eff,st=b.stress-c.stress,yd=c.yield-b.yield,bu=lim?p.alloc-b.left:b.net,cu=lim?p.alloc-c.left:c.net,ch=ev.filter(e=>e.B.decision!==e.C.decision||e.B.appliedNet!==e.C.appliedNet).length;$('kpi1').textContent=(eff>=0?'+':'')+fmt(eff,1)+' mm';$('kpi1D').textContent=`${fmt(b.eff,1)} → ${fmt(c.eff,1)} mm`;$('kpi2').textContent=(st>=0?'+':'')+fmt(st,2);$('kpi2D').textContent=`stress ${fmt(b.stress,2)} → ${fmt(c.stress,2)}`;$('kpi3').textContent=(yd>=0?'+':'')+fmt(yd,1)+' t/ha';$('kpi3D').textContent=`${fmt(b.yield,1)} → ${fmt(c.yield,1)} t/ha`;$('kpi4').textContent=`${fmt(bu,0)} → ${fmt(cu,0)} mm`;$('kpi5').textContent=ch;$('kpi5D').textContent=`${ev.length} notable days`;let q=W.filter(w=>w.fc>=p.rain&&w.prob>=p.prob).length,inter=c.arr.filter(r=>r.window&&r.sig).length;$('signalCount').textContent=`${q} of ${N} forecast days meet ≥${p.rain} mm and ≥${p.prob}%`;$('decisionSensitivity').textContent=`${inter} qualifying forecasts intersect irrigation decision windows`}
function labels(){[['allocation','allocationV'],['trigger','triggerV'],['irrAmount','irrV'],['rainThreshold','rainV'],['probThreshold','probV'],['lookahead','lookV']].forEach(([a,b])=>$(b).textContent=$(a).value);$('allocationML').textContent=fmt(+$('allocation').value/100,2);$('allocationControl').style.display=$('allocationMode').value==='limited'?'':'none'}
function run(){labels();let p=P(),b=sim(false,p),c=sim(true,p),ev=events(b,c);scenarioUI(p);ui(b,c,p,ev);rainChart(p);probChart(p);irrChart(b,c,p);swdChart(b,c,p);decisionChart(ev)}
['system','allocationMode','allocation','trigger','irrAmount','rainThreshold','probThreshold','lookahead'].forEach(id=>$(id).addEventListener('input',()=>{$('scenarioPreset').value='custom';run()}));$('scenarioPreset').addEventListener('change',e=>{if(e.target.value==='custom')run();else applyScenario(e.target.value)});document.querySelectorAll('.region-tab').forEach(b=>b.addEventListener('click',()=>setMap(b.dataset.region)));$('randomBtn').onclick=()=>{seed=Math.floor(Math.random()*1e9);gen();run()};gen();applyScenario('tablelands_cp');
})();
