const MULTIPLIERS = {
  k: 1_000,
  m: 1_000_000,
  b: 1_000_000_000,
  t: 1_000_000_000_000
};

export const parseNumberWithMultiplier = (value) => {
  if (value === undefined || value === null || String(value).trim() === '') return null;

  let normalized = String(value).trim().replace(/\s/g, '').replace(/%$/, '');
  const suffix = normalized.slice(-1).toLowerCase();
  const multiplier = MULTIPLIERS[suffix] || 1;
  if (multiplier !== 1) normalized = normalized.slice(0, -1);

  const brazilianNumber = normalized.includes(',')
    ? normalized.replace(/\./g, '').replace(',', '.')
    : /^0\.\d+$/.test(normalized)
      ? normalized
      : /^\d{1,3}(\.\d{3})+$/.test(normalized)
        ? normalized.replace(/\./g, '')
        : normalized;
  const number = Number(brazilianNumber) * multiplier;

  return Number.isFinite(number) ? number : null;
};
