import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { StatsPanel } from "../components/dashboard/stats-panel";
import { ReportDetail } from "../components/reports/report-detail";
import { C } from "../theme";

export const DEFAULT_DOCUMENT_TYPES = [
  {
    id:"dt1", label:"Income verification", icon:"💰", required:true,
    subject:"Please send us your income verification",
    body:`Dear {{lead_name}},

To proceed with your personal financial consultation, we need you to provide proof of your current income.

Please upload or send the document(s) listed below at your earliest convenience. If you have any questions, don't hesitate to reach out directly.

Best regards,
{{advisor_name}}`,
    instructions:[
      "Most recent payslip (last 1–3 months)",
      "If self-employed: last 2 years' tax returns or profit & loss statement",
      "If retired: pension statement or notice of pension amount",
    ],
    acceptedFormats:"PDF, JPG, PNG · Max 10 MB per file",
  },
  {
    id:"dt2", label:"ID / Passport copy", icon:"🪪", required:true,
    subject:"ID verification required for your consultation",
    body:`Dear {{lead_name}},

As part of our legally required identity verification process, we need a copy of a valid government-issued photo ID.

Please ensure the document is clearly legible and not expired.

Best regards,
{{advisor_name}}`,
    instructions:[
      "Front AND back of national ID card, OR",
      "Photo page of valid passport",
      "Document must be valid (not expired)",
      "Full name, date of birth, and photo must be clearly visible",
    ],
    acceptedFormats:"PDF, JPG, PNG · Max 5 MB",
  },
  {
    id:"dt3", label:"Bank statement", icon:"🏦", required:false,
    subject:"Bank statement needed to complete your profile",
    body:`Dear {{lead_name}},

To give you the most accurate financial recommendations, we'd like to review a recent bank statement.

This helps us understand your current financial situation and tailor our advice accordingly. All documents are handled strictly confidentially.

Best regards,
{{advisor_name}}`,
    instructions:[
      "Last 3 months of bank statements",
      "Must show account holder name and IBAN",
      "Can be exported as PDF directly from your online banking",
      "Redact any transactions you'd prefer to keep private",
    ],
    acceptedFormats:"PDF · Max 20 MB",
  },
  {
    id:"dt4", label:"Signed consent form", icon:"✍️", required:true,
    subject:"Please sign and return your consent form",
    body:`Dear {{lead_name}},

Attached is our data processing consent form. Please sign and return it so we can proceed with your consultation.

You can sign digitally using any PDF viewer, or print, sign, and scan/photograph it.

Best regards,
{{advisor_name}}`,
    instructions:[
      "Download the attached consent form",
      "Sign in the designated field (digital or handwritten)",
      "Return the signed copy via this portal or by email",
      "Keep a copy for your own records",
    ],
    acceptedFormats:"PDF · Signed copy only",
  },
  {
    id:"dt5", label:"Employment contract", icon:"📄", required:false,
    subject:"Employment contract needed for your application",
    body:`Dear {{lead_name}},

To assess your eligibility for certain financial products, we need a copy of your current employment contract or a letter of employment from your employer.

Best regards,
{{advisor_name}}`,
    instructions:[
      "Current employment contract (first page + signature page), OR",
      "Official letter of employment on company letterhead",
      "Must confirm: employer name, start date, contract type (permanent/fixed-term), and gross salary",
    ],
    acceptedFormats:"PDF, JPG, PNG · Max 10 MB",
  },
  {
    id:"dt6", label:"Tax assessment (last year)", icon:"📊", required:false,
    subject:"Tax assessment document required",
    body:`Dear {{lead_name}},

Please provide your most recent tax assessment notice (Steuerbescheid) issued by the tax authority. This helps us verify your declared income and optimise your financial strategy.

Best regards,
{{advisor_name}}`,
    instructions:[
      "Most recent Steuerbescheid (tax assessment notice)",
      "Issued by Finanzamt within the last 2 years",
      "All pages including the summary page",
      "You can download this from ELSTER (elster.de) if you don't have the paper copy",
    ],
    acceptedFormats:"PDF · Max 15 MB",
  },
];
// Module-level store so Settings edits are visible in the drawer within the same session

export let DOCUMENT_TYPES_STORE = DEFAULT_DOCUMENT_TYPES.map(d=>({...d}));

// ─── Label Store (SA-managed, org-wide) ──────────────────────────────────────

export let LABELS_STORE = [
  { id:"lbl1", name:"Hot Contact",       color:"#DC2626", desc:"High intent, prioritise now",        active:true  },
  { id:"lbl2", name:"VIP",            color:"#7C3AED", desc:"Key account or referral",             active:true  },
  { id:"lbl3", name:"GDPR Pending",   color:"#D97706", desc:"Consent form not yet returned",       active:true  },
  { id:"lbl4", name:"Campaign Q1",    color:"#0891B2", desc:"Q1 2026 Finanz campaign contact",        active:true  },
  { id:"lbl5", name:"Do Not Call",    color:"#64748B", desc:"Contact requested no phone contact",     active:true  },
  { id:"lbl6", name:"Callback Set",   color:"#059669", desc:"Follow-up call scheduled",            active:true  },
  { id:"lbl7", name:"Appointment Set",color:"#4338CA", desc:"Advisory appointment confirmed",      active:true  },
  { id:"lbl8", name:"Lost",           color:"#94A3B8", desc:"Contact closed as lost",                 active:false },
];


// ─── Lifecycle Stages & Stage Statuses (Super-Admin configurable) ─────────────
// Statuses are NOT hardcoded: the Super Admin defines the set, order, names and
// translations here (mirrors User_Story_Settings_Part_2). Each status carries a
// `control` mode (system | user | hybrid) and — for system/hybrid statuses — a
// `trigger` plus semantic `flags`. The automation engine (WORKFLOW_RULES_STORE)
// keys off the flags, never off the German name, so renames/reorders don't break
// it. The not-reached threshold is configurable, not fixed at 5 (it's illustrative).

export let STATUS_AUTOMATION_CONFIG = { notReachedThreshold:5 };

// Semantic flags the automation engine targets instead of status names.

export const STATUS_FLAGS = [
  { id:"isNewDefault",         label:"Default for new contacts" },
  { id:"isNotReachedTerminal", label:"Not-reached terminal (counter target)" },
  { id:"isAppointment",        label:"Appointment (triggers calendar sync)" },
  { id:"isWon",                label:"Closed-won (triggers post-sale)" },
  { id:"excludesOutreach",     label:"Excludes contact from all outreach (DNC)" },
  { id:"retargetingEligible",  label:"Retargeting / nurture eligible (with consent)" },
];

// Statuses are now pure vocabulary: name, translation, order, parent stage, the
// semantic `flags` rules target, and `manual` (can an advisor set it by hand?).
// All trigger/automation logic lives in Workflow & Automation.

export let LIFECYCLE_STORE = [
  { id:"lc1", nameDe:"Neu",            nameEn:"New", statuses:[
    { id:"st1", key:"open",        nameDe:"Neu / Offen",                   nameEn:"New / Open",        manual:false, flags:["isNewDefault"],         color:C.slate,  bg:"#F1F5F9" },
  ]},
  { id:"lc2", nameDe:"In Kontakt",     nameEn:"In Contact", statuses:[
    { id:"st2", key:"in_progress", nameDe:"In Bearbeitung",                nameEn:"In Progress",       manual:true,  flags:[],                       color:C.blue,   bg:"#EFF6FF" },
    { id:"st3", key:"attempted",   nameDe:"Kontaktaufnahme versucht (1–4×)", nameEn:"Attempted",       manual:false, flags:[],                       color:C.amber,  bg:"#FFFBEB" },
    { id:"st4", key:"not_reached", nameDe:"Nicht erreicht",                nameEn:"Not Reached",       manual:false, flags:["isNotReachedTerminal"], color:C.red,    bg:"#FEF2F2" },
    { id:"st5", key:"no_interest", nameDe:"Kein Interesse",                nameEn:"Not Interested",    manual:true,  flags:["retargetingEligible"],  color:C.muted,  bg:"#F9FAFB" },
  ]},
  { id:"lc3", nameDe:"Termin",         nameEn:"Appointment", statuses:[
    { id:"st7", key:"appointment", nameDe:"Termin vereinbart / In Bearbeitung", nameEn:"Appointment Scheduled", manual:false, flags:["isAppointment"],  color:C.indigo, bg:"#EEF2FF" },
    { id:"st8", key:"followup",    nameDe:"Wiedervorlage",                 nameEn:"Follow Up",         manual:true,  flags:[],                       color:C.purple, bg:"#F5F3FF" },
  ]},
  { id:"lc4", nameDe:"Abschluss",      nameEn:"Closing", statuses:[
    { id:"st9", key:"closed",      nameDe:"Erfolgreich abgeschlossen / Kunde", nameEn:"Closed / Customer", manual:true, flags:["isWon"],            color:C.green,  bg:"#ECFDF5" },
  ]},
  { id:"lc5", nameDe:"Ausgeschlossen", nameEn:"Excluded", statuses:[
    { id:"st10", key:"dnc",        nameDe:"Do Not Contact (DNC)",          nameEn:"Do Not Contact",    manual:true,  flags:["excludesOutreach"],     color:C.slate,  bg:"#F1F5F9" },
  ]},
];

// Single source of truth for status badges/labels. Rebuilt after admin edits.

export function buildStatusMeta() {
  const m = {};
  LIFECYCLE_STORE.forEach(stage => stage.statuses.forEach(st => {
    if (st.key) m[st.key] = { label:st.nameEn, de:st.nameDe, color:st.color||C.slate, bg:st.bg||"#F1F5F9", stage:stage.nameEn, flags:st.flags||[] };
  }));
  return m;
}



export const ALL_LEADS = [
  { id:"L-1041", lang:"de", name:"Markus Bauer",    labels:["lbl2"],         email:"m.bauer@email.de",       phone:"+49 171 2345678", zip:"80331", city:"München",   source:"Meta Ads",      campaign:"Q1 Finanz",    status:"open",        assignedVD:null,            assignedGP:null,            created:"Today, 08:14", consent:true,  attempts:0 },
  { id:"L-1033", lang:"de", name:"Hanna Vogel",     labels:["lbl4"],         email:"h.vogel@gmail.com",       phone:"+49 163 9988001", zip:"22083", city:"Hamburg",   source:"Meta Ads",      campaign:"Q1 Finanz",    status:"open",        assignedVD:null,            assignedGP:null,            created:"Today, 06:30", consent:true,  attempts:0 },
  { id:"L-1040", lang:"de", name:"Sandra Richter", labels:["lbl1","lbl6"],  email:"s.richter@web.de",        phone:"+49 152 9876543", zip:"20095", city:"Hamburg",   source:"Landing Page",  campaign:"Webinar März", status:"in_progress", assignedVD:"Thomas Müller", assignedGP:"Anna Klein",    created:"Today, 07:52", consent:true,  attempts:2 },
  { id:"L-1039", lang:"de", name:"Peter Hoffmann",  labels:["lbl6"],         email:"p.hoffmann@gmail.com",    phone:"+49 160 1122334", zip:"50667", city:"Köln",      source:"Google Sheets", campaign:"Partner Ref",  status:"attempted",   assignedVD:"Thomas Müller", assignedGP:"Anna Klein",    created:"Yesterday",    consent:true,  attempts:3 },
  { id:"L-1037", lang:"de", name:"Felix Wagner",    labels:["lbl5"],         email:"f.wagner@email.de",       phone:"+49 176 9988776", zip:"70173", city:"Stuttgart", source:"CSV",           campaign:"Messe FFM",    status:"not_reached", assignedVD:"Thomas Müller", assignedGP:"Marc Otto",     created:"3 days ago",   consent:false, attempts:5 },
  { id:"L-1034", lang:"de", name:"Claudia Becker",  labels:["lbl3"],         email:"c.becker@t-online.de",    phone:"+49 178 1234567", zip:"01067", city:"Dresden",   source:"Zapier",        campaign:"Giveaway",     status:"followup",    assignedVD:"Thomas Müller", assignedGP:"Marc Otto",     created:"5 days ago",   consent:true,  attempts:2 },
  { id:"L-1032", lang:"de", name:"Lars Dietrich",   labels:["lbl2","lbl7"],  email:"l.dietrich@web.de",       phone:"+49 155 7712345", zip:"80335", city:"München",   source:"Landing Page",  campaign:"Webinar März", status:"appointment", assignedVD:"Thomas Müller", assignedGP:"Anna Klein",    created:"3 days ago",   consent:true,  attempts:1 },
  { id:"L-1050", lang:"de", name:"Ralf Neumann",    email:"r.neumann@email.de",      phone:"+49 174 5561234", zip:"80333", city:"München",   source:"Meta Ads",      campaign:"Q1 Finanz",    status:"in_progress", assignedVD:"Thomas Müller", assignedGP:"Thomas Müller", created:"Today, 08:00", consent:true,  attempts:1 },
  { id:"L-1051", lang:"de", name:"Inge Brandt",     email:"i.brandt@web.de",         phone:"+49 161 9871234", zip:"80469", city:"München",   source:"Landing Page",  campaign:"Webinar März", status:"attempted",   assignedVD:"Thomas Müller", assignedGP:"Thomas Müller", created:"Yesterday",    consent:true,  attempts:2 },
  { id:"L-1052", lang:"de", name:"Dirk Schumacher", email:"d.schumacher@gmail.com",  phone:"+49 172 3312345", zip:"81667", city:"München",   source:"Google Sheets", campaign:"Partner Ref",  status:"appointment", assignedVD:"Thomas Müller", assignedGP:"Thomas Müller", created:"2 days ago",   consent:true,  attempts:1 },
  { id:"L-1053", lang:"de", name:"Karla Metz",      email:"k.metz@t-online.de",      phone:"+49 179 7654321", zip:"80636", city:"München",   source:"CSV",           campaign:"Messe FFM",    status:"followup",    assignedVD:"Thomas Müller", assignedGP:"Thomas Müller", created:"4 days ago",   consent:true,  attempts:2 },
  { id:"L-1054", lang:"de", name:"Bernd Vogel",     email:"b.vogel@email.de",        phone:"+49 170 1122333", zip:"80797", city:"München",   source:"Meta Ads",      campaign:"Q1 Finanz",    status:"closed",      assignedVD:"Thomas Müller", assignedGP:"Thomas Müller", created:"6 days ago",   consent:true,  attempts:1, amount:"€ 1.800" },
  { id:"L-1055", lang:"de", name:"Gabi Lorenz",     email:"g.lorenz@web.de",         phone:"+49 152 6677889", zip:"80538", city:"München",   source:"Landing Page",  campaign:"Webinar März", status:"open",        assignedVD:"Thomas Müller", assignedGP:"Thomas Müller", created:"Today, 07:10", consent:false, attempts:0 },
  { id:"L-1038", lang:"de", name:"Julia Schneider", labels:["lbl7"],         email:"j.schneider@t-online.de", phone:"+49 173 5566778", zip:"10115", city:"Berlin",    source:"Meta Ads",      campaign:"Q1 Finanz",    status:"appointment", assignedVD:"Lisa Weber",    assignedGP:"Kai Becker",    created:"2 days ago",   consent:true,  attempts:1 },
  { id:"L-1036", lang:"de", name:"Monika Braun",    email:"m.braun@web.de",          phone:"+49 151 3344556", zip:"90402", city:"Nürnberg",  source:"Landing Page",  campaign:"Webinar März", status:"no_interest", assignedVD:"Lisa Weber",    assignedGP:"Kai Becker",    created:"4 days ago",   consent:true,  attempts:2 },
  { id:"L-1035", lang:"de", name:"Stefan Koch",     labels:["lbl4"],         email:"s.koch@gmail.com",        phone:"+49 170 7788990", zip:"04109", city:"Leipzig",   source:"Meta Ads",      campaign:"Q1 Finanz",    status:"closed",      assignedVD:"Lisa Weber",    assignedGP:"Kai Becker",    created:"5 days ago",   consent:true,  attempts:1, amount:"€ 2.400" },
  { id:"L-1031", lang:"de", name:"Nina Hartmann",   email:"n.hartmann@email.de",     phone:"+49 172 4456789", zip:"50670", city:"Köln",      source:"CSV",           campaign:"Messe FFM",    status:"in_progress", assignedVD:"Lisa Weber",    assignedGP:"Tanja Vogt",    created:"2 days ago",   consent:true,  attempts:1 },
  { id:"L-1030", lang:"de", name:"Ben Schulze",     email:"b.schulze@t-online.de",   phone:"+49 176 3345678", zip:"10178", city:"Berlin",    source:"Google Sheets", campaign:"Partner Ref",  status:"followup",    assignedVD:"Ralf Fischer",  assignedGP:"Ben Hartmann",  created:"4 days ago",   consent:false, attempts:2 },
  // ── Unassigned (SA "Unassigned Leads" panel) ─────────────────────────────────
  { id:"L-2001", lang:"de", name:"Felix Hartmann",  email:"f.hartmann@email.de",    phone:"+49 176 1234567", zip:"13355", city:"Berlin",     source:"Meta Ads",      campaign:"Q1 Finanz",    status:"open", assignedVD:null, assignedGP:null, created:"Today, 07:30", consent:true,  attempts:0 },
  { id:"L-2002", lang:"de", name:"Petra Hofmann",   email:"p.hofmann@web.de",       phone:"+49 151 7654321", zip:"80336", city:"München",    source:"Landing Page",  campaign:"Webinar März", status:"open", assignedVD:null, assignedGP:null, created:"Today, 08:05", consent:true,  attempts:0 },
  { id:"L-2003", lang:"de", name:"Jens Brinkmann",  email:"j.brinkmann@gmail.com",  phone:"+49 170 3456789", zip:"60313", city:"Frankfurt",   source:"Referral",      campaign:"Partner Ref",  status:"open", assignedVD:null, assignedGP:null, created:"Today, 06:50", consent:true,  attempts:0 },
  { id:"L-2004", lang:"de", name:"Sophia Richter",  email:"s.richter2@t-online.de", phone:"+49 163 8876543", zip:"40213", city:"Düsseldorf",  source:"Meta Ads",      campaign:"Q1 Finanz",    status:"open", assignedVD:null, assignedGP:null, created:"Yesterday",    consent:false, attempts:0 },
  { id:"L-2005", lang:"de", name:"Dominik Meier",   email:"d.meier@web.de",         phone:"+49 179 9988776", zip:"70178", city:"Stuttgart",   source:"Google Ads",    campaign:"Giveaway",     status:"open", assignedVD:null, assignedGP:null, created:"Yesterday",    consent:true,  attempts:0 },
  // ── VD Thomas Müller pending (no GP yet — VD "Pending Assignments" panel) ────
  { id:"L-2006", lang:"de", name:"Robert Keller",   email:"r.keller@email.de",      phone:"+49 172 1122334", zip:"01097", city:"Dresden",     source:"Referral",      campaign:"Webinar März", status:"open", assignedVD:"Thomas Müller", assignedGP:null, created:"Today, 09:00", consent:true,  attempts:0 },
  { id:"L-2007", lang:"de", name:"Christine Wolff", email:"c.wolff@gmail.com",      phone:"+49 176 5566778", zip:"04105", city:"Leipzig",     source:"Landing Page",  campaign:"Messe FFM",    status:"open", assignedVD:"Thomas Müller", assignedGP:null, created:"Today, 07:15", consent:true,  attempts:0 },
  { id:"L-2008", lang:"de", name:"Dieter Schulz",   email:"d.schulz@t-online.de",   phone:"+49 155 3344556", zip:"28195", city:"Bremen",      source:"Social",        campaign:"Q1 Finanz",    status:"open", assignedVD:"Thomas Müller", assignedGP:null, created:"Yesterday",    consent:false, attempts:0 },
  { id:"L-2009", lang:"de", name:"Ursula Neumann",  email:"u.neumann@web.de",       phone:"+49 161 7788990", zip:"90402", city:"Nürnberg",    source:"Event",         campaign:"Giveaway",     status:"open", assignedVD:"Thomas Müller", assignedGP:null, created:"2 days ago",   consent:true,  attempts:0 },
  // ── Anna Klein open leads (GP "My Leads" panel) ──────────────────────────────
  { id:"L-2010", lang:"de", name:"Klaus Wagner",    email:"k.wagner@email.de",      phone:"+49 173 9988001", zip:"81667", city:"München",     source:"Event",         campaign:"Webinar März", status:"open", assignedVD:"Thomas Müller", assignedGP:"Anna Klein", created:"Today, 08:30", consent:true,  attempts:1 },
  { id:"L-2011", lang:"de", name:"Lena Brandt",     email:"l.brandt@gmail.com",     phone:"+49 178 4456789", zip:"70173", city:"Stuttgart",   source:"Google Ads",    campaign:"Q1 Finanz",    status:"open", assignedVD:"Thomas Müller", assignedGP:"Anna Klein", created:"Yesterday",    consent:true,  attempts:0 },
  { id:"L-2012", lang:"de", name:"Tobias Fischer",  email:"t.fischer@web.de",       phone:"+49 151 6677889", zip:"50667", city:"Köln",        source:"Referral",      campaign:"Partner Ref",  status:"open", assignedVD:"Thomas Müller", assignedGP:"Anna Klein", created:"2 days ago",   consent:true,  attempts:2 },
  { id:"L-2013", lang:"de", name:"Anna Bergmann",   email:"a.bergmann@t-online.de", phone:"+49 160 2233445", zip:"20095", city:"Hamburg",     source:"Meta Ads",      campaign:"Webinar März", status:"open", assignedVD:"Thomas Müller", assignedGP:"Anna Klein", created:"3 days ago",   consent:false, attempts:1 },
  { id:"L-2014", lang:"de", name:"Michael Stein",   email:"m.stein@email.de",       phone:"+49 174 8877665", zip:"10115", city:"Berlin",      source:"Landing Page",  campaign:"Messe FFM",    status:"open", assignedVD:"Thomas Müller", assignedGP:"Anna Klein", created:"4 days ago",   consent:true,  attempts:0 },
  // ── VD Thomas Müller personal open leads (VD "My Dashboard" panel) ──────────
  { id:"L-2015", lang:"de", name:"Eva Gruber",      email:"e.gruber@web.de",        phone:"+49 171 5544332", zip:"80689", city:"München",     source:"Referral",      campaign:"Partner Ref",  status:"open", assignedVD:"Thomas Müller", assignedGP:"Thomas Müller", created:"Today, 08:45", consent:true,  attempts:1 },
  { id:"L-2016", lang:"de", name:"Klaus Richter",   email:"k.richter@gmail.com",    phone:"+49 176 2233441", zip:"86150", city:"Augsburg",    source:"Meta Ads",      campaign:"Q1 Finanz",    status:"open", assignedVD:"Thomas Müller", assignedGP:"Thomas Müller", created:"Yesterday",    consent:true,  attempts:0 },
  { id:"L-2017", lang:"de", name:"Stefan Wolf",     email:"s.wolf@t-online.de",     phone:"+49 152 8899007", zip:"80999", city:"München",     source:"CSV",           campaign:"Messe FFM",    status:"open", assignedVD:"Thomas Müller", assignedGP:"Thomas Müller", created:"2 days ago",   consent:false, attempts:2 },
];

