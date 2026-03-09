import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `You are an elite AI product market analyst. When given a product or idea, you perform deep market analysis and competitive benchmarking.

Always respond with a structured JSON object (no markdown, no code fences, pure JSON only) with this exact shape:

{
  "summary": "2-3 sentence executive summary of the market opportunity",
  "market": {
    "size": "estimated TAM/SAM with reasoning",
    "growth": "CAGR or trend description",
    "maturity": "Emerging | Growing | Mature | Declining",
    "keyTrends": ["trend1", "trend2", "trend3"]
  },
  "competitors": [
    {
      "name": "Company Name",
      "positioning": "their core value prop in one line",
      "strengths": ["strength1", "strength2"],
      "weaknesses": ["weakness1", "weakness2"],
      "pricing": "pricing model / range",
      "marketShare": "estimated % or relative size descriptor"
    }
  ],
  "swot": {
    "strengths": ["S1", "S2", "S3"],
    "weaknesses": ["W1", "W2", "W3"],
    "opportunities": ["O1", "O2", "O3"],
    "threats": ["T1", "T2", "T3"]
  },
  "positioning": {
    "whitespace": "description of gap in the market",
    "recommendedAngle": "recommended positioning for a new entrant",
    "differentiators": ["diff1", "diff2", "diff3"]
  },
  "verdict": {
    "score": 7,
    "label": "Attractive",
    "rationale": "2-3 sentence rationale for the opportunity score (1-10)"
  }
}

Be specific, data-informed, and brutally honest. Use real company names where applicable. Return ONLY the JSON object.`;

const ScoreRing = ({ score }) => {
  const radius = 36;
  const circ = 2 * Math.PI * radius;
  const pct = score / 10;
  const color = score >= 7 ? "#00ff9d" : score >= 5 ? "#f5c518" : "#ff4d6d";
  return (
    <div style={{ position: "relative", width: 96, height: 96 }}>
      <svg width="96" height="96" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="48" cy="48" r={radius} fill="none" stroke="#1e2a3a" strokeWidth="8" />
        <circle
          cx="48" cy="48" r={radius} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center"
      }}>
        <span style={{ fontSize: 26, fontWeight: 800, color, fontFamily: "'Space Mono', monospace" }}>{score}</span>
        <span style={{ fontSize: 9, color: "#5a7a9a", letterSpacing: 1, textTransform: "uppercase" }}>/10</span>
      </div>
    </div>
  );
};

const Tag = ({ children, color = "#1e3a5f" }) => (
  <span style={{
    display: "inline-block", background: color, color: "#c8dff0",
    borderRadius: 4, padding: "2px 8px", fontSize: 11,
    fontFamily: "'Space Mono', monospace", marginRight: 4, marginBottom: 4,
    border: "1px solid #2a4a6f"
  }}>{children}</span>
);

const Section = ({ title, icon, children }) => (
  <div style={{
    background: "rgba(10,20,35,0.7)", border: "1px solid #1e3a5f",
    borderRadius: 12, padding: "20px 24px", marginBottom: 16,
    backdropFilter: "blur(8px)"
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{
        fontSize: 11, fontWeight: 700, letterSpacing: 2,
        color: "#4a9eff", textTransform: "uppercase",
        fontFamily: "'Space Mono', monospace"
      }}>{title}</span>
    </div>
    {children}
  </div>
);

const MaturityBadge = ({ label }) => {
  const colors = { Emerging: "#00c9a7", Growing: "#4a9eff", Mature: "#f5c518", Declining: "#ff4d6d" };
  return (
    <span style={{
      background: (colors[label] || "#4a9eff") + "22",
      color: colors[label] || "#4a9eff",
      border: `1px solid ${colors[label] || "#4a9eff"}55`,
      borderRadius: 20, padding: "2px 12px", fontSize: 11,
      fontFamily: "'Space Mono', monospace", fontWeight: 700
    }}>{label}</span>
  );
};

const SwotBox = ({ label, items, accent }) => (
  <div style={{
    background: accent + "0d", border: `1px solid ${accent}33`,
    borderRadius: 8, padding: "12px 14px"
  }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: accent, letterSpacing: 2, marginBottom: 8, fontFamily: "'Space Mono', monospace" }}>
      {label.toUpperCase()}
    </div>
    {items.map((item, i) => (
      <div key={i} style={{ display: "flex", gap: 6, marginBottom: 5, alignItems: "flex-start" }}>
        <span style={{ color: accent, fontSize: 10, marginTop: 2 }}>▸</span>
        <span style={{ fontSize: 12, color: "#a0bcd8", lineHeight: 1.5 }}>{item}</span>
      </div>
    ))}
  </div>
);

