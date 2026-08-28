"use client";

export function PaginationControls({
  page,
  pageSize,
  onPageSizeChange,
  onPageChange,
  totalPages,
  pageStart,
  count,
  ariaLabel,
}: {
  page: number;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  onPageChange: (page: number) => void;
  totalPages: number;
  pageStart: number;
  count: number;
  ariaLabel: string;
}) {
  if (!count) return null;

  return (
    <nav
      className="flex flex-col gap-3 border border-bubble-line bg-bubble-white p-4 sm:flex-row sm:items-center sm:justify-between"
      aria-label={ariaLabel}
    >
      <div className="flex items-center gap-2 text-xs text-bubble-ink/60">
        <span>Exibir</span>
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="min-h-9 border border-bubble-line bg-bubble-white px-2 outline-none focus:border-bubble-ink"
          aria-label="Itens por página"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>
        <span>por página</span>
      </div>

      <p className="text-center text-xs text-bubble-ink/60">
        Mostrando {pageStart + 1}-{Math.min(pageStart + pageSize, count)} de{" "}
        {count}
      </p>

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="min-h-9 border border-bubble-line px-3 font-sans text-[.6rem] font-bold uppercase tracking-[.08em] disabled:cursor-not-allowed disabled:opacity-35"
        >
          Anterior
        </button>
        <span className="min-w-20 text-center text-xs">
          Página {page} de {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="min-h-9 border border-bubble-line px-3 font-sans text-[.6rem] font-bold uppercase tracking-[.08em] disabled:cursor-not-allowed disabled:opacity-35"
        >
          Próxima
        </button>
      </div>
    </nav>
  );
}
