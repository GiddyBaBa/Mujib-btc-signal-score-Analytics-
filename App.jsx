import { useState } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, Tooltip, ResponsiveContainer } from "recharts";

// ─── TYPOGRAPHY ──────────────────────────────────────────────────────────────
const T = {
  xs:    { fontSize: 12, color: "#94a3b8" },
  sm:    { fontSize: 14, color: "#cbd5e1" },
  base:  { fontSize: 16, color: "#e2e8f0" },
  label: { fontSize: 12, color: "#94a3b8", letterSpacing: 1, textTransform: "uppercase", fontWeight: 700 },
  mono:  { fontFamily: "monospace" },
};

// ─── PILLARS ─────────────────────────────────────────────────────────────────
const PILLARS = [
  { id:"onchain",    label:"On-Chain Cycle",    weight:0.30, color:"#f59e0b",
    metrics:[
      {id:"lth_mvrv", label:"LTH-MVRV Z-Score", subweight:0.40, description:"Primary cycle top/bottom signal"},
      {id:"lth_sopr", label:"LTH-SOPR",          subweight:0.33, description:"Long-term holder selling behavior"},
      {id:"sth_sopr", label:"STH-SOPR",          subweight:0.17, description:"Short-term sentiment pressure"},
      {id:"nupl",     label:"NUPL",               subweight:0.10, description:"Unrealized profit/loss ratio"},
    ]},
  { id:"macro",      label:"Macro & Liquidity", weight:0.28, color:"#818cf8",
    metrics:[
      {id:"global_m2",   label:"Global M2 Trend",     subweight:0.46, description:"G4 central banks ~12wk leading"},
      {id:"fed_posture", label:"Fed Rate Posture",     subweight:0.29, description:"Pivot signal / tightening pressure"},
      {id:"dxy",         label:"DXY Direction",        subweight:0.14, description:"Dollar strength (inverse BTC)"},
      {id:"regulatory",  label:"Regulatory Outlook",   subweight:0.11, description:"Legal rails for institutional capital"},
    ]},
  { id:"stablecoin", label:"Stablecoin Powder", weight:0.22, color:"#34d399",
    metrics:[
      {id:"ssr",        label:"SSR Ratio",           subweight:0.45, description:"Low = high buying capacity vs mcap"},
      {id:"sc_supply",  label:"Stablecoin Supply",   subweight:0.32, description:"New capital entering ecosystem"},
      {id:"sc_inflows", label:"Exchange Inflows",    subweight:0.23, description:"Near-term buying intent"},
    ]},
  { id:"etf",        label:"ETF & Inst. Flows", weight:0.13, color:"#60a5fa",
    metrics:[
      {id:"etf_flow",   label:"ETF Net Flow (7d)",   subweight:0.54, description:"Best institutional demand proxy"},
      {id:"etf_aum",    label:"ETF AUM Trend",       subweight:0.23, description:"Structural demand floor"},
      {id:"futures_oi", label:"Futures OI/Funding",  subweight:0.23, description:"Leverage (contrarian at extremes)"},
    ]},
  { id:"residual",   label:"Residual Signals",  weight:0.07, color:"#f472b6",
    metrics:[
      {id:"miner",        label:"Miner/Hash Ribbon",  subweight:0.43, description:"Post-halving supply-side signal"},
      {id:"exchange_res", label:"Exchange Reserves",  subweight:0.29, description:"Supply shock potential"},
      {id:"sentiment",    label:"Fear & Greed",       subweight:0.28, description:"Contrarian at extremes"},
    ]},
];

// ─── CURRENT SCORES ───────────────────────────────────────────────────────────
const CURRENT_SCORES = {
  lth_mvrv:25, lth_sopr:10, sth_sopr:15, nupl:20,
  global_m2:-20, fed_posture:-35, dxy:-10, regulatory:30,
  ssr:60, sc_supply:-15, sc_inflows:10,
  etf_flow:-65, etf_aum:-40, futures_oi:20,
  miner:30, exchange_res:25, sentiment:35,
};

const CURRENT_RATIONALE = {
  lth_mvrv:"Z-Score ~0.41 — fair value, not overheated",
  lth_sopr:"Briefly below 1.0 in early June — capitulation stabilising",
  sth_sopr:"STH under mild pressure; recovering from fear lows",
  nupl:"~0.28 — Hope/Fear zone, not euphoria",
  global_m2:"US M2 declining ~$79B/month; G4 below trend",
  fed_posture:"Fed held 3.5–3.75%; Warsh hawkish; hike risk elevated",
  dxy:"DXY firm on rate hold — mild BTC headwind",
  regulatory:"Spot ETF infrastructure mature; legislative progress positive",
  ssr:"SSR RSI at 13 — extreme dry powder vs BTC mcap",
  sc_supply:"USDT contracted ~$3.6B since Dec 2025 peak",
  sc_inflows:"Tentative stabilisation; early signs of rotation",
  etf_flow:"$4.4B outflow streak ended June 5; recovery fragile",
  etf_aum:"AUM fell $104B→$80B — significant erosion",
  futures_oi:"OI flushed — deleveraging = contrarian bullish",
  miner:"Post-halving economics stabilising; hash ribbon neutral+",
  exchange_res:"BTC exchange reserves declining — supply squeeze building",
  sentiment:"Fear & Greed 15 (Extreme Fear) — strong contrarian buy",
};