// ─── P0 AI: Live Contact Scoring ─────────────────────────────────────────────────
// Module-level cache — scores persist for the session, never re-fetch the same lead

export const AI_SCORE_CACHE = {};

// Campaign historical conversion rates (used in prompt context)

export const CAMPAIGN_CONV = { "Q1 Finanz":"8.6%", "Partner Ref":"5.5%", "Webinar März":"4.2%", "Messe FFM":"4.8%", "Giveaway":"2.1%", "CSV":"1.8%" };
// Source intent baselines

export const SOURCE_INTENT = { "Google Sheets":"high (personal referral)", "Landing Page":"high (self-opt-in)", "Meta Ads":"medium (paid click)", "Zapier":"medium", "CSV":"low (bulk import)" };
// Top performing regions

export const REGION_RANK = { "München":"top", "Hamburg":"top", "Berlin":"growing", "Köln":"medium", "Dresden":"medium", "Stuttgart":"medium", "Leipzig":"medium", "Nürnberg":"lower", "Frankfurt":"growing" };


export const scoreLeadWithAI = async (lead) => {
  // Return cached result immediately if available
  if (AI_SCORE_CACHE[lead.id]) return AI_SCORE_CACHE[lead.id];

  const prompt = `You are the AI scoring engine for vion CRM, a financial advisory sales platform in Germany.

Score this lead from 0–100 and classify their tier. Use ONLY these tiers: hot (80–100), warm (40–79), cold (0–39), closed (score=100, only if status=closed).

Contact data:
- Status: ${lead.status}
- Source: ${lead.source} — intent: ${SOURCE_INTENT[lead.source] || "unknown"}
- Campaign: ${lead.campaign} — historical conv. rate: ${CAMPAIGN_CONV[lead.campaign] || "unknown"}
- City: ${lead.city} — region strength: ${REGION_RANK[lead.city] || "unknown"}
- GDPR consent: ${lead.consent ? "yes (double opt-in confirmed)" : "NO — limits email retargeting"}
- Contact attempts: ${lead.attempts} of 5 max
- Assigned: ${lead.assignedGP ? "yes, to "+lead.assignedGP : "unassigned"}
- Contact age: ${lead.created}

Scoring guidance (apply all that are relevant):
- status=closed → score=100, tier=closed
- status=appointment → +25 pts (68% team close rate)
- status=in_progress → +10 pts
- status=followup → +8 pts (expressed interest)
- status=attempted → +5 pts
- status=not_reached + attempts>=5 → heavy penalty
- status=no_interest → score max 10
- No GDPR consent → cap score at 55, flag as risk
- Source "Google Sheets" or partner ref → +15 pts
- Source "Landing Page" → +10 pts
- Source "Meta Ads" → +5 pts
- Source "CSV" → -5 pts
- Campaign conv. rate >6% → +10 pts; 4–6% → +5 pts; <3% → 0 pts
- Region "top" → +8 pts; "growing" → +5 pts; "medium" → 0; "lower" → -3 pts
- Attempts 1–2 → neutral; 3–4 → slight penalty; 5 → heavy penalty
- Fresh lead (today) with 0 attempts → urgency bonus +5

Respond ONLY with valid JSON, no markdown, no explanation:
{"score": <0-100>, "tier": "<hot|warm|cold|closed>", "reasons": ["<reason 1>", "<reason 2>", "<reason 3>", "<reason 4>"]}

Each reason should be a short, specific sentence (max 8 words) explaining a key factor.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!response.ok) throw new Error(`API ${response.status}`);
    const data = await response.json();
    const text = data.content?.find(b => b.type === "text")?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    // Validate shape
    if (typeof parsed.score !== "number" || !parsed.tier || !Array.isArray(parsed.reasons)) throw new Error("Bad shape");
    // Clamp score
    parsed.score = Math.max(0, Math.min(100, Math.round(parsed.score)));
    AI_SCORE_CACHE[lead.id] = parsed;
    return parsed;
  } catch (e) {
    // Fallback: deterministic score from lead fields so UI never breaks
    const fallback = (() => {
      if (lead.status === "closed")      return { score:100, tier:"closed", reasons:["Deal closed","Campaign: "+lead.campaign,"Source: "+lead.source,"Advisor closed"] };
      if (lead.status === "appointment") return { score:82,  tier:"hot",   reasons:["Appointment confirmed","68% team close rate","Source: "+lead.source,"Region: "+lead.city] };
      if (lead.status === "no_interest") return { score:8,   tier:"cold",  reasons:["Marked no interest","No further action","Low re-engagement potential","Source: "+lead.source] };
      if (lead.attempts >= 5)            return { score:12,  tier:"cold",  reasons:["All 5 attempts exhausted","No contact made","Low re-engagement potential",lead.consent?"GDPR ok":"No GDPR consent"] };
      const base = { open:55, in_progress:68, followup:72, attempted:50, not_reached:40 }[lead.status] || 50;
      const tier = base >= 80 ? "hot" : base >= 40 ? "warm" : "cold";
      return { score:base, tier, reasons:["Status: "+lead.status,"Source: "+lead.source,"Campaign: "+lead.campaign,"Region: "+lead.city] };
    })();
    AI_SCORE_CACHE[lead.id] = fallback;
    return fallback;
  }
};

// Convenience getter — returns cached score synchronously (null if not yet scored)
// Per-lead label assignments (module-level, persists within session)

export let LEAD_LABELS_STORE = {};
// Pre-populate from leads that already have labels
ALL_LEADS.forEach(l => { if (l.labels) LEAD_LABELS_STORE[l.id] = [...l.labels]; });


// ─── Workflow Rules Store ─────────────────────────────────────────────────────
// Each rule: trigger, actions (auto_email | reminder | push | all), template, delay, roles, active

export let WORKFLOW_RULES_STORE = [
  {
    id:"wf1", active:true,
    name:"New Contact Assigned", trigger:"lead_assigned", category:"acquisition",
    emailTemplateId:null, emailJourney:"welcome",
    sendEmail:true, emailToLead:true, emailRoles:[],
    setStatus:false, setStatusKey:"",
    createTask:true, taskType:"call", taskTitle:"Call {contact} to introduce yourself within 24h", taskPriority:"high",
    taskRoles:["gp"], taskDueValue:1, taskDueUnit:"days", taskRemind:true, taskRemindLead:"1 hour before",
    sendPush:true, pushRoles:["gp"],
    threshold:5, delay:0, delayUnit:"minutes",
    description:"Welcome email to the contact, a 24h intro-call task for the advisor, and an instant push alert.",
  },
  {
    id:"wf2", active:true,
    name:"Not Reached — Final Attempt", trigger:"lead_not_reached_5", category:"contact",
    emailTemplateId:null, emailJourney:"reengagement",
    sendEmail:true, emailToLead:true, emailRoles:[],
    setStatus:true, setStatusKey:"not_reached",
    createTask:false, taskType:"call", taskTitle:"", taskPriority:"normal",
    taskRoles:["gp"], taskDueValue:0, taskDueUnit:"days", taskRemind:true, taskRemindLead:"1 hour before",
    sendPush:true, pushRoles:["gp","vd"],
    threshold:5, delay:0, delayUnit:"minutes",
    description:"After the final failed attempt: move the contact to Not Reached, send a re-engagement email, and alert GP + VD.",
  },
  {
    id:"wf3", active:true,
    name:"Appointment Scheduled", trigger:"appointment_scheduled", category:"appointment",
    emailTemplateId:null, emailJourney:"reminder",
    sendEmail:true, emailToLead:true, emailRoles:[],
    setStatus:true, setStatusKey:"appointment",
    createTask:true, taskType:"note", taskTitle:"Prepare for appointment with {contact}", taskPriority:"normal",
    taskRoles:["gp"], taskDueValue:0, taskDueUnit:"days", taskRemind:true, taskRemindLead:"1 day before",
    sendPush:true, pushRoles:["gp"],
    threshold:5, delay:0, delayUnit:"minutes",
    description:"Confirm the appointment to the contact, set status to Appointment Scheduled, and give the advisor a prep task.",
  },
  {
    id:"wf4", active:true,
    name:"Closed — New Customer", trigger:"lead_closed", category:"closing",
    emailTemplateId:null, emailJourney:"postnurture",
    sendEmail:true, emailToLead:true, emailRoles:["vd","superadmin"],
    setStatus:true, setStatusKey:"closed",
    createTask:false, taskType:"note", taskTitle:"", taskPriority:"normal",
    taskRoles:["gp"], taskDueValue:0, taskDueUnit:"days", taskRemind:true, taskRemindLead:"1 hour before",
    sendPush:true, pushRoles:["vd","superadmin"],
    threshold:5, delay:0, delayUnit:"minutes",
    description:"Send the customer a post-sale nurture email, mark the contact Closed, and notify VD + Super Admin (email + push).",
  },
  {
    id:"wf5", active:true,
    name:"Consent Withdrawn / DNC", trigger:"consent_withdrawn", category:"compliance",
    emailTemplateId:null, emailJourney:null,
    sendEmail:false, emailToLead:false, emailRoles:[],
    setStatus:true, setStatusKey:"dnc",
    createTask:true, taskType:"note", taskTitle:"Verify {contact} is removed from all outreach lists", taskPriority:"high",
    taskRoles:["superadmin"], taskDueValue:0, taskDueUnit:"days", taskRemind:false, taskRemindLead:"at due time",
    sendPush:true, pushRoles:["gp","vd","superadmin"],
    threshold:5, delay:0, delayUnit:"minutes",
    description:"No contact email (compliant). Move to Do Not Contact, create a Super Admin verification task, and notify all roles.",
  },
];


export const AI_SCORES = new Proxy({}, {
  get: (_, leadId) => AI_SCORE_CACHE[leadId] || null,
});


export const SCORE_TIER = {
  hot:    { color:"#EF4444", bg:"#FEF2F2", label:"Hot",    min:80 },
  warm:   { color:"#F59E0B", bg:"#FFFBEB", label:"Warm",   min:50 },
  cold:   { color:"#94A3B8", bg:"#F1F5F9", label:"Cold",   min:0  },
  closed: { color:"#10B981", bg:"#ECFDF5", label:"Closed", min:100 },
};

// ─── P0 AI: Call Scripts ──────────────────────────────────────────────────────

export const AI_CALL_SCRIPTS = {
  "L-1040": {
    greeting:  "Good afternoon, Ms. Richter! My name is Anna Klein from vion Financial. I'm reaching out regarding your enquiry submitted through our March Webinar programme.",
    pitch:     "You expressed interest in our financial advisory services — that's a great first step. I'd love to take just 5 minutes to explain how we can help you reach your specific financial goals.",
    hook:      "One of our Hamburg clients — a very similar profile to yours — accelerated their wealth-building by 34% within 18 months through our personalised strategy. That's exactly the kind of tailored approach we'd develop for you.",
    objections:[
      { q:"I don't have time right now.", a:"Completely understandable — may I quickly ask whether Monday or Tuesday between 10 and 12 works better for a brief call?" },
      { q:"I'm not really interested anymore.", a:"I hear that rarely from someone who actively signed up — is there a specific concern I can address right now?" },
      { q:"I need to discuss this with my partner first.", a:"Of course — I can arrange an introductory session for both of you, which often makes the decision much easier. Would that work?" },
    ],
    close:     "Ms. Richter, I'd like to propose a 20-minute consultation — completely no-obligation. Would Wednesday at 2pm or Thursday at 10am suit you this week?",
  },
  "L-1039": {
    greeting:  "Good morning, Mr. Hoffmann! Anna Klein from vion Financial. This is my third attempt to reach you — I hope I've caught you at a good moment!",
    pitch:     "You were referred to us through our partner network, which means someone in your circle trusts us enough to recommend you — that's a very strong signal for us.",
    hook:      "Referral clients consistently show our best results: 11 of our last 15 referred clients closed their first arrangement within 6 weeks of the initial call.",
    objections:[
      { q:"How did you get my number?", a:"Through our partner referral network — someone from your network passed your details along. I'm happy to share the full context in our conversation." },
      { q:"I'm already working with an advisor.", a:"That's great — you already have experience in this space, which makes it even more interesting to show you what we offer on top of your current arrangement." },
    ],
    close:     "Mr. Hoffmann, since this is our third attempt, I'd love to lock in a specific time: Friday at 11am — would that work for a 20-minute call?",
  },
  "L-1032": {
    greeting:  "Good afternoon, Mr. Dietrich! Anna Klein from vion Financial. I'm calling ahead of our consultation tomorrow at 3pm.",
    pitch:     "I wanted to quickly confirm everything is set for tomorrow, and give you a preview of what to expect: we'll review your current financial situation, define your goals, and I'll walk you through three concrete strategies.",
    hook:      "One of our Munich clients — a March Webinar participant just like yourself — achieved a 28% return improvement in the first year following our session.",
    objections:[
      { q:"I can't make tomorrow's appointment.", a:"No problem at all — I can immediately reschedule to the day after or next week. What works best for you?" },
    ],
    close:     "Mr. Dietrich, I'm looking forward to tomorrow! I'll send you a preparation summary by email beforehand so you come fully prepared. See you then!",
  },
  "default": {
    greeting:  "Good morning! My name is Anna Klein from vion Financial. I'm reaching out regarding your recent enquiry about our financial advisory services.",
    pitch:     "We help our clients build clear financial strategies that genuinely fit their life situation — personalised, transparent, and results-oriented.",
    hook:      "Over the past 12 months we've helped more than 300 clients reach their financial goals faster — on average 26% more efficiently than with traditional bank advisory services.",
    objections:[
      { q:"I don't have time right now.", a:"Completely understandable — I only need 5 minutes. May I quickly explain what this is about?" },
      { q:"I'm not interested.", a:"May I ask what's holding you back? I want to make sure our offer genuinely fits your situation before we go any further." },
      { q:"I need to think about it.", a:"Of course — may I give you a quick summary of the key points so you can make a well-informed decision?" },
    ],
    close:     "I'd like to suggest a 20-minute, completely no-obligation introductory call. Would Wednesday or Thursday this week suit you better?",
  },
};

// ─── P0 AI: Classify samples (simulated AI parsing) ──────────────────────────

export const classifyOutcome = (text) => {
  const t = text.toLowerCase();
  if (t.includes("termin") || t.includes("appointment") || t.includes("vereinbart") || t.includes("um ") || t.includes("uhr"))
    return { status:"appointment", label:"Appointment Set", color:C.indigo, nextAction:"Prepare appointment brief", followup:"", confidence:94, reasoning:"Detected appointment language: time reference + agreement keywords.",
      suggestAppointment:false,
      agentSuggestion: null };
  if ((t.includes("interessiert") || t.includes("interest") || t.includes("callback") || t.includes("rückruf")) && !t.includes("kein") && !t.includes("nicht"))
    return { status:"followup", label:"Follow Up", color:C.purple, nextAction:"Call back as agreed", followup:"+2 days", confidence:88, reasoning:"Contact expressed interest and requested a follow-up callback.",
      suggestAppointment: true,
      agentSuggestion: "The contact expressed **genuine interest** — this is exactly the right moment to lock in a time while motivation is high. I recommend proposing a **20-minute video call** rather than another phone call: it signals seriousness and increases show rate by ~18%. Based on their profile, **Tuesday or Thursday morning (10:00–11:30)** are the strongest slots for this ZIP region. Would you like to book it now?" };
  if (t.includes("nicht erreicht") || t.includes("nicht erreichbar") || t.includes("keine antwort") || t.includes("mailbox") || t.includes("not reached") || t.includes("no answer"))
    return { status:"attempted", label:"Attempted", color:C.amber, nextAction:"Retry tomorrow morning", followup:"+1 day", confidence:97, reasoning:"No contact made — voicemail or no answer detected.",
      suggestAppointment: false,
      agentSuggestion: null };
  if (t.includes("kein interesse") || t.includes("nicht interesse") || t.includes("not interested") || t.includes("ablehnung") || t.includes("nein danke"))
    return { status:"no_interest", label:"No Interest", color:C.muted, nextAction:"Archive contact", followup:"", confidence:92, reasoning:"Explicit rejection or disinterest detected.",
      suggestAppointment: false,
      agentSuggestion: null };
  if (t.includes("erreicht") || t.includes("reached") || t.includes("gesprochen") || t.includes("spoken"))
    return { status:"in_progress", label:"In Progress", color:C.blue, nextAction:"Send follow-up email", followup:"+1 day", confidence:85, reasoning:"Contact was made — continuing conversation.",
      suggestAppointment: true,
      agentSuggestion: "Good — contact was made. The next step that moves contacts forward fastest is **scheduling a structured appointment** rather than leaving it open-ended. Contacts who have a confirmed time slot are **3× more likely to close** than those waiting for a callback. I can pull up available slots now — want to set one?" };
  return { status:"in_progress", label:"In Progress", color:C.blue, nextAction:"Review and update manually", followup:"", confidence:62, reasoning:"General activity detected — please review status manually.",
    suggestAppointment: false,
    agentSuggestion: null };
};

// ─── Static CRM Data ──────────────────────────────────────────────────────────

export const SA_KPIS = [
  { label:"Total Contacts",  value:"2.904", delta:"+12%",   up:true,  color:C.navy,   spark:[40,55,48,62,70,65,80,75,90,88,95,102] },
  { label:"Unassigned",   value:"47",    delta:"-8",     up:true,  color:C.red,    spark:[80,72,68,60,55,58,52,48,47,44,40,47]  },
  { label:"Appointments", value:"134",   delta:"+23%",   up:true,  color:C.indigo, spark:[60,65,70,80,75,85,90,95,100,110,120,134] },
  { label:"Closed (MTD)", value:"89",    delta:"+31%",   up:true,  color:C.green,  spark:[20,28,35,40,45,52,58,63,70,75,82,89]  },
  { label:"Not Reached",  value:"203",   delta:"+4%",    up:false, color:C.amber,  spark:[180,185,190,188,195,198,200,202,200,205,203,203] },
  { label:"Conv. Rate",   value:"6.2%",  delta:"+1.1pp", up:true,  color:C.purple, spark:[3.8,4.1,4.5,4.8,5.0,5.2,5.5,5.7,5.9,6.0,6.1,6.2] },
];

export const SA_VD_STATS = [
  { name:"Thomas Müller", leads:890, gps:3, appts:54, closed:34, rate:"7.1%", selfLeads:6 },
  { name:"Lisa Weber",    leads:720, gps:2, appts:41, closed:28, rate:"6.5%", selfLeads:0 },
  { name:"Ralf Fischer",  leads:540, gps:1, appts:28, closed:18, rate:"5.2%", selfLeads:0 },
  { name:"Jana Kruse",    leads:410, gps:2, appts:11, closed:9,  rate:"3.9%", selfLeads:0 },
];

export const SA_SOURCE_DATA = [
  { label:"Meta Ads",      value:1240, color:C.indigo },
  { label:"Landing Pages", value:780,  color:C.blue   },
  { label:"Google Sheets", value:430,  color:C.green  },
  { label:"CSV",           value:205,  color:C.amber  },
  { label:"Other",         value:249,  color:C.muted  },
];

export const SA_RECENT = [
  { name:"Markus Bauer",    source:"Meta Ads",     status:"open",        vd:null            },
  { name:"Sandra Richter",  source:"Landing Page", status:"in_progress", vd:"Thomas Müller" },
  { name:"Julia Schneider", source:"Meta Ads",     status:"appointment", vd:"Lisa Weber"    },
  { name:"Felix Wagner",    source:"CSV",           status:"not_reached", vd:"Thomas Müller" },
  { name:"Stefan Koch",     source:"Landing Page", status:"closed",      vd:"Lisa Weber"    },
];

export const VD_KPIS = [
  { label:"Team Contacts",   value:"890", delta:"+18%", up:true, color:C.indigo },
  { label:"Unassigned",   value:"12",  delta:"-3",   up:true, color:C.red    },
  { label:"Appointments", value:"54",  delta:"+11%", up:true, color:C.blue   },
  { label:"Closed (MTD)", value:"34",  delta:"+26%", up:true, color:C.green  },
];

export const VD_PERSONAL_KPIS = [
  { label:"My Contacts",     value:"6",  delta:"+2",    up:true, color:C.indigo },
  { label:"Due Today",    value:"3",  delta:"calls", up:null, color:C.amber  },
  { label:"Appointments", value:"2",  delta:"+1",    up:true, color:C.blue   },
  { label:"Closed (MTD)", value:"1",  delta:"new",   up:null, color:C.green  },
];

export const VD_GP_PERF = [
  { name:"Anna Klein",   leads:310, reached:198, appts:21, closed:14, rate:"8.1%", scriptOpens:18, callsLogged:22, adherence:84, topGap:"close",   coachNote:"Strong pitcher — often skips the close step." },
  { name:"Marc Otto",    leads:290, reached:175, appts:18, closed:11, rate:"6.7%", scriptOpens:11, callsLogged:20, adherence:61, topGap:"objection",coachNote:"Drops call when objection raised — needs objection drills." },
  { name:"Nina Schmitt", leads:290, reached:160, appts:15, closed:9,  rate:"5.4%", scriptOpens:6,  callsLogged:18, adherence:38, topGap:"pitch",    coachNote:"Low script usage — improvising pitch, inconsistent results." },
];

export const VD_PIPELINE = [
  { label:"Open",        value:148, color:C.slate  },
  { label:"In Progress", value:210, color:C.blue   },
  { label:"Attempted",   value:185, color:C.amber  },
  { label:"Appointment", value:54,  color:C.indigo },
  { label:"Follow Up",   value:67,  color:C.purple },
  { label:"Closed",      value:34,  color:C.green  },
  { label:"Not Reached", value:125, color:C.red    },
  { label:"No Interest", value:67,  color:C.muted  },
];

export const VD_SCHEDULE = [
  { time:"10:00", lead:"Sandra Richter", type:"📞 Call",  gp:"Anna Klein",   status:"upcoming" },
  { time:"11:30", lead:"Peter Hoffmann", type:"📞 Call",  gp:"Marc Otto",    status:"upcoming" },
  { time:"14:00", lead:"Claudia Becker", type:"📹 Video", gp:"Anna Klein",   status:"upcoming" },
  { time:"16:00", lead:"Ralf Neumann",   type:"📞 Call",  gp:"Nina Schmitt", status:"done"     },
];

export const GP_KPIS = [
  { label:"My Contacts",     value:"62", delta:"+8",    up:true, color:C.green },
  { label:"Due Today",    value:"5",  delta:"calls", up:null, color:C.amber },
  { label:"Not Reached",  value:"9",  delta:"-2",    up:true, color:C.red   },
  { label:"Closed (MTD)", value:"14", delta:"+3",    up:true, color:C.navy  },
];

export const GP_PRIORITY = [
  { id:"L-1040", lang:"de", name:"Sandra Richter", labels:["lbl1","lbl6"], status:"in_progress", attempts:2, nextAction:"Call today at 14:00",  urgency:"high" },
  { id:"L-1039", lang:"de", name:"Peter Hoffmann", status:"attempted",   attempts:3, nextAction:"3rd attempt pending",  urgency:"high" },
  { id:"L-1033", lang:"de", name:"Hanna Vogel",    status:"open",        attempts:0, nextAction:"First contact needed", urgency:"med"  },
  { id:"L-1032", lang:"de", name:"Lars Dietrich",  status:"appointment", attempts:1, nextAction:"Appt: Thu 15:00",      urgency:"low"  },
  { id:"L-1034", lang:"de", name:"Claudia Becker", status:"followup",    attempts:2, nextAction:"Send follow-up email", urgency:"med"  },
];

export const GP_FUNNEL  = [
  { label:"Contacts Contacted",  value:48, max:62, color:C.blue   },
  { label:"Contacts Reached",    value:33, max:62, color:C.indigo },
  { label:"Appointments Set", value:21, max:62, color:C.purple },
  { label:"Closed",           value:14, max:62, color:C.green  },
];

export const VD_FUNNEL  = [
  { label:"Contacts Contacted",  value:5, max:6, color:C.blue   },
  { label:"Contacts Reached",    value:4, max:6, color:C.indigo },
  { label:"Appointments Set", value:2, max:6, color:C.purple },
  { label:"Closed",           value:1, max:6, color:C.green  },
];

export const VD_TODO = [
  { label:"Call Ralf Neumann",                  time:"Due now",   done:false },
  { label:"2nd attempt — Inge Brandt",          time:"Due today", done:false },
  { label:"Appointment prep — Dirk Schumacher", time:"Due today", done:false },
  { label:"Log morning call outcome",            time:"Overdue",   done:false },
  { label:"Update Karla Metz status",            time:"Done",      done:true  },
];

export const GP_TODO = [
  { label:"Call Sandra Richter",             time:"Due now",   done:false },
  { label:"3rd attempt — Peter Hoffmann",    time:"Due today", done:false },
  { label:"Follow-up email Claudia Becker",  time:"Due today", done:false },
  { label:"Log outcome from morning call",    time:"Overdue",   done:false },
  { label:"Update status — Lars Dietrich",    time:"Done",      done:true  },
];

export const VDS = ["Thomas Müller","Lisa Weber","Ralf Fischer"];

export const GPS_BY_VD = {
  "Thomas Müller":["Thomas Müller","Anna Klein","Marc Otto","Nina Schmitt"],
  "Lisa Weber":   ["Kai Becker","Tanja Vogt"],
  "Ralf Fischer": ["Ben Hartmann"],
};

export const ALL_SOURCES = ["Meta Ads","Landing Page","Google Sheets","CSV","Zapier"];
// Derived from LIFECYCLE_STORE so every status badge follows the Super-Admin config.

export let STATUS_META = buildStatusMeta();

export const TIMELINE_EVENTS = [
  { time:"Today, 09:30", actor:"Anna Klein",     action:"Scheduled follow-up call for 14:00",             type:"call"    },
  { time:"Today, 09:00", actor:"Anna Klein",     action:"Contact attempt #2 — reached, interested in offer", type:"attempt" },
  { time:"Today, 08:20", actor:"System",         action:"Contact auto-assigned to Anna Klein (ZIP match)",    type:"assign"  },
  { time:"Today, 08:16", actor:"System",         action:"Welcome email sent automatically",               type:"email"   },
  { time:"Today, 07:52", actor:"System",         action:"Contact captured via Landing Page (Webinar März)",  type:"import"  },
];

// ─── Appointments Data ────────────────────────────────────────────────────────

// ─── Activity Types ───────────────────────────────────────────────────────────
// Two categories: "task" (Call / Email / Note) and "appointment" (Consultation /
// Recruiting / Business appointment / Other). Legacy keys are kept so existing stored
// activities still resolve, but the Add-Activity menu offers the grouped set below.

export const ACTIVITY_TYPES = {
  // Tasks
  call:         { category:"task",        label:"Call",            icon:"📞", color:"#3B82F6", bg:"#EFF6FF", short:"Call",     hasEnd:false, hasLocation:false, hasLink:false, timeLabel:"Start time",  durOptions:[15,30,45,60,90] },
  email:        { category:"task",        label:"Email",           icon:"✉️", color:"#D97706", bg:"#FFFBEB", short:"Email",    hasEnd:false, hasLocation:false, hasLink:false, timeLabel:"Due time",    durOptions:null },
  note:         { category:"task",        label:"Note",            icon:"📝", color:"#64748B", bg:"#F8FAFC", short:"Note",     hasEnd:false, hasLocation:false, hasLink:false, timeLabel:null,          durOptions:null },
  // Appointments
  consultation: { category:"appointment", label:"Consultation",    icon:"💼", color:"#059669", bg:"#F0FDF4", short:"Consult",  hasEnd:true,  hasLocation:true,  hasLink:true,  timeLabel:"Start",       durOptions:[30,45,60,90] },
  recruiting:   { category:"appointment", label:"Recruiting",      icon:"🧑‍💼", color:"#6366F1", bg:"#EEF2FF", short:"Recruit",  hasEnd:true,  hasLocation:true,  hasLink:true,  timeLabel:"Start",       durOptions:[30,45,60] },
  business:     { category:"appointment", label:"Business Appointment", icon:"🤝", color:"#0891B2", bg:"#ECFEFF", short:"Business", hasEnd:true,  hasLocation:true,  hasLink:true,  timeLabel:"Start",       durOptions:[30,60,90] },
  other:        { category:"appointment", label:"Other",           icon:"📌", color:"#8B5CF6", bg:"#F5F3FF", short:"Other",    hasEnd:true,  hasLocation:true,  hasLink:true,  timeLabel:"Start",       durOptions:null },
  // Legacy keys (kept for existing data; not offered in the Add menu)
  whatsapp:  { category:"task",        label:"WhatsApp / SMS",    icon:"💬", color:"#25D366", bg:"#F0FFF4", short:"WhatsApp", hasEnd:false, hasLocation:false, hasLink:false, timeLabel:"Send time",   durOptions:null },
  inperson:  { category:"appointment", label:"In-Person Appointment", icon:"🤝", color:"#059669", bg:"#F0FDF4", short:"Appointment", hasEnd:true,  hasLocation:true,  hasLink:false, timeLabel:"Start",       durOptions:null },
  video:     { category:"appointment", label:"Video Appointment",     icon:"📹", color:"#7C3AED", bg:"#F5F3FF", short:"Video",    hasEnd:true,  hasLocation:false, hasLink:true,  timeLabel:"Start",       durOptions:null },
  document:  { category:"task",        label:"Document Request",  icon:"📋", color:"#0891B2", bg:"#F0F9FF", short:"Doc",      hasEnd:false, hasLocation:false, hasLink:false, timeLabel:"Due date",    durOptions:null },
  event:     { category:"appointment", label:"Event Invite",      icon:"🎟️", color:"#BE185D", bg:"#FDF2F8", short:"Event",    hasEnd:true,  hasLocation:true,  hasLink:true,  timeLabel:"Start",       durOptions:null },
};
// Grouped sets offered in the Add-Activity menu and modal picker.

export const APPOINTMENT_TYPE_KEYS = ["consultation","recruiting","business","other"];

export const TASK_TYPE_KEYS        = ["call","email","note"];


export const ACTIVITY_STATUS_META = {
  upcoming:  { label:"Upcoming",  color:"#3B82F6" },
  confirmed: { label:"Confirmed", color:"#059669" },
  done:      { label:"Done",      color:"#64748B" },
  cancelled: { label:"Cancelled", color:"#DC2626" },
  noshow:    { label:"No-show",   color:"#D97706" },
  pending:   { label:"Pending",   color:"#D97706" },
  active:    { label:"Active",    color:"#059669" },
  completed: { label:"Completed", color:"#64748B" },
};

// Canonical task/reminder priority set — single source of truth shared by the
// Task modal, Add-Activity modal, the quick-reminder modal and the dashboard.
export const PRIORITY_META = {
  low:    { label:"Low",    color:"#64748B" },
  normal: { label:"Normal", color:"#FDB022" },
  high:   { label:"High",   color:"#F04438" },
  urgent: { label:"Urgent", color:"#B42318" },
};
export const PRIORITY_KEYS = ["low","normal","high","urgent"];

// Statuses that mean a task/reminder is finished (no longer "open").
export const DONE_STATUSES = ["done","completed","cancelled"];

// ── Feedback & Processing status terminology ────────────────────────────────
// Single source of truth for how a lead's processing stage is named across the
// lead list, dashboard tables and anywhere the "Feedback & Processing" status
// is shown — clearer, action-oriented labels instead of raw step names.
export const FEEDBACK_STATUS_LABEL = {
  open:        "New",
  in_progress: "In Contact",
  attempted:   "In Contact",
  not_reached: "Not Reached",
  followup:    "Follow Up",
  appointment: "Appointment",
  closed:      "Qualified",
  no_interest: "Not Interested",
  dnc:         "Do Not Contact",
};
export const feedbackStatusLabel = (status) => FEEDBACK_STATUS_LABEL[status] || FEEDBACK_STATUS_LABEL.open;

// Unified ACTIVITIES store — merges appointments + reminders
// Each activity: id, type, title, lead, leadId, date, time, end, gp, vd,
//                status, priority, note, recur, channels, entityType, category



export const APPT_TYPE_META = {
  call:     { label:"📞 Phone Call",   color:"#3B82F6", bg:"#EFF6FF" },
  video:    { label:"📹 Video Call",   color:"#6366F1", bg:"#EEF2FF" },
  inperson: { label:"🤝 In-Person",   color:"#10B981", bg:"#ECFDF5" },
};

// Appointment types (what the appointment is about) — used for the
// dashboard badges and matches the "Appointment Type" options in the modals.
export const APPOINTMENT_TYPE_META = {
  "Consultation Appointment": { short:"Consultation",     color:"#3B82F6" },
  "Recruiting":               { short:"Recruiting",       color:"#8B5CF6" },
  "Business Opening":         { short:"Business Opening", color:"#10B981" },
  "Investment Talk":          { short:"Investment Talk",  color:"#6366F1" },
  "Finance Talk":             { short:"Finance Talk",     color:"#F59E0B" },
  "Other":                    { short:"Other",            color:"#94A3B8" },
};

export const APPT_STATUS_META = {
  upcoming:  { label:"Upcoming",   color:"#3B82F6" },
  confirmed: { label:"Confirmed",  color:"#6366F1" },
  done:      { label:"Done ✓",    color:"#10B981" },
  cancelled: { label:"Cancelled",  color:"#94A3B8" },
  noshow:    { label:"No Show",    color:"#EF4444" },
};

// ─── Auto-Assign ZIP Rules ────────────────────────────────────────────────────

export const ZIP_RULES = [
  { prefix:"80", city:"München (80xxx)",      gp:"Anna Klein",    vd:"Thomas Müller", convRate:8.1, capacity:80,  used:62,  priority:"high"   },
  { prefix:"81", city:"München (81xxx)",      gp:"Anna Klein",    vd:"Thomas Müller", convRate:8.1, capacity:80,  used:62,  priority:"high"   },
  { prefix:"50", city:"Köln",                 gp:"Marc Otto",     vd:"Thomas Müller", convRate:6.7, capacity:70,  used:58,  priority:"medium" },
  { prefix:"20", city:"Hamburg",              gp:"Marc Otto",     vd:"Thomas Müller", convRate:6.7, capacity:70,  used:58,  priority:"medium" },
  { prefix:"40", city:"Düsseldorf",           gp:"Nina Schmitt",  vd:"Thomas Müller", convRate:5.4, capacity:65,  used:58,  priority:"medium" },
  { prefix:"60", city:"Frankfurt",            gp:"Kai Becker",    vd:"Lisa Weber",    convRate:7.3, capacity:60,  used:55,  priority:"medium" },
  { prefix:"70", city:"Stuttgart",            gp:"Kai Becker",    vd:"Lisa Weber",    convRate:7.3, capacity:60,  used:55,  priority:"medium" },
  { prefix:"90", city:"Nürnberg",             gp:"Tanja Vogt",    vd:"Lisa Weber",    convRate:5.8, capacity:55,  used:42,  priority:"low"    },
  { prefix:"10", city:"Berlin",               gp:"Ben Hartmann",  vd:"Ralf Fischer",  convRate:4.8, capacity:50,  used:42,  priority:"low"    },
  { prefix:"28", city:"Bremen",               gp:"Tanja Vogt",    vd:"Lisa Weber",    convRate:5.8, capacity:55,  used:42,  priority:"low"    },
  { prefix:"30", city:"Hannover",             gp:"Nina Schmitt",  vd:"Thomas Müller", convRate:5.4, capacity:65,  used:58,  priority:"medium" },
  { prefix:"04", city:"Leipzig",              gp:"Ben Hartmann",  vd:"Ralf Fischer",  convRate:4.8, capacity:50,  used:42,  priority:"low"    },
];


export const UNASSIGNED_LEADS_POOL = [
  { id:"L-2001", lang:"de", name:"Stefan Bauer",     zip:"80331", city:"München",     source:"Meta Ads",      campaign:"Q1 Finanz",   created:"Today, 08:14", consent:true  },
  { id:"L-2002", lang:"de", name:"Julia Maier",      zip:"50667", city:"Köln",        source:"Landing Page",  campaign:"Webinar März",created:"Today, 07:52", consent:true  },
  { id:"L-2003", lang:"de", name:"Klaus Richter",    zip:"20095", city:"Hamburg",     source:"Google Sheets", campaign:"Partner Ref", created:"Today, 09:01", consent:true  },
  { id:"L-2004", lang:"de", name:"Petra Hofmann",    zip:"40213", city:"Düsseldorf",  source:"Meta Ads",      campaign:"Q1 Finanz",   created:"Today, 06:30", consent:false },
  { id:"L-2005", lang:"de", name:"Martin Weber",     zip:"60311", city:"Frankfurt",   source:"CSV",           campaign:"Messe FFM",   created:"Yesterday",    consent:true  },
  { id:"L-2006", lang:"de", name:"Sabine Fischer",   zip:"70173", city:"Stuttgart",   source:"Meta Ads",      campaign:"Q1 Finanz",   created:"Yesterday",    consent:true  },
  { id:"L-2007", lang:"de", name:"Thomas Braun",     zip:"90402", city:"Nürnberg",    source:"Landing Page",  campaign:"Giveaway",    created:"Yesterday",    consent:true  },
  { id:"L-2008", lang:"de", name:"Karin Wolf",       zip:"10115", city:"Berlin",      source:"Meta Ads",      campaign:"Q1 Finanz",   created:"2d ago",       consent:false },
  { id:"L-2009", lang:"de", name:"Andreas Müller",   zip:"80469", city:"München",     source:"Zapier",        campaign:"Webinar März",created:"2d ago",       consent:true  },
  { id:"L-2010", lang:"de", name:"Claudia Schäfer",  zip:"50674", city:"Köln",        source:"Landing Page",  campaign:"Q1 Finanz",   created:"2d ago",       consent:true  },
  { id:"L-2011", lang:"de", name:"Frank Neumann",    zip:"30159", city:"Hannover",    source:"CSV",           campaign:"Messe FFM",   created:"3d ago",       consent:true  },
  { id:"L-2012", lang:"de", name:"Ingrid Koch",      zip:"04103", city:"Leipzig",     source:"Meta Ads",      campaign:"Q1 Finanz",   created:"3d ago",       consent:true  },
  { id:"L-2013", lang:"de", name:"Jürgen Lang",      zip:"28195", city:"Bremen",      source:"Google Sheets", campaign:"Partner Ref", created:"3d ago",       consent:false },
  { id:"L-2014", lang:"de", name:"Monika Schulz",    zip:"81541", city:"München",     source:"Meta Ads",      campaign:"Q1 Finanz",   created:"3d ago",       consent:true  },
  { id:"L-2015", lang:"de", name:"Hans Zimmermann",  zip:"40223", city:"Düsseldorf",  source:"Landing Page",  campaign:"Webinar März",created:"4d ago",       consent:true  },
];


export const APPOINTMENTS = [
  // ── Past ──────────────────────────────────────────────────────────────────
  { id:"A-101", date:"2026-02-17", start:"10:00", end:"10:45", type:"call",     apptType:"Consultation Appointment", lead:"Lars Dietrich",   leadId:"L-1032", gp:"Anna Klein",     vd:"Thomas Müller", status:"done",      notes:"Interested — confirmed appointment for 26th" },
  { id:"A-102", date:"2026-02-18", start:"14:00", end:"15:00", type:"video",    apptType:"Investment Talk", lead:"Sandra Richter",  leadId:"L-1040", gp:"Anna Klein",     vd:"Thomas Müller", status:"done",      notes:"Qualified — strong interest in Q1 Finanz" },
  { id:"A-103", date:"2026-02-19", start:"11:00", end:"12:00", type:"inperson", apptType:"Business Opening", lead:"Bernd Vogel",     leadId:"L-1054", gp:"Thomas Müller",  vd:"Thomas Müller", status:"done",      notes:"Closed €1.800 — VD self-close" },
  { id:"A-104", date:"2026-02-20", start:"15:00", end:"16:00", type:"video",    apptType:"Finance Talk", lead:"Stefan Koch",     leadId:"L-1035", gp:"Kai Becker",     vd:"Lisa Weber",    status:"done",      notes:"Closed €2.400 — strong pitch" },
  { id:"A-105", date:"2026-02-23", start:"09:00", end:"09:30", type:"call",     apptType:"Consultation Appointment", lead:"Peter Hoffmann",  leadId:"L-1039", gp:"Anna Klein",     vd:"Thomas Müller", status:"noshow",    notes:"No answer — will retry tomorrow" },
  { id:"A-106", date:"2026-02-23", start:"11:00", end:"12:00", type:"video",    apptType:"Investment Talk", lead:"Julia Schneider", leadId:"L-1038", gp:"Kai Becker",     vd:"Lisa Weber",    status:"done",      notes:"Presentation done — follow-up scheduled" },
  { id:"A-107", date:"2026-02-23", start:"15:30", end:"16:15", type:"call",     apptType:"Finance Talk", lead:"Ralf Neumann",    leadId:"L-1050", gp:"Thomas Müller",  vd:"Thomas Müller", status:"done",      notes:"In progress — proposal sent" },
  // ── Today (Feb 24) ─────────────────────────────────────────────────────────
  { id:"A-108", date:"2026-02-24", start:"10:00", end:"10:45", type:"call",     apptType:"Consultation Appointment", lead:"Sandra Richter",  leadId:"L-1040", gp:"Anna Klein",     vd:"Thomas Müller", status:"upcoming",  notes:"2nd contact — high score 92. Aim to set appointment." },
  { id:"A-109", date:"2026-02-24", start:"11:30", end:"12:00", type:"call",     apptType:"Recruiting", lead:"Peter Hoffmann",  leadId:"L-1039", gp:"Marc Otto",      vd:"Thomas Müller", status:"upcoming",  notes:"Re-attempt after no-show yesterday" },
  { id:"A-110", date:"2026-02-24", start:"14:00", end:"15:00", type:"video",    apptType:"Investment Talk", lead:"Lars Dietrich",   leadId:"L-1032", gp:"Anna Klein",     vd:"Thomas Müller", status:"confirmed", notes:"Strategy session — pre-close. Prepare 3 options." },
  { id:"A-111", date:"2026-02-24", start:"15:30", end:"16:30", type:"inperson", apptType:"Business Opening", lead:"Dirk Schumacher", leadId:"L-1052", gp:"Thomas Müller",  vd:"Thomas Müller", status:"confirmed", notes:"VD direct appointment — Partner Ref contact" },
  { id:"A-112", date:"2026-02-24", start:"16:00", end:"17:00", type:"video",    apptType:"Consultation Appointment", lead:"Julia Schneider", leadId:"L-1038", gp:"Kai Becker",     vd:"Lisa Weber",    status:"upcoming",  notes:"Follow-up from Monday — qualification call" },
  // ── Rest of week ───────────────────────────────────────────────────────────
  { id:"A-113", date:"2026-02-25", start:"09:30", end:"10:00", type:"call",     apptType:"Finance Talk", lead:"Claudia Becker",  leadId:"L-1034", gp:"Anna Klein",     vd:"Thomas Müller", status:"upcoming",  notes:"Giveaway contact — follow-up call" },
  { id:"A-114", date:"2026-02-25", start:"11:00", end:"12:00", type:"video",    apptType:"Investment Talk", lead:"Ralf Neumann",    leadId:"L-1050", gp:"Thomas Müller",  vd:"Thomas Müller", status:"upcoming",  notes:"Proposal review — Q1 Finanz" },
  { id:"A-115", date:"2026-02-25", start:"14:00", end:"14:30", type:"call",     apptType:"Consultation Appointment", lead:"Monika Braun",    leadId:"L-1036", gp:"Kai Becker",     vd:"Lisa Weber",    status:"cancelled", notes:"Client cancelled — reschedule" },
  { id:"A-116", date:"2026-02-26", start:"10:00", end:"11:30", type:"inperson", apptType:"Investment Talk", lead:"Lars Dietrich",   leadId:"L-1032", gp:"Anna Klein",     vd:"Thomas Müller", status:"upcoming",  notes:"Full financial consultation — close expected" },
  { id:"A-117", date:"2026-02-26", start:"14:30", end:"15:00", type:"call",     apptType:"Business Opening", lead:"Karla Metz",      leadId:"L-1053", gp:"Thomas Müller",  vd:"Thomas Müller", status:"upcoming",  notes:"Messe FFM contact — first real conversation" },
  { id:"A-118", date:"2026-02-26", start:"16:00", end:"17:00", type:"video",    apptType:"Recruiting", lead:"Ben Schulze",     leadId:"L-1030", gp:"Ben Hartmann",   vd:"Ralf Fischer",  status:"upcoming",  notes:"Partner Ref — qualification call" },
  { id:"A-119", date:"2026-02-27", start:"09:00", end:"09:30", type:"call",     apptType:"Consultation Appointment", lead:"Nina Hartmann",   leadId:"L-1031", gp:"Tanja Vogt",     vd:"Lisa Weber",    status:"upcoming",  notes:"Messe FFM — in progress, moved forward" },
  { id:"A-120", date:"2026-02-27", start:"11:00", end:"12:00", type:"video",    apptType:"Finance Talk", lead:"Hanna Vogel",     leadId:"L-1033", gp:"Marc Otto",      vd:"Thomas Müller", status:"upcoming",  notes:"Q1 Finanz — first appointment after cold outreach" },
  // ── Next week ──────────────────────────────────────────────────────────────
  { id:"A-121", date:"2026-03-02", start:"10:00", end:"11:00", type:"video",    apptType:"Investment Talk", lead:"Lars Dietrich",   leadId:"L-1032", gp:"Anna Klein",     vd:"Thomas Müller", status:"upcoming",  notes:"Post-consultation follow-up — closing call" },
  { id:"A-122", date:"2026-03-03", start:"14:00", end:"15:00", type:"inperson", apptType:"Business Opening", lead:"Sandra Richter",  leadId:"L-1040", gp:"Anna Klein",     vd:"Thomas Müller", status:"upcoming",  notes:"Strategy presentation if appointment set today" },
  { id:"A-123", date:"2026-03-04", start:"09:30", end:"10:30", type:"call",     apptType:"Finance Talk", lead:"Hanna Vogel",     leadId:"L-1033", gp:"Marc Otto",      vd:"Thomas Müller", status:"upcoming",  notes:"Q1 Finanz — proposal review" },
  // ── Today 2026-06-28 ───────────────────────────────────────────────────────
  { id:"A-201", date:"2026-06-28", start:"09:00", end:"09:45", type:"call",     apptType:"Consultation Appointment", lead:"Klaus Wagner",    leadId:"L-2010", gp:"Anna Klein",    vd:"Thomas Müller", status:"upcoming",  notes:"Initial consultation — high AI score" },
  { id:"A-202", date:"2026-06-28", start:"10:30", end:"11:30", type:"video",    apptType:"Investment Talk", lead:"Lena Brandt",     leadId:"L-2011", gp:"Anna Klein",    vd:"Thomas Müller", status:"confirmed", notes:"Product presentation — Q1 Finanz" },
  { id:"A-203", date:"2026-06-28", start:"12:00", end:"13:00", type:"inperson", apptType:"Business Opening", lead:"Sandra Richter",  leadId:"L-1040", gp:"Anna Klein",    vd:"Thomas Müller", status:"upcoming",  notes:"Strategy session — 2nd appointment" },
  { id:"A-204", date:"2026-06-28", start:"14:00", end:"14:45", type:"call",     apptType:"Finance Talk", lead:"Robert Keller",   leadId:"L-2006", gp:"Anna Klein",    vd:"Thomas Müller", status:"confirmed", notes:"Referral contact — first appointment" },
  { id:"A-205", date:"2026-06-28", start:"15:30", end:"16:30", type:"video",    apptType:"Consultation Appointment", lead:"Tobias Fischer",  leadId:"L-2012", gp:"Anna Klein",    vd:"Thomas Müller", status:"upcoming",  notes:"Follow-up after proposal sent" },
  { id:"A-206", date:"2026-06-28", start:"16:00", end:"17:00", type:"inperson", apptType:"Recruiting", lead:"Julia Schneider", leadId:"L-1038", gp:"Kai Becker",    vd:"Lisa Weber",    status:"upcoming",  notes:"Qualification appointment" },
  { id:"A-207", date:"2026-06-28", start:"17:30", end:"18:00", type:"call",     apptType:"Finance Talk", lead:"Dirk Schumacher", leadId:"L-1052", gp:"Thomas Müller", vd:"Thomas Müller", status:"upcoming",  notes:"VD direct — check in call" },
  // ── Today 2026-06-29 — GP Anna Klein ───────────────────────────────────────
  { id:"A-301", date:"2026-06-29", start:"09:00", end:"09:45", type:"call",     apptType:"Consultation Appointment", lead:"Sandra Richter",  leadId:"L-1040", gp:"Anna Klein",    vd:"Thomas Müller", status:"upcoming",  notes:"Follow-up after proposal — Q1 Finanz" },
  { id:"A-302", date:"2026-06-29", start:"11:30", end:"12:30", type:"video",    apptType:"Investment Talk", lead:"Lars Dietrich",   leadId:"L-1032", gp:"Anna Klein",    vd:"Thomas Müller", status:"confirmed", notes:"Full consultation — pre-close" },
  { id:"A-303", date:"2026-06-29", start:"14:00", end:"15:00", type:"inperson", apptType:"Business Opening", lead:"Klaus Wagner",    leadId:"L-2010", gp:"Anna Klein",    vd:"Thomas Müller", status:"upcoming",  notes:"2nd appointment — needs proposal" },
  { id:"A-304", date:"2026-06-29", start:"16:30", end:"17:00", type:"call",     apptType:"Finance Talk", lead:"Lena Brandt",     leadId:"L-2011", gp:"Anna Klein",    vd:"Thomas Müller", status:"upcoming",  notes:"Quick check-in — contract status" },
  // ── Today 2026-06-29 — VD Thomas Müller (direct / self-close) ──────────────
  { id:"A-305", date:"2026-06-29", start:"09:30", end:"10:15", type:"call",     apptType:"Consultation Appointment", lead:"Eva Gruber",      leadId:"L-2013", gp:"Thomas Müller", vd:"Thomas Müller", status:"confirmed", notes:"VD direct — partner referral, first appointment" },
  { id:"A-306", date:"2026-06-29", start:"11:00", end:"12:00", type:"video",    apptType:"Investment Talk", lead:"Klaus Richter",   leadId:"L-2014", gp:"Thomas Müller", vd:"Thomas Müller", status:"upcoming",  notes:"VD direct — strategic partnership discussion" },
  { id:"A-307", date:"2026-06-29", start:"14:30", end:"15:30", type:"inperson", apptType:"Business Opening", lead:"Stefan Wolf",     leadId:"L-2015", gp:"Thomas Müller", vd:"Thomas Müller", status:"upcoming",  notes:"VD direct — Q2 planning & cross-sell" },
  // ── Today 2026-07-01 — GP Anna Klein ────────────────────────────────────────
  { id:"A-401", date:"2026-07-01", start:"09:00", end:"09:45", type:"call",     apptType:"Consultation Appointment", lead:"Klaus Wagner",    leadId:"L-2010", gp:"Anna Klein",    vd:"Thomas Müller", status:"upcoming",  notes:"3rd contact — nearing appointment decision" },
  { id:"A-402", date:"2026-07-01", start:"10:30", end:"11:15", type:"video",    apptType:"Investment Talk", lead:"Lena Brandt",     leadId:"L-2011", gp:"Anna Klein",    vd:"Thomas Müller", status:"confirmed", notes:"Product walkthrough — Q1 Finanz" },
  { id:"A-403", date:"2026-07-01", start:"12:00", end:"13:00", type:"inperson", apptType:"Business Opening", lead:"Tobias Fischer",  leadId:"L-2012", gp:"Anna Klein",    vd:"Thomas Müller", status:"upcoming",  notes:"First in-person appointment — Partner Ref" },
  { id:"A-404", date:"2026-07-01", start:"14:00", end:"14:30", type:"call",     apptType:"Finance Talk", lead:"Anna Bergmann",   leadId:"L-2013", gp:"Anna Klein",    vd:"Thomas Müller", status:"confirmed", notes:"Follow-up after webinar interest" },
  // ── Today 2026-07-01 — VD Thomas Müller (direct / self-close) ──────────────
  { id:"A-405", date:"2026-07-01", start:"11:00", end:"11:30", type:"call",     apptType:"Recruiting", lead:"Michael Stein",   leadId:"L-2014", gp:"Thomas Müller", vd:"Thomas Müller", status:"upcoming",  notes:"VD direct — Messe FFM contact" },
  { id:"A-406", date:"2026-07-01", start:"14:30", end:"15:15", type:"video",    apptType:"Investment Talk", lead:"Eva Gruber",      leadId:"L-2015", gp:"Thomas Müller", vd:"Thomas Müller", status:"confirmed", notes:"VD direct — contract review, partner referral" },
  { id:"A-407", date:"2026-07-01", start:"16:00", end:"16:45", type:"inperson", apptType:"Business Opening", lead:"Stefan Wolf",     leadId:"L-2017", gp:"Thomas Müller", vd:"Thomas Müller", status:"upcoming",  notes:"VD direct — Q3 planning & cross-sell" },
  // ── Network appointments (converted contacts — actionable in the Calendar) ──
  { id:"A-501", date:"2026-07-01", start:"09:30", end:"10:00", type:"call",     apptType:"Consultation Appointment", lead:"Michael Braun",  leadId:"NW-1", gp:"Anna Klein",    vd:"Thomas Müller", status:"confirmed", notes:"Network review — portfolio check-in", lifecycle:"Network" },
  { id:"A-502", date:"2026-07-01", start:"13:00", end:"13:45", type:"video",    apptType:"Investment Talk", lead:"Sabine Hofer",   leadId:"NW-2", gp:"Anna Klein",    vd:"Thomas Müller", status:"upcoming",  notes:"Partner sync — referral opportunities", lifecycle:"Network" },
];


export let ACTIVITIES_STORE = [
  // From APPOINTMENTS — mapped to activity model
  ...APPOINTMENTS.map(a => ({
    id: a.id, type: a.type==="call"?"call":a.type==="video"?"video":"inperson",
    apptType: a.apptType,
    title: a.lead, lead: a.lead, leadId: a.leadId,
    date: a.date, time: a.start, end: a.end,
    gp: a.gp, vd: a.vd, status: a.status,
    // Contact's Lifecycle. Lead appointments are read-only in the Calendar
    // (worked only in Processing & Feedback); Network appointments are actionable.
    lifecycle: a.lifecycle || "Lead",
    priority: "normal", note: a.notes||"",
    recur: "Once", channels: ["push","inapp"],
    entityType: "appointment", category: "appointment",
  })),
  // From REMINDERS — mapped to activity model
  { id:"act-r1", type:"call",  title:"Follow-up call — Sandra Richter",    lead:"Sandra Richter",  leadId:"L-1001", date:"2026-02-24", time:"14:00", end:"14:30", gp:"Anna Klein", vd:"Thomas Müller", status:"pending",   priority:"high",   note:"", recur:"Once",   channels:["push","inapp"], entityType:"reminder", category:"reminder" },
  { id:"act-r2", type:"note",  title:"Birthday — Klaus Weber",             lead:"Klaus Weber",     leadId:"L-1002", date:"2026-02-25", time:"09:00", end:"09:15", gp:"Anna Klein", vd:"Thomas Müller", status:"pending",   priority:"low",    note:"", recur:"Yearly", channels:["inapp"],        entityType:"reminder", category:"reminder" },
  { id:"act-r3", type:"call",  title:"Appointment prep — Petra Müller",    lead:"Petra Müller",    leadId:"L-1005", date:"2026-02-27", time:"13:00", end:"13:30", gp:"Anna Klein", vd:"Thomas Müller", status:"pending",   priority:"normal", note:"", recur:"Once",   channels:["push","inapp"], entityType:"reminder", category:"reminder" },
  { id:"act-r4", type:"email", title:"GDPR renewal — Thomas Wagner",       lead:"Thomas Wagner",   leadId:"L-1008", date:"2026-03-01", time:"09:00", end:"09:30", gp:"Anna Klein", vd:"Thomas Müller", status:"active",    priority:"high",   note:"", recur:"Once",   channels:["push","inapp"], entityType:"reminder", category:"reminder" },
  { id:"act-r5", type:"note",  title:"Weekly team check-in",               lead:null,              leadId:null,     date:"2026-02-24", time:"08:30", end:"09:00", gp:"Anna Klein", vd:"Thomas Müller", status:"active",    priority:"low",    note:"", recur:"Weekly", channels:["push"],         entityType:"reminder", category:"reminder" },
  // ── Today 2026-06-29 — GP Anna Klein ─────────────────────────────────────
  { id:"act-r6", type:"call",  title:"Follow-up call — Sandra Richter",    lead:"Sandra Richter",  leadId:"L-1040", date:"2026-06-29", time:"09:00", end:"09:30", gp:"Anna Klein",    vd:"Thomas Müller", status:"pending",   priority:"high",   note:"", recur:"Once",   channels:["push","inapp"], entityType:"task",     category:"task" },
  { id:"act-r7", type:"email", title:"Send proposal to Markus Bauer",      lead:"Markus Bauer",    leadId:"L-2002", date:"2026-06-29", time:"10:00", end:"10:30", gp:"Anna Klein",    vd:"Thomas Müller", status:"pending",   priority:"normal", note:"", recur:"Once",   channels:["push","inapp"], entityType:"reminder", category:"reminder" },
  { id:"act-r8", type:"note",  title:"Prepare documents for Hans Müller",  lead:"Hans Müller",     leadId:"L-2008", date:"2026-06-29", time:"13:00", end:"13:30", gp:"Anna Klein",    vd:"Thomas Müller", status:"pending",   priority:"urgent", note:"", recur:"Once",   channels:["push","inapp"], entityType:"task",     category:"task" },
  // ── Today 2026-06-29 — VD Thomas Müller (own tasks, gp === vd) ───────────
  { id:"act-r9",  type:"note",  title:"Q2 team targets review",            lead:null,              leadId:null,     date:"2026-06-29", time:"08:30", end:"09:00", gp:"Thomas Müller", vd:"Thomas Müller", status:"pending",   priority:"high",   note:"", recur:"Once",   channels:["push","inapp"], entityType:"task",     category:"task" },
  { id:"act-r10", type:"call",  title:"Call Eva Gruber — contract prep",   lead:"Eva Gruber",      leadId:"L-2013", date:"2026-06-29", time:"09:30", end:"10:00", gp:"Thomas Müller", vd:"Thomas Müller", status:"pending",   priority:"urgent", note:"", recur:"Once",   channels:["push","inapp"], entityType:"reminder", category:"reminder" },
  { id:"act-r11", type:"note",  title:"Approve Marc Otto's proposals",     lead:null,              leadId:null,     date:"2026-06-28", time:"17:00", end:"17:30", gp:"Thomas Müller", vd:"Thomas Müller", status:"done",      priority:"normal", note:"", recur:"Once",   channels:["push","inapp"], entityType:"task",     category:"task" },
];

// ─── Shared UI ────────────────────────────────────────────────────────────────

export const callClaudeAPI = async (systemPrompt, userMessage) => {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  if (!response.ok) throw new Error(`API error ${response.status}`);
  const data = await response.json();
  return data.content?.map(b => b.type === "text" ? b.text : "").join("") || "";
};


export const buildPipelineSystemPrompt = (role) => {
  const roleLabel = { superadmin:"Super Admin", vd:"Sales Director (Thomas Müller)", gp:"Advisor (Anna Klein)" }[role];
  const hotLeads = ALL_LEADS.filter(l => AI_SCORES[l.id]?.tier === "hot");
  const unassigned = ALL_LEADS.filter(l => !l.assignedGP);
  return `You are an AI assistant embedded in vion CRM, a financial services sales platform. You help ${roleLabel} manage their lead pipeline.

CURRENT PIPELINE STATE:
- Total leads in view: ${ALL_LEADS.length}
- Hot leads (AI score 80+): ${hotLeads.length} — ${hotLeads.slice(0,3).map(l=>`${l.name} (score ${AI_SCORES[l.id].score})`).join(", ")}
- Unassigned: ${unassigned.length}
- Today's appointments: ${APPOINTMENTS.filter(a=>a.date==="2026-02-24").length}
- Org conversion rate: 6.2% | Best GP: Anna Klein at 8.1%
${role==="superadmin" ? "- Jana Kruse team underperforming at 3.9% for 6 weeks\n- Zapier webhook disconnected — 0 contacts in 6h" : ""}
${role==="vd" ? "- Your team: 890 contacts, 34 closed MTD, 7.1% conv rate\n- Messe FFM: 125 assigned, only 22 contacted — priority this week" : ""}
${role==="gp" ? "- Your contacts: 62 total, 14 closed MTD, 8.1% conv rate (#1 in team)\n- Top priority: Sandra Richter (score 92), call before 10:30 today" : ""}

RESPONSE STYLE: Be concise, direct, and actionable. Use **bold** for key names/numbers. Use bullet points for lists. Max 3-4 sentences or a short list. This is a chat widget — keep responses short. Speak in a professional but friendly tone. Today is Tuesday, 24 February 2026.`;
};


export const buildLeadSystemPrompt = (lead, role) => {
  const ai = AI_SCORES[lead.id];
  const bt = AI_BEST_TIMES[lead.id];
  const draft = AI_EMAIL_DRAFTS[lead.id] || AI_EMAIL_DRAFTS["default"];
  return `You are an AI assistant embedded in vion CRM. Your sole purpose is to help sales advisors manage their leads more effectively.

STRICT SCOPE RULE: You may ONLY answer questions directly related to CRM work — lead management, call preparation, contact strategy, email drafting, appointment scheduling, or lead data interpretation. If the user asks about anything outside this scope (personal topics, general knowledge, coding, news, opinions, etc.), you must respond ONLY with: "I can only help with CRM-related topics. Please use one of the options above." Do not explain, apologise, or engage further with off-topic messages.

LEAD PROFILE:
- Name: ${lead.name}
- Source: ${lead.source} | Campaign: ${lead.campaign}
- Status: ${lead.status} | Attempts: ${lead.attempts}/5
- City: ${lead.city} (ZIP ${lead.zip})
- GDPR Consent: ${lead.consent ? "Yes" : "No"}
- Assigned to: ${lead.assignedGP || "Unassigned"}
${ai ? `\nAI SCORE: ${ai.score}/100 (${ai.tier.toUpperCase()})\nScoring reasons: ${ai.reasons.join(" | ")}` : ""}
${bt ? `\nBEST CONTACT WINDOW: ${bt.window} on ${bt.day} (${bt.confidence}% confidence)\nReason: ${bt.reason}` : ""}
AVAILABLE EMAIL DRAFT:
Subject: ${draft.subject}
Body preview: ${draft.body.slice(0,200)}...

RESPONSE STYLE: Be concise and actionable. Use **bold** for key points. Max 3-4 sentences or a short list. Today is Tuesday, 24 February 2026.`;
};

// ─── AI Agent Engine ──────────────────────────────────────────────────────────

export const agentReply = (msg, lead, role) => {
  const t = msg.toLowerCase();

  // ── Contact-specific replies ────────────────────────────────────────────────
  if (lead) {
    const ai   = AI_SCORES[lead.id];
    const tier = ai ? SCORE_TIER[ai.tier] : null;
    const bt   = AI_BEST_TIMES[lead.id];
    const draft= AI_EMAIL_DRAFTS[lead.id] || AI_EMAIL_DRAFTS["default"];

    if (t.match(/score|why|reason|ranked/)) return {
      text: `**${lead.name}** has an AI score of **${ai?.score ?? "N/A"}/100** (${tier?.label ?? "Unknown"}).\n\nKey factors:\n${ai?.reasons.map(r=>`• ${r}`).join("\n") ?? "No score data yet."}`,
      chips: ["What's the best approach?","Draft a follow-up email","When should I call?"]
    };

    if (t.match(/approach|strategy|how should|handle|deal with/)) return {
      text: lead.status === "appointment"
        ? `${lead.name} has an appointment confirmed. **Pre-call prep is the priority**:\n\n• Review their campaign (${lead.campaign}) — ${lead.source} source signals high intent\n• Prepare 3 concrete financial strategy options\n• Confirm time 2h before via SMS\n• Aim to close or advance to proposal stage in this call.`
        : lead.status === "followup"
        ? `${lead.name} expressed interest but needs a follow-up. **Recommended approach**:\n\n• Contact with the specific concern they raised\n• Reference the ${lead.campaign} campaign benefit they signed up for\n• Offer two concrete appointment times — never ask open-ended\n• Keep it under 8 minutes.`
        : lead.attempts >= 3
        ? `After ${lead.attempts} attempts, try a **pattern interrupt**:\n\n• Call from a different number if possible\n• Try before 09:00 or after 17:30 — off-peak slots\n• Send a short email first (use the draft I can generate)\n• If no response after attempt 5, mark Not Reached and archive.`
        : `${lead.name} is a fresh lead (${lead.source}, ${lead.campaign}). **First contact strategy**:\n\n• Call within 4h of capture — reach rates drop 80% after 24h\n• Contact with the specific campaign offer they responded to\n• Goal of first call: qualify intent and set an appointment, not close.`,
      chips: ["Draft a follow-up email","When should I call?","Generate call script"]
    };

    if (t.match(/email|draft|write|message/)) return {
      text: `Here's a **personalised email draft** for ${lead.name}:\n\n**Subject:** ${draft.subject}\n\n${draft.body}\n\n_Tone: ${draft.tone}_`,
      actions: [{ label:"📋 Copy Email", key:"copy_email" }, { label:"📝 Open Script Tab", key:"open_script" }],
      chips: ["When should I call?","What's the best approach?"]
    };

    if (t.match(/when|time|call|best|window|contact/)) return {
      text: bt
        ? `**Best contact window for ${lead.name}:**\n\n🕐 **${bt.window}** on **${bt.day}**\n📊 ${bt.confidence}% match confidence\n\n💡 ${bt.reason}`
        : `No specific contact window data yet for ${lead.name}. General guidance for **${lead.city}** (ZIP ${lead.zip}):\n\n• Morning: 08:30–10:00 (highest answer rates)\n• Avoid: 12:00–13:30 (lunch) and after 18:00\n• Best days: Tuesday and Thursday`,
      chips: ["Draft a follow-up email","What's the best approach?"]
    };

    if (t.match(/history|last|timeline|happened|previous/)) return {
      text: `**${lead.name} — Timeline Summary:**\n\n• Captured: ${lead.created} via ${lead.source}\n• Campaign: ${lead.campaign}\n• Attempts: ${lead.attempts} of 5\n• Current status: ${STATUS_META[lead.status]?.label ?? lead.status}\n• GDPR: ${lead.consent ? "Consented ✓" : "No consent ✗"}\n${lead.assignedGP ? `• Assigned to: ${lead.assignedGP}` : "• Not yet assigned"}`,
      chips: ["What's the best approach?","When should I call?"]
    };

    if (t.match(/close|should i|ready|convert|deal/)) return {
      text: lead.status === "appointment"
        ? `✅ **High close probability.** ${lead.name} has a confirmed appointment — score ${ai?.score ?? "?"}/100. Advisors in your team close **68%** of appointments from the ${lead.campaign} campaign. Come prepared with a clear proposal.`
        : lead.status === "followup"
        ? `⚡ **Moderate close probability.** ${lead.name} is interested but not ready. Focus on the next call to set an appointment — that's the critical conversion step. Score: ${ai?.score ?? "?"}/100.`
        : `⚠️ **Too early to assess close probability.** ${lead.name} is at ${STATUS_META[lead.status]?.label} status. Prioritise making contact and qualifying intent first.`,
      chips: ["Draft a follow-up email","Generate call script"]
    };

    if (t.match(/assign|who|advisor|gp/)) return {
      text: lead.assignedGP
        ? `**${lead.name}** is currently assigned to **${lead.assignedGP}**${lead.assignedGP === lead.assignedVD ? " (VD · Self)" : ""}.\n\nVD: ${lead.assignedVD ?? "Unassigned"}.\n\nTo reassign, use the **Assign tab** in this drawer.`
        : `**${lead.name}** is **unassigned**. AI Smart Assignment recommendation:\n\n• **Anna Klein** — best match (8.1% conv. rate for ${lead.campaign}, ZIP region ${lead.city})\n\nUse the Assign tab to confirm.`,
      chips: ["What's the best approach?","When should I call?"]
    };

    return {
      text: `I'm your AI agent for **${lead.name}**. I can help you with:\n\n• Contact scoring explanation\n• Best approach & call strategy\n• Contact time windows\n• Follow-up email drafts\n• Timeline summary\n• Close probability assessment`,
      chips: ["What's the best approach?","When should I call?","Draft a follow-up email","Explain the AI score"]
    };
  }

  // ── Page-level replies (no lead context) ────────────────────────────────
  const hotLeads   = ALL_LEADS.filter(l=>AI_SCORES[l.id]?.tier==="hot").sort((a,b)=>AI_SCORES[b.id].score-AI_SCORES[a.id].score);
  const unassigned = ALL_LEADS.filter(l=>!l.assignedGP);
  const notReached = ALL_LEADS.filter(l=>l.status==="not_reached");
  const followups  = ALL_LEADS.filter(l=>l.status==="followup");
  const appts      = ALL_LEADS.filter(l=>l.status==="appointment");

  if (t.match(/hot|priority|top|best|urgent/)) return {
    text: `**Top ${Math.min(hotLeads.length,3)} Hot Contacts right now:**\n\n${hotLeads.slice(0,3).map((l,i)=>`${i+1}. **${l.name}** — Score ${AI_SCORES[l.id].score}/100\n   ${l.campaign} · ${l.city} · ${STATUS_META[l.status]?.label}`).join("\n\n")}`,
    chips: ["Show unassigned contacts","Which contacts need follow-up?","How is my team performing?"]
  };

  if (t.match(/call today|due today|contact today|should i call/)) return {
    text: `**5 contacts due today** (by priority score):\n\n${hotLeads.slice(0,5).map((l,i)=>`${i+1}. **${l.name}** (${AI_SCORES[l.id].score}) — ${STATUS_META[l.status]?.label}`).join("\n")}\n\nI recommend starting with Sandra Richter (score 92) — she opened the welcome email 3× and her best contact window is **13:00–15:00 today**.`,
    chips: ["Generate script for top contact","Show hot contacts","Show follow-ups"]
  };

  if (t.match(/unassigned|not assigned|assign/)) return {
    text: `There are **${unassigned.length} unassigned leads** right now:\n\n${unassigned.map(l=>`• **${l.name}** — ${l.source} · ${l.city}`).join("\n")}\n\nAI Smart Assignment suggestion:\n• Markus Bauer → **Anna Klein** (94% match)\n• Hanna Vogel → **Marc Otto** (88% match)\n\nUse the AI Insights tab to approve assignments in bulk.`,
    chips: ["Show hot contacts","How is my team performing?"]
  };

  if (t.match(/follow.?up|follow up/)) return {
    text: `**${followups.length} leads in Follow-Up status:**\n\n${followups.map(l=>`• **${l.name}** — ${l.city} · ${l.attempts} attempts · ${l.assignedGP ?? "Unassigned"}`).join("\n")}\n\nAll of these leads expressed interest. Recommended: contact within 24h of last interaction for best conversion.`,
    chips: ["Show hot contacts","Show unassigned contacts","Show appointments"]
  };

  if (t.match(/appointment|appt|scheduled|booked/)) return {
    text: `**${appts.length} active appointments:**\n\n${appts.map(l=>`• **${l.name}** — ${l.city} · ${l.assignedGP ?? "Unassigned"} · AI Score ${AI_SCORES[l.id]?.score ?? "?"}`).join("\n")}\n\nTeam close rate on appointments is **68%** this month. Ensure each advisor has a prepared brief.`,
    chips: ["How is my team performing?","Show hot contacts"]
  };

  if (t.match(/not reached|unreachable|no answer/)) return {
    text: `**${notReached.length} leads marked Not Reached:**\n\n${notReached.map(l=>`• **${l.name}** — ${l.attempts} attempts · ${l.assignedGP ?? "Unassigned"}`).join("\n")}\n\n⚠️ Felix Wagner has hit 5 attempts (max). Recommend archiving.\n\nFor the others: try calling before 09:00 or after 17:30 — off-peak slots improve reach rates by up to 40%.`,
    chips: ["Show hot contacts","Show unassigned contacts"]
  };

  if (t.match(/conversion|conv.? rate|performing|performance|team/)) return {
    text: role==="superadmin"
      ? `**Org Performance — February 2026:**\n\n• Overall conv. rate: **6.2%** (+1.1pp vs January)\n• Best director: **Thomas Müller** at 7.1%\n• ⚠️ Jana Kruse at 3.9% — 2.3pp below average for 6 weeks\n• Best advisor: **Anna Klein** at 8.1%\n\nRecommendation: reassign 80 Messe FFM leads from Jana Kruse's team to Ralf Fischer.`
      : role==="vd"
      ? `**Team Performance — Thomas Müller's Team:**\n\n• Team conv. rate: **7.1%** (org average: 6.2%)\n• Anna Klein: **8.1%** 🏆\n• Marc Otto: **6.7%** (+1.2pp MoM ↑)\n• Nina Schmitt: **5.4%**\n\nPriority: 125 Messe FFM leads still uncontacted.`
      : `**Your Performance — Anna Klein:**\n\n• Conv. rate: **8.1%** (#1 in team 🏆)\n• 14 closed this month (+3 vs January)\n• 21 appointments set, 62 leads total\n• Best campaign: Q1 Finanz (25% conv.)\n\nYou're outperforming team average by 1.9pp.`,
    chips: ["Show hot contacts","Which contacts should I call today?","Show unassigned contacts"]
  };

  if (t.match(/meta ads?|landing page|source|campaign/)) return {
    text: `**Contact Sources this month:**\n\n• Meta Ads: 1,240 leads (7.2% conv.)\n• Landing Pages: 780 leads (6.7% conv.)\n• Google Sheets: 430 leads (6.5% conv.)\n• CSV: 205 leads (4.4% conv.)\n• Other: 249 leads (2.8% conv.)\n\n⚠️ Zapier source currently **disconnected** — 0 leads captured in last 6h.`,
    chips: ["Show hot contacts","How is my team performing?"]
  };

  if (t.match(/gdpr|consent|opt.?in/)) return {
    text: `**GDPR Consent Status:**\n\n• 79.8% of leads have newsletter consent (2,316 of 2,904)\n• 588 leads without consent — retargeting restricted\n• 3 pending deletion requests\n\nIn your current view: ${ALL_LEADS.filter(l=>!l.consent).length} leads have no consent.`,
    chips: ["Show hot contacts","How is my team performing?"]
  };

  return {
    text: `I'm your **vion CRM AI Agent**. I can help you with:\n\n• 🔥 Finding hot and priority leads\n• 📞 Identifying who to call today\n• 📊 Team and conversion performance\n• 📋 Unassigned and not-reached leads\n• 💡 Campaign and source insights\n• 🔒 GDPR and consent status\n\nOr open a lead to get **lead-specific advice** — strategy, call timing, email drafts, and close probability.`,
    chips: ["Which contacts should I call today?","Show hot contacts","Show unassigned contacts","How is my team performing?"]
  };
};

