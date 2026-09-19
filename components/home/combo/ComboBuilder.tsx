import { Product, money } from "../../../lib/api";
import { isBottomCategory, isTopCategory } from "../../../lib/product-filters";
import { availableVariantSizes, sortProductSizes } from "../../../lib/product-sizes";
import { productPrice } from "../../../lib/pricing";
import { productImageUrlForColor } from "../../../lib/product-images";
import { ProductIcon } from "../../shared";

type ComboBuilderProps = {
  products: Product[];
  bottomId: number | null;
  topId: number | null;
  variantSelections: Record<number, { color: string; size: string }>;
  onSelectBottom: (product: Product) => void;
  onSelectTop: (product: Product) => void;
  onVariantChange: (productId: number, color: string, size: string) => void;
  onAdd: () => void;
};

const COMBO_DISCOUNT = 0.05;

export function ComboBuilder({
  products,
  bottomId,
  topId,
  variantSelections,
  onSelectBottom,
  onSelectTop,
  onVariantChange,
  onAdd,
}: ComboBuilderProps) {
  const featured = products
    .filter(
      (product) =>
        product.active && product.stock > 0 && product.bundlePosition > 0,
    )
    .sort((first, second) => first.bundlePosition - second.bundlePosition);
  const bottoms = featured.filter((product) => isBottomCategory(product.cat));
  const tops = featured.filter((product) => isTopCategory(product.cat));
  const bottom = products.find((product) => product.id === bottomId);
  const top = products.find((product) => product.id === topId);
  const full = bottom && top ? productPrice(bottom) + productPrice(top) : 0;
  const discounted = full * (1 - COMBO_DISCOUNT);

  /**
   * Cor e tamanho efetivos de uma peça: o que o cliente escolheu, ou o primeiro
   * disponível. Nunca devolve uma combinação sem estoque.
   */
  const resolveVariant = (product: Product) => {
    const variant = variantSelections[product.id];
    const colors = availableColors(product);
    const color =
      colors.find((item) => item.n === variant?.color)?.n || colors[0]?.n || "";
    const sizes = availableSizes(product, color);
    const size = sizes.includes(variant?.size || "") ? variant.size : sizes[0] || "";
    return { colors, color, sizes, size };
  };

  const card = (product: Product, kind: "bottom" | "top") => {
    const selected =
      kind === "bottom" ? bottomId === product.id : topId === product.id;
    const select = kind === "bottom" ? onSelectBottom : onSelectTop;
    const { colors, color, sizes, size } = resolveVariant(product);
    const image = productImageUrlForColor(product, color);

    // Mexer numa amostra de uma peça ainda não escolhida também escolhe a peça,
    // para o cliente não precisar clicar duas vezes.
    const changeColor = (nextColor: string) => {
      if (!selected) select(product);
      onVariantChange(
        product.id,
        nextColor,
        availableSizes(product, nextColor)[0] || "",
      );
    };
    const changeSize = (nextSize: string) => {
      if (!selected) select(product);
      onVariantChange(product.id, color, nextSize);
    };

    return (
      <div
        key={product.id}
        className={`flex flex-col bg-bubble-white transition-[border-color,box-shadow] max-[620px]:w-[62%] max-[620px]:shrink-0 max-[620px]:snap-start ${
          selected
            ? "border-2 border-bubble-ink shadow-bubble"
            : "border border-bubble-line hover:border-bubble-ink/70"
        }`}
        data-selected={selected ? "true" : undefined}
      >
        <button
          type="button"
          className="group/pick block w-full cursor-pointer text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-bubble-ink"
          aria-pressed={selected}
          aria-label={`${selected ? "Remover" : "Escolher"} ${product.name}`}
          onClick={() => select(product)}
        >
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-bubble-cream2 text-bubble-brown [&_svg]:h-full [&_svg]:w-full [&_svg]:p-[22%]">
            {image ? (
              <img
                className="size-full object-cover transition-transform duration-300 group-hover/pick:scale-[1.03]"
                src={image}
                alt={product.name}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <ProductIcon icon={product.icon} />
            )}
            <span
              className={`absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-bubble-ink text-bubble-cream transition-opacity ${selected ? "opacity-100" : "opacity-0"}`}
              aria-hidden="true"
            >
              <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8.5 6.5 12 13 4.5" />
              </svg>
            </span>
          </div>
          <div className="px-3 pt-3">
            <div className="text-[.84rem] leading-snug">{product.name}</div>
            <div className="mt-1 font-sans text-[.82rem] font-semibold tracking-[.02em]">
              {money.format(productPrice(product))}
            </div>
          </div>
        </button>

        <div className="mt-auto px-3 pb-3 pt-2.5">
          {colors.length ? (
            <div
              className="flex flex-wrap items-center gap-2"
              role="radiogroup"
              aria-label={`Cor de ${product.name}`}
            >
              {colors.map((item) => {
                const active = item.n === color;
                return (
                  <button
                    key={item.n}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    title={item.n}
                    aria-label={item.n}
                    className={`size-[18px] rounded-full border border-bubble-ink/25 transition-[outline] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bubble-ink ${active ? "outline outline-2 outline-offset-2 outline-bubble-ink" : ""}`}
                    style={{ backgroundColor: item.h || "#CFC6B0" }}
                    onClick={() => changeColor(item.n)}
                  />
                );
              })}
              <span className="ml-0.5 font-sans text-[.58rem] font-bold uppercase tracking-[.08em] text-bubble-ink/55">
                {color}
              </span>
            </div>
          ) : null}
          {sizes.length ? (
            <div
              className="mt-2 flex flex-wrap gap-1.5"
              role="radiogroup"
              aria-label={`Tamanho de ${product.name}`}
            >
              {sizes.map((item) => {
                const active = item === size;
                return (
                  <button
                    key={item}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className={`min-w-8 border px-2 py-1 font-sans text-[.62rem] font-semibold uppercase tracking-[.06em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-bubble-ink ${
                      active
                        ? "border-bubble-ink bg-bubble-ink text-bubble-cream"
                        : "border-bubble-line bg-bubble-white text-bubble-ink hover:border-bubble-ink"
                    }`}
                    onClick={() => changeSize(item)}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const group = (
    title: string,
    step: number,
    items: Product[],
    kind: "bottom" | "top",
  ) => (
    <div className="min-w-0">
      <h4 className="mb-3 flex items-center gap-2 font-sans text-[.72rem] font-bold uppercase tracking-[.16em] text-bubble-brown">
        <span className="flex size-[18px] items-center justify-center rounded-full bg-bubble-ink font-sans text-[.6rem] font-bold text-bubble-cream">
          {step}
        </span>
        {title}
      </h4>
      {items.length ? (
        <>
          <div className="grid grid-cols-2 gap-2.5 max-[620px]:-mx-4 max-[620px]:flex max-[620px]:snap-x max-[620px]:snap-mandatory max-[620px]:gap-2.5 max-[620px]:overflow-x-auto max-[620px]:px-4 max-[620px]:pb-1 max-[620px]:[scrollbar-width:none] max-[620px]:[&::-webkit-scrollbar]:hidden">
            {items.map((product) => card(product, kind))}
          </div>
          {items.length > 1 ? (
            <p className="mt-2 hidden font-sans text-[.58rem] font-semibold uppercase tracking-[.12em] text-bubble-ink/45 max-[620px]:block">
              Deslize para ver mais →
            </p>
          ) : null}
        </>
      ) : (
        <EmptySelection />
      )}
    </div>
  );

  return (
    <section
      className="border-y border-bubble-line bg-bubble-white py-[85px] max-[620px]:py-14"
      id="conjunto"
    >
      <div className="mx-auto max-w-[1200px] px-8 max-[620px]:px-4">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="font-sans text-[.72rem] font-semibold uppercase tracking-[.32em] text-bubble-brown">
              Compre o look completo
            </span>
            <h2 className="text-[clamp(2rem,5vw,2.6rem)]">
              Monte seu Conjunto · 5% OFF
            </h2>
          </div>
          <p className="max-w-[380px] text-[.9rem] italic leading-[1.6] text-bubble-ink/60">
            Escolha uma das peças selecionadas pela Wear Bubble e monte a
            combinação que preferir.
          </p>
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-[34px] max-[980px]:grid-cols-1 max-[980px]:gap-8">
          {group("Escolha a parte de baixo", 1, bottoms, "bottom")}
          {group("Escolha o top", 2, tops, "top")}
        </div>

        {/* No celular a barra gruda no rodapé enquanto a seção está na tela. */}
        <div className="mt-[26px] bg-bubble-ink font-serif text-bubble-cream max-[620px]:sticky max-[620px]:bottom-0 max-[620px]:z-[5] max-[620px]:-mx-4 max-[620px]:border-t-2 max-[620px]:border-bubble-candy">
          {bottom && top ? (
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 p-6 max-[620px]:gap-y-3 max-[620px]:px-4 max-[620px]:py-3.5">
              <div className="flex min-w-0 items-center gap-3 max-[620px]:hidden">
                <ComboMini product={bottom} color={resolveVariant(bottom).color} />
                <span className="font-display text-[1rem] text-bubble-cream/50" aria-hidden="true">+</span>
                <ComboMini product={top} color={resolveVariant(top).color} />
                <div className="min-w-0">
                  <div className="font-sans text-[.6rem] uppercase tracking-[.14em] text-bubble-cream/55">
                    Seu conjunto
                  </div>
                  <div className="mt-0.5 truncate text-[.9rem]">
                    {bottom.name} + {top.name}
                  </div>
                </div>
              </div>
              <div className="text-right max-[620px]:text-left">
                <span className="text-[.82rem] text-bubble-cream/50 line-through max-[620px]:block max-[620px]:text-[.7rem]">
                  {money.format(full)}
                </span>
                <div className="font-display text-[1.8rem] leading-none text-bubble-candy max-[620px]:text-[1.35rem]">
                  {money.format(discounted)}
                </div>
                <div className="mt-1 font-sans text-[.62rem] font-bold uppercase tracking-[.1em] text-bubble-candy max-[620px]:hidden">
                  Você economiza {money.format(full - discounted)}
                </div>
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center border border-bubble-candy bg-bubble-candy px-[30px] py-[15px] font-sans text-[.78rem] font-bold uppercase tracking-[.14em] text-bubble-ink transition-colors hover:border-bubble-white hover:bg-bubble-white max-[620px]:ml-auto max-[620px]:px-5 max-[620px]:py-3 max-[620px]:text-[.7rem]"
                onClick={onAdd}
              >
                Adicionar conjunto
              </button>
            </div>
          ) : (
            <div className="p-6 text-[.84rem] text-bubble-cream/70 max-[620px]:px-4 max-[620px]:py-3.5 max-[620px]:text-[.76rem]">
              {bottom || top
                ? `Falta escolher ${bottom ? "o top" : "a parte de baixo"} para ver o preço do conjunto com 5% OFF.`
                : "Escolha uma parte de baixo e um top para ver o preço do conjunto com 5% OFF."}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ComboMini({ product, color }: { product: Product; color: string }) {
  const image = productImageUrlForColor(product, color);
  return (
    <div className="flex h-[52px] w-[40px] shrink-0 items-center justify-center overflow-hidden border border-bubble-cream/25 bg-bubble-brown text-bubble-cream/80 [&_svg]:w-3/5">
      {image ? (
        <img className="size-full object-cover" src={image} alt="" loading="lazy" decoding="async" />
      ) : (
        <ProductIcon icon={product.icon} />
      )}
    </div>
  );
}

function EmptySelection() {
  return (
    <p className="border border-bubble-line bg-bubble-cream p-5 text-sm text-bubble-ink/60">
      A seleção desta categoria ainda não foi configurada pelo gerente.
    </p>
  );
}

function availableColors(product: Product) {
  const configured = (product.colors || []).filter(
    (color) => (color.sizes || []).length,
  );
  if (!configured.length) return product.colors || [];
  return configured.filter((color) =>
    (color.sizes || []).some((item) => Number(item.q) > 0),
  );
}

function availableSizes(product: Product, colorName: string) {
  const configured = (product.colors || []).some(
    (color) => (color.sizes || []).length,
  );
  if (!configured) return sortProductSizes(product.sizes);
  const color = product.colors.find((item) => item.n === colorName);
  return availableVariantSizes(color?.sizes || []);
}
