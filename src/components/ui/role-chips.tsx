import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { RULE_ROLE_OPTS } from "../../lib/core";
import { C } from "../../theme";

export const RoleChips = ({ value=[], onChange, activeColor=C.navy }) => (
  <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
    {RULE_ROLE_OPTS.map(([k,l])=>{ const on=value.includes(k); return (
      <button key={k} type="button" onClick={()=>onChange(on?value.filter(r=>r!==k):[...value,k])}
        style={{ padding:"5px 14px",borderRadius:20,border:`1.5px solid ${on?activeColor:C.border}`,background:on?activeColor:"#fff",color:on?"#fff":C.muted,fontSize:11,fontWeight:on?700:400,cursor:"pointer",fontFamily:"inherit" }}>{l}</button>
    );})}
  </div>
);

