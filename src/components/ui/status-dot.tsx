import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";

export const StatusDot = ({ color }) => (
  <span style={{ display:"inline-block",width:8,height:8,borderRadius:"50%",background:color,boxShadow:`0 0 0 3px ${color}30`,flexShrink:0 }} />
);
