// Lista centralizada de símbolos de criptomoedas.
export const CRYPTO_SYMBOLS = [
  'BTC', 'ETH', 'SOL', 'ADA', 'DOGE', 'XRP', 'LTC', 'USDT',
  'BNB', 'DOT', 'MATIC', 'AVAX', 'LINK', 'UNI', 'ATOM',
  'XLM', 'ALGO', 'VET'
];

export const isCrypto = (type, ticker) => {
  const normalizedType = String(type || '').toLowerCase();
  const normalizedTicker = String(ticker || '').toUpperCase();
  const tickerBase = normalizedTicker.split('-')[0].split('/')[0].trim();

  return normalizedType.includes('cripto')
    || normalizedType.includes('crypto')
    || CRYPTO_SYMBOLS.includes(tickerBase);
};
