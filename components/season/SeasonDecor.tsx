import { Percent, Sun, Waves } from "lucide-react";
import { SUMMER } from "../../lib/season";

/** Bolhas de contorno subindo (5 a 7, 10–34 px, 7–13 s). Somem com "reduzir movimento". */
const BUBBLES = [
  { left: "8%", size: 18, duration: 11, delay: 0, sun: false },
  { left: "21%", size: 30, duration: 13, delay: 2.5, sun: true },
  { left: "37%", size: 12, duration: 8, delay: 5, sun: false },
  { left: "54%", size: 24, duration: 10, delay: 1, sun: true },
  { left: "68%", size: 14, duration: 7, delay: 3.5, sun: false },
  { left: "82%", size: 34, duration: 12, delay: 6, sun: true },
  { left: "93%", size: 10, duration: 9, delay: 4, sun: false },
];

export function SummerBubbles({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {BUBBLES.map((bubble) => (
        <span
          key={bubble.left}
          className={`wb-bolha ${bubble.sun ? "wb-bolha--sol" : ""}`}
          style={{
            left: bubble.left,
            width: bubble.size,
            height: bubble.size,
            animationDuration: `${bubble.duration}s`,
            animationDelay: `${bubble.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/** Selo "Coleção Fizz · Verão 2026 · vista bubble" girando devagar. Um por página. */
export function RotatingSeal({ className = "" }: { className?: string }) {
  const text = `Coleção ${SUMMER.collectionName} · ${SUMMER.season} · vista bubble · `;
  return (
    <span
      className={`flex items-center justify-center rounded-full border border-bubble-ink bg-bubble-sun text-bubble-ink ${className || "relative"}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 120 120" className="wb-selo absolute inset-0 size-full">
        <defs>
          <path
            id="wb-selo-circulo"
            d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0"
          />
        </defs>
        <text
          fill="currentColor"
          className="font-sans"
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          <textPath href="#wb-selo-circulo" textLength="272">
            {text}
          </textPath>
        </text>
      </svg>
      <Sun className="relative size-[30%]" strokeWidth={1.6} />
    </span>
  );
}

/** Onda suave na cor do bloco de cima, no lugar de uma linha reta. */
export function Wave({
  className = "",
  flip = false,
}: {
  className?: string;
  flip?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 1440 40"
      preserveAspectRatio="none"
      className={`block h-[30px] w-full ${flip ? "rotate-180" : ""} ${className}`}
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M0 0H1440V14C1320 34 1200 34 1080 14C960 -6 840 -6 720 14C600 34 480 34 360 14C240 -6 120 -6 0 14Z"
      />
    </svg>
  );
}

export function BubblesIcon({
  className = "",
  strokeWidth = 1.8,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden="true"
    >
      <circle cx="9" cy="14" r="5" />
      <circle cx="17" cy="7" r="3" />
      <circle cx="18.5" cy="16.5" r="1.5" />
    </svg>
  );
}

const BENEFITS = [
  { label: "Peças leves pro calor", Icon: Sun },
  { label: "5% OFF no Pix", Icon: Percent },
  { label: "Conjunto com 5% OFF", Icon: BubblesIcon },
  { label: "Troca em 30 dias", Icon: Waves },
];

/** Faixa de vantagens com ícones de verão. */
export function BenefitsStrip({ className = "" }: { className?: string }) {
  return (
    <section
      aria-label="Vantagens"
      className={`border-b border-bubble-ink bg-bubble-cream-light ${className}`}
    >
      <ul className="mx-auto grid max-w-[1200px] list-none grid-cols-4 gap-4 px-8 py-5 max-[980px]:grid-cols-2 max-[520px]:px-4">
        {BENEFITS.map(({ label, Icon }) => (
          <li key={label} className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bubble-sun text-bubble-ink">
              <Icon className="size-[18px]" strokeWidth={1.8} />
            </span>
            <span className="font-sans text-[.68rem] font-semibold uppercase tracking-[.12em]">
              {label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