// ─── HISTORY ─────────────────────────────────────────────────────────────────
const HISTORY = [
  {date:"Jan 2019", bss:-72, btcAt:3500,   btc90d:5200,   r90:48.6,  label:"Post-2018 bottom",    phase:"Capitulation",   p:{onchain:-80,macro:-60,stablecoin:-50,etf:-70,residual:-80}},
  {date:"Jun 2019", bss:58,  btcAt:8000,   btc90d:7800,   r90:-2.5,  label:"2019 rally peak",     phase:"Late Bull",      p:{onchain:65,macro:55,stablecoin:60,etf:45,residual:60}},
  {date:"Mar 2020", bss:-68, btcAt:5000,   btc90d:10500,  r90:110.0, label:"COVID crash",         phase:"Capitulation",   p:{onchain:-75,macro:-70,stablecoin:-55,etf:-60,residual:-75}},
  {date:"Oct 2020", bss:45,  btcAt:11000,  btc90d:32000,  r90:190.9, label:"Pre-bull breakout",   phase:"Accumulation",   p:{onchain:50,macro:60,stablecoin:55,etf:25,residual:40}},
  {date:"Jan 2021", bss:71,  btcAt:30000,  btc90d:55000,  r90:83.3,  label:"Bull run early",      phase:"Early Bull",     p:{onchain:75,macro:65,stablecoin:70,etf:70,residual:65}},
  {date:"Apr 2021", bss:82,  btcAt:58000,  btc90d:47000,  r90:-19.0, label:"Cycle top zone",      phase:"Late Bull",      p:{onchain:85,macro:70,stablecoin:80,etf:90,residual:85}},
  {date:"Jul 2021", bss:22,  btcAt:33000,  btc90d:62000,  r90:87.9,  label:"Mid-cycle dip",       phase:"Accumulation",   p:{onchain:20,macro:30,stablecoin:35,etf:15,residual:20}},
  {date:"Nov 2021", bss:78,  btcAt:65000,  btc90d:38000,  r90:-41.5, label:"ATH — cycle top",     phase:"Distribution",   p:{onchain:80,macro:65,stablecoin:75,etf:85,residual:80}},
  {date:"Jun 2022", bss:-75, btcAt:20000,  btc90d:19500,  r90:-2.5,  label:"Luna/3AC crash",      phase:"Bear Market",    p:{onchain:-80,macro:-75,stablecoin:-65,etf:-70,residual:-80}},
  {date:"Nov 2022", bss:-81, btcAt:16000,  btc90d:25000,  r90:56.3,  label:"FTX collapse bottom", phase:"Capitulation",   p:{onchain:-85,macro:-75,stablecoin:-70,etf:-80,residual:-85}},
  {date:"Mar 2023", bss:18,  btcAt:26000,  btc90d:29000,  r90:11.5,  label:"Banking crisis rally",phase:"Recovery",       p:{onchain:20,macro:15,stablecoin:25,etf:10,residual:20}},
  {date:"Oct 2023", bss:35,  btcAt:34000,  btc90d:52000,  r90:52.9,  label:"ETF anticipation",    phase:"Accumulation",   p:{onchain:40,macro:35,stablecoin:40,etf:30,residual:35}},
  {date:"Jan 2024", bss:55,  btcAt:42000,  btc90d:70000,  r90:66.7,  label:"ETF launch",          phase:"Early Bull",     p:{onchain:55,macro:50,stablecoin:55,etf:65,residual:55}},
  {date:"Mar 2024", bss:76,  btcAt:70000,  btc90d:58000,  r90:-17.1, label:"Pre-halving ATH",     phase:"Late Bull",      p:{onchain:80,macro:65,stablecoin:70,etf:85,residual:75}},
  {date:"Aug 2024", bss:30,  btcAt:58000,  btc90d:98000,  r90:68.9,  label:"Halving cooldown",    phase:"Accumulation",   p:{onchain:35,macro:40,stablecoin:35,etf:20,residual:30}},
  {date:"Oct 2025", bss:74,  btcAt:108000, btc90d:72000,  r90:-33.3, label:"2025 ATH peak",       phase:"Distribution",   p:{onchain:75,macro:65,stablecoin:70,etf:80,residual:75}},
  {date:"Feb 2026", bss:-28, btcAt:68000,  btc90d:null,   r90:null,  label:"Post-ATH correction", phase:"Bear Market",    p:{onchain:-25,macro:-35,stablecoin:-20,etf:-30,residual:-25}},
];

const SIGNAL_LABELS = [
  {min:70,  max:100, label:"Strong Bull Setup",      color:"#10b981"},
  {min:40,  max:70,  label:"Moderate Bull Bias",     color:"#34d399"},
  {min:10,  max:40,  label:"Mild Tailwind",          color:"#6ee7b7"},
  {min:-10, max:10,  label:"Noise Zone",             color:"#94a3b8"},
  {min:-40, max:-10, label:"Mild Headwind",          color:"#fbbf24"},
  {min:-70, max:-40, label:"Moderate Bear Pressure", color:"#fb923c"},
  {min:-100,max:-70, label:"High Conviction Bear",   color:"#f87171"},
];
const PHASE_COLORS = {
  "Capitulation":"#f87171","Bear Market":"#fb923c","Recovery":"#fbbf24",
  "Accumulation":"#6ee7b7","Early Bull":"#34d399","Mid Cycle":"#34d399",
  "Late Bull":"#f59e0b","Distribution":"#ef4444","Uncertain":"#94a3b8",
};

const getSignal = s => SIGNAL_LABELS.find(l => s >= l.min && s <= l.max) || SIGNAL_LABELS[3];

function computeBSS(values) {
  return PILLARS.reduce((t,p) => {
    const ps = p.metrics.reduce((a,m) => a+(values[m.id]||0)*m.subweight, 0);
    return t + ps*p.weight;
  }, 0);
}

