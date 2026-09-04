(() => {
  const N = 45;
  const SYSTEMS = {
    cp: {
      name: "Centre Pivot",
      code: "CP",
      energy: "Electric",
      imus: 4,
      area: 40.715,
      areaPerImu: 10.179,
      duration: 24,
      hydraulicNet: 40.3,
      efficiency: 0.95,
      minCycle: 4,
      note: "4 equal quarter IMUs"
    },
    lm: {
      name: "Lateral Move",
      code: "LM",
      energy: "Diesel",
      imus: 6,
      area: 47.52,
      areaPerImu: 7.92,
      duration: 24,
      hydraulicNet: 51.8,
      efficiency: 0.95,
      minCycle: 6,
      note: "split outward / return application"
    }
  };

  let seed = 1056;
  let weather = [];
  const $ = id => document.getElementById(id);

  function mulberry32(a){
    return function(){
      let t=a+=0x6D2B79F5;
      t=Math.imul(t^t>>>15,t|1);
      t^=t+Math.imul(t^t>>>7,t|61);
      return ((t^t>>>14)>>>0)/4294967296;
    };
  }

  function gaussian(rand){
    let u=0,v=0;
    while(u===0)u=rand();
    while(v===0)v=rand();
    return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
  }

  function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
  function fmt(v,d=0){ return Number(v).toFixed(d); }

  function dateLabel(i){
    const d=new Date(2026,8,7+i);
    return d.toLocaleDateString("en-AU",{day:"2-digit",month:"short"});
  }

  function generateWeather(){
    const rand=mulberry32(seed);
    weather=[];
    for(let i=0;i<N;i++){
      const wave=0.15+0.10*Math.sin((i+3)/5.2);
      const event=rand()<clamp(wave,0.05,0.28);
      const actual=event
        ? Math.max(0,5+rand()*25+gaussian(rand)*4)
        : (rand()<0.08 ? rand()*4 : 0);

      const forecastAmount=Math.max(0,actual*(0.65+rand()*0.75)+gaussian(rand)*4.5);
      let prob=actual>5 ? 52+rand()*43 : 12+rand()*53;
      if(rand()<0.10) prob=66+rand()*28;
      if(actual>15 && rand()<0.10) prob=30+rand()*30;

      const etc=clamp(5.4+1.0*Math.sin(i/6)+gaussian(rand)*0.7,3.6,7.4);
      weather.push({
        day:i,
        actual:+actual.toFixed(1),
        fc:+forecastAmount.toFixed(1),
        prob:Math.round(clamp(prob,5,95)),
        etc:+etc.toFixed(1)
      });
    }
  }

  function params(){
    const system=SYSTEMS[$("system").value];
    return {
      system,
      allocationMode:$("allocationMode").value,
      allocation:+$("allocation").value,
      trigger:+$("trigger").value,
      irr:+$("irrAmount").value,
      rain:+$("rainThreshold").value,
      prob:+$("probThreshold").value,
      look:+$("lookahead").value,
      forceSwd:+$("trigger").value+20
    };
  }

  function forecastSignal(day,p){
    let best=null;
    for(let k=0;k<p.look;k++){
      const x=weather[day+k];
      if(!x) break;
      if(x.fc>=p.rain && x.prob>=p.prob){
        if(!best || x.fc*x.prob>best.fc*best.prob) best={...x,ahead:k};
      }
    }
    return best;
  }

  function simulate(mode,p){
    let swd=36;
    let grossIrr=0;
    let netIrr=0;
    let effectiveRain=0;
    let rainLoss=0;
    let irrigationLoss=0;
    let stressIndex=0;
    let stressDays=0;
    let lastIrr=-999;
    let allocationLeft=p.allocationMode==="limited" ? p.allocation : Infinity;
    const arr=[],irrEvents=[],logs=[];

    for(let i=0;i<N;i++){
      const w=weather[i];
      swd+=w.etc;

      const needs=swd>=p.trigger;
      const cycleReady=(i-lastIrr)>=p.system.minCycle;
      const hasWater=allocationLeft>0.01;
      const sig=forecastSignal(i,p);
      const decisionWindow=needs && cycleReady && hasWater;

      let appliedNet=0;
      let decision="No irrigation";

      if(needs){
        if(!cycleReady){
          decision=`Wait — ${p.system.code} cycle`;
        }else if(!hasWater){
          decision="No allocation left";
        }else if(mode==="smart" && sig && swd<p.forceSwd){
          decision="Delay for forecast rain";
        }else{
          if(mode==="smart" && swd>=p.forceSwd && sig){
            decision="Irrigate — crop too dry to delay";
          }else{
            decision="Irrigate";
          }

          const target=Math.min(p.irr,p.system.hydraulicNet);
          appliedNet=Math.min(target,allocationLeft);
        }
      }

      if(appliedNet>0){
        const appliedGross=appliedNet/p.system.efficiency;
        netIrr+=appliedNet;
        grossIrr+=appliedGross;
        irrigationLoss+=appliedGross-appliedNet;
        if(isFinite(allocationLeft)) allocationLeft-=appliedNet;
        swd=Math.max(0,swd-appliedNet);
        lastIrr=i;
        irrEvents.push({
          day:i,
          net:+appliedNet.toFixed(1),
          gross:+appliedGross.toFixed(1),
          reason:decision
        });
      }

      const room=Math.max(0,swd);
      const eff=Math.min(w.actual,room);
      effectiveRain+=eff;
      swd=Math.max(0,swd-eff);
      rainLoss+=Math.max(0,w.actual-eff);

      if(swd>75){
        const dailyStress=(swd-75)/25;
        stressIndex+=dailyStress;
        stressDays++;
      }

      const row={
        day:i,
        swd:+swd.toFixed(1),
        appliedNet:+appliedNet.toFixed(1),
        decision,
        sig,
        needs,
        cycleReady,
        decisionWindow,
        allocationLeft:isFinite(allocationLeft)?+Math.max(0,allocationLeft).toFixed(1):null
      };
      arr.push(row);

      if(appliedNet>0 || decision.startsWith("Delay") || decision==="No allocation left" ||
         (needs && mode==="smart" && decision.startsWith("Irrigate — crop"))){
        logs.push(row);
      }
    }

    const potentialYield=120;
    const yieldTCH=Math.max(75,potentialYield-stressIndex*1.35);

    return {
      arr,
      irrEvents,
      logs,
      grossIrr:+grossIrr.toFixed(1),
      netIrr:+netIrr.toFixed(1),
      effectiveRain:+effectiveRain.toFixed(1),
      rainLoss:+rainLoss.toFixed(1),
      irrigationLoss:+irrigationLoss.toFixed(1),
      stressIndex:+stressIndex.toFixed(2),
      stressDays,
      yieldTCH:+yieldTCH.toFixed(1),
      allocationLeft:isFinite(allocationLeft)?+Math.max(0,allocationLeft).toFixed(1):null
    };
  }

  function linePath(vals,x,y){
    return vals.map((v,i)=>(i?"L":"M")+x(i).toFixed(1)+","+y(v).toFixed(1)).join(" ");
  }

  function clear(svg){ while(svg.firstChild)svg.removeChild(svg.firstChild); }

  function el(tag,attrs={},text=""){
    const e=document.createElementNS("http://www.w3.org/2000/svg",tag);
    for(const [k,v] of Object.entries(attrs)) e.setAttribute(k,v);
    if(text)e.textContent=text;
    return e;
  }

  function drawWeather(base,smart,p){
    const svg=$("weatherChart");
    clear(svg);

    const W=1100,H=340,L=48,R=42,T=24,B=48;
    const plotW=W-L-R,plotH=H-T-B;
    const maxIrr=Math.max(...base.irrEvents.map(e=>e.net),...smart.irrEvents.map(e=>e.net),p.irr,0);
    const maxV=Math.max(50,...weather.map(x=>Math.max(x.actual,x.fc)),maxIrr+8);
    const x=i=>L+i*plotW/(N-1);
    const y=v=>T+plotH-(v/maxV)*plotH;
    const yProb=v=>T+plotH-(v/100)*plotH;

    for(let g=0;g<=5;g++){
      const val=maxV*g/5;
      const yy=y(val);
      svg.appendChild(el("line",{x1:L,y1:yy,x2:W-R,y2:yy,class:"gridline"}));
      svg.appendChild(el("text",{x:L-8,y:yy+3,"text-anchor":"end",class:"axistext"},Math.round(val)));

      const pct=g*20;
      const py=yProb(pct);
      svg.appendChild(el("text",{x:W-R+6,y:py+3,"text-anchor":"start",class:"axistext"},pct+"%"));
    }

    svg.appendChild(el("text",{x:12,y:17,class:"axistext"},"mm"));
    svg.appendChild(el("text",{x:W-8,y:17,"text-anchor":"end",class:"axistext"},"rain probability"));

    const barW=Math.max(3,plotW/N*0.48);
    weather.forEach((d,i)=>{
      const qualifies=d.fc>=p.rain && d.prob>=p.prob;
      svg.appendChild(el("rect",{
        x:x(i)-barW*.67,y:y(d.fc),width:barW*.6,height:Math.max(0,y(0)-y(d.fc)),rx:2,
        fill:"#a8cde7",opacity:.72,stroke:qualifies?"#2f8f63":"none","stroke-width":qualifies?2:0
      }));
      svg.appendChild(el("rect",{
        x:x(i),y:y(d.actual),width:barW*.6,height:Math.max(0,y(0)-y(d.actual)),rx:2,
        fill:"#3e83b7",opacity:.9
      }));
    });

    svg.appendChild(el("path",{
      d:linePath(weather.map(d=>d.prob),x,yProb),
      fill:"none",stroke:"#245f8c","stroke-width":2.2,"stroke-dasharray":"5 4"
    }));
    weather.forEach((d,i)=>{
      svg.appendChild(el("circle",{cx:x(i),cy:yProb(d.prob),r:2.5,fill:"#245f8c"}));
    });

    const probY=yProb(p.prob);
    svg.appendChild(el("line",{
      x1:L,y1:probY,x2:W-R,y2:probY,
      stroke:"#245f8c","stroke-width":1,"stroke-dasharray":"2 5",opacity:.52
    }));
    svg.appendChild(el("text",{
      x:W-R-5,y:probY-5,"text-anchor":"end",class:"axistext"
    },"probability threshold "+p.prob+"%"));

    const rainY=y(p.rain);
    svg.appendChild(el("line",{
      x1:L,y1:rainY,x2:W-R,y2:rainY,
      stroke:"#2f8f63","stroke-width":1,"stroke-dasharray":"4 5",opacity:.55
    }));
    svg.appendChild(el("text",{
      x:L+5,y:rainY-5,"text-anchor":"start",class:"axistext"
    },"rain threshold "+p.rain+" mm"));

    base.irrEvents.forEach(e=>{
      svg.appendChild(el("line",{
        x1:x(e.day)-2,y1:y(e.net),x2:x(e.day)-2,y2:y(0),
        stroke:"#b8a28b","stroke-width":2,opacity:.55
      }));
    });

    smart.irrEvents.forEach(e=>{
      svg.appendChild(el("line",{
        x1:x(e.day)+3,y1:y(e.net),x2:x(e.day)+3,y2:y(0),
        stroke:"#d78636","stroke-width":4,opacity:.95
      }));
      svg.appendChild(el("circle",{cx:x(e.day)+3,cy:y(e.net)-4,r:3.4,fill:"#d78636"}));
    });

    smart.arr.forEach(d=>{
      if(d.decision.startsWith("Delay")){
        svg.appendChild(el("circle",{
          cx:x(d.day),cy:y(0)-6,r:4.5,fill:"#ffffff",stroke:"#2f8f63","stroke-width":2
        }));
      }
    });

    for(let i=0;i<N;i+=5){
      svg.appendChild(el("text",{x:x(i),y:H-18,"text-anchor":"middle",class:"axistext"},dateLabel(i)));
    }

    const legends=[
      ["#a8cde7","Forecast rain","bar"],
      ["#3e83b7","Realised rain","bar"],
      ["#245f8c","Rain probability","line"],
      ["#b8a28b","Baseline irrigation","bar"],
      ["#d78636","CLOVER irrigation","bar"]
    ];
    legends.forEach((it,j)=>{
      const xx=470+j*121;
      if(it[2]==="line"){
        svg.appendChild(el("line",{x1:xx,y1:12,x2:xx+14,y2:12,stroke:it[0],"stroke-width":2,"stroke-dasharray":"4 3"}));
      }else{
        svg.appendChild(el("rect",{x:xx,y:9,width:12,height:5,rx:2,fill:it[0]}));
      }
      svg.appendChild(el("text",{x:xx+17,y:15,class:"axistext"},it[1]));
    });
  }

  function drawSWD(base,smart,p){
    const svg=$("swdChart");
    clear(svg);

    const W=1100,H=300,L=48,R=18,T=20,B=42;
    const plotW=W-L-R,plotH=H-T-B;
    const maxV=Math.max(110,p.forceSwd+20,...base.arr.map(x=>x.swd),...smart.arr.map(x=>x.swd));
    const x=i=>L+i*plotW/(N-1);
    const y=v=>T+(v/maxV)*plotH;

    for(let g=0;g<=5;g++){
      const val=maxV*g/5,yy=y(val);
      svg.appendChild(el("line",{x1:L,y1:yy,x2:W-R,y2:yy,class:"gridline"}));
      svg.appendChild(el("text",{x:L-8,y:yy+3,"text-anchor":"end",class:"axistext"},Math.round(val)));
    }
    svg.appendChild(el("text",{x:10,y:16,class:"axistext"},"SWD mm"));

    const trigY=y(p.trigger);
    const forceY=y(p.forceSwd);
    svg.appendChild(el("line",{x1:L,y1:trigY,x2:W-R,y2:trigY,stroke:"#94a79d","stroke-width":1.3,"stroke-dasharray":"6 5"}));
    svg.appendChild(el("text",{x:W-R-5,y:trigY-5,"text-anchor":"end",class:"axistext"},"irrigation trigger"));
    svg.appendChild(el("line",{x1:L,y1:forceY,x2:W-R,y2:forceY,stroke:"#d7a28f","stroke-width":1,"stroke-dasharray":"3 5"}));
    svg.appendChild(el("text",{x:W-R-5,y:forceY-5,"text-anchor":"end",class:"axistext"},"forced irrigation limit"));

    svg.appendChild(el("path",{
      d:linePath(base.arr.map(d=>d.swd),x,y),
      fill:"none",stroke:"#84958d","stroke-width":2
    }));
    svg.appendChild(el("path",{
      d:linePath(smart.arr.map(d=>d.swd),x,y),
      fill:"none",stroke:"#2f8f63","stroke-width":3
    }));

    smart.arr.forEach((d,i)=>{
      if(d.decision.startsWith("Delay")){
        svg.appendChild(el("circle",{cx:x(i),cy:y(d.swd),r:4.4,fill:"#fff",stroke:"#2f8f63","stroke-width":2}));
      }
    });

    for(let i=0;i<N;i+=5){
      svg.appendChild(el("text",{x:x(i),y:H-14,"text-anchor":"middle",class:"axistext"},dateLabel(i)));
    }

    svg.appendChild(el("line",{x1:790,y1:10,x2:810,y2:10,stroke:"#84958d","stroke-width":2}));
    svg.appendChild(el("text",{x:815,y:14,class:"axistext"},"Baseline"));
    svg.appendChild(el("line",{x1:885,y1:10,x2:905,y2:10,stroke:"#2f8f63","stroke-width":3}));
    svg.appendChild(el("text",{x:910,y:14,class:"axistext"},"CLOVER"));
  }

  function buildDecisionTable(base,smart,p){
    const body=$("decisionBody");
    body.innerHTML="";

    const days=new Set([...base.logs.map(x=>x.day),...smart.logs.map(x=>x.day)]);
    const sorted=[...days].sort((a,b)=>a-b);
    $("decisionCount").textContent=sorted.length+" notable decision days";

    sorted.forEach(day=>{
      const b=base.arr[day];
      const s=smart.arr[day];
      const w=weather[day];
      const tr=document.createElement("tr");
      const best=s.sig;

      let result="—";
      if(s.decision.startsWith("Delay")){
        const actualNext=best ? weather[day+best.ahead]?.actual||0 : 0;
        result=actualNext>=5
          ? `<span class="tag d">Rain captured</span> ${actualNext.toFixed(1)} mm realised`
          : `<span class="tag r">Forecast miss</span> little/no rain realised`;
      }else if(s.appliedNet>0){
        result=`<span class="tag i">Irrigated</span> ${s.appliedNet.toFixed(0)} mm net`;
      }else if(s.decision==="No allocation left"){
        result=`<span class="tag a">Allocation exhausted</span>`;
      }

      const forecast=best
        ? `<span class="tag r">${best.fc.toFixed(0)} mm · ${best.prob}%</span> +${best.ahead}d`
        : `${w.fc.toFixed(0)} mm · ${w.prob}% today`;

      tr.innerHTML=`
        <td><b>${dateLabel(day)}</b><br><span style="color:#819188">SWD ${s.swd.toFixed(0)} mm</span></td>
        <td>${b.appliedNet>0 ? `<span class="tag i">${b.appliedNet.toFixed(0)} mm</span>` : b.decision}</td>
        <td>${s.decision}</td>
        <td>${forecast}</td>
        <td>${result}</td>`;
      body.appendChild(tr);
    });
  }

  function updateSystemFacts(p){
    const s=p.system;
    const capacityNote=s.code==="LM"
      ? `${fmt(s.hydraulicNet,1)} mm hydraulic; 40 mm management cap`
      : `${fmt(s.hydraulicNet,1)} mm net per full irrigation`;

    $("systemFacts").innerHTML=`
      <div class="fact"><b>${s.code}</b><span>${s.name}</span></div>
      <div class="fact"><b>${s.energy}</b><span>energy source</span></div>
      <div class="fact"><b>${s.imus}</b><span>IMUs · ${fmt(s.areaPerImu,1)} ha each</span></div>
      <div class="fact"><b>${fmt(s.area,1)} ha</b><span>total irrigated area</span></div>
      <div class="fact"><b>${s.minCycle} days</b><span>minimum cycle · ${capacityNote}</span></div>`;
  }

  function updatePathway(p){
    const limited=p.allocationMode==="limited";
    const panel=$("pathwayPanel");
    panel.classList.toggle("benchmark",!limited);
    $("allocationControl").style.display=limited ? "" : "none";

    if(limited){
      $("pathwayEyebrow").textContent="Drought / limited-water pathway";
      $("pathwayTitle").textContent="Use forecast rainfall to make scarce irrigation water work harder";
      $("pathwayText").textContent=
        "Baseline and CLOVER receive the same finite irrigation allocation. CLOVER changes timing to increase effective rainfall and preserve water for later crop demand. The primary value signal is lower water stress and yield protection, not simply less irrigation.";
      $("pathwayFlow").innerHTML=
        `<span>Forecast</span><span class="arrow">→</span><span>More effective rain</span><span class="arrow">→</span><span>Water available later</span><span class="arrow">→</span><span>Less stress</span><span class="arrow">→</span><span>TCH / TSH ↑</span>`;
    }else{
      $("pathwayEyebrow").textContent="Water-adequate benchmark";
      $("pathwayTitle").textContent="Use forecast rainfall to reduce unnecessary irrigation";
      $("pathwayText").textContent=
        "When irrigation water is not limiting, crop water supply is already close to potential. Forecast value is therefore expected mainly through higher effective rainfall, lower irrigation requirement and reduced pumping cost while yield remains similar.";
      $("pathwayFlow").innerHTML=
        `<span>Forecast</span><span class="arrow">→</span><span>More effective rain</span><span class="arrow">→</span><span>Less irrigation</span><span class="arrow">→</span><span>Water + energy ↓</span><span class="arrow">→</span><span>Yield maintained</span>`;
    }
  }

  function updateKpis(base,smart,p){
    const eff=smart.effectiveRain-base.effectiveRain;
    const yieldDiff=smart.yieldTCH-base.yieldTCH;
    const delayed=smart.arr.filter(d=>d.decision.startsWith("Delay")).length;
    const limited=p.allocationMode==="limited";

    if(limited){
      const stressReduction=base.stressIndex>0
        ? (base.stressIndex-smart.stressIndex)/base.stressIndex*100
        : 0;

      $("kpi1Label").textContent="Effective rainfall gain";
      $("kpi1").textContent=(eff>=0?"+":"")+fmt(eff,1)+" mm";
      $("kpi1D").textContent=`${fmt(base.effectiveRain,1)} → ${fmt(smart.effectiveRain,1)} mm effective`;
      $("kpi1D").className="delta "+(eff>=0?"good":"warn");

      $("kpi2Label").textContent="Water-stress reduction";
      $("kpi2").textContent=(stressReduction>=0?"−":"+")+fmt(Math.abs(stressReduction),0)+"%";
      $("kpi2D").textContent=`stress index ${fmt(base.stressIndex,1)} → ${fmt(smart.stressIndex,1)}`;
      $("kpi2D").className="delta "+(stressReduction>=0?"good":"warn");

      $("kpi3Label").textContent="Yield effect";
      $("kpi3").textContent=(yieldDiff>=0?"+":"")+fmt(yieldDiff,1)+" t/ha";
      $("kpi3D").textContent=`${fmt(base.yieldTCH,1)} → ${fmt(smart.yieldTCH,1)} t cane/ha`;
      $("kpi3D").className="delta "+(yieldDiff>=0?"good":"warn");

      $("kpi4Label").textContent="Allocation used";
      $("kpi4").textContent=fmt(smart.netIrr/100,2)+" ML/ha";
      $("kpi4D").textContent=`baseline ${fmt(base.netIrr/100,2)} · CLOVER ${fmt(smart.netIrr/100,2)} ML/ha`;
      $("kpi4D").className="delta neutral";

      $("kpi5Label").textContent="Irrigation decisions changed";
      $("kpi5").textContent=delayed+" delays";
      $("kpi5D").textContent=`same ${fmt(p.allocation/100,2)} ML/ha available to both strategies`;
      $("kpi5D").className="delta neutral";
    }else{
      const savedEvents=base.irrEvents.length-smart.irrEvents.length;
      const waterSaved=base.grossIrr-smart.grossIrr;
      const pumpSaving=base.grossIrr>0 ? waterSaved/base.grossIrr*100 : 0;

      $("kpi1Label").textContent="Effective rainfall gain";
      $("kpi1").textContent=(eff>=0?"+":"")+fmt(eff,1)+" mm";
      $("kpi1D").textContent=`${fmt(base.effectiveRain,1)} → ${fmt(smart.effectiveRain,1)} mm effective`;
      $("kpi1D").className="delta "+(eff>=0?"good":"warn");

      $("kpi2Label").textContent="Irrigation events saved";
      $("kpi2").textContent=(savedEvents>=0?"+":"")+savedEvents+" events";
      $("kpi2D").textContent=`${base.irrEvents.length} → ${smart.irrEvents.length} irrigations`;
      $("kpi2D").className="delta "+(savedEvents>=0?"good":"warn");

      $("kpi3Label").textContent="Gross irrigation saved";
      $("kpi3").textContent=(waterSaved>=0?"+":"")+fmt(waterSaved/100,2)+" ML/ha";
      $("kpi3D").textContent=`${fmt(base.grossIrr/100,2)} → ${fmt(smart.grossIrr/100,2)} ML/ha pumped`;
      $("kpi3D").className="delta "+(waterSaved>=0?"good":"warn");

      $("kpi4Label").textContent="Pumping / energy proxy";
      $("kpi4").textContent=(pumpSaving>=0?"−":"+")+fmt(Math.abs(pumpSaving),0)+"%";
      $("kpi4D").textContent=`${p.system.energy.toLowerCase()} pumping proportional to gross irrigation`;
      $("kpi4D").className="delta "+(pumpSaving>=0?"good":"warn");

      $("kpi5Label").textContent="Yield effect";
      $("kpi5").textContent=(yieldDiff>=0?"+":"")+fmt(yieldDiff,1)+" t/ha";
      $("kpi5D").textContent=`${fmt(base.yieldTCH,1)} → ${fmt(smart.yieldTCH,1)} t cane/ha`;
      $("kpi5D").className="delta "+(Math.abs(yieldDiff)<1?"neutral":yieldDiff>=0?"good":"warn");
    }
  }

  function updateThresholdSummary(smart,p){
    const qualifying=weather.filter(d=>d.fc>=p.rain && d.prob>=p.prob).length;
    const windows=smart.arr.filter(d=>d.decisionWindow).length;
    const signalWindows=smart.arr.filter(d=>d.decisionWindow && d.sig).length;
    const delays=smart.arr.filter(d=>d.decision.startsWith("Delay")).length;

    $("signalCount").textContent=
      `${qualifying} forecast days qualify; ${signalWindows} intersect ${windows} irrigation decision windows.`;
    $("decisionSensitivity").textContent=
      delays===1 ? "1 irrigation decision is delayed in this run."
                 : `${delays} irrigation decisions are delayed in this run.`;
  }

  function syncLabels(){
    [["allocation","allocationV"],["trigger","triggerV"],["irrAmount","irrV"],
     ["rainThreshold","rainV"],["probThreshold","probV"],["lookahead","lookV"]]
      .forEach(([a,b])=>$(b).textContent=$(a).value);
    $("allocationML").textContent=fmt(+$("allocation").value/100,2);
  }

  function run(){
    syncLabels();
    const p=params();
    updateSystemFacts(p);
    updatePathway(p);

    const base=simulate("baseline",p);
    const smart=simulate("smart",p);

    updateKpis(base,smart,p);
    updateThresholdSummary(smart,p);
    drawWeather(base,smart,p);
    drawSWD(base,smart,p);
    buildDecisionTable(base,smart,p);
  }

  ["system","allocationMode","allocation","trigger","irrAmount","rainThreshold","probThreshold","lookahead"]
    .forEach(id=>$(id).addEventListener("input",run));

  $("randomBtn").addEventListener("click",()=>{
    seed=Math.floor(Math.random()*1e9);
    generateWeather();
    run();
  });

  generateWeather();
  run();
})();