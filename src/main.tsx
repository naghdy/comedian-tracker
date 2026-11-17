import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { initGoogleAnalytics } from "./lib/analytics";
import { loadClarity } from "./lib/clarity";
import "./index.css";

initGoogleAnalytics(import.meta.env.VITE_GA_MEASUREMENT_ID, import.meta.env.PROD);
if (import.meta.env.PROD) loadClarity(import.meta.env.VITE_CLARITY_PROJECT_ID);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