// ─── Floating Agent Chat ───────────────────────────────────────────────────────

export const LEAD_NOTES_STORE = {};


export const CALL_TRANSCRIPTS = {
  "L-1040": {
    date:"Today, 14:02", duration:"4m 18s", gp:"Anna Klein", consentGiven:true,
    lines:[
      { speaker:"GP",   text:"Good afternoon, this is Anna Klein from vion Financial. Am I speaking with Sandra Richter?" },
      { speaker:"Contact", text:"Yes, speaking." },
      { speaker:"GP",   text:"Wonderful! I'm reaching out because you registered for our March Webinar programme a few days ago. I just wanted to personally introduce myself and see if you had any questions." },
      { speaker:"Contact", text:"Oh right, yes I did sign up. I've been a bit busy to be honest." },
      { speaker:"GP",   text:"Completely understandable — that's exactly why I wanted to make this quick. In just a few minutes I can explain how we help people like yourself build a clearer financial picture. Would that be okay?" },
      { speaker:"Contact", text:"Sure, go ahead." },
      { speaker:"GP",   text:"Great. Many of our Hamburg clients came to us with similar goals — building long-term wealth without complexity. One of them accelerated their financial position by 34% within 18 months using our personalised strategy. That's the kind of tailored approach we'd develop with you." },
      { speaker:"Contact", text:"That does sound interesting. But I'm not sure I have enough money to invest right now." },
      { speaker:"GP",   text:"That's a very common concern, and actually many of our clients started in the same position. Our first consultation is completely free — it's really just about understanding your situation before anything else." },
      { speaker:"Contact", text:"Okay, that makes sense." },
      { speaker:"GP",   text:"Perfect. So I have some availability this week — would Wednesday at 2pm or Thursday at 10am work for a 20-minute no-obligation consultation?" },
      { speaker:"Contact", text:"Thursday at 10 works." },
      { speaker:"GP",   text:"Excellent! I'll send you a confirmation right away. Looking forward to speaking with you then, Sandra." },
    ],
  },
  "L-1039": {
    date:"Yesterday, 11:15", duration:"2m 52s", gp:"Anna Klein", consentGiven:true,
    lines:[
      { speaker:"GP",   text:"Good morning, Mr. Hoffmann — Anna Klein from vion Financial. Hope I've caught you at a good time!" },
      { speaker:"Contact", text:"Who is this again?" },
      { speaker:"GP",   text:"Anna Klein, from vion Financial. You were referred to us through our partner network." },
      { speaker:"Contact", text:"I'm quite busy right now, can you call back?" },
      { speaker:"GP",   text:"Of course — when would be a better time for you? Morning or afternoon?" },
      { speaker:"Contact", text:"Try next week maybe." },
      { speaker:"GP",   text:"Understood, I'll reach out early next week. Have a good day!" },
    ],
  },
};

