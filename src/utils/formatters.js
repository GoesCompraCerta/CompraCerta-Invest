// Format values as Brazilian currency
export const formatMoney = (value, privacyMode = false) => {
  if (privacyMode) return 'R$ ••••••';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
};

// Format date to DD/MM/YYYY
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
};

// Parse CSV friendly format
export const parseCSVValue = (val) => {
  if (typeof val !== 'string') return val;
  return val.replace(',', '.');
};
