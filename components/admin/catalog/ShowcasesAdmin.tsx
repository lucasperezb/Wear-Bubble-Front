"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FizzLayoutConfig,
  HomeLayoutKey,
  HomeLayoutSettings,
  Product,
  ShowcaseMap,
  apiFetch,
  money,
} from "../../../lib/api";
import {
  defaultHomeLayout,
  readDemoHomeLayout,
  saveDemoHomeLayout,
  setHomeLayout,
} from "../../../lib/home-layout";
import { orderedProductImages, productImagesForColor } from "../../../lib/product-images";
import { ProductIcon } from "../../shared";
import { saveButton } from "../shared/styles";
import type { Notify } from "../shared/types";
import {
  readDemoProducts,
  readDemoShowcases,
  writeDemoShowcase,
} from "../../../lib/demo-store";

const MAX_NEWS = 10;

const layouts: Array<{ key: HomeLayoutKey; name: string; description: string }> = [
  {
    key: "padrao",
    name: "Padrão",
    description: 'O layout de sempre: "Estoure seus limites", peça de destaque e quatro peças em "Em destaque".',
  },
  {
    key: "fizz",
    name: "Coleção Fizz · Verão",
    description: 'Tema de verão: hero da coleção com selo giratório, "As novidades", "A coleção" em pêssego e rodapé laranja.',
  },
];

const label = "font-sans text-[.6rem] font-bold uppercase tracking-[.1em] text-bubble-ink/50";
const select = "mt-1.5 w-full border border-bubble-line bg-bubble-white px-3 py-2.5 font-serif text-[.8rem] normal-case tracking-normal text-bubble-ink";
const eyebrow = "font-sans text-[.6rem] font-bold uppercase tracking-[.14em] text-bubble-brown";

function thumbnail(product: Product | undefined, color = "", index = 0) {
  if (!product) return null;
  const images = color ? productImagesForColor(product, color) : orderedProductImages(product);
  return (images[index] || images[0])?.url || product.image || null;
}

function Thumb({ product, color, index, placeholder }: { product?: Product; color?: string; index?: number; placeholder: string }) {
  const url = thumbnail(product, color, index);
  return (
    <div className="flex aspect-[3/4] items-center justify-center overflow-hidden bg-bubble-white [&_img]:size-full [&_img]:object-cover [&_svg]:w-3/5">
      {url ? <img src={url} alt="" loading="lazy" decoding="async" /> : product ? <ProductIcon icon={product.icon} /> : <span className="font-display text-xl text-bubble-ink/25">{placeholder}</span>}
    </div>
  );
}

/** Miniatura de cada layout no passo 1. */
function LayoutPreview({ layout }: { layout: HomeLayoutKey }) {
  const fizz = layout === "fizz";
  return (
    <div
      className={`relative h-[140px] overflow-hidden border border-bubble-line ${fizz ? "bg-bubble-cream bg-[radial-gradient(rgba(242,163,107,.5)_1.5px,transparent_1.7px)] bg-[length:12px_12px]" : "bg-bubble-cream"}`}
      aria-hidden="true"
    >
      <div className={`h-2.5 ${fizz ? "bg-bubble-sun" : "bg-bubble-ink"}`} />
      <div className="flex gap-3 p-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <div className={`h-2 w-2/5 rounded-full border border-bubble-ink ${fizz ? "bg-bubble-sun" : ""}`} />
          <div className="h-4 w-4/5 bg-bubble-ink" />
          <div className="h-4 w-1/2 bg-bubble-ink" />
          <div className="mt-1.5 h-1 w-[90%] bg-bubble-ink/25" />
          <div className="h-1 w-[70%] bg-bubble-ink/25" />
        </div>
        <div className={`h-[92px] w-[34%] border border-bubble-ink ${fizz ? "bg-bubble-sun" : "bg-bubble-cream2"}`} />
      </div>
      <div className={`absolute inset-x-0 bottom-0 h-3 ${fizz ? "border-t border-bubble-ink bg-bubble-peach" : "bg-bubble-ink"}`} />
    </div>
  );
}