// Script section keys used for adherence matching

export const SCRIPT_SECTIONS = ["greeting","pitch","hook","objections","close"];

// ─── Call Analysis Tab ────────────────────────────────────────────────────────

export const NOTIFICATIONS = [
  { id:1,  type:"reminder", icon:"⏰", color:"#7C3AED", title:"Reminder: Call Sandra Richter",   body:"Follow-up call due now. 2nd attempt — she requested callback before 15:00.",  time:"Just now",   read:false, leadId:"L-1040", action:"call"     },
  { id:2,  type:"lead",     icon:"👤", color:"#3B82F6", title:"New contact assigned",               body:"Lars Dietrich (L-1032) assigned to you — AI score 84 🔥",                    time:"2 min ago",  read:false, leadId:"L-1032", action:"open"     },
  { id:3,  type:"alert",    icon:"⚠️", color:"#EF4444", title:"Zapier webhook disconnected",     body:"0 contacts captured since 09:14. Reconnect in Settings → Integrations.",         time:"6h ago",     read:false, leadId:null,     action:"settings" },
  { id:4,  type:"reminder", icon:"⏰", color:"#7C3AED", title:"Reminder: Follow-up Peter Hoffmann", body:"3rd contact attempt overdue by 1 day. AI score dropped to 71 — act today.", time:"1h ago",     read:false, leadId:"L-1039", action:"open"     },
  { id:5,  type:"appt",     icon:"📅", color:"#6366F1", title:"Appointment in 1 hour",           body:"Dirk Schumacher — In-person @ 14:00. Prepare advisory proposal.",             time:"58 min",     read:false, leadId:null,     action:"appt"     },
  { id:6,  type:"reminder", icon:"🔁", color:"#8B5CF6", title:"Birthday: Klaus Weber tomorrow",  body:"Klaus Weber's birthday is tomorrow. Consider sending a personal message.",     time:"Today 08:00",read:true,  leadId:null,     action:"open"     },
  { id:7,  type:"lead",     icon:"👤", color:"#3B82F6", title:"3 new contacts unassigned",          body:"Meta Ads batch imported — 34 contacts awaiting assignment.",                     time:"Today 09:14",read:true,  leadId:null,     action:"leads"    },
  { id:8,  type:"appt",     icon:"📅", color:"#6366F1", title:"Appointment completed",           body:"Anna Richter — Video call completed. Log the outcome in her contact profile.",    time:"Yesterday",  read:true,  leadId:null,     action:"open"     },
  { id:9,  type:"reminder", icon:"⏰", color:"#7C3AED", title:"Workflow: Contact idle 7+ days",     body:"Claudia Becker (L-1038) has had no activity for 8 days. Re-engage now.",      time:"Yesterday",  read:true,  leadId:"L-1038", action:"open"     },
  { id:10, type:"alert",    icon:"✅", color:"#10B981", title:"ZIP rules updated",               body:"5 new ZIP routing rules added by Super Admin.",                               time:"2 days ago", read:true,  leadId:null,     action:null       },
];


