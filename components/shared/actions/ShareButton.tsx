"use client";

import { Check, Link2, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Channel = "whatsapp" | "pinterest" | "facebook" | "copy";

function withUtm(url: string, channel: Channel | "native") {
  const u = new URL(url);
  u.searchParams.delete("demo");
  u.searchParams.set("utm_source", channel);
  u.searchParams.set("utm_medium", "share");
  u.searchParams.set("utm_campaign", "produto");
  return u.toString();
}

export function ShareButton({ url, title, image }: { url: string; title: string; image?: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const text = `Olha essa peça da Wear Bubble: ${title}`;

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  async function onClick() {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (coarse && navigator.share) {
      try {
        await navigator.share({ title, text, url: withUtm(url, "native") });
      } catch {
        // usuário cancelou
      }
      return;
    }
    setOpen((value) => !value);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(withUtm(url, "copy"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copie o link:", withUtm(url, "copy"));
    }
  }

  const links: { label: string; href: string }[] = [
    { label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${text} ${withUtm(url, "whatsapp")}`)}` },
    {
      label: "Pinterest",
      href: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(withUtm(url, "pinterest"))}&description=${encodeURIComponent(title)}${image ? `&media=${encodeURIComponent(image)}` : ""}`,
    },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(withUtm(url, "facebook"))}` },
  ];

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={onClick}
        aria-label="Compartilhar peça"
        aria-expanded={open}
        className="grid size-11 place-items-center rounded-full border border-bubble-line text-bubble-ink transition hover:border-bubble-ink"
      >
        <Share2 className="size-4" />
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 top-[calc(100%+8px)] z-50 w-52 border border-bubble-line bg-bubble-white py-2 font-sans text-sm shadow-bubble">
          {links.map((link) => (
            <a key={link.label} role="menuitem" href={link.href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="block px-4 py-2 hover:bg-bubble-cream">
              {link.label}
            </a>
          ))}
          <button type="button" role="menuitem" onClick={copy} className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-bubble-cream">
            {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
            {copied ? "Link copiado!" : "Copiar link"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
