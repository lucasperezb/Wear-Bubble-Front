"use client";

import { ImgHTMLAttributes, ReactNode, useEffect, useState } from "react";

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  /** Mostrado se a imagem falhar mesmo após nova tentativa. */
  fallback?: ReactNode;
};

/**
 * <img> com uma nova tentativa automática (falhas momentâneas de rede/CDN)
 * e um substituto caso a imagem continue indisponível.
 */
export function SafeImage({ src, fallback = null, onError, ...props }: Props) {
  const [attempt, setAttempt] = useState(0);

  useEffect(() => setAttempt(0), [src]);

  if (attempt > 1) return <>{fallback}</>;

  const current = attempt === 1 ? `${src}${src.includes("?") ? "&" : "?"}retry=1` : src;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      key={current}
      src={current}
      onError={(event) => {
        onError?.(event);
        if (attempt === 0) window.setTimeout(() => setAttempt(1), 800);
        else setAttempt(2);
      }}
    />
  );
}
