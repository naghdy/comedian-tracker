import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { initGoogleAnalytics } from "./lib/analytics";
import "./index.css";

initGoogleAnalytics(import.meta.env.VITE_GA_MEASUREMENT_ID, import.meta.env.PROD);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