export const AI_NARRATIVES = {
  superadmin: {
    headline: "Org performance is strong — but Jana Kruse's team needs attention.",
    body: "February is tracking +31% ahead of January in closings (89 vs 68), driven by Thomas Müller's team at 7.1% conversion — the highest in the org. However, Jana Kruse's team at 3.9% is 2.3pp below average and has not improved in 6 weeks. The Messe FFM campaign shows an unusual drop: 240 contacts captured, only 38 contacted (16%). Recommend redistributing 80 uncontacted Messe FFM contacts to Ralf Fischer's team, who has capacity and a 5.2% baseline rate. GDPR opt-in is healthy at 79.8% but the Zapier source has been disconnected for 6 hours — 0 contacts captured since 09:14.",
    alerts:[
      { type:"warning", icon:"⚠️", color:C.red,    msg:"Zapier webhook disconnected — 6h data gap. Reconnect immediately." },
      { type:"insight", icon:"📉", color:C.amber,  msg:"Jana Kruse team conv. rate 3.9% — 2.3pp below org average for 6 weeks." },
      { type:"insight", icon:"🎯", color:C.indigo, msg:"Messe FFM: 202 contacts uncontacted. AI suggests reassigning 80 to Ralf Fischer." },
      { type:"success", icon:"🏆", color:C.green,  msg:"Thomas Müller team: best February in 18 months. Anna Klein: top closer at 8.1%." },
    ]
  },
  vd: {
    headline: "Your team is outperforming the org — but Messe FFM contacts are stalling.",
    body: "Your team closed 34 contacts in February (+26% vs January), led by Anna Klein at 8.1% conversion. Marc Otto improved by 1.2pp month-over-month, showing good trajectory. The main risk is Messe FFM — 125 contacts assigned, only 22 contacted. AI recommends prioritising these contacts in Anna Klein's queue this week, as she has the highest reach rate (64%) and the campaign historically performs best when contacted within 48h of capture. Your personal pipeline of 6 contacts has a 16.7% conversion rate — significantly above your team average.",
    alerts:[
      { type:"insight", icon:"🎯", color:C.indigo, msg:"Messe FFM: 103 uncontacted leads. Best match: Anna Klein (reach rate 64%)." },
      { type:"success", icon:"📈", color:C.green,  msg:"Marc Otto improved 1.2pp MoM — consider assigning Q1 Finanz contacts to him." },
      { type:"insight", icon:"⏱️", color:C.amber,  msg:"3 follow-ups overdue >48h. AI suggests morning calls before 10:30." },
    ]
  },
  gp: {
    headline: "You're #1 in the team — your hot contacts need calls before 10:30 today.",
    body: "You have the highest conversion rate in Thomas Müller's team at 8.1%, closing 14 contacts in February. Your top opportunity right now is Sandra Richter (AI score 92) — she opened the welcome email 3 times and her Webinar März segment historically converts 68% when called within 24h of last email open. Peter Hoffmann has had 3 attempts — AI suggests trying between 08:00–09:30 on weekday mornings based on his ZIP code's historical reach data. Your 5 hot contacts should be prioritised before 11:00 today for maximum reach probability.",
    alerts:[
      { type:"insight", icon:"🔥", color:C.red,    msg:"Sandra Richter (score 92): opened email 3× — call before 10:30 for highest reach rate." },
      { type:"insight", icon:"⏰", color:C.amber,  msg:"Peter Hoffmann: best reach window is 08:00–09:30. 3 attempts pending." },
      { type:"success", icon:"🏆", color:C.green,  msg:"You're #1 in the team. Your Q1 Finanz conversion (25%) is 2× team average." },
    ]
  }
};


export const AI_BEST_TIMES = {
  "L-1040": { window:"13:00–15:00", day:"Today", confidence:88, reason:"Webinar audience — afternoon engagement peak. Hamburg timezone." },
  "L-1039": { window:"08:00–09:30", day:"Tomorrow", confidence:82, reason:"Köln ZIP historically reached in early morning. 3rd attempt — try off-peak." },
  "L-1032": { window:"10:00–11:30", day:"Tomorrow", confidence:91, reason:"Appointment confirmed — pre-call prep window. München morning slot." },
  "L-1053": { window:"17:00–18:30", day:"Today", confidence:76, reason:"Follow-up contacts in München ZIP respond best late afternoon." },
  "L-1050": { window:"09:00–10:30", day:"Today", confidence:84, reason:"Meta Ads Q1 Finanz audience — morning engagement. Same-day capture." },
  "L-1041": { window:"11:00–12:30", day:"Today", confidence:79, reason:"Fresh Meta Ads contact — call within 4h of capture for 3× higher reach." },
};