const CompetitorCard = ({ comp, i }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: "rgba(10,20,35,0.5)", border: "1px solid #1e3a5f",
      borderRadius: 8, padding: "14px 16px", cursor: "pointer",
      transition: "border-color 0.2s",
      borderColor: open ? "#4a9eff55" : "#1e3a5f"
    }} onClick={() => setOpen(!open)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 700, color: "#c8dff0", fontSize: 14 }}>{comp.name}</div>
          <div style={{ fontSize: 11, color: "#5a7a9a", marginTop: 2 }}>{comp.positioning}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: "#4a9eff", fontFamily: "'Space Mono', monospace" }}>{comp.marketShare}</span>
          <span style={{ color: "#4a9eff", fontSize: 12, transition: "transform 0.2s", transform: open ? "rotate(90deg)" : "none" }}>▶</span>
        </div>
      </div>
      {open && (
        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <div style={{ fontSize: 10, color: "#00c9a7", letterSpacing: 1, marginBottom: 6, fontFamily: "'Space Mono', monospace" }}>STRENGTHS</div>
            {comp.strengths.map((s, j) => <div key={j} style={{ fontSize: 11, color: "#a0bcd8", marginBottom: 3 }}>✓ {s}</div>)}
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#ff4d6d", letterSpacing: 1, marginBottom: 6, fontFamily: "'Space Mono', monospace" }}>WEAKNESSES</div>
            {comp.weaknesses.map((w, j) => <div key={j} style={{ fontSize: 11, color: "#a0bcd8", marginBottom: 3 }}>✗ {w}</div>)}
          </div>
          <div style={{ gridColumn: "1 / -1", marginTop: 4 }}>
            <span style={{ fontSize: 10, color: "#5a7a9a" }}>Pricing: </span>
            <span style={{ fontSize: 11, color: "#f5c518" }}>{comp.pricing}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [dots, setDots] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setDots(d => d.length >= 3 ? "" : d + "."), 400);
    return () => clearInterval(id);
  }, [loading]);

  const analyze = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setData(null);
    setError(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: `Analyze this product/market: ${query}` }]
        })
      });
      const json = await res.json();
      const text = json.content?.map(b => b.type === "text" ? b.text : "").filter(Boolean).join("\n");
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setData(parsed);
    } catch (e) {
      setError("Analysis failed. Please check your input and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); analyze(); }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#050d1a",
      fontFamily: "'Inter', sans-serif", color: "#c8dff0",
      backgroundImage: "radial-gradient(ellipse 80% 50% at 50% -20%, #0a2a4a44, transparent)",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Grid overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "linear-gradient(rgba(74,158,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(74,158,255,0.03) 1px, transparent 1px)",
        backgroundSize: "40px 40px"
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
        {/* Header */}
        <div style={{ marginBottom: 40, textAlign: "center" }}>
          <div style={{
            display: "inline-block", background: "rgba(74,158,255,0.1)", border: "1px solid rgba(74,158,255,0.3)",
            borderRadius: 20, padding: "4px 14px", marginBottom: 16,
            fontSize: 10, letterSpacing: 3, color: "#4a9eff", fontFamily: "'Space Mono', monospace"
          }}>AI MARKET INTELLIGENCE</div>
          <h1 style={{
            fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 800, margin: 0,
            background: "linear-gradient(135deg, #c8dff0 0%, #4a9eff 50%, #00c9a7 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            letterSpacing: -1, lineHeight: 1.1
          }}>Market Analyst Agent</h1>
          <p style={{ color: "#5a7a9a", marginTop: 10, fontSize: 14 }}>
            Competitive benchmarking & market opportunity analysis — powered by AI
          </p>
        </div>

        {/* Input */}
        <div style={{
          background: "rgba(10,20,35,0.8)", border: "1px solid #1e3a5f",
          borderRadius: 14, padding: "16px 20px", marginBottom: 28,
          backdropFilter: "blur(12px)", boxShadow: "0 0 40px rgba(74,158,255,0.05)"
        }}>
          <div style={{ fontSize: 10, color: "#4a9eff", letterSpacing: 2, marginBottom: 10, fontFamily: "'Space Mono', monospace" }}>
            PRODUCT / IDEA TO ANALYZE
          </div>
          <textarea
            ref={textareaRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="e.g. 'An AI-powered Notion alternative for remote engineering teams' or 'B2B SaaS for restaurant inventory management'..."
            rows={3}
            style={{
              width: "100%", background: "transparent", border: "none", outline: "none",
              color: "#c8dff0", fontSize: 14, resize: "none", lineHeight: 1.6,
              fontFamily: "'Inter', sans-serif"
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
            <span style={{ fontSize: 11, color: "#2a4a6f" }}>↵ Enter to analyze · Shift+Enter for newline</span>
            <button
              onClick={analyze}
              disabled={loading || !query.trim()}
              style={{
                background: loading ? "#1e3a5f" : "linear-gradient(135deg, #1a6fff, #00c9a7)",
                border: "none", borderRadius: 8, padding: "8px 20px",
                color: "#fff", fontWeight: 700, fontSize: 12, cursor: loading ? "default" : "pointer",
                letterSpacing: 1, fontFamily: "'Space Mono', monospace",
                opacity: loading || !query.trim() ? 0.6 : 1,
                transition: "opacity 0.2s"
              }}
            >
              {loading ? `ANALYZING${dots}` : "ANALYZE →"}
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 16, padding: "40px 0", color: "#4a9eff"
          }}>
            <div style={{
              width: 48, height: 48, border: "3px solid #1e3a5f",
              borderTopColor: "#4a9eff", borderRadius: "50%",
              animation: "spin 0.8s linear infinite"
            }} />
            <div style={{ fontSize: 12, letterSpacing: 2, fontFamily: "'Space Mono', monospace", color: "#5a7a9a" }}>
              RUNNING DEEP ANALYSIS{dots}
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {error && (
          <div style={{
            background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.3)",
            borderRadius: 10, padding: "14px 18px", color: "#ff4d6d", fontSize: 13
          }}>{error}</div>
        )}

        {/* Results */}
        {data && (
          <div style={{ animation: "fadeIn 0.5s ease" }}>
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }`}</style>

            {/* Verdict hero */}
            <div style={{
              background: "linear-gradient(135deg, rgba(10,30,60,0.9), rgba(0,30,50,0.9))",
              border: "1px solid #1e3a5f", borderRadius: 14, padding: "24px",
              marginBottom: 16, display: "flex", gap: 24, alignItems: "center",
              flexWrap: "wrap"
            }}>
              <ScoreRing score={data.verdict?.score || 7} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#c8dff0", marginBottom: 6 }}>
                  {data.verdict?.label || "Opportunity"} Market
                </div>
                <div style={{ fontSize: 13, color: "#7a9ab8", lineHeight: 1.6 }}>{data.summary}</div>
              </div>
            </div>

            {/* Market Overview */}
            <Section title="Market Overview" icon="📊">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 14 }}>
                {[
                  { label: "Market Size", val: data.market?.size },
                  { label: "Growth", val: data.market?.growth },
                ].map(({ label, val }) => (
                  <div key={label} style={{ background: "rgba(74,158,255,0.05)", borderRadius: 8, padding: "10px 14px", border: "1px solid #1e3a5f" }}>
                    <div style={{ fontSize: 10, color: "#4a9eff", letterSpacing: 1, marginBottom: 4, fontFamily: "'Space Mono', monospace" }}>{label.toUpperCase()}</div>
                    <div style={{ fontSize: 12, color: "#a0bcd8" }}>{val}</div>
                  </div>
                ))}
                <div style={{ background: "rgba(74,158,255,0.05)", borderRadius: 8, padding: "10px 14px", border: "1px solid #1e3a5f", display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ fontSize: 10, color: "#4a9eff", letterSpacing: 1, fontFamily: "'Space Mono', monospace" }}>MATURITY</div>
                  <MaturityBadge label={data.market?.maturity} />
                </div>
              </div>
              <div style={{ fontSize: 10, color: "#4a9eff", letterSpacing: 1, marginBottom: 8, fontFamily: "'Space Mono', monospace" }}>KEY TRENDS</div>
              <div>{data.market?.keyTrends?.map((t, i) => <Tag key={i}>{t}</Tag>)}</div>
            </Section>

            {/* Competitors */}
            <Section title={`Competitive Landscape (${data.competitors?.length || 0} players)`} icon="⚔️">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.competitors?.map((c, i) => <CompetitorCard key={i} comp={c} i={i} />)}
              </div>
            </Section>

            {/* SWOT */}
            <Section title="SWOT Analysis" icon="🎯">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <SwotBox label="Strengths" items={data.swot?.strengths || []} accent="#00c9a7" />
                <SwotBox label="Weaknesses" items={data.swot?.weaknesses || []} accent="#ff4d6d" />
                <SwotBox label="Opportunities" items={data.swot?.opportunities || []} accent="#4a9eff" />
                <SwotBox label="Threats" items={data.swot?.threats || []} accent="#f5c518" />
              </div>
            </Section>

            {/* Positioning */}
            <Section title="Strategic Positioning" icon="🧭">
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: "#4a9eff", letterSpacing: 1, marginBottom: 6, fontFamily: "'Space Mono', monospace" }}>WHITESPACE OPPORTUNITY</div>
                <div style={{ fontSize: 13, color: "#a0bcd8", lineHeight: 1.6, background: "rgba(74,158,255,0.05)", borderRadius: 8, padding: "10px 14px", border: "1px solid #1e3a5f" }}>
                  {data.positioning?.whitespace}
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: "#00c9a7", letterSpacing: 1, marginBottom: 6, fontFamily: "'Space Mono', monospace" }}>RECOMMENDED ANGLE</div>
                <div style={{ fontSize: 13, color: "#a0bcd8", lineHeight: 1.6 }}>{data.positioning?.recommendedAngle}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#f5c518", letterSpacing: 1, marginBottom: 8, fontFamily: "'Space Mono', monospace" }}>KEY DIFFERENTIATORS</div>
                {data.positioning?.differentiators?.map((d, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
                    <span style={{ color: "#f5c518", fontSize: 10, marginTop: 3, flexShrink: 0 }}>◆</span>
                    <span style={{ fontSize: 12, color: "#a0bcd8" }}>{d}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Verdict rationale */}
            <div style={{
              background: "rgba(74,158,255,0.05)", border: "1px solid #1e3a5f",
              borderRadius: 10, padding: "14px 18px", fontSize: 12, color: "#7a9ab8",
              lineHeight: 1.7, fontStyle: "italic"
            }}>
              <span style={{ color: "#4a9eff", fontStyle: "normal", fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: 1 }}>ANALYST VERDICT — </span>
              {data.verdict?.rationale}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !data && !error && (
          <div style={{
            textAlign: "center", padding: "40px 0", color: "#2a4a6f"
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔭</div>
            <div style={{ fontSize: 13, fontFamily: "'Space Mono', monospace", letterSpacing: 1 }}>ENTER A PRODUCT IDEA ABOVE TO BEGIN ANALYSIS</div>
            <div style={{ fontSize: 11, marginTop: 8, color: "#1e3a5f" }}>Competitors · Market sizing · SWOT · Positioning recommendations</div>
          </div>
        )}
      </div>
    </div>
  );
}
