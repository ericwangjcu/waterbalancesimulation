(() => {
  const N = 32;
  const DECISION_DAYS = [4, 10, 16, 22, 28];
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

  function generateWeather(){
    const rand=mulberry32(seed);
    weather=[];

    for(let i=0;i<N;i++){
      const event=rand()<0.18;
      const actual=event ? Math.max(0,4+rand()*25+gaussian(rand)*3.5) : (rand()<0.08 ? rand()*4 : 0);
      const fc=Math.max(0,actual*(0.65+rand()*0.7)+gaussian(rand)*4.2);
      let prob=actual>5 ? 55+rand()*36 : 15+rand()*50;
      if(rand()<0.10) prob=65+rand()*25;
      weather.push({day:i,actual:+actual.toFixed(1),fc:+fc.toFixed(1),prob:Math.round(clamp(prob,5,95))});
    }

    // Put one plausible forecast opportunity near each example irrigation date.
    // Values deliberately span the slider thresholds so the team can explore the idea.
    DECISION_DAYS.forEach((day,j)=>{
      const ahead=1+(j%2);
      const k=Math.min(N-1,day+ahead);
      const fc=12+rand()*24;
      const prob=55+rand()*37;
      const verifies=rand()<0.72;
      const actual=verifies ? Math.max(0,fc*(0.65+rand()*0.65)) : rand()*4;
      weather[k]={day:k,actual:+actual.toFixed(1),fc:+fc.toFixed(1),prob:Math.round(clamp(prob,5,95))};
    });
  }

  function params(){
    return {
      rain:+$("rainThreshold").value,
      prob:+$("probThreshold").value,
      look:+$("lookahead").value
    };
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

  function decisions(p){
    return DECISION_DAYS.map(day=>({day,signal:signalFor(day,p)}));
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

  function drawChart(p,decisionList){
    const svg=$("weatherChart");
    while(svg.firstChild)svg.removeChild(svg.firstChild);

    const W=1100,H=390,L=48,R=44,T=24,B=55;
    const plotW=W-L-R,plotH=H-T-B;
    const maxRain=Math.max(45,...weather.map(d=>Math.max(d.fc,d.actual)),p.rain+5);
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

    // Threshold reference lines.
    svg.appendChild(svgEl("line",{x1:L,y1:y(p.rain),x2:W-R,y2:y(p.rain),stroke:"#2f8f63","stroke-width":1,"stroke-dasharray":"4 5",opacity:.5}));
    svg.appendChild(svgEl("text",{x:L+6,y:y(p.rain)-5,class:"axistext"},"rain threshold "+p.rain+" mm"));
    svg.appendChild(svgEl("line",{x1:L,y1:yp(p.prob),x2:W-R,y2:yp(p.prob),stroke:"#245f8c","stroke-width":1,"stroke-dasharray":"2 5",opacity:.5}));
    svg.appendChild(svgEl("text",{x:W-R-5,y:yp(p.prob)-5,"text-anchor":"end",class:"axistext"},"probability threshold "+p.prob+"%"));

    // Irrigation decision dates.
    DECISION_DAYS.forEach(day=>{
      svg.appendChild(svgEl("line",{x1:x(day),y1:T,x2:x(day),y2:T+plotH,stroke:"#9aa69f","stroke-width":1.4,"stroke-dasharray":"5 5",opacity:.55}));
      svg.appendChild(svgEl("text",{x:x(day),y:T+plotH+17,"text-anchor":"middle",class:"axistext"},"irrigation due"));
    });

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

    // Green circle at an irrigation date means the forecast rule would flag 'consider waiting'.
    decisionList.forEach(d=>{
      if(d.signal){
        svg.appendChild(svgEl("circle",{cx:x(d.day),cy:T+plotH-8,r:6,fill:"#fff",stroke:"#2f8f63","stroke-width":2.5}));
      }
    });

    for(let i=0;i<N;i+=4){
      svg.appendChild(svgEl("text",{x:x(i),y:H-13,"text-anchor":"middle",class:"axistext"},dateLabel(i)));
    }

    const legend=[
      ["#b8d7ec","Forecast rain","bar"],
      ["#3e83b7","Realised rain","bar"],
      ["#245f8c","Rain probability","line"],
      ["#2f8f63","Forecast may justify waiting","circle"]
    ];
    legend.forEach((item,j)=>{
      const xx=560+j*132;
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

  function drawDecisions(p,list){
    const wrap=$("decisionCards");
    wrap.innerHTML="";

    list.forEach(item=>{
      const card=document.createElement("div");
      card.className="decision-card";
      const s=item.signal;
      const signalText=s
        ? `${s.fc.toFixed(0)} mm at ${s.prob}% in ${s.ahead===0?"today":s.ahead+" day"+(s.ahead===1?"":"s")}`
        : `No forecast within ${p.look} day${p.look===1?"":"s"} meets both thresholds`;
      const actualText=s ? `Realised rain on that day: ${s.actual.toFixed(1)} mm` : "";

      card.innerHTML=`
        <div class="decision-date">${dateLabel(item.day)}</div>
        <div class="decision-row"><b>Baseline:</b> irrigate when due</div>
        <div class="decision-row"><b>Forecast check:</b></div>
        <div class="action ${s?"wait":"irrigate"}">${s?"CONSIDER WAITING":"IRRIGATE NOW"}</div>
        <div class="signal">${signalText}${actualText?"<br>"+actualText:""}</div>`;
      wrap.appendChild(card);
    });
  }

  function update(){
    const p=params();
    $("rainV").textContent=p.rain;
    $("probV").textContent=p.prob;
    $("lookV").textContent=p.look;

    const list=decisions(p);
    const flagged=list.filter(d=>d.signal).length;
    $("summaryMain").textContent=`${flagged} of ${list.length} example irrigation dates are flagged to consider waiting.`;
    $("summarySub").textContent=flagged
      ? "Change the three forecast controls to see which dates move in or out of the discussion set."
      : "No example irrigation date currently has a forecast meeting both thresholds.";

    drawChart(p,list);
    drawDecisions(p,list);
  }

  ["rainThreshold","probThreshold","lookahead"].forEach(id=>$(id).addEventListener("input",update));
  $("randomBtn").addEventListener("click",()=>{
    seed=Math.floor(Math.random()*1e9);
    generateWeather();
    update();
  });

  generateWeather();
  update();
})();
