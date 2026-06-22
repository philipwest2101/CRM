import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { C } from "../../theme";

export const SectionTitle = ({ children, action }) => (
  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
    <div style={{ fontSize:13,fontWeight:700,color:C.text }}>{children}</div>
    {action && <span style={{ fontSize:12,color:C.blue,cursor:"pointer",fontWeight:600 }}>{action}</span>}
  </div>
);