export const AI_EMAIL_DRAFTS = {
  "L-1040": {
    subject: "Your March Webinar Enquiry — Quick Follow-Up",
    body: `Dear Ms. Richter,

Thank you for your interest in our March Webinar programme. I wanted to follow up briefly to see if you have any open questions about our financial advisory services.

Based on your profile, I've identified a few concrete opportunities where we could help you in your current situation — particularly around structured wealth-building.

I'd love to spend 20 minutes with you on a call. Would Wednesday at 2:00pm or Thursday at 10:00am work for you?

Best regards,
Anna Klein | vion Financial`,
    tone: "Professional · Personalised · Soft CTA",
  },
  "L-1039": {
    subject: "Partner Referral — Your Exclusive Advisory Offer",
    body: `Dear Mr. Hoffmann,

You were referred to us through our partner network — and that's no coincidence. Our referred clients consistently achieve our best outcomes.

This is now my third attempt to reach you, because I'm genuinely convinced our services are relevant to your situation. In a short 20-minute call, I can show you exactly what's possible for you.

I'd suggest Friday at 11:00am — or another time that suits you better?

Best regards,
Anna Klein | vion Financial`,
    tone: "Confident · Social proof · Direct ask",
  },
  "default": {
    subject: "Your Enquiry at vion Financial — Next Steps",
    body: `Dear Sir / Madam,

Thank you for your interest in our financial advisory services. I'm reaching out to discuss your enquiry personally.

In a short, no-obligation conversation I can show you how we can help you reach your financial goals — clearly, efficiently, and tailored to your situation.

When would you have 20 minutes free this week?

Best regards,
Anna Klein | vion Financial`,
    tone: "Neutral · Low-pressure · Open CTA",
  }
};


export const AI_SMART_ASSIGNMENTS = [
  { lead:"Markus Bauer",   id:"L-1041", source:"Meta Ads",      campaign:"Q1 Finanz",    city:"München",  suggestedGP:"Anna Klein",   reason:"Highest Q1 Finanz conv. (8.1%) · München ZIP · capacity available", confidence:94 },
  { lead:"Hanna Vogel",    id:"L-1033", source:"Meta Ads",      campaign:"Q1 Finanz",    city:"Hamburg",  suggestedGP:"Marc Otto",    reason:"Hamburg region specialist · Q1 Finanz familiar · improving MoM",     confidence:88 },
];

// ─── ReportDetail ────────────────────────────────────────────────────────────

export const ROLEPLAY_PERSONAS = [
  { id:"busy",    label:"Too Busy",        icon:"⏰", opener:"Ich habe gerade keine Zeit, ich muss gleich in ein Meeting.",                  difficulty:"Easy"   },
  { id:"wife",    label:"Spouse Check",    icon:"💑", opener:"Das muss ich erst mit meiner Frau/meinem Mann besprechen.",                    difficulty:"Medium" },
  { id:"distrust",label:"Skeptic",         icon:"🤨", opener:"Ich bin grundsätzlich skeptisch gegenüber solchen Angeboten.",                  difficulty:"Medium" },
  { id:"price",   label:"Price Objection", icon:"💸", opener:"Das klingt interessant, aber ich glaube, das wird zu teuer für mich sein.",    difficulty:"Hard"   },
  { id:"already", label:"Has Advisor",     icon:"🏦", opener:"Ich habe schon einen Finanzberater und bin damit zufrieden.",                  difficulty:"Hard"   },
  { id:"noknowhow",label:"Not Interested", icon:"🚫", opener:"Ich interessiere mich eigentlich gar nicht für Finanzthemen.",                 difficulty:"Expert" },
];


export const SA_RECENT_ACTIVITY = [
  { time:"2m ago",    icon:"📥", color:C.blue,   title:"47 contacts imported",              sub:"Meta Ads — Q1 Finanz campaign"              },
  { time:"15m ago",   icon:"🏆", color:C.green,  title:"Stefan Koch closed — €2.400",    sub:"Advisor: Kai Becker · Q1 Finanz"         },
  { time:"1h ago",    icon:"⚠️", color:C.red,    title:"Zapier webhook error",            sub:"Make/Zapier source disconnected"             },
  { time:"2h ago",    icon:"👤", color:C.indigo, title:"Anna Klein — 8 contacts assigned",   sub:"Auto-assign by ZIP · Frankfurt"              },
  { time:"3h ago",    icon:"📅", color:C.purple, title:"Appointment booked",              sub:"Sandra Richter — 14:00 Fri · Anna Klein"     },
  { time:"5h ago",    icon:"📞", color:C.slate,  title:"Call logged — Not Reached",       sub:"Felix Wagner · 5th attempt"                  },
  { time:"Yesterday", icon:"📊", color:C.amber,  title:"Weekly report generated",         sub:"Team performance — Thomas Müller"            },
];

export const VD_RECENT_ACTIVITY = [
  { time:"15m ago",   icon:"🏆", color:C.green,  title:"Anna Klein — deal closed",        sub:"€2.400 · Q1 Finanz"                         },
  { time:"1h ago",    icon:"🤖", color:C.ai,     title:"AI reassignment approved",         sub:"Nina Hartmann → Anna Klein"                  },
  { time:"2h ago",    icon:"📅", color:C.indigo, title:"Team appointment booked",          sub:"Marc Otto — Claudia Becker 16:00"            },
  { time:"3h ago",    icon:"📥", color:C.blue,   title:"12 contacts imported to team",        sub:"Messe FFM campaign"                          },
  { time:"5h ago",    icon:"📞", color:C.slate,  title:"Marc Otto — 5 calls logged",       sub:"Q1 Finanz follow-ups"                        },
  { time:"Yesterday", icon:"⚠️", color:C.amber,  title:"3 contacts auto-updated",             sub:"5× not reached → status change"              },
];

export const GP_RECENT_ACTIVITY = [
  { time:"30m ago",   icon:"📞", color:C.green,  title:"Call logged — Reached",            sub:"Sandra Richter · Status → In Progress"      },
  { time:"1h ago",    icon:"📅", color:C.indigo, title:"Appointment booked",               sub:"Lars Dietrich — Thu 15:00 · Phone"           },
  { time:"2h ago",    icon:"✉️", color:C.blue,   title:"Follow-up email sent",             sub:"Claudia Becker · Email automation"           },
  { time:"3h ago",    icon:"🏆", color:C.green,  title:"Deal closed — €3.200",             sub:"Michael Braun · Q1 Finanz"                   },
  { time:"Yesterday", icon:"📥", color:C.slate,  title:"2 new contacts assigned",             sub:"Webinar März campaign"                       },
  { time:"Yesterday", icon:"📞", color:C.amber,  title:"3rd attempt — call logged",        sub:"Peter Hoffmann · Attempted"                  },
];

export const GP_GOALS = [
  { label:"Consultations held", target:15, current:9,  color:C.indigo },
  { label:"Deals closed",       target:8,  current:5,  color:C.green  },
  { label:"New contacts made",  target:20, current:14, color:C.blue   },
];

export const VD_PERSONAL_GOALS = [
  { label:"Consultations held", target:10, current:7,  color:C.indigo },
  { label:"Deals closed (self)",target:4,  current:1,  color:C.green  },
  { label:"My contacts contacted",  target:6,  current:5,  color:C.blue   },
];

export const VD_TEAM_GOALS = [
  { label:"Team appointments",  target:60,  current:54, color:C.indigo },
  { label:"Team closings (MTD)",target:40,  current:34, color:C.green  },
  { label:"Team conv. rate",    target:8,   current:7,  color:C.blue   },
];
// Keep VD_GOALS as alias for backward compat (StatsPanel uses it)

export const VD_GOALS = VD_PERSONAL_GOALS;

export const VD_SCHEDULE_FULL = [
  { time:"09:00", lead:"Sandra Richter",  type:"📞 Phone",  gp:"Anna Klein",   status:"upcoming", campaign:"Q1 Finanz"    },
  { time:"10:30", lead:"Dirk Schumacher", type:"📹 Video",  gp:"Marc Otto",    status:"upcoming", campaign:"Webinar März" },
  { time:"11:30", lead:"Peter Hoffmann",  type:"📞 Phone",  gp:"Marc Otto",    status:"upcoming", campaign:"Q1 Finanz"    },
  { time:"13:00", lead:"Inge Brandt",     type:"📞 Phone",  gp:"Nina Schmitt", status:"upcoming", campaign:"Partner Ref"  },
  { time:"14:00", lead:"Claudia Becker",  type:"📹 Video",  gp:"Anna Klein",   status:"upcoming", campaign:"Q1 Finanz"    },
  { time:"15:30", lead:"Karl Weiss",      type:"🏢 Office", gp:"Marc Otto",    status:"upcoming", campaign:"Messe FFM"    },
  { time:"16:00", lead:"Ralf Neumann",    type:"📞 Phone",  gp:"Nina Schmitt", status:"done",     campaign:"Webinar März" },
  { time:"17:00", lead:"Petra Lange",     type:"📞 Phone",  gp:"Anna Klein",   status:"done",     campaign:"Partner Ref"  },
];

export const SA_GOALS_DATA = [
  { label:"Total closings (MTD)",   target:100, current:89,  color:C.green  },
  { label:"Appointments (MTD)",     target:150, current:134, color:C.indigo },
  { label:"New contacts imported",     target:300, current:248, color:C.blue   },
];

export const GP_UPCOMING_APPTS = [
  { time:"14:00", date:"Mon, 23 Feb", lead:"Sandra Richter", type:"📞 Phone", campaign:"Q1 Finanz",   attempts:2 },
  { time:"11:30", date:"Tue, 24 Feb", lead:"Lars Dietrich",  type:"📹 Video", campaign:"Webinar März", attempts:1 },
  { time:"16:00", date:"Thu, 26 Feb", lead:"Peter Hoffmann", type:"📞 Phone", campaign:"Q1 Finanz",   attempts:3 },
];

export const GP_ADVISORY = [
  { date:"24/02/2026", lead:"Sandra Richter", type:"Concept"      },
  { date:"23/02/2026", lead:"Peter Hoffmann", type:"Follow-up"    },
  { date:"21/02/2026", lead:"Hanna Vogel",    type:"Concept"      },
  { date:"19/02/2026", lead:"Lars Dietrich",  type:"Appointment"  },
  { date:"15/02/2026", lead:"Claudia Becker", type:"Email"        },
  { date:"10/02/2026", lead:"Michael Braun",  type:"Closed Won"   },
];

export const SA_EVENTS_DATA = [
  { name:"Business Opening", jan:45, feb:62, capacity:100 },
  { name:"Investment Talk",  jan:28, feb:41, capacity:80  },
  { name:"Finance Talk",     jan:15, feb:22, capacity:60  },
];

export const SA_TOP_PRODUCTS = [
  { name:"Top Companies Concept Dynamic",   pct:43, color:C.indigo },
  { name:"Gold-Investment: Gold",            pct:29, color:C.amber  },
  { name:"Top Companies Concept Strategic", pct:14, color:C.blue   },
  { name:"Top Funds Concept Dynamic",        pct:14, color:C.green  },
];

// ─── Mini Calendar ────────────────────────────────────────────────────────────

export const TIMELINE_META = {
  call:    { icon:"📞", color:C.blue,    bg:"#EFF6FF" },
  attempt: { icon:"📵", color:C.amber,   bg:"#FFFBEB" },
  assign:  { icon:"⚡", color:C.primary, bg:C.primarySoft },
  email:   { icon:"✉️", color:C.blue,    bg:"#EFF6FF" },
  import:  { icon:"📥", color:C.slate,   bg:C.light },
  note:    { icon:"📝", color:C.amber,   bg:"#FFFBEB" },
};

export const BULK_EMAIL_CAMPAIGNS = [
  { id:"c1", name:"Q1 Finanz — Welcome Series",   status:"sent",      recipients:11920, valid:11920, sent:11920, delivered:11648, opens:4426, clicks:813,  bounces:272, unsubs:38, created:"10 Feb 2026", subject:"Your financial future starts here",      type:"marketing"     },
  { id:"c2", name:"Webinar März — Invitation",     status:"scheduled", recipients:8450,  valid:8102,  sent:0,     delivered:0,     opens:0,    clicks:0,    bounces:0,   unsubs:0,  created:"20 Feb 2026", subject:"You're invited: Webinar March 8",        type:"announcement"  },
  { id:"c3", name:"Re-engagement — Inactive Contacts",status:"draft",     recipients:3210,  valid:3100,  sent:0,     delivered:0,     opens:0,    clicks:0,    bounces:0,   unsubs:0,  created:"22 Feb 2026", subject:"We miss you — here's what's new",       type:"marketing"     },
  { id:"c4", name:"Gold Package — Nurture #2",     status:"sending",   recipients:2890,  valid:2840,  sent:2101,  delivered:2044,  opens:710,  clicks:122,  bounces:57,  unsubs:9,  created:"23 Feb 2026", subject:"Why now is the right time for Gold",     type:"marketing"     },
  { id:"c5", name:"Event Recap — FFP Roadshow",    status:"paused",    recipients:1540,  valid:1498,  sent:900,   delivered:879,   opens:334,  clicks:71,   bounces:21,  unsubs:5,  created:"18 Feb 2026", subject:"Thank you for attending — recap inside", type:"announcement"  },
];


export const SUPPRESSION_LIST = [
  { email:"hans.weber@example.de",   reason:"unsubscribed",  date:"15 Feb" },
  { email:"m.schmidt@gmx.de",        reason:"hard_bounce",   date:"12 Feb" },
  { email:"petra.k@web.de",          reason:"complaint",     date:"10 Feb" },
  { email:"test123@mailinator.com",  reason:"manual_block",  date:"8 Feb"  },
];

// ─────────────────────────────────────────────────────────────────────────────
// NEWSLETTER PAGE  (Listmonk + GrapesJS hybrid approach)
// ─────────────────────────────────────────────────────────────────────────────

// ── Sample data ───────────────────────────────────────────────────────────────

export const NL_LISTS = [
  { id:"l1", name:"Q1 Finanz Subscribers",     count:2847, active:2610, pending:142, unsub:95,  lang:"de", createdBy:"superadmin",  gpOwner:null          },
  { id:"l2", name:"Webinar March — Opted In",  count:612,  active:589,  pending:14,  unsub:9,   lang:"de", createdBy:"superadmin",  gpOwner:null          },
  { id:"l3", name:"English Newsletter",         count:384,  active:362,  pending:11,  unsub:11,  lang:"en", createdBy:"superadmin",  gpOwner:null          },
  { id:"l4", name:"Anna Klein — My Contacts",  count:98,   active:94,   pending:3,   unsub:1,   lang:"de", createdBy:"Anna Klein",  gpOwner:"Anna Klein"  },
  { id:"l5", name:"Ben Hartmann — My Contacts",count:61,   active:58,   pending:2,   unsub:1,   lang:"de", createdBy:"Ben Hartmann",gpOwner:"Ben Hartmann"},
  { id:"l6", name:"Kai Becker — My Contacts",  count:87,   active:84,   pending:2,   unsub:1,   lang:"de", createdBy:"Kai Becker",  gpOwner:"Kai Becker"  },
];


export const NL_CAMPAIGNS_STORE = [
  { id:"nl1", name:"February Market Update",   status:"sent",      list:"l1", sent:2610, opens:987, clicks:312, unsubs:14, created:"10 Feb", subject:"Your February Financial Digest",       createdBy:"superadmin" },
  { id:"nl2", name:"Gold Package Newsletter",  status:"scheduled", list:"l2", sent:0,   opens:0,   clicks:0,   unsubs:0,  created:"20 Feb", subject:"Why Gold is your smartest move in Q1", createdBy:"superadmin" },
  { id:"nl3", name:"March Product Update",     status:"draft",     list:"l1", sent:0,   opens:0,   clicks:0,   unsubs:0,  created:"22 Feb", subject:"New features & financial insights",   createdBy:"superadmin" },
  { id:"nl4", name:"Anna — VIP Digest #1",     status:"sent",      list:"l4", sent:94,  opens:81,  clicks:44,  unsubs:0,  created:"15 Feb", subject:"Exclusive update for my contacts",    createdBy:"Anna Klein" },
];


export const NL_BUILDER_BLOCKS = [
  { id:"hero",    label:"Hero Banner",    icon:"🖼",  desc:"Full-width image + headline + CTA" },
  { id:"text",    label:"Text Block",     icon:"📝",  desc:"Rich text paragraph"                },
  { id:"2col",    label:"Two Columns",    icon:"⬛⬛", desc:"Side-by-side layout"               },
  { id:"cta",     label:"Call to Action", icon:"🔘",  desc:"Button with optional subtext"       },
  { id:"divider", label:"Divider",        icon:"—",   desc:"Horizontal rule"                    },
  { id:"image",   label:"Image",          icon:"🖼",  desc:"Single image + caption"             },
  { id:"footer",  label:"Footer",         icon:"📋",  desc:"Address + unsubscribe link"          },
];


// ── Newsletter template seeds (block-based, both languages) ──────────────────
// Localised value helper — seed content carries both languages; user edits
// store plain strings (pick passes them through unchanged). The seeds are
// materialised per language into the unified EMAIL_TEMPLATES_STORE below.
export const L = (de, en) => ({ de, en });
export const pick = (v, lang) => (v && typeof v === "object" && v.de !== undefined) ? v[lang] : v;

const INITIAL_NL_TEMPLATES = [
  { id:"t1", name:L("Monatliches Markt-Update","Monthly Market Update"), desc:L("Regelmäßiger Finanzmarkt-Überblick","Regular financial market digest"),
    subject:L("Ihr monatliches Markt-Update von vion","Your monthly market update from vion"),
    blocks:[
      { type:"logo", text:"vionworld" },
      { type:"heading", text:L("📈 Markt-Update — {Monat}","📈 Market Update — {Month}") },
      { type:"text", text:L("Guten Tag {FirstName},\n\nhier ist Ihre Marktübersicht für diesen Monat — die wichtigsten Bewegungen, was sie für Sie bedeuten und der Ausblick unserer Analysten.","Dear {FirstName},\n\nHere is your market summary for this month — key movements, what they mean for you, and our analysts' outlook for the coming weeks.") },
      { type:"image", label:L("Marktchart","Market chart") },
      { type:"text", text:L("• Märkte im Überblick — die wichtigsten Bewegungen\n• Der Ausblick unserer Analysten für die kommenden Wochen\n• Ein praktischer Tipp für Ihr Portfolio","• Markets at a glance — key movements and what they mean for you\n• Our analysts' outlook for the coming weeks\n• One practical tip to strengthen your portfolio") },
      { type:"button", label:L("Zum vollständigen Bericht","Read the full report"), url:"#" },
      { type:"divider" },
      { type:"footer", text:"vion gmbh · Musterstraße 1 · 80331 München" },
    ]},
  { id:"t2", name:L("Produkt-Ankündigung","Product Announcement"), desc:L("Neues Produkt oder neue Leistung vorstellen","Introduce a new product or service"),
    subject:L("Neu bei vion: das sollten Sie kennen","New at vion: something we think you'll love"),
    blocks:[
      { type:"logo", text:"vionworld" },
      { type:"image", label:L("Produktbild","Product hero image") },
      { type:"heading", text:L("🎉 Unser neuestes Angebot","🎉 Introducing our newest offering") },
      { type:"text", text:L("Guten Tag {FirstName},\n\nwir haben Neuigkeiten — wir haben etwas Neues für Sie. Darum lohnt es sich:\n\n• Vorteil 1\n• Vorteil 2\n• Vorteil 3","Dear {FirstName},\n\nWe have exciting news — we've just launched something new. Here's why it matters for you:\n\n• Benefit 1\n• Benefit 2\n• Benefit 3") },
      { type:"button", label:L("Mehr erfahren","Learn more"), url:"#" },
      { type:"divider" },
      { type:"footer", text:"vion gmbh · Musterstraße 1 · 80331 München" },
    ]},
  { id:"t3", name:L("Event-Einladung","Event Invitation"), desc:L("Zu Webinar oder Veranstaltung einladen","Invite subscribers to a webinar or event"),
    subject:L("Sie sind eingeladen: [Veranstaltung]","You're invited: [Event name]"),
    blocks:[
      { type:"logo", text:"vionworld" },
      { type:"heading", text:L("📅 Sie sind eingeladen!","📅 You're invited!") },
      { type:"text", text:L("Guten Tag {FirstName},\n\nwir laden Sie herzlich zu unserer Veranstaltung ein:\n\n📅 Datum: [Datum]\n🕕 Uhrzeit: [Uhrzeit]\n📍 Ort: [Ort / Online]","Dear {FirstName},\n\nWe warmly invite you to our upcoming event:\n\n📅 Date: [Date]\n🕕 Time: [Time]\n📍 Location: [Location / Online]") },
      { type:"text", text:L("Die Plätze sind begrenzt — sichern Sie sich Ihren noch heute.","Seats are limited — reserve yours today.") },
      { type:"button", label:L("Platz reservieren","Reserve my seat"), url:"#" },
      { type:"divider" },
      { type:"footer", text:"vion gmbh · Musterstraße 1 · 80331 München" },
    ]},
  { id:"t4", name:L("Willkommens-Newsletter","Welcome Newsletter"), desc:L("Erster Newsletter für neue Abonnenten","First newsletter for new subscribers"),
    subject:L("Willkommen beim vion Newsletter, {FirstName}!","Welcome to the vion newsletter, {FirstName}!"),
    blocks:[
      { type:"logo", text:"vionworld" },
      { type:"heading", text:L("👋 Willkommen, {FirstName}!","👋 Welcome aboard, {FirstName}!") },
      { type:"text", text:L("Schön, dass Sie dabei sind! Das erwartet Sie in unserem Newsletter:\n\n• Monatliche Markt-Updates und Finanz-Einblicke\n• Praktische Tipps für Ihre Finanzplanung\n• Einladungen zu exklusiven Events und Webinaren","Great to have you with us! Here's what you can expect from our newsletter:\n\n• Monthly market updates and financial insights\n• Practical tips for your financial planning\n• Invitations to exclusive events and webinars") },
      { type:"button", label:L("Berater kennenlernen","Meet your advisor"), url:"#" },
      { type:"divider" },
      { type:"footer", text:"vion gmbh · Musterstraße 1 · 80331 München" },
    ]},
  { id:"t5", name:L("Tipps & Einblicke","Tips & Insights"), desc:L("Wissenswertes und praktische Ratschläge","Educational content and practical advice"),
    subject:L("3 Finanz-Tipps, die Sie sofort nutzen können","3 financial tips you can use right away"),
    blocks:[
      { type:"logo", text:"vionworld" },
      { type:"heading", text:L("💡 3 Tipps für Ihre Finanzen","💡 3 tips for your finances") },
      { type:"text", text:L("Guten Tag {FirstName},\n\n1️⃣ [Tipp eins — kurz und umsetzbar]\n\n2️⃣ [Tipp zwei — kurz und umsetzbar]\n\n3️⃣ [Tipp drei — kurz und umsetzbar]","Dear {FirstName},\n\n1️⃣ [Tip one — short and actionable]\n\n2️⃣ [Tip two — short and actionable]\n\n3️⃣ [Tip three — short and actionable]") },
      { type:"divider" },
      { type:"text", text:L("Sie möchten eine persönliche Empfehlung? Ihr Berater ist nur eine Antwort entfernt.","Want a personal recommendation? Your advisor is just one reply away.") },
      { type:"button", label:L("Kostenlose Beratung buchen","Book a free consultation"), url:"#" },
      { type:"footer", text:"vion gmbh · Musterstraße 1 · 80331 München" },
    ]},
  { id:"t6", name:L("Saisonale Grüße","Seasonal Greetings"), desc:L("Feiertags- und Saisongrüße an Ihre Kontakte","Holiday and season's greetings"),
    subject:L("Herzliche Grüße vom gesamten vion Team","Season's greetings from all of us at vion"),
    blocks:[
      { type:"image", label:L("Saisonales Banner","Seasonal banner") },
      { type:"heading", text:L("🎄 Herzliche Grüße, {FirstName}!","🎄 Season's greetings, {FirstName}!") },
      { type:"text", text:L("Zum Jahresende möchten wir Danke sagen — für Ihr Vertrauen und die gute Zusammenarbeit.\n\nWir wünschen Ihnen und Ihren Liebsten eine wunderbare Weihnachtszeit und ein gesundes, erfolgreiches neues Jahr.","As the year draws to a close, we want to say thank you — for your trust and the great cooperation.\n\nWe wish you and your loved ones a wonderful holiday season and a healthy, successful new year.") },
      { type:"divider" },
      { type:"footer", text:"vion gmbh · Musterstraße 1 · 80331 München" },
    ]},
];