export function ShowcasesAdmin({
  notify,
  demoMode = false,
  onSaved,
}: {
  notify: Notify;
  demoMode?: boolean;
  onSaved?: () => void | Promise<void>;
}) {
  const [showcases, setShowcases] = useState<ShowcaseMap | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [layout, setLayout] = useState<HomeLayoutSettings>(defaultHomeLayout());
  const [selected, setSelected] = useState<HomeLayoutKey>("padrao");
  const [heroId, setHeroId] = useState(0);
  const [ids, setIds] = useState<number[]>([0, 0, 0, 0]);
  const [fizz, setFizz] = useState<FizzLayoutConfig>(defaultHomeLayout().fizz);
  const [showcasesLoading, setShowcasesLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [layoutLoading, setLayoutLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const loading = showcasesLoading || productsLoading || layoutLoading;
  const available = useMemo(
    () => products.filter((product) => product.active && product.stock > 0),
    [products],
  );
  const byId = (id: number | null | undefined) => available.find((product) => product.id === id);

  useEffect(() => {
    if (demoMode) {
      setShowcases(readDemoShowcases());
      setShowcasesLoading(false);
      return;
    }
    setShowcasesLoading(true);
    apiFetch<ShowcaseMap>("/products/showcases")
      .then((response) => setShowcases(response))
      .catch((error) => notify(error instanceof Error ? error.message : "Não foi possível carregar as vitrines."))
      .finally(() => setShowcasesLoading(false));
  }, [demoMode, notify]);

  useEffect(() => {
    if (demoMode) {
      setProducts(readDemoProducts());
      setProductsLoading(false);
      return;
    }
    setProductsLoading(true);
    apiFetch<Product[]>("/products/admin")
      .then((response) => setProducts(response))
      .catch((error) => notify(error instanceof Error ? error.message : "Não foi possível carregar os produtos."))
      .finally(() => setProductsLoading(false));
  }, [demoMode, notify]);

  useEffect(() => {
    const apply = (value: HomeLayoutSettings) => {
      setLayout(value);
      setSelected(value.active);
      setFizz(value.fizz);
    };
    if (demoMode) {
      apply(readDemoHomeLayout());
      setLayoutLoading(false);
      return;
    }
    setLayoutLoading(true);
    apiFetch<HomeLayoutSettings>("/home-layout")
      .then(apply)
      .catch((error) => notify(error instanceof Error ? error.message : "Não foi possível carregar o layout da página inicial."))
      .finally(() => setLayoutLoading(false));
  }, [demoMode, notify]);

  useEffect(() => {
    const chosen = showcases?.home?.map((product) => product.id) || [];
    setIds([...chosen, 0, 0, 0, 0].slice(0, 4));
    setHeroId(showcases?.hero?.[0]?.id || 0);
  }, [showcases]);

  function updateFizz(patch: Partial<FizzLayoutConfig>) {
    setFizz((current) => ({ ...current, ...patch }));
  }

  function updateStory(position: number, patch: Partial<FizzLayoutConfig["storyImages"][number]>) {
    setFizz((current) => ({
      ...current,
      storyImages: current.storyImages.map((slot, index) => (index === position ? { ...slot, ...patch } : slot)),
    }));
  }

  function toggleNews(productId: number) {
    setFizz((current) => {
      if (current.newsProductIds.includes(productId)) {
        return { ...current, newsProductIds: current.newsProductIds.filter((id) => id !== productId) };
      }
      if (current.newsProductIds.length >= MAX_NEWS) {
        notify(`"As novidades" mostra no máximo ${MAX_NEWS} peças.`);
        return current;
      }
      return { ...current, newsProductIds: [...current.newsProductIds, productId] };
    });
  }

  /** Salva as peças do layout que está sendo editado. */
  async function savePieces(): Promise<boolean> {
    if (selected === "padrao") {
      if (!heroId) {
        notify("Selecione a peça de destaque principal.");
        return false;
      }
      if (ids.some((id) => !id) || new Set(ids).size !== 4) {
        notify('Selecione quatro produtos diferentes para "Em destaque".');
        return false;
      }
      let response: ShowcaseMap;
      if (demoMode) {
        writeDemoShowcase("hero", [heroId]);
        response = writeDemoShowcase("home", ids);
      } else {
        await apiFetch<ShowcaseMap>("/products/showcases/hero", { method: "PATCH", body: JSON.stringify({ productIds: [heroId] }) });
        response = await apiFetch<ShowcaseMap>("/products/showcases/home", { method: "PATCH", body: JSON.stringify({ productIds: ids }) });
      }
      setShowcases(response);
      return true;
    }
    if (!fizz.newsProductIds.length) {
      notify('Escolha pelo menos uma peça para "As novidades".');
      return false;
    }
    const next = demoMode
      ? saveDemoHomeLayout({ ...layout, fizz })
      : await apiFetch<HomeLayoutSettings>("/home-layout", { method: "PATCH", body: JSON.stringify({ fizz }) });
    if (!demoMode) setHomeLayout(next);
    setLayout(next);
    setFizz(next.fizz);
    return true;
  }

  async function save(publish: boolean) {
    setSaving(true);
    try {
      if (!(await savePieces())) return;
      if (publish && layout.active !== selected) {
        const next = demoMode
          ? saveDemoHomeLayout({ ...layout, fizz, active: selected })
          : await apiFetch<HomeLayoutSettings>("/home-layout", { method: "PATCH", body: JSON.stringify({ active: selected }) });
        if (!demoMode) setHomeLayout(next);
        setLayout(next);
        notify(`Layout "${layouts.find((item) => item.key === selected)?.name}" publicado na página inicial.`);
      } else {
        notify(layout.active === selected ? "Peças salvas e já atualizadas no site." : "Peças salvas. Publique o layout para colocá-las no site.");
      }
      await onSaved?.();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Não foi possível salvar a vitrine.");
    } finally {
      setSaving(false);
    }
  }

  const selectedName = layouts.find((item) => item.key === selected)?.name || "";
  const isLive = layout.active === selected;
  const heroProduct = byId(fizz.heroProductId);

  return (
    <>
      <div className="mb-5 border border-bubble-candy bg-bubble-candy/15 p-4 text-[.72rem] leading-relaxed">
        <b>Página inicial do site.</b> Escolha o layout, selecione as peças dele e publique. Trocar de layout muda também o tema do site inteiro (barra de aviso, menu, selos e rodapé). As demais páginas continuam sendo preenchidas pela categoria e pela coleção de cada produto.
      </div>

      {loading ? (
        <p className="border border-bubble-line bg-bubble-white py-10 text-center text-sm text-bubble-ink/50">Carregando vitrine...</p>
      ) : (
        <>
          <section aria-labelledby="vitrine-passo-1" className="border border-bubble-line bg-bubble-white p-5 sm:p-6">
            <span className={eyebrow}>Passo 1</span>
            <h3 id="vitrine-passo-1" className="mt-1 text-xl">Layout da página inicial</h3>
            <p className="mt-1 text-[.78rem] text-bubble-ink/60">Escolha o layout para editar. Ele só vai para o site quando você publicar.</p>
            <div role="radiogroup" aria-label="Layout da página inicial" className="mt-4 grid gap-4 md:grid-cols-2">
              {layouts.map((item) => {
                const isSelected = selected === item.key;
                return (
                  <div key={item.key} className={`${isSelected ? "border-2 border-bubble-ink bg-bubble-white" : "border border-bubble-line bg-bubble-cream"} p-3.5`}>
                    <LayoutPreview layout={item.key} />
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <button
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          aria-label={`Selecionar o layout ${item.name}`}
                          onClick={() => setSelected(item.key)}
                          className="-m-2.5 flex size-11 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0"
                        >
                          <span className={`block size-[22px] rounded-full border-2 border-bubble-ink ${isSelected ? "bg-bubble-ink shadow-[inset_0_0_0_4px_#FAF6E9]" : ""}`} />
                        </button>
                        <span className="font-display text-[.95rem] uppercase">{item.name}</span>
                      </div>
                      {layout.active === item.key ? (
                        <span className="shrink-0 bg-bubble-success px-2 py-1 font-sans text-[.58rem] font-bold uppercase tracking-[.12em] text-bubble-white">No ar</span>
                      ) : null}
                    </div>
                    <p className="mt-1.5 text-[.76rem] leading-relaxed text-bubble-ink/65">{item.description}</p>
                    <p className="mt-2 font-sans text-[.6rem] font-bold uppercase tracking-[.12em] text-bubble-ink/55">
                      {isSelected ? "Selecionado · editando abaixo" : "Toque no círculo para selecionar"}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="vitrine-passo-2" className="mt-5 border border-bubble-line bg-bubble-white p-5 sm:p-6">
            <span className={eyebrow}>Passo 2</span>
            <h3 id="vitrine-passo-2" className="mt-1 text-xl">Peças da página inicial · {selectedName}</h3>
            <p className="mb-4 mt-1 text-[.78rem] text-bubble-ink/60">
              {selected === "fizz"
                ? 'Os blocos seguem a ordem da página: hero, "As novidades" e "A coleção". Qualquer peça publicada e com estoque pode entrar.'
                : 'Uma peça para a abertura do site e quatro para a seção "Em destaque".'}
            </p>

            {selected === "padrao" ? (
              <>
                <div className="border border-bubble-candy bg-bubble-candy/10 p-4">
                  <span className={eyebrow}>Abertura do site</span>
                  <h4 className="mt-1 text-lg">Peça de destaque</h4>
                  <div className="mt-3 grid max-w-[620px] grid-cols-[72px_1fr] gap-4 border border-bubble-line bg-bubble-cream p-3">
                    <Thumb product={byId(heroId)} placeholder="★" />
                    <label className={`${label} self-center`}>
                      Destaque principal
                      <select value={heroId} onChange={(event) => setHeroId(Number(event.target.value))} className={select}>
                        <option value={0}>Selecione uma peça</option>
                        {available.map((product) => <option key={product.id} value={product.id}>{product.name} · {money.format(product.price)}</option>)}
                      </select>
                    </label>
                  </div>
                </div>
                <h4 className="mt-6 text-lg">Quatro peças em destaque</h4>
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  {ids.map((id, position) => (
                    <div key={position} className="grid grid-cols-[72px_1fr] gap-4 border border-bubble-line bg-bubble-cream p-3">
                      <Thumb product={byId(id)} placeholder={String(position + 1)} />
                      <label className={`${label} self-center`}>
                        Posição {position + 1}
                        <select
                          value={id}
                          onChange={(event) => setIds((current) => current.map((value, index) => (index === position ? Number(event.target.value) : value)))}
                          className={select}
                        >
                          <option value={0}>Selecione uma peça</option>
                          {available.map((product) => (
                            <option key={product.id} value={product.id} disabled={ids.some((other, index) => index !== position && other === product.id)}>
                              {product.name} · {money.format(product.price)}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-5">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="border border-bubble-sun bg-bubble-peach/45 p-4">
                    <span className={eyebrow}>Hero · card grande</span>
                    <h4 className="mt-1 text-lg">Destaque do verão</h4>
                    <div className="mt-3 grid grid-cols-[72px_1fr] gap-3">
                      <Thumb product={heroProduct} color={fizz.heroColor} placeholder="★" />
                      <div className="flex flex-col gap-2.5">
                        <label className={label}>
                          Peça
                          <select value={fizz.heroProductId || 0} onChange={(event) => { const id = Number(event.target.value) || null; updateFizz({ heroProductId: id, heroColor: byId(id)?.colors?.[0]?.n || "" }); }} className={select}>
                            <option value={0}>Automático (peça da coleção)</option>
                            {available.map((product) => <option key={product.id} value={product.id}>{product.name} · {money.format(product.price)}</option>)}
                          </select>
                        </label>
                        <label className={label}>
                          Cor da foto
                          <select value={fizz.heroColor} onChange={(event) => updateFizz({ heroColor: event.target.value })} disabled={!heroProduct?.colors?.length} className={select}>
                            {(heroProduct?.colors || []).map((color) => <option key={color.n} value={color.n}>{color.n}</option>)}
                            {!heroProduct?.colors?.length ? <option value="">—</option> : null}
                          </select>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="border border-bubble-sun bg-bubble-peach/45 p-4">
                    <span className={eyebrow}>Hero · card menor</span>
                    <h4 className="mt-1 text-lg">Peça ao lado</h4>
                    <div className="mt-3 grid grid-cols-[72px_1fr] gap-3">
                      <Thumb product={byId(fizz.sideProductId)} placeholder="2" />
                      <label className={`${label} self-center`}>
                        Peça
                        <select value={fizz.sideProductId || 0} onChange={(event) => updateFizz({ sideProductId: Number(event.target.value) || null })} className={select}>
                          <option value={0}>Automático (peça da coleção)</option>
                          {available.map((product) => <option key={product.id} value={product.id} disabled={product.id === fizz.heroProductId}>{product.name} · {money.format(product.price)}</option>)}
                        </select>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="border border-bubble-line bg-bubble-cream p-4">
                  <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <span className={eyebrow}>Seção "As novidades"</span>
                      <h4 className="mt-1 text-lg">Peças que aparecem · {fizz.newsProductIds.length} de até {MAX_NEWS}</h4>
                    </div>
                    <span className="text-[.74rem] italic text-bubble-ink/60">Toque para incluir ou tirar. A ordem segue a numeração.</span>
                  </div>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2.5">
                    {available.map((product) => {
                      const position = fizz.newsProductIds.indexOf(product.id);
                      const on = position >= 0;
                      return (
                        <button
                          key={product.id}
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggleNews(product.id)}
                          className={`${on ? "border-2 border-bubble-ink opacity-100" : "border border-dashed border-bubble-ink/40 opacity-70 hover:opacity-100"} cursor-pointer bg-bubble-white p-2 text-left text-bubble-ink`}
                        >
                          <span className="relative block">
                            <Thumb product={product} placeholder="+" />
                            <span className={`${on ? "bg-bubble-sun" : "border border-bubble-ink bg-bubble-white"} absolute left-1.5 top-1.5 flex h-[22px] min-w-[22px] items-center justify-center px-1.5 font-sans text-[.68rem] font-bold`}>
                              {on ? position + 1 : "+"}
                            </span>
                          </span>
                          <span className="mt-2 block font-serif text-[.8rem] leading-tight">{product.name}</span>
                          <span className="mt-0.5 block font-sans text-[.74rem] font-semibold">{money.format(product.price)}</span>
                          <span className="mt-0.5 block text-[.68rem] italic text-bubble-ink/55">{product.collectionName ? `Coleção ${product.collectionName}` : "Sem coleção"}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border border-bubble-line bg-bubble-cream p-4">
                  <span className={eyebrow}>Seção "A coleção" · fundo pêssego</span>
                  <h4 className="mt-1 text-lg">Três fotos</h4>
                  <div className="mt-3 grid gap-3 lg:grid-cols-3">
                    {fizz.storyImages.map((slot, position) => {
                      const product = byId(slot.productId);
                      const photos = product ? productImagesForColor(product, slot.color) : [];
                      return (
                        <div key={position} className="grid grid-cols-[64px_1fr] gap-3 border border-bubble-line bg-bubble-white p-3">
                          <Thumb product={product} color={slot.color} index={slot.imageIndex} placeholder={String(position + 1)} />
                          <div className="flex flex-col gap-2">
                            <label className={label}>
                              Legenda
                              <input value={slot.label} maxLength={40} onChange={(event) => updateStory(position, { label: event.target.value })} className={select} />
                            </label>
                            <label className={label}>
                              Peça
                              <select value={slot.productId || 0} onChange={(event) => { const id = Number(event.target.value) || null; updateStory(position, { productId: id, color: byId(id)?.colors?.[0]?.n || "", imageIndex: 0 }); }} className={select}>
                                <option value={0}>Automático</option>
                                {available.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                              </select>
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <label className={label}>
                                Cor
                                <select value={slot.color} onChange={(event) => updateStory(position, { color: event.target.value, imageIndex: 0 })} disabled={!product?.colors?.length} className={select}>
                                  {(product?.colors || []).map((color) => <option key={color.n} value={color.n}>{color.n}</option>)}
                                  {!product?.colors?.length ? <option value="">—</option> : null}
                                </select>
                              </label>
                              <label className={label}>
                                Foto
                                <select value={slot.imageIndex} onChange={(event) => updateStory(position, { imageIndex: Number(event.target.value) })} disabled={!photos.length} className={select}>
                                  {photos.length ? photos.map((photo, index) => <option key={photo.id} value={index}>{index + 1} de {photos.length}</option>) : <option value={0}>—</option>}
                                </select>
                              </label>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </section>
        </>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border border-bubble-line bg-bubble-white p-4">
        <p className="m-0 max-w-[620px] text-[.74rem] text-bubble-ink/60">
          {isLive
            ? "Este layout está no ar. Salvar as peças atualiza a página inicial na hora."
            : `No ar agora: ${layouts.find((item) => item.key === layout.active)?.name}. As peças deste layout ficam salvas e só aparecem no site depois de publicar.`}
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={loading || saving} onClick={() => void save(false)} className="border border-bubble-ink bg-transparent px-4 py-[9px] font-sans text-[.64rem] font-bold uppercase tracking-[.1em] text-bubble-ink hover:bg-bubble-ink hover:text-bubble-white disabled:opacity-40">
            {saving ? "Salvando..." : "Salvar peças"}
          </button>
          <button type="button" disabled={loading || saving || isLive} onClick={() => void save(true)} className={`${saveButton} ${isLive ? "!bg-bubble-success disabled:opacity-100" : ""}`}>
            {isLive ? "No ar" : "Publicar este layout"}
          </button>
        </div>
      </div>
    </>
  );
}
