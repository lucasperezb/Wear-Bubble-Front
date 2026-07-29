"use client";

export default function GlobalError() {
  function reloadWithoutCache() {
    const url = new URL(window.location.href);
    url.searchParams.set("_reload", Date.now().toString());
    window.location.replace(url.toString());
  }

  return (
    <html lang="pt-BR">
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bubble-cream p-8 text-center text-bubble-ink">
          <h1>Algo saiu do trilho.</h1>
          <p>Recarregue a loja e tente de novo.</p>
          <button
            className="inline-flex items-center justify-center border border-transparent bg-bubble-ink px-[30px] py-[15px] font-sans text-[.78rem] font-semibold uppercase tracking-[.14em] text-bubble-white"
            onClick={reloadWithoutCache}
          >
            Recarregar
          </button>
        </main>
      </body>
    </html>
  );
}
