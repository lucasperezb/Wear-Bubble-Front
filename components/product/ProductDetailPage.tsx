"use client";

import { ArrowLeft, Check, Minus, Plus, RefreshCw, ShoppingBag, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Product, User, apiFetch, money } from "../../lib/api";
import { trackEvent, trackEventOnce } from "../../lib/analytics";
import { CartItem, readCart, writeCart } from "../../lib/cart";
import { readDemoProducts } from "../../lib/demo-store";
import { hasFinePointer } from "../../lib/pointer";
import { availableVariantSizes, sortProductSizes } from "../../lib/product-sizes";
import { pixPrice, productHasPromotion, productPrice, promotionPct } from "../../lib/pricing";
import { productImagesForColor } from "../../lib/product-images";
import { measurementFields, resolveSizeGuide } from "../../lib/size-guide";
import { CartDrawer, describeProgressiveTiers } from "../cart";
import { usePromotionSettings } from "../../lib/use-promotion-settings";
import { Footer } from "../home";
import { Header } from "../layout";
import { ProductIcon, PromoBadge, SafeImage, ShareButton, SizeGuideDialog } from "../shared";
import { productPath } from "../../lib/product-url";
import { ProductCard } from "./catalog/ProductCard";
import { RotatingSeal } from "../season";
import {
  SUMMER,
  isSummerCollection,
  productDetails,
  productHighlights,
  topNotIncluded,
} from "../../lib/season";
import { collectionSlug } from "../../lib/collections";
import { useSummerTheme } from "../../lib/use-summer-theme";

