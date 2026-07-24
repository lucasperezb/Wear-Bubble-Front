export function formatPersonName(value: string, maxLength = 150) {
  return value
    .replace(/[^\p{L}\s.'-]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, maxLength);
}

export function formatEmail(value: string, maxLength = 255) {
  return value
    .toLowerCase()
    .replace(/\s/g, '')
    .replace(/[^a-z0-9.!#$%&'*+/=?^_`{|}~@-]/g, '')
    .slice(0, maxLength);
}

export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : '';
  if (digits.length <= 6)
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function formatCpf(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

export function formatAddressText(value: string, maxLength: number) {
  return value
    .replace(/[^\p{L}\p{N}\s.,ºª°'()&/-]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, maxLength);
}

export function formatHouseNumber(value: string) {
  return value
    .replace(/[^\p{L}\p{N}\s/-]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, 30);
}

export function formatState(value: string) {
  return value
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 2);
}

export function formatCoupon(value: string) {
  return value
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .toUpperCase()
    .slice(0, 30);
}
