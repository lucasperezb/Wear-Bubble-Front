"use client";

import {
  ChevronDown,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  PackageCheck,
  RotateCcw,
  ShoppingBag,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { apiFetch, type User } from "../../../lib/api";
import { collectionSlug } from "../../../lib/collections";
import { readDemoProducts } from "../../../lib/demo-store";

type HeaderProps = {
  cartCount: number;
  onCart?: () => void;
  onAccount?: () => void;
};

const shopTopics = [
  {
    label: "Tops & blusas",
    description: "Suporte para acompanhar seu ritmo",
    category: "Blusas/Top",
    href: "/produtos/tops",
    number: "01",
  },
  {
    label: "Shorts & calças",
    description: "Liberdade em cada movimento",
    category: "Shorts/Calça",
    href: "/produtos/shorts-calcas",
    number: "02",
  },
  {
    label: "Conjuntos",
    description: "Looks prontos para ir mais longe",
    category: "Conjunto",
    href: "/produtos/conjuntos",
    number: "03",
  },
];

const brandTopics = [
  {
    label: "Manifesto Bubble",
    description: "A força por trás da marca",
    href: "/a-bubble/manifesto",
    number: "01",
  },
  {
    label: "Nossa história",
    description: "Feita para mulheres em movimento",
    href: "/a-bubble/nossa-historia",
    number: "02",
  },
  {
    label: "Fale com a gente",
    description: "Estamos por perto para ajudar",
    href: "/contato",
    number: "03",
  },
];

export function Header({
  cartCount,
  onCart = () => window.location.assign("/carrinho"),
  onAccount = () => window.location.assign("/login"),
}: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collections, setCollections] = useState<string[]>(["Core"]);
  const [demoMode, setDemoMode] = useState(false);
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadCollections = () => {
      const search = new URLSearchParams(window.location.search);
      const demo = search.get("demo") === "1" || search.get("admin") === "demo";
      setDemoMode(demo);
      if (demo) {
        setSessionUser({
          uid: "demo-manager",
          email: "gerente@demo.local",
          role: "manager",
          name: "Gerente Demo",
          emailVerified: true,
        });
        const names = Array.from(new Set(readDemoProducts().map((product) => product.collectionName?.trim()).filter((name): name is string => Boolean(name))));
        setCollections(names.length ? names.sort((a, b) => a.localeCompare(b, "pt-BR")) : ["Core"]);
        return;
      }
      apiFetch<User | null>("/auth/session")
        .then(setSessionUser)
        .catch(() => setSessionUser(null));
      apiFetch<string[]>("/products/collections")
        .then((names) => setCollections(names.length ? names : ["Core"]))
        .catch(() => undefined);
    };
    loadCollections();
    window.addEventListener("bubble-demo-products-changed", loadCollections);
    return () => window.removeEventListener("bubble-demo-products-changed", loadCollections);
  }, []);

  const collectionTopics = collections.map((name) => ({
    label: name,
    description: `Conheça todas as peças da coleção ${name}`,
    eyebrow: "Coleção Bubble",
    href: `/colecoes/${collectionSlug(name)}`,
  }));

  useEffect(() => {
    if (!mobileOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileOpen]);

  useEffect(() => {
    if (!accountMenuOpen) return;
    const closeOnPointerDown = (event: PointerEvent) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      )
        setAccountMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeOnPointerDown);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [accountMenuOpen]);

  async function logout() {
    setAccountMenuOpen(false);
    await apiFetch("/auth/logout", { method: "POST" }).catch(() => undefined);
    setSessionUser(null);
    window.location.assign("/");
  }

  return (
    <>
      <div className="bg-bubble-ink px-4 py-[9px] text-center font-sans text-[.72rem] font-medium uppercase tracking-[.14em] text-bubble-cream [&_b]:font-bold">
        FRETE GRÁTIS A PARTIR DE R$ 199 · <b>5% OFF</b> NO PIX
      </div>
      <header className="sticky top-0 z-[200] border-b border-bubble-ink bg-bubble-cream/95 backdrop-blur-[10px]">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-5 px-8 py-[15px] max-[520px]:px-4">
          <a
            href={demoMode ? "/?demo=1" : "/"}
            className="flex cursor-pointer items-center gap-[11px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bubble-ink"
            aria-label="Wear Bubble — início"
            onClick={() => setMobileOpen(false)}
          >
            <span className="flex flex-col leading-[.82]">
              <span className="ml-px font-serif text-[.74rem] italic tracking-[.02em] text-bubble-ink">
                wear
              </span>
              <span className="font-display text-[1.35rem] uppercase leading-none text-bubble-ink">
                BUBBLE
              </span>
            </span>
          </a>

          <nav
            className="flex h-[38px] items-center gap-1 font-sans text-[.76rem] font-medium uppercase tracking-[.08em] max-[980px]:hidden"
            aria-label="Navegação principal"
          >
            <DesktopMenu label="Coleções">
              <div className="grid grid-cols-2 gap-px bg-bubble-ink/20">
                {collectionTopics.map((topic) => (
                  <a
                    key={topic.label}
                    href={`${topic.href}${demoMode ? "?demo=1" : ""}`}
                    className="group/topic min-h-[168px] cursor-pointer border-0 bg-bubble-ink p-6 text-left text-bubble-cream transition-colors hover:bg-bubble-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-5px] focus-visible:outline-bubble-cream"
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="font-sans text-[.58rem] font-semibold uppercase tracking-[.2em] text-bubble-cream/60">
                      {topic.eyebrow}
                    </span>
                    <strong className="mt-5 block font-display text-[1.75rem] uppercase leading-none">
                      {topic.label}
                    </strong>
                    <span className="mt-3 block max-w-[230px] font-serif text-[.76rem] normal-case leading-relaxed tracking-normal text-bubble-cream/70">
                      {topic.description}
                    </span>
                    <span className="mt-5 inline-block font-sans text-[.62rem] uppercase tracking-[.14em] transition-transform group-hover/topic:translate-x-1">
                      Conhecer →
                    </span>
                  </a>
                ))}
                <a
                  href="/produtos"
                  className="flex cursor-pointer flex-col items-start justify-between border-0 bg-bubble-cream p-6 text-left text-bubble-ink transition-colors hover:bg-bubble-candy"
                >
                  <span className="flex size-8 items-center justify-center rounded-full border border-bubble-ink/35 font-sans text-[.58rem]">
                    ALL
                  </span>
                  <span>
                    <strong className="block font-display text-[.82rem] uppercase">
                      Todas as peças
                    </strong>
                    <span className="mt-2 block font-serif text-[.7rem] normal-case leading-snug text-bubble-ink/55">
                      Explore a seleção completa
                    </span>
                  </span>
                </a>
              </div>
            </DesktopMenu>

            <DesktopMenu label="Comprar">
              <div className="grid grid-cols-3 gap-px bg-bubble-ink/20">
                {shopTopics.map((topic) => (
                  <a
                    key={topic.category}
                    href={topic.href}
                    className="group/topic min-h-[154px] cursor-pointer border-0 bg-bubble-white p-5 text-left text-bubble-ink transition-colors hover:bg-bubble-candy focus-visible:bg-bubble-candy focus-visible:outline-none"
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="flex size-7 items-center justify-center rounded-full border border-bubble-ink/35 font-sans text-[.58rem] tracking-[.08em] transition-colors group-hover/topic:bg-bubble-ink group-hover/topic:text-bubble-cream">
                      {topic.number}
                    </span>
                    <strong className="mt-5 block font-display text-[.9rem] uppercase leading-tight">
                      {topic.label}
                    </strong>
                    <span className="mt-2 block font-serif text-[.72rem] normal-case leading-snug tracking-normal text-bubble-ink/60">
                      {topic.description}
                    </span>
                  </a>
                ))}
              </div>
              <a
                href="/produtos"
                className="flex w-full cursor-pointer items-center justify-between border-0 border-t border-bubble-ink bg-bubble-cream px-5 py-3.5 font-sans text-[.66rem] font-semibold uppercase tracking-[.14em] text-bubble-ink transition-colors hover:bg-bubble-ink hover:text-bubble-cream"
              >
                Ver a coleção completa <span aria-hidden="true">→</span>
              </a>
            </DesktopMenu>

            <a
              href="/#conjunto"
              className="relative flex h-full items-center px-3 after:absolute after:bottom-0 after:left-3 after:h-px after:w-0 after:bg-bubble-ink after:transition-[width] hover:after:w-[calc(100%-1.5rem)]"
            >
              Monte seu look
              <span className="ml-2 rounded-full bg-bubble-ink px-2 py-0.5 text-[.52rem] tracking-[.08em] text-bubble-cream">
                −5%
              </span>
            </a>

            <DesktopMenu label="A Bubble" align="right">
              <div className="bg-bubble-white p-2">
                {brandTopics.map((topic) => (
                  <a
                    key={topic.href}
                    href={topic.href}
                    className="group/topic grid grid-cols-[32px_1fr_auto] items-center gap-3 border-b border-bubble-ink/15 px-3 py-3.5 normal-case last:border-0 hover:bg-bubble-cream"
                  >
                    <span className="font-sans text-[.58rem] tracking-[.12em] text-bubble-ink/45">
                      {topic.number}
                    </span>
                    <span>
                      <strong className="block font-display text-[.76rem] uppercase tracking-[.04em]">
                        {topic.label}
                      </strong>
                      <span className="mt-1 block font-serif text-[.7rem] tracking-normal text-bubble-ink/55">
                        {topic.description}
                      </span>
                    </span>
                    <span className="transition-transform group-hover/topic:translate-x-1" aria-hidden="true">
                      →
                    </span>
                  </a>
                ))}
              </div>
            </DesktopMenu>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-3.5">
            <div
              className="relative"
              ref={accountMenuRef}
              onMouseEnter={() => setAccountMenuOpen(true)}
              onMouseLeave={() => setAccountMenuOpen(false)}
            >
              <button
                type="button"
                className={`relative flex size-[38px] cursor-pointer items-center justify-center border bg-transparent text-bubble-ink transition-colors [&_svg]:size-5 ${accountMenuOpen ? "border-bubble-ink bg-bubble-white" : "border-transparent"}`}
                aria-label="Abrir atividades da conta"
                title="Minha conta"
                aria-haspopup="menu"
                aria-expanded={accountMenuOpen}
                aria-controls="account-activities-menu"
                onClick={() => {
                  setMobileOpen(false);
                  setAccountMenuOpen((current) => !current);
                }}
              >
                <UserRound />
              </button>
              {accountMenuOpen ? (
                <div
                  id="account-activities-menu"
                  role="menu"
                  className="absolute right-0 top-[calc(100%+12px)] z-50 w-[310px] border border-bubble-ink bg-bubble-white p-2 text-bubble-ink shadow-bubble before:absolute before:-top-[13px] before:inset-x-0 before:h-[13px] before:content-['']"
                >
                  <div className="border-b border-bubble-line px-3 pb-3 pt-2">
                    <span className="font-sans text-[.56rem] font-bold uppercase tracking-[.16em] text-bubble-brown">
                      {demoMode
                        ? "Modo demonstração"
                        : sessionUser
                          ? "Sua conta Bubble"
                          : "Bem-vinda à Bubble"}
                    </span>
                    <strong className="mt-1 block truncate font-serif text-[.86rem]">
                      {sessionUser?.name || sessionUser?.email || "O que você deseja fazer?"}
                    </strong>
                  </div>

                  {demoMode ? (
                    <div className="py-1">
                      <AccountMenuLink
                        href="/?admin=demo"
                        icon={<LayoutDashboard />}
                        label="Abrir painel"
                        description="Gerencie a vitrine demonstrativa"
                        onNavigate={() => setAccountMenuOpen(false)}
                      />
                      <AccountMenuLink
                        href="/produtos?demo=1"
                        icon={<ShoppingBag />}
                        label="Ver todas as peças"
                        description="Explore o catálogo completo"
                        onNavigate={() => setAccountMenuOpen(false)}
                      />
                      <AccountMenuLink
                        href="/?demo=1#conjunto"
                        icon={<PackageCheck />}
                        label="Montar conjunto"
                        description="Combine duas peças com desconto"
                        onNavigate={() => setAccountMenuOpen(false)}
                      />
                    </div>
                  ) : sessionUser ? (
                    <div className="py-1">
                      <AccountMenuLink
                        href="/conta?tab=orders"
                        icon={<PackageCheck />}
                        label="Meus pedidos"
                        description="Acompanhe compras e entregas"
                        onNavigate={() => setAccountMenuOpen(false)}
                      />
                      <AccountMenuLink
                        href="/conta?tab=returns"
                        icon={<RotateCcw />}
                        label="Trocas e devoluções"
                        description="Solicite e acompanhe atendimentos"
                        onNavigate={() => setAccountMenuOpen(false)}
                      />
                      <AccountMenuLink
                        href="/conta?tab=addresses"
                        icon={<MapPin />}
                        label="Meus endereços"
                        description="Gerencie seus locais de entrega"
                        onNavigate={() => setAccountMenuOpen(false)}
                      />
                      <AccountMenuLink
                        href="/conta?tab=profile"
                        icon={<UserRound />}
                        label="Meus dados"
                        description="Atualize suas informações pessoais"
                        onNavigate={() => setAccountMenuOpen(false)}
                      />
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full items-center gap-3 border-t border-bubble-line px-3 py-3 text-left text-bubble-danger transition-colors hover:bg-bubble-cream"
                        onClick={() => void logout()}
                      >
                        <LogOut className="size-4 shrink-0" />
                        <span className="font-sans text-[.65rem] font-semibold uppercase tracking-[.08em]">
                          Sair da conta
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div className="py-1">
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-bubble-cream"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          onAccount();
                        }}
                      >
                        <LogIn className="size-4 shrink-0" />
                        <span>
                          <strong className="block font-sans text-[.65rem] uppercase tracking-[.08em]">
                            Entrar
                          </strong>
                          <span className="mt-0.5 block text-[.68rem] text-bubble-ink/55">
                            Acesse pedidos e dados da conta
                          </span>
                        </span>
                      </button>
                      <AccountMenuLink
                        href="/cadastro"
                        icon={<UserPlus />}
                        label="Criar uma conta"
                        description="Agilize suas próximas compras"
                        onNavigate={() => setAccountMenuOpen(false)}
                      />
                      <AccountMenuLink
                        href="/produtos"
                        icon={<ShoppingBag />}
                        label="Ver todas as peças"
                        description="Explore o catálogo completo"
                        onNavigate={() => setAccountMenuOpen(false)}
                      />
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="relative flex size-[38px] cursor-pointer items-center justify-center border-0 bg-transparent text-bubble-ink [&_svg]:size-5"
              aria-label={`Sacola${cartCount ? `, ${cartCount} item${cartCount === 1 ? "" : "s"}` : " vazia"}`}
              title="Sacola"
              onClick={onCart}
            >
              <ShoppingBag />
              <span
                className={`${cartCount ? "flex" : "hidden"} absolute right-0 top-0 size-4 items-center justify-center rounded-full bg-bubble-ink text-[.62rem] font-bold text-bubble-white`}
              >
                {cartCount}
              </span>
            </button>
            <button
              type="button"
              className="hidden size-[38px] cursor-pointer items-center justify-center border border-bubble-ink bg-transparent text-bubble-ink max-[980px]:flex"
              aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={mobileOpen}
              onClick={() => {
                setAccountMenuOpen(false);
                setMobileOpen((current) => !current);
              }}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="absolute inset-x-0 top-full max-h-[calc(100vh-96px)] overflow-y-auto border-b border-bubble-ink bg-bubble-cream shadow-bubble min-[981px]:hidden">
            <nav className="mx-auto max-w-[720px] px-4 pb-6 pt-3" aria-label="Navegação mobile">
              <details className="group border-b border-bubble-ink/25">
                <summary className="flex cursor-pointer list-none items-center justify-between px-1 py-4 font-display text-lg uppercase [&::-webkit-details-marker]:hidden">
                  Coleções
                  <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                </summary>
                <div className="grid gap-2 pb-4 sm:grid-cols-2">
                  {collectionTopics.map((topic) => (
                    <a
                      key={topic.label}
                      href={`${topic.href}${demoMode ? "?demo=1" : ""}`}
                      onClick={() => setMobileOpen(false)}
                      className="border border-bubble-ink bg-bubble-ink p-4 text-left text-bubble-cream"
                    >
                      <span className="font-sans text-[.56rem] uppercase tracking-[.16em] text-bubble-cream/55">
                        {topic.eyebrow}
                      </span>
                      <strong className="mt-3 block font-display text-xl uppercase">
                        {topic.label}
                      </strong>
                      <span className="mt-2 block text-[.72rem] leading-relaxed text-bubble-cream/70">
                        {topic.description}
                      </span>
                    </a>
                  ))}
                  <a
                    href="/produtos"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between border border-bubble-ink/25 bg-bubble-white p-4 text-left font-display text-[.78rem] uppercase text-bubble-ink"
                  >
                    Todas as peças <span aria-hidden="true">→</span>
                  </a>
                </div>
              </details>

              <details className="group border-b border-bubble-ink/25">
                <summary className="flex cursor-pointer list-none items-center justify-between px-1 py-4 font-display text-lg uppercase [&::-webkit-details-marker]:hidden">
                  Comprar
                  <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                </summary>
                <div className="grid gap-2 pb-4 sm:grid-cols-3">
                  {shopTopics.map((topic) => (
                    <a
                      key={topic.category}
                      href={topic.href}
                      className="grid grid-cols-[28px_1fr] gap-3 border border-bubble-ink/25 bg-bubble-white p-3 text-left"
                      onClick={() => setMobileOpen(false)}
                    >
                      <span className="flex size-7 items-center justify-center rounded-full border border-bubble-ink/30 font-sans text-[.56rem]">
                        {topic.number}
                      </span>
                      <span>
                        <strong className="block font-display text-[.72rem] uppercase">
                          {topic.label}
                        </strong>
                        <span className="mt-1 block text-[.7rem] leading-snug text-bubble-ink/55">
                          {topic.description}
                        </span>
                      </span>
                    </a>
                  ))}
                </div>
              </details>

              <a
                href="/#conjunto"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between border-b border-bubble-ink/25 px-1 py-4 font-display text-lg uppercase"
              >
                Monte seu look
                <span className="rounded-full bg-bubble-ink px-2.5 py-1 font-sans text-[.56rem] tracking-[.1em] text-bubble-cream">
                  5% OFF
                </span>
              </a>

              <details className="group border-b border-bubble-ink/25">
                <summary className="flex cursor-pointer list-none items-center justify-between px-1 py-4 font-display text-lg uppercase [&::-webkit-details-marker]:hidden">
                  A Bubble
                  <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                </summary>
                <div className="pb-3">
                  {brandTopics.map((topic) => (
                    <a
                      key={topic.href}
                      href={topic.href}
                      onClick={() => setMobileOpen(false)}
                      className="grid grid-cols-[28px_1fr_auto] items-center gap-3 px-2 py-3"
                    >
                      <span className="font-sans text-[.58rem] text-bubble-ink/40">{topic.number}</span>
                      <span className="font-display text-[.72rem] uppercase">{topic.label}</span>
                      <span aria-hidden="true">→</span>
                    </a>
                  ))}
                </div>
              </details>
            </nav>
          </div>
        ) : null}
      </header>
    </>
  );
}