export const EM_STATUS_META = {
  sent:      { label:"Sent",      color:C.green  },
  scheduled: { label:"Scheduled", color:C.blue   },
  draft:     { label:"Draft",     color:C.muted  },
  sending:   { label:"Sending",   color:C.amber  },
  paused:    { label:"Paused",    color:C.red    },
};


export const BE_SEGMENTS = {
  active_leads:  { label:"Active Contacts",      total:890,  valid:847,  unsub:23, invalid:12, dupe:5,  consent:3  },
  customers:     { label:"All Customers",      total:412,  valid:398,  unsub:7,  invalid:4,  dupe:2,  consent:1  },
  not_reached:   { label:"Not Reached Contacts",  total:125,  valid:119,  unsub:3,  invalid:2,  dupe:1,  consent:0  },
  followup:      { label:"Follow-up Pipeline", total:189,  valid:182,  unsub:4,  invalid:2,  dupe:1,  consent:0  },
  inactive_60:   { label:"Inactive 60+ days",  total:340,  valid:320,  unsub:10, invalid:7,  dupe:3,  consent:0  },
  opted_in:      { label:"Event Opt-Ins",       total:637,  valid:612,  unsub:15, invalid:8,  dupe:2,  consent:0  },
};


export const CALL_STATUS_OPTIONS = [
  "Reached – Interested",
  "Reached – Not Interested",
  "Reached – Callback Requested",
  "Reached – Appointment Set",
  "Not Reached – Voicemail",
  "Not Reached – No Answer",
  "Not Reached – Wrong Number",
];
// ─── Lifecycle & Stage Status (system-defined vocabulary) ─────────────────────
// Per "Network vs. Lead", Lifecycle is a two-value business state (Lead →
// Network) and Stage Status tracks progress *within* it. Both are system-defined
// (no longer Super-Admin configurable). Stage Status options depend on the
// Lifecycle. This is the single source of truth used by every contact form,
// activity/log modal and outcome picker across the app.
export const LEAD_STAGE_STATUSES    = ["New", "In Contact", "Not Reached", "Not Interested", "Currently Not Interested", "Difficult Case", "Appointment", "Follow Up", "Qualified"];
export const NETWORK_STAGE_STATUSES = ["Customer", "Partner", "Prospect"];

export const LIFECYCLE_OPTIONS  = ["Lead", "Network"];

export const STAGE_OPTIONS      = { Lead: LEAD_STAGE_STATUSES, Network: NETWORK_STAGE_STATUSES };

export const stageStatusOptions = (lifecycle) => STAGE_OPTIONS[lifecycle] || LEAD_STAGE_STATUSES;


export const BLANK_RULE = { prefix:"", city:"", gp:"", vd:"", convRate:"", capacity:80, used:0, priority:"medium" };


export const LC_SOURCES = [
  { id:"landing",  label:"Landing Pages",  icon:"🌐", status:"connected", leads:1240, lastSync:"2 min ago",   method:"API",     color:C.blue   },
  { id:"gsheets",  label:"Google Sheets",  icon:"📊", status:"connected", leads:430,  lastSync:"18 min ago",  method:"API",     color:C.green  },
  { id:"meta",     label:"Meta Ad Forms",  icon:"📣", status:"connected", leads:876,  lastSync:"5 min ago",   method:"API",     color:C.indigo },
  { id:"csv",      label:"CSV Upload",     icon:"📂", status:"idle",      leads:205,  lastSync:"3 days ago",  method:"Manual",  color:C.amber  },
  { id:"offline",  label:"Offline / Events",icon:"🎪",status:"idle",      leads:88,   lastSync:"1 week ago",  method:"Manual",  color:"#EC4899"},
  { id:"zapier",   label:"Make / Zapier",  icon:"⚡", status:"error",     leads:62,   lastSync:"Error — 6h",  method:"Webhook", color:C.red    },
];

export const LC_FIELD_MAPPINGS = [
  { source:"first_name",         crm:"First Name",          type:"Text",      required:true  },
  { source:"last_name",          crm:"Last Name",            type:"Text",      required:true  },
  { source:"email",              crm:"Email Address",        type:"Email",     required:true  },
  { source:"phone_number",       crm:"Phone",                type:"Phone",     required:true  },
  { source:"zip_code",           crm:"ZIP Code",             type:"Text",      required:true  },
  { source:"campaign_id",        crm:"Campaign",             type:"Reference", required:false },
  { source:"utm_source",         crm:"Contact Source",          type:"Text",      required:false },
  { source:"consent_newsletter", crm:"Newsletter Consent",   type:"Boolean",   required:true  },
];

export const LC_IMPORTS = [
  { id:"IMP-0091", source:"Meta Ad Forms",  count:34,  status:"success", time:"Today, 09:14",     campaign:"Q1 Finanz"     },
  { id:"IMP-0090", source:"Landing Pages",  count:12,  status:"success", time:"Today, 08:02",     campaign:"Webinar März"  },
  { id:"IMP-0089", source:"CSV Upload",     count:205, status:"success", time:"Yesterday, 17:30", campaign:"Messe FFM"     },
  { id:"IMP-0088", source:"Make / Zapier",  count:0,   status:"error",   time:"Yesterday, 12:11", campaign:"Giveaway"      },
  { id:"IMP-0087", source:"Google Sheets",  count:58,  status:"success", time:"2 days ago",       campaign:"Partner Ref"   },
];


export const LC_DUPLICATES = [
  { id:"DUP-01", name:"Max Müller",    email:"max.mueller@email.de",  phone:"+49 176 1234567", existing:"L-1018", existingName:"Max Müller",    matchField:"email",       importId:"IMP-0091", source:"Meta Ad Forms"  },
  { id:"DUP-02", name:"Sarah Schmidt", email:"s.schmidt@gmail.com",   phone:"+49 151 9876543", existing:"L-1033", existingName:"Sarah S.",       matchField:"phone",       importId:"IMP-0091", source:"Meta Ad Forms"  },
  { id:"DUP-03", name:"Thomas Weber",  email:"t.weber@web.de",        phone:"+49 172 5551234", existing:"L-1041", existingName:"Thomas Weber",   matchField:"email+phone", importId:"IMP-0089", source:"CSV Upload"     },
];


export const JOURNEY_META = {
  welcome:      {label:"Welcome",              color:"#3B82F6"},
  followup1:    {label:"Follow-up #1",         color:"#8B5CF6"},
  followup2:    {label:"Follow-up #2",         color:"#EC4899"},
  reminder:     {label:"Appointment Reminder", color:"#6366F1"},
  postnurture:  {label:"Post-Appt Nurture",    color:"#10B981"},
  reengagement: {label:"Re-Engagement",        color:"#F59E0B"},
  newsletter:   {label:"Newsletter",           color:"#0EA5E9"},
};

export const AUDIT_EVENTS = [
  { time:"Today 10:31", user:"Anna Klein",    role:"GP",   action:"Viewed contact",         target:"L-1028 · Sophie Lange",       ip:"192.168.1.44" },
  { time:"Today 10:28", user:"Anna Klein",    role:"GP",   action:"Logged call outcome", target:"L-1028 · Sophie Lange",       ip:"192.168.1.44" },
  { time:"Today 09:45", user:"Thomas Müller", role:"VD",   action:"Reassigned contact",     target:"L-1033 → Anna Klein",         ip:"192.168.1.12" },
  { time:"Today 09:30", user:"System",        role:"Auto", action:"Auto-assigned contact",  target:"L-1041 via ZIP 80331",        ip:"—"            },
  { time:"Today 09:14", user:"System",        role:"Auto", action:"Import completed",    target:"IMP-0091 · 34 contacts",         ip:"—"            },
  { time:"Today 09:12", user:"Anna Klein",    role:"GP",   action:"Sent document",       target:"L-1022 · Beratungsmappe.pdf", ip:"192.168.1.44" },
  { time:"Today 08:55", user:"Super Admin",   role:"SA",   action:"Updated ZIP rule",    target:"ZIP 80xxx → Anna Klein",      ip:"192.168.1.1"  },
  { time:"Today 08:20", user:"Anna Klein",    role:"GP",   action:"GDPR export",         target:"L-1041 · Article 15",         ip:"192.168.1.44" },
  { time:"Yesterday",   user:"Thomas Müller", role:"VD",   action:"Viewed contact",         target:"L-1019 · Karl Braun",         ip:"192.168.1.12" },
  { time:"Yesterday",   user:"Lisa Weber",    role:"VD",   action:"Updated contact status", target:"L-1055 → Closed Won",         ip:"192.168.2.8"  },
  { time:"Yesterday",   user:"System",        role:"Auto", action:"Email sent",          target:"L-1028 · Follow-up #1",       ip:"—"            },
  { time:"2 days ago",  user:"Super Admin",   role:"SA",   action:"Invited user",        target:"Jana Kruse · Sales Director", ip:"192.168.1.1"  },
];


export const WORKFLOW_CATEGORIES = [
  { id:"all",         label:"All"          },
  { id:"acquisition", label:"Acquisition"  },
  { id:"contact",     label:"Contact"      },
  { id:"appointment", label:"Appointment"  },
  { id:"closing",     label:"Closing"      },
  { id:"followup",    label:"Follow-up"    },
];


export const ACTION_META = {
  auto_email: { icon:"✉️", label:"Auto Email", color:"#3B82F6", desc:"System sends email automatically" },
  set_status: { icon:"🔄", label:"Set Status",  color:"#0EA5E9", desc:"Move the contact to a status"        },
  task:       { icon:"✅", label:"Task",        color:"#D97706", desc:"Creates a task for the advisor" },
  push:       { icon:"📱", label:"Push Alert",  color:"#7C3AED", desc:"Push notification to user(s)"    },
};


export const TRIGGER_ICONS = {
  lead_assigned:      "⚡",
  lead_not_reached_1_4:"📵",
  lead_not_reached_5: "🚫",
  lead_not_interested:"👎",
  appointment_scheduled:"📅",
  appointment_not_held: "❌",
  lead_closed:        "🏆",
  lead_followup:      "🔁",
  lead_nurturing:     "💧",
};


// ─── Rule Editor Modal (top-level to avoid hook violations) ─────────────────

export const CATEGORIES = [
  { id:"all",         label:"All"          },
  { id:"acquisition", label:"Acquisition"  },
  { id:"contact",     label:"Contact"      },
  { id:"appointment", label:"Appointments" },
  { id:"followup",    label:"Follow-up"    },
  { id:"closing",     label:"Closing"      },
  { id:"nurturing",   label:"Nurturing"    },
  { id:"compliance",  label:"Compliance"   },
];

// Trigger events mirror Vion_CRM_Workflow.docx §4–5 (contact loop / closing) and
// §7 (automated parallel tracks). Keys kept stable for existing rules.

export const AUTOMATION_TRIGGERS = [
  { group:"Contact Entry & Assignment", color:"#3B82F6", items:[
    { key:"new_lead_submitted",   label:"New contact submitted",                icon:"🆕", desc:"Contact captured via any entry point (§1, §7)" },
    { key:"lead_assigned",        label:"Contact assigned to advisor",       icon:"⚡", desc:"SA/VD routes a contact down to a GP (§3)" },
  ]},
  { group:"Contact Loop", color:"#7C3AED", items:[
    { key:"lead_not_reached_1_4", label:"Not Reached — attempt 1–4×",        icon:"📵", desc:"Each failed attempt below threshold; push alert (§4)" },
    { key:"lead_not_reached_5",   label:"Not Reached — threshold reached",   icon:"🚫", desc:"Attempts hit the threshold; exit call loop (§4)" },
    { key:"lead_not_interested",  label:"Reached — Not Interested",          icon:"👎", desc:"Reached but declined / bad timing (§4 Decision B)" },
  ]},
  { group:"Appointment & Closing", color:"#059669", items:[
    { key:"appointment_scheduled",label:"Appointment scheduled",             icon:"📅", desc:"Contact interested; appointment on calendar (§5.1)" },
    { key:"appointment_not_held", label:"Appointment cancelled / no-show",   icon:"❌", desc:"Held-status: cancelled or rescheduled (§5.2)" },
    { key:"lead_closed",          label:"Closed — New Customer",             icon:"🏆", desc:"Outcome: customer; closing recorded (§5.2, §7)" },
  ]},
  { group:"Follow-up & Nurture", color:"#D97706", items:[
    { key:"lead_followup",        label:"Follow-up / Undecided",             icon:"🔁", desc:"Outcome: undecided; future interval (§5.2)" },
    { key:"lead_nurturing",       label:"Nurture / Retargeting (consent)",   icon:"🌱", desc:"Re-engage Not-Interested contacts with valid consent (§7, §9)" },
  ]},
  { group:"Compliance", color:"#DC2626", items:[
    { key:"consent_withdrawn",    label:"Consent withdrawn / DNC",           icon:"🔒", desc:"Contact revokes consent — exclude from outreach (§6, §9)" },
  ]},
];

// Each trigger maps to one list category (trigger is fixed per rule, so the
// rule's category is derived from it rather than entered by hand).

export const TRIGGER_CATEGORY = {
  new_lead_submitted:"acquisition", lead_assigned:"acquisition",
  lead_not_reached_1_4:"contact", lead_not_reached_5:"contact", lead_not_interested:"contact",
  appointment_scheduled:"appointment", appointment_not_held:"appointment",
  lead_closed:"closing", lead_followup:"followup", lead_nurturing:"nurturing",
  consent_withdrawn:"compliance",
};

// Soft compliance guardrails per trigger — surfaced as a warning in the modal,
// never blocking (the Super Admin can still proceed deliberately).

export const TRIGGER_COMPLIANCE = {
  consent_withdrawn: {
    leadEmail: "This event means the contact opted out / is Do-Not-Contact. Emailing the contact may violate GDPR — consider notifying internal roles instead.",
  },
};

// Staff roles a rule can target (PO intentionally omitted for now).

export const RULE_ROLE_OPTS = [["gp","Advisor"],["vd","Sales Director"],["superadmin","Super Admin"]];

export let ATTACHMENTS_STORE = [
  { id:"att-1", name:"vion Product Brochure",     file:"vion_brochure_2026.pdf",    size:"2.4 MB", type:"PDF",   lang:"de", createdBy:"superadmin", usedIn:3 },
  { id:"att-2", name:"Q1 Investment Overview",    file:"q1_investment_overview.pdf",size:"1.1 MB", type:"PDF",   lang:"de", createdBy:"superadmin", usedIn:1 },
  { id:"att-3", name:"Gold Package Summary",      file:"gold_package_en.pdf",       size:"0.8 MB", type:"PDF",   lang:"en", createdBy:"superadmin", usedIn:2 },
  { id:"att-4", name:"Appointment Confirmation",  file:"appt_confirm_template.docx",size:"0.2 MB", type:"DOCX",  lang:"de", createdBy:"Anna Klein",  usedIn:0 },
  { id:"att-5", name:"Privacy Policy (GDPR)",     file:"datenschutz_2026.pdf",      size:"0.5 MB", type:"PDF",   lang:"de", createdBy:"superadmin", usedIn:5 },
];


