export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="shrink-0">
      <rect width="32" height="32" rx="7" className="fill-primary" />
      <path d="M6 12.5h20V24a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z" className="fill-on-primary" />
      <path d="M6 6.5h20v4H6z" className="fill-on-primary" />
      <path d="M10.5 6.5h4l-2.6 4h-4zM18.5 6.5h4l-2.6 4h-4z" className="fill-primary" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <Logo />
      <span className="text-[15px] font-semibold tracking-[-0.02em]">StudioFlow</span>
    </span>
  );
}
