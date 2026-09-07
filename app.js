(() => {
  const N = 36;
  let seed = 20260907;
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

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function dateLabel(i){
    const d=new Date(2026,8,7+i);
    return d.toLocaleDateString("en-AU",{day:"2-digit",month:"short"});
  }

  function params(){
    return {
      trigger:+$("swdTrigger").value,
      irr:+$("irrigationAmount").value,
      rain:+$("rainThreshold").value,
      prob:+$("probThreshold").value,
      look:+$("lookahead").value
    };
  }

  function simulateBaseline(p){
    let swd=34;
    const rows=[];
    const irrigation=[];

    for(let i=0;i<N;i++){
      const w=weather[i];
      swd+=w.use;
      const swdAtDecision=swd;
      const due=swd>=p.trigger;
      let applied=0;

      if(due){
        applied=p.irr;
        swd=Math.max(0,swd-applied);
        irrigation.push({day:i,amount:applied,swdAtDecision});
      }

      const effectiveRain=Math.min(w.actual,swd);
      swd=Math.max(0,swd-effectiveRain);

      rows.push({
        day:i,
        use:w.use,
        actual:w.actual,
        due,
        applied,
        swdAtDecision,
        swdEnd:swd
      });
    }
    return {rows,irrigation};
  }

  function generateWeather(){
    const rand=mulberry32(seed);
    weather=[];

    for(let i=0;i<N;i++){
      const event=rand()<0.17;
      const actual=event ? Math.max(0,4+rand()*24+gaussian(rand)*3.3) : (rand()<0.07 ? rand()*4 : 0);
      const fc=Math.max(0,actual*(0.65+rand()*0.75)+gaussian(rand)*4.2);
      let prob=actual>5 ? 55+rand()*36 : 15+rand()*50;
      if(rand()<0.10) prob=65+rand()*25;
      const use=clamp(5.1+0.8*Math.sin(i/5.5)+gaussian(rand)*0.45,3.8,6.6);
      weather.push({
        day:i,
        actual:+actual.toFixed(1),
        fc:+fc.toFixed(1),
        prob:Math.round(clamp(prob,5,95)),
        use:+use.toFixed(1)
      });
    }

    // Give the default example a few different forecast signals around baseline irrigation dates.
    // This is only to make the discussion sliders useful; it is not a forecast model.
    const provisional=simulateBaseline({trigger:60,irr:40});
    const examples=[
      {fc:14,prob:62,ahead:1},
      {fc:24,prob:74,ahead:2},
      {fc:31,prob:86,ahead:1},
      {fc:19,prob:82,ahead:2},
      {fc:28,prob:66,ahead:1},
      {fc:35,prob:78,ahead:2}
    ];
    provisional.irrigation.forEach((ev,j)=>{
      const ex=examples[j%examples.length];
      const k=Math.min(N-1,ev.day+ex.ahead);
      weather[k].fc=ex.fc;
      weather[k].prob=ex.prob;
    });
  }

  function signalFor(day,p){
    let best=null;
    for(let k=0;k<p.look;k++){
      const d=weather[day+k];
      if(!d) break;
      if(d.fc>=p.rain && d.prob>=p.prob){
        if(!best || d.fc*d.prob>best.fc*best.prob){
          best={...d,ahead:k};
        }
      }
    }
    return best;
  }

  function svgEl(tag,attrs={},text=""){
    const el=document.createElementNS("http://www.w3.org/2000/svg",tag);
    Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
    if(text)el.textContent=text;
    return el;
  }

  function linePath(vals,x,y){
    return vals.map((v,i)=>(i?"L":"M")+x(i).toFixed(1)+","+y(v).toFixed(1)).join(" ");
  }

  function drawWeather(p,sim,decisionList){
    const svg=$("weatherChart");
    while(svg.firstChild)svg.removeChild(svg.firstChild);

    const W=1100,H=390,L=48,R=44,T=24,B=55;
    const plotW=W-L-R,plotH=H-T-B;
    const maxRain=Math.max(50,p.irr+5,...weather.map(d=>Math.max(d.fc,d.actual)),p.rain+5);
    const x=i=>L+i*plotW/(N-1);
    const y=v=>T+plotH-(v/maxRain)*plotH;
    const yp=v=>T+plotH-(v/100)*plotH;

    for(let g=0;g<=5;g++){
      const rv=maxRain*g/5;
      const yy=y(rv);
      svg.appendChild(svgEl("line",{x1:L,y1:yy,x2:W-R,y2:yy,class:"gridline"}));
      svg.appendChild(svgEl("text",{x:L-8,y:yy+3,"text-anchor":"end",class:"axistext"},Math.round(rv)));
      const pct=g*20;
      svg.appendChild(svgEl("text",{x:W-R+6,y:yp(pct)+3,class:"axistext"},pct+"%"));
    }

    svg.appendChild(svgEl("text",{x:12,y:17,class:"axistext"},"mm"));
    svg.appendChild(svgEl("text",{x:W-8,y:17,"text-anchor":"end",class:"axistext"},"probability"));

    svg.appendChild(svgEl("line",{x1:L,y1:y(p.rain),x2:W-R,y2:y(p.rain),stroke:"#2f8f63","stroke-width":1,"stroke-dasharray":"4 5",opacity:.5}));
    svg.appendChild(svgEl("text",{x:L+6,y:y(p.rain)-5,class:"axistext"},"rain threshold "+p.rain+" mm"));
    svg.appendChild(svgEl("line",{x1:L,y1:yp(p.prob),x2:W-R,y2:yp(p.prob),stroke:"#245f8c","stroke-width":1,"stroke-dasharray":"2 5",opacity:.5}));
    svg.appendChild(svgEl("text",{x:W-R-5,y:yp(p.prob)-5,"text-anchor":"end",class:"axistext"},"probability threshold "+p.prob+"%"));

    const barW=Math.max(4,plotW/N*.43);
    weather.forEach((d,i)=>{
      const qualifies=d.fc>=p.rain && d.prob>=p.prob;
      svg.appendChild(svgEl("rect",{
        x:x(i)-barW*.64,y:y(d.fc),width:barW*.58,height:Math.max(0,y(0)-y(d.fc)),rx:2,
        fill:"#b8d7ec",opacity:.82,stroke:qualifies?"#2f8f63":"none","stroke-width":qualifies?2:0
      }));
      svg.appendChild(svgEl("rect",{
        x:x(i),y:y(d.actual),width:barW*.58,height:Math.max(0,y(0)-y(d.actual)),rx:2,
        fill:"#3e83b7",opacity:.9
      }));
    });

    svg.appendChild(svgEl("path",{d:linePath(weather.map(d=>d.prob),x,yp),fill:"none",stroke:"#245f8c","stroke-width":2.2,"stroke-dasharray":"5 4"}));
    weather.forEach((d,i)=>svg.appendChild(svgEl("circle",{cx:x(i),cy:yp(d.prob),r:2.5,fill:"#245f8c"})));

    sim.irrigation.forEach(ev=>{
      svg.appendChild(svgEl("line",{x1:x(ev.day),y1:y(ev.amount),x2:x(ev.day),y2:y(0),stroke:"#d78636","stroke-width":4,opacity:.92}));
      svg.appendChild(svgEl("circle",{cx:x(ev.day),cy:y(ev.amount)-4,r:3.3,fill:"#d78636"}));
    });

    decisionList.forEach(d=>{
      if(d.signal){
        svg.appendChild(svgEl("circle",{cx:x(d.day),cy:y(0)-8,r:6,fill:"#fff",stroke:"#2f8f63","stroke-width":2.5}));
      }
    });

    for(let i=0;i<N;i+=5){
      svg.appendChild(svgEl("text",{x:x(i),y:H-13,"text-anchor":"middle",class:"axistext"},dateLabel(i)));
    }

    const legend=[
      ["#b8d7ec","Forecast rain","bar"],
      ["#3e83b7","Realised rain","bar"],
      ["#245f8c","Rain probability","line"],
      ["#d78636","Example irrigation","bar"],
      ["#2f8f63","Consider delay","circle"]
    ];
    legend.forEach((item,j)=>{
      const xx=430+j*132;
      if(item[2]==="line"){
        svg.appendChild(svgEl("line",{x1:xx,y1:12,x2:xx+15,y2:12,stroke:item[0],"stroke-width":2,"stroke-dasharray":"4 3"}));
      }else if(item[2]==="circle"){
        svg.appendChild(svgEl("circle",{cx:xx+6,cy:12,r:4.5,fill:"#fff",stroke:item[0],"stroke-width":2}));
      }else{
        svg.appendChild(svgEl("rect",{x:xx,y:9,width:13,height:6,rx:2,fill:item[0]}));
      }
      svg.appendChild(svgEl("text",{x:xx+18,y:15,class:"axistext"},item[1]));
    });
  }

  function drawSwd(p,sim,decisionList){
    const svg=$("swdChart");
    while(svg.firstChild)svg.removeChild(svg.firstChild);

    const W=1100,H=300,L=48,R=24,T=24,B=45;
    const plotW=W-L-R,plotH=H-T-B;
    const maxSwd=Math.max(90,p.trigger+20,...sim.rows.map(r=>r.swdAtDecision));
    const x=i=>L+i*plotW/(N-1);
    const y=v=>T+(v/maxSwd)*plotH;

    for(let g=0;g<=4;g++){
      const val=maxSwd*g/4;
      const yy=y(val);
      svg.appendChild(svgEl("line",{x1:L,y1:yy,x2:W-R,y2:yy,class:"gridline"}));
      svg.appendChild(svgEl("text",{x:L-8,y:yy+3,"text-anchor":"end",class:"axistext"},Math.round(val)));
    }
    svg.appendChild(svgEl("text",{x:9,y:17,class:"axistext"},"SWD mm"));

    const ty=y(p.trigger);
    svg.appendChild(svgEl("line",{x1:L,y1:ty,x2:W-R,y2:ty,stroke:"#879c91","stroke-width":1.3,"stroke-dasharray":"6 5"}));
    svg.appendChild(svgEl("text",{x:W-R-5,y:ty-5,"text-anchor":"end",class:"axistext"},"irrigation trigger "+p.trigger+" mm"));

    svg.appendChild(svgEl("path",{d:linePath(sim.rows.map(r=>r.swdEnd),x,y),fill:"none",stroke:"#5f756a","stroke-width":2.5}));

    sim.irrigation.forEach(ev=>{
      const row=sim.rows[ev.day];
      svg.appendChild(svgEl("line",{x1:x(ev.day),y1:y(ev.swdAtDecision),x2:x(ev.day),y2:y(row.swdEnd),stroke:"#d78636","stroke-width":3,opacity:.85}));
      svg.appendChild(svgEl("circle",{cx:x(ev.day),cy:y(ev.swdAtDecision),r:4,fill:"#d78636"}));
    });

    decisionList.forEach(d=>{
      if(d.signal){
        const ev=sim.irrigation.find(e=>e.day===d.day);
        if(ev) svg.appendChild(svgEl("circle",{cx:x(d.day),cy:y(ev.swdAtDecision),r:7,fill:"#fff",stroke:"#2f8f63","stroke-width":2.3}));
      }
    });

    for(let i=0;i<N;i+=5){
      svg.appendChild(svgEl("text",{x:x(i),y:H-12,"text-anchor":"middle",class:"axistext"},dateLabel(i)));
    }
  }

  function drawDecisions(p,sim,list){
    const wrap=$("decisionCards");
    wrap.innerHTML="";

    if(!list.length){
      wrap.innerHTML='<div class="empty-note">No irrigation event occurs in this synthetic example with the current SWD trigger and irrigation amount.</div>';
      return;
    }

    list.forEach(item=>{
      const card=document.createElement("div");
      card.className="decision-card";
      const s=item.signal;
      const signalText=s
        ? `${s.fc.toFixed(0)} mm at ${s.prob}% ${s.ahead===0?"today":"in "+s.ahead+" day"+(s.ahead===1?"":"s")}`
        : `No forecast within ${p.look} day${p.look===1?"":"s"} meets both thresholds`;

      card.innerHTML=`
        <div class="decision-date">${dateLabel(item.day)}</div>
        <div class="decision-row"><b>SWD at decision:</b> ${item.swd.toFixed(0)} mm</div>
        <div class="decision-row"><b>Example baseline:</b> irrigate ${p.irr} mm</div>
        <div class="action ${s?"wait":"irrigate"}">${s?"CONSIDER WAITING":"NO FORECAST SIGNAL"}</div>
        <div class="signal">${signalText}</div>`;
      wrap.appendChild(card);
    });
  }

  function update(){
    const p=params();
    $("swdV").textContent=p.trigger;
    $("irrV").textContent=p.irr;
    $("rainV").textContent=p.rain;
    $("probV").textContent=p.prob;
    $("lookV").textContent=p.look;

    const sim=simulateBaseline(p);
    const list=sim.irrigation.map(ev=>({
      day:ev.day,
      swd:ev.swdAtDecision,
      signal:signalFor(ev.day,p)
    }));
    const flagged=list.filter(d=>d.signal).length;

    $("summaryMain").textContent=`${sim.irrigation.length} example irrigation events; ${flagged} flagged to consider waiting.`;
    $("summarySub").textContent="Changing SWD or irrigation amount changes when irrigation is due; changing forecast settings changes which of those events are flagged.";

    drawWeather(p,sim,list);
    drawSwd(p,sim,list);
    drawDecisions(p,sim,list);
  }

  ["swdTrigger","irrigationAmount","rainThreshold","probThreshold","lookahead"].forEach(id=>$(id).addEventListener("input",update));
  $("randomBtn").addEventListener("click",()=>{
    seed=Math.floor(Math.random()*1e9);
    generateWeather();
    update();
  });

  generateWeather();
  update();
})();