export const INITIAL_EMAIL_TEMPLATES = [
  // Welcome
  { id:"et-w1",  lang:"de", journey:"welcome",     name:"Q1 Finanz Welcome",           subject:"Willkommen — Ihre kostenlose Finanzberatung wartet",  body:"Liebe/r {{lead_name}},\n\nvielen Dank für Ihr Interesse an unseren Finanzberatungsleistungen im Rahmen der Q1 Finanz Kampagne.\n\nIhr persönlicher Berater {{advisor_name}} wird sich in Kürze bei Ihnen melden, um einen individuellen Beratungstermin zu vereinbaren.\n\nUm sicherzustellen, dass Sie weiterhin von uns hören möchten, bestätigen Sie bitte Ihre E-Mail-Adresse mit dem Button unten.\n\nMit freundlichen Grüßen,\n{{advisor_name}}\n{{sender_email}}", variables:["{{lead_name}}","{{advisor_name}}","{{sender_email}}"], published:true },
  { id:"et-w2",  lang:"de", journey:"welcome",     name:"Webinar März Welcome",         subject:"Ihr Platz beim Webinar ist gesichert ✅",              body:"Hallo {{lead_name}},\n\nschön, dass Sie sich für unser Webinar im März angemeldet haben!\n\nIhr Berater {{advisor_name}} freut sich darauf, Sie persönlich kennenzulernen. Sie werden in den nächsten 24 Stunden einen Anruf erhalten.\n\nBitte bestätigen Sie Ihre E-Mail-Adresse, damit wir Ihnen alle relevanten Unterlagen zusenden können.\n\nBis bald,\n{{advisor_name}}", variables:["{{lead_name}}","{{advisor_name}}"], published:true },
  { id:"et-w3",  lang:"de", journey:"welcome",     name:"Default Welcome",              subject:"Herzlich willkommen — wir melden uns bald",           body:"Hallo {{lead_name}},\n\nvielen Dank für Ihre Anfrage. Ein Mitglied unseres Teams wird sich innerhalb von 24 Stunden bei Ihnen melden.\n\nFreundliche Grüße,\n{{advisor_name}}", variables:["{{lead_name}}","{{advisor_name}}"], published:true },
  // Follow-up 1
  { id:"et-f1",  lang:"de", journey:"followup1",   name:"Follow-up #1 — Interest Check", subject:"Haben Sie noch Fragen? Wir sind für Sie da",         body:"Hallo {{lead_name}},\n\nwir wollten kurz nachfragen, ob Sie unsere erste Nachricht erhalten haben und ob wir Ihnen weiterhelfen können.\n\nUnser Berater {{advisor_name}} steht Ihnen gerne für ein kurzes Gespräch zur Verfügung. Wann passt es Ihnen am besten?\n\nBeste Grüße,\n{{advisor_name}}", variables:["{{lead_name}}","{{advisor_name}}"], published:true },
  { id:"et-f2",  lang:"de", journey:"followup1",   name:"Follow-up #1 — Webinar Variant",subject:"Erinnerung: Ihr Webinar-Nachgespräch",              body:"Hallo {{lead_name}},\n\nach dem Webinar im März möchten wir Ihnen gerne helfen, die nächsten Schritte zu planen.\n\nBitte antworten Sie auf diese E-Mail oder rufen Sie uns an — {{advisor_name}} ist für Sie da.\n\nViele Grüße,\n{{advisor_name}}", variables:["{{lead_name}}","{{advisor_name}}"], published:true },
  // Follow-up 2
  { id:"et-f3",  lang:"de", journey:"followup2",   name:"Follow-up #2 — Free Resource",  subject:"Exklusiv für Sie: Unser kostenloser Finanz-Guide",  body:"Hallo {{lead_name}},\n\nals kleines Dankeschön für Ihr Interesse senden wir Ihnen unseren kostenlosen Finanz-Guide.\n\nVielleicht ist jetzt ein guter Moment für ein kurzes Gespräch? Melden Sie sich jederzeit bei {{advisor_name}}.\n\nFreundliche Grüße,\n{{advisor_name}}", variables:["{{lead_name}}","{{advisor_name}}"], published:true },
  { id:"et-f4",  lang:"de", journey:"followup2",   name:"Follow-up #2 — Event Invite",   subject:"Einladung: Unser nächstes Info-Event",              body:"Hallo {{lead_name}},\n\nwir laden Sie herzlich zu unserem nächsten Informationsabend ein. Es wäre eine großartige Gelegenheit, sich unverbindlich zu informieren.\n\nBei Fragen steht Ihnen {{advisor_name}} gerne zur Verfügung.\n\nBis bald,\n{{advisor_name}}", variables:["{{lead_name}}","{{advisor_name}}"], published:true },
  // Appointment Reminder
  // English variants
  { id:"et-w1-en", lang:"en", journey:"welcome",     name:"Q1 Finanz Welcome (EN)",            subject:"Welcome — Your free financial consultation is waiting",    body:"Dear {{lead_name}},\n\nThank you for your interest in our financial advisory services as part of the Q1 Finanz campaign.\n\nYour personal advisor {{advisor_name}} will contact you shortly to arrange an individual consultation.\n\nTo confirm you'd like to hear from us, please verify your email address using the button below.\n\nKind regards,\n{{advisor_name}}", variables:["{{lead_name}}","{{advisor_name}}"], published:true },
  { id:"et-r1-en", lang:"en", journey:"reminder",    name:"Appointment Reminder — Phone (EN)", subject:"Reminder: Your phone consultation tomorrow at {{appt_time}}",body:"Dear {{lead_name}},\n\nThis is your reminder about our phone consultation tomorrow at {{appt_time}}.\n\nYour advisor {{advisor_name}} will call you. Please make sure you are reachable.\n\nSee you tomorrow,\n{{advisor_name}}", variables:["{{lead_name}}","{{advisor_name}}","{{appt_time}}"], published:true },
  { id:"et-f1-en", lang:"en", journey:"followup1",   name:"Follow-up #1 — Interest Check (EN)",subject:"Still interested? We're here to help",                    body:"Dear {{lead_name}},\n\nWe wanted to check if you received our first message and whether we can help you further.\n\nYour advisor {{advisor_name}} is happy to arrange a short call. When would suit you best?\n\nBest regards,\n{{advisor_name}}", variables:["{{lead_name}}","{{advisor_name}}"], published:true },
  { id:"et-r1",  lang:"de", journey:"reminder",    name:"Appointment Reminder — Phone",  subject:"Erinnerung: Ihr Telefontermin morgen um {{appt_time}}", body:"Hallo {{lead_name}},\n\nhier ist Ihre Erinnerung an unseren Telefontermin morgen um {{appt_time}} Uhr.\n\nIhr Berater {{advisor_name}} wird Sie unter Ihrer Nummer anrufen. Bitte stellen Sie sicher, dass Sie erreichbar sind.\n\nBis morgen,\n{{advisor_name}}\n{{sender_email}}", variables:["{{lead_name}}","{{advisor_name}}","{{appt_time}}","{{sender_email}}"], published:true },
  { id:"et-r2",  lang:"de", journey:"reminder",    name:"Appointment Reminder — Video",  subject:"Ihr Video-Termin morgen — Link anbei",             body:"Hallo {{lead_name}},\n\nmorgen um {{appt_time}} Uhr findet unser Video-Gespräch statt. Hier ist Ihr Zoom-Link:\n\n{{appointment_link}}\n\nBei technischen Fragen wenden Sie sich bitte im Voraus an {{advisor_name}}.\n\nBis morgen!\n{{advisor_name}}", variables:["{{lead_name}}","{{advisor_name}}","{{appt_time}}","{{appointment_link}}"], published:true },
  { id:"et-r3",  lang:"de", journey:"reminder",    name:"Appointment Reminder — In-Person",subject:"Morgen treffen wir uns — Adresse und Details",    body:"Hallo {{lead_name}},\n\nmorgiges Treffen: {{appt_time}} Uhr, {{appointment_location}}.\n\nWir freuen uns auf Sie! Bitte bringen Sie wenn möglich relevante Unterlagen mit.\n\nBis dann,\n{{advisor_name}}", variables:["{{lead_name}}","{{advisor_name}}","{{appt_time}}","{{appointment_location}}"], published:true },
  // Post nurture
  { id:"et-p1",  lang:"de", journey:"postnurture", name:"Post-Appt Follow-up",           subject:"Schön, dass wir gesprochen haben — nächste Schritte",body:"Hallo {{lead_name}},\n\nvielen Dank für unser Gespräch! Es war schön, mehr über Ihre Ziele zu erfahren.\n\nWie besprochen sende ich Ihnen die Unterlagen in Kürze zu. Melden Sie sich jederzeit, wenn Sie Fragen haben.\n\nFreundliche Grüße,\n{{advisor_name}}", variables:["{{lead_name}}","{{advisor_name}}"], published:true },
  { id:"et-p2",  lang:"de", journey:"postnurture", name:"Referral Request",              subject:"Kennen Sie jemanden, der auch profitieren könnte?",  body:"Hallo {{lead_name}},\n\nwir freuen uns, dass unser Gespräch hilfreich war. Falls Sie jemanden kennen, der ebenfalls von einer kostenlosen Beratung profitieren könnte, würden wir uns über eine Empfehlung sehr freuen.\n\nVielen Dank,\n{{advisor_name}}", variables:["{{lead_name}}","{{advisor_name}}"], published:true },
  { id:"et-p3",  lang:"de", journey:"postnurture", name:"Cross-sell Introduction",       subject:"Noch mehr Möglichkeiten für Sie",                   body:"Hallo {{lead_name}},\n\nneben unserem Hauptangebot haben wir noch weitere Dienstleistungen, die für Sie interessant sein könnten. Darf ich Ihnen dazu kurz schreiben?\n\nViele Grüße,\n{{advisor_name}}", variables:["{{lead_name}}","{{advisor_name}}"], published:true },
  // Re-engagement
  { id:"et-e1",  lang:"de", journey:"reengagement",name:"Re-engagement — Event Invite",  subject:"Wir haben etwas Besonderes für Sie",                body:"Hallo {{lead_name}},\n\nes ist eine Weile her, aber wir dachten an Sie! Wir veranstalten demnächst ein exklusives Event und würden Sie gerne einladen.\n\nMelden Sie sich bei Interesse gerne bei {{advisor_name}}.\n\nHerzliche Grüße,\n{{advisor_name}}", variables:["{{lead_name}}","{{advisor_name}}"], published:true },
  { id:"et-e2",  lang:"de", journey:"reengagement",name:"Re-engagement — Market Update", subject:"Wichtige Marktentwicklungen — was bedeutet das für Sie?",body:"Hallo {{lead_name}},\n\ndie Finanzmärkte haben sich verändert — und das könnte für Sie relevant sein. Darf ich Ihnen kurz erklären, was das für Ihre Situation bedeutet?\n\nBei Interesse freue ich mich auf Ihre Antwort.\n\n{{advisor_name}}", variables:["{{lead_name}}","{{advisor_name}}"], published:true },
];
// Module-level store so edits persist within session

// ── Unified template store ────────────────────────────────────────────────────
// Every email template is block-based (same model as the newsletter editor).
// Plain-text seeds above are wrapped in a single text block; newsletter seeds
// are materialised per language with the unified {{...}} personalisation
// tokens, so journeys, manual sends, bulk campaigns and newsletters all draw
// from one store.
const swapTokens = (s) => typeof s === "string" ? s.replace(/\{FirstName\}/g, "{{lead_name}}") : s;
const bodyToBlocks = ({ body, ...t }) => ({ attachments:[], ...t, blocks: t.blocks || [{ type:"text", text: body||"" }] });
const materializeNlTemplate = (tpl, lang) => ({
  id:`${tpl.id}-${lang}`, lang, journey:"newsletter", published:true, attachments:[],
  name:pick(tpl.name, lang), desc:pick(tpl.desc, lang), subject:swapTokens(pick(tpl.subject, lang)),
  variables:["{{lead_name}}","{{advisor_name}}"],
  blocks: tpl.blocks.map(b => {
    const o = { ...b };
    for (const k of ["text","label","html"]) if (o[k] !== undefined) o[k] = swapTokens(pick(o[k], lang));
    if (Array.isArray(o.cells)) o.cells = o.cells.map(c => swapTokens(pick(c, lang)));
    return o;
  }),
});
export let EMAIL_TEMPLATES_STORE: any[] = [
  ...INITIAL_EMAIL_TEMPLATES.map(bodyToBlocks),
  ...INITIAL_NL_TEMPLATES.flatMap(t => [materializeNlTemplate(t, "de"), materializeNlTemplate(t, "en")]),
];

// Flatten a block layout into plain text — used by manual sends, bulk
// campaigns and list previews. Visual-only blocks (logo, image, divider)
// carry no text and are dropped.
export const blocksToText = (blocks) => (blocks||[]).map(b => {
  switch (b.type) {
    case "heading": case "text": case "footer": case "imgtext": return b.text || "";
    case "button": return b.label ? `→ ${b.label}${b.url && b.url !== "#" ? `: ${b.url}` : ""}` : "";
    case "html":   return (b.html || "").replace(/<[^>]*>/g, "").trim();
    case "cols2": case "section": return (b.cells || [b.left, b.right]).filter(Boolean).join("\n");
    default: return "";
  }
}).filter(Boolean).join("\n\n");

// ─── Email Template Editor Modal ──────────────────────────────────────────────

export const EVENTS_LIST = [
  {
    id:"E1", name:"Business Opening", type:"Business Opening", icon:"🏢",
    color:"#6366F1",
    dates:[
      { id:"E1a", label:"10 February 2026", time:"09:00 – 19:30", location:"Marriott Hotel, Rua Constelações 9809 Lisbon, Portugal", present:62, absent:18, unspecified:8,  capacity:100, status:"past"     },
      { id:"E1b", label:"20 March 2026",    time:"09:00 – 18:30", location:"Marriott Hotel, Rua Constelações 9809 Lisbon, Portugal", present:0,  absent:0,  unspecified:44, capacity:100, status:"upcoming" },
      { id:"E1c", label:"10 April 2026",    time:"09:00 – 19:30", location:"Marriott Hotel, Rua Constelações 9809 Lisbon, Portugal", present:0,  absent:0,  unspecified:31, capacity:100, status:"upcoming" },
    ],
    description:"Our flagship business opening event. Designed for prospective DION members to get an overview of the vion concept, meet advisors, and begin their financial journey.",
    jan:45, feb:62,
  },
  {
    id:"E2", name:"Investment Talk", type:"Investment Talk", icon:"📈",
    color:"#3B82F6",
    dates:[
      { id:"E2a", label:"12 February 2026", time:"18:00 – 20:30", location:"vion Office Frankfurt, Mainzer Landstr. 50, 60325 Frankfurt", present:41, absent:9,  unspecified:4,  capacity:80, status:"past"     },
      { id:"E2b", label:"19 March 2026",    time:"18:00 – 20:30", location:"vion Office Frankfurt, Mainzer Landstr. 50, 60325 Frankfurt", present:0,  absent:0,  unspecified:29, capacity:80, status:"upcoming" },
    ],
    description:"An exclusive evening event where qualified contacts hear directly from senior advisors about investment strategies, gold concepts, and top company portfolios.",
    jan:28, feb:41,
  },
  {
    id:"E3", name:"Finance Talk", type:"Others", icon:"💰",
    color:"#10B981",
    dates:[
      { id:"E3a", label:"5 February 2026",  time:"17:30 – 19:30", location:"Online – Zoom Webinar", present:22, absent:5, unspecified:2,  capacity:60, status:"past"     },
      { id:"E3b", label:"5 March 2026",     time:"17:30 – 19:30", location:"Online – Zoom Webinar", present:0,  absent:0, unspecified:18, capacity:60, status:"upcoming" },
    ],
    description:"A shorter online format covering current financial market developments, product updates, and Q&A with advisors.",
    jan:15, feb:22,
  },
  {
    id:"E4", name:"Gold Vortrag", type:"Others", icon:"🥇",
    color:"#F59E0B",
    dates:[
      { id:"E4a", label:"27 February 2026", time:"19:00 – 21:00", location:"vion Office München, Leopoldstr. 11, 80802 München", present:17, absent:3, unspecified:5,  capacity:40, status:"past"     },
      { id:"E4b", label:"27 March 2026",    time:"19:00 – 21:00", location:"vion Office München, Leopoldstr. 11, 80802 München", present:0,  absent:0, unspecified:12, capacity:40, status:"upcoming" },
    ],
    description:"A specialised evening talk focused on gold as an asset class — history, strategy, and current market dynamics.",
    jan:12, feb:17,
  },
];


export const EVENTS_REGISTRANTS = {
  E1a:[
    { name:"Sandra Richter",  gp:"Anna Klein",   vd:"Thomas Müller", status:"present",    registered:"01 Feb", campaign:"Meta Ads"     },
    { name:"Peter Hoffmann",  gp:"Marc Otto",    vd:"Thomas Müller", status:"present",    registered:"03 Feb", campaign:"Q1 Finanz"    },
    { name:"Hanna Vogel",     gp:"Anna Klein",   vd:"Thomas Müller", status:"present",    registered:"04 Feb", campaign:"Landing Page" },
    { name:"Lars Dietrich",   gp:"Nina Schmitt", vd:"Thomas Müller", status:"absent",     registered:"05 Feb", campaign:"Partner Ref"  },
    { name:"Claudia Becker",  gp:"Marc Otto",    vd:"Thomas Müller", status:"present",    registered:"06 Feb", campaign:"Q1 Finanz"    },
    { name:"Felix Wagner",    gp:"Anna Klein",   vd:"Thomas Müller", status:"absent",     registered:"07 Feb", campaign:"Meta Ads"     },
    { name:"Julia Schneider", gp:"Kai Becker",   vd:"Lisa Weber",    status:"present",    registered:"08 Feb", campaign:"Meta Ads"     },
    { name:"Markus Bauer",    gp:"Tanja Vogt",   vd:"Lisa Weber",    status:"unspecified",registered:"09 Feb", campaign:"CSV"          },
  ],
  E2a:[
    { name:"Stefan Koch",     gp:"Kai Becker",   vd:"Lisa Weber",    status:"present",    registered:"05 Feb", campaign:"Q1 Finanz"    },
    { name:"Nina Hartmann",   gp:"Marc Otto",    vd:"Thomas Müller", status:"present",    registered:"06 Feb", campaign:"Messe FFM"    },
    { name:"Dirk Schumacher", gp:"Anna Klein",   vd:"Thomas Müller", status:"absent",     registered:"07 Feb", campaign:"Webinar März" },
    { name:"Inge Brandt",     gp:"Nina Schmitt", vd:"Thomas Müller", status:"present",    registered:"08 Feb", campaign:"Partner Ref"  },
    { name:"Karl Weiss",      gp:"Ben Hartmann", vd:"Ralf Fischer",  status:"unspecified",registered:"09 Feb", campaign:"CSV"          },
  ],
};


export const EVENTS_MONTHLY = [
  { month:"Aug", registrants:38, present:28 },
  { month:"Sep", registrants:52, present:41 },
  { month:"Oct", registrants:47, present:35 },
  { month:"Nov", registrants:61, present:49 },
  { month:"Dec", registrants:44, present:33 },
  { month:"Jan", registrants:88, present:70 },
  { month:"Feb", registrants:142,present:105},
];

// ─── Events Page ──────────────────────────────────────────────────────────────

export const EDU_CATEGORIES = ["All","Finance Basics","Investment Strategy","Sales Techniques","Product Knowledge","Compliance"];

export const EDU_VIDEOS = [
  { id:"v1",  title:"Top Companies Concept — Dynamic",     category:"Investment Strategy", duration:"16:42", views:312, completions:187, rating:4.8, thumbnail:"📈", isNew:false, featured:true  },
  { id:"v2",  title:"Gold Investment: Understanding Gold", category:"Investment Strategy", duration:"09:15", views:289, completions:241, rating:4.7, thumbnail:"🥇", isNew:false, featured:false },
  { id:"v3",  title:"Objection Handling Masterclass",      category:"Sales Techniques",    duration:"22:30", views:265, completions:198, rating:4.9, thumbnail:"💬", isNew:false, featured:true  },
  { id:"v4",  title:"Top Companies Concept — Strategic",   category:"Investment Strategy", duration:"14:10", views:241, completions:155, rating:4.6, thumbnail:"🏢", isNew:false, featured:false },
  { id:"v5",  title:"Top Funds Concept Dynamic",           category:"Finance Basics",      duration:"11:55", views:218, completions:172, rating:4.5, thumbnail:"💹", isNew:false, featured:false },
  { id:"v6",  title:"GDPR & Data Privacy for Advisors", category:"Compliance",          duration:"18:00", views:196, completions:131, rating:4.4, thumbnail:"🔒", isNew:false, featured:false },
  { id:"v7",  title:"Building Client Trust & Rapport",     category:"Sales Techniques",    duration:"13:20", views:174, completions:143, rating:4.7, thumbnail:"🤝", isNew:false, featured:false },
  { id:"v8",  title:"Understanding Risk Profiles",         category:"Finance Basics",      duration:"20:45", views:162, completions:98,  rating:4.3, thumbnail:"⚖️", isNew:false, featured:false },
  { id:"v9",  title:"Phone Call Techniques & Scripts",     category:"Sales Techniques",    duration:"08:30", views:89,  completions:67,  rating:4.2, thumbnail:"📞", isNew:true,  featured:false },
  { id:"v10", title:"New: Q2 Campaign Product Update",     category:"Product Knowledge",   duration:"06:10", views:54,  completions:31,  rating:4.1, thumbnail:"📣", isNew:true,  featured:false },
  { id:"v11", title:"Pension & Retirement Planning",       category:"Finance Basics",      duration:"24:00", views:43,  completions:18,  rating:4.0, thumbnail:"🏦", isNew:false, featured:false },
  { id:"v12", title:"Digital Outreach & Social Media",     category:"Sales Techniques",    duration:"12:15", views:31,  completions:12,  rating:3.8, thumbnail:"📱", isNew:false, featured:false },
];

export const EDU_MEMBERS = [
  { name:"Anna Klein",   watched:14, completions:11, lastActive:"Today",      pct:82, color:C.green  },
  { name:"Marc Otto",    watched:11, completions:8,  lastActive:"Today",      pct:65, color:C.indigo },
  { name:"Nina Schmitt", watched:9,  completions:6,  lastActive:"Yesterday",  pct:53, color:C.blue   },
  { name:"Kai Becker",   watched:7,  completions:5,  lastActive:"2 days ago", pct:41, color:C.purple },
  { name:"Tanja Vogt",   watched:5,  completions:3,  lastActive:"3 days ago", pct:29, color:C.amber  },
  { name:"Ben Hartmann", watched:3,  completions:1,  lastActive:"5 days ago", pct:18, color:C.red    },
];

export const EDU_MONTHLY = [
  { month:"Aug", views:140 }, { month:"Sep", views:165 }, { month:"Oct", views:190 },
  { month:"Nov", views:210 }, { month:"Dec", views:185 }, { month:"Jan", views:240 }, { month:"Feb", views:287 },
];

// ─── GP Education Data (Anna Klein's personal progress) ──────────────────────

export const GP_EDU_PROGRESS = {
  v1:  { status:"completed",  progressPct:100, lastWatched:"3 days ago",  timeSpent:"16:42" },
  v2:  { status:"completed",  progressPct:100, lastWatched:"5 days ago",  timeSpent:"09:15" },
  v3:  { status:"in_progress",progressPct:60,  lastWatched:"Yesterday",   timeSpent:"13:32" },
  v4:  { status:"completed",  progressPct:100, lastWatched:"1 week ago",  timeSpent:"14:10" },
  v5:  { status:"completed",  progressPct:100, lastWatched:"1 week ago",  timeSpent:"11:55" },
  v6:  { status:"in_progress",progressPct:30,  lastWatched:"4 days ago",  timeSpent:"05:24" },
  v7:  { status:"completed",  progressPct:100, lastWatched:"2 weeks ago", timeSpent:"13:20" },
  v8:  { status:"not_started",progressPct:0,   lastWatched:null,          timeSpent:null    },
  v9:  { status:"not_started",progressPct:0,   lastWatched:null,          timeSpent:null    },
  v10: { status:"not_started",progressPct:0,   lastWatched:null,          timeSpent:null    },
  v11: { status:"not_started",progressPct:0,   lastWatched:null,          timeSpent:null    },
  v12: { status:"not_started",progressPct:0,   lastWatched:null,          timeSpent:null    },
};

// ─── GP Education Page ────────────────────────────────────────────────────────

// ── Mutable-store setters (replace cross-module reassignment) ────────────────
export function setLIFECYCLE_STORE(next){ LIFECYCLE_STORE = next; STATUS_META = buildStatusMeta(); }
export function setEMAIL_TEMPLATES_STORE(next){ EMAIL_TEMPLATES_STORE = next; }
export function setDOCUMENT_TYPES_STORE(next){ DOCUMENT_TYPES_STORE = next; }
export function setLABELS_STORE(next){ LABELS_STORE = next; }
export function setATTACHMENTS_STORE(next){ ATTACHMENTS_STORE = next; }

