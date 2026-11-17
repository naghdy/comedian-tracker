// Microsoft Clarity (https://clarity.microsoft.com/). The project ID comes from
// VITE_CLARITY_PROJECT_ID at build time; main.tsx only calls this in
// production builds. No ID, or an ID that isn't a plain Clarity ID: nothing loads.

type ClarityFn = ((...args: unknown[]) => void) & { q?: unknown[][] };
type ClarityWindow = { clarity?: ClarityFn };

/** Clarity project IDs are short alphanumeric strings; anything else is ignored. */
export function clarityTagUrl(projectId: string | undefined): string | null {
  const id = (projectId ?? "").trim();
  if (!/^[a-z0-9]{1,32}$/i.test(id)) return null;
  return `https://www.clarity.ms/tag/${id}`;
}

/** Clarity's official tag, without the inline eval. Returns true if it was added. */
export function loadClarity(
  projectId: string | undefined,
  doc: Document = document,
  win: ClarityWindow = window as unknown as ClarityWindow,
): boolean {
  const src = clarityTagUrl(projectId);
  if (!src) return false;
  if (doc.querySelector(`script[src="${src}"]`)) return true;

  win.clarity =
    win.clarity ||
    function (...args: unknown[]) {
      const fn = win.clarity!;
      (fn.q = fn.q || []).push(args);
    };

  const tag = doc.createElement("script");
  tag.async = true;
  tag.src = src;
  doc.head.appendChild(tag);
  return true;
}
