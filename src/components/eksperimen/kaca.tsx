import type {
  ButtonHTMLAttributes,
  CSSProperties,
  HTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

// Glass is a deliberate accent for bars, toolbars, and selected floating
// context. Solid tokenized surfaces remain the default for content cards.

const FILTER_KACA: CSSProperties = {
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
};

const GAYA_SPEKULAR: CSSProperties = {
  boxShadow:
    "inset 0 1px 0 rgba(255, 255, 255, 0.35), inset 0 -1px 0 rgba(255, 255, 255, 0.08)",
};

type KacaBarProps = HTMLAttributes<HTMLElement> & {
  as?: "header" | "div";
};

export function KacaBar({
  as = "div",
  className,
  style,
  ...props
}: KacaBarProps) {
  const Tag = as as "div";
  return (
    <Tag
      style={{ ...FILTER_KACA, ...style }}
      className={cn(
        "sticky top-0 z-[900] border-b border-ap-hairline bg-ap-panel/85 text-ap-ink",
        "dark:border-white/15 dark:bg-ap-panel/85",
        "motion-reduce:transition-none",
        className
      )}
      {...props}
    />
  );
}

type KacaKartuProps = HTMLAttributes<HTMLDivElement> & {
  glass?: boolean;
};

export function KacaKartu({
  className,
  style,
  glass = false,
  ...props
}: KacaKartuProps) {
  return (
    <div
      style={{
        ...(glass ? FILTER_KACA : {}),
        ...(glass ? GAYA_SPEKULAR : {}),
        ...style,
      }}
      className={cn(
        "rounded-[18px] border border-ap-hairline bg-ap-panel text-ap-ink",
        glass &&
          "border-white/40 bg-white/60 dark:border-white/15 dark:bg-ap-tile2/80",
        "motion-reduce:transition-none",
        className
      )}
      {...props}
    />
  );
}

type KacaPillProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  berkilau?: boolean;
};

export function KacaPill({
  berkilau = false,
  className,
  style,
  children,
  ...props
}: KacaPillProps) {
  return (
    <button
      style={{ ...FILTER_KACA, ...(berkilau ? GAYA_SPEKULAR : {}), ...style }}
      className={cn(
        "relative inline-flex min-h-[44px] items-center justify-center gap-2 overflow-hidden rounded-full",
        "border border-ap-hairline bg-ap-panel/80 px-5 py-2.5 text-sm font-semibold text-ap-ink",
        "transition-[transform,background-color,border-color,box-shadow,color,opacity] duration-200 ease-out",
        "hover:bg-ap-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus",
        "active:scale-[0.95] disabled:pointer-events-none disabled:opacity-50",
        "dark:border-white/15 dark:bg-ap-tile2/80 dark:text-ap-ink dark:hover:bg-ap-tile2",
        "motion-reduce:transition-none motion-reduce:active:scale-100",
        className
      )}
      {...props}
    >
      {berkilau ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/30 via-transparent to-transparent opacity-60 motion-reduce:hidden"
        />
      ) : null}
      <span className="relative">{children}</span>
    </button>
  );
}