function AccountMenuLink({
  href,
  icon,
  label,
  description,
  onNavigate,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  onNavigate: () => void;
}) {
  return (
    <a
      href={href}
      role="menuitem"
      className="flex items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-bubble-cream focus-visible:bg-bubble-cream focus-visible:outline-none"
      onClick={onNavigate}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-bubble-line [&_svg]:size-4">
        {icon}
      </span>
      <span className="min-w-0">
        <strong className="block font-sans text-[.65rem] uppercase tracking-[.08em]">
          {label}
        </strong>
        <span className="mt-0.5 block text-[.68rem] leading-snug text-bubble-ink/55">
          {description}
        </span>
      </span>
    </a>
  );
}

function DesktopMenu({
  label,
  align = "center",
  children,
}: {
  label: string;
  align?: "center" | "right";
  children: React.ReactNode;
}) {
  return (
    <div className="group/menu relative flex h-full items-center">
      <button
        type="button"
        className="relative flex h-full cursor-pointer items-center gap-1.5 border-0 bg-transparent px-3 font-sans text-[.76rem] font-medium uppercase tracking-[.08em] text-bubble-ink after:absolute after:bottom-0 after:left-3 after:h-px after:w-0 after:bg-bubble-ink after:transition-[width] group-hover/menu:after:w-[calc(100%-1.5rem)] group-focus-within/menu:after:w-[calc(100%-1.5rem)]"
        aria-haspopup="true"
      >
        {label}
        <ChevronDown className="size-3.5 transition-transform group-hover/menu:rotate-180 group-focus-within/menu:rotate-180" />
      </button>
      <div
        className={`invisible absolute top-full w-[520px] translate-y-2 border border-bubble-ink bg-bubble-white opacity-0 shadow-bubble transition-all duration-200 group-hover/menu:visible group-hover/menu:translate-y-0 group-hover/menu:opacity-100 group-focus-within/menu:visible group-focus-within/menu:translate-y-0 group-focus-within/menu:opacity-100 ${
          align === "right" ? "right-0 w-[360px]" : "left-1/2 -translate-x-1/2"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
