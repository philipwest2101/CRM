import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { AI_SCORE_CACHE, ALL_LEADS, SCORE_TIER, scoreLeadWithAI } from "../../lib/core";
import { C } from "../../theme";

export const ScoreBadge = ({ leadId, size="sm", showLabel=false }) => {
  const lead = ALL_LEADS.find(l => l.id === leadId);
  const [ai, setAi] = useState(AI_SCORE_CACHE[leadId] || null);
  const [loading, setLoading] = useState(!AI_SCORE_CACHE[leadId]);

  useEffect(() => {
    if (!lead || AI_SCORE_CACHE[leadId]) return; // already cached
    let cancelled = false;
    setLoading(true);
    scoreLeadWithAI(lead).then(result => {
      if (!cancelled) { setAi(result); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [leadId]);

  const r = size === "lg" ? 22 : 14;
  const strokeW = size === "lg" ? 4 : 3;
  const circ = 2 * Math.PI * r;
  const fontSize = size === "lg" ? 12 : 9;
  const dim = (r + strokeW) * 2;

  // Loading spinner
  if (loading || !ai) {
    return (
      <div style={{ display:"inline-flex", alignItems:"center", gap:5 }}>
        <svg width={dim} height={dim}>
          <circle cx={r+strokeW} cy={r+strokeW} r={r} fill="none" stroke={C.border} strokeWidth={strokeW}/>
          <circle cx={r+strokeW} cy={r+strokeW} r={r} fill="none" stroke={C.muted} strokeWidth={strokeW}
            strokeDasharray={`${circ*0.6} ${circ*0.4}`} strokeLinecap="round">
            <animateTransform attributeName="transform" type="rotate"
              from={`0 ${r+strokeW} ${r+strokeW}`} to={`360 ${r+strokeW} ${r+strokeW}`} dur="0.9s" repeatCount="indefinite"/>
          </circle>
        </svg>
        {showLabel && <span style={{ fontSize:11, color:C.muted }}>Scoring…</span>}
      </div>
    );
  }

  const tier = SCORE_TIER[ai.tier] || SCORE_TIER.warm;
  const fill = (ai.score / 100) * circ;

  if (ai.tier === "closed") {
    return (
      <span style={{ fontSize:10, background:C.green+"15", color:C.green, padding:"2px 8px", borderRadius:10, fontWeight:700, whiteSpace:"nowrap" }}>
        ✓ Closed
      </span>
    );
  }

  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:5 }}
      title={`AI Score: ${ai.score} — ${tier.label}\n${ai.reasons.join('\n')}`}>
      <svg width={dim} height={dim} style={{ flexShrink:0 }}>
        <circle cx={r+strokeW} cy={r+strokeW} r={r} fill="none" stroke={tier.color+"25"} strokeWidth={strokeW}/>
        <circle cx={r+strokeW} cy={r+strokeW} r={r} fill="none" stroke={tier.color} strokeWidth={strokeW}
          strokeDasharray={`${fill} ${circ-fill}`} strokeDashoffset={circ/4} strokeLinecap="round"/>
        <text x={r+strokeW} y={r+strokeW+(fontSize*0.38)} textAnchor="middle" fontSize={fontSize} fontWeight="800" fill={tier.color}>{ai.score}</text>
      </svg>
      {showLabel && <span style={{ fontSize:11, fontWeight:700, color:tier.color }}>{tier.label}</span>}
    </div>
  );
};

// ─── Claude API Integration ───────────────────────────────────────────────────
