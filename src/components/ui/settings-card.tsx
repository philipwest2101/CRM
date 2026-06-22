import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { C } from "../../theme";

export const SettingsCard = ({title,children}) => (
  <div style={{ background:"#fff",borderRadius:12,border:`1px solid ${C.border}`,marginBottom:16,overflow:"hidden" }}>
    <div style={{ padding:"14px 20px",borderBottom:`1px solid ${C.border}`,fontSize:13,fontWeight:700,color:C.text }}>{title}</div>
    <div style={{ padding:"20px" }}>{children}</div>
  </div>
);


// ─── Statuses Section (Settings → Statuses, Super Admin) ─────────────────────
// Lets the Super Admin define Lifecycle Stages and the Stage Statuses under them,
// plus each status's control mode (system/user/hybrid), trigger and automation
// flags. The not-reached threshold is configurable here too.
