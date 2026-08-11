import { Product, money } from "../../../lib/api";
import { isBottomCategory, isTopCategory } from "../../../lib/product-filters";
import { availableVariantSizes, sortProductSizes } from "../../../lib/product-sizes";
import { productPrice } from "../../../lib/pricing";
import { ProductIcon } from "../../shared";

type ComboBuilderProps = {
  products: Product[];
  bottomId: number | null;
  topId: number | null;
  bottomColor: string;
  topColor: string;
  bottomSize: string;
  topSize: string;
  onSelectBottom: (product: Product) => void;
  onSelectTop: (product: Product) => void;
  onBottomColor: (color: string, size: string) => void;
  onTopColor: (color: string, size: string) => void;
  onBottomSize: (size: string) => void;
  onTopSize: (size: string) => void;
  onAdd: () => void;
};

export function ComboBuilder({
  products,
  bottomId,
  topId,
  bottomColor,
  topColor,
  bottomSize,
  topSize,
  onSelectBottom,
  onSelectTop,
  onBottomColor,
  onTopColor,
  onBottomSize,
  onTopSize,
  onAdd,
}: ComboBuilderProps) {
  const featured = products
    .filter(
      (product) =>
        product.active && product.stock > 0 && product.bundlePosition > 0,
    )
    .sort((first, second) => first.bundlePosition - second.bundlePosition);
  const bottoms = featured
    .filter((product) => isBottomCategory(product.cat));
  const tops = featured.filter((product) => isTopCategory(product.cat));
  const bottom = products.find((product) => product.id === bottomId);
  const top = products.find((product) => product.id === topId);
  const full = bottom && top ? productPrice(bottom) + productPrice(top) : 0;
  const discounted = full * 0.95;

  const option = (product: Product, kind: "bottom" | "top") => {
    const selected =
      kind === "bottom" ? bottomId === product.id : topId === product.id;
    const color = kind === "bottom" ? bottomColor : topColor;
    const size = kind === "bottom" ? bottomSize : topSize;
    const onColor = kind === "bottom" ? onBottomColor : onTopColor;
    const onSize = kind === "bottom" ? onBottomSize : onTopSize;
    const colors = availableColors(product);
    const selectedColor =
      colors.find((item) => item.n === color)?.n || colors[0]?.n || "";
    const sizes = availableSizes(product, selectedColor);
    const selectedSize = sizes.includes(size) ? size : sizes[0] || "";
    return (
      <div
        className={`mb-2.5 flex cursor-pointer items-center gap-3.5 border p-[12px_14px] transition-all max-[620px]:flex-wrap ${selected ? "border-bubble-ink bg-bubble-ink/[.07]" : "border-bubble-line bg-bubble-cream"}`}
        key={product.id}
        onClick={() =>
          kind === "bottom" ? onSelectBottom(product) : onSelectTop(product)
        }
      >
        <div className="flex h-[64px] w-[54px] shrink-0 items-center justify-center overflow-hidden bg-bubble-white [&_svg]:w-3/5">
          {product.image ? (
            <img
              className="size-full object-cover"
              src={product.image}
              alt={product.name}
            />
          ) : (
            <ProductIcon icon={product.icon} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[.82rem] font-medium">{product.name}</div>
          <div className="text-[.74rem] font-semibold text-bubble-ink">
            {money.format(productPrice(product))}
          </div>
          {selected ? (
            <div className="mt-1 font-sans text-[.54rem] font-bold uppercase tracking-[.08em] text-bubble-brown">
              Selecionado · clique novamente para remover
            </div>
          ) : null}
        </div>
        <div className="ml-auto flex gap-2 max-[620px]:ml-[68px] max-[620px]:w-[calc(100%-68px)]">
          <label className="flex-1 font-sans text-[.56rem] font-bold uppercase tracking-[.08em] text-bubble-ink/50">
            Cor
            <select
              className="mt-1 w-full border border-bubble-line bg-bubble-white px-2 py-[7px] font-serif text-[.72rem] normal-case tracking-normal text-bubble-ink"
              value={selectedColor}
              disabled={!selected}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => {
                const nextColor = event.target.value;
                onColor(nextColor, availableSizes(product, nextColor)[0] || "");
              }}
            >
              {colors.map((item) => (
                <option key={item.n} value={item.n}>
                  {item.n}
                </option>
              ))}
            </select>
          </label>
          <label className="w-[88px] font-sans text-[.56rem] font-bold uppercase tracking-[.08em] text-bubble-ink/50">
            Tamanho
            <select
              className="mt-1 w-full border border-bubble-line bg-bubble-white px-2 py-[7px] font-serif text-[.72rem] normal-case tracking-normal text-bubble-ink"
              value={selectedSize}
              disabled={!selected}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => onSize(event.target.value)}
            >
              {sizes.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
    );
  };

  return (
    <section
      className="border-y border-bubble-line bg-bubble-white py-[85px]"
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
        <div className="mt-2.5 grid grid-cols-2 gap-[34px] max-[980px]:grid-cols-1">
          <div>
            <h4 className="mb-3.5 font-sans text-[.72rem] font-bold uppercase tracking-[.16em] text-bubble-brown">
              1 · Escolha a parte de baixo
            </h4>
            {bottoms.length ? (
              bottoms.map((product) => option(product, "bottom"))
            ) : (
              <EmptySelection />
            )}
          </div>
          <div>
            <h4 className="mb-3.5 font-sans text-[.72rem] font-bold uppercase tracking-[.16em] text-bubble-brown">
              2 · Escolha o top
            </h4>
            {tops.length ? (
              tops.map((product) => option(product, "top"))
            ) : (
              <EmptySelection />
            )}
          </div>
        </div>
        <div className="mt-[26px] flex flex-wrap items-center justify-between gap-4 bg-bubble-ink p-6 font-serif text-bubble-cream">
          {bottom && top ? (
            <>
              <div>
                <div className="text-[.72rem] uppercase tracking-[.12em] text-bubble-cream/60">
                  Seu conjunto
                </div>
                <div className="mt-1 text-[.9rem]">
                  {bottom.name} + {top.name}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[.85rem] text-bubble-cream/50 line-through">
                  {money.format(full)}
                </span>
                <div className="font-display text-[1.8rem] text-bubble-candy">
                  {money.format(discounted)}
                </div>
                <div className="text-[.7rem] font-bold uppercase tracking-[.1em] text-bubble-candy">
                  Você economiza {money.format(full - discounted)}
                </div>
              </div>
              <button
                className="inline-flex items-center justify-center border border-bubble-candy bg-bubble-candy px-[30px] py-[15px] font-sans text-[.78rem] font-bold uppercase tracking-[.14em] text-bubble-ink transition-all hover:border-bubble-white hover:bg-bubble-white"
                onClick={onAdd}
              >
                Adicionar conjunto
              </button>
            </>
          ) : (
            <div className="text-[.84rem] text-bubble-cream/70">
              Escolha uma parte de baixo e um top para ver o preço do conjunto
              com 5% OFF.
            </div>
          )}
        </div>
      </div>
    </section>
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
