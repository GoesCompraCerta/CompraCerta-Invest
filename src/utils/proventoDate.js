const formatDate = (year, month, day) => {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day) {
    return '';
  }

  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const toDateInputValue = (value) => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? ''
      : value.toISOString().split('T')[0];
  }

  const dateString = String(value ?? '').trim();
  if (!dateString) return '';

  const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|[T ])/);
  if (isoMatch) {
    return formatDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
  }

  const brazilianMatch = dateString.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brazilianMatch) {
    return formatDate(
      Number(brazilianMatch[3]),
      Number(brazilianMatch[2]),
      Number(brazilianMatch[1])
    );
  }

  if (/^-?\d+$/.test(dateString)) {
    const timestamp = Number(dateString);
    const milliseconds = Math.abs(timestamp) < 1e12 ? timestamp * 1000 : timestamp;
    const date = new Date(milliseconds);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
  }

  return '';
};

export const toDateDisplayValue = (value) => {
  const isoDate = toDateInputValue(value);
  if (!isoDate) return '';

  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
};

export const toStoredDate = (value) => {
  const dateString = String(value ?? '').trim();
  const brazilianMatch = dateString.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brazilianMatch) {
    return toDateInputValue(dateString);
  }

  const isoMatch = dateString.match(/^\d{4}-\d{2}-\d{2}$/);
  return isoMatch ? toDateInputValue(dateString) : '';
};
