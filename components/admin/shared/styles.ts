export const primaryButton = 'inline-flex items-center justify-center gap-2 border border-transparent bg-bubble-ink px-[30px] py-[15px] font-sans text-[.78rem] font-semibold uppercase tracking-[.14em] text-bubble-white transition-all hover:border-bubble-ink hover:bg-bubble-white hover:text-bubble-ink disabled:cursor-not-allowed disabled:opacity-45';
export const outlineButton = 'inline-flex items-center justify-center gap-2 border border-bubble-ink bg-transparent px-[30px] py-[15px] font-sans text-[.78rem] font-semibold uppercase tracking-[.14em] text-bubble-ink transition-all hover:bg-bubble-ink hover:text-bubble-white';
export const smallButton = 'inline-flex items-center justify-center border border-bubble-ink px-4 py-[9px] font-sans text-[.68rem] font-semibold uppercase tracking-[.1em] transition-colors';
export const saveButton = 'border-0 bg-bubble-ink px-3.5 py-[9px] font-sans text-[.64rem] font-bold uppercase tracking-[.1em] text-bubble-white hover:bg-bubble-brown';
export const adminNote = 'm-0 mt-3.5 text-[.7rem] leading-[1.6] text-bubble-ink/55';
export const chartCard = 'border border-bubble-line bg-bubble-white p-6 [&>h4]:mb-[18px] [&>h4]:font-sans [&>h4]:text-[.74rem] [&>h4]:font-bold [&>h4]:uppercase [&>h4]:tracking-[.14em] [&>h4]:text-bubble-ink/65 [&>svg]:block [&>svg]:h-auto [&>svg]:w-full';
export const adminTable = 'w-full border-collapse border border-bubble-line bg-bubble-white [&_input]:w-full [&_input]:border [&_input]:border-bubble-line [&_input]:bg-bubble-cream [&_input]:px-2.5 [&_input]:py-2 [&_input]:text-[.78rem] [&_input:focus]:bg-bubble-white [&_input:focus]:outline [&_input:focus]:outline-2 [&_select]:w-full [&_select]:border [&_select]:border-bubble-line [&_select]:bg-bubble-cream [&_select]:px-2.5 [&_select]:py-2 [&_select]:text-[.78rem] [&_td]:border-b [&_td]:border-bubble-line [&_td]:px-3.5 [&_td]:py-3 [&_td]:text-[.8rem] [&_td]:align-middle [&_th]:bg-bubble-ink [&_th]:px-3.5 [&_th]:py-3 [&_th]:text-left [&_th]:font-sans [&_th]:text-[.64rem] [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-[.14em] [&_th]:text-bubble-candy';
export const field = 'mb-[15px] [&_input]:w-full [&_input]:border [&_input]:border-bubble-line [&_input]:bg-bubble-cream [&_input]:px-3.5 [&_input]:py-3 [&_input]:text-[.88rem] [&_input:focus]:bg-bubble-white [&_input:focus]:outline [&_input:focus]:outline-2 [&_label]:mb-1.5 [&_label]:block [&_label]:text-[.7rem] [&_label]:font-semibold [&_label]:uppercase [&_label]:tracking-[.08em] [&_label]:text-bubble-ink/65';
export const productLabel = 'mb-1 mt-2.5 block font-sans text-[.62rem] font-bold uppercase tracking-[.1em] text-bubble-ink/55';
export const productInput = 'w-full rounded-sm border border-bubble-line bg-bubble-cream px-[11px] py-[9px] text-[.82rem] text-bubble-ink focus:bg-bubble-white focus:outline focus:outline-2 focus:outline-bubble-ink';

export function stockBadge(kind: 'ok' | 'low' | 'out') {
  const tone = kind === 'ok'
    ? 'bg-bubble-success/10 text-bubble-success'
    : kind === 'low'
      ? 'bg-bubble-candy/20 text-bubble-brown'
      : 'bg-bubble-danger/10 text-bubble-danger';

  return `inline-block px-2 py-[3px] font-sans text-[.62rem] font-bold uppercase tracking-[.08em] ${tone}`;
}
