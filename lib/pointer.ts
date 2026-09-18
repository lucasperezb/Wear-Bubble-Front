/**
 * Efeitos de mouse (parallax, zoom seguindo o cursor) só fazem sentido com
 * ponteiro fino e hover. No toque eles disparam por engano e gastam CPU.
 */
export function hasFinePointer() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}
