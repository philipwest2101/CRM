import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { C } from "../../theme";

export const Card = ({ children, style={}, onClick }) => (
  <div onClick={onClick} style={{ background:"#fff",borderRadius:12,border:`1px solid ${C.border}`,cursor:onClick?"pointer":"default",...style }}>{children}</div>
);
