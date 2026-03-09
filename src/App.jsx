import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `You are a senior market intelligence analyst at a top-tier strategy consulting firm. You produce rigorous, data-informed market analysis reports for product managers evaluating SaaS, Consumer Apps, Hardware/Physical products, and Marketplace/Platform businesses.

Respond ONLY with a valid JSON object — no markdown, no code fences, no preamble. Use this exact schema:

{
  "meta": {
    "productName": "short name/label for the product",
    "productType": "SaaS | Consumer App | Hardware | Marketplace | Platform | Mixed",
    "reportDate": "Month YYYY",
    "analystNote": "one sentence framing why this market is interesting right now"
  },
  "executive": {
    "summary": "3-4 sentences covering the core market opportunity, competitive intensity, and recommended posture for a new entrant",
    "opportunityScore": 7,
    "verdictLabel": "Attractive | Highly Attractive | Competitive | Crowded | Nascent | Risky",
    "keyFindings": ["finding 1", "finding 2", "finding 3", "finding 4"]
  },
  "market": {
    "tam": "Total Addressable Market with $ figure and reasoning",
    "sam": "Serviceable Addressable Market",
    "som": "Realistically obtainable share in 3-5 years for a well-funded startup",
    "cagr": "growth rate % and timeframe",
    "maturity": "Emerging | Growing | Mature | Declining",
    "geography": "primary geographies driving growth",
    "trends": [
      { "title": "trend name", "description": "2-sentence explanation of the trend and its impact" }
    ],
    "tailwinds": ["tailwind 1", "tailwind 2", "tailwind 3"],
    "headwinds": ["headwind 1", "headwind 2"]
  },
  "competitors": [
    {
      "name": "Company Name",
      "type": "Direct | Indirect | Emerging",
      "founded": "YYYY",
      "hq": "City, Country",
      "fundingStage": "e.g. Series C / Public / Bootstrapped",
      "positioning": "their core value proposition in one sentence",
      "targetCustomer": "who they sell to",
      "pricingModel": "pricing model and range",
      "strengths": ["strength 1", "strength 2", "strength 3"],
      "weaknesses": ["weakness 1", "weakness 2"],
      "recentMoves": "notable recent product/business moves"
    }
  ],
  "swot": {
    "strengths": [{ "point": "strength", "detail": "brief elaboration" }],
    "weaknesses": [{ "point": "weakness", "detail": "brief elaboration" }],
    "opportunities": [{ "point": "opportunity", "detail": "brief elaboration" }],
    "threats": [{ "point": "threat", "detail": "brief elaboration" }]
  },
  "positioning": {
    "axes": {
      "x": "name of x axis (e.g. Price)",
      "xLow": "low end label",
      "xHigh": "high end label",
      "y": "name of y axis (e.g. Breadth of Features)",
      "yLow": "low end label",
      "yHigh": "high end label"
    },
    "players": [
      { "name": "Competitor Name", "x": 0.75, "y": 0.3, "isNew": false }
    ],
    "whitespace": "description of the open positioning gap",
    "recommendation": "2-3 sentences on how a new entrant should position",
    "differentiators": ["differentiator 1", "differentiator 2", "differentiator 3"]
  },
  "gtm": {
    "icp": "Ideal Customer Profile description",
    "channel": "primary recommended go-to-market channel",
    "motions": ["motion 1", "motion 2"],
    "risks": ["risk 1", "risk 2"]
  }
}

Be specific with real company names, real market data, and concrete insights. Return ONLY the JSON.`;

const Divider = () => (
  <div style={{ borderTop: "1px solid #d4c9b8", margin: "0 0 22px 0" }} />
);

const Label = ({ children, color = "#8a7560" }) => (
  <div style={{
    fontFamily: "'Playfair Display', serif",
    fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase",
    color, marginBottom: 8, fontWeight: 700
  }}>{children}</div>
);

const Pill = ({ children, variant = "neutral" }) => {
  const styles = {
    neutral: { bg: "#f0ebe3", color: "#6b5c45" },
    green: { bg: "#e8f2ea", color: "#2d6a40" },
    red: { bg: "#faeaea", color: "#8b2020" },
    blue: { bg: "#e6eef7", color: "#1a4a7a" },
    amber: { bg: "#fdf3e3", color: "#8a5c0a" },
  };
  const s = styles[variant] || styles.neutral;
  return (
    <span style={{
      display: "inline-block", background: s.bg, color: s.color,
      borderRadius: 3, padding: "2px 9px", fontSize: 10,
      fontFamily: "'Source Serif 4', serif", fontStyle: "italic",
      marginRight: 5, marginBottom: 4
    }}>{children}</span>
  );
};

