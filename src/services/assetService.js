import { fetchBrapiAssetData } from './brapiService';
import { CRYPTO_SYMBOLS } from '../utils/cryptoUtils';

const getStorageKey = (keyName) => {
  try {
    return localStorage.getItem(keyName) || '';
  } catch {
    return '';
  }
};

export const sanitizeTicker = (ticker) => String(ticker || '')
  .trim()
  .toUpperCase()
  .replace(/\.(US|SA|L|O|N|TO|LON|DE|F|PA)$/i, '')
  .replace(/:.*$/, '')
  .replace(/[^A-Z0-9.-]/g, '');

export const normalizeYahooTicker = (ticker) => sanitizeTicker(ticker)
  .replace(/\./g, '-')
  .replace(/-+/g, '-');

export const isForeignAsset = (type) => {
  const normalizedType = String(type || '').toLowerCase();
  return normalizedType.includes('eua')
    || normalizedType.includes('internacional')
    || normalizedType.includes('reit')
    || normalizedType.includes('etf internacional')
    || normalizedType.includes('global');
};

const CACHE_DURATION = 60 * 60 * 1000;
let cachedRates = null;
let cacheTimestamp = 0;

const EMPTY_MARKET_DATA = {
  dividendYield: null,
  pL: null,
  pVp: null,
  roe: null,
  lpa: null,
  vpa: null,
  growthRate: null,
  roic: null,
  divEbitda: null
};

export const fetchExchangeRates = async () => {
  const now = Date.now();

  if (cachedRates && now - cacheTimestamp < CACHE_DURATION) {
    return cachedRates;
  }

  try {
    const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,GBP-BRL,CAD-BRL');
    if (!response.ok) throw new Error(`AwesomeAPI HTTP ${response.status}`);

    const data = await response.json();
    cachedRates = {
      usd: data.USDBRL ? Number(data.USDBRL.bid) : null,
      eur: data.EURBRL ? Number(data.EURBRL.bid) : null,
      gbp: data.GBPBRL ? Number(data.GBPBRL.bid) : null,
      cad: data.CADBRL ? Number(data.CADBRL.bid) : null
    };
    cacheTimestamp = now;

    return cachedRates;
  } catch (error) {
    console.warn('Exchange rate lookup failed; using the previous cache when available.', error);
    return cachedRates || { usd: null, eur: null, gbp: null, cad: null };
  }
};

export const fetchCoinGeckoData = async (ticker) => {
  try {
    const cleanTicker = String(ticker || '')
      .toUpperCase()
      .replace('/BRL', '')
      .replace('-BRL', '')
      .replace('/', '')
      .replace('-', '')
      .trim();

    const mapping = {
      BTC: 'bitcoin',
      ETH: 'ethereum',
      SOL: 'solana',
      ADA: 'cardano',
      DOGE: 'dogecoin',
      XRP: 'ripple',
      LTC: 'litecoin',
      USDT: 'tether',
      BNB: 'binancecoin',
      DOT: 'polkadot',
      MATIC: 'polygon-ecosystem-token',
      AVAX: 'avalanche-2',
      LINK: 'chainlink',
      UNI: 'uniswap',
      ATOM: 'cosmos',
      XLM: 'stellar',
      ALGO: 'algorand',
      VET: 'vechain'
    };

    const coinId = mapping[cleanTicker];
    if (!coinId) {
      throw new Error(`CoinGecko: Sigla ${cleanTicker} não mapeada no sistema.`);
    }

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coinId)}&vs_currencies=brl`;
    const apiKey = getStorageKey('goes_compra_certa_coingecko_api_key');
    const headers = { Accept: 'application/json' };

    if (apiKey) {
      headers['x-cg-demo-api-key'] = apiKey;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`CoinGecko HTTP ${response.status}`);

    const data = await response.json();
    const price = data[coinId]?.brl;
    if (price == null) {
      throw new Error('CoinGecko: cotação em BRL não encontrada para o ativo');
    }

    return { price: Number(price), ...EMPTY_MARKET_DATA };
  } catch (error) {
    console.error('CoinGecko error:', error);
    throw error;
  }
};

export const fetchYahooData = async (ticker, currency = 'USD') => {
  const symbol = normalizeYahooTicker(ticker);

  if (!symbol) {
    const message = '[Yahoo Finance] Ticker vazio após sanitização.';
    console.warn(message);
    throw new Error(message);
  }

  try {
    const response = await fetch(`/api/yahoo?symbol=${encodeURIComponent(symbol)}`, {
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      let details = null;
      try {
        details = await response.json();
      } catch {
        // The proxy may return an empty body for upstream failures.
      }

      if (response.status === 404) {
        throw new Error(`Yahoo Finance: ticker ${symbol} não encontrado.`);
      }

      throw new Error(details?.error || `Yahoo Finance HTTP ${response.status}`);
    }

    const data = await response.json();
    const originalPrice = Number(data?.price);
    if (!Number.isFinite(originalPrice) || originalPrice <= 0) {
      const message = `Yahoo Finance: resposta sem cotação válida para ${symbol}.`;
      console.warn(message, data);
      throw new Error(message);
    }

    let priceBrl = originalPrice;

    if (currency && currency.toUpperCase() !== 'BRL') {
      const rates = await fetchExchangeRates();
      const rate = rates[currency.toLowerCase()];

      if (Number.isFinite(rate) && rate > 0) {
        priceBrl = originalPrice * rate;
      } else {
        const message = `Yahoo Finance: câmbio não encontrado para ${currency}.`;
        console.warn(message);
        throw new Error(message);
      }
    }

    if (!Number.isFinite(priceBrl) || priceBrl <= 0) {
      const message = `Yahoo Finance: preço inválido para ${symbol}.`;
      console.warn(message);
      throw new Error(message);
    }

    if (priceBrl < 0.01 || priceBrl > 10000000) {
      console.warn(`Suspicious price detected for ${ticker}: BRL ${priceBrl.toFixed(2)}`);
    }

    return {
      price: priceBrl,
      priceOriginal: originalPrice,
      priceCurrency: currency.toUpperCase(),
      ...EMPTY_MARKET_DATA
    };
  } catch (error) {
    console.error('Yahoo Finance error:', error);
    throw error;
  }
};

export const fetchAssetData = async (asset) => {
  if (!asset?.ticker) {
    throw new Error('Ativo sem ticker definido');
  }

  const type = String(asset.type || asset.tipo || '').toLowerCase();
  const ticker = sanitizeTicker(asset.ticker);
  const tickerBase = ticker.split('-')[0].split('/')[0].trim();

  if (type.includes('cripto') || CRYPTO_SYMBOLS.includes(tickerBase)) {
    return fetchCoinGeckoData(asset.ticker);
  }

  if (
    type.includes('eua') ||
    type.includes('internacional') ||
    type.includes('reit') ||
    type.includes('ações americanas') ||
    type.includes('ações internacionais') ||
    type.includes('stocks') ||
    type.includes('etf internacional') ||
    type.includes('exterior') ||
    type.includes('global')
  ) {
    return fetchYahooData(ticker, asset.moeda || 'USD');
  }

  return fetchBrapiAssetData(asset.ticker);
};
