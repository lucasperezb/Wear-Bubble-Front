"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from "lucide-react";
import {
  apiFetch,
  type HeroConfig,
  type HeroSlide,
} from "../../../lib/api";
import {
  adminNote,
  outlineButton,
  primaryButton,
  productInput,
  productLabel,
} from "../shared/styles";
import type { Notify } from "../shared/types";

type HeroCarouselAdminProps = {
  config: HeroConfig;
  onConfig: (config: HeroConfig) => void;
  onPublished: () => void | Promise<void>;
  notify: Notify;
};

export function HeroCarouselAdmin({
  config,
  onConfig,
  onPublished,
  notify,
}: HeroCarouselAdminProps) {
  const [image, setImage] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState("#colecao");
  const [altText, setAltText] = useState("");
  const [saving, setSaving] = useState(false);
  const preview = useObjectUrl(image);

  async function publish(next: HeroConfig, message: string) {
    onConfig(next);
    await onPublished();
    notify(message);
  }

  async function toggleCarousel() {
    setSaving(true);
    try {
      const next = await apiFetch<HeroConfig>("/hero/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({ enabled: !config.enabled }),
      });
      await publish(
        next,
        next.enabled
          ? "Carrossel publicado no Hero."
          : "Carrossel desativado. O Hero original voltou para a loja.",
      );
    } catch (error) {
      notify(messageFrom(error, "Não foi possível alterar o carrossel."));
    } finally {
      setSaving(false);
    }
  }

  async function addSlide() {
    if (!image) return notify("Escolha uma imagem para o novo slide.");
    const validation = validateLink(linkUrl);
    if (validation) return notify(validation);
    setSaving(true);
    try {
      const body = new FormData();
      body.append("image", image);
      body.append("linkUrl", linkUrl.trim());
      body.append("altText", altText.trim());
      body.append("active", "true");
      const next = await apiFetch<HeroConfig>("/hero/admin/slides", {
        method: "POST",
        body,
      });
      setImage(null);
      setLinkUrl("#colecao");
      setAltText("");
      await publish(next, "Imagem adicionada ao carrossel.");
    } catch (error) {
      notify(messageFrom(error, "Não foi possível adicionar a imagem."));
    } finally {
      setSaving(false);
    }
  }

  async function moveSlide(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= config.slides.length) return;
    const ids = config.slides.map((slide) => slide.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    setSaving(true);
    try {
      const next = await apiFetch<HeroConfig>("/hero/admin/slides/order", {
        method: "PATCH",
        body: JSON.stringify({ slideIds: ids }),
      });
      await publish(next, "Ordem do carrossel atualizada.");
    } catch (error) {
      notify(messageFrom(error, "Não foi possível alterar a ordem."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-bubble-line pb-5">
        <div>
          <h4 className="text-xl">Carrossel do Hero</h4>
          <p className="mt-1 max-w-[680px] text-[.72rem] leading-[1.55] text-bubble-ink/55">
            Publique banners clicáveis no topo da loja. Ao desativar, o Hero
            original “Estoure seus limites” volta automaticamente.
          </p>
        </div>
        <button
          type="button"
          className={`${config.enabled ? primaryButton : outlineButton} min-w-[190px]`}
          onClick={() => void toggleCarousel()}
          disabled={saving}
        >
          {config.enabled ? "Carrossel ativo" : "Carrossel desativado"}
        </button>
      </div>

      <section className="mb-6 border border-bubble-line bg-bubble-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <ImagePlus size={19} />
          <h5 className="font-serif text-lg font-semibold">Adicionar imagem</h5>
        </div>
        <div className="grid grid-cols-[minmax(220px,360px)_minmax(0,1fr)] gap-5 max-[760px]:grid-cols-1">
          <label className="group flex aspect-[16/7] cursor-pointer items-center justify-center overflow-hidden border border-dashed border-bubble-ink/35 bg-bubble-cream2 text-center">
            {preview ? (
              <img src={preview} alt="Prévia do novo slide" className="size-full object-cover" />
            ) : (
              <span className="px-5 text-[.72rem] leading-[1.6] text-bubble-ink/55 group-hover:text-bubble-ink">
                Clique para escolher uma imagem horizontal<br />JPEG, PNG ou WebP · até 10 MB
              </span>
            )}
            <input
              type="file"
              className="sr-only"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setImage(validImage(event.target.files?.[0], notify))}
            />
          </label>
          <div>
            <label className={productLabel}>Destino ao clicar</label>
            <input
              className={productInput}
              value={linkUrl}
              onChange={(event) => setLinkUrl(event.target.value)}
              placeholder="#colecao, /conta ou https://..."
              maxLength={500}
            />
            <label className={productLabel}>Descrição da imagem</label>
            <input
              className={productInput}
              value={altText}
              onChange={(event) => setAltText(event.target.value)}
              placeholder="Ex: Nova coleção de conjuntos Bubble"
              maxLength={180}
            />
            <button
              type="button"
              className={`${primaryButton} mt-4`}
              onClick={() => void addSlide()}
              disabled={saving || !image}
            >
              {saving ? "Salvando..." : "Adicionar ao carrossel"}
            </button>
          </div>
        </div>
      </section>

      <div className="space-y-3">
        {config.slides.map((slide, index) => (
          <HeroSlideEditor
            key={slide.id}
            slide={slide}
            index={index}
            total={config.slides.length}
            busy={saving}
            onBusy={setSaving}
            onConfig={async (next, message) => publish(next, message)}
            onMove={(direction) => void moveSlide(index, direction)}
            notify={notify}
          />
        ))}
        {!config.slides.length ? (
          <div className="border border-bubble-line bg-bubble-white p-8 text-center text-[.8rem] text-bubble-ink/55">
            Nenhuma imagem cadastrada. Adicione o primeiro banner acima.
          </div>
        ) : null}
      </div>
      <p className={adminNote}>
        Recomendação: use imagens horizontais com pelo menos 1600 × 700 px. A
        área central da imagem deve conter o conteúdo mais importante para não
        perder informação no celular.
      </p>
    </>
  );
}

function HeroSlideEditor({
  slide,
  index,
  total,
  busy,
  onBusy,
  onConfig,
  onMove,
  notify,
}: {
  slide: HeroSlide;
  index: number;
  total: number;
  busy: boolean;
  onBusy: (busy: boolean) => void;
  onConfig: (config: HeroConfig, message: string) => Promise<void>;
  onMove: (direction: -1 | 1) => void;
  notify: Notify;
}) {
  const [linkUrl, setLinkUrl] = useState(slide.linkUrl);
  const [altText, setAltText] = useState(slide.altText);

  useEffect(() => {
    setLinkUrl(slide.linkUrl);
    setAltText(slide.altText);
  }, [slide.altText, slide.linkUrl]);

  async function saveMetadata(patch: Partial<Pick<HeroSlide, "active">> = {}) {
    const validation = validateLink(linkUrl);
    if (validation) return notify(validation);
    onBusy(true);
    try {
      const next = await apiFetch<HeroConfig>(`/hero/admin/slides/${slide.id}`, {
        method: "PATCH",
        body: JSON.stringify({ linkUrl: linkUrl.trim(), altText: altText.trim(), ...patch }),
      });
      await onConfig(next, patch.active === undefined ? "Slide atualizado." : patch.active ? "Slide exibido no carrossel." : "Slide ocultado do carrossel.");
    } catch (error) {
      notify(messageFrom(error, "Não foi possível salvar o slide."));
    } finally {
      onBusy(false);
    }
  }

  async function replaceImage(file?: File) {
    const valid = validImage(file, notify);
    if (!valid) return;
    onBusy(true);
    try {
      const body = new FormData();
      body.append("image", valid);
      const next = await apiFetch<HeroConfig>(`/hero/admin/slides/${slide.id}/image`, {
        method: "POST",
        body,
      });
      await onConfig(next, "Imagem do slide substituída.");
    } catch (error) {
      notify(messageFrom(error, "Não foi possível substituir a imagem."));
    } finally {
      onBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm("Excluir esta imagem do carrossel?")) return;
    onBusy(true);
    try {
      const next = await apiFetch<HeroConfig>(`/hero/admin/slides/${slide.id}`, {
        method: "DELETE",
      });
      await onConfig(next, "Imagem removida do carrossel.");
    } catch (error) {
      notify(messageFrom(error, "Não foi possível excluir o slide."));
    } finally {
      onBusy(false);
    }
  }

  return (
    <article className="grid grid-cols-[280px_minmax(0,1fr)_auto] gap-4 border border-bubble-line bg-bubble-white p-4 max-[900px]:grid-cols-[220px_minmax(0,1fr)] max-[620px]:grid-cols-1">
      <div>
        <div className="relative aspect-[16/7] overflow-hidden bg-bubble-cream2">
          <img src={slide.imageUrl} alt={slide.altText} className="size-full object-cover" />
          <span className="absolute left-2 top-2 bg-bubble-ink px-2 py-1 text-[.58rem] font-bold uppercase tracking-[.1em] text-bubble-white">
            {index + 1}
          </span>
        </div>
        <label className={`${outlineButton} mt-2 flex cursor-pointer items-center justify-center py-2.5`}>
          Trocar imagem
          <input
            type="file"
            className="sr-only"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(event) => void replaceImage(event.target.files?.[0])}
          />
        </label>
      </div>
      <div>
        <label className={`${productLabel} mt-0`}>Destino ao clicar</label>
        <input className={productInput} value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} maxLength={500} />
        <label className={productLabel}>Descrição acessível</label>
        <input className={productInput} value={altText} onChange={(event) => setAltText(event.target.value)} maxLength={180} />
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={primaryButton} onClick={() => void saveMetadata()} disabled={busy}>Salvar</button>
          <button type="button" className={outlineButton} onClick={() => void saveMetadata({ active: !slide.active })} disabled={busy}>
            {slide.active ? "Ocultar slide" : "Exibir slide"}
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2 max-[900px]:col-span-2 max-[900px]:flex-row max-[620px]:col-span-1">
        <button type="button" className={`${outlineButton} px-3`} onClick={() => onMove(-1)} disabled={busy || index === 0} aria-label="Mover slide para cima"><ArrowUp size={16} /></button>
        <button type="button" className={`${outlineButton} px-3`} onClick={() => onMove(1)} disabled={busy || index === total - 1} aria-label="Mover slide para baixo"><ArrowDown size={16} /></button>
        <button type="button" className="flex items-center justify-center border border-bubble-danger/35 px-3 py-3 text-bubble-danger hover:bg-bubble-danger hover:text-bubble-white" onClick={() => void remove()} disabled={busy} aria-label="Excluir slide"><Trash2 size={16} /></button>
      </div>
    </article>
  );
}

function validateLink(value: string) {
  return /^(#|\/(?!\/)|https?:\/\/)/i.test(value.trim())
    ? ""
    : "Use um destino iniciado por #, /, http:// ou https://.";
}

function validImage(file: File | undefined, notify: Notify) {
  if (!file) return null;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    notify("Escolha uma imagem JPEG, PNG ou WebP.");
    return null;
  }
  if (file.size > 10 * 1024 * 1024) {
    notify("A imagem deve ter no máximo 10 MB.");
    return null;
  }
  return file;
}

function useObjectUrl(file: File | null) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);
  return url;
}

function messageFrom(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
