export const FREE_SHIPPING_MINIMUM = Math.max(
  0,
  Number(process.env.NEXT_PUBLIC_FREE_SHIPPING_MINIMUM) || 199,
);
