type PromoBadgeProps = {
  pct: number;
  /** "card" fica sobreposto no canto da imagem; "inline" entra no fluxo ao lado do preço. */
  variant?: "card" | "inline";
};

/** Selo redondo e torcido de desconto, estilo etiqueta colada na peça. */
export function PromoBadge({ pct, variant = "card" }: PromoBadgeProps) {
  const position =
    variant === "card"
      ? "absolute right-3 top-3 z-[2] size-12 max-[520px]:right-2 max-[520px]:top-2 max-[520px]:size-11"
      : "size-14";
  return (
    <span
      className={`${position} flex rotate-[10deg] items-center justify-center rounded-full bg-bubble-ink font-display text-[.78rem] leading-none text-bubble-cream shadow-[0_6px_16px_rgba(23,19,14,.25)] ring-1 ring-bubble-cream/40 ring-offset-1 ring-offset-bubble-ink`}
      aria-label={`${pct}% de desconto`}
    >
      −{pct}%
    </span>
  );
}