function computeRecalibratedBSS(pillarScores) {
  const completed = HISTORY.filter(h => h.r90 !== null);
  const pillarAcc = PILLARS.map(p => {
    let correct = 0;
    completed.forEach(h => {
      const ps = h.p[p.id];
      if (ps > 15 && h.r90 > 0) correct++;
      else if (ps < -15 && h.r90 < 0) correct++;
      else if (Math.abs(ps) <= 15) correct += 0.5;
    });
    return {id:p.id, accuracy:correct/completed.length};
  });
  const totalAcc = pillarAcc.reduce((s,p) => s+p.accuracy, 0);
  const recalibrated = pillarAcc.map(p => ({
    ...p,
    adjustedWeight: p.accuracy/totalAcc,
    originalWeight: PILLARS.find(pl=>pl.id===p.id).weight,
  }));
  const recalBSS = recalibrated.reduce((t,p) => {
    const ps = pillarScores.find(s=>s.id===p.id)?.score||0;
    return t + ps*p.adjustedWeight;
  }, 0);
  return {recalBSS, recalibrated};
}

function computePercentile(bss) {
  const all = HISTORY.map(h=>h.bss).sort((a,b)=>a-b);
  return Math.round((all.filter(b=>b<bss).length/all.length)*100);
}

function findAnalogues(pillarScores, currentBSS) {
  const current = Object.fromEntries(pillarScores.map(p=>[p.id,p.score]));
  const completed = HISTORY.filter(h=>h.r90!==null);
  const scored = completed.map(h => {
    const dist = PILLARS.reduce((s,p) => {
      const diff=(current[p.id]||0)-(h.p[p.id]||0);
      return s+diff*diff*p.weight;
    },0);
    return {...h, similarity:Math.round((1-Math.sqrt(dist)/200)*100)};
  }).sort((a,b)=>b.similarity-a.similarity).slice(0,3);

  let phase="Noise Zone";
  if (currentBSS<-60) phase="Capitulation";
  else if (currentBSS<-20) phase="Bear Market";
  else if (currentBSS<15) phase="Accumulation";
  else if (currentBSS<45) phase="Early Bull";
  else if (currentBSS<70) phase="Mid Cycle";
  else phase="Distribution";

  const returns = scored.map(h=>h.r90);
  return {
    analogues:scored, phase,
    returnRange:{lo:Math.min(...returns), hi:Math.max(...returns), avg:returns.reduce((s,r)=>s+r,0)/returns.length}
  };
}

// ─── SCATTER CHART (pure SVG, no libraries) ──────────────────────────────────
function ScatterPlot({ data, nowBSS, showLabels }) {
  const W=320, H=280, L=50, R=12, Top=14, Bot=42;
  const pW=W-L-R, pH=H-Top-Bot;
  const toX = b => L+((b+100)/200)*pW;
  const toY = r => Top+(1-(r+60)/260)*pH;

  const SHORT = {
    "Jan 2019":"2018 Bottom","Jun 2019":"2019 Peak",
    "Mar 2020":"COVID Crash","Oct 2020":"Pre-Bull",
    "Jan 2021":"Bull Start", "Apr 2021":"Apr'21 Top",
    "Jul 2021":"Mid Dip",   "Nov 2021":"ATH '21",
    "Jun 2022":"Luna Crash","Nov 2022":"FTX Bottom",
    "Mar 2023":"Bank Rally","Oct 2023":"ETF Hype",
    "Jan 2024":"ETF Launch","Mar 2024":"'24 ATH",
    "Aug 2024":"Post-Halving","Oct 2025":"ATH '25",
  };

  return (
    <svg width="100%" viewBox={"0 0 "+W+" "+H}>
      {/* plot background */}
      <rect x={L} y={Top} width={pW} height={pH} fill="#0f172a" rx="3"/>

      {/* grid */}
      <line x1={L} x2={W-R} y1={toY(50)}  y2={toY(50)}  stroke="#1e3a5f" strokeWidth="1"/>
      <line x1={L} x2={W-R} y1={toY(100)} y2={toY(100)} stroke="#1e3a5f" strokeWidth="1"/>
      <line x1={L} x2={W-R} y1={toY(150)} y2={toY(150)} stroke="#1e3a5f" strokeWidth="1"/>
      <line x1={L} x2={W-R} y1={toY(-30)} y2={toY(-30)} stroke="#1e3a5f" strokeWidth="1"/>
      <line x1={toX(-50)} x2={toX(-50)} y1={Top} y2={H-Bot} stroke="#1e3a5f" strokeWidth="1"/>
      <line x1={toX(50)}  x2={toX(50)}  y1={Top} y2={H-Bot} stroke="#1e3a5f" strokeWidth="1"/>

      {/* zero axes */}
      <line x1={L} x2={W-R} y1={toY(0)}  y2={toY(0)}  stroke="#475569" strokeWidth="2" strokeDasharray="5 3"/>
      <line x1={toX(0)} x2={toX(0)} y1={Top} y2={H-Bot} stroke="#475569" strokeWidth="2" strokeDasharray="5 3"/>

      {/* NOW line */}
      {nowBSS !== undefined && (
        <line x1={toX(nowBSS)} x2={toX(nowBSS)} y1={Top} y2={H-Bot} stroke="#ffffff" strokeWidth="2" strokeDasharray="4 3"/>
      )}
      {nowBSS !== undefined && (
        <text x={toX(nowBSS)} y={Top-3} textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">NOW</text>
      )}

      {/* dots */}
      {data.map(h => (
        <circle
          key={h.date}
          cx={toX(h.bss)}
          cy={toY(h.r90)}
          r="7"
          fill={h.r90>=0 ? "#818cf8" : "#f87171"}
          stroke="#0f172a"
          strokeWidth="2"
        />
      ))}

      {/* labels on dots if requested */}
      {showLabels && data.map(h => (
        <text
          key={h.date+"l"}
          x={toX(h.bss)+9}
          y={toY(h.r90)+4}
          fill="#94a3b8"
          fontSize="8"
        >{SHORT[h.date]||h.date}</text>
      ))}

      {/* Y axis labels */}
      <text x={L-4} y={toY(150)+4} textAnchor="end" fill="#94a3b8" fontSize="10">+150%</text>
      <text x={L-4} y={toY(100)+4} textAnchor="end" fill="#94a3b8" fontSize="10">+100%</text>
      <text x={L-4} y={toY(50)+4}  textAnchor="end" fill="#94a3b8" fontSize="10">+50%</text>
      <text x={L-4} y={toY(0)+4}   textAnchor="end" fill="#94a3b8" fontSize="10">0%</text>
      <text x={L-4} y={toY(-30)+4} textAnchor="end" fill="#94a3b8" fontSize="10">-30%</text>

      {/* X axis labels */}
      <text x={toX(-100)} y={H-Bot+14} textAnchor="middle" fill="#94a3b8" fontSize="10">-100</text>
      <text x={toX(-50)}  y={H-Bot+14} textAnchor="middle" fill="#94a3b8" fontSize="10">-50</text>
      <text x={toX(0)}    y={H-Bot+14} textAnchor="middle" fill="#94a3b8" fontSize="10">0</text>
      <text x={toX(50)}   y={H-Bot+14} textAnchor="middle" fill="#94a3b8" fontSize="10">+50</text>
      <text x={toX(100)}  y={H-Bot+14} textAnchor="middle" fill="#94a3b8" fontSize="10">+100</text>

      <text x={W/2} y={H-4} textAnchor="middle" fill="#64748b" fontSize="10">BSS Score  (left=Bearish · right=Bullish)</text>
    </svg>
  );
}