export function ProductDetailPage({ productId }: { productId: number }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [cartHydrated, setCartHydrated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [toast, setToast] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const mediaRef = useRef<HTMLDivElement>(null);
  const promotionSettings = usePromotionSettings();
  const summer = useSummerTheme();
  const progressiveTeaser = promotionSettings.progressive.enabled
    ? describeProgressiveTiers(promotionSettings.progressive)
    : "";

  useEffect(() => {
    const demo = new URLSearchParams(window.location.search).get("demo") === "1";
    setDemoMode(demo);
    void load(demo);
    setCart(readCart());
    setCartHydrated(true);
    if (!demo) apiFetch<User | null>("/auth/session").then(setUser).catch(() => null);
  }, [productId]);

  useEffect(() => {
    if (cartHydrated) writeCart(cart);
  }, [cart, cartHydrated]);

  async function load(demo: boolean) {
    setLoading(true);
    try {
      const list = demo ? readDemoProducts() : await apiFetch<Product[]>("/products");
      const found = list.find((item) => item.id === productId) || null;
      setProducts(list);
      setProduct(found);
      setActiveImage(0);
      setSuggestions(randomSuggestions(list, productId, found?.collectionName));
      if (!found) throw new Error("Esta peça não foi encontrada.");
      trackEventOnce("view", found.id);
      const canonical = productPath(found);
      if (window.location.pathname !== canonical) window.history.replaceState(null, "", `${canonical}${window.location.search}`);
      const firstColor = found.colors?.[0];
      setColor(firstColor?.n || "");
      setSize(availableVariantSizes(firstColor?.sizes || [])[0] || sortProductSizes(found.sizes)[0] || "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar a peça.");
    } finally {
      setLoading(false);
    }
  }

  const images = useMemo(() => {
    if (!product) return [];
    return productImagesForColor(product, color);
  }, [color, product]);

  const selectedColor = product?.colors?.find((item) => item.n === color);
  const availableSizes = selectedColor?.sizes?.length
    ? availableVariantSizes(selectedColor.sizes)
    : sortProductSizes(product?.sizes || []);

  function selectColor(nextColor: string) {
    setColor(nextColor);
    setActiveImage(0);
    const variant = product?.colors?.find((item) => item.n === nextColor);
    setSize(availableVariantSizes(variant?.sizes || [])[0] || sortProductSizes(product?.sizes || [])[0] || "");
  }

  function addToCart() {
    if (!product || !size || product.stock <= 0) return;
    setCart((current) => {
      const found = current.find((item) => item.pid === product.id && item.size === size && item.color === color && !item.bundle);
      if (found) return current.map((item) => item === found ? { ...item, qty: Math.min(10, item.qty + quantity) } : item);
      return [...current, { pid: product.id, size, color, qty: quantity }];
    });
    trackEvent("add", product.id);
    setToast("Peça adicionada à sacola");
    setCartOpen(true);
    window.setTimeout(() => setToast(""), 2600);
  }

  function changeQty(pid: number, itemSize: string, itemColor: string | undefined, bundle: string | null | undefined, delta: number) {
    setCart((current) => current
      .map((item) => item.pid === pid && item.size === itemSize && item.color === itemColor && item.bundle === bundle ? { ...item, qty: Math.min(10, item.qty + delta) } : item)
      .filter((item) => item.qty > 0));
  }

  function moveMedia(event: React.MouseEvent<HTMLDivElement>) {
    if (!mediaRef.current || !hasFinePointer()) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    mediaRef.current.style.transform = `translate(${x * 14}px, ${y * 14}px) scale(1.055)`;
  }

  if (loading) return <main><Header cartCount={0} /><div className="flex min-h-[70vh] items-center justify-center font-sans text-sm uppercase tracking-[.15em]">Aproximando a peça...</div></main>;
  if (!product || error) return <main><Header cartCount={cart.length} /><div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-6 text-center"><h1 className="text-3xl">Peça não encontrada</h1><p className="text-bubble-ink/60">{error}</p><a href={`/${demoMode ? "?demo=1" : ""}`} className="border border-bubble-ink px-6 py-3 font-sans text-xs uppercase">Voltar à loja</a></div></main>;

  const promo = productHasPromotion(product);
  const sizeGuide = resolveSizeGuide(product);
  const fizz = summer && isSummerCollection(product);
  const demoSuffix = demoMode ? "?demo=1" : "";
  const collectionHref = product.collectionName ? `/colecoes/${collectionSlug(product.collectionName)}${demoSuffix}` : `/produtos${demoSuffix}`;
  const highlights = summer ? productHighlights(product) : [];
  const details = productDetails(product);
  const withoutTop = topNotIncluded(product);
  const sizeSummary = size ? sizeGuide.fields.filter((field) => measurementFields[field].unit === "cm" && sizeGuide.rows[size]?.[field]).map((field) => `${measurementFields[field].label} ${sizeGuide.rows[size][field]}`) : [];
  return (
    <main>
      <Header cartCount={cart.reduce((sum, item) => sum + item.qty, 0)} onCart={() => setCartOpen(true)} onAccount={() => window.location.assign(user ? "/conta" : "/login")} />
      {demoMode ? <div className="border-b border-bubble-ink bg-bubble-candy px-4 py-3 text-center font-sans text-[.66rem] font-semibold uppercase tracking-[.1em]">Modo demonstração · página individual</div> : null}

      <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-8 sm:py-10">
        {summer ? (
          <nav aria-label="Você está em" className="mb-4 flex min-h-11 flex-wrap items-center gap-x-1.5 font-sans text-[.62rem] font-semibold uppercase tracking-[.14em] text-bubble-ink/70 sm:mb-6">
            <a href={`/${demoSuffix}`} className="hover:text-bubble-sun-dark">Início</a>
            <span aria-hidden="true">/</span>
            <a href={collectionHref} className="hover:text-bubble-sun-dark">{product.collectionName ? `Coleção ${product.collectionName}` : "Produtos"}</a>
            <span aria-hidden="true">/</span>
            <span className="text-bubble-ink">{product.name}</span>
          </nav>
        ) : (
          <a href={`/${demoMode ? "?demo=1" : ""}`} className="mb-4 inline-flex min-h-11 items-center gap-2 font-sans text-[.65rem] font-semibold uppercase tracking-[.12em] text-bubble-ink/55 hover:text-bubble-ink sm:mb-6"><ArrowLeft size={14} /> Voltar à loja</a>
        )}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,.9fr)] lg:gap-14">
          <div className="grid min-w-0 gap-3 sm:grid-cols-[76px_minmax(0,1fr)]">
            <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:flex-col">
              {(images.length ? images : [null]).map((image, index) => (
                <button key={image?.id || `empty-${index}`} type="button" onClick={() => setActiveImage(index)} className={`${activeImage === index ? (summer ? "border-bubble-sun outline outline-2 outline-bubble-sun" : "border-bubble-ink") : "border-bubble-line opacity-60"} flex aspect-[3/4] w-[68px] shrink-0 items-center justify-center overflow-hidden border bg-bubble-cream2 transition-opacity hover:opacity-100`}>
                  {image ? <SafeImage src={image.url} alt="" className="size-full object-cover" loading="lazy" decoding="async" fallback={<span className="w-1/2"><ProductIcon icon={product.icon} /></span>} /> : <span className="w-1/2"><ProductIcon icon={product.icon} /></span>}
                </button>
              ))}
            </div>
            <div onMouseMove={moveMedia} onMouseLeave={() => { if (mediaRef.current) mediaRef.current.style.transform = ""; }} className="order-1 relative flex aspect-[3/4] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_42%,#FAF6E9_0%,#EAE2CC_70%)] sm:order-2">
              <div ref={mediaRef} className="flex size-full items-center justify-center transition-transform duration-500 ease-out [@media(hover:hover)]:will-change-transform [&_svg]:w-[44%] [&_svg]:opacity-90">
                {images[activeImage] ? <SafeImage src={images[activeImage].url} alt={images[activeImage].altText || product.name} className="size-full object-cover" fetchPriority="high" decoding="async" fallback={<ProductIcon icon={product.icon} />} /> : <ProductIcon icon={product.icon} />}
              </div>
              {fizz ? <RotatingSeal className="absolute right-3 top-3 z-10 size-[86px] sm:size-[104px]" /> : null}
              <span className="absolute bottom-5 left-5 hidden rounded-full bg-bubble-white/90 px-3 py-2 font-sans text-[.56rem] uppercase tracking-[.12em] text-bubble-ink/60 [@media(hover:hover)]:block"><Sparkles className="mr-1 inline size-3" /> Mova para aproximar</span>
            </div>
          </div>

          <section className="self-start lg:sticky lg:top-[100px]">
            {summer ? (
              <span className="inline-block bg-bubble-sun px-2.5 py-1 font-sans text-[.6rem] font-bold uppercase tracking-[.14em]">
                {fizz ? `Novo · Coleção ${SUMMER.collectionName}` : `${product.collectionName || "Wear Bubble"} · ${product.sub}`}
              </span>
            ) : (
              <div className="font-sans text-[.64rem] font-semibold uppercase tracking-[.2em] text-bubble-brown">{product.collectionName || "Wear Bubble"} · {product.sub}</div>
            )}
            <div className="mt-3 flex items-start justify-between gap-4"><h1 className="text-[clamp(2.1rem,4vw,3.8rem)] leading-[.98]">{product.name}</h1><ShareButton url={`${typeof window === "undefined" ? "" : window.location.origin}${productPath(product)}`} title={product.name} image={images[0]?.url} /></div>
            <div className={`${summer ? "hidden" : "flex"} mt-5 items-center gap-3 border-b border-bubble-line pb-5 text-[.76rem] text-bubble-ink/55`}><span className="text-bubble-brown">{"★".repeat(Math.round(product.rating))}</span><span>{product.rating.toFixed(1)} · {product.reviews} avaliações</span></div>
            <div className="mt-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  {promo ? <div className="text-sm text-bubble-ink/40 line-through">{money.format(product.price)}</div> : null}
                  <div className={summer ? "font-sans text-[1.6rem] font-semibold" : "font-display text-[2rem]"}>{money.format(productPrice(product))}</div>
                  <div className={`mt-1 text-sm font-semibold ${summer ? "text-bubble-ink" : "text-bubble-success"}`}>{money.format(pixPrice(product))} no Pix</div>
                  {promo ? <span className="mt-2 inline-block bg-bubble-success/10 px-2 py-1 font-sans text-[.62rem] font-bold uppercase tracking-[.08em] text-bubble-success">Você economiza {money.format(product.price - productPrice(product))}</span> : null}
                </div>
                {promo ? <div className="shrink-0 pr-2 pt-1"><PromoBadge pct={promotionPct(product)} variant="inline" /></div> : null}
              </div>
              {summer && product.desc ? <p className="m-0 mt-5 text-[.98rem] leading-[1.65] text-bubble-ink/80">{product.desc}</p> : null}
              {highlights.length ? (
                <ul className="m-0 mt-5 flex list-none flex-wrap gap-2 p-0">
                  {highlights.map((item) => (
                    <li key={item} className="inline-flex items-center gap-2 rounded-full border border-bubble-ink px-3 py-1.5 font-sans text-[.6rem] font-semibold uppercase tracking-[.12em]">
                      <span className="size-2 rounded-full border border-bubble-ink bg-bubble-sun" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
              {progressiveTeaser ? <div className="mt-3 border-l-2 border-bubble-brown pl-3 text-[.72rem] leading-relaxed text-bubble-ink/70"><span className="font-sans text-[.58rem] font-bold uppercase tracking-[.14em] text-bubble-brown">Leve mais, pague menos</span><br />{progressiveTeaser}</div> : null}
            </div>

            {product.colors?.length ? <div className="mt-8"><div className="mb-3 font-sans text-[.68rem] font-semibold uppercase tracking-[.12em]">{summer ? <>Cor: {color}</> : <>Cor · <span className="text-bubble-ink/55">{color}</span></>}</div><div className="flex flex-wrap gap-2">{product.colors.map((item) => <button key={item.n} type="button" aria-label={`Selecionar cor ${item.n}`} onClick={() => selectColor(item.n)} className={`${color === item.n ? "ring-2 ring-bubble-ink ring-offset-2 ring-offset-bubble-cream" : ""} size-9 rounded-full border border-bubble-ink/30`} style={{ backgroundColor: item.h }} />)}</div></div> : null}

            <div className="mt-7"><div className="mb-3 flex items-center justify-between font-sans text-[.68rem] font-semibold uppercase tracking-[.12em]"><span>Tamanho</span><button type="button" onClick={() => setSizeGuideOpen(true)} className="-my-2 border-0 bg-transparent px-1 py-2 font-sans text-[.7rem] font-semibold normal-case tracking-normal text-bubble-brown underline underline-offset-4 transition-colors hover:text-bubble-ink">{summer ? "Tabela de medidas" : "Guia de medidas"}</button></div><div className="grid grid-cols-4 gap-2">{sortProductSizes(product.sizes).map((item) => { const available = availableSizes.includes(item); return <button key={item} type="button" disabled={!available} onClick={() => setSize(item)} className={`${size === item ? "bg-bubble-ink text-bubble-cream" : "bg-transparent text-bubble-ink"} border border-bubble-ink py-3 font-sans text-[.68rem] font-semibold uppercase disabled:cursor-not-allowed disabled:border-bubble-line disabled:text-bubble-ink/25`}>{item}</button>; })}</div></div>

            {summer ? (
              <div className="mt-8 grid gap-3">
                <button type="button" onClick={addToCart} disabled={!size || product.stock <= 0} className="flex min-h-13 items-center justify-center gap-2 bg-bubble-ink px-5 py-4 font-sans text-[.72rem] font-semibold uppercase tracking-[.14em] text-bubble-cream transition-colors hover:bg-bubble-brown disabled:opacity-40">{product.stock > 0 ? "Adicionar à sacola" : "Esgotado"}</button>
                <a href={`/${demoSuffix}#conjunto`} className="flex min-h-12 items-center justify-center border border-bubble-ink bg-bubble-peach px-5 py-3.5 font-sans text-[.7rem] font-semibold uppercase tracking-[.14em] transition-colors hover:bg-bubble-sun">Montar conjunto com 5% OFF</a>
                {withoutTop ? <p className="m-0 font-serif text-[.8rem] italic text-bubble-ink/60">Vendido sem o top das fotos.</p> : null}
              </div>
            ) : (
            <div className="mt-8 grid grid-cols-[112px_1fr] gap-2 max-[380px]:grid-cols-1"><div className="grid min-h-12 grid-cols-3 border border-bubble-ink"><button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Diminuir quantidade" className="flex items-center justify-center"><Minus size={14} /></button><span className="flex items-center justify-center font-sans text-sm">{quantity}</span><button type="button" onClick={() => setQuantity((value) => Math.min(10, value + 1))} aria-label="Aumentar quantidade" className="flex items-center justify-center"><Plus size={14} /></button></div><button type="button" onClick={addToCart} disabled={!size || product.stock <= 0} className="flex items-center justify-center gap-2 bg-bubble-ink px-5 py-4 font-sans text-[.72rem] font-semibold uppercase tracking-[.12em] text-bubble-cream transition-colors hover:bg-bubble-brown disabled:opacity-40"><ShoppingBag size={17} /> {product.stock > 0 ? "Adicionar à sacola" : "Esgotado"}</button></div>
            )}
            {summer ? (
              <div className="mt-7 border-t border-bubble-ink">
                <ProductInfo title="Detalhes" open>
                  {details.length ? (
                    <ul className="m-0 list-disc pl-5">{details.map((item) => <li key={item}>{item}</li>)}</ul>
                  ) : (
                    <p className="m-0">{product.sub}{product.sizes?.length ? ` · tamanhos ${sortProductSizes(product.sizes).join(", ")}` : ""}.</p>
                  )}
                </ProductInfo>
                <ProductInfo title="Tecido">
                  <p className="m-0">{product.material || "Composição informada na etiqueta da peça."}</p>
                </ProductInfo>
                <ProductInfo title="Medidas">
                  {sizeSummary.length ? <p className="m-0">Tam. {size}: {sizeSummary.join(" · ")} cm.</p> : null}
                  <button type="button" onClick={() => setSizeGuideOpen(true)} className="mt-1 border-0 bg-transparent p-0 font-serif text-[.88rem] text-bubble-ink underline underline-offset-4 hover:text-bubble-sun-dark">Ver a tabela de medidas completa</button>
                </ProductInfo>
                <ProductInfo title="Trocas e envio">
                  <p className="m-0">Troca em até 30 dias. Prazo e valor do frete calculados na sacola pelo seu CEP.</p>
                </ProductInfo>
              </div>
            ) : (
              <>
                <div className="mt-4 flex items-center gap-2 text-[.72rem] text-bubble-ink/55"><Check size={14} /> Troca garantida em até 30 dias</div>
                {sizeSummary.length ? <div className="mt-2 text-[.68rem] text-bubble-ink/45">Tam. {size} · {sizeSummary.join(" · ")} cm</div> : null}
              </>
            )}
          </section>
        </div>
      </div>

      {suggestions.length ? (
        <section className="px-4 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-[1200px]">
            <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
              <div>
                {summer ? (
                  <h2 className="flex items-center gap-3 text-[clamp(1.8rem,4vw,2.6rem)]">
                    <span className="size-2.5 rounded-full bg-bubble-sun" aria-hidden="true" />
                    Complete o <span className="wb-marca">look</span>
                  </h2>
                ) : (
                  <>
                    <span className="font-sans text-[.65rem] font-semibold uppercase tracking-[.22em] text-bubble-brown">Descubra seu próximo look</span>
                    <h2 className="mt-2 text-[clamp(2rem,5vw,4rem)]">Combine com</h2>
                    <p className="mt-3 max-w-[520px] text-sm italic leading-relaxed text-bubble-ink/60">Uma seleção surpresa da Bubble para explorar novas combinações.</p>
                  </>
                )}
              </div>
              {summer ? null : <button type="button" onClick={() => setSuggestions(randomSuggestions(products, product.id, product.collectionName))} className="flex items-center gap-2 border border-bubble-ink bg-transparent px-4 py-3 font-sans text-[.62rem] font-semibold uppercase tracking-[.12em] transition-colors hover:bg-bubble-ink hover:text-bubble-cream">
                <RefreshCw size={14} /> Novas sugestões
              </button>}
            </div>
            <div className="grid grid-cols-4 gap-x-3 gap-y-9 max-[980px]:grid-cols-2 max-[720px]:gap-x-2 max-[720px]:gap-y-7">
              {suggestions.map((suggestion) => (
                <ProductCard
                  key={suggestion.id}
                  product={suggestion}
                  href={`${productPath(suggestion)}${demoMode ? "?demo=1" : ""}`}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}
      <Footer />
      <CartDrawer open={cartOpen} cart={cart} products={products} onQty={changeQty} onClose={() => setCartOpen(false)} />
      <SizeGuideDialog open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} product={product} selectedSize={size} />
      <div className={`fixed bottom-7 left-1/2 z-[900] -translate-x-1/2 bg-bubble-ink px-6 py-3 text-sm text-bubble-cream shadow-bubble transition-all ${toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-8 opacity-0"}`}>{toast}</div>
    </main>
  );
}

function randomSuggestions(products: Product[], currentProductId: number, collectionName?: string) {
  const pool = products.filter(
    (product) =>
      product.id !== currentProductId && product.active !== false && product.stock > 0,
  );
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[randomIndex]] = [pool[randomIndex], pool[index]];
  }
  // Peças da mesma coleção primeiro: completam o look da peça aberta.
  if (collectionName) pool.sort((a, b) => Number(b.collectionName === collectionName) - Number(a.collectionName === collectionName));
  return pool.slice(0, 4);
}

/** Bloco recolhível da página de produto (Detalhes, Tecido, Medidas…). */
function ProductInfo({ title, open = false, children }: { title: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details open={open} className="group border-b border-bubble-ink">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between font-sans text-[.68rem] font-semibold uppercase tracking-[.14em] [&::-webkit-details-marker]:hidden">
        {title}
        <span aria-hidden="true" className="text-base transition-transform group-open:rotate-45">+</span>
      </summary>
      <div className="pb-4 font-serif text-[.9rem] leading-[1.6] text-bubble-ink/80">{children}</div>
    </details>
  );
}
