// Google Analytics 4 (gtag.js). The measurement ID comes from the build-time env var
// VITE_GA_MEASUREMENT_ID (repo Actions secret on Pages). Nothing loads in dev builds or
// when the ID is missing or malformed. The site has no client-side router, so the
// page_view that `gtag('config', ...)` sends on load is the only one needed.

const ID_PATTERN = /^G-[A-Z0-9]+$/;

/** Returns the trimmed ID if it looks like a GA4 measurement ID, otherwise null. */
export function gaMeasurementId(raw: string | undefined | null): string | null {
  const id = (raw ?? "").trim().toUpperCase();
  return ID_PATTERN.test(id) ? id : null;
}

type GtagWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };

/** Adds the official gtag.js snippet once. Returns true if it was added. */
export function initGoogleAnalytics(raw: string | undefined, enabled: boolean): boolean {
  const id = gaMeasurementId(raw);
  if (!enabled || !id || typeof document === "undefined") return false;
  const w = window as GtagWindow;
  if (w.gtag) return false;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);

  w.dataLayer = w.dataLayer || [];
  w.gtag = function gtag() {
    // gtag.js expects the Arguments object itself, as in Google's snippet.
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments);
  };
  w.gtag("js", new Date());
  w.gtag("config", id);
  return true;
}