const MaturityBadge = ({ label }) => {
  const map = { Emerging: "amber", Growing: "green", Mature: "blue", Declining: "red" };
  return <Pill variant={map[label] || "neutral"}>{label}</Pill>;
};

const VerdictBadge = ({ label }) => {
  const map = { "Highly Attractive": "green", "Attractive": "green", "Competitive": "amber", "Crowded": "red", "Nascent": "blue", "Risky": "red" };
  return <Pill variant={map[label] || "neutral"}>{label}</Pill>;
};

const ScoreBar = ({ score }) => {
  const color = score >= 7 ? "#2d6a40" : score >= 5 ? "#8a5c0a" : "#8b2020";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1, height: 5, background: "#e8e0d5", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${(score / 10) * 100}%`, height: "100%", background: color, borderRadius: 3, transition: "width 1.2s cubic-bezier(.4,0,.2,1)" }} />
      </div>
      <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color, minWidth: 30 }}>
        {score}<span style={{ fontSize: 11, color: "#b0a090" }}>/10</span>
      </span>
    </div>
  );
};

const PositioningMap = ({ data }) => {
  const { axes, players, whitespace } = data || {};
  const W = 340, H = 260, pad = 36;
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: W, display: "block" }}>
        <rect width={W} height={H} fill="#faf7f2" />
        <rect x={pad} y={H/2} width={W/2-pad/2} height={H/2-pad/2} fill="#f0ebe3" opacity={0.6} />
        <line x1={W/2} y1={pad-6} x2={W/2} y2={H-pad+6} stroke="#c8bfb0" strokeWidth={1} />
        <line x1={pad-6} y1={H/2} x2={W-pad+6} y2={H/2} stroke="#c8bfb0" strokeWidth={1} />
        <polygon points={`${W/2-3},${pad-6} ${W/2+3},${pad-6} ${W/2},${pad-13}`} fill="#c8bfb0" />
        <polygon points={`${W-pad+6},${H/2-3} ${W-pad+6},${H/2+3} ${W-pad+13},${H/2}`} fill="#c8bfb0" />
        <text x={W-pad+16} y={H/2+4} fontSize="7.5" fill="#8a7560" fontFamily="'Playfair Display', serif" textAnchor="start">{axes?.xHigh}</text>
        <text x={pad-8} y={H/2+4} fontSize="7.5" fill="#8a7560" fontFamily="'Playfair Display', serif" textAnchor="end">{axes?.xLow}</text>
        <text x={W/2} y={pad-16} fontSize="7.5" fill="#8a7560" fontFamily="'Playfair Display', serif" textAnchor="middle">{axes?.yHigh}</text>
        <text x={W/2} y={H-pad+20} fontSize="7.5" fill="#8a7560" fontFamily="'Playfair Display', serif" textAnchor="middle">{axes?.yLow}</text>
        <text x={W-8} y={H-8} fontSize="7" fill="#b0a090" fontFamily="'Playfair Display', serif" textAnchor="end">{axes?.x} →</text>
        <text x="10" y={pad+20} fontSize="7" fill="#b0a090" fontFamily="'Playfair Display', serif" textAnchor="middle" transform={`rotate(-90, 10, ${pad+20})`}>{axes?.y} ↑</text>
        {players?.map((p, i) => {
          const cx = pad + p.x * (W - 2*pad);
          const cy = H - pad - p.y * (H - 2*pad);
          return (
            <g key={i}>
              {p.isNew && <circle cx={cx} cy={cy} r={13} fill="none" stroke="#2d6a40" strokeWidth={1} strokeDasharray="3 2" opacity={0.6} />}
              <circle cx={cx} cy={cy} r={p.isNew ? 8 : 5} fill={p.isNew ? "#2d6a40" : "#7a6a58"} opacity={p.isNew ? 1 : 0.65} />
              <text x={cx+10} y={cy+4} fontSize="7.5" fill={p.isNew ? "#2d6a40" : "#5a4a38"} fontFamily="'Source Serif 4', serif" fontWeight={p.isNew ? 700 : 400} fontStyle={p.isNew ? "italic" : "normal"}>
                {p.name?.length > 13 ? p.name.slice(0,12)+"…" : p.name}
              </text>
            </g>
          );
        })}
      </svg>
      {whitespace && (
        <div style={{ marginTop: 10, padding: "9px 12px", background: "#e8f2ea", borderRadius: 3, borderLeft: "2px solid #2d6a40" }}>
          <Label color="#2d6a40">Whitespace</Label>
          <p style={{ margin: 0, fontSize: 11, color: "#2d4a38", fontStyle: "italic", lineHeight: 1.6 }}>{whitespace}</p>
        </div>
      )}
    </div>
  );
};

const CompetitorTable = ({ competitors }) => {
  const [expanded, setExpanded] = useState(null);
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #c8bfb0" }}>
            {["Company", "Type", "Stage", "Positioning", "Pricing", ""].map(h => (
              <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontFamily: "'Playfair Display', serif", fontSize: 8, letterSpacing: "0.15em", color: "#8a7560", fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {competitors?.map((c, i) => (
            <>
              <tr key={i} onClick={() => setExpanded(expanded === i ? null : i)}
                style={{ borderBottom: "1px solid #e8e0d5", cursor: "pointer", background: expanded === i ? "#faf7f2" : i % 2 === 0 ? "#fff" : "#fdfaf6" }}>
                <td style={{ padding: "9px 10px", fontWeight: 700, color: "#3a2e22", fontFamily: "'Playfair Display', serif" }}>{c.name}</td>
                <td style={{ padding: "9px 10px" }}>
                  <Pill variant={c.type === "Direct" ? "red" : c.type === "Emerging" ? "amber" : "blue"}>{c.type}</Pill>
                </td>
                <td style={{ padding: "9px 10px", color: "#6b5c45", fontStyle: "italic", fontFamily: "'Source Serif 4', serif" }}>{c.fundingStage}</td>
                <td style={{ padding: "9px 10px", color: "#5a4a38", maxWidth: 180, fontFamily: "'Source Serif 4', serif" }}>{c.positioning}</td>
                <td style={{ padding: "9px 10px", color: "#6b5c45", whiteSpace: "nowrap", fontFamily: "'Source Serif 4', serif" }}>{c.pricingModel}</td>
                <td style={{ padding: "9px 10px", color: "#b0a090", fontSize: 10 }}>{expanded === i ? "▲" : "▼"}</td>
              </tr>
              {expanded === i && (
                <tr key={`exp-${i}`} style={{ background: "#faf7f2", borderBottom: "1px solid #e8e0d5" }}>
                  <td colSpan={6} style={{ padding: "14px 16px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                      <div>
                        <Label color="#2d6a40">Strengths</Label>
                        {c.strengths?.map((s, j) => <div key={j} style={{ fontSize: 11, color: "#3a4a3a", marginBottom: 3, fontFamily: "'Source Serif 4', serif" }}>+ {s}</div>)}
                      </div>
                      <div>
                        <Label color="#8b2020">Weaknesses</Label>
                        {c.weaknesses?.map((w, j) => <div key={j} style={{ fontSize: 11, color: "#4a2a2a", marginBottom: 3, fontFamily: "'Source Serif 4', serif" }}>− {w}</div>)}
                      </div>
                      <div>
                        <Label>Recent Moves</Label>
                        <div style={{ fontSize: 11, color: "#5a4a38", fontStyle: "italic", lineHeight: 1.6, fontFamily: "'Source Serif 4', serif" }}>{c.recentMoves}</div>
                        <div style={{ marginTop: 6, fontSize: 10, color: "#8a7560" }}>Target: {c.targetCustomer}</div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const SwotGrid = ({ swot }) => {
  const quads = [
    { key: "strengths", label: "Strengths", color: "#2d6a40", textColor: "#1a3a25" },
    { key: "weaknesses", label: "Weaknesses", color: "#8b2020", textColor: "#3a1515" },
    { key: "opportunities", label: "Opportunities", color: "#1a4a7a", textColor: "#152a45" },
    { key: "threats", label: "Threats", color: "#8a5c0a", textColor: "#3a2808" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "#c8bfb0", border: "1px solid #c8bfb0", borderRadius: 4, overflow: "hidden" }}>
      {quads.map(q => (
        <div key={q.key} style={{ background: "#fdfaf6", padding: "16px 18px" }}>
          <Label color={q.color}>{q.label}</Label>
          {(swot[q.key] || []).map((item, i) => (
            <div key={i} style={{ marginBottom: 9 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: q.textColor, marginBottom: 2, fontFamily: "'Playfair Display', serif" }}>{item.point}</div>
              <div style={{ fontSize: 11, color: "#7a6a58", lineHeight: 1.55, fontStyle: "italic", fontFamily: "'Source Serif 4', serif" }}>{item.detail}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const MarketSizing = ({ market }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "#c8bfb0", border: "1px solid #c8bfb0", borderRadius: 4, overflow: "hidden", marginBottom: 20 }}>
    {[
      { label: "TAM", val: market.tam, sub: "Total Addressable Market" },
      { label: "SAM", val: market.sam, sub: "Serviceable Addressable Market" },
      { label: "SOM", val: market.som, sub: "Obtainable in 3–5 Years" },
    ].map(({ label, val, sub }) => (
      <div key={label} style={{ background: "#fdfaf6", padding: "16px 18px" }}>
        <Label>{label}</Label>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#3a2e22", lineHeight: 1.5, marginBottom: 4, fontFamily: "'Playfair Display', serif" }}>{val}</div>
        <div style={{ fontSize: 9, color: "#b0a090", textTransform: "uppercase", letterSpacing: "0.1em" }}>{sub}</div>
      </div>
    ))}
  </div>
);

const ReportSection = ({ number, title, children }) => (
  <div style={{ marginBottom: 32 }}>
    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
      <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 10, color: "#b0a090", fontStyle: "italic" }}>{number}</span>
      <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: "#2a1e10", letterSpacing: "-0.01em" }}>{title}</h2>
    </div>
    <Divider />
    {children}
  </div>
);

export default function App() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [phase, setPhase] = useState(0);

  const phases = ["Researching market landscape…", "Identifying competitors…", "Sizing the opportunity…", "Synthesizing insights…", "Drafting report…"];

  useEffect(() => {
    if (!loading) return;
    setPhase(0);
    const id = setInterval(() => setPhase(p => Math.min(p + 1, phases.length - 1)), 1800);
    return () => clearInterval(id);
  }, [loading]);

  const analyze = async () => {
    if (!query.trim() || loading) return;
    setLoading(true); setData(null); setError(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {  "Content-Type": "application/json",
                    "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "anthropic-dangerous-direct-browser-access": "true"
                },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: `Produce a full market analysis report for: ${query}` }]
        })
      });
      const json = await res.json();
      const text = json.content?.map(b => b.type === "text" ? b.text : "").filter(Boolean).join("\n");
      const clean = text.replace(/```json|```/g, "").trim();
      setData(JSON.parse(clean));
    } catch (e) {
      setError("Analysis could not be completed. Please refine your input and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f0e8", fontFamily: "'Source Serif 4', serif", color: "#3a2e22" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap" rel="stylesheet" />

      {/* Masthead */}
      <div style={{ background: "#2a1e10", padding: "0 40px", borderBottom: "4px solid #8a6c40" }}>
        <div style={{ maxWidth: 840, margin: "0 auto", padding: "16px 0 13px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 21, fontWeight: 900, color: "#f5f0e8", letterSpacing: "-0.02em", lineHeight: 1 }}>Market Intelligence</div>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#b0946a", marginTop: 3, textTransform: "uppercase" }}>Competitive Benchmarking & Analysis Agent</div>
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {["SaaS", "Consumer App", "Hardware", "Marketplace"].map(t => (
              <span key={t} style={{ padding: "2px 8px", background: "rgba(255,255,255,0.07)", borderRadius: 2, fontSize: 9, color: "#c8a870", letterSpacing: "0.05em" }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 840, margin: "0 auto", padding: "28px 40px" }}>

        {/* Input */}
        <div style={{ background: "#fff", border: "1px solid #d4c9b8", borderRadius: 4, padding: "22px 26px", marginBottom: 28, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
          <Label>Product or Idea to Analyze</Label>
          <textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); analyze(); } }}
            placeholder="e.g. 'A subscription SaaS for B2B restaurant inventory management' or 'Consumer app for AI-powered personal finance coaching' or 'Marketplace for independent hardware manufacturers'…"
            rows={3}
            style={{ width: "100%", background: "#fdfaf6", border: "1px solid #d4c9b8", borderRadius: 3, padding: "11px 13px", fontSize: 13, fontFamily: "'Source Serif 4', serif", color: "#3a2e22", resize: "vertical", outline: "none", lineHeight: 1.7, boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
            <span style={{ fontSize: 10, color: "#b0a090" }}>↵ Enter to run · Shift+Enter for new line</span>
            <button onClick={analyze} disabled={loading || !query.trim()} style={{ background: loading || !query.trim() ? "#d4c9b8" : "#2a1e10", color: loading || !query.trim() ? "#8a7560" : "#f5f0e8", border: "none", borderRadius: 3, padding: "9px 20px", fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 11, cursor: loading || !query.trim() ? "default" : "pointer", letterSpacing: "0.08em" }}>
              {loading ? "Analyzing…" : "Generate Report →"}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ width: 32, height: 32, border: "2px solid #d4c9b8", borderTopColor: "#8a6c40", borderRadius: "50%", animation: "spin 0.9s linear infinite", margin: "0 auto 18px" }} />
            <div style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", color: "#8a7560", fontSize: 14 }}>{phases[phase]}</div>
            <div style={{ marginTop: 12, display: "flex", gap: 5, justifyContent: "center" }}>
              {phases.map((_, i) => <div key={i} style={{ width: i <= phase ? 16 : 5, height: 3, borderRadius: 2, background: i <= phase ? "#8a6c40" : "#d4c9b8", transition: "all 0.4s" }} />)}
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {error && <div style={{ background: "#faeaea", border: "1px solid #d4a0a0", borderRadius: 4, padding: "13px 16px", color: "#8b2020", fontStyle: "italic", fontSize: 13 }}>{error}</div>}

        {/* ─── REPORT ─────────────────────────────── */}
        {data && (
          <div style={{ animation: "fadeUp 0.5s ease both" }}>
            <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:none } }`}</style>

            {/* Report header */}
            <div style={{ background: "#fff", border: "1px solid #d4c9b8", borderBottom: "3px solid #2a1e10", borderRadius: "4px 4px 0 0", padding: "26px 30px 22px" }}>
              <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#b0a090", textTransform: "uppercase", marginBottom: 5 }}>Market Intelligence Report · {data.meta?.reportDate}</div>
              <h1 style={{ margin: "0 0 8px", fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: "#1a1008", letterSpacing: "-0.02em", lineHeight: 1.15 }}>{data.meta?.productName}</h1>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
                <Pill variant="neutral">{data.meta?.productType}</Pill>
                <VerdictBadge label={data.executive?.verdictLabel} />
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "#6b5c45", fontStyle: "italic", lineHeight: 1.6 }}>{data.meta?.analystNote}</p>
            </div>

            {/* Report body */}
            <div style={{ background: "#fff", border: "1px solid #d4c9b8", borderTop: "none", borderRadius: "0 0 4px 4px", padding: "30px 30px", boxShadow: "0 4px 18px rgba(0,0,0,0.07)" }}>

              {/* 01 Executive Summary */}
              <ReportSection number="01" title="Executive Summary">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 190px", gap: 22, alignItems: "start" }}>
                  <div>
                    <p style={{ margin: "0 0 14px", fontSize: 13, lineHeight: 1.8, color: "#3a2e22" }}>{data.executive?.summary}</p>
                    <Label>Key Findings</Label>
                    {data.executive?.keyFindings?.map((f, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, marginBottom: 6 }}>
                        <span style={{ color: "#8a6c40", fontFamily: "'Playfair Display', serif", fontSize: 10, marginTop: 2 }}>{String(i+1).padStart(2,"0")}.</span>
                        <span style={{ fontSize: 12, color: "#4a3a28", lineHeight: 1.6 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <Label>Opportunity Score</Label>
                    <ScoreBar score={data.executive?.opportunityScore} />
                    <div style={{ marginTop: 8 }}><VerdictBadge label={data.executive?.verdictLabel} /></div>
                  </div>
                </div>
              </ReportSection>

              {/* 02 Market Sizing & Trends */}
              <ReportSection number="02" title="Market Sizing & Trends">
                <MarketSizing market={data.market || {}} />
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 22 }}>
                  <div>
                    <Label>Market Trends</Label>
                    {data.market?.trends?.map((t, i) => (
                      <div key={i} style={{ marginBottom: 13, paddingLeft: 13, borderLeft: "2px solid #d4c9b8" }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: "#2a1e10", marginBottom: 2, fontFamily: "'Playfair Display', serif" }}>{t.title}</div>
                        <div style={{ fontSize: 11, color: "#6b5c45", lineHeight: 1.6, fontStyle: "italic" }}>{t.description}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ marginBottom: 14 }}>
                      <Label>Details</Label>
                      {[["CAGR", data.market?.cagr], ["Maturity", <MaturityBadge label={data.market?.maturity} />], ["Geography", data.market?.geography]].map(([k, v]) => (
                        <div key={k} style={{ marginBottom: 7 }}>
                          <span style={{ fontSize: 9, color: "#b0a090", letterSpacing: "0.1em", textTransform: "uppercase" }}>{k}  </span>
                          <span style={{ fontSize: 11, color: "#4a3a28" }}>{v}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <Label color="#2d6a40">Tailwinds</Label>
                      {data.market?.tailwinds?.map((t, i) => <div key={i} style={{ fontSize: 11, color: "#2d4a38", marginBottom: 4 }}>↑ {t}</div>)}
                    </div>
                    <div>
                      <Label color="#8b2020">Headwinds</Label>
                      {data.market?.headwinds?.map((h, i) => <div key={i} style={{ fontSize: 11, color: "#4a2a2a", marginBottom: 4 }}>↓ {h}</div>)}
                    </div>
                  </div>
                </div>
              </ReportSection>

              {/* 03 Competitors */}
              <ReportSection number="03" title="Competitive Benchmarking">
                <p style={{ fontSize: 11, color: "#8a7560", fontStyle: "italic", margin: "0 0 10px" }}>Click a row to expand details.</p>
                <CompetitorTable competitors={data.competitors} />
              </ReportSection>

              {/* 04 SWOT */}
              <ReportSection number="04" title="SWOT Analysis">
                <SwotGrid swot={data.swot || {}} />
              </ReportSection>

              {/* 05 Positioning */}
              <ReportSection number="05" title="Competitive Positioning Map">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
                  <PositioningMap data={data.positioning || {}} />
                  <div>
                    <Label>Recommended Positioning</Label>
                    <p style={{ margin: "0 0 14px", fontSize: 12, lineHeight: 1.75, color: "#3a2e22", fontStyle: "italic" }}>{data.positioning?.recommendation}</p>
                    <Label>Key Differentiators</Label>
                    {data.positioning?.differentiators?.map((d, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                        <span style={{ color: "#8a6c40", fontSize: 9, marginTop: 3 }}>◆</span>
                        <span style={{ fontSize: 12, color: "#4a3a28", lineHeight: 1.6 }}>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </ReportSection>

              {/* 06 GTM */}
              {data.gtm && (
                <ReportSection number="06" title="Go-to-Market Considerations">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <div>
                      <Label>Ideal Customer Profile</Label>
                      <p style={{ margin: "0 0 14px", fontSize: 12, lineHeight: 1.75, color: "#3a2e22" }}>{data.gtm.icp}</p>
                      <Label>Recommended Channel</Label>
                      <p style={{ margin: 0, fontSize: 12, color: "#3a2e22", fontStyle: "italic" }}>{data.gtm.channel}</p>
                    </div>
                    <div>
                      <Label color="#1a4a7a">GTM Motions</Label>
                      {data.gtm.motions?.map((m, i) => <div key={i} style={{ fontSize: 12, color: "#1a3a5a", marginBottom: 5 }}>→ {m}</div>)}
                      <div style={{ marginTop: 12 }}>
                        <Label color="#8b2020">Key Risks</Label>
                        {data.gtm.risks?.map((r, i) => <div key={i} style={{ fontSize: 12, color: "#5a2020", marginBottom: 5 }}>⚠ {r}</div>)}
                      </div>
                    </div>
                  </div>
                </ReportSection>
              )}

              <div style={{ borderTop: "1px solid #d4c9b8", paddingTop: 14, display: "flex", justifyContent: "space-between", fontSize: 9, color: "#b0a090", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                <span>Market Intelligence Agent · AI-Generated Analysis</span>
                <span>{data.meta?.reportDate}</span>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !data && !error && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#b0a090" }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontStyle: "italic", opacity: 0.35, marginBottom: 12 }}>Intelligence Report</div>
            <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16 }}>Enter a product or market idea above to generate your report</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
              {["Competitor Benchmarking", "Market Sizing & Trends", "SWOT Analysis", "Positioning Map", "GTM Notes"].map(t => (
                <span key={t} style={{ padding: "3px 11px", border: "1px solid #d4c9b8", borderRadius: 2, fontSize: 9, color: "#b0a090", letterSpacing: "0.05em" }}>{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
