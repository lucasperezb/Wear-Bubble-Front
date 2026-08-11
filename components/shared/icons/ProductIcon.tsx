type ProductIconProps = {
  icon?: string;
};

export function ProductIcon({ icon }: ProductIconProps) {
  if (icon === 'top' || icon === 'regata') {
    return (
      <svg viewBox="0 0 120 140" fill="none" aria-hidden="true">
        <path d="M38 12h44l12 28-14 8v72H40V48l-14-8 12-28Z" fill="currentColor" opacity=".9" />
        <path d="M48 14c3 15 21 15 24 0" stroke="#F3EDDD" strokeWidth="5" />
      </svg>
    );
  }
  if (icon === 'shorts') {
    return (
      <svg viewBox="0 0 120 140" fill="none" aria-hidden="true">
        <path d="M28 34h64l10 68H68l-8-34-8 34H18l10-68Z" fill="currentColor" opacity=".9" />
        <path d="M31 34h58" stroke="#F3EDDD" strokeWidth="7" />
      </svg>
    );
  }
  if (icon === 'jacket') {
    return (
      <svg viewBox="0 0 120 140" fill="none" aria-hidden="true">
        <path d="M38 14h44l26 34-18 17-8-10v67H38V55l-8 10-18-17 26-34Z" fill="currentColor" opacity=".9" />
        <path d="M60 18v102" stroke="#F3EDDD" strokeWidth="5" />
      </svg>
    );
  }
  if (icon === 'sock') {
    return (
      <svg viewBox="0 0 120 140" fill="none" aria-hidden="true">
        <path d="M44 16h34v68c0 23-20 38-43 32-10-3-18-10-20-19l32-11c5 11 18 6 18-5V16Z" fill="currentColor" opacity=".9" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 140" fill="none" aria-hidden="true">
      <path d="M34 16h52l8 107H67l-7-67-7 67H26L34 16Z" fill="currentColor" opacity=".9" />
      <path d="M36 17h48" stroke="#F3EDDD" strokeWidth="7" />
    </svg>
  );
}
