import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CRMAppV5 from "./CRMAppV5";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CRMAppV5 />
  </StrictMode>
);
