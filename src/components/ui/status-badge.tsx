import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { STATUS_META } from "../../lib/core";

export const StatusBadge = ({ status }) => {
  const s = STATUS_META[status]||STATUS_META.open;
  return <span style={{ padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,color:s.color,background:s.bg,whiteSpace:"nowrap" }}>{s.label}</span>;
};
