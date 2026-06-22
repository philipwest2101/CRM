import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { C } from "../../theme";

export const Avatar = ({ name, size=32, color }) => {
  const initials = name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const palette  = [C.blue,C.indigo,C.green,C.amber,"#EC4899",C.purple];
  const bg       = color || palette[name.charCodeAt(0)%palette.length];
  return <div style={{ width:size,height:size,borderRadius:"50%",background:bg,color:"#fff",fontSize:size*0.36,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>{initials}</div>;
};
