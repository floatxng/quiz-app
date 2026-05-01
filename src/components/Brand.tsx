import { cn } from "@/lib/cn";

export function StageLight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("h-9 w-9", className)}
      aria-hidden
    >
      <defs>
        <radialGradient id="stagelight-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgb(var(--amber))" stopOpacity="0.95" />
          <stop offset="55%" stopColor="rgb(var(--amber))" stopOpacity="0.4" />
          <stop offset="100%" stopColor="rgb(var(--amber))" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill="url(#stagelight-glow)" />
      <circle
        cx="20"
        cy="20"
        r="13"
        fill="none"
        stroke="rgb(var(--bone) / 0.25)"
        strokeWidth="1"
      />
      <circle cx="20" cy="20" r="7.5" fill="rgb(var(--amber))" />
      <circle cx="17.5" cy="17.5" r="2.4" fill="rgb(var(--bone))" opacity="0.85" />
    </svg>
  );
}

export function Wordmark({
  className,
  sub,
}: {
  className?: string;
  sub?: string | null;
}) {
  return (
    <span className={cn("flex flex-col leading-none", className)}>
      <span className="display-italic text-[1.35rem] font-semibold tracking-tight">
        QuizArena
      </span>
      {sub && (
        <span className="mono mt-1 text-[0.55rem] font-semibold uppercase tracking-[0.32em] text-bone-faint">
          {sub}
        </span>
      )}
    </span>
  );
}

export function Tally({
  variant = "live",
  label,
  className,
}: {
  variant?: "live" | "off" | "ready";
  label?: string;
  className?: string;
}) {
  const dot =
    variant === "live"
      ? "tally"
      : variant === "ready"
        ? "tally-mint"
        : "tally-static";
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className={dot} aria-hidden />
      {label && (
        <span className="mono text-[0.6rem] font-semibold uppercase tracking-[0.28em]">
          {label}
        </span>
      )}
    </span>
  );
}

export function Crosshair({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={cn("h-3 w-3", className)}
      aria-hidden
    >
      <path
        d="M6 0v12M0 6h12"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="square"
      />
    </svg>
  );
}
