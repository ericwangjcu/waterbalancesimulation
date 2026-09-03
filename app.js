(() => {
  const N = 45;
  let seed = Math.floor(Math.random()*1e9);
  let weather = [];
  const $ = id => document.getElementById(id);

  function mulberry32(a){
    return function(){
      let t=a+=0x6D2B79F5;
      t=Math.imul(t^t>>>15,t|1);
      t^=t+Math.imul(t^t>>>7,t|61);
      return ((t^t>>>14)>>>0)/4294967296;
    }
  }
  function gaussian(rand){
    let u=0,v=0;
    while(u===0)u=rand();
    while(v===0)v=rand();
    return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
  }
  function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
  function fmt(v,d=0){return Number(v).toFixed(d)}
  function dateLabel(i){
    const d=new Date(2026,8,7+i);
    return d.toLocaleDateString("en-AU",{day:"2-digit",month:"short"});
  }

  function generateWeather(){
    const rand=mulberry32(seed);
    weather=[];
    for(let i=0;i<N;i++){
      const wave = 0.18 + 0.14*Math.sin((i+4)/5);
      const event = rand() < clamp(wave,0.08,0.38);
      const actual = event ? Math.max(0, 5 + rand()*34 + gaussian(rand)*5) : (rand()<0.11 ? rand()*5 : 0);
      const forecastAmount = Math.max(0, actual*(0.65+rand()*0.7) + gaussian(rand)*5);
      let prob = actual>5 ? 55+rand()*40 : 15+rand()*50;
      if(rand()<0.11) prob = 65+rand()*28;
      if(actual>15 && rand()<0.12) prob = 30+rand()*30;
      const etc = clamp(5.2 + 1.1*Math.sin(i/6) + gaussian(rand)*0.7, 3.4, 7.5);
      weather.push({day:i,actual:+actual.toFixed(1),fc:+forecastAmount.toFixed(1),prob:Math.round(clamp(prob,5,95)),etc:+etc.toFixed(1)});
    }
  }

  function params(){
    return {
      allocation:$("allocation").value,
      trigger:+$("trigger").value,
      irr:+$("irrAmount").value,
      rain:+$("rainThreshold").value,
      prob:+$("probThreshold").value,
      look:+$("lookahead").value,
      cap:+$("safetyCap").value
    }
  }

  function forecastSignal(day,p){
    let best=null;
    for(let k=0;k<p.look;k++){
      const x=weather[day+k];
      if(!x) break;
      if(x.fc>=p.rain && x.prob>=p.prob){
        if(!best || x.fc*x.prob > best.fc*best.prob) best={...x,ahead:k};
      }
    }
    return best;
  }

  function simulate(mode,p){
    let swd=35, grossIrr=0, effectiveRain=0, drainage=0, stress=0;
    let allocationLeft = p.allocation==="limited" ? 150 : Infinity;
    const arr=[], irrEvents=[], logs=[];

    for(let i=0;i<N;i++){
      const w=weather[i];
      swd += w.etc;
      let applied=0, decision="", sig=forecastSignal(i,p);
      const needs = swd >= p.trigger;

      if(needs){
        if(mode==="baseline"){
          if(allocationLeft>0){
            const variation = ((i*17 + seed%23)%7)-3;
            applied=Math.max(10,Math.min(p.irr+variation, allocationLeft));
            decision="Irrigate";
          }else decision="No allocation left";
        }else{
          if(swd>=p.cap){
            if(allocationLeft>0){
              const variation = ((i*11 + seed%19)%7)-3;
              applied=Math.max(10,Math.min(p.irr+variation, allocationLeft));
              decision="Irrigate — safety cap";
            }else decision="No allocation left";
          }else if(sig){
            decision="Delay for forecast rain";
          }else if(allocationLeft>0){
            const variation = ((i*11 + seed%19)%7)-3;
            applied=Math.max(10,Math.min(p.irr+variation, allocationLeft));
            decision="Irrigate";
          }else decision="No allocation left";
        }
      }else decision="No irrigation";

      if(applied>0){
        grossIrr += applied;
        allocationLeft -= applied;
        swd -= applied;
        irrEvents.push({day:i,amount:+applied.toFixed(1),reason:decision});
      }

      const room=Math.max(0,swd);
      const eff=Math.min(w.actual,room);
      effectiveRain+=eff;
      swd-=eff;
      const excess=Math.max(0,w.actual-room);
      drainage+=excess;
      swd=Math.max(0,swd);
      if(swd>75) stress += (swd-75)/25;

      arr.push({day:i,swd:+swd.toFixed(1),applied:+applied.toFixed(1),decision,sig});
      if(needs || applied>0 || (mode==="smart" && decision.startsWith("Delay"))){
        logs.push({day:i,swd:+swd.toFixed(1),applied:+applied.toFixed(1),decision,sig});
      }
    }

    const basePotential=110;
    const yieldTCH=Math.max(70,basePotential-stress*1.55);
    return {
      arr,irrEvents,logs,grossIrr:+grossIrr.toFixed(1),
      effectiveRain:+effectiveRain.toFixed(1),drainage:+drainage.toFixed(1),
      stress:+stress.toFixed(2),yieldTCH:+yieldTCH.toFixed(1),
      allocationLeft:isFinite(allocationLeft)?+Math.max(0,allocationLeft).toFixed(1):null
    };
  }

  function linePath(vals,x,y){
    return vals.map((v,i)=>(i?"L":"M")+x(i).toFixed(1)+","+y(v).toFixed(1)).join(" ");
  }
  function clear(svg){while(svg.firstChild)svg.removeChild(svg.firstChild)}
  function el(tag,attrs={},text=""){
    const e=document.createElementNS("http://www.w3.org/2000/svg",tag);
    for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);
    if(text)e.textContent=text;
    return e;
  }

  function drawWeather(base,smart,p){
    const svg=$("weatherChart"); clear(svg);
    const W=1100,H=330,L=48,R=18,T=20,B=45,plotW=W-L-R,plotH=H-T-B;
    const maxV=Math.max(50,...weather.map(x=>Math.max(x.actual,x.fc)),p.irr+8);
    const x=i=>L+i*plotW/(N-1);
    const y=v=>T+plotH-(v/maxV)*plotH;
    const yProb=v=>T+plotH-(v/100)*plotH;

    for(let g=0;g<=5;g++){
      const val=maxV*g/5, yy=y(val);
      svg.appendChild(el("line",{x1:L,y1:yy,x2:W-R,y2:yy,class:"gridline"}));
      svg.appendChild(el("text",{x:L-8,y:yy+3,"text-anchor":"end",class:"axistext"},Math.round(val)));
      const pct=g*20;
      const py=yProb(pct);
      svg.appendChild(el("text",{x:W-R+5,y:py+3,"text-anchor":"start",class:"axistext"},pct+"%"));
    }
    svg.appendChild(el("text",{x:12,y:16,class:"axistext"},"mm"));
    svg.appendChild(el("text",{x:W-13,y:16,"text-anchor":"end",class:"axistext"},"rain probability"));

    const barW=Math.max(3,plotW/N*0.48);
    weather.forEach((d,i)=>{
      svg.appendChild(el("rect",{x:x(i)-barW*.65,y:y(d.fc),width:barW*.6,height:Math.max(0,y(0)-y(d.fc)),rx:2,fill:"#a8cde7",opacity:.7}));
      svg.appendChild(el("rect",{x:x(i),y:y(d.actual),width:barW*.6,height:Math.max(0,y(0)-y(d.actual)),rx:2,fill:"#3e83b7",opacity:.9}));
    });

    svg.appendChild(el("path",{d:linePath(weather.map(d=>d.prob),x,yProb),fill:"none",stroke:"#245f8c","stroke-width":2.2,"stroke-dasharray":"5 4"}));
    weather.forEach((d,i)=>{
      svg.appendChild(el("circle",{cx:x(i),cy:yProb(d.prob),r:2.5,fill:"#245f8c"}));
    });

    const thresholdY=yProb(p.prob);
    svg.appendChild(el("line",{x1:L,y1:thresholdY,x2:W-R,y2:thresholdY,stroke:"#245f8c","stroke-width":1,"stroke-dasharray":"2 5",opacity:.5}));
    svg.appendChild(el("text",{x:W-R-5,y:thresholdY-5,"text-anchor":"end",class:"axistext"},"threshold "+p.prob+"%"));

    base.irrEvents.forEach(e=>{
      svg.appendChild(el("line",{x1:x(e.day),y1:y(e.amount),x2:x(e.day),y2:y(0),stroke:"#c1a17d","stroke-width":2,opacity:.55}));
    });
    smart.irrEvents.forEach(e=>{
      const xx=x(e.day)+4;
      svg.appendChild(el("line",{x1:xx,y1:y(e.amount),x2:xx,y2:y(0),stroke:"#d78636","stroke-width":4,opacity:.95}));
      svg.appendChild(el("circle",{cx:xx,cy:y(e.amount)-4,r:3.5,fill:"#d78636"}));
    });

    for(let i=0;i<N;i+=5){
      svg.appendChild(el("text",{x:x(i),y:H-18,"text-anchor":"middle",class:"axistext"},dateLabel(i)));
    }

    const legends=[
      ["#a8cde7","Forecast rain","bar"],
      ["#3e83b7","Realised rain","bar"],
      ["#245f8c","Rain probability","line"],
      ["#c1a17d","Baseline irrigation","bar"],
      ["#d78636","CLOVER irrigation","bar"]
    ];
    legends.forEach((it,j)=>{
      const xx=485+j*120;
      if(it[2]==="line"){
        svg.appendChild(el("line",{x1:xx,y1:11,x2:xx+14,y2:11,stroke:it[0],"stroke-width":2,"stroke-dasharray":"4 3"}));
      } else {
        svg.appendChild(el("rect",{x:xx,y:8,width:12,height:5,rx:2,fill:it[0]}));
      }
      svg.appendChild(el("text",{x:xx+17,y:14,class:"axistext"},it[1]));
    });
  }

  function drawSWD(base,smart,p){
    const svg=$("swdChart"); clear(svg);
    const W=1100,H=300,L=48,R=18,T=20,B=42,plotW=W-L-R,plotH=H-T-B;
    const maxV=Math.max(100,p.cap+15,...base.arr.map(x=>x.swd),...smart.arr.map(x=>x.swd));
    const x=i=>L+i*plotW/(N-1);
    const y=v=>T+(v/maxV)*plotH;

    for(let g=0;g<=5;g++){
      const val=maxV*g/5, yy=y(val);
      svg.appendChild(el("line",{x1:L,y1:yy,x2:W-R,y2:yy,class:"gridline"}));
      svg.appendChild(el("text",{x:L-8,y:yy+3,"text-anchor":"end",class:"axistext"},Math.round(val)));
    }
    svg.appendChild(el("text",{x:10,y:16,class:"axistext"},"SWD mm"));

    const trigY=y(p.trigger), capY=y(p.cap);
    svg.appendChild(el("line",{x1:L,y1:trigY,x2:W-R,y2:trigY,stroke:"#94a79d","stroke-width":1.3,"stroke-dasharray":"6 5"}));
    svg.appendChild(el("text",{x:W-R-5,y:trigY-5,"text-anchor":"end",class:"axistext"},"irrigation trigger"));
    svg.appendChild(el("line",{x1:L,y1:capY,x2:W-R,y2:capY,stroke:"#d7a28f","stroke-width":1,"stroke-dasharray":"3 5"}));
    svg.appendChild(el("text",{x:W-R-5,y:capY-5,"text-anchor":"end",class:"axistext"},"safety cap"));

    svg.appendChild(el("path",{d:linePath(base.arr.map(d=>d.swd),x,y),fill:"none",stroke:"#84958d","stroke-width":2}));
    svg.appendChild(el("path",{d:linePath(smart.arr.map(d=>d.swd),x,y),fill:"none",stroke:"#2f8f63","stroke-width":3}));

    smart.arr.forEach((d,i)=>{
      if(d.decision.startsWith("Delay")){
        svg.appendChild(el("circle",{cx:x(i),cy:y(d.swd),r:4.5,fill:"#ffffff",stroke:"#2f8f63","stroke-width":2}));
      }
    });

    for(let i=0;i<N;i+=5){
      svg.appendChild(el("text",{x:x(i),y:H-14,"text-anchor":"middle",class:"axistext"},dateLabel(i)));
    }
    svg.appendChild(el("line",{x1:780,y1:10,x2:800,y2:10,stroke:"#84958d","stroke-width":2}));
    svg.appendChild(el("text",{x:805,y:14,class:"axistext"},"Baseline"));
    svg.appendChild(el("line",{x1:875,y1:10,x2:895,y2:10,stroke:"#2f8f63","stroke-width":3}));
    svg.appendChild(el("text",{x:900,y:14,class:"axistext"},"Forecast-informed"));
  }

  function buildDecisionTable(base,smart,p){
    const body=$("decisionBody");
    body.innerHTML="";
    const days=new Set([...base.logs.map(x=>x.day),...smart.logs.map(x=>x.day)]);
    const sorted=[...days].sort((a,b)=>a-b);
    $("decisionCount").textContent=sorted.length+" notable decision days";

    sorted.forEach(day=>{
      const b=base.arr[day], s=smart.arr[day], w=weather[day];
      const tr=document.createElement("tr");
      const best=s.sig;
      let outcome="";
      if(s.decision.startsWith("Delay")){
        const actualNext=best ? weather[day+best.ahead]?.actual||0 : 0;
        outcome = actualNext>=5
          ? `<span class="tag d">Rain captured</span> ${actualNext.toFixed(1)} mm realised`
          : `<span class="tag r">Forecast miss</span> little/no rain realised`;
      }else if(s.applied>0){
        outcome=`<span class="tag i">Irrigated</span> ${s.applied.toFixed(0)} mm`;
      }else{
        outcome="—";
      }
      const forecast=best
        ? `<span class="tag r">${best.fc.toFixed(0)} mm · ${best.prob}%</span> +${best.ahead}d`
        : `${w.fc.toFixed(0)} mm · ${w.prob}% today`;

      tr.innerHTML=`
        <td><b>${dateLabel(day)}</b><br><span style="color:#819188">SWD ${b.swd.toFixed(0)} mm</span></td>
        <td>${b.applied>0 ? `<span class="tag i">${b.applied.toFixed(0)} mm irrigation</span>` : b.decision}</td>
        <td>${s.decision}</td>
        <td>${forecast}</td>
        <td>${outcome}</td>`;
      body.appendChild(tr);
    });
  }

  function updateKpis(base,smart,p){
    const savedN=base.irrEvents.length-smart.irrEvents.length;
    const water=base.grossIrr-smart.grossIrr;
    const eff=smart.effectiveRain-base.effectiveRain;
    const y=smart.yieldTCH-base.yieldTCH;
    const energy=base.grossIrr>0 ? water/base.grossIrr*100 : 0;

    $("savedIrr").textContent=(savedN>=0?"+":"")+savedN+" events";
    $("savedIrrD").textContent=`${base.irrEvents.length} → ${smart.irrEvents.length} irrigations`;
    $("waterSaved").textContent=(water>=0?"+":"")+fmt(water,0)+" mm";
    $("waterSavedD").textContent=`${fmt(base.grossIrr,0)} → ${fmt(smart.grossIrr,0)} mm applied`;
    $("effRain").textContent=(eff>=0?"+":"")+fmt(eff,1)+" mm";
    $("yieldEffect").textContent=(y>=0?"+":"")+fmt(y,1)+" t/ha";
    $("yieldEffectD").textContent=`${fmt(base.yieldTCH,1)} → ${fmt(smart.yieldTCH,1)} t cane/ha`;
    $("yieldEffectD").className="delta "+(y>=0?"good":"warn");
    $("energyEffect").textContent=(energy>=0?"−":"+")+fmt(Math.abs(energy),0)+"%";

    if(p.allocation==="limited"){
      $("waterSavedD").textContent=`allocation remaining: ${fmt(base.allocationLeft,0)} → ${fmt(smart.allocationLeft,0)} mm`;
    }
  }

  function syncLabels(){
    [["trigger","triggerV"],["irrAmount","irrV"],["rainThreshold","rainV"],
     ["probThreshold","probV"],["lookahead","lookV"],["safetyCap","capV"]]
      .forEach(([a,b])=>$(b).textContent=$(a).value);
  }

  function run(){
    syncLabels();
    const p=params();
    const base=simulate("baseline",p);
    const smart=simulate("smart",p);
    updateKpis(base,smart,p);
    drawWeather(base,smart,p);
    drawSWD(base,smart,p);
    buildDecisionTable(base,smart,p);
  }

  ["trigger","irrAmount","rainThreshold","probThreshold","lookahead","safetyCap","allocation"]
    .forEach(id=>$(id).addEventListener("input",()=>{syncLabels();run()}));

  $("runBtn").addEventListener("click",run);
  $("randomBtn").addEventListener("click",()=>{
    seed=Math.floor(Math.random()*1e9);
    generateWeather();run();
  });

  generateWeather();
  syncLabels();
  run();
})();