// ─── PILLAR CARD ─────────────────────────────────────────────────────────────
function PillarCard({pillar, values, onChange, adjustedWeight}) {
  const [open, setOpen] = useState(false);
  const score = pillar.metrics.reduce((a,m)=>a+(values[m.id]||0)*m.subweight,0);
  const pct = ((score+100)/200)*100;
  const delta = adjustedWeight ? adjustedWeight-pillar.weight : 0;
  return (
    <div style={{background:"#1e293b",border:"1px solid "+pillar.color+"44",borderRadius:14,padding:"16px 18px",marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div>
          <span style={{color:pillar.color,fontWeight:800,fontSize:15}}>{pillar.label}</span>
          <span style={{...T.xs,marginLeft:10}}>
            {(pillar.weight*100).toFixed(0)}%
            {adjustedWeight && <span style={{color:delta>0.01?"#34d399":delta<-0.01?"#f87171":"#94a3b8",marginLeft:6,fontWeight:700}}>→ {(adjustedWeight*100).toFixed(0)}%</span>}
          </span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{background:pillar.color+"20",border:"1px solid "+pillar.color+"55",borderRadius:8,padding:"4px 12px",color:pillar.color,fontWeight:900,fontSize:18,fontFamily:"monospace"}}>
            {score>=0?"+":""}{score.toFixed(1)}
          </span>
          <span style={{color:"#475569",fontSize:18}}>{open?"▾":"▸"}</span>
        </div>
      </div>
      <div style={{height:4,background:"#0f172a",borderRadius:4,marginTop:12,position:"relative"}}>
        <div style={{position:"absolute",left:"50%",top:-1,width:1,height:6,background:"#334155"}}/>
        <div style={{position:"absolute",left:score>=0?"50%":pct+"%",width:Math.abs(score)/2+"%",height:4,background:score>=0?pillar.color:"#f87171",borderRadius:4,transition:"all 0.3s"}}/>
      </div>
      {open && (
        <div style={{marginTop:16}}>
          {pillar.metrics.map(m=>(
            <div key={m.id} style={{background:"#0f172a",borderRadius:10,padding:"12px 14px",marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <div>
                  <div style={{...T.base,fontWeight:700,color:"#f1f5f9"}}>{m.label}</div>
                  <div style={{...T.xs,color:"#64748b"}}>{m.description} · sub-wt {(m.subweight*100).toFixed(0)}%</div>
                </div>
                <span style={{color:values[m.id]>=0?"#34d399":"#f87171",fontFamily:"monospace",fontSize:20,fontWeight:900}}>
                  {values[m.id]>=0?"+":""}{values[m.id]}
                </span>
              </div>
              <input type="range" min={-100} max={100} step={5} value={values[m.id]||0}
                onChange={e=>onChange(m.id,Number(e.target.value))}
                style={{width:"100%",accentColor:pillar.color,cursor:"pointer",height:6}}/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
                <span style={{...T.sm,color:"#f87171"}}>−100 Bear</span>
                <span style={{...T.sm,color:"#64748b"}}>0</span>
                <span style={{...T.sm,color:"#34d399"}}>+100 Bull</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── HYBRID PANEL ─────────────────────────────────────────────────────────────
function HybridPanel({bss, pillarScores}) {
  const {recalBSS, recalibrated} = computeRecalibratedBSS(pillarScores);
  const percentile = computePercentile(bss);
  const {analogues, phase, returnRange} = findAnalogues(pillarScores, bss);
  const blended = bss*0.4 + recalBSS*0.35 + (percentile-50)*0.5*0.25;
  const blendedSig = getSignal(blended);
  const phaseColor = PHASE_COLORS[phase]||"#94a3b8";
  const completed = HISTORY.filter(h=>h.r90!==null);

  const radarData = PILLARS.map(p=>({
    pillar: p.label.split(" ")[0],
    current: pillarScores.find(s=>s.id===p.id)?.score||0,
    avg: Math.round(analogues.reduce((s,a)=>s+(a.p[p.id]||0),0)/analogues.length),
  }));

  return (
    <div>
      {/* Blended score */}
      <div style={{background:"#1e293b",border:"1px solid #334155",borderRadius:16,padding:"24px 20px",marginBottom:16,textAlign:"center"}}>
        <div style={{...T.label,marginBottom:8}}>🔀 Hybrid Intelligence Score</div>
        <div style={{...T.xs,color:"#64748b",marginBottom:16}}>Raw BSS (40%) + Recalibrated BSS (35%) + Historical Percentile (25%)</div>
        <div style={{display:"flex",justifyContent:"center",gap:16,flexWrap:"wrap",marginBottom:20}}>
          {[
            {label:"Raw BSS",    val:bss,        color:getSignal(bss).color,    fmt:v=>`${v>=0?"+":""}${v.toFixed(1)}`},
            {label:"Recal BSS",  val:recalBSS,   color:getSignal(recalBSS).color,fmt:v=>`${v>=0?"+":""}${v.toFixed(1)}`},
            {label:"Percentile", val:percentile,  color:percentile<30?"#34d399":percentile>70?"#f87171":"#94a3b8", fmt:v=>`${v}th`},
          ].map(s=>(
            <div key={s.label} style={{background:"#0f172a",borderRadius:12,padding:"14px 18px",textAlign:"center",minWidth:100}}>
              <div style={{...T.xs,marginBottom:4}}>{s.label}</div>
              <div style={{color:s.color,fontFamily:"monospace",fontSize:24,fontWeight:900}}>{s.fmt(s.val)}</div>
            </div>
          ))}
        </div>
        <div style={{fontSize:64,fontWeight:900,fontFamily:"monospace",color:blendedSig.color,lineHeight:1}}>
          {blended>=0?"+":""}{blended.toFixed(1)}
        </div>
        <div style={{display:"inline-block",background:blendedSig.color+"22",border:"1px solid "+blendedSig.color+"55",color:blendedSig.color,fontWeight:800,fontSize:16,padding:"8px 22px",borderRadius:999,marginTop:10}}>
          {blendedSig.label}
        </div>
      </div>

      {/* Phase + Return range */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
        <div style={{background:"#1e293b",border:"1px solid "+phaseColor+"44",borderRadius:14,padding:"18px 16px"}}>
          <div style={{...T.label,marginBottom:8}}>Cycle Phase</div>
          <div style={{color:phaseColor,fontSize:22,fontWeight:900,marginBottom:6}}>{phase}</div>
          <div style={{...T.sm,color:"#64748b"}}>Detected from pillar pattern vs historical phase signatures</div>
        </div>
        <div style={{background:"#1e293b",border:"1px solid #334155",borderRadius:14,padding:"18px 16px"}}>
          <div style={{...T.label,marginBottom:8}}>Analogue 90d Range</div>
          <div style={{color:"#34d399",fontFamily:"monospace",fontSize:17,fontWeight:800}}>High: +{returnRange.hi}%</div>
          <div style={{color:"#f59e0b",fontFamily:"monospace",fontSize:22,fontWeight:900,margin:"4px 0"}}>{returnRange.avg>=0?"+":""}{returnRange.avg.toFixed(0)}% avg</div>
          <div style={{color:returnRange.lo>=0?"#34d399":"#f87171",fontFamily:"monospace",fontSize:17,fontWeight:800}}>Low: {returnRange.lo>=0?"+":""}{returnRange.lo}%</div>
        </div>
      </div>

      {/* Analogues */}
      <div style={{background:"#1e293b",border:"1px solid #334155",borderRadius:14,padding:"20px",marginBottom:16}}>
        <div style={{...T.label,marginBottom:12}}>3 Closest Historical Analogues</div>
        {analogues.map((a,i)=>(
          <div key={a.date} style={{background:"#0f172a",borderRadius:10,padding:"14px 16px",marginBottom:10,border:"1px solid "+(i===0?"#f59e0b44":"#1e293b")}}>
            <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                  {i===0&&<span style={{background:"#f59e0b22",color:"#f59e0b",fontSize:11,padding:"2px 8px",borderRadius:20,fontWeight:700}}>CLOSEST</span>}
                  <span style={{...T.base,fontWeight:800,color:"#f1f5f9"}}>{a.date}</span>
                  <span style={{...T.sm,color:"#64748b"}}>{a.label}</span>
                </div>
                <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                  <span style={{...T.sm}}>BTC ${a.btcAt.toLocaleString()}</span>
                  <span style={{...T.sm,color:"#64748b"}}>BSS {a.bss>=0?"+":""}{a.bss}</span>
                  <span style={{background:(PHASE_COLORS[a.phase]||"#94a3b8")+"22",color:PHASE_COLORS[a.phase]||"#94a3b8",fontSize:12,padding:"2px 8px",borderRadius:20,fontWeight:700}}>{a.phase}</span>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{...T.xs}}>Similarity</div>
                <div style={{color:"#f59e0b",fontFamily:"monospace",fontSize:20,fontWeight:900}}>{a.similarity}%</div>
                <div style={{...T.xs,marginTop:4}}>90d outcome</div>
                <div style={{color:a.r90>=0?"#34d399":"#f87171",fontFamily:"monospace",fontSize:20,fontWeight:900}}>{a.r90>=0?"+":""}{a.r90}%</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Scatter — labelled with NOW line */}
      <div style={{background:"#1e293b",border:"1px solid #334155",borderRadius:14,padding:"20px",marginBottom:16}}>
        <div style={{...T.label,marginBottom:6}}>BSS vs 90-Day Return — All Events Labelled</div>
        <div style={{...T.sm,color:"#64748b",marginBottom:4}}>🟡 Gold ring = your 3 closest analogues · ⬜ White line = NOW</div>
        <div style={{position:"relative"}}>
          <ScatterPlot data={completed} nowBSS={bss} showLabels={true} />
          {/* Gold rings on analogues overlaid */}
          <svg style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none"}} viewBox="0 0 320 280">
            {analogues.map(a=>{
              const L=50,R=12,Top=14,Bot=42,W=320,H=280;
              const pW=W-L-R, pH=H-Top-Bot;
              const toX=b=>L+((b+100)/200)*pW;
              const toY=r=>Top+(1-(r+60)/260)*pH;
              return <circle key={a.date} cx={toX(a.bss)} cy={toY(a.r90)} r="12" fill="none" stroke="#fbbf24" strokeWidth="2.5" opacity="0.9"/>;
            })}
          </svg>
        </div>
        <div style={{display:"flex",gap:20,marginTop:10,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:12,height:12,borderRadius:"50%",background:"#818cf8"}}/><span style={{...T.sm}}>Price rose after</span></div>
          <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:12,height:12,borderRadius:"50%",background:"#f87171"}}/><span style={{...T.sm}}>Price fell after</span></div>
          <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:12,height:12,borderRadius:"50%",border:"2px solid #fbbf24"}}/><span style={{...T.sm}}>Your analogue</span></div>
        </div>
      </div>

      {/* Radar */}
      <div style={{background:"#1e293b",border:"1px solid #334155",borderRadius:14,padding:"20px",marginBottom:16}}>
        <div style={{...T.label,marginBottom:6}}>Current vs Analogue Pillar Profile</div>
        <div style={{...T.sm,color:"#64748b",marginBottom:12}}>Blue = current · Orange = average of 3 closest analogues</div>
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#334155"/>
            <PolarAngleAxis dataKey="pillar" tick={{fill:"#94a3b8",fontSize:12}}/>
            <Radar name="Current" dataKey="current" stroke="#818cf8" fill="#818cf8" fillOpacity={0.25}/>
            <Radar name="Analogues" dataKey="avg" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2}/>
            <Tooltip contentStyle={{background:"#1e293b",border:"1px solid #334155",borderRadius:8,fontSize:13}}/>
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Weight recalibration */}
      <div style={{background:"#1e293b",border:"1px solid #334155",borderRadius:14,padding:"20px"}}>
        <div style={{...T.label,marginBottom:12}}>Weight Recalibration (Strategy 1)</div>
        {recalibrated.map(r=>{
          const p=PILLARS.find(pl=>pl.id===r.id);
          const delta=r.adjustedWeight-r.originalWeight;
          return (
            <div key={r.id} style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
              <div style={{minWidth:120,...T.sm,color:p.color,fontWeight:700}}>{p.label.split(" ").slice(0,2).join(" ")}</div>
              <div style={{flex:1,height:8,background:"#0f172a",borderRadius:4,position:"relative"}}>
                <div style={{position:"absolute",left:0,height:8,width:r.originalWeight*100*2.5+"%",background:p.color+"55",borderRadius:4}}/>
                <div style={{position:"absolute",left:0,height:8,width:r.adjustedWeight*100*2.5+"%",background:p.color,borderRadius:4}}/>
              </div>
              <div style={{minWidth:100,textAlign:"right"}}>
                <span style={{...T.sm,color:"#64748b"}}>{(r.originalWeight*100).toFixed(0)}%</span>
                <span style={{...T.sm,color:delta>0.01?"#34d399":delta<-0.01?"#f87171":"#94a3b8",marginLeft:6,fontWeight:700}}>→ {(r.adjustedWeight*100).toFixed(0)}%</span>
              </div>
              <div style={{minWidth:50,...T.xs,textAlign:"right"}}>{(r.accuracy*100).toFixed(0)}% acc</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── BACKTEST PANEL ───────────────────────────────────────────────────────────
function BacktestPanel() {
  const completed = HISTORY.filter(h=>h.r90!==null);
  const bullCalls   = completed.filter(h=>h.bss>40);
  const bullCorrect = bullCalls.filter(h=>h.r90>0);
  const bearCalls   = completed.filter(h=>h.bss<-40);
  const bearCorrect = bearCalls.filter(h=>h.r90<0);

  return (
    <div>
      {/* Accuracy cards */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
        {[
          {label:"Bull Accuracy",value:`${bullCalls.length?((bullCorrect.length/bullCalls.length)*100).toFixed(0):"—"}%`,sub:`${bullCorrect.length}/${bullCalls.length} correct (BSS>40)`,color:"#34d399"},
          {label:"Bear Accuracy",value:`${bearCalls.length?((bearCorrect.length/bearCalls.length)*100).toFixed(0):"—"}%`,sub:`${bearCorrect.length}/${bearCalls.length} correct (BSS<−40)`,color:"#f87171"},
          {label:"Data Points",  value:completed.length, sub:"Snapshots with known 90d outcomes",color:"#818cf8"},
        ].map(c=>(
          <div key={c.label} style={{background:"#1e293b",border:"1px solid "+c.color+"44",borderRadius:14,padding:"16px 12px",textAlign:"center"}}>
            <div style={{color:c.color,fontSize:34,fontWeight:900,fontFamily:"monospace"}}>{c.value}</div>
            <div style={{...T.sm,fontWeight:700,color:"#f1f5f9",marginTop:6}}>{c.label}</div>
            <div style={{...T.xs,marginTop:4,lineHeight:1.5}}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Scatter */}
      <div style={{background:"#1e293b",border:"1px solid #334155",borderRadius:14,padding:"20px",marginBottom:16}}>
        <div style={{...T.label,marginBottom:6}}>BSS Score vs 90-Day Return</div>
        <div style={{...T.sm,color:"#64748b",marginBottom:12}}>
          Each dot = one historical moment. Up = price rose. Down = price fell.
          For full labels see the 🔀 Hybrid Intel tab.
        </div>
        <ScatterPlot data={completed} showLabels={false} />
        <div style={{display:"flex",gap:20,marginTop:12,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:12,height:12,borderRadius:"50%",background:"#818cf8"}}/><span style={{...T.sm}}>Price rose after</span></div>
          <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:12,height:12,borderRadius:"50%",background:"#f87171"}}/><span style={{...T.sm}}>Price fell after</span></div>
        </div>
      </div>

      {/* Table */}
      <div style={{background:"#1e293b",border:"1px solid #334155",borderRadius:14,padding:"20px"}}>
        <div style={{...T.label,marginBottom:14}}>Full Historical Record</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{borderBottom:"2px solid #334155"}}>
                {["Date","BSS","Zone","Phase","BTC Price","90d Later","Return","Context"].map(h=>(
                  <th key={h} style={{...T.sm,color:"#94a3b8",fontWeight:700,padding:"10px 10px",textAlign:"left",whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HISTORY.map((h,i)=>{
                const sig=getSignal(h.bss);
                const pc=PHASE_COLORS[h.phase]||"#94a3b8";
                return (
                  <tr key={i} style={{borderBottom:"1px solid #1e293b",background:i%2===0?"#1e293b":"#243044"}}>
                    <td style={{...T.base,padding:"10px",fontWeight:500}}>{h.date}</td>
                    <td style={{...T.mono,color:sig.color,fontWeight:800,fontSize:15,padding:"10px"}}>{h.bss>=0?"+":""}{h.bss}</td>
                    <td style={{padding:"10px"}}><span style={{background:sig.color+"22",color:sig.color,borderRadius:6,padding:"3px 8px",fontSize:12,fontWeight:700,whiteSpace:"nowrap"}}>{sig.label}</span></td>
                    <td style={{padding:"10px"}}><span style={{background:pc+"22",color:pc,borderRadius:6,padding:"3px 8px",fontSize:12,fontWeight:700,whiteSpace:"nowrap"}}>{h.phase}</span></td>
                    <td style={{...T.base,padding:"10px"}}>${h.btcAt.toLocaleString()}</td>
                    <td style={{...T.sm,padding:"10px",color:"#94a3b8"}}>{h.btc90d?"$"+h.btc90d.toLocaleString():"—"}</td>
                    <td style={{...T.mono,padding:"10px",fontWeight:800,fontSize:15,color:h.r90===null?"#475569":h.r90>=0?"#34d399":"#f87171"}}>{h.r90!==null?(h.r90>=0?"+":"")+h.r90+"%":"pending"}</td>
                    <td style={{...T.sm,padding:"10px",color:"#94a3b8"}}>{h.label}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{...T.xs,marginTop:12,lineHeight:1.6}}>* Pre-2024 BSS values are reconstructed estimates. Treat as directional evidence.</div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [values, setValues] = useState(CURRENT_SCORES);
  const [tab, setTab]       = useState("score");

  const handleChange = (id,val) => setValues(v=>({...v,[id]:val}));
  const reset        = ()       => setValues(CURRENT_SCORES);

  const bss = computeBSS(values);
  const signal = getSignal(bss);
  const needleAngle = (bss/100)*85;
  const pillarScores = PILLARS.map(p=>({
    ...p, score:p.metrics.reduce((a,m)=>a+(values[m.id]||0)*m.subweight,0),
  }));
  const {recalibrated} = computeRecalibratedBSS(pillarScores);

  const TABS=[
    {id:"score",   label:"📊 Live Score"},
    {id:"hybrid",  label:"🔀 Hybrid Intel"},
    {id:"backtest",label:"🔬 Backtest"},
  ];

  return (
    <div style={{minHeight:"100vh",background:"#0f172a",color:"#e2e8f0",fontFamily:"'Inter',system-ui,sans-serif",paddingBottom:60}}>

      {/* HEADER */}
      <div style={{background:"#0f172a",borderBottom:"1px solid #1e293b",padding:"20px 20px 0"}}>
        <div style={{maxWidth:920,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12,paddingBottom:16}}>
            <div>
              <div style={{...T.label,marginBottom:4}}>BTC Composite Signal Framework · v5</div>
              <div style={{fontSize:28,fontWeight:900,color:"#ffffff",letterSpacing:-0.5}}>Bitcoin Signal Score</div>
              <div style={{...T.sm,color:"#475569",marginTop:4}}>Scored June 21 2026 · 5-Pillar + Hybrid Backtest Bridge</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8}}>
              <div style={{background:"#1e293b",border:"1px solid #334155",borderRadius:12,padding:"10px 16px"}}>
                <div style={{...T.xs,marginBottom:3}}>BTC / USD · June 21 2026</div>
                <div style={{display:"flex",alignItems:"baseline",gap:10}}>
                  <span style={{color:"#ffffff",fontSize:24,fontWeight:900,fontFamily:"monospace"}}>$64,000</span>
                  <span style={{color:"#f87171",fontSize:15,fontWeight:800}}>▼ 1.4%</span>
                </div>
              </div>
              <button onClick={reset} style={{background:"#1e293b",border:"1px solid #334155",color:"#94a3b8",borderRadius:9,padding:"8px 14px",fontSize:13,cursor:"pointer"}}>⟳ Reset</button>
            </div>
          </div>
          <div style={{display:"flex",gap:4}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{
                background:tab===t.id?"#1e293b":"transparent",
                border:"1px solid "+(tab===t.id?"#334155":"transparent"),
                borderBottom:tab===t.id?"1px solid #0f172a":"1px solid transparent",
                color:tab===t.id?"#f1f5f9":"#64748b",
                borderRadius:"10px 10px 0 0",padding:"10px 18px",fontSize:14,
                cursor:"pointer",fontWeight:tab===t.id?800:500,
              }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div style={{maxWidth:920,margin:"0 auto",padding:"0 18px"}}>

        {tab==="score" && (
          <>
            {/* Gauge */}
            <div style={{background:"#1e293b",border:"1px solid #334155",borderRadius:16,padding:"28px 20px 20px",margin:"22px 0",textAlign:"center"}}>
              <svg width="300" height="170" viewBox="0 0 300 170" style={{display:"block",margin:"0 auto"}}>
                {[[-90,-60,"#ef4444"],[-60,-30,"#fb923c"],[-30,0,"#fbbf24"],[0,30,"#6ee7b7"],[30,60,"#34d399"],[60,90,"#10b981"]].map(([s,e,c],i)=>{
                  const r=118,ir=90,cx=150,cy=150,toR=d=>((d-90)*Math.PI)/180;
                  const x1=cx+r*Math.cos(toR(s)),y1=cy+r*Math.sin(toR(s));
                  const x2=cx+r*Math.cos(toR(e)),y2=cy+r*Math.sin(toR(e));
                  const x3=cx+ir*Math.cos(toR(e)),y3=cy+ir*Math.sin(toR(e));
                  const x4=cx+ir*Math.cos(toR(s)),y4=cy+ir*Math.sin(toR(s));
                  return <path key={i} d={"M "+x1+" "+y1+" A "+r+" "+r+" 0 0 1 "+x2+" "+y2+" L "+x3+" "+y3+" A "+ir+" "+ir+" 0 0 0 "+x4+" "+y4+" Z"} fill={c} opacity="0.88"/>;
                })}
                <g transform={"rotate("+needleAngle+",150,150)"}>
                  <line x1="150" y1="150" x2="150" y2="42" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                  <circle cx="150" cy="150" r="7" fill="#f8fafc"/>
                </g>
                <text x="12"  y="162" fill="#f87171" fontSize="12" fontWeight="bold">BEAR</text>
                <text x="232" y="162" fill="#10b981" fontSize="12" fontWeight="bold">BULL</text>
                <text x="120" y="28"  fill="#94a3b8" fontSize="11">NEUTRAL</text>
              </svg>
              <div style={{fontSize:68,fontWeight:900,fontFamily:"monospace",color:signal.color,lineHeight:1,marginTop:6}}>
                {bss>=0?"+":""}{bss.toFixed(1)}
              </div>
              <div style={{display:"inline-block",background:signal.color+"22",border:"1px solid "+signal.color+"55",color:signal.color,fontWeight:800,fontSize:16,padding:"8px 22px",borderRadius:999,marginTop:10}}>
                {signal.label}
              </div>
              <div style={{marginTop:22,display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
                {pillarScores.map(p=>{
                  const c=(p.score*p.weight).toFixed(1);
                  return (
                    <div key={p.id} style={{background:"#0f172a",border:"1px solid "+p.color+"33",borderRadius:12,padding:"10px 12px",minWidth:115,textAlign:"center"}}>
                      <div style={{color:p.color,fontSize:11,fontWeight:800}}>{p.label.split(" ")[0]}</div>
                      <div style={{fontFamily:"monospace",fontSize:20,fontWeight:900,color:Number(c)>=0?"#34d399":"#f87171",marginTop:2}}>{Number(c)>=0?"+":""}{c}</div>
                      <div style={{...T.xs,marginTop:2}}>wt {(p.weight*100).toFixed(0)}%</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rationale */}
            <div style={{background:"#1e293b",border:"1px solid #1d4ed8",borderRadius:14,padding:"18px 20px",marginBottom:18}}>
              <div style={{fontSize:15,fontWeight:800,color:"#93c5fd",marginBottom:12}}>🧠 Scoring Rationale — June 21 2026</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px 20px"}}>
                {PILLARS.flatMap(p=>p.metrics).map(m=>(
                  <div key={m.id} style={{display:"flex",gap:10}}>
                    <span style={{fontFamily:"monospace",fontWeight:900,fontSize:14,color:values[m.id]>=0?"#34d399":"#f87171",minWidth:36}}>{values[m.id]>=0?"+":""}{values[m.id]}</span>
                    <div>
                      <div style={{...T.sm,fontWeight:700,color:"#cbd5e1"}}>{m.label}</div>
                      <div style={{...T.xs,color:"#64748b",lineHeight:1.5}}>{CURRENT_RATIONALE[m.id]}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scale */}
            <div style={{background:"#1e293b",border:"1px solid #334155",borderRadius:14,padding:"16px 18px",marginBottom:18}}>
              <div style={{...T.label,marginBottom:10}}>Score Scale</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                {SIGNAL_LABELS.map(s=>(
                  <div key={s.label} style={{background:bss>=s.min&&bss<=s.max?s.color+"22":"#0f172a",border:"1px solid "+(bss>=s.min&&bss<=s.max?s.color:"#334155"),borderRadius:8,padding:"6px 12px"}}>
                    <span style={{color:s.color,fontWeight:800,fontSize:13}}>{s.min} to {s.max}</span>
                    <span style={{color:"#94a3b8",marginLeft:6,fontSize:13}}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pillar inputs */}
            <div style={{...T.label,marginBottom:12}}>Adjust Inputs <span style={{color:"#475569",fontWeight:400,fontSize:13,textTransform:"none",letterSpacing:0}}>— tap pillar to expand</span></div>
            {PILLARS.map(p=>(
              <PillarCard key={p.id} pillar={p} values={values} onChange={handleChange}
                adjustedWeight={recalibrated.find(r=>r.id===p.id)?.adjustedWeight}/>
            ))}
            <div style={{...T.sm,color:"#475569",textAlign:"center",marginTop:18}}>BSS = Σ(Pillar Score × Pillar Weight) · Not financial advice.</div>
          </>
        )}

        {tab==="hybrid" && (
          <div style={{marginTop:22}}>
            <HybridPanel bss={bss} pillarScores={pillarScores}/>
          </div>
        )}

        {tab==="backtest" && (
          <div style={{marginTop:22}}>
            <BacktestPanel/>
          </div>
        )}

      </div>
    </div>
  );
}
	
	
