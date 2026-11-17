/**
 * The site mark: the stage mic from public/favicon.svg, without its keyline.
 * Drawn in currentColor so it takes the wordmark's ink in either theme.
 */
export function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <g
        fill="currentColor"
        transform="translate(16 16) scale(1.2) translate(-17 -16.4) rotate(35 16 17)"
      >
        <circle cx="16" cy="9.6" r="6.4" />
        <rect x="11.6" y="16.6" width="8.8" height="2.2" rx="0.6" />
        <path d="M12.3 19.6h7.4l-1.9 9.1a1.2 1.2 0 0 1-1.2 1h-1.2a1.2 1.2 0 0 1-1.2-1Z" />
      </g>
    </svg>
  );
}
