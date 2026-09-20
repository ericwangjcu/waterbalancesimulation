(()=>{
const $=id=>document.getElementById(id),N=45;
const REGIONS={
  tablelands:{title:'Atherton Tablelands',query:'Atherton Tablelands Queensland Australia',caption:'Workbook context: irrigation water is non-limiting for the majority of sugarcane farmers. Limited cases are mainly associated with irrigation infrastructure that cannot meet peak demand.'},
  mackay:{title:'Mackay / Eton',query:'Eton Queensland Australia',caption:'Workbook context: Mackay includes a significant rainfed component and limited-water situations; the notes cite about 3 ML/ha for Eton Irrigation Scheme and up to about 6 ML/ha around Proserpine/off-scheme sources.'},
  bundaberg:{title:'Bundaberg',query:'Bundaberg Queensland Australia',caption:'Workbook context: Steve notes that Bundaberg may be similar to the Tablelands, but this still needs confirmation.'},
  burdekin:{title:'Burdekin',query:'Burdekin Shire Queensland Australia',caption:'Workbook context: the notes treat Burdekin irrigation water as non-limiting.'}
};
const SCENARIOS={
  tablelands_cp:{
    label:'Tablelands — Centre Pivot',region:'tablelands',system:'Centre Pivot',code:'CP',energy:'Electric',pump:40,hours:24,
    totalArea:40.7150407905,areaEach:10.1787601976,net:32.3,hydraulicNet:32.2554,cycle:4,limited:false,
    imus:[['IMU 1','P'],['IMU 2','1R'],['IMU 3','2R'],['IMU 4','3R']],
    facts:[['40 L/s','Pump flow'],['40.7 ha','Total area'],['4','IMUs'],['10.18 ha','Area / IMU'],['32.3 mm','Net application'],['4 days','Minimum cycle']],
    note:'Workbook source: one CP is divided into four equal quarters; each quarter is an IMU. This page uses the CP Harvest Year 2 layout (P, 1R, 2R, 3R), so all four IMUs are active. IrrigWeb/APSIM determines SWD, trigger = 60 mm, and the management strategy says apply a maximum 40 mm per irrigation. The infrastructure calculation gives about 32.3 mm net for a 24 h run.'
  },
  mackay_cp:{
    label:'Mackay / Eton — CP IrrigWeb test',region:'mackay',system:'Centre Pivot',code:'CP',energy:'Electric',pump:40,hours:24,
    totalArea:40.7150407905,areaEach:10.1787601976,net:32.3,hydraulicNet:32.3,cycle:4,limited:false,paw:170,
    imus:[['CP1_B1','P'],['CP1_B2','1R'],['CP1_B3','2R'],['CP1_B4','3R']],
    facts:[['Eton Sunwater','Met site'],['170 mm','PAW'],['4','IMUs'],['10.18 ha','Area / IMU'],['32.3 mm','Net application'],['4 days','Minimum cycle']],
    note:'Workbook IrrigWeb test: Centre Pivot, irrigation allocation not limiting, Black Earth PAW 170 mm, rule CL_OH_4d_34mm, 34 mm typical gross application, 5% loss, 32.3 mm net and 4-day minimum cycle.'
  },
  tablelands_lm:{
    label:'Tablelands — Lateral Move',region:'tablelands',system:'Lateral Move',code:'LM',energy:'Diesel',pump:50,hours:24,
    totalArea:47.52,areaEach:7.92,net:40,hydraulicNet:51.8181818,cycle:6,limited:false,
    imus:[['IMU 1','F'],['IMU 2','P'],['IMU 3','1R'],['IMU 4','2R'],['IMU 5','3R'],['IMU 6','4R']],
    facts:[['50 L/s','Pump flow'],['47.52 ha','Total area'],['6','IMUs'],['7.92 ha','Area / IMU'],['51.8 mm','Hydraulic net'],['6 days','Minimum cycle']],
    note:'Workbook source: 6 IMUs, 50 L/s pump, 24 h irrigation, diesel energy and IrrigWeb scheduling. The hydraulic calculation gives about 51.8 mm net, while Steve’s irrigation strategy says apply a maximum 40 mm per irrigation; this demo uses the 40 mm management cap.'
  },
  mackay_traveller:{
    label:'Mackay — Overhead Traveller',region:'mackay',system:'Overhead Traveller',code:'TR',energy:'Not specified',pump:30,hours:13,
    totalArea:33.0016104,areaEach:3.0001464,net:30.4185156,hydraulicNet:30.4185156,cycle:11,limited:true,annualAllocation:2.807862976,
    imus:[['IMU 1','F'],['IMU 2','F'],['IMU 3','P'],['IMU 4','P'],['IMU 5','1R'],['IMU 6','1R'],['IMU 7','2R'],['IMU 8','2R'],['IMU 9','3R'],['IMU 10','3R'],['IMU 11','4R']],
    facts:[['30 L/s','Pump flow'],['33.0 ha','Total area'],['11','IMUs'],['3.00 ha','Area / IMU'],['30.4 mm','Net application'],['11 days','Minimum cycle']],
    note:'Workbook farm setup: manual overhead traveller, 13 h per irrigation, fixed cycle, night-time irrigation, 11 IMUs and about 2.81 ML/ha allocation in the farm-setup calculation. The 11 crop classes shown here follow Steve’s Overhead Traveller Harvest Year 1 layout.'
  },
  bundaberg_traveller:{
    label:'Bundaberg — Overhead Traveller',region:'bundaberg',system:'Overhead Traveller',code:'TR',energy:'Not specified',pump:30,hours:13,
    totalArea:33.0016104,areaEach:3.0001464,net:30.4185156,hydraulicNet:30.4185156,cycle:11,limited:false,annualAllocation:4.679771627,
    imus:[['IMU 1','F'],['IMU 2','F'],['IMU 3','P'],['IMU 4','P'],['IMU 5','1R'],['IMU 6','1R'],['IMU 7','2R'],['IMU 8','2R'],['IMU 9','3R'],['IMU 10','3R'],['IMU 11','4R']],
    facts:[['30 L/s','Pump flow'],['33.0 ha','Total area'],['11','IMUs'],['3.00 ha','Area / IMU'],['30.4 mm','Net application'],['11 days','Minimum cycle']],
    note:'Workbook farm setup: manual overhead traveller, fixed cycle and night-time irrigation. Steve notes separately that Bundaberg water availability still needs confirmation, so the web demo does not treat its water-limit status as validated.'
  },
  furrow_7:{
    label:'Burdekin/Tablelands — Furrow (7 IMUs)',region:'burdekin',system:'Furrow',code:'FR',energy:'Not specified',pump:55,hours:24,
    totalArea:30.00375,areaEach:4.28625,net:110.8661417,hydraulicNet:110.8661417,cycle:1,limited:false,cycleAssumption:true,
    imus:[['IMU 1','P'],['IMU 2','P'],['IMU 3','1R'],['IMU 4','2R'],['IMU 5','3R'],['IMU 6','4R'],['IMU 7','F']],
    facts:[['55 L/s','Pump flow'],['30.00 ha','Total area'],['7','IMUs'],['4.29 ha','Area / IMU'],['110.9 mm','Net application'],['Not set','Minimum cycle']],
    note:'Workbook farm setup: 7 IMUs, 55 L/s pump, 24 h irrigation and fixed-cycle management. The workbook does not specify a minimum cycle time for furrow; the synthetic engine therefore allows irrigation whenever an IMU is due. That timing rule is a simulation assumption, not a workbook value.'
  },
  furrow_9:{
    label:'Burdekin/Tablelands — Furrow (9 IMUs)',region:'burdekin',system:'Furrow',code:'FR',energy:'Not specified',pump:55,hours:24,
    totalArea:38.57625,areaEach:4.28625,net:110.8661417,hydraulicNet:110.8661417,cycle:1,limited:false,cycleAssumption:true,
    imus:[['IMU 1','F'],['IMU 2','F'],['IMU 3','P'],['IMU 4','1R'],['IMU 5','1R'],['IMU 6','2R'],['IMU 7','3R'],['IMU 8','3R'],['IMU 9','4R']],
    facts:[['55 L/s','Pump flow'],['38.58 ha','Total area'],['9','IMUs'],['4.29 ha','Area / IMU'],['110.9 mm','Net application'],['Not set','Minimum cycle']],
    note:'Workbook farm setup: 9 IMUs, 55 L/s pump, 24 h irrigation and fixed-cycle management. The workbook does not specify a minimum cycle time for furrow; the synthetic engine therefore allows irrigation whenever an IMU is due. That timing rule is a simulation assumption, not a workbook value.'
  }
};
const CROP={
  F:{factor:.35,start:20,priority:0,label:'Fallow'},
  P:{factor:1.08,start:49,priority:6,label:'Plant'},
  '1R':{factor:1.03,start:55,priority:5,label:'1R'},
  '2R':{factor:.98,start:58,priority:4,label:'2R'},
  '3R':{factor:.92,start:53,priority:3,label:'3R'},
  '4R':{factor:.86,start:50,priority:2,label:'4R'}
};
let state={level:1,scenario:'tablelands_cp',valuePath:'nonlimited',seed:1056,weather:[],priority:'swd',allocation:120,selectedImu:0,workflowStep:1,showAll:false};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fmt=(v,d=1)=>Number(v).toFixed(d);
const date=i=>new Date(2026,8,7+i).toLocaleDateString('en-AU',{day:'2-digit',month:'short'});
function rng(a){return()=>{let t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function gauss(r){let u=0,v=0;while(!u)u=r();while(!v)v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
function genWeather(){
  const r=rng(state.seed);state.weather=[];
  for(let i=0;i<N;i++){
    const wet=r()<clamp(.16+.11*Math.sin((i+4)/5.5),.05,.30);
    const actual=wet?Math.max(0,5+r()*28+gauss(r)*4):(r()<.08?r()*4:0);
    const fc=Math.max(0,actual*(.62+r()*.78)+gauss(r)*4.8);
    let prob=actual>5?50+r()*45:12+r()*54;
    if(r()<.1)prob=66+r()*28;if(actual>15&&r()<.1)prob=30+r()*30;
    const etc=clamp(5.3+Math.sin(i/6)+gauss(r)*.65,3.5,7.2);
    state.weather.push({day:i,actual:+actual.toFixed(1),fc:+fc.toFixed(1),prob:Math.round(clamp(prob,5,95)),etc:+etc.toFixed(1)});
  }
}
function controls(){
  return{tr:+$('trigger').value,rain:+$('rainThreshold').value,prob:+$('probThreshold').value,look:+$('lookahead').value,force:+$('trigger').value+20,alloc:+$('allocation').value};
}
function forecastSignal(day,p){
  let best=null;
  for(let k=0;k<p.look;k++){
    const w=state.weather[day+k];if(!w)break;
    if(w.fc>=p.rain&&w.prob>=p.prob){
      if(!best||w.fc*w.prob>best.fc*best.prob)best={...w,ahead:k};
    }
  }
  return best;
}
function prioritySort(a,b,rule){
  if(rule==='fixed')return a.idx-b.idx;
  if(rule==='crop')return (CROP[b.crop]?.priority||0)-(CROP[a.crop]?.priority||0)||b.swd-a.swd;
  if(rule==='stress')return b.stress-a.stress||b.swd-a.swd;
  return b.swd-a.swd;
}
function chooseCandidate(candidates,rule,nextIdx,count){
  if(!candidates.length)return null;
  if(rule==='fixed'){
    return [...candidates].sort((a,b)=>{
      const da=(a.idx-nextIdx+count)%count,db=(b.idx-nextIdx+count)%count;
      return da-db;
    })[0];
  }
  return [...candidates].sort((a,b)=>prioritySort(a,b,rule))[0];
}
function runStrategy(smart,scenario,p,rule='fixed'){
  const imus=scenario.imus.map((x,idx)=>({
    name:x[0],crop:x[1],area:scenario.areaEach,idx,
    swd:clamp((CROP[x[1]]?.start||45)+(idx%3-1)*3,5,100),last:-999,
    left:scenario.limited?p.alloc:Infinity,irrig:0,effRain:0,stress:0,delays:0,capacityWaits:0,history:[],irrigHistory:[],logs:[]
  }));
  const dailyIrr=[],avgSwd=[];let nextIdx=0;
  for(let day=0;day<N;day++){
    const w=state.weather[day],signal=forecastSignal(day,p),candidates=[];
    imus.forEach(u=>u.irrigHistory.push(0));
    imus.forEach(u=>{
      const cf=CROP[u.crop]||CROP.P;
      u.swd=clamp(u.swd+w.etc*cf.factor,0,160);
      if(u.crop==='F'){
        u.history.push(null);return;
      }
      const need=u.swd>=p.tr,ready=(day-u.last)>=scenario.cycle,water=u.left>.01;
      if(need&&ready&&water){
        if(smart&&signal&&u.swd<p.force){
          u.delays++;u.logs.push({day,type:'delay',text:`${u.name} delayed: forecast ${signal.fc} mm at ${signal.prob}% in +${signal.ahead} d; SWD ${fmt(u.swd,0)} mm.`});
        }else{
          candidates.push({u,idx:u.idx,crop:u.crop,swd:u.swd,stress:u.stress,signal});
        }
      }
    });
    const chosenCandidate=chooseCandidate(candidates,rule,nextIdx,imus.length);
    const selected=chosenCandidate?[chosenCandidate]:[];
    const chosen=chosenCandidate?.u;
    if(chosen)nextIdx=(chosen.idx+1)%imus.length;
    if(candidates.length>1){
      const ruleText=rule==='fixed'?'fixed rotating sequence':rule==='crop'?'crop-stage priority':rule==='stress'?'highest crop stress':'highest SWD';
      candidates.forEach(x=>{
        if(x.u!==chosen){
          x.u.capacityWaits++;
          x.u.logs.push({day,type:'capacity',text:`${x.u.name} was due but waited for the shared pump; ${ruleText} selected ${chosen?.name||'another IMU'}.`});
        }
      });
    }
    let dayML=0;
    selected.forEach(x=>{
      const u=x.u;
      const app=Math.min(scenario.net,u.left);
      if(app>0){
        u.irrig+=app;u.irrigHistory[day]=app;u.swd=Math.max(0,u.swd-app);u.last=day;if(isFinite(u.left))u.left-=app;
        dayML+=app*u.area*.01;
        u.logs.push({day,type:'irr',text:`${u.name} irrigated ${fmt(app,1)} mm at SWD ${fmt(x.swd,0)} mm.`});
      }
    });
    imus.forEach(u=>{
      const room=Math.max(0,u.swd),er=Math.min(w.actual,room);
      u.effRain+=er*u.area*.01;u.swd=Math.max(0,u.swd-er);
      if(u.crop!=='F'&&u.swd>75)u.stress+=(u.swd-75)/25;
      if(u.crop!=='F')u.history.push(+u.swd.toFixed(1));
    });
    const active=imus.filter(u=>u.crop!=='F');
    avgSwd.push(active.length?active.reduce((s,u)=>s+u.swd,0)/active.length:0);
    dailyIrr.push(dayML);
  }
  return{
    imus,dailyIrr,avgSwd,
    totalML:dailyIrr.reduce((a,b)=>a+b,0),
    effRainML:imus.reduce((a,u)=>a+u.effRain,0),
    stress:imus.reduce((a,u)=>a+u.stress,0),
    delays:imus.reduce((a,u)=>a+u.delays,0),
    capacityWaits:imus.reduce((a,u)=>a+u.capacityWaits,0),
    logs:imus.flatMap(u=>u.logs.map(x=>({...x,imu:u.name}))).sort((a,b)=>a.day-b.day)
  };
}

function initialSwdFor(crop,idx){return clamp((CROP[crop]?.start||45)+(idx%3-1)*3,5,100)}
function planRawDemand(smart,scenario,p,horizon){
  const imus=scenario.imus.map((x,idx)=>({name:x[0],crop:x[1],idx,swd:initialSwdFor(x[1],idx),last:-999,left:scenario.limited?p.alloc:Infinity}));
  const daily=[],delays=[];
  for(let day=0;day<horizon;day++){
    const w=state.weather[day],signal=forecastSignal(day,p),events=[];
    imus.forEach(u=>{
      const cf=CROP[u.crop]||CROP.P;u.swd=clamp(u.swd+w.etc*cf.factor,0,160);
      if(u.crop==='F')return;
      const need=u.swd>=p.tr,ready=(day-u.last)>=scenario.cycle,water=u.left>.01;
      if(need&&ready&&water){
        if(smart&&signal&&u.swd<p.force)delays.push({day,name:u.name,crop:u.crop,swd:u.swd,signal});
        else{
          const app=Math.min(scenario.net,u.left);
          events.push({day,name:u.name,crop:u.crop,idx:u.idx,swd:u.swd,amount:app});
          u.swd=Math.max(0,u.swd-app);u.last=day;if(isFinite(u.left))u.left-=app;
        }
      }
    });
    imus.forEach(u=>{u.swd=Math.max(0,u.swd-Math.min(w.actual,Math.max(0,u.swd)))});
    daily.push(events);
  }
  return{daily,delays,imus};
}
function conflictsFrom(plan){return plan.daily.map((events,day)=>({day,events})).filter(x=>x.events.length>1)}
function finalSchedule(strategy,horizon){
  const daily=Array.from({length:horizon},()=>[]);
  strategy.imus.forEach(u=>{for(let day=0;day<horizon;day++){const amount=u.irrigHistory[day]||0;if(amount>0)daily[day].push({name:u.name,crop:u.crop,amount})}});
  return daily;
}
function pills(items,cls){return items.map(x=>'<span class="event-pill '+(cls||'')+'">'+x+'</span>').join('')}
function scheduleTable(daily,emptyText){
  const rows=daily.map((events,day)=>{
    if(!events.length)return '';
    return '<tr><td>'+date(day)+'</td><td>'+events.map(e=>'<b>'+e.name+'</b> ('+e.crop+')').join(', ')+'</td><td>'+events.map(e=>fmt(e.amount,1)+' mm').join(', ')+'</td></tr>';
  }).filter(Boolean).join('');
  return rows?'<div class="scroll"><table class="step-table"><thead><tr><th>Date</th><th>IMU(s)</th><th>Required / applied</th></tr></thead><tbody>'+rows+'</tbody></table></div>':'<div class="empty-step">'+emptyText+'</div>';
}
function renderConflictList(conflicts){
  if(!conflicts.length)return '<div class="good-step">No shared-pump conflicts in this planning window.</div>';
  return '<div class="conflict-list">'+conflicts.map(x=>'<div class="conflict-row"><b>'+date(x.day)+'</b><span>'+pills(x.events.map(e=>e.name+' · '+e.crop),'conflict')+'</span><small>'+x.events.length+' IMUs want the shared system on the same day</small></div>').join('')+'</div>';
}
function renderShiftList(strategy,horizon,ruleLabel){
  const days=[];
  for(let day=0;day<horizon;day++){
    const waits=strategy.logs.filter(x=>x.day===day&&x.type==='capacity');if(!waits.length)continue;
    const irr=strategy.logs.filter(x=>x.day===day&&x.type==='irr');days.push({day,waits,irr});
  }
  if(!days.length)return '<div class="good-step">No conflict shift was needed in this planning window.</div>';
  return '<div class="shift-list">'+days.map(x=>'<div class="shift-row"><div class="shift-date">'+date(x.day)+'</div><div><span class="shift-label">Shared pump →</span> '+pills(x.irr.map(y=>y.imu),'selected')+'</div><div><span class="shift-label">Wait →</span> '+pills(x.waits.map(y=>y.imu),'waiting')+'</div><small>'+ruleLabel+'</small></div>').join('')+'</div>';
}
function renderCurrentSwd(s,p){
  $('step1Swds').innerHTML=s.imus.map((x,idx)=>{
    const swd=initialSwdFor(x[1],idx),scale=Math.max(100,p.tr+30),pct=clamp(swd/scale*100,0,100),due=x[1]!=='F'&&swd>=p.tr;
    return '<div class="start-swd-card '+(due?'due':'')+'"><div><b>'+x[0]+'</b><span>'+x[1]+' · '+fmt(s.areaEach,2)+' ha</span></div><strong>'+fmt(swd,0)+' mm</strong><small>'+(x[1]==='F'?'Fallow':due?'At/above trigger':'Below '+p.tr+' mm trigger')+'</small><div class="start-swd-bar"><i style="width:'+pct+'%"></i><em style="left:'+clamp(p.tr/scale*100,0,100)+'%"></em></div></div>';
  }).join('');
}
function renderForecastTable(horizon){
  $('step7Forecast').innerHTML='<div class="scroll"><table class="step-table forecast-table"><thead><tr><th>Date</th><th>Forecast rain</th><th>Probability</th><th>Visual</th></tr></thead><tbody>'+state.weather.slice(0,horizon).map(w=>'<tr><td>'+date(w.day)+'</td><td><b>'+w.fc+' mm</b></td><td>'+w.prob+'%</td><td><div class="forecast-meter"><i style="width:'+clamp(w.fc/40*100,0,100)+'%"></i><em style="width:'+w.prob+'%"></em></div></td></tr>').join('')+'</tbody></table></div>';
}
function renderWorkflow(s,p,b,c,rawB,rawC){
  const horizon=+$('planningHorizon').value;
  $('horizonV').textContent=horizon;$('horizonText').textContent=horizon;document.querySelectorAll('.horizon-inline').forEach(x=>x.textContent=horizon);
  renderCurrentSwd(s,p);
  $('step2Settings').innerHTML='<div class="setting-summary"><div><span>Shared irrigation system</span><b>1 × '+s.system+'</b></div><div><span>Pump flow</span><b>'+s.pump+' L/s</b></div><div><span>Application per irrigation</span><b>'+fmt(s.net,1)+' mm</b></div><div><span>Minimum revisit / cycle</span><b>'+(s.cycleAssumption?'assumed ':'')+s.cycle+' day'+(s.cycle===1?'':'s')+'</b></div><div><span>IMUs sharing system</span><b>'+s.imus.length+'</b></div><div><span>Decision rule before forecast</span><b>SWD ≥ '+p.tr+' mm</b></div></div>';
  $('step3BaselineDemand').innerHTML=scheduleTable(rawB.daily,'No IMU reaches the irrigation trigger in this planning window.');
  $('step4BaselineConflicts').innerHTML=renderConflictList(conflictsFrom(rawB));
  $('step5BaselineShift').innerHTML=renderShiftList(b,horizon,'Fixed rotating sequence: one IMU gets the shared system; other due IMUs wait.');
  $('step6BaselineFinal').innerHTML=scheduleTable(finalSchedule(b,horizon),'No Baseline irrigation occurs in this planning window.');
  renderForecastTable(horizon);
  const q=state.weather.slice(0,horizon).filter(w=>w.fc>=p.rain&&w.prob>=p.prob);
  $('step8ForecastRule').innerHTML='<div class="forecast-rule-box"><div class="rule-line"><span>Qualifying forecast</span><b>rain ≥ '+p.rain+' mm AND probability ≥ '+p.prob+'%</b></div><div class="rule-line"><span>Look-ahead</span><b>'+p.look+' day'+(p.look===1?'':'s')+'</b></div><div class="rule-line"><span>Forced irrigation</span><b>SWD ≥ '+p.force+' mm</b></div><div class="rule-result"><b>'+q.length+'</b> of the next '+horizon+' forecast days meet the amount + probability thresholds.</div></div>';
  const forecastSched=scheduleTable(rawC.daily,'No irrigation remains after forecast-based delays in this planning window.');
  const delayHtml=rawC.delays.length?'<div class="delay-summary"><b>Forecast delays before pump allocation</b>'+rawC.delays.map(x=>'<div><span>'+date(x.day)+' · '+x.name+'</span><small>SWD '+fmt(x.swd,0)+' mm → wait for '+x.signal.fc+' mm forecast at '+x.signal.prob+'% (+'+x.signal.ahead+' d)</small></div>').join('')+'</div>':'<div class="good-step">No raw irrigation requirement was delayed by the current forecast rule.</div>';
  $('step9ForecastDemand').innerHTML=forecastSched+delayHtml;
  $('step10ForecastConflicts').innerHTML=renderConflictList(conflictsFrom(rawC));
  const ruleLabel=state.level===5?(state.priority==='fixed'?'Fixed rotating sequence':state.priority==='crop'?'Crop-stage priority':state.priority==='stress'?'Highest crop-stress priority':'Highest-SWD priority'):'Fixed rotating sequence';
  $('step11ForecastShift').innerHTML=renderShiftList(c,horizon,ruleLabel);
  $('step12ForecastFinal').innerHTML=scheduleTable(finalSchedule(c,horizon),'No CLOVER irrigation occurs in this planning window.');
  updateWorkflowVisibility();
}
function updateWorkflowVisibility(){
  document.querySelectorAll('.workflow-step').forEach(el=>el.classList.toggle('active',state.showAll||+el.dataset.workflowStep===state.workflowStep));
  document.querySelectorAll('.workflow-dot').forEach(el=>el.classList.toggle('active',+el.dataset.step===state.workflowStep));
  $('workflowPosition').textContent=state.showAll?'All 14 steps':'Step '+state.workflowStep+' of 14';
  $('prevStepBtn').disabled=!state.showAll&&state.workflowStep===1;$('nextStepBtn').disabled=!state.showAll&&state.workflowStep===14;
  $('showAllStepsBtn').textContent=state.showAll?'Show one step':'Show all steps';
}
function setWorkflowStep(step){
  state.showAll=false;state.workflowStep=clamp(step,1,14);updateWorkflowVisibility();
  const target=document.querySelector('.workflow-step.active');if(target)target.scrollIntoView({behavior:'smooth',block:'start'});
}

function selectedScenario(){return SCENARIOS[state.scenario]}
function applyLevel(level){
  state.level=level;state.workflowStep=1;state.showAll=false;state.selectedImu=0;
  document.querySelectorAll('.level-tab').forEach(b=>b.classList.toggle('active',+b.dataset.level===level));
  document.querySelectorAll('.level-page').forEach(p=>p.classList.toggle('active',+p.dataset.page===level));
  if(level===1)state.scenario='tablelands_cp';
  if(level===2)state.scenario='mackay_cp';
  if(level===3)state.scenario=state.valuePath==='limited'?'mackay_traveller':'tablelands_cp';
  if(level===4&&!['tablelands_cp','tablelands_lm','mackay_traveller','bundaberg_traveller','furrow_7','furrow_9'].includes(state.scenario))state.scenario='tablelands_cp';
  if(level===5)state.scenario='mackay_traveller';
  render();
}
function setMap(regionKey){
  const r=REGIONS[regionKey],q=encodeURIComponent(r.query);
  $('mapRegionTitle').textContent=r.title;$('mapCaption').textContent=r.caption;
  $('farmMap').src='https://www.google.com/maps?q='+q+'&output=embed';
  $('mapLink').href='https://www.google.com/maps/search/?api=1&query='+q;
}
function renderScenarioInfo(s){
  $('scenarioName').textContent=s.label;
  const levelText={
    1:'Controlled forecast ON/OFF demonstration using Steve’s 4-IMU Centre Pivot structure with one shared pump/system and a fixed rotating IMU sequence.',
    2:'Synthetic exploration using the same 4-IMU structure as the workbook IrrigWeb example, with shared pump capacity respected.',
    3:state.valuePath==='limited'?'Limited-water demonstration with one shared irrigation system: watch stress, pump waiting and remaining irrigation as well as water saved.':'Non-limited demonstration with one shared irrigation system: watch whether forecast rain substitutes for irrigation.',
    4:'Farm-scenario comparison: each workbook setup uses one shared pump/system and a simple fixed rotating sequence.',
    5:'Full farm demonstration: Baseline keeps the fixed pump sequence; CLOVER can use the selected IMU priority rule after the forecast decision.'
  }[state.level];
  $('scenarioSummary').textContent=levelText;
  $('scenarioFacts').innerHTML=s.facts.map(x=>`<div class="fact"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('');
  $('scenarioNote').textContent=s.note;
  $('sourceLabel').textContent='Farm Scenarios workbook';
  setMap(s.region);
  $('headerBadge').textContent=`Level ${state.level} · ${s.label}`;
  $('allocationControl').style.display=s.limited?'block':'none';
}
function renderIMUs(s,b,c,p){
  $('imuGrid').innerHTML=c.imus.map((u,i)=>{
    const bu=b.imus[i],pct=clamp(u.swd/120*100,0,100),fall=u.crop==='F';
    const status=fall?'Fallow — not irrigated':u.swd>=p.tr?'Dry / irrigation pressure':'Below trigger';
    return `<div class="imu ${fall?'fallow':''}">
      <div class="top"><div><div class="imu-name">${u.name}</div><div class="imu-area">${fmt(u.area,2)} ha</div></div><div class="crop-badge">${u.crop}</div></div>
      <div class="imu-swd">${fmt(u.swd,0)} <span>mm final SWD</span></div>
      <div class="imu-status">${status} · B ${fmt(bu.irrig,0)} / C ${fmt(u.irrig,0)} mm irrig.</div>
      <div class="imu-bar"><i style="width:${pct}%"></i></div>
    </div>`;
  }).join('');
}
function safeLinePath(arr,x,y){
  let d='',drawing=false;
  arr.forEach((v,i)=>{
    if(v===null||v===undefined||Number.isNaN(v)){drawing=false;return;}
    d+=(drawing?'L':'M')+x(i).toFixed(1)+','+y(v).toFixed(1)+' ';drawing=true;
  });
  return d.trim();
}
function imuSwdChart(bu,cu,p){
  const svg=$('imuSwdChart');clear(svg);
  const vals=[...bu.history,...cu.history].filter(v=>v!==null&&v!==undefined);
  if(!vals.length){
    svg.append(E('text',{x:550,y:120,'text-anchor':'middle',class:'axistext'},'Fallow — no SWD irrigation trace in this setup'));
    return;
  }
  const max=Math.max(100,p.force+20,...vals),d=dims(265,max,true);grid(svg,d,max,'SWD mm');
  const tr=d.y(p.tr);
  svg.append(E('line',{x1:d.L,y1:tr,x2:d.W-d.R,y2:tr,stroke:'#8da197','stroke-dasharray':'5 5'}));
  svg.append(E('path',{d:safeLinePath(bu.history,d.x,d.y),fill:'none',stroke:'#85958e','stroke-width':2.2}));
  svg.append(E('path',{d:safeLinePath(cu.history,d.x,d.y),fill:'none',stroke:'#2f8f63','stroke-width':3}));
  svg.append(E('text',{x:730,y:16,class:'axistext'},'grey = Baseline · green = CLOVER · dashed = trigger'));
}
function imuIrrigationChart(bu,cu){
  const svg=$('imuIrrigationChart');clear(svg);
  const max=Math.max(1,...bu.irrigHistory,...cu.irrigHistory)*1.18,d=dims(245,max),bw=Math.max(3,d.pw/N*.32);grid(svg,d,max,'mm');
  bu.irrigHistory.forEach((v,i)=>{if(v>0)svg.append(E('rect',{x:d.x(i)-bw,y:d.y(v),width:bw*.9,height:d.y(0)-d.y(v),fill:'#a6b2ac'}))});
  cu.irrigHistory.forEach((v,i)=>{if(v>0)svg.append(E('rect',{x:d.x(i)+1,y:d.y(v),width:bw*.9,height:d.y(0)-d.y(v),fill:'#d78636'}))});
  svg.append(E('text',{x:730,y:16,class:'axistext'},'grey = Baseline · orange = CLOVER'));
}
function renderIMUDetail(s,b,c,p){
  if(state.selectedImu>=c.imus.length)state.selectedImu=0;
  const idx=state.selectedImu,bu=b.imus[idx],cu=c.imus[idx];
  $('imuTabs').innerHTML=c.imus.map((u,i)=>`<button type="button" class="imu-tab ${i===idx?'active':''}" data-imu="${i}">${u.name}<span>${u.crop}</span></button>`).join('');
  document.querySelectorAll('.imu-tab').forEach(btn=>btn.addEventListener('click',()=>{state.selectedImu=+btn.dataset.imu;render()}));
  $('imuDetailTitle').textContent=`${cu.name} · ${cu.crop}`;
  $('imuDetailMeta').textContent=`${fmt(cu.area,2)} ha · shared ${s.system} · ${s.net.toFixed(1)} mm application`;
  $('imuDetailStats').innerHTML=`
    <div><span>Baseline irrigation</span><b>${fmt(bu.irrig,1)} mm</b></div>
    <div><span>CLOVER irrigation</span><b>${fmt(cu.irrig,1)} mm</b></div>
    <div><span>Forecast delays</span><b>${cu.delays}</b></div>
    <div><span>Pump waits</span><b>${cu.capacityWaits}</b></div>
  `;
  imuSwdChart(bu,cu,p);imuIrrigationChart(bu,cu);
}
function renderKPIs(s,b,c){
  const saved=b.totalML-c.totalML,eff=c.effRainML-b.effRainML,stress=b.stress-c.stress;
  const cards=[
    ['Irrigation saving',`${saved>=0?'+':''}${fmt(saved,1)} ML`,`B ${fmt(b.totalML,1)} → C ${fmt(c.totalML,1)} ML`],
    ['Effective rain gain',`${eff>=0?'+':''}${fmt(eff,1)} ML`,`farm total`],
    ['Stress reduction',`${stress>=0?'+':''}${fmt(stress,1)}`,`synthetic stress index`],
    ['Forecast delays',String(c.delays),`CLOVER decisions`],
    ['Shared-pump waits',String(c.capacityWaits),state.level===5?'CLOVER priority / capacity conflicts':'fixed-sequence capacity conflicts']
  ];
  $('kpis').innerHTML=cards.map(x=>`<div class="kpi"><span>${x[0]}</span><b>${x[1]}</b><small>${x[2]}</small></div>`).join('');
}
function renderResultTable(b,c){
  $('resultBody').innerHTML=c.imus.map((u,i)=>{
    const bu=b.imus[i],saved=bu.irrig-u.irrig;
    return `<tr><td>${u.name}</td><td>${u.crop}</td><td>${fmt(u.area,2)} ha</td><td>${fmt(bu.irrig,1)} mm</td><td>${fmt(u.irrig,1)} mm</td><td>${fmt(saved,1)} mm</td><td>${u.delays}</td><td>${u.capacityWaits}</td><td>${fmt(bu.swd,0)} / ${fmt(u.swd,0)} mm</td></tr>`;
  }).join('');
}
function renderDecisionList(c){
  const logs=[...c.logs].reverse().slice(0,18);
  $('decisionCount').textContent=`${c.logs.length} logged decisions`;
  $('decisionList').innerHTML=logs.length?logs.map(x=>`<div class="decision ${x.type}"><b>${date(x.day)} · ${x.imu}</b><span>${x.text}</span></div>`).join(''):'<div class="assumption-note">No irrigation or forecast-delay decisions occurred in this synthetic weather run.</div>';
}
function E(tag,a={},t=''){const e=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(a).forEach(([k,v])=>e.setAttribute(k,v));if(t)e.textContent=t;return e}
function clear(svg){while(svg.firstChild)svg.removeChild(svg.firstChild)}
function dims(H,max,flip=false){const W=1100,L=52,R=18,T=24,B=38,pw=W-L-R,ph=H-T-B;return{W,H,L,R,T,B,pw,ph,x:i=>L+i*pw/(N-1),y:v=>flip?T+v/max*ph:T+ph-v/max*ph}}
function grid(svg,d,max,label){
  for(let g=0;g<=4;g++){const v=max*g/4,y=d.y(v);svg.append(E('line',{x1:d.L,y1:y,x2:d.W-d.R,y2:y,class:'gridline'}));svg.append(E('text',{x:d.L-7,y:y+3,'text-anchor':'end',class:'axistext'},Math.round(v)))}
  svg.append(E('text',{x:8,y:16,class:'axistext'},label));
  for(let i=0;i<N;i+=7)svg.append(E('text',{x:d.x(i),y:d.H-10,'text-anchor':'middle',class:'axistext'},date(i)));
}
function linePath(arr,x,y){return arr.map((v,i)=>(i?'L':'M')+x(i).toFixed(1)+','+y(v).toFixed(1)).join(' ')}
function rainChart(p){
  const s=$('rainChart');clear(s);const max=Math.max(45,...state.weather.map(w=>Math.max(w.actual,w.fc))),d=dims(285,max),bw=Math.max(3,d.pw/N*.48);grid(s,d,max,'mm');
  state.weather.forEach((w,i)=>{const q=w.fc>=p.rain&&w.prob>=p.prob;s.append(E('rect',{x:d.x(i)-bw*.7,y:d.y(w.fc),width:bw*.58,height:d.y(0)-d.y(w.fc),fill:'#a8cde7',opacity:.8,stroke:q?'#2f8f63':'none','stroke-width':q?2:0,rx:2}));s.append(E('rect',{x:d.x(i),y:d.y(w.actual),width:bw*.58,height:d.y(0)-d.y(w.actual),fill:'#3e83b7',rx:2}))});
  const y=d.y(p.rain);s.append(E('line',{x1:d.L,y1:y,x2:d.W-d.R,y2:y,stroke:'#2f8f63','stroke-dasharray':'4 5'}));
}
function irrigationChart(b,c){
  const s=$('irrigationChart');clear(s);const max=Math.max(1,...b.dailyIrr,...c.dailyIrr)*1.15,d=dims(260,max),bw=Math.max(3,d.pw/N*.32);grid(s,d,max,'ML/day');
  b.dailyIrr.forEach((v,i)=>{if(v>0)s.append(E('rect',{x:d.x(i)-bw,y:d.y(v),width:bw*.9,height:d.y(0)-d.y(v),fill:'#a6b2ac'}))});
  c.dailyIrr.forEach((v,i)=>{if(v>0)s.append(E('rect',{x:d.x(i)+1,y:d.y(v),width:bw*.9,height:d.y(0)-d.y(v),fill:'#d78636'}))});
  s.append(E('text',{x:760,y:16,class:'axistext'},'grey = Baseline · orange = CLOVER'));
}
function swdChart(b,c,p){
  const s=$('swdChart');clear(s);const max=Math.max(110,p.force+20,...b.avgSwd,...c.avgSwd),d=dims(285,max,true);grid(s,d,max,'SWD mm');
  const tr=d.y(p.tr);s.append(E('line',{x1:d.L,y1:tr,x2:d.W-d.R,y2:tr,stroke:'#8da197','stroke-dasharray':'5 5'}));
  s.append(E('path',{d:linePath(b.avgSwd,d.x,d.y),fill:'none',stroke:'#85958e','stroke-width':2.2}));
  s.append(E('path',{d:linePath(c.avgSwd,d.x,d.y),fill:'none',stroke:'#2f8f63','stroke-width':3}));
  s.append(E('text',{x:750,y:16,class:'axistext'},'grey = Baseline · green = CLOVER'));
}
function updateLabels(){
  $('triggerV').textContent=$('trigger').value;$('rainV').textContent=$('rainThreshold').value;$('probV').textContent=$('probThreshold').value;$('lookV').textContent=$('lookahead').value;$('allocationV').textContent=$('allocation').value;
}
function render(){
  updateLabels();const s=selectedScenario(),p=controls(),horizon=+$('planningHorizon').value;
  renderScenarioInfo(s);
  const b=runStrategy(false,s,p,'fixed');
  const cloverRule=state.level===5?state.priority:'fixed';
  const c=runStrategy(true,s,p,cloverRule);
  const rawB=planRawDemand(false,s,p,horizon),rawC=planRawDemand(true,s,p,horizon);
  renderWorkflow(s,p,b,c,rawB,rawC);
  renderIMUDetail(s,b,c,p);renderKPIs(s,b,c);renderResultTable(b,c);renderDecisionList(c);irrigationChart(b,c);swdChart(b,c,p);
  document.querySelectorAll('.system-card').forEach(x=>x.classList.toggle('active',x.dataset.scenario===state.scenario));
  document.querySelectorAll('.value-card').forEach(x=>x.classList.toggle('active',x.dataset.valuepath===state.valuePath));
}
document.querySelectorAll('.level-tab').forEach(b=>b.addEventListener('click',()=>applyLevel(+b.dataset.level)));
document.querySelectorAll('.system-card').forEach(b=>b.addEventListener('click',()=>{state.scenario=b.dataset.scenario;state.selectedImu=0;state.workflowStep=1;state.showAll=false;render()}));
document.querySelectorAll('.value-card').forEach(b=>b.addEventListener('click',()=>{state.valuePath=b.dataset.valuepath;state.scenario=state.valuePath==='limited'?'mackay_traveller':'tablelands_cp';state.selectedImu=0;state.workflowStep=1;state.showAll=false;render()}));
['trigger','rainThreshold','probThreshold','lookahead','allocation','planningHorizon'].forEach(id=>$(id).addEventListener('input',render));
$('priorityRule').addEventListener('change',e=>{state.priority=e.target.value;render()});
document.querySelectorAll('.workflow-dot').forEach(b=>b.addEventListener('click',()=>setWorkflowStep(+b.dataset.step)));
$('prevStepBtn').addEventListener('click',()=>setWorkflowStep(state.workflowStep-1));
$('nextStepBtn').addEventListener('click',()=>setWorkflowStep(state.workflowStep+1));
$('showAllStepsBtn').addEventListener('click',()=>{state.showAll=!state.showAll;updateWorkflowVisibility()});
$('newWeatherBtn').addEventListener('click',()=>{state.seed=Math.floor(Math.random()*1e9);genWeather();render()});
genWeather();applyLevel(1);
})();